-- 공고 변경 이력 테이블
-- 2026-01-25

CREATE TABLE IF NOT EXISTS announcement_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  change_type VARCHAR(50) NOT NULL, -- 'amount', 'deadline', 'content', 'status', 'other'
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  detected_at TIMESTAMPTZ DEFAULT now()
);

-- 변경 알림 큐 테이블
CREATE TABLE IF NOT EXISTS announcement_change_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id UUID NOT NULL REFERENCES announcement_changes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(20) DEFAULT 'email', -- 'email', 'push', 'both'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(change_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_changes_announcement ON announcement_changes(announcement_id);
CREATE INDEX IF NOT EXISTS idx_changes_detected ON announcement_changes(detected_at);
CREATE INDEX IF NOT EXISTS idx_changes_type ON announcement_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_change_notifications_user ON announcement_change_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_change_notifications_status ON announcement_change_notifications(status);

-- RLS 정책
ALTER TABLE announcement_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_change_notifications ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 변경 이력 조회 가능
CREATE POLICY "Anyone can view announcement changes"
ON announcement_changes FOR SELECT
USING (true);

-- 자신의 알림만 조회 가능
CREATE POLICY "Users can view own change notifications"
ON announcement_change_notifications FOR SELECT
USING (auth.uid() = user_id);

-- saved_announcements 테이블에 변경 알림 설정 컬럼 추가
ALTER TABLE saved_announcements
ADD COLUMN IF NOT EXISTS notify_changes BOOLEAN DEFAULT true;
