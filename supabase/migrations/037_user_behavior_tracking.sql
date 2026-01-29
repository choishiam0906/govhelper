-- 공고 조회 이력 테이블
CREATE TABLE IF NOT EXISTS user_announcement_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 1,
  last_viewed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 복합 유니크 (사용자당 공고 1행만)
CREATE UNIQUE INDEX idx_user_announcement_views_unique ON user_announcement_views(user_id, announcement_id);
CREATE INDEX idx_user_announcement_views_user ON user_announcement_views(user_id);

-- RLS
ALTER TABLE user_announcement_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "사용자는 자기 조회 기록만 관리" ON user_announcement_views
  FOR ALL USING (auth.uid() = user_id);

-- 조회 수 증가 함수
CREATE OR REPLACE FUNCTION increment_view_count(
  p_user_id UUID,
  p_announcement_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE user_announcement_views
  SET view_count = view_count + 1,
      last_viewed_at = now()
  WHERE user_id = p_user_id
    AND announcement_id = p_announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
