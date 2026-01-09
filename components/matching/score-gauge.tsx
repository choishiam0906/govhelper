'use client'

interface ScoreGaugeProps {
  score: number
  maxScore?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
}

export function ScoreGauge({
  score,
  maxScore = 100,
  size = 'md',
  showLabel = true,
  label,
}: ScoreGaugeProps) {
  const percentage = Math.min((score / maxScore) * 100, 100)

  const sizes = {
    sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { width: 160, strokeWidth: 10, fontSize: 'text-4xl' },
  }

  const { width, strokeWidth, fontSize } = sizes[size]
  const radius = (width - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  const getColor = (pct: number) => {
    if (pct >= 80) return '#22c55e' // green-500
    if (pct >= 60) return '#3b82f6' // blue-500
    if (pct >= 40) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  }

  const color = getColor(percentage)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width }}>
        {/* 배경 원 */}
        <svg className="transform -rotate-90" width={width} height={width}>
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
          {/* 진행 원 */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${fontSize}`} style={{ color }}>
            {Math.round(score)}
          </span>
          {maxScore !== 100 && (
            <span className="text-xs text-muted-foreground">/ {maxScore}</span>
          )}
        </div>
      </div>
      {showLabel && label && (
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      )}
    </div>
  )
}
