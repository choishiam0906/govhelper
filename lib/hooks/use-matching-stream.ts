'use client'

import { useState, useCallback } from 'react'
import { MatchAnalysis } from '@/types'

interface MatchingStreamState {
  isStreaming: boolean
  progress: number
  message: string
  analysis: MatchAnalysis | null
  matchId: string | null
  error: string | null
}

interface UseMatchingStreamOptions {
  onStart?: () => void
  onProgress?: (progress: number) => void
  onComplete?: (matchId: string, analysis: MatchAnalysis) => void
  onError?: (error: string) => void
}

export function useMatchingStream(options: UseMatchingStreamOptions = {}) {
  const [state, setState] = useState<MatchingStreamState>({
    isStreaming: false,
    progress: 0,
    message: '',
    analysis: null,
    matchId: null,
    error: null,
  })

  const startAnalysis = useCallback(async (
    announcementId: string,
    companyId: string,
    businessPlanId?: string
  ) => {
    setState({
      isStreaming: true,
      progress: 0,
      message: 'AI 분석을 준비하고 있어요...',
      analysis: null,
      matchId: null,
      error: null,
    })

    options.onStart?.()

    try {
      const response = await fetch('/api/matching/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId,
          companyId,
          businessPlanId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '요청에 실패했어요')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('스트리밍을 시작할 수 없어요')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'start') {
                setState(prev => ({
                  ...prev,
                  message: data.message,
                  progress: 5,
                }))
              } else if (data.type === 'chunk') {
                setState(prev => ({
                  ...prev,
                  progress: data.progress,
                  message: 'AI가 분석 중이에요...',
                }))
                options.onProgress?.(data.progress)
              } else if (data.type === 'complete') {
                setState(prev => ({
                  ...prev,
                  isStreaming: false,
                  progress: 100,
                  message: '분석이 완료됐어요!',
                  analysis: data.analysis,
                  matchId: data.matchId,
                }))
                options.onComplete?.(data.matchId, data.analysis)
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (parseError) {
              // JSON 파싱 실패 시 에러 확인
              if (parseError instanceof Error && parseError.message !== 'Unexpected end of JSON input') {
                throw parseError
              }
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했어요'
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
        message: errorMessage,
      }))
      options.onError?.(errorMessage)
    }
  }, [options])

  const reset = useCallback(() => {
    setState({
      isStreaming: false,
      progress: 0,
      message: '',
      analysis: null,
      matchId: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    startAnalysis,
    reset,
  }
}
