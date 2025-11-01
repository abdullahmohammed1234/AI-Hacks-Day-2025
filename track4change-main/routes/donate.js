const express = require("express");
const router = express.Router();
const SharedItem = require("../models/sharedItem");
const FoodItem = require("../models/foodItem");
const ImpactStats = require("../models/impactStats");
const User = require("../models/user");

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// GET /donate - Donation page with search
router.get("/donate", requireAuth, async (req, res) => {
  try {
    const searchQuery = req.query.q ? req.query.q.trim().toLowerCase() : "";

    // Get user's available (not shared, not consumed) food items
    const userItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
      shared: { $ne: true },
      name: { $regex: searchQuery, $options: "i" },
    }).sort({ expiryDate: 1 });

    // Get available community donations (other users' shared items)
    const communityItems = await SharedItem.find({
      status: "available",
      userId: { $ne: req.session.user._id },
      name: { $regex: searchQuery, $options: "i" },
    }).sort({ createdAt: -1 });

    // Get user's impact stats
    const userImpact = await ImpactStats.findOne({
      userId: req.session.user._id,
    });

    res.render("donate", {
      title: "Donate - Track2Give",
      user: req.session.user,
      currentPage: "donate",
      searchQuery,
      items: userItems,
      userItems,
      communityItems,
      userImpact: userImpact || {
        itemsSaved: 0,
        itemsShared: 0,
        co2SavedKg: 0,
        waterSavedLiters: 0,
        moneySavedDollars: 0,
      },
    });
  } catch (error) {
    console.error("Error loading donate page:", error);
    res.status(500).send("Error loading donate page");
  }
});

// POST /api/donate/:id - Donate a food item
router.post("/api/donate/:id", requireAuth, async (req, res) => {
  try {
    const foodItem = await FoodItem.findOne({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    if (foodItem.shared) {
      return res.status(400).json({ error: "Item is already shared" });
    }

    // Create shared item
    const newSharedItem = new SharedItem({
      foodItemId: foodItem._id,
      userId: req.session.user._id,
      username: req.session.user.username,
      name: foodItem.name,
      category: foodItem.category,
      quantity: foodItem.quantity,
      unit: foodItem.unit,
      expiryDate: foodItem.expiryDate,
      pickupLocation: req.body.pickupLocation || "Not specified",
      notes: req.body.notes || "",
      status: "available",
    });

    await newSharedItem.save();

    // Mark food item as shared
    foodItem.shared = true;
    foodItem.sharedDate = new Date();
    await foodItem.save();

    res.json({
      message: "Item donated successfully",
      data: newSharedItem,
    });
  } catch (error) {
    console.error("Error donating item:", error);
    res.status(500).json({ error: "Failed to donate item" });
  }
});

// POST /api/donate/claim/:id - Claim a donated item
router.post("/api/donate/claim/:id", requireAuth, async (req, res) => {
  try {
    const sharedItem = await SharedItem.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "available",
        userId: { $ne: req.session.user._id },
      },
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

// DELETE /api/donate/:id - Cancel donation
router.delete("/api/donate/:id", requireAuth, async (req, res) => {
  try {
    const sharedItem = await SharedItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id,
      status: "available",
    });

    if (!sharedItem) {
      return res
        .status(404)
        .json({ error: "Shared item not found or already claimed" });
    }

    // Update the original food item
    await FoodItem.findByIdAndUpdate(sharedItem.foodItemId, {
      shared: false,
      sharedDate: null,
    });

    res.json({ message: "Donation cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling donation:", error);
    res.status(500).json({ error: "Failed to cancel donation" });
  }
});

// GET /api/donate/my-donations - Get user's donation history
router.get("/api/donate/my-donations", requireAuth, async (req, res) => {
  try {
    const myDonations = await SharedItem.find({
      userId: req.session.user._id,
    }).sort({ createdAt: -1 });

    res.json(myDonations);
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

// GET /donate/locate - Show postal code form every time. If user has a favorite, prefill it.
router.get("/donate/locate", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const favorite =
      user && user.favoritePostalCode ? user.favoritePostalCode : null;
    res.render("donate-locate", {
      title: "Find Food Banks",
      user: req.session.user,
      currentPage: "donate",
      favoritePostal: favorite,
    });
  } catch (error) {
    console.error("Error loading locate page:", error);
    res.status(500).send("Error");
  }
});

// POST /donate/locate - Accept postal code and optionally save as favorite; redirect to results with postal in query
router.post("/donate/locate", requireAuth, async (req, res) => {
  try {
    const postal = (req.body.postalCode || "").trim();
    const saveFavorite =
      req.body.favorite === "on" ||
      req.body.favorite === "true" ||
      req.body.favorite === true;
    if (!postal) return res.status(400).send("Postal code required");

    if (saveFavorite) {
      await User.findByIdAndUpdate(req.session.user._id, {
        favoritePostalCode: postal,
      });
      // update session copy if present
      if (req.session.user) req.session.user.favoritePostalCode = postal;
    }

    // store last used postal in session for immediate fallback
    req.session.lastPostal = postal;

    res.redirect("/donate/locate/results?postal=" + encodeURIComponent(postal));
  } catch (error) {
    console.error("Error saving postal code:", error);
    res.status(500).send("Error");
  }
});

// GET /donate/locate/results - Show nearby food banks (static lookup)
router.get("/donate/locate/results", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    // postal priority: query param -> session lastPostal -> user's favoritePostalCode
    const postal =
      req.query.postal ||
      req.session.lastPostal ||
      (user && user.favoritePostalCode) ||
      null;
    if (!postal) return res.redirect("/donate/locate");

    // Simple static mapping - replace with real geocoding in future
    const banks = [
      {
        name: "Central Community Food Bank",
        postalPrefixes: ["100", "101", "102"],
        address: "123 Main St",
        phone: "555-0101",
      },
      {
        name: "Westside Food Pantry",
        postalPrefixes: ["200", "201", "202"],
        address: "456 West Ave",
        phone: "555-0202",
      },
      {
        name: "Neighborhood Helping Hands",
        postalPrefixes: ["300", "301", "302"],
        address: "789 Oak Rd",
        phone: "555-0303",
      },
      {
        name: "Downtown Food Hub",
        postalPrefixes: ["400", "401", "402"],
        address: "11 Center Pl",
        phone: "555-0404",
      },
    ];

    // match by prefix
    const prefix = postal.toString().slice(0, 3);
    const nearby = banks.filter((b) => b.postalPrefixes.includes(prefix));

    // if none matched, show all as fallback
    const results = nearby.length ? nearby : banks;

    res.render("donate-locate-results", {
      title: "Nearby Food Banks",
      user: req.session.user,
      currentPage: "donate",
      postal,
      results,
    });
  } catch (error) {
    console.error("Error loading locate results:", error);
    res.status(500).send("Error");
  }
});

module.exports = router;
