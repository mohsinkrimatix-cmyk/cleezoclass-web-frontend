import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleRight,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
  faDownload,
  faPrint,
  faPlus,
  faTrash,
  faSave,
  faPen
} from "@fortawesome/free-solid-svg-icons";
import '../STYLES/tabhower.css'
import '../STYLES/solidbutton.css'
import '../STYLES/externalScroll.css'
// --- NEW IMPORT FOR BACKEND CALLS ---
import axios from 'axios'; 
// --- END NEW IMPORT ---
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
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
import PayementDemo from "./Accountant_FeesManagement_income_payment.jsx";
import GenerateBills from "./Accountant_FeesManagement_Bills.jsx";
import Discount from "./Accounatant_FeesManagement_Discounts.jsx"; 
// --- END NEW COMPONENT IMPORTS ---
import IncomeForm5 from "../shared/IncomeformTwo.jsx";
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import './Accountant_FeesManagement_income.css'
import ErrorPopup from "../shared/ErrorPopup.jsx";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

    const toNumber = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === "number") return Number.isFinite(value) ? value : 0;
        if (typeof value === "string") return parseCurrency(value);
        if (typeof value?.toString === "function") return parseCurrency(value.toString());
        return 0;
    };

    const getAnyNumber = (row, keys) => {
        for (const key of keys) {
            const v = row?.[key];
            if (v !== undefined && v !== null && String(v).trim() !== "") {
                return toNumber(v);
            }
        }
        return 0;
    };

    const getFeeTotalsForRow = (row) => {
        const expectedDirect = getAnyNumber(row, [
            "CompleteFee",
            "completeFee",
            "Total_Expected",
            "total_expected",
            "TotalFee",
            "total_fee",
            "Total_Fee",
            "Fee_Expected",
            "fee_expected",
        ]);

        const paidDirect = getAnyNumber(row, [
            "Paid_Amount",
            "paid_amount",
            "Total_Paid",
            "totalPaid",
            "TuitionPaid",
        ]);

        const expectedFromParts =
            toNumber(row.Admission_fees) +
            toNumber(row.Books_Uniform_Expected) +
            toNumber(row.Bus_Expected) +
            toNumber(row.TuitionFee) +
            toNumber(row.StudentBooksFee) +
            toNumber(row.StudentExamFee) +
            toNumber(row.Uniform_fees) +
            toNumber(row.Exam_fees) +
            toNumber(row.BusFee) +
            toNumber(row.OtherFee) +
            toNumber(row.ResidentialCompleteFee);

        const paidFromParts =
            toNumber(row.Admission_paid) +
            toNumber(row.Books_Uniform_Paid) +
            toNumber(row.Bus_Paid) +
            toNumber(row.books_paid) +
            toNumber(row.uniform_paid) +
            toNumber(row.exam_paid) +
            toNumber(row.bus_paid) +
            toNumber(row.others_paid);

        const expected = expectedDirect > 0 ? expectedDirect : expectedFromParts;
        const paid = paidDirect > 0 ? paidDirect : paidFromParts;
        let unpaid = Math.max(expected - paid, 0);

        if (expected === 0 && paid === 0) {
            const dueAlt = getAnyNumber(row, [
                "Due_Amount",
                "Total_Due",
                "unpaidAmount",
                "Pending_Amount",
                "Previous_Fee_Due",
                "previous_fee_due",
            ]);
            if (dueAlt > 0) unpaid = dueAlt;
        }

        return { expected, paid, unpaid };
    };

    const buildClassSectionKey = (item) => {
        const cls =
            item?.Class_name ??
            item?.class_name ??
            item?.FeeClass ??
            item?.className ??
            "";
        const sec =
            item?.section ??
            item?.Section ??
            item?.FeeSection ??
            item?.sectionName ??
            "";

        if (cls && sec) {
            return `${String(cls).trim()}-${String(sec).trim()}`;
        }

        return String(item?.ClassSectionName || item?.classSectionName || "").trim();
    };

    const getDateKey = (item) => {
        const rawDate =
            item?.record_date ||
            item?.paidDate ||
            item?.Payment_Date ||
            item?.Bus_Payment_Date ||
            item?.paid_date ||
            item?.created_at;

        if (!rawDate) return null;

        const asString = String(rawDate);
        const directDate = asString.match(/^\d{4}-\d{2}-\d{2}/);
        if (directDate) return directDate[0];

        const dt = new Date(rawDate);
        if (Number.isNaN(dt.getTime())) return null;

        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, "0");
        const d = String(dt.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const studentOptions = useMemo(() => {
        const byClass =
            selectedClassSection === "All"
                ? allFees
                : allFees.filter((item) => buildClassSectionKey(item) === selectedClassSection);

        const uniqueNames = [
            ...new Set(
                byClass
                    .map((item) => String(item?.StudentName || "").trim())
                    .filter(Boolean)
            ),
        ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

        return ["All", ...uniqueNames];
    }, [allFees, selectedClassSection]);

    useEffect(() => {
        if (selectedStudent !== "All" && !studentOptions.includes(selectedStudent)) {
            setSelectedStudent("All");
        }
    }, [selectedStudent, studentOptions]);

const applyTimeFilter = useCallback(() => {
    let filteredFees = allFees;

    if (selectedClassSection !== "All" && filteredFees.length > 0) {
        filteredFees = filteredFees.filter(
            (item) => buildClassSectionKey(item) === selectedClassSection
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
        const dateKey = getDateKey(item) || fromDate;
        if (dateKey < fromDate || dateKey > toDate) return acc;

        const { expected, paid, unpaid } = getFeeTotalsForRow(item);

        if (expected === 0 && paid === 0 && unpaid === 0) return acc;

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
    setSelectedStudent("All");

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
        // const expected =
        //   num(row.Admission_fees) +
        //   num(row.Books_Unifor Accountnat_feesmanagemnetm_Expected) +
        //   num(row.Bus_Expected);

        const { expected, paid, unpaid } = getFeeTotalsForRow(row);

        acc.expected += expected;
        acc.paid += paid;
        acc.unpaid += unpaid; // 🔒 never negative

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
    }, [applyTimeFilter]);
const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

    return (
        <div className={`track-container ${isMobile ? "track-container-mobile" : ""}`}>
                          <div className="section-header" style={{marginTop:'0px'}}>
                    <span className="dot" />
          <span >Track Fees</span>
        </div>
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
                            <label className="collections-label">From Date</label>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="btn-dropdown-FeesManagement" />
                        </div>
                        <div className="track-control-group">
                            <label className="collections-label">To Date</label>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="btn-dropdown-FeesManagement" />
                        </div>
                        <div className="track-control-group">
                            <label className="collections-label">Class & Sec</label>
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
                            <label className="collections-label">Students</label>
                            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="btn-dropdown-FeesManagement">
                                {studentOptions.map((name) => (
                                  <option key={name} value={name}>
                                    {name}
                                  </option>
                                ))}
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

const FeeDetailsPopup = ({ title, data, loading, onClose, API_BASE }) => {
  if (!title) return null;

  const now = new Date();
  const currentFyStart = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const currentFinancialYear = `${currentFyStart}-${currentFyStart + 1}`;

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    studentName: "",
    className: "All",
    section: "All",
    year: currentFinancialYear,
    fromDate: "",
    toDate: "",
  });
const [activeFeeTab, setActiveFeeTab] = useState("all"); 

  const [classList, setClassList] = useState([]);
  const [sectionMap, setSectionMap] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  const [ledgerData, setLedgerData] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [previousData, setPreviousData] = useState([]);
  const [busData, setBusData] = useState([]);
  const [completeFeeData, setCompleteFeeData] = useState([]);

  const [extraLoading, setExtraLoading] = useState(false);
  const [schoolName, setSchoolName] = useState("Loading...");
  const [filterType, setFilterType] = useState("all");
  const [activeView, setActiveView] = useState("main");
  const [editIndex, setEditIndex] = useState(null);
  const [editScope, setEditScope] = useState("");
  const [editData, setEditData] = useState({});
const [studentTransactions, setStudentTransactions] = useState([]);
const [studentTransactionsLoading, setStudentTransactionsLoading] = useState(false);
  const studentTransactionsQueryRef = useRef("");
  const [summaryDue, setSummaryDue] = useState(0);
  const [summaryDueLoading, setSummaryDueLoading] = useState(false);
  const [summaryPreviousDue, setSummaryPreviousDue] = useState(0);
  const [summaryPreviousPaid, setSummaryPreviousPaid] = useState(0);

  const rowsPerPage = 18;

  const getAny = (row, keys, fallback = "") => {
    for (const key of keys) {
      const v = row?.[key];
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return fallback;
  };

  const toAmount = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "object") {
      if (typeof value.toString === "function") {
        return toAmount(value.toString());
      }
      return 0;
    }
    const cleaned = String(value).replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizePreviousItem = (row) => ({
    ...row,
    StudentName: getAny(row, ["StudentName", "student_name", "studentName"], ""),
    Class_name: getAny(row, ["Class_name", "class_name", "className"], ""),
    section: getAny(row, ["section", "Section"], ""),
    Previous_Fee_Due: toAmount(
      getAny(row, [
        "Previous_Fee_Due",
        "Previous_Pending",
        "previous_due",
        "previousDue",
        "previous_fee_due",
      ])
    ),
    Previous_Paid: toAmount(
      getAny(row, ["Previous_Paid", "previous_paid", "previousPaid", "previous_paid_amount"])
    ),
    Due: Math.max(
      toAmount(
        getAny(row, [
          "Previous_Fee_Due",
          "Previous_Pending",
          "previous_due",
          "previousDue",
          "previous_fee_due",
        ])
      ) -
        toAmount(
          getAny(row, ["Previous_Paid", "previous_paid", "previousPaid", "previous_paid_amount"])
        ),
      0
    ),
    Payment_Date: getAny(row, ["Payment_Date", "paidDate", "record_date", "created_at"], ""),
  });

  const normalizeCompleteItem = (row) => {
    const completeFee = toAmount(
      getAny(row, [
        "CompleteFee",
        "completeFee",
        "UpdatedCompleteFee",
        "Final_Amount",
        "complete_fee",
        "TOTAL_FEE",
      ])
    );
    const admissionFee = toAmount(getAny(row, ["Admission_fees", "admission_fees"]));
    const booksFee = toAmount(getAny(row, ["StudentBooksFee", "Book_Fees", "booksFee", "book_fees"]));
    const uniformFee = toAmount(getAny(row, ["Uniform_fees", "uniform_fees"]));
    const examFee = toAmount(getAny(row, ["StudentExamFee", "Exam_fees", "examFee", "exam_fees"]));
    const busFee = toAmount(getAny(row, ["BusFee", "Bus_fees", "busFee", "bus_fees"]));
    const otherFee = toAmount(getAny(row, ["OtherFee", "Others", "otherFee", "others"]));
    const defaultsTotal = admissionFee + booksFee + uniformFee + examFee + busFee + otherFee;
    const derivedTuitionFee = Math.max(completeFee - defaultsTotal, 0);
    const explicitTuitionFee = toAmount(getAny(row, ["TuitionFee", "tuitionFee"]));
    const tuitionPaid = toAmount(getAny(row, ["TuitionPaid", "Paid_Amount", "paid_amount"]));

    return {
      ...row,
      StudentName: getAny(row, ["StudentName", "student_name", "studentName"], ""),
      Class_name: getAny(row, ["Class_name", "class_name", "className"], ""),
      section: getAny(row, ["section", "Section"], ""),
      CompleteFee: completeFee,
      TuitionFee: explicitTuitionFee > 0 ? explicitTuitionFee : derivedTuitionFee,
      TuitionPaid: tuitionPaid,
      StudentBooksFee: booksFee,
      StudentExamFee: examFee,
      BusFee: busFee,
      PreviousDue: toAmount(
        getAny(row, ["PreviousDue", "Previous_Fee_Due", "previousDue", "previous_fee_due"])
      ),
      ResidentialCompleteFee: toAmount(
        getAny(row, ["ResidentialCompleteFee", "residentialCompleteFee", "residential_complete_fee"])
      ),
      OtherFee: otherFee,
      Admission_fees: admissionFee,
      Uniform_fees: uniformFee,
    };
  };

  const getFinancialYearFromDate = (rawDate) => {
    if (!rawDate) return "";
    const dt = new Date(rawDate);
    if (Number.isNaN(dt.getTime())) return "";
    const year = dt.getFullYear();
    const month = dt.getMonth() + 1;
    const startYear = month >= 4 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
  };

  const getFilterDateForRow = (row) => {
    if (activeView === "studentTransactions") {
      return row?.paidDate || "";
    }
    return row?.record_date || row?.paidDate || row?.Payment_Date || row?.Bus_Payment_Date || row?.paid_date || row?.created_at;
  };

  const getRowYear = (row) => {
    const rawDate = getFilterDateForRow(row);
    return getFinancialYearFromDate(rawDate);
  };

  const yearOptions = useMemo(() => {
    const sources = [data, ledgerData, previousData, busData, completeFeeData, studentTransactions];
    const years = new Set();
    sources.forEach((list) => {
      (Array.isArray(list) ? list : []).forEach((row) => {
        const y = getRowYear(row);
        if (y) years.add(y);
      });
    });
    const now = new Date();
    const currentStart = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
    years.add(`${currentStart}-${currentStart + 1}`);
    years.add(`${currentStart - 1}-${currentStart}`);
    years.add(`${currentStart - 2}-${currentStart - 1}`);
    return Array.from(years).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [data, ledgerData, previousData, busData, completeFeeData, studentTransactions, activeView]);

  const isPreviousFinancialYearSelected = useMemo(() => {
    const selectedYear = String(filters.year || "").trim();
    if (!selectedYear || selectedYear === "All") return false;

    if (/^\d{4}\s*-\s*\d{4}$/.test(selectedYear)) {
      const [start, end] = selectedYear.split("-").map((p) => Number(p.trim()));
      return end < currentFyStart + 1;
    }

    return false;
  }, [filters.year, currentFyStart]);

  const isCurrentFinancialYearSelected = filters.year === currentFinancialYear;

  const getStudentTransactionsQueryKey = useCallback(
    (f) =>
      JSON.stringify({
        studentName: f.studentName || "",
        className: f.className || "All",
        section: f.section || "All",
      }),
    []
  );

const handleStudentTransactions = useCallback(async () => {
  setStudentTransactionsLoading(true);
  try {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) throw new Error("School code missing");

    studentTransactionsQueryRef.current = getStudentTransactionsQueryKey(filters);

    const params = new URLSearchParams({
      schoolCode,
      studentName: filters.studentName || "", // allow empty
      className: filters.className || "All",
      section: filters.section || "All",
    });

    const res = await axios.get(
      `https://cleezoclass.com:4000/api/student-transactions?${params.toString()}`
    );

    const result = Array.isArray(res.data) ? res.data : res.data.data || [];

    const aggregatedMap = new Map();
    result.forEach((row) => {
      const student = row?.StudentName || "";
      const cls = row?.Class_name || "";
      const sec = row?.section || "";
      const key = `${student}__${cls}__${sec}`;

      const existing = aggregatedMap.get(key) || {
        ...row,
        Paid_Amount: 0,
        Admission_paid: 0,
        books_paid: 0,
        uniform_paid: 0,
        exam_paid: 0,
        bus_paid: 0,
        others_paid: 0,
        RES_INST_1: 0,
        Previous_Fee_Due: 0,
        Previous_Paid: 0,
        paidDate: "",
        paymentMode: "",
        transaction_id: "",
        receiptNumber: "",
      };

      // Keep fee values from any row (avoid zeroing by later rows)
      existing.CompleteFee = Math.max(Number(existing.CompleteFee) || 0, Number(row.CompleteFee) || 0);
      existing.Admission_fees = Math.max(Number(existing.Admission_fees) || 0, Number(row.Admission_fees) || 0);
      existing.Book_Fees = Math.max(Number(existing.Book_Fees) || 0, Number(row.Book_Fees) || 0);
      existing.Uniform_fees = Math.max(Number(existing.Uniform_fees) || 0, Number(row.Uniform_fees) || 0);
      existing.Exam_fees = Math.max(Number(existing.Exam_fees) || 0, Number(row.Exam_fees) || 0);
      existing.Bus_fees = Math.max(Number(existing.Bus_fees) || 0, Number(row.Bus_fees) || 0);
      existing.Others = Math.max(Number(existing.Others) || 0, Number(row.Others) || 0);
      existing.ResidentialCompleteFee = Math.max(
        Number(existing.ResidentialCompleteFee) || 0,
        Number(row.ResidentialCompleteFee) || 0
      );

      existing.Paid_Amount += Number(row.Paid_Amount) || 0;
      existing.Admission_paid += Number(row.Admission_paid) || 0;
      existing.books_paid += Number(row.books_paid) || 0;
      existing.uniform_paid += Number(row.uniform_paid) || 0;
      existing.exam_paid += Number(row.exam_paid) || 0;
      existing.bus_paid += Number(row.bus_paid) || 0;
      existing.others_paid += Number(row.others_paid) || 0;
      existing.RES_INST_1 += Number(row.RES_INST_1) || 0;
      existing.Previous_Fee_Due += Number(row.Previous_Fee_Due ?? row.PreviousDue) || 0;
      existing.Previous_Paid += Number(row.Previous_Paid) || 0;

      const currentDate = row?.paidDate ? new Date(row.paidDate).getTime() : 0;
      const existingDate = existing.paidDate ? new Date(existing.paidDate).getTime() : 0;
      if (currentDate > existingDate) {
        existing.paidDate = row.paidDate || existing.paidDate;
      }

      aggregatedMap.set(key, existing);
    });

    const aggregated = Array.from(aggregatedMap.values());
    setStudentTransactions(aggregated);
    setActiveView("studentTransactions");
  } catch (err) {
    console.error(err);
    alert("Failed to fetch student transactions");
  } finally {
    setStudentTransactionsLoading(false);
  }
}, [filters, getStudentTransactionsQueryKey]);

  const startAddStudentTransaction = () => {
    const newRow = buildNewStudentTransaction();
    setStudentTransactions((prev) => [newRow, ...prev]);
    setEditScope("studentTransactions");
    setEditIndex(0);
    setEditData({ ...newRow });
  };

  const buildNewStudentTransaction = () => {
    const sample = studentTransactions[0] || {};
    return {
      StudentName: filters.studentName || sample.StudentName || "",
      Class_name: filters.className !== "All" ? filters.className : sample.Class_name || "",
      section: filters.section !== "All" ? filters.section : sample.section || "",
    Paid_Amount: "",
    Admission_paid: "",
    books_paid: "",
    uniform_paid: "",
    exam_paid: "",
    bus_paid: "",
    others_paid: "",
    RES_INST_1: "",
    PreviousDue: "",
    Previous_Paid: "",
    paidDate: "",
    paymentMode: "",
    transaction_id: "",
    receiptNumber: "",
    __isNew: true,
    };
  };

  const createStudentTransaction = async (row) => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) throw new Error("School code missing");
    if (
      !row.StudentName ||
      !row.Class_name ||
      !row.section ||
      row.Class_name === "All" ||
      row.section === "All"
    ) {
      alert("Student Name, Class, and Section are required to add a transaction.");
      throw new Error("Missing required fields");
    }

    const payload = {
      schoolCode,
      studentName: String(row.StudentName).trim(),
      class_name: String(row.Class_name).trim(),
      section: String(row.section).trim(),
      Paid_Amount: Number(row.Paid_Amount) || 0,
      Admission_paid: Number(row.Admission_paid) || 0,
      books_paid: Number(row.books_paid) || 0,
      uniform_paid: Number(row.uniform_paid) || 0,
      exam_paid: Number(row.exam_paid) || 0,
      bus_paid: Number(row.bus_paid) || 0,
      others_paid: Number(row.others_paid) || 0,
      RES_INST_1: Number(row.RES_INST_1) || 0,
      Previous_Fee_Due: Number(row.Previous_Fee_Due ?? row.PreviousDue) || 0,
      Previous_Paid: Number(row.Previous_Paid) || 0,
      paidDate: row.paidDate || null,
      paymentMode: row.paymentMode || null,
      transaction_id: row.transaction_id || null,
      receiptNumber: row.receiptNumber || null,
    };

    console.log("[student-transaction] create payload:", payload);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/studnet-transaction-AddData`,
        payload,
        { params: { schoolCode } }
      );
      return res.data;
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.error || err?.response?.data?.message || err.message;
      console.error("[student-transaction] create failed:", { status, message, data: err?.response?.data });
      throw new Error(message || "Failed to create student transaction");
    }
  };

  const deleteStudentTransaction = async (row) => {
    const rowId = row?.id ?? row?.ID ?? row?.fee_id ?? row?.FeeId;
    if (row.__isNew || !rowId) {
      setStudentTransactions((prev) => prev.filter((r) => r !== row));
      return;
    }
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) throw new Error("School code missing");
    await axios.delete(`${API_BASE_URL}/api/student-transactions/${rowId}`, {
      params: { schoolCode },
      data: { schoolCode },
    });
  };

  // Auto-refresh student transactions when filters change
  useEffect(() => {
    if (activeView !== "studentTransactions") return;
    const queryKey = getStudentTransactionsQueryKey(filters);
    if (studentTransactionsQueryRef.current === queryKey) return;

    const timeoutId = setTimeout(() => {
      handleStudentTransactions();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [activeView, filters.studentName, filters.className, filters.section, handleStudentTransactions, getStudentTransactionsQueryKey]);

  // Reusable filter function
  const applyFilters = (data) => {
    return data.filter((row) => {
      if (!row.StudentName) return false;
      if (filters.studentName && !row.StudentName.toLowerCase().includes(filters.studentName.toLowerCase())) return false;
      if (filters.className !== "All" && String(row.Class_name) !== String(filters.className)) return false;
      if (filters.section !== "All" && row.section !== filters.section) return false;
      // Some reports (like Complete Fee Summary) may not have a date field.
      // In that case, don't drop rows when year filter is selected.
      if (filters.year !== "All") {
        const rowYear = getRowYear(row);
        if (rowYear && rowYear !== filters.year) return false;
      }
      const rowDate = getFilterDateForRow(row);
      if (filters.fromDate && rowDate && new Date(rowDate) < new Date(filters.fromDate)) return false;
      if (filters.toDate && rowDate && new Date(rowDate) > new Date(filters.toDate)) return false;
      return true;
    });
  };

  // Fetch Metadata
  const fetchMetadata = useCallback(async () => {
    setDropdownLoading(true);
    const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";
    try {
      const [classRes, sectionRes] = await Promise.all([
        axios.get(`https://cleezoclass.com:4000/api/admin/classes?schoolCode=${schoolCode}`),
        axios.get(`https://cleezoclass.com:4000/api/admin/sectionFilter?schoolCode=${schoolCode}`),
      ]);

      const classesArray = Array.isArray(classRes.data) ? classRes.data : [];
      setClassList(classesArray);

      const sectionsArray = Array.isArray(sectionRes.data) ? sectionRes.data : [];
      setSectionMap(sectionsArray);
      const allFetchedSections = [...new Set(sectionsArray.map((s) => (s?.section || s || "").trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      setFilteredSections(allFetchedSections);
    } catch (err) {
      // console.error("Error loading dropdowns:", err.message);
      setClassList([]);
      setSectionMap([]);
      setFilteredSections([]);
    } finally {
      setDropdownLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Fetch School Name
  useEffect(() => {
    const currentDbName = localStorage.getItem("schoolCode") || "";
    if (!currentDbName) return;
    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${currentDbName}`)
      .then((res) => res.json())
      .then((data) => {
        const resolvedSchoolName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.schoolName || data?.name,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode: currentDbName,
          fallback: "Unknown School",
        });
        setSchoolName(resolvedSchoolName);
        localStorage.setItem("schoolName", resolvedSchoolName);
        localStorage.setItem("instituteName", resolvedSchoolName);
      })
      .catch((err) => {
        console.error("Error fetching school name:", err);
        const fallbackSchoolName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode: currentDbName,
          fallback: "Unknown School",
        });
        setSchoolName(fallbackSchoolName);
        localStorage.setItem("schoolName", fallbackSchoolName);
        localStorage.setItem("instituteName", fallbackSchoolName);
      });
  }, []);

  // Update Sections when Class Changes
  useEffect(() => {
    if (!filters.className || filters.className === "All") {
      const allFetchedSections = [...new Set(sectionMap.map((s) => (s?.section || s || "").trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      setFilteredSections(allFetchedSections);
      setFilters((prev) => ({ ...prev, section: "All" }));
      return;
    }
    const filtered = sectionMap
      .filter((s) => String(s.class_name) === String(filters.className))
      .map((s) => (s?.section || "").trim())
      .filter(Boolean);
    setFilteredSections([...new Set(filtered)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })));
    setFilters((prev) => ({ ...prev, section: "All" }));
  }, [filters.className, sectionMap]);

  // Filter Data
  const filteredData = applyFilters(data);
  const dataToDisplay = loading ? [] : filteredData;

  const fetchSummaryDue = useCallback(async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    setSummaryDueLoading(true);
    try {
      // Special rule: for 2024-2025, show complete due as SUM(Previous_Fee_Due)
      const selectedYear = String(filters.year || "").replace(/\s+/g, "");
      if (selectedYear === "2024-2025") {
        const prevParams = new URLSearchParams({
          schoolCode,
          type: "PreviousPaidPendingReport",
        });
        const prevRes = await axios.get(
          `https://cleezoclass.com:4000/api/fee-records-alldata?${prevParams.toString()}`
        );
        const prevRows = Array.isArray(prevRes.data) ? prevRes.data : prevRes.data?.data || [];
        const normalizedPrevRows = prevRows.map(normalizePreviousItem);

        const filteredPrevRows = normalizedPrevRows.filter((row) => {
          if (filters.className !== "All" && String(row.Class_name) !== String(filters.className)) return false;
          if (filters.section !== "All" && String(row.section) !== String(filters.section)) return false;
          return true;
        });

        const sumPreviousFeeDue = filteredPrevRows.reduce((sum, row) => {
          return sum + (toAmount(row?.Previous_Fee_Due) || 0);
        }, 0);

        const sumPreviousPaid = filteredPrevRows.reduce((sum, row) => {
          return sum + (toAmount(row?.Previous_Paid) || 0);
        }, 0);

        setSummaryDue(sumPreviousFeeDue);
        setSummaryPreviousDue(sumPreviousFeeDue);
        setSummaryPreviousPaid(sumPreviousPaid);
        return;
      }

      const params = new URLSearchParams({
        schoolCode,
        year: filters.year || "All",
        className: filters.className || "All",
        section: filters.section || "All",
      });
      const res = await axios.get(`https://cleezoclass.com:4000/api/fees-summary-ledgerData?${params.toString()}`);
      setSummaryDue(Number(res?.data?.balance) || 0);
      setSummaryPreviousDue(Number(res?.data?.previousDueTotal) || 0);
      setSummaryPreviousPaid(Number(res?.data?.previousPaidTotal) || 0);
    } catch (err) {
      console.error("Failed to fetch fees summary due:", err);
      setSummaryDue(0);
      setSummaryPreviousDue(0);
      setSummaryPreviousPaid(0);
    } finally {
      setSummaryDueLoading(false);
    }
  }, [filters.year, filters.className, filters.section]);

  useEffect(() => {
    fetchSummaryDue();
  }, [fetchSummaryDue]);

  // Handle Filter Change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Handle Today Ledger
  const handleTodayLedger = async () => {
    setLedgerLoading(true);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");
      const params = new URLSearchParams({ schoolCode, type: "today" });
      const res = await axios.get(`https://cleezoclass.com:4000/api/ledger?${params.toString()}`);
      const rawLedger = Array.isArray(res.data.data) ? res.data.data : [];

      const getReceiptNumber = (value) => {
        const text = String(value || "");
        const digits = text.match(/\d+/g);
        if (!digits) return 0;
        return Number(digits.join("")) || 0;
      };

      const ledger = [...rawLedger].sort((a, b) => {
        const byReceipt = getReceiptNumber(a.receiptNumber) - getReceiptNumber(b.receiptNumber);
        if (byReceipt !== 0) return byReceipt;

        const aDate = new Date(a.paid_date || a.paidDate || a.created_at || 0).getTime();
        const bDate = new Date(b.paid_date || b.paidDate || b.created_at || 0).getTime();
        return aDate - bDate;
      });
      // Merge rows with same receipt number into one record
      const mergedMap = new Map();
      ledger.forEach((row) => {
        const receipt = row.receiptNumber || "";
        const student = row.StudentName || "";
        const cls = row.Class_name || "";
        const sec = row.section || "";
        const dateKey = row.paid_date || row.paidDate || row.created_at || "";
        const key = `${receipt}__${student}__${cls}__${sec}__${dateKey}`;

        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            ...row,
            amount_paid: Number(row.amount_paid || 0),
            fee_type: row.fee_type ? [row.fee_type] : [],
          });
          return;
        }

        const existing = mergedMap.get(key);
        existing.amount_paid = Number(existing.amount_paid || 0) + Number(row.amount_paid || 0);
        if (row.fee_type) {
          const types = new Set(existing.fee_type);
          types.add(row.fee_type);
          existing.fee_type = Array.from(types);
        }
      });

      const mergedLedger = Array.from(mergedMap.values()).map((row) => ({
        ...row,
        fee_type: Array.isArray(row.fee_type) ? row.fee_type.join(", ") : row.fee_type,
      }));

      setLedgerData(mergedLedger);
      setActiveView("ledger");
    } catch (err) {
      console.error(err);
      alert("Failed to fetch today's ledger");
    } finally {
      setLedgerLoading(false);
    }
  };


  // Handle Previous Report
  const handlePreviousReport = async () => {
    setExtraLoading(true);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      const params = new URLSearchParams({ schoolCode, type: "PreviousPaidPendingReport" });
      const res = await axios.get(`https://cleezoclass.com:4000/api/fee-records-alldata?${params}`);
      const result = Array.isArray(res.data) ? res.data : res.data.data || [];
      const normalizedPrevious = result.map(normalizePreviousItem);

      // API can return pending and paid in separate rows for the same student.
      // Aggregate first, then compute net due.
      const groupedMap = new Map();
      normalizedPrevious.forEach((row) => {
        const key = `${row.StudentName || ""}__${row.Class_name || ""}__${row.section || ""}`;
        const existing = groupedMap.get(key) || {
          StudentName: row.StudentName || "",
          Class_name: row.Class_name || "",
          section: row.section || "",
          Previous_Fee_Due: 0,
          Previous_Paid: 0,
          Payment_Date: "",
        };

        existing.Previous_Fee_Due += toAmount(row.Previous_Fee_Due);
        existing.Previous_Paid += toAmount(row.Previous_Paid);

        const currentDate = row.Payment_Date ? new Date(row.Payment_Date).getTime() : 0;
        const existingDate = existing.Payment_Date ? new Date(existing.Payment_Date).getTime() : 0;
        if (currentDate > existingDate) {
          existing.Payment_Date = row.Payment_Date || existing.Payment_Date;
        }

        groupedMap.set(key, existing);
      });

      const aggregatedPrevious = Array.from(groupedMap.values())
        .map((item) => ({
          ...item,
          Due: Math.max(toAmount(item.Previous_Fee_Due) - toAmount(item.Previous_Paid), 0),
        }))
        .filter((item) => item.Due > 0);

      setPreviousData(aggregatedPrevious);
      setActiveView("previous");
    } catch (err) {
      console.error(err);
      alert("Failed to fetch previous report");
    } finally {
      setExtraLoading(false);
    }
  };

  // Handle Bus Report
  const handleBusReport = async () => {
    setExtraLoading(true);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      const params = new URLSearchParams({ schoolCode, type: "BusFeePaymentReport" });
      const res = await axios.get(`https://cleezoclass.com:4000/api/fee-records-alldata?${params}`);
      const result = Array.isArray(res.data) ? res.data : res.data.data || [];

      // Keep one row per student in bus report
      const grouped = new Map();
      result.forEach((row) => {
        const student = row?.StudentName || "";
        const cls = row?.Class_name || "";
        const sec = row?.section || "";
        const key = `${student}__${cls}__${sec}`;

        const busFee = Number(String(row?.Bus_Fee ?? 0).replace(/[^\d.-]/g, "")) || 0;
        const busPaid = Number(String(row?.Bus_Paid ?? 0).replace(/[^\d.-]/g, "")) || 0;
        const residentialAmount = Number(String(row?.Residential_Amount ?? 0).replace(/[^\d.-]/g, "")) || 0;
        const residentialPaid = Number(String(row?.Residential_Paid ?? 0).replace(/[^\d.-]/g, "")) || 0;

        const existing = grouped.get(key) || {
          StudentName: student,
          Class_name: cls,
          section: sec,
          Bus_Fee: 0,
          Bus_Paid: 0,
          Bus_Pending: 0,
          Residential_Amount: 0,
          Residential_Paid: 0,
          Residential_Due: 0,
          Bus_Payment_Date: "",
        };

        // Fee/amount values should not multiply on duplicate transaction rows
        existing.Bus_Fee = Math.max(existing.Bus_Fee, busFee);
        existing.Residential_Amount = Math.max(existing.Residential_Amount, residentialAmount);

        // Paid values can come in multiple rows, so sum them
        existing.Bus_Paid += busPaid;
        existing.Residential_Paid += residentialPaid;

        const currentDate = row?.Bus_Payment_Date ? new Date(row.Bus_Payment_Date).getTime() : 0;
        const existingDate = existing.Bus_Payment_Date ? new Date(existing.Bus_Payment_Date).getTime() : 0;
        if (currentDate > existingDate) {
          existing.Bus_Payment_Date = row.Bus_Payment_Date;
        }

        grouped.set(key, existing);
      });

      const mergedRows = Array.from(grouped.values()).map((item) => ({
        ...item,
        Bus_Pending: Math.max((Number(item.Bus_Fee) || 0) - (Number(item.Bus_Paid) || 0), 0),
        Residential_Due: Math.max(
          (Number(item.Residential_Amount) || 0) - (Number(item.Residential_Paid) || 0),
          0
        ),
      }));

      setBusData(mergedRows);
      setActiveView("bus");
    } catch (err) {
      console.error(err);
      alert("Failed to fetch bus report");
    } finally {
      setExtraLoading(false);
    }
  };
