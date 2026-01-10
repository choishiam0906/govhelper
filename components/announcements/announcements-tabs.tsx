'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SMESAnnouncementList } from './smes-announcement-list'
import { Badge } from '@/components/ui/badge'

interface AnnouncementsTabsProps {
  children: React.ReactNode
}

export function AnnouncementsTabs({ children }: AnnouncementsTabsProps) {
  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">전체 공고</TabsTrigger>
        <TabsTrigger value="smes" className="flex items-center gap-2">
          중소벤처24
          <Badge variant="secondary" className="text-xs">실시간</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-6">
        {children}
      </TabsContent>

      <TabsContent value="smes">
        <SMESAnnouncementList />
      </TabsContent>
    </Tabs>
  )
}
