'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, Mail, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationPreferences {
  email_enabled: boolean
  deadline_7_days: boolean
  deadline_3_days: boolean
  deadline_1_day: boolean
  smart_recommendations: boolean
  notification_email: string
}

export function NotificationSettings({ userEmail }: { userEmail: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    deadline_7_days: true,
    deadline_3_days: true,
    deadline_1_day: true,
    smart_recommendations: true,
    notification_email: userEmail,
  })

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/settings')
      const result = await response.json()

      if (result.success) {
        setPreferences({
          email_enabled: result.data.email_enabled ?? true,
          deadline_7_days: result.data.deadline_7_days ?? true,
          deadline_3_days: result.data.deadline_3_days ?? true,
          deadline_1_day: result.data.deadline_1_day ?? true,
          smart_recommendations: result.data.smart_recommendations ?? true,
          notification_email: result.data.notification_email || userEmail,
        })
      }
    } catch (error) {
      console.error('알림 설정 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('이메일 알림 설정이 저장되었어요')
    } catch (error) {
      toast.error('이메일 알림 설정 저장에 실패했어요')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          알림 설정
        </CardTitle>
        <CardDescription>관심 등록한 공고의 마감 알림을 받아보세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 이메일 알림 활성화 */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-enabled">이메일 알림</Label>
            <p className="text-sm text-muted-foreground">마감 임박 공고 알림을 이메일로 받아요</p>
          </div>
          <Switch
            id="email-enabled"
            checked={preferences.email_enabled}
            onCheckedChange={() => handleToggle('email_enabled')}
          />
        </div>

        {preferences.email_enabled && (
          <>
            {/* 알림 받을 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="notification-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                알림 받을 이메일
              </Label>
              <Input
                id="notification-email"
                type="email"
                value={preferences.notification_email}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    notification_email: e.target.value,
                  }))
                }
                placeholder={userEmail}
              />
            </div>

            {/* 스마트 추천 알림 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="smart-recommendations" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  스마트 추천 알림
                </Label>
                <p className="text-sm text-muted-foreground">
                  새로운 맞춤 공고가 등록되면 알림을 받아요
                </p>
              </div>
              <Switch
                id="smart-recommendations"
                checked={preferences.smart_recommendations}
                onCheckedChange={() => handleToggle('smart_recommendations')}
              />
            </div>

            {/* 알림 타이밍 설정 */}
            <div className="space-y-4 pt-4 border-t">
              <Label>마감 알림 시점</Label>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">마감 7일 전</p>
                  <p className="text-xs text-muted-foreground">여유있게 준비할 시간을 확보하세요</p>
                </div>
                <Switch
                  checked={preferences.deadline_7_days}
                  onCheckedChange={() => handleToggle('deadline_7_days')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">마감 3일 전</p>
                  <p className="text-xs text-muted-foreground">마감이 다가오고 있어요</p>
                </div>
                <Switch
                  checked={preferences.deadline_3_days}
                  onCheckedChange={() => handleToggle('deadline_3_days')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">마감 1일 전</p>
                  <p className="text-xs text-muted-foreground">마지막 기회를 놓치지 마세요</p>
                </div>
                <Switch
                  checked={preferences.deadline_1_day}
                  onCheckedChange={() => handleToggle('deadline_1_day')}
                />
              </div>
            </div>
          </>
        )}

        {/* 저장 버튼 */}
        <Button onClick={savePreferences} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            '설정 저장'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
