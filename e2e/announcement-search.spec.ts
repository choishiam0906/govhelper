import { test, expect } from '@playwright/test'

test.describe('공고 검색 E2E', () => {
  test.describe('비회원 매칭 플로우 (/try)', () => {
    test('페이지 로딩 및 초기 상태', async ({ page }) => {
      await page.goto('/try')

      // 페이지 제목 확인
      await expect(page.getByText(/기업정보를 입력해 주세요/i)).toBeVisible()
    })

    test('사업자번호 입력 필드 존재', async ({ page }) => {
      await page.goto('/try')

      // 사업자등록번호 입력 필드 확인
      await expect(page.getByLabel(/사업자등록번호/i)).toBeVisible()
    })

    test('회사명 필드 입력 가능', async ({ page }) => {
      await page.goto('/try')

      // 회사명 입력
      const companyNameInput = page.getByLabel(/회사명/i)
      await expect(companyNameInput).toBeVisible()
      await companyNameInput.fill('테스트 기업')

      // 입력 값 확인
      await expect(companyNameInput).toHaveValue('테스트 기업')
    })

    test('업종 선택 필드 존재', async ({ page }) => {
      await page.goto('/try')

      // 업종 선택 필드 확인
      await expect(page.getByText(/업종/i)).toBeVisible()
    })

    test('직원수 입력 필드 존재', async ({ page }) => {
      await page.goto('/try')

      // 직원수 입력 필드 확인
      await expect(page.getByLabel(/직원수/i)).toBeVisible()
    })
  })

  test.describe('SEO 랜딩 페이지', () => {
    test('정부지원사업 메인 페이지', async ({ page }) => {
      await page.goto('/government-support')

      // 페이지 제목 확인
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // CTA 버튼 확인
      await expect(page.getByRole('link', { name: /무료 매칭/i })).toBeVisible()
    })

    test('스타트업 지원사업 페이지', async ({ page }) => {
      await page.goto('/government-support/startup')

      // 스타트업 관련 키워드 확인
      const content = await page.content()
      expect(content).toMatch(/스타트업|창업/i)
    })

    test('중소기업 지원사업 페이지', async ({ page }) => {
      await page.goto('/government-support/sme')

      // 중소기업 관련 키워드 확인
      const content = await page.content()
      expect(content).toMatch(/중소기업/i)
    })

    test('R&D 지원사업 페이지', async ({ page }) => {
      await page.goto('/government-support/rnd')

      // R&D 관련 키워드 확인
      const content = await page.content()
      expect(content).toMatch(/R&D|연구개발/i)
    })
  })

  test.describe('FAQ 페이지', () => {
    test('FAQ 페이지 로딩', async ({ page }) => {
      await page.goto('/faq')

      // 페이지 제목 확인
      await expect(page.getByText(/자주 묻는 질문/i)).toBeVisible()
    })

    test('FAQ 아이템 클릭 시 펼침', async ({ page }) => {
      await page.goto('/faq')

      // 첫 번째 FAQ 아이템 찾기
      const firstQuestion = page.locator('[data-state="closed"]').first()

      if (await firstQuestion.isVisible()) {
        // 질문 클릭하여 답변 펼치기
        await firstQuestion.click()

        // 답변이 표시되는지 확인 (data-state="open" 또는 내용 표시)
        await expect(page.locator('[data-state="open"]').first()).toBeVisible()
      }
    })
  })

  test.describe('반응형 디자인', () => {
    test('모바일 뷰포트에서 비회원 매칭 페이지', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/try')

      // 페이지가 정상 로딩되는지 확인
      await expect(page.getByText(/기업정보를 입력해 주세요/i)).toBeVisible()

      // 폼 요소들이 보이는지 확인
      await expect(page.getByLabel(/회사명/i)).toBeVisible()
    })

    test('태블릿 뷰포트에서 랜딩 페이지', async ({ page }) => {
      // 태블릿 뷰포트 설정
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')

      // 페이지가 정상 로딩되는지 확인
      await expect(page).toHaveTitle(/GovHelper/)
    })
  })

  test.describe('성능', () => {
    test('랜딩 페이지 로딩 시간', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')
      const loadTime = Date.now() - startTime

      // 3초 이내 로딩 확인
      expect(loadTime).toBeLessThan(3000)
    })

    test('비회원 매칭 페이지 로딩 시간', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/try')
      await page.waitForLoadState('domcontentloaded')
      const loadTime = Date.now() - startTime

      // 3초 이내 로딩 확인
      expect(loadTime).toBeLessThan(3000)
    })
  })
})
