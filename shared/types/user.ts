// role enum
export enum UserRole {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

// user respose - full info without confidential ones, to be used in profile page
export interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  
  // optional
  avatarUrl?: string;
  bio?: string;
}

// user summary for lists/dropdown menu
export interface UserSummary {
  id: number;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

// create request (creating profile)
export interface UserCreateRequest {
  email: string;     // REQUIRED!
  username: string;  // REQUIRED!
  
  // optional
  fullName?: string;
  intraId?: string;
  googleId?: string;
  avatarUrl?: string;
}

// update request(edit profile info)
export interface UserUpdateRequest {
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
}