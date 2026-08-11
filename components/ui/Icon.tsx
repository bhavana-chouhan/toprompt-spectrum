import React from 'react';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';

export type IconFamily = 'ionicons' | 'material' | 'feather';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  family?: IconFamily;
}

export function Icon({ name, size = 24, color, family = 'ionicons' }: IconProps) {
  const { colors } = useTheme();
  const resolvedColor = color || colors.text;
  // Runtime guard: an icon name absent from the bundled glyphMap renders the
  // font's "?" glyph. Validate against the family's real glyphMap and fall back
  // to a neutral real glyph so a stray/hallucinated name never shows "?".
  switch (family) {
    case 'material': {
      const n = (name in MaterialIcons.glyphMap ? name : 'help-outline') as keyof typeof MaterialIcons.glyphMap;
      return <MaterialIcons name={n} size={size} color={resolvedColor} />;
    }
    case 'feather': {
      const n = (name in Feather.glyphMap ? name : 'help-circle') as keyof typeof Feather.glyphMap;
      return <Feather name={n} size={size} color={resolvedColor} />;
    }
    case 'ionicons':
    default: {
      const n = (name in Ionicons.glyphMap ? name : 'ellipse-outline') as keyof typeof Ionicons.glyphMap;
      return <Ionicons name={n} size={size} color={resolvedColor} />;
    }
  }
}