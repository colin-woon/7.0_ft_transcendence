import ProjectsGridPage from '@/features/forum/ui/wesley_projects/ProjectsGridPage'
import { getAllProjects } from '@/features/forum/api/project'

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return <ProjectsGridPage projects={projects} />
}