'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Mail,
  Send,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Subscriber {
  id: string
  email: string
  name: string | null
  status: 'active' | 'unsubscribed' | 'bounced'
  confirmed: boolean
  emails_sent: number
  emails_opened: number
  created_at: string
}

interface Campaign {
  id: string
  subject: string
  preview_text: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  sent_at: string | null
  total_recipients: number
  emails_sent: number
  emails_opened: number
  emails_bounced: number
  created_at: string
}

interface Stats {
  totalSubscribers: number
  activeSubscribers: number
  totalCampaigns: number
  totalEmailsSent: number
}

const statusConfig = {
  active: { label: '활성', color: 'bg-green-100 text-green-700' },
  unsubscribed: { label: '수신 거부', color: 'bg-gray-100 text-gray-700' },
  bounced: { label: '반송', color: 'bg-red-100 text-red-700' },
}

const campaignStatusConfig = {
  draft: { label: '임시저장', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  scheduled: { label: '예약됨', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  sending: { label: '발송 중', icon: Loader2, color: 'bg-yellow-100 text-yellow-700' },
  sent: { label: '발송 완료', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소됨', icon: XCircle, color: 'bg-red-100 text-red-700' },
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalCampaigns: 0,
    totalEmailsSent: 0,
  })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // 발송 폼
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [sendDialogOpen, setSendDialogOpen] = useState(false)

  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    try {
      // 구독자 조회
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: subscribersData, error: subscribersError } = await (supabase as any)
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100) as { data: Subscriber[] | null; error: Error | null }

      if (subscribersError) throw subscribersError

      // 캠페인 조회
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: campaignsData, error: campaignsError } = await (supabase as any)
        .from('newsletter_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50) as { data: Campaign[] | null; error: Error | null }

      if (campaignsError) throw campaignsError

      // 통계 계산
      const allSubscribers = subscribersData || []
      const activeCount = allSubscribers.filter(s => s.status === 'active' && s.confirmed).length
      const totalSent = (campaignsData || []).reduce((sum, c) => sum + (c.emails_sent || 0), 0)

      setSubscribers(allSubscribers)
      setCampaigns(campaignsData || [])
      setStats({
        totalSubscribers: allSubscribers.length,
        activeSubscribers: activeCount,
        totalCampaigns: (campaignsData || []).length,
        totalEmailsSent: totalSent,
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('데이터를 불러오지 못했어요')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSendNewsletter = async (isTest: boolean) => {
    if (!subject.trim()) {
      toast.error('제목을 입력해 주세요')
      return
    }
    if (!htmlContent.trim()) {
      toast.error('내용을 입력해 주세요')
      return
    }
    if (isTest && !testEmail.trim()) {
      toast.error('테스트 이메일을 입력해 주세요')
      return
    }

    setSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('로그인이 필요해요')
        return
      }

      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject,
          previewText,
          htmlContent,
          testEmail: isTest ? testEmail : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(data.message)
        if (!isTest) {
          setSendDialogOpen(false)
          setSubject('')
          setPreviewText('')
          setHtmlContent('')
          fetchData()
        }
      } else {
        toast.error(data.message || '발송에 실패했어요')
      }
    } catch (error) {
      console.error('Send error:', error)
      toast.error('발송에 실패했어요')
    } finally {
      setSending(false)
    }
  }

  const getDefaultTemplate = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;">

    <!-- 헤더 -->
    <div style="background-color:#2563eb;padding:32px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:bold;">GovHelper</h1>
      <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">주간 뉴스레터</p>
    </div>

    <!-- 본문 -->
    <div style="background-color:#ffffff;padding:32px;border-radius:0 0 8px 8px;">
      <h2 style="color:#1f2937;margin:0 0 16px;font-size:24px;">안녕하세요, {{name}}님!</h2>

      <p style="color:#6b7280;font-size:16px;line-height:1.6;">
        여기에 뉴스레터 내용을 작성하세요.
      </p>

      <!-- CTA 버튼 -->
      <div style="text-align:center;margin:32px 0;">
        <a href="https://govhelpers.com/dashboard/announcements"
           style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:500;">
          공고 보러가기 →
        </a>
      </div>
    </div>

    <!-- 푸터 -->
    <div style="text-align:center;padding:24px;color:#9ca3af;font-size:12px;">
      <p style="margin:0 0 8px;">
        이 이메일은 GovHelper 뉴스레터 구독자에게 발송됩니다.
      </p>
      <p style="margin:0;">
        <a href="{{unsubscribe_url}}" style="color:#9ca3af;text-decoration:underline;">수신거부</a>
      </p>
    </div>

  </div>
