import React, { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import "./FrontDesk.css";
import homeIcon from "../assets/Dashboard.png";
import usersIcon from "../assets/Staff Assign.png";
import chartIcon from "../assets/Lead Profile.png";
import settingsIcon from "../assets/Enrollment.png";
import abcLogo from "../assets/logoab.png";
import communicationIcon from "../assets/Communication Assign.png";
import reportSideIcon from "../assets/Reports .png";
import campaignStaffIcon from "../assets/Campaign_Staff.png";
import campaignDigitalIcon from "../assets/Campaign_Digital.png";
import campaignAutomatedIcon from "../assets/Campaign_Automated.png";
import followupLeadwiseIcon from "../assets/Followup_Leadwise.png";
import admissionRegisteredIcon from "../assets/Admission_Registered.png";
import admissionTimelineIcon from "../assets/Admission_Timeline.png";
import admissionLeadProfileIcon from "../assets/Admission_LeadProfile.png";
import admissionEnrolledIcon from "../assets/Admission_Enrolled.png";
import AdmissionCRM from "./FrontDesk_Admission.jsx";
import Communication from "./Frontdesk_Communication.jsx";
import AdmissionEnrollment from "./FrontDesk_Enrollment.tsx";
import "./Frontdesk_Communication.css";
import DashboardLayout from "../components/DashboardLayout.jsx";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";

type ReportType =
  | "all"
  | "staff"
  | "digital"
  | "automated"
  | "followup"
  | "registered"
  | "timeline"
  | "lead_profile"
  | "enrolled";

interface LeadReportRow {
  id: number | string;
  full_name: string;
  lead_name?: string;
  refer_by?: string;
  mobile_number?: string;
  email_id?: string;
  reg_no?: string;
  ticket_no?: string;
  lead_admission_for?: string;
  assigned_teacher_name?: string;
  assigned_teacher_id?: string | number;
  entry_type?: string;
  date?: string;
  lead_time?: string;
  followup_day?: number;
  test_date?: string;
  test_time?: string;
  counselling_required?: string | boolean;
  counselling_date?: string;
  counselling_time?: string;
  status?: string;
  enrolled?: string | boolean | number;
  admission_paid?: string | number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const reportCards = [
  { title: "Campaigning", subtitle: "Staff Report", icon: campaignStaffIcon, reportType: "staff" as ReportType },
  { title: "Campaigning", subtitle: "Digital Report", icon: campaignDigitalIcon, reportType: "digital" as ReportType },
  { title: "Campaigning", subtitle: "Automated Report", icon: campaignAutomatedIcon, reportType: "automated" as ReportType },
  { title: "Follow-up", subtitle: "Lead wise Report", icon: followupLeadwiseIcon, reportType: "all" as ReportType },
  { title: "Admission", subtitle: "Registered Report", icon: admissionRegisteredIcon, reportType: "registered" as ReportType },
  { title: "Timeline", subtitle: "Communication Report", icon: admissionTimelineIcon, reportType: "timeline" as ReportType },
  { title: "Admission", subtitle: "Lead Profile Report", icon: admissionLeadProfileIcon, reportType: "lead_profile" as ReportType },
  { title: "Admission", subtitle: "Enrolled Report", icon: admissionEnrolledIcon, reportType: "enrolled" as ReportType },
];

const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;

const isTruthyStatus = (value: unknown) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "y", "paid", "enrolled"].includes(normalized);
};

const formatDateCell = (value?: string) => (value ? String(value).split("T")[0] : "-");

const formatTimeCell = (value?: string) => {
  if (!value) return "-";
  const text = String(value).trim();
  return text.length > 8 ? text.slice(11, 19) || text.slice(0, 8) : text.slice(0, 8);
};

const normalizeCampaignStaffName = (value: unknown) =>
  String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();

const isGenericCampaignReferBy = (value: unknown) => {
  const normalized = normalizeCampaignStaffName(value);
  return normalized === "campaign" || normalized === "campaigning";
};

const getCampaignStaffLabel = (item: any) =>
  String(
    item?.teacher_name ??
      item?.name ??
      item?.full_name ??
      item?.assigned_teacher_name ??
      item?.refer_by ??
      ""
  ).trim();

const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });

