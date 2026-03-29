import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../utils/firebase'
import { STOPS } from '../utils/constants'

// ── Types ────────────────────────────────────────────────────────────────────

interface OnboardingState {
  defaultStop: string | null
  departureWindow: { start: string; end: string } | null
  hasCar: boolean | null
  notificationPrefs: { slackDMs: boolean; frequency: 'instant' | 'digest' }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: '3px',
            borderRadius: '2px',
            background: i < step ? '#2E86C1' : '#E0E0E0',
            transition: 'background 0.2s',
          }}
        />
      ))}
    </div>
  )
}

function StepHeader({ step, total, title, subtitle }: {
  step: number; total: number; title: string; subtitle?: string
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <p style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>
        Step {step} of {total}
      </p>
      <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#111', marginBottom: '6px' }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.5 }}>{subtitle}</p>
      )}
    </div>
  )
}

function MtaBadge({ name, color, textColor }: { name: string; color: string; textColor: string }) {
  const isLIRR = name === 'LIRR'
  return (
    <span style={{
      background: color,
      color: textColor,
      fontSize: isLIRR ? '8px' : '9px',
      fontWeight: 700,
      width: isLIRR ? 'auto' : '16px',
      height: '16px',
      padding: isLIRR ? '0 5px' : '0',
      borderRadius: isLIRR ? '3px' : '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {name}
    </span>
  )
}

// ── Step 1: Pick your stop ────────────────────────────────────────────────────

function Step1Stop({ value, onChange }: {
  value: string | null
  onChange: (v: string) => void
}) {
  const displayStops = STOPS.filter(s => !s.isSpecial)

  return (
    <div>
      <StepHeader
        step={1} total={4}
        title="Where do you commute to?"
        subtitle="Pick the stop closest to your home. We'll notify you about rides heading there."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {displayStops.map((stop, i) => {
          const selected = value === stop.id
          const prevGroup = i > 0 ? displayStops[i - 1].visualGroup : null
          const showGroupLabel = stop.visualGroup && stop.visualGroup !== prevGroup
          return (
            <div key={stop.id}>
              {showGroupLabel && (
                <p style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', marginTop: '8px' }}>
                  {stop.visualGroup}
                </p>
              )}
              <button
                onClick={() => onChange(stop.id)}
                style={{
                  width: '100%',
                  background: '#1A1A1A',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  border: selected ? '1.5px solid #2E86C1' : '1.5px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  opacity: selected ? 1 : 0.6,
                  transition: 'opacity 0.15s, border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: selected ? '#2E86C1' : 'transparent',
                    border: selected ? 'none' : '1.5px solid #555',
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: selected ? 500 : 400, color: selected ? '#fff' : '#ccc' }}>
                    {stop.name}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {stop.lines.map(line => (
                    <MtaBadge key={line.name} {...line} />
                  ))}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2: Departure window ──────────────────────────────────────────────────

function Step2DepartureWindow({ value, onChange }: {
  value: { start: string; end: string } | null
  onChange: (v: { start: string; end: string } | null) => void
}) {
  const start = value?.start ?? '08:00'
  const end   = value?.end   ?? '09:00'

  return (
    <div>
      <StepHeader
        step={2} total={4}
        title="When do you usually leave?"
        subtitle="Optional. We'll prioritize rides that match your window."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Earliest
          </span>
          <input
            type="time"
            value={start}
            onChange={e => onChange({ start: e.target.value, end })}
            style={{
              background: '#1A1A1A',
              border: '1.5px solid #333',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#fff',
              fontSize: '16px',
              width: '100%',
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Latest
          </span>
          <input
            type="time"
            value={end}
            onChange={e => onChange({ start, end: e.target.value })}
            style={{
              background: '#1A1A1A',
              border: '1.5px solid #333',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#fff',
              fontSize: '16px',
              width: '100%',
            }}
          />
        </label>
        {value && (
          <button
            onClick={() => onChange(null)}
            style={{ background: 'none', border: 'none', color: '#999', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            Clear departure window
          </button>
        )}
      </div>
    </div>
  )
}

// ── Step 3: Car access ────────────────────────────────────────────────────────

function Step3CarAccess({ value, onChange }: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div>
      <StepHeader
        step={3} total={4}
        title="Do you have a car?"
        subtitle="Drivers can post rides. Riders can request and join rides."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {([
          { val: true,  label: 'Yes, I drive', icon: '🚗', desc: "I can offer rides to other fellows" },
          { val: false, label: 'Rider only',   icon: '🎒', desc: "I'm looking for rides" },
        ] as const).map(({ val, label, icon, desc }) => {
          const selected = value === val
          return (
            <button
              key={String(val)}
              onClick={() => onChange(val)}
              style={{
                background: '#1A1A1A',
                border: selected ? '1.5px solid #2E86C1' : '1.5px solid #333',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '28px' }}>{icon}</span>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: selected ? '#fff' : '#ccc', marginBottom: '2px' }}>
                  {label}
                </p>
                <p style={{ fontSize: '13px', color: '#888' }}>{desc}</p>
              </div>
              <div style={{
                marginLeft: 'auto',
                width: '18px', height: '18px', borderRadius: '50%',
                border: selected ? 'none' : '1.5px solid #555',
                background: selected ? '#2E86C1' : 'transparent',
                flexShrink: 0,
              }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 4: Notification prefs ────────────────────────────────────────────────

function Step4Notifications({ value, onChange }: {
  value: { slackDMs: boolean; frequency: 'instant' | 'digest' }
  onChange: (v: { slackDMs: boolean; frequency: 'instant' | 'digest' }) => void
}) {
  return (
    <div>
      <StepHeader
        step={4} total={4}
        title="How should we notify you?"
        subtitle="We'll send Slack DMs when rides matching your stop are posted."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: '#1A1A1A', borderRadius: '10px', padding: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#fff', marginBottom: '2px' }}>Slack DMs</p>
            <p style={{ fontSize: '13px', color: '#888' }}>Get notified when a matching ride is posted</p>
          </div>
          <button
            onClick={() => onChange({ ...value, slackDMs: !value.slackDMs })}
            style={{
              width: '44px', height: '24px', borderRadius: '12px',
              background: value.slackDMs ? '#2E86C1' : '#444',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '3px',
              left: value.slackDMs ? '23px' : '3px',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {value.slackDMs && (
          <div>
            <p style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Frequency
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {([
                { val: 'instant' as const, label: 'Instant',      desc: 'Notify me as soon as a ride is posted' },
                { val: 'digest'  as const, label: 'Daily digest',  desc: 'One summary each morning' },
              ]).map(({ val, label, desc }) => {
                const selected = value.frequency === val
                return (
                  <button
                    key={val}
                    onClick={() => onChange({ ...value, frequency: val })}
                    style={{
                      background: '#1A1A1A',
                      border: selected ? '1.5px solid #2E86C1' : '1.5px solid #333',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: selected ? '#2E86C1' : 'transparent',
                      border: selected ? 'none' : '1.5px solid #555',
                    }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: selected ? 500 : 400, color: selected ? '#fff' : '#ccc' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: '12px', color: '#888' }}>{desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const completeOnboardingFn = httpsCallable(functions, 'completeOnboarding')

export function OnboardingFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [state, setState] = useState<OnboardingState>({
    defaultStop:      null,
    departureWindow:  null,
    hasCar:           null,
    notificationPrefs: { slackDMs: true, frequency: 'instant' },
  })

  async function finish() {
    setSaving(true)
    try {
      await completeOnboardingFn({
        defaultStop:      state.defaultStop,
        departureWindow:  state.departureWindow,
        hasCar:           state.hasCar ?? false,
        notificationPrefs: state.notificationPrefs,
      })
      // onSnapshot listener will pick up onboardingComplete: true automatically,
      // which releases the OnboardingGuard and allows navigation to /board
      navigate('/board', { replace: true })
    } catch (err) {
      console.error('completeOnboarding error:', err)
      setSaving(false)
    }
  }

  function next() {
    if (step < 4) setStep(s => s + 1)
    else finish()
  }

  function canAdvance() {
    if (step === 3 && state.hasCar === null) return false
    return true
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div style={{ flex: 1, maxWidth: '420px', margin: '0 auto', width: '100%', padding: '48px 24px 24px' }}>
        <ProgressBar step={step} total={4} />

        {step === 1 && (
          <Step1Stop
            value={state.defaultStop}
            onChange={v => setState(s => ({ ...s, defaultStop: v }))}
          />
        )}
        {step === 2 && (
          <Step2DepartureWindow
            value={state.departureWindow}
            onChange={v => setState(s => ({ ...s, departureWindow: v }))}
          />
        )}
        {step === 3 && (
          <Step3CarAccess
            value={state.hasCar}
            onChange={v => setState(s => ({ ...s, hasCar: v }))}
          />
        )}
        {step === 4 && (
          <Step4Notifications
            value={state.notificationPrefs}
            onChange={v => setState(s => ({ ...s, notificationPrefs: v }))}
          />
        )}
      </div>

      {/* Footer actions */}
      <div style={{ maxWidth: '420px', margin: '0 auto', width: '100%', padding: '16px 24px 40px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={next}
          disabled={!canAdvance() || saving}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            background: canAdvance() && !saving ? '#2E86C1' : '#ccc',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            cursor: canAdvance() && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving…' : step === 4 ? 'Get started' : 'Next'}
        </button>

        {step !== 3 && (
          <button
            onClick={next}
            style={{
              background: 'none', border: 'none', color: '#999',
              fontSize: '13px', cursor: 'pointer', padding: '4px',
            }}
          >
            {step === 4 ? 'Skip for now' : 'Skip this step'}
          </button>
        )}
      </div>
    </div>
  )
}
