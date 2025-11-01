const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId && !this.githubId; // Password required only if not using OAuth
      },
    },
    googleId: {
      type: String,
      sparse: true, // Allows null values for non-Google users
    },
    githubId: {
      type: String,
      sparse: true, // Allows null values for non-GitHub users
    },
    githubAccessToken: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      expiryReminder: {
        type: Boolean,
        default: true,
      },
      daysBeforeExpiry: {
        type: Number,
        default: 3,
      },
    },
    rememberToken: {
      type: String,
      default: null,
    },
    rememberTokenExpiresAt: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
