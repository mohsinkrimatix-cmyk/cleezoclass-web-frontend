import React, { useEffect, useState } from "react";
import axios from "axios";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock,
  faUserTimes,
  faMoneyCheckAlt,
  faRupeeSign,
  faBriefcaseMedical,
  faMinusCircle,
  faBookReader,
  faUserCheck,
  faTrophy,
  faExclamationCircle,
  faAward,
} from "@fortawesome/free-solid-svg-icons";

export default function EnrollmentBiometrics() {
  // ------------------------------
  // COMMON STYLES
  // ------------------------------
  const outerContainer = {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#fff",
    minHeight: "70vh",
    padding: "10px",
    boxSizing: "border-box", 
  };

  const innerContainer = {
    width: "90%",
    maxWidth: "1000px",
    display: "flex",
    gap: "10px",
    padding: "15px",
    background: "#fff",
    borderRadius: "10px",
    //boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
    margin: "20px auto",
  };

  const headingStyle = {
    position: "absolute",
    top: "15px",
    fontSize: "20px",
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
  };

  const leftColumn = {
    flex: 2,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const rightColumn = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginTop: "38px",
  };

  const card = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    minHeight: "130px",
    boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
    fontSize: "12px",
    height: "100%",
    border: "1px solid #ccc",
  };

  const cardLarge = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    minHeight: "260px",   //
    boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
    height: "auto",
    border: "1px solid #ccc",
    
  };

  const thStyle = {
    padding: "8px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "12px",
    borderBottom: "1px solid #ccc",
  };

  const tdStyle = {
    padding: "6px",
    textAlign: "center",
    fontSize: "12px",
    borderBottom: "1px solid #e0e0e0",
  };

  // ------------------------------
  // ATTENDANCE STATES
  // ------------------------------
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("");
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

  const fetchIrregulars = async () => {
    try {
      const res = await axios.get(
        "https://cleezoclass.com:4000/teacher-list-of-irregulars",
        {
          params: { schoolCode },
        }
      );
      setRecords(res.data);
    } catch (err) {
      console.error("Error fetching irregular teachers:", err);
    }
  };

  useEffect(() => {
    fetchIrregulars();
  }, [filter]);

  // ------------------------------
  // ADMISSIONS STATES
  // ------------------------------
  const [admissions, setAdmissions] = useState([]);
  const [loadingAdmissions, setLoadingAdmissions] = useState(true);
  const [admissionError, setAdmissionError] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const response = await axios.get(
          "https://cleezoclass.com:4000/newadmissions",
          {
            params: { schoolCode },
          }
        );
        setAdmissions(response.data);
      } catch (err) {
        console.error("Error fetching admissions:", err);
        setAdmissionError("Failed to fetch data.");
      } finally {
        setLoadingAdmissions(false);
      }
    };
    fetchAdmissions();
  }, []);

  // ------------------------------
  // TEACHERS / ACTIVE EMPLOYEES (FIXED)
  // ------------------------------
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherError, setTeacherError] = useState("");

  useEffect(() => {
    const fetchAllTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const response = await axios.post(
          "https://cleezoclass.com:4000/api/users",
          {
            schoolCode,
            user_type: "teacher",
          }
        );
        setTeachers(response.data);
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setTeacherError("Failed to fetch teachers");
      } finally {
        setLoadingTeachers(false);
      }
    };
    fetchAllTeachers();
  }, [schoolCode]);

  // ------------------------------
  // POPUPS
  // ------------------------------
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [showAdmissionsPopup, setShowAdmissionsPopup] = useState(false);
  const [showTeachersPopup, setShowTeachersPopup] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedMonthForDeductions, setSelectedMonthForDeductions] =
    useState("");
  const [report, setReport] = useState(null);
  const [report1, setReport1] = useState({
    total_pf: 0,
    total_mediclaim: 0,
    other_deductions: 0,
    total_pay: 0,
    late_count: 0,
    absent_count: 0,
  });

  const months = [
    "2025-01",
    "2025-02",
    "2025-03",
    "2025-04",
    "2025-05",
    "2025-06",
    "2025-07",
    "2025-08",
    "2025-09",
    "2025-10",
    "2025-11",
    "2025-12",
  ];

  const fetchReport = async (month) => {
    try {
      const res = await axios.get(
        `https://cleezoclass.com:4000/api/salary-report?month=${month}`
      );
      setReport(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReport1 = async (month) => {
    if (!month) return;
    try {
      const deductionRes = await axios.get(
        `https://cleezoclass.com:4000/api/monthly-deductions?month=${month}`
      );
      const lateRes = await axios.get(
        `https://cleezoclass.com:4000/teacher-list-of-latecomers-time`,
        {
          params: { schoolCode: "TAGSOLNOVALLP", month },
        }
      );
      const absentRes = await axios.get(
        `https://cleezoclass.com:4000/teacher-list-of-irregulars-time`,
        {
          params: { schoolCode: "TAGSOLNOVALLP", month },
        }
      );
      setReport1({
        total_pf: deductionRes.data.total_pf || 0,
        total_mediclaim: deductionRes.data.total_mediclaim || 0,
        other_deductions: deductionRes.data.other_deductions || 0,
        total_pay: deductionRes.data.total_pay || 0,
        late_count: lateRes.data.length || 0,
        absent_count: absentRes.data.length || 0,
      });
    } catch (err) {
      console.error("Error fetching monthly report:", err);
    }
  };

  const handleView = (type) => {
    alert(`View details for: ${type}`);
  };

  const boxStyle = {
    flex: 1,
    padding: "8px",
    borderRight: "1px solid #ccc",
    borderRadius: "4px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    height: "160px",
    margin: "0 2px",
  };

  const iconStyle = { fontSize: "20px", marginBottom: "5px", color: "#000" };

  const btnStyle = {
    padding: "4px 8px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    background: "#fff",
    color: "#3498db",
    fontSize: "11px",
    marginTop: "5px",
    width: "auto",
  };

  return (
    <div style={outerContainer}>
      <h2 style={headingStyle}>Recruitments & Exits</h2>
      <div style={innerContainer}>
        {/* LEFT COLUMN */}
        <div style={leftColumn}>
          <h2 style={{ textAlign: "center", fontSize: '14px', margin: "0 0 10px 0",fontWeight:'bold' }}>
            Process Pay Run For {selectedMonth}
          </h2>
          <div style={cardLarge}>
            {/* Month selection */}
            <div style={{ marginBottom: "15px", textAlign: "right" }}>
              <select
                id="month"
                style={{
                  padding: "6px",
                  fontSize: "13px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  minWidth: "120px",
                }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {/* Boxes row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "5px",
                marginBottom: "15px",
                paddingBottom: "15px",
                borderBottom: "1px solid #ccc",
              }}
            >
              {/* Low performer syllabus */}
              <div style={boxStyle}>
                <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
                <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>
                  Low Performer Syllabus
                </h4>
                <p
                  style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}
                >
                  12
                </p>
                <button
                  style={btnStyle}
                  onClick={() => handleView("Low Performer Syllabus")}
                >
                  View List
                </button>
              </div>
              {/* Low performer attendance */}
              <div style={boxStyle}>
                <FontAwesomeIcon icon={faUserCheck} style={iconStyle} />
                <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>
                  Low Performer Attendance
                </h4>
                <p
                  style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}
                >
                  9
                </p>
                <button
                  style={btnStyle}
                  onClick={() => handleView("Low Performer Attendance")}
                >
                  View List
                </button>
              </div>
              {/* Best performer */}
              <div style={boxStyle}>
                <FontAwesomeIcon icon={faTrophy} style={iconStyle} />
                <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>
                  Best Performer
                </h4>
                <p
                  style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}
                >
                  15
                </p>
                <button
                  style={btnStyle}
                  onClick={() => handleView("Best Performer")}
                >
                  View List
                </button>
              </div>
            </div>
            {/* Notes section */}
            <div style={{ marginTop: "15px" }}>
              <h2
                style={{
                  textAlign: "left",
                  fontSize: "12px",
                  margin: "0 0 15px 0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faExclamationCircle}
                  style={{ marginRight: "5px", fontSize: "12px" }}
                />
                1. Low performers due to syllabus delay
              </h2>
              <h2
                style={{
                  textAlign: "left",
                  fontSize: "12px",
                  margin: "0 0 15px 0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <FontAwesomeIcon
                  icon={faAward}
                  style={{ marginRight: "5px", fontSize: "12px" }}
                />
                2. Best performers deserve Best Performer Award
              </h2>
            </div>
          </div>
          <div style={cardLarge}>
            <div
              style={{
                flex: "0 0 60%",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "15px",
                background: "#f9f9f9",
              }}
            >
              <div style={{ marginBottom: "15px", textAlign: "right" }}>
                <select
                  id="month-deductions"
                  style={{
                    padding: "6px",
                    fontSize: "13px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    minWidth: "120px",
                  }}
                  value={selectedMonthForDeductions}
                  onChange={(e) => {
                    setSelectedMonthForDeductions(e.target.value);
                    fetchReport1(e.target.value);
                  }}
                >
                  <option value="">Select Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "5px",
                }}
              >
                <div
                  style={{
                    ...boxStyle,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faUserClock}
                    style={{ ...iconStyle }}
                  />
                  <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>
                    Staffless class
                  </h4>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      margin: "5px 0",
                    }}
                  >
                    52
                  </p>
                  <button
                    onClick={() => handleView("Latecomers")}
                    style={{
                      padding: "6px 10px", // Adjust padding to make the button compact
                      borderRadius: "8px", // Rounded corners
                      background: "transparent", // Transparent background
                      color: "#3498db", // Button text color
                      border: "1px solid #3498db", // Optional: Adds a blue border to make the button visible
                      cursor: "pointer",
                      fontSize: "12px",
                      margin: 0, // Removes any extra margin
                      width: "auto", // Auto width based on text size
                    }}
                  >
                    View List
                  </button>
                </div>
                <div
                  style={{
                    ...boxStyle,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faUserTimes}
                    style={{ ...iconStyle }}
                  />
                  <h4
                    style={{
                      margin: "0 0 5px 0",
                      fontSize: "12px",
                      minHeight: "20px",
                    }}
                  >
                    Substitute Teacher
                  </h4>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      margin: "5px 0",
                    }}
                  >
                    12
                  </p>
                  <button
                    onClick={() => handleView("Absentees")}
                    style={{
                      padding: "6px 10px", // Adjust padding to make the button compact
                      borderRadius: "8px", // Rounded corners
                      background: "transparent", // Transparent background
                      color: "#3498db", // Button text color
                      border: "1px solid #3498db", // Optional: Adds a blue border to make the button visible
                      cursor: "pointer",
                      fontSize: "12px",
                      margin: 0, // Removes any extra margin
                      width: "auto", // Auto width based on text size
                    }}
                  >
                    View List
                  </button>
                </div>
                <div
                  style={{
                    ...boxStyle,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faMoneyCheckAlt}
                    style={{ ...iconStyle }}
                  />
                  <h4
                    style={{
                      margin: "0 0 5px 0",
                      fontSize: "12px",
                      minHeight: "20px",
                    }}
                  >
                    Required Hiring
                  </h4>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      margin: "5px 0",
                    }}
                  >
                    6
                  </p>
                  <button
                    onClick={() => handleView("PF")}
                    style={{
                      padding: "6px 10px", // Adjust padding to make the button compact
                      borderRadius: "8px", // Rounded corners
                      background: "transparent", // Transparent background
                      color: "#3498db", // Button text color
                      border: "1px solid #3498db", // Optional: Adds a blue border to make the button visible
                      cursor: "pointer",
                      fontSize: "12px",
                      margin: 0, // Removes any extra margin
                      width: "auto", // Auto width based on text size
                    }}
                  >
                    View List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT COLUMN */}
        <div style={rightColumn}>
          <div style={card}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 5px 0",
              }}
            >
              Low Performer
            </h3>
            <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>15</h3>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => setShowAdmissionsPopup(true)}
                style={{
                  padding: "6px 10px", // Adjust padding to make the button compact
                  borderRadius: "8px", // Rounded corners
                  background: "transparent", // Transparent background
                  color: "#3498db", // Button text color
                  border: "1px solid #3498db", // Optional: Adds a blue border to make the button visible
                  cursor: "pointer",
                  fontSize: "12px",
                  margin: 0, // Removes any extra margin
                  width: "auto", // Auto width based on text size
                }}
              >
                view list
              </button>
            </div>
          </div>

          <div style={card}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 5px 0",
              }}
            >
              Pending Hiring
            </h3>
            <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>4</h3>
            <h3 style={{ fontSize: "12px", margin: "0 0 5px 0" }}>
              New Approval
            </h3>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => setShowAdmissionsPopup(true)}
                style={{
                  padding: "6px 10px", // Adjust padding to make the button compact
                  borderRadius: "8px", // Rounded corners
                  background: "transparent", // Transparent background
                  color: "#3498db", // Button text color
                  border: "1px solid #3498db", // Optional: Adds a blue border to make the button visible
                  cursor: "pointer",
                  fontSize: "12px",
                  margin: 0, // Removes any extra margin
                  width: "auto", // Auto width based on text size
                }}
              >
                Approved
              </button>
            </div>
          </div>

          <div style={card}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 5px 0",
              }}
            >
              Pending Exit Formalities
            </h3>
            <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>7</h3>
            <h3 style={{ fontSize: "12px", margin: "0 0 5px 0" }}>
              Need Approval
            </h3>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => setShowAdmissionsPopup(true)}
                style={{
                  padding: "6px 10px", // Adjust padding to make the button compact
                  borderRadius: "8px", // Rounded corners
                  background: "transparent", // Transparent background
                  color: "#3498db", // Button text color
                  border: "1px solid #3498db", // Optional: Adds a blue border to make the button visible
                  cursor: "pointer",
                  fontSize: "12px",
                  margin: 0, // Removes any extra margin
                  width: "auto", // Auto width based on text size
                }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* POPUPS */}
      {showTeachersPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "8px",
              padding: "15px",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "15px",
                fontSize: "18px",
              }}
            >
              Teacher Details
            </h2>
            {loadingTeachers ? (
              <p style={{ textAlign: "center", fontSize: "14px" }}>
                Loading...
              </p>
            ) : teacherError ? (
              <p
                style={{ textAlign: "center", color: "red", fontSize: "14px" }}
              >
                {teacherError}
              </p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "rgba(141,171,182,255)",
                      color: "#fff",
                    }}
                  >
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Gender</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Designation</th>
                    <th style={thStyle}>School</th>
                    <th style={thStyle}>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t, index) => (
                    <tr
                      key={t.id}
                      style={{
                        background: index % 2 === 0 ? "#fafafa" : "#f1f6fa",
                      }}
                    >
                      <td style={tdStyle}>{t.id}</td>
                      <td style={tdStyle}>{t.teacher_name}</td>
                      <td style={tdStyle}>{t.gender}</td>
                      <td style={tdStyle}>{t.phone_no}</td>
                      <td style={tdStyle}>{t.designation}</td>
                      <td style={tdStyle}>{t.school_name}</td>
                      <td style={tdStyle}>{t.address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              onClick={() => setShowTeachersPopup(false)}
              style={{
                marginTop: "15px",
                padding: "6px 12px",
                background: "rgba(141,171,182,255)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                float: "right",
                fontSize: "12px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showAttendancePopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "8px",
              padding: "15px",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "15px",
                fontSize: "18px",
              }}
            >
              📋 Irregular Attendance
            </h2>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              {["All", "Informed", "UnInformed"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type === "All" ? "" : type)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "15px",
                    cursor: "pointer",
                    background:
                      filter === type || (type === "All" && filter === "")
                        ? "#3498db"
                        : "#ecf0f1",
                    color:
                      filter === type || (type === "All" && filter === "")
                        ? "#fff"
                        : "#000",
                    border: "none",
                    fontSize: "12px",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "rgba(141,171,182,255)",
                    color: "#fff",
                    textAlign: "left",
                  }}
                >
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Designation</th>
                  <th style={thStyle}>Total Absent Days</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((rec, index) => (
                    <tr
                      key={rec.teacher_id}
                      style={{
                        background: index % 2 === 0 ? "#fdfdfd" : "#f5f9fc",
                        transition: "background 0.3s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#e8f4fd")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          index % 2 === 0 ? "#fdfdfd" : "#f5f9fc")
                      }
                    >
                      <td style={tdStyle}>{rec.teacher_id}</td>
                      <td style={tdStyle}>{rec.teacher_name}</td>
                      <td style={tdStyle}>{rec.username}</td>
                      <td style={tdStyle}>{rec.designation || "-"}</td>
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: "bold",
                          color: "#c0392b",
                        }}
                      >
                        {rec.total_absent_days}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        textAlign: "center",
                        padding: "15px",
                        color: "#7f8c8d",
                        fontSize: "12px",
                      }}
                    >
                      No irregular teachers found for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <button
              onClick={() => setShowAttendancePopup(false)}
              style={{
                marginTop: "15px",
                padding: "6px 12px",
                background: "rgba(141,171,182,255)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                float: "right",
                fontSize: "12px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showAdmissionsPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "8px",
              padding: "15px",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "15px",
                fontSize: "18px",
              }}
            >
              📝 New Admissions
            </h2>
            {loadingAdmissions ? (
              <p style={{ textAlign: "center", fontSize: "14px" }}>
                Loading admissions…
              </p>
            ) : admissionError ? (
              <p
                style={{ color: "red", textAlign: "center", fontSize: "14px" }}
              >
                {admissionError}
              </p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "rgba(141,171,182,255)",
                      color: "#fff",
                    }}
                  >
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Student Name</th>
                    <th style={thStyle}>DOB</th>
                    <th style={thStyle}>Gender</th>
                    <th style={thStyle}>Class Applied</th>
                    <th style={thStyle}>Father Name</th>
                    <th style={thStyle}>Mother Name</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>City</th>
                  </tr>
                </thead>
                <tbody>
                  {admissions.map((student, index) => (
                    <tr
                      key={student.id}
                      style={{
                        background: index % 2 === 0 ? "#fafafa" : "#f1f6fa",
                      }}
                    >
                      <td style={tdStyle}>{student.id}</td>
                      <td style={tdStyle}>{student.student_name}</td>
                      <td style={tdStyle}>{formatDate(student.dob)}</td>
                      <td style={tdStyle}>{student.gender}</td>
                      <td style={tdStyle}>{student.applying_for}</td>
                      <td style={tdStyle}>{student.father_name}</td>
                      <td style={tdStyle}>{student.mother_name}</td>
                      <td style={tdStyle}>{student.phone}</td>
                      <td style={tdStyle}>{student.city}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              onClick={() => setShowAdmissionsPopup(false)}
              style={{
                marginTop: "15px",
                padding: "6px 12px",
                background: "rgba(141,171,182,255)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                float: "right",
                fontSize: "12px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}