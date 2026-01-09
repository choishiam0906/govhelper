'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionEditor } from '@/components/applications/section-editor'
import { AIImproveDialog } from '@/components/applications/ai-improve-dialog'
import { ArrowLeft, Building2, Calendar, Save, Loader2, Trash2, CheckCircle } from 'lucide-react'
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
  const [improvingSection, setImprovingSection] = useState<number | null>(null)
  const [improveDialogOpen, setImproveDialogOpen] = useState(false)
  const [selectedSection, setSelectedSection] = useState<number | null>(null)

  const announcement = application.matches?.announcements

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

  const handleImprove = async (feedback: string) => {
    if (selectedSection === null) return

    setImprovingSection(selectedSection)
    try {
      const response = await fetch(`/api/applications/${application.id}/improve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionIndex: selectedSection,
          currentContent: content.sections[selectedSection].content,
          feedback,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'AI 개선에 실패했습니다')
      }

      // 로컬 상태 업데이트
      const updatedContent = { ...content }
      updatedContent.sections[selectedSection].content = result.data.improvedContent
      updatedContent.sections[selectedSection].improvedAt = new Date().toISOString()
      setContent(updatedContent)

      toast.success('AI가 섹션을 개선했습니다')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '오류가 발생했습니다')
    } finally {
      setImprovingSection(null)
    }
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
        throw new Error(result.error || '저장에 실패했습니다')
      }

      if (newStatus) {
        setStatus(newStatus)
      }
      toast.success('저장되었습니다')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다')
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
        throw new Error(result.error || '삭제에 실패했습니다')
      }

      toast.success('지원서가 삭제되었습니다')
      router.push('/dashboard/applications')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다')
    } finally {
      setDeleting(false)
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
                  이 지원서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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

      {/* 섹션 에디터 */}
      <div className="space-y-4">
        {content.sections.map((section, index) => (
          <SectionEditor
            key={index}
            index={index}
            title={section.section}
            content={section.content}
            onSave={(newContent) => handleSectionSave(index, newContent)}
            onImproveRequest={() => handleImproveRequest(index)}
            isImproving={improvingSection === index}
          />
        ))}
      </div>

      {/* 하단 안내 */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>* 각 섹션의 편집 아이콘을 클릭하여 내용을 직접 수정할 수 있습니다.</p>
            <p>* AI 아이콘을 클릭하면 해당 섹션을 AI가 개선해드립니다.</p>
            <p>* 작성이 완료되면 &quot;작성 완료&quot; 버튼을 클릭해주세요.</p>
          </div>
        </CardContent>
      </Card>

      {/* AI 개선 다이얼로그 */}
      {selectedSection !== null && (
        <AIImproveDialog
          open={improveDialogOpen}
          onOpenChange={setImproveDialogOpen}
          sectionTitle={content.sections[selectedSection]?.section || ''}
          currentContent={content.sections[selectedSection]?.content || ''}
          onImprove={handleImprove}
        />
      )}
    </div>
  )
}
