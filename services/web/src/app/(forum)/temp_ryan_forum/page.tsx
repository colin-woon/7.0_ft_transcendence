import ProjectsGridPage from '@/features/forum/ui_temp_ryan/projects/ProjectsGridPage'
import { getAllProjects, searchProjects } from '@/features/forum/api/project'

interface ProjectsRouteProps {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsRouteProps) {
  const params = searchParams ? await searchParams : undefined;
  const qRaw = params?.q;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const searchQuery = (q ?? '').trim();

  const projects = searchQuery.length >= 2
    ? await searchProjects(searchQuery)
    : await getAllProjects();

  return <ProjectsGridPage projects={projects} initialSearch={searchQuery} />
}