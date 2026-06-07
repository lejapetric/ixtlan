import { Bell, User } from 'lucide-react'

export function Topbar() {
  return (
    <div className="h-12 border-b bg-white px-6 flex items-center justify-between">
      <h1 className="text-sm font-medium">GeoFaktura</h1>
      <div className="flex items-center gap-3">
        <Bell className="w-4 h-4 text-gray-500" />
        <User className="w-4 h-4 text-gray-500" />
        <span className="text-sm">Maja Novak</span>
      </div>
    </div>
  )
}