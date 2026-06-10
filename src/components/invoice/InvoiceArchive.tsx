import { useState, useRef, useEffect } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Eye, Mail, CheckCircle, Trash2, Pencil, X, ChevronDown, Calendar, DollarSign, Percent, Clock, Filter, Send, Ban } from 'lucide-react'
import { Invoice, InvoiceStatus } from '@/types'
import { InvoiceView } from './InvoiceView'
import { NewInvoice } from './NewInvoice'
import DatePicker from 'react-datepicker'
import { sl } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

const statusLabels: Record<InvoiceStatus, string> = {
  draft: 'Osnutek',
  issued: 'Izdan',
  sent: 'Poslan',
  overdue: 'Zapadlo',
  paid: 'Plačano',
  cancelled: 'Stornirano',
}
const statusColors: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-300 text-gray-800',
  issued: 'bg-blue-100 text-blue-800',
  sent: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-400',
}

interface InvoiceArchiveProps {
  onEditInvoice: (invoice: Invoice) => void
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

// Number input component
const NumberInput = ({ value, onChange, placeholder, className = "" }: any) => (
  <Input 
    type="number" 
    placeholder={placeholder}
    value={value} 
    onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
    className={className}
  />
)

export function InvoiceArchive({ onEditInvoice }: InvoiceArchiveProps) {
  const { invoices, deleteInvoice, updateInvoice, customers } = useInvoices()
  
  // Search states
  const [searchNumber, setSearchNumber] = useState('')
  const [selectedNumber, setSelectedNumber] = useState('')
  const [isNumberDropdownOpen, setIsNumberDropdownOpen] = useState(false)
  const numberDropdownRef = useRef<HTMLDivElement>(null)
  
  const [searchCustomer, setSearchCustomer] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; taxId: string } | null>(null)
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const customerDropdownRef = useRef<HTMLDivElement>(null)
  
  const [searchMunicipality, setSearchMunicipality] = useState('')
  const [selectedMunicipality, setSelectedMunicipality] = useState('')
  const [isMunicipalityDropdownOpen, setIsMunicipalityDropdownOpen] = useState(false)
  const municipalityDropdownRef = useRef<HTMLDivElement>(null)
  
  // Price filters
  const [priceMin, setPriceMin] = useState<number | ''>('')
  const [priceMax, setPriceMax] = useState<number | ''>('')
  
  // Discount filters
  const [discountMin, setDiscountMin] = useState<number | ''>('')
  const [discountMax, setDiscountMax] = useState<number | ''>('')
  
  // Date states
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [dueDateFrom, setDueDateFrom] = useState<Date | null>(null)
  const [dueDateTo, setDueDateTo] = useState<Date | null>(null)
  
  // Date errors
  const [dateFromToError, setDateFromToError] = useState('')
  const [dueDateFromToError, setDueDateFromToError] = useState('')
  
  // Status filter
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | 'all'>('all')
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  
  const [activeTab, setActiveTab] = useState('all')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Email modal states
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  
  // Cancel modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelInvoice, setCancelInvoice] = useState<Invoice | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingInvoiceData, setEditingInvoiceData] = useState<Invoice | null>(null)

