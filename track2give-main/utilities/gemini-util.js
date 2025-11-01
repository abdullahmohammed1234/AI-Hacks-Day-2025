/**
 * Gemini AI Utility for Receipt Scanning
 * Integrates with Google's Gemini AI to extract food items from receipt images
 */

const { calculateExpiryDate } = require("./food-util");
const axios = require("axios");

/**
 * Fetch an image and convert it to base64
 * @param {string} imageUrl - URL of the image to fetch
 * @returns {Promise<string>} Base64 encoded image data
 */
async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary").toString("base64");
  } catch (error) {
    console.error("Error fetching image:", error);
    throw new Error("Failed to fetch image");
  }
}

/**
 * Process receipt image with Gemini AI
 * @param {String} imageUrl - Cloudinary URL of the receipt image
 * @returns {Promise<Object>} Extracted receipt data
 */
async function processReceiptWithGemini(imageUrl) {
  try {
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    console.log("Processing receipt image:", imageUrl);

    const prompt = buildReceiptScanningPrompt();
    const imageData = await fetchImageAsBase64(imageUrl);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageData,
              },
            },
          ],
        },
      ],
    });

    const text = result.text;

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Gemini");
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);

    // Validate response
    const validation = validateGeminiResponse(parsedResponse);
    if (!validation.isValid) {
      console.warn("Gemini response validation failed:", validation.errors);
      // Return normalized response even if validation fails
      return normalizeGeminiResponse(parsedResponse);
    }

    // Normalize and return actual Gemini response
    return normalizeGeminiResponse(parsedResponse);
  } catch (error) {
    console.error("Error processing receipt with Gemini:", error);
    return {
      success: false,
      error: error.message,
      errorCode: "PROCESSING_ERROR",
      items: [],
      notes: "Failed to process receipt image.",
    };
  }
}

/**
 * Build Gemini AI prompt for receipt scanning
 * @returns {String} Structured prompt for Gemini AI
 */
function buildReceiptScanningPrompt() {
  return `
Analyze this receipt image and extract all food items with their details. Pay special attention to packaged foods and their expiry information.

Important Guidelines:
1. For packaged foods, look for format patterns that might indicate expiry dates (MM/DD/YY, YYYY-MM-DD, etc.)
2. Extract product names including brand names and package sizes
3. Use package units (e.g., "12-pack", "family size") when relevant
4. Consider shelf-stable vs. perishable items when estimating expiry

Return a JSON response following this exact format:

{
  "success": true/false,
  "storeName": "store name if visible",
  "purchaseDate": "YYYY-MM-DD",
  "totalAmount": total_number,
  "items": [
    {
      "name": "item name (include brand and size if visible)",
      "quantity": number,
      "unit": "item/kg/g/lb/oz/L/mL/cup/piece/pack",
      "price": number,
      "category": "dairy/meat/seafood/vegetables/fruits/grains/bakery/beverages/snacks/frozen/canned/condiments/other",
      "packageType": "fresh/packaged/frozen/canned",
      "expiryDate": "YYYY-MM-DD",
      "estimatedExpiryDays": number_of_days_from_purchase,
      "isEstimatedExpiry": true/false
    }
  ],
  "confidence": 0.0-1.0,
  "notes": "any additional information"
}

Expiry Date Guidelines:

For Packaged Foods:
- If expiry/best before date is visible, use that exact date
- For processed snacks: 3-6 months if unopened
- For canned goods: 1-2 years if unopened
- For frozen packaged foods: 3-6 months if kept frozen

For Fresh Foods:
- Fresh meat/seafood: 2-4 days refrigerated
- Fresh dairy: 7-14 days from purchase
- Fresh produce: 5-7 days for vegetables, 5-10 days for fruits
- Bakery items: 2-5 days at room temperature
- Eggs: 3-4 weeks refrigerated

Storage Assumptions:
- Frozen items stay frozen
- Refrigerated items are properly refrigerated
- Shelf-stable items stored at room temperature
- Items stored in appropriate conditions

If you're unsure about an expiry date:
1. Use conservative estimates
2. Set isEstimatedExpiry to true
3. Add a note explaining your reasoning
- Dairy: 7-10 days
- Fresh vegetables: 3-7 days
- Fresh fruits: 5-7 days
- Bakery items: 2-5 days
- Frozen foods: 90-180 days
- Canned goods: 365+ days
- Dry goods/grains: 180-365 days

Categories must be one of: dairy, meat, seafood, vegetables, fruits, grains, bakery, beverages, snacks, frozen, canned, condiments, or other.

Units must be one of: item, kg, g, lb, oz, L, mL, cup, piece.

Only include food items. Ignore non-food items like household products, toiletries, etc.
  `.trim();
}

