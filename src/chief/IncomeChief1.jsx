import React, { useState, useEffect } from "react";
import axios from "axios";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRupeeSign, faBookReader,
  faExclamationCircle, faAward, faMoneyCheckAlt, faChartBar,
  faDownload, faPrint, faShareAlt // ADDED: Download, Print, and Share icons
} from "@fortawesome/free-solid-svg-icons";

// --- CHARTING LIBRARY IMPORTS ---
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- API Configuration ---
const API_BASE_URL = 'https://cleezoclass.com:4000'; 


// =======================================================
// CHART POPUP COMPONENT - ADDED ACTION BUTTONS
// =======================================================
const FeeChartPopup = ({ title, data, loading, onClose, selectedMonth }) => {
  if (!title) return null;
  
  const popupStyle = {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
    background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", 
    alignItems: "center", padding: "10px", zIndex: 2000
  };
  const contentStyle = {
    width: "90%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto", 
    background: "#fff", borderRadius: "8px", padding: "15px", display: "flex", 
    flexDirection: "column",
  };
  
  // --- NEW ACTION BUTTON STYLES ---
  const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "10px", 
    marginBottom: "15px"
  };

  const actionBtnStyle = {
    padding: "6px 12px", 
    background: "#2980B9", 
    color: "#fff", 
    border: "none", 
    borderRadius: "4px", 
    cursor: "pointer", 
    fontSize: "12px", 
    display: "flex", 
    alignItems: "center",
    gap: "5px"
  };
  // --- END NEW ACTION BUTTON STYLES ---

  return (
    <div style={popupStyle}>
      <div style={contentStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "18px" }}>{title}</h2>
        {/* Display selected month context */}
        {selectedMonth && <p style={{ textAlign: "center", fontSize: "14px", color: "#555" }}>Contextual Month: {selectedMonth}</p>}

        {/* --- START: ADDED ACTION BUTTONS --- */}
        <div style={actionBtnContainerStyle}>
          <button onClick={() => alert("Download functionality to be implemented.")} style={actionBtnStyle}>
            <FontAwesomeIcon icon={faDownload} /> Download
          </button>
          <button onClick={() => window.print()} style={actionBtnStyle}>
            <FontAwesomeIcon icon={faPrint} /> Print
          </button>
          {/* Share button uses the Web Share API or a fallback alert */}
          <button onClick={() => {
              if (navigator.share) {
                  navigator.share({
                      title: title,
                      text: `Check out this fee chart for ${selectedMonth}`,
                      url: window.location.href,
                  }).catch(console.error);
              } else {
                  alert("Web Share API not supported on this browser.");
              }
          }} style={actionBtnStyle}>
            <FontAwesomeIcon icon={faShareAlt} /> Share
          </button>
        </div>
        {/* --- END: ADDED ACTION BUTTONS --- */}

        {loading ? (
          <p style={{ textAlign: "center", fontSize: "14px" }}>Loading chart data...</p>
        ) : data.length === 0 ? (
          <p style={{ textAlign: "center", fontSize: "14px" }}>No chart data found for the last 6 months.</p>
        ) : (
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                />
                <Legend />
                <Bar dataKey="TotalCollected" fill="#3498db" name="Total Collected Fee" />
                <Bar dataKey="TotalExpected" fill="#e74c3c" name="Total Expected Fee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: "15px", padding: "6px 12px", background: "rgba(141,171,182,255)", 
            color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", 
            alignSelf: 'flex-end', fontSize: "12px",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// =======================================================
// LIST POPUP COMPONENT - ADDED ACTION BUTTONS
// =======================================================
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
    width: "90%", maxWidth: "1000px", maxHeight: "90vh", overflowY: "auto", 
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

  // --- NEW ACTION BUTTON STYLES ---
  const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "10px", 
    marginBottom: "15px"
  };

  const actionBtnStyle = {
    padding: "6px 12px", 
    background: "#2980B9", 
    color: "#fff", 
    border: "none", 
    borderRadius: "4px", 
    cursor: "pointer", 
    fontSize: "12px", 
    display: "flex", 
    alignItems: "center",
    gap: "5px"
  };
  // --- END NEW ACTION BUTTON STYLES ---

  return (
    <div style={popupStyle}>
      <div style={contentStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "5px", fontSize: "18px" }}>{title}</h2>
        {/* Display selected month context */}
        {selectedMonth && <p style={{ textAlign: "center", fontSize: "14px", color: "#555", marginBottom: "10px" }}>Contextual Month: {selectedMonth}</p>}

        {/* --- START: ADDED ACTION BUTTONS --- */}
        <div style={actionBtnContainerStyle}>
          <button onClick={() => alert("Download functionality to be implemented.")} style={actionBtnStyle}>
            <FontAwesomeIcon icon={faDownload} /> Download
          </button>
          <button onClick={() => window.print()} style={actionBtnStyle}>
            <FontAwesomeIcon icon={faPrint} /> Print
          </button>
          {/* Share button uses the Web Share API or a fallback alert */}
          <button onClick={() => {
              if (navigator.share) {
                  navigator.share({
                      title: title,
                      text: `Check out this fee detail report for ${selectedMonth}`,
                      url: window.location.href,
                  }).catch(console.error);
              } else {
                  alert("Web Share API not supported on this browser.");
              }
          }} style={actionBtnStyle}>
            <FontAwesomeIcon icon={faShareAlt} /> Share
          </button>
        </div>
        {/* --- END: ADDED ACTION BUTTONS --- */}

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


export default function IncomeChief() {
  // --- STATE HOOKS ---
  const [feeTotals, setFeeTotals] = useState({
    totalFeeExpected: 0,
    totalFeePaid: 0,
    totalAdmissionExpected: 0,
    totalAdmissionPaid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Popup state for detailed lists
  const [showFeeDetailsPopup, setShowFeeDetailsPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupData, setPopupData] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupMonth, setPopupMonth] = useState(null); // State for contextual month

  // Chart state
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [chartTitle, setChartTitle] = useState("");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartMonth, setChartMonth] = useState(null); // State for contextual month


  // Function to safely retrieve schoolCode from LocalStorage
  const getSchoolCode = () => {
    return localStorage.getItem('schoolCode');
  };

  // --- API CALL FUNCTIONS ---

  // 1. Fetch Summary Totals
  useEffect(() => {
    const schoolCode = getSchoolCode();
    if (!schoolCode) {
      setError("School code not found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchTotals = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/feereport/getfeereporttotal?schoolCode=${schoolCode}`);
        const data = response.data;

        if (data && data.length > 0) {
          setFeeTotals({
            totalFeeExpected: data[0].TotalFeeExpected || 0,
            totalFeePaid: data[0].TotalFeePaid || 0,
            totalAdmissionExpected: data[0].TotalAdmissionExpected || 0,
            totalAdmissionPaid: data[0].TotalAdmissionPaid || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching fee totals:", err);
        setError("Failed to fetch fee totals.");
      } finally {
        setLoading(false);
      }
    };

    fetchTotals();
  }, []);

  // 2. Fetch Detailed Report
  const fetchDetailReport = async (reportName, month) => {
    const schoolCode = getSchoolCode();
    setPopupLoading(true);
    setPopupData([]);
    setPopupTitle(reportName);
    setPopupMonth(month); // Set the contextual month
    setShowFeeDetailsPopup(true);

    try {
      const endpoint = `${API_BASE_URL}/api/feereport/getfeereportlist`;
      const params = new URLSearchParams({
        schoolCode,
        reportName,
        month,
      }).toString();

      const response = await axios.get(`${endpoint}?${params}`);
      const data = response.data;

      setPopupData(data || []);
    } catch (err) {
      console.error(`Error fetching ${reportName} report:`, err);
      setPopupData([]);
      // Do not set error in state, just console.log for silent failure
    } finally {
      setPopupLoading(false);
    }
  };

  // 3. Fetch Chart Data
  const fetchChartData = async (chartName, month) => {
    const schoolCode = getSchoolCode();
    setChartLoading(true);
    setChartData([]);
    setChartTitle(chartName);
    setChartMonth(month); // Set the contextual month
    setShowChartPopup(true);

    try {
      const endpoint = `${API_BASE_URL}/api/feereport/getfeereportchart`;
      const params = new URLSearchParams({
        schoolCode,
        chartName,
        month,
      }).toString();
      
      const response = await axios.get(`${endpoint}?${params}`);
      const data = response.data;
      
      // Process data: 'TotalExpected' and 'TotalCollected' are expected keys
      const processedData = data.map(item => ({
        ...item,
        // Convert month_year (YYYY-MM) to month_label (e.g., Aug 2025)
        month_label: new Date(item.month_year.split('-')[0], item.month_year.split('-')[1] - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));

      setChartData(processedData || []);
    } catch (err) {
      console.error(`Error fetching ${chartName} chart:`, err);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleView = (reportName) => {
    // Current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);
    fetchDetailReport(reportName, currentMonth);
  };

  const handleViewChart = (chartName) => {
    // Pass null for month to fetch general 6-month data
    fetchChartData(chartName, null);
  };

  const closeFeeDetailsPopup = () => {
    setShowFeeDetailsPopup(false);
    setPopupData([]);
    setPopupTitle("");
    setPopupMonth(null);
  };

  const closeChartPopup = () => {
    setShowChartPopup(false);
    setChartData([]);
    setChartTitle("");
    setChartMonth(null);
  };


  // --- STYLES (Existing) ---
  const containerStyle = {
    padding: '20px',
    backgroundColor: '#f4f4f9',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif'
  };

  const dashboardGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  };

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '10px',
    gap: '10px'
  };

  const iconStyle = {
    fontSize: '24px',
    color: '#3498db'
  };

  const btnStyle = {
    padding: '8px 15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
    marginTop: '15px'
  };
  
  const btnStylebottom = {
    padding: '6px 12px',
    backgroundColor: 'rgba(141,171,182,255)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background-color 0.3s',
    marginTop: '10px',
    alignSelf: 'flex-end',
    width: '120px', // Fixed width for alignment
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };


  // --- RENDER ---
  if (loading) {
    return <div style={containerStyle}><p>Loading fee data...</p></div>;
  }

  if (error) {
    return <div style={containerStyle}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  }


  return (
    <div style={containerStyle}>
      <h1 style={{ marginBottom: '20px', color: '#2c3e50', fontSize: '24px' }}>Fee Income Dashboard</h1>

      {/* Main Stats Grid */}
      <div style={dashboardGridStyle}>

        {/* Total Fee Expected */}
        <div style={{ ...cardStyle, borderLeft: '5px solid #e74c3c' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
                <div style={headerStyle}>
                  <FontAwesomeIcon icon={faRupeeSign} style={{ ...iconStyle, color: '#e74c3c' }} />
                  <h4 style={{ fontSize: '12px', margin: '5px 0 0 0' }}>Total Monthly Fee Expected</h4>
                </div>
                <p style={{ fontSize: '40px', fontWeight: '400px', margin: '5px 0' }}>
                  {/* FIX APPLIED: Use nullish coalescing (?? 0) to prevent 'toLocaleString' on undefined */}
                  {(feeTotals.totalFeeExpected ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </p>
                <button onClick={() => handleView("FeeExpectedReport")} style={btnStylebottom}>View Report</button>
            </div>
            <button onClick={() => handleViewChart("ExpectedFeeChart")} style={{ ...btnStylebottom, width: '90px' }}>
                <FontAwesomeIcon icon={faChartBar} /> Chart
            </button>
          </div>
        </div>

        {/* Total Fee Collected */}
        <div style={{ ...cardStyle, borderLeft: '5px solid #27ae60' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <div style={headerStyle}>
                <FontAwesomeIcon icon={faBookReader} style={{ ...iconStyle, color: '#27ae60' }} />
                <h4 style={{ fontSize: '12px', margin: '5px 0 0 0' }}>Total Monthly Fee Collected</h4>
              </div>
              <p style={{ fontSize: '40px', fontWeight: '400px', margin: '5px 0' }}>
                {/* FIX APPLIED: Use nullish coalescing (?? 0) to prevent 'toLocaleString' on undefined */}
                {(feeTotals.totalFeePaid ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
              </p>
              <button onClick={() => handleView("FeePaidReport")} style={btnStylebottom}>View Report</button>
            </div>
            <button onClick={() => handleViewChart("CollectedFeeChart")} style={{ ...btnStylebottom, width: '90px' }}>
                <FontAwesomeIcon icon={faChartBar} /> Chart
            </button>
          </div>
        </div>

        {/* Total Admission Fees Expected */}
        <div style={{ ...cardStyle, borderLeft: '5px solid #f39c12' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faExclamationCircle} style={{ ...iconStyle, color: '#f39c12' }} />
                  <h4 style={{ fontSize: "12px", margin: "5px 0 0 0" }}>Total Admission Fees Expected</h4>
                </div>                    
                <p style={{ fontSize: "40px", fontWeight: "400px", margin: '5px 0' }}>
                  {/* FIX APPLIED: Use nullish coalescing (?? 0) to prevent 'toLocaleString' on undefined */}
                  {(feeTotals.totalAdmissionExpected ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </p>
                <button onClick={() => handleView("AdmissionExpectedReport")} style={btnStylebottom}>View Report</button>
              </div>
            </div>
        </div>
        
        {/* Total Admission Fees Paid */}
        <div style={{ ...cardStyle, borderLeft: '5px solid #34495e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                  }}
                >
                  <FontAwesomeIcon icon={faMoneyCheckAlt} style={iconStyle} />
                  <h4 style={{ fontSize: "12px", margin: "5px 0 0 0" }}>Total Admission Fees</h4>
                </div>                    
                    <p style={{ fontSize: "40px", fontWeight: "400px", margin: '5px 0' }}>
                      {/* FIX APPLIED: Use nullish coalescing (?? 0) to prevent 'toLocaleString' on undefined */}
                      {(feeTotals.totalAdmissionPaid ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>
                    <button onClick={() => handleView("AdmissionPaidReport")} style={btnStylebottom}>View Report</button>
                  </div>
                </div>
              </div>
          </div>
       
      {/* FEE DETAILS LIST POPUP RENDER */}
      {showFeeDetailsPopup && (
        <FeeDetailsPopup 
          title={popupTitle} 
          data={popupData} 
          loading={popupLoading}
          selectedMonth={popupMonth} // Pass month to popup
          onClose={closeFeeDetailsPopup} 
        />
      )}

      {/* CHART POPUP RENDER */}
      {showChartPopup && (
        <FeeChartPopup 
          title={chartTitle} 
          data={chartData} 
          loading={chartLoading}
          selectedMonth={chartMonth} // Pass month to popup
          onClose={closeChartPopup} 
        />
      )}
    </div>
  );
}