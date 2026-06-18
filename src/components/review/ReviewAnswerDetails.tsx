import { TemplateOrderedFields } from '@/components/cardDisplay/TemplateOrderedFields'
import { getTemplateDisplaySegments } from '@/domain/templateFieldDisplay'
import type { SavedCard } from '@/types/cards'

type ReviewAnswerDetailsProps = {
  card: SavedCard
  variant?: 'quiz' | 'preview'
}

export function ReviewAnswerDetails({ card, variant = 'quiz' }: ReviewAnswerDetailsProps) {
  const { back } = getTemplateDisplaySegments(card)
  return (
    <div className="w-full">
      <TemplateOrderedFields segments={back} variant={variant === 'preview' ? 'preview' : 'quiz'} />
    </div>
  )
}
