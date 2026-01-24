// 캐시 모듈 테스트
// Redis 캐시 TTL 정책 및 키 생성 로직을 테스트합니다.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CACHE_TTL, cacheKey } from "@/lib/cache";

// Redis 모킹
vi.mock("@/lib/redis", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe("캐시 TTL 정책 (CACHE_TTL)", () => {
  it("사업자 NTS 정보 TTL은 1시간(3600초)이어야 한다", () => {
    expect(CACHE_TTL.BUSINESS_NTS).toBe(3600);
  });

  it("통합 사업자 정보 TTL은 24시간(86400초)이어야 한다", () => {
    expect(CACHE_TTL.BUSINESS_FULL).toBe(86400);
  });

  it("AI 매칭 결과 TTL은 7일(604800초)이어야 한다", () => {
    expect(CACHE_TTL.AI_MATCHING).toBe(604800);
  });

  it("RAG 임베딩 TTL은 1시간(3600초)이어야 한다", () => {
    expect(CACHE_TTL.RAG_EMBEDDING).toBe(3600);
  });

  it("공고 목록 TTL은 5분(300초)이어야 한다", () => {
    expect(CACHE_TTL.ANNOUNCEMENTS_LIST).toBe(300);
  });
});

describe("캐시 키 생성 (cacheKey)", () => {
  describe("business 키", () => {
    it("사업자번호로 캐시 키를 생성해야 한다", () => {
      const key = cacheKey.business("123-45-67890");
      expect(key).toBe("business:123-45-67890");
    });

    it("하이픈 없는 사업자번호도 처리해야 한다", () => {
      const key = cacheKey.business("1234567890");
      expect(key).toBe("business:1234567890");
    });
  });

  describe("matching 키", () => {
    it("회사ID와 공고ID로 매칭 캐시 키를 생성해야 한다", () => {
      const key = cacheKey.matching("company123", "announcement456");
      expect(key).toBe("matching:company123:announcement456");
    });

    it("UUID 형식 ID도 처리해야 한다", () => {
      const companyId = "550e8400-e29b-41d4-a716-446655440000";
      const announcementId = "660e8400-e29b-41d4-a716-446655440001";
      const key = cacheKey.matching(companyId, announcementId);
      expect(key).toBe(`matching:${companyId}:${announcementId}`);
    });
  });

  describe("ragEmbedding 키", () => {
    it("쿼리를 해시하여 캐시 키를 생성해야 한다", () => {
      const key = cacheKey.ragEmbedding("IT 스타트업 R&D 지원금");
      expect(key).toMatch(/^rag:embedding:[a-z0-9]+$/);
    });

    it("동일한 쿼리는 동일한 해시를 반환해야 한다", () => {
      const query = "중소기업 지원사업";
      const key1 = cacheKey.ragEmbedding(query);
      const key2 = cacheKey.ragEmbedding(query);
      expect(key1).toBe(key2);
    });

    it("다른 쿼리는 다른 해시를 반환해야 한다", () => {
      const key1 = cacheKey.ragEmbedding("쿼리1");
      const key2 = cacheKey.ragEmbedding("쿼리2");
      expect(key1).not.toBe(key2);
    });

    it("빈 문자열도 처리해야 한다", () => {
      const key = cacheKey.ragEmbedding("");
      expect(key).toMatch(/^rag:embedding:[a-z0-9]+$/);
    });

    it("긴 쿼리도 짧은 해시로 변환해야 한다", () => {
      const longQuery = "A".repeat(1000);
      const key = cacheKey.ragEmbedding(longQuery);
      expect(key.length).toBeLessThan(50);
    });
  });
});

describe("캐시 TTL 정책 검증", () => {
  it("모든 TTL 값은 양수여야 한다", () => {
    Object.values(CACHE_TTL).forEach((ttl) => {
      expect(ttl).toBeGreaterThan(0);
    });
  });

  it("TTL 값은 합리적인 범위 내에 있어야 한다", () => {
    // 최소 1분
    Object.values(CACHE_TTL).forEach((ttl) => {
      expect(ttl).toBeGreaterThanOrEqual(60);
    });

    // 최대 30일
    const maxTTL = 30 * 24 * 60 * 60;
    Object.values(CACHE_TTL).forEach((ttl) => {
      expect(ttl).toBeLessThanOrEqual(maxTTL);
    });
  });

  it("AI_MATCHING TTL이 BUSINESS_FULL보다 길어야 한다", () => {
    expect(CACHE_TTL.AI_MATCHING).toBeGreaterThan(CACHE_TTL.BUSINESS_FULL);
  });

  it("USER_NOTIFICATIONS_COUNT TTL이 가장 짧아야 한다", () => {
    const allTTLs = Object.values(CACHE_TTL);
    const minTTL = Math.min(...allTTLs);
    expect(CACHE_TTL.USER_NOTIFICATIONS_COUNT).toBe(minTTL);
  });
});
