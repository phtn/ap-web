import { FieldGroup } from '@/components/form/schema'

interface AutoInsuranceFields {
  planName: 'CTPL' | 'Comprehensive'
  crImage: string
  firstName: string
  middleName?: string
  lastName: string
  city: string
  postalCode: string
  email: string
  phone: string
  insuranceProvider: string
}

export const autoInsFields: FieldGroup<AutoInsuranceFields>[] = [
  {
    title: 'Insurance Package',
    fields: [
      {
        name: 'planName',
        type: 'select',
        options: [
          {
            value: 'CTPL',
            label: 'CTPL',
            iconStyle: 'text-mac-blue',
            icon: 'squircle',
          },
          {
            value: 'Comprehensive',
            label: 'Comprehensive',
            iconStyle: 'text-mac-gray/50',
            icon: 'squircle',
            disabled: true,
          },
        ],
        label: 'Type of Coverage',
        placeholder: 'Select coverage type',
        helperText: 'Select Coverage',
        required: true,
      },
    ],
  },
  {
    title: 'Upload Document',
    fields: [
      {
        name: 'crImage',
        type: 'file',
        label: 'Certificate of Registration',
        placeholder: 'Upload a clear photo',
        helperText: 'A clear photo of your Vehicle Registration (CR).',
        required: true,
      },
    ],
  },
  {
    title: 'Personal Information',
    fields: [
      {
        name: 'firstName',
        type: 'text',
        label: 'First Name',
        placeholder: 'Enter your first name',
        helperText: 'Your given name',
        required: true,
      },
      {
        name: 'middleName',
        type: 'text',
        label: 'Middle Name',
        placeholder: 'Enter your middle name',
        helperText: 'Your middle name (optional)',
        required: false,
      },
      {
        name: 'lastName',
        type: 'text',
        label: 'Last Name',
        placeholder: 'Enter your last name',
        helperText: 'Your family name',
        required: true,
      },
      {
        name: 'city',
        type: 'text',
        label: 'City',
        placeholder: 'Enter your city',
        helperText: 'Your city of residence',
        required: true,
      },
      {
        name: 'postalCode',
        type: 'text',
        label: 'Postal Code',
        placeholder: 'Enter your postal code',
        helperText: 'Your postal or zip code',
        required: true,
      },
    ],
  },
  {
    title: 'Contact Information',
    fields: [
      {
        name: 'email',
        type: 'email',
        autoComplete: 'email',
        label: 'Email',
        placeholder: 'Email address',
        helperText: 'Your email address',
        required: true,
      },
      {
        name: 'phone',
        type: 'tel',
        autoComplete: 'tel',
        label: 'Phone Number',
        placeholder: '09XXXXXXXXX',
        helperText: 'Your mobile number',
        required: true,
      },
    ],
  },
  {
    title: 'Insurance Providers',
    fields: [
      {
        name: 'insuranceProvider',
        type: 'radio',
        label: 'Select Provider',
        helperText: '',
        placeholder: 'Select a provider',
        required: true,
        options: [
          {
            value: 'standard-insurance',
            label: 'Standard Insurance',
            price: 600,
            description: 'Basic coverage with standard benefits',
          },
          {
            value: 'provider2',
            label: 'Provider B',
            price: 750,
            description: 'Enhanced coverage with additional benefits',
          },
          {
            value: 'provider3',
            label: 'Provider C',
            price: 1000,
            description: 'Premium coverage with comprehensive benefits',
          },
        ],
      },
    ],
  },
]
