interface MtaBadgeProps {
  name: string
  color: string
  textColor: string
  size?: 'sm' | 'md'
}

export function MtaBadge({ name, color, textColor, size = 'md' }: MtaBadgeProps) {
  const isLIRR = name === 'LIRR'
  const dim = size === 'sm' ? '14px' : '16px'
  const fontSize = isLIRR ? '7px' : size === 'sm' ? '8px' : '9px'

  return (
    <span style={{
      background: color,
      color: textColor,
      fontSize,
      fontWeight: 700,
      width: isLIRR ? 'auto' : dim,
      height: dim,
      padding: isLIRR ? '0 4px' : '0',
      borderRadius: isLIRR ? '3px' : '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      lineHeight: 1,
    }}>
      {name}
    </span>
  )
}
