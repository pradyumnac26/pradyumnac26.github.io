// Curated 16-bit / retro color palettes for Day (Light Mode) and Night (Dark Mode)

export interface PaletteColor {
  name: string;
  lightHex: string;
  darkHex: string;
  category: 'sky' | 'mountains' | 'foliage' | 'cabin' | 'water' | 'accent';
}

export const PALETTE_SWATCHES: PaletteColor[] = [
  { name: 'Sky Zenith', lightHex: '#6bb8f0', darkHex: '#0c0f26', category: 'sky' },
  { name: 'Sky Mid', lightHex: '#9cd1f5', darkHex: '#181a42', category: 'sky' },
  { name: 'Sky Horizon', lightHex: '#fedac2', darkHex: '#2b295c', category: 'sky' },
  { name: 'Sun / Moon Body', lightHex: '#fff29e', darkHex: '#f4f6fd', category: 'accent' },
  { name: 'Sun Rays / Lunar Glow', lightHex: '#ffe478', darkHex: '#8aa2d9', category: 'accent' },
  { name: 'Distant Peaks', lightHex: '#8da6ce', darkHex: '#232342', category: 'mountains' },
  { name: 'Mountain Snow / Rim', lightHex: '#f2f8fc', darkHex: '#4d547d', category: 'mountains' },
  { name: 'Midground Ridge', lightHex: '#4d7c77', darkHex: '#142533', category: 'foliage' },
  { name: 'Deep Forest Pine', lightHex: '#2b5742', darkHex: '#0d1c24', category: 'foliage' },
  { name: 'Pine Highlight', lightHex: '#4d8a55', darkHex: '#193339', category: 'foliage' },
  { name: 'Lakeside Cabin Walls', lightHex: '#8c593b', darkHex: '#3d251c', category: 'cabin' },
  { name: 'Cabin Roof Tiles', lightHex: '#b3473b', darkHex: '#421c1c', category: 'cabin' },
  { name: 'Window Light', lightHex: '#d8ebf5', darkHex: '#ffbe3b', category: 'cabin' },
  { name: 'Lantern Glow', lightHex: '#ffdd73', darkHex: '#ff981a', category: 'accent' },
  { name: 'Water Surface', lightHex: '#4fa1c7', darkHex: '#111d33', category: 'water' },
  { name: 'Water Ripple Glint', lightHex: '#c7eafc', darkHex: '#3a5987', category: 'water' },
  { name: 'Shoreline Earth', lightHex: '#614835', darkHex: '#1f1a18', category: 'cabin' },
  { name: 'Wildflowers', lightHex: '#f05d5e', darkHex: '#52e396', category: 'accent' },
];

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function lerpColor(hexA: string, hexB: string, t: number): string {
  const cA = hexToRgb(hexA);
  const cB = hexToRgb(hexB);
  const r = cA.r + (cB.r - cA.r) * t;
  const g = cA.g + (cB.g - cA.g) * t;
  const b = cA.b + (cB.b - cA.b) * t;
  return rgbToHex(r, g, b);
}

// Multi-point color interpolation for 24h sky gradients
export function interpolateGradient(
  t: number, // 0 = noon (light mode), 0.5 = sunset/dusk, 1.0 = midnight (dark mode)
  stops: { pos: number; hex: string }[]
): string {
  if (t <= stops[0].pos) return stops[0].hex;
  if (t >= stops[stops.length - 1].pos) return stops[stops.length - 1].hex;

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (t >= s1.pos && t <= s2.pos) {
      const localT = (t - s1.pos) / (s2.pos - s1.pos);
      return lerpColor(s1.hex, s2.hex, localT);
    }
  }
  return stops[0].hex;
}
