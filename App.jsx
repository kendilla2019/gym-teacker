import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Dumbbell, Scale, UtensilsCrossed, Plus, LogOut, Trophy, Trash2, Camera } from "lucide-react";

/* ---------- Supabase connection ---------- */
const SUPABASE_URL = "https://lljdjeztpwxreywyodda.supabase.co";
const SUPABASE_KEY = "sb_publishable_YIdyGcgt7mVF9r1KPu8n-g_L1yh3znV";

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.method === "POST" ? "return=representation" : undefined,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}): ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function uploadPhoto(file, username) {
  const fileName = `${username}/${Date.now()}-${file.name}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/progress-photos/${fileName}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": file.type,
    },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Photo upload failed (${res.status}): ${text}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/progress-photos/${fileName}`;
}

/* ---------- design tokens ----------
  bg      #121110  near-black, warm
  surface #1C1A17
  line    #2C2924
  text    #F2EFE9
  muted   #8A8680
  accent  #7C3AED  (loaded / active plate)
  khaki   #C4B5FD  (secondary data)
------------------------------------ */

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');`;

/* ---------------- Login ---------------- */

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setError("");
    const key = username.trim().toLowerCase();
    if (!key) {
      setError("Enter a username.");
      return;
    }
    onLogin(key);
  };

  return (
    <div style={styles.loginWrap}>
      <style>{FONT_IMPORT}</style>
      <div style={styles.loginPlates} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              ...styles.plate,
              width: 190 - i * 26,
              height: 190 - i * 26,
              opacity: 0.06 + i * 0.03,
            }}
          />
        ))}
      </div>

      <div style={styles.loginCard}>
        <div style={styles.loginEyebrow}>SYSTEM 01</div>
        <h1 style={styles.loginTitle}>LOAD IN</h1>
        <p style={styles.loginSub}>Track bodyweight, food, and machine loads in one place.</p>

        <form onSubmit={submit} style={{ marginTop: 28 }}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="kennedy"
          />
          {error && <div style={styles.errorText}>{error}</div>}

          <button type="submit" style={styles.primaryBtn}>
            ENTER
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Weight stack signature element ---------------- */

function WeightStack({ current, max, unit = "kg" }) {
  const plates = 8;
  const pct = max > 0 ? Math.min(current / max, 1) : 0;
  const litCount = Math.round(pct * plates);

  return (
    <div style={styles.stackWrap}>
      <div style={styles.stackColumn}>
        {Array.from({ length: plates }).map((_, i) => {
          const idxFromTop = plates - 1 - i;
          const lit = idxFromTop < litCount;
          return (
            <div
              key={i}
              style={{
                ...styles.stackPlate,
                background: lit ? "#7C3AED" : "#2C2924",
                boxShadow: lit ? "0 0 0 1px rgba(255,90,54,0.4)" : "none",
              }}
            />
          );
        })}
      </div>
      <div style={styles.stackLabel}>
        <div style={styles.stackCurrent}>
          {current}
          <span style={styles.stackUnit}>{unit}</span>
        </div>
        <div style={styles.stackMax}>PR {max}{unit}</div>
      </div>
    </div>
  );
}

/* ---------------- Body (KG) tab ---------------- */

