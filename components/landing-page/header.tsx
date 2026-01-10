"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

type HeaderProps = {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
};

export default function Header({ onLoginClick, onRegisterClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/");
  };



  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className={`mx-auto max-w-7xl rounded-2xl shadow-lg transition-all duration-300 ${isScrolled
            ? "bg-slate-900/95 backdrop-blur-md shadow-xl border border-white/10"
            : "bg-slate-900/70 shadow-md border border-white/10"
          }`}>
          <header className="relative">
            <div className="flex items-center justify-between px-6 py-4">
              <Link
                href="/"
                className="flex items-center space-x-3"
                onClick={handleLogoClick}
              >
                {mounted ? (
                  <>
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
                  </>
                ) : (
                  <div className="h-10 w-[200px]" />
                )}
              </Link>

              <nav className="hidden lg:flex items-center space-x-8">
                {/* {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      item.active
                        ? "text-[#7A7FEE] border-b-2 border-[#7A7FEE] pb-1"
                        : "text-gray-300 hover:text-[#7A7FEE]"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))} */}
              </nav>

              <div className="flex items-center space-x-4">

                <div className="hidden md:flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (onLoginClick) onLoginClick();
                      else router.push("/sign-in");
                    }}
                    className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      if (onRegisterClick) onRegisterClick();
                      else router.push("/sign-up");
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-emerald-500/50"
                  >
                    Get Started
                  </button>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-5 w-5 text-slate-300" />
                </button>
              </div>
            </div>
          </header>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-slate-900 shadow-2xl border-l border-white/10">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Image
                      src={"/icon.svg"}
                      alt="Digital Board Logo"
                      width={20}
                      height={20}
                      className="h-5 w-5 brightness-0 invert"
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-100">
                    Digital Board
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                >
                  <X className="h-5 w-5 text-slate-300" />
                </button>
              </div>

              <nav className="flex-1 px-6 py-6 space-y-4">

              </nav>

              <div className="p-6 border-t border-white/10 space-y-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onLoginClick) onLoginClick();
                    else router.push("/sign-in");
                  }}
                  className="block w-full text-center py-3 text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/5 border border-white/10"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onRegisterClick) onRegisterClick();
                    else router.push("/sign-up");
                  }}
                  className="block w-full text-center py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
