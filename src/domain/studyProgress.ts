import { createDefaultStudyProgress } from '@/domain/studyDefaults'
import type { StudyProgress } from '@/types/study'

/** Backfill study fields for cards saved before Leitner prep. */
export function normalizeStudyProgress(
  study: StudyProgress | undefined,
  savedAt: string,
): StudyProgress {
  if (study?.status && study.dueAt) {
    return {
      ...study,
      reviewCount: study.reviewCount ?? 0,
    }
  }
  const base = createDefaultStudyProgress()
  return {
    ...base,
    dueAt: study?.dueAt ?? savedAt,
    stage: study?.stage ?? base.stage,
    status: study?.status ?? base.status,
    reviewCount: study?.reviewCount ?? 0,
  }
}
