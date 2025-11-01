const mongoose = require("mongoose");

const impactStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    itemsSaved: {
      type: Number,
      default: 0,
    },
    itemsShared: {
      type: Number,
      default: 0,
    },
    co2SavedKg: {
      type: Number,
      default: 0,
    },
    waterSavedLiters: {
      type: Number,
      default: 0,
    },
    moneySavedDollars: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ImpactStats", impactStatsSchema);
