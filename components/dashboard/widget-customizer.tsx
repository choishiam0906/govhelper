'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Settings2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'

export interface WidgetSetting {
  id: string
  name: string
  visible: boolean
  order: number
}

const DEFAULT_WIDGETS: WidgetSetting[] = [
  { id: 'stats', name: '통계 카드', visible: true, order: 0 },
  { id: 'quickActions', name: '빠른 메뉴', visible: true, order: 1 },
  { id: 'recommendations', name: '맞춤 추천 공고', visible: true, order: 2 },
  { id: 'urgentDeadlines', name: '마감 임박 공고', visible: true, order: 3 },
  { id: 'inProgressApps', name: '작성 중인 지원서', visible: true, order: 4 },
  { id: 'recentAnnouncements', name: '최신 공고', visible: true, order: 5 },
]

interface WidgetCustomizerProps {
  onSettingsChange?: (widgets: WidgetSetting[]) => void
}

export function WidgetCustomizer({ onSettingsChange }: WidgetCustomizerProps) {
  const [open, setOpen] = useState(false)
  const [widgets, setWidgets] = useState<WidgetSetting[]>(DEFAULT_WIDGETS)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/dashboard/widgets')
        const result = await response.json()

        if (result.success && result.widgets) {
          // 기존 설정에 새 위젯이 추가된 경우 병합
          const mergedWidgets = DEFAULT_WIDGETS.map((defaultWidget) => {
            const savedWidget = result.widgets.find((w: WidgetSetting) => w.id === defaultWidget.id)
            return savedWidget || defaultWidget
          })
          setWidgets(mergedWidgets.sort((a, b) => a.order - b.order))
        }
      } catch (error) {
        console.error('Failed to fetch widget settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // 위젯 가시성 토글
  const toggleVisibility = (widgetId: string) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
    )
  }

  // 위젯 순서 이동
  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    setWidgets((prev) => {
      const index = prev.findIndex((w) => w.id === widgetId)
      if (index === -1) return prev

      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev

      const newWidgets = [...prev]
      const [removed] = newWidgets.splice(index, 1)
      newWidgets.splice(newIndex, 0, removed)

      // order 값 재정렬
      return newWidgets.map((w, i) => ({ ...w, order: i }))
    })
  }

  // 기본값으로 초기화
  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS)
  }

  // 설정 저장
  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/dashboard/widgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('위젯 설정을 저장했어요')
      onSettingsChange?.(widgets)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '저장에 실패했어요')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          위젯 설정
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>대시보드 위젯 설정</DialogTitle>
          <DialogDescription>
            표시할 위젯을 선택하고 순서를 변경할 수 있어요
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 py-4">
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  widget.visible ? 'bg-background' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`widget-${widget.id}`}
                      checked={widget.visible}
                      onCheckedChange={() => toggleVisibility(widget.id)}
                    />
                    <Label
                      htmlFor={`widget-${widget.id}`}
                      className={`cursor-pointer ${
                        !widget.visible ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {widget.name}
                    </Label>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveWidget(widget.id, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => moveWidget(widget.id, 'down')}
                    disabled={index === widgets.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={resetToDefault}
            disabled={saving}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
