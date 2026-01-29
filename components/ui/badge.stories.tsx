import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'
import { CheckIcon, XIcon } from 'lucide-react'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
      description: '배지 스타일 변형',
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: {
    children: '기본',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '보조',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: '경고',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '외곽선',
  },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <CheckIcon />
        완료
      </>
    ),
  },
}

export const WithIconDestructive: Story = {
  args: {
    variant: 'destructive',
    children: (
      <>
        <XIcon />
        실패
      </>
    ),
  },
}

export const StatusExamples: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>진행중</Badge>
      <Badge variant="secondary">대기중</Badge>
      <Badge>
        <CheckIcon />
        완료
      </Badge>
      <Badge variant="destructive">
        <XIcon />
        실패
      </Badge>
      <Badge variant="outline">취소됨</Badge>
    </div>
  ),
}
