import { useState } from 'react'
import { useRideBoard } from '../hooks/useRideBoard'
import { useAuthStore } from '../stores/authStore'
import { RideCard } from '../components/shared/RideCard'
import { DirectionToggle } from '../components/shared/DirectionToggle'
import { MtaBadge } from '../components/shared/MtaBadge'
import { AppLayout } from '../components/layout/AppLayout'
import { STOPS } from '../utils/constants'
import type { Direction } from '../utils/types'

// ── Day grouping helpers ──────────────────────────────────────────────────────

function groupByDay(rides: any[]): [string, any[]][] {
  const groups = new Map<string, any[]>()
  for (const r of rides) {
    const key = new Date(r.departureTime.seconds * 1000).toDateString()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  return Array.from(groups.entries())
}

function dayLabel(dateKey: string): string {
  const date = new Date(dateKey)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (date.toDateString() === today.toDateString())    return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

// ── Sidebar (desktop only) ────────────────────────────────────────────────────

function Sidebar({
  direction, onDirectionChange,
  stopFilter, onStopFilterChange,
  rides,
}: {
  direction: Direction
  onDirectionChange: (d: Direction) => void
  stopFilter: string | null
  onStopFilterChange: (s: string | null) => void
  rides: any[]
}) {
  const filterStops = STOPS.filter(s => !s.isSpecial)

  return (
    <aside style={{
      width: '220px',
      flexShrink: 0,
      background: '#1E1E1E',
      borderRight: '1px solid #333',
      minHeight: 'calc(100vh - 56px)',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 0',
      gap: '28px',
      position: 'sticky',
      top: '56px',
    }}>
      {/* Direction */}
      <div style={{ padding: '0 16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 2px' }}>
          Direction
        </p>
        <DirectionToggle value={direction} onChange={onDirectionChange} layout="vertical" />
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#333', margin: '0 16px' }} />

      {/* Stop filter */}
      <div style={{ padding: '0 16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 2px' }}>
          {direction === 'from-hq' ? 'Destinations' : 'Pickup points'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[{ id: null, shortName: 'All rides', lines: [] as any[] }, ...filterStops].map(stop => {
            const active = stop.id === null ? stopFilter === null : stopFilter === stop.id
            const count  = stop.id === null ? rides.length : rides.filter(r => r.stopId === stop.id).length
            return (
              <button
                key={stop.id ?? 'all'}
                onClick={() => onStopFilterChange(stop.id ?? null)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '8px', border: 'none',
                  background: active ? '#2A2A2A' : 'transparent',
                  color: active ? '#fff' : '#888',
                  fontSize: '13px', fontWeight: active ? 500 : 400,
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'background 0.1s',
                }}
              >
                <span>{stop.shortName}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {stop.lines.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {stop.lines.map((l: any) => <MtaBadge key={l.name} {...l} size="sm" />)}
                    </div>
                  )}
                  <span style={{
                    fontSize: '11px', fontWeight: 500, minWidth: '16px', textAlign: 'right',
                    color: count > 0 ? (active ? '#fff' : '#666') : '#444',
                  }}>
                    {count}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

    </aside>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children, color = '#888' }: { children: string; color?: string }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 500, color,
      textTransform: 'uppercase', letterSpacing: '0.5px',
      margin: '0 0 10px',
    }}>
      {children}
    </p>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ direction }: { direction: Direction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: '#2A2A2A', border: '1px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
          <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h10l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
        </svg>
      </div>
      <p style={{ fontSize: '15px', fontWeight: 500, color: '#ccc', marginBottom: '6px' }}>
        No rides right now
      </p>
      <p style={{ fontSize: '13px', color: '#999', maxWidth: '220px', lineHeight: 1.6 }}>
        {direction === 'from-hq'
          ? 'No rides from Pursuit HQ yet. Check back closer to departure time.'
          : 'No rides heading to Pursuit HQ yet.'}
      </p>
    </div>
  )
}

// ── Ride list ─────────────────────────────────────────────────────────────────

function RideList({ leavingSoon, scheduled, loading, direction, isDesktop }: {
  leavingSoon: any[]; scheduled: any[]; loading: boolean
  direction: Direction; isDesktop?: boolean
}) {
  const total = leavingSoon.length + scheduled.length
  const gridStyle = isDesktop
    ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }
    : { display: 'flex', flexDirection: 'column' as const, gap: '10px' }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: '#999', fontSize: '14px' }}>
        Loading rides…
      </div>
    )
  }

  if (total === 0) return <EmptyState direction={direction} />

  return (
    <>
      {leavingSoon.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel color="#EF9F27">Leaving soon</SectionLabel>
          <div style={gridStyle}>
            {leavingSoon.map(ride => <RideCard key={ride.id} ride={ride} isUrgent />)}
          </div>
        </div>
      )}
      {scheduled.length > 0 && groupByDay(scheduled).map(([dayKey, dayRides]) => (
        <div key={dayKey} style={{ marginBottom: '24px' }}>
          <SectionLabel>{dayLabel(dayKey)}</SectionLabel>
          <div style={gridStyle}>
            {dayRides.map(ride => <RideCard key={ride.id} ride={ride} />)}
          </div>
        </div>
      ))}
    </>
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
        background: '#1A1A1A', borderBottom: '1px solid #333', padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#fff', margin: 0 }}>Hop In!</h1>
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
              {loading ? '…' : `${totalRides} ride${totalRides !== 1 ? 's' : ''} available`}
            </p>
          </div>
          {user && (
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: user.avatarUrl ? 'transparent' : '#2E86C1',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
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

      {/* ── Desktop: sidebar + main ── */}
      <div className="hidden md:flex" style={{ alignItems: 'flex-start' }}>
        <Sidebar
          direction={direction}
          onDirectionChange={setDirection}
          stopFilter={stopFilter}
          onStopFilterChange={setStopFilter}
          rides={[...leavingSoon, ...scheduled]}
        />

        <main style={{ flex: 1, padding: '28px 32px', maxWidth: '860px' }}>
          {/* Page heading */}
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #333' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                {direction === 'from-hq' ? 'Rides from Pursuit HQ' : 'Rides to Pursuit HQ'}
              </h2>
              {!loading && totalRides > 0 && (
                <span style={{ fontSize: '13px', color: '#999' }}>
                  {totalRides} available
                </span>
              )}
            </div>
            <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>
              Pursuit fellows driving fellows to transit — and beyond.
            </p>
          </div>

          <RideList
            leavingSoon={leavingSoon}
            scheduled={scheduled}
            loading={loading}
            direction={direction}
            isDesktop
          />
        </main>
      </div>

      {/* ── Mobile content ── */}
      <div className="md:hidden" style={{ padding: '16px 20px' }}>
        <RideList
          leavingSoon={leavingSoon}
          scheduled={scheduled}
          loading={loading}
          direction={direction}
        />
      </div>

    </AppLayout>
  )
}
