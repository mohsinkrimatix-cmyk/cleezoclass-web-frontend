import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaUser } from "react-icons/fa";
import axios from "axios";
import "./AccountantDashboardnew.css";
import "../frontdeskdahboard/FrontDesk.css";
import "./AdminEventsAndMeetings.css";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import ErrorPopup from "../shared/ErrorPopup";
import InstituteBrand from "../shared/InstituteBrand.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
import { getUserDisplayName } from "../shared/userDisplayName";
import TaskOfTheDay from "../shared/TaskOfTheDay.tsx";
import abcLogo from "../assets/logoab.png";
import dashboardIcon from "../assets/Dashboard.png";
import academicsIcon from "../assets/Staff Assign.png";
import leadProfileIcon from "../assets/Lead Profile.png";
import enrollmentIcon from "../assets/Enrollment.png";
import reportsIcon from "../assets/Reports .png";
import timelineIcon from "../assets/Timeline.png";
import followupIcon from "../assets/Profile.png";
import assistantIcon from "../assets/Assistant.png";
import communicationIcon from "../assets/Communication Assign.png";
import { FiHelpCircle } from "react-icons/fi";
import HelpCenter from "../shared/HelpCenter.jsx";

const API_BASE = "https://cleezoclass.com:4000/api";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: dashboardIcon, route: "/AdminDashboard" },
  { key: "academics", label: "Academics", icon: academicsIcon, route: "/AdiminAcademicsNew" },
  { key: "events", label: "Events & Meetings", icon: leadProfileIcon, route: "/AdminEventsAndMeetings" },
      { key: "communication", label: "Generations", icon: communicationIcon,route: "/AdminGenerations" },
  
  { key: "store", label: "Store", icon: enrollmentIcon, route: "/AdminStoreNew" },
  { key: "report", label: "Report", icon: reportsIcon, route: "/AdminReportsPage" },
];

const quickCards = [
  { key: "livechat", title: "Live Chat", subtitle: "Approvals / Requests", icon: timelineIcon },
  { key: "storepo", title: "Store PO", subtitle: "Request Order / PO issue", icon: followupIcon },
  { key: "assistant", title: "Assistant", subtitle: "Daily Activity check", icon: assistantIcon },
];

const reminderItems = [
  "Reminder - 30/03/2026 - Class XA, Performance report issue",
  "Reminder - 30/03/2026 - Store, Request Order for Uniform",
];

const requests = [
  "Live Chat (P - T) - 30/03/2026, 3.00pm - G. Vinay, 10A to C.T.",
  "Live Chat (T - P) - 31/03/2026, 11.00am - C.T. to N. Somesh, 10A",
];

const scheduled = [
  "Live Chat (T - P) - 26/03/2026, 3.00pm - L. Haritha, 7A to C.T.",
  "Live Chat (T - P) - 27/03/2026, 10.45am - C.T. to P. Sailaja, 10A",
];

const demoStudents = [
  "M. Vijaya Raju",
  "C. Kalyan Ram",
  "S. Aishq Ali",
];

const demoStaff = [
  "J. Anush Reddy",
  "J. Anush Reddy",
  "J. Anush Reddy",
];

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

const isSameMonthYear = (value, year, monthIndex) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === year && date.getMonth() === monthIndex;
};

const getDaySet = (items, key, year, monthIndex) =>
  new Set(
    (Array.isArray(items) ? items : [])
      .filter((item) => isSameMonthYear(item?.[key], year, monthIndex))
      .map((item) => new Date(item[key]).getDate())
  );

