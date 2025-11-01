# Module Documentation

This document describes the modular structure of the Track2Give application, designed for parallel team development with minimal merge conflicts.

## 📋 Table of Contents

1. [Leaderboard Module](#leaderboard-module)
2. [Carbon Emissions Module](#carbon-emissions-module)
3. [Recipe Generation Module](#recipe-generation-module)
4. [Shopping Cart/List Module](#shopping-cartlist-module)
5. [Development Guidelines](#development-guidelines)

---

## 🏆 Leaderboard Module

**Team Member Assignment:** [ASSIGN TEAM MEMBER NAME]

**Purpose:** Displays top donors and donation statistics to encourage community engagement.

### File Structure

```
track2give-main/
├── routes/
│   └── leaderboard.js          # Route handlers for leaderboard endpoints
├── utilities/
│   └── leaderboard-util.js      # Business logic for leaderboard calculations
└── views/
    └── leaderboard.ejs          # Frontend view template
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/leaderboard` | Renders the leaderboard page |
| GET | `/api/leaderboard/top-donors` | Returns top donors by items shared |
| GET | `/api/leaderboard/top-carbon-savers` | Returns top users by CO2 saved |
| GET | `/api/leaderboard/stats` | Returns global donation statistics |
| GET | `/api/leaderboard/user-rank` | Returns current user's rank |

### Data Dependencies

- **Models:** `ImpactStats`, `User`, `SharedItem`
- **Utilities:** None (standalone module)
- **Other Modules:** None

### Key Functions (Placeholders)

- `getTopDonors(limit)` - Get top donors sorted by items shared
- `getTopCarbonSavers(limit)` - Get top users sorted by CO2 saved
- `getGlobalDonationStats()` - Calculate global statistics
- `getUserRank(userId)` - Calculate user's rank and percentile

### Implementation Notes

- Use MongoDB aggregation for efficient leaderboard queries
- Support sorting by donations or carbon savings
- Calculate percentile ranks for user motivation
- Display global impact statistics

---

## 🌍 Carbon Emissions Module

**Team Member Assignment:** [ASSIGN TEAM MEMBER NAME]

**Purpose:** Tracks and visualizes carbon footprint reductions from food waste prevention.

### File Structure

```
track2give-main/
├── routes/
│   └── carbon.js                # Route handlers for carbon tracking endpoints
├── utilities/
│   └── carbon-util.js           # Business logic for carbon calculations
└── views/
    └── carbon.ejs               # Frontend view with visualizations
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/carbon` | Renders the carbon emissions tracking page |
| GET | `/api/carbon/history` | Returns user's carbon savings history |
| GET | `/api/carbon/breakdown` | Returns carbon savings by category |
| GET | `/api/carbon/global` | Returns global carbon statistics |
| GET | `/api/carbon/potential` | Returns potential savings from unexpired items |

### Data Dependencies

- **Models:** `ImpactStats`, `FoodItem`
- **Utilities:** `utilities/impact-util.js` (for IMPACT_CONSTANTS)
- **Other Modules:** None

### Key Functions (Placeholders)

- `getUserCarbonHistory(userId, period)` - Get historical carbon savings data
- `getCarbonBreakdownByCategory(userId)` - Breakdown by food category
- `getGlobalCarbonStats()` - Global community carbon impact
- `calculatePotentialCarbonSavings(foodItems)` - Potential from unexpired items

### Implementation Notes

- Use `IMPACT_CONSTANTS` from `impact-util.js` for CO2 calculations
- Support time period filters (week, month, year, all)
- Calculate equivalent metrics (cars removed, trees planted)
- Visualize data with charts or progress bars

---

## 🍳 Recipe Generation Module

**Team Member Assignment:** [ASSIGN TEAM MEMBER NAME]

**Purpose:** Generates two types of recipes:
1. Recipes using only existing groceries (no shopping required)
2. Recipes requiring additional shopping (with shopping list integration)

### File Structure

```
track2give-main/
├── routes/
│   └── recipes.js               # Enhanced route handlers (exists, needs updates)
├── utilities/
│   ├── recipe-util.js           # NEW: Recipe generation business logic
│   └── gemini-util.js           # Existing: Gemini AI integration (no changes needed)
└── views/
    └── recipes.ejs              # Existing view (may need updates)
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/recipes` | Renders the recipes page (EXISTS) |
| POST | `/api/generate-recipe` | Legacy endpoint (EXISTS, may deprecate) |
| POST | `/api/generate-recipe/existing` | **NEW** - Recipes with existing groceries only |
| POST | `/api/generate-recipe/shopping` | **NEW** - Recipes requiring shopping |
| POST | `/api/generate-recipe/both` | **NEW** - Generate both types simultaneously |

### Data Dependencies

- **Models:** `FoodItem`
- **Utilities:** `utilities/gemini-util.js` (for AI generation)
- **Other Modules:** `Shopping Cart/List` (for adding recipe items to shopping list)

### Key Functions (Placeholders)

- `generateRecipesWithExistingGroceries(userId, cuisine)` - Recipes using only available items
- `generateRecipesWithShopping(userId, cuisine)` - Recipes with shopping requirements
- `generateBothRecipeTypes(userId, cuisine)` - Convenience function for both
- `compareIngredientsWithInventory(recipeIngredients, availableItems)` - Helper function

### Implementation Notes

- Modify Gemini prompts to specify "existing only" vs "allow additional items"
- Extract `requiredShoppingItems` from recipes that need shopping
- Integrate with shopping module to add missing ingredients
- Maintain backward compatibility with existing recipe endpoints

### Recipe Object Structure

```javascript
{
  title: string,
  ingredients: Array<string>,           // Full ingredient list
  instructions: string,
  readyInMinutes: number,
  servings: number,
  usedIngredients: Array<string>,        // Ingredients from user's inventory
  requiredShoppingItems: Array<string>,  // Items to buy (if requiresShopping: true)
  requiresShopping: boolean,
  description: string
}
```

---

## 🛒 Shopping Cart/List Module

**Team Member Assignment:** [ASSIGN TEAM MEMBER NAME]

**Purpose:** Manages grocery shopping lists and integrates with recipe selections.

### File Structure

```
track2give-main/
├── routes/
│   └── shopping.js              # Route handlers for shopping list endpoints
├── utilities/
│   └── shopping-util.js          # Business logic for shopping list management
├── models/
│   └── shoppingItem.js           # Shopping item data model
└── views/
    └── shopping.ejs              # Frontend view template
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/shopping` | Renders the shopping list page |
| GET | `/api/shopping/list` | Returns user's shopping list |
| POST | `/api/shopping/add` | Add manual item to list |
| POST | `/api/shopping/add-from-recipe` | Add items from recipe |
| PATCH | `/api/shopping/:id/check` | Check off item (mark purchased) |
| DELETE | `/api/shopping/:id` | Remove item from list |
| DELETE | `/api/shopping/clear-checked` | Clear all checked items |
| GET | `/api/shopping/stats` | Get shopping list statistics |

### Data Dependencies

- **Models:** `ShoppingItem` (NEW), `FoodItem` (for converting to inventory)
- **Utilities:** None (standalone module)
- **Other Modules:** `Recipe Generation` (receives items from recipes)

### Key Functions (Placeholders)

- `getShoppingList(userId, includeChecked)` - Get user's shopping list
- `addRecipeItemsToShoppingList(userId, recipe, sourceRecipeId)` - Add from recipe
- `addManualItem(userId, itemData)` - Add manual item
- `checkOffItem(userId, itemId, addToInventory)` - Mark as purchased
- `removeItem(userId, itemId)` - Remove from list
- `clearCheckedItems(userId)` - Clear checked items
- `getShoppingListStats(userId)` - Get statistics

### ShoppingItem Model Schema

```javascript
{
  userId: ObjectId,
  name: string,
  category: string,
  quantity: number,
  unit: string,
  priority: "low" | "medium" | "high",
  source: "recipe" | "manual" | "expiry_warning" | "suggestion",
  sourceRecipeId: string | null,
  checked: boolean,
  checkedDate: Date | null,
  estimatedPrice: number,
  notes: string
}
```

### Implementation Notes

- Support priority levels (high/medium/low) for organization
- Track source of items (recipe, manual, etc.)
- Option to convert checked items to FoodItems automatically
- Calculate total estimated cost
- Filter by checked/unchecked status

---

## 🛠️ Development Guidelines

### Module Boundaries

Each module is **self-contained** with minimal dependencies:

1. **Leaderboard** - Independent (uses ImpactStats, User, SharedItem)
2. **Carbon Emissions** - Independent (uses ImpactStats, FoodItem, impact-util)
3. **Recipe Generation** - Reads FoodItem, writes to Shopping module
4. **Shopping Cart/List** - Independent (uses ShoppingItem, FoodItem)

### Avoiding Merge Conflicts

1. **Separate Files:** Each module has its own route, utility, and view files
2. **No Shared Logic:** Each module contains all its business logic
3. **Clear Interfaces:** Functions are well-documented with expected inputs/outputs
4. **Placeholder Implementation:** All functions throw errors until implemented

### Team Collaboration Workflow

1. **Assign Modules:** Each team member works on one complete module
2. **Parallel Development:** All modules can be developed simultaneously
3. **Integration Points:** Documented in this file for reference
4. **Testing:** Test modules independently before integration

### Integration Points

#### Recipe → Shopping Integration

When a recipe requires shopping:
1. Recipe module generates recipe with `requiredShoppingItems`
2. Frontend calls `POST /api/shopping/add-from-recipe`
3. Shopping module creates ShoppingItems from recipe

#### Shopping → FoodItem Integration

When checking off shopping items:
1. User checks off item via `PATCH /api/shopping/:id/check?addToInventory=true`
2. Shopping module creates FoodItem from ShoppingItem
3. FoodItem appears in user's inventory

### Code Style

- Use JSDoc comments for all functions
- Follow existing code style in codebase
- Use async/await for database operations
- Validate inputs in route handlers
- Return consistent JSON response format

### Testing Checklist

For each module, test:
- [ ] All route handlers respond correctly
- [ ] Utility functions handle edge cases
- [ ] Views render with sample data
- [ ] API endpoints return correct format
- [ ] Error handling works properly
- [ ] Authentication middleware protects routes

---

## 📝 Implementation Status

| Module | Routes | Utilities | Views | Model | Status |
|--------|--------|-----------|-------|-------|---------|
| Leaderboard | ✅ Placeholder | ✅ Placeholder | ✅ Placeholder | ✅ Uses existing | Ready for development |
| Carbon Emissions | ✅ Placeholder | ✅ Placeholder | ✅ Placeholder | ✅ Uses existing | Ready for development |
| Recipe Generation | ✅ Partial | ✅ Placeholder | ✅ Exists | ✅ Uses existing | Needs enhancement |
| Shopping Cart/List | ✅ Placeholder | ✅ Placeholder | ✅ Placeholder | ✅ Created | Ready for development |

**Legend:**
- ✅ = Structure created, ready for implementation
- ✅ Partial = Partially implemented, needs updates
- ✅ Exists = Already exists, may need updates
- ✅ Uses existing = Uses existing models
- ✅ Created = New model created

---

## 🚀 Getting Started

1. **Assign Modules:** Team lead assigns modules to team members
2. **Read Documentation:** Each developer reads their module's section
3. **Understand Placeholders:** Review placeholder functions and their intended behavior
4. **Start Implementation:** Begin implementing functions marked with `TODO`
5. **Test Independently:** Test your module before integrating with others
6. **Document Changes:** Update this file if module interfaces change

---

**Last Updated:** [Date]
**Team:** Track2Give Development Team

