/**
 * Carbon Emissions Utilities Module
 *
 * Business logic for carbon footprint tracking and visualization.
 */

const ImpactStats = require("../models/impactStats");
const FoodItem = require("../models/foodItem");
const { IMPACT_CONSTANTS } = require("./impact-util");

const CAR_CO2_PER_YEAR_KG = 4600; // Average passenger vehicle
const TREE_CO2_PER_YEAR_KG = 21.77; // Average mature tree

/**
 * Get a user's carbon savings history aggregated by day.
 * @param {String} userId
 * @param {"week"|"month"|"year"|"all"} period
 * @returns {Promise<Array<{date: string, co2Saved: number, cumulativeCO2: number}>>}
 */
async function getUserCarbonHistory(userId, period = "all") {
  if (!userId) {
    return [];
  }

  const now = new Date();
  let startDate = null;

  switch (period) {
    case "week":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "year":
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate = null;
      break;
  }

  const query = {
    userId,
    consumed: true,
    consumedDate: { $ne: null },
  };

  if (startDate) {
    query.consumedDate.$gte = startDate;
  }

  const consumedItems = await FoodItem.find(query)
    .select("consumedDate category quantity unit")
    .sort({ consumedDate: 1 })
    .lean();

  const dailyTotals = new Map();

  consumedItems.forEach((item) => {
    if (!item.consumedDate) {
      return;
    }

    const dateKey = new Date(item.consumedDate).toISOString().split("T")[0];
    const weightInKg = convertToKg(item.quantity, item.unit);
    const co2PerKg = IMPACT_CONSTANTS[item.category] || IMPACT_CONSTANTS.other;
    const co2Saved = co2PerKg * weightInKg;

    dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + co2Saved);
  });

  const sortedDates = Array.from(dailyTotals.keys()).sort();
  let cumulative = 0;

  return sortedDates.map((dateKey) => {
    const dailyTotal = dailyTotals.get(dateKey) || 0;
    cumulative += dailyTotal;
    return {
      date: dateKey,
      co2Saved: Math.round(dailyTotal * 100) / 100,
      cumulativeCO2: Math.round(cumulative * 100) / 100,
    };
  });
}

/**
 * Carbon savings grouped by food category.
 * @param {String} userId
 * @returns {Promise<Array<{category: string, co2Saved: number, itemCount: number}>>}
 */
async function getCarbonBreakdownByCategory(userId) {
  if (!userId) {
    return [];
  }

  const consumedItems = await FoodItem.find({
    userId,
    consumed: true,
    consumedDate: { $ne: null },
  })
    .select("category quantity unit")
    .lean();

  const categoryTotals = new Map();

  consumedItems.forEach((item) => {
    const category = item.category || "other";
    const weightInKg = convertToKg(item.quantity, item.unit);
    const co2PerKg = IMPACT_CONSTANTS[category] || IMPACT_CONSTANTS.other;
    const co2Saved = co2PerKg * weightInKg;

    const existing = categoryTotals.get(category) || {
      category,
      co2Saved: 0,
      itemCount: 0,
    };

    existing.co2Saved += co2Saved;
    existing.itemCount += 1;

    categoryTotals.set(category, existing);
  });

  return Array.from(categoryTotals.values())
    .map((entry) => ({
      category: entry.category,
      co2Saved: Math.round(entry.co2Saved * 100) / 100,
      itemCount: entry.itemCount,
    }))
    .sort((a, b) => b.co2Saved - a.co2Saved);
}

/**
 * Global carbon savings statistics.
 * @returns {Promise<{totalCO2SavedKg: number, totalUsers: number, avgCO2PerUser: number, maxCO2PerUser: number, equivalentCarsRemoved: number, equivalentTreesPlanted: number}>}
 */
async function getGlobalCarbonStats() {
  const [stats] = await ImpactStats.aggregate([
    {
      $group: {
        _id: null,
        totalCO2SavedKg: { $sum: "$co2SavedKg" },
        totalUsers: { $sum: 1 },
        avgCO2PerUser: { $avg: "$co2SavedKg" },
        maxCO2PerUser: { $max: "$co2SavedKg" },
      },
    },
  ]);

  const totalCO2SavedKg = stats?.totalCO2SavedKg || 0;
  const totalUsers = stats?.totalUsers || 0;
  const avgCO2PerUser = stats?.avgCO2PerUser || 0;
  const maxCO2PerUser = stats?.maxCO2PerUser || 0;

  return {
    totalCO2SavedKg: Math.round(totalCO2SavedKg * 100) / 100,
    totalUsers,
    avgCO2PerUser: Math.round(avgCO2PerUser * 100) / 100,
    maxCO2PerUser: Math.round(maxCO2PerUser * 100) / 100,
    equivalentCarsRemoved:
      Math.round((totalCO2SavedKg / CAR_CO2_PER_YEAR_KG) * 100) / 100,
    equivalentTreesPlanted:
      Math.round((totalCO2SavedKg / TREE_CO2_PER_YEAR_KG) * 100) / 100,
  };
}

/**
 * Potential carbon savings from a collection of food items.
 * @param {Array<Object>} foodItems
 * @returns {{potentialCO2SavedKg: number, itemCount: number, equivalentCarsRemoved: number, equivalentTreesPlanted: number}}
 */
function calculatePotentialCarbonSavings(foodItems) {
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    return {
      potentialCO2SavedKg: 0,
      itemCount: 0,
      equivalentCarsRemoved: 0,
      equivalentTreesPlanted: 0,
    };
  }

  let totalCO2 = 0;

  foodItems.forEach((item) => {
    if (!item) {
      return;
    }
    const category = item.category || "other";
    const weightInKg = convertToKg(item.quantity, item.unit);
    const co2PerKg = IMPACT_CONSTANTS[category] || IMPACT_CONSTANTS.other;
    totalCO2 += co2PerKg * weightInKg;
  });

  return {
    potentialCO2SavedKg: Math.round(totalCO2 * 100) / 100,
    itemCount: foodItems.length,
    equivalentCarsRemoved:
      Math.round((totalCO2 / CAR_CO2_PER_YEAR_KG) * 100) / 100,
    equivalentTreesPlanted:
      Math.round((totalCO2 / TREE_CO2_PER_YEAR_KG) * 100) / 100,
  };
}

/**
 * Convert a quantity + unit to kilograms.
 * @param {number} quantity
 * @param {string} unit
 * @returns {number}
 */
function convertToKg(quantity, unit) {
  const numericQuantity = Number(quantity);
  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    return 0;
  }

  const unitKey =
    typeof unit === "string" && unit.length > 0 ? unit.toLowerCase() : "";

  const conversions = {
    kg: 1,
    g: 0.001,
    lb: 0.453592,
    lbs: 0.453592,
    oz: 0.0283495,
    l: 1,
    liter: 1,
    liters: 1,
    ml: 0.001,
    milliliter: 0.001,
    milliliters: 0.001,
    cup: 0.236,
    cups: 0.236,
    item: 0.5,
    items: 0.5,
    piece: 0.5,
    pieces: 0.5,
    pack: 0.75,
    packs: 0.75,
    unit: 0.5,
    units: 0.5,
  };

  const conversionFactor = conversions[unitKey] ?? 0.5;
  return numericQuantity * conversionFactor;
}

module.exports = {
  getUserCarbonHistory,
  getCarbonBreakdownByCategory,
  getGlobalCarbonStats,
  calculatePotentialCarbonSavings,
  convertToKg,
};
