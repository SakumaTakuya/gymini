import type { DateString } from '../schemas/date'

export function formatDateHeader(date: DateString): string {
  const [, m, d] = date.split('-').map(Number)
  return `${m}月${d}日の記録`
}
