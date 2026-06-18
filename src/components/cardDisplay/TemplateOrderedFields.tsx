import type { TemplateDisplaySegment } from '@/domain/templateFieldDisplay'

type TemplateOrderedFieldsProps = {
  segments: TemplateDisplaySegment[]
  variant: 'study-header' | 'study-body' | 'quiz' | 'preview'
}

function SimpleField({
  segment,
  variant,
}: {
  segment: Extract<TemplateDisplaySegment, { kind: 'simple' }>
  variant: TemplateOrderedFieldsProps['variant']
}) {
  const { role, text } = segment

  if (variant === 'study-header') {
    if (role === 'word') {
      return (
        <p className="whitespace-pre-wrap font-display text-[clamp(2.25rem,8vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-white">
          {text}
        </p>
      )
    }
    if (role === 'phonetic') {
      return (
        <p className="mt-1.5 font-mono text-[clamp(0.95rem,3vw,1.2rem)] text-slate-400 dark:text-slate-500">
          {text}
        </p>
      )
    }
    if (role === 'pos') {
      return (
        <p className="mt-1.5 text-[13px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {text}
        </p>
      )
    }
    if (role === 'meaning') {
      return (
        <p className="mt-3 whitespace-pre-wrap text-[clamp(1.875rem,5.5vw,2.75rem)] font-semibold leading-snug text-slate-900 dark:text-white">
          {text}
        </p>
      )
    }
    if (role === 'notes') {
      return (
        <p className="mt-3 whitespace-pre-wrap text-[16px] leading-relaxed text-slate-600 dark:text-slate-300">
          {text}
        </p>
      )
    }
    return (
      <p className="mt-2 whitespace-pre-wrap text-[clamp(1rem,3vw,1.15rem)] leading-relaxed text-slate-700 dark:text-slate-200">
        {text}
      </p>
    )
  }

  if (variant === 'study-body') {
    if (role === 'meaning') {
      return (
        <p className="whitespace-pre-wrap text-[clamp(1.875rem,5.5vw,2.75rem)] font-semibold leading-snug text-slate-900 dark:text-white">
          {text}
        </p>
      )
    }
    if (role === 'phonetic') {
      return (
        <p className="font-mono text-[clamp(1rem,3vw,1.15rem)] text-slate-400 dark:text-slate-500">
          {text}
        </p>
      )
    }
    if (role === 'pos') {
      return (
        <p className="text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
      )
    }
    if (role === 'notes') {
      return (
        <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-slate-600 dark:text-slate-300">
          {text}
        </p>
      )
    }
    return (
      <p className="whitespace-pre-wrap text-[clamp(1.05rem,3vw,1.2rem)] leading-relaxed text-slate-700 dark:text-slate-200">
        {text}
      </p>
    )
  }

  if (variant === 'quiz') {
    if (role === 'meaning') {
      return (
        <p className="whitespace-pre-wrap text-[clamp(1.25rem,5vw,1.75rem)] font-medium leading-snug text-slate-800 dark:text-slate-100">
          {text}
        </p>
      )
    }
    if (role === 'phonetic') {
      return (
        <p className="font-mono text-[14px] text-slate-400 dark:text-slate-500">{text}</p>
      )
    }
    if (role === 'pos') {
      return <p className="text-[15px] text-slate-500 dark:text-slate-400">{text}</p>
    }
    return (
      <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-slate-700 dark:text-slate-200">
        {text}
      </p>
    )
  }

  return (
    <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-slate-800 dark:text-slate-100">
      {text}
    </p>
  )
}

function RepeatableField({
  segment,
  variant,
}: {
  segment: Extract<TemplateDisplaySegment, { kind: 'repeatable' }>
  variant: TemplateOrderedFieldsProps['variant']
}) {
  const sentenceClass =
    variant === 'study-body'
      ? 'text-[clamp(1.05rem,3vw,1.2rem)] leading-relaxed text-slate-700 dark:text-slate-200'
      : variant === 'quiz'
        ? 'text-[16px] leading-relaxed text-slate-700 dark:text-slate-200 md:text-[17px]'
        : 'text-[15px] leading-relaxed text-slate-700 dark:text-slate-200'

  const translationClass =
    variant === 'study-body'
      ? 'mt-1.5 text-[clamp(1rem,2.5vw,1.1rem)] leading-relaxed text-slate-400 dark:text-slate-500'
      : 'mt-1.5 text-[15px] leading-relaxed text-slate-400 dark:text-slate-500'

  return (
    <div className="space-y-5 sm:space-y-6">
      {segment.items.map((item, i) => (
        <div
          key={`${item.text}-${i}`}
          className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0 dark:border-slate-800"
        >
          <p className={sentenceClass}>{item.text}</p>
          {item.translation ? <p className={translationClass}>{item.translation}</p> : null}
        </div>
      ))}
    </div>
  )
}

export function TemplateOrderedFields({ segments, variant }: TemplateOrderedFieldsProps) {
  if (segments.length === 0) {
    if (variant === 'study-body' || variant === 'quiz') {
      return <p className="text-[17px] text-slate-400 dark:text-slate-500">No meaning yet</p>
    }
    return null
  }

  const gapClass =
    variant === 'study-header' ? 'space-y-0' : variant === 'study-body' ? 'space-y-5 sm:space-y-6' : 'space-y-4'

  return (
    <div className={gapClass}>
      {segments.map((segment) =>
        segment.kind === 'simple' ? (
          <SimpleField key={segment.id} segment={segment} variant={variant} />
        ) : (
          <RepeatableField key={segment.id} segment={segment} variant={variant} />
        ),
      )}
    </div>
  )
}
