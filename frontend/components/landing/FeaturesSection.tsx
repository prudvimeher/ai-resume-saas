import { features } from "@/components/landing/landing-content";

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-zinc-50 px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Features
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight">
            Everything you need to send a stronger resume.
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-600">
            Make each application sharper with feedback that is specific,
            practical, and easy to act on.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-md border border-zinc-200 bg-white p-6"
            >
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
