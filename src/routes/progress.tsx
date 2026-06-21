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
          <h2 className="mt-4 font-display text-xl font-semibold text-leaf-600">No assessments yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Take your first assessment to start tracking.</p>
          <Link to="/" className="mt-5 inline-block rounded-lg bg-leaf-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-leaf-600">Start assessment</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {history.length > 1 && (() => {
  const first = history[0].breakdown.total;
  const latest = history[history.length - 1].breakdown.total;

  const improvement =
    first > 0
      ? (((first - latest) / first) * 100).toFixed(1)
      : "0";

  const best = Math.min(
    ...history.map((h) => h.breakdown.total)
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card-soft p-5">
        <div className="text-xs uppercase text-muted-foreground">
          Current Footprint
        </div>
        <div className="mt-2 text-3xl font-bold text-leaf-600">
          {latest.toFixed(1)} kg
        </div>
      </div>

      <div className="card-soft p-5">
        <div className="text-xs uppercase text-muted-foreground">
          Best Footprint
        </div>
        <div className="mt-2 text-3xl font-bold text-leaf-500">
          {best.toFixed(1)} kg
        </div>
      </div>

      <div className="card-soft p-5">
        <div className="text-xs uppercase text-muted-foreground">
          Improvement
        </div>
        <div className="mt-2 text-3xl font-bold text-leaf-600">
          {Number(improvement) >= 0 ? "↓" : "↑"}{" "}
          {Math.abs(Number(improvement)).toFixed(1)}%
        </div>
      </div>
    </div>
  );
})()}
          <div className="card-soft p-6">
            <h2 className="font-display text-lg font-semibold text-leaf-600">Total footprint trend</h2>
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
