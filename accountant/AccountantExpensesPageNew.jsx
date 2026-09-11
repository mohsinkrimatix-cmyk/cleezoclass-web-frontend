import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import DiscountsPanel from "./Accounatant_FeesManagement_Discounts.jsx";
import "./AccountantDashboardnew.css";
import "./AccountantFeesPageNew.css";
import "./AccountantExpensesPageNew.css";
import ErrorPopup from "../shared/ErrorPopup";
import CreateMasterExpenseForm from "./ExpensesAccountant";
import IncomeForm5 from "../shared/IncomeformTwo.jsx";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import InstituteBrand from "../shared/InstituteBrand.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import GlobalLoader from "../shared/GlobelLoading.js";
import { FiHelpCircle } from "react-icons/fi";
import HelpCenter from "../shared/HelpCenter.jsx";
import { ArrowLeftCircle, Edit2, Trash, Trash2 } from "lucide-react";

const quickCards = [
  { icon: createFeeIcon, title: "Create Expense", text: "Expense type & category" },
  { icon: addFeesIcon, title: "Add Expense", text: "Expense entry & bills" },
  { icon: assistantIcon, title: "Assistant", text: "Daily activity check" },
];

const predefinedExpenseOptions = {
  "Maintenance Services": [
    "Building Maintenance and Repair", "Furniture Repair", "Electrical & Plumbing Services",
    "Gardening and Landscaping Services", "Fire Safety Maintenance", "Pest Control",
  ],
  "Digital & IT Services": [
    "Internet Services", "IT support & Maintenance", "Digital Learning tools",
    "Website Maintenance", "Smart Class AMC",
  ],
  "Transport-related Services": [
    "Vehicle Maintenance & Repair", "Fuel & Oil Services", "GPS Tracking System Services", "Transport Contract Services",
  ],
  "Administrative Financial Services": [
    "Accounting and Auditing Services", "Legal and Compliance Services", "Document Printing and Photocopying Services",
    "Courier & Postage Services", "Office Supplies Procurement Services",
  ],
  "Health & Safety Services": [
    "Medical Checkup Camps", "First Aid & Emergency Care Supplies", "Health Insurance", "Sanitization and Hygiene Services",
  ],
};

const activityItems = [
  "Expense logged - Office supplies - Voucher 8556",
  "Salary updated - March payroll processed",
];

const assistantRecentActions = [
  { id: 1, text: "Expense bills matched with submitted entries", status: "OK" },
  { id: 2, text: "Salary register reviewed for current cycle", status: "OK" },
  { id: 3, text: "High-value expense requires final verification", status: "PENDING" },
];

const expenseActionPlans = [
  {
    title: "Daily Expense Verification",
    detail: "Verify every submitted expense with bills and payment mode.",
    procedure: [
      "Open day expenses list and sort by date/time.",
      "Match each entry with bill/voucher.",
      "Validate payment mode and vendor/person name.",
      "Fix mismatches before day-close.",
    ],
  },
  {
    title: "High Spend Category Control",
    detail: "Monitor categories where spend is unusually high.",
    procedure: [
      "Review top expense categories from reports.",
      "Compare current week vs previous week.",
      "Flag category increase above 20%.",
      "Escalate repeated spikes to management.",
    ],
  },
  {
    title: "Salary Payout Reconciliation",
    detail: "Ensure salary payouts match ledger and approvals.",
    procedure: [
      "Match salary paid with approved ledger.",
      "Validate deductions and adjustments.",
      "Confirm payment date and method.",
      "Log unresolved mismatches for follow-up.",
    ],
  },
];

