import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock, faUserTimes, faBookReader, faUserCheck, faTrophy, faExclamationCircle, faAward,
  // ADDED ICONS: Print, Download, Edit
  faPrint, faDownload, faEdit, faTimes, 
  faShareAlt
} from "@fortawesome/free-solid-svg-icons";

export default function EnrollmentBiometrics() {
  // ADDED: Ref to the content for printing/downloading
  const popupContentRef = useRef(null);
  
  // --- ADDED: Action Button Handlers ---
  const handlePrint = (title, contentRef) => {
    const content = contentRef.current;
    if (content) {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>' + title + '</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #2c3e50; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        thead tr { background-color: #f2f2f2; }
      `);
      printWindow.document.write('</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<h2>${title}</h2>`);
      printWindow.document.write(content.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  /**
   * CORRECTED: Ensure 'data' is an array of objects for TSV/Excel download.
   */
  const handleDownload = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No data to download.");
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
          // Remove quotes and newlines from strings to prevent breaking the TSV structure
          value = value.replace(/"/g, '""').replace(/\n/g, ' '); 
        }
        // Excel will read this better as the separator is a tab
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
      // Ensure the filename is used correctly
      link.setAttribute("download", `${filename}.xls`); 
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  const handleEdit = (title) => {
      // Placeholder for actual edit action
      alert(`[ACTION REQUIRED] Opening edit mode for: ${title}. Implement logic to switch content to an editable form or navigate to an edit page.`);
  };

  // --- ADDED: Best CSS Styles for Popups ---
  const popupModalStyle = {
  position: "fixed",
    left: 0,
    width: "54vw",
    height: "87vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  const popupContentStyle = {
  backgroundColor: "#fff",
    borderRadius: "16px",
    width: "95%",
    maxWidth: "1000px",
 height: "70vh",    padding: "20px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        animation: "fadeIn 0.3s ease-in-out",
  };

    const popupHeaderStyle = {
    paddingBottom: "0",
    margin: "0 0 10px 0",
    fontSize: "16px",
    color: "#2c3e50",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: "1.1",
  };

  
  const popupCloseBtnStyle = {
    position: "absolute",
    top: "15px",
    right: "15px",
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#e74c3c",
    transition: "color 0.2s",
  };
  
    const popupActionContainerStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  display: "flex",
  gap: "10px",
  alignItems: "center",
  zIndex: 2,
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
    gap: "5px",
   
  };
  // END ADDED STYLES/HANDLERS
  
  // COMMON STYLES (Existing)
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
  fontSize: '12px',
  height: '100%',
  border: "2px solid #ccc",
  
  display: "flex",
  flexDirection: "column",
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
   const btnStyle = {
        padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer",
            background: "transparent",
 color: "#ccc", fontSize: "11px", marginTop: "5px",
        width:"auto"
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
  const thStyle = {
  padding: "8px",
  textAlign: "center",
  fontWeight: "bold",
  fontSize: "12px",
  border: "2px solid #ccc"
};
  const tdStyle = {
    padding: "12px",
    textAlign: "center",
    fontSize: "14px",
    borderBottom: "1px solid #e0e0e0",
    borderLeft: "1px solid #f0f0f0",
  };
const boxStyle = {
    flex: 1,
    padding: "8px",
    borderRight: "1px solid #ccc",
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
  display: "flex",          // Ensure the icon is flex
  justifyContent: "flex-start", // Aligns to the left side of the container
  alignItems: "center",     // Vertically center the icon
};  // END COMMON STYLES

  // STATES
  const [records, setRecords] = useState([]);
  const [biometricsRecords, setBiometricsRecords] = useState([]);
  const [filter, setFilter] = useState("");
  const [admissions, setAdmissions] = useState([]);
  const [students, setStudents] = useState([]);
    const [student, setStudent] = useState([]);

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState({
    records: true,
    biometrics: true,
    admissions: true,
    students: true,
    teachers: true
  });
  const [error, setError] = useState({
    records: "",
    biometrics: "",
    admissions: "",
    students: "",
    teachers: ""
  });
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);
  const [showAdmissionsPopup, setShowAdmissionsPopup] = useState(false);
  const [showStudentsPopup, setShowStudentsPopup] = useState(false);
  const [showTeachersPopup, setShowTeachersPopup] = useState(false);
  const [attendanceSource, setAttendanceSource] = useState('');
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedMonthForBiometrics, setSelectedMonthForBiometrics] = useState("");
  const [showLeavesPopup, setShowLeavesPopup] = useState(false);
  const [requests, setRequests] = useState([]);
  const [walkInsCount, setWalkInsCount] = useState(420);
  const [passedTestsCount, setPassedTestsCount] = useState(0);
  const [showHighScorePopup, setshowHighScorePopup] = useState(false);
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
  const months = [
    "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
    "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
  ];

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    if (dateString.includes('T')) {
      dateString = dateString.split('T')[0];
    }
    const date = new Date(dateString);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  /**
   * Function to filter Irregular records by the selected month.
   */
  const filterIrregularsByMonth = (data, monthYear) => {
    if (!monthYear || !data || data.length === 0) return [];
    return data.filter(record => {
      const recordDate = record.date;
      if (!recordDate) return false;
      const recordMonthYear = recordDate.substring(0, 7);
      return recordMonthYear === monthYear;
    });
  };

  // Fetch top students with scores
  useEffect(() => {
    fetchTopStudents();
  }, []);

const fetchTopStudents = async () => {
  try {
    const response = await axios.get("https://cleezoclass.com:4000/top-students", {
      params: { schoolCode }
    });
    console.log("Fetched students:", response.data); // Log the response
    setStudent(response.data);
    // Assumes 65 is the passing score, matching the original logic
    setPassedTestsCount(response.data.filter(s => s.score > 65).length); 
  } catch (error) {
    console.error("Error fetching students:", error);
  } finally {
    setLoading(prev => ({ ...prev, student: false }));
  }
};

  // DATA FETCHING: Initial Load for other data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [admissionsRes, studentsRes, teachersRes] = await Promise.all([
          axios.get("https://cleezoclass.com:4000/newadmissions", { params: { schoolCode } }),
          axios.get("https://cleezoclass.com:4000/students-details", { params: { schoolCode } }),
          axios.post("https://cleezoclass.com:4000/api/users", { schoolCode, user_type: "teacher" }),
        ]);
        setAdmissions(admissionsRes.data);
        setStudents(studentsRes.data.students || []);
        setTeachers(teachersRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(prev => ({
          ...prev,
          admissions: "Failed to fetch admissions",
          students: "Failed to fetch students",
          teachers: "Failed to fetch teachers"
        }));
      } finally {
        setLoading(prev => ({
          ...prev,
          admissions: false,
          students: false,
          teachers: false
        }));
      }
    };
    fetchData();
  }, [schoolCode]);

  // DATA FETCHING: Attendance and Leaves based on selectedMonth
  const fetchAttendanceAndLeaves = async (month, isBiometrics = false) => {
    if (!month) return;
    const loadingKey = isBiometrics ? "biometrics" : "records";
    const errorKey = isBiometrics ? "biometrics" : "records";
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    setError(prev => ({ ...prev, [errorKey]: "" }));
    try {
      const [irregularsRes, leavesRes] = await Promise.all([
        axios.get("https://cleezoclass.com:4000/list-of-irregulars", { params: { schoolCode, month } }),
        axios.get("https://cleezoclass.com:4000/leave-requests-list", { params: { schoolCode, month } }),
      ]);

      const allIrregulars = irregularsRes.data.filter(
        rec => rec.leavetype && (rec.leavetype.toLowerCase() === "informed" || rec.leavetype.toLowerCase() === "uninformed")
      );
      const filteredIrregulars = filterIrregularsByMonth(allIrregulars, month);

      const filteredLeaves = leavesRes.data.filter(req => {
        const recordDate = req.start_date;
        if (!recordDate) return false;
        const recordMonthYear = recordDate.substring(0, 7);
        return recordMonthYear === month;
      });

      if (isBiometrics) {
        setBiometricsRecords(filteredIrregulars);
      } else {
        setRecords(filteredIrregulars);
        const currentWalkIns = 420;
        setWalkInsCount(currentWalkIns);
      }
      setRequests(filteredLeaves);
    } catch (err) {
      console.error("Error fetching attendance and leaves:", err);
      setError(prev => ({
        ...prev,
        [errorKey]: "Failed to fetch attendance/leaves for selected month."
      }));
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Trigger data fetch when the month changes (Enrollments card)
  useEffect(() => {
    if (selectedMonth) {
      fetchAttendanceAndLeaves(selectedMonth);
    } else {
      setRecords([]);
    }
  }, [selectedMonth, schoolCode]);

  // Trigger data fetch when the month changes (Biometrics card)
  useEffect(() => {
    if (selectedMonthForBiometrics) {
      fetchAttendanceAndLeaves(selectedMonthForBiometrics, true);
    } else {
      setBiometricsRecords([]);
      setRequests([]);
    }
  }, [selectedMonthForBiometrics, schoolCode]);

  const handleShowAttendancePopup = (source) => {
    setAttendanceSource(source);
    setShowAttendancePopup(true);
  };
const isAnyPopupOpen =
  showAdmissionsPopup ||
  showHighScorePopup ||
  showStudentsPopup ||
  showLeavesPopup;

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
      >   
      <h2 className="footprints">Enrollments and Biometrics</h2>
      <div className={isAnyPopupOpen ? "blur-background-active" : ""}>

      <div style={innerContainer}>
        {/* LEFT COLUMN */}
        <div style={leftColumn}>
          {/* Card 1: Enrollments */}
          <div style={cardLarge}>
            <div style={{ marginBottom: "15px", textAlign: "right" }}>
              <select
                id="month"
                className="btn-dropdown"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Select Month</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
              <div style={boxStyle}>
                <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
    <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
    <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>Walk-ins</h4>
  </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0", color: "#2F2E2EFF", }}> ({admissions.length})</p>
               <button
                  data-guide="enrollment-btn-walkins-view-list"
                  className="btn-outline"
                  onClick={() => setShowAdmissionsPopup(true)}
                >
                  View List
                </button>
              </div>
              <div style={boxStyle}>
                <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <FontAwesomeIcon icon={faUserCheck} style={iconStyle} />
                <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>Passed Tests</h4>
                </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0", color: "#2F2E2EFF", }}>{passedTestsCount}</p>
                <button
                  data-guide="enrollment-btn-passed-tests-view-list"
                  className="btn-outline"
                  onClick={() => setshowHighScorePopup(true)}
                >
                  View List
                </button>
              </div>
              <div style={boxStyle}>
                <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <FontAwesomeIcon icon={faTrophy} style={iconStyle} />
                <h4 style={{ margin: "0 0 5px 0", fontSize: "16px" , marginLeft: '20px' }}>Admissions</h4>
                </div>
                <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0", color: "#2F2E2EFF", }}>{admissions.length}</p>
                <button
                  data-guide="enrollment-btn-admissions-view-list"
                  className="btn-outline"
                  onClick={() => setShowAdmissionsPopup(true)}
                >
                  View List
                </button>
              </div>
            </div>

            <div style={{ 
    marginTop: "10px", 
    borderTop: "1px solid #ccc", 
    paddingTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
}}>
    
    <h2 style={{ 
        textAlign: "left",
        fontSize: "12px",
        margin: 0,
        display: "flex",
        alignItems: "center",
        lineHeight: "16px"
    }}>
        <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: "6px", fontSize: "12px" }} />
        14 admissions pending approval
    </h2>

    <h2 style={{ 
        textAlign: "left",
        fontSize: "12px",
        margin: 0,
        display: "flex",
        alignItems: "center",
        lineHeight: "25px"
    }}>
        <FontAwesomeIcon icon={faAward} style={{ marginRight: "6px", fontSize: "12px" }} />
        100 rejected in the written test
    </h2>

    <h2 style={{ 
        textAlign: "left",
        fontSize: "12px",
        margin: 0,
        display: "flex",
        alignItems: "center",
        lineHeight: "16px"
    }}>
        <FontAwesomeIcon icon={faAward} style={{ marginRight: "6px", fontSize: "12px" }} />
        50 rejected in counselling
    </h2>

