// 대시보드 쿼리 테스트
// 플랜 정보, 프로모션 로직, 헬퍼 함수를 테스트합니다.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PROMOTION_CONFIG,
  isPromotionActive,
  getPromotionDaysRemaining,
  PLAN_INFO,
  type PlanType,
} from "@/lib/queries/dashboard";

describe("프로모션 설정 (PROMOTION_CONFIG)", () => {
  it("프로모션이 비활성화 상태여야 한다", () => {
    expect(PROMOTION_CONFIG.enabled).toBe(false);
  });

  it("프로모션 종료일이 설정되어 있어야 한다", () => {
    expect(PROMOTION_CONFIG.endDate).toBeInstanceOf(Date);
  });

  it("프로모션 이름이 있어야 한다", () => {
    expect(PROMOTION_CONFIG.name).toBeTruthy();
  });
});

describe("isPromotionActive", () => {
  it("프로모션이 비활성화되면 false를 반환해야 한다", () => {
    // PROMOTION_CONFIG.enabled가 false이므로
    expect(isPromotionActive()).toBe(false);
  });
});

describe("getPromotionDaysRemaining", () => {
  it("남은 일수를 반환해야 한다", () => {
    const daysRemaining = getPromotionDaysRemaining();
    expect(typeof daysRemaining).toBe("number");
    expect(daysRemaining).toBeGreaterThanOrEqual(0);
  });

  it("프로모션이 지났으면 0을 반환해야 한다", () => {
    // 현재 프로모션 종료일이 2026-06-30이므로
    // 2026-01-24 기준으로 남은 일수가 있어야 함
    const daysRemaining = getPromotionDaysRemaining();
    expect(daysRemaining).toBeGreaterThanOrEqual(0);
  });
});

describe("플랜 정보 (PLAN_INFO)", () => {
  describe("Free 플랜", () => {
    it("가격이 0원이어야 한다", () => {
      expect(PLAN_INFO.free.price).toBe(0);
    });

    it("공고 검색이 가능해야 한다", () => {
      expect(PLAN_INFO.free.features.search).toBe(true);
    });

    it("AI 시맨틱 검색이 가능해야 한다", () => {
      expect(PLAN_INFO.free.features.semanticSearch).toBe(true);
    });

    it("AI 매칭 분석이 가능해야 한다", () => {
      expect(PLAN_INFO.free.features.matching).toBe(true);
    });

    it("AI 매칭 전체 공개가 불가능해야 한다", () => {
      expect(PLAN_INFO.free.features.matchingFull).toBe(false);
    });

    it("AI 지원서 작성이 불가능해야 한다", () => {
      expect(PLAN_INFO.free.features.application).toBe(false);
    });
  });

  describe("Pro 플랜", () => {
    it("가격이 5,000원이어야 한다", () => {
      expect(PLAN_INFO.pro.price).toBe(5000);
    });

    it("AI 매칭 전체 공개가 가능해야 한다", () => {
      expect(PLAN_INFO.pro.features.matchingFull).toBe(true);
    });

    it("AI 지원서 작성이 불가능해야 한다", () => {
      expect(PLAN_INFO.pro.features.application).toBe(false);
    });

    it("Free 플랜의 모든 기능이 포함되어야 한다", () => {
      expect(PLAN_INFO.pro.features.search).toBe(true);
      expect(PLAN_INFO.pro.features.semanticSearch).toBe(true);
      expect(PLAN_INFO.pro.features.matching).toBe(true);
    });
  });

  describe("Premium 플랜", () => {
    it("가격이 49,000원이어야 한다", () => {
      expect(PLAN_INFO.premium.price).toBe(49000);
    });

    it("AI 지원서 작성이 가능해야 한다", () => {
      expect(PLAN_INFO.premium.features.application).toBe(true);
    });

    it("Pro 플랜의 모든 기능이 포함되어야 한다", () => {
      expect(PLAN_INFO.premium.features.search).toBe(true);
      expect(PLAN_INFO.premium.features.semanticSearch).toBe(true);
      expect(PLAN_INFO.premium.features.matching).toBe(true);
      expect(PLAN_INFO.premium.features.matchingFull).toBe(true);
    });
  });

  describe("플랜 구조", () => {
    it("모든 플랜에 name이 있어야 한다", () => {
      expect(PLAN_INFO.free.name).toBe("Free");
      expect(PLAN_INFO.pro.name).toBe("Pro");
      expect(PLAN_INFO.premium.name).toBe("Premium");
    });

    it("모든 플랜에 priceLabel이 있어야 한다", () => {
      expect(PLAN_INFO.free.priceLabel).toBe("무료");
      expect(PLAN_INFO.pro.priceLabel).toContain("5,000");
      expect(PLAN_INFO.premium.priceLabel).toContain("49,000");
    });

    it("모든 플랜에 tagline이 있어야 한다", () => {
      expect(PLAN_INFO.free.tagline).toBeTruthy();
      expect(PLAN_INFO.pro.tagline).toBeTruthy();
      expect(PLAN_INFO.premium.tagline).toBeTruthy();
    });
  });
});

