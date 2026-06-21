import { useMemo, useState, useEffect } from "react";
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
              <button onClick={onRetake} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-leaf-5">Retake assessment</button>
            </div>
          </div>
          {/* Sizing Guard Fix: Explicit min-height & width percentage adjustment to prevent ResponsiveContainer size loops */}
          <div className="h-72 min-h-[288px] w-full max-w-[99%]">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={62} outerRadius={100} paddingAngle={2} stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(1)} kg CO₂e`, "Emissions"]}
                />
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

function Simulator({ assessment, original }:{ assessment: Assessment; original: Breakdown }) {
  const [carKmDelta, setCarKmDelta] = useState(0);
  const [electricityDelta, setElectricityDelta] = useState(0);
  const [redMeatDelta, setRedMeatDelta] = useState(0);

  // Auto-Reset Fix: Wipes state cleans values instantly if baseline model values swap
  useEffect(() => {
    setCarKmDelta(0);
    setElectricityDelta(0);
    setRedMeatDelta(0);
  }, [assessment.id, assessment.carKm, assessment.electricityKwh, assessment.redMeatPerWeek]);

  const simulatedAssessment: Assessment = {
    ...assessment,
    carKm: Math.max(0, assessment.carKm - carKmDelta),
    electricityKwh: Math.max(0, assessment.electricityKwh - electricityDelta),
    redMeatPerWeek: Math.max(0, assessment.redMeatPerWeek - redMeatDelta),
  };

  const projected = calculateBreakdown(simulatedAssessment);
  const reduction = Math.max(0, original.total - projected.total);

  return (
    <div className="card-soft p-6 sm:p-8">
      <h3 className="font-display text-xl font-semibold text-leaf-600">🌱 Impact Simulator</h3>
      <p className="mt-1 text-sm text-muted-foreground">Adjust absolute values below to simulate direct reductions against your actual calculation engine.</p>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Slider 
          label="Reduce Car Mileage" 
          value={carKmDelta} 
          max={assessment.carKm} 
          unit="km/wk" 
          onChange={setCarKmDelta} 
        />
        <Slider 
          label="Reduce Electricity Consumption" 
          value={electricityDelta} 
          max={assessment.electricityKwh} 
          unit="kWh/mo" 
          onChange={setElectricityDelta} 
        />
        <Slider 
          label="Reduce Red Meat Meals" 
          value={redMeatDelta} 
          max={assessment.redMeatPerWeek} 
          unit="meals/wk" 
          onChange={setRedMeatDelta} 
        />
      </div>

      <div className="mt-6 grid gap-5 rounded-xl bg-leaf-50 p-5 md:grid-cols-3">
        <Stat label="Current Baseline" value={`${original.total.toFixed(1)} kg`} tone="muted" />
        <Stat label="Projected Footprint" value={`${projected.total.toFixed(1)} kg`} tone="primary" />
        <Stat label="Net Savings Potential" value={`−${reduction.toFixed(1)} kg`} tone="accent" />
      </div>
    </div>
  );
}

function Slider({ label, value, max, unit, onChange }:{ label: string; value: number; max: number; unit: string; onChange: (n: number) => void }) {
  const isZeroBaseline = max <= 0;

  return (
    <div className={isZeroBaseline ? "opacity-40 pointer-events-none" : ""}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold text-leaf-500">
          {isZeroBaseline ? "0" : `-${value}`} {unit}
        </span>
      </div>
      <input
        type="range" 
        min={0} 
        max={isZeroBaseline ? 100 : Math.ceil(max)} 
        value={value}
        disabled={isZeroBaseline}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-leaf-300"
      />
    </div>
  );
}
