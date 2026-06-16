import { BottomSheet } from '@/components/decks/BottomSheet'
import { MANUAL_FIELD_OPTIONS, type ManualFieldType } from '@/components/addCards/types'

type AddFieldTypeSheetProps = {
  open: boolean
  onClose: () => void
  onSelect: (type: ManualFieldType) => void
}

export function AddFieldTypeSheet({ open, onClose, onSelect }: AddFieldTypeSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Add field"
      heading={<h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Add Field</h2>}
    >
      <div className="pb-2" role="menu">
        {MANUAL_FIELD_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            role="menuitem"
            onClick={() => {
              onSelect(opt.type)
              onClose()
            }}
            className="flex min-h-[56px] w-full flex-col items-start px-5 py-3 text-left transition active:bg-slate-100 dark:active:bg-slate-800/70"
          >
            <span className="text-[15px] font-semibold text-slate-900 dark:text-white">
              {opt.label}
            </span>
            <span className="text-[13px] text-slate-500 dark:text-slate-400">
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
