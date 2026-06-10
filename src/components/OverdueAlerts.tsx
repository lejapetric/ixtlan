import { useState } from 'react'
import { useInvoices } from '@/hooks/useInvoices'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Mail, CheckCircle, Eye, AlertCircle, Clock } from 'lucide-react'
import { InvoiceView } from './invoice/InvoiceView'

export function OverdueAlerts() {
  const { invoices, updateInvoice } = useInvoices()
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  
  const overdue = invoices.filter(inv => inv.status === 'overdue')
  const totalOverdue = overdue.reduce((sum, inv) => sum + inv.totalGross, 0)

  const handleMarkAsPaid = (invoiceId: string) => {
    if (confirm('Ali ste prepričani, da želite označiti ta račun kot plačan?')) {
      updateInvoice(invoiceId, { 
        status: 'paid',
        paidAt: new Date().toISOString()
      })
    }
  }

  const handleSendReminder = (invoice: any) => {
    alert(`Opomin za račun ${invoice.number} poslan na email naslov kupca ${invoice.customerName}.`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zapadli računi</h1>
        <p className="text-sm text-gray-500 mt-1">Pregled in upravljanje zapadlih računov</p>
      </div>

      {overdue.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-gray-500">Ni zapadlih računov</p>
            <p className="text-sm text-gray-400 mt-1">Vsi računi so plačani ali še niso zapadli</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Info Banner */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <span className="font-medium text-red-800">
                    {overdue.length} zapadlih računov
                  </span>
                  <span className="text-red-600 ml-2">
                    Skupaj: {formatCurrency(totalOverdue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overdue Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Seznam zapadlih računov</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Številka</TableHead>
                      <TableHead>Kupec</TableHead>
                      <TableHead className="text-right">Znesek</TableHead>
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
                          <TableCell>
                            <div>{inv.customerName}</div>
                            <div className="text-xs text-gray-500">{inv.customerTaxId}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(inv.totalGross)}
                          </TableCell>
                          <TableCell>{formatDate(inv.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              <Clock className="w-3 h-3 mr-1" />
                              {daysLate} dni
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                title="Prikaži račun"
                                onClick={() => setSelectedInvoiceId(inv.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={() => handleSendReminder(inv)}
                              >
                                <Mail className="w-4 h-4 mr-1" /> Opomin
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleMarkAsPaid(inv.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Plačano
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Invoice View Modal */}
      <InvoiceView 
        invoiceId={selectedInvoiceId} 
        open={!!selectedInvoiceId} 
        onClose={() => setSelectedInvoiceId(null)} 
      />
    </div>
  )
}