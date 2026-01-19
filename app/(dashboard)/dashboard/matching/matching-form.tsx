'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, Sparkles, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useMatchingStream } from '@/lib/hooks/use-matching-stream'

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
  const [announcement, setAnnouncement] = useState(selectedAnnouncement)
  const [showDialog, setShowDialog] = useState(false)

  const {
    isStreaming,
    progress,
    message,
    analysis,
    matchId,
    error,
    startAnalysis,
    reset,
  } = useMatchingStream({
    onComplete: (newMatchId) => {
      toast.success('분석이 완료됐어요')
      // 3초 후 자동으로 결과 페이지로 이동
      setTimeout(() => {
        router.push(`/dashboard/matching/${newMatchId}`)
      }, 2000)
    },
    onError: (errorMsg) => {
      toast.error(errorMsg)
    },
  })

  const handleAnalyze = async () => {
    if (!announcement) {
      toast.error('공고를 선택해주세요')
      return
    }

    if (!canAnalyze) {
      toast.error('이번 달 무료 사용량을 모두 사용했습니다')
      return
    }

    setShowDialog(true)
    await startAnalysis(announcement.id, companyId)
  }

  const handleCloseDialog = () => {
    if (!isStreaming) {
      setShowDialog(false)
      reset()
      if (matchId) {
        router.push(`/dashboard/matching/${matchId}`)
      }
    }
  }

  return (
    <>
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
            disabled={isStreaming || !canAnalyze}
            className="w-full"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI 매칭 분석 시작
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

      {/* 스트리밍 다이얼로그 */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => isStreaming && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isStreaming ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  AI 매칭 분석 중
                </>
              ) : error ? (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  분석 실패
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  분석 완료
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {announcement?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 진행률 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{message}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* 분석 결과 미리보기 */}
            {analysis && !error && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">매칭 점수</span>
                  <span className="text-2xl font-bold text-primary">
                    {analysis.overallScore}점
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">지원 자격</span>
                  {analysis.eligibility?.isEligible ? (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      적격
                    </span>
                  ) : (
                    <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      부적격
                    </span>
                  )}
                </div>
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">주요 강점</span>
                    <p className="text-sm mt-1">{analysis.strengths[0]}</p>
                  </div>
                )}
              </div>
            )}

            {/* 에러 표시 */}
            {error && (
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* 완료 후 버튼 */}
            {!isStreaming && (
              <div className="flex gap-2 pt-2">
                {error ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCloseDialog}
                    >
                      닫기
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        reset()
                        if (announcement) {
                          startAnalysis(announcement.id, companyId)
                        }
                      }}
                    >
                      다시 시도
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleCloseDialog}
                  >
                    결과 확인하기
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
