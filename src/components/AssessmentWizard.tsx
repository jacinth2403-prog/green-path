import { useState } from "react";
import type { Assessment } from "@/lib/carbon";

const defaults: Omit<Assessment, "id" | "createdAt"> = {
  electricityKwh: 200,
  householdSize: 3,
  acHoursPerDay: 4,
  cookingFuel: "lpg_1",
  waterTier: "5to10k",
  carKm: 50,
  motorcycleKm: 0,
  busKm: 20,
  metroKm: 30,
  bicycleKm: 0,
  walkingKm: 5,
  fuelType: "petrol",
  shortFlights: 1,
  longFlights: 0,
  diet: "mixed",
  redMeatPerWeek: 2,
  whiteMeatPerWeek: 3,
  dairy: "medium",
  foodWaste: "sometimes",
  trash: "one_bin",
  recycling: "sometimes",
  clothing: "6_15",
  electronics: "3to5y",
  reusables: "sometimes",
  improveArea: "transportation",
  willingness: "moderate",
};

const STEPS = ["Home Energy", "Transportation", "Food", "Waste & Consumption", "Personalization"] as const;

interface Props {
  onComplete: (a: Assessment) => void;
  onCancel?: () => void;
}

export function AssessmentWizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(defaults);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  const update = <K extends keyof typeof data>(k: K, v: (typeof data)[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setLoading(true);
    const messages = [
      "Analyzing energy…",
      "Analyzing transportation…",
      "Analyzing food habits…",
      "Generating recommendations…",
      "Preparing dashboard…",
    ];
    for (const m of messages) {
      setLoadingMsg(m);
      await new Promise((r) => setTimeout(r, 480));
    }
    const a: Assessment = {
      ...data,
      id: `A-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    onComplete(a);
  };

  if (loading) {
    return (
      <div className="card-soft mx-auto max-w-xl p-12 text-center">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-leaf-100 border-t-leaf-300" />
        <div className="mt-6 font-display text-lg font-semibold text-leaf-600">{loadingMsg}</div>
        <div className="mt-1 text-sm text-muted-foreground">Crunching the numbers…</div>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="card-soft mx-auto max-w-3xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-leaf-100/60">
          <div className="h-full rounded-full bg-leaf-300 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-semibold text-leaf-600">{STEPS[step]}</h2>
      </div>

      <div className="space-y-5">
        {step === 0 && <StepEnergy data={data} update={update} />}
        {step === 1 && <StepTransport data={data} update={update} />}
        {step === 2 && <StepFood data={data} update={update} />}
        {step === 3 && <StepWaste data={data} update={update} />}
        {step === 4 && <StepPersonal data={data} update={update} />}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          onClick={step === 0 ? onCancel : prev}
          className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground/80 hover:bg-leaf-50"
        >
          {step === 0 ? "Cancel" : "Previous"}
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={next} className="rounded-lg bg-leaf-300 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-leaf-400">
            Next →
          </button>
        ) : (
          <button onClick={submit} className="rounded-lg bg-leaf-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-leaf-600">
            Generate Report
          </button>
        )}
      </div>
    </div>
  );
}

type Updater = <K extends keyof typeof defaults>(k: K, v: (typeof defaults)[K]) => void;
interface StepProps { data: typeof defaults; update: Updater; }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-medium text-foreground">{label}</div>
      {children}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </label>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm focus:border-leaf-300 focus:outline-none focus:ring-2 focus:ring-leaf-300/30";

function ChoiceGrid<T extends string>({ value, onChange, options, cols = 2 }:{
  value: T; onChange: (v: T) => void;
  options: { value: T; label: string; desc?: string }[]; cols?: 2|3|4;
}) {
  const colsCls = cols === 4 ? "sm:grid-cols-4" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={`grid gap-2 ${colsCls}`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${active ? "border-leaf-300 bg-leaf-100/50 ring-2 ring-leaf-300/30" : "border-border bg-card hover:border-leaf-200"}`}
          >
            <div className="font-medium text-foreground">{o.label}</div>
            {o.desc && <div className="mt-0.5 text-xs text-muted-foreground">{o.desc}</div>}
          </button>
        );
      })}
    </div>
  );
}

