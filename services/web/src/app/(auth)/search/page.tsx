import UsersSearchPage from "@/features/auth/ui/search/UsersSearchPage";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const initialQuery = params.q ?? "";

  return <UsersSearchPage initialQuery={initialQuery} />;
}
