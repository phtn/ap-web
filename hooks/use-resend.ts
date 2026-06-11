'use client'

import type { ResendApiResponse, ResendRequest } from '@/app/api/resend/types'
import { resendApiResponseSchema } from '@/app/api/resend/types'
import { startTransition, useCallback, useMemo, useState } from 'react'

export type ResendSendInput = Omit<ResendRequest, 'action'> & { action?: 'send' }

interface UseResendState {
  isSending: boolean
  error: string | null
  lastResponse: ResendApiResponse | null
}

export function useResend(defaults?: Partial<ResendSendInput>) {
  const [state, setState] = useState<UseResendState>({
    isSending: false,
    error: null,
    lastResponse: null
  })

  const send = useCallback(
    async (input: ResendSendInput): Promise<ResendApiResponse> => {
      startTransition(() => {
        setState((prev) => ({
          ...prev,
          isSending: true,
          error: null
        }))
      })

      try {
        const payload: ResendSendInput = {
          ...(defaults ?? {}),
          ...input,
          action: 'send'
        }

        const response = await fetch('/api/resend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        const raw: unknown = await response.json()
        const parsed = resendApiResponseSchema.safeParse(raw)
        if (!parsed.success) {
          const fallback: ResendApiResponse = {
            ok: false,
            error: 'Unexpected server response'
          }
          startTransition(() => {
            setState({
              isSending: false,
              error: fallback.error ?? null,
              lastResponse: fallback
            })
          })
          return fallback
        }

        const normalized: ResendApiResponse = response.ok
          ? parsed.data
          : {
              ok: false,
              error: parsed.data.ok ? 'Request failed' : parsed.data.error
            }

        startTransition(() => {
          setState({
            isSending: false,
            error: normalized.ok ? null : normalized.error ?? 'Failed to send email',
            lastResponse: normalized
          })
        })

        return normalized
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send email'
        const fallback: ResendApiResponse = { ok: false, error: message }
        startTransition(() => {
          setState({ isSending: false, error: message, lastResponse: fallback })
        })
        return fallback
      }
    },
    [defaults]
  )

  const clearError = useCallback(() => {
    startTransition(() => {
      setState((prev) => ({ ...prev, error: null }))
    })
  }, [])

  return useMemo(
    () => ({
      ...state,
      send,
      clearError
    }),
    [state, send, clearError]
  )
}
