interface RiskGaugeProps {
  score: number | null
  size?: 'sm' | 'lg'
}

function getRiskColor(score: number) {
  if (score >= 70) return { color: '#ffb4ab', label: 'Critical', class: 'text-error' }
  if (score >= 30) return { color: '#f5fff3', label: 'Elevated', class: 'text-secondary' }
  return { color: '#a8e8ff', label: 'Optimal', class: 'text-primary' }
}

export function RiskGauge({ score, size = 'lg' }: RiskGaugeProps) {
  if (score === null) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-pulse rounded-full bg-slate-900" style={{ width: size === 'lg' ? 192 : 96, height: size === 'lg' ? 192 : 96 }} />
      </div>
    )
  }

  const { color, label } = getRiskColor(score)
  const radius = size === 'lg' ? 80 : 40
  const strokeWidth = size === 'lg' ? 12 : 6
  const svgSize = size === 'lg' ? 192 : 96
  const cx = svgSize / 2
  const cy = svgSize / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg className="w-full h-full -rotate-90">
          <circle 
            className="text-slate-900" 
            cx={cx} 
            cy={cy} 
            fill="transparent" 
            r={radius} 
            stroke="currentColor" 
            strokeWidth={strokeWidth - 4} 
          />
          <circle 
            style={{ 
              stroke: color,
              filter: `drop-shadow(0 0 8px ${color}80)`,
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: 'stroke-dashoffset 1s ease, stroke 1s ease'
            }} 
            cx={cx} 
            cy={cy} 
            fill="transparent" 
            r={radius} 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-on-surface" style={{ color }}>{score.toFixed(0)}</span>
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-tighter">Risk Score</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-mono text-xs uppercase font-bold tracking-widest" style={{ color }}>{label.toUpperCase()}_STANCE</p>
      </div>
    </div>
  )
}

