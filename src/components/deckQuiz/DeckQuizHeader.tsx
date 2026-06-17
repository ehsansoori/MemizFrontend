import { DeckModeHeader } from '@/components/deckStudy/DeckModeHeader'

type DeckQuizHeaderProps = {
  deckId: string
  deckName: string
  current: number
  total: number
}

export function DeckQuizHeader({ deckId, deckName, current, total }: DeckQuizHeaderProps) {
  return (
    <DeckModeHeader
      deckId={deckId}
      deckName={deckName}
      modeLabel="Quiz"
      current={current}
      total={total}
    />
  )
}
