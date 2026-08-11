# CLAUDE.md — Agent Instructions for Expo Boilerplate

Context file for AI agents (Claude Code, Copilot, Cursor) working on projects built from this boilerplate.

## Project Spec

- **Expo SDK 54** / React Native 0.81.5 / React 19.1
- **TypeScript 5.9** strict mode
- **Expo Router 6** file-based navigation with typed routes
- **Zustand 5** state, **TanStack Query 5** data fetching, **Axios** HTTP
- **Styling:** Plain `StyleSheet` — NO NativeWind, NO styled-components
- **New Architecture** + **React Compiler** enabled
- **Path alias:** `@/*` maps to `./*` (project root)

---

## Mandatory Rules

### DO use the boilerplate components

**Primary imports — `@/components/ui`** (code generator uses these paths):

| Need | Import from | Component |
|------|-------------|-----------|
| Screen wrapper | `@/components/ui/Screen` | `<Screen scroll>` |
| Any text | `@/components/ui/Typography` | `<Typography variant="h1">` |
| Any button | `@/components/ui/Button` | `<Button variant="primary" onPress={fn}>` |
| Text input | `@/components/ui/Input` | `<Input label="Email" error="Required">` |
| Card/container | `@/components/ui/Card` | `<Card>` |
| Status pill | `@/components/ui/Badge` | `<Badge label="Active" variant="success">` |
| User image | `@/components/ui/Avatar` | `<Avatar uri={url} name="John" size={40}>` |
| Menu/settings row | `@/components/ui/ListItem` | `<ListItem title="Profile" icon="person-outline" showChevron>` |
| Empty/error state | `@/components/ui/EmptyState` | `<EmptyState title="No items" message="...">` |
| Bottom sheet | `@/components/ui/Modal` | `<Modal visible={show} onClose={close} title="Pick">` |
| Icons | `@/components/ui/Icon` | `<Icon name="home-outline" size={24}>` |
| Loading UI | `@/components/ui/LoadingSpinner` | `<LoadingSpinner overlay>` |

**Also available — `@/components/common`** (direct implementations):

| Need | Import from | Component |
|------|-------------|-----------|
| Keyboard form | `@/components/common` | `<KeyboardSafeView scroll>` |
| Spacing | `@/components/common` | `<Spacer size="md">` |
| Error boundary | `@/components/common` | `<ErrorBoundary>` |

**Layout — `@/components/layout`**:

| Need | Import from | Component |
|------|-------------|-----------|
| Horizontal row | `@/components/layout` | `<Row justify="space-between" gap="sm">` |
| Divider line | `@/components/layout` | `<Divider>` |

### DO NOT

