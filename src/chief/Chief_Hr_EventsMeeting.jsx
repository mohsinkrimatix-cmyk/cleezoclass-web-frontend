import React, { useEffect, useState, useRef } from "react";
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
  faDownload,
  faPrint,
  faShareAlt,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import ErrorPopup from "../shared/ErrorPopup";
import { createPortal } from "react-dom";


export default function EventsMeetingsChief() {
  // Refs for Print/Download content
  const genericPopupContentRef = useRef(null);
  const upcomingEventsContentRef = useRef(null);
  const completedEventsContentRef = useRef(null);

  // Common styles
  const handlePrint = (title, contentRef) => {
    const content = contentRef.current;
    if (content) {
      const printWindow = window.open("", "", "height=600,width=800");
      printWindow.document.write("<html><head><title>" + title + "</title>");
      printWindow.document.write("<style>");
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #2c3e50; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        thead tr { background-color: #f2f2f2; }
      `);
      printWindow.document.write("</style>");
      printWindow.document.write("</head><body>");
      printWindow.document.write(`<h2>${title}</h2>`);
      printWindow.document.write(content.innerHTML);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleDownload = (data, filename) => {
    if (!data || data.length === 0) {
      setPopupMessage("No data to download.");
      return;
    }

    const SEPARATOR = "\t";
    const headers = Object.keys(data[0]);
    const headerRow = headers
      .map((header) =>
        `"${header.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}"`
      )
      .join(SEPARATOR);

    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          let value = row[header];
          if (typeof value === "number") {
            value = String(value);
          } else if (typeof value === "string") {
            value = value.replace(/"/g, '""').replace(/,/g, "").replace(/\n/g, " ");
          }
          if (value === null || value === undefined) {
            value = "";
          }
          return `"${value}"`;
        })
        .join(SEPARATOR)
    );

    const csvContent = [headerRow, ...csvRows].join("\n");
    const blob = new Blob([csvContent], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.xls`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEdit = (title) => {
    setPopupMessage(`[ACTION REQUIRED] Opening edit mode for: ${title}.`);
  };

  // Styles
  const outerContainer = {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#fff",
    minHeight: "70vh",
    padding: "0",
    boxSizing: "border-box",
  };

  const innerContainer = {
    width: "100%",
    height: "auto",
    maxWidth: "1200px",
    display: "flex",
    gap: "20px",
    background: "#fff",
    borderRadius: "16px",
  };

  const headingStyle = {
    position: "absolute",
    top: "15px",
    left: "5px",
    fontSize: "16px",
    fontWeight: "800",
    color: "#2F2E2EFF",
    textAlign: "left",
    width: "auto",
    marginLeft: "2%",
  };

  const leftColumn = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  const rightColumn = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  const card = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    minHeight: "130px",
    boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
    fontSize: "12px",
    height: "100%",
    border: "2px solid #ccc",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  };

  const cardLarge = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    minHeight: "300px",
    boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
    border: "2px solid #ccc",
    height: "100%",
    minWidth: "700px",
  };

const thStyle = {
  padding: "8px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "12px",
  border: "2px solid #ccc"
};

const tdStyle = {
  padding: "6px",
  textAlign: "center",
  fontSize: "12px",
  border: "1px solid #e0e0e0"
};



  // State
  const [chatSummary, setChatSummary] = useState({
    total_chats: 0,
    chats_pending_approval: 0,
    chats_accepted: 0,
  });

  const [eventSummary, setEventSummary] = useState({
    total_events: 0,
    upcoming_events: 0,
    conducted_events: 1,
    events_pending_approval: 0,
  });

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showUpcomingEventsPopup, setShowUpcomingEventsPopup] = useState(false);
  const [showCompletedEventsPopup, setShowCompletedEventsPopup] = useState(false);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [loadingCompletedEvents, setLoadingCompletedEvents] = useState(false);
