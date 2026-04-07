import type {
  ActionResponse,
  ProjectSubscriberCount,
  ProjectSubscriptionRow,
  ProjectSubscriptionStatus,
} from '../models/subcription';

const FORUM_API_BASE = '/api/forum';

async function forumClientFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);

  return fetch(`${FORUM_API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
}

export async function getProjectSubscriptionStatus(projectId: number): Promise<ProjectSubscriptionStatus> {
  const response = await forumClientFetch(`/projects/${projectId}/subscription-status`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch subscription status');
  }

  return (await response.json()) as ProjectSubscriptionStatus;
}

export async function getProjectSubscriberCount(projectId: number): Promise<ProjectSubscriberCount> {
  const response = await forumClientFetch(`/projects/${projectId}/subscribers/count`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch subscriber count');
  }

  return (await response.json()) as ProjectSubscriberCount;
}

export async function subscribeToProject(projectId: number): Promise<ProjectSubscriptionRow> {
  const response = await forumClientFetch(`/projects/${projectId}/subscribe`, {
    method: 'POST',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to subscribe to project');
  }

  return (await response.json()) as ProjectSubscriptionRow;
}

export async function unsubscribeFromProject(projectId: number): Promise<ActionResponse> {
  const response = await forumClientFetch(`/projects/${projectId}/subscribe`, {
    method: 'DELETE',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to unsubscribe from project');
  }

  return (await response.json()) as ActionResponse;
}