function NumberInput({ value, onChange, min = 0, max = 100000, step = 1, suffix }:{
  value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))} className={inputCls} />
      {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
    </div>
  );
}

function StepEnergy({ data, update }: StepProps) {
  return (
    <>
      <Field label="Monthly electricity consumption" hint="Check your latest bill">
        <NumberInput value={data.electricityKwh} onChange={(v) => update("electricityKwh", v)} suffix="kWh" />
      </Field>
      <Field label="Household size">
        <NumberInput value={data.householdSize} min={1} max={20} onChange={(v) => update("householdSize", v)} suffix="people" />
      </Field>
      <Field label="Average daily AC usage">
        <NumberInput value={data.acHoursPerDay} min={0} max={24} onChange={(v) => update("acHoursPerDay", v)} suffix="hours" />
      </Field>
      <Field label="Primary cooking fuel">
        <ChoiceGrid value={data.cookingFuel} onChange={(v) => update("cookingFuel", v)} cols={3}
          options={[
            { value: "lpg_lt1", label: "LPG · <1 cylinder/mo" },
            { value: "lpg_1", label: "LPG · 1 cylinder" },
            { value: "lpg_2", label: "LPG · 2 cylinders" },
            { value: "lpg_3plus", label: "LPG · 3+ cylinders" },
            { value: "piped_gas", label: "Piped natural gas" },
            { value: "electric", label: "Electric / induction" },
          ]} />
      </Field>
      <Field label="Monthly water consumption">
        <ChoiceGrid value={data.waterTier} onChange={(v) => update("waterTier", v)} cols={4}
          options={[
            { value: "lt5k", label: "<5,000 L" },
            { value: "5to10k", label: "5k–10k L" },
            { value: "10to20k", label: "10k–20k L" },
            { value: "gt20k", label: ">20,000 L" },
          ]} />
      </Field>
    </>
  );
}

function StepTransport({ data, update }: StepProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Car (km/week)"><NumberInput value={data.carKm} onChange={(v)=>update("carKm",v)} suffix="km" /></Field>
        <Field label="Motorcycle (km/week)"><NumberInput value={data.motorcycleKm} onChange={(v)=>update("motorcycleKm",v)} suffix="km" /></Field>
        <Field label="Bus (km/week)"><NumberInput value={data.busKm} onChange={(v)=>update("busKm",v)} suffix="km" /></Field>
        <Field label="Metro / train (km/week)"><NumberInput value={data.metroKm} onChange={(v)=>update("metroKm",v)} suffix="km" /></Field>
        <Field label="Bicycle (km/week)"><NumberInput value={data.bicycleKm} onChange={(v)=>update("bicycleKm",v)} suffix="km" /></Field>
        <Field label="Walking (km/week)"><NumberInput value={data.walkingKm} onChange={(v)=>update("walkingKm",v)} suffix="km" /></Field>
      </div>
      <Field label="Vehicle fuel type">
        <ChoiceGrid value={data.fuelType} onChange={(v) => update("fuelType", v)} cols={3}
          options={[
            { value: "petrol", label: "Petrol" },
            { value: "diesel", label: "Diesel" },
            { value: "electric", label: "Electric" },
            { value: "hybrid", label: "Hybrid" },
            { value: "na", label: "N/A" },
          ]} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Short-haul flights (last 12 mo)" hint="<3 hours">
          <NumberInput value={data.shortFlights} onChange={(v)=>update("shortFlights",v)} suffix="flights" />
        </Field>
        <Field label="Long-haul flights (last 12 mo)" hint=">3 hours">
          <NumberInput value={data.longFlights} onChange={(v)=>update("longFlights",v)} suffix="flights" />
        </Field>
      </div>
    </>
  );
}

