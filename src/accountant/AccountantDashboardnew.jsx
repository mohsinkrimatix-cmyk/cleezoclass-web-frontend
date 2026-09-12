import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import IncomeForm5 from "../shared/IncomeformTwo.jsx";
import DiscountsPanel from "./Accounatant_FeesManagement_Discounts.jsx";
import DashboardLayout from "../components/DashboardLayout.jsx";
import "./FrontDesk_Tickets.css";
import "./dashboardGlobal.css"
import "./PopupStyles.css";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";

import collectFeeIcon from "../assets/collect.png";
import addFeeIcon from "../assets/Navbar-AddFee.png";
import expenseIcon from "../assets/Navbar-Expenses.png";


import reportIcon from "../assets/Reports.png";
import dashboardIcon from "../assets/Dashboard.png";
import addStudentIcon from "../assets/Enrollment.png";
import createFeeIcon from "../assets/create-fee.png";

import { FaEdit, FaUser } from "react-icons/fa";
import TaskOfTheDay from "../shared/TaskOfTheDay.tsx";

import addFeesIcon from "../assets/add-fee.png";
import assistantIcon from "../assets/Assistant.png";
import logoab from "../assets/logoab.png";
import clogo from "../assets/Cleezo Class C logo.png"
import userAvatar from "../assets/user.png";
import premiumIcon from "../assets/Go Premium.png";
import GlobalLoader from "../shared/GlobelLoading.tsx";
import { FiHelpCircle } from "react-icons/fi";
import { FiDownload } from "react-icons/fi";
import HelpCenter from "../shared/HelpCenter.jsx";
import ErrorPopup from "../shared/ErrorPopup";

const ADMIN_API_BASE = "https://cleezoclass.com:4000/api/admin";
const API_BASE_URL = "https://cleezoclass.com:4000";
const PREMIUM_SUPPORT_MESSAGE =
  "Premium content is available after activation. For more details, contact our support team: supprteam@gmail.com";

const TRANSACTION_METADATA_KEYS = new Set([
  "id",
  "studentname",
  "student_name",
  "student",
  "name",
  "class_name",
  "classname",
  "class",
  "section",
  "paiddate",
  "paid_date",
  "payment_date",
  "record_date",
  "created_at",
  "paymentmode",
  "payment_mode",
  "transaction_id",
  "receiptnumber",
  "receipt_number",
  "receipt_date",
  "academic_year",
  "fee_type",
  "amount_paid",
  "paid_amount",
  "total_paid",
]);

const normalizeInstallmentFeeKey = (value = "") => {
  const normalized = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/fees?$/, "");
  return normalized === "tution" ? "tuition" : normalized;
};

const toTitleCase = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b[a-z0-9]/g, (char) => char.toUpperCase());

// Keep the outstanding popup in sync with the payment screen: student-level
// installment columns take precedence over generic fee-type definitions.
const buildStudentInstallmentMap = (rows = []) => {
  const grouped = {};
  const genericPattern = /^Installment(\d+)_(Amount|Paid|Fine|Deadline|Date|Deadline_Date)$/i;
  const dynamicPattern = /^([a-zA-Z0-9_]+)_installment_(\d+)(?:_(amount|total|paid|fine|deadline|date|deadline_date))?$/i;

  const getRow = (feeKey, installmentNo) => {
    if (!grouped[feeKey]) grouped[feeKey] = [];
    let installment = grouped[feeKey].find((item) => item.installmentNo === installmentNo);
    if (!installment) {
      installment = { installmentNo, amount: 0, paid: 0, fine: 0, deadlineDate: "" };
      grouped[feeKey].push(installment);
    }
    return installment;
  };

  const applyValue = (installment, suffix, value) => {
    const field = String(suffix || "amount").toLowerCase();
    const numericValue = Number(value) || 0;
    if (field === "amount" || field === "total") installment.amount = Math.max(Number(installment.amount) || 0, numericValue);
    else if (field === "paid") installment.paid = Number((Number(installment.paid) + numericValue).toFixed(2));
    else if (field === "fine") installment.fine = Math.max(Number(installment.fine) || 0, numericValue);
    else if (value && !installment.deadlineDate) installment.deadlineDate = value;
  };

  (Array.isArray(rows) ? rows : []).forEach((source) => {
    if (!source || typeof source !== "object") return;
    const defaultFeeKey = normalizeInstallmentFeeKey(
      source.fee_type || source.feeType || source.FeeType || source.feeName || source.fee_name || source.type || "tuition"
    );
    const hasDynamicColumns = Object.keys(source).some((key) => dynamicPattern.test(key));

    Object.entries(source).forEach(([key, value]) => {
      const dynamicMatch = key.match(dynamicPattern);
      if (dynamicMatch) {
        const feeKey = normalizeInstallmentFeeKey(dynamicMatch[1]);
        if (feeKey) applyValue(getRow(feeKey, Number(dynamicMatch[2])), dynamicMatch[3], value);
        return;
      }
      const genericMatch = key.match(genericPattern);
      if (genericMatch && defaultFeeKey && !hasDynamicColumns) {
        applyValue(getRow(defaultFeeKey, Number(genericMatch[1])), genericMatch[2], value);
      }
    });
  });

  Object.values(grouped).forEach((installments) =>
    installments.sort((a, b) => a.installmentNo - b.installmentNo)
  );
  return grouped;
};

const hasConfiguredInstallmentAmounts = (rows = []) =>
  Array.isArray(rows) &&
  rows.some((row) => Number(row?.amount ?? row?.installmentAmount ?? row?.Amount ?? 0) > 0);

const mergeInstallmentPlanWithPayments = (planRows = [], paymentRows = []) => {
  const paymentsByNumber = (Array.isArray(paymentRows) ? paymentRows : []).reduce((map, row, index) => {
    const installmentNo = Number(row?.installmentNo || row?.installment || row?.id || index + 1);
    const existing = map.get(installmentNo) || {};
    map.set(installmentNo, {
      ...existing,
      ...row,
      paid: Number(
        (Number(existing?.paid || existing?.Paid || 0) + Number(row?.paid || row?.Paid || row?.paidAmount || 0)).toFixed(2)
      ),
    });
    return map;
  }, new Map());

  return (Array.isArray(planRows) ? planRows : []).map((row, index) => {
    const installmentNo = Number(row?.installmentNo || row?.installment || row?.id || index + 1);
    const payment = paymentsByNumber.get(installmentNo);
    return {
      ...row,
      installmentNo,
      paid: Number(payment?.paid || payment?.Paid || 0),
    };
  });
};

const dedupeInstallmentRows = (rows = []) => {
  const installmentsByNumber = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row, index) => {
    if (!row || typeof row !== "object") return;

    const installmentNo = Number(row?.installmentNo || row?.installment || row?.id || index + 1);
    if (!Number.isFinite(installmentNo) || installmentNo <= 0) return;

    const existing = installmentsByNumber.get(installmentNo) || {};
    installmentsByNumber.set(installmentNo, {
      ...existing,
      ...row,
      installmentNo,
      amount: Math.max(Number(existing?.amount || 0), Number(row?.amount || row?.installmentAmount || 0)),
      installmentAmount: Math.max(
        Number(existing?.installmentAmount || existing?.amount || 0),
        Number(row?.installmentAmount || row?.amount || 0)
      ),
      originalAmount: Math.max(Number(existing?.originalAmount || 0), Number(row?.originalAmount || 0)),
      discountedAmount: Math.max(Number(existing?.discountedAmount || 0), Number(row?.discountedAmount || 0)),
      paid: Math.max(Number(existing?.paid || 0), Number(row?.paid || row?.Paid || row?.paidAmount || 0)),
      deadlineDate: existing?.deadlineDate || row?.deadlineDate || row?.dueDate || row?.installmentDate || "",
      dueDate: existing?.dueDate || row?.dueDate || row?.deadlineDate || row?.installmentDate || "",
      installmentDate: existing?.installmentDate || row?.installmentDate || row?.deadlineDate || row?.dueDate || "",
    });
  });

  return Array.from(installmentsByNumber.values()).sort(
    (a, b) => Number(a.installmentNo || 0) - Number(b.installmentNo || 0)
  );
};

const getInstallmentAmountTotal = (rows = []) =>
  (Array.isArray(rows) ? rows : []).reduce((sum, row) => {
    const amount = Number(row?.amount ?? row?.installmentAmount ?? row?.Amount ?? 0);
    return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
  }, 0);

const getInstallmentPaidTotal = (rows = []) =>
  (Array.isArray(rows) ? rows : []).reduce((sum, row) => {
    const paid = Number(row?.paid ?? row?.Paid ?? row?.paidAmount ?? 0);
    return sum + (Number.isFinite(paid) && paid > 0 ? paid : 0);
  }, 0);

const applyDiscountToInstallmentRows = (rows = [], discountAmount = 0) => {
  const installments = Array.isArray(rows) ? rows : [];
  const discount = Math.max(Number(discountAmount) || 0, 0);
  const grossTotal = installments.reduce((sum, row) => {
    const amount = Number(row?.amount ?? row?.installmentAmount ?? row?.Amount ?? 0);
    return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
  }, 0);

  if (!installments.length || grossTotal <= 0 || discount <= 0) {
    return installments;
  }

  const netTotal = Math.max(grossTotal - discount, 0);
  let allocatedNetTotal = 0;

  return installments.map((row, index) => {
    const grossAmount = Math.max(Number(row?.amount ?? row?.installmentAmount ?? row?.Amount ?? 0) || 0, 0);
    const isLast = index === installments.length - 1;
    const discountedAmount = isLast
      ? Math.max(netTotal - allocatedNetTotal, 0)
      : Number(((grossAmount / grossTotal) * netTotal).toFixed(2));

    allocatedNetTotal = Number((allocatedNetTotal + discountedAmount).toFixed(2));

    return {
      ...row,
      grossAmount,
      originalAmount: grossAmount,
      amount: discountedAmount,
    };
  });
};

// Fee records can store the same installment payment in both the legacy
// InstallmentN_Paid column and the fee-specific *_installment_N_paid column.
// Keep the larger representation so the due list sees installment payments
// without counting those mirrored columns twice.
const getInstallmentPaidTotalForRow = (row = {}) => {
  let legacyPaid = 0;
  const feeSpecificPaid = new Map();

  Object.entries(row || {}).forEach(([key, rawValue]) => {
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value <= 0) return;

    if (/^Installment\d+_Paid$/i.test(key)) {
      legacyPaid += value;
      return;
    }

    const match = key.match(/^(.+)_installment_(\d+)_paid$/i);
    if (!match) return;
    const feeKey = normalizeInstallmentFeeKey(match[1]);
    feeSpecificPaid.set(feeKey, (feeSpecificPaid.get(feeKey) || 0) + value);
  });

  const dynamicPaid = Array.from(feeSpecificPaid.values()).reduce((sum, value) => sum + value, 0);
  return Math.max(legacyPaid, dynamicPaid);
};

const assistantActionItems = [
  {
    title: "Top Unpaid Student Follow-up",
    detail: "Reduce overdue fee risk by contacting highest due students first.",
    procedure: [
      "Open Unpaid Students list and sort by due amount descending.",
      "Call guardian and confirm exact pending amount and due date.",
      "Share payment link or branch counter details by WhatsApp/SMS.",
      "Record follow-up status: Paid / Promise date / No response.",
      "Escalate no-response cases after 2 follow-ups to management.",
    ],
  },
  {
    title: "Discount Verification and Approval",
    detail: "Ensure discounts are valid, approved, and correctly posted.",
    procedure: [
      "Open Discount Students section and verify discount amount per student.",
      "Check approval source (principal/management) and reason.",
      "Cross-check fee ledger after discount application.",
      "Reject or hold requests missing approval proof.",
      "Publish final approved list for finance records.",
    ],
  },
  {
    title: "Weekly High Expense Review",
    detail: "Control cash outflow by reviewing top expense categories every week.",
    procedure: [
      "Open expense summary and identify top 3 categories.",
      "Compare this week spend vs last week trend.",
      "Flag unusual jumps greater than 20%.",
      "Validate bills/vouchers and payment method used.",
      "Send weekly variance summary to Chief/Admin.",
    ],
  },
  {
    title: "Balance Recovery Plan",
    detail: "Convert pending balances into collections through daily tracking.",
    procedure: [
      "Track class-wise pending balance each morning.",
      "Assign collector/caller with target amount for the day.",
      "Send reminder messages before school closing time.",
      "Update paid entries immediately after confirmation.",
      "Carry forward unresolved dues to next-day priority list.",
    ],
  },
  {
    title: "Fee Posting Audit",
    detail: "Prevent mismatches between collected amount and ledger entries.",
    procedure: [
      "Match cash/UPI/bank receipts with system entries.",
      "Verify installment, transport, and exam fee splits.",
      "Check discount and concession adjustments.",
      "Correct posting errors before day-end close.",
      "Keep audit note for corrected transactions.",
    ],
  },
];

const CLASS_PRIORITY = {
  prekg: -4,
  "pre kg": -4,
  prenursery: -3,
  "pre nursery": -3,
  nursery: -2,
  lkg: -1,
  ukg: -0.5,
};

const getClassSortValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return Number.MAX_SAFE_INTEGER;

  if (CLASS_PRIORITY[normalized] !== undefined) {
    return CLASS_PRIORITY[normalized];
  }

  const numericMatch = normalized.match(/\d+/);
  if (numericMatch) {
    return Number(numericMatch[0]);
  }

  const romanMap = {
    i: 1,
    ii: 2,
    iii: 3,
    iv: 4,
    v: 5,
    vi: 6,
    vii: 7,
    viii: 8,
    ix: 9,
    x: 10,
    xi: 11,
    xii: 12,
  };

  const romanValue = romanMap[normalized.replace(/[^ivx]/g, "")];
  return romanValue ?? Number.MAX_SAFE_INTEGER;
};

