import { useState, useEffect, useRef } from "react";

const TIERS = [
  {
    id: "starter",
    tier: "Tier 01",
    name: "Starter",
    price: 20,
    tag: null,
    telegram: "https://t.me/+XJ8v-0xXDkw0M2Q0",
    priceId: "price_1TZxpGCev00iOONMCJwcWS0E",
    features: [
      "Access to Starter Telegram group",
      "Nutritional advice on foods to avoid & best foods to eat",
      "Weekly exercise routine",
      "Breakdown videos from Raf on how to perform exercises",
      "Monthly progress tracking",
    ],
  },
  {
    id: "mid",
    tier: "Tier 02",
    name: "Mid Tier",
    price: 60,
    tag: "Most Popular",
    telegram: "https://t.me/+fnG9UT2Y4pIyYTM0",
    priceId: "price_1TZy8JCev00iOONMEKHhCfZQ",
    features: [
      "Everything in Starter",
      "Access to Mid Tier Telegram group",
      "Body sculpting program tailored to your physique",
      "Diet structure specific to your body type & goals",
      "Exercise plan tailored to your fitness journey",
      "Boxing training for form & performance",
      "Weekly progress tracking",
    ],
  },
  {
    id: "elite",
    tier: "Tier 03",
    name: "Elite 1-1",
    price: 200,
    tag: "Premium",
    telegram: "https://t.me/+GICMiLOsc2c3MmRk",
    priceId: "price_1TZy8xCev00iOONM7oiZKXSB",
    features: [
      "Everything in Mid Tier",
      "Private 1-1 Telegram access with Raf",
      "45-min weekly phone consultation with Raf",
      "Personalised strategies every single session",
      "Direct accountability from Raf himself",
      "Full body sculpting roadmap",
      "Priority response & ongoing support",
    ],
  },
];

const SETUP_STEPS = [
  {
    num: "01",
    title: "Add Your Stripe Keys",
    desc: "Open the JSX file. At the top, replace STRIPE_PUBLISHABLE_KEY with your key from stripe.com → Developers → API keys.",
    code: `const STRIPE_PUBLISHABLE_KEY = 'pk_live_YOUR_KEY_HERE';`,
  },
  {
    num: "02",
    title: "Create Stripe Products",
    desc: "In Stripe Dashboard → Products, create 3 recurring subscriptions with 7-day free trials. Paste each price_xxx ID into TIERS above.",
    code: `priceId: 'price_YOUR_STARTER_PRICE_ID'`,
  },
  {
    num: "03",
    title: "Deploy Your Backend",
    desc: "Deploy the Node.js snippet below to Railway.app or Render.com (free). Replace BACKEND_URL with your deployed URL.",
    code: `const BACKEND_URL = 'https://YOUR_BACKEND.railway.app/subscribe';`,
  },
  {
    num: "04",
    title: "Set Up Telegram Bot",
    desc: "Create a bot via @BotFather. Add it as admin to each group. Use the webhook code below to auto-kick members on failed payments.",
    code: `const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';`,
  },
];

const BACKEND_CODE = `const express = require('express');
const stripe = require('stripe')('sk_live_YOUR_SECRET_KEY');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('YOUR_BOT_TOKEN');
const app = express();
app.use(express.json());

// On successful subscription → generate a one-time Telegram invite link
app.post('/subscribe', async (req, res) => {
  const { paymentMethodId, priceId, email, name, tier } = req.body;
  try {
    const customer = await stripe.customers.create({
      email, name,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId }
    });
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 7,
      metadata: { tier }
    });
    // Generate one-time Telegram invite link
    const chatId = { starter: -100YOUR_STARTER_ID, mid: -100YOUR_MID_ID, elite: -100YOUR_ELITE_ID }[tier];
    const link = await bot.createChatInviteLink(chatId, { member_limit: 1, expire_date: Math.floor(Date.now()/1000) + 86400 });
    // Save customer.id + telegram userId to your DB for later kick logic
    res.json({ subscriptionId: subscription.id, telegramLink: link.invite_link });
  } catch (err) { res.json({ error: err.message }); }
});

// Stripe webhook → kick on payment failure
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], 'YOUR_WEBHOOK_SECRET');
  if (event.type === 'invoice.payment_failed' || event.type === 'customer.subscription.deleted') {
    const customerId = event.data.object.customer;
    // Look up telegramUserId + chatId from your DB by customerId
    // await bot.banChatMember(chatId, telegramUserId);
    // await bot.unbanChatMember(chatId, telegramUserId); // allow re-entry if they pay again
  }
  res.json({ received: true });
});

app.listen(3000, () => console.log('Server running'));`;

