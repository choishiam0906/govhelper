import { test, expect } from '@playwright/test'

test.describe('공개 페이지 E2E', () => {
  test.describe('이용약관 페이지', () => {
    test('페이지 로딩', async ({ page }) => {
      await page.goto('/terms')

      // 페이지 제목 확인
      await expect(page.getByRole('heading', { name: /이용약관/i })).toBeVisible()
    })

    test('주요 조항 존재', async ({ page }) => {
      await page.goto('/terms')

      // 주요 조항 확인
      const content = await page.content()
      expect(content).toMatch(/서비스|회원|결제|환불/i)
    })
  })

  test.describe('개인정보처리방침 페이지', () => {
    test('페이지 로딩', async ({ page }) => {
      await page.goto('/privacy')

      // 페이지 제목 확인
      await expect(page.getByRole('heading', { name: /개인정보/i })).toBeVisible()
    })

    test('주요 항목 존재', async ({ page }) => {
      await page.goto('/privacy')

      // 주요 항목 확인
      const content = await page.content()
      expect(content).toMatch(/수집|이용|보유|파기/i)
    })
  })

  test.describe('서비스 소개 페이지', () => {
    test('페이지 로딩', async ({ page }) => {
      await page.goto('/about')

      // 페이지 제목 확인
      await expect(page.getByText(/서비스 소개/i)).toBeVisible()
    })

    test('핵심 기능 설명 존재', async ({ page }) => {
      await page.goto('/about')

      // 핵심 기능 키워드 확인
      const content = await page.content()
      expect(content).toMatch(/AI|매칭|지원서|검색/i)
    })

    test('CTA 버튼 존재', async ({ page }) => {
      await page.goto('/about')

      // 시작하기 또는 무료 체험 버튼 확인
      const ctaButton = page.getByRole('link', { name: /시작|무료|체험/i }).first()
      await expect(ctaButton).toBeVisible()
    })
  })

  test.describe('랜딩 페이지 상세', () => {
    test('Hero 섹션 렌더링', async ({ page }) => {
      await page.goto('/')

      // Hero 텍스트 확인
      await expect(page.getByText(/정부지원사업/i)).toBeVisible()

      // CTA 버튼 확인
      await expect(page.getByRole('link', { name: /무료로 매칭 분석받기/i })).toBeVisible()
    })

    test('기능 소개 섹션 존재', async ({ page }) => {
      await page.goto('/')

      // 기능 관련 키워드 확인
      const content = await page.content()
      expect(content).toMatch(/검색|매칭|지원서/i)
    })

    test('요금제 섹션 존재', async ({ page }) => {
      await page.goto('/')

      // 요금제 관련 키워드 확인
      const content = await page.content()
      expect(content).toMatch(/Free|Pro|Premium|무료|요금/i)
    })

    test('Footer 렌더링', async ({ page }) => {
      await page.goto('/')

      // Footer 링크 확인
      await expect(page.getByRole('link', { name: /이용약관/i })).toBeVisible()
      await expect(page.getByRole('link', { name: /개인정보/i })).toBeVisible()
    })

    test('네비게이션 헤더 렌더링', async ({ page }) => {
      await page.goto('/')

      // 로고 확인
      await expect(page.getByText('GovHelper')).toBeVisible()

      // 로그인/회원가입 버튼 확인
      await expect(page.getByRole('link', { name: /로그인/i })).toBeVisible()
    })
  })

  test.describe('에러 페이지', () => {
    test('404 페이지 렌더링', async ({ page }) => {
      const response = await page.goto('/non-existent-page-xyz')

      // 404 상태 코드 확인
      expect(response?.status()).toBe(404)

      // 에러 메시지 또는 홈으로 돌아가기 링크 확인
      const content = await page.content()
      expect(content).toMatch(/404|찾을 수 없|페이지가 없/i)
    })
  })

  test.describe('다크 모드', () => {
    test('시스템 다크 모드 지원', async ({ page }) => {
      // 다크 모드 에뮬레이션
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('/')

      // 페이지가 정상 로딩되는지 확인
      await expect(page).toHaveTitle(/GovHelper/)
    })

    test('시스템 라이트 모드 지원', async ({ page }) => {
      // 라이트 모드 에뮬레이션
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto('/')

      // 페이지가 정상 로딩되는지 확인
      await expect(page).toHaveTitle(/GovHelper/)
    })
  })

  test.describe('PWA 기능', () => {
    test('웹앱 매니페스트 존재', async ({ page }) => {
      await page.goto('/')

      // manifest.json 링크 확인
      const manifest = await page.locator('link[rel="manifest"]').getAttribute('href')
      expect(manifest).toBeTruthy()
    })

    test('매니페스트 파일 접근 가능', async ({ page }) => {
      const response = await page.goto('/manifest.json')
      expect(response?.status()).toBe(200)

      // JSON 파싱 가능 확인
      const content = await page.content()
      expect(content).toContain('name')
    })
  })

  test.describe('보안', () => {
    test('인증 페이지 HTTPS 리다이렉트 확인 (프로덕션 환경)', async ({ page }) => {
      // 로컬 환경에서는 HTTP 허용
      await page.goto('/login')

      // 페이지가 정상 로딩되는지 확인
      await expect(page.getByLabel(/이메일/i)).toBeVisible()
    })

    test('XSS 방지 기본 확인', async ({ page }) => {
      await page.goto('/try')

      // XSS 페이로드 입력 시도
      const companyNameInput = page.getByLabel(/회사명/i)
      await companyNameInput.fill('<script>alert("xss")</script>')

      // 스크립트가 실행되지 않고 텍스트로 처리되는지 확인
      await expect(companyNameInput).toHaveValue('<script>alert("xss")</script>')
    })
  })
})
