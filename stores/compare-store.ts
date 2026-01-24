import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CompareAnnouncement {
  id: string
  title: string
  organization: string | null
  category: string | null
  support_type: string | null
  support_amount: string | null
  application_end: string | null
  source: string
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
