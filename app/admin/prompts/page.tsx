"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { BrainCircuit, Plus, RefreshCw, Activity, TrendingUp, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface PromptVersion {
  id: string
  prompt_type: string
  version: string
  content: string
  description: string | null
  is_active: boolean
  weight: number
  created_at: string
  updated_at: string
}

interface PromptMetrics {
  version_id: string
  prompt_type: string
  version: string
  total_usage: number
  avg_score: number | null
  avg_response_time: number | null
  error_rate: number | null
  success_rate: number | null
}

const PROMPT_TYPE_LABELS: Record<string, string> = {
  matching_analysis: "AI 매칭 분석",
  eligibility_parsing: "지원자격 파싱",
  application_section: "지원서 섹션 작성",
  section_improvement: "섹션 개선",
  evaluation_extraction: "평가기준 추출",
  evaluation_matching: "평가기준 기반 매칭 분석",
  chatbot: "AI 챗봇",
  application_score: "지원서 점수 분석",
  section_guide: "섹션별 작성 가이드",
}

const PROMPT_TYPES = Object.keys(PROMPT_TYPE_LABELS)

export default function AdminPromptsPage() {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [metrics, setMetrics] = useState<PromptMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>(PROMPT_TYPES[0])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 폼 상태
  const [formData, setFormData] = useState({
    promptType: PROMPT_TYPES[0],
    version: "",
    content: "",
    description: "",
    weight: 50,
  })

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/prompts?type=${activeTab}`)
      const result = await response.json()

      if (result.versions) {
        setVersions(result.versions)
      } else {
        toast.error("프롬프트 목록을 불러오지 못했어요")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했어요")
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/admin/prompts/metrics")
      const result = await response.json()

      if (result.metrics) {
        setMetrics(result.metrics)
      }
    } catch (error) {
      console.error("메트릭 조회 실패:", error)
    }
  }

  useEffect(() => {
    fetchVersions()
    fetchMetrics()
  }, [activeTab])

  const handleCreateVersion = async () => {
    if (!formData.version || !formData.content) {
      toast.error("버전과 프롬프트 내용을 입력해 주세요")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptType: formData.promptType,
          version: formData.version,
          content: formData.content,
          description: formData.description,
          weight: formData.weight,
        }),
      })

      const result = await response.json()

      if (result.version) {
        toast.success("새 버전을 생성했어요")
        setDialogOpen(false)
        setFormData({
          promptType: PROMPT_TYPES[0],
          version: "",
          content: "",
          description: "",
          weight: 50,
        })
        fetchVersions()
      } else {
        toast.error(result.error || "생성하지 못했어요")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했어요")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch("/api/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          isActive: !currentActive,
        }),
      })

      const result = await response.json()

      if (result.version) {
        toast.success(currentActive ? "비활성화했어요" : "활성화했어요")
        fetchVersions()
      } else {
        toast.error(result.error || "업데이트하지 못했어요")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했어요")
    }
  }

  const handleUpdateWeight = async (id: string, newWeight: number) => {
    try {
      const response = await fetch("/api/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          weight: newWeight,
        }),
      })

      const result = await response.json()

      if (result.version) {
        toast.success("가중치를 변경했어요")
        fetchVersions()
      } else {
        toast.error(result.error || "업데이트하지 못했어요")
      }
    } catch (error) {
      toast.error("서버 오류가 발생했어요")
    }
  }

  const getMetricsForVersion = (versionId: string): PromptMetrics | undefined => {
    return metrics.find((m) => m.version_id === versionId)
  }

  const activeVersions = versions.filter((v) => v.is_active)
  const inactiveVersions = versions.filter((v) => !v.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BrainCircuit className="w-6 h-6" />
            프롬프트 관리
          </h1>
          <p className="text-muted-foreground">AI 프롬프트 버전을 관리하고 A/B 테스트를 진행합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { fetchVersions(); fetchMetrics() }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            새로고침
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                새 버전 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 프롬프트 버전 추가</DialogTitle>
                <DialogDescription>새로운 프롬프트 버전을 생성하고 A/B 테스트에 사용합니다</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-type">프롬프트 타입</Label>
                  <select
                    id="prompt-type"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    value={formData.promptType}
                    onChange={(e) => setFormData({ ...formData, promptType: e.target.value })}
                  >
                    {PROMPT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {PROMPT_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">버전 (예: v1, v2, v2.1)</Label>
                  <Input
                    id="version"
                    placeholder="v1"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">프롬프트 내용</Label>
                  <Textarea
                    id="content"
                    placeholder="프롬프트를 입력하세요..."
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">설명 (선택)</Label>
                  <Input
                    id="description"
                    placeholder="이 버전의 변경 사항을 설명하세요"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">가중치 (0-100, A/B 테스트 비율)</Label>
                  <div className="flex items-center gap-4">
                    <input
                      id="weight"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">{formData.weight}%</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                  취소
                </Button>
                <Button onClick={handleCreateVersion} disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    "생성"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-5 w-full">
          {PROMPT_TYPES.slice(0, 5).map((type) => (
            <TabsTrigger key={type} value={type} className="text-xs lg:text-sm">
              {PROMPT_TYPE_LABELS[type].replace(/AI |섹션별 /g, "")}
            </TabsTrigger>
          ))}
        </TabsList>
        {PROMPT_TYPES.length > 5 && (
          <TabsList className="grid grid-cols-4 w-full mt-2">
            {PROMPT_TYPES.slice(5).map((type) => (
              <TabsTrigger key={type} value={type} className="text-xs lg:text-sm">
                {PROMPT_TYPE_LABELS[type].replace(/AI |섹션별 /g, "")}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* 활성 버전 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">활성 버전 ({activeVersions.length})</h3>
                {activeVersions.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>활성화된 버전이 없습니다</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {activeVersions.map((version) => {
                      const m = getMetricsForVersion(version.id)
                      return (
                        <Card key={version.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                  {version.version}
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    활성
                                  </Badge>
                                </CardTitle>
                                {version.description && (
                                  <CardDescription>{version.description}</CardDescription>
                                )}
                              </div>
                              <Switch
                                checked={version.is_active}
                                onCheckedChange={() => handleToggleActive(version.id, version.is_active)}
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* 프롬프트 내용 */}
                            <div>
                              <Label className="text-xs text-muted-foreground">프롬프트 내용</Label>
                              <div className="mt-1 p-3 bg-muted/50 rounded-md text-sm max-h-32 overflow-y-auto whitespace-pre-wrap">
                                {version.content}
                              </div>
                            </div>

                            {/* 가중치 슬라이더 */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">A/B 테스트 가중치</Label>
                                <span className="text-sm font-medium">{version.weight}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={version.weight}
                                onChange={(e) => handleUpdateWeight(version.id, Number(e.target.value))}
                                className="w-full"
                              />
                            </div>

                            {/* 메트릭 */}
                            {m && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
                                <div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Activity className="w-3 h-3" />
                                    사용 횟수
                                  </div>
                                  <div className="text-lg font-bold">{m.total_usage || 0}</div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <TrendingUp className="w-3 h-3" />
                                    평균 점수
                                  </div>
                                  <div className="text-lg font-bold">
                                    {m.avg_score ? m.avg_score.toFixed(1) : "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">평균 응답 시간</div>
                                  <div className="text-lg font-bold">
                                    {m.avg_response_time ? `${Math.round(m.avg_response_time)}ms` : "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">에러율</div>
                                  <div className="text-lg font-bold">
                                    {m.error_rate !== null && m.error_rate !== undefined
                                      ? `${(m.error_rate * 100).toFixed(1)}%`
                                      : "-"}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              생성일: {format(new Date(version.created_at), "yyyy년 M월 d일 HH:mm", { locale: ko })}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* 비활성 버전 */}
              {inactiveVersions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">비활성 버전 ({inactiveVersions.length})</h3>
                  <div className="grid gap-4">
                    {inactiveVersions.map((version) => {
                      const m = getMetricsForVersion(version.id)
                      return (
                        <Card key={version.id} className="opacity-60">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                  {version.version}
                                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                    비활성
                                  </Badge>
                                </CardTitle>
                                {version.description && (
                                  <CardDescription>{version.description}</CardDescription>
                                )}
                              </div>
                              <Switch
                                checked={version.is_active}
                                onCheckedChange={() => handleToggleActive(version.id, version.is_active)}
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">프롬프트 내용</Label>
                              <div className="mt-1 p-3 bg-muted/50 rounded-md text-sm max-h-32 overflow-y-auto whitespace-pre-wrap">
                                {version.content}
                              </div>
                            </div>

                            {m && m.total_usage > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t text-sm">
                                <div>
                                  <div className="text-xs text-muted-foreground">사용 횟수</div>
                                  <div className="font-medium">{m.total_usage}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">평균 점수</div>
                                  <div className="font-medium">
                                    {m.avg_score ? m.avg_score.toFixed(1) : "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">응답 시간</div>
                                  <div className="font-medium">
                                    {m.avg_response_time ? `${Math.round(m.avg_response_time)}ms` : "-"}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">에러율</div>
                                  <div className="font-medium">
                                    {m.error_rate !== null && m.error_rate !== undefined
                                      ? `${(m.error_rate * 100).toFixed(1)}%`
                                      : "-"}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              생성일: {format(new Date(version.created_at), "yyyy년 M월 d일 HH:mm", { locale: ko })}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
