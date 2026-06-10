import { useState, useCallback } from 'react'
import { Invoice, InvoiceItem, Customer, ServiceItem, VatRate } from '@/types'

// Definicija za dnevnik sprememb
export interface AuditLogEntry {
  id: string
  invoiceId: string
  invoiceNumber: string
  action: 'created' | 'edited' | 'sent' | 'paid' | 'cancelled' | 'status_changed' | 'printed'
  user: string
  userRole: string
  timestamp: string
  oldValue?: string
  newValue?: string
  details?: string
}

// Mock customers
const mockCustomers: Customer[] = [
  { id: 'c1', name: 'Občina Kranj', taxId: '12345678', address: 'Slovenski trg 1, 4000 Kranj', email: 'info@kranj.si', phone: '04 123 4567', isCompany: true, registrationNumber: '1234567' },
  { id: 'c2', name: 'Gradbena družba Zlato d.o.o.', taxId: 'SI98765432', address: 'Cesta 24. junija 15, 4000 Kranj', email: 'info@zlato.si', phone: '04 765 4321', isCompany: true, registrationNumber: '7654321' },
  { id: 'c3', name: 'Stanislav Horvat', taxId: 'SI11223344', address: 'Cesta v Mestni log 8, 1000 Ljubljana', email: 'stanislav.horvat@gmail.com', phone: '040 123 456', isCompany: false },
  { id: 'c4', name: 'Občina Ljubljana', taxId: '56789012', address: 'Mestni trg 1, 1000 Ljubljana', email: 'info@ljubljana.si', phone: '01 306 1234', isCompany: true, registrationNumber: '3456789' },
  { id: 'c5', name: 'Gradnja Marles d.o.o.', taxId: 'SI44332211', address: 'Poslovna cona A 12, 2000 Maribor', email: 'info@marles.si', phone: '02 456 7890', isCompany: true, registrationNumber: '8765432' },
]

// Mock services
const mockServices: ServiceItem[] = [
  { id: 's1', code: '101', name: 'Geodetsko snemanje', unit: 'ura', price: 150, vatRate: 22 },
  { id: 's2', code: '102', name: 'Izdelava elaborata', unit: 'kos', price: 300, vatRate: 22 },
  { id: 's3', code: '103', name: 'Parcelacija', unit: 'ura', price: 250, vatRate: 9.5 },
  { id: 's4', code: '104', name: 'Katastrska izmera', unit: 'ura', price: 200, vatRate: 22 },
  { id: 's5', code: '105', name: 'Dnevnica', unit: 'dan', price: 45, vatRate: 9.5 },
  { id: 's6', code: '106', name: 'Kilometrina', unit: 'km', price: 0.43, vatRate: 22 },
]

// Helper function to create invoice items with correct calculations
const createItems = (itemsConfig: Array<{ 
  serviceId: string; 
  quantity: number; 
  discountPercent?: number; 
  parcelNumber?: string; 
  cadastralMunicipality?: string; 
  itemNote?: string 
}>): InvoiceItem[] => {
  return itemsConfig.map((config, index) => {
    const service = mockServices.find(s => s.id === config.serviceId) || mockServices[0]
    const price = service.price
    const quantity = config.quantity
    const discountPercent = config.discountPercent || 0
    
    // Calculate: net before discount = quantity * price
    const netBeforeDiscount = price * quantity
    
    // Calculate: discount amount = net before discount * discountPercent / 100
    const discountAmount = netBeforeDiscount * discountPercent / 100
    
    // Calculate: net after discount (net s popustom) = net before discount - discount amount
    const netAfterDiscount = netBeforeDiscount - discountAmount
    
    // Calculate: vat amount = net after discount * vatRate / 100
    const vatRate = service.vatRate
    const vatAmount = netAfterDiscount * vatRate / 100
    
    // Calculate: gross = net after discount + vat amount
    const gross = netAfterDiscount + vatAmount

    return {
      id: `item-${Date.now()}-${index}`,
      description: service.name,
      quantity,
      unit: service.unit,
      price,
      vatRate,
      discountPercent,
      discountAmount,
      netBeforeDiscount,
      net: netAfterDiscount,
      vatAmount,
      gross,
      parcelNumber: config.parcelNumber,
      cadastralMunicipality: config.cadastralMunicipality,
      cadastreName: config.parcelNumber ? 'Kataster stavb' : undefined,
      landRegisterId: config.parcelNumber ? `1434 ${config.parcelNumber}` : undefined,
      reverseCharge: false,
      vatExemptionReason: vatRate === 0 ? '91. člen ZDDV-1 – oprostitev pri izvozu' : undefined,
      itemNote: config.itemNote,
    }
  })
}

