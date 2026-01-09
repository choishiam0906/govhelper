import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react'

interface AnalysisCardProps {
  type: 'strengths' | 'weaknesses' | 'recommendations'
  items: string[]
}

const config = {
  strengths: {
    title: '강점',
    icon: CheckCircle,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  weaknesses: {
    title: '보완 필요',
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  recommendations: {
    title: '추천사항',
    icon: Lightbulb,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
}

export function AnalysisCard({ type, items }: AnalysisCardProps) {
  const { title, icon: Icon, iconColor, bgColor, borderColor } = config[type]

  if (!items || items.length === 0) {
    return null
  }

  return (
    <Card className={`${borderColor} border`}>
      <CardHeader className={`${bgColor} pb-3`}>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${iconColor.replace('text-', 'bg-')}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
