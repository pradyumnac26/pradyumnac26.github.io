export type ThemeMode = 'light' | 'dark' | 'system';

export type TimeOfDayPreset = 'dawn' | 'noon' | 'sunset' | 'midnight';

export interface SceneConfig {
  timeProgress: number; // 0 (noon / full light) to 1 (midnight / full dark)
  isAnimating: boolean;
  autoCycle: boolean;
  cycleSpeed: number; // seconds per full day/night cycle
  zoom: number; // 1, 2, 3, or -1 for fit
  panX: number; // horizontal pan offset
  autoPan: boolean;
  showGrid: boolean;
  particlesEnabled: boolean;
}

export interface ColorStop {
  r: number;
  g: number;
  b: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  phase: number;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  layer: number;
  shape: number[][];
}

export interface Bird {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  frame: number;
  flapTimer: number;
}

export interface Firefly {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  phase: number;
  speed: number;
  color: string;
}

export interface ChimneySmoke {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Ripple {
  x: number;
  y: number;
  width: number;
  phase: number;
  speed: number;
}
