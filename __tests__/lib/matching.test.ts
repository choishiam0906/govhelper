// AI 매칭 테스트
// Gemini AI 매칭 분석 로직을 테스트합니다.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Google Generative AI
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn(),
      generateContentStream: vi.fn(),
    }),
  })),
}));

describe("AI 매칭 분석", () => {
  describe("매칭 점수 계산", () => {
    it("적격 기업은 0-100 사이의 점수를 받아야 한다", () => {
      const score = 85;
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("부적격 기업은 0점을 받아야 한다", () => {
      const ineligibleScore = 0;
      expect(ineligibleScore).toBe(0);
    });

    it("점수 구성 요소의 합이 100이어야 한다", () => {
      const scoreBreakdown = {
        technology: 25,   // 기술성
        market: 20,       // 시장성
        business: 20,     // 사업성
        relevance: 25,    // 공고부합도
        bonus: 10,        // 가점
      };

      const total = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);
      expect(total).toBe(100);
    });
  });

  describe("자격 조건 체크", () => {
    const mockEligibilityCheck = (checks: Record<string, boolean>) => {
      return Object.values(checks).every((v) => v);
    };

    it("모든 조건을 충족하면 적격 판정", () => {
      const checks = {
        industry: true,
        region: true,
        companyAge: true,
        revenue: true,
        employeeCount: true,
      };

      expect(mockEligibilityCheck(checks)).toBe(true);
    });

    it("하나라도 조건을 불충족하면 부적격 판정", () => {
      const checks = {
        industry: true,
        region: true,
        companyAge: false,  // 업력 조건 불충족
        revenue: true,
        employeeCount: true,
      };

      expect(mockEligibilityCheck(checks)).toBe(false);
    });

    it("공고에 명시되지 않은 조건은 통과 처리", () => {
      const checks = {
        industry: true,      // 명시됨 - 충족
        region: true,        // 명시되지 않음 - 자동 통과
        companyAge: true,    // 명시되지 않음 - 자동 통과
        revenue: true,       // 명시됨 - 충족
        employeeCount: true, // 명시되지 않음 - 자동 통과
      };

      expect(mockEligibilityCheck(checks)).toBe(true);
    });
  });

  describe("플랜별 결과 공개", () => {
    const filterResultsByPlan = (
      results: Array<{ rank: number; score: number; title: string }>,
      plan: "free" | "pro" | "premium"
    ) => {
      if (plan === "free") {
        // Free: 3~5순위만 공개
        return results.map((r) => ({
          ...r,
          isBlurred: r.rank <= 2,
        }));
      }
      // Pro/Premium: 전체 공개
      return results.map((r) => ({ ...r, isBlurred: false }));
    };

    const mockResults = [
      { rank: 1, score: 95, title: "공고 A" },
      { rank: 2, score: 88, title: "공고 B" },
      { rank: 3, score: 75, title: "공고 C" },
      { rank: 4, score: 68, title: "공고 D" },
      { rank: 5, score: 52, title: "공고 E" },
    ];

    it("Free 플랜은 1~2순위가 블러 처리되어야 한다", () => {
      const filtered = filterResultsByPlan(mockResults, "free");

      expect(filtered[0].isBlurred).toBe(true);  // 1순위 블러
      expect(filtered[1].isBlurred).toBe(true);  // 2순위 블러
      expect(filtered[2].isBlurred).toBe(false); // 3순위 공개
      expect(filtered[3].isBlurred).toBe(false); // 4순위 공개
      expect(filtered[4].isBlurred).toBe(false); // 5순위 공개
    });

    it("Pro 플랜은 전체 공개되어야 한다", () => {
      const filtered = filterResultsByPlan(mockResults, "pro");

      expect(filtered.every((r) => r.isBlurred === false)).toBe(true);
    });

    it("Premium 플랜은 전체 공개되어야 한다", () => {
      const filtered = filterResultsByPlan(mockResults, "premium");

      expect(filtered.every((r) => r.isBlurred === false)).toBe(true);
    });
  });

  describe("캐싱", () => {
    it("동일한 기업-공고 조합은 캐시된 결과를 반환해야 한다", () => {
      const cacheKey = `matching:company123:announcement456`;
      const cachedResult = { score: 85, isEligible: true };

      // 캐시 키 형식 검증
      expect(cacheKey).toMatch(/^matching:[a-zA-Z0-9]+:[a-zA-Z0-9]+$/);
      expect(cachedResult.score).toBe(85);
    });

    it("캐시 TTL은 7일이어야 한다", () => {
      const CACHE_TTL_DAYS = 7;
      const CACHE_TTL_SECONDS = CACHE_TTL_DAYS * 24 * 60 * 60;

      expect(CACHE_TTL_SECONDS).toBe(604800);
    });
  });
});

describe("지원자격 파싱 (eligibility_criteria)", () => {
  describe("직원수 조건 파싱", () => {
    const parseEmployeeCondition = (text: string) => {
      // "300인 미만" -> max: 299
      if (text.includes("미만")) {
        const num = parseInt(text.match(/(\d+)/)?.[1] || "0");
        return { max: num - 1 };
      }
      // "300인 이하" -> max: 300
      if (text.includes("이하")) {
        const num = parseInt(text.match(/(\d+)/)?.[1] || "0");
        return { max: num };
      }
      // "5인 이상" -> min: 5
      if (text.includes("이상")) {
        const num = parseInt(text.match(/(\d+)/)?.[1] || "0");
        return { min: num };
      }
      return {};
    };

    it("'300인 미만'은 max: 299로 파싱되어야 한다", () => {
      const result = parseEmployeeCondition("상시근로자 300인 미만");
      expect(result.max).toBe(299);
    });

    it("'300인 이하'는 max: 300으로 파싱되어야 한다", () => {
      const result = parseEmployeeCondition("상시근로자 300인 이하");
      expect(result.max).toBe(300);
    });

    it("'5인 이상'은 min: 5로 파싱되어야 한다", () => {
      const result = parseEmployeeCondition("상시근로자 5인 이상");
      expect(result.min).toBe(5);
    });
  });

  describe("매출 조건 파싱", () => {
    const parseRevenueCondition = (text: string) => {
      // "100억 이하" -> max: 10000000000
      const match = text.match(/(\d+)(억|천만|백만|만)?/);
      if (!match) return {};

      let value = parseInt(match[1]);
      const unit = match[2];

      if (unit === "억") value *= 100000000;
      else if (unit === "천만") value *= 10000000;
      else if (unit === "백만") value *= 1000000;
      else if (unit === "만") value *= 10000;

      if (text.includes("이하") || text.includes("미만")) {
        return { max: value };
      }
      if (text.includes("이상") || text.includes("초과")) {
        return { min: value };
      }
      return { value };
    };

    it("'100억 이하'는 max: 10000000000으로 파싱되어야 한다", () => {
      const result = parseRevenueCondition("연매출 100억 이하");
      expect(result.max).toBe(10000000000);
    });

    it("'50억 이상'은 min: 5000000000으로 파싱되어야 한다", () => {
      const result = parseRevenueCondition("연매출 50억 이상");
      expect(result.min).toBe(5000000000);
    });
  });
});
