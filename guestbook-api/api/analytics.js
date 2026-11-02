const WEEKS = 52
const TOP_LIMIT = 5
const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

const site = process.env.GOATCOUNTER_SITE ?? "pradyumna"
const token = process.env.GOATCOUNTER_TOKEN

function respond(status, body, cacheControl) {
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  if (cacheControl) headers["Cache-Control"] = cacheControl
  return new Response(JSON.stringify(body), { status, headers })
}

// GoatCounter wants RFC 3339 times rounded to the hour.
function hourIso(date) {
  return date.toISOString().slice(0, 13) + ":00:00Z"
}

async function goatcounter(path, params) {
  const url = new URL(`https://${site}.goatcounter.com/api/v0/${path}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`GoatCounter ${path} responded ${res.status}: ${await res.text()}`)
  return res.json()
}

function weeklyTotals(stats, firstDay) {
  const weeks = Array.from({ length: WEEKS }, (_, i) => ({
    start: new Date(firstDay + i * WEEK_MS).toISOString().slice(0, 10),
    visitors: 0,
  }))
  for (const { day, daily } of stats) {
    const index = Math.floor((Date.parse(day) - firstDay) / WEEK_MS)
    weeks[Math.min(Math.max(index, 0), WEEKS - 1)].visitors += daily ?? 0
  }
  return weeks
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*" } })
}

// Site-wide visitor stats for the last 52 weeks. The GoatCounter token stays on the server,
// and the edge cache means GoatCounter is asked at most about once an hour.
export async function GET() {
  if (!token) return respond(503, { error: "Analytics aren't configured." })

  const end = new Date()
  const start = new Date(end.getTime() - WEEKS * WEEK_MS + DAY_MS)
  const range = { start: hourIso(start), end: hourIso(end) }

  try {
    const [total, hits, refs, locations] = await Promise.all([
      goatcounter("stats/total", range),
      goatcounter("stats/hits", { ...range, limit: TOP_LIMIT }),
      goatcounter("stats/toprefs", { ...range, limit: TOP_LIMIT }),
      goatcounter("stats/locations", { ...range, limit: TOP_LIMIT }),
    ])

    const weeks = weeklyTotals(total.stats ?? [], Date.parse(range.start.slice(0, 10)))
    return respond(
      200,
      {
        total: weeks.reduce((sum, week) => sum + week.visitors, 0),
        weeks,
        pages: (hits.hits ?? []).map(({ path, title, count }) => ({
          path,
          title: title || path,
          visitors: count,
        })),
        referrers: (refs.stats ?? []).map(({ name, count }) => ({
          name: name || "Direct or unknown",
          visitors: count,
        })),
        countries: (locations.stats ?? []).map(({ name, count }) => ({
          name: name || "Unknown",
          visitors: count,
        })),
      },
      "public, s-maxage=3600, stale-while-revalidate=86400",
    )
  } catch (err) {
    console.error(err)
    return respond(502, { error: "Couldn't load analytics right now." })
  }
}
