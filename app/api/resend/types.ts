export type ResendRequest = {
  to: string | string[]
  subject: string
  html: string
}

export type ResendApiResponse = {
  ok: boolean
  error?: string
  id?: string
}

export const resendApiResponseSchema = {
  safeParse: (value: unknown) => {
    if (value && typeof value === 'object' && 'ok' in value) {
      return { success: true, data: value as ResendApiResponse }
    }
    return { success: false as const }
  },
}
