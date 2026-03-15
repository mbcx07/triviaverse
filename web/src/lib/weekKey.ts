// ISO week key: YYYY-Www (e.g. 2026-W11)
// Used for weekly leaderboards.
export function isoWeekKey(date: Date = new Date()): string {
  // Copy date so we don't mutate caller
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number
  // (Sunday = 0, Monday = 1, ...)
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7)
  const year = d.getUTCFullYear()
  return `${year}-W${String(weekNo).padStart(2, '0')}`
}

export function utcDateKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}
