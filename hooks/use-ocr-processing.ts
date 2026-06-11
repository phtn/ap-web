export function useOCRProcessing() {
  return {
    processWithOCR: async (_file?: unknown) => _file ?? undefined,
    extractText: async (_file?: unknown) => _file ?? undefined,
    isProcessing: false,
    loading: false,
    error: null as Error | null
  } as const
}
