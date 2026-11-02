import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

// Filled in by the FooterAnalytics script, which is on every page.
const AnalyticsPage: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  if (fileData.frontmatter?.analytics !== true) {
    return null
  }

  return (
    <section class="analytics-page" aria-label="Analytics">
      <p class="analytics-status">Loading analytics…</p>
    </section>
  )
}

export default (() => AnalyticsPage) satisfies QuartzComponentConstructor
