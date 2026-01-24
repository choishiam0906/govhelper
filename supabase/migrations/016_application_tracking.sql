-- 지원 이력 추적 테이블
-- 사용자가 지원한 공고의 진행 상태를 추적

-- 지원 상태 타입
CREATE TYPE application_status AS ENUM (
  'interested',      -- 관심 등록
  'preparing',       -- 지원 준비 중
  'submitted',       -- 지원 완료
  'under_review',    -- 심사 중
  'passed_initial',  -- 1차 합격
  'passed_final',    -- 최종 합격
  'rejected',        -- 탈락
  'cancelled'        -- 취소
);

-- 지원 이력 테이블
CREATE TABLE IF NOT EXISTS application_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,

  -- 상태 정보
  status application_status NOT NULL DEFAULT 'interested',
  status_updated_at TIMESTAMPTZ DEFAULT now(),

  -- 지원 정보
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,

  -- 결과 정보
  result_announced_at TIMESTAMPTZ,
  result_note TEXT,

  -- 메모
  memo TEXT,

  -- 알림 설정
  notify_deadline BOOLEAN DEFAULT true,
  notify_result BOOLEAN DEFAULT true,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 중복 방지 (사용자당 공고당 하나의 추적 레코드)
  UNIQUE(user_id, announcement_id)
);

-- 인덱스
CREATE INDEX idx_tracking_user ON application_tracking(user_id);
CREATE INDEX idx_tracking_company ON application_tracking(company_id);
CREATE INDEX idx_tracking_announcement ON application_tracking(announcement_id);
CREATE INDEX idx_tracking_status ON application_tracking(status);
CREATE INDEX idx_tracking_created ON application_tracking(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tracking_updated_at
  BEFORE UPDATE ON application_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_updated_at();

-- RLS 정책
ALTER TABLE application_tracking ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 추적 기록만 조회/수정 가능
CREATE POLICY "Users can view own tracking"
  ON application_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tracking"
  ON application_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracking"
  ON application_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracking"
  ON application_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- 상태 변경 이력 테이블 (선택적)
CREATE TABLE IF NOT EXISTS application_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID NOT NULL REFERENCES application_tracking(id) ON DELETE CASCADE,
  old_status application_status,
  new_status application_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tracking_history_tracking ON application_tracking_history(tracking_id);

-- RLS for history
ALTER TABLE application_tracking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracking history"
  ON application_tracking_history FOR SELECT
  USING (
    tracking_id IN (
      SELECT id FROM application_tracking WHERE user_id = auth.uid()
    )
  );

-- 상태 변경 시 자동으로 이력 기록
CREATE OR REPLACE FUNCTION record_tracking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_tracking_history (tracking_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tracking_status_change
  AFTER UPDATE ON application_tracking
  FOR EACH ROW
  EXECUTE FUNCTION record_tracking_status_change();
