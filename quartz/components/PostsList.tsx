import { GlobalConfiguration } from "../cfg"
import { FullSlug, joinSegments, resolveRelative, simplifySlug } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { QuartzPageTypePluginInstance } from "../plugins/types"

const POSTS_SLUG = "posts"

function isNotePage(file: QuartzPluginData): boolean {
  const slug = file.slug ?? ""
  return (
    slug !== "index" &&
    slug !== "404" &&
    slug !== POSTS_SLUG &&
    !slug.startsWith("clippings/") &&
    !slug.startsWith("tags/") &&
    !slug.startsWith("topics/")
  )
}

function hasTopic(file: QuartzPluginData, topic: string): boolean {
  const topics = file.frontmatter?.topics
  if (!Array.isArray(topics)) return false
  return topics.includes(topic)
}

function topicSlug(topic: string): FullSlug {
  return joinSegments("topics", topic) as FullSlug
}

function withResolvedDateType(
  data: QuartzPluginData,
  cfg: GlobalConfiguration,
): QuartzPluginData {
  const resolved =
    data.defaultDateType ??
    (cfg as GlobalConfiguration & { defaultDateType?: string }).defaultDateType ??
    "modified"
  return { ...data, defaultDateType: resolved }
}

function getTopics(file: QuartzPluginData): string[] {
  const topics = file.frontmatter?.topics
  if (Array.isArray(topics)) {
    return topics.filter((t): t is string => typeof t === "string")
  }
  const tags = file.frontmatter?.tags
  if (Array.isArray(tags)) {
    return tags.filter((t): t is string => typeof t === "string")
  }
  return []
}

function safeGetDate(data: QuartzPluginData, cfg: GlobalConfiguration): Date | undefined {
  try {
    const resolved = withResolvedDateType(data, cfg)
    return resolved.dates ? getDate(resolved) : undefined
  } catch {
    return undefined
  }
}

function byDateDesc(cfg: GlobalConfiguration) {
  return (a: QuartzPluginData, b: QuartzPluginData): number => {
    const dateA = safeGetDate(a, cfg)
    const dateB = safeGetDate(b, cfg)
    if (dateA && dateB) return dateB.getTime() - dateA.getTime()
    if (dateA && !dateB) return -1
    if (!dateA && dateB) return 1
    const titleA = (a.frontmatter?.title ?? a.slug ?? "").toLowerCase()
    const titleB = (b.frontmatter?.title ?? b.slug ?? "").toLowerCase()
    return titleA.localeCompare(titleB)
  }
}

function noteCountLabel(count: number): string {
  return `${count} ${count === 1 ? "note" : "notes"}`
}

function collectTopics(pages: QuartzPluginData[]): string[] {
  const topics = new Set<string>()
  for (const page of pages) {
    for (const topic of getTopics(page)) {
      topics.add(topic)
    }
  }
  return [...topics].sort((a, b) => a.localeCompare(b))
}

