const express = require("express");
const router = express.Router();
const FoodItem = require("../models/foodItem");
const { generateRecipesWithGemini } = require("../utilities/gemini-util");
require("dotenv").config();

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

// POST /api/generate-recipe - Generate recipe using Gemini AI
router.post("/api/generate-recipe", requireAuth, async (req, res) => {
  try {
    const { ingredients, cuisine } = req.body;

    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No ingredients provided.",
      });
    }

    console.log(`Generating recipes for user: ${req.session.user.username}`);
    console.log(`Ingredients: ${ingredients.join(", ")}`);
    if (cuisine) console.log(`Cuisine: ${cuisine}`);

    // Use the Gemini utility to generate recipes
    const result = await generateRecipesWithGemini(ingredients, cuisine);

    if (result.success) {
      console.log(`Successfully generated ${result.count} recipes`);
      res.json({
        success: true,
        recipes: result.recipes,
        count: result.count,
      });
    } else {
      console.error("Recipe generation failed:", result.error);
      res.status(500).json({
        success: false,
        message: "Failed to generate recipes.",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in recipe generation endpoint:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
      error: error.message,
    });
  }
});

// GET /recipes - Recipes page
router.get("/recipes", requireAuth, async (req, res) => {
  try {
    // Get user's expiring food items
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days

    const expiringItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
      expiryDate: { $lte: futureDate, $gte: now },
    })
      .sort({ expiryDate: 1 })
      .limit(10);

    // Get only non-expired food items for the user
    const allFoodItems = await FoodItem.find({
      userId: req.session.user._id,
      consumed: false,
      expiryDate: { $gte: now }, // Only items that haven't expired
    }).sort({ expiryDate: 1 });

    // Extract ingredients for recipe suggestions
    const ingredients = allFoodItems.map((item) => item.name);

    res.render("recipes", {
      title: "Track2Give - Recipe Suggestions",
      user: req.session.user,
      currentPage: "recipes",
      expiringItems,
      allFoodItems,
      ingredients,
    });
  } catch (error) {
    console.error("Error loading recipes page:", error);
    res.status(500).send("Error loading recipes");
  }
});

// GET /api/recipe-suggestions - Get recipe suggestions based on ingredients
router.get("/api/recipe-suggestions", requireAuth, async (req, res) => {
  try {
    const ingredients = req.query.ingredients
      ? req.query.ingredients.split(",")
      : [];

    // TODO: Call external recipe API (Spoonacular, Edamam, etc.)
    // For now, return mock data
    const mockRecipes = [
      {
        id: 1,
        title: "Quick Vegetable Stir Fry",
        image: "https://via.placeholder.com/300x200",
        usedIngredients: ingredients.slice(0, 3),
        missedIngredients: ["soy sauce", "garlic"],
        readyInMinutes: 20,
      },
      {
        id: 2,
        title: "Simple Fruit Salad",
        image: "https://via.placeholder.com/300x200",
        usedIngredients: ingredients.slice(0, 2),
        missedIngredients: ["honey", "lemon"],
        readyInMinutes: 10,
      },
    ];

    res.json({
      recipes: mockRecipes,
      totalResults: mockRecipes.length,
    });
  } catch (error) {
    console.error("Error getting recipe suggestions:", error);
    res.status(500).json({ error: "Failed to get recipe suggestions" });
  }
});

// GET /api/recipe/:id - Get recipe details
router.get("/api/recipe/:id", requireAuth, async (req, res) => {
  try {
    // TODO: Call external recipe API for details
    // For now, return mock data
    const mockRecipeDetail = {
      id: req.params.id,
      title: "Quick Vegetable Stir Fry",
      image: "https://via.placeholder.com/600x400",
      servings: 4,
      readyInMinutes: 20,
      instructions: [
        "Heat oil in a wok or large skillet",
        "Add vegetables and stir-fry for 5-7 minutes",
        "Add soy sauce and garlic",
        "Cook for another 2-3 minutes",
        "Serve hot over rice",
      ],
      ingredients: [
        { name: "Mixed Vegetables", amount: 2, unit: "cups" },
        { name: "Soy Sauce", amount: 2, unit: "tbsp" },
        { name: "Garlic", amount: 2, unit: "cloves" },
        { name: "Oil", amount: 1, unit: "tbsp" },
      ],
    };

    res.json(mockRecipeDetail);
  } catch (error) {
    console.error("Error getting recipe details:", error);
    res.status(500).json({ error: "Failed to get recipe details" });
  }
});

module.exports = router;
