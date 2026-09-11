import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AccountantDashboardnew.css";
import "../frontdeskdahboard/FrontDesk.css";
import "./AdminDashboardNew.css";
import "./AdminEventsAndMeetings.css";
import InstituteBrand from "../shared/InstituteBrand.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
import { getUserDisplayName } from "../shared/userDisplayName";

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
import performanceIcon from "../assets/performance.png";
import premiumIcon from "../assets/Go Premium.png";
import { FaEdit, FaUser } from "react-icons/fa";
import TaskOfTheDay from "../shared/TaskOfTheDay.tsx";
import FrontDesk_Tickets from "../frontdeskdahboard/FrontDesk_Tickets.tsx";
import ErrorPopup from "../shared/ErrorPopup";
import SchoolEventsPosters from "../shared/SchoolEventsPosters.jsx";
import SchoolEventsHeading from "../shared/SchoolEventsHeading.jsx";
import HelpCenter from "../shared/HelpCenter.jsx";
import { FiHelpCircle } from "react-icons/fi";
// import StoreDashboard from "../shared/AdminStoreNew.jsx";

const API_BASE = "https://cleezoclass.com:5000/api";
const PREMIUM_SUPPORT_MESSAGE =
  "Premium content is available after activation. For more details, contact our support team: supprteam@gmail.com";


interface Teacher {
  teacher_id: string | number;
  teacher_name: string;
  phone_no: string;
  subject?: string;
  designation?: string;
}
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

const ADMIN_API_BASE = "https://cleezoclass.com:5000/api";

