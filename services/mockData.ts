/**
 * services/mockData.ts — deterministic fixtures emitted by Node 09
 * (heuristic_pre_fill). Phase 1 stores read from here; Phase 2 swaps
 * to API calls.
 *
 * DO NOT add UI strings here (button labels, error messages). Those
 * belong in voice-audience copy via screen contracts.
 */

export const USERS_FIXTURES = [
{
  "id": "user-1",
  "title": "Sample User one",
  "createdAt": "2026-05-01T09:00:00Z",
  "name": "Sample User one",
  "bio": "Example bio",
  "photos": "https://images.unsplash.com/photo-1694878982234-58d53e0d1655?ixid=M3w5NzkzOTB8MHwxfHNlYXJjaHwxfHx1c2VyJTIwc29jaWFsfGVufDF8MHx8fDE3ODY0NDU4NzR8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=80",
  "age": 10
},
{
  "id": "user-2",
  "title": "Sample User two",
  "createdAt": "2026-05-02T09:00:00Z",
  "name": "Sample User two",
  "bio": "Example bio",
  "photos": "https://images.unsplash.com/photo-1777559542722-5301247fa3b8?ixid=M3w5NzkzOTB8MHwxfHNlYXJjaHwyfHx1c2VyJTIwc29jaWFsfGVufDF8MHx8fDE3ODY0NDU4NzR8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=80",
  "age": 20
},
{
  "id": "user-3",
  "title": "Sample User three",
  "createdAt": "2026-05-03T09:00:00Z",
  "name": "Sample User three",
  "bio": "Example bio",
  "photos": "https://images.unsplash.com/photo-1777559543138-9f5b4e0d04ca?ixid=M3w5NzkzOTB8MHwxfHNlYXJjaHwzfHx1c2VyJTIwc29jaWFsfGVufDF8MHx8fDE3ODY0NDU4NzR8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80",
  "age": 30
},
{
  "id": "user-4",
  "title": "Sample User four",
  "createdAt": "2026-05-04T09:00:00Z",
  "name": "Sample User four",
  "bio": "Example bio",
  "photos": "https://images.unsplash.com/photo-1762330466873-9a7dba6135b4?ixid=M3w5NzkzOTB8MHwxfHNlYXJjaHw0fHx1c2VyJTIwc29jaWFsfGVufDF8MHx8fDE3ODY0NDU4NzR8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80",
  "age": 40
},
{
  "id": "user-5",
  "title": "Sample User five",
  "createdAt": "2026-05-05T09:00:00Z",
  "name": "Sample User five",
  "bio": "Example bio",
  "photos": "https://images.unsplash.com/photo-1762330469550-9488b01dd685?ixid=M3w5NzkzOTB8MHwxfHNlYXJjaHw1fHx1c2VyJTIwc29jaWFsfGVufDF8MHx8fDE3ODY0NDU4NzR8MA&ixlib=rb-4.1.0&auto=format&fit=crop&w=800&q=80",
  "age": 50
}
] as const;

export const SWIPES_FIXTURES = [
{
  "id": "swipe-1",
  "title": "Sample Swipe one",
  "createdAt": "2026-05-01T09:00:00Z",
  "profileSwiped": "user-1",
  "action": "Example action"
},
{
  "id": "swipe-2",
  "title": "Sample Swipe two",
  "createdAt": "2026-05-02T09:00:00Z",
  "profileSwiped": "user-2",
  "action": "Example action"
},
{
  "id": "swipe-3",
  "title": "Sample Swipe three",
  "createdAt": "2026-05-03T09:00:00Z",
  "profileSwiped": "user-3",
  "action": "Example action"
},
{
  "id": "swipe-4",
  "title": "Sample Swipe four",
  "createdAt": "2026-05-04T09:00:00Z",
  "profileSwiped": "user-4",
  "action": "Example action"
},
{
  "id": "swipe-5",
  "title": "Sample Swipe five",
  "createdAt": "2026-05-05T09:00:00Z",
  "profileSwiped": "user-5",
  "action": "Example action"
}
] as const;

export const MATCHES_FIXTURES = [
{
  "id": "match-1",
  "title": "Sample Match one",
  "createdAt": "2026-05-01T09:00:00Z",
  "user1": "user-1",
  "user2": "user-1"
},
{
  "id": "match-2",
  "title": "Sample Match two",
  "createdAt": "2026-05-02T09:00:00Z",
  "user1": "user-2",
  "user2": "user-2"
},
{
  "id": "match-3",
  "title": "Sample Match three",
  "createdAt": "2026-05-03T09:00:00Z",
  "user1": "user-3",
  "user2": "user-3"
},
{
  "id": "match-4",
  "title": "Sample Match four",
  "createdAt": "2026-05-04T09:00:00Z",
  "user1": "user-4",
  "user2": "user-4"
},
{
  "id": "match-5",
  "title": "Sample Match five",
  "createdAt": "2026-05-05T09:00:00Z",
  "user1": "user-5",
  "user2": "user-5"
}
] as const;
