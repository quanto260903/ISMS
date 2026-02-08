'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VoiceSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  onSearch?: () => void
}

export function VoiceSearch({ value, onChange, placeholder = 'Tìm kiếm...', className, onSearch }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'vi-VN' // Vietnamese language
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          onChange(transcript)
          setIsListening(false)
          
          toast({
            title: 'Nhận dạng thành công',
            description: `Đã nghe: "${transcript}"`,
          })
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          
          let errorMessage = 'Có lỗi xảy ra'
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'Không phát hiện giọng nói'
              break
            case 'audio-capture':
              errorMessage = 'Không tìm thấy microphone'
              break
            case 'not-allowed':
              errorMessage = 'Quyền truy cập microphone bị từ chối'
              break
            case 'network':
              errorMessage = 'Lỗi mạng'
              break
          }
          
          toast({
            variant: 'destructive',
            title: 'Lỗi nhận dạng giọng nói',
            description: errorMessage,
          })
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onChange, toast])

  const toggleListening = () => {
    if (!isSupported) {
      toast({
        variant: 'destructive',
        title: 'Không hỗ trợ',
        description: 'Trình duyệt của bạn không hỗ trợ tìm kiếm bằng giọng nói',
      })
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current?.start()
        setIsListening(true)
        toast({
          title: 'Đang lắng nghe...',
          description: 'Hãy nói những gì bạn muốn tìm kiếm',
        })
      } catch (error) {
        console.error('Error starting recognition:', error)
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể bắt đầu nhận dạng giọng nói',
        })
      }
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-12 bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
      />
      {isSupported && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleListening}
          className={`absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 ${
            isListening 
              ? 'text-red-600 hover:text-red-700 animate-pulse' 
              : 'text-gray-400 hover:text-purple-600'
          }`}
          title={isListening ? 'Dừng lắng nghe' : 'Tìm kiếm bằng giọng nói'}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
      )}
    </div>
  )
}