  // Helper function to format date for comparison
  function formatDateForCompare(date: Date | null): string {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Validate dates
  useEffect(() => {
    if (dateFrom && dateTo && dateTo < dateFrom) {
      setDateFromToError('Datum "do" ne more biti pred datumom "od"')
    } else {
      setDateFromToError('')
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    if (dueDateFrom && dueDateTo && dueDateTo < dueDateFrom) {
      setDueDateFromToError('Datum "do" ne more biti pred datumom "od"')
    } else {
      setDueDateFromToError('')
    }
  }, [dueDateFrom, dueDateTo])

  // Get unique values from invoices
  const uniqueNumbers = Array.from(new Map(invoices.map(inv => [inv.number, inv.number])).entries())
    .map(([number]) => ({ number }))
    .filter(item => item.number.toLowerCase().includes(searchNumber.toLowerCase()))

  const uniqueCustomers = Array.from(new Map(
    invoices.map(inv => {
      return [inv.customerId, { id: inv.customerId, name: inv.customerName, taxId: inv.customerTaxId }]
    })
  ).entries()).map(([_, customer]) => customer)
  .filter(customer => 
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.taxId.toLowerCase().includes(searchCustomer.toLowerCase())
  )

  const uniqueMunicipalities = Array.from(new Set(
    invoices.map(inv => {
      const customer = customers.find(c => c.id === inv.customerId)
      const address = customer?.address || ''
      const parts = address.split(',')
      const municipality = parts.length > 1 ? parts[parts.length - 1].trim() : address.trim()
      return municipality
    })
  )).filter(m => m.toLowerCase().includes(searchMunicipality.toLowerCase()))

  const statusOptions: { value: InvoiceStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Vsi' },
    { value: 'draft', label: 'Osnutki' },
    { value: 'issued', label: 'Izdani' },
    { value: 'sent', label: 'Poslani' },
    { value: 'overdue', label: 'Zapadli' },
    { value: 'paid', label: 'Plačani' },
    { value: 'cancelled', label: 'Stornirani' },
  ]

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (numberDropdownRef.current && !numberDropdownRef.current.contains(event.target as Node)) {
        setIsNumberDropdownOpen(false)
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false)
      }
      if (municipalityDropdownRef.current && !municipalityDropdownRef.current.contains(event.target as Node)) {
        setIsMunicipalityDropdownOpen(false)
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const clearNumberSelection = () => {
    setSelectedNumber('')
    setSearchNumber('')
    setIsNumberDropdownOpen(false)
  }

  const clearCustomerSelection = () => {
    setSelectedCustomer(null)
    setSearchCustomer('')
    setIsCustomerDropdownOpen(false)
  }

  const clearMunicipalitySelection = () => {
    setSelectedMunicipality('')
    setSearchMunicipality('')
    setIsMunicipalityDropdownOpen(false)
  }

  const clearAllFilters = () => {
    clearNumberSelection()
    clearCustomerSelection()
    clearMunicipalitySelection()
    setPriceMin('')
    setPriceMax('')
    setDiscountMin('')
    setDiscountMax('')
    setDateFrom(null)
    setDateTo(null)
    setDueDateFrom(null)
    setDueDateTo(null)
    setSelectedStatus('all')
    setDateFromToError('')
    setDueDateFromToError('')
  }

  const filterInvoices = (statusFilter?: string) => {
    return invoices.filter(inv => {
      if (selectedNumber && inv.number !== selectedNumber) return false
      if (selectedCustomer && inv.customerId !== selectedCustomer.id) return false
      if (selectedMunicipality) {
        const customer = customers.find(c => c.id === inv.customerId)
        const address = customer?.address || ''
        const parts = address.split(',')
        const municipality = parts.length > 1 ? parts[parts.length - 1].trim() : address.trim()
        if (!municipality.toLowerCase().includes(selectedMunicipality.toLowerCase())) return false
      }
      if (priceMin !== '' && inv.totalGross < priceMin) return false
      if (priceMax !== '' && inv.totalGross > priceMax) return false
      if (discountMin !== '' && inv.discountPercent < discountMin) return false
      if (discountMax !== '' && inv.discountPercent > discountMax) return false
      const dateFromStr = formatDateForCompare(dateFrom)
      const dateToStr = formatDateForCompare(dateTo)
      if (dateFromStr && inv.issueDate < dateFromStr) return false
      if (dateToStr && inv.issueDate > dateToStr) return false
      const dueFromStr = formatDateForCompare(dueDateFrom)
      const dueToStr = formatDateForCompare(dueDateTo)
      if (dueFromStr && inv.dueDate < dueFromStr) return false
      if (dueToStr && inv.dueDate > dueToStr) return false
      if (selectedStatus !== 'all' && inv.status !== selectedStatus) return false
      if (statusFilter && inv.status !== statusFilter) return false
      return true
    })
  }

  const filteredAll = filterInvoices()
  const filteredIssued = filterInvoices('issued')
  const filteredDrafts = filterInvoices('draft')
  const filteredPaid = filterInvoices('paid')
  const filteredOverdue = filterInvoices('overdue')

  // Email modal handlers
  const openEmailModal = (invoice: Invoice) => {
    setEmailInvoice(invoice)
    setEmailSubject(`Račun ${invoice.number} - GeoFaktura`)
    setEmailBody(`Spoštovani,\n\nV priponki vam pošiljamo račun št. ${invoice.number} z dne ${formatDate(invoice.issueDate)} v skupnem znesku ${formatCurrency(invoice.totalGross)}.\n\nProsimo, da račun poravnate v roku ${invoice.paymentTermDays} dni.\n\nLep pozdrav,\nGeoFaktura tim`)
    setEmailModalOpen(true)
  }

  const handleSendEmail = () => {
    if (!emailInvoice) return
    
    // Simulate sending email
    alert(`E-pošta poslana na naslov kupca ${emailInvoice.customerName}\n\nZadeva: ${emailSubject}\n\nVsebina: ${emailBody}\n\nPriloga: Racun_${emailInvoice.number}.pdf`)
    
    // Update invoice status to 'sent'
    updateInvoice(emailInvoice.id, { status: 'sent', sentAt: new Date().toISOString() })
    
    setEmailModalOpen(false)
    setEmailInvoice(null)
  }

  // Cancel modal handlers
  const openCancelModal = (invoice: Invoice) => {
    setCancelInvoice(invoice)
    setCancelReason('')
    setCancelModalOpen(true)
  }

  const handleCancelInvoice = () => {
    if (!cancelInvoice) return
    if (!cancelReason.trim()) {
      alert('Prosimo, vnesite razlog za stornacijo!')
      return
    }
    
    updateInvoice(cancelInvoice.id, { 
      status: 'cancelled',
      cancelledReason: cancelReason
    })
    
    setCancelModalOpen(false)
    setCancelInvoice(null)
    setCancelReason('')
  }

  // Edit modal handlers
  const openEditModal = (invoice: Invoice) => {
    setEditingInvoiceData(invoice)
    setEditModalOpen(true)
  }

  const handleEditComplete = () => {
    setEditModalOpen(false)
    setEditingInvoiceData(null)
  }

  // Mark as paid
  const handleMarkAsPaid = (invoiceId: string) => {
    if (confirm('Ali ste prepričani, da želite označiti ta račun kot plačan?')) {
      updateInvoice(invoiceId, { 
        status: 'paid',
        paidAt: new Date().toISOString()
      })
    }
  }

  const renderTable = (invoiceList: Invoice[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[100px]">Številka</TableHead>
            <TableHead className="min-w-[100px]">Datum</TableHead>
            <TableHead className="min-w-[150px]">Kupec</TableHead>
            <TableHead className="min-w-[100px]">Občina</TableHead>
            <TableHead className="text-right min-w-[100px]">Neto</TableHead>
            <TableHead className="text-right min-w-[100px]">DDV</TableHead>
            <TableHead className="text-right min-w-[100px]">Bruto</TableHead>
            <TableHead className="text-right min-w-[80px]">Popust %</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="min-w-[100px]">Zapadlost</TableHead>
            <TableHead className="min-w-[180px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoiceList.map(inv => {
            const daysLate = inv.status === 'overdue' ? Math.floor((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24)) : 0
            const customer = customers.find(c => c.id === inv.customerId)
            const address = customer?.address || ''
            const parts = address.split(',')
            const municipality = parts.length > 1 ? parts[parts.length - 1].trim() : address.trim()
            
            return (
              <TableRow key={inv.id} className={inv.status === 'overdue' ? 'bg-red-50' : ''}>
                <TableCell className="font-mono">{inv.number}</TableCell>
                <TableCell>{formatDate(inv.issueDate)}</TableCell>
                <TableCell>
                  <div className="font-medium">{inv.customerName}</div>
                  <div className="text-xs text-gray-500">{inv.customerTaxId}</div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{municipality}</TableCell>
                <TableCell className="text-right">{formatCurrency(inv.totalNet)}</TableCell>
                <TableCell className="text-right">{formatCurrency(inv.totalVat)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(inv.totalGross)}</TableCell>
                <TableCell className="text-right">{inv.discountPercent}%</TableCell>
                <TableCell><Badge className={statusColors[inv.status]}>{statusLabels[inv.status]}</Badge></TableCell>
                <TableCell>
                  {formatDate(inv.dueDate)}
                  {inv.status === 'overdue' && (
                    <div className="text-xs text-red-500">{daysLate} dni zamude</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {/* Edit button - for drafts only or replace view */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      title="Uredi račun"
                      onClick={() => openEditModal(inv)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    
                    {/* Send email button */}
                    {(inv.status === 'issued' || inv.status === 'overdue') && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        title="Pošlji po e-pošti"
                        onClick={() => openEmailModal(inv)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Mark as paid button */}
                    {inv.status !== 'paid' && inv.status !== 'draft' && inv.status !== 'cancelled' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        title="Označi plačano"
                        onClick={() => handleMarkAsPaid(inv.id)}
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                    
                    {/* Cancel/Storno button */}
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && inv.status !== 'draft' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        title="Storniraj račun"
                        onClick={() => openCancelModal(inv)}
                      >
                        <Ban className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                    
                    {/* Delete button - only for drafts */}
                    {inv.status === 'draft' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        title="Izbriši"
                        onClick={() => { if (confirm('Izbriši osnutek?')) deleteInvoice(inv.id) }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {invoiceList.length === 0 && (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-gray-400 py-8">
                Ni zadetkov.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Arhiv računov</h1>
        <Button 
          variant="default" 
          size="default"
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-2" />
          {showFilters ? 'Skrij napredne filtre' : 'Pokaži napredne filtre'}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Basic search row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Številka računa</label>
              <div className="relative" ref={numberDropdownRef}>
                <div className="flex items-center border rounded-md px-3 py-2 bg-white hover:border-gray-400 cursor-pointer">
                  <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Številka računa..."
                    value={searchNumber}
                    onChange={(e) => {
                      setSearchNumber(e.target.value)
                      setIsNumberDropdownOpen(true)
                      if (e.target.value === '') setSelectedNumber('')
                    }}
                    className="flex-1 outline-none bg-transparent text-sm"
                    onFocus={() => setIsNumberDropdownOpen(true)}
                  />
                  {selectedNumber ? (
                    <X className="w-4 h-4 text-gray-400 ml-2 cursor-pointer hover:text-red-500" onClick={clearNumberSelection} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${isNumberDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
                {isNumberDropdownOpen && uniqueNumbers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {uniqueNumbers.map(inv => (
                      <div key={inv.number} className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => { setSelectedNumber(inv.number); setSearchNumber(inv.number); setIsNumberDropdownOpen(false) }}>
                        <div className="font-mono">{inv.number}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Kupec (naziv ali davčna)</label>
              <div className="relative" ref={customerDropdownRef}>
                <div className="flex items-center border rounded-md px-3 py-2 bg-white hover:border-gray-400 cursor-pointer">
                  <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Išči po nazivu ali davčni..."
                    value={searchCustomer}
                    onChange={(e) => {
                      setSearchCustomer(e.target.value)
                      setIsCustomerDropdownOpen(true)
                      if (e.target.value === '') setSelectedCustomer(null)
                    }}
                    className="flex-1 outline-none bg-transparent text-sm"
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                  />
                  {selectedCustomer ? (
                    <X className="w-4 h-4 text-gray-400 ml-2 cursor-pointer hover:text-red-500" onClick={clearCustomerSelection} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
                {isCustomerDropdownOpen && uniqueCustomers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {uniqueCustomers.map(customer => (
                      <div key={customer.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => { setSelectedCustomer(customer); setSearchCustomer(`${customer.name} (${customer.taxId})`); setIsCustomerDropdownOpen(false) }}>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">Davčna: {customer.taxId}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Občina kupca</label>
              <div className="relative" ref={municipalityDropdownRef}>
                <div className="flex items-center border rounded-md px-3 py-2 bg-white hover:border-gray-400 cursor-pointer">
                  <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Občina..."
                    value={searchMunicipality}
                    onChange={(e) => {
                      setSearchMunicipality(e.target.value)
                      setIsMunicipalityDropdownOpen(true)
                      if (e.target.value === '') setSelectedMunicipality('')
                    }}
                    className="flex-1 outline-none bg-transparent text-sm"
                    onFocus={() => setIsMunicipalityDropdownOpen(true)}
                  />
                  {selectedMunicipality ? (
                    <X className="w-4 h-4 text-gray-400 ml-2 cursor-pointer hover:text-red-500" onClick={clearMunicipalitySelection} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${isMunicipalityDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
                {isMunicipalityDropdownOpen && uniqueMunicipalities.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {uniqueMunicipalities.map(municipality => (
                      <div key={municipality} className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => { setSelectedMunicipality(municipality); setSearchMunicipality(municipality); setIsMunicipalityDropdownOpen(false) }}>
                        <div>{municipality}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Advanced filters */}
          {showFilters && (
            <div className="space-y-4 mb-4 pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> Znesek (bruto) od
                  </label>
                  <NumberInput placeholder="Minimalni znesek €" value={priceMin} onChange={setPriceMin} />
                  <label className="text-sm font-medium mt-2 mb-1 block flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> Znesek (bruto) do
                  </label>
                  <NumberInput placeholder="Maksimalni znesek €" value={priceMax} onChange={setPriceMax} />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Percent className="w-4 h-4" /> Popust % od
                  </label>
                  <NumberInput placeholder="Minimalni popust %" value={discountMin} onChange={setDiscountMin} />
                  <label className="text-sm font-medium mt-2 mb-1 block flex items-center gap-1">
                    <Percent className="w-4 h-4" /> Popust % do
                  </label>
                  <NumberInput placeholder="Maksimalni popust %" value={discountMax} onChange={setDiscountMax} />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Status računa</label>
                  <div className="relative" ref={statusDropdownRef}>
                    <div className="flex items-center border rounded-md px-3 py-2 bg-white cursor-pointer"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
                      <span className="flex-1 text-sm">{statusOptions.find(s => s.value === selectedStatus)?.label}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    {isStatusDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                        {statusOptions.map(option => (
                          <div key={option.value} className="p-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => { setSelectedStatus(option.value); setIsStatusDropdownOpen(false) }}>
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Datum izdaje od
                  </label>
                  <DatePicker
                    selected={dateFrom}
                    onChange={setDateFrom}
                    dateFormat="dd. MM. yyyy"
                    locale={sl}
                    customInput={<CustomDateInput />}
                    placeholderText="Izberite datum od"
                  />
                  <label className="text-sm font-medium mt-2 mb-1 block flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Datum izdaje do
                  </label>
                  <DatePicker
                    selected={dateTo}
                    onChange={setDateTo}
                    dateFormat="dd. MM. yyyy"
                    locale={sl}
                    customInput={<CustomDateInput />}
                    placeholderText="Izberite datum do"
                  />
                  {dateFromToError && <div className="text-xs text-red-500 mt-1">{dateFromToError}</div>}
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Datum zapadlosti od
                  </label>
                  <DatePicker
                    selected={dueDateFrom}
                    onChange={setDueDateFrom}
                    dateFormat="dd. MM. yyyy"
                    locale={sl}
                    customInput={<CustomDateInput />}
                    placeholderText="Izberite datum od"
                  />
                  <label className="text-sm font-medium mt-2 mb-1 block flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Datum zapadlosti do
                  </label>
                  <DatePicker
                    selected={dueDateTo}
                    onChange={setDueDateTo}
                    dateFormat="dd. MM. yyyy"
                    locale={sl}
                    customInput={<CustomDateInput />}
                    placeholderText="Izberite datum do"
                  />
                  {dueDateFromToError && <div className="text-xs text-red-500 mt-1">{dueDateFromToError}</div>}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button size="sm" variant="secondary" onClick={clearAllFilters}>
              Počisti vse filtre
            </Button>
            <Button size="sm" variant="secondary">Izvoz Excel</Button>
            <Button size="sm" variant="secondary">Izvoz PDF</Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 overflow-x-auto">
              <TabsTrigger value="all">Vsi ({filteredAll.length})</TabsTrigger>
              <TabsTrigger value="issued">Izdani ({filteredIssued.length})</TabsTrigger>
              <TabsTrigger value="drafts">Osnutki ({filteredDrafts.length})</TabsTrigger>
              <TabsTrigger value="paid">Plačani ({filteredPaid.length})</TabsTrigger>
              <TabsTrigger value="overdue">Zapadli ({filteredOverdue.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderTable(filteredAll)}</TabsContent>
            <TabsContent value="issued">{renderTable(filteredIssued)}</TabsContent>
            <TabsContent value="drafts">{renderTable(filteredDrafts)}</TabsContent>
            <TabsContent value="paid">{renderTable(filteredPaid)}</TabsContent>
            <TabsContent value="overdue">{renderTable(filteredOverdue)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Email Modal */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pošlji račun po e-pošti</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Prejemnik</label>
              <Input value={emailInvoice?.customerName || ''} disabled className="bg-gray-100" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Zadeva</label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Sporočilo</label>
              <Textarea 
                value={emailBody} 
                onChange={(e) => setEmailBody(e.target.value)} 
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">Priloga:</p>
              <p>Račun_{emailInvoice?.number}.pdf</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailModalOpen(false)}>Prekliči</Button>
            <Button onClick={handleSendEmail}>
              <Send className="w-4 h-4 mr-2" />
              Pošlji račun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel/Storno Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Storniraj račun</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Številka računa</label>
              <Input value={cancelInvoice?.number || ''} disabled className="bg-gray-100" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Razlog za stornacijo *</label>
              <Textarea 
                value={cancelReason} 
                onChange={(e) => setCancelReason(e.target.value)} 
                placeholder="Vpišite razlog za stornacijo računa..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>Prekliči</Button>
            <Button variant="destructive" onClick={handleCancelInvoice}>
              <Ban className="w-4 h-4 mr-2" />
              Storniraj račun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Urejanje računa</DialogTitle>
          </DialogHeader>
          {editingInvoiceData && (
            <NewInvoice 
              editingInvoice={editingInvoiceData} 
              clearEditing={handleEditComplete}
            />
          )}
        </DialogContent>
      </Dialog>

      <InvoiceView invoiceId={selectedInvoiceId} open={!!selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
    </div>
  )
}