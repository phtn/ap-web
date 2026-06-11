'use client'

import { Doc } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { ActivePolicyProps } from '..'
import { autoInsFields } from './auto-schema'

type JsonRecord = Record<string, unknown>

const AUTO_OCR_FIELD_PREFIX = 'ocr.'
const AUTO_OCR_RAW_TEXT_KEY = `${AUTO_OCR_FIELD_PREFIX}rawText`

const OCR_FIELD_LABELS: Record<string, string> = {
  ownerName: 'Owner Name',
  ownerAddress: 'Owner Address',
  plateNumber: 'Plate Number',
  engineNumber: 'Engine Number',
  chassisNumber: 'Chassis Number',
  fileNumber: 'MV File Number',
  vehicleType: 'Vehicle Type',
  vehicleCategory: 'Vehicle Category',
  makeBrand: 'Make / Brand',
  series: 'Series',
  yearModel: 'Year Model',
  color: 'Color',
  classification: 'Classification',
  bodyType: 'Body Type',
  dateOfIssue: 'Date of Issue',
  certificateNumber: 'Certificate Number',
  fieldOffice: 'Field Office',
  officeCode: 'Office Code'
}

const OCR_FIELD_ORDER = [
  'ownerName',
  'ownerAddress',
  'plateNumber',
  'engineNumber',
  'chassisNumber',
  'fileNumber',
  'vehicleType',
  'vehicleCategory',
  'makeBrand',
  'series',
  'yearModel',
  'color',
  'classification',
  'bodyType',
  'dateOfIssue',
  'certificateNumber',
  'fieldOffice',
  'officeCode'
] as const

const asRecord = (value: unknown): JsonRecord | null =>
  typeof value === 'object' && value !== null ? (value as JsonRecord) : null

