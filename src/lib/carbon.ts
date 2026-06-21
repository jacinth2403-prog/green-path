// Carbon calculation engine for Carbon Compass
// All values in kg CO2e per month unless stated.

export type Diet = "vegan" | "vegetarian" | "pescatarian" | "mixed" | "heavy_meat";
export type FuelType = "petrol" | "diesel" | "electric" | "hybrid" | "na";
export type CookingFuel = "lpg_lt1" | "lpg_1" | "lpg_2" | "lpg_3plus" | "electric" | "piped_gas";
export type WaterTier = "lt5k" | "5to10k" | "10to20k" | "gt20k";
export type Recycling = "always" | "often" | "sometimes" | "never";
export type Trash = "small_bag" | "one_bin" | "two_bin" | "more";
export type Clothing = "0_5" | "6_15" | "16_30" | "30plus";
export type Electronics = "5y" | "3to5y" | "1to3y" | "lt1y";
export type DairyLevel = "none" | "low" | "medium" | "high";
export type WasteFreq = "rarely" | "sometimes" | "often" | "always";
export type ImproveArea = "energy" | "transportation" | "food" | "waste";
export type Willingness = "small" | "moderate" | "major";

export interface Assessment {
  id: string;
  createdAt: string;
  // Energy
  electricityKwh: number;
  householdSize: number;
  acHoursPerDay: number;
  cookingFuel: CookingFuel;
  waterTier: WaterTier;
  // Transport — weekly km
  carKm: number;
  motorcycleKm: number;
  busKm: number;
  metroKm: number;
  bicycleKm: number;
  walkingKm: number;
  fuelType: FuelType;
  shortFlights: number; // last 12 months
  longFlights: number;
  // Food
  diet: Diet;
  redMeatPerWeek: number;
  whiteMeatPerWeek: number;
  dairy: DairyLevel;
  foodWaste: WasteFreq;
  // Waste
  trash: Trash;
  recycling: Recycling;
  clothing: Clothing;
  electronics: Electronics;
  reusables: WasteFreq; 
  // Personalization
  improveArea: ImproveArea;
  willingness: Willingness;
}

export interface Breakdown {
  energy: number;
  transportation: number;
  food: number;
  waste: number;
  total: number;
  details: {
    electricity: number;
    cooking: number;
    water: number;
    car: number;
    motorcycle: number;
    bus: number;
    metro: number;
    flights: number;
    diet: number;
    trash: number;
    clothing: number;
    electronics: number;
  };
}

const WEEKS_PER_MONTH = 4.3;

function sanitize(num: number): number {
  return isNaN(num) || num < 0 ? 0 : num;
}

function round(n: number) {
  return Math.max(0, Math.round(n * 10) / 10);
}

