import React, { useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { MobileStyle } from '@/constants/mobileStyle';

type EnterVariant = 'fade' | 'slide-up' | 'scale-up' | 'none';

interface FadeInProps {
  /** Children to fade in. */
  children: React.ReactNode;
  /** Animation duration in ms. Default 220. */
  duration?: number;
  /** Delay before the entry animation starts. Default 0. */
  delay?: number;
  /**
   * Override the entry variant. When omitted, uses the project's
   * MobileStyle.enterAnimation:
   *   • 'fade'      — pure opacity fade (smooth, neutral — saas-tech, luxury)
   *   • 'slide-up'  — fades in while sliding up 12px (warm, organic styles)
   *   • 'scale-up'  — fades in while scaling from 0.96 (modern-dark, web3)
   *   • 'none'      — no animation (flat-design — instant render)
   */
  variant?: EnterVariant;
  /**
   * Legacy prop. When provided, overrides the variant's default translateY
   * offset. Kept for backwards-compat with screens that pass an explicit
   * pixel value (e.g. translateY={8} for a subtle fade-up). New code should
   * prefer the `variant` prop or rely on the project default.
   */
  translateY?: number;
  /** Extra style override. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps children with an entry animation on mount.
 *
 * The default behavior reads the project's MobileStyle.enterAnimation so
 * screens animate consistently with the project's overall motion language —
 * 'modern-dark' apps get scale-up entries, 'organic' apps get slide-up,
 * 'flat-design' gets instant render (none). Override per-call site with
 * the `variant` prop when one screen needs a different feel.
 *
 * Example — uses project default:
 *   <FadeIn>
 *     <Card>...</Card>
 *   </FadeIn>
 *
 * Example — explicit override (force slide-up regardless of project style):
 *   <FadeIn variant="slide-up">
 *     <Card>...</Card>
 *   </FadeIn>
 *
 * Example — staggered list (caller controls delay):
 *   {items.map((item, i) => (
 *     <FadeIn key={item._id} delay={i * 50}>
 *       <ListRow item={item} />
 *     </FadeIn>
 *   ))}
 */
export function FadeIn({ children, duration = 220, delay = 0, variant: variantProp, translateY: translateYProp, style }: FadeInProps) {
  // Resolve variant: explicit prop wins, else project default from MobileStyle.
  const variant: EnterVariant = variantProp ?? MobileStyle.enterAnimation;

  // Per-variant motion config:
  //   • slide-up: opacity 0→1 + translateY 12→0
  //   • scale-up: opacity 0→1 + scale 0.96→1
  //   • fade:     opacity 0→1
  //   • none:     no animation (children render at full opacity instantly)
  //
  // Legacy translateYProp overrides slide-up's default 12px when passed.
  const initialOpacity = variant === 'none' ? 1 : 0;
  const initialTranslateY = (() => {
    if (typeof translateYProp === 'number') return translateYProp;
    if (variant === 'slide-up') return 12;
    return 0;
  })();
  const initialScale = variant === 'scale-up' ? 0.96 : 1;

  const opacity = useSharedValue(initialOpacity);
  const ty = useSharedValue(initialTranslateY);
  const scale = useSharedValue(initialScale);

  useEffect(() => {
    if (variant === 'none') return; // instant — no animation work needed

    const easing = Easing.out(Easing.cubic);
    const start = () => {
      opacity.value = withTiming(1, { duration, easing });
      ty.value = withTiming(0, { duration, easing });
      scale.value = withTiming(1, { duration, easing });
    };

    if (delay > 0) {
      // Reset to starting state, then start after delay.
      opacity.value = initialOpacity;
      ty.value = initialTranslateY;
      scale.value = initialScale;
      const id = setTimeout(start, delay);
      return () => clearTimeout(id);
    }
    start();
    return undefined;
  }, [opacity, ty, scale, duration, delay, variant, initialOpacity, initialTranslateY, initialScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
