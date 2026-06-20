import { useState } from 'react'
import { BadgeIcon } from '../lib/badges.js'
import { leagueLogoUrl } from '../lib/leagues.js'

export default function LeagueLogo({ leagueId, badgeKey, size = 36 }) {
  const [failed, setFailed] = useState(false)

  if (leagueId && !failed) {
    return (
      <img
        src={leagueLogoUrl(leagueId)}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain', width: size, height: size, display: 'block' }}
        onError={() => setFailed(true)}
      />
    )
  }

  return <BadgeIcon badgeKey={badgeKey} size={size} />
}
