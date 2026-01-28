'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Document {
  id: string
  file_name: string
  file_size: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  page_count?: number
  created_at: string
}

interface BusinessPlanUploadProps {
  documents?: Document[]
  onUploadComplete?: () => void
  maxDocuments?: number
}

export function BusinessPlanUpload({
  documents = [],
  onUploadComplete,
  maxDocuments = 3,
}: BusinessPlanUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reprocessingId, setReprocessingId] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      if (documents.length >= maxDocuments) {
        toast.error(`최대 ${maxDocuments}개의 문서만 업로드할 수 있어요`)
        return
      }

      const file = acceptedFiles[0]

      // 파일 크기 체크 (250MB)
      if (file.size > 250 * 1024 * 1024) {
        toast.error('파일 크기는 250MB 이하여야 해요')
        return
      }

      setUploading(true)
      setUploadProgress(10)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentType', 'business_plan')

        setUploadProgress(30)

        const response = await fetch('/api/company-documents', {
          method: 'POST',
          body: formData,
        })

        setUploadProgress(70)

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || '업로드 실패')
        }

        setUploadProgress(100)
        toast.success('사업계획서가 업로드되었어요')
        onUploadComplete?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '업로드에 실패했어요')
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [documents.length, maxDocuments, onUploadComplete]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading || documents.length >= maxDocuments,
  })

  const handleDelete = async (documentId: string) => {
    if (!confirm('정말 삭제하시겠어요?')) return

    setDeletingId(documentId)
    try {
      const response = await fetch(`/api/company-documents/${documentId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('문서가 삭제되었어요')
      onUploadComplete?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '삭제에 실패했어요')
    } finally {
      setDeletingId(null)
    }
  }

  const handleReprocess = async (documentId: string) => {
    setReprocessingId(documentId)
    try {
      const response = await fetch(`/api/company-documents/${documentId}`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('문서 처리가 완료되었어요')
      onUploadComplete?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '재처리에 실패했어요')
    } finally {
      setReprocessingId(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusBadge = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            완료
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            처리 중
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            실패
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            대기
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          사업계획서 업로드
        </CardTitle>
        <CardDescription>
          사업계획서를 업로드하면 AI가 자동으로 분석하여 매칭과 지원서 작성에 활용해요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 업로드 영역 */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${uploading || documents.length >= maxDocuments ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          `}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">업로드 및 처리 중...</p>
              <Progress value={uploadProgress} className="max-w-xs mx-auto" />
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              {documents.length >= maxDocuments ? (
                <p className="text-sm text-muted-foreground">
                  최대 업로드 개수에 도달했어요
                </p>
              ) : isDragActive ? (
                <p className="text-sm text-primary">여기에 파일을 놓으세요</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    PDF 파일을 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-xs text-muted-foreground">
                    최대 250MB, {maxDocuments}개까지 업로드 가능
                  </p>
                </>
              )}
            </>
          )}
        </div>

        {/* 업로드된 문서 목록 */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">업로드된 문서</h4>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-8 w-8 text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(doc.file_size)}</span>
                      {doc.page_count && <span>• {doc.page_count}페이지</span>}
                      <span>
                        •{' '}
                        {formatDistanceToNow(new Date(doc.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                    {doc.error_message && (
                      <p className="text-xs text-destructive mt-1">{doc.error_message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(doc.status)}

                  {doc.status === 'failed' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReprocess(doc.id)}
                      disabled={reprocessingId === doc.id}
                    >
                      {reprocessingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• 사업계획서, 회사소개서, IR 자료 등을 업로드할 수 있어요</p>
          <p>• 업로드된 문서는 AI 매칭 및 지원서 작성 시 참고 자료로 활용돼요</p>
          <p>• 문서 내용은 암호화되어 안전하게 보관돼요</p>
        </div>
      </CardContent>
    </Card>
  )
}
