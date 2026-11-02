import guestbookStyles from "../../components/styles/guestbook.scss"
import { QuartzTransformerPlugin } from "../types"

interface Options {
  apiUrl: string
}

export const guestbookResourcesPlugin: QuartzTransformerPlugin<Options> = (opts) => ({
  name: "GuestbookResources",
  externalResources: () => ({
    css: [
      {
        content: `@layer obsidian-theme-overrides {\n${guestbookStyles}\n}\n${guestbookStyles}`,
        inline: true,
      },
    ],
    additionalHead: [
      (fileData) =>
        fileData.frontmatter?.guestbook === true ? (
          // The entries fetch is an anonymous CORS request, so the preconnect must match it.
          <link rel="preconnect" href={new URL(opts!.apiUrl).origin} crossOrigin="anonymous" />
        ) : (
          <></>
        ),
    ],
  }),
})
