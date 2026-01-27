'use client'

import { useState, useCallback } from 'react'
import type {
  BusinessLookupResult,
  BusinessLookupOptions,
  UnifiedBusinessInfo,
} from '@/lib/business/types'

interface UseBusinessLookupReturn {
  // 조회 상태
  isLoading: boolean
  error: string | null

  // 조회 결과
  result: BusinessLookupResult | null
  data: UnifiedBusinessInfo | null

  // 조회 함수
  lookupByBusinessNumber: (
    businessNumber: string,
    options?: Partial<BusinessLookupOptions>
  ) => Promise<BusinessLookupResult>

  // 검색 함수
  searchByName: (
    companyName: string,
    limit?: number
  ) => Promise<UnifiedBusinessInfo[]>

  // 유효성 검사
  validateBusinessNumber: (businessNumber: string) => boolean

  // 상태 초기화
  reset: () => void
}

/**
 * 통합 기업정보 조회 React Hook
 *
 * @example
 * const { lookupByBusinessNumber, data, isLoading, error } = useBusinessLookup()
 *
 * const handleSubmit = async (businessNumber: string) => {
 *   const result = await lookupByBusinessNumber(businessNumber)
 *   if (result.success) {
 *     // 기업 정보 사용
 *   }
 * }
 */
export function useBusinessLookup(): UseBusinessLookupReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BusinessLookupResult | null>(null)

  /**
   * 사업자번호로 기업정보 조회
   */
  const lookupByBusinessNumber = useCallback(
    async (
      businessNumber: string,
      options?: Partial<BusinessLookupOptions>
    ): Promise<BusinessLookupResult> => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/business/unified-lookup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            businessNumber,
            options,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          const errorResult: BusinessLookupResult = {
            success: false,
            data: null,
            error: data.error || '조회 중 오류가 발생했습니다.',
          }
          setError(errorResult.error || null)
          setResult(errorResult)
          return errorResult
        }

        setResult(data)
        return data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.'
        const errorResult: BusinessLookupResult = {
          success: false,
          data: null,
          error: errorMessage,
        }
        setError(errorMessage)
        setResult(errorResult)
        return errorResult
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * 회사명으로 기업 검색
   */
  const searchByName = useCallback(
    async (
      companyName: string,
      limit: number = 10
    ): Promise<UnifiedBusinessInfo[]> => {
      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          name: companyName,
          limit: limit.toString(),
        })

        const response = await fetch(`/api/business/unified-lookup?${params}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || '검색 중 오류가 발생했습니다.')
          return []
        }

        return data.results || []
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.'
        setError(errorMessage)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * 사업자번호 유효성 검사 (프론트엔드용)
   */
  const validateBusinessNumber = useCallback((businessNumber: string): boolean => {
    // 하이픈 제거
    const formatted = businessNumber.replace(/[^0-9]/g, '')

    if (formatted.length !== 10) return false

    // 체크섬 검증 (한국 사업자등록번호 검증 알고리즘)
    const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
    let sum = 0

    for (let i = 0; i < 9; i++) {
      sum += parseInt(formatted[i]) * weights[i]
    }

    sum += Math.floor((parseInt(formatted[8]) * 5) / 10)
    const checkDigit = (10 - (sum % 10)) % 10

    return checkDigit === parseInt(formatted[9])
  }, [])

  /**
   * 상태 초기화
   */
  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setResult(null)
  }, [])

  return {
    isLoading,
    error,
    result,
    data: result?.data || null,
    lookupByBusinessNumber,
    searchByName,
    validateBusinessNumber,
    reset,
  }
}

/**
 * 사업자번호 포맷팅 (123-45-67890 형식)
 */
export function formatBusinessNumberDisplay(businessNumber: string): string {
  const formatted = businessNumber.replace(/[^0-9]/g, '')
  if (formatted.length !== 10) return businessNumber

  return `${formatted.slice(0, 3)}-${formatted.slice(3, 5)}-${formatted.slice(5)}`
}

/**
 * 사업자 상태에 따른 색상 반환
 */
export function getBusinessStatusColor(status: string | null): string {
  switch (status) {
    case '계속사업자':
      return 'text-green-600'
    case '휴업자':
      return 'text-yellow-600'
    case '폐업자':
      return 'text-red-600'
    default:
      return 'text-gray-500'
  }
}

/**
 * 상장 시장에 따른 배지 색상 반환
 */
export function getStockMarketBadgeColor(market: string): string {
  switch (market) {
    case '유가증권시장':
      return 'bg-blue-100 text-blue-800'
    case '코스닥':
      return 'bg-purple-100 text-purple-800'
    case '코넥스':
      return 'bg-green-100 text-green-800'
    case '비상장':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
