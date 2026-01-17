'use client'

import { useState, useCallback } from 'react'

interface StreamingState {
  isStreaming: boolean
  content: string
  error: string | null
}

interface UseStreamingOptions {
  onChunk?: (chunk: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: string) => void
}

export function useStreaming(options: UseStreamingOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    error: null,
  })

  const startStream = useCallback(async (
    url: string,
    body: Record<string, unknown>
  ) => {
    setState({ isStreaming: true, content: '', error: null })

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.error) {
                throw new Error(data.error)
              }

              if (data.chunk) {
                fullContent += data.chunk
                setState(prev => ({
                  ...prev,
                  content: fullContent,
                }))
                options.onChunk?.(data.chunk)
              }

              if (data.done) {
                setState(prev => ({
                  ...prev,
                  isStreaming: false,
                }))
                options.onComplete?.(data.fullContent || fullContent)
              }
            } catch (parseError) {
              // JSON 파싱 실패 시 무시 (불완전한 청크일 수 있음)
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI 처리 중 오류가 발생했어요'
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: errorMessage,
      }))
      options.onError?.(errorMessage)
    }
  }, [options])

  const reset = useCallback(() => {
    setState({ isStreaming: false, content: '', error: null })
  }, [])

  return {
    ...state,
    startStream,
    reset,
  }
}
