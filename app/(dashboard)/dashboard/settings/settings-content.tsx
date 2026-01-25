'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { NotificationSettings } from '@/components/notifications/notification-settings'
import { PushNotificationToggle } from '@/components/push/push-notification-toggle'
import { Settings, Mail, Calendar, Lock, Loader2, Eye, EyeOff, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface SettingsContentProps {
  user: User
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않아요')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 해요')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) {
        throw error
      }

      toast.success('비밀번호를 변경했어요')
      setIsChangingPassword(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '비밀번호 변경에 실패했어요'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          설정
        </h1>
        <p className="text-muted-foreground mt-1">계정 및 알림 설정을 관리하세요</p>
      </div>

      {/* 계정 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>계정 정보</CardTitle>
          <CardDescription>로그인에 사용되는 계정 정보예요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">이메일</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">가입일</p>
              <p className="font-medium">
                {new Date(user.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 비밀번호 변경 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            비밀번호 변경
          </CardTitle>
          <CardDescription>계정 보안을 위해 주기적으로 비밀번호를 변경하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {!isChangingPassword ? (
            <Button
              variant="outline"
              onClick={() => setIsChangingPassword(true)}
            >
              비밀번호 변경하기
            </Button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">새 비밀번호</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="새 비밀번호 (6자 이상)"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="새 비밀번호 다시 입력"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      변경 중...
                    </>
                  ) : (
                    '비밀번호 변경'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                  }}
                >
                  취소
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 이메일 알림 설정 */}
      <NotificationSettings userEmail={user.email || ''} />

      {/* 푸시 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            푸시 알림
          </CardTitle>
          <CardDescription>
            브라우저 푸시 알림으로 마감 임박 공고를 놓치지 마세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationToggle />
        </CardContent>
      </Card>

      {/* 구분선 */}
      <Separator />

      {/* 계정 삭제 (위험 영역) */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">위험 영역</CardTitle>
          <CardDescription>
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없어요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled>
            계정 삭제 (준비 중)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
