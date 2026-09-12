import React,{useState} from "react";
import { useNavigate } from "react-router-dom";
import schoolLogo from '../assets/download.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  const styles = {
  outerContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center", // vertical centering
    alignItems: "center",     // horizontal centering
    gap: isMobile ? "20px" : "50px",
    minHeight: "57vh",
    width: "100%",
    padding: isMobile ? "10px" : "20px",
    boxSizing: "border-box",
    backgroundColor: "#6b7983ff",
}
,
    innerContainer: {
     fontFamily: font,
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: isMobile ? "10px 5px" : "5px",
    boxSizing: "border-box",
    width: "100%",
    minWidth: "300px", // Prevent content from getting too small
    },
    dashboardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      backgroundColor: "#FEFEFE",
      borderBottom: "1px solid #ccc",
      flexWrap: "wrap",
      gap: "10px",
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    logoImg: {
      width: "40px",
      height: "40px",
    },
    schoolInfo: {
      flex: 1,
      textAlign: "center",
      minWidth: "120px",
      fontFamily: '"Century Gothic", sans-serif',
    },
    logoutBtn: {
      padding: "6px 12px",
      backgroundColor: "#757575",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "0.8rem",
    },
    dashboardMain: {
      padding: "15px 20px",
    },
    reportsRowContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "flex-start",
      gap: "20px",
      marginTop: "15px",
      flexWrap: "wrap",
    },
    reportSectionContainer: {
      display: "flex",
      flexDirection: "column",
      flex: "1 1 300px",
      minWidth: "280px",
    },
    reportSection: {
      width: "100%",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      minHeight: "300px",
      boxSizing: "border-box",
    },
    reportItem: {
      display: "flex",
      alignItems: "center",
      marginBottom: "12px",
      gap: "10px",
      justifyContent: "flex-start",
      flexWrap: "wrap",
    },
    reportIcon: {
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      backgroundColor: "#ccc",
      minWidth: "50px",
    },
    reportDetails: {
      flex: 1,
      textAlign: "left",
    },
    reportTitle: {
      color: "black",
      fontSize: "18px",
      fontWeight: "bold",
      margin: "0",
      letterSpacing: "1px",
      lineHeight: "1.2",
      textAlign: "left",
      fontFamily: '"Century Gothic", sans-serif',
    },
    subtext: {
      fontSize: "12px",
      color: "#666",
      margin: "0",
      lineHeight: "1.2",
      textAlign: "left",
      fontFamily: '"Century Gothic", sans-serif',
    },
    progressBar: {
      width: "80px",
      height: "12px",
      backgroundColor: "#e0e0e0",
      borderRadius: "4px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: "4px",
    },
    green: { backgroundColor: "#4CAF50", width: "70%" },
    orange: { backgroundColor: "#FF9800", width: "30%" },
    purple: { backgroundColor: "#9C27B0", width: "50%" },
    reportHeading: {
      fontSize: "1.1rem",
      fontWeight: "bold",
      marginBottom: "20px",
      textAlign: "center",
      fontFamily: '"Century Gothic", sans-serif',
    },
  };

  const handleNavigation = (path) => navigate(path);

  const renderReportItems = (items) =>
    items.map((item, idx) => (
      <div key={idx} style={styles.reportItem} onClick={() => handleNavigation(item.path)}>
        <div style={{ ...styles.reportIcon, backgroundColor: item.color }}></div>
        <div style={styles.reportDetails}>
          <p style={styles.reportTitle}>{item.title}</p>
          {item.sub && <p style={styles.subtext}>{item.sub}</p>}
        </div>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, ...styles[item.progress] }}></div>
        </div>
      </div>
    ));

  return (
    <div style={styles.outerContainer}>
      <div style={styles.innerContainer}>
        <header style={styles.dashboardHeader}>
          <div style={styles.logo}>
            <img src={schoolLogo} alt="ABC School Logo" style={styles.logoImg} />
            <div>
              <div style={{ fontWeight: "bold" }}>Tanz AI</div>
              <div style={{ fontSize: "0.7rem", color: "#666" }}>For Schools</div>
            </div>
          </div>
          <div style={styles.schoolInfo}>
            <h2 style={{ fontSize: "1rem", margin: "5px 0" }}>ABC School, Miyapur, Hyderabad</h2>
          </div>
          <button style={styles.logoutBtn}>Logout</button>
        </header>

        <main style={styles.dashboardMain}>
          <h3 style={{ fontSize: "1.2rem", textAlign: 'left', fontWeight: 'bold', fontFamily: '"Century Gothic", sans-serif' }}>
            REPORT - ACADEMICS
          </h3>

          <div style={styles.reportsRowContainer}>
            {/* Syllabus Report */}
            <div style={styles.reportSectionContainer}>
              <h4 style={styles.reportHeading}>Syllabus Report</h4>
              <div style={{ ...styles.reportSection, borderLeft: '4px solid #ACAFB1' }}>
                {renderReportItems([
                  { title: "Teacher's Track", sub: "Analysis, Tests, Complaints", color: "#ccc", progress: "green", path: "/teacher-track" },
                  { title: "Test Result Track", sub: "HW, Tests, Complaints", color: "#7B7D7E", progress: "orange", path: "/test-result-track" },
                  { title: "Previous Year", sub: "Track, Comparison", color: "#849098", progress: "purple", path: "/previous-year" },
                  { title: "Others", sub: "", color: "#636070", progress: "orange", path: "/others-syllabus" },
                ])}
              </div>
            </div>

            {/* Performance Report */}
            <div style={styles.reportSectionContainer}>
              <h4 style={styles.reportHeading}>Performance - Report</h4>
              <div style={{ ...styles.reportSection, borderLeft: '4px solid #8EA595' }}>
                {renderReportItems([
                  { title: "Staff - Teaching", sub: "Syllabus, Tests, Complaints", color: "#907A86", progress: "green", path: "/staff-teaching" },
                  { title: "Staff - non-Teaching", sub: "Tasks, Orders, Complaints", color: "#8290A6", progress: "orange", path: "/staff-non-teaching" },
                  { title: "Students", sub: "Academic, Behaviour, Other Act.", color: "#7E9D83", progress: "purple", path: "/students-performance" },
                  { title: "Others", sub: "", color: "#B1A59D", progress: "orange", path: "/others-performance" },
                ])}
              </div>
            </div>

            {/* Attendance Report */}
            <div style={styles.reportSectionContainer}>
              <h4 style={styles.reportHeading}>Attendance - Report</h4>
              <div style={{ ...styles.reportSection, borderLeft: '4px solid #9C696B' }}>
                {renderReportItems([
                  { title: "Staff - Teaching", sub: "Absents, Leaves, Lates", color: "#9A9891", progress: "green", path: "/staff-teaching-attendance" },
                  { title: "Staff - non-Teaching", sub: "Absents, Leaves, Lates", color: "#5B6367", progress: "orange", path: "/staff-non-teaching-attendance" },
                  { title: "Students", sub: "Absents, Leaves, Lates", color: "#5B5657", progress: "purple", path: "/students-attendance" },
                  { title: "Others", sub: "", color: "#A2B3B8", progress: "orange", path: "/others-attendance" },
                ])}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
