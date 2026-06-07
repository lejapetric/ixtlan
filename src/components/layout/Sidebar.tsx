import { cn } from '@/lib/utils'
import { FileText, Archive, AlertCircle, Receipt, BarChart3, Users, Settings } from 'lucide-react'

const navItems = [
  { id: 'new-invoice', label: 'Nov račun', icon: FileText, roles: ['tajnistvo', 'projektant'] },
  { id: 'archive', label: 'Arhiv računov', icon: Archive, roles: ['tajnistvo', 'direktor', 'projektant'] },
  { id: 'estimates', label: 'Predračuni', icon: Receipt, roles: ['tajnistvo'] },
  { id: 'reports', label: 'Poročila', icon: BarChart3, roles: ['tajnistvo', 'direktor'] },
  { id: 'overdue', label: 'Zapadli računi', icon: AlertCircle, roles: ['tajnistvo'] },
  { id: 'users', label: 'Uporabniki', icon: Users, roles: ['admin'] },
  { id: 'settings', label: 'Nastavitve', icon: Settings, roles: ['admin'] },
]

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
  userRole: string
}

export function Sidebar({ activeView, setActiveView, userRole }: SidebarProps) {
  return (
    <aside className="w-64 bg-primary text-primary-foreground flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/20">
        <div className="font-bold text-lg">GeoFaktura</div>
        <div className="text-xs opacity-70">Geodetski fakturirni sistem</div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          if (!item.roles.includes(userRole) && userRole !== 'admin') return null
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                activeView === item.id
                  ? 'bg-white/20 text-white'
                  : 'hover:bg-white/10'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.id === 'overdue' && (
                <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
              )}
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/20 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">MN</div>
          <div>
            <div className="font-medium">Maja Novak</div>
            <div className="text-xs opacity-70">Tajništvo</div>
          </div>
        </div>
      </div>
    </aside>
  )
}