const [showFestivalPopup, setShowFestivalPopup] = useState(false);
const [festivalUpcomingPage, setFestivalUpcomingPage] = useState(1);
const [festivalCompletedPage, setFestivalCompletedPage] = useState(1);
const FESTIVAL_ROWS_PER_PAGE = 10;


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
  const [selectedMonthForDeductions, setSelectedMonthForDeductions] = useState("");
  const [report, setReport] = useState(null);
  const [report1, setReport1] = useState({
    total_pf: 0,
    total_mediclaim: 0,
    other_deductions: 0,
    total_pay: 0,
    late_count: 0,
    absent_count: 0,
  });

  // Popup state
const [showPopup, setShowPopup] = useState(false);
const [popupTitle, setPopupTitle] = useState("");
const [popupData, setPopupData] = useState([]);
const [popupMessage, setPopupMessage] = useState("");

// Pagination for popup tables (10 rows per page)
const [currentPage, setCurrentPage] = useState(1);
const ROWS_PER_PAGE = 10;

const totalPages = Math.max(1, Math.ceil(popupData.length / ROWS_PER_PAGE));
const safePage = Math.min(currentPage, totalPages);

const paginatedData = popupData.slice(
  (safePage - 1) * ROWS_PER_PAGE,
  safePage * ROWS_PER_PAGE
);

useEffect(() => {
  // Reset to first page when popup content changes
  setCurrentPage(1);
}, [popupTitle, popupData.length]);

  // Generate months range
  const generateMonthsRange = (pastYears = 5, futureYears = 5) => {
    const months = [];
    const currentYear = new Date().getFullYear();

    for (let year = currentYear - pastYears; year <= currentYear + futureYears; year++) {
      for (let month = 1; month <= 12; month++) {
        const mm = String(month).padStart(2, "0");
        months.push(`${year}-${mm}`);
      }
    }
    return months;
  };

  

  const months = generateMonthsRange(5, 5);

 const filteredUpcomingEvents = selectedMonthForDeductions
  ? upcomingEvents.filter((e) => e.festival_date?.startsWith(selectedMonthForDeductions))
  : upcomingEvents;

const filteredCompletedEvents = selectedMonthForDeductions
  ? completedEvents.filter((e) => e.festival_date?.startsWith(selectedMonthForDeductions))
  : completedEvents;

const festivalUpcomingTotalPages = Math.max(
  1,
  Math.ceil(filteredUpcomingEvents.length / FESTIVAL_ROWS_PER_PAGE)
);
const festivalCompletedTotalPages = Math.max(
  1,
  Math.ceil(filteredCompletedEvents.length / FESTIVAL_ROWS_PER_PAGE)
);

const safeFestivalUpcomingPage = Math.min(festivalUpcomingPage, festivalUpcomingTotalPages);
const safeFestivalCompletedPage = Math.min(festivalCompletedPage, festivalCompletedTotalPages);

const paginatedUpcomingEvents = filteredUpcomingEvents.slice(
  (safeFestivalUpcomingPage - 1) * FESTIVAL_ROWS_PER_PAGE,
  safeFestivalUpcomingPage * FESTIVAL_ROWS_PER_PAGE
);

const paginatedCompletedEvents = filteredCompletedEvents.slice(
  (safeFestivalCompletedPage - 1) * FESTIVAL_ROWS_PER_PAGE,
  safeFestivalCompletedPage * FESTIVAL_ROWS_PER_PAGE
);

