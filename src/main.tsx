import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryProvider } from '@/providers/QueryProvider'
import { GoogleAuthRoot } from '@/providers/GoogleAuthRoot'
import { ToastProvider } from '@/providers/ToastProvider'
import { setupApiAuth } from '@/services/api/setupApiAuth'

setupApiAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ToastProvider>
        <GoogleAuthRoot>
          <App />
        </GoogleAuthRoot>
      </ToastProvider>
    </QueryProvider>
  </StrictMode>,
)
