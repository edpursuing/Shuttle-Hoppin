import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../utils/firebase'
import { useRideDetail } from '../hooks/useRideDetail'
import { useAuthStore } from '../stores/authStore'
import { MtaBadge } from '../components/shared/MtaBadge'
import { AppLayout } from '../components/layout/AppLayout'
import { STOPS } from '../utils/constants'

const bookRideFn            = httpsCallable(functions, 'bookRide')
const cancelBookingFn       = httpsCallable(functions, 'cancelBooking')
const updateDriverStatusFn  = httpsCallable(functions, 'updateDriverStatus')
const cancelRideFn          = httpsCallable(functions, 'cancelRide')

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  return new Date(seconds * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', weekday: 'short',
  })
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Driver status banner ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'pending':       { label: 'Driver not yet en route',   color: '#888',    bg: '#2A2A2A' },
  'on-my-way':     { label: 'Driver is on the way',      color: '#4CAF50', bg: '#1A2E1A' },
  'at-pickup':     { label: 'Driver is at the pickup',   color: '#EF9F27', bg: '#2E2310' },
  'running-late':  { label: 'Driver is running late',    color: '#E05252', bg: '#2E1A1A' },
}

function DriverStatusBanner({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS['pending']
  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.color}33`,
      borderRadius: '8px',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      <span style={{ fontSize: '13px', color: s.color, fontWeight: 500 }}>{s.label}</span>
    </div>
  )
}

// ── Rider row ─────────────────────────────────────────────────────────────────

function timeAgo(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000 - seconds)
  if (diff < 60)  return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function RiderRow({ name, avatarUrl, bookedAt }: { name: string; avatarUrl: string; bookedAt?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
        background: avatarUrl ? 'transparent' : '#333',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: '10px', fontWeight: 600, color: '#aaa' }}>{initials(name)}</span>
        }
      </div>
      <span style={{ fontSize: '13px', color: '#ccc', flex: 1 }}>{name}</span>
      {bookedAt && (
        <span style={{ fontSize: '11px', color: '#555' }}>Booked {timeAgo(bookedAt)}</span>
      )}
    </div>
  )
}

// ── Driver controls ───────────────────────────────────────────────────────────

const DRIVER_STATUSES: { value: string; label: string }[] = [
  { value: 'pending',      label: 'Not yet en route' },
  { value: 'on-my-way',   label: 'On my way'         },
  { value: 'at-pickup',   label: 'At pickup'         },
  { value: 'running-late', label: 'Running late'     },
]

function DriverControls({ rideId, currentStatus }: { rideId: string; currentStatus: string }) {
  const [updating, setUpdating] = useState(false)

  async function handleStatus(status: string) {
    if (status === currentStatus || updating) return
    setUpdating(true)
    try {
      await updateDriverStatusFn({ rideId, status })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div style={{ background: '#1E1E1E', borderRadius: '12px', border: '1px solid #333', padding: '16px', marginBottom: '12px' }}>
      <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
        Your status
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {DRIVER_STATUSES.map(({ value, label }) => {
          const active = currentStatus === value
          return (
            <button
              key={value}
              onClick={() => handleStatus(value)}
              disabled={updating}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: active ? '1.5px solid #2E86C1' : '1.5px solid #333',
                background: active ? '#1A2D3E' : '#2A2A2A',
                color: active ? '#2E86C1' : '#888',
                fontSize: '13px',
                fontWeight: active ? 500 : 400,
                cursor: updating ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                background: active ? '#2E86C1' : '#D0D0D0',
              }} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function RideDetail() {
  const { rideId }    = useParams<{ rideId: string }>()
  const navigate      = useNavigate()
  const { uid } = useAuthStore()
  const { ride, loading, notFound } = useRideDetail(rideId ?? '')
  const [acting, setActing]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  if (loading) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '80px', color: '#999', fontSize: '14px' }}>
          Loading…
        </div>
      </AppLayout>
    )
  }

  if (notFound || !ride) {
    return (
      <AppLayout>
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <p style={{ fontSize: '15px', color: '#aaa', marginBottom: '8px' }}>Ride not found</p>
          <button onClick={() => navigate('/board')} style={{ background: 'none', border: 'none', color: '#2E86C1', fontSize: '13px', cursor: 'pointer' }}>
            Back to board
          </button>
        </div>
      </AppLayout>
    )
  }

  const stop      = STOPS.find(s => s.id === ride.stopId)
  const lines     = stop?.lines || []
  const isCustom  = ride.stopId === 'custom'
  const isDriver  = uid === ride.driverId
  const isBooked  = ride.riders.some(r => r.uid === uid)
  const isFull    = ride.availableSeats < 1
  const isClosed  = ride.status !== 'open'

  const fromLabel  = ride.direction === 'from-hq' ? 'Pursuit HQ'  : ride.stopName
  const toLabel    = ride.direction === 'from-hq' ? ride.stopName  : 'Pursuit HQ'
  const toBadges   = ride.direction === 'from-hq' ? lines          : []
  const fromBadges = ride.direction === 'to-hq'   ? lines          : []

  async function handleBook() {
    setActing(true)
    setError(null)
    try {
      await bookRideFn({ rideId: ride!.id })
    } catch (err: any) {
      setError(err.message ?? 'Could not book ride')
    } finally {
      setActing(false)
    }
  }

  async function handleCancel() {
    setActing(true)
    setError(null)
    try {
      await cancelBookingFn({ rideId: ride!.id })
    } catch (err: any) {
      setError(err.message ?? 'Could not cancel booking')
    } finally {
      setActing(false)
    }
  }

  async function handleCancelRide() {
    if (!confirm('Cancel this ride? Booked riders will be notified.')) return
    setActing(true)
    setError(null)
    try {
      await cancelRideFn({ rideId: ride!.id })
      navigate('/board')
    } catch (err: any) {
      setError(err.message ?? 'Could not cancel ride')
      setActing(false)
    }
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '24px 20px 48px' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/board')}
          style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', padding: '0 0 20px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Board
        </button>

        {/* Ride card */}
        <div style={{
          background: '#1A1A1A', borderRadius: '14px', padding: '20px', marginBottom: '16px',
        }}>
          {/* Departure time */}
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
            {formatTime(ride.departureTime.seconds)}
          </p>

          {/* FROM */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>FROM</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 500, color: '#fff' }}>{fromLabel}</span>
              {fromBadges.map(l => <MtaBadge key={l.name} {...l} />)}
            </div>
          </div>

          {/* TO */}
          <div style={{ marginBottom: ride.passingThrough ? '8px' : '0' }}>
            <p style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>TO</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 500, color: '#fff' }}>
                {isCustom ? ride.customLocation : toLabel}
              </span>
              {toBadges.map(l => <MtaBadge key={l.name} {...l} />)}
            </div>
          </div>

          {ride.passingThrough && (
            <p style={{ fontSize: '12px', color: '#555', marginTop: '6px' }}>Via {ride.passingThrough}</p>
          )}
        </div>

        {/* Driver status banner — visible to booked riders */}
        {isBooked && !isDriver && (
          <div style={{ marginBottom: '16px' }}>
            <DriverStatusBanner status={ride.driverStatus} />
          </div>
        )}

        {/* Driver controls — only the driver sees these */}
        {isDriver && !isClosed && (
          <>
            <DriverControls rideId={ride.id} currentStatus={ride.driverStatus} />
            <button
              onClick={handleCancelRide}
              disabled={acting}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px', marginBottom: '12px',
                background: 'none', border: '1.5px solid #444',
                color: acting ? '#888' : '#E05252',
                fontSize: '14px', fontWeight: 500,
                cursor: acting ? 'not-allowed' : 'pointer',
              }}
            >
              {acting ? 'Cancelling ride…' : 'Cancel ride'}
            </button>
          </>
        )}

        {/* Driver */}
        <div style={{ background: '#1E1E1E', borderRadius: '12px', border: '1px solid #333', padding: '16px', marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Driver</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: ride.driverAvatar ? 'transparent' : '#2E86C1',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {ride.driverAvatar
                ? <img src={ride.driverAvatar} alt={ride.driverName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{initials(ride.driverName)}</span>
              }
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{ride.driverName}</p>
              <p style={{ fontSize: '12px', color: '#888' }}>
                {ride.totalSeats - ride.availableSeats} / {ride.totalSeats} seats filled
              </p>
            </div>
          </div>
        </div>

        {/* Riders */}
        <div style={{ background: '#1E1E1E', borderRadius: '12px', border: '1px solid #333', padding: '16px', marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Riders ({ride.riders.length})
          </p>
          <div style={{ borderTop: '1px solid #2A2A2A', marginTop: '8px' }}>
            {ride.riders.map(r => (
              <div key={r.uid} style={{ borderBottom: '1px solid #2A2A2A' }}>
                <RiderRow name={r.displayName} avatarUrl={r.avatarUrl} bookedAt={r.bookedAt?.seconds} />
              </div>
            ))}
            {Array.from({ length: ride.availableSeats }).map((_, i) => (
              <div key={`open-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #2A2A2A' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  border: '1.5px dashed #444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span style={{ fontSize: '12px', color: '#555' }}>Open seat</span>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: '#DC2626' }}>{error}</p>
          </div>
        )}

        {/* Action — riders only (not driver, not closed) */}
        {!isDriver && !isClosed && (
          isBooked ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCancel}
                disabled={acting}
                style={{
                  flex: 1, padding: '14px', borderRadius: '10px',
                  background: 'none', border: '1.5px solid #444',
                  color: acting ? '#bbb' : '#E05252',
                  fontSize: '15px', fontWeight: 500,
                  cursor: acting ? 'not-allowed' : 'pointer',
                }}
              >
                {acting ? 'Cancelling…' : 'Cancel booking'}
              </button>
              <a
                href={`slack://user?team=TCVA3PF24&id=${ride.driverId}`}
                style={{
                  flex: 1, padding: '14px', borderRadius: '10px',
                  background: '#4A154B', border: 'none',
                  color: '#fff', fontSize: '15px', fontWeight: 500,
                  cursor: 'pointer', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                </svg>
                Message driver
              </a>
            </div>
          ) : (
            <button
              onClick={handleBook}
              disabled={acting || isFull}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px',
                background: isFull ? '#2A2A2A' : (acting ? '#555' : '#2E86C1'),
                border: 'none',
                color: isFull ? '#888' : '#fff',
                fontSize: '15px', fontWeight: 600,
                cursor: acting || isFull ? 'not-allowed' : 'pointer',
              }}
            >
              {isFull ? 'No seats available' : acting ? 'Booking…' : `Join · ${ride.availableSeats} seat${ride.availableSeats !== 1 ? 's' : ''} left`}
            </button>
          )
        )}

        {isClosed && (
          <p style={{ textAlign: 'center', fontSize: '13px', color: '#999', padding: '12px 0' }}>
            This ride is {ride.status}.
          </p>
        )}

      </div>
    </AppLayout>
  )
}
