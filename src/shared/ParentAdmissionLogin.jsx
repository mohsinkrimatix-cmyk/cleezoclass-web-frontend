import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import heroImage from "../assets/hero.png";

const ParentAdmissionLogin = () => {
  const [regNo, setRegNo] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [error, setError] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth <= 768);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

  // On mount, get schoolCode from URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromURL = params.get("schoolCode");
    if (codeFromURL) {
      setSchoolCode(codeFromURL);
      localStorage.setItem("schoolCode", codeFromURL); // store in localStorage too
    } else {
      const codeFromStorage = localStorage.getItem("schoolCode");
      if (codeFromStorage) setSchoolCode(codeFromStorage);
    }
  }, [location.search]);

  const handleLogin = async () => {
    setError("");

    if (!schoolCode) {
      setError("School code not found.");
      return;
    }

    if (!regNo && !mobileNo) {
      setError("Enter Registration No or Mobile No");
      return;
    }

    try {
      const response = await fetch(
        "https://cleezoclass.com:4000/api/admission/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schoolCode,
            reg_no: regNo || null,
            mobile_number: mobileNo || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
      // Navigate to dashboard and pass schoolCode in state
      navigate("/ParentAdmissionPage", { 
        state: { 
          schoolCode: schoolCode,
          parentData: data.data // optional: pass other data here too
        } 
      });
    } else {
      setError(data.message || "Login failed");
    }

      localStorage.setItem("parentData", JSON.stringify(data.data));
    } catch (err) {
      setError("Server error");
    }
  };

  // ...styles remain the same (omitted for brevity)
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f5f6fa",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontFamily: "sans-serif",
    },

    contentWrapper: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
innerContainer: {
  width: "90vw",
  height: isMobile ? "auto" : "90vh",
  minHeight: isMobile ? "100vh" : "auto",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#fff",
  borderRadius: isMobile ? "0" : "14px",
  boxShadow: isMobile ? "none" : "0 2px 10px rgba(0,0,0,0.1)",
  overflow: "hidden",
},


header: {
  padding: isMobile ? "14px" : "20px",
  fontSize: isMobile ? "18px" : "22px",
  fontWeight: "700",
  textAlign: "center",
  borderBottom: "1px solid #eee",
},

body: {
  flex: 1,
  display: "flex",
  flexDirection: isMobile ? "column" : "row",
},
leftSection: {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: isMobile ? "10px" : "20px",
  backgroundColor: "#fafafa",
},


heroImage: {
  width: isMobile ? "70%" : "90%",
  height: isMobile ? "180px" : "90%",
  objectFit: "contain",
},


rightSection: {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: isMobile ? "20px" : "40px",
},

    formWrapper: {
      width: "100%",
      maxWidth: "380px",
    },

input: {
  width: "100%",
  padding: isMobile ? "12px" : "14px",
  margin: "8px 0",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: isMobile ? "14px" : "16px",
},

    divider: {
      display: "flex",
      alignItems: "center",
      margin: "15px 0",
      color: "#888",
    },

    line: {
      flex: 1,
      height: "1px",
      backgroundColor: "#eee",
    },

    loginBtn: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#5d5fef",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      marginTop: "10px",
      cursor: "pointer",
    },

    footer: {
      marginTop: "20px",
      textAlign: "center",
      fontSize: "14px",
    },
  };
  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.innerContainer}>
          <div style={styles.header}>ABC SCHOOL</div>

          <div style={styles.body}>
            <div style={styles.leftSection}>
              <img src={heroImage} alt="Admission" style={styles.heroImage} />
            </div>

            <div style={styles.rightSection}>
              <div style={styles.formWrapper}>
                <h2 style={{ fontSize: "36px", marginBottom: "10px" }}>
                  Welcome Parent!
                </h2>
                <p style={{ marginBottom: "25px" }}>
                  Log in to start the admission process
                </p>

                <input
                  placeholder="Registration No"
                  style={styles.input}
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                />

                <div style={styles.divider}>
                  <div style={styles.line}></div>
                  <span style={{ padding: "0 10px" }}>or</span>
                  <div style={styles.line}></div>
                </div>

                <input
                  placeholder="Mobile No"
                  style={styles.input}
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                />

                <button style={styles.loginBtn} onClick={handleLogin}>
                  Login
                </button>

                {error && (
                  <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
                )}

                <div style={styles.footer}>
                  Don't have an account? <b>Sign up here</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ margin: "20px", fontSize: "12px", color: "#999" }}>
        Powered By <b>LEEZO</b>
      </div>
    </div>
  );
};


export default ParentAdmissionLogin;
