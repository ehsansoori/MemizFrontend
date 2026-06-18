import { useEffect, useState } from 'react'

/** True on narrow viewports or touch-primary devices. */
export function useMobileTouchNav(): boolean {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(max-width: 767px)').matches ||
      window.matchMedia('(hover: none) and (pointer: coarse)').matches
    )
  })

  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 767px)')
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)')
    const update = () => setEnabled(narrow.matches || touch.matches)
    narrow.addEventListener('change', update)
    touch.addEventListener('change', update)
    return () => {
      narrow.removeEventListener('change', update)
      touch.removeEventListener('change', update)
    }
  }, [])

  return enabled
}
