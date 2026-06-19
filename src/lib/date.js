export function isoWeek(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr + 'T00:00:00Z')
  if (isNaN(d.getTime())) return 0
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}
