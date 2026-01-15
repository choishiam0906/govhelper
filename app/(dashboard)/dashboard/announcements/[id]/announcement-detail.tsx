'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Loader2,
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  target_company: string | null
  support_amount: string | null
  application_start: string | null
  application_end: string | null
  content: string | null
  parsed_content: string | null
  attachment_urls: string[] | null
  source: string
  status: string
  created_at: string
}

interface AnnouncementDetailProps {
  announcement: Announcement
  isSaved: boolean
}

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  narajangteo: '나라장터',
  datagoKr: '공공데이터',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
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

export function AnnouncementDetail({ announcement, isSaved: initialSaved }: AnnouncementDetailProps) {
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [saving, setSaving] = useState(false)

  const daysLeft = getDaysLeft(announcement.application_end)

  const toggleSave = async () => {
    setSaving(true)
    try {
      const method = isSaved ? 'DELETE' : 'POST'
      const response = await fetch('/api/saved-announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: announcement.id }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      setIsSaved(!isSaved)
      toast.success(isSaved ? '관심 공고를 해제했어요' : '관심 공고로 저장했어요')
    } catch (error) {
      toast.error('오류가 발생했어요')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        목록으로
      </Button>

      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge>{sourceLabels[announcement.source] || announcement.source}</Badge>
            {announcement.category && <Badge variant="outline">{announcement.category}</Badge>}
            {announcement.support_type && <Badge variant="secondary">{announcement.support_type}</Badge>}
            {announcement.status === 'closed' && <Badge variant="destructive">마감</Badge>}
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold mb-4">{announcement.title}</h1>

          <div className="flex flex-wrap gap-4 text-muted-foreground">
            {announcement.organization && (
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{announcement.organization}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(announcement.application_start)} ~ {formatDate(announcement.application_end)}
              </span>
            </div>
          </div>
        </div>

        {/* 사이드 카드 */}
        <Card className="lg:w-80 shrink-0">
          <CardContent className="pt-6 space-y-4">
            {/* 마감일 */}
            {daysLeft !== null && (
              <div className={`text-center p-4 rounded-lg ${
                daysLeft <= 7 ? 'bg-red-50 text-red-700' :
                daysLeft <= 14 ? 'bg-orange-50 text-orange-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                <p className="text-3xl font-bold">D-{daysLeft > 0 ? daysLeft : 0}</p>
                <p className="text-sm">마감까지</p>
              </div>
            )}

            {/* 지원금액 */}
            {announcement.support_amount && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">지원금액</p>
                <p className="text-xl font-bold">{announcement.support_amount}</p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="space-y-2">
              <Button
                variant={isSaved ? 'secondary' : 'outline'}
                className="w-full"
                onClick={toggleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : isSaved ? (
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                ) : (
                  <Bookmark className="h-4 w-4 mr-2" />
                )}
                {isSaved ? '관심 등록됨' : '관심 등록'}
              </Button>

              <Button asChild className="w-full">
                <Link href={`/dashboard/matching?announcementId=${announcement.id}`}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  AI 매칭 분석
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 상세 내용 탭 */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">공고 내용</TabsTrigger>
          <TabsTrigger value="requirements">지원 자격</TabsTrigger>
          <TabsTrigger value="attachments">첨부파일</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {announcement.parsed_content || announcement.content ? (
                <div
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: announcement.parsed_content || announcement.content || '',
                  }}
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  상세 내용이 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>지원 자격</CardTitle>
              <CardDescription>이 공고에 지원하기 위한 자격 요건입니다</CardDescription>
            </CardHeader>
            <CardContent>
              {announcement.target_company ? (
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-2">지원 대상</p>
                    <p className="text-muted-foreground">{announcement.target_company}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  자격 요건 정보가 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>첨부파일</CardTitle>
              <CardDescription>공고와 관련된 첨부파일입니다</CardDescription>
            </CardHeader>
            <CardContent>
              {announcement.attachment_urls && announcement.attachment_urls.length > 0 ? (
                <div className="space-y-2">
                  {announcement.attachment_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">첨부파일 {index + 1}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  첨부파일이 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
