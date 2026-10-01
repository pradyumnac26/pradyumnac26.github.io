import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { joinSegments, pathToRoot } from "../util/path"
import styles from "./styles/homeSignature.scss"

const HomeSignature: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  if (fileData.slug !== "index") {
    return null
  }

  const src = joinSegments(pathToRoot(fileData.slug!), "static/signature-praddy.png")

  return (
    <figure class="home-signature" aria-label="Signature">
      <img class="home-signature-img" src={src} alt="Praddy" width={567} height={258} decoding="async" />
    </figure>
  )
}

HomeSignature.css = styles

export default (() => HomeSignature) satisfies QuartzComponentConstructor
