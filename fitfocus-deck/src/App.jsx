import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

// ── DATA (real, from FitFocus_Sales_Tracker_SOC_latest.xlsx, through 2 Jul 2026) ──
const SELL_RATE_TREND = [
  { session: "1",  rate: 58  },
  { session: "2",  rate: 90  },
  { session: "3",  rate: 69  },
  { session: "4",  rate: 78  },
  { session: "5",  rate: 89  },
  { session: "6",  rate: 100 },
  { session: "7",  rate: 100 },
  { session: "8",  rate: 64  },
  { session: "9",  rate: 44  },
  { session: "10", rate: 63  },
  { session: "11", rate: 45  },
  { session: "12", rate: 86  },
  { session: "13", rate: 79  },
];

const FLAVOR_DATA = [
  { name: "Mixed Berry",  rate: 75 },
  { name: "Choco Forest", rate: 75 },
  { name: "Pink Banana",  rate: 68 },
  { name: "Milky Dew",    rate: 65 },
];

// Consignment economics — gym buys at Rp 25.000, sells at Rp 30.000, keeps Rp 5.000/bottle.
// Gym only pays for bottles actually sold; unsold stock is picked up at no cost.
const ECONOMICS = {
  buyPrice: 25000,
  sellPrice: 30000,
  profitPerBottle: 5000,
  avgBottlesPerSession: 5,
};

const AVG_RATE = Math.round(SELL_RATE_TREND.reduce((a, b) => a + b.rate, 0) / SELL_RATE_TREND.length);

// Market data — sourced, see footnotes on slide 3.
const MARKET_STATS = [
  { value: "12.6%", label: "CAGR suplemen protein & asam amino", sub: "Indonesia, 2026–2033" },
  { value: "14–17%", label: "CAGR minuman protein RTD / fungsional", sub: "Indonesia, 2026–2035" },
  { value: "15–20%", label: "Pertumbuhan member gym urban per tahun", sub: "sejak 2022" },
];

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const T = {
  paper:   "#FFFFFF",
  paperD:  "#FAFAFA",
  line:    "#E8E6E1",
  ink:     "#151515",
  ink70:   "#5C5C5C",
  ink40:   "#9B9B96",
  pink:    "#C855F7",
  pinkD:   "#9D3FD4",
  pinkTint:"#FBEFFE",
  sage:    "#5F8F6B",
};

const DISPLAY_FONT = "'Archivo Black', 'Arial Narrow', 'Helvetica Neue', sans-serif";
const BODY_FONT = "'Inter', -apple-system, 'Segoe UI', sans-serif";
const MONO_FONT = "'IBM Plex Mono', ui-monospace, 'SF Mono', monospace";


const SLIDES = [
  "Cover", "Opportunity", "Why Protein", "Why FitFocus", "Results",
  "Zero Risk Model", "Why Gyms Like Us", "Operating System",
  "Partners", "Roadmap", "Founding Partner", "Contact",
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const Eyebrow = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
    <div style={{ width: 18, height: 2, background: T.pink }} />
    <span style={{ fontFamily: MONO_FONT, fontSize: 11, color: T.pinkD,
      letterSpacing: 2, fontWeight: 600, textTransform: "uppercase" }}>{children}</span>
  </div>
);

const H1 = ({ children }) => (
  <div style={{ fontFamily: DISPLAY_FONT, fontSize: 32, color: T.ink, lineHeight: 1.15,
    letterSpacing: "-0.5px", marginBottom: 14, textTransform: "uppercase" }}>
    {children}
  </div>
);

const Lead = ({ children, width = 400 }) => (
  <p style={{ fontFamily: BODY_FONT, fontSize: 14, color: T.ink70, lineHeight: 1.7,
    maxWidth: width, marginBottom: 28 }}>
    {children}
  </p>
);

