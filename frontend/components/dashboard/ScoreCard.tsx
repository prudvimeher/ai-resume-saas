type ScoreCardProps = {
  score: number;
  suggestions: string[];
};

export default function ScoreCard({ score, suggestions }: ScoreCardProps) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Resume Score</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950">
            {score} / 100
          </h1>
        </div>
        <span className="rounded-md bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
          Ready to improve
        </span>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-zinc-950">
          Recommended fixes
        </h2>
        <ul className="mt-4 space-y-3">
          {suggestions.map((suggestion) => (
            <li key={suggestion} className="flex gap-3 text-sm text-zinc-600">
              <span className="mt-2 h-1.5 w-1.5 rounded-md bg-emerald-500" />
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
