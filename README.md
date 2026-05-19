# ☂️ Bring an Umbrella

A weather-based outfit suggester app. Get dressed for the actual weather, not your wishful thinking.

---

## Project Structure

```
bring-an-umbrella/
├── backend/          ← Express + Node.js API
│   ├── server.js
│   └── package.json
└── frontend/
    └── src/
        └── App.jsx   ← React web app
```

---

## Backend Setup

```bash
cd backend
npm install
npm run dev          # starts on http://localhost:3000
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/google` | Register / retrieve user via Google ID |
| GET | `/api/weather?lat=&lon=` | Get current weather + rain alert |
| GET | `/api/closet/:googleId` | Get all closet items |
| POST | `/api/closet/:googleId` | Add item (supports image upload) |
| DELETE | `/api/closet/:googleId/:itemId` | Remove item |
| GET | `/api/outfits/suggest/:googleId` | Get outfit suggestion based on weather |
| GET | `/api/logs/:googleId` | Get outfit history |
| POST | `/api/logs/:googleId` | Log an outfit worn |

---

## Frontend Setup (React + Vite)

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
# Copy App.jsx into src/
npm run dev          # starts on http://localhost:5173
```

---

## Next Steps

### 🔐 Google Sign-In
1. Create a project at https://console.cloud.google.com
2. Enable Google Identity API
3. Add your client ID to the frontend
4. On sign-in success, call `POST /api/auth/google` with the user payload

### 🌦 Weather.com API (when ready)
- Replace Open-Meteo in `server.js` with the Weather.com (The Weather Company) API
- Swap the `/api/weather` handler with their `GET /v1/geocode/{lat}/{lon}/observations/current.json` endpoint
- Requires an API key from developer.weather.com

### 🍎 iOS App
- Use the same backend API endpoints from Swift
- `URLSession` for API calls
- `WKWebView` or native SwiftUI views
- `CoreLocation` for GPS coordinates

### 🗄️ Database (Production)
- Replace in-memory `users/closets/outfitLogs` objects with PostgreSQL or MongoDB
- Use `pg` or `mongoose` npm packages
- Store uploaded images in S3 or Cloudinary instead of local disk

### 🤖 AI Outfit Suggestions
- Pass closet items + weather into Claude API
- Claude can suggest combinations with reasoning
- Can analyze clothing photos via vision API
```
# Bring-An-Umbrella
