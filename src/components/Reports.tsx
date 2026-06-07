import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function Reports() {
  const [reportType, setReportType] = useState('issued')
  const [dateFrom, setDateFrom] = useState('2026-01-01')
  const [dateTo, setDateTo] = useState('2026-12-31')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Poročila in izpisi</h1>
      <Card>
        <CardHeader>
          <CardTitle>Generiranje poročila</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Vrsta poročila</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="issued">Seznam izdanih računov za obdobje</SelectItem>
                  <SelectItem value="unpaid">Neplačani računi</SelectItem>
                  <SelectItem value="overdue">Zapadli računi</SelectItem>
                  <SelectItem value="byCustomer">Zbirno po kupcih</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Datum od</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Datum do</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Kupec (opcijsko)</label>
              <Input placeholder="Vsi kupci" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button>Prikaži na zaslonu</Button>
            <Button variant="secondary">Izvoz Excel</Button>
            <Button variant="secondary">Izvoz PDF</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}