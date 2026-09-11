import React, { useState, useEffect, useRef, ReactNode, useMemo } from "react";
import { createPortal } from "react-dom";
import AdmissionReportPopup from "../shared/AdmissionReportPopup";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faAngleRight, faUser, faPlus, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import premiumIcon from "../assets/Go Premium.png";
import "./tabhower.css";
// import "./Dashboard.css";
import "./AccountantDashboardnew.css";
import "./FrontDesk.css";
import "./FrontDesk_Tickets.css";
import DashboardLayout from "../components/DashboardLayout.jsx";



// 1. IMPORT REQUIRED COMPONENTS (Ensure these also have .tsx or index.d.ts files)
import AccountantParties from "../accountant/Accountant_Parties.jsx";
import LeadsProfilePage from "./FrontDesk_LeadsProfilePage.tsx";
import AdmissionCRM from "./FrontDesk_Admission.jsx";
import TestAndCouncelling from "./FrontDesk_TestAndCouncelling.jsx";
import Communication from './Frontdesk_Communication.jsx';
import "./Frontdesk_Communication.css";
import Select, { MultiValue } from "react-select";
import ErrorPopup from "../shared/ErrorPopup";
import TaskOfTheDay from "../shared/TaskOfTheDay.tsx";
import LeadsTable from "./FrontDesk_Track.tsx";
import abcLogo from "../assets/logoab.png";
import homeIcon from "../assets/Dashboard.png";
import usersIcon from "../assets/Staff Assign.png";
import chartIcon from "../assets/Lead Profile.png";
import settingsIcon from "../assets/Enrollment.png";
import timelineIcon from "../assets/Timeline.png";
import followupIcon from "../assets/Profile.png";
import assistantIcon from "../assets/Assistant.png";
import CommunicationIcon from "../assets/Communication Assign.png";
import reportSideIcon from "../assets/Reports .png";
import { FaBook, FaEdit, FaUser, FaWhatsapp } from "react-icons/fa";
import AdmissionEnrollment from "./FrontDesk_Enrollment.tsx";
import WhatsAppConnect from "../shared/WhatsApp.jsx";

// --- INTERFACES ---

interface DescriptionObject {
  staticText?: string;
  boxedText?: string;
  text?: string;
  isBox?: boolean;
}

interface DashboardItem {
  color: string;
  title: string;
  desc: string | DescriptionObject[];
  link: string;
  displayName?: string;
  buttonType?: "OK" | "Schedule";
}

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="campaign-modal-overlay" onClick={onCancel}>
      <div className="campaign-modal confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="campaign-modal-header duplicate-review-header">
          <div className="duplicate-review-header-copy">
            <h4>{title}</h4>
            <p>{message}</p>
          </div>
          <button type="button" className="campaign-modal-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="campaign-modal-footer confirm-dialog-footer">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{ color: "#f36b79", fontSize: 50, flexShrink: 0 }}
          />
          <button type="button" className="btn-solid1" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn-solid1" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
  variant?: "default" | "lead" | "marketing";
  style?: React.CSSProperties;
  className?: string;
}

const DashboardSection = React.memo(
  ({ title, children, variant = "default", style = {}, className = "" }: SectionProps) => {
    const compactVariants = ["lead", "marketing"];
    const containerClass = compactVariants.includes(variant) ? "sectionContainer1" : "sectionContainer";

    return (
      <div className={`${containerClass} ${className}`} style={style}>
        <div className="sectionTitle">{title}</div>
        {children}
      </div>
    );
  }
);

const FrontDeskDashboardFinal: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  // 2. STATE FOR MODAL CONTROL
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [modalKind, setModalKind] = useState<"" | "admission" | "profile" | "communication" | "other">("");
  const [modalTitle, setModalTitle] = useState<string>("");
    const [activeMiniPanel, setActiveMiniPanel] = useState<"timeline" | "followup" | "assistant">("timeline");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 2. STATE FOR MODAL CONTROL

 
  const [admissionRate, setAdmissionRate] = useState<number>(0);
  const [admissionStats, setAdmissionStats] = useState([
    { label: "Walkins", value: 0 },
    { label: "Registered", value: 0 },
    { label: "Enrollments", value: 0 },
    { label: "Paid Admission Fee", value: 0 }
  ]);
  const [sendCounts, setSendCounts] = useState({
    whatsappRemaining: 0,
    emailRemaining: 0,
    totalRemaining: 0,
    fromDate: "",
    toDate: ""
  });
  const [schoolLogo, setSchoolLogo] = useState<string>("/default-logo.png");
