import { describe, it, expect } from "vitest";
import {
  calculateBreakdown,
  impactStatus,
  deriveInsights,
  buildActionPlan,
  applySimulation,
  simulateImpact,
} from "@/lib/carbon";
import {
  makeAssessment,
  ZERO_ASSESSMENT,
  HIGH_EMISSION_ASSESSMENT,
} from "./carbon.fixtures";

describe("calculateBreakdown", () => {
  it("returns all-zero (except non-zero defaults) for zero-input minimal assessment", () => {
    const b = calculateBreakdown(ZERO_ASSESSMENT);
    expect(b.transportation).toBe(0);
    expect(b.details.electricity).toBe(0);
    expect(b.details.car).toBe(0);
    expect(b.details.flights).toBe(0);
    // food/waste have non-zero baselines from enums even with vegan/recycling=always
    expect(b.food).toBeGreaterThanOrEqual(0);
    expect(b.total).toBeCloseTo(
      b.energy + b.transportation + b.food + b.waste,
      0,
    );
  });

  it("sanitizes negative and NaN numeric inputs to zero", () => {
    const a = makeAssessment({
      electricityKwh: -50,
      carKm: NaN,
      shortFlights: -3,
      longFlights: NaN,
      redMeatPerWeek: -1,
      whiteMeatPerWeek: NaN,
      motorcycleKm: -10,
      busKm: NaN,
      metroKm: -5,
    });
    const b = calculateBreakdown(a);
    expect(b.details.electricity).toBe(0);
    expect(b.details.car).toBe(0);
    expect(b.details.flights).toBe(0);
    expect(b.details.motorcycle).toBe(0);
    expect(b.details.bus).toBe(0);
    expect(b.details.metro).toBe(0);
    expect(b.total).toBeGreaterThanOrEqual(0);
  });

  it("computes electricity using 0.73 factor with household sharing", () => {
    const a = makeAssessment({ electricityKwh: 100, householdSize: 1 });
    const b = calculateBreakdown(a);
    // 100 * 0.73 * 1.0 = 73
    expect(b.details.electricity).toBeCloseTo(73, 0);
  });

  it("applies household sharing factor capped at 0.80", () => {
    const small = calculateBreakdown(
      makeAssessment({ electricityKwh: 100, householdSize: 1, waterTier: "gt20k" }),
    );
    const large = calculateBreakdown(
      makeAssessment({ electricityKwh: 100, householdSize: 10, waterTier: "gt20k" }),
    );
    // larger household → shared loads lower
    expect(large.details.electricity).toBeLessThan(small.details.electricity);
    expect(large.details.water).toBeLessThan(small.details.water);
    // Cap: householdSize=10 should match householdSize=5 (both at 0.80 factor)
    const cap5 = calculateBreakdown(
      makeAssessment({ electricityKwh: 100, householdSize: 5, waterTier: "gt20k" }),
    );
    expect(large.details.electricity).toBeCloseTo(cap5.details.electricity, 5);
  });

  it("treats household=0 (boundary) as 1", () => {
    const a = makeAssessment({ householdSize: 0, electricityKwh: 100 });
    const b = calculateBreakdown(a);
    expect(b.details.electricity).toBeCloseTo(73, 0);
  });

  it("car emissions vary by fuel type (electric << petrol/diesel)", () => {
    const petrol = calculateBreakdown(makeAssessment({ fuelType: "petrol", carKm: 100 }));
    const diesel = calculateBreakdown(makeAssessment({ fuelType: "diesel", carKm: 100 }));
    const electric = calculateBreakdown(makeAssessment({ fuelType: "electric", carKm: 100 }));
    const hybrid = calculateBreakdown(makeAssessment({ fuelType: "hybrid", carKm: 100 }));
    const naFuel = calculateBreakdown(makeAssessment({ fuelType: "na", carKm: 100 }));
    expect(electric.details.car).toBeLessThan(hybrid.details.car);
    expect(hybrid.details.car).toBeLessThan(diesel.details.car);
    expect(diesel.details.car).toBeLessThan(petrol.details.car);
    // 'na' falls through to default petrol-equivalent factor
    expect(naFuel.details.car).toBeCloseTo(petrol.details.car, 1);
  });

  it("computes flights as (short*250 + long*1100)/12", () => {
    const b = calculateBreakdown(
      makeAssessment({ shortFlights: 12, longFlights: 0, carKm: 0 }),
    );
    expect(b.details.flights).toBeCloseTo(250, 0);
    const b2 = calculateBreakdown(
      makeAssessment({ shortFlights: 0, longFlights: 12, carKm: 0 }),
    );
    expect(b2.details.flights).toBeCloseTo(1100, 0);
  });

  it("food increases with red meat, dairy and food waste", () => {
    const low = calculateBreakdown(
      makeAssessment({ diet: "vegan", redMeatPerWeek: 0, whiteMeatPerWeek: 0, dairy: "none", foodWaste: "rarely" }),
    );
    const high = calculateBreakdown(
      makeAssessment({ diet: "heavy_meat", redMeatPerWeek: 10, whiteMeatPerWeek: 5, dairy: "high", foodWaste: "always" }),
    );
    expect(high.food).toBeGreaterThan(low.food);
  });

  it("recycling reduces trash emissions", () => {
    const never = calculateBreakdown(makeAssessment({ recycling: "never", trash: "two_bin" }));
    const always = calculateBreakdown(makeAssessment({ recycling: "always", trash: "two_bin" }));
    expect(always.details.trash).toBeLessThan(never.details.trash);
  });

  it("produces a high total for a high-emission assessment", () => {
    const b = calculateBreakdown(HIGH_EMISSION_ASSESSMENT);
    expect(b.total).toBeGreaterThan(1500);
    expect(b.transportation).toBeGreaterThan(b.waste);
  });

  it("rounds outputs to 1 decimal and never returns negative numbers", () => {
    const b = calculateBreakdown(HIGH_EMISSION_ASSESSMENT);
    for (const k of ["energy", "transportation", "food", "waste", "total"] as const) {
      expect(b[k]).toBeGreaterThanOrEqual(0);
      expect(Math.round(b[k] * 10) / 10).toBe(b[k]);
    }
  });
});

