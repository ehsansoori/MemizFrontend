import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useMobileTouchNav } from '@/hooks/useMobileTouchNav'

const SWIPE_THRESHOLD_PX = 56
const TAP_MOVE_TOLERANCE_PX = 14
const SIDE_TAP_RATIO = 0.38

type TouchStart = {
  x: number
  y: number
  moved: boolean
}

type StudyCardNavigationShellProps = {
  children: ReactNode
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  disabled?: boolean
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest('button, a, input, textarea, select, label, [role="button"], [contenteditable="true"]'),
  )
}

export function StudyCardNavigationShell({
  children,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  disabled = false,
}: StudyCardNavigationShellProps) {
  const touchNavEnabled = useMobileTouchNav()
  const containerRef = useRef<HTMLDivElement>(null)
  const navigateRef = useRef<(direction: 'prev' | 'next') => void>(() => {})
  const canGoPrevRef = useRef(canGoPrev)
  const canGoNextRef = useRef(canGoNext)
  const disabledRef = useRef(disabled)
  const touchNavEnabledRef = useRef(touchNavEnabled)

  navigateRef.current = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && canGoPrev) onPrev()
    if (direction === 'next' && canGoNext) onNext()
  }
  canGoPrevRef.current = canGoPrev
  canGoNextRef.current = canGoNext
  disabledRef.current = disabled
  touchNavEnabledRef.current = touchNavEnabled

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    let start: TouchStart | null = null
    let fromScroll = false

    const navigate = (direction: 'prev' | 'next') => {
      navigateRef.current(direction)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!touchNavEnabledRef.current || disabledRef.current) return
      const touch = e.touches[0]
      if (!touch) return
      fromScroll =
        e.target instanceof Element && Boolean(e.target.closest('[data-study-scroll]'))
      start = { x: touch.clientX, y: touch.clientY, moved: false }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!start) return
      const touch = e.touches[0]
      if (!touch) return
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      if (Math.hypot(dx, dy) > TAP_MOVE_TOLERANCE_PX) {
        start.moved = true
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchNavEnabledRef.current || disabledRef.current) {
        start = null
        fromScroll = false
        return
      }

      const touchStart = start
      start = null
      if (!touchStart || isInteractiveTarget(e.target)) {
        fromScroll = false
        return
      }

      const touch = e.changedTouches[0]
      if (!touch) {
        fromScroll = false
        return
      }

      const dx = touch.clientX - touchStart.x
      const dy = touch.clientY - touchStart.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (absDx > SWIPE_THRESHOLD_PX && absDx > absDy) {
        navigate(dx < 0 ? 'next' : 'prev')
        fromScroll = false
        return
      }

      if (fromScroll && absDy > absDx) {
        fromScroll = false
        return
      }
      fromScroll = false

      if (touchStart.moved || Math.hypot(dx, dy) > TAP_MOVE_TOLERANCE_PX) return

      const { left, width } = root.getBoundingClientRect()
      const relX = (touch.clientX - left) / width

      if (relX < SIDE_TAP_RATIO) {
        navigate('prev')
      } else if (relX > 1 - SIDE_TAP_RATIO) {
        navigate('next')
      }
    }

    const onTouchCancel = () => {
      start = null
      fromScroll = false
    }

    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: true })
    root.addEventListener('touchend', onTouchEnd, { passive: true })
    root.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      root.removeEventListener('touchend', onTouchEnd)
      root.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [])

  return (
    <div ref={containerRef} className="flex h-full min-h-0 flex-col overflow-hidden">
      {children}
    </div>
  )
}
