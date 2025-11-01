const express = require("express");
const router = express.Router();
const {
  getTopDonors,
  getTopCarbonSavers,
  getGlobalDonationStats,
  getUserRank,
} = require("../utilities/leaderboard-util");

/**
 * Leaderboard Routes Module
 * 
 * This module handles all leaderboard-related endpoints.
 * Team Member Assignment: [ASSIGN TEAM MEMBER NAME]
 * 
 * Routes:
 * - GET /leaderboard - Renders the leaderboard page
 * - GET /api/leaderboard/top-donors - Returns top donors by items shared
 * - GET /api/leaderboard/top-carbon-savers - Returns top users by CO2 saved
 * - GET /api/leaderboard/stats - Returns global donation statistics
 * - GET /api/leaderboard/user-rank - Returns current user's rank
 * 
 * @module routes/leaderboard
 */

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

/**
 * GET /leaderboard
 * Renders the main leaderboard page with top donors and statistics
 * 
 * Query Parameters:
 * - limit: Number of top users to display (default: 10)
 * - sort: Sort criteria - "donations" or "carbon" (default: "donations")
 * 
 * TODO: Implement route handler
 */
router.get("/leaderboard", requireAuth, async (req, res) => {
  const sort = req.query.sort === "carbon" ? "carbon" : "donations";
  const limit = Number.isFinite(Number(req.query.limit))
    ? Math.max(1, Math.min(50, parseInt(req.query.limit, 10)))
    : 10;

  try {
    const [globalStats, userRank, leaderboardEntries] = await Promise.all([
      getGlobalDonationStats(),
      getUserRank(req.session.user._id),
      sort === "carbon"
        ? getTopCarbonSavers(limit)
        : getTopDonors(limit),
    ]);

    return res.render("leaderboard", {
      sort,
      limit,
      globalStats,
      userRank,
      leaderboardEntries,
      currentUserId: String(req.session.user._id),
    });
  } catch (error) {
    console.error("Failed to render leaderboard:", error);
    return res
      .status(500)
      .send("We ran into a problem loading the leaderboard.");
  }
});

/**
 * GET /api/leaderboard/top-donors
 * Returns top donors sorted by items shared
 * 
 * Query Parameters:
 * - limit: Number of results to return (default: 10)
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: Array<{
 *     userId: ObjectId,
 *     username: string,
 *     itemsShared: number,
 *     itemsSaved: number,
 *     co2SavedKg: number,
 *     rank: number
 *   }>
 * }
 * 
 * TODO: Implement API endpoint
 */
router.get("/api/leaderboard/top-donors", requireAuth, async (req, res) => {
  const limit = Number.isFinite(Number(req.query.limit))
    ? Math.max(1, Math.min(50, parseInt(req.query.limit, 10)))
    : 10;

  try {
    const donors = await getTopDonors(limit);
    res.json({ success: true, data: donors });
  } catch (error) {
    console.error("Failed to fetch top donors:", error);
    res
      .status(500)
      .json({ success: false, error: "Unable to load top donors right now." });
  }
});

/**
 * GET /api/leaderboard/top-carbon-savers
 * Returns top users sorted by CO2 saved
 * 
 * Query Parameters:
 * - limit: Number of results to return (default: 10)
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: Array<{
 *     userId: ObjectId,
 *     username: string,
 *     co2SavedKg: number,
 *     itemsSaved: number,
 *     rank: number
 *   }>
 * }
 * 
 * TODO: Implement API endpoint
 */
router.get("/api/leaderboard/top-carbon-savers", requireAuth, async (req, res) => {
  const limit = Number.isFinite(Number(req.query.limit))
    ? Math.max(1, Math.min(50, parseInt(req.query.limit, 10)))
    : 10;

  try {
    const savers = await getTopCarbonSavers(limit);
    res.json({ success: true, data: savers });
  } catch (error) {
    console.error("Failed to fetch top carbon savers:", error);
    res.status(500).json({
      success: false,
      error: "Unable to load carbon savers right now.",
    });
  }
});

/**
 * GET /api/leaderboard/stats
 * Returns global donation statistics
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     totalUsers: number,
 *     totalItemsShared: number,
 *     totalCO2SavedKg: number,
 *     avgItemsSharedPerUser: number,
 *     avgCO2SavedPerUser: number
 *   }
 * }
 * 
 * TODO: Implement API endpoint
 */
router.get("/api/leaderboard/stats", requireAuth, async (req, res) => {
  try {
    const stats = await getGlobalDonationStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Failed to fetch leaderboard stats:", error);
    res
      .status(500)
      .json({ success: false, error: "Unable to load stats right now." });
  }
});

/**
 * GET /api/leaderboard/user-rank
 * Returns current user's rank and percentile
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     rank: number | null,
 *     totalDonors: number,
 *     percentile: number | null,
 *     itemsShared: number
 *   }
 * }
 * 
 * TODO: Implement API endpoint
 */
router.get("/api/leaderboard/user-rank", requireAuth, async (req, res) => {
  try {
    const rank = await getUserRank(req.session.user._id);
    res.json({ success: true, data: rank });
  } catch (error) {
    console.error("Failed to fetch user rank:", error);
    res
      .status(500)
      .json({ success: false, error: "Unable to load rank right now." });
  }
});

module.exports = router;
