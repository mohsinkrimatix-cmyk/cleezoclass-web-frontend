// src/pages/Feature.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const FEATURES = {
  "Attendance & Discipline": [
    {
      title: "Teacher GPS Attendance Tracker",
      desc:
        "GPS-verified attendance for teachers with geofencing to prevent proxy marking.",
      users: "Teacher / Admin",
    },
    {
      title: "3-Second Student Attendance Capture",
      desc:
        "Quick tap-based student attendance — reliable, fast and error-free.",
      users: "Teacher",
    },
    {
      title: "Auto Parent Updates",
      desc:
        "Immediate absence & update notifications delivered to parents in real time.",
      users: "Parent / Teacher",
    },
    {
      title: "Bulk Attendance Insights",
      desc:
        "Empathetic alerts and summarized absence insights to keep parents engaged.",
      users: "Admin / Parent",
    },
    {
      title: "Discipline Pattern Detection",
      desc:
        "Detect behavior patterns via aggregated disciplinary data and predictive flags.",
      users: "Admin / Teacher",
    },
  ],
  "Learning & Assessment": [
    {
      title: "Homework Uploads & Guidance",
      desc:
        "Upload assignments, attach resources, and get AI-suggested homework tasks.",
      users: "Teacher / Student",
    },
    {
      title: "Resource Library",
      desc:
        "Organize notes, videos and links by class & subject with smart search.",
      users: "Teacher / Student",
    },
    {
      title: "Syllabus Tracking & Auto Updates",
      desc:
        "Monitor syllabus completion and push instant updates to stakeholders.",
      users: "Teacher / Admin",
    },
    {
      title: "Question Paper Generation (AI)",
      desc:
        "Auto-generate balanced question papers from syllabus and difficulty filters.",
      users: "Teacher",
    },
    {
      title: "Answer Paper Scanning & AI Evaluation",
      desc:
        "Scan answer sheets and get instant AI-based evaluations and analytics.",
      users: "Teacher / Admin",
    },
    {
      title: "Performance Insights via Paper Analysis",
      desc:
        "Get subject-wise and class-wise insights from scanned assessments.",
      users: "Admin",
    },
  ],
  "Automation & Productivity": [
    {
      title: "Auto Timetable Generator (AI)",
      desc:
        "Create conflict-free timetables in minutes based on availability & constraints.",
      users: "Admin",
    },
    {
      title: "Teacher Productivity Dashboard",
      desc:
        "Live dashboards linking school name & teacher performance for data-led coaching.",
      users: "Admin",
    },
    {
      title: "AI-based Student Strength–Weakness Mapping",
      desc:
        "Actionable student-level insights for adaptive tutoring and interventions.",
      users: "Teacher / Admin",
    },
    {
      title: "Substitute Teacher Assignment",
      desc:
        "Auto-suggest substitutes based on workload and availability when teachers are absent.",
      users: "Admin",
    },
    {
      title: "Homework Suggestions",
      desc:
        "AI recommends personalized tasks for students based on performance trends.",
      users: "Teacher",
    },
  ],
  "Identity & Certificates": [
    {
      title: "ID Card Generation (Bulk)",
      desc:
        "Create student & staff IDs with QR/Barcode and bulk export options.",
      users: "Admin",
    },
    {
      title: "Auto ID Number Generation",
      desc: "Automated ID creation logic to avoid duplicates and speed onboarding.",
      users: "Admin",
    },
    {
      title: "Certificate Generation (Auto)",
      desc:
        "Auto-create participation, merit and custom certificates based on rules.",
      users: "Admin",
    },
    {
      title: "Auto Welcome Messages",
      desc: "Send customized welcome messages automatically to new joiners.",
      users: "Admin / Parent",
    },
  ],
  "Branding & Communication": [
    {
      title: "Event Greeting Generation",
      desc:
        "Auto-generate greeting cards and messages for birthdays, festivals & events.",
      users: "Admin",
    },
    {
      title: "Digital Media Assistance",
      desc:
        "Auto social-post drafts, newsletters, and media-ready images for events.",
      users: "Marketing / Admin",
    },
    {
      title: "AI Ideas Generator for Events & Quizzes",
      desc:
        "Creative prompts and event plans from an AI assistant to reduce admin effort.",
      users: "Teacher / Admin",
    },
    {
      title: "School Branding & Marketing AI",
      desc:
        "Tools to manage school branding, campaigns and audience engagement.",
      users: "Management",
    },
  ],
  "Finance & Admin": [
    {
      title: "Fees — Payments & Receipts",
      desc:
        "Secure UPI, card & netbanking flows with auto receipts & reminders.",
      users: "Parent / Admin",
    },
    {
      title: "Expense & Income Ledger Reports",
      desc:
        "Auto categorized financial ledger reports with visual summaries.",
      users: "Admin / Management",
    },
    {
      title: "Bill Scanners (OCR)",
      desc:
        "Scan invoices and auto-extract fields into your accounting ledgers.",
      users: "Admin",
    },
    {
      title: "Teachers Payslip (Digital)",
      desc:
        "Secure downloadable payslips with historical records and notifications.",
      users: "Teacher / Admin",
    },
    {
      title: "Recruitment Management",
      desc:
        "End-to-end hiring flows with AI-assisted candidate evaluation.",
      users: "Admin",
    },
  ],
};

