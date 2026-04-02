import { TopNav } from './TopNav'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#242424', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
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
