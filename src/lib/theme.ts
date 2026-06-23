import { useColorScheme } from 'react-native';

// Clean, calm clinical palette (Apple Health / iOS-Settings inspired): grouped
// backgrounds, white cards, hairline separators, a single medical-teal accent,
// and semantic status colors. Resolved per device color scheme via useTheme().

// The five record categories shown on the wallet. Each gets its own color so the
// grid reads at a glance instead of a wall of one-accent teal.
export type CategoryKey = 'allergy' | 'medication' | 'problem' | 'lab' | 'visit';
export type CategoryColor = { color: string; soft: string };

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
  // Depth — light leans on shadows, dark leans on frosted glass + glow
  glass: boolean; // true → prefer glassEffect cards over flat fills
  shadow: string; // drop-shadow color for elevated cards (light)
  glow: string; // soft accent glow behind the hero (dark)
  heroFrom: string; // hero card fill (top)
  heroTo: string; // hero card fill (bottom / layered)
  // Per-category record colors
  category: Record<CategoryKey, CategoryColor>;
};

// SF Symbol / Material icon names per category (platform-agnostic SF names; the
// Android tree maps these to its own icons).
export const CATEGORY_ICON: Record<CategoryKey, string> = {
  allergy: 'exclamationmark.triangle.fill',
  medication: 'pills.fill',
  problem: 'heart.text.square.fill',
  lab: 'testtube.2',
  visit: 'calendar',
};

export const lightPalette: Palette = {
  bg: '#EEF1F4',
  card: '#FFFFFF',
  cardAlt: '#EEF0F2',
  separator: '#E4E6EA',
  text: '#161A1F',
  textDim: '#5C636B',
  textFaint: '#8A9099',
  accent: '#0E8E82',
  accentSoft: '#DCF1EE',
  onAccent: '#FFFFFF',
  success: '#1FA45A',
  warning: '#E08600',
  danger: '#E0352B',
  dangerSoft: '#FBE6E4',
  glass: false,
  shadow: 'rgba(20,30,48,0.10)',
  glow: 'rgba(14,142,130,0.18)',
  heroFrom: '#0E8E82',
  heroTo: '#0B6F66',
  category: {
    allergy: { color: '#E0352B', soft: '#FCE7E5' },
    medication: { color: '#2D7FF9', soft: '#E5EEFE' },
    problem: { color: '#8B5CF6', soft: '#EEE9FE' },
    lab: { color: '#0E8E82', soft: '#DBF1EE' },
    visit: { color: '#5B6CF0', soft: '#E7E9FD' },
  },
};

export const darkPalette: Palette = {
  bg: '#08090C',
  card: '#16181D',
  cardAlt: '#23262D',
  separator: '#2C2F36',
  text: '#FFFFFF',
  textDim: '#A0A6AD',
  textFaint: '#7C828B',
  accent: '#34C7B5',
  accentSoft: '#143230',
  onAccent: '#04231F',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  dangerSoft: '#3A1715',
  glass: true,
  shadow: 'rgba(0,0,0,0.5)',
  glow: 'rgba(52,199,181,0.22)',
  heroFrom: '#103F3A',
  heroTo: '#0A2A27',
  category: {
    allergy: { color: '#FF6961', soft: '#34191A' },
    medication: { color: '#4DA3FF', soft: '#11233B' },
    problem: { color: '#B79BFF', soft: '#241B36' },
    lab: { color: '#34C7B5', soft: '#143230' },
    visit: { color: '#8E9BFF', soft: '#1A1E38' },
  },
};

// Resolve the active palette for the current device appearance.
export function useTheme(): { palette: Palette; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return { palette: dark ? darkPalette : lightPalette, scheme: dark ? 'dark' : 'light' };
}

// Back-compat default (dark) for any non-hook consumer. Prefer useTheme().
export const palette = darkPalette;