const sortClassLabels = (items) =>
  [...items].sort((a, b) => {
    const sortA = getClassSortValue(a);
    const sortB = getClassSortValue(b);

    if (sortA !== sortB) return sortA - sortB;

    return String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const sortSectionLabels = (items) =>
  [...items].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

const getExplicitRemainingAmount = (row) => {
  const candidates = [
    row?.totalRemaining,
    row?.Total_Remaining,
    row?.remainingAmount,
    row?.Remaining_Amount,
    row?.Total_Due,
    row?.Due_Amount,
    row?.dueAmount,
    row?.unpaidAmount,
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return 0;
};

const getDynamicTotalBySuffix = (row, suffix, excludedKeys = []) => {
  const excluded = new Set(excludedKeys.map((key) => String(key || "").toLowerCase()));

  return Object.entries(row || {}).reduce((sum, [key, value]) => {
    if (!key || typeof key !== "string") return sum;
    const normalizedKey = key.toLowerCase();
    if (excluded.has(normalizedKey)) return sum;
    if (
      normalizedKey.endsWith(`_${suffix}`) &&
      !normalizedKey.startsWith("total_") &&
      !normalizedKey.startsWith("dynamicfee")
    ) {
      const parsed = Number(value);
      return sum + (Number.isFinite(parsed) ? parsed : 0);
    }
    return sum;
  }, 0);
};


const downloadApp = () => {
    window.location.href = `${API_BASE_URL}/api/download/my-app`;
};

const getStudentCompositeKey = (row) =>
  [
    String(row?.StudentName || row?.studentName || row?.name || row?.Student_Name || "").trim().toLowerCase(),
    String(row?.Class_name || row?.class_name || row?.className || row?.FeeClass || "")
      .replace(/^Class\s+/i, "")
      .trim()
      .toLowerCase(),
    String(row?.Section || row?.section || row?.sectionName || row?.FeeSection || "").trim().toLowerCase(),
  ].join("|");

const stripStudentDiscountFields = (row = {}) => {
  if (!row || typeof row !== "object") return row;

  return Object.entries(row).reduce((cleanRow, [key, value]) => {
    const normalizedKey = String(key || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (
      normalizedKey === "discount" ||
      normalizedKey === "total_discount" ||
      normalizedKey === "concession" ||
      normalizedKey === "feediscount" ||
      normalizedKey === "discount_amount" ||
      normalizedKey.endsWith("_discount") ||
      normalizedKey.endsWith("discount")
    ) {
      cleanRow[key] = 0;
      return cleanRow;
    }

    if (normalizedKey === "dynamicfeediscounts" || normalizedKey === "dynamic_fee_discounts") {
      cleanRow[key] = {};
      return cleanRow;
    }

    if (Array.isArray(value) && (normalizedKey === "dynamicfeebreakdown" || normalizedKey === "dynamic_fee_breakdown")) {
      cleanRow[key] = value.map((entry) => stripStudentDiscountFields(entry));
      return cleanRow;
    }

    cleanRow[key] = value;
    return cleanRow;
  }, {});
};

const getInstallmentDueFromRows = (rows = [], planRows = []) => {
  const paymentMap = buildStudentInstallmentMap(rows);
  const planMap = buildStudentInstallmentMap(planRows);
  const feeKeys = new Set([...Object.keys(planMap), ...Object.keys(paymentMap)]);

  return [...feeKeys].reduce((totalDue, feeKey) => {
    const planInstallments = planMap[feeKey] || [];
    const paymentInstallments = paymentMap[feeKey] || [];
    const installments = hasConfiguredInstallmentAmounts(planInstallments)
      ? mergeInstallmentPlanWithPayments(planInstallments, paymentInstallments)
      : paymentInstallments;
    const feeTypeDue = (installments || []).reduce((sum, installment) => {
      const amount = Number(installment?.amount || installment?.Amount || 0);
      const paid = Number(installment?.paid || installment?.Paid || installment?.paidAmount || 0);
      if (!Number.isFinite(amount) || amount <= 0) return sum;
      return sum + Math.max(amount - (Number.isFinite(paid) ? paid : 0), 0);
    }, 0);

    return totalDue + feeTypeDue;
  }, 0);
};

const stripClassPrefix = (value) =>
  String(value || "")
    .replace(/^Class\s+/i, "")
    .trim();

const normalizeFeeLabel = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeFeeColumnBase = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\bfees?\b/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  if (!normalized) return "";
  return /^[0-9]/.test(normalized) ? `fee_${normalized}` : normalized;
};

const ROW_METADATA_KEYS = new Set([
  "id",
  "student_id",
  "studentid",
  "student_name",
  "studentname",
  "name",
  "class_name",
  "classname",
  "section",
  "section_name",
  "father_name",
  "mobile_no",
  "phone_no",
  "admission_no",
  "admission_number",
  "reg_no",
  "roll_no",
  "receipt_no",
  "receipt_number",
  "gender",
  "email",
  "record_date",
  "payment_date",
  "created_at",
  "updated_at",
  "discount",
  "discount_amount",
  "total_amount",
  "total_due",
  "due_amount",
  "unpaid_amount",
  "completefee",
  "complete_fee",
  "updatedcompletefee",
  "updatedcomplete_fee",
  "totalfee",
  "total_fee",
  "total_expected",
  "fee_expected",
  "paid_amount",
  "total_paid",
  "paidamount",
  "remaining_amount",
]);

const STATIC_FEE_KEYS = new Set([
  "class_fee",
  "classfee",
  "admission",
  "admission_fee",
  "books",
  "book",
  "book_fee",
  "uniform",
  "uniform_fee",
  "bus",
  "transport",
  "transport_fee",
  "exam",
  "exam_fee",
  "others",
  "other",
  "other_fee",
  "tuition",
  "tuition_fee",
  "sports",
  "sport",
  "stationary",
  "stationery",
  "guides",
  "guide",
  "belt",
  "tie",
  "saving",
  "savings",
  "school",
  "school_fee",
    "transportation", "transportation_fee", "Transport_Fee", "Transport_Fees",

]);
const helpSections = [
  {
    id: "fee-types",
    title: "Create Fee Types",
    videos: [
      {
        title: "How to Create Fee Types",
        url: "https://www.youtube.com/embed/qhDN4HQOfNY?rel=0",
      },
      {
        title: "Fee Type Best Practices",
        url: "https://www.youtube.com/embed/qhDN4HQOfNY?rel=0",
      },
    ],
  },

  {
    id: "add-fees",
    title: "Add Fees",
    videos: [
      {
        title: "Add Fees to Classes",
        url: "https://www.youtube.com/embed/qhDN4HQOfNY?rel=0",
      },
    ],
  },

  {
    id: "collect-fees",
    title: "Collect Fees",
    videos: [
      {
        title: "Collect Student Fees",
        url: "https://www.youtube.com/embed/qhDN4HQOfNY?rel=0",
      },
    ],
  },
];


const AccountantDashboard = () => {
  const navigate = useNavigate();
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [summary, setSummary] = useState({
    gross: 0,
    concession: 0,
    netPayable: 0,
    totalPaid: 0,
    totalDue: 0,
    studentCount: 0,
    progress: 0,
    busDue: 0,
    booksDue: 0,
    tuitionDue: 0,
    savingPaid: 0,
    savingDue: 0,
  });
  const [unpaidStudents, setUnpaidStudents] = useState([]);
  const [allFeeStatusRows, setAllFeeStatusRows] = useState([]);
  const [studentDirectory, setStudentDirectory] = useState([]);
  const [classSectionStudents, setClassSectionStudents] = useState([]);
  const [paymentSummaryMap, setPaymentSummaryMap] = useState({});
  const [selectedStudentPaymentSummary, setSelectedStudentPaymentSummary] = useState(null);
  const [selectedStudentInstallments, setSelectedStudentInstallments] = useState([]);
  const [feeTypeInstallmentsMap, setFeeTypeInstallmentsMap] = useState({});
  const [selectedClassSectionFeeRows, setSelectedClassSectionFeeRows] = useState([]);
  const [selectedClassFeeStructure, setSelectedClassFeeStructure] = useState(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState("");
  const [outstandingSearchTerm, setOutstandingSearchTerm] = useState("");
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
  const [paymentPopupTab, setPaymentPopupTab] = useState("student-data");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [schoolLogo, setSchoolLogo] = useState("/default-logo.png");
  const [schoolName, setSchoolName] = useState("Loading...");
  const [instituteAddress, setInstituteAddress] = useState("");
  const [profileEditOpen, setProfileEditOpen] = useState(false);
    const [paymentPopupStudentRecord, setPaymentPopupStudentRecord] = useState(null);
  
    const [studentDiscountRows, setStudentDiscountRows] = useState([]);
  
  const [profileForm, setProfileForm] = useState({
    gender: "",
    phone_no: "",
    email: "",
  });
  const [profileSaveStatus, setProfileSaveStatus] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [isStudentManagementPopupOpen, setIsStudentManagementPopupOpen] = useState(false);
  const [ticketActiveTab, setTicketActiveTab] = useState("staff");
  const [ticketTeachers, setTicketTeachers] = useState([]);
  const [ticketLoadingTeachers, setTicketLoadingTeachers] = useState(false);
  const [ticketSelectedTeacherId, setTicketSelectedTeacherId] = useState(null);
  const [ticketClassList, setTicketClassList] = useState([]);
  const [ticketSectionMap, setTicketSectionMap] = useState([]);
  const [ticketSelectedClassSection, setTicketSelectedClassSection] = useState("");
  const [ticketClassName, setTicketClassName] = useState("");
  const [ticketSection, setTicketSection] = useState("");
  const [ticketStudents, setTicketStudents] = useState([]);
  const [ticketSearchTerm] = useState("");
  const [ticketDropdownLoading, setTicketDropdownLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketTarget, setTicketTarget] = useState(null);
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState("");
  const [ticketError, setTicketError] = useState("");
  const [openHelpSection, setOpenHelpSection] = useState(null);
  const[isHelpOpen,setIsHelpOpen]=useState(false)
  const [premiumPopupMessage, setPremiumPopupMessage] = useState("");
  const userRole = localStorage.getItem("userRole")
  const [isAddFeesPopupOpen, setIsAddFeesPopupOpen] = useState(false);
  const [addFeesPanelTab, setAddFeesPanelTab] = useState("fees");
  const [addFeePreview, setAddFeePreview] = useState({
    className: "",
    section: "",
    rows: [],
  });
  const [hoveredInstallmentFeeId, setHoveredInstallmentFeeId] = useState(null);
  const [popupSelection, setPopupSelection] = useState({ className: "", sectionName: "" });
  const [previousYearDue, setPreviousYearDue] = useState(0);
  const [dynamicFeeTypes, setDynamicFeeTypes] = useState([]);
  const [isCreateFeeTypePopupOpen, setIsCreateFeeTypePopupOpen] = useState(false);
  const [isAssistantPopupOpen, setIsAssistantPopupOpen] = useState(false);
  const [isOutgoingStudentsPopupOpen, setIsOutgoingStudentsPopupOpen] = useState(false);
  const [isDiscountsPopupOpen] = useState(false);
  const [discountStudents, setDiscountStudents] = useState([]);
  const [discountStudentsLoading, setDiscountStudentsLoading] = useState(false);
  const [createFeeTypeLoading, setCreateFeeTypeLoading] = useState(false);
  const [createFeeTypeError, setCreateFeeTypeError] = useState("");
  const [addFeeFormClass, setAddFeeFormClass] = useState("");
 const [addFeeFormSection, setAddFeeFormSection] = useState("");
  const [newFeeTypeForm, setNewFeeTypeForm] = useState({
    feesType: "",
    scope: "",
    frequency: "",
    installments: "",
  });
  const previousYearLabel = "2024-2025";

  const toNumber = useCallback((value) => {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }, []);

const getAnyNumber = useCallback(
  (row, keys) => {
    if (!row) return 0;

    // Create a case-insensitive map of the row's keys
    const rowLower = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.toLowerCase(), v])
    );

    // First pass: look for non-zero values in order
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      const value = rowLower[lowerKey];
      if (value !== undefined && value !== null) {
        const num = toNumber(value);
        if (num !== 0) {
          return num; // Return first non-zero value found
        }
      }
    }

    // Second pass: if no non-zero found, return first valid value (including zero)
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      const value = rowLower[lowerKey];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return toNumber(value);
      }
    }

    return 0;
  },
  [toNumber]
);
  const getDiscountTotalForRow = useCallback(
    (row) => {
      const explicitDiscount = getAnyNumber(row, [
        "Discount",
        "Total_Discount",
        "Concession",
        "feeDiscount",
        "Discount_Amount",
        "discount_amount",
        "discount",
      ]);

      if (explicitDiscount > 0) return explicitDiscount;

      return getDynamicTotalBySuffix(row, "discount", [
        "discount",
        "Discount",
        "Total_Discount",
        "Concession",
        "feeDiscount",
        "Discount_Amount",
        "discount_amount",
      ]);
    },
    [getAnyNumber]
  );

  const getFeeTypeDiscountForRow = useCallback(
    (row, feeType) => {
      const normalized = String(feeType || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

      const discountKeys = [
        `${normalized}_discount`,
        `${normalized}_Discount`,
        `${normalized}Discount`,
      ];

      if (normalized === "class_fee" || normalized === "classfee") {
        return getDiscountTotalForRow(row);
      }

      if (normalized === "books" || normalized === "book" || normalized === "books_fee" || normalized === "book_fee") {
        discountKeys.push("fee_discount", "books_discount", "book_discount");
      }

      if (normalized === "tuition") {
        discountKeys.push("tuition_discount");
      }

      if (normalized === "bus") {
        discountKeys.push("bus_discount");
      }

      return getAnyNumber(row, discountKeys) || 0;
    },
    [getAnyNumber, getDiscountTotalForRow]
  );

  const activeFeeTypeKeys = useMemo(
    () =>
      new Set(
        (dynamicFeeTypes || [])
          .flatMap((fee) => {
            const feeName = fee?.columnBase || fee?.feeName || fee?.feesType || fee?.label || fee?.type || "";
            return [normalizeFeeLabel(feeName), normalizeFeeColumnBase(feeName)];
          })
          .filter(Boolean)
      ),
    [dynamicFeeTypes]
  );
  const individualDynamicFeeTypeKeys = useMemo(
    () =>
      new Set(
        (dynamicFeeTypes || [])
          .filter((fee) => String(fee?.scope || "").trim().toLowerCase() === "individual")
          .flatMap((fee) => {
            const feeName = fee?.columnBase || fee?.feeName || fee?.feesType || fee?.label || "";
            return [normalizeFeeLabel(feeName), normalizeFeeColumnBase(feeName)];
          })
          .filter(Boolean)
      ),
    [dynamicFeeTypes]
  );
  const isKnownFeeKey = useCallback(
    (value) => {
      const key = normalizeFeeLabel(value);
      const columnKey = normalizeFeeColumnBase(value);
      return Boolean(
        (key && (STATIC_FEE_KEYS.has(key) || activeFeeTypeKeys.has(key))) ||
          (columnKey && (STATIC_FEE_KEYS.has(columnKey) || activeFeeTypeKeys.has(columnKey)))
      );
    },
    [activeFeeTypeKeys]
  );
  const isDeletedFeeTypeKey = useCallback(
    (value) => {
      const key = normalizeFeeLabel(value);
      if (!key || key === "class_fee" || key === "classfee") return false;
      return !isKnownFeeKey(key);
    },
    [isKnownFeeKey]
  );
  const isIndividualFeeKey = useCallback(
    (value) => {
      const key = normalizeFeeLabel(value);
      return Boolean(key && individualDynamicFeeTypeKeys.has(key));
    },
    [individualDynamicFeeTypeKeys]
  );

  const getFeeColumnTotals = useCallback(
    (row) => {
      const totals = {
        active: { expected: 0, paid: 0, discount: 0, due: 0 },
        individual: { expected: 0, paid: 0, discount: 0, due: 0 },
        deleted: { expected: 0, paid: 0, discount: 0, due: 0 },
      };
      const seenFeeAmounts = new Map();

      const addAmount = (bucketName, kind, amount, feeKey = "") => {
        if (!Number.isFinite(amount) || amount === 0) return;
        const canonicalKey = normalizeFeeColumnBase(feeKey) || normalizeFeeLabel(feeKey);
        if (canonicalKey) {
          const seenKey = `${bucketName}:${kind}:${canonicalKey}`;
          const previousAmount = seenFeeAmounts.get(seenKey);
          if (Number.isFinite(previousAmount)) {
            if (Math.abs(previousAmount) >= Math.abs(amount)) return;
            totals[bucketName][kind] -= previousAmount;
          }
          seenFeeAmounts.set(seenKey, amount);
        }
        totals[bucketName][kind] += amount;
      };

      const classifyEntry = (rawKey, rawValue) => {
        const normalizedKey = normalizeFeeLabel(rawKey);
        if (!normalizedKey || ROW_METADATA_KEYS.has(normalizedKey)) return;
        if (normalizedKey.startsWith("total_") || normalizedKey.startsWith("dynamicfee")) return;

        const numericValue = Number(rawValue);
        if (!Number.isFinite(numericValue) || numericValue === 0) return;

        const baseKey = normalizedKey
          .replace(/_(paid|due|discount|amount|total)$/, "")
          .replace(/(paid|due|discount|amount|total)$/, "");
        const canonicalBaseKey = normalizeFeeColumnBase(baseKey || normalizedKey) || baseKey || normalizedKey;
        const bucketName = isIndividualFeeKey(baseKey || normalizedKey)
          ? "individual"
          : isKnownFeeKey(baseKey || normalizedKey)
            ? "active"
            : "deleted";

        if (normalizedKey.endsWith("_paid") || normalizedKey === "paid_amount" || normalizedKey === "total_paid") {
          addAmount(bucketName, "paid", numericValue, canonicalBaseKey);
        } else if (
          normalizedKey.endsWith("_due") ||
          normalizedKey === "due_amount" ||
          normalizedKey === "remaining_amount" ||
          normalizedKey === "unpaid_amount"
        ) {
          addAmount(bucketName, "due", numericValue, canonicalBaseKey);
        } else if (
          normalizedKey.endsWith("_discount") ||
          normalizedKey === "discount_amount" ||
          normalizedKey === "fee_discount"
        ) {
          addAmount(bucketName, "discount", numericValue, canonicalBaseKey);
        } else {
          addAmount(bucketName, "expected", numericValue, canonicalBaseKey);
        }
      };

      const hasBreakdownRows =
        Array.isArray(row?.dynamicFeeBreakdown) ||
        Array.isArray(row?.individualFeeAssignments) ||
        (row?.dynamicFeeTotals && typeof row.dynamicFeeTotals === "object") ||
        (row?.dynamicFeePaidTotals && typeof row.dynamicFeePaidTotals === "object") ||
        (row?.dynamicFeeDiscounts && typeof row.dynamicFeeDiscounts === "object");

      if (hasBreakdownRows) {
        const summaryMaps = [
          { source: row?.dynamicFeeTotals, kind: "expected" },
          { source: row?.dynamicFeePaidTotals, kind: "paid" },
          { source: row?.dynamicFeeDiscounts, kind: "discount" },
        ];

        summaryMaps.forEach(({ source, kind }) => {
          if (!source || Array.isArray(source) || typeof source !== "object") return;
          Object.entries(source).forEach(([entryKey, entryValue]) => {
            const numericValue = Number(entryValue);
            if (!Number.isFinite(numericValue) || numericValue === 0) return;
            const bucketName = isIndividualFeeKey(entryKey)
              ? "individual"
              : isKnownFeeKey(entryKey)
                ? "active"
                : "deleted";
            addAmount(bucketName, kind, numericValue, entryKey);
          });
        });

        [...(Array.isArray(row?.dynamicFeeBreakdown) ? row.dynamicFeeBreakdown : []),
          ...(Array.isArray(row?.individualFeeAssignments) ? row.individualFeeAssignments : [])].forEach((entry) => {
          const entryKey = entry?.key || entry?.label || entry?.type || entry?.feeName || entry?.columnBase || "";
          const entryAmount = getAnyNumber(entry, [
            "total",
            "amount",
            "amountTotal",
            "assignedAmount",
            "completeFee",
            "value",
          ]);
          const entryPaid = getAnyNumber(entry, ["paid", "paidAmount", "amountPaid", "paid_total"]);
          const entryDiscount = getAnyNumber(entry, ["discount", "discountAmount", "amountDiscount", "feeDiscount"]);
          const entryDue = getAnyNumber(entry, ["remaining", "due", "dueAmount"]);
          const bucketName = isIndividualFeeKey(entryKey)
            ? "individual"
            : isKnownFeeKey(entryKey)
              ? "active"
              : "deleted";

          addAmount(bucketName, "expected", entryAmount, entryKey);
          addAmount(bucketName, "paid", entryPaid, entryKey);
          addAmount(bucketName, "discount", entryDiscount, entryKey);
          addAmount(bucketName, "due", entryDue, entryKey);
        });
        return totals;
      }

      Object.entries(row || {}).forEach(([rawKey, rawValue]) => {
        classifyEntry(rawKey, rawValue);
      });

      return totals;
    },
    [getAnyNumber, isIndividualFeeKey, isKnownFeeKey]
  );

  const getFeeTotalsForRow = useCallback(
    (row) => {
      const expectedDirect = getAnyNumber(row, [
        "CompleteFee",
        "complete_fee",
        "completeFee",
        "UpdatedCompleteFee",
        "updatedCompleteFee",
        "updated_complete_fee",
        "Total_Expected",
        "total_expected",
        "TotalFee",
        "total_fee",
        "Total_Fee",
        "Fee_Expected",
        "fee_expected",
      ]);

      const paidDirect = getAnyNumber(row, [
        "Paid_Amount",
        "paid_amount",
        "Total_Paid",
        "totalPaid",
        "TuitionPaid",
        "dynamicFeePaidTotal",
      ]);

      const feeColumnTotals = getFeeColumnTotals(row);
      const deletedExpected = feeColumnTotals.deleted.expected;
      const deletedPaid = feeColumnTotals.deleted.paid;
      const deletedDiscount = feeColumnTotals.deleted.discount;
      const individualExpected = feeColumnTotals.individual.expected;
      const individualPaid = feeColumnTotals.individual.paid;
      const individualDiscount = feeColumnTotals.individual.discount;
      const activeExpected = feeColumnTotals.active.expected;
      const activePaid = feeColumnTotals.active.paid;

      const expectedFromParts =
        toNumber(row.Admission_fees) +
        toNumber(row.Books_Uniform_Expected) +
        toNumber(row.Bus_Expected) +
        toNumber(row.TuitionFee) +
        toNumber(row.books) +
        toNumber(row.book) +
        toNumber(row.Book_Fee) +
        toNumber(row.books_fee) +
        toNumber(row.book_fee) +
        toNumber(row.StudentBooksFee) +
        toNumber(row.StudentExamFee) +
        toNumber(row.Uniform_fees) +
        toNumber(row.Exam_fees) +
        toNumber(row.BusFee) +
        toNumber(row.OtherFee) +
        toNumber(row.ResidentialCompleteFee) +
        toNumber(row.Saving_Fees) +
        toNumber(row.saving_fees) +
        toNumber(row.Savings_Fees) +
        toNumber(row.savings_fees) +
        activeExpected;

      const paidFromParts =
        toNumber(row.Admission_paid) +
        toNumber(row.Books_Uniform_Paid) +
        toNumber(row.Bus_Paid) +
        toNumber(row.books_paid) +
        toNumber(row.uniform_paid) +
        toNumber(row.exam_paid) +
        toNumber(row.bus_paid) +
        toNumber(row.others_paid) +
        toNumber(row.Saving_paid) +
        toNumber(row.saving_paid) +
        toNumber(row.Savings_paid) +
        toNumber(row.savings_paid) +
        toNumber(row.sports_paid) +
        toNumber(row.stationary_paid) +
        toNumber(row.tie_paid) +
        toNumber(row.tie_fee_paid) +
        toNumber(row.belt_paid) +
        toNumber(row.guides_paid) +
        toNumber(row.others_description_paid) +
        getDynamicTotalBySuffix(row, "paid", [
          "admission_paid",
          "books_uniform_paid",
          "bus_paid",
          "books_paid",
          "uniform_paid",
          "exam_paid",
          "others_paid",
          "saving_paid",
          "savings_paid",
          "sports_paid",
          "stationary_paid",
          "tie_paid",
          "tie_fee_paid",
          "belt_paid",
          "guides_paid",
          "others_description_paid",
        ]) +
        activePaid;

      const discount = Math.max(getDiscountTotalForRow(row) - deletedDiscount - individualDiscount, 0);
      const expected =
        expectedDirect > 0 ? Math.max(expectedDirect - deletedExpected - individualExpected, 0) : expectedFromParts;
      const effectiveExpected = Math.max(expected - discount, 0);
      const paid = paidDirect > 0 ? Math.max(paidDirect - deletedPaid - individualPaid, 0) : paidFromParts;
      let unpaid = Math.max(effectiveExpected - paid, 0);
      const explicitRemaining = getExplicitRemainingAmount(row);

      if (discount <= 0 && explicitRemaining > 0) {
        unpaid = explicitRemaining;
      }

      if (effectiveExpected === 0 && paid === 0) {
        const dueAlt = getAnyNumber(row, [
          "Due_Amount",
          "Total_Due",
          "unpaidAmount",
          "Pending_Amount",
          "Previous_Fee_Due",
          "previous_fee_due",
        ]);
        if (dueAlt > 0) unpaid = dueAlt;
        else if (explicitRemaining > 0) unpaid = explicitRemaining;
      }

      return { expected: effectiveExpected, paid, unpaid };
    },
    [getAnyNumber, getDiscountTotalForRow, getFeeColumnTotals, toNumber]
  );

  const normalizeUserPhoto = (rawPhoto) => {
    if (!rawPhoto) return "";
    if (typeof rawPhoto === "string") {
      const trimmed = rawPhoto.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("data:")) return trimmed;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
      return `data:image/jpeg;base64,${trimmed}`;
    }
    if (rawPhoto?.data) {
      const bytes = rawPhoto.data?.data || rawPhoto.data;
      if (Array.isArray(bytes)) {
        const binary = bytes.map((byte) => String.fromCharCode(byte)).join("");
        return `data:image/jpeg;base64,${btoa(binary)}`;
      }
    }
    return "";
  };

  const formatINR = useCallback(
    (value) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value || 0),
    []
  );

  const formatDisplayDate = useCallback((value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const getStudentName = useCallback(
    (student) => student?.StudentName || student?.name || student?.studentName || "Student",
    []
  );

  const getDueAmount = useCallback(
    (student) =>
      Number(student?.Due_Amount ?? student?.Total_Due ?? student?.dueAmount ?? student?.unpaidAmount ?? 0),
    []
  );

  const getDiscountAmount = useCallback(
    (student) => Number(student?.Discount ?? student?.discount ?? student?.Discount_Amount ?? 0),
    []
  );

  const getStudentClassName = useCallback(
    (student) => String(student?.Class_name || student?.class_name || student?.className || "").trim(),
    []
  );

  const getStudentSectionName = useCallback(
    (student) => String(student?.Section || student?.section || student?.sectionName || "").trim(),
    []
  );

  const normalizeClassLabel = useCallback(
    (value) => String(value || "").replace(/^Class\s+/i, "").trim().toLowerCase(),
    []
  );
  const normalizeSectionLabel = useCallback((value) => String(value || "").trim().toLowerCase(), []);
  const formatFeeTypeLabel = useCallback((value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return "Fee";
    return normalized
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);
  const allowedCustomFeeKeys = useMemo(() => {
    const keys = new Set([
      "sports",
      "stationary",
      "stationery",
      "guides",
      "belt",
      "tie",
      "tie_fee",
      "library",
      "books",
      "book",
      "transport",
      "transport_fee",
      "hostel",
      "mess",
      "saving",
      "savings",
      "school",
      "school_fee",
    ]);

    (dynamicFeeTypes || []).forEach((fee) => {
      const rawFeeName = fee?.columnBase || fee?.feeName || fee?.feesType || "";
      const normalized = String(rawFeeName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
      const columnBase = normalizeFeeColumnBase(rawFeeName);
      if (normalized) keys.add(normalized);
      if (columnBase) keys.add(columnBase);
    });

    return keys;
  }, [dynamicFeeTypes]);
  const schoolCode = useMemo(() => localStorage.getItem("schoolCode") || "", []);
  const normalizeTicketStudentList = useCallback((payload) => {
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.students)
        ? payload.students
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

    return list
      .map((student, index) => ({
        ...student,
        id: student?.id ?? student?.student_id ?? student?.studentId ?? index,
        name: student?.name ?? student?.student_name ?? student?.full_name ?? `Student ${index + 1}`,
      }))
      .filter((student) => student.id != null);
  }, []);
  const getTicketClassLabel = useCallback((cls) => {
    if (cls == null) return "";
    if (typeof cls === "string" || typeof cls === "number") return String(cls);
    return cls.class_name || cls.className || cls.class || cls.name || cls.label || "";
  }, []);
  const getTicketTeacherId = useCallback(
    (teacher, index) =>
      teacher?.teacher_id ??
      teacher?.id ??
      teacher?.user_id ??
      teacher?.staff_id ??
      teacher?.employee_id ??
      teacher?.emp_id ??
      teacher?.teacherId ??
      teacher?.teacherID ??
      `staff-${index}`,
    []
  );
  const getTicketTeacherName = useCallback(
    (teacher) => teacher?.teacher_name ?? teacher?.name ?? teacher?.full_name ?? "Staff",
    []
  );
  const getProgressRingColor = useCallback((value) => {
    const percent = Math.max(0, Math.min(Number(value) || 0, 100));
    if (percent < 25) return "#f36b79";
    if (percent < 50) return "#f0a43a";
    if (percent < 75) return "#4e9d68";
    return "#2d7ff9";
  }, []);
  const renderProgressRing = useCallback(
    (value, label, className = "") => {
      const percent = Math.max(0, Math.min(Number(value) || 0, 100));
      const color = getProgressRingColor(percent);
      const radius = 20;
      const strokeWidth = 2.5;
      const center = 22;
      const angle = (percent / 100) * 360;
      const startX = center;
      const startY = center - radius;
      const endAngle = ((angle - 90) * Math.PI) / 180;
      const endX = center + radius * Math.cos(endAngle);
      const endY = center + radius * Math.sin(endAngle);
      const largeArcFlag = angle > 180 ? 1 : 0;
      const arcPath =
        percent <= 0
          ? ""
          : angle >= 359.999
            ? `M ${center} ${center - radius}
               A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius}`
            : `M ${startX} ${startY}
               A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;

      return (
        <div className={`accountant-progress-ring ${className}`.trim()}>
          <svg
            viewBox="0 0 44 44"
            width="100%"
            height="100%"
            aria-hidden="true"
            style={{ transform: "rotate(-90deg)", position: "absolute", inset: 0, overflow: "visible" }}
          >
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#e3e3e3"
              strokeWidth={strokeWidth}
            />
            {arcPath ? (
              <path
                d={arcPath}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            ) : null}
          </svg>
          <div className="accountant-progress-ring-inner">{label}</div>
        </div>
      );
    },
    [getProgressRingColor]
  );

  const buildFeeRowsFromStudentSummary = useCallback(
    (row) => {
      if (!row) return [];

      const paidDate = formatDisplayDate(
        row?.paidDate || row?.record_date || row?.payment_date || row?.Receipt_Date || row?.createdAt || row?.date || ""
      );

      const feeConfigs = [
        {
          feeType: "Class Fee",
          totalKeys: ["CompleteFee", "complete_fee", "UpdatedCompleteFee", "updatedCompleteFee"],
          paidKeys: ["Paid_Amount", "paid_amount", "Total_Paid", "totalPaid", "dynamicFeePaidTotal"],
          dueKeys: ["Remaining_Amount", "remaining_amount", "Total_Due", "Due_Amount"],
        },
       
      
      ];

      const normalizeFeeKey = (value) =>
        String(value || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_+|_+$/g, "");

      const coveredKeys = new Set(
        feeConfigs.flatMap((config) => [
          ...config.totalKeys.map((key) => normalizeFeeKey(key)),
          ...config.paidKeys.map((key) => normalizeFeeKey(key)),
          ...config.dueKeys.map((key) => normalizeFeeKey(key)),
          normalizeFeeKey(config.feeType),
        ])
      );
      const customRows = [];

      const standardRows = feeConfigs
        .map((config, index) => {
          const rawTotalAmount = getAnyNumber(row, config.totalKeys);
          const paidAmount = getAnyNumber(row, config.paidKeys);
          const discountAmount = getFeeTypeDiscountForRow(row, config.feeType);
          const totalAmount = rawTotalAmount;
          const dueAmount =
            getAnyNumber(row, config.dueKeys) ||
            (totalAmount > 0 || paidAmount > 0 ? Math.max(totalAmount - discountAmount - paidAmount, 0) : 0);
          const hasDetailedFeeValues = [...config.totalKeys, ...config.paidKeys].some((key) => {
            const value = row?.[key];
            return value !== undefined && value !== null && String(value).trim() !== "" && Number(value) !== 0;
          });

          if (!hasDetailedFeeValues) return null;
          if (totalAmount <= 0 && paidAmount <= 0 && dueAmount <= 0) return null;

          return {
            id: `${getStudentCompositeKey(row)}-${config.feeType}-${index}`,
            studentName: row?.StudentName || row?.studentName || row?.name || row?.Student_Name || "Student",
            className: row?.Class_name || row?.class_name || row?.className || "-",
            section: row?.Section || row?.section || row?.sectionName || "-",
            feeType: config.feeType,
            discountAmount,
            totalAmount,
            paidAmount,
            dueAmount,
            paymentDate: paidDate,
          };
        })
        .filter(Boolean);

      const dynamicRows = (dynamicFeeTypes || [])
        .map((fee, index) => {
          const rawFeeName = String(fee?.feeName || fee?.feesType || fee?.label || "").trim();
          const columnBaseKey = normalizeFeeColumnBase(fee?.columnBase || rawFeeName);
          const normalizedKey = columnBaseKey || normalizeFeeKey(fee?.columnBase || rawFeeName);
          const displayKey = normalizeFeeKey(fee?.columnBase || rawFeeName);
          if (!normalizedKey) return null;
          if (coveredKeys.has(normalizedKey) || coveredKeys.has(displayKey)) return null;

          const aliases = [
            `${normalizedKey}_total`,
            `${normalizedKey}_amount`,
            normalizedKey,
            displayKey,
            `${displayKey}_total`,
            `${displayKey}_amount`,
            rawFeeName,
          ].filter(Boolean);

          const totalAmount = getAnyNumber(row, aliases);
          const paidAmount = getAnyNumber(row, [
            `${normalizedKey}_paid`,
            `${normalizedKey}Paid`,
            `${displayKey}_paid`,
            `${displayKey}Paid`,
            `${rawFeeName}_paid`,
            `${rawFeeName}Paid`,
          ]);
          const discountAmount = getAnyNumber(row, [
            `${normalizedKey}_discount`,
            `${normalizedKey}Discount`,
            `${displayKey}_discount`,
            `${displayKey}Discount`,
            `${rawFeeName}_discount`,
            `${rawFeeName}Discount`,
          ]);
          const dueAmount = getAnyNumber(row, [
            `${normalizedKey}_due`,
            `${normalizedKey}Due`,
            `${displayKey}_due`,
            `${displayKey}Due`,
            `${rawFeeName}_due`,
            `${rawFeeName}Due`,
          ]) || Math.max(totalAmount - discountAmount - paidAmount, 0);

          if (totalAmount <= 0 && paidAmount <= 0 && discountAmount <= 0 && dueAmount <= 0) {
            return null;
          }

          return {
            id: `${getStudentCompositeKey(row)}-${normalizedKey}-${index}`,
            studentName: row?.StudentName || row?.studentName || row?.name || row?.Student_Name || "Student",
            className: row?.Class_name || row?.class_name || row?.className || "-",
            section: row?.Section || row?.section || row?.sectionName || "-",
            feeType: formatFeeTypeLabel(rawFeeName || normalizedKey),
            discountAmount,
            totalAmount,
            paidAmount,
            dueAmount,
            paymentDate: paidDate,
          };
        })
        .filter(Boolean);

      Object.entries(row || {}).forEach(([rawKey, rawValue]) => {
        const normalizedKey = normalizeFeeKey(rawKey);
        if (!normalizedKey) return;
        if (coveredKeys.has(normalizedKey)) return;

        if (
          normalizedKey === "id" ||
          normalizedKey === "student_id" ||
          normalizedKey === "studentname" ||
          normalizedKey === "student_name" ||
          normalizedKey === "name" ||
          normalizedKey === "class_name" ||
          normalizedKey === "classname" ||
          normalizedKey === "section" ||
          normalizedKey === "section_name" ||
          normalizedKey === "father_name" ||
          normalizedKey === "mobile_no" ||
          normalizedKey === "phone_no" ||
          normalizedKey === "admission_no" ||
          normalizedKey === "gender" ||
          normalizedKey === "email" ||
          normalizedKey === "discount" ||
          normalizedKey === "record_date" ||
          normalizedKey === "payment_date" ||
          normalizedKey === "created_at" ||
          normalizedKey === "updated_at" ||
          normalizedKey === "completefee" ||
          normalizedKey === "complete_fee" ||
          normalizedKey.startsWith("total_") ||
          normalizedKey.startsWith("dynamicfee") ||
          normalizedKey.endsWith("_paid") ||
          normalizedKey.endsWith("_due") ||
          normalizedKey.endsWith("_discount")
        ) {
          return;
        }

        if (!allowedCustomFeeKeys.has(normalizedKey)) return;

        const totalAmount = Number(rawValue);

        if (!Number.isFinite(totalAmount) || totalAmount <= 0) return;

        const paidAmount = getAnyNumber(row, [
          `${rawKey}_paid`,
          `${rawKey}_Paid`,
          `${normalizedKey}_paid`,
          `${normalizedKey}_Paid`,
        ]);
        const discountAmount = getAnyNumber(row, [
          `${rawKey}_discount`,
          `${rawKey}_Discount`,
          `${rawKey}Discount`,
          `${normalizedKey}_discount`,
          `${normalizedKey}_Discount`,
          `${normalizedKey}Discount`,
        ]);
        const dueAmount = getAnyNumber(row, [
          `${rawKey}_due`,
          `${rawKey}_Due`,
          `${normalizedKey}_due`,
          `${normalizedKey}_Due`,
        ]) || Math.max(totalAmount - discountAmount - paidAmount, 0);

        const label = formatFeeTypeLabel(rawKey);
        const rowIdKey = `${getStudentCompositeKey(row)}-${normalizedKey}`;

        customRows.push({
          id: rowIdKey,
          studentName: row?.StudentName || row?.studentName || row?.name || row?.Student_Name || "Student",
          className: row?.Class_name || row?.class_name || row?.className || "-",
          section: row?.Section || row?.section || row?.sectionName || "-",
          feeType: label,
          discountAmount,
          totalAmount,
          paidAmount,
          dueAmount,
          paymentDate: paidDate,
        });
      });

      const combinedRows = [...standardRows, ...dynamicRows, ...customRows];
      const dedupedRows = [];
      const seenRows = new Set();

      combinedRows.forEach((item) => {
        const feeDedupeKey = normalizeFeeColumnBase(item?.feeType) || normalizeFeeLabel(item?.feeType);
        const dedupeKey = [
          String(item?.studentName || "").trim().toLowerCase(),
          String(item?.className || "").trim().toLowerCase(),
          String(item?.section || "").trim().toLowerCase(),
          feeDedupeKey,
        ].join("|");

        if (seenRows.has(dedupeKey)) return;
        seenRows.add(dedupeKey);
        dedupedRows.push(item);
      });

      return dedupedRows;
    },
    [
      allowedCustomFeeKeys,
      dynamicFeeTypes,
      formatDisplayDate,
      formatFeeTypeLabel,
      getAnyNumber,
      getFeeTypeDiscountForRow,
    ]
  );

  const safeSessionSet = useCallback((key, value) => {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Ignore session storage quota errors to avoid breaking dashboard render.
    }
  }, []);

  useEffect(() => {
    const lockClass = "accountant-dashboard-scroll-lock";
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const app = document.querySelector(".App");

    html.classList.add(lockClass);
    body.classList.add(lockClass);
    root?.classList.add(lockClass);
    app?.classList.add(lockClass);

    return () => {
      html.classList.remove(lockClass);
      body.classList.remove(lockClass);
      root?.classList.remove(lockClass);
      app?.classList.remove(lockClass);
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;
    const fromDate = "2000-01-01";
    const toDate = "2099-12-31";
    const summaryCacheKey = `accountantDashboardSummary:${schoolCode}`;
    const unpaidCacheKey = `accountantDashboardUnpaid:${schoolCode}`;
    const previousDueCacheKey = `accountantDashboardPreviousDue:${schoolCode}`;

    try {
      const cachedSummary = sessionStorage.getItem(summaryCacheKey);
      const cachedUnpaid = sessionStorage.getItem(unpaidCacheKey);
      const cachedPreviousDue = sessionStorage.getItem(previousDueCacheKey);

      if (cachedSummary) {
        try {
          setSummary(JSON.parse(cachedSummary));
        } catch {
          // ignore stale cache parse errors
        }
      }
      if (cachedUnpaid) {
        try {
          setUnpaidStudents(JSON.parse(cachedUnpaid));
        } catch {
          // ignore stale cache parse errors
        }
      }
      if (cachedPreviousDue) {
        const parsed = Number(cachedPreviousDue);
        if (Number.isFinite(parsed)) setPreviousYearDue(parsed);
      }

      setDashboardLoading(true);
      const [unpaidResult, summaryResult, allFeesResult, feeTypesResult, studentsResult] = await Promise.allSettled([
        axios.get("https://cleezoclass.com:4000/api/fee-records", {
          params: { type: "TotalDueList", schoolCode, fromDate, toDate },
        }),
        axios.get("https://cleezoclass.com:4000/api/fees-summary-ledgerData", {
          params: { schoolCode, year: "All", className: "All", section: "All" },
        }),
        axios.get("https://cleezoclass.com:4000/api/fee-records", {
          params: { type: "AllFeesStatusReport", schoolCode, fromDate, toDate },
        }),
        axios.get("https://cleezoclass.com:4000/api/fee-types", {
          params: { schoolCode, _t: Date.now() },
        }),
        axios.get("https://cleezoclass.com:4000/students-details", {
          params: { schoolCode },
        }),
      ]);

      const unpaid =
        unpaidResult.status === "fulfilled" && Array.isArray(unpaidResult.value.data)
          ? unpaidResult.value.data
          : [];
      const allFeesRows =
        allFeesResult.status === "fulfilled" && Array.isArray(allFeesResult.value.data)
          ? allFeesResult.value.data
          : [];
      setAllFeeStatusRows(allFeesRows);
      const createdFeeTypes =
        feeTypesResult.status === "fulfilled" && Array.isArray(feeTypesResult.value.data?.data)
          ? feeTypesResult.value.data.data
          : [];
      const masterStudents =
        studentsResult?.status === "fulfilled" && Array.isArray(studentsResult.value?.data?.students)
          ? studentsResult.value.data.students
          : [];

      setUnpaidStudents(unpaid);
      setStudentDirectory(masterStudents);
      const createdFeeTypesNormalized = createdFeeTypes
        .filter((item) => String(item?.feeName || "").trim() !== "")
        .map((item) => ({
          id: item?.id,
          feeName: item?.feeName || "",
          feesType: item?.feesType || "Custom Fee",
          scope: item?.scope || "All",
          frequency: item?.frequency || "One time",
          installments: item?.installments || 1,
        }));
      setDynamicFeeTypes(createdFeeTypesNormalized);

      let busDue = 0;
      let booksDue = 0;
      let tuitionDue = 0;
      let savingDue = 0;
      let savingPaid = 0;

      unpaid.forEach((row) => {
        const busDueRow =
          getAnyNumber(row, ["Bus_Due", "bus_due", "Transport_Due", "transport_due", "Bus_Pending", "BusDue"]) ||
          Math.max(toNumber(row.Bus_Expected || row.BusFee) - toNumber(row.Bus_Paid || row.bus_paid), 0);

        const booksDueRow =
          getAnyNumber(row, ["Book_Due", "Books_Due", "books_due", "book_due", "BookDue", "Books_Pending"]) ||
          Math.max(
            toNumber(row.Books_Uniform_Expected || row.StudentBooksFee || row.Book_Fee) -
              toNumber(row.Books_Uniform_Paid || row.books_paid),
            0
          );

        const tuitionDueRow =
          getAnyNumber(row, ["tuition_due","Tuition_Due",  "TuitionDue", "tuitionDue", "Tuition_Pending"]) ||
          Math.max(toNumber(row.TuitionFee || row.Tuition_Fee) - toNumber(row.TuitionPaid || row.paid_amount), 0);
        const savingDueRow =
          getAnyNumber(row, ["Saving_Due", "saving_due", "Savings_Due", "savings_due"]) ||
          Math.max(
            getAnyNumber(row, ["Saving_Fees", "saving_fees", "Savings_Fees", "savings_fees"]) -
              getAnyNumber(row, ["Saving_paid", "saving_paid", "Savings_paid", "savings_paid"]),
            0
          );

        busDue += busDueRow;
        booksDue += booksDueRow;
        tuitionDue += tuitionDueRow;
        savingDue += savingDueRow;
      });

      savingPaid = allFeesRows.reduce(
        (sum, row) => sum + getAnyNumber(row, ["Saving_paid", "saving_paid", "Savings_paid", "savings_paid"]),
        0
      );

      const mobileSummary =
        summaryResult.status === "fulfilled" && summaryResult.value?.data?.success
          ? summaryResult.value.data
          : null;
      const totalDueFromUnpaid = unpaid.reduce(
        (sum, row) => sum + getAnyNumber(row, ["Due_Amount", "Total_Due", "unpaidAmount", "Pending_Amount"]),
        0
      );

      let gross = mobileSummary ? toNumber(mobileSummary.totalAmount) : 0;
      let concession = mobileSummary ? toNumber(mobileSummary.totalDiscount) : 0;
      let totalPaid = mobileSummary ? toNumber(mobileSummary.totalPaid) : 0;
      let studentCount = mobileSummary ? toNumber(mobileSummary.studentCount) : masterStudents.length;
      let netPayable = Math.max(gross - concession, 0);
      let totalDue = mobileSummary
        ? toNumber(mobileSummary.balance) || Math.max(netPayable - totalPaid, 0)
        : totalDueFromUnpaid;

      const summaryNeedsFallback =
        (gross === 0 && concession === 0 && totalPaid === 0) || !mobileSummary;
      const grossLooksMissing = gross === 0 && allFeesRows.length > 0;

      if ((summaryNeedsFallback || grossLooksMissing) && allFeesRows.length > 0) {
        try {
          const fees = allFeesRows;

          let grossFallback = 0;
          let totalPaidFallback = 0;
          let concessionFallback = 0;
          let totalDueFallback = 0;

          fees.forEach((row) => {
            const totals = getFeeTotalsForRow(row);
            const rowDiscount = getDiscountTotalForRow(row);
            grossFallback += totals.expected + rowDiscount;
            totalPaidFallback += totals.paid;
            totalDueFallback += totals.unpaid;
            concessionFallback += rowDiscount;
          });

          gross = grossFallback;
          concession = concessionFallback;
          totalPaid = totalPaidFallback;
          netPayable = Math.max(gross - concession, 0);
          totalDue = totalDueFallback || Math.max(netPayable - totalPaid, 0);
          if (!studentCount) {
            studentCount = masterStudents.length || unpaid.length || 0;
          }
        } catch {
          // keep zero/default values when fallback API is unavailable
        }
      }
      const progress = netPayable > 0 ? (totalPaid / netPayable) * 100 : 0;
      const nextSummary = {
        gross,
        concession,
        netPayable,
        totalPaid,
        totalDue,
        studentCount,
        progress: Math.min(Math.max(progress, 0), 100),
        busDue,
        booksDue,
        tuitionDue,
        savingPaid,
        savingDue,
      };

      setSummary(nextSummary);
      safeSessionSet(summaryCacheKey, JSON.stringify(nextSummary));

      const compactUnpaid = (unpaid || []).slice(0, 400).map((row, index) => ({
        id: row?.id ?? row?.StudentId ?? row?.Admission_Number ?? `row-${index}`,
        StudentName: row?.StudentName || row?.studentName || row?.name || "",
        Class_name: row?.Class_name || row?.class_name || row?.className || "",
        Section: row?.Section || row?.section || "",
        unpaidAmount: getAnyNumber(row, ["unpaidAmount", "Due_Amount", "Total_Due", "Pending_Amount"]),
        Bus_Due: getAnyNumber(row, ["Bus_Due", "transport_due", "Transport_Due"]),
        Book_Due: getAnyNumber(row, ["Book_Due", "Books_Due", "books_due"]),
        Tuition_Due: getAnyNumber(row, ["Tuition_Due", "tuition_due", "TuitionDue"]),
      }));
      safeSessionSet(unpaidCacheKey, JSON.stringify(compactUnpaid));

      // Background fetch: do not block initial dashboard paint.
      void axios
        .get("https://cleezoclass.com:4000/api/fee-records-alldata", {
          params: { schoolCode, type: "PreviousPaidPendingReport", fromDate, toDate },
        })
        .then((res) => {
          const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
          const due = rows.reduce((sum, row) => {
            const rowDue = getAnyNumber(row, [
              "Previous_Fee_Due",
              "Previous_Pending",
              "previous_due",
              "previousDue",
              "previous_fee_due",
            ]);
            return sum + rowDue;
          }, 0);
          setPreviousYearDue(due);
          safeSessionSet(previousDueCacheKey, String(due));
        })
        .catch(() => {
          // keep cached/current previous due value if background call fails
        });
    } catch (error) {
      console.error("Failed to load accountant dashboard data:", error);
      setSummary({
        gross: 0,
        concession: 0,
        netPayable: 0,
        totalPaid: 0,
        totalDue: 0,
        progress: 0,
        busDue: 0,
        booksDue: 0,
        tuitionDue: 0,
        savingPaid: 0,
        savingDue: 0,
        studentCount: 0,
      });
      setUnpaidStudents([]);
      setAllFeeStatusRows([]);
      setStudentDirectory([]);
      setDynamicFeeTypes([]);
    } finally {
      setDashboardLoading(false);
    }
  }, [getAnyNumber, getDiscountTotalForRow, getFeeColumnTotals, getFeeTotalsForRow, safeSessionSet, toNumber]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

 useEffect(() => {
  console.log("useEffect triggered=======================: Checking popup states and schoolCode...");

  if (!isAssistantPopupOpen && !(isAddFeesPopupOpen && addFeesPanelTab === "discount") && !isDiscountsPopupOpen) {
    console.log("No relevant popup open. Skipping fetch.");
    return;
  }

  const schoolCode = localStorage.getItem("schoolCode");
  console.log("Retrieved schoolCode:", schoolCode);

  if (!schoolCode) {
    console.log("No schoolCode found. Resetting discountStudents to []. ");
    setDiscountStudents([]);
    return;
  }

  const fetchDiscountStudents = async () => {
    console.log("Fetching discount students for schoolCode:", schoolCode);
    try {
      setDiscountStudentsLoading(true);
      const { data } = await axios.get("https://cleezoclass.com:4000/api/discounted-students", {
        params: { schoolCode },
      });
      console.log("API response data:", data);
      const students = Array.isArray(data) ? data : [];
      console.log("Setting discountStudents:", students);
      setDiscountStudents(students);
    } catch (error) {
      console.error("Failed to load discount students:", error);
      setDiscountStudents([]);
    } finally {
      console.log("Fetch completed. Setting loading to false.");
      setDiscountStudentsLoading(false);
    }
  };

  fetchDiscountStudents();
}, [addFeesPanelTab, isAddFeesPopupOpen, isAssistantPopupOpen, isDiscountsPopupOpen]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || !selectedClassFilter || !selectedSectionFilter) {
      setSelectedClassFeeStructure(null);
      return;
    }

    axios
      .get(`https://cleezoclass.com:4000/feeStructure/${selectedClassFilter}`, {
        params: { schoolCode, section: selectedSectionFilter },
      })
      .then((res) => {
        setSelectedClassFeeStructure(res.data?.feeStructure || null);
      })
      .catch(() => {
        setSelectedClassFeeStructure(null);
      });
  }, [selectedClassFilter, selectedSectionFilter]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || !selectedClassFilter || !selectedSectionFilter) {
      setSelectedClassSectionFeeRows([]);
      return;
    }

    let isCancelled = false;

    axios
      .get("https://cleezoclass.com:4000/api/fee-payment-status", {
        params: {
          schoolCode,
          class_name: selectedClassFilter,
          section: selectedSectionFilter,
        },
      })
      .then((res) => {
        if (isCancelled) return;
        setSelectedClassSectionFeeRows(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (isCancelled) return;
        setSelectedClassSectionFeeRows([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedClassFilter, selectedSectionFilter]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || !selectedClassFilter || !selectedSectionFilter) {
      setPaymentSummaryMap({});
      return;
    }

    const studentsForSelectedClass = Array.isArray(classSectionStudents) ? classSectionStudents : [];

    if (!studentsForSelectedClass.length) {
      setPaymentSummaryMap({});
      return;
    }

    let isCancelled = false;

      Promise.all(
        studentsForSelectedClass.map(async (student) => {
          const studentId = student?.id ?? student?.student_id;
          if (!studentId) return null;

        try {
          const res = await axios.get(`https://cleezoclass.com:4000/api/payment/${studentId}`, {
            params: { schoolCode },
          });

          const paymentPayload = res?.data?.payments || res?.data?.payment || res?.data || null;
          if (!paymentPayload || typeof paymentPayload !== "object") return null;

          const key = getStudentCompositeKey({
            StudentName: paymentPayload?.studentName || paymentPayload?.StudentName || student?.name,
            Class_name: paymentPayload?.class || paymentPayload?.Class_name || student?.class_name,
            Section: paymentPayload?.section || paymentPayload?.Section || student?.section,
          });

          return [key, paymentPayload];
        } catch {
          return null;
        }
      })
    ).then((entries) => {
      if (isCancelled) return;
      const nextMap = {};
      entries.forEach((entry) => {
        if (!entry) return;
        const [key, value] = entry;
        if (key) nextMap[key] = value;
      });
      setPaymentSummaryMap(nextMap);
    });

    return () => {
      isCancelled = true;
    };
  }, [classSectionStudents, selectedClassFilter, selectedSectionFilter]);


  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    const resolvedClassName = stripClassPrefix(selectedClassFilter || "");
    const alternateClassName = String(selectedClassFilter || "").trim();
    const classCandidates = Array.from(
      new Set([resolvedClassName, alternateClassName].map((value) => stripClassPrefix(value || "")).filter(Boolean))
    );

    if (!schoolCode || !selectedClassFilter || !selectedSectionFilter || !classCandidates.length) {
      setClassSectionStudents([]);
      return;
    }

    let isCancelled = false;

    Promise.all(
      classCandidates.map((className) =>
        axios
          .get(`https://cleezoclass.com:4000/api/studentsNameAccountant/${encodeURIComponent(className)}`, {
            params: {
              schoolCode,
              section: selectedSectionFilter,
            },
          })
          .then((res) => (Array.isArray(res.data?.students) ? res.data.students : []))
          .catch(() => [])
      )
    ).then((results) => {
      if (isCancelled) return;

      const mergedByKey = new Map();
      results.flat().forEach((student) => {
        const key = [
          String(student?.id ?? student?.student_id ?? "").trim(),
          String(student?.name || student?.StudentName || student?.studentName || "").trim().toLowerCase(),
          String(student?.class_name || student?.Class_name || student?.className || "").trim().toLowerCase(),
          String(student?.section || student?.Section || student?.sectionName || "").trim().toLowerCase(),
        ].join("|");
        if (!key.replace(/\|/g, "").trim() || mergedByKey.has(key)) return;
        mergedByKey.set(key, student);
      });

      setClassSectionStudents(Array.from(mergedByKey.values()));
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedClassFilter, selectedSectionFilter]);

  const normalizedOutstandingStudents = useMemo(() => {
    const sourceStudents =
      selectedClassFilter && selectedSectionFilter && classSectionStudents.length
        ? classSectionStudents
        : studentDirectory;

    const masterList = (sourceStudents || []).map((student, index) => ({
      id: student?.id ?? student?.student_id ?? `student-${index}`,
      name:
        student?.name ||
        student?.StudentName ||
        student?.studentName ||
        student?.Student_Name ||
        "Student",
      regNo:
        student?.admission_no ||
        student?.Admission_Number ||
        student?.admission_number ||
        student?.id ||
        "N/A",
      className: student?.class_name || student?.Class_name || student?.className || "",
      section: student?.section || student?.Section || student?.sectionName || "",
    }));

    if (masterList.length > 0) {
      return masterList;
    }

    const fallbackFromUnpaid = (unpaidStudents || []).map((student, index) => ({
      id:
        student?.id ??
        student?.StudentId ??
        student?.student_id ??
        student?.Admission_Number ??
        `unpaid-${index}`,
      name:
        student?.StudentName ||
        student?.studentName ||
        student?.name ||
        student?.Student_Name ||
        "Student",
      regNo:
        student?.Admission_Number ||
        student?.admission_no ||
        student?.admission_number ||
        student?.id ||
        "N/A",
      className:
        student?.Class_name ||
        student?.class_name ||
        student?.className ||
        student?.FeeClass ||
        "",
      section:
        student?.Section ||
        student?.section ||
        student?.sectionName ||
        student?.FeeSection ||
        "",
    }));

    return fallbackFromUnpaid;
  }, [classSectionStudents, selectedClassFilter, selectedSectionFilter, studentDirectory, unpaidStudents]);

  const outstandingDueMap = useMemo(() => {
    const transactionDueMap = new Map();
    const explicitRemainingMap = new Map();

    (allFeeStatusRows || []).forEach((row) => {
      const individualAssignments = Array.isArray(row?.individualFeeAssignments)
        ? row.individualFeeAssignments.filter(Boolean)
        : [];

      if (individualAssignments.length > 0) {
        individualAssignments.forEach((assignment) => {
          const name = String(
            assignment?.studentName || assignment?.StudentName || assignment?.name || ""
          ).trim().toLowerCase();
          const className = String(
            assignment?.className || assignment?.Class_name || assignment?.class_name || ""
          ).trim().toLowerCase();
          const section = String(
            assignment?.section || assignment?.Section || assignment?.sectionName || ""
          ).trim().toLowerCase();
          const key = [name, className, section].join("|");
          if (!key.trim()) return;

          const amount = Math.max(0, getAnyNumber(assignment, ["amount", "Amount", "assignedAmount"]));
          if (amount <= 0) return;

          transactionDueMap.set(key, (transactionDueMap.get(key) || 0) + amount);
        });
        return;
      }

      const name =
        row?.StudentName ||
        row?.studentName ||
        row?.name ||
        row?.Student_Name ||
        "";
      const className = row?.Class_name || row?.class_name || row?.className || row?.FeeClass || "";
      const section = row?.Section || row?.section || row?.sectionName || row?.FeeSection || "";
      const totals = getFeeTotalsForRow(row);
      const dueAmount = Math.max(totals.unpaid, 0);
      const key = [
        String(name).trim().toLowerCase(),
        String(className).trim().toLowerCase(),
        String(section).trim().toLowerCase(),
      ].join("|");

      if (!key.trim()) return;

      const transactionPaid = getAnyNumber(row, ["amount_paid", "paid_amount"]);
      const explicitRemaining = getExplicitRemainingAmount(row);

      if (transactionPaid > 0 && explicitRemaining > 0) {
        return;
      }

      transactionDueMap.set(key, (transactionDueMap.get(key) || 0) + dueAmount);
    });

    (unpaidStudents || []).forEach((row) => {
      const name =
        row?.StudentName ||
        row?.studentName ||
        row?.name ||
        row?.Student_Name ||
        "";
      const className = row?.Class_name || row?.class_name || row?.className || row?.FeeClass || "";
      const section = row?.Section || row?.section || row?.sectionName || row?.FeeSection || "";
      const dueAmount = getAnyNumber(row, ["unpaidAmount", "Due_Amount", "Total_Due", "Pending_Amount"]);
      const explicitDueAmount = getExplicitRemainingAmount(row);
      const key = [
        String(name).trim().toLowerCase(),
        String(className).trim().toLowerCase(),
        String(section).trim().toLowerCase(),
      ].join("|");

      if (!key.trim()) return;

      if (explicitDueAmount > 0) {
        explicitRemainingMap.set(key, explicitDueAmount);
        return;
      }

      if (!explicitRemainingMap.has(key) && !transactionDueMap.has(key)) {
        transactionDueMap.set(key, dueAmount);
      }
    });

    const merged = new Map(transactionDueMap);
    explicitRemainingMap.forEach((value, key) => {
      merged.set(key, value);
    });

    return merged;
  }, [allFeeStatusRows, getAnyNumber, getFeeTotalsForRow, unpaidStudents]);

  const unpaidSummaryDueMap = useMemo(() => {
    const map = new Map();

    (unpaidStudents || []).forEach((row) => {
      const key = getStudentCompositeKey(row);
      if (!key.replace(/\|/g, "").trim()) return;

      const explicitDueAmount = getExplicitRemainingAmount(row);
      const dueAmount = getAnyNumber(row, ["unpaidAmount", "Due_Amount", "Total_Due", "Pending_Amount"]);
      const resolvedDue = explicitDueAmount > 0 ? explicitDueAmount : dueAmount;

      if (resolvedDue > 0 && !map.has(key)) {
        map.set(key, resolvedDue);
      }
    });

    return map;
  }, [getAnyNumber, unpaidStudents]);

  const groupedOutstandingStudents = useMemo(() => {
    const groups = new Map();

    normalizedOutstandingStudents.forEach((student, index) => {
      const key = String(student.id || "").trim() || [
        String(student.name || "").trim().toLowerCase(),
        String(student.className || "").trim().toLowerCase(),
        String(student.section || "").trim().toLowerCase(),
      ].join("|");
      const dueAmount = outstandingDueMap.get(key) || 0;

      const current = groups.get(key);
      if (!current) {
        groups.set(key, {
          ...student,
          id: student.id || `student-${index}`,
          dueAmount,
        });
      }
    });

    return [...groups.values()];
  }, [normalizedOutstandingStudents, outstandingDueMap]);

  const selectedClassDefaultDue = useMemo(() => {
    if (!selectedClassFeeStructure) return 0;
    const classFeeWithoutStudentDiscount = stripStudentDiscountFields(selectedClassFeeStructure);
    const resolvedClassTotals = getFeeTotalsForRow(classFeeWithoutStudentDiscount);

    console.log("[AccountantDashboard] class fee source resolved", {
      className: selectedClassFilter,
      section: selectedSectionFilter,
      resolvedClassFee: resolvedClassTotals.expected,
    });

    const classLevelDiscount = getDiscountTotalForRow(classFeeWithoutStudentDiscount);
    const resolvedDefaultDue = Math.max(resolvedClassTotals.expected, 0);

    console.log("[AccountantDashboard] class fee math", {
      className: selectedClassFilter,
      section: selectedSectionFilter,
      resolvedClassFee: resolvedClassTotals.expected,
      classLevelDiscount,
      resolvedDefaultDue,
      formula: `${resolvedClassTotals.expected} after discount = ${resolvedDefaultDue}`,
    });

    return resolvedDefaultDue;
  }, [getDiscountTotalForRow, getFeeTotalsForRow, selectedClassFeeStructure, selectedClassFilter, selectedSectionFilter]);

  // const paymentPopupStudentRecord = useMemo(() => {
  //   const targetName = String(popupSelection?.studentName || "").trim().toLowerCase();
  //   const targetClass = normalizeClassLabel(popupSelection?.className || "");
  //   const targetSection = normalizeSectionLabel(popupSelection?.sectionName || "");
  //   const sources = [studentDirectory, normalizedOutstandingStudents, unpaidStudents];

  //   for (const source of sources) {
  //     const found = (source || []).find((student) => {
  //       const studentName = String(
  //         student?.name || student?.StudentName || student?.studentName || student?.Student_Name || ""
  //       )
  //         .trim()
  //         .toLowerCase();
  //       const studentClass = normalizeClassLabel(
  //         student?.class_name || student?.Class_name || student?.className || student?.FeeClass || ""
  //       );
  //       const studentSection = normalizeSectionLabel(
  //         student?.section || student?.Section || student?.sectionName || student?.FeeSection || ""
  //       );

  //       const nameMatches = !targetName || studentName === targetName;
  //       const classMatches = !targetClass || studentClass === targetClass;
  //       const sectionMatches = !targetSection || studentSection === targetSection;
  //       return nameMatches && classMatches && sectionMatches;
  //     });

  //     if (found) return found;
  //   }

  //   return null;
  // }, [
  //   normalizeClassLabel,
  //   normalizeSectionLabel,
  //   popupSelection,
  //   studentDirectory,
  //   normalizedOutstandingStudents,
  //   unpaidStudents,
  // ]);

useEffect(() => {
  const schoolCode = localStorage.getItem("schoolCode");
  const studentId = popupSelection?.studentId;
  const hasUsableStudentId =
    studentId !== null &&
    studentId !== undefined &&
    String(studentId).trim() !== "" &&
    !String(studentId).startsWith("student-");

  if (!isPaymentPopupOpen || !schoolCode) {
    setSelectedStudentPaymentSummary(null);
    return;
  }

  if (!hasUsableStudentId) {
    setSelectedStudentPaymentSummary(null);
    return;
  }

  let isCancelled = false;

  axios
    .get(`https://cleezoclass.com:4000/api/payment/${studentId}`, {
      params: { schoolCode },
    })
    .then((paymentRes) => {
      if (isCancelled) return;

      const paymentPayload =
        paymentRes?.data?.payments ||
        paymentRes?.data?.payment ||
        paymentRes?.data ||
        null;

      setSelectedStudentPaymentSummary(
        paymentPayload && typeof paymentPayload === "object"
          ? paymentPayload
          : null
      );
    })
    .catch((error) => {
      console.error("Payment popup fetch failed", error);

      if (isCancelled) return;
      setSelectedStudentPaymentSummary(null);
    });

  return () => {
    isCancelled = true;
  };
}, [
  isPaymentPopupOpen,
  popupSelection?.studentId,
]);
  useEffect(() => {
    if (!popupSelection?.studentId || !popupSelection?.className || !popupSelection?.sectionName) {
      setSelectedStudentPaymentSummary(null);
      setPaymentPopupStudentRecord(null);
      setStudentDiscountRows([]); // 🔥 Reset discount rows too
      return;
    }

    const schoolCode = localStorage.getItem("schoolCode");
    const { studentId, className, sectionName, studentName } = popupSelection;

    console.log("🚀 FETCHING POPUP DATA FOR:", { studentId, className, sectionName, studentName });

    axios.get(`https://cleezoclass.com:4000/api/payment/${studentId}`, { params: { schoolCode } })
      .then(res => {
        console.log("✅ API 1 Response (Payment Summary):", res.data);
        setSelectedStudentPaymentSummary(res.data?.payments || res.data || {});
      })
      .catch(err => {
        console.error("❌ API 1 Error:", err.response?.data || err.message);
        setSelectedStudentPaymentSummary(null);
      });

    axios.get(`https://cleezoclass.com:4000/api/student-fee-details`, {
      params: { schoolCode, class: className, section: sectionName, name: studentName }
    })
      .then(res => {
        console.log("✅ API 2 Raw Response (Student Details):", res.data);
        const payload = res.data;

        const discountRows = Array.isArray(payload?.studentDetailRows) ? payload.studentDetailRows : [];
        setStudentDiscountRows(discountRows); // 🔥 THIS IS THE MISSING LINK!
        console.log("🔥 EXTRACTED DISCOUNT ROWS:", discountRows);

        const resolvedDetails = Array.isArray(payload) 
          ? payload.find(r => String(r.StudentName || "").toLowerCase().trim() === String(studentName || "").toLowerCase().trim()) 
          : (payload?.studentDetails || payload?.FeesDetails || payload);
          
        setPaymentPopupStudentRecord(resolvedDetails);
      })
      .catch(err => {
        console.error("❌ API 2 Error:", err.response?.data || err.message);
        setPaymentPopupStudentRecord(null);
        setStudentDiscountRows([]);
      });

  }, [popupSelection?.studentId, popupSelection?.className, popupSelection?.sectionName, popupSelection?.studentName]);;
useEffect(() => {
  const schoolCode = localStorage.getItem("schoolCode");
  const className = popupSelection?.className || paymentPopupStudentRecord?.class_name || "";
  const section = popupSelection?.sectionName || paymentPopupStudentRecord?.section || "";
  const studentName = popupSelection?.studentName || paymentPopupStudentRecord?.name || "";

  if (!isPaymentPopupOpen || !schoolCode || !className || !section) {
    setSelectedStudentInstallments([]);
    setFeeTypeInstallmentsMap({});
    return;
  }

  let isCancelled = false;

  const getFeeLookupKeys = (...values) => {
    const keys = new Set();

    values.forEach((value) => {
      if (value === null || value === undefined) return;
      const raw = String(value).trim();
      if (!raw) return;

      keys.add(raw);
      keys.add(normalizeFeeLabel(raw));
      keys.add(normalizeFeeColumnBase(raw));
      keys.add(normalizeFeeColumnBase(raw).replace(/_fees?$/, ""));
      keys.add(normalizeFeeLabel(raw).replace(/_fees?$/, ""));
    });

    return [...keys].filter(Boolean);
  };

  const normalizeInstallmentRows = (rows = []) =>
    (Array.isArray(rows) ? rows : [])
      .map((item, index) => ({
        ...item,
        installmentNo: Number(item?.installmentNo || item?.installment_no || index + 1),
        amount: Number(item?.amount || item?.Amount || 0),
        fine: Number(item?.fine || item?.Fine || 0),
        paid: Number(item?.paid || item?.Paid || item?.paidAmount || 0),
        deadlineDate:
          item?.deadlineDate ||
          item?.deadline_date ||
          item?.dueDate ||
          item?.date ||
          "",
      }))
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0)
      .sort((a, b) => Number(a.installmentNo) - Number(b.installmentNo));

  const addInstallmentsToMap = (map, keys, installments, { overwrite = false } = {}) => {
    const normalizedRows = normalizeInstallmentRows(installments);
    if (!normalizedRows.length) return;

    keys.filter(Boolean).forEach((key) => {
      if (overwrite || !Array.isArray(map[key]) || map[key].length === 0) {
        map[key] = normalizedRows;
      }
    });
  };

  const fetchInstallments = async () => {
    const installmentMap = {};

    try {
      const feesDetailsRes = await axios.get(
        "https://cleezoclass.com:4000/api/fees-details-installments",
        {
          params: {
            schoolCode,
            className,
            section,
            studentName,
          },
        }
      );

      const feesDetailsInstallments =
        feesDetailsRes?.data && typeof feesDetailsRes.data === "object"
          ? feesDetailsRes.data
          : {};

      Object.entries(feesDetailsInstallments).forEach(([feeKey, value]) => {
        const rows = Array.isArray(value)
          ? value
          : [
              ...(Array.isArray(value?.classWise) ? value.classWise : []),
              ...(Array.isArray(value?.studentWise) ? value.studentWise : []),
              ...(Array.isArray(value?.installments) ? value.installments : []),
            ];

        const keys = getFeeLookupKeys(
          feeKey,
          feeKey === "tuition" ? "class_fee" : "",
          feeKey === "school" ? "school_fee" : ""
        );

        addInstallmentsToMap(installmentMap, keys, rows, { overwrite: true });
      });
    } catch (error) {
      console.error("FeesDetails installment fetch failed", error);
    }

    if (isCancelled) return;

    setFeeTypeInstallmentsMap(installmentMap);
    setSelectedStudentInstallments(
      Object.values(installmentMap).flatMap((installments) =>
        Array.isArray(installments) ? installments : []
      )
    );
  };

  fetchInstallments();

  return () => {
    isCancelled = true;
  };
}, [
  isPaymentPopupOpen,
  paymentPopupStudentRecord?.class_name,
  paymentPopupStudentRecord?.name,
  paymentPopupStudentRecord?.section,
  popupSelection?.className,
  popupSelection?.sectionName,
  popupSelection?.studentName,
]);

  const paymentPopupStudentPaymentRows = useMemo(() => {
    const summary = selectedStudentPaymentSummary || {};
    const breakdownRows = Array.isArray(summary?.dynamicFeeBreakdown) ? summary.dynamicFeeBreakdown : [];
    const assignmentRows = Array.isArray(summary?.individualFeeAssignments) ? summary.individualFeeAssignments : [];
    const studentName = popupSelection?.studentName || paymentPopupStudentRecord?.name || "";
    const className = popupSelection?.className || paymentPopupStudentRecord?.class_name || "";
    const sectionName = popupSelection?.sectionName || paymentPopupStudentRecord?.section || "";

    const normalizeFeeLabel = (value) =>
      String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    const summaryByFeeKey = new Map();
    [...assignmentRows, ...breakdownRows].forEach((entry) => {
      const keys = [
        entry?.key,
        entry?.label,
        entry?.type,
        entry?.feeName,
        entry?.columnBase,
      ]
        .map((value) => normalizeFeeLabel(value))
        .filter(Boolean);

      keys.forEach((key) => {
        if (key === "amount" || key === "outstanding_amount") return;
        if (!summaryByFeeKey.has(key)) {
          summaryByFeeKey.set(key, entry);
        }
      });
    });

    const pickPositiveAmount = (overrideValue, fallbackValue) => {
      const override = Number(overrideValue);
      if (Number.isFinite(override) && override > 0) return override;
      const fallback = Number(fallbackValue);
      return Number.isFinite(fallback) ? fallback : 0;
    };

    const pickTotalAmount = (entry, fallbackValue = 0) => {
      const totalFields = [
        entry?.total,
        entry?.amountTotal,
        entry?.completeFee,
        entry?.totalAmount,
        entry?.assignedAmount,
        entry?.value,
      ];

      for (const value of totalFields) {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }

      const fallback = Number(fallbackValue);
      if (Number.isFinite(fallback) && fallback > 0) return fallback;

      const amount = Number(entry?.amount);
      return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
    };

    const getPaymentFeeDedupeKey = (feeType) => {
      const rawKey = normalizeFeeColumnBase(feeType) || normalizeFeeLabel(feeType);
      if (!rawKey || rawKey === "class_fee" || rawKey === "classfee") return rawKey;
      return rawKey.replace(/_fees?$/, "");
    };
    const getPaymentRowDedupeKey = (row = {}) => {
      const candidates = [
        row?.feeType,
        row?.key,
        row?.label,
        row?.type,
        row?.feeName,
        row?.columnBase,
      ];

      for (const candidate of candidates) {
        const key = getPaymentFeeDedupeKey(candidate);
        if (key) return key;
      }

      return "";
    };
    const getStudentFeeEvidenceKeys = (feeType) => {
      const baseKeys = [
        feeType,
        normalizeFeeLabel(feeType),
        normalizeFeeColumnBase(feeType),
        getPaymentFeeDedupeKey(feeType),
      ].filter(Boolean);
      const keys = new Set();

      baseKeys.forEach((key) => {
        const normalized = normalizeFeeLabel(key);
        const columnBase = normalizeFeeColumnBase(key);

        [normalized, columnBase, normalized.replace(/_fees?$/, ""), columnBase.replace(/_fees?$/, "")]
          .filter(Boolean)
          .forEach((item) => keys.add(item));
      });

      if (keys.has("transport")) {
        ["bus", "bus_fee", "bus_fees", "transport_fee", "transportation", "transportation_fee"].forEach((key) =>
          keys.add(key)
        );
      }

      if (keys.has("bus")) {
        ["transport", "transport_fee", "transportation", "transportation_fee"].forEach((key) => keys.add(key));
      }

      return keys;
    };
    const hasPositiveFeeValue = (source, evidenceKeys) => {
      if (!source || typeof source !== "object") return false;

      return Object.entries(source).some(([rawKey, rawValue]) => {
        const normalizedKey = normalizeFeeLabel(rawKey);
        const columnKey = normalizeFeeColumnBase(rawKey);
        const baseKey = normalizedKey
          .replace(/_(paid|due|discount|amount|total|fee|fees)$/, "")
          .replace(/(paid|due|discount|amount|total|fee|fees)$/, "");

        if (
          !evidenceKeys.has(normalizedKey) &&
          !evidenceKeys.has(columnKey) &&
          !evidenceKeys.has(baseKey)
        ) {
          return false;
        }

        const amount = Number(rawValue);
        return Number.isFinite(amount) && amount > 0;
      });
    };
    const hasStudentSpecificFeeEvidence = (feeRow) => {
      const key = getPaymentRowDedupeKey(feeRow);
      if (!key || key === "class" || key === "class_fee" || key === "classfee") return true;

      const evidenceKeys = getStudentFeeEvidenceKeys(feeRow?.feeType || key);

      for (const evidenceKey of evidenceKeys) {
        if (summaryByFeeKey.has(evidenceKey)) return true;
      }

      const sources = [
        selectedStudentPaymentSummary,
        paymentPopupStudentRecord,
        ...(Array.isArray(studentDiscountRows) ? studentDiscountRows : []),
      ];

      return sources.some((source) => hasPositiveFeeValue(source, evidenceKeys));
    };
    const getInstallmentsForFeeType = (feeType, feeTypeId) => {
      const feeTypeKey = getPaymentFeeDedupeKey(feeType);
      const matchingFeeType = (dynamicFeeTypes || []).find((fee) => {
        const feeName = fee?.columnBase || fee?.feeName || fee?.feesType || fee?.label || "";
        return getPaymentFeeDedupeKey(feeName) === feeTypeKey;
      });
      const lookupKeys = [
        feeTypeId,
        matchingFeeType?.id,
        feeTypeKey,
        normalizeFeeLabel(feeType),
      ].filter(Boolean);

      for (const key of lookupKeys) {
        const installments = feeTypeInstallmentsMap[key];
        if (Array.isArray(installments) && installments.length > 0) return installments;
      }

      return [];
    };

    const normalizePaymentRow = (entry, index, sourceTag) => {
      const totalAmount = pickTotalAmount(entry);
      const paidAmount = Number(entry?.paid ?? entry?.paidAmount ?? entry?.amountPaid ?? entry?.paid_total ?? 0);
      const discountAmount = Number(
        entry?.discount ??
          entry?.discountAmount ??
          entry?.amountDiscount ??
          entry?.feeDiscount ??
          0
      );
      const dueAmount = Number(
        entry?.remaining ??
          entry?.due ??
          entry?.dueAmount ??
          Math.max(totalAmount - paidAmount - discountAmount, 0)
      );
      const feeType = String(entry?.label || entry?.key || entry?.type || entry?.feeName || "Fee").trim();
      const feeTypeKey = normalizeFeeLabel(feeType);
      const isDeletedFeeType = isDeletedFeeTypeKey(feeTypeKey);
      const summaryOverride = summaryByFeeKey.get(normalizeFeeLabel(feeType)) || null;
      const resolvedTotalAmount = summaryOverride
        ? pickTotalAmount(summaryOverride, totalAmount)
        : Number.isFinite(totalAmount) ? totalAmount : 0;
      const resolvedPaidAmount = summaryOverride
        ? pickPositiveAmount(
            summaryOverride?.paid ??
              summaryOverride?.paidAmount ??
              summaryOverride?.amountPaid ??
              summaryOverride?.paid_total,
            paidAmount
          )
        : Number.isFinite(paidAmount) ? paidAmount : 0;
      const resolvedDiscountAmount = summaryOverride
        ? pickPositiveAmount(
            summaryOverride?.discount ??
              summaryOverride?.discountAmount ??
              summaryOverride?.amountDiscount ??
              summaryOverride?.feeDiscount,
            discountAmount
          )
        : Number.isFinite(discountAmount) ? discountAmount : 0;
      const resolvedDueAmount = (() => {
        const overrideDue = Number(summaryOverride?.remaining ?? summaryOverride?.due ?? summaryOverride?.dueAmount);
        if (Number.isFinite(overrideDue) && overrideDue > 0) return overrideDue;
        const computedDue = Math.max(resolvedTotalAmount - resolvedPaidAmount - resolvedDiscountAmount, 0);
        if (computedDue > 0) return computedDue;
        return Number.isFinite(dueAmount) ? dueAmount : 0;
      })();

      const finalTotalAmount = isDeletedFeeType ? 0 : Number.isFinite(resolvedTotalAmount) ? resolvedTotalAmount : 0;
      const finalPaidAmount = isDeletedFeeType ? 0 : Number.isFinite(resolvedPaidAmount) ? resolvedPaidAmount : 0;
      const finalDiscountAmount = isDeletedFeeType ? 0 : Number.isFinite(resolvedDiscountAmount) ? resolvedDiscountAmount : 0;
      const finalDueAmount = isDeletedFeeType ? 0 : Number.isFinite(resolvedDueAmount) ? resolvedDueAmount : 0;

  const feeTypeId =
    entry?.feeTypeId ||
    entry?.fee_type_id ||
    entry?._id ||
    entry?.id;

  const dedupeKey = getPaymentRowDedupeKey({ ...entry, feeType });

  return {
  id: `${sourceTag}-${index}-${feeType || "fee"}`,
  dedupeKey,

  feeTypeId,

  studentName:
    summary?.studentName ||
    summary?.StudentName ||
    popupSelection?.studentName ||
    paymentPopupStudentRecord?.name ||
    "-",

  className:
    summary?.class ||
    summary?.Class_name ||
    popupSelection?.className ||
    paymentPopupStudentRecord?.class_name ||
    "-",

  section:
    summary?.section ||
    summary?.Section ||
    popupSelection?.sectionName ||
    paymentPopupStudentRecord?.section ||
    "-",

  feeType,

  installments: getInstallmentsForFeeType(feeType, feeTypeId),
  

  discountAmount: finalDiscountAmount,
  totalAmount: finalTotalAmount,
  paidAmount: finalPaidAmount,
dueAmount: finalDueAmount,
  isDeletedFeeType,

  paymentDate:
    summary?.paymentDate ||
    summary?.payment_date ||
    summary?.record_date ||
    summary?.createdAt ||
    "-",
};
    };

    const classSourceRows = [
      ...(selectedClassFeeStructure ? [selectedClassFeeStructure] : []),
      ...(selectedClassSectionFeeRows || []),
    ];
    const classRows = classSourceRows.flatMap((row, index) =>
      buildFeeRowsFromStudentSummary({
        ...stripStudentDiscountFields(row),
        StudentName: studentName,
        Class_name: className,
        Section: sectionName,
      }).map((feeRow) => {
        const feeTypeKey = normalizeFeeLabel(feeRow?.feeType || "");
        const isDeletedFeeType = isDeletedFeeTypeKey(feeTypeKey);
        const summaryOverride = summaryByFeeKey.get(normalizeFeeLabel(feeRow?.feeType || "")) || null;
        const resolvedTotalAmount = summaryOverride
          ? pickTotalAmount(summaryOverride, feeRow.totalAmount)
          : Number.isFinite(Number(feeRow.totalAmount)) ? Number(feeRow.totalAmount) : 0;
        const resolvedPaidAmount = summaryOverride
          ? pickPositiveAmount(
              summaryOverride?.paid ??
                summaryOverride?.paidAmount ??
                summaryOverride?.amountPaid ??
                summaryOverride?.paid_total,
              feeRow.paidAmount
            )
          : Number.isFinite(Number(feeRow.paidAmount)) ? Number(feeRow.paidAmount) : 0;
        const resolvedDiscountAmount = summaryOverride
          ? pickPositiveAmount(
              summaryOverride?.discount ??
                summaryOverride?.discountAmount ??
                summaryOverride?.amountDiscount ??
                summaryOverride?.feeDiscount,
              feeRow.discountAmount
            )
          : Number.isFinite(Number(feeRow.discountAmount)) ? Number(feeRow.discountAmount) : 0;
        const resolvedDueAmount = (() => {
          const overrideDue = Number(summaryOverride?.remaining ?? summaryOverride?.due ?? summaryOverride?.dueAmount);
          if (Number.isFinite(overrideDue) && overrideDue > 0) return overrideDue;
          const computedDue = Math.max(resolvedTotalAmount - resolvedPaidAmount - resolvedDiscountAmount, 0);
          if (computedDue > 0) return computedDue;
          return Number.isFinite(Number(feeRow.dueAmount)) ? Number(feeRow.dueAmount) : 0;
        })();

        const finalTotalAmount = isDeletedFeeType ? 0 : Number.isFinite(resolvedTotalAmount) ? resolvedTotalAmount : 0;
        const finalPaidAmount = isDeletedFeeType ? 0 : Number.isFinite(resolvedPaidAmount) ? resolvedPaidAmount : 0;
        const finalDiscountAmount = isDeletedFeeType ? 0 : summaryOverride && Number.isFinite(resolvedDiscountAmount) ? resolvedDiscountAmount : 0;
        const finalDueAmount = isDeletedFeeType ? 0 : Number.isFinite(resolvedDueAmount) ? resolvedDueAmount : 0;

        return {
          ...feeRow,
          id: `${feeRow.id || "popup-row"}-class-${index}`,
          dedupeKey: getPaymentRowDedupeKey(feeRow),
          installments: getInstallmentsForFeeType(feeRow?.feeType || "", feeRow?.feeTypeId),
          totalAmount: finalTotalAmount,
          paidAmount: finalPaidAmount,
          discountAmount: finalDiscountAmount,
          dueAmount: finalDueAmount,
          isDeletedFeeType,
        };
      })
    );

    const individualFeeTypes = new Set(
      (dynamicFeeTypes || [])
        .filter((fee) => String(fee?.scope || "").trim().toLowerCase() === "individual")
        .flatMap((fee) => {
          const feeName = fee?.columnBase || fee?.feeName || fee?.feesType || fee?.label || "";
          return [normalizeFeeLabel(feeName), normalizeFeeColumnBase(feeName)];
        })
        .filter(Boolean)
    );

    const rowsToRender = [];
    const renderedKeys = new Set();
    const isClassFeeKey = (key) => key === "class" || key === "class_fee" || key === "classfee";
    const isSummaryAmountFeeKey = (key) => key === "amount" || key === "outstanding_amount";

    classRows.forEach((row) => {
      const key = getPaymentRowDedupeKey(row);
      if (!key || isClassFeeKey(key)) return;
      if (individualFeeTypes.has(key)) return;
      if (!hasStudentSpecificFeeEvidence(row)) return;
      renderedKeys.add(key);
      rowsToRender.push(row);
    });

    const studentRowsSource = assignmentRows.length > 0 ? assignmentRows : breakdownRows;
   const studentRows = studentRowsSource
  .filter((entry) => {
    const key = normalizeFeeLabel(entry?.key || entry?.label || entry?.type || entry?.feeName || "");
    return !isSummaryAmountFeeKey(key);
  })
  .map((entry, index) =>
    normalizePaymentRow(
      {
        feeTypeId:
          entry?.feeTypeId ||
          entry?.fee_type_id ||
          entry?._id ||
          entry?.id,

        key:
          entry?.type ||
          entry?.columnBase ||
          entry?.feeName ||
          entry?.key ||
          "fee",

        label:
          entry?.feeName ||
          entry?.label ||
          entry?.type ||
          entry?.columnBase ||
          entry?.key ||
          "Fee",

        total:
          entry?.total ??
          entry?.amountTotal ??
          entry?.totalAmount ??
          entry?.assignedAmount ??
          entry?.completeFee ??
          entry?.value ??
          entry?.amount ??
          0,

        paid:
          entry?.paidAmount ??
          entry?.paid ??
          0,

        discount:
          entry?.discountAmount ??
          entry?.discount ??
          0,

        remaining:
          entry?.dueAmount ??
          entry?.remaining ??
          entry?.due ??
          entry?.assignedAmount ??
          0,
      },
      index,
      "student"
    )
  )
      .filter((row) => row?.isDeletedFeeType || individualFeeTypes.has(normalizeFeeLabel(row?.feeType || "")) || Number(row?.totalAmount) > 0 || Number(row?.paidAmount) > 0 || Number(row?.discountAmount) > 0 || Number(row?.dueAmount) > 0);

    studentRows.forEach((row) => {
      const key = getPaymentRowDedupeKey(row);
      if (!key || isClassFeeKey(key) || isSummaryAmountFeeKey(key)) return;
      const existingIndex = rowsToRender.findIndex((item) => getPaymentRowDedupeKey(item) === key);
      if (existingIndex >= 0) {
        rowsToRender[existingIndex] = {
          ...rowsToRender[existingIndex],
          ...row,
          feeType: rowsToRender[existingIndex]?.feeType || row?.feeType,
          installments: row?.installments?.length
            ? row.installments
            : rowsToRender[existingIndex]?.installments || [],
          dedupeKey: key,
        };
        return;
      }
      rowsToRender.push(row);
    });

    if (!rowsToRender.length) {
      breakdownRows.forEach((entry, index) => {
        const entryKey = normalizeFeeLabel(entry?.key || entry?.label || entry?.type || entry?.feeName || "");
        if (isSummaryAmountFeeKey(entryKey)) return;
   const row = normalizePaymentRow(
  {
    ...entry,
    feeTypeId:
      entry?.feeTypeId ||
      entry?.fee_type_id ||
      entry?._id ||
      entry?.id,
  },
  index,
  "fallback"
);
        const key = getPaymentRowDedupeKey(row);
        if (!key || isClassFeeKey(key) || isSummaryAmountFeeKey(key)) return;
        if (renderedKeys.has(key)) return;
        renderedKeys.add(key);
        rowsToRender.push(row);
      });
    }
    const finalRowsByKey = new Map();

    rowsToRender.forEach((feeRow) => {
      const key = getPaymentRowDedupeKey(feeRow);
      if (!key || isSummaryAmountFeeKey(key)) return;
      if (String(feeRow?.feeType || "").trim().toLowerCase() === "class fee") return;

      const existing = finalRowsByKey.get(key);
      if (!existing) {
        finalRowsByKey.set(key, { ...feeRow, dedupeKey: key });
        return;
      }

      finalRowsByKey.set(key, {
        ...existing,
        ...feeRow,
        id: existing.id || feeRow.id,
        feeType: existing.feeType || feeRow.feeType,
        totalAmount: Math.max(Number(existing.totalAmount) || 0, Number(feeRow.totalAmount) || 0),
        paidAmount: Number(((Number(existing.paidAmount) || 0) + (Number(feeRow.paidAmount) || 0)).toFixed(2)),
        discountAmount: Math.max(Number(existing.discountAmount) || 0, Number(feeRow.discountAmount) || 0),
        dueAmount: Math.max(
          Math.max(Number(existing.totalAmount) || 0, Number(feeRow.totalAmount) || 0) -
            Number(((Number(existing.paidAmount) || 0) + (Number(feeRow.paidAmount) || 0)).toFixed(2)) -
            Math.max(Number(existing.discountAmount) || 0, Number(feeRow.discountAmount) || 0),
          0
        ),
        installments: Array.isArray(existing.installments) && existing.installments.length
          ? existing.installments
          : feeRow.installments || [],
        dedupeKey: key,
      });
    });

    return Array.from(finalRowsByKey.values());
  }, [
    buildFeeRowsFromStudentSummary,
    dynamicFeeTypes,
    feeTypeInstallmentsMap,
    paymentPopupStudentRecord?.class_name,
    paymentPopupStudentRecord,
    paymentPopupStudentRecord?.name,
    paymentPopupStudentRecord?.section,
    popupSelection?.className,
    popupSelection?.sectionName,
    popupSelection?.studentName,
    selectedClassFeeStructure,
    selectedClassSectionFeeRows,
    selectedStudentPaymentSummary,
    studentDiscountRows,
    isDeletedFeeTypeKey,
  ]);

// Add this state at the top of your component
const [selectedStudentRawRows, setSelectedStudentRawRows] = useState([]);
const [selectedStudentTransactions, setSelectedStudentTransactions] = useState([]);
const [selectedStudentTransactionsLoading, setSelectedStudentTransactionsLoading] = useState(false);
const [selectedStudentTransactionsError, setSelectedStudentTransactionsError] = useState("");

const getAnyValue = useCallback((row, keys, fallback = "") => {
  if (!row) return fallback;
  const rowLower = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [String(key).toLowerCase(), value])
  );

  for (const key of keys) {
    const value = rowLower[String(key).toLowerCase()];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return fallback;
}, []);

