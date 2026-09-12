// TeacherEventManagement.js
import React, { useState, useEffect } from "react";
import TeacherEvents from "./Operations_classRoom_events_TeacherEvents";
import ObjectionCertificate from "./ObjectionCertificate1";

const TeacherEventManagement = () => {
  const [activeSection, setActiveSection] = useState("events");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const styles = {
    wrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100%",
      background: "#f5f6fa",
      padding: isMobile ? "10px" : "20px",
    },
    container: {
      background: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
      padding: isMobile ? "20px" : "35px",
      textAlign: "center",
      width: isMobile ? "90%" : "50%",
      transition: "all 0.3s ease",
      maxHeight: "90vh",
      overflowY: "auto",
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {activeSection === "events" && (
          <TeacherEvents onLocalNavigate={(next) => setActiveSection(next)} />
        )}
        {activeSection === "eventDetails" && <ObjectionCertificate />}
      </div>
    </div>
  );
};

export default TeacherEventManagement;
