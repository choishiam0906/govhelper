'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SMESAnnouncementList } from './smes-announcement-list'
import { BizinfoAnnouncementList } from './bizinfo-announcement-list'
import { KStartupAnnouncementList } from './kstartup-announcement-list'
import { G2BAnnouncementList } from './g2b-announcement-list'
import { SemanticSearch } from './semantic-search'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface AnnouncementsTabsProps {
  children: React.ReactNode
}

export function AnnouncementsTabs({ children }: AnnouncementsTabsProps) {
  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList className="flex-wrap h-auto gap-1">
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI 검색
          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">New</Badge>
        </TabsTrigger>
        <TabsTrigger value="all">전체 공고</TabsTrigger>
        <TabsTrigger value="smes" className="flex items-center gap-2">
          중소벤처24
          <Badge variant="secondary" className="text-xs">실시간</Badge>
        </TabsTrigger>
        <TabsTrigger value="bizinfo" className="flex items-center gap-2">
          기업마당
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">실시간</Badge>
        </TabsTrigger>
        <TabsTrigger value="kstartup" className="flex items-center gap-2">
          K-Startup
          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">창업</Badge>
        </TabsTrigger>
        <TabsTrigger value="g2b" className="flex items-center gap-2">
          나라장터
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">입찰</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ai" className="space-y-6">
        <SemanticSearch />
      </TabsContent>

      <TabsContent value="all" className="space-y-6">
        {children}
      </TabsContent>

      <TabsContent value="smes">
        <SMESAnnouncementList />
      </TabsContent>

      <TabsContent value="bizinfo">
        <BizinfoAnnouncementList />
      </TabsContent>

      <TabsContent value="kstartup">
        <KStartupAnnouncementList />
      </TabsContent>

      <TabsContent value="g2b">
        <G2BAnnouncementList />
      </TabsContent>
    </Tabs>
  )
}
