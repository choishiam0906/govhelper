import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"
import { Search, Filter, Clock, Building2, ExternalLink } from "lucide-react"

export default async function AnnouncementsPage() {
  // TODO: Fetch from actual database
  const announcements = [
    {
      id: "1",
      title: "2026년 초기창업패키지 지원사업",
      organization: "창업진흥원",
      category: "창업",
      supportType: "자금",
      supportAmount: "최대 1억원",
      applicationStart: "2026-01-15",
      applicationEnd: "2026-02-28",
      status: "active",
      source: "kstartup",
    },
    {
      id: "2",
      title: "AI 바우처 지원사업",
      organization: "정보통신산업진흥원",
      category: "기술개발",
      supportType: "바우처",
      supportAmount: "최대 3억원",
      applicationStart: "2026-02-01",
      applicationEnd: "2026-03-15",
      status: "active",
      source: "bizinfo",
    },
    {
      id: "3",
      title: "중소기업 R&D 역량강화 사업",
      organization: "중소벤처기업부",
      category: "R&D",
      supportType: "자금",
      supportAmount: "최대 2억원",
      applicationStart: "2026-01-20",
      applicationEnd: "2026-02-20",
      status: "active",
      source: "bizinfo",
    },
    {
      id: "4",
      title: "수출지원 바우처 사업",
      organization: "KOTRA",
      category: "수출",
      supportType: "바우처",
      supportAmount: "최대 5천만원",
      applicationStart: "2026-01-10",
      applicationEnd: "2026-03-31",
      status: "active",
      source: "bizinfo",
    },
    {
      id: "5",
      title: "청년창업사관학교",
      organization: "중소벤처기업부",
      category: "창업",
      supportType: "교육/자금",
      supportAmount: "최대 1억원",
      applicationStart: "2026-02-01",
      applicationEnd: "2026-02-28",
      status: "active",
      source: "kstartup",
    },
  ]

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "kstartup":
        return <Badge variant="secondary">K-Startup</Badge>
      case "bizinfo":
        return <Badge variant="outline">기업마당</Badge>
      case "narajangteo":
        return <Badge>나라장터</Badge>
      default:
        return <Badge variant="secondary">{source}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">공고 검색</h1>
        <p className="text-muted-foreground mt-1">
          정부지원사업 공고를 검색하고 필터링하세요
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="공고명, 기관명으로 검색..."
                className="pl-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="분야" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="startup">창업</SelectItem>
                <SelectItem value="rd">R&D</SelectItem>
                <SelectItem value="export">수출</SelectItem>
                <SelectItem value="hr">인력</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="지원유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="fund">자금</SelectItem>
                <SelectItem value="voucher">바우처</SelectItem>
                <SelectItem value="education">교육</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              더 많은 필터
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-medium text-foreground">{announcements.length}</span>개의 공고
          </p>
          <Select defaultValue="latest">
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="deadline">마감임박순</SelectItem>
              <SelectItem value="amount">지원금순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {announcements.map((announcement) => (
          <Card key={announcement.id} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSourceBadge(announcement.source)}
                    <Badge variant="outline">{announcement.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">
                    <Link
                      href={`/dashboard/announcements/${announcement.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {announcement.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {announcement.organization}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {announcement.applicationStart} ~ {announcement.applicationEnd}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-semibold text-primary">
                    {announcement.supportAmount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {announcement.supportType}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    관심 등록
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/matching?announcement=${announcement.id}`}>
                      매칭 분석
                    </Link>
                  </Button>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/dashboard/announcements/${announcement.id}`} className="gap-2">
                    상세 보기
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
