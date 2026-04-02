import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const NAV_ITEMS = [
  {
    id: 'board',
    label: 'Rides',
    path: '/board',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E86C1' : '#999'} strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'my-rides',
    label: 'My Rides',
    path: '/my-rides',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E86C1' : '#999'} strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  // Center Offer button — handled separately
  {
    id: 'alerts',
    label: 'Alerts',
    path: '/alerts',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E86C1' : '#999'} strokeWidth="2">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#2E86C1' : '#999'} strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function BottomNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuthStore()

  function isActive(path: string) {
    return location.pathname === path
  }

  return (
    <nav style={{
      background: '#1A1A1A',
      borderTop: '1px solid #333',
      display: 'flex',
      alignItems: 'flex-end',
      padding: '0 0 8px',
      height: '64px',
    }}>
      {/* Rides */}
      {NAV_ITEMS.slice(0, 2).map(item => {
        const active = isActive(item.path)
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
            }}
          >
            {item.icon(active)}
            <span style={{ fontSize: '10px', color: active ? '#2E86C1' : '#999' }}>
              {item.label}
            </span>
          </button>
        )
      })}

      {/* Center Offer button */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingBottom: '4px' }}>
        <button
          onClick={() => navigate('/offer')}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: user?.hasCar ? '#2E86C1' : '#ccc',
            border: 'none',
            cursor: user?.hasCar ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '-20px',
            boxShadow: '0 2px 8px rgba(46,134,193,0.3)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span style={{ fontSize: '10px', color: '#999' }}>Offer</span>
      </div>

      {/* Alerts + Profile */}
      {NAV_ITEMS.slice(2).map(item => {
        const active = isActive(item.path)
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 0',
            }}
          >
            {item.icon(active)}
            <span style={{ fontSize: '10px', color: active ? '#2E86C1' : '#999' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
