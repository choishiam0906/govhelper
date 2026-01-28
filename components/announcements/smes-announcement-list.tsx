'use client'

import { SourceAnnouncementList } from './source-announcement-list'

/**
 * 중소벤처24 공고 목록 컴포넌트
 * 하위호환성을 위한 래퍼 컴포넌트
 */
export function SMESAnnouncementList() {
  return (
    <SourceAnnouncementList
      source="smes24"
      label="중소벤처24"
      badgeColor="bg-blue-600"
      showArea={true}
      icon="default"
      itemLabel="공고"
    />
  )
}