const asString = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const asNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const humanizeKey = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const formatDateTime = (value: number | null | undefined) => {
  if (typeof value !== 'number') return '—'
  try {
    return new Intl.DateTimeFormat('en-PH', {
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

const formatCurrency = (value: unknown) => {
  const numeric = asNumber(value)
  if (numeric === null) return '—'
  return `₱${numeric.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const formatUnknown = (value: unknown): string => {
  if (value === null || typeof value === 'undefined') return '—'
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : '—'
  }
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) {
    const next = value.map((item) => formatUnknown(item)).filter((item) => item !== '—')
    return next.length > 0 ? next.join(', ') : '—'
  }
  try {
    return JSON.stringify(value)
  } catch {
    return '—'
  }
}

type DetailRow = {
  key: string
  label: string
  value: string
  mono?: boolean
}

const MetricCard = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className='rounded-2xl border border-foreground/10 bg-background/40 p-4'>
    <p className='text-xs text-foreground/60'>{label}</p>
    <p
      className={cn(
        'mt-1 text-sm font-medium tracking-tight text-foreground/90 break-all',
        mono && 'font-mono text-xs'
      )}>
      {value}
    </p>
  </div>
)

const DetailTable = ({ title, rows }: { title: string; rows: DetailRow[] }) => {
  if (rows.length === 0) return null

  return (
    <section className='space-y-2'>
      <div className='px-1'>
        <h4 className='text-sm font-semibold tracking-tight'>{title}</h4>
      </div>
      <div className='overflow-x-auto rounded-2xl border border-foreground/10 bg-background/60'>
        <table className='w-full min-w-130 text-left text-sm'>
          <thead className='border-b border-foreground/10 bg-background/70'>
            <tr>
              <th className='px-4 py-3 text-xs font-medium text-foreground/60'>Field</th>
              <th className='px-4 py-3 text-xs font-medium text-foreground/60'>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key} className={index % 2 === 0 ? 'bg-background/30' : 'bg-background/10'}>
                <td className='w-44 px-4 py-3 align-top text-xs text-foreground/70 tracking-tight'>{row.label}</td>
                <td
                  className={cn(
                    'px-4 py-3 align-top font-medium tracking-tight text-foreground/90 break-all',
                    row.mono && 'font-mono text-xs'
                  )}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function AutoActivePolicy({ policy, isTransitioning }: ActivePolicyProps) {
  const payload = useMemo(() => asRecord(policy?.payload) ?? {}, [policy?.payload])
  const client = useMemo(() => asRecord(payload.client) ?? {}, [payload.client])
  const risk = useMemo(() => {
    const risks = Array.isArray(payload.risks) ? payload.risks : []
    return asRecord(risks[0]) ?? {}
  }, [payload.risks])
  const premiumDetails = useMemo(() => asRecord(payload.premiumDetails) ?? {}, [payload.premiumDetails])
  const webhook = useMemo(() => asRecord(payload.standardWebhook) ?? {}, [payload.standardWebhook])

  const formRows = useMemo(() => {
    const fields = policy?.fields
    if (!fields) return [] as DetailRow[]

    const rows: DetailRow[] = []
    for (const group of autoInsFields) {
      for (const field of group.fields) {
        const key = String(field.name)
        const raw = fields[key] as Doc<'insurancePolicies'> | undefined | null
        if (typeof raw === 'undefined') continue
        rows.push({
          key,
          label: field.label ?? key,
          value: formatUnknown(raw)
        })
      }
    }

    return rows
  }, [policy?.fields])

  const ocrRows = useMemo(() => {
    const fields = policy?.fields
    if (!fields) return [] as DetailRow[]

    const ocrEntries = Object.entries(fields)
      .filter(([key]) => key.startsWith(AUTO_OCR_FIELD_PREFIX) && key !== AUTO_OCR_RAW_TEXT_KEY)
      .map(([key, value]) => [key.slice(AUTO_OCR_FIELD_PREFIX.length), value] as const)

    const valueByKey = new Map(ocrEntries)
    const orderedKeys = [
      ...OCR_FIELD_ORDER.filter((key) => valueByKey.has(key)),
      ...ocrEntries
        .map(([key]) => key)
        .filter((key) => !OCR_FIELD_ORDER.includes(key as (typeof OCR_FIELD_ORDER)[number]))
        .sort((left, right) => left.localeCompare(right))
    ]

    return orderedKeys.map((key) => ({
      key: `ocr.${key}`,
      label: OCR_FIELD_LABELS[key] ?? humanizeKey(key),
      value: formatUnknown(valueByKey.get(key))
    }))
  }, [policy?.fields])

  const payloadRows = useMemo(
    () =>
      [
        {
          key: 'payload.partnerReferenceNumber',
          label: 'Partner Reference',
          value: formatUnknown(payload.partnerReferenceNumber),
          mono: true
        },
        {
          key: 'payload.assuredName1',
          label: 'Assured Name',
          value: formatUnknown(payload.assuredName1)
        },
        {
          key: 'payload.client.clientType',
          label: 'Client Type',
          value: formatUnknown(client.clientType)
        },
        {
          key: 'payload.client.contactType',
          label: 'Contact Type',
          value: formatUnknown(client.contactType)
        },
        {
          key: 'payload.client.addressType',
          label: 'Address Type',
          value: formatUnknown(client.addressType)
        },
        {
          key: 'payload.risks[0].riskCode',
          label: 'Risk Code',
          value: formatUnknown(risk.riskCode)
        },
        {
          key: 'payload.risks[0].riskType',
          label: 'Risk Type',
          value: formatUnknown(risk.riskType)
        },
        {
          key: 'payload.risks[0].vehicleType',
          label: 'Vehicle Type',
          value: formatUnknown(risk.vehicleType)
        },
        {
          key: 'payload.risks[0].coverType',
          label: 'Cover Type',
          value: formatUnknown(risk.coverType)
        },
        {
          key: 'payload.risks[0].ctplPremium',
          label: 'CTPL Premium',
          value: formatCurrency(risk.ctplPremium)
        },
        {
          key: 'payload.premiumDetails.vf',
          label: 'Verification Fee',
          value: formatCurrency(premiumDetails.vf)
        }
      ] satisfies DetailRow[],
    [client, payload.partnerReferenceNumber, payload.assuredName1, premiumDetails.vf, risk]
  )

  const webhookRows = useMemo(() => {
    if (Object.keys(webhook).length === 0) return [] as DetailRow[]

    return [
      {
        key: 'webhook.receivedAt',
        label: 'Webhook Received',
        value: formatDateTime(asNumber(webhook.receivedAt))
      },
      {
        key: 'webhook.method',
        label: 'HTTP Method',
        value: formatUnknown(webhook.method)
      },
      {
        key: 'webhook.providerStatus',
        label: 'Provider Status',
        value: formatUnknown(webhook.providerStatus)
      },
      {
        key: 'webhook.resolvedStatus',
        label: 'Resolved Status',
        value: formatUnknown(webhook.resolvedStatus)
      }
    ] satisfies DetailRow[]
  }, [webhook])

  const payloadJson = useMemo(() => {
    try {
      return JSON.stringify(payload, null, 2)
    } catch {
      return null
    }
  }, [payload])

  const rawWebhookJson = useMemo(() => {
    try {
      return webhook.payload ? JSON.stringify(webhook.payload, null, 2) : null
    } catch {
      return null
    }
  }, [webhook.payload])

  const summaryMetrics = useMemo(
    () => [
      {
        label: 'Policy Number',
        value: asString(policy?.policyNumber) ?? 'Awaiting issuer number',
        mono: true
      },
      {
        label: 'Partner Reference',
        value: asString(payload.partnerReferenceNumber) ?? '—',
        mono: true
      },
      {
        label: 'Effective Date',
        value: formatDateTime(policy?.effectiveAt)
      },
      {
        label: 'CTPL Premium',
        value: formatCurrency(risk.ctplPremium)
      }
    ],
    [payload.partnerReferenceNumber, policy?.effectiveAt, policy?.policyNumber, risk.ctplPremium]
  )

  const noteText = useMemo(() => {
    const note = asString(policy?.notes)
    return note ?? '—'
  }, [policy?.notes])

  if (!policy) {
    return (
      <section className='px-6 py-8 border-t-[0.33px] border-foreground/50 md:border-t-0'>
        <div className='rounded-3xl border border-foreground/10 bg-background/60 p-8 text-sm text-foreground/70'>
          No active auto policy found.
        </div>
      </section>
    )
  }

  return (
    <section aria-busy={isTransitioning} className='px-0 py-4 border-t-[0.33px] border-foreground/50 md:border-t-0'>
      <div className='bg-background/60 p-5 shadow-xs space-y-5'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0 px-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='truncate text-base font-semibold tracking-tight'>{policy.planName ?? 'Auto Insurance'}</h3>
              {policy.status ? (
                <div
                  className={cn('uppercase tracking-tight border-foreground/15 text-foreground/80', {
                    'border-blue-500 bg-blue-500 text-white': policy.status === 'active',
                    'border-rose-500 bg-rose-500 text-white': policy.status === 'cancelled',
                    'border-zinc-500 bg-zinc-500 text-white': policy.status === 'inactive'
                  })}>
                  {policy.status}
                </div>
              ) : null}
            </div>
            <p className='mt-1 text-sm text-foreground/70'>
              Provider:{' '}
              <span className='font-medium text-foreground/90'>{policy.providerName || 'Standard Insurance'}</span>
            </p>
            <p className='mt-1 text-xs text-foreground/60'>
              Policy ID: <span className='font-mono text-[11px] break-all'>{policy._id}</span>
            </p>
          </div>

          <div className='shrink-0 rounded-2xl border border-foreground/10 bg-background/40 px-4 py-3'>
            <p className='text-xs text-foreground/60'>Last updated</p>
            <p className='mt-1 text-sm font-medium tracking-tight'>{formatDateTime(policy.updatedAt)}</p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {summaryMetrics.map((item) => (
            <MetricCard key={item.label} label={item.label} value={item.value} mono={item.mono} />
          ))}
        </div>

        <DetailTable title='Submitted Details' rows={formRows} />
        <DetailTable title='Vehicle Registration Snapshot' rows={ocrRows} />
        <DetailTable title='Carrier Payload Summary' rows={payloadRows} />
        <DetailTable title='Webhook Status' rows={webhookRows} />

        <section className='space-y-2'>
          <div className='px-1'>
            <h4 className='text-sm font-semibold tracking-tight'>Notes</h4>
          </div>
          <pre className='max-h-40 overflow-auto whitespace-pre-wrap wrap-break-word rounded-2xl border border-foreground/10 bg-background/60 p-4 text-xs text-foreground/80'>
            {noteText}
          </pre>
        </section>

        {payloadJson ? (
          <details className='rounded-2xl border border-foreground/10 bg-background/60 p-4'>
            <summary className='cursor-pointer text-sm font-semibold tracking-tight'>Saved Policy Payload</summary>
            <pre className='mt-3 max-h-96 overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl border border-foreground/10 bg-background/70 p-3 text-xs text-foreground/80'>
              {payloadJson}
            </pre>
          </details>
        ) : null}

        {rawWebhookJson ? (
          <details className='rounded-2xl border border-foreground/10 bg-background/60 p-4'>
            <summary className='cursor-pointer text-sm font-semibold tracking-tight'>Raw Webhook Payload</summary>
            <pre className='mt-3 max-h-96 overflow-auto whitespace-pre-wrap wrap-break-word rounded-xl border border-foreground/10 bg-background/70 p-3 text-xs text-foreground/80'>
              {rawWebhookJson}
            </pre>
          </details>
        ) : null}
      </div>
    </section>
  )
}
