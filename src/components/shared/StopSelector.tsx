import { STOPS } from '../../utils/constants'
import { MtaBadge } from './MtaBadge'

interface StopSelectorProps {
  value: string | null
  onChange: (stopId: string, stopName: string, isCustom: boolean) => void
  customLocation?: string
  onCustomLocationChange?: (value: string) => void
}

export function StopSelector({ value, onChange, customLocation, onCustomLocationChange }: StopSelectorProps) {
  const displayStops = STOPS.filter(s => !s.isSpecial)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {displayStops.map((stop, i) => {
        const selected = value === stop.id
        const prevGroup = i > 0 ? displayStops[i - 1].visualGroup : null
        const showGroupLabel = stop.visualGroup && stop.visualGroup !== prevGroup

        return (
          <div key={stop.id}>
            {showGroupLabel && (
              <p style={{
                fontSize: '11px',
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '6px',
                marginTop: '8px',
              }}>
                {stop.visualGroup}
              </p>
            )}
            <button
              onClick={() => onChange(stop.id, stop.name, false)}
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
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: selected ? '#2E86C1' : 'transparent',
                  border: selected ? 'none' : '1.5px solid #555',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: selected ? 500 : 400,
                  color: selected ? '#fff' : '#ccc',
                }}>
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

      {/* Custom location */}
      <button
        onClick={() => onChange('custom', customLocation || '', true)}
        style={{
          width: '100%',
          background: value === 'custom' ? '#1A1A1A' : '#f9f9f9',
          borderRadius: '8px',
          padding: '12px 14px',
          border: value === 'custom' ? '1.5px solid #2E86C1' : '1px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          marginTop: '2px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span style={{ fontSize: '13px', color: '#999' }}>Custom location...</span>
      </button>

      {/* Custom location text input — shown when custom is selected */}
      {value === 'custom' && onCustomLocationChange && (
        <input
          type="text"
          placeholder="Enter address or landmark"
          value={customLocation || ''}
          onChange={e => {
            onCustomLocationChange(e.target.value)
            onChange('custom', e.target.value, true)
          }}
          autoFocus
          style={{
            background: '#1A1A1A',
            border: '1.5px solid #2E86C1',
            borderRadius: '8px',
            padding: '12px 14px',
            color: '#fff',
            fontSize: '14px',
            width: '100%',
          }}
        />
      )}
    </div>
  )
}
