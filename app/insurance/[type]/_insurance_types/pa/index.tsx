import { ProtapViewTransition } from '@/components/view-transition'
import { api } from '@/convex/_generated/api'
import { useAuthCtx } from '@/ctx/auth'
import { Icon } from '@/lib/icons'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useMemo, useRef } from 'react'
import { Header } from '../components'
import { PAActivePolicy } from './pa-active-policy'
import { PAForm } from './pa-form'

export const PAContent = () => {
  const { user } = useAuthCtx()
  const proId = user?.uid

  const profileUserQueryParams = useMemo(() => (proId ? { proId } : 'skip'), [proId])
  const policyQueryParams = useMemo(() => (proId ? { proId, type: 'pa' as const } : 'skip'), [proId])

  const profileUser = useQuery(api.users.q.getByProId, profileUserQueryParams)
  const pa = useQuery(api.insurancePolicies.q.listByProIdAndType, policyQueryParams)

  const createPolicy = useMutation(api.insurancePolicies.m.create)
  const createAttemptedRef = useRef(false)

  useEffect(() => {
    if (!proId) return
    if (!profileUser?._id) return
    if (pa?.length && pa.length > 0) return
    if (createAttemptedRef.current) return

    createAttemptedRef.current = true

    createPolicy({
      proId,
      type: 'pa',
      userId: profileUser._id,
      status: 'pending',
      planName: 'Personal Accident Protection',
      providerName: 'Mercantile Insurance',
      visible: true
    })
      .then(() => undefined)
      .catch(() => {
        // allow a retry if the mutation fails
        createAttemptedRef.current = false
      })
  }, [createPolicy, pa, proId, profileUser?._id])

  type View = 'loading' | 'active' | 'form'
  const status = pa?.[0]?.status

  const view: View = proId && typeof pa === 'undefined' ? 'loading' : status === 'active' ? 'active' : 'form'
  const policy = pa?.[0]

  return (
    <div className='border-t-[0.33px] border-foreground/20 md:border-t-0 bg-background relative'>
      <Header icon='asterisk' title='Personal Accident Insurance' />
      <ProtapViewTransition
        name='pa-insurance-view'
        enter='vt-enter'
        exit='vt-exit'
        update='vt-update'
        share='vt-share'
        default='vt-default'>
        {view === 'loading' ? (
          <div key='loading' className='p-6 text-sm text-muted-foreground flex items-center'>
            <span>Loading policy</span>
            <Icon name='spinners-ring' className='size-4 text-orange-300' />
          </div>
        ) : view === 'active' ? (
          <PAActivePolicy key='active' policy={policy} isTransitioning={false} />
        ) : (
          <PAForm key='form' policyId={policy?._id} existingFields={policy?.fields} />
        )}
      </ProtapViewTransition>
    </div>
  )
}