/**
 * Validate Gemini AI response
 * @param {Object} response - Gemini AI response
 * @returns {Object} Validation result
 */
function validateGeminiResponse(response) {
  const errors = [];

  if (!response.success) {
    errors.push("Response indicates failure");
  }

  if (!Array.isArray(response.items)) {
    errors.push("Items field must be an array");
  }

  const validPackageTypes = ["fresh", "packaged", "frozen", "canned"];
  const validUnits = [
    "item",
    "kg",
    "g",
    "lb",
    "oz",
    "L",
    "mL",
    "cup",
    "piece",
    "pack",
  ];
  const validCategories = [
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
  ];

  if (response.items) {
    response.items.forEach((item, index) => {
      if (!item.name) errors.push(`Item ${index}: Missing name`);
      if (!item.quantity) errors.push(`Item ${index}: Missing quantity`);
      if (!item.unit || !validUnits.includes(item.unit))
        errors.push(`Item ${index}: Invalid unit`);
      if (!item.category || !validCategories.includes(item.category))
        errors.push(`Item ${index}: Invalid category`);
      if (!item.packageType || !validPackageTypes.includes(item.packageType))
        errors.push(`Item ${index}: Invalid packageType`);
      if (!item.expiryDate) errors.push(`Item ${index}: Missing expiryDate`);
      if (typeof item.isEstimatedExpiry !== "boolean")
        errors.push(`Item ${index}: Missing or invalid isEstimatedExpiry`);

      // Validate date format
      if (item.expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(item.expiryDate)) {
        errors.push(
          `Item ${index}: Invalid expiryDate format, should be YYYY-MM-DD`
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Parse and normalize Gemini response
 * @param {Object} response - Gemini AI response
 * @returns {Object} Normalized response
 */
function normalizeGeminiResponse(response) {
  return {
    success: response.success || false,
    storeName: response.storeName || "Unknown Store",
    purchaseDate:
      response.purchaseDate || new Date().toISOString().split("T")[0],
    totalAmount: parseFloat(response.totalAmount) || 0,
    items: (response.items || []).map((item) => ({
      name: item.name || "Unknown Item",
      quantity: parseFloat(item.quantity) || 1,
      unit: item.unit || "item",
      price: parseFloat(item.price) || 0,
      category: item.category || "other",
      expiryDate:
        item.expiryDate ||
        calculateExpiryDate(new Date(), "other", "fridge")
          .toISOString()
          .split("T")[0],
      estimatedExpiryDays: parseInt(item.estimatedExpiryDays) || 7,
    })),
    confidence: parseFloat(response.confidence) || 0,
    notes: response.notes || "",
  };
}

/**
 * Actual Gemini AI integration (to be implemented)
 * Uncomment and configure when ready to use
 */
/*
async function callGeminiAPI(imageUrl) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const prompt = buildReceiptScanningPrompt();

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: await fetchImageAsBase64(imageUrl)
      }
    }
  ]);

  const response = await result.response;
  const text = response.text();

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid JSON response from Gemini");
  }

  const parsedResponse = JSON.parse(jsonMatch[0]);

  // Validate response
  const validation = validateGeminiResponse(parsedResponse);
  if (!validation.isValid) {
    throw new Error(`Invalid response: ${validation.errors.join(", ")}`);
  }

  return normalizeGeminiResponse(parsedResponse);
}

async function fetchImageAsBase64(imageUrl) {
  const fetch = require('node-fetch');
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}
*/

/**
 * Extract food items from receipt and prepare for database
 * @param {Object} receiptData - Processed receipt data from Gemini
 * @param {String} userId - User's MongoDB ObjectId
 * @param {String} receiptId - Receipt's MongoDB ObjectId
 * @returns {Array} Array of food items ready for insertion
 */
function prepareFoodItemsFromReceipt(receiptData, userId, receiptId) {
  return receiptData.items.map((item) => ({
    userId,
    receiptId,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    purchaseDate: new Date(receiptData.purchaseDate),
    expiryDate: new Date(item.expiryDate),
    storageLocation: getDefaultStorage(item.category),
    estimatedValue: item.price,
    notes: `From ${receiptData.storeName} receipt`,
    consumed: false,
    shared: false,
  }));
}

/**
 * Get default storage location for category
 * @param {String} category - Food category
 * @returns {String} Default storage location
 */
function getDefaultStorage(category) {
  const storageMap = {
    dairy: "fridge",
    meat: "fridge",
    seafood: "fridge",
    vegetables: "fridge",
    fruits: "counter",
    grains: "pantry",
    bakery: "counter",
    beverages: "fridge",
    snacks: "pantry",
    frozen: "freezer",
    canned: "pantry",
    condiments: "pantry",
    other: "pantry",
  };

  return storageMap[category] || "pantry";
}

/**
 * Build Gemini AI prompt for recipe generation
 * @param {Array} ingredients - List of ingredient names
 * @param {String} cuisine - Optional cuisine preference
 * @returns {String} Structured prompt for Gemini AI
 */
function buildRecipeGenerationPrompt(ingredients, cuisine = null) {
  const cuisineText = cuisine ? ` in ${cuisine} style` : '';

  return `
You are a creative chef AI helping users create delicious recipes based on ingredients they have at home.

User's Available Ingredients:
${ingredients.map(ing => `- ${ing}`).join('\n')}

${cuisine ? `Cuisine Preference: ${cuisine}\n` : ''}

Task:
Generate 2 different creative recipes${cuisineText} that primarily use the ingredients listed above.
You can suggest a few common pantry staples (like salt, pepper, oil, water) but try to maximize the use of the provided ingredients.

For each recipe, provide:
1. A creative and appetizing title
2. Complete list of ingredients with measurements
3. Step-by-step cooking instructions
4. Estimated cooking time in minutes
5. Number of servings

Return your response as a JSON array with EXACTLY this structure:

[
  {
    "title": "Recipe Name",
    "ingredients": [
      "2 cups ingredient 1",
      "1 tbsp ingredient 2",
      "etc."
    ],
    "instructions": "Step 1: Do this. Step 2: Do that. Step 3: Continue...",
    "readyInMinutes": 30,
    "servings": 4,
    "usedIngredients": ["ingredient1", "ingredient2"],
    "description": "Brief appetizing description of the dish"
  }
]

Important Guidelines:
- Make the recipes practical and easy to follow
- Include specific measurements (cups, tbsp, tsp, etc.)
- Instructions should be clear and numbered
- Be creative but realistic with cooking times
- Try to use as many of the provided ingredients as possible
- The instructions should be detailed enough for a beginner cook
- Make the titles appetizing and descriptive
${cuisine ? `- Ensure the recipes authentically reflect ${cuisine} cuisine flavors and techniques` : ''}

Return ONLY the JSON array, no additional text before or after.
  `.trim();
}

/**
 * Generate recipes with Gemini AI
 * @param {Array} ingredients - List of ingredient names
 * @param {String} cuisine - Optional cuisine preference
 * @returns {Promise<Object>} Generated recipes data
 */
async function generateRecipesWithGemini(ingredients, cuisine = null) {
  try {
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    console.log("Generating recipes with ingredients:", ingredients);
    if (cuisine) console.log("Cuisine preference:", cuisine);

    const prompt = buildRecipeGenerationPrompt(ingredients, cuisine);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = result.text;
    console.log("Gemini response received");

    // Parse JSON response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in response:", text);
      throw new Error("Invalid JSON response from Gemini");
    }

    const recipes = JSON.parse(jsonMatch[0]);

    // Validate that we got an array
    if (!Array.isArray(recipes)) {
      throw new Error("Response is not an array");
    }

    return {
      success: true,
      recipes: recipes,
      count: recipes.length,
    };
  } catch (error) {
    console.error("Error generating recipes with Gemini:", error);
    return {
      success: false,
      error: error.message,
      recipes: [],
    };
  }
}

module.exports = {
  processReceiptWithGemini,
  buildReceiptScanningPrompt,
  validateGeminiResponse,
  normalizeGeminiResponse,
  prepareFoodItemsFromReceipt,
  getDefaultStorage,
  generateRecipesWithGemini,
  buildRecipeGenerationPrompt,
};