// FIX 1: Electricity now represents the total household footprint, matching water/cooking/waste.
export function calculateBreakdown(a: Assessment): Breakdown {
  const electricityKwh = sanitize(a.electricityKwh);
  const carKm = sanitize(a.carKm);
  const motorcycleKm = sanitize(a.motorcycleKm);
  const busKm = sanitize(a.busKm);
  const metroKm = sanitize(a.metroKm);
  const shortFlights = sanitize(a.shortFlights);
  const longFlights = sanitize(a.longFlights);
  const redMeatPerWeek = sanitize(a.redMeatPerWeek);
  const whiteMeatPerWeek = sanitize(a.whiteMeatPerWeek);

  // Household-size sharing efficiency: larger households share baseline loads,
  // so per-household electricity & water emissions scale slightly less than linearly.
  // Mild factor (1 person: 1.0, 2: 0.95, 3: 0.90, 4: 0.85, capped at 0.80).
  const hh = Math.max(1, sanitize(a.householdSize) || 1);
  const sharing = 1 - Math.min(0.2, (hh - 1) * 0.05);

  const electricity = electricityKwh * 0.73 * sharing;

  const cookingMap: Record<CookingFuel, number> = {
    lpg_lt1: 15, lpg_1: 30, lpg_2: 60, lpg_3plus: 90, electric: 20, piped_gas: 40,
  };
  const cooking = cookingMap[a.cookingFuel] ?? 30;

  const waterMap: Record<WaterTier, number> = {
    lt5k: 2, "5to10k": 5, "10to20k": 10, gt20k: 15,
  };
  const water = (waterMap[a.waterTier] ?? 5) * sharing;
  const energy = electricity + cooking + water;

  const carFactor = a.fuelType === "diesel" ? 0.17
    : a.fuelType === "electric" ? 0.05
    : a.fuelType === "hybrid" ? 0.12
    : 0.19; 
  const car = carKm * WEEKS_PER_MONTH * carFactor;
  const motorcycle = motorcycleKm * WEEKS_PER_MONTH * 0.08;
  const bus = busKm * WEEKS_PER_MONTH * 0.05;
  const metro = metroKm * WEEKS_PER_MONTH * 0.03;
  const flights = (shortFlights * 250 + longFlights * 1100) / 12;
  const transportation = car + motorcycle + bus + metro + flights;

  const dietBase: Record<Diet, number> = {
    vegan: 40, vegetarian: 60, pescatarian: 80, mixed: 100, heavy_meat: 130,
  };
  const dairyMap: Record<DairyLevel, number> = { none: 0, low: 5, medium: 15, high: 30 };
  const wasteMap: Record<WasteFreq, number> = { rarely: 0, sometimes: 5, often: 12, always: 20 };
  const diet = dietBase[a.diet]
    + redMeatPerWeek * 6
    + whiteMeatPerWeek * 2.5
    + dairyMap[a.dairy]
    + wasteMap[a.foodWaste];
  const food = diet;

  const trashMap: Record<Trash, number> = { small_bag: 5, one_bin: 10, two_bin: 20, more: 30 };
  const recyclingMap: Record<Recycling, number> = { always: -0.2, often: -0.1, sometimes: -0.05, never: 0 };
  const trash = (trashMap[a.trash] ?? 10) * (1 + (recyclingMap[a.recycling] ?? 0));

  const clothingMap: Record<Clothing, number> = { "0_5": 2, "6_15": 5, "16_30": 10, "30plus": 20 };
  const electronicsMap: Record<Electronics, number> = { "5y": 2, "3to5y": 5, "1to3y": 10, lt1y: 20 };
  const reusablesMap: Record<WasteFreq, number> = { always: -3, often: -1.5, sometimes: 0, rarely: 2 };

  const waste = trash + (clothingMap[a.clothing] ?? 5) + (electronicsMap[a.electronics] ?? 5) + (reusablesMap[a.reusables] ?? 0);
  const total = energy + transportation + food + waste;

  return {
    energy: round(energy),
    transportation: round(transportation),
    food: round(food),
    waste: round(waste),
    total: round(total),
    details: {
      electricity: round(electricity), cooking: round(cooking), water: round(water),
      car: round(car), motorcycle: round(motorcycle), bus: round(bus), metro: round(metro), flights: round(flights),
      diet: round(diet), trash: round(trash), clothing: round(clothingMap[a.clothing] ?? 5), electronics: round(electronicsMap[a.electronics] ?? 5),
    },
  };
}

export interface Action {
  tier: "High Impact" | "Medium Impact" | "Easy Win";
  title: string;
  description: string;
  reductionKg: number;
}

