import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "bootstrap/dist/css/bootstrap.min.css";
import { AlarmClock, Presentation, TriangleAlert, UserCog } from "lucide-react";

const AttendanceForms =  ({ view = "both" }) => {
  const navigate = useNavigate();

  const viewMode = view;
console.log("ATTENDANCE VIEW MODE ============================================", viewMode);
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState("");
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState("");

  const [alertTime, setAlertTime] = useState("");
  const [loginTime, setLoginTime] = useState("");
  const [logoutTime, setLogoutTime] = useState("");

  const [message, setMessage] = useState("");
  const [message1, setMessage1] = useState("");

  const dashboardRef = useRef(null);

  // ✅ Fetch Logo
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem("schoolCode");
      if (!code) return;

      setDynamicSchoolCode(code);

      try {
        const res = await axios.post(
          "https://cleezoclass.com:4000/api/schoollogodynamic",
          { secretecode: code }
        );

        if (res.data.logoPath) {
          setDynamicLogoSrc(res.data.logoPath);
        }
      } catch (err) {
        console.error("Logo fetch error:", err);
      }
    };

    fetchSchoolLogo();
  }, []);

  // ✅ Submit Alert Time
  const handleSubmit = async (e) => {
    e.preventDefault();
    const schoolCode = localStorage.getItem("schoolCode");

    if (!schoolCode) {
      setMessage("❌ School code missing");
      return;
    }

    try {
      const res = await axios.post(
        "https://cleezoclass.com:4000/api/attendance/set-alert-time",
        { alertTime, schoolCode }
      );

      setMessage(res.data.message);
      setAlertTime("");
    } catch {
      setMessage("❌ Error occurred");
    }
  };

  // ✅ Submit Login/Logout Time
  const handleSubmit1 = async (e) => {
    e.preventDefault();
    const schoolCode = localStorage.getItem("schoolCode");

    if (!schoolCode) {
      setMessage1("❌ School code missing");
      return;
    }

    try {
      const res = await axios.post(
        "https://cleezoclass.com:4000/attendance/set-login-logout-time",
        { loginTime, logoutTime, schoolCode }
      );

      setMessage1(res.data.message);
      setLoginTime("");
      setLogoutTime("");
    } catch {
      setMessage1("❌ Error occurred");
    }
  };

  // ✅ Download PDF
  const handleDownload = async () => {
    const input = dashboardRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    pdf.save("attendance.pdf");
  };

  return (
    <>
  

      {/* MAIN */}
      <div
  ref={dashboardRef}
  style={{
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "stretch",
    gap: "24px",
    padding: "20px",
    minHeight: "400px",
  }}
>
  {viewMode !== "teacher" && (
    <div
      style={{
        width: "420px",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "#dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px",
            fontSize: "32px",
          }}
        >
          <TriangleAlert size={34} color="#ff979f" />
        </div>

        <h4
          style={{
            margin: 0,
            fontWeight: "700",
            color: "#1e293b",
          }}
        >
          Student Alert Time
        </h4>

        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginTop: "8px",
          }}
        >
          Configure attendance notification time
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="time"
          value={alertTime}
          onChange={(e) => setAlertTime(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            marginBottom: "20px",
            fontSize: "15px",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            background: "#f9b1b8",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Save Alert Time
        </button>
      </form>

      {message && (
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            borderRadius: "10px",
            background: "#f8fafc",
            textAlign: "center",
          }}
        >
          {message}
        </div>
      )}
    </div>
  )}

  {viewMode !== "student" && (
    <div
      style={{
        width: "420px",
        background: "#ffffff",
        borderRadius: "20px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "#ffffff87",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px",
            fontSize: "32px",
          }}
        >
          <UserCog size={34} color="#f9b1b8" />
        </div>

        <h4
          style={{
            margin: 0,
            fontWeight: "700",
            color: "#1e293b",
          }}
        >
          Teacher Attendance Time
        </h4>

        <p
          style={{
            color: "#64748b",
            fontSize: "14px",
            marginTop: "8px",
          }}
        >
          Configure login and logout timings
        </p>
      </div>

      <form onSubmit={handleSubmit1}>
        <label
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#475569",
          }}
        >
          Login Time
        </label>

        <input
          type="time"
          value={loginTime}
          onChange={(e) => setLoginTime(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            marginTop: "6px",
            marginBottom: "15px",
          }}
        />

        <label
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#475569",
          }}
        >
          Logout Time
        </label>

        <input
          type="time"
          value={logoutTime}
          onChange={(e) => setLogoutTime(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            marginTop: "6px",
            marginBottom: "20px",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            background: "#f89191",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Save Attendance Time
        </button>
      </form>

      {message1 && (
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            borderRadius: "10px",
            background: "#f8fafc",
            textAlign: "center",
          }}
        >
          {message1}
        </div>
      )}
    </div>
  )}
</div>
    </>
  );
};

export default AttendanceForms;