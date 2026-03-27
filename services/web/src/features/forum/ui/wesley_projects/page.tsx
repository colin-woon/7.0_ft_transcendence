import ProjectsPage from "./ProjectsGridPage";
import { getAllProjects } from "../../api/project";

export default async function ProjectsRoute() {
  const projects = await getAllProjects();

  return <ProjectsPage projects={projects} />;
}