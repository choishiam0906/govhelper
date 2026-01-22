-- 공개 통계 캐시 테이블
-- 랜딩 페이지에서 사용하는 실시간 통계를 캐싱하여 성능 최적화

CREATE TABLE IF NOT EXISTS public_statistics (
  id TEXT PRIMARY KEY DEFAULT 'main',

  -- 매칭 통계
  total_matches INTEGER DEFAULT 0,           -- 총 매칭 분석 횟수
  avg_match_score DECIMAL(5,2) DEFAULT 0,    -- 평균 매칭 점수
  high_score_matches INTEGER DEFAULT 0,      -- 70점 이상 매칭 수
  success_rate DECIMAL(5,2) DEFAULT 0,       -- 성공률 (70점 이상 비율)

  -- 공고 통계
  total_announcements INTEGER DEFAULT 0,     -- 총 공고 수
  active_announcements INTEGER DEFAULT 0,    -- 활성 공고 수

  -- 사용자 통계
  total_users INTEGER DEFAULT 0,             -- 총 사용자 수
  total_companies INTEGER DEFAULT 0,         -- 총 기업 수

  -- 금액 통계
  total_support_amount BIGINT DEFAULT 0,     -- 총 지원금액 합계
  avg_support_amount BIGINT DEFAULT 0,       -- 평균 지원금액

  -- 비회원 통계
  total_guest_matches INTEGER DEFAULT 0,     -- 비회원 매칭 수
  guest_conversion_rate DECIMAL(5,2) DEFAULT 0, -- 비회원 전환율

  -- 메타 정보
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 초기 데이터 삽입
INSERT INTO public_statistics (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_public_statistics()
RETURNS void AS $$
DECLARE
  v_total_matches INTEGER;
  v_avg_score DECIMAL(5,2);
  v_high_score INTEGER;
  v_total_announcements INTEGER;
  v_active_announcements INTEGER;
  v_total_companies INTEGER;
  v_total_support BIGINT;
  v_avg_support BIGINT;
  v_guest_matches INTEGER;
  v_guest_converted INTEGER;
  v_guest_total INTEGER;
BEGIN
  -- 매칭 통계
  SELECT
    COUNT(*),
    COALESCE(AVG(match_score), 0),
    COUNT(*) FILTER (WHERE match_score >= 70)
  INTO v_total_matches, v_avg_score, v_high_score
  FROM matches;

  -- 공고 통계
  SELECT COUNT(*) INTO v_total_announcements FROM announcements;
  SELECT COUNT(*) INTO v_active_announcements FROM announcements WHERE status = 'active';

  -- 기업 통계
  SELECT COUNT(*) INTO v_total_companies FROM companies;

  -- 지원금액 통계
  SELECT
    COALESCE(SUM(support_amount), 0),
    COALESCE(AVG(support_amount), 0)
  INTO v_total_support, v_avg_support
  FROM announcements
  WHERE support_amount > 0 AND status = 'active';

  -- 비회원 통계
  SELECT COUNT(*) INTO v_guest_matches FROM guest_matches;
  SELECT COUNT(*) INTO v_guest_converted FROM guest_leads WHERE converted_to_user = true;
  SELECT COUNT(*) INTO v_guest_total FROM guest_leads;

  -- 통계 업데이트
  UPDATE public_statistics SET
    total_matches = v_total_matches,
    avg_match_score = v_avg_score,
    high_score_matches = v_high_score,
    success_rate = CASE WHEN v_total_matches > 0 THEN (v_high_score::DECIMAL / v_total_matches * 100) ELSE 0 END,
    total_announcements = v_total_announcements,
    active_announcements = v_active_announcements,
    total_companies = v_total_companies,
    total_support_amount = v_total_support,
    avg_support_amount = v_avg_support,
    total_guest_matches = v_guest_matches,
    guest_conversion_rate = CASE WHEN v_guest_total > 0 THEN (v_guest_converted::DECIMAL / v_guest_total * 100) ELSE 0 END,
    updated_at = now()
  WHERE id = 'main';
END;
$$ LANGUAGE plpgsql;

-- 트리거: 매칭 생성 시 통계 업데이트
CREATE OR REPLACE FUNCTION trigger_update_stats_on_match()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_public_statistics();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_on_match ON matches;
CREATE TRIGGER update_stats_on_match
  AFTER INSERT ON matches
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_stats_on_match();

-- 트리거: 비회원 매칭 생성 시 통계 업데이트
DROP TRIGGER IF EXISTS update_stats_on_guest_match ON guest_matches;
CREATE TRIGGER update_stats_on_guest_match
  AFTER INSERT ON guest_matches
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_stats_on_match();

-- 초기 통계 계산
SELECT update_public_statistics();

-- public_statistics는 누구나 읽을 수 있음 (공개 통계)
ALTER TABLE public_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public statistics are viewable by everyone"
  ON public_statistics FOR SELECT
  USING (true);

-- 인덱스 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(match_score);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
