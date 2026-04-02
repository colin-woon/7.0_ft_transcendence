import ProjectForumPage from '@/features/forum/ui/wesley_projects/ProjectForumPage'
import { getProjectDetailsBySort } from '@/features/forum/api/project';
import type { ForumSort } from '@/features/forum/models';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    sort?: string | string[];
  }>;
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const projectId = parseInt(id, 10);
  const sortRaw = resolvedSearchParams?.sort;
  const sortParam = Array.isArray(sortRaw) ? sortRaw[0] : sortRaw;
  const activeSort: ForumSort = sortParam === 'New' ? 'New' : 'Top';
  
  if (isNaN(projectId))
    return notFound();

  const project = await getProjectDetailsBySort(projectId, activeSort);
  if (!project)
    return notFound();

  return <ProjectForumPage project={project} />
}
