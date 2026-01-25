-- 푸시 알림 구독 테이블
-- 2026-01-25

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- 푸시 알림 로그 테이블
CREATE TABLE IF NOT EXISTS push_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES push_subscriptions(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'deadline', 'recommendation', 'update', 'system'
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'clicked'
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_user ON push_notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_type ON push_notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_push_logs_status ON push_notification_logs(status);

-- RLS 정책
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_logs ENABLE ROW LEVEL SECURITY;

-- push_subscriptions RLS
CREATE POLICY "Users can view own subscriptions"
ON push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
ON push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
ON push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- push_notification_logs RLS
CREATE POLICY "Users can view own notification logs"
ON push_notification_logs FOR SELECT
USING (auth.uid() = user_id);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_push_subscriptions_updated_at
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_push_subscriptions_updated_at();
