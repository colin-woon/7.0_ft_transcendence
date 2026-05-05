export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface ForumPost {
  id: number;
  title: string;
  author: string;
  authorId?: number;
  avatar: string;
  replies: number;
  views: number;
  upvotes: number;
  userVote?: 1 | -1 | 0;
  category: string;
  timestamp: string;
  preview: string;
  isHot: boolean;
  isPinned: boolean;
}

export interface Project {
  id: number;
  slug: string;
  name: string;
  description: string;

  difficulty: string;
  xp: number;
  duration: string;
  teamSize: string;
  tags: string[];
  students: number;
  postCount?: number;
  createdAt?: string;
  color: string;
  posts: ForumPost[];
}