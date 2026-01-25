'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, History, Coins, Calendar, FileText, AlertTriangle } from 'lucide-react'

interface ChangeItem {
  id: string
  change_type: string
  field_name: string
  old_value: string | null
  new_value: string | null
  detected_at: string
}

interface ChangeHistoryProps {
  announcementId: string
}

// 변경 유형 라벨
const changeTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  amount: {
    label: '지원금액',
    icon: <Coins className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  deadline: {
    label: '마감일',
    icon: <Calendar className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  status: {
    label: '상태',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  content: {
    label: '내용',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  other: {
    label: '기타',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
  },
}

// 날짜 포맷
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 상대 시간
function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return formatDate(dateStr)
}

// 값 포맷
function formatValue(value: string | null, fieldName: string): string {
  if (!value) return '(없음)'

  if (fieldName === 'application_end' || fieldName === 'application_start') {
    const date = new Date(value)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (fieldName === 'status') {
    const statusMap: Record<string, string> = {
      active: '모집중',
      expired: '마감',
      closed: '종료',
    }
    return statusMap[value] || value
  }

  return value
}

export function ChangeHistory({ announcementId }: ChangeHistoryProps) {
  const [changes, setChanges] = useState<ChangeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChanges = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/announcements/${announcementId}/changes`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setChanges(result.changes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '변경 이력을 불러오지 못했어요')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChanges()
  }, [announcementId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={fetchChanges}>
          <RefreshCw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      </div>
    )
  }

  if (changes.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">변경 이력이 없어요</p>
        <p className="text-sm text-muted-foreground mt-1">
          공고 내용이 변경되면 여기에 기록돼요
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          총 {changes.length}건의 변경 이력
        </p>
        <Button variant="ghost" size="sm" onClick={fetchChanges}>
          <RefreshCw className="h-4 w-4 mr-1" />
          새로고침
        </Button>
      </div>

      <div className="space-y-3">
        {changes.map((change) => {
          const typeInfo = changeTypeLabels[change.change_type] || changeTypeLabels.other

          return (
            <div
              key={change.id}
              className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* 아이콘 */}
                <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                  {typeInfo.icon}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={typeInfo.color}>
                      {typeInfo.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(change.detected_at)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground line-through">
                        {formatValue(change.old_value, change.field_name)}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-primary">
                        {formatValue(change.new_value, change.field_name)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