const getTransactionPaidTotal = useCallback((row) => {
  const directAmount = getAnyNumber(row, ["amount_paid", "paid_amount", "Total_Paid", "totalPaid"]);
  if (directAmount > 0) return directAmount;

  return Object.entries(row || {}).reduce((sum, [key, value]) => {
    const normalizedKey = String(key || "").toLowerCase();
    if (!normalizedKey.includes("paid")) return sum;
    if (TRANSACTION_METADATA_KEYS.has(normalizedKey)) return sum;
    return sum + toNumber(value);
  }, 0);
}, [getAnyNumber, toNumber]);

const normalizeTransactionRow = useCallback((row) => ({
  ...row,
  StudentName: getAnyValue(row, ["StudentName", "student_name", "studentName", "name"], ""),
  Class_name: getAnyValue(row, ["Class_name", "class_name", "className"], ""),
  section: getAnyValue(row, ["section", "Section"], ""),
  paidDate: getAnyValue(row, ["paidDate", "paid_date", "Payment_Date", "record_date", "created_at"], ""),
  paymentMode: getAnyValue(row, ["paymentMode", "payment_mode", "Payment_Mode"], ""),
  transaction_id: getAnyValue(row, ["transaction_id", "txn_id", "Transaction_ID"], ""),
  receiptNumber: getAnyValue(row, ["receiptNumber", "receipt_number", "ReceiptNumber"], ""),
  receiptDate: getAnyValue(row, ["receipt_date", "Receipt_Date", "paidDate", "paid_date", "Payment_Date"], ""),
}), [getAnyValue]);

