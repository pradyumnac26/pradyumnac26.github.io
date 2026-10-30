import guestbookStyles from "../../components/styles/guestbook.scss"
import { QuartzTransformerPlugin } from "../types"

export const guestbookStylesPlugin: QuartzTransformerPlugin = () => ({
  name: "GuestbookStyles",
  externalResources: () => ({
    css: [
      {
        content: `@layer obsidian-theme-overrides {\n${guestbookStyles}\n}\n${guestbookStyles}`,
        inline: true,
      },
    ],
  }),
})
