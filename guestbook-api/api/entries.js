import { randomUUID, timingSafeEqual } from "node:crypto"
import { createStore } from "../lib/store.js"

const MAX_NAME_LENGTH = 60
const MAX_MESSAGE_LENGTH = 1000
const POST_COOLDOWN_MS = 10_000

const ownerKey = process.env.OWNER_KEY
const ownerName = process.env.OWNER_NAME ?? "Praddy"

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ??
  "https://pradyumnac26.github.io,https://pradyumnachippigiri.dev,http://localhost:8080"
)
  .split(",")
  .map((origin) => origin.trim())

const store = createStore()

// Best-effort only: serverless instances don't share memory, so this slows down
// a single spammer rather than guaranteeing a limit.
const lastPostByIp = new Map()

function corsHeaders(request) {
  const origin = request.headers.get("origin")
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  }
  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin
  }
  return headers
}

function json(request, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(request) },
  })
}

function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
}

function clean(value) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : ""
}

function isOwner(request) {
  const header = request.headers.get("authorization") ?? ""
  const supplied = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : ""
  if (!ownerKey || !supplied) return false
  const a = Buffer.from(supplied)
  const b = Buffer.from(ownerKey)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

// Entries are public, so the edge caches one copy for every origin. Visitors get it
// instantly and the function (and GitHub) is only hit in the background to refresh it.
export async function GET() {
  try {
    return new Response(JSON.stringify({ entries: await store.list() }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=86400",
      },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: "Couldn't load the guestbook right now." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return json(request, 400, { error: "Invalid request." })
  }

  // Honeypot field: hidden from people, but bots tend to fill it in.
  if (clean(body.website)) {
    return json(request, 201, { entry: null })
  }

  const owner = isOwner(request)
  if (request.headers.has("authorization") && !owner) {
    return json(request, 401, { error: "Owner key not accepted." })
  }

  const parentId = clean(body.parentId) || undefined
  if (parentId && !owner) {
    return json(request, 403, { error: `Only ${ownerName} can reply.` })
  }

  const name = owner ? ownerName : clean(body.name)
  const message = clean(body.message)
  if (!name || name.length > MAX_NAME_LENGTH) {
    return json(request, 400, { error: `Name must be 1 to ${MAX_NAME_LENGTH} characters.` })
  }
  if (!owner && name.toLowerCase() === ownerName.toLowerCase()) {
    return json(request, 400, { error: "That name is reserved. Please pick another." })
  }
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return json(request, 400, {
      error: `Message must be 1 to ${MAX_MESSAGE_LENGTH} characters.`,
    })
  }

  const ip = clientIp(request)
  const now = Date.now()
  if (!owner && now - (lastPostByIp.get(ip) ?? 0) < POST_COOLDOWN_MS) {
    return json(request, 429, { error: "Easy there! Please wait a few seconds and try again." })
  }

  const entry = {
    id: randomUUID(),
    parentId,
    name,
    message,
    owner: owner || undefined,
    createdAt: new Date(now).toISOString(),
  }
  try {
    if (parentId) {
      const parent = (await store.list()).find((existing) => existing.id === parentId)
      if (!parent) {
        return json(request, 400, { error: "The message you're replying to no longer exists." })
      }
      if (parent.parentId) {
        return json(request, 400, { error: "Replies can only be added to top-level comments." })
      }
    }
    await store.add(entry)
  } catch (err) {
    console.error(err)
    return json(request, 500, { error: "Couldn't save your note. Please try again." })
  }
  if (!owner) lastPostByIp.set(ip, now)
  return json(request, 201, { entry })
}
