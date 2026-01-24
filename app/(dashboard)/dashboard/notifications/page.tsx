'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  TrendingUp,
  Megaphone,
  Info,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Notification {
  id: string
  type: 'deadline' | 'matching' | 'recommendation' | 'system' | 'announcement'
  title: string
  message: string | null
  announcement_id: string | null
  match_id: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  action_url: string | null
  created_at: string
}

const notificationIcons: Record<string, React.ReactNode> = {
  deadline: <Clock className="h-5 w-5 text-orange-500" />,
  matching: <TrendingUp className="h-5 w-5 text-blue-500" />,
  recommendation: <TrendingUp className="h-5 w-5 text-green-500" />,
  announcement: <Megaphone className="h-5 w-5 text-purple-500" />,
  system: <Info className="h-5 w-5 text-gray-500" />,
}

const notificationLabels: Record<string, string> = {
  deadline: '마감 알림',
  matching: '매칭 결과',
  recommendation: '추천 공고',
  announcement: '새 공고',
  system: '시스템',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [activeTab, setActiveTab] = useState('all')
  const limit = 20

  const fetchNotifications = useCallback(
    async (reset = false) => {
      try {
        const currentOffset = reset ? 0 : offset
        const unreadOnly = activeTab === 'unread'

        const response = await fetch(
          `/api/notifications?limit=${limit}&offset=${currentOffset}&unread=${unreadOnly}`
        )
        const result = await response.json()

        if (result.success) {
          if (reset) {
            setNotifications(result.data)
          } else {
            setNotifications((prev) => [...prev, ...result.data])
          }
          setUnreadCount(result.unreadCount)
          setTotal(result.total)
          setHasMore(result.hasMore)
          if (reset) setOffset(0)
        }
      } catch (error) {
        console.error('알림 조회 오류:', error)
        toast.error('알림을 불러오지 못했어요')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [offset, activeTab]
  )

  useEffect(() => {
    setLoading(true)
    setOffset(0)
    fetchNotifications(true)
  }, [activeTab])

  const handleRefresh = () => {
    setRefreshing(true)
    setOffset(0)
    fetchNotifications(true)
  }

  const loadMore = () => {
    setOffset((prev) => prev + limit)
    fetchNotifications()
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('읽음 처리 오류:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
        toast.success('모든 알림을 읽음 처리했어요')
      }
    } catch (error) {
      toast.error('읽음 처리에 실패했어요')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const notification = notifications.find((n) => n.id === notificationId)
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        setTotal((prev) => prev - 1)
        if (notification && !notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
        toast.success('알림을 삭제했어요')
      }
    } catch (error) {
      toast.error('알림 삭제에 실패했어요')
    }
  }

  const deleteReadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?read=true', {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => !n.is_read))
        setTotal(unreadCount)
        toast.success('읽은 알림을 삭제했어요')
      }
    } catch (error) {
      toast.error('알림 삭제에 실패했어요')
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 1) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ko })
      } else if (diffDays < 7) {
        return formatDistanceToNow(date, { addSuffix: true, locale: ko })
      } else {
        return format(date, 'yyyy년 M월 d일', { locale: ko })
      }
    } catch {
      return ''
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            알림
          </h1>
          <p className="text-muted-foreground mt-1">
            총 {total}개 알림 중 {unreadCount}개가 읽지 않음
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              모두 읽음
            </Button>
          )}
          {total > unreadCount && (
            <Button variant="outline" size="sm" onClick={deleteReadNotifications}>
              <Trash2 className="h-4 w-4 mr-2" />
              읽은 알림 삭제
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            전체
            {total > 0 && <Badge variant="secondary" className="ml-2">{total}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="unread">
            읽지 않음
            {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">알림이 없어요</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread'
                    ? '읽지 않은 알림이 없어요'
                    : '아직 받은 알림이 없어요'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    !notification.is_read ? 'border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {notificationIcons[notification.type] || notificationIcons.system}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {notificationLabels[notification.type] || '알림'}
                              </Badge>
                              {!notification.is_read && (
                                <span className="h-2 w-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <h4
                              className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}
                            >
                              {notification.title}
                            </h4>
                            {notification.message && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={loadMore}>
                    더 보기
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
