import { CustomOgImages } from "@quartz-community/og-image"
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import { registerCondition } from "./quartz/plugins/loader/conditions"
import { PageTypeDispatcher } from "./quartz/plugins/pageTypes/dispatcher"
import { PostsPage, TopicPage, isNotePage } from "./quartz/components/PostsList"
import PixelArtLandscape from "./quartz/components/PixelArtLandscape"
import HomeSignature from "./quartz/components/HomeSignature"
import TocActiveSection from "./quartz/components/TocActiveSection"
import Guestbook from "./quartz/components/Guestbook"
import FooterAnalytics from "./quartz/components/FooterAnalytics"
import AnalyticsPage from "./quartz/components/AnalyticsPage"
import { topicGraphLinks } from "./quartz/plugins/transformers/topicGraphLinks"
import { sidebarNavOverrides } from "./quartz/plugins/transformers/sidebarNavOverrides"
import { imageCaptions } from "./quartz/plugins/transformers/imageCaptions"
import { guestbookResourcesPlugin } from "./quartz/plugins/transformers/guestbookResources"
import { siteOgImage } from "./quartz/util/ogImage"
componentRegistry.setOptionOverrides("@quartz-community/recent-notes", {
  filter: isNotePage,
  showTags: false,
})
// The guestbook and analytics pages aren't notes, so they skip the graph and backlinks.
registerCondition(
  "not-app-page",
  (props) =>
    props.fileData.frontmatter?.guestbook !== true &&
    props.fileData.frontmatter?.analytics !== true,
)

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

// The plugin's "See N more" count is only trustworthy before this script rewrites the
// label, so it is captured once on the link and reused on every later run.
function getPluginExtraCount(link) {
  if (!link) return 0
  const pluginMatch = link.textContent?.match(/^\\s*See (\\d+) more/)
  if (pluginMatch) {
    link.dataset.pluginExtra = pluginMatch[1]
  } else if (link.dataset.pluginExtra === undefined) {
    link.dataset.pluginExtra = "0"
  }
  return parseInt(link.dataset.pluginExtra, 10)
}

function getRecentNotesTotal(sidebar, items, link) {
  if (sidebar.dataset.totalNotes) {
    return parseInt(sidebar.dataset.totalNotes, 10)
  }
  const total = items.length + getPluginExtraCount(link)
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
    link.dataset.pluginExtra = "0"
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

const guestbookApiUrl =
  process.env.GUESTBOOK_API_URL ?? "https://guestbook-api-seven.vercel.app/api/entries"
const analyticsApiUrl =
  process.env.ANALYTICS_API_URL ?? "https://guestbook-api-seven.vercel.app/api/analytics"

const config = await loadQuartzConfig()
config.plugins.transformers.push(
  topicGraphLinks(),
  sidebarNavOverrides(),
  imageCaptions(),
  guestbookResourcesPlugin({ apiUrl: guestbookApiUrl }),
)
config.plugins.pageTypes ??= []
config.plugins.pageTypes.push(PostsPage(), TopicPage())
const baseLayout = await loadQuartzLayout()
const pixelArt = PixelArtLandscape()
const homeSignature = HomeSignature()
const tocActiveSection = TocActiveSection()
const guestbook = Guestbook({ apiUrl: guestbookApiUrl })
const contentBeforeBody =
  baseLayout.byPageType.content?.beforeBody ?? baseLayout.defaults.beforeBody ?? []
const contentAfterBody =
  baseLayout.byPageType.content?.afterBody ?? baseLayout.defaults.afterBody ?? []
baseLayout.byPageType.content = {
  ...baseLayout.byPageType.content,
  beforeBody: [tocActiveSection, pixelArt, ...contentBeforeBody],
  afterBody: [guestbook, AnalyticsPage(), ...contentAfterBody, homeSignature],
}
const footer = baseLayout.defaults.footer?.[0]

if (footer) {
  const existing = footer.afterDOMLoaded
  footer.afterDOMLoaded = (typeof existing === "string" ? existing : "") + notesMoreLabelScript
}
const footerAnalytics = FooterAnalytics({ apiUrl: analyticsApiUrl })
// Page types share the default footer array by reference, so it's extended in place.
const footerSlots = new Set([
  baseLayout.defaults.footer,
  ...Object.values(baseLayout.byPageType).map((pageType) => pageType.footer),
])
for (const slot of footerSlots) slot?.push(footerAnalytics)

config.plugins.emitters = config.plugins.emitters.filter(
  (emitter) => emitter.name !== "PageTypeDispatcher" && emitter.name !== "CustomOgImages",
)
config.plugins.emitters.push(
  CustomOgImages({
    colorScheme: "lightMode",
    width: 1200,
    height: 630,
    excludeRoot: false,
    imageStructure: siteOgImage,
  }),
  PageTypeDispatcher({
    defaults: baseLayout.defaults,
    byPageType: baseLayout.byPageType,
  }),
)

export default config
export const layout = baseLayout
