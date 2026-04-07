import ProjectsPage from "./ProjectsGridPage";
import {
  getAllProjects,
  getMySubscribedProjects,
  searchProjects,
} from "../../api/project";

interface ProjectsRouteProps {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
}

export default async function ProjectsRoute({ searchParams }: ProjectsRouteProps) {
  const params = searchParams ? await searchParams : undefined;
  const qRaw = params?.q;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const searchQuery = (q ?? '').trim();

  const [projects, subscribedProjects] = await Promise.all([
    searchQuery.length >= 2 ? searchProjects(searchQuery) : getAllProjects(),
    getMySubscribedProjects(),
  ]);

  return (
    <ProjectsPage
      projects={projects}
      subscribedProjectIds={subscribedProjects.map((project) => project.id)}
      initialSearch={searchQuery}
    />
  );
}