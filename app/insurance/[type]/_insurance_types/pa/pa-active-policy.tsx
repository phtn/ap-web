'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheets'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import type { InsurancePolicyFieldValue } from '@/convex/insurancePolicies/d'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useQuery } from 'convex/react'
import { randomUUID } from 'crypto'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { paInsFields } from './schema'

export type PAActivePolicyProps = {
  policy: Doc<'insurancePolicies'> | undefined | null
  isTransitioning?: boolean
}

const formatDateTime = (value: number | null | undefined) => {
  if (typeof value !== 'number') return '—'
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value))
  } catch {
    return new Date(value).toLocaleString()
  }
}

const formatFieldValue = (value: InsurancePolicyFieldValue | null | undefined): string => {
  if (value === null) return '—'
  if (typeof value === 'string') {
    const t = value.trim()
    return t.length > 0 ? t : '—'
  }
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return Array.isArray(value) ? value.map((v) => formatFieldValue(v)).join(', ') : '—'
}

type PdfRenderStatus = 'loading' | 'rendering' | 'ready' | 'error'

function InAppPdfViewer({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<PdfRenderStatus>('loading')
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const renderTasks: Array<{ cancel: VoidFunction }> = []
    const container = containerRef.current

    if (!container) return

    container.replaceChildren()
    setStatus('loading')
    setPageCount(0)

    const renderPdf = async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

        await new Promise((resolve) => requestAnimationFrame(resolve))
        if (cancelled) return

        const loadingTask = pdfjs.getDocument({ url })
        const pdf = await loadingTask.promise
        if (cancelled) return

        setPageCount(pdf.numPages)
        setStatus('rendering')

        const availableWidth = container.clientWidth > 0 ? container.clientWidth : Math.max(window.innerWidth - 32, 280)

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          if (cancelled) return

          const page = await pdf.getPage(pageNumber)
          const baseViewport = page.getViewport({ scale: 1 })
          const scale = Math.min(availableWidth / baseViewport.width, 1.6)
          const viewport = page.getViewport({ scale })
          const outputScale = window.devicePixelRatio || 1
          const pageShell = document.createElement('div')
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')

          if (!context) {
            throw new Error('Canvas rendering is not available.')
          }

          pageShell.className = 'mx-auto mb-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-foreground/10'
          canvas.width = Math.floor(viewport.width * outputScale)
          canvas.height = Math.floor(viewport.height * outputScale)
          canvas.style.width = `${Math.floor(viewport.width)}px`
          canvas.style.height = `${Math.floor(viewport.height)}px`
          canvas.style.display = 'block'
          canvas.setAttribute('aria-label', `${title} page ${pageNumber}`)

          pageShell.appendChild(canvas)
          container.appendChild(pageShell)

          const renderTask = page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0]
          })
          renderTasks.push(renderTask)
          await renderTask.promise
        }

        if (!cancelled) {
          setStatus('ready')
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[PA PDF Viewer] render error:', error)
          setStatus('error')
        }
      }
    }

    renderPdf()

    return () => {
      cancelled = true
      renderTasks.forEach((task) => {
        try {
          task.cancel()
        } catch {
          // PDF.js throws if a completed render task is cancelled.
        }
      })
      container.replaceChildren()
    }
  }, [title, url])

  return (
    <div className='relative h-full bg-zinc-100 dark:bg-zinc-950'>
      {status !== 'ready' ? (
        <div className='absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 border-b border-foreground/10 bg-background/90 px-4 py-2 text-xs text-foreground/60 backdrop-blur'>
          {status === 'error' ? (
            <>
              <Icon name='alert-triangle' className='size-4' />
              <span>Unable to render this PDF in-app.</span>
            </>
          ) : (
            <>
              <Icon name='spinners-ring' className='size-4' />
              <span>{status === 'loading' ? 'Loading document...' : `Rendering ${pageCount || ''} pages...`}</span>
            </>
          )}
        </div>
      ) : null}
      <div ref={containerRef} className='h-full overflow-y-auto px-3 py-12 sm:px-6' />
    </div>
  )
}

