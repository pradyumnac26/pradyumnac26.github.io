import fs from "node:fs"
import path from "node:path"
import type { SocialImageOptions } from "@quartz-community/og-image"
import { formatDate } from "../components/Date"

function getOgDate(fileData: {
  dates?: Record<string, Date>
  defaultDateType?: string
}): Date | undefined {
  if (fileData.defaultDateType && fileData.dates) {
    return fileData.dates[fileData.defaultDateType]
  }

  return fileData.dates?.modified ?? fileData.dates?.created
}

export const titleAndDateOgImage: SocialImageOptions["imageStructure"] = ({
  cfg,
  userOpts,
  title,
  fonts,
  fileData,
}) => {
  const { colorScheme } = userOpts
  const theme = cfg.theme
  const fontBreakPoint = 32
  const useSmallerFont = title.length > fontBreakPoint
  const rawDate = getOgDate(fileData)
  const date = rawDate ? formatDate(rawDate, cfg.locale) : null
  const headerFont = fonts[0]?.name ?? "Inter"
  const bodyFont = fonts[1]?.name ?? headerFont

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        backgroundColor: theme.colors[colorScheme].light,
        padding: "4rem",
        gap: "1.5rem",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: useSmallerFont ? 64 : 72,
          fontFamily: headerFont,
          fontWeight: 700,
          color: theme.colors[colorScheme].dark,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>
      {date && (
        <p
          style={{
            margin: 0,
            fontSize: 36,
            fontFamily: bodyFont,
            color: theme.colors[colorScheme].gray,
          }}
        >
          {date}
        </p>
      )}
      <p
        style={{
          position: "absolute",
          right: "4rem",
          bottom: "4rem",
          margin: 0,
          fontSize: 32,
          fontFamily: bodyFont,
          color: theme.colors[colorScheme].darkgray,
        }}
      >
        {cfg.pageTitle}
      </p>
    </div>
  )
}

// Regenerate with `node scripts/capture-home-screenshot.mjs` while the dev server is running.
const homeScreenshotPath = path.join(process.cwd(), "quartz/static/og-home-screenshot.jpg")
let homeScreenshot: string | null | undefined

function loadHomeScreenshot(): string | null {
  if (homeScreenshot === undefined) {
    homeScreenshot = fs.existsSync(homeScreenshotPath)
      ? `data:image/jpeg;base64,${fs.readFileSync(homeScreenshotPath).toString("base64")}`
      : null
  }
  return homeScreenshot
}

const homeOgImage: SocialImageOptions["imageStructure"] = (opts) => {
  const screenshot = loadHomeScreenshot()
  if (!screenshot) return titleAndDateOgImage(opts)

  const { cfg, userOpts, fonts } = opts
  const colors = cfg.theme.colors[userOpts.colorScheme]
  const bodyFont = fonts[1]?.name ?? fonts[0]?.name ?? "Inter"
  const windowWidth = 800
  const windowHeight = 480

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        width: "100%",
        backgroundColor: cfg.theme.colors.lightMode.secondary,
        backgroundImage: [
          "radial-gradient(circle at 82% 8%, rgba(255, 238, 196, 0.95) 0%, rgba(255, 238, 196, 0.35) 22%, rgba(255, 238, 196, 0) 48%)",
          "radial-gradient(circle at 8% 100%, rgba(16, 15, 15, 0.45) 0%, rgba(16, 15, 15, 0) 55%)",
          `linear-gradient(135deg, ${cfg.theme.colors.lightMode.secondary} 0%, #4f7f78 45%, ${cfg.theme.colors.lightMode.tertiary} 100%)`,
        ].join(", "),
      }}
    >
      <div
        style={{
          position: "absolute",
          top: (userOpts.height - windowHeight) / 2,
          left: (userOpts.width - windowWidth) / 2,
          width: windowWidth,
          height: windowHeight,
          display: "flex",
          borderRadius: 18,
          overflow: "hidden",
          border: `1px solid rgba(255, 252, 240, 0.35)`,
          backgroundColor: colors.light,
          boxShadow: "0 30px 70px rgba(16, 15, 15, 0.45)",
        }}
      >
        <img src={screenshot} width={windowWidth} height={windowHeight} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 28,
          bottom: 26,
          display: "flex",
          padding: "8px 16px",
          borderRadius: 10,
          backgroundColor: "rgba(16, 15, 15, 0.88)",
          color: colors.light,
          fontFamily: bodyFont,
          fontSize: 20,
        }}
      >
        {cfg.pageTitle}
      </div>
    </div>
  )
}

export const siteOgImage: SocialImageOptions["imageStructure"] = (opts) =>
  opts.fileData.slug === "index" ? homeOgImage(opts) : titleAndDateOgImage(opts)
