import { cookies } from 'next/headers';
import type { ForumApiPostSummary, ForumApiProjectSummary, ForumPost, ForumApiPostDetail, ForumPostDetail, ForumApiComment, ForumComment } from '../models';
import type { Project, ForumPost as ProjectForumPost } from '../models/projects';
import type { ForumSort } from '../models';
import { cache } from 'react'

function getForumApiBaseUrl(): string {
  const isDev = process.env.NODE_ENV === 'development';
  const devGateway = process.env.DEV_GATEWAY_URL?.trim() || 'http://gateway-service:8080';

  let raw =
    process.env.GATEWAY_URL?.trim() ||
    process.env.NEXT_PUBLIC_GATEWAY_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    'http://localhost:8001';

  // In Docker dev, gateway serves HTTP on 8080 while production uses HTTPS 8443.
  if (isDev && raw === 'https://gateway-service:8443') {
    raw = devGateway;
  }

  const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  return `${normalized}/api/forum`;
}

async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');
}

async function forumFetch(path: string, init: RequestInit): Promise<Response> {
  const cookieHeader = await getCookieHeader();
  const headers = new Headers(init.headers);

  if (cookieHeader && !headers.has('Cookie')) {
    headers.set('Cookie', cookieHeader);
  }

  return fetch(`${getForumApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });
}
export interface ForumApiProjectListPage {
  items: ForumApiProjectSummary[];
  total_pages: number;
}

export function toRelativeTime(isoDate: string) {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function mapApiPostToForumPost(post: ForumApiPostSummary, projectName?: string): ForumPost {
  return {
    id: post.id,
    title: post.title,
    author: `user_${post.author_id}`,
    authorId: post.author_id,
    avatar: '',
    comments: post.comment_count,
    views: post.view_count,
    upvotes: post.vote_score,
    category: projectName ?? `Project ${post.project_id}`,
    timestamp: toRelativeTime(post.created_at),
    isPinned: false,
  };
}

function calculateDifficulty(difficultyOrXp?: number | string): "Beginner" | "Intermediate" | "Advanced" {
  if (typeof difficultyOrXp === 'string') {
    const normalized = difficultyOrXp.trim().toLowerCase();
    if (normalized === 'beginner') return 'Beginner';
    if (normalized === 'intermediate') return 'Intermediate';
    if (normalized === 'advanced' || normalized === 'expert') return 'Advanced';
  }

  if (!difficultyOrXp)
    return "Beginner";

  let numericXp: number;
  if (typeof difficultyOrXp === 'string') {
    numericXp = parseFloat(difficultyOrXp);
  } else {
    numericXp = difficultyOrXp;
  }

  if (isNaN(numericXp))
    return "Beginner";

  if (numericXp <= 2000)
    return "Beginner";
  if (numericXp <= 10000)
    return "Intermediate";
  
  return "Advanced";
}

function getTeamSize(soloStr: boolean): "Solo" | "Team"{
  if (soloStr)
    return "Solo";
  return "Team";
}

function mapApiProjectToProject(apiProj: any): Project {
  const projectXp = typeof apiProj.xp === 'number' ? apiProj.xp : Number.parseInt(String(apiProj.xp ?? 0), 10) || 0;

  return {
    id: apiProj.id,
    name: apiProj.name,
    slug: apiProj.slug || apiProj.name.toLowerCase().replace(/\s+/g, '-'),
    description: apiProj.description || 'No description provided for this project.',
    // icon: apiProj.icon || "📚",
    difficulty: calculateDifficulty(apiProj.difficulty || projectXp),
    xp: projectXp,
    duration: apiProj.estimate_time || "~1 week",
    teamSize: getTeamSize(Boolean(apiProj.solo)),
    tags: apiProj.objectives || ["42"],
    students: apiProj.students || 0,
    color: apiProj.color || "from-blue-400 to-blue-600",
    posts: apiProj.posts || [],
  };
}


// base function to fetch all projects from API, utilizes Next.js cache
export const getCachedApiProjects = cache(async (): Promise<ForumApiProjectSummary[]> => {
  const pageSize = 100;
  let allApiProjects: ForumApiProjectSummary[] = [];

  const firstPageRes = await forumFetch(`/projects?page=1&page_size=${pageSize}`, {
    cache: 'force-cache',
    next: {
      revalidate: 300, //secs
      tags: ['projects'] // TODO: utilize tag for on-demand invalidation in future
    },
  });

  if (!firstPageRes.ok) {
    throw new Error(`Failed to fetch projects: ${firstPageRes.statusText}`);
  }

  const firstPageData = (await firstPageRes.json()) as ForumApiProjectListPage;
  allApiProjects = [...firstPageData.items];

  const totalPages = firstPageData.total_pages || 1;

  if (totalPages > 1) {
    const pagesToFetch = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

    const responses = await Promise.all(
      pagesToFetch.map((page) =>
        forumFetch(`/projects?page=${page}&page_size=${pageSize}`, {
            cache: 'force-cache',
            next:{
                revalidate: 300,
                tags: ['projects']
            },
        })
      )
    );

    const results = await Promise.all(
      responses.map((res) => {
        if (!res.ok) throw new Error('Failed to fetch a project page');
        return res.json() as Promise<ForumApiProjectListPage>;
      })
    );

    results.forEach((data) => {
      allApiProjects.push(...data.items);
    });
  }

  return allApiProjects;
});

export async function getAllProjects(): Promise<Project[]> {
  const apiProjects = await getCachedApiProjects();

  return apiProjects.map(mapApiProjectToProject);
}

export async function searchProjects(searchQuery: string): Promise<Project[]> {
  const trimmedQuery = searchQuery.trim();

  if (trimmedQuery.length < 2) {
    return getAllProjects();
  }

  const response = await forumFetch(
    `/search/projects?search_query=${encodeURIComponent(trimmedQuery)}`,
    {
      method: 'GET',
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search projects.');
  }

  const projectsData = (await response.json()) as any[];
  return projectsData.map(mapApiProjectToProject);
}

export async function getMySubscribedProjects(): Promise<Project[]> {
  const response = await forumFetch('/projects/me/subscriptions', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch subscribed projects.');
  }

  const projectsData = (await response.json()) as any[];
  return projectsData.map(mapApiProjectToProject);
}

export async function searchMySubscribedProjects(searchQuery: string): Promise<Project[]> {
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const subscribedProjects = await getMySubscribedProjects();

  if (trimmedQuery.length < 2) {
    return subscribedProjects;
  }

  return subscribedProjects.filter((project) => {
    const nameMatch = project.name.toLowerCase().includes(trimmedQuery);
    const slugMatch = project.slug.toLowerCase().includes(trimmedQuery);
    const descMatch = project.description.toLowerCase().includes(trimmedQuery);
    return nameMatch || slugMatch || descMatch;
  });
}

// fetches all projects and maps them id:name, utilizes nextjs cache
export const getProjectsByIdMap = cache(async (): Promise<Map<number, string>> => {
  const apiProjects = await getCachedApiProjects();
  const projectsById = new Map<number, string>();
  
  apiProjects.forEach((p) => projectsById.set(p.id, p.name));
  return projectsById;
});

export async function getProjectPosts(projectId: number): Promise<ForumPost[]> {
  return getProjectPostsBySort(projectId, 'Top');
}

export async function getProjectPostsBySort(projectId: number, sort: ForumSort): Promise<ForumPost[]> {
  const postsPath = sort === 'New'
    ? `/projects/${projectId}/posts/new`
    : `/projects/${projectId}/posts/top`;

  const [postsResponse, projectResponse] = await Promise.all([
    forumFetch(postsPath, {
      method: 'GET',
      cache: 'no-store',
    }),
    forumFetch(`/projects/${projectId}`, {
      method: 'GET',
      cache: 'no-store',
    }),
  ]);

  if (!postsResponse.ok) {
    throw new Error(`Failed to fetch posts for project ${projectId}`);
  }

  if (!projectResponse.ok) {
    throw new Error(`Failed to fetch project details for project ${projectId}`);
  }

  const [postsData, projectData] = (await Promise.all([
    postsResponse.json(),
    projectResponse.json(),
  ])) as [ForumApiPostSummary[], ForumApiProjectSummary];

  return postsData.map((post) => mapApiPostToForumPost(post, projectData.name));
}

export async function getProjectDetails(projectId: number): Promise<Project | undefined> {
  return getProjectDetailsBySort(projectId, 'Top');
}

export async function getProjectDetailsBySort(projectId: number, sort: ForumSort): Promise<Project | undefined> {
  const allProjects = await getAllProjects();
  const project = allProjects.find((p) => p.id === projectId);
  
  if (!project) return undefined;

  try {
    const posts = (await getProjectPostsBySort(projectId, sort)).map((post): ProjectForumPost => ({
      id: post.id,
      title: post.title,
      author: post.author,
      authorId: post.authorId,
      avatar: post.avatar,
      replies: post.comments,
      views: post.views,
      upvotes: post.upvotes,
      category: post.category,
      timestamp: post.timestamp,
      preview: '',
      isHot: false,
      isPinned: post.isPinned,
    }));
    return { ...project, posts };
  } catch (err) {
    console.error(`Failed to fetch posts for project ${projectId}`, err);
    return { ...project, posts: [] };
  }
}
