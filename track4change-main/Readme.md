# 🌱 Track2Give

**Track Your Food. Save Money. Save Lives.**

Addressing UN SDG Goals 2 (Zero Hunger) & 12 (Responsible Consumption) through smart food tracking and community sharing.

---

## 🌍 The Problem

- 1/3 of all food is wasted globally
- Families lose $1,500/year on wasted food
- Food waste = 8-10% of global greenhouse emissions

## 💡 Our Solution

Track2Give helps you track groceries, get expiry alerts, find recipes for expiring food, and share excess with your community.

---

## ✨ Key Features

- 📱 **Smart Food Tracking** - Add items, track expiry dates
- 🔔 **Expiry Alerts** - Never waste food again
- 🍳 **Recipe Suggestions** - Use ingredients before they expire
- 🤝 **Community Sharing** - Donate excess food to neighbors
- 📊 **Impact Dashboard** - Track CO₂, water & money saved

---

## 🚀 Quick Start

```bash
# Clone repo
git clone https://github.com/yourteam/track2give.git
cd track2give

# Install dependencies
npm install

# Set up .env file
MONGODB_URI=your_mongodb_uri
SESSION_SECRET=your_secret
PORT=3000

# Run
npm start
```

Visit `http://localhost:3000`

---

## 🔌 Key API Routes

**Food Items**

- `POST /api/food-items` - Add food item
- `GET /api/food-items` - Get your items
- `PATCH /api/food-items/:id/consume` - Mark consumed
- `POST /api/food-items/:id/share` - Share with community

**Community**

- `GET /api/community/shared-items` - Browse available items
- `POST /api/community/claim/:id` - Claim shared item

**Impact**

- `GET /api/impact-stats` - Get your environmental impact

---

## 📁 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Auth**: Passport.js
- **View**: EJS

---

## 🏆 UN SDG Impact

**Goal 2: Zero Hunger** - Community food sharing prevents waste & feeds those in need

**Goal 12: Responsible Consumption** - Smart tracking reduces overbuying & waste

---

## 👥 Team

Built for UN SDG Enactuc Challenge StormHacks2025 Hackathon

**Demo**: http://localhost:3000/demo

---

Made with ❤️ for the planet 🌍
