import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { findInboxDeck } from '@/domain/inboxDeck'
import { useAuthStore } from '@/store/auth/authStore'
import { useLibraryStore } from '@/store/library/libraryStore'

type MobileNavDrawerProps = {
  open: boolean
  onClose: () => void
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex min-h-[48px] items-center px-5 text-[16px] font-medium transition-colors',
    isActive
      ? 'bg-accent-muted text-accent'
      : 'text-slate-800 active:bg-slate-100 dark:text-slate-100 dark:active:bg-slate-800/70',
  ].join(' ')

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const decks = useLibraryStore((s) => s.decks)

  const accountLabel = user?.name?.trim() || user?.email || 'Profile'
  const accountEmail = user?.email?.trim()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  const openInbox = () => {
    const inbox = findInboxDeck(decks)
    onClose()
    if (inbox) navigate(`/decks/${inbox.id}`)
    else navigate('/decks')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[130] sm:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <nav
        id="mobile-nav-drawer"
        aria-label="Main menu"
        className="absolute inset-y-0 left-0 flex w-[min(18.5rem,86vw)] flex-col bg-white shadow-2xl ring-1 ring-black/5 dark:bg-surface-900 dark:ring-white/10"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Menu</p>
          <p className="mt-1 text-[18px] font-bold text-slate-900 dark:text-white">Memiz</p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <NavLink to="/decks" className={navLinkClass} onClick={onClose}>
            Decks
          </NavLink>
          <NavLink to="/review" className={navLinkClass} onClick={onClose}>
            Review
          </NavLink>
          <NavLink to="/add-cards" className={navLinkClass} onClick={onClose}>
            Make Card
          </NavLink>
          <NavLink to="/search" className={navLinkClass} onClick={onClose}>
            Search
          </NavLink>
          <button
            type="button"
            className="flex min-h-[48px] w-full items-center px-5 text-left text-[16px] font-medium text-slate-800 transition-colors active:bg-slate-100 dark:text-slate-100 dark:active:bg-slate-800/70"
            onClick={openInbox}
          >
            Inbox
          </button>
        </div>

        <div
          className="border-t border-slate-100 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-slate-800"
        >
          <div className="px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Profile
            </p>
            <p className="mt-1 text-[15px] font-semibold text-slate-900 dark:text-white">
              {accountLabel}
            </p>
            {accountEmail && accountEmail !== accountLabel ? (
              <p className="mt-0.5 truncate text-[13px] text-slate-500 dark:text-slate-400">
                {accountEmail}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="flex min-h-[48px] w-full items-center px-5 text-left text-[16px] font-medium text-red-600 transition-colors active:bg-red-50 dark:text-red-400 dark:active:bg-red-950/35"
            onClick={() => {
              onClose()
              logout()
            }}
          >
            Logout
          </button>
        </div>
      </nav>
    </div>
  )
}
