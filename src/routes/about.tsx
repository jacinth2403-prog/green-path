import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Carbon Compass" },
      { name: "description", content: "Why we built Carbon Compass, how it works, and the methodology behind every estimate." },
    ],
  }),
  component: AboutPage,
});

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
          Climate change can feel abstract. We wanted a calm, jargon-free way for individuals — students, professionals, anyone curious — to see where their own emissions actually come from, and to leave with one or two concrete things to try next month.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-leaf-600">How it works</h2>
        <ol className="mt-3 space-y-3">
          {["Take a 5-minute assessment across 5 lifestyle categories.",
            "We compute a monthly carbon estimate using transparent emission factors.",
            "You receive personalized insights and a tiered action plan.",
            "Save assessments to track your progress over time."].map((s, i) => (
            <li key={i} className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leaf-100 text-sm font-semibold text-leaf-600">{i + 1}</span>
              <span className="text-foreground/80">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl font-semibold text-leaf-600">Methodology</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-foreground/80 leading-relaxed">
          <li><b>Home energy</b> — electricity at 0.73 kg CO₂/kWh; LPG and water tiered by typical monthly usage.</li>
          <li><b>Transportation</b> — petrol 0.19, diesel 0.17, motorcycle 0.08, bus 0.05, metro 0.03 kg/km. Flights amortized monthly.</li>
          <li><b>Food</b> — diet base + red meat, white meat/fish, dairy, and food waste modifiers.</li>
          <li><b>Waste</b> — daily trash baseline, recycling reduction (-20% to 0%), clothing and electronics turnover.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-display text-xl font-semibold text-leaf-600">Data sources</h2>
        <p className="text-foreground/80 leading-relaxed">
          Emission factors are drawn from publicly referenced carbon-accounting work, including India-focused sustainability sources. Numbers are simplified for clarity and rounded for honesty.
        </p>
      </section>

      <section className="mt-10 rounded-xl border border-leaf-200/60 bg-leaf-100/40 p-5">
        <h2 className="font-display text-base font-semibold text-leaf-600">Disclaimer</h2>
        <p className="mt-1 text-sm text-foreground/75">
          Results are estimates intended to support awareness and sustainable decision-making — not regulatory reporting.
        </p>
      </section>
    </div>
  );
}
