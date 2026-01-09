'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

interface PaymentMethodsProps {
  selected: 'toss' | 'kakao' | 'naver'
  onSelect: (method: 'toss' | 'kakao' | 'naver') => void
}

const methods = [
  {
    id: 'toss',
    name: '토스페이먼츠',
    description: '카드, 계좌이체, 간편결제',
    icon: '/images/toss-logo.svg',
    color: 'border-blue-500',
  },
  {
    id: 'kakao',
    name: '카카오페이',
    description: '카카오페이 간편결제',
    icon: '/images/kakao-logo.svg',
    color: 'border-yellow-500',
  },
  {
    id: 'naver',
    name: '네이버페이',
    description: '네이버페이 간편결제',
    icon: '/images/naver-logo.svg',
    color: 'border-green-500',
  },
] as const

export function PaymentMethods({ selected, onSelect }: PaymentMethodsProps) {
  return (
    <RadioGroup
      value={selected}
      onValueChange={(value) => onSelect(value as typeof selected)}
      className="grid gap-3"
    >
      {methods.map((method) => (
        <Label
          key={method.id}
          htmlFor={method.id}
          className="cursor-pointer"
        >
          <Card className={cn(
            'transition-all',
            selected === method.id && `${method.color} border-2`
          )}>
            <CardContent className="flex items-center gap-4 p-4">
              <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
                  method.id === 'toss' && 'bg-blue-100 text-blue-600',
                  method.id === 'kakao' && 'bg-yellow-100 text-yellow-600',
                  method.id === 'naver' && 'bg-green-100 text-green-600'
                )}
              >
                {method.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{method.name}</p>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                selected === method.id ? 'border-primary bg-primary' : 'border-muted'
              )}>
                {selected === method.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </CardContent>
          </Card>
        </Label>
      ))}
    </RadioGroup>
  )
}
