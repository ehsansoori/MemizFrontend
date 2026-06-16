import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type UseDraftLeaveGuardOptions = {
  enabled: boolean
  onSaveAll?: () => void | Promise<void>
}

type LeavePromptState = {
  open: boolean
  targetHref: string | null
}

/**
 * Warns when leaving /add-cards with unsaved draft cards.
 * Uses beforeunload for tab close and intercepts in-app link clicks.
 */
export function useDraftLeaveGuard({ enabled, onSaveAll }: UseDraftLeaveGuardOptions) {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState<LeavePromptState>({ open: false, targetHref: null })
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabled) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    const onDocumentClick = (e: MouseEvent) => {
      if (!enabledRef.current) return
      const target = e.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!anchor || anchor.getAttribute('target') === '_blank') return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href === '/add-cards') return
      if (href === window.location.pathname) return

      e.preventDefault()
      e.stopPropagation()
      setPrompt({ open: true, targetHref: href })
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onDocumentClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onDocumentClick, true)
    }
  }, [enabled])

  const dismissLeave = () => setPrompt({ open: false, targetHref: null })

  const confirmLeave = () => {
    const href = prompt.targetHref
    dismissLeave()
    if (href) navigate(href)
  }

  const saveAndLeave = async () => {
    if (onSaveAll) await onSaveAll()
    confirmLeave()
  }

  return {
    leavePromptOpen: prompt.open,
    dismissLeave,
    confirmLeave,
    saveAndLeave,
  }
}
