const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    foodItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodItem",
      required: true,
    },
    type: {
      type: String,
      enum: ["expiry_warning", "expiry_urgent", "donation_reminder", "item_claimed"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // Metadata for notification
    metadata: {
      foodItemName: String,
      expiryDate: Date,
      daysUntilExpiry: Number,
    },
    // Notification status
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Delivery status
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    pushSent: {
      type: Boolean,
      default: false,
    },
    pushSentAt: {
      type: Date,
      default: null,
    },
    // Scheduled time (for future notifications)
    scheduledFor: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries on user's unread notifications
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// Index for scheduled notifications
notificationSchema.index({ scheduledFor: 1, emailSent: 1, pushSent: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
