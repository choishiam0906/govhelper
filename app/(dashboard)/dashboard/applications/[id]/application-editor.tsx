'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionEditor } from '@/components/applications/section-editor'
import { AIImproveDialog } from '@/components/applications/ai-improve-dialog'
import { ScorePanel } from '@/components/applications/score-panel'
import { useApplicationScore } from '@/lib/hooks/use-application-score'
import { ArrowLeft, Building2, Calendar, Save, Loader2, Trash2, CheckCircle, FolderPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DownloadPDFButton } from './download-pdf-button'
import { DownloadHwpxButton } from './download-hwpx-button'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ApplicationSection {
  section: string
  content: string
  improvedAt?: string
}

interface ApplicationContent {
  sections: ApplicationSection[]
  metadata?: {
    announcementId: string
    announcementTitle: string
    generatedAt: string
  }
}

interface ApplicationEditorProps {
  application: {
    id: string
    content: string
    status: string
    created_at: string
    updated_at: string
    matches: {
      id: string
      match_score: number
      analysis: any
      announcements: {
        id: string
        title: string
        organization: string | null
        category: string | null
        support_type: string | null
        support_amount: string | null
        application_end: string | null
      }
    }
  }
}

export function ApplicationEditor({ application }: ApplicationEditorProps) {
  const router = useRouter()
  const [content, setContent] = useState<ApplicationContent>(
    application.content ? JSON.parse(application.content) : { sections: [] }
  )
  const [status, setStatus] = useState(application.status)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [improveDialogOpen, setImproveDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)

  const announcement = application.matches?.announcements

  // 실시간 점수 분석 훅
  const {
    score,
    isLoading: scoreLoading,
    analyzeScore,
  } = useApplicationScore({ debounceMs: 3000, minContentLength: 100 })

  // 섹션 내용 변경 시 점수 분석 트리거
  const triggerScoreAnalysis = useCallback(() => {
    if (announcement?.id && content.sections.length > 0) {
      analyzeScore(announcement.id, content.sections)
    }
  }, [announcement?.id, content.sections, analyzeScore])

  // 초기 로드 및 내용 변경 시 점수 분석
  useEffect(() => {
    triggerScoreAnalysis()
  }, [triggerScoreAnalysis])

  const handleSectionSave = async (index: number, newContent: string) => {
    const updatedContent = { ...content }
    updatedContent.sections[index].content = newContent

    setContent(updatedContent)
    await saveApplication(updatedContent)
  }

  const handleImproveRequest = (index: number) => {
    setSelectedSection(index)
    setImproveDialogOpen(true)
  }

  // 스트리밍 완료 후 로컬 상태 업데이트
  const handleImproveComplete = (newContent: string) => {
    if (selectedSection === null) return

    const updatedContent = { ...content }
    updatedContent.sections[selectedSection].content = newContent
    updatedContent.sections[selectedSection].improvedAt = new Date().toISOString()
    setContent(updatedContent)
  }

  const saveApplication = async (contentToSave: ApplicationContent, newStatus?: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(contentToSave),
          status: newStatus || status,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '저장하지 못했어요')
      }

      if (newStatus) {
        setStatus(newStatus)
      }
      toast.success('저장했어요')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '저장하지 못했어요')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    await saveApplication(content, 'completed')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '삭제하지 못했어요')
      }

      toast.success('지원서를 삭제했어요')
      router.push('/dashboard/applications')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제하지 못했어요')
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('템플릿 이름을 입력해 주세요')
      return
    }

    setSavingTemplate(true)
    try {
      const sections = content.sections.map((s) => ({
        sectionName: s.section,
        content: s.content,
      }))

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          sections,
          isDefault: false,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '템플릿 저장에 실패했어요')
      }

      toast.success('템플릿으로 저장했어요')
      setTemplateDialogOpen(false)
      setTemplateName('')
      setTemplateDescription('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '템플릿 저장에 실패했어요')
    } finally {
      setSavingTemplate(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/applications">
                <ArrowLeft className="h-4 w-4 mr-1" />
                목록으로
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{announcement?.title || '삭제된 공고'}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {announcement?.organization && (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {announcement.organization}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              수정일: {new Date(application.updated_at).toLocaleDateString('ko-KR')}
            </span>
            <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
              {status === 'completed' ? '완료' : '작성 중'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplateDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-1" />
            템플릿으로 저장
          </Button>
          <DownloadHwpxButton application={application} />
          <DownloadPDFButton application={application} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>지원서 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  이 지원서를 삭제할까요? 이 작업은 되돌릴 수 없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {status !== 'completed' && (
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              작성 완료
            </Button>
          )}
        </div>
      </div>

      {/* 매칭 정보 요약 */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">매칭 점수: </span>
              <span className="font-bold text-primary">{application.matches?.match_score}점</span>
            </div>
            <Button variant="link" size="sm" asChild>
              <Link href={`/dashboard/matching/${application.matches?.id}`}>
                매칭 분석 상세보기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2열 레이아웃: 에디터 + 점수 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 섹션 에디터 (왼쪽 2열) */}
        <div className="lg:col-span-2 space-y-4">
          {content.sections.map((section, index) => (
            <SectionEditor
              key={index}
              index={index}
              title={section.section}
              content={section.content}
              onSave={(newContent) => handleSectionSave(index, newContent)}
              onImproveRequest={() => handleImproveRequest(index)}
              announcementId={announcement?.id}
            />
          ))}

          {/* 하단 안내 */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>* 📖 &quot;작성 가이드&quot;를 클릭하면 섹션별 맞춤 작성 팁을 확인할 수 있어요.</p>
                <p>* ✏️ 편집 아이콘을 클릭하여 내용을 직접 수정할 수 있어요.</p>
                <p>* ✨ AI 아이콘을 클릭하면 해당 섹션을 AI가 개선해드려요.</p>
                <p>* 오른쪽 패널에서 실시간 예상 점수를 확인할 수 있어요.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 실시간 점수 패널 (오른쪽 1열) */}
        <div className="lg:col-span-1">
          <ScorePanel
            totalEstimatedScore={score?.totalEstimatedScore || 0}
            totalMaxScore={score?.totalMaxScore || 100}
            percentage={score?.percentage || 0}
            sectionScores={score?.sectionScores || []}
            overallFeedback={score?.overallFeedback || ''}
            isLoading={scoreLoading}
            onRefresh={triggerScoreAnalysis}
          />
        </div>
      </div>

      {/* AI 개선 다이얼로그 (스트리밍 지원) */}
      {selectedSection !== null && (
        <AIImproveDialog
          open={improveDialogOpen}
          onOpenChange={setImproveDialogOpen}
          applicationId={application.id}
          sectionIndex={selectedSection}
          sectionTitle={content.sections[selectedSection]?.section || ''}
          currentContent={content.sections[selectedSection]?.content || ''}
          onImproveComplete={handleImproveComplete}
        />
      )}

      {/* 템플릿으로 저장 다이얼로그 */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>템플릿으로 저장</DialogTitle>
            <DialogDescription>
              현재 지원서를 템플릿으로 저장하면 다른 공고에 재사용할 수 있어요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">템플릿 이름</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="예: R&D 지원사업 기본"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="templateDescription">설명 (선택)</Label>
              <Textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="템플릿에 대한 설명을 입력해요"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveAsTemplate} disabled={savingTemplate}>
              {savingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <FolderPlus className="h-4 w-4 mr-2" />
              )}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
