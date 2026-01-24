// Rate Limit 테스트
// Rate Limiter 설정 및 헬퍼 함수를 테스트합니다.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getClientIP,
  getRateLimitHeaders,
  isRateLimitEnabled,
  type RateLimitResult,
} from "@/lib/rate-limit";

// Upstash Redis 모킹
vi.mock("@/lib/redis", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe("getClientIP", () => {
  it("x-forwarded-for 헤더에서 IP를 추출해야 한다", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "192.168.1.1, 10.0.0.1",
      },
    });
    expect(getClientIP(request)).toBe("192.168.1.1");
  });

  it("x-forwarded-for가 단일 IP일 때도 동작해야 한다", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.195",
      },
    });
    expect(getClientIP(request)).toBe("203.0.113.195");
  });

  it("x-real-ip 헤더에서 IP를 추출해야 한다", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-real-ip": "10.0.0.5",
      },
    });
    expect(getClientIP(request)).toBe("10.0.0.5");
  });

  it("x-forwarded-for가 x-real-ip보다 우선해야 한다", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "x-real-ip": "10.0.0.5",
      },
    });
    expect(getClientIP(request)).toBe("192.168.1.1");
  });

  it("헤더가 없으면 127.0.0.1을 반환해야 한다", () => {
    const request = new Request("https://example.com");
    expect(getClientIP(request)).toBe("127.0.0.1");
  });

  it("공백이 있는 IP 주소를 트림해야 한다", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "  192.168.1.1  , 10.0.0.1",
      },
    });
    expect(getClientIP(request)).toBe("192.168.1.1");
  });
});

describe("getRateLimitHeaders", () => {
  it("올바른 Rate Limit 헤더를 생성해야 한다", () => {
    const result: RateLimitResult = {
      success: true,
      limit: 100,
      remaining: 95,
      reset: 1706000000000,
    };

    const headers = getRateLimitHeaders(result);

    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBe("95");
    expect(headers["X-RateLimit-Reset"]).toBe("1706000000000");
  });

  it("remaining이 0일 때도 올바른 헤더를 생성해야 한다", () => {
    const result: RateLimitResult = {
      success: false,
      limit: 10,
      remaining: 0,
      reset: 1706000060000,
    };

    const headers = getRateLimitHeaders(result);

    expect(headers["X-RateLimit-Limit"]).toBe("10");
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
  });

  it("모든 필수 헤더가 포함되어야 한다", () => {
    const result: RateLimitResult = {
      success: true,
      limit: 60,
      remaining: 59,
      reset: 1706000000000,
    };

    const headers = getRateLimitHeaders(result);

    expect(Object.keys(headers)).toHaveLength(3);
    expect(headers).toHaveProperty("X-RateLimit-Limit");
    expect(headers).toHaveProperty("X-RateLimit-Remaining");
    expect(headers).toHaveProperty("X-RateLimit-Reset");
  });
});

describe("isRateLimitEnabled", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("Upstash 환경변수가 설정되면 true를 반환해야 한다", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token123";
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;

    expect(isRateLimitEnabled()).toBe(true);
  });

  it("Vercel KV 환경변수가 설정되면 true를 반환해야 한다", () => {
    process.env.KV_REST_API_URL = "https://kv.vercel.com";
    process.env.KV_REST_API_TOKEN = "kvtoken123";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    expect(isRateLimitEnabled()).toBe(true);
  });

  it("둘 다 설정되어 있으면 true를 반환해야 한다", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token123";
    process.env.KV_REST_API_URL = "https://kv.vercel.com";
    process.env.KV_REST_API_TOKEN = "kvtoken123";

    expect(isRateLimitEnabled()).toBe(true);
  });

  it("환경변수가 설정되지 않으면 false를 반환해야 한다", () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;

    expect(isRateLimitEnabled()).toBe(false);
  });

  it("부분적으로 설정되면 false를 반환해야 한다", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://upstash.io";
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;

    expect(isRateLimitEnabled()).toBe(false);
  });
});

describe("RateLimitResult 타입", () => {
  it("success가 true일 때 올바른 구조여야 한다", () => {
    const result: RateLimitResult = {
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    };

    expect(result.success).toBe(true);
    expect(result.limit).toBeGreaterThan(0);
    expect(result.remaining).toBeLessThanOrEqual(result.limit);
    expect(result.reset).toBeGreaterThan(Date.now());
  });

  it("success가 false일 때 remaining은 0이어야 한다", () => {
    const result: RateLimitResult = {
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
    };

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
