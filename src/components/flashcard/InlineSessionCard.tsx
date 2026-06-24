import { useMemo, useState } from 'react'
import type { CardFieldKey, CardFieldLayout, GeneratedCardData } from '@/types/cards'
import { ALL_CARD_FIELD_KEYS } from '@/store/generatedSession/constants'
import { assignFieldToSide } from '@/utils/cardLayoutModel'
import { fieldLabel } from '@/utils/renderCardFace'
import { CardReviewActionBar } from '@/components/controls/CardReviewActionBar'
import { SortableFaceBlockList } from '@/components/flashcard/SortableFaceBlockList'

type InlineSessionCardProps = {
  displayData: GeneratedCardData
  frontLayout: CardFieldLayout[]
  backLayout: CardFieldLayout[]
  onLayoutsChange: (front: CardFieldLayout[], back: CardFieldLayout[]) => void
  onPatchCardData?: (patch: Partial<GeneratedCardData>) => void
  isRegenerating?: boolean
  previewMode?: boolean
}

export function InlineSessionCard({
  displayData,
  frontLayout,
  backLayout,
  onLayoutsChange,
  onPatchCardData,
  isRegenerating,
  previewMode,
}: InlineSessionCardProps) {
  const [addOpen, setAddOpen] = useState(false)

  const typesOnCard = useMemo(
    () => new Set([...frontLayout, ...backLayout].map((b) => b.fieldType)),
    [frontLayout, backLayout],
  )

  const addable = useMemo(
    () => ALL_CARD_FIELD_KEYS.filter((ft) => !typesOnCard.has(ft)),
    [typesOnCard],
  )

  const assignFromPalette = (ft: CardFieldKey) => {
    const side = ft === 'input' ? 'front' : 'back'
    const next = assignFieldToSide(frontLayout, backLayout, ft, side)
    onLayoutsChange(next.front, next.back)
    setAddOpen(false)
  }

  return (
    <div className="group/card relative mx-auto w-full max-w-3xl">
      {isRegenerating ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-950/45 backdrop-blur-[2px]"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white/95 px-7 py-6 shadow-xl dark:bg-slate-900/95 dark:ring-1 dark:ring-white/10">
            <span className="h-9 w-9 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Regenerating…
            </span>
          </div>
        </div>
      ) : null}

      <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.2)] ring-1 ring-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900/75 dark:shadow-[0_16px_48px_-28px_rgba(0,0,0,0.45)] dark:ring-white/[0.03]">
        {!previewMode ? <CardReviewActionBar /> : null}
        <div
          className={`px-5 py-7 sm:px-8 sm:py-8 ${!previewMode ? 'pr-11 sm:pr-12' : ''}`}
        >
          {previewMode ? (
            <p className="mb-5 text-center text-[12px] leading-relaxed text-slate-500 dark:text-slate-500">
              Drag blocks to reorder or move between Front and Back. Generate a session to edit your
              own cards here.
            </p>
          ) : onPatchCardData ? (
            <p className="mb-4 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              Click a field to edit · drag handles reorder or move between sides
            </p>
          ) : null}

          <SortableFaceBlockList
            frontLayout={frontLayout}
            backLayout={backLayout}
            data={displayData}
            onLayoutsChange={onLayoutsChange}
            onPatchCardData={onPatchCardData}
          />
        </div>

        <div className="border-t border-dashed border-slate-200/60 px-4 py-2.5 sm:px-6 dark:border-slate-700/50">
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddOpen((o) => !o)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-normal text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              <span className="text-sm leading-none opacity-70" aria-hidden>
                +
              </span>
              Add field to layout
            </button>
            {addOpen ? (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20 cursor-default bg-transparent"
                  aria-label="Close add field menu"
                  onClick={() => setAddOpen(false)}
                />
                <div className="absolute right-0 bottom-full left-0 z-30 mb-1 overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:bg-slate-900 dark:ring-white/[0.04]">
                  {addable.length === 0 ? (
                    <p className="px-3 py-2.5 text-center text-[11px] text-slate-500">
                      All field types are on this card. Remove one to add another.
                    </p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto p-1.5">
                      <div className="flex flex-wrap gap-1">
                        {addable.map((ft) => (
                          <button
                            key={ft}
                            type="button"
                            className="rounded-md bg-slate-100/90 px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-700 transition hover:bg-slate-200/90 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            onClick={() => assignFromPalette(ft)}
                          >
                            {fieldLabel(ft)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
