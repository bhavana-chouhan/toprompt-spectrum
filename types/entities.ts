/**
 * Entity type definitions — single source of truth for Phase 1 Zustand stores
 * and Phase 2 Next.js API + Mongoose schemas.
 * Generated from pageManifest.entities. Do NOT edit by hand.
 */

export interface User {
  _id: string;
  id: string;
  title: string;
  name: string;
  bio?: string;
  photos: string[];
  age?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Swipe {
  _id: string;
  id: string;
  title: string;
  profileSwiped: string;
  action: 'like' | 'pass';
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  _id: string;
  id: string;
  title: string;
  user1: string;
  user2: string;
  createdAt: string;
  updatedAt: string;
}
