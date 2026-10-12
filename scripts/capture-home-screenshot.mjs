#!/usr/bin/env node
// Captures the homepage for the home OG card. Run with the dev server up:
//   npm run dev  (in another terminal)
//   node scripts/capture-home-screenshot.mjs [url]
import { chromium } from "playwright"
import sharp from "sharp"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const url = process.argv[2] ?? "http://localhost:8080/"
const out = path.join(root, "quartz/static/og-home-screenshot.jpg")

const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({
  viewport: { width: 1440, height: 864 },
  deviceScaleFactor: 2,
  colorScheme: "light",
})
await page.addInitScript(() => localStorage.setItem("theme", "light"))
await page.goto(url, { waitUntil: "networkidle" })
await page.waitForTimeout(1500)
const png = await page.screenshot()
await browser.close()

await sharp(png).resize({ width: 1720 }).jpeg({ quality: 82, mozjpeg: true }).toFile(out)
console.log(`Saved ${path.relative(root, out)}`)