const AccountantExpensesPageNew = () => {
  const navigate = useNavigate();
  const userName = useMemo(() => localStorage.getItem("name") || "Nishanth", []);
  const [instituteName, setInstituteName] = useState("Institute");
  const [instituteLogo, setInstituteLogo] = useState("/default-logo.png");
  const [isCreateExpensePopupOpen, setIsCreateExpensePopupOpen] = useState(false);
  const [isAddExpensePopupOpen, setIsAddExpensePopupOpen] = useState(false);
  const [isAddFeesPopupOpen, setIsAddFeesPopupOpen] = useState(false);
  const [isStudentManagementPopupOpen, setIsStudentManagementPopupOpen] = useState(false);
  const [addFeePreview, setAddFeePreview] = useState({ className: "", section: "", rows: [] });
  const [dynamicFeeTypes, setDynamicFeeTypes] = useState([]);
  const [expenseTransactionForm, setExpenseTransactionForm] = useState({
    expenseType: "", expenseName: "", personName: "", mobileNumber: "", description: "", price: "",
  });
  const [expensePaymentForm, setExpensePaymentForm] = useState({
    paymentMode: "BANK",
    otherPaymentMode: "",
    totalAmount: "",
    paidAmount: "",
    balance: "",
  });
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [addExpenseStep, setAddExpenseStep] = useState(1);
  const [dynamicExpenseOptions, setDynamicExpenseOptions] = useState({});
  const [expenseRows, setExpenseRows] = useState([]);
  const [expenseRowsLoading, setExpenseRowsLoading] = useState(false);
  const [popup, setPopup] = useState({ message: "", type: "" });
  const [expenseSubmitLoading, setExpenseSubmitLoading] = useState(false);
  const [activeRightPanel, setActiveRightPanel] = useState("master");
  const [assistantSalaryRows, setAssistantSalaryRows] = useState([]);
  const [assistantLoadingLists, setAssistantLoadingLists] = useState(false);
  const [showAllAssistantExpenses, setShowAllAssistantExpenses] = useState(false);
  const [showAllAssistantSalaries, setShowAllAssistantSalaries] = useState(false);
  
  // 🆕 NEW: State for Category and Expense Name Management
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showNewExpenseInput, setShowNewExpenseInput] = useState(false);
  const [newExpense, setNewExpense] = useState("");

  const [ledgerFromDate, setLedgerFromDate] = useState("");
  const [ledgerToDate, setLedgerToDate] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");

  const [selectedCategoryForPopup, setSelectedCategoryForPopup] = useState(null);
  const [popupFromDate, setPopupFromDate] = useState("");
  const [popupToDate, setPopupToDate] = useState("");
  const [popupSearch, setPopupSearch] = useState("");

  const [openHelpSection, setOpenHelpSection] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const userRole = localStorage.getItem("userRole");
  const [expenseBillFile, setExpenseBillFile] = useState(null);
  const [addFeesPanelTab, setAddFeesPanelTab] = useState("fees");
  const [addFeeFormClass, setAddFeeFormClass] = useState("");
  const [addFeeFormSection, setAddFeeFormSection] = useState("");
  
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const isLedgerExpense = !!selectedCategoryForPopup;
  
  const studentManagementPopupUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${import.meta.env.BASE_URL}CentralizationDashboard`;
  }, []);

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
          schoolCode, fallback: "Institute",
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
          schoolCode, fallback: "Institute",
        });
        setInstituteLogo("/default-logo.png");
        setInstituteName(fallbackInstituteName);
        localStorage.setItem("schoolName", fallbackInstituteName);
        localStorage.setItem("instituteName", fallbackInstituteName);
      });
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  };

  useEffect(() => {
    const fetchDynamicOptions = async () => {
      try {
        const schoolCode = localStorage.getItem("schoolCode");
        if (!schoolCode) return;
        const response = await fetch(`https://cleezoclass.com:5000/api/admin/get-expense-master?schoolCode=${schoolCode}`);
        const data = await response.json();
        setDynamicExpenseOptions(data && typeof data === "object" ? data : {});
      } catch (error) {
        console.error("Failed to load expense dropdown options:", error);
        setDynamicExpenseOptions({});
      }
    };
    fetchDynamicOptions();
  }, []);

  const combinedExpenseOptions = useMemo(
    () => ({ ...predefinedExpenseOptions, ...dynamicExpenseOptions }),
    [dynamicExpenseOptions]
  );

  const masterExpenseItems = useMemo(
    () =>
      Object.entries(combinedExpenseOptions).flatMap(([category, expenseNames]) =>
        (expenseNames || []).map((expenseName) => ({
          id: `${category}-${expenseName}`, category, expenseName,
        }))
      ),
    [combinedExpenseOptions]
  );

  const fetchCombinedExpenseRows = async (schoolCode) => {
    const [expenseResponse, billsResponse] = await Promise.all([
      axios.get(`https://cleezoclass.com:5000/totalexpensesData?schoolCode=${schoolCode}`),
      fetch("https://cleezoclass.com:5000/getAllBills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolCode }),
      }),
    ]);

    const expenseRows = Array.isArray(expenseResponse.data) ? expenseResponse.data : expenseResponse.data?.data || [];
    const rawBills = billsResponse.ok ? await billsResponse.json() : [];
    const billRows = (Array.isArray(rawBills) ? rawBills : []).map((bill, index) => ({
      id: bill.id || `uploaded-bill-${index}`,
      expense_name: bill.bill_type || "Uploaded Bill",
      expense_type: bill.bill_type || "Uploaded Bill",
      description: bill.description || "Uploaded bill",
      payment_mode: "N/A", paymentMode: "N/A",
      price: Number(bill.amount) || 0, amount: Number(bill.amount) || 0,
      paid_amount: Number(bill.amount) || 0, paidAmount: Number(bill.amount) || 0,
      totalAmount: Number(bill.amount) || 0, balance: 0,
      expense_date: bill.date || "", date: bill.date || "",
      imageUrl: bill.imageUrl || "", isUploadedBill: true,
    }));

    return [...expenseRows, ...billRows].sort(
      (a, b) =>
        new Date(b.payment_date || b.expense_date || b.date || 0) -
        new Date(a.payment_date || a.expense_date || a.date || 0)
    );
  };

  const fetchExpenseRows = async () => {
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) return;
      setExpenseRowsLoading(true);
      const rows = await fetchCombinedExpenseRows(schoolCode);
      setExpenseRows(rows);
    } catch (error) {
      console.error("Failed to load expense list:", error);
      setExpenseRows([]);
    } finally {
      setExpenseRowsLoading(false);
    }
  };

  useEffect(() => { fetchExpenseRows(); }, []);

  useEffect(() => {
    const fetchAssistantLists = async () => {
      try {
        const schoolCode = localStorage.getItem("schoolCode");
        if (!schoolCode) return;
        setAssistantLoadingLists(true);
        const [nextExpenseRows, salaryResponse] = await Promise.all([
          fetchCombinedExpenseRows(schoolCode),
          axios.get("https://cleezoclass.com:5000/api/salarymanagement", { params: { schoolCode } }),
        ]);
        const nextSalaryRows = Array.isArray(salaryResponse.data) ? salaryResponse.data : salaryResponse.data?.data || [];
        setExpenseRows(nextExpenseRows);
        setAssistantSalaryRows(nextSalaryRows);
      } catch (error) {
        console.error("Failed to fetch assistant expense/salary lists:", error);
        setAssistantSalaryRows([]);
      } finally {
        setAssistantLoadingLists(false);
      }
    };
    fetchAssistantLists();
  }, []);

  useEffect(() => {
    const total = Number(expensePaymentForm.totalAmount) || 0;
    const paid = Number(expensePaymentForm.paidAmount) || 0;
    const balance = Math.max(total - paid, 0);
    setExpensePaymentForm((prev) => {
      const nextBalance = balance ? balance.toFixed(2) : "0.00";
      return prev.balance === nextBalance ? prev : { ...prev, balance: nextBalance };
    });
  }, [expensePaymentForm.totalAmount, expensePaymentForm.paidAmount]);

  const resetAddExpenseFlow = () => {
    setExpenseTransactionForm({ expenseType: "", expenseName: "", personName: "", mobileNumber: "", description: "", price: "" });
    setExpensePaymentForm({ paymentMode: "BANK", totalAmount: "", paidAmount: "", balance: "" });
    setAddExpenseStep(1);
    setEditingExpenseId(null);
  };

  const openAddExpenseWithCategory = (category = "") => {
    setExpenseTransactionForm({
      expenseType: category,
      expenseName: "",
      personName: "",
      mobileNumber: "",
      description: "",
      price: "",
    });
    setExpensePaymentForm({ paymentMode: "BANK", totalAmount: "", paidAmount: "", balance: "" });
    setAddExpenseStep(1);
    setEditingExpenseId(null);
    setIsAddExpensePopupOpen(true);
  };

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

  const openImageModal = (imageUrl) => {
    if (!imageUrl) return;
    window.open(imageUrl, "_blank");
  };

  const formatDisplayDate = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) { const [year, month, day] = value.split("-"); return `${month}/${day}/${year}`; }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) { const [day, month, year] = value.split("/"); return `${month}/${day}/${year}`; }
    return value;
  };

  const isNewExpense = (dateString) => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7; 
    } catch (e) {
      return false;
    }
  };

  const assistantVisibleExpenses = showAllAssistantExpenses ? expenseRows : expenseRows.slice(0, 4);
  const assistantVisibleSalaries = showAllAssistantSalaries ? assistantSalaryRows : assistantSalaryRows.slice(0, 4);

  const totalExpenseAmount = useMemo(
    () => expenseRows.reduce((sum, item) => sum + Number(item.price || item.amount || item.paid_amount || 0), 0),
    [expenseRows]
  );

  const totalSalaryAmount = useMemo(
    () => assistantSalaryRows.reduce((sum, row) => sum + Number(row.final_salary || row.salary_amount || row.base_salary || 0), 0),
    [assistantSalaryRows]
  );

  const stationaryTotal = useMemo(
    () => expenseRows.reduce((sum, item) => {
      const label = `${item.expense_name || ""} ${item.expense_type || ""}`.toLowerCase();
      return label.includes("stationary") ? sum + Number(item.price || item.amount || item.paid_amount || 0) : sum;
    }, 0),
    [expenseRows]
  );

  const utilitiesTotal = useMemo(
    () => expenseRows.reduce((sum, item) => {
      const label = `${item.expense_name || ""} ${item.expense_type || ""}`.toLowerCase();
      return label.includes("utility") || label.includes("electric") || label.includes("water") ? sum + Number(item.price || item.amount || item.paid_amount || 0) : sum;
    }, 0),
    [expenseRows]
  );

  const transportTotal = useMemo(
    () => expenseRows.reduce((sum, item) => {
      const label = `${item.expense_name || ""} ${item.expense_type || ""}`.toLowerCase();
      return label.includes("transport") || label.includes("fuel") || label.includes("bus") ? sum + Number(item.price || item.amount || item.paid_amount || 0) : sum;
    }, 0),
    [expenseRows]
  );

  const filteredLedgerRows = useMemo(() => {
    const parseRowDate = (item) => {
      const raw = item.payment_date || item.expense_date || item.date || "";
      if (!raw) return "";
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) { const [day, month, year] = raw.split("/"); return `${year}-${month}-${day}`; }
      return "";
    };
    return expenseRows.filter((item) => {
      const rowDate = parseRowDate(item);
      const searchText = `${item.expense_name || ""} ${item.expense_type || ""} ${item.description || ""} ${item.paymentMode || item.payment_mode || ""}`.toLowerCase();
      if (expenseSearch && !searchText.includes(expenseSearch.toLowerCase())) return false;
      if (ledgerFromDate && (!rowDate || rowDate < ledgerFromDate)) return false;
      if (ledgerToDate && (!rowDate || rowDate > ledgerToDate)) return false;
      return true;
    });
  }, [expenseRows, expenseSearch, ledgerFromDate, ledgerToDate]);

  const filteredLedgerTotalAmount = useMemo(() => filteredLedgerRows.reduce((sum, item) => sum + Number(item.totalAmount || item.amount || item.price || 0), 0), [filteredLedgerRows]);
  const filteredLedgerPaidAmount = useMemo(() => filteredLedgerRows.reduce((sum, item) => sum + Number(item.paidAmount || item.paid_amount || item.price || 0), 0), [filteredLedgerRows]);
  const filteredLedgerBalance = useMemo(() => filteredLedgerRows.reduce((sum, item) => sum + Number(item.balance || (Number(item.totalAmount || item.amount || item.price || 0) - Number(item.paidAmount || item.paid_amount || item.price || 0))), 0), [filteredLedgerRows]);

  const expenseDuePercent = useMemo(() => {
    if (filteredLedgerTotalAmount <= 0) return 0;
    return (filteredLedgerBalance / filteredLedgerTotalAmount) * 100;
  }, [filteredLedgerBalance, filteredLedgerTotalAmount]);

  const expenseDuePercentLabel = `${Math.round(expenseDuePercent)}%`;
  const expenseDueProgressAngle = `${Math.max(0, Math.min(expenseDuePercent, 100)) * 3.6}deg`;

  const expenseSummaryCards = useMemo(
    () => [
      { amount: formatINR(filteredLedgerPaidAmount), label: "Total Paid" },
      { amount: formatINR(filteredLedgerTotalAmount), label: "Total Amount" },
      { amount: formatINR(filteredLedgerBalance), label: "Balance" },
    ],
    [filteredLedgerBalance, filteredLedgerPaidAmount, filteredLedgerTotalAmount]
  );

  const categoryTabs = useMemo(() => {
    const categories = new Set(Object.keys(combinedExpenseOptions));
    expenseRows.forEach(row => {
      if (row.expense_type) categories.add(row.expense_type);
    });
    return Array.from(categories).filter(Boolean);
  }, [combinedExpenseOptions, expenseRows]);

  const getCategoryTotal = (category) => {
    return expenseRows
      .filter(row => row.expense_type === category)
      .reduce((sum, item) => sum + Number(item.totalAmount || item.amount || item.price || 0), 0);
  };

  const filteredPopupRows = useMemo(() => {
    if (!selectedCategoryForPopup) return [];
    return expenseRows.filter(item => {
      const expenseType = item.expense_type || item.billType || item.bill_type;
      if (expenseType !== selectedCategoryForPopup) return false;
      
      const parseRowDate = (item) => {
        const raw = item.payment_date || item.expense_date || item.date || "";
        if (!raw) return "";
        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) { const [day, month, year] = raw.split("/"); return `${year}-${month}-${day}`; }
        return "";
      };
      const rowDate = parseRowDate(item);
      if (popupFromDate && (!rowDate || rowDate < popupFromDate)) return false;
      if (popupToDate && (!rowDate || rowDate > popupToDate)) return false;

      const searchText = `${item.expense_name || ""} ${item.description || ""} ${item.paymentMode || item.payment_mode || ""}`.toLowerCase();
      if (popupSearch && !searchText.includes(popupSearch.toLowerCase())) return false;

      return true;
    });
  }, [expenseRows, selectedCategoryForPopup, popupFromDate, popupToDate, popupSearch]);

  const popupTotalAmount = useMemo(() => filteredPopupRows.reduce((sum, item) => sum + Number(item.totalAmount || item.amount || item.price || 0), 0), [filteredPopupRows]);
  const popupPaidAmount = useMemo(() => filteredPopupRows.reduce((sum, item) => sum + Number(item.paidAmount || item.paid_amount || item.price || 0), 0), [filteredPopupRows]);
  const popupBalance = useMemo(() => filteredPopupRows.reduce((sum, item) => sum + Number(item.balance || (Number(item.totalAmount || item.amount || item.price || 0) - Number(item.paidAmount || item.paid_amount || item.price || 0))), 0), [filteredPopupRows]);

  const handleEditExpense = (item) => {
    setEditingExpenseId(item.id);
    setExpenseTransactionForm({
      expenseType: item.expense_type || item.expenseType || "",
      expenseName: item.expense_name || item.expenseName || "",
      personName: item.person_name || item.personName || "",
      mobileNumber: item.mobile_number || item.mobileNumber || "",
      description: item.description || "",
      price: item.price || item.amount || item.totalAmount || "",
    });

    const total = Number(item.totalAmount || item.amount || item.price || 0);
    const paid = Number(item.paidAmount || item.paid_amount || 0);
    const balance = Math.max(total - paid, 0);

    setExpensePaymentForm({
      paymentMode: item.paymentMode || item.payment_mode || "BANK",
      totalAmount: total > 0 ? total.toString() : "",
      paidAmount: paid > 0 ? paid.toString() : "",
      balance: balance.toFixed(2),
    });

    setAddExpenseStep(2);
    setIsAddExpensePopupOpen(true);
  };

  const handleDeleteExpense = (item) => {
    setExpenseToDelete(item);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      await axios.delete(`https://cleezoclass.com:5000/Accountntdata/${expenseToDelete.id}?schoolCode=${schoolCode}`);
      setPopup({ message: "Expense deleted successfully!", type: "success" });
      fetchExpenseRows();
    } catch (error) {
      console.error("Error deleting expense:", error);
      setPopup({ message: "Failed to delete expense. Please try again.", type: "error" });
    } finally {
      setExpenseToDelete(null);
    }
  };

  const cancelDeleteExpense = () => {
    setExpenseToDelete(null);
  };


