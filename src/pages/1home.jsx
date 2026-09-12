import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";
import bannerVideo from "../assets/banner.mp4";
import LogoGif from "../assets/Logo.gif";
import performanceImg from "../assets/performance.png";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HorizontalScroll from "./HorizontalScroll";

gsap.registerPlugin(ScrollTrigger);


export default function Home() {
  const [released, setReleased] = useState(false);
  const sectionRef = useRef(null);
  const horizontalRef = useRef(null);


  useLayoutEffect(() => {
  if (!sectionRef.current || !horizontalRef.current) return;

  const section = sectionRef.current;
  const scrollContent = horizontalRef.current;
  const panels = gsap.utils.toArray(".panel");
  const totalScrollWidth = scrollContent.scrollWidth;
  const viewportWidth = window.innerWidth;

  // ✅ Horizontal Scroll Animation
  gsap.to(scrollContent, {
    x: -(totalScrollWidth - viewportWidth),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${totalScrollWidth}`,
      scrub: true,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      // ✅ Watch scroll progress to activate pills dynamically
      onUpdate: (self) => {
        const progress = self.progress; // 0 → 1
        const index = Math.round(progress * (panels.length - 1));
        setActivePill(index);
      },
    },
  });

  // ✅ Cleanup
  return () => ScrollTrigger.getAll().forEach((st) => st.kill());
}, []);





  const setActivePill = (index) => {
    document.querySelectorAll(".pill").forEach((pill, i) => {
      pill.classList.toggle("active", i === index);
    });
  };


  // ✅ Scroll logic: release video after 1 viewport height
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const vh = window.innerHeight;

      if (scrollTop >= vh) setReleased(true);
      else setReleased(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ typing logic untouched
  const sentences = useMemo(
    () => [
      { text: "Hey Tanzee! Generate overall report of Sathvik from 7th grade.", image: LogoGif },
      { text: "Confused about your kid’s performance? Just ask me what you need.", image: performanceImg },
      { text: "Want to focus on weak students? I’ll highlight what needs attention.", image: "/images/focus.png" },
      { text: "Need real-time tracking of finances, marketing, and admissions? I’ve got you covered.", image: "/images/finance.png" },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    let typingSpeed = isDeleting ? 10 : 95;
    const fullText = sentences[index].text;

    const timer = setTimeout(() => {
      setText((prev) => {
        if (!isDeleting) {
          const next = fullText.substring(0, prev.length + 1);
          if (next === fullText) {
            const currentImage = sentences[index].image;
            const isGif =
              typeof currentImage === "string"
                ? currentImage.endsWith(".gif")
                : currentImage?.includes("Logo.gif");

            const delay = isGif ? 23000 : 1500;
            setTimeout(() => setIsDeleting(true), delay);
          }
          return next;
        } else {
          const next = fullText.substring(0, prev.length - 1);
          if (next === "") {
            setIsDeleting(false);
            setIndex((prevIndex) => (prevIndex + 1) % sentences.length);
            setFade(false);
            setTimeout(() => setFade(true), 50);
          }
          return next;
        }
      });
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, sentences]);

  return (
    <div>

      {/* ✅ FIRST FULL SCREEN VIDEO — NO FADE *
      <section
        className="video-container"
        style={{
          pointerEvents: released ? "none" : "auto",
          position: released ? "absolute" : "fixed",
          top: 0,
          left: 0
        }}
      >
        <video className="background-video" autoPlay loop muted playsInline src={bannerVideo} />

        <div className="video-text">
          <h1>
            Hi, I’m <span className="ai-name">Tanzedsfejawhuie</span>
          </h1>
          <p>Your intelligent personal AI assistant.</p>
        </div>
      </section>*/}

      {/* ✅ NORMAL SCROLL AFTER VIDEO */}
      <section className="hero-section">
        <div className="container">
          <section className="hero">
            <h1 className="hero-title">
              Hi, I’m <span className="ai-name">Tanzee</span> — your personal AI assistant.
            </h1>

            <div className="search-bar">
              <i className="fas fa-search search-icon"></i>
              <div className="search-text">{text}<span className="cursor" /></div>
              <div className="search-actions">
                <i className="fas fa-paperclip"></i>
                <i className="fas fa-microphone"></i>
                <i className="fas fa-location-arrow"></i>
              </div>
            </div>

            <div className="image-tab">
              <img src={sentences[index].image} alt="" className={`tab-image ${fade ? "fade-in" : "fade-out"}`} />
            </div>
          </section>
        </div>
      </section>

      <section ref={sectionRef} className="solutions-section">
  <div className="pills">
    <button className="pill active">AI Tools</button>
    <button className="pill">Automation</button>
    <button className="pill">Analytics</button>
    <button className="pill">Integration</button>
  </div>

  <div ref={horizontalRef} className="horizontal-scroll">
    <div className="panel ai-tools">
      <h2>AI Tools</h2>
      <p>Smart insights and predictions powered by advanced AI models.</p>
    </div>
    <div className="panel automation">
      <h2>Automation</h2>
      <p>Automate your daily tasks with our intelligent workflow system.</p>
    </div>
    <div className="panel analytics">
      <h2>Analytics</h2>
      <p>Visualize and understand your data in real time.</p>
    </div>
    <div className="panel integration">
      <h2>Integration</h2>
      <p>Connect your favorite tools and platforms effortlessly.</p>
    </div>
  </div>
</section>


   <section className="app-section">
  <div className="app-content">

    {/* Phone Wrapper with Glow & Frame */}
    <div className="phone-wrapper">
      <div className="phone-frame">
        <video
          className="phone-video"
          autoPlay
          loop
          muted
          playsInline
          src={bannerVideo}
        />
      </div>

      {/* Particle Glow */}
      <div className="phone-glow"></div>
    </div>

    {/* Text */}
    <div className="app-text">
      <h2>Everything has become easier on your phone.</h2>
      <p>So why not the foundation of everyone's life?</p>
      <p className="highlight">Education deserves the same upgrade.</p>

      <button className="download-btn">
        📲 Download App Now
      </button>
    </div>

  </div>
</section>




      <style >{`
        .scroll-container {
          position: relative;
          overflow-x: hidden;
        }

        .video-container {
          width: 100%;
          height: 100vh;
          z-index: 10;
        }

        .background-video {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-text {
          position: relative;
          z-index: 2;
          color: white;
          right: 5rem;
          text-align: right;
        }

        .hero-section {
          padding-top: 100vh; 
        }

        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .floating-hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .normal {
          padding: 6rem 2rem;
          min-height: 100vh;
        }
          .search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 50px;
  padding: 10px 18px;
  width: 90%;
  max-width: 700px;
  margin: 0 auto 2rem auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #ddd;
  transition: box-shadow 0.3s ease;
}

.search-bar:hover {
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.search-icon {
  font-size: 1.2rem;
  color: #777;
  margin-right: 12px;
}

.search-text {
  flex: 1;
  font-size: 1.1rem;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: "Segoe UI", sans-serif;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-actions i {
  font-size: 1.1rem;
  color: #777;
  cursor: pointer;
  transition: color 0.3s ease, transform 0.3s ease;
}

.search-actions i:hover {
  color: #000;
  transform: scale(1.2);
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  width: 2px;
  height: 1.2em;
  background: #333;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  from,
  to {
    background: transparent;
  }
  50% {
    background: #000;
  }
}

/* 🔸 Responsive Design */
@media (max-width: 600px) {
  .search-bar {
    width: 95%;
    padding: 8px 12px;
  }

  .search-text {
    font-size: 1rem;
  }

  .search-actions i {
    font-size: 1rem;
    gap: 10px;
  }
}
  .search-actions .fa-location-arrow {
  transform: rotate(45deg);
}
.search-actions .fa-location-arrow:hover {
  transform: rotate(45deg) scale(1.2);
  color: #000;
}
.search-actions .fa-microphone:hover {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); color: #000; }
  50% { transform: scale(1.3); color: #958c8cff; }
  100% { transform: scale(1); color: #000; }
}


.cursor {
  display: inline-block;
  margin-left: 2px;
  width: 2px;
  height: 1.2em;
  background: #f8f7f6ff;
  animation: blink 0.8s step-end infinite;
}
.search-bar:hover {
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
}
   .hero-subtitle {
              font-size: 1.3rem;
              margin-bottom: 2rem;
              display: inline-block;
              text-align: left;
            }
            .cursor {
              display: inline-block;
              margin-left: 2px;
              width: 2px;
              height: 1.2em;
              background: #f8f7f6ff;
              animation: blink 0.8s step-end infinite;
            }
            @keyframes blink {
              from,
              to {
                background: transparent;
              }
              50% {
                background: #f4f2edff;
              }
            }
            .background {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              z-index: 1;
              overflow: hidden;
            }
            .glass-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
            
              backdrop-filter: blur(4px);
            }

            /* Image Tab */
            .image-tab {
              width: 650px;
              height: 350px;
              margin-left: auto;
              margin-right: auto;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 10px;
              display: flex;
              justify-content: center;
              align-items: center;
              box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
              transition: all 0.5s ease;
            }
            .tab-image {
              max-width: 100%;
              max-height: 100%;
              border-radius: 10px;
              object-fit: contain;
              transition: opacity 0.5s ease;
            }
            .fade-in {
              opacity: 1;
            }
            .fade-out {
              opacity: 0;
            }

            /* Scroll Button */
            .scroll-btn {
              display: inline-block;
              margin-top: 2rem;
              font-size: 2rem;
              color: #878379ff;
              text-decoration: none;
              animation: bounce 1.5s infinite;
            }
            @keyframes bounce {
              0%,
              100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(10px);
              }
            }
              /* ✅ SOLUTIONS SECTION */
.solutions-section {
  position: relative;
  width: 100%;
  padding: 4rem 0;
  overflow: hidden;
  background: #ffffffff;
  color: #000000ff;
}

.pills {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.pill {
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  color: #000000ff;
  background: rgba(255,255,255,0.08);
  cursor: pointer;
  transition: 0.25s ease;
  font-weight: 500;
  backdrop-filter: blur(6px);
}

.pill:hover {
  background: rgba(255,255,255,0.15);
  transform: translateY(-2px);
}

.pill.active {
  background: linear-gradient(135deg, #ffd339, #ffb700);
  color: #000;
  font-weight: 600;
  box-shadow: 0 0 18px rgba(255,193,7,0.5);
}

/* ✅ HORIZONTAL SCROLL WRAPPER */
.horizontal-scroll {
  display: flex;
  gap: 2rem;
  width: 400%;
  padding: 1rem 3rem;
  scroll-behavior: smooth;
  will-change: transform;
}

/* ✅ PANELS / CARDS */
.panel {
  min-width: 80vw;
  height: 55vh;
  background: rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;

  backdrop-filter: blur(6px);
  transition: 0.3s ease;
  border: 1px solid rgba(255,255,255,0.12);
}

/*.panel:hover {
  transform: translate;
  box-shadow: 0 16px 45px rgba(0,0,0,0.55);
}*/

.panel h2 {
  font-size: 2rem;
  margin-bottom: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.panel p {
  font-size: 1.15rem;
  opacity: 0.85;
  line-height: 1.6;
}

/* ✅ Responsive */
@media (max-width: 768px) {
  .horizontal-scroll {
    padding: 1rem;
  }

  .panel {
    min-width: 90vw;
    height: 45vh;
    padding: 1.5rem;
  }

  .panel h2 {
    font-size: 1.6rem;
  }

  .panel p {
    font-size: 1rem;
  }
}
 /* ✅ App Promo Section */
.app-section {
  width: 100%;
  padding: 6rem 2rem;
  background: #000;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.app-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5rem;
  width: 85%;
  max-width: 1500px;
}

/* ✅ Phone animations + glow */
.phone-wrapper {
  position: relative;
  width: 40%;
  display: flex;
  justify-content: center;
  animation: slideLeft 1.2s ease forwards;
  opacity: 0;
}

/* ✅ Real Smartphone Frame */
.phone-frame {
  width: 330px;
  border-radius: 38px;
  padding: 10px;
  background: #fff;
  border: 3px solid #fff;
  box-shadow:
    0 0 40px rgba(255,193,7,0.4),
    0 0 120px rgba(255,193,7,0.25);
  position: relative;
  z-index: 2;
}

.phone-video {
  width: 100%;
  height: 100%;
  border-radius: 28px;
  object-fit: cover;
}

/* ✅ Soft Particle Glow Behind Phone */
.phone-glow {
  position: absolute;
  width: 450px;
  height: 450px;
  background: radial-gradient(
    circle,
    rgba(255,193,7,0.6) 0%,
    rgba(0,0,0,0.1) 70%,
    transparent 100%
  );
  filter: blur(60px);
  animation: floatGlow 6s ease-in-out infinite;
  z-index: 1;
}

/* ✅ Text animation */
.app-text {
  width: 50%;
  animation: slideRight 1.2s ease forwards;
  opacity: 0;
}

.app-text h2 {
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.app-text p {
  font-size: 1.3rem;
  opacity: 0.85;
}

.highlight {
  font-weight: 600;
  font-size: 1.4rem;
  margin-top: 1rem;
}

.download-btn {
  margin-top: 2rem;
  padding: 1rem 2.4rem;
  font-size: 1.2rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ffd339, #ffb700);
  border-radius: 50px;
  border: none;
  cursor: pointer;
  color: #000;
  box-shadow: 0 10px 25px rgba(255,193,7,0.45);
  transition: 0.3s ease;
}

.download-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 35px rgba(255,193,7,0.55);
}

/* ✅ Animations */
@keyframes slideLeft {
  0% { transform: translateX(-120px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
@keyframes slideRight {
  0% { transform: translateX(120px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
@keyframes floatGlow {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.1) translateY(-20px); }
}

/* ✅ Mobile */
@media (max-width: 768px) {
  .app-content {
    flex-direction: column;
    text-align: center;
  }
  .phone-wrapper, .app-text {
    width: 100%;
  }
  .phone-frame {
    width: 260px;
  }
}


      `}</style>
    </div>
  );
}
