import { useRef } from 'react'
import { useToast } from '@/providers/toastContext'

type ImageControlsProps = {
  previewUrl?: string
  onPreviewChange: (url: string | undefined, fileName?: string) => void
}

export function ImageControls({ previewUrl, onPreviewChange }: ImageControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const handleUpload = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error')
      return
    }
    const url = URL.createObjectURL(file)
    onPreviewChange(url, file.name)
  }

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <img src={previewUrl} alt="Upload preview" className="max-h-40 w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-[13px] text-slate-400 dark:border-slate-600 dark:bg-slate-800/40">
          No image yet
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-100 text-[13px] font-semibold text-slate-700 transition active:scale-95 dark:bg-slate-800 dark:text-slate-200"
        >
          Upload Image
        </button>
        <button
          type="button"
          onClick={() => showToast('AI image generation will be available soon.', 'default')}
          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-accent-muted text-[13px] font-semibold text-accent transition active:scale-95"
        >
          Generate with AI
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          handleUpload(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
