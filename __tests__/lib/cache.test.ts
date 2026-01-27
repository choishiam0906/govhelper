// 캐시 모듈 테스트
// Redis 캐시 TTL 정책 및 키 생성 로직을 테스트합니다.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CACHE_TTL,
  cacheKey,
  getCache,
  setCache,
  deleteCache,
  getCacheWithFallback,
  getBusinessCache,
  setBusinessCache,
  deleteBusinessCache,
  getMatchingCache,
  setMatchingCache,
} from "@/lib/cache";
import type { UnifiedBusinessInfo } from "@/lib/business/types";
import type { CachedMatchingResult } from "@/lib/cache";

// Redis 모킹
vi.mock("@/lib/redis", () => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockDel = vi.fn();

  return {
    default: {
      get: mockGet,
      set: mockSet,
      del: mockDel,
    },
  };
});

import redis from "@/lib/redis";
const mockGet = redis.get as ReturnType<typeof vi.fn>;
const mockSet = redis.set as ReturnType<typeof vi.fn>;
const mockDel = redis.del as ReturnType<typeof vi.fn>;

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

describe("캐시 CRUD 함수", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getCache", () => {
    it("캐시된 데이터를 반환해야 한다", async () => {
      mockGet.mockResolvedValue({ data: "test" });
      const result = await getCache("test-key");
      expect(result).toEqual({ data: "test" });
      expect(mockGet).toHaveBeenCalledWith("test-key");
    });

    it("캐시 미스 시 null을 반환해야 한다", async () => {
      mockGet.mockResolvedValue(null);
      const result = await getCache("missing-key");
      expect(result).toBeNull();
    });

    it("Redis 에러 발생 시 null을 반환해야 한다", async () => {
      mockGet.mockRejectedValue(new Error("Redis connection error"));
      const result = await getCache("error-key");
      expect(result).toBeNull();
    });
  });

  describe("setCache", () => {
    it("TTL 없이 캐시를 저장해야 한다", async () => {
      await setCache("test-key", { data: "test" });
      expect(mockSet).toHaveBeenCalledWith("test-key", { data: "test" });
    });

    it("TTL과 함께 캐시를 저장해야 한다", async () => {
      await setCache("test-key", { data: "test" }, 3600);
      expect(mockSet).toHaveBeenCalledWith("test-key", { data: "test" }, { ex: 3600 });
    });

    it("Redis 에러 발생 시 조용히 무시해야 한다", async () => {
      mockSet.mockRejectedValue(new Error("Redis error"));
      await expect(setCache("test-key", { data: "test" })).resolves.not.toThrow();
    });
  });

  describe("deleteCache", () => {
    it("캐시를 삭제해야 한다", async () => {
      await deleteCache("test-key");
      expect(mockDel).toHaveBeenCalledWith("test-key");
    });

    it("Redis 에러 발생 시 조용히 무시해야 한다", async () => {
      mockDel.mockRejectedValue(new Error("Redis error"));
      await expect(deleteCache("test-key")).resolves.not.toThrow();
    });
  });

  describe("getCacheWithFallback", () => {
    it("캐시 히트 시 캐시 데이터를 반환해야 한다", async () => {
      mockGet.mockResolvedValue({ data: "cached" });
      const fallback = vi.fn().mockResolvedValue({ data: "fallback" });

      const result = await getCacheWithFallback("test-key", fallback);

      expect(result).toEqual({ data: "cached" });
      expect(fallback).not.toHaveBeenCalled();
      expect(mockSet).not.toHaveBeenCalled();
    });

    it("캐시 미스 시 fallback 실행 후 캐시에 저장해야 한다", async () => {
      mockGet.mockResolvedValue(null);
      const fallback = vi.fn().mockResolvedValue({ data: "fallback" });

      const result = await getCacheWithFallback("test-key", fallback, 3600);

      expect(result).toEqual({ data: "fallback" });
      expect(fallback).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith("test-key", { data: "fallback" }, { ex: 3600 });
    });

    it("TTL 없이도 fallback 결과를 저장해야 한다", async () => {
      mockGet.mockResolvedValue(null);
      const fallback = vi.fn().mockResolvedValue({ data: "fallback" });

      await getCacheWithFallback("test-key", fallback);

      expect(mockSet).toHaveBeenCalledWith("test-key", { data: "fallback" });
    });
  });
});

