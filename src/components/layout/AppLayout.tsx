import { TopNav } from './TopNav'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: React.ReactNode
}

const HAPPY_INTERSECTION = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg fill='none' stroke='%23000' stroke-opacity='0.05' stroke-width='1'%3E%3Cpath d='M0 40 L40 0 L80 40 L40 80 Z'/%3E%3Cpath d='M-40 40 L0 0 L40 40 L0 80 Z'/%3E%3Cpath d='M40 40 L80 0 L120 40 L80 80 Z'/%3E%3C/g%3E%3C/svg%3E")`

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: `${HAPPY_INTERSECTION}, #F7F6F4`, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Desktop top nav — hidden on mobile */}
      <div className="hidden md:block">
        <TopNav />
      </div>

      {/* Page content — extra bottom padding on mobile for BottomNav */}
      <div className="pb-16 md:pb-0">
        {children}
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <BottomNav />
      </div>
    </div>
  )
}
