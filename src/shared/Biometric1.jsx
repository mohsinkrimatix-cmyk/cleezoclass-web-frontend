import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Biometric = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [popup, setPopup] = useState(null);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  useEffect(() => {
    const fetchUserName = async () => {
      const username = localStorage.getItem("username");
      if (!username) return;

      try {
        const response = await fetch(
          `https://cleezoclass.com:4000/getUserName?username=${encodeURIComponent(username)}`
        );
        if (!response.ok) return;
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;
        const data = await response.json();
        if (data && typeof data.name === "string") setName(data.name);
      } catch (err) {
        console.error("Error fetching user name:", err);
      }
    };

    fetchUserName();
  }, []);

  // ---------- Styles ----------
  const container = {
    fontFamily: font,
    backgroundColor: "#F0F0F0",
    minHeight: "100vh",
    padding: "20px",
    boxSizing: "border-box",
  };

  const header = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    padding: "15px 25px",
    marginBottom: "25px",
    flexWrap: "wrap",
  };

  const logoBox = { display: "flex", alignItems: "center", gap: "10px" };
  const logo = {
    width: "40px",
    height: "40px",
    backgroundColor: "#001F3F",
    borderRadius: "8px",
  };
  const logoText = { fontSize: "18px", fontWeight: "600" };
  const logoSub = { fontSize: "12px", color: "#777" };
  const schoolTitle = {
    fontSize: "20px",
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "left",
  };
  const buttonGroup = { display: "flex", gap: "10px" };
  const btn = {
    backgroundColor: "#e0e0e0",
    border: "none",
    borderRadius: "10px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: font,
  };

  const gridContainer = {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    flex: 3,
    justifyContent: "space-between",
    alignItems: "stretch",
    backgroundColor: "#fff",
    borderRadius: "16px",
    borderLeft: "8px solid #945f4aff",
  };

  const mainContent = {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  };

  const card = {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    padding: "20px",
    flex: "1 1 45%",
    minWidth: "300px",
    height: "280px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  };

  const rightContainer = {
    flex: 1,
    minWidth: "250px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    padding: "20px",
    height: "100%",
  };

  const sectionTitleContainer = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "15px",
  };

  const sectionCircle = (color) => ({
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: color,
  });

  const sectionTitle = { fontSize: "22px", fontWeight: "600", color: "#333" };
  const actionItemContainer = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 0",
    cursor: "pointer",
  };

  const actionCircle = (color) => ({
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: color,
    flexShrink: 0,
  });

  const actionText = { fontSize: "16px", textAlign: "left" };
  const dropdownStyle = {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  };
  const okBtn = { ...btn, backgroundColor: "#4CAF50", color: "#fff" };

  // ---------- Data ----------
  const enrollmentActions = [
    { label: "New Enrollment", icon: true },
    { label: "Edit Previous Enrollment" },
    { label: "Delete Enrollment" },
    { label: "Exits" },
  ];

  const biometricsActions = [
    { label: "New Biometrics", icon: true },
    { label: "Edit Previous" },
    { label: "Delete Biometrics" },
  ];

  const attendanceActions = [
    { label: "List of Irregulars" },
    { label: "List of Late Comers" },
    { label: "List of Leave Requests" },
  ];

  const allActions = [
    { label: "Generate Report" },
    { label: "Export Data" },
    { label: "Settings" },
  ];

  const complaintTypes = ["Type A", "Type B", "Type C"];
  const submitToOptions = ["Admin", "Manager", "Principal"];

  const enrollmentColors = ["#D9EEF8", "#868C8F", "#B5ACBC", "#A39DBD"];
  const attendanceColors = ["#D4C7B0", "#868C8F", "#705B56"];
  const biometricsColors = ["#D4C7B0", "#868C8F", "#705B56"];
  const actionsColors = ["#FFD700", "#FF8C00", "#FF4500"];
  const sectionColors = ["#D4C7B0", "#868C8F", "#705B56", "#D9EEF8", "#888888"];

  // ---------- Handlers ----------
  const handleActionClick = (label, prefix) => {
    const route = `/${prefix}/${label.toLowerCase().replace(/\s+/g, "-")}`;
    setPopup({ title: label, route });
  };

  const renderActionItems = (actions, routePrefix, colors) =>
    actions.map((action, idx) => (
      <div
        key={idx}
        style={actionItemContainer}
        onClick={() => handleActionClick(action.label, routePrefix)}
      >
        <div style={actionCircle(colors[idx % colors.length])}></div>

        {action.icon ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                border: "2px solid #000",
                borderRadius: "6px",
                fontSize: "20px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              +
            </div>
            <span>{action.label}</span>
          </div>
        ) : (
          <div style={actionText}>{action.label}</div>
        )}
      </div>
    ));

  // ---------- Popup Styles ----------
  const popupOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const popupContent = {
    backgroundColor: "#fff",
    borderRadius: "20px",
    padding: "0",
    width: "85%",
    height: "85%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    position: "relative",
    overflow: "hidden",
  };

  const closeBtn = {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "rgb(160, 180,182)",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "15px",
    cursor: "pointer",
  };

  // ---------- JSX ----------
  return (
    <div style={container}>
      {/* Header */}
      <div style={header}>
        <div style={logoBox}>
          <div style={logo}></div>
          <div>
            <div style={logoText}>Tanz AI</div>
            <div style={logoSub}>For Schools</div>
          </div>
        </div>
        <div style={schoolTitle}>ABC School, Miyapur, Hyderabad</div>
        <div style={buttonGroup}>
          <button style={btn}>Switch Branch ▾</button>
          <button style={btn}>Logout</button>
        </div>
      </div>

      {/* Welcome */}
      <div style={{ fontSize: "22px", fontWeight: "600", marginBottom: "25px" }}>
        {name ? `Welcome ${name}..!` : "Welcome Admin..!"}
      </div>

      {/* Main Content */}
      <div style={mainContent}>
        <div style={gridContainer}>
          {/* Enrollments */}
          <div style={card}>
            <div style={sectionTitleContainer}>
              <div style={sectionCircle(sectionColors[0])}></div>
              <div style={sectionTitle}>Enrollments</div>
            </div>
            {renderActionItems(enrollmentActions, "enrollments", enrollmentColors)}
          </div>

          {/* Attendance */}
          <div style={card}>
            <div style={sectionTitleContainer}>
              <div style={sectionCircle(sectionColors[1])}></div>
              <div style={sectionTitle}>Attendance</div>
            </div>
            {renderActionItems(attendanceActions, "attendance", attendanceColors)}
          </div>

          {/* Biometrics */}
          <div style={card}>
            <div style={sectionTitleContainer}>
              <div style={sectionCircle(sectionColors[2])}></div>
              <div style={sectionTitle}>Biometrics</div>
            </div>
            {renderActionItems(biometricsActions, "biometrics", biometricsColors)}
          </div>

          {/* Complaints */}
          <div style={card}>
            <div style={sectionTitleContainer}>
              <div style={sectionCircle(sectionColors[3])}></div>
              <div style={sectionTitle}>Complaints</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <select style={dropdownStyle}>
                {complaintTypes.map((type, idx) => (
                  <option key={idx}>{type}</option>
                ))}
              </select>
              <select style={dropdownStyle}>
                {submitToOptions.map((option, idx) => (
                  <option key={idx}>{option}</option>
                ))}
              </select>
              <button style={okBtn}>OK</button>
            </div>
          </div>
        </div>

        {/* Right Container */}
        <div style={rightContainer}>
          <div style={sectionTitleContainer}>
            <div style={sectionCircle(sectionColors[4])}></div>
            <div style={sectionTitle}>Actions</div>
          </div>
          {renderActionItems(allActions, "actions", actionsColors)}
        </div>
      </div>

      {/* Popup */}
      {popup && (
        <div style={popupOverlay}>
          <div style={popupContent}>
            <button style={closeBtn} onClick={() => setPopup(null)}>
              Close
            </button>
            <iframe
              src={popup.route}
              title={popup.title}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Biometric;