const handleCompleteFeeReport = async () => {
  console.log("🔵 handleCompleteFeeReport function triggered");

  setExtraLoading(true);

  try {
    const schoolCode = localStorage.getItem("schoolCode");
    console.log("🏫 School Code from localStorage:", schoolCode);

    const params = new URLSearchParams({
      schoolCode,
      type: "CompleteFeeSummaryReport",
    });

    const apiUrl = `https://cleezoclass.com:4000/api/fee-records-alldata?${params}`;
    console.log("🌐 API URL:", apiUrl);

    const res = await axios.get(apiUrl);

    console.log("📊 Response Data:", res.data);
console.log("📊 completeFeeData length in UI========================:", completeFeeData.length);
    const result = Array.isArray(res.data) ? res.data : res.data.data || [];

    const normalizedData = result.map(normalizeCompleteItem);
    console.log("🔄 Normalized Data:", normalizedData);

    setCompleteFeeData(normalizedData);

    setActiveView("complete");

  } catch (err) {
    console.error("❌ Error fetching complete fee report:", err);
    alert("Failed to fetch complete fee report");
  } finally {
    setExtraLoading(false);
  }
};
  // Excel Export
  const handleDownloadExcel = () => {
    if (!dataToDisplay.length) return;
    const excelData = dataToDisplay.map((row) => {
      const tuitionFee = toAmount(getAny(row, ["TuitionFee", "Tuition_Fee", "tuitionFee"]));
      const tuitionPaid = toAmount(getAny(row, ["TuitionPaid", "Tuition_Paid", "Paid_Amount", "paid_amount"]));
      const tuitionDue = Math.max(tuitionFee - tuitionPaid, 0);

      return {
        "Student Name": row.StudentName || "",
        Class: row.Class_name || "",
        Section: row.section || "",
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
        "Tuition Fee": tuitionFee,
        "Tuition Paid": tuitionPaid,
        "Tuition Due": tuitionDue,
        "Total Due": row.Total_Due || 0,
        "Record Date": row.record_date ? row.record_date.split("T")[0] : "",
      };
    });
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fee Report");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: "application/octet-stream" }), `Fee_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Print Fee Paid & Due Report
const handlePrint = () => {
  let tableContent = "";
  let tableHeaders = "";
  let tableRows = "";
  let title = "Fee Report";

  const getDateString = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB");
  };

  switch (activeView) {
    case "ledger":
      title = "Today's Ledger";
      tableHeaders = `
        <tr>
          <th>S.No</th>
          <th>Student Name</th>
          <th>Class</th>
          <th>Section</th>
          <th>Receipt No</th>
          <th>Receipt Date</th>
          <th>Academic Year</th>
          <th>Fee Type</th>
          <th>Payment Mode</th>
          <th>Txn ID</th>
          <th>Remarks</th>
          <th>Amount</th>
        </tr>
      `;
      tableRows = ledgerData.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.StudentName}</td>
          <td>${item.Class_name}</td>
          <td class="wrap-cell">${item.section}</td>
          <td>${item.receiptNumber}</td>
          <td>${item.paidDate ? getDateString(item.paidDate) : "-"}</td>
          <td>${item.academic_year || new Date().getFullYear()}</td>
          <td class="${String(item.fee_type || "").includes(",") ? "fee-type-cell" : ""}">${item.fee_type}</td>
          <td>${item.paymentMode}</td>
          <td>${item.transaction_id || "-"}</td>
          <td></td>
          <td>₹ ${item.amount_paid || 0}</td>
        </tr>
      `).join("");
      break;

    case "previous":
      title = "Previous Report";
      tableHeaders = `
        <tr>
          <th>Student</th>
          <th>Class</th>
          <th>Section</th>
          <th>Previous Fee Due</th>
          <th>Previous Paid</th>
          <th>Available Due</th>
          <th>Payment Date</th>
        </tr>
      `;
      tableRows = previousData.map((item) => `
        <tr>
          <td>${item.StudentName}</td>
          <td>${item.Class_name}</td>
          <td>${item.section}</td>
          <td>₹ ${item.Previous_Fee_Due}</td>
          <td>₹ ${item.Previous_Paid}</td>
          <td>₹ ${item.Due}</td>
          <td>${getDateString(item.Payment_Date)}</td>
        </tr>
      `).join("");
      break;

    case "bus":
      title = "Bus Report";
      tableHeaders = `
        <tr>
          <th>Student</th>
          <th>Class</th>
          <th>Section</th>
          <th>Bus Fee</th>
          <th>Bus Paid</th>
          <th>Bus Pending</th>
          <th>Residential Fee</th>
          <th>Residential Paid</th>
          <th>Residential Due</th>
          <th>Payment Date</th>
        </tr>
      `;
      tableRows = busData.map((item) => `
        <tr>
          <td>${item.StudentName}</td>
          <td>${item.Class_name}</td>
          <td>${item.section}</td>
          <td>₹ ${item.Bus_Fee}</td>
          <td>₹ ${item.Bus_Paid}</td>
          <td>₹ ${item.Bus_Pending}</td>
          <td>₹ ${item.Residential_Amount || 0}</td>
          <td>₹ ${item.Residential_Paid || 0}</td>
          <td>₹ ${item.Residential_Due || 0}</td>
          <td>${getDateString(item.Bus_Payment_Date)}</td>
        </tr>
      `).join("");
      break;
case "complete":
  title = "Complete Fee Report";

  tableHeaders = `
    <tr>
      <th>Class</th>
      <th>Section</th>
      <th>Student</th>
      <th>Complete Fee</th>
      <th>Tuition Fee</th>
      <th>Tuition Paid</th>
      <th>Books Fee</th>
      <th>Exam Fee</th>
      <th>Bus Fee</th>
      <th>Previous Due</th>
      <th>Residential Fee</th>
      <th>Other Fee</th>
    </tr>
  `;

  tableRows = completeFeeData.map((item) => `
    <tr>
      <td>${item.Class_name}</td>
      <td>${item.section}</td>
      <td>${item.StudentName}</td>
      <td>₹ ${item.CompleteFee || 0}</td>
      <td>₹ ${item.TuitionFee || 0}</td>
      <td>₹ ${item.TuitionPaid || 0}</td>
      <td>₹ ${item.StudentBooksFee || 0}</td>
      <td>₹ ${item.StudentExamFee || 0}</td>
      <td>₹ ${item.BusFee || 0}</td>
      <td>₹ ${item.PreviousDue || 0}</td>
      <td>₹ ${item.ResidentialCompleteFee || 0}</td>
      <td>₹ ${item.OtherFee || 0}</td>
    </tr>
  `).join("");
  break;
    case "studentTransactions":
      title = "Student Transactions";
      tableHeaders = `
        <tr>
          <th>Student</th>
          <th>Class</th>
          <th>Section</th>
         
          <th>Tuition Paid</th>
          <th>Admission Paid</th>
          <th>Books Paid</th>
          <th>Uniform Paid</th>
          <th>Exam Paid</th>
          <th>Bus Paid</th>
          <th>Others Paid</th>
          <th>RES INST 1 (Paid)</th>
          <th>RES INST 1 DATE</th>
          <th>Payment Date</th>
           <th>Tuition Fee</th>
          <th>Books Fee</th>
          <th>Residential Fee</th>
          <th>Bus Fee</th>
          <th>Receipt No</th>
        </tr>
      `;
      tableRows = studentTransactions.map((item) => `
        <tr>
          <td>${item.StudentName}</td>
          <td>${item.Class_name}</td>
          <td>${item.section}</td>
         
          <td>₹ ${Number(item.Paid_Amount) || 0}</td>
          <td>₹ ${Number(item.Admission_paid) || 0}</td>
          <td>₹ ${Number(item.books_paid) || 0}</td>
          <td>₹ ${Number(item.uniform_paid) || 0}</td>
          <td>₹ ${Number(item.exam_paid) || 0}</td>
          <td>₹ ${Number(item.bus_paid) || 0}</td>
          <td>₹ ${Number(item.others_paid) || 0}</td>
          <td>₹ ${Number(item.RES_INST_1) || 0}</td>
          <td>${getDateString(item.RES_INST_1_DATE)}</td>
          <td>${getDateString(item.paidDate)}</td>
           <td>₹ ${normalizeCompleteItem(item).TuitionFee || 0}</td>
          <td>₹ ${normalizeCompleteItem(item).StudentBooksFee || 0}</td>
          <td>₹ ${normalizeCompleteItem(item).ResidentialCompleteFee || 0}</td>
          <td>₹ ${normalizeCompleteItem(item).BusFee || 0}</td>
          <td>${item.receiptNumber || "-"}</td>
        </tr>
      `).join("");
      break;


    case "main":
    default:
      title = "Fee Paid & Due Report";
      const headers = dataToDisplay.length ? Object.keys(dataToDisplay[0]) : [];
      const headerLabels = headers.map((h) => {
        if (h === "Class_name") return "Class";
        if (h === "StudentName") return "Student Name";
        if (h === "section") return "Section";
        return h.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      });
      tableHeaders = `
        <tr>
          ${headerLabels.map((label) => `<th>${label}</th>`).join("")}
        </tr>
      `;
      tableRows = dataToDisplay.map((row) => `
        <tr>
          ${headers.map((header) => `<td>${row[header] || "-"}</td>`).join("")}
        </tr>
      `).join("");
  }

  const newWindow = window.open("", "_blank");
  newWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: auto; margin: 12mm; }
          body { margin: 0; padding: 0 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed; }
          th, td { border: 1px solid #000; padding: 5px; text-align: right; white-space: nowrap; overflow: clip; text-overflow: clip; }
          .fee-type-cell { white-space: normal; overflow-wrap: anywhere; }
          th { background-color: #f0f0f0; }
          td:first-child, th:first-child { text-align: left; }
          td:nth-child(2), th:nth-child(2),
          td:nth-child(3), th:nth-child(3) { text-align: center; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr { page-break-inside: avoid; }
          .continuation-note {
            text-align: right;
            font-size: 10px;
            font-style: italic;
            color: #444;
            border: none;
            padding-top: 8px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <table>
          <thead>${tableHeaders}</thead>
          <tbody>${tableRows}</tbody>
          <tfoot>
            <tr><td class="continuation-note" colspan="100">Continuation on next page (if any)</td></tr>
          </tfoot>
        </table>
      </body>
    </html>
  `);
  newWindow.document.close();
  newWindow.print();
};


  // Print Today's Ledger
  const handlePrint1 = () => {
    const filteredLedgerData = applyFilters(ledgerData);
    if (!filteredLedgerData.length) return;
    const printTotalPaid = filteredLedgerData.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
    const printTotalCash = filteredLedgerData
      .filter((item) => item.paymentMode?.toLowerCase() === "cash")
      .reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
    const printTotalOnline = filteredLedgerData
      .filter((item) => item.paymentMode?.toLowerCase() !== "cash")
      .reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);

    const tableRows = filteredLedgerData
      .map((item, index) => {
        const rawDate = item.paid_date || item.paidDate || item.created_at;
        const receiptDate = rawDate ? new Date(rawDate).toLocaleDateString() : "-";
        const academicYear =
          item.academic_year ||
          (() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
          })();

        return `
          <tr>
            <td>${index + 1}</td>
            <td class="wrap-cell">${item.StudentName || ""}</td>
            <td>${item.Class_name || ""}</td>
            <td class="wrap-cell">${item.section || ""}</td>
            <td>${item.receiptNumber || "-"}</td>
            <td>${receiptDate}</td>
            <td>${academicYear}</td>
            <td class="${String(item.fee_type || "").includes(",") ? "fee-type-cell" : ""}">${item.fee_type || ""}</td>
            <td>${item.paymentMode || ""}</td>
            <td class="wrap-cell">${item.transaction_id || "-"}</td>
            <td></td>
            <td>₹ ${Number(item.amount_paid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        `;
      })
      .join("");

    const headerHTML = `
      <div style="margin-bottom:10px;">
        <h2 style="text-align:center; font-size:14px; margin:0 0 4px;">${schoolName}</h2>
        <div style="font-size:11px; margin-top:2px; text-align:center;">Fee Day Sheet for Today: ${getDateRange()}</div>
        <div style="font-size:11px; margin-top:2px; text-align:center;">
          Report type of Fee Day Sheet: ${filterType === "all" ? "All Active Transactions" : filterType === "today" ? "Today's Transactions" : filterType === "lastWeek" ? "Last Week Transactions" : "Custom Range Transactions"}
        </div>
        <div style="font-size:10px; margin-top:2px; text-align:center;">
          Report Generated On: ${new Date().toLocaleDateString()}
        </div>
      </div>
    `;
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`
      <html>
        <head>
          <title>Today's Ledger</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0 10px; }
            table { border-collapse: collapse; font-size: 9px; text-align: left; width: 100%; table-layout: fixed; }
            th, td { border: 1px solid #000; padding: 4px; white-space: nowrap; overflow: clip; text-overflow: clip; }
            .fee-type-cell { white-space: normal; overflow-wrap: anywhere; }
            .wrap-cell { white-space: normal; overflow-wrap: anywhere; word-break: break-word; }
            .ledger-table th:nth-child(11),
            .ledger-table td:nth-child(11) { width: 70px; }
            .ledger-table th:nth-child(12),
            .ledger-table td:nth-child(12) { width: 110px; }
            th { background-color: #f0f0f0; }
            td:first-child, th:first-child { text-align: left; }
            td:nth-child(2), th:nth-child(2),
            td:nth-child(3), th:nth-child(3) { text-align: center; }
            .total-label { font-weight: bold; }
            .grand-total-row { font-weight: bold; background-color: #e0e0e0; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            tr { page-break-inside: avoid; }
            .continuation-note {
              text-align: right;
              font-size: 10px;
              font-style: italic;
              color: #444;
              border: none;
              padding-top: 8px;
            }
          </style>
        </head>
        <body>
          ${headerHTML}
          <table class="ledger-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Receipt No</th>
                <th>Receipt Date</th>
                <th>Academic Year</th>
                <th>Fee Type</th>
                <th>Payment Mode</th>
                <th>Txn ID</th>
                <th>Remarks</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total-row">
                <td colspan="11" class="total-label">Total Cash</td>
                <td class="amount-cell">₹ ${printTotalCash.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr class="total-row">
                <td colspan="11" class="total-label">Total Online</td>
                <td class="amount-cell">₹ ${printTotalOnline.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              <tr class="grand-total-row">
                <td colspan="11" class="total-label">Grand Total</td>
                <td class="amount-cell">₹ ${printTotalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td class="continuation-note" colspan="12">Continuation on next page (if any)</td></tr>
            </tfoot>
          </table>
        </body>
      </html>
    `);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
    newWindow.close();
  };

  // Calculate Date Range
  const getDateRange = () => {
    if (ledgerData.length === 0) return "-";
    const dates = ledgerData
      .map((item) => item.paid_date || item.paidDate || item.created_at)
      .filter((date) => date)
      .map((date) => new Date(date));
    if (dates.length === 0) return "-";
    const today = new Date();
    return today.toLocaleDateString();
  };

  // Calculate Totals for Ledger
  const totalPaid = ledgerData.reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  const totalCash = ledgerData.filter((item) => item.paymentMode?.toLowerCase() === "cash").reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);
  const totalOnline = ledgerData.filter((item) => item.paymentMode?.toLowerCase() !== "cash").reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);

  // Pagination Logic
  const getPaginatedData = (data, page, rowsPerPage) => {
    const indexOfLastRow = page * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return data.slice(indexOfFirstRow, indexOfLastRow);
  };

  const handleEditClick = (item, index, scope = "complete") => {
    setEditScope(scope);
    setEditIndex(index);
    setEditData({ ...item });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const handleUpdate = async () => {
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");

      if (editScope === "studentTransactions") {
        try {
          if (editData.__isNew) {
            await createStudentTransaction(editData);
            await handleStudentTransactions();
          } else {
            const res = await fetch(`${API_BASE_URL}/update-complete-feeData`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                schoolCode,
                ...editData,
              }),
            });

            const result = await res.json();
            if (!res.ok || !result.success) {
              throw new Error(result?.message || "Failed to update transaction");
            }

            setStudentTransactions((prev) =>
              prev.map((row, i) => (i === editIndex ? { ...row, ...editData } : row))
            );
          }
        } catch (err) {
          console.error(err);
          alert("Failed to save student transaction");
          return;
        }

        alert("Updated Successfully");
        setEditScope("");
        setEditIndex(null);
        setEditData({});
        return;
      }

      const res = await fetch(`${API_BASE_URL}/update-complete-feeData`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolCode,
          ...editData,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert("Updated Successfully");
        setCompleteFeeData((prev) =>
          prev.map((row, i) => (i === editIndex ? { ...row, ...editData } : row))
        );
        setEditScope("");
        setEditIndex(null);
        setEditData({});
      } else {
        throw new Error(result?.message || "Failed to update data");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update data");
    }
  };

  // Render Table
  const renderTable = () => {
    const filteredLedgerData = applyFilters(ledgerData);
    const filteredPreviousData = applyFilters(previousData);
    const filteredBusData = applyFilters(busData);
    const filteredCompleteFeeData = applyFilters(completeFeeData);

    const filteredStudentTransactions = applyFilters(studentTransactions);
    const paginatedLedgerData = getPaginatedData(filteredLedgerData, currentPage, rowsPerPage);
    const paginatedPreviousData = getPaginatedData(filteredPreviousData, currentPage, rowsPerPage);
    const paginatedBusData = getPaginatedData(filteredBusData, currentPage, rowsPerPage);
    const paginatedCompleteFeeData = getPaginatedData(filteredCompleteFeeData, currentPage, rowsPerPage);
    const paginatedStudentTransactions = getPaginatedData(filteredStudentTransactions, currentPage, rowsPerPage);
    const ledgerTotalPages = Math.max(1, Math.ceil(filteredLedgerData.length / rowsPerPage));
    const isLedgerLastPage = currentPage === ledgerTotalPages;

    const asInputDate = (value) => {
      if (!value) return "";
      const str = String(value);
      const direct = str.match(/^\d{4}-\d{2}-\d{2}/);
      if (direct) return direct[0];
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    switch (activeView) {
      case "ledger":
        return (
          <div>
            <div style={{ padding: "10px 20px", fontWeight: "bold", fontSize: 20 }}>{schoolName}</div>
            <div className="ledger-header" style={{ textAlign: "center", margin: "10px 0" }}>
              <div style={{ fontSize: 14, marginTop: 2 }}>Fee Day Sheet for Today: {getDateRange()}</div>
              <div style={{ fontSize: 14, marginTop: 2 }}>
                Report type of Fee Day Sheet:{" "}
                {filterType === "all"
                  ? "All Active Transactions"
                  : filterType === "today"
                  ? "Today's Transactions"
                  : filterType === "lastWeek"
                  ? "Last Week Transactions"
                  : "Custom Range Transactions"}
              </div>
              <div style={{ fontSize: 12, marginTop: 2 }}>Report Generated On: {new Date().toLocaleDateString()}</div>
            </div>
            <table className="ledger-table" style={{ fontSize: '14' }}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Receipt No</th>
                  <th>Receipt Date</th>
                  <th>Academic Year</th>
                  <th>Fee Type</th>
                  <th>Payment Mode</th>
                  <th>Txn ID</th>
                  <th>Remarks</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLedgerData.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    <td>{item.StudentName}</td>
                    <td>{item.Class_name}</td>
                    <td>{item.section}</td>
                    <td>{item.receiptNumber}</td>
                    <td>
                      {(item.paid_date || item.paidDate || item.created_at)
                        ? new Date(item.paid_date || item.paidDate || item.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {item.academic_year ||
                        (() => {
                          const today = new Date();
                          const year = today.getFullYear();
                          const month = today.getMonth() + 1;
                          return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
                        })()}
                    </td>
                    <td className="fee-type-cell">{item.fee_type}</td>
                    <td>{item.paymentMode}</td>
                    <td>{item.transaction_id || "-"}</td>
                    <td></td>
                    <td>₹ {item.amount_paid || 0}</td>
                  </tr>
                ))}
                {isLedgerLastPage && (
                  <>
                    <tr className="total-row">
                      <td colSpan="11" className="total-label">Total Cash</td>
                      <td className="amount-cell">₹ {totalCash.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="total-row">
                      <td colSpan="11" className="total-label">Total Online</td>
                      <td className="amount-cell">₹ {totalOnline.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="grand-total-row">
                      <td colSpan="11" className="total-label">Grand Total</td>
                      <td className="amount-cell">₹ {totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            <div className="pagination-buttons" style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "5px", alignItems: "center" }}>
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="actionBtnStyles">
                &#60;
              </button>
              <span style={{ padding: "0 10px", fontWeight: "bold", minWidth: "40px", textAlign: "center" }}>
                {currentPage} / {ledgerTotalPages}
              </span>
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, ledgerTotalPages))} disabled={currentPage === ledgerTotalPages} className="actionBtnStyles">
                &#62;
              </button>
            </div>
          </div>
        );

      case "previous":
        return (
          <div>
            <table className="fee-popup-table" style={{ fontSize: "14px" }}>
              <thead>
                <tr className="fee-popup-thead-row">
                  <th className="fee-popup-th">Student</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Previous Fee Due</th>
                  <th>Previous Paid</th>
                  <th>Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPreviousData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.StudentName}</td>
                    <td>{item.Class_name}</td>
                    <td>{item.section}</td>
                    <td>₹ {item.Previous_Fee_Due}</td>
                    <td>₹ {item.Previous_Paid}</td>
                    <td>{item.Payment_Date ? new Date(item.Payment_Date).toLocaleDateString("en-GB") : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination-buttons" style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "5px", alignItems: "center" }}>
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="actionBtnStyles">
                &#60;
              </button>
              <span style={{ padding: "0 10px", fontWeight: "bold", minWidth: "40px", textAlign: "center" }}>
                {currentPage} / {Math.ceil(filteredPreviousData.length / rowsPerPage)}
              </span>
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredPreviousData.length / rowsPerPage)))} disabled={currentPage === Math.ceil(filteredPreviousData.length / rowsPerPage)} className="actionBtnStyles">
                &#62;
              </button>
            </div>
          </div>
        );

      case "bus":
        return (
          <div>
            <table className="fee-popup-table" style={{ fontSize: "14px" }}>
              <thead>
                <tr className="fee-popup-thead-row">
                  <th>Student</th>
                  <th>Class</th>
                  <th>Section</th>
                  <th>Bus Fee</th>
                  <th>Bus Paid</th>
                  <th>Bus Pending</th>
                  <th>Residential Fee</th>
                  <th>Residential Paid</th>
                  <th>Residential Due</th>
                  <th>Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBusData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.StudentName}</td>
                    <td>{item.Class_name}</td>
                    <td>{item.section}</td>
                    <td>₹ {item.Bus_Fee}</td>
                    <td>₹ {item.Bus_Paid}</td>
                    <td>₹ {item.Bus_Pending}</td>
                    <td>₹ {item.Residential_Amount || 0}</td>
                    <td>₹ {item.Residential_Paid || 0}</td>
                    <td>₹ {item.Residential_Due || 0}</td>
                    <td>{item.Bus_Payment_Date ? new Date(item.Bus_Payment_Date).toLocaleDateString("en-GB") : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination-buttons" style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "5px", alignItems: "center" }}>
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="actionBtnStyles">
                &#60;
              </button>
              <span style={{ padding: "0 10px", fontWeight: "bold", minWidth: "40px", textAlign: "center" }}>
                {currentPage} / {Math.ceil(filteredBusData.length / rowsPerPage)}
              </span>
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredBusData.length / rowsPerPage)))} disabled={currentPage === Math.ceil(filteredBusData.length / rowsPerPage)} className="actionBtnStyles">
                &#62;
              </button>
            </div>
          </div>
        );

      case "complete":
        return (
          <div>
            <table className="fee-popup-table" style={{ fontSize: "14px" }}>
              <thead>
                <tr className="fee-popup-thead-row">
                  <th>Class</th>
                  <th>Section</th>
                  <th>Student</th>
                  <th>Complete Fee</th>
                  <th>Tuition Fee</th>
                  <th>Tuition Paid</th>
                  <th>Books Fee</th>
                  <th>Exam Fee</th>
                  <th>Bus Fee</th>
                  <th>Previous Due</th>
                  <th>Residential Fee</th>
                  <th>Other Fee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompleteFeeData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "fee-row-even" : "fee-row-odd"}>
                    <td>{item.Class_name}</td>
                    <td>{item.section}</td>
                    <td>{item.StudentName}</td>
                    <td>
                      {editIndex === index && editScope === "complete" ? (
                        <input
                          name="CompleteFee"
                          value={editData.CompleteFee}
                          onChange={handleEditChange}
                        />
                      ) : (
                        `₹ ${item.CompleteFee || 0}`
                      )}
                    </td>
                    <td>
                      {`₹ ${item.TuitionFee || 0}`}
                    </td>
                    <td>
                      {editIndex === index && editScope === "complete" ? (
                        <input name="TuitionPaid" value={editData.TuitionPaid ?? ""} onChange={handleEditChange} />
                      ) : (
                        `₹ ${item.TuitionPaid || 0}`
                      )}
                    </td>
                    <td>
                      {editIndex === index && editScope === "complete" ? (
                        <input
                          name="StudentBooksFee"
                          value={editData.StudentBooksFee}
                          onChange={handleEditChange}
                        />
                      ) : (
                        `₹ ${item.StudentBooksFee || 0}`
                      )}
                    </td>
                    <td>
                      {editIndex === index && editScope === "complete" ? (
                        <input
                          name="StudentExamFee"
                          value={editData.StudentExamFee}
                          onChange={handleEditChange}
                        />
                      ) : (
                        `₹ ${item.StudentExamFee || 0}`
                      )}
                    </td>
                    <td>
                      {editIndex === index && editScope === "complete" ? (
                        <input name="BusFee" value={editData.BusFee ?? ""} onChange={handleEditChange} />
                      ) : (
                        `₹ ${item.BusFee || 0}`
                      )}
                    </td>
                    <td>
                      {editIndex === index && editScope === "complete" ? (
                        <input name="PreviousDue" value={editData.PreviousDue ?? ""} onChange={handleEditChange} />
                      ) : (
                        `₹ ${item.PreviousDue || 0}`
                      )}
                    </td>
                    <td>
                      {editIndex === index && editScope === "complete" ? (
                        <input name="ResidentialCompleteFee" value={editData.ResidentialCompleteFee ?? ""} onChange={handleEditChange} />
                      ) : (
                        `₹ ${item.ResidentialCompleteFee || 0}`
                      )}
                    </td>
                    <td>
                      {editIndex === index && editScope === "complete" ? (
                        <input name="OtherFee" value={editData.OtherFee ?? ""} onChange={handleEditChange} />
                      ) : (
                        `₹ ${item.OtherFee || 0}`
                      )}
                    </td>
                    <td>
                      {editIndex === index && editScope === "complete" ? (
                        <>
                          <button onClick={handleUpdate}>Save</button>
                          <button onClick={() => { setEditIndex(null); setEditScope(""); }}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => handleEditClick(item, index, "complete")}>Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination-buttons" style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "5px", alignItems: "center" }}>
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="actionBtnStyles">
                &#60;
              </button>
              <span style={{ padding: "0 10px", fontWeight: "bold", minWidth: "40px", textAlign: "center" }}>
                {currentPage} / {Math.ceil(filteredCompleteFeeData.length / rowsPerPage)}
              </span>
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredCompleteFeeData.length / rowsPerPage)))} disabled={currentPage === Math.ceil(filteredCompleteFeeData.length / rowsPerPage)} className="actionBtnStyles">
                &#62;
              </button>
            </div>
          </div>
        );
