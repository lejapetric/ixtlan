import { useState, useRef, useEffect } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, X, ChevronDown, Calendar, DollarSign, Percent, Clock, Download, FileText, PieChart, Euro, Printer, CheckCircle, AlertCircle } from 'lucide-react'
import { Invoice, InvoiceStatus } from '@/types'
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

export function Reports() {
  const { invoices, customers } = useInvoices()
  
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
  
  // Report state
  const [showReport, setShowReport] = useState(false)
  const [reportType, setReportType] = useState<'list' | 'analysis'>('list')
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])

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
    setShowReport(false)
  }

  const applyFilters = () => {
    const filtered = invoices.filter(inv => {
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
      return true
    })
    setFilteredInvoices(filtered)
    setShowReport(true)
  }

  // Calculate statistics for analysis
  const calculateStats = () => {
    const totalGross = filteredInvoices.reduce((sum, inv) => sum + inv.totalGross, 0)
    const totalNet = filteredInvoices.reduce((sum, inv) => sum + inv.totalNet, 0)
    const totalVat = filteredInvoices.reduce((sum, inv) => sum + inv.totalVat, 0)
    const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + (inv.totalNet * inv.discountPercent / 100), 0)
    const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.totalGross, 0)
    const overdueAmount = filteredInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.totalGross, 0)
    
    const byStatus: Record<string, { count: number; amount: number }> = {}
    filteredInvoices.forEach(inv => {
      if (!byStatus[inv.status]) {
        byStatus[inv.status] = { count: 0, amount: 0 }
      }
      byStatus[inv.status].count++
      byStatus[inv.status].amount += inv.totalGross
    })
    
    const byCustomer: Record<string, { name: string; count: number; amount: number }> = {}
    filteredInvoices.forEach(inv => {
      if (!byCustomer[inv.customerId]) {
        byCustomer[inv.customerId] = { name: inv.customerName, count: 0, amount: 0 }
      }
      byCustomer[inv.customerId].count++
      byCustomer[inv.customerId].amount += inv.totalGross
    })
    
    return { totalGross, totalNet, totalVat, totalDiscount, paidAmount, overdueAmount, byStatus, byCustomer }
  }

  const stats = calculateStats()

  // Export to Excel (CSV)
  const exportToExcel = () => {
    const headers = ['Številka', 'Datum', 'Kupec', 'Davčna', 'Neto', 'DDV', 'Bruto', 'Popust %', 'Status', 'Zapadlost']
    const rows = filteredInvoices.map(inv => [
      inv.number,
      formatDate(inv.issueDate),
      inv.customerName,
      inv.customerTaxId,
      inv.totalNet,
      inv.totalVat,
      inv.totalGross,
      inv.discountPercent,
      statusLabels[inv.status],
      formatDate(inv.dueDate)
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `porocilo_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to PDF (print)
  const exportToPDF = () => {
    window.print()
  }

  const renderReportList = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Številka</TableHead>
            <TableHead>Datum</TableHead>
            <TableHead>Kupec</TableHead>
            <TableHead className="text-right">Neto</TableHead>
            <TableHead className="text-right">DDV</TableHead>
            <TableHead className="text-right">Bruto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Zapadlost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInvoices.map(inv => (
            <TableRow key={inv.id}>
              <TableCell className="font-mono">{inv.number}</TableCell>
              <TableCell>{formatDate(inv.issueDate)}</TableCell>
              <TableCell>{inv.customerName}</TableCell>
              <TableCell className="text-right">{formatCurrency(inv.totalNet)}</TableCell>
              <TableCell className="text-right">{formatCurrency(inv.totalVat)}</TableCell>
              <TableCell className="text-right font-semibold">{formatCurrency(inv.totalGross)}</TableCell>
              <TableCell><Badge className={inv.status === 'overdue' ? 'bg-red-100 text-red-800' : ''}>{statusLabels[inv.status]}</Badge></TableCell>
              <TableCell>{formatDate(inv.dueDate)}</TableCell>
            </TableRow>
          ))}
          {filteredInvoices.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                Ni zadetkov za izbrane kriterije.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  const renderAnalysis = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Skupaj bruto</p>
                <p className="text-2xl font-bold text-blue-800">{formatCurrency(stats.totalGross)}</p>
              </div>
              <Euro className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Plačano</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(stats.paidAmount)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Zapadlo neplačano</p>
                <p className="text-2xl font-bold text-red-800">{formatCurrency(stats.overdueAmount)}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Število računov</p>
                <p className="text-2xl font-bold text-purple-800">{filteredInvoices.length}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Po statusih</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.byStatus).map(([status, data]) => (
              <div key={status} className="flex justify-between items-center p-2 border-b">
                <span className="font-medium">{statusLabels[status as InvoiceStatus]}</span>
                <div className="flex gap-4">
                  <span>{data.count} računov</span>
                  <span className="font-semibold">{formatCurrency(data.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Customer Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Po kupcih (top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.byCustomer)
              .sort((a, b) => b[1].amount - a[1].amount)
              .slice(0, 10)
              .map(([_, customer]) => (
                <div key={customer.name} className="flex justify-between items-center p-2 border-b">
                  <span className="font-medium">{customer.name}</span>
                  <div className="flex gap-4">
                    <span>{customer.count} računov</span>
                    <span className="font-semibold">{formatCurrency(customer.amount)}</span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Poročila in analize</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtri za poročilo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic search row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
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
          
          <div className="flex gap-2 flex-wrap pt-4">
            <Button onClick={applyFilters} className="bg-primary hover:bg-primary/90">
              <Search className="w-4 h-4 mr-2" />
              Prikaži poročilo
            </Button>
            <Button variant="secondary" onClick={clearAllFilters}>
              Počisti filtre
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results - only shown after clicking "Prikaži poročilo" */}
      {showReport && (
        <Card>
          <CardHeader className="flex-row justify-between items-center flex-wrap gap-2">
            <CardTitle>Rezultati poročila</CardTitle>
            <div className="flex gap-2">
              <Button size="md" variant="outline" onClick={() => setReportType('list')}>
                <FileText className="w-4 h-4 mr-1" /> Seznam
              </Button>
              <Button size="md" variant="outline" onClick={() => setReportType('analysis')}>
                <PieChart className="w-4 h-4 mr-1" /> Analiza
              </Button>
              <Button size="md" variant="outline" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-1" /> Excel
              </Button>
              <Button size="md" variant="outline" onClick={exportToPDF}>
                <Printer className="w-4 h-4 mr-1" /> PDF / Natisni
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reportType === 'list' ? renderReportList() : renderAnalysis()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}