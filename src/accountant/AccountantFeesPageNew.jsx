import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "./AccountantDashboardnew.css";
// import "./AccountantFeesPageNew.css";
import IncomeForm5 from "../shared/IncomeformTwo.jsx";
import DiscountsPanel from "./Accounatant_FeesManagement_Discounts.jsx";
import PayementDemo from "./AccountantFeesManagementPayement.jsx";
import GenerateBills from "./Accountant_FeesManagement_Bills.jsx";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import InstituteBrand from "../shared/InstituteBrand.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
import GlobalLoader from "../shared/GlobelLoading.tsx";
import collectFeeIcon from "../assets/collect.png";
import addFeeIcon from "../assets/Navbar-AddFee.png";
import expenseIcon from "../assets/Navbar-Expenses.png";
import reportIcon from "../assets/Reports.png";
import dashboardIcon from "../assets/Dashboard.png";
import addStudentIcon from "../assets/Enrollment.png";
import createFeeIcon from "../assets/create-fee.png";
import addFeesIcon from "../assets/add-fee.png";
import assistantIcon from "../assets/Assistant.png";
import logoab from "../assets/logoab.png";
import userAvatar from "../assets/user.png";
import { FiHelpCircle } from "react-icons/fi";
import HelpCenter from "../shared/HelpCenter.jsx";

const quickCards = [
  { icon: createFeeIcon, title: "Create Fee type", text: "Create custom fee categories" },
  { icon: addFeesIcon, title: "Add Fees", text: "Fees & Discounts list" },
  { icon: assistantIcon, title: "Assistant", text: "Daily Activity check" },
];