// Mock audit logs
const mockAuditLogs: AuditLogEntry[] = []

// Function to add audit log
export const addAuditLog = (log: AuditLogEntry) => {
  mockAuditLogs.unshift(log)
}

// Function to get audit logs for invoice
export const getAuditLogsForInvoice = (invoiceId: string) => {
  return mockAuditLogs.filter(log => log.invoiceId === invoiceId)
}

// Calculate totals for invoice
const calculateInvoiceTotals = (items: InvoiceItem[], discountPercent: number) => {
  // Total net before any discounts
  const totalNetBeforeDiscount = items.reduce((sum, item) => sum + item.netBeforeDiscount, 0)
  
  // Total of all item discounts in €
  const totalItemDiscounts = items.reduce((sum, item) => sum + (item.discountAmount || 0), 0)
  
  // Total net after item discounts
  const totalNetAfterItemDiscounts = items.reduce((sum, item) => sum + item.net, 0)
  
  // Invoice discount amount
  const invoiceDiscountAmount = totalNetAfterItemDiscounts * discountPercent / 100
  
  // Final net base after all discounts
  const finalNetBase = totalNetAfterItemDiscounts - invoiceDiscountAmount
  
  // VAT breakdown by rate
  const vatBreakdown: Record<VatRate, number> = { 22: 0, 9.5: 0, 5: 0, 0: 0 }
  items.forEach(item => {
    const discountShare = (discountPercent / 100) * item.net
    const base = item.net - discountShare
    vatBreakdown[item.vatRate] += base * (item.vatRate / 100)
  })
  
  const totalVat = Object.values(vatBreakdown).reduce((a, b) => a + b, 0)
  const totalGross = finalNetBase + totalVat
  
  return {
    totalNetBeforeDiscount,
    totalItemDiscounts,
    totalNetAfterItemDiscounts,
    invoiceDiscountAmount,
    finalNetBase,
    vatBreakdown,
    totalVat,
    totalGross
  }
}

