import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useDebounce('hello', 300))
    expect(result.current).toBe('hello')
  })

  it('holds the old value until the delay elapses', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('b')
  })

  it('resets the timer when the value keeps changing', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => vi.advanceTimersByTime(200))

    rerender({ value: 'c' })
    act(() => vi.advanceTimersByTime(200))
    // only 200ms since the last change - still the original value
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('c')
  })

  it('uses the supplied delay', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 50), {
      initialProps: { value: 1 },
    })

    rerender({ value: 2 })
    act(() => vi.advanceTimersByTime(49))
    expect(result.current).toBe(1)

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(2)
  })

  it('keeps the value across non-string types', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 0 },
    })

    rerender({ value: 42 })
    expect(result.current).toBe(0)

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe(42)
  })
})
