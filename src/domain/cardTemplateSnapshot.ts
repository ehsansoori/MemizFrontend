import type { SavedCard } from '@/types/cards'
import type { CardTemplate } from '@/types/deckProfile'

/** Deep-clone a template for persistence on a saved card. */
export function cloneCardTemplate(template: CardTemplate): CardTemplate {
  return JSON.parse(JSON.stringify(template)) as CardTemplate
}

/** Bind the card to the template definition used at save/generation time. */
export function stampCardTemplateSnapshot(
  card: SavedCard,
  template: CardTemplate,
): SavedCard {
  return {
    ...card,
    templateId: template.id,
    templateSnapshot: cloneCardTemplate(template),
  }
}
