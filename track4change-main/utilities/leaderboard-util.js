/**
 * Leaderboard Utilities Module
 * 
 * This module contains business logic for leaderboard calculations.
 * Team Member Assignment: [ASSIGN TEAM MEMBER NAME]
 * 
 * Dependencies:
 * - models/impactStats.js
 * - models/user.js
 * - models/sharedItem.js
 * 
 * @module utilities/leaderboard-util
 */

const ImpactStats = require("../models/impactStats");
const User = require("../models/user");
const SharedItem = require("../models/sharedItem");

/**
 * Get top donors by items shared
 * 
 * Data Flow:
 * 1. Query ImpactStats collection for users with itemsShared > 0
 * 2. Sort by itemsShared descending
 * 3. Limit to specified number
 * 4. Join with User collection to get username and profile picture
 * 5. Calculate rank based on position
 * 
 * @param {Number} limit - Number of top donors to return (default: 10)
 * @returns {Promise<Array>} Array of donor objects with stats and rank
 * 
 * Example Return:
 * [
 *   {
 *     userId: ObjectId,
 *     username: "john_doe",
 *     profilePicture: "url",
 *     itemsShared: 25,
 *     itemsSaved: 50,
 *     co2SavedKg: 12.5,
 *     waterSavedLiters: 500,
 *     moneySavedDollars: 150.00,
 *     rank: 1
 *   },
 *   ...
 * ]
 * 
 * TODO: Implement function
 */
async function getTopDonors(limit = 10) {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;

  const topDonorDocs = await ImpactStats.aggregate([
    {
      $match: {
        itemsShared: { $gt: 0 },
      },
    },
    {
      $sort: {
        itemsShared: -1,
        co2SavedKg: -1,
        itemsSaved: -1,
        userId: 1,
      },
    },
    { $limit: safeLimit },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $addFields: {
        user: { $first: "$user" },
      },
    },
    {
      $project: {
        userId: 1,
        itemsShared: 1,
        itemsSaved: 1,
        co2SavedKg: 1,
        waterSavedLiters: 1,
        moneySavedDollars: 1,
        username: { $ifNull: ["$user.username", "Anonymous Donor"] },
        profilePicture: { $ifNull: ["$user.profilePicture", ""] },
      },
    },
  ]);

  return topDonorDocs.map((doc, index) => ({
    userId: doc.userId,
    username: doc.username,
    profilePicture: doc.profilePicture,
    itemsShared: doc.itemsShared,
    itemsSaved: doc.itemsSaved,
    co2SavedKg: doc.co2SavedKg,
    waterSavedLiters: doc.waterSavedLiters,
    moneySavedDollars: doc.moneySavedDollars,
    rank: index + 1,
  }));
}

/**
 * Get top donors by CO2 saved
 * 
 * Data Flow:
 * 1. Query ImpactStats collection for users with co2SavedKg > 0
 * 2. Sort by co2SavedKg descending
 * 3. Limit to specified number
 * 4. Join with User collection
 * 5. Calculate rank
 * 
 * @param {Number} limit - Number of top savers to return (default: 10)
 * @returns {Promise<Array>} Array of saver objects sorted by CO2 saved
 * 
 * TODO: Implement function
 */
async function getTopCarbonSavers(limit = 10) {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;

  const topSaverDocs = await ImpactStats.aggregate([
    {
      $match: {
        co2SavedKg: { $gt: 0 },
      },
    },
    {
      $sort: {
        co2SavedKg: -1,
        itemsShared: -1,
        itemsSaved: -1,
        userId: 1,
      },
    },
    { $limit: safeLimit },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $addFields: {
        user: { $first: "$user" },
      },
    },
    {
      $project: {
        userId: 1,
        itemsShared: 1,
        itemsSaved: 1,
        co2SavedKg: 1,
        waterSavedLiters: 1,
        moneySavedDollars: 1,
        username: { $ifNull: ["$user.username", "Anonymous Donor"] },
        profilePicture: { $ifNull: ["$user.profilePicture", ""] },
      },
    },
  ]);

  return topSaverDocs.map((doc, index) => ({
    userId: doc.userId,
    username: doc.username,
    profilePicture: doc.profilePicture,
    itemsShared: doc.itemsShared,
    itemsSaved: doc.itemsSaved,
    co2SavedKg: doc.co2SavedKg,
    waterSavedLiters: doc.waterSavedLiters,
    moneySavedDollars: doc.moneySavedDollars,
    rank: index + 1,
  }));
}

