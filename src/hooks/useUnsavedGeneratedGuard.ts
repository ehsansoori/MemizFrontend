import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type UseUnsavedGeneratedGuardOptions = {
  enabled: boolean
}

type LeavePromptState = {
  open: boolean
  targetHref: string | null
}

/**
 * Warns when leaving Make Card with unsaved AI-generated preview content.
 */
export function useUnsavedGeneratedGuard({ enabled }: UseUnsavedGeneratedGuardOptions) {
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

  return {
    leavePromptOpen: prompt.open,
    dismissLeave,
    confirmLeave,
  }
}
