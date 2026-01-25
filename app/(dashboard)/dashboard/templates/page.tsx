'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  Loader2,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface TemplateSection {
  sectionName: string
  content: string
}

interface Template {
  id: string
  name: string
  description: string | null
  sections: TemplateSection[]
  is_default: boolean
  use_count: number
  created_at: string
  updated_at: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 폼 상태
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (data.success) {
        setTemplates(data.data || [])
      } else {
        toast.error(data.error || '템플릿 목록을 불러오지 못했어요')
      }
    } catch (error) {
      console.error('Fetch templates error:', error)
      toast.error('템플릿 목록을 불러오지 못했어요')
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingTemplate(null)
    setName('')
    setDescription('')
    setIsDefault(false)
    setIsDialogOpen(true)
  }

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template)
    setName(template.name)
    setDescription(template.description || '')
    setIsDefault(template.is_default)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('템플릿 이름을 입력해 주세요')
      return
    }

    setIsSaving(true)

    try {
      if (editingTemplate) {
        // 수정
        const response = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            isDefault,
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast.success('템플릿이 수정됐어요')
          fetchTemplates()
          setIsDialogOpen(false)
        } else {
          toast.error(data.error || '템플릿 수정에 실패했어요')
        }
      } else {
        // 생성 (빈 섹션으로)
        const defaultSections = [
          { sectionName: '사업 개요', content: '' },
          { sectionName: '기술 현황', content: '' },
          { sectionName: '시장 분석', content: '' },
          { sectionName: '사업화 전략', content: '' },
          { sectionName: '기대 효과', content: '' },
        ]

        const response = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,
            sections: defaultSections,
            isDefault,
          }),
        })

        const data = await response.json()

        if (data.success) {
          toast.success('템플릿이 생성됐어요')
          fetchTemplates()
          setIsDialogOpen(false)
        } else {
          toast.error(data.error || '템플릿 생성에 실패했어요')
        }
      }
    } catch (error) {
      console.error('Save template error:', error)
      toast.error('템플릿 저장에 실패했어요')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (template: Template) => {
    if (!confirm(`"${template.name}" 템플릿을 삭제할까요?`)) return

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('템플릿이 삭제됐어요')
        fetchTemplates()
      } else {
        toast.error(data.error || '템플릿 삭제에 실패했어요')
      }
    } catch (error) {
      console.error('Delete template error:', error)
      toast.error('템플릿 삭제에 실패했어요')
    }
  }

  const handleSetDefault = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('기본 템플릿으로 설정했어요')
        fetchTemplates()
      } else {
        toast.error(data.error || '설정에 실패했어요')
      }
    } catch (error) {
      console.error('Set default error:', error)
      toast.error('설정에 실패했어요')
    }
  }

  const handleDuplicate = async (template: Template) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (복사본)`,
          description: template.description,
          sections: template.sections,
          isDefault: false,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('템플릿이 복제됐어요')
        fetchTemplates()
      } else {
        toast.error(data.error || '템플릿 복제에 실패했어요')
      }
    } catch (error) {
      console.error('Duplicate template error:', error)
      toast.error('템플릿 복제에 실패했어요')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">지원서 템플릿</h1>
          <p className="text-muted-foreground">
            자주 쓰는 지원서 양식을 저장하고 재사용해요
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          새 템플릿
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">템플릿이 없어요</h3>
            <p className="text-muted-foreground text-sm mb-4 text-center">
              지원서 작성 후 템플릿으로 저장하거나<br />
              새 템플릿을 만들어 보세요
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              새 템플릿 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <Badge variant="secondary" className="font-normal">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          기본
                        </Badge>
                      )}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(template)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="h-4 w-4 mr-2" />
                        복제
                      </DropdownMenuItem>
                      {!template.is_default && (
                        <DropdownMenuItem onClick={() => handleSetDefault(template)}>
                          <Star className="h-4 w-4 mr-2" />
                          기본 템플릿으로 설정
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDelete(template)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>섹션 {template.sections?.length || 0}개</span>
                    <span>사용 {template.use_count}회</span>
                  </div>
                  <div>
                    수정: {formatDistanceToNow(new Date(template.updated_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? '템플릿 수정' : '새 템플릿'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? '템플릿 정보를 수정해요'
                : '새로운 지원서 템플릿을 만들어요'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">템플릿 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: R&D 지원사업 기본"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="템플릿에 대한 설명을 입력해요"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>기본 템플릿</Label>
                <p className="text-sm text-muted-foreground">
                  지원서 작성 시 자동으로 선택돼요
                </p>
              </div>
              <Switch
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {editingTemplate ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
