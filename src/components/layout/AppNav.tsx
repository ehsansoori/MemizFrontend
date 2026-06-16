import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-[13px] text-accent hover:underline',
    isActive ? 'font-semibold underline' : 'font-normal',
  ].join(' ')

export function AppNav() {
  return (
    <nav className="flex items-center gap-4" aria-label="Main">
      <NavLink to="/decks" className={linkClass}>
        Decks
      </NavLink>
      <NavLink to="/review" className={linkClass}>
        Review
      </NavLink>
      <NavLink to="/add-cards" className={linkClass}>
        Make Card
      </NavLink>
    </nav>
  )
}
