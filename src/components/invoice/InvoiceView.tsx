import { useInvoices } from '@/hooks/useInvoices'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Printer, X } from 'lucide-react'
import { useRef } from 'react'

interface InvoiceViewProps {
  invoiceId: string | null
  open: boolean
  onClose: () => void
}

const companyData = {
  name: 'Geodetstvo Novak d.o.o.',
  address: 'Geodetska ulica 4, 1000 Ljubljana',
  taxId: 'SI12345678',
  trr: 'SI56 6100 0002 3456 789',
  phone: '+386 1 234 5678',
  email: 'info@geodetstvo-novak.si',
}

export function InvoiceView({ invoiceId, open, onClose }: InvoiceViewProps) {
  const { invoices, customers } = useInvoices()
  const invoice = invoices.find(inv => inv.id === invoiceId)
  const customer = invoice ? customers.find(c => c.id === invoice.customerId) : null
  const printRef = useRef<HTMLDivElement>(null)

  if (!invoice) return null

  const vatBreakdown: Record<number, number> = { 22: 0, 9.5: 0, 5: 0, 0: 0 }
  invoice.items.forEach(item => {
    const discountShare = (invoice.discountPercent / 100) * item.net
    const base = item.net - discountShare
    vatBreakdown[item.vatRate] += base * (item.vatRate / 100)
  })

  const qrData = `UPNQR
  
${companyData.name}
${companyData.address}
${companyData.trr}



${invoice.customerName}
${invoice.customerName}, ${invoice.customerTaxId || ''}

${invoice.totalGross.toFixed(2)}
EUR
SI00 ${invoice.number}
Račun št. ${invoice.number}
`

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`

  const handlePrint = () => {
    if (!printRef.current) return
    const printWindow = window.open('', '', 'height=900,width=900')
    if (!printWindow) return

    const styles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
      @media print { body { padding: 0; } .no-print { display: none; } }
      .invoice-box { max-width: 800px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 15px; }
      .header-left h1 { font-size: 20px; margin-bottom: 5px; }
      .header-info { font-size: 11px; line-height: 1.4; }
      .header-right { text-align: right; }
      .header-right-title { font-size: 18px; font-weight: bold; }
      .header-right-detail { font-size: 11px; }
      .section { margin-bottom: 15px; }
      .section-title { font-weight: bold; margin-bottom: 5px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f5f5f5; font-weight: bold; }
      td.number { text-align: right; }
      .summary { float: right; width: 350px; }
      .summary-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ddd; }
      .summary-total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
      .footer-section { clear: both; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; }
      .qr-section { text-align: center; }
      .qr-section img { width: 100px; height: 100px; }
      .footer-text { text-align: center; font-size: 9px; color: #999; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
    `

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Račun ${invoice.number}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="invoice-box">
          ${printRef.current.innerHTML}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 250)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle>Račun {invoice.number}</DialogTitle>
          <div className="flex gap-2 no-print">
            <Button size="sm" variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Natisni
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="bg-white p-6">
          <div className="header">
            <div>
              <h1 className="text-2xl font-bold">{companyData.name}</h1>
              <div className="header-info">
                <p>{companyData.address}</p>
                <p>ID za DDV: {companyData.taxId}</p>
                <p>TRR: {companyData.trr}</p>
                <p>T: {companyData.phone}</p>
                <p>E: {companyData.email}</p>
              </div>
            </div>
            <div className="header-right">
              <div className="header-right-title">RAČUN</div>
              <div className="header-right-detail">Številka: {invoice.number}</div>
              <div className="header-right-detail">Datum: {formatDate(invoice.issueDate)}</div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Prejemnik:</div>
            <p className="text-sm">{invoice.customerName}</p>
            <p className="text-sm text-gray-600">Davčna številka: {invoice.customerTaxId}</p>
            {customer && <p className="text-sm text-gray-600">{customer.address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm section">
            <div>
              <span className="font-semibold">Datum storitve:</span> {formatDate(invoice.serviceDateFrom)} – {formatDate(invoice.serviceDateTo)}
            </div>
            <div>
              <span className="font-semibold">Datum zapadlosti:</span> {formatDate(invoice.dueDate)}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Opis</th>
                <th className="text-right">Količina</th>
                <th className="text-right">Cena (€)</th>
                <th className="text-right">DDV %</th>
                <th className="text-right">Neto (€)</th>
                <th className="text-right">Bruto (€)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map(item => (
                <tr key={item.id}>
                  <td>
                    {item.description}
                    {item.parcelNumber && (
                      <div className="text-xs text-gray-500">
                        Parcela {item.parcelNumber}, k.o. {item.cadastralMunicipality}
                      </div>
                    )}
                  </td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{formatCurrency(item.price)}</td>
                  <td className="text-right">{item.vatRate}%</td>
                  <td className="text-right">{formatCurrency(item.net)}</td>
                  <td className="text-right">{formatCurrency(item.gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary">
            <div className="summary-row">
              <span>Skupaj neto:</span>
              <span>{formatCurrency(invoice.totalNet)}</span>
            </div>
            {invoice.discountPercent > 0 && (
              <div className="summary-row">
                <span>Popust ({invoice.discountPercent}%):</span>
                <span>- {formatCurrency((invoice.totalNet * invoice.discountPercent) / 100)}</span>
              </div>
            )}
            <div className="summary-row font-medium">
              <span>Osnova za DDV:</span>
              <span>{formatCurrency(invoice.totalNet - (invoice.totalNet * invoice.discountPercent) / 100)}</span>
            </div>
            {Object.entries(vatBreakdown).map(([rate, amount]) =>
              amount > 0 ? (
                <div key={rate} className="summary-row">
                  <span>DDV {rate}%:</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              ) : null
            )}
            <div className="summary-row summary-total">
              <span>SKUPAJ BRUTO:</span>
              <span>{formatCurrency(invoice.totalGross)}</span>
            </div>
          </div>

          <div className="footer-section">
            <div className="text-sm max-w-md">
              <p>
                <span className="font-semibold">Opombe:</span> {invoice.note || 'Brez opomb.'}
              </p>
              <p className="mt-2">Račun je potrebno plačati v roku 30 dni. Hvala za sodelovanje.</p>
            </div>
            <div className="qr-section">
              <img src={qrCodeUrl} alt="UPN QR koda" />
              <div className="text-xs text-gray-500 mt-1">UPN QR koda</div>
            </div>
          </div>

          <div className="footer-text">
            Geodetstvo Novak d.o.o. • TRR: {companyData.trr} • ID za DDV: {companyData.taxId}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
