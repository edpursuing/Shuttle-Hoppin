interface DriverInfoProps {
  name: string
  avatarUrl?: string
  ridesGiven?: number
  lateCancels?: number
  size?: 'sm' | 'md'
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function reliability(ridesGiven = 0, lateCancels = 0): string {
  if (ridesGiven === 0) return 'New driver'
  const pct = Math.round(((ridesGiven - lateCancels) / ridesGiven) * 100)
  return `${pct}% reliable`
}

export function DriverInfo({ name, avatarUrl, ridesGiven = 0, lateCancels = 0, size = 'sm' }: DriverInfoProps) {
  const dim = size === 'sm' ? '28px' : '40px'
  const nameFz  = size === 'sm' ? '11px' : '13px'
  const statsFz = size === 'sm' ? '9px'  : '11px'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Avatar */}
      <div style={{
        width: dim, height: dim, borderRadius: '50%',
        background: avatarUrl ? 'transparent' : '#333',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: nameFz, fontWeight: 500, color: '#ccc' }}>{initials(name)}</span>
        }
      </div>

      {/* Name + stats */}
      <div>
        <p style={{ fontSize: nameFz, color: '#ccc', margin: 0, lineHeight: 1.3 }}>{name}</p>
        <p style={{ fontSize: statsFz, color: '#666', margin: 0, lineHeight: 1.3 }}>
          {ridesGiven > 0 ? `${ridesGiven} ride${ridesGiven !== 1 ? 's' : ''} · ` : ''}
          {reliability(ridesGiven, lateCancels)}
        </p>
      </div>
    </div>
  )
}