const fetchSelectedStudentTransactions = useCallback(async () => {
  const schoolCode = localStorage.getItem("schoolCode");
  if (!schoolCode) return;

  const studentName = String(
    paymentPopupStudentRecord?.name ||
      paymentPopupStudentRecord?.StudentName ||
      popupSelection?.studentName ||
      ""
  ).trim();
  const className = String(
    paymentPopupStudentRecord?.class_name ||
      paymentPopupStudentRecord?.Class_name ||
      paymentPopupStudentRecord?.className ||
      popupSelection?.className ||
      ""
  ).trim();
  const section = String(
    paymentPopupStudentRecord?.section ||
      paymentPopupStudentRecord?.Section ||
      paymentPopupStudentRecord?.sectionName ||
      popupSelection?.sectionName ||
      ""
  ).trim();

  if (!studentName && !className && !section) return;

  setSelectedStudentTransactionsLoading(true);
  setSelectedStudentTransactionsError("");

  const parseRows = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.rows)) return payload.rows;
    return [];
  };

  try {
    const queryParams = { schoolCode, studentName, className, section };
    let result = [];

    try {
      const response = await axios.get(`${API_BASE_URL}/api/student-transactions-dynamic`, {
        params: queryParams,
      });
      result = parseRows(response.data);
    } catch (dynamicError) {
      console.warn("Dynamic student transactions failed, trying legacy fallback:", dynamicError);
      const fallbackResponse = await axios.get(`${API_BASE_URL}/api/student-transactions`, {
        params: queryParams,
      });
      result = parseRows(fallbackResponse.data);
    }

    const paidRows = result
      .map(normalizeTransactionRow)
      .filter((row) => getTransactionPaidTotal(row) > 0);

    const groupedMap = new Map();
    paidRows.forEach((row, index) => {
      const receiptNo = row.receiptNumber || row.receipt_number || row.transaction_id || `NO_RECEIPT_${index}`;
      const groupKey = [
        receiptNo,
        String(row.StudentName || "").trim().toLowerCase(),
        String(row.Class_name || "").trim().toLowerCase(),
        String(row.section || "").trim().toLowerCase(),
        row.paidDate || row.Payment_Date || row.paid_date || "",
      ].join("__");

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, { ...row });
        return;
      }

      const existing = groupedMap.get(groupKey);
      Object.keys(row).forEach((key) => {
        if (String(key).toLowerCase().includes("paid")) {
          existing[key] = toNumber(existing[key]) + toNumber(row[key]);
        }
      });
    });

    setSelectedStudentTransactions(Array.from(groupedMap.values()));
  } catch (error) {
    console.error("Failed to fetch selected student transactions:", error);
    setSelectedStudentTransactions([]);
    setSelectedStudentTransactionsError("Failed to load student transactions.");
  } finally {
    setSelectedStudentTransactionsLoading(false);
  }
}, [
  getTransactionPaidTotal,
  normalizeTransactionRow,
  paymentPopupStudentRecord,
  popupSelection,
  toNumber,
]);

