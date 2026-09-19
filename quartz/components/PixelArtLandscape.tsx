import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore — bundled as inline client script at build time
import pixelArtScript from "./scripts/pixelArt.inline.ts"
import styles from "./styles/pixelArt.scss"

const CANVAS_WIDTH = 512
const CANVAS_HEIGHT = 192

const PixelArtLandscape: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  if (fileData.slug !== "index") {
    return null
  }

  return (
    <section class="pixel-art-hero" aria-label="Pixel art landscape">
      <div class="pixel-art-stage">
        <div class="pixel-art-frame">
          <div class="pixel-art-frame-inner">
            <canvas
              class="pixel-art-canvas"
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              aria-hidden="true"
            />
          </div>
          <div class="pixel-art-frame-glow" aria-hidden="true" />
        </div>

        <div class="pixel-art-meta">
          <div class="pixel-art-meta-left">
            <span>
              <span class="pixel-art-meta-dot" aria-hidden="true" />
              {CANVAS_WIDTH} × {CANVAS_HEIGHT} px (Panoramic 8:3)
            </span>
          </div>
          <div class="pixel-art-meta-right">
            <span class="pixel-art-meta-hint">Click water for ripples • Click sky for fireflies</span>
            <span class="pixel-art-meta-badge">60 FPS Pixelated</span>
          </div>
        </div>
      </div>
    </section>
  )
}

PixelArtLandscape.css = styles
PixelArtLandscape.afterDOMLoaded = pixelArtScript

export default (() => PixelArtLandscape) satisfies QuartzComponentConstructor
