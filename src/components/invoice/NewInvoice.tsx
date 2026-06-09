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
import { Plus, Trash2, Edit, Search, ChevronDown, Building2, MapPin, Mail, Phone, FileText as FileIcon, Calendar, DollarSign, AlertCircle, ReceiptText, X } from 'lucide-react'
import DatePicker from 'react-datepicker'
import { sl } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

interface NewInvoiceProps {
  editingInvoice?: Invoice | null
  clearEditing?: () => void
}

export function NewInvoice({ editingInvoice, clearEditing }: NewInvoiceProps) {
  const { customers, addInvoice, updateInvoice } = useInvoices()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [discountPercent, setDiscountPercent] = useState(0)
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
    parcelNumber: '',
    cadastralMunicipality: '',
    cadastreName: '',
    landRegisterId: '',
  })

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
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

  const calculateItemTotals = (item: Partial<InvoiceItem>) => {
    const qty = item.quantity || 0
    const price = item.price || 0
    const net = qty * price
    const vatAmount = net * (item.vatRate || 0) / 100
    const gross = net + vatAmount
    return { net, vatAmount, gross }
  }

  const handleAddOrUpdateItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.price) return
    const { net, vatAmount, gross } = calculateItemTotals(newItem)
    const fullItem: InvoiceItem = {
      id: editingItem?.id || crypto.randomUUID(),
      description: newItem.description,
      quantity: newItem.quantity!,
      unit: newItem.unit || 'ura',
      price: newItem.price!,
      vatRate: newItem.vatRate as VatRate,
      net,
      vatAmount,
      gross,
      parcelNumber: newItem.parcelNumber,
      cadastralMunicipality: newItem.cadastralMunicipality,
      cadastreName: newItem.cadastreName,
      landRegisterId: newItem.landRegisterId,
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
      parcelNumber: '',
      cadastralMunicipality: '',
      cadastreName: '',
      landRegisterId: '',
    })
  }

  const editItem = (item: InvoiceItem) => {
    setEditingItem(item)
    setNewItem({ ...item })
    setModalOpen(true)
  }

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  const calculateTotals = () => {
    let netTotal = items.reduce((sum, i) => sum + i.net, 0)
    const discountAmount = netTotal * (discountPercent / 100)
    const baseForVat = netTotal - discountAmount
    const vatBreakdown: Record<VatRate, number> = { 22: 0, 9.5: 0, 5: 0, 0: 0 }
    items.forEach(item => {
      const itemNet = item.net
      const discountShare = discountPercent / 100 * itemNet
      const base = itemNet - discountShare
      vatBreakdown[item.vatRate] += base * (item.vatRate / 100)
    })
    const totalVat = Object.values(vatBreakdown).reduce((a,b) => a+b, 0)
    const totalGross = baseForVat + totalVat
    return { netTotal, discountAmount, baseForVat, vatBreakdown, totalVat, totalGross }
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
      totalNet: totals.baseForVat,
      totalVat: totals.totalVat,
      totalGross: totals.totalGross,
      vatBreakdown: totals.vatBreakdown,
      status: status === 'estimate' ? 'draft' : status,
      note,
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
        className="cursor-pointer bg-white pr-20"
      />
      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Invoice Number Header - More Prominent */}
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
          {/* Responsive two-column layout */}
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
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Dates Section - Grid 2x2 */}
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
                  dateFormat="dd.MM.yyyy"
                  locale={sl}
                  customInput={<CustomDateInput />}
                  className="w-full"
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
                  dateFormat="dd.MM.yyyy"
                  locale={sl}
                  customInput={<CustomDateInput />}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Datum storitve od *</label>
                <DatePicker
                  selected={serviceDateFrom}
                  onChange={(date: Date | null) => setServiceDateFrom(date)}
                  dateFormat="dd.MM.yyyy"
                  locale={sl}
                  customInput={<CustomDateInput />}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Datum storitve do *</label>
                <DatePicker
                  selected={serviceDateTo}
                  onChange={(date: Date | null) => setServiceDateTo(date)}
                  dateFormat="dd.MM.yyyy"
                  locale={sl}
                  customInput={<CustomDateInput />}
                  className="w-full"
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

          {/* Notes Section - Full Width */}
          <div className="pt-4 border-t">
            <label className="text-sm font-medium mb-2 block flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Opombe
            </label>
            <Input 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="Sklic na naročilnico, dodatna pojasnila, način plačila..." 
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <CardTitle>Postavke računa</CardTitle>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Dodaj postavko</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingItem ? 'Uredi postavko' : 'Nova postavka'}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2"><label>Opis storitve *</label><Input value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} /></div>
                <div><label>Količina</label><Input type="number" step="0.01" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} /></div>
                <div><label>Enota</label><Input value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} /></div>
                <div><label>Cena / enoto (€)</label><Input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} /></div>
                <div><label>DDV stopnja (%)</label>
                  <Select value={String(newItem.vatRate)} onValueChange={(val) => setNewItem({...newItem, vatRate: parseInt(val) as VatRate})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="22">22%</SelectItem><SelectItem value="9.5">9,5%</SelectItem><SelectItem value="5">5%</SelectItem><SelectItem value="0">0%</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 border-t pt-2">
                  <div className="font-medium mb-2">Geodetski podatki (opcijsko)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Številka parcele" value={newItem.parcelNumber || ''} onChange={e => setNewItem({...newItem, parcelNumber: e.target.value})} />
                    <Input placeholder="Katastrska občina" value={newItem.cadastralMunicipality || ''} onChange={e => setNewItem({...newItem, cadastralMunicipality: e.target.value})} />
                    <Input placeholder="Ime katastra" value={newItem.cadastreName || ''} onChange={e => setNewItem({...newItem, cadastreName: e.target.value})} />
                    <Input placeholder="ID zaznambe" value={newItem.landRegisterId || ''} onChange={e => setNewItem({...newItem, landRegisterId: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={resetModal}>Prekliči</Button><Button onClick={handleAddOrUpdateItem}>{editingItem ? 'Posodobi' : 'Dodaj'}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Opis</TableHead><TableHead className="text-right">Kol.</TableHead><TableHead>Enota</TableHead><TableHead className="text-right">Cena</TableHead><TableHead className="text-right">DDV %</TableHead><TableHead className="text-right">Neto</TableHead><TableHead className="text-right">Bruto</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}{item.parcelNumber && <Badge variant="secondary" className="ml-2 text-xs">Parcela {item.parcelNumber}</Badge>}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell><TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">{item.vatRate}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.net)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.gross)}</TableCell>
                  <TableCell><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => editItem(item)}><Edit className="w-4 h-4" /></Button><Button size="sm" variant="ghost" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4" /></Button></div></TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-gray-400">Ni postavk. Kliknite "Dodaj postavko".</TableCell></TableRow>}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between"><span>Skupaj neto:</span><span className="font-medium">{formatCurrency(totals.netTotal)}</span></div>
              <div className="flex justify-between items-center"><span>Popust (%)</span><Input type="number" value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} className="w-24 text-right" step="1" /></div>
              <div className="flex justify-between text-primary font-bold text-lg pt-2 border-t"><span>SKUPNI ZNESEK (BRUTO):</span><span>{formatCurrency(totals.totalGross)}</span></div>
              <div className="text-xs text-gray-500">
                DDV 22%: {formatCurrency(totals.vatBreakdown[22])}<br />
                DDV 9,5%: {formatCurrency(totals.vatBreakdown[9.5])}<br />
                DDV 5%: {formatCurrency(totals.vatBreakdown[5])}<br />
                DDV 0%: {formatCurrency(totals.vatBreakdown[0])}
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