</div>

          </div>
          {/* Card 2: Biometrics/Attendance Data */}
          <div style={cardLargeBottom}>
            <div style={{ marginBottom: "15px", textAlign: "right" }}>
              <select
                id="monthForBiometrics"
                className="btn-dropdown"
                value={selectedMonthForBiometrics}
                onChange={(e) => setSelectedMonthForBiometrics(e.target.value)}
              >
                <option value="">Select Month</option>
                {months.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {selectedMonthForBiometrics && loading.biometrics ? (
              <p style={{ textAlign: 'center' }}>Loading...</p>
            ) : selectedMonthForBiometrics && error.biometrics ? (
              <p style={{ textAlign: 'center', color: 'red' }}>{error.biometrics}</p>
            ) : (
              <div style={{ flex: "0 0 60%",borderRadius: "8px", padding: "15px", background: "transparent" }}>
                               <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
                  <div style={{ ...boxStyle, borderRight: '1px solid #ccc', display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <FontAwesomeIcon icon={faUserClock} style={iconStyle} />
                    <h4 style={{ margin: "0 0 5px 0", fontSize: '16px', marginLeft: '20px'}}>Irregular Attendance</h4>
                    </div>
                    <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0", color: "#2F2E2EFF", }}>{biometricsRecords.length}</p>
                    <button
                      data-guide="enrollment-btn-irregular-attendance-view-list"
                      onClick={() => handleShowAttendancePopup('biometrics')}
                      className="btn-outline"
    >
                      View List
                    </button>
                  </div>
                  <div style={{ ...boxStyle, borderRight: '1px solid #ccc', display: "flex", flexDirection: "column", alignItems: "center" }}>
                   
                   <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                     <FontAwesomeIcon icon={faUserTimes} style={iconStyle} />
                    <h4 style={{ margin: "0 0 5px 0", fontSize: '16px', marginLeft: '20px' }}>Absentees</h4>
                    </div>
                    <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0", color: "#2F2E2EFF", }}>{biometricsRecords.length}</p>
                    <button
                      data-guide="enrollment-btn-absentees-view-list"
                      onClick={() => handleShowAttendancePopup('biometrics')}
                      className="btn-outline"
                 >
                      View List
                    </button>
                  </div>
                  <div style={{ ...boxStyle, borderRight: 'none', display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <FontAwesomeIcon icon={faUserTimes} style={iconStyle} />
                    
                    <h4 style={{ margin: "0 0 5px 0", fontSize: '16px', minHeight: '20px', marginLeft: '20px' }}>Leave Requests</h4>
                    </div>
                    <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0", color: "#2F2E2EFF", }}>{requests.length}</p>
                    <button
                      data-guide="enrollment-btn-leave-requests-view-list"
                      onClick={() => setShowLeavesPopup(true)}
                      className="btn-outline"
                    >
                      View List
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
        {/* RIGHT COLUMN */}
                <div style={rightColumn}>
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Student Strength</h3>
            <h3 style={{ fontSize: "30px", fontWeight: "400px", margin: "0 0 5px 0" }}>{students.length}</h3>
            <div style={{ display: "flex", justifyContent: "center",  }}>
              <button
                data-guide="enrollment-btn-student-strength-view-list"
                onClick={() => setShowStudentsPopup(true)}
                className="btn-outline"
              >
                View List
              </button>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Unpunctual</h3>
            <h3 style={{ fontSize: "30px", margin: "0 0 5px 0" }}>{biometricsRecords.length}</h3>
            <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>Attendance</h3>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
              <button
                data-guide="enrollment-btn-unpunctual-view-list"
                onClick={() => handleShowAttendancePopup('biometrics')}
                className="btn-outline"
    
    
    >
                View List
              </button>
            </div>
          </div>
          <div style={card}>
            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}> Admissions </h3>
            <h3 style={{ fontSize: "30 px", margin: "0 0 5px 0" }}>{admissions.length}</h3>
            <h3 style={{ fontSize: "16px", margin: "0 0 5px 0" }}>Pending Approval</h3>
            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
              <button
                data-guide="enrollment-btn-admissions-approve"
                onClick={() => setShowAdmissionsPopup(true)}
                className="btn-outline"
            >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
</div></div>
           {/* POPUPS */}
      {createPortal(
        <>
    {showLeavesPopup && (

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
      zIndex: 2000
    }}

    onClick={() => setShowLeavesPopup(false)} // Click outside closes popup
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
  position: "relative",
  display: "flex",
  flexDirection: "column",
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

  <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  Leave Requests ({selectedMonthForBiometrics || 'All Time'})
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
    <button
      onClick={() => handleEdit("Leave Requests")}
      className="actionBtnStyle"
      title="Edit Content"
    >
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button
      onClick={() => handlePrint("Leave Requests", popupContentRef)}
      className="actionBtnStyle"
      title="Print Content"
    >
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button
      onClick={() => handleDownload(requests, "Leave_Requests")}
      className="actionBtnStyle"
      title="Download as XLS File"
    >
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button
      onClick={() => setShowLeavesPopup(false)}
      className="actionBtnStyle"
    >
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>


      {/* Content for Printing/Downloading */}
      <div ref={popupContentRef}>
        {loading.biometrics ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : error.biometrics ? (
          <p style={{ textAlign: "center", color: "red" }}>{error.biometrics}</p>
        ) : (
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse", 
            border: "1px solid #ccc", 
            fontSize: "12px" 
          }}>
            <thead>
              <tr style={{ background: "#0A4D82", color: "#fff" }}>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>ID</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Class</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Section</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Student Name</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Start Date</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>End Date</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Reason</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, index) => (
                <tr key={req.id} style={{ background: index % 2 === 0 ? "#fdfdfd" : "#f5f9fc" }}>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{req.id}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{req.class_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{req.section}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{req.student_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{formatDate(req.start_date)}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{formatDate(req.end_date)}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{req.reason}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{formatDate(req.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
)}


   {showStudentsPopup && (
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
      zIndex: 2000
    }}
    onClick={() => setShowStudentsPopup(false)} // Click outside closes popup
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
  position: "relative",
  display: "flex",
  flexDirection: "column",
}}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >

  
   
     

            <div
        style={{
  position: "relative",
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "flex-start",
  marginBottom: "8px",
  width: "100%",
}}
      >
        <div />

        <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  Student Details ({students.length})
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


          <button
            onClick={() => handleEdit("Student Details")}
            className="actionBtnStyle"
            title="Edit Content"
          >
            <FontAwesomeIcon icon={faShareAlt} />
          </button>

          <button
            onClick={() => handlePrint("Student Details", popupContentRef)}
            className="actionBtnStyle"
            title="Print Content"
          >
            <FontAwesomeIcon icon={faPrint} />
          </button>

          <button
            onClick={() => handleDownload(students, "Student_Details")}
            className="actionBtnStyle"
            title="Download as XLS File"
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>

          <button
            onClick={() => setShowStudentsPopup(false)}
            className="actionBtnStyle"
            title="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>


      {/* Content for Printing/Downloading */}
      <div ref={popupContentRef}>
        {loading.students ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : error.students ? (
          <p style={{ textAlign: "center", color: "red" }}>{error.students}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #ccc" }}>
            <thead>
              <tr style={{ background: "#0A4D82", color: "#fff" }}>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>ID</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Name</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Gender</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Phone</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Father Name</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Class</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Section</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>School</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, index) => (
                <tr 
                  key={s.id} 
                  style={{ background: index % 2 === 0 ? "#fcfcfc" : "#f3f8fb" }}
                >
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.id}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.gender}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.phone_no}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.father_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.class_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.section}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.school_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  </div>
)}

      {/* The remaining popups (showAttendancePopup, showAdmissionsPopup, showHighScorePopup) are corrected here. */}
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
      zIndex: 2000
    }}
    onClick={() => setShowAttendancePopup(false)} // Click outside closes popup
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
  position: "relative",
  display: "flex",
  flexDirection: "column",
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

  <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  Irregular Attendance ({attendanceSource === 'enrollments' ? selectedMonth : selectedMonthForBiometrics || 'All Time'})
</h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-25px)",
    }}
    className="no-print"
  >
    <button onClick={() => handleEdit("Irregular Attendance")} className="actionBtnStyle" title="Share Content">
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button onClick={() => handlePrint("Irregular Attendance", popupContentRef)} className="actionBtnStyle" title="Print Content">
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button
      onClick={() => {
        const dataToDownload = attendanceSource === 'enrollments' ? records : biometricsRecords;
        const filename = attendanceSource === 'enrollments' ? "Irregular_Attendance_Enrollments" : "Irregular_Attendance_Biometrics";
        handleDownload(dataToDownload, filename);
      }}
      className="actionBtnStyle"
      title="Download as XLS File"
    >
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button onClick={() => setShowAttendancePopup(false)} className="actionBtnStyle">
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>


      {/* Content for Printing/Downloading */}
      <div ref={popupContentRef}>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
          {["All", "Informed", "UnInformed"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type === "All" ? "" : type)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                cursor: "pointer",
                background: filter === type || (type === "All" && filter === "") ? "#ccc" : "#ecf0f1",
                color: filter === type || (type === "All" && filter === "") ? "#fff" : "#2c3e50",
                border: "none"
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {(() => {
          let displayRecords = [];
          let isLoading = false;
          let errorMessage = "";
          if (attendanceSource === 'enrollments') {
            displayRecords = records;
            isLoading = loading.records;
            errorMessage = error.records;
          } else {
            displayRecords = biometricsRecords;
            isLoading = loading.biometrics;
            errorMessage = error.biometrics;
          }
          const filteredList = displayRecords.filter(rec =>
            filter === "" || (rec.leavetype && rec.leavetype.toLowerCase() === filter.toLowerCase())
          );
          if (isLoading) return <p style={{ textAlign: "center", color: "#2980b9" }}>Loading irregulars...</p>;
          if (errorMessage) return <p style={{ textAlign: "center", color: "red" }}>{errorMessage}</p>;
          if (filteredList.length === 0) return <p style={{ textAlign: "center", color: "#555" }}>No irregular records found for the selected month and filter.</p>;

          return (
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
              <thead>
                <tr style={{ background: "#0A4D82", color: "#fff" }}>
                  <th style={{ ...thStyle, border: "1px solid #ccc" }}>ID</th>
                  <th style={{ ...thStyle, border: "1px solid #ccc" }}>Name</th>
                  <th style={{ ...thStyle, border: "1px solid #ccc" }}>Class</th>
                  <th style={{ ...thStyle, border: "1px solid #ccc" }}>Section</th>
                  <th style={{ ...thStyle, border: "1px solid #ccc" }}>Leave Type</th>
                  <th style={{ ...thStyle, border: "1px solid #ccc" }}>Date</th>
                  <th style={{ ...thStyle, border: "1px solid #ccc" }}>Username</th>
                  <th style={{ ...thStyle, border: "1px solid #ccc" }}>Submission Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((rec, index) => (
                  <tr key={index} style={{ background: index % 2 === 0 ? "#fdfdfd" : "#f5f9fc" }}>
                    <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.ID}</td>
                    <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.name}</td>
                    <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.class}</td>
                    <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.section}</td>
                    <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.leavetype}</td>
                    <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{formatDate(rec.date)}</td>
                    <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.username}</td>
                    <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{rec.submission_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      <button
        onClick={() => {
          setShowAttendancePopup(false);
          setAttendanceSource('');
        }}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#0A4D82",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          float: "right"
        }}
      >
        Close
      </button>
    </div>
  </div>
)}

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
      zIndex: 2000
    }}
    onClick={() => setShowAdmissionsPopup(false)} // Click outside closes popup
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
  position: "relative",
  display: "flex",
  flexDirection: "column",
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

        <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  Admissions ({admissions.length})
