import { services } from "./data"

export default function Services() {
  return (
    <section id="services" className="my-20">
      <h2 className="text-slate-100 mb-6 text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
        Everything You Need to
        <span className="block text-emerald-400">Organize Your Ideas</span>
      </h2>
      <p className="mb-12 max-w-2xl text-slate-300 text-lg">
        From simple notes to complex projects, our platform provides all the tools you need for visual thinking.
        Start organizing your ideas today.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="p-6 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur shadow-lg hover:shadow-xl hover:border-emerald-500/50 transition-all duration-300 group">
            <div className={`${service.color} w-12 h-12 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <service.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-100">{service.title}</h3>
            <p className="text-slate-300">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
