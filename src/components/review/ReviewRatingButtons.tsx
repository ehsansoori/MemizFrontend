export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

type ReviewRatingButtonsProps = {
  onRate: (rating: ReviewRating) => void
  disabled?: boolean
}

const RATINGS: {
  id: ReviewRating
  label: string
  className: string
}[] = [
  {
    id: 'again',
    label: 'Again',
    className:
      'bg-red-500 text-white active:bg-red-600 dark:bg-red-600 dark:active:bg-red-700',
  },
  {
    id: 'hard',
    label: 'Hard',
    className:
      'bg-orange-500 text-white active:bg-orange-600 dark:bg-orange-600 dark:active:bg-orange-700',
  },
  {
    id: 'good',
    label: 'Good',
    className:
      'bg-emerald-500 text-white active:bg-emerald-600 dark:bg-emerald-600 dark:active:bg-emerald-700',
  },
  {
    id: 'easy',
    label: 'Easy',
    className:
      'bg-sky-500 text-white active:bg-sky-600 dark:bg-sky-600 dark:active:bg-sky-700',
  },
]

export function ReviewRatingButtons({ onRate, disabled }: ReviewRatingButtonsProps) {
  return (
    <div
      className="grid grid-cols-4 gap-2"
      role="group"
      aria-label="Rate your recall"
    >
      {RATINGS.map((rating) => (
        <button
          key={rating.id}
          type="button"
          disabled={disabled}
          onClick={() => onRate(rating.id)}
          className={[
            'flex min-h-[52px] flex-col items-center justify-center rounded-2xl text-[13px] font-bold transition active:scale-[0.97] disabled:opacity-40',
            rating.className,
          ].join(' ')}
        >
          {rating.label}
        </button>
      ))}
    </div>
  )
}
