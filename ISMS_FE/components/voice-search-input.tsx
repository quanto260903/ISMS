'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Loader2, Search, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface VoiceSearchInputProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  isSearching?: boolean
  placeholder?: string
  compact?: boolean
}

export function VoiceSearchInput({
  value,
  onChange,
  onSearch,
  isSearching = false,
  placeholder = 'Tìm kiếm bằng giọng nói hoặc nhập văn bản...',
  compact = false,
}: VoiceSearchInputProps) {
  const { toast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'vi-VN' // Vietnamese language

        recognition.onstart = () => {
          setIsListening(true)
          toast({
            title: '🎤 Đang nghe...',
            description: 'Hãy nói câu truy vấn của bạn',
          })
        }

        recognition.onresult = (event: any) => {
          const current = event.resultIndex
          const transcriptText = event.results[current][0].transcript
          setTranscript(transcriptText)
          onChange(transcriptText)
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          toast({
            variant: 'destructive',
            title: 'Lỗi nhận diện giọng nói',
            description: 'Vui lòng thử lại hoặc nhập văn bản',
          })
        }

        recognition.onend = () => {
          setIsListening(false)
          if (transcript) {
            toast({
              title: '✅ Hoàn thành',
              description: 'Đã nhận diện giọng nói thành công',
            })
          }
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [transcript])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        variant: 'destructive',
        title: 'Không hỗ trợ',
        description: 'Trình duyệt của bạn không hỗ trợ nhận diện giọng nói',
      })
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setTranscript('')
      recognitionRef.current.start()
    }
  }

  const handleClear = () => {
    onChange('')
    setTranscript('')
    if (isListening) {
      recognitionRef.current.stop()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onSearch()
    }
  }

  return (
    <Card className={cn("border-2 border-purple-200", compact && "border-0 shadow-none")}>
      <CardContent className={cn(compact ? "p-0" : "p-4")}>
        <div className={cn("flex items-center gap-3", compact && "gap-2")}>
          {/* Voice Button */}
          <Button
            type="button"
            onClick={toggleListening}
            disabled={isSearching}
            className={cn(
              'flex-shrink-0 rounded-full transition-all',
              compact ? 'w-10 h-10' : 'w-12 h-12',
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700'
            )}
          >
            {isListening ? (
              <MicOff className={cn(compact ? "h-5 w-5" : "h-5 w-5")} />
            ) : (
              <Mic className={cn(compact ? "h-5 w-5" : "h-5 w-5")} />
            )}
          </Button>

          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSearching || isListening}
              className={cn("pr-10", compact ? "h-9 text-sm" : "text-base")}
            />
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className={cn("absolute right-1 top-1/2 -translate-y-1/2 p-0", compact ? "h-7 w-7" : "h-8 w-8")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search Button */}
          <Button
            type="button"
            onClick={onSearch}
            disabled={!value.trim() || isSearching}
            className={cn(
              "flex-shrink-0 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700",
              compact && "h-9 px-3 text-sm"
            )}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {compact ? "..." : "Đang tìm..."}
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                {compact ? "Tìm" : "Tìm kiếm"}
              </>
            )}
          </Button>
        </div>

        {/* Listening Indicator */}
        {!compact && isListening && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <div className="flex gap-1">
                <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm font-medium">
                Đang nghe... Nói câu truy vấn của bạn
              </span>
            </div>
          </div>
        )}

        {/* Voice Recognition Result */}
        {!compact && transcript && !isListening && (
          <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-900">
              <span className="font-medium">Đã nhận diện:</span> {transcript}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