const [userInfo, setUserInfo] = useState<any>(null);
const [userDropdownOpen, setUserDropdownOpen] = useState(false);
const [profileEditOpen, setProfileEditOpen] = useState(false);
const [profileForm, setProfileForm] = useState({
  gender: "",
  phone_no: "",
  email: "",
});
const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
const [profileSaveStatus, setProfileSaveStatus] = useState("");
const [profileSaving, setProfileSaving] = useState(false);
const userDropdownRef = useRef<HTMLDivElement | null>(null);
const [qualityPdfOpen, setQualityPdfOpen] = useState(false);
const [qualityPdfLoading, setQualityPdfLoading] = useState(false);
const [qualityPdfError, setQualityPdfError] = useState("");
const [qualityPdfStatus, setQualityPdfStatus] = useState("");
  const [qualityPdfMeta, setQualityPdfMeta] = useState<{
  id: number;
  title: string;
  file_name: string;
  file_path: string;
  file_url: string;
  uploaded_at: string;
} | null>(null);

  const formatBranchName = (schoolCodeValue: string) => {
    if (!schoolCodeValue) return "";
    return schoolCodeValue
      .replace(/_/g, " ")
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const isLikelyDbCode = (value: string) => {
    const text = String(value || "").trim();
    return Boolean(text) && /^[A-Z0-9_]+$/.test(text) && text.includes("_") && !text.includes(" ");
  };

  const [activeSidebar, setActiveSidebar] = useState<"home" | "users" | "staff" | "analytics" | "settings" | "reports">("home");
    const [activeNav, setActiveNav] = useState<"dashboard" | "campaigning" | "admissions" | "reports" | "images">("dashboard");

  const [whatsAppConnected, setWhatsAppConnected] = useState<boolean>(false);
  const [whatsAppConnectedNumber, setWhatsAppConnectedNumber] = useState<string>("");
  const [showWhatsAppScanner, setShowWhatsAppScanner] = useState<boolean>(false);
  const [isWhatsAppResetting, setIsWhatsAppResetting] = useState<boolean>(false);
  const [isReconnectConfirmOpen, setIsReconnectConfirmOpen] = useState<boolean>(false);
  const whatsAppApiBase = import.meta.env.VITE_WHATSAPP_API_BASE || "https://cleezoclass.com:3020";

 

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${whatsAppApiBase}/api/whatsapp/status?schoolCode=${encodeURIComponent(schoolCode)}`);
        const data = await res.json().catch(() => ({}));
        const connectedNumber = String(data?.connectedNumber || data?.number || data?.senderNumber || "").trim();
        const connected = Boolean(
          data?.status === "connected" ||
          data?.ready ||
          data?.hasClient ||
          connectedNumber
        );
        if (!cancelled) {
          setWhatsAppConnected(connected);
          setWhatsAppConnectedNumber(connectedNumber);
          if (connected) {
            setShowWhatsAppScanner(false);
          }
        }
        console.log(
          `[FrontDeskDashboard][WhatsApp] schoolCode=${schoolCode}, connected=${connected}, ready=${Boolean(data?.ready)}, hasClient=${Boolean(data?.hasClient)}, connectedNumber=${connectedNumber || "null"}`
        );
      } catch {
        if (!cancelled) {
          setWhatsAppConnected(false);
          setWhatsAppConnectedNumber("");
        }
        console.log(
          `[FrontDeskDashboard][WhatsApp] schoolCode=${schoolCode}, connected=false, ready=false, hasClient=false, connectedNumber=null`
        );
      }
    };

    check();
    const t = setInterval(check, 180000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [whatsAppApiBase]);

  const openScanner = () => {
    setShowWhatsAppScanner(true);
  };

  const reconnectWhatsApp = async () => {
    if (isWhatsAppResetting) return;
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    setIsWhatsAppResetting(true);
    try {
      const res = await fetch(`${whatsAppApiBase}/api/whatsapp-reset/${encodeURIComponent(schoolCode)}`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok || !body?.success) {
        throw new Error(body?.message || `Reset failed (HTTP ${res.status})`);
      }
      setWhatsAppConnected(false);
      setWhatsAppConnectedNumber("");
      setShowWhatsAppScanner(true);
    } catch (err) {
      console.error("WhatsApp reconnect failed:", err);
    } finally {
      setIsWhatsAppResetting(false);
    }
  };

  const openReconnectConfirm = () => {
    if (isWhatsAppResetting) return;
    setIsReconnectConfirmOpen(true);
  };

  const confirmReconnect = () => {
    setIsReconnectConfirmOpen(false);
    reconnectWhatsApp();
  };

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    fetch(
      `https://cleezoclass.com:4000/api/frontdesk/metrics?schoolCode=${encodeURIComponent(schoolCode)}`
    )
      .then((res) => res.json())
      .then((data) => {
        const totalLeads = Number(data.total_leads || 0);
        const registered = Number(data.registered || 0);
        const paidAdmissions = Number(data.admission_paid || 0);
        const enrollments = Number(data.enrolled || 0);
        const rate = registered > 0 ? Math.round((enrollments / registered) * 100) : 0;
        setAdmissionRate(rate);
        setAdmissionStats([
          { label: "Walkins", value: totalLeads },
          { label: "Registered", value: registered },
          { label: "Enrollments", value: enrollments },
          { label: "Paid Admission Fee", value: paidAdmissions }
        ]);
      })
      .catch((err) => console.error("Metrics fetch failed", err));
  }, []);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    fetch(
      `https://cleezoclass.com:4000/api/frontdesk/send-counts?schoolCode=${encodeURIComponent(schoolCode)}&days=30`
    )
      .then((res) => res.json())
      .then((data) => {
        setSendCounts({
          whatsappRemaining: Number(data.whatsappSentToday ?? data.whatsappRemaining ?? 0),
          emailRemaining: Number(data.emailSentToday ?? data.emailRemaining ?? 0),
          totalRemaining: Number(data.totalSentToday ?? data.totalRemaining ?? 0),
          fromDate: String(data.fromDate || ""),
          toDate: String(data.date || "")
        });
      })
      .catch((err) => console.error("Send counts fetch failed", err));
  }, []);

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
      return `https://cleezoclass.com:4000${photo}`;
    }
    if (/^[A-Za-z0-9+/=]+$/.test(photo) && photo.length > 100) {
      return `data:image/jpeg;base64,${photo}`;
    }
    return "";
  };

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;
    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => {
        setSchoolLogo(data.logo || "/default-logo.png");
      })
      .catch(() => setSchoolLogo("/default-logo.png"));
  }, []);

  useEffect(() => {
    const username = localStorage.getItem("username");
    const schoolCode = localStorage.getItem("schoolCode");
    if (!username || !schoolCode) return;
    fetch(`https://cleezoclass.com:4000/api/api/user-info/${username}?schoolCode=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => {
        setUserInfo({
          ...data,
          photo: normalizeUserPhoto(data?.photo)
        });
      })
      .catch(() => setUserInfo(null));
  }, []);

  useEffect(() => {
    if (!profileEditOpen || !userInfo) return;
    setProfileForm({
      gender: userInfo.gender || "",
      phone_no: userInfo.phone_no || "",
      email: userInfo.email || "",
    });
    setProfilePhotoFile(null);
    setProfilePhotoPreview(userInfo.photo || "");
    setProfileSaveStatus("");
  }, [profileEditOpen, userInfo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const refreshUserInfo = async () => {
    const username = localStorage.getItem("username");
    const schoolCode = localStorage.getItem("schoolCode");
    if (!username || !schoolCode) return;

    try {
      const { data } = await axios.get(
        `https://cleezoclass.com:4000/api/api/user-info/${username}?schoolCode=${encodeURIComponent(schoolCode)}`
      );
      setUserInfo({
        ...data,
        photo: normalizeUserPhoto(data?.photo),
      });
    } catch (error) {
      console.error("Failed to refresh user info", error);
    }
  };

  const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setProfilePhotoFile(file);
    if (file) {
      setProfilePhotoPreview(URL.createObjectURL(file));
    } else {
      setProfilePhotoPreview(userInfo?.photo || "");
    }
  };

  const openProfileEditor = () => {
    setProfileEditOpen(true);
    setProfileSaveStatus("");
  };

  const closeProfileEditor = () => {
    setProfileEditOpen(false);
    setProfilePhotoFile(null);
    setProfilePhotoPreview(userInfo?.photo || "");
    setProfileSaveStatus("");
  };

  const fetchLatestAdmissionProcessPdf = async () => {
    setQualityPdfLoading(true);
    setQualityPdfError("");
    try {
      const { data } = await axios.get(
        "https://cleezoclass.com:4000/api/quality/admission-process/latest"
      );
      setQualityPdfMeta(data?.record || null);
      setQualityPdfStatus(data?.record ? " " : "");
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "No admission process PDF found. Upload a PDF first.";
      setQualityPdfMeta(null);
      setQualityPdfError(message);
      setQualityPdfStatus("");
    } finally {
      setQualityPdfLoading(false);
    }
  };

  const openAdmissionProcessBook = async () => {
    setQualityPdfOpen(true);
    await fetchLatestAdmissionProcessPdf();
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
      if (profilePhotoFile) {
        formData.append("photo", profilePhotoFile);
      }

      const { data } = await axios.put(
        `https://cleezoclass.com:4000/api/profile/users/${userInfo.id}?schoolCode=${encodeURIComponent(schoolCode)}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfileSaveStatus(data?.message || "Profile updated successfully.");
      await refreshUserInfo();
      setProfilePhotoFile(null);
      setProfileEditOpen(false);
    } catch (error: any) {
      setProfileSaveStatus(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile details."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // 3. MODAL HANDLER FUNCTIONS
  const openModal = (componentName: string, title: string) => {
    switch (componentName) {
      case "AdmissionCRM":
        setModalContent(<AdmissionCRM />);
        setModalKind("admission");
        break;
      case "LeadsProfilePage":
        setModalContent(<LeadsProfilePage />);
        setModalKind("profile");
        break;
      case "AccountantParties":
        setModalContent(<AccountantParties />);
        setModalKind("other");
        break;
      case "TestAndCouncelling":
        setModalContent(<TestAndCouncelling />);
        setModalKind("other");
        break;
      case "Communication":
        setModalContent(<Communication />);
        setModalKind("communication");
        break;
          case "AdmissionEnrollment":
        setModalContent(<AdmissionEnrollment />);
        setModalKind("other");
        break;
        
      case "LeadsTable":
        setModalContent(<LeadsTable variant="dashboard" />);
        setModalKind("other");
        break;
      case "WhatsAppConnect":
        setModalContent(<WhatsAppConnect />);
        setModalKind("other");
        break;
      default:
        setModalContent(null);
        setModalKind("");
    }
    setModalTitle(title);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setModalTitle("");
    setModalKind("");
    setActiveSidebar("home");
    setActiveNav("dashboard");
  };

  const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children }) => {
    if (!isOpen) return null;
    const modalClassName =
      modalKind && modalKind !== "admission"
        ? `modalContentStyle frontdesk-dashboard-modal-${modalKind}`
        : "modalContentStyle";

    return (
      <div className="modalOverlayStyle" onClick={onClose}>
        <div className={modalClassName} onClick={e => e.stopPropagation()}>
          <button type="button" className="modalCloseButton1" onClick={onClose} aria-label="Close popup">
            ×
          </button>
          {children}
        </div>
      </div>
    );
  };

  
  // --- DATA ---
  const ActionItems: DashboardItem[] = [
    { color: "#868C8F", title: "Chat Approved", desc: "session no 1024", link: "/BiometricTeacher", buttonType: "Schedule" },
    { color: "#705B56", title: "Festive/Holiday", desc: "Remainder, Greeting", link: "/BiometricTeacher", buttonType: "OK" },
    { color: "#868C8F", title: "Utilities", desc: "Provide Drinking Water", link: "/BiometricTeacher", buttonType: "OK" },
    { color: "#705B56", title: "Staff Syllabus", desc: "Homework Not Assigned", link: "/operations/timetable", buttonType: "OK" },
    { color: "#705B56", title: "Staff-Heads", desc: "Homework Not Assigned", link: "/operations/timetable", buttonType: "OK" },
  ];

  const hrItems: DashboardItem[] = [
    { color: "#D9EEF8", title: "Admission-Report", desc: "Manual, Automated...", link: "AccountantParties", displayName: "Parties Income" },
    { color: "#868C8F", title: "Lead Report", desc: "Lead Details...", link: "AccountantParties" },
    { color: "#A39DBD", title: "Communication History", desc: "Whatsapp history...", link: "AccountantParties" },
  ];
  const accountItems : DashboardItem[] = [
    {
      color: "#D4C7B0",
      title: "Admission-report",
      desc: "Lead source allocation,ticket generation, view plan",
      link: "ExpensesDashboardInline", // Component Name
      displayName: "Expense Management", // Display Name for Modal
    },
    {
      color: "#868C8F",
      title: "Test and Councelling-Report",
      desc: "Test Q.P. verify,Test Report,Counselor Assign & Report",
      link: "ExpensesDashboardInline",
      displayName: "Item Manager",
    },
     {
      color: "#868C8F",
      title: "Communication-Report",
      desc: "Messaging & mails, follow ups, Image Generator, Re-Marketing opt",
      link: "Communication",
      displayName: "Miscellaneous Expenses",
    },
  ];
    const accountItem: DashboardItem[] = [
    {
      color: "#D4C7B0",
      title: "Lead Profile-Report",
      desc: "lead score, Lead Strength report, oneview lead profile",
      link: "ExpensesDashboardInline",
      displayName: "Salary Management",
    },
    {
      color: "#705B56",
      title: "Followups-Report ",
      desc: "conversational calls, Re-Assign ticket, Re-marketing-assign",
      link: "LeadsTable",
      displayName: "Expense Records",
    },
     {
      color: "#705B56",
      title: "Templates crafting",
      desc: "Edit Images,Edit Templates, Create Templates",
      link: "ExpensesDashboardInline",
      displayName: "Expense Records",
    },
  ];
    const marketingItem : DashboardItem[] = [
    {
      color: "#D4C7B0",
      title: "Lead Profile",
      desc: "Lead Score, Lead Strength, one view lead profile",
      link: "LeadsProfilePage",
      displayName: "Income Reports/Complaints",
    },
    {
      color: "#705B56",
      title: "Follow ups ",
      desc: "Conversational, calls, Re-Assign to automated admission",
      link: "LeadsTable",
      displayName: "Income Records",
    },
    {
      color: "#868C8F",
      title: "Teams",
      desc: "FrontOffice,Councellors,sales,Executives,Field Force",
      link: "LeadsProfilePage",
      displayName: "Remainders-Cutoff",
    },

  ];

  const marketingItems: DashboardItem[] = [
    {
      color: "#D4C7B0",
      title: "Admission",
      desc: "Register,Lead submission, Lead source location,Ticket Generation, Enroll forwarding",
      link: "AdmissionCRM",
      displayName: "Fees Management",
    },
    {
      color: "#868C8F",
      title: "Test and Councelling",
      desc: "Assign invigilator, Test Q.P, Test report, Counselor assign,Counseling Report",
      link: "TestAndCouncelling",
      displayName: "Discounts Management",
    },
     {
      color: "#868C8F",
      title: "Communications",
      desc: "Opt messaging, Mails, Followup, Image Generator,Re-marketing Opt",
      link: "Communication",
      displayName: "Other Incomes",
    },
  ];
  // 5. HELPER RENDER FUNCTIONS
const renderCard = (
  title: string,
  items: DashboardItem[],
  homepageRoute: string,
  split: boolean = false,
  customCardClass: string = ""
) => {

  const renderDesc = (desc: string | DescriptionObject[]) => {
    if (Array.isArray(desc)) {
      return (
        <div className="descContainer">
          {desc.map((d, idx) => (
            <React.Fragment key={idx}>
              {d.staticText && <span className="descText">{d.staticText}</span>}
              {d.boxedText && <span className="descBox">{d.boxedText}</span>}
              {d.text && (
                <span className={d.isBox ? "descBox" : "descText"}>{d.text}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    }
    return desc;
  };

  const handleItemClick = (i: DashboardItem) => {
    const modalComponents = ["AdmissionCRM", "LeadsProfilePage", "AccountantParties", "TestAndCouncelling", "Communication", "LeadsTable"];
    if (modalComponents.includes(i.link)) {
      openModal(i.link, i.displayName || i.title);
    } else {
      navigate(i.link);
    }
  };

  const renderItemContent = (i: DashboardItem) => (
    <div className={`dashboard-item ${isMobile ? "mobile" : ""}`} key={i.title} onClick={() => handleItemClick(i)}>
      <div className="dashboard-item-left">
        {items === ActionItems ? (
          <FontAwesomeIcon icon={faAngleRight} className="dashboard-item-icon" />
        ) : (
          <div className="dashboard-item-circle" style={{ backgroundColor: i.color }}></div>
        )}
        <div className="dashboard-item-text">
          <div className="dashboard-item-title">{i.title}</div>
          <div className="dashboard-item-desc">{renderDesc(i.desc)}</div>
        </div>
      </div>

      {items === ActionItems && i.buttonType && (
        <button className={`dashboard-item-button ${i.buttonType === "OK" ? "ok" : "cancel"}`} onClick={e => { e.stopPropagation(); alert(`${i.buttonType} clicked for ${i.title}`); }}>
          {i.buttonType}
        </button>
      )}
    </div>
  );

  if (split) {
    return <div className="itemListContainer">{items.map(renderItemContent)}</div>;
  }

  return <div className={`card ${customCardClass}`}>{items.map(renderItemContent)}</div>;
};

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    // Hard replace prevents reopening protected dashboard via forward history.
    window.location.replace(import.meta.env.BASE_URL || "/");
  };
interface Teacher {
  teacher_id: string | number;
  teacher_name: string;
  phone_no: string;
  subject?: string;
  designation?: string;
  photo?: any;
  profile_photo?: any;
  user_photo?: any;
}

interface Student {
  id: string | number;
  name?: string;
  photo?: { data?: any };
}

interface Ticket {
  id: number;
  ticket_type: "teacher" | "student";
  teacher_id?: string | number | null;
  teacher_name?: string | null;
  student_id?: string | number | null;
  student_name?: string | null;
  class_name?: string | null;
  section?: string | null;
  title: string;
  description: string;
  status: "open" | "closed";
  created_at: string;
}

interface Lead {
  id: string | number;
  full_name: string;
  mobile_number: string;
  email_id?: string;
  lead_admission_for?: string;
  date: string;
  lead_time: string;
  entry_type?: string;
  reg_no?: string | number;
  city?: string;
  area?: string;
  code?: string;
  from_date?: string;
  to_date?: string;
  assign_time?: string;
  sourceType?: "teacher" | "campaign";
  sourceLabel?: string;
}

interface ChannelOption {
  value: string;
  label: string;
}

const API_BASE = "https://cleezoclass.com:4000/api/admin";

const bufferToPathString = (bufferData: any) => {
  if (!bufferData) return "";
  try {
    const bytes = new Uint8Array(bufferData);
    let pathString = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      pathString += String.fromCharCode(bytes[i]);
    }
    return pathString.trim().replace(/\u0000/g, "");
  } catch {
    return "";
  }
};

const getStudentPhotoSrc = (student?: Student) => {
  const rawPhoto = student?.photo;
  if (!rawPhoto) return "";
  if (typeof rawPhoto === "string") return normalizeUserPhoto(rawPhoto);
  if (rawPhoto?.data) {
    const path = bufferToPathString(rawPhoto.data);
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `https://cleezoclass.com:4000${path.startsWith("/") ? path : `/${path}`}`;
  }
  return normalizeUserPhoto(rawPhoto);
};

