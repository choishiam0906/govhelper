'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  Trophy,
  Lock,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
  Mail,
  Crown,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface MatchResult {
  rank: number
  score: number
  title: string
  organization: string
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_end: string | null
  summary: string
  strengths: string[]
  weaknesses: string[]
  blurred: boolean
  announcement_id?: string
}

interface ResultData {
  id: string
  matches: MatchResult[]
  topRevealed: boolean
  createdAt: string
  company: {
    name: string
    industry: string
    employeeCount: number
    location: string
  }
}

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ResultData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResult()
  }, [params.id])

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/guest/matching/${params.id}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || '결과를 불러올 수 없어요')
      }
    } catch (err) {
      setError('결과를 불러오는 중 오류가 발생했어요')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500'
    if (score >= 60) return 'from-blue-500 to-cyan-500'
    if (score >= 40) return 'from-yellow-500 to-orange-500'
    return 'from-gray-400 to-gray-500'
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Crown, color: 'bg-yellow-500', text: '1위' }
    if (rank === 2) return { icon: Star, color: 'bg-gray-400', text: '2위' }
    return { icon: Trophy, color: 'bg-orange-400', text: `${rank}위` }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              정부지원사업도우미
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              정부지원사업도우미
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Card>
            <CardContent className="py-16 text-center">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">결과를 찾을 수 없어요</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => router.push('/try')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 분석하기
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const blurredMatches = data.matches.filter(m => m.blurred)
  const visibleMatches = data.matches.filter(m => !m.blurred)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* 헤더 */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            정부지원사업도우미
          </Link>
          <Button size="sm" asChild>
            <Link href="/register">회원가입</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 기업 정보 & 요약 */}
        <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {data.company.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {data.company.industry} · {data.company.location} · 직원 {data.company.employeeCount}명
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-background">
                {new Date(data.createdAt).toLocaleDateString('ko-KR')} 분석
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">매칭된 지원사업</p>
                <p className="text-3xl font-bold">{data.matches.length}건</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">최고 매칭률</p>
                <p className={`text-3xl font-bold ${getScoreColor(data.matches[0]?.score || 0)}`}>
                  {data.matches[0]?.score || 0}점
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 블러 처리된 상위 매칭 (1~2순위) */}
        {blurredMatches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">TOP 매칭 지원사업</h2>
              <Badge variant="secondary">잠김</Badge>
            </div>

            <div className="space-y-4">
              {blurredMatches.map((match) => {
                const rankInfo = getRankBadge(match.rank)
                const RankIcon = rankInfo.icon

                return (
                  <Card key={match.rank} className="relative overflow-hidden">
                    {/* 블러 오버레이 */}
                    <div className="absolute inset-0 backdrop-blur-md bg-background/80 z-10 flex flex-col items-center justify-center p-6">
                      <Lock className="h-8 w-8 text-muted-foreground mb-3" />
                      <p className="text-center font-medium mb-1">
                        {match.rank}위 매칭 지원사업
                      </p>
                      <p className="text-center text-sm text-muted-foreground mb-4">
                        매칭률 <span className={`font-bold ${getScoreColor(match.score)}`}>{match.score}점</span>
                      </p>
                      <Button size="sm" asChild>
                        <Link href="/register">
                          회원가입하고 확인하기
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Link>
                      </Button>
                    </div>

                    {/* 블러된 컨텐츠 */}
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className={`${rankInfo.color} text-white p-2 rounded-lg`}>
                          <RankIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{match.title}</CardTitle>
                          <CardDescription>{match.organization}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">매칭률</span>
                          <Progress value={match.score} className="flex-1" />
                          <span className={`font-bold ${getScoreColor(match.score)}`}>{match.score}점</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* 공개된 매칭 (3~5순위) */}
        {visibleMatches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">추천 지원사업</h2>
            </div>

            <div className="space-y-4">
              {visibleMatches.map((match) => {
                const rankInfo = getRankBadge(match.rank)
                const RankIcon = rankInfo.icon

                return (
                  <Card key={match.rank}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className={`${rankInfo.color} text-white p-2 rounded-lg`}>
                          <RankIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg">{match.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Building2 className="h-3 w-3" />
                            {match.organization}
                            {match.application_end && (
                              <>
                                <span className="text-muted-foreground">·</span>
                                <Calendar className="h-3 w-3" />
                                마감 {new Date(match.application_end).toLocaleDateString('ko-KR')}
                              </>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 매칭률 */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-14">매칭률</span>
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${getScoreGradient(match.score)}`}
                              style={{ width: `${match.score}%` }}
                            />
                          </div>
                          <span className={`font-bold text-lg ${getScoreColor(match.score)}`}>
                            {match.score}점
                          </span>
                        </div>

                        {/* 요약 */}
                        <p className="text-sm text-muted-foreground">{match.summary}</p>

                        {/* 분류 태그 */}
                        <div className="flex flex-wrap gap-2">
                          {match.category && (
                            <Badge variant="secondary">{match.category}</Badge>
                          )}
                          {match.support_type && (
                            <Badge variant="outline">{match.support_type}</Badge>
                          )}
                          {match.support_amount && (
                            <Badge variant="outline">{match.support_amount}</Badge>
                          )}
                        </div>

                        {/* 강점/약점 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-green-600 mb-1 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              강점
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-0.5">
                              {match.strengths.map((s, i) => (
                                <li key={i}>· {s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-orange-600 mb-1 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              약점
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-0.5">
                              {match.weaknesses.map((w, i) => (
                                <li key={i}>· {w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA 카드 */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-bold mb-2">
              모든 매칭 결과를 확인하고 싶으신가요?
            </h3>
            <p className="text-primary-foreground/80 mb-6">
              회원가입하시면 1~2위 지원사업과 AI 지원서 작성까지 이용할 수 있어요
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/register">
                  무료 회원가입
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
                <Link href="/try">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 분석하기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 이메일 안내 */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            분석 결과가 이메일로도 발송됐어요
          </p>
        </div>
      </main>
    </div>
  )
}
