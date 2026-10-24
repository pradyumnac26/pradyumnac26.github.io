const VISIBLE_COUNT = 8

function setupBacklinks(list: HTMLUListElement) {
  list.parentElement?.querySelector(":scope > .backlinks-toggle")?.remove()
  const items = [...list.querySelectorAll<HTMLLIElement>(":scope > li:not(.overflow-end)")]
  for (const item of items) item.classList.remove("backlinks-hidden")
  const extra = items.slice(VISIBLE_COUNT)
  if (extra.length < 3) return

  const toggle = document.createElement("button")
  toggle.type = "button"
  toggle.className = "backlinks-toggle"
  list.after(toggle)

  function render(expanded: boolean) {
    for (const item of extra) {
      item.classList.toggle("backlinks-hidden", !expanded)
    }
    toggle.textContent = expanded ? "Show less" : `Show ${extra.length} more`
    toggle.setAttribute("aria-expanded", String(expanded))
  }

  let expanded = false
  toggle.addEventListener("click", () => {
    expanded = !expanded
    render(expanded)
  })
  render(expanded)
}

document.addEventListener("nav", () => {
  for (const list of document.querySelectorAll<HTMLUListElement>(".backlinks > ul")) {
    setupBacklinks(list)
  }
})
