import { Element, Parents, Root } from "hast"
import { Pluggable } from "unified"
import { visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"

function captionFromAlt(alt: unknown): string | null {
  if (typeof alt !== "string") return null
  const trimmed = alt.trim()
  if (!trimmed) return null
  if (/^\d+(x\d+)?$/i.test(trimmed)) return null
  return trimmed
}

export const imageCaptions: QuartzTransformerPlugin = () => ({
  name: "ImageCaptions",
  htmlPlugins(): Pluggable[] {
    return [
      () => (tree: Root) => {
        visit(tree, "element", (node: Element, index, parent: Parents | undefined) => {
          if (node.tagName !== "img") return
          if (index === undefined || !parent || parent.type !== "element") return
          if (parent.tagName === "figure") return

          const caption = captionFromAlt(node.properties?.alt)
          if (!caption) return

          const figcaption: Element = {
            type: "element",
            tagName: "figcaption",
            properties: {},
            children: [{ type: "text", value: caption }],
          }

          const figure: Element = {
            type: "element",
            tagName: "figure",
            properties: { className: ["image-with-caption"] },
            children: [node, figcaption],
          }

          parent.children[index] = figure
        })
      },
    ]
  },
})
