import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Carbon Compass" },
      { name: "description", content: "Why we built Carbon Compass, how it works, the methodology behind estimates, and our data sources." },
    ],
  }),
  component: AboutPage,
});

const FLOW = [
  { title: "Assessment", desc: "Answer a short set of questions about your home, travel, food and waste." },
  { title: "Carbon Analysis", desc: "Activity inputs are converted into kg CO₂e using transparent emission factors." },
  { title: "Personalized Insights", desc: "See where your footprint comes from and which actions matter most for you." },
  { title: "Progress Tracking", desc: "Save monthly assessments to watch your footprint trend over time." },
];

const CATEGORIES = [
  { name: "Home Energy", desc: "Electricity, cooking fuel and water use at home." },
  { name: "Transportation", desc: "Daily commute, personal vehicles, public transit and flights." },
  { name: "Food", desc: "Diet pattern, animal products and food waste." },
  { name: "Waste", desc: "Trash generation, recycling habits and consumption turnover." },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <header>
        <div className="text-xs uppercase tracking-[0.18em] text-leaf-500/80">About Carbon Compass</div>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-leaf-600">
          A small, honest tool for understanding personal climate impact.
        </h1>
      </header>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl font-semibold text-leaf-600">Why we built this</h2>
        <p className="text-foreground/80 leading-relaxed">
          Climate change can feel abstract and overwhelming. Carbon Compass exists to make it personal and actionable —
          helping individuals <b>understand</b> where their emissions actually come from, <b>track</b> them month over
          month, and <b>reduce</b> them through small, realistic changes. No jargon, no guilt, just a calm view of your
          footprint and a clear next step.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-leaf-600">How it works</h2>
        <ol className="mt-4 space-y-2">
          {FLOW.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-border bg-card p-4">
              <div className="font-medium text-leaf-600">{i + 1}. {step.title}</div>
              <div className="mt-1 text-sm text-foreground/75">{step.desc}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-leaf-600">Methodology</h2>
        <p className="mt-3 text-foreground/80 leading-relaxed">
          Emissions are estimated using activity-based calculations multiplied by published emission factors,
          across four categories:
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {CATEGORIES.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-card p-4">
              <div className="font-medium text-leaf-600">{c.name}</div>
              <div className="mt-1 text-sm text-foreground/75">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-leaf-600">Data Sources</h2>
        <p className="mt-3 text-foreground/80 leading-relaxed">
          Calculations draw on publicly available carbon accounting methodologies and emission factor references,
          including the IPCC, GHG Protocol, DEFRA, EPA, and IEA. Values are simplified for educational and awareness
          purposes.
        </p>
      </section>

      <section className="mt-10 rounded-xl border border-leaf-200/60 bg-leaf-100/40 p-5">
        <h2 className="font-display text-base font-semibold text-leaf-600">Disclaimer</h2>
        <p className="mt-1 text-sm text-foreground/75">
          Results are estimates intended to support awareness and sustainable decision-making.
        </p>
      </section>
    </div>
  );
}
