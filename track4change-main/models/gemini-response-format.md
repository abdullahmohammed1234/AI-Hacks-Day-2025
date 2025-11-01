# Gemini AI Receipt Scanning - Expected JSON Response Format

## Overview
This document defines the JSON format that Gemini AI should return when analyzing receipt images.

## Response Structure

```json
{
  "success": true,
  "storeName": "Walmart Superstore",
  "purchaseDate": "2025-10-04",
  "totalAmount": 85.47,
  "items": [
    {
      "name": "Organic Milk 2L",
      "quantity": 1,
      "unit": "item",
      "price": 5.99,
      "category": "dairy",
      "expiryDate": "2025-10-14",
      "estimatedExpiryDays": 10
    },
    {
      "name": "Fresh Chicken Breast",
      "quantity": 1.2,
      "unit": "kg",
      "price": 15.48,
      "category": "meat",
      "expiryDate": "2025-10-08",
      "estimatedExpiryDays": 4
    },
    {
      "name": "Roma Tomatoes",
      "quantity": 0.8,
      "unit": "kg",
      "price": 3.20,
      "category": "vegetables",
      "expiryDate": "2025-10-11",
      "estimatedExpiryDays": 7
    },
    {
      "name": "Whole Wheat Bread",
      "quantity": 1,
      "unit": "item",
      "price": 3.49,
      "category": "bakery",
      "expiryDate": "2025-10-09",
      "estimatedExpiryDays": 5
    },
    {
      "name": "Orange Juice 1L",
      "quantity": 1,
      "unit": "L",
      "price": 4.99,
      "category": "beverages",
      "expiryDate": "2025-10-18",
      "estimatedExpiryDays": 14
    }
  ],
  "confidence": 0.92,
  "notes": "Receipt is clear and readable. All items identified successfully."
}
```

## Field Specifications

### Root Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | Boolean | Yes | Indicates if the receipt was successfully processed |
| `storeName` | String | No | Name of the store (extracted from receipt) |
| `purchaseDate` | String (ISO 8601 date) | Yes | Date of purchase (YYYY-MM-DD format) |
| `totalAmount` | Number | No | Total amount on the receipt |
| `items` | Array | Yes | Array of food items found on the receipt |
| `confidence` | Number (0-1) | No | AI confidence score for the extraction |
| `notes` | String | No | Any additional notes or warnings from the AI |

### Item Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Name of the food item |
| `quantity` | Number | Yes | Quantity purchased |
| `unit` | String | Yes | Unit of measurement (item, kg, g, lb, oz, L, mL, cup, piece) |
| `price` | Number | No | Price of the item |
| `category` | String | Yes | Food category (see categories below) |
| `expiryDate` | String (ISO 8601 date) | Yes | Estimated expiry date (YYYY-MM-DD format) |
| `estimatedExpiryDays` | Number | No | Number of days until expiry from purchase date |

### Valid Categories

- `dairy` - Milk, cheese, yogurt, etc.
- `meat` - Beef, pork, chicken, etc.
- `seafood` - Fish, shrimp, etc.
- `vegetables` - Fresh vegetables
- `fruits` - Fresh fruits
- `grains` - Rice, pasta, cereals
- `bakery` - Bread, pastries, cakes
- `beverages` - Juice, soda, etc.
- `snacks` - Chips, cookies, etc.
- `frozen` - Frozen foods
- `canned` - Canned goods
- `condiments` - Sauces, dressings
- `other` - Anything that doesn't fit above

### Valid Units

- `item` - Individual items
- `kg` - Kilograms
- `g` - Grams
- `lb` - Pounds
- `oz` - Ounces
- `L` - Liters
- `mL` - Milliliters
- `cup` - Cups
- `piece` - Pieces

## Expiry Date Estimation Guidelines

When estimating expiry dates, Gemini AI should use these general guidelines:

### Perishable Items (Short Shelf Life)
- **Fresh Meat/Seafood**: 2-4 days from purchase
- **Fresh Milk**: 7-10 days from purchase
- **Leafy Vegetables**: 3-7 days from purchase
- **Berries**: 3-5 days from purchase
- **Fresh Bakery Items**: 2-5 days from purchase

### Medium Shelf Life
- **Eggs**: 21-30 days from purchase
- **Hard Cheese**: 14-21 days from purchase
- **Root Vegetables**: 14-30 days from purchase
- **Apples/Citrus**: 14-21 days from purchase
- **Yogurt**: 7-14 days from purchase

### Long Shelf Life
- **Canned Goods**: 365+ days from purchase
- **Dry Pasta/Rice**: 365+ days from purchase
- **Frozen Foods**: 90-180 days from purchase
- **Condiments (unopened)**: 180-365 days from purchase

## Error Response Format

If processing fails:

```json
{
  "success": false,
  "error": "Unable to read receipt image",
  "errorCode": "UNREADABLE_IMAGE",
  "items": [],
  "notes": "Receipt image is too blurry or damaged to extract information."
}
```

### Error Codes

- `UNREADABLE_IMAGE` - Image quality too poor
- `NO_ITEMS_FOUND` - No food items detected
- `INVALID_RECEIPT` - Not a receipt image
- `PROCESSING_ERROR` - General processing error

## Usage in Application

1. **Upload**: User uploads receipt image to Cloudinary
2. **Process**: Send Cloudinary URL to Gemini AI with this format specification
3. **Store**: Save raw JSON response in `Receipt.aiExtractedData`
4. **Extract**: Parse items and store in `Receipt.extractedItems`
5. **Create**: Optionally auto-create `FoodItem` documents for each item
6. **Notify**: Set up notifications based on expiry dates

## Example Gemini AI Prompt

```
Analyze this receipt image and extract all food items with their details.
Return a JSON response following this exact format:
{
  "success": true/false,
  "storeName": "store name if visible",
  "purchaseDate": "YYYY-MM-DD",
  "totalAmount": total_number,
  "items": [
    {
      "name": "item name",
      "quantity": number,
      "unit": "item/kg/g/lb/oz/L/mL/cup/piece",
      "price": number,
      "category": "dairy/meat/seafood/vegetables/fruits/grains/bakery/beverages/snacks/frozen/canned/condiments/other",
      "expiryDate": "YYYY-MM-DD (estimated based on typical shelf life)",
      "estimatedExpiryDays": number_of_days_from_purchase
    }
  ],
  "confidence": 0.0-1.0,
  "notes": "any additional information"
}

For expiry dates, estimate based on:
- Fresh meat/seafood: 2-4 days
- Dairy: 7-10 days
- Fresh vegetables: 3-7 days
- Bakery: 2-5 days
- Long-life items: 30+ days
```
