  import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";  
  import LogoGif from "../assets/Logo.gif";
import logo from "../assets/logo.png";
const faqData = [
  {
    question: "What is SKHOOLO?",
    answer:
      "SKHOOLO is an AI-powered school management ecosystem with tools for academics, communication, finance, attendance, automation, and administration — all in one platform.",
  },
  {
    question: "What does SKHOOLO do for teachers?",
    answer:
      "Teachers can mark attendance in seconds, upload homework, track syllabus, generate question papers, manage classes, communicate with parents, and access digital resources.",
  },
  {
    question: "What does SKHOOLO do for parents?",
    answer:
      "Parents receive instant updates about attendance, homework, fees, bus location, events, and academic progress — all from a single app.",
  },
  {
    question: "How does SKHOOLO help school management?",
    answer:
      "Management gets real-time analytics, financial reports, academic insights, GPS-based tracking, automated ID cards/certificates, and powerful administrative tools.",
  },
  {
    question: "How fast is attendance marking?",
    answer:
      "SKHOOLO offers 3-second student attendance and GPS-verified teacher attendance, ensuring accuracy and transparency.",
  },
  {
    question: "Can SKHOOLO generate timetables automatically?",
    answer:
      "Yes. The AI-powered timetable generator creates conflict-free schedules for the entire school within minutes.",
  },
  {
    question: "Does SKHOOLO support homework and learning assistance?",
    answer:
      "Yes. SKHOOLO provides homework uploads, AI homework suggestions for teachers, AI homework guidance for students, and a resource library with study materials.",
  },
  {
    question: "How does the bus tracking work?",
    answer:
      "Schools can track buses live with GPS, view routes, track fuel usage, and send delay alerts to parents.",
  },
  {
    question: "Can SKHOOLO generate ID cards and certificates?",
    answer:
      "Yes. SKHOOLO automatically creates ID cards, certificates, and student IDs with QR/barcodes in seconds.",
  },
  {
    question: "How does SKHOOLO help with finances?",
    answer:
      "It includes online fee payments, auto bill generation, editable ledger reports, P&L dashboards, salary automation, payslip generation, and OCR-based bill scanning.",
  },
  {
    question: "What tools does SKHOOLO have for academics?",
    answer:
      "It includes a question paper generator, answer sheet scanner, academic analysis, teacher productivity tracker, syllabus progress monitor, and substitute teacher assignment.",
  },
  {
    question: "How does SKHOOLO ensure safe communication?",
    answer:
      "The chat system auto-blocks inappropriate language and provides secure parent–teacher messaging with admin visibility.",
  },
  {
    question: "Does SKHOOLO support event management?",
    answer:
      "Yes. Schools can upload event photos, generate greeting cards, manage announcements, and get AI ideas for events & quizzes.",
  },
  {
    question: "Is SKHOOLO customizable for each school?",
    answer:
      "Yes. Schools can choose modules, enable/disable features, and request additional tools.",
  },
  {
    question: "How long does it take to onboard a school?",
    answer:
      "Most schools get fully onboarded within 24–48 hours, including staff training and data setup.",
  },

  {
    question: "How does AI hazard detection enhance safety in high-risk mining environments?",
    answer:
      "Vision and sensor analytics identify hazards early and automatically trigger preventive measures.",
  },
  {
    question: "Can CAPA actions and permits be generated from findings with SLA tracking?",
    answer:
      "Yes. Findings automatically create CAPA and PTW workflows, assigning owners and due dates for each task.",
  },
  {
    question: "Can predictive maintenance minimize breakdowns for haul trucks, shovels, and conveyors?",
    answer:
      "Absolutely. AI models predict potential failures and schedule maintenance proactively to prevent unplanned downtime.",
  },
  {
    question: "How does integration with maintenance and planning systems work?",
    answer:
      "APIs synchronize assets, work orders, and key performance metrics with existing planning and maintenance platforms.",
  },
  {
    question: "Is offline functionality available for underground or remote locations?",
    answer:
      "Yes. Workflows operate offline and securely sync once connectivity is restored.",
  },
  {
    question: "Are environmental monitoring and regulatory compliance supported?",
    answer:
      "Yes. Environmental data and evidence help ensure compliance with regulatory standards.",
  },
  {
    question:
      "How are inspections digitized with media evidence and supervisor approvals?",
    answer:
      "Digital forms capture photos, videos, notes, and signatures, ensuring full traceability and accountability.",
  },
  {
    question: "How is crew access and data security managed across contractors and sites?",
    answer:
      "Role-based access control (RBAC) limits permissions by role and site, while encryption and audit logs safeguard all data.",
  },
  {
    question: "Do dashboards provide multi-site visibility for equipment, crews, and production?",
    answer:
      "Yes. Fleet and site dashboards offer insights into utilization, availability, and operational risks across all sites.",
  },
  {
    question: "What is the typical rollout timeline from pilot to full site adoption?",
    answer:
      "Pilots can be deployed in weeks, with expansion across areas or asset classes using preconfigured templates and training.",
  },
];

