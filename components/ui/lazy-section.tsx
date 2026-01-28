'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface LazySectionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
}

/**
 * Intersection Observer 기반 Lazy Loading 컴포넌트
 *
 * 사용 예시:
 * <LazySection fallback={<Skeleton />}>
 *   <HeavyComponent />
 * </LazySection>
 */
export function LazySection({
  children,
  fallback = null,
  className,
  threshold = 0.1,
  rootMargin = '50px',
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // 한 번 로드되면 observer 해제
          if (ref.current) {
            observer.unobserve(ref.current)
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, rootMargin])

  return (
    <div ref={ref} className={cn(className)}>
      {isVisible ? children : fallback}
    </div>
  )
}
