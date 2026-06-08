import { useState, useEffect } from 'react'
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
import { Plus, Trash2, Edit } from 'lucide-react'

interface NewInvoiceProps {
  editingInvoice?: Invoice | null
  clearEditing?: () => void
}

export function NewInvoice({ editingInvoice, clearEditing }: NewInvoiceProps) {
  const { customers, services, addInvoice, updateInvoice } = useInvoices()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [serviceDateFrom, setServiceDateFrom] = useState(new Date().toISOString().split('T')[0])
  const [serviceDateTo, setServiceDateTo] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null)

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

  // Naloži podatke, če urejamo obstoječi osnutek
  useEffect(() => {
    if (editingInvoice) {
      const cust = customers.find(c => c.id === editingInvoice.customerId)
      setSelectedCustomer(cust || null)
      setItems(editingInvoice.items)
      setDiscountPercent(editingInvoice.discountPercent)
      setIssueDate(editingInvoice.issueDate)
      setServiceDateFrom(editingInvoice.serviceDateFrom)
      setServiceDateTo(editingInvoice.serviceDateTo)
      setNote(editingInvoice.note || '')
    }
  }, [editingInvoice, customers])

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

  const saveInvoice = (status: 'draft' | 'issued') => {
    if (!selectedCustomer) return alert('Izberite kupca!')
    if (items.length === 0) return alert('Dodajte vsaj eno postavko!')

    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 30)

    const invoiceData = {
      id: editingInvoice?.id || crypto.randomUUID(),
      number: editingInvoice?.number || (status === 'issued' ? `2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}` : 'OSNUTEK'),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerTaxId: selectedCustomer.taxId,
      issueDate,
      serviceDateFrom,
      serviceDateTo,
      dueDate: dueDate.toISOString().split('T')[0],
      paymentTermDays: 30,
      items,
      discountPercent,
      totalNet: totals.baseForVat,
      totalVat: totals.totalVat,
      totalGross: totals.totalGross,
      vatBreakdown: totals.vatBreakdown,
      status,
      note,
      createdAt: editingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, invoiceData)
      alert(`Osnutek ${editingInvoice.number} posodobljen.`)
    } else {
      addInvoice(invoiceData as any)
      alert(status === 'draft' ? 'Osnutek shranjen.' : `Račun ${invoiceData.number} uspešno izdan!`)
    }

    // Počisti formo
    setSelectedCustomer(null)
    setItems([])
    setDiscountPercent(0)
    setNote('')
    setIssueDate(new Date().toISOString().split('T')[0])
    setServiceDateFrom(new Date().toISOString().split('T')[0])
    setServiceDateTo(new Date().toISOString().split('T')[0])
    if (clearEditing) clearEditing()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{editingInvoice ? 'Uredi račun' : 'Nov račun'}</h1>
        <div className="text-sm text-gray-500">{editingInvoice ? editingInvoice.number : 'Številka: dodeli ob izdaji'}</div>
      </div>

      <Card>
        <CardHeader><CardTitle>Podatki o računu</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Kupec *</label>
              <Select value={selectedCustomer?.id} onValueChange={(val) => {
                const cust = customers.find(c => c.id === val)
                setSelectedCustomer(cust || null)
              }}>
                <SelectTrigger><SelectValue placeholder="Izberite kupca" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.taxId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Datum izdaje</label><Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
              <div><label className="text-sm font-medium">Rok plačila (dni)</label><Input type="text" value="30" disabled className="bg-gray-100" /></div>
            </div>
            <div><label className="text-sm font-medium">Datum storitve od</label><Input type="date" value={serviceDateFrom} onChange={e => setServiceDateFrom(e.target.value)} /></div>
            <div><label className="text-sm font-medium">Datum storitve do</label><Input type="date" value={serviceDateTo} onChange={e => setServiceDateTo(e.target.value)} /></div>
            <div className="md:col-span-2"><label className="text-sm font-medium">Opombe</label><Input value={note} onChange={e => setNote(e.target.value)} placeholder="Sklic na naročilnico..." /></div>
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
        <Button variant="secondary" onClick={() => saveInvoice('draft')}>Shrani osnutek</Button>
        <Button variant="secondary">Predračun</Button>
        <Button onClick={() => saveInvoice('issued')}>Izdaj račun</Button>
      </div>
    </div>
  )
}
