  import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";  
  import performanceImg from "../assets/performance.png";
  import sampleImg from "../assets/logo.png"; 
  import securityImg from "../assets/focus.png"; // your image
import controlImg from "../assets/Phone1.png"; // your image
// 👈 new image for scroll section

import LogoGif from "../assets/Logo.gif";
import bannerVideo from "../assets/banner.mp4";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";





gsap.registerPlugin(ScrollTrigger);

const approchData = [
  {
    category: "Manual Processes & Paperwork",
    problems: [
      "Teachers waste valuable class time marking attendance manually.",
      "Homework distribution and tracking take hours and often go unrecorded.",
      "Preparing student progress reports manually causes delays and errors.",
      "Notes, e-books, and class materials are scattered across WhatsApp or printouts.",
      "Schools spend hours creating and verifying ID cards and certificates.",
      "Teachers spend hours setting balanced question papers manually.",
      "Manual timetable adjustments create confusion and class clashes.",
      "Answer sheets are evaluated manually, increasing workload and reducing accuracy.",
    ],
    solutions: [
      "One-tap digital attendance with instant parent notifications and daily summaries.",
      "Smart homework upload, AI tracking, and auto reminders for timely submissions.",
      "Auto-generated progress reports and AI-powered marksheet scanning ensure instant, accurate results.",
      "Centralized digital library where teachers upload notes, videos, and e-books for instant student access.",
      "Auto ID and certificate generation with integrated QR/barcode security.",
      "AI-based question paper generation using syllabus data and previous exam patterns.",
      "AI timetable builder that updates instantly with conflict detection and auto substitution.",
      "OCR-based automated evaluation that reduces teacher workload and speeds up result processing.",
    ],
  },
  {
    category: "Disconnected Communication",
    problems: [
      "Important updates are lost in scattered chat groups.",
      "Parents miss circulars, homework updates, or event details.",
      "There’s no unified system for teachers to communicate with parents securely.",
      "Event photos and media sharing often happen over unsecured platforms.",
      "Emergency alerts or schedule changes don’t reach everyone promptly.",
      "Feedback collection from parents or students is inconsistent.",
      "Announcements often go unnoticed or duplicated across platforms.",
      "No structured record of teacher-parent communications exists for accountability.",
    ],
    solutions: [
      "Centralized communication platform connecting parents, teachers, and management in one place.",
      "AI chat moderation ensures safe, professional, and respectful communication.",
      "Smart announcements and event alerts with delivery confirmation tracking.",
      "Photo and media sharing with admin approval and privacy protection.",
      "Emergency alerts broadcast instantly to all users with confirmation status.",
      "Feedback and support channels for structured two-way communication.",
      "School calendar syncs holidays, events, and deadlines for all users automatically.",
      "Communication logs and insights help schools measure engagement and responsiveness.",
    ],
  },
  
];


  export default function Home() {
     const refs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.3 }
    );

    refs.current.forEach((el) => el && observer.observe(el));
  }, []);

 const features = [
    { name: "3-sec Attendance", skoloo: "✔", other: "✖" },
    { name: "Bus Tracking", skoloo: "✔", other: "Limited" },
    { name: "AI Timetable", skoloo: "✔", other: "✖" },
    { name: "Certificate Automation", skoloo: "✔", other: "✖" },
    { name: "Parent Engagement", skoloo: "98%", other: "40–50%" },
  ];
    const whyRef = useRef(null);

useEffect(() => {
  const section = whyRef.current;
  if (!section) return; // safety check

  const counters = section.querySelectorAll(".num");

  const startCounting = () => {
    counters.forEach(counter => {
      const update = () => {
        const target = +counter.getAttribute("data-target");
        const current = +counter.innerText;
        const increment = target / 80;

        if (current < target) {
          counter.innerText = Math.ceil(current + increment);
          setTimeout(update, 20);
        } else {
          counter.innerText = target;
        }
      };
      update();
    });
  };

  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) {
        startCounting();
        observer.disconnect(); // stop observing after first run
      }
    },
    { threshold: 0.4 }
  );

  observer.observe(section);
}, []);


      // ✅ Scroll visibility animation
 
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

 const heroRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            hero.classList.add("animate");
            observer.unobserve(hero); // run once only
          }
        });
      },
      { threshold: 0.2 } // trigger when 20% of the section is visible
    );

    if (hero) observer.observe(hero);
    return () => observer.disconnect();
  }, []);

const mobileRef = useRef(null);
const [visible, setVisible] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect(); // 👈 triggers only once
      }
    },
    { threshold: 0.3 }
  );

  if (mobileRef.current) observer.observe(mobileRef.current);
  return () => observer.disconnect();
}, []);

const mobileRef1 = useRef(null);
const [visible1, setVisible1] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect(); // 👈 triggers only once
      }
    },
    { threshold: 0.3 }
  );

  if (mobileRef1.current) observer.observe(mobileRef1.current);
  return () => observer.disconnect();
}, []);




  const setActivePill = (index) => {
    document.querySelectorAll(".pill").forEach((pill, i) => {
      pill.classList.toggle("active", i === index);
    });
  };

