'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MessageSquare,
  Bug,
  Lightbulb,
  MessageCircle,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Feedback {
  id: string
  user_id: string | null
  email: string | null
  type: 'bug' | 'feature' | 'general' | 'other'
  subject: string | null
  message: string
  page_url: string | null
  user_agent: string | null
  status: 'pending' | 'reviewing' | 'resolved' | 'closed'
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
}

const typeConfig = {
  bug: { label: '버그', icon: Bug, color: 'bg-red-100 text-red-700' },
  feature: { label: '기능 요청', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700' },
  general: { label: '일반', icon: MessageCircle, color: 'bg-blue-100 text-blue-700' },
  other: { label: '기타', icon: HelpCircle, color: 'bg-gray-100 text-gray-700' },
}

const statusConfig = {
  pending: { label: '대기', icon: Clock, color: 'bg-orange-100 text-orange-700' },
  reviewing: { label: '검토 중', icon: Eye, color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '해결', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  closed: { label: '종료', icon: XCircle, color: 'bg-gray-100 text-gray-700' },
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')

  // 필터
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const supabase = createClient()

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams({
        status: statusFilter,
        type: typeFilter,
        page: page.toString(),
        limit: '20',
      })

      const response = await fetch(`/api/admin/feedback?${params}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setFeedbacks(data.feedbacks || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      } else {
        toast.error(data.error || '피드백을 불러오지 못했어요')
      }
    } catch (error) {
      toast.error('피드백을 불러오지 못했어요')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [statusFilter, typeFilter, page])

  const handleUpdateStatus = async () => {
    if (!selectedFeedback || !newStatus) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: selectedFeedback.id,
          status: newStatus,
          adminNotes,
        }),
      })

      if (response.ok) {
        toast.success('상태가 업데이트됐어요')
        setSelectedFeedback(null)
        fetchFeedbacks()
      } else {
        const data = await response.json()
        toast.error(data.error || '업데이트에 실패했어요')
      }
    } catch (error) {
      toast.error('업데이트에 실패했어요')
    }
  }

  const openDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setAdminNotes(feedback.admin_notes || '')
    setNewStatus(feedback.status)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">피드백 관리</h1>
        <p className="text-muted-foreground">사용자 피드백을 확인하고 처리하세요</p>
      </div>

      {/* 필터 */}
      <div className="flex gap-4 flex-wrap">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
            <SelectItem value="reviewing">검토 중</SelectItem>
            <SelectItem value="resolved">해결</SelectItem>
            <SelectItem value="closed">종료</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 유형</SelectItem>
            <SelectItem value="bug">버그</SelectItem>
            <SelectItem value="feature">기능 요청</SelectItem>
            <SelectItem value="general">일반</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground flex items-center">
          총 {total}개
        </div>
      </div>

      {/* 피드백 목록 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>피드백이 없어요</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((feedback) => {
            const TypeIcon = typeConfig[feedback.type]?.icon || MessageCircle
            const StatusIcon = statusConfig[feedback.status]?.icon || Clock

            return (
              <Card
                key={feedback.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => openDetail(feedback)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className={typeConfig[feedback.type]?.color}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeConfig[feedback.type]?.label}
                        </Badge>
                        <Badge variant="secondary" className={statusConfig[feedback.status]?.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[feedback.status]?.label}
                        </Badge>
                      </div>
                      {feedback.subject && (
                        <h3 className="font-medium mb-1">{feedback.subject}</h3>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {feedback.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{feedback.email || '익명'}</span>
                        <span>
                          {formatDistanceToNow(new Date(feedback.created_at), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-4 py-2 text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 상세 모달 */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>피드백 상세</DialogTitle>
            <DialogDescription>피드백 내용을 확인하고 상태를 업데이트하세요</DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge variant="secondary" className={typeConfig[selectedFeedback.type]?.color}>
                  {typeConfig[selectedFeedback.type]?.label}
                </Badge>
                <Badge variant="secondary" className={statusConfig[selectedFeedback.status]?.color}>
                  {statusConfig[selectedFeedback.status]?.label}
                </Badge>
              </div>

              {selectedFeedback.subject && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">제목</p>
                  <p>{selectedFeedback.subject}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">내용</p>
                <p className="whitespace-pre-wrap bg-muted p-3 rounded-lg text-sm">
                  {selectedFeedback.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">이메일</p>
                  <p>{selectedFeedback.email || '-'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">작성일</p>
                  <p>{new Date(selectedFeedback.created_at).toLocaleString('ko-KR')}</p>
                </div>
                {selectedFeedback.page_url && (
                  <div className="col-span-2">
                    <p className="font-medium text-muted-foreground">페이지</p>
                    <p className="text-xs truncate">{selectedFeedback.page_url}</p>
                  </div>
                )}
              </div>

              <hr />

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">상태 변경</p>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">대기</SelectItem>
                      <SelectItem value="reviewing">검토 중</SelectItem>
                      <SelectItem value="resolved">해결</SelectItem>
                      <SelectItem value="closed">종료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">관리자 메모</p>
                  <Textarea
                    placeholder="내부 메모를 작성하세요"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                    닫기
                  </Button>
                  <Button onClick={handleUpdateStatus}>저장</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
