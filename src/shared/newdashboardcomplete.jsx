import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
// Assuming you have these components imported for the HR popup
import Recruiters from "./Recruiters";
import EventAndMeetings from "./EventsMettings";
import EnrollmentBiometrics from "./EnrollmentChief";
import AttendancePayroll from "./AttendnceChief";
import RecruitmentChief from "./RecruitmentsAndEvents";
import EventsMeetingsChief from "./EventsMeetingChief";

// === NEW/ASSUMED IMPORTS FOR OPERATIONS & COMMERCE ===
import ExammanagementChief from "./ExamMAnagement.jsx";
import TimetableChief from "./TimetableChief.jsx";
// 🟢 NEW ASSUMED IMPORTS FOR COMMERCE POPUP
import IncomeChief from "./IncomeChief.jsx";
import ExpenseChief from "./ExpenseChief.jsx";
// ==========================================


const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState("2025-2026"); // Unused, keeping for completeness
  const [timeFilter, setTimeFilter] = useState("thisWeek");
  const [allFees, setAllFees] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [finalPaid, setFinalPaid] = useState(0); // Unused in render, keeping for completeness
  const [finalPending, setFinalPending] = useState(0); // Unused in render, keeping for completeness
  const [popupComponent, setPopupComponent] = useState(null);
  
  // 🧩 HR Component Map (Original)
  const hrComponentMap = {
    "/Biometric": <EnrollmentBiometrics />,
    "/BiometricTeacher": <AttendancePayroll />,
    "/teacher/new-enrollment": <RecruitmentChief />,
    "/EventAndMeetings": <EventsMeetingsChief />,
  };
  
  // 🧩 OPERATIONS Component Map (New/Modified)
  const operationsComponentMap = {
    "/ExammanagementChief": <ExammanagementChief />,
    "/EventsMeetingDashboard": <EventsMeetingsChief />,
    "/TimetableChief": <TimetableChief />,
  };
  
  // 🧩 COMMERCE Component Map (NEW)
  const commerceComponentMap = {
    "/AccountantDashboard/Income": <IncomeChief />, // Using a unique key for income 
    "/AccountantDashboard/Expense": <ExpenseChief />, // Using a unique key for expense
  };

  const [showOperationsPopup, setShowOperationsPopup] = useState(false);

    const [totalPaid, setTotalPaid] = useState(0); // Unused in render, keeping for completeness
  const [totalBalance, setBalance] = useState(0); // Unused in render, keeping for completeness
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  // New state for responsiveness
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";
  const [totals, setTotals] = useState({
    totalPaid: 0,
    totalBalance: 0,
    totalPrice: 0,
    loading: true,
    error: null
  });
  // Effect to handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
useEffect(() => {
  axios.get('https://cleezoclass.com:4000/api/approved')
    .then(res => setApprovedChats(res.data))
    .catch(err => console.error(err));
}, []);

  // Responsive Styles (omitted for brevity, assume unchanged)
  const outerContainer = {
    display: "flex",
    flexDirection: "column",
    gap: isMobile ? "20px" : "50px",
    minHeight: "100vh",
    width: "100%",
    padding: isMobile ? "10px" : "20px",
    boxSizing: "border-box",
    backgroundColor: "#6b7983ff", 
  };

  const container = {
    fontFamily: font,
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: isMobile ? "10px 5px" : "5px",
    boxSizing: "border-box",
    width: "100%",
    minWidth: "300px", // Prevent content from getting too small
  };

  const header = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: "16px 16px 0 0",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
    padding: isMobile ? "15px" : "25px",
    marginBottom: isMobile ? "15px" : "25px",
    flexWrap: isMobile ? "wrap" : "nowrap", // Wrap on mobile
    gap: isMobile ? "10px" : "0",
  };

  const logoBox = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    order: isMobile ? 1 : 0, // Keep logo first on mobile
  };
  const logo = {
    width: "40px",
    height: "40px",
    backgroundColor: "#001F3F",
    borderRadius: "8px",
  };
  const logoText = { fontSize: isMobile ? "16px" : "18px", fontWeight: "600" };
  const logoSub = { fontSize: isMobile ? "10px" : "12px", color: "#777" };
  const schoolTitle = {
    fontSize: isMobile ? "16px" : "20px",
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    flex: isMobile ? "1 1 100%" : 1, // Full width on mobile
    order: isMobile ? 3 : 0, // Move to a new line on mobile
    marginTop: isMobile ? "10px" : "0",
  };
  const buttonGroup = {
    display: "flex",
    gap: "10px",
    order: isMobile ? 2 : 0, // Keep buttons visible on mobile
  };
  const btn = {
    backgroundColor: "#6b7983ff",
    border: "none",
    borderRadius: "16px",
    padding: isMobile ? "6px 10px" : "8px 16px",
    cursor: "pointer",
    fontSize: isMobile ? "12px" : "14px",
    fontWeight: "500",
    fontFamily: font,
    color: "#fff", // Added white color for better visibility
  };

  const grid = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row", // Stack on mobile
    padding: "10px",
    gap: isMobile ? "20px" : "20px",
  };

  const card = {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    padding: "20px",
    cursor: "pointer",
  height: "350px",
    display: "flex",
    flexDirection: "column",
borderLeft:'8px solid #945f4aff',
  justifyContent: "center", // vertical alignment


  };

  const sectionTitle = {
    fontSize: isMobile ? "18px" : "20px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "10px",
    textAlign: isMobile ? "left" : "center",
    padding: isMobile ? "0 10px" : "0", // Padding for mobile titles
  };

  const listItem = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: isMobile ? "10px" : "15px",
    fontSize: isMobile ? "16px" : "22px",
    flexWrap: isMobile ? "wrap" : "nowrap", // Allow wrapping for list items
  };

  const circle = (color) => ({
    width: isMobile ? "30px" : "50px",
    height: isMobile ? "30px" : "50px",
    minWidth: isMobile ? "30px" : "50px",
    borderRadius: "50%",
    backgroundColor: color,
    marginRight: "10px",
  });

  const progress = (c1, c2) => ({
    display: "flex",
    width: isMobile ? "60px" : "90px",
    height: "20px",
    borderRadius: "4px",
    overflow: "hidden",
    background: `linear-gradient(to right, ${c1} 60%, ${c2} 40%)`,
    marginLeft: isMobile ? "0" : "auto", // No auto margin on mobile if wrapping
    marginTop: isMobile ? "10px" : "0", // Push down on new line if wrapped
  });

  const smallText = { fontSize: isMobile ? "12px" : "15px", color: "#666", textAlign: "left" };
  const itemContent = {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "column",
    textAlign: "left",
    flex: 1, // Allow content to take available space
  };

  // Data for cards 
  // 🔄 MODIFIED: Added unique links and isPopup: true for Commerce
