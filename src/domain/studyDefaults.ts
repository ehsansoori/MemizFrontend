import type { StudyProgress } from '@/types/study'

function nowIso(): string {
  return new Date().toISOString()
}

/** Initial study row for a card newly saved to a deck. */
export function createDefaultStudyProgress(): StudyProgress {
  const t = nowIso()
  return {
    status: 'new',
    stage: 1,
    dueAt: t,
    lastReviewedAt: undefined,
  }
}
