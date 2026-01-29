'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Clock } from 'lucide-react'

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = '검색',
  className = '',
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 자동완성 API 호출 (300ms debounce)
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (query.trim().length < 1) {
        setSuggestions([])
        setShowDropdown(false)
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`)
        const result = await response.json()

        if (result.success && result.data.length > 0) {
          setSuggestions(result.data)
          setShowDropdown(true)
          setSelectedIndex(-1)
        } else {
          setSuggestions([])
          setShowDropdown(false)
        }
      } catch (error) {
        console.error('Autocomplete error:', error)
        setSuggestions([])
        setShowDropdown(false)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // value 변경 시 자동완성 호출 (300ms debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)

    return () => clearTimeout(timer)
  }, [value, fetchSuggestions])

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 키보드 네비게이션
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || suggestions.length === 0) {
        if (e.key === 'Enter') {
          onSearch(value)
          setShowDropdown(false)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            const selected = suggestions[selectedIndex]
            onChange(selected)
            onSearch(selected)
          } else {
            onSearch(value)
          }
          setShowDropdown(false)
          setSelectedIndex(-1)
          break
        case 'Escape':
          setShowDropdown(false)
          setSelectedIndex(-1)
          break
      }
    },
    [showDropdown, suggestions, selectedIndex, value, onChange, onSearch]
  )

  // 항목 클릭
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    onSearch(suggestion)
    setShowDropdown(false)
    setSelectedIndex(-1)
  }

  // 매칭 부분 bold 처리
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text

    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return text

    const before = text.slice(0, index)
    const match = text.slice(index, index + query.length)
    const after = text.slice(index + query.length)

    return (
      <>
        {before}
        <strong className="font-semibold">{match}</strong>
        {after}
      </>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true)
            }
          }}
          className="pl-10"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
        />
      </div>

      {/* 자동완성 드롭다운 */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-suggestions"
          className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-[300px] overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`px-3 py-2 hover:bg-accent cursor-pointer flex items-center gap-2 ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">
                {highlightMatch(suggestion, value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
