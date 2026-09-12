// src/pages/BookDemo.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * BookDemo.jsx
 * - Single-file component (React web)
 * - Inline CSS included at the bottom inside a <style> tag
 * - Requires framer-motion: `npm i framer-motion`
 *
 * Usage: import BookDemo from './pages/BookDemo'
 */

export default function BookDemo() {
  const [form, setForm] = useState({
    schoolName: "",
    name: "",
    mobile: "",
    email: "",
    city: "",
    date: "",
    timeslot: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const timeslots = [
    "09:00 AM - 09:30 AM",
    "10:00 AM - 10:30 AM",
    "11:00 AM - 11:30 AM",
    "02:00 PM - 02:30 PM",
    "04:00 PM - 04:30 PM",
  ];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Simple front-end validation
    if (!form.name || !form.email || !form.date || !form.timeslot) {
      alert("Please fill required fields: Name, Email, Date and Time slot.");
      return;
    }

    setSending(true);
    // Simulate API call
    setTimeout(() => {
      setSending(false);
      setSent(true);
      console.log("Demo booking submitted:", form);
      // reset if you want:
      // setForm({ schoolName: "", name: "", mobile: "", email: "", city: "", date: "", timeslot: "", message: "" });
    }, 900);
  }

  return (
    <div className="book-demo-page">
      {/* HERO */}
      <header className="hero">
        <motion.div
          className="hero-inner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-left">
            <h1>
              Book a <span>Live Demo</span> of SCHOOLO
            </h1>
            <p className="sub">
              See how SCHOOLO transforms school administration, teacher workflows,
              and parent engagement — live and personalised for your school.
            </p>

            <div className="hero-cta">
              <a href="#book-form" className="btn primary">
                Book a Demo
              </a>
              <a
                className="btn ghost"
                href="mailto:hello@schoolo.com?subject=Book%20a%20Demo%20-%20SCHOOLO"
              >
                Request Info
              </a>
            </div>

            <ul className="quick-points">
              <li>✅ 20-minute personalised walkthrough</li>
              <li>✅ See dashboards & parent app in action</li>
              <li>✅ Pricing and rollout plan included</li>
            </ul>
          </div>

          <motion.div
            className="hero-right"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <img
              src="/assets/demo-preview.png"
              alt="Demo preview"
              className="demo-mock"
            />
            <div className="badge">Live demo — no install required</div>
          </motion.div>
        </motion.div>
      </header>

      {/* TRANSITION SECTION */}
      <section className="transition-section">
        <motion.img
          src="/assets/school-transition.png"
          alt="School transformation"
          className="transition-img"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          className="transition-content"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2>Transform your school in 3 phases</h2>
          <p>
            Strategy → Implementation → Growth. In the demo we’ll map your school's
            needs to our modules and show a clear rollout plan with minimal
            disruption.
          </p>

          <div className="phases">
            <div className="phase">
              <strong>Phase 1</strong>
              <small>Audit & Quick Wins</small>
            </div>
            <div className="phase">
              <strong>Phase 2</strong>
              <small>Pilot </small>
            </div>
            <div className="phase">
              <strong>Phase 3</strong>
              <small>Full rollout & training</small>
            </div>
          </div>
        </motion.div>
      </section>

      {/* BOOK FORM + WHY */}
      <section className="main-grid">
        <motion.div
          id="book-form"
          className="form-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h3>Book your demo</h3>

          {!sent ? (
            <form onSubmit={handleSubmit} className="demo-form">
              <label>
                School name
                <input
                  name="schoolName"
                  value={form.schoolName}
                  onChange={handleChange}
                  placeholder="Ex: St. Mary's High School"
                />
              </label>

              <label>
                Your name <span className="req">*</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                />
              </label>

              <div className="row-2">
                <label>
                  Mobile
                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="+91 98XXXXXXXX"
                  />
                </label>

                <label>
                  Email <span className="req">*</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@school.com"
                  />
                </label>
              </div>

              <div className="row-2">
                <label>
                  City
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Hyderabad"
                  />
                </label>

                <label>
                  Preferred date <span className="req">*</span>
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </label>
              </div>

              <label>
                Time slot <span className="req">*</span>
                <select
                  name="timeslot"
                  value={form.timeslot}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose a slot</option>
                  {timeslots.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Message (optional)
                <textarea
                  name="message"
                  rows="4"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what you'd like to focus on..."
                />
              </label>

              <div className="form-cta">
                <button type="submit" className="btn primary" disabled={sending}>
                  {sending ? "Booking..." : "Confirm Booking"}
                </button>

                <a
                  className="btn ghost"
                  href={`https://wa.me/919000000000?text=${encodeURIComponent(
                    "Hi Schoolo, I'd like to book a demo. My preferred date: " +
                      (form.date || "—") +
                      ", slot: " +
                      (form.timeslot || "—")
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Book via WhatsApp
                </a>
              </div>
            </form>
          ) : (
            <div className="success">
              <h4>Thanks — your demo is booked!</h4>
              <p>We’ll email you the invite and a calendar link shortly.</p>
              <button
                className="btn primary"
                onClick={() => {
                  setSent(false);
                  setForm({
                    schoolName: "",
                    name: "",
                    mobile: "",
                    email: "",
                    city: "",
                    date: "",
                    timeslot: "",
                    message: "",
                  });
                }}
              >
                Book another
              </button>
            </div>
          )}
        </motion.div>

        <motion.aside
          className="why-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h3>Why book a demo?</h3>

          <ul className="why-list">
            <li>
              <strong>Tailored walkthrough</strong>
              <span>See only the modules that matter to you</span>
            </li>
            <li>
              <strong>Live Q&A</strong>
              <span>Talk to an expert and get rollout guidance</span>
            </li>
            <li>
              <strong>Practical pricing</strong>
              <span>Get an estimated plan and pilot options</span>
            </li>
            <li>
              <strong>Zero technical setup</strong>
              <span>No installations required for the demo</span>
            </li>
          </ul>

          
        </motion.aside>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Frequently asked questions
        </motion.h3>

        <div className="faqs">
          <motion.div
            className="faq"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            <strong>Is the demo free?</strong>
            <p>Yes — the demo is free and usually takes ~20 minutes.</p>
          </motion.div>

          <motion.div
            className="faq"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.16 }}
          >
            <strong>Who should attend?</strong>
            <p>
              Head of school / principal, admin head, and a teacher who will be
              using the system.
            </p>
          </motion.div>

          <motion.div
            className="faq"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.24 }}
          >
            <strong>Do we need to install anything?</strong>
            <p>No — demo is online. For pilots, we provide guided install options.</p>
          </motion.div>
        </div>
      </section>

      {/* Floating WhatsApp */}
    

      {/* INLINE CSS */}
      <style>{`
        :root{
          --primary: #5A4FF3;
          --primary-600: #473de2;
          --muted: #6b7280;
          --card-bg: #ffffff;
          --radius: 12px;
          --glass: rgba(255,255,255,0.85);
        }

        .book-demo-page{
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #0f172a;
          background: #fff;
          min-height: 100vh;
          padding-bottom: 80px;
          margin-top: 5%;
        }

        /* HERO */
        .hero{
          padding: 48px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-inner{
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 32px;
          align-items: center;
        }

        .hero-left h1{
          font-size: 34px;
          margin: 0 0 12px 0;
          line-height: 1.08;
        }

        .hero-left h1 span{
          color: var(--primary);
          background: linear-gradient(90deg, rgba(90,79,243,0.12), transparent);
          padding: 4px 6px;
          border-radius: 6px;
        }

        .hero-left .sub{
          color: var(--muted);
          margin-bottom: 18px;
          max-width: 620px;
        }

        .hero-cta .btn{
          display: inline-block;
          margin-right: 12px;
          text-decoration: none;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
        }

        .btn.primary{
          background: linear-gradient(90deg,var(--primary),var(--primary-600));
          color: white;
          box-shadow: 0 8px 24px rgba(90,79,243,0.12);
        }

        .btn.ghost{
          background: transparent;
          color: var(--primary);
          border: 1px solid rgba(90,79,243,0.12);
        }

        .quick-points{
          margin-top: 18px;
          display: flex;
          gap: 12px;
          list-style: none;
          padding: 0;
          color: var(--muted);
        }

        .hero-right{
          position: relative;
        }

        .demo-mock{
          width: 100%;
          border-radius: 14px;
          box-shadow: 0 18px 40px rgba(16,24,40,0.06);
          display: block;
        }

        .badge{
          position: absolute;
          bottom: 14px;
          left: 14px;
          background: rgba(255,255,255,0.9);
          padding: 8px 10px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          box-shadow: 0 6px 20px rgba(16,24,40,0.06);
        }

        /* TRANSITION SECTION */
        .transition-section{
          display: flex;
          gap: 28px;
          align-items: center;
          padding: 28px 20px;
          max-width: 1200px;
          margin: 0 auto;
          margin-top: 6px;
        }

        .transition-img{
          width: 360px;
          border-radius: var(--radius);
          box-shadow: 0 20px 40px rgba(16,24,40,0.06);
        }

        .transition-content h2{
          margin: 0 0 8px 0;
          font-size: 22px;
        }

        .transition-content p{
          color: var(--muted);
          margin-bottom: 16px;
        }

        .phases{
          display: flex;
          gap: 12px;
        }

        .phase{
          background: var(--card-bg);
          padding: 12px;
          border-radius: 10px;
          box-shadow: 0 8px 22px rgba(16,24,40,0.04);
          min-width: 120px;
        }

        .phase strong{ display:block; font-size: 15px; }
        .phase small{ color: var(--muted); }

        /* MAIN GRID */
        .main-grid{
          max-width: 1200px;
          margin: 28px auto;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 28px;
          padding: 20px;
        }

        .form-card{
          background: var(--card-bg);
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 20px 50px rgba(16,24,40,0.06);
        }

        .form-card h3 { margin-top: 0; }

        .demo-form label{
          display:block;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .demo-form input,
        .demo-form select,
        .demo-form textarea{
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid #e6e9ee;
          margin-top: 6px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }

        .row-2{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .req{ color: var(--primary); margin-left:6px; font-weight:700; }

        .form-cta{
          display:flex;
          gap:12px;
          margin-top: 14px;
        }

        .why-card{
          background: linear-gradient(180deg,var(--glass), rgba(255,255,255,0.84));
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 12px 28px rgba(16,24,40,0.05);
          backdrop-filter: blur(6px);
        }

        .why-card h3{ margin-top:0; }

        .why-list{ padding:0; list-style:none; margin: 12px 0 18px 0; }
        .why-list li{ margin-bottom: 12px; }
        .why-list strong{ display:block; }

        .testimonials h4{ margin-bottom: 12px; }
        .t-cards{ display:flex; flex-direction: column; gap: 10px; }
        .t-card{ display:flex; gap: 10px; align-items:center; background:#fff; padding:8px; border-radius:10px; box-shadow: 0 6px 18px rgba(16,24,40,0.04); }
        .t-card img{ width:44px; height:44px; border-radius:8px; object-fit:cover; }

        /* FAQ */
        .faq-section{ max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .faq-section h3{ margin-bottom: 16px; }
        .faqs{ display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .faq{ background:#fff; border-radius:10px; padding:12px; box-shadow: 0 8px 20px rgba(16,24,40,0.04); }
        .faq strong{ display:block; margin-bottom:6px; }

        /* Whatsapp FAB */
        .whatsapp-fab{
          position: fixed;
          right: 20px;
          bottom: 20px;
          background: linear-gradient(90deg,var(--primary),var(--primary-600));
          color: white;
          width: 54px;
          height: 54px;
          border-radius: 999px;
          display: flex;
          align-items:center;
          justify-content:center;
          box-shadow: 0 14px 40px rgba(74,63,210,0.18);
          z-index: 99;
          text-decoration: none;
        }

        /* Responsive */
        @media (max-width: 980px){
          .hero-inner{ grid-template-columns: 1fr; }
          .hero-right{ order: -1; margin-bottom: 18px; }
          .transition-section{ flex-direction: column; text-align:center; }
          .main-grid{ grid-template-columns: 1fr; }
          .faqs{ grid-template-columns: 1fr; }
        }

        @media (max-width: 520px){
          .demo-mock{ display:none; }
          .quick-points{ flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
