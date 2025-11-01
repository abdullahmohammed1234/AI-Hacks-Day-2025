const Notification = require("../models/notification");
const FoodItem = require("../models/foodItem");
const User = require("../models/user");
const { getDaysUntilExpiry } = require("./food-util");

/**
 * Create expiry warning notification
 * @param {String} userId - User's MongoDB ObjectId
 * @param {Object} foodItem - FoodItem document
 * @param {Number} daysUntilExpiry - Days until item expires
 * @returns {Promise<Object>} Created notification
 */
async function createExpiryNotification(userId, foodItem, daysUntilExpiry) {
  try {
    let type, title, message;

    if (daysUntilExpiry <= 0) {
      type = "expiry_urgent";
      title = "Food Item Expired!";
      message = `Your ${foodItem.name} has expired. Consider donating if still safe, or dispose properly.`;
    } else if (daysUntilExpiry === 1) {
      type = "expiry_urgent";
      title = "Expires Tomorrow!";
      message = `Your ${foodItem.name} expires tomorrow. Use it today or share with your community!`;
    } else if (daysUntilExpiry <= 3) {
      type = "expiry_warning";
      title = "Food Expiring Soon";
      message = `Your ${foodItem.name} expires in ${daysUntilExpiry} days. Plan to use it or donate it!`;
    } else {
      type = "expiry_warning";
      title = "Upcoming Expiry";
      message = `Your ${foodItem.name} expires in ${daysUntilExpiry} days.`;
    }

    const notification = new Notification({
      userId,
      foodItemId: foodItem._id,
      type,
      title,
      message,
      metadata: {
        foodItemName: foodItem.name,
        expiryDate: foodItem.expiryDate,
        daysUntilExpiry,
      },
      read: false,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating expiry notification:", error);
    throw error;
  }
}

/**
 * Create donation reminder notification
 * @param {String} userId - User's MongoDB ObjectId
 * @param {Object} foodItem - FoodItem document
 * @returns {Promise<Object>} Created notification
 */
async function createDonationReminder(userId, foodItem) {
  try {
    const notification = new Notification({
      userId,
      foodItemId: foodItem._id,
      type: "donation_reminder",
      title: "Consider Donating",
      message: `Your ${foodItem.name} is expiring soon. Share it with the community to reduce waste!`,
      metadata: {
        foodItemName: foodItem.name,
        expiryDate: foodItem.expiryDate,
        daysUntilExpiry: getDaysUntilExpiry(foodItem.expiryDate),
      },
      read: false,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating donation reminder:", error);
    throw error;
  }
}

/**
 * Create item claimed notification
 * @param {String} userId - Donor's user ID
 * @param {String} claimedByUsername - Username who claimed
 * @param {String} itemName - Name of claimed item
 * @returns {Promise<Object>} Created notification
 */
async function createItemClaimedNotification(userId, claimedByUsername, itemName) {
  try {
    const notification = new Notification({
      userId,
      type: "item_claimed",
      title: "Your Item Was Claimed!",
      message: `${claimedByUsername} has claimed your ${itemName}. Thank you for reducing food waste!`,
      metadata: {
        foodItemName: itemName,
        claimedBy: claimedByUsername,
      },
      read: false,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating claimed notification:", error);
    throw error;
  }
}

/**
 * Check and create notifications for expiring items
 * Should be run daily via cron job
 * @returns {Promise<Number>} Number of notifications created
 */
async function checkAndNotifyExpiringItems() {
  try {
    let notificationCount = 0;

    // Get all users with notification preferences
    const users = await User.find({
      "notificationPreferences.expiryReminder": true,
    });

    for (const user of users) {
      const daysBeforeExpiry = user.notificationPreferences.daysBeforeExpiry || 3;
      const now = new Date();
      const futureDate = new Date(
        now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000
      );

      // Get user's expiring items
      const expiringItems = await FoodItem.find({
        userId: user._id,
        consumed: false,
        shared: false,
        expiryDate: { $lte: futureDate, $gte: now },
      });

      for (const item of expiringItems) {
        const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);

        // Check if notification already exists
        const existingNotification = await Notification.findOne({
          userId: user._id,
          foodItemId: item._id,
          type: { $in: ["expiry_warning", "expiry_urgent"] },
          createdAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        });

        if (!existingNotification) {
          await createExpiryNotification(user._id, item, daysUntilExpiry);
          notificationCount++;
        }
      }
    }

    console.log(`Created ${notificationCount} expiry notifications`);
    return notificationCount;
  } catch (error) {
    console.error("Error checking expiring items:", error);
    throw error;
  }
}

/**
 * Get user's unread notifications
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Array>} Array of unread notifications
 */
async function getUnreadNotifications(userId) {
  try {
    const notifications = await Notification.find({
      userId,
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return notifications;
  } catch (error) {
    console.error("Error getting unread notifications:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {String} notificationId - Notification's MongoDB ObjectId
 * @returns {Promise<Object>} Updated notification
 */
async function markAsRead(notificationId) {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );

    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Number>} Number of notifications marked as read
 */
async function markAllAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      { userId, read: false },
      {
        read: true,
        readAt: new Date(),
      }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Delete old notifications (older than 30 days)
 * @returns {Promise<Number>} Number of notifications deleted
 */
async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
      read: true,
    });

    console.log(`Deleted ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error cleaning up old notifications:", error);
    throw error;
  }
}

/**
 * Get notification count for user
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Notification counts
 */
async function getNotificationCount(userId) {
  try {
    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    const totalCount = await Notification.countDocuments({ userId });

    return {
      unread: unreadCount,
      total: totalCount,
    };
  } catch (error) {
    console.error("Error getting notification count:", error);
    throw error;
  }
}

/**
 * Delete notification
 * @param {String} notificationId - Notification's MongoDB ObjectId
 * @param {String} userId - User's MongoDB ObjectId (for security)
 * @returns {Promise<Object>} Deleted notification
 */
async function deleteNotification(notificationId, userId) {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    return notification;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}

module.exports = {
  createExpiryNotification,
  createDonationReminder,
  createItemClaimedNotification,
  checkAndNotifyExpiringItems,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  cleanupOldNotifications,
  getNotificationCount,
  deleteNotification,
};
