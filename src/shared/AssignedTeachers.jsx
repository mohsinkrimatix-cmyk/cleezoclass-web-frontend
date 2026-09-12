import React, { useState, useRef, useEffect,useMemo } from 'react';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft } from 'react-icons/fi';
import { Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';


const TeacherDetails = () => {
    // Get today's date in YYYY-MM-DD format to set a maximum selectable date
    const today = new Date().toISOString().split('T')[0];

    // State for attendance data
    const [arrivedTeachers, setArrivedTeachers] = useState([]);
    const [unarrivedTeachers, setUnarrivedTeachers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(today); // Default to today
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
   
    // State for school and user info
    const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
    const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
    const userRole = localStorage.getItem('userRole');
const [showDetailsPopup, setShowDetailsPopup] = useState(false);
const [selectedTeacher, setSelectedTeacher] = useState(null);
const [loadingDetails, setLoadingDetails] = useState(false);
const [detailsError, setDetailsError] = useState(null);
const [selectedClass, setSelectedClass] = useState('');
const [performanceData, setPerformanceData] = useState(null);
const [modalState, setModalState] = useState({ visible: false, title: '', students: [] });
const [salaryData, setSalaryData] = useState({});
const contentToPrintRef = useRef(null);
const SCHOOL_START_TIME = '09:00:00';

    // Effect for fetching school-specific logo
    useEffect(() => {
        const fetchSchoolLogo = async () => {
            const code = localStorage.getItem('schoolCode');
            if (!code) {
                console.warn('No school code found in localStorage.');
                return;
            }
            setDynamicSchoolCode(code);
            try {
                const response = await axios.post('https://cleezoclass.com:4000/api/schoollogodynamic', { secretecode: code });
                if (response.data.logoPath) {
                    setDynamicLogoSrc(response.data.logoPath);
                }
            } catch (error) {
                console.error('Error fetching school logo:', error.response?.data || error.message);
            }
        };
        fetchSchoolLogo();
    }, []);

    // Effect for fetching attendance data when the date changes
    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!selectedDate) return;

            setLoading(true);
            setError(null);
            const currentSchoolCode = localStorage.getItem('schoolCode');
            if (!currentSchoolCode) {
                setError('School code missing. Please log in again.');
                setLoading(false);
                return;
            }

            try {
                const arrivedPromise = axios.get(`https://cleezoclass.com:4000/api/teachers_attendance/arrived`, {
                    params: { date: selectedDate, schoolCode: currentSchoolCode }
                });
                const unarrivedPromise = axios.get(`https://cleezoclass.com:4000/api/teachers_attendance/unarrived`, {
                    params: { date: selectedDate, schoolCode: currentSchoolCode }
                });

                const [arrivedResponse, unarrivedResponse] = await Promise.all([arrivedPromise, unarrivedPromise]);

                setArrivedTeachers(arrivedResponse.data);
                setUnarrivedTeachers(unarrivedResponse.data);

            } catch (err) {
                setError('Failed to connect to the server. Please ensure it is running and accessible.');
                console.error('Error fetching attendance data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendanceData();
    }, [selectedDate]);

    // Handler for the date input
    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };
const totalStudentsWithRecords = (performanceData?.results?.firstClass?.length ?? 0) + (performanceData?.results?.pass?.length ?? 0) + (performanceData?.results?.fail?.length ?? 0);
const totalPassedStudents = (performanceData?.results?.firstClass?.length ?? 0) + (performanceData?.results?.pass?.length ?? 0);
const passPercentage = totalStudentsWithRecords > 0 ? ((totalPassedStudents / totalStudentsWithRecords) * 100).toFixed(2) : "0.00";

    // --- BASE STYLES ---
    const linkStyle = { margin: "0 10px", textDecoration: "none", display: "flex", alignItems: "center" };
    const iconStyle = { padding: "10px", borderRadius: "50%", fontSize: "25px", transition: "all 0.3s", width: "40px", height: "40px", display: "flex", justifyContent: "center", alignItems: "center" };
   // ... (existing code)

useEffect(() => {
  if (selectedTeacher && selectedClass) {
    const perf = selectedTeacher.teaching.find(t => t.class === selectedClass);
    setPerformanceData(perf);
  }
}, [selectedClass, selectedTeacher]);

// ... (rest of the component)

    // --- PAGE-SPECIFIC STYLES ---
    const pageStyles = {
        container: {
            backgroundColor: '#f4f7f6',
            minHeight: 'calc(100vh - 100px)',
            padding: '40px',
            width: '100%',
        },
        card: {
            backgroundColor: '#ffffff',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '40px 50px',
            borderRadius: '12px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.07)',
        },
        mainTitle: {
            textAlign: 'center',
            fontSize: '32px',
            color: '#333',
            marginBottom: '30px',
            fontWeight: '600',
        },
        dateSelectorContainer: {
            textAlign: 'center',
            marginBottom: '40px',
        },
        dateLabel: {
             fontSize: '16px',
             marginRight: '10px',
             color: '#555',
             fontWeight: '500',
        },
        dateInput: {
             padding: '8px 12px',
             borderRadius: '6px',
             border: '1px solid #ccc',
             fontSize: '16px',
             backgroundColor: '#f8f9fa',
        },
        tablesContainer: {
            display: 'flex',
            flexDirection: 'row',
            gap: '50px',
        },
        tableWrapper: {
            flex: 1,
        },
        tableSubTitle: {
            textAlign: 'center',
            fontSize: '24px',
            color: '#444',
            marginBottom: '20px',
            fontWeight: '500',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
        },
        th: {
            backgroundColor: '#343a40',
            color: '#ffffff',
            padding: '14px 16px',
            borderBottom: 'none',
            textAlign: 'left',
            fontWeight: '600',
            fontSize: '15px',
        },
        td: {
            padding: '14px 16px',
            borderBottom: '1px solid #e9ecef',
            color: '#555',
            fontSize: '15px',
        },
        emptyRow: {
            textAlign: 'center',
            padding: '20px',
            color: '#777',
        }
    };
    const popupStyles = {
  modalOverlay: {
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
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    minWidth: '900px',
    maxWidth: '1200px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    position: 'relative',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '15px',
    marginBottom: '15px',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    border: 'none',
    background: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  popupPage: {
    fontFamily: "Segoe UI, sans-serif",
  },
  popupContainer: {
    padding: "20px 40px",
  },
  popupHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: '20px',
    borderBottom: '1px solid #e5e7eb',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  popupActions: {
    display: 'flex',
    gap: '10px',
  },
  popupActionButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  mainContent: {
    paddingTop: '30px',
  },
  profileCard: {
    display: "flex",
    gap: "30px",
    padding: "25px",
    borderRadius: "12px",
    border: '1px solid #eee',
    background: '#f9fafb',
  },
  profileInfo: {
    flex: 1,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px 30px',
  },
  infoItem: {
    fontSize: "16px",
    color: "#4b5563",
  },
  label: {
    fontWeight: "600",
    color: "#374151",
    display: 'block',
    marginBottom: '4px',
  },
  profilePhoto: {
    width: "150px",
    height: "150px",
    objectFit: "cover",
    borderRadius: "12px",
    border: "3px solid #f3f4f6",
  },
  box: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: "20px",
    marginTop: "30px",
    borderRadius: "12px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.04)",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "15px",
    color: "#374151",
  },
  dropdownContainer: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
  },
  dropdown: {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    flex: 1,
  },
  performanceBox: {
    border: "1px solid #e5e7eb",
    padding: "15px",
    borderRadius: "10px",
    background: "#f9fafb",
  },
  performanceItem: {
    marginBottom: '8px',
    fontSize: '15px',
  },
  clickableText: {
    cursor: 'pointer',
    color: '#3b82f6',
    textDecoration: 'none',
  },
  attendanceHeader: {
    display: "flex",
    fontWeight: '600',
    padding: "10px 0",
    borderBottom: "2px solid #d1d5db",
  },
  attendanceRow: {
    display: "flex",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  attendanceCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: '14px',
  },
  lateText: {
    color: '#f97316',
  },
  studentModalOverlay: {
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
  },
  studentModalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    minWidth: '400px',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  },
  studentModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '15px',
    marginBottom: '15px',
  },
  studentModalTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#111827',
  },
  studentModalCloseButton: {
    border: 'none',
    background: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  studentList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  studentListItem: {
    padding: '10px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  studentName: {
    fontWeight: '500',
    color: '#374151',
  },
  studentMarks: {
    fontSize: '14px',
    color: '#6b7280',
  }
};

