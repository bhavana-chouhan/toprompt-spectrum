/**
 * Touch target minimums. Apple HIG requires 44pt; Material Design recommends
 * 48pt for comfortable targets. Every Pressable / Button / Input / ListItem
 * MUST meet MIN_TOUCH_TARGET — using this constant explicitly (rather than a
 * magic number) makes the requirement visible in code review.
 */
export const MIN_TOUCH_TARGET = 44;     // iOS HIG minimum
export const COMFY_TOUCH_TARGET = 48;   // Material Design comfortable
export const LIST_ROW_HEIGHT = 60;      // iOS default list row (Settings, Notes, etc.)
export const TAB_BAR_HEIGHT = 72;       // Bottom tab bar (icon + label)