useEffect(() => {
  if (showFestivalPopup) {
    setFestivalUpcomingPage(1);
    setFestivalCompletedPage(1);
  }
}, [showFestivalPopup, selectedMonthForDeductions]);


  // Format date

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  // Fetch data
  const fetchChatSummary = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/api/api/chat-summary", {
        params: { schoolCode },
      });
      setChatSummary(res.data);
    } catch (err) {
      console.error("Error fetching chat summary:", err);
    }
  };

  const fetchTotalEvents = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/api/api/event-summary", {
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

  const fetchPendingEventsCount = async () => {
    try {
      const res = await axios.get(
        "https://cleezoclass.com:4000/api/api/pending-events-count",
        {
          params: { schoolCode },
        }
      );
      setEventSummary((prev) => ({
        ...prev,
        events_pending_approval: res.data.events_pending_approval || 0,
      }));
    } catch (err) {
      console.error("Error fetching pending events count:", err);
    }
  };

  const fetchUpcomingEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await axios.get("https://cleezoclass.com:4000/api/api/upcoming-events", {
        params: { schoolCode },
      });
      setUpcomingEvents(res.data);
      setEventSummary((prev) => ({
        ...prev,
        upcoming_events: res.data.length || 0,
      }));
    } catch (err) {
      console.error("Error fetching upcoming events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchCompletedEvents = async () => {
    setLoadingCompletedEvents(true);
    try {
      const res = await axios.get("https://cleezoclass.com:4000/api/api/completed-events", {
        params: { schoolCode },
      });
      setCompletedEvents(res.data);
      setEventSummary((prev) => ({
        ...prev,
        conducted_events: res.data.length || 0,
      }));
    } catch (err) {
      console.error("Error fetching completed events:", err);
    } finally {
      setLoadingCompletedEvents(false);
    }
  };

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

  // Handle view
  const handleView = (type) => {
    setPopupMessage(`View details for: ${type}`);
  };

  const handleView1 = async (type) => {
    setPopupTitle(type);
    setShowPopup(true);

    const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
    let url = "";

    if (type === "Total Chats") {
      url = `https://cleezoclass.com:4000/api/api/chat-requests/all?schoolCode=${schoolCode}`;
    } else if (type === "Accepted Chats") {
      url = `https://cleezoclass.com:4000/api/api/chat-requests/approved?schoolCode=${schoolCode}`;
    } else if (type === "Pending Chat Requests") {
      url = `https://cleezoclass.com:4000/api/api/chat-requests/pending?schoolCode=${schoolCode}`;
    }

    try {
      const res = await axios.get(url);
      setPopupData(res.data);
    } catch (err) {
      console.error("Error loading chat list:", err);
    }
  };

  // Handle approve/reject
const handleApprove = async (id) => {
  try {
    const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

    await axios.put(
      `https://cleezoclass.com:4000/api/chat-requests/approve/${id}?schoolCode=${schoolCode}`
    );

setPopupMessage("Request approved!");

    const res = await axios.get(
      `https://cleezoclass.com:4000/api/chat-requests/pending?schoolCode=${schoolCode}`
    );

    setPopupData(res.data);
  } catch (err) {
    console.error("Approve error:", err);
    setPopupMessage("Failed to approve request.");
  }
};


const handleReject = async (id) => {
  try {
    const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

    await axios.put(
      `https://cleezoclass.com:4000/api/chat-requests/reject/${id}?schoolCode=${schoolCode}`
    );

    setPopupMessage("Request rejected!");

    const res = await axios.get(
      `https://cleezoclass.com:4000/api/chat-requests/pending?schoolCode=${schoolCode}`
    );

    setPopupData(res.data);
  } catch (err) {
    console.error("Reject error:", err);
    setPopupMessage("Failed to reject request.");
  }
};


  // Styles for popup actions
  const popupActionContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
    borderTop: "1px solid #ecf0f1",
    paddingTop: "15px",
  };

  const actionBtnStyle = {
  padding: 0,
  lineHeight: 1,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#333",
  fontSize: "16px"
};

  const iconStyle = {
    fontSize: "30px",
    color: "#4e4848ff",
    background: "transparent",
    borderRadius: "50%",
    border: "1px solid #0f0c0cff",
    padding: "5px",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    width: "30px",
    height: "30px",
  };

  const btnStyle = {
    padding: "4px 8px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    background: "transparent",
    color: "#ccc",
    fontSize: "11px",
    marginTop: "5px",
    width: "auto",
  };

  const smallBtnStyle = {
    padding: "6px 10px",
    borderRadius: "8px",
    background: "transparent",
    color: "#ccc",
    border: "1px solid #ccc",
    cursor: "pointer",
    fontSize: "12px",
    margin: 0,
    width: "150px",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
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
    height: "180px",
    margin: "0 2px",
  };

  // useEffect
  useEffect(() => {
    fetchIrregulars();
    fetchChatSummary();
    fetchTotalEvents();
    fetchUpcomingEvents();
    fetchPendingEventsCount();
    fetchAdmissions();
    fetchAllTeachers();
    fetchCompletedEvents();
  }, [filter, schoolCode]);
