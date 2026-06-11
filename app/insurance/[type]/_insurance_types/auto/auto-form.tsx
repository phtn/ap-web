'use client'

import { ProtapViewTransition } from '@/components/view-transition'
import { MouseEvent, startTransition, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { PolicyFormProps } from '..'

import { Step, Stepper } from '@/components/react-bits/stepper'
import { Button } from '@/components/ui/button'
import { useFileSelect } from '@/hooks/use-file-select'
import { cn } from '@/lib/utils'
import { formatFileSize } from '@/utils/file'

import { LabelSection } from '@/components/form/fields'
import type { FieldConfig, FieldGroup, FieldValidator, RadioFieldOption } from '@/components/form/schema'
// import { useAuthCtx } from '@/ctx/auth'
import { onError, onSuccess } from '@/ctx/toast'
import { useGeminiParsing } from '@/hooks/use-gemini-parsing'
import { useOCRProcessing } from '@/hooks/use-ocr-processing'
import { useToggle } from '@/hooks/use-toggle'
import { Icon } from '@/lib/icons'
import { api } from '@@/convex/_generated/api'
import { Id } from '@@/convex/_generated/dataModel'
import { InsurancePolicyFieldValue } from '@@/convex/insurancePolicies/d'
import { useMutation, useQuery } from 'convex/react'
import Image from 'next/image'
import { parseAsString, useQueryState } from 'nuqs'
import { StepFieldGroup } from '../components'
import { VehicleRegistration } from '../types'
import { autoInsFields } from './auto-schema'
import { CRForm } from './cr-form'

type AutoInsuranceFields = (typeof autoInsFields)[number] extends FieldGroup<infer T> ? T : never

// type AutoPlan = AutoInsuranceFields['planName']
type DirtyKey = keyof Pick<
  AutoInsuranceFields,
  | 'planName'
  | 'crImage'
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'city'
  | 'postalCode'
  | 'email'
  | 'phone'
  | 'insuranceProvider'
>

type AutoFormValues = Partial<Pick<AutoInsuranceFields, DirtyKey>>
type PersonalInfoKey = Extract<DirtyKey, 'firstName' | 'middleName' | 'lastName' | 'city' | 'postalCode'>
type ContactInfoKey = Extract<DirtyKey, 'email' | 'phone'>
type InsurancePolicyPayload = Record<string, unknown>
type RegistrationRateKey = 'n' | 'r'
type RegistrationType = 'brand-new' | 'renewal'
type CtplRate = Partial<Record<RegistrationRateKey, number | string>>
type StandardCtplRates = Partial<Record<string, CtplRate>>
type StandardPricingState = {
  price: number | null
  rateKey: RegistrationRateKey | null
  registrationType: RegistrationType | null
  vehicleCategoryKey: string | null
  yearModel: number | null
}

const POSTAL_CODE_PATTERN = /\b\d{4}\b/
const YEAR_MODEL_PATTERN = /\b(19|20)\d{2}\b/
const VEHICLE_CATEGORY_PATTERN = /\b([LMN]\d)\b/i
const NAME_SUFFIXES = new Set(['JR', 'SR', 'II', 'III', 'IV', 'V'])
const SINGLE_WORD_SURNAME_PREFIXES = new Set([
  'DE',
  'DEL',
  'DELA',
  'DELOS',
  'DELAS',
  'LA',
  'LAS',
  'LOS',
  'SAN',
  'SANTA'
])
const MULTI_WORD_SURNAME_PREFIXES = new Set(['DE LA', 'DE LOS', 'DE LAS'])
const STANDARD_PROVIDER_LABEL = 'Standard Insurance'
const STANDARD_PROVIDER_VALUE = 'standard-insurance'
const AUTO_OCR_FIELD_PREFIX = 'ocr.'
const AUTO_OCR_RAW_TEXT_KEY = `${AUTO_OCR_FIELD_PREFIX}rawText`
const AUTO_VALUE_KEYS: DirtyKey[] = [
  'planName',
  'crImage',
  'firstName',
  'middleName',
  'lastName',
  'city',
  'postalCode',
  'email',
  'phone',
  'insuranceProvider'
]

const normalizeOcrText = (value?: string | null) =>
  value
    ?.replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim() ?? ''

const withOptionalSuffix = (value: string, suffix?: string) => (suffix ? `${value} ${suffix}` : value)

const stripTrailingSuffix = (tokens: string[]) => {
  if (tokens.length === 0) {
    return { tokens, suffix: undefined as string | undefined }
  }

  const suffix = tokens.at(-1)?.replace(/\./g, '').toUpperCase()
  if (!suffix || !NAME_SUFFIXES.has(suffix)) {
    return { tokens, suffix: undefined as string | undefined }
  }

  return {
    tokens: tokens.slice(0, -1),
    suffix: tokens.at(-1)
  }
}

const mapOwnerNameToPersonalInfo = (
  ownerName?: string
): Partial<Record<Extract<PersonalInfoKey, 'firstName' | 'middleName' | 'lastName'>, string>> => {
  const normalized = normalizeOcrText(ownerName)
  if (!normalized) return {}

  if (normalized.includes(',')) {
    const [rawLastName, rawRemaining = ''] = normalized.split(',', 2).map((part) => part.trim())
    const remainingTokens = rawRemaining.split(' ').filter(Boolean)
    const { tokens, suffix } = stripTrailingSuffix(remainingTokens)

    if (!rawLastName || tokens.length === 0) return {}

    const [firstName, ...middleTokens] = tokens
    return {
      firstName,
      ...(middleTokens.length > 0 ? { middleName: middleTokens.join(' ') } : {}),
      lastName: withOptionalSuffix(rawLastName, suffix)
    }
  }

  const rawTokens = normalized.split(' ').filter(Boolean)
  const { tokens, suffix } = stripTrailingSuffix(rawTokens)

  if (tokens.length === 0) return {}
  if (tokens.length === 1) {
    return { firstName: withOptionalSuffix(tokens[0], suffix) }
  }
  if (tokens.length === 2) {
    return {
      firstName: tokens[0],
      lastName: withOptionalSuffix(tokens[1], suffix)
    }
  }

  let lastNameStart = tokens.length - 1
  const penultimate = tokens.at(-2)?.toUpperCase()
  const twoWordPrefix = `${tokens.at(-3)?.toUpperCase() ?? ''} ${tokens.at(-2)?.toUpperCase() ?? ''}`.trim()

  if (MULTI_WORD_SURNAME_PREFIXES.has(twoWordPrefix)) {
    lastNameStart = tokens.length - 3
  } else if (penultimate && SINGLE_WORD_SURNAME_PREFIXES.has(penultimate)) {
    lastNameStart = tokens.length - 2
  }

  const firstName = tokens[0]
  const middleTokens = tokens.slice(1, lastNameStart)
  const lastName = withOptionalSuffix(tokens.slice(lastNameStart).join(' '), suffix)

  return {
    firstName,
    ...(middleTokens.length > 0 ? { middleName: middleTokens.join(' ') } : {}),
    lastName
  }
}

const mapOwnerAddressToPersonalInfo = (
  ownerAddress?: string
): Partial<Record<Extract<PersonalInfoKey, 'city' | 'postalCode'>, string>> => {
  const normalized = normalizeOcrText(ownerAddress)
  if (!normalized) return {}

  const postalCode = normalized.match(POSTAL_CODE_PATTERN)?.[0]
  const segments = normalized
    .split(',')
    .map((segment) => segment.replace(POSTAL_CODE_PATTERN, '').replace(/\s+/g, ' ').trim().replace(/\.$/, ''))
    .filter(Boolean)

  let city = [...segments].reverse().find((segment) => /\b(city|municipality|municipal)\b/i.test(segment))

  if (!city && segments.length > 1) {
    city = [...segments].reverse().find((segment) => !/\b(province|philippines)\b/i.test(segment))
  }

  return {
    ...(city ? { city } : {}),
    ...(postalCode ? { postalCode } : {})
  }
}

const mergeParsedPersonalInfo = (
  prev: AutoFormValues,
  dirtyFields: Set<DirtyKey>,
  parsed: VehicleRegistration
): AutoFormValues => {
  const mappedFields: Partial<Record<PersonalInfoKey, string>> = {
    ...mapOwnerNameToPersonalInfo(parsed.ownerName),
    ...mapOwnerAddressToPersonalInfo(parsed.ownerAddress)
  }

  const next = { ...prev }
  const nextPersonalInfo = next as Record<PersonalInfoKey, string | undefined>

  for (const [key, value] of Object.entries(mappedFields) as Array<[PersonalInfoKey, string]>) {
    if (!value || dirtyFields.has(key)) continue
    nextPersonalInfo[key] = value
  }

  return next
}

const mergeProfileContactInfo = (
  prev: AutoFormValues,
  dirtyFields: Set<DirtyKey>,
  contactInfo: Partial<Record<ContactInfoKey, string>>
): AutoFormValues => {
  const next = { ...prev }
  const nextContactInfo = next as Record<ContactInfoKey, string | undefined>
  let changed = false

  for (const [key, value] of Object.entries(contactInfo) as Array<[ContactInfoKey, string]>) {
    if (!value || dirtyFields.has(key)) continue
    if (normalizeOcrText(nextContactInfo[key]).length > 0) continue
    nextContactInfo[key] = value
    changed = true
  }

  return changed ? next : prev
}

const parseYearModel = (yearModel?: string) => {
  const normalized = normalizeOcrText(yearModel)
  if (!normalized) return null

  const match = normalized.match(YEAR_MODEL_PATTERN)
  return match ? Number(match[0]) : null
}

const resolveVehicleCategoryKey = (vehicleCategory?: string) => {
  const normalized = normalizeOcrText(vehicleCategory).toUpperCase()
  if (!normalized) return null

  const match = normalized.match(VEHICLE_CATEGORY_PATTERN)
  return match?.[1]?.toUpperCase() ?? null
}

const getStandardCtplRates = (value: unknown): StandardCtplRates | null => {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const directStandard = record.standard

  if (directStandard && typeof directStandard === 'object') {
    return directStandard as StandardCtplRates
  }

  const nestedCtpl = record.ctpl
  if (!nestedCtpl || typeof nestedCtpl !== 'object') return null

  const nestedStandard = (nestedCtpl as Record<string, unknown>).standard
  if (!nestedStandard || typeof nestedStandard !== 'object') return null

  return nestedStandard as StandardCtplRates
}

const toNumericPrice = (value: number | string | undefined) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const deriveStandardPricingState = (
  ctplValue: unknown,
  structuredFields: VehicleRegistration | null
): StandardPricingState => {
  const standardRates = getStandardCtplRates(ctplValue)
  const vehicleCategoryKey = resolveVehicleCategoryKey(structuredFields?.vehicleCategory)
  const yearModel = parseYearModel(structuredFields?.yearModel)
  const currentYear = new Date().getFullYear()
  const registrationType =
    yearModel == null
      ? null
      : yearModel === currentYear
        ? ('brand-new' as RegistrationType)
        : ('renewal' as RegistrationType)
  const rateKey =
    registrationType === 'brand-new'
      ? ('n' as RegistrationRateKey)
      : registrationType === 'renewal'
        ? ('r' as RegistrationRateKey)
        : null
  const price = toNumericPrice(
    rateKey && vehicleCategoryKey ? standardRates?.[vehicleCategoryKey]?.[rateKey] : undefined
  )

  return {
    price,
    rateKey,
    registrationType,
    vehicleCategoryKey,
    yearModel
  }
}

const createDisabledProviderOption = (description: string): RadioFieldOption[] => [
  {
    value: STANDARD_PROVIDER_VALUE,
    label: STANDARD_PROVIDER_LABEL,
    description,
    disabled: true
  }
]

const asFieldString = (value: InsurancePolicyFieldValue | undefined) => {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return undefined
}

const inferAutoValuesFromExistingFields = (fields: Record<string, InsurancePolicyFieldValue>): AutoFormValues => {
  const next: AutoFormValues = {}

  for (const key of AUTO_VALUE_KEYS) {
    const value = asFieldString(fields[key])
    if (typeof value === 'undefined') continue

    if (key === 'planName') {
      if (value === 'CTPL' || value === 'Comprehensive') {
        next.planName = value
      }
      continue
    }

    next[key] = value as Exclude<AutoFormValues[typeof key], undefined>
  }

  return next
}

const inferStructuredFieldsFromExistingFields = (fields: Record<string, InsurancePolicyFieldValue>) => {
  const next: VehicleRegistration = {}

  for (const [key, value] of Object.entries(fields)) {
    if (!key.startsWith(AUTO_OCR_FIELD_PREFIX) || key === AUTO_OCR_RAW_TEXT_KEY) {
      continue
    }

    const parsedValue = asFieldString(value)
    if (!parsedValue) continue

    next[key.slice(AUTO_OCR_FIELD_PREFIX.length) as keyof VehicleRegistration] = parsedValue
  }

  return Object.keys(next).length > 0 ? next : null
}

const inferRawTextFromExistingFields = (fields: Record<string, InsurancePolicyFieldValue>) =>
  asFieldString(fields[AUTO_OCR_RAW_TEXT_KEY]) ?? ''

const buildAssuredName = ({ values, ownerName }: { values: AutoFormValues; ownerName?: string }) => {
  const parts = [values.firstName, values.middleName, values.lastName]
    .map((part) => normalizeOcrText(part))
    .filter(Boolean)

  if (parts.length > 0) return parts.join(' ')
  return normalizeOcrText(ownerName)
}

const splitClientAddress = ({
  ownerAddress,
  city
}: {
  ownerAddress?: string
  city?: string
}): Partial<Record<'address1' | 'address2', string>> => {
  const normalizedOwnerAddress = normalizeOcrText(ownerAddress)
  const normalizedCity = normalizeOcrText(city)

  if (!normalizedOwnerAddress) {
    return normalizedCity ? { address1: normalizedCity } : {}
  }

  const segments = normalizedOwnerAddress
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)

  if (segments.length <= 1) {
    return {
      address1: normalizedOwnerAddress,
      ...(normalizedCity && normalizedCity !== normalizedOwnerAddress ? { address2: normalizedCity } : {})
    }
  }

  return {
    address1: segments[0],
    address2: segments.slice(1).join(', ')
  }
}

