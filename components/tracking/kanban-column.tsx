'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from '@/components/ui/badge'
import { KanbanCard } from './kanban-card'
import { TrackingRecord } from './types'

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  records: TrackingRecord[]
  onEditRecord: (record: TrackingRecord) => void
  onDeleteRecord: (record: TrackingRecord) => void
}

export function KanbanColumn({
  id,
  title,
  color,
  records,
  onEditRecord,
  onDeleteRecord,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-lg transition-colors ${
        isOver ? 'bg-primary/10 ring-2 ring-primary ring-dashed' : ''
      }`}
    >
      {/* 헤더 */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="font-medium text-sm">{title}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {records.length}
          </Badge>
        </div>
      </div>

      {/* 카드 목록 */}
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        <SortableContext
          items={records.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {records.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              항목이 없어요
            </div>
          ) : (
            records.map((record) => (
              <KanbanCard
                key={record.id}
                record={record}
                onEdit={() => onEditRecord(record)}
                onDelete={() => onDeleteRecord(record)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  )
}
