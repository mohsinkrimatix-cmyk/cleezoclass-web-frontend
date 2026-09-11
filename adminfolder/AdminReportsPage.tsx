import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowDown, FaArrowUp, FaBook, FaClock, FaFileAlt, FaTrophy, FaUser, FaUserClock, FaCheckCircle, FaUserSlash, FaUserGraduate } from "react-icons/fa";
import "./AdminReportsPage.css";
import "./AdminDashboardNew.css";
import "../frontdeskdahboard/FrontDesk.css";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import InstituteBrand from "../shared/InstituteBrand.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import dashboardIcon from "../assets/Dashboard.png";
import academicsIcon from "../assets/Staff Assign.png";
import leadProfileIcon from "../assets/Lead Profile.png";
import enrollmentIcon from "../assets/Enrollment.png";
import reportsIcon from "../assets/Reports .png";
import communicationIcon from "../assets/Communication Assign.png";
import { Download } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FiHelpCircle } from "react-icons/fi";
import HelpCenter from "../shared/HelpCenter.jsx";
const API_BASE = "https://cleezoclass.com:5000/api";

type ReportType = "attendance" | "marks" | "topper" | "low" | "high";
type ReportGroup = "marks" | "attendance" | "leaveRequests" | "latecomers";

type AttendanceRow = {
  name: string;
  class_name: string;
  section: string;
  present_days: number;
  informed_days: number;
  uninformed_days: number;
  total_days: number;
  attendance_percentage: number;
};

type MarksRow = {
  name: string;
  class_name: string;
  section: string;
  subject: string;
  test_type: string;
  marks_obtained: number;
  created_at: string;
};

type TopperRow = {
  name: string;
  class_name: string;
  section: string;
  total_marks: number;
  average_marks: number;
  total_tests: number;
};

type LatecomerRow = {
  id: string | number;
  name: string;
  date: string;
  time: string;
  loginTime: string;
  status: string;
};

type LeaveRequestRow = {
  id: string | number;
  name: string;
  dates: string;
  reason: string;
  status: string;
};

type UnarrivedTeacherRow = {
  id: string | number;
  name: string;
  absent_days: number | string;
};

// New structures for the specific absentee collections
type TeacherAbsenteeRow = {
  id: string | number;
  name: string;
  username: string;
  date: string;
  time: string;
  status: string;
};

type StudentAbsenteeRow = {
  id: string | number;
  name: string;
  class: string;
  section: string;
  status: string;
  date: string;
  username: string;
  submission_time: string;
};

type DetailView = "teacherAttendance" | "leaveRequests" | "latecomers" | "teacherAbsentees" | "studentAbsentees" | null;

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: dashboardIcon, route: "/AdminDashboard" },
  { key: "academics", label: "Academics", icon: academicsIcon, route: "/AdiminAcademicsNew" },
  { key: "events", label: "Events & Meetings", icon: leadProfileIcon, route: "/AdminEventsAndMeetings" },
  { key: "communication", label: "Generations", icon: communicationIcon, route: "/AdminGenerations" },
  { key: "enrollments", label: "Store", icon: enrollmentIcon, route: "/AdminStoreNew" },
  { key: "reports", label: "Reports", icon: reportsIcon, route: "/AdminReportsPage" },
];

const quickCards = [
  { key: "attendance" as const, title: "Attendance", subtitle: "Class wise attendance list", icon: <FaCheckCircle /> },
  { key: "marks" as const, title: "Academic Marks", subtitle: "Student marks list", icon: <FaBook /> },
  { key: "topper" as const, title: "Topper List", subtitle: "Highest average performers", icon: <FaTrophy /> },
  { key: "low" as const, title: "Low Performance", subtitle: "Least 10 marks", icon: <FaArrowDown /> },
  { key: "high" as const, title: "High Performance", subtitle: "Top 10 marks", icon: <FaArrowUp /> },
];

const monthOptions = (() => {
  const months: Array<{ value: string; label: string }> = [{ value: "", label: "All Months" }];
  const now = new Date();
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    months.push({ value, label });
  }
  return months;
})();

const formatNumber = (value: unknown, decimals = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return decimals ? "0.00" : "0";
  return decimals ? parsed.toFixed(decimals) : String(Math.round(parsed));
};

const formatDate = (value: unknown) => {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
};

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const matchesSearch = (text: string, search: string) =>
  !search || normalizeText(text).includes(normalizeText(search));

const isTimeLikeValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!text) return false;
  const lower = text.toLowerCase();
  if (["pending", "approved", "rejected", "fever", "sick", "other", "n/a", "na", "-"].includes(lower)) return false;
  return (
    /^\d{1,2}:\d{2}(:\d{2})?\s?(am|pm)?$/i.test(text) ||
    /^\d{1,2}:\d{2}(:\d{2})?$/.test(text) ||
    /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(text)
  );
};

const pickLateTimeValue = (...values: unknown[]) => {
  for (const value of values) {
    if (isTimeLikeValue(value)) return String(value).trim();
  }
  return "-";
};

const AdminReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSidebar, setActiveSidebar] = useState("reports");
  const [activeTopTab, setActiveTopTab] = useState("Reports");
  const [schoolLogo, setSchoolLogo] = useState("/default-logo.png");
  const [schoolName, setSchoolName] = useState("Institute");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [sectionOptions, setSectionOptions] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [activeReport, setActiveReport] = useState<ReportType>("attendance");
  const [activeReportGroup, setActiveReportGroup] = useState<ReportGroup>("attendance");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [marksRows, setMarksRows] = useState<MarksRow[]>([]);
  const [hrLoading, setHrLoading] = useState(false);
  
  // Existing HR state
  const [latecomers, setLatecomers] = useState<LatecomerRow[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestRow[]>([]);
  const [unarrivedTeachers, setUnarrivedTeachers] = useState<UnarrivedTeacherRow[]>([]);
  const [teacherAbsentCount, setTeacherAbsentCount] = useState(0);
  
  // New State arrays for requested profiles
  const [teacherAbsentees, setTeacherAbsentees] = useState<TeacherAbsenteeRow[]>([]);
  const [studentAbsentees, setStudentAbsentees] = useState<StudentAbsenteeRow[]>([]);

  const [activeDetailView, setActiveDetailView] = useState<DetailView>(null);
  const [openHelpSection, setOpenHelpSection] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const userRole = localStorage.getItem("userRole")

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    let cancelled = false;
    fetch(`https://cleezoclass.com:5000/api/institute?dbName=${encodeURIComponent(schoolCode)}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (cancelled) return;
        setSchoolLogo(data?.logo || "/default-logo.png");
        const resolvedSchoolName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.school_name || data?.name || data?.schoolName,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setSchoolName(resolvedSchoolName);
        localStorage.setItem("schoolName", resolvedSchoolName);
        localStorage.setItem("instituteName", resolvedSchoolName);
      })
      .catch(() => {
        if (cancelled) return;
        setSchoolLogo("/default-logo.png");
        const fallbackSchoolName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setSchoolName(fallbackSchoolName);
        localStorage.setItem("schoolName", fallbackSchoolName);
        localStorage.setItem("instituteName", fallbackSchoolName);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    let cancelled = false;
    axios
      .get(`${API_BASE}/classes`, { params: { schoolCode } })
      .then((res) => {
        if (cancelled) return;
        const classes = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
        setClassOptions(classes);
      })
      .catch(() => {
        if (cancelled) return;
        setClassOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    if (selectedClass === "All") {
      setSectionOptions([]);
      if (selectedSection !== "All") {
        setSelectedSection("All");
      }
      return;
    }

    let cancelled = false;
    axios
      .get(`${API_BASE}/sections/${encodeURIComponent(selectedClass)}`, { params: { schoolCode } })
      .then((res) => {
        if (cancelled) return;
        const sections = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
        setSectionOptions(sections);
        if (selectedSection !== "All" && !sections.includes(selectedSection)) {
          setSelectedSection("All");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSectionOptions([]);
        setSelectedSection("All");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    let cancelled = false;

    const loadReports = async () => {
      setLoading(true);
      setError("");

      try {
        const params = {
          schoolCode,
          className: selectedClass,
          section: selectedSection,
          month: selectedMonth || "All",
        };

        const [attendanceRes, marksRes] = await Promise.all([
          axios.get(`${API_BASE}/admin/class-wise-attendance-list`, { params }),
          axios.get(`${API_BASE}/admin/class-wise-academic-marks-list`, { params }),
        ]);

        if (!cancelled) {
          setAttendanceRows(Array.isArray(attendanceRes.data) ? attendanceRes.data : []);
          setMarksRows(Array.isArray(marksRes.data) ? marksRes.data : []);
        }
      } catch (err: any) {
        if (cancelled) return;
        setAttendanceRows([]);
        setMarksRows([]);
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load admin reports."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedSection, selectedMonth]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    let cancelled = false;

    const loadHrSummary = async () => {
      setHrLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const [latecomersRes, leaveRequestsRes, unarrivedRes, teacherAbsenteesRes, studentAbsenteesRes] = await Promise.all([
          axios.get(`${API_BASE}/latecomers/today`, { params: { schoolCode } }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/leave-requests/all`, { params: { schoolCode } }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/teachers_attendance/unarrived`, { params: { date: today, schoolCode } }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/absentees/teachers`, { params: { schoolCode } }).catch(() => ({ data: [] })),
          axios.get(`${API_BASE}/absentees/students`, { params: { schoolCode } }).catch(() => ({ data: [] }))
        ]);

        const latecomerRows = Array.isArray(latecomersRes.data)
          ? latecomersRes.data
              .filter((record) => String(record?.Login_time || "") > String(record?.time || ""))
              .map((record) => ({
                id: record?.id ?? `${record?.username || "late"}-${record?.date || ""}`,
                name: record?.username || record?.teacherName || record?.name || "-",
                date: String(record?.date || "-"),
                time: pickLateTimeValue(record?.time, record?.Logout_time, record?.logoutTime),
                loginTime: pickLateTimeValue(record?.Login_time, record?.loginTime),
                status: record?.status || "Late",
              }))
          : [];

        const leaveRequestRows = Array.isArray(leaveRequestsRes.data)
          ? leaveRequestsRes.data.map((req) => ({
              id: req?.teacherId ?? req?.id ?? `${req?.teacherName || "leave"}-${req?.leaveDates || ""}`,
              name: req?.teacherName || req?.name || "-",
              dates: req?.leaveDates || req?.dates || "-",
              reason: req?.reason || "-",
              status: req?.status || "pending",
            }))
          : [];

        if (cancelled) return;
        setLatecomers(latecomerRows);
        setLeaveRequests(leaveRequestRows);
        setUnarrivedTeachers(
          Array.isArray(unarrivedRes.data)
            ? unarrivedRes.data.map((teacher) => ({
                id: teacher?.id ?? teacher?.teacherId ?? teacher?.username ?? teacher?.name ?? `${teacher?.username || "teacher"}-${teacher?.absent_days || 0}`,
                name: teacher?.username || teacher?.teacherName || teacher?.name || "-",
                absent_days: teacher?.absent_days ?? teacher?.absentDays ?? teacher?.late_count ?? 0,
              }))
            : []
        );
        setTeacherAbsentCount(Array.isArray(unarrivedRes.data) ? unarrivedRes.data.length : 0);
        
        // Save new payloads to component state
        setTeacherAbsentees(
          Array.isArray(teacherAbsenteesRes.data)
            ? teacherAbsenteesRes.data.map((t) => ({
                id: t.id ?? Math.random(),
                name: t.name || "-",
                username: t.username || "-",
                date: formatDate(t.date),
                time: t.time || "-",
                status: t.status || "absent"
              }))
            : []
        );

        setStudentAbsentees(
          Array.isArray(studentAbsenteesRes.data)
            ? studentAbsenteesRes.data.map((s) => ({
                id: s.ID || Math.random(),
                name: s.name || "-",
                class: s.class || "-",
                section: s.section || "-",
                status: s.status || "-",
                date: formatDate(s.date),
                username: s.username || "-",
                submission_time: s.submission_time || "-"
              }))
            : []
        );

      } catch (hrError) {
        if (cancelled) return;
        setLatecomers([]);
        setLeaveRequests([]);
        setUnarrivedTeachers([]);
        setTeacherAbsentees([]);
        setStudentAbsentees([]);
        setTeacherAbsentCount(0);
      } finally {
        if (!cancelled) {
          setHrLoading(false);
        }
      }
    };

    loadHrSummary();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAttendanceRows = useMemo(
    () =>
      attendanceRows.filter((row) =>
        [row.name, row.class_name, row.section, String(row.present_days), String(row.total_days)].some((value) =>
          matchesSearch(value, search)
        )
      ),
    [attendanceRows, search]
  );

