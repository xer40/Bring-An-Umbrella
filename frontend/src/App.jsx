import { useState, useEffect } from "react";

const API = "http://localhost:3000/api";

// ─── Mock user for demo (replace with real Google Sign-In) ──────────────────
const DEMO_USER = {
  id: "demo_user_001",
  name: "Bingus",
  email: "alex@example.com",
  picture: null
};
3001
// ─── Clothing type icons ────────────────────────────────────────────────────
const TYPE_ICONS = {
  top: "👕", bottom: "👖", jacket: "🧥", shoes: "👟", accessory: "🧣"
};

const WARMTH_COLORS = {
  light: "#FFD166", medium: "#06D6A0", heavy: "#118AB2"
};

// ─── Components ─────────────────────────────────────────────────────────────

function WeatherCard({ weather, loading }) {
  if (loading) return (
    <div className="weather-card loading">
      <div className="pulse">Fetching weather...</div>
    </div>
  );
  if (!weather) return null;

  return (
    <div className={`weather-card ${weather.rainAlert ? 'rain-alert' : ''}`}>
      {weather.rainAlert && (
        <div className="rain-banner">☂️ Rain likely ({weather.precipitationChance}%) — bring an umbrella!</div>
      )}
      <div className="weather-main">
        <div className="temp">{weather.temperature}°F</div>
        <div className="condition">{weather.condition}</div>
      </div>
      <div className="weather-details">
        <span>Feels like {weather.feelsLike}°F</span>
        <span>💧 {weather.humidity}%</span>
        <span>💨 {weather.windSpeed} mph</span>
        <span>🌧 {weather.precipitationChance}% rain</span>
      </div>
    </div>
  );
}

