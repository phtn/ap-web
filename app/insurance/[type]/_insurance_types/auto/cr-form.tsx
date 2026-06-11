'use client'

import { EditableCell } from '@/components/ui/editable-cell'
import Image from 'next/image'
import { useState } from 'react'
import { VehicleRegistration } from '../types'

// Initial data state
const INITIAL_DATA = {
  fieldOffice: '',
  chiefOffice: '',
  officeCode: '',
  crNo: '',
  date: '',
  plateNo: '',
  engineNo: '',
  chassisNo: '',
  vin: '',
  fileNo: '',
  vehicleType: '',
  vehicleCategory: '',
  makeBrand: '',
  capacity: '',
  color: '',
  fuel: '',
  classification: '',
  bodyType: '',
  series: '',
  grossWeight: '',
  netWeight: '',
  yearModel: '',
  yearRebuilt: '',
  displacement: '',
  maxPower: '',
  ownerName: '',
  ownerAddress: '',
  encumberedTo: '',
  firstRegDetails: '',
  orNo: '',
  orDate: '',
  amount: '',
  remarks: '',
  by: '',
  office: ''
}

type FormData = typeof INITIAL_DATA

interface CertificateOfRegistrationFormProps {
  ocrData?: VehicleRegistration | null
}

// Map VehicleRegistration fields to CR form fields
function mapOcrDataToForm(ocrData: VehicleRegistration): Partial<FormData> {
  return {
    fieldOffice: ocrData.fieldOffice || '',
    officeCode: ocrData.officeCode || '',
    crNo: ocrData.certificateNumber || '',
    date: ocrData.dateOfIssue || '',
    plateNo: ocrData.plateNumber || '',
    engineNo: ocrData.engineNumber || '',
    chassisNo: ocrData.chassisNumber || '',
    vin: ocrData.vin || 'N/A',
    fileNo: ocrData.fileNumber || '',
    vehicleType: ocrData.vehicleType || '',
    vehicleCategory: ocrData.vehicleCategory || '',
    makeBrand: ocrData.makeBrand || '',
    capacity: ocrData.passengerCapacity || '',
    color: ocrData.color || '',
    fuel: ocrData.typeOfFuel || '',
    classification: ocrData.classification || '',
    bodyType: ocrData.bodyType || '',
    series: ocrData.series || '',
    grossWeight: ocrData.grossWeight || '',
    netWeight: ocrData.netWeight || 'N/A',
    yearModel: ocrData.yearModel || '',
    yearRebuilt: ocrData.yearRebuilt || 'N/A',
    displacement: ocrData.pistonDisplacement || '',
    maxPower: ocrData.maxPower || 'N/A',
    ownerName: ocrData.ownerName || '',
    ownerAddress: ocrData.ownerAddress || '',
    encumberedTo: ocrData.encumberedTo || 'N/A',
    firstRegDetails: ocrData.detailsOfFirstRegistration || '',
    orNo: ocrData.orNumber || '',
    orDate: ocrData.orDate || '',
    amount: ocrData.amount || '',
    remarks: ocrData.remarks || '',
    by: ocrData.by || '',
    office: ocrData.office || ''
  }
}