const fetchBaseSalaryById = async (employeeId, schoolCode) => {
  const url = `https://cleezoclass.com:4000/api/salary/${employeeId}?schoolCode=${encodeURIComponent(schoolCode)}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
};

const handleRowClick = async (teacherId) => {
  setLoadingDetails(true);
  setShowDetailsPopup(true);
  setDetailsError(null);
  setSelectedClass('');
  const schoolCode = localStorage.getItem('schoolCode');
  if (!schoolCode) {
    setDetailsError("School code is missing.");
    setLoadingDetails(false);
    return;
  }
  try {
    const response = await fetch(`https://cleezoclass.com:4000/teacher/${teacherId}?schoolCode=${schoolCode}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch details for teacher with ID ${teacherId}. Server response: ${errorText}`);
    }
    const data = await response.json();
    setSelectedTeacher(data);
    if (data.teaching && data.teaching.length > 0) {
      setSelectedClass(data.teaching[0].class);
      setPerformanceData(data.teaching[0]);
    } else {
      setPerformanceData(null);
    }
    const salaryData = await fetchBaseSalaryById(teacherId, schoolCode);
    setSalaryData(salaryData);
  } catch (err) {
    setDetailsError(err.message);
    setSelectedTeacher(null);
  } finally {
    setLoadingDetails(false);
  }
};

