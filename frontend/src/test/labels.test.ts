import { describe, expect, it } from 'vitest'
import {
  APPLICATION_STATUS_CHOICES,
  EMPLOYMENT_CHOICES,
  INTERVIEW_RESULT_CHOICES,
  INTERVIEW_TYPE_CHOICES,
  JOB_SOURCES,
  JOB_STATUS_CHOICES,
  KANBAN_COLUMNS,
  PRIORITY_CHOICES,
  REMOTE_CHOICES,
  statusChoice,
} from '@/lib/labels'

describe('statusChoice', () => {
  it('resolves a known value from the job statuses', () => {
    expect(statusChoice('offer', JOB_STATUS_CHOICES).label).toBe('Offer')
    expect(statusChoice('saved', JOB_STATUS_CHOICES).label).toBe('Saved')
  })

  it('resolves a known value from the application statuses', () => {
    expect(statusChoice('screening', APPLICATION_STATUS_CHOICES).label).toBe('Screening')
  })

  it('returns Unknown for an unmapped value', () => {
    expect(statusChoice('nope', JOB_STATUS_CHOICES).label).toBe('Unknown')
  })

  it('returns Unknown for null and undefined', () => {
    expect(statusChoice(null, JOB_STATUS_CHOICES).label).toBe('Unknown')
    expect(statusChoice(undefined, JOB_STATUS_CHOICES).label).toBe('Unknown')
  })

  it('always provides badge and dot classes so renders never break', () => {
    for (const choice of [...JOB_STATUS_CHOICES, ...APPLICATION_STATUS_CHOICES]) {
      expect(choice.badge).toBeTruthy()
      expect(choice.dot).toBeTruthy()
      expect(choice.label).toBeTruthy()
    }
    expect(statusChoice('nope', JOB_STATUS_CHOICES).badge).toBeTruthy()
  })
})

describe('choice tables', () => {
  it('has unique, non-empty values in the job statuses', () => {
    const values = JOB_STATUS_CHOICES.map((c) => c.value)
    expect(new Set(values).size).toBe(values.length)
    expect(values.every((v) => v.length > 0)).toBe(true)
  })

  it('has unique values in the application statuses', () => {
    const values = APPLICATION_STATUS_CHOICES.map((c) => c.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('has unique values in the priorities', () => {
    const values = PRIORITY_CHOICES.map((c) => c.value)
    expect(new Set(values).size).toBe(values.length)
    expect(PRIORITY_CHOICES.map((c) => c.label)).toEqual(['Low', 'Medium', 'High'])
  })
})

describe('KANBAN_COLUMNS', () => {
  it('flows saved -> rejected in order', () => {
    expect(KANBAN_COLUMNS).toEqual([
      'saved',
      'applied',
      'screening',
      'interview',
      'offer',
      'rejected',
    ])
  })

  it('has no duplicate columns', () => {
    expect(new Set(KANBAN_COLUMNS).size).toBe(KANBAN_COLUMNS.length)
  })

  it('only uses statuses that exist in APPLICATION_STATUS_CHOICES', () => {
    const known = new Set(APPLICATION_STATUS_CHOICES.map((c) => c.value))
    for (const col of KANBAN_COLUMNS) expect(known.has(col)).toBe(true)
  })

  it('omits "withdrawn" (not a board stage)', () => {
    expect(KANBAN_COLUMNS).not.toContain('withdrawn')
  })
})

describe('option lists', () => {
  it('exposes the expected remote modes', () => {
    expect(REMOTE_CHOICES.map((c) => c.value)).toEqual(['remote', 'hybrid', 'onsite'])
  })

  it('exposes the expected employment types', () => {
    expect(EMPLOYMENT_CHOICES.map((c) => c.value)).toEqual([
      'full_time',
      'part_time',
      'contract',
      'internship',
      'freelance',
    ])
  })

  it('exposes the expected interview types', () => {
    expect(INTERVIEW_TYPE_CHOICES.map((c) => c.value)).toEqual([
      'phone',
      'video',
      'onsite',
      'technical',
      'behavioral',
    ])
  })

  it('exposes the expected interview results', () => {
    expect(INTERVIEW_RESULT_CHOICES.map((c) => c.value)).toEqual([
      'pending',
      'selected',
      'rejected',
      'cancelled',
    ])
  })

  it('lists job sources with no duplicates', () => {
    expect(new Set(JOB_SOURCES).size).toBe(JOB_SOURCES.length)
    expect(JOB_SOURCES).toContain('LinkedIn')
    expect(JOB_SOURCES).toContain('Referral')
  })
})
