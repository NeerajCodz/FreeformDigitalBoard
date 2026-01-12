import Image from "next/image"
import Link from "next/link"

export default function CallToAction() {
  return (
    <section id="contact" className="my-20 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-slate-900/40 backdrop-blur shadow-xl">
      <div className="p-8 md:p-10 lg:p-12 flex flex-col md:flex-row items-start">
        <div className="w-full md:w-3/5 z-10">
          <h2 className="text-slate-100 mb-6 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            Ready to Start Your <span className="text-emerald-400">Creative Journey?</span>
          </h2>
          <p className="my-6 text-base md:text-lg max-w-md text-slate-300">
            Start creating your digital boards today.
          </p>
          <p className="mb-6 text-base md:text-lg max-w-md text-slate-300">
            Add notes, lists, and images. Organize with tags and categories. Save snapshots of your work. No installation required.
          </p>
          <div>
            <Link href="/dashboard" className="inline-flex items-center px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 hover:scale-105">
              Start Creating Boards
            </Link>
          </div>
        </div>

        <div className="hidden md:flex md:w-2/5 md:absolute md:right-0 md:top-0 md:bottom-0 md:items-center">
          <Image
            src="/gif.svg"
            alt="Circuit Illustration"
            width={500}
            height={500}
            className="w-full h-auto md:h-full md:w-auto md:object-cover md:object-left"
          />
        </div>
      </div>
    </section>
  )
}
