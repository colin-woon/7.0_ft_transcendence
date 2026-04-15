import UsersSearchPage from "@/features/auth/ui/search/UsersSearchPage";

interface UsersRouteProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export const dynamic = "force-dynamic";

export default async function UsersRoute({ searchParams }: UsersRouteProps) {
  const params = await searchParams;
  const initialQuery = Array.isArray(params.q)
    ? (params.q[0] ?? "")
    : (params.q ?? "");

  return <UsersSearchPage initialQuery={initialQuery} />;
}
