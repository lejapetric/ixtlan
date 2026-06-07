import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User } from '@/types'

const mockUsers: User[] = [
  { id: 'u1', name: 'Maja Novak', email: 'maja@geodetstvo.si', role: 'tajnistvo', active: true },
  { id: 'u2', name: 'Igor Žagar', email: 'igor@geodetstvo.si', role: 'direktor', active: true },
  { id: 'u3', name: 'Ana Kuhar', email: 'ana@geodetstvo.si', role: 'projektant', active: true },
]

export function UserManagement() {
  const [users] = useState(mockUsers)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Upravljanje uporabnikov</h1>
        <Button>+ Nov uporabnik</Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ime in priimek</TableHead>
                <TableHead>E-pošta</TableHead>
                <TableHead>Vloga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {user.role === 'tajnistvo' ? 'Tajništvo' : user.role === 'direktor' ? 'Direktor' : user.role === 'projektant' ? 'Projektant' : 'Zunanji'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={user.active ? 'bg-green-100 text-green-800' : 'bg-gray-200'}>
                      {user.active ? 'Aktiven' : 'Neaktiven'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">✎</Button>
                      <Button size="sm" variant="ghost" className="text-red-600">⊠</Button>
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