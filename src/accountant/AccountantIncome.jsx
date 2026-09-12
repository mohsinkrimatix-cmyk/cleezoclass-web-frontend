import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleRight,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import '../STYLES/tabhower.css'
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
  Legend,BarChart,Bar
} from "recharts";
// --- NEW COMPONENT IMPORTS FOR MODAL CONTENT ---
import PayementDemo from "./Accountant_FeesManagement_income_payment.jsx";
import GenerateBills from "./Accountant_FeesManagement_Bills.jsx";
import Discount from "./Accounatant_FeesManagement_Discounts.jsx"; 
// --- END NEW COMPONENT IMPORTS ---

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

  const modalStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const contentStyle = {
    backgroundColor: '#fff',
    padding: type === 'content' ? '20px' : '30px', // Less padding for content modal
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    maxWidth: type === 'content' ? '80vw' : '400px', // Wider for content
    width: '90%',
    maxHeight: '95vh',
    overflowY: 'auto',
    textAlign: 'center',
    position: 'relative',
     scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
  };

  const headerStyle = {
 
    paddingBottom: type === 'content' ? '10px' : '0',
  };
  
  const closeButtonStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#333',
  };

  const buttonGroupStyle = {
    marginTop: '20px',
    display: 'flex',
    justifyContent: type === 'confirm' ? 'space-around' : 'center',
    gap: '10px',
  };
  
  const baseButtonStyle = {
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  }
  
  const confirmButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: type === 'confirm' ? '#945f4aff' : '#38761D',
    color: 'white',
  };
  
  const cancelButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: '#ccc',
    color: '#333',
  };

  const Icon = () => {
    // Only show icons for alert/confirm types
    if (type === 'content') return null;

    if (type === 'confirm') {
      return <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '10px' }} />;
    }
    if (message && (message.includes('ERROR') || message.includes('Failed'))) {
      return <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '10px' }} />;
    }
    return <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '10px' }} />;
  };

  return (
   <div
  style={modalStyle}
  onClick={onCancel} // clicking the overlay closes modal
>
  <div
    style={contentStyle}
    onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
  >
  

    {type === 'content' ? (
      <div style={{ marginTop: '15px', textAlign: 'left' }}>
        {children}
      </div>
    ) : (
      <>
        <p>{message}</p>
        <div style={buttonGroupStyle}>
          {type === 'confirm' && (
            <button onClick={onCancel} style={cancelButtonStyle}>
              Cancel
            </button>
          )}
          <button onClick={onConfirm} style={confirmButtonStyle}>
            {type === 'confirm' ? 'Proceed' : 'OK'}
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
const CustomCard = ({ title, children, icon, isMobile }) => {
    const cardStyle = {
        backgroundColor: "transparent",
        borderRadius: "16px",
        border: "1px solid #ddd", 
        padding: "15px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        overflowY: "auto",
        maxHeight: "350px",
        minHeight: "350px",
        width: "300px",
         scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
    };
    const headerStyle = {
        fontSize: '16px',
        fontWeight: "600",
        marginBottom: "5px",
        color: "#333",
        paddingBottom: "5px",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
    };
    const radioStyle = {
        marginRight: '8px',
        color: '#945f4aff',
    };

    return (
        <div style={cardStyle}>
            <div style={headerStyle}>
                <input type="radio" style={radioStyle} id={`radio-${title.replace(/\s/g, '-')}`} name="section-radio" defaultChecked={title.includes('TRACK FEES') || title.includes('ACTIONS')} />
                <label htmlFor={`radio-${title.replace(/\s/g, '-')}`}>
                    {title}
                </label>
            </div>
            {children}
        </div>
    );
};
 const CustomCardRight = ({ title, children, icon, isMobile }) => {
    const cardStyle = {
        backgroundColor: "transparent",
        borderRadius: "16px",
        border: "1px solid #ddd",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        overflowY: "auto",
        maxHeight: "350px",
        minHeight: "350px",
        width: "800px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0,0,0,0) transparent",
    };

    const headerStyle = {
        fontSize: "16px",
        fontWeight: "600",
        marginBottom: "5px",
        color: "#333",
        paddingBottom: "5px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
    };

    return (
        <div style={cardStyle}>
            {/* Only show header if title exists */}
            {title && (
                <div style={headerStyle}>
                    <input
                        type="radio"
                        style={{ marginRight: "8px", color: "#945f4aff" }}
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

const sectionHeader = {
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "5px",
  color: "#444",
  paddingBottom: "4px",
};



const sectionWrapper = {
  padding: "5px 0",
};

const twoColumnLayout = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  alignItems: "start",
  height: "100%",
  
};




// ----------------------------------------------------------------------
// --- Section Components (TrackFees, Discounts, Actions, etc.) ---
// ----------------------------------------------------------------------
// Assume schoolCode is handled via localStorage, but it's good practice to define it
const schoolCode = localStorage.getItem("schoolCode"); 

// --- HELPER FUNCTIONS ---

// Function to generate an array of dates between two Date objects (as provided in the original code)
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

// 🔥 FIX: Update to return YYYY-MM format for API usage
const getMonthStringFromFilter = (filter) => {
    const now = new Date();
    let targetDate = new Date(now);

    if (filter === "lastMonth") {
        targetDate.setMonth(now.getMonth() - 1);
    }
    
    // Format to YYYY-MM (e.g., "2025-10")
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`; 
};

const TrackFees = ({ isMobile, font }) => {
  const [allFees, setAllFees] = useState([]);
  const [timeFilter, setTimeFilter] = useState("thisWeek");
  const [classList, setClassList] = useState([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  
  const [totals, setTotals] = useState({
    Paid: 0, 
    Pending: 0, 
    loading: true,
    error: null,
  });
  
  const [finalPaid, setFinalPaid] = useState(0); 
  const [finalPending, setFinalPending] = useState(0); 
  const [popupTitle, setPopupTitle] = useState("");
  const [popupData, setPopupData] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupMonth, setPopupMonth] = useState("");
  // selectedMonth will now store "YYYY-MM" (e.g., "2025-10")
  const [selectedMonth, setSelectedMonth] = useState(""); 
  const [showFeeDetailsPopup, setShowFeeDetailsPopup] = useState(false); 

  const card = {
    padding: "20px",
    cursor: "pointer",
    minHeight: "450px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  };

  const filterOptions = [
    { label: "This Week", value: "thisWeek" },
    { label: "This Month", value: "thisMonth" },
    { label: "Last Month", value: "lastMonth" },
    { label: "This Year", value: "thisYear" },
    { label: "Half Year", value: "halfYear" },
    { label: "Financial Year", value: "financialYear" },
  ];
  
  // Helper to check if the current filter is one of the supported single-month filters for the detailed report API
  const isSingleMonthFilter = timeFilter === "thisMonth" || timeFilter === "lastMonth";

  // New helper to convert YYYY-MM to MonthName YYYY for UI display
  const getDisplayMonth = (isoMonth) => {
    if (!isoMonth) return "N/A";
    const [year, month] = isoMonth.split('-');
    // Month in Date constructor is 0-indexed (month - 1)
    const date = new Date(year, month - 1, 1); 
    
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
  };
  
  // --- BUSINESS LOGIC FUNCTIONS ---

  const applyTimeFilter = () => {
    if (!allFees.length) {
      return;
    }

    const now = new Date();

    // 1. Group the fee data that exists
    const groupedData = allFees.reduce((acc, item) => {
      const date = new Date(item.created_at);
      let key = null;

      let filterStart, filterEnd;
      let isDateWithinFilter = true;

      switch (timeFilter) {
        case "thisWeek":
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - now.getDay());
          filterStart.setHours(0, 0, 0, 0);
          filterEnd = new Date(filterStart);
          filterEnd.setDate(filterStart.getDate() + 6);
          key = date.toLocaleDateString("en-US", { weekday: "short" });
          break;
        case "thisMonth":
        case "lastMonth":
          filterStart =
            timeFilter === "thisMonth"
              ? new Date(now.getFullYear(), now.getMonth(), 1)
              : new Date(now.getFullYear(), now.getMonth() - 1, 1);
          filterEnd =
            timeFilter === "thisMonth"
              ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
              : new Date(now.getFullYear(), now.getMonth(), 0);
          key = `${date.getDate()} ${date.toLocaleString("en-US", {
            month: "short",
          })}`;
          break;
        case "thisYear":
          filterStart = new Date(now.getFullYear(), 0, 1);
          filterEnd = new Date(now.getFullYear(), 11, 31);
          key = date.toLocaleString("en-US", { month: "short" });
          break;
        case "halfYear":
          filterStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          filterEnd = now;
          key = date.toLocaleString("en-US", {
            month: "short",
            year: "2-digit",
          });
          break;
        case "financialYear":
          const fyStartMonth = 3; // April
          const year =
            now.getMonth() >= fyStartMonth ? now.getFullYear() : now.getFullYear() - 1;
          filterStart = new Date(year, fyStartMonth, 1);
          filterEnd = new Date(year + 1, fyStartMonth, 0);
          key = date.toLocaleString("en-US", {
            month: "short",
            year: "2-digit",
          });
          break;
        default:
          isDateWithinFilter = false;
          break;
      }

      isDateWithinFilter = date >= filterStart && date <= filterEnd;

      if (isDateWithinFilter) {
        acc[key] = acc[key] || { Paid: 0, Pending: 0 };
        acc[key].Paid += Number(item.Paid_Amount) || 0;
        acc[key].Pending +=
          (Number(item.CompleteFee) || 0) - (Number(item.Paid_Amount) || 0);
      }
      return acc;
    }, {});

    // 2. Calculate total Paid and Pending across the selected filter
    const calculatedTotals = Object.values(groupedData).reduce(
      (acc, item) => {
        acc.Paid += item.Paid;
        acc.Pending += item.Pending;
        return acc;
      },
      { Paid: 0, Pending: 0 }
    );

    // 3. Define ALL labels in correct chronological order
    let orderedLabels = [];
    let start, end;

    switch (timeFilter) {
      case "thisWeek":
        orderedLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        break;
      case "thisMonth":
      case "lastMonth":
        start =
          timeFilter === "thisMonth"
            ? new Date(now.getFullYear(), now.getMonth(), 1)
            : new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end =
          timeFilter === "thisMonth"
            ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
            : new Date(now.getFullYear(), now.getMonth(), 0);
        const dates = getDatesBetween(start, end);
        orderedLabels = dates.map(
          (d) => `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`
        );
        break;
      case "thisYear":
        orderedLabels = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct",
          "Nov", "Dec",
        ];
        break;
      case "halfYear":
      case "financialYear":
        const fyStartMonth = timeFilter === "financialYear" ? 3 : now.getMonth() - 5;
        const numMonths = timeFilter === "financialYear" ? 12 : 6;
        let currentYear = now.getFullYear();
        if (timeFilter === "financialYear" && now.getMonth() < 3)
          currentYear = now.getFullYear() - 1;
        for (let i = 0; i < numMonths; i++) {
          const monthDate = new Date(currentYear, fyStartMonth + i, 1);
          orderedLabels.push(
            monthDate.toLocaleString("en-US", { month: "short", year: "2-digit" })
          );
        }
        break;
      default:
        orderedLabels = Object.keys(groupedData);
        break;
    }

    // 4. Generate chartData from orderedLabels, filling missing data with 0
    const finalChartData = orderedLabels.map((label) => {
      const data = {
        label,
        Paid: groupedData[label]?.Paid || 0,
        Pending: groupedData[label]?.Pending || 0,
      };
      return data;
    });

    // 5. Update states
    setChartData(finalChartData);
    setTotals(prev => ({ // Update totals state, preserving other properties if any
      ...prev,
      Paid: calculatedTotals.Paid,
      Pending: calculatedTotals.Pending
    }));
  };

  const fetchFeeData = async () => {
    const schoolCode = localStorage.getItem("schoolCode");

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE_URL}/api/feeDataFinanceNew?schoolCode=${schoolCode}`
      );

      const fees = res.data.results || [];
      setAllFees(fees);

      const totalPaid = fees.reduce((a, b) => a + (Number(b.Paid_Amount) || 0), 0);
      const totalPending = fees.reduce(
        (a, b) => a + ((Number(b.CompleteFee) || 0) - (Number(b.Paid_Amount) || 0)),
        0
      );

      setFinalPaid(totalPaid);
      setFinalPending(totalPending);

    } catch (err) {
      console.error("❌ Error fetching fee data:", err);
    } finally {
      setLoading(false);
    }
  };
  const closeFeeDetailsPopup = () => {
    setShowFeeDetailsPopup(false);
    setPopupTitle("");
    setPopupData([]);
    setPopupMonth("");
  };
  
  const handleView = async (type) => {
    
    // 🛑 Block detail view for multi-period filters
    if (!isSingleMonthFilter) {
      alert("Detail View (List/Report) is only available for 'This Month' or 'Last Month' filters, as the detail API is month-specific. Please adjust the time filter.");
      return;
    }
    
    // selectedMonth is now in YYYY-MM format
    const monthToUse = selectedMonth; 

    if (!schoolCode) {
      alert("School code not available. Cannot fetch data.");
      return;
    }

    // Use the YYYY-MM format for the popup month state, as it's the contextual filter value
    setPopupMonth(monthToUse); 
    setPopupLoading(true);
    setShowFeeDetailsPopup(true);
    setPopupTitle(`Loading list for ${type}...`);
    setPopupData([]);

    try {
      // API 3: Fetch Detailed Fee Records - The URL now uses the required YYYY-MM format
      // Example URL: https://cleezoclass.com:4000/api/fee-records?type=TotalDueList&month=2025-10&schoolCode=TAGSOLNOVALLP
      const response = await axios.get(
        `${API_BASE_URL}/api/fee-records?type=${type}&month=${monthToUse}&schoolCode=${schoolCode}`
      );

      let title = '';
      const displayMonthName = getDisplayMonth(monthToUse); // Use friendly name for display
      
      if (type.includes('Unpaid')) title = "Highly Unpaid Students List";
      else if (type === 'TotalPaidList') title = `Students with Zero Due for ${displayMonthName}`;
      else if (type === 'TotalDueList') title = `Students with Pending Dues for ${displayMonthName}`;
      else if (type.includes('AllFeesStatusReport')) title = `Comprehensive Fee Status for ${displayMonthName}`;

      setPopupTitle(title);
      setPopupData(response.data);
      setPopupLoading(false);
    } catch (err) {
      console.error(`Error fetching list for ${type}:`, err);
      setPopupTitle(`Error fetching ${type} list.`);
      setPopupData([{ detail: "Failed to load data from the server." }]);
      setPopupLoading(false);
    }
  };

  // --- useEffect Hooks ---

  // 1. Fetch data on mount
  useEffect(() => {
    fetchFeeData();
  }, []);

  // 2. Apply filter and set selectedMonth when filter/data changes
  useEffect(() => {
    applyTimeFilter();
    
    // selectedMonth is now set to YYYY-MM format
    const month = getMonthStringFromFilter(timeFilter);
    setSelectedMonth(month);
  }, [timeFilter, allFees]);
  
  // --- STYLES (from original code) ---

  const btnStyle = {
    backgroundColor: isSingleMonthFilter ? "#6b7983ff" : "#b0b0b0", // Disabled background
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: isSingleMonthFilter ? "pointer" : "not-allowed", // Set cursor
    fontSize: isMobile ? "10px" : "12px",
    fontWeight: '500',
    fontFamily: font,
    transition: 'background-color 0.3s'
  };

  const dueListBtnStyle = {
    padding: "8px 12px",
    borderRadius: "8px",
    background: isSingleMonthFilter ? "rgba(141,171,182,1)" : "#b0b0b0", // Disabled background
    color: "#fff",
    border: "none",
    cursor: isSingleMonthFilter ? "pointer" : "not-allowed", // Set cursor
    fontSize: "12px",
    width: "150px",
    transition: 'background-color 0.3s'
  }
  
  const displayMonthName = getDisplayMonth(selectedMonth);

  // --- RENDER ---

  return (
    <div style={{ flex: isMobile ? "1 1 100%" : 6 }}>
      <div
        className="container-hover"
        style={{ ...card, borderRight: "1px solid #ccc" }}
      >
       <div
  style={{
    fontSize: "10px",
    marginBottom: "5px",
    display: "flex",
    justifyContent: "space-between", // pushes children to opposite sides
    flexWrap: "wrap",
    gap: "10px",
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
    <strong>Filter:</strong>
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

 {/* <span>
    Total Term Fees: {timeFilter || ""} (Selected Month Context: {displayMonthName})
  </span>*/}
</div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            flex: 1,
            marginTop: "10px",
          }}
        >
          <div
            style={{
             flex: isMobile ? "1 1 100%" : 5,
height: isMobile ? "150px" : "200px",

            }}
          >
            <ResponsiveContainer width="80%" height="80%">
              <BarChart data={chartData}>
                <XAxis dataKey="label" fontSize={isMobile ? 10 : 12} />
                <YAxis fontSize={isMobile ? 10 : 12} />
                <Tooltip />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ width: "100%", fontSize: isMobile ? 10 : 12 }}
                />
                <Bar dataKey="Paid" fill="#6CA6FF" barSize={isMobile ? 12 : 20} />
                <Bar dataKey="Pending" fill="#9C6262" barSize={isMobile ? 12 : 20} />
              </BarChart>
            </ResponsiveContainer>

            <div style={{ width: "100%", textAlign: "center", marginTop: "0px", fontSize: isMobile ? 10 : 12, fontWeight: '300' }}>
                <span style={{ color: "#333", marginRight: "20px" }}>
                  Total Paid: ₹{totals.Paid.toFixed(2)}</span>
                <span style={{ color: "#333" }}>
                  Total Unpaid: ₹{totals.Pending.toFixed(2)}
                </span>
            </div>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "15px", width: "100%", marginTop: "15px" }}>
            <button
              onClick={() => handleView("TotalDueList")}
              style={dueListBtnStyle}
              disabled={!isSingleMonthFilter}
            >
              View Due List
            </button>
            <button 
              style={btnStyle} 
              onClick={() => handleView("AllFeesStatusReport")}
              disabled={!isSingleMonthFilter}
            >
              View Report
            </button>
          </div>
          </div>
        </div>

        {/* ⭐ BUTTONS SIDE BY SIDE ⭐ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column", // Use column to stack warning and buttons
            alignItems: "center",
            gap: "10px",
            marginTop: "10px",
            width: "100%",
          }}
        >
          {!isSingleMonthFilter && (
            <p style={{ color: 'red', fontSize: '10px', margin: '0', textAlign: 'center' }}>
                ⚠️ **Detail Reports** are only available for **This Month** or **Last Month**.
            </p>
          )}

          
        </div>
      </div>
            {/* FEE DETAILS LIST POPUP RENDER */}
      {showFeeDetailsPopup && (
        <FeeDetailsPopup 
          title={popupTitle} 
          data={popupData} 
          loading={popupLoading}
          // Pass the display month name to the popup
          selectedMonth={getDisplayMonth(popupMonth)} 
          onClose={closeFeeDetailsPopup} 
        />
      )}

    </div>
    
  );
};

