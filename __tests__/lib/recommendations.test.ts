// 추천 로직 테스트
// 업종/지역 매핑, 점수 계산, 필터링 로직을 테스트합니다.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isIndustryMatch,
  isRegionMatch,
  isIndustryExcluded,
  isRegionExcluded,
  hasCertificationMatch,
  getIndustryLabel,
  getLocationLabel,
  nationwideKeywords,
} from "@/lib/recommendations/mappings";
import {
  filterAndScoreAnnouncements,
  getScoreGrade,
} from "@/lib/recommendations/filter";
import type {
  CompanyInfo,
  AnnouncementForRecommendation,
} from "@/lib/recommendations/types";

describe("업종 매핑 (Industry Matching)", () => {
  describe("isIndustryMatch", () => {
    it("회사 업종이 공고 업종에 포함되면 true를 반환해야 한다", () => {
      expect(isIndustryMatch("software", ["IT", "소프트웨어"])).toBe(true);
      expect(isIndustryMatch("software", ["정보통신업"])).toBe(true);
    });

    it("회사 업종이 공고 업종에 포함되지 않으면 false를 반환해야 한다", () => {
      expect(isIndustryMatch("software", ["제조업", "건설업"])).toBe(false);
    });

    it("공고 업종이 비어있으면 true를 반환해야 한다", () => {
      expect(isIndustryMatch("software", [])).toBe(true);
    });

    it("회사 업종이 null이면 true를 반환해야 한다", () => {
      expect(isIndustryMatch(null, ["IT", "소프트웨어"])).toBe(true);
    });

    it("AI 업종 매칭이 정상 동작해야 한다", () => {
      expect(isIndustryMatch("ai", ["인공지능", "빅데이터"])).toBe(true);
      expect(isIndustryMatch("ai", ["머신러닝"])).toBe(true);
    });

    it("제조업 매칭이 정상 동작해야 한다", () => {
      expect(isIndustryMatch("manufacturing", ["제조업"])).toBe(true);
      expect(isIndustryMatch("manufacturing", ["전자부품", "기계"])).toBe(true);
    });
  });

  describe("isIndustryExcluded", () => {
    it("회사 업종이 제외 목록에 포함되면 true를 반환해야 한다", () => {
      expect(isIndustryExcluded("fintech", ["금융업", "보험업"])).toBe(true);
    });

    it("회사 업종이 제외 목록에 없으면 false를 반환해야 한다", () => {
      expect(isIndustryExcluded("software", ["금융업", "보험업"])).toBe(false);
    });

    it("제외 목록이 비어있으면 false를 반환해야 한다", () => {
      expect(isIndustryExcluded("software", [])).toBe(false);
    });

    it("회사 업종이 null이면 false를 반환해야 한다", () => {
      expect(isIndustryExcluded(null, ["금융업"])).toBe(false);
    });
  });
});

describe("지역 매핑 (Region Matching)", () => {
  describe("isRegionMatch", () => {
    it("회사 지역이 공고 지역에 포함되면 true를 반환해야 한다", () => {
      expect(isRegionMatch("seoul", ["서울", "경기"])).toBe(true);
      expect(isRegionMatch("busan", ["부산광역시"])).toBe(true);
    });

    it("회사 지역이 공고 지역에 포함되지 않으면 false를 반환해야 한다", () => {
      expect(isRegionMatch("seoul", ["부산", "대구"])).toBe(false);
    });

    it("전국이면 true를 반환해야 한다", () => {
      expect(isRegionMatch("seoul", ["전국"])).toBe(true);
      expect(isRegionMatch("jeju", ["전지역"])).toBe(true);
      expect(isRegionMatch("busan", ["제한없음"])).toBe(true);
    });

    it("수도권이면 서울/경기/인천 회사는 true를 반환해야 한다", () => {
      expect(isRegionMatch("seoul", ["수도권"])).toBe(true);
      expect(isRegionMatch("gyeonggi", ["수도권"])).toBe(true);
      expect(isRegionMatch("incheon", ["수도권"])).toBe(true);
      expect(isRegionMatch("busan", ["수도권"])).toBe(false);
    });

    it("공고 지역이 비어있으면 true를 반환해야 한다", () => {
      expect(isRegionMatch("seoul", [])).toBe(true);
    });

    it("회사 지역이 null이면 true를 반환해야 한다", () => {
      expect(isRegionMatch(null, ["서울"])).toBe(true);
    });
  });

  describe("isRegionExcluded", () => {
    it("회사 지역이 제외 목록에 포함되면 true를 반환해야 한다", () => {
      expect(isRegionExcluded("seoul", ["서울특별시"])).toBe(true);
    });

    it("회사 지역이 제외 목록에 없으면 false를 반환해야 한다", () => {
      expect(isRegionExcluded("busan", ["서울"])).toBe(false);
    });

    it("제외 목록이 비어있으면 false를 반환해야 한다", () => {
      expect(isRegionExcluded("seoul", [])).toBe(false);
    });
  });
});