// Add this useEffect to fetch raw rows when the popup opens
useEffect(() => {
  if (!popupSelection?.studentId) {
    setSelectedStudentRawRows([]);
    return;
  }

  const schoolCode = localStorage.getItem("schoolCode");
  axios
    .get(`https://cleezoclass.com:4000/api/fee-records`, {
      params: {
        schoolCode,
        studentId: popupSelection.studentId,
        type: "AllFeesStatusReport", // Adjust based on your API
      },
    })
    .then((res) => {
      const rawRows = Array.isArray(res.data) ? res.data : [];
      setSelectedStudentRawRows(rawRows);
    })
    .catch((error) => {
      console.error("Failed to fetch raw rows:", error);
      setSelectedStudentRawRows([]);
    });
}, [popupSelection?.studentId]);
const aggregateDynamicInstallments = (rows = []) => {
  return buildStudentInstallmentMap(rows);
};

const rawRows = selectedStudentRawRows || [];
const aggregatedInstallments = aggregateDynamicInstallments(rawRows);
const enrichedPaymentRows = useMemo(() => {
  const discountMap = new Map();
  const studentInstallmentMap = buildStudentInstallmentMap(studentDiscountRows);

  // Extract discounts from studentDiscountRows
  (studentDiscountRows || []).forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (key.endsWith("_discount")) {
        const amount = Number(row[key] || 0);
        if (amount > 0) {
          const feeType = key.replace("_discount", "").toLowerCase().replace(/[_\s]+/g, "");
          const current = discountMap.get(feeType) || 0;
          if (amount > current) {
            discountMap.set(feeType, amount);
          }
        }
      }
    });
  });

  // Call aggregateDynamicInstallments with rawRows
  const rawRows = selectedStudentRawRows || [];
  const aggregatedInstallments = aggregateDynamicInstallments(rawRows);

  // Log the OUTPUT of the function
  console.log("Aggregated Installments:", aggregatedInstallments);

  return (paymentPopupStudentPaymentRows || []).map((row) => {
    const rowFeeType = String(row.feeType || "").trim().toLowerCase().replace(/[_\s]+/g, "");
    let matchedDiscount = 0;

    // Match discount for the fee type
    matchedDiscount = discountMap.get(rowFeeType) || 0;
    if (matchedDiscount === 0 && rowFeeType.endsWith("fee")) {
      const withoutFee = rowFeeType.replace(/fee$/, "");
      matchedDiscount = discountMap.get(withoutFee) || 0;
    }
    if (matchedDiscount === 0) {
      for (const [key, value] of discountMap.entries()) {
        if (rowFeeType.includes(key) || key.includes(rowFeeType)) {
          matchedDiscount = value;
          break;
        }
      }
    }

    const finalDiscount = Math.max(Number(row.discountAmount || 0), matchedDiscount);
    const originalTotal = Math.max(Number(row.totalAmount || 0), 0);
    const paidAmount = Number(row.paidAmount || 0);

    // Normalize the row fee type to match the keys in aggregatedInstallments
    const normalizedRowFeeType = rowFeeType.replace(/fee$/, "").toLowerCase();
    const dynamicInstallments = aggregatedInstallments[normalizedRowFeeType] || [];

    const feeKey = normalizeInstallmentFeeKey(row.feeType);
    const studentInstallments = studentInstallmentMap[feeKey] || [];
    const paymentInstallments = dynamicInstallments.length > 0 ? dynamicInstallments : studentInstallments;
    const classPlanInstallments = Array.isArray(row.installments) ? row.installments : [];
    const sourceInstallments = hasConfiguredInstallmentAmounts(paymentInstallments)
      ? paymentInstallments
      : mergeInstallmentPlanWithPayments(classPlanInstallments, paymentInstallments);
    const discountedSourceInstallments = applyDiscountToInstallmentRows(sourceInstallments, finalDiscount);

    const hasDirectPaidAmounts = discountedSourceInstallments.some(
      (installment) => Number(installment?.paid || 0) > 0
    );

    // Distribute paid amount across installments
    let unappliedPaid = hasDirectPaidAmounts ? 0 : paidAmount;
    const installments = dedupeInstallmentRows(discountedSourceInstallments
      .map((installment, index) => {
        const amount = Math.max(Number(installment?.amount || 0), 0);
        const grossAmount = Math.max(
          Number(installment?.grossAmount ?? installment?.originalAmount ?? amount) || 0,
          0
        );
        const directPaid = Math.max(Number(installment?.paid) || 0, 0);
        const appliedPaid = hasDirectPaidAmounts
          ? Math.min(directPaid, amount)
          : Math.min(unappliedPaid, amount);
        if (!hasDirectPaidAmounts) {
          unappliedPaid = Math.max(unappliedPaid - appliedPaid, 0);
        }
        return {
          ...installment,
          installmentNo: installment?.installmentNo || index + 1,
          originalAmount: grossAmount,
          discountedAmount: amount,
          paid: appliedPaid,
          amount: Math.max(amount - appliedPaid, 0),
          isPaid: amount > 0 && appliedPaid >= amount,
        };
      })
      .filter((installment) => installment.originalAmount > 0 || installment.paid > 0));

    const installmentOriginalTotal = installments.reduce(
      (sum, installment) => sum + Math.max(Number(installment?.originalAmount || 0), 0),
      0
    );
    const installmentPaidTotal = installments.reduce(
      (sum, installment) => sum + Math.max(Number(installment?.paid || 0), 0),
      0
    );
    const shouldUseInstallmentTotals = installmentOriginalTotal > 0;
    const resolvedOriginalTotal = shouldUseInstallmentTotals ? installmentOriginalTotal : originalTotal;
    const installmentNetTotal = installments.reduce(
      (sum, installment) => sum + Math.max(Number(installment?.discountedAmount ?? installment?.amount ?? 0), 0),
      0
    );
    const resolvedNetTotal = shouldUseInstallmentTotals
      ? installmentNetTotal
      : Math.max(resolvedOriginalTotal - finalDiscount, 0);
    const resolvedPaidTotal = shouldUseInstallmentTotals
      ? Math.max(installmentPaidTotal, paidAmount)
      : paidAmount;

    return {
      ...row,
      originalAmount: resolvedOriginalTotal,
      discountAmount: finalDiscount,
      totalAmount: resolvedNetTotal,
      paidAmount: resolvedPaidTotal,
      dueAmount: Math.max(resolvedNetTotal - resolvedPaidTotal, 0),
      installments,
    };
  });
}, [paymentPopupStudentPaymentRows, studentDiscountRows, selectedStudentRawRows]);



console.log("Raw Rows for Aggregation:", selectedStudentRawRows);


console.log("Enriched Payment Rows:", enrichedPaymentRows);

const selectedTransactionPaidColumns = useMemo(() => {
  const staticColumns = [
    { key: "Admission_paid", label: "Admission", getValue: (row) => toNumber(row.Admission_paid) },
    { key: "books_paid", label: "Books", getValue: (row) => toNumber(row.books_paid) },
    { key: "uniform_paid", label: "Uniform", getValue: (row) => toNumber(row.uniform_paid) },
    { key: "exam_paid", label: "Exam", getValue: (row) => toNumber(row.exam_paid) },
    { key: "bus_paid", label: "Bus", getValue: (row) => toNumber(row.bus_paid) },
    { key: "others_paid", label: "Others", getValue: (row) => toNumber(row.others_paid) },
    { key: "RES_INST_1", label: "Residential", getValue: (row) => toNumber(row.RES_INST_1) },
    { key: "Previous_Paid", label: "Previous", getValue: (row) => toNumber(row.Previous_Paid) },
  ].filter((column) =>
    selectedStudentTransactions.some((row) => column.getValue(row) > 0)
  );

  const staticKeys = new Set(staticColumns.map((column) => column.key.toLowerCase()));
  const dynamicColumns = [];

  selectedStudentTransactions.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      const normalizedKey = String(key || "").toLowerCase();
      if (!normalizedKey.includes("paid")) return;
      if (staticKeys.has(normalizedKey) || TRANSACTION_METADATA_KEYS.has(normalizedKey)) return;
      if (dynamicColumns.some((column) => column.key === key)) return;
      if (!selectedStudentTransactions.some((item) => toNumber(item[key]) > 0)) return;

      const label = String(key)
        .replace(/_?paid$/i, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      dynamicColumns.push({ key, label, getValue: (item) => toNumber(item[key]) });
    });
  });

  return [...staticColumns, ...dynamicColumns];
}, [selectedStudentTransactions, toNumber]);

