import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'
import { SaveIcon } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: '버튼 스타일 변형',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
      description: '버튼 크기',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: {
    children: '버튼',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '보조 버튼',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: '삭제',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '외곽선 버튼',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: '고스트 버튼',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: '링크 버튼',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: '작은 버튼',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: '큰 버튼',
  },
}

export const Icon: Story = {
  args: {
    size: 'icon',
    'aria-label': '저장',
    children: <SaveIcon />,
  },
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <SaveIcon />
        저장하기
      </>
    ),
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '비활성화됨',
  },
}
