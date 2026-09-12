import React, { useEffect, useState } from "react";
import axios from "axios";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock,
  faUserTimes,
  faMoneyCheckAlt,
  faRupeeSign,
  faBriefcaseMedical,
  faMinusCircle
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
    width: "85%",
    maxWidth: "1000px",
    display: "flex",
    gap: "15px",
    padding: "20px",
    background: "#fff",
    borderRadius: "12px",
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
    width: "65%",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    
  };
  const rightColumn = {
    width: "35%",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginTop: "40px",
  };
  const card = {
    background: "#fff",
    padding: "12px",
    borderRadius: "8px",
    minHeight: "100px",
    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
    border: "1px solid #ccc",
    flex: 1,
  };
  const cardLarge = {
    background: "#fff",
    padding: "12px",
    borderRadius: "8px",
    minHeight: "160px",
    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
    border: "1px solid #ccc",
  };
  const thStyle = {
    padding: "8px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "12px",
    borderBottom: "1px solid #ccc",
    borderLeft:'1px solid #ccc'
  };
  const tdStyle = {
    padding: "6px",
    textAlign: "center",
    fontSize: "12px",
    borderBottom: "1px solid #e0e0e0",
    borderLeft:'1px solid #ccc'
  };

  // ------------------------------
  // ATTENDANCE STATES
  // ------------------------------
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("");
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

  const fetchIrregulars = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/teacher-list-of-irregulars", {
        params: { schoolCode },
      });
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
        const response = await axios.get("https://cleezoclass.com:4000/newadmissions", {
          params: { schoolCode },
        });
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
  // TEACHERS STATES
  // ------------------------------
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherError, setTeacherError] = useState("");

  useEffect(() => {
    const fetchAllTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const response = await axios.post("https://cleezoclass.com:4000/api/users", {
          schoolCode,
          user_type: "teacher",
        });
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
  // POPUPS AND REPORTS
  // ------------------------------
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [showAdmissionsPopup, setShowAdmissionsPopup] = useState(false);
  const [showTeachersPopup, setShowTeachersPopup] = useState(false);
  const [showLatecomersPopup, setShowLatecomersPopup] = useState(false);
  
  // NEW/UPDATED STATE: Stores the single combined value 'YYYY-M' (e.g., '2025-7')
  const [selectedMonthYear, setSelectedMonthYear] = useState(""); 

  const [report, setReport] = useState(null);
  const [report1, setReport1] = useState({
    total_pf: 0,
    total_mediclaim: 0,
    other_deductions: 0,
    total_pay: 0,
    late_count: 0,
    absent_count: 0,
  });
  const [latecomers, setLatecomers] = useState([]);

  // Helper function to generate options for the single dropdown
  const generateMonthYearOptions = (startYear, endYear) => {
    const options = [];
    for (let y = startYear; y <= endYear; y++) {
      for (let m = 1; m <= 12; m++) {
        options.push(`${y}-${m}`); // Value: 2025-7, Display: 2025-7
      }
    }
    return options;
  };
  const monthYearOptions = generateMonthYearOptions(2024, 2026); 
  
  // Helper function to parse the combined month/year string
  const parseMonthYear = (monthYear) => {
    if (!monthYear) return { month: null, year: null };
    // Splits '2025-7' into ['2025', '7']
    const [year, month] = monthYear.split('-');
    return { month, year }; 
  };

const fetchReport = async (monthYear) => {
  const schoolCode = localStorage.getItem("schoolCode");
  const { month, year } = parseMonthYear(monthYear);
  if (!month || !year) return;

  const monthYearFormatted = `${year}-${String(month).padStart(2, '0')}`;

  try {
    const res = await axios.get(
      `https://cleezoclass.com:4000/api/api/salary-report`,
      { params: { month: monthYearFormatted, schoolCode } }
    );

    setReport(res.data);
  } catch (err) {
    console.error(err);
  }
};

const fetchReport1 = async (monthYear) => {
  const schoolCode = localStorage.getItem("schoolCode");

  const { month, year } = parseMonthYear(monthYear);
  if (!month || !year) return;

  try {
    // 1. Monthly deductions
    const monthYearFormatted = `${year}-${String(month).padStart(2, '0')}`;
    
    const deductionRes = await axios.get(
      `https://cleezoclass.com:4000/api/api/monthly-deductions`,
      { params: { month: monthYearFormatted, schoolCode } }
    );

    // 2. Latecomers
    const lateRes = await axios.get(
      `https://cleezoclass.com:4000/api/teacher-list-of-latecomers`,
      { params: { schoolCode, month, year } }
    );

    // 3. Absentees
    const absentRes = await axios.get(
      `https://cleezoclass.com:4000/teacher-list-of-irregulars-time`,
      { params: { schoolCode, month, year } }
    );

    // 4. Update state
    setReport1({
      total_pf: deductionRes.data.total_pf || 0,
      total_mediclaim: deductionRes.data.total_mediclaim || 0,
      other_deductions: deductionRes.data.other_deductions || 0,
      total_pay: deductionRes.data.total_pay || 0,
      late_count: lateRes.data.length || 0,
      absent_count: absentRes.data.length || 0,
    });

    setLatecomers(lateRes.data);

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
    height: "140px",
    margin: "0 2px",
  };
  const iconStyle = { fontSize: "16px", marginBottom: "5px", color: "#000" };

  const displayMonthYear = selectedMonthYear ? selectedMonthYear.replace('-', '/') : '';


  return (
    <div style={outerContainer}>
      <h2 style={headingStyle}>Attendance and Payroll</h2>
      <div style={innerContainer}>
        {/* LEFT COLUMN */}
        <div style={leftColumn}>
          <h2 style={{ textAlign: "center", fontSize: '14px', margin: "0 0 10px 0",fontWeight:'bold' }}>
            Process Pay Run For {displayMonthYear}
          </h2>
          <div style={cardLarge}>
            {/* Month/Year Selection (Payroll Report) */}
            <div style={{ marginBottom: "15px", textAlign: "right" }}>
              
              {/* Single Month/Year Dropdown */}
              <select
                id="month-year"
                style={{
                  padding: "6px",
                  fontSize: "13px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  minWidth: "160px",
                }}
                value={selectedMonthYear}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSelectedMonthYear(newValue);
                  fetchReport(newValue);
                }}
              >
                <option value="">Select Month/Year</option>
                {monthYearOptions.map((mY) => (
                  <option key={mY} value={mY}>{mY}</option>
                ))}
              </select>
            </div>
            {/* Three Columns */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
              {/* Employees Net Pay */}
              <div style={{
                flex: 1,
                borderRight: "1px solid #ccc",
                borderRadius: "4px",
                padding: "10px",
                textAlign: "center",
                background: "#fff",
                gap: "5px",
                marginBottom: "15px",
                paddingBottom: "15px",
                borderBottom: "1px solid #ccc",
                height: "80px",
              }}>
                <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>Employees Net Pay</h4>
                <p style={{ fontSize: "14px", fontWeight: "bold", margin: "0" }}>
                  ₹{report ? report.total_paid_amount : "0.00"}
                </p>
              </div>
              {/* Payment Date */}
              <div style={{
                flex: 1,
                borderRight: "1px solid #ccc",
                borderRadius: "4px",
                padding: "10px",
                textAlign: "center",
                background: "#fff",
                gap: "5px",
                marginBottom: "15px",
                paddingBottom: "15px",
                borderBottom: "1px solid #ccc",
                height: "80px"
              }}>
                <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>Payment Date</h4>
                <p style={{ fontSize: "14px", fontWeight: "bold", margin: "0" }}>
                  {report ? report.last_payment_date : "-"}
                </p>
              </div>
              {/* Number of Employees */}
              <div style={{
                flex: 1,
                borderRight: "1px solid #ccc",
                borderRadius: "4px",
                padding: "10px",
                textAlign: "center",
                background: "#fff",
                gap: "5px",
                marginBottom: "15px",
                paddingBottom: "15px",
                borderBottom: "1px solid #ccc",
                height: "80px"
              }}>
                <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>No. of Employees</h4>
                <p style={{ fontSize: "14px", fontWeight: "bold", margin: "0" }}>
                  {report ? report.total_employees_paid : "0"}
                </p>
              </div>
            </div>
            <h2 style={{
                  textAlign: "left",
                  fontSize: "12px",
                  margin: "0 0 15px 0",
                  display: "flex",
                  alignItems: "center",
                }}>
              <i className="fas fa-money-bill" style={{ marginRight: "5px", fontSize: "12px" }}></i>
              Pay your cutoff fees on {displayMonthYear || 'a selected date'}
            </h2>
          </div>
          <div style={cardLarge}>
            <div style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              background: "#f9f9f9"
            }}>
              {/* Month/Year Selection (Deductions/Attendance Report) */}
              <div style={{ marginBottom: "10px", textAlign: "right" }}>
                
                {/* Single Month/Year Dropdown */}
                <select
                  id="month-year-deductions"
                  style={{
                    padding: "6px",
                    fontSize: "13px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    minWidth: "160px",
                  }}
                  value={selectedMonthYear}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSelectedMonthYear(newValue);
                    fetchReport1(newValue);
                  }}
                >
                  <option value="">Select Month/Year</option>
                  {monthYearOptions.map((mY) => (
                    <option key={mY} value={mY}>{mY}</option>
                  ))}
                </select>
              </div>
              {/* Boxes Row */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
                {/* Latecomers */}
                <div style={{ ...boxStyle }}>
                  <FontAwesomeIcon icon={faUserClock} style={iconStyle} />
                  <h4 style={{ margin: "0", fontSize: '12px' }}>Latecomers</h4>
                  <p style={{ fontSize: "16px", fontWeight: "bold", margin: '5px 0' }}>{report1.late_count}</p>
                  <button
                    onClick={() => setShowLatecomersPopup(true)}
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
                    View
                  </button>
                </div>
                {/* Absentees */}
                <div style={{ ...boxStyle }}>
                  <FontAwesomeIcon icon={faUserTimes} style={iconStyle} />
                  <h4 style={{ margin: "0", fontSize: '12px' }}>Absentees</h4>
                  <p style={{ fontSize: "16px", fontWeight: "bold", margin: '5px 0' }}>{report1.absent_count}</p>
                  <button
                    onClick={() => setShowAttendancePopup(true)}
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
                    View
                  </button>
                </div>
                {/* PF */}
                <div style={{ ...boxStyle }}>
                  <FontAwesomeIcon icon={faMoneyCheckAlt} style={iconStyle} />
                  <h4 style={{ margin: "0", fontSize: '12px' }}>PF</h4>
                  <p style={{ fontSize: "16px", fontWeight: "bold", margin: '5px 0' }}>₹{report1.total_pf}</p>
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
                    View
                  </button>
                </div>
                {/* Total Pay */}
                <div style={{ ...boxStyle }}>
                  <FontAwesomeIcon icon={faRupeeSign} style={iconStyle} />
                  <h4 style={{ margin: "0", fontSize: '12px' }}>Total Pay</h4>
                  <p style={{ fontSize: "16px", fontWeight: "bold", margin: '5px 0' }}>₹{report1.total_pay}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT COLUMN */}
        <div style={rightColumn}>
          {/* ACTIVE EMPLOYEES */}
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0" }}>Active Employees</h3>
            <h3 style={{ fontSize: "16px", margin: "0" }}>{teachers.length}</h3>
            <button
              onClick={() => setShowTeachersPopup(true)}
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
          {/* ATTENDANCE */}
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0" }}>Attendance</h3>
            <h3 style={{ fontSize: "16px", margin: "0" }}>{records.length}</h3>
            <button
              onClick={() => setShowAttendancePopup(true)}
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
          {/* ADMISSIONS */}
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0" }}>Admissions</h3>
            <h3 style={{ fontSize: "16px", margin: "0" }}>{admissions.length}</h3>
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
              View List
            </button>
          </div>
        </div>
      </div>

      {/* POPUPS */}
      {/* Latecomers Popup */}
      {showLatecomersPopup && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
          alignItems: "center", padding: "10px", zIndex: 2000
        }}>
          <div style={{
            width: "90%", maxHeight: "90vh", overflowY: "auto",
            background: "#fff", borderRadius: "8px", padding: "15px"
          }}>
            <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "16px" }}>🕒 Latecomers for {displayMonthYear}</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>
                <thead>
                  <tr style={{ background: "rgba(141,171,182,255)", color: "#fff", textAlign: "left" }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Entry Time</th>
                    <th style={thStyle}>Exit Time</th>
                    <th style={thStyle}>Total Late Days</th>
                  </tr>
                </thead>
                <tbody>
                  {latecomers.length > 0 ? (
                    latecomers.map((rec, index) => (
                      <tr
                        key={rec.teacher_id}
                        style={{
                          background: index % 2 === 0 ? "#fdfdfd" : "#f5f9fc",
                          transition: "background 0.3s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f4fd")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? "#fdfdfd" : "#f5f9fc")}
                      >
                        <td style={tdStyle}>{rec.teacher_id}</td>
                        <td style={tdStyle}>{rec.teacher_name}</td>
                        <td style={tdStyle}>{rec.entry_time}</td>
                        <td style={tdStyle}>{rec.exit_time
 || "-"}</td>
                        <td style={{ ...tdStyle, fontWeight: "bold", color: "#c0392b" }}>{rec.working_hours}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#7f8c8d" }}>
                        No latecomers found for this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => setShowLatecomersPopup(false)}
              style={{
                marginTop: "15px", padding: "6px 12px", background: "rgba(141,171,182,255)",
                color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
                float: "right", fontSize: "12px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Attendance Popup */}
      {showAttendancePopup && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
          alignItems: "center", padding: "10px", zIndex: 2000
        }}>
          <div style={{
            width: "90%", maxHeight: "90vh", overflowY: "auto",
            background: "#fff", borderRadius: "8px", padding: "15px"
          }}>
            <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "16px" }}>📋 Irregular Attendance</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
              {["All", "Informed", "UnInformed"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type === "All" ? "" : type)}
                  style={{
                    padding: "5px 10px", borderRadius: "15px", cursor: "pointer",
                    background: filter === type || (type === "All" && filter === "") ? "#3498db" : "#ecf0f1",
                    color: filter === type || (type === "All" && filter === "") ? "#fff" : "#000",
                    border: "none", fontSize: "12px"
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "rgba(141,171,182,255)", color: "#fff", textAlign: "left" }}>
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
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#e8f4fd")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? "#fdfdfd" : "#f5f9fc")}
                    >
                      <td style={tdStyle}>{rec.teacher_id}</td>
                      <td style={tdStyle}>{rec.teacher_name}</td>
                      <td style={tdStyle}>{rec.username}</td>
                      <td style={tdStyle}>{rec.designation || "-"}</td>
                      <td style={{ ...tdStyle, fontWeight: "bold", color: "#c0392b" }}>{rec.total_absent_days}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "15px", color: "#7f8c8d", fontSize: "12px" }}>
                      No irregular teachers found for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <button
              onClick={() => setShowAttendancePopup(false)}
              style={{
                marginTop: "15px", padding: "6px 12px", background: "rgba(141,171,182,255)",
                color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
                float: "right", fontSize: "12px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Admissions Popup */}
      {showAdmissionsPopup && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
          alignItems: "center", padding: "10px", zIndex: 2000
        }}>
          <div style={{
            width: "90%", maxHeight: "90vh", overflowY: "auto",
            background: "#fff", borderRadius: "8px", padding: "15px"
          }}>
            <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "16px" }}>📝 New Admissions</h2>
            {loadingAdmissions ? (
              <p style={{ textAlign: "center", fontSize: "14px" }}>Loading admissions…</p>
            ) : admissionError ? (
              <p style={{ color: "red", textAlign: "center", fontSize: "14px" }}>{admissionError}</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "rgba(141,171,182,255)", color: "#fff" }}>
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
                    <tr key={student.id} style={{ background: index % 2 === 0 ? "#fafafa" : "#f1f6fa" }}>
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
                marginTop: "15px", padding: "6px 12px", background: "rgba(141,171,182,255)",
                color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
                float: "right", fontSize: "12px"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Teachers Popup */}
      {showTeachersPopup && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center",
          alignItems: "center", padding: "10px", zIndex: 2000
        }}>
          <div style={{
            width: "90%", maxHeight: "90vh", overflowY: "auto",
            background: "#fff", borderRadius: "8px", padding: "15px"
          }}>
            <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "16px" }}>Teacher Details</h2>
            {loadingTeachers ? (
              <p style={{ textAlign: "center", fontSize: "14px" }}>Loading...</p>
            ) : teacherError ? (
              <p style={{ textAlign: "center", color: "red", fontSize: "14px" }}>{teacherError}</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "rgba(141,171,182,255)", color: "#fff" }}>
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
                    <tr key={t.id} style={{ background: index % 2 === 0 ? "#fafafa" : "#f1f6fa" }}>
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
                marginTop: "15px", padding: "6px 12px", background: "rgba(141,171,182,255)",
                color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
                float: "right", fontSize: "12px"
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