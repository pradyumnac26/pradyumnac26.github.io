const TWITTER_WIDGETS_SRC = "https://platform.x.com/widgets.js"

type Twttr = {
  widgets?: { load?: () => void }
}

function getTwttr(): Twttr | undefined {
  return (window as Window & { twttr?: Twttr }).twttr
}

function hydrateTwitterEmbeds() {
  const hasTweet = document.querySelector("blockquote.twitter-tweet, blockquote.twitter")
  if (!hasTweet) return

  const render = () => getTwttr()?.widgets?.load?.()

  if (getTwttr()?.widgets) {
    render()
    return
  }

  let script = document.querySelector<HTMLScriptElement>(
    `script[src="${TWITTER_WIDGETS_SRC}"]`,
  )
  if (!script) {
    script = document.createElement("script")
    script.src = TWITTER_WIDGETS_SRC
    script.async = true
    script.charset = "utf-8"
    script.onload = () => {
      script.dataset.loaded = "true"
      render()
    }
    document.head.appendChild(script)
    return
  }

  if (script.dataset.loaded === "true") {
    render()
  } else {
    script.addEventListener("load", () => render(), { once: true })
  }
}

hydrateTwitterEmbeds()
document.addEventListener("nav", () => {
  requestAnimationFrame(() => hydrateTwitterEmbeds())
})
