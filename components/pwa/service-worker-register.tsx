'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 프로덕션 환경에서만 Service Worker 등록
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope)

            // 업데이트 확인
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // 새 버전 사용 가능 알림
                    console.log('[PWA] New version available')
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error)
          })
      }
    }
  }, [])

  return null
}
