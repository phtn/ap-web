import {DocType} from '@@/convex/documents/d'

// CR
export interface VehicleRegistration {
  // Office Information
  fieldOffice?: string
  officeCode?: string
  dateOfIssue?: string
  certificateNumber?: string

  // Vehicle Information
  plateNumber?: string
  engineNumber?: string
  chassisNumber?: string
  vin?: string
  fileNumber?: string
  vehicleType?: string
  vehicleCategory?: string
  makeBrand?: string
  color?: string
  typeOfFuel?: string
  classification?: string
  bodyType?: string
  series?: string
  yearModel?: string
  yearRebuilt?: string
  pistonDisplacement?: string
  grossWeight?: string
  netWeight?: string
  maxPower?: string
  passengerCapacity?: string

  // Owner Information
  ownerName?: string
  ownerAddress?: string
  encumberedTo?: string

  // Registration Details
  detailsOfFirstRegistration?: string
  remarks?: string
  orNumber?: string
  orDate?: string
  amount?: string
  registrantSignature?: string
  by?: string
  office?: string
  note?: string
}

// CHECK
type StandardCheckFields = {
  account_name: string
  account_number: string
  amount_numeric?: string
  amount_words?: string
  bank_info?: string
  bank_address?: string
  brstn?: string
  check_number: string
  micr_line?: string
  notes?: string
  memo?: string
  payee: string
  date?: string
}
export interface CheckFields extends StandardCheckFields {
  checkNumber?: string
  pay_to?: string
  amount?: string
}

// DEPOSIT SLIP
export interface DepositSlipFields {
  date: string
  customerName: string
  accountNumber: string
  cash: string
  check: string
  validation: string
  subtotal: string
  total: string
}

// EWALLET TRANSFER
export interface EwalletTransferFields {
  amount?: string
  senderName?: string
  senderAccount?: string
  recipientName?: string
  recipientAccount?: string
  date?: string
  time?: string
  refNumber?: string
  transactionId?: string
  notes?: string
}

// BANK TRANSFER
export interface BankTransferFields {
  amount?: string
  senderName?: string
  senderAccount?: string
  recipientName?: string
  recipientAccount?: string
  date?: string
  time?: string
  refNumber?: string
  transactionId?: string
  notes?: string
}

export type ParsedDataByDocumentType = {
  check: CheckFields
  payslip: Record<string, unknown>
  deposit_slip: DepositSlipFields
  receipt: Record<string, unknown>
  ewallet_transfer: EwalletTransferFields
  invoice: Record<string, unknown>
  cr: VehicleRegistration
  driver_license: Record<string, unknown>
  passport: Record<string, unknown>
  other: Record<string, unknown>
}

// Union type of all possible OCR data types
export type ParsedData = ParsedDataByDocumentType[DocType]
