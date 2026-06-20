import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { getHistory, clearHistory, type StoredEntry } from "@/lib/cc-storage";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Carbon Compass" },
      { name: "description", content: "Track your carbon footprint over time and watch each category trend." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const [history, setHistory] = useState<StoredEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const data = history.map((e, i) => ({
    name: `#${i + 1}`,
    date: new Date(e.assessment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    Total: e.breakdown.total,
    Energy: e.breakdown.energy,
    Transportation: e.breakdown.transportation,
    Food: e.breakdown.food,
    Waste: Math.max(0, e.breakdown.waste),
  }));

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-leaf-600">Your progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every assessment lives here so you can see your direction over time.</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => { if (confirm("Clear all assessment history?")) { clearHistory(); setHistory([]); } }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-leaf-50"
          >Clear history</button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card-soft mt-8 p-12 text-center">
          <div className="text-5xl">🌱</div>
          <h2 className="mt-4 font-display text-xl font-semibold text-leaf-600">No history yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Progress shows up once you've saved a few assessments. Try one this month, then come back next month — small, repeated check-ins are how the trend takes shape.
          </p>
          <Link to="/" className="mt-5 inline-block rounded-lg bg-leaf-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-600">Take an assessment</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <MonthlyTrendSummary data={data} />

          <div className="card-soft p-6">
            <h2 className="font-display text-lg font-semibold text-leaf-600">Historical carbon footprint</h2>
            <p className="mt-1 text-sm text-muted-foreground">Total monthly kg CO₂e across all saved assessments.</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ecdf" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Total" stroke="#2D6D47" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-soft p-6">
            <h2 className="font-display text-lg font-semibold text-leaf-600">Category trends</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5ecdf" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Energy" stackId="a" fill="#438F59" />
                  <Bar dataKey="Transportation" stackId="a" fill="#55A96F" />
                  <Bar dataKey="Food" stackId="a" fill="#97C79A" />
                  <Bar dataKey="Waste" stackId="a" fill="#B7D3B8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-soft overflow-hidden">
            <h2 className="px-6 pt-6 font-display text-lg font-semibold text-leaf-600">Assessment history</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-leaf-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3">Energy</th>
                    <th className="px-6 py-3">Transport</th>
                    <th className="px-6 py-3">Food</th>
                    <th className="px-6 py-3">Waste</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((e) => (
                    <tr key={e.assessment.id} className="border-t border-border">
                      <td className="px-6 py-3">{new Date(e.assessment.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-3 font-semibold text-leaf-600">{e.breakdown.total.toFixed(1)} kg</td>
                      <td className="px-6 py-3">{e.breakdown.energy.toFixed(1)}</td>
                      <td className="px-6 py-3">{e.breakdown.transportation.toFixed(1)}</td>
                      <td className="px-6 py-3">{e.breakdown.food.toFixed(1)}</td>
                      <td className="px-6 py-3">{Math.max(0, e.breakdown.waste).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ChartRow = {
  name: string;
  date: string;
  Total: number;
  Energy: number;
  Transportation: number;
  Food: number;
  Waste: number;
};

function MonthlyTrendSummary({ data }: { data: ChartRow[] }) {
  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : null;
  const totals = data.map((d) => d.Total);
  const average = totals.reduce((a, b) => a + b, 0) / totals.length;
  const best = Math.min(...totals);
  const change = previous ? latest.Total - previous.Total : 0;
  const changePct = previous && previous.Total > 0 ? (change / previous.Total) * 100 : 0;
  const trendDown = change < 0;

  const stats = [
    { label: "Latest footprint", value: `${latest.Total.toFixed(1)} kg`, sub: latest.date },
    {
      label: "Change vs previous",
      value: previous ? `${trendDown ? "↓" : change > 0 ? "↑" : "•"} ${Math.abs(changePct).toFixed(1)}%` : "—",
      sub: previous ? `${change >= 0 ? "+" : ""}${change.toFixed(1)} kg` : "Need 2+ assessments",
      tone: previous ? (trendDown ? "good" : change > 0 ? "warn" : "neutral") : "neutral",
    },
    { label: "Average", value: `${average.toFixed(1)} kg`, sub: `${data.length} assessment${data.length === 1 ? "" : "s"}` },
    { label: "Best month", value: `${best.toFixed(1)} kg`, sub: "Lowest recorded" },
  ] as const;

  return (
    <div className="card-soft p-6">
      <h2 className="font-display text-lg font-semibold text-leaf-600">Monthly trend summary</h2>
      <p className="mt-1 text-sm text-muted-foreground">A snapshot of how your footprint is moving.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div
              className={
                "mt-1 font-display text-2xl font-semibold " +
                ("tone" in s && s.tone === "good"
                  ? "text-leaf-600"
                  : "tone" in s && s.tone === "warn"
                    ? "text-amber-600"
                    : "text-leaf-600")
              }
            >
              {s.value}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
