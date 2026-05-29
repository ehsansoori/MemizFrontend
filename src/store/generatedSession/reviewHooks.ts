import { useCallback, useContext } from 'react'
import type { CardFieldLayout } from '@/types/cards'
import {
  ReviewContext,
  type ReviewContextValue,
} from '@/store/generatedSession/reviewContext'

export function useGeneratedSessionStore(): ReviewContextValue {
  const ctx = useContext(ReviewContext)
  if (!ctx) {
    throw new Error(
      'useGeneratedSessionStore must be used within GeneratedSessionProvider',
    )
  }
  return ctx
}

export function useLayoutDispatch() {
  const { dispatch, state } = useGeneratedSessionStore()
  const setLayouts = useCallback(
    (frontLayout: CardFieldLayout[], backLayout: CardFieldLayout[]) => {
      dispatch({ type: 'SET_LAYOUT', frontLayout, backLayout })
    },
    [dispatch],
  )
  return {
    setLayouts,
    frontLayout: state.frontLayout,
    backLayout: state.backLayout,
  }
}