const getTeacherPhotoSrc = (teacher?: Teacher) => {
  if (!teacher) return "";
  const possiblePhoto =
    teacher.photo ??
    teacher.profile_photo ??
    teacher.user_photo;

  if (!possiblePhoto) return "";
  if (typeof possiblePhoto === "string") return normalizeUserPhoto(possiblePhoto);
  if (possiblePhoto?.data) {
    const path = bufferToPathString(possiblePhoto.data);
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `https://cleezoclass.com:4000${path.startsWith("/") ? path : `/${path}`}`;
  }
  return normalizeUserPhoto(possiblePhoto);
};

const normalizeStudentList = (payload: any) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.students)
      ? payload.students
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

  return list
    .map((student: any, index: number) => ({
      ...student,
      id: student?.id ?? student?.student_id ?? student?.studentId ?? index,
      name: student?.name ?? student?.student_name ?? student?.full_name ?? `Student ${index + 1}`,
    }))
    .filter((student: any) => student.id != null);
};

const getAdmissionTheme = (rate: number) => {
  const value = Number.isFinite(rate) ? Math.max(0, Math.min(100, rate)) : 0;

  if (value === 0) return { accent: "#efefef", soft: "rgba(239, 239, 239, 0.45)" };
  const hue = Math.round((value / 100) * 120); // 0=red, 120=green
  return {
    accent: `hsl(${hue}, 78%, 48%)`,
    soft: `hsla(${hue}, 78%, 48%, 0.22)`,
  };
};