const mapOwnerAddressToPayloadLocation = (ownerAddress?: string) => {
  const normalized = normalizeOcrText(ownerAddress)
  if (!normalized) return {}

  const segments = normalized
    .split(',')
    .map((segment) => segment.replace(/\.$/, '').trim())
    .filter(Boolean)

  if (segments.length < 2) {
    return {
      postalCode: normalized.match(POSTAL_CODE_PATTERN)?.[0]
    }
  }

  const province = segments.at(-2)
  const postalSegment = segments.at(-1)
  const postalCode = postalSegment?.match(POSTAL_CODE_PATTERN)?.[0]

  return {
    ...(province ? { province } : {}),
    ...(postalCode ? { postalCode } : {})
  }
}

const compactPayloadValue = (value: unknown): unknown => {
  if (value == null) return undefined

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  if (Array.isArray(value)) {
    const next = value.map((item) => compactPayloadValue(item)).filter((item) => typeof item !== 'undefined')
    return next.length > 0 ? next : undefined
  }

  if (typeof value === 'object') {
    const nextEntries = Object.entries(value as Record<string, unknown>).flatMap(([key, entryValue]) => {
      const nextValue = compactPayloadValue(entryValue)
      return typeof nextValue === 'undefined' ? [] : [[key, nextValue] as const]
    })

    return nextEntries.length > 0 ? Object.fromEntries(nextEntries) : undefined
  }

  return value
}