const commerceItems = [
  {
    color: "#9CC3F8",
    title: "Income",
    desc: [
      `Fees Paid Report - ₹${finalPaid}`,
      `Fees Unpaid Report - ₹${finalPending}`,
      `Income Ledger - ₹${finalPaid + finalPending}`,
    ],
    link: "/AccountantDashboard/Income", // 🔄 MODIFIED: Unique link for map
    isPopup: true, // 🟢 NEW
  },
   {
    color: "#CFA7A7",
    title: "Expense",
    desc: [
       `
        Expenses Report - ₹${totals.totalPaid}`,   // use totals from state
    `Pending Expenses - ₹${totals.totalBalance}`,
    `Expense Ledger`,
    ],
    link: "/AccountantDashboard/Expense", // 🔄 MODIFIED: Unique link for map
    isPopup: true, // 🟢 NEW
  },
  
];

  // 🔄 MODIFIED: Added isPopup property for items that should use the modal
  const operationsItems = [
    {
      color: "#D4C7B0",
      title: "Academics",
      desc: "Syllabus, performance, Attendance, Behaviour, Certificates",
      link: "/operations/academics",
      isPopup: false,
    },
    {
      color: "#868C8F",
      title: "Meetings & Live Chat",
      desc: "Group Chat, Chatting assign, Parents Messaging",
      link: "/EventsMeetingDashboard", // This link will trigger a popup
      isPopup: true, // 👈 New Property
    },
    {
      color: "#705B56",
      title: "Time-Table",
      desc: "Generation, Substitutes",
      link: "/TimetableChief",
      isPopup: true,
    },
    {
      color: "#D9EEF8",
      title: "Exam Management",
      desc: "Question Paper, Evaluator, Invigilator",
      link: "/ExammanagementChief", // This link will trigger a popup
      isPopup: true, // 👈 New Property
    },
  ];

  const marketingItems = [
    {
      color: "#D4C7B0",
      title: "Marketing Staff",
      desc: "Staff list, Assign Staff, Hours Worked",
      link: "/marketing/academics",
    },
    {
      color: "#868C8F",
      title: "Total Visits",
      desc: "Locations, Route track, VoiceRecords",
      link: "/marketing/meetings",
    },
    {
      color: "#705B56",
      title: "Lead Conversions",
      desc: "Lead Type, Follow ups, Closings",
      link: "/marketing/timetable",
    },
    {
      color: "#D9EEF8",
      title: "Performance Report",
      desc: "Question Paper, Counsellor Assign, Report",
      link: "/marketing/exam",
    },
  ];

  const hrItems = [
    {
      color: "#D9EEF8",
      title: "Enrolments & Biometrics",
      desc: "Admission process & Students track",
      link: "/Biometric",
    },
    {
      color: "#868C8F",
      title: "Attendance & Payroll",
      desc: "Staff Track, Salary, Payroll",
      link: "/BiometricTeacher",
    },
    {
      color: "#B5ACBC",
      title: "Recruitments & Exits",
      desc: "Joining’s & Exit Formalities",
      link: "/teacher/new-enrollment",
    },
    {
      color: "#A39DBD",
      title: "Events & Meetings",
      desc: "Circulars, Complaints, Approvals",
      link: "/EventAndMeetings",
    },
  ];

  const filterOptions = [
    { label: "This Week", value: "thisWeek" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Month", value: "lastMonth" },
    { label: "This Year", value: "thisYear" },
    { label: "Half Year", value: "halfYear" },
    { label: "Financial Year", value: "financialYear" },
  ];

  // 🔄 MODIFIED: Updated renderCard to handle the new `isPopup` logic
  const renderCard = (title, items, homepageRoute, split = false) => {
    if (split) {
      // ... (Split card logic is for Marketing, remains mostly unchanged)
      return (
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row", // Stack split sections on mobile
            gap: "10px",
          }}
        >
          {/* Left Side: Existing Items */}
          <div
            style={{
              flex: isMobile ? "1 1 100%" : 1, // Full width on mobile
              borderRight: isMobile ? "none" : "2px solid black",
              borderBottom: isMobile ? "2px solid black" : "none", // Separator on bottom for mobile
              paddingRight: isMobile ? "0" : "10px",
              paddingBottom: isMobile ? "10px" : "0",
            }}
          >
            {items.map((i) => (
              <div key={i.title} style={listItem}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    flex: 1, // Allow content to shrink
                  }}
                >
                  <div style={circle(i.color)}></div>
                  <div style={itemContent}>
                    <div
                      style={{ fontWeight: "500", cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 🔄 Marketing card uses standard navigation
                        navigate(i.link);
                      }}
                    >
                      {i.title}
                    </div>
                    <div style={smallText}>
                      {Array.isArray(i.desc) ? (
                        i.desc.map((d, idx) => <div key={idx}>{d}</div>)
                      ) : (
                        i.desc
                      )}
                    </div>
                  </div>
                </div>
                {/* Progress bar wraps on mobile if content is too long */}
                <div style={progress("#B97FA5", "#92D09B")}></div>
              </div>
            ))}
          </div>
          {/* Right Side: Tool Statistics (omitted for brevity, assume unchanged) */}
        <div
  style={{
    flex: isMobile ? "1 1 100%" : 1,
    paddingLeft: isMobile ? "0" : "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center", // ✅ Center horizontally
    justifyContent: "center", // ✅ Center vertically
    textAlign: "center",
    width: "100%",
  }}