const filteredMarksRows = useMemo(
  () =>
    marksRows.filter((row) =>
      [row.name, row.class_name, row.section, row.subject, row.test_type, String(row.marks_obtained)].some((value) =>
        matchesSearch(value, search)
      )
    ),
  [marksRows, search]
);

  const topperRows = useMemo<TopperRow[]>(() => {
    const studentMap = new Map<
      string,
      {
        name: string;
        class_name: string;
        section: string;
        totalMarks: number;
        totalTests: number;
        bestSubject: string;
        bestMarks: number;
      }
    >();

    filteredMarksRows.forEach((row) => {
      const key = `${row.name}|${row.class_name}|${row.section}`;
      const existing = studentMap.get(key) || {
        name: row.name,
        class_name: row.class_name,
        section: row.section,
        totalMarks: 0,
        totalTests: 0,
        bestSubject: "-",
        bestMarks: -1,
      };

      const marks = Number(row.marks_obtained) || 0;
      existing.totalMarks += marks;
      existing.totalTests += 1;
      if (marks >= existing.bestMarks) {
        existing.bestMarks = marks;
        existing.bestSubject = row.subject || "-";
      }
      studentMap.set(key, existing);
    });

    const classGroups = new Map<string, TopperRow[]>();

    Array.from(studentMap.values()).forEach((item) => {
      const totalMarks = item.totalMarks;
      const row: TopperRow = {
        name: item.name,
        class_name: item.class_name,
        section: item.section,
        total_marks: totalMarks,
        average_marks: item.totalTests ? item.totalMarks / item.totalTests : 0,
        total_tests: item.totalTests,
      };
      const groupKey = item.class_name || "Unassigned";
      const bucket = classGroups.get(groupKey) || [];
      bucket.push(row);
      classGroups.set(groupKey, bucket);
    });

    return Array.from(classGroups.entries()).flatMap(([, rows]) =>
      rows
        .sort((a, b) => b.average_marks - a.average_marks || b.total_marks - a.total_marks || a.name.localeCompare(b.name))
        .slice(0, 3)
    );
  }, [filteredMarksRows]);

const lowRows = useMemo(
  () =>
    [...filteredMarksRows]
      .sort((a, b) => Number(a.marks_obtained) - Number(b.marks_obtained) || a.name.localeCompare(b.name))
      .slice(0, 10),
  [filteredMarksRows]
);

