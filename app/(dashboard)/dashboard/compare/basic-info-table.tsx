'use client'

import { CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CompareAnnouncement } from '@/stores/compare-store'
import type { BasicField } from './types'
import { sourceLabels, sourceColors } from './types'
import { formatDate, getDaysLeft, parseAmount } from './utils'

interface BasicInfoTableProps {
  announcements: CompareAnnouncement[]
  basicFields: BasicField[]
  maxAmount: number
  latestEnd: number
  loading: boolean
}

export function BasicInfoTable({
  announcements,
  basicFields,
  maxAmount,
  latestEnd,
  loading,
}: BasicInfoTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">상세 비교</CardTitle>
          <CardDescription>각 항목별로 공고를 비교해 보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">상세 비교</CardTitle>
        <CardDescription>각 항목별로 공고를 비교해 보세요</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[140px]">항목</th>
                {announcements.map((a) => (
                  <th key={a.id} className="text-left py-3 px-4 font-medium">
                    <span className="line-clamp-1">{a.title}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {basicFields.map((field) => (
                <tr key={field.key} className="border-b last:border-b-0 hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {field.icon && <field.icon className="h-4 w-4" />}
                      {field.label}
                    </span>
                  </td>
                  {announcements.map((announcement) => {
                    const value = announcement[field.key as keyof typeof announcement]
                    const amount = parseAmount(announcement.support_amount)
                    const isBestAmount = amount === maxAmount && amount > 0

                    // 마감일 렌더링
                    if (field.key === 'application_end' && value) {
                      const daysLeft = getDaysLeft(value as string)
                      const endDate = new Date(value as string).getTime()
                      const isLatest = endDate === latestEnd
                      return (
                        <td key={announcement.id} className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={isLatest ? 'text-blue-600 font-medium' : ''}>
                              {formatDate(value as string)}
                            </span>
                            {daysLeft !== null && daysLeft >= 0 && (
                              <Badge
                                variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 14 ? 'secondary' : 'outline'}
                              >
                                D-{daysLeft}
                              </Badge>
                            )}
                            {isLatest && <CheckCircle className="h-4 w-4 text-blue-500" />}
                          </div>
                        </td>
                      )
                    }

                    // 접수 시작일 렌더링
                    if (field.key === 'application_start' && value) {
                      return (
                        <td key={announcement.id} className="py-3 px-4">
                          {formatDate(value as string)}
                        </td>
                      )
                    }

                    // 출처 렌더링
                    if (field.key === 'source') {
                      const sourceValue = value as string
                      return (
                        <td key={announcement.id} className="py-3 px-4">
                          <Badge variant="secondary" className={sourceColors[sourceValue] || ''}>
                            {sourceLabels[sourceValue] || sourceValue || '-'}
                          </Badge>
                        </td>
                      )
                    }

                    // 지원금액 렌더링
                    if (field.key === 'support_amount') {
                      return (
                        <td key={announcement.id} className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className={isBestAmount ? 'text-green-600 font-bold' : 'font-medium'}>
                              {(value as string) || '-'}
                            </span>
                            {isBestAmount && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                        </td>
                      )
                    }

                    // 기본 렌더링
                    return (
                      <td key={announcement.id} className="py-3 px-4 text-sm">
                        {(value as string) || '-'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
