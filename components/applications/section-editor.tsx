'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Check, X, Edit2 } from 'lucide-react'

interface SectionEditorProps {
  index: number
  title: string
  content: string
  onSave: (content: string) => void
  onImproveRequest: () => void
  isImproving?: boolean
}

export function SectionEditor({
  index,
  title,
  content,
  onSave,
  onImproveRequest,
  isImproving = false,
}: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)

  const handleSave = () => {
    onSave(editContent)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(content)
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          {index + 1}. {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="h-8 px-2 text-green-600"
              >
                <Check className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 px-2"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onImproveRequest}
                disabled={isImproving}
                className="h-8 px-2 text-primary"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[200px] resize-y"
            placeholder="내용을 입력해 주세요"
          />
        ) : (
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {content || '내용이 없어요'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
