'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GitCompare, ArrowLeft, Building2, Clock, Trash2, ExternalLink, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCompareStore } from '@/stores/compare-store'

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  smes: '중소벤처24',
  g2b: '나라장터',
}

// 출처별 색상
const sourceColors: Record<string, string> = {
  bizinfo: 'bg-blue-100 text-blue-700',
  kstartup: 'bg-green-100 text-green-700',
  smes: 'bg-purple-100 text-purple-700',
  g2b: 'bg-orange-100 text-orange-700',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getDaysLeft(endDate: string | null) {
  if (!endDate) return null
  const end = new Date(endDate)
  const today = new Date()
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function ComparePage() {
  const router = useRouter()
  const { announcements, removeAnnouncement, clearAll } = useCompareStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GitCompare className="h-8 w-8" />
              공고 비교
            </h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">비교할 공고가 없어요</h3>
            <p className="text-muted-foreground mb-4">
              공고 목록에서 비교 버튼을 눌러 공고를 추가해 보세요
            </p>
            <Button asChild>
              <Link href="/dashboard/announcements">공고 검색하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (announcements.length < 2) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GitCompare className="h-8 w-8" />
              공고 비교
            </h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">비교하려면 최소 2개 공고가 필요해요</h3>
            <p className="text-muted-foreground mb-4">
              현재 {announcements.length}개 선택됨. 공고를 더 추가해 주세요.
            </p>
            <Button asChild>
              <Link href="/dashboard/announcements">공고 더 추가하기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 비교 항목
  const compareFields = [
    { key: 'organization', label: '기관', icon: Building2 },
    { key: 'category', label: '분류', icon: null },
    { key: 'support_type', label: '지원유형', icon: null },
    { key: 'support_amount', label: '지원금액', icon: null },
    { key: 'application_end', label: '마감일', icon: Clock },
    { key: 'source', label: '출처', icon: null },
  ]

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <GitCompare className="h-8 w-8" />
              공고 비교
            </h1>
            <p className="text-muted-foreground mt-1">
              {announcements.length}개 공고를 비교하고 있어요
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={clearAll}>
          <Trash2 className="h-4 w-4 mr-2" />
          전체 삭제
        </Button>
      </div>

      {/* 비교 테이블 */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* 공고 제목 헤더 */}
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `150px repeat(${announcements.length}, 1fr)` }}>
            <div className="font-medium text-muted-foreground py-4">공고명</div>
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="relative">
                <button
                  onClick={() => removeAnnouncement(announcement.id)}
                  className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <CardHeader className="pb-2">
                  <Badge
                    variant="secondary"
                    className={`w-fit ${sourceColors[announcement.source] || ''}`}
                  >
                    {sourceLabels[announcement.source] || announcement.source}
                  </Badge>
                  <CardTitle className="text-base line-clamp-2 pr-6">
                    {announcement.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/dashboard/announcements/${announcement.id}`}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        상세
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/dashboard/matching?announcementId=${announcement.id}`}>
                        <TrendingUp className="h-4 w-4 mr-1" />
                        매칭
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="my-4" />

          {/* 비교 항목들 */}
          {compareFields.map((field) => (
            <div
              key={field.key}
              className={`grid gap-4 py-3 border-b last:border-b-0`}
              style={{ gridTemplateColumns: `150px repeat(${announcements.length}, 1fr)` }}
            >
              <div className="font-medium text-muted-foreground flex items-center gap-2">
                {field.icon && <field.icon className="h-4 w-4" />}
                {field.label}
              </div>
              {announcements.map((announcement) => {
                const value = announcement[field.key as keyof typeof announcement]

                // 마감일 특별 처리
                if (field.key === 'application_end' && value) {
                  const daysLeft = getDaysLeft(value as string)
                  return (
                    <div key={announcement.id}>
                      <div>{formatDate(value as string)}</div>
                      {daysLeft !== null && (
                        <Badge
                          variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 14 ? 'secondary' : 'outline'}
                          className="mt-1"
                        >
                          D-{daysLeft > 0 ? daysLeft : 0}
                        </Badge>
                      )}
                    </div>
                  )
                }

                // 출처 특별 처리
                if (field.key === 'source') {
                  return (
                    <div key={announcement.id}>
                      <Badge
                        variant="secondary"
                        className={sourceColors[value as string] || ''}
                      >
                        {sourceLabels[value as string] || value}
                      </Badge>
                    </div>
                  )
                }

                // 지원금액 강조
                if (field.key === 'support_amount' && value) {
                  return (
                    <div key={announcement.id} className="font-medium text-primary">
                      {value as string}
                    </div>
                  )
                }

                return (
                  <div key={announcement.id} className="text-sm">
                    {value || '-'}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 하단 안내 */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <CardDescription className="text-center">
            각 공고를 클릭하면 상세 정보를 확인하거나 AI 매칭 분석을 받을 수 있어요
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
