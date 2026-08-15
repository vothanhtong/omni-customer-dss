export type RoleType = 'admin' | 'business_user';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: RoleType;
  organization?: string;
  roleTitle: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  industry?: string;
  storeCount?: string;
  website?: string;
  createdAt: string;
}

export interface ResearchTaskItem {
  code: string;
  title: string;
  description: string;
  role: 'principal' | 'member';
  status: 'COMPLETED' | 'IN_PROGRESS';
  deliverables: string;
  metric?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: RoleType;
  organization: string;
}

export interface ProfileUpdatePayload {
  email: string;
  fullName?: string;
  organization?: string;
  avatarUrl?: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  industry?: string;
  storeCount?: string;
  website?: string;
}