function NoteIndexList({
  cfg,
  fileData,
  pages,
  showTopics = true,
  countLabel,
}: QuartzComponentProps & {
  pages: QuartzPluginData[]
  showTopics?: boolean
  countLabel?: string
}) {
  const locale = cfg.locale
  const allTopics = showTopics ? collectTopics(pages) : []

  return (
    <div class="posts-index">
      {showTopics && allTopics.length > 0 ? (
        <nav class="posts-index-topics" aria-label="Topics">
          <p class="posts-index-topics-label">Topics</p>
          <p class="posts-index-topics-list">
            {allTopics.map((topic, index) => (
              <span key={topic}>
                {index > 0 ? ", " : ""}
                <a
                  class="posts-index-topic"
                  href={resolveRelative(fileData.slug!, topicSlug(topic))}
                >
                  {topic}
                </a>
              </span>
            ))}
          </p>
        </nav>
      ) : null}
      <p class="posts-list-count">{countLabel ?? noteCountLabel(pages.length)}</p>
      <ul class="posts-list">
        {pages.map((page) => {
          const title = page.frontmatter?.title ?? "Untitled"
          const topics = getTopics(page)
          const date = safeGetDate(page, cfg)

          return (
            <li class="posts-list-item">
              <span class="posts-list-date">
                {date ? <Date date={date} locale={locale} /> : "—"}
              </span>
              <a
                href={resolveRelative(fileData.slug!, page.slug!)}
                class="internal posts-list-title"
              >
                {title}
              </a>
              {showTopics && topics.length > 0 ? (
                <span class="posts-list-topics">
                  {topics.map((topic) => (
                    <a
                      class="posts-list-topic"
                      href={resolveRelative(fileData.slug!, topicSlug(topic))}
                    >
                      #{topic.replace(/\s+/g, "-")}
                    </a>
                  ))}
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const PostsList: QuartzComponent = (
  props: QuartzComponentProps & { countLabel?: string },
) => {
  const pages = props.allFiles.filter(isNotePage).sort(byDateDesc(props.cfg))
  const { countLabel, ...rest } = props
  return <NoteIndexList {...rest} pages={pages} countLabel={countLabel} />
}

PostsList.css = `
.posts-index {
  margin-top: 0.75rem;
}

.posts-index-topics {
  display: none;
  margin: 0 0 1.25rem;
}

.posts-index-topics-label {
  margin: 0 0 0.35rem;
  color: var(--gray);
  font-size: 0.875rem;
  font-weight: 400;
}

.posts-index-topics-list {
  margin: 0;
  color: var(--darkgray);
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1.55;
}

.posts-index-topic {
  color: var(--darkgray);
  font-weight: 400;
  text-decoration: underline;
  text-underline-offset: 0.12em;

  &:hover,
  &:focus {
    color: var(--dark);
  }
}

.posts-list-count {
  margin: 0.35rem 0 0;
  color: var(--gray);
  font-size: 0.875rem;
  font-weight: 400;
}

.posts-list {
  list-style: none;
  padding: 0;
  margin: 1.75rem 0 0;
  display: flex;
  flex-direction: column;
}

.posts-list-item {
  display: grid;
  grid-template-columns: 6.75rem minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: 2.5rem;
  padding: 0;
  margin: 0 0 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.posts-list-date {
  color: var(--gray);
  font-size: 0.875rem;
  font-weight: 400;
  font-style: normal;
  text-align: right;
  white-space: nowrap;
}

.posts-list .posts-list-title.internal {
  color: var(--darkgray);
  font-weight: 400;
  min-width: 0;
  text-decoration: none;
  background: none;
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  line-height: inherit;

  &:hover,
  &:focus {
    color: var(--dark);
    text-decoration: underline;
    background: none;
    background-color: transparent;
  }
}

.posts-list-topics {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem;
}

.posts-list-topic {
  color: var(--secondary);
  font-size: 0.8125rem;
  font-weight: 400;
  line-height: 1.4;
  text-decoration: none;
  white-space: nowrap;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  background: color-mix(in srgb, var(--secondary) 14%, transparent);

  &:hover,
  &:focus {
    background: color-mix(in srgb, var(--secondary) 22%, transparent);
  }
}

@media (max-width: 1024px) {
  .posts-list-item {
    grid-template-columns: 5.5rem minmax(0, 1fr);
    column-gap: 1.25rem;
    row-gap: 0.35rem;
  }

  .posts-list-topics {
    grid-column: 1 / -1;
    justify-content: flex-start;
    margin-top: 0.15rem;
  }
}

@media (max-width: 800px) {
  .posts-index-topics {
    display: block;
  }

  .posts-list-item {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 0 1rem;
    width: 100%;
    margin-bottom: 1.15rem;
  }

  .posts-list-date {
    flex: 0 0 auto;
    text-align: left;
    white-space: nowrap;
  }

  .posts-list .posts-list-title.internal {
    flex: 1 1 auto;
    min-width: 0;
  }

  .posts-list-topics {
    display: none;
  }
}
`

const PostsPageBody: QuartzComponentConstructor = () => {
  const Body: QuartzComponent = ({ fileData, ...rest }) => {
    const cssClasses = fileData.frontmatter?.cssclasses ?? []
    const classes = ["popover-hint", "posts-page", ...cssClasses].join(" ")
    const pages = rest.allFiles.filter(isNotePage).sort(byDateDesc(rest.cfg))

    return (
      <div class={classes}>
        <NoteIndexList
          {...rest}
          fileData={fileData}
          pages={pages}
          countLabel={`${noteCountLabel(pages.length)}, newest first`}
        />
      </div>
    )
  }
  Body.css = PostsList.css
  return Body
}

export const PostsPage = (): QuartzPageTypePluginInstance => ({
  name: "PostsPage",
  priority: 20,
  match: ({ slug }) => slug === POSTS_SLUG,
  layout: "content",
  body: PostsPageBody,
})

const TopicPageBody: QuartzComponentConstructor = () => {
  const Body: QuartzComponent = ({ fileData, ...rest }) => {
    const topic = simplifySlug((fileData.slug ?? "").slice("topics/".length))
    const pages = rest.allFiles
      .filter((file) => isNotePage(file) && hasTopic(file, topic))
      .sort(byDateDesc(rest.cfg))

    return (
      <div class="popover-hint posts-page">
        <NoteIndexList {...rest} fileData={fileData} pages={pages} showTopics={false} />
      </div>
    )
  }
  Body.css = PostsList.css
  return Body
}

export const TopicPage = (): QuartzPageTypePluginInstance => ({
  name: "TopicPage",
  priority: 15,
  match: ({ slug }) => slug.startsWith("topics/"),
  layout: "content",
  generate({ content }) {
    const topics = new Set<string>()
    for (const [, file] of content) {
      const data = file.data ?? {}
      if (data.unlisted === true || !isNotePage(data)) continue
      const noteTopics = data.frontmatter?.topics
      if (!Array.isArray(noteTopics)) continue
      for (const topic of noteTopics) {
        if (typeof topic === "string") topics.add(topic)
      }
    }

    return [...topics].map((topic) => ({
      slug: topicSlug(topic),
      title: `#${topic.replace(/\s+/g, "-")}`,
      data: {},
    }))
  },
  body: TopicPageBody,
})

export { PostsList, isNotePage, getTopics }
