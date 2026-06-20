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
            <li key={step.title}>
              <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf-100 text-sm font-semibold text-leaf-600">
                  {i + 1}
                </span>
                <div>
                  <div className="font-medium text-leaf-600">{step.title}</div>
                  <div className="mt-0.5 text-sm text-foreground/75">{step.desc}</div>
                </div>
              </div>
              {i < FLOW.length - 1 && (
                <div aria-hidden className="my-1 flex justify-center text-leaf-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" />
                    <path d="m6 13 6 6 6-6" />
                  </svg>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="font-display text-xl font-semibold text-leaf-600">Methodology</h2>
        <p className="text-foreground/80 leading-relaxed">
          Carbon emissions are estimated using <b>activity-based calculations</b>: each lifestyle input you provide is
          multiplied by a published <b>emission factor</b> (kg CO₂e per unit) and aggregated into a monthly total. We
          group activities into four everyday categories:
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-card p-4">
              <div className="font-medium text-leaf-600">{c.name}</div>
              <div className="mt-1 text-sm text-foreground/75">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-3">
        <h2 className="font-display text-xl font-semibold text-leaf-600">Data sources</h2>
        <p className="text-foreground/80 leading-relaxed">
          Our emission factors are drawn from publicly available carbon-accounting methodologies and reference datasets,
          including the IPCC guidelines for national greenhouse gas inventories, the GHG Protocol, the UK DEFRA
          conversion factors, the US EPA emission factors hub, and the IEA energy statistics. Values are simplified and
          rounded for clarity, and are reviewed periodically as better references become available.
        </p>
      </section>

      <section className="mt-12 rounded-xl border border-leaf-200/60 bg-leaf-100/40 p-5">
        <h2 className="font-display text-base font-semibold text-leaf-600">Disclaimer</h2>
        <p className="mt-1 text-sm text-foreground/75">
          Results are estimates intended to support awareness and sustainable decision-making. They are not suitable for
          regulatory reporting, offsets accounting, or comparison between individuals.
        </p>
      </section>
    </div>
  );
}