export default function Footer() {
  const [openIndex, setOpenIndex] = useState(null);
      const answerRefs = useRef([]);

      const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
      };
  return (
    <footer style={{ textAlign: "center", padding: "20px", background: "#fff" }}>
      <div style={{ padding: "50px 60px", maxWidth: "1200px", margin: "0 auto" }}>
  <h2
    style={{
      textAlign: "left",
      marginBottom: "40px",
      color: "#020539",
      fontSize: "32px",
      fontWeight: 600,
    }}
  >
    FAQ (Frequently Asked Questions)
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr", // always two columns
      gap: "20px",
      justifyContent: "start",
      textAlign: "left", // ✅ key fix — ensures text aligns left even when wrapping
    }}
  >
    {faqData.map((item, index) => (
      <div
        key={index}
        onClick={() => toggleFAQ(index)}
        style={{
          borderBottom: "1px solid #ccc",
          padding: "15px 20px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          transition: "background 0.3s ease",
          textAlign: "left", // ✅ ensures child text wraps properly
        }}
      >
        {/* Question Row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              color: "#020539",
              fontWeight: "500",
              textAlign: "left", // ✅ safe reinforcement
            }}
          >
            {item.question}
          </span>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "20px",
              color: "#020539",
            }}
          >
            {openIndex === index ? "−" : "+"}
          </span>
        </div>

        {/* Answer Section */}
        <div
          ref={(el) => (answerRefs.current[index] = el)}
          style={{
            maxHeight:
              openIndex === index
                ? `${answerRefs.current[index]?.scrollHeight}px`
                : "0px",
            overflow: "hidden",
            transition: "max-height 0.5s ease",
            textAlign: "left", // ✅ ensures paragraph wraps properly
          }}
        >
          <p
            style={{
              marginTop: "10px",
              fontSize: "15px",
              color: "#444",
              textAlign: "left",
            }}
          >
            {item.answer}
          </p>
        </div>
      </div>
    ))}
  </div>
</div>

<div className="footer-top-section">
  <div className="footer-blob"></div>

  

  {/* RIGHT FORM */}
  <div className="footer-right">
    <h3>Get in Touch</h3>
    <form className="footer-form">
      <input type="text" placeholder="Your Name" required />
      <input type="text" placeholder="School Name" required />
      <input type="number" placeholder="Mobile number" required />
      <input type="email" placeholder="Your Email" required />
     
      <button type="submit">Send Message</button>
    </form>
  </div>


  {/* LEFT GIF */}
  <div className="footer-left">
  <img src={LogoGif} alt="Skhoolo animation" className="footer-gif" />
</div>

