# 하이브리드 검색 (Hybrid Search)

GovHelper의 하이브리드 검색 시스템은 벡터 검색과 키워드 검색을 결합하여 검색 정확도와 재현율을 높입니다.

## 개요

**하이브리드 검색**은 두 가지 검색 방식을 결합합니다:
- **벡터 검색 (Semantic Search)**: AI 임베딩 기반 의미론적 유사도 검색
- **키워드 검색 (Keyword Search)**: 전통적인 SQL ILIKE 패턴 매칭

## 아키텍처

```
사용자 쿼리 "IT 스타트업 R&D 지원금"
         ↓
    ┌────────────────┐
    │ 하이브리드 검색  │
    └────────────────┘
         ↙          ↘
벡터 검색(20개)   키워드 검색(20개)
    ↓               ↓
  [1,2,3...]     [1,2,3...]
         ↘          ↙
    ┌────────────────┐
    │  RRF 병합 알고리즘 │
    └────────────────┘
         ↓
   최종 결과 (10개)
```

## 핵심 기술

### 1. 벡터 검색 (Vector Search)

**사용 기술:**
- **pgvector**: PostgreSQL 벡터 검색 확장
- **Gemini text-embedding-004**: 768차원 임베딩 모델
- **IVFFlat Index**: 빠른 근사 벡터 검색

**검색 필드:**
- 공고 제목 (title)
- 공고 내용 (description)
- 지원자격 (eligibility)

**코사인 유사도 계산:**
```sql
1 - (embedding <=> query_embedding) AS similarity
```

### 2. 키워드 검색 (Keyword Search)

**사용 기술:**
- **PostgreSQL ILIKE**: 대소문자 무시 패턴 매칭
- **복합 필드 검색**: title, organization, description

**검색 쿼리 예시:**
```sql
WHERE status = 'active'
  AND (
    title ILIKE '%검색어%' OR
    organization ILIKE '%검색어%' OR
    description ILIKE '%검색어%'
  )
ORDER BY application_end ASC
LIMIT 20
```

### 3. RRF (Reciprocal Rank Fusion) 알고리즘

두 검색 결과를 병합하는 알고리즘입니다.

**공식:**
```
RRF(d) = Σ [1 / (k + rank_i)]
```

- `d`: 문서 (공고)
- `k`: 상수 (기본값 60)
- `rank_i`: i번째 검색에서의 순위 (1-based)

**예시:**
| 공고 ID | 벡터 순위 | 키워드 순위 | RRF 점수 |
|---------|-----------|-------------|----------|
| A123    | 1         | 3           | 1/(60+1) + 1/(60+3) ≈ 0.0323 |
| B456    | 2         | 1           | 1/(60+2) + 1/(60+1) ≈ 0.0325 |
| C789    | 10        | -           | 1/(60+10) ≈ 0.0143 |

**특징:**
- 양쪽 검색에 모두 있는 결과: 높은 점수
- 한쪽에만 있는 결과: 중간 점수
- 순위가 높을수록 점수 증가
- 로그 스케일로 상위 순위 강조

## 사용 방법

### API 호출

**하이브리드 검색 활성화:**
```typescript
const response = await fetch('/api/announcements/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'IT 스타트업 R&D 지원금',
    hybrid: true,           // 하이브리드 검색 활성화
    matchThreshold: 0.4,    // 벡터 검색 최소 유사도
    matchCount: 20,         // 최종 반환 개수
  }),
})

const result = await response.json()
console.log(result.meta.searchType) // "hybrid"
```

**벡터 검색만:**
```typescript
body: JSON.stringify({
  query: '...',
  hybrid: false,  // 기본값
})
```

### React 컴포넌트

`SemanticSearch` 컴포넌트에서 체크박스로 토글:

```tsx
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={useHybrid}
    onChange={(e) => setUseHybrid(e.target.checked)}
  />
  하이브리드 검색 (벡터 + 키워드)
</label>
```

### 프로그래밍 인터페이스

**하이브리드 검색:**
```typescript
import { hybridSearch } from '@/lib/search'

const result = await hybridSearch('IT 스타트업 R&D 지원금', {
  limit: 10,
  matchThreshold: 0.5,
  k: 60,
})

console.log(result.results)      // RankedResult[]
console.log(result.meta)         // 메타 정보
```

**벡터 검색만:**
```typescript
import { vectorSearchOnly } from '@/lib/search'

const result = await vectorSearchOnly('...', { limit: 10 })
```