export function PAActivePolicy({ policy, isTransitioning }: PAActivePolicyProps) {
  const [pdfOpen, setPdfOpen] = useState(false)

  const status = policy?.status
  const planName = policy?.planName ?? 'Personal Accident Protection'
  const providerName = policy?.providerName ?? 'Mercantile Insurance'

  const effective = useMemo(() => formatDateTime(policy?.effectiveAt), [policy?.effectiveAt])

  const noteText = useMemo(() => {
    const n = policy?.notes
    if (typeof n !== 'string') return null
    const t = n.trim()
    return t.length > 0 ? t : null
  }, [policy?.notes])

  const labelByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const group of paInsFields) {
      for (const field of group.fields) {
        map.set(String(field.name), field.label ?? String(field.name))
      }
    }
    return map
  }, [])

  const orderedFieldRows = useMemo(() => {
    const fields = policy?.fields
    if (!fields) return []

    const rows: Array<{ key: string; label: string; value: string }> = []
    for (const group of paInsFields) {
      for (const field of group.fields) {
        const key = String(field.name)
        const raw = fields[key] as InsurancePolicyFieldValue | undefined | null
        if (typeof raw === 'undefined') continue
        rows.push({
          key,
          label: field.label ?? key,
          value: formatFieldValue(raw)
        })
      }
    }

    // Include any unknown fields at the end (if schema changes).
    const known = new Set(rows.map((r) => r.key))
    for (const [key, raw] of Object.entries(fields)) {
      if (known.has(key)) continue
      rows.push({
        key,
        label: labelByName.get(key) ?? key,
        value: formatFieldValue(raw as InsurancePolicyFieldValue | undefined | null)
      })
    }

    return rows
  }, [labelByName, policy?.fields])

  // Resolve the first attached PDF to a signed Convex storage URL
  const fileDocId = policy?.attachments?.[0] as Id<'files'> | undefined
  const pdfUrl = useQuery(
    api.files.get.getUrlByFileId,
    fileDocId ? { fileId: fileDocId, author: randomUUID() } : 'skip'
  )

  const hasPdf = Boolean(pdfUrl)
  const handleOpenPdf = useCallback(() => {
    if (!pdfUrl) return
    setPdfOpen(true)
  }, [pdfUrl])

  return (
    <section aria-busy={isTransitioning} className='border border-foreground/20 py-3 sm:py-4'>
      <div className='space-y-5 bg-background/60 p-4 sm:p-5'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='relative shrink-0 self-center text-center sm:self-auto sm:text-right dark:bg-white w-full p-4'>
            <Image
              src='https://res.cloudinary.com/dx0heqhhe/image/upload/q_auto/f_auto/v1775636247/mercantile-logo_dpj4kh.svg'
              alt='Mercantile Insurance logo'
              width={2840}
              height={614}
              className='h-11 w-auto aspect-auto sm:h-14'
            />
            <Button
              id='pdf-viewer-trigger'
              disabled={!hasPdf}
              size='sm'
              className='absolute right-4 top-4'
              onClick={handleOpenPdf}>
              <p className='text-foreground/60'>
                {pdfUrl === undefined && fileDocId ? 'Loading…' : hasPdf ? 'View Policy' : 'No document'}
              </p>
            </Button>
          </div>
          <div className='min-w-0 px-1 sm:px-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='min-w-0 truncate text-base font-semibold tracking-tight'>{planName}</h3>
              {status ? (
                <div
                  // variant='outline'
                  className={cn(
                    'uppercase tracking-tight',
                    status === 'active'
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-foreground/15 text-foreground/80'
                  )}>
                  {status}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          <div className='rounded-2xl border border-foreground/10 bg-background/40 px-4 py-3'>
            <p className='text-xs text-foreground/60'>Effective date</p>
            <p className='mt-1 text-sm font-medium tracking-tight'>{effective}</p>
          </div>
          <div className='rounded-2xl border border-foreground/10 bg-background/40 px-4 py-3'>
            <p className='text-xs text-foreground/60'>Provider</p>
            <p className='mt-1 truncate text-sm font-medium tracking-tight'>{providerName}</p>
          </div>
          <div className='rounded-2xl border border-foreground/10 bg-background/40 px-4 py-3'>
            <p className='text-xs text-foreground/60'>Policy ID</p>
            <p className='mt-1 truncate text-sm font-medium tracking-tight'>{policy?._id.substring(0, 8) ?? '—'}</p>
          </div>
        </div>

        <div className='space-y-3 md:hidden'>
          {orderedFieldRows.map((row) => (
            <div key={row.key} className='rounded-2xl border border-foreground/10 bg-background/70 p-4 shadow-xs'>
              <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-foreground/55'>{row.label}</p>
              <p className='mt-2 wrap-break-word text-sm font-medium tracking-tight text-foreground/90'>{row.value}</p>
            </div>
          ))}
        </div>

        <div className='mt-2 hidden overflow-x-auto rounded-2xl border border-foreground/20 bg-orange-300/30 dark:bg-orange-200/40 md:block'>
          <table className='w-full min-w-[520.01px] text-left text-sm'>
            <thead className='border-b border-foreground/10 bg-background/60'>
              <tr>
                <th className='px-4 py-3 text-xs font-medium text-foreground/60'>Details</th>
                <th className='px-4 py-3 text-xs font-medium text-foreground/60'></th>
              </tr>
            </thead>
            <tbody>
              {orderedFieldRows.map((row, idx) => (
                <tr key={row.key} className={idx % 2 === 0 ? 'bg-foreground/5' : 'bg-background/20'}>
                  <td className='px-4 py-2 align-top font-brk text-xs text-foreground/70 w-64 tracking-tight'>
                    {row.label}
                  </td>
                  <td className='px-4 py-2 align-top font-medium tracking-tight text-foreground/90 w-fit'>
                    <span className='wrap-break-word'>{row.value}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='rounded-2xl border border-foreground/10 bg-background/40 p-4'>
          <div className='flex items-center justify-between gap-3'>
            <p className='text-xs text-foreground/60'>Remarks</p>
            <div className='flex items-center gap-2'>
              <p className='text-xs text-foreground/60' aria-live='polite'>
                {''}
              </p>
            </div>
          </div>
          <pre className='mt-2 max-h-40 overflow-auto whitespace-pre-wrap wrap-break-word rounded-sm bg-foreground/2 p-3 text-xs text-foreground/80'>
            {noteText ?? '—'}
          </pre>
        </div>
      </div>

      {/* ── PDF Viewer Sheet ─────────────────────────────────────── */}
      <Sheet open={pdfOpen} onOpenChange={setPdfOpen}>
        <SheetContent
          side='right'
          className='z-9999 flex h-dvh w-full flex-col gap-0 p-0 max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:h-[88dvh] max-sm:rounded-t-2xl max-sm:border-t max-sm:border-l-0 sm:max-w-4xl'>
          <SheetHeader className='flex shrink-0 flex-row items-center justify-between border-b border-foreground/10 px-4 py-3 sm:px-5'>
            <div className='flex items-center gap-3 min-w-0'>
              <Icon name='re-up.ph' className='size-4 text-foreground/50 shrink-0' />
              <div className='min-w-0'>
                <SheetTitle className='text-sm font-medium truncate'>{planName}</SheetTitle>
                {policy?.policyNumber && <p className='text-xs text-foreground/50 truncate'>{policy.policyNumber}</p>}
              </div>
            </div>
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target='_blank'
                rel='noreferrer'
                className='mr-8 shrink-0 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/70 transition hover:bg-foreground/5'>
                Open in tab
              </a>
            ) : null}
          </SheetHeader>

          <div className='flex-1 min-h-0 relative'>
            {pdfUrl ? (
              <InAppPdfViewer key={pdfUrl} url={pdfUrl} title={`${planName} Policy Document`} />
            ) : (
              <div className='flex flex-col items-center justify-center h-full gap-3 text-foreground/40'>
                <Icon name='spinners-ring' className='size-6' />
                <p className='text-sm'>Loading document…</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
