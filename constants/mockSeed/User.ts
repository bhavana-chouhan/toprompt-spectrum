/**
 * Default Phase-1 User mock seed — auto-emitted by generate_component_library
 * when the LLM didn't extract a User entity. Re-exported via
 * `@/services/mock-data` as `users` and `CURRENT_USER`.
 *
 * Phase 2 ignores this file — services/auth.ts hydrates useAuthStore from
 * /api/auth/me. This is only the design-preview safety net.
 */

export interface MockUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  username: string;
  avatarUrl: string;
  joinedAt: string;
}

export const users: MockUser[] = [
  {
    _id: 'u-001',
    id: 'u-001',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    username: 'alex.morgan',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    joinedAt: '2025-06-15',
  },
  {
    _id: 'u-002',
    id: 'u-002',
    name: 'Jordan Lee',
    email: 'jordan.lee@example.com',
    username: 'jordan.lee',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    joinedAt: '2025-10-08',
  },
  {
    _id: 'u-003',
    id: 'u-003',
    name: 'Sam Patel',
    email: 'sam.patel@example.com',
    username: 'sam.patel',
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80',
    joinedAt: '2026-01-12',
  },
  {
    _id: 'u-004',
    id: 'u-004',
    name: 'Casey Rivera',
    email: 'casey.rivera@example.com',
    username: 'casey.rivera',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    joinedAt: '2026-04-02',
  },
  {
    _id: 'u-005',
    id: 'u-005',
    name: 'Riley Chen',
    email: 'riley.chen@example.com',
    username: 'riley.chen',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    joinedAt: '2026-07-21',
  },
];