const compactPayloadRecord = (value: InsurancePolicyPayload) =>
  (compactPayloadValue(value) as InsurancePolicyPayload | undefined) ?? {}

const toRequiredPayloadString = (value?: string | null) => {
  const normalized = normalizeOcrText(value)
  return normalized.length > 0 ? normalized : null
}

const normalizeMobileContactNumber = (value?: string | null) => {
  const normalized = normalizeOcrText(value)
  if (!normalized) return null

  const rawDigits = normalized.replace(/\D+/g, '')
  const digits = rawDigits.startsWith('00') ? rawDigits.slice(2) : rawDigits

  if (!digits) return null
  if (digits.startsWith('09')) return digits
  if (digits.startsWith('9')) return `0${digits}`
  if (digits.startsWith('63') && digits[2] === '9') {
    return `0${digits.slice(2)}`
  }

  return normalized.startsWith('09') ? normalized : null
}

const buildPartnerReferenceNumber = (policyId?: Id<'insurancePolicies'>) => {
  if (!policyId) return undefined
  return `AUTO-${String(policyId).slice(-15)}`
}

const buildStandardReturnUrl = () => 'https://protap.ph/api/webhooks/standard'

const buildStandardPayload = ({
  policyId,
  values,
  structuredFields,
  fallbackEmail,
  fallbackPhone,
  price
}: {
  policyId?: Id<'insurancePolicies'>
  values: AutoFormValues
  structuredFields: VehicleRegistration | null
  fallbackEmail?: string | null
  fallbackPhone?: string | null
  price: number | null
}) => {
  const assuredName1 = buildAssuredName({
    values,
    ownerName: structuredFields?.ownerName
  })
  const { address1, address2 } = splitClientAddress({
    ownerAddress: structuredFields?.ownerAddress,
    city: values.city
  })
  const { province, postalCode: ownerPostalCode } = mapOwnerAddressToPayloadLocation(structuredFields?.ownerAddress)
  const optionalClientFields = compactPayloadRecord({
    firstName: values.firstName,
    middleName: values.middleName,
    lastName: values.lastName
  })
  const optionalRiskFields = compactPayloadRecord({
    ctplPremium: price
  })

  return {
    partnerReferenceNumber: buildPartnerReferenceNumber(policyId) ?? null,
    assuredName1: toRequiredPayloadString(assuredName1),
    inceptionDate: null,
    returnUrl: buildStandardReturnUrl(),
    cancelledReturnUrl: buildStandardReturnUrl(),
    failedReturnUrl: buildStandardReturnUrl(),
    client: {
      clientType: 'I',
      contactType: 'M',
      contactNumber: toRequiredPayloadString(normalizeMobileContactNumber(values.phone ?? fallbackPhone)),
      addressType: 'H',
      address1: toRequiredPayloadString(address1),
      address2: toRequiredPayloadString(address2),
      province: toRequiredPayloadString(province),
      postalCode: toRequiredPayloadString(values.postalCode ?? ownerPostalCode),
      emailAddress: toRequiredPayloadString(values.email ?? fallbackEmail),
      ...optionalClientFields
    },
    risks: [
      {
        riskCode: 'motor',
        riskType: 'PRIVATE',
        vehicleType: 'Private Vehicle',
        packageCode: null,
        assignee1: toRequiredPayloadString(assuredName1),
        plateNumber: toRequiredPayloadString(structuredFields?.plateNumber),
        modelId: null,
        engineNumber: toRequiredPayloadString(structuredFields?.engineNumber),
        chassisNumber: toRequiredPayloadString(structuredFields?.chassisNumber),
        mvFileNumber: toRequiredPayloadString(structuredFields?.fileNumber),
        coverType: '07',
        ...optionalRiskFields
      }
    ],
    premiumDetails: {
      basicPremium: null,
      evat: null,
      dst: null,
      lgt: null,
      vf: 50.0
    }
  }
}