export function CRForm({ ocrData }: CertificateOfRegistrationFormProps) {
  const [data, setData] = useState<FormData>(() => ({
    ...INITIAL_DATA,
    ...(ocrData ? mapOcrDataToForm(ocrData) : {})
  }))

  const updateField = (field: keyof typeof INITIAL_DATA) => (value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className='h-fit overflow-y-scroll w-full md:max-w-5xl md:px-6 px-3 bg-white text-black border-[0.33px] border-foreground/60 rounded-xs shadow-xl overflow-scroll print:shadow-none min-w-0 pb-6'>
      {/* Header Section */}
      <div className='flex flex-col items-center p-4 relative'>
        <div className='absolute md:left-8 -left-4 -top-3 md:top-8 scale-50 md:scale-100'>
          <Image src='/svg/dot.svg' alt='dot' width={50} height={50} />
        </div>
        <div className='absolute md:right-8 -right-4 -top-3  md:top-8 scale-50 md:scale-100'>
          <Image src='/svg/lto.svg' alt='lto' width={50} height={50} />
        </div>

        <div className='text-center space-y-0 -mt-2 md:mt-1'>
          <h4 className='text-xs md:text-sm font-serif md:font-medium tracking-wide text-stone-500'>
            Republic of the Philippines
          </h4>
          <h2 className='md:block hidden text-xs md:font-medium uppercase tracking-wide'>
            Department of Transportation
          </h2>
          <h1 className='md:block hidden text-xs md:font-medium uppercase tracking-wider'>
            Land Transportation Office
          </h1>
        </div>

        <div className='portrait:hidden mt-2 w-full flex justify-center md:max-w-lg md:grid grid-cols-[auto_1fr] gap-1 md:gap-x-4 gap-y-1 text-sm'>
          <div className='text-xs md:font-medium md:text-right'>
            <span className='portrait:hidden pr-1'>Field </span>Office
          </div>
          <input
            className='portrait:max-w-32 border-b-[0.33px] border-stone-400/80 font-sans px-2 bg-transparent focus:outline-none focus:border-blue-500'
            value={data.fieldOffice}
            onChange={(e) => updateField('fieldOffice')(e.target.value)}
            placeholder='Field office'
          />
          <div className='text-xs md:font-medium md:text-right'>
            <span className='portrait:hidden pr-1'>Office</span>Code
          </div>
          <input
            className='portrait:max-w-32 border-b-[0.33px] border-stone-400/80 font-sans px-2 bg-transparent focus:outline-none focus:border-blue-500'
            value={data.officeCode}
            onChange={(e) => updateField('officeCode')(e.target.value)}
            placeholder='Office code'
          />
        </div>
      </div>

      {/* Title Bar */}
      <div className='md:mb-2 flex flex-row items-center justify-between'>
        <div className='hidden md:flex items-center justify-center dark:bg-background bg-foreground text-white px-3 py-1.5 text-xs font-semibold w-fit uppercase'>
          Certificate of Registration
        </div>
        {/*<div className='md:flex hidden font-bold uppercase tracking-wider bg-black text-white text-sm px-2 py-1 print:bg-black print:text-white'>

        </div>*/}
        <div className='md:hidden md:text-sm text-xs font-medium uppercase tracking-tighter bg-black text-white py-0.5 px-1.5 print:bg-black print:text-white'>
          Certificate of Registration
        </div>
        <div className='flex items-center gap-2'>
          <span className='md:text-sm text-xs font-medium md:font-semibold'>CR No.</span>
          <span className='text-base md:text-xl font-mono md:text-semibold font-medium text-red-600 px-2 rounded-sm tracking-widest'>
            {data.crNo.toLowerCase().replace('cr', '').trim()}
          </span>
        </div>
        <div className='flex items-center justify-center md:gap-2 gap-0 text-xs md:text-sm md:w-64 w-24'>
          <span>DATE:</span>
          <input
            className='bg-transparent md:font-bold font-medium w-24 text-center focus:outline-none'
            value={data.date}
            onChange={(e) => updateField('date')(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid Form */}
      <div className='border-x-2 border-y-2 border-greyed bg-greyed gap-px grid grid-cols-1 md:grid-cols-4'>
        {/* Row 1 */}
        <EditableCell label='Plate No.' value={data.plateNo} onChangeAction={updateField('plateNo')} />
        <EditableCell label='Engine No.' value={data.engineNo} onChangeAction={updateField('engineNo')} />
        <EditableCell label='Chassis No.' value={data.chassisNo} onChangeAction={updateField('chassisNo')} />
        <EditableCell label='VIN' value={data.vin} onChangeAction={updateField('vin')} />

        {/* Row 2 */}
        <EditableCell label='File No.' value={data.fileNo} onChangeAction={updateField('fileNo')} />
        <EditableCell
          label='Vehicle Type'
          value={data.vehicleType}
          onChangeAction={updateField('vehicleType')}
          className='text-[10px]'
        />
        <EditableCell
          label='Vehicle Category'
          value={data.vehicleCategory}
          onChangeAction={updateField('vehicleCategory')}
        />
        <EditableCell label='Make/Brand' value={data.makeBrand} onChangeAction={updateField('makeBrand')} />

        {/* Row 3 */}
        <EditableCell label='Passenger Capacity' value={data.capacity} onChangeAction={updateField('capacity')} />
        <EditableCell label='Color' value={data.color} onChangeAction={updateField('color')} />
        <EditableCell label='Type of Fuel' value={data.fuel} onChangeAction={updateField('fuel')} />
        <EditableCell
          label='Classification'
          value={data.classification}
          onChangeAction={updateField('classification')}
        />

        {/* Row 4 */}
        <EditableCell label='Body Type' value={data.bodyType} onChangeAction={updateField('bodyType')} />
        <EditableCell label='Series' value={data.series} onChangeAction={updateField('series')} />
        <EditableCell label='Gross Weight' value={data.grossWeight} onChangeAction={updateField('grossWeight')} />
        <EditableCell label='Net Weight' value={data.netWeight} onChangeAction={updateField('netWeight')} />

        {/* Row 5 */}
        <EditableCell label='Year Model' value={data.yearModel} onChangeAction={updateField('yearModel')} />
        <EditableCell label='Year Rebuilt' value={data.yearRebuilt} onChangeAction={updateField('yearRebuilt')} />
        <EditableCell
          label='Piston Displacement'
          value={data.displacement}
          onChangeAction={updateField('displacement')}
        />
        <EditableCell label='Max Power (KW)' value={data.maxPower} onChangeAction={updateField('maxPower')} />

        {/* Owner Section */}
        <EditableCell
          label="Owner's Name"
          value={data.ownerName}
          onChangeAction={updateField('ownerName')}
          className='md:col-span-4 items-start w-full'
        />

        <EditableCell
          label="Owner's Address"
          value={data.ownerAddress}
          onChangeAction={updateField('ownerAddress')}
          className='md:col-span-4 whitespace-normal items-start'
        />

        <EditableCell
          label='Encumbered To'
          value={data.encumberedTo}
          onChangeAction={updateField('encumberedTo')}
          className='md:col-span-4'
        />

        {/* Lower Grid */}
        <EditableCell
          label='Details of First Registration'
          value={data.firstRegDetails}
          onChangeAction={updateField('firstRegDetails')}
          className=''
        />
        <EditableCell label='O.R. No.' value={data.orNo} onChangeAction={updateField('orNo')} />
        <EditableCell label='O.R. Date' value={data.orDate} onChangeAction={updateField('orDate')} />
        <EditableCell label='Amount' value={data.amount} onChangeAction={updateField('amount')} className='' />
        {/* Amount Row - Using a custom cell for layout consistency with the image */}
        <div className='md:col-span-4 bg-white p-2'>
          <span className='h-12 font-semibold text-[10px] dark:text-background opacity-60 font-figtree uppercase tracking-wider select-none'>
            remarks:
          </span>
          <textarea
            className='w-full h-8 border resize-none border-none outline-none text-sm uppercase font-mono p-2'
            placeholder='Enter remarks here...'
            value={data.remarks}
            onChange={(e) => updateField('remarks')(e.target.value)}
          />
        </div>
      </div>

      {/* Footer Signatures */}
      <div className='border-x-2 border-b-2 dark:border-background/60 border-foreground/80 grid grid-cols-1 md:grid-cols-4 md:flex-row'>
        <div className='flex-1 flex flex-col col-span-1 h-full'>
          <div className='dark:bg-background bg-foreground flex items-center justify-center text-white px-2 py-3 text-xs font-semibold w-full'>
            REGISTRANT&apos;S SIGNATURE
          </div>
        </div>

        <div className='flex-1 flex flex-col items-center justify-end pt-9 relative border-l dark:border-background border-foreground/60 col-span-3'>
          <span className='absolute h-12 top-2 left-0 px-4 font-semibold text-[10px] dark:text-background opacity-60 font-figtree uppercase tracking-wider select-none'>
            by:
          </span>
          <div className='w-full text-center'>
            <div className='font-bold text-base min-h-6 uppercase border-t border-black pt-1 w-full text-center'>
              {data.by}
            </div>
            <div className='text-sm'>{data.office}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
