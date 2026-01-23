"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Users,
  Crown,
  RefreshCw,
  UserCheck,
  UserX,
  Building2,
  Calendar,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface UserData {
  user_id: string
  email: string | null
  company_name: string | null
  created_at: string
  last_sign_in_at: string | null
  provider: string
  subscription: {
    id: string
    plan: string
    status: string
    current_period_end: string
  } | null
}

type DialogMode = "grant" | "upgrade" | "downgrade"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("grant")
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [grantPlan, setGrantPlan] = useState("pro")
  const [grantMonths, setGrantMonths] = useState("1")
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users")
      const result = await response.json()

      if (result.success) {
        setUsers(result.data || [])
      } else {
        toast.error(result.error || "사용자 목록을 불러오지 못했어요")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했어요")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const isProUser = (user: UserData) => {
    return user.subscription?.plan === "pro" && user.subscription?.status === "active"
  }

  const isPremiumUser = (user: UserData) => {
    return user.subscription?.plan === "premium" && user.subscription?.status === "active"
  }

  const isFreeUser = (user: UserData) => {
    return !user.subscription ||
           user.subscription?.plan === "free" ||
           user.subscription?.status === "cancelled"
  }

  const handleSubscriptionChange = async () => {
    if (!selectedUser) return

    setProcessing(true)
    try {
      const body: Record<string, unknown> = {
        userId: selectedUser.user_id,
        plan: dialogMode === "downgrade" ? "pro" : grantPlan,
        months: dialogMode === "grant" ? parseInt(grantMonths) : undefined,
        keepPeriod: dialogMode === "upgrade" || dialogMode === "downgrade",
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const result = await response.json()

      if (result.success) {
        const planLabel = grantPlan === "premium" ? "Premium" : "Pro"
        const messages: Record<DialogMode, string> = {
          grant: planLabel + " 권한을 " + grantMonths + "개월간 부여했어요!",
          upgrade: "Premium으로 업그레이드했어요!",
          downgrade: "Pro로 다운그레이드했어요!"
        }
        toast.success(messages[dialogMode])
        setDialogOpen(false)
        fetchUsers()
      } else {
        toast.error(result.error || "처리하지 못했어요")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했어요")
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelSubscription = async (userId: string) => {
    if (!confirm("정말 이 사용자의 구독을 취소할까요? Free 플랜으로 변경됩니다.")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        toast.success("구독을 취소했어요")
        fetchUsers()
      } else {
        toast.error(result.error || "처리하지 못했어요")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했어요")
    }
  }

  const openDialog = (user: UserData, mode: DialogMode) => {
    setSelectedUser(user)
    setDialogMode(mode)
    if (mode === "grant") {
      setGrantPlan("pro")
      setGrantMonths("1")
    } else if (mode === "upgrade") {
      setGrantPlan("premium")
    }
    setDialogOpen(true)
  }

  const getSubscriptionBadge = (subscription: UserData["subscription"]) => {
    if (!subscription) {
      return <Badge variant="outline">Free</Badge>
    }

    if (subscription.plan === "premium" && subscription.status === "active") {
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Sparkles className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      )
    }

    if (subscription.plan === "pro" && subscription.status === "active") {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <Crown className="w-3 h-3 mr-1" />
          Pro
        </Badge>
      )
    }

    if (subscription.status === "cancelled") {
      return <Badge variant="outline" className="text-gray-500">취소됨</Badge>
    }

    return <Badge variant="outline">{subscription.plan}</Badge>
  }

  const premiumUsers = users.filter(u => u.subscription?.plan === "premium" && u.subscription?.status === "active")
  const proUsers = users.filter(u => u.subscription?.plan === "pro" && u.subscription?.status === "active")
  const freeUsers = users.filter(u => !u.subscription || u.subscription?.plan === "free" || u.subscription?.status === "cancelled")

  const getFilteredUsers = () => {
    switch (activeTab) {
      case "premium":
        return premiumUsers
      case "pro":
        return proUsers
      case "free":
        return freeUsers
      default:
        return users
    }
  }

  const filteredUsers = getFilteredUsers()

  const renderUserActions = (userData: UserData) => {
    if (isFreeUser(userData)) {
      return (
        <Button
          size="sm"
          onClick={() => openDialog(userData, "grant")}
        >
          <Crown className="w-4 h-4 mr-2" />
          구독 부여
        </Button>
      )
    }

    if (isProUser(userData)) {
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            className="text-purple-600 hover:text-purple-700 border-purple-300"
            onClick={() => openDialog(userData, "upgrade")}
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Premium 업그레이드
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleCancelSubscription(userData.user_id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            구독 취소
          </Button>
        </>
      )
    }

    if (isPremiumUser(userData)) {
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            className="text-yellow-600 hover:text-yellow-700 border-yellow-300"
            onClick={() => openDialog(userData, "downgrade")}
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Pro 다운그레이드
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleCancelSubscription(userData.user_id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            구독 취소
          </Button>
        </>
      )
    }

    return null
  }

  const getDialogContent = () => {
    switch (dialogMode) {
      case "grant":
        return {
          title: "구독 권한 부여",
          description: (selectedUser?.email || "사용자") + "에게 구독 권한을 부여합니다.",
          buttonText: "권한 부여",
          buttonIcon: <Crown className="w-4 h-4 mr-2" />
        }
      case "upgrade":
        return {
          title: "Premium 업그레이드",
          description: (selectedUser?.email || "사용자") + "를 Premium으로 업그레이드합니다. 기존 구독 기간이 유지됩니다.",
          buttonText: "업그레이드",
          buttonIcon: <ArrowUp className="w-4 h-4 mr-2" />
        }
      case "downgrade":
        return {
          title: "Pro 다운그레이드",
          description: (selectedUser?.email || "사용자") + "를 Pro로 다운그레이드합니다. 기존 구독 기간이 유지됩니다.",
          buttonText: "다운그레이드",
          buttonIcon: <ArrowDown className="w-4 h-4 mr-2" />
        }
    }
  }

  const dialogContent = getDialogContent()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground">사용자 구독 상태를 확인하고 권한을 관리합니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}명</div>
            <p className="text-xs text-muted-foreground">등록된 사용자</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Premium 구독자</CardTitle>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{premiumUsers.length}명</div>
            <p className="text-xs text-muted-foreground">프리미엄 구독 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pro 구독자</CardTitle>
            <Crown className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proUsers.length}명</div>
            <p className="text-xs text-muted-foreground">프로 구독 중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Free 사용자</CardTitle>
            <UserCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freeUsers.length}명</div>
            <p className="text-xs text-muted-foreground">무료 플랜</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>사용자 목록</CardTitle>
              <CardDescription>사용자에게 직접 구독 권한을 부여하거나 취소할 수 있습니다</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                전체 ({users.length})
              </TabsTrigger>
              <TabsTrigger value="premium">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium ({premiumUsers.length})
              </TabsTrigger>
              <TabsTrigger value="pro">
                <Crown className="w-3 h-3 mr-1" />
                Pro ({proUsers.length})
              </TabsTrigger>
              <TabsTrigger value="free">
                Free ({freeUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {activeTab === "premium" ? "Premium 구독자가 없습니다" :
                     activeTab === "pro" ? "Pro 구독자가 없습니다" :
                     activeTab === "free" ? "Free 사용자가 없습니다" :
                     "등록된 사용자가 없습니다"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredUsers.map((userData) => (
                    <div
                      key={userData.user_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {userData.email || "이메일 없음"}
                            </span>
                            {getSubscriptionBadge(userData.subscription)}
                            <Badge variant="outline" className="text-xs">
                              {userData.provider === 'google' ? 'Google' :
                               userData.provider === 'kakao' ? '카카오' : '이메일'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>{userData.company_name || "기업 미등록"}</span>
                            <span className="mx-2">•</span>
                            <span className="text-xs">
                              가입: {format(new Date(userData.created_at), "yyyy.M.d", { locale: ko })}
                            </span>
                            {userData.subscription?.current_period_end && userData.subscription?.status === "active" && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="flex items-center gap-1 inline-flex">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(userData.subscription.current_period_end), "yyyy.M.d", { locale: ko })}까지
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderUserActions(userData)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogContent.title}</DialogTitle>
            <DialogDescription>
              {dialogContent.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {dialogMode === "grant" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">플랜 선택</label>
                  <Select value={grantPlan} onValueChange={setGrantPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">기간 선택</label>
                  <Select value={grantMonths} onValueChange={setGrantMonths}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1개월</SelectItem>
                      <SelectItem value="3">3개월</SelectItem>
                      <SelectItem value="6">6개월</SelectItem>
                      <SelectItem value="12">12개월 (1년)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {dialogMode === "upgrade" && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 font-medium mb-1">
                  <Sparkles className="w-4 h-4" />
                  Premium 플랜
                </div>
                <p className="text-sm text-purple-600">
                  현재 구독 기간이 유지되면서 Premium 기능을 사용할 수 있습니다.
                </p>
              </div>
            )}

            {dialogMode === "downgrade" && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                  <Crown className="w-4 h-4" />
                  Pro 플랜
                </div>
                <p className="text-sm text-yellow-600">
                  현재 구독 기간이 유지되면서 Pro 기능만 사용할 수 있습니다.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubscriptionChange} disabled={processing}>
              {processing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                dialogContent.buttonIcon
              )}
              {dialogContent.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
