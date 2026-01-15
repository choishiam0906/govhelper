-- 알림 설정 테이블
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 이메일 알림 설정
  email_enabled BOOLEAN DEFAULT true,
  deadline_7_days BOOLEAN DEFAULT true,  -- 마감 7일 전 알림
  deadline_3_days BOOLEAN DEFAULT true,  -- 마감 3일 전 알림
  deadline_1_day BOOLEAN DEFAULT true,   -- 마감 1일 전 알림

  -- 알림 받을 이메일 (기본: 가입 이메일)
  notification_email TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 알림 발송 이력 테이블
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES announcements(id) ON DELETE SET NULL,

  notification_type TEXT NOT NULL,  -- 'deadline_7_days', 'deadline_3_days', 'deadline_1_day'
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 발송 방지를 위한 유니크 인덱스
  UNIQUE(user_id, announcement_id, notification_type)
);

-- RLS 정책
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림 설정만 조회/수정 가능
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 알림 로그는 서비스 역할만 접근
CREATE POLICY "Service role can manage notification logs"
  ON notification_logs FOR ALL
  USING (true);

-- 인덱스
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_logs_user_announcement ON notification_logs(user_id, announcement_id);
