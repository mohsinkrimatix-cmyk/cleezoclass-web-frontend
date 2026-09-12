import React, { useState, useEffect, useRef, useImperativeHandle } from "react";
import ReactDOM from 'react-dom';
// import "./Main.css";
import { Link } from 'react-router-dom';
// Add these icon imports from lucide-react at the top of your file
import {
    Download, Share, ArrowLeft, Users, ThumbsUp, ThumbsDown,FileText,
    CheckCircle, XCircle, ArrowDownCircle, ArrowUpCircle, Bell, UserX, CreditCard, Repeat,
    ChevronLeft, ChevronRight // <-- Icons for carousel
} from 'lucide-react';
// import logo1 from './logo.jpg';
// import logo2 from './logo1.jpg';
// import logo3 from './logo3.jpg';
// import logo4 from './logo4.jpg';
// import InvestmentPieChart from "./Invest";
// import IncomePieChart from "./Feesmanagment";
// import OthersChart from "./Otherincome";
// import DonationChart from "./Donations";
// import TotalCostChart from "./Maintancechart";
// import Goodwill from "./Goodwill";
// import Expenses from "./Expenses";
// import Depreciation from "./Depresiation";
// import ManagAppriciationchat from "./ManagAppriciationspage";
// import SalaryChart from "./Salaries";
// import ProfitLossChart from "./Profit";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { HiOutlineDownload } from "react-icons/hi";
// import ToggleButton from "./Home";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, Legend as BarLegend, ResponsiveContainer as BarResponsiveContainer } from 'recharts';
import { LineChart, Line, XAxis as LineXAxis, YAxis as LineYAxis, CartesianGrid as LineCartesianGrid, Tooltip as LineTooltip, Legend as LineLegend, ResponsiveContainer as LineResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// import BillsList from "./Bill";
// import ExpenseManagement from './ExpenseData';
// import Incomedata from './billcom';


    const formatCurrency = (amount) => {
        return `₹ ${Number(amount || 0).toLocaleString('en-IN', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    }; 
// import { Modal } from './Dashboard';

// ===================================================================================
// START: Child Components
// ===================================================================================

const Modal = ({ children, onClose }) => {
    const modalStyles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
        content: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
        closeButton: { position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }
    };
    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
                <button style={modalStyles.closeButton} onClick={onClose}>&times;</button>
                {children}
            </div>
        </div>
    );
};

const InfoPopup = ({ isOpen, onClose, data, branchName }) => {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && event.target.closest && !event.target.closest('.info-popup-container')) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const popupStyles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 },
        content: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '500px', position: 'relative', animation: 'popup-appear-center 0.3s ease-out forwards' },
        closeButton: { position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
        header: { textAlign: 'center', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginTop: '1.5rem' },
        statItem: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px' },
        statIcon: { width: '32px', height: '32px', opacity: 0.9 },
        statLabel: { fontSize: '0.9rem', color: '#555', fontWeight: '500' },
        statValue: { fontSize: '1.8rem', fontWeight: 'bold' },
        valuePositive: { color: '#2ecc71' }, valueNegative: { color: '#e74c3c' }, valueNeutral: { color: '#3498db' }
    };

    const StatCard = ({ icon, label, value, valueStyle }) => (
        <div style={popupStyles.statItem}>
            {icon}
            <span style={popupStyles.statLabel}>{label}</span>
            <span style={{ ...popupStyles.statValue, ...valueStyle }}>{value}</span>
        </div>
    );
    
    return (
        <div style={popupStyles.overlay} onClick={onClose} className="info-popup-container">
            <div style={popupStyles.content} onClick={(e) => e.stopPropagation()}>
                <button style={popupStyles.closeButton} onClick={onClose}>&times;</button>
                <h2 style={popupStyles.header}>{branchName}</h2>
                <StatCard 
    icon={<Users style={popupStyles.statIcon} color="#3498db"/>} 
    label="Total Students" 
    value={data.totalStudents} // <-- USE data.totalStudents
    valueStyle={popupStyles.valueNeutral} 
/>
                <div style={popupStyles.grid}>
                    <StatCard icon={<CheckCircle style={popupStyles.statIcon} color="#2ecc71"/>} label="Total Paid" value={formatCurrency(data.totalPaid)} valueStyle={popupStyles.valuePositive} />
                    <StatCard icon={<XCircle style={popupStyles.statIcon} color="#e74c3c"/>} label="Total Unpaid" value={formatCurrency(data.totalUnpaid)} valueStyle={popupStyles.valueNegative} />
                    <StatCard icon={<ArrowDownCircle style={popupStyles.statIcon} color="#27ae60"/>} label="Total Income" value={formatCurrency(data.totalIncome)} valueStyle={popupStyles.valuePositive} />
                    <StatCard icon={<ArrowUpCircle style={popupStyles.statIcon} color="#c0392b"/>} label="Total Expenses" value={`₹${data.totalExpenses}`} valueStyle={popupStyles.valueNegative} />
                    <StatCard icon={<ThumbsUp style={popupStyles.statIcon} color="#9b59b6"/>} label="Total Merits" value={0} valueStyle={{color: '#9b59b6'}} />
                    <StatCard icon={<ThumbsDown style={popupStyles.statIcon} color="#9b59b6"/>} label="Total DeMerits" value={0} valueStyle={{color: '#9b59b6'}} />
                </div>
            </div>
        </div>
    );
};

// Add this new component after the InfoPopup component definition

const BillViewerModal = ({ isOpen, onClose, studentName, bills, isLoading, error }) => {
    if (!isOpen) return null;

    const modalStyles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
        content: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
        closeButton: { position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
        header: { textAlign: 'center', fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' },
        loadingText: { textAlign: 'center', padding: '3rem', fontSize: '1.2rem', color: '#555' },
        errorText: { textAlign: 'center', padding: '3rem', fontSize: '1.2rem', color: '#e74c3c' },
        noBillsContainer: { textAlign: 'center', padding: '3rem', backgroundColor: '#f9fafb', borderRadius: '8px' },
        noBillsText: { color: '#555' },
        billsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
        billCard: { border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
        receiptHeader: { fontWeight: 'bold', padding: '0.75rem 1rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #ddd', margin: 0 },
        imageContainer: { padding: '0.5rem', backgroundColor: 'white' },
        billImage: { width: '100%', display: 'block', border: '1px solid #eee' }
    };

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
                <button style={modalStyles.closeButton} onClick={onClose}>&times;</button>
                <h2 style={modalStyles.header}>Bill History for {studentName}</h2>
                {isLoading && <p style={modalStyles.loadingText}>Loading history...</p>}
                {error && <p style={modalStyles.errorText}>{error}</p>}
                
                {!isLoading && !error && (
                    bills.length > 0 ? (
                        <div style={modalStyles.billsGrid}>
                            {bills.map(bill => (
                                <div key={bill.image_path} style={modalStyles.billCard}>
                                    <p style={modalStyles.receiptHeader}>Receipt No: {bill.receiptNumber}</p>
                                    <div style={modalStyles.imageContainer}>
                                        <img
                                            src={`https://cleezoclass.com:4000/${bill.image_path}`}
                                            alt={`Receipt ${bill.receiptNumber}`}
                                            style={modalStyles.billImage}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={modalStyles.noBillsContainer}>
                             <FileText style={{ margin: '0 auto 0.5rem', color: '#666' }} />
                             <p style={modalStyles.noBillsText}>No saved receipts found for this student.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

// ===================================================================================
// START: THIS IS THE CORRECTED MODAL COMPONENT. REPLACE YOUR OLD ONE WITH THIS.
// ===================================================================================

const TeacherDetailsModal = ({ isOpen, onClose, teacherData, isLoading, error }) => {
    const contentToPrintRef = useRef(null);
    const [selectedClass, setSelectedClass] = useState('');
    const [performanceData, setPerformanceData] = useState(null);
    const [modalState, setModalState] = useState({ visible: false, title: '', students: [] });

    useEffect(() => {
        if (teacherData && teacherData.teaching && teacherData.teaching.length > 0) {
            const initialClass = teacherData.teaching[0].class;
            setSelectedClass(initialClass);
            setPerformanceData(teacherData.teaching[0]);
        }
    }, [teacherData]);

    useEffect(() => {
        if (teacherData && selectedClass) {
            const perf = teacherData.teaching.find(t => t.class === selectedClass);
            setPerformanceData(perf);
        }
    }, [selectedClass, teacherData]);

    // =============================================================
    // FIX: useMemo hooks are now moved here, BEFORE the early return.
    // =============================================================
    const attendanceMap = React.useMemo(() => {
        // A guard clause inside the hook is safe.
        if (!teacherData?.attendance) return new Map();
        return new Map(teacherData.attendance.map(att => [att.date, att]));
    }, [teacherData]);

    const monthlyAttendance = React.useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const today = now.getDate();
        const calendarDays = [];
        const SCHOOL_START_TIME = '09:00:00'; // Define constants inside or outside if they don't change

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
            if (!entryTime || !exitTime || entryTime === 'Absent' || exitTime === 'N/A') return 'N/A';
            const entryDate = new Date(`1970-01-01T${entryTime}`);
            const exitDate = new Date(`1970-01-01T${exitTime}`);
            if (exitDate < entryDate) return 'N/A';
            const diffMs = exitDate - entryDate;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${diffHours}h ${diffMins}m`;
        };

        for (let day = 1; day <= today; day++) {
            const dateObj = new Date(year, month, day);
            const dateString = dateObj.toISOString().split('T')[0];
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
    
    // The conditional return is now placed AFTER all hooks have been called.
    if (!isOpen) {
        return null;
    }

    // Helper functions that DO NOT use hooks can remain here.
    const showStudents = (title, studentList) => {
        setModalState({ visible: true, title, students: studentList });
    };

    const closeModal = () => {
        setModalState({ visible: false, title: '', students: [] });
    };

    const styles = {
        page: { fontFamily: "Segoe UI, sans-serif", background: "#f9fafb", padding: '20px' },
        container: { background: '#fff', padding: "20px 40px", maxWidth: '1200px', margin: '0 auto', borderRadius: '8px' },
        header: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' },
        actions: { display: 'flex', gap: '10px' },
        actionButton: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
        mainContent: { paddingTop: '30px' },
        profileCard: { display: "flex", gap: "30px", padding: "25px", borderRadius: "12px", border: '1px solid #eee', background: '#f9fafb' },
        profileInfo: { flex: 1 },
        infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 30px' },
        infoItem: { fontSize: "16px", color: "#4b5563" },
        label: { fontWeight: "600", color: "#374151", display: 'block', marginBottom: '4px' },
        profilePhoto: { width: "150px", height: "150px", objectFit: "cover", borderRadius: "12px", border: "3px solid #f3f4f6" },
        box: { background: "#fff", border: "1px solid #e5e7eb", padding: "20px", marginTop: "30px", borderRadius: "12px", boxShadow: "0 3px 10px rgba(0,0,0,0.04)" },
        sectionTitle: { fontSize: "20px", fontWeight: "600", marginBottom: "15px", color: "#374151" },
        dropdownContainer: { display: 'flex', gap: '15px', marginBottom: '20px' },
        dropdown: { padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', flex: 1 },
        performanceBox: { border: "1px solid #e5e7eb", padding: "15px", borderRadius: "10px", background: "#f9fafb" },
        performanceItem: { marginBottom: '8px', fontSize: '15px' },
        clickableText: { cursor: 'pointer', color: '#3b82f6', textDecoration: 'none' },
        attendanceHeader: { display: "flex", fontWeight: '600', padding: "10px 0", borderBottom: "2px solid #d1d5db" },
        attendanceRow: { display: "flex", padding: "10px 0", borderBottom: "1px solid #f3f4f6" },
        attendanceCell: { flex: 1, textAlign: 'center', fontSize: '14px' },
        lateText: { color: '#f97316' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
        modalContent: { backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' },
        closeButton: { position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
    };

    const totalStudentsWithRecords = (performanceData?.results?.firstClass?.length ?? 0) + (performanceData?.results?.pass?.length ?? 0) + (performanceData?.results?.fail?.length ?? 0);
    const totalPassedStudents = (performanceData?.results?.firstClass?.length ?? 0) + (performanceData?.results?.pass?.length ?? 0);
    const passPercentage = totalStudentsWithRecords > 0 ? ((totalPassedStudents / totalStudentsWithRecords) * 100).toFixed(2) : "0.00";

    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button style={styles.closeButton} onClick={onClose}>&times;</button>
                {isLoading && <p style={{ textAlign: 'center', fontSize: '18px' }}>Loading teacher details...</p>}
                {error && <p style={{ textAlign: 'center', fontSize: '18px', color: 'red' }}>Error: {error}</p>}
                {!isLoading && !error && teacherData && (
                    <div style={styles.page}>
                      <div style={styles.container} ref={contentToPrintRef}>
                        <header style={styles.header}>
                          <span style={{ fontSize: "24px", fontWeight: "bold", color: "#111827" }}>TAGSOLNOVALLP SCHOOL</span>
                           <div style={styles.actions}>
                                <button onClick={() => {}} style={styles.actionButton}>Print</button>
                                <button onClick={() => {}} style={styles.actionButton}>Download</button>
                           </div>
                        </header>
                        <main style={styles.mainContent}>
                          <div style={styles.profileCard}>
                            <div style={styles.profileInfo}>
                              <div style={styles.infoGrid}>
                                <div style={styles.infoItem}><span style={styles.label}>Name:</span> {teacherData.name}</div>
                                <div style={styles.infoItem}><span style={styles.label}>ID:</span> {teacherData.id}</div>
                                <div style={styles.infoItem}><span style={styles.label}>Address:</span> {teacherData.address}</div>
                                <div style={styles.infoItem}><span style={styles.label}>Subject:</span> {teacherData.subjects}</div>
                                <div style={styles.infoItem}><span style={styles.label}>Classes:</span> {teacherData.classes}</div>
                                <div style={styles.infoItem}><span style={styles.label}>Salary:</span> {teacherData.salary || "N/A"}</div>
                              </div>
                            </div>
                            <img src={teacherData.photo} alt="Teacher" style={styles.profilePhoto} />
                          </div>
                          <div style={styles.box}>
                            <h3 style={styles.sectionTitle}>Classes Taught & Performance</h3>
                            <div style={styles.dropdownContainer}>
                                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={styles.dropdown}>
                                    <option value="">-- Select Class --</option>
                                    {teacherData.teaching.map(t => <option key={t.class} value={t.class}>{t.class}</option>)}
                                </select>
                                <select value={teacherData.subjects} style={styles.dropdown} disabled>
                                    <option>{teacherData.subjects}</option>
                                </select>
                            </div>
                            {performanceData ? (
                              <div style={styles.performanceBox}>
                                <p style={styles.performanceItem}><strong>Total Students:</strong> {totalStudentsWithRecords}</p>
                                <p style={styles.performanceItem}><strong style={styles.clickableText}>1st Class Students :</strong> {performanceData?.results?.firstClass?.length ?? 0}</p>
                                <p style={styles.performanceItem}><strong style={styles.clickableText}>Average Students :</strong> {performanceData?.results?.pass?.length ?? 0}</p>
                                <p style={styles.performanceItem}><strong>Pass Percentage:</strong> {passPercentage}%</p>
                              </div>
                            ) : <p>Select a class to see performance data.</p>}
                          </div>
                          <div style={styles.box}>
                            <h3 style={styles.sectionTitle}>Daily Attendance</h3>
                             <div style={styles.attendanceHeader}>
                                <span style={{...styles.attendanceCell, flex: 2}}>Date</span>
                                <span style={styles.attendanceCell}>Status</span>
                                <span style={styles.attendanceCell}>Login Time</span>
                                <span style={styles.attendanceCell}>Logout Time</span>
                                <span style={styles.attendanceCell}>Late</span>
                                <span style={styles.attendanceCell}>Working Hours</span>
                             </div>
                             <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                                {monthlyAttendance.map((day, idx) => (
                                    <div key={idx} style={day.isAbsent ? {...styles.attendanceRow, color: '#9ca3af'} : styles.attendanceRow}>
                                        <span style={{...styles.attendanceCell, flex: 2}}>{day.date}</span>
                                        <span style={styles.attendanceCell}>{day.status}</span>
                                        <span style={styles.attendanceCell}>{day.entry}</span>
                                        <span style={styles.attendanceCell}>{day.exit}</span>
                                        <span style={{...styles.attendanceCell, ...(day.isLate ? styles.lateText : {})}}>{day.lateness}</span>
                                        <span style={styles.attendanceCell}>{day.workingHours}</span>
                                    </div>
                                ))}
                             </div>
                           </div>
                        </main>
                      </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ===================================================================================
// END: CORRECTED MODAL COMPONENT
// ===================================================================================


const Dashboard = React.forwardRef(({ pendingRequests, isPendingLoading, pendingRequestsError, handleRequestStatusUpdate, pendingActivitiesData, studentCount, studentStats  }, ref) => {
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isTeacherDetailModalOpen, setIsTeacherDetailModalOpen] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState(null);
    const [teacherDetails, setTeacherDetails] = useState(null);
    const [isTeacherDetailsLoading, setIsTeacherDetailsLoading] = useState(false);
    const [teacherDetailsError, setTeacherDetailsError] = useState('');
    const [modalContent, setModalContent] = useState(null);
    const [error, setError] = useState(null);
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
    const [loading, setLoading] = useState(false);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false); // <-- ADD THIS
    const [selectedStudentForBills, setSelectedStudentForBills] = useState(null); // <-- ADD THIS
    const [studentBills, setStudentBills] = useState([]); // <-- ADD THIS
    const [isBillsLoading, setIsBillsLoading] = useState(false); // <-- ADD THIS
    const [billsError, setBillsError] = useState('');
    // State for student payments (Income) modal
    const [paidStudents, setPaidStudents] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');

    // State for staff attendance modal
    const [latecomers, setLatecomers] = useState([]);
    const [leaveRequestsData, setLeaveRequestsData] = useState([]);
    const [editedBillsData, setEditedBillsData] = useState([]);
    const [isEditedBillsLoading, setIsEditedBillsLoading] = useState(false);
    const [expenseRequestsData, setExpenseRequestsData] = useState([]);
    const [isExpenseRequestsLoading, setIsExpenseRequestsLoading] = useState(false);
    const [expenseRequestDate, setExpenseRequestDate] = useState(new Date().toISOString().split('T')[0]);
        // State for student attendance modal
    const [studentAttendanceData, setStudentAttendanceData] = useState([]);
    const [isStudentAttendanceLoading, setIsStudentAttendanceLoading] = useState(false);
    const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedAttendanceClass, setSelectedAttendanceClass] = useState('');
    const [selectedAttendanceSection, setSelectedAttendanceSection] = useState('');

    // State for Daily Summary Popup
    const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false);
    const [infoPopupData, setInfoPopupData] = useState(null);
    

       const handleUnarrivedTeacherClick = (teacherId) => {
        // This is the original line. REMOVE OR COMMENT IT OUT.
        // navigate(`/TeacherDetails/${teacherId}`);

        // These are the new lines to add.
        setSelectedTeacherId(teacherId);
        setIsTeacherDetailModalOpen(true);
        fetchTeacherDetails(teacherId); // Fetch data when modal opens
        console.log(`Opening details for teacher ID: ${teacherId}`);
    };;

     const fetchTeacherDetails = async (teacherId) => {
        setIsTeacherDetailsLoading(true);
        setTeacherDetailsError('');
        setTeacherDetails(null);
        const schoolCode = localStorage.getItem('schoolCode');

        if (!schoolCode) {
            setTeacherDetailsError("School code is missing.");
            setIsTeacherDetailsLoading(false);
            return;
        }

        try {
            const response = await fetch(`https://cleezoclass.com:4000/teacher/${teacherId}?schoolCode=${schoolCode}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch details for teacher ID ${teacherId}.`);
            }
            const data = await response.json();
            setTeacherDetails(data);
        } catch (err) {
            setTeacherDetailsError(err.message);
        } finally {
            setIsTeacherDetailsLoading(false);
        }
    };
 
    
    const handleOpenModal = (content) => {
        setError(null);
        setModalContent(content);
        if (content === 'income') {
            const today = new Date().toISOString().split('T')[0];
            setStartDate(today);
            setEndDate('');
            setPaidStudents([]);
            setSelectedClass('');
            setSelectedSection('');
            fetchIncomeDetails({ startDate: today, endDate: today });
        } else if (content === 'studentAttendance') {
            const today = new Date().toISOString().split('T')[0];
            setSelectedAttendanceDate(today);
            setSelectedAttendanceClass('');
            setSelectedAttendanceSection('');
            fetchStudentAttendance({ date: today });
        } else if (content === 'staffAttendance') {
            fetchLatecomers();
            fetchLeaveRequests();
        } else if (content === 'dailySummary') {
            fetchInfoPopupData();
        }
        else if (content === 'updates') {
        const today = new Date().toISOString().split('T')[0];
        setExpenseRequestDate(today);
        fetchEditedBills();
        fetchExpenseRequests(today);
    }
    };

    const handleInfoBoxClick = () => {
        if (isInfoPopupOpen) {
            setIsInfoPopupOpen(false);
            return;
        }
        fetchInfoPopupData();
        setIsInfoPopupOpen(true);
    };

    useImperativeHandle(ref, () => ({
        openModal: (content) => {
            handleOpenModal(content);
        },
        openInfoPopup: () => {
            handleInfoBoxClick();
        }
    }));
    
