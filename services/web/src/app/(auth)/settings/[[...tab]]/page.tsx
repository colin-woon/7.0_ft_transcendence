import {
  getServerCurrentUser,
  getServerSessions,
} from "@/features/auth/api/serverAuthData";
import SettingsPage from "@/features/auth/ui/settings/SettingsPage";

export const dynamic = "force-dynamic";

interface SettingsRouteProps {
  params: Promise<{ tab?: string[] }>;
}

export default async function SettingsRoute(_props: SettingsRouteProps) {
  const [profileResult, sessionsResult] = await Promise.all([
    getServerCurrentUser(),
    getServerSessions(),
  ]);

  const initialProfile = profileResult.ok ? profileResult.data : null;
  const initialProfileErrorStatus =
    profileResult.ok || profileResult.status === 401
      ? null
      : profileResult.status;
  const initialProfileError = initialProfileErrorStatus
    ? profileResult.error
    : null;

  return (
    <SettingsPage
      initialProfile={initialProfile}
      initialProfileError={initialProfileError}
      initialProfileErrorStatus={initialProfileErrorStatus}
      initialSessions={
        sessionsResult.ok && sessionsResult.data
          ? sessionsResult.data
          : undefined
      }
    />
  );
}
