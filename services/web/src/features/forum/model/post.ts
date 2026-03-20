export type ForumViewMode = 'card' | 'compact';

export type ForumSort = 'New' | 'Top';

export interface ForumPost {
  id: number;
  title: string;
  author: string;
  avatar: string;
  comments: number;
  views: number;
  upvotes: number;
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
  comment_count: number;
}

export interface ForumApiProjectSummary {
  id: number;
  name: string;
}

export const forumCategories = ['All', 'minishell', 'inception', 'philo', 'Tutorial', 'Career'] as const;

export const forumSortOptions: readonly ForumSort[] = ['New', 'Top'];
