-- 대시보드 위젯 설정 테이블
-- 2026-01-26

CREATE TABLE IF NOT EXISTS dashboard_widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets JSONB NOT NULL DEFAULT '[]',
  -- 예시: [
  --   { "id": "stats", "visible": true, "order": 0 },
  --   { "id": "quickActions", "visible": true, "order": 1 },
  --   { "id": "recommendations", "visible": true, "order": 2 },
  --   { "id": "urgentDeadlines", "visible": true, "order": 3 },
  --   { "id": "inProgressApps", "visible": true, "order": 4 },
  --   { "id": "recentAnnouncements", "visible": true, "order": 5 }
  -- ]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_widget_settings_user ON dashboard_widget_settings(user_id);

-- RLS 정책
ALTER TABLE dashboard_widget_settings ENABLE ROW LEVEL SECURITY;

-- 자신의 설정만 조회/수정 가능
CREATE POLICY "Users can view own widget settings"
ON dashboard_widget_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own widget settings"
ON dashboard_widget_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own widget settings"
ON dashboard_widget_settings FOR UPDATE
USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_widget_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_widget_settings_updated_at
BEFORE UPDATE ON dashboard_widget_settings
FOR EACH ROW
EXECUTE FUNCTION update_widget_settings_updated_at();