const handleSaveCategory = async () => {
  const schoolCode = localStorage.getItem("schoolCode");

  if (!schoolCode) {
    setPopup({ message: "School code not found!", type: "error" });
    return;
  }

  if (!newCategory.trim()) {
    setPopup({ message: "Please enter Category Name.", type: "error" });
    return;
  }

  setExpenseSubmitLoading(true);

  try {
    await axios.post(
      "https://cleezoclass.com:5000/api/admin/add-expense",
      {
        schoolCode,
        categoryName: newCategory.trim(),
        categoryDescription: "",
        expenseName: "",
        expenseDescription: "",
      }
    );

    const response = await fetch(
      `https://cleezoclass.com:5000/api/admin/get-expense-master?schoolCode=${schoolCode}`
    );

    const data = await response.json();

    setDynamicExpenseOptions(data || {});

    setExpenseTransactionForm((prev) => ({
      ...prev,
      expenseType: newCategory.trim(),
      expenseName: "",
    }));

    setPopup({
      message: "Category added successfully!",
      type: "success",
    });

    setNewCategory("");
    setShowNewCategoryInput(false);

    setTimeout(() => {
      setShowNewExpenseInput(true);
    }, 300);

  } catch (error) {
    console.error(error);

    setPopup({
      message:
        error?.response?.data?.message ||
        "Failed to save category!",
      type: "error",
    });
  } finally {
    setExpenseSubmitLoading(false);
  }
};

  // 🔥 FIXED: Properly fetch schoolCode, use full API URL, and update dynamicExpenseOptions
