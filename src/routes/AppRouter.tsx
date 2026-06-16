import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AddPage } from '@/pages/AddPage'
import { DeckDetailsPage } from '@/pages/DeckDetailsPage'
import { DecksPage } from '@/pages/DecksPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { SearchPage } from '@/pages/SearchPage'
import { GeneratedSessionProvider } from '@/store/generatedSession/GeneratedSessionProvider'

export function AppRouter() {
  return (
    <Routes>
      <Route
        element={
          <GeneratedSessionProvider>
            <AppShell />
          </GeneratedSessionProvider>
        }
      >
        <Route index element={<Navigate to="/decks" replace />} />
        <Route path="decks" element={<DecksPage />} />
        <Route path="decks/:deckId" element={<DeckDetailsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="add-cards" element={<AddPage />} />
        <Route path="add" element={<Navigate to="/add-cards" replace />} />
        <Route path="study" element={<Navigate to="/review" replace />} />
        <Route path="*" element={<Navigate to="/decks" replace />} />
      </Route>
    </Routes>
  )
}
