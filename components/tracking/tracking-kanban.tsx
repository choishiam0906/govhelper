'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import {
  ApplicationStatus,
  TrackingRecord,
  STATUS_INFO,
  PIPELINE_ORDER,
  END_STATUSES,
} from './types'

interface TrackingKanbanProps {
  records: TrackingRecord[]
  onRecordsChange: () => void
  onEditRecord: (record: TrackingRecord) => void
  onDeleteRecord: (record: TrackingRecord) => void
}

export function TrackingKanban({
  records,
  onRecordsChange,
  onEditRecord,
  onDeleteRecord,
}: TrackingKanbanProps) {
  const [activeRecord, setActiveRecord] = useState<TrackingRecord | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // 상태별로 레코드 그룹화
  const getRecordsByStatus = (status: ApplicationStatus) => {
    return records.filter((r) => r.status === status)
  }

  // 드래그 시작
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const record = records.find((r) => r.id === active.id)
    if (record) {
      setActiveRecord(record)
    }
  }

  // 드래그 종료
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveRecord(null)

    if (!over) return

    const recordId = active.id as string
    const newStatus = over.id as ApplicationStatus

    // 현재 레코드 찾기
    const record = records.find((r) => r.id === recordId)
    if (!record || record.status === newStatus) return

    // 유효한 상태인지 확인
    if (!STATUS_INFO[newStatus]) return

    // API 호출로 상태 업데이트
    try {
      const res = await fetch(`/api/tracking/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          memo: record.memo,
        }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`${STATUS_INFO[newStatus].label}(으)로 이동했어요`)
        onRecordsChange()
      } else {
        toast.error(data.error || '상태 변경에 실패했어요')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('상태 변경에 실패했어요')
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* 메인 파이프라인 */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            지원 파이프라인
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {PIPELINE_ORDER.map((status) => (
              <KanbanColumn
                key={status}
                id={status}
                title={STATUS_INFO[status].label}
                color={STATUS_INFO[status].color}
                records={getRecordsByStatus(status)}
                onEditRecord={onEditRecord}
                onDeleteRecord={onDeleteRecord}
              />
            ))}
          </div>
        </div>

        {/* 종료 상태 */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            종료
          </h3>
          <div className="flex gap-3">
            {END_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                id={status}
                title={STATUS_INFO[status].label}
                color={STATUS_INFO[status].color}
                records={getRecordsByStatus(status)}
                onEditRecord={onEditRecord}
                onDeleteRecord={onDeleteRecord}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 드래그 오버레이 */}
      <DragOverlay>
        {activeRecord ? (
          <div className="rotate-3 opacity-90">
            <KanbanCard
              record={activeRecord}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
