import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const NAV_LINKS = [
  { label: 'Board',    path: '/board'    },
  { label: 'My Rides', path: '/my-rides' },
  { label: 'Profile',  path: '/profile'  },
]

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function TopNav() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuthStore()

  return (
    <nav style={{
      height: '56px',
      background: '#1A1A1A',
      borderBottom: '1px solid #333',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '32px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Logo */}
      <button
        onClick={() => navigate('/board')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px', background: '#1A1A1A',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
        }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#6E3A90' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#0039A6' }} />
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#FF6319' }} />
        </div>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Hop In!</span>
      </button>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
        {NAV_LINKS.map(link => {
          const active = location.pathname === link.path
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #2E86C1' : '2px solid transparent',
                padding: '18px 12px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: active ? 500 : 400,
                color: active ? '#2E86C1' : '#888',
                transition: 'color 0.15s',
              }}
            >
              {link.label}
            </button>
          )
        })}
      </div>

      {/* Post a ride — drivers only */}
      {user?.hasCar && (
        <button
          onClick={() => navigate('/offer')}
          style={{
            padding: '7px 14px', borderRadius: '7px',
            background: '#2E86C1', color: '#fff',
            fontSize: '13px', fontWeight: 600,
            border: 'none', cursor: 'pointer', flexShrink: 0,
          }}
        >
          Post a ride
        </button>
      )}

      {/* User avatar */}
      {user && (
        <button
          onClick={() => navigate('/profile')}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: user.avatarUrl ? 'transparent' : '#2E86C1',
            overflow: 'hidden',
            border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {user.avatarUrl
            ? <img src={user.avatarUrl} alt={user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>{initials(user.displayName)}</span>
          }
        </button>
      )}
    </nav>
  )
}