const formatTransactionDate = useCallback((value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB");
}, []);
    // Get installments for the fee type
  const selectedClassPaidTotalsMap = useMemo(() => {
    const transactionMap = new Map();
    const aggregateFallbackMap = new Map();
    const installmentPaidMap = new Map();
    const seenRows = new Set();

    [...(allFeeStatusRows || []), ...(unpaidStudents || [])].forEach((row) => {
      const rowKey =
        row?.id ??
        [
          row?.receiptNumber,
          row?.fee_type,
          row?.StudentName,
          row?.Class_name,
          row?.section || row?.Section || row?.sectionName || row?.FeeSection,
          row?.amount_paid,
          row?.record_date,
        ].join("|");

      if (seenRows.has(rowKey)) return;
      seenRows.add(rowKey);

      const key = getStudentCompositeKey(row);

      if (!key.replace(/\|/g, "").trim()) return;

      const totals = getFeeTotalsForRow(row);
      const transactionPaid = getAnyNumber(row, ["amount_paid", "paid_amount"]);
      const aggregatePaid = totals.paid || getAnyNumber(row, [
        "Paid_Amount",
        "Total_Paid",
        "totalPaid",
        "dynamicFeePaidTotal",
      ]);
      const installmentPaid = getInstallmentPaidTotalForRow(row);

      if (installmentPaid > 0) {
        installmentPaidMap.set(key, Math.max(installmentPaidMap.get(key) || 0, installmentPaid));
      }

      if (transactionPaid > 0) {
        transactionMap.set(key, (transactionMap.get(key) || 0) + transactionPaid);
      } else if (aggregatePaid > 0 && !transactionMap.has(key) && !aggregateFallbackMap.has(key)) {
        aggregateFallbackMap.set(key, aggregatePaid);
      }
    });

    const merged = new Map(aggregateFallbackMap);
    transactionMap.forEach((value, key) => {
      merged.set(key, value);
    });
    installmentPaidMap.forEach((value, key) => {
      merged.set(key, Math.max(merged.get(key) || 0, value));
    });

    return merged;
  }, [
    allFeeStatusRows,
    getAnyNumber,
    getFeeTotalsForRow,
    unpaidStudents,
  ]);

  const selectedClassInstallmentDueMap = useMemo(() => {
    const rowsByStudent = new Map();
    const classPlanRows = selectedClassFeeStructure ? [selectedClassFeeStructure] : [];

    [...(allFeeStatusRows || []), ...(unpaidStudents || [])].forEach((row) => {
      const rowClass = row?.Class_name || row?.class_name || row?.className || row?.FeeClass || "";
      const rowSection = row?.Section || row?.section || row?.sectionName || row?.FeeSection || "";
      const classMatch =
        !selectedClassFilter ||
        normalizeClassLabel(rowClass) === normalizeClassLabel(selectedClassFilter);
      const sectionMatch =
        !selectedSectionFilter ||
        normalizeSectionLabel(rowSection) === normalizeSectionLabel(selectedSectionFilter);
      if (!classMatch || !sectionMatch) return;

      const key = getStudentCompositeKey(row);
      if (!key.replace(/\|/g, "").trim()) return;

      if (!rowsByStudent.has(key)) rowsByStudent.set(key, []);
      rowsByStudent.get(key).push(row);
    });

    const dueMap = new Map();
    rowsByStudent.forEach((rows, key) => {
      const due = getInstallmentDueFromRows(rows, classPlanRows);
      if (due > 0) dueMap.set(key, due);
    });

    return dueMap;
  }, [
    allFeeStatusRows,
    normalizeClassLabel,
    normalizeSectionLabel,
    selectedClassFilter,
    selectedClassFeeStructure,
    selectedSectionFilter,
    unpaidStudents,
  ]);

  const getIndividualFeeTotalsFromSummary = useCallback(
    (paymentSummary) => {
      if (!paymentSummary || individualDynamicFeeTypeKeys.size === 0) {
        return { total: 0, paid: 0 };
      }

      const entries = [
        ...(Array.isArray(paymentSummary?.individualFeeAssignments) ? paymentSummary.individualFeeAssignments : []),
        ...(Array.isArray(paymentSummary?.dynamicFeeBreakdown) ? paymentSummary.dynamicFeeBreakdown : []),
      ];

      return entries.reduce(
        (acc, entry) => {
          const feeKey = normalizeFeeLabel(entry?.key || entry?.label || entry?.type || entry?.feeName || "");
          if (!feeKey || !individualDynamicFeeTypeKeys.has(feeKey) || isDeletedFeeTypeKey(feeKey)) return acc;

          const totalAmount = getAnyNumber(entry, [
            "total",
            "amountTotal",
            "assignedAmount",
            "completeFee",
            "totalAmount",
            "value",
            "amount",
          ]);
          const paidAmount = getAnyNumber(entry, ["paid", "paidAmount", "amountPaid", "paid_total"]);

          acc.total += Math.max(totalAmount, 0);
          acc.paid += Math.max(paidAmount, 0);
          return acc;
        },
        { total: 0, paid: 0 }
      );
    },
    [getAnyNumber, individualDynamicFeeTypeKeys, isDeletedFeeTypeKey]
  );

  const getPaymentSummaryTotalsFromSummary = useCallback((paymentSummary) => {
    if (!paymentSummary) {
      return { total: 0, paid: 0 };
    }

    const entries = [
      ...(Array.isArray(paymentSummary?.individualFeeAssignments) ? paymentSummary.individualFeeAssignments : []),
      ...(Array.isArray(paymentSummary?.dynamicFeeBreakdown) ? paymentSummary.dynamicFeeBreakdown : []),
    ];

    return entries.reduce(
      (acc, entry) => {
        const feeKey = normalizeFeeLabel(entry?.key || entry?.label || entry?.type || entry?.feeName || "");
        if (feeKey && isDeletedFeeTypeKey(feeKey)) return acc;

        const totalAmount = getAnyNumber(entry, [
          "total",
          "amountTotal",
          "assignedAmount",
          "completeFee",
          "totalAmount",
          "value",
          "amount",
        ]);
        const paidAmount = getAnyNumber(entry, ["paid", "paidAmount", "amountPaid", "paid_total"]);

        acc.total += Math.max(totalAmount, 0);
        acc.paid += Math.max(paidAmount, 0);
        return acc;
      },
      { total: 0, paid: 0 }
    );
  }, [getAnyNumber, isDeletedFeeTypeKey]);

  const normalizedOutstandingSearchTerm = outstandingSearchTerm.trim().toLowerCase();

  const individualFeeAssignmentsForView = useMemo(() => {
    const map = new Map();

    (allFeeStatusRows || []).forEach((row) => {
      const rowClass = String(row?.Class_name || row?.class_name || row?.className || row?.FeeClass || "")
        .trim()
        .toLowerCase();
      const rowSection = String(row?.Section || row?.section || row?.sectionName || row?.FeeSection || "")
        .trim()
        .toLowerCase();

      const classMatch =
        !selectedClassFilter ||
        normalizeClassLabel(rowClass) === normalizeClassLabel(selectedClassFilter);
      const sectionMatch =
        !selectedSectionFilter ||
        normalizeSectionLabel(rowSection) === normalizeSectionLabel(selectedSectionFilter);
      if (!classMatch || !sectionMatch) return;

      const assignments = Array.isArray(row?.individualFeeAssignments)
        ? row.individualFeeAssignments.filter(Boolean)
        : [];

      assignments.forEach((assignment) => {
        const name = String(assignment?.studentName || assignment?.StudentName || assignment?.name || "")
          .trim()
          .toLowerCase();
        if (!name) return;

        const assignmentClass = String(
          assignment?.className || assignment?.Class_name || assignment?.class_name || rowClass || ""
        ).trim().toLowerCase();
        const assignmentSection = String(
          assignment?.section || assignment?.Section || assignment?.sectionName || rowSection || ""
        ).trim().toLowerCase();

        const key = [name, assignmentClass, assignmentSection].join("|");
        const amount = Math.max(0, getAnyNumber(assignment, ["amount", "Amount", "assignedAmount"]));
        if (amount <= 0 || !key.trim()) return;

        map.set(key, (map.get(key) || 0) + amount);
      });
    });

    return map;
  }, [allFeeStatusRows, getAnyNumber, normalizeClassLabel, normalizeSectionLabel, selectedClassFilter, selectedSectionFilter]);

 const selectedClassSectionOutstandingStudents = useMemo(() => {
  const classFee = selectedClassDefaultDue || 0;
  const baseStudents = (classSectionStudents.length ? classSectionStudents : studentDirectory || [])
    .filter((student) => {
      const className = normalizeClassLabel(student?.class_name || student?.Class_name || student?.className || "");
      const section = normalizeSectionLabel(student?.section || student?.Section || student?.sectionName || "");
      const name = String(student?.name || student?.StudentName || student?.studentName || "").trim().toLowerCase();
      const nameMatch = !normalizedOutstandingSearchTerm || name.includes(normalizedOutstandingSearchTerm);
      return (
        className === normalizeClassLabel(selectedClassFilter) &&
        section === normalizeSectionLabel(selectedSectionFilter) &&
        nameMatch
      );
    })
    .map((student, index) => {
      const name = student?.name || student?.StudentName || student?.studentName || `Student ${index + 1}`;
      const className = student?.class_name || student?.Class_name || student?.className || selectedClassFilter || "";
      const section = student?.section || student?.Section || student?.sectionName || selectedSectionFilter || "";

      // Key matching paymentSummaryMap format (strips "Class" prefix)
      const studentKey = [
        String(name).trim().toLowerCase(),
        String(className).replace(/^Class\s+/i, "").trim().toLowerCase(),
        String(section).trim().toLowerCase(),
      ].join("|");

      const summary = paymentSummaryMap[studentKey] || null;
      const installmentDue = selectedClassInstallmentDueMap.get(studentKey) || 0;

      // Calculate due from payment summary (same as popup)
      let cardDue = 0;
      if (summary) {
        const rows = [
          ...(summary?.dynamicFeeBreakdown || []),
          ...(summary?.individualFeeAssignments || []),
        ];
        cardDue = rows.reduce((sum, row) => {
          return sum + Number(row?.dueAmount || row?.remaining || row?.due || 0);
        }, 0);
      }

      const totalPaidForStudent = selectedClassPaidTotalsMap.get(studentKey) || 0;
      const individualFeeTotals = getIndividualFeeTotalsFromSummary(summary);
      const paymentSummaryTotals = getPaymentSummaryTotalsFromSummary(summary);
      const assignedIndividualFee = individualFeeAssignmentsForView.get(studentKey) || 0;
      const resolvedIndividualFeeTotal = individualFeeTotals.total > 0 ? individualFeeTotals.total : assignedIndividualFee;
      const adjustedClassFee = Math.max(classFee + resolvedIndividualFeeTotal, 0);
      const summaryPaidAmount = Math.max(paymentSummaryTotals.paid, 0);
      const adjustedPaidAmount = Math.max(totalPaidForStudent, summaryPaidAmount, individualFeeTotals.paid);
      const transactionPaid = adjustedPaidAmount;
      const dueFromTransactions = Math.max(adjustedClassFee - transactionPaid, 0);

      const dueAmount = installmentDue > 0
        ? installmentDue
        : cardDue > 0
          ? cardDue
          : (adjustedClassFee > 0 ? Math.max(adjustedClassFee - transactionPaid, 0) : dueFromTransactions);

      return {
        id: student?.id ?? student?.student_id ?? `selected-fee-${index}`,
        name,
        className,
        section,
        totalAmount: adjustedClassFee,
        paidAmount: transactionPaid,
        dueAmount,
        feeBreakdown: [
          ["Class Fee", adjustedClassFee],
          ...(resolvedIndividualFeeTotal > 0 ? [["Individual Fees", resolvedIndividualFeeTotal]] : []),
        ].filter(([, value]) => Number(value) > 0),
      };
    });

  if (baseStudents.length > 0) {
    return baseStudents.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  }

  // Fallback: Use payment summary for due calculation
  return (selectedClassSectionFeeRows || [])
    .map((row, index) => {
      const name = row?.StudentName || row?.studentName || row?.name || row?.Student_Name || `Student ${index + 1}`;
      const className = row?.Class_name || row?.class_name || row?.className || selectedClassFilter || "";
      const section = row?.section || row?.Section || row?.sectionName || selectedSectionFilter || "";

      // Key matching paymentSummaryMap format
      const studentKey = [
        String(name).trim().toLowerCase(),
        String(className).replace(/^Class\s+/i, "").trim().toLowerCase(),
        String(section).trim().toLowerCase(),
      ].join("|");

      const summary = paymentSummaryMap[studentKey] || null;
      const installmentDue = selectedClassInstallmentDueMap.get(studentKey) || 0;
      let cardDue = 0;
      if (summary) {
        const rows = [
          ...(summary?.dynamicFeeBreakdown || []),
          ...(summary?.individualFeeAssignments || []),
        ];
        cardDue = rows.reduce((sum, row) => {
          return sum + Number(row?.dueAmount || row?.remaining || row?.due || 0);
        }, 0);
      }

      const rowTotals = getFeeTotalsForRow(stripStudentDiscountFields(row));
      const totalAmount = rowTotals.expected > 0 ? rowTotals.expected : classFee;
      const paidAmount = rowTotals.paid > 0 ? rowTotals.paid : 0;
      const dueFromRow = Math.max(totalAmount - paidAmount, 0);
      const dueAmount = installmentDue > 0 ? installmentDue : cardDue > 0 ? cardDue : dueFromRow;

      return {
        id: row?.student_id || row?.id || `selected-fee-${index}`,
        name,
        className,
        section,
        totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
        paidAmount: Number.isFinite(paidAmount) ? paidAmount : 0,
        dueAmount: Number.isFinite(dueAmount) ? dueAmount : 0,
        feeBreakdown: [["Class Fee", totalAmount]].filter(([, value]) => Number(value) > 0),
      };
    })
    .filter((student) => {
      return (
        !normalizedOutstandingSearchTerm ||
        String(student.name || "").trim().toLowerCase().includes(normalizedOutstandingSearchTerm)
      );
    })
    .sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
}, [
  classSectionStudents,
  getIndividualFeeTotalsFromSummary,
  normalizedOutstandingSearchTerm,
  individualFeeAssignmentsForView,
  getFeeTotalsForRow,
  paymentSummaryMap,
  selectedClassDefaultDue,
  selectedClassInstallmentDueMap,
  selectedClassFilter,
  selectedClassPaidTotalsMap,
  selectedClassSectionFeeRows,
  selectedSectionFilter,
  studentDirectory,
  normalizeClassLabel,
  normalizeSectionLabel,
  getPaymentSummaryTotalsFromSummary,
]);

 const outstandingFilterSourceRows = useMemo(
  () => [
    ...(studentDirectory || []),
    ...(normalizedOutstandingStudents || []),
    ...(unpaidStudents || []),
    ...(allFeeStatusRows || []),
  ],
  [allFeeStatusRows, normalizedOutstandingStudents, studentDirectory, unpaidStudents]
);

 const classOptions = useMemo(() => {
  const classMap = new Map();

  outstandingFilterSourceRows.forEach((row) => {
    const className = stripClassPrefix(
      row?.className || row?.Class_name || row?.class_name || row?.FeeClass || ""
    );
    const classKey = normalizeClassLabel(className);
    if (!classKey || classMap.has(classKey)) return;
    classMap.set(classKey, className);
  });

  return sortClassLabels([...classMap.values()]);
}, [normalizeClassLabel, outstandingFilterSourceRows]);

const sectionOptions = useMemo(() => {
  const sectionMap = new Map();
  const selectedClassKey = normalizeClassLabel(selectedClassFilter);

  outstandingFilterSourceRows.forEach((row) => {
    const className = row?.className || row?.Class_name || row?.class_name || row?.FeeClass || "";
    const section = String(row?.section || row?.Section || row?.sectionName || row?.FeeSection || "").trim();
    if (!section) return;
    if (selectedClassKey && normalizeClassLabel(className) !== selectedClassKey) return;

    const sectionKey = normalizeSectionLabel(section);
    if (!sectionKey || sectionMap.has(sectionKey)) return;
    sectionMap.set(sectionKey, section);
  });

  if (selectedSectionFilter) {
    const selectedSectionKey = normalizeSectionLabel(selectedSectionFilter);
    if (selectedSectionKey && !sectionMap.has(selectedSectionKey)) {
      sectionMap.set(selectedSectionKey, selectedSectionFilter);
    }
  }

  return sortSectionLabels([...sectionMap.values()]);
}, [
  normalizeClassLabel,
  normalizeSectionLabel,
  outstandingFilterSourceRows,
  selectedClassFilter,
  selectedSectionFilter,
]);

  const filteredOutstandingStudents = useMemo(() => {
    const list = groupedOutstandingStudents
      .map((student) => {
        const key = [
          String(student?.name || student?.StudentName || "").trim().toLowerCase(),
          String(student?.className || student?.Class_name || "").trim().toLowerCase(),
          String(student?.section || student?.Section || "").trim().toLowerCase(),
        ].join("|");
        const groupedDue = Number(student?.dueAmount) || 0;
        const paymentSummary = paymentSummaryMap[key] || null;
        const paymentSummaryTotals = getPaymentSummaryTotalsFromSummary(paymentSummary);
        const paymentApiDue = getExplicitRemainingAmount(paymentSummary);
        const summaryDue = unpaidSummaryDueMap.get(key) || 0;
        const overrideDue = getExplicitRemainingAmount(student);
        const individualDue = individualFeeAssignmentsForView.get(key) || 0;
        const installmentDue = selectedClassInstallmentDueMap.get(key) || 0;
        const resolvedStudentDue =
          installmentDue > 0
            ? installmentDue
            : individualDue > 0
            ? individualDue
            : paymentApiDue > 0
            ? paymentApiDue
            : summaryDue > 0
              ? summaryDue
              : overrideDue > 0
            ? overrideDue
            : groupedDue;
        const totalPaidForStudent = selectedClassPaidTotalsMap.get(key) || 0;
        const summaryPaidAmount = paymentSummaryTotals.paid > 0 ? paymentSummaryTotals.paid : 0;
        const resolvedPaidAmount = Math.max(totalPaidForStudent, summaryPaidAmount);
        const computedDueFromSelectedClass =
          selectedClassFilter &&
          selectedSectionFilter &&
          selectedClassDefaultDue > 0
            ? Math.max(selectedClassDefaultDue - resolvedPaidAmount, 0)
            : 0;
        return {
          ...student,
          dueAmount:
            installmentDue > 0
              ? installmentDue
              : resolvedStudentDue > 0
              ? Math.max(resolvedStudentDue - resolvedPaidAmount, 0)
              : computedDueFromSelectedClass > 0
                ? computedDueFromSelectedClass
                : 0,
        };
      })
      .filter((student) => {
        if (individualFeeAssignmentsForView.size > 0) {
          const individualKey = [
            String(student.name || "").trim().toLowerCase(),
            String(student.className || "").trim().toLowerCase(),
            String(student.section || "").trim().toLowerCase(),
          ].join("|");
          if (!individualFeeAssignmentsForView.has(individualKey)) return false;
        }
        const classMatch =
          !selectedClassFilter ||
          normalizeClassLabel(student.className) === normalizeClassLabel(selectedClassFilter);
        const sectionMatch =
          !selectedSectionFilter ||
          normalizeSectionLabel(student.section) === normalizeSectionLabel(selectedSectionFilter);
        const nameMatch =
          !normalizedOutstandingSearchTerm ||
          String(student.name || "")
            .trim()
            .toLowerCase()
            .includes(normalizedOutstandingSearchTerm);
        return classMatch && sectionMatch && nameMatch;
      });

    return list.sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [
    groupedOutstandingStudents,
    normalizedOutstandingSearchTerm,
    getPaymentSummaryTotalsFromSummary,
    normalizeClassLabel,
    normalizeSectionLabel,
    paymentSummaryMap,
    unpaidSummaryDueMap,
    selectedClassDefaultDue,
    selectedClassFilter,
    selectedClassInstallmentDueMap,
    selectedClassPaidTotalsMap,
    selectedSectionFilter,
    individualFeeAssignmentsForView,
  ]);

  const visibleOutstandingStudents =
    selectedClassFilter &&
    selectedSectionFilter &&
    selectedClassSectionOutstandingStudents.length
      ? selectedClassSectionOutstandingStudents
      : filteredOutstandingStudents;


  const filteredDiscountStudents = useMemo(() => {
    const activeClass = isAddFeesPopupOpen
      ? normalizeClassLabel(addFeePreview.className)
      : normalizeClassLabel(selectedClassFilter || "");
    const activeSection = isAddFeesPopupOpen
      ? String(addFeePreview.section || "").trim()
      : String(selectedSectionFilter || "").trim();

    return (discountStudents || [])
      .filter((student) => {
        const classMatch =
          !activeClass || normalizeClassLabel(getStudentClassName(student)) === activeClass;
        const sectionMatch =
          !activeSection || normalizeSectionLabel(getStudentSectionName(student)) === normalizeSectionLabel(activeSection);
        return classMatch && sectionMatch;
      })
      .sort((a, b) => getStudentName(a).localeCompare(getStudentName(b)));
  }, [
    addFeePreview.className,
    addFeePreview.section,
    discountStudents,
    getStudentClassName,
    getStudentName,
    getStudentSectionName,
    isAddFeesPopupOpen,
    normalizeClassLabel,
    normalizeSectionLabel,
    selectedClassFilter,
    selectedSectionFilter,
  ]);

const getStudentCardDue = (student) => {
  const key = [
    String(student?.name || "").trim().toLowerCase(),
    String(student?.className || "").trim().toLowerCase(),
    String(student?.section || "").trim().toLowerCase(),
  ].join("|");

  const summary = paymentSummaryMap[key];

  if (!summary) return Number(student?.dueAmount || 0);

  const rows = [
    ...(summary?.dynamicFeeBreakdown || []),
    ...(summary?.individualFeeAssignments || []),
  ];

  return rows.reduce((sum, row) => {
    return (
      sum +
      Number(
        row?.dueAmount ||
        row?.remaining ||
        row?.due ||
        0
      )
    );
  }, 0);
};
  useEffect(() => {
    if (!ticketSelectedClassSection) {
      setTicketClassName("");
      setTicketSection("");
      return;
    }
    const [cls, sec] = ticketSelectedClassSection.split("_");
    setTicketClassName(cls || "");
    setTicketSection(sec || "");
  }, [ticketSelectedClassSection]);

  useEffect(() => {
    if (!schoolCode) return;

    const fetchTicketMetadata = async () => {
      try {
        setTicketDropdownLoading(true);
        const [classRes, sectionRes] = await Promise.all([
          axios.get(`${ADMIN_API_BASE}/classes?schoolCode=${schoolCode}`),
          axios.get(`${ADMIN_API_BASE}/sectionFilter?schoolCode=${schoolCode}`),
        ]);

        const classesFromAPI = Array.isArray(classRes.data)
          ? classRes.data
          : classRes.data?.classes || classRes.data?.classList || classRes.data?.data || classRes.data?.result || [];
        const sectionsFromAPI = Array.isArray(sectionRes.data)
          ? sectionRes.data
          : sectionRes.data?.sections || sectionRes.data?.sectionList || sectionRes.data?.data || sectionRes.data?.result || [];

        setTicketClassList(classesFromAPI);
        setTicketSectionMap(sectionsFromAPI);
      } catch (error) {
        console.error("Error loading ticket class/section metadata", error);
        setTicketClassList([]);
        setTicketSectionMap([]);
      } finally {
        setTicketDropdownLoading(false);
      }
    };

    fetchTicketMetadata();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;

    const fetchTicketTeachers = async () => {
      try {
        setTicketLoadingTeachers(true);
        const res = await axios.post("https://cleezoclass.com:4000/api/users", {
          schoolCode,
          user_type: "teacher",
        });
        setTicketTeachers(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error loading accountant ticket teachers", error);
        setTicketTeachers([]);
      } finally {
        setTicketLoadingTeachers(false);
      }
    };

    fetchTicketTeachers();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode || !ticketClassName || !ticketSection) {
      setTicketStudents([]);
      return;
    }

    axios
      .get(
        `https://cleezoclass.com:4000/api/studentsNameAccountant/${ticketClassName}?schoolCode=${schoolCode}&section=${ticketSection}`
      )
      .then((res) => setTicketStudents(normalizeTicketStudentList(res.data)))
      .catch((error) => {
        console.error("Error loading accountant ticket students", error);
        setTicketStudents([]);
      });
  }, [normalizeTicketStudentList, schoolCode, ticketClassName, ticketSection]);

  const ticketDerivedClasses = useMemo(() => {
    if (ticketClassList.length > 0) return ticketClassList;
    const classSet = new Set();
    ticketSectionMap.forEach((item) => {
      const classValue = item?.class_name || item?.class || item?.className;
      if (classValue != null) classSet.add(String(classValue));
    });
    return Array.from(classSet);
  }, [ticketClassList, ticketSectionMap]);

  const filteredTicketStudents = useMemo(() => {
    const term = ticketSearchTerm.trim().toLowerCase();
    if (!term) return ticketStudents;
    return ticketStudents.filter((student) =>
      student.name?.toLowerCase().includes(term) ||
      student.student_name?.toLowerCase?.().includes(term) ||
      String(student.id).includes(term) ||
      String(student.student_id || "").includes(term)
    );
  }, [ticketSearchTerm, ticketStudents]);

  const TICKETS_ITEMS_PER_ROW = 6;

  const ticketStudentRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < filteredTicketStudents.length; i += TICKETS_ITEMS_PER_ROW) {
      rows.push(filteredTicketStudents.slice(i, i + TICKETS_ITEMS_PER_ROW));
    }
    return rows;
  }, [filteredTicketStudents]);

  const ticketTeacherRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < ticketTeachers.length; i += TICKETS_ITEMS_PER_ROW) {
      rows.push(ticketTeachers.slice(i, i + TICKETS_ITEMS_PER_ROW));
    }
    return rows;
  }, [ticketTeachers]);

  const openTicketModal = useCallback((payload) => {
    setTicketTarget(payload);
    setTicketTitle("");
    setTicketDescription("");
    setTicketSuccess("");
    setTicketError("");
    setShowTicketModal(true);
  }, []);

  const closeTicketModal = useCallback(() => {
    setShowTicketModal(false);
    setTicketTarget(null);
    setTicketSelectedTeacherId(null);
  }, []);

  const handleCreateTicket = useCallback(async () => {
    if (!ticketTarget || !ticketTitle.trim() || !ticketDescription.trim() || !schoolCode) return;

    try {
      const payload = {
        schoolCode,
        ticket_type: ticketTarget.type,
        teacher_id: ticketTarget.teacher?.teacher_id || null,
        teacher_name: ticketTarget.teacher?.teacher_name || null,
        student_id: ticketTarget.student?.id || null,
        student_name: ticketTarget.student?.name || null,
        class_name: ticketClassName || null,
        section: ticketSection || null,
        title: ticketTitle.trim(),
        description: ticketDescription.trim(),
      };
      await axios.post("https://cleezoclass.com:4000/api/tickets", payload);
      setTicketSuccess("Ticket created successfully.");
      setTicketError("");
      setTimeout(() => {
        closeTicketModal();
      }, 900);
    } catch (error) {
      console.error("Error creating accountant ticket", error);
      setTicketError("Failed to create ticket. Please try again.");
      setTicketSuccess("");
    }
  }, [closeTicketModal, schoolCode, ticketClassName, ticketDescription, ticketSection, ticketTarget, ticketTitle]);

  const outgoingStudentFeeRows = useMemo(() => {
    const fallbackStudents = (unpaidStudents || []).map((student, index) => ({
      id: student?.id ?? student?.StudentId ?? `outgoing-${index}`,
      name: getStudentName(student),
      className: student?.Class_name || student?.class_name || student?.className || "",
      section: student?.Section || student?.section || student?.sectionName || "",
    }));

    const baseStudents = (studentDirectory || []).length
      ? (studentDirectory || []).map((student, index) => ({
          id: student?.id ?? student?.student_id ?? `student-${index}`,
          name: student?.name || student?.StudentName || student?.studentName || "Student",
          className: student?.class_name || student?.Class_name || student?.className || "",
          section: student?.section || student?.Section || student?.sectionName || "",
        }))
      : fallbackStudents;

    return baseStudents
      .map((student) => {
        const studentKey = [
          String(student?.name || "").trim().toLowerCase(),
          String(student?.className || "").trim().toLowerCase(),
          String(student?.section || "").trim().toLowerCase(),
        ].join("|");

        const matchingFeeRows = (allFeeStatusRows || []).filter((row) => getStudentCompositeKey(row) === studentKey);
        const matchingUnpaidRow = (unpaidStudents || []).find((row) => getStudentCompositeKey(row) === studentKey);

        let expectedAmount = 0;
        let transactionPaidTotal = 0;
        let aggregatePaidFallback = 0;
        let installmentPaidFallback = 0;
        let dueAmount = 0;
        let latestDate = "";
        const totalPaidForStudent = selectedClassPaidTotalsMap.get(studentKey) || 0;
        const paymentSummary = paymentSummaryMap[studentKey] || null;
        const paymentSummaryTotals = getPaymentSummaryTotalsFromSummary(paymentSummary);

        matchingFeeRows.forEach((row) => {
          const totals = getFeeTotalsForRow(row);
          expectedAmount = Math.max(expectedAmount, totals.expected || 0);

          const transactionPaid = getAnyNumber(row, ["amount_paid", "paid_amount"]);
          const aggregatePaid = totals.paid || getAnyNumber(row, ["Paid_Amount", "Total_Paid", "totalPaid", "dynamicFeePaidTotal"]);
          const installmentPaid = getInstallmentPaidTotalForRow(row);
          const explicitRemaining = getExplicitRemainingAmount(row);

          installmentPaidFallback = Math.max(installmentPaidFallback, installmentPaid);

          if (transactionPaid > 0) {
            transactionPaidTotal += transactionPaid;
          } else {
            aggregatePaidFallback = Math.max(aggregatePaidFallback, aggregatePaid, totals.paid || 0);
          }

          if (!(transactionPaid > 0 && explicitRemaining > 0)) {
            const rowDue = explicitRemaining || Math.max(totals.unpaid || 0, 0);
            dueAmount = Math.max(dueAmount, rowDue);
          }

          const rowDate =
            row?.record_date || row?.payment_date || row?.Receipt_Date || row?.createdAt || row?.date || "";
          if (rowDate && (!latestDate || new Date(rowDate) > new Date(latestDate))) {
            latestDate = rowDate;
          }
        });

        if (matchingUnpaidRow) {
          const unmatchedTotals = getFeeTotalsForRow(matchingUnpaidRow);
          expectedAmount = Math.max(expectedAmount, unmatchedTotals.expected || 0);
          dueAmount = Math.max(dueAmount, unmatchedTotals.unpaid || 0);
          aggregatePaidFallback = Math.max(
            aggregatePaidFallback,
            unmatchedTotals.paid || getAnyNumber(matchingUnpaidRow, ["Paid_Amount", "Total_Paid", "totalPaid", "dynamicFeePaidTotal"])
          );
        }

        const paidAmount = Math.max(transactionPaidTotal, aggregatePaidFallback, installmentPaidFallback);
        const resolvedPaid = Math.max(totalPaidForStudent, paidAmount, paymentSummaryTotals.paid);
        const classTotal =
          selectedClassFilter &&
          selectedSectionFilter &&
          normalizeClassLabel(student?.className || "") === normalizeClassLabel(selectedClassFilter) &&
          normalizeSectionLabel(student?.section || "") === normalizeSectionLabel(selectedSectionFilter) &&
          selectedClassDefaultDue > 0
            ? selectedClassDefaultDue
            : expectedAmount;

        const computedDueFromSelectedClass = classTotal > 0 ? Math.max(classTotal - resolvedPaid, 0) : 0;
        const resolvedDue =
          dueAmount > 0
            ? Math.max(dueAmount - resolvedPaid, 0)
            : computedDueFromSelectedClass > 0
              ? computedDueFromSelectedClass
              : Math.max(expectedAmount - resolvedPaid, 0);
        const resolvedTotal =
          classTotal > 0 ? classTotal : expectedAmount > 0 ? expectedAmount : resolvedPaid + resolvedDue;

        return {
          id: student.id,
          name: student.name,
          className: student.className || "-",
          section: student.section || "-",
          totalAmount: resolvedTotal,
          paidAmount: resolvedPaid,
          dueAmount: resolvedDue,
          latestDate: formatDisplayDate(latestDate),
        };
      })
      .filter((student) => student.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    allFeeStatusRows,
    formatDisplayDate,
    getStudentName,
    getAnyNumber,
    getFeeTotalsForRow,
    normalizeClassLabel,
    normalizeSectionLabel,
    selectedClassDefaultDue,
    selectedClassFilter,
    selectedClassPaidTotalsMap,
    selectedSectionFilter,
    studentDirectory,
    unpaidStudents,
    paymentSummaryMap,
    getPaymentSummaryTotalsFromSummary,
  ]);

  const hasSelectedClassSection =
    selectedClassFilter && selectedSectionFilter;

  const openPaymentGrid = useCallback(
    (student) => {
      const className = student?.className || selectedClassFilter || "";
      const sectionName = student?.section || selectedSectionFilter || "";

      if (!className || !sectionName) return;

      const incomingId = student?.id;
      const incomingIdIsUsable =
        incomingId !== null &&
        incomingId !== undefined &&
        String(incomingId).trim() !== "" &&
        !String(incomingId).startsWith("student-");

      const resolvedStudent = normalizedOutstandingStudents.find((entry) => {
        const sameName =
          String(entry?.name || "").trim().toLowerCase() ===
          String(student?.name || "").trim().toLowerCase();
        const sameClass = normalizeClassLabel(entry?.className) === normalizeClassLabel(className);
        const sameSection = normalizeSectionLabel(entry?.section) === normalizeSectionLabel(sectionName);
        return sameName && sameClass && sameSection;
      });

      const resolvedStudentId = incomingIdIsUsable
        ? incomingId
        : resolvedStudent?.id || null;

      localStorage.setItem("selectedClassSection", `${className}_${sectionName}`);
      localStorage.setItem("className", className);
      localStorage.setItem("section", sectionName);

      setPopupSelection({
        className,
        sectionName,
        studentId: resolvedStudentId,
        studentName: student?.name || "",
      });
      setSelectedStudentTransactions([]);
      setSelectedStudentTransactionsError("");
      setPaymentPopupTab("student-data");
      setIsPaymentPopupOpen(true);
    },
    [
      normalizedOutstandingStudents,
      selectedClassFilter,
      selectedSectionFilter,
      normalizeClassLabel,
      normalizeSectionLabel,
    ]
  );

  const handleCreateFeeType = useCallback(
    async (event) => {
      event.preventDefault();
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) {
        setCreateFeeTypeError("School code not found.");
        return;
      }
const feeName = toTitleCase(newFeeTypeForm.feesType);
const scope = String(newFeeTypeForm.scope || "").trim();
const frequency = String(newFeeTypeForm.frequency || "").trim();

if (!feeName) {
  setCreateFeeTypeError("Fee name is required.");
  return;
}

if (!scope) {
  setCreateFeeTypeError("Scope is required.");
  return;
}

if (!frequency) {
  setCreateFeeTypeError("Frequency is required.");
  return;
}

      const normalizedName = feeName.toLowerCase();
      const alreadyExists = dynamicFeeTypes.some(
        (item) => String(item.feeName || "").trim().toLowerCase() === normalizedName
      );
      if (alreadyExists) {
        setCreateFeeTypeError("This fee type already exists.");
        return;
      }

      setCreateFeeTypeLoading(true);
      setCreateFeeTypeError("");

 const nextFeeType = {
  feeName,
  feesType: feeName,
  priority: dynamicFeeTypes.length + 1,
  scope: newFeeTypeForm.scope,
  frequency: newFeeTypeForm.frequency,
  installments:
    newFeeTypeForm.frequency === "Term wise"
      ? Math.max(1, Number(newFeeTypeForm.installments) || 1)
      : 1,
};

      try {
        const payload = {
          schoolCode,
          ...nextFeeType,
        };
        await axios.post("https://cleezoclass.com:4000/api/fee-types", payload);
        setDynamicFeeTypes((prev) => [
          ...prev,
          { id: `${Date.now()}`, ...nextFeeType },
        ]);

        setNewFeeTypeForm({
          feesType: "",
          scope: "",
          frequency: "",
          installments: "",
        });
        setIsCreateFeeTypePopupOpen(false);
      } catch (error) {
        setCreateFeeTypeError(error?.response?.data?.message || "Failed to save fee type.");
      } finally {
        setCreateFeeTypeLoading(false);
      }
    },
    [dynamicFeeTypes, newFeeTypeForm]
  );

