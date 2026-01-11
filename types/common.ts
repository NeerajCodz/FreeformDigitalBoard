/**
 * Common types shared across the application
 */

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface Timestamp {
  created_at: string;
  updated_at: string;
}

export type Status = 'active' | 'archived' | 'deleted';

export interface WithTimestamps {
  created_at: string;
  updated_at: string;
}

export interface WithStatus {
  status: Status;
}