case "studentTransactions":
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px", gap: "6px" }}>
        <button className="actionBtnStyles addCircleBtn" onClick={startAddStudentTransaction} title="Add Transaction">
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
         {/* Transactions Table */}
      <table className="fee-popup-table" style={{ fontSize: "14px" }}>
        <thead>
          <tr className="fee-popup-thead-row">
            <th>Student</th>
            <th>Class</th>
            <th>Section</th>

            {/* Paid first */}
            <th>Tuition Paid</th>
            <th>Admission Paid</th>
            <th>Books Paid</th>
            <th>Uniform Paid</th>
            <th>Exam Paid</th>
            <th>Bus Paid</th>
            <th>Others Paid</th>
            <th>Residential Paid</th>
            <th>Previous Paid</th>

            {/* Fees after paid */}
            <th>Tuition Fee</th>
            <th>Books Fee</th>
            <th>Residential Fee</th>
            <th>Bus Fee</th>
            <th>Previous Due</th>
                        <th>Paid Date</th>

            <th>Payment Mode</th>
            <th>Txn ID</th>
            <th>Receipt No</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedStudentTransactions.map(
            (item, index) => {
              const AdmissionPaid = Number(item.Admission_paid) || 0;
              const BooksPaid = Number(item.books_paid) || 0;
              const UniformPaid = Number(item.uniform_paid) || 0;
              const ExamPaid = Number(item.exam_paid) || 0;
              const BusPaid = Number(item.bus_paid) || 0;
              const OthersPaid = Number(item.others_paid) || 0;
              const ResInst1 = Number(item.RES_INST_1) || 0;
              const PreviousDue = Number(item.Previous_Fee_Due) || 0;
              const PreviousPaid = Number(item.Previous_Paid) || 0;
              const TuitionPaid = Number(item.Paid_Amount) || 0;
              const normalizedFees = normalizeCompleteItem(item);
              const tuitionFee = Number(normalizedFees.TuitionFee) || 0;
              const bookFee = Number(normalizedFees.StudentBooksFee) || 0;
              const residentialFee = Number(normalizedFees.ResidentialCompleteFee) || 0;
              const busFee = Number(normalizedFees.BusFee) || 0;

              return (
                <tr key={index}>
                  <td>{item.StudentName}</td>
                  <td>{item.Class_name}</td>
                  <td>{item.section}</td>

                  <td>{editIndex === index && editScope === "studentTransactions" ? <input name="Paid_Amount" value={editData.Paid_Amount ?? ""} onChange={handleEditChange} /> : `₹ ${TuitionPaid.toFixed(2)}`}</td>
                  <td>{editIndex === index && editScope === "studentTransactions" ? <input name="Admission_paid" value={editData.Admission_paid ?? ""} onChange={handleEditChange} /> : `₹ ${AdmissionPaid.toFixed(2)}`}</td>
                  <td>{editIndex === index && editScope === "studentTransactions" ? <input name="books_paid" value={editData.books_paid ?? ""} onChange={handleEditChange} /> : `₹ ${BooksPaid.toFixed(2)}`}</td>
                  <td>{editIndex === index && editScope === "studentTransactions" ? <input name="uniform_paid" value={editData.uniform_paid ?? ""} onChange={handleEditChange} /> : `₹ ${UniformPaid.toFixed(2)}`}</td>
                  <td>{editIndex === index && editScope === "studentTransactions" ? <input name="exam_paid" value={editData.exam_paid ?? ""} onChange={handleEditChange} /> : `₹ ${ExamPaid.toFixed(2)}`}</td>
                  <td>{editIndex === index && editScope === "studentTransactions" ? <input name="bus_paid" value={editData.bus_paid ?? ""} onChange={handleEditChange} /> : `₹ ${BusPaid.toFixed(2)}`}</td>
                  <td>{editIndex === index && editScope === "studentTransactions" ? <input name="others_paid" value={editData.others_paid ?? ""} onChange={handleEditChange} /> : `₹ ${OthersPaid.toFixed(2)}`}</td>
                  <td>{editIndex === index && editScope === "studentTransactions" ? <input name="RES_INST_1" value={editData.RES_INST_1 ?? ""} onChange={handleEditChange} /> : `₹ ${ResInst1.toFixed(2)}`}</td>
                  <td>{editIndex === index && editScope === "studentTransactions" ? <input name="Previous_Paid" value={editData.Previous_Paid ?? ""} onChange={handleEditChange} /> : `₹ ${PreviousPaid.toFixed(2)}`}</td>

                  <td>{`₹ ${tuitionFee.toFixed(2)}`}</td>
                  <td>{`₹ ${bookFee.toFixed(2)}`}</td>
                  <td>{`₹ ${residentialFee.toFixed(2)}`}</td>
                  <td>{`₹ ${busFee.toFixed(2)}`}</td>
                  <td>
                    {editIndex === index && editScope === "studentTransactions" ? (
                      <input name="PreviousDue" value={editData.PreviousDue ?? editData.Previous_Fee_Due ?? ""} onChange={handleEditChange} />
                    ) : (
                      `₹ ${PreviousDue.toFixed(2)}`
                    )}
                  </td>
                
                  <td>
                    {editIndex === index && editScope === "studentTransactions" ? (
                      <input type="date" name="paidDate" value={asInputDate(editData.paidDate)} onChange={handleEditChange} />
                    ) : (
                      item.paidDate
                        ? new Date(item.paidDate).toLocaleDateString("en-GB")
                        : ""
                    )}
                  </td>
                  <td>
                    {editIndex === index && editScope === "studentTransactions" ? (
                      <input name="paymentMode" value={editData.paymentMode ?? ""} onChange={handleEditChange} />
                    ) : (
                      item.paymentMode || "-"
                    )}
                  </td>
                  <td>
                    {editIndex === index && editScope === "studentTransactions" ? (
                      <input name="transaction_id" value={editData.transaction_id ?? ""} onChange={handleEditChange} />
                    ) : (
                      item.transaction_id || "-"
                    )}
                  </td>
                  <td>
                    {editIndex === index && editScope === "studentTransactions" ? (
                      <input name="receiptNumber" value={editData.receiptNumber ?? ""} onChange={handleEditChange} />
                    ) : (
                      item.receiptNumber || "-"
                    )}
                  </td>
                  <td>
                    {editIndex === index && editScope === "studentTransactions" ? (
                      <>
                        <button onClick={handleUpdate} className="actionBtnStyles iconOnlyBtn" title="Save">
                          <FontAwesomeIcon icon={faSave} />
                        </button>
                        <button
                          onClick={() => {
                            if (item.__isNew) {
                              setStudentTransactions((prev) => prev.filter((r) => r !== item));
                            }
                            setEditIndex(null);
                            setEditScope("");
                            setEditData({});
                          }}
                          className="actionBtnStyles iconOnlyBtn"
                          title="Cancel"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteStudentTransaction(item);
                              await handleStudentTransactions();
                            } catch (err) {
                              console.error(err);
                              alert("Failed to delete transaction");
                            }
                          }}
                          className="actionBtnStyles iconOnlyBtn"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditClick(item, index, "studentTransactions")} className="actionBtnStyles iconOnlyBtn" title="Edit">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteStudentTransaction(item);
                              await handleStudentTransactions();
                            } catch (err) {
                              console.error(err);
                              alert("Failed to delete transaction");
                            }
                          }}
                          className="actionBtnStyles iconOnlyBtn"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>

      <div className="pagination-buttons" style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "5px", alignItems: "center" }}>
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="actionBtnStyles">
          &#60;
        </button>
        <span style={{ padding: "0 10px", fontWeight: "bold", minWidth: "40px", textAlign: "center" }}>
          {currentPage} / {Math.ceil(filteredStudentTransactions.length / rowsPerPage)}
        </span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredStudentTransactions.length / rowsPerPage)))} disabled={currentPage === Math.ceil(filteredStudentTransactions.length / rowsPerPage)} className="actionBtnStyles">
          &#62;
        </button>
      </div>
    </div>
  );

      case "main":
      default:
        const paginatedMainData = getPaginatedData(dataToDisplay, currentPage, rowsPerPage);
        const headers = dataToDisplay.length ? Object.keys(dataToDisplay[0]) : [];
        const headerLabels = headers.map((h) => {
          if (h === "Class_name") return "Class";
          if (h === "Total_Expected") return "Total Fee";
          return h.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        });

        return (
          <div>
            <table className="fee-popup-table">
              <thead>
                <tr className="fee-popup-thead-row">
                  {headerLabels.map((label, idx) => {
                    const isLeft = ["Class", "Student Name", "Section"].includes(label);
                    return (
                      <th key={idx} className={`fee-popup-th ${isLeft ? "align-left" : "align-right"}`}>
                        {label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedMainData.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "fee-row-even" : "fee-row-odd"}>
                    {headers.map((header) => {
                      const label = header === "Class_name" ? "Class" : header === "StudentName" ? "Student Name" : header === "section" ? "Section" : header.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                      const isLeft = ["Class", "Student Name", "Section"].includes(label);
                      return (
                        <td key={header} className={`fee-popup-td ${isLeft ? "align-left" : "align-right"}`}>
                          {typeof row[header] === "object" && row[header] !== null ? "-" : row[header]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination-buttons" style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", gap: "5px", alignItems: "center" }}>
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="actionBtnStyles">
                &#60;
              </button>
              <span style={{ padding: "0 10px", fontWeight: "bold", minWidth: "40px", textAlign: "center" }}>
                {currentPage} / {Math.ceil(dataToDisplay.length / rowsPerPage)}
              </span>
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(dataToDisplay.length / rowsPerPage)))} disabled={currentPage === Math.ceil(dataToDisplay.length / rowsPerPage)} className="actionBtnStyles">
                &#62;
              </button>
            </div>
          </div>
        );
    }
  };

return (
  <div className="fee-popup-overlay" onClick={onClose}>
    <div
      className="fee-popup-content-receipt"
      onClick={(e) => e.stopPropagation()}
      style={{ width: "95vw", margin: "0 auto" }}
    >
      {/* HEADER */}
      <div
        className="fee-popup-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            className="actionBtnStyles"
            onClick={handleDownloadExcel}
            disabled={loading || dataToDisplay.length === 0}
            title="Download Excel"
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
          {activeView !== "ledger" && (
            <button
              className="actionBtnStyles"
              onClick={handlePrint}
              disabled={loading || dataToDisplay.length === 0}
              title="Print Fee Paid & Due"
            >
              <FontAwesomeIcon icon={faPrint} />
            </button>
          )}
          <button
            className="actionBtnStyles"
            onClick={handlePrint1}
            disabled={ledgerLoading || ledgerData.length === 0}
            title="Print Today's Ledger"
          >
            <FontAwesomeIcon icon={faPrint} />
          </button>
        </div>
        <button className="fee-popup-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* FILTERS */}
      <div
        className="fee-filters"
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "1px",
          alignItems: "center",
          flexWrap: "wrap",
          height:'200px'
        }}
      >
        <input
          type="text"
          className="btn-outline"
          placeholder="Student Name"
          name="studentName"
          value={filters.studentName}
          onChange={handleFilterChange}
          style={{ width: "100px", flex: "1" }}
        />
        {dropdownLoading ? (
          <select disabled style={{ width: "100px", flex: "1" }}>
            <option>Loading Classes...</option>
          </select>
        ) : (
          <select
            className="btn-outline"
            name="className"
            value={filters.className}
            onChange={handleFilterChange}
            style={{ width: "100px", flex: "1" }}
          >
            <option value="All">All Classes</option>
            {classList.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        )}
        <select
          className="btn-outline"
          name="section"
          value={filters.section}
          onChange={handleFilterChange}
          disabled={dropdownLoading}
          style={{ width: "100px", flex: "1" }}
        >
          <option value="All">All Sections</option>
          {filteredSections.map((sec) => (
            <option key={sec} value={sec}>
              {sec}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="fromDate"
          className="btn-outline"
          value={filters.fromDate}
          onChange={handleFilterChange}
          style={{ width: "100px", flex: "1" }}
        />
        <input
          type="date"
          name="toDate"
          className="btn-outline"
          value={filters.toDate}
          onChange={handleFilterChange}
          style={{ width: "100px", flex: "1" }}
        />
        <select
          className="btn-outline"
          name="year"
          value={filters.year}
          onChange={handleFilterChange}
          style={{ width: "120px", flex: "1" }}
        >
          <option value="All">All Years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {/* Report Buttons */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "0",
          }}
        >
          <button
            className="btn-outline"
            onClick={handleTodayLedger}
            disabled={ledgerLoading}
            style={{ minWidth: "120px" }}
          >
            {ledgerLoading ? "Loading..." : "Today Ledger"}
          </button>
          <button
            className="btn-outline"
            onClick={handlePreviousReport}
            disabled={extraLoading}
            style={{ minWidth: "120px" }}
          >
            Previous Due List
          </button>
          <button
            className="btn-outline"
            onClick={handleCompleteFeeReport}
            disabled={extraLoading}
            style={{ minWidth: "120px" }}
          >
            Complete Fee
          </button>
          <button
            className="btn-outline"
            onClick={handleBusReport}
            disabled={extraLoading}
            style={{ minWidth: "120px" }}
          >
            Bus/Residental
          </button>
          <button
            className="btn-outline"
            onClick={handleStudentTransactions}
            disabled={studentTransactionsLoading}
            style={{ minWidth: "120px" }}
          >
            {studentTransactionsLoading ? "Loading..." : "Transactions"}
          </button>
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontWeight: 700,
            color: "#8b1e3f",
            whiteSpace: "nowrap"
          }}
        >
          {isPreviousFinancialYearSelected ? "Previous Due" : "Complete Due"} ({filters.year === "All" ? "All Years" : filters.year}): ₹{" "}
          {(summaryDueLoading
            ? 0
            : isPreviousFinancialYearSelected
            ? summaryPreviousDue
            : isCurrentFinancialYearSelected
            ? summaryDue
            : 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          {isPreviousFinancialYearSelected && (
            <span style={{ marginLeft: "14px", color: "#1a5f2f" }}>
              Previous Paid: ₹{" "}
              {(summaryDueLoading ? 0 : summaryPreviousPaid).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="fee-table-section" style={{ overflowX: "auto" }}>
        {loading ? (
          <p className="fee-popup-message">Loading...</p>
        ) : (
          renderTable()
        )}
      </div>
    </div>
  </div>
);

};



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
      <div className="collections-row" style={{ paddingLeft: 0 ,}}>
        <div className="collections-select-wrapper" >
        <label className="collections-label" style={{marginLeft:'5%'}}>Class-Section</label>

          <select
            className="btn-dropdown-FeesManagement collections-select"
            value={selectedClassSection}
            onChange={(e) => setSelectedClassSection(e.target.value)}
            disabled={dropdownLoading || classSectionList.length === 0}
          >
            <option value=""> Class-Section</option>

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
          }`} style={{ paddingLeft: 0 , marginTop:'15px'}}
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
          View Bill
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

  const combinedString = String(combined).trim();

  // Match format like "1-Brainy Badgers"
  const match = combinedString.match(/^(\d+)[-|](.+)$/);

  if (match) {
    return [match[1], match[2].trim()]; // keep original spacing + casing
  }

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


      <div className="collections-select-wrapper"               style={{ paddingLeft: 0 , }}
>
        <label className="collections-label" style={{marginLeft:'5%'}}>Class-Section</label>

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
  <option value=""> Class-Section</option>

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

          </div>

  <button
  className="btn-solid"
  style={{ marginTop: '0px' }}
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
  <div
    className="popup-overlay"
    onClick={() => {
      console.log("Overlay clicked → Closing Fee Popup");
      setShowFeePopup(false);
    }}
  >
    <div
      className="popup-box-income"
      onClick={(e) => {
        e.stopPropagation();
        console.log("Popup box clicked → Prevented overlay close");
      }}
    >
      {(() => {
        console.log("Selected ClassSection:", selectedClassSection);

        const [selClass, selSection] = splitClassSection(selectedClassSection);

        console.log("After split → Class:", selClass);
        console.log("After split → Section:", selSection);

        console.log("Passing to IncomeForm5:", {
          class: selClass,
          section: selSection,
        });

        return (
          <IncomeForm5
            selectedClassSection={{ class: selClass, section: selSection }}
          />
        );
      })()}
    </div>
  </div>
)}

      <div className="discounts-list-header">
        <span className="collections-label1">List of discounts:</span>
     <button
  className="btn-solid"
  style={{ marginTop: '0px' }}
          onClick={() => setShowPopup(true)}
        >
          Create 
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
  const [discountList, setDiscountList] = useState([]);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [showAllUnpaid, setShowAllUnpaid] = useState(false);
  const [showAllDiscount, setShowAllDiscount] = useState(false);

  useEffect(() => {
    const fetchDiscountedStudents = async () => {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) return;

      try {
        setDiscountLoading(true);
        const { data } = await axios.get(
          `${API_BASE_URL}/api/discounted-students`,
          { params: { schoolCode } }
        );
        setDiscountList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch discounted students:", error);
        setDiscountList([]);
      } finally {
        setDiscountLoading(false);
      }
    };

    fetchDiscountedStudents();
  }, []);

  const formatINR = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

  const getStudentName = (student) =>
    student?.StudentName || student?.name || "Student";

  const getDueAmount = (student) =>
    Number(
      student?.Due_Amount ??
      student?.Total_Due ??
      student?.dueAmount ??
      student?.unpaidAmount ??
      0
    );

  const getDiscountAmount = (student) =>
    Number(
      student?.Discount ??
      student?.discount ??
      student?.Discount_Amount ??
      0
    );

  const visibleUnpaidList = showAllUnpaid
    ? (unpaidList || [])
    : (unpaidList || []).slice(0, 4);
  const visibleDiscountList = showAllDiscount
    ? (discountList || [])
    : (discountList || []).slice(0, 4);
  const cardsGridColumns = "repeat(4, minmax(0, 1fr))";

  return (
    <div className="action-container" style={{ padding: '10px' }}>
      {/* 1. Summary Header */}
<div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
<span style={{ color: "green" }}>
  Paid: {formatINR(totals?.totalPaid)}
</span>

<span style={{ color: "red" }}>
  Balance: {formatINR(totals?.balance)}
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
      <div className="action-item" style={{ marginBottom: '15px', display: 'block', width: '100%' }}>
        <strong style={{ fontSize: '13px' }}>Unpaid Students ({unpaidList?.length || 0})</strong>
        <div style={{ marginTop: "6px", maxHeight: showAllUnpaid ? "220px" : "120px", overflowY: "auto", display: "grid", gap: "8px", gridTemplateColumns: cardsGridColumns }}>
          {visibleUnpaidList.map((student, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #e6e6e6",
                borderRadius: "8px",
                padding: "8px",
                background: "#fafafa",
                fontSize: "12px",
                color: "#222"
              }}
            >
              {getStudentName(student)}{" "}
              <span style={{ color: '#666' }}>({formatINR(getDueAmount(student))})</span>
            </div>
          ))}
          {unpaidList?.length > 4 && !showAllUnpaid && (
            <button
              type="button"
              onClick={() => setShowAllUnpaid(true)}
              style={{
                border: "none",
                background: "transparent",
                color: "#1a73e8",
                textAlign: "left",
                padding: 0,
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline"
              }}
            >
              + {unpaidList.length - 4} more... (View all)
            </button>
          )}
          {unpaidList?.length > 4 && showAllUnpaid && (
            <button
              type="button"
              onClick={() => setShowAllUnpaid(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "#1a73e8",
                textAlign: "left",
                padding: 0,
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline"
              }}
            >
              Show less
            </button>
          )}
        </div>
      </div>

      {/* 4. Discount List with Amount */}
      <div className="action-item" style={{ marginBottom: '15px', display: 'block', width: '100%' }}>
        <strong style={{ fontSize: '13px' }}>
          Discount Students ({discountList?.length || 0})
        </strong>
        <div style={{ marginTop: "6px", maxHeight: showAllDiscount ? "220px" : "120px", overflowY: "auto", display: "grid", gap: "8px", gridTemplateColumns: cardsGridColumns }}>
          {discountLoading && <div style={{ fontSize: "12px" }}>Loading discounts...</div>}
          {!discountLoading && visibleDiscountList.map((student, index) => (
            <div
              key={index}
              style={{
                border: "1px solid #e6e6e6",
                borderRadius: "8px",
                padding: "8px",
                background: "#fafafa",
                fontSize: "12px",
                color: "#222"
              }}
            >
              {getStudentName(student)}{" "}
              <span style={{ color: '#666' }}>({formatINR(getDiscountAmount(student))})</span>
            </div>
          ))}
          {!discountLoading && discountList?.length > 4 && !showAllDiscount && (
            <button
              type="button"
              onClick={() => setShowAllDiscount(true)}
              style={{
                border: "none",
                background: "transparent",
                color: "#1a73e8",
                textAlign: "left",
                padding: 0,
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline"
              }}
            >
              + {discountList.length - 4} more... (View all)
            </button>
          )}
          {!discountLoading && discountList?.length > 4 && showAllDiscount && (
            <button
              type="button"
              onClick={() => setShowAllDiscount(false)}
              style={{
                border: "none",
                background: "transparent",
                color: "#1a73e8",
                textAlign: "left",
                padding: 0,
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline"
              }}
            >
              Show less
            </button>
          )}
          {!discountLoading && discountList?.length === 0 && (
            <div style={{ color: '#666', fontStyle: 'italic', fontSize: "12px" }}>
              No discount students found
            </div>
          )}
        </div>
      </div>

      {/* 5. Logged Activities / My Actions */}
      <div className="action-item" style={{ display: 'block', width: '100%' }}>
        <strong style={{ fontSize: '13px' }}>My Actions ({actions?.length || 0})</strong>
        <div style={{ marginTop: "6px", maxHeight: "180px", overflowY: "auto", display: "grid", gap: "8px", gridTemplateColumns: cardsGridColumns }}>
          {(actions || []).map((item, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #e6e6e6",
                borderRadius: "8px",
                padding: "8px",
                background: "#fafafa",
                minWidth: 0
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#222" }}>
                {item.title || item.label || `Action ${idx + 1}`}
              </div>

              {item.detail && (
                <div style={{ fontSize: "11px", color: "#555", marginTop: "3px" }}>
                  {item.detail}
                </div>
              )}

              {Array.isArray(item.procedure) && item.procedure.length > 0 && (
                <ol style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "11px", color: "#333" }}>
                  {item.procedure.map((step, sIdx) => (
                    <li key={sIdx} style={{ marginBottom: "2px" }}>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}

          {(!actions || actions.length === 0) && (
            <div style={{ color: '#666', fontStyle: 'italic', fontSize: "12px" }}>
              No actions added
            </div>
          )}
        </div>
      </div>
  
    </div>
  );
};



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
                      <div className="section-header">
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
  <label className="reportcomplain-label" style={{marginTop:'-1px'}}>Upload Letter</label>

  <input
    type="file"
    id="uploadLetter"
    style={{ display: "none" }}   // 👈 hides default input
    onChange={(e) => setLetterFile(e.target.files[0])}
  />

  <button
    type="button"
    className="btn-dropdown-FeesManagement" style={{marginTop:'-3px'}}
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
          <ResponsiveContainer width="100%" height="80%">
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
    <div className="track-control-group">
                            <label className="collections-label">From Date</label>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="btn-dropdown-FeesManagement" />
                        </div>
                        <div className="track-control-group">
                            <label className="collections-label">To Date</label>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="btn-dropdown-FeesManagement" />
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
        <button className="btn-solid " style={{padding:'10px', width:'100px'}}>List Of Oi</button>
        <button className="btn-solid "style={{padding:'10px', width:'100px'}}>Edit/Delete</button>
        <button className="btn-solid "style={{padding:'5px', width:'100px'}}>Update SA</button>
        <button className="btn-solid "style={{padding:'5px', width:'100px'}}>Add New</button>
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
     <div className="reportcomplain-row">
        <div className="reportcomplain-group">
            <label className="label-text label-left">Class-Section</label>
            <select
              className="btn-dropdown-FeesManagement"
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

        <div className="reportcomplain-group">
            <label className="label-text">Unpaid List</label>
            <select
              className="btn-dropdown-FeesManagement"
              defaultValue="V. NANDA"
            >
              <option>V. Nanda</option>
            </select>
          </div>
        </div>

        {/* Second Row */}
        <div className="reportcomplain-row">
        <div className="reportcomplain-group">
            <label className="label-text label-left">Cutoff Service</label>
            <select
              className="btn-dropdown-FeesManagement"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="">Select Service</option>
              <option value="CUTOFF_APTS">CUTOFF APTS</option>
              <option value="ASSIST">ASSIST</option>
              <option value="BOTH">CUTOFF APTS, ASSIST</option>
            </select>
          </div>

        <div className="reportcomplain-group">
            <label className="label-text">Cutoff Dates</label>
            <input
              type="date"
              className="btn-dropdown-FeesManagement "
            />
          </div>

        <div className="reportcomplain-group">
            <button className="btn-solid cutoff-button" style={{marginTop:'15px'}}>
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
const [totalAmount, setTotalAmount] = useState(0);
const [totalDiscount, setTotalDiscount] = useState(0);
const [balance, setBalance] = useState(0);
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

const handleFetchSummary = async () => {
  const schoolCode = localStorage.getItem("schoolCode");

  if (!schoolCode) {
    console.error("School code missing");
    return;
  }

  const url = `https://cleezoclass.com:4000/api/fees-summary-ledgerData?schoolCode=${schoolCode}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      throw new Error("Failed to fetch ledger data");
    }

    const totalAmount = data.totalAmount || 0;
    const totalPaid = data.totalPaid || 0;
    const totalDiscount = data.totalDiscount || 0;
    const balance = data.balance || 0;

    setTotalAmount(totalAmount);
    setTotalPaid(totalPaid);
    setTotalDiscount(totalDiscount);
    setBalance(balance);

setPreviousTotals({
  totalPaid: totalPaid,
  balance: balance
});
  } catch (err) {
    console.error("Ledger fetch error:", err);

    setTotalAmount(0);
    setTotalPaid(0);
    setTotalDiscount(0);
    setBalance(0);

setPreviousTotals({
  totalPaid: 0,
  balance: 0
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

  console.log("📌 Selected Class:", className);
  console.log("📌 Selected Section:", section);
  console.log("📌 From Date:", fromDate);
  console.log("📌 To Date:", toDate);
  console.log("📌 School Code:", schoolCode);

  const url = `https://cleezoclass.com:4000/api/unpaid-list?schoolCode=${schoolCode}&fromDate=${fromDate || ""}&toDate=${toDate || ""}&className=${className}&section=${section}`;

  console.log("🌐 API URL:", url);

  try {
    const res = await fetch(url);

    console.log("📡 Response Status:", res.status);

    const data = await res.json();
console.log("🔍 First Record Full Data:", data[0]);
console.log("🔍 All Keys:", Object.keys(data[0]));
    console.log("📦 Full API Response:", data);

    if (Array.isArray(data) && data.length > 0) {
      console.log("🧾 First Record:", data[0]);
      console.log("💰 Amount Field Value:", data[0].amount);
    }

    setUnpaidList(data);
    setShowUnpaidPopup(true);

  } catch (err) {
    console.error("❌ Error fetching unpaid list:", err);
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


const AccountantFeesIncome = () => {
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
      console.error("Failed to load class/section dropdowns:", err);
      setClassList([]);
      setSectionMap([]);
      setClassSectionList(["All"]);
      setPopupMessage("Failed to load classes/sections. Please check the server and try again.");
      setModal((prev) => ({ ...prev, isVisible: false }));
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
      contentComponent: PayementDemo,
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
  totalPaid: 0,
  balance: 0
});
const actionItems = [
  {
    title: "Top Unpaid Student Follow-up",
    detail: "Reduce overdue fee risk by contacting highest due students first.",
    procedure: [
      "Open Unpaid Students list and sort by due amount descending.",
      "Call guardian and confirm exact pending amount and due date.",
      "Share payment link or branch counter details by WhatsApp/SMS.",
      "Record follow-up status: Paid / Promise date / No response.",
      "Escalate no-response cases after 2 follow-ups to management."
    ]
  },
  {
    title: "Discount Verification and Approval",
    detail: "Ensure discounts are valid, approved, and correctly posted.",
    procedure: [
      "Open Discount Students section and verify discount amount per student.",
      "Check approval source (principal/management) and reason.",
      "Cross-check fee ledger after discount application.",
      "Reject or hold requests missing approval proof.",
      "Publish final approved list for finance records."
    ]
  },
  {
    title: "Weekly High Expense Review",
    detail: "Control cash outflow by reviewing top expense categories every week.",
    procedure: [
      "Open expense summary and identify top 3 categories.",
      "Compare this week spend vs last week trend.",
      "Flag unusual jumps greater than 20%.",
      "Validate bills/vouchers and payment method used.",
      "Send weekly variance summary to Chief/Admin."
    ]
  },
  {
    title: "Balance Recovery Plan",
    detail: "Convert pending balances into collections through daily tracking.",
    procedure: [
      "Track class-wise pending balance each morning.",
      "Assign collector/caller with target amount for the day.",
      "Send reminder messages before school closing time.",
      "Update paid entries immediately after confirmation.",
      "Carry forward unresolved dues to next-day priority list."
    ]
  },
  {
    title: "Fee Posting Audit",
    detail: "Prevent mismatches between collected amount and ledger entries.",
    procedure: [
      "Match cash/UPI/bank receipts with system entries.",
      "Verify installment, transport, and exam fee splits.",
      "Check discount and concession adjustments.",
      "Correct posting errors before day-end close.",
      "Keep audit note for corrected transactions."
    ]
  },
];

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
                                        <div className="right-column">

                    <div className="section-wrapper">
                   
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
                    </div></div>
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
totals={previousTotals}                    unpaidList={sharedUnpaidList}
                    classesWithoutFees={sharedClassesWithoutFees}
                    addMissingFeeClass={addMissingFeeClass}
                      previousTotals={previousTotals}

                  />
                </CustomCard>
              </div>
            </div>
          </div>

          {/* SECOND SECTION */}
          <div ref={secondSectionRef}>
<div className="footprintsinner" style={{ paddingTop: "40px" }}>
  Income Activities
</div>            <div className={`second-section-grid ${isMobile ? "mobile" : "desktop"}`}>
              <CustomCardRight isMobile={isMobile}>
                <div className="track-left-container">
                  <div className="expense-section-wrapper" style={{ flex: 1 }}>
                    <ReportComplain
                      isMobile={isMobile}
                      font={font}
                      classSectionList={classSectionList.filter((item) => item !== "All")}
                      dropdownLoading={dropdownLoading}
                    />
                    <RemindersCutoff
                      isMobile={isMobile}
                      font={font}
                      classSectionList={classSectionList.filter((item) => item !== "All")}
                      dropdownLoading={dropdownLoading}
                    />
                  </div>
                  <div
                    className="expense-section-wrapper"
                    style={{
                      flex: 1,
                      borderLeft: !isMobile ? "1px solid #ccc" : "none",
                      paddingLeft: !isMobile ? "15px" : "0",
                      marginTop:'-30px'
                    }}
                  >
                      <div className="section-header">
                        <span className="dot" />
                        Previous Records
                      </div>
                      <PreviousRecords
                        isMobile={isMobile}
                        font={font}
                        classSectionList={classSectionList.filter((item) => item !== "All")}
                          setPreviousTotals={setPreviousTotals}

                      />
                  </div></div>
                </CustomCardRight>
                <CustomCard title="Other Income" isMobile={isMobile}>
                  <OtherIncome isMobile={isMobile} font={font} />
                </CustomCard>
              </div>
            </div>
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



export default AccountantFeesIncome;
