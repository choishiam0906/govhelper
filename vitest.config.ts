import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // 테스트 환경
    environment: "jsdom",

    // 글로벌 설정 (describe, it, expect 등)
    globals: true,

    // 테스트 파일 패턴
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],

    // 제외 패턴
    exclude: ["node_modules", ".next", "dist"],

    // 셋업 파일
    setupFiles: ["./vitest.setup.ts"],

    // 커버리지 설정
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/**",
      ],
    },

    // 타임아웃
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
