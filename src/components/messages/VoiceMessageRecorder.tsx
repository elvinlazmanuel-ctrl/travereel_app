'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoiceMessageRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
}

export function VoiceMessageRecorder({ onSend, onCancel }: VoiceMessageRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const playRecording = useCallback(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [audioUrl])

  const pauseRecording = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setAudioBlob(null)
    setDuration(0)
    setIsPlaying(false)
  }, [audioUrl])

  const sendRecording = useCallback(() => {
    if (audioBlob) {
      onSend(audioBlob, duration)
    }
  }, [audioBlob, duration, onSend])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setIsPlaying(false)} />

      {/* Recording State */}
      <AnimatePresence mode="wait">
        {!audioUrl ? (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="size-8"
            >
              <Trash2 className="size-4 text-gray-500" />
            </Button>

            {isRecording ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="size-3 bg-red-500 rounded-full"
                />
                <span className="text-sm font-mono text-red-500">
                  {formatDuration(duration)}
                </span>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={stopRecording}
                  className="size-10 rounded-full"
                >
                  <Square className="size-5" />
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={startRecording}
                className="size-10 rounded-full"
              >
                <Mic className="size-5" />
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 flex-1"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={deleteRecording}
              className="size-8"
            >
              <Trash2 className="size-4 text-gray-500" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={isPlaying ? pauseRecording : playRecording}
              className="size-10 rounded-full bg-primary hover:bg-primary/90"
            >
              {isPlaying ? (
                <Pause className="size-5 text-white" />
              ) : (
                <Play className="size-5 text-white" />
              )}
            </Button>

            <div className="flex-1 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center px-3">
              {/* Audio waveform visualization */}
              <div className="flex items-center gap-0.5 flex-1">
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-primary/50 rounded-full"
                    animate={{
                      height: isPlaying ? [4, Math.random() * 24 + 4, 4] : 4,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: isPlaying ? Infinity : 0,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            </div>

            <span className="text-sm font-mono text-gray-500 min-w-[40px]">
              {formatDuration(duration)}
            </span>

            <Button
              variant="default"
              size="icon"
              onClick={sendRecording}
              className="size-10 rounded-full bg-[#FF6B6B] hover:bg-[#FF6B6B]/90"
            >
              <Send className="size-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
