import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleRight,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,faDownload, faPrint
} from "@fortawesome/free-solid-svg-icons";
import '../STYLES/tabhower.css'
import '../STYLES/solidbutton.css'
import '../STYLES/externalScroll.css'
// --- NEW IMPORT FOR BACKEND CALLS ---
import axios from 'axios'; 
// --- END NEW IMPORT ---
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,BarChart,Bar,  Label, // ✅ Make sure Label is imported

} from "recharts";
// --- NEW COMPONENT IMPORTS FOR MODAL CONTENT ---
import PayementDemo from "../accountant/AccountantFeesManagementPayement.jsx";
import GenerateBills from "../accountant/Accountant_FeesManagement_Bills.jsx";
import Discount from "../accountant/Accounatant_FeesManagement_Discounts.jsx"; 
// --- END NEW COMPONENT IMPORTS ---
import IncomeForm5 from "./IncomeformTwo.jsx";
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import './Accountant_FeesManagement_income.css'
import ErrorPopup from "./ErrorPopup.jsx";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import PayementDemoDetails from "../accountant/SampleAccountant.jsx";

const API_BASE = 'https://cleezoclass.com:4000/api/admin';
const API_BASE_URL = "https://cleezoclass.com:4000"; 

// --- MODIFIED: Retrieve School Code from localStorage ---
const getSchoolCode = () => {
    // Attempt to retrieve the code from localStorage
    const storedCode = localStorage.getItem('schoolCode'); 
    // Return the stored code, or the hardcoded value as a fallback
    return storedCode || 'TAGSOLNOVALLP';
};
// -

// ----------------------------------------------------------------------
// --- CustomModal Component (MODIFIED to support different content) ---
// ----------------------------------------------------------------------
const CustomModal = ({ isVisible, message, type, onConfirm, onCancel, children, title }) => {
  if (!isVisible) return null;




  return (
<div
  className="income-modal-overlay"
  onClick={onCancel} // clicking the overlay closes modal
>
  <div
    className={`income-modal-content ${type === "content" ? "content" : ""}`}
    onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
  >
    {type === "content" ? (
      <div className="income-modal-inner-content">
        {children}
      </div>
    ) : (
      <>
        <p>{message}</p>

        <div
          className={`income-modal-button-group ${
            type === "confirm" ? "confirm" : ""
          }`}
        >
          {type === "confirm" && (
            <button
              onClick={onCancel}
              className="income-modal-btn cancel"
            >
              Cancel
            </button>
          )}

          <button
            onClick={onConfirm}
            className={`income-modal-btn confirm ${
              type === "confirm" ? "" : "success"
            }`}
          >
            {type === "confirm" ? "Proceed" : "OK"}
          </button>
        </div>
      </>
    )}
  </div>
</div>


  );
};

// ----------------------------------------------------------------------
// --- Generic Card Component (MODIFIED: Removed minHeight) ---
// ----------------------------------------------------------------------
const CustomCard = ({ title, children }) => {
  return (
    <div className="Card-rightContainer">
      <div className="custom-card-header">
        <span className="custom-card-icon" />
        {title}
      </div>
      {children}
    </div>
  );
};

const CustomCardRight = ({ title, children }) => {
  return (
    <div className="custom-card-right">
      {title && (
        <div className="custom-card-right-header">
          <input
            type="radio"
            className="custom-card-radio"
            id={`radio-${title.replace(/\s/g, "-")}`}
            name="section-radio"
            defaultChecked={
              title === "FEES MANAGEMENT" || title === "ACTIONS"
            }
          />
          <label htmlFor={`radio-${title.replace(/\s/g, "-")}`}>
            {title}
          </label>
        </div>
      )}

      {children}
    </div>
  );
};






// ----------------------------------------------------------------------
// --- Section Components (TrackFees, Discounts, Actions, etc.) ---
// ----------------------------------------------------------------------
// Assume schoolCode is handled via localStorage, but it's good practice to define it
const schoolCode = localStorage.getItem("schoolCode"); 

// --- HELPER FUNCTIONS ---