// Recommendations now adapt to: largest emission category, user-selected
// improvement area (improveArea), and willingness level (small/moderate/major).
export function buildActionPlan(b: Breakdown, a: Assessment): Action[] {
  const actions: Action[] = [];

  // Willingness scaling — small/moderate/major translate to action magnitude.
  const willScale: Record<Willingness, number> = { small: 0.10, moderate: 0.20, major: 0.35 };
  const w = willScale[a.willingness] ?? 0.20;
  const willLabel = a.willingness === "small" ? "small change"
    : a.willingness === "major" ? "major change" : "moderate change";

  // Determine the "focus" category: prefer the user's selected improvement area
  // when it has meaningful emissions, otherwise fall back to the largest.
  const cats: { key: ImproveArea; v: number; name: string }[] = [
    { key: "transportation", v: b.transportation, name: "Transportation" },
    { key: "energy", v: b.energy, name: "Energy" },
    { key: "food", v: b.food, name: "Food" },
    { key: "waste", v: b.waste, name: "Waste" },
  ];
  const sorted = [...cats].sort((x, y) => y.v - x.v);
  const largest = sorted[0];
  const userPick = cats.find((c) => c.key === a.improveArea);
  const focus = userPick && userPick.v > 0 ? userPick : largest;

  // ---- High Impact, tuned to focus area + willingness ----
  if (focus.key === "transportation") {
    if (b.details.flights > b.details.car && a.shortFlights + a.longFlights > 0) {
      actions.push({
        tier: "High Impact",
        title: a.willingness === "major"
          ? "Cut half of your flights this year"
          : "Consolidate or skip one flight this year",
        description: `Air travel is your largest transport driver. A ${willLabel} here compounds quickly.`,
        reductionKg: Math.round(b.details.flights * (w + 0.05)),
      });
    } else if (a.willingness === "small") {
      actions.push({
        tier: "High Impact",
        title: "Carpool or work-from-home one day a week",
        description: "A small, repeatable swap that trims roughly 20% of weekly car emissions.",
        reductionKg: Math.round(b.details.car * 0.20),
      });
    } else if (a.willingness === "moderate") {
      actions.push({
        tier: "High Impact",
        title: "Replace 30% of car trips with public transit or cycling",
        description: "Buses and metros emit far less per kilometer than private cars.",
        reductionKg: Math.round(b.details.car * 0.30),
      });
    } else {
      actions.push({
        tier: "High Impact",
        title: "Replace 60% of car trips with public transit, cycling, or EV",
        description: "A major shift in how you commute is the single biggest lever in your footprint.",
        reductionKg: Math.round(b.details.car * 0.55),
      });
    }
  } else if (focus.key === "energy") {
    if (a.acHoursPerDay >= 4) {
      actions.push({
        tier: "High Impact",
        title: a.willingness === "major"
          ? "Set AC to 26°C and cut usage by 4 hours daily"
          : "Set AC to 26°C and cut usage by 2 hours daily",
        description: "Climate control dominates your electricity. Tuning it back is the highest-leverage habit.",
        reductionKg: Math.round(b.energy * (a.willingness === "major" ? 0.28 : 0.18)),
      });
    } else {
      actions.push({
        tier: "High Impact",
        title: a.willingness === "major"
          ? "Switch to LEDs, smart strips, and a renewable tariff"
          : "Switch to LEDs and smart power strips",
        description: "Tackles standing electrical load directly across the home.",
        reductionKg: Math.round(b.details.electricity * (a.willingness === "major" ? 0.25 : 0.15)),
      });
    }
  } else if (focus.key === "food") {
    if (a.redMeatPerWeek > 0) {
      const mealsToCut = a.willingness === "small" ? 1 : a.willingness === "moderate" ? 3 : Math.max(3, a.redMeatPerWeek);
      actions.push({
        tier: "High Impact",
        title: `Swap ${mealsToCut} red-meat meal${mealsToCut > 1 ? "s" : ""} per week for plant-based`,
        description: "Red meat carries the heaviest supply-chain footprint per serving.",
        reductionKg: Math.round(mealsToCut * 12),
      });
    } else {
      actions.push({
        tier: "High Impact",
        title: "Choose regional, seasonal produce",
        description: "You're already low on meat — cutting shipping overhead is the next biggest lever.",
        reductionKg: Math.round(b.food * (w + 0.02)),
      });
    }
  } else {
    // waste
    actions.push({
      tier: "High Impact",
      title: a.willingness === "major"
        ? "Compost organics and cut single-use packaging"
        : "Sort recyclables consistently and reduce packaged goods",
      description: "Most household waste emissions come from organics and packaging — both are addressable at home.",
      reductionKg: Math.round(b.waste * (a.willingness === "major" ? 0.40 : a.willingness === "moderate" ? 0.25 : 0.15)),
    });
  }

  // ---- Medium Impact, biased away from the focus so it broadens the plan ----
  actions.push({
    tier: "Medium Impact",
    title: "Recycle consistently each week",
    description: "Sorting paper, plastic, and metal can lower waste emissions by up to 20%.",
    reductionKg: Math.max(3, Math.round(b.waste * 0.15)),
  });

  // ---- Easy Win, dynamic ----
  if (a.foodWaste === "always" || a.foodWaste === "often") {
    actions.push({
      tier: "Easy Win",
      title: "Plan meals to curb leftover food waste",
      description: "Trimming what gets thrown out targets a high-potency methane source in landfills.",
      reductionKg: 8,
    });
  } else if (a.reusables === "rarely" || a.reusables === "sometimes") {
    actions.push({
      tier: "Easy Win",
      title: "Switch to dedicated reusable alternatives",
      description: "Bringing your own bags and bottles eliminates packaging waste.",
      reductionKg: 4,
    });
  } else if (a.acHoursPerDay > 0 && a.acHoursPerDay < 4) {
    actions.push({
      tier: "Easy Win",
      title: "Turn off your AC 30 minutes earlier",
      description: "A small habit shift that saves a noticeable chunk of monthly energy.",
      reductionKg: 3,
    });
  } else {
    actions.push({
      tier: "Easy Win",
      title: "Unplug standby electronics when idle",
      description: "Eliminating phantom draws is an effortless baseline win.",
      reductionKg: 2,
    });
  }

  return actions;
}