// FeeDetailsPopup component remains unchanged, but it will now receive a friendly month name
const FeeDetailsPopup = ({ title, data, loading, onClose, selectedMonth }) => {
  if (!title) return null;

  // Filter data to only include records where 'StudentName' is not null
  const filteredData = data.filter(row => row.StudentName !== null); // Use StudentName based on SQL

  const dataToDisplay = loading ? [] : filteredData;

  const popupStyle = {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
    background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", 
    alignItems: "center", padding: "10px", zIndex: 2000
  };
  const contentStyle = {
    width: "90%", maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto",  scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
    background: "#fff", borderRadius: "8px", padding: "15px", display: "flex", 
    flexDirection: "column",
  };
  const thStyle = { padding: "8px", textAlign: "center", fontWeight: "bold", fontSize: "12px", borderBottom: "2px solid #ccc" };
  const tdStyle = { padding: "6px", textAlign: "center", fontSize: "12px", borderBottom: "1px solid #e0e0e0" };

  const getHeaders = (data) => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };
  
  const headers = getHeaders(dataToDisplay);

  return (
    <div style={popupStyle}>
      <div style={contentStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "5px", fontSize: "18px" }}>{title}</h2>
        {/* Display selected month context */}
        {selectedMonth && <p style={{ textAlign: "center", fontSize: "14px", color: "#555", marginBottom: "10px" }}>Contextual Month: {selectedMonth}</p>}
        {loading ? (
          <p style={{ textAlign: "center", fontSize: "14px" }}>Loading...</p>
        ) : dataToDisplay.length === 0 ? (
          <p style={{ textAlign: "center", fontSize: "14px" }}>No valid records found for this category (or all records had null student names).</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "rgba(141,171,182,255)", color: "#fff" }}>
                {headers.map(header => (
                  <th key={header} style={thStyle}>
                    {header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataToDisplay.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ background: rowIndex % 2 === 0 ? "#fafafa" : "#f1f6fa" }}>
                  {headers.map(header => (
                    <td key={header} style={tdStyle}>{row[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: "15px", padding: "6px 12px", background: "rgba(141,171,182,255)", 
            color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", 
            float: "right", fontSize: "12px",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
// ----------------------------------------------------------------------
// --- Collections Component (MODIFIED for single Class-Section dropdown) ---
// ----------------------------------------------------------------------
const Collections = ({ isMobile, font, classSectionList, dropdownLoading, onPayFee, onEditBill }) => { 
    // State to hold the selected combined class-section string (e.g., "1A")
    const [selectedClassSection, setSelectedClassSection] = useState(classSectionList.length > 0 ? classSectionList[0] : '');

    // Update default when list loads/changes
    useEffect(() => {
        if (classSectionList.length > 0 && !classSectionList.includes(selectedClassSection)) {
             setSelectedClassSection(classSectionList[0]);
        }
    }, [classSectionList, selectedClassSection]);
    
// AccountantIncome.jsx (Define this function)

// AccountantIncome.jsx (Insert/Replace this utility function)

const splitClassSection = (combined) => {
    if (!combined) return ['', ''];

    // Already trimmed & spaces removed
    const combinedString = String(combined);

    // Match digits followed by letters
    const adjacentMatch = combinedString.match(/^(\d+)([A-Za-z]+)$/);
    if (adjacentMatch) {
        console.log("splitClassSection Match (Adjacent):", adjacentMatch[1], adjacentMatch[2]);
        return [adjacentMatch[1], adjacentMatch[2].toUpperCase()];
    }

    // Match digits and letters separated by dash or pipe (6-A, 6|A)
    const delimiterMatch = combinedString.match(/^(\d+)[\-|]+([A-Za-z]+)$/);
    if (delimiterMatch) {
        console.log("splitClassSection Match (Delimiter):", delimiterMatch[1], delimiterMatch[2]);
        return [delimiterMatch[1], delimiterMatch[2].toUpperCase()];
    }

    return [combinedString, ''];
};



// ...
const handlePayFeeClick = () => {
    if (!selectedClassSection) return;

    // Remove ALL spaces before splitting
    const cleaned = selectedClassSection.trim().replace(/\s+/g, "");

    console.log("Raw Dropdown Value (selectedClassSection):", selectedClassSection);
    console.log("Cleaned Value:", cleaned);

    const [className, sectionName] = splitClassSection(cleaned);

onPayFee(selectedClassSection);  // pass the combined string only
};

    const handleEditBillClick = () => {
        const [className, sectionName] = splitClassSection(selectedClassSection);
        onEditBill(className, sectionName);
    };


    const btnStyle = {
        backgroundColor: "#6b7983ff",
        color: "white",
        border: "none",
        borderRadius: "14px",
        padding: "6px 10px",
        cursor: "pointer",
        fontSize: isMobile ? "10px" : "12px",
        fontWeight: '500',
        fontFamily: font,
        margin: '5px 5px 0 0',
    };
    
    const selectStyle = {
        padding: "4px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        width: '40%',
        fontSize: isMobile ? '12px' : '14px',
    };
    
    const labelStyle = {
        fontSize: isMobile ? '10px' : '12px',
        fontWeight: 'bold',
        marginBottom: '2px',
        display: 'block',
        textAlign: 'left',
        width: '100%',
    };

    return (
       <div style={{ paddingBottom: '10px', marginBottom: '10px' }}>

<div
  style={{
    display: "flex",
    justifyContent: "center",   // ⭐ centers everything
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
    width: "100%",
  }}
>


  {/* Dropdown */}
  <select
    style={{ ...selectStyle, width: "150px" }}
    value={selectedClassSection}
    onChange={(e) => setSelectedClassSection(e.target.value)}
    disabled={dropdownLoading || classSectionList.length === 0}
  >
    {dropdownLoading ? (
      <option>Loading...</option>
    ) : (
      classSectionList.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))
    )}
  </select>

  {/* PAY FEE BUTTON */}
  <button
    style={{
      ...btnStyle,
      height: "36px",
      whiteSpace: "nowrap",
    }}
    onClick={handlePayFeeClick}
    disabled={dropdownLoading || !selectedClassSection}
  >
    PAY FEE
  </button>
</div>


    {/* ⭐ ROW 2 → EDIT BILL + REMINDER */}
    <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "15px",
        paddingTop: '10px' 
    }}>
        <button 
            style={btnStyle}
            onClick={handleEditBillClick}
            disabled={dropdownLoading || !selectedClassSection}
        >
            EDIT BILL
        </button>

        <button style={btnStyle}>
            REMINDER
        </button>
    </div>

</div>

    );
};


const Discounts = ({ isMobile, font }) => {
  const [showPopup, setShowPopup] = useState(false);
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "90vw",
  height: "70vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const popupStyle = {
  padding: "20px",
  borderRadius: "10px",
  width: "80%",
  maxHeight: "90vh",
  overflowY: "auto",
   scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
};

  const btnStyle = {
    backgroundColor: "#6b7983ff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: isMobile ? "10px" : "12px",
    fontWeight: '500',
    fontFamily: font,
    margin: '5px',
  };

  return (
    <div>
                <div style={{ ...sectionHeader, display: "flex", alignItems: "center", gap: "8px" }}>
  {/* Colored circle */}
  <span
    style={{
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      backgroundColor: "#dcf3b0ff", // choose your color
      display: "inline-block",
      marginLeft: "5%",
      marrinBottom: "0",
    }}
  />
  DISCOUNTS
</div>
      

      {/* Row 1 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
        <span>list of discounts:</span>
        <button style={btnStyle} onClick={() => setShowPopup(true)}>CREATE NEW</button>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span>list of discounts:</span>
        <button style={btnStyle} onClick={() => setShowPopup(true)}>EDIT / DELETE</button>
      </div>


      {/* POPUP MODAL */}
      {showPopup && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            
            {/* Close Button */}
            <button 
              style={{ float: "right", background: "red", color: "white", border: "none", padding: "4px 8px", cursor: "pointer" }}
              onClick={() => setShowPopup(false)}
            >
              X
            </button>

            {/* Your Discount Page Component */}
            <Discount />    

          </div>
        </div>
      )}

    </div>
  );
};


const Actions = ({ actions, isMobile, font }) => {
    const actionItemStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
        fontSize: isMobile ? "12px" : "14px",
        textAlign: 'left',
        
    };
    const statusBadgeStyle = (status) => ({
        backgroundColor: status === "OK" ? "#92D09B" : (status === "REJECTED" ? "#E57373" : "#B97FA5"),
        border: "none",
        borderRadius: "8px",
        padding: "2px 5px",
        cursor: 'default',
        fontSize: isMobile ? "9px" : "10px",
        fontWeight: "500",
        fontFamily: font,
        color: "#fff",
        minWidth: "40px",
        textAlign: 'center',
    });
    const arrowStyle = {
        marginRight: "5px",
        color: "#945f4aff",
    };

    return (
        <div style={{ textAlign: "left" }}>
            {actions.map((action, index) => (
                <div key={index} style={actionItemStyle}>
                    <FontAwesomeIcon icon={faAngleRight} style={arrowStyle} />
                    <div style={{ flex: 1, textAlign: "left" }}>{action.text}</div>
                    <div style={statusBadgeStyle(action.status)}>{action.status}</div>
                </div>
            ))}
        </div>
    );
};