// Helper function assumed to be defined globally or above TrackFees
const getDatesBetween = (startDate, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// Helper function assumed to be defined globally or above TrackFees
const getMonthStringFromFilter = (filter) => {
    const now = new Date();
    let monthIndex;
    let year = now.getFullYear();

    if (filter === "thisMonth") {
        monthIndex = now.getMonth();
    } else if (filter === "lastMonth") {
        monthIndex = now.getMonth() - 1;
        if (monthIndex < 0) {
            monthIndex = 11;
            year--;
        }
    } else {
        // Default to current month if filter is not month-specific
        monthIndex = now.getMonth();
    }

    // JavaScript months are 0-indexed, but ISO month is 1-indexed
    const month = String(monthIndex + 1).padStart(2, '0');
    return `${year}-${month}`;
};

// Placeholder for student options (replace with dynamic data from an API call later)
const studentOptions = [
    { label: "Student A", value: "StudentA" },
    { label: "Student B", value: "StudentB" },
    { label: "Student C", value: "StudentC" },
];

// Accountant_FeesManagement_Income.jsx (TrackFees component)

const TrackFees = ({ isMobile, setShowFeeDetailsPopup, setPopupTitle, setPopupData, setSharedTotals, 
  setSharedUnpaidList, 
  setSharedClassesWithoutFees,font, classSectionList = [], dropdownLoading }) => {
    const [allFees, setAllFees] = useState([]);
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const [fromDate, setFromDate] = useState(firstDayOfMonth);
    const [toDate, setToDate] = useState(lastDayOfMonth);
    const [selectedClassSection, setSelectedClassSection] = useState("All");
    const [selectedStudent, setSelectedStudent] = useState("All");
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [totals, setTotals] = useState({ Paid: 0, Unpaid: 0, loading: true, error: null });
    const [finalPaid, setFinalPaid] = useState(0);
    const [finalUnpaid, setFinalUnpaid] = useState(0);
    const [popupLoading, setPopupLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
useEffect(() => {
    setSharedTotals(totals);
  }, [totals, setSharedTotals]);
    const parseCurrency = (value) => {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;
        const cleanValue = value.replace(/[^\d.]/g, '');
        return parseFloat(cleanValue) || 0;
    };

const applyTimeFilter = useCallback(() => {
    let filteredFees = allFees;

    if (selectedClassSection !== "All" && filteredFees.length > 0) {
        filteredFees = filteredFees.filter(
            item => item.ClassSectionName === selectedClassSection
        );
    }

    if (selectedStudent !== "All" && filteredFees.length > 0) {
        filteredFees = filteredFees.filter(
            item => item.StudentName === selectedStudent
        );
    }

    if (!filteredFees.length) {
        setChartData([]);
        setTotals(prev => ({ ...prev, Paid: 0, Unpaid: 0 }));
        return;
    }

    const groupedData = filteredFees.reduce((acc, item) => {
        const dateKey = item.created_at
            ? item.created_at.split("T")[0]
            : fromDate;

        const expected =
            parseCurrency(item.Admission_fees) +
            parseCurrency(item.Books_Uniform_Expected) +
            parseCurrency(item.Bus_Expected);

        const paid =
            parseCurrency(item.Admission_paid) +
            parseCurrency(item.Books_Uniform_Paid) +
            parseCurrency(item.Bus_Paid);

        const unpaid = Math.max(expected - paid, 0);

        if (expected === 0 && paid === 0) return acc;

        acc[dateKey] = acc[dateKey] || {
            Paid: 0,
            Unpaid: 0,
            displayLabel: ""
        };

        if (!acc[dateKey].displayLabel) {
            acc[dateKey].displayLabel = new Date(dateKey + "T00:00:00")
                .toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }

        acc[dateKey].Paid += paid;
        acc[dateKey].Unpaid += unpaid;

        return acc;
    }, {});

    const calculatedTotals = Object.values(groupedData).reduce(
        (acc, item) => {
            acc.Paid += item.Paid;
            acc.Unpaid += item.Unpaid;
            return acc;
        },
        { Paid: 0, Unpaid: 0 }
    );

    const orderedKeys = [];
    const current = new Date(fromDate + "T00:00:00");
    const end = new Date(toDate + "T00:00:00");

    while (current <= end) {
        orderedKeys.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
    }

    const finalChartData = orderedKeys.map(key => {
        const data = groupedData[key];
        const label = new Date(key + "T00:00:00")
            .toLocaleDateString("en-US", { month: "short", day: "numeric" });

        return {
            label,
            Paid: data?.Paid || 0,
            Unpaid: data?.Unpaid || 0
        };
    });

    setChartData(finalChartData);
    setTotals(prev => ({
        ...prev,
        Paid: calculatedTotals.Paid,
        Unpaid: calculatedTotals.Unpaid
    }));
}, [allFees, fromDate, toDate, selectedClassSection, selectedStudent]);


 const fetchFeeData = async () => {
  console.groupCollapsed("💰 [fetchFeeData] START");
  const startTime = performance.now();

  const schoolCode = localStorage.getItem("schoolCode");
  console.log("📦 schoolCode:", schoolCode);

  if (!schoolCode) {
    console.error("❌ School code missing");
    console.groupEnd();
    return;
  }

  console.log("📅 Filters:", { fromDate, toDate });

  const apiUrl = `${API_BASE_URL}/api/fee-records?type=AllFeesStatusReport&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`;
  console.log("🌐 API URL:", apiUrl);

  // 🔐 Safe number helper
  const num = (v) => Number(v) || 0;

  try {
    setLoading(true);

    console.time("⏱️ API Request");
    const response = await axios.get(apiUrl);
    console.timeEnd("⏱️ API Request");

    const fees = Array.isArray(response.data) ? response.data : [];
    console.log("📊 Records received:", fees.length);

    setAllFees(fees);

    if (fees.length > 0) {
      console.group("🔎 Sample Record");
      console.log(fees[0]);
      console.groupEnd();
    }

    // ==============================
    // 🧮 CORRECT TOTAL CALCULATIONS
    // ==============================
    console.group("🧮 Calculating Totals");

    const totals = fees.reduce(
      (acc, row) => {
        const expected =
          num(row.Admission_fees) +
          num(row.Books_Uniform_Expected) +
          num(row.Bus_Expected);

        const paid =
          num(row.Admission_paid) +
          num(row.Books_Uniform_Paid) +
          num(row.Bus_Paid);

        acc.expected += expected;
        acc.paid += paid;
        acc.unpaid += Math.max(expected - paid, 0); // 🔒 never negative

        return acc;
      },
      { expected: 0, paid: 0, unpaid: 0 }
    );

    console.log("✅ FINAL TOTALS");
    console.log("• Total Expected:", totals.expected);
    console.log("• Total Paid:", totals.paid);
    console.log("• Total Unpaid:", totals.unpaid);

    console.groupEnd();

    setFinalPaid(totals.paid);
    setFinalUnpaid(totals.unpaid);

  } catch (err) {
    console.group("❌ API ERROR");
    console.error(err);
    console.groupEnd();
  } finally {
    setLoading(false);
    console.log(`🏁 Finished in ${(performance.now() - startTime).toFixed(2)} ms`);
    console.groupEnd();
  }
};


    const closeFeeDetailsPopup = () => {
        setShowFeeDetailsPopup(false);
        setPopupTitle("");
        setPopupData([]);
    };

const handleView = async (type) => {
  const schoolCode = localStorage.getItem("schoolCode");

  if (!schoolCode) {
    setPopupMessage("School code not available. Cannot fetch data.");
    return;
  }

  setPopupLoading(true);
  setShowFeeDetailsPopup(true);
  setPopupTitle("Loading...");
  setPopupData([]);

  const displayDateRange = `${fromDate} to ${toDate}`;

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/fee-records`,
      {
        params: {
          type,
          fromDate,
          toDate,
          schoolCode
        }
      }
    );

    const data = Array.isArray(response.data) ? response.data : [];

    // 🏷️ Popup titles
    let title = "Fee Details";

    if (type.includes("Unpaid")) {
      title = "Highly Unpaid Students List";
    } else if (type === "TotalPaidList") {
      title = `Students with Paid List(${displayDateRange})`;
    } else if (type === "TotalDueList") {
      title = `Students with Pending Dues (${displayDateRange})`;
    } else if (type.includes("AllFeesStatusReport")) {
      title = `Comprehensive Fee Status (${displayDateRange})`;
    }

    setPopupTitle(title);
    setPopupData(data.length ? data : [{ info: "No records found." }]);

  } catch (err) {
    console.error(`❌ Error fetching ${type}:`, err);
    setPopupTitle("Error");
    setPopupData([{ info: "Failed to load data from server." }]);
  } finally {
    setPopupLoading(false);
  }
};

const handleSendToChief = async () => {
  const schoolCode = localStorage.getItem("schoolCode");

  try {
    setPopupLoading(true);

    const response = await axios.get(
      `${API_BASE_URL}/api/fee-records?type=TotalDueList&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
    );

    const records = response.data;

    if (!records.length) {
      setPopupMessage("No data to send");
      return;
    }

    await axios.post(`https://cleezoclass.com:4000/chief/fee-report-to-superAdmin`, {
      schoolCode,
      reportType: "TotalDueList",
      fromDate,
      toDate,
      records
    });

    setPopupMessage("Sent successfully to Chief Dashboard!");
  } catch (err) {
    console.error(err);
    setPopupMessage("Failed to send to Chief Dashboard");
  } finally {
    setPopupLoading(false);
  }
};

    useEffect(() => {
        fetchFeeData();
    }, [fromDate, toDate]);
// Inside TrackFees component
const [unpaidList, setUnpaidList] = useState([]);
const [classesWithoutFees, setClassesWithoutFees] = useState([]);

// Fetch unpaid list
const fetchUnpaidList = async () => {
  const schoolCode = localStorage.getItem("schoolCode");
  
  // Log the initiation of the request and the parameters being used
  console.log(`[FetchUnpaidList] Initiating fetch for School: ${schoolCode}, Range: ${fromDate} to ${toDate}`);

  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/fee-records?type=TotalDueList&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
    );

    // Log the successful response and the number of records received
    console.log(`[FetchUnpaidList] Success=======================: Received ${response.data.length} records`);
    
    // Update local state
    setUnpaidList(response.data);
    
    // Log the data being pushed to the shared/parent state
    console.log("[FetchUnpaidList] Updating shared state for Actions component...");
    setSharedUnpaidList(response.data);

  } catch (err) {
    // Enhanced error logging
    console.error("[FetchUnpaidList] Error fetching unpaid list:", {
      message: err.message,
      status: err.response?.status,
      config: err.config?.url
    });
  }
};

// Fetch classes without fees
const fetchClassesWithoutFees = async () => {
  const schoolCode = localStorage.getItem("schoolCode");
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/fee-records?type=ClassesWithoutFees&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
    );
    setClassesWithoutFees(response.data);
  } catch (err) {
    console.error("Error fetching classes without fees:", err);
  }
};

// Call these functions in useEffect
useEffect(() => {
  fetchUnpaidList();
  fetchClassesWithoutFees();
}, [fromDate, toDate]);

    useEffect(() => {
        applyTimeFilter();
    }, [applyTimeFilter, allFees, selectedClassSection, selectedStudent, classSectionList]);
