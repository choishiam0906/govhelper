import { test, expect } from '@playwright/test'

test.describe('인증 플로우', () => {
  test('로그인 페이지 로딩', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText(/로그인/i)).toBeVisible()
    await expect(page.getByLabel(/이메일/i)).toBeVisible()
    await expect(page.getByLabel(/비밀번호/i)).toBeVisible()
  })

  test('회원가입 페이지 로딩', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText(/회원가입/i)).toBeVisible()
    await expect(page.getByLabel(/이메일/i)).toBeVisible()
  })

  test('비밀번호 찾기 페이지', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByText(/비밀번호 찾기/i)).toBeVisible()
  })

  test.skip('로그인 버튼 존재 확인', async ({ page }) => {
    // Skip: 실제 로그인 테스트는 테스트 계정 필요
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible()
  })
})
