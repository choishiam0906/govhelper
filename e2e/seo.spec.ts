import { test, expect } from '@playwright/test'

test.describe('SEO 검증', () => {
  test('사이트맵 접근 가능', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    expect(response?.status()).toBe(200)

    // 사이트맵 내용 검증
    const content = await page.content()
    expect(content).toContain('<?xml')
    expect(content).toContain('<urlset')
  })

  test('robots.txt 접근 가능', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBe(200)

    // robots.txt 내용 검증
    const content = await page.content()
    expect(content).toContain('User-agent')
  })

  test('OG 메타태그 존재', async ({ page }) => {
    await page.goto('/')

    // Open Graph 메타태그
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    expect(ogDescription).toBeTruthy()

    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).toBeTruthy()
  })

  test('Twitter Card 메타태그 존재', async ({ page }) => {
    await page.goto('/')

    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content')
    expect(twitterCard).toBeTruthy()
  })

  test('Canonical URL 존재', async ({ page }) => {
    await page.goto('/')

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toBeTruthy()
  })
})
