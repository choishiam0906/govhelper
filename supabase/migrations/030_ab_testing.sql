-- A/B 테스트 시스템 테이블
-- 실험, 사용자 할당, 전환 이벤트 저장

-- 1. 실험 정의 테이블
CREATE TABLE IF NOT EXISTS ab_experiments (
  id TEXT PRIMARY KEY,                    -- 'proPriceTest'
  name TEXT NOT NULL,                     -- '프로 플랜 가격 테스트'
  description TEXT,
  variants JSONB NOT NULL DEFAULT '[]',   -- [{ id, name, price, weight }]
  status TEXT DEFAULT 'draft',            -- draft, running, paused, completed
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 사용자 그룹 할당 테이블
CREATE TABLE IF NOT EXISTS ab_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id TEXT NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,                  -- auth.users(id) 또는 익명 ID
  variant TEXT NOT NULL,                  -- 'A' or 'B'
  created_at TIMESTAMPTZ DEFAULT now(),

  -- 사용자당 실험당 하나의 할당만 허용
  UNIQUE(experiment_id, user_id)
);

-- 3. 전환 이벤트 테이블
CREATE TABLE IF NOT EXISTS ab_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id TEXT NOT NULL REFERENCES ab_experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  variant TEXT NOT NULL,                  -- 할당된 variant
  event_type TEXT NOT NULL,               -- 'purchase', 'signup', 'click'
  revenue INTEGER DEFAULT 0,              -- 매출 (원)
  metadata JSONB DEFAULT '{}',            -- 추가 정보
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment
  ON ab_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user
  ON ab_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_conversions_experiment
  ON ab_conversions(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_conversions_variant
  ON ab_conversions(experiment_id, variant);

-- RLS 정책
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_conversions ENABLE ROW LEVEL SECURITY;

-- 실험 조회: 모든 사용자 가능 (공개 데이터)
CREATE POLICY "Anyone can view experiments"
  ON ab_experiments FOR SELECT
  USING (true);

-- 할당 조회: 본인만
CREATE POLICY "Users can view own assignments"
  ON ab_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- 할당 생성: 인증된 사용자
CREATE POLICY "Authenticated users can create assignments"
  ON ab_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 전환 조회: 본인만
CREATE POLICY "Users can view own conversions"
  ON ab_conversions FOR SELECT
  USING (auth.uid() = user_id);

-- 전환 생성: 인증된 사용자
CREATE POLICY "Authenticated users can create conversions"
  ON ab_conversions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 관리자용 전체 조회 정책 (service_role 사용)

-- 초기 실험 데이터 삽입
INSERT INTO ab_experiments (id, name, description, variants, status, start_date)
VALUES (
  'proPriceTest',
  'Pro 플랜 가격 테스트',
  'Pro 플랜 최적 가격점 발견을 위한 A/B 테스트 (₩5,000 vs ₩3,900)',
  '[
    {"id": "A", "name": "Control - ₩5,000", "price": 5000, "weight": 50},
    {"id": "B", "name": "Test - ₩3,900", "price": 3900, "weight": 50}
  ]'::jsonb,
  'running',
  now()
) ON CONFLICT (id) DO NOTHING;

-- 결과 분석용 뷰
CREATE OR REPLACE VIEW ab_experiment_results AS
SELECT
  e.id AS experiment_id,
  e.name AS experiment_name,
  a.variant,
  COUNT(DISTINCT a.user_id) AS total_assignments,
  COUNT(DISTINCT c.user_id) AS total_conversions,
  CASE
    WHEN COUNT(DISTINCT a.user_id) > 0
    THEN ROUND(COUNT(DISTINCT c.user_id)::numeric / COUNT(DISTINCT a.user_id), 4)
    ELSE 0
  END AS conversion_rate,
  COALESCE(SUM(c.revenue), 0) AS total_revenue,
  CASE
    WHEN COUNT(c.id) > 0
    THEN ROUND(SUM(c.revenue)::numeric / COUNT(c.id), 0)
    ELSE 0
  END AS avg_revenue
FROM ab_experiments e
LEFT JOIN ab_assignments a ON e.id = a.experiment_id
LEFT JOIN ab_conversions c ON e.id = c.experiment_id AND a.user_id = c.user_id
GROUP BY e.id, e.name, a.variant;

COMMENT ON TABLE ab_experiments IS 'A/B 테스트 실험 정의';
COMMENT ON TABLE ab_assignments IS '사용자별 실험 그룹 할당';
COMMENT ON TABLE ab_conversions IS '전환 이벤트 (결제, 가입 등)';