>
  {/* Top Section (Button, Arrow, Text) */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center", // ✅ Center horizontally
      marginBottom: "20px",
      gap: "10px",
      flexWrap: isMobile ? "wrap" : "nowrap",
      width: "100%",
    }}
  >
    <button
      style={{
        backgroundColor: "#72a5fdff",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "8px 12px",
        cursor: "pointer",
        fontSize: isMobile ? "12px" : "14px",
        flexShrink: 0,
      }}
    >
      Admission Tool
    </button>

    <svg
      width={isMobile ? "20" : "40"}
      height="20"
      viewBox="0 0 40 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        flexShrink: 0,
        transform: isMobile ? "rotate(90deg)" : "none",
      }}
    >
      <line x1="10" y1="10" x2="40" y2="10" stroke="#007BFF" strokeWidth="2" />
      <polygon points="10,5 0,10 10,15" fill="#007BFF" />
    </svg>

    <div
      style={{
        fontSize: "12px",
        color: "#666",
        border: "2px solid #007BFF",
        padding: "8px 12px",
        borderRadius: "16px",
        backgroundColor: "#fff",
        maxWidth: isMobile ? "100%" : "180px",
        lineHeight: "1.4",
        flexGrow: 1,
      }}
    >
      Hit the button to start the Automated Admission tool
    </div>
  </div>

  {/* Middle Section (Icon, Title, Dropdown) */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center", // ✅ Center horizontally
      gap: "10px",
      marginBottom: "20px",
      flexWrap: "wrap",
      width: "100%",
    }}
  >
    <div
      style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        backgroundColor: "#868C8F",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "16px",
      }}
    ></div>

    <div style={{ fontSize: "16px", fontWeight: "600" }}>
      Tool Statistics
    </div>

    <select
      style={{
        padding: "5px 10px",
        borderRadius: "6px",
        border: "1px solid #ccc",
        width: isMobile ? "100%" : "auto",
      }}
    >
      <option>Last Week</option>
      <option>This Week</option>
      <option>This Month</option>
    </select>
  </div>

  {/* Statistics Section */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center", // ✅ Center horizontally
      justifyContent: "center", // ✅ Center vertically
      gap: "6px",
      fontSize: "14px",
      width: "100%",
    }}
  >
    {["Target Audience", "Exposed Audience", "Applied Impressions", "No. of Impressions"].map(
      (stat, index) => (
        <div
          key={stat}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: isMobile ? "90%" : "60%",
            padding: "6px 0",
          }}
        >
          <span>{stat}</span>
          <span>
            :{" "}
            {index % 2 === 0
              ? "20,000"
              : index === 1
              ? "8,000"
              : index === 2
              ? "32,000"
              : "8"}
            <span
              style={{
                color: index % 2 === 0 ? "green" : "red",
                marginLeft: "5px",
              }}
            >
              {index % 2 === 0 ? "↑" : "↓"}
            </span>
          </span>
        </div>
      )
    )}
  </div>
