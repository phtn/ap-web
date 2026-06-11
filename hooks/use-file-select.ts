export function useFileSelect() {
  return {
    files: [] as File[],
    openFileDialog: () => undefined,
    clearFiles: () => undefined,
    accept: '*/*',
    loading: false,
    inputFileRef: { current: null as HTMLInputElement | null },
    selected: null as File | File[] | null,
    clearSelected: () => undefined,
    handleFileSelect: (_event?: unknown) => _event ?? undefined,
    handleFiles: (_files?: unknown) => _files ?? undefined
  } as const
}
