import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AddPage } from '@/pages/AddPage'
import { DeckDetailsPage } from '@/pages/DeckDetailsPage'
import { EditCardPage } from '@/pages/EditCardPage'
import { DeckQuizPage } from '@/pages/DeckQuizPage'
import { DeckBrowsePage } from '@/pages/DeckBrowsePage'
import { DeckStudyPage } from '@/pages/DeckStudyPage'
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
        <Route path="decks/:deckId/browse" element={<DeckBrowsePage />} />
        <Route path="decks/:deckId/study" element={<DeckStudyPage />} />
        <Route path="decks/:deckId/cards/:cardId/edit" element={<EditCardPage />} />
        <Route path="decks/:deckId/quiz" element={<DeckQuizPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="add-cards" element={<AddPage />} />
        <Route path="add" element={<Navigate to="/add-cards" replace />} />
        <Route path="study" element={<Navigate to="/decks" replace />} />
        <Route path="*" element={<Navigate to="/decks" replace />} />
      </Route>
    </Routes>
  )
}
