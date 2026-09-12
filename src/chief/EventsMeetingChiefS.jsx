import React, { useEffect, useState } from "react";
import axios from "axios";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock,
  faUserTimes,
  faMoneyCheckAlt,
  faBookReader,
  faUserCheck,
  faTrophy,
  faExclamationCircle,
  faAward,
} from "@fortawesome/free-solid-svg-icons";

export default function EventsMeetingsChief() {
  // ------------------------------
  // COMMON STYLES (Keep as is)
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
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const rightColumn = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const card = {
    background: "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    border: "1px solid #ccc",
  };

  const cardLarge = {
    background: "#fff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
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
  // NEW CHAT & EVENT STATES
  // ------------------------------
  const [chatSummary, setChatSummary] = useState({
    total_chats: 0,
    chats_pending_approval: 0,
    chats_accepted: 0,
  });
  const [eventSummary, setEventSummary] = useState({
    total_events: 0,
    upcoming_events: 4, // Retaining as constant/fallback
    conducted_events: 1, // Retaining as constant/fallback
  });

  // ------------------------------
  // NEW EVENT DETAIL STATES
  // ------------------------------
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showUpcomingEventsPopup, setShowUpcomingEventsPopup] = useState(false);

  // ------------------------------
  // OLD STATES (Kept from original file)
  // ------------------------------
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("");
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
  const [admissions, setAdmissions] = useState([]);
  const [loadingAdmissions, setLoadingAdmissions] = useState(true);
  const [admissionError, setAdmissionError] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherError, setTeacherError] = useState("");
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  // ------------------------------
  // DATA FETCHING LOGIC
  // ------------------------------

  // Fetch Chat Summary
  const fetchChatSummary = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:5000/api/chat-summary", {
        params: { schoolCode },
      });
      setChatSummary(res.data);
    } catch (err) {
      console.error("Error fetching chat summary:", err);
    }
  };

  // Fetch Total Events Count
  const fetchTotalEvents = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:5000/api/event-summary", {
        params: { schoolCode },
      });
      setEventSummary((prev) => ({
        ...prev,
        total_events: res.data.total_events || 0,
      }));
    } catch (err) {
      console.error("Error fetching event summary:", err);
    }
  };

  // Fetch Upcoming Events LIST (NEW)
  const fetchUpcomingEvents = async () => {
    setLoadingEvents(true);
    try {
      // NOTE: This assumes a new backend endpoint exists for event list
      const res = await axios.get("https://cleezoclass.com:5000/api/upcoming-events", {
        params: { schoolCode },
      });
      setUpcomingEvents(res.data);
    } catch (err) {
      console.error("Error fetching upcoming events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch Irregulars (Kept from original file)
  const fetchIrregulars = async () => {
    try {
      const res = await axios.get(
        "https://cleezoclass.com:5000/teacher-list-of-irregulars",
        {
          params: { schoolCode },
        }
      );
      setRecords(res.data);
    } catch (err) {
      console.error("Error fetching irregular teachers:", err);
    }
  };

  // Fetch Admissions (Kept from original file)
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const response = await axios.get(
          "https://cleezoclass.com:5000/newadmissions",
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
  }, [schoolCode]);

  // Fetch Teachers (Kept from original file)
  useEffect(() => {
    const fetchAllTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const response = await axios.post(
          "https://cleezoclass.com:5000/api/users",
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

  // Combined Effect Hook for Live Data
  useEffect(() => {
    fetchIrregulars();
    fetchChatSummary();
    fetchTotalEvents();
    fetchUpcomingEvents(); // Fetch event list
  }, [filter, schoolCode]);

  // Other utility functions (Kept from original file)
  const fetchReport = async (month) => {
    // ... implementation for salary report
  };

  const fetchReport1 = async (month) => {
    // ... implementation for monthly deductions/attendance report
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
  };

  const smallBtnStyle = {
    padding: "6px 10px",
    borderRadius: "8px",
    background: "transparent",
    color: "#3498db",
    border: "1px solid #3498db",
    cursor: "pointer",
    fontSize: "12px",
    margin: 0,
    width: "150px",
  };

  return (
    <div style={outerContainer}>
      <h2 style={headingStyle}>Events & Meetings</h2>
      <div style={innerContainer}>
        {/* LEFT COLUMN */}
        <div style={leftColumn}>
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
            {/* Boxes row - UPDATED with Chat Summary Data */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "5px",
              }}
            >
              {/* Live chat-total */}
              <div style={boxStyle}>
                <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
                <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>
                  Live chat-total
                </h4>
                <p
                  style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}
                >
                  {chatSummary.total_chats}
                </p>
                <button
                  style={btnStyle}
                  onClick={() => handleView("Total Chats")}
                >
                  View status
                </button>
              </div>
              {/* Live chat - Accepted */}
              <div style={boxStyle}>
                <FontAwesomeIcon icon={faUserCheck} style={iconStyle} />
                <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>
                  Live chat - Accepted
                </h4>
                <p
                  style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}
                >
                  {chatSummary.chats_accepted}
                </p>
                <button
                  style={btnStyle}
                  onClick={() => handleView("Accepted Chats")}
                >
                  View Report
                </button>
              </div>
              {/* Live chat-Request (Pending Approval) */}
              <div style={boxStyle}>
                <FontAwesomeIcon icon={faTrophy} style={iconStyle} />
                <h4 style={{ margin: "0 0 5px 0", fontSize: "12px" }}>
                  Live chat-Request
                </h4>
                <p
                  style={{ fontSize: "16px", fontWeight: "bold", margin: "0" }}
                >
                  {chatSummary.chats_pending_approval}
                </p>
                <button
                  style={btnStyle}
                  onClick={() => handleView("Pending Chat Requests")}
                >
                  Need Approval
                </button>
              </div>
            </div>
            {/* Notes section - UPDATED with Chat Summary Data */}
            <div style={{ marginTop: "15px" }}>
              <h2
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  margin: "0 0 5px 0",
                }}
              >
                <FontAwesomeIcon
                  icon={faExclamationCircle}
                  style={{ marginRight: "5px", fontSize: "12px" }}
                />
                {chatSummary.chats_pending_approval} live chat informal discussions
              </h2>
              <h2
                style={{ textAlign: "center", fontSize: "12px", margin: "0" }}
              >
                <FontAwesomeIcon
                  icon={faAward}
                  style={{ marginRight: "5px", fontSize: "12px" }}
                />
                {chatSummary.chats_accepted} Live chat accepted sessions
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
                {/* Upcoming Events - Opens NEW Popup */}
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
                    Upcoming Events
                  </h4>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      margin: "5px 0",
                    }}
                  >
                    {eventSummary.upcoming_events}
                  </p>
                  <button
                    onClick={() => setShowUpcomingEventsPopup(true)} // <-- NEW ACTION
                    style={smallBtnStyle}
                  >
                    Need Approval
                  </button>
                </div>
                {/* Events Conducted */}
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
                    Events Conducted
                  </h4>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      margin: "5px 0",
                    }}
                  >
                    {eventSummary.conducted_events}
                  </p>
                  <button
                    onClick={() => handleView("Absentees")}
                    style={smallBtnStyle}
                  >
                    View status
                  </button>
                </div>
                {/* Photo share */}
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
                    Photo share
                  </h4>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      margin: "5px 0",
                    }}
                  >
                    1
                  </p>
                  <button
                    onClick={() => handleView("Photo Share")}
                    style={smallBtnStyle}
                  >
                    Need Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* RIGHT COLUMN */}
        <div style={rightColumn}>
          {/* Live Chat Card - UPDATED with State */}
          <div style={card}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 5px 0",
              }}
            >
              Live chat
            </h3>
            <h3 style={{ fontSize: "14px", margin: "0 0 5px 0", fontWeight: "bold" }}>
              Total: {chatSummary.total_chats}
            </h3>
            <h3 style={{ fontSize: "14px", margin: "0 0 5px 0", color: "#e74c3c" }}>
              Action needed: {chatSummary.chats_pending_approval}
            </h3>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => handleView("Live Chat Action")}
                style={smallBtnStyle}
              >
                Action
              </button>
            </div>
          </div>
          {/* Festive Greetings (Kept as is) */}
          <div style={card}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 5px 0",
              }}
            >
              Festive Greetings
            </h3>
            <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>114</h3>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => setShowAttendancePopup(true)}
                style={smallBtnStyle}
              >
                View List
              </button>
            </div>
          </div>
          {/* Upcoming Events Card - Opens NEW Popup */}
          <div style={card}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 5px 0",
              }}
            >
              Upcoming Events
            </h3>
            <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>{eventSummary.upcoming_events}</h3>
            <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>
              View Status
            </h3>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "8px",
              }}
            >
              <button
                onClick={() => setShowUpcomingEventsPopup(true)} // <-- NEW ACTION
                style={smallBtnStyle}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* ========================================= */}
      {/* POPUPS SECTION                          */}
      {/* ========================================= */}

      {/* NEW POPUP: Upcoming Events Details */}
      {showUpcomingEventsPopup && (
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
              maxWidth: "800px",
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
              Upcoming Events ({upcomingEvents.length})
            </h2>
            {loadingEvents ? (
              <p style={{ textAlign: "center", fontSize: "14px" }}>
                Loading event details...
              </p>
            ) : upcomingEvents.length === 0 ? (
              <p style={{ textAlign: "center", fontSize: "14px" }}>
                No upcoming events found.
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
                    <th style={thStyle}>Event ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingEvents.map((event, index) => (
                    <tr
                      key={event.id}
                      style={{
                        background: index % 2 === 0 ? "#fafafa" : "#f1f6fa",
                      }}
                    >
                      <td style={tdStyle}>{event.id}</td>
                      <td style={tdStyle}>{event.event_name}</td>
                      <td style={tdStyle}>{formatDate(event.event_date)}</td>
                      <td style={tdStyle}>{event.status}</td>
                      <td style={tdStyle}>{event.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              onClick={() => setShowUpcomingEventsPopup(false)}
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

      {/* Teacher Details Popup (Kept as is, using `teachers` state) */}
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

      {/* Irregular Attendance Popup (Kept as is, using `records` state) */}
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
              Irregular Attendance
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

      {/* New Admissions Popup (Kept as is, using `admissions` state) */}
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
              New Admissions
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