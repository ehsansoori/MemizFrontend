export const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Detect automatically' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'fa', label: 'Farsi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'tr', label: 'Turkish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'sv', label: 'Swedish' },
  { value: 'no', label: 'Norwegian' },
  { value: 'da', label: 'Danish' },
] as const

export const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'academic', label: 'Academic' },
  { value: 'business', label: 'Business' },
  { value: 'friendly', label: 'Friendly' },
] as const

export const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const

export const EXAMPLE_COUNT_OPTIONS = [1, 2, 3, 4, 5] as const

/** Default generator language pair (English → Farsi). */
export const DEFAULT_SOURCE_LANGUAGE = 'en'
export const DEFAULT_TARGET_LANGUAGE = 'fa'

export const DEFAULT_GENERATOR_INPUT =
  'hello, thank you, study, dictionary, conversation'
