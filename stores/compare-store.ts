import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EvaluationCriteria } from '@/types/evaluation'

// 자격조건 타입 (eligibility_criteria)
export interface EligibilityCriteria {
  companyTypes?: string[]
  employeeCount?: { min: number | null; max: number | null; description?: string } | null
  revenue?: { min: number | null; max: number | null; description?: string } | null
  businessAge?: { min: number | null; max: number | null; description?: string } | null
  industries?: { included: string[]; excluded: string[]; description?: string }
  regions?: { included: string[]; excluded: string[]; description?: string }
  requiredCertifications?: string[]
  additionalRequirements?: string[]
  exclusions?: string[]
  summary?: string
}

export interface CompareAnnouncement {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_end: string | null
  application_start?: string | null  // optional - 비교 추가 시 항상 있지 않음
  source: string
  // 확장 필드 (상세 정보 로드 후 추가됨)
  eligibility_criteria?: EligibilityCriteria | null
  evaluation_criteria?: EvaluationCriteria | null
  description?: string | null
}

interface CompareStore {
  announcements: CompareAnnouncement[]
  addAnnouncement: (announcement: CompareAnnouncement) => boolean
  removeAnnouncement: (id: string) => void
  clearAll: () => void
  isInCompare: (id: string) => boolean
}

const MAX_COMPARE_ITEMS = 3

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      announcements: [],

      addAnnouncement: (announcement) => {
        const { announcements } = get()

        // 이미 추가된 공고인지 확인
        if (announcements.some((a) => a.id === announcement.id)) {
          return false
        }

        // 최대 3개까지만 추가 가능
        if (announcements.length >= MAX_COMPARE_ITEMS) {
          return false
        }

        set({ announcements: [...announcements, announcement] })
        return true
      },

      removeAnnouncement: (id) => {
        set((state) => ({
          announcements: state.announcements.filter((a) => a.id !== id),
        }))
      },

      clearAll: () => {
        set({ announcements: [] })
      },

      isInCompare: (id) => {
        return get().announcements.some((a) => a.id === id)
      },
    }),
    {
      name: 'compare-announcements',
    }
  )
)
