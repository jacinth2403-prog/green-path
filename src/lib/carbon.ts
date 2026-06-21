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

export function buildActionPlan(b: Breakdown, a: Assessment): Action[] {
  const actions: Action[] = [];

  // FIX 2 & 3: High Impact recommendations now check underlying user habits dynamically
  if (b.transportation >= b.energy && b.transportation >= b.food) {
    if (b.details.flights > (b.details.car + b.details.motorcycle)) {
      actions.push({
        tier: "High Impact",
        title: "Consolidate or reduce long-distance flights",
        description: "Air travel is currently your largest transportation driver.",
        reductionKg: Math.round(b.details.flights * 0.15),
      });
    } else {
      actions.push({
        tier: "High Impact",
        title: "Shift 30% of car trips to public transit or cycling",
        description: "Buses and trains emit up to 80% less carbon per kilometer than traditional cars.",
        reductionKg: Math.round(b.details.car * 0.25),
      });
    }
  } else if (b.energy >= b.food) {
    if (a.acHoursPerDay >= 4) {
      actions.push({
        tier: "High Impact",
        title: "Set AC to 26°C and reduce usage by 2 hours daily",
        description: "Optimizing your climate control reduces heavy luxury electrical draws.",
        reductionKg: Math.round(b.energy * 0.18),
      });
    } else {
      actions.push({
        tier: "High Impact",
        title: "Transition home lighting to LEDs and manage vampire draws",
        description: "Your baseline electricity is high. Smart strips and LED changeouts lower static load.",
        reductionKg: Math.round(b.details.electricity * 0.15),
      });
    }
  } else {
    if (a.redMeatPerWeek > 0) {
      actions.push({
        tier: "High Impact",
        title: "Swap 3 red-meat meals per week for plant-based alternatives",
        description: "Red meat produces significantly higher supply-chain carbon loads than other items.",
        reductionKg: Math.round(a.redMeatPerWeek * 12),
      });
    } else {
      actions.push({
        tier: "High Impact",
        title: "Optimize your pantry by choosing regional, seasonal produce",
        description: "You're already low on meat impact! Transitioning to seasonal items cuts shipping overhead.",
        reductionKg: Math.round(b.food * 0.1),
      });
    }
  }

  // Medium Impact
  actions.push({
    tier: "Medium Impact",
    title: "Recycle consistently each week",
    description: "Sorting paper, plastic, and metal can lower waste emissions by up to 20%.",
    reductionKg: Math.max(3, Math.round(b.waste * 0.15)),
  });

  // FIX 4: Easy Win dynamically adapts to find weak points, avoiding generic fallbacks
  if (a.foodWaste === "always" || a.foodWaste === "often") {
    actions.push({
      tier: "Easy Win",
      title: "Plan meals to curb leftover food waste",
      description: "Trimming down what gets thrown out targets a high-potency methane source in landfills.",
      reductionKg: 8,
    });
  } else if (a.reusables === "rarely" || a.reusables === "sometimes") {
    actions.push({
      tier: "Easy Win",
      title: "Switch to dedicated reusable alternatives",
      description: "Bringing your own bags and bottles systematically eliminates packaging waste.",
      reductionKg: 4,
    });
  } else if (a.acHoursPerDay > 0 && a.acHoursPerDay < 4) {
    actions.push({
      tier: "Easy Win",
      title: "Turn off your AC just 30 minutes earlier",
      description: "A minor modification to daily habits that saves a noticeable chunk of monthly energy.",
      reductionKg: 3,
    });
  } else {
    actions.push({
      tier: "Easy Win",
      title: "Unplug standby electronics when completely idle",
      description: "Eliminating background 'phantom' electricity draws is an effortless baseline win.",
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
    biggestOpportunity: "Review your customized action plan below to target this specific area.",
    existingStrength: `${smallest.name} is your lowest emission category — excellent work.`,
  };
}

// --- MISSING FEATURE: IMPACT SIMULATOR ---
// Allows front-end sliders to feed adjustments directly against the core engine formulas.
export interface SimulationModifiers {
  carKmAdjustment?: number;        // e.g., -30 to simulate driving 30 fewer km/week
  electricityKwhAdjustment?: number; // e.g., -50 to simulate saving 50 kWh
  redMeatMealsAdjustment?: number;   // e.g., -2 to simulate dropping 2 meat meals/week
}

export function simulateImpact(baseAssessment: Assessment, mods: SimulationModifiers): { originalTotal: number; simulatedTotal: number; savingsKg: number } {
  const original = calculateBreakdown(baseAssessment);
  
  // Clone the assessment data structure safely
  const simulatedAssessment: Assessment = {
    ...baseAssessment,
    carKm: Math.max(0, baseAssessment.carKm + (mods.carKmAdjustment ?? 0)),
    electricityKwh: Math.max(0, baseAssessment.electricityKwh + (mods.electricityKwhAdjustment ?? 0)),
    redMeatPerWeek: Math.max(0, baseAssessment.redMeatPerWeek + (mods.redMeatMealsAdjustment ?? 0)),
  };

  const simulated = calculateBreakdown(simulatedAssessment);
  
  return {
    originalTotal: original.total,
    simulatedTotal: simulated.total,
    savingsKg: round(Math.max(0, original.total - simulated.total))
  };
}
