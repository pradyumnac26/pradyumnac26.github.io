import { GlobalConfiguration } from "../cfg"
import { FullSlug, joinSegments, resolveRelative, simplifySlug } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { getDate } from "./Date"
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

function formatMonthDay(d: Date, locale: GlobalConfiguration["locale"] = "en-US"): string {
  return d.toLocaleDateString(locale, { month: "long", day: "numeric" })
}

function groupByYear(
  pages: QuartzPluginData[],
  cfg: GlobalConfiguration,
): { year: string; pages: QuartzPluginData[] }[] {
  const groups: { year: string; pages: QuartzPluginData[] }[] = []
  for (const page of pages) {
    const date = safeGetDate(page, cfg)
    const year = date ? String(date.getFullYear()) : "—"
    const last = groups[groups.length - 1]
    if (last && last.year === year) {
      last.pages.push(page)
    } else {
      groups.push({ year, pages: [page] })
    }
  }
  return groups
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
        {groupByYear(pages, cfg).map((group) => (
          <li class="posts-year-group">
            <span class="posts-year">{group.year}</span>
            <ul class="posts-year-items">
              {group.pages.map((page) => {
                const title = page.frontmatter?.title ?? "Untitled"
                const topics = getTopics(page)
                const date = safeGetDate(page, cfg)

                return (
                  <li class="posts-list-item">
                    <div class="posts-list-main">
                      <a
                        href={resolveRelative(fileData.slug!, page.slug!)}
                        class="internal posts-list-title"
                      >
                        {title}
                      </a>
                      {date ? (
                        <time class="posts-list-date" datetime={date.toISOString()}>
                          {formatMonthDay(date, locale)}
                        </time>
                      ) : null}
                    </div>
                    {showTopics && topics.length > 0 ? (
                      <span class="posts-list-topics">
                        {topics.map((topic) => (
                          <a
                            class="posts-list-topic"
                            href={resolveRelative(fileData.slug!, topicSlug(topic))}
                          >
                            {topic}
                          </a>
                        ))}
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
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
  margin: 0;
  color: var(--dark);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.7;
}

.posts-index-topics-list {
  margin: 0;
  color: color-mix(in srgb, var(--dark) 55%, transparent);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.7;
}

.posts-index-topic {
  color: color-mix(in srgb, var(--dark) 55%, transparent);
  font-weight: 400;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.25em;
  text-decoration-color: color-mix(in srgb, var(--dark) 20%, transparent);
  transition:
    color 0.2s ease,
    text-decoration-color 0.2s ease;

  &:hover,
  &:focus {
    color: var(--dark);
    text-decoration-color: var(--dark);
  }
}

.posts-list-count {
  margin: 0.35rem 0 0;
  color: color-mix(in srgb, var(--dark) 55%, transparent);
  font-size: 12px;
  font-weight: 400;
}

.posts-list {
  list-style: none;
  padding: 0;
  margin: 1.75rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.posts-year-group {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  align-items: baseline;
  column-gap: 16px;
  margin: 0;
  padding: 0;
}

.posts-year {
  color: color-mix(in srgb, var(--dark) 55%, transparent);
  font-size: 13px;
  font-weight: 400;
  line-height: 1.7;
  font-variant-numeric: tabular-nums;
}

.posts-year-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.posts-list-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: 1.5rem;
  padding: 0;
  margin: 0;
}

.posts-list-main {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.posts-list-date {
  color: color-mix(in srgb, var(--dark) 55%, transparent);
  font-size: 11px;
  font-weight: 400;
  font-style: normal;
  line-height: 1.7;
  white-space: nowrap;
}

.posts-list .posts-list-title.internal {
  color: var(--dark);
  font-size: 14px;
  font-weight: 400;
  min-width: 0;
  line-height: 1.7;
  text-decoration: none;
  background: none;
  background-color: transparent;
  padding: 0;
  border-radius: 0;

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
  gap: 0 0.75rem;
}

.posts-list-topic {
  color: color-mix(in srgb, var(--dark) 55%, transparent);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.7;
  text-decoration: none;
  white-space: nowrap;
  padding: 0;
  border-radius: 0;
  background: none;
  transition: color 0.2s ease;

  &:hover,
  &:focus {
    color: var(--dark);
    background: none;
  }
}

@media (max-width: 1024px) {
  .posts-list-item {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 0.35rem;
  }

  .posts-list-topics {
    justify-content: flex-start;
  }
}

@media (max-width: 800px) {
  .posts-index-topics {
    display: block;
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
