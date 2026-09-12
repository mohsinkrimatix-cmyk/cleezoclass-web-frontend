import React, { useEffect, useState, useMemo } from "react";
 import LogoGif from "../assets/Logo.gif";
  import performanceImg from "../assets/performance.png";
  import sampleImg from "../assets/logo.png"; 


export default function Home() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;

      // limit scroll progress between 0 and 2 viewport heights
      const ratio = Math.min(scrollTop / (viewportHeight * 2), 1);
      setProgress(ratio);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
    const sentences = useMemo(
      () => [
        {
          text: "Hey Tanzee! Generate overall report of Sathvik from 7th grade.",
          image: LogoGif,
        },
        {
          text: "Confused about your kid’s performance? Just ask me what you need.",
          image: performanceImg,
        },
        {
          text: "Want to focus on weak students? I’ll highlight what needs attention.",
          image: "/images/focus.png",
        },
        {
          text: "Need real-time tracking of finances, marketing, and admissions? I’ve got you covered.",
          image: "/images/finance.png",
        },
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

  const handleTyping = () => {
    setText((prev) => {
      if (!isDeleting) {
        const next = fullText.substring(0, prev.length + 1);

        // 🟢 When the sentence finishes typing
        if (next === fullText) {
          // ⏱️ Custom delay depending on image type
          const currentImage = sentences[index].image;
          const isGif = typeof currentImage === "string"
            ? currentImage.endsWith(".gif")
            : currentImage?.includes("Logo.gif"); // for imported gif

          // if GIF → wait 10s; else → wait 1.5s
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
  };

  const timer = setTimeout(handleTyping, typingSpeed);
  return () => clearTimeout(timer);
}, [text, isDeleting, index, sentences]);


  return (
    <div className="scroll-container">
      {/* HERO (Landing Page) */}
      <section id="home" className="hero">
          <div className="background">
            <canvas id="particleCanvas"></canvas>
            <div className="glass-overlay"></div>
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

          <style jsx>{`
.container {
  display: flex;
  flex-direction: row; /* side-by-side alignment */
  justify-content: space-between; /* space between tabs */
  align-items: flex-start; /* align items at the top */
  background: linear-gradient(120deg, #e0e0e0, #fafafa);
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  
  position: relative; /* allows floating elements inside */
}
          
            .hero {
  min-height: 100vh; /* ensures full screen height */
  width: 100vw; 
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #fff;
  overflow: hidden;
  font-family: "Segoe UI", sans-serif;
  box-sizing: border-box;
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
          `}</style>
        </section>

      {/* ABOUT SECTION (slides up) */}
      <section
        className="about"
        style={{
          transform: `translateY(${Math.max(0, 100 - progress * 120)}%)`,
        }}
      >
        <div className="about-inner">
          <h2>About Tanzee</h2>
          <p>
            I help you analyze data, create content, and automate your tasks —
            blending intelligence with creativity.
          </p>
        </div>
      </section>

      {/* NORMAL CONTENT */}
      <section className="normal">
        <h2>Regular Scroll Content</h2>
        <p>
          Once the transition finishes, normal scrolling continues here. You can
          add your sections, case studies, or blog cards here.
        </p>
      </section>

      <section className="normal">
        <h2>More Content</h2>
        <p>Scroll freely now — this is normal page flow.</p>
      </section>

      <style jsx>{`
        /* === SCROLL CONTAINER === */
        .scroll-container {
          position: relative;
          height: 600vh;
          overflow-x: hidden;
        }

        /* === HERO SECTION === */
        .hero {
          position: sticky;
          top: 0;
          width: 100%;
          height: 100vh;
          background: linear-gradient(120deg, #1e1e1e, #292929);
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          color: white;
          z-index: 1;
        }

        .hero-content h1 {
          font-size: 3rem;
          margin: 0;
        }

        .ai-name {
          color: #ffd700;
        }

        /* === ABOUT SECTION (slides up) === */
        .about {
          position: sticky;
          top: 0;
          width: 100%;
          height: 100vh;
          background: linear-gradient(120deg, #e0e0e0, #fafafa);
          display: flex;
          justify-content: center;
          align-items: center;
          transition: transform 0.25s ease-out;
          z-index: 2;
        }

        .about-inner {
          background: white;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          text-align: center;
          max-width: 600px;
        }

        /* === NORMAL SCROLL SECTIONS === */
        .normal:first-of-type {
          margin-top: 200vh; /* appears after about finishes */
        }

        .normal {
          position: relative;
          background: #fff;
          color: #000;
          min-height: 100vh;
          padding: 3rem;
          text-align: center;
          z-index: 0;
        }
      `}</style>
    </div>
  );
}