describe("인증 매핑 (Certification Matching)", () => {
  describe("hasCertificationMatch", () => {
    it("회사 인증이 필수 인증에 포함되면 true를 반환해야 한다", () => {
      expect(hasCertificationMatch(["venture"], ["벤처인증"])).toBe(true);
      expect(hasCertificationMatch(["innobiz"], ["이노비즈"])).toBe(true);
    });

    it("회사 인증이 필수 인증에 포함되지 않으면 false를 반환해야 한다", () => {
      expect(hasCertificationMatch(["venture"], ["메인비즈"])).toBe(false);
    });

    it("필수 인증이 없으면 true를 반환해야 한다", () => {
      expect(hasCertificationMatch([], [])).toBe(true);
      expect(hasCertificationMatch(["venture"], [])).toBe(true);
    });

    it("필수 인증이 있는데 회사 인증이 없으면 false를 반환해야 한다", () => {
      expect(hasCertificationMatch([], ["벤처인증"])).toBe(false);
      expect(hasCertificationMatch(null, ["벤처인증"])).toBe(false);
    });
  });
});

describe("라벨 변환", () => {
  describe("getIndustryLabel", () => {
    it("업종 코드를 한글 라벨로 변환해야 한다", () => {
      expect(getIndustryLabel("software")).toBe("SW 개발");
      expect(getIndustryLabel("ai")).toBe("AI/빅데이터");
      expect(getIndustryLabel("manufacturing")).toBe("제조업");
    });

    it("알 수 없는 코드는 그대로 반환해야 한다", () => {
      expect(getIndustryLabel("unknown")).toBe("unknown");
    });
  });

  describe("getLocationLabel", () => {
    it("지역 코드를 한글 라벨로 변환해야 한다", () => {
      expect(getLocationLabel("seoul")).toBe("서울");
      expect(getLocationLabel("busan")).toBe("부산");
      expect(getLocationLabel("jeju")).toBe("제주");
    });

    it("알 수 없는 코드는 그대로 반환해야 한다", () => {
      expect(getLocationLabel("unknown")).toBe("unknown");
    });
  });
});

describe("점수 등급 (Score Grade)", () => {
  describe("getScoreGrade", () => {
    it("90점 이상은 최적합이어야 한다", () => {
      const result = getScoreGrade(95);
      expect(result.grade).toBe("최적합");
      expect(result.color).toBe("green");
    });

    it("75점 이상은 적합이어야 한다", () => {
      const result = getScoreGrade(80);
      expect(result.grade).toBe("적합");
      expect(result.color).toBe("blue");
    });

    it("60점 이상은 양호이어야 한다", () => {
      const result = getScoreGrade(65);
      expect(result.grade).toBe("양호");
      expect(result.color).toBe("yellow");
    });

    it("60점 미만은 보통이어야 한다", () => {
      const result = getScoreGrade(50);
      expect(result.grade).toBe("보통");
      expect(result.color).toBe("gray");
    });

    it("경계값에서 올바른 등급을 반환해야 한다", () => {
      expect(getScoreGrade(90).grade).toBe("최적합");
      expect(getScoreGrade(89).grade).toBe("적합");
      expect(getScoreGrade(75).grade).toBe("적합");
      expect(getScoreGrade(74).grade).toBe("양호");
      expect(getScoreGrade(60).grade).toBe("양호");
      expect(getScoreGrade(59).grade).toBe("보통");
    });
  });
});

