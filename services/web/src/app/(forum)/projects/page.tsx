import ProjectsGridPage from '@/features/forum/ui/wesley_projects/ProjectsGridPage'
import {
  getAllProjects,
  getMySubscribedProjects,
  searchProjects,
} from '@/features/forum/api/project'

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

  const [projectsResult, subscribedProjectsResult] = await Promise.allSettled([
    searchQuery.length >= 2 ? searchProjects(searchQuery) : getAllProjects(),
    getMySubscribedProjects(),
  ]);

  const projects = projectsResult.status === 'fulfilled' ? projectsResult.value : [];
  const subscribedProjects =
    subscribedProjectsResult.status === 'fulfilled' ? subscribedProjectsResult.value : [];

  return (
    <ProjectsGridPage
      projects={projects}
      subscribedProjectIds={subscribedProjects.map((project) => project.id)}
      initialSearch={searchQuery}
    />
  )
}