const serializeAutoDraftFields = ({
  existingFields,
  values,
  dirtyFields,
  structuredFields,
  rawText
}: {
  existingFields?: Record<string, InsurancePolicyFieldValue>
  values: AutoFormValues
  dirtyFields: Set<DirtyKey>
  structuredFields: VehicleRegistration | null
  rawText: string
}) => {
  const next: Record<string, InsurancePolicyFieldValue> = {
    ...(existingFields ?? {})
  }

  for (const key of AUTO_VALUE_KEYS) {
    const raw = values[key]

    if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
      next[key] = raw
      continue
    }

    if (dirtyFields.has(key)) {
      delete next[key]
    }
  }

  if (structuredFields) {
    for (const key of Object.keys(next)) {
      if (key.startsWith(AUTO_OCR_FIELD_PREFIX)) {
        delete next[key]
      }
    }

    for (const [key, value] of Object.entries(structuredFields)) {
      const normalized = normalizeOcrText(value)
      if (!normalized) continue
      next[`${AUTO_OCR_FIELD_PREFIX}${key}`] = normalized
    }
  }

  if (structuredFields || rawText.trim().length > 0) {
    delete next[AUTO_OCR_RAW_TEXT_KEY]

    const normalizedRawText = rawText.trim()
    if (normalizedRawText) {
      next[AUTO_OCR_RAW_TEXT_KEY] = normalizedRawText
    }
  }

  return next
}

const createStableValueSignature = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => createStableValueSignature(item)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${createStableValueSignature(entryValue)}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

const getProviderNameFromValue = (value: string | undefined) => {
  if (value === STANDARD_PROVIDER_VALUE) return STANDARD_PROVIDER_LABEL
  return value?.trim() ?? ''
}

const clampStep = (step: number, totalSteps: number) => Math.min(Math.max(step, 1), totalSteps)

