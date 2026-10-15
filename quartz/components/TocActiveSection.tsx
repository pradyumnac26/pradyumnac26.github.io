import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore — bundled as inline client script at build time
import tocActiveSectionScript from "./scripts/tocActiveSection.inline.ts"

const TocActiveSection: QuartzComponent = () => null

TocActiveSection.afterDOMLoaded = tocActiveSectionScript

export default (() => TocActiveSection) satisfies QuartzComponentConstructor