/*approch*/

  const containerRef = useRef();
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const sections = Array.from(container.children);

    const handleScroll = () => {
      const scrollY = window.scrollY + window.innerHeight / 3;
      let active = sections.length - 1;

      for (let i = 0; i < sections.length; i++) {
        if (scrollY < sections[i].offsetTop) {
          active = i - 1;
          break;
        }
      }
      if (active < 0) active = 0;
      setActiveCategory(active);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);




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
        <style jsx>{`
        .body{
         background:linear-gradient(120deg, #e0e0e0, #fafafa);}



         .video-container {
          width: 100%;
          height: 100vh;

          
        }

        .background-video {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

      .video-text {
  position: absolute;
  top: 50%;
  left: 70%;
  transform: translate(-50%, -50%); /* centers it perfectly */
  z-index: 2;
  color: #000000;
  text-align: center;
}

.container {
  display: flex;
  flex-direction: row; /* side-by-side alignment */
  justify-content: space-between; /* space between tabs */
  align-items: flex-start; /* align items at the top */
 
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  
  position: relative; /* allows floating elements inside */
 
}
.container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: 12px;
  position: relative;
  
  /* the transform origin is important */
  transform-origin: top left;
}

/* On laptop screens */
@media screen and (max-width: 1919px) {
  .container {
    transform: scale(0.80);  /* shrink the container */
    width: 125%;             /* compensate for the scale */
  }
}


          
.hero {
  min-height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #9c9d9dff;
  overflow: hidden;
  font-family: "Segoe UI", sans-serif;
  box-sizing: border-box;

  opacity: 0;
  transform: translateX(-100px);
  transition: all 1s ease-out;
  transform-origin: top left;
}
  @media screen and (max-width: 1919px) {
  .container {
    transform: scale(0.80);  /* shrink the container */
    width: 125%;             /* compensate for the scale */
  }
}

.hero.animate {
  opacity: 1;
  transform: translateX(0);
}


@keyframes slideInLeft {
  0% {
    opacity: 0;
    transform: translateX(-100px);
  }
  70% {
    opacity: 1;
    transform: translateX(20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
            .hero-content {
              position: relative;
              margin-top: 80px;
              z-index: 2;
              max-width: 800px;
              padding: 0 1rem;
            }
            .hero-title {
              font-size: 2rem;
              font-weight: 700;
              margin-bottom: 1rem;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            .ai-name {
              color: #1b1812ff;
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
  width: 100%;
  height: 100%;
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
              color: #f4c430;
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
  margin-top: 5%;
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




/* ✅ Panel Text Styling */
/* ✅ PANEL STYLING (White Background Friendly Glassmorphism) */
.panel {
  min-width: 100vw;
  height: 70vh;

 
  padding: 3rem 4rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;

  
 
 
  transition: all 0.4s ease;
}



/* Panel Headings & Paragraphs */
.panel h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.4rem;
  text-align: center;
}

.panel p {
  font-size: 1.1rem;
  color: #444;
  max-width: 780px;
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* ✅ Mobile Friendly */
@media (max-width: 768px) {
  .panel h2 {
    font-size: 1.8rem;
  }

  .panel p {
    font-size: 1rem;
    padding: 0 1rem;
  }
}

/* ✅ Center Responsiveness */
@media (max-width: 768px) {
  .panel h2 {
    font-size: 1.8rem;
  }

  .panel p {
    font-size: 1rem;
    padding: 0 1rem;
  }
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
  boxShadow: "0 20px 40px rgba(184, 17, 17, 0.2)"
  /*box-shadow:
    0 0 40px rgba(255,193,7,0.4),
    0 0 120px rgba(255,193,7,0.25);*/
  position: relative;
  z-index: 2;
}
iphone-frame{
 width: 330px;
  border-radius: 38px;
  padding: 10px;
  background: #fff;
  border: 3px solid #fff;
  boxShadow: "0 20px 40px rgba(184, 17, 17, 0.2)"
  /*box-shadow:
    0 0 40px rgba(255,193,7,0.4),
    0 0 120px rgba(255,193,7,0.25);*/
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
  /* ====== HERO CONTAINER ====== */
    .floating-hero {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100%;
      flex-direction: column;
      overflow: hidden;
      font-family: "Segoe UI", sans-serif;
    }

    .hero-content {
      text-align: center;
      position: relative;
      z-index: 2;
      
    }

    /* ====== FLOATING TAB CONTAINER ====== */
    .tab-box {
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
    }

    /* ====== TAB ITEM ====== */
    .tab-item {
      width: 300px;
      height: 60px;
      background: #fff;
      color: #000;
      border-radius: 40px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.1rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      animation: slideIn 1.3s ease-out forwards;
    }

    .tab-item:nth-child(1) {
      animation-delay: 0.3s;
    }

    .tab-item:nth-child(2) {
      animation-delay: 0.8s;
    }

    .tab-item:nth-child(3) {
      animation-delay: 1.3s;
    }

    /* ====== SLIDE-IN ANIMATION ====== */
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
      

    /* ====== RESPONSIVE ====== */
    @media (max-width: 768px) {
      .tab-item {
        width: 250px;
        height: 50px;
        font-size: 1rem;
      }
    }



    .imagination-section {
  width: 100%;
  background: #fff;
  padding: 120px 0;
  overflow: hidden;
  height: 100%;
}

.imagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.imagination-left {
  flex: 1;
  transform: translateX(-80px);
  opacity: 0;
  animation: slideInLeft 1.4s ease-out forwards;
}

.imagination-right {
  flex: 1;
  transform: translateX(80px);
  opacity: 0;
  animation: slideInRight 1.4s ease-out 0.4s forwards;
}

.imagination-heading {
  font-family: "Poppins", sans-serif;
  font-size: 2.8rem;
  font-weight: 700;
  color: #222;
  line-height: 1.3;
  margin-bottom: 25px;
}

.imagination-subtext {
  font-family: "Hind Siliguri", sans-serif;
  font-size: 1.2rem;
  color: #555;
  line-height: 1.6;
}

.mobile-frame {
  width: 100%;
  max-width: 350px;
  border-radius: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

/* ✨ Animations */
@keyframes slideInLeft {
  from {
    transform: translateX(-80px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(80px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 📱 Mobile Responsive */
@media (max-width: 768px) {
  .imagination-container {
    flex-direction: column;
    text-align: center;
  }
  .imagination-left,
  .imagination-right {
    transform: none;
    animation: fadeIn 1.2s ease-out forwards;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

.imagination-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5rem;
  opacity: 0;
  transition: opacity 0.8s ease;
}

.imagination-container.visible {
  opacity: 1;
}

.phone-frame {
  transform: translateX(-80px);
  opacity: 0;
  transition: all 1.2s ease-out;
}

.imagination-right {
  transform: translateX(80px);
  opacity: 0;
  transition: all 1.2s ease-out;
}

.imagination-container.visible .phone-frame,
.imagination-container.visible .imagination-right {
  transform: translateX(0);
  opacity: 1;
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
  /* Right side (text) */
.text-frame {
  transform: translateX(80px);
  opacity: 0;
  transition: all 1.2s ease-out;
}

/* Both become visible */
.imagination-container.visible .phone-frame {
  transform: translateX(0);
  opacity: 1;
  transition-delay: 0.1s;
}

.imagination-container.visible .text-frame {
  transform: translateX(0);
  opacity: 1;
  transition-delay: 0.4s;
}
  /*pannel*/
  /* ✅ Feature Cards Grid */
.feature-grid {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  align-items: stretch;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.feature-card {
  background: #fff;
  border-radius: 16px;
  flex: 1 1 240px;
  max-width: 260px;
  min-height: 200px;
  padding: 1.8rem 1.4rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 1rem;
}

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

/* ✅ Header with icon + title */
.feature-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.7rem;
}

.feature-header i {
  font-size: 1.4rem;
  color: #ff7b00;
}

.feature-header h3 {
  font-size: 1.1rem;
  color: #222;
  font-weight: 600;
}

/* ✅ Bullet List */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  position: relative;
  padding-left: 1.4rem;
  color: #555;
  font-size: 0.92rem;
  line-height: 1.5;
  margin-bottom: 0.4rem;
}

/* custom bullet */
.feature-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #ff7b00;
  font-size: 1.2rem;
  line-height: 1;
}
.feature-card {
  position: relative;
  overflow: hidden;
  background: #fff;
  border-radius: 16px;
  flex: 1 1 240px;
  max-width: 260px;
  min-height: 180px;
  padding: 1.8rem 1.2rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
  text-align: left;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* ✅ Overlay effect */
.feature-card::after {
  content: "Know More →";
  position: absolute;
  top: 0;
  left: -100%; /* start hidden from card’s own left edge */
  width: 100%;
  height: 100%;
  background: rgba(255, 236, 160, 0.92); /* softer yellow */
  color: #000;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.3px;
  transition: all 0.45s ease;
  cursor: pointer;
  border-radius-top: 16px; /* match shape */
}

/* ✅ Hover animation: slide in from the card’s left edge */
.feature-card:hover::after {
  left: 0;
}

/* subtle scale + shadow for hover */
.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}


.feature-card p {
  font-size: 0.95rem;
  color: #555;
  line-height: 1.4;
}

/* ✅ Bulletins */
.bulletins {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.bulletins span {
  background: linear-gradient(135deg, #ffb400, #ff7b00);
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 8px rgba(255, 123, 0, 0.25);
  transition: all 0.3s ease;
}

.bulletins span:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(255, 123, 0, 0.4);
}

/* ✅ Responsive */
@media (max-width: 768px) {
  .panel {
    height: auto;
    padding: 2rem 1.5rem;
  }

  .panel h2 {
    font-size: 1.6rem;
  }

  .panel p {
    font-size: 1rem;
  }

  .feature-grid {
    flex-direction: column;
    align-items: center;
  }

  .feature-card {
    max-width: 100%;
  }
}
.hero-heading1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.approch {
  display: flex;
  background: #fff;
  padding: 100px 40px;
  font-family: "Poppins", sans-serif;
  
  
}

/* ===== LEFT SIDEBAR ===== */
.tabet {
  flex: 0 0 250px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  position: sticky;
  top: 50%;
  
  height: fit-content;
  
}

.tab {
  padding: 12px 20px;
  background: #e0e0e0;
  border-radius: 30px;
  font-weight: 600;
  color: #555;
  transition: all 0.3s ease;
  cursor: pointer;
}

.tab.active {
  background: #ff7f50;
  color: white;
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(255, 127, 80, 0.3);
}

/* ===== RIGHT CONTENT ===== */
.approch-content {
  flex: 1;
  padding-left: 60px;
  display: flex;
  flex-direction: column;
  gap: 100px;
}

.approch-section h2 {
  font-size: 1.8rem;
  margin-bottom: 30px;
  color: #222;
}

/* ===== SPLIT GRID ===== */
.split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

/* ===== PROBLEMS & SOLUTIONS COLUMNS ===== */
.split {
  background: #fff;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.split h3 {
  font-size: 1.2rem;
  margin-bottom: 20px;
  font-weight: 600;
}

.problems h3 {
  color: #e74c3c;
}

.solutions h3 {
  color: #27ae60;
}

/* ===== ITEMS ===== */
.split-item {
  margin-bottom: 18px;
  font-size: 0.95rem;
  color: #555;
  line-height: 1.5;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
}

.split-item.fade-in {
  opacity: 1;
  transform: translateY(0);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 900px) {
  .approch {
    flex-direction: column;
    padding: 60px 20px;
  }

  .tabet {
    flex-direction: row;
    overflow-x: auto;
    margin-bottom: 30px;
  }

  .approch-content {
    padding-left: 0;
  }

  .split-grid {
    grid-template-columns: 1fr;
  }
}

.video-section {
  width: 50%;
  margin: 0 auto;     /* THIS centers the whole section */
  padding: 80px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}


.video-box {
  width: 80%;
  max-width: 1200px;
  border: 2px solid #96b19bff;
  border-radius: 20px;
  padding: 50px;
  display: flex;
  align-items: center;
  position: relative;
  background: #fff;
  height: 350px;
}

/* LEFT CONTENT */
.video-content {
  width: 50%;
}

.video-content h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 15px;
}

.video-content p {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 20px;
  color: #333;
}

.watch-btn {
  padding: 12px 26px;
  background: #ffc734;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

/* RIGHT VIDEO FRAME */
.video-frame {
  width: 65%;
  position: absolute;
  right: -20%; /* This pushes video out of the box */
  top: 50%;
  transform: translateY(-50%);
}

.video-frame iframe {
  width: 100%;
  height: 320px;
  border-radius: 16px;
  border: none;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .video-box {
    flex-direction: column;
    padding: 40px 20px;
  }

  .video-content {
    width: 100%;
    text-align: center;
  }

  .video-frame {
    position: relative;
    width: 100%;
    right: 0;
    margin-top: 25px;
    transform: none;
  }

  .video-frame iframe {
    height: 230px;
  }
}
  /* MAIN SECTION */
.why-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 100px 10%;
  position: relative;
  gap: 60px;
  overflow: hidden;
}

/* LEFT SECTION */
.why-left {
  width: 50%;
  position: relative;
}

.accent-line {
  width: 4px;
  height: 80px;
  background: linear-gradient(180deg, #7a5cff, #b28dff);
  border-radius: 6px;
  margin-bottom: 20px;
  animation: slideDown 1s ease;
}

@keyframes slideDown {
  from { height: 0; }
  to { height: 80px; }
}

.why-heading h2 {
  font-size: 42px;
  font-weight: 700;
  margin: 0;
  opacity: 0;
  animation: slideLeft 1s ease forwards 0.3s;
}

.why-heading .sub {
  opacity: 0;
  margin-top: 8px;
  font-size: 17px;
  color: #555;
  animation: fadeIn 1s ease forwards 0.6s;
}

/* TEXT */
.why-text p {
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 18px;
  opacity: 0;
  animation: fadeUp 1s ease forwards 0.8s;
}

/* ANIMATIONS */
@keyframes slideLeft {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* RIGHT SIDE (STATS) */
.why-right {
  width: 40%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  z-index: 2;
}

.stat-card {
  background: #fff;
  border-radius: 16px;
  padding: 30px 20px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  text-align: center;
  animation: zoomIn 1s ease forwards 1s;
}

@keyframes zoomIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.stat-card .num {
  font-size: 42px;
  font-weight: 700;
  color: #7a5cff;
  display: block;
  margin-bottom: 6px;
}

/* BACKGROUND BLOBS */
.blob {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.4;
  z-index: 1;
  animation: float 6s ease-in-out infinite alternate;
}

.blob1 {
  background: #d4c8ff;
  top: -40px;
  right: 10%;
}

.blob2 {
  background: #f4d5ff;
  bottom: -50px;
  left: 5%;
}

@keyframes float {
  from { transform: translateY(0); }
  to { transform: translateY(40px); }
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .why-section {
    flex-direction: column;
  }
  .why-left, .why-right {
    width: 100%;
  }
}

.security-section-wrapper {
          width: 100%;
          padding: 80px 0;
          background: linear-gradient(180deg, #fdf7e3 0%, #ffffff 100%);
        }

        .section-title {
          text-align: center;
          font-size: 38px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .section-subtitle {
          text-align: center;
          font-size: 18px;
          opacity: 0.7;
          margin-bottom: 40px;
        }

        /* ---------- GRID --------- */
        .security-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 28px;
          width: 90%;
          margin: auto;
        }

        .security-card {
          background: #fff;
          padding: 26px;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .security-card:hover {
          transform: translateY(-6px);
          border-color: #f7d55b;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .security-icon {
          font-size: 34px;
          margin-bottom: 12px;
        }

        /* ---------- DATA CONTROL SECTION ---------- */
        .control-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 90%;
          margin: 100px auto 0;
          gap: 40px;
        }

        .control-text {
          flex: 1;
        }

        .control-text h2 {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .control-sub {
          font-size: 18px;
          opacity: 0.75;
          margin-bottom: 20px;
        }

        .control-list li {
          font-size: 17px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }

        .learn-more-btn {
          margin-top: 20px;
          padding: 12px 24px;
          background: #ffdd57;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
        }

        .learn-more-btn:hover {
          background: #f7c842;
        }

        .control-image img {
          width: 480px;
          max-width: 100%;
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.1);
        }

        /* ---------- ANIMATIONS ---------- */
        .fade-up, .slide-left, .slide-right {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s ease-out;
        }

        .slide-left {
          transform: translateX(-50px);
        }

        .slide-right {
          transform: translateX(50px);
        }

        .visible {
          opacity: 1 !important;
          transform: translateX(0) translateY(0) !important;
        }

        /* ---------- RESPONSIVE ---------- */
        @media (max-width: 900px) {
          .control-section {
            flex-direction: column;
            text-align: center;
          }

          .control-text {
            order: 2;
          }

          .control-image {
            order: 1;
          }
        }


          `}</style>
