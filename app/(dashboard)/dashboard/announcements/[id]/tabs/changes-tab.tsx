import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { History } from 'lucide-react'
import { ChangeHistory } from '@/components/announcements/change-history'
import type { Announcement } from './types'

interface ChangesTabProps {
  announcement: Announcement
}

/**
 * 변경 이력 탭 컴포넌트
 * - 공고의 지원금액, 마감일 등 주요 정보 변경 내역 표시
 * - 기존 ChangeHistory 컴포넌트 재사용
 */
export function ChangesTab({ announcement }: ChangesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          변경 이력
        </CardTitle>
        <CardDescription>
          이 공고의 지원금액, 마감일 등 주요 정보 변경 내역이에요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangeHistory announcementId={announcement.id} />
      </CardContent>
    </Card>
  )
}