const handleSaveExpense = async () => {
  const schoolCode = localStorage.getItem("schoolCode");

  if (!schoolCode) {
    setPopup({ message: "School code not found!", type: "error" });
    return;
  }

  if (!expenseTransactionForm.expenseType) {
    setPopup({
      message: "Please select Expense Category.",
      type: "error",
    });
    return;
  }

  if (!newExpense.trim()) {
    setPopup({
      message: "Please enter Expense Name.",
      type: "error",
    });
    return;
  }

  setExpenseSubmitLoading(true);

  try {
    await axios.post(
      "https://cleezoclass.com:5000/api/admin/add-expense",
      {
        schoolCode,
        categoryName: expenseTransactionForm.expenseType,
        categoryDescription: "",
        expenseName: "expense",
        expenseDescription: "",
      }
    );

    const response = await fetch(
      `https://cleezoclass.com:5000/api/admin/get-expense-master?schoolCode=${schoolCode}`
    );

    const data = await response.json();

    setDynamicExpenseOptions(data || {});

    setExpenseTransactionForm((prev) => ({
      ...prev,
      expenseName: "expenseName"
    }));

    setPopup({
      message: "Expense Name added successfully!",
      type: "success",
    });

    setNewExpense("");
    setShowNewExpenseInput(false);

  } catch (error) {
    console.error(error);

    setPopup({
      message:
        error?.response?.data?.message ||
        "Failed to save expense name!",
      type: "error",
    });
  } finally {
    setExpenseSubmitLoading(false);
  }
};

  const handleSubmitExpense = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) { setPopup({ message: "School code not found!", type: "error" }); return; }
    if (!expenseTransactionForm.expenseType || !expenseTransactionForm.expenseName) { setPopup({ message: "Please select Expense Type and Expense Name.", type: "error" }); return; }
    if (!expensePaymentForm.totalAmount || !expensePaymentForm.paidAmount) { setPopup({ message: "Please enter Total Amount and Paid Amount.", type: "error" }); return; }

    setExpenseSubmitLoading(true);
    try {
      const payload = {
        expenseName: expenseTransactionForm.expenseName,
        expenseType: expenseTransactionForm.expenseType,
        description: expenseTransactionForm.description,
        paymentMode: expensePaymentForm.paymentMode === "OTHERS" ? expensePaymentForm.otherPaymentMode : expensePaymentForm.paymentMode,
        totalAmount: parseFloat(expensePaymentForm.totalAmount) || 0,
        paidAmount: parseFloat(expensePaymentForm.paidAmount) || 0,
        balance: parseFloat(expensePaymentForm.balance) || 0,
        personName: expenseTransactionForm.personName,
        mobileNumber: expenseTransactionForm.mobileNumber,
        price: parseFloat(expenseTransactionForm.price) || 0,
        schoolCode,
      };

      if (editingExpenseId) {
        payload.id = editingExpenseId;
        await axios.put("https://cleezoclass.com:5000/Accountntdata", payload);
        setPopup({ message: "Expense updated successfully!", type: "success" });
      } else {
        await axios.post("https://cleezoclass.com:5000/Accountntdata", payload);
        setPopup({ message: "Expense created successfully!", type: "success" });
      }
      
      const nextExpenseRows = await fetchCombinedExpenseRows(schoolCode);
      setExpenseRows(nextExpenseRows);
      setAssistantSalaryRows(nextExpenseRows.filter(row => row.final_salary || row.salary_amount || row.base_salary));
      setIsAddExpensePopupOpen(false);
      resetAddExpenseFlow();
    } catch (error) {
      console.error("Error submitting expense:", error);
      setPopup({ message: error?.response?.data?.message || "Failed to save expense!", type: "error" });
    } finally {
      setExpenseSubmitLoading(false);
    }
  };

  const isFormValid = expenseTransactionForm.expenseType && expenseTransactionForm.expenseName && expenseTransactionForm.description;

  const handleDownloadPopupExcel = () => {
    if (!filteredPopupRows.length) { alert("No data available to download for this category."); return; }
    const data = filteredPopupRows.map((item, index) => {
      const totalAmount = Number(item.totalAmount || item.amount || item.price || 0);
      const paidAmount = Number(item.paidAmount || item.paid_amount || item.price || 0);
      const balanceAmount = Number(item.balance || totalAmount - paidAmount);
      const displayDate = item.payment_date || item.expense_date || item.date || "-";
      return {
        "Bill No.": index + 1, "Date": formatDisplayDate(displayDate), "Expense Name": item.expense_name || "-",
        "Description": item.description || "-", "Mode": item.paymentMode || item.payment_mode || "-",
        "Total Amt": totalAmount, "Paid Amt": paidAmount, "Balance": balanceAmount,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedCategoryForPopup);
    XLSX.writeFile(wb, `${selectedCategoryForPopup}_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDownloadPopupPDF = () => {
    if (!filteredPopupRows.length) { 
      alert("No data available to download for this category."); 
      return; 
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${selectedCategoryForPopup} Ledger`, margin, 15);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139);
    
    let startY = 22;
    if (popupFromDate || popupToDate) {
      const dateRange = `From: ${popupFromDate || "N/A"}  |  To: ${popupToDate || "N/A"}`;
      doc.text(dateRange, margin, startY);
      startY = 28;
    }

    const head = [["Bill No.", "Date", "Expense Name", "Description", "Mode", "Total Amt", "Paid Amt", "Balance"]];
    const body = filteredPopupRows.map((item, index) => {
      const totalAmount = Number(item.totalAmount || item.amount || item.price || 0);
      const paidAmount = Number(item.paidAmount || item.paid_amount || item.price || 0);
      const balanceAmount = Number(item.balance || totalAmount - paidAmount);
      const displayDate = item.payment_date || item.expense_date || item.date || "-";
      
      return [
        index + 1, 
        formatDisplayDate(displayDate), 
        item.expense_name || "-", 
        item.description || "-",
        item.paymentMode || item.payment_mode || "-", 
        totalAmount.toLocaleString('en-IN'),
        paidAmount.toLocaleString('en-IN'), 
        balanceAmount.toLocaleString('en-IN'),
      ];
    });

    autoTable(doc, {
      head, body, startY, margin: { left: margin, right: margin }, tableWidth: pageWidth - (margin * 2),
      styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.1, halign: 'right' },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, 1: { halign: 'center', cellWidth: 20 },
        2: { cellWidth: 35, halign: 'left' }, 3: { cellWidth: 35, halign: 'left' },
        4: { halign: 'center', cellWidth: 15 }, 5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 20 }, 7: { halign: 'right', cellWidth: 20 },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text(`Page ${data.pageNumber}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      },
    });

    let finalY = doc.lastAutoTable.finalY || startY;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (finalY + 30 > pageHeight - margin) {
      doc.addPage(); finalY = margin + 10; 
    }

    doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.5);
    doc.line(margin, finalY + 5, margin + (pageWidth - (margin * 2)), finalY + 5);

    doc.setFontSize(10); doc.setFont(undefined, 'bold');
    doc.text(`Total Records: ${filteredPopupRows.length}`, 14, finalY + 10);
    doc.text(`Total Amt: ${formatINR(popupTotalAmount)}`, 14, finalY + 16);
    doc.text(`Paid Amt: ${formatINR(popupPaidAmount)}`, 14, finalY + 22);
    doc.text(`Balance: ${formatINR(popupBalance)}`, 14, finalY + 28);
    doc.save(`${selectedCategoryForPopup}_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const displayToast = (message, type) => {
    setPopup({ show: true, message, type });
  };

  return (
    <div className="accountant-dashboard-page accountant-fees-page accountant-expenses-page">
      <div className="accountant-dashboard-shell">
        <div className="accountant-sidebar-strip">
          <div className="accountant-sidebar-item" onClick={() => navigate("/AccountantDashboard")} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate("/AccountantDashboard"); }}>
            <div className="accountant-sidebar-item-icon"><img src={dashboardIcon} alt="Home" /></div><span>Dashboard</span>
          </div>
          <div className="accountant-sidebar-item" onClick={() => navigate("/AccountantFees")} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate("/AccountantFees"); }}>
            <div className="accountant-sidebar-item-icon"><img src={collectFeeIcon} alt="" /></div><span>Fees</span>
          </div>
          <div className="accountant-sidebar-item" onClick={() => setIsAddFeesPopupOpen(true)}>
            <div className="accountant-sidebar-item-icon"><img src={addFeeIcon} alt="" /></div><span>Add Fees</span>
          </div>
          <div className={`accountant-sidebar-item ${isStudentManagementPopupOpen ? "accountant-sidebar-item-active" : ""}`.trim()} onClick={() => setIsStudentManagementPopupOpen(true)}>
            <div className="accountant-sidebar-item-icon"><img src={addStudentIcon} alt="" /></div><span>Add Student</span>
          </div>
          <div className="accountant-sidebar-item accountant-sidebar-item-active">
            <div className="accountant-sidebar-item-icon"><img src={expenseIcon} alt="" /></div><span>Expense</span>
          </div>
          <div className="accountant-sidebar-item" onClick={() => navigate("/AccountantReportsPage")} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") navigate("/AccountantReportsPage"); }}>
            <div className="accountant-sidebar-item-icon"><img src={reportIcon} alt="" /></div><span>Reports</span>
          </div>
        </div>

        <div className="accountant-main-area">
          <div className="accountant-topbar">
            <nav className="accountant-topbar-left">
              <button type="button" className="accountant-topbar-tab accountant-topbar-tab-button" onClick={() => navigate("/AccountantDashboard")}>Dashboard</button>
              <button type="button" className="accountant-topbar-tab accountant-topbar-tab-button" onClick={() => navigate("/AccountantFees")}>Fees</button>
              <button type="button" className="accountant-topbar-tab accountant-topbar-tab-button accountant-topbar-tab-active" onClick={() => navigate("/AccountantExpenses")}>Expense</button>
              <button type="button" className="accountant-topbar-tab accountant-topbar-tab-button" onClick={() => navigate("/AccountantReportsPage")}>Reports</button>
            </nav>
            <div className="accountant-topbar-center">
              <InstituteBrand logoSrc={instituteLogo || logoab} logoAlt={instituteName || "Institute"} instituteName={instituteName} />
            </div>
            <div className="accountant-topbar-right">
              <div className="help-btn-wrapper">
                <button title="Help" className="accountant-help-icon-btn" onClick={() => setIsHelpOpen(true)}>
                  <FiHelpCircle style={{ color: "#e9818c", fontSize: "34px" }} />
                </button>
              </div>
              <EditableProfileMenu />
            </div>
          </div>

          <div className="accountant-grid accountant-fees-grid accountant-expenses-grid">
            <div className="accountant-row accountant-fees-row-top">
              <div className="accountant-welcome-block">
                <h2>Hi, {userName}!</h2>
                <p>Track expense status,</p>
                <p>review bills and salary,</p>
                <p>submit day wise records</p>
              </div>

              <div className="accountant-fees-summary-card accountant-card">
                <div className="accountant-fees-summary-left">
                  <div className="accountant-progress-panel">
                    <div className="accountant-progress-ring" style={{ "--admission-progress": expenseDueProgressAngle }}>
                      <div className="accountant-progress-ring-inner">{expenseDuePercentLabel}</div>
                    </div>
                  </div>
                  <div className="accountant-fees-summary-stats">
                    <p><span className="normalText accountant-fees-summary-label">Total Bus Expenses:</span><strong className="accountant-fees-summary-value">{formatINR(transportTotal)}</strong></p>
                    <p><span className="normalText accountant-fees-summary-label">Total Salaries:</span><strong className="accountant-fees-summary-value">{formatINR(totalSalaryAmount)}</strong></p>
                    <p><span className="normalText accountant-fees-summary-label">Total Store Expenses:</span><strong className="accountant-fees-summary-value">{formatINR(stationaryTotal)}</strong></p>
                    <p><span className="normalText accountant-fees-summary-label">Total Utilities:</span><strong className="accountant-fees-summary-value">{formatINR(utilitiesTotal)}</strong></p>
                  </div>
                </div>
                <div className="accountant-fees-summary-right">
                  <button type="button" className="collect-filter accountant-fees-summary-filter"><span>As on today</span></button>
                  <div className="accountant-fees-summary-total">
                    <span>Total Expenses</span>
                    <strong>{formatINR(totalExpenseAmount)}</strong>
                  </div>
                </div>
              </div>

              <div className="accountant-mini-cards">
                {quickCards.map((card) => (
                  <div key={card.title} className="accountant-quick-card accountant-card" role="button" tabIndex={0}
                    onClick={() => {
                      if (card.title === "Create Expense") { setActiveRightPanel("master"); setIsCreateExpensePopupOpen(true); }
                      else if (card.title === "Add Expense") { setActiveRightPanel("transactions"); resetAddExpenseFlow(); setIsAddExpensePopupOpen(true); }
                      else if (card.title === "Assistant") { setShowAllAssistantExpenses(false); setShowAllAssistantSalaries(false); setActiveRightPanel("assistant"); }
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      if (card.title === "Create Expense") { setActiveRightPanel("master"); setIsCreateExpensePopupOpen(true); }
                      else if (card.title === "Add Expense") { setActiveRightPanel("transactions"); resetAddExpenseFlow(); setIsAddExpensePopupOpen(true); }
                      else if (card.title === "Assistant") { setShowAllAssistantExpenses(false); setShowAllAssistantSalaries(false); setActiveRightPanel("assistant"); }
                    }}
                  >
                    <div><img src={card.icon} alt="" /></div>
                    <h4>{card.title}</h4>
                    <p>{card.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="accountant-fees-main-section">
              <div className="accountant-fees-main-left">
                <div className="accountant-fees-collection-card accountant-card accountant-expenses-inline-card expense-container">
                  {!selectedCategoryForPopup ? (
                    <>
                      <div className="accountant-fees-collection-header expense-header">
                        <div className="accountant-fees-strength expense-strength">
                          <h3>Expense Directory-</h3>
                          <strong>{expenseRows.length}</strong>
                          <span>Total Records</span>
                        </div>
                        <div className="accountant-fees-collection-tools expense-tools">
                          <select
                            className="expense-category-select"
                            value=""
                            onChange={(e) => {
                              const selectedCat = e.target.value;
                              if (selectedCat) {
                                setSelectedCategoryForPopup(selectedCat);
                                setPopupFromDate("");
                                setPopupToDate("");
                                setPopupSearch("");
                              }
                            }}
                          >
                            <option value="">Select Expense Type</option>
                            {categoryTabs.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <button 
                            type="button" 
                            className="expense-reset-btn"
                            onClick={() => {
                              resetAddExpenseFlow();
                              setIsAddExpensePopupOpen(true);
                            }}
                          >
                            + Add Expense
                          </button>
                        </div>
                      </div>

                      <div className="accountant-expense-categories-container expense-categories-container">
                        <div className="expense-categories-grid">
                          {categoryTabs.map((cat) => {
                            const total = getCategoryTotal(cat);
                            const count = expenseRows.filter(r => r.expense_type === cat).length;
                            const hasNewEntries = expenseRows
                              .filter(r => r.expense_type === cat)
                              .some(r => isNewExpense(r.payment_date || r.expense_date || r.date));

                            return (
                              <div 
                                key={cat} 
                                className="accountant-expense-category-card expense-category-card"
                                onClick={() => {
                                  setSelectedCategoryForPopup(cat);
                                  setPopupFromDate("");
                                  setPopupToDate("");
                                  setPopupSearch("");
                                }}
                              >
                                <div className="expense-category-title">
                                  {cat}
                                  {hasNewEntries && (
                                    <span className="expense-new-badge">NEW</span>
                                  )}
                                </div>
                                <div className="expense-category-total">
                                  {formatINR(total)}
                                </div>
                                <div className="expense-category-count">
                                  {count} {count === 1 ? 'entry' : 'entries'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="accountant-fees-collection-header expense-ledger-header">
                        <div className="expense-back-wrapper">
                          <button 
                            type="button" 
                            className="expense-back-btn"
                            onClick={() => setSelectedCategoryForPopup(null)} 
                          >
                            <ArrowLeftCircle />
                          </button>
                          <div className="expense-title-wrapper">
                            <h3>{selectedCategoryForPopup} Ledger</h3>
                            <p>Detailed expense records and transactions</p>
                          </div>
                        </div>

                        <select
                          className="expense-category-select expense-quick-switch"
                          value={selectedCategoryForPopup || ""}
                          onChange={(e) => {
                            const selectedCat = e.target.value;
                            if (selectedCat) {
                              setSelectedCategoryForPopup(selectedCat);
                              setPopupFromDate("");
                              setPopupToDate("");
                              setPopupSearch("");
                            }
                          }}
                        >
                          <option value="">-- Switch to Another Category --</option>
                          {categoryTabs.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="expense-filter-bar">
                        <label className="expense-filter-label">
                          <span>From:</span>
                          <input 
                            type="date" 
                            className="expense-filter-input"
                            value={popupFromDate} 
                            onChange={(e) => setPopupFromDate(e.target.value)} 
                          />
                        </label>
                        <label className="expense-filter-label">
                          <span>To:</span>
                          <input 
                            type="date" 
                            className="expense-filter-input"
                            value={popupToDate} 
                            onChange={(e) => setPopupToDate(e.target.value)} 
                          />
                        </label>
                        <input 
                          type="text" 
                          className="expense-filter-input expense-search-input"
                          placeholder="Search expenses..." 
                          value={popupSearch} 
                          onChange={(e) => setPopupSearch(e.target.value)} 
                        />
                        
                        <button 
                          type="button" 
                          className="expense-reset-btn"
                          onClick={() => {
                            resetAddExpenseFlow();
                            setExpenseTransactionForm(prev => ({
                              ...prev,
                              expenseType: selectedCategoryForPopup
                            }));
                            setIsAddExpensePopupOpen(true);
                          }}
                        >
                          + Add Expense
                        </button>

                        <button 
                          type="button" 
                          className="expense-reset-btn"
                          onClick={() => { setPopupFromDate(""); setPopupToDate(""); setPopupSearch(""); }} 
                        >
                          Reset
                        </button>
                        <div className="expense-download-select">
                          <select
                            className="expense-download-select"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value === "excel") handleDownloadPopupExcel();
                              if (e.target.value === "pdf") handleDownloadPopupPDF();
                              e.target.value = "";
                            }}
                          >
                            <option value="" disabled>Download</option>
                            <option value="excel">📊 Excel (.xlsx)</option>
                            <option value="pdf">📄 PDF</option>
                          </select>
                        </div>
                      </div>

                      <div className="expense-table-wrapper">
                        <table className="accountant-expense-ledger-table expense-ledger-table">
                          <thead className="expense-table-head">
                            <tr>
                              <th className="expense-table-th text-left">Bill No.</th>
                              <th className="expense-table-th text-left">Date</th>
                              <th className="expense-table-th text-left">Expense Name</th>
                              <th className="expense-table-th text-left">Description</th>
                              <th className="expense-table-th text-left">PAYMENT Mode</th>
                              <th className="expense-table-th text-right">Total Amt</th>
                              <th className="expense-table-th text-right">Paid Amt</th>
                              <th className="expense-table-th text-right">Balance</th>
                              <th className="expense-table-th text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenseRowsLoading ? (
                              <tr>
                                <td colSpan="9" className="expense-table-td expense-empty-row">Loading expenses...</td>
                              </tr>
                            ) : filteredPopupRows.length ? (
                              filteredPopupRows.map((item, index) => {
                                const totalAmount = Number(item.totalAmount || item.amount || item.price || 0);
                                const paidAmount = Number(item.paidAmount || item.paid_amount || item.price || 0);
                                const balanceAmount = Number(item.balance || totalAmount - paidAmount);
                                const displayDate = item.payment_date || item.expense_date || item.date || "-";
                                const isNew = isNewExpense(displayDate);

                                return (
                                  <tr key={`popup-${index}`} className="expense-table-row">
                                    <td className="expense-table-td">{index + 1}</td>
                                    <td className="expense-table-td expense-date-cell">
                                      {formatDisplayDate(displayDate)}
                                      {isNew && <span className="expense-new-badge expense-table-badge">NEW</span>}
                                    </td>
                                    <td className="expense-table-td">{item.expense_name || "-"}</td>
                                    <td className="expense-table-td">{item.description || "-"}</td>
                                    <td className="expense-table-td">{item.paymentMode || item.payment_mode || "-"}</td>
                                    <td className="expense-table-td text-right">{formatINR(totalAmount)}</td>
                                    <td className="expense-table-td text-right">{formatINR(paidAmount)}</td>
                                    <td className="expense-table-td text-right">{formatINR(balanceAmount)}</td>
                                    <td className="expense-table-td text-center">
                                      <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                        {item.isUploadedBill && item.imageUrl ? (
                                          <button type="button" className="accountant-feetype-edit" onClick={() => openImageModal(item.imageUrl)}>View</button>
                                        ) : "-"}
                                        <button type="button" onClick={() => handleEditExpense(item)} style={{ padding: "4px 10px", color: "gray", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }} title="Edit">✎</button>
                                        <button type="button" onClick={() => handleDeleteExpense(item)} style={{ padding: "4px 10px", color: "#ef4444aa", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }} title="Delete"><Trash2 /></button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="9" className="expense-table-td expense-empty-row">No records found for this category.</td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="expense-table-foot">
                            <tr>
                              <td colSpan="5" className="expense-table-td expense-foot-td">Total</td>
                              <td className="expense-table-td expense-foot-td">{formatINR(popupTotalAmount)}</td>
                              <td className="expense-table-td expense-foot-td">{formatINR(popupPaidAmount)}</td>
                              <td className="expense-table-td expense-foot-td">{formatINR(popupBalance)}</td>
                              <td className="expense-table-td"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                <div className="accountant-fees-bottom-left-row">
                  <div className="accountant-fees-log-card accountant-card">
                    <div className="accountant-fees-log-list">
                      {activityItems.map((item) => (
                        <p key={item} className="accountant-fees-log-item">O {item}</p>
                      ))}
                    </div>
                  </div>

                  <div className="accountant-total-others-card accountant-card">
                    <div className="accountant-total-others-left">
                      <div className="accountant-total-strip-item"><strong>0</strong><span>Office Expense</span></div>
                      <div className="accountant-total-strip-item"><strong>0</strong><span>Salary Expense</span></div>
                    </div>
                    <div className="accountant-total-others-right">
                      <span>Total Others</span><h2>₹0.00</h2><p>Expense Summary</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="accountant-fees-main-right">
                <div className="accountant-feetype-list-card accountant-card">
                  <div className="accountant-card-header accountant-feetype-header">
                    <h3>
                      {activeRightPanel === "assistant" ? "Assistant" : activeRightPanel === "transactions" ? "Expense Transactions" : "Expense List"}
                    </h3>
                  </div>

                  <div className="accountant-feetype-scroll" key={activeRightPanel}>
                    {activeRightPanel === "assistant" ? (
                      <div className="action-container" style={{ padding: "10px" }}>
                        <div className="action-item" style={{ marginBottom: "12px", display: "block", width: "100%" }}>
                          <strong style={{ fontSize: "13px" }}>Expense List ({expenseRows.length})</strong>
                          <div className="normalText" style={{ marginTop: "6px", maxHeight: showAllAssistantExpenses ? "220px" : "120px", overflowY: "auto", display: "grid", gap: "8px", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                            {assistantLoadingLists && <div style={{ fontSize: "12px" }}>Loading expense list...</div>}
                            {!assistantLoadingLists && assistantVisibleExpenses.map((item, index) => {
                              const isNew = isNewExpense(item.payment_date || item.expense_date || item.date);
                              return (
                                <div key={`${item.expense_name || item.description || "expense"}-${index}`} style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "8px", background: "#fafafa" }}>
                                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#222", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                    {item.expense_name || item.expense_type || "Expense"}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{item.expense_type || "Type N/A"}</div>
                                  <div style={{ fontSize: "11px", color: "#333", marginTop: "2px" }}>{formatINR(item.price || item.amount || item.paid_amount)}</div>
                                </div>
                              );
                            })}
                            {!assistantLoadingLists && expenseRows.length > 4 && !showAllAssistantExpenses && (
                              <button type="button" onClick={() => setShowAllAssistantExpenses(true)} style={{ border: "none", background: "transparent", color: "#1a73e8", textAlign: "left", padding: 0, cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}>+ {expenseRows.length - 4} more... (View all)</button>
                            )}
                            {!assistantLoadingLists && expenseRows.length > 4 && showAllAssistantExpenses && (
                              <button type="button" onClick={() => setShowAllAssistantExpenses(false)} style={{ border: "none", background: "transparent", color: "#1a73e8", textAlign: "left", padding: 0, cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}>Show less</button>
                            )}
                          </div>
                        </div>

                        <div className="action-item" style={{ marginBottom: "12px", display: "block", width: "100%" }}>
                          <strong style={{ fontSize: "13px" }}>Teacher Salaries ({assistantSalaryRows.length})</strong>
                          <div style={{ marginTop: "6px", maxHeight: showAllAssistantSalaries ? "220px" : "120px", overflowY: "auto", display: "grid", gap: "8px", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                            {assistantLoadingLists && <div style={{ fontSize: "12px" }}>Loading salary list...</div>}
                            {!assistantLoadingLists && assistantVisibleSalaries.map((row, index) => (
                              <div key={`${row.teacher_name || row.teacher_id || "teacher"}-${index}`} style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "8px", background: "#fafafa" }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#222" }}>{row.teacher_name || row.teacher_id || "Teacher"}</div>
                                <div style={{ fontSize: "11px", color: "#333", marginTop: "2px" }}>{formatINR(row.final_salary || row.salary_amount || row.base_salary)}</div>
                                <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{row.salary_month || row.payment_date || ""}</div>
                              </div>
                            ))}
                            {!assistantLoadingLists && assistantSalaryRows.length > 4 && !showAllAssistantSalaries && (
                              <button type="button" onClick={() => setShowAllAssistantSalaries(true)} style={{ border: "none", background: "transparent", color: "#1a73e8", textAlign: "left", padding: 0, cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}>+ {assistantSalaryRows.length - 4} more... (View all)</button>
                            )}
                            {!assistantLoadingLists && assistantSalaryRows.length > 4 && showAllAssistantSalaries && (
                              <button type="button" onClick={() => setShowAllAssistantSalaries(false)} style={{ border: "none", background: "transparent", color: "#1a73e8", textAlign: "left", padding: 0, cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}>Show less</button>
                            )}
                          </div>
                        </div>

                        <div className="action-item" style={{ marginBottom: "12px", display: "block", width: "100%" }}>
                          <strong style={{ fontSize: "13px" }}>My Actions ({expenseActionPlans.length})</strong>
                          <div style={{ marginTop: "6px", maxHeight: "180px", overflowY: "auto", display: "grid", gap: "8px", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                            {expenseActionPlans.map((item) => (
                              <div key={item.title} style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "8px", background: "#fafafa" }}>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#222" }}>{item.title}</div>
                                {item.detail && <div style={{ fontSize: "11px", color: "#555", marginTop: "3px" }}>{item.detail}</div>}
                                {Array.isArray(item.procedure) && item.procedure.length > 0 && (
                                  <ol style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "11px", color: "#333" }}>
                                    {item.procedure.map((step, stepIndex) => (<li key={`${item.title}-${stepIndex}`} style={{ marginBottom: "2px" }}>{step}</li>))}
                                  </ol>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : activeRightPanel === "transactions" ? (
                      <div className="accountant-feetype-list" style={{ padding: "0" }}>
                        {expenseRowsLoading ? (
                          <div className="accountant-assistant-empty">Loading expenses...</div>
                        ) : expenseRows.length ? (
                          expenseRows.map((item, index) => {
                            const isNew = isNewExpense(item.payment_date || item.expense_date || item.date);
                            const amount = Number(item.price || item.amount || item.paid_amount || 0);
                            const expenseName = item.expense_name || item.expenseName || "Expense";
                            const expenseType = item.expense_type || item.expenseType || "Type";
                            const description = item.description || "";

                            return (
                              <div 
                                key={`${item.id || expenseName}-${index}`} 
                                className="accountant-feetype-list-item" 
                                style={{ 
                                  display: "flex", 
                                  flexDirection: "column", 
                                  justifyContent: "flex-start", 
                                  alignItems: "flex-start",
                                  padding: "14px 16px",
                                  borderRadius:"10PX",
                                  borderBottom: "1px solid #f1f5f9",
                                  gap: "8px",
                                  backgroundColor: isNew ? "#ffacb329" : "transparent",
                                  transition: "background-color 0.2s"
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
                                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1 }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isNew ? "#929292" : "#cbd5e1", marginTop: "6px", flexShrink: 0 }}></span>
                                    <div>
                                      <div style={{ fontWeight: 600, color: "#334155", fontSize: "14px", lineHeight: "1.3" }}>{expenseName}</div>
                                      <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginTop: "2px" }}>{expenseType}</div>
                                    </div>
                                  </div>
                                  <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px", whiteSpace: "nowrap", marginLeft: "12px" }}>₹ {amount.toLocaleString("en-IN")}</span>
                                </div>
                                
                                {description && (
                                  <div style={{ fontSize: "12px", color: "#475569", paddingLeft: "18px", wordBreak: "break-word", lineHeight: "1.4", fontStyle: "italic", backgroundColor: "#f8fafc", padding: "6px 10px 6px 18px", borderRadius: "6px", width: "100%", boxSizing: "border-box" }}>
                                    {description}
                                  </div>
                                )}

                                {item.isUploadedBill && item.imageUrl && (
                                  <button type="button" className="accountant-feetype-edit" onClick={() => openImageModal(item.imageUrl)} style={{ marginTop: "4px", fontSize: "11px", padding: "4px 10px", alignSelf: "flex-end", backgroundColor: "#f1f5f9", borderRadius: "4px" }}>View Bill</button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="accountant-assistant-empty" style={{ padding: "20px" }}>No saved expense entries found.</div>
                        )}
                      </div>
                    ) : (
                      <div className="accountant-feetype-list">
                        {masterExpenseItems.length ? (
                          masterExpenseItems.map((item) => (
                            <div key={item.id} className="accountant-feetype-list-item"><span>O {item.expenseName} - {item.category}</span></div>
                          ))
                        ) : <div className="accountant-assistant-empty">No created expenses found.</div>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="accountant-fees-right-mini-row">
                  <div className="accountant-income-card accountant-card">
                    <div className="blockText">Salary Share</div>
                    <div className="normalText">of Total Expenses</div>
                  </div>
                  <div className="accountant-prevdue-card accountant-card">
                    <p className="accountant-prevdue-amount">₹0.00</p>
                    <div className="blockText">Previous Year Due</div>
                    <div className="normalText">Pending Dues for Yr. 2024-2025</div>
                  </div>
                </div>

                <div className="accountant-total-strip accountant-card">
                  <div className="accountant-total-strip-list">
                    {expenseSummaryCards.map((item) => (
                      <div key={item.label} className="accountant-total-strip-item"><strong>{item.amount}</strong><span>{item.label}</span></div>
                    ))}
                  </div>
                  <div className="accountant-total-strip-right">
                    <span>Balance</span><h2>{formatINR(filteredLedgerBalance)}</h2><p>Expense Summary</p>
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

      {isCreateExpensePopupOpen && (
        <div className="globalpopup-overlay" onClick={() => setIsCreateExpensePopupOpen(false)}>
          <div className="globalpopup-content accountant-create-fee-popup accountant-expense-category-popup" onClick={(event) => event.stopPropagation()}>
            <div className="globalpopup-header accountant-create-fee-popup-header">
              <div className="accountant-create-fee-popup-heading">
                <span className="accountant-create-fee-kicker">Expense Master</span>
                <p className="accountant-create-fee-popup-subtitle">Create a category and add expense names one by one.</p>
              </div>
              <button type="button" className="globalpopup-close-btn" onClick={() => setIsCreateExpensePopupOpen(false)}>×</button>
            </div>
            <div className="accountant-expense-master-embed"><CreateMasterExpenseForm /></div>
          </div>
        </div>
      )}

      {isAddExpensePopupOpen && (
        <div className="globalpopup-overlay" onClick={() => { setIsAddExpensePopupOpen(false); resetAddExpenseFlow(); }}>
          <div className="globalpopup-content accountant-expense-transaction-popup" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="globalpopup-close-btn" onClick={() => { setIsAddExpensePopupOpen(false); resetAddExpenseFlow(); }}>×</button>
            <div className="accountant-expense-popup-body">
              <div className="accountant-expense-popup-panel">
                <div className="accountant-expense-popup-panel-actions">
                  <button type="button" className="accountant-expense-popup-action accountant-expense-popup-action-active">
                    {editingExpenseId ? "Edit Expense" : "Add Expense"}
                  </button>
                </div>
                {addExpenseStep === 1 ? (
                  <>
                    <div className="accountant-expense-popup-form">
                      {isLedgerExpense ? (
                        <label className="accountant-create-fee-label">
                          Expense Type
                          <input type="text" value={expenseTransactionForm.expenseType} readOnly />
                        </label>
                      ) : (
                        <label className="accountant-create-fee-label">
                          Expense Type
                          <select
                            value={expenseTransactionForm.expenseType}
                            onChange={(e) => {
                              if (e.target.value === "__ADD_NEW__") {
                                setShowNewCategoryInput(true);
                                return;
                              }
                              setExpenseTransactionForm((prev) => ({
                                ...prev,
                                expenseType: e.target.value,
                                expenseName: "",
                              }));
                            }}
                          >
                            <option value="">-- Select Category --</option>
                            {Object.keys(combinedExpenseOptions).map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                            <option value="__ADD_NEW__">+ Add New Category</option>
                          </select>
                        </label>
                      )}
                      <label className="accountant-create-fee-label">
                        Expense Name
                        <select
                          value={expenseTransactionForm.expenseName}
                          onChange={(event) => {
                            if (event.target.value === "__ADD_NEW__") {
                              setShowNewExpenseInput(true);
                              return;
                            }
                            setExpenseTransactionForm((prev) => ({
                              ...prev,
                              expenseName: event.target.value,
                            }));
                          }}
                          disabled={!expenseTransactionForm.expenseType}
                        >
                          <option value="">-- Select Expense --</option>
                          {(combinedExpenseOptions[expenseTransactionForm.expenseType] || []).map((expenseName) => (
                            <option key={expenseName} value={expenseName}>{expenseName}</option>
                          ))}
                          <option value="__ADD_NEW__">+ Add New Expense</option>
                        </select>
                      </label>
                      <label className="accountant-create-fee-label">Name (Optional)<input type="text" value={expenseTransactionForm.personName} onChange={(event) => setExpenseTransactionForm((prev) => ({ ...prev, personName: event.target.value }))} placeholder="Name" /></label>
                      <label className="accountant-create-fee-label">Mobile Number (Optional)<input type="text" value={expenseTransactionForm.mobileNumber} onChange={(event) => setExpenseTransactionForm((prev) => ({ ...prev, mobileNumber: event.target.value }))} placeholder="Mobile Number" /></label>
                      <label className="accountant-create-fee-label">Description<textarea value={expenseTransactionForm.description} onChange={(event) => setExpenseTransactionForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Description" rows={3} /></label>
                      <label className="accountant-create-fee-label">Price (Optional)<input type="text" value={expenseTransactionForm.price} onChange={(event) => setExpenseTransactionForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="Price" /></label>
                    </div>
                    <div className="accountant-expense-category-actions">
                      <button type="button" className="accountant-expense-popup-action" onClick={() => { setIsAddExpensePopupOpen(false); resetAddExpenseFlow(); }}>Cancel</button>
                      <button type="button" className="btn-solid" disabled={!isFormValid} 
                        onClick={() => {
                          setExpensePaymentForm((prev) => ({
                            ...prev,
                            totalAmount: prev.totalAmount || expenseTransactionForm.price || "",
                          }));
                          setAddExpenseStep(2);
                        }}
                        style={{ opacity: isFormValid ? 1 : 0.5, cursor: isFormValid ? "pointer" : "not-allowed" }}>Next: Add Payment</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="accountant-expense-popup-form">
                      <div className="accountant-expense-summary-card">
                        <div className="accountant-expense-summary-title">Expense Summary</div>
                        <div className="accountant-expense-summary-grid">
                          <div className="accountant-expense-summary-item">
                            <span>Expense Type</span>
                            <strong>{expenseTransactionForm.expenseType}</strong>
                          </div>
                          <div className="accountant-expense-summary-item">
                            <span>Expense Name</span>
                            <strong>{expenseTransactionForm.expenseName}</strong>
                          </div>
                          <div className="accountant-expense-summary-item accountant-expense-summary-full">
                            <span>Description</span>
                            <strong>{expenseTransactionForm.description || "-"}</strong>
                          </div>
                        </div>
                      </div>

                      <label className="accountant-create-fee-label">
                        Payment Mode
                        <select
                          value={expensePaymentForm.paymentMode}
                          onChange={(event) =>
                            setExpensePaymentForm((prev) => ({
                              ...prev,
                              paymentMode: event.target.value,
                              otherPaymentMode: event.target.value === "OTHERS" ? prev.otherPaymentMode || "" : "",
                            }))
                          }
                        >
                          <option value="BANK">BANK</option>
                          <option value="CASH">CASH</option>
                          <option value="UPI">UPI</option>
                          <option value="CHECK">CHECK</option>
                        </select>
                      </label>

                      {expensePaymentForm.paymentMode === "OTHERS" && (
                        <label className="accountant-create-fee-label">
                          Enter Payment Mode
                          <input
                            type="text"
                            value={expensePaymentForm.otherPaymentMode || ""}
                            onChange={(event) =>
                              setExpensePaymentForm((prev) => ({
                                ...prev,
                                otherPaymentMode: event.target.value,
                              }))
                            }
                            placeholder="Enter payment mode"
                          />
                        </label>
                      )}
                      <label className="accountant-create-fee-label">
                        Total Amount
                        <input
                          type="number"
                          value={expensePaymentForm.totalAmount}
                          onChange={(event) =>
                            setExpensePaymentForm((prev) => ({
                              ...prev,
                              totalAmount: event.target.value,
                            }))
                          }
                          placeholder="Total Amount"
                        />
                      </label>
                      <label className="accountant-create-fee-label">
                        Paid Amount
                        <input
                          type="number"
                          value={expensePaymentForm.paidAmount}
                          onChange={(event) => {
                            const paid = Number(event.target.value);
                            const total = Number(expensePaymentForm.totalAmount);
                            if (paid > total) {
                              alert("Paid amount cannot be greater than the total amount.");
                              return;
                            }
                            setExpensePaymentForm((prev) => ({
                              ...prev,
                              paidAmount: event.target.value,
                            }));
                          }}
                          placeholder="Paid Amount"
                        />
                      </label>
                      <label className="accountant-create-fee-label">
                        Balance
                        <input type="text" value={expensePaymentForm.balance} readOnly />
                      </label>
                    </div>

                    <div className="accountant-expense-category-actions">
                      <button type="button" className="accountant-expense-popup-action" onClick={() => setAddExpenseStep(1)}>Back</button>
                      <button
                        type="button"
                        className="accountant-expense-popup-action accountant-expense-popup-action-active"
                        onClick={handleSubmitExpense}
                        disabled={expenseSubmitLoading}
                      >
                        {expenseSubmitLoading ? "Submitting..." : editingExpenseId ? "Update Expense" : "Submit Expense"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddFeesPopupOpen && (
        <div className="globalpopup-overlay" onClick={() => { setIsAddFeesPopupOpen(false); setAddFeesPanelTab("fees"); setAddFeePreview({ className: "", section: "", rows: [] }); }} style={{ zIndex: 3200 }}>
          <div className="globalpopup-content accountant-add-fee-popup" onClick={(event) => event.stopPropagation()} style={{ width: "72vw", maxWidth: "980px", height: "74vh", overflow: "auto", marginRight: "0" }}>
            <div className="globalpopup-header">
              <div className="accountant-create-fee-popup-heading">
                <span className="accountant-create-fee-kicker">Add Fees</span>
              </div>
              <button type="button" className="globalpopup-close-btn" onClick={() => { setIsAddFeesPopupOpen(false); setAddFeesPanelTab("fees"); setAddFeePreview({ className: "", section: "", rows: [] }); }}>×</button>
            </div>
            <div style={{ display: "flex", gap: "10px", padding: "0 24px 12px", flexWrap: "wrap" }}>
              <button type="button" className="accountant-create-new-btn" onClick={() => setAddFeesPanelTab("fees")} style={{ background: addFeesPanelTab === "fees" ? "#fdecef" : "#ffffff", color: "#c44755", border: "1px solid #f2c9cf" }}>Fees</button>
              <button type="button" className="accountant-create-new-btn" onClick={() => setAddFeesPanelTab("discount")} style={{ background: addFeesPanelTab === "discount" ? "#fdecef" : "#ffffff", color: "#c44755", border: "1px solid #f2c9cf" }}>Discounts</button>
            </div>
            {addFeesPanelTab === "discount" ? (
              <div style={{ padding: "0 12px 12px" }}><DiscountsPanel dynamicFeeTypes={dynamicFeeTypes} /></div>
            ) : (
              <IncomeForm5 selectedClassSection={{ class: addFeeFormClass, section: addFeeFormSection }} onFeeStructurePreviewChange={setAddFeePreview} embeddedInPopup />
            )}
          </div>
        </div>
      )}

      {isStudentManagementPopupOpen && (
        <div className="globalpopup-overlay accountant-student-management-popup-overlay" onClick={() => setIsStudentManagementPopupOpen(false)} style={{ zIndex: 3200 }}>
          <div className="globalpopup-content accountant-student-management-popup" onClick={(event) => event.stopPropagation()}>
            <div className="globalpopup-header accountant-student-management-popup-header">
              <div><div className="Heading">Add Student</div><div className="normalText">Open the student form inside a popup</div></div>
              <button type="button" className="globalpopup-close-btn accountant-student-management-close-btn" onClick={() => setIsStudentManagementPopupOpen(false)} aria-label="Close add student popup">×</button>
            </div>
            <div className="accountant-student-management-popup-body">
              <iframe title="Student Management Add Popup" src={studentManagementPopupUrl} className="accountant-student-management-iframe" />
            </div>
          </div>
        </div>
      )}

      {popup.show && (
        <ErrorPopup message={popup.message} type={popup.type} onClose={() => setPopup({ show: false, message: "", type: "" })} />
      )}

      {expenseToDelete && (
        <div className="globalpopup-overlay" onClick={cancelDeleteExpense}>
          <div className="globalpopup-content" style={{ width: '320px', maxWidth: '60vw', borderRadius: '12px', overflow: 'hidden', height: "40vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="globalpopup-header" style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 20px' }}>
              <button type="button" className="globalpopup-close-btn" onClick={cancelDeleteExpense}>×</button>
            </div>
            <div style={{ padding: '24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: '#374151', marginBottom: '8px', fontWeight: 600 }}>
                Delete "{expenseToDelete.expense_name || expenseToDelete.expenseName}"?
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                This action cannot be undone. The expense record will be permanently removed from the ledger.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button type="button" onClick={cancelDeleteExpense} style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'} onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}>Cancel</button>
                <button type="button" onClick={confirmDeleteExpense} style={{ padding: '10px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'} onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewCategoryInput && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setShowNewCategoryInput(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "360px", background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>Add New Category</h3>
              <button onClick={() => setShowNewCategoryInput(false)} style={{ border: "none", background: "transparent", fontSize: "22px", cursor: "pointer" }}>×</button>
            </div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>Category Name</label>
            <input
              type="text"
              placeholder="Enter Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button type="button" onClick={() => setShowNewCategoryInput(false)} style={{ padding: "8px 18px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#fff", cursor: "pointer" }}>Cancel</button>
              <button type="button" onClick={handleSaveCategory} style={{ padding: "8px 18px", border: "none", borderRadius: "8px", background: "#2563eb", color: "#fff", cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showNewExpenseInput && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.35)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }} onClick={() => setShowNewExpenseInput(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "420px", background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "#1f2937", fontWeight: "600" }}>Add New Expense</h3>
              <button onClick={() => setShowNewExpenseInput(false)} style={{ border: "none", background: "transparent", fontSize: "24px", cursor: "pointer", color: "#666" }}>×</button>
            </div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#374151" }}>Expense Category</label>
            <input
              type="text"
              readOnly
              value={expenseTransactionForm.expenseType}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "18px", background: "#f3f4f6", boxSizing: "border-box" }}
            />
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "14px", color: "#374151" }}>Expense Name</label>
            <input
              type="text"
              value={newExpense}
              placeholder="Enter Expense Name"
              onChange={(e) => setNewExpense(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "8px", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "25px" }}>
              <button type="button" onClick={() => setShowNewExpenseInput(false)} style={{ padding: "10px 18px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#fff", cursor: "pointer", fontWeight: "500" }}>Cancel</button>
              <button type="button" onClick={handleSaveExpense} style={{ padding: "10px 22px", border: "none", borderRadius: "8px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {expenseRowsLoading && <GlobalLoader timeoutSeconds={7} />}
      {isHelpOpen && (
        <HelpCenter userRole={userRole} openHelpSection={openHelpSection} currentModule="accountant" setOpenHelpSection={setOpenHelpSection} setIsHelpOpen={setIsHelpOpen} />
      )}
    </div>
  );
};

export default AccountantExpensesPageNew;