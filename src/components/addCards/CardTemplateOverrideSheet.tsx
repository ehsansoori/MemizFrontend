import { BottomSheet } from '@/components/decks/BottomSheet'
import { CardTemplateSelect } from '@/components/addCards/CardTemplateSelect'

import type { DeckTypeId } from '@/types/deckProfile'

type CardTemplateOverrideSheetProps = {
  open: boolean
  onClose: () => void
  busy?: boolean
  selectedTemplateId: string
  deckDefaultTemplateId: string
  deckTypeId?: DeckTypeId
  templatesRefreshKey: number
  onTemplateChange: (templateId: string) => void
  onCreateTemplate: () => void
  onEditTemplate: (templateId: string) => void
}

const sectionTitleClass =
  'text-[12px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'

export function CardTemplateOverrideSheet({
  open,
  onClose,
  busy,
  selectedTemplateId,
  deckDefaultTemplateId,
  deckTypeId,
  templatesRefreshKey,
  onTemplateChange,
  onCreateTemplate,
  onEditTemplate,
}: CardTemplateOverrideSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title="Card template"
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Card Template</h2>
      }
    >
      <div className="space-y-4 px-5 pb-5">
        <section className="space-y-3">
          <p className={sectionTitleClass}>Template for this card</p>
          <CardTemplateSelect
            value={selectedTemplateId}
            onChange={onTemplateChange}
            disabled={busy}
            deckTypeId={deckTypeId}
            refreshKey={templatesRefreshKey}
            onCreateTemplate={onCreateTemplate}
            onEditTemplate={onEditTemplate}
            hint={
              selectedTemplateId === deckDefaultTemplateId
                ? 'Using deck default template.'
                : 'Overriding deck default for this card.'
            }
          />
        </section>

        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="h-12 w-full rounded-2xl bg-accent text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Done
        </button>
      </div>
    </BottomSheet>
  )
}