</body>
</html>`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">뉴스레터 관리</h1>
          <p className="text-muted-foreground">구독자를 관리하고 뉴스레터를 발송하세요</p>
        </div>
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              뉴스레터 발송
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>뉴스레터 발송</DialogTitle>
              <DialogDescription>
                구독자에게 뉴스레터를 발송하세요. 테스트 발송으로 먼저 확인할 수 있어요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">제목 *</Label>
                <Input
                  id="subject"
                  placeholder="[GovHelper] 이번 주 추천 공고"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previewText">미리보기 텍스트</Label>
                <Input
                  id="previewText"
                  placeholder="이메일 클라이언트에서 미리보기로 표시되는 텍스트"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="htmlContent">HTML 내용 *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHtmlContent(getDefaultTemplate())}
                  >
                    기본 템플릿 사용
                  </Button>
                </div>
                <Textarea
                  id="htmlContent"
                  placeholder="HTML 이메일 내용을 입력하세요..."
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  사용 가능한 변수: {'{{name}}'}, {'{{email}}'}, {'{{unsubscribe_url}}'}
                </p>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="testEmail">테스트 발송</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSendNewsletter(true)}
                    disabled={sending}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    테스트 발송
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>전체 발송 시 {stats.activeSubscribers}명의 활성 구독자에게 이메일이 발송돼요.</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                  취소
                </Button>
                <Button
                  onClick={() => handleSendNewsletter(false)}
                  disabled={sending || stats.activeSubscribers === 0}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  전체 발송
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 구독자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscribers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 구독자</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscribers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">발송 캠페인</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 발송량</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmailsSent}</div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="subscribers">
        <TabsList>
          <TabsTrigger value="subscribers">구독자 목록</TabsTrigger>
          <TabsTrigger value="campaigns">발송 내역</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
          ) : subscribers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>구독자가 없어요</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">이메일</th>
                        <th className="text-left p-4 font-medium">이름</th>
                        <th className="text-left p-4 font-medium">상태</th>
                        <th className="text-left p-4 font-medium">인증</th>
                        <th className="text-left p-4 font-medium">발송/오픈</th>
                        <th className="text-left p-4 font-medium">가입일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="border-b last:border-0">
                          <td className="p-4">{subscriber.email}</td>
                          <td className="p-4 text-muted-foreground">{subscriber.name || '-'}</td>
                          <td className="p-4">
                            <Badge variant="secondary" className={statusConfig[subscriber.status]?.color}>
                              {statusConfig[subscriber.status]?.label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {subscriber.confirmed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-orange-500" />
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {subscriber.emails_sent} / {subscriber.emails_opened}
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(subscriber.created_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>발송 내역이 없어요</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => {
                const StatusIcon = campaignStatusConfig[campaign.status]?.icon || Clock

                return (
                  <Card key={campaign.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className={campaignStatusConfig[campaign.status]?.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {campaignStatusConfig[campaign.status]?.label}
                            </Badge>
                          </div>
                          <h3 className="font-medium mb-1">{campaign.subject}</h3>
                          {campaign.preview_text && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {campaign.preview_text}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>수신: {campaign.total_recipients}명</span>
                            <span>발송: {campaign.emails_sent}건</span>
                            <span>반송: {campaign.emails_bounced}건</span>
                            {campaign.sent_at && (
                              <span>
                                {format(new Date(campaign.sent_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
