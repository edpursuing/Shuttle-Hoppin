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

function RiderRow({ name, avatarUrl }: { name: string; avatarUrl: string }) {
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
      <span style={{ fontSize: '13px', color: '#ccc' }}>{name}</span>
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
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0', padding: '16px', marginBottom: '12px' }}>
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
                border: active ? '1.5px solid #2E86C1' : '1.5px solid #E0E0E0',
                background: active ? '#EBF4FB' : '#fff',
                color: active ? '#2E86C1' : '#555',
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
  const { user, uid } = useAuthStore()
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
          <p style={{ fontSize: '15px', color: '#333', marginBottom: '8px' }}>Ride not found</p>
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
          <DriverControls rideId={ride.id} currentStatus={ride.driverStatus} />
        )}

        {/* Driver */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0', padding: '16px', marginBottom: '12px' }}>
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
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#111' }}>{ride.driverName}</p>
              <p style={{ fontSize: '12px', color: '#888' }}>
                {ride.totalSeats - ride.availableSeats} / {ride.totalSeats} seats filled
              </p>
            </div>
          </div>
        </div>

        {/* Riders */}
        {ride.riders.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E0E0E0', padding: '16px', marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Riders ({ride.riders.length})
            </p>
            <div style={{ borderTop: '1px solid #F0F0EE', marginTop: '8px' }}>
              {ride.riders.map(r => (
                <div key={r.uid} style={{ borderBottom: '1px solid #F0F0EE' }}>
                  <RiderRow name={r.displayName} avatarUrl={r.avatarUrl} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: '#DC2626' }}>{error}</p>
          </div>
        )}

        {/* Action — riders only (not driver, not closed) */}
        {!isDriver && !isClosed && (
          isBooked ? (
            <button
              onClick={handleCancel}
              disabled={acting}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px',
                background: 'none', border: '1.5px solid #E0E0E0',
                color: acting ? '#bbb' : '#E05252',
                fontSize: '15px', fontWeight: 500,
                cursor: acting ? 'not-allowed' : 'pointer',
              }}
            >
              {acting ? 'Cancelling…' : 'Cancel booking'}
            </button>
          ) : (
            <button
              onClick={handleBook}
              disabled={acting || isFull}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px',
                background: isFull ? '#F0F0EE' : (acting ? '#ccc' : '#2E86C1'),
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
