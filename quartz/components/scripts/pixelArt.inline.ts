import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PixelArtworkRenderer,
} from "../../pixelEngine/pixelRenderer"

type CanvasState = {
  renderer: PixelArtworkRenderer
  animTime: number
  timeProgress: number
  panX: number
  frameId: number | null
}

const instances = new Map<HTMLCanvasElement, CanvasState>()

const DAYLIGHT = 0
const GOLDEN_SUNSET = 0.55

function addCleanup(fn: () => void) {
  if (typeof window.addCleanup === "function") {
    window.addCleanup(fn)
  }
}

function getThemeTimeProgress(): number {
  const theme = document.documentElement.getAttribute("saved-theme")
  return theme === "dark" ? GOLDEN_SUNSET : DAYLIGHT
}

function syncAllInstances() {
  const timeProgress = getThemeTimeProgress()
  for (const state of instances.values()) {
    state.timeProgress = timeProgress
  }
}

function destroyInstance(canvas: HTMLCanvasElement) {
  const state = instances.get(canvas)
  if (!state) return
  if (state.frameId !== null) {
    cancelAnimationFrame(state.frameId)
  }
  instances.delete(canvas)
}

function initCanvas(canvas: HTMLCanvasElement) {
  if (instances.has(canvas)) return

  const ctx = canvas.getContext("2d", { alpha: false })
  if (!ctx) return

  ctx.imageSmoothingEnabled = false

  const renderer = new PixelArtworkRenderer()
  const state: CanvasState = {
    renderer,
    animTime: 0,
    timeProgress: getThemeTimeProgress(),
    panX: 0,
    frameId: null,
  }

  let lastTime = performance.now()

  const renderLoop = (now: number) => {
    const dt = Math.min((now - lastTime) / 1000, 0.1)
    lastTime = now
    state.animTime += dt

    const renderState = {
      timeProgress: state.timeProgress,
      animationTime: state.animTime,
      panX: state.panX,
      showGrid: false,
      mouseHoverX: null,
      mouseHoverY: null,
    }

    renderer.update(dt, renderState)
    renderer.render(ctx, renderState)

    state.frameId = requestAnimationFrame(renderLoop)
  }

  const handleClick = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    const px = Math.floor((event.clientX - rect.left) * scaleX + state.panX)
    const py = Math.floor((event.clientY - rect.top) * scaleY)

    if (px < 0 || px >= CANVAS_WIDTH || py < 0 || py >= CANVAS_HEIGHT) return

    if (py > 115) {
      renderer.addRipple(px, py)
    } else if (state.timeProgress > 0.4) {
      renderer.addFirefly(px, py)
    }
  }

  canvas.addEventListener("click", handleClick)
  addCleanup(() => canvas.removeEventListener("click", handleClick))

  let isDragging = false
  let dragStartX = 0
  let dragStartPan = 0

  const handleMouseDown = (event: MouseEvent) => {
    isDragging = true
    dragStartX = event.clientX
    dragStartPan = state.panX
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0) return
    const scaleX = CANVAS_WIDTH / rect.width
    const dx = (event.clientX - dragStartX) * scaleX
    state.panX = Math.max(-60, Math.min(60, dragStartPan - dx))
  }

  const stopDrag = () => {
    isDragging = false
  }

  canvas.addEventListener("mousedown", handleMouseDown)
  canvas.addEventListener("mousemove", handleMouseMove)
  canvas.addEventListener("mouseup", stopDrag)
  canvas.addEventListener("mouseleave", stopDrag)
  addCleanup(() => {
    canvas.removeEventListener("mousedown", handleMouseDown)
    canvas.removeEventListener("mousemove", handleMouseMove)
    canvas.removeEventListener("mouseup", stopDrag)
    canvas.removeEventListener("mouseleave", stopDrag)
  })

  instances.set(canvas, state)
  state.frameId = requestAnimationFrame(renderLoop)
  addCleanup(() => destroyInstance(canvas))
}

function setupPixelArt() {
  if (document.body.dataset.slug !== "index") return

  for (const canvas of document.querySelectorAll<HTMLCanvasElement>(".pixel-art-canvas")) {
    initCanvas(canvas)
  }
}

function cleanupPixelArt() {
  for (const canvas of [...instances.keys()]) {
    destroyInstance(canvas)
  }
}

document.addEventListener("nav", () => {
  cleanupPixelArt()
  setupPixelArt()
})

document.addEventListener("prenav", cleanupPixelArt)

const themeObserver = new MutationObserver(syncAllInstances)
themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["saved-theme"],
})

document.addEventListener("themechange", syncAllInstances)
addCleanup(() => {
  themeObserver.disconnect()
  document.removeEventListener("themechange", syncAllInstances)
})
