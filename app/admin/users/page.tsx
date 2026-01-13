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
  Calendar
} from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface UserData {
  user_id: string
  company_name: string | null
  created_at: string
  subscription: {
    id: string
    plan: string
    status: string
    current_period_end: string
  } | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [grantDialogOpen, setGrantDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
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
        toast.error(result.error || "사용자 목록을 불러오는데 실패했습니다")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleGrantPro = async () => {
    if (!selectedUser) return

    setProcessing(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.user_id,
          plan: "pro",
          months: parseInt(grantMonths),
        }),
      })
      const result = await response.json()

      if (result.success) {
        toast.success(`Pro 권한이 ${grantMonths}개월간 부여되었습니다!`)
        setGrantDialogOpen(false)
        fetchUsers()
      } else {
        toast.error(result.error || "처리에 실패했습니다")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했습니다")
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelSubscription = async (userId: string) => {
    if (!confirm("정말 이 사용자의 구독을 취소하시겠습니까?")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        toast.success("구독이 취소되었습니다")
        fetchUsers()
      } else {
        toast.error(result.error || "처리에 실패했습니다")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했습니다")
    }
  }

  const getSubscriptionBadge = (subscription: UserData["subscription"]) => {
    if (!subscription) {
      return <Badge variant="outline">Free</Badge>
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

  const proUsers = users.filter(u => u.subscription?.plan === "pro" && u.subscription?.status === "active")
  const freeUsers = users.filter(u => !u.subscription || u.subscription?.plan === "free" || u.subscription?.status === "cancelled")

  // 탭에 따라 표시할 사용자 필터링
  const getFilteredUsers = () => {
    switch (activeTab) {
      case "pro":
        return proUsers
      case "free":
        return freeUsers
      default:
        return users
    }
  }

  const filteredUsers = getFilteredUsers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground">사용자 구독 상태를 확인하고 권한을 관리합니다</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium">Pro 구독자</CardTitle>
            <Crown className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proUsers.length}명</div>
            <p className="text-xs text-muted-foreground">유료 구독 중</p>
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

      {/* 사용자 목록 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>사용자 목록</CardTitle>
              <CardDescription>사용자에게 직접 Pro 권한을 부여하거나 취소할 수 있습니다</CardDescription>
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
                    {activeTab === "pro" ? "Pro 구독자가 없습니다" :
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
                          {userData.company_name || "기업 미등록"}
                        </span>
                        {getSubscriptionBadge(userData.subscription)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{userData.user_id.slice(0, 8)}...</span>
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
                    {(!userData.subscription || userData.subscription.plan !== "pro" || userData.subscription.status !== "active") ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUser(userData)
                          setGrantDialogOpen(true)
                        }}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Pro 부여
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleCancelSubscription(userData.user_id)}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        구독 취소
                      </Button>
                    )}
                  </div>
                </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pro 권한 부여 다이얼로그 */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pro 권한 부여</DialogTitle>
            <DialogDescription>
              {selectedUser?.company_name || "기업 미등록"} 사용자에게 Pro 권한을 부여합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleGrantPro} disabled={processing}>
              {processing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              권한 부여
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
