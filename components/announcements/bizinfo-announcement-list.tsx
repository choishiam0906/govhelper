'use client'

import { SourceAnnouncementList } from './source-announcement-list'

/**
 * 기업마당 공고 목록 컴포넌트
 * 하위호환성을 위한 래퍼 컴포넌트
 */
export function BizinfoAnnouncementList() {
  return (
    <SourceAnnouncementList
      source="bizinfo"
      label="기업마당"
      badgeColor="bg-green-600"
      showArea={false}
      icon="default"
      itemLabel="공고"
    />
  )
}
