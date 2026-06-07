import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sistemske nastavitve</h1>
      <Card>
        <CardHeader>
          <CardTitle>Podatki podjetja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">Naziv podjetja</label><Input defaultValue="Geodetstvo Novak d.o.o." /></div>
            <div><label className="text-sm font-medium">Davčna številka</label><Input defaultValue="SI12345678" /></div>
            <div className="md:col-span-2"><label className="text-sm font-medium">Naslov</label><Input defaultValue="Geodetska ulica 4, 1000 Ljubljana" /></div>
            <div><label className="text-sm font-medium">TRR (IBAN)</label><Input defaultValue="SI56 6100 0002 3456 789" /></div>
            <div><label className="text-sm font-medium">Telefon</label><Input defaultValue="+386 1 234 5678" /></div>
            <div><label className="text-sm font-medium">E-pošta</label><Input defaultValue="info@geodetstvo-novak.si" /></div>
            <div><label className="text-sm font-medium">Rok plačila (dni)</label><Input type="number" defaultValue="30" /></div>
            <div><label className="text-sm font-medium">Format sklica UPN</label><Input defaultValue="SI00 {leto}-{stevilka}" /></div>
          </div>
          <Button>Shrani nastavitve</Button>
        </CardContent>
      </Card>
    </div>
  )
}