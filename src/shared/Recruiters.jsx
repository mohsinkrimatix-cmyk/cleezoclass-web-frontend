import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Recruiters() {
  const [classWiseSubjects, setClassWiseSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);



useEffect(() => {
  console.log("🔄 useEffect triggered: Fetching class-wise subjects...");

  const storedSchoolCode = localStorage.getItem("schoolCode");

  if (!storedSchoolCode) {
    console.error("❌ No schoolCode found in localStorage");
    return;
  }

  console.log("🏫 Retrieved School Code:", storedSchoolCode);

  setIsLoading(true);

  axios
    .get(
      `https://cleezoclass.com:4000/api/class-wise-subjects-without-teachers?schoolCode=${storedSchoolCode}`
    )
    .then((response) => {
      console.log("✅ API Response received:", response);
      console.log("📘 Result Array:", response.data.result);

      setClassWiseSubjects(response.data.result || []);
    })
    .catch((error) => {
      console.error("❌ Error fetching data:", error);
    })
    .finally(() => {
      setIsLoading(false);
    });
}, []);


  /* ----------------------------------
        PREMIUM RECRUITMENT DASHBOARD CSS
  ---------------------------------- */

  const appStyle = {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
    padding: "30px 20px",
    color: "#ffffff",
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "50px",
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "30px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
  };

  const headingStyle = {
    fontSize: "3rem",
    fontWeight: 800,
    background: "linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcf7f)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "15px",
    letterSpacing: "-0.02em",
  };

  const subHeadingStyle = {
    fontSize: "1.3rem",
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: 400,
    maxWidth: "600px",
    margin: "0 auto",
    lineHeight: 1.6,
  };

  const statsContainerStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    marginBottom: "40px",
    flexWrap: "wrap",
  };

  const statCardStyle = {
    background: "rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "25px",
    minWidth: "200px",
    textAlign: "center",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
  };

  const statNumberStyle = {
    fontSize: "3rem",
    fontWeight: 800,
    color: "#ff6b6b",
    marginBottom: "5px",
  };

  const statLabelStyle = {
    fontSize: "1rem",
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  const cardContainerStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
    gap: "30px",
    maxWidth: "1400px",
    margin: "0 auto",
  };

  const cardStyle = {
    background: "linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
    borderRadius: "24px",
    padding: "30px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  };

  const cardHoverStyle = {
    transform: "translateY(-12px) scale(1.02)",
    boxShadow: "0 35px 70px rgba(255, 107, 107, 0.2)",
    borderColor: "rgba(255, 107, 107, 0.3)",
  };

  const cardHeadingStyle = {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const classBadgeStyle = {
    background: "linear-gradient(45deg, #667eea, #764ba2)",
    padding: "8px 16px",
    borderRadius: "12px",
    fontSize: "0.9rem",
    fontWeight: 600,
  };

  const recruitmentBadgeStyle = {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "linear-gradient(45deg, #ff6b6b, #ff8e8e)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "50px",
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase",
    boxShadow: "0 8px 20px rgba(255, 107, 107, 0.4)",
    animation: "pulse 2s infinite",
  };

  const listStyle = {
    listStyle: "none",
    padding: 0,
    margin: 0,
  };

  const listItemStyle = {
    padding: "18px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    transition: "all 0.3s ease",
  };

  const listItemHoverStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    margin: "0 -20px",
    padding: "18px 20px",
    borderRadius: "12px",
  };

  const subjectStyle = {
    color: "#ffd93d",
    fontWeight: 700,
    fontSize: "1.1rem",
    textShadow: "0 2px 10px rgba(255, 217, 61, 0.3)",
  };

  const urgencyIndicatorStyle = {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#ff6b6b",
    boxShadow: "0 0 20px rgba(255, 107, 107, 0.6)",
    animation: "pulse 1.5s infinite",
  };

  const loadingStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    textAlign: "center",
  };

  const spinnerStyle = {
    width: "60px",
    height: "60px",
    border: "4px solid rgba(255, 255, 255, 0.1)",
    borderLeft: "4px solid #ff6b6b",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  };

  const emptyStateStyle = {
    textAlign: "center",
    gridColumn: "1 / -1",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "20px",
    padding: "60px 40px",
    border: "2px dashed rgba(255, 255, 255, 0.2)",
  };

  // Filter classes that actually have gaps (subjects without teachers)
  const classesWithGaps = classWiseSubjects.filter(item => 
    item.subjectsWithoutTeacher && item.subjectsWithoutTeacher.length > 0
  );

  const totalSubjects = classesWithGaps.reduce((total, item) => total + item.subjectsWithoutTeacher.length, 0);
  const totalClasses = classesWithGaps.length;

  /* ----------------------------------
                LOADING UI
  ---------------------------------- */
  if (isLoading) {
    return (
      <div style={appStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          <h2 style={{ color: "#ffffff", marginBottom: "10px" }}>Analyzing Recruitment Needs</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.7)" }}>Scanning teacher assignments across all classes...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}
        </style>
      </div>
    );
  }

  /* ----------------------------------
                MAIN UI
  ---------------------------------- */
  return (
    <div style={appStyle}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>

      <div style={headerStyle}>
        <h1 style={headingStyle}>🚨 TEACHER RECRUITMENT DASHBOARD</h1>
        <p style={subHeadingStyle}>
          Critical overview of subject gaps requiring immediate teaching staff recruitment
        </p>
      </div>

      <div style={statsContainerStyle}>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>{totalClasses}</div>
          <div style={statLabelStyle}>Classes Affected</div>
        </div>
        <div style={statCardStyle}>
          <div style={statNumberStyle}>{totalSubjects}</div>
          <div style={statLabelStyle}>Subjects Uncovered</div>
        </div>
        <div style={statCardStyle}>
          <div style={{...statNumberStyle, color: "#ffd93d"}}>URGENT</div>
          <div style={statLabelStyle}>Priority Level</div>
        </div>
      </div>

      <div style={cardContainerStyle}>
        {classesWithGaps.length > 0 ? (
          classesWithGaps.map((item, index) => (
            <div
              key={index}
              style={cardStyle}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { 
                transform: "none", 
                boxShadow: cardStyle.boxShadow,
                borderColor: "rgba(255, 255, 255, 0.15)"
              })}
            >
              {/* <span style={recruitmentBadgeStyle}>🚨 IMMEDIATE HIRE</span> */}

              <h2 style={cardHeadingStyle}>
                <span>{item.class} ({item.section})</span>
                <span style={classBadgeStyle}>{item.subjectsWithoutTeacher.length} GAPS</span>
              </h2>

              <ul style={listStyle}>
                {item.subjectsWithoutTeacher.map((subject, subIndex) => (
                  <li 
                    key={subIndex} 
                    style={listItemStyle}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, listItemHoverStyle)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, {
                      background: "transparent",
                      margin: "0",
                      padding: "18px 0",
                      borderRadius: "0"
                    })}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                      <div style={urgencyIndicatorStyle}></div>
                      <span style={subjectStyle}>{subject.subject}</span>
                    </div>
                    <span style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.9rem" }}>
                      TEACHER NEEDED
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>🎉</div>
            <h2 style={{ color: "#6bcf7f", fontSize: "2rem", marginBottom: "15px" }}>
              All Positions Filled!
            </h2>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "1.1rem" }}>
              Excellent! All scheduled subjects have qualified teachers assigned.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Recruiters;