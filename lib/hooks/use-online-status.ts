"use client"

import { useEffect, useState } from "react"

/**
 * 온라인/오프라인 상태를 추적하는 훅
 *
 * navigator.onLine API와 이벤트 리스너를 사용하여
 * 실시간으로 네트워크 연결 상태를 감지해요.
 *
 * @returns {boolean} 온라인 상태 (true: 온라인, false: 오프라인)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useOnlineStatus()
 *
 *   if (!isOnline) {
 *     return <NetworkError type="offline" />
 *   }
 *
 *   return <div>온라인 상태예요!</div>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 토스트 알림과 함께 사용
 * function App() {
 *   const isOnline = useOnlineStatus()
 *
 *   useEffect(() => {
 *     if (!isOnline) {
 *       toast.error("인터넷 연결이 끊어졌어요")
 *     } else {
 *       toast.success("인터넷에 다시 연결되었어요")
 *     }
 *   }, [isOnline])
 *
 *   return <YourApp />
 * }
 * ```
 */
export function useOnlineStatus(): boolean {
  // 초기값: 브라우저의 현재 온라인 상태
  // SSR 환경에서는 true로 가정 (서버는 항상 온라인)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true
    }
    return navigator.onLine
  })

  useEffect(() => {
    // 온라인 상태 변경 핸들러
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // 이벤트 리스너 등록
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // 초기 상태 동기화 (하이드레이션 후)
    setIsOnline(navigator.onLine)

    // 클린업 함수
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * 온라인 상태와 함께 재연결 시도 기능을 제공하는 훅
 *
 * @param onReconnect - 재연결 시 실행할 콜백 함수 (선택)
 *
 * @example
 * ```tsx
 * function DataFetcher() {
 *   const { isOnline, wasOffline } = useOnlineStatusWithReconnect(() => {
 *     refetch() // 데이터 재조회
 *   })
 *
 *   return (
 *     <div>
 *       {wasOffline && "방금 다시 연결되었어요. 데이터를 새로고침했어요"}
 *     </div>
 *   )
 * }
 * ```
 */
export function useOnlineStatusWithReconnect(onReconnect?: () => void) {
  const isOnline = useOnlineStatus()
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
    } else if (wasOffline) {
      // 오프라인에서 온라인으로 전환됨
      setWasOffline(false)
      onReconnect?.()
    }
  }, [isOnline, wasOffline, onReconnect])

  return { isOnline, wasOffline }
}