export default function App() {
  const [modal, setModal] = useState(null); // tier object or null
  const [tab, setTab] = useState("setup"); // 'setup' | 'backend'
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openModal = (tier) => {
    setModal(tier);
    setName("");
    setEmail("");
    setError("");
    setSuccess(false);
    setLoading(false);
  };

  const closeModal = () => setModal(null);

  const handlePay = async () => {
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Please enter a valid email."); return; }
    setError("");
    setLoading(true);
    // Simulate processing (replace with real Stripe logic)
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setSuccess(true);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(BACKEND_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navOpaque = scrollY > 60;

  return (
    <div style={{ background: "#080808", color: "#f5f0e8", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>

      {/* GOOGLE FONTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080808; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes marquee { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
        .fadeUp { animation: fadeUp 0.7s ease forwards; }
        .card-hover { transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s; }
        .card-hover:hover { transform: translateY(-8px); border-color: rgba(201,168,76,0.4) !important; box-shadow: 0 20px 60px rgba(201,168,76,0.08); }
        .btn-gold { transition: background 0.2s, color 0.2s, transform 0.1s; }
        .btn-gold:hover { background: #e8c96a !important; }
        .btn-gold:active { transform: scale(0.98); }
        .btn-outline:hover { background: rgba(201,168,76,0.1) !important; }
        pre { white-space: pre-wrap; word-break: break-word; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 48px",
        background: navOpaque ? "rgba(8,8,8,0.97)" : "linear-gradient(to bottom, rgba(8,8,8,0.9), transparent)",
        borderBottom: navOpaque ? "1px solid #1a1a1a" : "none",
        transition: "background 0.3s, border-color 0.3s",
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 5, color: "#c9a84c" }}>
          RAF<span style={{ color: "#f5f0e8" }}>REACTS</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {["Pricing", "Setup", "About"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#888", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#c9a84c"}
              onMouseLeave={e => e.target.style.color = "#888"}>{l}</a>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", textAlign: "center",
        padding: "140px 24px 100px", position: "relative", overflow: "hidden"
      }}>
        {/* BG gradients */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.1) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 85% 85%, rgba(224,48,48,0.06) 0%, transparent 50%)", pointerEvents: "none" }} />

        <p className="fadeUp" style={{ fontFamily: "'DM Sans'", fontSize: 11, letterSpacing: 6, textTransform: "uppercase", color: "#c9a84c", marginBottom: 24, animationDelay: "0.2s", opacity: 0 }}>
          Rafreacts · Personal Training
        </p>
        <h1 className="fadeUp" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(80px,15vw,190px)", lineHeight: 0.88, letterSpacing: 3, animationDelay: "0.4s", opacity: 0 }}>
          BUILD<br />YOUR<br /><span style={{ color: "#c9a84c" }}>BEST.</span>
        </h1>
        <p className="fadeUp" style={{ fontSize: "clamp(14px,1.6vw,18px)", color: "#888", fontWeight: 300, maxWidth: 460, margin: "28px auto 0", lineHeight: 1.8, animationDelay: "0.6s", opacity: 0 }}>
          Stop scrolling. Start transforming. Structured fitness built around your body, your goals, your life.
        </p>

        {/* Stats */}
        <div className="fadeUp" style={{ display: "flex", gap: 56, marginTop: 64, animationDelay: "0.8s", opacity: 0 }}>
          {[["1:1", "Coaching"], ["3", "Tiers"], ["7-Day", "Free Trial"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, fontWeight: 800, color: "#c9a84c", display: "block" }}>{n}</span>
              <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#555" }}>{l}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="fadeUp" style={{ marginTop: 52, animationDelay: "1s", opacity: 0 }}>
          <a href="#pricing" className="btn-gold" style={{
            display: "inline-block", padding: "16px 40px",
            background: "#c9a84c", color: "#080808",
            fontWeight: 700, fontSize: 12, letterSpacing: 3, textTransform: "uppercase",
            textDecoration: "none", borderRadius: 2,
          }}>View Plans →</a>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, #c9a84c, transparent)", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#444" }}>Scroll</span>
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{ overflow: "hidden", borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", padding: "14px 0", background: "#111" }}>
        <div style={{ display: "flex", animation: "marquee 22s linear infinite", whiteSpace: "nowrap" }}>
          {[...Array(2)].flatMap(() =>
            ["BODY SCULPTING", "✦", "DIETARY STRUCTURE", "✦", "BOXING TRAINING", "✦", "WEEKLY ROUTINES", "✦", "PROGRESS TRACKING", "✦", "1-1 CONSULTATIONS", "✦"]
              .map((t, i) => (
                <span key={`${t}-${i}`} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 4, color: t === "✦" ? "#c9a84c" : "#444", padding: "0 32px" }}>{t}</span>
              ))
          )}
        </div>
      </div>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "120px 24px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "#c9a84c", marginBottom: 14 }}>Choose Your Path</p>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(52px,9vw,100px)", lineHeight: 1 }}>
            SELECT YOUR <span style={{ color: "#c9a84c" }}>TIER</span>
          </h2>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 30, padding: "8px 20px", fontSize: 13, color: "#e8c96a" }}>
            ★ 7-Day Free Trial on all plans
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>
          {TIERS.map((t) => {
            const isFeatured = t.id === "mid";
            return (
              <div key={t.id} className="card-hover" style={{
                position: "relative",
                background: isFeatured ? "linear-gradient(145deg, #1a1a1a, #1d1b10)" : "#111",
                border: isFeatured ? "1px solid rgba(201,168,76,0.35)" : "1px solid #1e1e1e",
                borderTop: `2px solid ${isFeatured ? "#c9a84c" : "#222"}`,
                borderRadius: 4,
                padding: "40px 32px",
                transform: isFeatured ? "scale(1.02)" : "none",
              }}>
                {t.tag && (
                  <div style={{ position: "absolute", top: 20, right: 20, background: "#c9a84c", color: "#080808", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", padding: "4px 12px", borderRadius: 2, fontWeight: 600 }}>
                    {t.tag}
                  </div>
                )}
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "#555", marginBottom: 10 }}>{t.tier}</p>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 24 }}>{t.name}</h3>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <span style={{ fontSize: 18, color: "#c9a84c", marginTop: 10, fontWeight: 500 }}>$</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, color: "#c9a84c", lineHeight: 1 }}>{t.price}</span>
                </div>
                <p style={{ fontSize: 12, color: "#555", marginBottom: 28 }}>per month · after free trial</p>
                <div style={{ height: 1, background: "#1e1e1e", marginBottom: 24 }} />
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
                  {t.features.map(f => (
                    <li key={f} style={{ display: "flex", gap: 10, fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
                      <span style={{ color: "#c9a84c", flexShrink: 0 }}>→</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => openModal(t)} className="btn-gold" style={{
                  width: "100%", padding: "16px",
                  background: isFeatured ? "#c9a84c" : "transparent",
                  border: "1px solid #c9a84c",
                  color: isFeatured ? "#080808" : "#c9a84c",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase",
                  cursor: "pointer", borderRadius: 2,
                }}>
                  Start Free Trial
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SETUP SECTION */}
      <section id="setup" style={{ padding: "100px 24px", borderTop: "1px solid #1a1a1a", background: "#0c0c0c" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "#c9a84c", marginBottom: 14 }}>Go Live in Minutes</p>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(44px,7vw,80px)", lineHeight: 1 }}>
              SETUP <span style={{ color: "#c9a84c" }}>GUIDE</span>
            </h2>
          </div>

          {/* Tab switcher */}
          <div style={{ display: "flex", gap: 0, marginBottom: 40, border: "1px solid #1e1e1e", borderRadius: 4, overflow: "hidden", width: "fit-content", margin: "0 auto 48px" }}>
            {[["setup", "Setup Steps"], ["backend", "Backend Code"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: "12px 28px", fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
                background: tab === key ? "#c9a84c" : "transparent",
                color: tab === key ? "#080808" : "#888",
                border: "none", cursor: "pointer", fontWeight: 600,
                transition: "background 0.2s, color 0.2s",
              }}>{label}</button>
            ))}
          </div>

          {tab === "setup" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {SETUP_STEPS.map(s => (
                <div key={s.num} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 4, padding: 28 }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, color: "#1e1e1e", lineHeight: 1, marginBottom: 12 }}>{s.num}</div>
                  <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{s.title}</h4>
                  <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 14 }}>{s.desc}</p>
                  <code style={{ display: "block", background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 2, padding: "10px 14px", fontSize: 11, color: "#c9a84c", fontFamily: "monospace", wordBreak: "break-all" }}>{s.code}</code>
                </div>
              ))}
            </div>
          )}

          {tab === "backend" && (
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", border: "1px solid #1e1e1e", borderBottom: "none", borderRadius: "4px 4px 0 0", padding: "12px 20px" }}>
                <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#555" }}>server.js — Node.js / Express</span>
                <button onClick={copyCode} className="btn-outline" style={{
                  padding: "6px 16px", background: "transparent", border: "1px solid #333",
                  color: copied ? "#c9a84c" : "#888", fontSize: 11, letterSpacing: 2,
                  textTransform: "uppercase", cursor: "pointer", borderRadius: 2,
                  transition: "color 0.2s",
                }}>{copied ? "✓ Copied" : "Copy"}</button>
              </div>
              <pre style={{
                background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "0 0 4px 4px",
                padding: 28, fontSize: 12, color: "#aaa", lineHeight: 1.8,
                overflowX: "auto", fontFamily: "monospace", maxHeight: 480, overflowY: "auto"
              }}>{BACKEND_CODE}</pre>
              <p style={{ marginTop: 16, fontSize: 13, color: "#555", textAlign: "center" }}>
                Deploy free on{" "}
                <a href="https://railway.app" target="_blank" rel="noreferrer" style={{ color: "#c9a84c" }}>Railway.app</a>
                {" "}or{" "}
                <a href="https://render.com" target="_blank" rel="noreferrer" style={{ color: "#c9a84c" }}>Render.com</a>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: "100px 24px", borderTop: "1px solid #1a1a1a", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "#c9a84c", marginBottom: 14 }}>About Rafreacts</p>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(40px,6vw,72px)", lineHeight: 1, marginBottom: 28 }}>
            BUILT ON <span style={{ color: "#c9a84c" }}>RESULTS</span>
          </h2>
          <p style={{ fontSize: 15, color: "#666", lineHeight: 1.9, marginBottom: 16 }}>
            Rafreacts is built on one thing — getting you real results through structure, consistency and accountability. No fluff, no generic plans. Everything is built around <em style={{ color: "#aaa" }}>you</em>.
          </p>
          <p style={{ fontSize: 15, color: "#666", lineHeight: 1.9 }}>
            Whether you're just starting out or ready to go all in with direct 1-1 coaching from Raf, there's a tier that meets you exactly where you are.
          </p>
          <button onClick={() => openModal(TIERS[1])} className="btn-gold" style={{
            marginTop: 40, padding: "16px 44px",
            background: "#c9a84c", border: "none",
            color: "#080808", fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase",
            cursor: "pointer", borderRadius: 2,
          }}>Get Started Free →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px 48px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 4, color: "#c9a84c" }}>RAFREACTS</div>
        <p style={{ fontSize: 12, color: "#444" }}>© 2025 Rafreacts. All rights reserved.</p>
        <p style={{ fontSize: 12, color: "#444" }}>Powered by Stripe · Secured payments</p>
      </footer>

      {/* MODAL */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && closeModal()} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(10px)", zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: "#111", border: "1px solid #222",
            borderTop: "2px solid #c9a84c",
            borderRadius: 4, width: "100%", maxWidth: 460,
            padding: "40px 36px", position: "relative",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <button onClick={closeModal} style={{
              position: "absolute", top: 16, right: 20,
              background: "none", border: "none", color: "#555",
              fontSize: 26, cursor: "pointer", lineHeight: 1,
              transition: "color 0.2s",
            }} onMouseEnter={e => e.target.style.color = "#fff"}
              onMouseLeave={e => e.target.style.color = "#555"}>×</button>

            {!success ? (
              <>
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "#c9a84c", marginBottom: 6 }}>{modal.tier}</p>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{modal.name}</h3>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, color: "#c9a84c", lineHeight: 1 }}>
                  ${modal.price}<span style={{ fontSize: 18, color: "#555", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>/mo</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, marginBottom: 28, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#e8c96a" }}>
                  ✦ 7 days free — then billed monthly
                </div>

                <div style={{ height: 1, background: "#1e1e1e", marginBottom: 24 }} />

                {/* Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                    style={{ width: "100%", background: "#1a1a1a", border: "1px solid #252525", borderRadius: 2, padding: "13px 16px", color: "#f5f0e8", fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none" }} />
                </div>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Email Address</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email"
                    style={{ width: "100%", background: "#1a1a1a", border: "1px solid #252525", borderRadius: 2, padding: "13px 16px", color: "#f5f0e8", fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: "none" }} />
                </div>

                {/* Card placeholder */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Card Details</label>
                  <div id="stripe-card-element" style={{ background: "#1a1a1a", border: "1px solid #252525", borderRadius: 2, padding: "13px 16px", minHeight: 46 }}>
                    {/* Stripe card element mounts here — wire up Stripe.js with your publishable key */}
                    <span style={{ fontSize: 13, color: "#444", fontFamily: "monospace" }}>**** **** **** ****  —  MM/YY  —  CVC</span>
                  </div>
                </div>

                {error && <p style={{ color: "#e03030", fontSize: 12, marginBottom: 8 }}>{error}</p>}

                <button onClick={handlePay} disabled={loading} className="btn-gold" style={{
                  width: "100%", padding: "17px", marginTop: 16,
                  background: "#c9a84c", border: "none",
                  color: "#080808", fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase",
                  cursor: loading ? "not-allowed" : "pointer", borderRadius: 2,
                  opacity: loading ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {loading && <span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTop: "2px solid #080808", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />}
                  {loading ? "Processing..." : "Start 7-Day Free Trial"}
                </button>

                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 14, fontSize: 11, color: "#444" }}>
                  🔒 Secured by Stripe · Cancel anytime
                </div>
                <p style={{ fontSize: 11, color: "#444", textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
                  Your 7-day free trial starts today. After the trial, you'll be billed ${modal.price}/month. Cancel anytime before day 7.
                </p>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🔥</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 10 }}>You're In!</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 24 }}>
                  Your free trial has started. Check your email for confirmation, then tap below to join your Telegram group.
                </p>
                <a href={modal.telegram} target="_blank" rel="noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "#c9a84c", color: "#080808",
                  padding: "14px 28px", borderRadius: 2, textDecoration: "none",
                  fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase",
                }}>
                  📲 Join Telegram Group
                </a>
                <p style={{ marginTop: 20, fontSize: 12, color: "#444" }}>
                  Didn't get your email? Check your spam folder or message Raf on Telegram.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