function BodyTab({ data, onAdd, onDelete }) {
  const [kg, setKg] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState("");

  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const chartData = sorted.map((d) => ({ date: d.date.slice(5), kg: d.kg }));
  const latest = sorted[sorted.length - 1];

  const submit = (e) => {
    e.preventDefault();
    const val = parseFloat(kg);
    if (!val || !date) {
      setFormError("Enter a weight in kg first.");
      return;
    }
    setFormError("");
    onAdd({ date, kg: val });
    setKg("");
  };

  return (
    <div>
      <div style={styles.heroRow}>
        <div>
          <div style={styles.heroLabel}>CURRENT</div>
          <div style={styles.heroNumber}>
            {latest ? latest.kg : "—"}
            <span style={styles.heroUnit}>kg</span>
          </div>
        </div>
        {chartData.length > 1 && (
          <div style={{ flex: 1, height: 100, minWidth: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="kg" stroke="#7C3AED" strokeWidth={2} dot={false} />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip contentStyle={styles.tooltip} labelStyle={{ color: "#8A8680" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <form onSubmit={submit} style={styles.inlineForm}>
        <input
          style={styles.inlineInput}
          type="number"
          step="0.1"
          placeholder="kg"
          value={kg}
          onChange={(e) => setKg(e.target.value)}
        />
        <input
          style={styles.inlineInput}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit" style={styles.addBtn}>
          <Plus size={16} /> LOG
        </button>
      </form>
      {formError && <div style={styles.formErrorText}>{formError}</div>}

      <div style={styles.logList}>
        {sorted
          .slice()
          .reverse()
          .map((d, i) => (
            <div key={d.id || i} style={styles.logRow}>
              <span style={styles.logDate}>{d.date}</span>
              <span style={styles.logValue}>{d.kg} kg</span>
              <button style={styles.deleteBtn} onClick={() => onDelete(d)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        {sorted.length === 0 && <div style={styles.emptyState}>No entries yet. Log today's weight above.</div>}
      </div>
    </div>
  );
}

/* ---------------- Foods tab ---------------- */

function FoodsTab({ data, onAdd, onDelete }) {
  const [text, setText] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({
      date,
      text: text.trim(),
      calories: calories ? parseFloat(calories) : null,
      protein: protein ? parseFloat(protein) : null,
      carbs: carbs ? parseFloat(carbs) : null,
      fat: fat ? parseFloat(fat) : null,
    });
    setText("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  };

  const grouped = sorted.reduce((acc, item) => {
    acc[item.date] = acc[item.date] || [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const dayTotal = (items) =>
    items.reduce((sum, i) => sum + (i.calories || 0), 0);

  return (
    <div>
      <form onSubmit={submit} style={styles.inlineForm}>
        <input
          style={{ ...styles.inlineInput, flex: 2, minWidth: "100%" }}
          placeholder="What did you eat?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          style={styles.inlineInput}
          type="number"
          placeholder="kcal"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <input
          style={styles.inlineInput}
          type="number"
          placeholder="protein g"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />
        <input
          style={styles.inlineInput}
          type="number"
          placeholder="carbs g"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />
        <input
          style={styles.inlineInput}
          type="number"
          placeholder="fat g"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
        />
        <input
          style={styles.inlineInput}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit" style={styles.addBtn}>
          <Plus size={16} /> LOG
        </button>
      </form>

      <div style={styles.logList}>
        {Object.keys(grouped).map((day) => (
          <div key={day} style={{ marginBottom: 18 }}>
            <div style={styles.dayHeader}>
              {day}
              {dayTotal(grouped[day]) > 0 && (
                <span style={styles.dayTotal}> · {dayTotal(grouped[day])} kcal</span>
              )}
            </div>
            {grouped[day].map((item, i) => (
              <div key={item.id || i} style={styles.logRow}>
                <div style={{ flex: 1 }}>
                  <div style={styles.logValue}>{item.text}</div>
                  {(item.calories || item.protein || item.carbs || item.fat) && (
                    <div style={styles.macroLine}>
                      {item.calories ? `${item.calories} kcal` : ""}
                      {item.protein ? ` · P${item.protein}g` : ""}
                      {item.carbs ? ` · C${item.carbs}g` : ""}
                      {item.fat ? ` · F${item.fat}g` : ""}
                    </div>
                  )}
                </div>
                <button style={styles.deleteBtn} onClick={() => onDelete(item)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ))}
        {sorted.length === 0 && <div style={styles.emptyState}>No meals logged yet.</div>}
      </div>
    </div>
  );
}

/* ---------------- Machines tab ---------------- */

function MachinesTab({ data, onAdd, onDelete }) {
  const exerciseNames = Object.keys(data);
  const [selected, setSelected] = useState(exerciseNames[0] || "");
  const [newExercise, setNewExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!selected && exerciseNames.length > 0) setSelected(exerciseNames[0]);
  }, [exerciseNames, selected]);

  const entries = (data[selected] || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const chartData = entries.map((e) => ({ date: e.date.slice(5), kg: e.kg }));
  const latest = entries[entries.length - 1];
  const max = entries.reduce((m, e) => Math.max(m, e.kg), 0);

  const submit = (e) => {
    e.preventDefault();
    const name = (selected || newExercise).trim();
    const val = parseFloat(weight);
    if (!name || !val) return;
    onAdd(name, { date, kg: val, reps: reps ? parseInt(reps, 10) : null });
    setWeight("");
    setReps("");
    setNewExercise("");
    setSelected(name);
  };

  return (
    <div>
      <div style={styles.exerciseTabs}>
        {exerciseNames.map((name) => (
          <button
            key={name}
            onClick={() => setSelected(name)}
            style={{
              ...styles.exerciseTab,
              ...(selected === name ? styles.exerciseTabActive : {}),
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {selected && entries.length > 0 && (
        <div style={styles.heroRow}>
          <WeightStack current={latest.kg} max={max} />
          {chartData.length > 1 && (
            <div style={{ flex: 1, height: 130, minWidth: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#2C2924" vertical={false} />
                  <Line type="monotone" dataKey="kg" stroke="#C4B5FD" strokeWidth={2} dot={{ r: 3 }} />
                  <XAxis dataKey="date" tick={{ fill: "#8A8680", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip contentStyle={styles.tooltip} labelStyle={{ color: "#8A8680" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <form onSubmit={submit} style={styles.inlineForm}>
        {exerciseNames.length === 0 || newExercise ? (
          <input
            style={{ ...styles.inlineInput, flex: 1.5 }}
            placeholder="Exercise / machine name"
            value={newExercise}
            onChange={(e) => {
              setNewExercise(e.target.value);
              setSelected("");
            }}
          />
        ) : (
          <select
            style={{ ...styles.inlineInput, flex: 1.5 }}
            value={selected}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                setSelected("");
                setNewExercise(" ");
                setTimeout(() => setNewExercise(""), 0);
              } else {
                setSelected(e.target.value);
              }
            }}
          >
            {exerciseNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="__new__">+ New exercise…</option>
          </select>
        )}
        <input
          style={styles.inlineInput}
          type="number"
          step="0.5"
          placeholder="kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <input
          style={{ ...styles.inlineInput, maxWidth: 70 }}
          type="number"
          placeholder="reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <input
          style={styles.inlineInput}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit" style={styles.addBtn}>
          <Plus size={16} /> LOG
        </button>
      </form>

      <div style={styles.logList}>
        {entries
          .slice()
          .reverse()
          .map((e, i) => (
            <div key={e.id || i} style={styles.logRow}>
              <span style={styles.logDate}>{e.date}</span>
              <span style={styles.logValue}>
                {e.kg} kg{e.reps ? ` × ${e.reps}` : ""}
                {e.kg === max && (
                  <Trophy size={13} style={{ marginLeft: 6, color: "#7C3AED", verticalAlign: "-2px" }} />
                )}
              </span>
              <button style={styles.deleteBtn} onClick={() => onDelete(selected, e)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        {entries.length === 0 && exerciseNames.length === 0 && (
          <div style={styles.emptyState}>Add your first machine above to start tracking.</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Photos tab ---------------- */

function PhotosTab({ data, onAdd, onDelete, uploading }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const fileInputRef = React.useRef(null);

  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onAdd(file, date);
    e.target.value = "";
  };

  return (
    <div>
      <div style={styles.inlineForm}>
        <input
          style={styles.inlineInput}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          type="button"
          style={styles.addBtn}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          disabled={uploading}
        >
          <Camera size={16} /> {uploading ? "UPLOADING…" : "ADD PHOTO"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          style={{ display: "none" }}
        />
      </div>

      <div style={styles.photoGrid}>
        {sorted.map((p, i) => (
          <div key={p.id || i} style={styles.photoCard}>
            <img src={p.url} alt={p.date} style={styles.photoImg} />
            <div style={styles.photoFooter}>
              <span style={styles.photoDate}>{p.date}</span>
              <button style={styles.deleteBtn} onClick={() => onDelete(p)}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div style={styles.emptyState}>No progress photos yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}

/* ---------------- App ---------------- */

export default function GymTrackerApp() {
  const [username, setUsername] = useState(null);
  const [body, setBody] = useState([]);
  const [foods, setFoods] = useState([]);
  const [machines, setMachines] = useState({});
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [tab, setTab] = useState("body");
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadAll = useCallback(async (user) => {
    setLoading(true);
    setSaveError("");
    try {
      const [bodyRows, foodRows, machineRows, photoRows] = await Promise.all([
        sb(`body_logs?username=eq.${encodeURIComponent(user)}&order=date.asc`),
        sb(`food_logs?username=eq.${encodeURIComponent(user)}&order=date.desc`),
        sb(`machine_logs?username=eq.${encodeURIComponent(user)}&order=date.asc`),
        sb(`progress_photos?username=eq.${encodeURIComponent(user)}&order=date.desc`),
      ]);
      setBody(bodyRows.map((r) => ({ id: r.id, date: r.date, kg: r.kg })));
      setFoods(
        foodRows.map((r) => ({
          id: r.id,
          date: r.date,
          text: r.food_text,
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
        }))
      );
      const grouped = {};
      machineRows.forEach((r) => {
        grouped[r.exercise] = grouped[r.exercise] || [];
        grouped[r.exercise].push({ id: r.id, date: r.date, kg: r.kg, reps: r.reps });
      });
      setMachines(grouped);
      setPhotos(photoRows.map((r) => ({ id: r.id, date: r.date, url: r.photo_url })));
    } catch (err) {
      setSaveError("Couldn't load data: " + err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (username) loadAll(username);
  }, [username, loadAll]);

  const addBody = async (entry) => {
    try {
      await sb("body_logs", {
        method: "POST",
        body: JSON.stringify({ username, date: entry.date, kg: entry.kg }),
      });
      setSaveError("");
      loadAll(username);
    } catch (err) {
      setSaveError("Didn't save: " + err.message);
    }
  };

  const deleteBody = async (entry) => {
    try {
      await sb(`body_logs?id=eq.${entry.id}`, { method: "DELETE" });
      loadAll(username);
    } catch (err) {
      setSaveError("Didn't delete: " + err.message);
    }
  };

  const addFood = async (entry) => {
    try {
      await sb("food_logs", {
        method: "POST",
        body: JSON.stringify({
          username,
          date: entry.date,
          food_text: entry.text,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
        }),
      });
      setSaveError("");
      loadAll(username);
    } catch (err) {
      setSaveError("Didn't save: " + err.message);
    }
  };

  const deleteFood = async (entry) => {
    try {
      await sb(`food_logs?id=eq.${entry.id}`, { method: "DELETE" });
      loadAll(username);
    } catch (err) {
      setSaveError("Didn't delete: " + err.message);
    }
  };

  const addPhoto = async (file, date) => {
    setUploadingPhoto(true);
    try {
      const url = await uploadPhoto(file, username);
      await sb("progress_photos", {
        method: "POST",
        body: JSON.stringify({ username, date, photo_url: url }),
      });
      setSaveError("");
      loadAll(username);
    } catch (err) {
      setSaveError("Didn't upload: " + err.message);
    }
    setUploadingPhoto(false);
  };

  const deletePhoto = async (photo) => {
    try {
      await sb(`progress_photos?id=eq.${photo.id}`, { method: "DELETE" });
      loadAll(username);
    } catch (err) {
      setSaveError("Didn't delete: " + err.message);
    }
  };

  const addMachine = async (name, entry) => {
    try {
      await sb("machine_logs", {
        method: "POST",
        body: JSON.stringify({
          username,
          exercise: name,
          date: entry.date,
          kg: entry.kg,
          reps: entry.reps,
        }),
      });
      setSaveError("");
      loadAll(username);
    } catch (err) {
      setSaveError("Didn't save: " + err.message);
    }
  };

  const deleteMachine = async (name, entry) => {
    try {
      await sb(`machine_logs?id=eq.${entry.id}`, { method: "DELETE" });
      loadAll(username);
    } catch (err) {
      setSaveError("Didn't delete: " + err.message);
    }
  };

  if (!username) return <LoginScreen onLogin={setUsername} />;

  const tabs = [
    { id: "body", label: "BODY", icon: Scale },
    { id: "foods", label: "FOODS", icon: UtensilsCrossed },
    { id: "machines", label: "MACHINES", icon: Dumbbell },
    { id: "photos", label: "PHOTOS", icon: Camera },
  ];

  return (
    <div style={styles.app}>
      <style>{FONT_IMPORT}</style>
      <header style={styles.header}>
        <div>
          <div style={styles.headerEyebrow}>LOGGED IN AS</div>
          <div style={styles.headerUser}>{username}</div>
        </div>
        <button style={styles.logoutBtn} onClick={() => setUsername(null)}>
          <LogOut size={15} /> LOG OUT
        </button>
      </header>

      {saveError && <div style={styles.saveErrorBanner}>{saveError}</div>}

      <nav style={styles.nav}>
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ ...styles.navBtn, ...(tab === t.id ? styles.navBtnActive : {}) }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </nav>

      <main style={styles.main}>
        {loading ? (
          <div style={styles.emptyState}>Loading…</div>
        ) : tab === "body" ? (
          <BodyTab data={body} onAdd={addBody} onDelete={deleteBody} />
        ) : tab === "foods" ? (
          <FoodsTab data={foods} onAdd={addFood} onDelete={deleteFood} />
        ) : tab === "machines" ? (
          <MachinesTab data={machines} onAdd={addMachine} onDelete={deleteMachine} />
        ) : (
          <PhotosTab data={photos} onAdd={addPhoto} onDelete={deletePhoto} uploading={uploadingPhoto} />
        )}
      </main>
    </div>
  );
}

/* ---------------- styles ---------------- */

const styles = {
  app: {
    minHeight: "100vh",
    background: "#121110",
    color: "#F2EFE9",
    fontFamily: "'Inter', sans-serif",
    padding: "20px 16px 60px",
    maxWidth: 560,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerEyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#8A8680",
  },
  headerUser: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 20,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "1px solid #2C2924",
    color: "#8A8680",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: 1,
    padding: "8px 12px",
    borderRadius: 4,
    cursor: "pointer",
  },
  nav: {
    display: "flex",
    gap: 4,
    marginBottom: 24,
    borderBottom: "1px solid #2C2924",
  },
  navBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#8A8680",
    fontFamily: "'Oswald', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 1,
    padding: "10px 14px",
    cursor: "pointer",
  },
  navBtnActive: {
    color: "#F2EFE9",
    borderBottom: "2px solid #7C3AED",
  },
  main: {},
  saveErrorBanner: {
    background: "rgba(255,90,54,0.1)",
    border: "1px solid #7C3AED",
    borderRadius: 6,
    color: "#7C3AED",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    padding: "10px 12px",
    marginBottom: 16,
  },
  formErrorText: {
    color: "#7C3AED",
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    marginTop: -10,
    marginBottom: 16,
  },
  heroRow: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    background: "#1C1A17",
    border: "1px solid #2C2924",
    borderRadius: 10,
    padding: 18,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  heroLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#8A8680",
  },
  heroNumber: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 44,
    fontWeight: 700,
    color: "#F2EFE9",
    lineHeight: 1.1,
  },
  heroUnit: {
    fontSize: 18,
    color: "#8A8680",
    marginLeft: 4,
  },
  tooltip: {
    background: "#1C1A17",
    border: "1px solid #2C2924",
    borderRadius: 6,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: "#F2EFE9",
  },
  inlineForm: {
    display: "flex",
    gap: 8,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  inlineInput: {
    flex: 1,
    minWidth: 90,
    background: "#1C1A17",
    border: "1px solid #2C2924",
    borderRadius: 6,
    color: "#F2EFE9",
    padding: "10px 12px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    outline: "none",
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#7C3AED",
    border: "none",
    borderRadius: 6,
    color: "#121110",
    fontFamily: "'Oswald', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: 0.5,
    padding: "10px 16px",
    cursor: "pointer",
  },
  logList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  logRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#1C1A17",
    border: "1px solid #2C2924",
    borderRadius: 6,
    padding: "10px 12px",
  },
  logDate: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#8A8680",
    minWidth: 78,
  },
  logValue: {
    flex: 1,
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "#8A8680",
    cursor: "pointer",
    padding: 4,
  },
  dayHeader: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: 1,
    color: "#C4B5FD",
    marginBottom: 6,
  },
  dayTotal: {
    color: "#8A8680",
    fontWeight: 400,
  },
  macroLine: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#8A8680",
    marginTop: 2,
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  photoCard: {
    background: "#1C1A17",
    border: "1px solid #2C2924",
    borderRadius: 8,
    overflow: "hidden",
  },
  photoImg: {
    width: "100%",
    height: 160,
    objectFit: "cover",
    display: "block",
  },
  photoFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
  },
  photoDate: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    color: "#8A8680",
  },
  emptyState: {
    color: "#8A8680",
    fontSize: 13,
    padding: "24px 4px",
    fontFamily: "'Inter', sans-serif",
  },
  exerciseTabs: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  exerciseTab: {
    background: "#1C1A17",
    border: "1px solid #2C2924",
    borderRadius: 20,
    color: "#8A8680",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: 0.5,
    padding: "6px 14px",
    cursor: "pointer",
  },
  exerciseTabActive: {
    color: "#121110",
    background: "#C4B5FD",
    borderColor: "#C4B5FD",
  },
  stackWrap: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  stackColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  stackPlate: {
    width: 46,
    height: 8,
    borderRadius: 2,
  },
  stackLabel: {
    display: "flex",
    flexDirection: "column",
  },
  stackCurrent: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 30,
    fontWeight: 700,
  },
  stackUnit: {
    fontSize: 14,
    color: "#8A8680",
    marginLeft: 3,
  },
  stackMax: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: "#7C3AED",
    marginTop: 2,
  },
  /* login */
  loginWrap: {
    minHeight: "100vh",
    background: "#121110",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: 20,
  },
  loginPlates: {
    position: "absolute",
    right: -60,
    top: "50%",
    transform: "translateY(-50%)",
  },
  plate: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translate(0,-50%)",
    borderRadius: "50%",
    border: "10px solid #7C3AED",
  },
  loginCard: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 380,
    background: "#1C1A17",
    border: "1px solid #2C2924",
    borderRadius: 12,
    padding: "32px 28px",
  },
  loginEyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: 2,
    color: "#7C3AED",
  },
  loginTitle: {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 40,
    fontWeight: 700,
    letterSpacing: 1,
    color: "#F2EFE9",
    margin: "4px 0 8px",
  },
  loginSub: {
    color: "#8A8680",
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
  },
  label: {
    display: "block",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: 1,
    color: "#8A8680",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: "#121110",
    border: "1px solid #2C2924",
    borderRadius: 6,
    color: "#F2EFE9",
    padding: "12px 14px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    outline: "none",
  },
  errorText: {
    color: "#7C3AED",
    fontSize: 12,
    marginTop: 10,
    fontFamily: "'JetBrains Mono', monospace",
  },
  primaryBtn: {
    width: "100%",
    background: "#7C3AED",
    border: "none",
    borderRadius: 6,
    color: "#121110",
    fontFamily: "'Oswald', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: 1,
    padding: "13px 0",
    marginTop: 20,
    cursor: "pointer",
  },
};
