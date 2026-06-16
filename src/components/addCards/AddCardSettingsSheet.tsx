import { BottomSheet } from '@/components/decks/BottomSheet'
import { CardTemplateSelect } from '@/components/addCards/CardTemplateSelect'
import { SelectField } from '@/components/ui/SelectField'
import { DIFFICULTY_OPTIONS, LANGUAGE_OPTIONS } from '@/constants/formOptions'
import type { LanguageDeckSettings } from '@/types/deckProfile'

type AddCardSettingsSheetProps = {
  open: boolean
  onClose: () => void
  busy?: boolean
  selectedTemplateId: string
  deckDefaultTemplateId: string
  templatesRefreshKey: number
  showAiSettings: boolean
  languageSettings: LanguageDeckSettings
  onTemplateChange: (templateId: string) => void
  onCreateTemplate: () => void
  onEditTemplate: (templateId: string) => void
  onLanguageSettingsChange: (settings: LanguageDeckSettings) => void
  onSave: () => void
}

const sectionTitleClass =
  'text-[12px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500'

export function AddCardSettingsSheet({
  open,
  onClose,
  busy,
  selectedTemplateId,
  deckDefaultTemplateId,
  templatesRefreshKey,
  showAiSettings,
  languageSettings,
  onTemplateChange,
  onCreateTemplate,
  onEditTemplate,
  onLanguageSettingsChange,
  onSave,
}: AddCardSettingsSheetProps) {
  const patch = <K extends keyof LanguageDeckSettings>(key: K, value: LanguageDeckSettings[K]) => {
    onLanguageSettingsChange({ ...languageSettings, [key]: value })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      busy={busy}
      title="Add card settings"
      heading={
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">Settings</h2>
      }
    >
      <div className="max-h-[80dvh] space-y-6 overflow-y-auto px-5 pb-5 scrollbar-minimal">
        <section className="space-y-3">
          <p className={sectionTitleClass}>Template</p>
          <CardTemplateSelect
            value={selectedTemplateId}
            onChange={onTemplateChange}
            disabled={busy}
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

        {showAiSettings ? (
          <section className="space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
            <div>
              <p className={sectionTitleClass}>AI Settings</p>
              <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                Language and level for AI fill. Saved to this deck.
              </p>
            </div>
            <SelectField
              id="ai-source-lang"
              label="Source Language"
              options={LANGUAGE_OPTIONS}
              value={languageSettings.sourceLanguage}
              onChange={(e) => patch('sourceLanguage', e.target.value)}
              disabled={busy}
            />
            <SelectField
              id="ai-target-lang"
              label="Target Language"
              options={LANGUAGE_OPTIONS.filter((o) => o.value !== 'auto')}
              value={languageSettings.targetLanguage}
              onChange={(e) => patch('targetLanguage', e.target.value)}
              disabled={busy}
            />
            <SelectField
              id="ai-level"
              label="Level"
              options={DIFFICULTY_OPTIONS}
              value={languageSettings.difficulty}
              onChange={(e) =>
                patch('difficulty', e.target.value as LanguageDeckSettings['difficulty'])
              }
              disabled={busy}
            />
          </section>
        ) : (
          <section className="border-t border-slate-100 pt-5 dark:border-slate-800">
            <p className={sectionTitleClass}>AI Settings</p>
            <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
              AI generation is available for Language Learning decks. Template selection above
              still applies to manual cards.
            </p>
          </section>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="h-12 w-full rounded-2xl bg-accent text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </BottomSheet>
  )
}
