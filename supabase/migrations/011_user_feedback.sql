-- 사용자 피드백 테이블
-- 버그 신고, 기능 요청, 일반 의견 등 사용자 피드백 수집

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 정보 (비로그인 사용자도 가능)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email VARCHAR(255),

  -- 피드백 내용
  type VARCHAR(20) NOT NULL DEFAULT 'general',  -- bug, feature, general, other
  subject VARCHAR(255),
  message TEXT NOT NULL,

  -- 컨텍스트 정보
  page_url TEXT,                    -- 피드백 제출 시 페이지 URL
  user_agent TEXT,                  -- 브라우저 정보

  -- 관리자 처리
  status VARCHAR(20) DEFAULT 'pending',  -- pending, reviewing, resolved, closed
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),

  -- 메타
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks (user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_type ON feedbacks (type);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks (status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks (created_at DESC);

-- RLS 활성화
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- RLS 정책 - 누구나 피드백 제출 가능
CREATE POLICY "Anyone can insert feedback" ON feedbacks
FOR INSERT WITH CHECK (true);

-- RLS 정책 - 본인 피드백만 조회 가능
CREATE POLICY "Users can view own feedback" ON feedbacks
FOR SELECT USING (auth.uid() = user_id);

-- RLS 정책 - 관리자는 모든 피드백 조회/수정 가능
-- (service_role 사용 시 RLS 우회)

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feedback_updated_at ON feedbacks;
CREATE TRIGGER trigger_feedback_updated_at
BEFORE UPDATE ON feedbacks
FOR EACH ROW
EXECUTE FUNCTION update_feedback_updated_at();

-- 테이블 코멘트
COMMENT ON TABLE feedbacks IS '사용자 피드백 (버그 신고, 기능 요청, 의견)';
COMMENT ON COLUMN feedbacks.type IS '피드백 유형: bug(버그), feature(기능요청), general(일반), other(기타)';
COMMENT ON COLUMN feedbacks.status IS '처리 상태: pending(대기), reviewing(검토중), resolved(해결), closed(종료)';
