'use client'

import { SourceAnnouncementList } from './source-announcement-list'

/**
 * 나라장터(G2B) 입찰 공고 목록 컴포넌트
 * 하위호환성을 위한 래퍼 컴포넌트
 */
export function G2BAnnouncementList() {
  return (
    <SourceAnnouncementList
      source="g2b"
      label="나라장터"
      badgeColor="bg-blue-700"
      showArea={false}
      icon="gavel"
      itemLabel="입찰"
    />
  )
}