const CommunicationAssignSection: React.FC<{
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead | null) => void;
  onAddClick?: () => void;
  onSendQrAll?: () => void;
  onRefreshLeads?: () => void | Promise<void>;
  sendingQrAll?: boolean;
}> = ({ leads, selectedLead, onSelectLead, onAddClick, onSendQrAll, onRefreshLeads, sendingQrAll = false }) => {
  const [commDate, setCommDate] = useState<string>("");
  const [commTime, setCommTime] = useState<string>("");
  const [channels, setChannels] = useState<string[]>([]);
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [actionPopupVisible, setActionPopupVisible] = useState<boolean>(false);
  const [actionPopupMode, setActionPopupMode] = useState<"add" | "delete">("add");
  const [actionStatus, setActionStatus] = useState("");
  const [actionError, setActionError] = useState("");
  const [editingLeadId, setEditingLeadId] = useState<string | number | null>(null);
  const [addForm, setAddForm] = useState({
    full_name: "",
    mobile_number: "",
    email_id: "",
    city: "",
    area: "",
    code: "",
    from_date: "",
    to_date: "",
    assign_time: "",
  });
  const popupRef = useRef<HTMLDivElement>(null);
  const actionPopupRef = useRef<HTMLDivElement>(null);
  const leadClickTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const createEmptyAddForm = () => ({
    full_name: "",
    mobile_number: "",
    email_id: "",
    city: "",
    area: "",
    code: "",
    from_date: "",
    to_date: "",
    assign_time: "",
  });
  const openActionPopupForLead = (lead: Lead) => {
    console.debug("[CampaigningDashboard] openActionPopupForLead", {
      leadId: lead?.id ?? null,
      leadName: lead?.full_name ?? null,
      sourceType: lead?.sourceType ?? null,
    });
    setActionPopupMode("add");
    setActionPopupVisible(true);
    setEditingLeadId(lead.id);
    setActionError("");
    setActionStatus("");
    setAddForm({
      full_name: lead.full_name || "",
      mobile_number: lead.mobile_number || "",
      email_id: lead.email_id || "",
      city: lead.city || "",
      area: lead.area || "",
      code: lead.code || "",
      from_date: lead.from_date || "",
      to_date: lead.to_date || "",
      assign_time: lead.assign_time || "",
    });
  };
  const getLeadKey = (lead?: Lead | null) => {
    if (!lead) return "";
    return `${lead.sourceType || "teacher"}-${lead.id}`;
  };
  const selectedLeadKey = getLeadKey(selectedLead);

  const channelOptions: ChannelOption[] = [
    { value: "Facebook", label: "facebook" },
    { value: "WhatsApp", label: "Whatsapp" },
    { value: "Mail", label: "Gmail" },
    { value: "All", label: "All" },
  ];

  const handleRegister = () => {
    try {
      const missingFields = [];
      if (!commDate) missingFields.push("communication date");
      if (!commTime) missingFields.push("communication time");
      if (channels.length === 0) missingFields.push("at least one communication channel");
      if (!selectedLead) missingFields.push("a lead");

      if (missingFields.length > 0) {
        setErrorMsg(`Kindly select ${missingFields.join(", ")} to proceed.`);
        return;
      }

      const schoolCode = localStorage.getItem("schoolCode");
      const schedule: any[] = [];
      const startDate = new Date(commDate + "T" + commTime);

      for (let i = 0; i < 30; i++) {
        const sendDate = new Date(startDate);
        sendDate.setDate(startDate.getDate() + i);
        schedule.push({
          leadId: selectedLead.id,
          leadName: selectedLead.full_name,
          phone: selectedLead.mobile_number,
          email: selectedLead.email_id,
          date: sendDate.toISOString().split("T")[0],
          time: sendDate.toTimeString().split(" ")[0],
          channels,
          message: "Your daily advertisement",
          schoolCode,
        });
      }

      axios
        .post(`https://cleezoclass.com:4000/api/schedule-messages`, { schedule, schoolCode })
        .then(() => {
          setErrorMsg("Communication has been successfully scheduled for the next 30 days.");
          setPopupVisible(false);
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg("Unable to schedule messages at this moment. Kindly try again later.");
        });
    } catch (error) {
      console.error(error);
      setErrorMsg("Something went wrong while scheduling communication. Please try again.");
    }
  };

  const resetActionPopup = () => {
    setActionPopupVisible(false);
    setActionPopupMode("add");
    setActionStatus("");
    setActionError("");
    setEditingLeadId(null);
    setAddForm(createEmptyAddForm());
    onSelectLead(null);
  };

  const handleLeadCardClick = (lead: Lead) => {
    console.debug("[CampaigningDashboard] handleLeadCardClick:start", {
      clickedLeadId: lead?.id ?? null,
      clickedLeadName: lead?.full_name ?? null,
      selectedLeadId: selectedLead?.id ?? null,
      actionPopupVisible,
      editingLeadId,
    });

    if (leadClickTimerRef.current) {
      window.clearTimeout(leadClickTimerRef.current);
      leadClickTimerRef.current = null;
    }

    onSelectLead(lead);
    setPopupVisible(false);
    openActionPopupForLead(lead);

    console.debug("[CampaigningDashboard] handleLeadCardClick:end", {
      clickedLeadId: lead?.id ?? null,
      selectedLeadIdAfter: lead?.id ?? null,
    });
  };

  const loadLeadIntoForm = (lead: Lead | null) => {
    if (!lead) {
      setActionError("Select a previous user from the grid first.");
      return;
    }

    setActionError("");
    setActionStatus("Previous details loaded.");
    setActionPopupMode("add");
    setEditingLeadId(lead.id);
    setAddForm({
      full_name: lead.full_name || "",
      mobile_number: lead.mobile_number || "",
      email_id: lead.email_id || "",
      city: lead.city || "",
      area: lead.area || "",
      code: lead.code || "",
      from_date: lead.from_date || "",
      to_date: lead.to_date || "",
      assign_time: lead.assign_time || "",
    });
  };


  const handleAddUser = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
      setActionError("School code is missing.");
      return;
    }
    const fullName = addForm.full_name.trim();
    const mobile = addForm.mobile_number.trim();
    if (!fullName || !mobile) {
      setActionError("Please fill name and mobile.");
      return;
    }

    try {
      setActionError("");
      setActionStatus(editingLeadId ? "Updating staff..." : "Adding staff...");
      const payload = {
        schoolCode,
        full_name: fullName,
        mobile_number: mobile,
        email_id: addForm.email_id.trim(),
        city: addForm.city.trim(),
        area: addForm.area.trim(),
        code: addForm.code.trim(),
        from_date: addForm.from_date.trim(),
        to_date: addForm.to_date.trim(),
        assign_time: addForm.assign_time.trim(),
      };

      const { data } = editingLeadId
        ? selectedLead?.sourceType === "teacher"
          ? await axios.put(
              `https://cleezoclass.com:4000/api/users/${editingLeadId}?schoolCode=${encodeURIComponent(schoolCode)}`,
              {
                schoolCode,
                name: fullName,
                phone_no: mobile,
                email: addForm.email_id.trim(),
                city: addForm.city.trim(),
                area: addForm.area.trim(),
                code: addForm.code.trim(),
                from_date: addForm.from_date.trim(),
                to_date: addForm.to_date.trim(),
                assign_time: addForm.assign_time.trim(),
              }
            )
          : await axios.put(
              `https://cleezoclass.com:4000/api/lead-staff/${editingLeadId}?schoolCode=${encodeURIComponent(schoolCode)}`,
              payload
            )
        : await axios.post("https://cleezoclass.com:4000/api/lead-staff", payload);

      const playStoreLink = "https://play.google.com/store/apps/details?id=com.cleezoclass&pcampaignid=web_share";
      const createdUsername = data?.data?.username || "";
      const createdPassword = data?.data?.password || "";
      const returnedPlayStoreLink = data?.data?.play_store_link || playStoreLink;
      setActionStatus(
        editingLeadId
          ? "Staff updated successfully."
          : data?.data?.qr_sent
            ? `Staff added successfully.\nUsername: ${createdUsername}\nPassword: ${createdPassword}\nPlay Store: ${returnedPlayStoreLink}`
            : data?.data?.qr_error
              ? `Staff added, but invite message could not be sent.\nUsername: ${createdUsername}\nPassword: ${createdPassword}\nPlay Store: ${returnedPlayStoreLink}\nError: ${data.data.qr_error}`
              : `Staff added successfully.\nUsername: ${createdUsername}\nPassword: ${createdPassword}\nPlay Store: ${returnedPlayStoreLink}`
      );
      if (data?.data?.id) {
        setEditingLeadId(data.data.id);
        onSelectLead({
          ...(selectedLead || {}),
          id: data.data.id,
          full_name: data.data.full_name || fullName,
          mobile_number: data.data.mobile_number || mobile,
          email_id: data.data.email_id || addForm.email_id.trim(),
          city: data.data.city || addForm.city.trim(),
          area: data.data.area || addForm.area.trim(),
          code: data.data.code || addForm.code.trim(),
          from_date: data.data.from_date || addForm.from_date.trim(),
          to_date: data.data.to_date || addForm.to_date.trim(),
          assign_time: data.data.assign_time || addForm.assign_time.trim(),
          sourceType: "campaign",
          sourceLabel: "Campaign Staff",
        } as Lead);
      } else if (selectedLead?.sourceType === "teacher") {
        onSelectLead({
          ...(selectedLead || {}),
          id: editingLeadId,
          full_name: fullName,
          mobile_number: mobile,
          email_id: addForm.email_id.trim(),
          city: addForm.city.trim(),
          area: addForm.area.trim(),
          code: addForm.code.trim(),
          from_date: addForm.from_date.trim(),
          to_date: addForm.to_date.trim(),
          assign_time: addForm.assign_time.trim(),
          sourceType: "teacher",
          sourceLabel: "Teacher",
        } as Lead);
      }
      await onRefreshLeads?.();
    } catch (err: any) {
      setActionStatus("");
      console.error("[CampaigningDashboard] handleAddUser failed", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      setActionError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.response?.data?.details ||
          err?.message ||
          "Failed to add user."
      );
    }
  };

  const handleSaveRouteDetails = async () => {
    if (!editingLeadId) {
      setActionError("Save the staff first, then route details.");
      return;
    }
    await handleAddUser();
  };

  const handleDeleteUser = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
      setActionError("School code is missing.");
      return;
    }
    if (!selectedLead) {
      setActionError("Select a user first.");
      return;
    }
    if (!window.confirm(`Delete ${selectedLead.full_name}?`)) return;

    try {
      setActionError("");
      setActionStatus("Deleting staff...");
      const deleteUrl =
      selectedLead.sourceType === "campaign"
        ? `https://cleezoclass.com:4000/api/lead-staff/${selectedLead.id}`
        : `https://cleezoclass.com:4000/api/users/${selectedLead.id}`;
      const deleteConfig: any =
        selectedLead.sourceType === "campaign"
          ? { params: { schoolCode } }
          : { params: { schoolCode }, data: { schoolCode } };

      await axios.delete(deleteUrl, deleteConfig);
      setActionStatus("Staff deleted successfully.");
      await onRefreshLeads?.();
      setTimeout(() => {
        resetActionPopup();
      }, 700);
    } catch (err: any) {
      console.error("[CampaigningDashboard] handleDeleteUser failed", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      setActionStatus("");
      setActionError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.response?.data?.details ||
          err?.message ||
          "Failed to delete user."
      );
    }
  };

  const openEditorFromPlus = () => {
    setActionPopupMode("add");
    setActionPopupVisible(true);
    setEditingLeadId(null);
    setActionError("");
    setActionStatus("");
    setSelectedLead(null);
    setPopupVisible(false);
    setAddForm(createEmptyAddForm());
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        console.debug("[CampaigningDashboard] closing comm popup from outside click");
        setPopupVisible(false);
        onSelectLead(null);
      }
      if (actionPopupRef.current && !actionPopupRef.current.contains(event.target as Node)) {
        console.debug("[CampaigningDashboard] closing action popup from outside click");
        resetActionPopup();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (leadClickTimerRef.current) {
        window.clearTimeout(leadClickTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedLead) return;
    console.debug("[CampaigningDashboard] selectedLead effect", {
      selectedLeadId: selectedLead.id ?? null,
      selectedLeadName: selectedLead.full_name ?? null,
    });
    openActionPopupForLead(selectedLead);
  }, [selectedLead?.id]);

  return (
    <div className="co-section-container">
      <div className="co-wrapper">
        <div className="co-filter-row">
          <div className="Heading">Campaigning</div>
          <button
            type="button"
            title="Send Play Store app install link to all teachers in WhatsApp"
            aria-label="Send Play Store app install link to all teachers in WhatsApp"
            disabled={sendingQrAll}
            style={{
              marginLeft: 10,
              border: "1px solid #e9a0a5",
              borderRadius: 999,
              background: sendingQrAll ? "#e5e7eb" : "#f8d0d3ff",
              padding: "6px 10px",
              cursor: sendingQrAll ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: sendingQrAll ? "#6b7280" : "#fff",
            }}
            onClick={onSendQrAll}
          >
            <FaWhatsapp size={14} color="#25D366" />
            {sendingQrAll ? "Sending..." : "Send App Link To All"}
          </button>
        </div>

        <div className="Campaigning-lead-grid">
          <button
            className="campaign-plus"
            onClick={(e) => {
              e.stopPropagation();
              openEditorFromPlus();
            }}
            aria-label="Add Campaign"
            type="button"
          >
            +
          </button>
          {(Array.isArray(leads) ? leads : []).map((lead) => (
            <div
              key={getLeadKey(lead)}
              onClick={(e) => {
                e.stopPropagation();
                handleLeadCardClick(lead);
              }}
              className="Campaigning-lead-card"
            >
              <div
              className="tc-teacherAvatar"
              style={{
                background: selectedLeadKey === getLeadKey(lead) ? "#f6a5ab" : "#f1f2f4"
              }}
>
  <FaUser className="header-profile-avatar-fallback" />
              </div>
              <div className="blockText">{lead.full_name}</div>
              <div className="normalText">
                {lead.sourceLabel || (lead.sourceType === "campaign" ? "Campaign Staff" : "Teacher")}
              </div>
            </div>
          ))}
        </div>
      </div>
      {actionPopupVisible && (
        <div className="campaign-modal-overlay" onClick={resetActionPopup}>
                   <div
            ref={actionPopupRef}
            className="campaign-modal campaign-route-modal"
            onClick={(e) => e.stopPropagation()}
          >

                        <div className="campaign-modal-header campaign-modal-header-inline">
              <h4 className="campaign-route-title">
                {editingLeadId ? "Edit Staff/Route" : "Add Staff/Route"}
              </h4>

              <button
                type="button"
                className="campaign-route-delete-btn"
                onClick={() => setActionPopupMode("delete")}
              >
                Delete
              </button>

              <button
                type="button"
                className="campaign-modal-close"
                onClick={resetActionPopup}
              >
                ×
              </button>
            </div>
            <div className="campaign-modal-body campaign-route-body">


                           {actionPopupMode === "add" ? (
                <div className="campaign-route-layout">
                  <div className="campaign-route-divider" />

                  <div className="campaign-route-section">
                    <div className="campaign-route-section-label">Staff</div>

                    <div className="campaign-modal-row4">
                      <div className="campaign-modal-field">
                        <input
                          type="text"
                          value={addForm.full_name}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Name"
                        />
                      </div>

                      <div className="campaign-modal-field">
                        <input
                          type="text"
                          value={addForm.email_id}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, email_id: e.target.value }))}
                          placeholder="Designation"
                        />
                      </div>

                      <div className="campaign-modal-field">
                        <input
                          type="text"
                          value={addForm.mobile_number}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, mobile_number: e.target.value }))}
                          placeholder="Mobile"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-solid campaign-modal-add-btn"
                        onClick={handleAddUser}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="campaign-route-section">
                    <div className="campaign-route-section-label">Route</div>

                    <div className="campaign-modal-row3 campaign-modal-row3-compact">
                      <div className="campaign-modal-field">
                        <input
                          type="text"
                          value={addForm.city}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="City/Town"
                        />
                      </div>

                      <div className="campaign-modal-field">
                        <input
                          type="text"
                          value={addForm.area}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, area: e.target.value }))}
                          placeholder="Area/Route"
                        />
                      </div>

                      <div className="campaign-modal-field">
                        <input
                          type="text"
                          value={addForm.code}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, code: e.target.value }))}
                          placeholder="Rt. Code"
                        />
                      </div>
                    </div>

                    <div className="campaign-modal-row4">
                      <div className="campaign-modal-field">
                        <input
                          type="date"
                          value={addForm.from_date}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, from_date: e.target.value }))}
                        />
                      </div>

                      <div className="campaign-modal-field">
                        <input
                          type="date"
                          value={addForm.to_date}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, to_date: e.target.value }))}
                        />
                      </div>

                      <div className="campaign-modal-field">
                        <input
                          type="time"
                          value={addForm.assign_time}
                          onChange={(e) => setAddForm((prev) => ({ ...prev, assign_time: e.target.value }))}
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-solid campaign-modal-add-btn"
                        onClick={handleSaveRouteDetails}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                </div>

              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <div className="campaign-modal-field">
                    <label>Selected User</label>
                    <input
                      type="text"
                      value={selectedLead ? `${selectedLead.full_name} - ${selectedLead.mobile_number}` : ""}
                      readOnly
                      placeholder="Select a user from the grid"
                    />
                  </div>
                  <div className="campaign-modal-action-row">
                    <button type="button" className="btn-solid1" onClick={handleDeleteUser}>
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {actionStatus && <div className="campaign-modal-success" style={{ whiteSpace: "pre-line" }}>{actionStatus}</div>}
              {actionError && <div className="campaign-modal-error">{actionError}</div>}
            </div>
          </div>
        </div>
      )}
      <ErrorPopup message={errorMsg} onClose={() => setErrorMsg("")} />

      {selectedLead && popupVisible && (
        <div ref={popupRef} className="co-popup">
          <div className="co-popup-title">Communications</div>
          <div className="co-popup-datetime">
            <input
              type="date"
              value={commDate}
              onChange={(e) => setCommDate(e.target.value)}
              className="co-popup-input"
            />
            <input
              type="time"
              value={commTime}
              onChange={(e) => setCommTime(e.target.value)}
              className="co-popup-input"
            />
          </div>
          <div className="co-popup-channel">
            <div className="co-popup-input">
              <Select
                isMulti
                options={channelOptions}
                onChange={(selected: MultiValue<ChannelOption>) =>
                  setChannels(selected.map((s) => s.value))
                }
              />
            </div>
            <button onClick={handleRegister} className="co-popup-btn">
              Register
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


  const [activeTab, setActiveTab] = useState<"staff" | "students">("staff");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const schoolCodeRaw = localStorage.getItem("schoolCode") || "";
  const schoolCode =
    schoolCodeRaw &&
    schoolCodeRaw.toLowerCase() !== "null" &&
    schoolCodeRaw.toLowerCase() !== "undefined"
      ? schoolCodeRaw
      : "";

  useEffect(() => {
    if (!schoolCode) {
      setLeads([]);
      return;
    }
    fetch(`https://cleezoclass.com:4000/api/frontdesk/campaign-status?schoolCode=${encodeURIComponent(schoolCode)}&limit=200`)
      .then((res) => res.json())
      .then((data) => {
        const normalizedLeads = Array.isArray(data)
          ? data
          : Array.isArray(data?.rows)
            ? data.rows
          : Array.isArray(data?.leads)
            ? data.leads
            : Array.isArray(data?.data)
              ? data.data
              : [];
        setLeads(normalizedLeads);
      })
      .catch((err) => {
        console.error("Fetch Error:", err);
        setLeads([]);
      });
  }, [schoolCode]);

  const fetchCampaignLeads = async () => {
    if (!schoolCode) {
      setLeadStaff([]);
      return;
    }
    try {
      const res = await fetch(
        `https://cleezoclass.com:4000/api/lead-staff?schoolCode=${encodeURIComponent(schoolCode)}`
      );
      const data = await res.json();
      const normalizedLeads = Array.isArray(data)
        ? data
        : Array.isArray(data?.leads)
          ? data.leads
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setLeadStaff(
        normalizedLeads.map((lead: any) => ({
          ...lead,
          sourceType: "campaign" as const,
          sourceLabel: "Campaign Staff",
        }))
      );
    } catch (err) {
      console.error("Fetch Error:", err);
      setLeadStaff([]);
    }
  };

  useEffect(() => {
    fetchCampaignLeads();
  }, [schoolCode]);

  // --- Staff tab state ---
  const [leadStaff, setLeadStaff] = useState<Lead[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | number | null>(null);

  // --- Students tab state ---
  const [classList, setClassList] = useState<any[]>([]);
  const [sectionMap, setSectionMap] = useState<any[]>([]);
  const [selectedClassSection, setSelectedClassSection] = useState<string>("");
  const [className, setClassName] = useState<string>("");
  const [section, setSection] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketTarget, setTicketTarget] = useState<{
    type: "teacher" | "student";
    teacher?: Teacher;
    student?: Student;
  } | null>(null);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState("");
  const [ticketError, setTicketError] = useState("");
  const [admissionReportOpen, setAdmissionReportOpen] = useState(false);
  const admissionTheme = useMemo(() => getAdmissionTheme(admissionRate), [admissionRate]);
  const admissionProgressStyle = useMemo(
    () => {
      const progressAngle = `${Math.max(0, Math.min(360, (admissionRate / 100) * 360))}deg`;
      return ({
        "--admission-accent": admissionTheme.accent,
        "--admission-backdrop": `linear-gradient(100deg, ${admissionTheme.soft}, rgba(255, 255, 255, 0.35))`,
        "--admission-progress": progressAngle,
        "--progress-angle": progressAngle,
        "--dashboard-accent": admissionTheme.accent,
      }) as React.CSSProperties & Record<string, string>;
    },
    [admissionTheme, admissionRate]
  );
  const safeLeads = useMemo(() => {
    const leadRows = Array.isArray(leads) ? leads : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 29);

    const inLastMonth = leadRows.filter((lead) => {
      const rawDate = String(lead?.date || "").trim();
      if (!rawDate) return false;
      const dateOnly = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;
      const parsedDate = new Date(`${dateOnly}T00:00:00`);
      if (Number.isNaN(parsedDate.getTime())) return false;
      return parsedDate >= fromDate && parsedDate <= today;
    });

    return inLastMonth.sort((a, b) => {
      const aTs = new Date(`${String(a?.date || "").split("T")[0]}T${a?.lead_time || "00:00:00"}`).getTime();
      const bTs = new Date(`${String(b?.date || "").split("T")[0]}T${b?.lead_time || "00:00:00"}`).getTime();
      return bTs - aTs;
    });
  }, [leads]);

  const campaignStatusRangeLabel = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return `${from.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} - ${to.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }, []);
  const [campaignQrMsg, setCampaignQrMsg] = useState("");
  const [sendingCampaignQrAll, setSendingCampaignQrAll] = useState(false);

  const normalizeTeacherWhatsapp = (value?: string) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 10) return `91${digits}`;
    if (digits.length >= 11 && digits.length <= 15) return digits;
    return "";
  };

  const sendAdmissionQrFromDashboard = async () => {
    if (!schoolCode) {
      setCampaignQrMsg("School code is missing. Please login again.");
      return;
    }

    const validTeachers = teachers.filter((teacher) =>
      Boolean(normalizeTeacherWhatsapp(teacher?.phone_no))
    );
    if (!validTeachers.length) {
      setCampaignQrMsg("No valid WhatsApp numbers found for teachers.");
      return;
    }

    try {
      setSendingCampaignQrAll(true);
      const { data } = await axios.post(
        "https://cleezoclass.com:4000/api/campaigning/send-admission-qr-teachers",
        {
          schoolCode,
          teachers: validTeachers.map((teacher) => ({
            teacher_id: teacher.teacher_id,
            teacher_name: teacher.teacher_name,
            phone_no: teacher.phone_no,
          })),
        }
      );

      const sentCount = Number(data?.sent || 0);
      const failedCount = Number(data?.failed || 0);
      setCampaignQrMsg(
        failedCount > 0
          ? `App install link sent to ${sentCount} teacher(s). Failed: ${failedCount}.`
          : `App install link sent to ${sentCount} teacher(s) successfully.`
      );
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to send app install link in WhatsApp.";
      setCampaignQrMsg(message);
    } finally {
      setSendingCampaignQrAll(false);
    }
  };

  const fetchAllTeachers = async () => {
    if (!schoolCode) return;
    setLoadingTeachers(true);
    try {
      const res = await axios.post("https://cleezoclass.com:4000/api/users", {
        schoolCode,
        user_type: "teacher",
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setTeachers(
        data.map((teacher: any) => ({
          ...teacher,
          sourceType: "teacher" as const,
          sourceLabel: "Teacher",
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

  const refreshCampaignUsers = async () => {
    await Promise.all([fetchCampaignLeads(), fetchAllTeachers()]);
  };

  const fetchMetadata = async () => {
    if (!schoolCode) return;
    setDropdownLoading(true);
    try {
      const [classRes, sectionRes] = await Promise.all([
        axios.get(`${API_BASE}/classes?schoolCode=${schoolCode}`),
        axios.get(`${API_BASE}/sectionFilter?schoolCode=${schoolCode}`),
      ]);

      const classesFromAPI = Array.isArray(classRes.data)
        ? classRes.data
        : classRes.data?.classes ||
          classRes.data?.classList ||
          classRes.data?.data ||
          classRes.data?.result ||
          [];
      const sectionsFromAPI = Array.isArray(sectionRes.data)
        ? sectionRes.data
        : sectionRes.data?.sections ||
          sectionRes.data?.sectionList ||
          sectionRes.data?.data ||
          sectionRes.data?.result ||
          [];

      setClassList(classesFromAPI);
      setSectionMap(sectionsFromAPI);
    } catch (err) {
      console.error("Error loading class/section metadata", err);
      setClassList([]);
      setSectionMap([]);
    } finally {
      setDropdownLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, [schoolCode]);

  useEffect(() => {
    if (!selectedClassSection) {
      setClassName("");
      setSection("");
      return;
    }
    const [cls, sec] = selectedClassSection.split("_");
    setClassName(cls || "");
    setSection(sec || "");
  }, [selectedClassSection]);

  useEffect(() => {
    if (!className || !section || !schoolCode) {
      setStudents([]);
      return;
    }

    axios
      .get(
        `https://cleezoclass.com:4000/api/studentsNameAccountant/${className}?schoolCode=${schoolCode}&section=${section}`
      )
      .then((res) => {
        setStudents(normalizeStudentList(res.data));
      })
      .catch(() => {
        setStudents([]);
      });
  }, [className, section, schoolCode]);

  const fetchTickets = async () => {
    if (!schoolCode) return;
    setLoadingTickets(true);
    try {
      const params = new URLSearchParams();
      params.set("schoolCode", schoolCode);
      if (activeTab === "staff") params.set("type", "teacher");
      if (activeTab === "students") params.set("type", "student");
      if (className) params.set("className", className);
      if (section) params.set("section", section);
      const res = await axios.get(
        `https://cleezoclass.com:4000/api/tickets?${params.toString()}`
      );
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading tickets", err);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [activeTab, className, section, schoolCode]);

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) =>
      student.name?.toLowerCase().includes(term) ||
      student.student_name?.toLowerCase?.().includes(term) ||
      String(student.id).includes(term) ||
      String(student.student_id || "").includes(term)
    );
  }, [students, searchTerm]);

  const studentRows = useMemo(() => {
    const rows: Student[][] = [];
    for (let i = 0; i < filteredStudents.length; i += 6) {
      rows.push(filteredStudents.slice(i, i + 6));
    }
    return rows;
  }, [filteredStudents]);

  const getClassLabel = (cls: any) => {
    if (cls == null) return "";

    if (typeof cls === "string" || typeof cls === "number") return String(cls);
    return (
      cls.class_name ||
      cls.className ||
      cls.class ||
      cls.name ||
      cls.label ||
      ""
    );
  };

  const derivedClasses = useMemo(() => {
    if (classList.length > 0) return classList;
    const classSet = new Set<string>();
    sectionMap.forEach((item: any) => {
      const classValue = item?.class_name || item?.class || item?.className;
      if (classValue != null) classSet.add(String(classValue));
    });
    return Array.from(classSet);
  }, [classList, sectionMap]);

  const getTeacherId = (
    teacher: Teacher & Record<string, any>,
    index: number
  ) =>
    teacher.teacher_id ??
    teacher.id ??
    teacher.user_id ??
    teacher.staff_id ??
    teacher.employee_id ??
    teacher.emp_id ??
    teacher.teacherId ??
    teacher.teacherID ??
    `staff-${index}`;

  const getTeacherName = (teacher: Teacher & Record<string, any>) =>
    teacher.teacher_name ?? teacher.name ?? teacher.full_name ?? "Staff";

  const TICKETS_ITEMS_PER_ROW = 6;
  const teacherRows: Teacher[][] = [];
  for (let i = 0; i < teachers.length; i += TICKETS_ITEMS_PER_ROW) {
    teacherRows.push(teachers.slice(i, i + TICKETS_ITEMS_PER_ROW));
  }

  const campaigningStaffLeads = useMemo<Lead[]>(
    () => {
      const merged = [...leadStaff, ...teachers].map((entry: any, index) => ({
        id: entry.id ?? entry.teacher_id ?? `campaign-${index}`,
        full_name: entry.full_name || entry.teacher_name || entry.name || "Staff",
        mobile_number: entry.mobile_number || entry.phone_no || "",
        email_id: entry.email_id || entry.email || "",
        date: entry.created_at || entry.date || new Date().toISOString(),
        lead_time: entry.lead_time || "00:00:00",
        city: entry.city || "",
        area: entry.area || "",
        code: entry.code || "",
        from_date: entry.from_date || "",
        to_date: entry.to_date || "",
        assign_time: entry.assign_time || "",
        sourceType: entry.sourceType || (entry.mobile_number ? "campaign" : "teacher"),
        sourceLabel: entry.sourceLabel || (entry.mobile_number ? "Campaign Staff" : "Teacher"),
      }));

      const normalizedKey = (lead: Lead) => {
        const mobile = String(lead.mobile_number || "").trim();
        const email = String(lead.email_id || "").trim().toLowerCase();
        const name = String(lead.full_name || "").trim().toLowerCase();
        return mobile || email || name || String(lead.id ?? "");
      };

      const deduped = new Map<string, Lead>();
      merged.forEach((lead) => {
        const key = normalizedKey(lead);
        const existing = deduped.get(key);
        if (!existing) {
          deduped.set(key, lead);
          return;
        }

        const existingIsCampaign = existing.sourceType === "campaign";
        const currentIsCampaign = lead.sourceType === "campaign";

        if (!existingIsCampaign && currentIsCampaign) {
          deduped.set(key, lead);
          return;
        }

        if (!existing.mobile_number && lead.mobile_number) {
          deduped.set(key, { ...existing, mobile_number: lead.mobile_number });
        }
      });

      return Array.from(deduped.values());
    },
    [leadStaff, teachers]
  );

  const openTicketModal = (payload: {
    type: "teacher" | "student";
    teacher?: Teacher;
    student?: Student;
  }) => {
    setTicketTarget(payload);
    setTicketTitle("");
    setTicketDescription("");
    setTicketSuccess("");
    setTicketError("");
    setShowTicketModal(true);
  };

  const closeTicketModal = () => {
    setShowTicketModal(false);
    setTicketTarget(null);
    setSelectedTeacherId(null);
  };

  const handleCreateTicket = async () => {
    if (!ticketTarget || !ticketTitle.trim() || !ticketDescription.trim()) return;
    try {
      const payload = {
        schoolCode,
        ticket_type: ticketTarget.type,
        teacher_id: ticketTarget.teacher?.teacher_id || null,
        teacher_name: ticketTarget.teacher?.teacher_name || null,
        student_id: ticketTarget.student?.id || null,
        student_name: ticketTarget.student?.name || null,
        class_name: className || null,
        section: section || null,
        title: ticketTitle.trim(),
        description: ticketDescription.trim(),
      };
      await axios.post("https://cleezoclass.com:4000/api/tickets", payload);
      setTicketSuccess("Ticket created successfully.");
      setTicketError("");
      setTimeout(() => {
        closeTicketModal();
      }, 900);
      fetchTickets();
    } catch (err) {
      console.error("Error creating ticket", err);
      setTicketError("Failed to create ticket. Please try again.");
      setTicketSuccess("");
    }
  };

    const [schoolName, setSchoolName] = useState("Loading...");
  const [currentDbName, setCurrentDbName] = useState(localStorage.getItem("schoolCode") || "");
