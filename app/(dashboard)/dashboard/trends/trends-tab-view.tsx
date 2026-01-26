'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendsDashboard } from './trends-dashboard'
import { IndustryAnalysis } from './industry-analysis'
import { SuccessInsights } from './success-insights'
import { BarChart3, Briefcase, Lightbulb } from 'lucide-react'

export function TrendsTabView() {
  return (
    <Tabs defaultValue="trends" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="trends" className="flex-1 sm:flex-none">
          <BarChart3 className="h-4 w-4 mr-2" />
          전체 트렌드
        </TabsTrigger>
        <TabsTrigger value="industry" className="flex-1 sm:flex-none">
          <Briefcase className="h-4 w-4 mr-2" />
          업종별 분석
        </TabsTrigger>
        <TabsTrigger value="insights" className="flex-1 sm:flex-none">
          <Lightbulb className="h-4 w-4 mr-2" />
          성공률 인사이트
        </TabsTrigger>
      </TabsList>

      <TabsContent value="trends" className="mt-6">
        <TrendsDashboard />
      </TabsContent>

      <TabsContent value="industry" className="mt-6">
        <IndustryAnalysis />
      </TabsContent>

      <TabsContent value="insights" className="mt-6">
        <SuccessInsights />
      </TabsContent>
    </Tabs>
  )
}
