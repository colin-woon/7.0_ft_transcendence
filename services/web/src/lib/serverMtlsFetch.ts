import "server-only";

import { existsSync, readFileSync } from "fs";
import { request as httpsRequest } from "https";

type TlsMaterial = {
  key: Buffer;
  cert: Buffer;
  ca: Buffer;
};

let cachedTlsMaterial: TlsMaterial | null | undefined;

function resolvePath(envValue: string | undefined, fallback: string): string {
  const trimmed = envValue?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function getTlsMaterial(): TlsMaterial | null {
  if (cachedTlsMaterial !== undefined) {
    return cachedTlsMaterial;
  }

  const keyPath = resolvePath(process.env.MTLS_KEY_PATH, "/certs/web.key");
  const certPath = resolvePath(process.env.MTLS_CRT_PATH, "/certs/web.crt");
  const caPath = resolvePath(
    process.env.MTLS_CA_PATH,
    "/certs/internal-ca.crt",
  );

  const hasAllFiles = [keyPath, certPath, caPath].every((path) =>
    existsSync(path),
  );

  if (!hasAllFiles) {
    if (process.env.NODE_ENV !== "production") {
      cachedTlsMaterial = null;
      return cachedTlsMaterial;
    }

    throw new Error(
      `mTLS credentials missing for server fetch (key=${keyPath}, cert=${certPath}, ca=${caPath})`,
    );
  }

  cachedTlsMaterial = {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath),
    ca: readFileSync(caPath),
  };

  return cachedTlsMaterial;
}

function toHeaderRecord(
  headersInit: HeadersInit | undefined,
  body: Buffer | undefined,
): Record<string, string> {
  const headers = new Headers(headersInit);

  if (body && !headers.has("content-length")) {
    headers.set("content-length", String(body.length));
  }

  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });

  return record;
}

async function toBuffer(
  body: BodyInit | null | undefined,
): Promise<Buffer | undefined> {
  if (body == null) {
    return undefined;
  }

  if (typeof body === "string") {
    return Buffer.from(body);
  }

  if (body instanceof URLSearchParams) {
    return Buffer.from(body.toString());
  }

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }

  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }

  if (body instanceof Blob) {
    const arrayBuffer = await body.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("Unsupported request body type for mTLS server fetch");
}

function isHttpsUrl(input: string): boolean {
  try {
    return new URL(input).protocol === "https:";
  } catch {
    return false;
  }
}

function toInputString(input: string | URL): string {
  return typeof input === "string" ? input : input.toString();
}

export async function serverMtlsFetch(
  input: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  const urlString = toInputString(input);

  if (!isHttpsUrl(urlString)) {
    return fetch(urlString, init);
  }

  const tls = getTlsMaterial();
  if (!tls) {
    return fetch(urlString, init);
  }

  const parsedUrl = new URL(urlString);
  const body = await toBuffer(init.body as BodyInit | null | undefined);
  const headers = toHeaderRecord(init.headers, body);
  const method = init.method ?? (body ? "POST" : "GET");

  return new Promise<Response>((resolve, reject) => {
    const request = httpsRequest(
      {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port ? Number(parsedUrl.port) : 443,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method,
        headers,
        key: tls.key,
        cert: tls.cert,
        ca: tls.ca,
        rejectUnauthorized: true,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          const responseHeaders = new Headers();
          Object.entries(response.headers).forEach(([name, value]) => {
            if (Array.isArray(value)) {
              responseHeaders.set(name, value.join(", "));
              return;
            }

            if (value !== undefined) {
              responseHeaders.set(name, String(value));
            }
          });

          resolve(
            new Response(Buffer.concat(chunks), {
              status: response.statusCode ?? 500,
              statusText: response.statusMessage ?? "",
              headers: responseHeaders,
            }),
          );
        });
      },
    );

    const abortHandler = () => {
      request.destroy(new Error("Request aborted"));
    };

    if (init.signal) {
      if (init.signal.aborted) {
        abortHandler();
        reject(new Error("Request aborted"));
        return;
      }

      init.signal.addEventListener("abort", abortHandler, { once: true });
    }

    request.on("error", (error) => {
      if (init.signal) {
        init.signal.removeEventListener("abort", abortHandler);
      }
      reject(error);
    });

    request.on("close", () => {
      if (init.signal) {
        init.signal.removeEventListener("abort", abortHandler);
      }
    });

    if (body && body.length > 0) {
      request.write(body);
    }

    request.end();
  });
}
