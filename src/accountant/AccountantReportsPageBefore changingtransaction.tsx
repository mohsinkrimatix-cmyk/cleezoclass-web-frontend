
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AccountantDashboardnew.css";
import "./AccountantReportsPage.css";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import InstituteBrand from "../shared/InstituteBrand.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils.js";
import DaywiseIcon from "../assets/Daywise.png";
import TransactionIcon from "../assets/Transactions2.png";
import FeesReportIcon from "../assets/Fees Report.png";
import DueReportIcon from "../assets/Due Report.png";
import FeeTypeIcon from "../assets/Fee Type.png";
import DiscountsIcon from "../assets/Discounts.png";
import ReferralsIcon from "../assets/Referrals.png";
import FeesSearchIcon from "../assets/Fees Search.png";
import collectFeeIcon from "../assets/collect.png";
import addFeeIcon from "../assets/Navbar-AddFee.png";
import expenseIcon from "../assets/Navbar-Expenses.png";
import reportIcon from "../assets/Reports.png";
import dashboardIcon from "../assets/Dashboard.png";
import addStudentIcon from "../assets/Enrollment.png";
import logoab from "../assets/logoab.png";
import IncomeForm5 from "../shared/IncomeformTwo.jsx";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'
import transactionsIcon from "../assets/Communications.png";
import campaignAutomatedIcon from "../assets/Campaign_Automated.png";
import campaignDigitalIcon from "../assets/Campaign_Digital.png";
import campaignStaffIcon from "../assets/Campaign_Staff.png";
import timelineIcon from "../assets/Timeline.png";
import feesSearchIcon from "../assets/user (1).png";
import HelpCenter from "../shared/HelpCenter.jsx";
import { FiHelpCircle } from "react-icons/fi";
import { FileSpreadsheet, FileText, Printer } from "lucide-react";

type ReportView = "main" | "ledger" | "previous" | "complete" | "bus" | "studentTransactions" | "paid" | "unpaid" | "discounts" | "referrals" | "feeType" | "collectionSummary";
type ReportRow = Record<string, any>;

type Filters = {
  studentName: string;
  className: string;
  section: string;
  year: string;
  fromDate: string;
  toDate: string;
};

const API_BASE_URL = "https://cleezoclass.com:4000";

const getCurrentFinancialYear = () => {
  const now = new Date();
  const startYear = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
};

const getAny = (row: ReportRow, keys: string[], fallback: any = "") => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
};

const toAmount = (value: any) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "object" && typeof value.toString === "function") {
    return toAmount(value.toString());
  }
  const cleaned = String(value).replace(/[^\d.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizePreviousItem = (row: ReportRow) => ({
  ...row,
  StudentName: getAny(row, ["StudentName", "student_name", "studentName"], ""),
  Class_name: getAny(row, ["Class_name", "class_name", "className"], ""),
  section: getAny(row, ["section", "Section"], ""),
  Previous_Fee_Due: toAmount(
    getAny(row, ["Previous_Fee_Due", "Previous_Pending", "previous_due", "previousDue", "previous_fee_due"])
  ),
  Previous_Paid: toAmount(
    getAny(row, ["Previous_Paid", "previous_paid", "previousPaid", "previous_paid_amount"])
  ),
  Due: Math.max(
    toAmount(
      getAny(row, ["Previous_Fee_Due", "Previous_Pending", "previous_due", "previousDue", "previous_fee_due"])
    ) - toAmount(getAny(row, ["Previous_Paid", "previous_paid", "previousPaid", "previous_paid_amount"])),
    0
  ),
  Payment_Date: getAny(row, ["Payment_Date", "paidDate", "record_date", "created_at"], ""),
});

const normalizeCompleteItem = (row: ReportRow) => {
  const feeKeys = Object.keys(row || {}).filter(key => {
    const lowerKey = key.toLowerCase();
    return ![
      'studentname', 'class_name', 'section', 'studentname',
      'classname', 'completefee', 'updatedcompletefee', 'final_amount',
      'total_fee', 'name', 'id', 'login_id', 'paiddate', 'payment_date',
      'record_date', 'receipt_date', 'created_at', 'paymentmode',
      'transaction_id', 'receiptnumber', 'academic_year', 'fee_type',
      'remarks', 'amount_paid', 'due', 'pending', 'unpaidamount'
    ].includes(lowerKey);
  });

  const calculatedCompleteFee = feeKeys.reduce((sum, key) => {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.endsWith('_paid') ||
      lowerKey.endsWith('_due') ||
      lowerKey.endsWith('_class') ||
      [
        'tuitionfee',
        'studentbooksfee',
        'studentexamfee',
        'busfee',
        'previousdue',
        'residentialcompletefee',
        'otherfee',
      ].includes(lowerKey)
    ) {
      return sum;
    }
    return sum + toAmount(row[key]);
  }, 0);
  const backendCompleteFee = toAmount(
    getAny(row, ["CompleteFee", "completeFee", "UpdatedCompleteFee", "Final_Amount", "complete_fee", "TOTAL_FEE"])
  );
  const completeFee = backendCompleteFee > 0 ? backendCompleteFee : calculatedCompleteFee;

  const getFeeValue = (possibleKeys: string[]) => {
    for (const key of possibleKeys) {
      const value = row[key];
      if (value !== undefined && value !== null) {
        return toAmount(value);
      }
    }
    return 0;
  };

  return {
    ...row,
    StudentName: getAny(row, ["StudentName", "student_name", "studentName"], ""),
    Class_name: getAny(row, ["Class_name", "class_name", "className"], ""),
    section: getAny(row, ["section", "Section"], ""),
    CompleteFee: completeFee,
    BusFee: getFeeValue(['BusFee', 'Bus_fees', 'busFee', 'bus_fees']),
    PreviousDue: toAmount(getAny(row, ["PreviousDue", "Previous_Fee_Due", "previousDue", "previous_fee_due"])),
    ResidentialCompleteFee: toAmount(
      getAny(row, ["ResidentialCompleteFee", "residentialCompleteFee", "residential_complete_fee"])
    ),
    OtherFee: getFeeValue(['OtherFee', 'Others', 'otherFee', 'others']),
    ...Object.fromEntries(
      feeKeys.map(key => [key, toAmount(row[key])])
    )
  };
};

const normalizeUnpaidItem = (row: ReportRow) => ({
  ...row,
  StudentName: getAny(row, ["StudentName", "student_name", "studentName"], ""),
  Class_name: getAny(row, ["Class_name", "class_name", "className"], ""),
  section: getAny(row, ["section", "Section"], ""),
  unpaidAmount: toAmount(getAny(row, ["unpaidAmount", "Due", "due", "Pending", "pending"])),
  paidDate: getAny(row, ["paidDate", "paid_date", "Payment_Date", "created_at"], ""),
});

const getFinancialYearFromDate = (rawDate: any) => {
  if (!rawDate) return "";
  const dt = new Date(rawDate);
  if (Number.isNaN(dt.getTime())) return "";
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

const formatMoney = (value: any) =>
  toAmount(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value: any) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

const getDefaultMonthRange = () => {
  const now = new Date();
  const formatDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const targetMonthLastDay = new Date(now.getFullYear(), now.getMonth() - 5, 0).getDate();
  const fromDay = Math.min(now.getDate(), targetMonthLastDay);
  const fromDate = new Date(now.getFullYear(), now.getMonth() - 6, fromDay);
  const firstDay = formatDateInputValue(fromDate);
  const lastDay = formatDateInputValue(now);
  return { firstDay, lastDay };
};

const collectionMonthOptions = [
  { value: "All", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const reportCards = [
  { key: "ledger", title: "Day-wise", subtitle: " Ledger", icon: DaywiseIcon },
  { key: "collectionSummary", title: "Collection Report", subtitle: "Month & Year", icon: transactionsIcon },
  { key: "studentTransactions", title: "Transactions Report", subtitle: "Student Report", icon: TransactionIcon },
  { key: "complete", title: "Fees ", subtitle: "Total Fee & Installments", icon: FeesReportIcon },
  { key: "main", title: "Dues", subtitle: "Current & previous", icon: DueReportIcon },
  { key: "feeType", title: "Fee Type", subtitle: "Tuition,books...etc", icon: FeeTypeIcon },
  { key: "discounts", title: "Discounts", subtitle: "Fees and closings", icon: DiscountsIcon },
  { key: "referrals", title: "Referrals", subtitle: " Reference", icon: ReferralsIcon },
  { key: "FeesSearch", title: "Fees Search", subtitle: "Student transactions", icon: FeesSearchIcon },
] as const;

const STATIC_TRANSACTION_PAID_KEYS = new Set([
  "paid_amount",
  "admission_paid",
  "books_paid",
  "uniform_paid",
  "exam_paid",
  "bus_paid",
  "others_paid",
  "previous_paid",
  "books_uniform_paid",
]);

const STATIC_FEE_BASE_KEYS = new Set([
  "tuition",
  "admission",
  "book",
  "books",
  "uniform",
  "exam",
  "bus",
  "other",
  "others",
  "residential",
  "previous",
  "saving",
  "savings",
]);

const NON_FEE_REPORT_KEYS = new Set([
  "studentname",
  "student_name",
  "class_name",
  "classname",
  "class",
  "section",
  "completefee",
  "updatedcompletefee",
  "final_amount",
  "total_fee",
  "total_expected",
  "tuitionfee",
  "tuitionpaid",
  "studentbooksfee",
  "studentexamfee",
  "busfee",
  "otherfee",
  "previousdue",
  "previous_fee_due",
  "previous_paid",
  "residentialcompletefee",
  "res_inst_1",
  "paid_amount",
  "paiddate",
  "payment_date",
  "record_date",
  "receipt_date",
  "created_at",
  "paymentmode",
  "transaction_id",
  "receiptnumber",
  "academic_year",
  "fee_type",
  "remarks",
  "amount_paid",
  "due",
  "pending",
  "unpaidamount",
]);

const formatHeaderLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDueReportHeaderLabel = (header: string) => {
  if (header === "Class_name") return "Class";
  if (header === "StudentName") return "Student Name";
  if (header === "Total_Expected") return "Total Fee";

  return formatHeaderLabel(header).trim();
};

const escapeHtml = (value: any) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getDynamicTransactionPaidKeys = (rows: ReportRow[]) => {
  const keys = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      const normalizedKey = String(key || "").trim();
      const lowerKey = normalizedKey.toLowerCase();

      if (!lowerKey.endsWith("_paid")) return;
      if (STATIC_TRANSACTION_PAID_KEYS.has(lowerKey)) return;
      if (toAmount(row?.[normalizedKey]) <= 0) return;

      keys.add(normalizedKey);
    });
  });

  return Array.from(keys).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
};

const getDynamicTransactionPaidLabel = (key: string) => {
  const withoutSuffix = key.replace(/_paid$/i, "");
  return formatHeaderLabel(withoutSuffix); // Removed " Paid" suffix
};

