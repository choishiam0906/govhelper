'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 업종 목록
const industries = [
  { value: 'software', label: 'SW 개발' },
  { value: 'ai', label: 'AI/빅데이터' },
  { value: 'biotech', label: '바이오/의료' },
  { value: 'manufacturing', label: '제조업' },
  { value: 'commerce', label: '유통/커머스' },
  { value: 'fintech', label: '핀테크' },
  { value: 'contents', label: '콘텐츠/미디어' },
  { value: 'education', label: '에듀테크' },
  { value: 'energy', label: '에너지/환경' },
  { value: 'other', label: '기타' },
]

// 지역 목록
const locations = [
  { value: 'seoul', label: '서울' },
  { value: 'gyeonggi', label: '경기' },
  { value: 'incheon', label: '인천' },
  { value: 'busan', label: '부산' },
  { value: 'daegu', label: '대구' },
  { value: 'daejeon', label: '대전' },
  { value: 'gwangju', label: '광주' },
  { value: 'ulsan', label: '울산' },
  { value: 'sejong', label: '세종' },
  { value: 'gangwon', label: '강원' },
  { value: 'chungbuk', label: '충북' },
  { value: 'chungnam', label: '충남' },
  { value: 'jeonbuk', label: '전북' },
  { value: 'jeonnam', label: '전남' },
  { value: 'gyeongbuk', label: '경북' },
  { value: 'gyeongnam', label: '경남' },
  { value: 'jeju', label: '제주' },
]

interface CompanyFormDetailsProps {
  register: any
  setValue: any
  watch: any
}

export function CompanyFormDetails({ register, setValue, watch }: CompanyFormDetailsProps) {

  return (
    <div className="space-y-4">
      {/* 업종 */}
      <div className="space-y-2">
        <Label>업종</Label>
        <Select
          value={watch('industry') || ''}
          onValueChange={(value) => setValue('industry', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="업종 선택" />
          </SelectTrigger>
          <SelectContent>
            {industries.map((industry) => (
              <SelectItem key={industry.value} value={industry.value}>
                {industry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 설립일 & 직원수 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="foundedDate">설립일</Label>
          <Input
            id="foundedDate"
            type="date"
            {...register('foundedDate')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employeeCount">직원 수</Label>
          <Input
            id="employeeCount"
            type="number"
            placeholder="0"
            {...register('employeeCount')}
          />
        </div>
      </div>

      {/* 소재지 */}
      <div className="space-y-2">
        <Label>소재지</Label>
        <Select
          value={watch('location') || ''}
          onValueChange={(value) => setValue('location', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="지역 선택" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.value} value={location.value}>
                {location.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 연 매출 */}
      <div className="space-y-2">
        <Label htmlFor="annualRevenue">연 매출 (만원)</Label>
        <Input
          id="annualRevenue"
          type="text"
          placeholder="예: 50000 (5억원)"
          {...register('annualRevenue')}
        />
      </div>
    </div>
  )
}