const highRows = useMemo(
  () =>
    [...filteredMarksRows]
      .sort((a, b) => Number(b.marks_obtained) - Number(a.marks_obtained) || a.name.localeCompare(b.name))
      .slice(0, 10),
  [filteredMarksRows]
);
  const visibleRows = useMemo(() => {
    if (activeDetailView) return [];
    switch (activeReport) {
      case "marks":
        return filteredMarksRows;
      case "topper":
        return topperRows;
      case "low":
        return lowRows;
      case "high":
        return highRows;
      case "attendance":
      default:
        return filteredAttendanceRows;
    }
  }, [activeDetailView, activeReport, filteredAttendanceRows, filteredMarksRows, highRows, lowRows, topperRows]);

  const leaveRequestCounts = useMemo(() => {
    const normalizedStatus = (value: string) => value.trim().toLowerCase();
    return leaveRequests.reduce(
      (acc, request) => {
        const status = normalizedStatus(request.status);
        if (status === "pending") acc.pending += 1;
        else if (status === "approved" || status === "accept" || status === "accepted") acc.approved += 1;
        else if (status === "rejected" || status === "declined" || status === "deny" || status === "denied") acc.rejected += 1;
        else acc.pending += 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 }
    );
  }, [leaveRequests]);

  const teacherAttendanceSummary = useMemo(() => {
    const late = latecomers.length;
    const leaves = leaveRequestCounts.pending;
    const absent = teacherAbsentCount;
    return { late, leaves, absent };
  }, [latecomers.length, leaveRequestCounts.pending, teacherAbsentCount]);

  const activeTableTitle = useMemo(() => {
    if (activeDetailView === "teacherAttendance") return "Teacher Attendance List";
    if (activeDetailView === "leaveRequests") return "Leave Requests";
    if (activeDetailView === "latecomers") return "Late Comers";
    if (activeDetailView === "teacherAbsentees") return "Teacher Absentees Report";
    if (activeDetailView === "studentAbsentees") return "Student Absentees (Leave Tracker)";
    if (activeReport === "attendance") return "Attendance List";
    if (activeReport === "marks") return "Academic Marks List";
    if (activeReport === "topper") return "Topper List";
    if (activeReport === "low") return "Low Performance Least 10";
    return "High Performance Top 10";
  }, [activeDetailView, activeReport]);

  const handleSidebarClick = (key: string) => {
    setActiveSidebar(key);
    if (key === "dashboard") navigate("/AdminDashboard");
    if (key === "academics") navigate("/AdiminAcademicsNew");
    if (key === "events") navigate("/AdminEventsAndMeetings");
    if (key === "communication") navigate("/AdminGenerations");
    if (key === "enrollments") navigate("/AdminStoreNew");
    if (key === "reports") navigate("/AdminReportsPage");
  };

  const renderTable = () => {
    if (loading) {
      return <div className="admin-reports-empty-state">Loading reports...</div>;
    }

    if (activeDetailView === "teacherAttendance") {
      return (
        <table className="admin-reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Teacher Name</th>
              <th>Absences This Month</th>
            </tr>
          </thead>
          <tbody>
            {unarrivedTeachers.length > 0 ? (
              unarrivedTeachers.map((teacher) => (
                <tr key={String(teacher.id)}>
                  <td>{teacher.id}</td>
                  <td>{teacher.name}</td>
                  <td>{teacher.absent_days}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="admin-reports-empty-cell">
                  No unarrived teachers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeDetailView === "leaveRequests") {
      return (
        <table className="admin-reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((request) => (
                <tr key={String(request.id)}>
                  <td>{request.id}</td>
                  <td>{request.name}</td>
                  <td>{request.dates}</td>
                  <td>{request.reason}</td>
                  <td>{request.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="admin-reports-empty-cell">
                  No leave requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeDetailView === "latecomers") {
      return (
        <table className="admin-reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>Time</th>
              <th>Login Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {latecomers.length > 0 ? (
              latecomers.map((person) => (
                <tr key={String(person.id)}>
                  <td>{person.id}</td>
                  <td>{person.name}</td>
                  <td>{person.date}</td>
                  <td>{person.time}</td>
                  <td>{person.loginTime}</td>
                  <td>{person.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="admin-reports-empty-cell">
                  No late comers found today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    // New render tables handling custom absent tracking lists
    if (activeDetailView === "teacherAbsentees") {
      return (
        <table className="admin-reports-table">
          <thead>
            <tr>
              <th>Teacher ID</th>
              <th>Teacher Name</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {teacherAbsentees.length > 0 ? (
              teacherAbsentees.map((teacher) => (
                <tr key={String(teacher.id)}>
                  <td>{teacher.id}</td>
                  <td>{teacher.name}</td>
                  <td>{teacher.date}</td>
                  <td><span className="absent-badge" style={{color: '#e74c3c', fontWeight: 'bold'}}>{teacher.status}</span></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="admin-reports-empty-cell">No absent teachers tracked today.</td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (activeDetailView === "studentAbsentees") {
      return (
        <table className="admin-reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>Class</th>
              <th>Section</th>
              <th>Leave Status</th>
              <th>Date</th>
          
            </tr>
          </thead>
          <tbody>
            {studentAbsentees.length > 0 ? (
              studentAbsentees.map((student) => (
                <tr key={String(student.id)}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.class}</td>
                  <td>{student.section}</td>
                  <td>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: student.status === 'Informed' ? '#2ecc71' : '#f39c12' 
                    }}>
                      {student.status}
                    </span>
                  </td>
                  <td>{student.date}</td>
               
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="admin-reports-empty-cell">No student leave parameters found matching metrics.</td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }

    if (!visibleRows.length) {
      return <div className="admin-reports-empty-state">{error || "No rows found for the selected filters."}</div>;
    }

    if (activeReport === "attendance") {
      const rows = visibleRows as AttendanceRow[];
      return (
        <table className="admin-reports-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Section</th>
              <th>Present</th>
              <th>Informed</th>
              <th>Uninformed</th>
              <th>Total Days</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.name}-${row.class_name}-${row.section}`}>
                <td>{row.name}</td>
                <td>{row.class_name}</td>
                <td>{row.section}</td>
                <td>{formatNumber(row.present_days)}</td>
                <td>{formatNumber(row.informed_days)}</td>
                <td>{formatNumber(row.uninformed_days)}</td>
                <td>{formatNumber(row.total_days)}</td>
                <td>{formatNumber(row.attendance_percentage, 2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

  if (activeReport === "marks" || activeReport === "low" || activeReport === "high") {
      const rows = visibleRows as MarksRow[];
      return (
        <table className="admin-reports-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Test Type</th>
              <th>Marks Obtained</th>
              <th>Created On</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.name}-${row.class_name}-${row.section}-${row.subject}-${row.created_at}`}>
                <td>{row.name}</td>
                <td>{row.class_name}</td>
                <td>{row.section}</td>
                <td>{row.subject}</td>
                <td>{row.test_type}</td>
                <td>{formatNumber(row.marks_obtained)}</td>
                <td>{formatDate(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeReport === "topper") {
      const rows = visibleRows as TopperRow[];
      return (
        <table className="admin-reports-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Section</th>
              <th>Total Marks</th>
              <th>Average Marks</th>
              <th>Tests</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.name}-${row.class_name}-${row.section}`}>
                <td>{row.name}</td>
                <td>{row.class_name}</td>
                <td>{row.section}</td>
                <td>{formatNumber(row.total_marks)}</td>
                <td>{formatNumber(row.average_marks, 2)}</td>
                <td>{formatNumber(row.total_tests)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    const rows = visibleRows as MarksRow[];
    return (
      <table className="admin-reports-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Section</th>
            <th>Subject</th>
            <th>Test Type</th>
            <th>Marks</th>
            <th>Created On</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.name}-${row.class_name}-${row.section}-${row.subject}-${row.created_at}`}>
              <td>{row.name}</td>
              <td>{row.class_name}</td>
              <td>{row.section}</td>
              <td>{row.subject}</td>
              <td>{row.test_type}</td>
              <td>{formatNumber(row.marks)}</td>
              <td>{formatDate(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const handleDownloadExcel = () => {
    let data = [];
    let fileName = "report";

    if (activeDetailView === "teacherAttendance") {
      data = unarrivedTeachers.map((t) => ({
        ID: t.id,
        "Teacher Name": t.name,
        "Absences This Month": t.absent_days,
      }));
      fileName = "teacher_attendance";
    } else if (activeDetailView === "leaveRequests") {
      data = leaveRequests.map((r) => ({
        ID: r.id,
        Name: r.name,
        Dates: r.dates,
        Reason: r.reason,
        Status: r.status,
      }));
      fileName = "leave_requests";
    } else if (activeDetailView === "latecomers") {
      data = latecomers.map((p) => ({
        ID: p.id,
        Name: p.name,
        Date: p.date,
        Time: p.time,
        "Login Time": p.loginTime,
        Status: p.status,
      }));
      fileName = "latecomers";
    } else if (activeDetailView === "teacherAbsentees") {
      data = teacherAbsentees.map((t) => ({
        "Teacher ID": t.id,
        "Teacher Name": t.name,
        Username: t.username,
        Date: t.date,
        "Time Checked": t.time,
        Status: t.status,
      }));
      fileName = "teacher_absentees_report";
    } else if (activeDetailView === "studentAbsentees") {
      data = studentAbsentees.map((s) => ({
        ID: s.id,
        "Student Name": s.name,
        Class: s.class,
        Section: s.section,
        "Leave Status": s.status,
        Date: s.date,
        Username: s.username,
        "Submission Time": s.submission_time,
      }));
      fileName = "student_absentees_report";
    } else if (activeReport === "attendance") {
      data = visibleRows.map((r: any) => ({
        Student: r.name,
        Class: r.class_name,
        Section: r.section,
        Present: r.present_days,
        Informed: r.informed_days,
        Uninformed: r.uninformed_days,
        "Total Days": r.total_days,
        "Attendance %": r.attendance_percentage,
      }));
      fileName = "student_attendance";
    } else if (activeReport === "marks" || activeReport === "low" || activeReport === "high") {
      data = visibleRows.map((r: any) => ({
        Student: r.name,
        Class: r.class_name,
        Section: r.section,
        Subject: r.subject,
        "Test Type": r.test_type,
        Marks: r.marks_obtained,
        "Created On": r.created_at,
      }));
      fileName =
        activeReport === "low"
          ? "low_performance_least_10"
          : activeReport === "high"
          ? "high_performance_top_10"
          : "student_marks";
    } else if (activeReport === "topper") {
      data = visibleRows.map((r: any) => ({
        Student: r.name,
        Class: r.class_name,
        Section: r.section,
        "Total Marks": r.total_marks,
        "Average Marks": r.average_marks,
        "Total Tests": r.total_tests,
      }));
      fileName = "toppers";
    }

    if (data.length === 0) {
      alert("No data available to download.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = Object.keys(data[0]).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key]).length)) + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDownloadImage = async () => {
    const tableElement = document.querySelector(".accountant-reports-table-wrap");
    
    if (!tableElement) {
      alert("Table not found.");
      return;
    }

    try {
      const canvas = await html2canvas(tableElement, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${activeDetailView || activeReport || "report"}_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to download image.");
    }
  };

  const handleDownloadPDF = () => {
    let data = [];
    let headers = [];
    let fileName = "report";
    let title = "Report";

    if (activeDetailView === "teacherAttendance") {
      title = "Teacher Attendance Report";
      fileName = "teacher_attendance";
      headers = ['ID', 'Teacher Name', 'Absences This Month'];
      data = unarrivedTeachers.map((t) => [t.id, t.name, t.absent_days]);
    } 
    else if (activeDetailView === "leaveRequests") {
      title = "Leave Requests Report";
      fileName = "leave_requests";
      headers = ['ID', 'Name', 'Dates', 'Reason', 'Status'];
      data = leaveRequests.map((r) => [r.id, r.name, r.dates, r.reason, r.status]);
    } 
    else if (activeDetailView === "latecomers") {
      title = "Latecomers Report";
      fileName = "latecomers";
      headers = ['ID', 'Name', 'Date', 'Time', 'Login Time', 'Status'];
      data = latecomers.map((p) => [p.id, p.name, p.date, p.time, p.loginTime, p.status]);
    } 
    else if (activeDetailView === "teacherAbsentees") {
      title = "Teacher Absentees Tracking Report";
      fileName = "teacher_absentees";
      headers = ['Teacher ID', 'Teacher Name', 'Username', 'Date', 'Time Checked', 'Status'];
      data = teacherAbsentees.map((t) => [t.id, t.name, t.username, t.date, t.time, t.status]);
    }
    else if (activeDetailView === "studentAbsentees") {
      title = "Student Absentees Tracking Report";
      fileName = "student_absentees";
      headers = ['ID', 'Student Name', 'Class', 'Section', 'Leave Status', 'Date', 'Username', 'Submission Time'];
      data = studentAbsentees.map((s) => [s.id, s.name, s.class, s.section, s.status, s.date, s.username, s.submission_time]);
    }
    else if (activeReport === "attendance") {
      title = "Student Attendance Report";
      fileName = "student_attendance";
      headers = ['Student', 'Class', 'Section', 'Present', 'Informed', 'Uninformed', 'Total Days', 'Attendance %'];
      data = visibleRows.map((r: any) => [r.name, r.class_name, r.section, r.present_days, r.informed_days, r.uninformed_days, r.total_days, `${r.attendance_percentage}%`]);
    } 
    else if (activeReport === "marks" || activeReport === "low" || activeReport === "high") {
      title =
        activeReport === "low"
          ? "Low Performance Least 10 Report"
          : activeReport === "high"
          ? "High Performance Top 10 Report"
          : "Student Marks Report";
      fileName =
        activeReport === "low"
          ? "low_performance_least_10"
          : activeReport === "high"
          ? "high_performance_top_10"
          : "student_marks";
      headers = ['Student', 'Class', 'Section', 'Subject', 'Test Type', 'Marks', 'Created On'];
      data = visibleRows.map((r: any) => [r.name, r.class_name, r.section, r.subject, r.test_type, r.marks_obtained, formatDate(r.created_at)]);
    } 
    else if (activeReport === "topper") {
      title = "Toppers Report";
      fileName = "toppers";
      headers = ['Student', 'Class', 'Section', 'Total Marks', 'Average Marks', 'Total Tests'];
      data = visibleRows.map((r: any) => [r.name, r.class_name, r.section, r.total_marks, formatNumber(r.average_marks, 2), r.total_tests]);
    }

    if (data.length === 0) {
      alert("No data available to download.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 30, 30],
      },
      margin: { left: 14, right: 14 },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const markReportCards = quickCards.filter((card) => card.key !== "attendance");
  const attendanceReportTabs = [
    {
      key: "attendance",
      title: "Attendance",
      subtitle: "Class wise attendance list",
      icon: <FaCheckCircle />,
      kind: "report" as const,
    },
    {
      key: "teacherAttendance",
      title: "Teacher Attendance",
      subtitle: hrLoading ? "Loading..." : `${teacherAttendanceSummary.late + teacherAttendanceSummary.leaves + teacherAttendanceSummary.absent} records`,
      icon: <FaUserClock />,
      kind: "detail" as const,
    },
    {
      key: "teacherAbsentees",
      title: "Teacher Absentees",
      subtitle: hrLoading ? "Loading..." : `${teacherAbsentees.length} absent`,
      icon: <FaUserSlash />,
      kind: "detail" as const,
    },
    {
      key: "studentAbsentees",
      title: "Student Absentees",
      subtitle: hrLoading ? "Loading..." : `${studentAbsentees.length} records`,
      icon: <FaUserGraduate />,
      kind: "detail" as const,
    },
  ];

  const showMarksReports = () => {
    setActiveReportGroup("marks");
    setActiveDetailView(null);
    if (activeReport === "attendance") {
      setActiveReport("marks");
    }
  };

  const showAttendanceReports = () => {
    setActiveReportGroup("attendance");
    if (!activeDetailView && activeReport !== "attendance") {
      setActiveReport("attendance");
    }
  };

  const showLeaveRequests = () => {
    setActiveReportGroup("leaveRequests");
    setActiveDetailView("leaveRequests");
  };

  const showLatecomers = () => {
    setActiveReportGroup("latecomers");
    setActiveDetailView("latecomers");
  };

  return (
    <div className="dashboard-page frontdesk-dashboard-page admin-reports-page">
      <div className="dashboard-shell accountant-dashboard-shell">
        <aside className="dashboard-sidebar accountant-sidebar-strip">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`dashboard-sidebar-item accountant-sidebar-item ${activeSidebar === item.key ? "dashboard-sidebar-item-active accountant-sidebar-item-active" : ""}`}
              onClick={() => handleSidebarClick(item.key)}
            >
              <div className="dashboard-sidebar-item-icon accountant-sidebar-item-icon">
                <img src={item.icon} alt={item.label} />
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <div className="dashboard-main accountant-main-area admin-reports-main">
          <div className="dashboard-topbar accountant-topbar">
            <div className="dashboard-topbar-left accountant-topbar-left">
              {["Dashboard", "Academics", "Events & Meetings", "Reports"].map((tab) => (
                <div
                  key={tab}
                  className={`dashboard-topbar-tab accountant-topbar-tab ${activeTopTab === tab ? "dashboard-topbar-tab-active accountant-topbar-tab-active" : ""}`}
                >
                  <button
                    type="button"
                    className="accountant-topbar-tab-button"
                    onClick={() => {
                      setActiveTopTab(tab);
                      if (tab === "Dashboard") navigate("/AdminDashboard");
                      if (tab === "Academics") navigate("/AdiminAcademicsNew");
                      if (tab === "Events & Meetings") navigate("/AdminEventsAndMeetings");
                      if (tab === "Reports") navigate("/AdminReportsPage");
                    }}
                  >
                    {tab}
                  </button>
                </div>
              ))}
            </div>

            <div className="dashboard-topbar-center accountant-topbar-center">
              <InstituteBrand
                logoSrc={schoolLogo || "/default-logo.png"}
                logoAlt={schoolName || "School Logo"}
                instituteName={schoolName || "Unknown School"}
              />
            </div>

            <div className="dashboard-topbar-right accountant-topbar-right">
              <div className="header-profile-wrap" ref={userDropdownRef}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button className="accountant-help-icon-btn" onClick={() => setIsHelpOpen(true)} title="Help">
                    <FiHelpCircle style={{ color: "#e9818c", fontSize: "34px" }} />
                  </button>
         
                  <button className="header-profile-trigger" type="button" onClick={() => setUserDropdownOpen((prev) => !prev)} style={{marginTop:"20px"}} title="Profile">
                    <FaUser className="header-profile-trigger-icon" />
                  </button>
                </div>
                {userDropdownOpen && (
                  <div className="header-profile-dropdown">
                    <EditableProfileMenu />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="admin-reports-content">
            <div className="accountant-reports-label-grid admin-reports-filter-grid">
              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <span>Class</span>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                  <option value="All">All Classes</option>
                  {classOptions.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </label>

              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <span>Section</span>
                <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} disabled={selectedClass === "All"}>
                  <option value="All">All Sections</option>
                  {sectionOptions.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </label>

              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <span>Subject</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Student, subject, class..."
                />
              </label>

              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <span>Month</span>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  {monthOptions.map((month) => (
                    <option key={month.value || "all"} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-reports-main-tabs">
              <button
                type="button"
                className={`admin-reports-main-tab ${activeReportGroup === "marks" ? "admin-reports-main-tab-active" : ""}`}
                onClick={showMarksReports}
              >
                <span className="accountant-reports-card-icon">
                  <span className="admin-reports-hr-icon"><FaBook /></span>
                </span>
                <span className="accountant-reports-card-title">Marks</span>
                <span className="accountant-reports-card-subtitle">Academic mark reports</span>
              </button>
              <button
                type="button"
                className={`admin-reports-main-tab ${activeReportGroup === "attendance" ? "admin-reports-main-tab-active" : ""}`}
                onClick={showAttendanceReports}
              >
                <span className="accountant-reports-card-icon">
                  <span className="admin-reports-hr-icon"><FaCheckCircle /></span>
                </span>
                <span className="accountant-reports-card-title">Attendance</span>
                <span className="accountant-reports-card-subtitle">Student and staff attendance</span>
              </button>
              <button
                type="button"
                className={`admin-reports-main-tab ${activeReportGroup === "leaveRequests" ? "admin-reports-main-tab-active" : ""}`}
                onClick={showLeaveRequests}
              >
                <span className="accountant-reports-card-icon">
                  <span className="admin-reports-hr-icon"><FaFileAlt /></span>
                </span>
                <span className="accountant-reports-card-title">Leave Requests</span>
                <span className="accountant-reports-card-subtitle">{hrLoading ? "Loading..." : `${leaveRequests.length} records`}</span>
              </button>
              <button
                type="button"
                className={`admin-reports-main-tab ${activeReportGroup === "latecomers" ? "admin-reports-main-tab-active" : ""}`}
                onClick={showLatecomers}
              >
                <span className="accountant-reports-card-icon">
                  <span className="admin-reports-hr-icon"><FaClock /></span>
                </span>
                <span className="accountant-reports-card-title">Late Comers</span>
                <span className="accountant-reports-card-subtitle">{hrLoading ? "Loading..." : `${latecomers.length} records`}</span>
              </button>
            </div>

            {activeReportGroup === "marks" && (
              <div className="admin-reports-attendance-tabs admin-reports-mark-tabs">
                {markReportCards.map((card) => {
                  const isActive = activeDetailView === null && activeReport === card.key;

                  return (
                    <button
                      key={String(card.key)}
                      type="button"
                      className={`admin-reports-attendance-tab ${isActive ? "admin-reports-attendance-tab-active" : ""}`}
                      onClick={() => {
                        setActiveReportGroup("marks");
                        setActiveDetailView(null);
                        setActiveReport(card.key as ReportType);
                      }}
                    >
                      <span className="admin-reports-attendance-tab-icon">{card.icon}</span>
                      <span className="admin-reports-attendance-tab-text">
                        <b>{card.title}</b>
                        <small>{card.subtitle}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeReportGroup === "attendance" && (
              <div className="admin-reports-attendance-tabs">
                {attendanceReportTabs.map((card) => {
                  const isActive =
                    card.kind === "report"
                      ? activeDetailView === null && activeReport === card.key
                      : activeDetailView === card.key;

                  return (
                    <button
                      key={String(card.key)}
                      type="button"
                      className={`admin-reports-attendance-tab ${isActive ? "admin-reports-attendance-tab-active" : ""}`}
                      onClick={() => {
                        setActiveReportGroup("attendance");
                        if (card.kind === "report") {
                          setActiveDetailView(null);
                          setActiveReport(card.key as ReportType);
                        } else {
                          setActiveDetailView(card.key as DetailView);
                        }
                      }}
                    >
                      <span className="admin-reports-attendance-tab-icon">{card.icon}</span>
                      <span className="admin-reports-attendance-tab-text">
                        <b>{card.title}</b>
                        <small>{card.subtitle}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="accountant-reports-table-card">
              <div className="accountant-reports-toolbar-meta">
                <div>
                  <strong>{activeTableTitle}</strong>
                  <p>
                    {activeDetailView
                      ? "HR summary"
                      : `${selectedClass === "All" ? "All classes" : selectedClass}${selectedSection !== "All" ? `, Section ${selectedSection}` : ""}${selectedMonth ? `, ${selectedMonth}` : ""}`}
                  </p>
                </div>
                <div className="accountant-reports-download-group">
                  <button type="button" className="accountant-reports-download-btn accountant-reports-btn-excel" onClick={handleDownloadExcel} title="Download as Excel">
                    <Download/> Excel
                  </button>
                  <button type="button" className="accountant-reports-download-btn accountant-reports-btn-image" onClick={handleDownloadImage} title="Download as Image">
                    Image
                  </button>
                  <button type="button" className="accountant-reports-download-btn accountant-reports-btn-image" onClick={handleDownloadPDF} title="Download as PDF">
                    Download pdf
                  </button>
                  <span>
                    {activeDetailView === "teacherAttendance"
                      ? unarrivedTeachers.length
                      : activeDetailView === "leaveRequests"
                      ? leaveRequests.length
                      : activeDetailView === "latecomers"
                      ? latecomers.length
                      : activeDetailView === "teacherAbsentees"
                      ? teacherAbsentees.length
                      : activeDetailView === "studentAbsentees"
                      ? studentAbsentees.length
                      : visibleRows.length}{" "}
                    rows
                  </span>
                </div>
              </div>

              {error && <div className="admin-reports-error">{error}</div>}
              {isHelpOpen && (
                <HelpCenter
                  userRole={userRole}
                  openHelpSection={openHelpSection}
                  setOpenHelpSection={setOpenHelpSection}
                  setIsHelpOpen={setIsHelpOpen}
                />
              )}

              <div className="accountant-reports-table-wrap">{renderTable()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
