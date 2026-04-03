import ProjectsGridPage from '@/features/forum/ui/wesley_projects/ProjectsGridPage'
import {
  getAllProjects,
  getMySubscribedProjects,
  searchProjects,
} from '@/features/forum/api/project'

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

  const [projects, subscribedProjects] = await Promise.all([
    searchQuery.length >= 2 ? searchProjects(searchQuery) : getAllProjects(),
    getMySubscribedProjects(),
  ]);

  return (
    <ProjectsGridPage
      projects={projects}
      subscribedProjectIds={subscribedProjects.map((project) => project.id)}
      initialSearch={searchQuery}
    />
  )
}
  