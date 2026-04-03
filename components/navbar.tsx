'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mic } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Mic className="w-5 h-5" />
          VoiceToText
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className={`text-sm font-medium transition-colors ${
            pathname === '/' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
            Home
          </Link>

          <Link href="/pricing" className={`text-sm font-medium transition-colors ${
            pathname === '/pricing' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
            Pricing
          </Link>

          <Link href="/dashboard" className={`text-sm font-medium transition-colors ${
            pathname.startsWith('/dashboard') ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}>
            Dashboard
          </Link>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9',
              },
            }}
          />
        </div>
      </div>
    </nav>
  )
}
