import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { SearchIcon } from 'lucide-react'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: '입력 필드 타입',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
    placeholder: {
      control: 'text',
      description: '플레이스홀더',
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    type: 'text',
  },
}

export const WithPlaceholder: Story = {
  args: {
    type: 'text',
    placeholder: '여기에 입력하세요',
  },
}

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'example@email.com',
  },
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: '비밀번호를 입력하세요',
  },
}

export const Disabled: Story = {
  args: {
    type: 'text',
    placeholder: '비활성화됨',
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2 w-64">
      <label htmlFor="input-with-label" className="text-sm font-medium">
        이메일
      </label>
      <Input id="input-with-label" {...args} />
    </div>
  ),
  args: {
    type: 'email',
    placeholder: 'example@email.com',
  },
}

export const WithIcon: Story = {
  render: (args) => (
    <div className="relative w-64">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input className="pl-9" {...args} />
    </div>
  ),
  args: {
    type: 'text',
    placeholder: '검색...',
  },
}

export const Invalid: Story = {
  args: {
    type: 'email',
    placeholder: 'example@email.com',
    'aria-invalid': true,
  },
}