</div>

        </div>
      );
    } else {
      // Standard Card (Used for Operations and HR in the new design)
      return (
        <div style={card} onClick={() => homepageRoute && navigate(homepageRoute)}>
          {items.map((i) => (
            <div key={i.title} style={listItem}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  flex: 1,
                }}
              >
                <div style={circle(i.color)}></div>
                <div style={itemContent}>
                  <div
                    style={{ fontWeight: "500", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();

                      // 🔄 Check if the item should open a popup (Used for Operations)
                      if (i.isPopup && operationsComponentMap[i.link]) {
                        setPopupComponent(operationsComponentMap[i.link]);
                      } else {
                        // Standard navigation for other items
                        navigate(i.link);
                      }
                    }}
                  >
                    {i.title}
                  </div>
                  <div style={smallText}>
                    {Array.isArray(i.desc) ? (
                      i.desc.map((d, idx) => <div key={idx}>{d}</div>)
                    ) : (
                      i.desc
                    )}
                  </div>
                </div>
              </div>
              <div style={progress("#B97FA5", "#92D09B")}></div>
            </div>
          ))}
        </div>
      );
    }
  };
  
// 🔄 MODIFIED: Renamed the component map to hrComponentMap to avoid conflict
const renderHRCard = (title, items) => {
  return (
    <div style={{ ...card, cursor: "pointer" }}>
      {items.map((i) => (
        <div key={i.title} style={listItem}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              flex: 1,
            }}
          >
            <div style={circle(i.color)}></div>

            <div style={itemContent}>
              <div
                style={{ fontWeight: "500", cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPopupComponent(hrComponentMap[i.link]); // HR uses its own map
                }}
              >
                {i.title}
              </div>

              <div style={smallText}>
                {Array.isArray(i.desc)
                  ? i.desc.map((d, idx) => <div key={idx}>{d}</div>)
                  : i.desc}
              </div>
            </div>
          </div>

          <div style={progress("#B97FA5", "#92D09B")}></div>
        </div>
      ))}
    </div>
  );
};


// Function to generate an array of dates between two Date objects (omitted for brevity, assume unchanged)
 const [showPending, setShowPending] = useState(false);
  const [pendingChats, setPendingChats] = useState([]);
  const [approvedChats, setApprovedChats] = useState([]);

  // 🟢 Fetch pending approvals (omitted for brevity, assume unchanged)
  const fetchPending = () => {
    console.log("📡 Fetching pending approval requests...");
    axios
      .get("https://cleezoclass.com:4000/api/pending")
      .then((res) => {
        console.log("✅ Pending response data:", res.data);
        if (Array.isArray(res.data)) {
          setPendingChats(res.data);
        } else {
          console.warn("⚠️ Unexpected data format:", res.data);
          setPendingChats([]);
        }
      })
      .catch((err) => console.error("❌ Error fetching pending:", err));
  };

  // 🟡 Handle Approve button (omitted for brevity, assume unchanged)
  const handleApprove = (id) => {
    console.log("🟢 Approving chat ID:", id);
    axios
      .post("https://cleezoclass.com:4000/api/approve", { id })
      .then(() => {
        alert(`Chat ID ${id} approved`);
        console.log("✅ Approval successful for ID:", id);
        setPendingChats((prev) => prev.filter((chat) => chat.id !== id));
      })
      .catch((err) => console.error("❌ Error approving chat:", err));
  };

  // 🟠 Optional: close dropdown on outside click (omitted for brevity, assume unchanged)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".bell-container")) setShowPending(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // 🧩 Optional: Fetch once when dashboard loads (for debugging) (omitted for brevity, assume unchanged)
  useEffect(() => {
    fetchPending();
  }, []);


// Function to generate an array of dates between two Date objects (same as before) (omitted for brevity, assume unchanged)
const getDatesBetween = (start, end) => {
    const dates = [];
    let currentDate = new Date(start.getTime());
    currentDate.setHours(0, 0, 0, 0); // Ensure consistency
    // Iterate up to and including the end date
    while (currentDate.getTime() <= end.getTime()) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};
