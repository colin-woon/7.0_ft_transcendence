// import ProjectsGridPage from '@/features/forum/ui/projects/ProjectsGridPage'
import ProjectsGridPage from "@/features/forum/ui/projects/screen/ProjectsListScreen";
import { getAllProjects, searchProjects } from "@/features/forum/api/project";

interface ProjectsRouteProps {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsRouteProps) {
  const params = searchParams ? await searchParams : undefined;
  const qRaw = params?.q;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const searchQuery = (q ?? "").trim();

  const projectsResult = await Promise.allSettled([
    searchQuery.length >= 2 ? searchProjects(searchQuery) : getAllProjects(),
  ]);

  const projects =
    projectsResult[0].status === "fulfilled" ? projectsResult[0].value : [];

  return (
    <ProjectsGridPage
      projects={projects}
      subscribedProjectIds={[]}
      initialSearch={searchQuery}
    />
  );
}
