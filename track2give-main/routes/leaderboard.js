const express = require("express");
const router = express.Router();

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
  // TODO: Get top donors based on sort criteria
  // TODO: Get global statistics using leaderboard-util
  // TODO: Get current user's rank
  // TODO: Render leaderboard.ejs with data
  res.status(501).send("Leaderboard page - TODO: Implement");
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
  // TODO: Call getTopDonors from leaderboard-util
  // TODO: Return JSON response
  res.status(501).json({ success: false, error: "TODO: Implement" });
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
  // TODO: Call getTopCarbonSavers from leaderboard-util
  // TODO: Return JSON response
  res.status(501).json({ success: false, error: "TODO: Implement" });
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
  // TODO: Call getGlobalDonationStats from leaderboard-util
  // TODO: Return JSON response
  res.status(501).json({ success: false, error: "TODO: Implement" });
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
  // TODO: Call getUserRank from leaderboard-util with req.session.user._id
  // TODO: Return JSON response
  res.status(501).json({ success: false, error: "TODO: Implement" });
});

module.exports = router;