<div className="body"></div>



      <section
        className="video-container"
        
      >
        <video className="background-video" autoPlay loop muted playsInline src={bannerVideo} />

        <div className="video-text">
          <h1>
            WELCOME TO SCHOOLO
          </h1>
          <p>Your intelligent personal AI assistant.</p>
        </div>
      </section>

      
        <div className="container">
        {/* Hero Section */}
        <section id="home" className="hero" ref={heroRef}>
          <div className="background">
           
           {/* <canvas id="particleCanvas"></canvas>*/}
           
          </div>

          <div className="hero-content">
            <h1 className="hero-title">
              Hi, I’m <span className="ai-name">Tanzee</span> — your personal AI
              assistant.
            </h1>
            <div className="search-bar">
  <i className="fas fa-search search-icon"></i>

  <div className="search-text">
    {text}
    <span className="cursor"></span>
  </div>

  <div className="search-actions">
  <i className="fas fa-paperclip"></i>
  <i className="fas fa-microphone"></i>
  <i className="fas fa-location-arrow"></i>
</div>

</div>


            {/* Image Tab */}
            <div className="image-tab">
              <img
                src={sentences[index].image}
                alt="Illustration"
                className={`tab-image ${fade ? "fade-in" : "fade-out"}`}
              />
            </div>


            
          </div>

          
        </section>
        
 {/* Floating Hero Section */}
      <section id="home" className="floating-hero" ref={horizontalRef}>
        <h1 className="hero-heading">SKHOOLO</h1>
        <div className="tab-box">
          <div className="tab-item">Reimagine Education</div>
          <div className="tab-item">Redefine Efficiency</div>
          <div className="tab-item">Realize Potential</div>
        </div>
      </section>



        

