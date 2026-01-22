-- 사용자 분석 테이블 (UTM 추적 및 행동 분석)
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- UTM 파라미터
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),

  -- 유입 정보
  landing_page VARCHAR(500),
  referrer VARCHAR(500),

  -- 메타 정보
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(20), -- desktop, mobile, tablet
  browser VARCHAR(50),
  os VARCHAR(50),

  -- 전환 정보
  signup_completed BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  first_match_at TIMESTAMPTZ,
  first_payment_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_utm_source ON user_analytics(utm_source);
CREATE INDEX IF NOT EXISTS idx_user_analytics_utm_campaign ON user_analytics(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON user_analytics(created_at DESC);

-- RLS 정책
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Service role은 모든 작업 가능
CREATE POLICY "Service role can do all on user_analytics" ON user_analytics
  FOR ALL USING (true) WITH CHECK (true);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_analytics_updated_at
  BEFORE UPDATE ON user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics_updated_at();

-- guest_leads 테이블에 utm_term, utm_content 컬럼 추가 (없으면)
ALTER TABLE guest_leads ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);
ALTER TABLE guest_leads ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);

-- UTM 분석용 뷰 생성 (통계용)
CREATE OR REPLACE VIEW utm_statistics AS
SELECT
  -- 기간별 집계
  DATE_TRUNC('day', created_at) as date,

  -- UTM 소스별
  utm_source,
  utm_medium,
  utm_campaign,

  -- 전환 통계
  COUNT(*) as total_signups,
  COUNT(CASE WHEN onboarding_completed THEN 1 END) as completed_onboarding,
  COUNT(CASE WHEN first_match_at IS NOT NULL THEN 1 END) as used_matching,
  COUNT(CASE WHEN first_payment_at IS NOT NULL THEN 1 END) as converted_paid,

  -- 전환율
  ROUND(
    COUNT(CASE WHEN first_payment_at IS NOT NULL THEN 1 END)::NUMERIC /
    NULLIF(COUNT(*)::NUMERIC, 0) * 100,
    2
  ) as conversion_rate

FROM user_analytics
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), utm_source, utm_medium, utm_campaign
ORDER BY date DESC, total_signups DESC;

-- 비회원 리드 UTM 분석 뷰
CREATE OR REPLACE VIEW guest_utm_statistics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN converted_to_user THEN 1 END) as converted_users,
  ROUND(
    COUNT(CASE WHEN converted_to_user THEN 1 END)::NUMERIC /
    NULLIF(COUNT(*)::NUMERIC, 0) * 100,
    2
  ) as conversion_rate
FROM guest_leads
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), utm_source, utm_medium, utm_campaign
ORDER BY date DESC, total_leads DESC;
