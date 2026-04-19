import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import ProductPreview from "@/components/landing/ProductPreview";

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-zinc-950 text-white"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(9, 9, 11, 0.94), rgba(9, 9, 11, 0.72), rgba(9, 9, 11, 0.28)), url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <Navbar variant="dark" />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="max-w-3xl">
          <p className="mb-6 inline-flex rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-emerald-100">
            Built for serious job searches
          </p>

          <h1 className="max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">
            Improve your resume before the recruiter sees it.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-200">
            Get a focused resume score, role-specific feedback, and clear edits
            that make your experience easier to understand.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/upload"
              className="rounded-md bg-emerald-400 px-5 py-3 text-center text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Optimize My Resume
            </Link>
            <a
              href="#features"
              className="rounded-md border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              Explore Features
            </a>
          </div>
        </div>

        <ProductPreview />
      </div>
    </section>
  );
}
