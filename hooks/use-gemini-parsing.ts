export function useGeminiParsing() {
  return {
    parseWithGemini: async (_text?: unknown) => _text ?? undefined,
    isParsing: false,
    loading: false,
    error: null as Error | null
  } as const
}
