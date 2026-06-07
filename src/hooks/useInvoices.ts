import { useState, useCallback } from 'react'
import { Invoice, InvoiceItem, Customer, ServiceItem, VatRate } from '@/types'

const mockCustomers: Customer[] = [
  { id: 'c1', name: 'Občina Ljubljana', taxId: '12345678', address: 'Mestni trg 1, Ljubljana', email: 'info@ljubljana.si', isCompany: true },
  { id: 'c2', name: 'GIG d.o.o.', taxId: 'SI98765432', address: 'Industrijska 12, Maribor', email: 'info@gig.si', isCompany: true },
  { id: 'c3', name: 'Kovač Janez s.p.', taxId: 'SI11223344', address: 'Poljansko nabrežje 6, Ljubljana', email: 'janez@gmail.com', isCompany: false },
]

const mockServices: ServiceItem[] = [
  { id: 's1', code: '101', name: 'Geodetska izmera – ura', unit: 'ura', price: 85, vatRate: 22 },
  { id: 's2', code: '102', name: 'Terensko delo – km', unit: 'km', price: 0.43, vatRate: 22 },
  { id: 's3', code: '103', name: 'Dnevnica', unit: 'dan', price: 21.39, vatRate: 22 },
  { id: 's4', code: '104', name: 'Katastrski izpis', unit: 'kos', price: 12.5, vatRate: 9.5 },
  { id: 's5', code: '105', name: 'Strokovno mnenje', unit: 'ura', price: 120, vatRate: 22 },
]

const initialInvoices: Invoice[] = [
  {
    id: 'inv1',
    number: '2026-0047',
    customerId: 'c1',
    customerName: 'Občina Ljubljana',
    customerTaxId: '12345678',
    issueDate: '2026-06-07',
    serviceDateFrom: '2026-06-01',
    serviceDateTo: '2026-06-07',
    dueDate: '2026-07-07',
    paymentTermDays: 30,
    items: [],
    discountPercent: 0,
    totalNet: 2450,
    totalVat: 538.9,
    totalGross: 2988.9,
    vatBreakdown: { 22: 538.9, 9.5: 0, 5: 0, 0: 0 },
    status: 'issued',
    createdAt: '2026-06-07T10:00:00Z',
    updatedAt: '2026-06-07T10:00:00Z',
  },
  {
    id: 'inv2',
    number: '2026-0046',
    customerId: 'c2',
    customerName: 'GIG d.o.o.',
    customerTaxId: 'SI98765432',
    issueDate: '2026-06-03',
    serviceDateFrom: '2026-05-25',
    serviceDateTo: '2026-06-02',
    dueDate: '2026-07-03',
    paymentTermDays: 30,
    items: [],
    discountPercent: 0,
    totalNet: 1120,
    totalVat: 246.4,
    totalGross: 1366.4,
    vatBreakdown: { 22: 246.4, 9.5: 0, 5: 0, 0: 0 },
    status: 'sent',
    sentAt: '2026-06-04T09:00:00Z',
    createdAt: '2026-06-03T08:00:00Z',
    updatedAt: '2026-06-04T09:00:00Z',
  },
  {
    id: 'inv3',
    number: '2026-0041',
    customerId: 'c3',
    customerName: 'Kovač Janez s.p.',
    customerTaxId: 'SI11223344',
    issueDate: '2026-04-28',
    serviceDateFrom: '2026-04-20',
    serviceDateTo: '2026-04-27',
    dueDate: '2026-05-28',
    paymentTermDays: 30,
    items: [],
    discountPercent: 0,
    totalNet: 880,
    totalVat: 193.6,
    totalGross: 1073.6,
    vatBreakdown: { 22: 193.6, 9.5: 0, 5: 0, 0: 0 },
    status: 'overdue',
    createdAt: '2026-04-28T12:00:00Z',
    updatedAt: '2026-04-28T12:00:00Z',
  },
]

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev])
  }, [])

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv))
  }, [])

  const deleteInvoice = useCallback((id: string) => {
    updateInvoice(id, { status: 'cancelled', cancelledReason: 'Storniran' })
  }, [updateInvoice])

  return { invoices, customers: mockCustomers, services: mockServices, addInvoice, updateInvoice, deleteInvoice }
}