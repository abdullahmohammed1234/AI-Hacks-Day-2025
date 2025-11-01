/**
 * Shopping Cart/List Utilities Module
 * 
 * This module contains business logic for managing shopping lists and carts.
 * Team Member Assignment: [ASSIGN TEAM MEMBER NAME]
 * 
 * Dependencies:
 * - models/shoppingItem.js
 * - models/foodItem.js
 * 
 * @module utilities/shopping-util
 */

const ShoppingItem = require("../models/shoppingItem");
const FoodItem = require("../models/foodItem");
const Receipt = require("../models/receipt");

/**
 * Get user's shopping list
 * 
 * Data Flow:
 * 1. Query ShoppingItems for user
 * 2. Filter by checked status if specified
 * 3. Sort by priority and creation date
 * 4. Return formatted list
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @param {Boolean} includeChecked - Whether to include checked items (default: false)
 * @returns {Promise<Array>} Array of shopping items
 * 
 * TODO: Implement function
 */
async function getShoppingList(userId, includeChecked = false) {
  // TODO:
  // 1. Build query: userId and checked based on includeChecked
  // 2. Sort by priority (high first), then createdAt
  // 3. Return array
  throw new Error("TODO: Implement getShoppingList");
}

/**
 * Add items to shopping list from recipe
 * 
 * Data Flow:
 * 1. Receive recipe object with requiredShoppingItems or missingIngredients
 * 2. For each missing item, create ShoppingItem
 * 3. Mark source as "recipe" and store sourceRecipeId
 * 4. Return created items
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @param {Object} recipe - Recipe object with requiredShoppingItems
 * @param {String} sourceRecipeId - Identifier for the recipe
 * @returns {Promise<Array>} Array of created shopping items
 * 
 * TODO: Implement function
 */
async function addRecipeItemsToShoppingList(userId, recipe, sourceRecipeId) {
  // TODO:
  // 1. Extract requiredShoppingItems or missingIngredients from recipe
  // 2. For each item, create ShoppingItem with:
  //    - userId
  //    - name (from recipe item)
  //    - source: "recipe"
  //    - sourceRecipeId
  //    - Parse quantity and unit if available
  //    - Set priority (can be based on recipe priority or default to medium)
  // 3. Use insertMany for efficiency
  // 4. Return created items
  throw new Error("TODO: Implement addRecipeItemsToShoppingList");
}

/**
 * Add manual item to shopping list
 * 
 * Data Flow:
 * 1. Validate input data
 * 2. Create ShoppingItem document
 * 3. Save to database
 * 4. Return created item
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @param {Object} itemData - Item data (name, quantity, unit, category, etc.)
 * @returns {Promise<Object>} Created shopping item
 * 
 * TODO: Implement function
 */
async function addManualItem(userId, itemData) {
  // TODO:
  // 1. Validate required fields (name)
  // 2. Create ShoppingItem with provided data
  // 3. Set source to "manual"
  // 4. Save and return
  throw new Error("TODO: Implement addManualItem");
}

/**
 * Check off shopping item (mark as purchased)
 * 
 * Data Flow:
 * 1. Find ShoppingItem by ID and userId
 * 2. Update checked to true
 * 3. Set checkedDate to now
 * 4. Optionally convert to FoodItem and add to inventory
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @param {String} itemId - ShoppingItem ID
 * @param {Boolean} addToInventory - Whether to add as FoodItem (default: false)
 * @returns {Promise<Object>} Updated shopping item
 * 
 * TODO: Implement function
 */
async function checkOffItem(userId, itemId, addToInventory = false) {
  // TODO:
  // 1. Find ShoppingItem by _id and userId
  // 2. Update checked=true, checkedDate=now
  // 3. If addToInventory is true:
  //    - Create FoodItem from ShoppingItem data
  //    - Set appropriate expiry date based on category
  //    - Save FoodItem
  // 4. Return updated ShoppingItem
  throw new Error("TODO: Implement checkOffItem");
}

/**
 * Remove item from shopping list
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @param {String} itemId - ShoppingItem ID
 * @returns {Promise<Boolean>} Success status
 * 
 * TODO: Implement function
 */
async function removeItem(userId, itemId) {
  // TODO:
  // 1. Find and delete ShoppingItem by _id and userId
  // 2. Return success status
  throw new Error("TODO: Implement removeItem");
}

/**
 * Clear checked items from shopping list
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Number>} Number of items removed
 * 
 * TODO: Implement function
 */
async function clearCheckedItems(userId) {
  // TODO:
  // 1. Delete all ShoppingItems where userId matches and checked=true
  // 2. Return count of deleted items
  throw new Error("TODO: Implement clearCheckedItems");
}

/**
 * Get shopping list statistics
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Shopping list stats
 * 
 * Example Return:
 * {
 *   totalItems: 15,
 *   uncheckedItems: 12,
 *   checkedItems: 3,
 *   estimatedTotalCost: 45.50,
 *   highPriorityItems: 2
 * }
 * 
 * TODO: Implement function
 */
async function getShoppingListStats(userId) {
  // TODO:
  // 1. Count all items, unchecked items, checked items
  // 2. Sum estimatedPrice for unchecked items
  // 3. Count high priority items
  // 4. Return stats object
  throw new Error("TODO: Implement getShoppingListStats");
}