// ----------------------------------------------------------------------
// --- ReportComplain Component (MODIFIED for single Class-Section dropdown) ---
// ----------------------------------------------------------------------
const ReportComplain = ({ isMobile, font, classSectionList, dropdownLoading }) => {
    // State to hold the selected combined class-section string (e.g., "1A")
    const [selectedClassSection, setSelectedClassSection] = useState(classSectionList.length > 0 ? classSectionList[0] : '');
    
    // Update default when list loads/changes
    useEffect(() => {
        if (classSectionList.length > 0 && !classSectionList.includes(selectedClassSection)) {
             setSelectedClassSection(classSectionList[0]);
        }
    }, [classSectionList, selectedClassSection]);
    
    const selectStyle = {
        padding: "4px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        width: '100%',
        marginBottom: '5px',
        fontSize: isMobile ? '12px' : '14px',
    };
    const btnStyle = {
        backgroundColor: "#6b7983ff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: isMobile ? "10px" : "12px",
        fontWeight: '500',
        fontFamily: font,
        margin: '5px 0',
    };
    const labelStyle = {
        fontSize: isMobile ? '10px' : '12px',
        fontWeight: 'bold',
        marginBottom: '2px',
        display: 'block',
    };

    return (
        <div style={{ paddingBottom: '10px',  marginBottom: '10px', }}>
          <div style={{ ...sectionHeader, display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Colored circle */}
        <span
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "#ccdaeeff", // choose your color
            display: "inline-block",
            marginLeft: "5%",
          }}
        />
        REPORT/COMPLAIN 
      </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                {/* Left side */}
                <div>
                    {/* Class-Section Dropdown */}
                    <label style={labelStyle}>CLASS-SECTION</label>
                    <select 
                        style={selectStyle} 
                        value={selectedClassSection}
                        onChange={(e) => setSelectedClassSection(e.target.value)}
                        disabled={dropdownLoading || classSectionList.length === 0}
                    >
                        {dropdownLoading ? (
                            <option>Loading Classes...</option>
                        ) : (
                            classSectionList.map(item => (
                                <option key={item} value={item}>{item}</option>
                            ))
                        )}
                    </select>

                    <label style={labelStyle}>REPORT DATE</label>
                    <input type="date" style={selectStyle} />
                    <button style={btnStyle}>REPORT ON FEES</button>
                </div>
                {/* Right side */}
                <div>
                    <label style={labelStyle}>TO S.A.</label>
                    <select style={selectStyle}>
                        <option>S.A</option>
                    </select>
                    <label style={labelStyle}>SELECT FEE HEAD</label>
                    <select style={selectStyle} defaultValue="EXEMPLIFY">
                        <option>EXEMPLIFY</option>
                    </select>
                    <button style={btnStyle}>SEND</button>
                </div>
            </div>
        </div>
    );
};

