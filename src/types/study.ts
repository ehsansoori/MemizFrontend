/** Card lifecycle for spaced repetition / future Leitner UI. */
export type CardReviewStatus =
  | 'new'
  | 'learning'
  | 'review'
  | 'mastered'
  | 'suspended'

/**
 * Per-card study state (Leitner box, due scheduling).
 * Stored on SavedCard and indexed for future queue queries.
 */
export interface StudyProgress {
  status: CardReviewStatus
  /** Leitner box / stage (1 = newest). */
  stage: number
  /** ISO timestamp — card is due when now >= dueAt. */
  dueAt: string
  lastReviewedAt?: string
}

export const STUDY_STAGE_MIN = 1
export const STUDY_STAGE_MAX = 5
