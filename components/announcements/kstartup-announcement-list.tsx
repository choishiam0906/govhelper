'use client'

import { SourceAnnouncementList } from './source-announcement-list'

/**
 * K-Startup 공고 목록 컴포넌트
 * 하위호환성을 위한 래퍼 컴포넌트
 */
export function KStartupAnnouncementList() {
  return (
    <SourceAnnouncementList
      source="kstartup"
      label="K-Startup"
      badgeColor="bg-purple-600"
      showArea={false}
      icon="rocket"
      itemLabel="공고"
    />
  )
}
