import { test, expect } from '@playwright/test'

test.describe('랜딩 페이지', () => {
  test('랜딩 페이지 로딩', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/GovHelper/)
    await expect(page.getByText('정부지원사업')).toBeVisible()
  })

  test('무료 분석 CTA 클릭 → /try 이동', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /무료로 매칭 분석받기/i }).click()
    await expect(page).toHaveURL('/try')
  })

  test('서비스 소개 페이지 접근', async ({ page }) => {
    await page.goto('/about')
    await expect(page.getByText(/서비스 소개/i)).toBeVisible()
  })

  test('FAQ 페이지 접근', async ({ page }) => {
    await page.goto('/faq')
    await expect(page.getByText(/자주 묻는 질문/i)).toBeVisible()
  })
})
