import { useInvoices } from '@/hooks/useInvoices'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Mail, CheckCircle } from 'lucide-react'

export function OverdueAlerts() {
  const { invoices } = useInvoices()
  const overdue = invoices.filter(inv => inv.status === 'overdue')
  const totalOverdue = overdue.reduce((sum, inv) => sum + inv.totalGross, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Zapadli računi – opozorila</h1>
      {overdue.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">Ni zapadlih računov. 👍</CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-red-700 font-semibold">
                ⚠️ {overdue.length} računov je zapadlih. Skupaj {formatCurrency(totalOverdue)}.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Seznam zapadlih računov</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Številka</TableHead>
                    <TableHead>Kupec</TableHead>
                    <TableHead className="text-right">Znesek (bruto)</TableHead>
                    <TableHead>Datum zapadlosti</TableHead>
                    <TableHead>Dni zamude</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue.map(inv => {
                    const daysLate = Math.floor((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24))
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono">{inv.number}</TableCell>
                        <TableCell>{inv.customerName}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">{formatCurrency(inv.totalGross)}</TableCell>
                        <TableCell>{formatDate(inv.dueDate)}</TableCell>
                        <TableCell>{daysLate} dni</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="secondary"><Mail className="w-4 h-4 mr-1" /> Opomin</Button>
                            <Button size="sm" variant="default"><CheckCircle className="w-4 h-4 mr-1" /> Plačano</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
