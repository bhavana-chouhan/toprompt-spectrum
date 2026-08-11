# Spectrum — Design Audit

> **Purpose:** Compare the current Spectrum UI against Instagram's visual language and the committed "Cool Clarity" design direction. Flag screens that need the most work and list concrete action items for each audit dimension.

---

## 1. Navigation Structure

### Current
- **Bottom tab bar** — 4 tabs: Home (`/`), Swipes (`/swipes`), Matches (`/matches`), Profile (`/profile`)
- Tab icons use `@expo/vector-icons` Ionicons; labels are present
- Stack navigators per entity group (`matches/_layout.tsx`, `swipes/_layout.tsx`) with `headerShown: false`
- Modal presentation for `/new` routes (swipe-down to dismiss on iOS) ✅
- Auth routes live in `/(auth)/` group — separate from tabs ✅

### Instagram Reference
- Bottom tab bar with 5 icons + **no visible text labels** (icon-only on iOS)
- Icons are bold/filled when active, outline when inactive
- Story tray sits at the very top of the feed — not a tab
- DMs accessible via top-right icon on the feed header, not a tab
- Modals slide up from bottom (sheet style) for comments, likes, share

### Gap / Action Items
| Item | Severity | Action |
|------|----------|--------|
| Tab labels visible | Low | Consider hiding labels or reducing to caption-size (11 pt) |
| Active tab uses tint color on icon only | Medium | Switch to filled icon variant when active (e.g. `heart` vs `heart-outline`) |
| No story-ring row on feed | Low | Add horizontal `ScrollView` of circular avatars with gradient ring at top of index screen |
| Header "large title" style on all screens | Medium | Instagram uses compact inline titles; reserve large title for Profile only |

---

## 2. Card & List Layouts

### Current — Swipe Cards (`app/(tabs)/index.tsx`)
- Full-screen card stack (Tinder-style) with photo, name overlay, action buttons
- Card uses `borderRadius.lg` (~16 px) with soft shadow (`Elevation`)
- Action buttons (❌ / ❤️) float below the card
- Photo fills the card; gradient overlay at bottom for text legibility

### Current — Match Cards (`app/(tabs)/matches.tsx`)
- `<ListItem>` rows: circular avatar (44 px) + name + subtitle line
- Stats bar at top (total matches / this week) inside a bordered card
- Filter chips (`<Chip>`) in a horizontal row below stats
- `ItemSeparatorComponent` hairline divider

### Current — Profile Cards (`app/matches/[id].tsx`)
- Hero section with two overlapping avatars (88 px) on a solid `colors.primary` background
- Below-hero meta rows (calendar, clock icons) in a surface card
- Per-user profile cards with thumbnail + bio text

### Instagram Reference
- **Feed posts:** full-width image, username + avatar above, like/comment/share icon row below, caption below that — no card border, no shadow
- **Stories row:** 64 px circular avatars with 2 px gradient ring (pink→orange), username truncated below
- **Profile grid:** 3-column equal-width image grid, no gaps between cells
- **DM list:** circular avatar (48 px) + bold name + last message preview + timestamp — very similar to current `ListItem` but bolder name weight
- **Explore grid:** masonry or equal-grid thumbnails, no text overlay

### Gap / Action Items
| Screen | Severity | Action |
|--------|----------|--------|
| Match list rows feel like a settings list | **High** | Increase avatar to 52 px, bold the name (`SemiBold`), add unread dot badge, remove hairline divider in favour of whitespace |
| Stats bar uses a bordered card | Medium | Replace with inline pill counters or remove entirely — Instagram never shows aggregate stats on list screens |
| Match detail hero uses solid primary blue | **High** | Switch to a blurred photo background or white surface; solid brand-color hero feels heavy vs Instagram's white-dominant surfaces |
| Swipe card action buttons are plain circles | Low | Add subtle gradient or use filled heart/x icons matching Instagram's interaction style |
| Profile screen has no photo grid | **High** | Add a 3-column photo grid below the bio section (see §6) |

---

## 3. Color Palette

### Committed "Cool Clarity" Palette
| Token | Light Value | Role |
|-------|-------------|------|
| `primary` | `#2563EB` | Brand blue — CTAs, active states |
| `secondary` | `#7C3AED` | Accent purple — badges, secondary actions |
| `accent` | `#F59E0B` | Amber — highlights, match badge |
| `background` | `#F0F4FF` | Screen background (blue-tinted off-white) |
| `surface` | `#FFFFFF` | Cards, sheets |
| `text` | `#0F172A` | Primary text (near-black) |