const PreviousRecords = ({ isMobile, font }) => {
    const dataStyle = {
        textAlign: 'center',
        fontSize: isMobile ? '12px' : '14px',
        color: '#555',
        marginTop: '10px',
    };
    const valueStyle = {
        fontSize: isMobile ? '14px' : '16px',
        fontWeight: 'bold',
        color: '#333',
        margin: '5px 0',
    };
    const btnStyle = {
        backgroundColor: "#6b7983ff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: isMobile ? "10px" : "12px",
        fontWeight: '500',
        fontFamily: font,
        margin: '5px',
    };
    const inputStyle = {
        padding: "4px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        width: 'calc(50% - 10px)',
        display: 'inline-block',
        marginRight: '5px',
        marginBottom: '5px',
        fontSize: isMobile ? '12px' : '14px',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

  {/* Graph + Right Sidebar */}
  <div style={{ display: 'flex', gap: '10px' }}>
    
    {/* Graph - 80% */}
    <div style={{ flex: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '150px', marginBottom: '15px' }}>
        {/* Replace these divs with your actual BarChart component */}
        <div style={{ height: '150px', width: '20px', backgroundColor: '#945f4aff', borderRadius: '2px' }} title="Paid"></div>
        <div style={{ height: '100px', width: '20px', backgroundColor: '#ccc', borderRadius: '2px' }} title="Unpaid"></div>
      </div>
    </div>

    {/* Sidebar - 20% */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', fontSize: isMobile ? '10px' : '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column',  }}>
        <label>FROM:</label>
        <input type="date" style={{ ...inputStyle, width: '100%' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column',  }}>
        <label>TO:</label>
        <input type="date" style={{ ...inputStyle, width: '100%' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', }}>
        <label>CLASS:</label>
        <select style={{ ...inputStyle, width: '100%' }} defaultValue="CLASS">
          <option>CLASS</option>
        </select>
      </div>
    </div>

  </div>

  {/* TOTAL PAID / TOTAL UNPAID */}
  <div style={{ display: 'flex', justifyContent: 'space-around',  paddingTop: '5px' }}>
    <div style={{ flex: 1, textAlign: 'center', padding: '0 5px' }}>
      <div style={dataStyle}>TOTAL PAID</div>
      <div style={valueStyle}>₹ 2,01,8,92,132</div>
      <button style={{ ...btnStyle, marginTop: '5px' }}>VIEW LIST</button>
      <button style={btnStyle}>COPY PAID</button>
    </div>
    <div style={{ flex: 1, textAlign: 'center', padding: '0 5px' }}>
      <div style={dataStyle}>TOTAL UNPAID</div>
      <div style={valueStyle}>₹ 4,66,457,00</div>
      <button style={{ ...btnStyle, marginTop: '5px' }}>VIEW LIST</button>
      <button style={btnStyle}>ROUND OFF</button>
    </div>
  </div>



</div>

    );
};

const OtherIncome = ({ isMobile, font }) => {
    const dataStyle = {
        textAlign: 'center',
        fontSize: isMobile ? '12px' : '14px',
        color: '#555',
        marginTop: '10px',
    };
    const valueStyle = {
        fontSize: isMobile ? '16px' : '20px',
        fontWeight: 'bold',
        color: '#333',
        margin: '5px 0',
    };
    const btnStyle = {
        backgroundColor: "#6b7983ff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: isMobile ? "10px" : "12px",
        fontWeight: '500',
        fontFamily: font,
        margin: '5px',
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '100px', marginBottom: '15px' }}>
                {/* Placeholder for Line/Bar Chart */}
                <div style={{ height: '70px', width: '90%', border: '1px solid #ccc', position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: 0, left: '10%', height: '50%', width: '3px', backgroundColor: '#945f4aff' }}></div>
                    <div style={{ position: 'absolute', bottom: 0, left: '30%', height: '70%', width: '3px', backgroundColor: '#945f4aff' }}></div>
                    <div style={{ position: 'absolute', bottom: 0, left: '50%', height: '40%', width: '3px', backgroundColor: '#945f4aff' }}></div>
                    <div style={{ position: 'absolute', bottom: 0, left: '70%', height: '65%', width: '3px', backgroundColor: '#945f4aff' }}></div>
                </div>
            </div>
            <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                <div style={dataStyle}>TOTAL OTHER INCOMES</div>
                <div style={valueStyle}>₹ 4,37,94,200</div>
                <button style={btnStyle}>LIST OF DDL</button>
                <button style={btnStyle}>EDIT/DEAC</button>
                <button style={btnStyle}>UPDATE SA</button>
                <button style={btnStyle}>ADD NEW</button>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// --- RemindersCutoff Component (MODIFIED for single Class-Section dropdown) ---
// ----------------------------------------------------------------------
const RemindersCutoff = ({ isMobile, font, classSectionList, dropdownLoading }) => {
    // State to hold the selected combined class-section string (e.g., "1A")
    const [selectedClassSection, setSelectedClassSection] = useState(classSectionList.length > 0 ? classSectionList[0] : '');

    // Update default when list loads/changes
    useEffect(() => {
        if (classSectionList.length > 0 && !classSectionList.includes(selectedClassSection)) {
             setSelectedClassSection(classSectionList[0]);
        }
    }, [classSectionList, selectedClassSection]);
    
    const selectStyle = {
        padding: "4px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        width: '100%',
        marginBottom: '5px',
        fontSize: isMobile ? '12px' : '14px',
    };
    const btnStyle = {
        backgroundColor: "#6b7983ff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: isMobile ? "10px" : "12px",
        fontWeight: '500',
        fontFamily: font,
        margin: '5px 0',
    };
    const labelStyle = {
        fontSize: isMobile ? '10px' : '12px',
        fontWeight: 'bold',
        marginBottom: '2px',
        display: 'block',
    };

    return (
        <div style={{ marginTop: '10px' }}>
           <div style={{ ...sectionHeader, display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Colored circle */}
        <span
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "#ccdaeeff", // choose your color
            display: "inline-block",
            marginLeft: "5%",
          }}
        />
REMINDERS - CUTOFF
      </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                {/* Left side */}
                <div>
                    {/* Class-Section Dropdown */}
                    <label style={labelStyle}>CLASS-SECTION</label>
                    <select 
                        style={selectStyle}
                        value={selectedClassSection}
                        onChange={(e) => setSelectedClassSection(e.target.value)}
                        disabled={dropdownLoading || classSectionList.length === 0}
                    >
                         {dropdownLoading ? (
                            <option>Loading Classes...</option>
                        ) : (
                            classSectionList.map(item => (
                                <option key={item} value={item}>{item}</option>
                            ))
                        )}
                    </select>

                    <label style={labelStyle}>CUTOFF DATES</label>
                    <input type="date" style={selectStyle} />
                    <button style={btnStyle}>CUTOFF APTS, ASSIST</button>
                </div>
                {/* Right side */}
                <div>
                    <label style={labelStyle}>UNPAID LIST</label>
                    <select style={selectStyle} defaultValue="V. NANDA">
                        <option>V. NANDA</option>
                    </select>
                    <label style={labelStyle}>DATE OF REMINDER</label>
                    <input type="date" style={selectStyle} />
                    <button style={btnStyle}>CUTOFF</button>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// --- Main Component: AccountantFeesIncome (MODIFIED Styles) ---
// ----------------------------------------------------------------------
const AccountantFeesIncome = () => {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const font = "'Century Gothic', 'AppleGothic', sans-serif";
    
    // --- STATE HOOKS FOR DROPDOWN DATA (UNCHANGED FETCH, NEW COMBINED STATE) ---
    const [classList, setClassList] = useState([]);
    const [sectionList, setSectionList] = useState([]); 
    const [classSectionList, setClassSectionList] = useState([]); // NEW COMBINED STATE
    const [dropdownLoading, setDropdownLoading] = useState(false);
    // Placeholder data for Actions (based on image)
    const [actionItems] = useState([
        { id: 1, text: "REPORT/COMPLAIN UNPAID LIST SENT TO S.A.", status: "OK" },
        { id: 2, text: "REMINDER - CUTOFF V.NANDA 6A, CUTOFF APP. request", status: "OK" },
        { id: 3, text: "REMINDER - CUTOFF V.NANDA 6A, CUTOFF APP. request", status: "REJECTED" },
        { id: 4, text: "PREVIOUS RECORDS D. SINDIHA 7A, 2024 UNP. roundoff", status: "OK" },
    ]);

    // --- MODAL STATE FOR ALERTS/CONFIRMATIONS (UNCHANGED) ---
    const [modal, setModal] = useState({
        isVisible: false,
        message: '',
        type: 'alert',
        onConfirm: () => setModal({ ...modal, isVisible: false }),
        onCancel: () => setModal({ ...modal, isVisible: false }),
    });
    
    // --- MODAL STATE FOR CONTENT (Pay Fee / Edit Bill) (NEW) ---
    const [contentModal, setContentModal] = useState({
        isVisible: false,
        contentComponent: null, 
        title: '',
        className: '',
        sectionName: '',
    });

    const closeModal = () => {
        // Clear modal state and hide
        setContentModal({ 
            isVisible: false,
            contentComponent: null, 
            title: '',
            className: '',
            sectionName: '',
        });
    };
    
    // Helper to split "1A" into ["1", "A"] - DUPLICATED FOR MAIN COMPONENT'S USE
 // AccountantIncome.jsx (Define this function near the top or where your other utility functions are)

const splitClassSection = (combined) => {
    if (!combined) return ["", ""];

    // Remove ALL spaces
    const str = String(combined).trim().replace(/\s+/g, "");

    // Match 6A, 10B, etc.
    const adjacentMatch = str.match(/^(\d+)([A-Za-z]+)$/);
    if (adjacentMatch) {
        console.log("splitClassSection Match (Adjacent):", adjacentMatch[1], adjacentMatch[2]);
        return [adjacentMatch[1], adjacentMatch[2].toUpperCase()];
    }

    return [str, ""];
};

    // --- API FETCH LOGIC (MODIFIED to also create the combined list) ---
    const fetchMetadata = useCallback(async () => {
        setDropdownLoading(true);
        const schoolCode = getSchoolCode(); 
        try {
            const [classRes, sectionRes] = await Promise.all([
                axios.get(`${API_BASE}/classes?schoolCode=${schoolCode}`),
                axios.get(`${API_BASE}/sections?schoolCode=${schoolCode}`),
            ]);
            
            const fetchedClasses = classRes.data || [];
            const fetchedSections = sectionRes.data || [];
            
            setClassList(fetchedClasses);
            setSectionList(fetchedSections);

            // SIMULATION: Create combined class-section strings (e.g., "1A", "1B", "2A")
            // This assumes all sections apply to all classes for simplicity, but a real
            // implementation would require a dedicated API endpoint for valid pairs.
            const combinedList = [];
            if (fetchedClasses.length > 0 && fetchedSections.length > 0) {
                 fetchedClasses.forEach(c => {
                    // Assuming class names are numbers that precede the section letter
                    fetchedSections.forEach(s => {
                        combinedList.push(`${c}${s}`); 
                    });
                });
            }
            
            // Add a fallback option if the combined list is empty
            if (combinedList.length === 0) {
                 if (fetchedClasses.length > 0) {
                     combinedList.push(fetchedClasses[0]); // Use first class as a default
                 } else {
                     combinedList.push('N/A');
                 }
            }
            
            setClassSectionList(combinedList);
            
        } catch (error) {
            console.error("Error fetching metadata:", error);
            setModal({
                isVisible: true,
                message: `ERROR: Failed to fetch dropdown data. ${error.message}`,
                type: 'alert',
                onConfirm: () => setModal({ ...modal, isVisible: false }),
            });
        }
        setDropdownLoading(false);
    }, [modal]);    
    
    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);
    
// AccountantIncome.jsx (Inside the AccountantFeesIncome component)

const handlePayFee = (combinedSelection) => {
    const [classSelection, sectionSelection] = splitClassSection(combinedSelection); 
    
    if (classSelection) {
        setContentModal({
            isVisible: true,
            contentComponent: PayementDemo, 
            className: classSelection,
            sectionName: sectionSelection, // This will now correctly be set to 'A'
        });
        console.log("Content Modal State Set:", {
            className: classSelection,
            sectionName: sectionSelection,
        });
    } else {
        setModal({
            isVisible: true,
            message: "Please select a Class-Section before proceeding to Pay Fee.",
            type: 'alert',
            onConfirm: () => setModal({ ...modal, isVisible: false }),
        });
    }
};
    
    const handleEditBill = (combinedSelection) => {
        const [classSelection, sectionSelection] = splitClassSection(combinedSelection);

        if (classSelection) {
            setContentModal({
                isVisible: true,
                contentComponent: GenerateBills, // Use imported GenerateBills
                title: `Edit Bill for ${classSelection}${sectionSelection}`,
                className: classSelection,
                sectionName: sectionSelection,
            });
        } else {
            setModal({
                isVisible: true,
                message: "Please select a Class-Section before proceeding to Edit Bill.",
                type: 'alert',
                onConfirm: () => setModal({ ...modal, isVisible: false }),
            });
        }
    };
    // ---------------------------------------------


    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // --- STYLES (MODIFIED for equal height/width) ---
    const outerContainer = {
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "20px" : "50px",
        height: "100vh",
        width: "100%",
        padding: isMobile ? "10px" : "20px",
        boxSizing: "border-box",
        backgroundColor: "#fff",   transformOrigin: "top left",
     
    };
    const container = {
        fontFamily: font,
        backgroundColor: "#fff",
        borderRadius: "16px",
        padding: isMobile ? "10px 5px" : "20px",
        boxSizing: "border-box",
        width: "100%",
        minWidth: "300px",
    };
    const header = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: "16px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding: isMobile ? "15px" : "25px",
        marginBottom: isMobile ? "15px" : "25px",
        flexWrap: isMobile ? "wrap" : "nowrap",
        gap: isMobile ? "10px" : "0",
    };
    const schoolTitle = {
        fontSize: isMobile ? "16px" : "20px",
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
        flex: isMobile ? "1 1 100%" : 1,
        order: isMobile ? 3 : 0,
        marginTop: isMobile ? "10px" : "0",
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
        color: "#fff",
    };
    
    // MODIFIED: Added alignItems: 'stretch' for height consistency
    const mainGrid = {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "3fr 1fr",
        gap: "5px",
        padding: "5px",
        alignItems: 'stretch', 
         backgroundColor: "transparent",
    };
    
    // MODIFIED: Added alignItems: 'stretch' for height consistency
    const feesManagementGrid = {
        display: "grid",
gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: "20px",
        alignItems: 'stretch',
        backgroundColor: "transparent",
                 //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++====

    };
    
    // MODIFIED: Added alignItems: 'stretch' for height consistency
    const incomeActivitiesGrid = {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", 
        gap: "20px",
        padding: "0 10px",
        marginBottom: '20px',
        alignItems: 'stretch',
        backgroundColor: "transparent",
    }


    return (
        <div style={outerContainer}>
            {/* Standard Alert/Confirm Modal */}
            <CustomModal
                isVisible={modal.isVisible}
                message={modal.message}
                type={modal.type}
                onConfirm={modal.onConfirm}
                onCancel={modal.onCancel}
            />
            
            {/* Content Modal for Pay Fee / Edit Bill */}

<CustomModal 
    isVisible={contentModal.isVisible} 
    title={contentModal.title} 
    type="content" 
    onCancel={closeModal}
>
    {contentModal.contentComponent && (
        <contentModal.contentComponent
            // CRITICAL: Passing both class and section as props
            className={contentModal.className} 
            sectionName={contentModal.sectionName}
            // You may need to pass other props like isMobile, font, etc., here too
        />
    )}
</CustomModal>

            <div>
              

                {/* Dashboard Title & Notification (FEES MANAGEMENT) */}
                <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: "600", color: "#945f4aff",  textAlign: "left", padding: "0 0" }}>
                    FEES MANAGEMENT
                </div>

                {/* --- FEES MANAGEMENT SECTION --- */}
                <div style={mainGrid}>
                    <div style={feesManagementGrid}>
    <CustomCardRight  isMobile={isMobile}>

    <div style={twoColumnLayout}>

        {/* LEFT SIDE – TRACK FEES */}
        <div style={sectionWrapper}>
            <div style={{ ...sectionHeader, display: "flex", alignItems: "center", gap: "8px" }}>
  {/* Colored circle */}
  <span
    style={{
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      backgroundColor: "#ccdaeeff", // choose your color
      display: "inline-block",
      marginLeft: "5%",
      marrinBottom: "0",
    }}
  />
  TRACK FEES
</div>
            <TrackFees isMobile={isMobile} font={font} />
        </div>

        {/* RIGHT SIDE – COLLECTIONS */}
        <div style={sectionWrapper}>
                 <div style={{ ...sectionHeader, display: "flex", alignItems: "center", gap: "8px" }}>
  {/* Colored circle */}
  <span
    style={{
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      backgroundColor: "#f3e7b0ff", // choose your color
      display: "inline-block",
      marginLeft: "5%",
      marrinBottom: "0",
    }}
  />
  COLLECTIONS
</div>
            <Collections 
                isMobile={isMobile}
                font={font}
                classSectionList={classSectionList}
                dropdownLoading={dropdownLoading}
                onPayFee={handlePayFee}
                onEditBill={handleEditBill}
            />
            <Discounts isMobile={isMobile} font={font} />
        </div>

    </div>

</CustomCardRight>

</div>


                    {/* Actions Card (Right Column) */}
                    <div style={{ flex: isMobile ? "1 1 100%" : 4 }}>
                        <CustomCard title="ACTIONS" isMobile={isMobile}>
                            <Actions actions={actionItems} isMobile={isMobile} font={font} />
                        </CustomCard>
                    </div>
                </div>

                {/* Dashboard Title (INCOME ACTIVITIES) */}
                <div style={{ fontSize: isMobile ? "18px" : "22px", fontWeight: "600", color: "#945f4aff", textAlign: "left", padding: "0 10px", marginTop: "20px" }}>
                    INCOME ACTIVITIES
                </div>

                {/* --- INCOME ACTIVITIES SECTION (3-column layout) --- */}
                {/* These three cards will now have equal height due to the CustomCard modification and grid style */}
                <div style={incomeActivitiesGrid}>
                    {/* 1. COMBINED REPORT/COMPLAIN AND REMINDERS - CUTOFF */}
                    <CustomCardRight isMobile={isMobile}>
  <div style={{ display: 'flex', gap: isMobile ? '15px' : '15px', position: 'relative' }}>
  
  {/* LEFT SIDE – REPORT/COMPLAIN & REMINDERS */}
  <div style={{ ...sectionWrapper, flex: 1 }}>
    <ReportComplain
      isMobile={isMobile}
      font={font}
      classSectionList={classSectionList}
      dropdownLoading={dropdownLoading}
    />
    <RemindersCutoff
      isMobile={isMobile}
      font={font}
      classSectionList={classSectionList}
      dropdownLoading={dropdownLoading}
    />
  </div>

  {/* Vertical line */}
  {!isMobile && (
    <div
      style={{
        width: '1px',
        backgroundColor: '#ccc',
      }}
    />
  )}

  {/* RIGHT SIDE – PREVIOUS RECORDS */}
  <div style={{ ...sectionWrapper, flex: 1 }}>
    <div style={{ ...sectionHeader, display: 'flex', alignItems: 'center', gap: '5px', }}>
      <span
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          backgroundColor: '#f3e7b0ff',
          display: 'inline-block',
          marginLeft: '5%',
        }}
      />
      PREVIOUS RECORDS
    </div>
    <PreviousRecords isMobile={isMobile} font={font} />
  </div>
</div>

</CustomCardRight>


                    {/* 3. OTHER INCOME */}
                    <CustomCard title="OTHER INCOME" isMobile={isMobile}>
                        <OtherIncome isMobile={isMobile} font={font} />
                    </CustomCard>
                </div>

            </div>
        </div>
    );
};

export default AccountantFeesIncome;