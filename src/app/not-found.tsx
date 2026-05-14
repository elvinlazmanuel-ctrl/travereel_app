import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
      <div className="size-20 rounded-full bg-gradient-to-br from-[#2EC4B6]/10 to-[#FFBA49]/10 flex items-center justify-center mb-6">
        <MapPin className="size-10 text-[#2EC4B6]" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Lost in the wilderness?</h2>
      <p className="text-muted-foreground mb-6 max-w-[300px]">
        This page doesn&apos;t exist. Let&apos;s get you back on track.
      </p>
      <a href="/">
        <Button className="bg-[#2EC4B6] hover:bg-[#2EC4B6]/90 text-white">
          Go Home
        </Button>
      </a>
    </div>
  )
}
