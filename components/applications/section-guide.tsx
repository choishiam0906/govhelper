'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Loader2,
  Lightbulb,
  Target,
  ListChecks,
  FileText,
  Tag,
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Sparkles,
} from 'lucide-react'

interface SectionGuide {
  sectionName: string
  purpose: string
  keyPoints: string[]
  structure: {
    title: string
    description: string
  }[]
  keywords: string[]
  examplePhrases: string[]
  doList: string[]
  dontList: string[]
  relatedCriteria: {
    name: string
    maxScore: number
    tips: string
  }[]
}

interface SectionGuideProps {
  announcementId: string
  sectionName: string
  companyInfo?: {
    name?: string
    industry?: string
    description?: string
  }
}

export function SectionGuideButton({
  announcementId,
  sectionName,
  companyInfo,
}: SectionGuideProps) {
  const [guide, setGuide] = useState<SectionGuide | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const fetchGuide = async () => {
    if (guide) return // 이미 로드됨

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/applications/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId, sectionName, companyInfo }),
      })

      const result = await response.json()

      if (result.success) {
        setGuide(result.data)
      } else {
        setError(result.error || '가이드를 불러오지 못했어요')
      }
    } catch {
      setError('가이드를 불러오지 못했어요')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && !guide && !loading) {
      fetchGuide()
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <BookOpen className="h-4 w-4 mr-1" />
          작성 가이드
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {sectionName} 작성 가이드
          </SheetTitle>
          <SheetDescription>
            평가기준에 맞는 고득점 작성 팁이에요
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                맞춤 가이드를 생성하고 있어요...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchGuide} className="mt-4">
                다시 시도
              </Button>
            </div>
          ) : guide ? (
            <SectionGuideContent guide={guide} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SectionGuideContent({ guide }: { guide: SectionGuide }) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['purpose', 'keyPoints'])
  )

  const toggleSection = (section: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* 목적 */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-primary mb-1">이 섹션의 목적</p>
              <p className="text-sm text-muted-foreground">{guide.purpose}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 핵심 포인트 */}
      <Collapsible
        open={openSections.has('keyPoints')}
        onOpenChange={() => toggleSection('keyPoints')}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-green-600" />
                  반드시 포함할 내용
                </span>
                {openSections.has('keyPoints') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {guide.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 권장 구조 */}
      <Collapsible
        open={openSections.has('structure')}
        onOpenChange={() => toggleSection('structure')}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  권장 구조
                </span>
                {openSections.has('structure') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {guide.structure.map((item, idx) => (
                <div key={idx} className="border-l-2 border-blue-200 pl-3">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 키워드 */}
      {guide.keywords.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-600" />
              추천 키워드
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {guide.keywords.map((keyword, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-purple-50 text-purple-700 hover:bg-purple-100"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 예시 문구 */}
      <Collapsible
        open={openSections.has('examples')}
        onOpenChange={() => toggleSection('examples')}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4 text-amber-600" />
                  예시 문구
                </span>
                {openSections.has('examples') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-2">
              {guide.examplePhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50 rounded-lg text-sm italic text-amber-900"
                >
                  "{phrase}"
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Do / Don't */}
      <div className="grid grid-cols-2 gap-3">
        {/* Do */}
        <Card className="bg-green-50/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-1 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Do
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1.5">
              {guide.doList.map((item, idx) => (
                <li key={idx} className="text-xs text-green-800">
                  • {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Don't */}
        <Card className="bg-red-50/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-1 text-red-700">
              <XCircle className="h-4 w-4" />
              Don't
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-1.5">
              {guide.dontList.map((item, idx) => (
                <li key={idx} className="text-xs text-red-800">
                  • {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 관련 평가항목 */}
      {guide.relatedCriteria.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              관련 평가항목 & 고득점 팁
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {guide.relatedCriteria.map((criteria, idx) => (
              <div key={idx} className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-yellow-900">
                    {criteria.name}
                  </span>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    {criteria.maxScore}점
                  </Badge>
                </div>
                <p className="text-xs text-yellow-800">{criteria.tips}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
