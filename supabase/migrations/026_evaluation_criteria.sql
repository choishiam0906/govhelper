-- 공고 평가기준 자동 추출 결과 저장을 위한 마이그레이션
-- 2026-01-26

-- announcements 테이블에 evaluation_criteria 컬럼 추가
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS evaluation_criteria JSONB;

-- 평가기준 추출 상태 추가
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS evaluation_parsed BOOLEAN DEFAULT false;

-- 평가기준 추출 일시 추가
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS evaluation_parsed_at TIMESTAMPTZ;

-- 인덱스 생성 (평가기준이 있는 공고 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_announcements_evaluation_parsed
ON announcements(evaluation_parsed)
WHERE evaluation_parsed = true;

-- 평가기준 카테고리별 검색을 위한 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_announcements_evaluation_criteria_gin
ON announcements USING gin (evaluation_criteria jsonb_path_ops);

-- 코멘트 추가
COMMENT ON COLUMN announcements.evaluation_criteria IS '공고의 평가기준 정보 (AI 추출)';
COMMENT ON COLUMN announcements.evaluation_parsed IS '평가기준 파싱 완료 여부';
COMMENT ON COLUMN announcements.evaluation_parsed_at IS '평가기준 파싱 완료 일시';

/*
evaluation_criteria JSONB 구조 예시:
{
  "totalScore": 100,
  "passingScore": 70,
  "items": [
    {
      "category": "기술성",
      "name": "기술 혁신성",
      "description": "기술의 혁신성 및 차별성",
      "maxScore": 20,
      "weight": 0.2,
      "subItems": [
        {
          "name": "기술 독창성",
          "description": "기술의 독창성 및 차별화 정도",
          "maxScore": 10,
          "keywords": ["독창성", "차별화", "혁신"]
        }
      ]
    }
  ],
  "bonusItems": [
    {
      "name": "벤처기업 인증",
      "score": 5,
      "condition": "벤처기업 인증 보유",
      "type": "bonus"
    }
  ],
  "evaluationMethod": {
    "type": "absolute",
    "stages": 2,
    "stageNames": ["서류심사", "발표심사"]
  },
  "extractedAt": "2026-01-26T12:00:00.000Z",
  "confidence": 0.85,
  "source": "첨부파일"
}
*/