const LabelPanel = ({ title, rows, footnote }) => (
  <div style={{ border: `1.5px solid ${T.ink}`, background: T.paper }}>
    {title && (
      <div style={{ padding: "10px 16px", borderBottom: `6px solid ${T.ink}` }}>
        <span style={{ fontFamily: DISPLAY_FONT, fontSize: 15, color: T.ink,
          textTransform: "uppercase", letterSpacing: "-0.3px" }}>{title}</span>
      </div>
    )}
    {rows.map((r, i) => (
      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
        padding: "10px 16px", borderBottom: i < rows.length - 1 ? `1px solid ${T.line}` : "none" }}>
        <div>
          <span style={{ fontFamily: BODY_FONT, fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{r.label}</span>
          {r.sub && <div style={{ fontFamily: BODY_FONT, fontSize: 10.5, color: T.ink40, marginTop: 2 }}>{r.sub}</div>}
        </div>
        <span style={{ fontFamily: MONO_FONT, fontSize: r.big ? 18 : 14, color: r.accent || T.pinkD,
          fontWeight: 600, flexShrink: 0, marginLeft: 12 }}>{r.value}</span>
      </div>
    ))}
    {footnote && (
      <div style={{ padding: "8px 16px", fontFamily: BODY_FONT, fontSize: 9.5, color: T.ink40, lineHeight: 1.5,
        background: T.paperD }}>
        {footnote}
      </div>
    )}
  </div>
);

const StatCell = ({ value, unit, label, accent = T.pink }) => (
  <div style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
      <span style={{ fontFamily: MONO_FONT, fontSize: 28, color: T.ink, fontWeight: 600, letterSpacing: "-0.5px" }}>{value}</span>
      {unit && <span style={{ fontFamily: MONO_FONT, fontSize: 13, color: accent, fontWeight: 600 }}>{unit}</span>}
    </div>
    <div style={{ fontFamily: BODY_FONT, fontSize: 10, color: T.ink40, marginTop: 4,
      letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
  </div>
);

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.ink, border: `1px solid ${T.ink}`, padding: "8px 12px" }}>
      <p style={{ margin: "0 0 4px", fontFamily: BODY_FONT, fontSize: 11, color: "#ccc" }}>Session {label}</p>
      <p style={{ margin: 0, fontFamily: MONO_FONT, fontSize: 13, color: T.pink, fontWeight: 600 }}>{payload[0].value}% sold</p>
    </div>
  );
};

const fmtRp = (n) => `Rp ${n.toLocaleString("id-ID")}`;

const Wordmark = ({ size = 34 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="0.75" y="0.75" width="38.5" height="38.5" stroke={T.ink} strokeWidth="1.5" />
      <path d="M18 9 L13 22 L18 20.5 L15 32 L26 17 L20 18.5 L24 9 Z" fill={T.pink} />
    </svg>
    <span style={{ fontFamily: DISPLAY_FONT, fontSize: size * 0.5, color: T.ink, letterSpacing: "-0.5px" }}>
      FITFOCUS
    </span>
  </div>
);

// Step in a vertical process flow (used in Operating System + Roadmap)
const FlowStep = ({ label, sub, isLast }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ border: `1.5px solid ${T.ink}`, padding: "10px 22px", background: T.paper, textAlign: "center" }}>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 13, color: T.ink, letterSpacing: "-0.2px", textTransform: "uppercase" }}>{label}</div>
      {sub && <div style={{ fontFamily: BODY_FONT, fontSize: 10, color: T.ink40, marginTop: 2 }}>{sub}</div>}
    </div>
    {!isLast && (
      <div style={{ height: 22, width: 1.5, background: T.line, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: T.pink, fontFamily: MONO_FONT, fontSize: 12, marginTop: 10 }}>↓</span>
      </div>
    )}
  </div>
);

// ── NAV ───────────────────────────────────────────────────────────────────────
function Nav({ current, onChange }) {
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(255,255,255,0.97)", borderTop: `1px solid ${T.line}`,
      padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <button onClick={() => onChange(Math.max(0, current - 1))}
        disabled={current === 0}
        style={{ width: 34, height: 34, border: `1px solid ${T.line}`,
          background: "transparent", color: current === 0 ? T.ink40 : T.ink,
          cursor: current === 0 ? "not-allowed" : "pointer", fontFamily: MONO_FONT, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>

      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        {SLIDES.map((s, i) => (
          <button key={i} onClick={() => onChange(i)} title={s}
            style={{ width: i === current ? 20 : 5, height: 3, border: "none", cursor: "pointer",
              background: i === current ? T.pink : T.line, transition: "all 0.25s ease", padding: 0 }} />
        ))}
      </div>

      <button onClick={() => onChange(Math.min(SLIDES.length - 1, current + 1))}
        disabled={current === SLIDES.length - 1}
        style={{ width: 34, height: 34, border: `1px solid ${T.line}`,
          background: "transparent", color: current === SLIDES.length - 1 ? T.ink40 : T.ink,
          cursor: current === SLIDES.length - 1 ? "not-allowed" : "pointer", fontFamily: MONO_FONT, fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SLIDES
// ══════════════════════════════════════════════════════════════════════════════

// 0 — COVER
function CoverSlide() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", padding: "64px 32px 110px" }}>
      <div style={{ marginBottom: 48 }}>
        <Wordmark size={30} />
      </div>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 15, color: T.pinkD, letterSpacing: 1,
        textTransform: "uppercase", marginBottom: 18 }}>Partner Proposal</div>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 40, color: T.ink, lineHeight: 1.15,
        letterSpacing: "-1px", textTransform: "uppercase" }}>
        Protein Ready-to-Drink<br />for <span style={{ color: T.pink }}>Modern Gyms.</span>
      </div>
      <div style={{ height: 60 }} />
      <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 20, fontFamily: MONO_FONT,
        fontSize: 10, color: T.ink40, letterSpacing: 1 }}>SOLO, INDONESIA · 2026</div>
    </div>
  );
}

