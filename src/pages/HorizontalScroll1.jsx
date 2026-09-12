import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HorizontalScroll() {
  const sectionRef = useRef(null);
  const horizontalRef = useRef(null);

  useLayoutEffect(() => {
    if (!sectionRef.current || !horizontalRef.current) return;

    const panels = gsap.utils.toArray(".panel");
    const totalWidth = window.innerWidth * panels.length;

    let ctx = gsap.context(() => {
      gsap.to(horizontalRef.current, {
        x: -(totalWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${totalWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
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
            <p>Smart insights powered by AI models.</p>
          </div>
          <div className="panel automation">
            <h2>Automation</h2>
            <p>Automate daily tasks intelligently.</p>
          </div>
          <div className="panel analytics">
            <h2>Analytics</h2>
            <p>Understand your data in real time.</p>
          </div>
          <div className="panel integration">
            <h2>Integration</h2>
            <p>Connect tools & platforms effortlessly.</p>
          </div>
        </div>
      </section>

      {/* ✅ Correct Inline CSS */}
      <style>{`
        .solutions-section {
          height: 100vh;
          overflow: hidden;
          position: relative;
          background: #ffffff;
        }

        .horizontal-scroll {
          display: flex;
          height: 100%;
          width: max-content;
        }

        .panel {
          flex: 0 0 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          padding: 4rem;
          font-size: 2rem;
        }

        .pills {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99;
          display: flex;
          gap: 10px;
        }

        .pill {
          padding: 10px 20px;
          border-radius: 30px;
          cursor: pointer;
          background: #eee;
          border: none;
        }

        .pill.active {
          background: black;
          color: white;
        }
      `}</style>
    </>
  );
}
