import "server-only";

import { cookies } from "next/headers";
import { serverMtlsFetch } from "@/lib/serverMtlsFetch";

export interface ServerAuthUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  avatarImage: string | null;
  bio: string | null;
  role: "STUDENT" | "ADMIN";
  isBanned: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  linkedWithGoogle: boolean;
  linkedWithIntra: boolean;
  hasPassword: boolean;
  updatedAt?: string;
  intraInfo?: ServerIntraInfo | null;
}

export interface ServerIntraImage {
  link: string;
  versions: {
    large: string;
    medium: string;
    small: string;
  };
}

export interface ServerIntraInfo {
  url: string | null;
  phone: string | null;
  kind: string | null;
  image: ServerIntraImage | null;
  correctionPoints: number;
  poolMonth: string | null;
  poolYear: string | null;
  location: string | null;
  wallet: number;
  isAlumni: boolean;
  isActive: boolean;
  groups: Record<string, unknown>[];
  cursusUsers: Record<string, unknown>[];
  projectsUsers: Record<string, unknown>[];
  languagesUsers: Record<string, unknown>[];
  achievements: Record<string, unknown>[];
  titles: Record<string, unknown>[];
  titlesUsers: Record<string, unknown>[];
  partnerships: Record<string, unknown>[];
  patroned: Record<string, unknown>[];
  patroning: Record<string, unknown>[];
  expertisesUsers: Record<string, unknown>[];
  roles: Record<string, unknown>[];
  campus: Record<string, unknown>[];
  campusUsers: Record<string, unknown>[];
}

export interface ServerSessionInfo {
  sessionId: string;
  isCurrent: boolean;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  expiresAt: string;
  createdAt: string;
}

interface ServerFetchResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

function defaultErrorMessage(status: number): string {
  return status === 400
    ? "Bad request"
    : status === 401
      ? "Authentication required"
      : status === 403
        ? "Forbidden"
        : status === 404
          ? "Not found"
          : status === 409
            ? "Conflict"
            : status === 429
              ? "Too many requests"
              : status >= 500
                ? "Service unavailable"
                : `Request failed: ${status}`;
}

function getGatewayBaseUrl(): string {
  const raw = process.env.GATEWAY_URL?.trim() || "";
  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function buildAuthUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getGatewayBaseUrl()}/api/auth${normalizedPath}`;
}

async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

async function fetchAuthJson<T>(path: string): Promise<ServerFetchResult<T>> {
  const baseUrl = getGatewayBaseUrl();
  if (!baseUrl) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: "GATEWAY_URL is not configured",
    };
  }

  try {
    const cookieHeader = await getCookieHeader();
    const response = await serverMtlsFetch(buildAuthUrl(path), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    if (!response.ok) {
      const errorMessage = defaultErrorMessage(response.status);

      return {
        ok: false,
        status: response.status,
        data: null,
        error: errorMessage,
      };
    }

    const data = (await response.json()) as T;
    return {
      ok: true,
      status: response.status,
      data,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch auth data";
    return {
      ok: false,
      status: 500,
      data: null,
      error: message,
    };
  }
}

export async function getServerCurrentUser() {
  return fetchAuthJson<ServerAuthUser>("/me");
}

export async function getServerUserById(userId: number) {
  return fetchAuthJson<ServerAuthUser>(`/users/${userId}`);
}

export async function getServerSessions() {
  return fetchAuthJson<ServerSessionInfo[]>("/sessions");
}
