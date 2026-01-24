'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ExternalLink,
  FileText,
  Trash2,
  Edit,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

// 상태 타입
type ApplicationStatus =
  | 'interested'
  | 'preparing'
  | 'submitted'
  | 'under_review'
  | 'passed_initial'
  | 'passed_final'
  | 'rejected'
  | 'cancelled'

// 상태 정보
const STATUS_INFO: Record<ApplicationStatus, { label: string; color: string; description: string }> = {
  interested: { label: '관심', color: 'bg-gray-500', description: '관심 등록한 공고' },
  preparing: { label: '준비 중', color: 'bg-blue-500', description: '지원 준비 중' },
  submitted: { label: '지원 완료', color: 'bg-indigo-500', description: '지원서 제출 완료' },
  under_review: { label: '심사 중', color: 'bg-yellow-500', description: '심사 진행 중' },
  passed_initial: { label: '1차 합격', color: 'bg-emerald-500', description: '1차 심사 통과' },
  passed_final: { label: '최종 합격', color: 'bg-green-500', description: '최종 선정' },
  rejected: { label: '탈락', color: 'bg-red-500', description: '선정 탈락' },
  cancelled: { label: '취소', color: 'bg-gray-400', description: '지원 취소' },
}

// 추적 레코드 타입
interface TrackingRecord {
  id: string
  status: ApplicationStatus
  memo: string | null
  created_at: string
  updated_at: string
  status_updated_at: string
  announcements: {
    id: string
    title: string
    organization: string
    application_start: string | null
    application_end: string | null
    support_amount: string | null
  }
}

export default function TrackingPage() {
  const [records, setRecords] = useState<TrackingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 편집 다이얼로그
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrackingRecord | null>(null)
  const [editStatus, setEditStatus] = useState<ApplicationStatus>('interested')
  const [editMemo, setEditMemo] = useState('')

  // 삭제 다이얼로그
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRecord, setDeletingRecord] = useState<TrackingRecord | null>(null)

  // 데이터 조회
  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const res = await fetch(`/api/tracking?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setRecords(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tracking records:', error)
      toast.error('지원 이력을 불러오지 못했어요')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [statusFilter])

  // 상태 업데이트
  const handleUpdateStatus = async () => {
    if (!editingRecord) return

    try {
      const res = await fetch(`/api/tracking/${editingRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          memo: editMemo,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('상태를 업데이트했어요')
        setEditDialogOpen(false)
        fetchRecords()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('상태 업데이트에 실패했어요')
    }
  }

  // 삭제
  const handleDelete = async () => {
    if (!deletingRecord) return

    try {
      const res = await fetch(`/api/tracking/${deletingRecord.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        toast.success('지원 이력을 삭제했어요')
        setDeleteDialogOpen(false)
        fetchRecords()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error('삭제에 실패했어요')
    }
  }

  // 필터링된 레코드
  const filteredRecords = records.filter((record) => {
    if (!searchQuery) return true
    return (
      record.announcements.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.announcements.organization.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // D-day 계산
  const getDday = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // 상태별 카운트
  const statusCounts = records.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            지원 이력 추적
          </h1>
          <p className="text-muted-foreground mt-1">
            지원한 공고의 진행 상태를 추적하고 관리해요
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/announcements">
            <Plus className="h-4 w-4 mr-2" />
            공고 찾기
          </Link>
        </Button>
      </div>

      {/* 상태 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(STATUS_INFO).map(([status, info]) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all hover:shadow-md ${
              statusFilter === status ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
          >
            <CardContent className="p-3 text-center">
              <div className={`w-3 h-3 rounded-full ${info.color} mx-auto mb-1`} />
              <p className="text-xs text-muted-foreground">{info.label}</p>
              <p className="text-lg font-bold">{statusCounts[status] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 필터 바 */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="공고명 또는 기관명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {Object.entries(STATUS_INFO).map(([status, info]) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${info.color}`} />
                  {info.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 이력 목록 */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">
              {searchQuery ? '검색 결과가 없어요' : '지원 이력이 없어요'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? '다른 키워드로 검색해보세요'
                : '관심 있는 공고를 찾아 지원 이력에 추가해보세요'}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/dashboard/announcements">
                  공고 둘러보기
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const info = STATUS_INFO[record.status]
            const dday = getDday(record.announcements.application_end)

            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${info.color} text-white`}>
                          {info.label}
                        </Badge>
                        {dday !== null && dday <= 7 && dday >= 0 && (
                          <Badge variant="destructive">D-{dday}</Badge>
                        )}
                        {dday !== null && dday < 0 && (
                          <Badge variant="outline">마감</Badge>
                        )}
                      </div>
                      <h3 className="font-medium truncate">
                        {record.announcements.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {record.announcements.organization}
                        {record.announcements.support_amount && (
                          <> · {record.announcements.support_amount}</>
                        )}
                      </p>
                      {record.memo && (
                        <p className="text-sm text-muted-foreground mt-2 bg-muted p-2 rounded">
                          {record.memo}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(record.status_updated_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                        에 상태 변경
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/announcements/${record.announcements.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingRecord(record)
                              setEditStatus(record.status)
                              setEditMemo(record.memo || '')
                              setEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            상태 변경
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/announcements/${record.announcements.id}`}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              공고 상세
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/applications/new?announcement=${record.announcements.id}`}>
                              <FileText className="h-4 w-4 mr-2" />
                              지원서 작성
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeletingRecord(record)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 편집 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상태 변경</DialogTitle>
            <DialogDescription>
              {editingRecord?.announcements.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">상태</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ApplicationStatus)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_INFO).map(([status, info]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${info.color}`} />
                        {info.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">메모</label>
              <Textarea
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                placeholder="진행 상황이나 메모를 입력하세요"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateStatus}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>지원 이력 삭제</DialogTitle>
            <DialogDescription>
              "{deletingRecord?.announcements.title}" 이력을 삭제할까요?
              <br />
              삭제하면 되돌릴 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
