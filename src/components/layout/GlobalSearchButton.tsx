import { Link, useLocation } from 'react-router-dom'

export function GlobalSearchButton() {
  const { pathname } = useLocation()
  const active = pathname === '/search'

  return (
    <Link
      to="/search"
      aria-label="Search all cards"
      aria-current={active ? 'page' : undefined}
      className={[
        'flex h-11 w-11 items-center justify-center rounded-full transition',
        active
          ? 'bg-accent-muted text-accent'
          : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
      ].join(' ')}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </Link>
  )
}