// 1 — THE OPPORTUNITY (problem first, no product talk yet)
function OpportunitySlide() {
  const points = [
    "Ribuan member datang ke gym setiap bulan.",
    "Setelah latihan, mereka mencari solusi recovery.",
    "Mayoritas membeli minuman protein di luar gym — bukan di dalam.",
    "Setiap transaksi yang keluar dari gym adalah revenue yang hilang.",
  ];
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px" }}>
      <Eyebrow>01 — The Opportunity</Eyebrow>
      <H1>Every gym member<br />needs protein.<br /><span style={{ color: T.pink }}>Most gyms don't monetize it.</span></H1>
      <div style={{ height: 12 }} />
      <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${T.line}` }}>
        {points.map((p, i) => (
          <div key={p} style={{ display: "flex", gap: 18, padding: "18px 0", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: MONO_FONT, fontSize: 12, color: T.pinkD, flexShrink: 0, paddingTop: 1 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: BODY_FONT, fontSize: 14, color: T.ink, lineHeight: 1.6 }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2 — WHY PROTEIN (market data, sourced)
function WhyProteinSlide() {
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px" }}>
      <Eyebrow>02 — Mengapa Protein</Eyebrow>
      <H1>Kategori yang<br /><span style={{ color: T.pink }}>tumbuh dua digit.</span></H1>
      <div style={{ height: 8 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: `1px solid ${T.line}`, marginBottom: 20 }}>
        {MARKET_STATS.map(m => (
          <div key={m.label} style={{ display: "flex", alignItems: "baseline", gap: 20,
            padding: "18px 0", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: MONO_FONT, fontSize: 26, color: T.pinkD, fontWeight: 600,
              letterSpacing: "-0.5px", minWidth: 100 }}>{m.value}</span>
            <div>
              <div style={{ fontFamily: BODY_FONT, fontSize: 13, color: T.ink, fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontFamily: BODY_FONT, fontSize: 11, color: T.ink40, marginTop: 2 }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: BODY_FONT, fontSize: 13, color: T.ink70, lineHeight: 1.7, maxWidth: 400 }}>
        Kepraktisan dan kesehatan fungsional adalah dua kekuatan utama yang membentuk ulang pasar minuman di Indonesia. Protein RTD berada tepat di persimpangan keduanya.
      </p>

      <div style={{ marginTop: 24, fontFamily: BODY_FONT, fontSize: 9.5, color: T.ink40, lineHeight: 1.6 }}>
        Sumber: Grand View Research, Indonesia Dietary Supplements Market Report (2026); IndexBox, Indonesia Protein Water Market Report (2026); Chocolate Post-Workout Recovery Market in Indonesia, IndexBox (2026).
      </div>
    </div>
  );
}

// 3 — WHY FITFOCUS (product, minimal text)
function WhyFitFocusSlide() {
  const chips = ["49g protein", "Real food", "Low sugar", "Fresh", "Practical"];
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px" }}>
      <Eyebrow>03 — Why FitFocus</Eyebrow>
      <H1>Real food.<br /><span style={{ color: T.pink }}>Ready to drink.</span></H1>
      <div style={{ height: 16 }} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
        {chips.map(c => (
          <div key={c} style={{ border: `1.5px solid ${T.ink}`, padding: "8px 16px",
            fontFamily: DISPLAY_FONT, fontSize: 12, color: T.ink, textTransform: "uppercase",
            letterSpacing: "-0.2px" }}>
            {c}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
        borderTop: `1px solid ${T.line}`, paddingTop: 24, marginBottom: 20 }}>
        <StatCell value="49" unit="g" label="Protein / botol" accent={T.pink} />
        <StatCell value="330" unit="ml" label="Siap minum" accent={T.ink} />
        <StatCell value="4" label="Varian rasa" accent={T.pink} />
        <StatCell value="30.000" unit="Rp" label="Harga jual" accent={T.ink} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, borderTop: `1px solid ${T.line}`, paddingTop: 16 }}>
        {["Choco Forest", "Mixed Berry", "Pink Banana", "Milky Dew"].map(f => (
          <span key={f} style={{ fontFamily: BODY_FONT, fontSize: 11, color: T.ink70,
            padding: "5px 12px", border: `1px solid ${T.line}` }}>{f}</span>
        ))}
      </div>
    </div>
  );
}

// 4 — PROVEN RESULTS (corporate stat block)
function ResultsSlide() {
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px" }}>
      <Eyebrow>04 — Proven Results</Eyebrow>
      <H1>Not projected.<br /><span style={{ color: T.pink }}>Measured.</span></H1>
      <Lead>13 distribution cycles across 6 gym partners in Solo, May–July 2026.</Lead>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginBottom: 28,
        border: `1.5px solid ${T.ink}` }}>
        {[
          { value: `${AVG_RATE}%`, label: "Average Sell-through" },
          { value: "100%", label: "Highest Cycle" },
          { value: "6", label: "Gym Partners" },
          { value: "13", label: "Distribution Cycles" },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "20px 18px",
            borderRight: i % 2 === 0 ? `1px solid ${T.line}` : "none",
            borderBottom: i < 2 ? `1px solid ${T.line}` : "none" }}>
            <div style={{ fontFamily: MONO_FONT, fontSize: 30, color: T.ink, fontWeight: 600, letterSpacing: "-1px" }}>{s.value}</div>
            <div style={{ fontFamily: BODY_FONT, fontSize: 10, color: T.ink40, marginTop: 4,
              letterSpacing: 0.5, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: MONO_FONT, fontSize: 10, color: T.ink40, letterSpacing: 1.5,
        textTransform: "uppercase", marginBottom: 10 }}>Sell-through per Cycle</div>
      <div style={{ border: `1px solid ${T.line}`, padding: "16px 8px 8px" }}>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={SELL_RATE_TREND}>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={T.pink} stopOpacity={0.28} />
                <stop offset="95%" stopColor={T.pink} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke={T.line} vertical={false} />
            <XAxis dataKey="session" tick={{ fill: T.ink40, fontSize: 9, fontFamily: MONO_FONT }} axisLine={{ stroke: T.line }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: T.ink40, fontSize: 9, fontFamily: MONO_FONT }} axisLine={false} tickLine={false} />
            <ReferenceLine y={AVG_RATE} stroke={T.ink} strokeDasharray="3 3" strokeWidth={1} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="rate" stroke={T.pinkD} fill="url(#lg)" strokeWidth={2}
              dot={{ r: 2.5, fill: T.pinkD, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// 5 — ZERO RISK MODEL (formerly "Skema")
function ZeroRiskSlide() {
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px" }}>
      <Eyebrow>05 — Business Model</Eyebrow>
      <H1><span style={{ color: T.pink }}>Zero Inventory Risk.</span></H1>
      <Lead>Gym only pays for what sells. Nothing else.</Lead>

      <LabelPanel
        title="Pricing Structure"
        rows={[
          { label: "Consignment price", sub: "paid only for bottles sold", value: "Rp 25.000" },
          { label: "Retail price", sub: "fixed across all partner gyms", value: "Rp 30.000" },
          { label: "Gym margin", sub: "per bottle sold, no deductions", value: "Rp 5.000", big: true, accent: T.pinkD },
        ]}
      />

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 0 }}>
        {[
          "Pay only what sells",
          "Unsold stock fully collected",
          "Fixed retail pricing",
          "Rp 5.000 profit per bottle",
        ].map(c => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
            borderBottom: `1px solid ${T.line}` }}>
            <span style={{ color: T.pink, fontFamily: MONO_FONT, fontSize: 14, fontWeight: 700 }}>✓</span>
            <span style={{ fontFamily: BODY_FONT, fontSize: 13, color: T.ink, fontWeight: 500 }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 6 — WHY GYMS LIKE FITFOCUS
function WhyGymsSlide() {
  const items = [
    "No upfront investment",
    "No operational burden",
    "No preparation required",
    "No staff training",
    "Weekly restocking",
    "Consistent pricing",
    "Fast moving SKU",
  ];
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px" }}>
      <Eyebrow>06 — Why Gyms Like FitFocus</Eyebrow>
      <H1>Built to require<br /><span style={{ color: T.pink }}>nothing from you.</span></H1>
      <div style={{ height: 12 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: `1px solid ${T.line}` }}>
        {items.map((it, i) => (
          <div key={it} style={{ padding: "16px 18px",
            borderRight: i % 2 === 0 ? `1px solid ${T.line}` : "none",
            borderBottom: i < items.length - (items.length % 2 === 0 ? 2 : 1) ? `1px solid ${T.line}` : "none" }}>
            <span style={{ fontFamily: BODY_FONT, fontSize: 12.5, color: T.ink, fontWeight: 600, lineHeight: 1.5 }}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 7 — OPERATING SYSTEM
function OperatingSystemSlide() {
  const steps = ["Production", "Quality Control", "Delivery", "Display", "Sales Tracking", "Restocking", "Expired Collection", "Performance Report"];
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px" }}>
      <Eyebrow>07 — Our Operating System</Eyebrow>
      <H1>Trust comes from<br /><span style={{ color: T.pink }}>the system, not the product.</span></H1>
      <div style={{ height: 16 }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {steps.map((s, i) => (
          <FlowStep key={s} label={s} isLast={i === steps.length - 1} />
        ))}
      </div>
    </div>
  );
}

// 8 — CURRENT PARTNERS
// Vertical wheel picker — like an iOS date-picker reel. The centered item is
// bold and full opacity; items above/below fade and shrink with distance
// from center. Auto-cycles on an interval and loops forever.
function WheelPicker({ items, holdMs = 1200, itemHeight = 76 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex(i => (i + 1) % items.length);
    }, holdMs);
    return () => clearInterval(t);
  }, [items.length, holdMs]);

  // Distance-based style: 0 = center (bold/full), 1 = neighbor (faded/small),
  // 2+ = further out (barely visible). Wraps around the list circularly.
  const styleFor = (dist) => {
    const d = Math.min(dist, 2);
    return [
      { opacity: 1,    scale: 1,    color: T.ink,  weight: 1 },
      { opacity: 0.3,  scale: 0.7,  color: T.ink40, weight: 0 },
      { opacity: 0.1,  scale: 0.52, color: T.ink40, weight: 0 },
    ][d];
  };

  // Brief squish pulse right after each snap — settles back to normal scale,
  // giving the sense of the reel physically absorbing momentum on arrival.
  const [justSettled, setJustSettled] = useState(false);
  useEffect(() => {
    setJustSettled(true);
    const t = setTimeout(() => setJustSettled(false), 260);
    return () => clearTimeout(t);
  }, [index]);

  const n = items.length;

  return (
    <div style={{
      position: "relative", height: itemHeight * 3, overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* center highlight band — the "window" the reel is read through, seamless
          neutral wash rather than a boxed/bordered shape */}
      <div style={{
        position: "absolute", top: itemHeight, left: 0, right: 0, height: itemHeight,
        background: `linear-gradient(90deg, ${T.paperD}00 0%, ${T.paperD} 50%, ${T.paperD}00 100%)`,
        transition: "opacity 0.3s ease",
      }} />

      {items.map((label, i) => {
        let offset = i - index;
        if (offset > n / 2) offset -= n;
        if (offset < -n / 2) offset += n;
        if (Math.abs(offset) > 2) return null;

        const s = styleFor(Math.abs(offset));
        const isCenter = offset === 0;
        const squish = isCenter && justSettled ? "scaleY(0.9)" : "scaleY(1)";
        return (
          <div key={label} style={{
            position: "absolute", top: "50%", left: 0, right: 0, textAlign: "center",
            transform: `translateY(${offset * itemHeight - itemHeight / 2}px) scale(${s.scale}) ${squish}`,
            transition: "transform 0.65s cubic-bezier(0.34, 1.1, 0.64, 1), opacity 0.5s ease",
            opacity: s.opacity,
            fontFamily: DISPLAY_FONT, fontSize: 38, letterSpacing: "-1.5px", fontWeight: 900,
            color: s.color,
            height: itemHeight, display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: isCenter ? 2 : 1,
          }}>
            {label}
          </div>
        );
      })}

      {/* fade masks — top/bottom of the window dissolve into the frame edge
          rather than cutting off hard */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: itemHeight * 0.95, zIndex: 2,
        background: `linear-gradient(to bottom, ${T.paper} 0%, ${T.paper}00 100%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: itemHeight * 0.95, zIndex: 2,
        background: `linear-gradient(to top, ${T.paper} 0%, ${T.paper}00 100%)`,
        pointerEvents: "none",
      }} />
    </div>
  );
}

