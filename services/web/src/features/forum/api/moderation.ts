const FORUM_API_BASE = '/api/forum';

async function forumClientFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  return fetch(`${FORUM_API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });
}

async function parseError(
  response: Response,
  fallback: string
): Promise<never> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(fallback);
  }

  try {
    const parsed = JSON.parse(text) as { detail?: string; message?: string };
    throw new Error(parsed.detail || parsed.message || fallback);
  } catch {
    throw new Error(text);
  }
}

export interface UpdatePostPayload {
  title?: string;
  content?: string;
}

export interface UpdateCommentPayload {
  content?: string;
}

export interface CreateProjectPayload {
  slug: string;
  name: string;
  objectives?: string[];
  solo?: boolean;
  estimate_time?: string;
  xp?: number;
  description?: string;
}

export async function updateForumPost(
  postId: number,
  payload: UpdatePostPayload
): Promise<void> {
  const response = await forumClientFetch(`/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    await parseError(response, 'Failed to update post');
  }
}

export async function deleteForumPost(postId: number): Promise<void> {
  const response = await forumClientFetch(`/posts/${postId}`, {
    method: 'DELETE',
    cache: 'no-store',
  });

  if (!response.ok) {
    await parseError(response, 'Failed to delete post');
  }
}

export async function updateForumComment(
  postId: number,
  commentId: number,
  payload: UpdateCommentPayload
): Promise<void> {
  const response = await forumClientFetch(
    `/posts/${postId}/comments/${commentId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    await parseError(response, 'Failed to update comment');
  }
}

export async function deleteForumComment(
  postId: number,
  commentId: number
): Promise<void> {
  const response = await forumClientFetch(
    `/posts/${postId}/comments/${commentId}`,
    {
      method: 'DELETE',
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    await parseError(response, 'Failed to delete comment');
  }
}

export async function createForumProject(
  payload: CreateProjectPayload
): Promise<void> {
  const response = await forumClientFetch('/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    await parseError(response, 'Failed to create project');
  }
}
