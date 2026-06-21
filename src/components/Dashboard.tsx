import { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Assessment, Breakdown } from "@/lib/carbon";
import { calculateBreakdown, deriveInsights, buildActionPlan, applySimulation } from "@/lib/carbon";

// Category palette — used consistently across donut, progress, legends, simulator highlights.
export const CATEGORY_COLORS = {
  Energy: "#F5B841",          // Golden yellow
  Food: "#97C79A",            // Light green
  Transportation: "#55A96F",  // Medium green (brand)
  Waste: "#2BA39A",           // Teal
} as const;

interface Props {
  assessment: Assessment;
  breakdown: Breakdown;
  onRetake: () => void;
}

export function Dashboard({ assessment, breakdown, onRetake }: Props) {
  const insights = useMemo(() => deriveInsights(breakdown, assessment), [breakdown, assessment]);
  const actions = useMemo(() => buildActionPlan(breakdown, assessment), [breakdown, assessment]);

  const pieData = [
    { name: "Transportation", value: breakdown.transportation },
    { name: "Energy", value: breakdown.energy },
    { name: "Food", value: breakdown.food },
    { name: "Waste", value: Math.max(0, breakdown.waste) },
  ];

  const potentialReduction = actions.reduce((s, a) => s + a.reductionKg, 0);
  const potential = Math.max(0, breakdown.total - potentialReduction);

  const highImpact = actions.find((x) => x.tier === "High Impact");
  const easyWin = actions.find((x) => x.tier === "Easy Win");
  const topReduction = actions.reduce((m, a) => (a.reductionKg > m ? a.reductionKg : m), 0);

  const storyCards = [
    { icon: "🔍", title: "Largest Contributor", body: insights.largestContributor },
    { icon: "🚀", title: "Biggest Opportunity",
      body: `${insights.biggestOpportunity} Adopting your full plan could cut roughly ${potentialReduction.toFixed(0)} kg/mo.` },
    { icon: "✅", title: "Existing Strength", body: insights.existingStrength },
    { icon: "🌟", title: "High Impact Action",
      body: highImpact ? `${highImpact.title} — about −${highImpact.reductionKg} kg/mo.` : "Take an assessment to surface your top lever." },
    { icon: "⚡", title: "Easy Win",
      body: easyWin ? `${easyWin.title} — quick to start, −${easyWin.reductionKg} kg/mo.` : "Small habits add up — start with reusables." },
  ];

  return (
    <section className="space-y-8">
      {/* Hero card */}
      <div className="card-soft overflow-hidden">
        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-leaf-500/80">Your monthly footprint</div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-6xl font-bold text-leaf-600">{breakdown.total.toFixed(1)}</span>
              <span className="text-base text-muted-foreground">kg CO₂e / month</span>
            </div>
            <div className="mt-4 inline-flex items-start gap-2 rounded-lg bg-leaf-100/60 px-3 py-2 text-xs text-leaf-600">
              <span>✅</span>
              <span><span className="font-semibold">Existing strength:</span> {insights.existingStrength}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={onRetake} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-leaf-5">Retake assessment</button>
            </div>
          </div>
          <div className="h-72 min-h-[288px] w-full max-w-[99%]">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={62} outerRadius={100} paddingAngle={2} stroke="none">
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={CATEGORY_COLORS[d.name as keyof typeof CATEGORY_COLORS]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)} kg CO₂e`, "Emissions"]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Your Carbon Story — merges Insights + Recommended Actions */}
      <div>
        <h3 className="mb-1 font-display text-xl font-semibold text-leaf-600">Your Carbon Story</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          A single narrative — where your footprint comes from, what to keep, and what to change next.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {storyCards.map((c) => (
            <InsightCard key={c.title} icon={c.icon} title={c.title} body={c.body} />
          ))}
        </div>
      </div>

      {/* Potential improvement */}
      <div className="card-soft p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Stat label="Current footprint" value={`${breakdown.total.toFixed(1)} kg`} tone="muted" />
          <Stat label="If you adopt the plan" value={`${potential.toFixed(1)} kg`} tone="primary" />
          <Stat label="Potential reduction" value={`−${potentialReduction.toFixed(1)} kg`} tone="accent" />
        </div>
        {topReduction > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Your top single action alone could remove about {topReduction} kg/mo.
          </p>
        )}
      </div>

      <Simulator assessment={assessment} original={breakdown} />
    </section>
  );
}

function InsightCard({ icon, title, body }:{ icon: string; title: string; body: string }) {
  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="font-display text-sm font-semibold text-leaf-600">{title}</span>
      </div>
      <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{body}</p>
    </div>
  );
}

function Stat({ label, value, tone }:{ label: string; value: string; tone: "muted"|"primary"|"accent" }) {
  const cls = tone === "primary" ? "text-leaf-600" : tone === "accent" ? "text-leaf-500" : "text-foreground";
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-3xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}

interface SimState {
  carKm: number;
  electricity: number;
  redMeat: number;
  acHours: number;
  bus: number;
  foodWasteSteps: number;     // negative = better
  shortFlights: number;
  recyclingSteps: number;     // positive = better
}

const initSim: SimState = {
  carKm: 0, electricity: 0, redMeat: 0, acHours: 0, bus: 0,
  foodWasteSteps: 0, shortFlights: 0, recyclingSteps: 0,
};

function Simulator({ assessment, original }:{ assessment: Assessment; original: Breakdown }) {
  const [s, setS] = useState<SimState>(initSim);

  useEffect(() => { setS(initSim); }, [assessment.id]);

  const set = <K extends keyof SimState>(k: K, v: number) => setS((prev) => ({ ...prev, [k]: v }));

  const projected = useMemo(
    () =>
      calculateBreakdown(
        applySimulation(assessment, {
          carKmAdjustment: -s.carKm,
          electricityKwhAdjustment: -s.electricity,
          redMeatMealsAdjustment: -s.redMeat,
          acHoursAdjustment: -s.acHours,
          busKmAdjustment: s.bus,
          foodWasteSteps: -s.foodWasteSteps,
          shortFlightsAdjustment: -s.shortFlights,
          recyclingSteps: s.recyclingSteps,
        }),
      ),
    [assessment, s],
  );
  const reduction = Math.max(0, original.total - projected.total);

  return (
    <div className="card-soft p-6 sm:p-8">
      <h3 className="font-display text-xl font-semibold text-leaf-600">🌱 Impact Simulator</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Adjust the levers below — projections update live against your real calculation engine.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Slider label="Reduce car mileage" category="Transportation"
          value={s.carKm} max={assessment.carKm} unit="km/wk"
          onChange={(v) => set("carKm", v)} />
        <Slider label="Shift trips to public transit" category="Transportation"
          value={s.bus} max={Math.max(20, assessment.carKm)} unit="km/wk added"
          onChange={(v) => set("bus", v)} />
        <Slider label="Reduce short flights" category="Transportation"
          value={s.shortFlights} max={assessment.shortFlights} unit="flights/yr"
          onChange={(v) => set("shortFlights", v)} />

        <Slider label="Reduce electricity" category="Energy"
          value={s.electricity} max={assessment.electricityKwh} unit="kWh/mo"
          onChange={(v) => set("electricity", v)} />
        <Slider label="Reduce AC usage" category="Energy"
          value={s.acHours} max={assessment.acHoursPerDay} unit="hrs/day"
          onChange={(v) => set("acHours", v)} />

        <Slider label="Reduce red-meat meals" category="Food"
          value={s.redMeat} max={assessment.redMeatPerWeek} unit="meals/wk"
          onChange={(v) => set("redMeat", v)} />
        <Slider label="Reduce food waste" category="Food"
          value={s.foodWasteSteps} max={3} unit="steps better"
          onChange={(v) => set("foodWasteSteps", v)} />

        <Slider label="Recycle more often" category="Waste"
          value={s.recyclingSteps} max={3} unit="steps better"
          onChange={(v) => set("recyclingSteps", v)} />
      </div>

      <div className="mt-6 grid gap-5 rounded-xl bg-leaf-50 p-5 md:grid-cols-3">
        <Stat label="Current footprint" value={`${original.total.toFixed(1)} kg`} tone="muted" />
        <Stat label="Your new footprint" value={`${projected.total.toFixed(1)} kg`} tone="primary" />
        <Stat label="Potential savings" value={`−${reduction.toFixed(1)} kg`} tone="accent" />
      </div>
      <div className="mt-3 text-center text-sm font-semibold text-leaf-600">
        {original.total > 0
          ? `${((reduction / original.total) * 100).toFixed(1)}% reduction from your current footprint`
          : "Adjust the sliders to see your potential reduction"}
      </div>
    </div>
  );
}

function Slider({
  label, value, max, unit, onChange, category,
}:{
  label: string; value: number; max: number; unit: string;
  onChange: (n: number) => void;
  category: keyof typeof CATEGORY_COLORS;
}) {
  const isZeroBaseline = max <= 0;
  const color = CATEGORY_COLORS[category];

  return (
    <div className={isZeroBaseline ? "opacity-40 pointer-events-none" : ""}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </div>
        <span className="text-sm font-semibold" style={{ color }}>
          {isZeroBaseline ? "0" : value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={isZeroBaseline ? 100 : Math.ceil(max)}
        value={value}
        disabled={isZeroBaseline}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
        style={{ accentColor: color }}
      />
    </div>
  );
}
