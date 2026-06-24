import { CardTemplateBlocksView } from '@/components/cardDisplay/CardTemplateBlocksView'
import { InlineEditableFlashcardField } from '@/components/cardDisplay/InlineEditableFlashcardField'
import { ExamplesPreviewEditor } from '@/components/cardDisplay/ExamplesPreviewEditor'
import {
  FlashcardPreviewPanel,
  FlashcardPreviewSection,
} from '@/components/cardDisplay/FlashcardPreviewPanel'
import { getFlashcardBackModel } from '@/domain/flashcardBackDisplay'
import type { CardDraft } from '@/domain/cardDraft'
import { getTemplateCardBlocks, type TemplateCardBlock } from '@/domain/templateCardBlocks'
import type { ExampleSentenceDto } from '@/types/cards'
import type { CardTemplate } from '@/types/deckProfile'

type FlashcardPreviewEditorProps = {
  template: CardTemplate
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
}

const frontWordClass =
  'font-display text-[clamp(2rem,7vw,2.75rem)] font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-white'

const translationClass =
  'font-display text-[clamp(1.35rem,4.5vw,1.85rem)] font-semibold leading-snug text-slate-800 dark:text-slate-100'

const pronunciationClass =
  'font-mono text-[14px] leading-relaxed text-slate-700 dark:text-slate-300'

const posClass = 'text-[15px] font-medium capitalize text-slate-800 dark:text-slate-100'

function patchData(draft: CardDraft, patch: Partial<CardDraft['data']>): CardDraft {
  return { ...draft, data: { ...draft.data, ...patch } }
}

function patchExamples(draft: CardDraft, examples: ExampleSentenceDto[]): CardDraft {
  return patchData(draft, { examples })
}

function sectionTitle(block: TemplateCardBlock): string {
  if (block.type === 'examples') return 'Examples'
  if (block.type === 'pronunciations') return 'Pronunciation'
  if (block.type === 'simple') {
    if (block.patchKey === 'translation') return 'Translation'
    if (block.patchKey === 'partOfSpeech') return 'Part of Speech'
    if (block.patchKey === 'input') return 'Word'
  }
  return block.label
}

function PreviewTemplateBlock({
  block,
  draft,
  onChange,
  disabled,
  model,
}: {
  block: TemplateCardBlock
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
  model: ReturnType<typeof getFlashcardBackModel>
}) {
  const title = sectionTitle(block)

  if (block.type === 'examples') {
    return (
      <ExamplesPreviewEditor
        examples={draft.data.examples}
        count={block.count}
        includeTranslation={block.includeTranslation}
        disabled={disabled}
        onCommit={(examples) => onChange(patchExamples(draft, examples))}
      />
    )
  }

  if (block.type === 'pronunciations') {
    const pronunciations = model.pronunciations.filter((p) => p.phonetic.trim())
    if (pronunciations.length === 0) return null

    return (
      <FlashcardPreviewSection title={title}>
        <div className="space-y-3">
          {pronunciations.map((p, index) => (
            <div key={`${p.accent}-${p.phonetic}-${index}`} className="space-y-0.5">
              {p.accent.trim() ? (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {p.accent.trim().toUpperCase()}
                </p>
              ) : null}
              <InlineEditableFlashcardField
                variant="preview"
                value={p.phonetic.trim()}
                onCommit={(phonetic) => {
                  const current = [...(draft.data.pronunciations ?? [])]
                  current[index] = {
                    ...current[index],
                    accent: current[index]?.accent ?? p.accent,
                    phonetic: phonetic.trim(),
                  }
                  onChange(patchData(draft, { pronunciations: current }))
                }}
                disabled={disabled}
                displayClassName={pronunciationClass}
                ariaLabel={`${p.accent || 'Pronunciation'} phonetic`}
              />
            </div>
          ))}
        </div>
      </FlashcardPreviewSection>
    )
  }

  if (block.type !== 'simple') return null

  if (block.patchKey === 'input') {
    const field = (
      <InlineEditableFlashcardField
        variant="preview"
        value={draft.data.input}
        onCommit={(input) => onChange({ ...draft, data: { ...draft.data, input } })}
        disabled={disabled}
        displayClassName={frontWordClass}
        editClassName={frontWordClass}
        ariaLabel="Word or phrase"
      />
    )

    if (block.prominent) return field

    return <FlashcardPreviewSection title={title}>{field}</FlashcardPreviewSection>
  }

  if (block.patchKey === 'translation' && model.translation) {
    return (
      <FlashcardPreviewSection title={title}>
        <InlineEditableFlashcardField
          variant="preview"
          value={draft.data.translation ?? ''}
          onCommit={(translation) => onChange(patchData(draft, { translation }))}
          disabled={disabled}
          multiline
          displayClassName={translationClass}
          editClassName={translationClass}
          ariaLabel="Translation"
        />
      </FlashcardPreviewSection>
    )
  }

  if (block.patchKey === 'partOfSpeech' && model.partOfSpeech.length > 0) {
    return (
      <FlashcardPreviewSection title={title}>
        <InlineEditableFlashcardField
          variant="preview"
          value={model.partOfSpeech.join(', ')}
          onCommit={(text) => {
            const next = text.split(/\s*[,·]\s*/).filter(Boolean)
            onChange(patchData(draft, { partOfSpeech: next.length > 0 ? next : undefined }))
          }}
          disabled={disabled}
          displayClassName={posClass}
          ariaLabel="Part of speech"
        />
      </FlashcardPreviewSection>
    )
  }

  return null
}