describe("공고 필터링 및 점수 계산 (filterAndScoreAnnouncements)", () => {
  const mockCompany: CompanyInfo = {
    industry: "software",
    location: "seoul",
    employeeCount: 50,
    annualRevenue: 5000, // 5천만원 (만원 단위)
    foundedDate: "2020-01-01",
    certifications: ["venture"],
  };

  const createAnnouncement = (
    id: string,
    criteria: object
  ): AnnouncementForRecommendation => ({
    id,
    title: `공고 ${id}`,
    organization: "테스트 기관",
    category: "R&D",
    support_type: "자금지원",
    support_amount: "최대 1억원",
    application_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30일 후
    eligibility_criteria: criteria as any,
  });

  it("eligibility_criteria가 없는 공고는 제외해야 한다", () => {
    const announcements: AnnouncementForRecommendation[] = [
      {
        id: "1",
        title: "테스트 공고",
        organization: "기관",
        category: "R&D",
        support_type: "자금",
        support_amount: "1억",
        application_end: "2026-12-31",
        eligibility_criteria: null,
      },
    ];

    const results = filterAndScoreAnnouncements(announcements, mockCompany);
    expect(results).toHaveLength(0);
  });

  it("제외 업종에 해당하는 공고는 제외해야 한다", () => {
    const announcements = [
      createAnnouncement("1", {
        industries: { included: [], excluded: ["IT", "소프트웨어"] },
      }),
    ];

    const results = filterAndScoreAnnouncements(announcements, mockCompany);
    expect(results).toHaveLength(0);
  });

  it("제외 지역에 해당하는 공고는 제외해야 한다", () => {
    const announcements = [
      createAnnouncement("1", {
        regions: { included: [], excluded: ["서울"] },
      }),
    ];

    const results = filterAndScoreAnnouncements(announcements, mockCompany);
    expect(results).toHaveLength(0);
  });

  it("최소 점수 미만인 공고는 제외해야 한다", () => {
    const announcements = [
      createAnnouncement("1", {
        industries: { included: ["제조업"], excluded: [] }, // 불일치 (0점)
        regions: { included: ["부산"], excluded: [] }, // 불일치 (0점)
        employeeCount: { min: 500, max: 1000 }, // 불일치 (0점) - mockCompany는 50명
        revenue: { min: 100000000000, max: null }, // 불일치 (0점) - mockCompany는 5천만원
        businessAge: { min: 20, max: 30 }, // 불일치 (0점) - mockCompany는 약 6년
        requiredCertifications: ["이노비즈"], // 불일치 (0점) - mockCompany는 벤처만
      }),
    ];

    const results = filterAndScoreAnnouncements(announcements, mockCompany, {
      minScore: 50,
    });
    expect(results).toHaveLength(0);
  });

  it("조건에 맞는 공고는 포함되어야 한다", () => {
    const announcements = [
      createAnnouncement("1", {
        industries: { included: ["IT", "소프트웨어"], excluded: [] },
        regions: { included: ["전국"], excluded: [] },
      }),
    ];

    const results = filterAndScoreAnnouncements(announcements, mockCompany, {
      minScore: 0,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("점수 높은 순으로 정렬되어야 한다", () => {
    const announcements = [
      createAnnouncement("low", {
        industries: { included: ["제조업"], excluded: [] }, // 낮은 점수
        regions: { included: ["전국"], excluded: [] },
      }),
      createAnnouncement("high", {
        industries: { included: ["소프트웨어"], excluded: [] }, // 높은 점수
        regions: { included: ["서울"], excluded: [] },
        requiredCertifications: ["벤처인증"],
      }),
    ];

    const results = filterAndScoreAnnouncements(announcements, mockCompany, {
      minScore: 0,
    });
    expect(results[0].announcement.id).toBe("high");
  });

  it("limit 옵션이 적용되어야 한다", () => {
    const announcements = Array.from({ length: 20 }, (_, i) =>
      createAnnouncement(`${i}`, {
        industries: { included: ["전체"], excluded: [] },
        regions: { included: ["전국"], excluded: [] },
      })
    );

    const results = filterAndScoreAnnouncements(announcements, mockCompany, {
      minScore: 0,
      limit: 5,
    });
    expect(results).toHaveLength(5);
  });

  it("scoreBreakdown에 각 항목별 점수가 있어야 한다", () => {
    const announcements = [
      createAnnouncement("1", {
        industries: { included: ["소프트웨어"], excluded: [] },
        regions: { included: ["서울"], excluded: [] },
        employeeCount: { min: 10, max: 100 },
        revenue: { min: 0, max: 100000000 },
        businessAge: { min: 1, max: 10 },
        requiredCertifications: ["벤처인증"],
      }),
    ];

    const results = filterAndScoreAnnouncements(announcements, mockCompany, {
      minScore: 0,
    });
    expect(results).toHaveLength(1);

    const breakdown = results[0].scoreBreakdown;
    expect(breakdown).toHaveProperty("industry");
    expect(breakdown).toHaveProperty("region");
    expect(breakdown).toHaveProperty("employeeCount");
    expect(breakdown).toHaveProperty("revenue");
    expect(breakdown).toHaveProperty("businessAge");
    expect(breakdown).toHaveProperty("certification");
    expect(breakdown).toHaveProperty("bonus");
    expect(breakdown).toHaveProperty("total");
  });
});

describe("전국 키워드", () => {
  it("nationwideKeywords에 올바른 키워드가 포함되어야 한다", () => {
    expect(nationwideKeywords).toContain("전국");
    expect(nationwideKeywords).toContain("전지역");
    expect(nationwideKeywords).toContain("제한없음");
  });
});
