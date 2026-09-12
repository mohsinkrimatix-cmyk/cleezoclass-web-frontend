import React, { useRef, useState, useEffect } from "react";

// ScrollDownIcon with direction
export const ScrollDownIcon = ({ width = 40, height = 60, direction = "down" }) => {
  const rotate = direction === "up" ? "rotate(180deg)" : "rotate(0deg)";

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: rotate }}
    >
      <rect x="12" y="2" width="40" height="60" rx="20" stroke="#0a3d62" strokeWidth="4" />
      <line x1="32" y1="16" x2="32" y2="32" stroke="#0a3d62" strokeWidth="4" strokeLinecap="round" />
      <polyline points="24,44 32,52 40,44" fill="none" stroke="#0a3d62" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Fade-in wrapper
const FadeInDiv = ({ visible, children }) => (
  <div
    style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
      position: "relative",
    }}
  >
    {children}
  </div>
);

// Scrollable Section
const ScrollableSection = ({ children, height }) => {
  const scrollAreaRef = useRef(null);
  const firstSectionRef = useRef(null);
  const secondSectionRef = useRef(null);
  const ignoreScrollHideRef = useRef(false);

  const [secondSectionVisible, setSecondSectionVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update ref
  const secondSectionVisibleRef = useRef(secondSectionVisible);
  useEffect(() => {
    secondSectionVisibleRef.current = secondSectionVisible;
  }, [secondSectionVisible]);

  // Scroll listener
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const handleScroll = () => {
      const y = el.scrollTop;
      if (y > 200 && !secondSectionVisible) setSecondSectionVisible(true);
      if (y < 150 && secondSectionVisible && !ignoreScrollHideRef.current)
        setSecondSectionVisible(false);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [secondSectionVisible]);

  // Window resize listener
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Scroll to second section
  const scrollToSecondSection = () => {
    if (!secondSectionVisible) setSecondSectionVisible(true);

    ignoreScrollHideRef.current = true;
    setTimeout(() => (ignoreScrollHideRef.current = false), 300);

    requestAnimationFrame(() => {
      secondSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  // Scroll to top
  const scrollToTop = () => {
    scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setSecondSectionVisible(false), 300);
  };

  return (
    <div ref={scrollAreaRef} style={{ height, overflowY: "auto", paddingRight: "10px", position: "relative" }}>
      
      {/* FIRST SECTION */}
      <div ref={firstSectionRef} style={{ position: "relative" }}>
        {children.firstSection}

        {/* Scroll Down Button */}
        {!secondSectionVisible && (
          // <button
          //   className="scroll-btn"
          //   onClick={scrollToSecondSection}
          //   style={{
          //     position: "absolute",
          //     top: "0px",
          //     right: "0",
          //     background: "transparent",
          //     border: "none",
          //     cursor: "pointer",
          //     zIndex: 10,
          //   }}
          // >
          //   <ScrollDownIcon width={30} height={50} direction="down" />
          // </button>
          null
        )}
      </div>

      {/* SECOND SECTION */}
      <FadeInDiv visible={secondSectionVisible}>
        <div ref={secondSectionRef} style={{ position: "relative" }}>
          {children.secondSection}

          {/* Scroll Up Button */}
          {/* <button
            className="scroll-btn"
            onClick={scrollToTop}
            style={{
              position: "absolute",
              top: "0px",
              right: "-20px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              zIndex: 10,
            }}
          >
            <ScrollDownIcon width={30} height={50} direction="up" />
          </button> */}
        </div>
      </FadeInDiv>
    </div>
  );
};

export default ScrollableSection;
