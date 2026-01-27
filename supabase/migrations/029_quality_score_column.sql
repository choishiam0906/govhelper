-- announcements 테이블에 품질 점수 컬럼 추가
-- 생성일: 2026-01-27

-- quality_score 컬럼 추가 (0-100점)
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100);

-- quality_grade 컬럼 추가 (A, B, C, D)
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'D'));

-- 품질 점수 내림차순 인덱스 (검색 정렬용)
CREATE INDEX IF NOT EXISTS idx_announcements_quality_score
ON announcements(quality_score DESC);

-- 품질 등급 인덱스 (필터링용)
CREATE INDEX IF NOT EXISTS idx_announcements_quality_grade
ON announcements(quality_grade);

-- 상태+품질 점수 복합 인덱스 (활성 공고 품질순 정렬용)
CREATE INDEX IF NOT EXISTS idx_announcements_status_quality
ON announcements(status, quality_score DESC)
WHERE status = 'active';

COMMENT ON COLUMN announcements.quality_score IS '공고 품질 점수 (0-100), calculateQualityScore() 기반';
COMMENT ON COLUMN announcements.quality_grade IS '공고 품질 등급 (A: 90+, B: 75-89, C: 60-74, D: 0-59)';
