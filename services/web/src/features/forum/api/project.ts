import 'server-only';

import type { ForumApiPostSummary, ForumApiProjectSummary, ForumPost } from '../model';
import { cache } from 'react'

const FORUM_SERVICE_URL = 'http://forum-service:8080';
const API_BASE_URL = FORUM_SERVICE_URL;
//TODO: gateway-service:8080/api/forum/projects
interface ForumApiProjectListPage {
  items: ForumApiProjectSummary[];
  total_pages: number;
}

function toRelativeTime(isoDate: string) {
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

function mapApiPostToForumPost(post: ForumApiPostSummary, projectName?: string): ForumPost {
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

// fetches all projects and maps them id:name, utilizes nextjs cache
export const getProjectsByIdMap = cache(async (): Promise<Map<number, string>> => {
  const pageSize = 100;
  const projectsById = new Map<number, string>();

  // 1. Fetch the first page to get the initial data and the 'total_pages' count.
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
  
  // Populate the map with the first page
  firstPageData.items.forEach((p) => projectsById.set(p.id, p.name));

  const totalPages = firstPageData.total_pages || 1;

  // 2. Optimization: If there are more pages, fetch them in parallel using Promise.all.
  // This avoids the "network waterfall" of a sequential while-loop.
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

    // Parse all remaining pages
    const results = await Promise.all(
      responses.map((res) => {
        if (!res.ok) throw new Error('Failed to fetch a project page');
        return res.json() as Promise<ForumApiProjectListPage>;
      })
    );

    // Add remaining items to the map
    results.forEach((data) => {
      data.items.forEach((p) => projectsById.set(p.id, p.name));
    });
  }

  return projectsById;
});

export async function getProjectPosts(projectId: number): Promise<ForumPost[]> {
  const [postsResponse, projectResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/projects/${projectId}/posts`, {
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

export async function getAllPosts(): Promise<ForumPost[]> {
  const [postsResponse, projectsById] = await Promise.all([
    fetch(`${API_BASE_URL}/posts`, {
      method: 'GET',
      cache: 'no-store',
    }),
    getProjectsByIdMap(),
  ]);

  if (!postsResponse.ok) {
    throw new Error('Failed to fetch posts.');
  }

  const postsData = (await postsResponse.json()) as ForumApiPostSummary[];
  return postsData.map((post) => mapApiPostToForumPost(post, projectsById.get(post.project_id)));
}
