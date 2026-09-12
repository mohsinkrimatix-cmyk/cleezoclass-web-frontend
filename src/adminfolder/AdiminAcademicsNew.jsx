import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import axios from "axios";
import "./AccountantDashboardnew.css";
import "../frontdeskdahboard/FrontDesk.css";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import ErrorPopup from "../shared/ErrorPopup";
import InstituteBrand from "../shared/InstituteBrand.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
import { getUserDisplayName } from "../shared/userDisplayName";
import Swal from "sweetalert2";
import abcLogo from "../assets/logoab.png";
import dashboardIcon from "../assets/Dashboard.png";
import academicsIcon from "../assets/Staff Assign.png";
import leadProfileIcon from "../assets/Lead Profile.png";
import enrollmentIcon from "../assets/Enrollment.png";
import communicationIcon from "../assets/Communication Assign.png";
import reportsIcon from "../assets/Reports .png";
import timelineIcon from "../assets/Timeline.png";
import followupIcon from "../assets/Profile.png";
import assistantIcon from "../assets/Assistant.png";
import Radiusselectingg from "../shared/radiusselcting.jsx";
import AttendanceForms from "../shared/TeacherAttendanceTimeSetting.jsx";
import { Toaster } from "react-hot-toast";
import { FiHelpCircle } from "react-icons/fi";
import HelpCenter from "../shared/HelpCenter.jsx";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: dashboardIcon, route: "/AdminDashboard" },
  { key: "academics", label: "Academics", icon: academicsIcon, route: "/AdiminAcademicsNew" },
  { key: "events", label: "Events & Meetings", icon: leadProfileIcon, route: "/AdminEventsAndMeetings" },
  { key: "communication", label: "Generations", icon: communicationIcon, route: "/AdminGenerations" },
  { key: "store", label: "Store", icon: enrollmentIcon, route: "/AdminStoreNew" },

  { key: "report", label: "Report", icon: reportsIcon, route: "/AdminReportsPage" },
];

const quickCards = [
  { key: "livechat", title: "Live Chat", subtitle: "Approvals / Requests", icon: timelineIcon },
  { key: "storepo", title: "Store PO", subtitle: "Request Order / PO issue", icon: followupIcon },
  { key: "assistant", title: "Assistant", subtitle: "Daily Activity check", icon: assistantIcon },
];

const API_BASE = "https://cleezoclass.com:4000/api/admin";
const ROOT_API_BASE = "https://cleezoclass.com:4000/api";
const EXTRA_CLASS_STORAGE_PREFIX = "extraSpecialClassRequests";

const formatDateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTimeLabel = (value) => {
  if (!value) return "--";
  const raw = String(value).trim();
  if (!raw) return "--";
  const [hour = "00", minute = "00"] = raw.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const formatChatDateTime = (dateValue, timeValue) => {
  const dateLabel = dateValue ? formatDateLabel(dateValue) : "-";
  const timeLabel = timeValue ? formatTimeLabel(timeValue) : "--";
  return `${dateLabel}, ${timeLabel}`;
};

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getSettledArray = (result) =>
  result.status === "fulfilled" ? getArrayPayload(result.value?.data) : [];

const getSettledObject = (result) =>
  result.status === "fulfilled" && result.value?.data && typeof result.value.data === "object"
    ? result.value.data
    : {};

const parseDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isTestCalendarItem = (item) =>
  /test|exam|assessment|fa-|fa\d|sa-|sa\d/i.test(
    `${item?.eventName || ""} ${item?.eventType || ""} ${item?.title || ""}`
  );

const sortByDateAsc = (key) => (a, b) =>
  (parseDateValue(a?.[key])?.getTime() || 0) - (parseDateValue(b?.[key])?.getTime() || 0);

const getStoredExtraClassRequests = (schoolCode) => {
  if (!schoolCode || typeof window === "undefined") return [];

  try {
    const storageKey = `${EXTRA_CLASS_STORAGE_PREFIX}:${schoolCode}`;
    const requests = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(requests) ? requests : [];
  } catch {
    return [];
  }
};

const formatAttendanceClock = (value) => {
  if (!value) return "--";
  try {
    // Extract HH:MM from the ISO string (e.g., "2026-06-11T09:00:00.000Z" → "09:00")
    const timePart = value.split("T")[1]?.split(".")[0] || "";
    if (!timePart) return "--";
    return timePart.substring(0, 5); // Returns "HH:MM"
  } catch {
    return "--";
  }
};
const formatStoredTime = (value) => {
  if (!value) return "--";
  const raw = String(value).trim();
  if (!raw) return "--";

  if (raw.includes("T") || raw.includes("-") || raw.length > 8) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  const [hour = "00", minute = "00"] = raw.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const normalizeInstituteLogo = (rawLogo) => {
  if (!rawLogo) return "";

  let logo = rawLogo;

  if (typeof logo === "object" && logo?.type === "Buffer" && Array.isArray(logo?.data)) {
    try {
      logo = new Uint8Array(logo.data);
    } catch {
      return "";
    }
  }

  if (logo instanceof Uint8Array) {
    const binary = Array.from(logo, (byte) => String.fromCharCode(byte)).join("");
    return `data:image/png;base64,${btoa(binary)}`;
  }

  if (typeof logo !== "string") return "";
  logo = logo.trim();
  if (!logo) return "";
  if (logo.startsWith("data:image")) return logo;
  if (logo.startsWith("http")) return logo;

  if (logo.startsWith("0x")) {
    try {
      const hex = logo.slice(2);
      let binary = "";
      for (let i = 0; i < hex.length; i += 2) {
        binary += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
      return `data:image/png;base64,${btoa(binary)}`;
    } catch {
      return "";
    }
  }

  if (logo.startsWith("uploads/")) {
    return `https://cleezoclass.com:4000/${logo}`;
  }
  if (logo.startsWith("/uploads/")) {
    return `https://cleezoclass.com:4000${logo}`;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(logo) && logo.length > 100) {
    return `data:image/png;base64,${logo}`;
  }

  return "";
};

const bufferToPathString = (bufferData) => {
  if (!bufferData) return "";
  try {
    const bytes = new Uint8Array(bufferData);
    let pathString = "";
    for (let i = 0; i < bytes.byteLength; i += 1) {
      pathString += String.fromCharCode(bytes[i]);
    }
    return pathString.trim().replaceAll("\u0000", "");
  } catch {
    return "";
  }
};

const getAnyNumber = (obj, keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return NaN;
};

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === "") return NaN;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const isLikelyMaximumField = (key) =>
  /max|maximum|total/i.test(String(key || ""));

const readNumericField = (entry, { maximum = false } = {}) => {
  if (entry === null || entry === undefined) return NaN;

  if (typeof entry !== "object") {
    return toFiniteNumber(entry);
  }

  const numericFields = Object.entries(entry)
    .map(([key, value]) => ({ key, value: toFiniteNumber(value) }))
    .filter((field) => !Number.isNaN(field.value));

  if (!numericFields.length) return NaN;

  const matchedField = numericFields.find((field) =>
    maximum ? isLikelyMaximumField(field.key) : !isLikelyMaximumField(field.key)
  );

  if (maximum) return matchedField?.value ?? NaN;

  return matchedField?.value ?? numericFields[0].value;
};

const getTestScoreValue = (testEntry) => readNumericField(testEntry);

const getTestMaxValue = (testEntry) => readNumericField(testEntry, { maximum: true });

const buildPerformanceSummary = (apiData) => {
  const performance = Array.isArray(apiData)
    ? apiData
    : Array.isArray(apiData?.performance)
      ? apiData.performance
      : [];

  if (!performance.length) {
    return { obtained: 0, total: 0, percent: null };
  }

  let obtained = 0;
  let total = 0;

  performance.forEach((subj) => {
    const subjectObtained = getAnyNumber(subj, [
      "obtainedMarks",
      "marksObtained",
      "total_obtained",
      "totalObtained",
      "marks",
      "score",
    ]);
    const subjectTotal = getAnyNumber(subj, [
      "totalMarks",
      "maxMarks",
      "maximumMarks",
      "total",
      "max",
    ]);

    if (!Number.isNaN(subjectObtained) && !Number.isNaN(subjectTotal) && subjectTotal > 0) {
      obtained += subjectObtained;
      total += subjectTotal;
      return;
    }

    const tests = subj?.tests && typeof subj.tests === "object" ? subj.tests : {};
    Object.values(tests).forEach((entry) => {
      const mark = getTestScoreValue(entry);
      const max = getTestMaxValue(entry);
      if (!Number.isNaN(mark) && !Number.isNaN(max) && max > 0) {
        obtained += mark;
        total += max;
      }
    });
  });

  const percentValue = total > 0 ? (obtained / total) * 100 : null;
  let grade = null;
  // if (percentValue != null) {
  //   if (percentValue >= 90) grade = "A+";
  //   else if (percentValue >= 80) grade = "A";
  //   else if (percentValue >= 70) grade = "B+";
  //   else if (percentValue >= 60) grade = "B";
  //   else if (percentValue >= 50) grade = "C";
  //   else grade = "D";
  // }

    if (percentValue != null) {
    if (percentValue >= 91) grade = "A+";
    else if (percentValue >= 81) grade = "A";
    else if (percentValue >= 71) grade = "B+";
    else if (percentValue >= 61) grade = "B";
    else if (percentValue >= 51) grade = "C+";
    else if (percentValue >= 41) grade = "C";
    else if (percentValue>=35) grade ="D";
    else grade = "Fail";
  }

  return {
    obtained,
    total,
    percent: percentValue != null ? percentValue.toFixed(1) : null,
    grade,
  };
};

const buildAttendanceSummary = (apiData) => {
  const monthly = Array.isArray(apiData?.monthly) ? apiData.monthly.slice(-6) : [];
  if (!monthly.length) return null;

  const totalPercentage = monthly.reduce((acc, month) => {
    const present = Number(month?.present || 0);
    const total = Number(month?.total || 0);
    if (total <= 0) return acc;
    return acc + (present / total) * 100;
  }, 0);

  return (totalPercentage / monthly.length).toFixed(2);
};

const buildTeacherAttendanceSummary = (teacherData) => {
  const attendance = Array.isArray(teacherData?.attendance) ? teacherData.attendance : [];
  if (!attendance.length) {
    return {
      percent: null,
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      latestDate: "",
    };
  }

  const presentDays = attendance.filter((entry) => {
    const status = String(entry?.status || entry?.attendance_status || "present").toLowerCase();
    return status === "present" || status === "p";
  }).length;

  const lateDays = attendance.filter((entry) => {
    const status = String(entry?.status || entry?.attendance_status || "").toLowerCase();
    const entryTime = String(entry?.entry_time || entry?.login_time || "").trim();
    return status.includes("late") || Boolean(entryTime && entryTime > "09:00:00");
  }).length;

  const latestDate = attendance
    .map((entry) => entry?.date || entry?.attendance_date || entry?.created_at || "")
    .filter(Boolean)
    .sort()
    .at(-1) || "";

  return {
    percent: attendance.length > 0 ? ((presentDays / attendance.length) * 100).toFixed(1) : null,
    totalDays: attendance.length,
    presentDays,
    lateDays,
    latestDate: latestDate ? new Date(latestDate).toLocaleDateString("en-IN") : "",
  };
};

const fallbackTermRows = [
  { key: "FA1", label: "FA1", type: "FA", index: 0 },
  { key: "FA2", label: "FA2", type: "FA", index: 1 },
  { key: "SA1", label: "SA1", type: "SA", index: 0 },
  { key: "FA3", label: "FA3", type: "FA", index: 2 },
  { key: "FA4", label: "FA4", type: "FA", index: 3 },
  { key: "SA2", label: "SA2", type: "SA", index: 1 },
];

const normalizeTermKey = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const getTermSortValue = (term) => {
  const label = normalizeTermKey(term?.key || term?.label).toUpperCase();

  const shortMatch = label.match(/^(FA|SA)\s*-?\s*(\d+)$/);
  if (shortMatch) {
    const type = shortMatch[1];
    const number = Number(shortMatch[2]);

    if (type === "FA") {
      return number <= 2 ? number : number + 1;
    }

    return number === 1 ? 3 : number + 4;
  }

  const formativeMatch = label.match(/^FORMATIVE\s+ASSESSMENT\s*-?\s*(\d+)$/);
  if (formativeMatch) {
    const number = Number(formativeMatch[1]);
    if (number === 1) return 2.5;
    if (number === 2) return 5.5;
    return 100 + number;
  }

  const summativeMatch = label.match(/^SUMMATIVE\s+ASSESSMENT\s*-?\s*(\d+)$/);
  if (summativeMatch) {
    const number = Number(summativeMatch[1]);
    return number === 1 ? 3 : number + 4;
  }

  const numericMatch = label.match(/(\d+)/);
  return numericMatch ? 100 + Number(numericMatch[1]) : 1000;
};

const sortPopupTermRows = (termRows) =>
  [...termRows].sort((a, b) => {
    const sortDiff = getTermSortValue(a) - getTermSortValue(b);
    if (sortDiff !== 0) return sortDiff;
    return String(a.label).localeCompare(String(b.label), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const getPopupTermRows = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return fallbackTermRows;

  const keys = new Map();
  rows.forEach((row) => {
    const tests = row?.tests && typeof row.tests === "object" ? row.tests : {};
    Object.keys(tests).forEach((key) => {
      const cleanKey = normalizeTermKey(key);

      if (!keys.has(cleanKey)) {
        keys.set(cleanKey, {
          key: cleanKey,
          label: cleanKey.toUpperCase(),
        });
      }
    });
  });

  return keys.size > 0 ? sortPopupTermRows(Array.from(keys.values())) : fallbackTermRows;
};

const getPopupTestEntry = (subj, row) => {
  const tests = subj?.tests && typeof subj.tests === "object" ? subj.tests : {};
  const termKey = normalizeTermKey(row?.key);

  return (
    tests[row?.key] ||
    tests[termKey] ||
    Object.entries(tests).find(([key]) => normalizeTermKey(key) === termKey)?.[1]
  );
};

const getPopupMarkForRow = (subj, row) => {
  const testEntry = getPopupTestEntry(subj, row);

  const testScore = getTestScoreValue(testEntry);
  if (!Number.isNaN(testScore)) {
    return testScore;
  }

  const match = String(row?.key || "").toUpperCase().match(/^(FA|SA)(\d+)$/);
  if (!match) return "-";
  const type = match[1];
  const index = Number(match[2]) - 1;
  const legacyValue = type === "FA" ? subj?.FA?.[index] : subj?.SA?.[index];
  return legacyValue ?? "-";
};

const getPopupMaxForRow = (subj, row) => {
  const testEntry = getPopupTestEntry(subj, row);

  const maxScore = getTestMaxValue(testEntry);
  return Number.isNaN(maxScore) ? "-" : maxScore;
};

const getGradeFromMarks = (obtained, total) => {
  const marks = Number(obtained);
  const maxMarks = Number(total);
  if (Number.isNaN(marks) || Number.isNaN(maxMarks) || maxMarks <= 0) return "-";

  const percentage = (marks / maxMarks) * 100;

  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 40) return "C";
  if (percentage >= 35) return "D";
  return "F";
};

const getPopupTestGrade = (subj, term) => {
  const test = getPopupTestEntry(subj, term);

  if (!test) return "-";

  return getGradeFromMarks(getTestScoreValue(test), getTestMaxValue(test));
};

const getPopupSubjectLabel = (row) =>
  String(row?.subject || row?.subject_name || row?.name || "").trim();

const buildPopupTrendFromRows = (rows, termRows) => {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const points = termRows.map((term) => {
    let obtained = 0;
    let total = 0;
    sourceRows.forEach((item) => {
      const mark = Number(getPopupMarkForRow(item, term));
      const max = Number(getPopupMaxForRow(item, term));
      if (!Number.isNaN(mark) && !Number.isNaN(max) && max > 0) {
        obtained += mark;
        total += max;
      }
    });
    return {
      key: term.key,
      label: term.label,
      value: total > 0 ? Number(((obtained / total) * 100).toFixed(2)) : null,
    };
  });

  const validPoints = points.filter((point) => point.value !== null);
  const transitions = [];
  for (let i = 1; i < validPoints.length; i += 1) {
    const prev = validPoints[i - 1];
    const current = validPoints[i];
    const diff = Number((current.value - prev.value).toFixed(2));
    transitions.push({
      from: prev.label,
      to: current.label,
      diff,
      improved: diff > 0,
      status: diff > 0 ? "Improved" : diff < 0 ? "Declined" : "No Change",
    });
  }

  const overallDiff =
    validPoints.length >= 2
      ? Number((validPoints[validPoints.length - 1].value - validPoints[0].value).toFixed(2))
      : null;

  return {
    points,
    validPoints,
    transitions,
    overallDiff,
  };
};

const getPopupRowTotal = (subj, termRows) => {
  const directTotal = getAnyNumber(subj, [
    "totalMarks",
    "maxMarks",
    "maximumMarks",
    "total",
    "max",
    "obtainedMarks",
    "marksObtained",
    "total_obtained",
    "totalObtained",
    "marks",
    "score",
  ]);

  if (!Number.isNaN(directTotal)) return directTotal;

  let sum = 0;
  let found = false;
  termRows.forEach((term) => {
    const mark = getPopupMarkForRow(subj, term);
    const num = Number(mark);
    if (!Number.isNaN(num)) {
      sum += num;
      found = true;
    }
  });
  return found ? sum : "-";
};

const getPopupRowGrade = (subj, termRows) => {
  if (subj?.grade) return subj.grade;

  let obtained = 0;
  let total = 0;
  termRows.forEach((term) => {
    const mark = Number(getPopupMarkForRow(subj, term));
    const max = Number(getPopupMaxForRow(subj, term));
    if (!Number.isNaN(mark) && !Number.isNaN(max) && max > 0) {
      obtained += mark;
      total += max;
    }
  });

  return getGradeFromMarks(obtained, total);
};

const mockConduct = {
  punctuality: { description: "Admin: 1 Avg Time Delay Issue", grade: "B" },
  discipline: { description: "Class Teacher: Moderate Noisy", grade: "C" },
  behavior: { description: "PTE: Argues with class marks", grade: "B+" },
  cooperation: { description: "Class Teacher: Homework Incomplete", grade: "C+" },
};


const AdiminAcademicsNew = () => {
  const navigate = useNavigate();
  const [performanceTab, setPerformanceTab] = useState("staff");
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [classList, setClassList] = useState([]);
  const [sectionMap, setSectionMap] = useState([]);
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [students, setStudents] = useState([]);
  const [studentMarksMap, setStudentMarksMap] = useState({});
  const [studentAttendanceMap, setStudentAttendanceMap] = useState({});
  const [teacherAttendanceMap, setTeacherAttendanceMap] = useState({});
  const [loadingStudentMarks, setLoadingStudentMarks] = useState(false);
  const [loadingTeacherAttendance, setLoadingTeacherAttendance] = useState(false);
  const [poItems, setPoItems] = useState([]);
  const [loadingPoItems, setLoadingPoItems] = useState(false);
  const [processingPoId, setProcessingPoId] = useState(null);
  const [activeQuickPanel, setActiveQuickPanel] = useState("livechat");
  const [chatRequests, setChatRequests] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPopupTab, setStudentPopupTab] = useState("academics");
  const [studentPopupLoading, setStudentPopupLoading] = useState(false);
  const [studentPopupAcademics, setStudentPopupAcademics] = useState([]);
  const [studentPopupAttendance, setStudentPopupAttendance] = useState([]);
  const [trendSubjectKey, setTrendSubjectKey] = useState("__all__");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherPopupLoading, setTeacherPopupLoading] = useState(false);
  const [teacherPopupError, setTeacherPopupError] = useState("");
  const [teacherPopupAttendance, setTeacherPopupAttendance] = useState([]);
  const [teacherPopupSalary, setTeacherPopupSalary] = useState(null);
  const [popupType, setPopupType] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [party1List, setParty1List] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [showRadiusPopup, setShowRadiusPopup] = useState(false);
  const [showTeacherAttendancePopup, setShowTeacherAttendancePopup] = useState(false);
  const [attendanceView, setAttendanceView] = useState("teacher");
      const [openHelpSection, setOpenHelpSection] = useState(null);
    const[isHelpOpen,setIsHelpOpen]=useState(false)
    const userRole = localStorage.getItem("userRole")

  const [liveChatForm, setLiveChatForm] = useState({
    party1: "",
    className: "",
    section: "",
    student: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
  });
  const [schoolName, setSchoolName] = useState("Unknown School");
  const [schoolLogo, setSchoolLogo] = useState("/default-logo.png");
  const [studentAlertTime, setStudentAlertTime] = useState(null);
  const [teacherAttendanceTimes, setTeacherAttendanceTimes] = useState(null);
const [attendanceRadius, setAttendanceRadius] = useState("");
const [attendanceRadius1, setAttendanceRadius1] = useState( "");
  const [attendanceRadiusDate, setAttendanceRadiusDate] = useState(localStorage.getItem("attendanceRadiusDate") || "");
  const [academicSnapshot, setAcademicSnapshot] = useState({
    extraClasses: [],
    tests: [],
    announcements: [],
    events: [],
    complaints: [],
    totals: {},
  });
  useEffect(() => {
  getAttendanceRadius();
}, []);

const getAttendanceRadius = async () => {
  try {
    const schoolCode = localStorage.getItem("schoolCode");

    const response = await axios.get(
      `https://cleezoclass.com:4000/api/attendance-radius`,
      {
        params: { schoolCode },
      }
    );

    if (response.data.success) {
      setAttendanceRadius1(response.data.radius);
    }
  } catch (error) {
    console.error(error);
  }
};
    const [behaviour, setBehaviour] = useState({});

  useEffect(() => {
    getBehaviourPercentage();
  }, []);

  const getBehaviourPercentage = async () => {
    try {
      const schoolCode = localStorage.getItem("schoolCode");

      const res = await axios.get(
        "https://cleezoclass.com:4000/api/overall-behaviour-percentage",
        {
          params: { schoolCode },
        }
      );

      if (res.data.success) {
        setBehaviour(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const schoolCode = localStorage.getItem("schoolCode") || "";
  const assistantPanelItems = [
    {
      title: "Academics Tab Guidance",
      desc:
        "Use this tab to manage syllabus, exams, heads and student performance. Check pending exam tasks, syllabus tracking, and update discipline/performance records class-wise.",
    },
    {
      title: "Events & Meetings Tab Guidance",
      desc:
        "Plan meetings, assign live chat sessions, publish event calendar updates, and track agenda completion. Review parent meeting status and unresolved discussion points.",
    },
    {
      title: "Store Tab Guidance",
      desc:
        "Track and manage academic/store inventory like books, uniforms, IDs, and utility stock. Validate stock movement and raise replenishment requests early.",
    },
  ];

  const requestItems = useMemo(
    () =>
      chatRequests.filter((item) => {
        const status = String(item?.status || item?.approval_status || "pending").toLowerCase();
        return status === "pending" || status === "requested" || status === "awaiting";
      }),
    [chatRequests]
  );

  const scheduledItems = useMemo(
    () =>
      chatRequests.filter((item) => {
        const status = String(item?.status || item?.approval_status || "").toLowerCase();
        return status === "approved" || status === "scheduled" || status === "fixed";
      }),
    [chatRequests]
  );

  const latestExtraClass = academicSnapshot.extraClasses[0] || null;
  const latestTest = academicSnapshot.tests[0] || null;
  const latestAnnouncement = academicSnapshot.announcements[0] || null;
  const latestCalendarEvent = academicSnapshot.events[0] || null;
  const upcomingTestEvent = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return [...academicSnapshot.events]
      .filter((item) => {
        const eventDate = parseDateValue(item?.eventDate);
        return eventDate && eventDate >= startOfToday && isTestCalendarItem(item);
      })
      .sort(sortByDateAsc("eventDate"))[0] || null;
  }, [academicSnapshot.events]);

  const promotionTitle = academicSnapshot.totals?.totalTests
    ? `${academicSnapshot.totals.totalTests} Tests`
    : `${students.length || classList.length || 0} Records`;
  const promotionSubtitle = academicSnapshot.totals?.poorPerformers != null
    ? `${academicSnapshot.totals.poorPerformers} Low / ${academicSnapshot.totals.highPerformers || 0} High`
    : "Live academics";

  const dynamicFooterCards = [
    {
      title: latestAnnouncement ? formatDateLabel(latestAnnouncement.announcementDate) : "--",
      subtitle: latestAnnouncement?.title || "No announcements",
      meta: "Announcements",
    },
    {
      title: latestCalendarEvent ? formatDateLabel(latestCalendarEvent.eventDate) : "--",
      subtitle: latestCalendarEvent?.eventName || "No calendar events",
      meta: "Calendar",
    },
    {
      title: promotionTitle,
      subtitle: promotionSubtitle,
      meta: "Promotions",
    },
    {
      title: `${academicSnapshot.complaints.length} Complaints`,
      subtitle: `${requestItems.length} Live Chat`,
      meta: "Unofficial",
    },
  ];

  const fetchPoItems = async () => {
    if (!schoolCode) return;
    setLoadingPoItems(true);
    try {
      const res = await fetch(`https://cleezoclass.com:4000/api/po/requests?schoolCode=${schoolCode}`);
      const data = res.ok ? await res.json() : [];
      setPoItems(Array.isArray(data) ? data : []);
    } catch {
      setPoItems([]);
    } finally {
      setLoadingPoItems(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  };

  const openLiveChatPopup = () => setPopupType("liveChat");
  const closePopup = () => setPopupType("");

  useEffect(() => {
    fetchPoItems();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;

    const loadAcademicSnapshot = async () => {
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1);
      const monthValue = `${year}-${month.padStart(2, "0")}`;
      const params = { schoolCode };

      const [
        extraClassRes,
        testsRes,
        announcementRes,
        eventRes,
        complaintsRes,
        totalsRes,
      ] = await Promise.allSettled([
        axios.get(`${ROOT_API_BASE}/extra-special-class-requests`, {
          params: { ...params, limit: 5 },
        }),
        axios.get(`${ROOT_API_BASE}/all-tests-ledger`, { params }),
        axios.get(`${ROOT_API_BASE}/admin-announcements`, {
          params: { ...params, year, month },
        }),
        axios.get(`${ROOT_API_BASE}/admin-events`, {
          params: { ...params, year, month },
        }),
        axios.get(`${ROOT_API_BASE}/complaints`, { params }),
        axios.get(`${ROOT_API_BASE}/dashboard-totals`, {
          params: { ...params, month: monthValue },
        }),
      ]);

      setAcademicSnapshot({
        extraClasses: getSettledArray(extraClassRes),
        tests: getSettledArray(testsRes),
        announcements: getSettledArray(announcementRes),
        events: getSettledArray(eventRes),
        complaints: getSettledArray(complaintsRes),
        totals: getSettledObject(totalsRes),
      });
    };

    loadAcademicSnapshot().catch((error) => {
      console.error("Failed to load academic dashboard snapshot", error);
      setAcademicSnapshot({
        extraClasses: [],
        tests: [],
        announcements: [],
        events: [],
        complaints: [],
        totals: {},
      });
    });
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;
    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => {
        const resolvedSchoolName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.school_name || data?.name || data?.schoolName,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Unknown School",
        });
        const normalizedLogo = normalizeInstituteLogo(data?.logo);
        setSchoolName(resolvedSchoolName);
        setSchoolLogo(normalizedLogo || "/default-logo.png");
        localStorage.setItem("schoolName", resolvedSchoolName);
        localStorage.setItem("instituteName", resolvedSchoolName);
        localStorage.setItem("schoolLogo", normalizedLogo || "/default-logo.png");
      })
      .catch(() => {
        const fallbackSchoolName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Unknown School",
        });
        setSchoolName(fallbackSchoolName);
        localStorage.setItem("schoolName", fallbackSchoolName);
        localStorage.setItem("instituteName", fallbackSchoolName);
        setSchoolLogo("/default-logo.png");
      });
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;

    const loadAttendanceSettings = async () => {
      try {
        const [alertRes, teacherRes] = await Promise.all([
          axios.get("https://cleezoclass.com:4000/api/attendance/get-alert-time", {
            params: { schoolCode },
          }),
          axios.get("https://cleezoclass.com:4000/attendance/get-login-logout-time", {
            params: { schoolCode },
          }),
        ]);

        setStudentAlertTime(alertRes?.data?.data || null);
        setTeacherAttendanceTimes(teacherRes?.data?.data || null);
        const savedRadius = localStorage.getItem("attendanceRadius") || "";
        const savedRadiusDate = localStorage.getItem("attendanceRadiusDate") || "";
        console.log("[Academics][attendance-radius][load]", {
          schoolCode,
          savedRadius,
          savedRadiusDate,
        });
        setAttendanceRadius(savedRadius);
        setAttendanceRadiusDate(savedRadiusDate);
      } catch (error) {
        console.error("Failed to load attendance time settings", error);
        setStudentAlertTime(null);
        setTeacherAttendanceTimes(null);
        const savedRadius = localStorage.getItem("attendanceRadius") || "";
        const savedRadiusDate = localStorage.getItem("attendanceRadiusDate") || "";
        console.log("[Academics][attendance-radius][load-fallback]", {
          schoolCode,
          savedRadius,
          savedRadiusDate,
        });
        setAttendanceRadius(savedRadius);
        setAttendanceRadiusDate(savedRadiusDate);
      }
    };

    loadAttendanceSettings();
  }, [schoolCode]);

  const handleResetStudentAlertTime = async () => {
    if (!schoolCode) return;

    const result = await Swal.fire({
      title: "Reset Student Alert Time?",
      text: "This action cannot be undone.",
      // icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Yes, Reset",
      cancelButtonText: "Cancel",

      confirmButtonColor: "#ef6574",
      cancelButtonColor: "#6b7280",

      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      await axios.post("https://cleezoclass.com:4000/api/attendance/reset-alert-time", {
        schoolCode,
      });
      setStudentAlertTime(null);
    } catch (error) {
      console.error("Failed to reset student alert time", error);
    }
  };

  const handleResetTeacherAttendanceTime = async () => {
    if (!schoolCode) return;
    const result = await Swal.fire({
      title: "Reset Teacher timings?",
      text: "This action cannot be undone.",
      showCancelButton: true,

      confirmButtonText: "Yes, Reset",
      cancelButtonText: "Cancel",

      confirmButtonColor: "#ef6574",
      cancelButtonColor: "#6b7280",

      reverseButtons: true
    })
    if (!result.isConfirmed) return

    try {
      await axios.post("https://cleezoclass.com:4000/attendance/reset-login-logout-time", {
        schoolCode,
      });
      setTeacherAttendanceTimes(null);
    } catch (error) {
      console.error("Failed to reset teacher attendance time", error);
    }
  };
  const handleTeacherCardClick = async (teacher) => {
    const teacherId = teacher?.teacher_id || teacher?.id || teacher?._id;
    if (!teacherId) return;

    setSelectedTeacher(teacher);
    setTeacherPopupLoading(true);
    setTeacherPopupError("");
    setTeacherPopupAttendance([]);
    setTeacherPopupSalary(null);

    try {
      const [teacherRes, salaryRes] = await Promise.all([
        fetch(`https://cleezoclass.com:4000/teacher/${teacherId}?schoolCode=${encodeURIComponent(schoolCode)}`),
        fetch(
          `https://cleezoclass.com:4000/api/salary/${teacherId}?schoolCode=${encodeURIComponent(schoolCode)}`
        ),
      ]);

      if (!teacherRes.ok) {
        const errorText = await teacherRes.text();
        throw new Error(`Failed to fetch teacher details. ${errorText}`);
      }

      const teacherData = await teacherRes.json();
      const salaryData = salaryRes.ok ? await salaryRes.json().catch(() => null) : null;

      setSelectedTeacher(teacherData);
      setTeacherPopupAttendance(Array.isArray(teacherData?.attendance) ? teacherData.attendance : []);
      setTeacherPopupSalary(salaryData);
    } catch (error) {
      console.error("Failed to load teacher details", error);
      setTeacherPopupError(error?.message || "Failed to load teacher details.");
    } finally {
      setTeacherPopupLoading(false);
    }
  };

  const closeTeacherPopup = () => {
    setSelectedTeacher(null);
    setTeacherPopupLoading(false);
    setTeacherPopupError("");
    setTeacherPopupAttendance([]);
    setTeacherPopupSalary(null);
  };

  useEffect(() => {
    if (!schoolCode) return;

    const loadChatRequests = async () => {
      setChatLoading(true);
      setChatError("");
      try {
        const { data } = await axios.get(`https://cleezoclass.com:4000/api/chat-requests`, {
          params: { schoolCode },
        });
        setChatRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load chat requests", error);
        setChatError("Failed to load live chat requests.");
        setChatRequests([]);
      } finally {
        setChatLoading(false);
      }
    };

    loadChatRequests();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;

    const loadLiveChatMeta = async () => {
      try {
        const [{ data: staffData }, { data: classData }] = await Promise.all([
          axios.get("https://cleezoclass.com:4000/api/party1", { params: { schoolCode } }),
          axios.get("https://cleezoclass.com:4000/api/classes", { params: { schoolCode } }),
        ]);

        setParty1List(Array.isArray(staffData) ? staffData : []);
        setClassOptions(Array.isArray(classData) ? classData : []);
      } catch (error) {
        console.error("Failed to load live chat meta", error);
      }
    };

    loadLiveChatMeta();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode || !liveChatForm.className) {
      setSectionOptions([]);
      setStudentOptions([]);
      return;
    }

    axios
      .get(`https://cleezoclass.com:4000/api/sections/${encodeURIComponent(liveChatForm.className)}`, {
        params: { schoolCode },
      })
      .then((res) => {
        setSectionOptions(Array.isArray(res.data) ? res.data : []);
        setLiveChatForm((prev) => ({ ...prev, section: "", student: "" }));
      })
      .catch((error) => {
        console.error("Failed to load sections", error);
        setSectionOptions([]);
      });
  }, [schoolCode, liveChatForm.className]);

  useEffect(() => {
    if (!schoolCode || !liveChatForm.className || !liveChatForm.section) {
      setStudentOptions([]);
      return;
    }

    axios
      .get(
        `https://cleezoclass.com:4000/api/admin/students/${encodeURIComponent(liveChatForm.className)}/${encodeURIComponent(liveChatForm.section)}`,
        { params: { schoolCode } }
      )
      .then((res) => {
        setStudentOptions(Array.isArray(res.data) ? res.data : []);
        setLiveChatForm((prev) => ({ ...prev, student: "" }));
      })
      .catch((error) => {
        console.error("Failed to load students", error);
        setStudentOptions([]);
      });
  }, [schoolCode, liveChatForm.className, liveChatForm.section]);

  const handleCreateLiveChatRequest = async () => {
    const { party1, className, section, student, date, time } = liveChatForm;

    if (!party1 || !className || !section || !student) {
      setPopupMessage("Staff, class, section, and student are required.");
      return;
    }

    const party1Obj = party1List.find((item) => item.name === party1);
    if (!party1Obj) {
      setPopupMessage("Please select a valid staff member.");
      return;
    }

    try {
      const { data } = await axios.post("https://cleezoclass.com:4000/api/chat-request", {
        party1_id: party1Obj.id,
        party1_name: party1Obj.name,
        party2_class: className,
        party2_section: section,
        party2_student: student,
        date,
        time,
        schoolCode,
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to save chat request.");
      }

      setPopupMessage("Individual chat request has been successfully saved.");
      setLiveChatForm({
        party1: "",
        className,
        section,
        student: "",
        date: new Date().toISOString().split("T")[0],
        time: "",
      });
      closePopup();
      if (schoolCode) {
        const { data: refreshed } = await axios.get("https://cleezoclass.com:4000/api/chat-requests", {
          params: { schoolCode },
        });
        setChatRequests(Array.isArray(refreshed) ? refreshed : []);
      }
    } catch (error) {
      console.error("Failed to save chat request", error);
      setPopupMessage(error?.response?.data?.message || error.message || "Failed to save chat request.");
    }
  };

  const handleProcessPO = async (item, newStatus) => {
    const poId = item?.id || item?.po_id || item?.request_id;
    if (!poId || !schoolCode) return;

    if (newStatus === "OK" && (!item?.stockName && !item?.stock_name)) {
      alert("Missing stock details for accept action.");
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to ${newStatus} PO ID ${poId}?`);
    if (!confirmed) return;

    setProcessingPoId(String(poId));
    try {
      const response = await fetch("https://cleezoclass.com:4000/api/po/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: poId,
          new_status: newStatus,
          stockName: item?.stockName || item?.stock_name || null,
          quantity: item?.quantity || null,
          category: item?.category || null,
          schoolCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData?.error || `Failed to ${newStatus} PO.`);
        return;
      }

      await fetchPoItems();
    } catch (error) {
      alert(`Error processing PO: ${error.message}`);
    } finally {
      setProcessingPoId(null);
    }
  };

  useEffect(() => {
    if (!schoolCode) return;
    setLoadingTeachers(true);
    axios
      .post("https://cleezoclass.com:4000/api/users", {
        schoolCode,
        user_type: "teacher",
      })
      .then((res) => {
        setTeachers(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        setTeachers([]);
      })
      .finally(() => {
        setLoadingTeachers(false);
      });
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode || teachers.length === 0) {
      setTeacherAttendanceMap({});
      return;
    }

    let ignore = false;
    setLoadingTeacherAttendance(true);

    Promise.all(
      teachers.map(async (teacher) => {
        const teacherId = teacher?.teacher_id || teacher?.id || teacher?._id;
        if (!teacherId) return [teacherId, null];

        try {
          const response = await axios.get(`https://cleezoclass.com:4000/teacher/${teacherId}`, {
            params: { schoolCode },
          });
          return [teacherId, buildTeacherAttendanceSummary(response.data)];
        } catch (error) {
          console.error("Failed to load teacher attendance", teacherId, error);
          return [teacherId, buildTeacherAttendanceSummary(null)];
        }
      })
    )
      .then((entries) => {
        if (ignore) return;
        setTeacherAttendanceMap(Object.fromEntries(entries.filter(([id]) => id)));
      })
      .finally(() => {
        if (!ignore) setLoadingTeacherAttendance(false);
      });

    return () => {
      ignore = true;
    };
  }, [teachers, schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;
    setDropdownLoading(true);
    Promise.all([
      axios.get(`${API_BASE}/classes?schoolCode=${schoolCode}`),
      axios.get(`${API_BASE}/sectionFilter?schoolCode=${schoolCode}`),
    ])
      .then(([classRes, sectionRes]) => {
        const classesFromAPI = Array.isArray(classRes.data)
          ? classRes.data
          : classRes.data?.classes || [];
        const sectionsFromAPI = Array.isArray(sectionRes.data)
          ? sectionRes.data
          : sectionRes.data?.sections || [];
        setClassList(classesFromAPI);
        setSectionMap(sectionsFromAPI);
      })
      .catch(() => {
        setClassList([]);
        setSectionMap([]);
      })
      .finally(() => {
        setDropdownLoading(false);
      });
  }, [schoolCode]);

  useEffect(() => {
    if (!className || !section || !schoolCode) {
      setStudents([]);
      setStudentMarksMap({});
      setStudentAttendanceMap({});
      return;
    }

    axios
      .get(
        `https://cleezoclass.com:4000/api/studentsNameAccountant/${className}?schoolCode=${schoolCode}&section=${section}`
      )
      .then((res) => {
        setStudents(res.data?.students || []);
      })
      .catch(() => {
        setStudents([]);
        setStudentMarksMap({});
        setStudentAttendanceMap({});
      });
  }, [className, section, schoolCode]);

  // useEffect(() => {
  //   if (!schoolCode || !className || !section || students.length === 0) {
  //     setStudentMarksMap({});
  //     setStudentAttendanceMap({});
  //     return;
  //   }

  //   let ignore = false;
  //   setLoadingStudentMarks(true);

  //   Promise.all(
  //     students.map(async (student) => {
  //       try {
  //         const payload = {
  //           name: student.name,
  //           class_name: className,
  //           section,
  //           schoolCode,
  //         };
  //         const [performanceRes, attendanceRes] = await Promise.all([
  //           axios.post(
  //             "https://cleezoclass.com:4000/api/overall/academic-performance",
  //             payload
  //           ),
  //           axios.post(
  //             "https://cleezoclass.com:4000/api/report/attendance/monthly",
  //             payload
  //           ),
  //         ]);
  //         return [
  //           student.id,
  //           {
  //             performance: buildPerformanceSummary(performanceRes.data),
  //             attendance: buildAttendanceSummary(attendanceRes.data),
  //           },
  //         ];
  //       } catch {
  //         return [
  //           student.id,
  //           {
  //             performance: { obtained: 0, total: 0, percent: null, grade: null },
  //             attendance: null,
  //           },
  //         ];
  //       }
  //     })
  //   )
  //     .then((entries) => {
  //       if (ignore) return;
  //       const combined = Object.fromEntries(entries);
  //       const marks = {};
  //       const attendance = {};
  //       Object.entries(combined).forEach(([studentId, value]) => {
  //         marks[studentId] = value.performance;
  //         attendance[studentId] = value.attendance;
  //       });
  //       setStudentMarksMap(marks);
  //       setStudentAttendanceMap(attendance);
  //     })
  //     .finally(() => {
  //       if (!ignore) setLoadingStudentMarks(false);
  //     });

  //   return () => {
  //     ignore = true;
  //   };
  // }, [students, schoolCode, className, section]);
  const [studentPopupBehavior, setStudentPopupBehavior] = useState([]);
  // useEffect(() => {
  //   if (!schoolCode || !className || !section || students.length === 0) {
  //     setStudentMarksMap({});
  //     setStudentAttendanceMap({});
  //     return;
  //   }

  //   let ignore = false;
  //   setLoadingStudentMarks(true);

  //   Promise.all(
  //     students.map(async (student) => {
  //       try {
  //         const payload = {
  //           name: student.name,
  //           class_name: className,
  //           section,
  //           schoolCode,
  //         };
  //         const [performanceRes, attendanceRes] = await Promise.all([
  //           axios.post(
  //             "https://cleezoclass.com:4000/api/overall/academic-performance",
  //             payload
  //           ),
  //           axios.post(
  //             "https://cleezoclass.com:4000/api/report/attendance/monthly",
  //             payload
  //           ),
  //         ]);
  //         return [
  //           student.id,
  //           {
  //             performance: buildPerformanceSummary(performanceRes.data),
  //             attendance: buildAttendanceSummary(attendanceRes.data),
  //           },
  //         ];
  //       } catch {
  //         return [
  //           student.id,
  //           {
  //             performance: { obtained: 0, total: 0, percent: null, grade: null },
  //             attendance: null,
  //           },
  //         ];
  //       }
  //     })
  //   )
  //     .then((entries) => {
  //       if (ignore) return;
  //       const combined = Object.fromEntries(entries);
  //       const marks = {};
  //       const attendance = {};
  //       Object.entries(combined).forEach(([studentId, value]) => {
  //         marks[studentId] = value.performance;
  //         attendance[studentId] = value.attendance;
  //       });
  //       setStudentMarksMap(marks);
  //       setStudentAttendanceMap(attendance);
  //     })
  //     .finally(() => {
  //       if (!ignore) setLoadingStudentMarks(false);
  //     });

  //   return () => {
  //     ignore = true;
  //   };
  // }, [students, schoolCode, className, section]);


    const [performance, setPerformance] = useState({});

    useEffect(() => {
        getOverallPerformance();
    }, []);

    const getOverallPerformance = async () => {

        try {

            const schoolCode = localStorage.getItem("schoolCode");

            const response = await axios.get(
                "https://cleezoclass.com:4000/api/overall-performance-percentage",
                {
                    params: {
                        schoolCode,
                    },
                }
            );

            if (response.data.success) {
                setPerformance(response.data.data);
            }

        } catch (error) {
            console.log(error);
        }

    };
  useEffect(() => {
    if (!selectedStudent || !schoolCode || !className || !section) return;

    let ignore = false;
    setStudentPopupLoading(true);

    const payload = {
      name: selectedStudent.name,
      class_name: className,
      section,
      schoolCode,
    };

    Promise.all([
      axios.post("https://cleezoclass.com:4000/api/overall/academic-performance", payload),
      axios.post("https://cleezoclass.com:4000/api/report/attendance/monthly", payload),
      axios.get("https://cleezoclass.com:4000/api/student/behavior", { params: payload }),
    ])
      .then(([performanceRes, attendanceRes, behaviorRes]) => {

        if (ignore) return;

        const performanceData = Array.isArray(performanceRes.data)
          ? performanceRes.data
          : performanceRes.data?.performance || [];

        const attendanceData = Array.isArray(attendanceRes.data?.monthly)
          ? attendanceRes.data.monthly
          : [];

        const behaviorData = Array.isArray(behaviorRes.data)
          ? behaviorRes.data
          : [];

        // ✅ DEBUG LOGS
        console.log("📊 Academic Performance:", performanceData);
        console.log("📅 Attendance Data:", attendanceData);
        console.log("🧠 Behavior API Raw Response:", behaviorRes.data);
        console.log("🧠 Behavior Parsed Data:", behaviorData);

        setStudentPopupAcademics(performanceData);
        setStudentPopupAttendance(attendanceData);
        setStudentPopupBehavior(behaviorData);
      })
      .catch((err) => {
        console.error("❌ API Error:", err);

        if (ignore) return;
        setStudentPopupAcademics([]);
        setStudentPopupAttendance([]);
        setStudentPopupBehavior([]);
      })
      .finally(() => {
        if (!ignore) setStudentPopupLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedStudent, schoolCode, className, section]);
  const getClassLabel = (cls) => {
    if (cls == null) return "";
    if (typeof cls === "string" || typeof cls === "number") return String(cls);
    return cls.class_name || cls.className || cls.class || cls.name || cls.label || "";
  };

  const derivedClasses = useMemo(() => {
    if (classList.length > 0) return classList;
    const classSet = new Set();
    sectionMap.forEach((item) => {
      const classValue = item?.class_name || item?.class || item?.className;
      if (classValue != null) classSet.add(String(classValue));
    });
    return Array.from(classSet);
  }, [classList, sectionMap]);

  const derivedSections = useMemo(() => {
    if (!className) return [];
    return sectionMap
      .filter((item) => {
        const classValue = item?.class_name || item?.class || item?.className;
        return String(classValue) === String(className);
      })
      .map((item) => item.section || item.section_name || item.sectionName)
      .filter(Boolean);
  }, [sectionMap, className]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter(
      (student) =>
        student.name?.toLowerCase().includes(term) || String(student.id).includes(term)
    );
  }, [students, searchTerm]);

  const hasTeacherAttendanceTimes =
    Boolean(teacherAttendanceTimes?.LOGIN_TIME) || Boolean(teacherAttendanceTimes?.LOGOUT_TIME);
  const teacherAttendanceDate = teacherAttendanceTimes?.UPLOADED_DATE
    ? new Date(teacherAttendanceTimes.UPLOADED_DATE).toLocaleDateString("en-IN")
    : "";
  const teacherAttendanceSummary = hasTeacherAttendanceTimes
    ? `    ${formatAttendanceClock(teacherAttendanceTimes?.LOGIN_TIME)} |  ${formatAttendanceClock(teacherAttendanceTimes?.LOGOUT_TIME)}`
    : "Teacher Attendance - No time set yet.";
  const hasStudentAlertTime = Boolean(studentAlertTime?.alert_time);
  const studentAlertDate = studentAlertTime?.uploaded_date
    ? new Date(studentAlertTime.uploaded_date).toLocaleDateString("en-IN")
    : "";
  const studentAlertSummary = hasStudentAlertTime
    ? `Student Alert - ${formatStoredTime(studentAlertTime?.alert_time)}`
    : "Student Alert - No time set yet.";
  const hasAttendanceRadius = Boolean(attendanceRadius);
  const attendanceRadiusSummary = hasAttendanceRadius
    ? `${attendanceRadius} meters`
    : "No radius set yet.";
  const attendanceRadiusAddedDate = attendanceRadiusDate ? `Added on: ${attendanceRadiusDate}` : "";
  const staffAttendanceStats = useMemo(() => {
    const values = Object.values(teacherAttendanceMap).filter(Boolean);
    const numericValues = values
      .map((item) => Number(item?.percent))
      .filter((value) => !Number.isNaN(value));

    if (numericValues.length === 0) {
      return { average: null, total: 0 };
    }

    const average = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
    return { average: average.toFixed(1), total: numericValues.length };
  }, [teacherAttendanceMap]);

  const popupTermRows = useMemo(
    () => getPopupTermRows(studentPopupAcademics),
    [studentPopupAcademics]
  );

  const popupSubjectOptions = useMemo(() => {
    const seen = new Set();
    return studentPopupAcademics
      .map((row, index) => {
        const label = getPopupSubjectLabel(row);
        if (!label) return null;
        const key = `${label.toLowerCase()}-${index}`;
        if (seen.has(label.toLowerCase())) return null;
        seen.add(label.toLowerCase());
        return { key, label };
      })
      .filter(Boolean);
  }, [studentPopupAcademics]);

  const popupAcademicTrend = useMemo(() => {
    return buildPopupTrendFromRows(studentPopupAcademics, popupTermRows);
  }, [popupTermRows, studentPopupAcademics]);

  const selectedSubjectRow = useMemo(() => {
    if (trendSubjectKey === "__all__") return null;
    return studentPopupAcademics.find((row, index) => {
      const label = getPopupSubjectLabel(row);
      return `${label.toLowerCase()}-${index}` === trendSubjectKey;
    }) || null;
  }, [trendSubjectKey, studentPopupAcademics]);

  const activeTrend = useMemo(() => {
    if (!selectedSubjectRow) return popupAcademicTrend;
    return buildPopupTrendFromRows([selectedSubjectRow], popupTermRows);
  }, [selectedSubjectRow, popupAcademicTrend, popupTermRows]);

  const activeTrendTitle = selectedSubjectRow
    ? `Test Type Trend (${getPopupSubjectLabel(selectedSubjectRow)})`
    : "Test Type Performance Trend (All Subjects)";

  const teacherPopupStats = useMemo(() => {
    const attendance = Array.isArray(teacherPopupAttendance) ? teacherPopupAttendance : [];
    const presentDays = attendance.filter((entry) => {
      const status = String(entry?.status || entry?.attendance_status || "present").toLowerCase();
      return status === "present" || status === "p";
    }).length;
    const lateDays = attendance.filter((entry) => {
      const status = String(entry?.status || entry?.attendance_status || "").toLowerCase();
      const entryTime = String(entry?.entry_time || entry?.login_time || "").trim();
      return status.includes("late") || Boolean(entryTime && entryTime > "09:00:00");
    }).length;
    const totalDays = attendance.length;
    const percent = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : null;
    return { presentDays, lateDays, totalDays, percent };
  }, [teacherPopupAttendance]);

  useEffect(() => {
    if (!selectedStudent || !schoolCode || !className || !section) return;

    let ignore = false;
    setStudentPopupLoading(true);

    const payload = {
      name: selectedStudent.name,
      class_name: className,
      section,
      schoolCode,
    };

    Promise.all([
      axios.post("https://cleezoclass.com:4000/api/overall/academic-performance", payload),
      axios.post("https://cleezoclass.com:4000/api/report/attendance/monthly", payload),
    ])
      .then(([performanceRes, attendanceRes]) => {
        if (ignore) return;
        const performanceData = Array.isArray(performanceRes.data)
          ? performanceRes.data
          : performanceRes.data?.performance || [];
        const attendanceData = Array.isArray(attendanceRes.data?.monthly)
          ? attendanceRes.data.monthly
          : [];
        setStudentPopupAcademics(performanceData);
        setStudentPopupAttendance(attendanceData);
      })
      .catch(() => {
        if (ignore) return;
        setStudentPopupAcademics([]);
        setStudentPopupAttendance([]);
      })
      .finally(() => {
        if (!ignore) setStudentPopupLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [selectedStudent, schoolCode, className, section]);

  useEffect(() => {
    setTrendSubjectKey("__all__");
  }, [selectedStudent]);
useEffect(() => {
    const handlePopState = () => {
      if (showRadiusPopup) {
        setShowRadiusPopup(false);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [showRadiusPopup]);
  const academicPercentage = Number(performance.overallPercentage || 0);



const behaviourPercentage =
  100 -
  (Number(behaviour.needsImprovementPercentage || 0) +
   Number(behaviour.negativePercentage || 0));

const overallPerformance = (
  (
    academicPercentage 
   
  
  ) / 1
).toFixed(1);
const progressDegree = `${Number(overallPerformance || 0) * 3.6}deg`;
  return (
    <div className="dashboard-page dashboard-home-page frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page admin-academics-page">
      <div className="dashboard-shell accountant-dashboard-shell">
        <aside className="dashboard-sidebar accountant-sidebar-strip">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`dashboard-sidebar-item accountant-sidebar-item ${item.key === "academics" ? "dashboard-sidebar-item-active accountant-sidebar-item-active" : ""}`}
              onClick={() => navigate(item.route)}
            >
              <div className="dashboard-sidebar-item-icon accountant-sidebar-item-icon">
                <img src={item.icon} alt={item.label} />
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <div className="dashboard-main accountant-main-area">
          <div className="dashboard-topbar accountant-topbar">
            <div className="dashboard-topbar-left accountant-topbar-left">
              {["Dashboard", "Academics", "Events & Meetings", "Reports"].map((tab) => (
                <div
                  key={tab}
                  className={`dashboard-topbar-tab accountant-topbar-tab ${tab === "Academics" ? "dashboard-topbar-tab-active accountant-topbar-tab-active" : ""}`}
                >
                  <button
                    className="accountant-topbar-tab-button"
                    type="button"
                    onClick={() => {
                      if (tab === "Dashboard") navigate("/AdminDashboard");
                      if (tab === "Events & Meetings") navigate("/AdminEventsAndMeetings");
                      if (tab === "Academics") navigate("/AdiminAcademicsNew");
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
 <button
           className="accountant-help-icon-btn"
           onClick={() => setIsHelpOpen(true)}
         >
         <FiHelpCircle
         style={{
           color: "#e9818c",
           fontSize: "34px"
         }}
       />
         </button>
              <EditableProfileMenu showHrSwitch />
            </div>
          </div>

          <div className="admin-academics-content">
            <div className="admin-academics-top">
              <div className="accountant-welcome-block">
                <h2>Hi, {getUserDisplayName()}!</h2>
                <p>Check Store Inventory,</p>
                <p>Report Track to Class Teacher</p>
                <p>Submit Building maintenance</p>
              </div>

              <div className="admin-academics-summary accountant-card">
<div
  className="accountant-progress-panel"
  style={{
    "--admission-progress": progressDegree,
  }}
>
  <div className="accountant-progress-ring">
    <div className="accountant-progress-ring-inner">
{performance.overallPercentage || 0}%    </div>
  </div>
</div>
                <div className="admin-academics-summary-stats">
         

                  <p><span>Performance - student:</span> <strong>{performance.overallPercentage || 0}%</strong></p>
                  
      <p> Positive: <strong>{behaviour.positivePercentage || 0}%</strong></p>

          <p>Needs Improvement: <strong>{behaviour.needsImprovementPercentage || 0}%</strong></p>

      <p> Negative: <strong>{behaviour.negativePercentage || 0}%</strong></p>
                  {/* <p><span>Staff overtime:</span> <strong>6 Teachers</strong></p> */}
                </div>
                <div className="admin-academics-summary-right">
                  <button type="button" className="collect-filter">
                    <span>As on today</span>
                  </button>
                  <div className="admin-academics-exam">
                    <h3>Exam Schedule</h3>
                    <p>
                      {upcomingTestEvent
                        ? `${upcomingTestEvent.eventName || "Test"} | ${formatDateLabel(upcomingTestEvent.eventDate)}`
                        : "No upcoming test"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="accountant-mini-cards">
                {quickCards.map((card) => (
                  <div
                    key={card.title}
                    className="accountant-quick-card accountant-card accountant-quick-card-clickable"
                    onClick={() => setActiveQuickPanel(card.key)}
                  >
                    <div className="">
                      <img src={card.icon} alt={card.title} />
                    </div>
                    <h4>{card.title}</h4>
                    <p>{card.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-academics-main">
              <div className="admin-academics-performance accountant-card">

                {/* HEADER */}
                <div className="admin-academics-performance-header">

                  <div>
                    <h3>Performance</h3>
                  </div>

                  {/* TABS */}
                  <div className="admin-academics-performance-tabs">
                    <button
                      type="button"
                      className={performanceTab === "staff" ? "active" : ""}
                      onClick={() => setPerformanceTab("staff")}
                    >
                      Staff
                    </button>

                    <button
                      type="button"
                      className={performanceTab === "students" ? "active" : ""}
                      onClick={() => setPerformanceTab("students")}
                    >
                      Student
                    </button>

                    <strong>
                      {performanceTab === "students"
                        ? filteredStudents.length
                        : teachers.length}
                    </strong>

                    <span>
                      {performanceTab === "students"
                        ? "Class Strength"
                        : "Staff Strength"}
                    </span>
                  </div>

                  {/* FILTERS */}
                  <div className="admin-academics-filters">

                    {/* SEARCH */}
                    <input
                      type="text"
                      placeholder={
                        performanceTab === "students"
                          ? "Search students..."
                          : "Search teachers..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* ✅ SHOW ONLY FOR STUDENTS */}
                    {performanceTab === "students" && (
                      <>
                        <select
                          value={className}
                          onChange={(e) => {
                            setClassName(e.target.value);
                            setSection("");
                          }}
                          disabled={dropdownLoading}
                        >
                          <option value="">Class</option>
                          {derivedClasses.map((cls) => {
                            const classLabel = getClassLabel(cls);
                            if (!classLabel) return null;
                            return (
                              <option key={classLabel} value={classLabel}>
                                {classLabel}
                              </option>
                            );
                          })}
                        </select>

                        <select
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          disabled={dropdownLoading || !className}
                        >
                          <option value="">Section</option>
                          {derivedSections.map((sec) => (
                            <option key={sec} value={sec}>
                              {sec}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                </div>

                {/* GRID */}
                <div className="admin-academics-students-grid">

                  {/* ================= STAFF ================= */}
                  {performanceTab === "staff" ? (
                    loadingTeachers ? (
                      <div className="admin-academics-empty">Loading teachers...</div>
                    ) : teachers.length === 0 ? (
                      <div className="admin-academics-empty">No teachers found.</div>
                    ) : (
                      teachers
                        .filter((teacher) => {
                          const term = searchTerm.trim().toLowerCase();
                          if (!term) return true;
                          const name = teacher.teacher_name || teacher.name || "";
                          return name.toLowerCase().includes(term);
                        })
                        .map((teacher, index) => {

                          // ✅ EXTRACT CLASSES
                          const classes = Object.keys(teacher)
                            .filter(
                              (key) =>
                                key.startsWith("teaches_to_") && teacher[key]
                            )
                            .map((key) => teacher[key]);

                          return (
                            <div
                              key={teacher.teacher_id || index}
                              className="admin-academics-student-card admin-academics-student-card-clickable"
                              onClick={() => handleTeacherCardClick(teacher)}
                            >
                              <div className="admin-academics-student-avatar-wrap">
                                <div className="admin-academics-student-avatar">
                                  <FaUser />
                                </div>
                              </div>

                              <div className="admin-academics-student-name">
                                {teacher.teacher_name || teacher.name || "Teacher"}
                              </div>

                              <div className="admin-academics-student-meta">
                                Subject:{" "}
                                {teacher.designation ||
                                  teacher.subject ||
                                  teacher.phone_no ||
                                  "-"}
                              </div>

                              <div className="admin-academics-student-score">
                                Teacher ID: {teacher.teacher_id || "-"}
                              </div>

                              <div className="admin-academics-student-score">
                                Classes: {classes.length > 0 ? classes.join(", ") : "-"}
                              </div>

                              <div className="admin-academics-student-score">
                                {loadingTeacherAttendance
                                  ? "Loading attendance..."
                                  : teacherAttendanceMap[teacher.teacher_id || teacher.id || teacher._id]
                                    ? `Attendance: ${teacherAttendanceMap[teacher.teacher_id || teacher.id || teacher._id].percent ?? "-"}%`
                                    : "Attendance: -"}
                              </div>

                              <div className="admin-academics-student-score">
                                {teacherAttendanceMap[teacher.teacher_id || teacher.id || teacher._id]?.latestDate
                                  ? `Updated: ${teacherAttendanceMap[teacher.teacher_id || teacher.id || teacher._id].latestDate}`
                                  : ""}
                              </div>
                            </div>
                          );
                        })
                    )
                  ) : filteredStudents.length === 0 ? (

                    /* ================= STUDENTS EMPTY ================= */
                    <div className="admin-academics-empty">
                      {className && section
                        ? "No students found."
                        : "Please select class and section."}
                    </div>

                  ) : (

                    /* ================= STUDENTS ================= */
                    filteredStudents.map((student, index) => (
                      <div
                        key={student.id || index}
                        className={`admin-academics-student-card admin-academics-student-card-clickable ${selectedStudent?.id === student.id
                          ? "is-selected"
                          : ""
                          }`}
                        onClick={() => {
                          setSelectedStudent(student);
                          setStudentPopupTab("attendance");
                        }}
                      >
                        <div className="admin-academics-student-avatar-wrap">
                          {student.photo?.data ? (
                            <img
                              src={`https://cleezoclass.com:4000${bufferToPathString(
                                student.photo.data
                              )}`}
                              alt={student.name || "Student"}
                              className="admin-academics-student-photo"
                            />
                          ) : (
                            <div className="admin-academics-student-avatar">
                              <FaUser />
                            </div>
                          )}
                        </div>

                        <div className="admin-academics-student-name">
                          {student.name || "Student"}
                        </div>

                        <div className="admin-academics-student-meta">
                          {className && section
                            ? `${className} - ${section}`
                            : "Student"}
                        </div>

                        <div className="admin-academics-student-score">
                          {loadingStudentMarks
                            ? "Loading marks..."
                            : studentMarksMap[student.id]?.total
                              ? `Marks: ${studentMarksMap[student.id].obtained
                              }/${studentMarksMap[student.id].total
                              } (${studentMarksMap[student.id].percent}%) | Grade: ${studentMarksMap[student.id].grade
                              }`
                              : `ID: ${student.id || "-"}`}
                        </div>

                        <div className="admin-academics-student-score">
                          {loadingStudentMarks
                            ? "Loading attendance..."
                            : studentAttendanceMap[student.id]
                              ? `Attendance: ${studentAttendanceMap[student.id]}%`
                              : "Attendance: -"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="admin-academics-right-column">
                <div className="admin-academics-storepo accountant-card">
                  <div className="admin-academics-side-header">
                    <h3>
                      {activeQuickPanel === "assistant"
                        ? "Assistant Actions"
                        : activeQuickPanel === "storepo"
                          ? "Store PO"
                          : "Live Chat"}
                    </h3>
                    <div className="accountant-card-filters admin-academics-request-count">
                      {activeQuickPanel === "livechat" ? (
                        <button type="button" className="admin-events-create-btn" onClick={openLiveChatPopup}>
                          + Create New
                        </button>
                      ) : null}
                      <div className="accountant-feetype-count">
                        <strong>
                          {activeQuickPanel === "assistant"
                            ? assistantPanelItems.length
                            : activeQuickPanel === "storepo"
                              ? poItems.length
                              : chatRequests.length}
                        </strong>
                        <span>
                          {activeQuickPanel === "assistant"
                            ? "Actions"
                            : activeQuickPanel === "storepo"
                              ? "Requests"
                              : "Chats"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {popupType === "liveChat" && (
                    <div className="admin-events-modal-overlay" onClick={closePopup}>
                      <div className="admin-events-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-events-card-header">
                          <h3>Individual Chat Request</h3>
                          <button type="button" className="admin-events-modal-close" onClick={closePopup}>×</button>
                        </div>
                        <div className="admin-events-form-grid">
                          <select
                            className="admin-events-input"
                            value={liveChatForm.party1}
                            onChange={(e) => setLiveChatForm((prev) => ({ ...prev, party1: e.target.value }))}
                          >
                            <option value="">Party 1 Staff</option>
                            {party1List.map((item) => (
                              <option key={item.id} value={item.name}>
                                {item.name} ({item.user_type})
                              </option>
                            ))}
                          </select>
                          <select
                            className="admin-events-input"
                            value={liveChatForm.className}
                            onChange={(e) => setLiveChatForm((prev) => ({ ...prev, className: e.target.value }))}
                          >
                            <option value="">Class</option>
                            {classOptions.map((item, index) => (
                              <option key={`${item}-${index}`} value={String(item)}>
                                {String(item)}
                              </option>
                            ))}
                          </select>
                          <select
                            className="admin-events-input"
                            value={liveChatForm.section}
                            onChange={(e) => setLiveChatForm((prev) => ({ ...prev, section: e.target.value }))}
                            disabled={!liveChatForm.className}
                          >
                            <option value="">Section</option>
                            {sectionOptions.map((item, index) => (
                              <option key={`${item}-${index}`} value={String(item)}>
                                {String(item)}
                              </option>
                            ))}
                          </select>
                          <select
                            className="admin-events-input"
                            value={liveChatForm.student}
                            onChange={(e) => setLiveChatForm((prev) => ({ ...prev, student: e.target.value }))}
                            disabled={!liveChatForm.className || !liveChatForm.section}
                          >
                            <option value="">Student</option>
                            {studentOptions.map((item, index) => (
                              <option key={`${item?.id || index}`} value={item?.name || item?.student_name || ""}>
                                {item?.name || item?.student_name || "Student"}
                              </option>
                            ))}
                          </select>
                          <input
                            className="admin-events-input"
                            type="date"
                            value={liveChatForm.date}
                            onChange={(e) => setLiveChatForm((prev) => ({ ...prev, date: e.target.value }))}
                          />
                          <input
                            className="admin-events-input"
                            type="time"
                            value={liveChatForm.time}
                            onChange={(e) => setLiveChatForm((prev) => ({ ...prev, time: e.target.value }))}
                          />
                        </div>
                        <div className="admin-events-action-row">
                          <button type="button" className="admin-events-submit-btn" onClick={handleCreateLiveChatRequest}>
                            Create Chat Request
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <ErrorPopup message={popupMessage} onClose={() => setPopupMessage("")} />

                  <div className="admin-academics-side-subtitle">
                    {activeQuickPanel === "livechat"
                      ? "Requests"
                      : activeQuickPanel === "assistant"
                        ? "Assistant Guidance"
                        : "Requests PO"}
                  </div>

                  <div className="admin-academics-po-list">
                    {activeQuickPanel === "livechat" ? (
                      <>
                        {chatLoading ? (
                          <div className="admin-academics-po-item">
                            <span>Loading...</span>
                          </div>
                        ) : chatError ? (
                          <div className="admin-academics-po-item">
                            <span>{chatError}</span>
                          </div>
                        ) : requestItems.length === 0 ? (
                          <div className="admin-academics-po-item">
                            <span>No requests found.</span>
                          </div>
                        ) : (
                          requestItems.map((item, index) => (
                            <div key={`req-${item?.id || item?.request_id || index}`} className="admin-academics-po-item">
                              <span>
                                Live Chat (P - T) - {formatChatDateTime(
                                  item?.preferred_date || item?.date || item?.requested_date,
                                  item?.preferred_time || item?.time || item?.requested_time
                                )} - {item?.party1_name || item?.teacher_name || "Staff"} to {item?.party2_student || item?.student_name || "Student"}, {item?.party2_class || item?.class_name || "-"}{item?.party2_section || item?.section || ""}
                              </span>
                            </div>
                          ))
                        )}

                        <div className="admin-academics-side-subtitle">Scheduled</div>
                        {scheduledItems.length === 0 ? (
                          <div className="admin-academics-po-item">
                            <span>No scheduled chats found.</span>
                          </div>
                        ) : (
                          scheduledItems.map((item, index) => (
                            <div key={`sch-${item?.id || item?.request_id || index}`} className="admin-academics-po-item">
                              <span>
                                Live Chat (T - P) - {formatChatDateTime(
                                  item?.approved_date || item?.date || item?.requested_date,
                                  item?.approved_time || item?.time || item?.requested_time
                                )} - {item?.party1_name || item?.teacher_name || "Staff"} to {item?.party2_student || item?.student_name || "Student"}, {item?.party2_class || item?.class_name || "-"}{item?.party2_section || item?.section || ""}
                              </span>
                            </div>
                          ))
                        )}
                      </>
                    ) : activeQuickPanel === "assistant" ? (
                      assistantPanelItems.map((item) => (
                        <div key={item.title} className="admin-academics-assistant-item">
                          <strong>{item.title}</strong>
                          <span>{item.desc}</span>
                        </div>
                      ))
                    ) : loadingPoItems ? (
                      <div className="admin-academics-po-item">
                        <span>Loading PO requests...</span>
                      </div>
                    ) : poItems.length === 0 ? (
                      <div className="admin-academics-po-item">
                        <span>No PO requests found.</span>
                      </div>
                    ) : (
                      poItems.map((item, index) => (
                        <div key={item.id || item.po_id || index} className="admin-academics-po-item">
                          <span>
                            {item.text ||
                              `${item.id ? `PO${item.id} - ` : ""}${item.date || item.created_at || ""}, ${item.stockName || item.stock_name || "Stock"}${item.quantity ? ` ${item.quantity}` : ""}`}
                          </span>
                          <div className="admin-academics-po-actions">
                            <button
                              type="button"
                              onClick={() => handleProcessPO(item, "OK")}
                              disabled={processingPoId === String(item.id || item.po_id || item.request_id)}
                              title="Accept"
                            >
                              ▷
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProcessPO(item, "Rejected")}
                              disabled={processingPoId === String(item.id || item.po_id || item.request_id)}
                              title="Reject"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
            <div className="admin-academics-bottom">
              <div className="admin-academics-tests accountant-card admin-academics-alerts">
                <div className="admin-academics-test-item admin-academics-alert-item">
                  <strong>Student Alert Time</strong>
                  {hasStudentAlertTime ? (
                    <span>{studentAlertSummary}</span>
                  ) : (
                    <span>No student alert time set yet.</span>
                  )}
                  <div className="admin-academics-alert-action-wrap">
                    <button
                      type="button"
                      className="btn-solid admin-academics-alert-action"
                      onClick={
                        !hasStudentAlertTime
                          ? () => {
                            setAttendanceView("student");
                            setShowTeacherAttendancePopup(true);
                          }
                          : handleResetStudentAlertTime
                      }
                    >
                      {!hasStudentAlertTime ? "Add" : "Reset"}
                    </button>
                  </div>
                </div>

                <div className="admin-academics-test-item admin-academics-alert-item">
                  <strong>Teacher Attendance</strong>
                  {hasTeacherAttendanceTimes ? (
                    <span>{teacherAttendanceSummary}</span>
                  ) : (
                    <span>No teacher time set yet.</span>
                  )}
                  <div className="admin-academics-alert-action-wrap">
                    <button
                      type="button"
                      className="btn-solid admin-academics-alert-action"
                      onClick={
                        !hasTeacherAttendanceTimes
                          ? () => {
                            setAttendanceView("teacher");
                            setShowTeacherAttendancePopup(true);
                          }
                          : handleResetTeacherAttendanceTime
                      }
                    >
                      {!hasTeacherAttendanceTimes ? "Add" : "Reset"}
                    </button>
                  </div>
                </div>

        <div className="admin-academics-test-item admin-academics-alert-item">
  <strong>Attendance Radius</strong>

  <span>{attendanceRadius1} meters</span>

  {attendanceRadiusAddedDate && (
    <small className="attendance-radius-date">
      Updated:{" "}
      {new Date(attendanceRadiusAddedDate).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}
    </small>
  )}

  <div className="admin-academics-alert-action-wrap">
    <button
      type="button"
      className="btn-solid admin-academics-alert-action"
      onClick={() => {
        setShowRadiusPopup(true);
        window.history.pushState({ popup: true }, "");
      }}
    >
      {hasAttendanceRadius ? "Update Radius" : "Set Radius"}
    </button>
  </div>
</div>
              </div>

              <div className="admin-academics-tests accountant-card">
                <div className="admin-academics-test-item">
                  <strong>Extra Classes</strong>
                  <span>
                    {latestExtraClass
                      ? `${latestExtraClass.class_name || "-"} - ${formatStoredTime(latestExtraClass.start_time)}`
                      : "No extra class requests"}
                  </span>
                  <small>{latestExtraClass ? formatDateLabel(latestExtraClass.request_date) : "--"}</small>
                </div>
                <div className="admin-academics-test-item">
                  <strong>Upcoming Test</strong>
                  <span>{upcomingTestEvent?.eventName || "No upcoming test"}</span>
                  <small>{upcomingTestEvent ? formatDateLabel(upcomingTestEvent.eventDate) : "--"}</small>
                </div>
                <div className="admin-academics-test-item emphasis">
                  <strong>Previous Test</strong>
                  <span>
                    {latestTest
                      ? `${latestTest.test_type || "Test"}${latestTest.subject ? `, ${latestTest.subject}` : ""}`
                      : "No test records"}
                  </span>
                  <small>{latestTest ? formatDateLabel(latestTest.createdAt) : "--"}</small>
                </div>
              </div>

              <div className="admin-academics-footer-cards accountant-card">
                {dynamicFooterCards.map((item) => (
                  <div key={item.meta} className="admin-academics-footer-item">
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                    <small>{item.meta}</small>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>


      {showRadiusPopup && (
        <div
          onClick={() => setShowRadiusPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 999999,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Toaster
            position="top-center"
            containerStyle={{
              zIndex: 99999999999,
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "60%",
              maxWidth: "700px",
              // height: "20vh",
              borderRadius: "12px",
              overflow: "visible",
              zIndex: 1000000,
            }}
          >
            <Radiusselectingg />
          </div>
        </div>
      )}
      {showTeacherAttendancePopup && (
        <div
          className="globalpopup-overlay"
          onClick={() => setShowTeacherAttendancePopup(false)}
        >
          <div
            className="globalpopup-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "25%",
              maxWidth: "1400px",
              height: "60vh",
              overflow: "auto",
            }}
          >
            <button
              className="globalpopup-close-btn"
              onClick={() => setShowTeacherAttendancePopup(false)}
            >
              ×
            </button>
            <AttendanceForms view={attendanceView} />
          </div>
        </div>
      )}


      {selectedStudent ? (
        <div className="admin-academics-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="admin-academics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-academics-modal-header">
              <div>
                <h3>{selectedStudent.name || "Student"}</h3>
                <p>
                  {className || "-"} - {section || "-"} | ID: {selectedStudent.id || "-"}
                </p>
              </div>
              <button type="button" onClick={() => setSelectedStudent(null)}>
                Close
              </button>
            </div>

            <div className="admin-academics-modal-tabs">
              {[
                { key: "attendance", label: "Attendance" },
                { key: "behaviour", label: "Behaviour" },
                { key: "academics", label: "Academics" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={studentPopupTab === tab.key ? "active" : ""}
                  onClick={() => setStudentPopupTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="admin-academics-modal-content">
              {studentPopupLoading ? (
                <div className="admin-academics-modal-empty">Loading details...</div>
              ) : studentPopupTab === "academics" ? (
                <>
                  <div className="admin-academics-split-view">
                    <div className="admin-academics-split-left">
                      <div className="admin-academics-table-wrap">
                        <table className="admin-academics-modal-table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              {popupTermRows.map((term) => (
                                <th key={term.key}>{term.label}</th>
                              ))}
                              <th>Total</th>
                              <th>Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentPopupAcademics.length === 0 ? (
                              <tr>
                                <td colSpan={popupTermRows.length + 3}>No academic data found.</td>
                              </tr>
                            ) : (
                              studentPopupAcademics.map((item, index) => {
                                const total = getPopupRowTotal(item, popupTermRows);
                                const grade = getPopupRowGrade(item, popupTermRows);
                                return (
                                  <tr key={`${item?.subject || "subject"}-${index}`}>
                                    <td>{item?.subject || item?.subject_name || item?.name || "-"}</td>
                                    {popupTermRows.map((term) => {
                                      const score = getPopupMarkForRow(item, term);
                                      const hasScore = score !== "-";

                                      return (
                                        <td key={term.key}>
                                          <div style={{ fontWeight: 600 }}>

                                            {hasScore ? `${score}` : 0}



                                            {hasScore ? (<small
                                              style={{
                                                marginLeft: "3px",
                                                marginTop: "3px",
                                                color: "#0b7a28",
                                                fontWeight: 700,
                                                fontSize: "11px",
                                              }}
                                            >
                                              {getPopupTestGrade(item, term)}

                                            </small>) :" "}
                                          </div>
                                        </td>
                                      );
                                    })}
                                    <td>{total}</td>
                                    <td>{grade}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="admin-academics-split-right">
                      <div className="admin-academics-trend-card">
                        <div className="admin-academics-trend-head">
                          <strong>{activeTrendTitle}</strong>
                          {activeTrend.overallDiff !== null ? (
                            <span
                              className={
                                activeTrend.overallDiff > 0
                                  ? "admin-academics-trend-pill up"
                                  : activeTrend.overallDiff < 0
                                    ? "admin-academics-trend-pill down"
                                    : "admin-academics-trend-pill flat"
                              }
                            >
                              Overall: {activeTrend.overallDiff > 0 ? "+" : ""}
                              {activeTrend.overallDiff}%
                            </span>
                          ) : null}
                        </div>

                        <div className="admin-academics-trend-filter-row">
                          <label htmlFor="trend-subject-select">Subject:</label>
                          <select
                            id="trend-subject-select"
                            className="admin-academics-trend-subject-select"
                            value={trendSubjectKey}
                            onChange={(e) => setTrendSubjectKey(e.target.value)}
                          >
                            <option value="__all__">All Subjects</option>
                            {popupSubjectOptions.map((subject) => (
                              <option key={subject.key} value={subject.key}>
                                {subject.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {activeTrend.validPoints.length < 2 ? (
                          <div className="admin-academics-trend-empty">
                            Add more than one test record to view improvement trend.
                          </div>
                        ) : (
                          <>
                            <div className="admin-academics-trend-chart-wrap">
                              <svg viewBox="0 0 560 180" className="admin-academics-trend-chart" preserveAspectRatio="none">
                                {(() => {
                                  const values = activeTrend.validPoints.map((point) => Number(point.value));
                                  const minVal = Math.min(...values);
                                  const maxVal = Math.max(...values);
                                  const spread = maxVal - minVal || 1;
                                  const xStep = activeTrend.validPoints.length > 1 ? 520 / (activeTrend.validPoints.length - 1) : 0;
                                  const toY = (val) => 16 + ((maxVal - val) / spread) * 128;
                                  const toX = (idx) => 20 + idx * xStep;
                                  const polyline = activeTrend.validPoints
                                    .map((point, idx) => `${toX(idx)},${toY(Number(point.value))}`)
                                    .join(" ");
                                  return (
                                    <>
                                      <line x1="20" y1="144" x2="540" y2="144" className="admin-academics-trend-axis" />
                                      <polyline points={polyline} className="admin-academics-trend-line" />
                                      {activeTrend.validPoints.map((point, idx) => (
                                        <g key={point.key}>
                                          <circle cx={toX(idx)} cy={toY(Number(point.value))} r="4.5" className="admin-academics-trend-dot" />
                                          <text x={toX(idx)} y="165" textAnchor="middle" className="admin-academics-trend-x-label">
                                            {point.label}
                                          </text>
                                          <text x={toX(idx)} y={toY(Number(point.value)) - 8} textAnchor="middle" className="admin-academics-trend-value-label">
                                            {Number(point.value).toFixed(1)}%
                                          </text>
                                        </g>
                                      ))}
                                    </>
                                  );
                                })()}
                              </svg>
                            </div>

                            <div className="admin-academics-trend-transitions">
                              {activeTrend.transitions.map((item) => (
                                <span
                                  key={`${item.from}-${item.to}`}
                                  className={`admin-academics-trend-transition ${item.improved ? "up" : item.diff < 0 ? "down" : "flat"}`}
                                >
                                  {item.from} to {item.to}: {item.status} ({item.diff > 0 ? "+" : ""}
                                  {item.diff}%)
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : studentPopupTab === "attendance" ? (
                <table className="admin-academics-modal-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Present</th>
                      <th>Total</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPopupAttendance.length === 0 ? (
                      <tr>
                        <td colSpan="4">No attendance data found.</td>
                      </tr>
                    ) : (
                      studentPopupAttendance.map((month, index) => {
                        const present = Number(month?.present || 0);
                        const total = Number(month?.total || 0);
                        const percent = total > 0 ? ((present / total) * 100).toFixed(2) : "0.00";
                        return (
                          <tr key={`${month?.month || "month"}-${index}`}>
                            <td>{month?.month} {month?.year}</td>
                            <td>{present}</td>
                            <td>{total}</td>
                            <td>{percent}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                // Behavior Tab

                // Behavior Tab (Table Format)
                <div className="admin-academics-table-wrap">
                  <table className="admin-academics-modal-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Date</th>
                        <th>Report</th>
                        <th>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentPopupBehavior.length === 0 ? (
                        <tr>
                          <td colSpan="4">No behavior reports found.</td>
                        </tr>
                      ) : (
                        studentPopupBehavior.map((report, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{new Date(report.created_at).toLocaleDateString("en-IN")}</td>
                            <td>{report.report || "N/A"}</td>
                            <td>{report.comment || "N/A"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              )}
            </div>
          </div>
        </div>
      ) : null}

      {selectedTeacher ? (
        <div className="admin-academics-modal-overlay" onClick={closeTeacherPopup}>
          <div className="admin-academics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-academics-modal-header">
              <div>
                <h3>{selectedTeacher.teacher_name || selectedTeacher.name || "Teacher"}</h3>
                <p>
                  {selectedTeacher.designation || selectedTeacher.subject || "-"} | ID:{" "}
                  {selectedTeacher.teacher_id || selectedTeacher.id || "-"}
                </p>
              </div>
              <button type="button" onClick={closeTeacherPopup}>
                Close
              </button>
            </div>

            <div className="admin-academics-modal-content">
              {teacherPopupLoading ? (
                <div className="admin-academics-modal-empty">Loading teacher details...</div>
              ) : teacherPopupError ? (
                <div className="admin-academics-modal-empty">{teacherPopupError}</div>
              ) : (
                <>
                  <div className="admin-academics-split-view">
                    <div className="admin-academics-split-left">
                      <div className="admin-academics-table-wrap">
                        <table className="admin-academics-modal-table">
                          <tbody>
                            <tr>
                              <th>Name</th>
                              <td>{selectedTeacher.teacher_name || selectedTeacher.name || "-"}</td>
                            </tr>
                            <tr>
                              <th>Designation</th>
                              <td>{selectedTeacher.designation || selectedTeacher.subject || "-"}</td>
                            </tr>
                            <tr>
                              <th>Phone</th>
                              <td>{selectedTeacher.phone_no || "-"}</td>
                            </tr>
                            <tr>
                              <th>Email</th>
                              <td>{selectedTeacher.email || "-"}</td>
                            </tr>
                            <tr>
                              <th>Salary</th>
                              <td>{teacherPopupSalary?.salary_amount || teacherPopupSalary?.salary || "Loading..."}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="admin-academics-split-right">
                      <div className="admin-academics-trend-card">
                        <div className="admin-academics-trend-head">
                          <strong>Teacher Attendance</strong>
                          {teacherPopupStats.percent !== null ? (
                            <span className="admin-academics-trend-pill flat">
                              {teacherPopupStats.percent}%
                            </span>
                          ) : null}
                        </div>

                        <div className="admin-academics-trend-transitions">
                          <span className="admin-academics-trend-transition flat">
                            Present: {teacherPopupStats.presentDays}
                          </span>
                          <span className="admin-academics-trend-transition flat">
                            Late: {teacherPopupStats.lateDays}
                          </span>
                          <span className="admin-academics-trend-transition flat">
                            Total Days: {teacherPopupStats.totalDays}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-academics-modal-table-wrap" style={{ marginTop: "1rem" }}>
                    <table className="admin-academics-modal-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Login Time</th>
                          <th>Logout Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(teacherPopupAttendance) && teacherPopupAttendance.length > 0 ? (
                          teacherPopupAttendance.map((entry, index) => (
                            <tr key={`${entry?.date || entry?.attendance_date || index}`}>
                              <td>{entry?.date || entry?.attendance_date || entry?.created_at || "-"}</td>
                              <td>{entry?.status || entry?.attendance_status || "-"}</td>
                              <td>{formatStoredTime(entry?.entry_time || entry?.login_time || "")}</td>
                              <td>{formatStoredTime(entry?.exit_time || entry?.logout_time || "")}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4">No attendance data found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
            {
        isHelpOpen && (
          <>
          <HelpCenter
          userRole={userRole}
          openHelpSection={openHelpSection}
              setOpenHelpSection={setOpenHelpSection}
          setIsHelpOpen={setIsHelpOpen}
          />
          </>
        )
      }

      <div className="accountant-footer-brand">
        <span>Powered By:</span>
        <img src={abcLogo} alt="Cleezo Class" className="accountant-footer-logo" />
      </div>

      <style>{`
        .admin-academics-page .accountant-dashboard-shell {
          overflow: hidden;
        }

        .admin-academics-content {
          display: grid;
          gap: 1rem;
          padding: 0.2rem 0 0.6rem;
        }

        .admin-academics-top {
          display: grid;
          grid-template-columns: 1.2fr 1.35fr 1.05fr;
          gap: 1rem;
          align-items: stretch;
        }

        .admin-academics-welcome,
        .admin-academics-summary,
        .admin-academics-performance,
        .admin-academics-storepo,
        .admin-academics-alerts,
        .admin-academics-tests,
        .admin-academics-footer-cards,
        .admin-academics-metric {
    
          border-radius: 1.55rem;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
          background: #fff;
        }

        .admin-academics-welcome {
          padding: 0.5rem 0.2rem;
          box-shadow: none;
          background: transparent;
        }

        .admin-academics-welcome h2 {
          font-size: 2rem;
          margin: 0 0 0.45rem;
          color: #111827;
        }

        .admin-academics-welcome p {
          margin: 0;
          font-size: 0.74rem;
          line-height: 1.35;
          color: #222;
        }

        .admin-academics-summary {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 1rem;
          align-items: center;
          padding: 0.8rem 1rem;
        }

        .admin-academics-summary-ring {
          width: 3.35rem;
          height: 3.35rem;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(#f36b79 0 252deg, #f1f2f4 252deg 360deg);
        }

        .admin-academics-summary-ring-inner,
        .admin-academics-mini-ring {
          width: 2.6rem;
          height: 2.6rem;
          border-radius: 50%;
          background: #fff;
          display: grid;
          place-items: center;
          font-weight: 800;
          color: #1f2937;
        }

        .admin-academics-summary-stats p {
          margin: 0 0 0.24rem;
          font-size: 0.68rem;
          color: #555;
        }

        .admin-academics-summary-stats strong {
          color: #111;
        }

        .admin-academics-summary-right {
          display: grid;
          gap: 0.6rem;
          justify-items: end;
        }

        .admin-academics-exam h3,
        .admin-academics-exam p {
          margin: 0;
          text-align: right;
        }

        .admin-academics-exam h3 {
          font-size: 0.78rem;
        }

        .admin-academics-exam p {
          color: #ef6574;
          font-size: 0.68rem;
          font-weight: 800;
        }

        .admin-academics-mini-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.8rem;
        }

        .admin-academics-main {
          display: grid;
          grid-template-columns: 2fr 1.05fr;
          gap: 1rem;
          align-items: start;
          min-height: 25.8rem;
        }

        .admin-academics-performance {
          padding: 1rem;
          height: 25.8rem;
          min-height: 25.8rem;
          max-height: 25.8rem;
          display: flex;
          flex-direction: column;
        }

        .admin-academics-performance-header {
          display: grid;
          grid-template-columns: auto auto 1fr;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
        }

        .admin-academics-performance-header h3 {
          margin: 0;
          font-size: 1.05rem;
        }

        .admin-academics-performance-tabs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
        }

        .admin-academics-performance-tabs button {
          background: transparent;
          border: 0;
          color: #888;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-academics-performance-tabs button.active {
          color: #111;
          text-decoration: underline;
          text-decoration-color: #f36b79;
          text-decoration-thickness: 2px;
        }

        .admin-academics-performance-tabs strong {
          color: #f36b79;
          font-size: 1.35rem;
          margin-left: 0.3rem;
        }

        .admin-academics-filters {
          display: flex;
          justify-content: flex-end;
          gap: 0.55rem;
        }

        .admin-academics-filters input,
        .admin-academics-filters button,
        .admin-academics-filters select {
          height: 2rem;
          border: 1px solid #a8a8a8;
          border-radius: 0.7rem;
          background: #fff;
          font-size: 0.68rem;
          color: #666;
          padding: 0 0.8rem;
        }

        .admin-academics-filters input {
          width: 8.5rem;
        }

        .admin-academics-students-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 1rem 0.7rem;
          flex: 1;
          min-height: 0;
          align-content: start;
          overflow: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .admin-academics-students-grid::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
          background: transparent;
        }

        .admin-academics-student-card {
          text-align: center;
        }

        .admin-academics-student-card-clickable {
          cursor: pointer;
        }

        .admin-academics-student-card-clickable:hover {
          transform: translateY(-2px);
        }

        .admin-academics-student-avatar-wrap {
          width: 4.25rem;
          height: 4.25rem;
          margin: 0 auto 0.35rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          transition: background 0.18s ease;
        }

        .admin-academics-student-card.is-selected .admin-academics-student-avatar-wrap {
          background: #f6a5ab;
        }

        .admin-academics-student-avatar {
          width: 3rem;
          height: 3rem;
          margin: 0;
          border-radius: 50%;
          background: #fff;
          display: grid;
          place-items: center;
          color: #000;
          font-size: 2rem;
        }

        .admin-academics-student-photo {
          width: 3rem;
          height: 3rem;
          margin: 0;
          border-radius: 50%;
          object-fit: cover;
          display: block;
          background: #f3f4f6;
        }

        .admin-academics-student-avatar.highlight {
          background: #f9a9b1;
        }

        .admin-academics-student-name {
          font-size: 0.67rem;
          font-weight: 700;
          color: #444;
          line-height: 1.15;
        }

        .admin-academics-student-meta,
        .admin-academics-student-score {
          font-size: 0.6em;
          color: #7a7a7a;
          line-height: 1.15;
        }

        .admin-academics-student-score.highlight {
          color: #ef6574;
          font-weight: 800;
        }

        .admin-academics-empty {
          grid-column: 1 / -1;
          min-height: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #7a7a7a;
          font-size: 0.8rem;
          border-radius: 1rem;
        }

        .admin-academics-right-column {
          display: grid;
          gap: 1rem;
          height: 25.8rem;
          min-height: 25.8rem;
          grid-template-rows: 1fr auto;
        }

        .admin-academics-storepo {
          padding: 1rem;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .admin-academics-side-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 0.6rem;
        }

        .admin-academics-side-header h3 {
          margin: 0;
          font-size: 1rem;
        }

        .admin-academics-request-count {
          display: flex;
          align-items: baseline;
          gap: 0.2rem;
        }

        .admin-academics-request-count strong {
          color: #ef6574;
          font-size: 1.9rem;
          line-height: 1;
        }

        .admin-academics-request-count span,
        .admin-academics-side-subtitle {
          font-size: 0.62rem;
          color: #777;
        }

        .admin-academics-po-list {
          display: grid;
          gap: 0.55rem;
          margin-top: 0.6rem;
          flex: 1;
          min-height: 0;
          max-height: 100%;
          overflow: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .admin-academics-po-list::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
          background: transparent;
        }

        .admin-academics-po-item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.55rem;
          align-items: center;
          font-size: 0.62rem;
          color: #666;
        }

        .admin-academics-assistant-item {
          display: grid;
          gap: 0.24rem;
          border: 1px solid #ececec;
          border-radius: 0.85rem;
          padding: 0.55rem 0.65rem;
          background: #fff;
        }

        .admin-academics-assistant-item strong {
          font-size: 0.78rem;
          color: #222;
        }

        .admin-academics-assistant-item span,
        .admin-academics-side-group-label {
          font-size: 0.68rem;
          color: #666;
        }

        .admin-academics-side-group-label {
          font-weight: 700;
          color: #555;
          margin-top: 0.15rem;
        }

        .admin-academics-po-actions {
          display: flex;
          gap: 0.35rem;
        }

        .admin-academics-po-actions button {
          width: 1.65rem;
          height: 1.65rem;
          border: 0;
          border-radius: 50%;
          background: #eef5ff;
          color: #60a5fa;
          cursor: pointer;
        }

        .admin-academics-metric-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          align-self: end;
        }

        .admin-academics-metric {
          min-height: 6.8rem;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 0.7rem;
        }

        .admin-academics-metric h3,
        .admin-academics-metric p,
        .admin-academics-metric strong,
        .admin-academics-metric span {
          margin: 0;
        }

        .admin-academics-metric strong {
          color: #ef6574;
          font-size: 1.9rem;
          line-height: 1;
        }

        .admin-academics-metric span {
          font-size: 0.68rem;
          color: #777;
        }

        .admin-academics-metric h3 {
          font-size: 0.92rem;
          margin-top: 0.25rem;
        }

        .admin-academics-metric p {
          font-size: 0.66rem;
          color: #6c6c6c;
        }

        .admin-academics-bottom {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1.1fr;
          gap: 1rem;
        }

        .admin-academics-alerts,
        .admin-academics-tests,
        .admin-academics-footer-cards {
          min-height: 4.7rem;
          padding: 0.85rem 1rem;
        }

        .admin-academics-alert-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          gap: 0.45rem;
          font-size: 0.62rem;
          color: #666;
          margin-bottom: 0.65rem;
        }

        .admin-academics-alert-action-wrap {
          display: flex;
          justify-content: flex-start;
        }

        .admin-academics-alert-action {
          align-self: flex-start;
          margin-top: 0.1rem;
          width: fit-content;
        }

        .admin-academics-tests,
        .admin-academics-footer-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.6rem;
          align-items: center;
        }

        .admin-academics-alerts .admin-academics-footer-cards {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.6rem;
        }

        .admin-academics-test-item,
        .admin-academics-footer-item {
          display: grid;
          gap: 0.18rem;
        }

        .admin-academics-test-item strong,
        .admin-academics-footer-item strong {
          font-size: 0.8rem;
          color: #111;
        }

        .admin-academics-test-item span,
        .admin-academics-footer-item span {
          font-size: 0.68rem;
          color: #111;
        }

        .admin-academics-test-item small,
        .admin-academics-footer-item small {
          font-size: 0.62rem;
          color: #f0a300;
        }

        .admin-academics-test-item.emphasis span {
          color: #ef6574;
          font-weight: 800;
        }

        .admin-academics-footer-cards {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .admin-academics-footer-item:last-child span {
          color: #ef6574;
          font-weight: 800;
        }

        .admin-academics-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.36);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 1300;
        }

        .admin-academics-modal {
          width: min(72rem, 92vw);
          height: min(36rem, 86vh);
          min-height: min(36rem, 86vh);
          background: #fff;
          border-radius: 1.5rem;
          box-shadow: 0 30px 60px rgba(15, 23, 42, 0.22);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .admin-academics-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.2rem;
          border-bottom: 1px solid #ececec;
        }

        .admin-academics-modal-header h3,
        .admin-academics-modal-header p {
          margin: 0;
        }

        .admin-academics-modal-header h3 {
          font-size: 1.1rem;
          color: #111827;
        }

        .admin-academics-modal-header p {
          font-size: 0.72rem;
          color: #777;
          margin-top: 0.2rem;
        }

        .admin-academics-modal-header button {
          border: 1px solid #d1d5db;
          background: #fff;
          border-radius: 999px;
          padding: 0.55rem 1rem;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-academics-modal-tabs {
          display: flex;
          gap: 0.65rem;
          padding: 0.8rem 1.2rem 0;
        }

        .admin-academics-modal-tabs button {
          border: 1px solid #d9d9d9;
          background: #fff;
          color: #666;
          border-radius: 999px;
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-academics-modal-tabs button.active {
          background: #f36b79;
          color: #fff;
          border-color: #f36b79;
        }

        .admin-academics-modal-content {
          padding: 1rem 1.2rem 1.25rem;
          flex: 1;
          min-height: 0;
          overflow: auto;
        }

        .admin-academics-modal-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }

        .admin-academics-split-view {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
          gap: 0.9rem;
          align-items: start;
        }

        .admin-academics-split-left,
        .admin-academics-split-right {
          min-width: 0;
        }

        .admin-academics-table-wrap {
          overflow: auto;
          border: 1px solid #ececec;
          border-radius: 0.9rem;
          background: #fff;
        }

        .admin-academics-trend-card {
          border: 1px solid #ececec;
          border-radius: 0.9rem;
          padding: 0.8rem 0.9rem;
          margin-bottom: 0;
          background: #fafbff;
        }

        .admin-academics-trend-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.55rem;
        }

        .admin-academics-trend-filter-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.6rem;
        }

        .admin-academics-trend-filter-row label {
          font-size: 0.72rem;
          color: #475467;
          font-weight: 700;
        }

        .admin-academics-trend-subject-select {
          height: 1.9rem;
          border: 1px solid #d0d5dd;
          border-radius: 0.55rem;
          background: #fff;
          color: #344054;
          font-size: 0.72rem;
          padding: 0 0.6rem;
        }

        .admin-academics-trend-head strong {
          font-size: 0.82rem;
          color: #1f2937;
        }

        .admin-academics-trend-pill {
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          font-size: 0.66rem;
          font-weight: 700;
        }

        .admin-academics-trend-pill.up {
          background: #e8f9ef;
          color: #16803c;
        }

        .admin-academics-trend-pill.down {
          background: #ffecef;
          color: #b42318;
        }

        .admin-academics-trend-pill.flat {
          background: #eef2f7;
          color: #475467;
        }

        .admin-academics-trend-empty {
          font-size: 0.72rem;
          color: #777;
          padding: 0.45rem 0;
        }

        .admin-academics-trend-chart-wrap {
          width: 100%;
          height: 11rem;
        }

        .admin-academics-trend-chart {
          width: 100%;
          height: 100%;
        }

        .admin-academics-trend-axis {
          stroke: #d0d5dd;
          stroke-width: 1.2;
        }

        .admin-academics-trend-line {
          fill: none;
          stroke: #f36b79;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .admin-academics-trend-dot {
          fill: #fff;
          stroke: #ef6574;
          stroke-width: 2;
        }

        .admin-academics-trend-x-label {
          font-size: 10px;
          fill: #667085;
          font-weight: 600;
        }

        .admin-academics-trend-value-label {
          font-size: 10px;
          fill: #101828;
          font-weight: 700;
        }

        .admin-academics-trend-transitions {
          margin-top: 0.55rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .admin-academics-trend-transition {
          font-size: 0.64rem;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          border: 1px solid transparent;
        }

        .admin-academics-trend-transition.up {
          color: #16803c;
          border-color: #b7ebc6;
          background: #f1fcf5;
        }

        .admin-academics-trend-transition.down {
          color: #b42318;
          border-color: #fdccd3;
          background: #fff4f6;
        }

        .admin-academics-trend-transition.flat {
          color: #475467;
          border-color: #d0d5dd;
          background: #f8fafc;
        }

        @media (max-width: 1120px) {
          .admin-academics-split-view {
            grid-template-columns: 1fr;
          }
        }

        .admin-academics-modal-table th,
        .admin-academics-modal-table td {
          border-bottom: 1px solid #ececec;
          padding: 0.75rem 0.6rem;
          text-align: left;
          vertical-align: top;
        }

        .admin-academics-modal-table th {
          color: #ffffff;
          font-size: 0.78rem;
          background: #16558a;
        }

        .admin-academics-modal-table td {
          color: #5f6570;
        }

        .admin-academics-modal-empty {
          min-height: 12rem;
          display: grid;
          place-items: center;
          color: #777;
          font-size: 0.9rem;
        }

        @media (min-width: 900px) and (max-width: 1200px) {
          .admin-academics-page.accountant-dashboard-home-page,
          .admin-academics-page.frontdesk-dashboard-page {
            position: relative !important;
            inset: auto !important;
            height: auto !important;
            min-height: 100vh !important;
            overflow-x: auto !important;
            overflow-y: auto !important;
          }

          .admin-academics-page.accountant-dashboard-home-page .accountant-dashboard-shell,
          .admin-academics-page.frontdesk-dashboard-page .accountant-dashboard-shell {
            min-width: 0 !important;
            width: 100% !important;
            max-width: none !important;
            overflow: visible !important;
          }

          .admin-academics-page.accountant-dashboard-home-page .accountant-main-area,
          .admin-academics-page.frontdesk-dashboard-page .accountant-main-area,
          .admin-academics-page.accountant-dashboard-home-page .accountant-grid,
          .admin-academics-page.frontdesk-dashboard-page .accountant-grid {
            min-width: 0 !important;
            width: 100% !important;
            max-width: none !important;
            overflow: visible !important;
          }

          .frontdesk-dashboard-page .admin-academics-content {
            min-height: 0 !important;
            height: 100% !important;
            max-height: 100% !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            overscroll-behavior: contain !important;
            padding-right: 0.6rem !important;
            padding-bottom: 0.5rem !important;
          }
        }

        @media (min-width: 1201px) {
          .frontdesk-dashboard-page .admin-academics-content {
            min-height: 0 !important;
            height: 100% !important;
            max-height: 100% !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            overscroll-behavior: contain !important;
            padding-right: 0.6rem !important;
            padding-bottom: 0.5rem !important;
          }
        }

        @media (max-width: 1200px) {
          .admin-academics-page {
            min-height: 100vh;
            overflow-x: auto;
            overflow-y: auto;
          }

          .admin-academics-page .accountant-dashboard-shell,
          .admin-academics-page .dashboard-shell,
          .admin-academics-page .accountant-main-area,
          .admin-academics-page .dashboard-main {
            height: auto;
            min-height: auto;
            max-height: none;
            overflow: visible;
          }

          .admin-academics-page .admin-academics-content {
            min-width: 68rem;
            padding-bottom: 1rem;
          }

          .admin-academics-top,
          .admin-academics-main,
          .admin-academics-bottom {
            // grid-template-columns: 1fr;
          }

          .admin-academics-mini-cards,
          .admin-academics-metric-row,
          .admin-academics-footer-cards,
          .admin-academics-tests {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .admin-academics-students-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .admin-academics-performance-header {
            grid-template-columns: 1fr;
          }

          .admin-academics-filters {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .admin-academics-main,
          .admin-academics-performance,
          .admin-academics-right-column,
          .admin-academics-storepo {
            // height: auto;
            min-height: auto;
            max-height: none;
          }

          .admin-academics-students-grid,
          .admin-academics-po-list {
            overflow: visible;
            max-height: none;
          }
        }

    
          @media (min-width:1024px) and (max-width: 1200px) {

  .admin-academics-page {
    height: 120vh !important;
    overflow: hidden !important;
  }

  .admin-academics-page .accountant-dashboard-shell,
  .admin-academics-page .dashboard-shell {
    height: 100vh !important;
    overflow: hidden !important;
  }

  .admin-academics-page .accountant-main-area,
  .admin-academics-page .dashboard-main {
    height: calc(100vh - 20px) !important;
    overflow: hidden !important;
  }

  .admin-academics-page .admin-academics-content {
    width: 1050px !important;
    // height: 660px !important;

    max-width: 100% !important;
    max-height: 100% !important;

    overflow-y: auto !important;
    overflow-x: hidden !important;

    padding-right: 10px !important;
    padding-bottom: 10px !important;

    scrollbar-width: thin;
  }
.admin-academics-performance {
    height: 500px !important;
    min-height: 360px !important;
    max-height: 360px !important;

    display: flex !important;
    flex-direction: column !important;

    overflow: scroll !important;
}
    .admin-academics-storepo{
     height: 500px !important;
    min-height: 360px !important;
    max-height: 360px !important;

    display: flex !important;
    flex-direction: column !important;

    overflow: scroll !important;
    }
  .admin-academics-top,
  .admin-academics-main,
  .admin-academics-bottom {
    width: 100% !important;
  }

  .admin-academics-main {
    display: grid !important;
    grid-template-columns: 2fr 1fr !important;
    gap: 1rem !important;
  }

  .admin-academics-students-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }

  .admin-academics-po-list,
  .admin-academics-students-grid {
    max-height: none !important;
    overflow: visible !important;
  }
}
      `}</style>
    </div>


  );
};

export default AdiminAcademicsNew;