describe("impactStatus", () => {
  it("classifies low impact below 250", () => {
    expect(impactStatus(0).tone).toBe("low");
    expect(impactStatus(249).tone).toBe("low");
  });
  it("classifies moderate between 250 and 600", () => {
    expect(impactStatus(250).tone).toBe("moderate");
    expect(impactStatus(599).tone).toBe("moderate");
  });
  it("classifies high at and above 600", () => {
    expect(impactStatus(600).tone).toBe("high");
    expect(impactStatus(5000).tone).toBe("high");
  });
  it("returns matching label", () => {
    expect(impactStatus(100).label).toBe("Low Impact");
    expect(impactStatus(400).label).toBe("Moderate Impact");
    expect(impactStatus(1000).label).toBe("High Impact");
  });
});

describe("deriveInsights", () => {
  it("identifies the largest contributor and existing strength", () => {
    const a = makeAssessment({
      carKm: 1000, shortFlights: 4, longFlights: 2,
      electricityKwh: 50, acHoursPerDay: 0,
      diet: "vegan", redMeatPerWeek: 0, whiteMeatPerWeek: 0, dairy: "none", foodWaste: "rarely",
      trash: "small_bag", recycling: "always", clothing: "0_5", electronics: "5y", reusables: "always",
    });
    const b = calculateBreakdown(a);
    const ins = deriveInsights(b, a);
    expect(ins.largestContributor).toMatch(/Transportation/);
    expect(ins.biggestOpportunity).toMatch(/transportation/);
    expect(ins.existingStrength).toMatch(/excellent work/);
  });

  it("handles zero-total breakdown without dividing by zero", () => {
    const b = {
      energy: 0, transportation: 0, food: 0, waste: 0, total: 0,
      details: {
        electricity: 0, cooking: 0, water: 0, car: 0, motorcycle: 0,
        bus: 0, metro: 0, flights: 0, diet: 0, trash: 0, clothing: 0, electronics: 0,
      },
    };
    const ins = deriveInsights(b, ZERO_ASSESSMENT);
    expect(ins.largestContributor).toMatch(/~0%/);
  });
});

