import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { joinSegments, pathToRoot } from "../util/path"
// @ts-ignore — bundled as inline client script at build time
import guestbookScript from "./scripts/guestbook.inline.ts"

interface Options {
  apiUrl: string
}

export default ((opts: Options) => {
  const Guestbook: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    if (fileData.frontmatter?.guestbook !== true) {
      return null
    }

    const ownerAvatar = joinSegments(pathToRoot(fileData.slug!), "static/guestbook-owner.jpg")

    return (
      <section
        class="guestbook"
        data-api={opts.apiUrl}
        data-owner-avatar={ownerAvatar}
        aria-label="Guestbook"
      >
        <form class="guestbook-form">
          <span class="guestbook-form-avatar" aria-hidden="true" />
          <div class="guestbook-form-fields">
            <input
              name="name"
              type="text"
              placeholder="Your real name, so I know who to thank 🙂"
              aria-label="Your name"
              maxLength={60}
              required
              autocomplete="name"
            />
            <textarea
              name="message"
              rows={3}
              placeholder="Leave your mark on my second brain…"
              aria-label="Message"
              maxLength={1000}
              required
            />
            <input
              class="guestbook-honeypot"
              name="website"
              type="text"
              tabIndex={-1}
              autocomplete="off"
              aria-hidden="true"
            />
            <div class="guestbook-actions">
              <button type="submit">Post</button>
              <span class="guestbook-status" role="status" aria-live="polite" />
            </div>
          </div>
        </form>
        <ul class="guestbook-entries" />
      </section>
    )
  }

  Guestbook.afterDOMLoaded = guestbookScript

  return Guestbook
}) satisfies QuartzComponentConstructor<Options>
