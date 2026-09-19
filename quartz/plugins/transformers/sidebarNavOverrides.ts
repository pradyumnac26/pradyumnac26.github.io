import sidebarNavOverrideStyles from "../../styles/sidebar-overrides.scss"
import { QuartzTransformerPlugin } from "../types"

export const sidebarNavOverrides: QuartzTransformerPlugin = () => ({
  name: "SidebarNavOverrides",
  externalResources: () => ({
    css: [
      {
        content: `@layer obsidian-theme-overrides {\n${sidebarNavOverrideStyles}\n}\n${sidebarNavOverrideStyles}`,
        inline: true,
      },
    ],
  }),
})
