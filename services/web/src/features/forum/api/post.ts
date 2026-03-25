'use server'

import type { ForumApiPostSummary, ForumPost, ForumApiPostDetail, ForumPostDetail, ForumApiComment, ForumComment } from '../model';
import { getProjectsByIdMap, mapApiPostToForumPost, toRelativeTime } from './project';
import { cache } from 'react'

const FORUM_SERVICE_URL = 'http://forum-service:8080';
const API_BASE_URL = FORUM_SERVICE_URL;
//TODO: gateway-service:8080/api/forum/projects

export async function getAllPosts(): Promise<ForumPost[]> {
  const [postsResponse, projectsById] = await Promise.all([
    fetch(`${API_BASE_URL}/posts/top`, {
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

export async function getPostDetail(postId: number): Promise<{ post: ForumPostDetail; projectName?: string }> {
  const postResponse = await fetch(`${API_BASE_URL}/posts/${postId}`, {
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
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
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
    avatar: '',
    content: comment.content,
    timestamp: toRelativeTime(comment.created_at),
    upvotes: comment.vote_score,
  }));
}

export async function voteOnPost(postId: number, value: 1 | -1): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/vote`, {
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
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}/vote`, {
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