import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { AppLayout } from '../components/layout/AppLayout'
import { MtaBadge } from '../components/shared/MtaBadge'
import { STOPS } from '../utils/constants'

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour  = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0', marginBottom: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0EE' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </p>
      </div>
      <div style={{ padding: '16px' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F8F8F8' }}>
      <span style={{ fontSize: '13px', color: '#888' }}>{label}</span>
      <div style={{ fontSize: '13px', color: '#111', fontWeight: 500 }}>{children}</div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const navigate      = useNavigate()
  const { user, uid, signOut } = useAuthStore()

  if (!user) return null

  const defaultStop = STOPS.find(s => s.id === user.defaultStop)

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '28px 20px 48px' }}>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
            background: user.avatarUrl ? 'transparent' : '#2E86C1',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #E0E0E0',
          }}>
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>{initials(user.displayName)}</span>
            }
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111', margin: '0 0 2px' }}>{user.displayName}</h1>
            <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          background: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0',
          marginBottom: '12px', overflow: 'hidden',
        }}>
          {[
            { label: 'Rides given',  value: user.stats?.ridesGiven  ?? 0 },
            { label: 'Rides taken',  value: user.stats?.ridesTaken  ?? 0 },
            { label: 'Late cancels', value: user.stats?.lateCancels ?? 0 },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: '16px',
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid #E0E0E0' : 'none',
              }}
            >
              <p style={{ fontSize: '24px', fontWeight: 600, color: '#111', margin: '0 0 4px' }}>{stat.value}</p>
              <p style={{ fontSize: '11px', color: '#999' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Commute */}
        <Section title="Commute">
          <Row label="Default stop">
            {defaultStop ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{defaultStop.shortName}</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {defaultStop.lines.map(l => <MtaBadge key={l.name} {...l} size="sm" />)}
                </div>
              </div>
            ) : (
              <span style={{ color: '#bbb', fontWeight: 400 }}>Not set</span>
            )}
          </Row>
          <Row label="Departure window">
            {user.departureWindow
              ? `${formatTime(user.departureWindow.start)} – ${formatTime(user.departureWindow.end)}`
              : <span style={{ color: '#bbb', fontWeight: 400 }}>Not set</span>
            }
          </Row>
          <Row label="Role">
            {user.hasCar ? 'Driver + rider' : 'Rider only'}
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <Row label="Slack DMs">
            <span style={{ color: user.notificationPrefs?.slackDMs ? '#2E86C1' : '#bbb' }}>
              {user.notificationPrefs?.slackDMs ? 'On' : 'Off'}
            </span>
          </Row>
          <Row label="Frequency">
            {user.notificationPrefs?.frequency === 'instant' ? 'Instant' : 'Daily digest'}
          </Row>
        </Section>

        {/* Account */}
        <Section title="Account">
          <Row label="Slack ID">
            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666', fontWeight: 400 }}>{uid}</span>
          </Row>
        </Section>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px',
            background: 'none', border: '1.5px solid #E0E0E0',
            color: '#E05252', fontSize: '15px', fontWeight: 500,
            cursor: 'pointer', marginTop: '8px',
          }}
        >
          Sign out
        </button>

      </div>
    </AppLayout>
  )
}
