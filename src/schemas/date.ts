import { z } from 'zod'

// DateString: YYYY-MM-DD branded type
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export type DateString = string & { readonly __brand: 'DateString' }

export function toDateString(value: string): DateString {
  dateStringSchema.parse(value)
  return value as DateString
}

export function todayDateString(): DateString {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}` as DateString
}

// ISODateTimeString: ISO 8601 datetime branded type
export const isoDateTimeSchema = z.string().datetime({ offset: true })
export type ISODateTimeString = string & {
  readonly __brand: 'ISODateTimeString'
}

export function toISODateTimeString(value: string): ISODateTimeString {
  isoDateTimeSchema.parse(value)
  return value as ISODateTimeString
}

export function nowISODateTimeString(): ISODateTimeString {
  return new Date().toISOString() as ISODateTimeString
}
