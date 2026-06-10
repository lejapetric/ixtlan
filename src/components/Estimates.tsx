import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useInvoices } from '@/hooks/useInvoices'
import { Plus, FileText, CheckCircle, Clock } from 'lucide-react'

// Mock predračuni (v realnosti bi jih hranili ločeno)
const mockEstimates = [
  { id: 'e1', number: 'PR-2026-0008', date: '2026-06-01', customer: 'Občina Kamnik', customerId: 'c1', total: 4200, status: 'issued', validUntil: '2026-07-01' },
  { id: 'e2', number: 'PR-2026-0007', date: '2026-05-20', customer: 'Gradnja Zupan d.o.o.', customerId: 'c2', total: 1850, status: 'sent', validUntil: '2026-06-20' },
  { id: 'e3', number: 'PR-2026-0009', date: '2026-06-10', customer: 'Občina Kranj', customerId: 'c4', total: 3100, status: 'converted', validUntil: '2026-07-10' },
  { id: 'e4', number: 'PR-2026-0006', date: '2026-05-01', customer: 'Marles d.o.o.', customerId: 'c5', total: 5600, status: 'expired', validUntil: '2026-06-01' },
]

interface EstimatesProps {
  onNewEstimate?: () => void
  setActiveView?: (view: string) => void
}

export function Estimates({ onNewEstimate, setActiveView }: EstimatesProps) {
  const { addInvoice } = useInvoices()
  const [estimates, setEstimates] = useState(mockEstimates)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge className="bg-blue-100 text-blue-800">Izdan</Badge>
      case 'sent':
        return <Badge className="bg-green-100 text-green-800">Poslan</Badge>
      case 'converted':
        return <Badge className="bg-purple-100 text-purple-800">Spremenjen v račun</Badge>
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Potečen</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleNewEstimate = () => {
    if (setActiveView) {
      setActiveView('new-invoice')
    }
    if (onNewEstimate) {
      onNewEstimate()
    }
  }

  const convertToInvoice = (estimate: any) => {
    if (estimate.status === 'converted') {
      alert('Ta predračun je že bil spremenjen v račun!')
      return
    }
    if (estimate.status === 'expired') {
      alert('Ta predračun je potekel! Ustvarite novega.')
      return
    }

    const newInvoice = {
      id: crypto.randomUUID(),
      number: `2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
      customerId: estimate.customerId,
      customerName: estimate.customer,
      customerTaxId: '12345678',
      issueDate: new Date().toISOString().split('T')[0],
      serviceDateFrom: new Date().toISOString().split('T')[0],
      serviceDateTo: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paymentTermDays: 30,
      items: [],
      discountPercent: 0,
      totalNet: estimate.total,
      totalVat: estimate.total * 0.22,
      totalGross: estimate.total * 1.22,
      vatBreakdown: { 22: estimate.total * 0.22, 9.5: 0, 5: 0, 0: 0 },
      status: 'issued' as const,
      note: `Na podlagi predračuna ${estimate.number}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addInvoice(newInvoice as any)
    
    // Update estimate status
    setEstimates(prev => prev.map(est => 
      est.id === estimate.id ? { ...est, status: 'converted' } : est
    ))
    
    alert(`Račun ${newInvoice.number} uspešno ustvarjen iz predračuna ${estimate.number}`)
  }

  const isConvertible = (status: string) => {
    return status === 'issued' || status === 'sent'
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Predračuni</h1>
          <p className="text-sm text-gray-500 mt-1">Pregled in upravljanje vseh predračunov</p>
        </div>
        <Button onClick={handleNewEstimate} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nov predračun
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {estimates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Ni shranjenih predračunov</p>
              <Button variant="link" onClick={handleNewEstimate} className="mt-2">
                Ustvari prvega
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Številka</TableHead>
                    <TableHead className="min-w-[100px]">Datum</TableHead>
                    <TableHead className="min-w-[150px]">Kupec</TableHead>
                    <TableHead className="text-right min-w-[100px]">Vrednost (€)</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Velja do</TableHead>
                    <TableHead className="min-w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map(est => {
                    const expired = isExpired(est.validUntil)
                    const showConvertButton = isConvertible(est.status) && !expired
                    
                    return (
                      <TableRow key={est.id} className={expired ? 'bg-gray-50' : ''}>
                        <TableCell className="font-mono">{est.number}</TableCell>
                        <TableCell>{formatDate(est.date)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{est.customer}</div>
                          <div className="text-xs text-gray-500">{est.customerId}</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(est.total)}</TableCell>
                        <TableCell>{getStatusBadge(est.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className={expired ? 'text-red-500' : 'text-gray-600'}>
                              {formatDate(est.validUntil)}
                            </span>
                          </div>
                          {expired && <div className="text-xs text-red-500">POTEČEN</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {showConvertButton && (
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={() => convertToInvoice(est)}
                                className="whitespace-nowrap"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Ustvari račun
                              </Button>
                            )}
                            {est.status === 'converted' && (
                              <Badge className="bg-purple-100 text-purple-800 whitespace-nowrap">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Račun ustvarjen
                              </Badge>
                            )}
                            {est.status === 'expired' && (
                              <Badge className="bg-gray-100 text-gray-800 whitespace-nowrap">
                                Ni več veljaven
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Informacije o predračunih</p>
              <p className="text-xs mt-1">
                Predračun nima pravne veljave. Ko ustvarite račun iz predračuna, se predračun označi kot "Spremenjen v račun"
                in ga ni več mogoče ponovno uporabiti. Predračuni so veljavni 30 dni.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}