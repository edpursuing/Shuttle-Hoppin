import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../utils/firebase'
import { useAuthStore } from '../stores/authStore'
import { StopSelector } from '../components/shared/StopSelector'
import type { Direction, RideMode } from '../utils/types'

const offerRideFn = httpsCallable(functions, 'offerRide')

// ── Seat picker ───────────────────────────────────────────────────────────────

function SeatPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
        const selected = value === n
        return (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: selected ? '1.5px solid #2E86C1' : '1.5px solid #444',
              background: selected ? '#2E86C1' : '#2A2A2A',
              color: selected ? '#fff' : '#888',
              fontSize: '15px',
              fontWeight: selected ? 600 : 400,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

// ── Mode + direction toggles ──────────────────────────────────────────────────

function SegmentedControl<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{
      display: 'inline-flex',
      background: '#1A1A1A',
      borderRadius: '8px',
      padding: '3px',
      gap: '2px',
    }}>
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: active ? '1px solid #444' : 'none',
              background: active ? '#2A2A2A' : 'transparent',
              color: active ? '#fff' : '#888',
              fontSize: '13px',
              fontWeight: active ? 500 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{
        fontSize: '11px',
        fontWeight: 500,
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function OfferRide() {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const [posting, setPosting] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [mode, setMode]           = useState<RideMode>('now')
  const [direction, setDirection] = useState<Direction>('from-hq')
  const [stopId, setStopId]       = useState<string | null>(null)
  const [stopName, setStopName]   = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [passingThrough, setPassingThrough] = useState('')
  const [seats, setSeats]         = useState(4)
  const [date, setDate]           = useState('')
  const [time, setTime]           = useState('')

  // Redirect non-drivers
  if (user && !user.hasCar) {
    navigate('/board', { replace: true })
    return null
  }

  function handleStopChange(id: string, name: string, isCustom: boolean) {
    setStopId(id)
    setStopName(isCustom ? customLocation : name)
  }

  function buildDepartureTime(): string {
    if (mode === 'now') return new Date().toISOString()
    if (!date || !time) return new Date().toISOString()
    return new Date(`${date}T${time}`).toISOString()
  }

  function canPost(): boolean {
    if (!stopId) return false
    if (stopId === 'custom' && !customLocation.trim()) return false
    if (mode === 'later' && (!date || !time)) return false
    return true
  }

  async function handlePost() {
    if (!canPost() || posting) return
    setPosting(true)
    setError(null)
    try {
      const result = await offerRideFn({
        direction,
        stopId,
        stopName: stopId === 'custom' ? customLocation.trim() : stopName,
        customLocation: stopId === 'custom' ? customLocation.trim() : null,
        passingThrough: passingThrough.trim() || null,
        departureTime: buildDepartureTime(),
        mode,
        totalSeats: seats,
      })
      const data = result.data as { rideId: string }
      navigate(`/ride/${data.rideId}`, { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Failed to post ride')
      setPosting(false)
    }
  }

  return (
    <div style={{ background: '#242424', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#1A1A1A',
        borderBottom: '1px solid #333',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => navigate('/board')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#888' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#fff', margin: 0 }}>
          Offer a ride
        </h1>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px 120px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Mode */}
          <Field label="When">
            <SegmentedControl
              options={[
                { value: 'now',   label: 'Leaving now' },
                { value: 'later', label: 'Schedule' },
              ]}
              value={mode}
              onChange={setMode}
            />
          </Field>

          {/* Date + time — schedule mode only */}
          {mode === 'later' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Field label="Date">
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                  style={{
                    background: '#1A1A1A',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    color: '#fff',
                    width: '100%',
                  }}
                />
              </Field>
              <Field label="Time">
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  style={{
                    background: '#1A1A1A',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    color: '#fff',
                    width: '100%',
                  }}
                />
              </Field>
            </div>
          )}

          {/* Direction */}
          <Field label="Direction">
            <SegmentedControl
              options={[
                { value: 'from-hq', label: 'From Pursuit HQ' },
                { value: 'to-hq',   label: 'To Pursuit HQ' },
              ]}
              value={direction}
              onChange={setDirection}
            />
          </Field>

          {/* Stop */}
          <Field label={direction === 'from-hq' ? 'Dropping off at' : 'Picking up from'}>
            <StopSelector
              value={stopId}
              onChange={handleStopChange}
              customLocation={customLocation}
              onCustomLocationChange={setCustomLocation}
            />
          </Field>

          {/* Continues to */}
          <Field label="Continues to (optional)">
            <input
              type="text"
              placeholder="e.g. Corona, Jackson Heights"
              value={passingThrough}
              onChange={e => setPassingThrough(e.target.value)}
              style={{
                background: '#1A1A1A',
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '14px',
                color: '#fff',
                width: '100%',
              }}
            />
          </Field>

          {/* Seats */}
          <Field label="Available seats">
            <SeatPicker value={seats} onChange={setSeats} />
          </Field>

          {error && (
            <p style={{ fontSize: '13px', color: '#c0392b', margin: 0 }}>{error}</p>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1A1A1A',
        borderTop: '1px solid #333',
        padding: '16px 20px',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        <button
          onClick={handlePost}
          disabled={!canPost() || posting}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            background: canPost() && !posting ? '#2E86C1' : '#ccc',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            cursor: canPost() && !posting ? 'pointer' : 'not-allowed',
          }}
        >
          {posting ? 'Posting…' : 'Post ride'}
        </button>
      </div>
    </div>
  )
}
