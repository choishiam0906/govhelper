import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Bookmark,
  Clock,
  Building2,
  Coins,
  Calendar,
  FolderOpen,
  Tag,
  Filter,
  Search,
  AlertTriangle,
  ExternalLink,
  MoreVertical,
} from 'lucide-react'
import { SavedAnnouncementsList } from './saved-list'

// 출처 라벨
const sourceLabels: Record<string, string> = {
  bizinfo: '기업마당',
  kstartup: 'K-Startup',
  smes: '중소벤처24',
  g2b: '나라장터',
}

interface SearchParams {
  folder?: string
  tag?: string
  sort?: string
  search?: string
}

export default async function SavedAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">로그인이 필요합니다</p>
      </div>
    )
  }

  // 폴더 목록 조회
  const { data: folders } = await supabase
    .from('saved_announcement_folders')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  // 저장된 공고 조회
  let query = supabase
    .from('saved_announcements')
    .select(`
      id,
      created_at,
      folder_id,
      tags,
      memo,
      notify_deadline,
      announcements (
        id,
        title,
        organization,
        category,
        support_type,
        support_amount,
        application_start,
        application_end,
        source,
        status
      )
    `)
    .eq('user_id', user.id)

  // 폴더 필터
  if (params.folder) {
    if (params.folder === 'uncategorized') {
      query = query.is('folder_id', null)
    } else {
      query = query.eq('folder_id', params.folder)
    }
  }

  // 태그 필터
  if (params.tag) {
    query = query.contains('tags', [params.tag])
  }

  // 정렬
  const sortBy = params.sort || 'created_at'
  if (sortBy === 'deadline') {
    query = query.order('announcements(application_end)', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: savedAnnouncements } = await query

  // 데이터 정리
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (savedAnnouncements || [])
    .filter((item: any) => item.announcements?.id)
    .map((item: any) => ({
      id: item.id,
      announcementId: item.announcements.id,
      title: item.announcements.title,
      organization: item.announcements.organization,
      category: item.announcements.category,
      supportType: item.announcements.support_type,
      supportAmount: item.announcements.support_amount,
      applicationStart: item.announcements.application_start,
      applicationEnd: item.announcements.application_end,
      source: item.announcements.source,
      status: item.announcements.status,
      folderId: item.folder_id,
      tags: item.tags || [],
      memo: item.memo,
      notifyDeadline: item.notify_deadline,
      savedAt: item.created_at,
    }))

  // 검색 필터 (클라이언트에서 처리)
  const filteredItems = params.search
    ? items.filter((item: any) =>
        item.title?.toLowerCase().includes(params.search!.toLowerCase()) ||
        item.organization?.toLowerCase().includes(params.search!.toLowerCase())
      )
    : items

  // 통계 계산
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const stats = {
    total: items.length,
    thisWeek: items.filter((item: any) => {
      if (!item.applicationEnd) return false
      const endDate = new Date(item.applicationEnd)
      return endDate >= today && endDate <= nextWeek
    }).length,
    expired: items.filter((item: any) => {
      if (!item.applicationEnd) return false
      return new Date(item.applicationEnd) < today
    }).length,
  }

  // 사용된 태그 수집
  const allTags = new Set<string>()
  items.forEach((item: any) => {
    (item.tags || []).forEach((tag: string) => allTags.add(tag))
  })

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bookmark className="h-8 w-8" />
            저장된 공고
          </h1>
          <p className="text-muted-foreground mt-1">
            관심 등록한 공고를 한 곳에서 관리하세요
          </p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 저장
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번 주 마감
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.thisWeek}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              폴더 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{(folders || []).length}개</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              마감된 공고
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{stats.expired}건</div>
          </CardContent>
        </Card>
      </div>

      {/* 클라이언트 컴포넌트로 리스트 렌더링 */}
      <SavedAnnouncementsList
        items={filteredItems}
        folders={folders || []}
        allTags={Array.from(allTags)}
        currentFolder={params.folder}
        currentTag={params.tag}
        currentSort={params.sort}
        currentSearch={params.search}
        sourceLabels={sourceLabels}
      />
    </div>
  )
}