const isAnyPopupOpen =
  showAdmissionsPopup ||
  showFestivalPopup ||
  showPopup ||showUpcomingEventsPopup||
  showCompletedEventsPopup;


  return (
    <>
<div
        style={{
          ...outerContainer,
          // This applies the blur to the entire dashboard when any popup is open
          filter: isAnyPopupOpen || showAttendancePopup ? "blur(8px)" : "none",
          transition: "filter 0.3s ease",
          pointerEvents: (isAnyPopupOpen || showAttendancePopup) ? "none" : "auto",
        }}
      >        <h2 className="footprints">Events and Meetings</h2>
      <div style={innerContainer}>
        {/* Left Column */}
        <div style={leftColumn}>
          <div style={cardLarge}>
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
            <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
              {/* Live Chat – Total */}
              <div style={boxStyle}>
                <div
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
                  <h4 style={{ margin: "5px 0 0 0", fontSize: "16px" }}>Live Chat – Total</h4>
                </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>
                  {chatSummary.total_chats}
                </p>
               <button
                  data-guide="meetings-btn-livechat-total-status"
                  className="btn-outline"
                  onClick={() => handleView1("Total Chats")}
                >
                  View Status
                </button>
              </div>
              {/* Live Chat - Accepted */}
              <div style={boxStyle}>
                <div
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faUserCheck} style={iconStyle} />
                  <h4 style={{ margin: "5px 0 0 0", fontSize: "16px", marginLeft: "20px" }}>
                    Live Chat – Accepted
                  </h4>
                </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>
                  {chatSummary.chats_accepted}
                </p>
                <button
                  data-guide="meetings-btn-livechat-accepted-report"
                  className="btn-outline"
                  onClick={() => handleView1("Accepted Chats")}
                >
                  View Report
                </button>
              </div>
              {/* Live Chat – Requests (Pending Approval) */}
              <div style={boxStyle}>
                <div
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faTrophy} style={iconStyle} />
                  <h4 style={{ margin: "5px 0 0 0", fontSize: "16px", marginLeft: "20px" }}>
                    Live Chat – Requests
                  </h4>
                </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>
                  {chatSummary.chats_pending_approval}
                </p>
                <button
                  data-guide="meetings-btn-livechat-requests-approval"
                  className="btn-outline"
                  onClick={() => handleView1("Pending Chat Requests")}
                >
                  Needs Approval
                </button>
              </div>
            </div>
            <div
              style={{
                marginTop: "10px",
                borderTop: "1px solid #ccc",
                paddingTop: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <h2
                style={{
                  textAlign: "left",
                  fontSize: "12px",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  lineHeight: "16px",
                }}
              >
                {chatSummary.chats_pending_approval} pending Live Chat discussions
              </h2>
              <h2
                style={{
                  textAlign: "left",
                  fontSize: "12px",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  lineHeight: "16px",
                }}
              >
                {chatSummary.chats_accepted} Live Chat accepted session
              </h2>
            </div>
          </div>
          {/* Events Section */}
          <div style={cardLarge}>
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
                onChange={(e) => setSelectedMonthForDeductions(e.target.value)}
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
              {/* Upcoming Events */}
              <div style={{ ...boxStyle, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faUserClock} style={iconStyle} />
                  <h4 style={{ margin: "5px 0 0 0", fontSize: "16px", marginLeft: "20px" }}>
                    Upcoming Events
                  </h4>
                </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "5px 0" }}>
                  {filteredUpcomingEvents.length}
                </p>
                <button
                  data-guide="meetings-btn-upcoming-events-approval"
                  className="btn-outline"
                  onClick={() => setShowUpcomingEventsPopup(true)}
                >
                  Needs Approval
                </button>
              </div>
              {/* Events Conducted */}
              <div style={{ ...boxStyle, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faUserTimes} style={iconStyle} />
                  <h4 style={{ margin: "5px 0 0 0", fontSize: "16px", marginLeft: "20px" }}>
                    Events Completed
                  </h4>
                </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "5px 0" }}>
                  {filteredCompletedEvents.length}
                </p>
                <button
                  data-guide="meetings-btn-events-completed-status"
                  className="btn-outline"
                  onClick={() => setShowCompletedEventsPopup(true)}
                >
                  View Status
                </button>
              </div>
              {/* Photo Sharing */}
              <div style={{ ...boxStyle, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faMoneyCheckAlt} style={iconStyle} />
                  <h4 style={{ margin: "5px 0 0 0", fontSize: "16px", marginLeft: "20px" }}>
                    Photo Sharing
                  </h4>
                </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "5px 0" }}>0</p>
                <button
                  data-guide="meetings-btn-photo-sharing-approval"
                  className="btn-outline"
                  onClick={() => handleView("Photo Sharing")}
                >
                  Needs Approval
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div style={rightColumn}>
          {/* Live Chat Card */}
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Live Chat</h3>
            <h3 style={{ fontSize: "30px", fontWeight: "400px", margin: "0 0 5px 0" }}>
              Total: {chatSummary.total_chats}
            </h3>
            <h3 style={{ fontSize: "14px", margin: "0 0 5px 0", color: "#e74c3c" }}>
              Actions Needed: {chatSummary.chats_pending_approval}
            </h3>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
              <button
                data-guide="meetings-btn-livechat-actions"
                className="btn-outline"
                onClick={() => handleView1("Total Chats")}
              >
                View Actions
              </button>
            </div>
          </div>
          {/* Festive Greetings */}
          <div style={card}>
