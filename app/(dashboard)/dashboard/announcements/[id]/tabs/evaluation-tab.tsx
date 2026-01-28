import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { EvaluationCriteriaDisplay } from '@/components/announcements/evaluation-criteria'
import type { Announcement } from './types'

interface EvaluationTabProps {
  announcement: Announcement
  onCriteriaUpdated: (criteria: any) => void
}

/**
 * 평가기준 탭 컴포넌트
 * - 공고의 심사 평가기준 및 배점 표시
 * - 기존 EvaluationCriteriaDisplay 컴포넌트 재사용
 */
export function EvaluationTab({ announcement, onCriteriaUpdated }: EvaluationTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          평가기준
        </CardTitle>
        <CardDescription>
          이 공고의 심사 평가기준 및 배점이에요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EvaluationCriteriaDisplay
          announcementId={announcement.id}
          initialCriteria={announcement.evaluation_criteria}
          onCriteriaLoaded={onCriteriaUpdated}
        />
      </CardContent>
    </Card>
  )
}
