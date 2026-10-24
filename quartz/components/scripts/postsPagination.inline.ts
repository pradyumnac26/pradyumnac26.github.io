function addCleanup(fn: () => void) {
  if (typeof window.addCleanup === "function") {
    window.addCleanup(fn)
  }
}

function readPage(totalPages: number): number {
  const raw = Number(new URL(window.location.href).searchParams.get("page"))
  if (!Number.isInteger(raw) || raw < 1) return 1
  return Math.min(raw, totalPages)
}

function writePage(page: number) {
  const url = new URL(window.location.href)
  if (page === 1) {
    url.searchParams.delete("page")
  } else {
    url.searchParams.set("page", String(page))
  }
  window.history.replaceState(window.history.state, "", url.toString())
}

function pageNumbers(current: number, total: number): (number | null)[] {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result: (number | null)[] = []
  for (const p of sorted) {
    const prev = result[result.length - 1]
    if (typeof prev === "number" && p - prev > 1) result.push(null)
    result.push(p)
  }
  return result
}

function setupPagination(root: HTMLElement) {
  const pageSize = Number(root.dataset.pageSize)
  const items = [...root.querySelectorAll<HTMLElement>(".posts-list-item")]
  const totalPages = Math.ceil(items.length / pageSize)
  if (!pageSize || totalPages <= 1) return

  const groups = [...root.querySelectorAll<HTMLElement>(".posts-year-group")]
  const count = root.querySelector<HTMLElement>(".posts-list-count")
  const list = root.querySelector<HTMLElement>(".posts-list")
  const countText = count?.textContent ?? ""

  const nav = document.createElement("nav")
  nav.className = "posts-pagination"
  nav.setAttribute("aria-label", "Pagination")
  list?.after(nav)

  function makeButton(label: string, target: number, opts: { current?: boolean; disabled?: boolean } = {}) {
    const button = document.createElement("button")
    button.type = "button"
    button.textContent = label
    button.className = "posts-pagination-button"
    if (opts.current) {
      button.classList.add("is-current")
      button.setAttribute("aria-current", "page")
    }
    if (opts.disabled) button.disabled = true
    button.addEventListener("click", () => {
      render(target)
      writePage(target)
      root.scrollIntoView({ block: "start" })
    })
    return button
  }

  function render(page: number) {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    items.forEach((item, index) => {
      item.hidden = index < start || index >= end
    })
    for (const group of groups) {
      group.hidden = !group.querySelector(".posts-list-item:not([hidden])")
    }
    if (count) {
      count.textContent = `${countText} · page ${page} of ${totalPages}`
    }

    nav.replaceChildren(
      makeButton("← Prev", page - 1, { disabled: page === 1 }),
      ...pageNumbers(page, totalPages).map((p) => {
        if (p === null) {
          const gap = document.createElement("span")
          gap.className = "posts-pagination-gap"
          gap.textContent = "…"
          return gap
        }
        return makeButton(String(p), p, { current: p === page })
      }),
      makeButton("Next →", page + 1, { disabled: page === totalPages }),
    )
  }

  render(readPage(totalPages))
  addCleanup(() => nav.remove())
}

document.addEventListener("nav", () => {
  for (const root of document.querySelectorAll<HTMLElement>(".posts-page[data-page-size]")) {
    setupPagination(root)
  }
})
