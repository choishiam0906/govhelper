'use client'

import { useMemo } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Info, ExternalLink } from 'lucide-react'
import type { Announcement } from './types'
import { extractSourceUrl, removeSourceUrlFromContent } from './utils'

interface ContentTabProps {
  announcement: Announcement
}

/**
 * 공고 내용 탭 컴포넌트
 * - HTML 콘텐츠 sanitization 및 표시
 * - 상세 내용이 없을 경우 원본 사이트 링크 제공
 */
export function ContentTab({ announcement }: ContentTabProps) {
  const sourceUrl = extractSourceUrl(announcement.parsed_content || announcement.content)
  const rawContent = removeSourceUrlFromContent(announcement.parsed_content || announcement.content)

  // XSS 방지를 위한 HTML sanitization
  const cleanedContent = useMemo(() => {
    if (!rawContent) return null
    return DOMPurify.sanitize(rawContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                     'ul', 'ol', 'li', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      ALLOW_DATA_ATTR: false,
    })
  }, [rawContent])

  return (
    <Card>
      <CardContent className="pt-6">
        {cleanedContent ? (
          <div
            className="prose prose-slate max-w-none prose-headings:font-bold prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: cleanedContent }}
          />
        ) : (
          <div className="text-center py-12">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">상세 내용이 없어요</p>
            {sourceUrl && (
              <Button asChild variant="link" className="mt-2">
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                  원본 사이트에서 확인하기
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
