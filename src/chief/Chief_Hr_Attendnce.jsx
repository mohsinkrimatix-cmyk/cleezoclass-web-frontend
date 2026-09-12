import React, { useEffect, useState ,useRef} from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock,
  faUserTimes,
  faMoneyCheckAlt,
  faRupeeSign,
  faBriefcaseMedical,
  faMinusCircle,faTimes,
     faBookReader, faUserCheck, faTrophy, faExclamationCircle, faAward, faDownload,faEdit,faShareAlt,faPrint

} from "@fortawesome/free-solid-svg-icons";
import ErrorPopup from "../shared/ErrorPopup";

export default function EnrollmentBiometrics() {
  // ------------------------------
  // COMMON STYLES
  // ------------------------------
  const popupContentRef = useRef(null);

    const handlePrint = (title, contentRef) => {
    const content = contentRef.current;
    if (content) {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>' + title + '</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        thead tr { background-color: #f2f2f2; }
        /* Ensure table styles are included for printing */
        .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        .print-table thead tr { background-color: #f2f2f2; }
      `);
      printWindow.document.write('</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<h2>${title}</h2>`);
      // Use innerHTML of the ref content
      printWindow.document.write(content.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } else {
        setPopupMessage("No printable content found.");
    }
  };
  const [popupMessage, setPopupMessage] = useState("");

const handleDownload = (data, filename) => {
  if (!data || data.length === 0) {
    setPopupMessage("No data to download.");
    return;
  }
  
  // Use TAB (\t) as separator for better Excel compatibility
  const SEPARATOR = '\t'; 

  // Extract headers and format them (removing camelCase/underscores)
  const headers = Object.keys(data[0]);
  const headerRow = headers.map(header => 
      // Replace camelCase with spaces, replace underscores, and trim
      `"${header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}"`
  ).join(SEPARATOR);

  // Convert data rows
  const csvRows = data.map(row => 
    headers.map(header => {
      let value = row[header];
      if (typeof value === 'number') {
        // Ensure numbers are written as raw numbers (without commas) for Excel
        value = String(value);
      } else if (typeof value === 'string') {
        // Remove commas and newlines from strings to prevent breaking the TSV structure
        // Excel will read this better as the separator is a tab
        value = value.replace(/"/g, '""').replace(/,/g, '').replace(/\n/g, ' '); 
      } else if (value === null || value === undefined) {
        value = "-"; // Handle null/undefined values
      }
      return `"${value}"`;
    }).join(SEPARATOR)
  );

  const csvContent = [headerRow, ...csvRows].join('\n');
  
  // Use 'application/vnd.ms-excel' MIME type and .xls extension for better Excel recognition
  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement("a");
  
  if (link.download !== undefined) { 
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.xls`); // Changed to .xls
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
  const handleEdit = (title) => {
      // Placeholder for actual edit action
      setPopupMessage(`[ACTION REQUIRED] Opening edit mode for: ${title}. Implement logic to switch content to an editable form or navigate to an edit page.`);
  };
  const popupActionContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
    borderTop: "1px solid #ecf0f1",
    paddingTop: "15px",
  };

  const actionBtnStyle = {
   padding: "6px 12px", 
    background: "#2980B9", 
    color: "#fff", 
    border: "none", 
    borderRadius: "4px", 
    cursor: "pointer", 
    fontSize: "14px", 
    fontWeight: 'bold',
    display: "flex", 
    alignItems: "center",
    gap: "5px"
  };
  const outerContainer = {
        width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
        background: "#fff", minHeight: "70vh", padding: "0", boxSizing: "border-box",  
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
    top: "15px", // Keeps it at the top as before
    left: "5px", // Small margin left (adjust as needed)
    fontSize: "16px", // Font size 16px
    fontWeight: "800", // Font weight 800
    color: "#2F2E2EFF", // Text color (adjusted to match your specified color)
    textAlign: "left", // Aligns text to the left
    width: "auto", // Makes the width based on text content
    marginLeft: "2%"
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
    marginTop:"5%",
  };
const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  minHeight: "130px",
  boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
  fontSize: '12px',
  height: '100%',
  border: "2px solid #ccc",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center", // Centers content vertically within the card
  alignItems: "center", // Centers content horizontally inside the card
};

const cardLarge = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  minHeight: "300px",
  boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
  border: "2px solid #ccc",
  height: '100%',
  minWidth: "700px",
};

    const cardLargeBottom = {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    minHeight: "205px",
    boxShadow: "0px 2px 12px rgba(0,0,0,0.1)",
    border: "2px solid #ccc",
    height: '70%',
    
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
  console.log("===== fetchIrregulars called =====");
  console.log("Current schoolCode:", schoolCode);
  console.log("Current filter:", filter);
  console.log("Selected Month-Year:", selectedMonthYear);

  const { month, year } = parseMonthYear(selectedMonthYear);
  console.log("Parsed month/year:", { month, year });

  try {
    const res = await axios.get(
      "https://cleezoclass.com:4000/teacher-list-of-irregulars",
      {
        params: {
          schoolCode,
          month: month || undefined,
          year: year || undefined,
          filter: filter || undefined,
        },
      }
    );

    console.log("✅ API Response:", res.data);
    console.log("Number of irregular teachers received===============:", res.data.length);

    setRecords(res.data);
    console.log("Records state updated. Current records length:", res.data.length);
  } catch (err) {
    console.error("❌ Error fetching irregular teachers:", err);
  } finally {
    console.log("===== fetchIrregulars finished =====");
  }
};


useEffect(() => {
  console.log("useEffect triggered due to filter change:", filter);
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

const [showPfPopup, setShowPfPopup] = useState(false);

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
  if (type === "PF") {
    setShowPfPopup(true);
  } else {
    setPopupMessage(`View Details for: ${type}`);
  }
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
    const iconStyle = { 
  fontSize: "30px", 
  color: "#4e4848ff", 
  background: "transparent", 
  borderRadius: "50%", 
  border: "1px solid #0f0c0cff", 
  padding: "5px",
  display: "flex",          // Ensure the icon is flex
  justifyContent: "flex-start", // Aligns to the left side of the container
  alignItems: "center",     // Vertically center the icon
};  // END COMMON STYLES

  const displayMonthYear = selectedMonthYear ? selectedMonthYear.replace('-', '/') : '';
const isAnyPopupOpen =
  showAdmissionsPopup ||
  showPfPopup ||
  showLatecomersPopup ||showAttendancePopup||
  showTeachersPopup;

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
      >        <h2 className="footprints">Attendance and Payroll</h2>
      <div style={innerContainer}>
        {/* LEFT COLUMN */}
        <div style={leftColumn}>
          <h2 style={{ textAlign: "left", fontSize: '14px',  }}>
            Process Pay Run for  {displayMonthYear || 'a selected date'}
          </h2>
          <div style={cardLarge}>
            {/* Month/Year Selection (Payroll Report) */}
            <div style={{ marginBottom: "15px", textAlign: "right" }}>
              
              {/* Single Month/Year Dropdown */}
              <select
                id="month-year"
  className="btn-dropdown"

                value={selectedMonthYear}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSelectedMonthYear(newValue);
                  fetchReport(newValue);
                }}
              >
                <option value="">Select</option>
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
                height: "100%",
                minHeight: "150px"
              }}>
                         <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
    <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>Employee Net Pay</h4>
  </div>
                
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0", color: "#2F2E2EFF",  }}>
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
                height: "100%",
                minHeight: "150px"
              }}>
                
           <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
    <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>Payment Date</h4>
  </div>          
       <p style={{ fontSize: "30px", fontWeight: "400", margin: "0", color: "#2F2E2EFF" }}>
  {report && report.last_payment_date
    ? new Date(report.last_payment_date).toLocaleDateString("en-IN")
    : "-"}
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
                height: "100%",
                minHeight: "150px"
              }}>
                   <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
    <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>Number of Employees</h4>
  </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0", color: "#2F2E2EFF", }}>
                  {report ? report.total_employees_paid : "0"}
                </p>
              </div>
            </div>
            <h2 style={{ textAlign: "left", fontSize: '14px', marginTop: '3%', }}>
              <i className="fas fa-money-bill" style={{ marginRight: "5px", fontSize: "12px", marginTop:'3%', }}></i>
              Process cutoff payments on {displayMonthYear || 'a selected date'}
            </h2>
          </div>
          <div style={cardLarge}>
            <div style={{
              
              borderRadius: "8px",
              padding: "5px",
              background: "#fff"
            }}>
              {/* Month/Year Selection (Deductions/Attendance Report) */}
              <div style={{ marginBottom: "10px", textAlign: "right" }}>
                
                {/* Single Month/Year Dropdown */}
                <select
                  id="month-year-deductions"
                                  style={{ padding: "4px", fontSize: "10px", borderRadius: "4px", border: "1px solid #ccc", minWidth: "80px", minHeight: "8px" }}

                  value={selectedMonthYear}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSelectedMonthYear(newValue);
                    fetchReport1(newValue);
                  }}
                >
                  <option value="">Select</option>
                  {monthYearOptions.map((mY) => (
                    <option key={mY} value={mY}>{mY}</option>
                  ))}
                </select>
              </div>
              {/* Boxes Row */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
                {/* Latecomers */}
                <div style={{ ...boxStyle }}>
                        <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    <FontAwesomeIcon icon={faUserClock} style={iconStyle} />
    <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>Latecomers</h4>
  </div>
                  
                  <p style={{ fontSize: "30px", fontWeight: "400px", margin: '5px 0' }}>{report1.late_count}</p>
                 <button
                    data-guide="attendance-btn-latecomers-view-details"
                    onClick={() => setShowLatecomersPopup(true)}
  className="btn-outline"

                  >
                    View Details
                  </button>
                </div>
                {/* Absentees */}
                <div style={{ ...boxStyle }}>
                  <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    <FontAwesomeIcon icon={faUserTimes} style={iconStyle} />
    <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>Absentees</h4>
  </div>
                  
                  <p style={{ fontSize: "30px", fontWeight: "400px", margin: '5px 0' }}>{report1.absent_count}</p>
                  <button
                    data-guide="attendance-btn-absentees-view-details"
                    onClick={() => setShowAttendancePopup(true)}
      className="btn-outline"

                  >
                    View Details
                  </button>
                </div>
                {/* PF */}
                <div style={{ ...boxStyle }}>
                  <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    <FontAwesomeIcon icon={faMoneyCheckAlt} style={iconStyle} />
    <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>PF</h4>
  </div>
                  
                  <p style={{ fontSize: "30px", fontWeight: "400px", margin: '5px 0' }}>₹{report1.total_pf}</p>
                  <button
                    data-guide="attendance-btn-pf-view-details"
                    onClick={() => handleView("PF")}
  className="btn-outline"

                  >
                    View Details
                  </button>
                </div>
                {/* Total Pay */}
                <div style={{ ...boxStyle }}>
                            <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    <FontAwesomeIcon icon={faRupeeSign} style={iconStyle} />
    <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>Total Pay</h4>
  </div>
            
                  
                  <p style={{ fontSize: "30px", fontWeight: "400px", margin: '5px 0' }}>₹{report1.total_pay}</p>
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
            <h3 style={{ fontSize: "30px", margin: "0" }}>{teachers.length}</h3>
            <button
              data-guide="attendance-btn-active-employees-view-list"
              onClick={() => setShowTeachersPopup(true)}
    className="btn-outline"

            >
              View List
            </button>
          </div>
          {/* ATTENDANCE */}
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0" }}>Attendance</h3>
            <h3 style={{ fontSize: "30px", margin: "0" }}>{records.length}</h3>
            <button
              data-guide="attendance-btn-attendance-view-list"
              onClick={() => setShowAttendancePopup(true)}
   className="btn-outline"

            >
              View List
            </button>
          </div>
          {/* ADMISSIONS */}
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0" }}>New Admissions</h3>
            <h3 style={{ fontSize: "30px", margin: "0" }}>{admissions.length}</h3>
            <button
              data-guide="attendance-btn-new-admissions-view-list"
              onClick={() => setShowAdmissionsPopup(true)}
  className="btn-outline"

            >
              View List
            </button>
          </div>
        </div>
            </div></div>

{createPortal(
  <>
{showPfPopup && (

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
  onClick={() => setShowPfPopup(false)}
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
    marginBottom: "10px",
  }}
>
  <div />

  <h2 style={{ textAlign: "center", margin: "0", fontSize: "16px" }}>
    💰 PF Details
  </h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-20px)",
    }}
    className="no-print"
  >
    <button onClick={() => handleEdit("PF Details")} className="actionBtnStyle" title="Share Content">
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button onClick={() => handlePrint("PF Details", popupContentRef)} className="actionBtnStyle" title="Print Content">
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button onClick={() => handleDownload([], "PFDetails")} className="actionBtnStyle" title="Download as XLS File">
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button onClick={() => setShowPfPopup(false)} className="actionBtnStyle">
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>

      <div ref={popupContentRef}>
        <p style={{ textAlign: "center", padding: "20px" }}>
          PF Total: ₹{report1.total_pf}
        </p>
        {/* Add a table or more details here if you have PF data */}
      </div>

      <button
        onClick={() => setShowPfPopup(false)}
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

      {/* POPUPS */}
      {/* Latecomers Popup */}
    {showLatecomersPopup && (
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
  onClick={() => setShowLatecomersPopup(false)} // Click outside closes popup
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
  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
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

  <h2 style={{ textAlign: "center", margin: "0", fontSize: "16px" }}>
    🕒 Latecomers for {displayMonthYear}
  </h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-20px)",
    }}
    className="no-print"
  >
    <button onClick={() => handleEdit("Latecomers Report")} className="actionBtnStyle" title="Share Content">
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button onClick={() => handlePrint("Latecomers Report", popupContentRef)} className="actionBtnStyle" title="Print Content">
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button onClick={() => handleDownload(latecomers, "LatecomersReport")} className="actionBtnStyle" title="Download as XLS File">
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button onClick={() => setShowLatecomersPopup(false)} className="actionBtnStyle">
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>

      <div ref={popupContentRef} style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px", border: "1px solid #ccc" }}>
          <thead>
            <tr style={{ background: "#0A4D82", color: "#fff", textAlign: "left" }}>
              <th style={{ ...thStyle, border: "1px solid #ccc" }}>ID</th>
              <th style={{ ...thStyle, border: "1px solid #ccc" }}>Name</th>
              <th style={{ ...thStyle, border: "1px solid #ccc" }}>Entry Time</th>
              <th style={{ ...thStyle, border: "1px solid #ccc" }}>Exit Time</th>
              <th style={{ ...tdStyle, border: "1px solid #ccc" }}>Total Late Days</th>
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
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.teacher_id}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.teacher_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.entry_time}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.exit_time || "-"}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc", fontWeight: "bold", color: "#c0392b" }}>{rec.working_hours}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#7f8c8d", border: "1px solid #ccc" }}>
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


     {showAttendancePopup && (
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
  onClick={() => setShowAttendancePopup(false)} // click outside closes popup
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
  onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
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

  <h2 style={{ textAlign: "center", margin: "0", fontSize: "16px" }}>
    📋 Irregular Attendance
  </h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-20px)",
    }}
    className="no-print"
  >
    <button onClick={() => handleEdit("Irregular Attendance")} className="actionBtnStyle" title="Share Content">
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button onClick={() => handlePrint("Irregular Attendance", popupContentRef)} className="actionBtnStyle" title="Print Content">
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button onClick={() => handleDownload(records, "IrregularAttendance")} className="actionBtnStyle" title="Download as XLS File">
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button onClick={() => setShowAttendancePopup(false)} className="actionBtnStyle">
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
        {["All", "Informed", "UnInformed"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type === "All" ? "" : type)}
            style={{
              padding: "5px 10px",
              borderRadius: "15px",
              cursor: "pointer",
              background: filter === type || (type === "All" && filter === "") ? "#3498db" : "#ecf0f1",
              color: filter === type || (type === "All" && filter === "") ? "#fff" : "#000",
              border: "none",
              fontSize: "12px",
            }}
          >
            {type}
          </button>
        ))}
      </div>

      <div ref={popupContentRef}>
        <table
          className="print-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            border: "1px solid #ccc", // 4-sided border
          }}
        >
          <thead>
             <tr style={{ background: "#0A4D82", color: "#fff", textAlign: "left" }}>
              <th style={{ ...thStyle, border: "1px solid #ccc" }}>ID</th>
              <th style={{ ...thStyle, border: "1px solid #ccc" }}>Name</th>
              <th style={{ ...thStyle, border: "1px solid #ccc" }}>Username</th>
              <th style={{ ...thStyle, border: "1px solid #ccc" }}>Designation</th>
              <th style={{ ...thStyle, border: "1px solid #ccc" }}>Total Absent Days</th>
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
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = index % 2 === 0 ? "#fdfdfd" : "#f5f9fc")
                  }
                >
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.teacher_id}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.teacher_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.username}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.designation || "-"}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc", fontWeight: "bold", color: "#c0392b" }}>
                    {rec.total_absent_days}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "15px", color: "#7f8c8d", fontSize: "12px", border: "1px solid #ccc" }}>
                  No irregular teachers found for this month
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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


      {/* Admissions Popup */}
     {/* Admissions Popup */}
{showAdmissionsPopup && (
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
  onClick={() => setShowAdmissionsPopup(false)} // click outside closes popup
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
  onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
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

  <h2 style={{ textAlign: "center", margin: "0", fontSize: "16px" }}>
    📝 New Admissions
  </h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-20px)",
    }}
    className="no-print"
  >
    <button onClick={() => handleEdit("New Admissions")} className="actionBtnStyle" title="Share Content">
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button onClick={() => handlePrint("New Admissions", popupContentRef)} className="actionBtnStyle" title="Print Content">
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button onClick={() => handleDownload(admissions, "NewAdmissions")} className="actionBtnStyle" title="Download as XLS File">
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button onClick={() => setShowAdmissionsPopup(false)} className="actionBtnStyle">
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>

      {loadingAdmissions ? (
        <p style={{ textAlign: "center", fontSize: "14px" }}>Loading admissions…</p>
      ) : admissionError ? (
        <p style={{ color: "red", textAlign: "center", fontSize: "14px" }}>{admissionError}</p>
      ) : (
        <div ref={popupContentRef}>
          <table
            className="print-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              border: "1px solid #ccc", // 4-sided border
            }}
          >
            <thead>
              <tr style={{ background: "#0A4D82", color: "#fff", textAlign: "left" }}>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>ID</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Student Name</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>DOB</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Class Applied</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Father Name</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Mother Name</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Phone</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>City</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map((student, index) => (
                <tr key={student.id} style={{ background: index % 2 === 0 ? "#fafafa" : "#f1f6fa" }}>
                    <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{student.id}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{student.student_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{formatDate(student.dob)}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{student.lead_admission_for}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{student.full_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{student.mother_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{student.mobile_number}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{student.address}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{formatDate(student.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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


  {/* Teachers Popup */}
{showTeachersPopup && (
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
  onClick={() => setShowTeachersPopup(false)} // click outside closes popup
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
  onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
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

        <h2 style={{ textAlign: "center", margin: "0", fontSize: "16px" }}>Teacher Details</h2>

        <div
          style={{
            justifySelf: "end",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            transform: "translateY(-20px)",
          }}
          className="no-print"
        >
          <button onClick={() => handleEdit("Teacher Details")} className="actionBtnStyle" title="Share Content">
            <FontAwesomeIcon icon={faShareAlt} />
          </button>

          <button onClick={() => handlePrint("Teacher Details", popupContentRef)} className="actionBtnStyle" title="Print Content">
            <FontAwesomeIcon icon={faPrint} />
          </button>

          <button onClick={() => handleDownload(teachers, "TeacherList")} className="actionBtnStyle" title="Download as XLS File">
            <FontAwesomeIcon icon={faDownload} />
          </button>

          <button onClick={() => setShowTeachersPopup(false)} className="actionBtnStyle">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>


      {loadingTeachers ? (
        <p style={{ textAlign: "center", fontSize: "14px" }}>Loading...</p>
      ) : teacherError ? (
        <p style={{ textAlign: "center", color: "red", fontSize: "14px" }}>{teacherError}</p>
      ) : (
        <div ref={popupContentRef}>
          <table
            className="print-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              border: "1px solid #ccc", // full border
            }}
          >
            <thead>
              <tr style={{ background: "#0A4D82", color: "#fff" }}>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>ID</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Name</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Gender</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Phone</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Designation</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>School</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, index) => (
                <tr key={t.id} style={{ background: index % 2 === 0 ? "#fafafa" : "#f1f6fa" }}>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{t.id}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{t.teacher_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{t.gender}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{t.phone_no}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{t.designation}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{t.school_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{t.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  </>,
  document.body
)}
     <ErrorPopup

        message={popupMessage} 
        onClose={() => setPopupMessage("")} 
      />
  
    </>
  );
}