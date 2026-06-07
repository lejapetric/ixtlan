import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useInvoices } from '@/hooks/useInvoices'

// Mock predračuni (v realnosti bi jih hranili ločeno)
const mockEstimates = [
  { id: 'e1', number: 'PR-2026-0008', date: '2026-06-01', customer: 'Občina Kamnik', customerId: 'c1', total: 4200, status: 'issued' },
  { id: 'e2', number: 'PR-2026-0007', date: '2026-05-20', customer: 'Gradnja Zupan d.o.o.', customerId: 'c2', total: 1850, status: 'sent' },
]

export function Estimates() {
  const { addInvoice } = useInvoices()

  const convertToInvoice = (estimate: any) => {
    const newInvoice = {
      id: crypto.randomUUID(),
      number: `2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      customerId: estimate.customerId || 'c1',
      customerName: estimate.customer,
      customerTaxId: '12345678',
      issueDate: new Date().toISOString().split('T')[0],
      serviceDateFrom: new Date().toISOString().split('T')[0],
      serviceDateTo: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
      paymentTermDays: 30,
      items: [],
      discountPercent: 0,
      totalNet: estimate.total,
      totalVat: estimate.total * 0.22,
      totalGross: estimate.total * 1.22,
      vatBreakdown: { 22: estimate.total * 0.22, 9.5: 0, 5: 0, 0: 0 },
      status: 'issued' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addInvoice(newInvoice as any)
    alert(`Račun ${newInvoice.number} ustvarjen iz predračuna ${estimate.number}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Predračuni</h1>
        <Button>Nov predračun</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Številka</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Kupec</TableHead>
                <TableHead className="text-right">Vrednost (€)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEstimates.map(est => (
                <TableRow key={est.id}>
                  <TableCell className="font-mono">{est.number}</TableCell>
                  <TableCell>{formatDate(est.date)}</TableCell>
                  <TableCell>{est.customer}</TableCell>
                  <TableCell className="text-right">{formatCurrency(est.total)}</TableCell>
                  <TableCell><Badge>{est.status === 'issued' ? 'Izdan' : 'Poslan'}</Badge></TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => convertToInvoice(est)}>Ustvari račun</Button>
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