</h2>

        <div
          style={{
            justifySelf: "end",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            transform: "translateY(-20px)"
          }}
          className="no-print"
        >
          <button onClick={() => handleEdit("Admissions List")} className="actionBtnStyle" title="Share Content">
            <FontAwesomeIcon icon={faShareAlt} />
          </button>

          <button onClick={() => handlePrint("Admissions List", popupContentRef)} className="actionBtnStyle" title="Print Content">
            <FontAwesomeIcon icon={faPrint} />
          </button>

          <button onClick={() => handleDownload(admissions, "Admissions_List")} className="actionBtnStyle" title="Download as XLS File">
            <FontAwesomeIcon icon={faDownload} />
          </button>

          <button onClick={() => setShowAdmissionsPopup(false)} className="actionBtnStyle">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>


      {/* Content for Printing/Downloading */}
      <div ref={popupContentRef}>
        {loading.admissions ? (
          <p style={{ textAlign: "center", color: "#2980b9" }}>Loading admissions...</p>
        ) : error.admissions ? (
          <p style={{ textAlign: "center", color: "red" }}>{error.admissions}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
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
                <tr key={student.id} style={{ background: index % 2 === 0 ? "#fdfdfd" : "#f5f9fc" }}>
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
        )}
      </div>

      <button
        onClick={() => setShowAdmissionsPopup(false)}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#0A4D82",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          float: "right"
        }}
      >
        Close
      </button>
    </div>
  </div>
)}

     {showHighScorePopup && (
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
      zIndex: 2000
    }}
    onClick={() => setshowHighScorePopup(false)} // Click outside closes
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
  position: "relative",
  display: "flex",
  flexDirection: "column",
}}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >

            <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "flex-start",
          width: "100%",
          marginBottom: "8px",
        }}
      >
        <div />

        <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  High Scorers (Above 35 Marks) ({student.filter(s => s.score > 35).length})
