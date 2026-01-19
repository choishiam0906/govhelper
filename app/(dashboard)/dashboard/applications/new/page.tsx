'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2, Sparkles, AlertCircle, CheckCircle2, Circle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useApplicationStream } from '@/lib/hooks/use-application-stream'
import { cn } from '@/lib/utils'

export default function NewApplicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const matchId = searchParams.get('matchId')

  const [hasStarted, setHasStarted] = useState(false)

  const {
    isStreaming,
    progress,
    message,
    currentSection,
    sections,
    applicationId,
    error,
    startGeneration,
    reset,
  } = useApplicationStream({
    onComplete: (newApplicationId) => {
      toast.success('AI가 지원서 초안을 작성했어요')
      // 2초 후 자동으로 지원서 페이지로 이동
      setTimeout(() => {
        router.push(`/dashboard/applications/${newApplicationId}`)
      }, 2000)
    },
    onError: (errorMsg) => {
      toast.error(errorMsg)
    },
  })

  const handleCreate = async () => {
    if (!matchId) return
    setHasStarted(true)
    await startGeneration(matchId)
  }

  // matchId가 있으면 자동으로 생성 시작
  useEffect(() => {
    if (matchId && !hasStarted && !isStreaming && !applicationId && !error) {
      handleCreate()
    }
  }, [matchId, hasStarted])

  // 기존 지원서가 있는 경우 리다이렉트
  useEffect(() => {
    if (applicationId && !isStreaming) {
      router.push(`/dashboard/applications/${applicationId}`)
    }
  }, [applicationId, isStreaming])

  if (!matchId) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>매칭 정보 필요</CardTitle>
            <CardDescription>
              AI 지원서를 작성하려면 먼저 AI 매칭 분석을 진행해야 합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/dashboard/matching">
                AI 매칭 분석으로 이동
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isStreaming || (hasStarted && !error && !applicationId)) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <CardTitle>AI가 지원서를 작성 중입니다</CardTitle>
            <CardDescription>
              기업 정보와 공고 내용을 분석하여 맞춤형 지원서를 생성합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 진행률 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{message}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* 섹션 목록 */}
            <div className="space-y-3">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg transition-colors',
                    section.isComplete
                      ? 'bg-green-50 dark:bg-green-950/30'
                      : index === currentSection
                      ? 'bg-primary/10'
                      : 'bg-muted/50'
                  )}
                >
                  <div className="mt-0.5">
                    {section.isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : index === currentSection ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium',
                        section.isComplete
                          ? 'text-green-700 dark:text-green-400'
                          : index === currentSection
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      {section.sectionName}
                    </p>
                    {index === currentSection && section.content && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {section.content.slice(0, 100)}...
                      </p>
                    )}
                    {section.isComplete && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        작성 완료
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-center text-muted-foreground">
              창을 닫지 마세요. AI가 지원서를 작성 중입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>오류 발생</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-x-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/matching">
                매칭 분석으로 돌아가기
              </Link>
            </Button>
            <Button
              onClick={() => {
                reset()
                setHasStarted(false)
                handleCreate()
              }}
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader className="text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
          <CardTitle>AI 지원서 작성</CardTitle>
          <CardDescription>
            AI가 기업 정보와 공고 내용을 분석하여 지원서 초안을 작성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleCreate} size="lg">
            <Sparkles className="h-4 w-4 mr-2" />
            지원서 작성 시작
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