<h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Festival Greetings</h3>
<h3 style={{ fontSize: "30px", fontWeight: 400, margin: "0 0 5px 0" }}>
  {filteredUpcomingEvents.length + filteredCompletedEvents.length}
</h3>


            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
          <button
            data-guide="meetings-btn-festival-greetings-list"
            className="btn-outline"
            onClick={() => setShowFestivalPopup(true)}
          >
  View List
</button>

            </div>
          </div>
          {/* Upcoming Events Card */}
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Upcoming Events</h3>
            <p style={{ fontSize: "30px", fontWeight: "400px", margin: "5px 0" }}>
              {filteredUpcomingEvents.length}
            </p>
            <button
              data-guide="meetings-btn-upcoming-events-card-approval"
              className="btn-outline"
              onClick={() => setShowUpcomingEventsPopup(true)}
            >
              Needs Approval
            </button>
          </div>
        </div>
      </div></div>
{showFestivalPopup && createPortal(
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backdropFilter: "blur(5px)",
      WebkitBackdropFilter: "blur(5px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "10px",
      zIndex: 2000,
    }}
    onClick={() => setShowFestivalPopup(false)}
  >
 <div
  style={{
    width: "90vw",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "8px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    animation: "fadeIn 0.3s ease-in-out",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(0,0,0,0) transparent",
    position: "relative"
  }}
      onClick={(e) => e.stopPropagation()}
    >

      <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: "10px"
  }}
>
  <div />

  <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
    Festive Greetings
</h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-28px)"
    }}
    className="no-print"
  >
    <button
      style={actionBtnStyle}
      onClick={() =>
        handlePrint("Festive Greetings", {
          current: document.getElementById("festival-popup-content"),
        })
      }
    >
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button
      style={actionBtnStyle}
      onClick={() =>
        handleDownload(
          [...filteredUpcomingEvents, ...filteredCompletedEvents],
          "Festive_Greetings"
        )
      }
    >
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button
      style={actionBtnStyle}
      onClick={() => setShowFestivalPopup(false)}
    >
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>

      <div
  id="festival-popup-content"
  style={{
    flex: 1,
    overflowY: "auto",
    paddingRight: "10px"
  }}
>
        {/* UPCOMING EVENTS */}
        <h3
  style={{
    marginTop: "15px",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
    lineHeight: "1.2"
  }}
>
  Upcoming Events ({filteredUpcomingEvents.length})