// Boilerplate helpers left standard for implementation
export function impactStatus(total: number) {
  if (total < 250) return { label: "Low Impact", tone: "low" as const };
  if (total < 600) return { label: "Moderate Impact", tone: "moderate" as const };
  return { label: "High Impact", tone: "high" as const };
}

export function deriveInsights(b: Breakdown, a: Assessment) {
  const cats = [
    { name: "Transportation", v: b.transportation },
    { name: "Energy", v: b.energy },
    { name: "Food", v: b.food },
    { name: "Waste", v: b.waste },
  ];
  cats.sort((x, y) => y.v - x.v);
  const largest = cats[0];
  const smallest = cats[cats.length - 1];
  const pct = b.total > 0 ? Math.round((largest.v / b.total) * 100) : 0;

  return {
    largestContributor: `${largest.name} accounts for ~${pct}% of your household footprint.`,
    biggestOpportunity: `Focusing on ${largest.name.toLowerCase()} offers the largest near-term reduction.`,
    existingStrength: `${smallest.name} is your lowest emission category — excellent work.`,
  };
}

// --- IMPACT SIMULATOR ---
export interface SimulationModifiers {
  carKmAdjustment?: number;
  electricityKwhAdjustment?: number;
  redMeatMealsAdjustment?: number;
  acHoursAdjustment?: number;
  busKmAdjustment?: number;        // positive = more public transit (replaces car)
  metroKmAdjustment?: number;
  foodWasteSteps?: number;         // negative steps move toward "rarely"
  shortFlightsAdjustment?: number;
  recyclingSteps?: number;         // positive steps move toward "always"
}

const wasteOrder: WasteFreq[] = ["rarely", "sometimes", "often", "always"];
const recyclingOrder: Recycling[] = ["never", "sometimes", "often", "always"];

function shiftEnum<T>(order: T[], current: T, steps: number): T {
  const i = order.indexOf(current);
  if (i < 0) return current;
  const next = Math.max(0, Math.min(order.length - 1, i + steps));
  return order[next];
}

export function applySimulation(base: Assessment, mods: SimulationModifiers): Assessment {
  return {
    ...base,
    carKm: Math.max(0, base.carKm + (mods.carKmAdjustment ?? 0)),
    busKm: Math.max(0, base.busKm + (mods.busKmAdjustment ?? 0)),
    metroKm: Math.max(0, base.metroKm + (mods.metroKmAdjustment ?? 0)),
    electricityKwh: Math.max(0, base.electricityKwh + (mods.electricityKwhAdjustment ?? 0)),
    acHoursPerDay: Math.max(0, base.acHoursPerDay + (mods.acHoursAdjustment ?? 0)),
    redMeatPerWeek: Math.max(0, base.redMeatPerWeek + (mods.redMeatMealsAdjustment ?? 0)),
    shortFlights: Math.max(0, base.shortFlights + (mods.shortFlightsAdjustment ?? 0)),
    foodWaste: shiftEnum(wasteOrder, base.foodWaste, mods.foodWasteSteps ?? 0),
    recycling: shiftEnum(recyclingOrder, base.recycling, mods.recyclingSteps ?? 0),
  };
}

export function simulateImpact(baseAssessment: Assessment, mods: SimulationModifiers): { originalTotal: number; simulatedTotal: number; savingsKg: number } {
  const original = calculateBreakdown(baseAssessment);
  const simulated = calculateBreakdown(applySimulation(baseAssessment, mods));
  return {
    originalTotal: original.total,
    simulatedTotal: simulated.total,
    savingsKg: round(Math.max(0, original.total - simulated.total)),
  };
}

