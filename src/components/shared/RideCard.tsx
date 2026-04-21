import { useNavigate } from 'react-router-dom'
import { STOPS } from '../../utils/constants'
import { MtaBadge } from './MtaBadge'
import { DriverInfo } from './DriverInfo'
import type { Ride } from '../../utils/types'

interface RideCardProps {
  ride: Ride
  isUrgent?: boolean
}

function formatTime(seconds: number): string {
  return new Date(seconds * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function countdown(seconds: number): string {
  const ms = seconds * 1000 - Date.now()
  if (ms <= 0) return 'Now'
  const min = Math.floor(ms / 60000)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  const rem = min % 60
  return rem > 0 ? `${hr}h ${rem}m` : `${hr}h`
}

export function RideCard({ ride, isUrgent = false }: RideCardProps) {
  const navigate = useNavigate()
  const stop = STOPS.find(s => s.id === ride.stopId)
  const lines = stop?.lines || []
  const isCustom = ride.stopId === 'custom'

  const fromLabel  = ride.direction === 'from-hq' ? 'Pursuit HQ'               : ride.stopName
  const toLabel    = ride.direction === 'from-hq' ? ride.stopName               : 'Pursuit HQ'
  const toBadges   = ride.direction === 'from-hq' ? lines                        : []
  const fromBadges = ride.direction === 'to-hq'   ? lines                        : []

  return (
    <div
      onClick={() => navigate(`/ride/${ride.id}`)}
      style={{
        background: '#1A1A1A',
        borderRadius: '12px',
        padding: '14px',
        borderLeft: isUrgent ? '3px solid #EF9F27' : 'none',
        cursor: 'pointer',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Top row: urgent badge or departure time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        {isUrgent ? (
          <span style={{
            background: '#EF9F27',
            color: '#412402',
            fontSize: '11px',
            fontWeight: 500,
            padding: '3px 8px',
            borderRadius: '4px',
          }}>
            {(() => { const c = countdown(ride.departureTime.seconds); return c === 'Now' ? 'LEAVING NOW' : `LEAVING IN ${c}` })()}
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: '#666' }}>
            {formatTime(ride.departureTime.seconds)}
          </span>
        )}
        {isUrgent && (
          <span style={{ fontSize: '11px', color: '#666' }}>
            {formatTime(ride.departureTime.seconds)}
          </span>
        )}
      </div>

      {/* FROM */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 3px' }}>
          FROM
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#fff' }}>{fromLabel}</span>
          {fromBadges.map(l => <MtaBadge key={l.name} {...l} />)}
        </div>
      </div>

      {/* TO */}
      <div style={{ marginBottom: ride.passingThrough ? '8px' : '10px' }}>
        <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 3px' }}>
          TO
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#fff' }}>
            {isCustom ? ride.customLocation : toLabel}
          </span>
          {toBadges.map(l => <MtaBadge key={l.name} {...l} />)}
        </div>
      </div>

      {/* Continues to */}
      {ride.passingThrough && (
        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 3px' }}>
            CONTINUES TO
          </p>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#fff' }}>
            {ride.passingThrough}
          </span>
        </div>
      )}

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <DriverInfo name={ride.driverName} avatarUrl={ride.driverAvatar} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#888' }}>
            {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''}
          </span>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/ride/${ride.id}`) }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: ride.availableSeats > 0 ? '#2E86C1' : '#444',
              color: ride.availableSeats > 0 ? '#fff' : '#888',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: ride.availableSeats > 0 ? 'pointer' : 'default',
            }}
          >
            {ride.availableSeats > 0 ? 'Join' : 'Full'}
          </button>
        </div>
      </div>
    </div>
  )
}