describe("buildActionPlan", () => {
  it("produces three actions across tiers for a typical assessment", () => {
    const a = makeAssessment();
    const b = calculateBreakdown(a);
    const plan = buildActionPlan(b, a);
    const tiers = plan.map((p) => p.tier);
    expect(tiers).toContain("High Impact");
    expect(tiers).toContain("Medium Impact");
    expect(tiers).toContain("Easy Win");
    expect(plan.length).toBeGreaterThanOrEqual(3);
    plan.forEach((p) => expect(p.reductionKg).toBeGreaterThanOrEqual(0));
  });

  it("recommends flight reduction when flights dominate transport", () => {
    const a = makeAssessment({
      improveArea: "transportation",
      willingness: "major",
      shortFlights: 6,
      longFlights: 4,
      carKm: 10,
    });
    const b = calculateBreakdown(a);
    const plan = buildActionPlan(b, a);
    expect(plan[0].title.toLowerCase()).toMatch(/flight/);
  });

  it("scales transport actions by willingness when flights are not dominant", () => {
    const small = buildActionPlan(
      calculateBreakdown(makeAssessment({ improveArea: "transportation", willingness: "small", shortFlights: 0, longFlights: 0, carKm: 200 })),
      makeAssessment({ improveArea: "transportation", willingness: "small", shortFlights: 0, longFlights: 0, carKm: 200 }),
    );
    const moderate = buildActionPlan(
      calculateBreakdown(makeAssessment({ improveArea: "transportation", willingness: "moderate", shortFlights: 0, longFlights: 0, carKm: 200 })),
      makeAssessment({ improveArea: "transportation", willingness: "moderate", shortFlights: 0, longFlights: 0, carKm: 200 }),
    );
    const major = buildActionPlan(
      calculateBreakdown(makeAssessment({ improveArea: "transportation", willingness: "major", shortFlights: 0, longFlights: 0, carKm: 200 })),
      makeAssessment({ improveArea: "transportation", willingness: "major", shortFlights: 0, longFlights: 0, carKm: 200 }),
    );
    expect(small[0].title).toMatch(/Carpool|work-from-home/);
    expect(moderate[0].title).toMatch(/30%/);
    expect(major[0].title).toMatch(/60%/);
  });

  it("recommends AC tuning for energy focus with high AC hours", () => {
    const a = makeAssessment({ improveArea: "energy", willingness: "major", acHoursPerDay: 8 });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    expect(plan[0].title.toLowerCase()).toMatch(/ac/);
  });

  it("recommends LED/smart strips for energy focus with low AC hours", () => {
    const a = makeAssessment({ improveArea: "energy", willingness: "small", acHoursPerDay: 1 });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    expect(plan[0].title.toLowerCase()).toMatch(/led|smart/);
  });

  it("LED branch with major willingness includes renewable tariff", () => {
    const a = makeAssessment({ improveArea: "energy", willingness: "major", acHoursPerDay: 1 });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    expect(plan[0].title.toLowerCase()).toMatch(/renewable|smart/);
  });

  it("food focus meal scaling: small=1 meal, major=at least redMeat count", () => {
    const aSmall = makeAssessment({ improveArea: "food", willingness: "small", redMeatPerWeek: 5 });
    const planSmall = buildActionPlan(calculateBreakdown(aSmall), aSmall);
    expect(planSmall[0].title).toMatch(/Swap 1 red-meat meal/);

    const aMajor = makeAssessment({ improveArea: "food", willingness: "major", redMeatPerWeek: 7 });
    const planMajor = buildActionPlan(calculateBreakdown(aMajor), aMajor);
    expect(planMajor[0].title).toMatch(/Swap 7 red-meat meals/);
  });

  it("recommends meat swap for food focus when red meat > 0", () => {
    const a = makeAssessment({ improveArea: "food", willingness: "moderate", redMeatPerWeek: 5 });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    expect(plan[0].title.toLowerCase()).toMatch(/red-meat|plant/);
  });

  it("recommends regional produce for food focus when no red meat", () => {
    const a = makeAssessment({ improveArea: "food", willingness: "small", redMeatPerWeek: 0, diet: "vegetarian" });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    expect(plan[0].title.toLowerCase()).toMatch(/regional|seasonal/);
  });

  it("recommends waste actions for waste focus across willingness levels", () => {
    for (const willingness of ["small", "moderate", "major"] as const) {
      const a = makeAssessment({ improveArea: "waste", willingness });
      const plan = buildActionPlan(calculateBreakdown(a), a);
      expect(plan[0].tier).toBe("High Impact");
      expect(plan[0].title.length).toBeGreaterThan(0);
    }
  });

  it("falls back to largest category when user pick has zero emissions", () => {
    const a = makeAssessment({
      improveArea: "transportation",
      carKm: 0, motorcycleKm: 0, busKm: 0, metroKm: 0, shortFlights: 0, longFlights: 0,
      electricityKwh: 1000, acHoursPerDay: 8,
    });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    // largest now energy
    expect(plan[0].title.toLowerCase()).toMatch(/ac|led|smart/);
  });

  it("Easy Win: meal-planning for high food waste", () => {
    const a = makeAssessment({ foodWaste: "always" });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    const easy = plan.find((p) => p.tier === "Easy Win")!;
    expect(easy.title.toLowerCase()).toMatch(/meal|leftover/);
  });

  it("Easy Win: reusables when reusables rarely used", () => {
    const a = makeAssessment({ foodWaste: "rarely", reusables: "rarely" });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    const easy = plan.find((p) => p.tier === "Easy Win")!;
    expect(easy.title.toLowerCase()).toMatch(/reusable/);
  });

  it("Easy Win: AC tweak for low AC users", () => {
    const a = makeAssessment({ foodWaste: "rarely", reusables: "always", acHoursPerDay: 2 });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    const easy = plan.find((p) => p.tier === "Easy Win")!;
    expect(easy.title.toLowerCase()).toMatch(/ac/);
  });

  it("Easy Win: unplug standby fallback", () => {
    const a = makeAssessment({ foodWaste: "rarely", reusables: "always", acHoursPerDay: 0 });
    const plan = buildActionPlan(calculateBreakdown(a), a);
    const easy = plan.find((p) => p.tier === "Easy Win")!;
    expect(easy.title.toLowerCase()).toMatch(/unplug|standby/);
  });
});

