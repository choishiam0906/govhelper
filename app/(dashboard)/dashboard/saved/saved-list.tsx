'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Bookmark,
  Clock,
  Building2,
  Coins,
  Calendar,
  FolderOpen,
  FolderPlus,
  Tag,
  Search,
  AlertTriangle,
  ExternalLink,
  MoreVertical,
  Trash2,
  Edit,
  Bell,
  BellOff,
  X,
  Plus,
  StickyNote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SavedItem {
  id: string
  announcementId: string
  title: string
  organization: string | null
  category: string | null
  supportType: string | null
  supportAmount: string | null
  applicationStart: string | null
  applicationEnd: string | null
  source: string
  status: string
  folderId: string | null
  tags: string[]
  memo: string | null
  notifyDeadline: boolean
  savedAt: string
}

interface Folder {
  id: string
  name: string
  color: string
  icon: string
}

interface SavedAnnouncementsListProps {
  items: SavedItem[]
  folders: Folder[]
  allTags: string[]
  currentFolder?: string
  currentTag?: string
  currentSort?: string
  currentSearch?: string
  sourceLabels: Record<string, string>
}

// 폴더 색상
const folderColors: Record<string, string> = {
  gray: 'bg-gray-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
}

export function SavedAnnouncementsList({
  items,
  folders,
  allTags,
  currentFolder,
  currentTag,
  currentSort,
  currentSearch,
  sourceLabels,
}: SavedAnnouncementsListProps) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch || '')
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null)
  const [showFolderDialog, setShowFolderDialog] = useState(false)
  const [showMemoDialog, setShowMemoDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('blue')
  const [memo, setMemo] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const today = new Date()

  // D-day 계산
  const getDday = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // URL 업데이트
  const updateFilters = (params: Record<string, string | undefined>) => {
    const url = new URL(window.location.href)
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value)
      } else {
        url.searchParams.delete(key)
      }
    })
    router.push(url.pathname + url.search)
  }

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: search || undefined })
  }

  // 폴더 변경
  const handleFolderChange = async (itemId: string, folderId: string | null) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/saved-announcements/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, folderId }),
      })
      if (res.ok) {
        toast.success('폴더가 변경되었어요')
        router.refresh()
      }
    } catch {
      toast.error('폴더 변경에 실패했어요')
    }
    setIsLoading(false)
    setShowFolderDialog(false)
  }

  // 메모 저장
  const handleMemoSave = async () => {
    if (!selectedItem) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/saved-announcements/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedItem.id, memo }),
      })
      if (res.ok) {
        toast.success('메모가 저장되었어요')
        router.refresh()
      }
    } catch {
      toast.error('메모 저장에 실패했어요')
    }
    setIsLoading(false)
    setShowMemoDialog(false)
  }

  // 태그 추가
  const handleAddTag = async (itemId: string, tag: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item || item.tags.includes(tag)) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/saved-announcements/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, tags: [...item.tags, tag] }),
      })
      if (res.ok) {
        toast.success('태그가 추가되었어요')
        router.refresh()
      }
    } catch {
      toast.error('태그 추가에 실패했어요')
    }
    setIsLoading(false)
  }

  // 태그 삭제
  const handleRemoveTag = async (itemId: string, tag: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/saved-announcements/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, tags: item.tags.filter(t => t !== tag) }),
      })
      if (res.ok) {
        toast.success('태그가 삭제되었어요')
        router.refresh()
      }
    } catch {
      toast.error('태그 삭제에 실패했어요')
    }
    setIsLoading(false)
  }

  // 저장 삭제
  const handleDelete = async (announcementId: string) => {
    if (!confirm('정말 삭제하시겠어요?')) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/saved-announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId }),
      })
      if (res.ok) {
        toast.success('저장이 삭제되었어요')
        router.refresh()
      }
    } catch {
      toast.error('삭제에 실패했어요')
    }
    setIsLoading(false)
  }

  // 새 폴더 생성
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/saved-announcements/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), color: newFolderColor }),
      })
      if (res.ok) {
        toast.success('폴더가 생성되었어요')
        setNewFolderName('')
        setShowNewFolderDialog(false)
        router.refresh()
      }
    } catch {
      toast.error('폴더 생성에 실패했어요')
    }
    setIsLoading(false)
  }

  // 알림 토글
  const handleToggleNotify = async (itemId: string, currentValue: boolean) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/saved-announcements/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, notifyDeadline: !currentValue }),
      })
      if (res.ok) {
        toast.success(!currentValue ? '마감 알림이 켜졌어요' : '마감 알림이 꺼졌어요')
        router.refresh()
      }
    } catch {
      toast.error('알림 설정에 실패했어요')
    }
    setIsLoading(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* 사이드바 - 폴더 & 태그 */}
      <div className="space-y-4">
        {/* 폴더 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">폴더</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowNewFolderDialog(true)}
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <Button
              variant={!currentFolder ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => updateFilters({ folder: undefined })}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              전체
              <span className="ml-auto text-muted-foreground">{items.length}</span>
            </Button>
            <Button
              variant={currentFolder === 'uncategorized' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => updateFilters({ folder: 'uncategorized' })}
            >
              <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              미분류
              <span className="ml-auto text-muted-foreground">
                {items.filter(i => !i.folderId).length}
              </span>
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={currentFolder === folder.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => updateFilters({ folder: folder.id })}
              >
                <div className={cn('h-3 w-3 rounded mr-2', folderColors[folder.color])} />
                {folder.name}
                <span className="ml-auto text-muted-foreground">
                  {items.filter(i => i.folderId === folder.id).length}
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* 태그 */}
        {allTags.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">태그</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={currentTag === tag ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => updateFilters({ tag: currentTag === tag ? undefined : tag })}
                >
                  #{tag}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="space-y-4">
        {/* 검색 & 정렬 */}
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="공고명, 기관명으로 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>
          <Select
            value={currentSort || 'created_at'}
            onValueChange={(value) => updateFilters({ sort: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">저장일 순</SelectItem>
              <SelectItem value="deadline">마감일 순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 공고 목록 */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">저장된 공고가 없어요</h3>
              <p className="text-muted-foreground text-center mb-4">
                공고 상세 페이지에서 관심 공고를 저장해 보세요
              </p>
              <Button asChild>
                <Link href="/dashboard/announcements">공고 검색하기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const dday = getDday(item.applicationEnd)
              const isExpired = dday !== null && dday < 0
              const isUrgent = dday !== null && dday >= 0 && dday <= 7
              const folder = folders.find(f => f.id === item.folderId)

              return (
                <Card
                  key={item.id}
                  className={cn(
                    'transition-colors',
                    isExpired && 'opacity-60'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* 메인 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {folder && (
                            <Badge variant="outline" className="text-xs">
                              <div className={cn('h-2 w-2 rounded mr-1', folderColors[folder.color])} />
                              {folder.name}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {sourceLabels[item.source] || item.source}
                          </Badge>
                          {item.notifyDeadline && (
                            <Bell className="h-3 w-3 text-primary" />
                          )}
                        </div>

                        <Link
                          href={`/dashboard/announcements/${item.announcementId}`}
                          className="font-medium hover:text-primary line-clamp-2"
                        >
                          {item.title}
                        </Link>

                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                          {item.organization && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {item.organization}
                            </span>
                          )}
                          {item.supportAmount && (
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <Coins className="h-3 w-3" />
                              {item.supportAmount}
                            </span>
                          )}
                          {item.applicationEnd && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              ~{new Date(item.applicationEnd).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                        </div>

                        {/* 태그 */}
                        {item.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {item.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRemoveTag(item.id, tag)}
                              >
                                #{tag}
                                <X className="h-2 w-2 ml-1" />
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* 메모 */}
                        {item.memo && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm text-muted-foreground">
                            <StickyNote className="h-3 w-3 inline mr-1" />
                            {item.memo}
                          </div>
                        )}
                      </div>

                      {/* D-day & 액션 */}
                      <div className="flex flex-col items-end gap-2">
                        {dday !== null && (
                          <Badge
                            variant={isExpired ? 'outline' : isUrgent ? 'destructive' : 'secondary'}
                          >
                            {isExpired ? '마감' : `D-${dday}`}
                          </Badge>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item)
                                setShowFolderDialog(true)
                              }}
                            >
                              <FolderOpen className="h-4 w-4 mr-2" />
                              폴더 변경
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedItem(item)
                                setMemo(item.memo || '')
                                setShowMemoDialog(true)
                              }}
                            >
                              <StickyNote className="h-4 w-4 mr-2" />
                              메모 {item.memo ? '수정' : '추가'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                const tag = prompt('추가할 태그를 입력하세요')
                                if (tag) handleAddTag(item.id, tag.trim())
                              }}
                            >
                              <Tag className="h-4 w-4 mr-2" />
                              태그 추가
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleNotify(item.id, item.notifyDeadline)}
                            >
                              {item.notifyDeadline ? (
                                <>
                                  <BellOff className="h-4 w-4 mr-2" />
                                  알림 끄기
                                </>
                              ) : (
                                <>
                                  <Bell className="h-4 w-4 mr-2" />
                                  알림 켜기
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/announcements/${item.announcementId}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                상세보기
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(item.announcementId)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              저장 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 폴더 변경 다이얼로그 */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>폴더 변경</DialogTitle>
            <DialogDescription>
              공고를 저장할 폴더를 선택하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant={!selectedItem?.folderId ? 'secondary' : 'outline'}
              className="w-full justify-start"
              onClick={() => selectedItem && handleFolderChange(selectedItem.id, null)}
              disabled={isLoading}
            >
              <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              미분류
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={selectedItem?.folderId === folder.id ? 'secondary' : 'outline'}
                className="w-full justify-start"
                onClick={() => selectedItem && handleFolderChange(selectedItem.id, folder.id)}
                disabled={isLoading}
              >
                <div className={cn('h-3 w-3 rounded mr-2', folderColors[folder.color])} />
                {folder.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 메모 다이얼로그 */}
      <Dialog open={showMemoDialog} onOpenChange={setShowMemoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>메모</DialogTitle>
            <DialogDescription>
              이 공고에 대한 메모를 남겨보세요
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="메모 내용을 입력하세요"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemoDialog(false)}>
              취소
            </Button>
            <Button onClick={handleMemoSave} disabled={isLoading}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 새 폴더 다이얼로그 */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 폴더 만들기</DialogTitle>
            <DialogDescription>
              공고를 분류할 폴더를 만들어 보세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>폴더 이름</Label>
              <Input
                placeholder="폴더 이름"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div>
              <Label>색상</Label>
              <div className="flex gap-2 mt-2">
                {Object.entries(folderColors).map(([color, className]) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'h-8 w-8 rounded-full transition-transform',
                      className,
                      newFolderColor === color && 'ring-2 ring-offset-2 ring-primary scale-110'
                    )}
                    onClick={() => setNewFolderColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreateFolder} disabled={isLoading || !newFolderName.trim()}>
              만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
