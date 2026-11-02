import http from "node:http"
import * as entries from "./api/entries.js"
import * as analytics from "./api/analytics.js"

const PORT = Number(process.env.PORT ?? 8787)
const routes = { "/api/entries": entries, "/api/analytics": analytics }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const handler = routes[url.pathname]?.[req.method]
  if (!handler) {
    res.writeHead(404).end()
    return
  }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") headers.set(key, value)
  }
  if (!headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", req.socket.remoteAddress ?? "local")
  }

  const request = new Request(url, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(chunks),
  })
  const response = await handler(request)
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
})

server.listen(PORT, () => {
  console.log(`Guestbook API listening at http://localhost:${PORT}/api/entries and /api/analytics`)
})
