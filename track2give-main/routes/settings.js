const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// GET /settings - Settings page
router.get("/settings", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

    res.render("settings", {
      title: "Track2Give - Settings",
      user: req.session.user,
      currentPage: "settings",
      userPreferences: user.notificationPreferences,
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null,
    });
  } catch (error) {
    console.error("Error loading settings page:", error);
    res.status(500).send("Error loading settings");
  }
});

// POST /api/settings/notifications - Update notification preferences
router.post("/api/settings/notifications", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

    user.notificationPreferences = {
      email: req.body.email === "true" || req.body.email === true,
      push: req.body.push === "true" || req.body.push === true,
      expiryReminder:
        req.body.expiryReminder === "true" || req.body.expiryReminder === true,
      daysBeforeExpiry: parseInt(req.body.daysBeforeExpiry) || 3,
    };

    await user.save();

    res.json({
      message: "Notification preferences updated successfully",
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res
      .status(500)
      .json({ error: "Failed to update notification preferences" });
  }
});

// POST /api/settings/profile - Update profile
router.post("/api/settings/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

    if (req.body.username) {
      // Check if username is already taken
      const existingUser = await User.findOne({
        username: req.body.username,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Username already taken" });
      }

      user.username = req.body.username;
    }

    if (req.body.email) {
      // Check if email is already taken
      const existingUser = await User.findOne({
        email: req.body.email.toLowerCase(),
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      user.email = req.body.email.toLowerCase();
    }

    await user.save();

    // Update session
    req.session.user.username = user.username;
    req.session.user.email = user.email;

    res.json({
      message: "Profile updated successfully",
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST /api/settings/password - Change password
router.post("/api/settings/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    const user = await User.findById(req.session.user._id);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.SALT_ROUND) || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// DELETE /api/settings/account - Delete account
router.delete("/api/settings/account", requireAuth, async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.session.user._id);

    // Verify password before deletion
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Password is incorrect" });
    }

    // Delete user's data
    await User.findByIdAndDelete(req.session.user._id);
    // TODO: Delete user's food items, receipts, shared items, etc.

    // Destroy session
    req.session.destroy();

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

module.exports = router;
