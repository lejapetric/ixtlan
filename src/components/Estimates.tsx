import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

// Mock predračuni (v realnosti bi jih hranili ločeno)
const mockEstimates = [
  { id: 'e1', number: 'PR-2026-0008', date: '2026-06-01', customer: 'Občina Kamnik', total: 4200, status: 'issued' },
  { id: 'e2', number: 'PR-2026-0007', date: '2026-05-20', customer: 'Gradnja Zupan d.o.o.', total: 1850, status: 'sent' },
]

export function Estimates() {
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
                    <Button size="sm" variant="secondary">Ustvari račun</Button>
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