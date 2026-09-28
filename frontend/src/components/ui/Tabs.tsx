import { useState, type ReactNode } from 'react'
import clsx from 'clsx'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export default function Tabs({ tabs, initial }: { tabs: TabItem[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id)
  const current = tabs.find((t) => t.id === active) ?? tabs[0]
  return (
    <div>
      <div
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1"
        role="tablist"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            className={clsx(
              'whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition',
              t.id === active
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-5">
        {current?.content}
      </div>
    </div>
  )
}
