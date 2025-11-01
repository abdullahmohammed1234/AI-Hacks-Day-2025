const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
      default: null, // null if manually added, otherwise references the receipt
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "dairy",
        "meat",
        "seafood",
        "vegetables",
        "fruits",
        "grains",
        "bakery",
        "beverages",
        "snacks",
        "frozen",
        "canned",
        "condiments",
        "other",
      ],
      default: "other",
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    unit: {
      type: String,
      enum: ["item", "kg", "g", "lb", "oz", "L", "mL", "cup", "piece", "pack"],
      default: "item",
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    storageLocation: {
      type: String,
      enum: ["fridge", "freezer", "pantry", "counter"],
      default: "fridge",
    },
    estimatedValue: {
      type: Number,
      default: 0,
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true,
    },
    consumedDate: {
      type: Date,
      default: null,
    },
    shared: {
      type: Boolean,
      default: false,
    },
    sharedDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries on user's active food items
foodItemSchema.index({ userId: 1, consumed: 1, expiryDate: 1 });

module.exports = mongoose.model("FoodItem", foodItemSchema);
