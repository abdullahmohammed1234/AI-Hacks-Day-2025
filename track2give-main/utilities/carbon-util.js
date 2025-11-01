/**
 * Carbon Emissions Utilities Module
 * 
 * This module contains business logic for carbon footprint tracking and visualization.
 * Team Member Assignment: [ASSIGN TEAM MEMBER NAME]
 * 
 * Dependencies:
 * - models/impactStats.js
 * - models/foodItem.js
 * - utilities/impact-util.js (for IMPACT_CONSTANTS)
 * 
 * @module utilities/carbon-util
 */

const ImpactStats = require("../models/impactStats");
const FoodItem = require("../models/foodItem");
const { IMPACT_CONSTANTS } = require("./impact-util");

/**
 * Get user's carbon emissions saved over time
 * 
 * Data Flow:
 * 1. Get user's ImpactStats
 * 2. Query FoodItems that are consumed within the specified period
 * 3. For each item, calculate CO2 saved based on category and quantity
 * 4. Aggregate cumulative CO2 savings over time
 * 5. Return array of data points for charting
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @param {String} period - Time period: "week", "month", "year", "all" (default: "all")
 * @returns {Promise<Array>} Array of carbon savings data points
 * 
 * Example Return:
 * [
 *   {
 *     date: Date("2024-01-15"),
 *     co2Saved: 2.5,
 *     cumulativeCO2: 2.5
 *   },
 *   {
 *     date: Date("2024-01-16"),
 *     co2Saved: 1.8,
 *     cumulativeCO2: 4.3
 *   }
 * ]
 * 
 * TODO: Implement function
 */
async function getUserCarbonHistory(userId, period = "all") {
  // TODO:
  // 1. Determine startDate based on period parameter
  // 2. Query FoodItems with consumed=true and consumedDate in range
  // 3. For each item, calculate CO2 using IMPACT_CONSTANTS and convertToKg
  // 4. Calculate cumulative CO2 savings
  // 5. Return array sorted by date
  throw new Error("TODO: Implement getUserCarbonHistory");
}

/**
 * Get carbon savings breakdown by category
 * 
 * Data Flow:
 * 1. Query all consumed FoodItems for user
 * 2. Group by category
 * 3. Calculate total CO2 saved per category
 * 4. Count items per category
 * 5. Sort by CO2 saved descending
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Array>} Array of category-wise carbon savings
 * 
 * Example Return:
 * [
 *   {
 *     category: "meat",
 *     co2Saved: 27.5,
 *     itemCount: 10
 *   },
 *   {
 *     category: "dairy",
 *     co2Saved: 12.3,
 *     itemCount: 8
 *   }
 * ]
 * 
 * TODO: Implement function
 */
async function getCarbonBreakdownByCategory(userId) {
  // TODO:
  // 1. Query FoodItems with consumed=true for user
  // 2. Group by category using reduce or aggregation
  // 3. Calculate CO2 per item using IMPACT_CONSTANTS
  // 4. Sum CO2 and count items per category
  // 5. Sort by CO2 saved descending
  // 6. Return array
  throw new Error("TODO: Implement getCarbonBreakdownByCategory");
}

/**
 * Get global carbon emissions saved statistics
 * 
 * Data Flow:
 * 1. Aggregate all ImpactStats documents
 * 2. Sum total CO2 saved
 * 3. Calculate averages
 * 4. Calculate equivalent metrics (cars removed, trees planted)
 * 
 * @returns {Promise<Object>} Global carbon savings statistics
 * 
 * Example Return:
 * {
 *   totalCO2SavedKg: 1250.50,
 *   totalUsers: 150,
 *   avgCO2PerUser: 8.34,
 *   maxCO2PerUser: 45.20,
 *   equivalentCarsRemoved: 271, // Based on 4.6 tons CO2/year per car
 *   equivalentTreesPlanted: 57  // Based on 21.77 kg CO2/year per tree
 * }
 * 
 * TODO: Implement function
 */
async function getGlobalCarbonStats() {
  // TODO:
  // 1. Use MongoDB aggregation on ImpactStats
  // 2. Sum co2SavedKg, count users, calculate avg and max
  // 3. Calculate equivalent metrics:
  //    - equivalentCarsRemoved = totalCO2SavedKg / 4600 (convert to tons, divide by 4.6)
  //    - equivalentTreesPlanted = totalCO2SavedKg / 21.77
  // 4. Return formatted stats object
  throw new Error("TODO: Implement getGlobalCarbonStats");
}

/**
 * Calculate potential carbon savings from items
 * 
 * Data Flow:
 * 1. Receive array of FoodItems
 * 2. For each item, calculate potential CO2 saved if consumed
 * 3. Sum total potential CO2
 * 4. Calculate equivalent metrics
 * 
 * @param {Array} foodItems - Array of FoodItem documents
 * @returns {Object} Potential carbon savings
 * 
 * Example Return:
 * {
 *   potentialCO2SavedKg: 25.50,
 *   itemCount: 15,
 *   equivalentCarsRemoved: 0.0055,
 *   equivalentTreesPlanted: 1.17
 * }
 * 
 * TODO: Implement function
 */
function calculatePotentialCarbonSavings(foodItems) {
  // TODO:
  // 1. Loop through foodItems
  // 2. For each, convert quantity to kg using convertToKg
  // 3. Get CO2 factor from IMPACT_CONSTANTS based on category
  // 4. Calculate potential CO2 = co2PerKg * weightInKg
  // 5. Sum all potential CO2
  // 6. Calculate equivalent metrics
  // 7. Return object
  throw new Error("TODO: Implement calculatePotentialCarbonSavings");
}

/**
 * Convert quantity to kilograms
 * Helper function for unit conversion
 * 
 * @param {Number} quantity - Amount of food
 * @param {String} unit - Unit of measurement
 * @returns {Number} Weight in kilograms
 * 
 * TODO: Implement conversion logic (can be shared from impact-util if needed)
 */
function convertToKg(quantity, unit) {
  // TODO: Implement unit conversion
  // Conversion factors: g=0.001, lb=0.453592, oz=0.0283495, L≈1, mL=0.001, etc.
  throw new Error("TODO: Implement convertToKg");
}

module.exports = {
  getUserCarbonHistory,
  getCarbonBreakdownByCategory,
  getGlobalCarbonStats,
  calculatePotentialCarbonSavings,
  convertToKg,
};

