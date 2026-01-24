'use client'

import { useEffect, useCallback, useRef } from 'react'
import { UseFormReturn, FieldValues } from 'react-hook-form'
import { toast } from 'sonner'

interface UseFormAutosaveOptions<T extends FieldValues> {
  /** react-hook-form의 form 객체 */
  form: UseFormReturn<T>
  /** 저장 키 (localStorage 키) */
  storageKey: string
  /** 자동 저장 간격 (ms), 기본값 5000ms (5초) */
  debounceMs?: number
  /** 저장 시 알림 표시 여부, 기본값 false */
  showToast?: boolean
  /** 폼이 dirty 상태일 때만 저장할지 여부, 기본값 true */
  onlyWhenDirty?: boolean
  /** 제외할 필드 이름 목록 */
  excludeFields?: string[]
}

interface AutosaveState<T> {
  data: Partial<T>
  savedAt: string
}

/**
 * 폼 자동 저장 훅
 *
 * 사용 예시:
 * ```tsx
 * const form = useForm<FormData>()
 *
 * const { clearSavedData, hasSavedData } = useFormAutosave({
 *   form,
 *   storageKey: 'company-form-draft',
 *   debounceMs: 3000,
 * })
 * ```
 */
export function useFormAutosave<T extends FieldValues>({
  form,
  storageKey,
  debounceMs = 5000,
  showToast = false,
  onlyWhenDirty = true,
  excludeFields = [],
}: UseFormAutosaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isRestoredRef = useRef(false)

  // 저장된 데이터 가져오기
  const getSavedData = useCallback((): AutosaveState<T> | null => {
    if (typeof window === 'undefined') return null

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        return JSON.parse(saved) as AutosaveState<T>
      }
    } catch (error) {
      console.error('[Autosave] Failed to get saved data:', error)
    }
    return null
  }, [storageKey])

  // 데이터 저장하기
  const saveData = useCallback(() => {
    if (typeof window === 'undefined') return

    const values = form.getValues()

    // 제외 필드 처리
    const dataToSave = { ...values }
    excludeFields.forEach((field) => {
      delete (dataToSave as Record<string, unknown>)[field]
    })

    // 빈 데이터는 저장하지 않음
    const hasData = Object.values(dataToSave).some(
      (v) => v !== null && v !== undefined && v !== ''
    )
    if (!hasData) return

    try {
      const state: AutosaveState<T> = {
        data: dataToSave,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(storageKey, JSON.stringify(state))

      if (showToast) {
        toast.success('임시 저장됐어요', {
          duration: 2000,
          position: 'bottom-right',
        })
      }
    } catch (error) {
      console.error('[Autosave] Failed to save data:', error)
    }
  }, [form, storageKey, excludeFields, showToast])

  // 저장된 데이터 삭제
  const clearSavedData = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('[Autosave] Failed to clear saved data:', error)
    }
  }, [storageKey])

  // 저장된 데이터 복원
  const restoreSavedData = useCallback(() => {
    const saved = getSavedData()
    if (saved && !isRestoredRef.current) {
      isRestoredRef.current = true

      // 폼에 데이터 복원
      Object.entries(saved.data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setValue(key as any, value as any, {
            shouldDirty: false,
            shouldValidate: false,
          })
        }
      })

      return true
    }
    return false
  }, [form, getSavedData])

  // 저장된 데이터 존재 여부
  const hasSavedData = useCallback(() => {
    return getSavedData() !== null
  }, [getSavedData])

  // 저장 시간 포맷
  const getSavedAtFormatted = useCallback(() => {
    const saved = getSavedData()
    if (saved) {
      return new Date(saved.savedAt).toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    return null
  }, [getSavedData])

  // 폼 값 변경 감지 및 자동 저장
  useEffect(() => {
    const subscription = form.watch(() => {
      // dirty 상태 체크
      if (onlyWhenDirty && !form.formState.isDirty) {
        return
      }

      // 디바운스 처리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        saveData()
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [form, debounceMs, onlyWhenDirty, saveData])

  // 페이지 이탈 시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (form.formState.isDirty) {
        saveData()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [form, saveData])

  return {
    /** 저장된 데이터 삭제 */
    clearSavedData,
    /** 저장된 데이터 복원 */
    restoreSavedData,
    /** 저장된 데이터 존재 여부 */
    hasSavedData,
    /** 저장 시간 (포맷됨) */
    getSavedAtFormatted,
    /** 수동 저장 */
    saveNow: saveData,
  }
}