const handleClosePopup = () => {
  setShowDetailsPopup(false);
  setSelectedTeacher(null);
  setPerformanceData(null);
  setSelectedClass('');
};

const calculateLateness = (entryTime) => {
  if (!entryTime || entryTime === 'Absent') return { text: '', isLate: false };
  if (entryTime > SCHOOL_START_TIME) {
    const startTime = new Date(`1970-01-01T${SCHOOL_START_TIME}Z`);
    const entryDate = new Date(`1970-01-01T${entryTime}Z`);
    const diffMs = entryDate - startTime;
    const diffMins = Math.round(diffMs / 60000);
    return { text: `${diffMins} min late`, isLate: true };
  }
  return { text: '', isLate: false };
};

const calculateWorkingHours = (entryTime, exitTime) => {
  if (!entryTime || !exitTime || entryTime === 'Absent' || exitTime === 'N/A') {
    return 'N/A';
  }
  const entryDate = new Date(`1970-01-01T${entryTime}`);
  const exitDate = new Date(`1970-01-01T${exitTime}`);
  if (exitDate < entryDate) {
    return 'N/A';
  }
  const diffMs = exitDate - entryDate;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${diffHours}h ${diffMins}m`;
};

const attendanceMap = useMemo(() => {
  if (!selectedTeacher?.attendance) return new Map();
  return new Map(selectedTeacher.attendance.map(att => [att.date, att]));
}, [selectedTeacher]);

const monthlyAttendance = useMemo(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const calendarDays = [];
  for (let day = 1; day <= today; day++) {
    const dateObj = new Date(year, month, day);
    const localYear = dateObj.getFullYear();
    const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const localDay = String(dateObj.getDate()).padStart(2, '0');
    const dateString = `${localYear}-${localMonth}-${localDay}`;
    const dayOfWeek = dateObj.toLocaleString('en-US', { weekday: 'short' });
    const record = attendanceMap.get(dateString);
    const latenessInfo = calculateLateness(record?.entry_time);
    const workingHours = calculateWorkingHours(record?.entry_time, record?.exit_time);
    const isAbsent = !record;
    calendarDays.push({
      date: `${dateString} (${dayOfWeek})`,
      entry: isAbsent ? 'N/A' : record?.entry_time,
      exit: isAbsent ? 'N/A' : record?.exit_time,
      status: isAbsent ? 'Absent' : 'Present',
      lateness: isAbsent ? 'N/A' : latenessInfo.text,
      isLate: latenessInfo.isLate,
      workingHours: workingHours
    });
  }
  return calendarDays;
}, [attendanceMap]);

const showStudents = (title, studentList) => {
  setModalState({ visible: true, title, students: studentList });
};

const closeModal = () => {
  setModalState({ visible: false, title: '', students: [] });
};

const handlePrintDetails = () => {
  const printContent = contentToPrintRef.current.innerHTML;
  const originalContent = document.body.innerHTML;
  document.body.innerHTML = printContent;
  window.print();
  document.body.innerHTML = originalContent;
  window.location.reload();
};

const handleDownloadDetails = () => {
  if (!contentToPrintRef.current) return;
  html2canvas(contentToPrintRef.current).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`teacher-details-${selectedTeacher.name}.pdf`);
  });
};

    return (
        <>
            {/* --- HEADER SECTION --- */}
            <header style={{ backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', position: 'sticky', top: '0', zIndex: '50', height: '100px', display: 'flex', alignItems: 'center' }}>
                <img src={dynamicLogoSrc || "/default-logo.png"} alt="School Logo" style={{ height: '80px', width: 'auto', position: 'absolute', left: '3rem', top: '50%', transform: 'translateY(-50%)' }} />
                <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'black' }}>
                        {dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL
                    </h1>
                </div>
            </header>

            <div className="outer-container" style={{ display: 'flex' }}>
                {/* --- SIDEBAR SECTION --- */}
              
               
                {/* --- MAIN CONTENT SECTION --- */}
                <main className="main-content" style={pageStyles.container}>
                    <div style={pageStyles.card}>
                        <h1 style={pageStyles.mainTitle}>Teacher Attendance</h1>

                        <div style={pageStyles.dateSelectorContainer}>
                            <label htmlFor="attendance-date" style={pageStyles.dateLabel}>Select Date:</label>
                            <input
                                type="date"
                                id="attendance-date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                style={pageStyles.dateInput}
                                max={today}
                            />
                        </div>
                       
                        {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}
                        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

                        {!loading && !error && (
                            <div style={pageStyles.tablesContainer}>
                                {/* Arrived Teachers Table */}
                                <div style={pageStyles.tableWrapper}>
                                    <h2 style={pageStyles.tableSubTitle}>Arrived Teachers</h2>
                                    <table style={pageStyles.table}>
                                        <thead>
                                            <tr>
                                                <th style={pageStyles.th}>ID</th>
                                                <th style={pageStyles.th}>Teacher Name</th>
                                                <th style={pageStyles.th}>Login Time</th>
                                                <th style={pageStyles.th}>Logout Time</th>
                                            </tr>
                                        </thead>
                                       <tbody>
  {arrivedTeachers.length > 0 ? arrivedTeachers.map(teacher => (
    <tr
      key={teacher.id}
      onClick={() => handleRowClick(teacher.id)}
      style={{ cursor: 'pointer' }}
    >
      <td style={pageStyles.td}>{teacher.id}</td>
      <td style={pageStyles.td}>{teacher.teacher_name}</td>
      <td style={pageStyles.td}>{teacher.login_time}</td>
      <td style={pageStyles.td}>{teacher.logout_time || 'N/A'}</td>
    </tr>
  )) : (
    <tr>
      <td colSpan="4" style={{...pageStyles.td, ...pageStyles.emptyRow}}>
        No teachers arrived on this date.
      </td>
    </tr>
  )}
</tbody>

                                    </table>
                                </div>

                                {/* Unarrived Teachers Table */}
                                <div style={pageStyles.tableWrapper}>
                                     <h2 style={pageStyles.tableSubTitle}>Unarrived Teachers</h2>
                                    <table style={pageStyles.table}>
                                        <thead>
                                            <tr>
                                                <th style={pageStyles.th}>ID</th>
                                                <th style={pageStyles.th}>Teacher Name</th>
                                                {/* UPDATED HEADER TEXT FOR CLARITY */}
                                                <th style={pageStyles.th}>Absences This Month (to date)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
  {unarrivedTeachers.length > 0 ? unarrivedTeachers.map(teacher => (
    <tr
      key={teacher.id}
      onClick={() => handleRowClick(teacher.id)}
      style={{ cursor: 'pointer' }}
    >
      <td style={pageStyles.td}>{teacher.id}</td>
      <td style={pageStyles.td}>{teacher.name}</td>
      <td style={pageStyles.td}>{teacher.absent_days}</td>
    </tr>
  )) : (
    <tr>
      <td colSpan="3" style={{...pageStyles.td, ...pageStyles.emptyRow}}>
        All teachers are accounted for.
      </td>
    </tr>
  )}
</tbody>

                                    </table>
                                </div>
                            </div>
                        )}
<style>{`
  @media print {
    .no-print {
      display: none !important;
    }
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`}</style>


                        {showDetailsPopup && (
  <div style={popupStyles.modalOverlay} >
    <div style={popupStyles.modalContent}>
      <button style={{ ...popupStyles.modalCloseButton, position: 'absolute', top: '10px', right: '15px' }} onClick={handleClosePopup}>&times;</button>
      <div ref={contentToPrintRef} style={popupStyles.popupPage}>
        <div style={popupStyles.popupContainer}>
          <header style={popupStyles.popupHeader} className="no-print">
            <div style={popupStyles.logoContainer}>
              <span style={{ color: "#111827", fontSize: "24px", fontWeight: "bold" }}>TAGSOLNOVALLP SCHOOL</span>
            </div>
            <div style={popupStyles.popupActions}>
              <button onClick={handlePrintDetails} style={popupStyles.popupActionButton}>Print</button>
              <button onClick={handleDownloadDetails} style={popupStyles.popupActionButton}>Download</button>
            </div>
          </header>
          <main style={popupStyles.mainContent}>
            {loadingDetails && <p style={{ textAlign: 'center' }}>Loading teacher details...</p>}
            {detailsError && <p style={{ textAlign: 'center', color: 'red' }}>Error: {detailsError}</p>}
            {selectedTeacher && (
              <>
                <div style={popupStyles.profileCard}>
                  <div style={popupStyles.profileInfo}>
                    <div style={popupStyles.infoGrid}>
                      <div style={popupStyles.infoItem}><span style={popupStyles.label}>Name:</span> {selectedTeacher.name}</div>
                      <div style={popupStyles.infoItem}><span style={popupStyles.label}>ID:</span> {selectedTeacher.id}</div>
                      <div style={popupStyles.infoItem}><span style={popupStyles.label}>Address:</span> {selectedTeacher.address}</div>
                      <div style={popupStyles.infoItem}><span style={popupStyles.label}>Subject:</span> {selectedTeacher.subjects}</div>
                      <div style={popupStyles.infoItem}><span style={popupStyles.label}>Classes:</span> {selectedTeacher.classes}</div>
                      <div style={popupStyles.infoItem}><span style={popupStyles.label}>Salary:</span> {salaryData.salary_amount || "Loading..."}</div>
                    </div>
                  </div>
                  <img src={selectedTeacher.photo} alt="Teacher" style={popupStyles.profilePhoto} />
                </div>
                <div style={popupStyles.box}>
                  <h3 style={popupStyles.sectionTitle}>Classes Taught & Performance</h3>
                  <div style={popupStyles.dropdownContainer}>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={popupStyles.dropdown}>
                      <option value="">-- Select Class --</option>
                      {selectedTeacher.teaching && selectedTeacher.teaching.map(t => <option key={t.class} value={t.class}>{t.class}</option>)}
                    </select>
                    <select value={selectedTeacher.subjects} style={popupStyles.dropdown} disabled>
                      <option>{selectedTeacher.subjects}</option>
                    </select>
                  </div>
                  {performanceData ? (
                    <div style={popupStyles.performanceBox}>
                      <p style={popupStyles.performanceItem}><strong>Total Students:</strong> {totalStudentsWithRecords}</p>
                      <p style={popupStyles.performanceItem}>
                        <strong style={popupStyles.clickableText} onClick={() => showStudents('1st Class Students', performanceData.results.firstClass)}>1st Class Students:</strong> {performanceData?.results?.firstClass?.length ?? 0}
                      </p>
                      <p style={popupStyles.performanceItem}>
                        <strong style={popupStyles.clickableText} onClick={() => showStudents('Average Students', performanceData.results.pass)}>Average Students:</strong> {performanceData?.results?.pass?.length ?? 0}
                      </p>
                      <p style={popupStyles.performanceItem}><strong>Pass Percentage:</strong> {passPercentage}%</p>
                    </div>
                  ) : (
                    <p>Select a class to see performance data.</p>
                  )}
                </div>
                <div style={popupStyles.box}>
                  <h3 style={popupStyles.sectionTitle}>Daily Attendance</h3>
                  <div style={popupStyles.attendanceHeader}>
                    <span style={{ ...popupStyles.attendanceCell, flex: 2 }}>Date</span>
                    <span style={popupStyles.attendanceCell}>Status</span>
                    <span style={popupStyles.attendanceCell}>Login Time</span>
                    <span style={popupStyles.attendanceCell}>Logout Time</span>
                    <span style={popupStyles.attendanceCell}>Late</span>
                    <span style={popupStyles.attendanceCell}>Working Hours</span>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {monthlyAttendance.map((day, idx) => (
                      <div key={idx} style={day.isAbsent ? { ...popupStyles.attendanceRow, color: '#9ca3af' } : popupStyles.attendanceRow}>
                        <span style={{ ...popupStyles.attendanceCell, flex: 2 }}>{day.date}</span>
                        <span style={popupStyles.attendanceCell}>{day.status}</span>
                        <span style={popupStyles.attendanceCell}>{day.entry}</span>
                        <span style={popupStyles.attendanceCell}>{day.exit}</span>
                        <span style={{ ...popupStyles.attendanceCell, ...(day.isLate ? popupStyles.lateText : {}) }}>{day.lateness}</span>
                        <span style={popupStyles.attendanceCell}>{day.workingHours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  </div>
)}


{modalState.visible && (
  <div style={popupStyles.studentModalOverlay}>
    <div style={popupStyles.studentModalContent}>
      <div style={popupStyles.studentModalHeader}>
        <h4 style={popupStyles.studentModalTitle}>{modalState.title}</h4>
        <button style={popupStyles.studentModalCloseButton} onClick={closeModal}>&times;</button>
      </div>
      <ul style={popupStyles.studentList}>
        {modalState.students.length > 0 ? (
          modalState.students.map((student, index) => (
            <li key={index} style={popupStyles.studentListItem}>
              <span style={popupStyles.studentName}>{student.name}</span>
              <span style={popupStyles.studentMarks}> (Marks: {student.marks})</span>
            </li>
          ))
        ) : (
          <li>No students found.</li>
        )}
      </ul>
    </div>
  </div>
)}

                    </div>
                </main>
            </div>
        </>
    );
};

export default TeacherDetails;
 