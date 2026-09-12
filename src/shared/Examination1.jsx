
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ExaminationPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState(""); // state for user name
  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  // Fetch user name on component mount
  useEffect(() => {
    const fetchUserName = async () => {
      const username = localStorage.getItem("username");
      if (!username) return;

      try {
        const response = await fetch(`https://cleezoclass.com:4000/getUserName?username=${encodeURIComponent(username)}`);
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
  const logo = { width: "40px", height: "40px", backgroundColor: "#001F3F", borderRadius: "8px" };
  const logoText = { fontSize: "18px", fontWeight: "600" };
  const logoSub = { fontSize: "12px", color: "#777" };
  const schoolTitle = { fontSize: "20px", fontWeight: "600", color: "#333", textAlign: "center", flex: 1 };
  const buttonGroup = { display: "flex", gap: "10px" };
  const btn = { backgroundColor: "#e0e0e0", border: "none", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "14px", fontWeight: "500", fontFamily: font };
  const card = { backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", padding: "20px", cursor: "pointer", width: "50vw" };
  const sectionTitle = { fontSize: "28px", fontWeight: "600", color: "#333", marginBottom: "10px", textAlign: "center", cursor: "pointer" };
  const listItem = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", fontSize: "22px" };
  const circle = (color) => ({ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: color, marginRight: "10px" });
  const progress = (c1, c2) => ({ display: "flex", width: "90px", height: "20px", borderRadius: "4px", overflow: "hidden", background: `linear-gradient(to right, ${c1} 60%, ${c2} 40%)`, marginLeft: "auto" });
  const smallText = { fontSize: "15px", color: "#666", textAlign: "left" };
  const itemContent = { display: "flex", alignItems: "flex-start", flexDirection: "column", textAlign: "left" };

  const operationsItems = [
    { color: "#D4C7B0", title: "QuestionPaper", desc: "Syllabus, performance, Attendance, Behaviour, Certificates", link: "/Test" },
    { color: "#868C8F", title: "Certificates", desc: "Group Chat, Chatting assign, Parents Messaging", link: "/Certificates" },
    { color: "#705B56", title: "Invigilations", desc: "Generation, Substitutes", link: "/SeatingArrangement" },
    { color: "#D9EEF8", title: "Incharge", desc: "Question Paper, Evaluator, Invigilator", link: "/operations/exam" },
        { color: "#D9EEF8", title: "ReportCard", desc: "Question Paper, Evaluator, Invigilator", link: "/students-attendance" },

  ];

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
      <div style={{ fontSize: "22px", fontWeight: "600", marginBottom: "15px", textAlign: "left" }}>
        {name ? `Welcome ${name}..!` : "Welcome Admin..!"}
      </div>

      {/* Operations Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div style={card}>
          <div style={sectionTitle}>Examination</div>
          {operationsItems.map((i) => (
            <div key={i.title} style={listItem} onClick={() => navigate(i.link)}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={circle(i.color)}></div>
                <div style={itemContent}>
                  <div style={{ fontWeight: "500", cursor: "pointer" }}>{i.title}</div>
                  <div style={smallText}>{i.desc}</div>
                </div>
              </div>
              <div style={progress("#B97FA5", "#92D09B")}></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExaminationPage;
