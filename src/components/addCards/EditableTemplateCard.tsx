import { CardPreviewDivider } from '@/components/addCards/CardPreviewDivider'
import { CardWordInputBar } from '@/components/addCards/CardWordInputBar'
import { FlashcardPreviewEditor } from '@/components/cardDisplay/FlashcardPreviewEditor'
import type { CardDraft } from '@/domain/cardDraft'
import type { CardTemplate } from '@/types/deckProfile'

type EditableTemplateCardProps = {
  template: CardTemplate
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
  showPreview?: boolean
  aiGenerate?: {
    onClick: () => void
    busy?: boolean
    disabled?: boolean
  }
}

/** Hybrid card editor: fixed word input bar + optional preview section below. */
export function EditableTemplateCard({
  template,
  draft,
  onChange,
  disabled,
  showPreview = true,
  aiGenerate,
}: EditableTemplateCardProps) {
  return (
    <div className="space-y-3">
      <CardWordInputBar
        draft={draft}
        onChange={onChange}
        disabled={disabled}
        aiGenerate={aiGenerate}
      />
      {showPreview ? (
        <>
          <CardPreviewDivider />
          <FlashcardPreviewEditor
            template={template}
            draft={draft}
            onChange={onChange}
            disabled={disabled}
          />
        </>
      ) : null}
    </div>
  )
}
