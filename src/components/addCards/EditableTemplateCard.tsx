import { useMemo } from 'react'
import { ImageControls } from '@/components/addCards/ImageControls'
import type { CardDraft } from '@/domain/cardDraft'
import { getTemplateCardBlocks, type TemplateCardBlock } from '@/domain/templateCardBlocks'
import type { ExampleSentenceDto } from '@/types/cards'
import type { CardTemplate } from '@/types/deckProfile'

export type WordAiGenerateProps = {
  onGenerate: () => void
  busy?: boolean
  disabled?: boolean
}

type EditableTemplateCardProps = {
  template: CardTemplate
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
  wordAiGenerate?: WordAiGenerateProps
}

const ghostInput =
  'w-full min-w-0 border-0 border-b border-slate-200/90 bg-transparent px-0 py-1.5 text-base leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500'

const ghostTextarea =
  'min-h-[2.75rem] w-full min-w-0 resize-y border-0 border-b border-slate-200/90 bg-transparent px-0 py-1.5 text-base leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-accent dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500'

const blockLabelClass =
  'text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500'

function AiGenerateButton({ onGenerate, busy, disabled }: WordAiGenerateProps) {
  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={disabled || busy}
      className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-accent-muted px-3 py-1.5 text-[12px] font-semibold text-accent transition active:scale-[0.98] disabled:opacity-40"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M13 2 4.5 12.5H11l-1 9.5L19.5 11H13V2z" />
      </svg>
      {busy ? 'Generating…' : 'Generate with AI'}
    </button>
  )
}

function patchData(draft: CardDraft, patch: Partial<CardDraft['data']>): CardDraft {
  return { ...draft, data: { ...draft.data, ...patch } }
}

function patchExample(
  draft: CardDraft,
  index: number,
  patch: Partial<ExampleSentenceDto>,
): CardDraft {
  const examples = [...draft.data.examples]
  while (examples.length <= index) examples.push({ text: '' })
  examples[index] = { ...examples[index], ...patch }
  return patchData(draft, { examples })
}

function patchDefinition(
  draft: CardDraft,
  index: number,
  patch: Partial<ExampleSentenceDto>,
): CardDraft {
  const definitions = [...draft.definitions]
  while (definitions.length <= index) definitions.push({ text: '' })
  definitions[index] = { ...definitions[index], ...patch }
  return { ...draft, definitions }
}

