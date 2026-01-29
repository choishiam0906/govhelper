-- 매칭 피드백 테이블
CREATE TABLE IF NOT EXISTS match_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 전체 정확도 평가
  accuracy_rating SMALLINT NOT NULL CHECK (accuracy_rating BETWEEN 1 AND 5),
  -- 점수가 실제보다 높았는지/낮았는지
  score_direction TEXT CHECK (score_direction IN ('accurate', 'too_high', 'too_low')),
  -- 실제 지원 결과 (나중에 업데이트 가능)
  actual_outcome TEXT CHECK (actual_outcome IN ('applied', 'approved', 'rejected', 'not_applied')),
  -- 자유 의견
  comment TEXT,
  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(match_id, user_id)
);

CREATE INDEX idx_match_feedback_user ON match_feedback(user_id);
CREATE INDEX idx_match_feedback_match ON match_feedback(match_id);
CREATE INDEX idx_match_feedback_rating ON match_feedback(accuracy_rating);

-- RLS
ALTER TABLE match_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "사용자는 자기 피드백만 관리" ON match_feedback
  FOR ALL USING (auth.uid() = user_id);