describe("applySimulation & simulateImpact", () => {
  it("clamps adjusted values at zero", () => {
    const a = makeAssessment({ carKm: 10, electricityKwh: 5, redMeatPerWeek: 1, shortFlights: 0 });
    const adj = applySimulation(a, {
      carKmAdjustment: -100,
      electricityKwhAdjustment: -100,
      redMeatMealsAdjustment: -10,
      shortFlightsAdjustment: -5,
      acHoursAdjustment: -100,
      busKmAdjustment: -100,
      metroKmAdjustment: -100,
    });
    expect(adj.carKm).toBe(0);
    expect(adj.electricityKwh).toBe(0);
    expect(adj.redMeatPerWeek).toBe(0);
    expect(adj.shortFlights).toBe(0);
    expect(adj.acHoursPerDay).toBe(0);
    expect(adj.busKm).toBe(0);
    expect(adj.metroKm).toBe(0);
  });

  it("shifts ordinal enums within bounds", () => {
    const a = makeAssessment({ foodWaste: "always", recycling: "never" });
    const adj = applySimulation(a, { foodWasteSteps: -10, recyclingSteps: 10 });
    expect(adj.foodWaste).toBe("rarely");
    expect(adj.recycling).toBe("always");
  });

  it("simulateImpact returns non-negative savings when reducing emissions", () => {
    const a = HIGH_EMISSION_ASSESSMENT;
    const sim = simulateImpact(a, {
      carKmAdjustment: -300,
      shortFlightsAdjustment: -6,
      redMeatMealsAdjustment: -10,
      foodWasteSteps: -3,
      recyclingSteps: 3,
    });
    expect(sim.savingsKg).toBeGreaterThan(0);
    expect(sim.simulatedTotal).toBeLessThanOrEqual(sim.originalTotal);
  });

  it("simulateImpact yields zero savings for empty mods", () => {
    const a = makeAssessment();
    const sim = simulateImpact(a, {});
    expect(sim.savingsKg).toBe(0);
    expect(sim.simulatedTotal).toBe(sim.originalTotal);
  });
});
