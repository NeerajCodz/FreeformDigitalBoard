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
          baseTheme: undefined,
          elements: {
            avatarBox: "w-9 h-9 rounded-full border-2 border-slate-600 hover:border-emerald-400 transition-colors",
            userButtonPopoverCard: "bg-slate-900 border border-white/10 shadow-xl",
            userButtonPopoverActionButton: "hover:bg-white/10 text-slate-100",
            userButtonPopoverActionButtonText: "text-slate-100",
            userButtonPopoverActionButtonIcon: "text-slate-300",
            userButtonPopoverFooter: "hidden",
            userPreviewMainIdentifier: "text-slate-100",
            userPreviewSecondaryIdentifier: "text-slate-400",
            userButtonPopoverActions: "bg-slate-900",
            formButtonPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white",
            card: "bg-slate-900 text-slate-100",
            headerTitle: "text-slate-100",
            headerSubtitle: "text-slate-400",
            socialButtonsBlockButton: "bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700",
            formFieldLabel: "text-slate-300",
            formFieldInput: "bg-slate-800 border-slate-700 text-slate-100",
            footerActionLink: "text-emerald-400 hover:text-emerald-300",
            identityPreviewText: "text-slate-100",
            identityPreviewEditButton: "text-emerald-400 hover:text-emerald-300"
          },
          variables: {
            colorBackground: "#0f172a",
            colorText: "#f1f5f9",
            colorPrimary: "#10b981",
            colorDanger: "#ef4444",
            colorTextOnPrimaryBackground: "#ffffff",
            colorInputBackground: "#1e293b",
            colorInputText: "#f1f5f9"
          }
        }}
      />
    </div>
  )
}
