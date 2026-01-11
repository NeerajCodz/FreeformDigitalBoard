"use client"

import { useState } from "react"
import Header from "./header"
import Hero from "./hero"
import Services from "./services"
import Faq from "./faq"
import CallToAction from "./call-to-action"
import Footer from "./footer"
import AuthModal from "@/components/modals/AuthModal"

interface LandingPageProps {
  showHeader?: boolean
  showFooter?: boolean
}
export { Header, Hero, Services, Faq, CallToAction, Footer }

export default function LandingPage({ showHeader = true, showFooter = true }: LandingPageProps) {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {showHeader && (
        <Header
          onLoginClick={() => setShowLogin(true)}
          onRegisterClick={() => setShowRegister(true)}
        />
      )}
      <div className="container pt-4 px-4 sm:px-6 lg:px-8">
        <Hero />
        <Services />
        <Faq />
        <CallToAction />
      </div>
      {showFooter && <Footer />}

      <AuthModal open={showLogin} mode="signin" onClose={() => setShowLogin(false)} />
      <AuthModal open={showRegister} mode="signup" onClose={() => setShowRegister(false)} />
    </main>
  )
}
