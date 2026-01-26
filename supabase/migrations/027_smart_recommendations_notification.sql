-- 스마트 추천 알림 설정 컬럼 추가
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS smart_recommendations BOOLEAN DEFAULT true;

-- 알림 로그에 smart_recommendation 타입 추가를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(notification_type);

-- created_at 컬럼 추가 (이미 있으면 무시)
ALTER TABLE notification_logs
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 코멘트 추가
COMMENT ON COLUMN notification_preferences.smart_recommendations IS '스마트 추천 알림 활성화 여부 (기업 프로필 기반 맞춤 공고 알림)';
