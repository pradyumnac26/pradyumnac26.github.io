import { QuartzComponent, QuartzComponentConstructor } from "./types"
import styles from "./styles/analytics.scss"
// @ts-ignore — bundled as inline client script at build time
import analyticsScript from "./scripts/analytics.inline.ts"

interface Options {
  apiUrl: string
}

export default ((opts: Options) => {
  // Only carries the API URL. The script adds the "Analytics" link to the site footer's
  // links and fills in the /analytics page.
  const FooterAnalytics: QuartzComponent = () => (
    <div class="footer-analytics" data-api={opts.apiUrl} hidden />
  )

  FooterAnalytics.css = styles
  FooterAnalytics.afterDOMLoaded = analyticsScript

  return FooterAnalytics
}) satisfies QuartzComponentConstructor<Options>