</div>
<div class="footer">
<div class="footer-container">

 
    <div class="footer-column">
      <img src={logo} alt="TanzAI Logo"  class="footer-logo" />

      <p class="footer-desc">
        Schoolo — Smart Student Information, Real-time Communication & School Operations Made Easy.
      </p>

      <div class="footer-social">
        <a href="#"><i class="fab fa-facebook"></i></a>
        <a href="#"><i class="fab fa-instagram"></i></a>
        <a href="#"><i class="fab fa-linkedin"></i></a>
        <a href="#"><i class="fab fa-youtube"></i></a>
      </div>

      <button class="back-to-top" onclick="window.scrollTo({ top: 0, behavior: 'smooth' })">
        Back to Top ↑
      </button>
    </div>

    <div class="footer-column">
      <h3>Quick Links</h3>
      <ul>
        <li><a href="#">Features</a></li>
        <li><a href="#">Pricing</a></li>
        <li><a href="#">Modules Overview</a></li>
        <li><a href="#">Academic Intelligence</a></li>
        <li><a href="#">Communication & Engagement</a></li>
        <li><a href="#">Financial & Infrastructure Intelligence</a></li>
        <li><a href="#">Operations & Intelligence</a></li>
        <li><a href="#">Mobile App (Android / iOS)</a></li>
        <li><a href="#">Request a Demo</a></li>
        <li><a href="#">Success Stories</a></li>
      </ul>
    </div>

    
    <div class="footer-column">
      <h3>Contact</h3>
      <p><strong>Email:</strong> support@schoolo.com</p>
      <p><strong>Phone:</strong> +91 98765 43210</p>
      <p><strong>Address:</strong> Madhapur, Hyderabad</p>
      <p><strong>Working Hours:</strong> Mon–Sat, 9AM–6PM</p>
    </div>

  </div>
  </div>


      <p>© {new Date().getFullYear()} Schoolo. All rights reserved.</p>
       <style jsx>{`
       
/* 🌊 Overall Wrapper */
.footer-top-section {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 60px 60px;
  max-width: 1200px;
  margin: 0 auto 70px auto;
  gap: 40px;
  z-index: 1;
}

/* 🔵 Animated Blob Behind Everything */
.footer-blob {
  content: "";
  position: absolute;
  width: 300px;
  height: 300px;

  /* CENTER VERTICALLY */
  top: 50%;
  transform: translateY(-50%);

  /* POSITION HORIZONTALLY (RIGHT SIDE) */
  right: 18%;

  background: rgba(24, 108, 186, 0.4);
  border-radius: 50% 60% 40% 70% / 55% 65% 45% 60%;
  z-index: -1;
 
}

/* 🌀 Animation For Blob */
@keyframes blobFloat2 {
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-30px) scale(0.97); }
  100% { transform: translateY(0px) scale(1); }
}

/* 🎞 GIF Styling */
.footer-left {
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-gif {
  width: 90%;
  max-width: 380px;
  border-radius: 20px;
}

/* 📄 Form Styling */
.footer-right {
  background: #ffffff;
  padding: 30px 30px;
  border-radius: 20px;
  border: 3px solid rgba(24, 108, 186, 0.4);;
  height: 400px;
}

.footer-right h3 {
  margin-bottom: 20px;
  color: #020539;
  font-size: 24px;
  font-weight: 600;
}

.footer-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
  align-items: center;
}

.footer-form input,
.footer-form textarea {
  width: 90%;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 15px;
  outline: none;
}

.footer-form button {
  background: #020539;
  justify: center;
  color: white;
  padding: 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: 0.3s;
   width: 40%;
}

.footer-form button:hover {
  background: #6c6e80ff;
}

/* 📱 Responsive */
@media (max-width: 900px) {
  .footer-top-section {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.footer {
  background: #0d0d0d;
  color: #fff;
  padding: 60px 20px;
  width: 100%;
    margin: 0;
  padding-left: 0;
  padding-right: 0;
 
}



.footer-container {
  max-width: 1300px;
  margin: auto;
  display: flex;
  justify-content: space-between;

  gap: 40px;
  flex-wrap: wrap;
}

.footer-column {
  flex: 1;
  min-width: 250px;
}

/* Logo */
.footer-logo {
  width: 150px;
  margin-bottom: 15px;
}

/* Branding Text */
.footer-desc {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
  opacity: 0.8;
}

/* Social Icons */
.footer-social a {
  margin-right: 12px;
  font-size: 20px;
  color: #fff;
  text-decoration: none;
  transition: 0.3s;
}

.footer-social a:hover {
  color: #ffda6b;
}

/* Links */
.footer-column h3 {
  margin-bottom: 15px;
  font-size: 18px;
  border-left: 4px solid #ffda6b;
  padding-left: 10px;
}

.footer-column ul {
  list-style: none;
  padding: 0;
}

.footer-column ul li {
  margin: 8px 0;
}

.footer-column ul li a {
  color: #ccc;
  text-decoration: none;
  font-size: 14px;
  transition: 0.3s;
}

.footer-column ul li a:hover {
  color: #ffda6b;
}

/* Contact */
.footer-column p {
  font-size: 14px;
  margin: 6px 0;
}

/* Back to Top */
.back-to-top {
  margin-top: 20px;
  padding: 10px 18px;
  background: #ffda6b;
  border: none;
  cursor: pointer;
  font-weight: 600;
  border-radius: 6px;
  transition: 0.3s;
}

.back-to-top:hover {
  background: #f8cb45;
}

/* Responsive */
@media (max-width: 900px) {
  .footer-container {
    flex-direction: column;
    text-align: left;
  }
    }


          `}</style>
    </footer>
  );
}