// Initial invoices with different scenarios
const initialInvoices: Invoice[] = [
  // Invoice 1 - With item discount (3% on one item)
  {
    id: 'inv1',
    number: 'R-2025-0047',
    customerId: 'c1',
    customerName: 'Občina Kranj',
    customerTaxId: '12345678',
    customerAddress: 'Slovenski trg 1, 4000 Kranj',
    issueDate: '2025-06-09',
    serviceDateFrom: '2025-06-05',
    serviceDateTo: '2025-06-05',
    dueDate: '2025-07-09',
    paymentTermDays: 30,
    items: createItems([
      { serviceId: 's2', quantity: 1, discountPercent: 3, parcelNumber: '325/4', cadastralMunicipality: '1434 Šiška', itemNote: 'Izdelava elaborata za parcelo 325/4' },
    ]),
    discountPercent: 0,
    ...(() => {
      const items = createItems([{ serviceId: 's2', quantity: 1, discountPercent: 3, parcelNumber: '325/4', cadastralMunicipality: '1434 Šiška' }])
      const totals = calculateInvoiceTotals(items, 0)
      return {
        totalNet: totals.totalNetAfterItemDiscounts,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        vatBreakdown: totals.vatBreakdown,
        totalNetBeforeDiscount: totals.totalNetBeforeDiscount,
        totalItemDiscounts: totals.totalItemDiscounts,
        invoiceDiscountAmount: totals.invoiceDiscountAmount,
        finalNetBase: totals.finalNetBase
      }
    })(),
    status: 'paid',
    note: 'Račun plačan po predračunu P-2405-12',
    createdAt: '2025-06-09T10:00:00Z',
    updatedAt: '2025-07-10T14:00:00Z',
    paidAt: '2025-07-10T14:00:00Z',
  } as Invoice,
  
  // Invoice 2 - Multiple items with various discounts and invoice discount
  {
    id: 'inv2',
    number: 'R-2025-0048',
    customerId: 'c2',
    customerName: 'Gradbena družba Zlato d.o.o.',
    customerTaxId: 'SI98765432',
    customerAddress: 'Cesta 24. junija 15, 4000 Kranj',
    issueDate: '2025-06-15',
    serviceDateFrom: '2025-06-10',
    serviceDateTo: '2025-06-14',
    dueDate: '2025-07-15',
    paymentTermDays: 30,
    items: createItems([
      { serviceId: 's4', quantity: 3, discountPercent: 0, parcelNumber: '458/12', cadastralMunicipality: '2456 Kranj' },
      { serviceId: 's1', quantity: 4, discountPercent: 5, parcelNumber: '458/12', cadastralMunicipality: '2456 Kranj' },
      { serviceId: 's5', quantity: 2, discountPercent: 0 },
    ]),
    discountPercent: 8,
    ...(() => {
      const items = createItems([
        { serviceId: 's4', quantity: 3, discountPercent: 0, parcelNumber: '458/12', cadastralMunicipality: '2456 Kranj' },
        { serviceId: 's1', quantity: 4, discountPercent: 5, parcelNumber: '458/12', cadastralMunicipality: '2456 Kranj' },
        { serviceId: 's5', quantity: 2, discountPercent: 0 },
      ])
      const totals = calculateInvoiceTotals(items, 8)
      return {
        totalNet: totals.totalNetAfterItemDiscounts,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        vatBreakdown: totals.vatBreakdown,
        totalNetBeforeDiscount: totals.totalNetBeforeDiscount,
        totalItemDiscounts: totals.totalItemDiscounts,
        invoiceDiscountAmount: totals.invoiceDiscountAmount,
        finalNetBase: totals.finalNetBase
      }
    })(),
    status: 'overdue',
    note: 'Prosimo za čimprejšnje plačilo',
    createdAt: '2025-06-15T09:00:00Z',
    updatedAt: '2025-06-15T09:00:00Z',
  } as Invoice,
  
  // Invoice 3 - Mixed VAT rates (22% and 9.5%)
  {
    id: 'inv3',
    number: 'R-2025-0049',
    customerId: 'c3',
    customerName: 'Stanislav Horvat',
    customerTaxId: 'SI11223344',
    customerAddress: 'Cesta v Mestni log 8, 1000 Ljubljana',
    issueDate: '2025-06-20',
    serviceDateFrom: '2025-06-15',
    serviceDateTo: '2025-06-19',
    dueDate: '2025-07-20',
    paymentTermDays: 30,
    items: createItems([
      { serviceId: 's1', quantity: 2, discountPercent: 5, parcelNumber: '789/23', cadastralMunicipality: '1122 Ljubljana' },
      { serviceId: 's3', quantity: 3, discountPercent: 0, parcelNumber: '789/23', cadastralMunicipality: '1122 Ljubljana' },
      { serviceId: 's5', quantity: 1, discountPercent: 0 },
    ]),
    discountPercent: 0,
    ...(() => {
      const items = createItems([
        { serviceId: 's1', quantity: 2, discountPercent: 5, parcelNumber: '789/23', cadastralMunicipality: '1122 Ljubljana' },
        { serviceId: 's3', quantity: 3, discountPercent: 0, parcelNumber: '789/23', cadastralMunicipality: '1122 Ljubljana' },
        { serviceId: 's5', quantity: 1, discountPercent: 0 },
      ])
      const totals = calculateInvoiceTotals(items, 0)
      return {
        totalNet: totals.totalNetAfterItemDiscounts,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        vatBreakdown: totals.vatBreakdown,
        totalNetBeforeDiscount: totals.totalNetBeforeDiscount,
        totalItemDiscounts: totals.totalItemDiscounts,
        invoiceDiscountAmount: totals.invoiceDiscountAmount,
        finalNetBase: totals.finalNetBase
      }
    })(),
    status: 'sent',
    sentAt: '2025-06-21T11:00:00Z',
    note: 'Hvala za sodelovanje!',
    createdAt: '2025-06-20T08:00:00Z',
    updatedAt: '2025-06-21T11:00:00Z',
  } as Invoice,
  
  // Invoice 4 - Issued, high value with item discounts
  {
    id: 'inv4',
    number: 'R-2025-0050',
    customerId: 'c4',
    customerName: 'Občina Ljubljana',
    customerTaxId: '56789012',
    customerAddress: 'Mestni trg 1, 1000 Ljubljana',
    issueDate: '2025-06-25',
    serviceDateFrom: '2025-06-20',
    serviceDateTo: '2025-06-24',
    dueDate: '2025-07-25',
    paymentTermDays: 30,
    items: createItems([
      { serviceId: 's2', quantity: 2, discountPercent: 15, parcelNumber: '1122/5', cadastralMunicipality: '1456 Vič', itemNote: 'Elaborat za večjo parcelo' },
      { serviceId: 's4', quantity: 5, discountPercent: 0, parcelNumber: '1122/5', cadastralMunicipality: '1456 Vič' },
      { serviceId: 's1', quantity: 3, discountPercent: 0, parcelNumber: '1122/5', cadastralMunicipality: '1456 Vič' },
    ]),
    discountPercent: 0,
    ...(() => {
      const items = createItems([
        { serviceId: 's2', quantity: 2, discountPercent: 15, parcelNumber: '1122/5', cadastralMunicipality: '1456 Vič' },
        { serviceId: 's4', quantity: 5, discountPercent: 0, parcelNumber: '1122/5', cadastralMunicipality: '1456 Vič' },
        { serviceId: 's1', quantity: 3, discountPercent: 0, parcelNumber: '1122/5', cadastralMunicipality: '1456 Vič' },
      ])
      const totals = calculateInvoiceTotals(items, 0)
      return {
        totalNet: totals.totalNetAfterItemDiscounts,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        vatBreakdown: totals.vatBreakdown,
        totalNetBeforeDiscount: totals.totalNetBeforeDiscount,
        totalItemDiscounts: totals.totalItemDiscounts,
        invoiceDiscountAmount: totals.invoiceDiscountAmount,
        finalNetBase: totals.finalNetBase
      }
    })(),
    status: 'issued',
    note: 'Račun bo poslan po elektronski pošti',
    createdAt: '2025-06-25T13:00:00Z',
    updatedAt: '2025-06-25T13:00:00Z',
  } as Invoice,
  
  // Invoice 5 - Draft
  {
    id: 'inv5',
    number: 'OSNUTEK',
    customerId: 'c5',
    customerName: 'Gradnja Marles d.o.o.',
    customerTaxId: 'SI44332211',
    customerAddress: 'Poslovna cona A 12, 2000 Maribor',
    issueDate: '2025-06-28',
    serviceDateFrom: '2025-06-25',
    serviceDateTo: '2025-06-27',
    dueDate: '2025-07-28',
    paymentTermDays: 30,
    items: createItems([
      { serviceId: 's1', quantity: 3, discountPercent: 0, parcelNumber: '333/7', cadastralMunicipality: '1789 Maribor' },
      { serviceId: 's3', quantity: 2, discountPercent: 0, parcelNumber: '333/7', cadastralMunicipality: '1789 Maribor' },
    ]),
    discountPercent: 0,
    ...(() => {
      const items = createItems([
        { serviceId: 's1', quantity: 3, discountPercent: 0, parcelNumber: '333/7', cadastralMunicipality: '1789 Maribor' },
        { serviceId: 's3', quantity: 2, discountPercent: 0, parcelNumber: '333/7', cadastralMunicipality: '1789 Maribor' },
      ])
      const totals = calculateInvoiceTotals(items, 0)
      return {
        totalNet: totals.totalNetAfterItemDiscounts,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        vatBreakdown: totals.vatBreakdown,
        totalNetBeforeDiscount: totals.totalNetBeforeDiscount,
        totalItemDiscounts: totals.totalItemDiscounts,
        invoiceDiscountAmount: totals.invoiceDiscountAmount,
        finalNetBase: totals.finalNetBase
      }
    })(),
    status: 'draft',
    note: 'Osnutek - čaka na pregled',
    createdAt: '2025-06-28T09:30:00Z',
    updatedAt: '2025-06-28T09:30:00Z',
  } as Invoice,
  
  // Invoice 6 - Cancelled
  {
    id: 'inv6',
    number: 'R-2025-0046',
    customerId: 'c2',
    customerName: 'Gradbena družba Zlato d.o.o.',
    customerTaxId: 'SI98765432',
    customerAddress: 'Cesta 24. junija 15, 4000 Kranj',
    issueDate: '2025-05-20',
    serviceDateFrom: '2025-05-15',
    serviceDateTo: '2025-05-19',
    dueDate: '2025-06-19',
    paymentTermDays: 30,
    items: createItems([
      { serviceId: 's2', quantity: 1, discountPercent: 0, parcelNumber: '125/3', cadastralMunicipality: '1434 Šiška' },
    ]),
    discountPercent: 0,
    ...(() => {
      const items = createItems([{ serviceId: 's2', quantity: 1, discountPercent: 0, parcelNumber: '125/3', cadastralMunicipality: '1434 Šiška' }])
      const totals = calculateInvoiceTotals(items, 0)
      return {
        totalNet: totals.totalNetAfterItemDiscounts,
        totalVat: totals.totalVat,
        totalGross: totals.totalGross,
        vatBreakdown: totals.vatBreakdown,
        totalNetBeforeDiscount: totals.totalNetBeforeDiscount,
        totalItemDiscounts: totals.totalItemDiscounts,
        invoiceDiscountAmount: totals.invoiceDiscountAmount,
        finalNetBase: totals.finalNetBase
      }
    })(),
    status: 'cancelled',
    cancelledReason: 'Kupec je podvojil naročilo - stornirano',
    note: 'Stornirano na zahtevo kupca',
    createdAt: '2025-05-20T10:00:00Z',
    updatedAt: '2025-05-25T09:00:00Z',
  } as Invoice,
]

