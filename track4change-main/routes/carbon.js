const express = require("express");
const router = express.Router();
const ImpactStats = require("../models/impactStats");
const FoodItem = require("../models/foodItem");
const {
  getUserCarbonHistory,
  getCarbonBreakdownByCategory,
  getGlobalCarbonStats,
  calculatePotentialCarbonSavings,
} = require("../utilities/carbon-util");
const { getTopCarbonSavers } = require("../utilities/leaderboard-util");

/**
 * Carbon Emissions Routes Module
 * 
 * This module handles all carbon emissions tracking and visualization endpoints.
 * Team Member Assignment: [ASSIGN TEAM MEMBER NAME]
 * 
 * Routes:
 * - GET /carbon - Renders the carbon emissions tracking page
 * - GET /api/carbon/history - Returns user's carbon savings history
 * - GET /api/carbon/breakdown - Returns carbon savings breakdown by category
 * - GET /api/carbon/global - Returns global carbon statistics
 * - GET /api/carbon/potential - Returns potential carbon savings from unexpired items
 * 
 * @module routes/carbon
 */

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

/**
 * GET /carbon
 * Renders the carbon emissions tracking page with visualizations
 * 
 * Query Parameters:
 * - period: Time period for history - "week", "month", "year", "all" (default: "all")
 * 
 * Response: Renders carbon.ejs with user, community, and potential savings data
 */
router.get("/carbon", requireAuth, async (req, res) => {
  const validPeriods = new Set(["week", "month", "year", "all"]);
  const period = validPeriods.has(req.query.period) ? req.query.period : "all";
  const userId = req.session.user._id;

  try {
    const [userStatsDoc, history, breakdown, globalStats, topCarbonSavers] =
      await Promise.all([
        ImpactStats.findOne({ userId }).lean(),
        getUserCarbonHistory(userId, period),
        getCarbonBreakdownByCategory(userId),
        getGlobalCarbonStats(),
        getTopCarbonSavers(10),
      ]);

    const unexpiredItems = await FoodItem.find({
      userId,
      consumed: false,
      expiryDate: { $gte: new Date() },
    })
      .select("name category quantity unit expiryDate")
      .sort({ expiryDate: 1 })
      .lean();

    const potentialSavings = calculatePotentialCarbonSavings(unexpiredItems);

    const userStats =
      userStatsDoc ||
      {
        co2SavedKg: 0,
        itemsSaved: 0,
        itemsShared: 0,
        waterSavedLiters: 0,
        moneySavedDollars: 0,
      };

    const CAR_CO2_PER_YEAR_KG = 4600;
    const TREE_CO2_PER_YEAR_KG = 21.77;

    const userEquivalents = {
      carsRemoved:
        Math.round((userStats.co2SavedKg / CAR_CO2_PER_YEAR_KG) * 100) / 100,
      treesPlanted:
        Math.round((userStats.co2SavedKg / TREE_CO2_PER_YEAR_KG) * 100) / 100,
    };

    const currentUserId = String(userId);

    res.render("carbon", {
      currentPage: "carbon",
      user: req.session.user,
      period,
      userStats,
      carbonHistory: history,
      categoryBreakdown: breakdown,
      globalStats,
      potentialSavings,
      unexpiredItems,
      topCarbonSavers,
      currentUserId,
      userEquivalents,
    });
  } catch (error) {
    console.error("Failed to render carbon page:", error);
    res.status(500).send("We ran into a problem loading carbon insights.");
  }
});

/**
 * GET /api/carbon/history
 * Returns user's carbon savings history over time
 * 
 * Query Parameters:
 * - period: Time period - "week", "month", "year", "all" (default: "all")
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: Array<{
 *     date: Date,
 *     co2Saved: number,
 *     cumulativeCO2: number
 *   }>
 * }
 * 
 */
router.get("/api/carbon/history", requireAuth, async (req, res) => {
  const validPeriods = new Set(["week", "month", "year", "all"]);
  const period = validPeriods.has(req.query.period) ? req.query.period : "all";

  try {
    const history = await getUserCarbonHistory(
      req.session.user._id,
      period
    );
    res.json({ success: true, data: history });
  } catch (error) {
    console.error("Failed to fetch carbon history:", error);
    res
      .status(500)
      .json({ success: false, error: "Unable to load carbon history." });
  }
});

/**
 * GET /api/carbon/breakdown
 * Returns carbon savings broken down by food category
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: Array<{
 *     category: string,
 *     co2Saved: number,
 *     itemCount: number
 *   }>
 * }
 * 
 */
router.get("/api/carbon/breakdown", requireAuth, async (req, res) => {
  try {
    const breakdown = await getCarbonBreakdownByCategory(
      req.session.user._id
    );
    res.json({ success: true, data: breakdown });
  } catch (error) {
    console.error("Failed to fetch carbon breakdown:", error);
    res
      .status(500)
      .json({ success: false, error: "Unable to load carbon breakdown." });
  }
});

/**
 * GET /api/carbon/global
 * Returns global carbon savings statistics
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     totalCO2SavedKg: number,
 *     totalUsers: number,
 *     avgCO2PerUser: number,
 *     equivalentCarsRemoved: number,
 *     equivalentTreesPlanted: number
 *   }
 * }
 * 
 */
router.get("/api/carbon/global", requireAuth, async (req, res) => {
  try {
    const stats = await getGlobalCarbonStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Failed to fetch global carbon stats:", error);
    res
      .status(500)
      .json({ success: false, error: "Unable to load global carbon stats." });
  }
});

/**
 * GET /api/carbon/potential
 * Returns potential carbon savings from user's current unexpired items
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     potentialCO2SavedKg: number,
 *     itemCount: number,
 *     equivalentCarsRemoved: number,
 *     equivalentTreesPlanted: number
 *   }
 * }
 * 
 */
router.get("/api/carbon/potential", requireAuth, async (req, res) => {
  try {
    const unexpiredItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
      expiryDate: { $gte: new Date() },
    })
      .select("name category quantity unit expiryDate")
      .lean();

    const potential = calculatePotentialCarbonSavings(unexpiredItems);
    res.json({ success: true, data: potential });
  } catch (error) {
    console.error("Failed to fetch potential carbon savings:", error);
    res.status(500).json({
      success: false,
      error: "Unable to load potential carbon savings.",
    });
  }
});

module.exports = router;