</h3>

        {filteredUpcomingEvents.length === 0 ? (
          <p>No upcoming events.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#0A4D82", color: "#fff" }}>
                <th style={thStyle}>Event ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
                        <tbody>
  {paginatedUpcomingEvents.map((event) => (
    <tr key={`up-${event.id}`}>
      <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{event.id}</td>
      <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{event.festival_name}</td>
      <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{formatDate(event.festival_date)}</td>
    </tr>
  ))}
</tbody>

          </table>
        )}

               {filteredUpcomingEvents.length > 0 && (

                  <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginTop: "10px",
    fontSize: "12px",
    fontWeight: "bold",
    lineHeight: "1",
    flexWrap: "nowrap",
  }}
>
  <button
    className="actionBtnStyle"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      verticalAlign: "middle",
      lineHeight: "1",
      height: "26px",
      minWidth: "26px",
      padding: "0 8px",
      margin: 0,
    }}
    disabled={safeFestivalUpcomingPage === 1}
    onClick={() => setFestivalUpcomingPage((p) => Math.max(p - 1, 1))}
  >
    &lt;
  </button>

  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      verticalAlign: "middle",
      lineHeight: "1",
      margin: 0,
    }}
  >
    Page {safeFestivalUpcomingPage} / {festivalUpcomingTotalPages}
  </span>

  <button
    className="actionBtnStyle"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      verticalAlign: "middle",
      lineHeight: "1",
      height: "26px",
      minWidth: "26px",
      padding: "0 8px",
      margin: 0,
    }}
    disabled={safeFestivalUpcomingPage === festivalUpcomingTotalPages}
    onClick={() =>
      setFestivalUpcomingPage((p) => Math.min(p + 1, festivalUpcomingTotalPages))
    }
  >
    &gt;
  </button>
</div>

        )}


        {/* COMPLETED EVENTS */}
        <h3
  style={{
    marginTop: "25px",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
    lineHeight: "1.2"
  }}
>
  Completed Events ({filteredCompletedEvents.length})
</h3>

        {filteredCompletedEvents.length === 0 ? (
          <p>No completed events.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#0A4D82", color: "#fff" }}>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Event ID</th>
                 <th style={{ ...thStyle, border: "1px solid #ccc" }}>Name</th>
                 <th style={{ ...thStyle, border: "1px solid #ccc" }}>Date</th>
              </tr>
            </thead>
                        <tbody>
  {paginatedCompletedEvents.map((event) => (
    <tr key={`com-${event.id}`}>
      <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{event.id}</td>
      <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{event.festival_name}</td>
      <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{formatDate(event.festival_date)}</td>
    </tr>
  ))}
</tbody>

          </table>
        )}

                {filteredCompletedEvents.length > 0 && (

                    <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              marginTop: "10px",
              fontSize: "12px",
              fontWeight: "bold",
              lineHeight: "1",
              flexWrap: "nowrap",
            }}
          >
            <button
              className="actionBtnStyle"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                verticalAlign: "middle",
                lineHeight: "1",
                height: "26px",
                minWidth: "26px",
                padding: "0 8px",
                margin: 0,
              }}
              disabled={safeFestivalCompletedPage === 1}
              onClick={() => setFestivalCompletedPage((p) => Math.max(p - 1, 1))}
            >
              &lt;
            </button>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                verticalAlign: "middle",
                lineHeight: "1",
                margin: 0,
              }}
            >
              Page {safeFestivalCompletedPage} / {festivalCompletedTotalPages}
            </span>

            <button
              className="actionBtnStyle"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                verticalAlign: "middle",
                lineHeight: "1",
                height: "26px",
                minWidth: "26px",
                padding: "0 8px",
                margin: 0,
              }}
              disabled={safeFestivalCompletedPage === festivalCompletedTotalPages}
              onClick={() =>
                setFestivalCompletedPage((p) => Math.min(p + 1, festivalCompletedTotalPages))
              }
            >
              &gt;
            </button>
          </div>

        )}

            </div>
    </div>
  </div>,
  document.body
)}


            {/* Generic Popup */}
      {showPopup && (
        <div
         style={{
  position: "fixed",
  inset: 0,
  backdropFilter: "blur(5px)",
  WebkitBackdropFilter: "blur(5px)",
  zIndex: 2000,
}}


          onClick={() => setShowPopup(false)}
        >
          <div
            style={{
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90vw",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  borderRadius: "8px",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  animation: "fadeIn 0.3s ease-in-out",
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0,0,0,0) transparent",
}}


            onClick={(e) => e.stopPropagation()}
                    >

                <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: "10px",
  }}
