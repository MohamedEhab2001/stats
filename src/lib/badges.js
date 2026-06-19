import React from 'react'

const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}

const svg = (paths, vb = '0 0 24 24') => ({ size = 28, ...rest } = {}) =>
  React.createElement('svg', { ...base, ...rest, width: size, height: size, viewBox: vb }, paths)

export const BADGES = {
  'shield-flame': svg([
    React.createElement('path', { key: 'a', d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z' }),
    React.createElement('path', { key: 'b', d: 'M12 8.5c.8 1.2 2.5 2.5 2.5 4.5a2.5 2.5 0 1 1-5 0c0-1.2.8-2.2 1.4-3 .3-.4.6-.9 1.1-1.5Z' })
  ]),
  'shield-crown': svg([
    React.createElement('path', { key: 'a', d: 'M12 4l7 2.5v5.5c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6.5L12 4Z' }),
    React.createElement('path', { key: 'b', d: 'M8.5 11l1.5 2 2-3 2 3 1.5-2v3.5h-7V11Z' })
  ]),
  'shield-bolt': svg([
    React.createElement('path', { key: 'a', d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z' }),
    React.createElement('path', { key: 'b', d: 'M13 8l-3 5h2.5L11 17l3.5-5.5H12L13 8Z' })
  ]),
  'shield-star': svg([
    React.createElement('path', { key: 'a', d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z' }),
    React.createElement('path', { key: 'b', d: 'M12 8l1.3 2.7 2.9.3-2.2 2 .6 2.9L12 14.5l-2.6 1.4.6-2.9-2.2-2 2.9-.3L12 8Z' })
  ]),
  'crown-laurel': svg([
    React.createElement('path', { key: 'a', d: 'M4 9l2 6h12l2-6-4 3-4-5-4 5-4-3Z' }),
    React.createElement('path', { key: 'b', d: 'M5 17h14' }),
    React.createElement('circle', { key: 'c', cx: '6', cy: '8', r: '0.8' }),
    React.createElement('circle', { key: 'd', cx: '18', cy: '8', r: '0.8' })
  ]),
  'crown-jeweled': svg([
    React.createElement('path', { key: 'a', d: 'M3 8l3 8h12l3-8-4.5 3L12 6 6.5 11 3 8Z' }),
    React.createElement('circle', { key: 'b', cx: '12', cy: '6', r: '1.2' }),
    React.createElement('circle', { key: 'c', cx: '6.5', cy: '11', r: '0.9' }),
    React.createElement('circle', { key: 'd', cx: '17.5', cy: '11', r: '0.9' })
  ]),
  'star-burst': svg([
    React.createElement('path', { key: 'a', d: 'M12 2l1.8 4.6L18.5 7l-3.5 3 1 5L12 12.7 8 15l1-5L5.5 7l4.7-.4L12 2Z' }),
    React.createElement('path', { key: 'b', d: 'M12 12.7v9' }),
    React.createElement('path', { key: 'c', d: 'M9 21l3-2 3 2' })
  ]),
  'gem-cut': svg([
    React.createElement('path', { key: 'a', d: 'M6 8l3-4h6l3 4-6 12L6 8Z' }),
    React.createElement('path', { key: 'b', d: 'M6 8h12' }),
    React.createElement('path', { key: 'c', d: 'M9 4l3 4 3-4M9 8l3 12 3-12' })
  ]),
  'comet': svg([
    React.createElement('circle', { key: 'a', cx: '17', cy: '7', r: '3' }),
    React.createElement('path', { key: 'b', d: 'M15 9l-9 9M12 9l-7 7M17 11l-6 6' })
  ]),
  'lion-rampant': svg([
    React.createElement('path', { key: 'a', d: 'M12 4c2 0 3.5 1.2 4 3 1 .5 1.5 1.5 1.5 2.5L19 11l-1 1 1 2-2 1-1 2-3-1-1 2-2-2-2 1-1-2-2-1 1-2-1-1 1.5-1.5c0-1 .5-2 1.5-2.5.5-1.8 2-3 4-3Z' }),
    React.createElement('circle', { key: 'b', cx: '10.5', cy: '9', r: '0.6' }),
    React.createElement('circle', { key: 'c', cx: '13.5', cy: '9', r: '0.6' })
  ]),
  'eagle-spread': svg([
    React.createElement('path', { key: 'a', d: 'M3 10c3-2 5-2 6 0M21 10c-3-2-5-2-6 0' }),
    React.createElement('path', { key: 'b', d: 'M12 6v12' }),
    React.createElement('path', { key: 'c', d: 'M9 9l3-3 3 3' }),
    React.createElement('path', { key: 'd', d: 'M9 16l3 2 3-2' }),
    React.createElement('path', { key: 'e', d: 'M5 12c2 1 3 1 4 .5M19 12c-2 1-3 1-4 .5' })
  ]),
  'crossed-swords': svg([
    React.createElement('path', { key: 'a', d: 'M4 4l9 9M20 4l-9 9' }),
    React.createElement('path', { key: 'b', d: 'M13 13l4 4-1 3-3 1-4-4 4-4Z' }),
    React.createElement('path', { key: 'c', d: 'M11 13l-4 4 1 3 3 1' })
  ]),
  'wreath': svg([
    React.createElement('path', { key: 'a', d: 'M12 4c-4 2-6 5-6 9s2 6 6 7c4-1 6-3 6-7s-2-7-6-9Z' }),
    React.createElement('path', { key: 'b', d: 'M8 9c1 0 2 .5 2.5 1.5M16 9c-1 0-2 .5-2.5 1.5M7 13c1.5 0 2.5.5 3 1.5M17 13c-1.5 0-2.5.5-3 1.5' }),
    React.createElement('path', { key: 'c', d: 'M10 18l2 2 2-2' })
  ]),
  'medal-ribbon': svg([
    React.createElement('path', { key: 'a', d: 'M8 3l-2 7 6 4 6-4-2-7' }),
    React.createElement('path', { key: 'b', d: 'M8 3l4 4M16 3l-4 4' }),
    React.createElement('circle', { key: 'c', cx: '12', cy: '16', r: '5' }),
    React.createElement('path', { key: 'd', d: 'M12 13l.9 1.9 2.1.3-1.5 1.5.4 2-1.9-1-1.9 1 .4-2-1.5-1.5 2.1-.3L12 13Z' })
  ])
}

export const BADGE_KEYS = Object.keys(BADGES)

export function randomBadgeKey() {
  return BADGE_KEYS[Math.floor(Math.random() * BADGE_KEYS.length)]
}

export function BadgeIcon({ badgeKey, size = 28, ...rest }) {
  const Cmp = BADGES[badgeKey] || BADGES['shield-star']
  return Cmp({ size, ...rest })
}
