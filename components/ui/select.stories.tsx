import type { Meta, StoryObj } from '@storybook/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from './select'

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="과일 선택">
        <SelectValue placeholder="과일을 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">사과</SelectItem>
        <SelectItem value="banana">바나나</SelectItem>
        <SelectItem value="orange">오렌지</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithPlaceholder: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="국가 선택">
        <SelectValue placeholder="국가를 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="kr">대한민국</SelectItem>
        <SelectItem value="us">미국</SelectItem>
        <SelectItem value="jp">일본</SelectItem>
        <SelectItem value="cn">중국</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-label="음식 선택">
        <SelectValue placeholder="음식을 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>과일</SelectLabel>
          <SelectItem value="apple">사과</SelectItem>
          <SelectItem value="banana">바나나</SelectItem>
          <SelectItem value="orange">오렌지</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>채소</SelectLabel>
          <SelectItem value="carrot">당근</SelectItem>
          <SelectItem value="cucumber">오이</SelectItem>
          <SelectItem value="tomato">토마토</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const Small: Story = {
  render: () => (
    <Select>
      <SelectTrigger size="sm" aria-label="크기 선택">
        <SelectValue placeholder="크기 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="xs">아주 작음</SelectItem>
        <SelectItem value="sm">작음</SelectItem>
        <SelectItem value="md">중간</SelectItem>
        <SelectItem value="lg">큼</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithDefaultValue: Story = {
  render: () => (
    <Select defaultValue="banana">
      <SelectTrigger aria-label="과일 선택">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">사과</SelectItem>
        <SelectItem value="banana">바나나</SelectItem>
        <SelectItem value="orange">오렌지</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger aria-label="과일 선택">
        <SelectValue placeholder="비활성화됨" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">사과</SelectItem>
        <SelectItem value="banana">바나나</SelectItem>
      </SelectContent>
    </Select>
  ),
}
