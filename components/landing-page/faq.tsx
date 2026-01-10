"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { faqs } from "./data"

export default function Faq() {
  const [openItem, setOpenItem] = useState<number | null>(null)

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id)
  }

  return (
    <section id="faq" className="my-20">
      <div className="p-8 md:p-10 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur shadow-xl">
        <h2 className="text-slate-100 mb-6 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
          Frequently Asked
          <span className="block text-emerald-400">Questions</span>
        </h2>
        <p className="mb-8 max-w-2xl text-slate-300 text-lg">
          Have questions about digital boards and how our platform works? Find answers to the most common questions and learn how to
          get started with visual organization.
        </p>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b pb-4 border-white/10">
              <button
                onClick={() => toggleItem(faq.id)}
                className="flex justify-between items-center w-full text-left py-3 font-medium text-slate-100 hover:text-emerald-400 transition-colors"
                aria-expanded={openItem === faq.id}
                aria-controls={`faq-answer-${faq.id}`}
              >
                <span className="font-semibold">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform flex-shrink-0 ${openItem === faq.id ? "rotate-180 text-emerald-400" : "text-slate-400"}`}
                />
              </button>
              {openItem === faq.id && (
                <div id={`faq-answer-${faq.id}`} className="mt-3 text-slate-300 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