/**
 * Analyze receipt history to find frequently bought items
 * 
 * Data Flow:
 * 1. Get all completed receipts for user
 * 2. Extract items from extractedItems arrays
 * 3. Count frequency of each item
 * 4. Return top N frequently bought items
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @param {Number} limit - Number of top items to return (default: 10)
 * @returns {Promise<Array>} Array of frequently bought items with counts
 * 
 * Example Return:
 * [
 *   { name: "milk", count: 8, avgPrice: 4.50, category: "dairy" },
 *   { name: "bread", count: 6, avgPrice: 3.00, category: "bakery" },
 *   ...
 * ]
 */
async function getFrequentlyBoughtItems(userId, limit = 10) {
  try {
    // Get all completed receipts for the user
    const receipts = await Receipt.find({
      userId: userId,
      processingStatus: "completed",
    }).sort({ purchaseDate: -1 });

    // Analyze items from receipts
    const itemFrequency = {};
    
    receipts.forEach((receipt) => {
      if (receipt.extractedItems && receipt.extractedItems.length > 0) {
        receipt.extractedItems.forEach((item) => {
          const normalizedName = item.name.toLowerCase().trim();
          
          if (!itemFrequency[normalizedName]) {
            itemFrequency[normalizedName] = {
              name: item.name,
              count: 0,
              totalPrice: 0,
              prices: [],
              category: item.category || "other",
              unit: item.unit || "item",
            };
          }
          
          itemFrequency[normalizedName].count++;
          if (item.price) {
            itemFrequency[normalizedName].prices.push(item.price);
            itemFrequency[normalizedName].totalPrice += item.price;
          }
        });
      }
    });

    // Convert to array and calculate averages
    const items = Object.values(itemFrequency).map((item) => {
      // Calculate purchase frequency description
      let frequencyDescription = "";
      if (receipts.length > 0) {
        const daysSinceFirstPurchase = Math.ceil(
          (new Date() - receipts[receipts.length - 1].purchaseDate) / (1000 * 60 * 60 * 24)
        );
        const purchaseFrequency = item.count > 0 && daysSinceFirstPurchase > 0
          ? daysSinceFirstPurchase / item.count
          : 0;

        if (purchaseFrequency <= 2) {
          frequencyDescription = "Bought daily";
        } else if (purchaseFrequency <= 7) {
          frequencyDescription = "Bought weekly";
        } else if (purchaseFrequency <= 14) {
          frequencyDescription = "Bought bi-weekly";
        } else if (purchaseFrequency <= 30) {
          frequencyDescription = "Bought monthly";
        } else if (purchaseFrequency <= 60) {
          frequencyDescription = "Bought every 2 months";
        } else {
          frequencyDescription = "Bought occasionally";
        }
      } else {
        frequencyDescription = "Recently purchased";
      }

      return {
        name: item.name,
        count: item.count,
        avgPrice: item.prices.length > 0 
          ? item.totalPrice / item.prices.length 
          : 0,
        category: item.category,
        unit: item.unit,
        lastPurchased: receipts.length > 0 ? receipts[0].purchaseDate : null,
        frequencyDescription: frequencyDescription,
      };
    });

    // Sort by frequency and return top items
    items.sort((a, b) => b.count - a.count);
    
    return items.slice(0, limit);
  } catch (error) {
    console.error("Error getting frequently bought items:", error);
    return [];
  }
}

/**
 * Get shopping recommendations from recipes
 * Analyzes recipes that require shopping and extracts commonly needed items
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @param {Number} limit - Number of recommendations to return (default: 5)
 * @returns {Promise<Array>} Array of recommended items from recipes
 */
async function getRecipeRecommendations(userId, limit = 5) {
  try {
    // This would ideally integrate with the recipe generation system
    // For now, we'll check if there are any recipes stored or generate suggestions
    // based on user's current food items
    
    const currentItems = await FoodItem.find({
      userId: userId,
      consumed: false,
      expiryDate: { $gte: new Date() },
    });

    // Get ingredient names
    const ingredientNames = currentItems.map((item) => item.name.toLowerCase());

    // For now, return empty array - this would integrate with recipe-util
    // to generate recipes with shopping requirements and extract common items
    // TODO: Integrate with recipe generation system when available
    
    return [];
  } catch (error) {
    console.error("Error getting recipe recommendations:", error);
    return [];
  }
}

/**
 * Get smart shopping cart suggestions
 * Combines frequently bought items and recipe recommendations
 * 
 * @param {String} userId - User's MongoDB ObjectId
 * @returns {Promise<Object>} Combined shopping suggestions
 */
async function getShoppingSuggestions(userId) {
  try {
    const [frequentItems, recipeItems] = await Promise.all([
      getFrequentlyBoughtItems(userId, 10),
      getRecipeRecommendations(userId, 5),
    ]);

    return {
      fromHistory: frequentItems,
      fromRecipes: recipeItems,
      totalSuggestions: frequentItems.length + recipeItems.length,
    };
  } catch (error) {
    console.error("Error getting shopping suggestions:", error);
    return {
      fromHistory: [],
      fromRecipes: [],
      totalSuggestions: 0,
    };
  }
}

module.exports = {
  getShoppingList,
  addRecipeItemsToShoppingList,
  addManualItem,
  checkOffItem,
  removeItem,
  clearCheckedItems,
  getShoppingListStats,
  getFrequentlyBoughtItems,
  getRecipeRecommendations,
  getShoppingSuggestions,
};

