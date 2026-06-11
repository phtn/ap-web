'use client'

export function useAuthCtx() {
  return { user: undefined as { uid: string; email?: string | null } | undefined }
}
