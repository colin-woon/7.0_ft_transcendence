export type ForumViewMode = 'card' | 'compact';

export type ForumSort = 'New' | 'Top';

export interface ForumPost {
  id: number;
  title: string;
  author: string;
  authorId?: number;
  avatar: string;
  comments: number;
  views: number;
  upvotes: number;
  userVote?: 1 | -1 | 0;
  category: string;
  timestamp: string;
  isPinned: boolean;
}

export interface ForumApiPostSummary {
  id: number;
  project_id: number;
  author_id: number;
  title: string;
  view_count: number;
  created_at: string;
  vote_score: number;
  user_vote: 1 | -1 | 0;
  comment_count: number;
}

export interface ForumApiProjectSummary {
  id: number;
  slug: string;
  name: string;
  description?: string;
  objectives?: string[];
  estimate_time?: string;
  difficulty?: string;
  xp?: number;
  solo?: boolean;
  post_count?: number;
  subscriber_count?: number;
  created_at?: string;
}

export interface ForumApiPostDetail {
  id: number;
  project_id: number;
  author_id: number;
  title: string;
  content: string;
  view_count: number;
  created_at: string;
  vote_score: number;
  user_vote: 1 | -1 | 0;
  comment_count: number;
}

export interface ForumApiComment {
  id: number;
  post_id: number;
  author_id: number;
  content: string;
  is_best_answer: boolean;
  vote_score: number;
  user_vote: 1 | -1 | 0;
  created_at: string;
}

export interface ForumPostDetail {
  id: number;
  title: string;
  content: string;
  author: string;
  authorId?: number;
  avatar: string;
  category: string;
  timestamp: string;
  views: number;
  upvotes: number;
  userVote: 1 | -1 | 0;
  comments: number;
  isPinned: boolean;
}

export interface ForumComment {
  id: number;
  author: string;
  authorId?: number;
  avatar: string;
  content: string;
  timestamp: string;
  upvotes: number;
  userVote: 1 | -1 | 0;
  isBestAnswer: boolean;
}

export const forumCategories = ['All', 'minishell', 'inception', 'philo', 'Tutorial', 'Career'] as const;

export const forumSortOptions: readonly ForumSort[] = ['New', 'Top'];
