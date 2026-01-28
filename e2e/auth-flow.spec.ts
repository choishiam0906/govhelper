import { test, expect } from '@playwright/test'

test.describe('인증 플로우 E2E', () => {
  test.describe('로그인 페이지', () => {
    test('폼 요소 렌더링 확인', async ({ page }) => {
      await page.goto('/login')

      // 기본 폼 요소 확인
      await expect(page.getByLabel(/이메일/i)).toBeVisible()
      await expect(page.getByLabel(/비밀번호/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible()

      // 소셜 로그인 버튼 확인
      await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /카카오/i })).toBeVisible()
    })

    test('빈 폼 제출 시 유효성 검사', async ({ page }) => {
      await page.goto('/login')

      // 빈 상태로 로그인 버튼 클릭
      await page.getByRole('button', { name: /로그인/i }).click()

      // HTML5 기본 유효성 검사 또는 커스텀 에러 메시지 확인
      const emailInput = page.getByLabel(/이메일/i)
      const isInvalid = await emailInput.evaluate((el) => {
        const input = el as HTMLInputElement
        return !input.validity.valid
      })
      expect(isInvalid).toBeTruthy()
    })

    test('잘못된 이메일 형식 유효성 검사', async ({ page }) => {
      await page.goto('/login')

      // 잘못된 이메일 형식 입력
      await page.getByLabel(/이메일/i).fill('invalid-email')
      await page.getByLabel(/비밀번호/i).fill('password123')
      await page.getByRole('button', { name: /로그인/i }).click()

      // 이메일 유효성 검사 실패 확인
      const emailInput = page.getByLabel(/이메일/i)
      const isInvalid = await emailInput.evaluate((el) => {
        const input = el as HTMLInputElement
        return !input.validity.valid
      })
      expect(isInvalid).toBeTruthy()
    })

    test('비밀번호 찾기 링크', async ({ page }) => {
      await page.goto('/login')

      // 비밀번호 찾기 링크 클릭
      await page.getByRole('link', { name: /비밀번호를 잊으셨나요/i }).click()
      await expect(page).toHaveURL('/forgot-password')
    })

    test('회원가입 링크', async ({ page }) => {
      await page.goto('/login')

      // 회원가입 링크 클릭
      await page.getByRole('link', { name: /회원가입/i }).click()
      await expect(page).toHaveURL('/register')
    })
  })

  test.describe('회원가입 페이지', () => {
    test('폼 요소 렌더링 확인', async ({ page }) => {
      await page.goto('/register')

      // 기본 폼 요소 확인
      await expect(page.getByLabel(/이메일/i)).toBeVisible()
      await expect(page.getByLabel(/비밀번호/i).first()).toBeVisible()
      await expect(page.getByRole('button', { name: /회원가입/i })).toBeVisible()

      // 소셜 로그인 버튼 확인
      await expect(page.getByRole('button', { name: /Google/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /카카오/i })).toBeVisible()
    })

    test('이용약관/개인정보처리방침 링크', async ({ page }) => {
      await page.goto('/register')

      // 이용약관 링크 확인
      const termsLink = page.getByRole('link', { name: /이용약관/i })
      await expect(termsLink).toBeVisible()

      // 개인정보처리방침 링크 확인
      const privacyLink = page.getByRole('link', { name: /개인정보처리방침/i })
      await expect(privacyLink).toBeVisible()
    })

    test('로그인 페이지 링크', async ({ page }) => {
      await page.goto('/register')

      // 로그인 링크 클릭
      await page.getByRole('link', { name: /로그인/i }).click()
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('비밀번호 찾기 페이지', () => {
    test('폼 요소 렌더링 확인', async ({ page }) => {
      await page.goto('/forgot-password')

      // 기본 폼 요소 확인
      await expect(page.getByLabel(/이메일/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /재설정 링크 보내기/i })).toBeVisible()
    })

    test('빈 이메일 제출 시 유효성 검사', async ({ page }) => {
      await page.goto('/forgot-password')

      // 빈 상태로 제출
      await page.getByRole('button', { name: /재설정 링크 보내기/i }).click()

      // HTML5 유효성 검사 확인
      const emailInput = page.getByLabel(/이메일/i)
      const isInvalid = await emailInput.evaluate((el) => {
        const input = el as HTMLInputElement
        return !input.validity.valid
      })
      expect(isInvalid).toBeTruthy()
    })

    test('로그인 페이지로 돌아가기', async ({ page }) => {
      await page.goto('/forgot-password')

      // 로그인 페이지 링크 클릭
      await page.getByRole('link', { name: /로그인으로 돌아가기/i }).click()
      await expect(page).toHaveURL('/login')
    })
  })

  test.describe('접근성', () => {
    test('로그인 페이지 기본 접근성', async ({ page }) => {
      await page.goto('/login')

      // 모든 폼 요소가 레이블을 가지고 있는지 확인
      const emailInput = page.getByLabel(/이메일/i)
      await expect(emailInput).toBeVisible()

      const passwordInput = page.getByLabel(/비밀번호/i)
      await expect(passwordInput).toBeVisible()

      // 탭 네비게이션 확인
      await emailInput.focus()
      expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('INPUT')
    })
  })
})
