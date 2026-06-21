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
          {<section className="mt-12">
  <h2 className="font-display text-xl font-semibold text-leaf-600">
    Simple Process
  </h2>

  <div className="mt-4 grid gap-4 md:grid-cols-3">
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-medium text-leaf-600">1. Assess</div>
      <div className="mt-1 text-sm text-foreground/75">
        Answer a short lifestyle questionnaire.
      </div>
    </div>

    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-medium text-leaf-600">2. Understand</div>
      <div className="mt-1 text-sm text-foreground/75">
        Explore personalized insights and recommendations.
      </div>
    </div>

    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-medium text-leaf-600">3. Improve</div>
      <div className="mt-1 text-sm text-foreground/75">
        Track progress and reduce your footprint over time.
      </div>
    </div>
  </div>
</section>
        </ol>
      </section>

{/* How It Works */}
<section className="mt-12">
  <h2 className="font-display text-xl font-semibold text-leaf-600">
    How Carbon Compass Works
  </h2>

  <p className="mt-3 text-foreground/80 leading-relaxed">
    Carbon Compass estimates your monthly carbon footprint based on everyday
    lifestyle choices across four areas:
    <span className="font-medium text-leaf-600">
      {" "}Energy, Transportation, Food, and Waste.
    </span>
    {" "}Your responses are matched with emission factors to generate a
    personalized footprint, insights, and practical reduction strategies.
  </p>
</section>

{/* Data Sources */}
<section className="mt-10">
  <h2 className="font-display text-xl font-semibold text-leaf-600">
    Data Sources
  </h2>

  <p className="mt-3 text-foreground/80 leading-relaxed">
    Calculations are based on internationally recognized references including
    the IPCC, GHG Protocol, DEFRA, EPA, and IEA. Values are simplified for
    educational and awareness purposes.
  </p>
</section>

{/* Disclaimer */}
<section className="mt-10 rounded-xl border border-leaf-200/60 bg-leaf-100/40 p-5">
  <h2 className="font-display text-base font-semibold text-leaf-600">
    Disclaimer
  </h2>

  <p className="mt-1 text-sm text-foreground/75">
    Results are estimates designed to support awareness and sustainable
    decision-making. They should not be used for regulatory or formal carbon
    reporting.
  </p>
</section>
    </div>
  );
}
