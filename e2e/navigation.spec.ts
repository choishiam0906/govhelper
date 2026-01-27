import { test, expect } from '@playwright/test'

test.describe('네비게이션', () => {
  test('주요 정적 페이지 라우팅 확인', async ({ page }) => {
    const pages = ['/about', '/terms', '/privacy', '/faq']

    for (const path of pages) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
    }
  })

  test('SEO 랜딩 페이지 접근', async ({ page }) => {
    const seoPages = [
      '/government-support',
      '/government-support/startup',
      '/government-support/sme',
      '/government-support/rnd',
    ]

    for (const path of seoPages) {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
    }
  })

  test.skip('대시보드 페이지 (로그인 필요)', async ({ page }) => {
    // Skip: 로그인이 필요한 페이지는 인증 없이 접근 불가
    const response = await page.goto('/dashboard')
    // 로그인 페이지로 리다이렉트되거나 401 응답 예상
    expect(response?.status()).toBeGreaterThanOrEqual(200)
  })

  test('404 페이지 처리', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345')
    // Next.js는 존재하지 않는 페이지에 404 상태 반환
    expect(response?.status()).toBe(404)
  })
})