export const AutoForm = ({ policyId, existingFields, existingPayload }: PolicyFormProps) => {
  const { user } = { user: { uid: 'user_iddd' } }
  const proId = user?.uid
  // const fields = useMemo(() => {
  //   const group = autoInsFields[0]
  //   const plan = group.fields.find((f) => f.name === 'planName')
  //   const cr = group.fields.find((f) => f.name === 'crImage')
  //   return {group, plan, cr}
  // }, [])

  const [fieldGroups] = useState<Array<FieldGroup<AutoInsuranceFields>>>(() => {
    // Use the schema directly instead of manually constructing
    return autoInsFields
  })

  const [values, setValues] = useState<AutoFormValues>({})
  const [dirtyFields, setDirtyFields] = useState<Set<DirtyKey>>(() => new Set())
  const updatePolicy = useMutation(api.insurancePolicies.m.update)
  const [isCrDragActive, setIsCrDragActive] = useState(false)
  const crDropRef = useRef<HTMLButtonElement | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [structuredFields, setStructuredFields] = useState<VehicleRegistration | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdPolicyId, setCreatedPolicyId] = useState<Id<'insurancePolicies'> | undefined>(undefined)
  const hydratedPolicyIdRef = useRef<Id<'insurancePolicies'> | undefined>(undefined)
  const creatingPolicyRef = useRef(false)
  const lastPersistedSignatureRef = useRef<string>('')
  const id = useId()
  const [, setRecordIdParam] = useQueryState('record', parseAsString)
  const [stepParam, setStepParam] = useQueryState('step', parseAsString)
  const profileUser = useQuery(api.users.q.getByProId, proId ? { proId } : 'skip')
  const userProfile = useQuery(api.userProfiles.q.getByProId, proId ? { proId } : 'skip')
  const createPolicy = useMutation(api.insurancePolicies.m.create)
  const ctplSetting = useQuery(api.emailSettings.q.getEmailSettingsByIntent, {
    intent: 'ctpl'
  })

  const {
    accept: crAccept,
    loading: isCrUploading,
    inputFileRef: crInputRef,
    openFileDialog: pickCrFile,
    selected: crSelected,
    clearSelected: clearCrSelected,
    handleFileSelect: handleCrInputSelect,
    handleFiles: handleCrFiles
  } = useFileSelect()

  // This form currently uses selection-only (no upload), so preview the selected file.
  const crSelectedList = Array.isArray(crSelected) ? crSelected : crSelected ? [crSelected] : []
  const crSelectedItem = crSelectedList[0] ?? null
  const crPreviewUrl = crSelectedItem ? URL.createObjectURL(crSelectedItem) : null
  const isCrPdf = crSelectedItem?.type === 'application/pdf'
  const isCrImage = Boolean(crSelectedItem?.type?.startsWith('image/'))
  const scanFile = isCrImage ? crSelectedItem : null

  useEffect(() => {
    // Keep the drop zone focused when files are replaced via drop, for keyboard users.
    if (crSelectedItem && crDropRef.current) crDropRef.current.focus()
  }, [crSelectedItem])

  // Keep form values in sync with the currently selected CR file (for validation + review step).
  useEffect(() => {
    startTransition(() => {
      setValues((prev) => {
        if (crSelectedItem) return { ...prev, crImage: crSelectedItem.name }
        if (typeof prev.crImage === 'undefined') return prev
        const next = { ...prev }
        delete next.crImage
        return next
      })
    })
  }, [crSelectedItem])

  const { extractText: extractTextFromFile, loading: isScanning } = useOCRProcessing()
  const { parseWithGemini: parseText, loading: parsing } = useGeminiParsing()
  const totalSteps = fieldGroups.length + 1
  const resolvedPolicyId = policyId ?? createdPolicyId
  const currentStep = useMemo(() => clampStep(Number(stepParam ?? 1), totalSteps), [stepParam, totalSteps])
  const standardPricingState = useMemo(
    () => deriveStandardPricingState(ctplSetting, structuredFields),
    [ctplSetting, structuredFields]
  )
  const buildDraftPayload = useCallback(
    (
      overrides?: Partial<{
        values: AutoFormValues
        structuredFields: VehicleRegistration | null
        policyId: Id<'insurancePolicies'> | undefined
      }>
    ) => {
      const nextStructuredFields = overrides?.structuredFields ?? structuredFields
      const pricingState = deriveStandardPricingState(ctplSetting, nextStructuredFields)

      return buildStandardPayload({
        policyId: overrides?.policyId ?? resolvedPolicyId,
        values: overrides?.values ?? values,
        structuredFields: nextStructuredFields,
        fallbackEmail: userProfile?.email ?? profileUser?.email,
        fallbackPhone: userProfile?.phone,
        price: pricingState.price
      })
    },
    [
      ctplSetting,
      resolvedPolicyId,
      structuredFields,
      userProfile?.email,
      userProfile?.phone,
      values,
      profileUser?.email
    ]
  )

  const persistDraftToConvex = useCallback(
    (
      overrides?: Partial<{
        values: AutoFormValues
        dirtyFields: Set<DirtyKey>
        structuredFields: VehicleRegistration | null
        rawText: string
        policyId: Id<'insurancePolicies'> | undefined
      }>
    ) => {
      const targetPolicyId = overrides?.policyId ?? resolvedPolicyId
      if (!targetPolicyId) return Promise.resolve()

      const nextValues = overrides?.values ?? values
      const nextDirtyFields = overrides?.dirtyFields ?? dirtyFields
      const nextStructuredFields = overrides?.structuredFields ?? structuredFields
      const nextRawText = overrides?.rawText ?? rawText
      const fields = serializeAutoDraftFields({
        existingFields,
        values: nextValues,
        dirtyFields: nextDirtyFields,
        structuredFields: nextStructuredFields,
        rawText: nextRawText
      })
      const payload = buildDraftPayload({
        values: nextValues,
        structuredFields: nextStructuredFields,
        policyId: targetPolicyId
      })
      const signature = createStableValueSignature({ fields, payload })

      if (signature === lastPersistedSignatureRef.current) {
        return Promise.resolve()
      }

      lastPersistedSignatureRef.current = signature

      const patch: {
        fields: Record<string, InsurancePolicyFieldValue>
        payload: InsurancePolicyPayload
        planName?: string | null
        providerName?: string
      } = {
        fields,
        payload
      }

      if (typeof nextValues.planName === 'string') {
        patch.planName = nextValues.planName
      } else if (nextDirtyFields.has('planName')) {
        patch.planName = null
      }

      if (typeof nextValues.insuranceProvider === 'string') {
        patch.providerName = getProviderNameFromValue(nextValues.insuranceProvider)
      } else if (nextDirtyFields.has('insuranceProvider')) {
        patch.providerName = ''
      }

      return updatePolicy({
        id: targetPolicyId,
        fields: patch
      }).catch(() => {
        lastPersistedSignatureRef.current = ''
      })
    },
    [buildDraftPayload, dirtyFields, existingFields, resolvedPolicyId, rawText, structuredFields, updatePolicy, values]
  )

  useEffect(() => {
    if (!policyId) return
    if (hydratedPolicyIdRef.current === policyId) return

    hydratedPolicyIdRef.current = policyId

    const nextValues = inferAutoValuesFromExistingFields(existingFields ?? {})
    const nextStructuredFields = inferStructuredFieldsFromExistingFields(existingFields ?? {})
    const nextRawText = inferRawTextFromExistingFields(existingFields ?? {})
    const nextDirtyFields = new Set<DirtyKey>()

    setValues(nextValues)
    setDirtyFields(nextDirtyFields)
    setStructuredFields(nextStructuredFields)
    setRawText(nextRawText)
    setScanError(null)

    lastPersistedSignatureRef.current = createStableValueSignature({
      fields: serializeAutoDraftFields({
        existingFields,
        values: nextValues,
        dirtyFields: nextDirtyFields,
        structuredFields: nextStructuredFields,
        rawText: nextRawText
      }),
      payload: existingPayload ?? {}
    })
  }, [existingFields, existingPayload, policyId])

  useEffect(() => {
    const nextValues = mergeProfileContactInfo(values, dirtyFields, {
      email: normalizeOcrText(userProfile?.email ?? profileUser?.email),
      phone: normalizeMobileContactNumber(userProfile?.phone) ?? ''
    })

    if (nextValues === values) return

    startTransition(() => {
      setValues(nextValues)
    })
  }, [dirtyFields, profileUser?.email, userProfile?.email, userProfile?.phone, values])

  useEffect(() => {
    if (currentStep === Number(stepParam ?? 1)) return
    setStepParam(String(currentStep)).catch(() => undefined)
  }, [currentStep, setStepParam, stepParam])

  const insuranceProviderState = useMemo(() => {
    const { price, registrationType, vehicleCategoryKey, yearModel } = standardPricingState
    const standardRates = getStandardCtplRates(ctplSetting)

    if (ctplSetting === undefined) {
      return {
        options: createDisabledProviderOption('Loading CTPL pricing...'),
        helperText: 'Loading CTPL pricing configuration.'
      }
    }

    if (!structuredFields) {
      return {
        options: createDisabledProviderOption('Scan your certificate of registration to load CTPL pricing.'),
        helperText: 'Provider pricing is derived from the scanned CR year model and vehicle category.'
      }
    }

    if (!vehicleCategoryKey) {
      return {
        options: createDisabledProviderOption('OCR could not determine the vehicle category.'),
        helperText: 'Rescan the CR so the vehicle category can be matched to the CTPL tariff.'
      }
    }

    if (registrationType == null || yearModel == null) {
      return {
        options: createDisabledProviderOption('OCR could not determine if this is brand new or renewal.'),
        helperText: 'Year model is required to classify the application as brand new or renewal.'
      }
    }

    if (!standardRates) {
      return {
        options: createDisabledProviderOption('CTPL pricing is not configured yet.'),
        helperText: 'Admin setting `ctpl` is missing or hidden, so provider pricing cannot be loaded.'
      }
    }

    if (price == null) {
      return {
        options: createDisabledProviderOption(`No CTPL rate is configured for vehicle category ${vehicleCategoryKey}.`),
        helperText: `Vehicle category ${vehicleCategoryKey} was detected, but no Standard Insurance tariff is configured for it.`
      }
    }

    const registrationLabel = registrationType === 'brand-new' ? 'Brand New' : 'Renewal'
    const coverageLabel = registrationType === 'brand-new' ? '3-year coverage' : '1-year coverage'

    return {
      options: [
        {
          value: STANDARD_PROVIDER_VALUE,
          label: STANDARD_PROVIDER_LABEL,
          price,
          description: `${registrationLabel} • ${vehicleCategoryKey} • ${coverageLabel}`
        }
      ] satisfies RadioFieldOption[]
      // helperText: `${registrationLabel}.`,
    }
  }, [ctplSetting, standardPricingState, structuredFields])

  useEffect(() => {
    if (!resolvedPolicyId) return

    const fields = serializeAutoDraftFields({
      existingFields,
      values,
      dirtyFields,
      structuredFields,
      rawText
    })
    const payload = buildDraftPayload()

    if (Object.keys(fields).length === 0 && Object.keys(payload).length === 0) {
      return
    }

    const signature = createStableValueSignature({ fields, payload })

    if (signature === lastPersistedSignatureRef.current) return

    const timeoutId = window.setTimeout(() => {
      persistDraftToConvex().catch(() => undefined)
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [
    buildDraftPayload,
    dirtyFields,
    existingFields,
    persistDraftToConvex,
    rawText,
    resolvedPolicyId,
    structuredFields,
    values
  ])

  const ensureDraftPolicy = useCallback(
    async (planName: Extract<AutoInsuranceFields['planName'], 'CTPL' | 'Comprehensive'>) => {
      if (resolvedPolicyId || creatingPolicyRef.current) return resolvedPolicyId
      if (!proId || !profileUser?._id) return undefined

      creatingPolicyRef.current = true

      const nextValues: AutoFormValues = {
        ...values,
        planName
      }
      const nextDirtyFields = new Set(dirtyFields)
      nextDirtyFields.add('planName')

      try {
        const id = await createPolicy({
          proId,
          type: 'auto',
          userId: profileUser._id,
          status: 'pending',
          planName,
          providerName: getProviderNameFromValue(nextValues.insuranceProvider),
          visible: true,
          fields: serializeAutoDraftFields({
            existingFields,
            values: nextValues,
            dirtyFields: nextDirtyFields,
            structuredFields,
            rawText
          }),
          payload: buildDraftPayload({
            values: nextValues,
            structuredFields
          })
        })

        setCreatedPolicyId(id)
        hydratedPolicyIdRef.current = id
        await setRecordIdParam(id)
        await persistDraftToConvex({
          policyId: id,
          values: nextValues,
          dirtyFields: nextDirtyFields,
          structuredFields,
          rawText
        }).catch(() => undefined)
        return id
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Failed to create auto insurance draft.')
        return undefined
      } finally {
        creatingPolicyRef.current = false
      }
    },
    [
      buildDraftPayload,
      createPolicy,
      dirtyFields,
      existingFields,
      persistDraftToConvex,
      proId,
      profileUser,
      rawText,
      resolvedPolicyId,
      setRecordIdParam,
      structuredFields,
      values
    ]
  )

  const handleScan = async (e?: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e?.preventDefault()
    setScanError(null)

    if (!crSelectedItem) {
      const message = 'Select a certificate of registration image first.'
      setScanError(message)
      onError(message)
      return
    }

    if (isCrPdf) {
      const message = 'OCR currently supports image uploads only. Convert the PDF to an image and try again.'
      setScanError(message)
      onError(message)
      return
    }

    if (!scanFile) {
      const message = 'The selected image could not be prepared for OCR.'
      setScanError(message)
      onError(message)
      return
    }

    try {
      // Step 1: Extract text using OCR
      const extractedText = (await extractTextFromFile(scanFile)) as string

      if (!extractedText.trim()) {
        throw new Error('No text was detected in the selected image.')
      }

      // Store raw text
      setRawText(extractedText)

      // Step 2: Parse the text into structured data using Gemini
      const parsed = (await parseText(extractedText)) as VehicleRegistration
      const nextValues = mergeParsedPersonalInfo(values, dirtyFields, parsed)

      startTransition(() => {
        setStructuredFields(parsed)
        setValues(nextValues)
      })
      persistDraftToConvex({
        values: nextValues,
        structuredFields: parsed,
        rawText: extractedText
      }).catch(() => undefined)
      setScanError(null)
      onSuccess('OCR Complete.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process document'
      setScanError(errorMessage)
      onError(errorMessage)
      console.error(err)
    }
  }

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      let targetPolicyId = resolvedPolicyId

      if (!targetPolicyId && (values.planName === 'CTPL' || values.planName === 'Comprehensive')) {
        targetPolicyId = await ensureDraftPolicy(values.planName)
      }

      if (!targetPolicyId) {
        throw new Error('Missing policy draft.')
      }

      await persistDraftToConvex({
        policyId: targetPolicyId
      })

      await updatePolicy({
        id: targetPolicyId,
        fields: {
          status: 'active'
        }
      })

      onSuccess('Auto insurance application submitted.')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to submit auto insurance application.')
    } finally {
      setIsSubmitting(false)
    }
  }, [ensureDraftPolicy, isSubmitting, persistDraftToConvex, resolvedPolicyId, updatePolicy, values.planName])

  // const planName = values.planName as AutoPlan | undefined

  const validateRequiredField = useMemo(() => {
    return (field: FieldConfig<AutoInsuranceFields>, value: unknown) => {
      if (!field.required) return true
      if (field.type === 'checkbox') return value === true
      if (field.type === 'file') {
        return typeof value === 'string' && value.trim().length > 0
      }
      const v = typeof value === 'string' ? value.trim() : String(value ?? '').trim()
      if (!v) return false
      if (field.type === 'email') return v.includes('@')
      return true
    }
  }, [])

  const groupValidity = useMemo(() => {
    return fieldGroups.map((group) => {
      const invalid = group.fields.some((field) => {
        const key = field.name as DirtyKey
        return !validateRequiredField(field, values[key])
      })
      return !invalid
    })
  }, [fieldGroups, validateRequiredField, values])

  const missingRequiredFields = useMemo(() => {
    const missing: Array<{
      groupTitle: string
      label: string
      name: DirtyKey
    }> = []

    for (const group of autoInsFields) {
      for (const field of group.fields) {
        if (!field.required) continue
        const fieldName = field.name as DirtyKey
        const fieldValue = values[fieldName]

        if (!validateRequiredField(field, fieldValue)) {
          missing.push({
            groupTitle: group.title,
            label: field.label ?? String(field.name),
            name: fieldName
          })
        }
      }
    }

    return missing
  }, [validateRequiredField, values])

  const { toggle } = useToggle()

  return (
    <main className='md:flex items-start'>
      <Stepper
        currentStep={currentStep}
        isLoading={isCrUploading || isSubmitting}
        initialStep={currentStep}
        onStepChange={(step) => {
          setStepParam(String(clampStep(step, totalSteps))).catch(() => undefined)
        }}
        getNextDisabled={(_step, isLastStep) => isLastStep && groupValidity.some((v) => !v)}
        onFinalStepCompleted={() => {
          handleSubmit().catch(() => undefined)
        }}
        onNextAttempt={(step) => {
          // Stepper includes an extra "completion" state after the final <Step />.
          // We only use onNextAttempt to mark fields dirty as users progress.
          if (step >= 1 && step <= fieldGroups.length) {
            const group = fieldGroups[step - 1]
            const requiredKeys = group.fields.filter((f) => f.required).map((f) => f.name as DirtyKey)
            setDirtyFields((prev) => {
              const next = new Set(prev)
              for (const k of requiredKeys) next.add(k)
              return next
            })
            persistDraftToConvex().catch(() => undefined)
            return true
          }

          persistDraftToConvex().catch(() => undefined)
          return true
        }}
        backButtonText='Previous'
        nextButtonText='Next'
        nextButtonProps={{
          disabled: isCrUploading || isSubmitting,
          'aria-busy': isCrUploading || isSubmitting
        }}
        indicatorVariant='outline'
        getStepValidation={(step) => {
          if (step <= fieldGroups.length) {
            const group = fieldGroups[step - 1]
            const keys = group.fields.map((f) => f.name as DirtyKey)
            const hasDirty = keys.some((k) => dirtyFields.has(k))

            if (groupValidity[step - 1]) return 'valid'
            return hasDirty ? 'invalid' : 'unknown'
          }
          return 'unknown'
        }}
        contentClassName={cn('md:min-w-xs rounded-t-xs portrait:rounded-b-xs rounded-br-xs', {
          'md:min-w-xs ': structuredFields
        })}
        contentContainerClassName={cn('rounded-t-xs rounded-br-xs portrait:rounded-b-xs border-r-0', {
          '': structuredFields
        })}>
        {fieldGroups.map((group) => {
          const hasFileField = group.fields.some((f) => f.type === 'file')

          const stepGroup: FieldGroup<AutoInsuranceFields> = {
            ...group,
            fields: group.fields.map<FieldConfig<AutoInsuranceFields>>((field) => {
              const key = field.name as DirtyKey
              const raw = values[key]
              const isDirty = dirtyFields.has(key)

              const markDirtyAndSet = (next: unknown) => {
                const normalizedNext =
                  typeof next === 'string' || typeof next === 'number' || typeof next === 'boolean'
                    ? (next as never)
                    : (String(next) as never)

                setDirtyFields((prev) => {
                  const n = new Set(prev)
                  n.add(key)
                  return n
                })

                setValues((prev) => ({
                  ...prev,
                  [key]: normalizedNext
                }))

                if (key === 'planName' && (normalizedNext === 'CTPL' || normalizedNext === 'Comprehensive')) {
                  ensureDraftPolicy(normalizedNext).catch(() => undefined)
                }
              }

              if (field.type === 'select') {
                const value = typeof raw === 'string' || typeof raw === 'number' ? raw : undefined
                const isInvalid = isDirty && field.required && String(value ?? '').trim() === ''

                const onChange: FieldValidator = (next) => {
                  markDirtyAndSet(next)
                  return true
                }

                return {
                  ...field,
                  value,
                  error: isInvalid ? 'Required' : false,
                  validators: {
                    onChange
                  }
                }
              }

              if (field.type === 'file') {
                // We keep the fancy upload UI below; this schema field is used
                // only for required tracking + final review.
                const trimmed = typeof raw === 'string' ? raw.trim() : ''
                const isInvalid = isDirty && field.required && trimmed.length === 0

                const onChange: FieldValidator = (next) => {
                  markDirtyAndSet(next)
                  return true
                }

                return {
                  ...field,
                  value: typeof raw === 'string' ? raw : undefined,
                  error: isInvalid ? 'Required' : false,
                  validators: {
                    onChange
                  }
                }
              }

              if (field.type === 'checkbox') {
                // Auto schema currently has no checkbox fields. Keep it unchanged for type safety.
                return field
              }

              if (field.type === 'date') {
                const value = typeof raw === 'string' ? raw : undefined
                const isInvalid = isDirty && field.required && String(value ?? '').trim() === ''

                return {
                  ...field,
                  value,
                  error: isInvalid ? 'Required' : false,
                  onDateChange: (next) => {
                    markDirtyAndSet(next ?? '')
                  },
                  validators: {
                    onChange: (next) => {
                      markDirtyAndSet(next)
                      return true
                    }
                  }
                }
              }

              if (field.type === 'radio') {
                const options = field.name === 'insuranceProvider' ? insuranceProviderState.options : field.options
                const helperText =
                  field.name === 'insuranceProvider' ? insuranceProviderState.helperText : field.helperText
                const value = typeof raw === 'string' || typeof raw === 'number' ? String(raw) : undefined
                const enabledProviderValues = new Set(
                  options.filter((option) => !option.value).map((option) => option.value)
                )
                const normalizedValue =
                  field.name === 'insuranceProvider' && value && !enabledProviderValues.has(value) ? undefined : value
                const isInvalid = isDirty && field.required && String(value ?? '').trim() === ''

                const onChange: FieldValidator = (next) => {
                  markDirtyAndSet(next)
                  return true
                }

                return {
                  ...field,
                  options,
                  helperText,
                  value: normalizedValue,
                  defaultValue: normalizedValue,
                  error: isInvalid ? 'Required' : false,
                  onValueChange: (next) => {
                    markDirtyAndSet(next)
                  },
                  validators: {
                    onChange
                  }
                }
              }

              // fallback (not currently used by Auto schema)
              const value = typeof raw === 'string' || typeof raw === 'number' ? raw : undefined
              const trimmed = String(value ?? '').trim()
              const isInvalid = isDirty && field.required && trimmed.length === 0

              const onChange: FieldValidator = (next) => {
                markDirtyAndSet(next)
                return true
              }

              return {
                ...field,
                value,
                error: isInvalid ? 'Required' : false,
                validators: {
                  onChange
                }
              }
            })
          }

          if (!hasFileField) {
            return <StepFieldGroup key={group.title} group={stepGroup} />
          }

          return (
            <StepFieldGroup
              key={group.title}
              group={stepGroup}
              renderField={(field) => {
                if (field.type !== 'file') return null
                // Custom CR upload UI, still driven by this step.
                return (
                  <div key={String(field.name)} className='space-y-4'>
                    {field.type === 'file' && (
                      <LabelSection
                        type={'file'}
                        label={field.label}
                        error={field.error}
                        required={field.required}
                        helperText={field.helperText}
                        htmlFor={`${field.name}-${id}`}
                      />
                    )}
                    <div className='space-y-2'>
                      <input
                        type='file'
                        ref={crInputRef}
                        name={field.name}
                        accept={crAccept}
                        id={`${field.name}-${id}`}
                        className='hidden sr-only'
                        onChange={(e) => {
                          setDirtyFields((prev) => {
                            const next = new Set(prev)
                            next.add('crImage')
                            return next
                          })
                          setScanError(null)
                          handleCrInputSelect(e)
                        }}
                      />

                      <button
                        ref={crDropRef}
                        type='button'
                        onClick={pickCrFile}
                        onDragEnter={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsCrDragActive(true)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsCrDragActive(true)
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          e.stopPropagation()

                          const related = e.relatedTarget
                          if (related instanceof Node) {
                            if (e.currentTarget.contains(related)) return
                          }

                          setIsCrDragActive(false)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsCrDragActive(false)

                          setDirtyFields((prev) => {
                            const next = new Set(prev)
                            next.add('crImage')
                            return next
                          })
                          setScanError(null)

                          // Replace current CR (this field is single-file).
                          handleCrFiles()
                        }}
                        className={cn(
                          'group w-full rounded-2xl border-[0.33px] outline-none text-left transition-colors',
                          'min-h-20 px-5 py-4.5 md:py-7 h-fit',
                          'bg-foreground/3 border-foreground/45',
                          isCrDragActive ? 'border-primary-hover bg-primary-hover/10' : 'hover:border-foreground/40',
                          { hidden: crSelectedItem }
                        )}
                        aria-label='Upload certificate of registration'>
                        <div className='flex flex-col items-center justify-center gap-4 font-figtree'>
                          <div className='text-sm md:text-base tracking-tight font-semibold'>
                            {isCrUploading ? 'Uploading…' : crSelectedItem ? 'Replace image' : 'Drag & drop your image'}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {crSelectedItem ? crSelectedItem.name : 'or click to browse (camera / photos)'}
                          </div>
                        </div>
                      </button>
                    </div>

                    {dirtyFields.has('crImage') && !groupValidity[1] ? (
                      <p className='text-sm text-rose-500 dark:text-orange-300' aria-live='polite'>
                        Please select a file.
                      </p>
                    ) : null}

                    <ProtapViewTransition
                      name='auto-cr-preview'
                      enter='vt-enter'
                      exit='vt-exit'
                      update='vt-update'
                      share='vt-share'
                      default='vt-default'>
                      {crPreviewUrl ? (
                        <div
                          key='preview'
                          className='rounded-3xl border border-foreground/30 bg-background/30 overflow-hidden relative'>
                          {isCrImage ? (
                            <Image
                              priority
                              width={600}
                              height={700}
                              src={crPreviewUrl}
                              alt='Certificate of Registration preview'
                              className='w-full h-64 object-cover'
                            />
                          ) : null}
                          {isCrPdf ? (
                            <embed src={crPreviewUrl} type='application/pdf' className='w-full h-80 bg-white' />
                          ) : null}
                          <div className='p-3 flex items-center justify-between'>
                            <span className='text-xs text-muted-foreground truncate pr-3'>
                              {crSelectedItem ? `${crSelectedItem.name} • ${formatFileSize(crSelectedItem.size)}` : ''}
                            </span>
                            <Button
                              type='button'
                              variant='default'
                              className='absolute top-4 right-4 bg-black/30 text-white opacity-100 hover:bg-mac-red/70 hover:text-white'
                              size='sm'
                              onClick={() =>
                                startTransition(() => {
                                  setDirtyFields((prev) => {
                                    const next = new Set(prev)
                                    next.add('crImage')
                                    return next
                                  })
                                  setValues((prev) => {
                                    const next = { ...prev }
                                    delete next.crImage
                                    return next
                                  })
                                  clearCrSelected()
                                })
                              }>
                              <Icon name='close' className='size-4' />
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              className='hidden opacity-100 text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-100/5 _hover:bg-indigo-500 hover:bg-indigo-600 dark:hover:text-indigo-300 rounded-lg'
                              size='sm'
                              onClick={toggle}>
                              <span>Swap</span>
                              <Icon name='arrow-right' className='size-4' />
                            </Button>
                            <Button
                              type='button'
                              variant='default'
                              className='opacity-100 text-white dark:text-indigo-500 bg-indigo-500 dark:bg-indigo-100 hover:bg-indigo-600 dark:hover:text-indigo-600 rounded-lg font-figtree'
                              size='sm'
                              disabled={!crSelectedItem || isScanning || parsing}
                              onClick={handleScan}>
                              <span>
                                {isCrPdf
                                  ? 'Images only'
                                  : isScanning
                                    ? 'Scanning'
                                    : parsing
                                      ? 'Parsing'
                                      : structuredFields
                                        ? 'Scanned'
                                        : 'Scan Image'}
                              </span>
                              <Icon
                                name={isScanning || parsing ? 'spinner-ring' : structuredFields ? 'check' : 'file'}
                                className='size-4'
                              />
                            </Button>
                          </div>
                          {isCrPdf ? (
                            <p className='px-3 pb-3 text-xs text-amber-600'>
                              PDFs can be attached here, but OCR scanning currently supports image uploads only.
                            </p>
                          ) : null}
                          {scanError ? (
                            <p
                              className={cn('px-3 pb-3 text-xs', {
                                'text-amber-600': scanError.toLowerCase().includes('billing'),
                                'text-red-600': !scanError.toLowerCase().includes('billing')
                              })}>
                              {scanError}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </ProtapViewTransition>
                  </div>
                )
              }}
            />
          )
        })}

        <Step>
          <div id='final-step-container' className='space-y-1 py-1 px-1 h-fit border-b-[0.33px] border-foreground/30'>
            <h2
              id='final-step-title'
              className={cn('font-semibold tracking-tight font-figtree text-lg', {
                'text-orange-400': missingRequiredFields.length !== 0
              })}>
              {missingRequiredFields.length === 0 ? (
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
            {missingRequiredFields.length === 0 ? (
              <p>Click submit to complete.</p>
            ) : (
              <>
                <p className='opacity-70 text-sm'>Complete the required fields below:</p>
                <ul className='list-disc pl-5 space-y-1 text-base'>
                  {missingRequiredFields.map((f) => (
                    <li key={`${f.groupTitle}:${f.name}`}>
                      <span className='font-medium'>{f.groupTitle}:</span> {f.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Step>
      </Stepper>

      <div className='w-full h-fit'>
        <ProtapViewTransition
          name='auto-cr-form'
          enter='vt-enter'
          exit='vt-exit'
          update='vt-update'
          share='vt-share'
          default='vt-default'>
          {structuredFields ? (
            <CRForm key={structuredFields ? createStableValueSignature(structuredFields) : 'form'} ocrData={structuredFields} />
          ) : (
            <div key='placeholder' className='relative border-[0.33px] border-foreground/60 rounded-t-xs rounded-b-4xl'>
              <Image
                alt='haze'
                src='https://res.cloudinary.com/dx0heqhhe/image/upload/v1774529074/haze-tall_yj2d2g.webp'
                width={600}
                height={400}
                className='aspect-auto rounded-b-4xl'
              />
            </div>
          )}
        </ProtapViewTransition>
      </div>
    </main>
  )
}