// applyTimeFilter (omitted for brevity, assume unchanged)
const applyTimeFilter = () => {
    console.log("🟢 applyTimeFilter called with timeFilter:", timeFilter);
    if (!allFees.length) {
        console.warn("⚠️ No fee data available in allFees. Exiting.");
        return;
    }

    const now = new Date();
    console.log("⏳ Current date/time:", now);

    // 1. Group the fee data that exists
    const groupedData = allFees.reduce((acc, item) => {
        const date = new Date(item.created_at);
        let key = null;
        console.log("➡️ Processing item:", item);

        switch (timeFilter) {
            case "thisWeek":
            case "thisMonth":
            case "lastMonth":
            case "halfYear":
            case "financialYear":
            case "thisYear": {
                let filterStart, filterEnd;
                let isDateWithinFilter = true;

                if (timeFilter === "thisWeek") {
                    filterStart = new Date(now);
                    filterStart.setDate(now.getDate() - now.getDay());
                    filterStart.setHours(0, 0, 0, 0);
                    filterEnd = new Date(filterStart);
                    filterEnd.setDate(filterStart.getDate() + 6);
                    key = date.toLocaleDateString("en-US", { weekday: "short" });
                    isDateWithinFilter = (date >= filterStart && date <= filterEnd);
                    console.log(`🗓 thisWeek filterStart: ${filterStart}, filterEnd: ${filterEnd}, key: ${key}, withinFilter: ${isDateWithinFilter}`);
                } else if (timeFilter === "thisMonth" || timeFilter === "lastMonth") {
                    filterStart = timeFilter === "thisMonth"
                        ? new Date(now.getFullYear(), now.getMonth(), 1)
                        : new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    filterEnd = timeFilter === "thisMonth"
                        ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
                        : new Date(now.getFullYear(), now.getMonth(), 0);
                    key = `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })}`;
                    isDateWithinFilter = (date >= filterStart && date <= filterEnd);
                    console.log(`🗓 ${timeFilter} filterStart: ${filterStart}, filterEnd: ${filterEnd}, key: ${key}, withinFilter: ${isDateWithinFilter}`);
                } else if (timeFilter === "thisYear") {
                    filterStart = new Date(now.getFullYear(), 0, 1);
                    filterEnd = new Date(now.getFullYear(), 11, 31);
                    key = date.toLocaleString("en-US", { month: "short" });
                    isDateWithinFilter = (date >= filterStart && date <= filterEnd);
                    console.log(`🗓 thisYear filterStart: ${filterStart}, filterEnd: ${filterEnd}, key: ${key}, withinFilter: ${isDateWithinFilter}`);
                } else if (timeFilter === "halfYear") {
                    filterStart = new Date(now.getFullYear(), now.getMonth() - 5, 1); 
                    filterEnd = now;
                    key = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
                    isDateWithinFilter = (date >= filterStart && date <= filterEnd);
                    console.log(`🗓 halfYear filterStart: ${filterStart}, filterEnd: ${filterEnd}, key: ${key}, withinFilter: ${isDateWithinFilter}`);
                } else if (timeFilter === "financialYear") {
                    const fyStartMonth = 3; // April
                    const year = now.getMonth() >= fyStartMonth ? now.getFullYear() : now.getFullYear() - 1;
                    filterStart = new Date(year, fyStartMonth, 1);
                    filterEnd = new Date(year + 1, fyStartMonth, 0);
                    key = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
                    isDateWithinFilter = (date >= filterStart && date <= filterEnd);
                    console.log(`🗓 financialYear filterStart: ${filterStart}, filterEnd: ${filterEnd}, key: ${key}, withinFilter: ${isDateWithinFilter}`);
                }

                if (isDateWithinFilter) {
                    acc[key] = acc[key] || { Paid: 0, Pending: 0 };
                    acc[key].Paid += Number(item.Paid_Amount) || 0;
                    acc[key].Pending += (Number(item.CompleteFee) || 0) - (Number(item.Paid_Amount) || 0);
                    console.log(`✅ Added to groupedData[${key}]:`, acc[key]);
                } else {
                    console.log(`❌ Item outside filter, skipped:`, item);
                }
                break;
            }
            default:
                console.warn("⚠️ Unhandled timeFilter:", timeFilter);
                break;
        }
        return acc;
    }, {});

    console.log("📊 Grouped Data:", groupedData);

    // 2. Calculate total Paid and Pending across the selected filter
    const totals = Object.values(groupedData).reduce((acc, item) => {
        acc.Paid += item.Paid;
        acc.Pending += item.Pending;
        return acc;
    }, { Paid: 0, Pending: 0 });

    console.log("💰 Total Paid for selected filter:", totals.Paid);
    console.log("🕒 Total Pending for selected filter:", totals.Pending);

    // 3. Define ALL labels in correct chronological order
    let orderedLabels = [];
    let start, end;

    switch (timeFilter) {
        case "thisWeek":
            orderedLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            break;
        case "thisMonth":
        case "lastMonth":
            start = timeFilter === "thisMonth"
                ? new Date(now.getFullYear(), now.getMonth(), 1)
                : new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = timeFilter === "thisMonth"
                ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
                : new Date(now.getFullYear(), now.getMonth(), 0);
            const dates = getDatesBetween(start, end);
            orderedLabels = dates.map(d => `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`);
            break;
        case "thisYear":
            orderedLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            break;
        case "halfYear":
        case "financialYear":
            const fyStartMonth = timeFilter === "financialYear" ? 3 : now.getMonth() - 5;
            const numMonths = timeFilter === "financialYear" ? 12 : 6;
            let currentYear = now.getFullYear();
            if (timeFilter === "financialYear" && now.getMonth() < 3) currentYear = now.getFullYear() - 1;
            for (let i = 0; i < numMonths; i++) {
                const monthDate = new Date(currentYear, fyStartMonth + i, 1);
                orderedLabels.push(monthDate.toLocaleString("en-US", { month: "short", year: "2-digit" }));
            }
            break;
        default:
            orderedLabels = Object.keys(groupedData);
            break;
    }

    console.log("📌 Ordered Labels:", orderedLabels);

    // 4. Generate chartData from orderedLabels, filling missing data with 0
    const chartData = orderedLabels.map(label => {
        const data = {
            label,
            Paid: groupedData[label]?.Paid || 0,
            Pending: groupedData[label]?.Pending || 0,
        };
        console.log(`📈 Chart data point for "${label}":`, data);
        return data;
    });

    console.log("✅ Final chartData:", chartData);

    // 5. Update states
    setChartData(chartData);
    setTotals(totals); // <-- total Paid and Pending
};


  // Fetch fee data (omitted for brevity, assume unchanged)
