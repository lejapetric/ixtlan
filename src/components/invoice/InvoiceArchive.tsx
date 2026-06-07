import { useState } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Eye, Mail, CheckCircle, Trash2, Pencil } from 'lucide-react'
import { Invoice } from '@/types'
import { InvoiceView } from './InvoiceView'

const statusLabels = {
  draft: 'Osnutek',
  issued: 'Izdan',
  sent: 'Poslan',
  overdue: 'Zapadlo',
  paid: 'Plačano',
  cancelled: 'Stornirano',
}
const statusColors = {
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

export function InvoiceArchive({ onEditInvoice }: InvoiceArchiveProps) {
  const { invoices, deleteInvoice } = useInvoices()
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  const filterInvoices = (statusFilter?: string) => {
    return invoices.filter(inv => {
      if (search && !inv.number.includes(search) && !inv.customerName.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter && inv.status !== statusFilter) return false
      if (dateFrom && inv.issueDate < dateFrom) return false
      if (dateTo && inv.issueDate > dateTo) return false
      return true
    })
  }

  const filteredAll = filterInvoices()
  const filteredIssued = filterInvoices('issued')
  const filteredDrafts = filterInvoices('draft')
  const filteredPaid = filterInvoices('paid')
  const filteredOverdue = filterInvoices('overdue')

  const renderTable = (invoiceList: Invoice[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Številka</TableHead><TableHead>Datum</TableHead><TableHead>Kupec</TableHead>
          <TableHead className="text-right">Neto</TableHead><TableHead className="text-right">Bruto</TableHead>
          <TableHead>Status</TableHead><TableHead>Zapadlost</TableHead><TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoiceList.map(inv => (
          <TableRow key={inv.id} className={inv.status === 'overdue' ? 'bg-red-50' : ''}>
            <TableCell className="font-mono">{inv.number}</TableCell>
            <TableCell>{formatDate(inv.issueDate)}</TableCell>
            <TableCell>{inv.customerName}</TableCell>
            <TableCell className="text-right">{formatCurrency(inv.totalNet)}</TableCell>
            <TableCell className="text-right">{formatCurrency(inv.totalGross)}</TableCell>
            <TableCell><Badge className={statusColors[inv.status]}>{statusLabels[inv.status]}</Badge></TableCell>
            <TableCell>{formatDate(inv.dueDate)}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" title="Prikaži račun" onClick={() => setSelectedInvoiceId(inv.id)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" title="Pošlji"><Mail className="w-4 h-4" /></Button>
                {inv.status === 'draft' && (
                  <>
                    <Button size="sm" variant="ghost" title="Uredi" onClick={() => onEditInvoice(inv)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" title="Izbriši" onClick={() => { if (confirm('Izbriši osnutek?')) deleteInvoice(inv.id) }}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                  </>
                )}
                {inv.status !== 'paid' && inv.status !== 'draft' && <Button size="sm" variant="ghost" title="Označi plačano"><CheckCircle className="w-4 h-4" /></Button>}
              </div>
            </TableCell>
          </TableRow>
        ))}
        {invoiceList.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-gray-400">Ni zadetkov.</TableCell></TableRow>}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Arhiv računov</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input placeholder="Številka ali kupec" value={search} onChange={e => setSearch(e.target.value)} />
            <Input type="date" placeholder="Datum od" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <Input type="date" placeholder="Datum do" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="flex gap-2 mb-4">
            <Button size="sm"><Search className="w-4 h-4 mr-1" /> Išči</Button>
            <Button size="sm" variant="secondary">Izvoz Excel</Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
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

      <InvoiceView invoiceId={selectedInvoiceId} open={!!selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
    </div>
  )
}