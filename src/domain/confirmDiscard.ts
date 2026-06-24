const DISCARD_MESSAGE = 'You have unsaved generated content. Discard changes?'

/** Returns true when the user confirms discarding unsaved generated content. */
export function confirmDiscardGenerated(): boolean {
  return window.confirm(DISCARD_MESSAGE)
}
