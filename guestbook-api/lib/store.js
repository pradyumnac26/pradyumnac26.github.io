import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const MAX_WRITE_ATTEMPTS = 3

/**
 * Entries are kept newest-first in a single JSON array.
 * In production the array lives in a file on a dedicated branch of the site repo,
 * so it never triggers a site rebuild. Locally it lives in `.data/entries.json`.
 */
export function createStore() {
  return process.env.GITHUB_TOKEN ? githubStore() : fileStore()
}

function fileStore() {
  const file = path.join(import.meta.dirname, "..", ".data", "entries.json")

  async function list() {
    try {
      return JSON.parse(await readFile(file, "utf8"))
    } catch (err) {
      if (err.code === "ENOENT") return []
      throw err
    }
  }

  async function add(entry) {
    const entries = [entry, ...(await list())]
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(entries, null, 2) + "\n")
  }

  return { list, add }
}

function githubStore() {
  const repo = process.env.GITHUB_REPO ?? "pradyumnac26/pradyumnac26.github.io"
  const branch = process.env.GITHUB_BRANCH ?? "guestbook-data"
  const filePath = process.env.GITHUB_FILE ?? "entries.json"
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
  }

  async function read() {
    const res = await fetch(`${url}?ref=${encodeURIComponent(branch)}`, { headers })
    if (res.status === 404) return { entries: [], sha: undefined }
    if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${await res.text()}`)
    const body = await res.json()
    const entries = JSON.parse(Buffer.from(body.content, "base64").toString("utf8"))
    return { entries, sha: body.sha }
  }

  async function list() {
    return (await read()).entries
  }

  // GitHub rejects a write whose `sha` is stale, so concurrent posts retry on a fresh read
  // instead of overwriting each other.
  async function add(entry) {
    for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt++) {
      const { entries, sha } = await read()
      const content = JSON.stringify([entry, ...entries], null, 2) + "\n"
      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `guestbook: entry from ${entry.name}`,
          content: Buffer.from(content, "utf8").toString("base64"),
          branch,
          sha,
        }),
      })
      if (res.ok) return
      if ((res.status === 409 || res.status === 422) && attempt < MAX_WRITE_ATTEMPTS) continue
      throw new Error(`GitHub write failed: ${res.status} ${await res.text()}`)
    }
  }

  return { list, add }
}