>
  <div />

 <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  {popupTitle}
</h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-30px)"
    }}
    className="no-print"
  >
    <button onClick={() => handleEdit("Leave Requests")} className="actionBtnStyle">
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button onClick={() => handlePrint(popupTitle, genericPopupContentRef)} className="actionBtnStyle">
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button onClick={() => handleDownload(popupData, popupTitle.replace(/\s/g, "_"))} className="actionBtnStyle">
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button onClick={() => setShowPopup(false)} className="actionBtnStyle">
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>               
               


            <div ref={genericPopupContentRef}>

            {popupData.length === 0 ? (
  <p style={{ textAlign: "center" }}>No records found.</p>
) : (
  <>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#0A4D82", color: "#fff" }}>
          <th style={thStyle}>ID</th>
          <th style={thStyle}>Class</th>
          <th style={thStyle}>Section</th>
          <th style={thStyle}>Student</th>
          <th style={thStyle}>Status</th>
          <th style={thStyle}>Date</th>
          {popupTitle === "Pending Chat Requests" && (
            <th style={thStyle}>Actions</th>
          )}
        </tr>
      </thead>
      <tbody>
        {paginatedData.map((row, idx) => (
          <tr
            key={row.id}
            style={{ background: idx % 2 === 0 ? "#fafafa" : "#f1f6fa" }}
          >

            <td style={tdStyle}>{row.id}</td>
            <td style={tdStyle}>{row.party2_class}</td>
            <td style={tdStyle}>{row.party2_section}</td>
            <td style={tdStyle}>{row.party2_student || "Group"}</td>
            <td style={tdStyle}>{row.status}</td>
            <td style={tdStyle}>{row.created_at?.split("T")[0]}</td>
            {popupTitle === "Pending Chat Requests" && (
              <td
                style={{
                  ...tdStyle,
                  display: "flex",
                  gap: "6px",
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => handleApprove(row.id)}
                  style={{ ...actionBtnStyle, background: "#27ae60" }}
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(row.id)}
                  style={{ ...actionBtnStyle, background: "#e74c3c" }}
                >
                  Reject
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>

    {totalPages > 1 && (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          marginTop: "10px",
          fontSize: "12px",
          fontWeight: "bold",
          lineHeight: "1",
          flexWrap: "nowrap",
        }}
      >
        <button
          className="actionBtnStyle"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            verticalAlign: "middle",
            lineHeight: "1",
            height: "26px",
            minWidth: "26px",
            padding: "0 8px",
            margin: 0,
          }}
          disabled={safePage === 1}
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          &lt;
        </button>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            verticalAlign: "middle",
            lineHeight: "1",
            margin: 0,
          }}
        >
          Page {safePage} / {totalPages}
        </span>

        <button
          className="actionBtnStyle"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            verticalAlign: "middle",
            lineHeight: "1",
            height: "26px",
            minWidth: "26px",
            padding: "0 8px",
            margin: 0,
          }}
          disabled={safePage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        >
          &gt;
        </button>
      </div>
    )}
  </>
)}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events Popup */}
            {showUpcomingEventsPopup && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px",
            zIndex: 2000,
          }}
          onClick={() => setShowUpcomingEventsPopup(false)}
        >
          <div
            style={{
              width: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "8px",
              padding: "15px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              animation: "fadeIn 0.3s ease-in-out",
              scrollbarWidth: "thin", // for Firefox
              scrollbarColor: "rgba(0,0,0,0) transparent", // for Firefox
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: "10px"
  }}
>
  <div />

  <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  Pending Events for Approval ({filteredUpcomingEvents.length})
