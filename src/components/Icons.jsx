const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}

export function GoalIcon({ size = 20, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3l2.6 3.2L13 10l-3 1-2-3 2-5Z" />
      <path d="M21 12l-3.5-1.4L15 13l1 4 4 1" />
      <path d="M3 12l3.5-1.4L9 13l-1 4-4 1" />
      <path d="M12 21l-2-3.2 2-3.8 2 3.8-2 3.2Z" />
    </svg>
  )
}

export function AssistIcon({ size = 20, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M5 19h6a4 4 0 0 0 4-4V8" />
      <path d="M11 12l4-4 4 4" />
      <circle cx="5" cy="19" r="1.5" />
    </svg>
  )
}

export function TargetIcon({ size = 20, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function DribbleIcon({ size = 20, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M3 16c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
      <circle cx="20" cy="7" r="2" />
    </svg>
  )
}

export function ShieldIcon({ size = 20, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function TrophyIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M6 4h12v4a6 6 0 0 1-12 0V4Z" />
      <path d="M6 6H3v2a3 3 0 0 0 3 3M18 6h3v2a3 3 0 0 1-3 3" />
      <path d="M10 14h4l-.5 4h-3L10 14Z" />
      <path d="M8 20h8" />
    </svg>
  )
}

export function PlusIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function CloseIcon({ size = 18, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6l-6 12" />
      <path d="M18 6L6 18" />
    </svg>
  )
}

export function TrashIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M4 7h16" />
      <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function CalendarIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function TrendIcon({ size = 18, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M3 17l5-5 4 4 8-8" />
      <path d="M14 8h6v6" />
    </svg>
  )
}

export function ShotOffIcon({ size = 20, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="10" cy="12" r="7" strokeDasharray="3 2" />
      <path d="M17 5l4 4M21 5l-4 4" />
    </svg>
  )
}

export function MedalIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M7 3l3 6M17 3l-3 6" />
      <circle cx="12" cy="15" r="6" />
      <path d="M12 12.5l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3 1-2Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function FireIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 3s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-11-6-11Z" />
    </svg>
  )
}

export function LockIcon({ size = 18, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function LogoutIcon({ size = 14, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M15 12H5" />
    </svg>
  )
}

export function ChevronIcon({ size = 14, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function InfoIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.5" />
    </svg>
  )
}

export function ZapIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7Z" />
    </svg>
  )
}

export function BootIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M5 4h5v9h4l4 2 2 4v3H5V4Z" />
      <path d="M10 4v9M5 17h15" />
    </svg>
  )
}

export function EyeIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function SparkleIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8l2 4 4 0-3 2 1 4-4-2-4 2 1-4-3-2 4 0 2-4Z" />
    </svg>
  )
}

export function CrownIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M3 8l3 10h12l3-10-5 3-4-6-4 6-5-3Z" />
      <path d="M5 20h14" />
    </svg>
  )
}

export function StarIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 3l2.6 5.6 6.2.6-4.7 4.2 1.4 6.1L12 16.6 6.5 19.5l1.4-6.1-4.7-4.2 6.2-.6L12 3Z" />
    </svg>
  )
}

export function DiceIcon({ size = 14, ...rest }) {
  return (
    <svg {...base} {...rest} width={size} height={size} viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export const PRIZE_ICONS = {
  goldenBoot: BootIcon,
  goldenVision: EyeIcon,
  goldenSkills: SparkleIcon,
  winner: CrownIcon,
  playerOfMonth: StarIcon
}

export const STAT_ICONS = {
  goals: GoalIcon,
  assists: AssistIcon,
  shotsOnTarget: TargetIcon,
  shotsOffTarget: ShotOffIcon,
  dribbles: DribbleIcon,
  possessionWon: ShieldIcon
}