</div>


<section ref={sectionRef} className="solutions-section">
  <div className="pills">
    <button className="pill active">Academic Intelligence</button>
    <button className="pill">Communication & Engagement</button>
    <button className="pill">Financial & Infrastructure Intelligence</button>
    <button className="pill">Operations & Intelligence</button>
  </div>

  <div ref={horizontalRef} className="horizontal-scroll">

    {/* 1️⃣ Academics */}
    <div className="panel academics">
      <h2>Smarter Classrooms. Connected Learning.</h2>
     

      <div className="feature-grid">
        {/* Attendance & Discipline AI */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-clipboard-check"></i>
            <h3>Attendance & Discipline AI</h3>
          </div>
          <ul className="feature-list">
            <li>Teacher GPS Attendance Tracker</li>
            <li>3-Second Student Attendance Capture</li>
            <li>Auto Parent Updates</li>
            <li>Bulk Attendance Insights (Empathetic absence alerts)</li>
            <li>Discipline Pattern Detection</li>
          </ul>
        </div>

        {/* Teaching & Assessment Intelligence */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-book-open"></i>
            <h3>Teaching & Assessment Intelligence</h3>
          </div>
          <ul className="feature-list">
            <li>Homework Guidance </li>
            <li>Resource Library </li>
            <li>Syllabus Tracking & Auto Updates</li>
            <li>Substitute Teacher Assignment</li>
            <li>Question Paper Generation (AI)</li>
            <li>Answer Paper Scanning & AI Evaluation</li>
            <li>Performance Insights via Paper Analysis</li>
          </ul>
        </div>

        {/* Academic Productivity & Planning */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-chart-line"></i>
            <h3>Academic Productivity & Planning</h3>
          </div>
          <ul className="feature-list">
            <li>Auto Timetable Generator</li>
            <li>Teacher Productivity Dashboard (linked to school name & performance)</li>
            <li>Academic Progress Reports & Analytics</li>
            <li>AI-based Student Strength–Weakness Mapping</li>
          </ul>
        </div>
      </div>

      <div className="bulletins">
        <span>Instant Notifications</span>
        <span>Seamless Workflow</span>
        <span>Parent-Teacher Sync</span>
      </div>
    </div>

    {/* 2️⃣ Community */}
    <div className="panel community">
      <h2>A Connected School Community.</h2>
     
      <div className="feature-grid">
        {/* Smart Communication */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-comments"></i>
            <h3>Smart Communication</h3>
          </div>
          <ul className="feature-list">
            <li>Auto Greeting + Unique #ID for every chat</li>
            <li>AI Language Filter (blocks uncomplimentary text)</li>
            <li>AI Chat Summaries for long threads</li>
            <li>Priority Communication Flagging</li>
          </ul>
        </div>

        {/* Event & Media Management */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-camera-retro"></i>
            <h3>Event & Media Management</h3>
          </div>
          <ul className="feature-list">
            <li>Event Photo/Video Upload (with management permission)</li>
            <li>Event Creation & Scheduling Dashboard</li>
            <li>AI Media Sorter (tags by event/class/date)</li>
            <li>Birthday & Achievement Highlights</li>
          </ul>
        </div>

        {/* Engagement & Emotional Intelligence */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-heart"></i>
            <h3>Engagement & Emotional Intelligence</h3>
          </div>
          <ul className="feature-list">
            <li>Unified Chat for Teachers–Parents–Students</li>
            <li>Circulars, Notices & Announcements</li>
            <li>Feedback & Suggestion Portal (AI analysis)</li>
            <li>Emotional Connect AI (appreciations, empathy messages)</li>
          </ul>
        </div>
      </div>
      <div className="bulletins">
        <span>Real-Time Conversations</span>
        <span>Unified Communication</span>
        <span>Emotionally Connected</span>
      </div>
    </div>

    {/* 3️⃣ Operations */}
    <div className="panel operations">
      <h2>Simplified Operations. Transparent Finances.</h2>
     

      <div className="feature-grid">
        {/* Financial Operations */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-credit-card"></i>
            <h3>Financial Operations</h3>
          </div>
          <ul className="feature-list">
            <li>UPI / Card / Net Banking Payment Gateway</li>
            <li>Fee Reminders & Auto Receipts</li>
            <li>Auto Bill Generation & Editable Reports for Correspondents</li>
            <li>Teacher Payslip Generator</li>
            <li>Salary Calculation System</li>
          </ul>
        </div>

        {/* Accounting & Analytics */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-chart-pie"></i>
            <h3>Accounting & Analytics</h3>
          </div>
          <ul className="feature-list">
            <li>Bus Fuel Calculation & Expense Tracker</li>
            <li>Profit & Loss Dashboard (Dynamic Graphs)</li>
            <li>Expense Forecasting AI</li>
            <li>Multi-Branch Financial Integration</li>
          </ul>
        </div>

        {/* Resource & Asset Management */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-boxes-stacked"></i>
            <h3>Resource & Asset Management</h3>
          </div>
          <ul className="feature-list">
            <li>Asset Tracking (classroom, transport, lab)</li>
            <li>Maintenance & Repair Logs</li>
            <li>Energy & Utility Consumption Analysis</li>
          </ul>
        </div>
      </div>
      <div className="bulletins">
        <span>Transparent Finances</span>
        <span>Smart Resource Tracking</span>
        <span>Error-Free Automation</span>
      </div>
    </div>

    {/* 4️⃣ AI & Automation */}
    <div className="panel ai">
      <h2>The Intelligence Behind Every Operation.</h2>
      

      <div className="feature-grid">
        {/* Digital & Administrative Automation */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-id-card"></i>
            <h3>Digital & Administrative Automation</h3>
          </div>
          <ul className="nav-links">
  <li>
    <Link to="/">Home</Link>
  </li>

  <li>
    <Link to="/about">About</Link> 
  </li>

  <li>
    <Link to="/features">Features</Link>
  </li>

  <li>
    <Link to="/contact">Contact</Link>
  </li>

  <div className="hero-buttons">
    <button className="btn">Request a Demo</button>
    <button className="btn btn-outline">Log-in</button>
  </div>
</ul>

        </div>

        {/* Event & Marketing Assistance */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-bullhorn"></i>
            <h3>Event & Marketing Assistance</h3>
          </div>
          <ul className="feature-list">
            <li>Event Greeting Generation</li>
            <li>Digital Media Assistance (auto posts, newsletters, social updates)</li>
            <li>AI Ideas Generator for Events, Quizzes, Competitions, etc.</li>
            <li>School Branding & Marketing AI</li>
          </ul>
        </div>

        {/* Productivity & Workflow AI */}
        <div className="feature-card">
          <div className="feature-header">
            <i className="fa-solid fa-gears"></i>
            <h3>Productivity & Workflow AI</h3>
          </div>
          <ul className="feature-list">
            <li>AI Task Manager for Admins</li>
            <li>Staff Workload Balancer</li>
            <li>Report Generator (for events, feedback, attendance, etc.)</li>
          </ul>
        </div>
      </div>
       <div className="bulletins">
        <span>Predictive Insights</span>
        <span>Automated Precision</span>
        <span>Future-Ready Systems</span>
      </div>
    </div>

  </div>
</section>
 <section className="security-section-wrapper">

      {/* ----------------- SECURITY GRID SECTION ----------------- */}
      <div className="security-section">
        <h2 className="section-title">Security, Data & Performance</h2>
        <p className="section-subtitle">
          Enterprise-level protection to keep your school’s data safe.
        </p>

        <div className="security-grid">
          {[
            "Encrypted Communication",
            "Secure Cloud Hosting",
            "Daily Automated Backups",
            "Admin-Level Permissions",
            "Firewall Protection",
            "24/7 Monitoring",
          ].map((item, i) => (
            <div
              key={i}
              className="security-card fade-up"
              ref={(el) => (refs.current[i] = el)}
            >
              <div className="security-icon">🛡</div>
              <h4>{item}</h4>
              <p>
                Your data is protected with strict security standards,
                encryption & real-time monitoring.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ----------------- DATA CONTROL SECTION ----------------- */}
      <div className="control-section">
        <div
          className="control-text slide-left"
          ref={(el) => (refs.current[10] = el)}
        >
          <h2>You Control All Your Data</h2>
          <p className="control-sub">
            Create, update, download, and delete student records anytime —
            complete freedom with complete security.
          </p>

          <ul className="control-list">
            <li>📁 Create & Manage Records</li>
            <li>✏️ Update Anytime</li>
            <li>🗑 Delete Securely</li>
            <li>⬇ Export to PDF & Excel</li>
            <li>🔒 Access Control for Staff</li>
            <li>🕒 Real-time Sync to Cloud</li>
          </ul>

          <button className="learn-more-btn">Learn More</button>
        </div>

        <div
          className="control-image slide-right"
          ref={(el) => (refs.current[11] = el)}
        >
          <img src={controlImg} alt="Data Control" />
        </div>
      </div>
 </section>

<section className="video-section">
  <div className="video-box">
    
    {/* LEFT CONTENT */}
    <div className="video-content">
      <h2>See How Skhoolo Works</h2>
      <p>
        Watch this short demo to understand how teachers, parents, and 
        management stay connected with our platform.
      </p>
      <button className="watch-btn">Watch Full Demo</button>
    </div>

    {/* RIGHT VIDEO */}
    <div className="video-frame">
      <iframe
        src="https://www.youtube.com/embed/VIDEO_ID"
        title="Demo Video"
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>

  </div>
</section>
<section id="why-skhoolo" className="why-section" ref={whyRef}>



  <div class="why-left">

    <div class="accent-line"></div>

    <div class="why-heading">
      <h2>Why We Built SKHOOLO</h2>
      <p class="sub">The story behind the platform</p>
    </div>

    <div class="why-text">
      <p>Schools still run on disconnected systems — 12+ apps, manual registers, and late updates.</p>
      <p>Teachers spend 40% of their day on manual work instead of teaching.</p>
      <p>We built SKHOOLO to unify everything into one fast, reliable, and delightful platform.</p>
    </div>

  </div>

 
  <div class="why-right">

    <div class="stat-card">
      <span class="num" data-target="40">0</span>
      <p>Teacher time wasted daily</p>
    </div>

    <div class="stat-card">
      <span class="num" data-target="12">0</span>
      <p>Separate school apps used today</p>
    </div>

    <div class="stat-card">
      <span class="num" data-target="0">0</span>
      <p>Real-time data access</p>
    </div>

    <div class="stat-card">
      <span class="num" data-target="1">0</span>
      <p>Unified system: SKHOOLO</p>
    </div>

  </div>

  
  <div class="blob blob1"></div>
  <div class="blob blob2"></div>

</section>

<section className="compare-section">
  <div className="compare-container">

    {/* Heading */}
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="compare-title"
    >
      SKHOOLO vs Other Apps
    </motion.h2>

    <motion.p
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="compare-sub"
    >
      A modern platform designed for schools that expect more.
    </motion.p>

    {/* TABLE */}
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="compare-table-wrapper"
    >
      <div className="table-container">
        <table className="compare-table">
          <thead className="compare-thead">
            <tr>
              <th>Feature</th>
              <th>SKHOOLO</th>
              <th>Others</th>
            </tr>
          </thead>

          <tbody className="compare-tbody">
            {features.map((f, i) => (
              <motion.tr
                key={i}
                whileHover={{ backgroundColor: "#fff9e6" }}
                transition={{ duration: 0.2 }}
                className="compare-row"
              >
                <td>{f.name}</td>
                <td className="positive">{f.skoloo}</td>
                <td className="negative">{f.other}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>

    <motion.p
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="compare-note"
    >
      Built for modern schools who expect more.
    </motion.p>
  </div>

  {/* CSS */}
  <style>{`
    .compare-section {
      padding: 80px 0;
      background: #fff;
    }

    .compare-container {
      width: 90%;
      max-width: 1100px;
      margin: auto;
    }

    .compare-title {
      font-size: 40px;
      font-weight: 800;
      margin-bottom: 6px;
    }

    .compare-sub {
      color: #6b7280;
      margin-bottom: 40px;
    }

    /* ---------- TABLE WRAPPER ---------- */
    .compare-table-wrapper {
      background: #fff;
      border-radius: 14px;
      border: 1px solid #eee;
      box-shadow: 0 6px 18px rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .table-container {
      max-height: 330px; /* scroll height */
      overflow-y: auto;
      overflow-x: auto;
    }

    /* Hide scrollbar but keep scroll functional */
    .table-container::-webkit-scrollbar {
      width: 6px;
    }

    .table-container::-webkit-scrollbar-thumb {
      background: #e2e2e2;
      border-radius: 10px;
    }

    .compare-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 700px;
    }

    /* ---------- FIXED HEADER ---------- */
    .compare-thead th {
      position: sticky;
      top: 0;
      background: #fff6d7;
      color: #000;
      font-weight: 700;
      padding: 16px 20px;
      font-size: 15px;
      border-bottom: 2px solid #f4e4a2;
      z-index: 10;
    }

    /* ---------- TABLE BODY ---------- */
    .compare-row td {
      padding: 16px 20px;
      font-size: 15px;
      color: #555;
      border-bottom: 1px solid #eee;
      transition: background 0.2s ease;
    }

    /* SKHOOLO column */
    .positive {
      font-weight: 700;
      color: #16a34a;
    }

    /* Others column */
    .negative {
      font-weight: 700;
      color: #dc2626;
    }

    /* Note */
    .compare-note {
      color: #6b7280;
      text-align: right;
      margin-top: 14px;
      font-size: 14px;
    }

    @media (max-width: 600px) {
      .compare-title { font-size: 32px; }
      .compare-note { text-align: left; }
    }
  `}</style>
</section>

      
      
<section className="approch">
      {/* Left Sidebar (Categories) */}
      <div className="tabet">
        {approchData.map((item, idx) => (
          <div
            key={idx}
            className={`tab ${activeCategory === idx ? "active" : ""}`}
          >
            {item.category}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="approch-content" ref={containerRef}>
        {approchData.map((item, idx) => (
          <div className="approch-section" key={idx}>
            <h2>{item.category}</h2>
            <div className="split-grid">
              {/* Problems Column */}
              <div className="split problems">
                <h3>Sounds familiar?</h3>
                {item.problems.map((p, i) => (
                  <div key={i} className="split-item fade-in">
                    {p}
                  </div>
                ))}
              </div>

              {/* Solutions Column */}
              <div className="split solutions">
                <h3>Let’s fix that together.</h3>
                {item.solutions.map((s, i) => (
                  <div key={i} className="split-item fade-in">
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>


    <section ref={mobileRef} className="imagination-section">
  <div className={`imagination-container ${visible ? "visible" : ""}`}>
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

    <div className="text-frame">
      <h2 className="imagination-heading">
        Imagine your toughest task — as a game.
      </h2>
      <p className="imagination-subtext">
        Beautiful imagination, right? <br />
        That imagination is now a reality. <br />
        <strong>Skhoolo</strong> completes all your tasks with just your
        fingertips.
      </p>
    </div>
  </div>
</section>


      </div>
    );
  }