import { useState } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, FileText, Download, Mail, CheckCircle, XCircle } from 'lucide-react'

const statusLabels = {
  draft: 'Osnutek',
  issued: 'Izdan',
  sent: 'Poslan',
  overdue: 'Zapadlo',
  paid: 'Plačano',
  cancelled: 'Stornirano',
}
const statusColors = {
  draft: 'bg-gray-200',
  issued: 'bg-blue-100 text-blue-800',
  sent: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-400',
}

export function InvoiceArchive() {
  const { invoices } = useInvoices()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = invoices.filter(inv => {
    if (search && !inv.number.includes(search) && !inv.customerName.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && inv.status !== statusFilter) return false
    if (dateFrom && inv.issueDate < dateFrom) return false
    if (dateTo && inv.issueDate > dateTo) return false
    return true
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Arhiv računov</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Input placeholder="Številka ali kupec" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="border rounded p-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Vsi statusi</option>
              {Object.entries(statusLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
            <Input type="date" placeholder="Datum od" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <Input type="date" placeholder="Datum do" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="flex gap-2 mb-4">
            <Button size="sm"><Search className="w-4 h-4 mr-1" /> Išči</Button>
            <Button size="sm" variant="secondary">Izvoz Excel</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Številka</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Kupec</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Zapadlost</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(inv => (
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
                      <Button size="sm" variant="ghost" title="PDF"><FileText className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" title="Pošlji"><Mail className="w-4 h-4" /></Button>
                      {inv.status !== 'paid' && <Button size="sm" variant="ghost" title="Označi plačano"><CheckCircle className="w-4 h-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}