'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface AIChatbotProps {
  /** 현재 보고 있는 공고 정보 (선택) */
  currentAnnouncement?: {
    title: string
    organization: string
    content?: string
  }
}

export function AIChatbot({ currentAnnouncement }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 스크롤을 맨 아래로
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [])

  // 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 채팅창 열릴 때 초기 메시지
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: '안녕하세요! 정부지원사업 전문 상담사예요. 궁금한 점이 있으시면 편하게 물어봐주세요. 😊\n\n• 공고 검색 및 추천\n• 지원자격 확인\n• 지원서 작성 도움\n• 매칭 결과 해석',
        },
      ])
    }
  }, [isOpen, messages.length])

  // 메시지 전송
  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // AI 응답 메시지 추가 (스트리밍용)
    const assistantMessageId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      },
    ])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          context: currentAnnouncement
            ? {
                currentAnnouncement: `${currentAnnouncement.title} (${currentAnnouncement.organization})`,
              }
            : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('응답 오류')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('스트림 읽기 실패')
      }

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              // 스트리밍 완료
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              )
              continue
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                accumulatedContent += parsed.text
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                )
              }
              if (parsed.error) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: parsed.error, isStreaming: false }
                      : msg
                  )
                )
              }
            } catch {
              // JSON 파싱 실패 무시
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: '죄송해요, 응답을 생성하는 중 오류가 발생했어요. 다시 시도해주세요.',
                isStreaming: false,
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
          size="icon"
          aria-label="AI 상담사에게 질문하기"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* 채팅창 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] rounded-2xl border bg-background shadow-2xl flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-medium">AI 상담사</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsOpen(false)}
                aria-label="최소화"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => {
                  setIsOpen(false)
                  setMessages([])
                }}
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 h-[400px]">
            <div className="p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted rounded-bl-none'
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                      )}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* 입력 영역 */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="질문을 입력하세요..."
                className="min-h-[44px] max-h-[120px] resize-none"
                disabled={isLoading}
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0"
                aria-label="전송"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI 상담사는 참고용이에요. 정확한 정보는 공고를 확인해주세요.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