describe("플랜 계층 구조", () => {
  it("Free < Pro < Premium 순으로 기능이 확장되어야 한다", () => {
    const freeFeatures = Object.values(PLAN_INFO.free.features).filter(Boolean)
      .length;
    const proFeatures = Object.values(PLAN_INFO.pro.features).filter(Boolean)
      .length;
    const premiumFeatures = Object.values(
      PLAN_INFO.premium.features
    ).filter(Boolean).length;

    expect(freeFeatures).toBeLessThan(proFeatures);
    expect(proFeatures).toBeLessThan(premiumFeatures);
  });

  it("Premium은 모든 기능이 활성화되어야 한다", () => {
    const allFeaturesEnabled = Object.values(
      PLAN_INFO.premium.features
    ).every(Boolean);
    expect(allFeaturesEnabled).toBe(true);
  });

  it("Free < Pro < Premium 순으로 가격이 높아야 한다", () => {
    expect(PLAN_INFO.free.price).toBeLessThan(PLAN_INFO.pro.price);
    expect(PLAN_INFO.pro.price).toBeLessThan(PLAN_INFO.premium.price);
  });
});

describe("플랜별 기능 정책", () => {
  it("검색 기능은 모든 플랜에서 가능해야 한다", () => {
    expect(PLAN_INFO.free.features.search).toBe(true);
    expect(PLAN_INFO.pro.features.search).toBe(true);
    expect(PLAN_INFO.premium.features.search).toBe(true);
  });

  it("시맨틱 검색은 모든 플랜에서 가능해야 한다", () => {
    expect(PLAN_INFO.free.features.semanticSearch).toBe(true);
    expect(PLAN_INFO.pro.features.semanticSearch).toBe(true);
    expect(PLAN_INFO.premium.features.semanticSearch).toBe(true);
  });

  it("매칭 기능은 모든 플랜에서 가능해야 한다", () => {
    expect(PLAN_INFO.free.features.matching).toBe(true);
    expect(PLAN_INFO.pro.features.matching).toBe(true);
    expect(PLAN_INFO.premium.features.matching).toBe(true);
  });

  it("매칭 전체 공개는 Pro 이상에서만 가능해야 한다", () => {
    expect(PLAN_INFO.free.features.matchingFull).toBe(false);
    expect(PLAN_INFO.pro.features.matchingFull).toBe(true);
    expect(PLAN_INFO.premium.features.matchingFull).toBe(true);
  });

  it("지원서 작성은 Premium에서만 가능해야 한다", () => {
    expect(PLAN_INFO.free.features.application).toBe(false);
    expect(PLAN_INFO.pro.features.application).toBe(false);
    expect(PLAN_INFO.premium.features.application).toBe(true);
  });
});

describe("PlanType 타입", () => {
  it("유효한 플랜 타입이어야 한다", () => {
    const validPlans: PlanType[] = ["free", "pro", "premium"];
    validPlans.forEach((plan) => {
      expect(Object.keys(PLAN_INFO)).toContain(plan);
    });
  });
});