function PartnersSlide() {
  const partners = ["ARC", "RPM", "AFC", "MAHABODHI", "GMP"];
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <Eyebrow>08 — Our Current Partners</Eyebrow>
      <H1>Trusted by gyms<br /><span style={{ color: T.pink }}>across Solo.</span></H1>
      <div style={{ height: 32 }} />

      <WheelPicker items={partners} />

      <div style={{ marginTop: 16, fontFamily: MONO_FONT, fontSize: 10, color: T.ink40,
        letterSpacing: 1, textTransform: "uppercase", textAlign: "center" }}>
        {partners.length} active gym partners
      </div>
    </div>
  );
}


// 9 — GROWTH ROADMAP
function RoadmapSlide() {
  const cities = ["Solo", "Yogyakarta", "Semarang", "Surabaya", "Jakarta"];
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px" }}>
      <Eyebrow>09 — Growth Roadmap</Eyebrow>
      <H1>Starting in Solo.<br /><span style={{ color: T.pink }}>Built to expand.</span></H1>
      <div style={{ height: 16 }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {cities.map((c, i) => (
          <FlowStep key={c} label={c} sub={i === 0 ? "live" : undefined} isLast={i === cities.length - 1} />
        ))}
      </div>

      <div style={{ marginTop: 20, fontFamily: BODY_FONT, fontSize: 10.5, color: T.ink40, textAlign: "center" }}>
        Illustrative expansion sequence — subject to change based on demand and partnership pace.
      </div>
    </div>
  );
}

