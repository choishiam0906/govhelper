-- 인앱 알림 센터 테이블
-- 사용자에게 표시되는 모든 알림을 저장

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 알림 유형
  type TEXT NOT NULL,  -- 'deadline', 'matching', 'recommendation', 'system', 'announcement'

  -- 알림 내용
  title TEXT NOT NULL,
  message TEXT,

  -- 연관 데이터 (선택)
  announcement_id UUID REFERENCES announcements(id) ON DELETE SET NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,

  -- 메타데이터 (추가 정보)
  metadata JSONB DEFAULT '{}',

  -- 상태
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- 액션 URL (클릭 시 이동)
  action_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ  -- NULL이면 만료 없음
);

-- 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 조회 가능
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 알림만 수정 가능 (읽음 처리)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 알림만 삭제 가능
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 서비스 역할은 알림 생성 가능
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 알림 통계 뷰 (사용자별 읽지 않은 알림 수)
CREATE OR REPLACE VIEW notification_stats AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) as total_count,
  MAX(created_at) as latest_at
FROM notifications
WHERE expires_at IS NULL OR expires_at > NOW()
GROUP BY user_id;

-- 30일 이상 지난 읽은 알림 자동 삭제 함수
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE is_read = true
    AND created_at < NOW() - INTERVAL '30 days';

  DELETE FROM notifications
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 코멘트
COMMENT ON TABLE notifications IS '인앱 알림 센터 - 사용자에게 표시되는 모든 알림';
COMMENT ON COLUMN notifications.type IS '알림 유형: deadline, matching, recommendation, system, announcement';
COMMENT ON COLUMN notifications.metadata IS '알림별 추가 정보 (JSON)';
COMMENT ON COLUMN notifications.action_url IS '알림 클릭 시 이동할 URL';
