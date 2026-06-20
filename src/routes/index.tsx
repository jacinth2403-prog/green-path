import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AssessmentWizard } from "@/components/AssessmentWizard";
import { Dashboard } from "@/components/Dashboard";
import { calculateBreakdown, type Assessment, type Breakdown } from "@/lib/carbon";
import { getAnonId, latestEntry, saveEntry } from "@/lib/cc-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Carbon Compass — Understand Your Impact" },
      { name: "description", content: "Calculate your monthly carbon footprint and get personalized actions to reduce it." },
      { property: "og:title", content: "Carbon Compass" },
      { property: "og:description", content: "Understand your impact. Track your progress. Reduce your footprint." },
    ],
  }),
  component: Index,
});

type View = "landing" | "wizard" | "dashboard";

function Index() {
  const [view, setView] = useState<View>("landing");
  const [current, setCurrent] = useState<{ a: Assessment; b: Breakdown } | null>(null);
  const [anonId, setAnonId] = useState("");

  useEffect(() => {
    setAnonId(getAnonId());
    const last = latestEntry();
    if (last) {
      setCurrent({ a: last.assessment, b: last.breakdown });
      setView("dashboard");
    }
  }, []);

  const handleComplete = (a: Assessment) => {
    const b = calculateBreakdown(a);
    saveEntry({ assessment: a, breakdown: b });
    setCurrent({ a, b });
    setView("dashboard");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {view === "landing" && <Landing onStart={() => setView("wizard")} anonId={anonId} />}

      {view === "wizard" && (
        <div className="mx-auto max-w-6xl px-5 py-10">
          <AssessmentWizard onComplete={handleComplete} onCancel={() => setView("landing")} />
        </div>
      )}

      {view === "dashboard" && current && (
        <div className="mx-auto max-w-6xl px-5 py-10">
          <Dashboard
            assessment={current.a}
            breakdown={current.b}
            onRetake={() => setView("wizard")}
          />
        </div>
      )}
    </div>
  );
}

function Landing({ onStart, anonId }:{ onStart: () => void; anonId: string }) {
  return (
    <div>
      {/* Hero */}
      <section className="hero-bg">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="inline-flex items-center gap-2 rounded-full border border-leaf-200/60 bg-white/70 px-3 py-1 text-xs font-medium text-leaf-600">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-300 animate-pulse" />
                Personal sustainability dashboard
              </div>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] text-leaf-600 sm:text-6xl">
                Understand your impact.<br/>
                <span className="text-leaf-300">Track your progress.</span><br/>
                Reduce your footprint.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg">
                Measure your monthly carbon footprint and receive personalized recommendations to build more sustainable habits — no login required.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={onStart} className="rounded-xl bg-leaf-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-leaf-500/20 transition hover:bg-leaf-600 hover:shadow-xl">
                  Start assessment →
                </button>
                {anonId && (
                  <span className="rounded-lg border border-border bg-white/70 px-3 py-2 text-xs text-muted-foreground">
                    Anonymous ID: <span className="font-mono font-medium text-leaf-600">{anonId}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-leaf-200/30 blur-3xl" />
              <div className="card-soft relative grid gap-4 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Monthly footprint</div>
                    <div className="mt-1 font-display text-4xl font-bold text-leaf-600">198<span className="ml-1 text-base font-medium text-muted-foreground">kg CO₂e</span></div>
                  </div>
                  <span className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-semibold text-leaf-600">Sample</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Transportation", v: 78, c: "bg-leaf-300" },
                    { label: "Energy", v: 60, c: "bg-leaf-400" },
                    { label: "Food", v: 42, c: "bg-leaf-200" },
                    { label: "Waste", v: 18, c: "bg-leaf-500" },
                  ].map((r) => (
                    <div key={r.label}>
                      <div className="flex justify-between text-xs"><span className="text-foreground/70">{r.label}</span><span className="font-medium">{r.v} kg</span></div>
                      <div className="mt-1 h-2 rounded-full bg-leaf-100/70 overflow-hidden">
                        <div className={`h-full ${r.c}`} style={{ width: `${(r.v / 78) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-leaf-600 sm:text-4xl">How it works</h2>
          <p className="mt-2 text-muted-foreground">Three honest steps from awareness to action.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Card icon="📊" title="Understand" body="Answer 20 quick questions across energy, transport, food, and waste to calculate your monthly carbon footprint." />
          <Card icon="📈" title="Track" body="Save assessments locally and watch your footprint trend over time, by month and by category." />
          <Card icon="🎯" title="Reduce" body="Get a tailored action plan with high-impact, medium-impact, and easy wins — plus an interactive simulator." />
        </div>
      </section>
    </div>
  );
}

function Card({ icon, title, body }:{ icon: string; title: string; body: string }) {
  return (
    <div className="card-soft p-6 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-leaf-100 text-2xl">{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold text-leaf-600">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">{body}</p>
    </div>
  );
}
