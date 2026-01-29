import type { Meta, StoryObj } from '@storybook/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card'
import { Button } from './button'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
      </CardHeader>
      <CardContent>
        <p>카드 내용이 들어갑니다.</p>
      </CardContent>
    </Card>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>프로젝트 설정</CardTitle>
        <CardDescription>프로젝트의 기본 설정을 관리해요</CardDescription>
      </CardHeader>
      <CardContent>
        <p>여기에 설정 내용이 들어갑니다.</p>
      </CardContent>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>결제 정보</CardTitle>
        <CardDescription>결제 수단을 추가하거나 변경해요</CardDescription>
      </CardHeader>
      <CardContent>
        <p>현재 등록된 결제 수단이 없어요.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          결제 수단 추가
        </Button>
      </CardFooter>
    </Card>
  ),
}

export const FullExample: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>알림 설정</CardTitle>
        <CardDescription>
          이메일과 푸시 알림 설정을 관리해요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">이메일 알림</p>
              <p className="text-sm text-muted-foreground">
                중요한 업데이트를 이메일로 받아요
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">푸시 알림</p>
              <p className="text-sm text-muted-foreground">
                모바일 기기로 알림을 받아요
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1">
          취소
        </Button>
        <Button className="flex-1">저장</Button>
      </CardFooter>
    </Card>
  ),
}
