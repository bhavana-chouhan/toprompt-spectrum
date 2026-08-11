import { Redirect } from 'expo-router';

import { HOME_ROUTE } from '@/constants/navigation';

/**
 * Root entry — falls through to HOME_ROUTE.
 *
 * The canonical app/_layout.tsx owns BOTH the splash gate (renders
 * <AppSplash /> until fonts + auth + 2.5s minimum) AND the auth-driven
 * redirect (replaces to AUTH_ROUTE when unauthenticated). This file is
 * intentionally minimal — a single Redirect to HOME_ROUTE — so it never
 * competes with the layout for splash render or navigation control.
 *
 * If a previous version of this file had its own <AppSplash> + setState +
 * auth check, that was the source of the recurring "splash never visible"
 * regression: the layout splash hid the moment status resolved, then the
 * Stack mounted this index, which would mount a SECOND splash that got
 * unmounted instantly by the layout's redirect effect. Single source of
 * truth fixes the race.
 */
export default function Index() {
  return <Redirect href={HOME_ROUTE} />;
}