const normalizeFeeBaseKey = (key: string) =>
  String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\bfees?\b/g, "")
    .replace(/\s+/g, "")
    .replace(/_fees?$/i, "")
    .replace(/_fee$/i, "")
    .replace(/fees?$/i, "")
    .replace(/_amount$/i, "")
    .replace(/_paid$/i, "")
    .replace(/_due$/i, "");

const getFeeTypeName = (item: any) =>
  String(item?.feeType || item?.fee_type || item?.feeName || item?.fee_name || item || "").trim();

const getCompleteFeeBasesFromFeeTypes = (feeTypes: any[]) => {
  const seen = new Set<string>();
  return (Array.isArray(feeTypes) ? feeTypes : [])
    .map(getFeeTypeName)
    .filter(Boolean)
    .filter((feeName) => {
      const normalized = normalizeFeeBaseKey(feeName);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const getDynamicFeeBases = (rows: ReportRow[]) => {
  const bases = new Set<string>();

  rows.forEach((row) => {
    Object.entries(row || {}).forEach(([key, value]) => {
      const trimmedKey = String(key || "").trim();
      const lowerKey = trimmedKey.toLowerCase();
      if (!trimmedKey) return;
      if (NON_FEE_REPORT_KEYS.has(lowerKey)) return;
      if (toAmount(value) <= 0) return;

      const baseKey = normalizeFeeBaseKey(trimmedKey);
      if (!baseKey) return;
      if (STATIC_FEE_BASE_KEYS.has(baseKey)) return;
      if (NON_FEE_REPORT_KEYS.has(baseKey)) return;

      bases.add(baseKey);
    });
  });

  return Array.from(bases).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
};

const getDynamicFeeValue = (row: ReportRow, baseKey: string) => {
  const targetNormalized = normalizeFeeBaseKey(baseKey);
  for (const [key, value] of Object.entries(row || {})) {
    const normalizedKey = normalizeFeeBaseKey(key);
    if (normalizedKey === targetNormalized) {
      const lowerKey = key.toLowerCase();
      if (!lowerKey.endsWith('_paid') && !lowerKey.endsWith('_due')) {
        return toAmount(value);
      }
    }
  }
  return toAmount(getAny(row, [baseKey, `${baseKey}_fee`, `${baseKey}_fees`, `${baseKey}_amount`], 0));
};

const getDynamicDiscountColumns = (rows: ReportRow[]) => {
  const columns = new Set<string>();

  rows.forEach((row) => {
    Object.entries(row || {}).forEach(([key, value]) => {
      const trimmedKey = String(key || "").trim();
      const lowerKey = trimmedKey.toLowerCase();

      if (!lowerKey.includes("discount")) return;
      if (
        [
          "discount",
          "discount_reason",
          "discountreason",
          "discount_date",
          "discount_referred_by",
          "discount_approved_by",
          "discount_refno",
          "reason",
          "fee_type",
        ].includes(lowerKey)
      ) {
        return;
      }
      if (toAmount(value) <= 0) return;

      columns.add(trimmedKey);
    });
  });

  return Array.from(columns).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
};

const getDiscountReason = (row: ReportRow) =>
  getAny(row, ["discount_reason", "discountReason", "reason", "editReason"], "-");

const getDiscountRecordDate = (row: ReportRow) =>
  getAny(row, ["Discount_Date", "discount_date", "record_date", "created_at", "updated_at"], "");

const getRowDiscountTotal = (row: ReportRow) => {
  const directDiscount = toAmount(
    getAny(row, ["Discount", "discount", "discount_amount", "Discount_Amount", "Concession", "Total_Discount"], 0)
  );
  if (directDiscount > 0) return directDiscount;

  return Object.entries(row || {}).reduce((sum, [key, value]) => {
    const lowerKey = String(key || "").toLowerCase();
    if (!lowerKey.includes("discount")) return sum;
    if (
      [
        "discount_reason",
        "discountreason",
        "discount_date",
        "discount_referred_by",
        "discount_approved_by",
        "discount_refno",
        "editreason",
      ].includes(lowerKey)
    ) {
      return sum;
    }
    return sum + toAmount(value);
  }, 0);
};

const normalizeDiscountItem = (row: ReportRow) => ({
  ...row,
  StudentName: getAny(row, ["StudentName", "student_name", "studentName", "name", "Student_Name"], ""),
  Class_name: getAny(row, ["Class_name", "class_name", "className", "class", "FeeClass"], ""),
  section: getAny(row, ["section", "Section", "sectionName", "FeeSection"], ""),
  fee_type: getAny(row, ["fee_type", "feeType", "feeName", "fee_name"], "-"),
  discount_reason: getDiscountReason(row),
  Discount: getRowDiscountTotal(row),
});

const isReferralDiscountRow = (row: ReportRow) => {
  const reason = String(getDiscountReason(row) || "").trim().toLowerCase();
  if (!reason || reason === "-") return false;
  return ["staff", "parent", "sibling"].some((term) => reason.includes(term));
};

const normalizeFeeTypeRow = (row: ReportRow) => ({
  ...row,
  feeName: getAny(row, ["feeName", "fee_name"], ""),
  feesType: getAny(row, ["feesType", "fees_type", "feeType"], ""),
  scope: getAny(row, ["scope"], "All"),
  frequency: getAny(row, ["frequency"], "One time"),
  installments: getAny(row, ["installments"], 1),
});

const normalizeFeeTypeMatchKey = (value: any) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/fees?$/, "")
    .replace(/fee$/, "");

const getFeeTypeMatchKeys = (value: any) => {
  const baseKey = normalizeFeeTypeMatchKey(value);
  if (!baseKey) return [];

  const aliases = new Set<string>([baseKey]);

  if (baseKey === "guide" || baseKey === "guides") {
    aliases.add("guide");
    aliases.add("guides");
  }

  if (baseKey === "stationary" || baseKey === "stationery") {
    aliases.add("stationary");
    aliases.add("stationery");
  }

  if (baseKey === "belt" || baseKey === "beltfee") {
    aliases.add("belt");
    aliases.add("beltfee");
  }

  if (baseKey === "transport" || baseKey === "transportation" || baseKey === "transportfee") {
    aliases.add("transport");
    aliases.add("transportation");
    aliases.add("transportfee");
  }

  return Array.from(aliases);
};

const buildActiveFeeTypeKeySet = (rows: ReportRow[]) => {
  const keys = new Set<string>();

  rows.forEach((row) => {
    [row?.feeName, row?.fee_name, row?.feesType, row?.fees_type, row?.feeType].forEach((value) => {
      getFeeTypeMatchKeys(value).forEach((key) => {
        if (key) keys.add(key);
      });
    });
  });

  return keys;
};

const getDynamicPaidValue = (row: ReportRow, baseKey: string) => {
  const targetNormalized = normalizeFeeBaseKey(baseKey);
  for (const [key, value] of Object.entries(row || {})) {
    const normalizedKey = normalizeFeeBaseKey(key);
    if (normalizedKey === targetNormalized) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.endsWith('_paid')) {
        return toAmount(value);
      }
    }
  }
  return toAmount(getAny(row, [`${baseKey}_paid`, `${baseKey}_fee_paid`], 0));
};

const hasAnyAmount = (rows: ReportRow[], getter: (row: ReportRow) => any) =>
  rows.some((row) => toAmount(getter(row)) > 0);

const AccountantReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentFinancialYear = getCurrentFinancialYear();
  const currentFyStart = Number(currentFinancialYear.split("-")[0]);
  const { firstDay, lastDay } = getDefaultMonthRange();
  const [instituteName, setInstituteName] = useState("Institute");
  const [instituteLogo, setInstituteLogo] = useState("/default-logo.png");

  const [filters, setFilters] = useState<Filters>({
    studentName: "",
    className: "All",
    section: "All",
    year: currentFinancialYear,
    fromDate: firstDay,
    toDate: lastDay,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState<ReportView>("main");
  const [activeCardKey, setActiveCardKey] = useState<string>("main");
  const [collectionSubTab, setCollectionSubTab] = useState<"month" | "year">("month");
  const [collectionData, setCollectionData] = useState<ReportRow[]>([]);
  const [selectedCollectionMonth, setSelectedCollectionMonth] = useState("All");

  const [classList, setClassList] = useState<any[]>([]);
  const [sectionMap, setSectionMap] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<string[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  const [ledgerData, setLedgerData] = useState<ReportRow[]>([]);
  const [previousData, setPreviousData] = useState<ReportRow[]>([]);
  const [busData, setBusData] = useState<ReportRow[]>([]);
  const [completeFeeData, setCompleteFeeData] = useState<ReportRow[]>([]);
  const [completeFeeTypeBases, setCompleteFeeTypeBases] = useState<string[]>([]);
  const [studentTransactions, setStudentTransactions] = useState<ReportRow[]>([]);
  const [discountsData, setDiscountsData] = useState<ReportRow[]>([]);
  const [referralsData, setReferralsData] = useState<ReportRow[]>([]);
  const [feeTypeData, setFeeTypeData] = useState<ReportRow[]>([]);
  const [mainData, setMainData] = useState<ReportRow[]>([]);
  const [paidListData, setPaidListData] = useState<ReportRow[]>([]);
  const [unpaidListData, setUnpaidListData] = useState<ReportRow[]>([]);
  const [feeTypesLoaded, setFeeTypesLoaded] = useState(false);

  const [mainLoading, setMainLoading] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [extraLoading, setExtraLoading] = useState(false);
  const [studentTransactionsLoading, setStudentTransactionsLoading] = useState(false);
  const [loadingCardKey, setLoadingCardKey] = useState<ReportView | "">("");
  const [summaryDue, setSummaryDue] = useState(0);
  const [summaryDueLoading, setSummaryDueLoading] = useState(false);
  const [summaryPreviousDue, setSummaryPreviousDue] = useState(0);
  const [summaryPreviousPaid, setSummaryPreviousPaid] = useState(0);
  const [isAddFeesPopupOpen, setIsAddFeesPopupOpen] = useState(false);
  const [isStudentManagementPopupOpen, setIsStudentManagementPopupOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [openHelpSection, setOpenHelpSection] = useState(null);
  
  const userRole = localStorage.getItem("userRole");
  const [addFeePreview, setAddFeePreview] = useState({
    className: "",
    section: "",
    rows: [] as ReportRow[],
  });
  const studentManagementPopupUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}${import.meta.env.BASE_URL}StudentManagement`;

  const rowsPerPage = 18;
  const studentTransactionsQueryRef = useRef("");
  const activeFeeTypeKeys = useMemo(() => buildActiveFeeTypeKeySet(feeTypeData), [feeTypeData]);

  useEffect(() => {
    const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
    if (!schoolCode) return;

    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${encodeURIComponent(schoolCode)}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        const resolvedInstituteName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.schoolName || data?.name,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setInstituteLogo(data.logo || "/default-logo.png");
        setInstituteName(resolvedInstituteName);
        localStorage.setItem("schoolName", resolvedInstituteName);
        localStorage.setItem("instituteName", resolvedInstituteName);
      })
      .catch(() => {
        const fallbackInstituteName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setInstituteLogo("/default-logo.png");
        setInstituteName(fallbackInstituteName);
        localStorage.setItem("schoolName", fallbackInstituteName);
        localStorage.setItem("instituteName", fallbackInstituteName);
      });
  }, []);

  useEffect(() => {
    const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
    if (!schoolCode) return;

    let cancelled = false;

    const preloadFeeTypes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/fee-types`, {
          params: { schoolCode, _t: Date.now() },
        });

        if (cancelled) return;

        const rows = Array.isArray(response.data?.data) ? response.data.data : [];
        setFeeTypeData(
          rows
            .map(normalizeFeeTypeRow)
            .filter((row: ReportRow) => String(row.feeName || "").trim() !== "")
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to preload fee types:", error);
        }
      } finally {
        if (!cancelled) {
          setFeeTypesLoaded(true);
        }
      }
    };

    preloadFeeTypes();

    return () => {
      cancelled = true;
    };
  }, []);

  const getFilterDateForRow = useCallback(
    (row: ReportRow) => {
      if (activeView === "collectionSummary") {
        return row?.Collection_Date || row?.paidDate || row?.paid_date || "";
      }
      if (activeView === "studentTransactions" || activeView === "paid" || activeView === "unpaid" || activeView === "discounts" || activeView === "referrals") {
        return row?.Discount_Date || row?.discount_date || row?.record_date || row?.paidDate || row?.paid_date || row?.Payment_Date || row?.created_at || "";
      }
      return row?.record_date || row?.paidDate || row?.Payment_Date || row?.Bus_Payment_Date || row?.paid_date || row?.created_at;
    },
    [activeView]
  );

  const getRowYear = useCallback(
    (row: ReportRow) => {
      if (activeView === "collectionSummary" && row?.Collection_Year) {
        return String(row.Collection_Year);
      }
      return getFinancialYearFromDate(getFilterDateForRow(row));
    },
    [getFilterDateForRow]
  );

  const yearOptions = useMemo(() => {
    const sources = [
      mainData,
      ledgerData,
      previousData,
      busData,
      completeFeeData,
      studentTransactions,
      paidListData,
      unpaidListData,
      discountsData,
      referralsData,
      collectionData,
    ];
    const years = new Set<string>();
    sources.forEach((list) => {
      list.forEach((row) => {
        const year = getRowYear(row);
        if (year) years.add(year);
      });
    });
    years.add(currentFinancialYear);
    years.add(`${currentFyStart - 1}-${currentFyStart}`);
    years.add(`${currentFyStart - 2}-${currentFyStart - 1}`);
    return Array.from(years).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [
    busData,
    completeFeeData,
    currentFinancialYear,
    currentFyStart,
    getRowYear,
    ledgerData,
    mainData,
    paidListData,
    previousData,
    referralsData,
    studentTransactions,
    unpaidListData,
    discountsData,
    collectionData,
  ]);

  const isPreviousFinancialYearSelected = useMemo(() => {
    const selectedYear = String(filters.year || "").trim();
    if (!selectedYear || selectedYear === "All") return false;
    if (!/^\d{4}\s*-\s*\d{4}$/.test(selectedYear)) return false;
    const [, end] = selectedYear.split("-").map((part) => Number(part.trim()));
    return end < currentFyStart + 1;
  }, [currentFyStart, filters.year]);

  const fetchMetadata = useCallback(async () => {
    setDropdownLoading(true);
    const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";
    try {
      const [classRes, sectionRes] = await Promise.all([
        axios.get(`https://cleezoclass.com:4000/api/admin/classes?schoolCode=${schoolCode}`),
        axios.get(`https://cleezoclass.com:4000/api/admin/sectionFilter?schoolCode=${schoolCode}`),
      ]);

      const classesArray = Array.isArray(classRes.data) ? classRes.data : [];
      const sectionsArray = Array.isArray(sectionRes.data) ? sectionRes.data : [];
      const allSections = [...new Set(sectionsArray.map((item: any) => String(item?.section || item || "").trim()).filter(Boolean))];

      setClassList(classesArray);
      setSectionMap(sectionsArray);
      setFilteredSections(allSections.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })));
    } catch (error) {
      console.error("Failed to load report filters:", error);
      setClassList([]);
      setSectionMap([]);
      setFilteredSections([]);
    } finally {
      setDropdownLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    if (!filters.className || filters.className === "All") {
      const allSections = [...new Set(sectionMap.map((item: any) => String(item?.section || item || "").trim()).filter(Boolean))];
      setFilteredSections(allSections.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })));
      return;
    }

    const nextSections = sectionMap
      .filter((item: any) => String(item?.class_name) === String(filters.className))
      .map((item: any) => String(item?.section || "").trim())
      .filter(Boolean);

    setFilteredSections([...new Set(nextSections)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })));
    setFilters((prev) => (prev.section === "All" ? prev : { ...prev, section: "All" }));
  }, [filters.className, sectionMap]);

  const fetchSummaryDue = useCallback(async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    setSummaryDueLoading(true);
    try {
      const selectedYear = String(filters.year || "").replace(/\s+/g, "");
      if (selectedYear === "2024-2025") {
        const params = new URLSearchParams({ schoolCode, type: "PreviousPaidPendingReport" });
        const response = await axios.get(`https://cleezoclass.com:4000/api/fee-records-alldata?${params.toString()}`);
        const rows = (Array.isArray(response.data) ? response.data : response.data?.data || []).map(normalizePreviousItem);
        const filteredRows = rows.filter((row: ReportRow) => {
          if (filters.className !== "All" && String(row.Class_name) !== String(filters.className)) return false;
          if (filters.section !== "All" && String(row.section) !== String(filters.section)) return false;
          return true;
        });

        setSummaryDue(filteredRows.reduce((sum: number, row: ReportRow) => sum + toAmount(row.Previous_Fee_Due), 0));
        setSummaryPreviousDue(filteredRows.reduce((sum: number, row: ReportRow) => sum + toAmount(row.Previous_Fee_Due), 0));
        setSummaryPreviousPaid(filteredRows.reduce((sum: number, row: ReportRow) => sum + toAmount(row.Previous_Paid), 0));
        return;
      }

      const params = new URLSearchParams({
        schoolCode,
        year: filters.year || "All",
        className: filters.className || "All",
        section: filters.section || "All",
      });
      const response = await axios.get(`https://cleezoclass.com:4000/api/fees-summary-ledgerData?${params.toString()}`);
      setSummaryDue(Number(response?.data?.balance) || 0);
      setSummaryPreviousDue(Number(response?.data?.previousDueTotal) || 0);
      setSummaryPreviousPaid(Number(response?.data?.previousPaidTotal) || 0);
    } catch (error) {
      console.error("Failed to fetch summary due:", error);
      setSummaryDue(0);
      setSummaryPreviousDue(0);
      setSummaryPreviousPaid(0);
    } finally {
      setSummaryDueLoading(false);
    }
  }, [filters.className, filters.section, filters.year]);

  useEffect(() => {
    fetchSummaryDue();
  }, [fetchSummaryDue]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const getStudentTransactionsQueryKey = useCallback(
    (nextFilters: Filters) =>
      JSON.stringify({
        studentName: nextFilters.studentName || "",
        className: nextFilters.className || "All",
        section: nextFilters.section || "All",
      }),
    []
  );

  const handleCollectionSummaryReport = useCallback(async (type: "month" | "year") => {
    setLoadingCardKey("collectionSummary");
    setExtraLoading(true);
    setCurrentPage(1);
    setCollectionSubTab(type);
    setFilters((prev) => ({ ...prev, year: "All" }));
    if (type === "year") setSelectedCollectionMonth("All");
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");

      const endpointType = type === "month" ? "MonthWiseCollectionReport" : "YearWiseCollectionReport";
      const params = new URLSearchParams({ schoolCode, type: endpointType });
      const response = await axios.get(`${API_BASE_URL}/api/fee-records-alldata?${params.toString()}`);
      const rows = Array.isArray(response.data) ? response.data : response.data?.data || [];

      setCollectionData(rows);
      setActiveView("collectionSummary");
      setActiveCardKey("collectionSummary");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch collection report");
    } finally {
      setExtraLoading(false);
      setLoadingCardKey("");
    }
  }, []);

  const handleTodayLedger = async () => {
    setLoadingCardKey("ledger");
    setLedgerLoading(true);
    setCurrentPage(1);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");

      const params = new URLSearchParams({ schoolCode, type: "today" });
      const response = await axios.get(`https://cleezoclass.com:4000/api/ledger?${params.toString()}`);
      const rawLedger = Array.isArray(response.data.data) ? response.data.data : [];
      const hasActiveFeeTypes = feeTypesLoaded && activeFeeTypeKeys.size > 0;

      const isDeletedFeeType = (value: any) => {
        if (!hasActiveFeeTypes) return false;
        const feeTypeKeys = getFeeTypeMatchKeys(value);
        if (!feeTypeKeys.length) return false;
        return !feeTypeKeys.some((key) => activeFeeTypeKeys.has(key));
      };

      const getVisibleFeeTypes = (value: any) => {
        const feeTypes = String(value || "")
          .split(",")
          .map((item) => String(item || "").trim())
          .filter(Boolean);

        if (!hasActiveFeeTypes) return feeTypes;
        return feeTypes.filter((feeType) => !isDeletedFeeType(feeType));
      };

      const getReceiptNumber = (value: any) => {
        const digits = String(value || "").match(/\d+/g);
        return digits ? Number(digits.join("")) || 0 : 0;
      };

      const sortedLedger = [...rawLedger].sort((a, b) => {
        const byReceipt = getReceiptNumber(a.receiptNumber) - getReceiptNumber(b.receiptNumber);
        if (byReceipt !== 0) return byReceipt;
        return new Date(a.paid_date || a.paidDate || a.created_at || 0).getTime() - new Date(b.paid_date || b.paidDate || b.created_at || 0).getTime();
      });

      const mergedMap = new Map<string, ReportRow>();
      sortedLedger.forEach((row) => {
        const visibleFeeTypes = getVisibleFeeTypes(row.fee_type);
        if (hasActiveFeeTypes && !visibleFeeTypes.length) return;

        const key = `${row.receiptNumber || ""}__${row.StudentName || ""}__${row.Class_name || ""}__${row.section || ""}__${row.paid_date || row.paidDate || row.created_at || ""}`;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            ...row,
            amount_paid: Number(row.amount_paid || 0),
            fee_type: visibleFeeTypes,
          });
          return;
        }
        const existing = mergedMap.get(key)!;
        existing.amount_paid = Number(existing.amount_paid || 0) + Number(row.amount_paid || 0);
        if (visibleFeeTypes.length) {
          const feeTypes = new Set(Array.isArray(existing.fee_type) ? existing.fee_type : []);
          visibleFeeTypes.forEach((feeType) => feeTypes.add(feeType));
          existing.fee_type = Array.from(feeTypes);
        }
      });

      setLedgerData(
        Array.from(mergedMap.values()).map((row) => ({
          ...row,
          fee_type: Array.isArray(row.fee_type) ? row.fee_type.join(", ") : row.fee_type,
        }))
      );
      setActiveView("ledger");
      setActiveCardKey("ledger");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch today's ledger");
    } finally {
      setLedgerLoading(false);
      setLoadingCardKey("");
    }
  };

  const handleMainDueReport = useCallback(async () => {
    setLoadingCardKey("main");
    setMainLoading(true);
    setCurrentPage(1);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");
      const fromDate = filters.fromDate || firstDay;
      const toDate = filters.toDate || lastDay;

      const params = new URLSearchParams({
        type: "TotalDueList",
        fromDate,
        toDate,
        schoolCode,
      });

      const response = await axios.get(`${API_BASE_URL}/api/fee-records?${params.toString()}`);
      const result = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setMainData(result);
      setActiveView("main");
      setActiveCardKey("main");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch unpaid due report");
    } finally {
      setMainLoading(false);
      setLoadingCardKey("");
    }
  }, [filters.fromDate, filters.toDate, firstDay, lastDay]);

  useEffect(() => {
    const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
    if (!schoolCode) return;
    if (mainData.length) return;
    handleMainDueReport();
  }, [handleMainDueReport, mainData.length]);

  const handlePreviousReport = async () => {
    setLoadingCardKey("previous");
    setExtraLoading(true);
    setCurrentPage(1);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");
      const params = new URLSearchParams({ schoolCode, type: "PreviousPaidPendingReport" });
      const response = await axios.get(`https://cleezoclass.com:4000/api/fee-records-alldata?${params.toString()}`);
      const rows = (Array.isArray(response.data) ? response.data : response.data.data || []).map(normalizePreviousItem);

      const groupedMap = new Map<string, ReportRow>();
      rows.forEach((row: ReportRow) => {
        const key = `${row.StudentName || ""}__${row.Class_name || ""}__${row.section || ""}`;
        const existing = groupedMap.get(key) || {
          StudentName: row.StudentName || "",
          Class_name: row.Class_name || "",
          section: row.section || "",
          Previous_Fee_Due: 0,
          Previous_Paid: 0,
          Payment_Date: "",
        };

        existing.Previous_Fee_Due += toAmount(row.Previous_Fee_Due);
        existing.Previous_Paid += toAmount(row.Previous_Paid);

        const currentDate = row.Payment_Date ? new Date(row.Payment_Date).getTime() : 0;
        const existingDate = existing.Payment_Date ? new Date(existing.Payment_Date).getTime() : 0;
        if (currentDate > existingDate) existing.Payment_Date = row.Payment_Date || existing.Payment_Date;

        groupedMap.set(key, existing);
      });

      setPreviousData(
        Array.from(groupedMap.values())
          .map((row) => ({ ...row, Due: Math.max(toAmount(row.Previous_Fee_Due) - toAmount(row.Previous_Paid), 0) }))
          .filter((row) => row.Due > 0)
      );
      setActiveView("previous");
      setActiveCardKey("previous");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch previous report");
    } finally {
      setExtraLoading(false);
      setLoadingCardKey("");
    }
  };

  const handleCompleteFeeReport = async () => {
    setLoadingCardKey("complete");
    setExtraLoading(true);
    setCurrentPage(1);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");
      const params = new URLSearchParams({ schoolCode, type: "CompleteFeeSummaryReport" });
      const response = await axios.get(`https://cleezoclass.com:4000/api/fee-records-alldata?${params.toString()}`);
      const rows = (Array.isArray(response.data) ? response.data : response.data.data || []).map(normalizeCompleteItem);
      setCompleteFeeTypeBases(getCompleteFeeBasesFromFeeTypes(response.data?.feeTypes || []));
      setCompleteFeeData(rows);
      setActiveView("complete");
      setActiveCardKey("complete");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch complete fee report");
    } finally {
      setExtraLoading(false);
      setLoadingCardKey("");
    }
  };

  const handleBusReport = async () => {
    setLoadingCardKey("bus");
    setExtraLoading(true);
    setCurrentPage(1);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");
      const params = new URLSearchParams({ schoolCode, type: "BusFeePaymentReport" });
      const response = await axios.get(`https://cleezoclass.com:4000/api/fee-records-alldata?${params.toString()}`);
      const result = Array.isArray(response.data) ? response.data : response.data.data || [];

      const groupedMap = new Map<string, ReportRow>();
      result.forEach((row: ReportRow) => {
        const key = `${row?.StudentName || ""}__${row?.Class_name || ""}__${row?.section || ""}`;
        const existing = groupedMap.get(key) || {
          StudentName: row?.StudentName || "",
          Class_name: row?.Class_name || "",
          section: row?.section || "",
          Bus_Fee: 0,
          Bus_Paid: 0,
          Bus_Pending: 0,
          Residential_Amount: 0,
          Residential_Paid: 0,
          Residential_Due: 0,
          Bus_Payment_Date: "",
        };

        existing.Bus_Fee = Math.max(existing.Bus_Fee, toAmount(row?.Bus_Fee));
        existing.Residential_Amount = Math.max(existing.Residential_Amount, toAmount(row?.Residential_Amount));
        existing.Bus_Paid += toAmount(row?.Bus_Paid);
        existing.Residential_Paid += toAmount(row?.Residential_Paid);

        const currentDate = row?.Bus_Payment_Date ? new Date(row.Bus_Payment_Date).getTime() : 0;
        const existingDate = existing.Bus_Payment_Date ? new Date(existing.Bus_Payment_Date).getTime() : 0;
        if (currentDate > existingDate) existing.Bus_Payment_Date = row.Bus_Payment_Date;

        groupedMap.set(key, existing);
      });

      setBusData(
        Array.from(groupedMap.values()).map((row) => ({
          ...row,
          Bus_Pending: Math.max(toAmount(row.Bus_Fee) - toAmount(row.Bus_Paid), 0),
          Residential_Due: Math.max(toAmount(row.Residential_Amount) - toAmount(row.Residential_Paid), 0),
        }))
      );
      setActiveView("bus");
      setActiveCardKey("bus");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch bus report");
    } finally {
      setExtraLoading(false);
      setLoadingCardKey("");
    }
  };

  const handleStudentTransactions = useCallback(async (sourceCardKey: string = "studentTransactions") => {
    setLoadingCardKey("studentTransactions");
    setStudentTransactionsLoading(true);
    setCurrentPage(1);
    setActiveCardKey(sourceCardKey);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");

      const className = filters.className === "All" ? "" : filters.className || "";
      const section = filters.section === "All" ? "" : filters.section || "";
      const studentName = filters.studentName || "";

      const queryParams = {
        schoolCode,
        studentName,
        className,
        section,
      };

      const parseRows = (payload: any): ReportRow[] => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.rows)) return payload.rows;
        return [];
      };

      let result: ReportRow[] = [];
      try {
        const response = await axios.get(`${API_BASE_URL}/api/student-transactions-dynamic`, {
          params: queryParams,
        });
        result = parseRows(response.data);
      } catch (dynamicError) {
        console.warn("Dynamic student-transactions endpoint failed, trying legacy fallback:", dynamicError);
        const fallbackResponse = await axios.get(`${API_BASE_URL}/api/student-transactions`, {
          params: queryParams,
        });
        result = parseRows(fallbackResponse.data);
      }

      const filteredResult = result.filter((row) => {
        for (const key in row) {
          if (key.toLowerCase().includes("paid") && toAmount(row[key]) > 0) {
            return true;
          }
        }
        return false;
      });

      setStudentTransactions(filteredResult);
      setActiveView("studentTransactions");
      setActiveCardKey(sourceCardKey);
      studentTransactionsQueryRef.current = getStudentTransactionsQueryKey(filters);
    } catch (error) {
      console.error(error);
      studentTransactionsQueryRef.current = "";
      alert("Failed to fetch student transactions");
    } finally {
      setStudentTransactionsLoading(false);
      setLoadingCardKey("");
    }
  }, [filters, getStudentTransactionsQueryKey]);

  const handleDiscountsReport = useCallback(async () => {
    setLoadingCardKey("discounts");
    setExtraLoading(true);
    setCurrentPage(1);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");

      const params = new URLSearchParams({
        schoolCode,
        className: filters.className || "All",
        section: filters.section || "All",
        fromDate: "",
        toDate: "",
      });

      const response = await axios.get(`https://cleezoclass.com:4000/api/discounts-report?${params.toString()}`);
      const result = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const normalizedResult = result.map(normalizeDiscountItem);

      setDiscountsData(normalizedResult);
      setActiveView("discounts");
      setActiveCardKey("discounts");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch discounts report");
    } finally {
      setExtraLoading(false);
      setLoadingCardKey("");
    }
  }, [filters.className, filters.section]);

  useEffect(() => {
    const view = new URLSearchParams(location.search).get("view");
    if (view === "discounts") {
      handleDiscountsReport();
    }
  }, [handleDiscountsReport, location.search]);

  const handleReferralsReport = useCallback(async () => {
    setLoadingCardKey("referrals");
    setExtraLoading(true);
    setCurrentPage(1);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");

      const params = new URLSearchParams({
        schoolCode,
        className: filters.className || "All",
        section: filters.section || "All",
        fromDate: "",
        toDate: "",
      });

      const response = await axios.get(`https://cleezoclass.com:4000/api/discounts-report?${params.toString()}`);
      const result = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const normalizedResult = result.map(normalizeDiscountItem);
      const referralRows = normalizedResult.filter(isReferralDiscountRow);

      setReferralsData(referralRows);
      setActiveView("referrals");
      setActiveCardKey("referrals");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch referrals report");
    } finally {
      setExtraLoading(false);
      setLoadingCardKey("");
    }
  }, [filters.className, filters.section]);

  const handleFeeTypeReport = useCallback(async () => {
    setLoadingCardKey("feeType");
    setExtraLoading(true);
    setCurrentPage(1);
    try {
      const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
      if (!schoolCode) throw new Error("School code missing");

      const response = await axios.get(`${API_BASE_URL}/api/fee-types`, {
        params: { schoolCode, _t: Date.now() },
      });

      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      setFeeTypeData(
        rows
          .map(normalizeFeeTypeRow)
          .filter((row: ReportRow) => String(row.feeName || "").trim() !== "")
      );
      setActiveView("feeType");
      setActiveCardKey("feeType");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch fee types");
    } finally {
      setExtraLoading(false);
      setLoadingCardKey("");
    }
  }, []);

  const handlePaidListReport = useCallback(async () => {
    setLoadingCardKey("paid");
    setMainLoading(true);
    setCurrentPage(1);
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) throw new Error("School code missing");
      const fromDate = filters.fromDate || firstDay;
      const toDate = filters.toDate || lastDay;

      const params = new URLSearchParams({
        type: "TotalPaidList",
        fromDate,
        toDate,
        schoolCode,
      });

      const response = await axios.get(`${API_BASE_URL}/api/fee-records?${params.toString()}`);
      const result = Array.isArray(response.data) ? response.data : response.data?.data || [];
      setPaidListData(result);
      setActiveView("paid");
      setActiveCardKey("paid");
    } catch (error) {
      console.error(error);
      alert("Failed to fetch paid list");
    } finally {
      setMainLoading(false);
      setLoadingCardKey("");
    }
  }, [filters.fromDate, filters.toDate, firstDay, lastDay]);

  useEffect(() => {
    if (activeView !== "studentTransactions") return;
    const nextKey = getStudentTransactionsQueryKey(filters);
    if (studentTransactionsQueryRef.current === nextKey) return;

    const timeoutId = window.setTimeout(() => {
      handleStudentTransactions(activeCardKey === "FeesSearch" ? "FeesSearch" : "studentTransactions");
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [activeCardKey, activeView, filters, getStudentTransactionsQueryKey, handleStudentTransactions]);

  const applyFilters = useCallback(
    (rows: ReportRow[]) =>
      rows.filter((row) => {
        if (activeView === "collectionSummary") {
          if (filters.year !== "All") {
            const rowYear = String(row?.Collection_Year || "");
            const [startYear, endYear] = String(filters.year || "").split("-").map((part) => part.trim());
            if (rowYear && rowYear !== startYear && rowYear !== endYear) return false;
          }
          if (collectionSubTab === "month" && selectedCollectionMonth !== "All") {
            const rowMonthNumber = String(row?.Month_Number || "").trim();
            const rowMonthName = String(row?.Collection_Month || "").trim().toLowerCase();
            const selectedLabel = collectionMonthOptions
              .find((month) => month.value === selectedCollectionMonth)
              ?.label.toLowerCase();
            if (rowMonthNumber) return rowMonthNumber === selectedCollectionMonth;
            if (selectedLabel && rowMonthName) return rowMonthName === selectedLabel;
            return false;
          }
          return true;
        }

        const studentName = String(getAny(row, ["StudentName", "student_name", "studentName", "name", "Student_Name"], "")).toLowerCase();
        const className = String(getAny(row, ["Class_name", "class_name", "className", "class", "FeeClass"], ""));
        const sectionName = String(getAny(row, ["section", "Section", "sectionName", "FeeSection"], ""));
        if (!studentName) return false;
        if (filters.studentName && !studentName.includes(filters.studentName.toLowerCase())) return false;
        if (filters.className !== "All" && className !== String(filters.className)) return false;
        if (filters.section !== "All" && sectionName !== String(filters.section)) return false;

        if (filters.year !== "All") {
          const rowYear = getRowYear(row);
          if (rowYear && rowYear !== filters.year) return false;
        }

        const rowDate = getFilterDateForRow(row);
        const parsedRowDate = rowDate ? new Date(rowDate) : null;
        const fromDate = filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null;
        const toDate = filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`) : null;

        if (parsedRowDate && !Number.isNaN(parsedRowDate.getTime())) {
          if (fromDate && parsedRowDate < fromDate) return false;
          if (toDate && parsedRowDate > toDate) return false;
        }
        return true;
      }),
    [activeView, collectionSubTab, filters, getFilterDateForRow, getRowYear, selectedCollectionMonth]
  );

  const activeRows = useMemo(() => {
    switch (activeView) {
      case "main":
        return applyFilters(mainData);
      case "ledger":
        return applyFilters(ledgerData);
      case "previous":
        return applyFilters(previousData);
      case "complete":
        return applyFilters(completeFeeData);
      case "bus":
        return applyFilters(busData);
      case "studentTransactions":
        return applyFilters(studentTransactions);
      case "paid":
        return applyFilters(paidListData);
      case "unpaid":
        return applyFilters(unpaidListData);
      case "discounts":
        return applyFilters(discountsData);
      case "referrals":
        return applyFilters(referralsData);
      case "feeType":
        return feeTypeData;
      case "collectionSummary":
        return applyFilters(collectionData);
      default:
        return [];
    }
  }, [activeView, applyFilters, busData, collectionData, completeFeeData, discountsData, feeTypeData, ledgerData, mainData, paidListData, previousData, referralsData, studentTransactions, unpaidListData]);

  const totalPaidToday = useMemo(() => {
    if (activeView !== "ledger") return 0;
    return activeRows.reduce((sum, row) => sum + toAmount(row.amount_paid), 0);
  }, [activeView, activeRows]);

  const totalTransactionsValue = useMemo(() => {
    if (activeView !== "studentTransactions") return 0;
    return activeRows.reduce((sum, row) => {
      let rowTotal = 0;
      Object.keys(row || {}).forEach((key) => {
        if (key.toLowerCase().includes("paid")) {
          rowTotal += toAmount(row[key]);
        }
      });
      return sum + rowTotal;
    }, 0);
  }, [activeView, activeRows]);

  const totalPages = Math.max(1, Math.ceil(activeRows.length / rowsPerPage));
  const paginatedRows = activeRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  
  const dynamicTransactionPaidKeys = useMemo(
    () => (activeView === "studentTransactions" ? getDynamicTransactionPaidKeys(activeRows) : []),
    [activeRows, activeView]
  );
  
  const dynamicCompleteFeeBases = useMemo(
    () => (activeView === "complete" ? (completeFeeTypeBases.length ? completeFeeTypeBases : getDynamicFeeBases(activeRows)) : []),
    [activeRows, activeView, completeFeeTypeBases]
  );
  
  const dynamicDiscountColumns = useMemo(
    () => (activeView === "discounts" || activeView === "referrals" ? getDynamicDiscountColumns(activeRows) : []),
    [activeRows, activeView]
  );

  const visibleCompleteStaticColumns = useMemo(() => {
    if (activeView !== "complete") return [];
    return [
      { key: "CompleteFee", label: "Complete Fee", getValue: (row: ReportRow) => toAmount(row.CompleteFee) },
    ].filter((column) => hasAnyAmount(activeRows, column.getValue));
  }, [activeRows, activeView]);

  const visibleTransactionStaticColumns = useMemo(() => {
    if (activeView !== "studentTransactions") return [];

    const columns = [
      { key: "Admission_paid", label: "Admission Paid", getValue: (row: ReportRow) => toAmount(row.Admission_paid) },
      { key: "books_paid", label: "Books Paid", getValue: (row: ReportRow) => toAmount(row.books_paid) },
      { key: "uniform_paid", label: "Uniform Paid", getValue: (row: ReportRow) => toAmount(row.uniform_paid) },
      { key: "exam_paid", label: "Exam Paid", getValue: (row: ReportRow) => toAmount(row.exam_paid) },
      { key: "bus_paid", label: "Bus Paid", getValue: (row: ReportRow) => toAmount(row.bus_paid) },
      { key: "others_paid", label: "Others Paid", getValue: (row: ReportRow) => toAmount(row.others_paid) },
      { key: "RES_INST_1", label: "Residential Paid", getValue: (row: ReportRow) => toAmount(row.RES_INST_1) },
      { key: "Previous_Paid", label: "Previous Paid", getValue: (row: ReportRow) => toAmount(row.Previous_Paid) },
      {
        key: "TuitionFee",
        label: "Tuition Fee",
        getValue: (row: ReportRow) => toAmount(normalizeCompleteItem(row).TuitionFee),
      },
      {
        key: "StudentBooksFee",
        label: "Books Fee",
        getValue: (row: ReportRow) => toAmount(normalizeCompleteItem(row).StudentBooksFee),
      },
      {
        key: "ResidentialCompleteFee",
        label: "Residential Fee",
        getValue: (row: ReportRow) => toAmount(normalizeCompleteItem(row).ResidentialCompleteFee),
      },
      { key: "BusFee", label: "Bus Fee", getValue: (row: ReportRow) => toAmount(normalizeCompleteItem(row).BusFee) },
      { key: "Previous_Fee_Due", label: "Previous Due", getValue: (row: ReportRow) => toAmount(row.Previous_Fee_Due) },
    ];

    return columns.filter((column) => hasAnyAmount(activeRows, column.getValue));
  }, [activeRows, activeView]);

  const renderedSummaryValue = isPreviousFinancialYearSelected ? summaryPreviousDue : summaryDue;
  const currentReportCard = activeCardKey === "FeesSearch" ? "FeesSearch" : activeCardKey === "unpaid" ? "main" : activeCardKey;

  const activeReportTitle = useMemo(() => {
    switch (activeView) {
      case "ledger":
        return "Day-wise-ledger";
      case "previous":
        return "Previous Due";
      case "complete":
        return "Complete Fee";
      case "bus":
        return "Bus Residential";
      case "studentTransactions":
        return "Transactions ";
      case "paid":
        return "Paid";
      case "discounts":
        return "Discounts";
      case "referrals":
        return "Referrals";
      case "feeType":
        return "Fee Type";
      case "collectionSummary":
        return collectionSubTab === "month" ? "Month-wise Collection" : "Year-wise Collection";
      case "unpaid":
      case "main":
      default:
        return "Unpaid";
    }
  }, [activeView, collectionSubTab]);

  const getTableColumns = useCallback(
    (view: ReportView, rows: ReportRow[]) => {
      if (!rows.length) return [] as { key: string; label: string; getValue: (row: ReportRow) => any }[];

      if (view === "ledger") {
        return [
          { key: "StudentName", label: "Student Name", getValue: (row: ReportRow) => row.StudentName },
          { key: "Class_name", label: "Class", getValue: (row: ReportRow) => row.Class_name },
          { key: "section", label: "Section", getValue: (row: ReportRow) => row.section },
          { key: "receiptNumber", label: "Receipt No", getValue: (row: ReportRow) => row.receiptNumber || "-" },
          { key: "paid_date", label: "Receipt Date", getValue: (row: ReportRow) => formatDate(row.paid_date || row.paidDate || row.created_at) },
          { key: "academic_year", label: "Academic Year", getValue: (row: ReportRow) => row.academic_year || currentFinancialYear },
          { key: "fee_type", label: "Fee Type", getValue: (row: ReportRow) => row.fee_type || "-" },
          { key: "paymentMode", label: "Payment Mode", getValue: (row: ReportRow) => row.paymentMode || "-" },
          { key: "transaction_id", label: "Txn ID", getValue: (row: ReportRow) => row.transaction_id || "-" },
          { key: "amount_paid", label: "Amount", getValue: (row: ReportRow) => formatMoney(row.amount_paid) },
        ];
      }

      if (view === "collectionSummary") {
        if (collectionSubTab === "month") {
          return [
            { key: "Collection_Month", label: "Month", getValue: (row: ReportRow) => row.Collection_Month || "-" },
            { key: "Collection_Year", label: "Year", getValue: (row: ReportRow) => row.Collection_Year || "-" },
            { key: "Total_Collection", label: "Total Collection", getValue: (row: ReportRow) => formatMoney(row.Total_Collection) },
          ];
        }

        return [
          { key: "Collection_Year", label: "Year", getValue: (row: ReportRow) => row.Collection_Year || "-" },
          { key: "Total_Collection", label: "Total Collection", getValue: (row: ReportRow) => formatMoney(row.Total_Collection) },
        ];
      }

      if (view === "previous") {
        return [
          { key: "StudentName", label: "Student", getValue: (row: ReportRow) => row.StudentName },
          { key: "Class_name", label: "Class", getValue: (row: ReportRow) => row.Class_name },
          { key: "section", label: "Section", getValue: (row: ReportRow) => row.section },
          { key: "Previous_Fee_Due", label: "Previous Fee Due", getValue: (row: ReportRow) => formatMoney(row.Previous_Fee_Due) },
          { key: "Previous_Paid", label: "Previous Paid", getValue: (row: ReportRow) => formatMoney(row.Previous_Paid) },
          { key: "Payment_Date", label: "Payment Date", getValue: (row: ReportRow) => formatDate(row.Payment_Date) },
        ];
      }

      if (view === "complete") {
        const cols = [
          { key: "Class_name", label: "Class", getValue: (row: ReportRow) => row.Class_name },
          { key: "section", label: "Section", getValue: (row: ReportRow) => row.section },
          { key: "StudentName", label: "Student", getValue: (row: ReportRow) => row.StudentName },
          ...visibleCompleteStaticColumns.map((column) => ({
            key: column.key,
            label: column.label,
            getValue: (row: ReportRow) => formatMoney(column.getValue(row)),
          })),
        ];

        dynamicCompleteFeeBases.forEach((baseKey) => {
          cols.push(
            { key: `${baseKey}_fee`, label: formatHeaderLabel(baseKey), getValue: (row: ReportRow) => formatMoney(getDynamicFeeValue(row, baseKey)) },
            { key: `${baseKey}_paid`, label: `${formatHeaderLabel(baseKey)} Paid`, getValue: (row: ReportRow) => formatMoney(getDynamicPaidValue(row, baseKey)) }
          );
        });

        return cols;
      }

      if (view === "bus") {
        return [
          { key: "StudentName", label: "Student", getValue: (row: ReportRow) => row.StudentName },
          { key: "Class_name", label: "Class", getValue: (row: ReportRow) => row.Class_name },
          { key: "section", label: "Section", getValue: (row: ReportRow) => row.section },
          { key: "Bus_Fee", label: "Bus Fee", getValue: (row: ReportRow) => formatMoney(row.Bus_Fee) },
          { key: "Bus_Paid", label: "Bus Paid", getValue: (row: ReportRow) => formatMoney(row.Bus_Paid) },
          { key: "Bus_Pending", label: "Bus Pending", getValue: (row: ReportRow) => formatMoney(row.Bus_Pending) },
          { key: "Residential_Amount", label: "Residential Fee", getValue: (row: ReportRow) => formatMoney(row.Residential_Amount) },
          { key: "Residential_Paid", label: "Residential Paid", getValue: (row: ReportRow) => formatMoney(row.Residential_Paid) },
          { key: "Residential_Due", label: "Residential Due", getValue: (row: ReportRow) => formatMoney(row.Residential_Due) },
          { key: "Bus_Payment_Date", label: "Payment Date", getValue: (row: ReportRow) => formatDate(row.Bus_Payment_Date) },
        ];
      }

      if (view === "studentTransactions") {
        const cols = [
          { key: "StudentName", label: "Student", getValue: (row: ReportRow) => row.StudentName },
          { key: "Class_name", label: "Class", getValue: (row: ReportRow) => row.Class_name },
          { key: "section", label: "Section", getValue: (row: ReportRow) => row.section },
          ...visibleTransactionStaticColumns.map((column) => ({
            key: column.key,
            label: column.label,
            getValue: (row: ReportRow) => formatMoney(column.getValue(row)),
          })),
        ];

        dynamicTransactionPaidKeys.forEach((key) => {
          cols.push({ key, label: getDynamicTransactionPaidLabel(key), getValue: (row: ReportRow) => formatMoney(row[key]) });
        });

        cols.push(
          { key: "paidDate", label: "Paid Date", getValue: (row: ReportRow) => formatDate(row.paidDate) },
          { key: "paymentMode", label: "Payment Mode", getValue: (row: ReportRow) => row.paymentMode || "-" },
          { key: "transaction_id", label: "Txn ID", getValue: (row: ReportRow) => row.transaction_id || "-" },
          { key: "receiptNumber", label: "Receipt No", getValue: (row: ReportRow) => row.receiptNumber || "-" }
        );

        return cols;
      }

      if (view === "discounts") {
        const cols = [
          { key: "StudentName", label: "Student", getValue: (row: ReportRow) => row.StudentName || row.student_name || row.studentName || "-" },
          { key: "Class_name", label: "Class", getValue: (row: ReportRow) => row.Class_name || row.class_name || row.className || "-" },
          { key: "section", label: "Section", getValue: (row: ReportRow) => row.section || row.Section || "-" },
          { key: "fee_type", label: "Fee Type", getValue: (row: ReportRow) => row.fee_type || "-" },
          { key: "discount_reason", label: "Reason", getValue: (row: ReportRow) => getDiscountReason(row) },
          { key: "Discount", label: "Total Discount", getValue: (row: ReportRow) => formatMoney(getRowDiscountTotal(row)) },
        ];

        dynamicDiscountColumns.forEach((key) => {
          if (key === "Discount") return;
          cols.push({
            key,
            label: formatHeaderLabel(key),
            getValue: (row: ReportRow) => formatMoney(row[key] || 0),
          });
        });

        cols.push(
          { key: "record_date", label: "Record Date", getValue: (row: ReportRow) => formatDate(getDiscountRecordDate(row)) },
          { key: "created_at", label: "Created At", getValue: (row: ReportRow) => formatDate(row.created_at) },
          { key: "updated_at", label: "Updated At", getValue: (row: ReportRow) => formatDate(row.updated_at) }
        );

        return cols;
      }

      if (view === "referrals") {
        const cols = [
          { key: "StudentName", label: "Student", getValue: (row: ReportRow) => row.StudentName || row.student_name || row.studentName || "-" },
          { key: "Class_name", label: "Class", getValue: (row: ReportRow) => row.Class_name || row.class_name || row.className || "-" },
          { key: "section", label: "Section", getValue: (row: ReportRow) => row.section || row.Section || "-" },
          { key: "fee_type", label: "Fee Type", getValue: (row: ReportRow) => row.fee_type || "-" },
          { key: "discount_reason", label: "Reason", getValue: (row: ReportRow) => getDiscountReason(row) },
          { key: "Discount", label: "Total Discount", getValue: (row: ReportRow) => formatMoney(getRowDiscountTotal(row)) },
        ];

        dynamicDiscountColumns.forEach((key) => {
          if (key === "Discount") return;
          cols.push({
            key,
            label: formatHeaderLabel(key),
            getValue: (row: ReportRow) => formatMoney(row[key]),
          });
        });

        cols.push(
          { key: "record_date", label: "Record Date", getValue: (row: ReportRow) => formatDate(getDiscountRecordDate(row)) },
          { key: "created_at", label: "Created At", getValue: (row: ReportRow) => formatDate(row.created_at) },
          { key: "updated_at", label: "Updated At", getValue: (row: ReportRow) => formatDate(row.updated_at) }
        );

        return cols;
      }

      if (view === "feeType") {
        return [
          { key: "feeName", label: "Fee Name", getValue: (row: ReportRow) => row.feeName || row.fee_name || "-" },
          { key: "feesType", label: "Fees Type", getValue: (row: ReportRow) => row.feesType || row.fees_type || "-" },
          { key: "scope", label: "Scope", getValue: (row: ReportRow) => row.scope || "-" },
          { key: "frequency", label: "Frequency", getValue: (row: ReportRow) => row.frequency || "-" },
          { key: "installments", label: "Installments", getValue: (row: ReportRow) => row.installments || "-" },
        ];
      }

      if (view === "paid" || view === "main" || view === "unpaid") {
        const headers = rows.length ? Object.keys(rows[0]) : [];
        return headers.map((header) => ({
          key: header,
          label: view === "main" ? formatDueReportHeaderLabel(header) : header === "Class_name" ? "Class" : header === "StudentName" ? "Student Name" : header === "Total_Expected" ? "Total Fee" : formatHeaderLabel(header),
          getValue: (row: ReportRow) => (typeof row[header] === "object" && row[header] !== null ? "-" : row[header]),
        }));
      }

      return [];
    },
    [
      currentFinancialYear,
      dynamicCompleteFeeBases,
      dynamicDiscountColumns,
      dynamicTransactionPaidKeys,
      collectionSubTab,
      formatMoney,
      getDynamicPaidValue,
      getDynamicTransactionPaidLabel,
      getDynamicFeeValue,
      visibleCompleteStaticColumns,
      visibleTransactionStaticColumns,
    ]
  );

  const handleDownloadPDF = useCallback(() => {
    const columns = getTableColumns(activeView, activeRows);
    if (!columns.length) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const tableHeaders = columns.map((col) => col.label);
    const tableData = activeRows.map((row) =>
      columns.map((col) => {
        const val = col.getValue(row);
        return val !== null && val !== undefined ? String(val) : "-";
      })
    );

    doc.setFontSize(16);
    doc.text(`${activeReportTitle} Report`, 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Rows: ${activeRows.length} | Generated on: ${new Date().toLocaleString()}`,
      14,
      22
    );

    autoTable(doc, {
      startY: 26,
      head: [tableHeaders],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [15, 76, 129], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { top: 25, left: 14, right: 14, bottom: 15 },
    });

    const todayDateStr = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    const filename = `accountant-${activeReportTitle.toLowerCase().replace(/\s+/g, "-")}-report-${todayDateStr}.pdf`;
    doc.save(filename);
  }, [activeReportTitle, activeRows, activeView, getTableColumns]);

  const handleDownloadReport = useCallback(() => {
    const columns = getTableColumns(activeView, activeRows);
    if (!columns.length) return;

    const todayDateStr = new Date().toLocaleDateString("en-GB");

    const worksheet = XLSX.utils.aoa_to_sheet([
      [activeReportTitle, ...Array(Math.max(columns.length - 1, 0)).fill("")],
      [`Date: ${todayDateStr}`, ...Array(Math.max(columns.length - 1, 0)).fill("")],
      [],
      columns.map((column) => column.label),
      ...activeRows.map((row) => columns.map((column) => column.getValue(row))),
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(
      workbook,
      `accountant-${activeReportTitle.toLowerCase().replace(/\s+/g, "-")}-report-${todayDateStr.replace(/\//g, "-")}.xlsx`
    );
  }, [activeReportTitle, activeRows, activeView, getTableColumns]);

  const handlePrintReport = useCallback(() => {
    const columns = getTableColumns(activeView, activeRows);
    if (!columns.length) return;

    const tableRows = activeRows
      .map(
        (row) => `
          <tr>
            ${columns
              .map((column) => `<td>${escapeHtml(column.getValue(row))}</td>`)
              .join("")}
          </tr>`
      )
      .join("");

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const currentFormattedDateTime = new Date().toLocaleString();

    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeHtml(activeReportTitle)} Report</title>
          <style>
            @page { size: landscape; margin: 8mm; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
            h1 { font-size: 20px; margin: 0 0 14px; }
            .print-meta { font-size: 16px; margin: 0 0 10px; color: #000; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cfd6dd; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
            th { background: #0f4c81; color: #fff; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(activeReportTitle)} Report</h1>
          <div class="print-meta">Records: ${activeRows.length} | Printed on: <b>${escapeHtml(currentFormattedDateTime)}</b></div>
          <table>
            <thead>
              <tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [activeReportTitle, activeRows, activeView, getTableColumns]);

  const renderTable = () => {
    if (activeView === "collectionSummary") {
      return (
        <>
          <div className="accountant-reports-toolbar-actions" style={{ marginBottom: "12px", display: "flex", gap: "10px" }}>
            <button
              type="button"
              className={collectionSubTab === "month" ? "accountant-topbar-tab-active" : ""}
              onClick={() => handleCollectionSummaryReport("month")}
              disabled={extraLoading}
            >
              Month-wise Collection
            </button>
            <button
              type="button"
              className={collectionSubTab === "year" ? "accountant-topbar-tab-active" : ""}
              onClick={() => handleCollectionSummaryReport("year")}
              disabled={extraLoading}
            >
              Year-wise Collection
            </button>
            {collectionSubTab === "month" && (
              <select
                className="accountant-collection-month-select"
                value={selectedCollectionMonth}
                onChange={(event) => {
                  setSelectedCollectionMonth(event.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Select collection month"
              >
                {collectionMonthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          <table className="accountant-reports-table">
            <thead>
              <tr>
                {collectionSubTab === "month" && <th>Month</th>}
                <th>Year</th>
                <th>Total Collection</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={`${row.Collection_Year || "collection"}-${row.Month_Number || index}`}>
                  {collectionSubTab === "month" && <td>{row.Collection_Month || "-"}</td>}
                  <td>{row.Collection_Year || "-"}</td>
                  <td>{formatMoney(row.Total_Collection)}</td>
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={collectionSubTab === "month" ? 3 : 2}>No collection data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      );
    }

    if (activeView === "main" && !activeRows.length) {
      return (
        <div className="accountant-reports-empty-state">
          <p>{mainLoading ? "Loading report..." : "Select a report button to load data."}</p>
        </div>
      );
    }

    if (activeView === "main") {
      const headers = activeRows.length ? Object.keys(activeRows[0]) : [];
      const headerLabels = headers.map(formatDueReportHeaderLabel);

      return (
        <table className="accountant-reports-table">
          <thead>
            <tr>
              {headerLabels.map((label, index) => (
                <th key={`${label}-${index}`}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, rowIndex) => (
              <tr key={`${row.StudentName || "row"}-${rowIndex}`}>
                {headers.map((header) => (
                  <td key={header}>{typeof row[header] === "object" && row[header] !== null ? "-" : row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeView === "paid") {
      const headers = activeRows.length ? Object.keys(activeRows[0]) : [];
      const headerLabels = headers.map((header) => {
        if (header === "Class_name") return "Class";
        if (header === "StudentName") return "Student Name";
        if (header === "Total_Expected") return "Total Fee";
        return header.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
      });

      return (
        <table className="accountant-reports-table">
          <thead>
            <tr>
              {headerLabels.map((label, index) => (
                <th key={`${label}-${index}`}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, rowIndex) => (
              <tr key={`${row.StudentName || "row"}-${rowIndex}`}>
                {headers.map((header) => (
                  <td key={header}>{typeof row[header] === "object" && row[header] !== null ? "-" : row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeView === "ledger") {
      return (
        <table className="accountant-reports-table">
          <thead>
            <tr>
              <th>S.NO.</th>
              <th>Student Name</th>
              <th>Class</th>
              <th>Section</th>
              <th>Receipt No.</th>
              <th>Receipt Date</th>
              <th>Academic Year</th>
              <th>Fee Type</th>
              <th>Payment Mode</th>
              <th>Txn ID</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr key={`${row.receiptNumber}-${index}`}>
                <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                <td>{row.StudentName}</td>
                <td>{row.Class_name}</td>
                <td>{row.section}</td>
                <td>{row.receiptNumber || "-"}</td>
                <td>{formatDate(row.paid_date || row.paidDate || row.created_at)}</td>
                <td>{row.academic_year || currentFinancialYear}</td>
                <td>{row.fee_type || "-"}</td>
                <td>{row.paymentMode || "-"}</td>
                <td>{row.transaction_id || "-"}</td>
                <td>{formatMoney(row.amount_paid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeView === "previous") {
      return (
        <table className="accountant-reports-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Class</th>
              <th>Section</th>
              <th>Previous Fee Due</th>
              <th>Previous Paid</th>
              <th>Payment Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr key={`${row.StudentName}-${index}`}>
                <td>{row.StudentName}</td>
                <td>{row.Class_name}</td>
                <td>{row.section}</td>
                <td>{formatMoney(row.Previous_Fee_Due)}</td>
                <td>{formatMoney(row.Previous_Paid)}</td>
                <td>{formatDate(row.Payment_Date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeView === "complete") {
      return (
        <table className="accountant-reports-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Section</th>
              <th>Student Name</th>
              {visibleCompleteStaticColumns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              {dynamicCompleteFeeBases.map((baseKey) => (
                <React.Fragment key={baseKey}>
                  <th>{formatHeaderLabel(baseKey)}</th>
                  <th>{formatHeaderLabel(baseKey)} Paid</th>
                </React.Fragment>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr key={`${row.StudentName}-${index}`}>
                <td>{row.Class_name}</td>
                <td>{row.section}</td>
                <td>{row.StudentName}</td>
                {visibleCompleteStaticColumns.map((column) => (
                  <td key={column.key}>{formatMoney(column.getValue(row))}</td>
                ))}
                {dynamicCompleteFeeBases.map((baseKey) => (
                  <React.Fragment key={baseKey}>
                    <td>{formatMoney(getDynamicFeeValue(row, baseKey))}</td>
                    <td>{formatMoney(getDynamicPaidValue(row, baseKey))}</td>
                  </React.Fragment>
                ))}
                <td>-</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeView === "bus") {
      return (
        <table className="accountant-reports-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Class</th>
              <th>Section</th>
              <th>Bus Fee</th>
              <th>Bus Paid</th>
              <th>Bus Pending</th>
              <th>Residential Fee</th>
              <th>Residential Paid</th>
              <th>Residential Due</th>
              <th>Payment Date</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr key={`${row.StudentName}-${index}`}>
                <td>{row.StudentName}</td>
                <td>{row.Class_name}</td>
                <td>{row.section}</td>
                <td>{formatMoney(row.Bus_Fee)}</td>
                <td>{formatMoney(row.Bus_Paid)}</td>
                <td>{formatMoney(row.Bus_Pending)}</td>
                <td>{formatMoney(row.Residential_Amount)}</td>
                <td>{formatMoney(row.Residential_Paid)}</td>
                <td>{formatMoney(row.Residential_Due)}</td>
                <td>{formatDate(row.Bus_Payment_Date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeView === "unpaid") {
      return (
        <table className="accountant-reports-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Unpaid</th>
              <th>Class</th>
              <th>Section</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr key={`${row.StudentName}-${index}`}>
                <td>{row.StudentName}</td>
                <td>{formatMoney(row.unpaidAmount)}</td>
                <td>{row.Class_name}</td>
                <td>{row.section}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeView === "discounts" || activeView === "referrals") {
      return (
        <table className="accountant-reports-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Class</th>
              <th>Section</th>
              <th>Fee Type</th>
              <th>Reason</th>
              <th>Total Discount</th>
              {dynamicDiscountColumns
                .filter((column) => column !== "Discount")
                .map((column) => (
                  <th key={column}>{formatHeaderLabel(column)}</th>
                ))}
              <th>Record Date</th>
              <th>Created At</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
                <tr key={`${row.id || row.StudentName || "discount"}-${index}`}>
                  <td>{row.StudentName || row.student_name || row.studentName || "-"}</td>
                  <td>{row.Class_name || row.class_name || row.className || "-"}</td>
                  <td>{row.section || row.Section || "-"}</td>
                  <td>{row.fee_type || "-"}</td>
                  <td>{getDiscountReason(row)}</td>
                  <td>{formatMoney(getRowDiscountTotal(row))}</td>
                  {dynamicDiscountColumns
                    .filter((column) => column !== "Discount")
                    .map((column) => (
                      <td key={column}>{formatMoney(row[column] || 0)}</td>
                    ))}
                  <td>{formatDate(getDiscountRecordDate(row))}</td>
                  <td>{formatDate(row.created_at)}</td>
                  <td>{formatDate(row.updated_at)}</td>
                </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeView === "feeType") {
      return (
        <table className="accountant-reports-table">
          <thead>
            <tr>
              <th>Fee Name</th>
              <th>Fees Type</th>
              <th>Scope</th>
              <th>Frequency</th>
              <th>Installments</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, index) => (
              <tr key={`${row.id || row.feeName || "fee-type"}-${index}`}>
                <td>{row.feeName || row.fee_name || "-"}</td>
                <td>{row.feesType || row.fees_type || "-"}</td>
                <td>{row.scope || "-"}</td>
                <td>{row.frequency || "-"}</td>
                <td>{row.installments || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table className="accountant-reports-table">
        <thead>
          <tr>
            <th>S.NO.</th>
            <th>Student Name</th>
            <th>Class</th>
            <th>Section</th>
            {visibleTransactionStaticColumns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
            {dynamicTransactionPaidKeys.map((key) => (
              <th key={key}>{getDynamicTransactionPaidLabel(key)}</th>
            ))}
            <th>Paid Date</th>
            <th>Payment Mode</th>
            <th>Txn ID</th>
            <th>Receipt No.</th>
            <th>Receipt Date</th>
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row, index) => {
            return (
              <tr key={`${row.StudentName}-${index}`}>
                <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                <td>{row.StudentName}</td>
                <td>{row.Class_name}</td>
                <td>{row.section}</td>
                {visibleTransactionStaticColumns.map((column) => (
                  <td key={column.key}>{formatMoney(column.getValue(row))}</td>
                ))}
                {dynamicTransactionPaidKeys.map((key) => (
                  <td key={key}>{formatMoney(row[key])}</td>
                ))}
                <td>{formatDate(row.paidDate)}</td>
                <td>{row.paymentMode || "-"}</td>
                <td>{row.transaction_id || "-"}</td>
                <td>{row.receiptNumber || "-"}</td>
                <td>{formatDate(row.paidDate || "-")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };
const cumulativeActiveAmount = useMemo(() => {
  if (!activeRows.length) return 0;

  return activeRows.reduce((sum, row) => {
    switch (activeView) {
      case "ledger":
        return sum + toAmount(row.amount_paid);

      case "collectionSummary":
        return sum + toAmount(row.Total_Collection);

      case "previous":
        return sum + toAmount(row.Previous_Paid);

      case "complete":
        return sum + toAmount(row.CompleteFee);

      case "bus":
        return sum + (toAmount(row.Bus_Paid) + toAmount(row.Residential_Paid));

      case "studentTransactions":
        return (
          sum +
          Object.entries(row).reduce((rowSum, [key, value]) => {
            return key.toLowerCase().includes("paid")
              ? rowSum + toAmount(value)
              : rowSum;
          }, 0)
        );

      case "discounts":
      case "referrals":
        return sum + getRowDiscountTotal(row);

      case "paid":
        return (
          sum +
          toAmount(
            getAny(row, ["paid_amount", "amount_paid", "Total_Paid", "paid"], 0)
          )
        );

      default:
        return sum;
    }
  }, 0);
}, [activeRows, activeView]);
  return (
    <div className="accountant-dashboard-page accountant-reports-page">
      <div className="accountant-dashboard-shell">
        <div className="accountant-sidebar-strip">
          <Link to="/AccountantDashboard" className="accountant-sidebar-item">
            <div className="accountant-sidebar-item-icon">
              <img src={dashboardIcon} alt="Home" />
            </div>
            <span>Dashboard</span>
          </Link>

          <Link to="/AccountantFees" className="accountant-sidebar-item">
            <div className="accountant-sidebar-item-icon">
              <img src={collectFeeIcon} alt="Collect Fee" />
            </div>
            <span>Fees</span>
          </Link>

          <div className="accountant-sidebar-item" role="button" tabIndex={0} onClick={() => setIsAddFeesPopupOpen(true)}>
            <div className="accountant-sidebar-item-icon">
              <img src={addFeeIcon} alt="" />
            </div>
            <span>Add Fees</span>
          </div>

          <div
            className={`accountant-sidebar-item ${isStudentManagementPopupOpen ? "accountant-sidebar-item-active" : ""}`.trim()}
            role="button"
            tabIndex={0}
            onClick={() => setIsStudentManagementPopupOpen(true)}
          >
            <div className="accountant-sidebar-item-icon">
              <img src={addStudentIcon} alt="" />
            </div>
            <span>Add Student</span>
          </div>

          <div className="accountant-sidebar-item" role="button" tabIndex={0} onClick={() => navigate("/AccountantExpenses")}>
            <div className="accountant-sidebar-item-icon">
              <img src={expenseIcon} alt="" />
            </div>
            <span>Expense</span>
          </div>

          <Link to="/AccountantReportsPage" className="accountant-sidebar-item accountant-sidebar-item-active">
            <div className="accountant-sidebar-item-icon">
              <img src={reportIcon} alt="Report" />
            </div>
            <span>Reports</span>
          </Link>
        </div>

        <div className="accountant-main-area">
          <div className="accountant-topbar">
            <nav className="accountant-topbar-left">
              <Link to="/AccountantDashboard" className="accountant-topbar-tab">
                Dashboard
              </Link>
              <Link to="/AccountantFees" className="accountant-topbar-tab">
                Fees
              </Link>
              <button
                type="button"
                className="accountant-topbar-tab accountant-topbar-tab-button"
                onClick={() => navigate("/AccountantExpenses")}
              >
                Expense
              </button>
              <Link to="/AccountantReportsPage" className="accountant-topbar-tab accountant-topbar-tab-active">
                Reports
              </Link>
            </nav>

            <div className="accountant-topbar-center">
              <InstituteBrand
                logoSrc={instituteLogo || logoab}
                logoAlt={instituteName || "Institute"}
                instituteName={instituteName}
              />
            </div>

            <div className="accountant-topbar-right">
              <button
                className="accountant-help-icon-btn"
                onClick={() => setIsHelpOpen(true)}
              >
                <FiHelpCircle
                  style={{
                    color: "#e9818c",
                    fontSize: "34px",
                  }}
                />
              </button>
              <EditableProfileMenu />
            </div>
          </div>

          <div className="accountant-reports-content">
            <div className="accountant-reports-label-grid">
              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <img src={feesSearchIcon} alt="" aria-hidden="true" />
                <input
                  type="text"
                  name="studentName"
                  value={filters.studentName}
                  onChange={handleFilterChange}
                  placeholder="Student Name"
                />
              </label>

              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <img src={campaignStaffIcon} alt="" aria-hidden="true" />
                <select name="className" value={filters.className} onChange={handleFilterChange} disabled={dropdownLoading}>
                  <option value="All">All Classes</option>
                  {classList.map((item: any) => {
                    const value = String(item?.class_name || item?.className || item || "");
                    return (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    );
                  })}
                </select>
              </label>

              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <img src={campaignDigitalIcon} alt="" aria-hidden="true" />
                <select name="section" value={filters.section} onChange={handleFilterChange} disabled={dropdownLoading}>
                  <option value="All">All Sections</option>
                  {filteredSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </label>

              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <img src={timelineIcon} alt="" aria-hidden="true" />
                <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} />
              </label>

              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <img src={timelineIcon} alt="" aria-hidden="true" />
                <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} />
              </label>

              <label className="accountant-reports-label-chip accountant-reports-field-chip">
                <img src={campaignAutomatedIcon} alt="" aria-hidden="true" />
                <select name="year" value={filters.year} onChange={handleFilterChange}>
                  <option value="All">All Years</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="accountant-reports-card-row">
              {reportCards.map((card) => {
                const isActive = currentReportCard === card.key;
                let onClick = handleTodayLedger;
                let disabled = false;
                let subtitle = card.subtitle;

                if (card.key === "previous") {
                  onClick = handlePreviousReport;
                  disabled = extraLoading;
                  subtitle = loadingCardKey === "previous" ? "Loading..." : card.subtitle;
                } else if (card.key === "complete") {
                  onClick = handleCompleteFeeReport;
                  disabled = extraLoading;
                  subtitle = loadingCardKey === "complete" ? "Loading..." : card.subtitle;
                } else if (card.key === "bus") {
                  onClick = handleBusReport;
                  disabled = extraLoading;
                  subtitle = loadingCardKey === "bus" ? "Loading..." : card.subtitle;
                } else if (card.key === "paid") {
                  onClick = handlePaidListReport;
                  disabled = mainLoading;
                  subtitle = loadingCardKey === "paid" ? "Loading..." : card.subtitle;
                } else if (card.key === "main") {
                  onClick = handleMainDueReport;
                  disabled = mainLoading;
                  subtitle = loadingCardKey === "main" || loadingCardKey === "unpaid" ? "Loading..." : card.subtitle;
                } else if (card.key === "studentTransactions") {
                  onClick = () => handleStudentTransactions("studentTransactions");
                  disabled = studentTransactionsLoading;
                  subtitle = loadingCardKey === "studentTransactions" ? "Loading..." : card.subtitle;
                } else if (card.key === "FeesSearch") {
                  onClick = () => handleStudentTransactions("FeesSearch");
                  disabled = studentTransactionsLoading;
                  subtitle = loadingCardKey === "studentTransactions" ? "Loading..." : card.subtitle;
                } else if (card.key === "discounts") {
                  onClick = handleDiscountsReport;
                  disabled = extraLoading;
                  subtitle = loadingCardKey === "discounts" ? "Loading..." : card.subtitle;
                } else if (card.key === "referrals") {
                  onClick = handleReferralsReport;
                  disabled = extraLoading;
                  subtitle = loadingCardKey === "referrals" ? "Loading..." : card.subtitle;
                } else if (card.key === "feeType") {
                  onClick = handleFeeTypeReport;
                  disabled = extraLoading;
                  subtitle = loadingCardKey === "feeType" ? "Loading..." : card.subtitle;
                } else if (card.key === "collectionSummary") {
                  onClick = () => handleCollectionSummaryReport("month");
                  disabled = extraLoading;
                  subtitle = loadingCardKey === "collectionSummary" ? "Loading..." : card.subtitle;
                } else if (card.key === "ledger") {
                  disabled = ledgerLoading;
                  subtitle = loadingCardKey === "ledger" ? "Loading..." : card.subtitle;
                }

                return (
                  <button
                    type="button"
                    key={card.key}
                    className={`accountant-reports-card ${isActive ? "accountant-reports-card-active" : ""}`}
                    onClick={onClick}
                    disabled={disabled}
                  >
                    <img src={card.icon} alt={card.subtitle} />
                    <div className="accountant-reports-card-title">{card.title}</div>
                  </button>
                );
              })}
            </div>

            <div className="accountant-reports-table-card">
              <div className="accountant-reports-toolbar">
                <input
                  type="text"
                  name="studentName"
                  value={filters.studentName}
                  onChange={handleFilterChange}
                  placeholder="Search student name"
                />
              <div className="accountant-reports-toolbar-meta">
  {activeView === "main" ? (
    // DUES TAB: Show balance/due summary
    <>
      <span>
        {isPreviousFinancialYearSelected ? "Previous Due" : "Complete Due"} (
        {filters.year === "All" ? "All Years" : filters.year}): ₹{" "}
        {summaryDueLoading ? "0.00" : formatMoney(renderedSummaryValue)}
      </span>
      {isPreviousFinancialYearSelected && (
        <span>
          Previous Paid: ₹{" "}
          {summaryDueLoading ? "0.00" : formatMoney(summaryPreviousPaid)}
        </span>
      )}
    </>
  ) : (
    // ALL OTHER TABS: Show total cumulative amount
    <span>
       Total Amount: ₹ {formatMoney(cumulativeActiveAmount)}
    </span>
  )}
  <span>{activeRows.length} records</span>
</div>
                <div className="accountant-reports-toolbar-actions">
                  <button 
                    type="button" 
                    onClick={handleDownloadReport} 
                    disabled={!activeRows.length}
                    title="Download Excel"
                    aria-label="Download Excel"
                  >
                    <FileSpreadsheet size={18} />
                  </button>

                  <button 
                    type="button" 
                    onClick={handleDownloadPDF} 
                    disabled={!activeRows.length}
                    title="Download PDF"
                    aria-label="Download PDF"
                  >
                    <FileText size={18} />
                  </button>

                  <button 
                    type="button" 
                    onClick={handlePrintReport} 
                    disabled={!activeRows.length}
                    title="Print"
                    aria-label="Print"
                  >
                    <Printer size={18} />
                  </button>         
                </div>
                {activeRows.length > 0 && (
                  <div className="accountant-reports-pagination accountant-reports-pagination-inline">
                    <button type="button" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                      &lt;
                    </button>
                    <span>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </div>

              <div className="accountant-reports-table-wrap">{renderTable()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="accountant-footer-brand">
        <span>Powered By:</span>
        <img src={logoab} alt="Cleezo Class" className="accountant-footer-logo" />
      </div>

      {isAddFeesPopupOpen && (
        <div
          className="globalpopup-overlay"
          onClick={() => {
            setIsAddFeesPopupOpen(false);
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
                  setAddFeePreview({ className: "", section: "", rows: [] });
                }}
              >
                ×
              </button>
            </div>
            <IncomeForm5
              selectedClassSection={{ class: "", section: "" }}
              onFeeStructurePreviewChange={setAddFeePreview}
              embeddedInPopup
            />
          </div>
        </div>
      )}
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
      {isHelpOpen && (
        <HelpCenter
          userRole={userRole}
          openHelpSection={openHelpSection}
          setOpenHelpSection={setOpenHelpSection}
          setIsHelpOpen={setIsHelpOpen}
        />
      )}
    </div>
  );
};

export default AccountantReportsPage;