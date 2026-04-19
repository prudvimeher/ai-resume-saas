import { processSteps } from "@/components/landing/landing-content";

export default function ProcessSection() {
  return (
    <section id="process" className="px-6 py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">
            Process
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight">
            From draft to ready in three focused steps.
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {processSteps.map((step, index) => (
            <div key={step.title} className="rounded-md border border-zinc-200 p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
