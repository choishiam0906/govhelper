'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PushNotificationToggleProps {
  showLabel?: boolean
  variant?: 'switch' | 'button'
}

export function PushNotificationToggle({
  showLabel = true,
  variant = 'switch',
}: PushNotificationToggleProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    checkSupport()
  }, [])

  const checkSupport = async () => {
    // 브라우저 지원 확인
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false)
      setIsLoading(false)
      return
    }

    setIsSupported(true)
    setPermission(Notification.permission)

    // 현재 구독 상태 확인
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Check subscription error:', error)
    }

    setIsLoading(false)
  }

  const subscribe = async () => {
    setIsLoading(true)

    try {
      // 알림 권한 요청
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        toast.error('알림 권한이 거부되었어요. 브라우저 설정에서 허용해 주세요.')
        setIsLoading(false)
        return
      }

      // VAPID 공개 키 가져오기
      const keyResponse = await fetch('/api/push/subscribe')
      const keyData = await keyResponse.json()

      if (!keyData.success || !keyData.vapidPublicKey) {
        toast.error('푸시 알림 설정을 가져오지 못했어요')
        setIsLoading(false)
        return
      }

      // Service Worker 등록
      const registration = await navigator.serviceWorker.ready

      // 푸시 구독
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.vapidPublicKey),
      })

      // 서버에 구독 정보 저장
      const subscriptionJson = subscription.toJSON()
      const saveResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscriptionJson.endpoint,
          keys: subscriptionJson.keys,
        }),
      })

      const saveData = await saveResponse.json()

      if (saveData.success) {
        setIsSubscribed(true)
        toast.success('푸시 알림이 활성화되었어요')
      } else {
        toast.error(saveData.error || '푸시 알림 등록에 실패했어요')
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      toast.error('푸시 알림 등록 중 오류가 발생했어요')
    }

    setIsLoading(false)
  }

  const unsubscribe = async () => {
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // 서버에서 구독 삭제
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        // 브라우저에서 구독 해제
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      toast.success('푸시 알림이 비활성화되었어요')
    } catch (error) {
      console.error('Unsubscribe error:', error)
      toast.error('푸시 알림 해제 중 오류가 발생했어요')
    }

    setIsLoading(false)
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe()
    }
  }

  if (!isSupported) {
    return showLabel ? (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <BellOff className="h-4 w-4" />
        <span>이 브라우저는 푸시 알림을 지원하지 않아요</span>
      </div>
    ) : null
  }

  if (variant === 'button') {
    return (
      <Button
        variant={isSubscribed ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          <>
            <Bell className="h-4 w-4 mr-2" />
            알림 켜짐
          </>
        ) : (
          <>
            <BellOff className="h-4 w-4 mr-2" />
            알림 받기
          </>
        )}
      </Button>
    )
  }

  return (
    <div className="flex items-center justify-between">
      {showLabel && (
        <div className="space-y-0.5">
          <Label htmlFor="push-notifications" className="text-base">
            푸시 알림
          </Label>
          <p className="text-sm text-muted-foreground">
            마감 임박 공고 알림을 받아요
          </p>
        </div>
      )}
      <Switch
        id="push-notifications"
        checked={isSubscribed}
        onCheckedChange={handleToggle}
        disabled={isLoading || permission === 'denied'}
      />
    </div>
  )
}

// VAPID 키 변환 유틸리티
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}
