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
  fullWidth?: boolean
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

function AiGenerateButton({ onGenerate, busy, disabled, fullWidth = true }: WordAiGenerateProps) {
  return (
    <button
      type="button"
      onClick={onGenerate}
      disabled={disabled || busy}
      className={[
        'mt-2 flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent-muted px-4 py-2.5 text-[13px] font-semibold text-accent transition active:scale-[0.98] disabled:opacity-40',
        fullWidth ? 'w-full sm:w-auto' : 'w-auto',
      ].join(' ')}
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

function isWordBlock(block: TemplateCardBlock): boolean {
  if (block.type === 'simple' && block.patchKey === 'word') return true
  return block.type === 'custom' && block.label.trim().toLowerCase() === 'word'
}

function CardBlock({
  block,
  draft,
  onChange,
  disabled,
}: {
  block: TemplateCardBlock
  draft: CardDraft
  onChange: (draft: CardDraft) => void
  disabled?: boolean
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
              ? 'font-display border-0 text-2xl font-bold leading-tight tracking-tight sm:text-[1.85rem]'
              : '',
            block.input === 'tag' ? 'text-sm font-semibold' : '',
          ].join(' ')}
        />
      )}
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

  const isFront = label === 'Front'
  const wordBlock = isFront ? visibleBlocks.find(isWordBlock) : undefined
  const bodyBlocks = wordBlock
    ? visibleBlocks.filter((b) => b.id !== wordBlock.id)
    : visibleBlocks

  return (
    <section
      className={[
        'overflow-visible rounded-3xl border border-slate-200/90 bg-white shadow-card dark:border-slate-700/80 dark:bg-surface-900 dark:shadow-card-dark',
        isFront ? 'relative z-10' : 'relative z-0',
        muted ? 'opacity-[0.98]' : '',
      ].join(' ')}
    >
      <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800 sm:px-5 sm:py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          {label}
        </p>
      </div>
      <div className="space-y-4 overflow-visible px-4 py-4 sm:space-y-5 sm:px-5 sm:py-6">
        {wordBlock ? (
          <div className="shrink-0 space-y-2">
            <CardBlock
              block={wordBlock}
              draft={draft}
              onChange={onChange}
              disabled={disabled}
            />
            {wordAiGenerate ? <AiGenerateButton {...wordAiGenerate} /> : null}
          </div>
        ) : wordAiGenerate ? (
          <AiGenerateButton {...wordAiGenerate} />
        ) : null}
        {bodyBlocks.map((block) => (
          <CardBlock
            key={block.id}
            block={block}
            draft={draft}
            onChange={onChange}
            disabled={disabled}
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
