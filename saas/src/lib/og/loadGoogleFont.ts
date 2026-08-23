// Fetches a Google Font's TTF bytes at request time, for use as a next/og `ImageResponse` font.
// Satori (which powers ImageResponse) needs raw font bytes, not a stylesheet, and only reads
// ttf/otf/woff — not woff2. Google's CSS2 API chooses the format based on the request's
// User-Agent, serving woff2 to any modern browser UA and falling back to plain ttf for
// unrecognized ones, so we deliberately send a bare/unrecognized UA to force ttf. `text` should
// be the actual string being rendered — Google returns a subsetted font containing only the
// glyphs it needs, which keeps the fetch small and (per Satori's docs) parses faster.
export async function loadGoogleFont(family: string, text: string, weight = 700): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`
    const cssRes = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!cssRes.ok) return null

    const css = await cssRes.text()
    const match = css.match(/src: url\(([^)]+)\) format\('truetype'\)/)
    if (!match) return null

    const fontRes = await fetch(match[1])
    if (!fontRes.ok) return null
    return await fontRes.arrayBuffer()
  } catch {
    // Offline, DNS failure, Google Fonts down, etc. — caller falls back to the system default.
    return null
  }
}

/** True if `text` contains any Arabic-script codepoint, so callers can pick an Arabic-capable
 * family (nicknames are free text and may be in Arabic). */
export function hasArabicText(text: string): boolean {
  return /[؀-ۿݐ-ݿ]/.test(text)
}

/** Renders `text` as a standalone data-URI SVG `<img>`, for use inside an `ImageResponse` tree.
 *
 * Why: satori's own text shaper (used for any plain text node in an ImageResponse) is a
 * simplified, non-HarfBuzz implementation that crashes the entire render — not just mis-renders
 * — on certain Arabic letter joins, including the alef-lam sequence in "ال" (the definite
 * article, i.e. extremely common in real names/space names). Handing satori a pre-built SVG
 * `<img>` instead sidesteps its text shaper: satori just embeds the SVG unprocessed, and the
 * actual SVG-to-PNG rasterization step (resvg) uses real shaping and draws Arabic correctly. */
export function arabicTextAsImage(
  text: string,
  fontData: ArrayBuffer,
  opts: { fontSize: number; fontWeight: number; color: string; width: number; height: number }
): string {
  const { fontSize, fontWeight, color, width, height } = opts
  const fontBase64 = Buffer.from(fontData).toString('base64')
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <style>
        @font-face { font-family: 'ArabicShared'; src: url(data:font/ttf;base64,${fontBase64}) format('truetype'); }
        text { font-family: 'ArabicShared'; font-weight: ${fontWeight}; }
      </style>
    </defs>
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${fontSize}" fill="${color}">${escaped}</text>
  </svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
