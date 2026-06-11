import { ProtapViewTransition } from '@/components/view-transition'
import { useAuthCtx } from '@/ctx/auth'
import { Icon, IconName } from '@/lib/icons'
import { api } from '@@/convex/_generated/api'
import { Doc, Id } from '@@/convex/_generated/dataModel'
import { InsurancePolicyFieldValue, InsurancePolicyType } from '@@/convex/insurancePolicies/d'
import { useMutation, useQuery } from 'convex/react'
import { parseAsString, useQueryState } from 'nuqs'
import { ComponentType, useEffect, useMemo, useRef } from 'react'
import { Header } from './components'

export type ActivePolicyProps = {
  policy: Doc<'insurancePolicies'> | undefined
  isTransitioning?: boolean
}
export type PolicyFormProps = {
  policyId?: Id<'insurancePolicies'>
  existingFields?: Record<string, InsurancePolicyFieldValue> | undefined
  existingPayload?: Record<string, unknown> | undefined
}
interface InsuranceIndexProps {
  type: InsurancePolicyType
  label: string
  icon: IconName
  activePolicy: ComponentType<ActivePolicyProps>
  policyForm: ComponentType<PolicyFormProps>
}
export const InsuranceIndex = ({
  type,
  label,
  icon,
  activePolicy: ActivePolicy,
  policyForm: PolicyForm
}: InsuranceIndexProps) => {
  const { user } = useAuthCtx()
  const proId = user?.uid
  const [recordIdParam, setRecordIdParam] = useQueryState('record', parseAsString)

  const profileUserQueryParams = useMemo(() => (proId ? { proId } : 'skip'), [proId])
  const policyQueryParams = useMemo(() => (proId ? { proId, type } : 'skip'), [proId, type])

  const profileUser = useQuery(api.users.q.getByProId, profileUserQueryParams)
  const insurance = useQuery(api.insurancePolicies.q.listByProIdAndType, policyQueryParams)

  const createPolicy = useMutation(api.insurancePolicies.m.create)
  const createAttemptedRef = useRef(false)

  useEffect(() => {
    if (type === 'auto') return
    if (!proId) return
    if (!profileUser?._id) return
    if (insurance?.length && insurance.length > 0) return
    if (createAttemptedRef.current) return

    createAttemptedRef.current = true

    createPolicy({
      proId,
      type,
      userId: profileUser._id,
      status: 'pending',
      planName: label,
      providerName: type === 'pa' ? 'Mercantile Insurance' : '',
      visible: true
    })
      .then(() => undefined)
      .catch(() => {
        // allow a retry if the mutation fails
        createAttemptedRef.current = false
      })
  }, [createPolicy, insurance, label, proId, profileUser?._id, type])

  type View = 'loading' | 'active' | 'form'
  const policy = useMemo(() => {
    if (!insurance || insurance.length === 0) {
      return undefined
    }

    if (!recordIdParam) {
      return insurance[0]
    }

    return insurance.find((item: Doc<'insurancePolicies'>) => item._id === recordIdParam) ?? insurance[0]
  }, [insurance, recordIdParam])

  useEffect(() => {
    if (!policy?._id) return
  }, [policy?._id, recordIdParam, setRecordIdParam])

  const status = policy?.status

  const view: View =
    proId && typeof insurance === 'undefined' ? 'loading' : status === 'active' ? 'active' : 'form'

  return (
    <div className='border-t-[0.33px] border-foreground/40 md:border-t-[0.33px] bg-background relative  h-[calc(100lvh-48px)] sm:h-[calc(100lvh-48px)] md:h-[calc(100lvh-64px)] lg:h-[calc(100lvh-64px)] overflow-scroll pb-12'>
      <Header icon={icon} title={label} />
      <ProtapViewTransition
        name='insurance-view'
        enter='vt-enter'
        exit='vt-exit'
        update='vt-update'
        share='vt-share'
        default='vt-default'>
        {view === 'loading' ? (
          <div key='loading' className='p-6 text-sm text-muted-foreground flex items-center justify-center space-x-2'>
            <span>Loading Insurance Services...</span>
            <Icon name='spinners-ring' className='size-4 text-orange-400' />
          </div>
        ) : view === 'active' ? (
          <ActivePolicy key='active' policy={policy} isTransitioning={false} />
        ) : (
          <PolicyForm
            key='form'
            policyId={policy?._id}
            existingFields={policy?.fields}
            existingPayload={policy?.payload as Record<string, unknown> | undefined}
          />
        )}
      </ProtapViewTransition>
    </div>
  )
}
