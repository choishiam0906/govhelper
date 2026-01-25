'use client'

import { useState, useEffect, ReactNode } from 'react'
import { WidgetCustomizer, WidgetSetting } from './widget-customizer'

const DEFAULT_WIDGETS: WidgetSetting[] = [
  { id: 'stats', name: '통계 카드', visible: true, order: 0 },
  { id: 'quickActions', name: '빠른 메뉴', visible: true, order: 1 },
  { id: 'recommendations', name: '맞춤 추천 공고', visible: true, order: 2 },
  { id: 'urgentDeadlines', name: '마감 임박 공고', visible: true, order: 3 },
  { id: 'inProgressApps', name: '작성 중인 지원서', visible: true, order: 4 },
  { id: 'recentAnnouncements', name: '최신 공고', visible: true, order: 5 },
]

interface WidgetComponents {
  stats: ReactNode
  quickActions: ReactNode
  recommendations: ReactNode
  urgentDeadlines: ReactNode
  inProgressApps: ReactNode
  recentAnnouncements: ReactNode
}

interface DashboardWidgetsProps {
  header: ReactNode
  widgets: WidgetComponents
}

export function DashboardWidgets({ header, widgets }: DashboardWidgetsProps) {
  const [widgetSettings, setWidgetSettings] = useState<WidgetSetting[]>(DEFAULT_WIDGETS)
  const [isLoaded, setIsLoaded] = useState(false)

  // 위젯 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/dashboard/widgets')
        const result = await response.json()

        if (result.success && result.widgets) {
          // 기존 설정에 새 위젯이 추가된 경우 병합
          const mergedWidgets = DEFAULT_WIDGETS.map((defaultWidget) => {
            const savedWidget = result.widgets.find((w: WidgetSetting) => w.id === defaultWidget.id)
            return savedWidget || defaultWidget
          })
          setWidgetSettings(mergedWidgets.sort((a, b) => a.order - b.order))
        }
      } catch (error) {
        console.error('Failed to fetch widget settings:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    fetchSettings()
  }, [])

  // 설정 변경 핸들러
  const handleSettingsChange = (newSettings: WidgetSetting[]) => {
    setWidgetSettings(newSettings)
  }

  // 위젯 ID를 실제 컴포넌트로 매핑
  const getWidgetComponent = (widgetId: string): ReactNode => {
    switch (widgetId) {
      case 'stats':
        return widgets.stats
      case 'quickActions':
        return widgets.quickActions
      case 'recommendations':
        return widgets.recommendations
      case 'urgentDeadlines':
        return widgets.urgentDeadlines
      case 'inProgressApps':
        return widgets.inProgressApps
      case 'recentAnnouncements':
        return widgets.recentAnnouncements
      default:
        return null
    }
  }

  // 보이는 위젯만 필터링하고 순서대로 정렬
  const visibleWidgets = widgetSettings
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order)

  // urgentDeadlines와 inProgressApps는 한 행에 2개씩 표시
  const shouldCombineInRow = (widgetId: string) => {
    return widgetId === 'urgentDeadlines' || widgetId === 'inProgressApps'
  }

  // 위젯들을 그룹화
  const groupedWidgets: { type: 'single' | 'row'; widgets: WidgetSetting[] }[] = []
  let i = 0
  while (i < visibleWidgets.length) {
    const current = visibleWidgets[i]
    const next = visibleWidgets[i + 1]

    if (shouldCombineInRow(current.id) && next && shouldCombineInRow(next.id)) {
      groupedWidgets.push({ type: 'row', widgets: [current, next] })
      i += 2
    } else {
      groupedWidgets.push({ type: 'single', widgets: [current] })
      i += 1
    }
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>{header}</div>
        <WidgetCustomizer onSettingsChange={handleSettingsChange} />
      </div>

      {/* 위젯들 */}
      {isLoaded && groupedWidgets.map((group, index) => {
        if (group.type === 'row') {
          return (
            <div key={`row-${index}`} className="grid gap-4 md:grid-cols-2">
              {group.widgets.map((widget) => (
                <div key={widget.id}>{getWidgetComponent(widget.id)}</div>
              ))}
            </div>
          )
        }
        return (
          <div key={group.widgets[0].id}>
            {getWidgetComponent(group.widgets[0].id)}
          </div>
        )
      })}
    </div>
  )
}
