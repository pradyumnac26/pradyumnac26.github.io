import http from "node:http"
import * as entries from "./api/entries.js"

const PORT = Number(process.env.PORT ?? 8787)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const handler = url.pathname === "/api/entries" ? entries[req.method] : undefined
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
  console.log(`Guestbook API listening at http://localhost:${PORT}/api/entries`)
})