const formatChatDateTime = (dateValue, timeValue) => {
  const dateLabel = dateValue ? formatDateLabel(dateValue) : "-";
  const timeLabel = timeValue ? formatTimeLabel(timeValue) : "--";
  return `${dateLabel}, ${timeLabel}`;
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

const AdminEventsAndMeetings = () => {
  const navigate = useNavigate();
  const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [popupType, setPopupType] = useState("");
  const [activeQuickPanel, setActiveQuickPanel] = useState("livechat");
  const [eventMeetingTab, setEventMeetingTab] = useState("event");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [chatRequests, setChatRequests] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [storeActions, setStoreActions] = useState([]);
  const [storeActionsLoading, setStoreActionsLoading] = useState(false);
  const [storeActionsError, setStoreActionsError] = useState("");
  const [schoolName, setSchoolName] = useState("Unknown School");
  const [schoolLogo, setSchoolLogo] = useState("/default-logo.png");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [party1List, setParty1List] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedCardStudent, setSelectedCardStudent] = useState("");
  const [selectedCardStaff, setSelectedCardStaff] = useState("");
        const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [openHelpSection, setOpenHelpSection] = useState(null);
  
  const userRole = localStorage.getItem("userRole");
  const [liveChatForm, setLiveChatForm] = useState({
    party1: "",
    className: "",
    section: "",
    student: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
  });

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    category: "General",
    announcementDate: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [eventForm, setEventForm] = useState({
    eventName: "",
    eventType: "General",
    eventDate: new Date().toISOString().split("T")[0],
    eventTime: "",
    description: "",
  });
  const [meetingForm, setMeetingForm] = useState({
    meetingTitle: "",
    meetingDate: new Date().toISOString().split("T")[0],
    meetingTime: "",
    agenda: "",
    description: "",
  });

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth, calendarYear]);

  const announcementDays = useMemo(
    () => getDaySet(announcements, "announcementDate", calendarYear, calendarMonth),
    [announcements, calendarYear, calendarMonth]
  );
  const eventDays = useMemo(
    () => getDaySet(events, "eventDate", calendarYear, calendarMonth),
    [events, calendarYear, calendarMonth]
  );
  const meetingDays = useMemo(
    () => getDaySet(meetings, "meetingDate", calendarYear, calendarMonth),
    [meetings, calendarYear, calendarMonth]
  );

  const latestAnnouncement = announcements[0] || null;
  const latestEvent = events[0] || null;
  const latestMeeting = meetings[0] || null;

  const buildDateValue = (day) => {
    if (!day) return "";
    return `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  };

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

  const assistantPanelItems = [
    {
      title: "Academics Tab Guidance",
      desc: "Check performance, exams, syllabus progress, and class-wise student discipline updates.",
    },
    {
      title: "Events & Meetings Guidance",
      desc: "Create events, assign meetings, and review pending discussion points and live chat follow-ups.",
    },
    {
      title: "Store Guidance",
      desc: "Review pending PO requests, validate stock movement, and raise replenishment actions early.",
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

  const visibleStudents = useMemo(() => {
    const source = Array.isArray(studentOptions) && studentOptions.length > 0 ? studentOptions : demoStudents;
    const normalized = source.filter(Boolean);

    if (!selectedCardStudent) {
      return normalized;
    }

    const selected = normalized.find((item) =>
      typeof item === "string" ? item === selectedCardStudent : item?.name === selectedCardStudent
    );
    const remaining = normalized.filter((item) =>
      typeof item === "string" ? item !== selectedCardStudent : item?.name !== selectedCardStudent
    );

    return selected ? [selected, ...remaining] : normalized;
  }, [selectedCardStudent, studentOptions]);

  const visibleStaff = useMemo(() => {
    const source = Array.isArray(party1List) && party1List.length > 0 ? party1List : demoStaff;
    const normalized = source.filter(Boolean);

    if (!selectedCardStaff) {
      return normalized.slice(0, 3);
    }

    const selected = normalized.find((item) =>
      typeof item === "string" ? item === selectedCardStaff : item?.name === selectedCardStaff
    );
    const remaining = normalized.filter((item) =>
      typeof item === "string" ? item !== selectedCardStaff : item?.name !== selectedCardStaff
    );
    const ordered = selected ? [selected, ...remaining] : normalized;

    return ordered.slice(0, 3);
  }, [party1List, selectedCardStaff]);

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

  const popupStudents = useMemo(
    () => (Array.isArray(studentOptions) ? studentOptions.filter(Boolean) : []),
    [studentOptions]
  );

  const popupStaff = useMemo(
    () => (Array.isArray(party1List) ? party1List.filter(Boolean) : []),
    [party1List]
  );

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.message || result?.error || "Request failed");
    }
    return result;
  };

  const loadAdminRecords = async () => {
    if (!schoolCode) {
      setPopupMessage("Missing school code.");
      return;
    }

    setLoadingRecords(true);
    try {
      const month = String(calendarMonth + 1);
      const year = String(calendarYear);
      const query = `schoolCode=${encodeURIComponent(schoolCode)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`;

      const [announcementRes, eventRes, meetingRes] = await Promise.all([
        fetchJson(`${API_BASE}/admin-announcements?${query}`),
        fetchJson(`${API_BASE}/admin-events?${query}`),
        fetchJson(`${API_BASE}/admin-meetings?${query}`),
      ]);

      setAnnouncements(Array.isArray(announcementRes.data) ? announcementRes.data : []);
      setEvents(Array.isArray(eventRes.data) ? eventRes.data : []);
      setMeetings(Array.isArray(meetingRes.data) ? meetingRes.data : []);
    } catch (error) {
      setPopupMessage(error.message || "Failed to load admin records.");
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadAdminRecords();
  }, [calendarMonth, calendarYear, schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;

    const loadLiveChatMeta = async () => {
      try {
        const [{ data: staffData }, { data: classData }] = await Promise.all([
          axios.get(`${API_BASE}/party1`, { params: { schoolCode } }),
          axios.get(`${API_BASE}/classes`, { params: { schoolCode } }),
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
      setSelectedCardStudent("");
      return;
    }

    axios
      .get(`${API_BASE}/sections/${encodeURIComponent(liveChatForm.className)}`, {
        params: { schoolCode },
      })
      .then((res) => {
        setSectionOptions(Array.isArray(res.data) ? res.data : []);
        setSelectedCardStudent("");
        setLiveChatForm((prev) => ({ ...prev, section: "", student: "" }));
      })
      .catch((error) => {
        console.error("Failed to load sections", error);
        setSectionOptions([]);
      });
  }, [liveChatForm.className, schoolCode]);

  useEffect(() => {
    if (!schoolCode || !liveChatForm.className || !liveChatForm.section) {
      setStudentOptions([]);
      setSelectedCardStudent("");
      return;
    }

    axios
      .get(`${API_BASE}/admin/students/${encodeURIComponent(liveChatForm.className)}/${encodeURIComponent(liveChatForm.section)}`, {
        params: { schoolCode },
      })
      .then((res) => {
        setStudentOptions(Array.isArray(res.data) ? res.data : []);
        setSelectedCardStudent("");
        setLiveChatForm((prev) => ({ ...prev, student: "" }));
      })
      .catch((error) => {
        console.error("Failed to load students", error);
        setStudentOptions([]);
      });
  }, [liveChatForm.className, liveChatForm.section, schoolCode]);

  const loadChatRequests = async () => {
    if (!schoolCode) return;
    setChatLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/chat-requests`, {
        params: { schoolCode },
      });
      setChatRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load chat requests", error);
      setChatRequests([]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    loadChatRequests();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;

    const fetchStoreActions = async () => {
      setStoreActionsLoading(true);
      setStoreActionsError("");
      try {
        const res = await fetch(`${API_BASE}/po/requests?schoolCode=${encodeURIComponent(schoolCode)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStoreActions(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
      } catch (error) {
        console.error("Failed to load store actions", error);
        setStoreActionsError("Failed to load store actions.");
        setStoreActions([]);
      } finally {
        setStoreActionsLoading(false);
      }
    };

    fetchStoreActions();
  }, [schoolCode]);

  const openAnnouncementPopup = (day) => {
    const selectedDate = buildDateValue(day) || announcementForm.announcementDate;
    setAnnouncementForm((prev) => ({
      ...prev,
      announcementDate: selectedDate,
    }));
    setPopupType("announcement");
  };

  const openEventPopup = (day) => {
    const selectedDate = buildDateValue(day) || eventForm.eventDate;
    setEventForm((prev) => ({
      ...prev,
      eventDate: selectedDate,
    }));
    setEventMeetingTab("event");
    setPopupType("eventMeeting");
  };

  const openMeetingPopup = (day) => {
    const selectedDate = buildDateValue(day) || meetingForm.meetingDate;
    setMeetingForm((prev) => ({
      ...prev,
      meetingDate: selectedDate,
    }));
    setEventMeetingTab("meeting");
    setPopupType("eventMeeting");
  };

  const closePopup = () => setPopupType("");

  const openLiveChatPopup = () => setPopupType("liveChat");

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.announcementDate) {
      setPopupMessage("Announcement title and date are required.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchJson(`${API_BASE}/admin-announcements`, {
        method: "POST",
        body: JSON.stringify({
          schoolCode,
          ...announcementForm,
        }),
      });

      setPopupMessage("Announcement saved successfully.");
      setAnnouncementForm((prev) => ({
        ...prev,
        title: "",
        description: "",
      }));
      closePopup();
      await loadAdminRecords();
    } catch (error) {
      setPopupMessage(error.message || "Failed to save announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.eventName.trim() || !eventForm.eventDate) {
      setPopupMessage("Event name and date are required.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchJson(`${API_BASE}/admin-events`, {
        method: "POST",
        body: JSON.stringify({
          schoolCode,
          ...eventForm,
        }),
      });

      setPopupMessage("Event saved successfully.");
      setEventForm((prev) => ({
        ...prev,
        eventName: "",
        eventTime: "",
        description: "",
      }));
      closePopup();
      await loadAdminRecords();
    } catch (error) {
      setPopupMessage(error.message || "Failed to save event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!meetingForm.meetingTitle.trim() || !meetingForm.meetingDate) {
      setPopupMessage("Meeting title and date are required.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchJson(`${API_BASE}/admin-meetings`, {
        method: "POST",
        body: JSON.stringify({
          schoolCode,
          ...meetingForm,
        }),
      });

      setPopupMessage("Meeting saved successfully.");
      setMeetingForm((prev) => ({
        ...prev,
        meetingTitle: "",
        meetingTime: "",
        agenda: "",
        description: "",
      }));
      closePopup();
      await loadAdminRecords();
    } catch (error) {
      setPopupMessage(error.message || "Failed to save meeting.");
    } finally {
      setSubmitting(false);
    }
  };

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

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API_BASE}/chat-request`, {
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
      setSelectedCardStaff(party1);
      setSelectedCardStudent(student);
      setLiveChatForm({
        party1: "",
        className,
        section,
        student: "",
        date: new Date().toISOString().split("T")[0],
        time: "",
      });
      closePopup();
      await loadChatRequests();
    } catch (error) {
      console.error("Failed to save chat request", error);
      setPopupMessage(error?.response?.data?.message || error.message || "Failed to save chat request.");
    } finally {
      setSubmitting(false);
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
  const renderHistoryItem = (label, secondary, tertiary) => (
    <div className="admin-events-history-item" key={`${label}-${secondary}-${tertiary}`}>
      <strong>{label}</strong>
      <span>{secondary}</span>
      {tertiary ? <small>{tertiary}</small> : null}
    </div>
  );
const percentage = Number(performance?.overallPercentage || 0);
  const progressAngle = `${percentage * 3.6}deg`;
  return (
    <div className="dashboard-page dashboard-home-page frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page admin-events-page">
      <div className="dashboard-shell accountant-dashboard-shell">
        <aside className="dashboard-sidebar accountant-sidebar-strip">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`dashboard-sidebar-item accountant-sidebar-item ${item.key === "events" ? "dashboard-sidebar-item-active accountant-sidebar-item-active" : ""}`}
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
                  className={`dashboard-topbar-tab accountant-topbar-tab ${tab === "Events & Meetings" ? "dashboard-topbar-tab-active accountant-topbar-tab-active" : ""}`}
                >
                  <button
                    className="accountant-topbar-tab-button"
                    type="button"
                    onClick={() => {
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

          <div className="admin-events-content">
            <div className="admin-events-top">
                    <div className="accountant-welcome-block">
                <h2>Hi, {getUserDisplayName()}!</h2>
                <p>Check Store Inventory,</p>
                <p>Report Track to Class Teacher</p>
                <p>Submit Building maintenance</p>
              </div>

      {/* OLD STATIC CARD */}
{/* NEW DYNAMIC CARD */}
<div className="admin-events-task accountant-card">
  <div className="taskCardContent">
    <TaskOfTheDay />
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

            <div className="admin-events-middle">
              <div className="accounntant-collect-card accountant-card">
                <div className="admin-events-card-header">
                  <h3>Announcements</h3>
                  <button type="button" className="collect-filter" onClick={loadAdminRecords}>
                    <span>Refresh</span>
                    <span>▼</span>
                  </button>
                </div>
                <div className="admin-events-calendar-grid">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <span key={day} className="admin-events-weekday">{day}</span>
                  ))}
                  {calendarCells.map((cell, index) => (
                    <button
                      type="button"
                      key={`announcement-${cell ?? "empty"}-${index}`}
                      className={`admin-events-day ${announcementDays.has(cell) ? "is-highlight" : ""}`}
                      onClick={() => cell && openAnnouncementPopup(cell)}
                      disabled={!cell}
                    >
                      {cell ?? ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="admin-events-calendar accountant-card">
                <div className="admin-events-card-header">
                  <h3>Events & Meetings</h3>
                  <div className="admin-events-filters">
                    <select value={calendarYear} onChange={(e) => setCalendarYear(Number(e.target.value))}>
                      {[2025, 2026, 2027, 2028].map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <select value={calendarMonth} onChange={(e) => setCalendarMonth(Number(e.target.value))}>
                      {Array.from({ length: 12 }).map((_, idx) => (
                        <option key={idx} value={idx}>
                          {new Date(2026, idx, 1).toLocaleString("en-US", { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="admin-events-calendar-grid">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <span key={day} className="admin-events-weekday">{day}</span>
                  ))}
                  {calendarCells.map((cell, index) => {
                    const hasEvent = eventDays.has(cell);
                    const hasMeeting = meetingDays.has(cell);
                    return (
                      <button
                        type="button"
                        key={`event-${cell ?? "empty"}-${index}`}
                        className={`admin-events-day ${(hasEvent || hasMeeting) ? "is-line" : ""}`}
                        onClick={() => {
                          if (!cell) return;
                          if (hasMeeting && !hasEvent) {
                            openMeetingPopup(cell);
                            return;
                          }
                          openEventPopup(cell);
                        }}
                        disabled={!cell}
                      >
                        {cell ?? ""}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="admin-events-livechat accountant-card">
                <div className="admin-events-card-header">
                  <h3>
                    {activeQuickPanel === "assistant"
                      ? "Assistant Actions"
                      : activeQuickPanel === "storepo"
                        ? "Store PO"
                        : "Live Chat"}
                  </h3>
                  <div className="accountant-card-filters">
                    {activeQuickPanel === "livechat" ? (
                      <button type="button" className="admin-events-create-btn" onClick={openLiveChatPopup}>+ Create New</button>
                    ) : null}
                    <div className="accountant-feetype-count">
                      <strong>
                        {activeQuickPanel === "assistant"
                          ? assistantPanelItems.length
                          : activeQuickPanel === "storepo"
                            ? storeActions.length
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
                {activeQuickPanel === "assistant" ? (
                  <div className="admin-events-chat-section">
                    {assistantPanelItems.map((item) => (
                      <div key={item.title} className="admin-events-assistant-item">
                        <strong>{item.title}</strong>
                        <span>{item.desc}</span>
                      </div>
                    ))}
                  </div>
                ) : activeQuickPanel === "storepo" ? (
                  <div className="admin-events-chat-section">
                    <small>Requests PO</small>
                    {storeActionsLoading ? (
                      <div className="admin-events-chat-item"><span>Loading...</span></div>
                    ) : storeActionsError ? (
                      <div className="admin-events-chat-item"><span>{storeActionsError}</span></div>
                    ) : storeActions.length === 0 ? (
                      <div className="admin-events-chat-item"><span>No PO requests found.</span></div>
                    ) : (
                      storeActions.map((item, index) => (
                        <div key={item.id || item.po_id || index} className="admin-events-chat-item">
                          <span>
                            {item.text ||
                              `${item.id ? `PO${item.id} - ` : ""}${item.date || item.created_at || ""}, ${item.stockName || item.stock_name || "Stock"}${item.quantity ? ` ${item.quantity}` : ""}`}
                          </span>
                          <div className="admin-events-chat-actions">
                            <button type="button">▷</button>
                            <button type="button">✕</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <>
                    <div className="admin-events-chat-section">
                      <small>Requests</small>
                      {chatLoading ? (
                        <div className="admin-events-chat-item"><span>Loading...</span></div>
                      ) : requestItems.length === 0 ? (
                        <div className="admin-events-chat-item"><span>No requests found.</span></div>
                      ) : (
                        requestItems.map((item) => (
                          <div key={item.id} className="admin-events-chat-item">
                            <span>
                              Live Chat (P - T) - {formatChatDateTime(item.date, item.time)} - {item.party1_name || "Staff"} to {item.party2_student || "Student"}, {item.party2_class || "-"}{item.party2_section ? item.party2_section : ""}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="admin-events-chat-section">
                      <small>Scheduled</small>
                      {scheduledItems.length === 0 ? (
                        scheduled.map((item) => (
                          <div key={item} className="admin-events-chat-item">
                            <span>{item}</span>
                            <div className="admin-events-chat-actions">
                              <button type="button">▷</button>
                              <button type="button">✕</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        scheduledItems.map((item) => (
                          <div key={item.id} className="admin-events-chat-item">
                            <span>
                              Live Chat (T - P) - {formatChatDateTime(item.date, item.time)} - {item.party1_name || "Staff"} to {item.party2_student || "Student"}, {item.party2_class || "-"}{item.party2_section ? item.party2_section : ""}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="admin-events-bottom">
              <div className="admin-events-live-chat-panel accountant-card">
                <div className="admin-events-card-header">
                  <h3>Live Chat</h3>
                  <div className="admin-events-filters">
                    <select
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
                  </div>
                </div>
                <div className="admin-events-split-panel">
                  <div className="admin-events-party-column">
                    <div className="admin-events-column-label">Student</div>
                    <div className="admin-events-user-row">
                      <button type="button" className="admin-events-add-circle" onClick={openLiveChatPopup}>+</button>
                      {visibleStudents.map((item, index) => (
                        <div
                          key={`${typeof item === "string" ? item : item?.id || index}`}
                          className="admin-events-user-card"
                        >
                          <div className="admin-events-user-icon"><FaUser /></div>
                          <strong>{typeof item === "string" ? item : item?.name || "Student"}</strong>
                          <span>
                            {liveChatForm.className || "-"}, {liveChatForm.section || "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
<div className="admin-events-divider">⇄</div>                  <div className="admin-events-party-column">
                    <div className="admin-events-column-label">Staff</div>
                    <div className="admin-events-user-row">
                      <button type="button" className="admin-events-add-circle" onClick={openLiveChatPopup}>+</button>
                      {visibleStaff.slice(0, 3).map((item, index) => (
                        <div
                          key={`${typeof item === "string" ? item : item?.id || index}`}
                          className="admin-events-user-card"
                        >
                          <div className="admin-events-user-icon"><FaUser /></div>
                          <strong>{typeof item === "string" ? item : item?.name || "Staff"}</strong>
                          <span>{typeof item === "string" ? "Staff" : item?.user_type || "Staff"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-events-side-stack">
                <div className="admin-events-metrics">
                  <div className="admin-events-metric accountant-card">
<div
                      className="admin-events-ring"
                      style={{ "--admission-progress": progressAngle }}>
                      <span>{percentage}%</span>
                    </div>                    <h4>Performance</h4>
                    <span>Students Track</span>
                  </div>
                  <div className="admin-events-metric accountant-card">
                    <strong>8</strong>
                    <small>abs. / 12 avl.</small>
                    <h4>Substitute</h4>
                    <span>8 teachers absent today</span>
                  </div>
                </div>

                <div className="admin-events-footer accountant-card">
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

      {popupType === "announcement" && (
        <div className="admin-events-modal-overlay" onClick={closePopup}>
          <div className="admin-events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>Create Announcement</h3>
              <button type="button" className="admin-events-modal-close" onClick={closePopup}>×</button>
            </div>
            <div className="admin-events-form-grid">
              <input
                className="admin-events-input"
                type="text"
                placeholder="Announcement title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <select
                className="admin-events-input"
                value={announcementForm.category}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Holiday">Holiday</option>
                <option value="Emergency">Emergency</option>
              </select>
              <input
                className="admin-events-input"
                type="date"
                value={announcementForm.announcementDate}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, announcementDate: e.target.value }))}
              />
              <textarea
                className="admin-events-input admin-events-textarea"
                placeholder="Description"
                value={announcementForm.description}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="admin-events-action-row">
              <button type="button" className="admin-events-submit-btn" onClick={handleCreateAnnouncement} disabled={submitting}>
                {submitting ? "Saving..." : "Create Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {popupType === "eventMeeting" && (
        <div className="admin-events-modal-overlay" onClick={closePopup}>
          <div className="admin-events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>Create {eventMeetingTab === "event" ? "Event" : "Meeting"}</h3>
              <button type="button" className="admin-events-modal-close" onClick={closePopup}>×</button>
            </div>
            <div className="admin-events-popup-tabs">
              <button
                type="button"
                className={`admin-events-popup-tab ${eventMeetingTab === "event" ? "active" : ""}`}
                onClick={() => setEventMeetingTab("event")}
              >
                Events
              </button>
              <button
                type="button"
                className={`admin-events-popup-tab ${eventMeetingTab === "meeting" ? "active" : ""}`}
                onClick={() => setEventMeetingTab("meeting")}
              >
                Meetings
              </button>
            </div>

            {eventMeetingTab === "event" ? (
              <div className="admin-events-form-grid">
                <input
                  className="admin-events-input"
                  type="text"
                  placeholder="Event name"
                  value={eventForm.eventName}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, eventName: e.target.value }))}
                />
                <select
                  className="admin-events-input"
                  value={eventForm.eventType}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, eventType: e.target.value }))}
                >
                  <option value="General">General</option>
                  <option value="Celebration">Celebration</option>
                  <option value="Competition">Competition</option>
                  <option value="Exam">Exam</option>
                </select>
                <input
                  className="admin-events-input"
                  type="date"
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                />
                <input
                  className="admin-events-input"
                  type="time"
                  value={eventForm.eventTime}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, eventTime: e.target.value }))}
                />
                <textarea
                  className="admin-events-input admin-events-textarea"
                  placeholder="Event description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            ) : (
              <div className="admin-events-form-grid">
                <input
                  className="admin-events-input"
                  type="text"
                  placeholder="Meeting title"
                  value={meetingForm.meetingTitle}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, meetingTitle: e.target.value }))}
                />
                <input
                  className="admin-events-input"
                  type="date"
                  value={meetingForm.meetingDate}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, meetingDate: e.target.value }))}
                />
                <input
                  className="admin-events-input"
                  type="time"
                  value={meetingForm.meetingTime}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, meetingTime: e.target.value }))}
                />
                <input
                  className="admin-events-input"
                  type="text"
                  placeholder="Agenda"
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, agenda: e.target.value }))}
                />
                <textarea
                  className="admin-events-input admin-events-textarea"
                  placeholder="Meeting description"
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            )}
            <div className="admin-events-action-row">
              <button
                type="button"
                className="admin-events-submit-btn"
                onClick={eventMeetingTab === "event" ? handleCreateEvent : handleCreateMeeting}
                disabled={submitting}
              >
                {submitting ? "Saving..." : eventMeetingTab === "event" ? "Create Event" : "Create Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                {popupStaff.map((item) => (
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
                {popupStudents.map((item, index) => (
                  <option key={`${item?.id || index}`} value={item?.name || ""}>
                    {item?.name || "Student"}
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
              <button type="button" className="admin-events-submit-btn" onClick={handleCreateLiveChatRequest} disabled={submitting}>
                {submitting ? "Saving..." : "Create Chat Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ErrorPopup
        message={loadingRecords ? "Loading announcements, events, and meetings..." : popupMessage}
        onClose={() => setPopupMessage("")}
      />
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

    </div>
  );
};

export default AdminEventsAndMeetings;