const fetchInfoPopupData = async () => {
    if (!schoolCode) return;
    setLoading(true);
    let totalExpenses = 0;

    try {
        // 1. We only need to fetch the total expenses here.
        const expenseResponse = await axios.post("https://cleezoclass.com:4000/api/getExpenseData", { schoolCode });
        totalExpenses = (expenseResponse.data || []).reduce((sum, item) => sum + (parseFloat(item.paid_amount) || 0), 0);

    } catch (err) {
        console.error("Failed to fetch branch expense data.", err);
        // If expenses fail, we can still show the other data.
        totalExpenses = 0;
    } finally {
        // 2. We now use the already-fetched studentStats for paid/unpaid amounts.
        // This ensures the data is always consistent with the small card.
        setInfoPopupData({
            totalStudents: studentCount !== null ? studentCount : 0,
            totalPaid: studentStats.totalPaid,      // <-- USE studentStats STATE
            totalUnpaid: studentStats.totalUnpaid,  // <-- USE studentStats STATE
            totalIncome: studentStats.totalPaid,    // <-- USE studentStats STATE
            totalExpenses: totalExpenses.toLocaleString('en-IN')
        });
        setLoading(false);
    }
};
    const styles = {
        error: { color: '#e74c3c', textAlign: 'center', backgroundColor: '#fbe2e2', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e74c3c' },
        modalShared: {
            heading: { textAlign: 'center', color: '#333', marginBottom: '30px', fontSize: windowWidth < 768 ? '1.5rem' : '2rem' },
            filterForm: { display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', alignItems: 'flex-end', justifyContent: 'center' },
            formGroup: { flex: '1 1 150px', minWidth: '0' },
            label: { marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: windowWidth < 768 ? '0.9rem' : '1rem' },
            dateInput: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: windowWidth < 768 ? '14px' : '16px' },
            select: { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: windowWidth < 768 ? '14px' : '16px' },
            searchButton: { padding: '10px 20px', backgroundColor: '#5a7488', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: windowWidth < 768 ? '14px' : '16px', flex: windowWidth < 768 ? '1 1 100%' : '0 0 auto', marginTop: windowWidth < 768 ? '10px' : 'auto' },
            table: { width: '100%', borderCollapse: 'collapse', marginTop: '15px', fontSize: windowWidth < 768 ? '12px' : '14px' },
            th: { backgroundColor: '#5a7488', color: 'white', padding: windowWidth < 768 ? '8px' : '10px', textAlign: 'left', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' },
            td: { padding: windowWidth < 768 ? '8px' : '10px', borderBottom: '1px solid #ddd', textAlign: 'left', whiteSpace: 'nowrap' },
            trPaid: { backgroundColor: '#e8f5e9' },
            countBadge: { backgroundColor: '#5a7488', color: 'white', borderRadius: '50%', padding: '2px 8px', marginLeft: '5px', fontSize: '0.8em' },
            resultsHeading: { color: '#333', marginBottom: '15px', textAlign: 'center', paddingBottom: '10px', borderBottom: '2px solid #eee', fontSize: windowWidth < 768 ? '1.2rem' : '1.3rem' },
            loading: { textAlign: 'center', margin: '20px 0', color: '#555', fontSize: windowWidth < 768 ? '0.9rem' : '1rem' },
        },
        requestsContainer: { 
            marginTop: '2rem',
            display: 'flex',      // Aligns items in a row
            flexWrap: 'wrap',     // Allows items to wrap to the next line if space runs out
            gap: '1rem'           // Adds space between the cards
        },
        requestCard: { backgroundColor: '#ffffff', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem', width: '300px', height: 'auto' },
        requestCardActions: { display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' },
        requestCardInfo: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 },
        requestCardText: { fontSize: '1rem', color: '#333' },
        requestCardAmount: { fontSize: '1rem', color: '#333', fontWeight: 'bold' },
        approveButton: { padding: '8px 16px', fontSize: '14px', color: 'white', backgroundColor: '#27ae60', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
        rejectButton: { padding: '8px 16px', fontSize: '14px', color: 'white', backgroundColor: '#c0392b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }
    };
    
    const fetchStudentAttendance = async (filters) => {
        if (!schoolCode) return;
        setIsStudentAttendanceLoading(true);
        setError(null);
        setStudentAttendanceData([]);
        try {
            const response = await axios.get('https://cleezoclass.com:4000/api/student-leavesapprovalrequest', { 
                params: { schoolCode, ...filters } 
            });
            setStudentAttendanceData(response.data);
            // if (response.data.length === 0) {
            //    setError("No attendance records found for the selected criteria.");
            // }
        } catch (err) {
            setError('Failed to fetch student attendance data.');
            console.error("API Error in fetchStudentAttendance:", err);
        } finally {
            setIsStudentAttendanceLoading(false);
        }
    };
    
    const fetchIncomeDetails = async (filters) => {
        if (!schoolCode) return;
        setLoading(true);
        setError(null);
        setPaidStudents([]);
        try {
            const response = await axios.get('https://cleezoclass.com:4000/api/income/details', {
            params: { schoolCode, ...filters },
            // --- ADD THESE HEADERS TO PREVENT CACHING ---
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
            setPaidStudents(response.data);
            // if (response.data.length === 0) {
            //     setError('No paid students found for the selected criteria.');
            // }
        } catch (err) {
            setError('Failed to load student data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLatecomers = async () => {
        if (!schoolCode) return;
        setLoading(true);
        setError(null);
        try {
            const latecomersRes = await axios.get(`https://cleezoclass.com:4000/api/latecomers/today?schoolCode=${schoolCode}`);
            const todayLatecomers = latecomersRes.data.filter(record => record.Login_time > record.time);

            if (todayLatecomers.length === 0) {
                setLatecomers([]);
                return;
            }
            const detailedLatecomers = await Promise.all(
                todayLatecomers.map(async (teacher) => {
                    try {
                        const detailsRes = await axios.get('https://cleezoclass.com:4000/api/latecomer-details', {
                            params: { schoolCode, username: teacher.username, date: teacher.date },
                        });
                        const lateCount = detailsRes.data.lateCount || 0;
                        const status = lateCount > 5 ? '5+' : (lateCount > 1 ? lateCount.toString() : 'Current Day');
                        return { id: teacher.id, name: teacher.username, loginTime: teacher.Login_time,logoutTime: teacher.Logout_time || '-', status };
                    } catch (detailError) {
                        return { id: teacher.id, name: teacher.username, loginTime: teacher.Login_time, logoutTime: teacher.Logout_time || '-',status: 'Error' };
                    }
                })
            );
            setLatecomers(detailedLatecomers);
        } catch (err) {
            setError('Failed to fetch latecomer data.');
            setLatecomers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEditedBills = async () => {
    if (!schoolCode) return;
    setIsEditedBillsLoading(true);
    setError(null);
    try {
        const username = localStorage.getItem('username');
        const response = await axios.get(`https://cleezoclass.com:4000/api/edited-bills`, {
            params: { schoolCode, username }
        });
        setEditedBillsData(response.data);
    } catch (err) {
        setError('Failed to fetch edited bills.');
        console.error("API Error in fetchEditedBills:", err);
    } finally {
        setIsEditedBillsLoading(false);
    }
};

const fetchExpenseRequests = async (date) => {
    if (!schoolCode || !date) return;
    setIsExpenseRequestsLoading(true);
    setError(null);
    try {
        const response = await axios.get(`https://cleezoclass.com:4000/api/expense-requests`, {
            params: { schoolCode, date }
        });
        setExpenseRequestsData(response.data);
    } catch (err) {
        setError('Failed to fetch expense requests for the selected date.');
    } finally {
        setIsExpenseRequestsLoading(false);
    }
};
        const fetchStudentBills = async (student) => {
        if (!schoolCode || !student || !student.studentId) {
        setBillsError("Missing student identifier to fetch bills.");
        return;
    }

        setIsBillsLoading(true);
        setBillsError('');
        setStudentBills([]);

        try {
            const response = await axios.get(`https://cleezoclass.com:4000/api/student-bill-history`, {
            params: {
                schoolCode,
                studentId: student.studentId
            }
            });
            console.log("Bills received from server:", response.data);
            if (response.data && response.data.length > 0) {
            console.log("--- Individual Image Paths ---");
            response.data.forEach(bill => {
                // This logs the 'image_path' property from each bill object
                console.log(bill.image_path); 
            });
            console.log("----------------------------");
        }
            setStudentBills(response.data || []);
        } catch (err) {
            console.error("Error fetching bill history:", err);
            setBillsError("Failed to fetch bill history. An error occurred.");
            setStudentBills([]);
        } finally {
            setIsBillsLoading(false);
        }
    };

    const handleViewBillsClick = (student) => {
        console.log("Student object received:", student);
        setSelectedStudentForBills(student);
        setIsBillModalOpen(true);
        fetchStudentBills(student);
    };

    const fetchLeaveRequests = async () => {
        if (!schoolCode) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`https://cleezoclass.com:4000/api/leave-requests/all?schoolCode=${schoolCode}`);
            setLeaveRequestsData(response.data.map(r => ({
                id: r.teacherId, name: r.teacherName, dates: r.leaveDates, reason: r.reason, status: r.status
            })));
        } catch (err) {
            setError('Failed to fetch leave requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchClassSections = async () => {
            if (!schoolCode) return;
            try {
                const response = await axios.get('https://cleezoclass.com:4000/api/class-sections', { params: { schoolCode } });
                setClasses(response.data.classes);
                setSections(response.data.sections);
            } catch (err) {
                setError(`Failed to fetch class and section data.`);
            }
        };
        fetchClassSections();
    }, [schoolCode]);

    const handleAttendanceSearch = (e) => {
        e.preventDefault();
        setError(null);
        if (!selectedAttendanceDate) {
            setError('Please select a date to begin your search.');
            return;
        }
        const filters = { date: selectedAttendanceDate };
        if (selectedAttendanceClass) filters.class = selectedAttendanceClass;
        if (selectedAttendanceSection) filters.section = selectedAttendanceSection;
        fetchStudentAttendance(filters);
    };
    
    const handleIncomeSearch = (e) => {
        e.preventDefault();
        setError(null);
        if (!startDate) {
            setError('Please select a "From Date" to begin your search.');
            return;
        }
        const filters = { startDate: startDate, endDate: endDate || startDate };
        if (selectedClass) filters.class = selectedClass;
        if (selectedSection) filters.section = selectedSection;
        fetchIncomeDetails(filters);
    };

    const handleCloseModal = () => {
        setModalContent(null);
    };
    
    const formatNumber = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };
    const today = new Date().toISOString().split('T')[0];
        
            // State for attendance data
    const [arrivedTeachers, setArrivedTeachers] = useState([]);
    const [unarrivedTeachers, setUnarrivedTeachers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(today);
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
    const renderModalContent = () => {
        const s = styles.modalShared;
        switch (modalContent) {
                        case 'updates':
                return (
                    <div>
                        <h1 style={s.heading}>Updates</h1>
                        {error && <p style={styles.error}>{error}</p>}
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            {/* Edited Bills Section */}
                            <div style={{ flex: 1, minWidth: '400px' }}>
                                <h2 style={{ ...s.resultsHeading, textAlign: 'left', fontSize: '1.2rem' }}>Edited Bills</h2>
                                {isEditedBillsLoading && <div style={s.loading}>Loading...</div>}
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={s.table}>
                                        <thead>
                                            <tr>
                                                <th style={s.th}>ID</th>
                                                <th style={s.th}>Name</th>
                                                <th style={s.th}>Receipt No.</th>
                                                <th style={s.th}>Reason</th>
                                                <th style={s.th}>Editor</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {editedBillsData.length > 0 ? editedBillsData.map((bill) => (
                                                <tr key={bill.id}>
                                                    <td style={s.td}>{bill.id}</td>
                                                    <td style={s.td}>{bill.studentName}</td>
                                                    <td style={s.td}>{bill.receiptNumber}</td>
                                                    <td style={s.td}>{bill.edit_reason}</td>
                                                    <td style={s.td}>{bill.editorName}</td>
                                                </tr>
                                            )) : <tr><td colSpan="5" style={{ ...s.td, textAlign: 'center' }}>{isEditedBillsLoading ? "Loading..." : "No edited bills found."}</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Expense Requests Section */}
                            <div style={{ flex: 1, minWidth: '400px' }}>
                                 <h2 style={{ ...s.resultsHeading, textAlign: 'left', fontSize: '1.2rem' }}>Expense Requests</h2>
                                 <div style={{...s.formGroup, marginBottom: '1rem'}}>
                                    {/* <label htmlFor="expense-req-date" style={s.label}>Date:</label> */}
                                    {/* <input type="date" id="expense-req-date" value={expenseRequestDate} 
                                        onChange={(e) => {
                                            setExpenseRequestDate(e.target.value);
                                            fetchExpenseRequests(e.target.value);
                                        }} 
                                        style={s.dateInput} 
                                    /> */}
                                </div>
                                {isExpenseRequestsLoading && <div style={s.loading}>Loading...</div>}
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={s.table}>
                                        <thead>
                                            <tr>
                                                <th style={s.th}>ID</th>
                                                <th style={s.th}>Expense Name</th>
                                                <th style={s.th}>Amount</th>
                                                <th style={s.th}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {expenseRequestsData.length > 0 ? expenseRequestsData.map((req) => (
                                                <tr key={req.id}>
                                                    <td style={s.td}>{req.id}</td>
                                                    <td style={s.td}>{req.expense_name}</td>
                                                    <td style={s.td}>₹{formatNumber(req.amount)}</td>
                                                    <td style={s.td}>{req.status}</td>
                                                </tr>
                                            )) : <tr><td colSpan="4" style={{ ...s.td, textAlign: 'center' }}>{isExpenseRequestsLoading ? "Loading..." : "No requests for this date."}</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'pendingActivities':
                 const activityItemStyle = {
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', borderBottom: '1px solid #eee', fontSize: '1.1rem'
                };
                const labelStyle = { color: '#333', fontWeight: '500' };
                const valueStyle = { fontWeight: 'bold', color: '#16a085', fontSize: '1.2rem',  backgroundColor: '#e8f5e9', padding: '0.25rem 0.75rem', borderRadius: '12px' };

                return (
                    <div>
                        <h1 style={s.heading}>Pending Activities</h1>
                        <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1rem', border: '1px solid #e0e0e0' }}>
                            <div style={activityItemStyle}>
                                <span style={labelStyle}>Pending Salaries</span>
                                <span style={valueStyle}>{pendingActivitiesData.pendingSalaries}</span>
                            </div>
                            <div style={activityItemStyle}>
                                <span style={labelStyle}>Joining Letters</span>
                                <span style={valueStyle}>{pendingActivitiesData.joiningLetters}</span>
                            </div>
                            <div style={activityItemStyle}>
                                <span style={labelStyle}>Terminations</span>
                                <span style={valueStyle}>{pendingActivitiesData.terminations}</span>
                            </div>
                            <div style={activityItemStyle}>
                                <span style={labelStyle}>Transfer Certificates (TC)</span>
                                <span style={valueStyle}>{pendingActivitiesData.transferCertificates}</span>
                            </div>
                            <div style={activityItemStyle}>
                                <span style={labelStyle}>Pending Hall Tickets</span>
                                <span style={valueStyle}>{pendingActivitiesData.pendingHallTickets}</span>
                            </div>
                            <div style={{...activityItemStyle, borderBottom: 'none'}}>
                                <span style={labelStyle}>Pending Report Cards</span>
                                <span style={valueStyle}>{pendingActivitiesData.pendingReportCards}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'studentAttendance':
                return (
                    <div>
                        <h1 style={s.heading}>Student Attendance Records</h1>
                        <form onSubmit={handleAttendanceSearch} style={s.filterForm}>
                            <div style={s.formGroup}>
                                <label htmlFor="attendance-date-select" style={s.label}>Date:</label>
                                <input type="date" id="attendance-date-select" value={selectedAttendanceDate} onChange={(e) => setSelectedAttendanceDate(e.target.value)} style={s.dateInput} />
                            </div>
                            <div style={s.formGroup}>
                                <label htmlFor="attendance-class-select" style={s.label}>Class:</label>
                                <select id="attendance-class-select" value={selectedAttendanceClass} onChange={(e) => setSelectedAttendanceClass(e.target.value)} style={s.select}>
                                    <option value="">All Classes</option>
                                    {classes.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={s.formGroup}>
                                <label htmlFor="attendance-section-select" style={s.label}>Section:</label>
                                <select id="attendance-section-select" value={selectedAttendanceSection} onChange={(e) => setSelectedAttendanceSection(e.target.value)} style={s.select}>
                                    <option value="">All Sections</option>
                                    {sections.map((sec) => <option key={sec} value={sec}>{sec}</option>)}
                                </select>
                            </div>
                            <button type="submit" style={s.searchButton}>Search</button>
                        </form>
                        {error && <p style={styles.error}>{error}</p>}
                        {isStudentAttendanceLoading && <div style={s.loading}>Loading...</div>}
                        {!isStudentAttendanceLoading && !error && (
                            <div style={{ overflowX: 'auto' }}>
                                <h3 style={s.resultsHeading}>Students on Leave<span style={s.countBadge}>{studentAttendanceData.length}</span></h3>
                                <table style={{ ...s.table, minWidth: '800px' }}>
                                     <thead>
                                        <tr>
                                            <th style={s.th}>Name</th>
                                            <th style={s.th}>Class</th>
                                            <th style={s.th}>Section</th>
                                            <th style={s.th}>Leave Type</th>
                                            <th style={s.th}>Submission Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studentAttendanceData.length > 0 ? (
                                            studentAttendanceData.map((leave, index) => (
                                                <tr key={index}>
                                                    <td style={s.td}>{leave.name}</td>
                                                    <td style={s.td}>{leave.class}</td>
                                                    <td style={s.td}>{leave.section}</td>
                                                    <td style={s.td}>{leave.leavetype}</td>
                                                    <td style={s.td}>{new Date(`1970-01-01T${leave.submission_time}Z`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" style={{ ...s.td, textAlign: 'center' }}>No records found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            case 'income':
                return (
                    <div>
                        <h1 style={s.heading}>Income Details</h1>
                        <form onSubmit={handleIncomeSearch} style={s.filterForm}>
                            <div style={s.formGroup}><label htmlFor="start-date-select" style={s.label}>From Date:</label><input type="date" id="start-date-select" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={s.dateInput} /></div>
                            <div style={s.formGroup}><label htmlFor="end-date-select" style={s.label}>To Date:</label><input type="date" id="end-date-select" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} style={s.dateInput} /></div>
                            <div style={s.formGroup}><label htmlFor="class-select" style={s.label}>Class:</label><select id="class-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={s.select}><option value="">All Classes</option>{classes.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div style={s.formGroup}><label htmlFor="section-select" style={s.label}>Section:</label><select id="section-select" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} style={s.select}><option value="">All Sections</option>{sections.map((sec) => <option key={sec} value={sec}>{sec}</option>)}</select></div>
                            <button type="submit" style={s.searchButton}>Search</button>
                        </form>
                        {error && <p style={styles.error}>{error}</p>}
                        {loading && <div style={s.loading}>Loading...</div>}
                        {!loading && !error && (<div style={{ overflowX: 'auto' }}><h3 style={s.resultsHeading}>Paid Students<span style={s.countBadge}>{paidStudents.length}</span></h3><table style={{ ...s.table, minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Name</th>
                                    <th style={s.th}>Class</th>
                                    <th style={s.th}>Section</th>
                                    <th style={s.th}>Amount</th>
                                    <th style={s.th}>Payment Mode</th>
                                    <th style={s.th}>Balance</th>
                                    <th style={s.th}>Bills</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        {paidStudents.length > 0 ? (paidStudents.map((student, index) => (
                                            <tr key={index} style={s.trPaid}>
                                                <td style={s.td}>{student.StudentName}</td>
                                                <td style={s.td}>{student.Class}</td>
                                                <td style={s.td}>{student.Section}</td>
                                                <td style={s.td}>₹{formatNumber(student.Amount)}</td>
                                                <td style={s.td}>{student.PaymentMode}</td>
                                                <td style={s.td}>₹{formatNumber(student.Balance)}</td>                   
                          <td style={s.td}>
        <button 
            onClick={() => handleViewBillsClick(student)} 
            style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px' }}
        >
            View
        </button>
    </td></tr>))) : (<tr><td colSpan="6" style={{ ...s.td, textAlign: 'center' }}>No records found.</td></tr>)}</tbody></table></div>)}
                    </div>
                );

            case 'staffAttendance':
                 return (
                    <div>
                        <h1 style={s.heading}>Staff Attendance Details</h1>
                        {error && <p style={styles.error}>{error}</p>}
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            {/* Late Arrivals Section (No changes here) */}
                            <div style={{ flex: 1, minWidth: '400px' }}>
                                <h2 style={{ ...s.resultsHeading, textAlign: 'left', fontSize: '1.2rem' }}>Late Arrivals (Today)</h2>
                                {loading && <div style={s.loading}>Loading...</div>}
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={s.table}>
                                        <thead><tr><th style={s.th}>ID</th><th style={s.th}>Name</th><th style={s.th}>Login Time</th><th style={s.th}>Logout Time</th><th style={s.th}>Report</th></tr></thead>
                                        <tbody>
                                            {latecomers.length > 0 ? latecomers.map((person, index) => (
                                                <tr key={index}><td style={s.td}>{person.id}</td><td style={s.td}>{person.name}</td><td style={s.td}>{person.loginTime}</td><td style={s.td}>{person.logoutTime}</td><td style={{ ...s.td, color: '#e74c3c', fontWeight: 'bold' }}>{person.status}</td></tr>
                                            )) : <tr><td colSpan="4" style={{ ...s.td, textAlign: 'center' }}>{loading ? "Loading..." : "No late arrivals found."}</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {/* Leave Requests Section (No changes here) */}
                            <div style={{ flex: 1, minWidth: '400px' }}>
                                 <h2 style={{ ...s.resultsHeading, textAlign: 'left', fontSize: '1.2rem' }}>Leave Requests</h2>
                                {loading && <div style={s.loading}>Loading...</div>}
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={s.table}>
                                        <thead><tr><th style={s.th}>ID</th><th style={s.th}>Name</th><th style={s.th}>Dates</th><th style={s.th}>Reason</th><th style={s.th}>Status</th></tr></thead>
                                        <tbody>
                                            {leaveRequestsData.length > 0 ? leaveRequestsData.map((req) => (
                                                <tr key={req.id}><td style={s.td}>{req.id}</td><td style={s.td}>{req.name}</td><td style={s.td}>{req.dates}</td><td style={s.td}>{req.reason}</td><td style={s.td}>{req.status}</td></tr>
                                            )) : <tr><td colSpan="5" style={{ ...s.td, textAlign: 'center' }}>{loading ? "Loading..." : "No leave requests found."}</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        {/* Unarrived Teachers Section (THIS IS WHERE THE CHANGES ARE) */}
                        <div style={pageStyles.tableWrapper}>
                            <h2 style={pageStyles.tableSubTitle}>Unarrived Teachers</h2>
                            <table style={pageStyles.table}>
                                <thead>
                                    <tr>
                                        <th style={pageStyles.th}>ID</th>
                                        <th style={pageStyles.th}>Teacher Name</th>
                                        <th style={pageStyles.th}>Absences This Month (to date)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unarrivedTeachers.length > 0 ? unarrivedTeachers.map(teacher => (
                                        // ===============================================
                                        // == THE FIX IS ON THE NEXT LINE (THE <tr> TAG) ==
                                        // ===============================================
                                        <tr 
                                            key={teacher.id}
                                            onClick={() => handleUnarrivedTeacherClick(teacher.id)}
                                            style={{ cursor: 'pointer' }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={pageStyles.td}>{teacher.id}</td>
                                            <td style={pageStyles.td}>{teacher.name}</td>
                                            <td style={pageStyles.td}>{teacher.absent_days}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="3" style={{...pageStyles.td, ...pageStyles.emptyRow}}>All teachers are accounted for.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div>
            {modalContent && <Modal onClose={handleCloseModal}>{renderModalContent()}</Modal>}
             <div style={styles.requestsContainer}>
                {isPendingLoading && <p>Loading Requests...</p>}
                {pendingRequestsError && <p style={styles.error}>{pendingRequestsError}</p>}
                
                {!isPendingLoading && !pendingRequestsError && pendingRequests.map((req) => (
                    <div key={req.id} style={styles.requestCard}>
                        <div style={styles.requestCardInfo}>
                            <span style={styles.requestCardText}>Expense Name: {req.expense_name}</span>
                            <span style={styles.requestCardAmount}>Amount: ₹{req.amount}</span>
                            <span style={styles.requestCardText}>Previous Graduate: {req.previous_graduate}</span>
                            <span style={styles.requestCardText}>Date: {new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={styles.requestCardActions}>
                            <button onClick={() => handleRequestStatusUpdate(req.id, 'Approved')} style={styles.approveButton}>Approve</button>
                            <button onClick={() => handleRequestStatusUpdate(req.id, 'Rejected')} style={styles.rejectButton}>Reject</button>
                        </div>
                    </div>
                ))}
            </div>
            
            {infoPopupData && (
                <InfoPopup
                    isOpen={isInfoPopupOpen}
                    onClose={() => setIsInfoPopupOpen(false)}
                    data={infoPopupData}
                    branchName={schoolCode.replace(/_/g, ' ')}
                />
            )}
             <BillViewerModal
                isOpen={isBillModalOpen}
                onClose={() => setIsBillModalOpen(false)}
                studentName={selectedStudentForBills?.StudentName}
                bills={studentBills}
                isLoading={isBillsLoading}
                error={billsError}
            />
             <TeacherDetailsModal
                isOpen={isTeacherDetailModalOpen}
                onClose={() => setIsTeacherDetailModalOpen(false)}
                teacherData={teacherDetails}
                isLoading={isTeacherDetailsLoading}
                error={teacherDetailsError}
            />
        </div>
    );
});

const MainDashboard2 = () => {
     const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false); 
     const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const navigate = useNavigate();
const formatBranchName = (schoolCode) => {
  if (!schoolCode) return '';
  
  // Replace underscores with spaces and convert to title case
  return schoolCode
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

// Usage example:
const schoolCode = localStorage.getItem('schoolCode'); 
const branchNames = formatBranchName(schoolCode);
console.log(branchNames);

    const [selectedBranch, setSelectedBranch] = useState(() => localStorage.getItem("schoolCode") || "");
    const [selectedOption, setSelectedOption] = useState(() => localStorage.getItem("selectedOption") || "Selectoption");
     const [chiefName, setChiefName] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => localStorage.getItem("selectedDate") || "");
    const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
    const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
    const [studentStats, setStudentStats] = useState({ totalPaid: 0, totalUnpaid: 0 });
    const [isStudentStatsLoading, setIsStudentStatsLoading] = useState(true);
    const [studentCount, setStudentCount] = useState(null);
    const [dailyFinancials, setDailyFinancials] = useState({ income: null, expense: null });
    const [dailyPaidCount, setDailyPaidCount] = useState(0);
    const [dailyUnpaidCount, setDailyUnpaidCount] = useState(0);
    const [financialsError, setFinancialsError] = useState('');

    const [staffAttendance, setStaffAttendance] = useState({ late: 0, leaves: 0, absent: 0 });
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);

    const [studentAttendance, setStudentAttendance] = useState({ late: 0, leaves: 0, absent: 0 });
    const [isStudentAttendanceLoading, setIsStudentAttendanceLoading] = useState(true);
    const [editedBillsCount, setEditedBillsCount] = useState(0);
    const [expenseRequestsCount, setExpenseRequestsCount] = useState(0);
    const [pendingActivities, setPendingActivities] = useState({
        pendingSalaries: 0, joiningLetters: 0, terminations: 0,
        transferCertificates: 0, pendingHallTickets: 0, pendingReportCards: 0
    });
    const [isPendingActivitiesLoading, setIsPendingActivitiesLoading] = useState(true);

    const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
    const notificationIconRef = useRef(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isPendingLoading, setIsPendingLoading] = useState(false);
    const [pendingRequestsError, setPendingRequestsError] = useState(null);
    const [dailyPaidAmount, setDailyPaidAmount] = useState(0);
    const dashboardRef = useRef(null);
    const carouselCardRef = useRef(null);
const updateDateRange = (option) => {
    let startDate = "";
    let endDate = "";
    const today = new Date();

    switch (option) {
        case "ThisWeek":
            const sunday = new Date(today);
            sunday.setDate(today.getDate() - today.getDay());
            startDate = sunday.toISOString().split("T")[0];
            endDate = today.toISOString().split("T")[0];
            break;
        case "lastWeek":
            const lastSunday = new Date(today);
            lastSunday.setDate(today.getDate() - today.getDay() - 7);
            startDate = lastSunday.toISOString().split("T")[0];
            const lastSaturday = new Date(lastSunday);
            lastSaturday.setDate(lastSunday.getDate() + 6);
            endDate = lastSaturday.toISOString().split("T")[0];
            break;
        case "lastMonth":
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0];
            endDate = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0];
            break;
        case "lastQuarter":
            const quarterStartMonth = Math.floor((today.getMonth() - 3) / 3) * 3;
            startDate = new Date(today.getFullYear(), quarterStartMonth, 1).toISOString().split("T")[0];
            endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 0).toISOString().split("T")[0];
            break;
        case "lastHalfYear":
            const currentMonth = today.getMonth();
            if (currentMonth >= 3 && currentMonth <= 8) {
                startDate = new Date(today.getFullYear() - 1, 9, 1).toISOString().split("T")[0];
                endDate = new Date(today.getFullYear(), 2, 31).toISOString().split("T")[0];
            } else {
                startDate = new Date(today.getFullYear(), 3, 1).toISOString().split("T")[0];
                endDate = new Date(today.getFullYear(), 8, 30).toISOString().split("T")[0];
            }
            break;
        case "lastFinancialYear":
            startDate = new Date(today.getFullYear() - 1, 3, 1).toISOString().split("T")[0];
            endDate = new Date(today.getFullYear(), 2, 31).toISOString().split("T")[0];
            break;
        case "thisMonth":
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
            endDate = today.toISOString().split("T")[0];
            break;
        case "thisQuarter":
            const currQuarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
            startDate = new Date(today.getFullYear(), currQuarterStartMonth, 1).toISOString().split("T")[0];
            endDate = today.toISOString().split("T")[0];
            break;
        case "thisHalfyear":
            if (today.getMonth() >= 3 && today.getMonth() <= 8) {
                startDate = new Date(today.getFullYear(), 3, 1).toISOString().split("T")[0];
            } else {
                startDate = new Date(today.getFullYear(), 9, 1).toISOString().split("T")[0];
            }
            endDate = today.toISOString().split("T")[0];
            break;
        case "thisFinyear":
            startDate = new Date(today.getFullYear(), 3, 1).toISOString().split("T")[0];
            endDate = today.toISOString().split("T")[0];
            break;
        case "today":
            startDate = endDate = today.toISOString().split("T")[0];
            break;
        case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            startDate = endDate = yesterday.toISOString().split("T")[0];
            break;
        default:
            startDate = "";
            endDate = "";
    }

    // Store the selected date range in localStorage
    localStorage.setItem("selectedDateRange", JSON.stringify({ startDate, endDate }));

    setSelectedDate(`${startDate} to ${endDate}`);
};

        const username = localStorage.getItem('username');



    const fetchPendingRequests = async () => {
        if (!schoolCode) return;
        setIsPendingLoading(true);
        setPendingRequestsError(null);
        try {
            const response = await axios.get(`https://cleezoclass.com:4000/api/expense-requests/pending`, { params: { schoolCode } });
            setPendingRequests(response.data);
        } catch (err) {
            setPendingRequestsError('Failed to fetch requests.');
        } finally {
            setIsPendingLoading(false);
        }
    };
    
    const handleRequestStatusUpdate = async (id, status) => {
        try {
            await axios.put(`https://cleezoclass.com:4000/api/expense-request/${id}/status`, { status, schoolCode });
            fetchPendingRequests();
            alert(`Request has been successfully ${status}.`);
        } catch (err) {
            alert('Failed to update request status.');
        }
    };
    
useEffect(() => {
    const fetchUpdateCounts = async () => {
        if (!schoolCode) return;

        try {
            // Edited bills fetch remains the same
            const editedBillsResponse = await axios.get(`https://cleezoclass.com:4000/api/edited-bills`, {
                params: { schoolCode, username: localStorage.getItem('username') }
            });
            setEditedBillsCount(editedBillsResponse.data.length || 0);

            // --- THIS IS THE FIX ---
            // 1. Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];

            // 2. Fetch ALL expense requests for TODAY, not just pending ones
            const expenseRequestsResponse = await axios.get(`https://cleezoclass.com:4000/api/expense-requests`, {
                params: { schoolCode, date: today } // Use the endpoint that filters by date
            });
            setExpenseRequestsCount(expenseRequestsResponse.data.length || 0);
            // --- END OF FIX ---

        } catch (error) {
            console.error("Failed to fetch update counts:", error);
            setEditedBillsCount(0);
            setExpenseRequestsCount(0);
        }
    };

    fetchUpdateCounts();
}, [schoolCode]);


    useEffect(() => {
        fetchPendingRequests();
    }, [schoolCode]);

// AFTER THE FIX
useEffect(() => {
    const fetchAllDailyStats = async () => {
        if (!schoolCode) return;

        try {
            // We still fetch both, as financialSummaryRes has the expense data
            const [financialSummaryRes, feeDataRes] = await Promise.all([
                axios.get(`https://cleezoclass.com:4000/api/financial-summary/today?schoolCode=${schoolCode}`),
                axios.post(`https://cleezoclass.com:4000/api/feeDataFinanceNew`, { schoolCode, date: new Date().toISOString().split('T')[0] })
            ]);

            const feesToday = feeDataRes.data.results || [];

            // --- THIS IS THE NEW LOGIC ---
            // Calculate today's income from the detailed fee data, which we know is correct.
            const totalAmountPaidToday = feesToday.reduce((sum, fee) => {
                const dailyTotal = (Number(fee.Paid_Amount) || 0) +
                                   (Number(fee.books_paid) || 0) +
                                   (Number(fee.bus_paid) || 0) +
                                   (Number(fee.uniform_paid) || 0) +
                                   (Number(fee.exam_paid) || 0) +
                                   (Number(fee.others_paid) || 0);
                return sum + dailyTotal;
            }, 0);
            
            // --- UPDATE THIS LINE ---
            // Set the income using our new, reliable calculation.
            // We can still get the expense from the summary endpoint.
            setDailyFinancials({
                income: totalAmountPaidToday,
                expense: financialSummaryRes.data.totalExpense || 0
            });

            // The rest of the function remains the same
            const paidStudentsToday = new Set(feesToday.map(fee => fee.StudentName)).size;
            setDailyPaidCount(paidStudentsToday);
            setDailyPaidAmount(totalAmountPaidToday); // This state can still be useful elsewhere
            setFinancialsError('');

        } catch (err) {
            console.error("Failed to fetch daily stats:", err);
            setFinancialsError("₹0.00");
            setDailyFinancials({ income: 0, expense: 0 });
            setDailyPaidCount(0);
            setDailyPaidAmount(0);
        }
    };

    fetchAllDailyStats();
    const intervalId = setInterval(fetchAllDailyStats, 300000);
    return () => clearInterval(intervalId);
}, [schoolCode]);

    useEffect(() => {
        const fetchAttendanceSummary = async () => {
            if (!schoolCode) return;
            setIsAttendanceLoading(true);
            
            try {
                const today = new Date().toISOString().split('T')[0];

                // We will fetch all data, but handle errors for each API call individually.
                const promises = [
                    axios.get(`https://cleezoclass.com:4000/api/latecomers/today?schoolCode=${schoolCode}`).catch(e => ({ data: [] })), // Return empty data on failure
                    axios.get(`https://cleezoclass.com:4000/api/leave-requests/all?schoolCode=${schoolCode}`).catch(e => ({ data: [] })),
                    axios.get(`https://cleezoclass.com:4000/api/teachers_attendance/unarrived`, { params: { date: today, schoolCode: schoolCode } }).catch(e => ({ data: [] })),
                    axios.get(`https://cleezoclass.com:4000/api/student-leaves?schoolCode=${schoolCode}`).catch(e => ({ data: [] }))
                ];

                const [latecomersRes, staffLeavesRes, unarrivedRes, studentLeavesRes] = await Promise.all(promises);

                // --- Calculate Staff Attendance ---
                const lateCount = latecomersRes.data.filter(record => record.Login_time > record.time).length;
                
                // This counts requests with "pending" status for today or future dates.
                const onLeaveCount = staffLeavesRes.data.filter(req => req.status && req.status.toLowerCase() === 'pending').length;
                
                const absentCount = unarrivedRes.data.length;

                // Set all three state values at once
                setStaffAttendance({ 
                    late: lateCount, 
                    leaves: onLeaveCount, 
                    absent: absentCount 
                });

                // --- Calculate Student Attendance ---
                const studentOnLeaveCount = studentLeavesRes.data.length;
                setStudentAttendance(prevState => ({ ...prevState, leaves: studentOnLeaveCount }));

            } catch (error) {
                // This catch is for general errors, but the individual ones above prevent it from wiping state.
                console.error("A major error occurred in fetchAttendanceSummary:", error);
                setStaffAttendance({ late: 0, leaves: 0, absent: 0 });
            } finally {
                setIsAttendanceLoading(false);
                setIsStudentAttendanceLoading(false); // Ensure this is also set to false
            }
        };
        
        // NEW: Function to fetch data for the Pending Activities card
        const fetchPendingActivities = async () => {
            if (!schoolCode) return;
            setIsPendingActivitiesLoading(true);
            try {
                const response = await axios.get(`https://cleezoclass.com:4000/api/pending-activities?schoolCode=${schoolCode}`);
                setPendingActivities(response.data);
            } catch (error) {
                console.error("Failed to fetch pending activities:", error);
                // Reset to default on error
                setPendingActivities({
                    pendingSalaries: 0, joiningLetters: 0, terminations: 0,
                    transferCertificates: 0, pendingHallTickets: 0, pendingReportCards: 0
                });
            } finally {
                setIsPendingActivitiesLoading(false);
            }
        };
        
        // Run the functions
        fetchAttendanceSummary();
        fetchPendingActivities();
    }, [schoolCode]);

    useEffect(() => {
        const fetchStudentCount = async () => {
            const schoolCode = localStorage.getItem('schoolCode');
            if (!schoolCode) {
                console.error('No schoolCode found in localStorage');
                setStudentCount(0); // Set a default value on error
                return;
            }
            try {
                const response = await axios.get(`https://cleezoclass.com:4000/api/students/count?schoolCode=${schoolCode}`);
                setStudentCount(response.data.studentCount || 0);
            } catch (error) {
                console.error('Error fetching student count:', error);
                setStudentCount(0); // Set a default value on error
            }
        };

        fetchStudentCount();
    }, [schoolCode]);
    useEffect(() => {
    if (selectedOption !== "Selectoption") {
      updateDateRange(selectedOption);
    }
}, [selectedOption]);


// Find and REPLACE this entire useEffect block in MainDashboard2.jsx

useEffect(() => {
    const fetchStudentStats = async () => {
        if (!schoolCode) return;
        setIsStudentStatsLoading(true);

        try {
            // FIX #1: Correct the API call to use a query parameter
            const url = `https://cleezoclass.com:4000/api/feeDataFinanceNew?schoolCode=${schoolCode}`;
            const response = await axios.post(url);

            if (!response.data || !response.data.results) {
                throw new Error('Invalid data format received');
            }

            const feesData = response.data.results;

            // --- Start: Logic copied from Interface.jsx for accurate totals ---

            let totalPaidAmount = 0;
            feesData.forEach(fee => {
                totalPaidAmount += (Number(fee.Paid_Amount) || 0) +
                                 (Number(fee.books_paid) || 0) +
                                 (Number(fee.bus_paid) || 0) +
                                 (Number(fee.uniform_paid) || 0) +
                                 (Number(fee.exam_paid) || 0) +
                                 (Number(fee.others_paid) || 0);
            });

            // FIX #2: Implement the more complex pending fee calculation
            const studentCountsResponse = await axios.post(`https://cleezoclass.com:4000/api/studentCounts?schoolCode=${schoolCode}`);
            const studentCounts = studentCountsResponse.data.results || [];
            const classStudentCountMap = studentCounts.reduce((acc, { className, count }) => {
                acc[className] = count;
                return acc;
            }, {});

            const pendingByClass = feesData.reduce((acc, fee) => {
                const className = fee.className || 'Unknown Class';
                const completeFee = Number(fee.CompleteFee) || 0;
                const paidSoFar = (Number(fee.Paid_Amount) || 0) + (Number(fee.books_paid) || 0) + (Number(fee.bus_paid) || 0) + (Number(fee.uniform_paid) || 0) + (Number(fee.exam_paid) || 0) + (Number(fee.others_paid) || 0);
                const discount = Number(fee.Discount) || 0;
                const pending = completeFee - (paidSoFar + discount);

                if (!acc[className]) {
                    acc[className] = { totalStudents: classStudentCountMap[className] || 0, totalPending: 0 };
                }
                if (pending > 0) {
                    acc[className].totalPending += pending;
                }
                return acc;
            }, {});

            let projectedTotalPending = 0;
            Object.keys(pendingByClass).forEach(className => {
                const { totalPending, totalStudents } = pendingByClass[className];
                // Use a simple sum instead of multiplying by total students, as it may inflate the value
                projectedTotalPending += totalPending; 
            });
            
            // This logic might need refinement based on business rules, but it's closer to Interface.jsx
            const finalTotalPending = feesData.reduce((sum, fee) => sum + (Number(fee.Final_Amount) || 0), 0);


            // --- End: Logic copied from Interface.jsx ---

            setStudentStats({ totalPaid: totalPaidAmount, totalUnpaid: finalTotalPending });

        } catch (error) {
            console.error("Failed to fetch student payment stats:", error);
            setStudentStats({ totalPaid: 0, totalUnpaid: 0 }); // Fallback to 0 on error
        } finally {
            setIsStudentStatsLoading(false);
        }
    };

    fetchStudentStats();
}, [schoolCode]);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationIconRef.current && !notificationIconRef.current.contains(event.target)) {
                setIsNotificationPanelOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatNumber = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const handleBranchChange = (e) => {
        const value = e.target.value;
        setSelectedBranch(value);
        localStorage.setItem("schoolCode", value);
        window.location.reload(); 
    };

    useEffect(() => {
        const fetchSchoolLogo = async () => {
            const code = localStorage.getItem('schoolCode');
            if (!code) return;
            setDynamicSchoolCode(code);
            try {
                const response = await axios.post('https://cleezoclass.com:4000/api/schoollogodynamic', { secretecode: code });
                if (response.data.logoPath) setDynamicLogoSrc(response.data.logoPath);
            } catch (error) {
                console.error('Error fetching school logo:', error);
            }
        };
        fetchSchoolLogo();
    }, []);

    const responsiveButton = (bg, textColor) => ({ width: '120px', height: '40px', border: 'none', borderRadius: '8px', fontSize: '14px', backgroundColor: bg, color: textColor, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' });
    const dashboardIconStyle = { width: '40px', height: '40px', backgroundColor: '#16a085', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', color: 'white' };
    
    return (
        <>
            <header style={{ backgroundColor: '#fff', color: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'sticky', top: '0', zIndex: '50', height: '90px', display: 'flex', alignItems: 'center', position: 'relative' }}>
                <img src={dynamicLogoSrc || "/default-logo.png"} alt="School Logo" style={{ height: '80px', width: 'auto', borderRadius: '1px', position: 'absolute', left: '3rem', top: '50%', transform: 'translateY(-50%)', paddingLeft: '1rem' }} />
                <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: 'black' }}>
                        {dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL
                    </h1>
                </div>
            </header>
            <div className="outer-container">
                <div className="main-content">
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 2rem', backgroundColor: '#ffffff', borderBottom: '1px solid #e0e0e0' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <h2 style={{ margin: 0, color: '#333', fontWeight: '600', fontSize: '1.25rem' }}>WELCOME {username || 'CHIEF'}</h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ 
  border: '1px solid #ccc', 
  borderRadius: '8px', 
  padding: '8px 12px', 
  fontSize: '14px', 
  backgroundColor: '#f8f8f8',
  minHeight: '36px', // Match the select height
  display: 'flex',
  alignItems: 'center'
}}>
  {branchNames || 'No branch selected'}
</div>
                            <div style={{ position: 'relative' }} ref={notificationIconRef}>
                                <div style={dashboardIconStyle} title="Notifications" onClick={() => setIsNotificationPanelOpen(prev => !prev)}>
                                    <Bell size={20} />
                                    {pendingRequests.length > 0 && (
                                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#e74c3c', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                            {pendingRequests.length}
                                        </span>
                                    )}
                                </div>
                                {isNotificationPanelOpen && (
                                    <div style={{ position: 'absolute', top: '50px', right: '0', width: '350px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 100, padding: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                                        <h4 style={{margin: '5px 10px', color: '#333'}}>Pending Requests</h4>
                                        {isPendingLoading && <p style={{textAlign: 'center', color: '#555'}}>Loading...</p>}
                                        {pendingRequestsError && <p style={{textAlign: 'center', color: '#e74c3c'}}>{pendingRequestsError}</p>}
                                        {!isPendingLoading && pendingRequests.length === 0 && <p style={{textAlign: 'center', color: '#555', padding: '20px 0'}}>No pending requests.</p>}
                                        {pendingRequests.map(req => (
                                            <div key={req.id} style={{ padding: '10px', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                                                <span style={{fontWeight: 'bold', color: '#333'}}>{req.expense_name}</span>
                                                <span style={{color: '#555'}}>Amount: ₹{formatNumber(req.amount)}</span>
                                                <span style={{fontSize: '12px', color: '#888'}}>Date: {new Date(req.created_at).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={dashboardIconStyle} onClick={() => navigate("/dashboard")} title="Dashboard">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </div>
                        </div>
                    </header>

                    <div style={{ display: 'flex', gap: '2rem', padding: '0 1rem 1rem 1rem', marginTop: '1rem',  }}>
                        <div style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            
                            {/* ===================================================================== */}
                            {/* START: UPDATED PROFIT & LOSS ANALYSIS SECTION                           */}
                            {/* ===================================================================== */}
                            <div style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                boxShadow: '3px 3px 5px rgba(0,0,0,0.07)', 
                                overflow: 'hidden'
                            }}>
                                {/* <div style={{ padding: '20px 25px', borderBottom: '1px solid #e2e8f0' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600', color: '#1a202c' }}>
                                        Profit and Loss Analysis
                                    </h3>
                                </div> */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '20px 25px',
                                    backgroundColor: '#f8f9fa'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <label htmlFor="period-select" style={{ fontWeight: '500', color: '#4a5568' }}>Select period:</label>
                                        <select id="period-select" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)} style={{ border: '1px solid #cbd5e0', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', backgroundColor: '#ffffff', height: '40px' }}>
                                            <option value="Selectoption" disabled>Select Time Period</option>
                                            <option value="today">Today</option>
                                            <option value="ThisWeek">This Week</option>
                                            <option value="lastWeek">Last Week</option>
                                            <option value="lastMonth">Last Month</option>
                                            <option value="lastQuarter">Last Quarter</option>
                                            <option value="lastHalfYear">Last Half Year</option>
                                            <option value="lastFinancialYear">Last Financial Year</option>
                                            <option value="thisMonth">This Month</option>
                                            <option value="thisQuarter">This Quarter</option>
                                            <option value="thisHalfyear">This Half Year</option>
                                            <option value="thisFinyear">This Financial Year</option>
                                            <option value="yesterday">Yesterday</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <button style={responsiveButton('#16a085', 'white')} onClick={() => setIsIncomeModalOpen(true)}>Income</button>
                                        <button style={responsiveButton('#6c757d', 'white')} onClick={() => setIsExpenseModalOpen(true)}>Expenses</button>
                                    </div>
                                </div>
                                <div style={{ padding: '25px' }}>
                                    <div className="charts-wrapper" key={selectedDate}>
                                        {/* <ProfitLossChart selectedDate={selectedDate} selectedOption={selectedOption} /> */}
                                    </div>
                                </div>
                            </div>
                            {/* ===================================================================== */}
                            {/* END: UPDATED PROFIT & LOSS ANALYSIS SECTION                             */}
                            {/* ===================================================================== */}

                           <div>
    <Dashboard ref={dashboardRef} pendingRequests={pendingRequests} isPendingLoading={isPendingLoading} pendingRequestsError={pendingRequestsError} handleRequestStatusUpdate={handleRequestStatusUpdate} pendingActivitiesData={pendingActivities} studentCount={studentCount} dailyIncome={dailyFinancials.income} dailyExpense={dailyFinancials.expense} dailyPaid={dailyPaidCount} totalUnpaid={studentStats.totalUnpaid} studentStats={studentStats} />
</div>
                        </div>
                        
<div style={{
    width: '500px',
    flexShrink: 0,
    marginTop: '0rem',
    padding: '20px', // Adds space between the border and the cards
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0', // The outer border you want
    borderRadius: '12px',       // To match the other sections
    boxShadow: '0 4px 2px rgba(0, 0, 0, 0.1)',
    display:'flex',// Consistent shadow
    alignItems:'center',
    justifyContent: 'center',
    maxHeight:'530px',

}}>
    {/* This is the original div, now just for scrolling */}
    <div ref={carouselCardRef} className="carousel-scroll-container" style={{ width: '460px', flexShrink: 0, height: '250px', overflowY: 'scroll', scrollSnapType: 'y mandatory', marginTop: '7rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' , padding: '10px 5px' }}>
        {[
            { title: "Daily Summary", data: [{ label: "Date", value: new Date().toLocaleDateString() }, { label: "Income", value: financialsError ? financialsError : `₹${formatNumber(dailyFinancials.income)}` }, { label: "Expense", value: financialsError ? financialsError : `₹${formatNumber(dailyFinancials.expense)}` }] },
            { 
  title: "Student Payments", 
  data: [
      { label: "Total Paid", value: isStudentStatsLoading ? '...' : formatCurrency(studentStats.totalPaid) }, 
      { label: "Total Pending", value: isStudentStatsLoading ? '...' : formatCurrency(studentStats.totalUnpaid) }
  ] 
},
            { title: "Staff Attendance", data: [{ label: "Late Arrivals", value: isAttendanceLoading ? '...' : staffAttendance.late, }, { label: "On Leave", value: isAttendanceLoading ? '...' : staffAttendance.leaves, }, { label: "Absent", value: staffAttendance.absent }] },
            { title: "Student Attendance", data: [{ label: "Late Arrivals", value: '0', }, { label: "On Leave", value: isStudentAttendanceLoading ? '...' : studentAttendance.leaves }, { label: "Absent", value: '0' }] },
                        { 
                title: "Updates", 
                data: [
                    { label: "Edited Bills", value: editedBillsCount }, 
                    { label: "Expense Requests", value: expenseRequestsCount }
                ] 
            },
            { title: "Pending Activities", data: [] }
        ]
        .map((card, index) => {
            const cardColors = ['#65785C'];
            const currentCardColor = cardColors[index % cardColors.length];

            const cardBaseStyle = {
                height: '100%',
                scrollSnapAlign: 'start',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                borderLeft: `5px solid ${currentCardColor}`,
                boxShadow: '5px 5px 15px rgba(0, 0, 0, 0.25)',
                padding: '20px 25px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
             
            };
          

            const titleStyle = {
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '1px solid #e2e8f0',
            };

            if (card.title === "Pending Activities") {
                return (
                    <div
                        key={index}
                        className="carousel-card"
                        style={cardBaseStyle}
                        onClick={() => {
                            if (dashboardRef.current) {
                                dashboardRef.current.openModal('pendingActivities');
                            }
                        }}
                    >
                        <h3 style={titleStyle}>{card.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '5px' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>Pending Salaries</p>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>Pending Hall Tickets</p>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>Pending Report Cards</p>
                        </div>
                    </div>
                )
            }

            return (
                <div
                    key={index}
                    className="carousel-card"
                    style={cardBaseStyle}
                    onClick={() => {
                        if (!dashboardRef.current) return;
                        switch (index) {
                            case 0: dashboardRef.current.openInfoPopup(); break;
                            case 1: dashboardRef.current.openModal('income'); break;
                            case 2: dashboardRef.current.openModal('staffAttendance'); break;
                            case 3: dashboardRef.current.openModal('studentAttendance'); break;
                            case 4: dashboardRef.current.openModal('updates'); break; 
                            case 5: dashboardRef.current.openModal('pendingActivities'); break;
                            default: break;
                        }
                    }}
                >
                    <h3 style={titleStyle}>{card.title}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {card.data.map((item, itemIndex) => (
                            <div key={itemIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#4a5568', fontSize: '0.9rem' }}>{item.label}:</span>
                                <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1a202c' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )
        })}
    </div>
</div>

                    </div>
                </div>
            </div>
            {isExpenseModalOpen && (
            <Modal onClose={() => setIsExpenseModalOpen(false)}>
                {/* <ExpenseManagement /> */}
            </Modal>
        )}
                {isIncomeModalOpen && (
            <Modal onClose={() => setIsIncomeModalOpen(false)}>
                {/* <Incomedata /> */}
            </Modal>
        )}
            <style>
                {`
                    .outer-container {
                        display: flex;
                        flex-direction: column;
                        min-height: 90vh;
                        background-color: #f7fafc; /* Added a light background color */
                    }
                    .main-content {
                        flex-grow: 1;
                        padding: 1rem;
                    }
                    .charts-wrapper {
                        width: 100%;
                        height: 400px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    @media (max-width: 1200px) {
                        .main-content > div:first-of-type {
                            flex-direction: column;
                        }
                        .main-content > div:first-of-type > div:last-child {
                            width: 100%;
                            margin-top: 2rem;
                        }
                    }
                    @media (max-width: 768px) {
                        header > div {
                            flex-direction: column;
                            align-items: flex-start;
                        }
                        header h2 {
                            margin-bottom: 1rem;
                        }
                    }
                    @keyframes popup-appear-center { 
                        from { opacity: 0; transform: scale(0.95); } 
                        to { opacity: 1; transform: scale(1); } 
                    }
                    .carousel-scroll-container::-webkit-scrollbar {
                        display: none;
                    }
                    .carousel-scroll-container {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}
            </style>
        </>
    );
};
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
            backgroundColor: '#5a7488',
            color: '#ffffff',
            padding: '14px 16px',
            textAlign: 'center',
            fontWeight: '600',
            fontSize: '15px',
            border:'1px solid #ccc'
        },
        td: {
            padding: '14px 16px',
            borderBottom: '1px solid #e9ecef',
            color: '#555',
            fontSize: '15px',
            textAlign:'center',
            border:'1px solid #ccc'
            
        },
        emptyRow: {
            textAlign: 'center',
            padding: '20px',
            color: '#777',
        }
    };
export default MainDashboard2;