'use server'

import type { ForumApiPostSummary, ForumPost, ForumApiPostDetail, ForumPostDetail, ForumApiComment, ForumComment } from '../models';
import type { ForumSort } from '../models';
import { getProjectsByIdMap, mapApiPostToForumPost, toRelativeTime } from './project';
import { forumServerFetch as forumFetch } from './forumServerClient';

export async function getAllPosts(sort: ForumSort = 'Top'): Promise<ForumPost[]> {
  const postsPath = sort === 'New' ? '/posts/new' : '/posts/top';

  const [postsResponse, projectsById] = await Promise.all([
    forumFetch(postsPath, {
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

export async function searchPosts(searchQuery: string): Promise<ForumPost[]> {
  const trimmedQuery = searchQuery.trim();

  if (trimmedQuery.length < 2) {
    return getAllPosts('Top');
  }

  const [postsResponse, projectsById] = await Promise.all([
    forumFetch(`/search/posts?search_query=${encodeURIComponent(trimmedQuery)}`, {
      method: 'GET',
      cache: 'no-store',
    }),
    getProjectsByIdMap(),
  ]);

  if (!postsResponse.ok) {
    throw new Error('Failed to search posts.');
  }

  const postsData = (await postsResponse.json()) as ForumApiPostSummary[];
  return postsData.map((post) => mapApiPostToForumPost(post, projectsById.get(post.project_id)));
}

export async function getPostDetail(postId: number): Promise<{ post: ForumPostDetail; projectName?: string }> {
  const postResponse = await forumFetch(`/posts/${postId}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!postResponse.ok) {
    throw new Error(`Failed to fetch post ${postId}`);
  }

  const postData = (await postResponse.json()) as ForumApiPostDetail;
  const projectsById = await getProjectsByIdMap();
  const projectName = projectsById.get(postData.project_id);

  return {
    post: {
      id: postData.id,
      title: postData.title,
      content: postData.content,
      author: `user_${postData.author_id}`,
      authorId: postData.author_id,
      avatar: '',
      category: projectName ?? `Project ${postData.project_id}`,
      timestamp: toRelativeTime(postData.created_at),
      views: postData.view_count,
      upvotes: postData.vote_score,
      comments: postData.comment_count,
      isPinned: false,
    },
    projectName,
  };
}

export async function getPostComments(postId: number): Promise<ForumComment[]> {
  const response = await forumFetch(`/posts/${postId}/comments/top`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch comments for post ${postId}`);
  }

  const commentsData = (await response.json()) as ForumApiComment[];
  return commentsData.map((comment) => ({
    id: comment.id,
    author: `user_${comment.author_id}`,
    authorId: comment.author_id,
    avatar: '',
    content: comment.content,
    timestamp: toRelativeTime(comment.created_at),
    upvotes: comment.vote_score,
    isBestAnswer: comment.is_best_answer,
  }));
}

interface CreateProjectPostPayload {
  title: string;
  content: string;
}

interface CreateProjectPostResponse {
  id: number;
}

interface CreatePostCommentPayload {
  content: string;
}

interface CreatePostCommentResponse {
  id: number;
}

export async function createProjectPost(
  projectId: number,
  payload: CreateProjectPostPayload,
): Promise<CreateProjectPostResponse> {
  const response = await forumFetch(`/projects/${projectId}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to create post';

    try {
      const errorData = JSON.parse(errorText) as { detail?: string; message?: string };
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      if (errorText.trim().length > 0) {
        errorMessage = errorText;
      }
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as CreateProjectPostResponse;
}

export async function createPostComment(
  postId: number,
  payload: CreatePostCommentPayload,
): Promise<CreatePostCommentResponse> {
  const response = await forumFetch(`/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to create comment';

    try {
      const errorData = JSON.parse(errorText) as { detail?: string; message?: string };
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      if (errorText.trim().length > 0) {
        errorMessage = errorText;
      }
    }

    throw new Error(errorMessage);
  }

  return (await response.json()) as CreatePostCommentResponse;
}

export async function voteOnPost(postId: number, value: 1 | -1): Promise<number> {
  const response = await forumFetch(`/posts/${postId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include auth headers here if required (e.g., Bearer tokens)
    },
    body: JSON.stringify({ vote_value: value }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to register vote');
  }

  const data = await response.json();
  return data.vote_score ?? data.upvotes ?? 0;
}

export async function voteOnComment(postId: number, commentId: number, value: 1 | -1): Promise<number> {
  const response = await forumFetch(`/posts/${postId}/comments/${commentId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include auth headers here if required (e.g., Bearer tokens)
    },
    body: JSON.stringify({ vote_value: value }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to register vote');
  }

  const data = await response.json();
  return data.vote_score ?? data.upvotes ?? 0;
}