const formatDateLabel = (value: any) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTimeLabel = (value: any) => {
  if (!value) return "--";
  const raw = String(value).trim();
  if (!raw) return "--";
  const [hour = "00", minute = "00"] = raw.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const formatChatDateTime = (dateValue: any, timeValue: any) => {
  const dateLabel = dateValue ? formatDateLabel(dateValue) : "-";
  const timeLabel = timeValue ? formatTimeLabel(timeValue) : "--";
  return `${dateLabel}, ${timeLabel}`;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const topTabs = ["Dashboard", "Academics", "Events & Meetings", "Reports"];
  const [activeTopTab, setActiveTopTab] = useState("Dashboard");
  const [activeSidebar, setActiveSidebar] = useState("dashboard");
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const sidebarItems = [
    { key: "dashboard", label: "Dashboard", icon: dashboardIcon },
    { key: "academics", label: "Academics", icon: academicsIcon },
    { key: "events", label: "Events And Meetings", icon: leadProfileIcon },
    { key: "communication", label: "Generations", icon: communicationIcon },
    { key: "enrollments", label: "Store", icon: enrollmentIcon },
    { key: "reports", label: "Reports", icon: reportsIcon },
  ];

  const quickCards = [
    { key: "livechat", title: "Live Chat", subtitle: "Approvals / Requests", icon: timelineIcon },
    { key: "storepo", title: "Store PO", subtitle: "Request Order / PO issue", icon: followupIcon },
    { key: "assistant", title: "Assistant", subtitle: "Daily Activity check", icon: assistantIcon },
  ];

  const [events, setEvents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [selectedCalendarItems, setSelectedCalendarItems] = useState<any[]>([]);
  const [selectedCalendarDateLabel, setSelectedCalendarDateLabel] = useState("");
  const yearOptions = [2024, 2025, 2026, 2027, 2028];
  const [pendingChats, setPendingChats] = useState<any[]>([]);
  const [pendingChatsLoading, setPendingChatsLoading] = useState(false);
  const [pendingChatsError, setPendingChatsError] = useState("");
  const [activeQuickPanel, setActiveQuickPanel] = useState<"livechat" | "storepo" | "assistant">("livechat");
  const [storeActions, setStoreActions] = useState<any[]>([]);
  const [storeActionsLoading, setStoreActionsLoading] = useState(false);
  const [storeActionsError, setStoreActionsError] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    gender: "",
    phone_no: "",
    email: "",
  });
  const [eventSelected, setEventSelected] = useState<boolean>(false) // to display events in Assistant actions container
  const [festival, setFestival] = useState(null);
  const [schoolCode] = useState(localStorage.getItem("schoolCode"));
  const [profileSaveStatus, setProfileSaveStatus] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileImageOpen, setProfileImageOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const [schoolName, setSchoolName] = useState("");
  const [schoolLogo, setSchoolLogo] = useState("/default-logo.png");
  const [instituteAddress, setInstituteAddress] = useState("");
  const [popupType, setPopupType] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [party1List, setParty1List] = useState<any[]>([]);
  const [classOptions, setClassOptions] = useState<any[]>([]);
  const [sectionOptions, setSectionOptions] = useState<any[]>([]);
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [liveChatForm, setLiveChatForm] = useState({
    party1: "",
    className: "",
    section: "",
    student: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
  });
  const [announcements, setAnnouncements] = useState([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [marksRows, setMarksRows] = useState<MarksRow[]>([]);
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [behaviour, setBehaviour] = useState({});
  const [openHelpSection, setOpenHelpSection] = useState(null);
  const[isHelpOpen,setIsHelpOpen]=useState(false)
  const userRole = localStorage.getItem("userRole")

  useEffect(() => {
    getBehaviourPercentage();
  }, []);

  const getBehaviourPercentage = async () => {
    try {
      const schoolCode = localStorage.getItem("schoolCode");

      const res = await axios.get(
        "https://cleezoclass.com:5000/api/overall-behaviour-percentage",
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
      const [performance, setPerformance] = useState({});
  
      useEffect(() => {
          getOverallPerformance();
      }, []);
  
      const getOverallPerformance = async () => {
  
          try {
  
              const schoolCode = localStorage.getItem("schoolCode");
  
              const response = await axios.get(
                  "https://cleezoclass.com:5000/api/overall-performance-percentage",
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

  const pendingChatCount = pendingChats.filter((item: any) => {
    const status = String(item?.status || item?.approval_status || "pending").toLowerCase();
    return status === "pending" || status === "awaiting";
  }).length;

  const requestItems = useMemo(
    () =>
      pendingChats.filter((item: any) => {
        const status = String(item?.status || item?.approval_status || "pending").toLowerCase();
        return status === "pending" || status === "requested" || status === "awaiting";
      }),
    [pendingChats]
  );

  const scheduledItems = useMemo(
    () =>
      pendingChats.filter((item: any) => {
        const status = String(item?.status || item?.approval_status || "").toLowerCase();
        return status === "approved" || status === "scheduled" || status === "fixed";
      }),
    [pendingChats]
  );

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
      title: "Timetable Tab Guidance",
      desc:
        "Generate timetable, assign substitutes, and schedule extra classes. Recheck class-teacher mapping and resolve timetable conflicts before publishing.",
    },
    {
      title: "Store Tab Guidance",
      desc:
        "Track and manage academic/store inventory like books, uniforms, IDs, and utility stock. Validate stock movement and raise replenishment requests early.",
    },
    {
      title: "Student Search & Fee Insight Guidance",
      desc:
        "Use class-section/student search at top to view individual fee report quickly. Verify paid, due, installment deadlines and discount details before parent communication.",
    },
  ];



  const academicTeacherCards = [
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 42% Gr: E, Att: 82%" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 59% Gr: D, Att: 91%" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 71% Gr: C, Att: 98%" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 66% Gr: C, Att: 74%" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 85% Gr: B, Att: 97%" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 78% Gr: C, Att: 82%" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 44% Gr: D" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 93% Gr: A" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 67% Gr: D" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 35% Gr: F", highlight: true },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 64% Gr: D" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 57% Gr: D" },
    { name: "B. Ravindra Reddy, 7A", meta: "S/O - B. Bhaskar.", stats: "FA-3, 71% Gr: C, Att: 98%" },
    { name: "B. Ravindra Reddy, 7A", meta: "Due: 15,548.00", stats: "Due: 15,548.00" },
    { name: "B. Ravindra Reddy, 7A", meta: "Due: 15,548.00", stats: "Due: 15,548.00" },
  ];

  const academicsAlerts = [
    "Attendance - B. Ravindra Reddy, 7A - 74%",
    "Performance - student - B. Ravindra Reddy, 7A - FA-3, 35% Gr: F",
  ];

  const academicsTimeline = [
    { date: "12/02/2026", title: "Strike", sub: "Announcements" },
    { date: "14/04/2026", title: "Gurunanak Jayan", sub: "Calendar" },
    { date: "524 / 534", title: "2 Fail / 8 Exits", sub: "Promotions" },
    { date: "Complaints", title: "Live Chat", sub: "Unofficial" },
  ];

  const fetchAllTeachers = async () => {
    if (!schoolCode) return;
    setLoadingTeachers(true);
    try {
      const res = await axios.post("https://cleezoclass.com:5000/api/users", {
        schoolCode,
        user_type: "teacher",
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setTeachers(
        data.map((teacher: any, index: number) => ({
          ...teacher,

        }))
      );
    } catch (err) {
      console.error("Error loading teachers", err);
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };
  useEffect(() => {
    fetchAllTeachers();
  }, [schoolCode]);


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

 console.log("Attendance :",attendanceRows)
 
 let attendanceWithPercentage = 0;

 attendanceRows.map(student =>{
  attendanceWithPercentage += Math.floor(student.attendance_percentage)
 })

const teacherPerformance = (teachers.length / teachers.length) * 100
const studentPerformance = Math.floor(attendanceWithPercentage/attendanceRows.length)
const overallPerformance = Math.floor((teacherPerformance + studentPerformance) / 2);

console.log("attenance percentage",attendanceWithPercentage);

 console.log(attendanceRows.length)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError("");
        const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
        const year = String(calendarYear);
        const month = String(calendarMonth + 1);

        const [eventRes, meetingRes] = await Promise.all([
          fetch(`${ADMIN_API_BASE}/admin-events?schoolCode=${encodeURIComponent(schoolCode)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`),
          fetch(`${ADMIN_API_BASE}/admin-meetings?schoolCode=${encodeURIComponent(schoolCode)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`),
        ]);

        const eventData = await eventRes.json().catch(() => ({}));
        const meetingData = await meetingRes.json().catch(() => ({}));

        if (!eventRes.ok) {
          throw new Error(eventData?.message || "Failed to load events.");
        }
        if (!meetingRes.ok) {
          throw new Error(meetingData?.message || "Failed to load meetings.");
        }

        setEvents(Array.isArray(eventData?.data) ? eventData.data : []);
        setMeetings(Array.isArray(meetingData?.data) ? meetingData.data : []);
      } catch (err) {
        console.error("Failed to fetch events:", err);
        setEventsError("Failed to load events and meetings.");
        setEvents([]);
        setMeetings([]);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [calendarMonth, calendarYear]);

  useEffect(() => {
    if (!isStoreModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsStoreModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isStoreModalOpen]);
  useEffect(() => {
    console.log("🔥 Component Loaded");
    console.log("schoolCode:", schoolCode);

    if (!schoolCode) {
      console.log("❌ Missing schoolCode");
      return;
    }

    axios
      .get("https://cleezoclass.com:5000/api/school-festival", {
        params: { schoolCode },
      })
      .then((res) => {
        console.log("✅ Festival API:", res.data);
        setFestival(res.data.data?.[0] || null);

      })
      .catch((err) => {
        console.log("❌ Festival API Error:", err.message);

      });
  }, [schoolCode]);

  const normalizeUserPhoto = (rawPhoto: any) => {
    if (!rawPhoto) return "";
    let photo = rawPhoto;
    if (typeof photo === "object" && photo?.type === "Buffer" && Array.isArray(photo?.data)) {
      try {
        photo = new TextDecoder().decode(new Uint8Array(photo.data));
      } catch {
        return "";
      }
    }
    if (typeof photo !== "string") return "";
    photo = photo.trim();
    if (!photo) return "";
    if (photo.startsWith("data:image")) return photo;
    if (photo.startsWith("http")) return photo;
    if (photo.startsWith("0x")) {
      try {
        const hex = photo.slice(2);
        let decoded = "";
        for (let i = 0; i < hex.length; i += 2) {
          decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
        }
        photo = decoded.trim();
      } catch {
        return "";
      }
    }
    if (photo.startsWith("/public/uploads/")) {
      photo = photo.replace("/public", "");
    }
    if (photo.startsWith("uploads/")) {
      photo = `/${photo}`;
    }
    if (photo.startsWith("/uploads/")) {
      return `https://cleezoclass.com:5000${photo}`;
    }
    if (/^[A-Za-z0-9+/=]+$/.test(photo) && photo.length > 100) {
      return `data:image/jpeg;base64,${photo}`;
    }
    return "";
  };

  const normalizeInstituteLogo = (rawLogo: any) => {
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
      return `https://cleezoclass.com:5000/${logo}`;
    }
    if (logo.startsWith("/uploads/")) {
      return `https://cleezoclass.com:5000${logo}`;
    }

    if (/^[A-Za-z0-9+/=]+$/.test(logo) && logo.length > 100) {
      return `data:image/png;base64,${logo}`;
    }

    return "";
  };

  useEffect(() => {
    const username = localStorage.getItem("username");
    const schoolCode = localStorage.getItem("schoolCode");
    if (!username || !schoolCode) return;
    fetch(`https://cleezoclass.com:5000/api/api/user-info/${username}?schoolCode=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => {
        setUserInfo({
          ...data,
          photo: normalizeUserPhoto(data?.photo),
        });
      })
      .catch(() => setUserInfo(null));
  }, []);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;
    fetch(`https://cleezoclass.com:5000/api/institute?dbName=${schoolCode}`)
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
        setInstituteAddress(data?.address || data?.schoolAddress || data?.instituteAddress || "");
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
        setInstituteAddress("");
      });
  }, []);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    const loadLiveChatMeta = async () => {
      try {
        const [{ data: staffData }, { data: classData }] = await Promise.all([
          axios.get(`${ADMIN_API_BASE}/party1`, { params: { schoolCode } }),
          axios.get(`${ADMIN_API_BASE}/classes`, { params: { schoolCode } }),
        ]);

        setParty1List(Array.isArray(staffData) ? staffData : []);
        setClassOptions(Array.isArray(classData) ? classData : []);
      } catch (error) {
        console.error("Failed to load live chat meta", error);
      }
    };

    loadLiveChatMeta();
  }, []);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || !liveChatForm.className) {
      setSectionOptions([]);
      setStudentOptions([]);
      return;
    }

    axios
      .get(`${ADMIN_API_BASE}/sections/${encodeURIComponent(liveChatForm.className)}`, {
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
  }, [liveChatForm.className]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || !liveChatForm.className || !liveChatForm.section) {
      setStudentOptions([]);
      return;
    }

    axios
      .get(
        `${ADMIN_API_BASE}/admin/students/${encodeURIComponent(liveChatForm.className)}/${encodeURIComponent(liveChatForm.section)}`,
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
  }, [liveChatForm.className, liveChatForm.section]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!profileEditOpen || !userInfo) return;
    setProfileForm({
      gender: userInfo.gender || "",
      phone_no: userInfo.phone_no || "",
      email: userInfo.email || "",
    });
    setProfileSaveStatus("");
  }, [profileEditOpen, userInfo]);

  const refreshUserInfo = async () => {
    const username = localStorage.getItem("username");
    const schoolCode = localStorage.getItem("schoolCode");
    if (!username || !schoolCode) return;

    try {
      const { data } = await axios.get(
        `https://cleezoclass.com:5000/api/api/user-info/${username}?schoolCode=${encodeURIComponent(schoolCode)}`
      );
      setUserInfo({
        ...data,
        photo: normalizeUserPhoto(data?.photo),
      });
    } catch (error) {
      console.error("Failed to refresh user info", error);
    }
  };

  const openProfileEditor = () => {
    setProfileEditOpen(true);
    setProfileSaveStatus("");
  };

  const closeProfileEditor = () => {
    setProfileEditOpen(false);
    setProfileSaveStatus("");
  };

  const handleSaveProfile = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || !userInfo?.id) {
      setProfileSaveStatus("Missing user or school information.");
      return;
    }

    setProfileSaving(true);
    setProfileSaveStatus("");

    try {
      const formData = new FormData();
      formData.append("schoolCode", schoolCode);
      formData.append("gender", profileForm.gender.trim());
      formData.append("phone_no", profileForm.phone_no.trim());
      formData.append("email", profileForm.email.trim());

      const { data } = await axios.put(
        `https://cleezoclass.com:5000/api/profile/users/${userInfo.id}?schoolCode=${encodeURIComponent(schoolCode)}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfileSaveStatus(data?.message || "Profile updated successfully.");
      await refreshUserInfo();
      setProfileEditOpen(false);
    } catch (error: any) {
      setProfileSaveStatus(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update profile details."
      );
    } finally {
      setProfileSaving(false);
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

  const loadPendingChats = async () => {
    setPendingChatsLoading(true);
    setPendingChatsError("");
    const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
    const endpoints = [
      `https://cleezoclass.com:5000/api/chat-requests/pending?schoolCode=${encodeURIComponent(schoolCode)}`,
      `https://cleezoclass.com:5000/api/chat-requests?schoolCode=${encodeURIComponent(schoolCode)}`,
    ];
    try {
      const mergedChats: any[] = [];
      const seenKeys = new Set<string>();

      for (const url of endpoints) {
        const res = await fetch(url);
        if (!res.ok) continue;
        const body = await res.json();
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body?.requests)
              ? body.requests
              : Array.isArray(body?.chatRequests)
                ? body.chatRequests
                : [];

        list.forEach((item: any) => {
          const key =
            String(item?.id || item?.request_id || item?.sessionId || item?.session_id || item?.chat_id || "").trim() ||
            `${item?.date || item?.created_at || ""}-${item?.time || item?.createdAt || ""}-${item?.party1_name || item?.party2_student || ""}`;
          if (seenKeys.has(key)) return;
          seenKeys.add(key);
          mergedChats.push(item);
        });
      }

      const billDeleteRes = await fetch(
        `https://cleezoclass.com:5000/api/bill/delete-requests?schoolCode=${encodeURIComponent(schoolCode)}&status=pending`
      );
      if (billDeleteRes.ok) {
        const billDeleteBody = await billDeleteRes.json().catch(() => ({}));
        const billDeleteRequests = Array.isArray(billDeleteBody?.requests)
          ? billDeleteBody.requests
          : Array.isArray(billDeleteBody?.data)
            ? billDeleteBody.data
            : Array.isArray(billDeleteBody)
              ? billDeleteBody
              : [];

        billDeleteRequests.forEach((item: any) => {
          const key = `bill-delete-${item?.id || item?.receiptNumber || ""}`;
          if (seenKeys.has(key)) return;
          seenKeys.add(key);
          mergedChats.push({ ...item, requestType: "bill-delete" });
        });
      }

      setPendingChats(mergedChats);
    } catch (err) {
      console.error("Failed to fetch pending chat approvals:", err);
      setPendingChatsError("Failed to load pending approvals.");
      setPendingChats([]);
    } finally {
      setPendingChatsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingChats();
  }, []);

  const handleBillDeleteApproval = async (request: any, action: "approve" | "reject") => {
    const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
    const requestId = request?.id;
    if (!requestId) {
      setPopupMessage("Delete request id is missing.");
      return;
    }

    const promptMessage =
      action === "approve"
        ? "Optional principal comments for approving this receipt deletion:"
        : "Enter principal comments for rejecting this receipt deletion:";
    const adminComments = window.prompt(promptMessage, "");

    if (adminComments === null) return;
    if (action === "reject" && !adminComments.trim()) {
      setPopupMessage("Comments are required to reject a delete request.");
      return;
    }

    const reviewerName =
      getUserDisplayName("Principal") ||
      localStorage.getItem("name") ||
      localStorage.getItem("username") ||
      "Principal";

    try {
      const endpoint =
        action === "approve"
          ? `${ADMIN_API_BASE}/bill/delete-request/${requestId}/approve`
          : `${ADMIN_API_BASE}/bill/delete-request/${requestId}/reject`;

      await axios.put(
        endpoint,
        {
          adminComments: adminComments.trim(),
          approvedBy: action === "approve" ? reviewerName : undefined,
          rejectedBy: action === "reject" ? reviewerName : undefined,
        },
        { params: { schoolCode } }
      );

      setPopupMessage(
        action === "approve"
          ? `Receipt ${request.receiptNumber} deleted after principal approval.`
          : `Receipt ${request.receiptNumber} delete request rejected.`
      );
      await loadPendingChats();
    } catch (error: any) {
      console.error("Failed to update bill delete request:", error);
      setPopupMessage(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to update bill delete request."
      );
    }
  };

  const openLiveChatPopup = () => {
    setPopupType("liveChat");
  };

  const closePopup = () => setPopupType("");

  const handleCreateLiveChatRequest = async () => {
    const { party1, className, section, student, date, time } = liveChatForm;

    if (!party1 || !className || !section || !student) {
      setPopupMessage("Staff, class, section, and student are required.");
      return;
    }

    const party1Obj = party1List.find((item: any) => item.name === party1);
    if (!party1Obj) {
      setPopupMessage("Please select a valid staff member.");
      return;
    }

    const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
    try {
      const { data } = await axios.post(`${ADMIN_API_BASE}/chat-request`, {
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
      await loadPendingChats();
    } catch (error: any) {
      console.error("Failed to save chat request", error);
      setPopupMessage(error?.response?.data?.message || error.message || "Failed to save chat request.");
    }
  };

  useEffect(() => {
    const fetchStoreActions = async () => {
      setStoreActionsLoading(true);
      setStoreActionsError("");
      const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
      try {
        const res = await fetch(
          `https://cleezoclass.com:5000/api/po/requests?schoolCode=${encodeURIComponent(schoolCode)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStoreActions(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        console.error("Failed to fetch store actions:", err);
        setStoreActionsError("Failed to load store actions.");
        setStoreActions([]);
      } finally {
        setStoreActionsLoading(false);
      }
    };
    fetchStoreActions();
  }, []);

  const getEventDate = (event: any) => {
    return (
      event?.event_date ||
      event?.date ||
      event?.eventDate ||
      event?.start_date ||
      event?.startDate ||
      ""
    );
  };

  const getMeetingDate = (meeting: any) => {
    return (
      meeting?.meeting_date ||
      meeting?.date ||
      meeting?.meetingDate ||
      meeting?.start_date ||
      meeting?.startDate ||
      ""
    );
  };

  const formatDateLabel = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const dayItemMap = useMemo(() => {
    const map = new Map<number, any[]>();

    events.forEach((event) => {
      const raw = getEventDate(event);
      if (!raw) return;
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return;
      const day = parsed.getDate();
      const entry = {
        id: `event-${event.id}`,
        type: "Event",
        name: event?.eventName || event?.event_name || "Event",
        date: raw,
      };
      map.set(day, [...(map.get(day) || []), entry]);
    });

    meetings.forEach((meeting) => {
      const raw = getMeetingDate(meeting);
      if (!raw) return;
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return;
      const day = parsed.getDate();
      const entry = {
        id: `meeting-${meeting.id}`,
        type: "Meeting",
        name: meeting?.meetingTitle || meeting?.meeting_title || "Meeting",
        date: raw,
      };
      map.set(day, [...(map.get(day) || []), entry]);
    });

    return map;
  }, [events, meetings]);

  const monthEventLogs = useMemo(() => {
    const bucket = new Map<string, number>();
    events.forEach((event) => {
      const raw = getEventDate(event);
      if (!raw) return;
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return;
      const key = `${parsed.getFullYear()}-${parsed.getMonth()}`;
      bucket.set(key, (bucket.get(key) || 0) + 1);
    });
    return Array.from(bucket.entries())
      .map(([key, count]) => {
        const [yearStr, monthStr] = key.split("-");
        const year = Number(yearStr);
        const month = Number(monthStr);
        const label = `${new Date(year, month, 1).toLocaleString("en-US", {
          month: "short",
        })} ${year}`;
        return { key, label, count, year, month };
      })
      .sort((a, b) => (a.year - b.year) || (a.month - b.month));
  }, [events]);

  const monthMeetingLogs = useMemo(() => {
    const bucket = new Map<string, number>();
    meetings.forEach((meeting) => {
      const raw = getMeetingDate(meeting);
      if (!raw) return;
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return;
      const key = `${parsed.getFullYear()}-${parsed.getMonth()}`;
      bucket.set(key, (bucket.get(key) || 0) + 1);
    });
    return Array.from(bucket.entries())
      .map(([key, count]) => {
        const [yearStr, monthStr] = key.split("-");
        const year = Number(yearStr);
        const month = Number(monthStr);
        const label = `${new Date(year, month, 1).toLocaleString("en-US", { month: "short" })} ${year}`;
        return { key, label, count, year, month };
      })
      .sort((a, b) => (a.year - b.year) || (a.month - b.month));
  }, [meetings]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const startOffset = firstDay.getDay(); // 0 = Sun
    const cells: Array<{ day: number | null }> = [];
    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ day: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day });
    }
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let i = remainder; i < 7; i += 1) {
        cells.push({ day: null });
      }
    }
    return cells;
  }, [calendarMonth, calendarYear]);

  const latestAnnouncement = announcements[0] || null;
  const latestEvent = events[0] || null;
  const latestMeeting = meetings[0] || null;


  const footerCards = [
    {
      title: latestAnnouncement ? formatDateLabel(latestAnnouncement.announcementDate) : "--",
      subtitle: latestAnnouncement?.title || "No announcements",
      meta: "Announcements",
    },
    {
      title: latestEvent ? formatDateLabel(latestEvent.eventDate) : "--",
      subtitle: latestEvent?.eventName || "No events",
      meta: "Events",
    },
    {
      title: latestMeeting ? formatDateLabel(latestMeeting.meetingDate) : "--",
      subtitle: latestMeeting?.meetingTitle || "No meetings",
      meta: "Meetings",
    },
    { title: "Complaints", subtitle: "Store", meta: "Uniform" },
  ];
const academicPercentage = Number(performance.overallPercentage || 0);



const behaviourPercentage =
  100 -
  (Number(behaviour.needsImprovementPercentage || 0) +
   Number(behaviour.negativePercentage || 0));

const overallPerformance1 = (
  (
    academicPercentage 
  ) / 1
).toFixed(1);


const progressAngle = `${(academicPercentage / 100) * 360}deg`;
  return (
    <div className="dashboard-page dashboard-home-page frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page admission-dashboard-page">
      <div className="dashboard-shell accountant-dashboard-shell" style={{ position: "relative" }}>
        {String(localStorage.getItem("userRole") || "").toLowerCase() === "superadmin" ? (
          <button
            type="button"
            onClick={() => navigate("/ChiefDashboard")}
            style={{
              position: "absolute",
              top: "calc(50% - 15.5rem - 1.1rem - 15px)",
              left: "0.65rem",
              zIndex: 2,
              padding: 0,
              border: 0,
              background: "transparent",
              boxShadow: "none",
              appearance: "none",
              outline: 0,
              color: "#111111",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "underline",
              textDecorationColor: "#f36b79",
              textUnderlineOffset: "0.18rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Chief Dashboard
          </button>
        ) : null}

        <aside className="dashboard-sidebar accountant-sidebar-strip">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`dashboard-sidebar-item accountant-sidebar-item ${activeSidebar === item.key ? "dashboard-sidebar-item-active accountant-sidebar-item-active" : ""}`}
              onClick={() => {
                setActiveSidebar(item.key);
                if (item.key === "dashboard") {
                  setActiveTopTab("Dashboard");
                }
                if (item.key === "academics") {
                  setActiveTopTab("Academics");
                  navigate("/AdiminAcademicsNew");
                }
                if (item.key === "events") {
                  setActiveTopTab("Events & Meetings");
                  navigate("/AdminEventsAndMeetings");
                }
                if (item.key === "communication") {
                  navigate("/AdminGenerations");
                }
                if (item.key === "enrollments") {
                  navigate("/AdminStoreNew");
                }
                if (item.key === "reports") {
                  setActiveTopTab("Reports");
                  navigate("/AdminReportsPage");
                }
              }}
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
              {topTabs.map((tab, idx) => (
                <div
                  key={tab}
                  className={`dashboard-topbar-tab accountant-topbar-tab ${activeTopTab === tab ? "dashboard-topbar-tab-active accountant-topbar-tab-active" : ""}`}
                >
                  <button
                    className="accountant-topbar-tab-button"
                    type="button"
                    onClick={() => {
                      setActiveTopTab(tab);
                      if (tab === "Academics") {
                        navigate("/AdiminAcademicsNew");
                      }
                      if (tab === "Events & Meetings") {
                        navigate("/AdminEventsAndMeetings");
                      }
                      if (tab === "Dashboard") {
                        navigate("/AdminDashboard");
                      }
                      if (tab === "Reports") {
                        navigate("/AdminReportsPage");
                      }
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

             <div style={{ 
  display: "flex", 
  alignItems: "center", 
  gap: "12px" 
}}>
  <button
    className="accountant-help-icon-btn"
    // style={{marginTop:"40px"}}
    onClick={() => setIsHelpOpen(true)}
    title="Help"
  >
    <FiHelpCircle
      style={{
        color: "#e9818c",
        fontSize: "34px"
      }}
    />
  </button>

  <button
    className="header-profile-trigger"
    type="button"
    onClick={() => setUserDropdownOpen((prev) => !prev)}
    style={{marginTop:"20px"}}
    title="Profile"
  >
    <FaUser className="header-profile-trigger-icon" />
  </button>
</div>

                {userDropdownOpen && (
                  <div className="header-profile-dropdown">
                    <div className="header-profile-card header-profile-card-editable">
                      <button
                        type="button"
                        className="header-profile-edit-btn"
                        onClick={profileEditOpen ? closeProfileEditor : openProfileEditor}
                        aria-label="Edit profile"
                        title="Edit profile"
                      >
                        <FaEdit />
                      </button>
                      <div className="header-profile-avatar">
                        {userInfo?.photo ? (
                          <img
                            src={userInfo.photo}
                            alt="Profile"
                            className="header-profile-avatar-image"
                          />
                        ) : (
                          <FaUser className="header-profile-avatar-fallback" />
                        )}
                      </div>
                      <div className="header-profile-name">
                        {userInfo?.name || userInfo?.username || "User"}
                      </div>
                    </div>

                    <hr className="header-profile-divider" />
                    <div className="header-profile-info">
                      <div>
                        <strong>Designation:</strong> {userInfo?.designation || "-"}
                      </div>
                      {profileEditOpen ? (
                        <div className="header-profile-form">
                          <label className="header-profile-label">
                            <strong>Gender:</strong>
                            <input
                              type="text"
                              value={profileForm.gender}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
                              placeholder="Enter gender"
                              className="header-profile-input"
                            />
                          </label>
                          <label className="header-profile-label">
                            <strong>Phone:</strong>
                            <input
                              type="text"
                              value={profileForm.phone_no}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone_no: e.target.value }))}
                              placeholder="Enter phone number"
                              className="header-profile-input"
                            />
                          </label>
                          <label className="header-profile-label">
                            <strong>Email:</strong>
                            <input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                              placeholder="Enter email"
                              className="header-profile-input"
                            />
                          </label>
                        </div>
                      ) : (
                        <>
                          <div className="header-profile-field">
                            <strong>Gender:</strong>
                            <span>{userInfo?.gender || "-"}</span>
                          </div>
                          <div className="header-profile-field">
                            <strong>Phone:</strong>
                            <span>{userInfo?.phone_no || "-"}</span>
                          </div>
                          <div className="header-profile-email">
                            <strong>Email:</strong> {userInfo?.email || "-"}
                          </div>
                        </>
                      )}
                      <div>
                        <strong>School Name:</strong> {schoolName || "-"}
                      </div>
                      <div>
                        <strong>School Address:</strong> {instituteAddress || "-"}
                      </div>
                    </div>

                    {profileEditOpen && (
                      <>
                        {profileSaveStatus && (
                          <div
                            className={`header-profile-status ${profileSaveStatus.toLowerCase().includes("failed") ||
                              profileSaveStatus.toLowerCase().includes("missing")
                              ? "header-profile-status-error"
                              : "header-profile-status-success"
                              }`}
                          >
                            {profileSaveStatus}
                          </div>
                        )}
                        <div className="header-profile-actions">
                          <button
                            type="button"
                            onClick={closeProfileEditor}
                            className="header-profile-logout header-profile-cancel"
                            disabled={profileSaving}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveProfile}
                            className="header-profile-logout header-profile-save"
                            disabled={profileSaving}
                          >
                            {profileSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </>
                    )}
                    {/* <button
                      type="button"
                      onClick={() => navigate("/HrDashboard")}
                      className="header-profile-logout"
                    >
                      Switch to HR
                    </button> */}
                    <button onClick={handleLogout} className="header-profile-logout">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="accountant-grid">
            <div className="accountant-row accountant-row-top">
              <div className="accountant-welcome-block">
                <h2>Hi, {userInfo?.name || userInfo?.username || getUserDisplayName()}!</h2>
                <p>Check Store Inventory,</p>
                <p>Report Track to Class Teacher</p>
                <p>Submit Building maintenance</p>
              </div>

              <div className="accountant-task-card accountant-card">
                <div className="taskCardContent">
                  <TaskOfTheDay />
                </div>
              </div>

              <div className="accountant-mini-cards">
                {quickCards.map((card) => (
                  <div
                    key={card.title}
                    className="accountant-quick-card accountant-card accountant-quick-card-clickable"
                    onClick={() => setActiveQuickPanel(card.key as any)}
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

            <div className="accountant-row accountant-row-middle">
              <div className="accountant-collect-card accountant-card">
                <div className="collect-header">
                  <div className="collect-title-block">
                    <h3>Academics</h3>
                  </div>
                  <button type="button" className="collect-filter">
                    <span>As on today</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="accountant-inline-plus accountant-inline-plus-below"
                  onClick={() => navigate("/AdiminAcademicsNew")}
                >
                  +
                </button>

                <div className="accountant-collect-content">
<div className="accountant-progress-panel" style={{ ["--admission-progress" as any]: progressAngle }}>
                      <div className="accountant-progress-ring">
                      <div className="accountant-progress-ring-inner">{academicPercentage || 0}%</div>
                    </div>
                  </div>

                  <div className="collect-stats">
                   
                                <p><span>Performance - student:</span> <strong>{performance.overallPercentage || 0}%</strong></p>
      <p> Positive: <strong>{behaviour.positivePercentage || 0}%</strong></p>

                    <p>
 <p> Needs Improvement: <strong>{behaviour.needsImprovementPercentage || 0}%</strong></p>

      <p>Negative: <strong>{behaviour.negativePercentage || 0}%</strong></p>                    </p>
                    
                  </div>
                </div>

               
              </div>

              <div className="accountant-feetype-card accountant-card admission-events-card admin-events-calendar">
                <div className="admin-events-card-header">
                  <h3>Events & Meetings</h3>
                  <div className="admin-events-filters">
                    <select
                      value={calendarYear}
                      onChange={(e) => setCalendarYear(Number(e.target.value))}
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <select
                      value={calendarMonth}
                      onChange={(e) => setCalendarMonth(Number(e.target.value))}
                    >
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <option key={idx} value={idx}>
                          {new Date(2026, idx, 1).toLocaleString("en-US", { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="admin-events-calendar-stack">
                  <div className="admin-events-calendar-grid">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <span key={d} className="admin-events-weekday">
                        {d}
                      </span>
                    ))}
                  </div>
                  <div className="admin-events-calendar-grid">
                    {calendarCells.map((cell, idx) => (
                      <button
                        type="button"
                        key={`${cell.day ?? "blank"}-${idx}`}
                        className={`admin-events-day ${cell.day && dayItemMap.has(cell.day) ? "is-line" : ""}`}
                        disabled={!cell.day}
                        onClick={() => {
                          if (!cell.day) return;
                          const items = dayItemMap.get(cell.day) || [];
                          if (items.length === 0) return;
                          setSelectedCalendarItems(items);
                          setSelectedCalendarDateLabel(
                            formatDateLabel(`${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`)
                          );
                        }}
                      >
                        {cell.day ?? ""}
                      </button>
                    ))}
                  </div>
                  <div className="admin-events-calendar-summary">
                    {eventsLoading && <div>Loading events...</div>}
                    {!eventsLoading && eventsError && <div className="admin-events-calendar-error">{eventsError}</div>}
                    {!eventsLoading && !eventsError && monthEventLogs.length === 0 && monthMeetingLogs.length === 0 && (
                      <div></div>
                    )}
                    {!eventsLoading && !eventsError && (monthEventLogs.length > 0 || monthMeetingLogs.length > 0) && (
                      <div className="admission-events-summary">
                        {monthEventLogs.map((log) => (
                          <div key={`event-${log.key}`} className="admission-events-summary-line">
                            {log.label} - {log.count} event{log.count > 1 ? "s" : ""}
                          </div>
                        ))}
                        {monthMeetingLogs.map((log) => (
                          <div key={`meeting-${log.key}`} className="admission-events-summary-line">
                            {log.label} - {log.count} meeting{log.count > 1 ? "s" : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="accountant-feetype-card accountant-card admission-livechat-card">
                <div className="accountant-card-header">
                  <h3>
                    {activeQuickPanel === "assistant"
                      ? "Assistant Actions"
                      : activeQuickPanel === "storepo"
                        ? "Store PO"
                        : "Live Chat"}
                  </h3>
                  <div className="accountant-card-filters">
                    <button className="accountant-card-filter" type="button" onClick={openLiveChatPopup}>+ Create New</button>
                    <div className="accountant-feetype-count">
                      <strong>
                        {activeQuickPanel === "assistant"
                          ? assistantPanelItems.length
                          : activeQuickPanel === "storepo"
                            ? storeActions.length
                            : pendingChatCount}
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
                {activeQuickPanel === "assistant" ? (
                  <div style={{ padding: "0 0.35rem", display: "grid", gap: "0.6rem", maxHeight: "10.5rem", overflowY: "auto" }}>
                    <div >{festival &&
                      <div className="admin-events-assistant-item admin-events-assistant-posters"
                        onClick={() => setEventSelected(!eventSelected)}>
                        <strong><SchoolEventsHeading /></strong>
                      </div>
                    }
                    </div>


                    {eventSelected ? <div><SchoolEventsPosters /> </div> : assistantPanelItems.map((item) => (
                      <div
                        key={item.title}
                        style={{
                          border: "1px solid #ececec",
                          borderRadius: "10px",
                          padding: "0.5rem",
                          background: "#fff",
                        }}
                      >
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#222" }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#666", marginTop: "0.2rem" }}>
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeQuickPanel === "storepo" ? (
                  <div style={{ padding: "0 0.35rem", display: "grid", gap: "0.6rem", maxHeight: "10.5rem", overflowY: "auto" }}>
                    {storeActionsLoading && (
                      <div style={{ fontSize: "0.74rem", color: "#777" }}>Loading store actions...</div>
                    )}
                    {!storeActionsLoading && storeActionsError && (
                      <div style={{ fontSize: "0.74rem", color: "#c0392b" }}>{storeActionsError}</div>
                    )}
                    {!storeActionsLoading && !storeActionsError && storeActions.length === 0 && (
                      <div style={{ fontSize: "0.74rem", color: "#777" }}>No PO requests found.</div>
                    )}
                    {storeActions.map((action: any) => (
                      <div
                        key={action.id || action.po_id || action.request_id || `${action.stockName}-${action.quantity}`}
                        style={{
                          border: "1px solid #ececec",
                          borderRadius: "10px",
                          padding: "0.5rem",
                          background: "#fff",
                          display: "grid",
                          gap: "0.2rem",
                        }}
                      >
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#222" }}>
                          {action.text ||
                            `${action.stockName || "Stock"} • Qty ${action.quantity || "-"} • ${action.category || "PO"
                            }`}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#666" }}>
                          Status: {action.status || "AWAITING"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="chat-list" style={{ padding: "0 0.35rem", display: "grid", gap: "0.8rem", maxHeight: "10.5rem", overflowY: "auto" }}>
                    {pendingChatsLoading && (
                      <div style={{ fontSize: "0.74rem", color: "#777" }}>Loading pending approvals...</div>
                    )}
                    {!pendingChatsLoading && pendingChatsError && (
                      <div style={{ fontSize: "0.74rem", color: "#c0392b" }}>{pendingChatsError}</div>
                    )}
                    {!pendingChatsLoading && !pendingChatsError && pendingChats.length === 0 && (
                      <div style={{ fontSize: "0.74rem", color: "#777" }}>No approval requests found.</div>
                    )}
                    {!pendingChatsLoading && !pendingChatsError && pendingChats.length > 0 && (
                      <>
                        <div style={{ display: "grid", gap: "0.55rem" }}>
                          <small style={{ color: "#666", fontSize: "0.68rem", fontWeight: 700 }}>Requests</small>
                          {requestItems.length === 0 ? (
                            <div style={{ fontSize: "0.7rem", color: "#777" }}>No requests found.</div>
                          ) : (
                            requestItems.map((chat: any) => (
                              <div
                                key={chat.id || chat.request_id || chat.sessionId || chat.session_id}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr auto",
                                  alignItems: "center",
                                  gap: "0.55rem",
                                  fontSize: "0.64rem",
                                  color: "#666",
                                }}
                              >
                                {chat.requestType === "bill-delete" ? (
                                  <>
                                    <span>
                                      Bill Delete - Receipt {chat.receiptNumber || "-"} - {chat.studentName || "Student"} requested by {chat.requestedBy || "Accountant"}
                                      <br />
                                      <small style={{ color: "#777" }}>Comments: {chat.comments || "-"}</small>
                                    </span>
                                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                      <button
                                        type="button"
                                        onClick={() => handleBillDeleteApproval(chat, "approve")}
                                        style={{
                                          border: 0,
                                          borderRadius: "999px",
                                          background: "#e8f8ef",
                                          color: "#16884a",
                                          padding: "0.35rem 0.55rem",
                                          fontSize: "0.62rem",
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleBillDeleteApproval(chat, "reject")}
                                        style={{
                                          border: 0,
                                          borderRadius: "999px",
                                          background: "#fff0f0",
                                          color: "#c0392b",
                                          padding: "0.35rem 0.55rem",
                                          fontSize: "0.62rem",
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <span>
                                    Live Chat (P - T) - {formatChatDateTime(chat.date, chat.time)} - {chat.party1_name || "Staff"} to {chat.party2_student || "Student"}, {chat.party2_class || "-"}{chat.party2_section || ""}
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        <div style={{ display: "grid", gap: "0.55rem" }}>
                          <small style={{ color: "#666", fontSize: "0.68rem", fontWeight: 700 }}>Scheduled</small>
                          {scheduledItems.length === 0 ? (
                            <div style={{ fontSize: "0.7rem", color: "#777" }}>No scheduled chats found.</div>
                          ) : (
                            scheduledItems.map((chat: any) => (
                              <div
                                key={`scheduled-${chat.id || chat.request_id || chat.sessionId || chat.session_id}`}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr auto",
                                  alignItems: "center",
                                  gap: "0.55rem",
                                  fontSize: "0.64rem",
                                  color: "#666",
                                }}
                              >
                                <span>
                                  Live Chat (T - P) - {formatChatDateTime(chat.date, chat.time)} - {chat.party1_name || "Staff"} to {chat.party2_student || "Student"}, {chat.party2_class || "-"}{chat.party2_section || ""}
                                </span>
                                <div style={{ display: "flex", gap: "0.35rem" }}>
                                  <button style={{ width: "1.7rem", height: "1.7rem", border: 0, borderRadius: "50%", background: "#eef5ff", color: "#60a5fa" }}>▷</button>
                                  <button style={{ width: "1.7rem", height: "1.7rem", border: 0, borderRadius: "50%", background: "#eef5ff", color: "#60a5fa" }}>✕</button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="accountant-row accountant-row-bottom">
              <div className="accountant-ticket-card accountant-card">
                <FrontDesk_Tickets showTable={false} />
              </div>

              <div
                className="accountant-premium-card accountant-card"
                role="button"
                tabIndex={0}
                onClick={() => setPopupMessage(PREMIUM_SUPPORT_MESSAGE)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPopupMessage(PREMIUM_SUPPORT_MESSAGE);
                  }
                }}
              >
                <img src={premiumIcon} alt="Premium" className="accountant-premium-icon" />
                <h3>Go Premium!</h3>
                <p>opt in for premium pack and get full access of Timetable, Performance analysis and more.</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPopupMessage(PREMIUM_SUPPORT_MESSAGE);
                  }}
                >
                  Find out More
                </button>
              </div>

              <div className="accountant-bottom-right">
                <div className="accountant-income-card accountant-card">
                  <div className="accountant-progress-ring" style={{ ["--admission-progress" as any]: progressAngle }}>
                    <div className="accountant-progress-ring-inner">{performance.overallPercentage || 0}%</div>
                  </div>
                  <h3>Performance</h3>
                  <p>{performance.overallPercentage || 0}%</p>
                </div>

                <div className="accountant-prevdue-card accountant-card">
                  <p className="accountant-prevdue-amount">8 abs / {teachers.length} avl</p>
                  <h3>Substitute</h3>
                  <p>8 teachers absent today</p>
                </div>

                <div className="accountant-total-strip accountant-card">
                  {/* <div className="accountant-total-strip-list">
                    <div className="accountant-total-strip-item">
                      <strong>12/02/2026</strong>
                      <span>9A - Extra Class</span>
                    </div>
                    <div className="accountant-total-strip-item">
                      <strong>14/04/2026</strong>
                      <span>Gurunanak Jayn</span>
                    </div>
                    <div className="accountant-total-strip-item accountant-total-strip-item-total">
                      <strong>524 / 534</strong>
                      <span>Call / Bills</span>
                    </div>
                  </div>
                  <div className="accountant-total-strip-right">
                    <span>Complaints</span>
                    <h2>Store</h2>
                    <p>Uniform</p>
                  </div> */}
                  <div className="admin-events-footer accountant-card "
                    style={{
                      border: "none",
                      boxShadow: "none"
                    }}>
                    {footerCards.map((item) => (
                      <div key={`${item.meta}-${item.title}`} className="admin-events-footer-item">
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
        </div>
      </div>

      {popupType === "liveChat" && (
        <div className="admin-events-modal-overlay" onClick={closePopup}>
          <div className="admin-events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>Individual Chat Request</h3>
              <button type="button" className="admin-events-modal-close" onClick={closePopup}>
                ×
              </button>
            </div>
            <div className="admin-events-form-grid">
              <select
                className="admin-events-input"
                value={liveChatForm.party1}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, party1: e.target.value }))}
              >
                <option value="">Party 1 Staff</option>
                {party1List.map((item: any) => (
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
                {classOptions.map((item: any, index: number) => (
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
                {sectionOptions.map((item: any, index: number) => (
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
                {studentOptions.map((item: any, index: number) => (
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

      {profileImageOpen && (
        <div
          onClick={() => setProfileImageOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: "18px",
              borderRadius: "14px",
              minWidth: "260px",
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Profile Image</div>
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                margin: "0 auto 12px",
                overflow: "hidden",
                border: "4px solid #2f3b45",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f1f2f4",
              }}
            >
              {userInfo?.photo ? (
                <img
                  src={userInfo.photo}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <FaUser style={{ fontSize: 40, color: "#777" }} />
              )}
            </div>
            <button
              type="button"
              className="header-profile-logout"
              onClick={() => setProfileImageOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="accountant-footer-brand">
        <span>Powered By:</span>
        <img src={abcLogo} alt="Cleezo Class" className="accountant-footer-logo" />
      </div>



      {selectedCalendarItems.length > 0 ? (
        <div
          className="admin-store-modal-overlay"
          onClick={() => {
            setSelectedCalendarItems([]);
            setSelectedCalendarDateLabel("");
          }}
          role="presentation"
        >
          <div
            className="admin-store-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Event and meeting details"
            style={{ width: "min(92vw, 520px)", height: "auto" }}
          >
            <div className="admin-store-modal-header">
              <div>
                <h3>Events & Meetings</h3>
                <p>{selectedCalendarDateLabel || "Selected date"}</p>
              </div>
              <button
                type="button"
                className="admin-store-modal-close"
                onClick={() => {
                  setSelectedCalendarItems([]);
                  setSelectedCalendarDateLabel("");
                }}
              >
                Close
              </button>
            </div>

            <div className="admin-store-modal-body" style={{ padding: "1rem 1.25rem 1.2rem" }}>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {selectedCalendarItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid rgba(226, 209, 213, 0.92)",
                      borderRadius: "1rem",
                      padding: "0.85rem 1rem",
                      background: "#fff8f8",
                      display: "grid",
                      gap: "0.25rem",
                    }}
                  >
                    <div style={{ fontSize: "0.72rem", color: "#ef6574", fontWeight: 700 }}>{item.type}</div>
                    <div
                      style={{
                        fontSize: "0.96rem",
                        color: "#1f2937",
                        fontWeight: 800,
                        paddingBottom: "0.28rem",
                        borderBottom: "2px solid #f8b1b8",
                      }}
                    >
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
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
  

    </div>
  );
};

export default AdminDashboard;
