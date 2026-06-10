import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useInvoices } from '@/hooks/useInvoices'
import { InvoiceItem, VatRate, Customer, Invoice } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Edit, Search, ChevronDown, Building2, MapPin, Mail, Phone, FileText as FileIcon, Calendar, DollarSign, AlertCircle, ReceiptText, X, ChevronUp } from 'lucide-react'
import DatePicker from 'react-datepicker'
import { sl } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

interface NewInvoiceProps {
  editingInvoice?: Invoice | null
  clearEditing?: () => void
}

// Predlagane storitve za autocomplete
const suggestedServices: Array<{
  description: string
  price: number
  unit: string
  vatRate: VatRate
}> = [
  { description: 'Geodetsko snemanje', price: 150, unit: 'ura', vatRate: 22 },
  { description: 'Izdelava elaborata', price: 300, unit: 'kos', vatRate: 22 },
  { description: 'Parcelacija', price: 250, unit: 'ura', vatRate: 9.5 },
  { description: 'Katastrska izmera', price: 200, unit: 'ura', vatRate: 22 },
  { description: 'Prenos podatkov', price: 80, unit: 'ura', vatRate: 22 },
  { description: 'Strokovno mnenje', price: 180, unit: 'ura', vatRate: 22 },
  { description: 'Legalizacija objekta', price: 400, unit: 'kos', vatRate: 9.5 },
  { description: 'Geodetski načrt', price: 120, unit: 'm²', vatRate: 22 },
]