### Instagram Reference
| Role | Instagram Value | Notes |
|------|----------------|-------|
| Background | `#FFFFFF` / `#FAFAFA` | Pure white or near-white — no tint |
| Surface | `#FFFFFF` | Cards are indistinguishable from background |
| Primary action | `#0095F6` (blue) | Used only for links and follow buttons |
| Like / heart | `#ED4956` (red) | Distinct from brand blue |
| Story ring | `linear-gradient(#F58529, #DD2A7B, #8134AF, #515BD4)` | Gradient, not solid |
| Text | `#262626` | Very dark gray, not pure black |
| Secondary text | `#8E8E8E` | Mid-gray |
| Borders | `#DBDBDB` | Very light gray — barely visible |

### Gap / Action Items
| Item | Severity | Action |
|------|----------|--------|
| `background: #F0F4FF` has a blue tint | Medium | Consider lightening to `#F8FAFF` or `#FFFFFF` for Instagram-like cleanliness; the committed palette allows this as a refinement |
| `border: #C7D2FE` is quite saturated | Low | Reduce to `#E2E8F0` for hairline borders to feel lighter |
| Hero sections use solid `colors.primary` | **High** | Replace with white/surface backgrounds; reserve brand blue for interactive elements only |
| No gradient story ring color defined | Medium | Add a `storyRing` gradient token to `Colors.ts` (`['#F58529','#DD2A7B','#8134AF']`) |

---

## 4. Typography

### Current
- **Display / Heading font:** `Urbanist` (Bold, SemiBold) — loaded via `FontFamily.heading`
- **Body font:** `Poppins` (Regular, Medium, SemiBold) — loaded via `FontFamily.body`
- Scale follows iOS HIG: `largeTitle` (34), `title1` (28), `title2` (22), `headline` (17 SemiBold), `body` (17), `caption1` (12)
- `letterSpacing` values match HIG recommendations

### Instagram Reference
- **iOS:** `-apple-system` / `SF Pro` — system font, no custom typeface
- **Android:** `Roboto` — system font
- Weight usage: Regular for body, **Bold** for usernames and counts, SemiBold for CTAs
- Font sizes: username ~14 pt Bold, caption ~14 pt Regular, counts ~14 pt Bold, nav labels ~10 pt
- No display font — Instagram's brand identity lives in the logo image, not in a custom typeface

### Gap / Action Items
| Item | Severity | Action |
|------|----------|--------|
| `Urbanist` headings feel editorial | Low | Urbanist is clean and modern — acceptable for "Cool Clarity"; no change needed unless user requests it |
| Large title on every screen | Medium | Use `largeTitle` only on Profile; use `title3` inline header on Matches and Swipes |
| Username rows should be `SemiBold` not `Regular` | Medium | In match list rows, set name to `fontFamily: fonts.heading` (Urbanist SemiBold) |
| Caption text at 12 pt can be hard to read | Low | Ensure `textSecondary` captions are ≥ 13 pt (`footnote` variant) |

---

## 5. Spacing, Padding & Border-Radius

### Current Constants (`constants/spacing.ts`)
- `Spacing.xs` = 4, `sm` = 8, `md` = 12, `base` = 16, `lg` = 20, `xl` = 24, `2xl` = 32, `3xl` = 40, `4xl` = 48, `5xl` = 64
- `BorderRadius.sm` = 8, `md` = 12, `lg` = 16, `xl` = 24
- Cards use `borderRadius.lg` (16 px) with `borderWidth: 1`
- List items have `paddingHorizontal: Spacing.base` (16) and `paddingVertical: Spacing.md` (12)
- Stats bar: `paddingVertical: Spacing.md`, `paddingHorizontal: Spacing.xl`

### Instagram Reference
- **Feed items:** 0 horizontal padding on images (edge-to-edge); 12 px horizontal padding on text rows
- **Avatar size:** 32 px in feed header, 56 px on profile, 64 px in stories
- **Border radius:** 0 on feed images (square), 9999 (circle) on avatars, ~12 px on modals/sheets
- **Shadows:** essentially none — surfaces are differentiated by background color alone
- **Whitespace:** generous vertical spacing between posts (~8 px gap); tight within a post
- **Dividers:** single hairline (`StyleSheet.hairlineWidth`) between posts, or none at all

