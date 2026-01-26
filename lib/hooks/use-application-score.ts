import { useState, useCallback, useRef, useEffect } from 'react'
import { ApplicationScoreFeedback } from '@/types'

interface ScoreResult {
  success: boolean
  totalEstimatedScore: number
  totalMaxScore: number
  percentage: number
  sectionScores: ApplicationScoreFeedback[]
  overallFeedback: string
  error?: string
}

interface UseApplicationScoreOptions {
  debounceMs?: number
  minContentLength?: number
}

interface UseApplicationScoreReturn {
  score: ScoreResult | null
  isLoading: boolean
  error: string | null
  analyzeScore: (
    announcementId: string,
    sections: { section: string; content: string }[]
  ) => void
  reset: () => void
}

export function useApplicationScore(
  options: UseApplicationScoreOptions = {}
): UseApplicationScoreReturn {
  const { debounceMs = 2000, minContentLength = 50 } = options

  const [score, setScore] = useState<ScoreResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const analyzeScore = useCallback(
    (announcementId: string, sections: { section: string; content: string }[]) => {
      // 이전 타이머 취소
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 이전 요청 취소
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 최소 내용 길이 체크
      const totalContent = sections.reduce((acc, s) => acc + (s.content || '').length, 0)
      if (totalContent < minContentLength) {
        setScore(null)
        return
      }

      // 디바운스 적용
      timeoutRef.current = setTimeout(async () => {
        setIsLoading(true)
        setError(null)

        const controller = new AbortController()
        abortControllerRef.current = controller

        try {
          const response = await fetch('/api/applications/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ announcementId, sections }),
            signal: controller.signal,
          })

          if (!response.ok) {
            throw new Error('점수 분석에 실패했어요')
          }

          const result: ScoreResult = await response.json()

          if (result.success) {
            setScore(result)
          } else {
            setError(result.error || '점수 분석에 실패했어요')
          }
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            setError((err as Error).message)
          }
        } finally {
          setIsLoading(false)
        }
      }, debounceMs)
    },
    [debounceMs, minContentLength]
  )

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setScore(null)
    setError(null)
    setIsLoading(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    score,
    isLoading,
    error,
    analyzeScore,
    reset,
  }
}
