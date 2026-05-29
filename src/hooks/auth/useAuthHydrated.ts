import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth/authStore'

/** True after Zustand has rehydrated auth from localStorage. */
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated())

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    void useAuthStore.persist.rehydrate()
    return unsub
  }, [])

  return hydrated
}
