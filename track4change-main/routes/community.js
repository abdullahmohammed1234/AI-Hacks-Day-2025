const express = require("express");
const router = express.Router();
const SharedItem = require("../models/sharedItem");
const FoodItem = require("../models/foodItem");
const ImpactStats = require("../models/impactStats");

// Helper function to get category icon
function getCategoryIcon(category) {
  const icons = {
    dairy: "🥛",
    meat: "🥩",
    seafood: "🐟",
    vegetables: "🥕",
    fruits: "🍎",
    grains: "🌾",
    bakery: "🍞",
    beverages: "🥤",
    snacks: "🍿",
    frozen: "❄️",
    canned: "🥫",
    condiments: "🧂",
    other: "🍱",
  };
  return icons[category] || icons.other;
}

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// GET /community - Community sharing page
router.get("/", requireAuth, async (req, res) => {
  try {
    // Accept search query from either `q` or `search` to match the form input
    const rawQuery = req.query.q || req.query.search || "";
    const searchQuery = rawQuery ? String(rawQuery).trim() : "";

    // Get available shared items from other users (populate referenced FoodItem and donor info)
    let sharedItems = await SharedItem.find({
      status: "available",
      userId: { $ne: req.session.user._id },
      name: { $regex: searchQuery, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("foodItemId")
      .populate("userId", "username")
      .exec();

    // filter missing references and alias fields expected by the template
    sharedItems = sharedItems
      .filter((si) => si.foodItemId != null)
      .map((si) => {
        const siObj = si.toObject ? si.toObject() : si;
        siObj.foodItem = si.foodItemId.toObject ? si.foodItemId.toObject() : si.foodItemId;
        siObj.foodItem.categoryIcon = getCategoryIcon(siObj.foodItem.category);
        siObj.categoryIcon = getCategoryIcon(siObj.category);
        siObj.donor = {
          username:
            si.userId && si.userId.username ? si.userId.username : si.username,
        };
        return siObj;
      });

    // Get user's own shared items
    let mySharedItems = await SharedItem.find({
      userId: req.session.user._id,
    })
      .sort({ createdAt: -1 })
      .populate("foodItemId")
      .exec();

    mySharedItems = mySharedItems.map((si) => {
      const siObj = si.toObject ? si.toObject() : si;
      if (si.foodItemId) {
        siObj.foodItem = si.foodItemId.toObject ? si.foodItemId.toObject() : si.foodItemId;
        siObj.foodItem.categoryIcon = getCategoryIcon(siObj.foodItem.category);
      }
      siObj.categoryIcon = getCategoryIcon(siObj.category);
      siObj.donor = { username: si.username };
      return siObj;
    });

    // Get user's impact stats
    const userImpact = await ImpactStats.findOne({
      userId: req.session.user._id,
    });

    res.render("community", {
      title: "Track2Give - Community Sharing",
      user: req.session.user,
      currentPage: "community",
      sharedItems,
      mySharedItems,
      userSharedItems: mySharedItems,
      userImpact: userImpact || {
        itemsSaved: 0,
        itemsShared: 0,
        co2SavedKg: 0,
        waterSavedLiters: 0,
        moneySavedDollars: 0,
      },
      searchQuery,
    });
  } catch (error) {
    console.error("Error loading community page:", error);
    res.status(500).send("Error loading community page");
  }
});

// GET /api/community/shared-items - Get available shared items
router.get("/api/community/shared-items", requireAuth, async (req, res) => {
  try {
    const sharedItems = await SharedItem.find({
      status: "available",
      userId: { $ne: req.session.user._id },
    }).sort({ createdAt: -1 });

    res.json(sharedItems);
  } catch (error) {
    console.error("Error fetching shared items:", error);
    res.status(500).json({ error: "Failed to fetch shared items" });
  }
});

// POST /api/food-items/:id/share - Share/Donate a food item
router.post("/api/food-items/:id/share", requireAuth, async (req, res) => {
  try {
    const foodItem = await FoodItem.findOne({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    // Create a shared item
    const sharedItem = new SharedItem({
      foodItemId: foodItem._id,
      userId: req.session.user._id,
      username: req.session.user.username,
      name: foodItem.name,
      category: foodItem.category,
      quantity: foodItem.quantity,
      unit: foodItem.unit,
      expiryDate: foodItem.expiryDate,
      pickupLocation: req.body.pickupLocation || "",
      notes: req.body.notes || "",
      status: "available",
    });

    await sharedItem.save();

    // Mark original item as shared
    foodItem.shared = true;
    foodItem.sharedDate = new Date();
    await foodItem.save();

    res.status(201).json({
      message: "Item shared successfully with community",
      data: sharedItem,
    });
  } catch (error) {
    console.error("Error sharing food item:", error);
    res.status(500).json({ error: "Failed to share food item" });
  }
});

// POST /api/community/claim/:id - Claim a shared item
router.post("/api/community/claim/:id", requireAuth, async (req, res) => {
  try {
    const sharedItem = await SharedItem.findOneAndUpdate(
      { _id: req.params.id, status: "available" },
      {
        status: "claimed",
        claimedBy: req.session.user._id,
        claimedByUsername: req.session.user.username,
        claimedDate: new Date(),
      },
      { new: true }
    );

    if (!sharedItem) {
      return res.status(404).json({ error: "Item not available" });
    }

    // Update donor's impact stats
    let donorStats = await ImpactStats.findOne({ userId: sharedItem.userId });
    if (!donorStats) {
      donorStats = new ImpactStats({ userId: sharedItem.userId });
    }
    donorStats.itemsShared = (donorStats.itemsShared || 0) + 1;
    await donorStats.save();

    res.json({
      message: "Item claimed successfully",
      data: sharedItem,
    });
  } catch (error) {
    console.error("Error claiming item:", error);
    res.status(500).json({ error: "Failed to claim item" });
  }
});

// DELETE /api/community/shared/:id - Remove shared item
router.delete("/api/community/shared/:id", requireAuth, async (req, res) => {
  try {
    const sharedItem = await SharedItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!sharedItem) {
      return res.status(404).json({ error: "Shared item not found" });
    }

    // Update the original food item
    await FoodItem.findByIdAndUpdate(sharedItem.foodItemId, {
      shared: false,
      sharedDate: null,
    });

    res.json({ message: "Shared item removed successfully" });
  } catch (error) {
    console.error("Error removing shared item:", error);
    res.status(500).json({ error: "Failed to remove shared item" });
  }
});

module.exports = router;
