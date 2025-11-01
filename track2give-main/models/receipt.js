const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Cloudinary image storage
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      required: true, // Cloudinary public_id for deletion
    },
    // Store metadata
    storeName: {
      type: String,
      default: "",
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    // Gemini AI extracted data (raw JSON)
    aiExtractedData: {
      type: mongoose.Schema.Types.Mixed, // Stores the raw JSON from Gemini
      default: {},
    },
    // Processing status
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    processingError: {
      type: String,
      default: null,
    },
    // Items extracted from receipt (denormalized for quick access)
    extractedItems: [
      {
        name: String,
        quantity: Number,
        unit: String,
        price: Number,
        category: String,
        expiryDate: Date,
      },
    ],
    // Track which items have been added to user's food inventory
    itemsAddedToInventory: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
receiptSchema.index({ userId: 1, processingStatus: 1 });
receiptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Receipt", receiptSchema);
