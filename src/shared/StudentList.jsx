import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import schoolLogo from "../assets/download.png";

function StudentsList() {
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [containerWidth, setContainerWidth] = useState("90vw");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ✅ Retrieve schoolCode from localStorage
  const schoolCode = localStorage.getItem("schoolCode");
  console.log("Retrieved schoolCode:", schoolCode);

  // Extract query params
  const queryParams = new URLSearchParams(location.search);
  const selectedClass = queryParams.get("class") || "";
  const selectedRange = queryParams.get("range") || "";

  useEffect(() => {
    if (!selectedClass || !selectedRange) {
      alert("Class or Range not selected");
      navigate("/");
      return;
    }

    if (!schoolCode) {
      alert("School code missing. Please log in again.");
      navigate("/");
      return;
    }

    // ✅ Include schoolCode in request body
    axios
      .post("https://cleezoclass.com:4000/api/api/getStudents", {
        class_name: selectedClass,
        range: selectedRange,
        school_code: schoolCode,
      })
      .then((res) => {
        const rawData = res.data;

        // Keep only the lowest marks entry per student
        const filtered = Object.values(
          rawData.reduce((acc, curr) => {
            const key = curr.name;
            if (!acc[key] || parseFloat(curr.marks) < parseFloat(acc[key].marks)) {
              acc[key] = curr;
            }
            return acc;
          }, {})
        );

        setStudents(filtered);
      })
      .catch((err) => {
        console.error(err);
        alert("Error fetching students");
      });
  }, [selectedClass, selectedRange, navigate, schoolCode]);

  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  const styles = {
    logoImg: { width: "50px", height: "50px", marginRight: "10px" },
    filterSelect: {
      width: "100px",
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: "#fff",
      textAlign: "center",
      fontWeight: "bold",
    },
    outerContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: isMobile ? "20px" : "50px",
      minHeight: "57vh",
      width: "97%",
      padding: isMobile ? "10px" : "20px",
      boxSizing: "border-box",
      backgroundColor: "#6b7983ff",
    },
    innerContainer: {
      fontFamily: font,
      backgroundColor: "#fff",
      borderRadius: "16px",
      padding: isMobile ? "10px 5px" : "5px",
      boxSizing: "border-box",
      width: "70%",
      minWidth: "300px",
    },
    dashboardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      backgroundColor: "#FEFEFE",
      borderBottom: "1px solid #ccc",
      flexWrap: "wrap",
      fontFamily: '"Century Gothic", sans-serif',
    },
    logoutButton: {
      backgroundColor: "#6200ee",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "5px",
      cursor: "pointer",
      fontFamily: '"Century Gothic", sans-serif',
    },
  };

  return (
    <div style={{ ...styles.outerContainer }}>
      <div style={styles.innerContainer}>
        {/* Header */}
        <header style={styles.dashboardHeader}>
          <div style={styles.logo}>
            <img src={schoolLogo} alt="ABC School Logo" style={styles.logoImg} />
            <span>
              <strong>Tanz AI</strong>
              <br />
              <small>For Schools</small>
            </span>
          </div>
          <div style={styles.schoolName}>ABC School, Miyapur, Hyderabad</div>
          <button style={styles.logoutButton}>Logout</button>
        </header>

        {/* REPORT BODY */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#f0f0f0",
            padding: "20px",
            height: "100%",
          }}
        >
          {/* Report Title */}
          <h3
            style={{
              textAlign: "left",
              fontWeight: "bold",
              color: "black",
              marginBottom: "20px",
              fontSize: "18px",
            }}
          >
            REPORT - ACADEMICS - Student Report
          </h3>

          {/* Filter Bar */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "25px",
              justifyContent: "flex-start",
            }}
          >
            <select style={styles.filterSelect} value={selectedClass} disabled>
              <option>{selectedClass}</option>
            </select>

            <select style={styles.filterSelect}>
              <option>Roll No.</option>
            </select>

            <select style={styles.filterSelect} value={selectedRange} disabled>
              <option>{selectedRange}</option>
            </select>
          </div>

          {/* Students Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
              gap: "20px",
              justifyItems: "center",
              borderRadius: "15px",
              background: "#fff",
              borderLeft: "4px solid #748C9E",
              padding: "15px",
            }}
          >
            {students.length === 0 ? (
              <p style={{ textAlign: "center" }}>No students found.</p>
            ) : (
              students.map((student, idx) => {
                const marks = parseFloat(student.marks);
                const goodPercent = Math.min(Math.max(marks, 0), 100);
                const badPercent = 100 - goodPercent;

                return (
                  <div
                    key={idx}
                    onClick={() =>
                      navigate("/ReportCardFull", {
                        state: {
                          name: student.name,
                          class: selectedClass,
                          section: student.section || "",
                        },
                      })
                    }
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: "10px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      padding: "15px",
                      width: "230px",
                      textAlign: "center",
                      position: "relative",
                      cursor: "pointer",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {/* Profile icon */}
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "#d9d9d9",
                        margin: "0 auto 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        color: "#555",
                      }}
                    >
                      👤
                    </div>

                    {/* Student name */}
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "15px",
                        color: "#333",
                        marginBottom: "5px",
                      }}
                    >
                      {student.name}
                    </div>

                    {/* Subject Info */}
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      Lowest: {student.subject} - {student.marks}
                    </div>

                    {/* Combined Progress Bar */}
                    <div
                      style={{
                        height: "10px",
                        width: "100%",
                        borderRadius: "5px",
                        backgroundColor: "#ddd",
                        overflow: "hidden",
                        marginTop: "12px",
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          width: `${goodPercent}%`,
                          backgroundColor: "#4CAF50",
                          transition: "width 0.5s ease-in-out",
                        }}
                      ></div>
                      <div
                        style={{
                          width: `${badPercent}%`,
                          backgroundColor: "#f44336",
                          transition: "width 0.5s ease-in-out",
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentsList;