function PreviewBlock({
  block,
  draft,
  onChange,
  disabled,
  model,
}: {
  block: TemplateCardBlock
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
  model: ReturnType<typeof getFlashcardBackModel>
}) {
  const editable = (
    <PreviewTemplateBlock
      block={block}
      draft={draft}
      onChange={onChange}
      disabled={disabled}
      model={model}
    />
  )

  if (block.type === 'simple' && block.patchKey === 'input') {
    return editable
  }

  if (block.type === 'examples') {
    return editable
  }

  if (
    block.type === 'pronunciations' &&
    model.pronunciations.some((p) => p.phonetic.trim())
  ) {
    return editable
  }

  if (block.type === 'simple' && block.patchKey === 'translation' && model.translation) {
    return editable
  }

  if (block.type === 'simple' && block.patchKey === 'partOfSpeech' && model.partOfSpeech.length > 0) {
    return editable
  }

  return <CardTemplateBlocksView blocks={[block]} data={draft.data} variant="preview" />
}

function PreviewFacePanel({
  title,
  blocks,
  draft,
  onChange,
  disabled,
  model,
}: {
  title: string
  blocks: TemplateCardBlock[]
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
  model: ReturnType<typeof getFlashcardBackModel>
}) {
  if (blocks.length === 0) {
    return (
      <FlashcardPreviewPanel title={title}>
        <p className="text-[14px] text-slate-400 dark:text-slate-500">No fields on this side.</p>
      </FlashcardPreviewPanel>
    )
  }

  return (
    <FlashcardPreviewPanel title={title}>
      <div className="space-y-4">
        {blocks.map((block) => (
          <PreviewBlock
            key={block.id}
            block={block}
            draft={draft}
            onChange={onChange}
            disabled={disabled}
            model={model}
          />
        ))}
      </div>
    </FlashcardPreviewPanel>
  )
}

export function FlashcardPreviewEditor({
  template,
  draft,
  onChange,
  disabled,
}: FlashcardPreviewEditorProps) {
  const { front, back } = getTemplateCardBlocks(template)
  const model = getFlashcardBackModel(draft.data)

  return (
    <div className="space-y-3">
      <PreviewFacePanel
        title="Front Preview"
        blocks={front}
        draft={draft}
        onChange={onChange}
        disabled={disabled}
        model={model}
      />
      <PreviewFacePanel
        title="Back Preview"
        blocks={back}
        draft={draft}
        onChange={onChange}
        disabled={disabled}
        model={model}
      />
    </div>
  )
}