describe("사업자 정보 캐시 함수", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBusinessInfo: UnifiedBusinessInfo = {
    businessNumber: "123-45-67890",
    companyName: "테스트 주식회사",
    companyNameEng: "Test Inc.",
    ceoName: "홍길동",
    address: "서울특별시 강남구",
    location: "서울",
    industryCode: "software",
    employeeCount: 50,
    establishedDate: "2020-01-01",
    homepage: "https://test.com",
    ntsStatus: "계속사업자",
    taxType: "부가가치세 일반과세자",
    stockCode: null,
    stockMarket: null,
    sources: ["NTS", "NPS"],
  };

  describe("getBusinessCache", () => {
    it("사업자 정보 캐시를 조회해야 한다", async () => {
      mockGet.mockResolvedValue(mockBusinessInfo);
      const result = await getBusinessCache("123-45-67890");
      expect(result).toEqual(mockBusinessInfo);
      expect(mockGet).toHaveBeenCalledWith("business:123-45-67890");
    });
  });

  describe("setBusinessCache", () => {
    it("사업자 정보를 캐시에 저장해야 한다", async () => {
      await setBusinessCache("123-45-67890", mockBusinessInfo);
      expect(mockSet).toHaveBeenCalledWith(
        "business:123-45-67890",
        mockBusinessInfo,
        { ex: CACHE_TTL.BUSINESS_FULL }
      );
    });
  });

  describe("deleteBusinessCache", () => {
    it("사업자 정보 캐시를 삭제해야 한다", async () => {
      await deleteBusinessCache("123-45-67890");
      expect(mockDel).toHaveBeenCalledWith("business:123-45-67890");
    });
  });
});

describe("AI 매칭 결과 캐시 함수", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMatchingResult: CachedMatchingResult = {
    match: {
      id: "match-123",
      company_id: "company-456",
      announcement_id: "ann-789",
      match_score: 85,
      analysis: {
        overallScore: 85,
        scores: {
          eligibility: 90,
          businessAlignment: 85,
          technicalFeasibility: 80,
          fundingAdequacy: 85,
          executionCapability: 85,
        },
        eligibilityDetails: {},
        strengths: ["강점1"],
        weaknesses: ["약점1"],
        recommendations: ["추천1"],
      },
      created_at: "2026-01-27T00:00:00.000Z",
      updated_at: "2026-01-27T00:00:00.000Z",
    },
    analysis: {
      overallScore: 85,
      scores: {
        eligibility: 90,
        businessAlignment: 85,
        technicalFeasibility: 80,
        fundingAdequacy: 85,
        executionCapability: 85,
      },
      eligibilityDetails: {},
      strengths: ["강점1"],
      weaknesses: ["약점1"],
      recommendations: ["추천1"],
    },
  };

  describe("getMatchingCache", () => {
    it("매칭 결과 캐시를 조회해야 한다", async () => {
      mockGet.mockResolvedValue(mockMatchingResult);
      const result = await getMatchingCache("company-456", "ann-789");
      expect(result).toEqual(mockMatchingResult);
      expect(mockGet).toHaveBeenCalledWith("matching:company-456:ann-789");
    });
  });

  describe("setMatchingCache", () => {
    it("매칭 결과를 캐시에 저장해야 한다", async () => {
      await setMatchingCache("company-456", "ann-789", mockMatchingResult);
      expect(mockSet).toHaveBeenCalledWith(
        "matching:company-456:ann-789",
        mockMatchingResult,
        { ex: CACHE_TTL.AI_MATCHING }
      );
    });
  });
});
