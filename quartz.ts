import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import { PostsPage, TopicPage, isNotePage } from "./quartz/components/PostsList"
import PixelArtLandscape from "./quartz/components/PixelArtLandscape"
import { topicGraphLinks } from "./quartz/plugins/transformers/topicGraphLinks"
import { sidebarNavOverrides } from "./quartz/plugins/transformers/sidebarNavOverrides"
componentRegistry.setOptionOverrides("@quartz-community/recent-notes", {
  filter: isNotePage,
  showTags: false,
})

const notesMoreLabelScript = `
const MOBILE_RECENT_LIMIT = 2
const DESKTOP_RECENT_LIMIT = 8
const mobileRecentNotesQuery = window.matchMedia("(max-width: 800px)")

function postsMoreHref() {
  const base = document.body.dataset.basepath
  if (!base) return "./posts"
  return base.endsWith("/") ? base + "posts" : base + "/posts"
}

function readMoreLabel(count) {
  const label = count === 1 ? "note" : "notes"
  return "Read " + count + " more " + label + " →"
}

function getRecentNotesTotal(sidebar, items, link) {
  if (sidebar.dataset.totalNotes) {
    return parseInt(sidebar.dataset.totalNotes, 10)
  }
  const listed = items.length
  const match = link?.textContent?.match(/(\\d+) more/)
  const extra = match ? parseInt(match[1], 10) : 0
  const total = listed + extra
  sidebar.dataset.totalNotes = String(total)
  return total
}

function ensureRecentNotesLink(sidebar, remaining) {
  let link = sidebar.querySelector("p > a")
  if (remaining <= 0) {
    sidebar.querySelector("p")?.remove()
    return null
  }
  if (!link) {
    const p = document.createElement("p")
    link = document.createElement("a")
    link.href = postsMoreHref()
    p.appendChild(link)
    sidebar.appendChild(p)
  }
  link.textContent = readMoreLabel(remaining)
  return link
}

function stabilizeLeftSidebar() {
  const sidebar = document.querySelector(".sidebar.left .recent-notes")
  if (!sidebar) return
  sidebar.querySelectorAll("ul.tags, .posts-list-topics").forEach((el) => el.remove())
  sidebar.querySelectorAll("a.internal, a.internal-link").forEach((link) => {
    link.classList.remove("internal-link")
    link.style.removeProperty("background-color")
    link.style.removeProperty("background")
  })
}

function updateRecentNotesForViewport() {
  const sidebar = document.querySelector(".sidebar.left .recent-notes")
  if (!sidebar) return

  const items = [...sidebar.querySelectorAll("ul.recent-ul > li.recent-li")]
  const link = sidebar.querySelector("p > a")
  const total = getRecentNotesTotal(sidebar, items, link)
  const isMobile = mobileRecentNotesQuery.matches
  const isHomepage = document.body.dataset.slug === "index"
  const visibleLimit =
    isMobile && isHomepage ? MOBILE_RECENT_LIMIT : DESKTOP_RECENT_LIMIT

  items.forEach((item, index) => {
    item.style.display = index < visibleLimit ? "" : "none"
  })

  if (isMobile && !isHomepage) {
    sidebar.querySelector("p")?.remove()
    return
  }

  ensureRecentNotesLink(sidebar, Math.max(0, total - visibleLimit))
}

function resetRecentNotesCache() {
  document.querySelectorAll(".sidebar.left .recent-notes").forEach((sidebar) => {
    delete sidebar.dataset.totalNotes
  })
}

document.addEventListener("nav", () => {
  resetRecentNotesCache()
  stabilizeLeftSidebar()
  updateRecentNotesForViewport()
})
mobileRecentNotesQuery.addEventListener("change", updateRecentNotesForViewport)
stabilizeLeftSidebar()
updateRecentNotesForViewport()
`

const config = await loadQuartzConfig()
config.plugins.transformers.push(topicGraphLinks(), sidebarNavOverrides())
config.plugins.pageTypes ??= []
config.plugins.pageTypes.push(PostsPage(), TopicPage())
const baseLayout = await loadQuartzLayout()
const pixelArt = PixelArtLandscape()
const contentBeforeBody =
  baseLayout.byPageType.content?.beforeBody ?? baseLayout.defaults.beforeBody ?? []
baseLayout.byPageType.content = {
  ...baseLayout.byPageType.content,
  beforeBody: [pixelArt, ...contentBeforeBody],
}
const footer = baseLayout.defaults.footer?.[0]

if (footer) {
  const existing = footer.afterDOMLoaded
  footer.afterDOMLoaded =
    (typeof existing === "string" ? existing : "") + notesMoreLabelScript
}

config.plugins.emitters = config.plugins.emitters.filter(
  (emitter) => emitter.name !== "PageTypeDispatcher",
)
config.plugins.emitters.push(
  PageTypeDispatcher({
    defaults: baseLayout.defaults,
    byPageType: baseLayout.byPageType,
  }),
)

export default config
export const layout = baseLayout
