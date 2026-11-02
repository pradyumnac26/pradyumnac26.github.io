interface AnalyticsWeek {
  start: string
  visitors: number
}

interface AnalyticsRow {
  name: string
  visitors: number
  href?: string
}

interface Analytics {
  total: number
  weeks: AnalyticsWeek[]
  pages: { path: string; title: string; visitors: number }[]
  referrers: AnalyticsRow[]
  countries: AnalyticsRow[]
}

const ANALYTICS_SVG_NS = "http://www.w3.org/2000/svg"
const CHART_HEIGHT = 280
const CHART_MARGIN = { top: 16, right: 16, bottom: 52, left: 56 }
const numberFormat = new Intl.NumberFormat("en-US")
const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})
const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })

// Fetched once per page load and reused when navigating back to /analytics.
let analytics: Promise<Analytics> | undefined

function svgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
) {
  const el = document.createElementNS(ANALYTICS_SVG_NS, tag)
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value))
  return el
}

function svgText(text: string, attrs: Record<string, string | number>) {
  const el = svgElement("text", attrs)
  el.textContent = text
  return el
}

function htmlElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
) {
  const el = document.createElement(tag)
  el.className = className
  if (text !== undefined) el.textContent = text
  return el
}

// Rounds the y-axis step to 1, 2 or 5 times a power of ten, and never below 1 visitor.
function niceStep(max: number, ticks: number) {
  const raw = max / ticks
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].find((n) => raw / magnitude <= n)! * magnitude
  return Math.max(1, step)
}

// Weekly visitors with labelled axes. Drawn at the container's real pixel width so text
// never stretches; redrawn when the container resizes.
function drawChart(container: HTMLElement, tooltip: HTMLElement, weeks: AnalyticsWeek[]) {
  const width = Math.max(280, container.clientWidth)
  const { top, right, bottom, left } = CHART_MARGIN
  const innerWidth = width - left - right
  const innerHeight = CHART_HEIGHT - top - bottom

  const max = Math.max(1, ...weeks.map((week) => week.visitors))
  const step = niceStep(max, 4)
  const yMax = Math.ceil(max / step) * step
  const x = (i: number) => left + (weeks.length > 1 ? (i * innerWidth) / (weeks.length - 1) : 0)
  const y = (value: number) => top + innerHeight - (value / yMax) * innerHeight

  const svg = svgElement("svg", {
    class: "analytics-chart",
    viewBox: `0 0 ${width} ${CHART_HEIGHT}`,
    width,
    height: CHART_HEIGHT,
    role: "img",
    "aria-label": `Weekly visitors over the last 12 months, peaking at ${numberFormat.format(max)}`,
  })

  for (let value = 0; value <= yMax; value += step) {
    svg.append(
      svgElement("line", {
        class: value === 0 ? "analytics-axis" : "analytics-grid",
        x1: left,
        x2: width - right,
        y1: y(value),
        y2: y(value),
      }),
      svgText(numberFormat.format(value), {
        class: "analytics-tick",
        x: left - 8,
        y: y(value),
        "text-anchor": "end",
        "dominant-baseline": "middle",
      }),
    )
  }

  // A tick at the first week of each month, skipping labels that would overlap the previous one.
  let lastLabelEnd = -Infinity
  weeks.forEach((week, i) => {
    const date = new Date(week.start)
    const previous = i > 0 ? new Date(weeks[i - 1].start) : undefined
    if (previous && previous.getUTCMonth() === date.getUTCMonth()) return
    const label =
      i === 0 || date.getUTCMonth() === 0
        ? `${monthFormat.format(date)} '${String(date.getUTCFullYear()).slice(2)}`
        : monthFormat.format(date)
    const halfWidth = label.length * 3.5
    if (x(i) - halfWidth < lastLabelEnd + 8) return
    lastLabelEnd = x(i) + halfWidth
    svg.append(
      svgElement("line", { class: "analytics-axis", x1: x(i), x2: x(i), y1: y(0), y2: y(0) + 5 }),
      svgText(label, { class: "analytics-tick", x: x(i), y: y(0) + 18, "text-anchor": "middle" }),
    )
  })

  svg.append(
    svgText("Visitors", {
      class: "analytics-axis-title",
      transform: `translate(14 ${top + innerHeight / 2}) rotate(-90)`,
      "text-anchor": "middle",
    }),
    svgText("Week", {
      class: "analytics-axis-title",
      x: left + innerWidth / 2,
      y: CHART_HEIGHT - 6,
      "text-anchor": "middle",
    }),
  )

  const points = weeks.map((week, i) => `${x(i).toFixed(1)},${y(week.visitors).toFixed(1)}`)
  svg.append(svgElement("polyline", { class: "analytics-chart-line", points: points.join(" ") }))

  const band = innerWidth / Math.max(1, weeks.length - 1)
  weeks.forEach((week, i) => {
    const group = svgElement("g", { class: "analytics-point" })
    group.append(
      svgElement("rect", {
        class: "analytics-point-hit",
        x: x(i) - band / 2,
        y: top,
        width: band,
        height: innerHeight,
      }),
      svgElement("circle", { cx: x(i), cy: y(week.visitors), r: 3 }),
    )
    const show = () => {
      tooltip.replaceChildren(
        htmlElement("strong", "", `${numberFormat.format(week.visitors)} visitors`),
        htmlElement("span", "", `Week of ${dayFormat.format(new Date(week.start))}`),
      )
      tooltip.style.left = `${x(i)}px`
      tooltip.style.top = `${y(week.visitors)}px`
      tooltip.hidden = false
    }
    group.addEventListener("pointerenter", show)
    group.addEventListener("pointerdown", show)
    svg.append(group)
  })
  svg.addEventListener("pointerleave", () => (tooltip.hidden = true))

  container.querySelector("svg")?.remove()
  container.prepend(svg)
}