const sanitizeFileName = (value: string) =>
  value
    .replace(/[^\w\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "_") || "FrontDesk_Report";

const FrontDeskReport: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState<"dashboard" | "admissions" | "campaigning" | "reports">("reports");
  const [activeSidebar, setActiveSidebar] = useState<
    "home" | "users" | "staff" | "analytics" | "settings" | "reports"
  >("reports");
  const [schoolLogo, setSchoolLogo] = useState<string>("/default-logo.png");
  const [schoolName, setSchoolName] = useState<string>("Institute");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);
  const [activeReportType, setActiveReportType] = useState<ReportType>("digital");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [rows, setRows] = useState<LeadReportRow[]>([]);
  const [campaignStaffNames, setCampaignStaffNames] = useState<string[]>([]);
  const [campaignStaffLoaded, setCampaignStaffLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [modalKind, setModalKind] = useState<"" | "admission" | "communication" | "enrollment">("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reportParam = String(params.get("report") || "").trim().toLowerCase();
    const leadIdParam = String(params.get("leadId") || "").trim();
    const normalizedReportType =
      reportParam === "followup"
        ? "all"
        : reportParam;
    const allowedReportTypes: ReportType[] = [
      "all",
      "staff",
      "digital",
      "automated",
      "followup",
      "registered",
      "timeline",
      "lead_profile",
      "enrolled",
    ];
    if (allowedReportTypes.includes(normalizedReportType as ReportType)) {
      setActiveReportType(normalizedReportType as ReportType);
    }
    setSelectedLeadId(leadIdParam);
  }, [location.search]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    let isMounted = true;

    Promise.all([
      fetch("https://cleezoclass.com:4000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolCode,
          user_type: "teacher",
        }),
      }),
      fetch(`https://cleezoclass.com:4000/api/lead-staff?schoolCode=${encodeURIComponent(schoolCode)}`),
    ])
      .then(async ([usersRes, campaignRes]) => {
        const usersData = await usersRes.json().catch(() => []);
        const campaignData = await campaignRes.json().catch(() => []);
        const combined = [
          ...(Array.isArray(usersData) ? usersData : []),
          ...(Array.isArray(campaignData)
            ? campaignData
            : Array.isArray(campaignData?.leads)
              ? campaignData.leads
              : Array.isArray(campaignData?.data)
                ? campaignData.data
                : []),
        ];
        const names = Array.from(
          new Set(combined.map((item: any) => getCampaignStaffLabel(item)).filter(Boolean))
        );
        if (isMounted) {
          setCampaignStaffNames(names);
          setCampaignStaffLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCampaignStaffNames([]);
          setCampaignStaffLoaded(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    const fetchInstituteInfo = async (retriesLeft = 1) => {
      try {
        const res = await fetch(`https://cleezoclass.com:4000/api/institute?dbName=${schoolCode}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }
        setSchoolLogo(data.logo || "/default-logo.png");
        const resolvedSchoolName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.schoolName || data?.name,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setSchoolName(resolvedSchoolName);
        localStorage.setItem("schoolName", resolvedSchoolName);
        localStorage.setItem("instituteName", resolvedSchoolName);
      } catch {
        if (retriesLeft > 0) return fetchInstituteInfo(retriesLeft - 1);
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
      }
    };

    fetchInstituteInfo(1);
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    const controller = new AbortController();
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      schoolCode,
      reportType:
        activeReportType === "staff" || activeReportType === "automated"
          ? "all"
          : activeReportType,
      page: "1",
      limit: "3000",
      sortBy: "date",
      sortDir: "DESC",
    });
    if (search.trim()) {
      params.set("search", search.trim());
    }

    fetch(`https://cleezoclass.com:4000/api/frontdesk/reports/leads?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load report data");
        setRows(Array.isArray(data?.rows) ? data.rows : []);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setRows([]);
        setError(err?.message || "Failed to load report data");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeReportType, search]);

  const campaignStaffNameSet = new Set(
    campaignStaffNames.map((name) => normalizeCampaignStaffName(name)).filter(Boolean)
  );

  const visibleRows = rows.filter((row) => {
    if (activeReportType === "staff") {
      const referByName = normalizeCampaignStaffName(row.refer_by);
      if (!referByName || isGenericCampaignReferBy(referByName)) return false;
      if (!campaignStaffLoaded || campaignStaffNameSet.size === 0) {
        return true;
      }
      return campaignStaffNameSet.has(referByName) || hasValue(row.refer_by);
    }

    if (activeReportType === "digital") {
      return isGenericCampaignReferBy(row.refer_by);
    }

    if (activeReportType === "automated") {
      const isLeadNameEmpty = !hasValue(row.lead_name);
      const isRegNoEmpty = !hasValue(row.reg_no);
      const isTicketNoEmpty = !hasValue(row.ticket_no);
      return isLeadNameEmpty && isRegNoEmpty && isTicketNoEmpty;
    }

    if (activeReportType === "timeline") {
      const hasTeacher = hasValue(row.assigned_teacher_name) || hasValue(row.assigned_teacher_id);
      const hasTestOrCounselling =
        hasValue(row.test_date) ||
        hasValue(row.test_time) ||
        hasValue(row.counselling_date) ||
        hasValue(row.counselling_time);
      return hasTeacher && hasTestOrCounselling;
    }

    if (activeReportType === "enrolled") {
      const statusEnrolled = String(row.status || "").trim().toLowerCase() === "enrolled";
      const enrolledStatus = isTruthyStatus(row.enrolled);
      const paidAdmission = Number(row.admission_paid || 0) > 0;
      return statusEnrolled || (enrolledStatus && paidAdmission);
    }

    if (activeReportType === "registered") {
      const referByName = normalizeCampaignStaffName(row.refer_by);
      const isDigitalCampaignLead = isGenericCampaignReferBy(referByName);
      const isStaffCampaignLead =
        !!referByName &&
        !isDigitalCampaignLead &&
        (!campaignStaffLoaded || campaignStaffNameSet.size === 0 || campaignStaffNameSet.has(referByName));
      return !isDigitalCampaignLead && !isStaffCampaignLead;
    }

    return true;
  });

  const tableColumns =
    activeReportType === "timeline"
      ? [
          { key: "id", label: "ID" },
          { key: "full_name", label: "Name" },
          { key: "lead_admission_for", label: "Class" },
          { key: "mobile_number", label: "Mobile" },
          { key: "assigned_teacher_name", label: "Teacher" },
          { key: "test_date", label: "Test Date" },
          { key: "test_time", label: "Test Time" },
          { key: "counselling_date", label: "Counselling Date" },
          { key: "counselling_time", label: "Counselling Time" },
        ]
      : activeReportType === "enrolled"
      ? [
          { key: "id", label: "ID" },
          { key: "full_name", label: "Name" },
          { key: "lead_admission_for", label: "Class" },
          { key: "mobile_number", label: "Mobile" },
          { key: "reg_no", label: "Reg No" },
          { key: "assigned_teacher_name", label: "Teacher" },
          { key: "enrolled", label: "Enrolled" },
          { key: "admission_paid", label: "Admission Fee Paid" },
        ]
      : [
          { key: "id", label: "ID" },
          { key: "full_name", label: "Name" },
          { key: activeReportType === "staff" ? "refer_by" : "lead_name", label: activeReportType === "staff" ? "Campaign Staff" : "Lead Name" },
          { key: "mobile_number", label: "Mobile" },
          { key: "email_id", label: "Email" },
          { key: "reg_no", label: "Reg No" },
          ...(activeReportType === "digital"
            ? []
            : [
                {
                  key: activeReportType === "staff" ? "lead_name" : "assigned_teacher_name",
                  label: activeReportType === "staff" ? "Lead Name" : "Teacher",
                },
              ]),
          ...(activeReportType === "digital" ? [] : [{ key: "entry_type", label: "Entry" }]),
          { key: "date", label: "Date" },
          { key: "lead_time", label: "Time" },
        ];

  const reportLabel =
    activeReportType === "all"
      ? "Lead Wise Report"
      : activeReportType === "staff"
        ? "Staff Report"
        : activeReportType === "digital"
          ? "Digital Report"
          : activeReportType === "automated"
            ? "Automated Report"
            : activeReportType === "registered"
              ? "Registered Report"
              : activeReportType === "timeline"
                ? "Communication Report"
                : activeReportType === "lead_profile"
                  ? "Lead Profile Report"
                  : "Enrolled Report";

  const getReportCellValue = (row: LeadReportRow, columnKey: string) => {
    if (columnKey === "id") return row.id || "-";
    if (columnKey === "full_name") return row.full_name || "-";
    if (columnKey === "refer_by") return row.refer_by || "-";
    if (columnKey === "lead_name") return row.lead_name || "-";
    if (columnKey === "mobile_number") return row.mobile_number || "-";
    if (columnKey === "email_id") return row.email_id || "-";
    if (columnKey === "reg_no") return row.reg_no || "-";
    if (columnKey === "ticket_no") return row.ticket_no || "-";
    if (columnKey === "lead_admission_for") return row.lead_admission_for || "-";
    if (columnKey === "assigned_teacher_name") return row.assigned_teacher_name || "-";
    if (columnKey === "entry_type") return row.entry_type || "-";
    if (columnKey === "date") return formatDateCell(row.date);
    if (columnKey === "lead_time") return formatTimeCell(row.lead_time);
    if (columnKey === "followup_day") return row.followup_day ?? "-";
    if (columnKey === "test_date") return formatDateCell(row.test_date);
    if (columnKey === "test_time") return formatTimeCell(row.test_time);
    if (columnKey === "counselling_required") return isTruthyStatus(row.counselling_required) ? "Yes" : "No";
    if (columnKey === "counselling_date") return formatDateCell(row.counselling_date);
    if (columnKey === "counselling_time") return formatTimeCell(row.counselling_time);
    if (columnKey === "status") return row.status || "-";
    if (columnKey === "enrolled") return isTruthyStatus(row.enrolled) ? "Yes" : "No";
    if (columnKey === "admission_paid") return row.admission_paid ?? 0;
    return String(row[columnKey as keyof LeadReportRow] ?? "-");
  };

  const handleDownloadReport = () => {
    if (!visibleRows.length) return;

    const headerRow = tableColumns.map((column) => `"${String(column.label).replace(/"/g, '""')}"`).join(",");
    const csvRows = visibleRows.map((row) =>
      tableColumns
        .map((column) => {
          const value = getReportCellValue(row, column.key);
          return `"${String(value ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
        })
        .join(",")
    );

    const csvContent = [headerRow, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const fileName = `${sanitizeFileName(`${schoolName}_${reportLabel}`)}.csv`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const handlePrintReport = () => {
    if (!visibleRows.length) return;

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const tableHeaders = tableColumns
      .map(
        (column) =>
          `<th style="border:1px solid #d9d9d9;padding:8px 10px;background:#0A4D82;color:#fff;text-align:left;font-size:12px;">${escapeHtml(column.label)}</th>`
      )
      .join("");

    const tableRows = visibleRows
      .map(
        (row) =>
          `<tr>${tableColumns
            .map((column) => {
              const value = getReportCellValue(row, column.key);
              return `<td style="border:1px solid #e3e3e3;padding:8px 10px;font-size:12px;color:#333;white-space:nowrap;">${escapeHtml(value)}</td>`;
            })
            .join("")}</tr>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(`${schoolName} - ${reportLabel}`)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #222; }
            h1 { margin: 0 0 6px; font-size: 20px; }
            .meta { margin: 0 0 16px; color: #666; font-size: 13px; }
            .meta strong { color: #222; }
            table { width: 100%; border-collapse: collapse; }
            thead { display: table-header-group; }
            tr { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(schoolName)}</h1>
          <p class="meta">${escapeHtml(reportLabel)} | ${visibleRows.length} row(s)</p>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  };

  const openModal = (key: string) => {
    if (key === "AdmissionCRM") {
      setModalContent(<AdmissionCRM />);
      setModalKind("admission");
      setIsModalOpen(true);
      return;
    }
    if (key === "Communication") {
      setModalContent(<Communication />);
      setModalKind("communication");
      setIsModalOpen(true);
      return;
    }
    if (key === "AdmissionEnrollment") {
      setModalContent(<AdmissionEnrollment />);
      setModalKind("enrollment");
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setModalKind("");
    setActiveSidebar("reports");
    setActiveNav("reports");
  };

  const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    const modalClassName =
      modalKind && modalKind !== "admission"
        ? `modalContentStyle frontdesk-report-modal-${modalKind}`
        : "modalContentStyle";
    return createPortal(
      <div className="modalOverlayStyle" onClick={onClose}>
        <div className={modalClassName} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modalCloseButton" onClick={onClose} aria-label="Close popup">
            ×
          </button>
          {children}
        </div>
      </div>,
      document.body
    );
  };

  const sidebarItems = [
    {
      key: "home",
      label: "Home",
      icon: homeIcon,
      iconAlt: "home",
      active: activeSidebar === "home",
      onClick: () => {
        setActiveSidebar("home");
        setActiveNav("dashboard");
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
        setActiveNav("campaigning");
        navigate("/FrontDeskCampaigning");
      },
    },
    {
      key: "analytics",
      label: "Admissions",
      icon: chartIcon,
      iconAlt: "analytics",
      active: activeSidebar === "analytics",
      onClick: () => {
        setActiveSidebar("analytics");
        setActiveNav("admissions");
        openModal("AdmissionCRM");
      },
    },
    {
      key: "staff",
      label: "Communication",
      icon: communicationIcon,
      iconAlt: "communication",
      active: activeSidebar === "staff",
      onClick: () => {
        setActiveSidebar("staff");
        openModal("Communication");
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
        openModal("AdmissionEnrollment");
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
        setActiveSidebar("home");
        navigate("/FrontDeskDashboard");
      },
    },
    {
      key: "campaigning",
      label: "Campaigning",
      active: activeNav === "campaigning",
      onClick: () => {
        setActiveNav("campaigning");
        setActiveSidebar("users");
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
        openModal("AdmissionCRM");
      },
    },
    {
      key: "reports",
      label: "Reports",
      active: activeNav === "reports",
      onClick: () => {
        setActiveNav("reports");
        setActiveSidebar("reports");
      },
    },
  ];

  const topbarRight = (
    <EditableProfileMenu />
  );

  return (
    <>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {modalContent}
      </Modal>
      <DashboardLayout
        pageClassName="frontdesk-dashboard-page frontdesk-report-page accountant-dashboard-page accountant-dashboard-home-page dashboard-home-page"
        lockViewport={false}
        sidebarItems={sidebarItems}
        topbarTabs={topbarTabs}
        logoSrc={schoolLogo}
        logoAlt="Logo"
        instituteName={schoolName}
        topbarRight={topbarRight}
        footerLogoSrc={abcLogo}
        footerLogoAlt="Cleezo Class"
      >
        <div className="fdr-main">
          <div className="fdr-card-row">
            {reportCards.map((card) => (
              <button
                type="button"
                className={`fdr-report-card ${activeReportType === card.reportType ? "fdr-report-card-active" : ""}`}
                key={`${card.title}-${card.subtitle}`}
                onClick={() => setActiveReportType(card.reportType)}
              >
                <img src={card.icon} alt={card.subtitle} />
                <div className="fdr-report-title">{card.title}</div>
                <div className="fdr-report-subtitle">{card.subtitle}</div>
              </button>
            ))}
          </div>

          <div className="fdr-empty-canvas">
            <div className="fdr-table-toolbar">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fdr-table-search"
                placeholder="Search name / mobile / email / lead name"
              />
              <div className="fdr-table-toolbar-right">
                <button
                  type="button"
                  className="fdr-report-action-btn"
                  onClick={handleDownloadReport}
                  disabled={!visibleRows.length}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="fdr-report-action-btn"
                  onClick={handlePrintReport}
                  disabled={!visibleRows.length}
                >
                  Print
                </button>
                <div className="fdr-table-count">{visibleRows.length} rows</div>
              </div>
            </div>

            <div className="fdr-table-wrap">
              <table className="fdr-table">
                <thead>
                  <tr>
                    {tableColumns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={tableColumns.length} className="fdr-table-state">
                        Loading report data...
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={tableColumns.length} className="fdr-table-state fdr-table-state-error">
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && visibleRows.length < 1 && (
                    <tr>
                      <td colSpan={tableColumns.length} className="fdr-table-state">
                        No data found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    visibleRows.map((row) => (
                      <tr
                        key={row.id}
                        className={selectedLeadId && String(row.id) === selectedLeadId ? "fdr-table-row-selected" : ""}
                      >
                        <td>{row.id}</td>
                        <td>{row.full_name || "-"}</td>
                        {activeReportType === "timeline" ? (
                          <>
                            <td>{row.lead_admission_for || "-"}</td>
                            <td>{row.mobile_number || "-"}</td>
                            <td>{row.assigned_teacher_name || "-"}</td>
                            <td>{formatDateCell(row.test_date)}</td>
                            <td>{formatTimeCell(row.test_time)}</td>
                            <td>{formatDateCell(row.counselling_date)}</td>
                            <td>{formatTimeCell(row.counselling_time)}</td>
                          </>
                        ) : activeReportType === "enrolled" ? (
                          <>
                            <td>{row.lead_admission_for || "-"}</td>
                            <td>{row.mobile_number || "-"}</td>
                            <td>{row.reg_no || "-"}</td>
                            <td>{row.assigned_teacher_name || "-"}</td>
                            <td>{isTruthyStatus(row.enrolled) ? "Yes" : "No"}</td>
                            <td>{Number(row.admission_paid || 0)}</td>
                          </>
                        ) : (
                          <>
                            <td>{activeReportType === "staff" ? row.refer_by || "-" : row.lead_name || "-"}</td>
                            <td>{row.mobile_number || "-"}</td>
                            <td>{row.email_id || "-"}</td>
                            <td>{row.reg_no || "-"}</td>
                            {activeReportType !== "digital" && (
                              <td>{activeReportType === "staff" ? row.lead_name || "-" : row.assigned_teacher_name || "-"}</td>
                            )}
                            {activeReportType !== "digital" && <td>{row.entry_type || "-"}</td>}
                            <td>{formatDateCell(row.date)}</td>
                            <td>{formatTimeCell(row.lead_time)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default FrontDeskReport;
