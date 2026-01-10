"use client"

import Link from "next/link"
import Image from "next/image"
import { useTheme } from "@/components/theme-provider"
import { useState, useEffect } from "react"

export default function Footer() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <footer className="container py-8 border-t border-white/10">
      <div className="flex flex-col items-center text-center">
        <Link href="/" className="flex items-center justify-center mb-4">
          {mounted ? (
            <div className="text-2xl font-bold flex items-center gap-3 text-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                <Image
                  src={"/icon.svg"}
                  alt="Digital Board Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6 brightness-0 invert"
                  priority
                />
              </div>
              Freeform Digital Board
            </div>
          ) : (
            <div className="h-12 w-[220px]" />
          )}
        </Link>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
          Create, organize, and visualize your ideas on an infinite canvas
        </p>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Freeform Digital Board. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
