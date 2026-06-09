export type VatRate = 22 | 9.5 | 5 | 0

export interface Customer {
  id: string
  name: string
  taxId: string
  address: string
  email: string
  phone?: string
  vatId?: string
  isCompany: boolean
}

export interface ServiceItem {
  id: string
  code: string
  name: string
  unit: string
  price: number
  vatRate: VatRate
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit: string
  price: number
  vatRate: VatRate
  net: number
  vatAmount: number
  gross: number
  parcelNumber?: string
  cadastralMunicipality?: string
  cadastreName?: string
  landRegisterId?: string
}

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'sent'
  | 'overdue'
  | 'paid'
  | 'cancelled'

export interface Invoice {
  id: string
  number: string
  customerId: string
  customerName: string
  customerTaxId: string
  issueDate: string
  serviceDateFrom: string
  serviceDateTo: string
  dueDate: string
  paymentTermDays: number
  items: InvoiceItem[]
  discountPercent: number
  totalNet: number
  totalVat: number
  totalGross: number
  vatBreakdown: Record<VatRate, number>
  status: InvoiceStatus
  note?: string
  pdfUrl?: string
  sentAt?: string
  paidAt?: string
  cancelledReason?: string
  createdAt: string
  updatedAt: string
}

export interface Estimate extends Invoice {
  isEstimate: true
  estimateNumber: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'tajnistvo' | 'direktor' | 'projektant' | 'zunanji' | 'admin'
  active: boolean
}