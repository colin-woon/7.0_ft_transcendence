import ProjectsPage from "./ProjectsGridPage";
import { getAllProjects, searchProjects } from "../../api/project";

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

  const projects = searchQuery.length >= 2
    ? await searchProjects(searchQuery)
    : await getAllProjects();

  return <ProjectsPage projects={projects} initialSearch={searchQuery} />;
}