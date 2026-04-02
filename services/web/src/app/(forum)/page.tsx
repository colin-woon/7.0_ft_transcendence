import ProjectsGridPage from '@/features/forum/ui/wesley_projects/ProjectsGridPage'
import { getAllProjects, searchProjects } from '@/features/forum/api/project'

interface HomeRouteProps {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
}

export default async function HomePage({ searchParams }: HomeRouteProps) {
  const params = searchParams ? await searchParams : undefined;
  const qRaw = params?.q;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const searchQuery = (q ?? '').trim();

  const projects = searchQuery.length >= 2
    ? await searchProjects(searchQuery)
    : await getAllProjects();

  return <ProjectsGridPage projects={projects} initialSearch={searchQuery} />
}
  