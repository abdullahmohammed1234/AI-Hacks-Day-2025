const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const FoodItem = require("../models/foodItem");
const Receipt = require("../models/receipt");
const ImpactStats = require("../models/impactStats");
const { calculateImpactStats } = require("../utilities/impact-util");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// GET / - Render food items page
router.get("/", requireAuth, async (req, res) => {
  try {
    // Get user's food items
    const foodItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
    }).sort({ expiryDate: 1 });

    // Get expiring soon items (within 3 days)
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const expiringItems = foodItems.filter((item) => {
      const expiryDate = new Date(item.expiryDate);
      return expiryDate <= threeDaysFromNow && expiryDate >= now;
    });

    res.render("food-item", {
      title: "My Food Items - Track2Give",
      user: req.session.user,
      currentPage: "food-items",
      foodItems: foodItems,
      expiringItems: expiringItems,
      searchQuery: req.query.q || "",
    });
  } catch (error) {
    console.error("Error loading food items:", error);
    res.status(500).send("Error loading food items");
  }
});

// GET /api/food-items - Get user's food items
router.get("/api/food-items", requireAuth, async (req, res) => {
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

// GET /api/expiring-items - Get expiring items
router.get("/api/expiring-items", requireAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 3;
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const expiringItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
      expiryDate: { $lte: futureDate, $gte: now },
    }).sort({ expiryDate: 1 });

    res.json(expiringItems);
  } catch (error) {
    console.error("Error fetching expiring items:", error);
    res.status(500).json({ error: "Failed to fetch expiring items" });
  }
});

// POST /api/food-items - Add a food item
router.post("/api/food-items", requireAuth, async (req, res) => {
  try {
    console.log("Received food item data:", req.body);

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
    console.error("Error details:", error.message);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
    res.status(500).json({
      error: "Failed to add food item",
      details: error.message,
      validationErrors: error.errors,
    });
  }
});

// POST /api/receipt-scan - Upload and scan receipt
router.post(
  "/api/receipt-scan",
  requireAuth,
  upload.single("receipt"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "track2give/receipts",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      // Create receipt record
      const receipt = new Receipt({
        userId: req.session.user._id,
        imageUrl: result.secure_url,
        imagePublicId: result.public_id,
        processingStatus: "pending",
      });

      await receipt.save();

      // TODO: Call Gemini AI to process the receipt
      // For now, return the receipt ID
      res.status(201).json({
        message: "Receipt uploaded successfully",
        receiptId: receipt._id,
        imageUrl: result.secure_url,
      });
    } catch (error) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ error: "Failed to upload receipt" });
    }
  }
);

// PATCH /api/food-items/:id/consume - Mark item as consumed
router.patch("/api/food-items/:id/consume", requireAuth, async (req, res) => {
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

// DELETE /api/food-items/:id - Delete a food item
router.delete("/api/food-items/:id", requireAuth, async (req, res) => {
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

// PUT /api/food-items/:id - Update a food item
router.put("/api/food-items/:id", requireAuth, async (req, res) => {
  try {
    const foodItem = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user._id },
      {
        name: req.body.name,
        category: req.body.category,
        quantity: req.body.quantity,
        unit: req.body.unit,
        expiryDate: new Date(req.body.expiryDate),
        storageLocation: req.body.storageLocation,
        estimatedValue: req.body.estimatedValue,
        notes: req.body.notes,
      },
      { new: true }
    );

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    res.json({
      message: "Food item updated successfully",
      data: foodItem,
    });
  } catch (error) {
    console.error("Error updating food item:", error);
    res.status(500).json({ error: "Failed to update food item" });
  }
});

module.exports = router;
