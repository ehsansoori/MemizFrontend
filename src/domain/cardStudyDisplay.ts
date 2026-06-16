import type { CardReviewStatus } from '@/types/study'

export const CARD_STATUS_LABELS: Record<CardReviewStatus, string> = {
  new: 'New',
  learning: 'Learning',
  review: 'Review',
  mastered: 'Mastered',
  suspended: 'Suspended',
}

export const CARD_STATUS_STYLES: Record<CardReviewStatus, string> = {
  new: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  learning: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  review: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  mastered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  suspended: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}
