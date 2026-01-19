'use client'

import { useState, useCallback } from 'react'

interface SectionProgress {
  sectionIndex: number
  sectionName: string
  content: string
  isComplete: boolean
}

interface ApplicationStreamState {
  isStreaming: boolean
  progress: number
  message: string
  currentSection: number
  sections: SectionProgress[]
  applicationId: string | null
  error: string | null
}

interface UseApplicationStreamOptions {
  onStart?: () => void
  onSectionStart?: (sectionIndex: number, sectionName: string) => void
  onSectionComplete?: (sectionIndex: number, sectionName: string, content: string) => void
  onComplete?: (applicationId: string) => void
  onError?: (error: string) => void
}

const SECTION_NAMES = ['사업 개요', '기술 현황', '시장 분석', '사업화 전략', '기대 효과']

export function useApplicationStream(options: UseApplicationStreamOptions = {}) {
  const [state, setState] = useState<ApplicationStreamState>({
    isStreaming: false,
    progress: 0,
    message: '',
    currentSection: -1,
    sections: SECTION_NAMES.map((name, index) => ({
      sectionIndex: index,
      sectionName: name,
      content: '',
      isComplete: false,
    })),
    applicationId: null,
    error: null,
  })

  const startGeneration = useCallback(async (matchId: string) => {
    setState({
      isStreaming: true,
      progress: 0,
      message: 'AI가 지원서 작성을 준비하고 있어요...',
      currentSection: -1,
      sections: SECTION_NAMES.map((name, index) => ({
        sectionIndex: index,
        sectionName: name,
        content: '',
        isComplete: false,
      })),
      applicationId: null,
      error: null,
    })

    options.onStart?.()

    try {
      const response = await fetch('/api/applications/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        // 이미 지원서가 있는 경우 특별 처리
        if (errorData.existingId) {
          setState(prev => ({
            ...prev,
            isStreaming: false,
            applicationId: errorData.existingId,
            message: '이미 작성된 지원서가 있어요',
          }))
          return
        }
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
              } else if (data.type === 'section_start') {
                setState(prev => ({
                  ...prev,
                  currentSection: data.sectionIndex,
                  message: `${data.sectionName} 작성 중...`,
                  progress: data.progress,
                }))
                options.onSectionStart?.(data.sectionIndex, data.sectionName)
              } else if (data.type === 'chunk') {
                setState(prev => ({
                  ...prev,
                  sections: prev.sections.map((s, i) =>
                    i === data.sectionIndex
                      ? { ...s, content: s.content + data.chunk }
                      : s
                  ),
                }))
              } else if (data.type === 'section_complete') {
                setState(prev => ({
                  ...prev,
                  sections: prev.sections.map((s, i) =>
                    i === data.sectionIndex
                      ? { ...s, content: data.content, isComplete: true }
                      : s
                  ),
                  progress: data.progress,
                  message: `${data.sectionName} 완료`,
                }))
                options.onSectionComplete?.(data.sectionIndex, data.sectionName, data.content)
              } else if (data.type === 'complete') {
                setState(prev => ({
                  ...prev,
                  isStreaming: false,
                  progress: 100,
                  message: '지원서 작성이 완료됐어요!',
                  applicationId: data.applicationId,
                }))
                options.onComplete?.(data.applicationId)
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
      const errorMessage = error instanceof Error ? error.message : 'AI 지원서 작성 중 오류가 발생했어요'
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
      currentSection: -1,
      sections: SECTION_NAMES.map((name, index) => ({
        sectionIndex: index,
        sectionName: name,
        content: '',
        isComplete: false,
      })),
      applicationId: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    startGeneration,
    reset,
  }
}
