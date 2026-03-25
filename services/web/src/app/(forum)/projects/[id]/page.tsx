import ProjectForumPage from '@/features/forum/ui/temp_projects/ProjectForumPage'
import { getProjectDetails } from '@/features/forum/api/project';
import { notFound } from 'next/navigation';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id, 10);
  
  if (isNaN(projectId))
    return notFound();

  const project = await getProjectDetails(projectId);
  if (!project)
    return notFound();

  return <ProjectForumPage project={project} />
}
