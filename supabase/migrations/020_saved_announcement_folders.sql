-- 저장된 공고 폴더/태그 기능 추가
-- 2026-01-25

-- 폴더 테이블
CREATE TABLE IF NOT EXISTS saved_announcement_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT 'gray',
  icon VARCHAR(50) DEFAULT 'folder',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- saved_announcements 테이블에 폴더, 태그, 메모 컬럼 추가
ALTER TABLE saved_announcements
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES saved_announcement_folders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS notify_deadline BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_saved_folders_user ON saved_announcement_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_announcements_folder ON saved_announcements(folder_id);
CREATE INDEX IF NOT EXISTS idx_saved_announcements_tags ON saved_announcements USING gin(tags);

-- RLS 정책
ALTER TABLE saved_announcement_folders ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 폴더만 조회 가능
CREATE POLICY "Users can view own folders"
ON saved_announcement_folders FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 폴더만 생성 가능
CREATE POLICY "Users can create own folders"
ON saved_announcement_folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 폴더만 수정 가능
CREATE POLICY "Users can update own folders"
ON saved_announcement_folders FOR UPDATE
USING (auth.uid() = user_id);

-- 사용자는 자신의 폴더만 삭제 가능
CREATE POLICY "Users can delete own folders"
ON saved_announcement_folders FOR DELETE
USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_saved_announcement_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_announcement_folders_updated_at
BEFORE UPDATE ON saved_announcement_folders
FOR EACH ROW
EXECUTE FUNCTION update_saved_announcement_folders_updated_at();

CREATE OR REPLACE FUNCTION update_saved_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_announcements_updated_at ON saved_announcements;
CREATE TRIGGER trigger_update_saved_announcements_updated_at
BEFORE UPDATE ON saved_announcements
FOR EACH ROW
EXECUTE FUNCTION update_saved_announcements_updated_at();
