import Image from "next/image"
import Link from "next/link"

export default function Hero() {
  return (
    <section id="hero" className="my-8 relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur shadow-xl">
      <div className="p-8 md:p-10 lg:p-12 flex flex-col md:flex-row items-start">
        <div className="w-full md:w-3/5 z-10">
          <h1 className="text-slate-100 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Create & Organize on Your
            <span className="block text-emerald-400">Infinite Canvas</span>
          </h1>
          <p className="my-6 text-base md:text-lg max-w-md text-slate-300">
            Build free-form boards with notes, lists, and images. 
            Organize your ideas with tags, categories, and visual grouping.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-emerald-500/50">
              Start Creating
            </Link>
            <a href="#features" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-100 font-medium rounded-lg border border-white/10 transition-colors">
              Learn More
            </a>
          </div>
        </div>

        <div className="hidden md:flex md:w-2/5 md:absolute md:right-0 md:top-0 md:bottom-0 md:items-center">
          <Image
            src="/8bvaKz01 (1).svg"
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
