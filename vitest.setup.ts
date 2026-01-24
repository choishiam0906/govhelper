// Vitest 글로벌 셋업
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// jest-dom matchers 확장
expect.extend(matchers);

// 각 테스트 후 cleanup
afterEach(() => {
  cleanup();
});

// 환경 변수 모킹
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "test-gemini-key");
vi.stubEnv("TOSS_PAYMENTS_SECRET_KEY", "test-toss-secret");

// fetch 모킹 (필요시)
global.fetch = vi.fn();

// ResizeObserver 모킹 (브라우저 API)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserver 모킹
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