### Gap / Action Items
| Item | Severity | Action |
|------|----------|--------|
| Cards have `borderWidth: 1` with colored border | Medium | Reduce border opacity or remove border; use shadow-only elevation |
| Stats bar padding feels heavy | Low | Reduce `paddingVertical` to `Spacing.sm` (8) |
| List item vertical padding | Low | Increase to `Spacing.base` (16) for more Instagram-like whitespace |
| `borderRadius.lg` (16) on list containers | Low | Acceptable; Instagram uses ~12 px on sheets — current value is fine |
| Elevation/shadow on every card | Medium | Reserve `elevated` prop for primary action cards only; flat cards for list rows |

---

## 6. Screens Needing the Most Work (Priority Order)

### 🔴 HIGH — `app/(tabs)/profile.tsx`
**Current state:** Settings-style screen with avatar + name + sign-out. No photos, no bio, no stats (posts/followers/following), no photo grid.

**Instagram profile anatomy:**
1. Avatar (circular, 80 px) + name + username + bio — top section
2. Stats row: Posts | Followers | Following (bold numbers, small labels)
3. Edit Profile button (full-width outlined)
4. Story highlights row (circular, labeled)
5. 3-column photo grid (edge-to-edge)

**Action items:**
- Add `photos` grid using `FlatList` with `numColumns={3}` and `expo-image`
- Add stats row (use match count, swipe count as proxies for "posts/followers")
- Add bio text from `user.bio`
- Move sign-out to a settings sub-screen or a kebab menu icon
- Replace `AppHeader large` with compact inline header

---

### 🔴 HIGH — `app/(tabs)/matches.tsx`
**Current state:** Stats bar + filter chips + `ListItem` rows. Feels like a contacts app, not a dating app.

**Instagram DM / match list anatomy:**
- Section header: "Messages" in bold, "Requests" chip
- Rows: 56 px circular avatar + **bold** name + last message preview (gray) + timestamp (gray, right-aligned)
- Unread indicator: blue dot or bold name
- No stats bar, no filter chips on the main list

**Action items:**
- Remove stats bar or collapse to a subtle inline count
- Replace `Chip` filter row with a segmented control or remove entirely
- Increase avatar to 56 px with story-ring gradient for new matches
- Bold the name (`SemiBold`), add last-activity timestamp right-aligned
- Add a pulsing gradient badge on cards with unread activity (per project memory)
- Remove `ItemSeparatorComponent` hairline; use vertical padding instead

---

### 🟠 MEDIUM — `app/matches/[id].tsx`
**Current state:** Solid blue hero section with two avatars + heart icon. Heavy and brand-colored.

**Instagram DM thread anatomy:**
- White header with avatar + name + "Active X min ago"
- Message bubbles on white background
- No hero section

**Action items:**
- Replace solid `colors.primary` hero with a white/surface background
- Use a blurred photo background (`expo-image` `blurRadius` prop) if user has photos
- Reduce hero height; make it feel like a profile peek, not a landing page
- Move the "Remove Match" destructive action to a `...` menu icon in the header

---

### 🟠 MEDIUM — `app/(tabs)/index.tsx` (Swipe / Feed)
**Current state:** Tinder-style card stack — this is intentional for a dating app and diverges from Instagram by design.

**Refinements to align with "Cool Clarity" + Instagram cleanliness:**
- Ensure card background is `colors.surface` (white), not tinted
- Action buttons (like/pass) should use filled icons, not outlined
- Add a top bar with the Spectrum wordmark (Urbanist Bold) centered, matching Instagram's logo placement
- Story-ring row of "new profiles" could sit above the card stack

---

### 🟡 LOW — `app/(tabs)/swipes.tsx` & `app/swipes/[id].tsx`
- Swipe history list is secondary UI — lower priority
- Apply same list-row improvements as matches (larger avatar, bolder name, no border)

---

## 7. Summary Checklist

```
[ ] Profile screen: add photo grid, stats row, bio, highlights row
[ ] Matches list: remove stats bar, bold names, increase avatar size, add gradient badge
[ ] Match detail: replace solid-blue hero with white/blurred surface
[ ] All screens: reduce card border saturation, remove borders from list rows
[ ] All screens: use filled icon variants for active tab + active actions
[ ] Colors.ts: add storyRing gradient token
[ ] Tab bar: consider icon-only (no labels) or reduce label to 10 pt
[ ] Feed/Swipe: add Spectrum wordmark header, story-ring row above card stack
[ ] Typography: use SemiBold for all username/name display in list rows
```
