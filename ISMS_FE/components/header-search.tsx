'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VoiceSearchInput } from '@/components/voice-search-input'

export function HeaderSearch() {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = () => {
    if (searchValue.trim()) {
      setIsSearching(true)
      // Navigate to AI search page with query parameter
      router.push(`/dashboard/ai-search?q=${encodeURIComponent(searchValue)}`)
      // Reset after navigation
      setTimeout(() => {
        setIsSearching(false)
      }, 500)
    }
  }

  return (
    <div className="flex-1 max-w-lg">
      <VoiceSearchInput
        value={searchValue}
        onChange={setSearchValue}
        onSearch={handleSearch}
        isSearching={isSearching}
        placeholder="Tìm kiếm với AI..."
        compact={true}
      />
    </div>
  )
}