function OutfitSuggestion({ suggestion, loading }) {
  if (loading) return <div className="suggestion-card loading"><div className="pulse">Styling your outfit...</div></div>;
  if (!suggestion) return (
    <div className="suggestion-card empty">
      <div className="empty-icon">🪣</div>
      <p>Add clothes to your closet to get outfit suggestions!</p>
    </div>
  );

  const { outfit, tips } = suggestion;
  const pieces = Object.entries(outfit).filter(([, v]) => v);

  return (
    <div className="suggestion-card">
      <h2 className="section-title">Today's Outfit</h2>
      {tips.length > 0 && (
        <div className="tips">
          {tips.map((tip, i) => <div key={i} className="tip">{tip}</div>)}
        </div>
      )}
      <div className="outfit-pieces">
        {pieces.map(([slot, item]) => (
          <div key={slot} className="outfit-piece">
            {item.imageUrl
              ? <img src={`http://localhost:3000${item.imageUrl}`} alt={item.name} className="piece-img" />
              : <div className="piece-icon">{TYPE_ICONS[item.type] || "👔"}</div>
            }
            <div className="piece-info">
              <div className="piece-name">{item.name}</div>
              <div className="piece-type">{slot}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClosetView({ googleId, closet, onRefresh }) {
  const [form, setForm] = useState({ name: "", type: "top", color: "", warmth: "medium", tags: "" });
  const [image, setImage] = useState(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async () => {
    if (!form.name) return;
    setAdding(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append("image", image);

    await fetch(`${API}/closet/${googleId}`, { method: "POST", body: fd });
    setForm({ name: "", type: "top", color: "", warmth: "medium", tags: "" });
    setImage(null);
    setAdding(false);
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (itemId) => {
    await fetch(`${API}/closet/${googleId}/${itemId}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="closet-view">
      <div className="section-header">
        <h2 className="section-title">My Closet</h2>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Cancel" : "+ Add Item"}
        </button>
      </div>

      {showForm && (
        <div className="add-form">
          <input className="input" placeholder="Item name (e.g. Blue Denim Jacket)"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="form-row">
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
            </select>
            <select className="input" value={form.warmth} onChange={e => setForm({ ...form, warmth: e.target.value })}>
              <option value="light">Light</option>
              <option value="medium">Medium</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <input className="input" placeholder="Color (optional)"
            value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          <input className="input" placeholder="Tags: rain, formal, casual (comma-separated)"
            value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
          <label className="file-label">
            📷 {image ? image.name : "Upload photo (optional)"}
            <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} style={{ display: "none" }} />
          </label>
          <button className="btn-primary" onClick={handleAdd} disabled={adding}>
            {adding ? "Adding..." : "Add to Closet"}
          </button>
        </div>
      )}

      {closet.length === 0 && !showForm && (
        <div className="closet-empty">
          <div style={{ fontSize: "3rem" }}>🪣</div>
          <p>Your closet is empty. Add your first item!</p>
        </div>
      )}

      <div className="closet-grid">
        {closet.map(item => (
          <div key={item.id} className="closet-item">
            <button className="delete-btn" onClick={() => handleDelete(item.id)}>✕</button>
            {item.imageUrl
              ? <img src={`http://localhost:3000${item.imageUrl}`} alt={item.name} className="closet-img" />
              : <div className="closet-icon">{TYPE_ICONS[item.type] || "👔"}</div>
            }
            <div className="item-name">{item.name}</div>
            <div className="item-meta">
              <span className="tag">{item.type}</span>
              <span className="tag warmth" style={{ background: WARMTH_COLORS[item.warmth] }}>{item.warmth}</span>
            </div>
            {item.color && <div className="item-color">🎨 {item.color}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [user] = useState(DEMO_USER);
  const [tab, setTab] = useState("home");
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [closet, setCloset] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // Register user on load
  useEffect(() => {
    fetch(`${API}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleId: user.id, name: user.name, email: user.email, picture: user.picture })
    });
  }, []);

  // Reverse geocode coords → city name
  const fetchCityName = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Your Location";
      const state = data.address?.state_code || data.address?.state || "";
      setLocation(state ? `${city}, ${state}` : city);
    } catch {
      setLocation("Your Location");
    }
  };

  // Fetch weather on load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        const res = await fetch(`${API}/weather?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        setWeather(data);
        setWeatherLoading(false);
        fetchCityName(lat, lon);
      },
      async () => {
        // Fallback: use Los Angeles coords
        const res = await fetch(`${API}/weather?lat=34.05&lon=-118.24`);
        const data = await res.json();
        setWeather(data);
        setWeatherLoading(false);
        fetchCityName(34.05, -118.24);
      }
    );
  }, []);

  // Fetch closet
  const fetchCloset = async () => {
    const res = await fetch(`${API}/closet/${user.id}`);
    const data = await res.json();
    setCloset(data.items || []);
  };

  useEffect(() => { fetchCloset(); }, []);

  // Get outfit suggestion when weather + closet ready
  useEffect(() => {
    if (!weather || closet.length === 0) return;
    setSuggestionLoading(true);
    fetch(`${API}/outfits/suggest/${user.id}?condition=${weather.condition}&temp=${weather.temperature}&precipChance=${weather.precipitationChance}`)
      .then(r => r.json())
      .then(d => { setSuggestion(d.suggestion); setSuggestionLoading(false); });
  }, [weather, closet]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --bg: #0a0f1e;
          --surface: #111827;
          --surface2: #1a2236;
          --border: rgba(255,255,255,0.07);
          --text: #f0f4ff;
          --muted: #8896aa;
          --accent: #7dd3fc;
          --accent2: #38bdf8;
          --rain: #3b82f6;
          --danger: #f87171;
          --success: #34d399;
          --warning: #fbbf24;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        .app {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }

        /* Header */
        .header {
          padding: 24px 20px 16px;
          background: linear-gradient(180deg, rgba(125,211,252,0.06) 0%, transparent 100%);
          border-bottom: 1px solid var(--border);
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .app-name {
          font-family: 'Playfair Display', serif;
          font-size: 1.6rem;
          color: var(--accent);
          letter-spacing: -0.5px;
        }

        .app-name em {
          font-style: italic;
          color: var(--text);
        }

        .user-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--rain));
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 0.9rem;
          color: var(--bg);
        }

        .date-line {
          font-size: 0.8rem;
          color: var(--muted);
          letter-spacing: 0.5px;
        }

        .location-line {
          color: var(--accent);
          font-weight: 500;
        }

        /* Nav */
        .nav {
          display: flex;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }

        .nav-btn {
          flex: 1;
          padding: 14px 0;
          background: none;
          border: none;
          color: var(--muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          transition: color 0.2s;
          border-bottom: 2px solid transparent;
        }

        .nav-btn.active {
          color: var(--accent);
          border-bottom: 2px solid var(--accent);
        }

        .nav-icon { font-size: 1.2rem; }

        /* Content */
        .content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        /* Weather Card */
        .weather-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.3s;
        }

        .weather-card.rain-alert {
          border-color: rgba(59,130,246,0.4);
          background: linear-gradient(135deg, var(--surface) 0%, rgba(59,130,246,0.08) 100%);
        }

        .rain-banner {
          background: rgba(59,130,246,0.15);
          border: 1px solid rgba(59,130,246,0.3);
          color: #93c5fd;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 16px;
          animation: pulseGlow 2s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
          50% { box-shadow: 0 0 16px 2px rgba(59,130,246,0.2); }
        }

        .weather-main {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 12px;
        }

        .temp {
          font-family: 'Playfair Display', serif;
          font-size: 3.5rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1;
        }

        .condition {
          font-size: 1.1rem;
          color: var(--muted);
        }

        .weather-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .weather-details span {
          font-size: 0.8rem;
          color: var(--muted);
          background: var(--surface2);
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid var(--border);
        }

        /* Suggestion Card */
        .suggestion-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .suggestion-card.empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--muted);
        }

        .empty-icon { font-size: 2.5rem; margin-bottom: 10px; }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.3rem;
          margin-bottom: 14px;
          color: var(--text);
        }

        .tips { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }

        .tip {
          font-size: 0.85rem;
          background: rgba(251,191,36,0.1);
          border: 1px solid rgba(251,191,36,0.2);
          color: #fcd34d;
          padding: 8px 12px;
          border-radius: 10px;
        }

        .outfit-pieces {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .outfit-piece {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px 14px;
        }

        .piece-img {
          width: 52px; height: 52px;
          border-radius: 10px;
          object-fit: cover;
        }

        .piece-icon {
          width: 52px; height: 52px;
          border-radius: 10px;
          background: var(--surface);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem;
        }

        .piece-name {
          font-weight: 500;
          font-size: 0.95rem;
        }

        .piece-type {
          font-size: 0.75rem;
          color: var(--muted);
          text-transform: capitalize;
          margin-top: 2px;
        }

        /* Closet */
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .btn-add {
          background: rgba(125,211,252,0.1);
          border: 1px solid rgba(125,211,252,0.3);
          color: var(--accent);
          padding: 8px 14px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add:hover { background: rgba(125,211,252,0.18); }

        .add-form {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .input {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 10px 14px;
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }

        .input:focus { border-color: rgba(125,211,252,0.4); }

        .form-row { display: flex; gap: 8px; }
        .form-row .input { flex: 1; }

        .file-label {
          background: var(--surface2);
          border: 1px dashed var(--border);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.85rem;
          color: var(--muted);
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .file-label:hover { border-color: var(--accent); color: var(--accent); }

        .btn-primary {
          background: linear-gradient(135deg, var(--accent2), var(--rain));
          color: #0a0f1e;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .btn-primary:hover { opacity: 0.88; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .closet-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--muted);
        }

        .closet-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .closet-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 12px;
          position: relative;
          transition: border-color 0.2s;
        }

        .closet-item:hover { border-color: rgba(125,211,252,0.2); }

        .delete-btn {
          position: absolute;
          top: 8px; right: 8px;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: rgba(248,113,113,0.15);
          border: 1px solid rgba(248,113,113,0.2);
          color: var(--danger);
          font-size: 0.65rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }

        .delete-btn:hover { background: rgba(248,113,113,0.3); }

        .closet-img {
          width: 100%; aspect-ratio: 1;
          border-radius: 10px;
          object-fit: cover;
          margin-bottom: 8px;
        }

        .closet-icon {
          width: 100%; aspect-ratio: 1;
          border-radius: 10px;
          background: var(--surface2);
          display: flex; align-items: center; justify-content: center;
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        .item-name {
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-meta { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }

        .tag {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 20px;
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--muted);
          text-transform: capitalize;
        }

        .tag.warmth { color: var(--bg); border: none; font-weight: 600; }

        .item-color { font-size: 0.75rem; color: var(--muted); }

        /* Loading */
        .loading { color: var(--muted); text-align: center; padding: 30px; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .pulse { animation: pulse 1.5s ease-in-out infinite; }
      `}</style>

      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-top">
            <div className="app-name">bring <em>an</em> umbrella</div>
            <div className="user-avatar">{user.name[0]}</div>
          </div>
          <div className="date-line">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {location && <span className="location-line"> · 📍 {location}</span>}
          </div>
        </div>

        {/* Nav */}
        <nav className="nav">
          {[
            { id: "home", icon: "🌤", label: "Today" },
            { id: "closet", icon: "👗", label: "Closet" },
          ].map(t => (
            <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="content">
          {tab === "home" && (
            <>
              <WeatherCard weather={weather} loading={weatherLoading} />
              <OutfitSuggestion suggestion={suggestion} loading={suggestionLoading} />
            </>
          )}
          {tab === "closet" && (
            <ClosetView googleId={user.id} closet={closet} onRefresh={fetchCloset} />
          )}
        </div>
      </div>
    </>
  );
}
