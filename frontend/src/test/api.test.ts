import { describe, expect, it, beforeEach } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import {
  TOKEN_KEY,
  getErrorMessage,
  getFieldErrors,
  getToken,
  removeToken,
  setToken,
} from '@/lib/api'

/** Build a real AxiosError so axios.isAxiosError() returns true. */
function axiosError(code: string, data?: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() } as never
  const request = {} as never
  const response = { status: 500, statusText: '', headers: {}, config, data } as never
  return new AxiosError('request failed', code, config, request, response)
}

describe('token storage', () => {
  beforeEach(() => removeToken())

  it('reads null when nothing is stored', () => {
    expect(getToken()).toBeNull()
  })

  it('round-trips a token', () => {
    setToken('abc123')
    expect(getToken()).toBe('abc123')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc123')
  })

  it('removes the token', () => {
    setToken('abc123')
    removeToken()
    expect(getToken()).toBeNull()
  })

  it('treats null as a removal', () => {
    setToken('abc123')
    setToken(null)
    expect(getToken()).toBeNull()
  })

  it('never stores an empty string', () => {
    setToken('abc123')
    setToken('')
    expect(getToken()).toBeNull()
  })
})

describe('getErrorMessage', () => {
  it('prefers the API detail message', () => {
    const err = axiosError('ERR_BAD_REQUEST', { detail: 'Invalid credentials' })
    expect(getErrorMessage(err)).toBe('Invalid credentials')
  })

  it('explains a network failure', () => {
    expect(getErrorMessage(axiosError('ERR_NETWORK'))).toBe(
      'Cannot reach the server. Is the backend running?',
    )
  })

  it('explains a timeout', () => {
    expect(getErrorMessage(axiosError('ECONNABORTED'))).toBe(
      'The request timed out. Please try again.',
    )
  })

  it('reads detail from a plain object response shape', () => {
    expect(getErrorMessage({ response: { data: { detail: 'Nope' } } })).toBe('Nope')
  })

  it('falls back to the Error message', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('falls back to a generic message', () => {
    expect(getErrorMessage({})).toBe('Something went wrong. Please try again.')
    expect(getErrorMessage(null)).toBe('Something went wrong. Please try again.')
  })
})

describe('getFieldErrors', () => {
  it('returns nothing for non-axios errors', () => {
    expect(getFieldErrors(new Error('x'))).toEqual({})
    expect(getFieldErrors({})).toEqual({})
    expect(getFieldErrors(null)).toEqual({})
  })

  it('maps a single field', () => {
    const err = axiosError('ERR_BAD_REQUEST', {
      field: 'email',
      detail: 'Enter a valid email address',
    })
    expect(getFieldErrors(err)).toEqual({ email: 'Enter a valid email address' })
  })

  it('maps the FastAPI validation errors array', () => {
    const err = axiosError('ERR_UNPROCESSABLE_ENTITY', {
      errors: ['body.email: invalid format', 'body.name: required'],
    })
    expect(getFieldErrors(err)).toEqual({
      email: 'invalid format',
      name: 'required',
    })
  })

  it('prefers the explicit field over the errors array', () => {
    const err = axiosError('ERR_UNPROCESSABLE_ENTITY', {
      field: 'email',
      detail: 'Taken',
      errors: ['body.email: already used'],
    })
    expect(getFieldErrors(err)).toEqual({ email: 'Taken' })
  })

  it('returns nothing when the payload has neither field info', () => {
    const err = axiosError('ERR_BAD_REQUEST', { detail: 'Generic' })
    expect(getFieldErrors(err)).toEqual({})
  })
})
