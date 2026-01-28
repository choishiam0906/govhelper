'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Search,
  TrendingUp,
  FileText,
  Building2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react'

// 튜토리얼 스텝 정의
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'GovHelper에 오신 것을 환영해요!',
    description:
      'AI가 우리 기업에 딱 맞는 정부지원사업을 찾아드려요. 잠깐 시간을 내어 주요 기능을 알아볼까요?',
    icon: Sparkles,
    highlight: null,
  },
  {
    id: 'search',
    title: '공고 검색',
    description:
      '중소벤처24, 기업마당, K-Startup, 나라장터 등 4곳의 공고를 한 곳에서 검색할 수 있어요. AI 시맨틱 검색으로 원하는 공고를 빠르게 찾아보세요.',
    icon: Search,
    highlight: '[data-tutorial="search"]',
  },
  {
    id: 'matching',
    title: 'AI 매칭 분석',
    description:
      '기업 정보를 바탕으로 공고와의 적합도를 AI가 분석해 드려요. 지원 자격, 지원금액, 경쟁률까지 한눈에 확인할 수 있어요.',
    icon: TrendingUp,
    highlight: '[data-tutorial="matching"]',
  },
  {
    id: 'application',
    title: 'AI 지원서 작성',
    description:
      '공고 요구사항에 맞는 지원서 초안을 AI가 작성해 드려요. 섹션별 개선 기능으로 완성도를 높여보세요.',
    icon: FileText,
    highlight: '[data-tutorial="application"]',
  },
  {
    id: 'profile',
    title: '기업 프로필 설정',
    description:
      '정확한 기업 정보를 입력할수록 AI 매칭 정확도가 높아져요. 프로필 페이지에서 기업 정보를 완성해 주세요.',
    icon: Building2,
    highlight: null,
  },
]

interface TutorialContextType {
  isOpen: boolean
  currentStep: number
  totalSteps: number
  startTutorial: () => void
  endTutorial: () => void
  nextStep: () => void
  prevStep: () => void
  skipTutorial: () => void
  hasCompletedTutorial: boolean
}

const TutorialContext = createContext<TutorialContextType | null>(null)

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider')
  }
  return context
}

const TUTORIAL_STORAGE_KEY = 'govhelper-tutorial-completed'

interface TutorialProviderProps {
  children: ReactNode
  autoStart?: boolean
}

export function TutorialProvider({ children, autoStart = true }: TutorialProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(true)

  // localStorage에서 완료 여부 확인
  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    setHasCompletedTutorial(completed === 'true')

    // 자동 시작 (첫 방문자)
    if (autoStart && completed !== 'true') {
      // 약간의 딜레이 후 시작 (페이지 로딩 완료 대기)
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [autoStart])

  // 하이라이트 효과
  useEffect(() => {
    if (!isOpen) return

    const step = TUTORIAL_STEPS[currentStep]
    if (!step.highlight) return

    const element = document.querySelector(step.highlight)
    if (element) {
      element.classList.add('tutorial-highlight')
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return () => {
      if (element) {
        element.classList.remove('tutorial-highlight')
      }
    }
  }, [isOpen, currentStep])

  const startTutorial = () => {
    setCurrentStep(0)
    setIsOpen(true)
  }

  const endTutorial = () => {
    setIsOpen(false)
    setCurrentStep(0)
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true')
    setHasCompletedTutorial(true)
  }

  const skipTutorial = () => {
    endTutorial()
  }

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      endTutorial()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const step = TUTORIAL_STEPS[currentStep]
  const StepIcon = step.icon
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1

  return (
    <TutorialContext.Provider
      value={{
        isOpen,
        currentStep,
        totalSteps: TUTORIAL_STEPS.length,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        skipTutorial,
        hasCompletedTutorial,
      }}
    >
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => !open && skipTutorial()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <StepIcon className="h-6 w-6 text-primary" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipTutorial}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogTitle className="text-xl mt-4">{step.title}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {step.description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} / {TUTORIAL_STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              variant="ghost"
              onClick={skipTutorial}
              className="text-muted-foreground"
            >
              건너뛰기
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={prevStep}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  이전
                </Button>
              )}
              <Button onClick={nextStep}>
                {isLastStep ? (
                  '시작하기'
                ) : (
                  <>
                    다음
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 하이라이트 스타일 */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 10;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3),
            0 0 20px 8px hsl(var(--primary) / 0.15);
          border-radius: var(--radius);
          transition: box-shadow 0.3s ease;
        }
      `}</style>
    </TutorialContext.Provider>
  )
}
