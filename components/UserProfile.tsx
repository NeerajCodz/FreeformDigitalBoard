'use client'

import { useState } from 'react'
import { useDatabaseUser } from '@/lib/client-auth'
import { UserButton, useUser } from '@clerk/nextjs'
import { User, LogOut, Settings } from 'lucide-react'

export default function UserProfile() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { user: dbUser, isLoading, error } = useDatabaseUser()
  const [showDropdown, setShowDropdown] = useState(false)

  if (!clerkLoaded || isLoading) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-700 animate-pulse" />
    )
  }

  if (!clerkUser) {
    return null
  }

  // Use Clerk's UserButton component which handles everything
  return (
    <div className="relative">
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-9 h-9 rounded-full border-2 border-slate-600 hover:border-emerald-400 transition-colors",
            userButtonPopoverCard: "bg-slate-900 border border-white/10 shadow-xl",
            userButtonPopoverActionButton: "hover:bg-white/10 text-slate-100",
            userButtonPopoverActionButtonText: "text-slate-100",
            userButtonPopoverFooter: "hidden"
          }
        }}
      />
    </div>
  )
}
