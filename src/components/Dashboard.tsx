import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Assessment, Breakdown } from "@/lib/carbon";
import { calculateBreakdown, deriveInsights, buildActionPlan, impactStatus } from "@/lib/carbon";

const COLORS = ["#55A96F", "#438F59", "#97C79A", "#2D6D47"];

interface Props {
  assessment: Assessment;
  breakdown: Breakdown;
  onRetake: () => void;
}

export function Dashboard({ assessment, breakdown, onRetake }: Props) {
  const status = impactStatus(breakdown.total);
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
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-leaf-100/70 px-3 py-1.5 text-sm font-medium text-leaf-600">
              <span className={`h-2 w-2 rounded-full ${status.tone === "low" ? "bg-leaf-300" : status.tone === "moderate" ? "bg-yellow-500" : "bg-red-500"}`} />
              {status.label}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={onRetake} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-leaf-50">Retake assessment</button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={62} outerRadius={100} paddingAngle={2} stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toFixed(1)} kg`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div>
        <h3 className="mb-3 font-display text-xl font-semibold text-leaf-600">Key insights</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <InsightCard icon="🔍" title="Largest contributor" body={insights.largestContributor} />
          <InsightCard icon="🚀" title="Biggest opportunity" body={insights.biggestOpportunity} />
          <InsightCard icon="✅" title="Existing strength" body={insights.existingStrength} />
        </div>
      </div>

      {/* Action plan */}
      <div>
        <h3 className="mb-3 font-display text-xl font-semibold text-leaf-600">Personalized action plan</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {actions.map((a) => (
            <div key={a.title} className="card-soft p-5">
              <div className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                a.tier === "High Impact" ? "bg-leaf-500 text-white"
                  : a.tier === "Medium Impact" ? "bg-leaf-300 text-white"
                  : "bg-leaf-100 text-leaf-600"
              }`}>{a.tier}</div>
              <div className="mt-3 font-display text-base font-semibold text-foreground">{a.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{a.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Potential reduction</span>
                <span className="text-sm font-semibold text-leaf-500">−{a.reductionKg} kg/mo</span>
              </div>
            </div>
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
      </div>

      {/* Simulator */}
      <Simulator assessment={assessment} />
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

function Simulator({ assessment }:{ assessment: Assessment }) {
  const [carCut, setCarCut] = useState(0);
  const [acCut, setAcCut] = useState(0);
  const [redMeatCut, setRedMeatCut] = useState(0);
  const [wasteCut, setWasteCut] = useState(0);

  const adjusted: Assessment = {
    ...assessment,
    carKm: assessment.carKm * (1 - carCut / 100),
    electricityKwh: assessment.electricityKwh * (1 - (acCut * 0.6) / 100),
    redMeatPerWeek: Math.max(0, assessment.redMeatPerWeek * (1 - redMeatCut / 100)),
  };
  const wasteFactor = 1 - wasteCut / 100;
  const original = calculateBreakdown(assessment);
  let projected = calculateBreakdown(adjusted);
  projected = { ...projected, waste: projected.waste * wasteFactor, total: projected.total - projected.waste * (1 - wasteFactor) };
  projected.total = Math.max(0, projected.total);

  const reduction = Math.max(0, original.total - projected.total);

  return (
    <div className="card-soft p-6 sm:p-8">
      <h3 className="font-display text-xl font-semibold text-leaf-600">🌱 Impact simulator</h3>
      <p className="mt-1 text-sm text-muted-foreground">Slide the levers — see your projected footprint update instantly.</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Slider label="Reduce car travel" value={carCut} onChange={setCarCut} />
        <Slider label="Reduce AC usage" value={acCut} onChange={setAcCut} />
        <Slider label="Reduce red meat" value={redMeatCut} onChange={setRedMeatCut} />
        <Slider label="Reduce waste" value={wasteCut} onChange={setWasteCut} />
      </div>

      <div className="mt-6 grid gap-5 rounded-xl bg-leaf-50 p-5 md:grid-cols-3">
        <Stat label="Current" value={`${original.total.toFixed(1)} kg`} tone="muted" />
        <Stat label="Projected" value={`${projected.total.toFixed(1)} kg`} tone="primary" />
        <Stat label="Potential reduction" value={`−${reduction.toFixed(1)} kg`} tone="accent" />
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }:{ label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold text-leaf-500">−{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-leaf-300"
      />
    </div>
  );
}
