import { test, expect } from '@playwright/test'

test.describe('비회원 매칭 플로우', () => {
  test('비회원 매칭 페이지 로딩', async ({ page }) => {
    await page.goto('/try')
    await expect(page.getByText(/기업정보를 입력해 주세요/i)).toBeVisible()
  })

  test('기업 정보 입력 폼 존재 확인', async ({ page }) => {
    await page.goto('/try')

    // 사업자번호 입력 필드
    await expect(page.getByLabel(/사업자등록번호/i)).toBeVisible()

    // 회사명 입력 필드
    await expect(page.getByLabel(/회사명/i)).toBeVisible()

    // 업종 선택 필드
    await expect(page.getByText(/업종/i)).toBeVisible()

    // 직원수 입력 필드
    await expect(page.getByLabel(/직원수/i)).toBeVisible()
  })

  test.skip('멀티스텝 폼 다음 버튼 클릭', async ({ page }) => {
    // Skip: 실제 API 호출이 필요하므로 테스트 환경에서 실행 불가
    await page.goto('/try')

    // 회사명 입력
    await page.getByLabel(/회사명/i).fill('테스트 기업')

    // 다음 버튼 클릭
    const nextButton = page.getByRole('button', { name: /다음/i })
    if (await nextButton.isVisible()) {
      await nextButton.click()
    }
  })
})
