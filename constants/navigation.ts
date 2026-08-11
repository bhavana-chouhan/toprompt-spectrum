/**
 * Navigation constants derived from the generated navigation pattern.
 * Consumed by app/_layout.tsx and services/auth.ts to drive post-auth
 * redirects without hardcoded route strings.
 *
 * Do NOT edit by hand — regenerated from plan_mobile_structure.navigationPattern
 * on every build. If you need to change the home route, change the prompt
 * that drives plan_mobile_structure, not this file.
 */

/** Where the root layout navigates an authenticated user. */
export const HOME_ROUTE = '/(tabs)';

/** Where the root layout navigates an unauthenticated user. */
export const AUTH_ROUTE = '/(auth)/login';

/** Navigation pattern string — 'tabs' | 'drawer' | 'stack-only'. */
export const NAVIGATION_PATTERN = 'tabs';
