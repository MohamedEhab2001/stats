import { ImageResponse } from 'next/og'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getActiveMembership } from '@/lib/services/memberships'
import { getFifaCardForSpace } from '@/lib/services/fifaCard'
import { getSpaceById } from '@/lib/services/spaces'
import { loadGoogleFont, hasArabicText, arabicTextAsImage } from '@/lib/og/loadGoogleFont'
import { errorResponse, ServiceError } from '@/lib/services/errors'
import type { FifaCard } from '@/lib/stats-engine/fifaCard'

export const dynamic = 'force-dynamic'

const WIDTH = 800
const HEIGHT = 1120

type Tier = 'gold' | 'silver' | 'bronze'

const TIER_COLORS: Record<Tier, { border: string; rail: string; ovr: string; glow: string }> = {
  gold: { border: '#d4af37', rail: '#d4af37', ovr: '#e8cf7a', glow: 'rgba(212,175,55,0.35)' },
  silver: { border: '#c4c9d4', rail: '#c4c9d4', ovr: '#e5e8ee', glow: 'rgba(196,201,212,0.25)' },
  bronze: { border: '#b6752e', rail: '#c98a44', ovr: '#e0a96a', glow: 'rgba(182,117,46,0.3)' }
}

function tierFor(ovr: number): Tier {
  if (ovr >= 80) return 'gold'
  if (ovr >= 65) return 'silver'
  return 'bronze'
}

const ATTRIBUTE_KEYS: (keyof FifaCard['attributes'])[] = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY']

/** A piece of display text that may need to be rendered as an SVG <img> instead of a plain
 * satori text node — see arabicTextAsImage's doc comment for why. */
async function renderableText(
  text: string,
  opts: { fontSize: number; fontWeight: number; color: string; width: number; height: number }
): Promise<{ kind: 'text' } | { kind: 'image'; src: string }> {
  if (!hasArabicText(text)) return { kind: 'text' }
  const font = await loadGoogleFont('Noto Sans Arabic', text, opts.fontWeight >= 700 ? 700 : 400)
  if (!font) return { kind: 'text' } // font fetch failed — fall back to plain (satori) text rendering
  return { kind: 'image', src: arabicTextAsImage(text, font, opts) }
}

// Renders the same "player card" as FifaCardView.tsx, but as a downloadable/shareable PNG.
// Satori (which ImageResponse runs on) only understands inline styles, not Tailwind classes or
// arbitrary CSS, so this intentionally re-implements the layout rather than importing that
// component — keep the two visually in sync by hand when either changes.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ spaceId: string; userId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { spaceId, userId } = await params

  try {
    const membership = await getActiveMembership(spaceId, session.user.id)
    if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [space, cards] = await Promise.all([getSpaceById(spaceId), getFifaCardForSpace(spaceId, userId)])
    if (!space) throw new ServiceError(404, 'Space not found')
    const card = cards[userId]
    if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const tier = tierFor(card.ovr)
    const colors = TIER_COLORS[tier]

    const brandFontData = await loadGoogleFont('Inter', 'RIVALRY0123456789PACSHOPASDRIDEFPHYxG', 800)
    const fonts: { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: 'normal' }[] = []
    if (brandFontData) fonts.push({ name: 'Brand', data: brandFontData, weight: 800, style: 'normal' })
    const brandFamily = brandFontData ? 'Brand' : 'sans-serif'

    const [nicknameRender, spaceNameRender] = await Promise.all([
      renderableText(card.nickname, { fontSize: 44, fontWeight: 800, color: '#f5f5f4', width: 680, height: 80 }),
      renderableText(space.name, { fontSize: 22, fontWeight: 400, color: '#a1a1aa', width: 680, height: 40 })
    ])

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 56,
            backgroundColor: '#0a0a0c',
            backgroundImage: `radial-gradient(circle at 50% -10%, ${colors.glow}, transparent 55%)`,
            fontFamily: brandFamily,
            color: '#f5f5f4',
            position: 'relative'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              borderRadius: 40,
              border: `3px solid ${colors.border}`,
              padding: 48,
              backgroundImage: `linear-gradient(180deg, ${colors.glow}, rgba(10,10,12,0) 45%)`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: 128, fontWeight: 800, lineHeight: 1, color: colors.ovr }}>
                  {card.ovr}
                </div>
                <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: '#a1a1aa', marginTop: 8 }}>
                  {card.position}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 26,
                  fontWeight: 800,
                  color: colors.border,
                  letterSpacing: 4
                }}
              >
                RIVALRY
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1 }} />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                paddingTop: 24,
                paddingBottom: 32,
                borderTop: `2px dashed rgba(245,245,244,0.25)`,
                borderBottom: `2px dashed rgba(245,245,244,0.25)`
              }}
            >
              <div style={{ display: 'flex', width: 64, height: 4, borderRadius: 999, backgroundColor: colors.rail }} />
              {nicknameRender.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nicknameRender.src} width={680} height={80} alt={card.nickname} />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    fontSize: 48,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 2
                  }}
                >
                  {card.nickname}
                </div>
              )}
              {spaceNameRender.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={spaceNameRender.src} width={680} height={40} alt={space.name} />
              ) : (
                <div style={{ display: 'flex', fontSize: 22, color: '#a1a1aa' }}>{space.name}</div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                paddingTop: 32
              }}
            >
              {[0, 1, 2].map((row) => (
                <div key={row} style={{ display: 'flex', gap: 32 }}>
                  {ATTRIBUTE_KEYS.slice(row * 2, row * 2 + 2).map((key) => {
                    const value = card.attributes[key]
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                        <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, color: '#a1a1aa', width: 64 }}>
                          {key}
                        </div>
                        <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, width: 56 }}>{value}</div>
                        <div
                          style={{
                            display: 'flex',
                            flex: 1,
                            height: 10,
                            borderRadius: 999,
                            backgroundColor: 'rgba(245,245,244,0.12)'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              width: `${Math.min(100, (value / 99) * 100)}%`,
                              height: '100%',
                              borderRadius: 999,
                              backgroundColor: colors.rail
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      { width: WIDTH, height: HEIGHT, fonts }
    )
  } catch (err) {
    return errorResponse(err)
  }
}
