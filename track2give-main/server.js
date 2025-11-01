const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const passport = require("passport");

// Initialize passport configuration
require("./passport-config")(passport);

// Import User model
const User = require("./models/user");
const FoodItem = require("./models/foodItem");
const ImpactStats = require("./models/impactStats");
const SharedItem = require("./models/sharedItem");

// IMPORTANT: Import auth routes first to access checkRememberToken
const { router: authRoutes, checkRememberToken } = require("./routes/auth");

// Import utilities
const { calculateImpactStats } = require("./utilities/impact-util");
const { getExpiringItems } = require("./utilities/food-util");

// Import routes
const dashboardRoutes = require("./routes/dashboard");
const foodItemsRoutes = require("./routes/foodItems");
const recipesRoutes = require("./routes/recipes");
const communityRoutes = require("./routes/community");
const settingsRoutes = require("./routes/settings");
const donateRoutes = require("./routes/donate");
const scanRoutes = require("./routes/scan");

// Import new modular routes (Team Collaboration Modules)
const leaderboardRoutes = require("./routes/leaderboard");
const carbonRoutes = require("./routes/carbon");
const shoppingRoutes = require("./routes/shopping");
const githubRoutes = require("./routes/github");

const app = express();
const port = 3000;

// MongoDB Connection using .env
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Use cookie-parser before session middleware
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "track2give-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);
app.use(checkRememberToken);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));
app.set("views", "./views");
app.set("view engine", "ejs");

// Use routes
app.use(authRoutes);
app.use(dashboardRoutes);
app.use("/food-items", foodItemsRoutes);
app.use(recipesRoutes);
app.use("/community", communityRoutes);
app.use(settingsRoutes);
app.use(donateRoutes);
app.use(scanRoutes);

// Use new modular routes (Team Collaboration Modules)
app.use(leaderboardRoutes);
app.use(carbonRoutes);
app.use(shoppingRoutes);
app.use("/api/github", githubRoutes);

// Homepage/Landing page
app.get("/", async (req, res) => {
  try {
    // If user is logged in, redirect to dashboard
    if (req.session.user) {
      return res.redirect("/dashboard");
    }

    // Calculate global impact stats for landing page
    const globalStats = await ImpactStats.aggregate([
      {
        $group: {
          _id: null,
          totalItemsSaved: { $sum: "$itemsSaved" },
          totalCO2Saved: { $sum: "$co2SavedKg" },
          totalWaterSaved: { $sum: "$waterSavedLiters" },
          totalMoneySaved: { $sum: "$moneySavedDollars" },
        },
      },
    ]);

    // Count total items shared in community
    const sharedCount = await SharedItem.countDocuments({
      status: "available",
    });

    const stats =
      globalStats.length > 0
        ? globalStats[0]
        : {
            totalItemsSaved: 0,
            totalCO2Saved: 0,
            totalWaterSaved: 0,
            totalMoneySaved: 0,
          };

    stats.itemsShared = sharedCount;

    res.render("index", {
      title: "Track2Give - Track Food, Save Money, Save Lives",
      user: null,
      currentPage: "home",
      globalStats: stats,
    });
  } catch (error) {
    console.error("Error rendering homepage:", error);
    res.render("index", {
      title: "Track2Give - Track Food, Save Money, Save Lives",
      user: null,
      currentPage: "home",
      globalStats: {
        totalItemsSaved: 0,
        totalCO2Saved: 0,
        totalWaterSaved: 0,
        totalMoneySaved: 0,
        itemsShared: 0,
      },
    });
  }
});

// Dashboard (protected route)
app.get("/dashboard", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    // Get user's food items
    const foodItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
    }).sort({ expiryDate: 1 });

    // Get expiring soon items (within 3 days)
    const expiringItems = getExpiringItems(foodItems, 3);

    // Get user's impact stats
    const userImpact = await ImpactStats.findOne({
      userId: req.session.user._id,
    });

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
      foodItems: foodItems,
      expiringItems: expiringItems,
      nearbySharedItems: nearbySharedItems,
      userImpact: userImpact || {
        itemsSaved: 0,
        itemsShared: 0,
        co2SavedKg: 0,
        waterSavedLiters: 0,
        moneySavedDollars: 0,
      },
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("Error loading dashboard");
  }
});

app.get("/donate", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const searchQuery = req.query.q ? req.query.q.trim().toLowerCase() : "";

    // Get user's available (not shared, not consumed) food items
    const userItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
      shared: { $ne: true },
      name: { $regex: searchQuery, $options: "i" },
    }).sort({ expiryDate: 1 });

    // Get available community donations (other users’ shared items)
    const communityItems = await SharedItem.find({
      status: "available",
      userId: { $ne: req.session.user._id },
      name: { $regex: searchQuery, $options: "i" },
    }).sort({ createdAt: -1 });

    // Get user’s impact stats
    const userImpact = await ImpactStats.findOne({
      userId: req.session.user._id,
    });

    res.render("donate", {
      title: "Donate - Track2Give",
      user: req.session.user,
      currentPage: "donate",
      searchQuery,
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

// Get user's food items (API endpoint)
app.get("/api/food-items", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const filter = { userId: req.session.user._id };

    // Optional filter for consumed items
    if (req.query.consumed !== undefined) {
      filter.consumed = req.query.consumed === "true";
    }

    const foodItems = await FoodItem.find(filter).sort({ expiryDate: 1 });
    res.json(foodItems);
  } catch (error) {
    console.error("Error fetching food items:", error);
    res.status(500).json({ error: "Failed to fetch food items" });
  }
});

