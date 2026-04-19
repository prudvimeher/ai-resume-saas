import { metrics } from "@/components/landing/landing-content";

export default function MetricsSection() {
  return (
    <section className="border-b border-zinc-200 px-6 py-10 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.value} className="rounded-md border border-zinc-200 p-6">
            <p className="text-3xl font-semibold">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
