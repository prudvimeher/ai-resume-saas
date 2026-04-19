const scoreRows = [
  { label: "Keyword match", status: "Strong", width: "w-11/12", color: "bg-emerald-500" },
  { label: "Impact clarity", status: "Improving", width: "w-4/5", color: "bg-sky-500" },
  { label: "ATS structure", status: "Ready", width: "w-10/12", color: "bg-zinc-900" },
];

export default function ProductPreview() {
  return (
    <div className="rounded-md bg-white p-5 text-zinc-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <p className="text-sm font-semibold">Resume Score</p>
          <p className="mt-1 text-sm text-zinc-500">Product Manager</p>
        </div>
        <span className="rounded-md bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
          92
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {scoreRows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-sm">
              <span className="font-medium">{row.label}</span>
              <span className="text-zinc-500">{row.status}</span>
            </div>
            <div className="mt-2 h-2 rounded-md bg-zinc-100">
              <div className={`h-2 rounded-md ${row.width} ${row.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold">Next best edit</p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Add measurable outcomes to your top two project bullets.
        </p>
      </div>
    </div>
  );
}
