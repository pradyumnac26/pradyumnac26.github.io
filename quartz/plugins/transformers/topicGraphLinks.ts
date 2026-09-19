import { Root } from "hast"
import { Pluggable } from "unified"
import { VFile } from "vfile"
import { QuartzTransformerPlugin } from "../types"

function topicLink(topic: string): string {
  return `topics/${topic}`
}

export const topicGraphLinks: QuartzTransformerPlugin = () => ({
  name: "TopicGraphLinks",
  htmlPlugins(): Pluggable[] {
    return [
      () => (_tree: Root, file: VFile) => {
        const frontmatter = file.data?.frontmatter as Record<string, unknown> | undefined
        const topics = frontmatter?.topics
        if (!Array.isArray(topics)) return

        const outgoing = new Set<string>(
          Array.isArray(file.data.links) ? (file.data.links as string[]) : [],
        )

        for (const topic of topics) {
          if (typeof topic === "string") outgoing.add(topicLink(topic))
        }

        file.data.links = [...outgoing]
      },
    ]
  },
})
