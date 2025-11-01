const mongoose = require("mongoose");

/**
 * Shopping Item Model
 * 
 * This model represents items in a user's shopping list/cart.
 * Team Member Assignment: [ASSIGN TEAM MEMBER NAME]
 * 
 * Schema Fields:
 * - userId: Reference to User who owns this shopping list
 * - name: Name of the item to buy
 * - category: Food category for organization
 * - quantity: Amount needed
 * - unit: Unit of measurement
 * - priority: Priority level (low, medium, high)
 * - source: Where this item came from (e.g., "recipe", "manual", "expiry_warning")
 * - sourceRecipeId: If from a recipe, reference to recipe
 * - checked: Whether item has been purchased
 * - checkedDate: When item was checked off
 * - estimatedPrice: Estimated cost
 * - notes: Additional notes
 * 
 * @module models/shoppingItem
 */

const shoppingItemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    source: {
      type: String,
      enum: ["recipe", "manual", "expiry_warning", "suggestion"],
      default: "manual",
    },
    sourceRecipeId: {
      type: String,
      default: null, // If from a recipe, store recipe identifier
    },
    checked: {
      type: Boolean,
      default: false,
      index: true,
    },
    checkedDate: {
      type: Date,
      default: null,
    },
    estimatedPrice: {
      type: Number,
      default: 0,
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

// Index for efficient queries on user's unchecked items
shoppingItemSchema.index({ userId: 1, checked: 1, createdAt: -1 });

module.exports = mongoose.model("ShoppingItem", shoppingItemSchema);