/**
 * Get global donation statistics
 * 
 * Data Flow:
 * 1. Aggregate all ImpactStats documents
 * 2. Calculate totals and averages
 * 3. Count available SharedItems
 * 4. Return comprehensive stats object
 * 
 * @returns {Promise<Object>} Global statistics object
 * 
 * Example Return:
 * {
 *   totalUsers: 150,
 *   totalItemsSaved: 5000,
 *   totalItemsShared: 2000,
 *   totalCO2SavedKg: 1250.50,
 *   totalWaterSavedLiters: 50000,
 *   totalMoneySavedDollars: 15000.00,
 *   avgItemsSharedPerUser: 13.33,
 *   avgCO2SavedPerUser: 8.34,
 *   totalAvailableItems: 25
 * }
 * 
 * TODO: Implement function
 */
async function getGlobalDonationStats() {
  const [totals] = await ImpactStats.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalItemsSaved: { $sum: "$itemsSaved" },
        totalItemsShared: { $sum: "$itemsShared" },
        totalCO2SavedKg: { $sum: "$co2SavedKg" },
        totalWaterSavedLiters: { $sum: "$waterSavedLiters" },
        totalMoneySavedDollars: { $sum: "$moneySavedDollars" },
        avgItemsSharedPerUser: { $avg: "$itemsShared" },
        avgCO2SavedPerUser: { $avg: "$co2SavedKg" },
      },
    },
  ]);

  const totalAvailableItems = await SharedItem.countDocuments({
    status: "available",
  });

  if (!totals) {
    return {
      totalUsers: 0,
      totalItemsSaved: 0,
      totalItemsShared: 0,
      totalCO2SavedKg: 0,
      totalWaterSavedLiters: 0,
      totalMoneySavedDollars: 0,
      avgItemsSharedPerUser: 0,
      avgCO2SavedPerUser: 0,
      totalAvailableItems,
    };
  }

  return {
    totalUsers: totals.totalUsers,
    totalItemsSaved: totals.totalItemsSaved,
    totalItemsShared: totals.totalItemsShared,
    totalCO2SavedKg: totals.totalCO2SavedKg,
    totalWaterSavedLiters: totals.totalWaterSavedLiters,
    totalMoneySavedDollars: totals.totalMoneySavedDollars,
    avgItemsSharedPerUser: totals.avgItemsSharedPerUser || 0,
    avgCO2SavedPerUser: totals.avgCO2SavedPerUser || 0,
    totalAvailableItems,
  };
}

/**
 * Get user's rank in leaderboard
 * 
 * Data Flow:
 * 1. Get user's ImpactStats
 * 2. Count users with more itemsShared
 * 3. Count total active donors
 * 4. Calculate rank (usersAhead + 1)
 * 5. Calculate percentile
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} User's rank information
 * 
 * Example Return:
 * {
 *   rank: 5,
 *   totalDonors: 150,
 *   percentile: 97,
 *   itemsShared: 25
 * }
 * 
 * TODO: Implement function
 */
async function getUserRank(userId) {
  if (!userId) {
    return {
      rank: null,
      totalDonors: 0,
      percentile: null,
      itemsShared: 0,
      co2SavedKg: 0,
    };
  }

  const userStats = await ImpactStats.findOne({ userId }).lean();
  const totalDonors = await ImpactStats.countDocuments({
    itemsShared: { $gt: 0 },
  });

  if (!userStats || userStats.itemsShared <= 0) {
    return {
      rank: null,
      totalDonors,
      percentile: null,
      itemsShared: userStats ? userStats.itemsShared : 0,
      co2SavedKg: userStats ? userStats.co2SavedKg : 0,
    };
  }

  const usersAhead = await ImpactStats.countDocuments({
    $or: [
      { itemsShared: { $gt: userStats.itemsShared } },
      {
        itemsShared: userStats.itemsShared,
        co2SavedKg: { $gt: userStats.co2SavedKg },
      },
    ],
  });

  const rank = usersAhead + 1;
  const percentile =
    totalDonors > 0
      ? Math.round(((totalDonors - rank) / totalDonors) * 100)
      : null;

  return {
    rank,
    totalDonors,
    percentile,
    itemsShared: userStats.itemsShared,
    co2SavedKg: userStats.co2SavedKg,
  };
}

module.exports = {
  getTopDonors,
  getTopCarbonSavers,
  getGlobalDonationStats,
  getUserRank,
};