export function NewInvoice({ editingInvoice, clearEditing }: NewInvoiceProps) {
  const { customers, addInvoice, updateInvoice } = useInvoices()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const serviceDropdownRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountError, setDiscountError] = useState('')
  const [issueDate, setIssueDate] = useState<Date | null>(new Date())
  const [serviceDateFrom, setServiceDateFrom] = useState<Date | null>(new Date())
  const [serviceDateTo, setServiceDateTo] = useState<Date | null>(new Date())
  const [dueDate, setDueDate] = useState<Date | null>(new Date(new Date().setDate(new Date().getDate() + 30)))
  const [note, setNote] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null)
  const [dateError, setDateError] = useState('')

  // Helper function to format date for storage (YYYY-MM-DD)
  function formatDateForStorage(date: Date | null): string {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [newItem, setNewItem] = useState<Partial<InvoiceItem>>({
    description: '',
    quantity: 1,
    unit: 'ura',
    price: 0,
    vatRate: 22,
    discountPercent: 0,
    parcelNumber: '',
    cadastralMunicipality: '',
    cadastreName: '',
    landRegisterId: '',
    reverseCharge: false,
    vatExemptionReason: '',
    itemNote: '',
  })

  // Filtrirane storitve glede na vnos
  const filteredServices = suggestedServices.filter(service =>
    service.description.toLowerCase().includes((newItem.description || '').toLowerCase())
  )

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setShowServiceDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Validate dates
  useEffect(() => {
    if (serviceDateFrom && serviceDateTo) {
      if (serviceDateTo < serviceDateFrom) {
        setDateError('Datum "do" ne more biti pred datumom "od"')
      } else {
        setDateError('')
      }
    }
  }, [serviceDateFrom, serviceDateTo])

  // Validate discount
  useEffect(() => {
    if (discountPercent < 0 || discountPercent > 100) {
      setDiscountError('Popust mora biti med 0 in 100')
    } else {
      setDiscountError('')
    }
  }, [discountPercent])

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.taxId.includes(searchTerm)
  )

  // Naloži podatke, če urejamo obstoječi osnutek
  useEffect(() => {
    if (editingInvoice) {
      const cust = customers.find(c => c.id === editingInvoice.customerId)
      setSelectedCustomer(cust || null)
      setItems(editingInvoice.items)
      setDiscountPercent(editingInvoice.discountPercent)
      setIssueDate(new Date(editingInvoice.issueDate))
      setServiceDateFrom(new Date(editingInvoice.serviceDateFrom))
      setServiceDateTo(new Date(editingInvoice.serviceDateTo))
      setDueDate(new Date(editingInvoice.dueDate))
      setNote(editingInvoice.note || '')
      if (cust) setSearchTerm(cust.name)
    }
  }, [editingInvoice, customers])

  // Spremljanje sprememb v searchTerm - če je prazen, počisti izbranega kupca
  useEffect(() => {
    if (searchTerm === '' && selectedCustomer) {
      setSelectedCustomer(null)
    }
  }, [searchTerm, selectedCustomer])

  const clearCustomerSelection = () => {
    setSelectedCustomer(null)
    setSearchTerm('')
    setIsDropdownOpen(false)
  }

  const clearServiceSelection = () => {
    setNewItem({
      description: '',
      quantity: 1,
      unit: 'ura',
      price: 0,
      vatRate: 22,
      discountPercent: 0,
      parcelNumber: '',
      cadastralMunicipality: '',
      cadastreName: '',
      landRegisterId: '',
      reverseCharge: false,
      vatExemptionReason: '',
      itemNote: '',
    })
    setShowServiceDropdown(false)
  }

  const calculateItemTotals = (item: Partial<InvoiceItem>) => {
    const qty = item.quantity || 0
    const price = item.price || 0
    const discountPercent = item.discountPercent || 0
    
    const netBeforeDiscount = qty * price
    const discountAmount = netBeforeDiscount * discountPercent / 100
    const net = netBeforeDiscount - discountAmount // neto po popustu (osnova za DDV)
    const vatAmount = net * (item.vatRate || 0) / 100
    const gross = net + vatAmount
    
    return { 
      netBeforeDiscount, 
      discountAmount, 
      net, 
      vatAmount, 
      gross 
    }
  }

  const handleAddOrUpdateItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.price) return
    if (newItem.vatRate === 0 && !newItem.vatExemptionReason) return
    
    const { netBeforeDiscount, discountAmount, net, vatAmount, gross } = calculateItemTotals(newItem)
    
    const fullItem: InvoiceItem = {
      id: editingItem?.id || crypto.randomUUID(),
      description: newItem.description,
      quantity: newItem.quantity,
      unit: newItem.unit || 'ura',
      price: newItem.price,
      discountPercent: newItem.discountPercent || 0,
      discountAmount: discountAmount,
      netBeforeDiscount: netBeforeDiscount,
      net: net,
      vatRate: newItem.vatRate as VatRate,
      vatAmount: vatAmount,
      gross: gross,
      parcelNumber: newItem.parcelNumber,
      cadastralMunicipality: newItem.cadastralMunicipality,
      cadastreName: newItem.cadastreName,
      landRegisterId: newItem.landRegisterId,
      reverseCharge: newItem.reverseCharge || false,
      vatExemptionReason: newItem.vatExemptionReason,
      itemNote: newItem.itemNote,
    }
    
    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? fullItem : i))
    } else {
      setItems([...items, fullItem])
    }
    resetModal()
  }

  const resetModal = () => {
    setModalOpen(false)
    setEditingItem(null)
    setNewItem({
      description: '',
      quantity: 1,
      unit: 'ura',
      price: 0,
      vatRate: 22,
      discountPercent: 0,
      parcelNumber: '',
      cadastralMunicipality: '',
      cadastreName: '',
      landRegisterId: '',
      reverseCharge: false,
      vatExemptionReason: '',
      itemNote: '',
    })
    setShowServiceDropdown(false)
  }

  const editItem = (item: InvoiceItem) => {
    setEditingItem(item)
    setNewItem({ ...item })
    setModalOpen(true)
  }

  const deleteItem = (id: string) => {
    if (confirm('Ali ste prepričani, da želite izbrisati to postavko?')) {
      setItems(items.filter(i => i.id !== id))
    }
  }

  const calculateTotals = () => {
    // Skupni neto pred popusti (seštevek neto pred popustom vseh postavk)
    const totalNetBeforeDiscount = items.reduce((sum, i) => sum + (i.netBeforeDiscount || i.net), 0)
    
    // Seštevek vseh popustov na postavke v €
    const totalItemDiscounts = items.reduce((sum, i) => sum + (i.discountAmount || 0), 0)
    
    // Skupni neto po popustih na postavke (osnova za DDV pred popustom na račun)
    const totalNetAfterItemDiscounts = items.reduce((sum, i) => sum + i.net, 0)
    
    // Popust na račun v €
    const invoiceDiscountAmount = totalNetAfterItemDiscounts * (discountPercent / 100)
    
    // Neto po vseh popustih (končna osnova za DDV)
    const finalNetBase = totalNetAfterItemDiscounts - invoiceDiscountAmount
    
    // DDV po stopnjah (upošteva končno osnovo)
    const vatBreakdown: Record<VatRate, number> = { 22: 0, 9.5: 0, 5: 0, 0: 0 }
    items.forEach(item => {
      const itemNet = item.net
      const discountShare = discountPercent / 100 * itemNet
      const base = itemNet - discountShare
      vatBreakdown[item.vatRate] += base * (item.vatRate / 100)
    })
    
    const totalVat = Object.values(vatBreakdown).reduce((a, b) => a + b, 0)
    const totalGross = finalNetBase + totalVat
    
    return { 
      totalNetBeforeDiscount,     // Skupni neto znesek (seštevek vseh postavk brez DDV in brez popustov)
      totalItemDiscounts,         // vsota vseh popustov na postavke v €
      totalNetAfterItemDiscounts, // neto po popustih na postavke
      invoiceDiscountAmount,      // popust na račun v €
      discountPercent,            // Višina popusta v %
      finalNetBase,               // Neto znesek po popustu (osnova za DDV)
      vatBreakdown,               // DDV po stopnjah
      totalVat,                   // Skupni znesek DDV (vseh skupaj)
      totalGross,                 // Skupni znesek za plačilo (z DDV)
    }
  }

  const totals = calculateTotals()

  // Validation function
  const isFormValid = () => {
    if (!selectedCustomer) return false
    if (!issueDate) return false
    if (!dueDate) return false
    if (!serviceDateFrom) return false
    if (!serviceDateTo) return false
    if (dateError) return false
    if (discountError) return false
    if (items.length === 0) return false
    return true
  }

  const validateAndWarn = () => {
    const missingFields = []
    if (!selectedCustomer) missingFields.push('kupec')
    if (!issueDate) missingFields.push('datum izdaje')
    if (!dueDate) missingFields.push('rok plačila')
    if (!serviceDateFrom) missingFields.push('datum storitve (od)')
    if (!serviceDateTo) missingFields.push('datum storitve (do)')
    if (dateError) missingFields.push(dateError)
    if (discountError) missingFields.push(discountError)
    if (items.length === 0) missingFields.push('vsaj ena postavka')
    
    if (missingFields.length > 0) {
      alert(`Pred izdajo računa obvezno izpolnite:\n- ${missingFields.join('\n- ')}`)
      return false
    }
    return true
  }

  const saveInvoice = (status: 'draft' | 'issued' | 'estimate') => {
    if (status === 'issued') {
      if (!validateAndWarn()) return
    }
    
    if (status === 'estimate') {
      if (!selectedCustomer) {
        alert('Izberite kupca!')
        return
      }
      if (items.length === 0) {
        alert('Dodajte vsaj eno postavko!')
        return
      }
    }

    if (status === 'draft') {
      if (!selectedCustomer && items.length === 0) {
        alert('Osnutek mora vsebovati vsaj kupca ali eno postavko!')
        return
      }
    }

    // Preveri, če ima katera postavka obrnjeno davčno obveznost
    const hasReverseCharge = items.some(item => item.reverseCharge)
    const reverseChargeClause = hasReverseCharge ? '\n\nObrnjena davčna obveznost – DDV obračuna kupec.' : ''
    
    // Preveri, če ima kupec samofakturiranje
    const selfBillingClause = selectedCustomer?.selfBilling 
      ? '\n\nSamofakturiranje – račun izdal kupec v imenu in za račun dobavitelja.' 
      : ''

    const invoiceData = {
      id: editingInvoice?.id || crypto.randomUUID(),
      number: editingInvoice?.number || (status === 'issued' ? `2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}` : 'OSNUTEK'),
      customerId: selectedCustomer?.id || '',
      customerName: selectedCustomer?.name || '',
      customerTaxId: selectedCustomer?.taxId || '',
      issueDate: formatDateForStorage(issueDate),
      serviceDateFrom: formatDateForStorage(serviceDateFrom),
      serviceDateTo: formatDateForStorage(serviceDateTo),
      dueDate: formatDateForStorage(dueDate),
      paymentTermDays: 30,
      items,
      discountPercent,
      totalNetBeforeDiscount: totals.totalNetBeforeDiscount,
      totalItemDiscounts: totals.totalItemDiscounts,
      totalNetAfterItemDiscounts: totals.totalNetAfterItemDiscounts,
      invoiceDiscountAmount: totals.invoiceDiscountAmount,
      finalNetBase: totals.finalNetBase,
      totalVat: totals.totalVat,
      totalGross: totals.totalGross,
      vatBreakdown: totals.vatBreakdown,
      status: status === 'estimate' ? 'draft' : status,
      note: note + reverseChargeClause + selfBillingClause,
      createdAt: editingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invoiceData)
      alert(`Osnutek ${editingInvoice.number} posodobljen.`)
    } else {
      addInvoice(invoiceData as any)
      if (status === 'draft') {
        alert('Osnutek shranjen.')
      } else if (status === 'estimate') {
        alert(`Predračun uspešno ustvarjen!`)
      } else {
        alert(`Račun ${invoiceData.number} uspešno izdan!`)
      }
    }

    // Počisti formo samo če ni editing
    if (!editingInvoice) {
      setSelectedCustomer(null)
      setItems([])
      setDiscountPercent(0)
      setNote('')
      setIssueDate(new Date())
      setServiceDateFrom(new Date())
      setServiceDateTo(new Date())
      setDueDate(new Date(new Date().setDate(new Date().getDate() + 30)))
      setSearchTerm('')
    }
    if (clearEditing) clearEditing()
  }

  // Custom input for DatePicker
  const CustomDateInput = ({ value, onClick, placeholder }: any) => (
    <div className="relative">
      <Input 
        value={value} 
        onClick={onClick}
        readOnly
        placeholder={placeholder}
        className="cursor-pointer bg-white pr-10"
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )

  // Number input with up/down buttons
