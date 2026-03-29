import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRideBoard } from '../hooks/useRideBoard'
import { useAuthStore } from '../stores/authStore'
import { RideCard } from '../components/shared/RideCard'
import { DirectionToggle } from '../components/shared/DirectionToggle'
import { MtaBadge } from '../components/shared/MtaBadge'
import { AppLayout } from '../components/layout/AppLayout'
import { STOPS } from '../utils/constants'
import type { Direction } from '../utils/types'

// ── Sidebar (desktop only) ────────────────────────────────────────────────────

function Sidebar({
  direction, onDirectionChange,
  stopFilter, onStopFilterChange,
}: {
  direction: Direction
  onDirectionChange: (d: Direction) => void
  stopFilter: string | null
  onStopFilterChange: (s: string | null) => void
}) {
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const filterStops = STOPS.filter(s => !s.isSpecial)

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '24px 0 24px 0',
    }}>
      {/* Direction */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Direction
        </p>
        <DirectionToggle value={direction} onChange={onDirectionChange} layout="vertical" />
      </div>

      {/* Stop filter */}
      <div>
        <p style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Stop
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            onClick={() => onStopFilterChange(null)}
            style={{
              width: '100%', padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: stopFilter === null ? '#F0F0F0' : 'transparent',
              color: stopFilter === null ? '#111' : '#888',
              fontSize: '13px', fontWeight: stopFilter === null ? 500 : 400,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            All stops
          </button>
          {filterStops.map(stop => (
            <button
              key={stop.id}
              onClick={() => onStopFilterChange(stop.id === stopFilter ? null : stop.id)}
              style={{
                width: '100%', padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: stopFilter === stop.id ? '#F0F0F0' : 'transparent',
                color: stopFilter === stop.id ? '#111' : '#888',
                fontSize: '13px', fontWeight: stopFilter === stop.id ? 500 : 400,
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{stop.shortName}</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {stop.lines.slice(0, 3).map(l => <MtaBadge key={l.name} {...l} size="sm" />)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Offer a ride card — drivers only */}
      {user?.hasCar && (
        <div style={{
          background: '#1A1A1A', borderRadius: '12px', padding: '16px',
          marginTop: 'auto',
        }}>
          <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '12px', lineHeight: 1.4 }}>
            Going home tonight?
          </p>
          <button
            onClick={() => navigate('/offer')}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              background: '#2E86C1', color: '#fff',
              fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            Post a ride
          </button>
        </div>
      )}
    </aside>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionLabel({ children, color = '#888' }: { children: string; color?: string }) {
  return (
    <p style={{
      fontSize: '11px',
      fontWeight: 500,
      color,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      margin: '0 0 10px',
    }}>
      {children}
    </p>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ direction }: { direction: Direction }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚗</div>
      <p style={{ fontSize: '15px', fontWeight: 500, color: '#333', marginBottom: '6px' }}>
        No rides right now
      </p>
      <p style={{ fontSize: '13px', color: '#888' }}>
        {direction === 'from-hq'
          ? 'No one is offering rides from HQ yet.'
          : 'No rides heading to HQ yet.'}
      </p>
    </div>
  )
}

// ── Main board ────────────────────────────────────────────────────────────────

export function RideBoard() {
  const { user }  = useAuthStore()
  const [direction, setDirection]   = useState<Direction>('from-hq')
  const [stopFilter, setStopFilter] = useState<string | null>(null)
  const { leavingSoon, scheduled, loading } = useRideBoard(direction, stopFilter)

  const totalRides = leavingSoon.length + scheduled.length

  return (
    <AppLayout>
      {/* ── Mobile header ── */}
      <div className="md:hidden" style={{
        background: '#fff',
        borderBottom: '1px solid #E0E0E0',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#111', margin: 0 }}>Hoppin'</h1>
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
              {loading ? '…' : `${totalRides} ride${totalRides !== 1 ? 's' : ''} available`}
            </p>
          </div>
          {user && (
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: user.avatarUrl ? 'transparent' : '#2E86C1',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                    {user.displayName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                  </span>
              }
            </div>
          )}
        </div>
        <DirectionToggle value={direction} onChange={setDirection} layout="horizontal" />
      </div>

      {/* ── Desktop layout: sidebar + grid ── */}
      <div className="hidden md:flex" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', gap: '32px', alignItems: 'flex-start' }}>
        <Sidebar
          direction={direction}
          onDirectionChange={setDirection}
          stopFilter={stopFilter}
          onStopFilterChange={setStopFilter}
        />

        {/* Main content */}
        <main style={{ flex: 1, padding: '24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', margin: 0 }}>
              {direction === 'from-hq' ? 'Rides from HQ' : 'Rides to HQ'}
            </h2>
            {!loading && (
              <span style={{ fontSize: '13px', color: '#888' }}>
                {totalRides} available
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#888', fontSize: '14px' }}>
              Loading rides…
            </div>
          ) : totalRides === 0 ? (
            <EmptyState direction={direction} />
          ) : (
            <>
              {leavingSoon.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <SectionLabel color="#EF9F27">Leaving soon</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {leavingSoon.map(ride => <RideCard key={ride.id} ride={ride} isUrgent />)}
                  </div>
                </div>
              )}
              {scheduled.length > 0 && (
                <div>
                  <SectionLabel>Scheduled</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {scheduled.map(ride => <RideCard key={ride.id} ride={ride} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Mobile content ── */}
      <div className="md:hidden" style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#888', fontSize: '14px' }}>
            Loading rides…
          </div>
        ) : totalRides === 0 ? (
          <EmptyState direction={direction} />
        ) : (
          <>
            {leavingSoon.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <SectionLabel color="#EF9F27">Leaving soon</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leavingSoon.map(ride => <RideCard key={ride.id} ride={ride} isUrgent />)}
                </div>
              </div>
            )}
            {scheduled.length > 0 && (
              <div>
                <SectionLabel>Scheduled</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {scheduled.map(ride => <RideCard key={ride.id} ride={ride} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