const openCreateFeeTypePopup = useCallback(() => {
    setIsAssistantPopupOpen(false);
    setCreateFeeTypeError("");
    setCreateFeeTypeLoading(false);
    setIsCreateFeeTypePopupOpen(true);
  }, []);

  const openAddFeesPopup = useCallback(() => {
    setIsAssistantPopupOpen(false);
    setAddFeesPanelTab("fees");
    setIsAddFeesPopupOpen(true);
  }, []);

  const openAssistantPanel = useCallback(() => {
    setIsAddFeesPopupOpen(false);
    setIsAssistantPopupOpen(true);
  }, []);

  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;
    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => {
        setSchoolLogo(data.logo || "/default-logo.png");
        const resolvedSchoolName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.schoolName || data?.name,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "School",
        });
        setSchoolName(resolvedSchoolName);
        localStorage.setItem("schoolName", resolvedSchoolName);
        localStorage.setItem("instituteName", resolvedSchoolName);
        setInstituteAddress(data.address || "Address not available");
      })
      .catch(() => {
        setSchoolLogo("/default-logo.png");
        const fallbackSchoolName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "School",
        });
        setSchoolName(fallbackSchoolName);
        localStorage.setItem("schoolName", fallbackSchoolName);
        localStorage.setItem("instituteName", fallbackSchoolName);
        setInstituteAddress("Address not available");
      });
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
    setProfileSaveStatus("");
  }, [profileEditOpen, userInfo]);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
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
      setProfileEditOpen(false);
    } catch (error) {
      setProfileSaveStatus(
        error?.response?.data?.message ||
          error?.message ||
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

  const studentManagementPopupUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${import.meta.env.BASE_URL}StudentManagement`;
  }, []);

    const sidebarItems = [
    { key: "home", label: "Dashboard", icon: dashboardIcon, iconAlt: "Dashboard", active: true },
    { key: "collect-fee", label: "Fees", icon: collectFeeIcon ,onClick: () => navigate("/AccountantFees") },
    { key: "add-fee", label: "Add Fees", icon: addFeeIcon ,onClick: openAddFeesPopup },
    {
      key: "add-student",
      label: "Add Student",
      icon: addStudentIcon,
      onClick: () => setIsStudentManagementPopupOpen(true),
      className: isStudentManagementPopupOpen ? "accountant-sidebar-item-active" : "",
    },
    {
      key: "add-expense",
      label: "Expense",
      icon: expenseIcon,
      onClick: () => navigate("/AccountantExpenses"),
    },
    { key: "report", label: "Reports", icon: reportIcon, onClick: () => navigate("/AccountantReportsPage") },
  ];

  const topbarTabs = [
    {
      key: "dashboard",
      label: "Dashboard",
      active: true,
      className: "accountant-topbar-tab-button",
      onClick: () => navigate("/AccountantDashboard"),
    },
    {
      key: "fees",
      label: "Fees",
      className: "accountant-topbar-tab-button",
      onClick: () => navigate("/AccountantFees"),
    },
    {
      key: "expense",
      label: "Expense",
      className: "accountant-topbar-tab-button",
      onClick: () => navigate("/AccountantExpenses"),
    },
    {
      key: "reports",
      label: "Reports",
      className: "accountant-topbar-tab-button",
      onClick: () => navigate("/AccountantReportsPage"),
    },
  ];



  const topbarRight = (
    <>
         <button onClick={downloadApp}
         style={{border:"none",
          
         }}>
           <FiDownload 
           style={{
            color :"#e9818c",
            fontSize:"34px"
           }}
           title="Offline App"/>
         </button>

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
                  <img src={userInfo.photo} alt="Profile" className="header-profile-avatar-image" />
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
                <div className="header-profile-form">
                  <label className="header-profile-label">
                    <strong>Gender:</strong>
                    <input
                      type="text"
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
                      className="header-profile-input"
                    />
                  </label>
                  <label className="header-profile-label">
                    <strong>Phone:</strong>
                    <input
                      type="text"
                      value={profileForm.phone_no}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone_no: e.target.value }))}
                      className="header-profile-input"
                    />
                  </label>
                  <label className="header-profile-label">
                    <strong>Email:</strong>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="header-profile-input"
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
                  <div className="header-profile-email">
                    <strong>Email:</strong> {userInfo.email}
                  </div>
                </>
              )}

              <div><strong>School Name:</strong> {schoolName}</div>
              <div><strong>School Address:</strong> {instituteAddress}</div>
            </div>

            {profileEditOpen && (
              <>
                {profileSaveStatus && (
                  <div
                    className={`header-profile-status ${
                      profileSaveStatus.toLowerCase().includes("failed") ||
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

            <button onClick={handleLogout} className="header-profile-logout">
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );

    

return (
  <>
    <DashboardLayout
      pageClassName="frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page dashboard-home-page"

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
    logoAlt={schoolName || "Logo"}
      instituteName={schoolName}
    topbarRight={topbarRight}
    footerLogoSrc={logoab}
    footerLogoAlt="Cleezo Class"
  >
    <div className="accountant-grid">


 <div className="accountant-row accountant-row-top">

  {/* LEFT TEXT */}
  <div className="accountant-welcome-block">
            <h2>Hi, {userInfo?.name || "User"}!</h2>
    <p>Check Due Status,</p>
    <p>Report dues to Class Teacher</p>
    <p>Submit Day wise Ledger</p>
  </div>

  {/* TASK CARD */}
 <div className="accountant-task-card accountant-card">
    <div className="taskCardContent">
      <TaskOfTheDay showSeparatedControls />
    </div>
  </div>

  {/* QUICK CARDS */}
  <div className="accountant-mini-cards">
    <div
      className="accountant-quick-card accountant-card accountant-quick-card-clickable"
      role="button"
      tabIndex={0}
      onClick={openCreateFeeTypePopup}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") openCreateFeeTypePopup();
      }}
    >
      <img src={createFeeIcon} alt="Create Fee type" />
      <h4>Create Fee type</h4>
      <p>eg:tuition fee</p>
    </div>

    <div
      className="accountant-quick-card accountant-card accountant-quick-card-clickable"
      role="button"
      tabIndex={0}
      onClick={openAddFeesPopup}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") openAddFeesPopup();
      }}
    >
      <img src={addFeesIcon} alt="Add Fees" />
      <h4>Add Fees</h4>
      <p>Fees & Discounts list</p>
    </div>

    <div
      className="accountant-quick-card accountant-card accountant-quick-card-clickable"
      role="button"
      tabIndex={0}
      onClick={openAssistantPanel}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") openAssistantPanel();
      }}
    >
      <img src={assistantIcon} alt="Assistant" />
      <h4>Assistant</h4>
      <p>Daily Activity check</p>
    </div>
  </div>

</div>

  <div className="accountant-row accountant-row-middle">
  <div className="accountant-collect-card accountant-card">
    <div className="collect-header">
      <div className="Heading">
        Collect Fees
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600 }}>
          {dashboardLoading ? "..." : `${summary.studentCount || 0} Students`}
        </span>
        <button type="button" className="collect-filter" style={{border:'none',fontSize:'18px',color:'#000'}}>
          <span>As on today</span>
        </button>
      </div>
    </div>

    <button
      type="button"
      className="accountant-inline-plus accountant-inline-plus-below"
      onClick={() => navigate("/AccountantFees")}
    >
      +
    </button>


    <div className="accountant-collect-content">
      <div className="accountant-progress-panel">
        <p>    {renderProgressRing(
          summary.progress,
        dashboardLoading ? "..." : `${Number(summary.progress).toFixed(2)}%`
        )}</p>
    
      </div>

      <div className="collect-stats">
        <p><span className="normalText">Gross:</span><strong>{dashboardLoading ? "Loading..." : formatINR(summary.gross)}</strong></p>
        <p><span className="normalText">Discounts:</span><strong>{dashboardLoading ? "Loading..." : formatINR(summary.concession)}</strong></p>
        <p><span className="normalText"> Total Amount:</span><strong>{dashboardLoading ? "Loading..." : formatINR(summary.netPayable)}</strong></p>
        <p><span className="normalText">Total Paid:</span><strong>{dashboardLoading ? "Loading..." : formatINR(summary.totalPaid)}</strong></p>
      </div>
    </div>

    <div className="accountant-total-due">
      <span>Total Due</span>
      <p>{dashboardLoading ? "Loading..." : formatINR(summary.totalDue)}</p>
    </div>
  </div>

  <div className="accountant-outstanding-card accountant-card">
    <div className="accountant-card-header">
      <div className="Heading">Outstanding</div>

      <div className="accountant-card-filters">
        <input
          type="search"
          className="fdr-table-search accountant-outstanding-search"
          placeholder="Search name"
          value={outstandingSearchTerm}
          onChange={(event) => setOutstandingSearchTerm(event.target.value)}
        />
       <select
  className="accountant-card-filter"
    value={selectedClassFilter}
    onChange={(event) => {
      setSelectedClassFilter(event.target.value);
    }}
  >
  <option value="">Select Class</option>

  {classOptions.map((cls) => (
    <option key={cls} value={cls}>
      {cls}
    </option>
  ))}
</select>
    <select
  className="accountant-card-filter"
  value={selectedSectionFilter}
  onChange={(event) => setSelectedSectionFilter(event.target.value)}
  disabled={!selectedClassFilter}
>
  <option value="">
    {selectedClassFilter ? "Select Section" : "Select Class First"}
  </option>

  {selectedClassFilter &&
    sectionOptions.map((sec) => (
      <option key={sec} value={sec}>
        {sec}
      </option>
    ))}
