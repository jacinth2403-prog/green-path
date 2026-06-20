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
  reusables: WasteFreq; // use of reusable alternatives
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

export function calculateBreakdown(a: Assessment): Breakdown {
  // Electricity: per-household, divided across household size for personal share — keep total household for honesty
  const electricity = a.electricityKwh * 0.73;

  const cookingMap: Record<CookingFuel, number> = {
    lpg_lt1: 15, lpg_1: 30, lpg_2: 60, lpg_3plus: 90,
    electric: 20, piped_gas: 40,
  };
  const cooking = cookingMap[a.cookingFuel] ?? 30;

  const waterMap: Record<WaterTier, number> = {
    lt5k: 2, "5to10k": 5, "10to20k": 10, gt20k: 15,
  };
  const water = waterMap[a.waterTier] ?? 5;

  const energy = electricity + cooking + water;

  // Transportation
  const carFactor = a.fuelType === "diesel" ? 0.17
    : a.fuelType === "electric" ? 0.05
    : a.fuelType === "hybrid" ? 0.12
    : 0.19; // petrol/na default
  const car = a.carKm * WEEKS_PER_MONTH * carFactor;
  const motorcycle = a.motorcycleKm * WEEKS_PER_MONTH * 0.08;
  const bus = a.busKm * WEEKS_PER_MONTH * 0.05;
  const metro = a.metroKm * WEEKS_PER_MONTH * 0.03;

  const flights = (a.shortFlights * 250 + a.longFlights * 1100) / 12;

  const transportation = car + motorcycle + bus + metro + flights;

  // Food
  const dietBase: Record<Diet, number> = {
    vegan: 40, vegetarian: 60, pescatarian: 80, mixed: 100, heavy_meat: 130,
  };
  const dairyMap: Record<DairyLevel, number> = { none: 0, low: 5, medium: 15, high: 30 };
  const wasteMap: Record<WasteFreq, number> = { rarely: 0, sometimes: 5, often: 12, always: 20 };
  const diet = dietBase[a.diet]
    + a.redMeatPerWeek * 6
    + a.whiteMeatPerWeek * 2.5
    + dairyMap[a.dairy]
    + wasteMap[a.foodWaste];

  const food = diet;

  // Waste
  const trashMap: Record<Trash, number> = { small_bag: 5, one_bin: 10, two_bin: 20, more: 30 };
  const recyclingMap: Record<Recycling, number> = { always: -0.2, often: -0.1, sometimes: -0.05, never: 0 };
  const trashBase = trashMap[a.trash];
  const trash = trashBase * (1 + recyclingMap[a.recycling]);

  const clothingMap: Record<Clothing, number> = { "0_5": 2, "6_15": 5, "16_30": 10, "30plus": 20 };
  const electronicsMap: Record<Electronics, number> = { "5y": 2, "3to5y": 5, "1to3y": 10, lt1y: 20 };
  const reusablesMap: Record<WasteFreq, number> = { always: -3, often: -1.5, sometimes: 0, rarely: 2 };

  const clothing = clothingMap[a.clothing];
  const electronics = electronicsMap[a.electronics];
  const reusables = reusablesMap[a.reusables];

  const waste = trash + clothing + electronics + reusables;

  const total = energy + transportation + food + waste;

  return {
    energy: round(energy),
    transportation: round(transportation),
    food: round(food),
    waste: round(waste),
    total: round(total),
    details: {
      electricity: round(electricity),
      cooking: round(cooking),
      water: round(water),
      car: round(car),
      motorcycle: round(motorcycle),
      bus: round(bus),
      metro: round(metro),
      flights: round(flights),
      diet: round(diet),
      trash: round(trash),
      clothing: round(clothing),
      electronics: round(electronics),
    },
  };
}

function round(n: number) {
  return Math.max(0, Math.round(n * 10) / 10);
}

export function impactStatus(total: number): { label: string; tone: "low" | "moderate" | "high" } {
  if (total < 250) return { label: "Low Impact", tone: "low" };
  if (total < 600) return { label: "Moderate Impact", tone: "moderate" };
  return { label: "High Impact", tone: "high" };
}

export interface Insight {
  largestContributor: string;
  biggestOpportunity: string;
  existingStrength: string;
}

export function deriveInsights(b: Breakdown, a: Assessment): Insight {
  const cats: { name: string; v: number }[] = [
    { name: "Transportation", v: b.transportation },
    { name: "Energy", v: b.energy },
    { name: "Food", v: b.food },
    { name: "Waste", v: b.waste },
  ];
  const sorted = [...cats].sort((x, y) => y.v - x.v);
  const largest = sorted[0];
  const smallest = sorted[sorted.length - 1];

  let opportunity = "Reducing your highest category by 20% would meaningfully cut your footprint.";
  if (largest.name === "Transportation" && a.carKm > 50) {
    opportunity = "Replacing 30% of car travel with metro or carpooling could save ~" + Math.round(largest.v * 0.25) + " kg CO₂e/month.";
  } else if (largest.name === "Energy" && a.electricityKwh > 200) {
    opportunity = "Cutting AC use by 2 hours/day and switching to LED could save ~" + Math.round(b.energy * 0.2) + " kg CO₂e/month.";
  } else if (largest.name === "Food") {
    opportunity = "Shifting two red-meat meals/week to plant-based could save ~" + Math.round(a.redMeatPerWeek * 12) + " kg CO₂e/month.";
  } else if (largest.name === "Waste") {
    opportunity = "Improving recycling and reusables could trim waste emissions by ~20%.";
  }

  return {
    largestContributor: `${largest.name} accounts for ~${Math.round((largest.v / b.total) * 100)}% of your monthly footprint.`,
    biggestOpportunity: opportunity,
    existingStrength: `${smallest.name} is your lowest-impact area — keep it up.`,
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

  // High impact — top category driven
  if (b.transportation >= b.energy && b.transportation >= b.food) {
    actions.push({
      tier: "High Impact",
      title: "Shift 30% of car trips to metro or bus",
      description: "Public transit emits ~80% less CO₂ per km than a petrol car.",
      reductionKg: Math.round(b.transportation * 0.25),
    });
  } else if (b.energy >= b.food) {
    actions.push({
      tier: "High Impact",
      title: "Set AC to 26°C and cut 2 hours of daily use",
      description: "Each hour of AC saved trims roughly 1.5 kg CO₂ per month.",
      reductionKg: Math.round(b.energy * 0.18),
    });
  } else {
    actions.push({
      tier: "High Impact",
      title: "Replace 3 red-meat meals/week with plant-based",
      description: "Red meat carries the highest emissions per gram of protein.",
      reductionKg: Math.round(b.food * 0.2),
    });
  }

  // Medium
  actions.push({
    tier: "Medium Impact",
    title: "Recycle consistently each week",
    description: "Sorting paper, plastic, and metal can lower waste emissions by up to 20%.",
    reductionKg: Math.max(3, Math.round(b.waste * 0.15)),
  });

  // Easy win
  actions.push({
    tier: "Easy Win",
    title: "Carry a reusable bottle and bag",
    description: "A small habit that quietly removes single-use packaging from your week.",
    reductionKg: 2,
  });

  return actions;
}
