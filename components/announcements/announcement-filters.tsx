'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, SlidersHorizontal, X } from 'lucide-react'

// 분야 목록
const categories = [
  { value: 'all', label: '전체 분야' },
  { value: '창업', label: '창업' },
  { value: 'R&D', label: 'R&D' },
  { value: '수출', label: '수출' },
  { value: '인력', label: '인력' },
  { value: '금융', label: '금융' },
  { value: '마케팅', label: '마케팅' },
]

// 지원유형 목록
const supportTypes = [
  { value: 'all', label: '전체 유형' },
  { value: '자금', label: '자금' },
  { value: '바우처', label: '바우처' },
  { value: '교육', label: '교육' },
  { value: '컨설팅', label: '컨설팅' },
  { value: '시설', label: '시설/장비' },
]

// 출처 목록
const sources = [
  { value: 'all', label: '전체 출처' },
  { value: 'bizinfo', label: '기업마당' },
  { value: 'kstartup', label: 'K-Startup' },
  { value: 'narajangteo', label: '나라장터' },
  { value: 'datagoKr', label: '공공데이터' },
]

export function AnnouncementFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('search') || '')

  const updateFilters = useCallback(
    (key: string, value: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())

        if (value && value !== 'all') {
          params.set(key, value)
        } else {
          params.delete(key)
        }

        // 필터 변경 시 페이지 초기화
        params.set('page', '1')

        router.push(`/dashboard/announcements?${params.toString()}`)
      })
    },
    [router, searchParams]
  )

  const handleSearch = useCallback(() => {
    updateFilters('search', search)
  }, [search, updateFilters])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/dashboard/announcements')
  }

  const hasFilters =
    searchParams.get('search') ||
    searchParams.get('category') ||
    searchParams.get('supportType') ||
    searchParams.get('source')

  return (
    <div className="space-y-4">
      {/* 검색창 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="공고명, 기관명으로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={isPending}>
          검색
        </Button>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={searchParams.get('category') || 'all'}
          onValueChange={(value) => updateFilters('category', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="분야" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('supportType') || 'all'}
          onValueChange={(value) => updateFilters('supportType', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="지원유형" />
          </SelectTrigger>
          <SelectContent>
            {supportTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('source') || 'all'}
          onValueChange={(value) => updateFilters('source', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="출처" />
          </SelectTrigger>
          <SelectContent>
            {sources.map((src) => (
              <SelectItem key={src.value} value={src.value}>
                {src.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  )
}
