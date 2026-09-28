import { describe, expect, it } from 'vitest'
import {
  cn,
  formatDate,
  formatDateTime,
  formatRelative,
  formatSalary,
  humanize,
  initials,
  isOverdue,
  parseDate,
} from '@/lib/utils'

/** Local YYYY-MM-DD so assertions do not depend on the machine timezone. */
function localISO(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

describe('cn', () => {
  it('merges conflicting tailwind classes, keeping the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('keeps non-conflicting classes in order', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('ignores false/null values', () => {
    expect(cn('p-2', false && 'p-4', null, undefined)).toBe('p-2')
  })

  it('handles an empty call', () => {
    expect(cn()).toBe('')
  })
})

describe('parseDate', () => {
  it('returns null for empty input', () => {
    expect(parseDate(null)).toBeNull()
    expect(parseDate(undefined)).toBeNull()
    expect(parseDate('')).toBeNull()
  })

  it('returns null for unparseable strings', () => {
    expect(parseDate('not-a-date')).toBeNull()
    expect(parseDate('2026-13-45')).toBeNull()
  })

  it('parses a real ISO string', () => {
    const parsed = parseDate('2026-03-05')
    expect(parsed).toBeInstanceOf(Date)
    expect(parsed?.getFullYear()).toBe(2026)
  })
})

describe('formatDate', () => {
  it('returns a dash when there is no date', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('')).toBe('-')
  })

  it('formats with the default pattern', () => {
    expect(formatDate('2026-03-05')).toBe('Mar 5, 2026')
  })

  it('honours a custom pattern', () => {
    expect(formatDate('2026-03-05', 'yyyy-MM-dd')).toBe('2026-03-05')
  })

  it('returns a dash for invalid dates', () => {
    expect(formatDate('garbage')).toBe('-')
  })
})

describe('formatDateTime', () => {
  it('returns a dash when there is no date', () => {
    expect(formatDateTime(null)).toBe('-')
  })

  it('includes both date and time', () => {
    const out = formatDateTime('2026-03-05')
    expect(out).toContain('Mar 5, 2026')
    expect(out).not.toBe('-')
  })
})

describe('formatRelative', () => {
  it('returns a dash when there is no date', () => {
    expect(formatRelative(null)).toBe('-')
  })

  it('describes past dates with a suffix', () => {
    expect(formatRelative('2020-01-01')).toMatch(/ago$/)
  })

  it('describes future dates as upcoming', () => {
    expect(formatRelative(localISO(3))).toMatch(/^in /)
  })
})

describe('humanize', () => {
  it('falls back to Unknown', () => {
    expect(humanize(null)).toBe('Unknown')
    expect(humanize(undefined)).toBe('Unknown')
    expect(humanize('')).toBe('Unknown')
  })

  it('title-cases snake_case values', () => {
    expect(humanize('full_time')).toBe('Full Time')
    expect(humanize('rejected')).toBe('Rejected')
  })
})

describe('formatSalary', () => {
  it('returns a dash when both bounds are missing', () => {
    expect(formatSalary(null, null)).toBe('-')
    expect(formatSalary(undefined, undefined)).toBe('-')
  })

  it('formats a range', () => {
    expect(formatSalary(100000, 150000)).toBe('$100,000 - $150,000')
  })

  it('formats an open-ended minimum', () => {
    expect(formatSalary(100000, null)).toBe('$100,000+')
  })

  it('treats a max-only value as a floor', () => {
    expect(formatSalary(null, 150000)).toBe('$150,000+')
  })

  it('supports other currencies', () => {
    expect(formatSalary(1000, null, 'EUR')).toBe('€1,000+')
  })
})

describe('initials', () => {
  it('takes the first two name parts', () => {
    expect(initials('Ada Lovelace')).toBe('AL')
  })

  it('handles a single name', () => {
    expect(initials('Ada')).toBe('A')
  })

  it('ignores extra whitespace', () => {
    expect(initials('  Ada Lovelace  ')).toBe('AL')
  })

  it('handles an empty string', () => {
    expect(initials('')).toBe('')
  })
})

describe('isOverdue', () => {
  it('is false without a date', () => {
    expect(isOverdue(null)).toBe(false)
    expect(isOverdue('')).toBe(false)
    expect(isOverdue('nonsense')).toBe(false)
  })

  it('is true for past dates', () => {
    expect(isOverdue('2020-01-01')).toBe(true)
  })

  it('is false for today', () => {
    expect(isOverdue(localISO(0))).toBe(false)
  })

  it('is false for future dates', () => {
    expect(isOverdue(localISO(1))).toBe(false)
  })
})
