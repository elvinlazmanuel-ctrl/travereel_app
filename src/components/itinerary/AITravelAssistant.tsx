'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, MapPin, Calendar, DollarSign, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface AITravelAssistantProps {
  userId: string
  onClose: () => void
}

export function AITravelAssistant({ userId, onClose }: AITravelAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { currentUser } = useAppStore()

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi ${currentUser?.name || 'traveler'}! 👋 I'm your AI Travel Assistant. I can help you with:\n\n• 🎯 Personalized trip recommendations\n• 💰 Budget optimization tips\n• 📅 Best time to visit suggestions\n• 🗺️ Destination insights\n• ✈️ Travel planning advice\n\nWhat would you like to know?`,
        timestamp: new Date(),
        suggestions: [
          'Where should I travel next?',
          'Best budget destinations',
          'Plan a 7-day trip',
          'Travel tips for Japan',
        ],
      },
    ])
  }, [currentUser])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call AI API
      const response = await fetch('/api/ai/travel-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content.trim(),
          userId,
          messageHistory: messages.slice(-5), // Send last 5 messages for context
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          suggestions: data.suggestions,
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('AI Assistant error:', error)
      
      // Fallback response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="bg-card w-full sm:max-w-lg h-[90vh] sm:h-[600px] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-[#2EC4B6]/10 to-[#FF6B6B]/10">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-[#2EC4B6] to-[#FF6B6B] rounded-full flex items-center justify-center">
              <Bot className="size-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Travel Assistant</h3>
              <p className="text-xs text-muted-foreground">Powered by AI</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-[#2EC4B6] to-[#FF6B6B] text-white text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#2EC4B6] text-white'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Suggestions */}
                  {message.suggestions && message.role === 'assistant' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-[10px] mt-2 opacity-60">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-[#2EC4B6] to-[#FF6B6B] text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="size-2 bg-muted-foreground/40 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="size-2 bg-muted-foreground/40 rounded-full"
                    />
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="size-2 bg-muted-foreground/40 rounded-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border p-4 bg-card">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask me anything about travel..."
              disabled={isLoading}
              className="flex-1 rounded-full"
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="rounded-full bg-[#2EC4B6] hover:bg-[#2EC4B6]/90"
            >
              <Send className="size-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage('Recommend destinations for my budget')}
              className="text-xs shrink-0 rounded-full"
            >
              <DollarSign className="size-3 mr-1" />
              Budget Tips
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage('What should I pack for my trip?')}
              className="text-xs shrink-0 rounded-full"
            >
              🎒 Packing List
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => sendMessage('Best travel insurance options')}
              className="text-xs shrink-0 rounded-full"
            >
              🛡️ Insurance
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
