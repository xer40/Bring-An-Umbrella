import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

let users = {};
let closets = {};
let outfitLogs = {};

// ─── File Upload Setup ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Auth ────────────────────────────────────────────────────────────────────
app.post('/api/auth/google', (req, res) => {
  const { googleId, name, email, picture } = req.body;
  if (!googleId) return res.status(400).json({ error: 'googleId is required' });
  if (!users[googleId]) {
    users[googleId] = { id: googleId, name, email, picture, createdAt: new Date() };
    closets[googleId] = [];
    outfitLogs[googleId] = [];
  }
  res.json({ user: users[googleId] });
});

app.get('/api/auth/user/:googleId', (req, res) => {
  const user = users[req.params.googleId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ─── Weather ─────────────────────────────────────────────────────────────────
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation_probability,weathercode,windspeed_10m,relative_humidity_2m&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch`;
    const response = await fetch(url);
    const data = await response.json();
    const current = data.current;
    const condition = interpretWeatherCode(current.weathercode);
    res.json({
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      precipitationChance: current.precipitation_probability,
      windSpeed: Math.round(current.windspeed_10m),
      humidity: current.relative_humidity_2m,
      condition,
      rainAlert: current.precipitation_probability >= 40,
      unit: 'F'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

function interpretWeatherCode(code) {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  if (code <= 82) return 'Showers';
  if (code <= 99) return 'Stormy';
  return 'Unknown';
}

// ─── Closet ──────────────────────────────────────────────────────────────────
app.get('/api/closet/:googleId', (req, res) => {
  const items = closets[req.params.googleId];
  if (!items) return res.status(404).json({ error: 'User not found' });
  res.json({ items });
});

app.post('/api/closet/:googleId', upload.single('image'), (req, res) => {
  const { googleId } = req.params;
  if (!closets[googleId]) return res.status(404).json({ error: 'User not found' });
  const { name, type, color, warmth, tags } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type are required' });
  const item = {
    id: `item_${Date.now()}`,
    name, type,
    color: color || '',
    warmth: warmth || 'medium',
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
    addedAt: new Date()
  };
  closets[googleId].push(item);
  res.status(201).json({ item });
});

app.delete('/api/closet/:googleId/:itemId', (req, res) => {
  const { googleId, itemId } = req.params;
  if (!closets[googleId]) return res.status(404).json({ error: 'User not found' });
  closets[googleId] = closets[googleId].filter(i => i.id !== itemId);
  res.json({ success: true });
});

// ─── Outfit Suggestions ───────────────────────────────────────────────────────
app.get('/api/outfits/suggest/:googleId', (req, res) => {
  const { googleId } = req.params;
  const { condition, temp, precipChance } = req.query;
  const items = closets[googleId];
  if (!items) return res.status(404).json({ error: 'User not found' });
  if (items.length === 0) return res.json({ suggestion: null, message: 'Add some clothes to your closet first!' });
  const suggestion = suggestOutfit(items, condition, parseInt(temp) || 65, parseInt(precipChance) || 0);
  res.json({ suggestion });
});

function suggestOutfit(items, condition, temp, precipChance) {
  const byType = (type) => items.filter(i => i.type === type);
  let warmthNeeded = temp < 45 ? 'heavy' : temp < 65 ? 'medium' : 'light';
  const pick = (arr, prefer) => arr.find(i => i.warmth === prefer) || arr[Math.floor(Math.random() * arr.length)] || null;
  const accessories = byType('accessory');
  const outfit = {
    top: pick(byType('top'), warmthNeeded),
    bottom: pick(byType('bottom'), warmthNeeded),
    jacket: temp < 65 ? pick(byType('jacket'), warmthNeeded) : null,
    shoes: pick(byType('shoes'), warmthNeeded),
    accessory: precipChance >= 40
      ? accessories.find(i => i.tags.includes('umbrella') || i.name.toLowerCase().includes('umbrella')) || pick(accessories, warmthNeeded)
      : pick(accessories, warmthNeeded),
  };
  const tips = [];
  if (precipChance >= 40) tips.push("☂️ Rain is likely — grab an umbrella!");
  if (temp < 32) tips.push("🥶 Below freezing — layer up!");
  if (condition === 'Stormy') tips.push("⛈️ Storm incoming — waterproof layers recommended.");
  if (temp > 85) tips.push("☀️ It's hot out — light fabrics only.");
  return { outfit, tips, conditions: { temp, condition, precipChance } };
}

// ─── Outfit Logs ──────────────────────────────────────────────────────────────
app.get('/api/logs/:googleId', (req, res) => {
  const logs = outfitLogs[req.params.googleId];
  if (!logs) return res.status(404).json({ error: 'User not found' });
  res.json({ logs });
});

app.post('/api/logs/:googleId', (req, res) => {
  const { googleId } = req.params;
  if (!outfitLogs[googleId]) return res.status(404).json({ error: 'User not found' });
  const { items, weather, notes } = req.body;
  const log = { id: `log_${Date.now()}`, date: new Date(), items: items || [], weather: weather || {}, notes: notes || '' };
  outfitLogs[googleId].push(log);
  res.status(201).json({ log });
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Bring an Umbrella' }));

app.listen(PORT, () => {
  console.log(`☂️  Bring an Umbrella backend running on http://localhost:${PORT}`);
});
