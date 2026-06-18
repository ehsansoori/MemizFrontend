import type { ReactNode } from 'react'
import { useCallback, useRef } from 'react'
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
  const touchStartRef = useRef<TouchStart | null>(null)

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (direction === 'prev' && canGoPrev) onPrev()
      if (direction === 'next' && canGoNext) onNext()
    },
    [canGoPrev, canGoNext, onNext, onPrev],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!touchNavEnabled || disabled) return
      const touch = e.touches[0]
      if (!touch) return
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, moved: false }
    },
    [disabled, touchNavEnabled],
  )

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const start = touchStartRef.current
    if (!start) return
    const touch = e.touches[0]
    if (!touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (Math.hypot(dx, dy) > TAP_MOVE_TOLERANCE_PX) {
      start.moved = true
    }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchNavEnabled || disabled) return
      const start = touchStartRef.current
      touchStartRef.current = null
      if (!start || isInteractiveTarget(e.target)) return

      const touch = e.changedTouches[0]
      if (!touch) return

      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      if (absDx > SWIPE_THRESHOLD_PX && absDx > absDy) {
        navigate(dx < 0 ? 'next' : 'prev')
        return
      }

      if (start.moved || Math.hypot(dx, dy) > TAP_MOVE_TOLERANCE_PX) return

      const container = containerRef.current
      if (!container) return
      const { left, width } = container.getBoundingClientRect()
      const relX = (touch.clientX - left) / width

      if (relX < SIDE_TAP_RATIO) {
        navigate('prev')
      } else if (relX > 1 - SIDE_TAP_RATIO) {
        navigate('next')
      }
    },
    [disabled, navigate, touchNavEnabled],
  )

  const handleTouchCancel = useCallback(() => {
    touchStartRef.current = null
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-0 flex-1 flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  )
}
