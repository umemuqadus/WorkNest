import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDebounce } from '@/hooks/useDebounce'
import { searchApi } from '@/services/search'
import type { SearchResults } from '@/types'

const EMPTY: SearchResults = { jobs: [], companies: [], contacts: [], applications: [] }

const GROUPS: Array<{ key: keyof SearchResults; label: string }> = [
  { key: 'jobs', label: 'Jobs' },
  { key: 'applications', label: 'Applications' },
  { key: 'companies', label: 'Companies' },
  { key: 'contacts', label: 'Contacts' },
]

const MOD_KEY =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || '')
    ? '⌘'
    : 'Ctrl'

export default function GlobalSearch() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const debounced = useDebounce(q, 300)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { data = EMPTY } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchApi.search(debounced, 4),
    enabled: debounced.trim().length >= 2,
    staleTime: 15_000,
  })

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Ctrl/Cmd+K (or "/") jumps to search; Escape clears and closes.
  useEffect(() => {
    function isVisible() {
      // header + mobile stack two instances — only the visible one responds
      return boxRef.current !== null && boxRef.current.offsetParent !== null
    }
    function focusSearch() {
      if (!isVisible()) return
      inputRef.current?.focus()
      inputRef.current?.select()
      setOpen(true)
    }
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null
      const typing =
        !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        focusSearch()
      } else if (e.key === '/' && !typing) {
        e.preventDefault()
        focusSearch()
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        e.preventDefault()
        setQ('')
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const hasResults = GROUPS.some((g) => data[g.key].length > 0)

  return (
    <div className="relative w-full max-w-md" ref={boxRef}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search jobs, companies, contacts..."
        aria-label="Global search"
        className={`w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-700/15 ${
          q ? 'pr-3' : 'pr-3 sm:pr-16'
        }`}
      />
      {!q && (
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold tracking-wide text-slate-400 shadow-sm sm:block"
        >
          {MOD_KEY} K
        </kbd>
      )}
      {open && debounced.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5">
          {!hasResults && (
            <p className="px-3 py-4 text-center text-sm text-slate-500">
              No matches for “{debounced}”.
            </p>
          )}
          {GROUPS.map((group) => {
            const items = data[group.key]
            if (!items.length) return null
            return (
              <div key={group.key} className="mb-1">
                <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {group.label}
                </p>
                {items.map((hit) => (
                  <button
                    key={`${hit.type}-${hit.id}`}
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setQ('')
                      navigate(hit.url)
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-blue-50/70"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{hit.title}</p>
                      {hit.subtitle && (
                        <p className="truncate text-xs text-slate-500">{hit.subtitle}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )
          })}
          {hasResults && (
            <Link
              to={`/jobs?q=${encodeURIComponent(debounced)}`}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-center text-xs font-medium text-blue-900 hover:bg-blue-50"
            >
              View all results
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