const assistantActionItems = [
  {
    title: "Top Unpaid Student Follow-up",
    detail: "Reduce overdue fee risk by contacting highest due students first.",
    procedure: [
      "Open unpaid students list and sort by due amount.",
      "Call guardian and confirm pending amount and date.",
      "Share payment link or branch counter details.",
    ],
  },
  {
    title: "Discount Verification and Approval",
    detail: "Ensure discounts are valid, approved, and correctly posted.",
    procedure: [
      "Verify discount amount per student.",
      "Check approval source and reason.",
      "Cross-check ledger after discount application.",
    ],
  },
  {
    title: "Fee Posting Audit",
    detail: "Prevent mismatches between collections and ledger entries.",
    procedure: [
      "Match receipts with system entries.",
      "Verify installment and fee split values.",
      "Correct posting errors before close.",
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

const getDiscountReasonText = (row) =>
  row?.discount_reason ||
  row?.discountReason ||
  row?.Reason ||
  row?.reason ||
  row?.editReason ||
  row?.remarks ||
  "-";

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

const getStudentCompositeKey = (row) =>
  [
    String(row?.StudentName || row?.studentName || row?.name || row?.Student_Name || "").trim().toLowerCase(),
    String(row?.Class_name || row?.class_name || row?.className || row?.FeeClass || "").trim().toLowerCase(),
    String(row?.Section || row?.section || row?.sectionName || row?.FeeSection || "").trim().toLowerCase(),
  ].join("|");

const isAishaDebugStudent = (studentLike) => {
  const normalizedName = String(
    studentLike?.StudentName || studentLike?.studentName || studentLike?.name || studentLike?.Student_Name || ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  const normalizedClass = String(
    studentLike?.Class_name || studentLike?.class_name || studentLike?.className || studentLike?.FeeClass || ""
  )
    .trim()
    .toLowerCase();

  const normalizedSection = String(
    studentLike?.Section || studentLike?.section || studentLike?.sectionName || studentLike?.FeeSection || ""
  )
    .trim()
    .toLowerCase();

  return (
    ["aisha begum", "ashiya begum", "aisha begunm", "ashiya begunm"].includes(normalizedName) &&
    normalizedClass === "7" &&
    normalizedSection === "a"
  );
};

const normalizeClassLabel = (value) => String(value || "").replace(/^Class\s+/i, "").trim().toLowerCase();
const normalizeSectionLabel = (value) => String(value || "").trim().toLowerCase();
const normalizeFeeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeFeeColumnBase = (value) =>
  normalizeFeeKey(String(value || "").replace(/\bfees?\b/gi, ""));

const AccountantFeesPageNew = () => {
  const navigate = useNavigate();
  const [instituteName, setInstituteName] = useState("Institute");
  const [instituteLogo, setInstituteLogo] = useState("/default-logo.png");
  const [userInfo, setUserInfo] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [summary, setSummary] = useState({
    gross: 0,
    concession: 0,
    netPayable: 0,
    totalPaid: 0,
    totalDue: 0,
    progress: 0,
  });
  const [previousYearDue, setPreviousYearDue] = useState(0);
  const [unpaidStudents, setUnpaidStudents] = useState([]);
  const [allFeeStatusRows, setAllFeeStatusRows] = useState([]);
  const [studentDirectory, setStudentDirectory] = useState([]);
  const [classSectionStudents, setClassSectionStudents] = useState([]);
  const [paymentSummaryMap, setPaymentSummaryMap] = useState({});
  const [dynamicFeeTypes, setDynamicFeeTypes] = useState([]);
  const [selectedClassFeeStructure, setSelectedClassFeeStructure] = useState(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState(null);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
  const [selectedStudentCardId, setSelectedStudentCardId] = useState(null);
  const [popupSelection, setPopupSelection] = useState({
    className: "",
    sectionName: "",
    studentId: null,
    studentName: "",
  });
  const [isCreateFeeTypePopupOpen, setIsCreateFeeTypePopupOpen] = useState(false);
  const [isAddFeesPopupOpen, setIsAddFeesPopupOpen] = useState(false);
  const [addFeesPanelTab, setAddFeesPanelTab] = useState("fees");
  const [isStudentManagementPopupOpen, setIsStudentManagementPopupOpen] = useState(false);
  const [isAssistantPopupOpen, setIsAssistantPopupOpen] = useState(false);
  const [isBillsPopupOpen, setIsBillsPopupOpen] = useState(false);
  const [isDiscountsPopupOpen, setIsDiscountsPopupOpen] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState(null);
  const [discountsData, setDiscountsData] = useState([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);
    const [popupKey, setPopupKey] = useState(0);
      const [isHelpOpen, setIsHelpOpen] = useState(false);
const [openHelpSection, setOpenHelpSection] = useState(null);

const userRole = localStorage.getItem("userRole");
  const [discountsError, setDiscountsError] = useState("");
  const [addFeePreview, setAddFeePreview] = useState({
    className: "",
    section: "",
    rows: [],
  });
  const [createFeeTypeLoading, setCreateFeeTypeLoading] = useState(false);
  const [createFeeTypeError, setCreateFeeTypeError] = useState("");
  const [newFeeTypeForm, setNewFeeTypeForm] = useState({
    feesType: "",
    scope: "",
    frequency: "",
    installments: "",
  });
  const studentManagementPopupUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}${import.meta.env.BASE_URL}StudentManagement`;

  const previousYearLabel = "2024-2025";

  useEffect(() => {
    const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
    if (!schoolCode) return;

    fetch(`https://cleezoclass.com:5000/api/institute?dbName=${encodeURIComponent(schoolCode)}`)
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
    const username = String(localStorage.getItem("username") || "").trim();

    if (!schoolCode || !username) return;

    let cancelled = false;

    fetch(
      `https://cleezoclass.com:5000/api/api/user-info/${encodeURIComponent(username)}?schoolCode=${encodeURIComponent(schoolCode)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setUserInfo(data || null);
      })
      .catch(() => {
        if (cancelled) return;
        setUserInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      for (const key of keys) {
        const value = row?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          return toNumber(value);
        }
      }
      return 0;
    },
    [toNumber]
  );

const getFeeTotalsForRow = useCallback(
  (row) => {
    // Check for dynamic fee totals first
    const dynamicFeePaidTotal = getAnyNumber(row, ["dynamicFeePaidTotal"]);
    const dynamicFeeTotal = getAnyNumber(row, ["dynamicFeeTotal", "dynamic_fee_total"]);

    // Check for explicit remaining amount
    const explicitRemaining = getExplicitRemainingAmount(row);

    // If dynamic fee totals are available, use them
    if (dynamicFeeTotal > 0 || dynamicFeePaidTotal > 0) {
      const expected = dynamicFeeTotal > 0 ? dynamicFeeTotal : 0;
      const paid = dynamicFeePaidTotal > 0 ? dynamicFeePaidTotal : 0;
      const unpaid = Math.max(expected - paid, 0);
      return { expected, paid, unpaid: explicitRemaining > 0 ? explicitRemaining : unpaid };
    }

    const expectedDirect = getAnyNumber(row, [
      "CompleteFee", "completeFee", "Total_Expected", "total_expected",
      "TotalFee", "total_fee", "Total_Fee", "Fee_Expected", "fee_expected",
    ]);

    const paidDirect = getAnyNumber(row, [
      "Paid_Amount", "paid_amount", "Total_Paid", "totalPaid", "dynamicFeePaidTotal",
    ]);

    const expected = expectedDirect;
    const paid = paidDirect > 0 ? paidDirect : getDynamicTotalBySuffix(row, "paid");
    let unpaid = Math.max(expected - paid, 0);

    if (explicitRemaining > 0) {
      unpaid = explicitRemaining;
    }

    if (expected === 0 && paid === 0) {
      const dueAlt = getAnyNumber(row, [
        "Due_Amount", "Total_Due", "unpaidAmount", "Pending_Amount", "Previous_Fee_Due", "previous_fee_due",
      ]);
      if (dueAlt > 0) unpaid = dueAlt;
      else if (explicitRemaining > 0) unpaid = explicitRemaining;
    }

    return { expected, paid, unpaid };
  },
  [getAnyNumber]
);

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

  const lastPaymentReceipt = (() => {
    if (latestReceipt?.receiptNumber) {
      const recordDate =
        latestReceipt.paymentDate ||
        latestReceipt.created_at ||
        latestReceipt.record_date ||
        latestReceipt.paidDate ||
        null;
      const formattedDate = recordDate ? new Date(recordDate).toLocaleDateString("en-GB") : "-";
      const studentName =
        latestReceipt.studentName ||
        latestReceipt.StudentName ||
        latestReceipt.name ||
        "Student";
      const className =
        latestReceipt.className ||
        latestReceipt.Class_name ||
        latestReceipt.class_name ||
        "Class";
      const section =
        latestReceipt.sectionName ||
        latestReceipt.Section ||
        latestReceipt.section ||
        "";

      return {
        receiptNumber: latestReceipt.receiptNumber,
        formattedDate,
        studentName,
        classSection: [className, section].filter(Boolean).join(" "),
      };
    }

    const rows = [...(allFeeStatusRows || [])]
      .filter((row) => row && (row.receiptNumber || row.created_at || row.record_date || row.paid_date))
      .sort((a, b) => {
        const aTime = new Date(a.created_at || a.record_date || a.paid_date || 0).getTime();
        const bTime = new Date(b.created_at || b.record_date || b.paid_date || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 1);

    if (!rows.length) return null;

    const row = rows[0];
    const receiptNumber = row?.receiptNumber || row?.receipt_no || row?.receipt_no_id || "-";
    const recordDate = row?.record_date || row?.created_at || row?.paid_date || row?.paidDate || null;
    const formattedDate = recordDate ? new Date(recordDate).toLocaleDateString("en-GB") : "-";
    const studentName =
      row?.StudentName ||
      row?.studentName ||
      row?.name ||
      row?.Student_Name ||
      "Student";
    const className = row?.Class_name || row?.class_name || row?.className || "Class";
    const section = row?.Section || row?.section || row?.sectionName || row?.FeeSection || "";
    return {
      receiptNumber,
      formattedDate,
      studentName,
      classSection: [className, section].filter(Boolean).join(" "),
    };
  })();

  const fetchDashboardData = useCallback(async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;
    const fromDate = "2000-01-01";
    const toDate = "2099-12-31";

    try {
      setDashboardLoading(true);
      const [unpaidResult, summaryResult, allFeesResult, studentsResult, latestReceiptResult] = await Promise.allSettled([
        axios.get("https://cleezoclass.com:5000/api/fee-records", {
          params: { type: "TotalDueList", schoolCode, fromDate, toDate },
        }),
        axios.get("https://cleezoclass.com:5000/api/fees-summary-ledgerData", {
          params: { schoolCode, year: "All", className: "All", section: "All" },
        }),
        axios.get("https://cleezoclass.com:5000/api/fee-records", {
          params: { type: "AllFeesStatusReport", schoolCode, fromDate, toDate },
        }),
        axios.get("https://cleezoclass.com:5000/students-details", {
          params: { schoolCode },
        }),
        axios.get("https://cleezoclass.com:5000/api/bill/latest-receipt", {
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
      const masterStudents =
        studentsResult?.status === "fulfilled" && Array.isArray(studentsResult.value?.data?.students)
          ? studentsResult.value.data.students
          : [];

      setUnpaidStudents(unpaid);
      setStudentDirectory(masterStudents);
      setLatestReceipt(
        latestReceiptResult.status === "fulfilled"
          ? latestReceiptResult.value?.data?.receipt || null
          : null
      );

      const mobileSummary =
        summaryResult.status === "fulfilled" && summaryResult.value?.data?.success
          ? summaryResult.value.data
          : null;
      const totalDueFromUnpaid = unpaid.reduce((sum, row) => {
        const explicitRemaining = getExplicitRemainingAmount(row);
        const dueAmount = getAnyNumber(row, ["Due_Amount", "Total_Due", "unpaidAmount", "Pending_Amount"]);
        return sum + (explicitRemaining > 0 ? explicitRemaining : dueAmount);
      }, 0);

      let gross = mobileSummary ? toNumber(mobileSummary.totalAmount) : 0;
      let concession = mobileSummary ? toNumber(mobileSummary.totalDiscount) : 0;
      let totalPaid = mobileSummary ? toNumber(mobileSummary.totalPaid) : 0;
      const mobileBalance = mobileSummary ? toNumber(mobileSummary.balance) : 0;
      let netPayable = Math.max(gross - concession, 0);
      let totalDue = totalDueFromUnpaid || mobileBalance;

      const summaryLooksEmpty = gross === 0 && concession === 0 && totalPaid === 0 && totalDue === 0;
      const grossLooksMissing = gross === 0 && allFeesRows.length > 0;

      if (summaryLooksEmpty || grossLooksMissing) {
        let grossFallback = 0;
        let totalPaidFallback = 0;
        let concessionFallback = 0;
        let totalDueFallback = 0;

        allFeesRows.forEach((row) => {
          const totals = getFeeTotalsForRow(row);
          grossFallback += totals.expected;
          totalPaidFallback += totals.paid;
          totalDueFallback += totals.unpaid;
          concessionFallback += getAnyNumber(row, ["Discount", "Total_Discount", "Concession", "feeDiscount"]);
        });

        gross = grossFallback + concessionFallback;
        concession = concessionFallback;
        totalPaid = totalPaidFallback;
        netPayable = Math.max(gross - concession, 0);
        totalDue = totalDueFallback;
      }

      const progress = netPayable > 0 ? (totalPaid / netPayable) * 100 : 0;
      setSummary({
        gross,
        concession,
        netPayable,
        totalPaid,
        totalDue,
        progress: Math.min(Math.max(progress, 0), 100),
      });
    } catch {
      setSummary({
        gross: 0,
        concession: 0,
        netPayable: 0,
        totalPaid: 0,
        totalDue: 0,
        progress: 0,
      });
      setUnpaidStudents([]);
      setAllFeeStatusRows([]);
      setStudentDirectory([]);
      setLatestReceipt(null);
    } finally {
      setDashboardLoading(false);
    }
  }, [getAnyNumber, getFeeTotalsForRow, toNumber]);

  const fetchPreviousYearDue = useCallback(async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;
    const fromDate = "2000-01-01";
    const toDate = "2099-12-31";
    try {
      const res = await axios.get("https://cleezoclass.com:5000/api/fee-records-alldata", {
        params: { schoolCode, type: "PreviousPaidPendingReport", fromDate, toDate },
      });
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
    } catch {
      setPreviousYearDue(0);
    }
  }, [getAnyNumber]);

  useEffect(() => {
    fetchDashboardData();
    fetchPreviousYearDue();
  }, [fetchDashboardData, fetchPreviousYearDue]);

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

  const openDiscountsPopup = useCallback(() => {
    setIsDiscountsPopupOpen(true);
  }, []);

  useEffect(() => {
    if (!isDiscountsPopupOpen) return;

    const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
    if (!schoolCode) {
      setDiscountsData([]);
      setDiscountsError("School code missing.");
      return;
    }

    let cancelled = false;

    const fetchDiscounts = async () => {
      try {
        setDiscountsLoading(true);
        setDiscountsError("");

        const params = new URLSearchParams({
          schoolCode,
          className: selectedClassFilter || "All",
          section: selectedSectionFilter || "All",
          fromDate: "",
          toDate: "",
        });

        const response = await axios.get(`https://cleezoclass.com:5000/api/discounts-report?${params.toString()}`);
        const result = Array.isArray(response.data) ? response.data : response.data?.data || [];
        if (cancelled) return;
        setDiscountsData(result);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load discounts report:", error);
        setDiscountsData([]);
        setDiscountsError("Failed to load discounts.");
      } finally {
        if (!cancelled) {
          setDiscountsLoading(false);
        }
      }
    };

    fetchDiscounts();

    return () => {
      cancelled = true;
    };
  }, [isDiscountsPopupOpen, selectedClassFilter, selectedSectionFilter]);

  const openAssistantPanel = useCallback(() => {
    setIsAddFeesPopupOpen(false);
    setIsAssistantPopupOpen(true);
  }, []);

  const refreshPaymentSummaryMap = useCallback(async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || selectedClassFilter === "All" || selectedSectionFilter === "All") {
      setPaymentSummaryMap({});
      return;
    }

    const studentsForSelectedClass = Array.isArray(classSectionStudents) ? classSectionStudents : [];

    if (!studentsForSelectedClass.length) {
      setPaymentSummaryMap({});
      return;
    }

    const entries = await Promise.all(
      studentsForSelectedClass.map(async (student) => {
        const studentId = student?.id ?? student?.student_id;
        if (!studentId) return null;

        try {
          const res = await axios.get(`https://cleezoclass.com:5000/api/payment/${studentId}`, {
            params: { schoolCode },
          });

          const paymentPayload = res?.data?.payments || res?.data?.payment || res?.data || null;
          if (!paymentPayload || typeof paymentPayload !== "object") return null;

          const key = getStudentCompositeKey({
            StudentName: paymentPayload?.studentName || paymentPayload?.StudentName || student?.name,
            Class_name: paymentPayload?.class || paymentPayload?.Class_name || student?.class_name,
            Section: paymentPayload?.section || paymentPayload?.Section || student?.section,
          });

          return [
            {
              studentId: String(studentId),
              key,
            },
            paymentPayload,
          ];
        } catch {
          return null;
        }
      })
    );

    const nextMap = {};
    entries.forEach((entry) => {
      if (!entry) return;
      const [lookup, value] = entry;
      if (!lookup) return;
      if (lookup.studentId) {
        nextMap[lookup.studentId] = value;
      }
      if (lookup.key) {
        nextMap[lookup.key] = value;
      }
    });
    setPaymentSummaryMap(nextMap);
  }, [classSectionStudents, selectedClassFilter, selectedSectionFilter]);

  const getIndividualFeeSummary = useCallback((paymentSummary) => {
    const dynamicBreakdown = Array.isArray(paymentSummary?.dynamicFeeBreakdown)
      ? paymentSummary.dynamicFeeBreakdown
      : [];
    const individualAssignments = Array.isArray(paymentSummary?.individualFeeAssignments)
      ? paymentSummary.individualFeeAssignments
      : [];
    const individualTypeKeys = new Set(
      (dynamicFeeTypes || [])
        .filter((fee) => String(fee?.scope || "").trim().toLowerCase() === "individual")
        .map((fee) => normalizeFeeKey(fee?.columnBase || fee?.feeName || fee?.feesType || fee?.label || ""))
        .filter(Boolean)
    );

    const rows = [...dynamicBreakdown, ...individualAssignments].filter((row) => {
      const rowScope = String(row?.scope || row?.source || row?.feeScope || "").trim().toLowerCase();
      const rowKey = normalizeFeeKey(row?.key || row?.label || row?.type || row?.feeName || "");
      return rowScope === "individual" || individualTypeKeys.has(rowKey);
    });

    return rows.reduce(
      (summary, row) => {
        const total = Number(row?.total ?? row?.amount ?? row?.amountTotal ?? row?.completeFee ?? 0);
        const paid = Number(row?.paid ?? row?.paidAmount ?? row?.amountPaid ?? row?.paid_total ?? 0);
        const discount = Number(row?.discount ?? row?.discountAmount ?? row?.amountDiscount ?? 0);
        const explicitRemaining = Number(row?.remaining ?? row?.due ?? row?.dueAmount ?? 0);
        const remaining =
          Number.isFinite(explicitRemaining) && explicitRemaining > 0
            ? explicitRemaining
            : Math.max(
                (Number.isFinite(total) ? total : 0) -
                  (Number.isFinite(paid) ? paid : 0) -
                  (Number.isFinite(discount) ? discount : 0),
                0
              );

        summary.total += Number.isFinite(total) ? Math.max(total, 0) : 0;
        summary.paid += Number.isFinite(paid) ? Math.max(paid, 0) : 0;
        summary.remaining += Number.isFinite(remaining) ? Math.max(remaining, 0) : 0;
        return summary;
      },
      { total: 0, paid: 0, remaining: 0 }
    );
  }, [dynamicFeeTypes]);

  const isIndividualFeeRow = useCallback(
    (row) => {
      const rowScope = String(row?.scope || row?.source || row?.feeScope || "").trim().toLowerCase();
      if (rowScope === "individual") return true;

      const rowKey = normalizeFeeColumnBase(row?.key || row?.columnBase || row?.type || row?.feeName || row?.label || "");
      if (!rowKey) return false;

      return (dynamicFeeTypes || []).some((fee) => {
        const feeScope = String(fee?.scope || "").trim().toLowerCase();
        if (feeScope !== "individual") return false;

        const feeKeys = [
          fee?.columnBase,
          fee?.feeName,
          fee?.feesType,
          fee?.label,
        ]
          .map(normalizeFeeColumnBase)
          .filter(Boolean);

        return feeKeys.includes(rowKey);
      });
    },
    [dynamicFeeTypes]
  );

const getPaymentBreakdownSummary = useCallback((paymentSummary) => {
  const rows = Array.isArray(paymentSummary?.dynamicFeeBreakdown)
    ? paymentSummary.dynamicFeeBreakdown
    : [];

  return rows.reduce(
    (summary, row) => {
      const key = normalizeFeeKey(row?.key || row?.label || "");
      if (!key || key === "amount") return summary;

      const isIndividual = isIndividualFeeRow(row);

      const total = Number(row?.total ?? row?.amount ?? row?.amountTotal ?? 0);
      const paid = Number(row?.paid ?? row?.paidAmount ?? row?.amountPaid ?? 0);
      const discount = Number(row?.discount ?? row?.discountAmount ?? 0);
      const remaining = Number(row?.remaining ?? row?.due ?? row?.dueAmount ?? 0);

      const safeTotal = Number.isFinite(total) ? Math.max(total, 0) : 0;
      const safePaid = Number.isFinite(paid) ? Math.max(paid, 0) : 0;
      const safeDiscount = Number.isFinite(discount) ? Math.max(discount, 0) : 0;
      const safeRemaining = Number.isFinite(remaining) ? Math.max(remaining, 0) : 0;

      summary.hasRows = true;
      summary.total += safeTotal;
      summary.paid += safePaid;
      summary.discount += safeDiscount;
      summary.remaining += safeRemaining;

      if (isIndividual) {
        summary.individualTotal += safeTotal;
        summary.individualPaid += safePaid;
        summary.individualDiscount += safeDiscount;
        summary.individualRemaining += safeRemaining;
      } else {
        summary.classWiseTotal += safeTotal;
        summary.classWisePaid += safePaid;
        summary.classWiseDiscount += safeDiscount;
        summary.classWiseRemaining += safeRemaining;
      }

      return summary;
    },
    {
      hasRows: false,
      total: 0,
      paid: 0,
      discount: 0,
      remaining: 0,
      classWiseTotal: 0,
      classWisePaid: 0,
      classWiseDiscount: 0,
      classWiseRemaining: 0,
      individualTotal: 0,
      individualPaid: 0,
      individualDiscount: 0,
      individualRemaining: 0,
    }
  );
}, [isIndividualFeeRow]);

  useEffect(() => {
    let isCancelled = false;

    refreshPaymentSummaryMap().catch(() => {
      if (!isCancelled) {
        setPaymentSummaryMap({});
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [refreshPaymentSummaryMap]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || selectedClassFilter === "All" || selectedSectionFilter === "All") {
      setClassSectionStudents([]);
      return;
    }

    let isCancelled = false;

    axios
      .get(`https://cleezoclass.com:5000/api/studentsNameAccountant/${encodeURIComponent(selectedClassFilter)}`, {
        params: {
          schoolCode,
          section: selectedSectionFilter,
        },
      })
      .then((res) => {
        if (isCancelled) return;
        setClassSectionStudents(Array.isArray(res.data?.students) ? res.data.students : []);
      })
      .catch(() => {
        if (isCancelled) return;
        setClassSectionStudents([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedClassFilter, selectedSectionFilter]);

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || selectedClassFilter === "All" || selectedSectionFilter === "All") {
      setSelectedClassFeeStructure(null);
      return;
    }

    axios
      .get(`https://cleezoclass.com:5000/feeStructure/${selectedClassFilter}`, {
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
    if (!schoolCode) return;

    axios
      .get("https://cleezoclass.com:5000/api/fee-types", {
        params: { schoolCode, _t: Date.now() },
      })
      .then((res) => {
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const normalized = rows
          .filter((item) => String(item?.feeName || "").trim() !== "")
          .map((item, index) => ({
            id: item?.id || index,
            feeName: item?.feeName || "",
            feesType: item?.feesType || "Custom Fee",
            priority: item?.priority || index + 1,
            scope: item?.scope || "All",
            frequency: item?.frequency || "One time",
            installments: item?.installments || 1,
          }));
        setDynamicFeeTypes(normalized);
      })
      .catch(() => {
        setDynamicFeeTypes([]);
      });
  }, []);
const handleCreateFeeType = useCallback(
  async (event) => {
    event.preventDefault();

    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
      setCreateFeeTypeError("School code is missing.");
      return;
    }

    const feeName = newFeeTypeForm.feesType.trim();

    // Required field validations
    if (!feeName) {
      setCreateFeeTypeError("Fee name is required.");
      return;
    }

    if (!newFeeTypeForm.scope) {
      setCreateFeeTypeError("Please select a scope.");
      return;
    }

    if (!newFeeTypeForm.frequency) {
      setCreateFeeTypeError("Please select a frequency.");
      return;
    }

    // Duplicate fee type validation
    const alreadyExists = dynamicFeeTypes.some(
      (item) =>
        String(item.feeName || "")
          .trim()
          .toLowerCase() === feeName.toLowerCase()
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

      await axios.post(
        "https://cleezoclass.com:5000/api/fee-types",
        payload
      );

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
      setCreateFeeTypeError(
        error?.response?.data?.message || "Failed to save fee type."
      );
    } finally {
      setCreateFeeTypeLoading(false);
    }
  },
  [dynamicFeeTypes, newFeeTypeForm]
);
  const normalizedOutstandingStudents = useCallback(() => {
    const sourceStudents =
      selectedClassFilter !== "All" && selectedSectionFilter !== "All" && classSectionStudents.length
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
      className: student?.class_name || student?.Class_name || student?.className || "",
      section: student?.section || student?.Section || student?.sectionName || "",
      fatherName: student?.father_name || student?.fatherName || student?.Father_Name || "",
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

  const outstandingDueMap = useCallback(() => {
    const transactionDueMap = new Map();
    const explicitRemainingMap = new Map();

    (allFeeStatusRows || []).forEach((row) => {
      const name = row?.StudentName || row?.studentName || row?.name || row?.Student_Name || "";
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

      // Transaction rows often carry running remaining balances like 8000, 7000, 6000.
      // Summing those values inflates due, so only accumulate rows that are genuine due summaries.
      if (transactionPaid > 0 && explicitRemaining > 0) {
        return;
      }

      transactionDueMap.set(key, (transactionDueMap.get(key) || 0) + dueAmount);
    });

    (unpaidStudents || []).forEach((row) => {
      const name = row?.StudentName || row?.studentName || row?.name || row?.Student_Name || "";
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

  const unpaidSummaryDueMap = useCallback(() => {
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

  const groupedOutstandingStudents = useCallback(() => {
    const groups = new Map();
    normalizedOutstandingStudents().forEach((student, index) => {
      const studentKey = [
        String(student.name || "").trim().toLowerCase(),
        String(student.className || "").trim().toLowerCase(),
        String(student.section || "").trim().toLowerCase(),
      ].join("|");
      const groupKey = String(student.id || "").trim() || studentKey;
      const dueAmount = outstandingDueMap().get(studentKey) || 0;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          ...student,
          id: student.id || `student-${index}`,
          dueAmount,
        });
      }
    });
    return [...groups.values()];
  }, [normalizedOutstandingStudents, outstandingDueMap]);

  const selectedClassDefaultDue = useCallback(() => {
    if (!selectedClassFeeStructure) return 0;

    const classWiseFeeKeys = new Set(
      (dynamicFeeTypes || [])
        .filter((fee) => String(fee?.scope || "").trim().toLowerCase() !== "individual")
        .flatMap((fee) => [
          fee?.columnBase,
          fee?.feeName,
          fee?.feesType,
          fee?.label,
        ])
        .map(normalizeFeeColumnBase)
        .filter(Boolean)
    );

    const ignoredKeys = new Set([
      "id",
      "created_at",
      "updated_at",
      "class_name",
      "section",
      "schoolcode",
      "school_code",
      "login_id",
    ]);
    const feeAmounts = new Map();

    Object.entries(selectedClassFeeStructure || {}).forEach(([key, value]) => {
      const rawKey = String(key || "").trim().toLowerCase();
      const normalizedKey = normalizeFeeColumnBase(key);
      if (!normalizedKey || ignoredKeys.has(rawKey)) return;
      if (normalizedKey.includes("paid") || normalizedKey.includes("due")) return;
      if (normalizedKey.includes("discount") || normalizedKey.includes("remaining")) return;
      if (!classWiseFeeKeys.has(normalizedKey)) return;

      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) return;

      feeAmounts.set(normalizedKey, Math.max(feeAmounts.get(normalizedKey) || 0, numericValue));
    });

    return [...feeAmounts.values()].reduce((sum, value) => sum + value, 0);
  }, [dynamicFeeTypes, selectedClassFeeStructure]);

  const hasSelectedClassFeeSetup = useCallback(() => {
    if (!selectedClassFeeStructure || typeof selectedClassFeeStructure !== "object") return false;

    const ignoredKeys = new Set([
      "id",
      "created_at",
      "updated_at",
      "class_name",
      "Class_name",
      "section",
      "Section",
      "schoolCode",
      "school_code",
      "login_id",
    ]);

    return Object.entries(selectedClassFeeStructure).some(([key, value]) => {
      if (ignoredKeys.has(key)) return false;
      const normalizedKey = String(key || "").toLowerCase();
      if (normalizedKey.includes("date") || normalizedKey.includes("remark")) return false;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) && numericValue > 0;
    });
  }, [selectedClassFeeStructure]);

  const shouldHighlightAddFees =
    selectedClassFilter !== "All" &&
    selectedSectionFilter !== "All" &&
    !hasSelectedClassFeeSetup();

  const selectedClassPaidTotalsMap = useCallback(() => {
    const transactionMap = new Map();
    const aggregateFallbackMap = new Map();
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

      const transactionPaid = getAnyNumber(row, ["amount_paid", "paid_amount"]);
      const aggregatePaid = getAnyNumber(row, [
        "Paid_Amount",
        "Total_Paid",
        "totalPaid",
        "dynamicFeePaidTotal",
      ]);

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

    return merged;
  }, [allFeeStatusRows, getAnyNumber, unpaidStudents]);
const outstandingFilterSourceRows = [
  ...(studentDirectory || []),
  ...(unpaidStudents || []),
  ...(allFeeStatusRows || []),
];

const classOptions = [
  "All",
  ...sortClassLabels(
    [
      ...new Map(
        outstandingFilterSourceRows
          .map((row) => {
            const className =
              row?.className ||
              row?.Class_name ||
              row?.class_name ||
              row?.FeeClass ||
              "";

            const classKey = normalizeClassLabel(className);

            return classKey
              ? [classKey, className]
              : null;
          })
          .filter(Boolean)
      ).values(),
    ]
  ),
];

const sectionOptions = [
  "All",
  ...sortSectionLabels(
    [
      ...new Map(
        outstandingFilterSourceRows
          .filter((row) => {
            if (selectedClassFilter === "All") return true;

            const className =
              row?.className ||
              row?.Class_name ||
              row?.class_name ||
              row?.FeeClass ||
              "";

            return (
              normalizeClassLabel(className) ===
              normalizeClassLabel(selectedClassFilter)
            );
          })
          .map((row) => {
            const section =
              row?.section ||
              row?.Section ||
              row?.sectionName ||
              row?.FeeSection ||
              "";

            const sectionKey = normalizeSectionLabel(section);

            return sectionKey
              ? [sectionKey, section]
              : null;
          })
          .filter(Boolean)
      ).values(),
    ]
  ),
];

  const filteredOutstandingStudents = groupedOutstandingStudents()
    .map((student) => {
      const key = [
        String(student?.name || student?.StudentName || "").trim().toLowerCase(),
        String(student?.className || student?.Class_name || "").trim().toLowerCase(),
        String(student?.section || student?.Section || "").trim().toLowerCase(),
      ].join("|");
      const groupedDue = Number(student?.dueAmount) || 0;
      const summaryDue = unpaidSummaryDueMap().get(key) || 0;
      const paymentSummary = paymentSummaryMap[String(student?.id ?? student?.student_id ?? "")] || paymentSummaryMap[key] || null;
      const paymentBreakdownSummary = getPaymentBreakdownSummary(paymentSummary);
      const hasPaymentSummary = Boolean(paymentSummary && typeof paymentSummary === "object");
      const paymentSummaryConfirmsZero =
        hasPaymentSummary &&
        !hasSelectedClassFeeSetup() &&
        Number(paymentSummary?.totalFee || 0) === 0 &&
        Number(paymentSummary?.totalRemaining || 0) === 0 &&
        Number(paymentSummary?.totalPaid || 0) === 0 &&
        !paymentBreakdownSummary.hasRows &&
        (!Array.isArray(paymentSummary?.individualFeeAssignments) ||
          paymentSummary.individualFeeAssignments.length === 0);
      const paymentApiDue = paymentBreakdownSummary.hasRows
        ? paymentBreakdownSummary.remaining
        : getExplicitRemainingAmount(paymentSummary);
      const overrideDue = getExplicitRemainingAmount(student);
      const individualFeeSummary = paymentSummary ? getIndividualFeeSummary(paymentSummary) : { total: 0, paid: 0, remaining: 0 };
      const paymentPaid =
        paymentBreakdownSummary.hasRows
          ? paymentBreakdownSummary.classWisePaid + paymentBreakdownSummary.individualPaid
          : paymentSummary
          ? getAnyNumber(paymentSummary, ["Paid_Amount", "Total_Paid", "totalPaid", "dynamicFeePaidTotal"]) + individualFeeSummary.paid
          : 0;
      const resolvedStudentDue =
        paymentBreakdownSummary.hasRows
          ? paymentApiDue
          : groupedDue > 0
          ? groupedDue
          : summaryDue > 0
            ? summaryDue
            : overrideDue > 0
              ? overrideDue
              : paymentApiDue > 0
                ? paymentApiDue
                : 0;
      const totalPaidForStudent = selectedClassPaidTotalsMap().get(key) || 0;
      const classWisePaidForStudent = paymentBreakdownSummary.hasRows
        ? paymentBreakdownSummary.classWisePaid
        : Math.max(totalPaidForStudent - individualFeeSummary.paid, 0);
      const computedDueFromSelectedClass =
        selectedClassFilter !== "All" &&
        selectedSectionFilter !== "All" &&
        selectedClassDefaultDue() > 0
          ? Math.max(selectedClassDefaultDue() - classWisePaidForStudent, 0)
          : 0;
      const individualDue = paymentBreakdownSummary.hasRows
        ? Math.max(paymentBreakdownSummary.individualRemaining || individualFeeSummary.remaining || 0, 0)
        : Math.max(individualFeeSummary.remaining || 0, 0);
      const classWiseDue = paymentBreakdownSummary.hasRows
        ? Math.max(paymentBreakdownSummary.classWiseRemaining || 0, computedDueFromSelectedClass || 0)
        : computedDueFromSelectedClass > 0
          ? computedDueFromSelectedClass
          : Math.max(resolvedStudentDue || 0, 0);
      const computedDue =
        paymentSummaryConfirmsZero
          ? 0
          : Math.max(classWiseDue + individualDue, 0);

      if (isAishaDebugStudent(student)) {
        const paidRowsFromAllFeesStatus = (allFeeStatusRows || [])
          .filter((row) => getStudentCompositeKey(row) === key)
          .map((row) => {
            const rowTotals = getFeeTotalsForRow(row);
            return {
              id: row?.id,
              receiptNumber: row?.receiptNumber,
              fee_type: row?.fee_type,
              amount_paid: row?.amount_paid,
              dynamicFeePaidTotal: row?.dynamicFeePaidTotal,
              totalRemaining: row?.totalRemaining,
              Total_Paid: row?.Total_Paid,
              Total_Due: row?.Total_Due,
              Due_Amount: row?.Due_Amount,
              Total_Expected: row?.Total_Expected,
              record_date: row?.record_date,
              totalsFromRow: rowTotals,
              explicitRemaining: getExplicitRemainingAmount(row),
            };
          });

        const paidRowsFromUnpaidList = (unpaidStudents || [])
          .filter((row) => getStudentCompositeKey(row) === key)
          .map((row) => {
            const rowTotals = getFeeTotalsForRow(row);
            return {
              id: row?.id,
              receiptNumber: row?.receiptNumber,
              fee_type: row?.fee_type,
              amount_paid: row?.amount_paid,
              dynamicFeePaidTotal: row?.dynamicFeePaidTotal,
              totalRemaining: row?.totalRemaining,
              Total_Paid: row?.Total_Paid,
              Total_Due: row?.Total_Due,
              Due_Amount: row?.Due_Amount,
              Due_Alt: getAnyNumber(row, ["unpaidAmount", "Due_Amount", "Total_Due", "Pending_Amount"]),
              Total_Expected: row?.Total_Expected,
              record_date: row?.record_date,
              totalsFromRow: rowTotals,
              explicitRemaining: getExplicitRemainingAmount(row),
            };
          });

        console.groupCollapsed("[Aisha Due Debug] How due became", computedDue);
        console.log("Student card row", student);
        console.log("Student key", key);
        console.log("Selected filters", {
          selectedClassFilter,
          selectedSectionFilter,
        });
        console.log("Selected class fee structure", selectedClassFeeStructure);
        console.log("Computation pieces", {
          groupedDue,
          paymentSummary,
          paymentApiDue,
          summaryDue,
          overrideDue,
          resolvedStudentDue,
          totalPaidForStudent,
          selectedClassDefaultDue: selectedClassDefaultDue(),
          computedDueFromSelectedClass,
          finalComputedDue: computedDue,
          reasonUsed:
            resolvedStudentDue > 0
              ? "resolvedStudentDue"
              : computedDueFromSelectedClass > 0
                ? "selectedClassDefaultDue - totalPaidForStudent"
                : "zero-fallback",
        });
        console.log("Paid rows from AllFeesStatusReport", paidRowsFromAllFeesStatus);
        console.log("Due rows from TotalDueList/unpaid list", paidRowsFromUnpaidList);
        console.groupEnd();
      }
      return {
        ...student,
        dueAmount: computedDue,
        paidAmount: paymentPaid,
        paymentSummary,
        paymentBreakdownSummary,
      };
    })
    .filter((student) => {
      const classMatch =
        selectedClassFilter === "All" ||
        normalizeClassLabel(student.className) === normalizeClassLabel(selectedClassFilter);
      const sectionMatch =
        selectedSectionFilter === "All" ||
        normalizeSectionLabel(student.section) === normalizeSectionLabel(selectedSectionFilter);
      const searchMatch =
        !studentSearchTerm.trim() ||
        student.name.toLowerCase().includes(studentSearchTerm.trim().toLowerCase());
      return classMatch && sectionMatch && searchMatch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const displaySummary = (() => {
    const studentTotals = filteredOutstandingStudents.reduce(
      (totals, student) => {
        const breakdown = student?.paymentBreakdownSummary || {};
        const hasBreakdown = Boolean(breakdown.hasRows);
        const paid = hasBreakdown ? Number(student?.paidAmount || breakdown.paid || 0) : Number(student?.paidAmount || 0);
        const discount = hasBreakdown ? Number(breakdown.discount || 0) : 0;
        const due = Number(student?.dueAmount || 0);
        const netAmount = hasBreakdown
          ? Math.max(Number(breakdown.total || 0), paid + due)
          : paid + due;

        totals.netPayable += Number.isFinite(netAmount) ? Math.max(netAmount, 0) : 0;
        totals.totalPaid += Number.isFinite(paid) ? Math.max(paid, 0) : 0;
        totals.concession += Number.isFinite(discount) ? Math.max(discount, 0) : 0;
        totals.totalDue += Number.isFinite(due) ? Math.max(due, 0) : 0;
        totals.hasBreakdown = totals.hasBreakdown || hasBreakdown;
        return totals;
      },
      {
        netPayable: 0,
        concession: 0,
        totalPaid: 0,
        totalDue: 0,
        hasBreakdown: false,
      }
    );

    const allStudentsSelected = selectedClassFilter === "All" && selectedSectionFilter === "All";
    const shouldUseStudentBreakdown =
      filteredOutstandingStudents.length > 0 &&
      (
        allStudentsSelected ||
        (
          selectedClassFilter !== "All" &&
          selectedSectionFilter !== "All" &&
          studentTotals.hasBreakdown
        )
      );

    if (!shouldUseStudentBreakdown) return summary;

    const concession = studentTotals.concession > 0 ? studentTotals.concession : Number(summary.concession || 0);
    const netPayable = Math.max(studentTotals.netPayable, 0);
    const gross = netPayable + concession;
    const progress = netPayable > 0 ? (studentTotals.totalPaid / netPayable) * 100 : 0;

    return {
      ...summary,
      gross,
      concession,
      netPayable,
      totalPaid: studentTotals.totalPaid,
      totalDue: studentTotals.totalDue,
      progress: Math.min(Math.max(progress, 0), 100),
    };
  })();

  useEffect(() => {
    if (selectedClassFilter === "All" || selectedSectionFilter === "All") return;

    const matchedRows = (allFeeStatusRows || []).filter((row) => {
      const sameClass =
        normalizeClassLabel(row?.Class_name || row?.class_name || "") === normalizeClassLabel(selectedClassFilter);
      const sameSection =
        normalizeSectionLabel(row?.section || row?.Section || "") === normalizeSectionLabel(selectedSectionFilter);
      return sameClass && sameSection;
    });

    const grouped = filteredOutstandingStudents.map((student) => ({
      studentName: student.name,
      className: student.className,
      section: student.section,
      dueAmount: student.dueAmount,
      explicitRemaining: getExplicitRemainingAmount(student),
      totalPaidFromRows:
        selectedClassPaidTotalsMap().get(
          [
            String(student?.name || "").trim().toLowerCase(),
            String(student?.className || "").trim().toLowerCase(),
            String(student?.section || "").trim().toLowerCase(),
          ].join("|")
        ) || 0,
    }));

    const signature = JSON.stringify({
      className: selectedClassFilter,
      section: selectedSectionFilter,
      rows: matchedRows.map((row) => ({
        id: row?.id,
        receiptNumber: row?.receiptNumber,
        fee_type: row?.fee_type,
        studentName: row?.StudentName,
        className: row?.Class_name,
        section: row?.section,
        amount_paid: row?.amount_paid,
        totalPaid: row?.Total_Paid,
        totalDue: row?.Total_Due,
        record_date: row?.record_date,
      })),
      grouped,
    });

    if (window.__feesDebugLastSignature === signature) return;
    window.__feesDebugLastSignature = signature;

    console.log("[AccountantFeesPageNew][due-debug]", {
      selectedClassFilter,
      selectedSectionFilter,
      matchedRows,
      grouped,
    });
  }, [allFeeStatusRows, filteredOutstandingStudents, paymentSummaryMap, selectedClassFilter, selectedSectionFilter, selectedClassPaidTotalsMap]);

  const openPaymentGrid = useCallback(
    (student) => {
      const className = student?.className || (selectedClassFilter !== "All" ? selectedClassFilter : "");
      const sectionName = student?.section || (selectedSectionFilter !== "All" ? selectedSectionFilter : "");
      if (!className || !sectionName) return;
      const studentId = student?.id ?? student?.student_id ?? null;
      const studentName =
        student?.name ||
        student?.StudentName ||
        student?.studentName ||
        student?.Student_Name ||
        "";

      console.log("[AccountantFeesPageNew][openPaymentGrid]", {
        clickedStudent: student,
        resolvedStudentId: studentId,
        resolvedStudentName: studentName,
        className,
        sectionName,
      });

      localStorage.setItem("selectedClassSection", `${className}_${sectionName}`);
      localStorage.setItem("className", className);
      localStorage.setItem("section", sectionName);

      setPopupSelection({
        className,
        sectionName,
        studentId,
        studentName,
      });
      setSelectedStudentCardId(studentId);
        setPopupKey((prev) => prev + 1)
      setIsPaymentPopupOpen(true);
    },
    [selectedClassFilter, selectedSectionFilter]
  );

  return (
    <div className="accountant-dashboard-page accountant-fees-page">
      <div className="accountant-dashboard-shell">
    <div className="accountant-sidebar-strip">

  <div
    className="accountant-sidebar-item"
    onClick={() => navigate("/AccountantDashboard")}
  >
    <div className="accountant-sidebar-item-icon">
      <img src={dashboardIcon} alt="Home" />
    </div>
    <span>Dashboard</span>
  </div>

  <div
    className="accountant-sidebar-item accountant-sidebar-item-active"
    onClick={() => navigate("/AccountantFees")}
  >
    <div className="accountant-sidebar-item-icon">
      <img src={collectFeeIcon} alt="" />
    </div>
    <span>Fees</span>
  </div>

  <div
    className="accountant-sidebar-item"
    onClick={openAddFeesPopup}
  >
    <div className="accountant-sidebar-item-icon">
      <img src={addFeeIcon} alt="" />
    </div>
    <span>Add Fees</span>
  </div>

  <div
    className={`accountant-sidebar-item ${isStudentManagementPopupOpen ? "accountant-sidebar-item-active" : ""}`.trim()}
    onClick={() => setIsStudentManagementPopupOpen(true)}
  >
    <div className="accountant-sidebar-item-icon">
      <img src={addStudentIcon} alt="" />
    </div>
    <span>Add Student</span>
  </div>

  <div
    className="accountant-sidebar-item"
    onClick={() => navigate("/AccountantExpenses")}
  >
    <div className="accountant-sidebar-item-icon">
      <img src={expenseIcon} alt="" />
    </div>
    <span>Expense</span>
  </div>

  <div
    className="accountant-sidebar-item"
    onClick={() => navigate("/AccountantReportsPage")}
    role="button"
    tabIndex={0}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ")
        navigate("/AccountantReportsPage");
    }}
  >
    <div className="accountant-sidebar-item-icon">
      <img src={reportIcon} alt="" />
    </div>
    <span>Reports</span>
  </div>

</div>
        <div className="accountant-main-area">
          <div className="accountant-topbar">
            <nav className="accountant-topbar-left">
              <button
                type="button"
                className="accountant-topbar-tab accountant-topbar-tab-button"
                onClick={() => navigate("/AccountantDashboard")}
              >
                Dashboard
              </button>
              <button
                type="button"
                className="accountant-topbar-tab accountant-topbar-tab-button accountant-topbar-tab-active"
                onClick={() => navigate("/AccountantFees")}
              >
                Fees
              </button>
              <button
                type="button"
                className="accountant-topbar-tab accountant-topbar-tab-button"
                onClick={() => navigate("/AccountantExpenses")}
              >
                Expense
              </button>
              <button
                type="button"
                className="accountant-topbar-tab accountant-topbar-tab-button"
                onClick={() => navigate("/AccountantReportsPage")}
              >
                Reports
              </button>
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

          <div className="accountant-grid accountant-fees-grid">
            <div className="accountant-row accountant-fees-row-top">
              <div className="accountant-welcome-block">
                <h2>Hi, {userInfo?.name || localStorage.getItem("name") || "User"}!</h2>
                <p>Check Due Status,</p>
                <p>Report dues to Class Teacher</p>
                <p>Submit Day wise Ledger</p>
              </div>

              <div className="accountant-fees-summary-card accountant-card">
                <div className="accountant-fees-summary-left">
                    <div className="accountant-progress-panel">
                    <div
                      className="accountant-progress-ring"
                      style={{
                        "--progress-angle": `${Math.max(0, Math.min(displaySummary.progress, 100)) * 3.6}deg`,
                      }}
                    >
                      <div className="accountant-progress-ring-inner">
                        {dashboardLoading ? "..." : `${Math.round(displaySummary.progress)}%`}
                      </div>
                    </div>
                  </div>

                  <div className="accountant-fees-summary-stats">
                    <p>
                      <span className="normalText accountant-fees-summary-label">Gross:</span>
                      <strong className="accountant-fees-summary-value">
                        {dashboardLoading ? "Loading..." : formatINR(displaySummary.gross)}
                      </strong>
                    </p>
                    <p>
                      <span className="normalText accountant-fees-summary-label">Discounts:</span>
                      <strong className="accountant-fees-summary-value">
                        {dashboardLoading ? "Loading..." : formatINR(displaySummary.concession)}
                      </strong>
                    </p>
                    <p>
                      <span className="normalText accountant-fees-summary-label">Total Amount:</span>
                      <strong className="accountant-fees-summary-value">
                        {dashboardLoading ? "Loading..." : formatINR(displaySummary.netPayable)}
                      </strong>
                    </p>
                    <p>
                      <span className="normalText accountant-fees-summary-label">Total Paid:</span>
                      <strong className="accountant-fees-summary-value">
                        {dashboardLoading ? "Loading..." : formatINR(displaySummary.totalPaid)}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="accountant-fees-summary-right">
        <button type="button" className="collect-filter" style={{border:'none',fontSize:'18px',color:'#000'}}>
                    <span>As on today</span>
                  </button>

                  <div className="accountant-fees-summary-total">
                    <span>Total Due</span>
                    <strong>{dashboardLoading ? "Loading..." : formatINR(displaySummary.totalDue)}</strong>
                  </div>
                </div>
              </div>

              <div className="accountant-mini-cards">
                {quickCards.map((card) => (
                  <div
                    key={card.title}
                    className={`accountant-quick-card accountant-card ${
                      card.title === "Add Fees" && shouldHighlightAddFees
                        ? "accountant-quick-card-highlight"
                        : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={
                      card.title === "Create Fee type"
                        ? openCreateFeeTypePopup
                        : card.title === "Add Fees"
                          ? openAddFeesPopup
                          : openAssistantPanel
                    }
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      if (card.title === "Create Fee type") openCreateFeeTypePopup();
                      else if (card.title === "Add Fees") openAddFeesPopup();
                      else openAssistantPanel();
                    }}
                  >
                    <div className="">
                      <img src={card.icon} alt="" />
                    </div>
                    <h4>{card.title}</h4>
                    <p>{card.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="accountant-fees-main-section">
              <div className="accountant-fees-main-left">
                <div className="accountant-fees-collection-card accountant-card">
                  <div className="accountant-fees-collection-header">
                    <div className="Heading">Collect Fees</div>

                    <div className="accountant-fees-collection-tools">
                      <div className="accountant-fees-strength">
                        <strong>{filteredOutstandingStudents.length}</strong>
                        <span className="normalText"> Class Strength</span>
                      </div>

                      <input
                        type="text"
                        className="accountant-fees-search"
                        placeholder="Student Search..."
                        value={studentSearchTerm}
                        onChange={(event) => setStudentSearchTerm(event.target.value)}
                      />

                     <select
  className="accountant-card-filter"
  value={selectedClassFilter}
  onChange={(event) => {
    setSelectedClassFilter(event.target.value);
    setSelectedSectionFilter(""); // Reset section when class changes
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

                  <div className="accountant-fees-student-grid">
                    {shouldHighlightAddFees ? (
                      <div className="accountant-fees-student-freeze-note">
                        Add fees for class {selectedClassFilter} - {selectedSectionFilter} first to unlock student collections.
                      </div>
                    ) : null}
                    {filteredOutstandingStudents.length ? (
                      filteredOutstandingStudents.map((student, index) => {
                        const cardId = student?.id ?? student?.student_id ?? index;
                        return (
                        <div
  key={cardId}
  className={`accountant-fees-student ${
    String(selectedStudentCardId) === String(cardId) ? "is-active" : ""
  }`}
  role="button"
  tabIndex={0}
  onClick={() => {
    if (student?.name || student?.StudentName) {
      openPaymentGrid(student);
    }
  }}
  onKeyDown={(event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    if (student?.name || student?.StudentName) {
      openPaymentGrid(student);
    }
  }}
>
  <div className="accountant-fees-student-avatar">
    <img src={userAvatar} alt="" />
  </div>

  <div className="blockText">
    {student.name || student.StudentName || "Student"}
  </div>

  <div className="normalText">
    {student.fatherName ||
      student.father_name ||
      student.FatherName ||
      student.Father_Name ||
      ""}
  </div>

  <div className="normalText">
    {student.className ||
      student.Class_name ||
      student.class_name ||
      "Class"}{" "}
    {student.section ||
      student.Section ||
      student.section_name ||
      ""}
  </div>

  
</div>
                        );
                      })
                    ) : (
                      <div className="accountant-fees-student-freeze-note">
                        No student records found for {selectedClassFilter} - {selectedSectionFilter}.
                      </div>
                    )}
                  </div>
                </div>

                <div className="accountant-fees-bottom-left-row">
                <div className="accountant-fees-log-card accountant-card">
                    <div className="accountant-fees-log-header">
                      <div className="accountant-fees-log-title">Last Payment Receipt</div>
                      <button
                        type="button"
                        className="accountant-view-bills-btn"
                        onClick={() => setIsBillsPopupOpen(true)}
                      >
                        View Bills
                      </button>
                    </div>
                    <div className="accountant-fees-log-list">
                      {lastPaymentReceipt ? (
                        <>
                          <p className="accountant-fees-log-item">
                            Receipt No. {lastPaymentReceipt.receiptNumber}
                          </p>
                          <p className="accountant-fees-log-item">
                            {lastPaymentReceipt.studentName}, {lastPaymentReceipt.classSection}
                          </p>
                          <p className="accountant-fees-log-item">
                            Date: {lastPaymentReceipt.formattedDate}
                          </p>
                        </>
                      ) : (
                        <p className="accountant-fees-log-item">No recent payment receipt found</p>
                      )}
                    </div>
                  </div>

                  <div className="accountant-total-others-card accountant-card" style={{ alignItems: "center" }}>
                    <div className="accountant-total-others-left" style={{ flexDirection: "column", gap: "0.35rem" }}>
                      <div className="blockText">Discounts</div>
                      <div className="normalText">Open the discount list from Add Fees.</div>
                    </div>
                    <div className="accountant-total-others-right">
                      <button
                        type="button"
                        className="accountant-view-bills-btn"
                        onClick={openDiscountsPopup}
                      >
                        View Discounts
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="accountant-fees-main-right">
                <div className="accountant-feetype-list-card accountant-card">
                  <div className="accountant-card-header accountant-feetype-header">
                    <div className="Heading">{isAssistantPopupOpen ? "Assistant" : isAddFeesPopupOpen ? "Selected Class Fees" : "Fee Type"}</div>

                    <div className="accountant-feetype-meta">
                      <button
                        type="button"
                        className="accountant-create-new-btn"
                        onClick={
                          isAssistantPopupOpen || isAddFeesPopupOpen
                            ? () => {
                                setIsAssistantPopupOpen(false);
                                setIsAddFeesPopupOpen(false);
                              }
                            : openCreateFeeTypePopup
                        }
                      >
                        {isAssistantPopupOpen || isAddFeesPopupOpen ? "Close" : "+ Add New"}
                      </button>
                      <div className="accountant-feetype-count">
                        <strong>
                          {isAssistantPopupOpen
                            ? assistantActionItems.length
                            : isAddFeesPopupOpen
                              ? addFeePreview.rows.length
                              : dynamicFeeTypes.length}
                        </strong>
                        <span>
                          {isAssistantPopupOpen
                            ? "Action items"
                            : isAddFeesPopupOpen
                              ? "Selected fees"
                              : "Fee Types"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="accountant-feetype-scroll">
                    {isAssistantPopupOpen ? (
                      <div className="accountant-assistant-panel">
                        <section className="accountant-assistant-inline-section accountant-assistant-inline-section-actions">
                          <div className="accountant-assistant-inline-header">
                            <h4>My Actions</h4>
                            <span>{assistantActionItems.length}</span>
                          </div>
                          <div className="accountant-assistant-actions">
                            {assistantActionItems.map((item, index) => (
                              <article key={`${item.title}-${index}`} className="accountant-assistant-action-card">
                                <div className="blockText">{item.title}</div>
                                <p className="normalText">{item.detail}</p>
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
                    ) : isAddFeesPopupOpen ? (
                      <div className="accountant-feetype-list">
                        {addFeePreview.rows.length ? (
                          addFeePreview.rows.map((fee, index) => (
                            <div key={fee.id || index} className="accountant-feetype-list-item">
                              <span>
                                O {fee.feeName} - {fee.className || addFeePreview.className || "-"} {fee.section || addFeePreview.section || "-"} - Rs {Number(fee.amount || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="accountant-assistant-empty">
                            Select class and section in Add Fees to view fee details.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="accountant-feetype-list">
                        {dynamicFeeTypes.length ? (
                          dynamicFeeTypes.map((item) => (
                            <div key={item.id} className="accountant-feetype-list-item">
                              <span className="normalText">
                                O {item.feeName} - {item.feesType} - {item.scope} - {item.frequency}
                              </span>
                              
                            </div>
                          ))
                        ) : (
                          <div className="accountant-assistant-empty">No fee types available for this school yet.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="accountant-fees-right-mini-row">
                  <div className="accountant-income-card accountant-card">
                    <div className="accountant-income-ring accountant-progress-ring">
                      <div className="accountant-progress-ring-inner">
                        {dashboardLoading ? "..." : `${Math.round(displaySummary.progress)}%`}
                      </div>
                    </div>
                    <div className="blockText">Income & Exp.</div>
                    <div className="normalText">Percentile Profit</div>
                  </div>

                  <div className="accountant-prevdue-card accountant-card">
                    <p className="accountant-prevdue-amount">
                      {dashboardLoading ? "Loading..." : formatINR(previousYearDue)}
                    </p>
                    <div className="blockText">Previous Year Due</div>
                    <div className="normalText">Pending Dues for Yr. </div>
                  </div>
                </div>

                <div className="accountant-total-stripKEM_KEM_HIGH_SCHOOLKEM_KEM_HIGH_SCHOOLKEM_KEM_HIGH_SCHOOL accountant-card">
                  <div className="accountant-total-strip-right">
                    <span>Total Due</span>
                    <h2>{dashboardLoading ? "Loading..." : formatINR(displaySummary.totalDue)}</h2>
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
        </div>
      </div>

      <div className="accountant-footer-brand">
        <span>Powered By:</span>
        <img src={logoab} alt="Cleezo Class" className="accountant-footer-logo" />
      </div>

      {isPaymentPopupOpen && (
                <div key={popupKey}>

 
          <PayementDemo
            className={popupSelection.className}
            sectionName={popupSelection.sectionName}
            popupOnly
            initialStudentId={popupSelection.studentId}
            initialStudentName={popupSelection.studentName}
            onPopupClose={() => setIsPaymentPopupOpen(false)}
            onPaymentSuccess={async () => {
              await fetchDashboardData();
              await fetchPreviousYearDue();
              await refreshPaymentSummaryMap();
                    setSelectedStudentCardId(null);
            }}
          />
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
                    placeholder="Enter Fee type name"
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
                <option value="All">All</option>
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
                    className="accountant-create-fee-input"
                  />
                </label>
              </div>

              {createFeeTypeError ? <p className="accountant-create-fee-error">{createFeeTypeError}</p> : null}

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
                selectedClassSection={{ class: "", section: "" }}
                onFeeStructurePreviewChange={setAddFeePreview}
                embeddedInPopup
              />
            )}
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

      {isDiscountsPopupOpen && (
        <div
          className="globalpopup-overlay accountant-student-management-popup-overlay"
          onClick={() => setIsDiscountsPopupOpen(false)}
          style={{ zIndex: 3205 }}
        >
          <div
            className="globalpopup-content accountant-student-management-popup"
            onClick={(event) => event.stopPropagation()}
          >
              <div className="globalpopup-header accountant-student-management-popup-header">
              <div>
                <div className="Heading">Discounts</div>
                <div className="normalText">Discount list for the selected class and section</div>
              </div>
              <button
                type="button"
                className="globalpopup-close-btn accountant-student-management-close-btn"
                onClick={() => setIsDiscountsPopupOpen(false)}
                aria-label="Close discounts popup"
              >
                ×
              </button>
            </div>
            <div className="accountant-student-management-popup-body" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "12px 16px 0", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <div className="accountant-outgoing-students-pill">
                  <span>Students</span>
                  <strong>{discountsLoading ? "..." : discountsData.length}</strong>
                </div>
                <div className="accountant-outgoing-students-pill">
                  <span>Total Discount</span>
                  <strong>
                    {discountsLoading
                      ? "..."
                      : formatINR(
                          discountsData.reduce((sum, row) => {
                            const amount = Number(
                              row?.["Total Discount"] ??
                                row?.Total_Discount ??
                                row?.discount ??
                                row?.Discount ??
                                row?.discountAmount ??
                                0
                            );
                            return sum + (Number.isFinite(amount) ? amount : 0);
                          }, 0)
                        )}
                  </strong>
                </div>
              </div>

              <div className="accountant-outgoing-students-table-wrap" style={{ padding: "12px 16px 16px" }}>
                {discountsError ? (
                  <div className="accountant-assistant-empty">{discountsError}</div>
                ) : (
                  <table className="accountant-outgoing-students-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Section</th>
                        <th>Fee Type</th>
                        <th>Reason</th>
                        <th>Total Discount</th>
                        <th>Record Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discountsLoading ? (
                        <tr>
                          <td colSpan={7}>Loading discounts...</td>
                        </tr>
                      ) : discountsData.length ? (
                        discountsData.map((row, index) => (
                          <tr key={row?.id ?? `${row?.StudentName || row?.studentName || "discount"}-${index}`}>
                            <td>{row?.StudentName || row?.studentName || row?.name || "-"}</td>
                            <td>{row?.Class_name || row?.class_name || row?.className || "-"}</td>
                            <td>{row?.Section || row?.section || row?.sectionName || "-"}</td>
                            <td>{row?.["Fee Type"] || row?.feeType || row?.fee_type || row?.type || "-"}</td>
                            <td>{getDiscountReasonText(row)}</td>
                            <td>
                              {formatINR(
                                Number(
                                  row?.["Total Discount"] ??
                                    row?.Total_Discount ??
                                    row?.discount ??
                                    row?.Discount ??
                                    row?.discountAmount ??
                                    0
                                )
                              )}
                            </td>
                            <td>{row?.record_date || row?.created_at || row?.Payment_Date || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7}>No discounts available yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isBillsPopupOpen &&
        createPortal(
          <div
            className="globalpopup-overlay accountant-bills-popup-overlay"
            onClick={() => setIsBillsPopupOpen(false)}
            style={{ zIndex: 3300 }}
          >
            <div
              className="globalpopup-content accountant-bills-popup"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="globalpopup-header accountant-bills-popup-header">
                
                <button
                  type="button"
                  className="globalpopup-close-btn"
                  onClick={() => setIsBillsPopupOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="accountant-bills-popup-body">
                <GenerateBills />
              </div>
            </div>
          </div>,
          document.body
        )}
        {dashboardLoading && <GlobalLoader timeoutSeconds={7}/>}
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

export default AccountantFeesPageNew;
