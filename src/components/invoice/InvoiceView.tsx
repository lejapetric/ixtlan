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
  name: 'Geodetski biro Kranj d.o.o.',
  address: 'Prešernova cesta 22, 4000 Kranj',
  taxId: 'SI78945612',
  registrationNumber: '65412378',
  trr: 'SI56 2900 0000 1234 567',
  bic: 'BKSI SI22',
  phone: '+386 4 123 4567',
  email: 'info@geodetstvo-kranj.si',
  bank: 'Banka Slovenije',
}

export function InvoiceView({ invoiceId, open, onClose }: InvoiceViewProps) {
  const { invoices, customers } = useInvoices()
  const invoice = invoices.find(inv => inv.id === invoiceId)
  const customer = invoice ? customers.find(c => c.id === invoice.customerId) : null
  const printRef = useRef<HTMLDivElement>(null)

  if (!invoice) return null

  // Calculate vat breakdown by rate
  const vatBreakdown: Record<number, { base: number; amount: number }> = { 22: { base: 0, amount: 0 }, 9.5: { base: 0, amount: 0 }, 5: { base: 0, amount: 0 }, 0: { base: 0, amount: 0 } }
  
  invoice.items.forEach(item => {
    const itemBase = item.net
    const discountShare = (invoice.discountPercent / 100) * itemBase
    const baseAfterDiscount = itemBase - discountShare
    vatBreakdown[item.vatRate].base += baseAfterDiscount
    vatBreakdown[item.vatRate].amount += baseAfterDiscount * (item.vatRate / 100)
  })

  // Calculate totals after discount
  const totalNetAfterDiscount = invoice.totalNet - (invoice.totalNet * invoice.discountPercent / 100)
  const totalVatAmount = Object.values(vatBreakdown).reduce((sum, v) => sum + v.amount, 0)
  const totalGrossAfterDiscount = totalNetAfterDiscount + totalVatAmount

  const qrData = `UPNQR
  
${companyData.name}
${companyData.address}
${companyData.trr}



${invoice.customerName}
${invoice.customerAddress || ''}, ${invoice.customerTaxId || ''}

${totalGrossAfterDiscount.toFixed(2)}
EUR
SI00 ${invoice.number}
Račun št. ${invoice.number}
`

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`

  const handlePrint = () => {
    if (!printRef.current) return
    const printWindow = window.open('', '_blank', 'height=900,width=900')
    if (!printWindow) return

    const styles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #1a1a1a; background: white; padding: 20px; }
      @media print { body { padding: 0; } .no-print { display: none; } }
      .invoice-container { max-width: 800px; margin: 0 auto; background: white; }
      .invoice-header { display: flex; justify-content: space-between; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #ddd; }
      .company-info h1 { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
      .company-info p { font-size: 9px; color: #555; margin: 2px 0; }
      .invoice-title { text-align: right; }
      .invoice-title .title { font-size: 22px; font-weight: bold; letter-spacing: 2px; }
      .invoice-title .number { font-size: 12px; margin-top: 5px; color: #555; }
      .two-columns { display: flex; justify-content: space-between; margin-bottom: 20px; }
      .info-box { flex: 1; }
      .info-box-label { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 5px; letter-spacing: 0.5px; }
      .info-box-content { font-size: 11px; }
      .info-box-content p { margin: 3px 0; }
      .status-badge { display: inline-block; padding: 3px 10px; background: #e8f5e9; color: #2e7d32; border-radius: 12px; font-size: 10px; font-weight: bold; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { text-align: left; padding: 10px 5px; background: #f5f5f5; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #555; border-bottom: 1px solid #ddd; }
      td { padding: 8px 5px; border-bottom: 1px solid #eee; font-size: 11px; }
      td:last-child, th:last-child { text-align: right; }
      td:nth-child(2), th:nth-child(2) { text-align: right; }
      td:nth-child(3), th:nth-child(3) { text-align: right; }
      td:nth-child(4), th:nth-child(4) { text-align: right; }
      .vat-summary { float: right; width: 280px; margin: 20px 0; }
      .vat-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 10px; border-bottom: 1px solid #eee; }
      .vat-total { font-weight: bold; border-top: 2px solid #333; padding-top: 8px; margin-top: 5px; }
      .payment-info { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; }
      .payment-grid { display: flex; justify-content: space-between; gap: 40px; }
      .payment-column { flex: 1; }
      .payment-label { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 5px; }
      .qr-container { text-align: center; }
      .qr-container img { width: 100px; height: 100px; }
      .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 8px; color: #999; text-align: center; }
      .clearfix { clear: both; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
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
        <div class="invoice-container">
          ${printRef.current.innerHTML}
        </div>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 250)
  }

  // Get customer address from customer object or use fallback
  const customerAddress = customer?.address || ''
  const customerTaxId = invoice.customerTaxId || (customer?.taxId || '')

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="flex flex-row justify-between items-center border-b pb-3">
          <DialogTitle className="text-gray-700">Račun {invoice.number}</DialogTitle>
          <div className="flex gap-2 no-print">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Natisni
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div ref={printRef} className="bg-white p-6">
          {/* Header */}
          <div className="invoice-header">
            <div className="company-info">
              <h1>{companyData.name}</h1>
              <p>{companyData.address}</p>
              <p>ID za DDV: {companyData.taxId} | Matična št.: {companyData.registrationNumber}</p>
              <p>TRR: {companyData.trr} | BIC: {companyData.bic}</p>
              <p>T: {companyData.phone} | E: {companyData.email}</p>
            </div>
            <div className="invoice-title">
              <div className="title">RAČUN</div>
              <div className="number">{invoice.number}</div>
            </div>
          </div>

          {/* Two column info */}
          <div className="two-columns">
            <div className="info-box">
              <div className="info-box-label">PREJEMNIK</div>
              <div className="info-box-content">
                <p><strong>{invoice.customerName}</strong></p>
                <p>{customerAddress}</p>
                {customerTaxId && <p>ID za DDV: {customerTaxId}</p>}
                {customer?.registrationNumber && <p>Matična št.: {customer.registrationNumber}</p>}
              </div>
            </div>
            <div className="info-box text-right">
              <div className="info-box-label">PODATKI RAČUNA</div>
              <div className="info-box-content">
                <p>Datum izdaje: {formatDate(invoice.issueDate)}</p>
                <p>Datum storitve: {formatDate(invoice.serviceDateFrom)} - {formatDate(invoice.serviceDateTo)}</p>
                <p>Datum zapadlosti: {formatDate(invoice.dueDate)}</p>
                <p>Rok plačila: {invoice.paymentTermDays} dni</p>
              </div>
              <div className="mt-2">
                <span className="status-badge">
                  {invoice.status === 'paid' ? 'PLAČANO' : invoice.status === 'overdue' ? 'ZAPADLO' : 'NE PORAVNANO'}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table>
            <thead>
              <tr>
                <th>Opis</th>
                <th class="text-right">Količina</th>
                <th class="text-right">Cena (€)</th>
                <th class="text-right">Popust</th>
                <th class="text-right">Neto (€)</th>
                <th class="text-right">DDV</th>
                <th class="text-right">Bruto (€)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map(item => {
                const itemDiscount = item.discountPercent || 0
                const itemNetAfterDiscount = item.net
                const itemGross = item.gross
                return (
                  <tr key={item.id}>
                    <td>
                      {item.description}
                      {item.parcelNumber && (
                        <div className="text-gray-400" style={{ fontSize: '9px', marginTop: '2px' }}>
                          Parcela {item.parcelNumber}
                          {item.cadastralMunicipality && `, k.o. ${item.cadastralMunicipality}`}
                        </div>
                      )}
                      {item.itemNote && (
                        <div className="text-gray-400" style={{ fontSize: '9px', marginTop: '2px' }}>
                          {item.itemNote}
                        </div>
                      )}
                    </td>
                    <td class="text-right">{item.quantity} {item.unit}</td>
                    <td class="text-right">{formatCurrency(item.price)}</td>
                    <td class="text-right">{itemDiscount > 0 ? `${itemDiscount}%` : '-'}</td>
                    <td class="text-right">{formatCurrency(itemNetAfterDiscount)}</td>
                    <td class="text-right">{item.vatRate}%</td>
                    <td class="text-right">{formatCurrency(itemGross)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* VAT Summary */}
          <div className="vat-summary">
            <div className="vat-row">
              <span>Skupaj neto pred popustom:</span>
              <span>{formatCurrency(invoice.totalNet)}</span>
            </div>
            {invoice.discountPercent > 0 && (
              <div className="vat-row">
                <span>Popust na račun ({invoice.discountPercent}%):</span>
                <span>- {formatCurrency(invoice.totalNet * invoice.discountPercent / 100)}</span>
              </div>
            )}
            <div className="vat-row">
              <span>Skupaj neto po popustu:</span>
              <span>{formatCurrency(totalNetAfterDiscount)}</span>
            </div>
            {Object.entries(vatBreakdown).map(([rate, data]) => 
              data.base > 0 && (
                <div key={rate} className="vat-row">
                  <span>DDV {rate}% (od {formatCurrency(data.base)}):</span>
                  <span>{formatCurrency(data.amount)}</span>
                </div>
              )
            )}
            <div className="vat-row vat-total">
              <span>SKUPAJ ZA PLAČILO (z DDV):</span>
              <span>{formatCurrency(totalGrossAfterDiscount)}</span>
            </div>
          </div>
          <div className="clearfix"></div>

          {/* Payment Info */}
          <div className="payment-info">
            <div className="payment-grid">
              <div className="payment-column">
                <div className="payment-label">PODATKI ZA PLAČILO</div>
                <p style={{ fontSize: '10px', margin: '3px 0' }}>IBAN: <strong>{companyData.trr}</strong></p>
                <p style={{ fontSize: '10px', margin: '3px 0' }}>Banka: {companyData.bank}</p>
                <p style={{ fontSize: '10px', margin: '3px 0' }}>BIC/SWIFT: {companyData.bic}</p>
                <p style={{ fontSize: '10px', margin: '3px 0' }}>Sklic: SI00 {invoice.number}</p>
                <p style={{ fontSize: '10px', margin: '3px 0' }}>Namen: Račun št. {invoice.number}</p>
              </div>
              <div className="payment-column">
                <div className="payment-label">NAČIN PLAČILA</div>
                <p style={{ fontSize: '10px', margin: '3px 0' }}>Bančno nakazilo</p>
                <p style={{ fontSize: '10px', margin: '3px 0' }}>Rok plačila: {formatDate(invoice.dueDate)}</p>
              </div>
              <div className="qr-container">
                <img src={qrCodeUrl} alt="UPN QR koda" />
                <p style={{ fontSize: '8px', color: '#999', marginTop: '5px' }}>Skenirajte za hitro plačilo</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.note && (
            <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
              <p style={{ fontSize: '9px', color: '#666' }}>
                <strong>Opombe:</strong> {invoice.note}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <p>Račun je izdan v skladu z Zakonom o davku na dodano vrednost (ZDDV-1).</p>
            <p>{companyData.name} • {companyData.address} • ID za DDV: {companyData.taxId} • TRR: {companyData.trr}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}