</h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-24px)"
    }}
    className="no-print"
  >
    <button style={actionBtnStyle} onClick={() => handleEdit("Upcoming Events")}>
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button
      style={actionBtnStyle}
      onClick={() =>
        handlePrint("Pending Events for Approval", upcomingEventsContentRef)
      }
    >
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button
      style={actionBtnStyle}
      onClick={() => handleDownload(upcomingEvents, "Pending_Events")}
    >
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button style={actionBtnStyle} onClick={() => setShowUpcomingEventsPopup(false)}>
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>
            <div ref={upcomingEventsContentRef}>
              {loadingEvents ? (
                <p style={{ textAlign: "center", fontSize: "14px" }}>Loading event details...</p>
              ) : filteredUpcomingEvents.length === 0 ? (
                <p style={{ textAlign: "center", fontSize: "14px" }}>No pending events found.</p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "12px",
                    border: "2px solid #ccc",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#0A4D82", color: "#fff" }}>
                      <th style={{ ...thStyle, border: "1px solid #ccc" }}>Event ID</th>
                      <th style={{ ...thStyle, border: "1px solid #ccc" }}>Name</th>
                      <th style={{ ...thStyle, border: "1px solid #ccc" }}>Date</th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUpcomingEvents.map((event, index) => (
  <tr
    key={event.id}
    style={{ background: index % 2 === 0 ? "#fafafa" : "#f1f6fa" }}
  >
                        <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{event.id}</td>
                        <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{event.festival_name}</td>
                        <td style={{ ...tdStyle, border: "1px solid #ccc" }}>
                          {formatDate(event.festival_date)}
                        </td>
                      
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
                    </div>
        </div>,
        document.body
      )}


      {/* Completed Events Popup */}
            {showCompletedEventsPopup && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px",
            zIndex: 2000,
          }}
          onClick={() => setShowCompletedEventsPopup(false)}
        >
          <div
            style={{
              width: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "8px",
              padding: "15px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              animation: "fadeIn 0.3s ease-in-out",
              scrollbarWidth: "thin", // for Firefox
              scrollbarColor: "rgba(0,0,0,0) transparent", // for Firefox
            }}
            onClick={(e) => e.stopPropagation()}
          >

            <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: "10px"
  }}
>
  <div />

  <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  Completed Events ({completedEvents.length})
</h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-25px)"
    }}
    className="no-print"
  >
    <button style={actionBtnStyle} onClick={() => handleEdit("Completed Events")}>
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button
      style={actionBtnStyle}
      onClick={() => handlePrint("Completed Events", completedEventsContentRef)}
    >
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button
      style={actionBtnStyle}
      onClick={() => handleDownload(completedEvents, "Completed_Events")}
    >
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button style={actionBtnStyle} onClick={() => setShowCompletedEventsPopup(false)}>
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>
            <div ref={completedEventsContentRef}>
              {loadingCompletedEvents ? (
                <p style={{ textAlign: "center", fontSize: "14px" }}>Loading event details...</p>
              ) : completedEvents.length === 0 ? (
                <p style={{ textAlign: "center", fontSize: "14px" }}>No completed events found.</p>
              ) : (
                <table
                
  style={{
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  }}
>
                  <thead>
                    <tr style={{ background: "#0A4D82", color: "#fff" }}>
                      <th style={{ ...thStyle, border: "1px solid #ccc" }}>Event ID</th>
                      <th style={{ ...thStyle, border: "1px solid #ccc" }}>Name</th>
                      <th style={{ ...thStyle, border: "1px solid #ccc" }}>Date</th>
                    
                    </tr>
                  </thead>
                  <tbody>
                    {completedEvents.map((event, index) => (
                      <tr key={event.id} style={{ background: "#fafafa" }}>
                        <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{event.id}</td>
                        <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{event.festival_name}</td>
                        <td style={{ ...tdStyle, border: "1px solid #ccc" }}>
                          {formatDate(event.festival_date)}
                        </td>
                    
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
                   </div>
        </div>,
        document.body
      )}

       
      <ErrorPopup
        message={popupMessage} 
        onClose={() => setPopupMessage("")} 
      />
   </>
  );
}
