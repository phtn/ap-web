'use client'

import { InsuranceIndex } from './_insurance_types'
import { AutoActivePolicy } from './_insurance_types/auto/auto-active-policy'
import { AutoForm } from './_insurance_types/auto/auto-form'
import { PAContent } from './_insurance_types/pa'
import { PAActivePolicy } from './_insurance_types/pa/pa-active-policy'
import { PAForm } from './_insurance_types/pa/pa-form'

interface InsuranceContentProps {
  type: string
}
export const InsuranceContent = ({ type }: InsuranceContentProps) => {
  switch (type) {
    case 'pa':
      return (
        <InsuranceIndex
          type='pa'
          icon='shield-cross'
          label='Personal Accident Insurance'
          activePolicy={PAActivePolicy}
          policyForm={PAForm}
        />
      )
    case 'auto':
      return (
        <InsuranceIndex
          type='auto'
          icon='re-up.ph'
          label='Auto Insurance'
          activePolicy={AutoActivePolicy}
          policyForm={AutoForm}
        />
      )
    default:
      return <PAContent />
  }
}