// Initialize audit logs for existing invoices
const initializeAuditLogs = () => {
  addAuditLog({ id: 'a1', invoiceId: 'inv1', invoiceNumber: 'R-2025-0047', action: 'created', user: 'Maja Novak', userRole: 'tajnistvo', timestamp: '2025-06-09T10:00:00Z', details: 'Račun ustvarjen iz predračuna P-2405-12' })
  addAuditLog({ id: 'a2', invoiceId: 'inv1', invoiceNumber: 'R-2025-0047', action: 'sent', user: 'Maja Novak', userRole: 'tajnistvo', timestamp: '2025-06-09T10:30:00Z', details: 'Račun poslan po e-pošti na naslov info@kranj.si' })
  addAuditLog({ id: 'a3', invoiceId: 'inv1', invoiceNumber: 'R-2025-0047', action: 'paid', user: 'Igor Žagar', userRole: 'direktor', timestamp: '2025-07-10T14:00:00Z', details: 'Račun označen kot plačan - plačilo prispelo na TRR' })
  
  addAuditLog({ id: 'a4', invoiceId: 'inv2', invoiceNumber: 'R-2025-0048', action: 'created', user: 'Ana Kuhar', userRole: 'projektant', timestamp: '2025-06-15T09:00:00Z', details: 'Račun ustvarjen na podlagi terenskega dela' })
  addAuditLog({ id: 'a5', invoiceId: 'inv2', invoiceNumber: 'R-2025-0048', action: 'status_changed', user: 'Sistem', userRole: 'auto', timestamp: '2025-07-16T00:00:00Z', details: 'Račun samodejno označen kot zapadel - rok plačila potekel', oldValue: 'izdan', newValue: 'zapadel' })
  
  addAuditLog({ id: 'a6', invoiceId: 'inv3', invoiceNumber: 'R-2025-0049', action: 'created', user: 'Maja Novak', userRole: 'tajnistvo', timestamp: '2025-06-20T08:00:00Z', details: 'Račun ustvarjen' })
  addAuditLog({ id: 'a7', invoiceId: 'inv3', invoiceNumber: 'R-2025-0049', action: 'edited', user: 'Maja Novak', userRole: 'tajnistvo', timestamp: '2025-06-20T08:30:00Z', details: 'Popravljena cena pri postavki Geodetsko snemanje', oldValue: '140,00 €', newValue: '150,00 €' })
  addAuditLog({ id: 'a8', invoiceId: 'inv3', invoiceNumber: 'R-2025-0049', action: 'sent', user: 'Maja Novak', userRole: 'tajnistvo', timestamp: '2025-06-21T11:00:00Z', details: 'Račun poslan po e-pošti na naslov stanislav.horvat@gmail.com' })
  
  addAuditLog({ id: 'a9', invoiceId: 'inv4', invoiceNumber: 'R-2025-0050', action: 'created', user: 'Igor Žagar', userRole: 'direktor', timestamp: '2025-06-25T13:00:00Z', details: 'Račun ustvarjen - čaka na pošiljanje' })
  
  addAuditLog({ id: 'a10', invoiceId: 'inv5', invoiceNumber: 'OSNUTEK', action: 'created', user: 'Ana Kuhar', userRole: 'projektant', timestamp: '2025-06-28T09:30:00Z', details: 'Osnutek računa ustvarjen' })
  addAuditLog({ id: 'a11', invoiceId: 'inv5', invoiceNumber: 'OSNUTEK', action: 'edited', user: 'Ana Kuhar', userRole: 'projektant', timestamp: '2025-06-28T10:00:00Z', details: 'Dodana parcela 333/7, k.o. Maribor' })
  
  addAuditLog({ id: 'a12', invoiceId: 'inv6', invoiceNumber: 'R-2025-0046', action: 'created', user: 'Maja Novak', userRole: 'tajnistvo', timestamp: '2025-05-20T10:00:00Z', details: 'Račun ustvarjen' })
  addAuditLog({ id: 'a13', invoiceId: 'inv6', invoiceNumber: 'R-2025-0046', action: 'sent', user: 'Maja Novak', userRole: 'tajnistvo', timestamp: '2025-05-20T10:30:00Z', details: 'Račun poslan po e-pošti' })
  addAuditLog({ id: 'a14', invoiceId: 'inv6', invoiceNumber: 'R-2025-0046', action: 'cancelled', user: 'Maja Novak', userRole: 'tajnistvo', timestamp: '2025-05-25T09:00:00Z', details: 'Račun storniran - Razlog: Kupec je podvojil naročilo' })
}

