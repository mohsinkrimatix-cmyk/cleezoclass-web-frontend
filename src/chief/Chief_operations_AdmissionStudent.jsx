import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookReader,
  faExclamationCircle,
  faAward,
  faChartBar,
  faSync,
  faChartLine,
  faClock,
  faUsers,
  faTimes,
  faDownload,
  faPrint,
  faShareAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import ErrorPopup from "../shared/ErrorPopup";

// =======================================================
// UTILITY FUNCTIONS
// =======================================================

const getSchoolCode = () => {
  return localStorage.getItem("schoolCode");
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split("-");
      return `${day}-${month}-${year}`;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateString;
  }
};

// =======================================================
// 1. REUSABLE LEDGER POPUP COMPONENT
// =======================================================

const AcademicLedgerPopup = ({ isOpen, onClose, title, data, headers, loading }) => {
  const modalRef = useRef();
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 10;

  const rows = Array.isArray(data) ? data : [];
  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = rows.slice(
    (safePage - 1) * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE
  );

  if (!isOpen) return null;


const modalStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.0)",
  backdropFilter: "blur(5px)",
  WebkitBackdropFilter: "blur(5px)",
  zIndex: 2000,
};


const contentStyle = {
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
};




const actionBtnContainerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "flex-start",
  alignSelf: "flex-start",
  gap: "10px",
  marginBottom: "0",
  marginTop: "-25px", // same as Income popup
};

const actionBtnStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#333",
  padding: 0,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};


  const tableContainerStyle = {
    flex: 1,
    overflowY: "auto",
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
  };

  const thTdStyle = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "left",
  };

  const normalizeHeader = (key) =>
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const isDateField = (key) =>
    ["date", "createdat", "winning_date", "created_at"].includes(
      key.toLowerCase()
    );

  const formatDateForDisplay = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().split("T")[0];
};


  const handleDownloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No data to download.");
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

const handlePrint = () => {
  window.print();
};


  return (
  <>
<style>

  {`
    @media print {
      body * {
        visibility: hidden;
      }
      .printable-modal, .printable-modal * {
        visibility: visible;
      }
      .printable-modal {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: white;
      }
      .no-print {
        display: none !important;
      }
    }
  `}
</style>
    <div style={modalStyle} onClick={onClose}>
 <div
  style={contentStyle}
  onClick={(e) => e.stopPropagation()}
  ref={modalRef}
  className="printable-modal"
>
        <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "flex-start",
    marginBottom: "35px"
  }}
>
  <div />

  <h2
  style={{
    textAlign: "center",
    margin: 0,
    lineHeight: "1.1",
    fontSize: "16px",
  }}
>
  {title} Ledger
