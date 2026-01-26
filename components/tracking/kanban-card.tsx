'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  ExternalLink,
  FileText,
  Trash2,
  Edit,
  GripVertical,
} from 'lucide-react'
import { TrackingRecord } from './types'

interface KanbanCardProps {
  record: TrackingRecord
  onEdit: () => void
  onDelete: () => void
}

export function KanbanCard({ record, onEdit, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // D-day 계산
  const getDday = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const dday = getDday(record.announcements.application_end)

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`mb-2 hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            {/* 드래그 핸들 */}
            <button
              className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0">
              {/* D-day 뱃지 */}
              <div className="flex items-center gap-1 mb-1">
                {dday !== null && dday <= 7 && dday >= 0 && (
                  <Badge variant="destructive" className="text-xs">D-{dday}</Badge>
                )}
                {dday !== null && dday < 0 && (
                  <Badge variant="outline" className="text-xs">마감</Badge>
                )}
              </div>

              {/* 공고 제목 */}
              <Link
                href={`/dashboard/announcements/${record.announcements.id}`}
                className="font-medium text-sm hover:underline line-clamp-2"
              >
                {record.announcements.title}
              </Link>

              {/* 기관명 & 지원금액 */}
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {record.announcements.organization}
                {record.announcements.support_amount && (
                  <> · {record.announcements.support_amount}</>
                )}
              </p>

              {/* 메모 */}
              {record.memo && (
                <p className="text-xs text-muted-foreground mt-1 bg-muted p-1.5 rounded line-clamp-2">
                  {record.memo}
                </p>
              )}

              {/* 상태 변경 시간 */}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(record.status_updated_at), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </div>

            {/* 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
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
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
