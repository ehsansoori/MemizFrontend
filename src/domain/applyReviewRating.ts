import type { ReviewRating } from '@/components/review/ReviewRatingButtons'
import type { StudyProgress } from '@/types/study'
import { STUDY_STAGE_MAX, STUDY_STAGE_MIN } from '@/types/study'

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

/** Apply a quiz rating and return updated study progress. */
export function applyReviewRating(
  study: StudyProgress,
  rating: ReviewRating,
  now = new Date().toISOString(),
): StudyProgress {
  const stage =
    study.status === 'new' ? STUDY_STAGE_MIN : Math.max(STUDY_STAGE_MIN, study.stage)

  switch (rating) {
    case 'again':
      return {
        status: 'learning',
        stage: STUDY_STAGE_MIN,
        dueAt: addDays(now, 0),
        lastReviewedAt: now,
      }
    case 'hard':
      return {
        status: stage >= STUDY_STAGE_MAX ? 'mastered' : 'learning',
        stage,
        dueAt: addDays(now, 1),
        lastReviewedAt: now,
      }
    case 'good': {
      const nextStage = Math.min(STUDY_STAGE_MAX, stage + 1)
      return {
        status: nextStage >= STUDY_STAGE_MAX ? 'mastered' : 'review',
        stage: nextStage,
        dueAt: addDays(now, nextStage * 2),
        lastReviewedAt: now,
      }
    }
    case 'easy': {
      const nextStage = Math.min(STUDY_STAGE_MAX, stage + 2)
      return {
        status: nextStage >= STUDY_STAGE_MAX ? 'mastered' : 'review',
        stage: nextStage,
        dueAt: addDays(now, nextStage * 4),
        lastReviewedAt: now,
      }
    }
  }
}