const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

    return (
        <div className={`track-container ${isMobile ? "track-container-mobile" : ""}`}>
            <div className="track-card">
             
                <div style={{ display: "flex", flexDirection: "row", width: "100%", gap: "20px" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div className={`track-chart-container ${isMobile ? "track-chart-container-mobile" : ""}`}>
                            <ResponsiveContainer>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="label" fontSize={isMobile ? 10 : 12} />
                                    <YAxis fontSize={isMobile ? 10 : 12} />
                                    <Tooltip />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                    <Bar dataKey="Paid" fill="rgb(146,208,155)" barSize={isMobile ? 12 : 20} />
                                    <Bar dataKey="Unpaid" fill="rgb(229,155,115)" barSize={isMobile ? 12 : 20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className={`track-totals ${isMobile ? "track-totals-mobile" : ""}`}>
                           <div className="track-totals-row">
  <span className="track-totals-paid">
    {formatINR(totals?.Paid)}
  </span>

  <span className="track-totals-unpaid">
    {formatINR(totals?.Unpaid)}
  </span>
</div>

                        </div>
                        <div className="track-view-list-buttons">
                            <button onClick={() => handleView("TotalPaidList")} className="track-view-list-btn">View List</button>
                            <button onClick={() => handleView("TotalDueList")} className="track-view-list-btn">View List</button>
                        </div>
                        <div className="track-send-buttons">
                            <div className="track-send-btn-group">
                                <div className="track-send-btn-label">Send Unpaid</div>
                                <button onClick={() => handleView("TotalDueList")} className="btn-outline track-send-btn">To Class Teacher</button>
                            </div>
                            <div className="track-send-btn-group">
                                <div className="track-send-btn-label">Send Unpaid</div>
<button onClick={handleSendToChief} className="btn-outline track-send-btn">
  To S.A
</button>
                            </div>
                        </div>
                    </div>
                    <div className="track-controls">
                        <div className="track-control-group">
                            <label className="track-control-label">From Date</label>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="btn-dropdown-FeesManagement" />
                        </div>
                        <div className="track-control-group">
                            <label className="track-control-label">To Date</label>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="btn-dropdown-FeesManagement" />
                        </div>
                        <div className="track-control-group">
                            <label className="track-control-label">Class & Sec</label>
                            <select
                                value={selectedClassSection}
                                onChange={(e) => setSelectedClassSection(e.target.value)}
                                className="btn-dropdown-FeesManagement"
                                disabled={dropdownLoading || classSectionList.length === 0}
                            >
                                <option value="All">All</option>
                                {dropdownLoading ? <option disabled>Loading...</option> : classSectionList.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>
                        <div className="track-control-group">
                            <label className="track-control-label">Students</label>
                            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="btn-dropdown-FeesManagement">
                                <option value="All">All</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
                  <ErrorPopup
          message={popupMessage} 
          onClose={() => setPopupMessage("")} 
        /> 
        </div>
    );
};

// FeeDetailsPopup component remains unchanged, but it will now receive a friendly month name
const FeeDetailsPopup = ({ title, data, loading, onClose, selectedMonth, API_BASE }) => {
  if (!title) return null;

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    studentName: "",
    className: "All",
    section: "All",
    fromDate: "",
    toDate: ""
  });

  const [classList, setClassList] = useState([]);
  const [sectionMap, setSectionMap] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const rowsPerPage = 18;

  // -----------------------
  // SPLIT CLASS-SECTION
  // -----------------------
  const splitClassSection = (combined) => {
    if (!combined) return ["", ""];
    const cleaned = String(combined).trim().replace(/\s+/g, "");
    const match = cleaned.match(/^(\d+)([A-Za-z]+)$/);
    return match ? [match[1], match[2].toUpperCase()] : [cleaned, ""];
  };

  // -----------------------
  // FETCH DROPDOWNS
  // -----------------------
// -----------------------
// FETCH DROPDOWNS
// -----------------------
const fetchMetadata = useCallback(async () => {
  setDropdownLoading(true);
  const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";

  try {
    // Fetch classes and sections simultaneously
    const [classRes, sectionRes] = await Promise.all([
      axios.get(`https://cleezoclass.com:4000/api/admin/classes?schoolCode=${schoolCode}`),
      axios.get(`https://cleezoclass.com:4000/api/admin/sectionFilter?schoolCode=${schoolCode}`)
    ]);

    console.log("Classes API response:", classRes.data);
    console.log("Sections API response:", sectionRes.data);

    // --- Sort classes: numeric first, then alphabetically ---
  const sortedClasses = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "LKG", "Nursery", "UKG"];
setClassList(sortedClasses);


    setClassList(sortedClasses);

    // --- Sections ---
    const sectionsArray = Array.isArray(sectionRes.data) ? sectionRes.data : [];
    setSectionMap(sectionsArray);

    // Initially show all sections
    const allSections = sectionsArray.map(s => s.section || s);
    setFilteredSections([...new Set(allSections)]);

  } catch (err) {
    console.error("Error loading dropdowns:", err.message);
    setClassList([]);
    setSectionMap([]);
    setFilteredSections([]);
  } finally {
    setDropdownLoading(false);
  }
}, []);



  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Update filtered sections when class changes
useEffect(() => {
  if (!filters.className || filters.className === "All") {
    // Show all sections if "All Classes" is selected
    setFilteredSections([...new Set(sectionMap.map(s => s.section))]);
    setFilters(prev => ({ ...prev, section: "All" }));
    return;
  }

  // Filter sections for selected class
  const filtered = sectionMap
    .filter(s => String(s.class_name) === String(filters.className)) // ensure string comparison
    .map(s => s.section);

  setFilteredSections([...new Set(filtered)]);
  setFilters(prev => ({ ...prev, section: "All" })); // Reset section
}, [filters.className, sectionMap]);

  // -----------------------
  // HANDLE FILTER CHANGE
  // -----------------------
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset page
  };

  // -----------------------
  // APPLY FILTERS
  // -----------------------
  const filteredData = data.filter(row => {
    if (!row.StudentName) return false;

    // Student Name
    if (filters.studentName && !row.StudentName.toLowerCase().includes(filters.studentName.toLowerCase())) return false;

    // Class
    if (filters.className && filters.className !== "All" && String(row.Class_name) !== String(filters.className)) return false;

    // Section
    if (filters.section && filters.section !== "All" && row.section !== filters.section) return false;

    // Date filter
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      const recordDate = new Date(row.record_date);
      if (recordDate < from) return false;
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      const recordDate = new Date(row.record_date);
      if (recordDate > to) return false;
    }

    return true;
  });

  const dataToDisplay = loading ? [] : filteredData;

  // -----------------------
  // PAGINATION
  // -----------------------
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = dataToDisplay.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(dataToDisplay.length / rowsPerPage);

  const getHeaders = (data) => data.length ? Object.keys(data[0]) : [];
  const headers = getHeaders(dataToDisplay);

  const headerLabels = headers.map(header => {
    if (header === "Class_name") return "Class";
    if (header === "Total_Expected") return "Total Fee";
    return header.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  });

  // -----------------------
  // DOWNLOAD EXCEL
  // -----------------------