</h2>

        <div
          style={{
            justifySelf: "end",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            transform: "translateY(-26px)"
          }}
          className="no-print"
        >
          <button onClick={() => handleEdit("High Scores List")} className="actionBtnStyle" title="Share Content">
            <FontAwesomeIcon icon={faShareAlt} />
          </button>

          <button onClick={() => handlePrint("High Scores List", popupContentRef)} className="actionBtnStyle" title="Print Content">
            <FontAwesomeIcon icon={faPrint} />
          </button>

          <button onClick={() => handleDownload(student.filter(s => s.score > 35), "High_Scores")} className="actionBtnStyle" title="Download as XLS File">
            <FontAwesomeIcon icon={faDownload} />
          </button>

          <button onClick={() => setshowHighScorePopup(false)} className="actionBtnStyle">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>


      {/* Content for Printing/Downloading */}
      <div ref={popupContentRef}>
        {loading.student ? (
          <p style={{ textAlign: "center", color: "#2980b9" }}>Loading scores...</p>
        ) : student.filter(s => s.score > 35).length === 0 ? (
          <p style={{ textAlign: "center", color: "red" }}>No students found with score above 35.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ccc" }}>
            <thead>
              <tr style={{ background: "#0A4D82", color: "#fff", textAlign: "left" }}>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>ID</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Student Name</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Class</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Subject</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Score</th>
                <th style={{ ...thStyle, border: "1px solid #ccc" }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {student.filter(s => s.score > 35).map((s, index) => (
                <tr key={s.id} style={{ background: index % 2 === 0 ? "#fdfdfd" : "#f5f9fc" }}>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.id}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.student_name}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.student_class}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.subject}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{s.score}</td>
                  <td style={{ ...tdStyle, border: "1px solid #ccc" }}>{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        onClick={() => setshowHighScorePopup(false)}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#0A4D82",
          color: "#fff",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          float: "right",
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

</>
  );
} // Close component
