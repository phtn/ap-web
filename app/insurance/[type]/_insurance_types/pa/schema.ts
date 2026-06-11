import { FieldGroup } from '@/components/form/schema'
import { createElement } from 'react'

export const HAZARDOUS_OCCUPATION_EXAMPLES = [
  'Firemen',
  'Fishermen',
  'Miners',
  'Sailors',
  'Military',
  'Divers',
  'Racers',
  'Logging workers',
  'Circus workers',
  'Stuntmen',
  'Quarry workers',
  'Sawmill workers',
  'Loggers',
  'Worker handling/manufacturing explosives',
  'Worker handling/manufacturing nuclear materials',
  'Worker exposed to hazardous chemicals'
] as const

const hazardousOccupationHelperText = createElement(
  'div',
  { className: 'space-y-1' },
  createElement('div', { className: 'leading-tight' }, 'Check if your occupation involves any of the following:'),
  createElement(
    'div',
    { className: 'flex flex-wrap gap-2 py-2.5' },
    ...HAZARDOUS_OCCUPATION_EXAMPLES.map((label) =>
      createElement(
        'span',
        {
          key: label,
          className:
            'inline-flex items-center rounded-md border-[0.33px] dark:border-orange-200/30 dark:hover:border-orange-100/50 dark:hover:text-orange-100 bg-orange-900/10 text-orange-700 dark:text-orange-200 px-2 py-1 text-xs md:text-sm tracking-tight leading-none'
        },
        label
      )
    )
  )
)

export interface PAInsuranceField {
  fullName: string
  email: string
  birthDate: string
  addressLine1: string
  tin: string
  phone: string
  occupation: string
  designatedPosition: string
  hazardousOccupation: boolean
  beneficiaryFullName: string
  beneficiaryContactNumber: string
  beneficiaryRelationship: string
}

export const paInsFields: FieldGroup<PAInsuranceField>[] = [
  {
    title: 'Basic Info',
    fields: [
      {
        name: 'fullName',
        type: 'text',
        autoComplete: 'name',
        label: 'Full Name',
        placeholder: 'Enter your Full Name',
        helperText: 'First Middle Last',
        required: true
      },
      {
        name: 'email',
        type: 'email',
        autoComplete: 'email',
        label: 'Email',
        placeholder: 'Email address',
        helperText: 'Your Email address',
        required: true
      },
      {
        name: 'birthDate',
        type: 'date',
        autoComplete: 'birthday',
        label: 'Birth Date',
        placeholder: 'MM/DD/YYYY',
        helperText: 'Your date of birth',
        required: true
      }
    ]
  },
  {
    title: 'Contact Details',
    fields: [
      {
        name: 'addressLine1',
        type: 'text',
        autoComplete: 'addressLine1, city',
        label: 'Address',
        placeholder: 'Enter your full address',
        helperText: 'House/Unit No., Street, Barangay, City, Province',
        required: true
      },
      {
        name: 'tin',
        type: 'text',
        autoComplete: 'off',
        label: 'TIN Number',
        placeholder: 'Enter your TIN',
        helperText: 'Tax Identification Number',
        required: true
      },
      {
        name: 'phone',
        type: 'tel',
        autoComplete: 'phone',
        label: 'Contact Number',
        placeholder: '0915XXXXXXX',
        helperText: 'Mobile number',
        required: true
      }
    ]
  },
  {
    title: 'Employment',
    fields: [
      {
        name: 'occupation',
        type: 'text',
        autoComplete: 'organization-title',
        label: 'Occupation',
        placeholder: 'Your occupation',
        helperText: 'Your primary occupation',
        required: true
      },
      {
        name: 'designatedPosition',
        type: 'text',
        autoComplete: 'organization-title',
        label: 'Designated Position',
        placeholder: 'Your position / role',
        helperText: 'Your position at work',
        required: true
      },
      {
        name: 'hazardousOccupation',
        type: 'checkbox',
        label: 'Occupation Check',
        helperText: hazardousOccupationHelperText,
        required: false,
        defaultValue: false
      }
    ]
  },
  {
    title: 'Beneficiary',
    fields: [
      {
        name: 'beneficiaryFullName',
        type: 'text',
        autoComplete: 'name',
        label: 'Beneficiary Full Name',
        placeholder: 'Enter beneficiary full name',
        helperText: 'First Middle Last',
        required: true
      },
      {
        name: 'beneficiaryContactNumber',
        type: 'tel',
        autoComplete: 'tel',
        label: 'Beneficiary Contact Number',
        placeholder: 'e.g. 09XXXXXXXXX',
        helperText: 'Mobile number',
        required: true
      },
      {
        name: 'beneficiaryRelationship',
        type: 'text',
        autoComplete: 'off',
        label: 'Relationship',
        placeholder: 'e.g. Spouse, Parent, Sibling',
        helperText: 'Relationship to the beneficiary',
        required: true
      }
    ]
  }
]