**키워드 검색만:**
```typescript
import { keywordSearchOnly } from '@/lib/search'

const result = await keywordSearchOnly('...', { limit: 10 })
```

## 응답 형식

```typescript
interface HybridSearchResult {
  results: RankedResult[]
  meta: {
    query: string
    totalResults: number
    searchType: 'hybrid' | 'vector' | 'keyword'
    vectorCount: number    // 벡터 검색 결과 개수
    keywordCount: number   // 키워드 검색 결과 개수
  }
}

interface RankedResult {
  id: string
  title: string
  organization: string
  // ... 공고 필드
  vectorRank?: number      // 벡터 검색 순위 (1-based)
  keywordRank?: number     // 키워드 검색 순위 (1-based)
  rrfScore: number         // RRF 최종 점수
  similarity?: number      // 벡터 유사도 (0-1)
}
```

## 성능 최적화

### 1. 임베딩 캐싱

검색어 임베딩을 Redis에 캐싱 (TTL 1시간):

```typescript
import { getRagEmbeddingCache, setRagEmbeddingCache } from '@/lib/cache'

let queryEmbedding = await getRagEmbeddingCache(query)
if (!queryEmbedding) {
  queryEmbedding = await generateEmbedding(query)
  await setRagEmbeddingCache(query, queryEmbedding)
}
```

### 2. IVFFlat 인덱스

`announcement_embeddings` 테이블에 IVFFlat 인덱스 적용:

```sql
CREATE INDEX announcement_embeddings_vector_idx
ON announcement_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 50);
```

### 3. 배치 크기 조정

- 벡터 검색: 상위 20개
- 키워드 검색: 상위 20개
- 최종 병합: 상위 10개 반환

## 검색 품질 비교

| 검색 방식 | 정확도 | 재현율 | 속도 | 사용 사례 |
|----------|--------|--------|------|-----------|
| 벡터 검색 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 의미론적 유사도 검색 |
| 키워드 검색 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 정확한 키워드 매칭 |
| **하이브리드** | **⭐⭐⭐⭐⭐** | **⭐⭐⭐⭐** | **⭐⭐⭐⭐** | **균형 잡힌 검색** |

### 예시 비교

**쿼리:** "IT 스타트업 R&D 지원금"

| 검색 방식 | 상위 3개 결과 |
|----------|---------------|
| 벡터 검색 | ✅ "정보통신 분야 R&D 지원사업"<br>✅ "혁신기술 개발 지원"<br>⚠️ "디지털 전환 지원" (약간 벗어남) |
| 키워드 검색 | ✅ "IT 전문기업 R&D 바우처"<br>✅ "스타트업 기술개발 지원금"<br>❌ "R&D 세액공제" (매칭은 되지만 지원금 아님) |
| **하이브리드** | ✅ "정보통신 분야 R&D 지원사업" (둘 다 상위)<br>✅ "IT 전문기업 R&D 바우처" (키워드 정확)<br>✅ "혁신기술 개발 지원" (벡터 상위) |

## 모니터링

### 검색 타입 헤더

응답 헤더에서 검색 방식 확인:

```typescript
const searchType = response.headers.get('X-Search-Type')
// "hybrid" | "vector" | "keyword"
```

### 메타 정보

```typescript
const { meta } = await result.json()

console.log(meta.searchType)      // "hybrid"
console.log(meta.vectorCount)     // 18
console.log(meta.keywordCount)    // 15
console.log(meta.totalResults)    // 10 (병합 후)
```

## 제한사항

1. **벡터 검색 의존성**: pgvector 확장 및 RPC 함수 필요
2. **임베딩 생성 비용**: Gemini API 호출 (캐싱으로 완화)
3. **메모리 사용량**: 768차원 벡터 저장
4. **인덱스 빌드 시간**: 공고 증가 시 IVFFlat 재구성 필요

## 향후 개선 방향

- [ ] **가중치 조정**: 벡터/키워드 검색 가중치 동적 조정
- [ ] **필터링 통합**: 소스/카테고리 필터를 RRF 이전에 적용
- [ ] **A/B 테스트**: 하이브리드 vs 벡터 검색 품질 비교
- [ ] **사용자 피드백**: 검색 결과 만족도 수집 및 반영
- [ ] **쿼리 확장**: 동의어/유의어 추가
- [ ] **멀티모달 검색**: 첨부파일 내용도 검색 대상 포함

## 참고 자료

- [RRF 논문](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
- [pgvector 문서](https://github.com/pgvector/pgvector)
- [Gemini Embedding API](https://ai.google.dev/docs/embeddings_guide)
