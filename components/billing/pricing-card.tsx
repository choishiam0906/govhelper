'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingCardProps {
  name: string
  description: string
  price: number
  period: 'monthly' | 'yearly'
  features: string[]
  popular?: boolean
  current?: boolean
  onSelect?: () => void
  disabled?: boolean
}

export function PricingCard({
  name,
  description,
  price,
  period,
  features,
  popular = false,
  current = false,
  onSelect,
  disabled = false,
}: PricingCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  return (
    <Card className={cn(
      'relative',
      popular && 'border-primary shadow-lg',
      current && 'bg-muted/30'
    )}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          인기
        </Badge>
      )}
      {current && (
        <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2">
          현재 플랜
        </Badge>
      )}
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <span className="text-4xl font-bold">{formatPrice(price)}</span>
          <span className="text-muted-foreground">
            원/{period === 'monthly' ? '월' : '년'}
          </span>
          {period === 'yearly' && (
            <p className="text-sm text-green-600 mt-1">
              월 {formatPrice(Math.round(price / 12))}원 (2개월 무료)
            </p>
          )}
        </div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={popular ? 'default' : 'outline'}
          onClick={onSelect}
          disabled={disabled || current}
        >
          {current ? '사용 중' : '선택하기'}
        </Button>
      </CardFooter>
    </Card>
  )
}
