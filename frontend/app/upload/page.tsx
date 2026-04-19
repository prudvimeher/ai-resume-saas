import Navbar from "@/components/layout/Navbar";
import UploadBox from "@/components/upload/UploadBox";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <Navbar />

      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-16 lg:px-8">
        <div className="mb-8 max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight">
            Upload your resume
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">
            Add your current resume and start with a clean, actionable review.
          </p>
        </div>

        <UploadBox />
      </section>
    </main>
  );
}
