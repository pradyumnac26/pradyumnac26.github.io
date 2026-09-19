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
