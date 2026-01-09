'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Search, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface MatchingFormProps {
  companyId: string
  companyName: string
  selectedAnnouncement: {
    id: string
    title: string
    organization: string | null
  } | null
  canAnalyze: boolean
}

export function MatchingForm({
  companyId,
  companyName,
  selectedAnnouncement,
  canAnalyze,
}: MatchingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [announcement, setAnnouncement] = useState(selectedAnnouncement)

  const handleAnalyze = async () => {
    if (!announcement) {
      toast.error('공고를 선택해주세요')
      return
    }

    if (!canAnalyze) {
      toast.error('이번 달 무료 사용량을 모두 사용했습니다')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: announcement.id,
          companyId,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '분석에 실패했습니다')
      }

      toast.success('분석이 완료되었습니다')
      router.push(`/dashboard/matching/${result.data.match.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 기업 정보 */}
      <div>
        <Label className="text-muted-foreground">분석 대상 기업</Label>
        <p className="font-medium">{companyName}</p>
      </div>

      {/* 공고 선택 */}
      <div className="space-y-2">
        <Label>분석할 공고</Label>
        {announcement ? (
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="font-medium">{announcement.title}</p>
            {announcement.organization && (
              <p className="text-sm text-muted-foreground">{announcement.organization}</p>
            )}
            <Button
              variant="link"
              className="p-0 h-auto text-sm"
              onClick={() => setAnnouncement(null)}
            >
              다른 공고 선택
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              공고 검색 페이지에서 분석할 공고를 선택해주세요
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/announcements">
                <Search className="h-4 w-4 mr-2" />
                공고 검색하기
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* 분석 버튼 */}
      {announcement && (
        <Button
          onClick={handleAnalyze}
          disabled={loading || !canAnalyze}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI가 분석 중입니다...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              AI 매칭 분석 시작
            </>
          )}
        </Button>
      )}

      {!canAnalyze && (
        <p className="text-sm text-center text-muted-foreground">
          무료 사용량을 모두 소진했습니다.{' '}
          <Link href="/dashboard/billing" className="text-primary hover:underline">
            Pro로 업그레이드
          </Link>
          하여 무제한으로 사용하세요.
        </p>
      )}
    </div>
  )
}
