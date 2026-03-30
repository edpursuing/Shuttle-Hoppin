import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useMyRides } from '../hooks/useMyRides'
import { MtaBadge } from '../components/shared/MtaBadge'
import { AppLayout } from '../components/layout/AppLayout'
import { STOPS } from '../utils/constants'
import type { Ride } from '../utils/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  return new Date(seconds * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', weekday: 'short',
  })
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'Open',       color: '#2E86C1', bg: '#EBF4FB' },
  'in-progress': { label: 'Active',   color: '#4CAF50', bg: '#EDF7EE' },
  completed:   { label: 'Completed',  color: '#999',    bg: '#F5F5F5' },
  cancelled:   { label: 'Cancelled',  color: '#E05252', bg: '#FEF2F2' },
}

// ── Ride row ──────────────────────────────────────────────────────────────────

function RideRow({ ride }: { ride: Ride }) {
  const navigate = useNavigate()
  const stop     = STOPS.find(s => s.id === ride.stopId)
  const lines    = stop?.lines || []
  const isCustom = ride.stopId === 'custom'
  const status   = STATUS_STYLE[ride.status] ?? STATUS_STYLE['open']

  const fromLabel = ride.direction === 'from-hq' ? 'Pursuit HQ'  : ride.stopName
  const toLabel   = ride.direction === 'from-hq' ? (isCustom ? ride.customLocation : ride.stopName) : 'Pursuit HQ'
  const toBadges  = ride.direction === 'from-hq' ? lines : []

  return (
    <div
      onClick={() => navigate(`/ride/${ride.id}`)}
      style={{
        padding: '14px 16px',
        borderBottom: '1px solid #F0F0EE',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Dark departure block */}
      <div style={{
        background: '#1A1A1A',
        borderRadius: '8px',
        padding: '8px 10px',
        flexShrink: 0,
        textAlign: 'center',
        minWidth: '52px',
      }}>
        <p style={{ fontSize: '11px', color: '#fff', fontWeight: 500, margin: 0, lineHeight: 1.3 }}>
          {new Date(ride.departureTime.seconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
        <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>
          {new Date(ride.departureTime.seconds * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
        </p>
      </div>

      {/* Route */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>{fromLabel}</span>
          <span style={{ fontSize: '11px', color: '#ccc' }}>→</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#111' }}>{toLabel}</span>
          {toBadges.map(l => <MtaBadge key={l.name} {...l} size="sm" />)}
        </div>
        <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>
          {ride.availableSeats} of {ride.totalSeats} seats available
        </p>
      </div>

      {/* Status badge */}
      <span style={{
        fontSize: '11px', fontWeight: 500,
        color: status.color, background: status.bg,
        padding: '3px 8px', borderRadius: '4px', flexShrink: 0,
      }}>
        {status.label}
      </span>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <p style={{ fontSize: '13px', color: '#aaa' }}>{message}</p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Tab = 'driving' | 'riding'

export function MyRides() {
  const { uid, user }                         = useAuthStore()
  const { driverRides, riderRides, loading }  = useMyRides(uid)
  const [tab, setTab]                         = useState<Tab>('driving')

  // Default to driving tab if user is a driver
  const defaultTab: Tab = user?.hasCar ? 'driving' : 'riding'
  const activeTab = user?.hasCar ? tab : 'riding'

  return (
    <AppLayout>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 0 48px' }}>

        {/* Header */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #E0E0E0',
          padding: '20px 20px 0',
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111', margin: '0 0 16px' }}>My Rides</h1>

          {/* Tabs — only show if user is a driver */}
          {user?.hasCar && (
            <div style={{ display: 'flex', gap: '0' }}>
              {(['driving', 'riding'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    background: 'none', border: 'none',
                    borderBottom: activeTab === t ? '2px solid #2E86C1' : '2px solid transparent',
                    padding: '8px 16px 12px',
                    fontSize: '13px', fontWeight: activeTab === t ? 500 : 400,
                    color: activeTab === t ? '#2E86C1' : '#888',
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {t}
                  <span style={{
                    marginLeft: '6px', fontSize: '11px',
                    background: activeTab === t ? '#EBF4FB' : '#F5F5F5',
                    color: activeTab === t ? '#2E86C1' : '#aaa',
                    padding: '1px 6px', borderRadius: '10px',
                  }}>
                    {t === 'driving' ? driverRides.length : riderRides.length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E0E0E0' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
              Loading…
            </div>
          ) : activeTab === 'driving' ? (
            driverRides.length === 0
              ? <EmptyState message="You haven't offered any rides yet." />
              : driverRides.map(r => <RideRow key={r.id} ride={r} />)
          ) : (
            riderRides.length === 0
              ? <EmptyState message="You're not booked on any upcoming rides." />
              : riderRides.map(r => <RideRow key={r.id} ride={r} />)
          )}
        </div>

      </div>
    </AppLayout>
  )
}
