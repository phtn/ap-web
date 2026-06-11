import { Step, Stepper } from '@/components/react-bits/stepper'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { InsurancePolicyFieldValue } from '@/convex/insurancePolicies/d'
import { onPromise } from '@/ctx/toast'
import { ResendSendInput, useResend } from '@/hooks/use-resend'
import { cn } from '@/lib/utils'
import { useMutation, useQuery } from 'convex/react'
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StepFieldGroup } from '../components'
import { generateCOCPDF } from './actions'
import { PAInsuranceField, paInsFields } from './schema'

type PAFormProps = {
  policyId?: Id<'insurancePolicies'>
  existingFields?: Record<string, InsurancePolicyFieldValue> | undefined
}

export const PAForm = ({ policyId, existingFields }: PAFormProps) => {
  const [values, setValues] = useState<Partial<PAInsuranceField>>({})
  const [dirtyFields, setDirtyFields] = useState<Set<keyof PAInsuranceField>>(() => new Set())
  const [fieldGroups, setFieldGroups] = useState(() =>
    paInsFields.map((g) => ({
      ...g,
      fields: g.fields.map((f) => ({ ...f }))
    }))
  )

  const { send, isSending, error: resendError } = useResend()
  const updatePolicy = useMutation(api.insurancePolicies.m.update)
  const generateUploadUrl = useMutation(api.files.upload.url)
  const storeFile = useMutation(api.files.upload.fileAndId)
  const { user } = { user: { uid: 'user_iddd' } }
  const proId = user?.uid ?? ''
  const hydratedPolicyIdRef = useRef<Id<'insurancePolicies'> | undefined>(undefined)

  const inferPAValuesFromExistingFields = (
    fields: Record<string, InsurancePolicyFieldValue>
  ): Partial<PAInsuranceField> => {
    const asString = (v: InsurancePolicyFieldValue | undefined): string | undefined => {
      if (typeof v === 'string') return v
      if (typeof v === 'number') return String(v)
      if (typeof v === 'boolean') return v ? 'true' : 'false'
      return undefined
    }

    const asBoolean = (v: InsurancePolicyFieldValue | undefined): boolean | undefined => {
      if (typeof v === 'boolean') return v
      if (typeof v === 'number') return v !== 0
      if (typeof v === 'string') {
        const t = v.trim().toLowerCase()
        if (t === 'true') return true
        if (t === 'false') return false
      }
      return undefined
    }

    const next: Partial<PAInsuranceField> = {}

    // Keep this explicit so we truly infer into PAInsuranceField.
    next.fullName = asString(fields.fullName)
    next.email = asString(fields.email)
    next.birthDate = asString(fields.birthDate)
    next.addressLine1 = asString(fields.addressLine1)
    next.tin = asString(fields.tin)
    next.phone = asString(fields.phone)
    next.occupation = asString(fields.occupation)
    next.designatedPosition = asString(fields.designatedPosition)
    next.hazardousOccupation = asBoolean(fields.hazardousOccupation)
    next.beneficiaryFullName = asString(fields.beneficiaryFullName)
    next.beneficiaryContactNumber = asString(fields.beneficiaryContactNumber)
    next.beneficiaryRelationship = asString(fields.beneficiaryRelationship)

    // Remove undefineds so we don't override local inputs with "missing" data.
    for (const k of Object.keys(next) as Array<keyof PAInsuranceField>) {
      if (typeof next[k] === 'undefined') delete next[k]
    }

    return next
  }

  // Hydrate local form state from Convex when the record loads (one-way).
  useEffect(() => {
    if (!existingFields) return
    // Avoid clobbering local edits on every query refresh.
    if (hydratedPolicyIdRef.current === policyId) return
    hydratedPolicyIdRef.current = policyId

    const inferred = inferPAValuesFromExistingFields(existingFields)
    setValues((prev) => ({ ...prev, ...inferred }))
  }, [existingFields, policyId])

  const step1HydrationKey = useMemo(() => {
    const group = paInsFields[0]
    const parts = group.fields.map((f) => {
      const v = existingFields?.[String(f.name)]
      return `${String(f.name)}=${String(v ?? '')}`
    })
    return `${String(policyId ?? 'no-policy')}:${parts.join('|')}`
  }, [existingFields, policyId])

  const saveStepValuesToFields = (step: number) => {
    if (step < 1 || step > fieldGroups.length) return
    const stepIdx = step - 1

    startTransition(() => {
      setFieldGroups((prev) =>
        prev.map((group, idx) => {
          if (idx !== stepIdx) return group
          return {
            ...group,
            fields: group.fields.map((field) => {
              const key = field.name as keyof PAInsuranceField
              const raw = values[key]

              if (field.type === 'checkbox') {
                return { ...field, value: raw === true }
              }

              if (field.type === 'date') {
                const v = typeof raw === 'string' ? raw : undefined
                return { ...field, value: v }
              }

              if (field.type === 'select') {
                const v = typeof raw === 'string' || typeof raw === 'number' ? raw : undefined
                return { ...field, value: v }
              }

              const v = typeof raw === 'string' || typeof raw === 'number' ? raw : undefined
              return { ...field, value: v }
            })
          }
        })
      )
    })
  }

  const persistStepToConvex = (step: number) => {
    if (!policyId) return
    if (step < 1 || step > fieldGroups.length) return

    const group = fieldGroups[step - 1]
    const stepRecord: Record<string, InsurancePolicyFieldValue> = {}

    for (const field of group.fields) {
      const key = field.name as keyof PAInsuranceField
      const raw = values[key]
      if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
        stepRecord[String(field.name)] = raw
      }
    }

    const merged: Record<string, InsurancePolicyFieldValue> = {
      ...(existingFields ?? {}),
      ...stepRecord
    }

    startTransition(() => {
      updatePolicy({
        id: policyId,
        fields: {
          fields: merged
        }
      }).catch(() => undefined)
    })
  }

  const persistAllToConvex = () => {
    if (!policyId) return

    const all: Record<string, InsurancePolicyFieldValue> = {
      ...(existingFields ?? {})
    }

    for (const group of paInsFields) {
      for (const field of group.fields) {
        const key = field.name as keyof PAInsuranceField
        const raw = values[key]
        if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
          all[String(field.name)] = raw
        }
      }
    }

    startTransition(() => {
      updatePolicy({
        id: policyId,
        fields: {
          fields: all
        }
      }).catch(() => undefined)
    })
  }

  const buildAttachmentText = useCallback(() => {
    const v = (key: keyof PAInsuranceField) => {
      const raw = values[key]
      if (typeof raw === 'string') {
        const t = raw.trim()
        return t.length > 0 ? t : 'XXX'
      }
      if (typeof raw === 'number') return String(raw)
      if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
      return 'XXX'
    }

    return [
      'Activate Personal Accident Details',
      '',
      `Full Name: ${v('fullName')}`,
      `Email Address: ${v('email')}`,
      `Birth Date: ${v('birthDate')}`,
      `Home Address: ${v('addressLine1')}`,
      `TIN Number: ${v('tin')}`,
      `Contact Number: ${v('phone')}`,
      `Occupation: ${v('occupation')}`,
      `Designated Position: ${v('designatedPosition')}`,
      `Beneficiary Full Name: ${v('beneficiaryFullName')}`,
      `Beneficiary Contact Number: ${v('beneficiaryContactNumber')}`,
      `Beneficiary Relationship: ${v('beneficiaryRelationship')}`,
      ''
    ].join('\n')
  }, [values])

  const textToBase64 = useCallback((text: string): string => {
    const bytes = new TextEncoder().encode(text)
    let binary = ''
    const chunkSize = 0x8000
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    return btoa(binary)
  }, [])

  const validateRequiredField = useMemo(() => {
    return (field: (typeof paInsFields)[number]['fields'][number], value: unknown) => {
      if (!field.required) return true
      if (field.type === 'checkbox') return value === true
      const v = typeof value === 'string' ? value.trim() : String(value ?? '').trim()
      if (!v) return false
      if (field.type === 'email') return v.includes('@')
      return true
    }
  }, [])

  const groupValidity = useMemo(() => {
    return fieldGroups.map((group) => {
      const invalid = group.fields.some((field) => {
        const key = field.name as keyof PAInsuranceField
        return !validateRequiredField(field, values[key])
      })
      return !invalid
    })
  }, [fieldGroups, validateRequiredField, values])

  const missingRequiredFields = useMemo(() => {
    const missing: Array<{
      groupTitle: string
      label: string
      name: keyof PAInsuranceField
    }> = []

    for (const group of paInsFields) {
      for (const field of group.fields) {
        if (!field.required) continue
        const key = field.name as keyof PAInsuranceField
        if (!validateRequiredField(field, values[key])) {
          missing.push({
            groupTitle: group.title,
            label: field.label ?? String(field.name),
            name: key
          })
        }
      }
    }

    return missing
  }, [validateRequiredField, values])

  const template = useQuery(api.emailSettings.q.getEmailSettingsByIntent, {
    intent: 'activation'
  })

  const sendActivationRequest = useCallback(async () => {
    const rawName = typeof values.fullName === 'string' ? values.fullName.trim() : ''
    const safeName = rawName.length > 0 ? rawName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : 'Unknown'

    // ── Generate random 4-digit COC number ──────────────────────
    const cocNumber = String(Math.floor(1000 + Math.random() * 9000))

    // ── Generate COC PDF & upload to Convex (best-effort) ───────
    let pdfBase64: string | null = null
    let fileDocId: Id<'files'> | null = null

    try {
      pdfBase64 = await generateCOCPDF({
        fullName: values.fullName ?? '',
        cocNumber
      })

      const uploadUrl = await generateUploadUrl()
      const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/pdf' },
        body: pdfBytes
      })
      if (!uploadRes.ok) throw new Error('Storage upload failed')
      const { storageId } = (await uploadRes.json()) as {
        storageId: Id<'_storage'>
      }

      if (proId) {
        fileDocId = await storeFile({ storageId, author: proId })
      }
    } catch (pdfErr) {
      console.error('[PA COC] PDF generation/upload error:', pdfErr)
    }

    // ── Send admin activation email ──────────────────────────────
    const filename = `Activate-Personal-Accident-Insurace-Details-For-${safeName}.txt`
    const text = buildAttachmentText()

    const response = await (async () => {
      try {
        const intent =
          template?.intent && ['activation', 'marketing', 'sales', 'invite', 'notice'].includes(template.intent)
            ? (template.intent as 'activation' | 'marketing' | 'sales' | 'invite' | 'notice')
            : 'activation'

        const sendPayload = {
          intent,
          type: 'insurance',
          cc: [...(template?.cc ?? [])],
          bcc: [...(template?.bcc ?? [])],
          group: 'pa',
          to: [...(template?.to ?? [])],
          subject: template?.subject ?? 'Activate Personal Accident Detail',
          text: template?.text ?? '',
          body: template?.body ?? '',
          html: template?.html ?? '<p>Please find the attached Activate Personal Accident Insurance Details below.</p>',
          attachments: [{ filename, contentBase64: textToBase64(text) }],
          ...(template?.from && template.from.length > 0 ? { from: template.from[0] } : {}),
          ...(template?.headers ? { headers: template.headers } : {})
        } as ResendSendInput

        return await send(sendPayload)
      } catch (err) {
        if (policyId) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          await updatePolicy({
            id: policyId,
            fields: {
              providerName: 'Mercantile Insurance',
              notes: `NotOK:${message}`
            }
          })
        }
        throw err
      }
    })()

    if (!policyId) {
      throw new Error('Missing policy id')
    }

    if (response.ok) {
      // ── Send user copy email with COC PDF attached ─────────────
      const userEmail = (values.email ?? '').trim()
      if (userEmail && pdfBase64) {
        try {
          await send({
            intent: 'notice',
            type: 'insurance',
            group: 'pa',
            to: [userEmail],
            subject: `Your Personal Accident Insurance – COC No. ${cocNumber}`,
            html: `<p>Dear ${values.fullName ?? ''},</p>
<p>Thank you for your Personal Accident Insurance application.</p>
<p>Please find attached your <strong>Confirmation of Cover (COC No. ${cocNumber})</strong> issued by Mercantile Insurance Co., Inc.</p>
<p>Your coverage is effective from <strong>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong> for one (1) year.</p>
<p>Please keep this document for your records.</p>
<p>Best regards,<br/>Protap Insurance Services</p>`,
            attachments: [
              {
                filename: `PA-Insurance-COC-${cocNumber}.pdf`,
                contentBase64: pdfBase64
              }
            ]
          } as ResendSendInput)
        } catch (userEmailErr) {
          console.error('[PA COC] User email error:', userEmailErr)
        }
      }

      await updatePolicy({
        id: policyId,
        fields: {
          providerName: 'Mercantile Insurance',
          status: 'active',
          effectiveAt: Date.now(),
          policyNumber: `COC-${cocNumber}`,
          ...(fileDocId !== null ? { attachments: [fileDocId] } : {}),
          notes: `OK:${response.id ?? 'null'}`
        }
      })
      return
    }

    await updatePolicy({
      id: policyId,
      fields: {
        providerName: 'Mercantile Insurance',
        notes: `NotOK:${response.error}`
      }
    })
    throw new Error(response.error ?? 'Activation request failed')
  }, [
    buildAttachmentText,
    generateUploadUrl,
    policyId,
    proId,
    send,
    storeFile,
    template,
    textToBase64,
    updatePolicy,
    values.email,
    values.fullName
  ])

  return (
    <main className='flex items-start border-[0.33px] border-foreground/40 px-4'>
      <Stepper
        isLoading={isSending}
        initialStep={1}
        onStepChange={() => {}}
        getNextDisabled={(step, isLastStep) => {
          if (values.hazardousOccupation === true && (step === 3 || isLastStep)) {
            return true
          }
          return isLastStep && groupValidity.some((v) => !v)
        }}
        onFinalStepCompleted={() =>
          onPromise(
            sendActivationRequest(),
            {
              loading: 'Submitting activation request…',
              success: 'Activation request submitted!',
              error: (err) => (err instanceof Error ? err.message : 'Something went wrong')
            },
            { duration: 4000 }
          )
        }
        onNextAttempt={(step) => {
          // Submit step (Stepper includes an extra final step after the field groups)
          if (step > fieldGroups.length) {
            persistAllToConvex()
            // downloadAttachment()
            return true
          }

          if (step > fieldGroups.length) return true

          // Persist current step inputs into the group's `fields` property
          saveStepValuesToFields(step)
          // Persist current step inputs into Convex `insurancePolicies.fields`
          persistStepToConvex(step)

          const group = fieldGroups[step - 1]
          const keys = group.fields.filter((f) => f.required).map((f) => f.name as keyof PAInsuranceField)

          // Mark required fields as dirty so errors + indicator can show
          setDirtyFields((prev) => {
            const next = new Set(prev)
            for (const k of keys) next.add(k)
            return next
          })

          // Trigger validation, but don't block navigation
          return true
        }}
        backButtonText='Previous'
        nextButtonText='Next'
        nextButtonProps={{
          className:
            'flex items-center justify-center px-4 py-1.5 space-x-2 rounded-md bg-foreground text-background hover:bg-foreground/90 dark:bg-foreground dark:text-background dark:hover:bg-foreground/85 whitespace-nowrap',
          disabled: isSending,
          'aria-busy': isSending
        }}
        indicatorVariant='outline'
        getStepValidation={(step) => {
          // steps are 1-indexed; final "You made it" step is unknown
          if (step <= fieldGroups.length) {
            // Step 3 is Employment — hazardous occupation is always invalid
            if (step === 3 && values.hazardousOccupation === true) {
              return 'invalid'
            }

            const group = fieldGroups[step - 1]
            const keys = group.fields.map((f) => f.name as keyof PAInsuranceField)
            const hasDirty = keys.some((k) => dirtyFields.has(k))

            if (groupValidity[step - 1]) return 'valid'
            return hasDirty ? 'invalid' : 'unknown'
          }
          return 'unknown'
        }}>
        {fieldGroups.map((group, idx) => (
          <StepFieldGroup
            key={idx === 0 ? `${group.title}:${step1HydrationKey}` : group.title}
            group={{
              ...group,
              fields: group.fields.map((field) => {
                const key = field.name as keyof PAInsuranceField
                const raw = values[key]

                const markDirtyAndSet = (next: unknown) => {
                  setDirtyFields((prev) => {
                    const n = new Set(prev)
                    n.add(key)
                    return n
                  })
                  setValues((prev) => ({
                    ...prev,
                    [key]:
                      typeof next === 'string' || typeof next === 'number' || typeof next === 'boolean'
                        ? (next as never)
                        : (String(next) as never)
                  }))
                }

                const isDirty = dirtyFields.has(key)

                if (field.type === 'checkbox') {
                  const checked = raw === true
                  const isInvalid = isDirty && field.required && !checked
                  return {
                    ...field,
                    value: checked,
                    error: isInvalid ? 'Required' : false,
                    validators: {
                      onChange: (next) => {
                        markDirtyAndSet(next)
                        return true
                      }
                    }
                  }
                }

                if (field.type === 'select') {
                  const value = typeof raw === 'string' || typeof raw === 'number' ? raw : undefined
                  const isInvalid = isDirty && field.required && String(value ?? '').trim() === ''
                  return {
                    ...field,
                    value,
                    error: isInvalid ? 'Required' : false,
                    validators: {
                      onChange: (next) => {
                        markDirtyAndSet(next)
                        return true
                      }
                    }
                  }
                }

                // text/email/tel/number/file/password
                const value = typeof raw === 'string' || typeof raw === 'number' ? raw : undefined
                const trimmed = String(value ?? '').trim()
                const emailInvalid = field.type === 'email' && trimmed.length > 0 && !trimmed.includes('@')
                const isInvalid = isDirty && field.required && (trimmed.length === 0 || emailInvalid)

                return {
                  ...field,
                  // Use defaultValue so initial population works with our input primitives.
                  defaultValue: value,
                  value: undefined,
                  error: isInvalid ? 'Required' : false,
                  validators: {
                    onChange: (next) => {
                      markDirtyAndSet(next)
                      return true
                    }
                  }
                }
              })
            }}
          />
        ))}

        <Step>
          <div id='final-step-container' className='space-y-1 py-1 px-1 border-b-[0.33px] h-96 border-foreground/30'>
            <h2
              id='final-step-title'
              className={cn('font-semibold tracking-tight font-figtree text-lg', {
                'text-orange-400': missingRequiredFields.length !== 0 || values.hazardousOccupation === true
              })}>
              {values.hazardousOccupation === true ? (
                'Ineligible occupation'
              ) : missingRequiredFields.length === 0 ? (
                'You made it to the final step!'
              ) : (
                <span>
                  <span className='font-space font-semibold mr-2'>{missingRequiredFields.length}</span>
                  required field
                  {missingRequiredFields.length === 1 ? '' : 's'} missing
                </span>
              )}
            </h2>
          </div>
          <div id='final-step-description' className='tracking-tight font-figtree space-y-2 py-3'>
            {values.hazardousOccupation === true ? (
              <p className='text-sm opacity-70'>
                Personal Accident insurance is not available for hazardous occupations. Please uncheck the Occupation
                Check on step 3 to proceed, or contact support if you believe this is an error.
              </p>
            ) : missingRequiredFields.length === 0 ? (
              <p>Click submit to complete.</p>
            ) : (
              <>
                <p className='opacity-70 text-sm'>Complete the required fields below:</p>
                <ul className='list-disc pl-5 space-y-1 text-base'>
                  {missingRequiredFields.map((f) => (
                    <li key={`${f.groupTitle}:${String(f.name)}`}>
                      <span className='font-medium'>{f.groupTitle}:</span> {f.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Step>
      </Stepper>
      <div className='flex items-center justify-center'>
        <p className='mt-3 text-sm text-red-500' aria-live='polite'>
          {resendError ?? ''}
        </p>
      </div>
    </main>
  )
}