// Get expiring items
app.get("/api/expiring-items", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const days = parseInt(req.query.days) || 3;
    const foodItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
    });

    const expiringItems = getExpiringItems(foodItems, days);
    res.json(expiringItems);
  } catch (error) {
    console.error("Error fetching expiring items:", error);
    res.status(500).json({ error: "Failed to fetch expiring items" });
  }
});

// Add a food item
app.post("/api/food-items", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    console.log("Received food item data (server.js):", req.body);

    // Build the food item object, only including purchaseDate if it's valid
    const foodItemData = {
      userId: req.session.user._id,
      name: req.body.name,
      category: req.body.category || "other",
      quantity: req.body.quantity || 1,
      unit: req.body.unit || "item",
      expiryDate: new Date(req.body.expiryDate),
      storageLocation: req.body.storageLocation || "fridge",
      estimatedValue: req.body.estimatedValue || 0,
      notes: req.body.notes || "",
    };

    // Only add purchaseDate if it's provided and valid
    if (
      req.body.purchaseDate &&
      req.body.purchaseDate.trim &&
      req.body.purchaseDate.trim() !== ""
    ) {
      foodItemData.purchaseDate = new Date(req.body.purchaseDate);
    }
    // Otherwise, let the model's default (Date.now) handle it

    const newFoodItem = new FoodItem(foodItemData);

    const savedItem = await newFoodItem.save();
    res.status(201).json({
      message: "Food item added successfully",
      data: savedItem,
    });
  } catch (error) {
    console.error("Error adding food item:", error);
    res.status(500).json({ error: "Failed to add food item" });
  }
});

// Mark item as consumed/saved
app.patch("/api/food-items/:id/consume", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const foodItem = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user._id },
      {
        consumed: true,
        consumedDate: new Date(),
      },
      { new: true }
    );

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    // Update user's impact stats
    await calculateImpactStats(req.session.user._id, foodItem);

    res.json({
      message: "Item marked as consumed",
      data: foodItem,
    });
  } catch (error) {
    console.error("Error marking item as consumed:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Share/Donate a food item to community
app.post("/api/food-items/:id/share", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

// Get available shared items in community
app.get("/api/community/shared-items", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const sharedItems = await SharedItem.find({
      status: "available",
      userId: { $ne: req.session.user._id }, // Exclude own items
    }).sort({ createdAt: -1 });

    res.json(sharedItems);
  } catch (error) {
    console.error("Error fetching shared items:", error);
    res.status(500).json({ error: "Failed to fetch shared items" });
  }
});

// Claim a shared item
app.post("/api/community/claim/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

// Delete a food item
app.delete("/api/food-items/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const foodItem = await FoodItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    res.json({ message: "Food item deleted successfully" });
  } catch (error) {
    console.error("Error deleting food item:", error);
    res.status(500).json({ error: "Failed to delete food item" });
  }
});

// Get user's impact stats
app.get("/api/impact-stats", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    let impactStats = await ImpactStats.findOne({
      userId: req.session.user._id,
    });

    if (!impactStats) {
      // Create initial stats if they don't exist
      impactStats = new ImpactStats({
        userId: req.session.user._id,
        itemsSaved: 0,
        itemsShared: 0,
        co2SavedKg: 0,
        waterSavedLiters: 0,
        moneySavedDollars: 0,
      });
      await impactStats.save();
    }

    res.json(impactStats);
  } catch (error) {
    console.error("Error fetching impact stats:", error);
    res.status(500).json({ error: "Failed to fetch impact stats" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    app: "Track2Give",
    timestamp: new Date().toISOString(),
  });
});

// Dashboard to food item routes
app.get("/add-food-item", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("add-food-item", {
    title: "Add Food Item - Track2Give",
    user: req.session.user,
    currentPage: "add-food-item",
  });
});

// Handle the form submission
app.post("/api/food-items", (req, res) => {
  // TODO: Add validation
  const foodItem = {
    name: req.body.name,
    category: req.body.category,
    quantity: parseFloat(req.body.quantity),
    unit: req.body.unit,
    storageLocation: req.body.storageLocation,
    expiryDate: new Date(req.body.expiryDate),
    notes: req.body.notes,
    userId: req.user.id, // Assuming you're using authentication
    createdAt: new Date(),
  };

  // TODO: Save to database
  // After saving, redirect to dashboard
  res.redirect("/dashboard");
});

// Start Server
app.listen(port, () => {
  console.log(`🌱 Track2Give server running at http://localhost:${port}`);
  console.log(`📊 Dashboard: http://localhost:${port}/dashboard`);
  console.log(`🤝 Community: http://localhost:${port}/community`);
});
