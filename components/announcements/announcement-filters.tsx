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
import { Badge } from '@/components/ui/badge'
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Coins,
  Users,
  Calendar,
  Filter
} from 'lucide-react'

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
  { value: 'smes', label: '중소벤처24' },
  { value: 'g2b', label: '나라장터' },
]

// 지원금액 범위
const amountRanges = [
  { value: 'all', label: '전체 금액' },
  { value: '0-10000000', label: '1천만원 이하', min: 0, max: 10000000 },
  { value: '10000000-50000000', label: '1천만~5천만원', min: 10000000, max: 50000000 },
  { value: '50000000-100000000', label: '5천만~1억원', min: 50000000, max: 100000000 },
  { value: '100000000-500000000', label: '1억~5억원', min: 100000000, max: 500000000 },
  { value: '500000000-', label: '5억원 이상', min: 500000000, max: null },
]

// 직원수 조건
const employeeRanges = [
  { value: 'all', label: '전체 직원수' },
  { value: '1-10', label: '10인 이하', max: 10 },
  { value: '1-50', label: '50인 이하', max: 50 },
  { value: '1-100', label: '100인 이하', max: 100 },
  { value: '1-300', label: '300인 이하 (중소기업)', max: 300 },
  { value: '300-', label: '300인 초과', min: 300 },
]

// 마감일 범위
const deadlineRanges = [
  { value: 'all', label: '전체 마감일' },
  { value: '7', label: '7일 이내 마감', days: 7 },
  { value: '14', label: '14일 이내 마감', days: 14 },
  { value: '30', label: '30일 이내 마감', days: 30 },
  { value: '60', label: '60일 이내 마감', days: 60 },
  { value: 'ongoing', label: '상시 모집', ongoing: true },
]

export function AnnouncementFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  // 활성화된 필터 개수 계산
  const activeFilters = [
    searchParams.get('search'),
    searchParams.get('category'),
    searchParams.get('supportType'),
    searchParams.get('source'),
    searchParams.get('amount'),
    searchParams.get('employees'),
    searchParams.get('deadline'),
  ].filter(Boolean)

  const hasFilters = activeFilters.length > 0

  // 고급 필터 사용 여부
  const hasAdvancedFilters =
    searchParams.get('amount') ||
    searchParams.get('employees') ||
    searchParams.get('deadline')

  // 필터 라벨 가져오기
  const getFilterLabel = (key: string, value: string) => {
    switch (key) {
      case 'category':
        return categories.find(c => c.value === value)?.label
      case 'supportType':
        return supportTypes.find(t => t.value === value)?.label
      case 'source':
        return sources.find(s => s.value === value)?.label
      case 'amount':
        return amountRanges.find(a => a.value === value)?.label
      case 'employees':
        return employeeRanges.find(e => e.value === value)?.label
      case 'deadline':
        return deadlineRanges.find(d => d.value === value)?.label
      default:
        return value
    }
  }

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

      {/* 기본 필터 */}
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

        {/* 고급 필터 토글 버튼 */}
        <Button
          variant={hasAdvancedFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="h-10"
        >
          <Filter className="h-4 w-4 mr-1.5" />
          상세 필터
          {hasAdvancedFilters && (
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 bg-primary text-primary-foreground">
              {[searchParams.get('amount'), searchParams.get('employees'), searchParams.get('deadline')].filter(Boolean).length}
            </Badge>
          )}
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-1" />
          )}
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
            <X className="h-4 w-4 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* 고급 필터 (접기/펼치기) */}
      {showAdvanced && (
        <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
            <Filter className="h-4 w-4" />
            상세 필터 조건
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 지원금액 필터 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-primary" />
                지원금액
              </label>
              <Select
                value={searchParams.get('amount') || 'all'}
                onValueChange={(value) => updateFilters('amount', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="금액 범위 선택" />
                </SelectTrigger>
                <SelectContent>
                  {amountRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 직원수 필터 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600" />
                직원수 조건
              </label>
              <Select
                value={searchParams.get('employees') || 'all'}
                onValueChange={(value) => updateFilters('employees', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="직원수 범위 선택" />
                </SelectTrigger>
                <SelectContent>
                  {employeeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 마감일 필터 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-orange-600" />
                마감일
              </label>
              <Select
                value={searchParams.get('deadline') || 'all'}
                onValueChange={(value) => updateFilters('deadline', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="마감일 범위 선택" />
                </SelectTrigger>
                <SelectContent>
                  {deadlineRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* 활성화된 필터 태그 */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {searchParams.get('search') && (
            <Badge variant="secondary" className="gap-1">
              검색: {searchParams.get('search')}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => {
                  setSearch('')
                  updateFilters('search', '')
                }}
              />
            </Badge>
          )}
          {searchParams.get('category') && (
            <Badge variant="secondary" className="gap-1">
              분야: {getFilterLabel('category', searchParams.get('category')!)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilters('category', '')}
              />
            </Badge>
          )}
          {searchParams.get('supportType') && (
            <Badge variant="secondary" className="gap-1">
              유형: {getFilterLabel('supportType', searchParams.get('supportType')!)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilters('supportType', '')}
              />
            </Badge>
          )}
          {searchParams.get('source') && (
            <Badge variant="secondary" className="gap-1">
              출처: {getFilterLabel('source', searchParams.get('source')!)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilters('source', '')}
              />
            </Badge>
          )}
          {searchParams.get('amount') && (
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
              <Coins className="h-3 w-3" />
              {getFilterLabel('amount', searchParams.get('amount')!)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilters('amount', '')}
              />
            </Badge>
          )}
          {searchParams.get('employees') && (
            <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800">
              <Users className="h-3 w-3" />
              {getFilterLabel('employees', searchParams.get('employees')!)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilters('employees', '')}
              />
            </Badge>
          )}
          {searchParams.get('deadline') && (
            <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800">
              <Calendar className="h-3 w-3" />
              {getFilterLabel('deadline', searchParams.get('deadline')!)}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => updateFilters('deadline', '')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
