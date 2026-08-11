import { create } from 'zustand';

export type AppColorScheme = 'light' | 'dark' | 'system';

interface AppState {
  colorScheme: AppColorScheme;
  isOnboarded: boolean;
  setColorScheme: (scheme: AppColorScheme) => void;
  setOnboarded: (value: boolean) => void;
}

/**
 * Hermes-safe mobile app store.
 *
 * We intentionally avoid zustand/middleware here because its ESM build
 * relies on import.meta, which breaks in Expo Hermes.
 */
export const useAppStore = create<AppState>((set) => ({
  colorScheme: 'system',
  isOnboarded: false,
  setColorScheme: (scheme) => set({ colorScheme: scheme }),
  setOnboarded: (value) => set({ isOnboarded: value }),
}));
