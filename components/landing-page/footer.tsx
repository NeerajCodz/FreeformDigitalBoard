"use client"

import Link from "next/link"
import NextImage from "next/image"
import { Github, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"

export default function Footer() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <footer className="container py-8 border-t border-white/10 rounded-3xl bg-slate-950/80 backdrop-blur">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 text-emerald-300 hover:text-emerald-200">
                <NextImage
                  src="/logo.svg"
                  alt="Digital Board"
                  width={150}
                  height={40}
                  className="h-9 w-auto"
                  priority
                />
                <span className="text-xl font-bold">Digital Board</span>
              </Link>
            </div>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
          Create, organize, and visualize your ideas on an infinite canvas
        </p>
        <div className="text-sm text-slate-400 flex flex-col items-center gap-1 mb-4">
          <span>
            By{" "}
            <Link
              href="https://github.com/NeerajCodz"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-300 hover:text-emerald-200"
            >
              Neeraj Sathish Kumar
            </Link>
          </span>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Crafted for builders and dreamers
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <Link
            href="https://github.com/NeerajCodz"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:border-emerald-400/50 hover:bg-emerald-500/10"
          >
            <Github className="h-4 w-4 text-emerald-300 group-hover:text-emerald-200" />
            <span>@NeerajCodz</span>
          </Link>
          <Link
            href="https://github.com/NeerajCodz/FreeformDigitalBoard"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:border-emerald-400/50 hover:bg-emerald-500/10"
          >
            <ExternalLink className="h-4 w-4 text-emerald-300 group-hover:text-emerald-200" />
            <span>Project Repository</span>
          </Link>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Digital Board. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
