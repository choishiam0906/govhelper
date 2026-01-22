'use client'

import { useEffect, useState } from 'react'
import { UTMParams, initializeUTM, getCurrentUTM, getUTMForAPI } from '@/lib/utils/utm'

/**
 * UTM 파라미터 추적 훅
 *
 * 사용법:
 * const { utm, utmForAPI } = useUTM()
 */
export function useUTM() {
  const [utm, setUTM] = useState<UTMParams>({})
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // 클라이언트에서만 실행
    const params = initializeUTM()
    setUTM(params)
    setInitialized(true)
  }, [])

  return {
    utm,
    utmForAPI: initialized ? getUTMForAPI() : {},
    initialized,
    refresh: () => setUTM(getCurrentUTM()),
  }
}
