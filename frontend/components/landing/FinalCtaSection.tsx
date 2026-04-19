import Link from "next/link";

export default function FinalCtaSection() {
  return (
    <section className="bg-zinc-950 px-6 py-16 text-white lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-300">
            Ready for the next application?
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">
            Upload your resume and get a sharper version today.
          </h2>
        </div>
        <Link
          href="/upload"
          className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          Start Optimizing
        </Link>
      </div>
    </section>
  );
}
