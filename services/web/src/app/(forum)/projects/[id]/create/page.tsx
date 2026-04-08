import CreatePage from '@/features/forum/ui_temp_ryan/create/CreatePage'
import { getProjectDetails } from '@/features/forum/api/project'
import { notFound } from 'next/navigation'

interface ProjectCreatePageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectCreatePage({ params }: ProjectCreatePageProps) {
  const { id } = await params
  const projectId = parseInt(id, 10)

  if (isNaN(projectId)) {
    return notFound()
  }

  const project = await getProjectDetails(projectId)
  if (!project) {
    return notFound()
  }

  return <CreatePage projectId={project.id} projectName={project.name} />
}