// 10 — WHY PARTNER EARLY
function FoundingPartnerSlide() {
  const items = [
    { label: "Limited founding partners", desc: "Awal kerja sama dibatasi jumlahnya untuk menjaga kualitas layanan." },
    { label: "Priority support", desc: "Respons dan restock diprioritaskan untuk partner awal." },
    { label: "Marketing collaboration", desc: "Kesempatan co-promotion di channel FitFocus." },
    { label: "Future joint campaigns", desc: "Dilibatkan lebih dulu dalam campaign dan program mendatang." },
  ];
  return (
    <div style={{ minHeight: "100vh", padding: "64px 32px 110px" }}>
      <Eyebrow>10 — Why Partner Early</Eyebrow>
      <H1>The advantage of<br /><span style={{ color: T.pink }}>being first.</span></H1>
      <div style={{ height: 12 }} />

      <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${T.line}` }}>
        {items.map(it => (
          <div key={it.label} style={{ padding: "18px 0", borderBottom: `1px solid ${T.line}` }}>
            <div style={{ fontFamily: BODY_FONT, fontSize: 14, color: T.ink, fontWeight: 700, marginBottom: 4 }}>{it.label}</div>
            <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: T.ink70, lineHeight: 1.6 }}>{it.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 11 — CONTACT / CLOSE
function ContactSlide() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", padding: "64px 32px 110px" }}>

      <Eyebrow>Let's Talk</Eyebrow>
      <H1>Let's build stronger<br /><span style={{ color: T.pink }}>gyms together.</span></H1>
      <div style={{ height: 24 }} />

      <LabelPanel
        rows={[
          { label: "Email", value: "hifitfocus@gmail.com" },
          { label: "Instagram", value: "@fitfocus.id" },
          { label: "WhatsApp", value: "+62 878-3575-6945" },
        ]}
      />

      <div style={{ marginTop: 40 }}>
        <Wordmark size={28} />
      </div>
    </div>
  );
}

const SLIDE_COMPONENTS = [
  CoverSlide, OpportunitySlide, WhyProteinSlide, WhyFitFocusSlide, ResultsSlide,
  ZeroRiskSlide, WhyGymsSlide, OperatingSystemSlide, PartnersSlide,
  RoadmapSlide, FoundingPartnerSlide, ContactSlide,
];

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function FitFocusGymPartnership() {
  const [current, setCurrent] = useState(0);
  const SlideComponent = SLIDE_COMPONENTS[current];

  return (
    <div style={{ background: T.paper, minHeight: "100vh", color: T.ink, fontFamily: BODY_FONT }}>
      <div style={{ position: "fixed", top: 22, right: 24, zIndex: 100,
        fontFamily: MONO_FONT, fontSize: 10, color: T.ink40, letterSpacing: 1 }}>
        {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
      </div>

      <SlideComponent />
      <Nav current={current} onChange={setCurrent} />
    </div>
  );
}