function SlotListBlock({
  label,
  count,
  includeTranslation,
  items,
  onPatch,
  disabled,
  itemLabel,
}: {
  label: string
  count: number
  includeTranslation: boolean
  items: ExampleSentenceDto[]
  onPatch: (index: number, patch: Partial<ExampleSentenceDto>) => void
  disabled?: boolean
  itemLabel: string
}) {
  return (
    <div className="space-y-2">
      <p className={blockLabelClass}>{label}</p>
      <div className="space-y-3">
        {Array.from({ length: count }, (_, i) => {
          const item = items[i] ?? { text: '' }
          const showItemLabel = count > 1
          return (
            <div
              key={i}
              className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/40"
            >
              {showItemLabel ? (
                <p className="mb-1.5 text-[11px] font-medium text-slate-400">
                  {itemLabel} {i + 1}
                </p>
              ) : null}
              <input
                type="text"
                value={item.text}
                onChange={(e) => onPatch(i, { text: e.target.value })}
                disabled={disabled}
                placeholder={showItemLabel ? `${itemLabel} ${i + 1}` : itemLabel}
                className={ghostInput}
              />
              {includeTranslation ? (
                <input
                  type="text"
                  value={item.translation ?? ''}
                  onChange={(e) => onPatch(i, { translation: e.target.value })}
                  disabled={disabled}
                  placeholder="Translation"
                  className={`${ghostInput} mt-2 text-sm italic`}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CardBlock({
  block,
  draft,
  onChange,
  disabled,
  wordAiGenerate,
}: {
  block: TemplateCardBlock
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
  wordAiGenerate?: WordAiGenerateProps
}) {
  if (block.type === 'examples') {
    return (
      <SlotListBlock
        label={block.label}
        count={block.count}
        includeTranslation={block.includeTranslation}
        items={draft.data.examples}
        onPatch={(index, patch) => onChange(patchExample(draft, index, patch))}
        disabled={disabled}
        itemLabel="Example"
      />
    )
  }

  if (block.type === 'definitions') {
    return (
      <SlotListBlock
        label={block.label}
        count={block.count}
        includeTranslation={block.includeTranslation}
        items={draft.definitions}
        onPatch={(index, patch) => onChange(patchDefinition(draft, index, patch))}
        disabled={disabled}
        itemLabel="Definition"
      />
    )
  }

  if (block.type === 'audio') {
    return null
  }

  if (block.type === 'image') {
    return (
      <div className="space-y-2">
        <p className={blockLabelClass}>{block.label}</p>
        <ImageControls onPreviewChange={() => {}} />
      </div>
    )
  }

  if (block.type === 'custom') {
    const slots = draft.customSlots[block.id] ?? Array.from({ length: block.count }, () => '')
    const setSlot = (index: number, value: string) => {
      const next = [...slots]
      while (next.length <= index) next.push('')
      next[index] = value
      onChange({ ...draft, customSlots: { ...draft.customSlots, [block.id]: next } })
    }

    if (block.input === 'audio' || block.input === 'video') {
      return null
    }

    if (block.input === 'image') {
      return (
        <div className="space-y-2">
          <p className={blockLabelClass}>{block.label}</p>
          <ImageControls onPreviewChange={() => {}} />
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <p className={blockLabelClass}>{block.label}</p>
        {Array.from({ length: block.count }, (_, i) => (
          <div key={i}>
            {block.count > 1 ? (
              <p className="mb-1 text-[11px] font-medium text-slate-400">
                {block.label} {i + 1}
              </p>
            ) : null}
            {block.input === 'multiline' ? (
              <textarea
                value={slots[i] ?? ''}
                onChange={(e) => setSlot(i, e.target.value)}
                disabled={disabled}
                rows={2}
                className={ghostTextarea}
                placeholder={block.label}
              />
            ) : (
              <input
                type="text"
                value={slots[i] ?? ''}
                onChange={(e) => setSlot(i, e.target.value)}
                disabled={disabled}
                className={ghostInput}
                placeholder={block.label}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const value = draft.data[block.patchKey] ?? ''
  const setValue = (v: string) => {
    const trimmed = v
    if (block.patchKey === 'word') onChange(patchData(draft, { word: trimmed }))
    else if (block.patchKey === 'phonetic') onChange(patchData(draft, { phonetic: trimmed }))
    else if (block.patchKey === 'partOfSpeech')
      onChange(patchData(draft, { partOfSpeech: trimmed }))
    else if (block.patchKey === 'targetMeaning')
      onChange(patchData(draft, { targetMeaning: trimmed }))
    else if (block.patchKey === 'englishMeaning')
      onChange(patchData(draft, { englishMeaning: trimmed }))
    else onChange(patchData(draft, { notes: trimmed }))
  }

  const showAi = block.patchKey === 'word' && wordAiGenerate

  return (
    <div className="space-y-1.5">
      <p className={blockLabelClass}>{block.label}</p>
      {block.input === 'multiline' ? (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder={block.label}
          className={ghostTextarea}
        />
      ) : (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder={block.label}
          className={[
            ghostInput,
            block.prominent
              ? 'font-display border-0 text-[clamp(1.35rem,5vw,1.85rem)] font-bold tracking-tight'
              : '',
            block.input === 'tag' ? 'text-sm font-semibold' : '',
          ].join(' ')}
        />
      )}
      {showAi ? <AiGenerateButton {...wordAiGenerate} /> : null}
    </div>
  )
}

function CardFace({
  label,
  blocks,
  draft,
  onChange,
  disabled,
  wordAiGenerate,
  muted,
}: {
  label: string
  blocks: TemplateCardBlock[]
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
  wordAiGenerate?: WordAiGenerateProps
  muted?: boolean
}) {
  if (blocks.length === 0) return null

  const visibleBlocks = blocks.filter(
    (b) =>
      b.type !== 'audio' &&
      !(b.type === 'custom' && (b.input === 'audio' || b.input === 'video')),
  )
  if (visibleBlocks.length === 0) return null

  return (
    <section
      className={[
        'rounded-3xl border border-slate-200/90 bg-white shadow-card dark:border-slate-700/80 dark:bg-surface-900 dark:shadow-card-dark',
        muted ? 'opacity-[0.98]' : '',
      ].join(' ')}
    >
      <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          {label}
        </p>
      </div>
      <div className="space-y-5 px-5 py-6">
        {visibleBlocks.map((block) => (
          <CardBlock
            key={block.id}
            block={block}
            draft={draft}
            onChange={onChange}
            disabled={disabled}
            wordAiGenerate={wordAiGenerate}
          />
        ))}
      </div>
    </section>
  )
}

export function EditableTemplateCard({
  template,
  draft,
  onChange,
  disabled,
  wordAiGenerate,
}: EditableTemplateCardProps) {
  const { front, back } = useMemo(() => getTemplateCardBlocks(template), [template])

  if (front.length === 0 && back.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-10 text-center text-[14px] text-slate-500 dark:border-slate-600">
        This template has no fields to edit.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <CardFace
        label="Front"
        blocks={front}
        draft={draft}
        onChange={onChange}
        disabled={disabled}
        wordAiGenerate={wordAiGenerate}
      />
      <CardFace
        label="Back"
        blocks={back}
        draft={draft}
        onChange={onChange}
        disabled={disabled}
        muted
      />
    </div>
  )
}
