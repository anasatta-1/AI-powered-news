# 🌍 Atlas — Global News Intelligence (v3.0)

Atlas is a professional, AI-powered geopolitical tracking platform that transforms real-world news into an interactive visual intelligence dashboard. It leverages **Gemini 2.0 Flash** to automatically analyze, geocode, and summarize global news events in real-time.

![Atlas Dashboard](https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200)

## 🚀 Key Features

### 🧠 AI Intelligence Engine (Powered by Gemini)
- **Automatic Intelligence Briefing**: On-demand executive summaries of all active global events, providing a birds-eye view of world tension.
- **Smart Geocoding**: Automatically parses raw news headlines to determine the exact coordinates and involved countries.
- **Smart Analysis**: Categorizes news (Conflict, Treaty, Election, etc.) and assigns severity levels (1-5) using AI.
- **Auto-Translation**: Generates professional Arabic translations for every global headline.

### 🗺️ Dynamic Interactive Map
- **Live Markers**: Visual pins dropped at GPS coordinates with category-specific icons (Flame for Conflict, Document for Treaty, etc.).
- **Heatmap Regions**: Involved countries are highlighted in real-time based on active stories in the database.
- **Global Tension Index**: A calculated risk score based on the severity and frequency of breaking news events.

### 📰 Live Editorial Control
- **Admin Management Panel**: A professional dashboard to manually publish "Breaking News" stories with AI-assisted form filling.
- **Automatic News Worker**: A background service that polls the BBC World RSS feed every 10 minutes and populates the map.
- **Bilingual Interface**: Seamlessly toggle between English (LTR) and Arabic (RTL) with professional typography.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Lucide-React, React-Simple-Maps.
- **Backend**: Node.js, Express.js.
- **AI**: Google Gemini 2.0 Flash (Generative AI SDK).
- **Database**: MySQL (WAMP/phpMyAdmin).
- **Styles**: Custom CSS3 with advanced Design Tokens and Dark/Light mode support.

## ⚙️ Setup Instructions

### 1. Database Setup
1. Open **phpMyAdmin**.
2. Create a database named `geopolitical_tracker`.
3. Import the `geopolitical_tracker_db.sql` file provided in the repository.

### 2. Backend Configuration
1. Navigate to the project folder.
2. Update the MySQL credentials in `db.cjs`:
   ```javascript
   const pool = mysql.createPool({
     host: 'localhost',
     user: 'root',
     password: '', // Your MySQL password
     database: 'geopolitical_tracker'
   });
   ```
3. Run the backend:
   ```bash
   node server.cjs
   ```

### 3. Frontend Configuration
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

## 🔐 API Key Notice
The platform requires a **Gemini API Key**. Ensure the key is valid and has sufficient quota. The backend automatically handles rate-limiting and duplicate detection.

---
*Built for Global News Intelligence & Geopolitical Research.*