function StepFood({ data, update }: StepProps) {
  return (
    <>
      <Field label="Diet type">
        <ChoiceGrid value={data.diet} onChange={(v) => update("diet", v)} cols={3}
          options={[
            { value: "vegan", label: "Vegan" },
            { value: "vegetarian", label: "Vegetarian" },
            { value: "pescatarian", label: "Pescatarian" },
            { value: "mixed", label: "Mixed" },
            { value: "heavy_meat", label: "Heavy meat" },
          ]} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Red meat meals / week"><NumberInput value={data.redMeatPerWeek} max={30} onChange={(v)=>update("redMeatPerWeek",v)} suffix="meals" /></Field>
        <Field label="White meat / fish meals / week"><NumberInput value={data.whiteMeatPerWeek} max={30} onChange={(v)=>update("whiteMeatPerWeek",v)} suffix="meals" /></Field>
      </div>
      <Field label="Dairy consumption">
        <ChoiceGrid value={data.dairy} onChange={(v) => update("dairy", v)} cols={4}
          options={[
            { value: "none", label: "None" },
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]} />
      </Field>
      <Field label="Food waste frequency">
        <ChoiceGrid value={data.foodWaste} onChange={(v) => update("foodWaste", v)} cols={4}
          options={[
            { value: "rarely", label: "Rarely" },
            { value: "sometimes", label: "Sometimes" },
            { value: "often", label: "Often" },
            { value: "always", label: "Always" },
          ]} />
      </Field>
    </>
  );
}

function StepWaste({ data, update }: StepProps) {
  return (
    <>
      <Field label="Daily trash generated">
        <ChoiceGrid value={data.trash} onChange={(v) => update("trash", v)} cols={2}
          options={[
            { value: "small_bag", label: "Small bag" },
            { value: "one_bin", label: "One dustbin" },
            { value: "two_bin", label: "Two dustbins" },
            { value: "more", label: "More than two" },
          ]} />
      </Field>
      <Field label="Recycling frequency">
        <ChoiceGrid value={data.recycling} onChange={(v) => update("recycling", v)} cols={4}
          options={[
            { value: "always", label: "Always" },
            { value: "often", label: "Often" },
            { value: "sometimes", label: "Sometimes" },
            { value: "never", label: "Never" },
          ]} />
      </Field>
      <Field label="Clothing purchases per year">
        <ChoiceGrid value={data.clothing} onChange={(v) => update("clothing", v)} cols={4}
          options={[
            { value: "0_5", label: "0 – 5" },
            { value: "6_15", label: "6 – 15" },
            { value: "16_30", label: "16 – 30" },
            { value: "30plus", label: "30+" },
          ]} />
      </Field>
      <Field label="Electronics replacement cycle">
        <ChoiceGrid value={data.electronics} onChange={(v) => update("electronics", v)} cols={4}
          options={[
            { value: "5y", label: "5+ years" },
            { value: "3to5y", label: "3 – 5 years" },
            { value: "1to3y", label: "1 – 3 years" },
            { value: "lt1y", label: "<1 year" },
          ]} />
      </Field>
      <Field label="Use of reusable alternatives">
        <ChoiceGrid value={data.reusables} onChange={(v) => update("reusables", v)} cols={4}
          options={[
            { value: "always", label: "Always" },
            { value: "often", label: "Often" },
            { value: "sometimes", label: "Sometimes" },
            { value: "rarely", label: "Rarely" },
          ]} />
      </Field>
    </>
  );
}

function StepPersonal({ data, update }: StepProps) {
  return (
    <>
      <Field label="Preferred improvement area">
        <ChoiceGrid value={data.improveArea} onChange={(v) => update("improveArea", v)} cols={4}
          options={[
            { value: "energy", label: "Energy" },
            { value: "transportation", label: "Transportation" },
            { value: "food", label: "Food" },
            { value: "waste", label: "Waste" },
          ]} />
      </Field>
      <Field label="Willingness to change">
        <ChoiceGrid value={data.willingness} onChange={(v) => update("willingness", v)} cols={3}
          options={[
            { value: "small", label: "Small changes", desc: "Light habit tweaks" },
            { value: "moderate", label: "Moderate changes", desc: "Some lifestyle shifts" },
            { value: "major", label: "Major changes", desc: "Ready to commit" },
          ]} />
      </Field>
    </>
  );
}
