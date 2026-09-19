import { Bird, Cloud, Firefly, Ripple, Star } from './types';
import { interpolateGradient, lerpColor } from './palette';

export const CANVAS_WIDTH = 512;
export const CANVAS_HEIGHT = 192;

export interface RenderState {
  timeProgress: number; // 0 = noon (light), 0.5 = sunset, 1 = midnight (dark)
  animationTime: number; // seconds
  panX: number;
  showGrid: boolean;
  mouseHoverX: number | null;
  mouseHoverY: number | null;
}

export class PixelArtworkRenderer {
  private stars: Star[] = [];
  private clouds: Cloud[] = [];
  private birds: Bird[] = [];
  private fireflies: Firefly[] = [];
  private ripples: Ripple[] = [];
  private shootingStar: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number } | null = null;
  private nextShootingStarTime = 5;

  constructor() {
    this.initEntities();
  }

  private initEntities() {
    // Generate static stars
    this.stars = [];
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * CANVAS_WIDTH),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT * 0.55)),
        size: Math.random() > 0.85 ? 2 : 1,
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 1.5 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Generate clouds
    this.clouds = [
      { x: 30, y: 22, width: 64, height: 16, speed: 1.2, layer: 0, shape: this.generateCloudShape(64, 16, 1) },
      { x: 180, y: 14, width: 90, height: 20, speed: 0.9, layer: 0, shape: this.generateCloudShape(90, 20, 2) },
      { x: 350, y: 28, width: 72, height: 18, speed: 1.4, layer: 1, shape: this.generateCloudShape(72, 18, 3) },
      { x: 470, y: 18, width: 80, height: 18, speed: 1.0, layer: 0, shape: this.generateCloudShape(80, 18, 4) },
      { x: -50, y: 35, width: 50, height: 14, speed: 1.8, layer: 1, shape: this.generateCloudShape(50, 14, 5) },
    ];

    // Generate birds (daytime)
    this.birds = [
      { x: 60, y: 45, speedX: 18, speedY: -0.5, frame: 0, flapTimer: 0 },
      { x: 45, y: 52, speedX: 18, speedY: 0.2, frame: 1, flapTimer: 0.1 },
      { x: 28, y: 48, speedX: 18, speedY: -0.1, frame: 2, flapTimer: 0.2 },
      { x: 340, y: 38, speedX: 14, speedY: 0.3, frame: 1, flapTimer: 0.3 },
    ];

    // Generate fireflies (nighttime)
    this.fireflies = [];
    for (let i = 0; i < 18; i++) {
      const baseX = 80 + Math.random() * 380;
      const baseY = 120 + Math.random() * 60;
      this.fireflies.push({
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.2,
        color: Math.random() > 0.4 ? '#a7f3d0' : '#fef08a',
      });
    }

    // Water ripples
    this.ripples = [];
    for (let i = 0; i < 24; i++) {
      this.ripples.push({
        x: Math.floor(Math.random() * CANVAS_WIDTH),
        y: 122 + Math.floor(Math.random() * 60),
        width: 4 + Math.floor(Math.random() * 12),
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 2,
      });
    }
  }

  private generateCloudShape(w: number, h: number, seed: number): number[][] {
    const map: number[][] = [];
    for (let y = 0; y < h; y++) {
      map[y] = [];
      for (let x = 0; x < w; x++) {
        // Create fluffy cloud bounding ellipses
        const dx = (x - w / 2) / (w / 2);
        const dy = (y - h / 2) / (h / 2);
        const dist = dx * dx + dy * dy;

        // Lump 1
        const d1 = Math.hypot(x - w * 0.35, y - h * 0.55) / (h * 0.5);
        // Lump 2
        const d2 = Math.hypot(x - w * 0.6, y - h * 0.5) / (h * 0.55);
        // Lump 3
        const d3 = Math.hypot(x - w * 0.8, y - h * 0.6) / (h * 0.4);

        const inside = dist < 0.95 || d1 < 1.0 || d2 < 1.1 || d3 < 0.9;
        // Bottom flat edge for clouds
        if (inside && y < h - 2) {
          map[y][x] = y < h * 0.45 ? 1 : 2; // 1 = highlight, 2 = body/shadow
        } else {
          map[y][x] = 0;
        }
      }
    }
    return map;
  }

  public update(dt: number, state: RenderState) {
    const { timeProgress } = state;

    // Update clouds (drift left to right, wrap around)
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * dt * 4;
      if (cloud.x > CANVAS_WIDTH + 60) {
        cloud.x = -cloud.width - 20;
      }
    }

    // Update birds (active mostly in light mode: timeProgress < 0.6)
    for (const bird of this.birds) {
      bird.x += bird.speedX * dt;
      bird.y += bird.speedY * dt;
      bird.flapTimer += dt;
      if (bird.flapTimer > 0.15) {
        bird.flapTimer = 0;
        bird.frame = (bird.frame + 1) % 4;
      }
      if (bird.x > CANVAS_WIDTH + 30) {
        bird.x = -20;
        bird.y = 35 + Math.random() * 30;
      }
    }

    // Update fireflies
    for (const ff of this.fireflies) {
      ff.phase += ff.speed * dt;
      ff.x = ff.baseX + Math.sin(ff.phase * 0.8) * 12;
      ff.y = ff.baseY + Math.cos(ff.phase * 1.2) * 6;
    }

    // Update shooting star in dark mode
    if (timeProgress > 0.55) {
      this.nextShootingStarTime -= dt;
      if (this.nextShootingStarTime <= 0 && !this.shootingStar) {
        this.shootingStar = {
          x: 40 + Math.random() * (CANVAS_WIDTH - 120),
          y: 10 + Math.random() * 40,
          vx: 180 + Math.random() * 60,
          vy: 80 + Math.random() * 40,
          life: 0,
          maxLife: 0.6 + Math.random() * 0.4,
        };
        this.nextShootingStarTime = 6 + Math.random() * 8;
      }
    }

    if (this.shootingStar) {
      this.shootingStar.life += dt;
      this.shootingStar.x += this.shootingStar.vx * dt;
      this.shootingStar.y += this.shootingStar.vy * dt;
      if (this.shootingStar.life >= this.shootingStar.maxLife) {
        this.shootingStar = null;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, state: RenderState) {
    const { timeProgress, animationTime, panX, showGrid } = state;

    ctx.save();
    // Disable anti-aliasing for pure pixel sharpness
    ctx.imageSmoothingEnabled = false;

    // Apply pan offset
    ctx.translate(-panX, 0);

    // 1. SKY & DITHERED BACKGROUND
    this.renderSky(ctx, timeProgress);

    // 2. STARS (Dark mode)
    if (timeProgress > 0.25) {
      const starAlpha = Math.min(1, (timeProgress - 0.25) / 0.4);
      this.renderStars(ctx, animationTime, starAlpha);
    }

    // 3. SUN / MOON CELESTIAL BODIES
    this.renderCelestialBodies(ctx, timeProgress, animationTime);

    // 4. CLOUDS (Parallax layer 0 & 1)
    this.renderClouds(ctx, timeProgress);

    // 5. DISTANT MOUNTAIN RANGE (Far)
    this.renderDistantMountains(ctx, timeProgress);

    // 6. MIDGROUND MOUNTAINS & RIDGES
    this.renderMidMountains(ctx, timeProgress);

    // 7. PINE FOREST & LAKE SHORELINE
    this.renderForestRidges(ctx, timeProgress, animationTime);

    // 8. WATER BODY & REFLECTIONS
    this.renderWater(ctx, timeProgress, animationTime);

    // 9. COZY CABIN & PIER (Architectural focal point)
    this.renderCabinAndPier(ctx, timeProgress, animationTime);

    // 10. FOREGROUND SHORELINE, REEDS & WILDFLOWERS
    this.renderForeground(ctx, timeProgress, animationTime);

    // 11. ANIMATED WILDLIFE (Birds in Day / Fireflies in Night)
    if (timeProgress < 0.65) {
      this.renderBirds(ctx, 1 - (timeProgress > 0.4 ? (timeProgress - 0.4) / 0.25 : 0));
    }
    if (timeProgress > 0.35) {
      this.renderFireflies(ctx, Math.min(1, (timeProgress - 0.35) / 0.35), animationTime);
    }

    // 12. OPTIONAL PIXEL GRID OVERLAY
    if (showGrid) {
      this.renderGridOverlay(ctx);
    }

    ctx.restore();
  }

  private renderSky(ctx: CanvasRenderingContext2D, t: number) {
    // Sky gradient stops transitioning from Day (t=0) through Sunset (t=0.5) to Midnight (t=1.0)
    // Day Sky: Crisp turquoise / sky blue -> soft pale peach horizon
    // Sunset Sky: Amber / violet -> fiery peach -> golden horizon
    // Dark Sky: Obsidian midnight -> cosmic dark indigo -> twilight slate
    const skyTop = interpolateGradient(t, [
      { pos: 0.0, hex: '#58a4e0' },
      { pos: 0.4, hex: '#406da8' },
      { pos: 0.55, hex: '#312c62' },
      { pos: 0.75, hex: '#161738' },
      { pos: 1.0, hex: '#090a18' },
    ]);

    const skyMid = interpolateGradient(t, [
      { pos: 0.0, hex: '#87c6f5' },
      { pos: 0.4, hex: '#778fc6' },
      { pos: 0.55, hex: '#764375' },
      { pos: 0.75, hex: '#26224c' },
      { pos: 1.0, hex: '#11132a' },
    ]);

    const skyHorizon = interpolateGradient(t, [
      { pos: 0.0, hex: '#fedbc4' },
      { pos: 0.4, hex: '#fdb598' },
      { pos: 0.55, hex: '#e66858' },
      { pos: 0.75, hex: '#4b3558' },
      { pos: 1.0, hex: '#1e1c3a' },
    ]);

    const skyHeight = 126;
    const bandHeight = 4;
    const bands = Math.ceil(skyHeight / bandHeight);

    for (let b = 0; b < bands; b++) {
      const norm = b / bands;
      let color: string;
      if (norm < 0.5) {
        color = lerpColor(skyTop, skyMid, norm * 2);
      } else {
        color = lerpColor(skyMid, skyHorizon, (norm - 0.5) * 2);
      }

      ctx.fillStyle = color;
      ctx.fillRect(0, b * bandHeight, CANVAS_WIDTH, bandHeight);

      // Pixel dithering on transitions between bands (checkerboard 1x1 pixels)
      if (b > 0 && b < bands - 1) {
        ctx.fillStyle = color;
        const prevY = (b - 1) * bandHeight + bandHeight - 1;
        for (let x = 0; x < CANVAS_WIDTH; x += 2) {
          if ((x / 2 + b) % 2 === 0) {
            ctx.fillRect(x, prevY, 1, 1);
          }
        }
      }
    }
  }

  private renderStars(ctx: CanvasRenderingContext2D, animTime: number, alpha: number) {
    ctx.save();
    for (const star of this.stars) {
      const twinkle = Math.sin(animTime * star.twinkleSpeed + star.phase);
      const curAlpha = alpha * (star.brightness * 0.6 + twinkle * 0.4);
      if (curAlpha <= 0.05) continue;

      ctx.fillStyle = `rgba(240, 244, 255, ${Math.min(1, curAlpha).toFixed(2)})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);

      // 4-point cross glint on bigger stars
      if (star.size === 2 && twinkle > 0.4) {
        ctx.fillStyle = `rgba(220, 235, 255, ${(curAlpha * 0.6).toFixed(2)})`;
        ctx.fillRect(star.x - 1, star.y, 1, 1);
        ctx.fillRect(star.x + 2, star.y, 1, 1);
        ctx.fillRect(star.x, star.y - 1, 1, 1);
        ctx.fillRect(star.x, star.y + 2, 1, 1);
      }
    }

    // Shooting star
    if (this.shootingStar) {
      const ss = this.shootingStar;
      const progress = ss.life / ss.maxLife;
      const trailLength = 12 * (1 - progress);
      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - progress).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - (ss.vx / 100) * trailLength, ss.y - (ss.vy / 100) * trailLength);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.floor(ss.x), Math.floor(ss.y), 2, 2);
    }
    ctx.restore();
  }

  private renderCelestialBodies(ctx: CanvasRenderingContext2D, t: number, animTime: number) {
    // In light mode (t=0): Sun is visible, positioned around (110, 36)
    // In dark mode (t=1): Moon is visible, positioned around (390, 32)
    // As t slides, sun sets downward, moon rises

    // --- SUN ---
    if (t < 0.7) {
      const sunAlpha = Math.max(0, 1 - t * 1.5);
      const sunY = 32 + t * 50; // sets downward
      const sunX = 120 + t * 40;

      ctx.save();
      // Sun outer aura
      ctx.fillStyle = `rgba(255, 240, 160, ${(sunAlpha * 0.25).toFixed(2)})`;
      ctx.fillRect(sunX - 10, sunY - 10, 20, 20);

      // Sun halo
      ctx.fillStyle = `rgba(255, 220, 120, ${(sunAlpha * 0.5).toFixed(2)})`;
      ctx.fillRect(sunX - 7, sunY - 7, 14, 14);

      // Sun core
      ctx.fillStyle = `rgba(255, 250, 210, ${(sunAlpha * 0.95).toFixed(2)})`;
      ctx.fillRect(sunX - 5, sunY - 5, 10, 10);
      ctx.fillStyle = `rgba(255, 255, 255, ${(sunAlpha).toFixed(2)})`;
      ctx.fillRect(sunX - 3, sunY - 3, 6, 6);

      // Animated glint rays
      const glint = Math.sin(animTime * 2);
      if (glint > 0) {
        ctx.fillStyle = `rgba(255, 235, 150, ${(sunAlpha * 0.6).toFixed(2)})`;
        ctx.fillRect(sunX - 12, sunY - 1, 3, 2);
        ctx.fillRect(sunX + 9, sunY - 1, 3, 2);
        ctx.fillRect(sunX - 1, sunY - 12, 2, 3);
        ctx.fillRect(sunX - 1, sunY + 9, 2, 3);
      }
      ctx.restore();
    }

    // --- MOON ---
    if (t > 0.3) {
      const moonAlpha = Math.min(1, (t - 0.3) / 0.5);
      const moonY = 32 + (1 - t) * 35; // rises
      const moonX = 390 - (1 - t) * 30;

      ctx.save();
      // Moon soft outer glow
      ctx.fillStyle = `rgba(180, 210, 255, ${(moonAlpha * 0.18).toFixed(2)})`;
      ctx.fillRect(moonX - 12, moonY - 12, 24, 24);

      // Moon halo
      ctx.fillStyle = `rgba(215, 230, 255, ${(moonAlpha * 0.35).toFixed(2)})`;
      ctx.fillRect(moonX - 8, moonY - 8, 16, 16);

      // Crescent Moon shape (pixel art bitmap)
      const crescentMap = [
        [0,0,1,1,1,0,0],
        [0,1,1,1,1,1,0],
        [1,1,1,0,0,0,0],
        [1,1,1,0,0,0,0],
        [1,1,1,0,0,0,0],
        [1,1,1,0,0,0,0],
        [0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0],
      ];

      for (let r = 0; r < crescentMap.length; r++) {
        for (let c = 0; c < crescentMap[r].length; c++) {
          if (crescentMap[r][c] === 1) {
            ctx.fillStyle = `rgba(244, 247, 255, ${(moonAlpha * 0.95).toFixed(2)})`;
            ctx.fillRect(moonX - 4 + c * 2, moonY - 8 + r * 2, 2, 2);
          }
        }
      }

      // Moon crater accent
      ctx.fillStyle = `rgba(185, 200, 235, ${(moonAlpha * 0.8).toFixed(2)})`;
      ctx.fillRect(moonX - 1, moonY - 3, 2, 2);
      ctx.fillRect(moonX - 2, moonY + 2, 2, 2);

      ctx.restore();
    }
  }

  private renderClouds(ctx: CanvasRenderingContext2D, t: number) {
    const cloudHighlight = interpolateGradient(t, [
      { pos: 0.0, hex: '#ffffff' },
      { pos: 0.5, hex: '#fed6b2' },
      { pos: 0.7, hex: '#a68ea6' },
      { pos: 1.0, hex: '#373859' },
    ]);

    const cloudShadow = interpolateGradient(t, [
      { pos: 0.0, hex: '#bfdaf0' },
      { pos: 0.5, hex: '#d48880' },
      { pos: 0.7, hex: '#584668' },
      { pos: 1.0, hex: '#1c1d33' },
    ]);

    ctx.save();
    for (const cloud of this.clouds) {
      const cx = Math.floor(cloud.x);
      const cy = Math.floor(cloud.y);
      const map = cloud.shape;

      for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
          const val = map[y][x];
          if (val === 0) continue;

          ctx.fillStyle = val === 1 ? cloudHighlight : cloudShadow;
          ctx.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    }
    ctx.restore();
  }

  private renderDistantMountains(ctx: CanvasRenderingContext2D, t: number) {
    // Peak color: light snow vs dark starry rim
    const snowColor = interpolateGradient(t, [
      { pos: 0.0, hex: '#f3f8fd' },
      { pos: 0.5, hex: '#fed2be' },
      { pos: 0.75, hex: '#636585' },
      { pos: 1.0, hex: '#3b3d5b' },
    ]);

    const slopeColor = interpolateGradient(t, [
      { pos: 0.0, hex: '#87a2cb' },
      { pos: 0.5, hex: '#945f78' },
      { pos: 0.75, hex: '#2c2c4d' },
      { pos: 1.0, hex: '#16172e' },
    ]);

    // Height array for distant peaks (procedural silhouette across CANVAS_WIDTH)
    ctx.save();
    for (let x = 0; x < CANVAS_WIDTH; x++) {
      // Primary peaks + secondary harmonies
      const peak1 = Math.max(0, 48 - Math.abs(x - 110) * 0.55);
      const peak2 = Math.max(0, 56 - Math.abs(x - 220) * 0.6);
      const peak3 = Math.max(0, 42 - Math.abs(x - 360) * 0.5);
      const peak4 = Math.max(0, 52 - Math.abs(x - 450) * 0.58);
      const noise = Math.sin(x * 0.12) * 2.5 + Math.sin(x * 0.05) * 5;

      const peakHeight = Math.max(peak1, peak2, peak3, peak4) + noise;
      const topY = Math.floor(106 - peakHeight);

      // Mountain body
      ctx.fillStyle = slopeColor;
      ctx.fillRect(x, topY, 1, 116 - topY);

      // Snow-capped peak tips
      if (peakHeight > 24) {
        const snowDepth = Math.floor((peakHeight - 24) * 0.45);
        ctx.fillStyle = snowColor;
        ctx.fillRect(x, topY, 1, snowDepth);

        // Snow dither edge
        if (x % 2 === 0) {
          ctx.fillRect(x, topY + snowDepth, 1, 2);
        }
      }
    }
    ctx.restore();
  }

  private renderMidMountains(ctx: CanvasRenderingContext2D, t: number) {
    const ridgeColor = interpolateGradient(t, [
      { pos: 0.0, hex: '#587f7a' },
      { pos: 0.5, hex: '#5b4d66' },
      { pos: 0.75, hex: '#1e2439' },
      { pos: 1.0, hex: '#101426' },
    ]);

    const highlightColor = interpolateGradient(t, [
      { pos: 0.0, hex: '#7ea898' },
      { pos: 0.5, hex: '#87697c' },
      { pos: 0.75, hex: '#2b334d' },
      { pos: 1.0, hex: '#1c223a' },
    ]);

    ctx.save();
    for (let x = 0; x < CANVAS_WIDTH; x++) {
      const wave = Math.sin(x * 0.02) * 14 + Math.sin(x * 0.06) * 6 + Math.cos(x * 0.015) * 8;
      const topY = Math.floor(104 - wave);

      ctx.fillStyle = ridgeColor;
      ctx.fillRect(x, topY, 1, 122 - topY);

      // Highlight on crest
      ctx.fillStyle = highlightColor;
      ctx.fillRect(x, topY, 1, 2);
    }
    ctx.restore();
  }

  private renderForestRidges(ctx: CanvasRenderingContext2D, t: number, animTime: number) {
    const pineDark = interpolateGradient(t, [
      { pos: 0.0, hex: '#224a35' },
      { pos: 0.5, hex: '#2d3338' },
      { pos: 0.75, hex: '#0f1d1d' },
      { pos: 1.0, hex: '#0a1215' },
    ]);

    const pineMid = interpolateGradient(t, [
      { pos: 0.0, hex: '#376846' },
      { pos: 0.5, hex: '#3f4b46' },
      { pos: 0.75, hex: '#162826' },
      { pos: 1.0, hex: '#0e1a1c' },
    ]);

    const pineLight = interpolateGradient(t, [
      { pos: 0.0, hex: '#568b5e' },
      { pos: 0.5, hex: '#5a6b5c' },
      { pos: 0.75, hex: '#213b35' },
      { pos: 1.0, hex: '#152528' },
    ]);

    ctx.save();
    // Render back tree row
    const treePositions = [
      8, 18, 30, 42, 58, 72, 85, 96, 110, 126, 140, 155, 172, 190, 206, 222, 240, 255,
      270, 285, 305, 320, 338, 356, 375, 395, 412, 430, 448, 465, 482, 498, 510
    ];

    for (let i = 0; i < treePositions.length; i++) {
      const tx = treePositions[i];
      // Skip where cabin sits (around x=280..320)
      if (tx >= 272 && tx <= 326) continue;

      const heightSeed = (i * 7) % 5;
      const treeH = 14 + heightSeed * 2;
      const baseY = 118 + (i % 3);

      this.drawPineTree(ctx, tx, baseY, treeH, pineDark, pineMid, pineLight);
    }
    ctx.restore();
  }

  private drawPineTree(
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    h: number,
    dark: string,
    mid: string,
    light: string
  ) {
    const topY = baseY - h;
    const tiers = 3;
    const tierHeight = Math.floor(h / tiers);

    for (let tier = 0; tier < tiers; tier++) {
      const tTop = topY + tier * tierHeight;
      const tBottom = tTop + tierHeight + 2;
      const maxW = 3 + tier * 2;

      for (let y = tTop; y <= tBottom; y++) {
        const prog = (y - tTop) / (tBottom - tTop);
        const w = Math.floor(prog * maxW);

        for (let dx = -w; dx <= w; dx++) {
          const px = x + dx;
          if (dx < 0) {
            ctx.fillStyle = light; // left sunlit side
          } else if (dx === 0) {
            ctx.fillStyle = mid;
          } else {
            ctx.fillStyle = dark; // right shadow side
          }
          ctx.fillRect(px, y, 1, 1);
        }
      }
    }
  }

  private renderWater(ctx: CanvasRenderingContext2D, t: number, animTime: number) {
    // Water surface color transition
    const waterDeep = interpolateGradient(t, [
      { pos: 0.0, hex: '#2f688a' },
      { pos: 0.5, hex: '#37395e' },
      { pos: 0.75, hex: '#111728' },
      { pos: 1.0, hex: '#080d19' },
    ]);

    const waterSurface = interpolateGradient(t, [
      { pos: 0.0, hex: '#488eb5' },
      { pos: 0.5, hex: '#584f73' },
      { pos: 0.75, hex: '#17223b' },
      { pos: 1.0, hex: '#0d1626' },
    ]);

    const rippleColor = interpolateGradient(t, [
      { pos: 0.0, hex: '#aee2f9' },
      { pos: 0.5, hex: '#fecfae' },
      { pos: 0.75, hex: '#3e527d' },
      { pos: 1.0, hex: '#233352' },
    ]);

    const waterTop = 120;
    const waterBottom = CANVAS_HEIGHT;

    ctx.save();
    // Base gradient for water depth
    const grad = ctx.createLinearGradient(0, waterTop, 0, waterBottom);
    grad.addColorStop(0, waterSurface);
    grad.addColorStop(1, waterDeep);
    ctx.fillStyle = grad;
    ctx.fillRect(0, waterTop, CANVAS_WIDTH, waterBottom - waterTop);

    // Mountain and Sky Mirror Reflection
    this.renderWaterReflections(ctx, t, waterTop, animTime);

    // Animated water wave ripple bands
    for (const rip of this.ripples) {
      const phase = rip.phase + animTime * rip.speed;
      const alpha = (Math.sin(phase) + 1) * 0.4;
      if (alpha < 0.15) continue;

      const rw = rip.width + Math.floor(Math.sin(phase * 1.5) * 3);
      const rx = (rip.x + Math.sin(phase * 0.5) * 4) % CANVAS_WIDTH;
      const ry = rip.y;

      ctx.fillStyle = rippleColor;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillRect(rx, ry, rw, 1);

      // Mirror pixel glint
      if (Math.sin(phase * 2) > 0.7) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.8;
        ctx.fillRect(rx + Math.floor(rw / 2), ry, 1, 1);
      }
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  }

  private renderWaterReflections(ctx: CanvasRenderingContext2D, t: number, waterTop: number, animTime: number) {
    // Reflection of Moon / Sun on water
    if (t > 0.3) {
      // Moon column reflection (around x=390)
      const moonAlpha = Math.min(1, (t - 0.3) / 0.5);
      const moonX = 390 - (1 - t) * 30;

      for (let y = waterTop + 2; y < waterTop + 55; y += 2) {
        const spread = (y - waterTop) * 0.25;
        const waveOffset = Math.sin(y * 0.4 + animTime * 3) * (2 + spread * 0.3);
        const refW = Math.max(1, 8 - (y - waterTop) * 0.12);

        ctx.fillStyle = `rgba(225, 238, 255, ${(moonAlpha * (0.35 - (y - waterTop) * 0.005)).toFixed(2)})`;
        ctx.fillRect(moonX - refW / 2 + waveOffset, y, refW, 1);
      }
    } else {
      // Sun column reflection (around x=120)
      const sunAlpha = 1 - t * 1.5;
      const sunX = 120 + t * 40;

      for (let y = waterTop + 2; y < waterTop + 50; y += 2) {
        const spread = (y - waterTop) * 0.2;
        const waveOffset = Math.sin(y * 0.35 + animTime * 2.5) * (2 + spread * 0.25);
        const refW = Math.max(1, 10 - (y - waterTop) * 0.15);

        ctx.fillStyle = `rgba(255, 240, 180, ${(sunAlpha * (0.4 - (y - waterTop) * 0.006)).toFixed(2)})`;
        ctx.fillRect(sunX - refW / 2 + waveOffset, y, refW, 1);
      }
    }

    // Cabin window amber reflection in dark mode
    if (t > 0.25) {
      const windowAlpha = Math.min(1, (t - 0.25) / 0.4);
      const cabinWindowX = 296;

      for (let y = waterTop + 1; y < waterTop + 32; y += 2) {
        const waveOffset = Math.sin(y * 0.5 + animTime * 4) * 2;
        const fade = 1 - (y - waterTop) / 32;
        ctx.fillStyle = `rgba(255, 185, 55, ${(windowAlpha * fade * 0.45).toFixed(2)})`;
        ctx.fillRect(cabinWindowX + waveOffset, y, 6, 1);
      }
    }
  }

  private renderCabinAndPier(ctx: CanvasRenderingContext2D, t: number, animTime: number) {
    const cabinX = 282;
    const cabinY = 98;
    const cabinW = 34;
    const cabinH = 24;

    const wallColor = interpolateGradient(t, [
      { pos: 0.0, hex: '#8b5a3e' },
      { pos: 0.5, hex: '#633c2a' },
      { pos: 1.0, hex: '#261812' },
    ]);

    const roofColor = interpolateGradient(t, [
      { pos: 0.0, hex: '#aa4638' },
      { pos: 0.5, hex: '#772e25' },
      { pos: 1.0, hex: '#2b1414' },
    ]);

    const roofHighlight = interpolateGradient(t, [
      { pos: 0.0, hex: '#c85e4e' },
      { pos: 0.5, hex: '#934438' },
      { pos: 1.0, hex: '#452222' },
    ]);

    const chimneyStone = interpolateGradient(t, [
      { pos: 0.0, hex: '#737785' },
      { pos: 0.5, hex: '#4c4e57' },
      { pos: 1.0, hex: '#1e1f24' },
    ]);

    ctx.save();
    // Chimney
    const chimX = cabinX + 6;
    const chimY = cabinY - 8;
    ctx.fillStyle = chimneyStone;
    ctx.fillRect(chimX, chimY, 5, 12);
    ctx.fillRect(chimX - 1, chimY, 7, 2); // chimney cap

    // Animated Chimney Smoke puffs (drifting up and right)
    this.renderChimneySmoke(ctx, chimX + 2, chimY - 1, animTime, t);

    // Cabin Walls
    ctx.fillStyle = wallColor;
    ctx.fillRect(cabinX, cabinY + 8, cabinW, cabinH - 8);

    // Wood log horizontal grain lines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let ly = cabinY + 11; ly < cabinY + cabinH; ly += 3) {
      ctx.fillRect(cabinX, ly, cabinW, 1);
    }

    // Triangular Roof
    const roofOverhang = 4;
    const roofBaseY = cabinY + 8;
    const roofApexY = cabinY - 4;
    const roofMidX = cabinX + cabinW / 2;

    for (let y = roofApexY; y <= roofBaseY; y++) {
      const prog = (y - roofApexY) / (roofBaseY - roofApexY);
      const halfW = Math.floor(prog * (cabinW / 2 + roofOverhang));
      ctx.fillStyle = roofColor;
      ctx.fillRect(roofMidX - halfW, y, halfW * 2, 1);

      // Left roof sun/moon edge highlight
      ctx.fillStyle = roofHighlight;
      ctx.fillRect(roofMidX - halfW, y, 2, 1);
    }

    // Door
    const doorX = cabinX + 8;
    const doorY = cabinY + 14;
    ctx.fillStyle = '#422416';
    ctx.fillRect(doorX, doorY, 6, 10);
    // Brass door knob
    ctx.fillStyle = t > 0.5 ? '#ffcc44' : '#eedd88';
    ctx.fillRect(doorX + 4, doorY + 5, 1, 1);

    // Cozy Paned Window
    const winX = cabinX + 20;
    const winY = cabinY + 12;
    const winW = 8;
    const winH = 8;

    if (t > 0.25) {
      // NIGHT: Warm glowing window with light frame
      const glowAlpha = Math.min(1, (t - 0.25) / 0.4);

      // Cast light onto grass / deck
      ctx.fillStyle = `rgba(255, 190, 60, ${(glowAlpha * 0.2).toFixed(2)})`;
      ctx.fillRect(winX - 3, winY + 9, 14, 8);

      // Window glow interior
      ctx.fillStyle = '#ffbe33';
      ctx.fillRect(winX, winY, winW, winH);

      // Window bright core
      ctx.fillStyle = '#fff4a3';
      ctx.fillRect(winX + 2, winY + 2, winW - 4, winH - 4);

      // Window pane mullions (cross)
      ctx.fillStyle = '#5c3311';
      ctx.fillRect(winX + 3, winY, 1, winH);
      ctx.fillRect(winX, winY + 3, winW, 1);
    } else {
      // DAY: Light reflective glass
      ctx.fillStyle = '#d4ebf5';
      ctx.fillRect(winX, winY, winW, winH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(winX + 1, winY + 1, 2, 3);

      ctx.fillStyle = '#5c3311';
      ctx.fillRect(winX + 3, winY, 1, winH);
      ctx.fillRect(winX, winY + 3, winW, 1);
    }

    // Porch Hanging Lantern (Night glow)
    const lanternX = cabinX + 5;
    const lanternY = cabinY + 13;
    ctx.fillStyle = '#1c1b18';
    ctx.fillRect(lanternX, lanternY, 2, 3);
    if (t > 0.3) {
      const lanternAlpha = Math.min(1, (t - 0.3) / 0.4);
      // Soft lantern aura
      ctx.fillStyle = `rgba(255, 165, 30, ${(lanternAlpha * 0.4).toFixed(2)})`;
      ctx.fillRect(lanternX - 3, lanternY - 3, 8, 8);
      // Lantern flame
      ctx.fillStyle = '#fff085';
      ctx.fillRect(lanternX, lanternY + 1, 2, 2);
    }

    // Wooden Pier / Jetty extending into the lake
    const pierX = cabinX + 12;
    const pierY = 120;
    const pierW = 32;
    const pierH = 3;

    // Pilings in water
    ctx.fillStyle = '#221611';
    ctx.fillRect(pierX + 6, pierY + 2, 2, 8);
    ctx.fillRect(pierX + 18, pierY + 2, 2, 9);
    ctx.fillRect(pierX + 28, pierY + 2, 2, 10);

    // Deck planks
    ctx.fillStyle = '#61402b';
    ctx.fillRect(pierX, pierY, pierW, pierH);
    ctx.fillStyle = '#7a5136';
    ctx.fillRect(pierX, pierY, pierW, 1); // plank top highlight

    // Small Moored Wooden Rowboat
    const boatX = pierX + pierW - 4;
    const bob = Math.sin(animTime * 2.5) * 1.2;
    const boatY = 124 + Math.round(bob);

    // Boat hull
    ctx.fillStyle = '#593922';
    ctx.fillRect(boatX, boatY, 14, 4);
    ctx.fillRect(boatX + 2, boatY + 4, 10, 2);
    // Boat rim & interior seat
    ctx.fillStyle = '#784e31';
    ctx.fillRect(boatX, boatY, 14, 1);
    ctx.fillStyle = '#3d2516';
    ctx.fillRect(boatX + 6, boatY + 1, 3, 2);
    // Mooring rope to pier
    ctx.fillStyle = '#9e8c6e';
    ctx.fillRect(boatX - 2, boatY - 1, 3, 1);

    ctx.restore();
  }

  private renderChimneySmoke(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    animTime: number,
    t: number
  ) {
    const smokePuffs = 6;
    const smokeColor = interpolateGradient(t, [
      { pos: 0.0, hex: '#e8edf2' },
      { pos: 0.5, hex: '#c5b8b0' },
      { pos: 1.0, hex: '#373a47' },
    ]);

    for (let i = 0; i < smokePuffs; i++) {
      const age = ((animTime * 1.5 + i * 0.8) % 4) / 4;
      const x = startX + age * 16 + Math.sin(age * 5 + i) * 3;
      const y = startY - age * 26;
      const size = 2 + Math.floor(age * 4);
      const alpha = Math.sin(age * Math.PI) * 0.65;

      if (alpha <= 0.05) continue;

      ctx.fillStyle = smokeColor;
      ctx.globalAlpha = alpha;
      ctx.fillRect(Math.floor(x - size / 2), Math.floor(y - size / 2), size, size);
    }
    ctx.globalAlpha = 1.0;
  }

  private renderForeground(ctx: CanvasRenderingContext2D, t: number, animTime: number) {
    const bankGrass = interpolateGradient(t, [
      { pos: 0.0, hex: '#3b7849' },
      { pos: 0.5, hex: '#474a3b' },
      { pos: 1.0, hex: '#0f1f18' },
    ]);

    const bankEarth = interpolateGradient(t, [
      { pos: 0.0, hex: '#543b2b' },
      { pos: 0.5, hex: '#3c2b21' },
      { pos: 1.0, hex: '#16110e' },
    ]);

    ctx.save();
    // Shoreline banks on left and right
    // Left bank: x=0..120
    for (let x = 0; x < 130; x++) {
      const curve = Math.cos(x * 0.025) * 16 + 144;
      const y = Math.floor(curve);
      ctx.fillStyle = bankEarth;
      ctx.fillRect(x, y + 2, 1, CANVAS_HEIGHT - y);
      ctx.fillStyle = bankGrass;
      ctx.fillRect(x, y, 1, 2);
    }

    // Right bank: x=390..CANVAS_WIDTH
    for (let x = 380; x < CANVAS_WIDTH; x++) {
      const curve = Math.sin((x - 380) * 0.02) * 14 + 148;
      const y = Math.floor(curve);
      ctx.fillStyle = bankEarth;
      ctx.fillRect(x, y + 2, 1, CANVAS_HEIGHT - y);
      ctx.fillStyle = bankGrass;
      ctx.fillRect(x, y, 1, 2);
    }

    // Swaying Reeds & Cattails
    this.renderReeds(ctx, 35, 146, 12, animTime, t);
    this.renderReeds(ctx, 420, 150, 10, animTime, t);

    // Wildflowers on grassy bank (poppies, daisies, cornflowers)
    this.renderFlowers(ctx, t, animTime);

    ctx.restore();
  }

  private renderReeds(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    count: number,
    animTime: number,
    t: number
  ) {
    const reedStem = interpolateGradient(t, [
      { pos: 0.0, hex: '#49733e' },
      { pos: 0.5, hex: '#48523c' },
      { pos: 1.0, hex: '#152417' },
    ]);

    const cattailHead = interpolateGradient(t, [
      { pos: 0.0, hex: '#54321d' },
      { pos: 0.5, hex: '#3d2518' },
      { pos: 1.0, hex: '#1c100a' },
    ]);

    for (let i = 0; i < count; i++) {
      const rx = baseX + i * 3;
      const reedH = 10 + ((i * 5) % 8);
      const sway = Math.sin(animTime * 2 + i * 0.8) * 1.5;

      ctx.fillStyle = reedStem;
      ctx.fillRect(Math.floor(rx + sway), baseY - reedH, 1, reedH);

      // Cattail head on every 2nd reed
      if (i % 2 === 0) {
        ctx.fillStyle = cattailHead;
        ctx.fillRect(Math.floor(rx + sway), baseY - reedH, 1, 3);
      }
    }
  }

  private renderFlowers(ctx: CanvasRenderingContext2D, t: number, animTime: number) {
    const flowerSpots = [
      { x: 14, y: 154, color: '#f87171' }, // Red poppy
      { x: 22, y: 158, color: '#ffffff' }, // White daisy
      { x: 48, y: 152, color: '#fbbf24' }, // Buttercup
      { x: 62, y: 156, color: '#60a5fa' }, // Forget-me-not
      { x: 88, y: 153, color: '#f87171' },
      { x: 104, y: 150, color: '#fbbf24' },
      { x: 395, y: 158, color: '#ffffff' },
      { x: 410, y: 155, color: '#f87171' },
      { x: 440, y: 157, color: '#60a5fa' },
      { x: 470, y: 154, color: '#fbbf24' },
    ];

    for (const f of flowerSpots) {
      // In dark mode, flowers dim down to deep accents
      const col = t > 0.5 ? lerpColor(f.color, '#152520', (t - 0.5) * 1.5) : f.color;
      ctx.fillStyle = col;
      ctx.fillRect(f.x, f.y, 2, 2);
    }
  }

  private renderBirds(ctx: CanvasRenderingContext2D, alpha: number) {
    if (alpha <= 0.05) return;
    ctx.save();
    ctx.fillStyle = `rgba(32, 45, 64, ${alpha.toFixed(2)})`;

    // 4-frame wing animation for soaring pixel birds
    for (const bird of this.birds) {
      const bx = Math.floor(bird.x);
      const by = Math.floor(bird.y);

      switch (bird.frame) {
        case 0: // Wings high V
          ctx.fillRect(bx, by, 1, 1);
          ctx.fillRect(bx - 1, by - 1, 1, 1);
          ctx.fillRect(bx + 1, by - 1, 1, 1);
          break;
        case 1: // Wings flat -
          ctx.fillRect(bx - 1, by, 3, 1);
          break;
        case 2: // Wings down inverted V
          ctx.fillRect(bx, by, 1, 1);
          ctx.fillRect(bx - 1, by + 1, 1, 1);
          ctx.fillRect(bx + 1, by + 1, 1, 1);
          break;
        case 3: // Wings flat returning
          ctx.fillRect(bx - 1, by, 3, 1);
          break;
      }
    }
    ctx.restore();
  }

  private renderFireflies(ctx: CanvasRenderingContext2D, alpha: number, animTime: number) {
    if (alpha <= 0.05) return;
    ctx.save();

    for (const ff of this.fireflies) {
      const blink = (Math.sin(animTime * 3 + ff.phase) + 1) * 0.5;
      const ffAlpha = alpha * blink;
      if (ffAlpha <= 0.08) continue;

      const fx = Math.floor(ff.x);
      const fy = Math.floor(ff.y);

      // Glow halo
      ctx.fillStyle = `rgba(167, 243, 208, ${(ffAlpha * 0.25).toFixed(2)})`;
      ctx.fillRect(fx - 1, fy - 1, 3, 3);

      // Firefly glowing core
      ctx.fillStyle = `rgba(254, 240, 138, ${(ffAlpha * 0.95).toFixed(2)})`;
      ctx.fillRect(fx, fy, 1, 1);

      // Subtle water reflection if over water
      if (fy < 170 && fx > 120 && fx < 390) {
        ctx.fillStyle = `rgba(167, 243, 208, ${(ffAlpha * 0.15).toFixed(2)})`;
        ctx.fillRect(fx, fy + 8, 2, 1);
      }
    }
    ctx.restore();
  }

  private renderGridOverlay(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;

    for (let x = 0; x < CANVAS_WIDTH; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  public addRipple(x: number, y: number) {
    this.ripples.push({
      x: Math.max(0, Math.min(CANVAS_WIDTH - 20, x)),
      y: Math.max(122, Math.min(CANVAS_HEIGHT - 6, y)),
      width: 8 + Math.floor(Math.random() * 10),
      phase: 0,
      speed: 3.5,
    });
  }

  public addFirefly(x: number, y: number) {
    this.fireflies.push({
      x,
      y,
      baseX: x,
      baseY: y,
      phase: Math.random() * Math.PI,
      speed: 1.2,
      color: '#fef08a',
    });
  }
}
