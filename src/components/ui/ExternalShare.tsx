'use client'

import { useState } from 'react'
import { Share2, Twitter, Facebook, MessageCircle, Link, Copy, Check, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

interface ExternalShareProps {
  type: 'itinerary' | 'post' | 'stats' | 'achievement'
  title: string
  description: string
  url: string
  image?: string
}

export function ExternalShare({ type, title, description, url, image }: ExternalShareProps) {
  const [copied, setCopied] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)

  const shareText = getShareText(type, title, description)

  function getShareText(type: string, title: string, description: string): string {
    switch (type) {
      case 'itinerary':
        return `Check out my travel itinerary: ${title} - ${description}`
      case 'post':
        return title
      case 'stats':
        return `My travel statistics on Travereel: ${description}`
      case 'achievement':
        return `I just unlocked "${title}" on Travereel! 🏆`
      default:
        return description
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShareTwitter = () => {
    const text = encodeURIComponent(shareText)
    const shareUrl = encodeURIComponent(url)
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleShareFacebook = () => {
    const shareUrl = encodeURIComponent(url)
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n\n${url}`)
    window.open(
      `https://wa.me/?text=${text}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(title)
    const body = encodeURIComponent(`${shareText}\n\n${url}`)
    window.open(
      `mailto:?subject=${subject}&body=${body}`,
      '_blank'
    )
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: url,
        })
        toast.success('Shared successfully!')
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          toast.error('Failed to share')
        }
      }
    }
  }

  // If native share is available (mobile), use it directly
  const canNativeShare = 'share' in navigator
  
  if (canNativeShare) {
    return (
      <Button
        onClick={handleNativeShare}
        size="sm"
        className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white hover:opacity-90"
      >
        <Share2 className="size-4 mr-2" />
        Share
      </Button>
    )
  }

  return (
    <>
      <Button
        onClick={() => setShowShareSheet(!showShareSheet)}
        size="sm"
        className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42] text-white hover:opacity-90"
      >
        <Share2 className="size-4 mr-2" />
        Share
      </Button>

      {showShareSheet && (
        <Card className="absolute bottom-full mb-2 left-0 right-0 p-4 shadow-xl border border-gray-200 bg-white z-10">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Share to</h4>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Twitter/X */}
            <button
              onClick={handleShareTwitter}
              className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Twitter className="size-5 text-gray-900" />
              <span className="text-sm font-medium text-gray-900">Twitter</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleShareFacebook}
              className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Facebook className="size-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Facebook</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="size-5 text-green-500" />
              <span className="text-sm font-medium text-gray-900">WhatsApp</span>
            </button>

            {/* Email */}
            <button
              onClick={handleShareEmail}
              className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Mail className="size-5 text-red-500" />
              <span className="text-sm font-medium text-gray-900">Email</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors col-span-2"
            >
              {copied ? (
                <>
                  <Check className="size-5 text-green-500" />
                  <span className="text-sm font-medium text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <Link className="size-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Copy Link</span>
                </>
              )}
            </button>
          </div>
        </Card>
      )}
    </>
  )
}