const fetchFeeData = async () => {
  const schoolCode = localStorage.getItem("schoolCode");
  console.log("🔍 fetchFeeData() called");
  console.log("📘 School Code:", schoolCode);

  try {
    setLoading(true);
    console.log("⏳ Fetching data from API...");

    const res = await axios.post(
      `https://cleezoclass.com:4000/api/feeDataFinanceNew?schoolCode=${schoolCode}`
    );

    console.log("✅ API Response Received:", res);
    console.log("📦 Response Data:", res.data);

    const fees = res.data.results || [];
    console.log("📊 Fees Data:", fees);
    setAllFees(fees);

    const totalPaid = fees.reduce((a, b) => {
      const paid = Number(b.Paid_Amount) || 0;
            // console.log(`💰 Adding Paid_Amount: ${paid} for record`, b);

      return a + paid;
    }, 0);

    const totalPending = fees.reduce((a, b) => {
      const complete = Number(b.CompleteFee) || 0;
      const paid = Number(b.Paid_Amount) || 0;
      const pending = complete - paid;
            // console.log(`🧾 Calculating Pending: ${complete} - ${paid} = ${pending} for record`, b);

      return a + pending;
    }, 0);

    console.log("✅ Total Paid income:", totalPaid);
    console.log("⚠️ Total Pending income :", totalPending);

    setFinalPaid(totalPaid);
    setFinalPending(totalPending);

    const chartData = [
      { label: "Start", Paid: 0, Pending: 0 },
      { label: "Paid", Paid: totalPaid, Pending: 0 },
      { label: "Pending", Paid: totalPaid, Pending: totalPending },
    ];

    console.log("📈 Chart Data:", chartData);
    setChartData(chartData);

  } catch (err) {
    console.error("❌ Error fetching fee data:", err);
  } finally {
    setLoading(false);
    console.log("✅ Loading state set to false");
  }
};




  // Fetch fee data on mount (omitted for brevity, assume unchanged)
  useEffect(() => {
    fetchFeeData();
  }, []);
        const [expensesData,setExpensesData]= useState()
      const [userExpensesData,setUserExpensesData]= useState()
  
  const [originalUserExpensesData, setOriginalUserExpensesData] = useState(null);
// handleSearch (omitted for brevity, assume unchanged)
const handleSearch = async () => {
  console.log("🟢 handleSearch called...");

  const schoolCode = localStorage.getItem("schoolCode");
  console.log("📘 Retrieved schoolCode:", schoolCode);

  if (!schoolCode) {
    console.error("❌ School code not found in localStorage.");
    return;
  }

  try {
    console.log("🚀 Fetching both datasets in parallel...");

    const expensesPromise = axios.get(
      `https://cleezoclass.com:4000/api/totalexpensesData?schoolCode=${schoolCode}`
    );
    const billsPromise = fetch("https://cleezoclass.com:4000/getAllBills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolCode }),
    });

    const [expensesResponse, billsResponse] = await Promise.all([
      expensesPromise,
      billsPromise,
    ]);

    console.log("✅ Both API calls completed successfully.");

    // --- Process regular expenses ---
    const expensesData = expensesResponse.data || [];
    console.log(`📊 Expenses data fetched: ${expensesData.length} records`);

    // --- Process and transform uploaded bills ---
    let uploadedBillsData = [];
    if (billsResponse.ok) {
      const rawBills = await billsResponse.json();
      console.log(`📦 Raw bills fetched: ${rawBills.length} records`);

      uploadedBillsData = rawBills.map((bill, index) => ({
        id: bill.id || `bill_${index}_${Math.random()}`,
        expense_date: bill.date,
        expense_type: bill.bill_type || "Uploaded Bill",
        description: bill.description || "N/A",
        payment_mode: "N/A",
        price: Number(bill.amount) || 0,
        paid_amount: Number(bill.amount) || 0,
        balance_amount: 0,
        imageUrl: bill.imageUrl,
        isUploadedBill: true,
      }));

      console.log("🧾 Uploaded bills transformed successfully:", uploadedBillsData);
    } else {
      console.error("❌ Failed to fetch uploaded bills. Response status:", billsResponse.status);
    }

    // --- Merge both datasets ---
    const mergedData = [...expensesData, ...uploadedBillsData];
    console.log(`🔄 Merged dataset created with ${mergedData.length} total records.`);

    // --- Sort by date ---
    mergedData.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
    console.log("📅 Merged data sorted by expense_date (newest first).");

    // --- Set to state ---
    setUserExpensesData(mergedData);
    setOriginalUserExpensesData(mergedData);

    console.log("✅ Final merged data set to state successfully.");
    console.table(mergedData.slice(0, 5)); // preview first 5 records

  } catch (error) {
    console.error("🔥 Error in handleSearch:", error);
    setUserExpensesData([]);
    setOriginalUserExpensesData([]);
  }
};

 
     const [total, setTotal] = useState({
        total_investment: 0,
        total_other: 0,
        total_donation: 0,
        grand_total: 0
    });
const [isLedgerOpenForExpense, setIsLedgerOpenForExpense] = useState(false);
  const [showStudentFinder, setShowStudentFinder] = useState(false);
    const [income, setIncome] = useState({
        total_investment: 0,
        total_other: 0,
        total_donation: 0,
        grand_total: 0,
        loading: true,
        error: null
    });
