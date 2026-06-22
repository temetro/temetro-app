import { useColorScheme } from 'react-native';

// Clean, calm clinical palette (Apple Health / iOS-Settings inspired): grouped
// backgrounds, white cards, hairline separators, a single medical-teal accent,
// and semantic status colors. Resolved per device color scheme via useTheme().

export type Palette = {
  // Surfaces
  bg: string; // grouped page background (behind cards)
  card: string; // primary grouped card surface
  cardAlt: string; // secondary fill (inputs, chips, pressed rows)
  separator: string; // hairline divider between rows
  // Text
  text: string; // primary label
  textDim: string; // secondary label
  textFaint: string; // tertiary label / captions
  // Accent + tints
  accent: string; // medical teal — primary action / icons
  accentSoft: string; // faint accent fill for icon chips
  onAccent: string; // text/icon on a solid accent
  // Semantic
  success: string;
  warning: string;
  danger: string;
  dangerSoft: string;
};

export const lightPalette: Palette = {
  bg: '#F2F3F5',
  card: '#FFFFFF',
  cardAlt: '#EEF0F2',
  separator: '#E4E6EA',
  text: '#1A1C1E',
  textDim: '#5C636B',
  textFaint: '#8A9099',
  accent: '#0E8E82',
  accentSoft: '#DCF1EE',
  onAccent: '#FFFFFF',
  success: '#1FA45A',
  warning: '#E08600',
  danger: '#E0352B',
  dangerSoft: '#FBE6E4',
};

export const darkPalette: Palette = {
  bg: '#000000',
  card: '#1C1C1E',
  cardAlt: '#2C2C2E',
  separator: '#38383A',
  text: '#FFFFFF',
  textDim: '#A0A6AD',
  textFaint: '#8A9099',
  accent: '#34C7B5',
  accentSoft: '#143230',
  onAccent: '#04231F',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  dangerSoft: '#3A1715',
};

// Resolve the active palette for the current device appearance.
export function useTheme(): { palette: Palette; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return { palette: dark ? darkPalette : lightPalette, scheme: dark ? 'dark' : 'light' };
}

// Back-compat default (dark) for any non-hook consumer. Prefer useTheme().
export const palette = darkPalette;