</h2>

  <div style={actionBtnContainerStyle} className="no-print">
    <button
      onClick={() => handleDownloadCSV(data, title.replace(/\s/g, "_"))}
      style={actionBtnStyle}
    >
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button onClick={handlePrint} style={actionBtnStyle}>
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button
      onClick={() => {
        if (navigator.share) {
          navigator
            .share({
              title: title,
              text: `Check out this ${title} report.`,
              url: window.location.href,
            })
            .catch(console.error);
        } else {
          alert("Web Share API not supported on this browser.");
        }
      }}
      style={actionBtnStyle}
    >
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button onClick={onClose} style={actionBtnStyle}>
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>


        <div style={tableContainerStyle}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#3498db", fontWeight: "bold" }}>
              Loading detailed report...
            </p>
          ) : !Array.isArray(data) || data.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888" }}>
              No detailed data found for this report.
            </p>
          ) : (
                        <>
              <table style={tableStyle}>
                <thead>
                <tr style={{ background: "#0A4D82", color: "#fff" }}>
  {headers.map((header) => (
    <th key={header} style={{ ...thTdStyle, fontWeight: "bold" }}>
      {normalizeHeader(header)}
    </th>
  ))}
</tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      style={{
                        background: rowIndex % 2 === 0 ? "#fafafa" : "#f1f6fa",
                      }}
                    >
                      {headers.map((header, colIndex) => {
                        let cellValue = row[header] || "N/A";
                        if (isDateField(header)) cellValue = formatDateForDisplay(cellValue);
                        return (
                          <td key={colIndex} style={thTdStyle}>
                            {cellValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
  <div
    className="no-print"
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "12px",
      marginTop: "15px",
      fontSize: "13px",
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

      <style>
        {`@media print { .no-print { display: none !important; } }`}
      </style>
    </div></>

  );
};

// =======================================================
// 2. CHART COMPONENTS
// =======================================================

const TestPerformanceBarChart = ({ data }) => {
  const formatYAxis = (value) => `${value.toFixed(0)}%`;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="test_type" height={40} style={{ fontSize: "10px" }} />
        <YAxis
          tickFormatter={formatYAxis}
          domain={[0, 100]}
          style={{ fontSize: "10px" }}
        />
        <Tooltip
          formatter={(value) => {
            const numericValue = typeof value === "number" ? value : parseFloat(value);
            if (!Number.isFinite(numericValue)) {
              return ["N/A", "Avg. Score"];
            }
            return [`${numericValue.toFixed(2)}%`, "Avg. Score"];
          }}
          labelFormatter={(label) => `Test Type: ${label}`}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: "10px" }}
          layout="horizontal"
          verticalAlign="top"
          align="center"
        />
        <Bar dataKey="average_score" fill="#2980B9" name="Average Score (%)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const PerformanceLineChart = ({ data }) => {
  const formatXAxis = (tickItem) => {
    const [year, month] = tickItem.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const formatYAxis = (value) => `${value.toFixed(0)}%`;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickFormatter={formatXAxis}
          height={40}
          style={{ fontSize: "10px" }}
        />
        <YAxis
          tickFormatter={formatYAxis}
          domain={[0, 100]}
          style={{ fontSize: "10px" }}
        />
        <Tooltip
          formatter={(value) => {
            const numericValue = parseFloat(value);
            if (!Number.isFinite(numericValue)) {
              return ["N/A", "Avg. Performance"];
            }
            return [`${numericValue.toFixed(2)}%`, "Avg. Performance"];
          }}
          labelFormatter={formatXAxis}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: "10px" }}
          layout="horizontal"
          verticalAlign="top"
          align="center"
        />
        <Line
          type="monotone"
          dataKey="avg_performance"
          stroke="#e74c3c"
          activeDot={{ r: 8 }}
          name="Performance Trend"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// =======================================================
// 3. MAIN DASHBOARD COMPONENT
// =======================================================

export default function AdmissionStudentChief() {
  const [popupMessage, setPopupMessage] = useState("");
  const [isBlurActive, setIsBlurActive] = useState(false);

  const outerContainerStyle = {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "transparent",
    minHeight: "70vh",
    padding: "0",
    boxSizing: "border-box",
  };

  const innerContainer = {
    width: "100%",
    maxWidth: "1000px",
    display: "flex",
    padding: "15px",
    background: "transparent",
    borderRadius: "10px",
    margin: "0px auto",
    flexDirection: "column",
    height: "80vh",
    overflow:"auto",
     scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
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

  const topRowContainer = {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    backgroundColor: "#fff",
  };

  const leftColumn = {
    flex: 4,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    border: "1px solid #8c8b8bff",
    borderRadius: "8px",
    backgroundColor: "#fff",
  };

  const rightColumn = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const bottomRowContainer = {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const card = {
    background: "transparent",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "right",
    width: "100%",
    height: "20%",
    border: "1px solid #8c8b8bff",
  };

  const cardLarge = {
    background: "transparent",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    flexGrow: 1,
    border: "0px solid #8c8b8bff",
  };

  const boxStyle = {
    flex: 1,
    padding: "1px",
    borderRight: "1px solid #8c8b8bff",
    borderRadius: "4px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    height: "160px",
    margin: "0 2px",
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
    color: "#3498db",
    fontSize: "11px",
    marginTop: "5px",
    width: "15%",
  };

  const [selectedMonth, setSelectedMonth] = useState("2025-08");
  const [academicTotals, setAcademicTotals] = useState({
    monthlyAvgScore: 0,
    totalTests: 0,
    poorPerformers: 0,
    highPerformers: 0,
    unpunctualStudents: 0,
    progressReportsGenerated: 0,
    attendanceTracked: 0,
    splCount: 0,
    loading: true,
    error: null,
  });

  const [testPerformanceData, setTestPerformanceData] = useState([]);
  const [performanceTrendData, setPerformanceTrendData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerTitle, setLedgerTitle] = useState("");
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerHeaders, setLedgerHeaders] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

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

  const formatMetric = (value, isPercent = false, isLoading = false) => {
    if (isLoading) return "Loading...";
    if (value === null || value === undefined) return "N/A";

    const numericValue = parseFloat(value) || 0;
    if (isPercent) {
      return `${numericValue.toFixed(2)}%`;
    }
    return numericValue.toLocaleString("en-IN");
  };

  const API_BASE = "https://cleezoclass.com:4000/api";

  const fetchAcademicTotals = async (monthYear) => {
    setAcademicTotals((prev) => ({ ...prev, loading: true, error: null }));
    const schoolCode = getSchoolCode();
    if (!schoolCode) {
      setAcademicTotals((prev) => ({
        ...prev,
        loading: false,
        error: "School Code not found",
      }));
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE}/dashboard-totals?schoolCode=${schoolCode}&month=${monthYear}`
      );
      const data = response.data;

      setAcademicTotals({
        monthlyAvgScore: parseFloat(data.monthlyAvgScore) || 0,
        totalTests: parseFloat(data.totalTests) || 0,
        poorPerformers: parseFloat(data.poorPerformers) || 0,
        highPerformers: parseFloat(data.highPerformers) || 0,
        unpunctualStudents: parseFloat(data.unpunctualStudents) || 0,
        progressReportsGenerated: parseFloat(data.progressReportsGenerated) || 0,
        attendanceTracked: parseFloat(data.attendanceTracked) || 0,
        splCount: parseFloat(data.splCount) || 0,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching Academic Totals:", err);
      setAcademicTotals((prev) => ({
        ...prev,
        loading: false,
        error: err.message.includes("Network") ? "Network Error" : "API Error",
      }));
    }
  };

  const fetchChartData = async () => {
    setChartLoading(true);
    const schoolCode = getSchoolCode();
    if (!schoolCode) {
      setChartLoading(false);
      console.error("School Code not found for chart data.");
      return;
    }

    try {
      const barChartResponse = await axios.get(
        `${API_BASE}/test-performance-by-type?schoolCode=${schoolCode}`
      );
      setTestPerformanceData(barChartResponse.data || []);

      const trendResponse = await axios.get(
        `${API_BASE}/monthly-performance-trend?schoolCode=${schoolCode}`
      );
      setPerformanceTrendData(trendResponse.data || []);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchLedgerData = async (endpoint, title, defaultHeaders, monthYear = null) => {
    setLedgerLoading(true);
    setIsLedgerOpen(true);
    setIsBlurActive(true);
    setLedgerTitle(title);
    setLedgerHeaders(defaultHeaders);
    setLedgerData([]);

    const schoolCode = getSchoolCode();
    if (!schoolCode) {
      setLedgerLoading(false);
      return;
    }

    const monthParam = monthYear ? `&month=${monthYear}` : "";

    try {
      const response = await axios.get(
        `${API_BASE}/${endpoint}?schoolCode=${schoolCode}${monthParam}`
      );
      setLedgerData(response.data || []);
    } catch (error) {
      console.error(`Error fetching ${title} ledger data:`, error);
      setLedgerData([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAcademicTotals(selectedMonth);
    fetchChartData();
  };

  useEffect(() => {
    fetchAcademicTotals(selectedMonth);
    fetchChartData();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchAcademicTotals(selectedMonth);
    }
  }, [selectedMonth]);

  const handleViewReport = (reportName) => {
    const monthYear = selectedMonth;

    switch (reportName) {
      case "Test Reports":
        fetchLedgerData(
          "all-tests-ledger",
          "Tests",
          ["name", "class_name", "subject", "marks", "test_type", "createdAt"]
        );
        break;
      case "Low Performance List":
        fetchLedgerData(
          "low-performance-list",
          "Low Performance Students (FA1 < 40)",
          ["name", "class_name", "section", "subject", "marks"]
        );
        break;
      case "High Performance List":
        fetchLedgerData(
          "high-performance-list",
          "High Performance Students (FA1 >= 80)",
          ["name", "class_name", "section", "subject", "marks"]
        );
        break;
      case "Unpunctual Students List":
        fetchLedgerData(
          "unpunctual-students-list",
          `Unpunctual Students (${monthYear})`,
          ["name", "class", "section", "date", "submission_time"],
          monthYear
        );
        break;
      case "Attendance Track Detail":
        fetchLedgerData(
          "attendance-detail",
          `Attendance Detail (${monthYear})`,
          ["name", "class", "section", "date", "leavetype", "submission_time"],
          monthYear
        );
        break;
      case "Generated Reports List":
        fetchLedgerData(
          "generated-reports-list",
          `Generated Progress Reports (${monthYear})`,
          ["name", "class_name", "section", "report", "comment", "created_at"],
          monthYear
        );
        break;
      case "SPL Status":
        fetchLedgerData(
          "spl-list",
          "Special Project Leaders (SPL) List",
          ["name", "class_name", "section", "marks"]
        );
        break;
      case "Monthly Report Status":
        setPopupMessage(
          `Viewing report for: ${reportName}\n\nThis will open a detailed ledger report once the corresponding API is implemented.`
        );
        break;
      case "Test Performance Chart Detail":
      case "Performance Trend Detail":
        handleViewReport("Test Reports");
        break;
      default:
        setPopupMessage(`Viewing report for: ${reportName}`);
        break;
    }
  };

  const closeLedger = () => {
    setIsBlurActive(false);
    setIsLedgerOpen(false);
  };

  return (
    <>
      {/* Main content with blur effect */}
    <div
  className={isBlurActive ? "blur-background-active" : ""}
  style={{
    ...outerContainerStyle,
  }}
>

        <h2 style={headingStyle}>Academics – Students</h2>
    <div style={innerContainer}>
        {/* --- GLOBAL MONTH SELECTOR --- */}

        {/* TOP ROW: General Reports and Total Cards */}
        <div style={topRowContainer}>
          <div style={leftColumn}>
            <div style={cardLarge}>
              <div
                style={{
                  marginBottom: "0",
                  textAlign: "right",
                  paddingBottom: "10px",
                }}
              >
                <select
                  id="global-month-select"
                  style={{
                    padding: "3px 0",
                    fontSize: "12px",
                    borderRadius: "6px",
                    border: "1px solid #3498db",
                    minWidth: "30px",
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

              {/* START: Side-by-Side Chart Container */}
              <div
                style={{
                  display: "flex",
                  gap: "10px", // Space between charts
                  marginBottom: "15px",
                  borderBottom: "1px solid #8c8b8bff",
                  paddingBottom: "15px",
                  flexWrap: "wrap", // For responsiveness
                }}
              >
                {/* 🚀 Bar Chart */}
                <div
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between", // Ensures button aligns with chart content
                    paddingBottom: "0", // Ensure no extra space at bottom
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Test Performance
                  </h4>

                  {/* Bar Chart Component */}
                  {chartLoading ? (
                    <p
                      style={{
                        textAlign: "center",
                        fontSize: "12px",
                        color: "#888",
                      }}
                    >
                      Loading Chart Data...
                    </p>
                  ) : (
                    <TestPerformanceBarChart data={testPerformanceData} />
                  )}

                  {/* Button Container */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "5px",
                      marginBottom: "0",
                    }}
                  >
                    <button
                      data-guide="academics-btn-test-performance-chart-report"
                      onClick={() =>
                        handleViewReport("Test Performance Chart Detail")
                      }
                      className="btn-outline"
                    >
                      View Report
                    </button>
                  </div>
                </div>

                {/* 🚀 Line Chart */}
                <div
                  style={{
                    flex: 1,
                    minWidth: "45%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between", // Same as above, aligns button with content
                    paddingBottom: "0", // Ensure no extra space at bottom
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 10px 0",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  >
                    Performance Graph
                  </h4>

                  {/* Line Chart Component */}
                  {chartLoading ? (
                    <p
                      style={{
                        textAlign: "center",
                        fontSize: "12px",
                        color: "#888",
                      }}
                    >
                      Loading Chart Data...
                    </p>
                  ) : (
                    <PerformanceLineChart data={performanceTrendData} />
                  )}

                  {/* Button Container */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "5px",
                      marginBottom: "0",
                    }}
                  >
                    <button data-guide="academics-btn-performance-graph-report"
                      onClick={() =>
                        handleViewReport("Test Performance Chart Detail")
                      }
                                           className="btn-outline"

                    >
                      View Report
                    </button>
                  </div>
                </div>
              </div>
              {/* END: Side-by-Side Chart Container */}

              {/* Critical Lists */}
              <div
                style={{
                  marginTop: "5px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0",
                }}
              >
                {/* ✨ Size Reduction: Adjusted font size to 12px */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "12px",
                      margin: 0,
                      fontWeight: "400",
                      color: "#2f2e2eff",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faExclamationCircle}
                      style={{ marginRight: "5px", fontSize: "12px" }}
                    />
                    {formatMetric(
                      academicTotals.poorPerformers,
                      false,
                      academicTotals.loading
                    )}{" "}
                    students’ FA1 performance is not good
                  </h2>
                  <button data-guide="academics-btn-low-performance-list"
                    onClick={() => handleViewReport("Low Performance List")}
className="btn-outline"  style={{marginBottom:'20px'}}
                 >
                    View List
                  </button>
                </div>

                {/* ✨ Size Reduction: Adjusted font size to 12px */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "12px",
                      margin: 0,
                      fontWeight: "400",
                      color: "#2f2e2eff",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faAward}
                      style={{ marginRight: "5px", fontSize: "12px" }}
                    />
                    {formatMetric(
                      academicTotals.highPerformers,
                      false,
                      academicTotals.loading
                    )}{" "}
                    students performed well in FA1
                  </h2>
                  <button
                    data-guide="academics-btn-high-performance-list"
                    onClick={() => handleViewReport("High Performance List")}
className="btn-outline" style={{marginBottom:'20px'}}
                 >
                    View List
                  </button>
                </div>

                {/* ✨ Size Reduction: Adjusted font size to 12px */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "12px",
                      margin: 0,
                      fontWeight: "400",
                      color: "#2f2e2eff",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faClock}
                      style={{ marginRight: "5px", fontSize: "12px" }}
                    />
                    {formatMetric(
                      academicTotals.unpunctualStudents,
                      false,
                      academicTotals.loading
                    )}{" "}
                    students with unpunctual behavior
                  </h2>
                  <button
                    data-guide="academics-btn-unpunctual-report"
                    onClick={() => handleViewReport("Unpunctual Students List")}
className="btn-outline"
                 >
                    View Report
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Total Cards */}
          <div style={rightColumn}>
            <div style={card}>
              {/* ✨ Size Reduction: Adjusted font size to 16px */}

              <h3
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  margin: "0 0 5px 0",

                }}
              >
                {" "}
                Test Reports
              </h3>
              {/* ✨ Size Reduction: Adjusted font size to 18px */}
              <p
                style={{
                  fontSize: "30px",
                  fontWeight: "400px",
                  margin: "0 0 5px 0",
                      color: "#3498db",

                }}
              >
                {formatMetric(
                  academicTotals.totalTests,
                  false,
                  academicTotals.loading
                )}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "2px",
                }}
              >
                <button data-guide="academics-btn-test-reports-view-all"
                  onClick={() => handleViewReport("Test Reports")}
                       className="btn-outline" 

                >
                  {academicTotals.loading ? "Refreshing..." : "View All"}
                </button>
              </div>
            </div>
            {/* MONTHLY AVERAGE SCORE CARD */}
            <div style={card}>
              {/* ✨ Size Reduction: Adjusted font size to 16px */}
              <h3
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  margin: "0 0 5px 0",
                }}
              >
                {" "}
                Performance Report({selectedMonth})
              </h3>
              {/* ✨ Size Reduction: Adjusted font size to 18px */}
              <p
                style={{
                  fontSize: "30px",
                  fontWeight: "400px",
                  margin: "0 0 5px 0",
                  color: "#3498db",
                }}
              >
                {formatMetric(
                  academicTotals.monthlyAvgScore,
                  true,
                  academicTotals.loading
                )}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "2px",
                }}
              >
                <button data-guide="academics-btn-performance-report-view"
                  onClick={() => handleViewReport("Performance Trend Detail")}
                        className="btn-outline" 

                >
                  View Report
                </button>
              </div>
            </div>
            {/* 💡 SPL STATUS CARD (Updated to show count from API) */}
         <div
  style={{
    ...card,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "150px", // adjust as needed
    padding: "10px",
  }}
>
  {/* Title */}
  <h3
    style={{
      fontSize: "12px",
      fontWeight: "600",
      margin: 0,
      textAlign: "center",
    }}
  >
    School People Leader (SPL)
  </h3>

  {/* Name centered */}
<p
  style={{
    fontSize: "16px",
    fontWeight: "400px",
    color: "#3498db",
    textAlign: "center",
    margin: 0,
    lineHeight: "1.2", // optional, to control spacing between lines
  }}
>
  N. Chandrika
  <br />
  (9-A)
</p>


  {/* Button at the bottom */}
  <div style={{ display: "flex", justifyContent: "center" }}>
    <button data-guide="academics-btn-spl-view-status"
      onClick={() => handleViewReport("SPL Status")}
      className="btn-outline"
    >
      View Status
    </button>
  </div>
</div>

          </div>
        </div>

        {/* BOTTOM ROW: Academic/Attendance Breakdown */}
        <div style={bottomRowContainer}>
          <div
            style={{
              flex: "0 0 auto",
              border: "1px solid #8c8b8bff",
              borderRadius: "8px",
              padding: "10px",
              background: "transparent",
              lineHeight: "0.1px",
            }}
          >
            <div style={{ display: "flex", gap: "5px" }}>
              {/* BOX 1: Progress Report Generated Count */}
              <div
                style={{
                  ...boxStyle,
                  borderRight: "1px solid #8c8b8bff",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faChartLine} style={iconStyle} />
                  <h4 style={{ fontSize: "12px", margin: "5px 0 0 0" }}>
                    Progress Reports Generated
                  </h4>
                </div>

                <p
                  style={{
                    fontSize: "30px",
                    fontWeight: "400px",
                    margin: "3px 0",
                  }}
                >
                  {formatMetric(
                    academicTotals.progressReportsGenerated,
                    false,
                    academicTotals.loading
                  )}
                </p>
                <button data-guide="academics-btn-progress-generated-list"
                  onClick={() => handleViewReport("Generated Reports List")}
         className="btn-outline" style={{padding:'14px'}}

                >
                  View List
                </button>
              </div>

              {/* BOX 2: Monthly Progress Report Status (Pending/Total) */}
              <div
                style={{
                  ...boxStyle,
                  borderRight: "1px solid #8c8b8bff",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faChartLine} style={iconStyle} />
                  <h4 style={{ fontSize: "12px", margin: "5px 0 0 0" }}>
                    Progress Reports Pending
                  </h4>
                </div>

                <p
                  style={{
                    fontSize: "30px",
                    fontWeight: "400px",
                    margin: "3px 0",
                  }}
                >
                  13
                </p>
                <button data-guide="academics-btn-progress-pending-list"
                  onClick={() => handleViewReport("Monthly Report Status")}
         className="btn-outline" style={{padding:'14px'}}

                >
                  View List
                </button>
              </div>

              {/* BOX 3: Attendance Tracked Count */}
              <div
                style={{
                  ...boxStyle,
                  borderRight: "none",
                  padding: "10px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "100%",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faChartLine} style={iconStyle} />
                  <h4 style={{ fontSize: "12px", margin: "5px 0 0 0" }}>
                     Attendance Track
                  </h4>
                </div>

                <p
                  style={{
                    fontSize: "30px",
                    fontWeight: "400px",
                    margin: "3px 0",
                  }}
                >
                  {formatMetric(
                    academicTotals.attendanceTracked,
                    false,
                    academicTotals.loading
                  )}
                </p>
                <button data-guide="academics-btn-attendance-track-list"
                  onClick={() => handleViewReport("Attendance Track Detail")}
         className="btn-outline" style={{padding:'14px'}}

                >
                  View List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Popup outside the blurred container */}
      <AcademicLedgerPopup
        isOpen={isLedgerOpen}
        onClose={closeLedger}
        title={ledgerTitle}
        data={ledgerData}
        headers={ledgerHeaders}
        loading={ledgerLoading}
      />

      {/* Error popup */}
      <ErrorPopup message={popupMessage} onClose={() => setPopupMessage("")} />
    </>
  );
}