const handleDownloadExcel = () => {
  if (!dataToDisplay.length) return;

  const excelData = dataToDisplay.map(row => ({
    "Student Name": row.StudentName || "",
    "Class": row.Class_name || "",
    "Section": row.section || "",
    "Admission Paid": row.Admission_paid || 0,
    "Admission Due": row.Admission_Due || 0,
    "Exam Paid": row.exam_paid || 0,
    "Exam Due": row.Exam_Due || 0,
    "Book Paid": row.books_paid || 0,
    "Book Due": row.Book_Due || 0,
    "Uniform Paid": row.uniform_paid || 0,
    "Uniform Due": row.Uniform_Due || 0,
    "Bus Paid": row.bus_paid || 0,
    "Bus Due": row.Bus_Due || 0,
    "Others Paid": row.others_paid || 0,
    "Others Due": row.Others_Due || 0,
    "Tuition Fee": row.Tuition_Fee || 0,
    "Tuition Paid": row.Tuition_Paid || 0,
    "Tuition Due": row.Tuition_Due || 0,
    "Total Due": row.Total_Due || 0,
    "Record Date": row.record_date ? row.record_date.split("T")[0] : ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Fee Paid & Due Report");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([excelBuffer], { type: "application/octet-stream" }),
    `Fee_Paid_Due_Report_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};


  // -----------------------
  // PRINT TABLE
  // -----------------------
const handlePrint = () => {
  if (!dataToDisplay.length) return;

  const tableRows = dataToDisplay.map(row => `
    <tr>
      <td>${row.StudentName || ""}</td>
      <td>${row.Class_name || ""}</td>
      <td>${row.section || ""}</td>

      <td>${row.Admission_paid || 0}</td>
      <td>${row.Admission_Due || 0}</td>

      <td>${row.exam_paid || 0}</td>
      <td>${row.Exam_Due || 0}</td>

      <td>${row.books_paid || 0}</td>
      <td>${row.Book_Due || 0}</td>

      <td>${row.uniform_paid || 0}</td>
      <td>${row.Uniform_Due || 0}</td>

      <td>${row.bus_paid || 0}</td>
      <td>${row.Bus_Due || 0}</td>

      <td>${row.others_paid || 0}</td>
      <td>${row.Others_Due || 0}</td>

      <td>${row.Tuition_Fee || 0}</td>
      <td>${row.Tuition_Paid || 0}</td>
      <td>${row.Tuition_Due || 0}</td>

      <td>${row.Total_Due || 0}</td>
      <td>${row.record_date ? row.record_date.split("T")[0] : ""}</td>
    </tr>
  `);

  const newWindow = window.open("", "_blank");
  newWindow.document.write(`
    <html>
      <head>
        <title>Fee Paid & Due Report</title>
        <style>
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #000; padding: 4px; text-align: right; }
          th { background-color: #f0f0f0; }
          td:first-child, th:first-child { text-align: left; }
          td:nth-child(2), th:nth-child(2),
          td:nth-child(3), th:nth-child(3) { text-align: center; }
        </style>
      </head>
      <body>
        <h2>Fee Paid & Due Report</h2>
        <table>
          <thead>
            <tr>
              <th>Student Name</th><th>Class</th><th>Section</th>
              <th>Admission Paid</th><th>Admission Due</th>
              <th>Exam Paid</th><th>Exam Due</th>
              <th>Book Paid</th><th>Book Due</th>
              <th>Uniform Paid</th><th>Uniform Due</th>
              <th>Bus Paid</th><th>Bus Due</th>
              <th>Others Paid</th><th>Others Due</th>
              <th>Tuition Fee</th><th>Tuition Paid</th><th>Tuition Due</th>
              <th>Total Due</th><th>Record Date</th>
            </tr>
          </thead>
          <tbody>${tableRows.join("")}</tbody>
        </table>
      </body>
    </html>
  `);
  newWindow.document.close();
  newWindow.print();
};


  // -----------------------
  // RENDER
  // -----------------------
  return (
    <div className="fee-popup-overlay" onClick={onClose}>
      <div className="fee-popup-content-receipt" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="fee-popup-header">
          <h2 className="fee-popup-title">{title}</h2>
          <div className="fees-actions-buttons">
            <button className="actionBtnStyles" onClick={handleDownloadExcel} disabled={loading || dataToDisplay.length === 0}>
              <FontAwesomeIcon icon={faDownload} />
            </button>
            <button className="actionBtnStyles" onClick={handlePrint} disabled={loading || dataToDisplay.length === 0}>
              <FontAwesomeIcon icon={faPrint} />
            </button>
          </div>
          <button className="fee-popup-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* FILTERS */}
        <div className="fee-filters" style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input type="text" placeholder="Student Name" name="studentName" value={filters.studentName} onChange={handleFilterChange} />

          {/* CLASS DROPDOWN */}
{dropdownLoading ? (
  <select disabled>
    <option>Loading Classes...</option>
  </select>
) : (
  <select
    name="className"
    value={filters.className}
    onChange={handleFilterChange}
  >
    <option value="All">All Classes</option>
    {classList.map(cls => (
      <option key={cls} value={cls}>{cls}</option>
    ))}
  </select>
)}


          {/* SECTION DROPDOWN */}
    <select
  name="section"
  value={filters.section}
  onChange={handleFilterChange}
  disabled={dropdownLoading}
>
  <option value="All">All Sections</option>
  {filteredSections.map(sec => (
    <option key={sec} value={sec}>{sec}</option>
  ))}
</select>

          <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} />
          <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} />
        </div>

        {/* TABLE */}
        {loading ? <p className="fee-popup-message">Loading...</p> :
          dataToDisplay.length === 0 ? <p className="fee-popup-message">No valid records found.</p> :
            <>
              <table className="fee-popup-table">
                <thead>
                  <tr className="fee-popup-thead-row">
                    {headerLabels.map((label, idx) => {
                      const isLeft = ["Class", "Student Name", "Section"].includes(label);
                      return <th key={idx} className={`fee-popup-th ${isLeft ? "align-left" : "align-right"}`}>{label}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "fee-row-even" : "fee-row-odd"}>
                      {headers.map(header => {
                        const label = header === "Class_name" ? "Class"
                                    : header === "StudentName" ? "Student Name"
                                    : header === "section" ? "Section"
                                    : header.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        const isLeft = ["Class", "Student Name", "Section"].includes(label);
                        return <td key={header} className={`fee-popup-td ${isLeft ? "align-left" : "align-right"}`}>{row[header]}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* PAGINATION */}
              <div className="pagination-buttons" style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "5px", alignItems: "center" }}>
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="actionBtnStyles">&#60;</button>
                <span style={{ padding: "0 10px", fontWeight: "bold", minWidth: "40px", textAlign: "center" }}>{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="actionBtnStyles">&#62;</button>
              </div>
            </>
        }
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// --- Collections Component (MODIFIED for single Class-Section dropdown) ---
// ----------------------------------------------------------------------

const Collections = ({
  classSectionList = [],
  dropdownLoading,
  onPayFee,
  onEditBill,
  highlightAddFee,
  setHighlightAddFee,
  selectedClassSection,
  setSelectedClassSection,
  addMissingFeeClass,
}) => {
  const [message, setMessage] = useState("");
  const [feeDetail, setFeeDetail] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const navigate = useNavigate();

  /* ================= SPLIT CLASS-SECTION ================= */
  const splitClassSection = (combined) => {
    if (!combined) return ["", ""];

    const clean = combined.trim();

    if (clean.includes("-")) {
      const [cls, sec] = clean.split("-");
      return [cls.trim(), sec.trim()];
    }

    const match = clean.match(/^([A-Za-z]+|\d+)([A-Za-z])$/);
    if (match) return [match[1], match[2]];

    return [clean, ""];
  };

  /* ================= RESET UI ================= */
  useEffect(() => {
    setHighlightAddFee(false);
    setMessage("");
  }, [selectedClassSection, setHighlightAddFee]);

  /* ================= FETCH FEE DETAILS ================= */
  useEffect(() => {
    if (!selectedClassSection) return;

    const [className, section] = splitClassSection(selectedClassSection);
    const schoolCode = localStorage.getItem("schoolCode");

    axios
      .get("https://cleezoclass.com:4000/api/feeDetailsByClassSection", {
        params: { className, section, schoolCode },
      })
      .then((res) => {
        const detail = res.data?.feeDetail || null;
        setFeeDetail(detail);

        if (!detail || Number(detail.CompleteFee) <= 0) {
          addMissingFeeClass(selectedClassSection);
        }
      })
      .catch((err) => {
        console.error("Fee fetch error:", err);
      });
  }, [selectedClassSection]);

  /* ================= ACTIONS ================= */
  const handlePayFeeClick = () => {
    const [className, section] = splitClassSection(selectedClassSection);
    const completeFee = Number(feeDetail?.CompleteFee) || 0;

    if (completeFee <= 0) {
      setMessage(`Add Fee not updated for ${className}-${section}`);
      setHighlightAddFee(true);
      return;
    }

    onPayFee(className, section);
  };

  const handleEditBillClick = () => {
    const [className, section] = splitClassSection(selectedClassSection);
    onEditBill(className, section);
  };

  /* ================= UI ================= */
  return (
    <div className="collections-wrapper">
      <div className="collections-row">
        <div className="collections-select-wrapper">
          <label>Class-Section</label>

          <select
            className="btn-dropdown-FeesManagement collections-select"
            value={selectedClassSection}
            onChange={(e) => setSelectedClassSection(e.target.value)}
            disabled={dropdownLoading || classSectionList.length === 0}
          >
            <option value="">Select Class-Section</option>

            {[...classSectionList]
              .sort((a, b) => {
                const [cA, sA] = a.split("-");
                const [cB, sB] = b.split("-");

                const nA = parseInt(cA);
                const nB = parseInt(cB);

                if (!isNaN(nA) && !isNaN(nB)) {
                  return nA === nB
                    ? sA.localeCompare(sB)
                    : nA - nB;
                }
                return cA.localeCompare(cB);
              })
              .map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
          </select>
        </div>

        <button
          className={`btn-solid ${
            highlightAddFee ? "collections-disabled" : ""
          }`}
          onClick={handlePayFeeClick}
          disabled={highlightAddFee}
        >
          Pay Fee
        </button>
      </div>

      <div className="collections-message-row">
        <div className="collections-message">
          {message || "\u00A0"}
        </div>

        <button
          className="btn-solid"
          onClick={handleEditBillClick}
          disabled={!selectedClassSection}
        >
          Edit Bill
        </button>
      </div>

      <ErrorPopup
        message={popupMessage}
        onClose={() => setPopupMessage("")}
      />
    </div>
  );
};



const Discounts = ({
  isMobile,
  font,
  classSectionList,
  highlightAddFee,
  dropdownLoading,
  selectedClassSection: propsSelectedClassSection,
  setSelectedClassSection,
  setShowAddFeePopup,
  setShowDiscountPopup
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [showFeePopup, setShowFeePopup] = useState(false);
  const [showSelectClassPopup, setShowSelectClassPopup] = useState(false);
  const [feeMessage, setFeeMessage] = useState("");
  const [selectedClassSection, setLocalSelectedClassSection] = useState(propsSelectedClassSection || "");
  const navigate = useNavigate();
  const isInternalPopupOpen = showPopup || showFeePopup || showSelectClassPopup;
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    if (highlightAddFee && propsSelectedClassSection !== undefined) {
      setLocalSelectedClassSection(propsSelectedClassSection);
    }
  }, [propsSelectedClassSection, highlightAddFee]);

  const splitClassSection = (combined) => {
    if (!combined) return ['', ''];
    const combinedString = String(combined).trim().replace(/\s+/g, "");
    const adjacentMatch = combinedString.match(/^(\d+)([A-Za-z]+)$/);
    if (adjacentMatch) return [adjacentMatch[1], adjacentMatch[2].toUpperCase()];
    const delimiterMatch = combinedString.match(/^(\d+)[\-|]+([A-Za-z]+)$/);
    if (delimiterMatch) return [delimiterMatch[1], delimiterMatch[2].toUpperCase()];
    return [combinedString, ''];
  };

  useEffect(() => {
    if (!showFeePopup) {
      setSelectedClassSection("");
      setLocalSelectedClassSection("");
      setFeeMessage("");
    }
  }, [showFeePopup]);

  return (
    <div className="discount-container">
      <div className={isInternalPopupOpen }>
        <div className="section-header">
                    <span className="dot" />
          <span >Add Fees & Discounts</span>
        </div>

    <div className="collections-row">
      <div className="collections-select-wrapper">
        <label className="collections-label">Class-Section</label>

<select
  className="btn-dropdown-FeesManagement collections-select"
  value={selectedClassSection}
  onChange={(e) => {
    const value = e.target.value;

    console.log("🟢 Dropdown changed:", value);
    console.log("📦 Before local:", selectedClassSection);

    setLocalSelectedClassSection(value);   // ✅ THIS WAS MISSING
    setSelectedClassSection(value);        // parent state

    console.log("📦 After local (async):", value);
  }}
  disabled={dropdownLoading || classSectionList.length === 0}
>
  <option value="">Select Class-Section</option>

  {[...classSectionList]
    .filter(item => item !== "All")
    .sort((a, b) => {
      const [cA, sA] = a.split("-");
      const [cB, sB] = b.split("-");

      const nA = parseInt(cA);
      const nB = parseInt(cB);

      if (!isNaN(nA) && !isNaN(nB)) {
        return nA === nB ? sA.localeCompare(sB) : nA - nB;
      }

      return cA.localeCompare(cB);
    })
    .map((item) => (
      <option key={item} value={item}>
        {item}
      </option>
    ))}
</select>

            <div
              className={`discounts-error ${feeMessage ? "discounts-error-visible" : ""}`}
            >
            </div>
          </div>

          <button
            className="btn-solid"
            onClick={() => {
              if (highlightAddFee) setShowFeePopup(true);
              if (!selectedClassSection) {
                setFeeMessage("Please select Cls-sec.");
                return;
              }
              setShowFeePopup(true);
            }}
          >
            Add Fee
          </button>
        </div>
      </div>

      {showSelectClassPopup && (
        <div className="popup-overlay" onClick={() => setShowSelectClassPopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            Please select a class first!
          </div>
        </div>
      )}

      {showFeePopup && (
        <div className="popup-overlay" onClick={() => setShowFeePopup(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const [selClass, selSection] = splitClassSection(selectedClassSection);
              return <IncomeForm5 selectedClassSection={{ class: selClass, section: selSection }} />;
            })()}
          </div>
        </div>
      )}

      <div className="discounts-list-header">
        <span className="collections-label1">List of discounts:</span>
        <button
          className="btn-solid"
          onClick={() => setShowPopup(true)}
        >
          Create New
        </button>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPopup(false); }}>
          <div className="popup-box1">
            <button className="popup-close-btn" onClick={() => setShowPopup(false)}>X</button>
            <Discount />
          </div>
        </div>
      )}
    </div>
  );
};


const Actions = ({ actions, totals, unpaidList, classesWithoutFees, isMobile ,previousTotals}) => {
  const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

  return (
    <div className="action-container" style={{ padding: '10px' }}>
      {/* 1. Summary Header */}
<div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
  <span style={{ color: "green" }}>
    Paid: {formatINR(totals?.Paid)}
  </span>

  <span style={{ color: "red" }}>
    Due: {formatINR(previousTotals?.unpaid)}
  </span>
</div>

      {/* 2. Critical Alerts: Classes Missing Fees */}
      {classesWithoutFees?.length > 0 && (
        <div className="action-item alert" style={{ backgroundColor: '#fff5f5', padding: '8px', borderRadius: '4px', marginBottom: '10px' }}>
          <strong style={{ fontSize: '12px', color: '#c53030' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} /> MISSING FEE STRUCTURE:
          </strong>
          <div style={{ fontSize: '8px', marginTop: '4px' }}>
            {classesWithoutFees.join(", ")}
          </div>
        </div>
      )}

      {/* 3. Top Unpaid Students (Preview) */}
      <div className="action-item" style={{ marginBottom: '15px' }}>
        <strong style={{ fontSize: '13px' }}>Unpaid Students ({unpaidList?.length || 0})</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '15px', fontSize: '12px', maxHeight: '100px', overflowY: 'auto' }}>
          {unpaidList?.slice(0, 5).map((student, index) => (
            <li key={index} style={{ marginBottom: '2px' }}>
              {student.StudentName} <span style={{ color: '#999' }}>(₹{student.Due_Amount})</span>
            </li>
          ))}
          {unpaidList?.length > 5 && <li style={{ color: '#666', fontStyle: 'italic' }}>+ {unpaidList.length - 5} more...</li>}
        </ul>
      </div>

      {/* 4. Logged Activities (Original Actions) */}
  
    </div>
  );
};


// ----------------------------------------------------------------------
// --- ReportComplain Component (MODIFIED for single Class-Section dropdown) ---
// ----------------------------------------------------------------------
const ReportComplain = ({ isMobile, font, classSectionList, dropdownLoading }) => {
  const [selectedClassSection, setSelectedClassSection] = useState(
    classSectionList.length > 0 ? classSectionList[0] : ""
  );

  const [reportDate, setReportDate] = useState("");
  const [letterType, setLetterType] = useState("EXEMPLIFY");
  const [reportUnpaid, setReportUnpaid] = useState("S.A");
  const [letterFile, setLetterFile] = useState();

  useEffect(() => {
    if (
      classSectionList.length > 0 &&
      !classSectionList.includes(selectedClassSection)
    ) {
      setSelectedClassSection(classSectionList[0]);
    }
  }, [classSectionList, selectedClassSection]);
  const [popupMessage, setPopupMessage] = useState("");

  const sendLetter = async () => {
    if (!reportDate) {
      setPopupMessage("Please select report date.");
      return;
    }

    const schoolCode = localStorage.getItem("schoolCode");

    const formData = new FormData();
    formData.append("schoolCode", schoolCode);
    formData.append("classSection", selectedClassSection);
    formData.append("reportDate", reportDate);
    formData.append("reportType", reportUnpaid);
    formData.append("letterType", letterType);

    if (letterFile) formData.append("letterFile", letterFile);

    try {
      const response = await fetch(
        "https://cleezoclass.com:4000/report/insert-letter",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      setPopupMessage(data.message);
    } catch (error) {
      console.error(error);
      setPopupMessage("Error sending letter.");
    }
  };

  return (
    <div className="reportcomplain-container">
      {/* TITLE */}
      <div className="section-header reportcomplain-header">
        <span className="reportcomplain-circle" />
        Report / Complaint
      </div>

      {/* ROW 1 */}
      <div className="reportcomplain-row">
        <div className="reportcomplain-group">
          <label className="reportcomplain-label">Class-Section</label>
          <select
            className="btn-dropdown-FeesManagement reportcomplain-select"
            value={selectedClassSection}
            onChange={(e) => setSelectedClassSection(e.target.value)}
            disabled={dropdownLoading || classSectionList.length === 0}
          >
            {classSectionList.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="reportcomplain-group">
          <label className="reportcomplain-label">Report Unpaid</label>
          <select
            className="btn-dropdown-FeesManagement reportcomplain-select"
            value={reportUnpaid}
            onChange={(e) => setReportUnpaid(e.target.value)}
          >
            <option value="S.A">S.A</option>
            <option value="UNPAID FEES">Unpaid Fees</option>
            <option value="NOT SUBMITTED">Not Submitted</option>
          </select>
        </div>

        <button className="btn-solid reportcomplain-send-btn">
          Send
        </button>
      </div>

      {/* ROW 2 */}
      <div className="reportcomplain-row">
        <div className="reportcomplain-group">
          <label className="reportcomplain-label">Class - Section</label>
          <select
            className="btn-dropdown-FeesManagement reportcomplain-select"
            value={selectedClassSection}
            onChange={(e) => setSelectedClassSection(e.target.value)}
          >
            {classSectionList.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="reportcomplain-group">
          <label className="reportcomplain-label">Select Letter</label>
          <select
            className="btn-dropdown-FeesManagement reportcomplain-select"
            value={letterType}
            onChange={(e) => setLetterType(e.target.value)}
          >
            <option value="EXEMPLIFY">Exemplicity</option>
            <option value="PERMISSION">Permission</option>
            <option value="WARNING">Warning</option>
            <option value="COMPLAINT">Complaint</option>
            <option value="NOTICE">Notice</option>
          </select>
        </div>
      </div>

      {/* ROW 3 */}
      <div className="reportcomplain-row">
    <div className="reportcomplain-group">
  <label className="reportcomplain-label">Upload Letter</label>

  <input
    type="file"
    id="uploadLetter"
    style={{ display: "none" }}   // 👈 hides default input
    onChange={(e) => setLetterFile(e.target.files[0])}
  />

  <button
    type="button"
    className="btn-dropdown-FeesManagement reportcomplain-upload-btn"
    onClick={() => document.getElementById("uploadLetter").click()}
  >
    Choose File
  </button>
</div>

        <div className="reportcomplain-group">
          <label className="reportcomplain-label">Report Date</label>
          <input
            type="date"
            className="btn-dropdown-FeesManagement reportcomplain-select"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
        </div>

        <button
          className="btn-solid reportcomplain-send-btn"
          onClick={sendLetter}
        >
          Send
        </button>
      </div>
       <ErrorPopup
          message={popupMessage} 
          onClose={() => setPopupMessage("")} 
        /> 
    </div>
    
  );
};






const OtherIncome = ({ isMobile, font }) => {
  const [income, setIncome] = useState({
    total_investment: 0,
    total_other: 0,
    total_donation: 0,
    grand_total: 0,
    loading: true,
    error: null,
  });

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [chartData, setChartData] = useState([]);

  const fetchIncome = async (schoolCode, fromDate, toDate) => {
    setIncome((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await axios.get("https://cleezoclass.com:4000/api/otherincome/totalsincome", {
        params: {
          schoolCode,
          fromDate: fromDate || "",
          toDate: toDate || "",
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        setIncome({
          ...data,
          loading: false,
          error: null,
        });

        setChartData([
          {
            category: "Investment",
            amount: Number(data.total_investment),
          },
          {
            category: "Other/Discounts",
            amount: Number(data.total_other),
          },
          {
            category: "Donation",
            amount: Number(data.total_donation),
          },
        ]);
      } else {
        throw new Error("Failed to load income data");
      }
    } catch (err) {
      setIncome((prev) => ({
        ...prev,
        loading: false,
        error: err.message,
      }));
      setChartData([]);
    }
  };

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (schoolCode) {
      fetchIncome(schoolCode, fromDate, toDate);
    } else {
      setIncome((prev) => ({ ...prev, loading: false, error: "School code not found" }));
    }
  }, [fromDate, toDate]);

  return (
    <div className="other-income-container">
      {/* DATE FILTERS */}
      <div className="other-income-date-filters">
        {/* Bar Chart */}
        <div className={`other-income-chart-container ${isMobile ? "other-income-chart-container-mobile" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="category" fontSize={isMobile ? 10 : 12} />
              <YAxis fontSize={isMobile ? 10 : 12} />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Bar dataKey="amount" fill="#945f4aff" barSize={isMobile ? 20 : 30}>
                <Label
                  position="top"
                  formatter={() =>
                    `₹${(
                      Number(income.total_investment) +
                      Number(income.total_other) +
                      Number(income.total_donation)
                    ).toFixed(2)}`
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Date Inputs */}
        <div className="other-income-date-input-group">
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <input
              type="date"
              className="btn-dropdown-FeesManagement other-income-date-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            <input
              type="date"
              className="btn-dropdown-FeesManagement other-income-date-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TOTAL OTHER INCOME */}
      <div className="other-income-total">
        <div>
          <label className="fees-item-amount1">
            ₹
            {(
              Number(income.total_investment) +
              Number(income.total_other) +
              Number(income.total_donation)
            ).toFixed(2)}
          </label>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="other-income-buttons">
        <button className="btn-solid other-income-btn">List Of Oi</button>
        <button className="btn-solid other-income-btn">Edit/Delete</button>
        <button className="btn-solid other-income-btn">Update SA</button>
        <button className="btn-solid other-income-btn">Add New</button>
      </div>
    </div>
  );
};



const RemindersCutoff = ({ isMobile, font, classSectionList, dropdownLoading }) => {
  const [selectedClassSection, setSelectedClassSection] = useState(
    classSectionList.length > 0 ? classSectionList[0] : ""
  );

  const [selectedService, setSelectedService] = useState("");

  useEffect(() => {
    if (
      classSectionList.length > 0 &&
      !classSectionList.includes(selectedClassSection)
    ) {
      setSelectedClassSection(classSectionList[0]);
    }
  }, [classSectionList, selectedClassSection]);

  return (
    <div className="reminders-container">
      <div className="section-header">
        <span className="section-circle" />
        Reminders - Cutoff
      </div>

      <div className="form-wrapper">
        {/* First Row */}
        <div className="form-row">
          <div className="form-group">
            <label className="label-text label-left">Class-Section</label>
            <select
              className="btn-dropdown-FeesManagement dropdown-small margin-left-10"
              value={selectedClassSection}
              onChange={(e) => setSelectedClassSection(e.target.value)}
              disabled={dropdownLoading || classSectionList.length === 0}
            >
              {dropdownLoading ? (
                <option disabled>Loading Classes...</option>
              ) : (
                classSectionList.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="label-text">Unpaid List</label>
            <select
              className="btn-dropdown-FeesManagement dropdown-small"
              defaultValue="V. NANDA"
            >
              <option>V. Nanda</option>
            </select>
          </div>
        </div>

        {/* Second Row */}
        <div className="form-row second">
          <div className="form-group">
            <label className="label-text label-left">Cutoff Service</label>
            <select
              className="btn-dropdown-FeesManagement dropdown-small margin-left-10"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="">Select Service</option>
              <option value="CUTOFF_APTS">CUTOFF APTS</option>
              <option value="ASSIST">ASSIST</option>
              <option value="BOTH">CUTOFF APTS, ASSIST</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label-text">Cutoff Dates</label>
            <input
              type="date"
              className="btn-dropdown-FeesManagement dropdown-small"
            />
          </div>

          <div className="form-group">
            <button className="btn-solid cutoff-button">
              Cutoff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviousRecords = ({ isMobile, font, classSectionList = [], dropdownLoading ,  setPreviousTotals
}) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedClassSection, setSelectedClassSection] = useState(
    classSectionList.length > 0 ? classSectionList[0] : ""
  );

  const [totalPaid, setTotalPaid] = useState(0);
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [paidList, setPaidList] = useState([]);
  const [unpaidList, setUnpaidList] = useState([]);

  const [showPaidPopup, setShowPaidPopup] = useState(false);
  const [showUnpaidPopup, setShowUnpaidPopup] = useState(false);

  const [chartData, setChartData] = useState([]);

  // Helper
  const getClassSection = () => {
    if (!selectedClassSection) return { className: "ALL", section: "ALL" };
    if (selectedClassSection.includes("-")) {
      const [className, section] = selectedClassSection.split("-");
      return { className, section };
    }
    const className = selectedClassSection.slice(0, -1);
    const section = selectedClassSection.slice(-1);
    return { className, section };
  };

  // ================= FETCH SUMMARY =================
const handleFetchSummary = async () => {
  const { className, section } = getClassSection();
  const schoolCode = localStorage.getItem("schoolCode");

  const url = `https://cleezoclass.com:4000/api/summary?schoolCode=${schoolCode}&fromDate=${fromDate || ""}&toDate=${toDate || ""}&className=${className}&section=${section}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const paid = data.totalPaid || 0;
    const unpaid = data.totalUnpaid || 0;

    setTotalPaid(paid);
    setTotalUnpaid(unpaid);

    // 🔥 SEND TO ACTIONS
    setPreviousTotals({
      paid,
      unpaid
    });

  } catch (err) {
    console.error(err);
    setTotalPaid(0);
    setTotalUnpaid(0);

    setPreviousTotals({
      paid: 0,
      unpaid: 0
    });
  }
};


  // ================= FETCH PAID =================
  const fetchPaidList = async () => {
    const { className, section } = getClassSection();
    const schoolCode = localStorage.getItem("schoolCode");

    const url = `https://cleezoclass.com:4000/api/paid-list?schoolCode=${schoolCode}&fromDate=${fromDate || ""}&toDate=${toDate || ""}&className=${className}&section=${section}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setPaidList(data);
      setShowPaidPopup(true);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= FETCH UNPAID =================
  const fetchUnpaidList = async () => {
    const { className, section } = getClassSection();
    const schoolCode = localStorage.getItem("schoolCode");

    const url = `https://cleezoclass.com:4000/api/unpaid-list?schoolCode=${schoolCode}&fromDate=${fromDate || ""}&toDate=${toDate || ""}&className=${className}&section=${section}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setUnpaidList(data);
      setShowUnpaidPopup(true);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= COPY PAID =================
  const copyPaid = () => {
    let text = paidList
      .map((p) => `${p.StudentName} - ₹${p.Paid_Amount}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setPopupMessage("Copied paid list!");
  };

  // ================= ROUND OFF =================
  const roundOffUnpaid = () => {
    let total = unpaidList.reduce((acc, item) => acc + item.unpaidAmount, 0);
    setPopupMessage(`Rounded Unpaid Amount: ₹ ${Math.round(total)}`);
  };

  // ================= FETCH CHART DATA =================
  const fetchChartData = async () => {
    const { className, section } = getClassSection();
    const schoolCode = localStorage.getItem("schoolCode");

    const url = `https://cleezoclass.com:4000/api/summary-daily?schoolCode=${schoolCode}&fromDate=${fromDate || ""}&toDate=${toDate || ""}&className=${className}&section=${section}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      const mappedData =
        data.length > 0
          ? data.map((item) => ({
              label: item.date || "N/A",
              Paid: item.paid || 0,
              Unpaid: item.unpaid || 0,
            }))
          : [{ label: "No Data", Paid: 0, Unpaid: 0 }];

      setChartData(mappedData);
    } catch (err) {
      console.error(err);
      setChartData([{ label: "No Data", Paid: 0, Unpaid: 0 }]);
    }
  };

  // ================= AUTO FETCH =================
  useEffect(() => {
    handleFetchSummary();
    fetchChartData();
  }, [fromDate, toDate, selectedClassSection]);

  // ================= POPUP =================
  const Popup = ({ title, list, onClose, isPaid }) => {
    return (
      <div className="previousrecord-popup-overlay" onClick={onClose}>
        <div
          className="previousrecord-popup"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="previousrecord-popup-title">{title}</h3>

          <div style={{ overflowX: "auto" }}>
            <table className="previousrecord-table">
              <thead>
                <tr>
                  <th className="previousrecord-th">Student</th>
                  <th className="previousrecord-th">
                    {isPaid ? "Paid" : "Unpaid"}
                  </th>
                  <th className="previousrecord-th">Class</th>
                  <th className="previousrecord-th">Section</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, idx) => (
                  <tr
                    key={idx}
                    className={
                      idx % 2 === 0
                        ? "previousrecord-row-even"
                        : "previousrecord-row-odd"
                    }
                  >
                    <td className="previousrecord-td">{item.StudentName}</td>
                    <td className="previousrecord-td">
                      {isPaid
                        ? `₹${item.Paid_Amount}`
                        : `₹${item.unpaidAmount}`}
                    </td>
                    <td className="previousrecord-td">{item.Class_name}</td>
                    <td className="previousrecord-td">{item.Section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="previousrecord-close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="previousrecord-container">
      {/* Graph + Filters */}
      <div className="previousrecord-top">
        {/* Graph */}
        <div
          className="previousrecord-graph"
          style={{ height: isMobile ? 250 : 200 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 20, bottom: 50 }}
            >
              <XAxis dataKey="label" tick={{ fontSize: 14 }} />
              <YAxis tick={{ fontSize: 14 }} />

              <Tooltip
                formatter={(value) => `₹${value}`}
                itemStyle={{ fontSize: 14 }}
                labelStyle={{ fontSize: 14 }}
                contentStyle={{ fontSize: 14 }}
              />

              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: 10 }}
              />

              <Bar
                dataKey="Paid"
                fill="rgb(146,208,155)"
                barSize={isMobile ? 12 : 20}
              />
              <Bar
                dataKey="Unpaid"
                fill="rgb(229,155,115)"
                barSize={isMobile ? 12 : 20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sidebar Filters */}
        <div className="previousrecord-sidebar">
          <div className="previousrecord-filter-group">
            <label className="previousrecord-label">From:</label>
            <input
              type="date"
              className="btn-dropdown-FeesManagement"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="previousrecord-filter-group">
            <label className="previousrecord-label">To:</label>
            <input
              type="date"
              className="btn-dropdown-FeesManagement"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className="previousrecord-filter-group">
            <label className="previousrecord-label">Class - Section:</label>
            <select
              className="btn-dropdown-FeesManagement"
              value={selectedClassSection}
              onChange={(e) => setSelectedClassSection(e.target.value)}
              disabled={dropdownLoading || classSectionList.length === 0}
            >
              {classSectionList.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VALUES */}
      <div className="previousrecord-values">
        <div className="previousrecord-paid">₹ {totalPaid}</div>
        <div className="previousrecord-unpaid">₹ {totalUnpaid}</div>
      </div>

      {/* BUTTONS */}
      <div className="previousrecord-buttons">
        <div className="previousrecord-button-group">
          <button
            className="btn-outline"
            onClick={fetchPaidList}
          >
            View List
          </button>
          <button
            className="btn-solid"
            onClick={copyPaid}
          >
            Copy Paid
          </button>
        </div>

        <div className="previousrecord-button-group">
          <button
            className="btn-outline"
            onClick={fetchUnpaidList}
          >
            View List
          </button>
          <button
            className="btn-solid"
            onClick={roundOffUnpaid}
          >
            Round Off
          </button>
        </div>
      </div>

      {/* POPUPS */}
      {showPaidPopup && (
        <Popup
          title="Paid Students"
          list={paidList}
          isPaid={true}
          onClose={() => setShowPaidPopup(false)}
        />
      )}

      {showUnpaidPopup && (
        <Popup
          title="Unpaid Students"
          list={unpaidList}
          isPaid={false}
          onClose={() => setShowUnpaidPopup(false)}
        />
      )}
    </div>
  );
};


const AccountantFeesIncomeDetails = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";
  const [highlightAddFee, setHighlightAddFee] = useState(false);
  const [selectedClassSection, setSelectedClassSection] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  // SECTION REFS
  const firstSectionRef = useRef(null);
  const secondSectionRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // SECTION VISIBILITY
  const [secondSectionVisible, setSecondSectionVisible] = useState(false);

  // DROPDOWNS
  const [classList, setClassList] = useState([]);
  const [sectionMap, setSectionMap] = useState([]);
  const [classSectionList, setClassSectionList] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // ACTION ITEMS
  const [actionItems] = useState([
    { id: 1, text: "REPORT/COMPLAIN UNPAID LIST SENT TO S.A.", status: "OK" },
    { id: 2, text: "REMINDER CUTOFF V.NANDA 6A", status: "OK" },
    { id: 3, text: "REMINDER CUTOFF V.NANDA 6A", status: "REJECTED" },
    { id: 4, text: "PREVIOUS RECORD – D.SINDIHA 7A", status: "OK" },
  ]);

  // MAIN MODAL
  const [modal, setModal] = useState({
    isVisible: false,
    message: "",
    type: "setPopupMessage",
    onConfirm: () => setModal((prev) => ({ ...prev, isVisible: false })),
  });

  // CONTENT MODAL
  const [contentModal, setContentModal] = useState({
    isVisible: false,
    contentComponent: null,
    title: "",
    className: "",
    sectionName: "",
  });

  const closeModal = () => {
    setContentModal({
      isVisible: false,
      contentComponent: null,
      title: "",
      className: "",
      sectionName: "",
    });
  };

  // SPLIT CLASS-SECTION
  const splitClassSection = (combined) => {
    if (!combined) return ["", ""];
    const cleaned = String(combined).trim().replace(/\s+/g, "");
    const match = cleaned.match(/^(\d+)([A-Za-z]+)$/);
    return match ? [match[1], match[2].toUpperCase()] : [cleaned, ""];
  };

  // FETCH DROPDOWNS
  const fetchMetadata = useCallback(async () => {
    setDropdownLoading(true);
    const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";

    try {
      const [classRes, sectionRes] = await Promise.all([
        axios.get(`${API_BASE}/classes?schoolCode=${schoolCode}`),
        axios.get(`${API_BASE}/sectionFilter?schoolCode=${schoolCode}`),
      ]);

      setClassList(classRes.data || []);
      setSectionMap(sectionRes.data || []);

      // Process classSectionList after fetching data
      const combinedList = sectionRes.data.map((item) => `${item.class_name}-${item.section}`);
      const uniqueCombinedList = [...new Set(combinedList)].sort((a, b) => {
        const classA = a.split("-")[0];
        const classB = b.split("-")[0];
        const numA = parseInt(classA);
        const numB = parseInt(classB);

        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        } else if (!isNaN(numA)) {
          return -1;
        } else if (!isNaN(numB)) {
          return 1;
        } else {
          return classA.localeCompare(classB);
        }
      });

      setClassSectionList(["All", ...uniqueCombinedList]);

    } catch (err) {
      setPopupMessage({
        isVisible: true,
        message: "Error loading dropdowns: " + err.message,
        type: "setPopupMessage",
      });
    } finally {
      setDropdownLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Update filteredSections when selectedClass changes
  useEffect(() => {
    if (!selectedClass || selectedClass === "All") {
      setFilteredSections([]);
      return;
    }

    const sections = sectionMap
      .filter((s) => s.class_name === selectedClass)
      .map((s) => s.section);

    setFilteredSections([...new Set(sections)]);
  }, [selectedClass, sectionMap]);

  // PAYMENT HANDLER
  const handlePayFee = (className, sectionName) => {
    if (!className || !sectionName) {
      return setModal({
        isVisible: true,
        message: "Select a Class-Section before Pay Fee",
        type: "setPopupMessage",
      });
    }

    setContentModal({
      isVisible: true,
      contentComponent: PayementDemoDetails,
      className,
      sectionName,
      title: `Pay Fee – ${className}${sectionName}`,
    });
  };

  // EDIT BILL HANDLER
  const handleEditBill = (sel) => {
    if (!sel || sel === "All") {
      return setModal({
        isVisible: true,
        message: "Select a Class-Section before Edit Bill",
        type: "setPopupMessage",
      });
    }

    const [cls, sec] = splitClassSection(sel);

    setContentModal({
      isVisible: true,
      contentComponent: GenerateBills,
      className: cls,
      sectionName: sec,
      title: `Edit Bill – ${cls}${sec}`,
    });
  };

  // MOBILE RESIZE LISTENER
  useEffect(() => {
    const onResize = () => {
      const isNowMobile = window.innerWidth < 768;
      setIsMobile(isNowMobile);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // SCROLL LOGIC
  const secondSectionVisibleRef = useRef(secondSectionVisible);
  const ignoreScrollHideRef = useRef(false);

  useEffect(() => {
    secondSectionVisibleRef.current = secondSectionVisible;
  }, [secondSectionVisible]);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const handleScroll = () => {
      const y = el.scrollTop;
      if (y > 200 && !secondSectionVisible) {
        setSecondSectionVisible(true);
      }
      if (y < 150 && secondSectionVisible && !ignoreScrollHideRef.current) {
        setSecondSectionVisible(false);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [secondSectionVisible]);

  const scrollToSecondSection = () => {
    if (!secondSectionVisible) {
      setSecondSectionVisible(true);
    }

    ignoreScrollHideRef.current = true;
    setTimeout(() => {
      ignoreScrollHideRef.current = false;
    }, 300);

    requestAnimationFrame(() => {
      if (secondSectionRef.current) {
        secondSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }
    });
  };

  const scrollToTop = () => {
    scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      setSecondSectionVisible(false);
    }, 300);
  };

  // SCROLL ICON
  const ScrollDownIcon = ({ width = 40, height = 60, direction = "down" }) => {
    const rotate = direction === "up" ? "rotate(180deg)" : "rotate(0deg)";
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 64 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: rotate }}
      >
        <rect x="12" y="2" width="40" height="60" rx="20" stroke="#0a3d62" strokeWidth="4" />
        <line x1="32" y1="16" x2="32" y2="32" stroke="#0a3d62" strokeWidth="4" strokeLinecap="round" />
        <polyline points="24,44 32,52 40,44" fill="none" stroke="#0a3d62" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // MODAL STATES
  const [showFeeDetailsPopup, setShowFeeDetailsPopup] = useState(false);
  const [showPayFeeModal, setShowPayFeeModal] = useState(false);
  const [showEditBillModal, setShowEditBillModal] = useState(false);
  const [showFeePopup, setShowFeePopup] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupData, setPopupData] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [dateRange, setDateRange] = useState("");
  const [sharedTotals, setSharedTotals] = useState({ Paid: 0, Unpaid: 0 });
  const [sharedUnpaidList, setSharedUnpaidList] = useState([]);
  const [sharedClassesWithoutFees, setSharedClassesWithoutFees] = useState([]);

  const addMissingFeeClass = (classSec) => {
    setSharedClassesWithoutFees((prev) => (prev.includes(classSec) ? prev : [...prev, classSec]));
  };

  const isAnyModalOpen = showFeeDetailsPopup || showPayFeeModal || showEditBillModal || showFeePopup || showDiscountPopup;
const [previousTotals, setPreviousTotals] = useState({
  paid: 0,
  unpaid: 0
});

  return (
    <>
      <div className={isAnyModalOpen ? "modal-open" : ""}>
        <div ref={scrollAreaRef} className="scroll-area">
          {/* MODALS */}
          <CustomModal
            isVisible={modal.isVisible}
            message={modal.message}
            type={modal.type}
            onConfirm={modal.onConfirm}
          />
          <CustomModal
            isVisible={contentModal.isVisible}
            title={contentModal.title}
            type="content"
            onCancel={closeModal}
          >
            {contentModal.contentComponent && (
              <contentModal.contentComponent
                className={contentModal.className}
                sectionName={contentModal.sectionName}
              />
            )}
          </CustomModal>

          {/* FIRST SECTION */}
          <div ref={firstSectionRef}>
            <div className="footprintsinner">Accountant – Income Fees Management</div>
            <div className={`second-section-grid ${isMobile ? "mobile" : "desktop"}`}>
              <div>
                <CustomCardRight isMobile={isMobile}>
                  <div className="track-left-container">
                    <div className="section-wrapper">
                      <div className="section-header">
                        <span className="dot" />
                        Track Fee
                      </div>
                      <TrackFees
                        isMobile={isMobile}
                        font={font}
                        classSectionList={classSectionList}
                        dropdownLoading={dropdownLoading}
                        setShowFeeDetailsPopup={setShowFeeDetailsPopup}
                        setPopupTitle={setPopupTitle}
                        setPopupData={setPopupData}
                        setPopupLoading={setPopupLoading}
                        setSharedTotals={setSharedTotals}
                        setSharedUnpaidList={setSharedUnpaidList}
                        setSharedClassesWithoutFees={setSharedClassesWithoutFees}
                      />
                    </div>
                    <div className="right-column">
                      <div className="section-wrapper">
                        <Discounts
                          isMobile={isMobile}
                          font={font}
                          highlightAddFee={highlightAddFee}
                          dropdownLoading={dropdownLoading}
                          classSectionList={classSectionList.filter((item) => item !== "All")}
                          selectedClassSection={highlightAddFee ? selectedClassSection : undefined}
                          setSelectedClassSection={(value) => highlightAddFee && setSelectedClassSection(value)}
                          setShowFeePopup={setShowFeePopup}
                          setShowDiscountPopup={setShowDiscountPopup}
                        />
                      </div>
                      <div className="section-wrapper collections-wrapper">
                        <div className="section-header">
                          <span className="dot" />
                          Collections
                        </div>
                        <Collections
                          isMobile={isMobile}
                          font={font}
                          classSectionList={classSectionList.filter((item) => item !== "All")}
                          dropdownLoading={dropdownLoading}
                          onPayFee={handlePayFee}
                          onEditBill={handleEditBill}
                          highlightAddFee={highlightAddFee}
                          setHighlightAddFee={setHighlightAddFee}
                          selectedClassSection={selectedClassSection}
                          setSelectedClassSection={setSelectedClassSection}
                          setShowPayFeeModal={setShowPayFeeModal}
                          addMissingFeeClass={addMissingFeeClass}
                        />
                      </div>
                    </div>
                  </div>
                </CustomCardRight>
              </div>
              <div>
                <CustomCard title="Actions" isMobile={isMobile}>
                  <Actions
                    actions={actionItems}
                    isMobile={isMobile}
                    font={font}
                    totals={sharedTotals}
                    unpaidList={sharedUnpaidList}
                    classesWithoutFees={sharedClassesWithoutFees}
                    addMissingFeeClass={addMissingFeeClass}
                      previousTotals={previousTotals}

                  />
                </CustomCard>
              </div>
            </div>
          </div>

          {/* SECOND SECTION */}
      
          </div>

          {showFeeDetailsPopup && (
            <FeeDetailsPopup
              title={popupTitle}
              data={popupData}
              loading={popupLoading}
              selectedMonth={dateRange}
              onClose={() => setShowFeeDetailsPopup(false)}
            />
          )}
                  <ErrorPopup message={popupMessage} onClose={() => setPopupMessage("")} />

        </div>
    </>
  );
};



export default AccountantFeesIncomeDetails;

