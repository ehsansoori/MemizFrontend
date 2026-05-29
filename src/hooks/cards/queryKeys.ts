export const cardQueryKeys = {
  all: ['cards'] as const,
  generate: () => [...cardQueryKeys.all, 'generate'] as const,
}
