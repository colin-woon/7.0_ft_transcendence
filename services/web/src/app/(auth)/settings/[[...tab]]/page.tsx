import {
  getServerCurrentUser,
  getServerSessions,
} from "@/features/auth/api/serverAuthData";
import SettingsPage from "@/features/auth/ui/settings/SettingsPage";
import {
  getAuthRedirectMessage,
  isValidAuthRedirectToken,
} from "@/features/auth/utils/redirectMessage";

export const dynamic = "force-dynamic";

interface SettingsRouteProps {
  params: Promise<{ tab?: string[] }>;
  searchParams: Promise<{ error?: string | string[]; success?: string | string[] }>;
}

function extractErrorParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => entry && entry.trim());
    return first ? first.trim() : null;
  }
  return null;
}

function normalizeRouteMessage(value: string | null, isError: boolean) {
  if (!value) {
    return { routeMessage: null, isRouteMessageError: false };
  }

  if (!isValidAuthRedirectToken(value)) {
    return {
      routeMessage: isError ? 'Something went wrong. Please try again.' : null,
      isRouteMessageError: isError,
    };
  }

  return {
    routeMessage: getAuthRedirectMessage(value),
    isRouteMessageError: isError,
  };
}

export default async function SettingsRoute({ searchParams }: SettingsRouteProps) {
  const [profileResult, sessionsResult] = await Promise.all([
    getServerCurrentUser(),
    getServerSessions(),
  ]);
  const params = await searchParams;
  const routeError = extractErrorParam(params.error);
  const routeSuccess = extractErrorParam(params.success);
  const normalizedRouteError = normalizeRouteMessage(routeError, true);
  const normalizedRouteSuccess = normalizeRouteMessage(routeSuccess, false);
  const routeMessage = normalizedRouteError.routeMessage || normalizedRouteSuccess.routeMessage;
  const isError = normalizedRouteError.routeMessage != null;

  const shouldExposeInitialProfileError =
    !profileResult.ok &&
    profileResult.status !== 401 &&
    profileResult.status < 500;

  const initialProfile = profileResult.ok ? profileResult.data : null;
  const initialProfileErrorStatus = shouldExposeInitialProfileError
    ? profileResult.status
    : null;
  const initialProfileError = shouldExposeInitialProfileError
    ? profileResult.error
    : null;

  return (
    <SettingsPage
      initialProfile={initialProfile}
      initialProfileError={initialProfileError}
      initialProfileErrorStatus={initialProfileErrorStatus}
      routeMessage={routeMessage}
      isRouteMessageError={isError}
      initialSessions={
        sessionsResult.ok && sessionsResult.data
          ? sessionsResult.data
          : undefined
      }
    />
  );
}