const [instituteAddress, setInstituteAddress] = useState("");
  const [logo, setLogo] = useState("/default-logo.png");

useEffect(() => {
  if (!currentDbName) {
    console.log("❌ No currentDbName found in localStorage");
    return;
  }

  const fetchInstituteInfo = async (retriesLeft = 1) => {
    try {
      console.log("➡️ Fetching institute info for dbName:", currentDbName);
      const res = await fetch(`https://cleezoclass.com:4000/api/institute?dbName=${currentDbName}`);
      console.log("📌 Response received, status:", res.status);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      console.log("📂 Institute data received:", data);
      const storedSchoolName = String(localStorage.getItem("schoolName") || "").trim();
      const storedInstituteName = String(localStorage.getItem("instituteName") || "").trim();
      const apiInstituteName = String(data.institute_name || "").trim();
      const resolvedApiInstituteName = apiInstituteName && !isLikelyDbCode(apiInstituteName) ? apiInstituteName : "";
      const resolvedInstituteName = String(
        resolvedApiInstituteName ||
          storedSchoolName ||
          storedInstituteName ||
          formatBranchName(currentDbName) ||
          currentDbName ||
          "Unknown School"
      ).trim();
      setSchoolName(resolvedInstituteName);
      localStorage.setItem("instituteName", resolvedInstituteName);
      localStorage.setItem("schoolName", resolvedInstituteName);
      setLogo(data.logo || "/default-logo.png");
      setInstituteAddress(data.address || "Address not available");
    } catch (err) {
      console.error("🔥 Error fetching institute info:", err);
      if (retriesLeft > 0) {
        return fetchInstituteInfo(retriesLeft - 1);
      }
      const fallbackInstituteName =
        String(localStorage.getItem("schoolName") || localStorage.getItem("instituteName") || "").trim() ||
        formatBranchName(currentDbName) ||
        currentDbName ||
        "Unknown School";
      setSchoolName(fallbackInstituteName);
      localStorage.setItem("instituteName", fallbackInstituteName);
      localStorage.setItem("schoolName", fallbackInstituteName);
      setLogo("/default-logo.png");
      setInstituteAddress("Address not available");
    }
  };

  fetchInstituteInfo(1);
}, [currentDbName]);


  const sidebarItems = [
    {
      key: "home",
      label: "Home",
      icon: homeIcon,
      iconAlt: "home",
      active: activeSidebar === "home",
      onClick: () => {
        setActiveSidebar("home");
        navigate("/FrontDeskDashboard");
      },
    },
    {
      key: "users",
      label: "Campaigning",
      icon: usersIcon,
      iconAlt: "users",
      active: activeSidebar === "users",
      onClick: () => {
        setActiveSidebar("users");
        navigate("/FrontDeskCampaigning");
      },
    },
    {
      key: "analytics",
      label: "Admissions",
      icon: chartIcon,
      iconAlt: "chart",
      active: activeSidebar === "analytics",
      onClick: () => {
        setActiveSidebar("analytics");
        openModal("AdmissionCRM", "Admissions");
      },
    },
    {
      key: "staff",
      label: "Communication",
      icon: CommunicationIcon,
      iconAlt: "staff",
      active: activeSidebar === "staff",
      onClick: () => {
        setActiveSidebar("staff");
        openModal("Communication", "Communication");
      },
    },
    {
      key: "settings",
      label: "Enrollments",
      icon: settingsIcon,
      iconAlt: "settings",
      active: activeSidebar === "settings",
      onClick: () => {
        setActiveSidebar("settings");
        openModal("AdmissionEnrollment", "AdmissionEnrollment");
      },
    },
    {
      key: "reports",
      label: "Reports",
      icon: reportSideIcon,
      iconAlt: "reports",
      active: activeSidebar === "reports",
      onClick: () => {
        setActiveSidebar("reports");
        setActiveNav("reports");
        navigate("/FrontDeskReport");
      },
    },
  ];

  const topbarTabs = [
    {
      key: "dashboard",
      label: "Dashboard",
      active: activeNav === "dashboard",
      onClick: () => {
        setActiveNav("dashboard");
        closeModal();
      },
    },
    {
      key: "campaigning",
      label: "Campaigning",
      active: activeNav === "campaigning",
      onClick: () => {
        setActiveNav("campaigning");
        navigate("/FrontDeskCampaigning");
      },
    },
    {
      key: "admissions",
      label: "Admissions",
      active: activeNav === "admissions",
      onClick: () => {
        setActiveNav("admissions");
        setActiveSidebar("analytics");
        openModal("AdmissionCRM", "Admissions");
      },
    },
    {
      key: "reports",
      label: "Reports",
      active: activeNav === "reports",
      onClick: () => {
        setActiveNav("reports");
        navigate("/FrontDeskReport");
      },
    },
    // {
    //   key: "images",
    //   label: "Images",
    //   active: activeNav === "images",
    //   onClick: () => {
    //     setActiveNav("images");
    //     navigate("/FrontDeskDashboardImage");
    //   },
    // },
  ];

  const topbarRight = (
    <>
      <button
        type="button"
        className="dashboard-user-btn accountant-user-btn"
        aria-label="Book"
        title="Book"
        onClick={openAdmissionProcessBook}
      >
        <FaBook className="dashboard-user-icon accountant-user-icon" />
      </button>

      <div ref={userDropdownRef} className="header-profile-wrap">
        <button
          type="button"
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          className="dashboard-user-btn accountant-user-btn"
          aria-label="Account"
        >
          <FaUser className="dashboard-user-icon accountant-user-icon" />
        </button>

        {userDropdownOpen && userInfo && (
          <div className="header-profile-dropdown">
            <div className="header-profile-card" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={openProfileEditor}
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#111111",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
                aria-label="Edit profile"
                title="Edit profile"
              >
                <FaEdit />
              </button>

              <div className="header-profile-avatar">
                {profileEditOpen ? (
                  <label
                    htmlFor="frontdesk-profile-photo-input"
                    style={{
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {profilePhotoPreview ? (
                      <img
                        src={profilePhotoPreview}
                        alt="Profile"
                        className="header-profile-avatar-image"
                      />
                    ) : (
                      <FaUser className="header-profile-avatar-fallback" />
                    )}
                    <input
                      id="frontdesk-profile-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : userInfo?.photo ? (
                  <img
                    src={userInfo.photo}
                    alt="Profile"
                    className="header-profile-avatar-image"
                  />
                ) : (
                  <FaUser className="header-profile-avatar-fallback" />
                )}
              </div>
              <div className="header-profile-name">{userInfo.name}</div>
            </div>

            <hr className="header-profile-divider" />
            <div className="header-profile-info">
              <div><strong>Designation:</strong> {userInfo.designation}</div>

              {profileEditOpen ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 10,
                    alignItems: "start",
                  }}
                >
                  <label style={{ display: "grid", gap: 6, marginBottom: 0 }}>
                    <strong>Gender:</strong>
                    <input
                      type="text"
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
                      placeholder="Enter gender"
                      style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6, marginBottom: 0 }}>
                    <strong>Phone:</strong>
                    <input
                      type="text"
                      value={profileForm.phone_no}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone_no: e.target.value }))}
                      placeholder="Enter phone number"
                      style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
                    />
                  </label>
                  <label
                    style={{
                      display: "grid",
                      gap: 6,
                      marginBottom: 0,
                    }}
                  >
                    <strong>Email:</strong>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                      style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="header-profile-field">
                    <strong>Gender:</strong>
                    <span>{userInfo.gender}</span>
                  </div>
                  <div className="header-profile-field">
                    <strong>Phone:</strong>
                    <span>{userInfo.phone_no}</span>
                  </div>
                  <div className="header-profile-email"><strong>Email:</strong> {userInfo.email}</div>
                </>
              )}
              <div><strong>school Name:</strong> {schoolName}</div>
              <div><strong>school Address:</strong> {instituteAddress}</div>
            </div>

            {profileEditOpen && (
              <>
                {profileSaveStatus && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      color:
                        profileSaveStatus.toLowerCase().includes("failed") ||
                        profileSaveStatus.toLowerCase().includes("missing")
                          ? "#dc2626"
                          : "#15803d",
                    }}
                  >
                    {profileSaveStatus}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={closeProfileEditor}
                    className="header-profile-logout"
                    style={{ backgroundColor: "#e5e7eb", color: "#111827", marginTop: 0, flex: 1 }}
                    disabled={profileSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="header-profile-logout"
                    style={{ backgroundColor: "#203864", marginTop: 0, flex: 1 }}
                    disabled={profileSaving}
                  >
                    {profileSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            )}
            <button onClick={handleLogout} className="header-profile-logout">Logout</button>
          </div>
        )}
      </div>
    </>
  );


  return (
  <>
    <Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
      {modalContent}
    </Modal>
    <Modal isOpen={admissionReportOpen} title="Admission Report" onClose={() => setAdmissionReportOpen(false)}>
      <AdmissionReportPopup />
    </Modal>
    {qualityPdfOpen &&
      createPortal(
        <div className="modalOverlayStyle" onClick={() => setQualityPdfOpen(false)}>
          <div
            className="modalContentStyle"
            style={{
              width: "min(980px, 94vw)",
              height: "min(88vh, 860px)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="modalCloseButton"
              onClick={() => setQualityPdfOpen(false)}
              aria-label="Close PDF viewer"
            >
              ×
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 22 }}>Admission Process</h3>
                {qualityPdfMeta?.uploaded_at ? (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Uploaded: {new Date(qualityPdfMeta.uploaded_at).toLocaleString("en-IN")}
                  </div>
                ) : null}
              </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-solid1"
                  onClick={fetchLatestAdmissionProcessPdf}
                  disabled={qualityPdfLoading}
                >
                  {qualityPdfLoading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            {qualityPdfError ? (
              <div style={{ color: "#b91c1c", fontSize: 14 }}>{qualityPdfError}</div>
            ) : null}
            {qualityPdfStatus ? (
              <div style={{ color: "#166534", fontSize: 14 }}>{qualityPdfStatus}</div>
            ) : null}

            <div
              style={{
                flex: 1,
                minHeight: 0,
                border: "1px solid #d6dbe3",
                borderRadius: 16,
                overflow: "hidden",
                background: "#f8fafc",
              }}
            >
              {qualityPdfMeta?.file_url ? (
                <iframe
                  title="Admission Process PDF"
                  src={`${qualityPdfMeta.file_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    padding: 24,
                    color: "#475569",
                  }}
                >
                  Upload a PDF to preview it here. Existing `.docx` files will not render in the PDF viewer.
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    <ConfirmDialog
      isOpen={isReconnectConfirmOpen}
      title="Reconnect WhatsApp"
      message="This will disconnect the current WhatsApp session and open a new QR scanner. After scanning again, messaging actions will continue."
      confirmLabel={isWhatsAppResetting ? "Reconnecting..." : "Reconnect"}
      cancelLabel="Cancel"
      onConfirm={confirmReconnect}
      onCancel={() => setIsReconnectConfirmOpen(false)}
    />
    <ErrorPopup message={campaignQrMsg} onClose={() => setCampaignQrMsg("")} />

       <DashboardLayout
  pageClassName="frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page dashboard-home-page"
  lockViewport={false}
  sidebarItems={sidebarItems}
  sidebarTopAction={
    String(localStorage.getItem("userRole") || "").toLowerCase() === "superadmin"
      ? {
          label: "Chief Dashboard",
          onClick: () => navigate("/ChiefDashboard"),
        }
      : null
  }

      topbarTabs={topbarTabs}
      logoSrc={schoolLogo}
      logoAlt="Logo"
      instituteName={schoolName}
      topbarRight={topbarRight}
      footerLogoSrc={abcLogo}
      footerLogoAlt="Cleezo Class"
    >
      <div className="accountant-grid">

      <div className="accountant-row accountant-row-top">


    <div className="accountant-welcome-block">
    {whatsAppConnected && <div className="whatsappWelcomeText">Welcome!</div>}
    {whatsAppConnected && <h2>Hi, {userInfo?.name || "User"}!</h2>}
    {whatsAppConnected && <p>Check Lead Status</p>}
    {whatsAppConnected && <p>Assign Communications</p>}
    {whatsAppConnected && <p>Assign Counsellor</p>}
    {whatsAppConnectedNumber && (
      <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
        WhatsApp connected number: {whatsAppConnectedNumber}
      </p>
    )}

    {whatsAppConnected && !showWhatsAppScanner && (
      <span
        role="button"
        tabIndex={0}
        className={`whatsappReconnectText ${isWhatsAppResetting ? "is-disabled" : ""}`}
        onClick={() => {
          openReconnectConfirm();
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isWhatsAppResetting) {
            e.preventDefault();
            openReconnectConfirm();
          }
        }}
      >
        {isWhatsAppResetting ? "Reconnecting..." : "Reconnect"}
      </span>
    )}

    {!showWhatsAppScanner && !whatsAppConnected && (
      <>
        <span
          role="button"
          tabIndex={0}
          className="whatsappGlowTrigger frontdesk-start-trigger"
          onClick={openScanner}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openScanner();
            }
          }}
        >
          Start
        </span>
        <p className="frontdesk-start-note">Click Start to open WhatsApp QR scanner.</p>
      </>
    )}

    {showWhatsAppScanner && (
      <>
        <div className="frontdesk-scanner-wrap">
          <WhatsAppConnect
            embedded
            onConnected={() => {
              setWhatsAppConnected(true);
              setShowWhatsAppScanner(false);
            }}
          />
        </div>
        <p className="frontdesk-start-note">Scan QR to connect WhatsApp and enable messaging actions.</p>
      </>
    )}
  </div>

  <div className="accountant-task-card accountant-card">
    <div className="taskCardContent">
      <TaskOfTheDay />
    </div>
  </div>

  <div className="accountant-mini-cards">
    <div className="accountant-quick-card accountant-card" onClick={() => setActiveMiniPanel("timeline")}>
      <div >
        <img src={timelineIcon} alt="Timeline" />
      </div>
      <h4>Timeline</h4>
      <p>Campaigning list</p>
    </div>

    <div className="accountant-quick-card accountant-card" onClick={() => setActiveMiniPanel("followup")}>
      <div >
        <img src={followupIcon} alt="Follow-up" />
      </div>
      <h4>Follow-up</h4>
      <p>Assigned Lead</p>
    </div>

    <div className="accountant-quick-card accountant-card" onClick={() => setActiveMiniPanel("assistant")}>
      <div >
        <img src={assistantIcon} alt="Assistant" />
      </div>
      <h4>Assistant</h4>
      <p>Daily Activity check</p>
    </div>
  </div>


    </div>


    {/* MAIN GRID */}
         <div className="accountant-row accountant-row-middle">


           <div className="accountant-collect-card accountant-card">

                <div className="collect-header">
          <div className="Heading">
            Admissions
          </div>

          <button type="button" className="collect-filter">
            <span className="normalText">As on today</span>
          </button>
        </div>

        <button
          type="button"
          className="accountant-inline-plus accountant-inline-plus-below"
          onClick={() => openModal("AdmissionCRM", "Admissions")}
        >
          +
        </button>



        <div className="accountant-collect-content">
            <div className="accountant-progress-panel" style={admissionProgressStyle}>
          <div
            className={`accountant-progress-ring ${admissionRate === 0 ? "is-zero" : ""}`}
          >
            <div className="accountant-progress-ring-inner">{admissionRate}%</div>
          </div>
        </div>

        <div className="collect-stats">
          {admissionStats.map((item) => (
            <p key={item.label}>
              <span className="normalText">{item.label}:</span>
              <span className="blockText">{item.value}</span>
            </p>
          ))}
        </div>
      </div>

           <div className="accountant-total-due">
        <span className="blockText">Total Admissions</span>
        <span className="normalText">And total conversions ratio</span>
      </div>


        
      </div>

            <div className="accountant-outstanding-card accountant-card">

        <CommunicationAssignSection
          leads={campaigningStaffLeads}
          selectedLead={selectedLead}
          onSelectLead={setSelectedLead}
          onAddClick={() => navigate("/StudentManagement?openAdd=true&userType=teacher")}
          onSendQrAll={sendAdmissionQrFromDashboard}
          onRefreshLeads={refreshCampaignUsers}
          sendingQrAll={sendingCampaignQrAll}
        />
      </div>

      <div className="accountant-feetype-card accountant-card">
        {activeMiniPanel === "followup" ? (
          <div className="co-digital-list">
            <LeadsTable
              variant="campaigning"
              embedded
              onRowClick={(lead) => navigate(`/FrontDeskReport?report=followup&leadId=${encodeURIComponent(String(lead.id))}`)}
            />
          </div>
        ) : (
          <>
            <div className="accountant-card-header accountant-feetype-header">
    <div className="Heading">
Campaign Status    </div>

              <div className="accountant-feetype-meta">
                <button
                  type="button"
                  className="accountant-create-new-btn"
                  onClick={() => setAdmissionReportOpen(true)}
                >
                  Auto Leads
                </button>

                <div className="accountant-feetype-count">
                  <strong>{sendCounts.whatsappRemaining}</strong>
                  <span className="normalText">Last 30 Days</span>
                </div>
              </div>
            </div>

            <div className="frontdesk-campaign-status-time">
              {campaignStatusRangeLabel}
            </div>

            <div className="leadsList">
              {safeLeads.map((lead, index) => {
                const formattedDate = new Date(lead.date).toISOString().split("T")[0];
                return (
                  <div
                    key={lead.id}
                    className="leadItemWrapper"
                    onClick={() => {
                      if (activeMiniPanel === "followup") {
                        navigate(`/FrontDeskReport?report=followup&leadId=${encodeURIComponent(String(lead.id))}`);
                      }
                    }}
                    style={{ cursor: activeMiniPanel === "followup" ? "pointer" : "default" }}
                  >
                    {index !== safeLeads.length - 1 && <div className="leadConnector" />}

                    <div className="leadContent">
                      <div className="leadDate">
                        <div className="leadDateValue">{formattedDate}</div>
                        <div className="leadTime">{lead.lead_time}</div>
                      </div>

                      <div className="leadAvatar" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {(() => {
                          const entryType = String(lead.entry_type || "").toLowerCase();
                          const isMail =
                            entryType.includes("mail") ||
                            entryType.includes("gmail") ||
                            entryType.includes("email");
                          return (
                            <span
                              className={`frontdesk-channel-badge ${isMail ? "is-mail" : "is-whatsapp"}`}
                              aria-label={isMail ? "Mail" : "WhatsApp"}
                              title={isMail ? "Mail" : "WhatsApp"}
                              style={{ margin: 0 }}
                            >
                              {isMail ? "G" : "W"}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="leadInfo">
                        <span className="blockText">{lead.full_name}</span> <span className="normalText">showing interest via{" "}</span>
                        {(() => {
                          const entryType = String(lead.entry_type || "").toLowerCase();
                          const isMail =
                            entryType.includes("mail") ||
                            entryType.includes("gmail") ||
                            entryType.includes("email");
                          const badge = isMail ? "G" : "W";
                          const label = isMail ? "Mail" : "WhatsApp";
                          return (
                            <>
                              <span
                                className={`frontdesk-channel-badge ${isMail ? "is-mail" : "is-whatsapp"}`}
                                aria-label={label}
                                title={label}
                              >
                                {badge}
                              </span>{" "}
                              <span className="normalText">via {label}</span>
                            </>
                          );
                        })()}
                        <br />
                      <span className="normalText">Contact: <span className="blockText">{lead.mobile_number}</span> / <span className="blockText">{lead.email_id}</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>


    </div>


    {/* SECOND GRID */}
          <div className="accountant-row accountant-row-bottom">


            <div className="accountant-bottom-left">
        <div className="accountant-ticket-card accountant-card">
          <DashboardSection
            title=""
            variant="marketing"
            className="campaignSection fd-ticket-section-lock"
            style={{ minHeight: 0, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}
          >

<div className="tickets-header-and-tabs">

  <div className="tickets-left">
    <div className="tickets-header">Tickets</div>

    <div className="tickets-tabs">
      <button
        className={`tickets-tab ${activeTab === "staff" ? "active" : ""}`}
        onClick={() => setActiveTab("staff")}
      >
        Staff
      </button>

      <button
        className={`tickets-tab ${activeTab === "students" ? "active" : ""}`}
        onClick={() => setActiveTab("students")}
      >
        Students
      </button>
    </div>
  </div>

</div>

  {activeTab === "students" && (
    <div className="tickets-student-filter-row">
      <select
        value={selectedClassSection}
        onChange={(e) => setSelectedClassSection(e.target.value)}
        disabled={dropdownLoading}
        className="collect-filter tickets-class-dropdown-select"
      >
        <option value="">Select Class &amp; Section</option>

        {derivedClasses.map((cls) => {
          const classLabel = getClassLabel(cls);
          if (!classLabel) return null;

          const sectionsForClass = sectionMap
            .filter((item) => {
              const classValue =
                item.class_name || item.class || item.className;
              return String(classValue) === String(classLabel);
            })
            .map(
              (item) =>
                item.section || item.section_name || item.sectionName
            );

          return sectionsForClass.length > 0
            ? sectionsForClass.map((sec) => (
                <option key={`${classLabel}_${sec}`} value={`${classLabel}_${sec}`}>
                  {classLabel} - {sec}
                </option>
              ))
            : null;
        })}
      </select>
    </div>
  )}

      <div
        className="tickets-content"
        style={{
          minHeight: 0,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activeTab === "staff" && (
          <div className="tc-staffAssignSection tickets-staff-panel-shell">
           
            {loadingTeachers && <p>Loading teachers...</p>}

            {!loadingTeachers && (
      <div
            className="tickets-student-panel-shell tickets-student-panel"
            style={{
              minHeight: 0,
              height: "auto",
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >  
          <div
              className="tickets-student-grid-shell tickets-student-grid"
              style={{
                minHeight: 0,
                flex: 1,
                height: "auto",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
          
                        {teacherRows.map((row, idx) => (
                  <div key={idx} className="tc-teacherRow">
                    {row.map((teacher, teacherIndex) => {
                      const teacherId = getTeacherId(
                        teacher,
                        idx * TICKETS_ITEMS_PER_ROW + teacherIndex
                      );
                      const teacherName = getTeacherName(teacher);
                      const normalizedTeacher = {
                        ...teacher,
                        teacher_id: teacherId,
                        teacher_name: teacherName,
                      };

                      return (
                        <div
                          key={teacherId}
                          className="tc-teacherCard tickets-clickable"
                          onClick={() => {
                            setSelectedTeacherId(teacherId);
                            openTicketModal({ type: "teacher", teacher: normalizedTeacher });
                          }}
                        >
                          <div
                            className="tc-teacherAvatar"
                            style={{
                              background:
                                selectedTeacherId === teacherId ? "#f6a5ab" : "#f1f2f4",
                            }}
                          >
    <FaUser className="header-profile-avatar-fallback" />
                          </div>
                          <div className="tc-teacherName">{teacherName}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div></div>
            )}
          </div>
        )}

        {activeTab === "students" && (
          <div
            className="tickets-student-panel-shell tickets-student-panel"
            style={{
              minHeight: 0,
              height: "auto",
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="tickets-student-grid-shell tickets-student-grid"
              style={{
                minHeight: 0,
                flex: 1,
                height: "auto",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {filteredStudents.length === 0 ? (
                <div className="payment-no-students">
                  {className ? "No students found" : "Please select a class and section"}
                </div>
              ) : (
                studentRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="tc-teacherRow">
                    {row.map((student, studentIndex) => {
                      const studentId =
                        student.id ??
                        student.student_id ??
                        `student-${rowIndex * TICKETS_ITEMS_PER_ROW + studentIndex}`;
                      const studentName =
                        student.name ?? student.student_name ?? student.full_name ?? "Student";

                      return (
                        <div
                          key={studentId}
                          className="tc-teacherCard tickets-student-card tickets-clickable"
                          onClick={() => openTicketModal({ type: "student", student })}
                        >
                          <div
                            className="tc-teacherAvatar tickets-student-photo-placeholder"
                            style={{ background: "#f1f2f4" }}
                          >
                            <FaUser className="header-profile-avatar-fallback" />
                          </div>
                          <div className="tc-teacherName tickets-student-name">{studentName}</div>
                          <span className="tickets-student-id">ID: {studentId}</span>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    

      {showTicketModal && ticketTarget && (
        <div className="tickets-modal-overlay" onClick={closeTicketModal}>
          <div className="tickets-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tickets-modal-title">Raise Ticket</div>
            <div className="tickets-modal-subtitle">
              {ticketTarget.type === "teacher"
                ? `Teacher: ${ticketTarget.teacher?.teacher_name || "-"}`
                : `Student: ${ticketTarget.student?.name || "-"}${
                    className ? ` | ${className}-${section}` : ""
                  }`}
            </div>
            <input
              className="tickets-modal-input"
              placeholder="Title"
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
            />
            <textarea
              className="tickets-modal-textarea"
              placeholder="Description"
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
            />
            <div className="tickets-modal-actions">
              <button className="tickets-btn ghost" onClick={closeTicketModal}>
                Cancel
              </button>
              <button
                className="btn-solid"
                onClick={handleCreateTicket}
                disabled={!ticketTitle.trim() || !ticketDescription.trim()}
                style={{ whiteSpace: "nowrap" }}
              >
                Create Ticket
              </button>
            </div>
            {ticketSuccess && (
              <div className="tickets-success">{ticketSuccess}</div>
            )}
            {ticketError && <div className="tickets-error">{ticketError}</div>}
          </div>
        </div>
      )}
            </DashboardSection>
        </div>
      </div>


          <div className="accountant-premium-card accountant-card">
        <img src={premiumIcon} alt="Premium" className="accountant-premium-icon" />

        <h3 className="premiumblockText">Go Premium!</h3>

        <h5 className="premiumnormalText">
          opt in for premium pack and get full access of LeadX - fully
          Automatic Admission & 1000 leads every Month
        </h5>

        <button type="button">Find out More</button>
      </div>



             <div className="accountant-bottom-right">
        <div
          className="accountant-income-card accountant-card clickable"
          onClick={() => openModal("LeadsProfilePage", "Lead Profile")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              openModal("LeadsProfilePage", "Lead Profile");
            }
          }}
        >
          <div
            className={`accountant-income-ring accountant-progress-ring ${admissionRate === 0 ? "is-zero" : ""}`}
            style={admissionProgressStyle}
          >
            <div className="accountant-progress-ring-inner">{admissionRate}%</div>
          </div>
          <div className="blockText"> Lead Profile</div>
          <div className="normalText">Percentile Shown Interest</div>
        </div>

        <div className="accountant-prevdue-card accountant-card">
          <p className="accountant-prevdue-amount accountant-prevdue-amount-split">
            <span className="accountant-prevdue-count">{sendCounts.totalRemaining}</span>
            <span className="accountant-prevdue-unit">used/500m</span>
          </p>
          <div className="blockText">Lead Limit</div>
          <div className="normalText">500 free leads per Month</div>
        </div>

                      <div className="accountant-total-strip accountant-card">
          <div className="accountant-total-strip-list">
            <div className="accountant-total-strip-item">
              <strong>{sendCounts.whatsappRemaining}</strong>
              <small>Sent</small>
              <span>WhatsApp (30d)</span>
            </div>

            <div className="accountant-total-strip-item">
              <strong>{sendCounts.emailRemaining}</strong>
              <small>Sent</small>
              <span>Email (30d)</span>
            </div>

            <div className="accountant-total-strip-item accountant-total-strip-item-total">
              <b>Total</b>
              <h2>{sendCounts.totalRemaining}</h2>
              <small>Last 30 Days</small>
            </div>
          </div>

          <p className="accountant-total-strip-date">
            {sendCounts.fromDate && sendCounts.toDate
              ? `${new Date(sendCounts.fromDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })} - ${new Date(sendCounts.toDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}`
              : new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
          </p>
        </div>


         </div>
    </div>
        </div>

      </DashboardLayout>
  </>
);




};
  const styles = {
  
    logo: { width: 90, height: 90, borderRadius: 5, objectFit: "cover" },
 
  };

export default FrontDeskDashboardFinal;
