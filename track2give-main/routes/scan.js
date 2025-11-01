/**
 * Scan Routes
 * Handles receipt scanning, image upload, and AI processing
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const Receipt = require("../models/receipt");
const FoodItem = require("../models/foodItem");
const { uploadImageToCloudinary } = require("../utilities/cloudinary-util");
const {
  processReceiptWithGemini,
  prepareFoodItemsFromReceipt,
} = require("../utilities/gemini-util");
const { createExpiryNotification } = require("../utilities/notification-util");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

/**
 * GET /scan
 * Render the scan page
 */
router.get("/scan", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  res.render("scan", {
    title: "Scan Receipt - Track2Give",
    user: req.session.user,
    currentPage: "scan",
  });
});

/**
 * POST /api/scan/upload
 * Upload receipt image, process with Gemini AI, and save to database
 */
router.post("/api/scan/upload", upload.single("receipt"), async (req, res) => {
  try {
    // Check authentication
    if (!req.session.user) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No image file uploaded" });
    }

    console.log("Processing receipt for user:", req.session.user.username);

    // Step 1: Upload image to Cloudinary
    console.log("Uploading to Cloudinary...");
    const cloudinaryResult = await uploadImageToCloudinary(
      req.file.buffer,
      "receipts"
    );

    console.log("Cloudinary upload successful:", cloudinaryResult.url);

    // Step 2: Create receipt record with pending status
    const receipt = new Receipt({
      userId: req.session.user._id,
      imageUrl: cloudinaryResult.url,
      imagePublicId: cloudinaryResult.publicId,
      processingStatus: "processing",
    });

    await receipt.save();
    console.log("Receipt record created:", receipt._id);

    // Step 3: Process receipt with Gemini AI
    console.log("Processing with Gemini AI...");
    const geminiResult = await processReceiptWithGemini(cloudinaryResult.url);

    console.log("Gemini AI processing complete:", geminiResult.success);

    // Step 4: Update receipt with extracted data
    if (geminiResult.success) {
      receipt.processingStatus = "completed";
      receipt.storeName = geminiResult.storeName || "";
      receipt.purchaseDate = geminiResult.purchaseDate
        ? new Date(geminiResult.purchaseDate)
        : new Date();
      receipt.totalAmount = geminiResult.totalAmount || 0;
      receipt.aiExtractedData = geminiResult;
      receipt.extractedItems = geminiResult.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price || 0,
        category: item.category,
        expiryDate: new Date(item.expiryDate),
      }));
    } else {
      receipt.processingStatus = "failed";
      receipt.processingError = geminiResult.error || "Unknown error";
    }

    await receipt.save();

    console.log("Receipt updated with processing results");

    // Return success response
    res.json({
      success: geminiResult.success,
      data: receipt,
      extractedItems: receipt.extractedItems,
      message: geminiResult.success
        ? "Receipt processed successfully"
        : "Receipt processing failed",
    });
  } catch (error) {
    console.error("Error processing receipt:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process receipt",
    });
  }
});

/**
 * POST /api/scan/save-items
 * Save extracted items to user's food inventory
 */
router.post("/api/scan/save-items", async (req, res) => {
  try {
    // Check authentication
    if (!req.session.user) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const { receiptId } = req.body;

    if (!receiptId) {
      return res
        .status(400)
        .json({ success: false, error: "Receipt ID is required" });
    }

    // Get receipt
    const receipt = await Receipt.findOne({
      _id: receiptId,
      userId: req.session.user._id,
    });

    if (!receipt) {
      return res
        .status(404)
        .json({ success: false, error: "Receipt not found" });
    }

    if (receipt.itemsAddedToInventory) {
      return res.status(400).json({
        success: false,
        error: "Items from this receipt have already been added",
      });
    }

    // Prepare food items from receipt data
    const receiptData = {
      items: receipt.extractedItems,
      purchaseDate: receipt.purchaseDate,
      storeName: receipt.storeName,
    };

    const foodItems = prepareFoodItemsFromReceipt(
      receiptData,
      req.session.user._id,
      receipt._id
    );

    // Save food items to database
    const savedItems = await FoodItem.insertMany(foodItems);

    // Mark receipt as processed
    receipt.itemsAddedToInventory = true;
    await receipt.save();

    // Create notifications for items expiring soon
    const userDaysBeforeExpiry =
      req.session.user.notificationPreferences?.daysBeforeExpiry || 3;
    const notificationThreshold = new Date();
    notificationThreshold.setDate(
      notificationThreshold.getDate() + userDaysBeforeExpiry
    );

    for (const item of savedItems) {
      if (item.expiryDate <= notificationThreshold) {
        const daysUntilExpiry = Math.ceil(
          (item.expiryDate - new Date()) / (1000 * 60 * 60 * 24)
        );
        try {
          await createExpiryNotification(
            req.session.user._id,
            item,
            daysUntilExpiry
          );
        } catch (notifError) {
          console.error("Error creating notification:", notifError);
          // Continue even if notification fails
        }
      }
    }

    console.log(`Saved ${savedItems.length} items from receipt ${receiptId}`);

    res.json({
      success: true,
      itemsSaved: savedItems.length,
      items: savedItems,
      message: `Successfully saved ${savedItems.length} items to your inventory`,
    });
  } catch (error) {
    console.error("Error saving items:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to save items",
    });
  }
});

/**
 * GET /api/scan/history
 * Get user's receipt scanning history
 */
router.get("/api/scan/history", async (req, res) => {
  try {
    if (!req.session.user) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const receipts = await Receipt.find({ userId: req.session.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      receipts,
    });
  } catch (error) {
    console.error("Error fetching receipt history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch receipt history",
    });
  }
});

/**
 * GET /api/scan/receipt/:id
 * Get a specific receipt by ID
 */
router.get("/api/scan/receipt/:id", async (req, res) => {
  try {
    if (!req.session.user) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const receipt = await Receipt.findOne({
      _id: req.params.id,
      userId: req.session.user._id,
    });

    if (!receipt) {
      return res
        .status(404)
        .json({ success: false, error: "Receipt not found" });
    }

    res.json({
      success: true,
      receipt,
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch receipt",
    });
  }
});

module.exports = router;
