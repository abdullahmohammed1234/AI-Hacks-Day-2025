const ImpactStats = require("../models/impactStats");

/**
 * Environmental impact constants
 * Based on average food production emissions and resource usage
 */
const IMPACT_CONSTANTS = {
  // CO2 emissions (kg) per kg of food
  dairy: 2.5,
  meat: 27.0,
  seafood: 6.0,
  vegetables: 0.5,
  fruits: 0.9,
  grains: 1.1,
  bakery: 0.8,
  beverages: 0.3,
  snacks: 1.5,
  frozen: 2.0,
  canned: 1.2,
  condiments: 0.6,
  other: 1.0,

  // Water usage (liters) per kg of food
  water: {
    dairy: 1000,
    meat: 15400,
    seafood: 3500,
    vegetables: 322,
    fruits: 962,
    grains: 1644,
    bakery: 1608,
    beverages: 300,
    snacks: 800,
    frozen: 1200,
    canned: 900,
    condiments: 400,
    other: 800,
  },
};

/**
 * Calculate environmental impact statistics for a consumed food item
 * @param {String} userId - User's MongoDB ObjectId
 * @param {Object} foodItem - FoodItem document
 * @returns {Promise<Object>} Updated impact stats
 */
async function calculateImpactStats(userId, foodItem) {
  try {
    // Find or create user's impact stats
    let impactStats = await ImpactStats.findOne({ userId });

    if (!impactStats) {
      impactStats = new ImpactStats({
        userId,
        itemsSaved: 0,
        itemsShared: 0,
        co2SavedKg: 0,
        waterSavedLiters: 0,
        moneySavedDollars: 0,
      });
    }

    // Calculate CO2 saved (in kg)
    const co2PerKg = IMPACT_CONSTANTS[foodItem.category] || IMPACT_CONSTANTS.other;
    const weightInKg = convertToKg(foodItem.quantity, foodItem.unit);
    const co2Saved = co2PerKg * weightInKg;

    // Calculate water saved (in liters)
    const waterPerKg =
      IMPACT_CONSTANTS.water[foodItem.category] || IMPACT_CONSTANTS.water.other;
    const waterSaved = waterPerKg * weightInKg;

    // Update stats
    impactStats.itemsSaved += 1;
    impactStats.co2SavedKg += co2Saved;
    impactStats.waterSavedLiters += waterSaved;
    impactStats.moneySavedDollars += foodItem.estimatedValue || 0;

    await impactStats.save();

    return impactStats;
  } catch (error) {
    console.error("Error calculating impact stats:", error);
    throw error;
  }
}

/**
 * Convert quantity to kilograms
 * @param {Number} quantity - Amount of food
 * @param {String} unit - Unit of measurement
 * @returns {Number} Weight in kilograms
 */
function convertToKg(quantity, unit) {
  const conversions = {
    kg: 1,
    g: 0.001,
    lb: 0.453592,
    oz: 0.0283495,
    L: 1, // Approximate for liquids (1L H 1kg)
    mL: 0.001,
    cup: 0.236, // Approximate
    item: 0.5, // Approximate average item weight
    piece: 0.5, // Approximate
  };

  return quantity * (conversions[unit] || 0.5);
}

/**
 * Calculate total community impact
 * @returns {Promise<Object>} Global impact statistics
 */
async function calculateGlobalImpact() {
  try {
    const globalStats = await ImpactStats.aggregate([
      {
        $group: {
          _id: null,
          totalItemsSaved: { $sum: "$itemsSaved" },
          totalItemsShared: { $sum: "$itemsShared" },
          totalCO2Saved: { $sum: "$co2SavedKg" },
          totalWaterSaved: { $sum: "$waterSavedLiters" },
          totalMoneySaved: { $sum: "$moneySavedDollars" },
          userCount: { $sum: 1 },
        },
      },
    ]);

    return (
      globalStats[0] || {
        totalItemsSaved: 0,
        totalItemsShared: 0,
        totalCO2Saved: 0,
        totalWaterSaved: 0,
        totalMoneySaved: 0,
        userCount: 0,
      }
    );
  } catch (error) {
    console.error("Error calculating global impact:", error);
    throw error;
  }
}

/**
 * Get user's impact statistics
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} User's impact stats
 */
async function getUserImpact(userId) {
  try {
    let impactStats = await ImpactStats.findOne({ userId });

    if (!impactStats) {
      impactStats = new ImpactStats({
        userId,
        itemsSaved: 0,
        itemsShared: 0,
        co2SavedKg: 0,
        waterSavedLiters: 0,
        moneySavedDollars: 0,
      });
      await impactStats.save();
    }

    return impactStats;
  } catch (error) {
    console.error("Error getting user impact:", error);
    throw error;
  }
}

/**
 * Format impact stats for display
 * @param {Object} stats - Impact statistics
 * @returns {Object} Formatted stats with human-readable values
 */
function formatImpactStats(stats) {
  return {
    itemsSaved: stats.itemsSaved || 0,
    itemsShared: stats.itemsShared || 0,
    co2Saved: {
      kg: Math.round(stats.co2SavedKg * 100) / 100,
      display: `${Math.round(stats.co2SavedKg * 100) / 100} kg`,
      equivalent: `${Math.round(stats.co2SavedKg * 4.63)} miles driven`, // 1 kg CO2 H 4.63 miles
    },
    waterSaved: {
      liters: Math.round(stats.waterSavedLiters),
      display: `${Math.round(stats.waterSavedLiters).toLocaleString()} L`,
      equivalent: `${Math.round(stats.waterSavedLiters / 8)} days of drinking water`, // 8L/day average
    },
    moneySaved: {
      amount: Math.round(stats.moneySavedDollars * 100) / 100,
      display: `$${Math.round(stats.moneySavedDollars * 100) / 100}`,
    },
  };
}

/**
 * Calculate potential impact of food items
 * Used for showing potential savings before consumption
 * @param {Array} foodItems - Array of FoodItem documents
 * @returns {Object} Potential impact statistics
 */
function calculatePotentialImpact(foodItems) {
  let totalCO2 = 0;
  let totalWater = 0;
  let totalMoney = 0;

  foodItems.forEach((item) => {
    const weightInKg = convertToKg(item.quantity, item.unit);
    const co2PerKg = IMPACT_CONSTANTS[item.category] || IMPACT_CONSTANTS.other;
    const waterPerKg =
      IMPACT_CONSTANTS.water[item.category] || IMPACT_CONSTANTS.water.other;

    totalCO2 += co2PerKg * weightInKg;
    totalWater += waterPerKg * weightInKg;
    totalMoney += item.estimatedValue || 0;
  });

  return {
    itemCount: foodItems.length,
    co2SavedKg: Math.round(totalCO2 * 100) / 100,
    waterSavedLiters: Math.round(totalWater),
    moneySavedDollars: Math.round(totalMoney * 100) / 100,
  };
}

module.exports = {
  calculateImpactStats,
  calculateGlobalImpact,
  getUserImpact,
  formatImpactStats,
  calculatePotentialImpact,
  IMPACT_CONSTANTS,
};
