const express = require("express");
const router = express.Router();
const FoodItem = require("../models/foodItem");
const ImpactStats = require("../models/impactStats");
const SharedItem = require("../models/sharedItem");
const { getExpiringItems } = require("../utilities/food-util");

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// GET /dashboard - Main dashboard page
router.get("/dashboard", requireAuth, async (req, res) => {
  try {
    // Get user's food items
    const foodItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
    }).sort({ expiryDate: 1 });

    // Get expiring soon items (within 3 days)
    const expiringItems = getExpiringItems(foodItems, 3);

    // Get user's impact stats
    let userImpact = await ImpactStats.findOne({
      userId: req.session.user._id,
    });

    // Create initial stats if they don't exist
    if (!userImpact) {
      userImpact = new ImpactStats({
        userId: req.session.user._id,
        itemsSaved: 0,
        itemsShared: 0,
        co2SavedKg: 0,
        waterSavedLiters: 0,
        moneySavedDollars: 0,
      });
      await userImpact.save();
    }

    // Get nearby shared items
    const nearbySharedItems = await SharedItem.find({
      status: "available",
      userId: { $ne: req.session.user._id },
    })
      .limit(5)
      .sort({ createdAt: -1 });

    res.render("dashboard", {
      title: "Track2Give - Dashboard",
      user: req.session.user,
      currentPage: "dashboard",
      foodItems,
      expiringItems,
      nearbySharedItems,
      userImpact,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Error loading dashboard");
  }
});

module.exports = router;
