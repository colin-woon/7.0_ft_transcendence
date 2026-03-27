import type { ForumApiPostSummary, ForumApiProjectSummary, ForumPost, ForumApiPostDetail, ForumPostDetail, ForumApiComment, ForumComment } from '../models';
import type { Project, ForumPost as ProjectForumPost } from '../models/projects';
import type { ForumSort } from '../models';
import { cache } from 'react'

const FORUM_SERVICE_URL = 'http://forum-service:8080';
const API_BASE_URL = FORUM_SERVICE_URL;
//TODO: gateway-service:8080/api/forum/projects
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
    avatar: '',
    comments: post.comment_count,
    views: post.view_count,
    upvotes: post.vote_score,
    category: projectName ?? `Project ${post.project_id}`,
    timestamp: toRelativeTime(post.created_at),
    isPinned: false,
  };
}

function calculateDifficulty(difficultyXp?: number | string): "Beginner" | "Intermediate" | "Advanced" {
  if (!difficultyXp)
    return "Beginner";

  let numericXp: number;
  if (typeof difficultyXp === 'string') {
    numericXp = parseFloat(difficultyXp);
  } else {
    numericXp = difficultyXp;
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


// base function to fetch all projects from API, utilizes Next.js cache
export const getCachedApiProjects = cache(async (): Promise<ForumApiProjectSummary[]> => {
  const pageSize = 100;
  let allApiProjects: ForumApiProjectSummary[] = [];

  const firstPageRes = await fetch(
    `${API_BASE_URL}/projects?page=1&page_size=${pageSize}`,
    {
        cache: 'force-cache',
        next: { 
            revalidate: 300, //secs
            tags: ['projects'] // TODO: utilize tag for on-demand invalidation in future
      },
    }
  );

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
        fetch(`${API_BASE_URL}/projects?page=${page}&page_size=${pageSize}`, {
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

  return apiProjects.map((apiProj: any) => ({
    id: apiProj.id,
    name: apiProj.name,
    slug: apiProj.slug || apiProj.name.toLowerCase().replace(/\s+/g, '-'),
    description: apiProj.description || 'No description provided for this project.',
    // icon: apiProj.icon || "📚",
    difficulty: calculateDifficulty(apiProj.difficulty),
    xp: apiProj.difficulty || 0,
    duration: apiProj.estimate_time || "~1 week",
    teamSize: getTeamSize(apiProj.solo),
    tags: apiProj.objectives || ["42"],
    students: apiProj.students || 0,
    color: apiProj.color || "from-blue-400 to-blue-600",
    posts: apiProj.posts || [],
  }));
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
    fetch(`${API_BASE_URL}${postsPath}`, {
      method: 'GET',
      cache: 'no-store',
    }),
    fetch(`${API_BASE_URL}/projects/${projectId}`, {
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
