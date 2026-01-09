'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NewApplicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const matchId = searchParams.get('matchId')
  const announcementId = searchParams.get('announcementId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!matchId) {
      setError('매칭 정보가 없습니다. AI 매칭을 먼저 진행해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      })

      const result = await response.json()

      if (!result.success) {
        // 이미 지원서가 있는 경우
        if (result.existingId) {
          toast.info('이미 작성된 지원서가 있습니다')
          router.push(`/dashboard/applications/${result.existingId}`)
          return
        }
        throw new Error(result.error || '지원서 생성에 실패했습니다')
      }

      toast.success('AI가 지원서 초안을 작성했습니다')
      router.push(`/dashboard/applications/${result.data.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : '오류가 발생했습니다')
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // matchId가 있으면 자동으로 생성 시작
  useEffect(() => {
    if (matchId && !loading && !error) {
      handleCreate()
    }
  }, [matchId])

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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold mb-2">AI가 지원서를 작성 중입니다</h2>
            <p className="text-muted-foreground">
              기업 정보와 공고 내용을 분석하여 맞춤형 지원서를 생성합니다.
              <br />
              잠시만 기다려주세요... (약 30초~1분 소요)
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
            <Button onClick={handleCreate}>
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