</select>
      </div>
    </div>

    <div className="accountant-student-list">
      {visibleOutstandingStudents.length ? (
        visibleOutstandingStudents.map((student, index) => (
      <div
  key={student.id}
  className={`accountant-student-mini ${index === 0 ? "is-active" : ""}`}
  onClick={() => {
    if (!selectedClassFilter) return; // Don't open popup
    openPaymentGrid(student);
  }}
  role="button"
  tabIndex={0}
  onKeyDown={(event) => {
    if ((event.key === "Enter" || event.key === " ") && selectedClassFilter) {
      openPaymentGrid(student);
    }
  }}
  style={{
    cursor: selectedClassFilter ? "pointer" : "not-allowed",
    opacity: selectedClassFilter ? 1 : 0.6,
  }}
>
            <div className="accountant-student-avatar-wrap">
              <img src={userAvatar} alt="" />
            </div>
            <h4>{student.name}</h4>
            <p>{[student.className, student.section].filter(Boolean).join(" ")}</p>
            
          </div>
        ))
      ) : normalizedOutstandingStudents.length ? (
        normalizedOutstandingStudents.slice(0, 12).map((student, index) => (
          <div
            key={student.id || index}
            className={`accountant-student-mini ${index === 0 ? "is-active" : ""}`}
          >
                             <div className="accountant-student-avatar-wrap">
  <FaUser className="dashboard-user-icon accountant-user-icon" />
</div>
            <h4>{student.name}</h4>
            <p>{student.className} {student.section}</p>
          </div>
        ))
      ) : (
        <div className="accountant-student-mini">
                  <div className="accountant-student-avatar-wrap">
  <FaUser className="dashboard-user-icon accountant-user-icon" />
</div>
          <h4>{dashboardLoading ? "Loading students..." : "No students found"}</h4>
          <h4>{dashboardLoading ? "Please wait..." : "Try changing Class/Section filters"}</h4>
        </div>
      )}

      <div className="accountant-add-student accountant-add-student-grid">
        
        {/* <span><strong>{hasSelectedClassSection ? "Open Grid" : "Choose Class & Section"}</strong></span> */}
      </div>
    </div>
  </div>


  <div className="accountant-feetype-card accountant-card">
    <div className="accountant-card-header accountant-feetype-header">
      <div className="Heading"> 
        {isAddFeesPopupOpen
          ? addFeesPanelTab === "discount"
            ? "Discounts"
            : "Selected Class Fees"
          : isAssistantPopupOpen
            ? "Assistant"
            : "Fee Type"}
      </div>

    

        <div className="accountant-feetype-count">
          <strong>
            {isAddFeesPopupOpen
              ? addFeesPanelTab === "discount"
                ? filteredDiscountStudents.length
                : addFeePreview.rows.length
              : isAssistantPopupOpen
                ? assistantActionItems.length
                : dynamicFeeTypes.length}
          </strong>
          <span className="normalText">
            {isAddFeesPopupOpen
              ? addFeesPanelTab === "discount"
                ? "Discount students"
                : "Selected fees"
              : isAssistantPopupOpen
                ? "Action items"
                : "Fee types"}
          </span>
        </div>
      </div>
   

    <div className="accountant-feetype-table-wrap">
      {isAddFeesPopupOpen ? (
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "12px 12px 0",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="accountant-create-new-btn"
            onClick={() => setAddFeesPanelTab("fees")}
            style={{
              background: addFeesPanelTab === "fees" ? "#fdecef" : "#ffffff",
              color: "#c44755",
              border: "1px solid #f2c9cf",
            }}
          >
            Fees
          </button>
          <button
            type="button"
            className="accountant-create-new-btn"
            onClick={() => setAddFeesPanelTab("discount")}
            style={{
              background: addFeesPanelTab === "discount" ? "#fdecef" : "#ffffff",
              color: "#c44755",
              border: "1px solid #f2c9cf",
            }}
          >
            Discounts
          </button>
        </div>
      ) : null}
      {isAssistantPopupOpen ? (
        <div className="accountant-assistant-panel">
          <div className="accountant-assistant-summary">
            <div className="accountant-assistant-summary-card is-paid">
              <span>Paid</span>
              <strong>{dashboardLoading ? "Loading..." : formatINR(summary.totalPaid)}</strong>
            </div>
            <div className="accountant-assistant-summary-card is-balance">
              <span>Balance</span>
              <strong>{dashboardLoading ? "Loading..." : formatINR(summary.totalDue)}</strong>
            </div>
          </div>

          <div className="accountant-assistant-inline-grid">
            <section className="accountant-assistant-inline-section">
              <div className="accountant-assistant-inline-header">
                <h4>Unpaid Students</h4>
                <span>{unpaidStudents.length}</span>
              </div>
              <div className="accountant-assistant-inline-list">
                {unpaidStudents.length ? (
                  unpaidStudents.slice(0, 8).map((student, index) => (
                    <div key={student.id ?? index} className="accountant-assistant-inline-item">
                      <strong>{getStudentName(student)}</strong>
                      <span>{formatINR(getDueAmount(student))}</span>
                    </div>
                  ))
                ) : (
                  <div className="accountant-assistant-empty">No unpaid students found.</div>
                )}
              </div>
            </section>

            <section className="accountant-assistant-inline-section">
              <div className="accountant-assistant-inline-header">
                <h4>Discount Students</h4>
                <span>{discountStudentsLoading ? "..." : discountStudents.length}</span>
              </div>
              <div className="accountant-assistant-inline-list">
                {discountStudentsLoading ? (
                  <div className="accountant-assistant-empty">Loading discounts...</div>
                ) : discountStudents.length ? (
                  discountStudents.slice(0, 8).map((student, index) => (
                    <div key={student.id ?? index} className="accountant-assistant-inline-item">
                      <strong>{getStudentName(student)}</strong>
                      <span>{formatINR(getDiscountAmount(student))}</span>
                    </div>
                  ))
                ) : (
                  <div className="accountant-assistant-empty">No discount students found.</div>
                )}
              </div>
            </section>
          </div>

          <section className="accountant-assistant-inline-section accountant-assistant-inline-section-actions">
            <div className="accountant-assistant-inline-header">
              <h4>My Actions</h4>
              <span>{assistantActionItems.length}</span>
            </div>
            <div className="accountant-assistant-actions">
              {assistantActionItems.map((item, index) => (
                <article key={`${item.title}-${index}`} className="accountant-assistant-action-card">
                  <h5>{item.title}</h5>
                  <p>{item.detail}</p>
                  <ol>
                    {item.procedure.map((step, stepIndex) => (
                      <li key={`${item.title}-${stepIndex}`}>{step}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : isAddFeesPopupOpen && addFeesPanelTab === "discount" ? (
        <div style={{ maxHeight: "152px", overflowY: "auto" }}>
          <table className="accountant-feetype-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Discount Amount</th>
              </tr>
            </thead>
            <tbody>
              {discountStudentsLoading ? (
                <tr>
                  <td colSpan={4}>Loading discounted students...</td>
                </tr>
              ) : filteredDiscountStudents.length ? (
                filteredDiscountStudents.map((student, index) => (
                  <tr key={student.id ?? `${getStudentName(student)}-${index}`}>
                    <td>{getStudentName(student)}</td>
                    <td>{getStudentClassName(student) || "-"}</td>
                    <td>{getStudentSectionName(student) || "-"}</td>
                    <td>{formatINR(getDiscountAmount(student))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    {selectedClassFilter && selectedSectionFilter
                      ? "No discounted students found for the selected class and section."
                      : "Select class and section in Add Fees to view discounted students."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <table className="accountant-feetype-table">
          <thead>
            {isAddFeesPopupOpen ? (
              <tr>
                <th>Fee Name</th>
                <th>Fee Type</th>
                <th>Class</th>
                <th>Section</th>
                <th>Amount</th>
                <th>Installment</th>
              </tr>
            ) : (
              <tr>
                <th>Fee Name</th>
                <th>Fee Type</th>
                <th>Scope</th>
                <th>One Time / Term Wise</th>
                <th>Installments</th>
              </tr>
            )}
          </thead>
          <tbody>
            {isAddFeesPopupOpen ? (
              addFeePreview.rows.length ? (
              addFeePreview.rows.map((fee) => (
                <tr key={fee.id}>
                  <td>{fee.feeName}</td>
                  <td>{fee.feesType}</td>
                  <td>{fee.className || addFeePreview.className || "-"}</td>
                  <td>{fee.section || addFeePreview.section || "-"}</td>
                    <td>
                      <div
                        style={{ position: "relative", display: "inline-flex", width: "100%", justifyContent: "center" }}
                        onMouseEnter={() => setHoveredInstallmentFeeId(fee.id)}
                        onMouseLeave={() => setHoveredInstallmentFeeId(null)}
                        title={
                          Array.isArray(fee.installmentDetails) && fee.installmentDetails.length
                            ? fee.installmentDetails
                                .map((inst) => {
                                  const deadline = inst.deadlineDate || "-";
                                  const amount = formatINR(inst.amount);
                                  return `Inst ${inst.installmentNo || "-"}: ${amount} | Due: ${deadline}`;
                                })
                                .join("\n")
                            : ""
                        }
                      >
                        <span style={{ cursor: "help", textDecoration: "underline dotted" }}>
                          {formatINR(fee.amount)}
                        </span>
                        {hoveredInstallmentFeeId === fee.id &&
                        Array.isArray(fee.installmentDetails) &&
                        fee.installmentDetails.length > 0 ? (
                          <div
                            style={{
                              position: "absolute",
                              top: "calc(100% + 8px)",
                              left: "50%",
                              transform: "translateX(-50%)",
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              boxShadow: "0 10px 28px rgba(0,0,0,0.14)",
                              borderRadius: "10px",
                              padding: "10px 12px",
                              minWidth: "220px",
                              zIndex: 20,
                              textAlign: "left",
                              fontSize: "11px",
                              color: "#111827",
                              pointerEvents: "none",
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: "8px", color: "#c44755" }}>
                              Installment Split
                            </div>
                            <div style={{ display: "grid", gap: "6px" }}>
                              {fee.installmentDetails
                                .slice()
                                .sort((a, b) => Number(a.installmentNo || 0) - Number(b.installmentNo || 0))
                                .map((inst) => (
                                  <div
                                    key={`${fee.id}-${inst.installmentNo}`}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      gap: "12px",
                                    }}
                                  >
                                    <span>Inst {inst.installmentNo || "-"}</span>
                                    <span style={{ whiteSpace: "nowrap" }}>
                                      {formatINR(inst.amount)} {inst.deadlineDate ? `• ${inst.deadlineDate}` : ""}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>{fee.installments}</td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    {addFeePreview.className && addFeePreview.section
                      ? "No fees added for the selected class and section."
                      : "Select class and section in Add Fees to view fee details."}
                  </td>
                </tr>
              )
            ) : (
              dynamicFeeTypes.length ? (
                dynamicFeeTypes.map((fee) => (
                  <tr key={fee.id}>
                    <td>{fee.feeName}</td>
                    <td>{fee.feesType}</td>
                    <td>{fee.scope}</td>
                    <td>{fee.frequency}</td>
                    <td>{fee.installments}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>No fee types available for this school yet.</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  </div>
</div>

<div className="accountant-row accountant-row-bottom">
  <div className="accountant-bottom-left">
    <div className="accountant-ticket-card accountant-card">
      <div className="tickets-header-and-tabs">
        <div className="tickets-left">
          <div className="tickets-header">Tickets</div>

          <div className="tickets-tabs">
            <button
              className={`tickets-tab ${ticketActiveTab === "staff" ? "active" : ""}`}
              onClick={() => setTicketActiveTab("staff")}
            >
              Staff
            </button>

            <button
              className={`tickets-tab ${ticketActiveTab === "students" ? "active" : ""}`}
              onClick={() => setTicketActiveTab("students")}
            >
              Students
            </button>
          </div>
        </div>
      </div>

      {ticketActiveTab === "students" && (
        <div className="tickets-student-filter-row">
          <select
            value={ticketSelectedClassSection}
            onChange={(e) => setTicketSelectedClassSection(e.target.value)}
            disabled={ticketDropdownLoading}
            className="collect-filter tickets-class-dropdown-select"
          >
            <option value="">Select Class &amp; Section</option>
            {ticketDerivedClasses.map((cls) => {
              const classLabel = getTicketClassLabel(cls);
              if (!classLabel) return null;

              const sectionsForClass = ticketSectionMap
                .filter((item) => {
                  const classValue = item.class_name || item.class || item.className;
                  return String(classValue) === String(classLabel);
                })
                .map((item) => item.section || item.section_name || item.sectionName);

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

      <div className="tickets-content">
        {ticketActiveTab === "staff" && (
          <div className="tc-staffAssignSection">
            {ticketLoadingTeachers && <p>Loading teachers...</p>}

            {!ticketLoadingTeachers && (
              <div className="tc-teacherGrid">
                {ticketTeacherRows.map((row, idx) => (
                  <div key={idx} className="tc-teacherRow">
                    {row.map((teacher, teacherIndex) => {
                      const teacherId = getTicketTeacherId(
                        teacher,
                        idx * TICKETS_ITEMS_PER_ROW + teacherIndex
                      );
                      const teacherName = getTicketTeacherName(teacher);
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
                            setTicketSelectedTeacherId(teacherId);
                            openTicketModal({ type: "teacher", teacher: normalizedTeacher });
                          }}
                        >
                          <div
                            className="tc-teacherAvatar"
                            style={{
                              background:
                                ticketSelectedTeacherId === teacherId ? "#f6a5ab" : "#f1f2f4",
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
              </div>
            )}
          </div>
        )}

        {ticketActiveTab === "students" && (
          <div className="tc-staffAssignSection tickets-student-panel">
            <div className="tc-teacherGrid tickets-student-grid">
              {filteredTicketStudents.length === 0 ? (
                <div className="payment-no-students">
                  {ticketClassName ? "No students found" : "Please select a class and section"}
                </div>
              ) : (
                ticketStudentRows.map((row, rowIndex) => (
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
                    ticketClassName ? ` | ${ticketClassName}-${ticketSection}` : ""
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
            {ticketSuccess && <div className="tickets-success">{ticketSuccess}</div>}
            {ticketError && <div className="tickets-error">{ticketError}</div>}
          </div>
        </div>
      )}
    </div>
  </div>

   <div
    className="accountant-premium-card accountant-card"
    role="button"
    tabIndex={0}
    onClick={() => setPremiumPopupMessage(PREMIUM_SUPPORT_MESSAGE)}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setPremiumPopupMessage(PREMIUM_SUPPORT_MESSAGE);
      }
    }}
   >
    <img src={premiumIcon} alt="Go Premium" className="accountant-premium-icon" />

    <h3>Go Premium!</h3>
    <p>
      opt in for premium pack and get full access of LeadX - fully
      Automated Admission & 1000 leads every month.
    </p>

    <button type="button" onClick={(event) => {
      event.stopPropagation();
      setPremiumPopupMessage(PREMIUM_SUPPORT_MESSAGE);
    }}>Working CTA</button>
  </div>

  <div className="accountant-bottom-right">
    <div className="accountant-income-card accountant-card">
 {renderProgressRing(
          summary.progress,
        dashboardLoading ? "..." : `${Number(summary.progress).toFixed(2)}%`
        )}      <div className="blockText">Income.</div>
      <div className="normalText">Percentile Profit</div>
    </div>

    <div className="accountant-prevdue-card accountant-card">
      <p className="accountant-prevdue-amount">
        {dashboardLoading ? "Loading..." : formatINR(previousYearDue)}
      </p>
       <div className="blockText">Previous Year Due</div>
     <div className="normalText">Pending Dues for Yr. {previousYearLabel}</div>
    </div>

    <div className="accountant-total-strip accountant-card">
     
 <div className="accountant-total-strip-list">
                       <div className="accountant-total-strip-item">
                      <strong>{dashboardLoading ? "Loading..." : formatINR(summary.netPayable)}</strong>
                      <span>Total Amount</span>
                    </div>
                    <div className="accountant-total-strip-item">
                      <strong>{dashboardLoading ? "Loading..." : formatINR(summary.concession)}</strong>
                      <span> Discounts</span>
                    </div>

                    <div className="accountant-total-strip-item">
                      <strong>{dashboardLoading ? "Loading..." : formatINR(summary.totalPaid)}</strong>
                      <span>Total Paid</span>
                    </div>

                 
                  </div>
      <div className="accountant-total-strip-right">
        <span>Total Due</span>
        <h2>{dashboardLoading ? "Loading..." : formatINR(summary.totalDue)}</h2>
        <p>
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  </div>
</div>



</div>
     {(dashboardLoading || ticketLoadingTeachers ) && <GlobalLoader timeoutSeconds={10}/>}

    </DashboardLayout>

  {isStudentManagementPopupOpen && (
    <div
      className="globalpopup-overlay accountant-student-management-popup-overlay"
      onClick={() => setIsStudentManagementPopupOpen(false)}
      style={{ zIndex: 3200 }}
    >
      <div
        className="globalpopup-content accountant-student-management-popup"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="globalpopup-header accountant-student-management-popup-header">
          <div>
            <div className="Heading">Add Student</div>
            <div className="normalText">Open the student form inside a popup</div>
          </div>
          <button
            type="button"
            className="globalpopup-close-btn accountant-student-management-close-btn"
            onClick={() => setIsStudentManagementPopupOpen(false)}
            aria-label="Close add student popup"
          >
            ×
          </button>
        </div>
        <div className="accountant-student-management-popup-body">
          <iframe
            title="Student Management Add Popup"
            src={studentManagementPopupUrl}
            className="accountant-student-management-iframe"
          />
        </div>
      </div>
    </div>
  )}
{isPaymentPopupOpen && (
  <div
    className="globalpopup-overlay accountant-payment-popup-overlay"
    onClick={() => {
      setIsPaymentPopupOpen(false);
      setPaymentPopupTab("student-data");
      setSelectedStudentTransactions([]);
      setSelectedStudentTransactionsError("");
    }}
    style={{ zIndex: 3200 }}
  >
    <div
      className="globalpopup-content accountant-payment-popup"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        className="globalpopup-close-btn accountant-payment-popup-close-btn"
        onClick={() => {
          setIsPaymentPopupOpen(false);
          setPaymentPopupTab("student-data");
          setSelectedStudentTransactions([]);
          setSelectedStudentTransactionsError("");
        }}
        aria-label="Close fee popup"
      >
        ×
      </button>

      <div className="accountant-payment-popup-tabs">
        <button
          type="button"
          className={`accountant-payment-popup-tab ${paymentPopupTab === "student-data" ? "active" : ""}`}
          onClick={() => setPaymentPopupTab("student-data")}
        >
Student Overview        </button>
        <button
          type="button"
          
          className={`accountant-payment-popup-tab ${paymentPopupTab === "student-transactions" ? "active" : ""}`}
          onClick={() => {
            setPaymentPopupTab("student-transactions");
            fetchSelectedStudentTransactions();
          }}
        >
          Student Transactions
        </button>
      </div>

      {paymentPopupTab === "student-data" ? (
 <>
          {/* 1️⃣ STUDENT INFO GRID */}
          <div className="accountant-payment-popup-student-grid">
            {[
              { label: "Student", value: paymentPopupStudentRecord?.name || popupSelection?.studentName || "-" },
              { label: "Class", value: paymentPopupStudentRecord?.class_name || paymentPopupStudentRecord?.Class_name || paymentPopupStudentRecord?.className || popupSelection?.className || "-" },
              { label: "Section", value: paymentPopupStudentRecord?.section || paymentPopupStudentRecord?.Section || paymentPopupStudentRecord?.sectionName || popupSelection?.sectionName || "-" },
              { label: "Father Name", value: paymentPopupStudentRecord?.father_name || paymentPopupStudentRecord?.fatherName || paymentPopupStudentRecord?.father || "-" },
              { label: "Mobile Number", value: paymentPopupStudentRecord?.mobile_no || paymentPopupStudentRecord?.mobileNo || paymentPopupStudentRecord?.phone_no || paymentPopupStudentRecord?.phone || "-" },
              { label: "Admission No", value: paymentPopupStudentRecord?.admission_no || paymentPopupStudentRecord?.admissionNo || paymentPopupStudentRecord?.admission_number || "-" },
              // { label: "Gender", value: paymentPopupStudentRecord?.gender || "-" },
              // { label: "Email", value: paymentPopupStudentRecord?.email || "-" },
            ].map((item) => (
              <div key={item.label} className="accountant-payment-popup-info-card">
                <span className="accountant-payment-popup-info-label">{item.label}</span>
                <span className="accountant-payment-popup-info-value">{item.value}</span>
              </div>
            ))}
          </div>

          {/* 🔥 2️⃣ SUMMARY CARDS & MAIN FEE TABLE */}
          <div className="accountant-payment-popup-table-wrap">
            <div style={{ display: "flex", gap: "20px", marginBottom: "15px", padding: "12px", background: "#f5f7fb", borderRadius: "8px", flexWrap: "wrap" }}>
              <div>
                <strong>Original Total:</strong>{" "}
                {formatINR(enrichedPaymentRows.reduce((sum, row) => sum + Number(row.originalAmount ?? row.totalAmount ?? 0), 0))}
              </div>
              <div>
                <strong>Total Discount:</strong>{" "}
                <span style={{ fontWeight: "bold", color: "#dc2626" }}>
                  - {formatINR(enrichedPaymentRows.reduce((sum, row) => sum + Number(row.discountAmount || 0), 0))}
                </span>
              </div>
              <div>
                <strong>Net Payable:</strong>{" "}
                <span style={{ fontWeight: "bold", color: "#059669" }}>
                  {formatINR(enrichedPaymentRows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0))}
                </span>
              </div>
              <div>
                <strong>Total Paid:</strong>{" "}
                {formatINR(enrichedPaymentRows.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0))}
              </div>
              <div>
                <strong>Total Due:</strong>{" "}
                <span style={{ fontWeight: "bold", color: "#d97706" }}>
                  {formatINR(enrichedPaymentRows.reduce((sum, row) => sum + Number(row.dueAmount || 0), 0))}
                </span>
              </div>
            </div>

            <table className="accountant-payment-popup-table">
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th>Installment</th>
                  <th>Original</th>
                  <th style={{ color: "#dc2626" }}>Discount</th>
                  <th>Net Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Over Due</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {enrichedPaymentRows.length > 0 ? (
                  enrichedPaymentRows.map((row) => {
                    const netTotal = Number(row.totalAmount || 0);
                    const discount = Number(row.discountAmount || 0);
                    const originalTotal = Number(row.originalAmount ?? row.totalAmount ?? 0);

                    // ─── OVERDUE & PENDING CALCULATION ───
                   // ─── OVERDUE & PENDING CALCULATION ───
const today = new Date();
today.setHours(0, 0, 0, 0);

const dueAmount = Number(row.dueAmount || 0);
const hasDueAmount = dueAmount > 0.01;

// Initialize variables to track individual installment statuses
let totalOverdueAmount = 0;
let totalPendingAmount = 0;
let oldestUnpaidDeadlineStr = "";

if (Array.isArray(row.installments) && row.installments.length > 0) {
  row.installments.forEach((inst) => {
    const instAmount = Number(inst.amount || 0);
    if (instAmount > 0) {
      const instDeadlineStr = inst.deadlineDate || inst.dueDate || inst.installmentDate || "";
      const instDeadlineDate = instDeadlineStr && instDeadlineStr !== "-" ? new Date(instDeadlineStr) : null;
      if (instDeadlineDate) instDeadlineDate.setHours(0, 0, 0, 0);

      // Check if this specific installment is past its deadline
      if (instDeadlineDate && instDeadlineDate < today) {
        totalOverdueAmount += instAmount;
      } else {
        totalPendingAmount += instAmount;
      }

      // Track the oldest unpaid deadline date string for display in the row
      if (!oldestUnpaidDeadlineStr) {
        oldestUnpaidDeadlineStr = instDeadlineStr;
      }
    }
  });
}

// Fallback to row values if no individual installments exist
if (!Array.isArray(row.installments) || row.installments.length === 0) {
  let fallbackDeadlineStr = row.paymentDate || row.deadlineDate || row.deadline || "";
  const fallbackDeadlineDate = fallbackDeadlineStr && fallbackDeadlineStr !== "-" ? new Date(fallbackDeadlineStr) : null;
  if (fallbackDeadlineDate) fallbackDeadlineDate.setHours(0, 0, 0, 0);

  if (fallbackDeadlineDate && fallbackDeadlineDate < today) {
    totalOverdueAmount = dueAmount;
  } else {
    totalPendingAmount = dueAmount;
  }
  oldestUnpaidDeadlineStr = fallbackDeadlineStr;
}

// Prioritize fallback string if empty
let deadlineStr = oldestUnpaidDeadlineStr || row.paymentDate || row.deadlineDate || row.deadline || "";

// Status rendering rules based on specific calculated amounts
let statusText = "Paid ✅";
let statusColor = "#059669"; // Green for paid

if (hasDueAmount) {
  if (totalOverdueAmount > 0) {
    statusText = `₹${formatINR(totalOverdueAmount)}`;
    statusColor = "#dc2626"; // Red for overdue
  } else if (totalPendingAmount > 0) {
    statusText = ``;
    statusColor = "#d97706"; // Orange/Amber for pending
  }
}
                    return (
                      <React.Fragment key={row.id}>
                        <tr>
                          <td>{row.feeType || "-"}</td>
                          <td className="payment-installment-cell">
                            {Array.isArray(row.installments) && row.installments.length > 0 ? (
                              <div className="payment-installments-scroll">
                                {row.installments.map((inst, idx) => (
                                  <div key={idx} className="payment-installment-card">
                                    <div className="payment-installment-title">Inst-{inst.installmentNo || idx + 1}</div>
                                    <div className="payment-installment-amount">
                                      ₹{formatINR(inst.amount || inst.installmentAmount || 0)}
                                    </div>
                                    <div className="payment-installment-date">
                                      {(inst.deadlineDate || inst.dueDate || inst.installmentDate)
                                        ? new Date(inst.deadlineDate || inst.dueDate || inst.installmentDate).toLocaleDateString("en-GB").replace(/\//g, "-")
                                        : "-"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="payment-no-installments">No Installments</span>
                            )}
                          </td>
                          <td>{formatINR(originalTotal)}</td>
                          <td style={{ color: "#dc2626", fontWeight: 600 }}>
                            {discount > 0 ? `- ${formatINR(discount)}` : "-"}
                          </td>
                          <td style={{ fontWeight: "bold" }}>{formatINR(netTotal)}</td>
                          <td>{formatINR(row.paidAmount || 0)}</td>
                          <td>{formatINR(dueAmount)}</td>

                          {/* Dynamic Over Due column displaying either "⚠️ Overdue", "Pending", or "Paid ✅" */}
                          <td style={{ fontWeight: "bold", color: statusColor }}>
                            {statusText}
                          </td>

                          <td>
                            {deadlineStr && deadlineStr !== "-"
                              ? new Date(deadlineStr).toLocaleDateString("en-GB").replace(/\//g, "-")
                              : "-"}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="accountant-payment-popup-empty">
                      No fee details found for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* 3️⃣ STUDENT TRANSACTIONS TAB */
        <div className="accountant-payment-popup-table-wrap" style={{border:'none'}}>
          <table className="accountant-payment-popup-table" style={{border:'1px solid black'}}>
            <thead>
              <tr >
                <th>S.NO.</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                {selectedTransactionPaidColumns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Total</th>
                <th>Paid Date</th>
                <th>Payment Mode</th>
                <th>Txn ID</th>
                <th>Receipt No.</th>
                <th>Receipt Date</th>
              </tr>
            </thead>
            <tbody>
              {selectedStudentTransactionsLoading ? (
                <tr>
                  <td colSpan={selectedTransactionPaidColumns.length + 11} className="accountant-payment-popup-empty">
                    Loading student transactions...
                  </td>
                </tr>
              ) : selectedStudentTransactionsError ? (
                <tr>
                  <td colSpan={selectedTransactionPaidColumns.length + 11} className="accountant-payment-popup-empty">
                    {selectedStudentTransactionsError}
                  </td>
                </tr>
              ) : selectedStudentTransactions.length > 0 ? (
                selectedStudentTransactions.map((row, index) => (
                  <tr key={`${row.receiptNumber || row.transaction_id || "txn"}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{row.StudentName || popupSelection?.studentName || "-"}</td>
                    <td>{row.Class_name || popupSelection?.className || "-"}</td>
                    <td>{row.section || popupSelection?.sectionName || "-"}</td>
                    {selectedTransactionPaidColumns.map((column) => (
                      <td key={column.key}>{formatINR(column.getValue(row))}</td>
                    ))}
                    <td style={{ fontWeight: "bold" }}>{formatINR(getTransactionPaidTotal(row))}</td>
                    <td>{formatTransactionDate(row.paidDate || row.paid_date || row.Payment_Date)}</td>
                    <td>{row.paymentMode || row.payment_mode || "-"}</td>
                    <td>{row.transaction_id || "-"}</td>
                    <td>{row.receiptNumber || "-"}</td>
                    <td>{formatTransactionDate(row.receiptDate || row.receipt_date || row.paidDate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={selectedTransactionPaidColumns.length + 11} className="accountant-payment-popup-empty">
                    No transactions found for this student.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
)}
  {isCreateFeeTypePopupOpen && (
    <div
      className="globalpopup-overlay"
      onClick={() => setIsCreateFeeTypePopupOpen(false)}
      style={{ zIndex: 3100 }}
    >
      <div
        className="globalpopup-content accountant-create-fee-popup"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="globalpopup-header accountant-create-fee-popup-header">
          <div className="accountant-create-fee-popup-heading">
            <span className="accountant-create-fee-kicker">Fee Master</span>
            <h3 className="accountant-create-fee-popup-title">Create New Fee Type</h3>
            <p className="accountant-create-fee-popup-subtitle">Add a fee type for this school dashboard</p>
          </div>
          <button
            type="button"
            className="globalpopup-close-btn"
            onClick={() => setIsCreateFeeTypePopupOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="accountant-create-fee-intro">
          <p className="accountant-create-fee-intro-text">
            Create a clean fee master once, then reuse it for collection, due tracking, and reporting.
          </p>
        </div>
        <form className="accountant-create-fee-form" onSubmit={handleCreateFeeType}>
          

          <div className="accountant-create-fee-row">
            <label className="accountant-create-fee-label">
              Fees Type
              <input
                type="text"
                value={newFeeTypeForm.feesType}
                onChange={(event) =>
                  setNewFeeTypeForm((prev) => ({ ...prev, feesType: event.target.value }))
                }
                placeholder="Ex: Books Fee"
                className="accountant-create-fee-input"
              />
            </label>

            <label className="accountant-create-fee-label">
              Scope
              <select
                value={newFeeTypeForm.scope || ""}
                onChange={(event) =>
                  setNewFeeTypeForm((prev) => ({ ...prev, scope: event.target.value }))
                }
                className="accountant-create-fee-input"
              >
                <option value="" disabled hidden>
                  -- Select Scope --
                </option>
                <option value="Class wise">Class wise</option>
                <option value="Individual">Individual</option>
              </select>
            </label>
          </div>

          <div className="accountant-create-fee-row">
            <label className="accountant-create-fee-label">
              One time / Term fees
              <select
                value={newFeeTypeForm.frequency || ""}
                onChange={(event) =>
                  setNewFeeTypeForm((prev) => ({
                    ...prev,
                    frequency: event.target.value,
                    installments: event.target.value === "Term wise" ? prev.installments : "",
                  }))
                }
                className="accountant-create-fee-input"
              >
                <option value="" disabled hidden>
                  -- Select Frequency --
                </option>
                <option value="One time">One time</option>
                <option value="Term wise">Term wise</option>
              </select>
            </label>

            <label className="accountant-create-fee-label">
              Installment
              <input
                type="number"
                min={1}
                max={12}
                value={newFeeTypeForm.frequency === "Term wise" ? (newFeeTypeForm.installments || "") : ""}
                onChange={(event) =>
                  setNewFeeTypeForm((prev) => ({
                    ...prev,
                    installments: Math.max(1, Number(event.target.value) || 1),
                  }))
                }
                disabled={newFeeTypeForm.frequency !== "Term wise"}
                className={`accountant-create-fee-input${
                  newFeeTypeForm.frequency !== "Term wise" ? " accountant-create-fee-input-disabled" : ""
                }`}
                placeholder="Enter number of installments"
              />
            </label>
          </div>

          {createFeeTypeError ? (
            <p className="accountant-create-fee-error">{createFeeTypeError}</p>
          ) : null}

          <div className="accountant-create-fee-note">
            Tip: keep the fee name short and specific so it becomes a clean column label in reports.
          </div>

          <div className="accountant-create-fee-actions">
            <button
              type="button"
              className="accountant-create-fee-cancel"
              onClick={() => setIsCreateFeeTypePopupOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="accountant-create-fee-submit" disabled={createFeeTypeLoading}>
              {createFeeTypeLoading ? "Saving..." : "Save Fee Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {isOutgoingStudentsPopupOpen && (
    <div
      className="globalpopup-overlay"
      onClick={() => setIsOutgoingStudentsPopupOpen(false)}
      style={{ zIndex: 3100 }}
    >
      <div
        className="globalpopup-content accountant-outgoing-students-popup"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="globalpopup-header accountant-create-fee-popup-header">
          <div className="accountant-create-fee-popup-heading">
            <span className="accountant-create-fee-kicker">Student Fees</span>
            <h3 className="accountant-create-fee-popup-title">Management Created Students</h3>
            <p className="accountant-create-fee-popup-subtitle">
              Fee summary with total amount, paid amount, due amount, and latest date
            </p>
          </div>
          <button
            type="button"
            className="globalpopup-close-btn"
            onClick={() => setIsOutgoingStudentsPopupOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="accountant-outgoing-students-summary">
          <div className="accountant-outgoing-students-pill">
            <span>Students</span>
            <strong>{outgoingStudentFeeRows.length}</strong>
          </div>
          <div className="accountant-outgoing-students-pill">
            <span>Total Paid</span>
            <strong>{formatINR(outgoingStudentFeeRows.reduce((sum, row) => sum + row.paidAmount, 0))}</strong>
          </div>
          <div className="accountant-outgoing-students-pill">
            <span>Total Due</span>
            <strong>{formatINR(outgoingStudentFeeRows.reduce((sum, row) => sum + row.dueAmount, 0))}</strong>
          </div>
        </div>

        <div className="accountant-outgoing-students-table-wrap">
          <table className="accountant-outgoing-students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Section</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Due Amount</th>
                <th>Latest Date</th>
              </tr>
            </thead>
            <tbody>
              {outgoingStudentFeeRows.length ? (
                outgoingStudentFeeRows.map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.className}</td>
                    <td>{student.section}</td>
                    <td>{formatINR(student.totalAmount)}</td>
                    <td>{formatINR(student.paidAmount)}</td>
                    <td>{formatINR(student.dueAmount)}</td>
                    <td>{student.latestDate}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No student fee details are available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

  {isAddFeesPopupOpen && (
    <div
      className="globalpopup-overlay"
      onClick={() => {
        setIsAddFeesPopupOpen(false);
        setAddFeesPanelTab("fees");
        setAddFeePreview({ className: "", section: "", rows: [] });
      }}
      style={{ zIndex: 3200 }}
    >
      <div
        className="globalpopup-content accountant-add-fee-popup"
        onClick={(event) => event.stopPropagation()}
        style={{ width: "72vw", maxWidth: "980px", height: "74vh", overflow: "auto", marginRight: "0" }}
      >
        <div className="globalpopup-header">
          <div className="accountant-create-fee-popup-heading">
            <span className="accountant-create-fee-kicker">Add Fees</span>
          </div>
          <button
            type="button"
            className="globalpopup-close-btn" 

            onClick={() => {
              setIsAddFeesPopupOpen(false);
              setAddFeesPanelTab("fees");
            
           
              setAddFeePreview({ className: "", section: "", rows: [] });
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            padding: "0 24px 12px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="accountant-create-new-btn"
            onClick={() => setAddFeesPanelTab("fees")}
            style={{
              background: addFeesPanelTab === "fees" ? "#fdecef" : "#ffffff",
              color: "#c44755",
              border: "1px solid #f2c9cf",
            }}
          >
            Fees
          </button>
          <button
            type="button"
            className="accountant-create-new-btn"
            onClick={() => setAddFeesPanelTab("discount")}
            style={{
              background: addFeesPanelTab === "discount" ? "#fdecef" : "#ffffff",
              color: "#c44755",
              border: "1px solid #f2c9cf",
            }}
          >
            Discounts
          </button>
        </div>
        {addFeesPanelTab === "discount" ? (
          <div style={{ padding: "0 12px 12px" }}>
            <DiscountsPanel dynamicFeeTypes={dynamicFeeTypes} />
          </div>
        ) : (
          <IncomeForm5
            selectedClassSection={{
         class: addFeeFormClass,
              section: addFeeFormSection,
            }}
            onFeeStructurePreviewChange={setAddFeePreview}
            embeddedInPopup
            on

          />
        )}
      </div>
      </div>
  )}
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
  <ErrorPopup message={premiumPopupMessage} onClose={() => setPremiumPopupMessage("")} />



  </>

);
};

export default AccountantDashboard;