const CATEGORY_ORDER = [
  "Attendance & Discipline",
  "Learning & Assessment",
  "Automation & Productivity",
  "Identity & Certificates",
  "Branding & Communication",
  "Finance & Admin",
];

/**
 * FILTER MAP for mega-grid chips
 * Map user-friendly chips to one or more categories.
 * You can tweak these mappings later if you want different grouping.
 */
const FILTER_MAP = {
  All: CATEGORY_ORDER,
  "AI Tools": [
    "Automation & Productivity",
    "Learning & Assessment", // some AI features live here like question paper gen & evaluation
  ],
  Academics: ["Learning & Assessment", "Attendance & Discipline"],
  Admin: ["Finance & Admin", "Identity & Certificates"],
  Branding: ["Branding & Communication"],
};

export default function FeaturesPage() {
  const featureStartRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(true);
const [sidebarActive, setSidebarActive] = useState(false);
const [active, setActive] = useState(CATEGORY_ORDER[0]);

 
  const sectionRefs = useRef({});
  const floatRef = useRef(null);

  // Mega-grid filter state
  const [activeFilter, setActiveFilter] = useState("All");

  // create refs for categories (only once)
  CATEGORY_ORDER.forEach((cat) => {
    if (!sectionRefs.current[cat]) sectionRefs.current[cat] = React.createRef();
  });

  // IntersectionObserver to add reveal class for feature cards (keeps your animation)
  useEffect(() => {
    const cards = document.querySelectorAll(".feature-card");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("reveal");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  // Scrollspy: observe sections to set active category based on viewport
  useEffect(() => {
    const obsOptions = { root: null, rootMargin: "-30% 0px -40% 0px", threshold: 0 };
    const io = new IntersectionObserver((entries) => {
      // choose the entry that's intersecting with largest intersectionRatio (or just isIntersecting)
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cat = entry.target.getAttribute("data-cat");
          if (cat) setActive(cat);
        }
      });
    }, obsOptions);

    CATEGORY_ORDER.forEach((cat) => {
      const el = sectionRefs.current[cat]?.current;
      if (el) io.observe(el);
    });

    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

 
 // Floating icons parallax (keeps your transform)
useEffect(() => {
  const onScroll = () => {
    const s = window.scrollY;
    if (!floatRef.current) return;
    const nodes = floatRef.current.querySelectorAll(".float-icon");
    nodes.forEach((n, i) => {
      const speed = (i + 1) * 0.02;
      n.style.transform = `translateY(${s * speed}px) rotate(${s * speed * 0.02}deg)`;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);

// Show sidebar only when feature sections are reached
// Sidebar active only inside the feature sections (between first & last)
useEffect(() => {
  function handleScroll() {
    const first = featureStartRef.current;
    const last = sectionRefs.current[CATEGORY_ORDER[CATEGORY_ORDER.length - 1]]?.current;
    if (!first || !last) return;

    const firstTop = first.getBoundingClientRect().top;
    const lastBottom = last.getBoundingClientRect().bottom;

    const inFeatureZone =
      firstTop <= 120 &&       // entered feature area
      lastBottom >= 200;       // have NOT scrolled past last section

    setSidebarActive(inFeatureZone);
  }

  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();
  return () => window.removeEventListener("scroll", handleScroll);
}, []);



  // Flatten features for mega-grid and apply activeFilter
  const filteredItems = (() => {
    const cats = FILTER_MAP[activeFilter] || [];
    const list = [];
    cats.forEach((c) => {
      const arr = FEATURES[c] || [];
      arr.forEach((f) => list.push({ ...f, __category: c }));
    });
    return list;
  })();

  return (
    <div className="features-page">
      {/* HERO */}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">
              SCHOOLO — your school's 24×7 intelligent helping hand
            </h1>
            <p className="hero-sub">
              Not just digitalization — complete school intelligence with AI
              automation, trust & human-first workflows. 40+ modules that work
              together so your school runs better.
            </p>

            <div className="cta-row">
              <button className="btn primary">Explore Full Features</button>
              <button className="btn ghost">Book a Demo</button>
            </div>

            <div className="hero-kv">
              <div className="kv">
                <strong>40+</strong>
                <span>modules</span>
              </div>
              <div className="kv">
                <strong>Realtime</strong>
                <span>updates</span>
              </div>
              <div className="kv">
                <strong>AI</strong>
                <span>automation</span>
              </div>
            </div>
          </div>

          <div className="hero-right" ref={floatRef}>
            {/* Rotating sphere + floating icons */}
            <div className="sphere" aria-hidden>
              <svg width="220" height="220" viewBox="0 0 220 220">
                <defs>
                  <radialGradient id="g1" cx="50%" cy="30%">
                    <stop offset="0%" stopColor="#fff8e1" />
                    <stop offset="100%" stopColor="#ffe29a" />
                  </radialGradient>
                </defs>
                <circle cx="110" cy="110" r="100" fill="url(#g1)" />
              </svg>
            </div>

            {/* floating icons (absolute) */}
            <div className="float-icon i1" title="Attendance" aria-hidden>
              <svg viewBox="0 0 24 24" width="36" height="36">
                <path d="M12 2a9 9 0 1 0 .001 18.001A9 9 0 0 0 12 2zm0 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7 17c0-2.8 2.7-4 5-4s5 1.2 5 4" fill="#ffb300" />
              </svg>
            </div>

            <div className="float-icon i2" title="AI" aria-hidden>
              <svg viewBox="0 0 24 24" width="28" height="28">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#ffe082" />
              </svg>
            </div>

            <div className="float-icon i3" title="Timetable" aria-hidden>
              <svg viewBox="0 0 24 24" width="30" height="30">
                <path d="M3 7h18v13H3z" fill="#ffd54f" />
              </svg>
            </div>

            <div className="float-icon i4" title="Certificate" aria-hidden>
              <svg viewBox="0 0 24 24" width="26" height="26">
                <path d="M6 2h12v14H6z" fill="#fff59d" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Side nav toggle */}
      <button
  className="side-toggle"
  style={{
    opacity: sidebarActive ? 1 : 0,
    pointerEvents: sidebarActive ? "auto" : "none",
  }}
  aria-label={showSidebar ? "Hide contents" : "Show contents"}
  onClick={() => setShowSidebar((s) => !s)}
>

        {showSidebar ? "Close" : "Contents"}
      </button>

      {/* Sticky side nav */}
     <nav className={`side-nav ${(showSidebar && sidebarActive) ? "visible" : ""}`} aria-label="Feature sections">

        {CATEGORY_ORDER.map((c) => (
          <button
            key={c}
            className={`nav-item ${active === c ? "active" : ""}`}
            onClick={() => scrollTo(c)}
          >
            <span className="dot" />
            <span>{c}</span>
          </button>
        ))}
      </nav>

      {/* Floating icon bubbles (decorative) */}
      <div className="decor-bubbles" aria-hidden>
        <span className="bubble b1" />
        <span className="bubble b2" />
        <span className="bubble b3" />
      </div>

      <main className="content">
        {/* Problem vs Promise strip */}
        <section className="strip">
          <div className="strip-left">
            <h3>Most apps only do a fraction.</h3>
            <p className="muted">
              Attendance, homework, maybe reports — but schools need so much more.
            </p>
          </div>
          <div className="strip-right">
            <h3>Schoolo does everything.</h3>
            <p className="muted">
              From AI timetables and question papers to payslips, brand-building
              and bus fuel reporting — one unified platform.
            </p>
          </div>
        </section>

        {/* Category Cinematic horizontal (each category full-width staggered) */}
        {CATEGORY_ORDER.map((category, idx) => (
          <section
            className={`feature-section feature-style-${(idx % 4) + 1}`}
            ref={(el) => {
              sectionRefs.current[category].current = el;
              if (idx === 0) featureStartRef.current = el;
            }}
            data-cat={category}
            key={category}
          >
            <div className="section-inner">
              <motion.div
                className="section-media"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                {/* placeholder illustration */}
                <div className="illustration" aria-hidden>
                  <svg width="360" height="220" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid meet">
                    <rect x="0" y="0" width="360" height="220" rx="18" fill="#fff" stroke="#fff7e6" />
                    <g transform="translate(20,18)">
                      <rect width="140" height="30" rx="6" fill="#fff8e1" />
                      <rect y="46" width="320" height="12" rx="6" fill="#fff3d6" />
                      <rect y="70" width="280" height="12" rx="6" fill="#fff3d6" />
                      <rect y="94" width="240" height="12" rx="6" fill="#fff3d6" />
                    </g>
                  </svg>
                </div>
              </motion.div>

              <motion.div
                className="section-content"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h2 className="section-title">{category}</h2>
                <p className="section-lead">
                  Key capabilities that transform the way schools operate, taught
                  through meaningful automation and friendly UX.
                </p>

                <div className="feature-grid">
                  {FEATURES[category].map((f) => (
                    <article className="feature-card" key={f.title}>
                      <div className="feature-icon" aria-hidden>
                        <svg viewBox="0 0 24 24" width="28" height="28">
                          <circle cx="12" cy="8" r="3" fill="#ffd54f" />
                          <rect x="6" y="14" width="12" height="6" rx="2" fill="#fff3d6" />
                        </svg>
                      </div>
                      <div className="feature-body">
                        <h4>{f.title}</h4>
                        <p className="muted">{f.desc}</p>
                        <div className="meta">
                          <span>{f.users}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        ))}

        {/* MEGA GRID with filters */}
        <section className="mega-grid" aria-labelledby="mega-grid-title">
          <div className="grid-head">
            <h3 id="mega-grid-title">Complete Feature Universe</h3>
            <p className="muted">All modules in one glance — filter, discover and deep dive.</p>

            <div className="filters" role="tablist" aria-label="Feature filters">
              {Object.keys(FILTER_MAP).map((f) => (
                <button
                  key={f}
                  className={`chip ${activeFilter === f ? "active" : ""}`}
                  onClick={() => setActiveFilter(f)}
                  role="tab"
                  aria-selected={activeFilter === f}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-cards">
            {filteredItems.map((f) => (
              <div className="grid-card" key={f.title}>
                <div className="gc-icon" aria-hidden>
                  <svg width="36" height="36" viewBox="0 0 36 36">
                    <circle cx="18" cy="12" r="6" fill="#fff59d" />
                    <rect x="6" y="22" width="24" height="8" rx="3" fill="#fff3d6" />
                  </svg>
                </div>
                <div className="gc-body">
                  <strong>{f.title}</strong>
                  <p className="muted">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* comparison strip */}
        <section className="compare-strip">
          <h3> Replace 6+ apps — with one platform </h3>
          <div className="compare-grid">
            <div className="compare-col">
              <h4>What schools need</h4>
              <ul>
                <li>Attendance & Transport</li>
                <li>Homework & Assessments</li>
                <li>Certificates & IDs</li>
                <li>Payroll & Billing</li>
                <li>Branding & Events</li>
                <li>AI Insights</li>
              </ul>
            </div>
            <div className="compare-col">
              <h4>Other Apps</h4>
              <ul>
                <li>Partial — attendance</li>
                <li>Partial — homework</li>
                <li>Paid add-ons</li>
                <li>Manual payroll</li>
                <li>No branding tools</li>
                <li>Minimal analytics</li>
              </ul>
            </div>
            <div className="compare-col highlight">
              <h4>SCHOOLO</h4>
              <ul>
                <li>Complete Attendance Suite</li>
                <li>AI-backed assessments</li>
                <li>Auto certificates & IDs</li>
                <li>Payslips & ledgers</li>
                <li>Branding & marketing AI</li>
                <li>Predictive student analytics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="final-cta">
          <div className="cta-inner">
            <div>
              <h2>Ready to transform your school?</h2>
              <p className="muted">Schedule a personalised demo — we'll show you exactly how SCHOOLO will fit your workflows.</p>
              <div className="cta-row">
                <button className="btn primary">Book a Demo</button>
                <button className="btn ghost">Talk to Sales</button>
              </div>
            </div>
            <div className="cta-visual" aria-hidden>
              <svg width="260" height="160" viewBox="0 0 260 160">
                <rect width="260" height="160" rx="16" fill="#fff8e0" />
                <g transform="translate(18,20)">
                  <rect width="220" height="28" rx="8" fill="#fff2cc" />
                  <rect y="46" width="180" height="12" rx="6" fill="#fff6d6" />
                  <rect y="70" width="200" height="12" rx="6" fill="#fff6d6" />
                </g>
              </svg>
            </div>
          </div>
        </section>
      </main>

      {/* ===== CSS (same-file) ===== */}
      <style>{`
          :root{
            --yellow:#ffd54f;
            --accent:#ffca28;
            --muted:#6b7280;
            --radius:14px;
            --bg:#ffffff;
            --container: 1100px;
          }

          *{box-sizing:border-box}
          body{font-family:Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; margin:0; color:#0b1221; background:var(--bg)}
          .features-page{min-height:100vh}

          /* HERO */
          .hero{padding:72px 20px 40px; 
          background: linear-gradient(180deg, #fff 0%, #fffdfa 100%);
          margin-top: 30px;
          }
          .hero-inner{
          max-width:var(--container); 
          margin:0 auto; display:flex; 
          gap:40px; align-items:center;
          justify-content:space-between
          }
          .hero-left{
          flex:1;
          max-width: 58%
          }
          .hero-right{width:320px; height:320px; position:relative; display:flex; align-items:center; justify-content:center}
          .hero-title{font-size:36px; margin:0 0 14px; letter-spacing:-0.02em; font-weight:800}
          .hero-sub{color:var(--muted); margin:0 0 20px; font-size:16px; line-height:1.45}
          .cta-row{display:flex; gap:12px; margin-top:12px}
          .btn{display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 16px; border-radius:10px; border:1px solid transparent; font-weight:700; cursor:pointer}
          .btn.primary{background:var(--yellow); color:#111; box-shadow:0 6px 18px rgba(255,197,68,0.16)}
          .btn.ghost{background:transparent; border:1px solid #eee; color:#111}
          .hero-kv{display:flex; gap:18px; margin-top:18px}
          .kv{background:#fff; padding:12px 14px; border-radius:12px; box-shadow:0 6px 18px rgba(10,10,10,0.04); display:flex; flex-direction:column; gap:4px; width:110px; align-items:flex-start}
          .kv strong{font-size:18px}
          .kv span{color:var(--muted); font-size:13px}

          /* Floating icons */
          .float-icon{position:absolute; display:flex; align-items:center; justify-content:center; border-radius:10px; width:56px; height:56px; box-shadow:0 8px 18px rgba(12,12,12,0.08); background:linear-gradient(180deg, #fff, #fff9e6)}
          .float-icon.i1{left:20px; top:18px}
          .float-icon.i2{right:18px; top:38px}
          .float-icon.i3{left:40px; bottom:28px}
          .float-icon.i4{right:20px; bottom:18px}

          /* Side nav */
          .side-toggle{
            position:fixed;
            left:16px;
            top:120px;
            z-index:60;
            background:var(--yellow);
            border-radius:10px;
            padding:8px 10px;
            border:0;
            font-weight:700;
            box-shadow:0 8px 18px rgba(0,0,0,0.08);
            cursor:pointer;
          }

          .side-nav {
            position:fixed;
            left:16px;
            top:160px;
            display:flex;
            flex-direction:column;
            gap:10px;
            z-index:50;
            opacity: 0;
            transform: translateX(-10px);
            transition: 0.36s ease;
            pointer-events:none;
          }

          .side-nav.visible {
            opacity: 1;
            transform: translateX(0);
            pointer-events:auto;
          }

          .nav-item{display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:12px; background:rgba(255,255,255,0.8); border:1px solid rgba(10,10,10,0.03); cursor:pointer; font-size:14px}
          .nav-item.active{background:linear-gradient(90deg, #fff8e0, #fff1d0); box-shadow:0 6px 18px rgba(255,190,50,0.12)}
          .nav-item .dot{width:10px; height:10px; border-radius:50%; background:var(--yellow); display:inline-block; box-shadow:0 2px 6px rgba(0,0,0,0.08)}

          /* decorative bubbles */
          .decor-bubbles{position:fixed; right:24px; top:220px; z-index:0; pointer-events:none}
          .bubble{display:block; border-radius:50%; opacity:0.08}
          .b1{width:120px; height:120px; background:var(--yellow); margin:8px}
          .b2{width:80px; height:80px; background:#ffd9a0; margin:8px}
          .b3{width:40px; height:40px; background:#fff3d6; margin:8px}

          main.content{max-width:var(--container); margin:32px auto; padding:0 20px 80px}

          /* strip */
          .strip{display:flex; gap:20px; padding:26px; background:#fff; border-radius:12px; align-items:center; border:1px solid #fbf2d9; margin-bottom:30px}
          .strip-left h3, .strip-right h3{margin:0; font-size:18px}
          .strip .muted{color:var(--muted); margin:6px 0 0}

          /* feature section */
          .feature-section{padding:36px 0; margin-bottom:18px; border-radius:14px}
          .section-inner{display:flex; align-items:center; gap:28px}
          .section-media{flex:0 0 420px}
          .section-content{flex:1}
          .section-title{font-size:22px;margin:0 0 8px;font-weight:700}
          .section-lead{color:var(--muted); margin:0 0 18px}

          /* a few style variations for each section to avoid repetition */
          .feature-style-1{background:linear-gradient(180deg,#fffbef 0%,#fff 100%); padding:28px; border-radius:16px}
          .feature-style-2{background:linear-gradient(180deg,#fff 0%, #fffaf6 100%); padding:28px; border-radius:16px}
          .feature-style-3{background:linear-gradient(180deg,#fff 0%, #fbf8ff 100%); padding:28px; border-radius:16px}
          .feature-style-4{background:linear-gradient(180deg,#fff 0%, #f5fff7 100%); padding:28px; border-radius:16px}

          /* grid for features */
          .feature-grid{display:grid; grid-template-columns:repeat(2,1fr); gap:16px}
          .feature-card{display:flex; gap:12px; align-items:flex-start; padding:14px; background:#fff; border-radius:12px; box-shadow:0 6px 20px rgba(10,10,10,0.04); border:1px solid rgba(10,10,10,0.02); transform:translateY(20px); opacity:0; transition:all 0.6s cubic-bezier(.12,.9,.28,1)}
          .feature-card.reveal{transform:translateY(0); opacity:1}
          .feature-icon{width:52px; height:52px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:linear-gradient(180deg,#fff8e8,#fff5d6); flex-shrink:0; box-shadow:0 6px 18px rgba(0,0,0,0.04)}
          .feature-body h4{margin:0 0 6px; font-size:15px}
          .muted{color:var(--muted); font-size:13px}
          .meta{margin-top:8px; font-size:12px; color:#8a8f98}

          /* mega grid */
          .mega-grid{padding:28px; margin-top:20px; background:#fff; border-radius:16px; border:1px solid #f6ecd0}
          .grid-head{display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:14px}
          .filters{display:flex; gap:10px}
          .chip{
          background:#fff;
          border-radius:999px; 
          padding:8px 12px; 
          border:1px solid #f2e6c3; 
          cursor:pointer
          }
          .chip.active{
          background:linear-gradient(90deg,#fff7d6,#fff1c0)
          }
          .grid-cards{display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:16px}
          .grid-card{display:flex; gap:12px; background:#fff; padding:12px; border-radius:12px; align-items:flex-start; border:1px solid #fbf4db; box-shadow:0 6px 20px rgba(10,10,10,0.03)}
          .gc-icon{width:52px; height:52px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:linear-gradient(180deg,#fff8e0,#fff1c6)}
          .gc-body strong{display:block}

          /* compare strip */
          .compare-strip{margin-top:28px; background:#fff; padding:22px; border-radius:12px; border:1px solid #f6eed6}
          .compare-grid{display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-top:12px}
          .compare-col h4{margin:0 0 8px}
          .compare-col ul{padding-left:18px; margin:0}
          .compare-col.highlight{background:linear-gradient(90deg,#fff8e0,#fff1d0); border-radius:12px; padding:14px}

          /* final cta */
          .final-cta{margin-top:34px; padding:28px; background:linear-gradient(180deg,#fff 0%, #fffaf6 100%); border-radius:14px; display:flex; align-items:center; justify-content:space-between}
          .cta-inner{display:flex; gap:28px; align-items:center; width:100%}
          .cta-visual{flex-shrink:0}

          /* responsive */
          @media (max-width: 980px){
            .hero-inner{flex-direction:column; align-items:flex-start}
            .hero-left{max-width:100%}
            .hero-right{width:260px;height:260px; margin-top:18px}
            .section-inner{flex-direction:column}
            .feature-grid{grid-template-columns:1fr}
            .grid-cards{grid-template-columns:repeat(2,1fr)}
            .side-nav{display:none}
            .decor-bubbles{display:none}
          }
          @media (max-width: 600px){
            .grid-cards{grid-template-columns:1fr}
            .cta-row{flex-direction:column}
            .side-toggle{display:none}
          }
        `}</style>
    </div>
  );
}
