interface GuestbookEntry {
  id: string
  parentId?: string
  name: string
  message: string
  owner?: boolean
  createdAt: string
}

const OWNER_KEY_STORAGE_KEY = "guestbook-owner-key"
const OWNER_HASH_PREFIX = "#owner="
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

const SVG_NS = "http://www.w3.org/2000/svg"
const AVATAR_GRID = 5

function byCreatedAt(a: GuestbookEntry, b: GuestbookEntry) {
  return a.createdAt.localeCompare(b.createdAt)
}

// FNV-1a, so the same name always produces the same avatar.
function hashName(name: string): number {
  let hash = 0x811c9dc5
  for (const char of name.trim().toLowerCase()) {
    hash ^= char.codePointAt(0)!
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

// GitHub-style identicon: a mirrored 5x5 grid whose cells and color come from the name hash.
function identicon(name: string): SVGSVGElement {
  const hash = hashName(name)
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("viewBox", `0 0 ${AVATAR_GRID} ${AVATAR_GRID}`)
  svg.setAttribute("aria-hidden", "true")
  svg.classList.add("guestbook-avatar")
  svg.style.setProperty("--avatar-hue", String(hash % 360))

  const half = Math.ceil(AVATAR_GRID / 2)
  for (let row = 0; row < AVATAR_GRID; row++) {
    for (let col = 0; col < half; col++) {
      if (((hash >>> (8 + row * half + col)) & 1) === 0) continue
      for (const x of new Set([col, AVATAR_GRID - 1 - col])) {
        const cell = document.createElementNS(SVG_NS, "rect")
        cell.setAttribute("x", String(x))
        cell.setAttribute("y", String(row))
        cell.setAttribute("width", "1")
        cell.setAttribute("height", "1")
        svg.append(cell)
      }
    }
  }
  return svg
}

// Generic person silhouette shown until a name is typed.
function defaultAvatar(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("aria-hidden", "true")
  svg.classList.add("guestbook-avatar", "guestbook-avatar-default")
  const head = document.createElementNS(SVG_NS, "circle")
  head.setAttribute("cx", "12")
  head.setAttribute("cy", "9.5")
  head.setAttribute("r", "4.5")
  const body = document.createElementNS(SVG_NS, "path")
  body.setAttribute("d", "M3 25c0-5.5 4-9 9-9s9 3.5 9 9z")
  svg.append(head, body)
  return svg
}

// Visiting the page with `#owner=<key>` saves the key in this browser; `#owner=` clears it.
function readOwnerKey(): string | null {
  if (location.hash.startsWith(OWNER_HASH_PREFIX)) {
    const key = decodeURIComponent(location.hash.slice(OWNER_HASH_PREFIX.length))
    if (key) localStorage.setItem(OWNER_KEY_STORAGE_KEY, key)
    else localStorage.removeItem(OWNER_KEY_STORAGE_KEY)
    history.replaceState(history.state, "", location.pathname + location.search)
  }
  return localStorage.getItem(OWNER_KEY_STORAGE_KEY)
}

function setupGuestbook() {
  const root = document.querySelector<HTMLElement>(".guestbook")
  if (!root) return
  const apiUrl = root.dataset.api!
  const ownerAvatar = root.dataset.ownerAvatar
  const mainForm = root.querySelector<HTMLFormElement>(".guestbook-form")!
  const list = root.querySelector<HTMLUListElement>(".guestbook-entries")!
  const replies = new Map<string, GuestbookEntry[]>()
  const cleanups: (() => void)[] = []
  const ownerKey = readOwnerKey()

  // The API always posts the owner under their own name, so the field is dropped.
  if (ownerKey) mainForm.querySelector("input[name=name]")?.remove()

  const avatarFor = (name: string, owner: boolean): Element => {
    if (owner && ownerAvatar) {
      const photo = document.createElement("img")
      photo.className = "guestbook-avatar"
      photo.src = ownerAvatar
      photo.alt = ""
      return photo
    }
    if (name.trim()) return identicon(name)
    return defaultAvatar()
  }

  const post = async (payload: Record<string, unknown>) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (ownerKey) headers.Authorization = `Bearer ${ownerKey}`
    const res = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
    const body = (await res.json()) as { entry?: GuestbookEntry | null; error?: string }
    if (!res.ok) throw new Error(body.error ?? "Something went wrong.")
    return body.entry ?? null
  }

  // Wires a form to post an entry; `onPosted` places the new entry in the thread.
  const bindForm = (
    form: HTMLFormElement,
    parentId: string | undefined,
    onPosted: (entry: GuestbookEntry) => void,
  ) => {
    const button = form.querySelector<HTMLButtonElement>("button[type=submit]")!
    const status = form.querySelector<HTMLElement>(".guestbook-status")!
    const nameInput = form.querySelector<HTMLInputElement>("input[name=name]")

    // Without a name field the poster is the owner, so their photo is shown.
    const avatarSlot = form.querySelector(".guestbook-form-avatar")!
    const updateAvatar = () =>
      avatarSlot.replaceChildren(avatarFor(nameInput?.value ?? "", !nameInput))
    updateAvatar()
    if (nameInput) {
      nameInput.addEventListener("input", updateAvatar)
      cleanups.push(() => nameInput.removeEventListener("input", updateAvatar))
    }

    const onSubmit = async (event: SubmitEvent) => {
      event.preventDefault()
      const data = Object.fromEntries(new FormData(form))
      button.disabled = true
      status.dataset.state = ""
      status.textContent = "Posting…"
      try {
        const entry = await post({ ...data, parentId })
        form.reset()
        updateAvatar()
        status.textContent = ""
        if (entry) onPosted(entry)
      } catch (err) {
        status.dataset.state = "error"
        status.textContent = err instanceof Error ? err.message : "Something went wrong."
      } finally {
        button.disabled = false
      }
    }
    form.addEventListener("submit", onSubmit)
    cleanups.push(() => form.removeEventListener("submit", onSubmit))
  }

  const openReplyForm = (item: HTMLLIElement, entry: GuestbookEntry) => {
    root.querySelector(".guestbook-reply-form")?.remove()

    const form = mainForm.cloneNode(true) as HTMLFormElement
    form.reset()
    form.querySelector(".guestbook-status")!.textContent = ""
    form.querySelector("input[name=name]")?.remove()
    form.classList.add("guestbook-reply-form")
    form.querySelector("textarea")!.placeholder = `Reply to ${entry.name}…`
    form.querySelector("button[type=submit]")!.textContent = "Reply"
    const cancel = document.createElement("button")
    cancel.type = "button"
    cancel.className = "guestbook-cancel"
    cancel.textContent = "Cancel"
    cancel.addEventListener("click", () => form.remove())
    form.querySelector(".guestbook-status")!.before(cancel)

    bindForm(form, entry.id, (reply) => {
      form.remove()
      item
        .querySelector<HTMLUListElement>(":scope > .guestbook-replies")!
        .append(renderEntry(reply))
    })
    item.querySelector(":scope > .guestbook-entry-body")!.after(form)
    form.querySelector("textarea")!.focus()
  }

  // User-provided text is only ever set through textContent, never innerHTML.
  const renderEntry = (entry: GuestbookEntry): HTMLLIElement => {
    const item = document.createElement("li")
    item.className = "guestbook-entry"

    const body = document.createElement("div")
    body.className = "guestbook-entry-body"

    const avatar = avatarFor(entry.name, entry.owner === true)

    const content = document.createElement("div")
    content.className = "guestbook-entry-content"

    const header = document.createElement("div")
    header.className = "guestbook-entry-header"
    const name = document.createElement("strong")
    name.className = "guestbook-entry-name"
    name.textContent = entry.name
    header.append(name)
    if (entry.owner) {
      const badge = document.createElement("span")
      badge.className = "guestbook-author"
      badge.textContent = "author"
      header.append(badge)
    }
    const date = document.createElement("time")
    date.dateTime = entry.createdAt
    date.textContent = dateFormat.format(new Date(entry.createdAt))
    header.append(` ${entry.parentId ? "replied" : "commented"} on `, date)

    const message = document.createElement("p")
    message.className = "guestbook-entry-message"
    message.textContent = entry.message

    content.append(header, message)
    if (ownerKey && !entry.owner && !entry.parentId) {
      const reply = document.createElement("button")
      reply.type = "button"
      reply.className = "guestbook-reply"
      reply.textContent = "Reply"
      reply.addEventListener("click", () => openReplyForm(item, entry))
      content.append(reply)
    }
    body.append(avatar, content)

    const children = document.createElement("ul")
    children.className = "guestbook-replies"
    children.append(...(replies.get(entry.id) ?? []).sort(byCreatedAt).map(renderEntry))

    item.append(body, children)
    return item
  }

  const showMessage = (text: string) => {
    const note = document.createElement("li")
    note.className = "guestbook-empty"
    note.textContent = text
    list.replaceChildren(note)
  }

  const load = async () => {
    try {
      const res = await fetch(apiUrl)
      if (!res.ok) throw new Error(String(res.status))
      const { entries } = (await res.json()) as { entries: GuestbookEntry[] }
      const ids = new Set(entries.map((entry) => entry.id))
      const topLevel: GuestbookEntry[] = []
      for (const entry of entries) {
        if (entry.parentId && ids.has(entry.parentId)) {
          replies.set(entry.parentId, [...(replies.get(entry.parentId) ?? []), entry])
        } else {
          topLevel.push(entry)
        }
      }
      if (topLevel.length === 0) showMessage("No messages yet.")
      else list.replaceChildren(...topLevel.sort(byCreatedAt).reverse().map(renderEntry))
    } catch {
      showMessage("Couldn't load messages right now.")
    }
  }

  bindForm(mainForm, undefined, (entry) => {
    list.querySelector(".guestbook-empty")?.remove()
    list.prepend(renderEntry(entry))
  })
  window.addCleanup?.(() => cleanups.forEach((fn) => fn()))
  void load()
}

document.addEventListener("nav", setupGuestbook)
