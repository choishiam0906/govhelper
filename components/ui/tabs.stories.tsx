import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-96">
      <TabsList>
        <TabsTrigger value="tab1">첫 번째</TabsTrigger>
        <TabsTrigger value="tab2">두 번째</TabsTrigger>
        <TabsTrigger value="tab3">세 번째</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p>첫 번째 탭 내용입니다.</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p>두 번째 탭 내용입니다.</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p>세 번째 탭 내용입니다.</p>
      </TabsContent>
    </Tabs>
  ),
}

export const WithCards: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList>
        <TabsTrigger value="account">계정</TabsTrigger>
        <TabsTrigger value="password">비밀번호</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
            <CardDescription>
              계정 정보를 수정해요. 완료되면 저장 버튼을 눌러주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid gap-1">
                <label htmlFor="name" className="text-sm font-medium">
                  이름
                </label>
                <input
                  id="name"
                  defaultValue="홍길동"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                />
              </div>
              <div className="grid gap-1">
                <label htmlFor="username" className="text-sm font-medium">
                  사용자명
                </label>
                <input
                  id="username"
                  defaultValue="@honggildong"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>비밀번호</CardTitle>
            <CardDescription>
              비밀번호를 변경해요. 완료되면 저장 버튼을 눌러주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid gap-1">
                <label htmlFor="current" className="text-sm font-medium">
                  현재 비밀번호
                </label>
                <input
                  id="current"
                  type="password"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                />
              </div>
              <div className="grid gap-1">
                <label htmlFor="new" className="text-sm font-medium">
                  새 비밀번호
                </label>
                <input
                  id="new"
                  type="password"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-96">
      <TabsList>
        <TabsTrigger value="tab1">활성화</TabsTrigger>
        <TabsTrigger value="tab2" disabled>
          비활성화
        </TabsTrigger>
        <TabsTrigger value="tab3">활성화</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p>첫 번째 탭 내용입니다.</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p>두 번째 탭은 비활성화되어 있어요.</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p>세 번째 탭 내용입니다.</p>
      </TabsContent>
    </Tabs>
  ),
}
