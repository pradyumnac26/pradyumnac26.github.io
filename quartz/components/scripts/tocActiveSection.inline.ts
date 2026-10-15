const ACTIVE_HEADING_OFFSET = 0.25

function addCleanup(fn: () => void) {
  if (typeof window.addCleanup === "function") {
    window.addCleanup(fn)
  }
}

function setupTocActiveSection() {
  const entries = [
    ...document.querySelectorAll<HTMLAnchorElement>(".toc ul.toc-content a[href^='#']"),
  ].map((link) => ({ link, id: decodeURIComponent(link.hash.slice(1)) }))
  if (entries.length === 0) return

  const headings = [...new Set(entries.map((e) => e.id))]
    .map((id) => document.getElementById(id))
    .filter((el): el is HTMLElement => el !== null)
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)

  let frame = 0

  const update = () => {
    frame = 0
    const threshold = window.innerHeight * ACTIVE_HEADING_OFFSET
    let activeId: string | null = null
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > threshold) break
      activeId = heading.id
    }
    for (const { link, id } of entries) {
      link.classList.toggle("toc-active", id === activeId)
    }
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update)
  }

  window.addEventListener("scroll", schedule, { passive: true })
  window.addEventListener("resize", schedule)
  addCleanup(() => {
    window.removeEventListener("scroll", schedule)
    window.removeEventListener("resize", schedule)
    if (frame) cancelAnimationFrame(frame)
  })

  update()
}

document.addEventListener("nav", setupTocActiveSection)

export {}