// fetchTotals (omitted for brevity, assume unchanged)
const fetchTotals = async (schoolCode) => {
  if (!schoolCode) {
    console.warn("⚠️ fetchTotals called without a schoolCode. Aborting fetch.");
    return; // stop execution if schoolCode is undefined
  }

  console.log("🟢 fetchTotals called with schoolCode:", schoolCode);

  setTotals(prev => ({ ...prev, loading: true, error: null }));
  console.log("⏳ Loading set to true...");

  try {
    const response = await fetch(`https://cleezoclass.com:4000/api/totals?schoolCode=${schoolCode}`);
    console.log("🌐 Fetch request completed. Response status:", response.status);

    if (!response.ok) {
      throw new Error(`❌ Failed to fetch totals, status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 Data received from API:", data);

    const totalPaid = parseFloat(data.totals.paid) || 0;
    const totalBalance = parseFloat(data.totals.balance) || 0;
    const totalPrice = parseFloat(data.totals.price) || 0;

    console.log("🧮 Parsed totals:", { totalPaid, totalBalance, totalPrice });

    setTotals({
      totalPaid,
      totalBalance,
      totalPrice,
      loading: false,
      error: null
    });
    console.log("✅ Totals set to state successfully.");

  } catch (err) {
    console.error("🔥 Error in fetchTotals:", err);
    setTotals(prev => ({
      ...prev,
      loading: false,
      error: err.message
    }));
  }
};


// ✅ Automatically call fetchTotals when component mounts (omitted for brevity, assume unchanged)
useEffect(() => {
  console.log("🟢 useEffect triggered======================================");

  const schoolCode = localStorage.getItem("schoolCode");
  console.log("🔍 Raw schoolCode from localStorage=====================================================:", schoolCode);

  if (schoolCode) {
    console.log("✅ Valid schoolCode found, calling fetchTotals...");
    fetchTotals(schoolCode);
  } else {
    console.error("❌ No schoolCode found in localStorage");
    // Debug why it's missing
    console.log("ℹ️ localStorage contents:", { ...localStorage });
  }
}, []);


useEffect(() => {
  fetchTotals();
}, []); 
useEffect(() => {
  handleSearch();
}, []); // runs once when the component mounts

  // Apply time filter on change (omitted for brevity, assume unchanged)
  useEffect(() => {
    applyTimeFilter();
  }, [timeFilter, allFees]);

  return (
    <div style={outerContainer}>
      <div style={container}>
        {/* Header (omitted for brevity, assume unchanged) */}
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
        {/* Welcome Section (omitted for brevity, assume unchanged) */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: isMobile ? "18px" : "22px",
    fontWeight: "600",
    marginBottom: "15px",
    padding: isMobile ? "0 10px" : "0",
  }}
>
  {/* Left: Welcome message */}
  <div>
    {name ? `Welcome ${name}..!` : "Welcome Chief Department..!"}
  </div>

 <div style={buttonGroup}>
          {/* 🔔 Bell Icon */}
          <div
            className="bell-container"
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => {
              setShowPending((prev) => !prev);
              if (!showPending) fetchPending();
            }}
          >
            <FontAwesomeIcon icon={faBell} style={{ fontSize: "24px", color: "#555" }} />
            {pendingChats.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  width: "10px",
                  height: "10px",
                  backgroundColor: "red",
                  borderRadius: "50%",
                  border: "1px solid white",
                }}
              ></span>
            )}

            {/* Pending Requests Popup */}
            {showPending && (
              <div
                style={{
                  position: "absolute",
                  top: "35px",
                  right: "0",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  width: "320px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  zIndex: 1000,
                  padding: "10px",
                }}
              >
                <h4 style={{ textAlign: "center", marginBottom: "10px" }}>
                  Pending Approval Requests
                </h4>
                {console.log("🧾 Rendering pendingChats:", pendingChats)}
                {pendingChats.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#666" }}>
                    No pending requests
                  </p>
                ) : (
                  pendingChats.map((chat) => (
                    <div
                      key={chat.id}
                      style={{
                        borderBottom: "1px solid #eee",
                        padding: "10px 0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{chat.party1_name}</strong> →{" "}
                        {chat.party2_student || "Group"}
                        <div style={{ fontSize: "12px", color: "#777" }}>
                          {new Date(chat.date).toLocaleDateString()} | {chat.time}
                        </div>
                      </div>
                      <button
                        onClick={() => handleApprove(chat.id)}
                        style={{
                          padding: "6px 10px",
                          backgroundColor: "#5a7488",
                          color: "#fff",
                          border: "none",
                          borderRadius: "5px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Approve
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
</div></div></div>


        {/* Commerce and Operations Grid */}
        <div style={grid}>
          <div style={{ flex: isMobile ? "1 1 100%" : 6 }}>
            <div style={sectionTitle}>Commerce</div>
            <div style={{ ...card, borderLeft: "8px solid rgba(158, 165, 172, 1)", height: 'auto' }}>
              <div
                style={{
                  fontSize: "14px",
                  marginBottom: "10px",
                  textAlign: "left",
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span>Total Term Fees: {timeFilter || ""}</span>
                <div style={{ float: isMobile ? "none" : "right" }}>
                  <strong>Filter:</strong>{" "}
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                    }}
                  >
                    {filterOptions.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row", // Stack chart and list on mobile
                  flex: 1,
                  gap: "20px",
                  marginTop: "10px",
                }}
              >
                <div style={{ flex: isMobile ? "1 1 100%" : 7, height: isMobile ? "200px" : "300px" }}>
                  <ResponsiveContainer width="100%" height="90%">
  <LineChart data={chartData}>
    <XAxis dataKey="label" fontSize={isMobile ? 10 : 12} />
    <YAxis fontSize={isMobile ? 10 : 12} />
    <Tooltip />

    <Legend 
      layout="horizontal"        // or "vertical"
      verticalAlign="bottom"        // top, bottom, middle
      align="center"             // left, center, right
      wrapperStyle={{ 
        width: '100%',           // make legend full width
        fontSize: isMobile ? 10 : 12,
      }} 
    />

    <Line
      type="monotone"
      dataKey="Paid"
      stroke="#6CA6FF"
      strokeWidth={3}
    />
    <Line
      type="monotone"
      dataKey="Pending"
      stroke="#9C6262"
      strokeWidth={3}
    />
  </LineChart>
</ResponsiveContainer>

                  <div style={{ width: '100%', textAlign: 'center', marginTop: '0px' }}>
  <span style={{ color: '#333',  marginRight: '20px' }}>
{totals.Paid}
  </span>
  <span style={{ color: '#333' }}>
  {totals.Pending}
  </span>
</div>

                </div>
                <div
                  style={{
                    flex: isMobile ? "1 1 100%" : 3,
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    marginTop: isMobile ? "20px" : "0",
                  }}
                >
                  {commerceItems.map((i) => (
                    <div
                      key={i.title}
                      style={{ ...listItem, fontSize: isMobile ? "10px" : "12px" }} // Smaller font size on mobile
                      // 🗑️ Removed onClick={() => navigate(i.link)} from the outer div
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={circle(i.color)}></div>
                        <div style={itemContent}>
                          <div
                            style={{ fontWeight: "500", cursor: "pointer" }}
                            // 🟢 MODIFIED: Added logic for Commerce Popup
                            onClick={(e) => {
                              e.stopPropagation();
                              if (i.isPopup && commerceComponentMap[i.link]) {
                                setPopupComponent(commerceComponentMap[i.link]);
                              } else {
                                navigate(i.link);
                              }
                            }}
                          >
                            {i.title}
                          </div>
                          <div style={{ ...smallText, fontSize: isMobile ? "8px" : "10px",fontWeight:'bold' }}>
                            {i.desc.map((d, idx) => (
                              <div key={idx}>{d}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={progress("#B97FA5", "#9CC3F8")}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ flex: isMobile ? "1 1 100%" : 4 }}>
            <div style={sectionTitle}>Operations</div>
        {/* 🔄 Removed the redundant onClick={() => setShowOperationsPopup(true)} */}
        <div> 
          {/* Operations card will now handle its own item clicks */}
          {renderCard("Operations", operationsItems)}
        </div>

          </div>
        </div>
        {/* Marketing and HR Grid (omitted for brevity, assume unchanged) */}
        <div style={grid}>
          <div style={{ flex: isMobile ? "1 1 100%" : 6 }}>
            <div style={sectionTitle}>Marketing</div>
            <div style={{ ...card, borderLeft: "8px solid #738368ff", height: 'auto' }}>
              {renderCard("Marketing", marketingItems, "/marketing", true)}
            </div>
          </div>
          <div style={{ flex: isMobile ? "1 1 100%" : 4 }}>
            <div style={sectionTitle}>HR</div>
            <div>
              {renderHRCard("HR", hrItems, "/RecruitmentDashboard")}
            </div>
          </div>
        </div>
{popupComponent && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
      overflowY: "auto",
      padding: "20px",
    }}
  >
    <div
      style={{
        background: "#fff",
        width: "90%",
        maxWidth: "1000px",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",
        position: "relative", // IMPORTANT
      }}
    >
      {/* CLOSE BUTTON */}
      <button
        style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          background: "red",
          color: "#fff",
          padding: "6px 14px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          zIndex: 3000,
        }}
        onClick={() => setPopupComponent(null)}
      >
        Close
      </button>

      {/* POPUP BODY */}
      <div style={{ marginTop: "40px" }}>
        {popupComponent}
      </div>
    </div>
  </div>
)}
{/* 🗑️ Removed the now-redundant showOperationsPopup modal */}
{/* {showOperationsPopup && (
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
      zIndex: 2000,
      padding: "20px",
    }}
    onClick={() => setShowOperationsPopup(false)} // click outside to close
  >
    <div
      style={{
        background: "#fff",
        borderRadius: "10px",
        padding: "25px",
        width: "90%",
        maxWidth: "450px",
      }}
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Operations
      </h2>

      {operationsItems.map((item, index) => (
        <div
          key={index}
          onClick={() => (window.location.href = item.link)}
          style={{
            background: item.color,
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "10px",
            cursor: "pointer",
          }}
        >
          <h3 style={{ margin: 0 }}>{item.title}</h3>
          <p style={{ margin: 0, fontSize: "13px" }}>{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
)}
*/}


      </div>
    </div>
  );
};

export default Dashboard;