function stat(label: string, value: string) {
  const card = htmlElement("div", "analytics-stat")
  card.append(
    htmlElement("span", "analytics-stat-value", value),
    htmlElement("span", "analytics-stat-label", label),
  )
  return card
}

function topList(heading: string, rows: AnalyticsRow[]) {
  const section = htmlElement("section", "analytics-list")
  section.append(htmlElement("h3", "", heading))
  if (rows.length === 0) {
    section.append(htmlElement("p", "analytics-empty", "No data yet."))
    return section
  }
  const list = htmlElement("ol", "")
  for (const row of rows) {
    const item = document.createElement("li")
    const name = htmlElement(row.href ? "a" : "span", "analytics-list-name", row.name)
    if (row.href) name.setAttribute("href", row.href)
    name.title = row.name
    item.append(
      name,
      htmlElement("span", "analytics-list-count", numberFormat.format(row.visitors)),
    )
    list.append(item)
  }
  section.append(list)
  return section
}

function renderPage(page: HTMLElement, data: Analytics, basePath: string) {
  const { weeks } = data
  const peak = weeks.reduce((best, week) => (week.visitors > best.visitors ? week : best), weeks[0])
  const lastFourWeeks = weeks.slice(-4).reduce((sum, week) => sum + week.visitors, 0)

  const stats = htmlElement("div", "analytics-stats")
  stats.append(
    stat("visitors in the last 12 months", numberFormat.format(data.total)),
    stat("visitors in the last 4 weeks", numberFormat.format(lastFourWeeks)),
    stat(
      peak && peak.visitors > 0
        ? `best week (${dayFormat.format(new Date(peak.start))})`
        : "best week",
      numberFormat.format(peak?.visitors ?? 0),
    ),
  )

  const chart = htmlElement("div", "analytics-chart-wrap")
  const tooltip = htmlElement("div", "analytics-tooltip")
  tooltip.hidden = true
  chart.append(tooltip)

  const lists = htmlElement("div", "analytics-lists")
  lists.append(
    topList(
      "Top pages",
      data.pages.map((p) => ({ name: p.title, visitors: p.visitors, href: basePath + p.path })),
    ),
    topList("Top referrers", data.referrers),
    topList("Top countries", data.countries),
  )

  page.replaceChildren(stats, chart, lists)
  drawChart(chart, tooltip, weeks)
  const observer = new ResizeObserver(() => drawChart(chart, tooltip, weeks))
  observer.observe(chart)
  window.addCleanup?.(() => observer.disconnect())
}

document.addEventListener("nav", async () => {
  const source = document.querySelector<HTMLElement>(".footer-analytics")
  const links = document.querySelector("#quartz-body > footer ul")
  const page = document.querySelector<HTMLElement>(".analytics-page")
  if (!source) return
  const basePath = document.body.dataset.basepath ?? ""

  document.querySelectorAll(".analytics-footer-item").forEach((item) => item.remove())
  if (links) {
    const link = htmlElement("a", "", "Analytics")
    link.href = `${basePath}/analytics`
    const item = htmlElement("li", "analytics-footer-item")
    item.append(link)
    links.append(item)
  }

  if (!page) return
  analytics ??= fetch(source.dataset.api!).then((res) => {
    if (!res.ok) throw new Error(String(res.status))
    return res.json() as Promise<Analytics>
  })
  try {
    renderPage(page, await analytics, basePath)
  } catch {
    analytics = undefined
    page.replaceChildren(htmlElement("p", "analytics-status", "Couldn't load analytics right now."))
  }
})