// Initialize audit logs
initializeAuditLogs()

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs)

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev])
    const newLog: AuditLogEntry = {
      id: `a${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      action: 'created',
      user: 'Trenutni uporabnik',
      userRole: 'tajnistvo',
      timestamp: new Date().toISOString(),
      details: `Račun ${invoice.number} ustvarjen`,
    }
    setAuditLogs(prev => [newLog, ...prev])
  }, [])

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    const oldInvoice = invoices.find(inv => inv.id === id)
    if (oldInvoice) {
      if (updates.status && updates.status !== oldInvoice.status) {
        const statusLog: AuditLogEntry = {
          id: `a${Date.now()}`,
          invoiceId: id,
          invoiceNumber: oldInvoice.number,
          action: updates.status === 'paid' ? 'paid' : updates.status === 'cancelled' ? 'cancelled' : 'status_changed',
          user: 'Trenutni uporabnik',
          userRole: 'tajnistvo',
          timestamp: new Date().toISOString(),
          oldValue: oldInvoice.status,
          newValue: updates.status,
          details: updates.status === 'paid' ? 'Račun označen kot plačan' : updates.status === 'cancelled' ? `Račun storniran - ${updates.cancelledReason || 'brez razloga'}` : `Status spremenjen iz ${oldInvoice.status} v ${updates.status}`,
        }
        setAuditLogs(prev => [statusLog, ...prev])
      }
      
      if (updates.sentAt && !oldInvoice.sentAt) {
        const sentLog: AuditLogEntry = {
          id: `a${Date.now()}`,
          invoiceId: id,
          invoiceNumber: oldInvoice.number,
          action: 'sent',
          user: 'Trenutni uporabnik',
          userRole: 'tajnistvo',
          timestamp: new Date().toISOString(),
          details: `Račun poslan po e-pošti`,
        }
        setAuditLogs(prev => [sentLog, ...prev])
      }
    }
    
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv))
  }, [invoices])

  const deleteInvoice = useCallback((id: string) => {
    const invoice = invoices.find(inv => inv.id === id)
    if (invoice) {
      const deleteLog: AuditLogEntry = {
        id: `a${Date.now()}`,
        invoiceId: id,
        invoiceNumber: invoice.number,
        action: 'cancelled',
        user: 'Trenutni uporabnik',
        userRole: 'tajnistvo',
        timestamp: new Date().toISOString(),
        details: `Račun ${invoice.number} izbrisan`,
      }
      setAuditLogs(prev => [deleteLog, ...prev])
    }
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }, [invoices])

  const addAuditLogEntry = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `a${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
    setAuditLogs(prev => [newEntry, ...prev])
  }, [])

  const getInvoiceAuditLogs = useCallback((invoiceId: string) => {
    return auditLogs.filter(log => log.invoiceId === invoiceId)
  }, [auditLogs])

  return { 
    invoices, 
    customers: mockCustomers, 
    services: mockServices, 
    auditLogs,
    addInvoice, 
    updateInvoice, 
    deleteInvoice,
    addAuditLogEntry,
    getInvoiceAuditLogs
  }
}