const NumberInput = ({ value, onChange, min = 0, step = 0.01, className = "" }: any) => {
  const handleChange = (newValue: number) => {
    if (newValue < min) newValue = min
    onChange(newValue)
  }

  return (
    <div className="relative">
      <Input 
        type="number" 
        step={step}
        min={min}
        value={value} 
        onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
        className={`pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${className}`}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
        <button
          type="button"
          onClick={() => handleChange((parseFloat(value) || 0) + step)}
          className="h-4 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => handleChange((parseFloat(value) || 0) - step)}
          className="h-4 w-6 flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

  return (
    <div className="space-y-6">
      {/* Invoice Number Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 rounded-lg p-2">
              <ReceiptText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-md font-bold text-primary">
                {editingInvoice ? editingInvoice.number : 'Številka računa bo avtomatsko dodeljena.'}
              </div>
            </div>
          </div>
          {!editingInvoice && (
            <div className="text-sm text-gray-500 bg-white/50 rounded-lg px-3 py-1.5">
              Dodeli se ob izdaji računa ali predračuna.
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Podatki o računu</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Customer Section */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Kupec *</label>
                <div className="relative" ref={dropdownRef}>
                  <div 
                    className="flex items-center border rounded-md px-3 py-2 bg-white hover:border-gray-400 cursor-pointer"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Iskanje po imenu, naslovu ali davčni številki..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setIsDropdownOpen(true)
                      }}
                      className="flex-1 outline-none bg-transparent text-sm"
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                    {selectedCustomer ? (
                      <X 
                        className="w-4 h-4 text-gray-400 ml-2 cursor-pointer hover:text-red-500 transition-colors flex-shrink-0" 
                        onClick={(e) => {
                          e.stopPropagation()
                          clearCustomerSelection()
                        }}
                      />
                    ) : (
                      <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} flex-shrink-0`} />
                    )}
                  </div>
                  
                  {isDropdownOpen && filteredCustomers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-auto">
                      {filteredCustomers.map(customer => (
                        <div
                          key={customer.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setSearchTerm(customer.name)
                            setIsDropdownOpen(false)
                          }}
                        >
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            <div>{customer.address || 'Ni naslova'}</div>
                            <div>Davčna številka: {customer.taxId}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isDropdownOpen && filteredCustomers.length === 0 && searchTerm && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-gray-500">
                      Ni najdenih strank za "{searchTerm}"
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details Card */}
              {selectedCustomer && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{selectedCustomer.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="text-gray-500">Naslov:</span>
                            <div className="text-gray-900">{selectedCustomer.address || 'Ni vpisan'}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FileIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="text-gray-500">Davčna številka:</span>
                            <div className="text-gray-900">{selectedCustomer.taxId}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="text-gray-500">Email:</span>
                            <div className="text-gray-900">{selectedCustomer.email || 'Ni vpisan'}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="text-gray-500">Telefon:</span>
                            <div className="text-gray-900">{selectedCustomer.phone || 'Ni vpisan'}</div>
                          </div>
                        </div>
                      </div>
                      {selectedCustomer.vatId && (
                        <div className="mt-2 text-sm text-gray-600 border-t border-blue-200 pt-2">
                          <span className="text-gray-500">ID za DDV:</span> {selectedCustomer.vatId}
                        </div>
                      )}
                      {selectedCustomer.selfBilling && (
                        <div className="mt-2 text-sm text-blue-600 border-t border-blue-200 pt-2">
                          <span className="font-medium">✓ Samofakturiranje</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Dates Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Datum izdaje *
                  </label>
                  <DatePicker
                    selected={issueDate}
                    onChange={(date: Date | null) => setIssueDate(date)}
                    dateFormat="dd. MM. yyyy"
                    locale={sl}
                    customInput={<CustomDateInput />}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Rok plačila *
                  </label>
                  <DatePicker
                    selected={dueDate}
                    onChange={(date: Date | null) => setDueDate(date)}
                    dateFormat="dd. MM. yyyy"
                    locale={sl}
                    customInput={<CustomDateInput />}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Datum storitve od *</label>
                  <DatePicker
                    selected={serviceDateFrom}
                    onChange={(date: Date | null) => setServiceDateFrom(date)}
                    dateFormat="dd. MM. yyyy"
                    locale={sl}
                    customInput={<CustomDateInput />}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Datum storitve do *</label>
                  <DatePicker
                    selected={serviceDateTo}
                    onChange={(date: Date | null) => setServiceDateTo(date)}
                    dateFormat="dd. MM. yyyy"
                    locale={sl}
                    customInput={<CustomDateInput />}
                  />
                  {dateError && (
                    <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {dateError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="pt-4 border-t">
            <label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Opombe
            </label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="Sklic na naročilnico, dodatna pojasnila, način plačila..." 
              className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <CardTitle>Postavke računa</CardTitle>
          
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> Dodaj postavko
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Uredi postavko' : 'Nova postavka'}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Opis storitve - z autocomplete */}
                <div className="col-span-2 relative" ref={serviceDropdownRef}>
                  <label className="text-sm font-medium mb-1 block">Opis storitve *</label>
                  <div className="relative">
                    <div className="flex items-center border rounded-md px-3 py-2 bg-white">
                      <input
                        type="text"
                        placeholder="Vnesite opis storitve..."
                        value={newItem.description}
                        onChange={(e) => {
                          setNewItem({...newItem, description: e.target.value})
                          setShowServiceDropdown(true)
                        }}
                        onFocus={() => setShowServiceDropdown(true)}
                        className="flex-1 outline-none bg-transparent text-sm"
                      />
                      {newItem.description ? (
                        <X 
                          className="w-4 h-4 text-gray-400 ml-2 cursor-pointer hover:text-red-500 transition-colors flex-shrink-0" 
                          onClick={(e) => {
                            e.stopPropagation()
                            clearServiceSelection()
                          }}
                        />
                      ) : (
                        <ChevronDown 
                          className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${showServiceDropdown ? 'rotate-180' : ''} flex-shrink-0 cursor-pointer`}
                          onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                        />
                      )}
                    </div>
                    {showServiceDropdown && filteredServices.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredServices.map((service, index) => (
                          <div 
                            key={index}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 transition-colors"
                            onClick={() => {
                              setNewItem({
                                ...newItem,
                                description: service.description,
                                price: service.price,
                                unit: service.unit,
                                vatRate: service.vatRate
                              })
                              setShowServiceDropdown(false)
                            }}
                          >
                            <div className="font-medium text-gray-900">{service.description}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {service.price.toFixed(2)} € / {service.unit} • {service.vatRate}% DDV
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Količina *</label>
                  <NumberInput 
                    value={newItem.quantity || 1} 
                    onChange={(val: number) => setNewItem({...newItem, quantity: val})}
                    min={0}
                    step={0.5}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Merska enota *</label>
                  <Select value={newItem.unit} onValueChange={(val) => setNewItem({...newItem, unit: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ura">ura</SelectItem>
                      <SelectItem value="kos">kos</SelectItem>
                      <SelectItem value="dan">dan</SelectItem>
                      <SelectItem value="m²">m²</SelectItem>
                      <SelectItem value="kom">kom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Cena na enoto (brez DDV) *</label>
                  <NumberInput 
                    value={newItem.price || 0} 
                    onChange={(val: number) => setNewItem({...newItem, price: val})}
                    min={0}
                    step={5}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Stopnja DDV (%) *</label>
                  <Select 
                    value={String(newItem.vatRate)} 
                    onValueChange={(val) => {
                      // Pretvori string v številko (pazi na 9.5)
                      const numericValue = parseFloat(val)
                      setNewItem({
                        ...newItem, 
                        vatRate: numericValue as VatRate,
                        vatExemptionReason: numericValue === 0 ? '' : newItem.vatExemptionReason
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izberite stopnjo DDV" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22">22%</SelectItem>
                      <SelectItem value="9.5">9,5%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="0">0% (oprostitev DDV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Zakonska podlaga za 0% DDV */}
                {newItem.vatRate === 0 && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block">
                      Zakonska podlaga za oprostitev DDV *
                    </label>
                    <Select 
                      value={newItem.vatExemptionReason || ''} 
                      onValueChange={(val) => setNewItem({...newItem, vatExemptionReason: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Izberite zakonsko podlago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="91. člen ZDDV-1 – oprostitev pri izvozu">
                          91. člen ZDDV-1 – oprostitev pri izvozu
                        </SelectItem>
                        <SelectItem value="92. člen ZDDV-1 – oprostitev pri uvozu">
                          92. člen ZDDV-1 – oprostitev pri uvozu
                        </SelectItem>
                        <SelectItem value="94. člen ZDDV-1 – mednarodni prevoz">
                          94. člen ZDDV-1 – mednarodni prevoz
                        </SelectItem>
                        <SelectItem value="96. člen ZDDV-1 – nepremičnine">
                          96. člen ZDDV-1 – nepremičnine
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Popust na postavko */}
                <div className="col-span-2 border-t pt-3">
                  <div className="font-medium mb-2 text-sm">Popust na postavko</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Višina popusta (%)</label>
                      <NumberInput 
                        value={newItem.discountPercent || 0} 
                        onChange={(val: number) => {
                          if (val >= 0 && val <= 100) {
                            setNewItem({...newItem, discountPercent: val})
                          }
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Znesek popusta (€)</label>
                      <Input 
                        type="text" 
                        disabled 
                        value={(() => {
                          const qty = newItem.quantity || 0
                          const price = newItem.price || 0
                          const discountPercent = newItem.discountPercent || 0
                          const net = qty * price
                          const discountAmount = net * discountPercent / 100
                          return discountAmount.toFixed(2)
                        })()} 
                        className="bg-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Neto s popustom - prikaz */}
                <div className="col-span-2 bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Skupni znesek brez DDV za postavko (neto pred popustom)</label>
                      <div className="text-lg font-semibold">
                        {formatCurrency((newItem.quantity || 0) * (newItem.price || 0))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Neto s popustom (osnova za DDV)</label>
                      <div className="text-lg font-semibold text-primary">
                        {formatCurrency((() => {
                          const qty = newItem.quantity || 0
                          const price = newItem.price || 0
                          const discountPercent = newItem.discountPercent || 0
                          const net = qty * price
                          const discountAmount = net * discountPercent / 100
                          return net - discountAmount
                        })())}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Znesek DDV za postavko</label>
                      <div className="text-md font-medium">
                        {formatCurrency((() => {
                          const qty = newItem.quantity || 0
                          const price = newItem.price || 0
                          const discountPercent = newItem.discountPercent || 0
                          const net = qty * price
                          const discountAmount = net * discountPercent / 100
                          const netAfterDiscount = net - discountAmount
                          return netAfterDiscount * (newItem.vatRate || 0) / 100
                        })())}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Bruto znesek za postavko (skupaj z DDV)</label>
                      <div className="text-md font-bold text-green-600">
                        {formatCurrency((() => {
                          const qty = newItem.quantity || 0
                          const price = newItem.price || 0
                          const discountPercent = newItem.discountPercent || 0
                          const net = qty * price
                          const discountAmount = net * discountPercent / 100
                          const netAfterDiscount = net - discountAmount
                          const vat = netAfterDiscount * (newItem.vatRate || 0) / 100
                          return netAfterDiscount + vat
                        })())}
                      </div>
                    </div>
                  </div>
                </div>

{/* Geodetski podatki */}
<div className="col-span-2 border-t pt-3">
  <div className="font-medium mb-2 text-sm">Geodetski podatki (opcijsko)</div>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-sm font-medium mb-1 block">Številka parcele</label>
      <Input 
        placeholder="npr. 325/4" 
        value={newItem.parcelNumber || ''} 
        onChange={e => {
          // Dovoli: številke, poševnico (/), presledek, pomišljaj (-)
          const value = e.target.value.replace(/[^0-9/\-\s]/g, '')
          setNewItem({...newItem, parcelNumber: value})
        }} 
      />
    </div>
    <div>
      <label className="text-sm font-medium mb-1 block">Katastrska občina</label>
      <Input 
        placeholder="npr. 1434 Šiška" 
        value={newItem.cadastralMunicipality || ''} 
        onChange={e => setNewItem({...newItem, cadastralMunicipality: e.target.value})} 
      />
    </div>
    <div>
      <label className="text-sm font-medium mb-1 block">Ime katastra</label>
      <Input 
        placeholder="npr. Kataster stavb" 
        value={newItem.cadastreName || ''} 
        onChange={e => setNewItem({...newItem, cadastreName: e.target.value})} 
      />
    </div>
    <div>
      <label className="text-sm font-medium mb-1 block">ID zaznambe</label>
      <Input 
        placeholder="npr. 1434 325/4" 
        value={newItem.landRegisterId || ''} 
        onChange={e => {
          // Dovoli: številke, poševnico (/), presledek, pomišljaj (-)
          const value = e.target.value.replace(/[^0-9/\-\s]/g, '')
          setNewItem({...newItem, landRegisterId: value})
        }} 
      />
    </div>
  </div>
</div>

                {/* Opombe postavke */}
                <div className="col-span-2 border-t pt-3">
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Opombe k postavki
                  </label>
                  <textarea 
                    value={newItem.itemNote || ''} 
                    onChange={e => setNewItem({...newItem, itemNote: e.target.value})} 
                    placeholder="Dodatna pojasnila k tej postavki..." 
                    className="w-full min-h-[60px] px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                    rows={2}
                  />
                </div>
              </div>

              {/* Validacijsko sporočilo */}
              {(!newItem.description || !newItem.quantity || !newItem.price || (newItem.vatRate === 0 && !newItem.vatExemptionReason)) && (
                <div className="text-red-500 text-sm mt-2 text-center">
                  {!newItem.description && "Izpolnite opis storitve. "}
                  {!newItem.quantity && "Vnesite količino. "}
                  {!newItem.price && "Vnesite ceno. "}
                  {newItem.vatRate === 0 && !newItem.vatExemptionReason && "Izberite zakonsko podlago za 0% DDV."}
                </div>
              )}

              <DialogFooter>
                <Button variant="ghost" onClick={resetModal}>Prekliči</Button>
                <Button 
                  onClick={handleAddOrUpdateItem}
                  disabled={!newItem.description || !newItem.quantity || !newItem.price || (newItem.vatRate === 0 && !newItem.vatExemptionReason)}
                >
                  {editingItem ? 'Posodobi' : 'Dodaj'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opis storitve</TableHead>
                <TableHead className="text-right">Količina</TableHead>
                <TableHead>En.</TableHead>
                <TableHead className="text-right">Cena/enoto (€)</TableHead>
                <TableHead className="text-right">Popust %</TableHead>
                <TableHead className="text-right">Neto pred popustom</TableHead>
                <TableHead className="text-right">Neto s popustom</TableHead>
                <TableHead className="text-right">DDV %</TableHead>
                <TableHead className="text-right">Znesek DDV</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
  <div className="font-medium">{item.description}</div>
  {(item.parcelNumber || item.cadastralMunicipality || item.cadastreName || item.landRegisterId) && (
    <div className="text-xs text-gray-500 mt-1">
      {[
        item.parcelNumber && `št. parcele: ${item.parcelNumber}`,
        item.cadastralMunicipality && `kat.občina: ${item.cadastralMunicipality}`,
        item.cadastreName && `katastr: ${item.cadastreName}`,
        item.landRegisterId && `ID zaznambe: ${item.landRegisterId}`
      ].filter(Boolean).join(' | ')}
    </div>
  )}
  {item.reverseCharge && (
    <Badge variant="outline" className="mt-1 text-xs bg-yellow-50">Obrnjena DO</Badge>
  )}
  {item.itemNote && (
    <div className="text-xs text-gray-500 mt-1">{item.itemNote}</div>
  )}
  {item.vatRate === 0 && item.vatExemptionReason && (
    <div className="text-xs text-gray-500 mt-1">{item.vatExemptionReason}</div>
  )}
</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">{item.discountPercent || 0}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.netBeforeDiscount || item.net)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.net)}</TableCell>
                  <TableCell className="text-right">{item.vatRate}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.vatAmount)}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(item.gross)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => editItem(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-gray-400">
                    Ni postavk. Kliknite "Dodaj postavko".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end">
            <div className="w-96 space-y-2">
              {/* 26 - Skupni neto znesek (osnova za DDV – seštevek vseh postavk brez DDV) */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Skupni neto (brez popustov):</span>
                <span className="font-medium">{formatCurrency(totals.totalNetBeforeDiscount)}</span>
              </div>
              
              {/* Vsota popustov na postavke */}
              {totals.totalItemDiscounts > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Popusti na postavke skupaj:</span>
                  <span className="text-red-600">-{formatCurrency(totals.totalItemDiscounts)}</span>
                </div>
              )}
              
              {/* Neto po popustih na postavke */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Neto po popustih na postavke:</span>
                <span>{formatCurrency(totals.totalNetAfterItemDiscounts)}</span>
              </div>
              
              {/* 24 - Višina popusta na račun v % */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Popust na račun (%):</span>
                <div className="flex items-center gap-2">
                  <NumberInput 
                    value={discountPercent} 
                    onChange={(val: number) => setDiscountPercent(val)} 
                    className="w-24 text-right"
                    min={0}
                    max={100}
                    step={1}
                  />
                  <span>%</span>
                </div>
              </div>
              
              {/* 25 - Neto znesek po popustu (osnova za DDV) */}
              {discountPercent > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Znesek popusta na račun:</span>
                    <span className="text-red-600">-{formatCurrency(totals.invoiceDiscountAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-dashed">
                    <span className="font-medium">Neto po vseh popustih (osnova za DDV):</span>
                    <span className="font-medium">{formatCurrency(totals.finalNetBase)}</span>
                  </div>
                </>
              )}
              
              {/* 27 - DDV po stopnjah (posebej za vsako stopnjo) */}
              <div className="pt-2 border-t">
                <div className="text-xs font-medium text-gray-500 mb-1">DDV po stopnjah:</div>
                {Object.entries(totals.vatBreakdown).map(([rate, amount]) => (
                  amount > 0 && (
                    <div key={rate} className="flex justify-between text-sm">
                      <span className="text-gray-600">DDV stopnje {rate}%:</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  )
                ))}
              </div>
              
              {/* 27,5 - Skupni znesek DDV (vseh skupaj) */}
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-600">Skupni DDV:</span>
                <span className="font-medium">{formatCurrency(totals.totalVat)}</span>
              </div>
              
              {/* Vsota vseh popustov v € */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vsota vseh popustov (v €):</span>
                <span className="text-red-600">{formatCurrency(totals.totalItemDiscounts + totals.invoiceDiscountAmount)}</span>
              </div>
              
              {/* 28 - Skupni znesek za plačilo (z DDV) */}
              <div className="flex justify-between text-primary font-bold text-lg pt-2 border-t">
                <span>SKUPNI ZNESEK ZA PLAČILO (z DDV):</span>
                <span>{formatCurrency(totals.totalGross)}</span>
              </div>
              
              {/* Dodatno: Skupni znesek brez DDV (za informacijo) */}
              <div className="flex justify-between text-xs text-gray-400 pt-1">
                <span>Skupni znesek za plačilo (brez DDV):</span>
                <span>{formatCurrency(totals.finalNetBase)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => saveInvoice('draft')}>
          Shrani osnutek
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => saveInvoice('estimate')}
          disabled={!selectedCustomer || items.length === 0}
          title={!selectedCustomer ? "Izberite kupca" : items.length === 0 ? "Dodajte vsaj eno postavko" : ""}
        >
          Predračun
        </Button>
        <Button 
          onClick={() => saveInvoice('issued')}
          disabled={!isFormValid()}
          title={!isFormValid() ? "Izpolnite vse obvezne podatke in dodajte vsaj eno postavko" : ""}
        >
          Izdaj račun
        </Button>
      </div>
    </div>
  )
}