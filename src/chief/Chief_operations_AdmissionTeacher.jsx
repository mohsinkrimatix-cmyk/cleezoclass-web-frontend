import React, { useState, useEffect } from "react";
import axios from "axios";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRupeeSign,
  faBookReader,
  faExclamationCircle,
  faAward,
  faMoneyCheckAlt,
  faTimes,
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
// CONFIGURATION
// =======================================================
const API_BASE = "https://cleezoclass.com:4000/api";

// =======================================================
// UTILITY FUNCTIONS
// =======================================================
const getSchoolCode = () => {
  return localStorage.getItem("schoolCode");
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// =======================================================
// POPUP COMPONENTS
// =======================================================
const AcademicLedgerPopup = ({
  isOpen,
  onClose,
  title,
  data = [],
  headers = [],
  loading,
  subject,
  classes = [],
}) => {
  if (!isOpen) return null;

  const subjectList = Array.isArray(subject)
    ? subject
    : typeof subject === "string"
    ? subject.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const filteredData = data.filter((row) => {
    const subjectMatch =
      subjectList.length === 0 || subjectList.includes(row.subject);
    const rowClass = String(row.class_name || row.class || "").trim();
    const classMatch =
      !classes || classes.length === 0 || classes.includes(rowClass);
    return subjectMatch && classMatch;
  });

  const modalStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "10px",
    zIndex: 2000,
  };

  const contentStyle = {
    width: "90%",
    maxWidth: "1000px",
    maxHeight: "80vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "8px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    animation: "fadeIn 0.3s ease-in-out",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
    marginBottom: "15px",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#e74c3c",
  };

  const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "12px" };
  const thTdStyle = { border: "1px solid #ccc", padding: "8px", textAlign: "left" };

  const normalizeHeader = (key) =>
    key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const isDateField = (key) =>
    ["date", "createdat", "created_at", "winning_date"].includes(
      key.toLowerCase()
    );

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: "10px" }}>
            {title}
            {subjectList.length > 0 && <> | Subjects: {subjectList.join(", ")}</>}
            {classes?.length > 0 && <> | Classes: {classes.join(", ")}</>}
          </h3>
          <button onClick={onClose} style={closeButtonStyle} disabled={loading}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#3498db", fontWeight: "bold" }}>
            Loading detailed report...
          </p>
        ) : filteredData.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888" }}>
            No data found for selected teacher / classes
          </p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: "#8dabb6", color: "#fff" }}>
                {headers.map((header) => (
                  <th key={header} style={{ ...thTdStyle, fontWeight: "bold" }}>
                    {normalizeHeader(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    background: rowIndex % 2 === 0 ? "#fafafa" : "#f1f6fa",
                  }}
                >
                  {headers.map((header, colIndex) => {
                    let cellValue = row[header] ?? "N/A";
                    if (isDateField(header)) {
                      cellValue = formatDate(cellValue);
                    }
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
        )}
      </div>
    </div>
  );
};

// =======================================================
// CHART COMPONENTS
// =======================================================
const TestPerformanceBarChart = ({ data }) => {
  const formatYAxis = (value) => `${value.toFixed(0)}%`;
  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="test_type" height={40} style={{ fontSize: "10px" }} />
        <YAxis
          tickFormatter={formatYAxis}
          domain={[0, 100]}
          style={{ fontSize: "10px" }}
        />
        <Tooltip
          formatter={(value) => [`${value.toFixed(2)}%`, "Avg. Score"]}
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
    <ResponsiveContainer width="100%" height={150}>
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
            const formattedValue =
              typeof value === "number" && isFinite(value)
                ? value.toFixed(2)
                : "N/A";
            return [`${formattedValue}%`, "Avg. Performance"];
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
// MAIN COMPONENT
// =======================================================
export default function AdmissionTeacherChief() {
  const [isBlurActive, setIsBlurActive] = useState(false);

  const closeLedger = () => {
    setIsBlurActive(false);
    setIsLedgerOpen(false);
  };

  // ------------------------------
  // COMMON STYLES
  // ------------------------------
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
    border: "1px solid #8c8b8bff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  const cardLarge = {
    background: "transparent",
    border: "1px solid #8c8b8bff",
    padding: "10px",
    borderRadius: "8px",
    boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  const boxStyle = {
    flex: 1,
    padding: "8px",
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
    padding: "8px 12px",
    borderRadius: "8px",
    background: "none",
    color: "#3498db",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    width: "150px",
    margin: 0,
  };

  const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "12px" };
  const thTdStyle = { border: "1px solid #ccc", padding: "8px", textAlign: "left" };

  // ------------------------------
  // STATE & DATA FETCHING
  // ------------------------------
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("ALL");
  const [teacherDesignation, setTeacherDesignation] = useState("All");
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledgerTitle, setLedgerTitle] = useState("");
  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerHeaders, setLedgerHeaders] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [summaryMetrics, setSummaryMetrics] = useState({
    syllabusReport: "65%",
    performanceReport: "90%",
    attendanceReport: "N/A",
    reportsGenerated: 0,
    reportsPending: "5",
    attendanceTrack: 0,
    loading: true,
    error: null,
  });
  const [criticalLists, setCriticalLists] = useState({
    syllabusDelayed: 0,
    performanceImpacts: 0,
    unpunctualBehavior: 0,
    loading: true,
  });
  const [testPerformanceData, setTestPerformanceData] = useState([]);
  const [performanceTrendData, setPerformanceTrendData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState("");
  const [currentMonthPresent, setCurrentMonthPresent] = useState(null);
  const [isAttendancePopupOpen, setIsAttendancePopupOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [allAttendanceData, setAllAttendanceData] = useState([]);

  // =======================================================
  // FETCHING LOGIC
  // =======================================================
  const getFilterParams = (teacherId, designation) => {
    const schoolCode = getSchoolCode();
    const teacherFilter = teacherId !== "ALL" ? `&teacherId=${teacherId}` : "";
    const subjectFilter = designation !== "All" ? `&subject=${designation}` : "";
    return `schoolCode=${schoolCode}${teacherFilter}${subjectFilter}`;
  };

  const fetchSummaryMetrics = async (teacherId, designation) => {
    setSummaryMetrics((prev) => ({ ...prev, loading: true }));
    const schoolCode = getSchoolCode();
    if (!schoolCode) {
      setSummaryMetrics((prev) => ({ ...prev, loading: false }));
      return;
    }

    const params = getFilterParams(teacherId, designation);

    try {
      const summaryResponse = await axios.get(
        `${API_BASE}/teacher-summary-metrics?${params}`
      );
      const data = summaryResponse.data || {};

      const breakdownResponse = await axios.get(
        `${API_BASE}/teacher-breakdown-metrics?${params}`
      );
      const breakdownData = breakdownResponse.data || {};

      const criticalResponse = await axios.get(
        `${API_BASE}/teacher-critical-list-counts?${params}`
      );
      const criticalData = criticalResponse.data || {};

      setSummaryMetrics({
        syllabusReport: data.syllabusReport || "N/A",
        performanceReport: data.performanceReport || "N/A",
        attendanceReport: data.attendanceReport || "N/A",
        reportsGenerated: breakdownData.reportsGenerated || 0,
        reportsPending: breakdownData.reportsPending || "N/A",
        attendanceTrack: breakdownData.attendanceTrack || 0,
        loading: false,
        error: null,
      });

      setCriticalLists({
        syllabusDelayed: criticalData.syllabusDelayed || 0,
        performanceImpacts: criticalData.performanceImpacts || 0,
        unpunctualBehavior: criticalData.unpunctualBehavior || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching summary metrics:", error);
      setSummaryMetrics((prev) => ({ ...prev, loading: false, error: error.message }));
      setCriticalLists((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchChartData = async (teacherId) => {
    setChartLoading(true);
    const schoolCode = getSchoolCode();
    if (!schoolCode) {
      setChartLoading(false);
      console.error("School Code not found for chart data.");
      return;
    }

    const selectedTeacher = teacherId && teachers.find((t) => String(t.id) === String(teacherId));
    const params = { schoolCode };
    if (selectedTeacher?.id) params.teacherId = selectedTeacher.id;
    if (selectedTeacher?.subject) params.subject = selectedTeacher.subject;
    if (selectedTeacher?.class) {
      const classArray = selectedTeacher.class.split(",").map((c) => c.trim());
      classArray.forEach((cls) => {
        params.className = params.className || [];
        params.className.push(cls);
      });
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map((v) => `${key}=${encodeURIComponent(v)}`).join("&");
        }
        return `${key}=${encodeURIComponent(value)}`;
      })
      .join("&");

    try {
      const barChartResponse = await axios.get(
        `${API_BASE}/chieftest-performance-by-type?${queryString}`
      );
      setTestPerformanceData(barChartResponse.data || []);
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setTestPerformanceData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchLedgerData = async (endpoint, title, defaultHeaders, filters = {}) => {
    setLedgerLoading(true);
    setIsLedgerOpen(true);
    setIsBlurActive(true);
    setLedgerTitle(title);
    setLedgerHeaders(defaultHeaders);
    setLedgerData([]);

    const schoolCode = getSchoolCode();
    const teacherId = filters.teacher || "ALL";
    const designation = filters.subject || "All";
    const params = getFilterParams(teacherId, designation);

    try {
      const response = await axios.get(`${API_BASE}/${endpoint}?${params}`);
      setLedgerData(response.data || []);
    } catch (error) {
      console.error(`Error fetching ${title} ledger:`, error);
      setLedgerData([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const fetchCurrentMonthPresentCount = async (teacherId) => {
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) {
        console.warn("schoolCode not found in localStorage");
        return;
      }

      const res = await axios.get(
        "https://cleezoclass.com:4000/api/Chiefattendance/current-month-count",
        {
          params: {
            teacherId,
            schoolCode,
          },
        }
      );

      setCurrentMonthPresent(res.data.presentCount);
    } catch (err) {
      console.error("Error fetching present count:", err);
    }
  };

  const fetchAttendanceByTeacherId = async (teacherId) => {
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) {
        console.warn("schoolCode not found in localStorage");
        return;
      }

      const res = await axios.get(
        "https://cleezoclass.com:4000/api/Chiefattendance",
        {
          params: {
            teacherId,
            schoolCode,
          },
        }
      );

      setAllAttendanceData(res.data);
      setAttendanceData(res.data);
      setIsAttendancePopupOpen(true);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const handleFilter = () => {
    const filtered = allAttendanceData.filter((att) => {
      const attDate = new Date(att.date);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;

      if (from && attDate < from) return false;
      if (to && attDate > to) return false;
      return true;
    });
    setAttendanceData(filtered);
  };

  const handleTeacherChange = (e) => {
    const teacherId = e.target.value;
    setSelectedTeacherId(teacherId);
  };

  // ------------------------------
  // EFFECTS
  // ------------------------------
  useEffect(() => {
    const schoolCode = getSchoolCode();
    if (!schoolCode) {
      console.warn("No school code found");
      return;
    }

    axios
      .get("https://cleezoclass.com:4000/teachers", {
        params: { schoolCode },
      })
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTeachers(res.data);
        } else {
          console.error("Teachers API did not return array");
        }
      })
      .catch((err) => {
        console.error("Error fetching teachers:", err);
      });

    axios
      .post("https://cleezoclass.com:4000/api/schoollogodynamic", {
        secretecode: schoolCode,
      })
      .then((res) => {
        if (res.data?.logoPath) setDynamicLogoSrc(res.data.logoPath);
      })
      .catch((err) => {
        console.error("Error fetching school logo:", err);
      });
  }, []);

  useEffect(() => {
    const schoolCode = getSchoolCode();
    if (!schoolCode) return;

    let designation = "All";
    if (selectedTeacherId !== "ALL" && teachers.length > 0) {
      const selectedTeacher = teachers.find(
        (t) => String(t.id) === selectedTeacherId
      );
      if (selectedTeacher) {
        designation = selectedTeacher.designation || selectedTeacher.subject || "N/A";
      }
    }

    setTeacherDesignation(designation);
    fetchSummaryMetrics(selectedTeacherId, designation);
    fetchChartData(selectedTeacherId, designation);
  }, [selectedTeacherId, teachers]);

  useEffect(() => {
    if (selectedTeacherId && selectedTeacherId !== "ALL") {
      fetchCurrentMonthPresentCount(selectedTeacherId);
    }
  }, [selectedTeacherId]);

  const handleViewReport = (reportName) => {
    const selectedTeacher =
      selectedTeacherId !== "ALL"
        ? teachers.find((t) => String(t.id) === String(selectedTeacherId))
        : null;

    const filters = {
      teacherId: selectedTeacher?.id || null,
      subject: selectedTeacher?.subject || null,
      classes: selectedTeacher?.class
        ? selectedTeacher.class.split(",").map((c) => c.trim())
        : [],
    };

    switch (reportName) {
      case "Test Performance Chart Detail":
      case "Test Reports":
        fetchLedgerData(
          "all-tests-ledger",
          "Test Performance",
          ["name", "class_name", "subject", "marks", "test_type", "createdAt"],
          filters
        );
        break;

      case "Attendance Track Detail":
        fetchLedgerData(
          "attendance-track-ledger",
          "Attendance Track",
          ["teacher_name", "date", "status", "entry_time", "exit_time"],
          filters
        );
        break;

      default:
        console.log(`Report: ${reportName}`, filters);
        setIsLedgerOpen(false);
        break;
    }
  };

  // ------------------------------
  // JSX RENDER
  // ------------------------------
  return (
    <>
      {/* Main content with blur effect */}
      <div
        style={{
          ...outerContainerStyle,
          filter: isBlurActive ? "blur(5px)" : "none",
          transition: "filter 0.3s ease",
        }}
      >
        <h2 style={headingStyle}>Academics-Staff</h2>
        <div style={innerContainer}>
          {/* --- GLOBAL TEACHER SELECTOR --- */}
          <div style={topRowContainer}>
            <div style={leftColumn}>
              <div style={cardLarge}>
                {/* START: Teacher Selector and Designation Display */}
                <div className="expense-input-field">

                  <select
                    value={selectedTeacherId}
                    onChange={handleTeacherChange}
                    className="btn-dropdown-FeesManagement"
                  >
                    <option value="ALL">All Teachers</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.name} ({t.subject || "N/A"})
                      </option>
                    ))}
                  </select>
                </div>
                {/* END: Teacher Selector and Designation Display */}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "15px",
                    borderBottom: "1px solid #8c8b8bff",
                    paddingBottom: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* 🚀 Line Chart (Syllabus/Performance Trend) */}
                  <div style={{ flex: 1, minWidth: "45%", minHeight: "200px" }}>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                    >
                      Syllabus Performance (Trend)
                    </h4>
                    {chartLoading ? (
                      <p>Loading Chart Data...</p>
                    ) : (
                      <PerformanceLineChart data={performanceTrendData} />
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "8px",
                      }}
                    >
                      <button
                        className="btn-outline"
                        onClick={() => handleViewReport("Performance Trend Detail")}
                      >
                        View Report
                      </button>
                    </div>
                  </div>

                  {/* 🚀 Bar Chart (Test Graph by Type) */}
                  <div style={{ flex: 1, minWidth: "45%", minHeight: "200px" }}>
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        fontSize: "12px",
                        textAlign: "center",
                      }}
                    >
                      Test Graph (Avg. Score by Test Type)
                    </h4>
                    {chartLoading ? (
                      <p>Loading Chart Data...</p>
                    ) : (
                      <TestPerformanceBarChart data={testPerformanceData} />
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "8px",
                      }}
                    >
                      <button
                        className="btn-outline"
                        onClick={() => handleViewReport("Test Performance Chart Detail")}
                      >
                        View Ledger
                      </button>
                    </div>
                  </div>
                </div>
                {/* END: Side-by-Side Chart Container */}

                {/* Critical Lists */}
                <div
                  style={{
                    marginTop: "15px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h2 style={{ fontSize: "12px", margin: 0 }}>
                      <FontAwesomeIcon
                        icon={faExclamationCircle}
                        style={{ marginRight: "5px", fontSize: "12px" }}
                      />
                      {criticalLists.loading ? "..." : criticalLists.syllabusDelayed}{" "}
                      teacher(s) Syllabus delayed
                    </h2>
                    <button
                      className="btn-outline"
                      onClick={() => handleViewReport("Syllabus Delayed List")}
                    >
                      View Report
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h2 style={{ fontSize: "12px", margin: 0 }}>
                      <FontAwesomeIcon
                        icon={faExclamationCircle}
                        style={{ marginRight: "5px", fontSize: "12px" }}
                      />
                      {criticalLists.loading ? "..." : criticalLists.performanceImpacts}{" "}
                      teacher(s) performance impacts students report
                    </h2>
                    <button
                      className="btn-outline"
                      onClick={() => handleViewReport("Performance Impact List")}
                    >
                      View Report
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h2 style={{ fontSize: "12px", margin: 0 }}>
                      <FontAwesomeIcon
                        icon={faAward}
                        style={{ marginRight: "5px", fontSize: "12px" }}
                      />
                      {criticalLists.loading ? "..." : criticalLists.unpunctualBehavior}{" "}
                      teacher(s) unpunctual behaviour
                    </h2>
                    <button
                      className="btn-outline"
                      onClick={() => handleViewReport("Unpunctual Teachers List")}
                    >
                      View Report
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Summary Cards */}
            <div style={rightColumn}>
              {/* Syllabus Reports Card */}
              <div style={card}>
                <h3
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    margin: "0 0 5px 0",
                  }}
                >
                  Syllabus Reports
                </h3>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: "0 0 5px 0",
                    color: "#3498db",
                  }}
                >
                  {summaryMetrics.loading ? "Loading..." : summaryMetrics.syllabusReport}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "8px",
                  }}
                >
                  <button
                    className="btn-outline"
                    onClick={() => handleViewReport("Syllabus Report Graph")}
                  >
                    View Graph
                  </button>
                </div>
              </div>

              {/* Performance Report Card */}
              <div style={card}>
                <h3
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    margin: "0 0 5px 0",
                  }}
                >
                  Performance Report
                </h3>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    margin: "0 0 5px 0",
                    color: "#3498db",
                  }}
                >
                  {summaryMetrics.loading ? "Loading..." : summaryMetrics.performanceReport}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "8px",
                  }}
                >
                  <button
                    className="btn-outline"
                    onClick={() => handleViewReport("Performance Report Graph")}
                  >
                    View Graph
                  </button>
                </div>
              </div>

              {/* Attendance Report Card */}
              <div style={card}>
                <h3
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    margin: "0 0 5px 0",
                  }}
                >
                  Attendance Report
                </h3>
                <p
                  style={{
                    margin: "0 0 5px 0",
                    color: "#3498db",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "baseline",
                    gap: "5px",
                  }}
                >
                  <span style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {currentMonthPresent ?? "..."}
                  </span>
                  <span style={{ fontSize: "10px" }}>days present</span>
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "8px",
                  }}
                >
                  <button
                    className="btn-outline"
                    onClick={() => fetchAttendanceByTeacherId(selectedTeacherId)}
                  >
                    View Report
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Teacher Metrics Breakdown */}
          <div style={bottomRowContainer}>
            <div>
              <div
                style={{
                  flex: "0 0 auto",
                  borderRadius: "8px",
                  padding: "15px",
                  background: "transparent",
                  border: "1px solid #8c8b8bff",
                }}
              >
                <h3
                  style={{
                    textAlign: "center",
                    margin: "0 0 15px 0",
                    fontSize: "14px",
                  }}
                >
                  Teacher Metrics Breakdown
                </h3>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "5px",
                  }}
                >
                  {/* BOX 1: Progress report generated */}
                  <div style={{ ...boxStyle, borderRight: "1px solid #8c8b8bff" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        justifyContent: "flex-start",
                        width: "100%",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <FontAwesomeIcon icon={faRupeeSign} style={iconStyle} />
                      <h4 style={{ fontSize: "10px", margin: "5px 0 0 0" }}>
                        Progress report generated
                      </h4>
                    </div>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        margin: "5px 0",
                      }}
                    >
                      {summaryMetrics.loading ? "..." : summaryMetrics.reportsGenerated}
                    </p>
                    <button
                      className="btn-outline"
                      onClick={() => handleViewReport("Generated Reports List")}
                    >
                      View List
                    </button>
                  </div>

                  {/* BOX 2: Progress report pending (Designation Filtered) */}
                  <div style={{ ...boxStyle, borderRight: "1px solid #8c8b8bff" }}>
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
                      <h4 style={{ fontSize: "10px", margin: "5px 0 0 0" }}>
                        Progress report pending ({teacherDesignation})
                      </h4>
                    </div>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        margin: "5px 0",
                      }}
                    >
                      {summaryMetrics.loading ? "..." : summaryMetrics.reportsPending}
                    </p>
                    <button
                      className="btn-outline"
                      onClick={() => handleViewReport("Pending Reports List")}
                    >
                      View List
                    </button>
                  </div>

                  {/* BOX 3: Attendance Track */}
                  <div style={{ ...boxStyle, borderRight: "none" }}>
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
                      <h4 style={{ fontSize: "10px", margin: "5px 0 0 0" }}>
                        Attendance Track
                      </h4>
                    </div>
                    <p
                      style={{
                        margin: "0 0 5px 0",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "baseline",
                        gap: "5px",
                      }}
                    >
                      <span style={{ fontSize: "24px", fontWeight: "bold" }}>
                        {currentMonthPresent ?? "..."}
                      </span>
                      <span style={{ fontSize: "10px" }}>days present</span>
                    </p>
                    <button
                      className="btn-outline"
                      onClick={() => fetchAttendanceByTeacherId(selectedTeacherId)}
                    >
                      View Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popups outside the blurred container */}
      <AcademicLedgerPopup
        isOpen={isLedgerOpen}
        onClose={closeLedger}
        title={ledgerTitle}
        data={ledgerData}
        headers={ledgerHeaders}
        loading={ledgerLoading}
      />

      {isAttendancePopupOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setIsAttendancePopupOpen(false)}
        >
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "90%",
              maxWidth: "900px",
              maxHeight: "85vh",
              overflowY: "auto",
              boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Attendance Report</h2>
            <button
              className="btn-solid"
              style={{ float: "right", marginBottom: "10px" }}
              onClick={() => setIsAttendancePopupOpen(false)}
            >
              Close
            </button>

            {/* --- Date Filter --- */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "15px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <label style={{ fontSize: "10px" }}>From: </label>
                <input
                  className="btn-dropdown-FeesManagement"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: "10px" }}>To: </label>
                <input
                  className="btn-dropdown-FeesManagement"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <button
                className="btn-solid"
                style={{ marginBottom: "5px", width: "100px" }}
                onClick={handleFilter}
              >
                Filter
              </button>
            </div>

            {/* --- Attendance Table --- */}
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTdStyle}>Date</th>
                  <th style={thTdStyle}>Status</th>
                  <th style={thTdStyle}>Entry Time</th>
                  <th style={thTdStyle}>Exit Time</th>
                  <th style={thTdStyle}>Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ textAlign: "center", padding: "8px", border: "1px solid #ccc" }}
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  attendanceData.map((att) => {
                    const formattedDate = new Date(att.date).toLocaleDateString("en-GB");
                    return (
                      <tr key={att.id}>
                        <td style={thTdStyle}>{formattedDate}</td>
                        <td style={thTdStyle}>{att.status}</td>
                        <td style={thTdStyle}>{att.entry_time}</td>
                        <td style={thTdStyle}>{att.exit_time}</td>
                        <td style={thTdStyle}>{att.working_hours}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
