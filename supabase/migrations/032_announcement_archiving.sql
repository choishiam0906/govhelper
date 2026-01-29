-- 공고 아카이브 기능 추가
-- announcements 테이블에 archived_at 컬럼 추가 및 인덱스 생성

-- archived_at 컬럼 추가 (아카이브된 시각 기록)
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 아카이브 상태 및 archived_at 조회용 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_announcements_status_archived_at
ON announcements(status, archived_at)
WHERE status = 'archived';

-- 만료일 기준 아카이브 대상 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_announcements_expired_application_end
ON announcements(application_end)
WHERE status = 'expired';

-- 코멘트 추가
COMMENT ON COLUMN announcements.archived_at IS '공고가 archived 상태로 변경된 시각 (90일 이상 expired 공고)';
