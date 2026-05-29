import { BrowserRouter } from 'react-router-dom'
import { AuthGate } from '@/components/auth/AuthGate'
import { AppRouter } from '@/routes/AppRouter'
import { StorageBootstrap } from '@/providers/StorageBootstrap'

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <StorageBootstrap>
          <AppRouter />
        </StorageBootstrap>
      </AuthGate>
    </BrowserRouter>
  )
}
