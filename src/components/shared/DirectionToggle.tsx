import type { Direction } from '../../utils/types'

interface DirectionToggleProps {
  value: Direction
  onChange: (d: Direction) => void
  layout?: 'horizontal' | 'vertical'
}

const OPTIONS: { value: Direction; label: string }[] = [
  { value: 'from-hq', label: 'From HQ' },
  { value: 'to-hq',   label: 'To HQ'   },
]

export function DirectionToggle({ value, onChange, layout = 'horizontal' }: DirectionToggleProps) {
  if (layout === 'vertical') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {OPTIONS.map(opt => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: active ? '#2E86C1' : 'transparent',
                color: active ? '#fff' : '#888',
                fontSize: '13px',
                fontWeight: active ? 500 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#2A2A2A'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{
      display: 'inline-flex',
      background: '#1A1A1A',
      borderRadius: '8px',
      padding: '3px',
      gap: '2px',
    }}>
      {OPTIONS.map(opt => {
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
              transition: 'background 0.15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
