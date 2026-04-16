"use server";

import { cookies } from "next/headers";
import { serverMtlsFetch } from "../../../lib/serverMtlsFetch";

type ForumFetchInit = RequestInit;

function getForumApiBaseUrl(): string {
  const isDev = process.env.NODE_ENV === "development";
  const devGateway =
    process.env.DEV_GATEWAY_URL?.trim() || "http://gateway-service:8080";

  let raw =
    process.env.GATEWAY_URL?.trim() ||
    process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:8001";

  // In Docker dev, gateway serves HTTP on 8080 while production uses HTTPS 8443.
  if (isDev && raw === "https://gateway-service:8443") {
    raw = devGateway;
  }

  const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  return `${normalized}/api/forum`;
}

async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

export async function forumServerFetch(
  path: string,
  init: ForumFetchInit,
): Promise<Response> {
  const cookieHeader = await getCookieHeader();
  const headers = new Headers(init.headers);

  if (cookieHeader && !headers.has("Cookie")) {
    headers.set("Cookie", cookieHeader);
  }

  return serverMtlsFetch(`${getForumApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });
}

export async function forumServerFetchPublic(
  path: string,
  init: ForumFetchInit,
): Promise<Response> {
  return serverMtlsFetch(`${getForumApiBaseUrl()}${path}`, {
    ...init,
  });
}
