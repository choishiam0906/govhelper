'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Star, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'

interface MatchFeedbackProps {
  matchId: string
}

export function MatchFeedback({ matchId }: MatchFeedbackProps) {
  const [rating, setRating] = useState<number>(0)
  const [direction, setDirection] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [existing, setExisting] = useState(false)

  // 기존 피드백 로드
  useEffect(() => {
    fetch(`/api/matching/${matchId}/feedback`)
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setRating(res.data.accuracy_rating)
          setDirection(res.data.score_direction)
          setOutcome(res.data.actual_outcome)
          setComment(res.data.comment || '')
          setExisting(true)
        }
      })
      .catch(() => {})
  }, [matchId])

  const handleSubmit = async () => {
    if (rating === 0) return
    setLoading(true)
    try {
      const res = await fetch(`/api/matching/${matchId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accuracyRating: rating,
          scoreDirection: direction,
          actualOutcome: outcome,
          comment: comment || null,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
        setExisting(true)
      }
    } catch {
      // 무시
    } finally {
      setLoading(false)
    }
  }

  if (submitted && !existing) {
    return (
      <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/20">
        <p className="text-sm text-green-700 dark:text-green-400">피드백을 저장했어요. 매칭 정확도 개선에 활용할게요!</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="font-semibold text-sm">매칭 결과가 정확했나요?</h3>

      {/* 별점 */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="p-0.5"
          >
            <Star
              className={`h-5 w-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {rating === 0 ? '평가해주세요' : `${rating}점`}
        </span>
      </div>

      {/* 점수 방향 */}
      {rating > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">점수가 실제와 비교했을 때</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={direction === 'too_high' ? 'default' : 'outline'}
              onClick={() => setDirection('too_high')}
              className="text-xs"
            >
              <ThumbsDown className="h-3 w-3 mr-1" />
              높게 나왔어요
            </Button>
            <Button
              size="sm"
              variant={direction === 'accurate' ? 'default' : 'outline'}
              onClick={() => setDirection('accurate')}
              className="text-xs"
            >
              <Minus className="h-3 w-3 mr-1" />
              적절해요
            </Button>
            <Button
              size="sm"
              variant={direction === 'too_low' ? 'default' : 'outline'}
              onClick={() => setDirection('too_low')}
              className="text-xs"
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              낮게 나왔어요
            </Button>
          </div>
        </div>
      )}

      {/* 실제 결과 */}
      {rating > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">실제 지원 결과 (선택)</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'not_applied', label: '미지원' },
              { value: 'applied', label: '지원함' },
              { value: 'approved', label: '선정됨' },
              { value: 'rejected', label: '탈락함' },
            ].map(opt => (
              <Button
                key={opt.value}
                size="sm"
                variant={outcome === opt.value ? 'default' : 'outline'}
                onClick={() => setOutcome(opt.value)}
                className="text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 제출 */}
      {rating > 0 && (
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full"
        >
          {loading ? '저장 중...' : existing ? '피드백 수정하기' : '피드백 보내기'}
        </Button>
      )}
    </div>
  )
}