- Import `Text` from `react-native` — use `Typography` from `@/components/ui`
- Use raw hex colors like `'#0a7ea4'` — use `colors.primary` from `useTheme()`
- Use hardcoded pixel numbers for spacing — use `Spacing.md` or `<Spacer size="md">`
- Use `fontFamily: 'Inter-Regular'` — use `FontFamily.REGULAR` from `@/constants`
- Create `KeyboardAvoidingView` manually — use `<KeyboardSafeView>` (uses `react-native-keyboard-controller` under the hood)
- Wrap screens in `SafeAreaView` manually — use `<Screen>` from `@/components/ui`
- Use `SafeAreaView` from `react-native` — use `Screen` which uses `SafeAreaView` from `react-native-safe-area-context` with `edges` control
- Create a new Axios instance — use `api` from `@/services/api`
- Create a new QueryClient — use `queryClient` from `@/services/queryClient`
- Use relative imports like `../constants/Colors` or `../../hooks` — **always** use `@/constants/Colors` or `@/hooks` (the `@/` alias prevents case-sensitivity and path-depth bugs)
- Rename or create boilerplate files with different casing — `constants/Colors.ts` must stay PascalCase, NOT `colors.ts` (case-sensitive file systems like Linux/Docker will break if imports don't match filenames)
- Delete or omit `.npmrc` when scaffolding a new project — it **MUST** be copied (contains `node-linker=hoisted` required for pnpm + Expo)

---

## Critical Root Files

| File | Purpose | What breaks without it |
|------|---------|----------------------|
| `.npmrc` | `node-linker=hoisted` — makes pnpm use flat node_modules | Metro can't resolve modules — app crashes with `Unable to resolve module` |
| `metro.config.js` | Blocks only pnpm `_tmp` files — do NOT block entire `.pnpm/` directory | Module resolution fails |
| `tsconfig.json` | `@/*` → `./*` path alias | All `@/` imports fail |
| `app.json` | Expo config — name, slug, platforms, plugins | Expo won't start |

---

## File Reference

> **Filenames below are exact** — preserve the exact casing shown (`Colors.ts`, not `colors.ts`).

### Constants (edit these to customize the app)

| File | Key Exports | Purpose |
|------|-------------|---------|
| `constants/Colors.ts` | `LightColors`, `DarkColors`, `Colors`, `ThemeColors` | Full light/dark palette |
| `constants/fonts.ts` | `FontFamily`, `fontAssets`, `FontWeight` | Font names + require map |
| `constants/spacing.ts` | `Spacing`, `BorderRadius`, `SCREEN_PADDING` | Spacing scale + radii |
| `constants/typography.ts` | `Typography`, `TypographyVariant` | 13 text style presets |

### Theme

| File | Purpose |
|------|---------|
| `theme/ThemeContext.tsx` | Provider wrapping entire app, resolves light/dark/system |
| `theme/index.ts` | Re-exports all design tokens |
| `hooks/useTheme.ts` | Returns `{ colors, fonts, spacing, typography, isDark, setColorScheme }` |

### State & Data

| File | Purpose |
|------|---------|
| `store/useAppStore.ts` | Zustand: `colorScheme` + `isOnboarded`, persisted to AsyncStorage |
| `utils/storage.ts` | AsyncStorage wrapper + Zustand `StateStorage` adapter |
| `services/api.ts` | Axios: auth interceptors, 401 event emitter, token helpers |
| `services/queryClient.ts` | React Query: 5min stale, 2 retries, no window refocus |

### Components

**Architecture:** All implementations live in `ui/`. The `common/` folder has 3 local files (ErrorBoundary, KeyboardSafeView, Spacer) + barrel re-exports from `ui/` for backward compatibility.

**`@/components/ui` — primary import path (all implementations):**

| Component | Key Props |
|-----------|-----------|
| `Screen` | `scroll`, `edges` (defaults `['top']` — tab bar handles bottom), `noPadding` — uses `SafeAreaView` from `react-native-safe-area-context` + StatusBar |
| `Typography` | `variant` (h1-h6, body1-2, caption, etc.), `color`, `align` |
| `Button` | `title`, `variant` (primary/secondary/outline/ghost), `size`, `loading`, `disabled`, `fullWidth` |
| `Input` | `label`, `error`, `hint`, plus all TextInputProps |
| `Card` | `noPadding` |
| `Badge` | `label`, `variant` (default/success/warning/error/info/primary) |
| `Avatar` | `uri`, `name`, `size` — image or initials fallback |
| `ListItem` | `title`, `subtitle`, `icon`, `showChevron`, `onPress`, `right` |
| `EmptyState` | `icon`, `title`, `message`, `actionLabel`, `onAction` |
| `Modal` | `visible`, `onClose`, `title`, `children` — bottom sheet style |
| `Icon` | `name` (Ionicons), `size`, `color` |
| `LoadingSpinner` | `overlay`, `size` |
| `IconSymbol` | SF Symbols (iOS) / Material Icons (Android/web), 19 pre-mapped icons |
| `HapticTab` | Tab button with haptic feedback |
| `Collapsible` | Expand/collapse section |
| `ExternalLink` | In-app browser link |

**`@/components/common` — local extras + re-exports from ui/:**

| Component | Notes |
|-----------|-------|
| `KeyboardSafeView` | `bottomOffset`, `showToolbar` — uses `react-native-keyboard-controller` (auto-scrolls to focused input + prev/next/done toolbar) |
| `Spacer` | `size` (SpacingKey), `horizontal` — local implementation |
| `ErrorBoundary` | `fallback` — local implementation |
| `Screen`, `Typography`, `Text`, `Button`, `Card`, `Input`, `Badge`, `Avatar`, `ListItem`, `EmptyState`, `Modal`, `LoadingSpinner` | Re-exported from `@/components/ui` for backward compatibility |

**`@/components/layout`:**

| Component | Key Props |
|-----------|-----------|
| `Container` | Padded wrapper |
| `Row` | `justify`, `align`, `gap`, `wrap` |
| `Divider` | `spacing`, `vertical` |

### Navigation

```
app/
  _layout.tsx           Root Stack (ErrorBoundary -> KeyboardProvider -> QueryClient -> Theme)
  +not-found.tsx        404
  modal.tsx             Modal example
  (tabs)/
    _layout.tsx         Bottom tabs
    index.tsx           Home (component showcase)
    settings.tsx        Settings (theme toggle)
```

Add screen: create `app/myscreen.tsx`.
Add tab: create `app/(tabs)/mytab.tsx` + add `<Tabs.Screen>` in `_layout.tsx`.
Add nested stack: create `app/(auth)/` with its own `_layout.tsx`.

---

## Color System (`colors` from `useTheme()`)

```
colors.primary / primaryLight / primaryDark    Brand colors
colors.secondary / accent                      Secondary + accent
colors.background / surface / card             Backgrounds
colors.text / textSecondary / textMuted / textInverse    Text
colors.border / divider / overlay              Borders
colors.success / warning / error / info        Status
colors.link / placeholder                      Interactive
colors.tint / tabIconDefault / tabIconSelected / icon    Navigation
colors.inputBackground / inputBorder           Form inputs
```

## Typography Variants

```
h1(32px Bold) h2(28px Bold) h3(24px SemiBold) h4(20px SemiBold)
h5(18px Medium) h6(16px Medium)
subtitle1(16px Medium) subtitle2(14px Medium)
body1(16px Regular) body2(14px Regular)
caption(12px Regular) overline(10px Medium)
button(14px SemiBold) label(12px Medium)
```

## Spacing Scale

```
xs=4  sm=8  md=12  base=16  lg=20  xl=24  2xl=32  3xl=40  4xl=48  5xl=64
SCREEN_PADDING=16
BorderRadius: sm=4 md=8 lg=12 xl=16 2xl=24 full=9999
```

---

## Patterns

### New Screen

```tsx
import { Screen, Typography } from '@/components/ui';
import { Spacer } from '@/components/common';
import { useTheme } from '@/hooks';

export default function MyScreen() {
  const { colors } = useTheme();
  return (
    <Screen scroll>
      <Spacer size="xl" />
      <Typography variant="h2">Title</Typography>
    </Screen>
  );
}
```

### New API Service

```tsx
import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';
interface Item { id: string; name: string; }
export const itemService = {
  list: () => api.get<ApiResponse<Item[]>>('/items'),
  create: (data: Omit<Item, 'id'>) => api.post<ApiResponse<Item>>('/items', data),
};
```

### New Zustand Store

```tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
interface MyState { value: string; setValue: (v: string) => void; }
export const useMyStore = create<MyState>()(
  persist(
    (set) => ({ value: '', setValue: (value) => set({ value }) }),
    { name: 'my-store', storage: createJSONStorage(() => zustandStorage) },
  ),
);
```

### 401 Handling

```tsx
import { onAuthExpired } from '@/services/api';
useEffect(() => {
  const unsub = onAuthExpired(() => router.replace('/sign-in'));
  return unsub;
}, []);
```

### Adding a Package

```bash
npx expo install expo-camera          # Expo/RN packages (SDK-compatible version)
pnpm add lodash                        # Regular packages
pnpm add -D @types/lodash             # Dev dependencies
```

If it needs a provider, add to root `_layout.tsx` provider chain.

### Using Date/Time Picker

```tsx
import DateTimePicker from '@react-native-community/datetimepicker';
const [date, setDate] = useState(new Date());
<DateTimePicker mode="date" value={date} onChange={(_, d) => d && setDate(d)} />
```

### Using Dropdown Picker

```tsx
import { Picker } from '@react-native-picker/picker';
<Picker selectedValue={value} onValueChange={setValue}>
  <Picker.Item label="Option A" value="a" />
  <Picker.Item label="Option B" value="b" />
</Picker>
```

### Using Optimized Images

```tsx
import { Image } from 'expo-image';
<Image source={{ uri: 'https://...' }} style={{ width: 200, height: 200 }} contentFit="cover" />
```

### Using Gradients

```tsx
import { LinearGradient } from 'expo-linear-gradient';
<LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ padding: 16, borderRadius: 12 }}>
  <Text variant="h4" color="#fff">Gradient Card</Text>
</LinearGradient>
```

### Using Animations (Reanimated)

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
const offset = useSharedValue(0);
const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring(offset.value) }] }));
<Animated.View style={animStyle}><Text>Slide me</Text></Animated.View>
```

### Using SVG

```tsx
import Svg, { Circle, Rect } from 'react-native-svg';
<Svg width={100} height={100}><Circle cx={50} cy={50} r={40} fill={colors.primary} /></Svg>
```

---

## All Pre-installed Packages

### Wired into boilerplate code

| Package | Configured In |
|---------|---------------|
| `expo-router@6` | `app/` routes |
| `zustand@5` | `store/useAppStore.ts` |
| `@tanstack/react-query@5` | `services/queryClient.ts` + root layout |
| `axios` | `services/api.ts` |
| `expo-secure-store` | `services/api.ts` (auth token) |
| `expo-font` | `hooks/useAppFonts.ts` |
| `expo-splash-screen` | `app/_layout.tsx` |
| `expo-haptics` | `components/ui/Button.tsx`, `components/ui/HapticTab.tsx` |
| `@react-native-async-storage` | `utils/storage.ts` |
| `expo-status-bar` | `components/ui/Screen.tsx`, root layout |
| `react-native-safe-area-context` | `components/ui/Screen.tsx` |
| `react-native-keyboard-controller` | `components/common/KeyboardSafeView.tsx`, root layout (`KeyboardProvider`) |
| `expo-web-browser` | `components/ui/ExternalLink.tsx` |

### Ready to import (no setup needed)

| Package | Import |
|---------|--------|
| `react-native-reanimated` | `import Animated from 'react-native-reanimated'` |
| `react-native-gesture-handler` | `import { GestureDetector } from 'react-native-gesture-handler'` |
| `react-native-svg` | `import Svg, { Circle } from 'react-native-svg'` |
| `expo-image` | `import { Image } from 'expo-image'` |
| `expo-linear-gradient` | `import { LinearGradient } from 'expo-linear-gradient'` |
| `@react-native-community/datetimepicker` | `import DateTimePicker from '@react-native-community/datetimepicker'` |
| `@react-native-picker/picker` | `import { Picker } from '@react-native-picker/picker'` |
| `@expo/vector-icons` | `import { Ionicons } from '@expo/vector-icons'` |
| `expo-constants` | `import Constants from 'expo-constants'` |
| `expo-linking` | `import * as Linking from 'expo-linking'` |

---

## Build Commands

```bash
pnpm start          # Dev server
pnpm ios            # iOS
pnpm android        # Android
pnpm web            # Web
pnpm lint           # ESLint
pnpm lint:fix       # Auto-fix lint
pnpm type-check     # TypeScript
pnpm format         # Prettier
```
