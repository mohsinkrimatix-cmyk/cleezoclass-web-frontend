// ChiefDashboard.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import ReportCard from "../shared/OverallReport";
// Assuming you have these components imported for the HR popup
import Recruiters from "../shared/Recruiters.jsx";
import EventAndMeetings from "../hr/HR_EventsMettings.jsx";
import EnrollmentBiometrics from "./Chief_Hr_Enrollment.jsx";
import AttendancePayroll from "./Chief_Hr_Attendnce.jsx";
import RecruitmentChief from "./ChiefRecruitmentsAndEvents.jsx";
import EventsMeetingsChief from "./Chief_Hr_EventsMeeting.jsx";
import abcLogo from "../assets/abc school.png"; // adjust path if needed

// === NEW/ASSUMED IMPORTS FOR OPERATIONS & COMMERCE ===
import ExammanagementChief from "./Chief_operations_ExamManagemement.jsx";
import TimetableChief from "./Chief_operations_Timetable.jsx";
// 🟢 NEW ASSUMED IMPORTS FOR COMMERCE POPUP
import IncomeChief from "./Chief_commerce_Income.jsx";
import ExpenseChief from "./Chief_commerce_Expense.jsx";
import AdmissionTab from "./Chief_operations_AdmissionTab.jsx";

// Import the hover styles and the CardSection component
import './tabhower.css'
import CardSection from "../shared/CardSection.jsx"
import Header from "../shared/header.jsx";
const ADMIN_API_BASE = "https://cleezoclass.com:5000/api/admin";

// 🟢 NEW HELPER: Function to parse currency strings
const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsedValue = parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
        return parsedValue;
    }
    if (value === null || typeof value === 'undefined') return 0;
    return 0;
};

const normalizeFeeKey = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const getResponseRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.rawData)) return payload.rawData;
  return [];
};

const getResponseFeeTypes = (payload) => {
  if (Array.isArray(payload?.dynamicFeeTypes)) return payload.dynamicFeeTypes;
  if (Array.isArray(payload?.feeTypes)) return payload.feeTypes;
  return [];
};

const feeKeyMatches = (rowKey, feeType) => {
  const rowNorm = normalizeFeeKey(rowKey);
  const feeNorm = normalizeFeeKey(feeType);
  return rowNorm === feeNorm || rowNorm === `${feeNorm}fee` || rowNorm.includes(feeNorm);
};

const sumDynamicAmount = (row, dynamicFeeTypes, suffix) => {
  if (!row || !dynamicFeeTypes?.length) return 0;

  return dynamicFeeTypes.reduce((sum, feeType) => {
    const matchingKey = Object.keys(row).find((key) => {
      const keyLower = key.toLowerCase();
      if (suffix && !keyLower.endsWith(`_${suffix}`)) return false;
      if (!suffix && /_(paid|due|discount)$/i.test(key)) return false;
      const baseKey = suffix ? key.slice(0, -(suffix.length + 1)) : key;
      return feeKeyMatches(baseKey, feeType);
    });

    return sum + parseCurrency(matchingKey ? row[matchingKey] : 0);
  }, 0);
};

const getRowPaid = (row, dynamicFeeTypes) => {
  const totalPaid = parseCurrency(row?.Total_Paid ?? row?.Paid_Amount ?? row?.Fee_Paid);
  return totalPaid || sumDynamicAmount(row, dynamicFeeTypes, "paid");
};

const getRowDue = (row, dynamicFeeTypes) => {
  const totalDue = parseCurrency(row?.Total_Due ?? row?.Due_Amount ?? row?.Final_Amount ?? row?.Fee_Pending);
  return totalDue || sumDynamicAmount(row, dynamicFeeTypes, "due");
};

const getRowExpected = (row, dynamicFeeTypes) => {
  const totalExpected = parseCurrency(row?.Total_Expected ?? row?.CompleteFee ?? row?.Fee_Amount);
  return totalExpected || sumDynamicAmount(row, dynamicFeeTypes, "");
};

const getRowDate = (row, fallbackDate) => {
  const raw = row?.record_date || row?.paidDate || row?.Payment_Date || row?.created_at || row?.updated_at;
  if (!raw) return fallbackDate;
  const match = String(raw).match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : fallbackDate;
};

// 🟢 NEW HELPER: Function to format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const Dashboard = () => {
  const navigate = useNavigate();
  const navigateFromChief = (route) => {
    sessionStorage.setItem("chiefAllowedRoute", route);
    sessionStorage.setItem("chiefAllowedAt", String(Date.now()));
    navigate(route);
  };
  const popupContentRef = useRef(null); 
  const [selectedYear, setSelectedYear] = useState("2025-2026"); 
const [chiefReports, setChiefReports] = useState([]);

const [popupData, setPopupData] = useState([]);
const [popupTitle, setPopupTitle] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [complaint, setComplaint] = useState([]);

    const fetchComplaints = async () => {
      try {
        const schoolCode = localStorage.getItem("schoolCode");

        const res = await axios.get(
          "https://cleezoclass.com:5000/api/complaints",
          {
            params: { schoolCode }
          }
        );

        setComplaints(res.data);
      } catch (err) {
        console.error("Error fetching complaints:", err);
      }
    };


const fetchUnpaid = async () => {
  try {
    const schoolCode = localStorage.getItem("schoolCode");
    const res = await axios.get(
      `${API_BASE_URL}/api/chat-requests/pending?schoolCode=${schoolCode}`
    );
    setUnpaidChats(res.data || []);
  } catch (err) {
    console.error("Error fetching unpaid requests:", err);
  }
};

const fetchChiefReports = async () => {
  try {
    const schoolCode = localStorage.getItem("schoolCode");
    const res = await axios.get(
      `https://cleezoclass.com:5000/chief/fee-reports?schoolCode=${schoolCode}`
    );
    setChiefReports(res.data || []);
  } catch (err) {
    console.error("Error fetching chief reports:", err);
  }
};
const openReportModal = (students) => {
  setPopupTitle("Fee Report Details");
  setPopupData(students);
  setShowPopup(true);
};



  // 🔍 DEBUG: Initial state logging
  console.log("--- Dashboard Initialization Start ---");
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  // Initial dates set to 7 days ago to today
  const [fromDate, setFromDate] = useState(formatDate(sevenDaysAgo));
  const [toDate, setToDate] = useState(formatDate(today));
  console.log(`[INIT] Initial Dates: From=${fromDate}, To=${toDate}`);
  
  const [allFees, setAllFees] = useState([]);
  const [dynamicFeeTypes, setDynamicFeeTypes] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [finalPaid, setFinalPaid] = useState(0); 
  const [finalUnpaid, setFinalUnpaid] = useState(0); 
  const [popupComponent, setPopupComponent] = useState(null);
  
  // 🧩 Component Maps (omitted for brevity, assume unchanged)
  const hrComponentMap = {
    "/Biometric": <EnrollmentBiometrics />,
    "/BiometricTeacher": <AttendancePayroll />,
    "/teacher/new-enrollment": <RecruitmentChief />,
    "/EventAndMeetings": <EventsMeetingsChief />,
  };
  
  const operationsComponentMap = {
    "/ExammanagementChief": <ExammanagementChief />,
    "/EventsMeetingDashboard": <EventsMeetingsChief />,
    "/ChiefDashboardWrapper": < AdmissionTab/>,
    "/TimetableChief": <TimetableChief />
  };
  
  const commerceComponentMap = {
    "/AccountantDashboard/Income": <IncomeChief />, 
    "/AccountantDashboard/Expense": <ExpenseChief />, 
  };

  const handleCardItemClick = (link) => {
    if (hrComponentMap[link]) {
        setPopupComponent(hrComponentMap[link]);
        return;
    }
    if (operationsComponentMap[link]) {
        setPopupComponent(operationsComponentMap[link]);
        return;
    }
    if (commerceComponentMap[link]) {
        setPopupComponent(commerceComponentMap[link]);
        return;
    }
    navigate(link);
  };
  
  const [showOperationsPopup, setShowOperationsPopup] = useState(false);

  const [totalPaid, setTotalPaid] = useState(0); 
  const [totalBalance, setBalance] = useState(0); 
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";
  const [totals, setTotals] = useState({
    totalPaid: 0,
    totalBalance: 0,
    totalPrice: 0,
    loading: true,
    error: null
  });

  // (Other useEffects, Styles, Card Data definitions omitted for brevity, assume unchanged)
const name=localStorage.getItem('name')
// Function to generate an array of dates between two Date objects
const getDatesBetween = (start, end) => {
    const dates = [];
    let currentDate = new Date(start.getTime());
    currentDate.setHours(0, 0, 0, 0); 
    while (currentDate.getTime() <= end.getTime()) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(`[applyTimeFilter] Dates in Range (${dates.length}):`, dates.map(d => formatDate(d)));
    return dates;
};

const applyTimeFilter = (
    dataToProcess = allFees, 
    start = fromDate, 
    end = toDate
) => {
    if (!dataToProcess || !dataToProcess.length) {
        setChartData([]);
        setFinalPaid(0);
        setFinalUnpaid(0);
        return;
    }

    const groupedData = {};

    dataToProcess.forEach((item) => {
        const recordDateStr = getRowDate(item, start);

        // Exact string comparison (YYYY-MM-DD)
        if (recordDateStr >= start && recordDateStr <= end) {
            if (!groupedData[recordDateStr]) {
                groupedData[recordDateStr] = { Paid: 0, Unpaid: 0 };
            }

            const reportKind = item.__feeReportKind;
            const paid = reportKind === "due" ? 0 : getRowPaid(item, dynamicFeeTypes);
            const due = reportKind === "paid" ? 0 : getRowDue(item, dynamicFeeTypes);
            const expected = getRowExpected(item, dynamicFeeTypes);

            groupedData[recordDateStr].Paid += paid;
            groupedData[recordDateStr].Unpaid += due > 0 ? due : Math.max(0, expected - paid);
        }
    });

    // Build continuous date range points for the chart
    const chartPoints = [];
    let totalPaidSum = 0;
    let totalUnpaidSum = 0;

    const [sY, sM, sD] = start.split("-").map(Number);
    const [eY, eM, eD] = end.split("-").map(Number);
    
    let curr = new Date(sY, sM - 1, sD);
    const stop = new Date(eY, eM - 1, eD);

    while (curr <= stop) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, "0");
        const d = String(curr.getDate()).padStart(2, "0");
        const dateKey = `${y}-${m}-${d}`;

        const dayPaid = groupedData[dateKey]?.Paid || 0;
        const dayUnpaid = groupedData[dateKey]?.Unpaid || 0;

        totalPaidSum += dayPaid;
        totalUnpaidSum += dayUnpaid;

        const label = `${curr.getDate()} ${curr.toLocaleString("en-US", { month: "short" })}`;

        chartPoints.push({
            label,
            Paid: dayPaid,
            Unpaid: dayUnpaid,
        });

        curr.setDate(curr.getDate() + 1);
    }

    setChartData(chartPoints);
    setFinalPaid(totalPaidSum);
    setFinalUnpaid(totalUnpaidSum);
};
useEffect(() => {
    console.group("📊 [chartData STATE UPDATED]");
    console.log("chartData length:", chartData.length);
    console.log("chartData sample:", chartData.slice(0, 5));
    console.groupEnd();
}, [chartData]);

const API_BASE_URL = "https://cleezoclass.com:5000"; 

    // 🔄 MODIFIED: fetchFeeData now uses current fromDate and toDate from state
  const fetchFeeData = async () => {
  console.groupCollapsed("💰 [fetchFeeData] START");
  const startTime = performance.now();

  const schoolCode = localStorage.getItem("schoolCode");
  console.log("📦 schoolCode:", schoolCode);

  if (!schoolCode) {
    console.error("❌ School code missing");
    console.groupEnd();
    return;
  }

  console.log("📅 Filters:", { fromDate, toDate });
 const paidApiUrl = `${API_BASE_URL}/api/fee-records?type=TotalPaidList&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`;
 const dueApiUrl = `${API_BASE_URL}/api/fee-records?type=TotalDueList&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`;

  try {
    setLoading(true);

    console.time("⏱️ API Request");
    const [paidResponse, dueResponse] = await Promise.all([
      axios.get(paidApiUrl),
      axios.get(dueApiUrl),
    ]);
    console.timeEnd("⏱️ API Request");

    const paidRows = getResponseRows(paidResponse.data).map((row) => ({
      ...row,
      __feeReportKind: "paid",
    }));
    const dueRows = getResponseRows(dueResponse.data).map((row) => ({
      ...row,
      __feeReportKind: "due",
    }));
    const fees = [...paidRows, ...dueRows];
    const fetchedDynamicFeeTypes = [
      ...new Set([
        ...getResponseFeeTypes(paidResponse.data),
        ...getResponseFeeTypes(dueResponse.data),
      ]),
    ];

    setDynamicFeeTypes(fetchedDynamicFeeTypes);
    console.log("📊 Records received:", fees.length);
    console.log("🧾 Dynamic fee types:", fetchedDynamicFeeTypes);

    setAllFees(fees);

    if (fees.length > 0) {
      console.group("🔎 Sample Record");
      console.log(fees[0]);
      console.groupEnd();
    }

    // ==============================
    // 🧮 CORRECT TOTAL CALCULATIONS
    // ==============================
    console.group("🧮 Calculating Totals");
    const totals = fees.reduce(
      (acc, row) => {
        const paid = row.__feeReportKind === "due" ? 0 : getRowPaid(row, fetchedDynamicFeeTypes);
        const due = row.__feeReportKind === "paid" ? 0 : getRowDue(row, fetchedDynamicFeeTypes);
        const expected = getRowExpected(row, fetchedDynamicFeeTypes);

        acc.expected += expected;
        acc.paid += paid;
        acc.unpaid += due > 0 ? due : Math.max(0, expected - paid);
        return acc;
      },
      { expected: 0, paid: 0, unpaid: 0 }
    );

    console.log("✅ FINAL TOTALS", totals);
    console.groupEnd();

    setFinalPaid(totals.paid);
    setFinalUnpaid(totals.unpaid);

  } catch (err) {
    console.group("❌ API ERROR");
    console.error(err);
    console.groupEnd();
  } finally {
    setLoading(false);
    console.log(`🏁 Finished in ${(performance.now() - startTime).toFixed(2)} ms`);
    console.groupEnd();
  }
};



    const [expensesData,setExpensesData]= useState()
    const [userExpensesData,setUserExpensesData]= useState()
    const [originalUserExpensesData, setOriginalUserExpensesData] = useState(null);
    const handleSearch = async () => {
        console.log("🟢 handleSearch called...");

        const schoolCode = localStorage.getItem("schoolCode");
        console.log("📘 Retrieved schoolCode:", schoolCode);

        if (!schoolCode) {
            console.error("❌ School code not found in localStorage.");
            return;
        }

        try {
            console.log("🚀 Fetching both datasets in parallel...");

            const expensesPromise = axios.get(
            `https://cleezoclass.com:5000/totalexpensesData?schoolCode=${schoolCode}`
            );
            const billsPromise = fetch("https://cleezoclass.com:5000/getAllBills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schoolCode }),
            });

            const [expensesResponse, billsResponse] = await Promise.all([
            expensesPromise,
            billsPromise,
            ]);

            console.log("✅ Both API calls completed successfully.");

            // --- Process regular expenses ---
            const expensesData = expensesResponse.data || [];
            console.log(`📊 Expenses data fetched: ${expensesData.length} records`);

            // --- Process and transform uploaded bills ---
            let uploadedBillsData = [];
            if (billsResponse.ok) {
                const rawBills = await billsResponse.json();
                console.log(`📦 Raw bills fetched: ${rawBills.length} records`);

                uploadedBillsData = rawBills.map((bill, index) => ({
                    id: bill.id || `bill_${index}_${Math.random()}`,
                    expense_date: bill.date,
                    expense_type: bill.bill_type || "Uploaded Bill",
                    description: bill.description || "N/A",
                    payment_mode: "N/A",
                    price: Number(bill.amount) || 0,
                    paid_amount: Number(bill.amount) || 0,
                    balance_amount: 0,
                    imageUrl: bill.imageUrl,
                    isUploadedBill: true,
                }));

                console.log("🧾 Uploaded bills transformed successfully:", uploadedBillsData);
            } else {
                console.error("❌ Failed to fetch uploaded bills. Response status:", billsResponse.status);
            }

            // --- Merge both datasets ---
            const mergedData = [...expensesData, ...uploadedBillsData];
            console.log(`🔄 Merged dataset created with ${mergedData.length} total records.`);

            // --- Sort by date ---
            mergedData.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
            console.log("📅 Merged data sorted by expense_date (newest first).");

            // --- Set to state ---
            setUserExpensesData(mergedData);
            setOriginalUserExpensesData(mergedData);

            console.log("✅ Final merged data set to state successfully.");
        } catch (error) {
            console.error("🔥 Error in handleSearch:", error);
            setUserExpensesData([]);
            setOriginalUserExpensesData([]);
        }
    };

    const [total, setTotal] = useState({
        total_investment: 0,
        total_other: 0,
        total_donation: 0,
        grand_total: 0
    });
    const [isLedgerOpenForExpense, setIsLedgerOpenForExpense] = useState(false);
    const [showStudentFinder, setShowStudentFinder] = useState(false);
    const [income, setIncome] = useState({
        total_investment: 0,
        total_other: 0,
        total_donation: 0,
        grand_total: 0,
        loading: true,
        error: null
    });

    const fetchTotals = async (schoolCode) => {
        if (!schoolCode) {
            console.warn("⚠️ fetchTotals called without a schoolCode. Aborting fetch.");
            return; 
        }

        console.log("🟢 fetchTotals called with schoolCode:", schoolCode);

        setTotals(prev => ({ ...prev, loading: true, error: null }));
        console.log("⏳ Loading set to true...");

        try {
            const response = await fetch(`https://cleezoclass.com:5000/api/totals?schoolCode=${schoolCode}`);
            console.log("🌐 Fetch request completed. Response status:", response.status);

            if (!response.ok) {
                throw new Error(`❌ Failed to fetch totals, status: ${response.status}`);
            }

            const data = await response.json();
            console.log("📦 Data received from API:", data);

            const totalPaid = parseFloat(data.totals.paid) || 0;
            const totalBalance = parseFloat(data.totals.balance) || 0;
            const totalPrice = parseFloat(data.totals.price) || 0;

            console.log("🧮 Parsed totals:", { totalPaid, totalBalance, totalPrice });

            setTotals(prev => ({
                ...prev,
                totalPaid,
                totalBalance,
                totalPrice,
                loading: false,
                error: null
            }));
            console.log("✅ Totals set to state successfully.");

        } catch (err) {
            console.error("🔥 Error in fetchTotals:", err);
            setTotals(prev => ({
            ...prev,
            loading: false,
            error: err.message
            }));
        }
    };


    useEffect(() => {
        console.log("[Effect] Mount: Initial fetchFeeData triggered."); 
        fetchFeeData();
    }, []); 
    
    // Trigger data fetch when fromDate or toDate changes
    useEffect(() => {
        console.log(`[Effect] Date Change: Re-fetching data for ${fromDate} to ${toDate}`); 
        fetchFeeData(); 
    }, [fromDate, toDate]); 
    
    // Apply time filter when allFees changes (which is triggered by data fetch)
    useEffect(() => {
        console.log("[Effect] allFees Change: State updated. Re-applying time filter."); 
        applyTimeFilter();
    }, [allFees, dynamicFeeTypes]); 
    
    useEffect(() => {
        console.log("🟢 useEffect triggered for fetchTotals======================================");

        const schoolCode = localStorage.getItem("schoolCode");
        console.log("🔍 Raw schoolCode from localStorage=====================================================:", schoolCode);

        if (schoolCode) {
            console.log("✅ Valid schoolCode found, calling fetchTotals...");
            fetchTotals(schoolCode);
        } else {
            console.error("❌ No schoolCode found in localStorage");
        }
    }, []);


    useEffect(() => {
        handleSearch();
    }, []); // runs once when the component mounts
const [selectedComplaint, setSelectedComplaint] = useState(null);

const openComplaintModal = (complaint) => {
  setSelectedComplaint(complaint);
};
const fetchComplaint = async () => {
  const schoolCode = localStorage.getItem("schoolCode");
const role = localStorage.getItem("userRole");

  try {
    const res = await axios.get(
      `https://cleezoclass.com:5000/api/chat_requests/${role}`,
      { params: { schoolCode } }
    );
    setComplaint(res.data);
  } catch (err) {
    console.error("Error fetching complaints", err);
  }
};
const [expenses, setExpenses] = useState([]);

useEffect(() => {
  fetchComplaint();
}, []);

const closeComplaintModal = () => {
  setSelectedComplaint(null);
};

const outerContainer = {
  display: "flex",
  flexDirection: "column",

  minHeight: "100vh",
  minHeight: isMobile ? "100dvh" : "100vh",

  width: "100%",
  padding: "20px",
  boxSizing: "border-box",
  backgroundColor: "#6b7983ff",
};

    const container = {
        fontFamily: font,
        backgroundColor: "#fff",
        borderRadius: "16px",
        padding: isMobile ? "10px 5px" : "5px",
        boxSizing: "border-box",
        width: "100%",
        minWidth: "300px", 
        transition: "filter 0.5s ease", 
    };

    const header = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: "16px 16px 0 0",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
        padding: isMobile ? "15px" : "25px",
        marginBottom: isMobile ? "15px" : "25px",
        flexWrap: isMobile ? "wrap" : "nowrap",
        gap: isMobile ? "10px" : "0",
        position: "sticky",
        top: 0,
        zIndex: 1000,
    };


    const logoBox = {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        order: isMobile ? 1 : 0, 
        maxHeight: isMobile ? "48px" : "56px",
        overflow: "hidden",
        flexShrink: 0,
    };
const logo = {
  width: isMobile ? "48px" : "56px",
  height: isMobile ? "48px" : "56px",
  flexShrink: 0,
  backgroundImage: `url(${abcLogo})`,
  backgroundSize: "contain",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  borderRadius: "8px",
  overflow: "hidden",
};

    const logoText = { fontSize: isMobile ? "16px" : "18px", fontWeight: "600" };
    const logoSub = { fontSize: isMobile ? "10px" : "12px", color: "#777" };
    const schoolTitle = {
        fontSize: isMobile ? "16px" : "20px",
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
        flex: isMobile ? "1 1 100%" : 1, 
        order: isMobile ? 3 : 0, 
        marginTop: isMobile ? "10px" : "0",
    };
    const buttonGroup = {
        display: "flex",
        gap: "10px",
        order: isMobile ? 2 : 0, 
    };
    const btn = {
        backgroundColor: "#6b7983ff",
        border: "none",
        borderRadius: "16px",
        padding: isMobile ? "6px 10px" : "8px 16px",
        cursor: "pointer",
        fontSize: isMobile ? "12px" : "14px",
        fontWeight: "500",
        fontFamily: font,
        color: "#fff", 
    };

    const grid = {
        display: "flex",
        flexDirection: isMobile ? "column" : "row", 
        padding: "10px",
        gap: isMobile ? "20px" : "20px",
    };

    const card = {
        backgroundColor: "#fff",
        borderRadius: "16px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        padding: "20px",
        cursor: "pointer",
        height: "320px", 
        display: "flex",
        flexDirection: "column",
        borderLeft:'8px solid #945f4aff',
        justifyContent: "center", 
        borderTop:'1px solid #ccc',
        borderBottom:'1px solid #ccc',
        borderRight:'1px solid #ccc'
    };

    const listItem = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: isMobile ? "10px" : "5px",
        fontSize: isMobile ? "12px" : "14px",
        flexWrap: isMobile ? "wrap" : "nowrap", 
    };

    const circle = (color) => ({
        width: isMobile ? "30px" : "50px",
        height: isMobile ? "30px" : "50px",
        minWidth: isMobile ? "30px" : "50px",
        borderRadius: "50%",
        backgroundColor: color,
        marginRight: "10px",
    });

    const progress = (c1, c2) => ({
        display: "flex",
        width: isMobile ? "60px" : "90px",
        height: "20px",
        borderRadius: "4px",
        overflow: "hidden",
        background: `linear-gradient(to right, ${c1} 60%, ${c2} 40%)`,
        marginLeft: isMobile ? "0" : "auto", 
        marginTop: isMobile ? "10px" : "0", 
    });

    const smallText = { fontSize: isMobile ? "12px" : "10px", color: "#666", textAlign: "left" };
    const itemContent = {
        display: "flex",
        alignItems: "flex-start",
        flexDirection: "column",
        textAlign: "left",
        flex: 1, 
    };
    
    const commerceItems = [
    {
        color: "#9CC3F8",
        title: "Income",
        desc: [
        `Fees Paid Report - ₹${finalPaid.toLocaleString('en-IN')}`, 
        `Fees Unpaid Report - ₹${finalUnpaid.toLocaleString('en-IN')}`,
        `Income Ledger - ₹${(finalPaid + finalUnpaid).toLocaleString('en-IN')}`,
        ],
        link: "/AccountantDashboard/Income", 
        isPopup: true, 
    },
    {
        color: "#CFA7A7",
        title: "Expense",
        desc: [
            `
            Expenses Report - ₹${totals.totalPaid.toLocaleString('en-IN')}`,   
        `Unpaid Expenses - ₹${totals.totalBalance.toLocaleString('en-IN')}`,
        `Expense Ledger`,
        ],
        link: "/AccountantDashboard/Expense", 
        isPopup: true, 
    },
    
    ];

    const operationsItems = [
        {
        color: "#D4C7B0",
        title: "Academics",
        desc: "Syllabus, performance, Attendance, Behavior, Certificates",
        link: "/ChiefDashboardWrapper",
        isPopup: true, 
        },
        {
        color: "#868C8F",
        title: "Meetings & Live Chat",
        desc: "Group Chat, Chat Assignment, Parents Messaging",
        link: "/EventsMeetingDashboard", 
        isPopup: true, 
        },
        {
        color: "#705B56",
        title: "Timetable",
        desc: "Generation, Substitutes",
        link: "/TimetableChief",
        isPopup: true,
        },
        {
        color: "#D9EEF8",
        title: "Exam Management",
        desc: "Question Paper, Evaluator, Invigilator",
        link: "/ExammanagementChief", 
        isPopup: true, 
        },
    ];

    const marketingItems = [
        {
        color: "#D4C7B0",
        title: "Admission Report",
        desc: "Walk-ins / Source, Pre & PostAdmission, Tickets",
        link: "/FrontDeskDashboard",
        isPopup: false, 
        },
        {
        color: "#868C8F",
        title: "Lead Profile",
        desc: "Lead score, Lead strength, LeadReport",
        link: "/FrontDeskDashboard",
        isPopup: false,
        },
        {
        color: "#705B56",
        title: "Communication",
        desc: "Messages, Mails, Re-Marketing,Follow-ups",
        link: "/FrontDeskDashboard",
        isPopup: false,
        },
        {
        color: "#D9EEF8",
        title: "Teams",
        desc: "Front office, Counsellors, Salesexecutives, Field force",
        link: "/FrontDeskDashboard",
        isPopup: false,
        },
    ];

    const hrItems = [
        {
        color: "#D9EEF8",
        title: "Enrollments & Biometrics",
        desc: "Admission process & Students track",
        link: "/Biometric",
        isPopup: true,
        },
        {
        color: "#868C8F",
        title: "Attendance & Payroll",
        desc: "Staff Tracking, Salary, Payroll",
        link: "/BiometricTeacher",
        isPopup: true,
        },
        {
        color: "#B5ACBC",
        title: "Recruitment & Exits",
        desc: "Joining’s & Exit Formalities",
        link: "/teacher/new-enrollment",
        isPopup: true,
        },
        {
        color: "#A39DBD",
        title: "Events & Meetings",
        desc: "Circulars, Complaints & Approvals",
        link: "/EventAndMeetings",
        isPopup: true,
        },
    ];
const [isBlurActive, setIsBlurActive] = useState(true); // true = fully blurred

   const renderCard = (title, items, homepageRoute, split = false) => {
  if (split) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "10px",
          flex: 1,
                      marginTop:'45px'

        }}
      >
        {/* LEFT SIDE */}
        <div
          style={{
            flex: 1,
            borderRight: isMobile ? "none" : "2px solid black",
            borderBottom: isMobile ? "2px solid black" : "none",
            paddingRight: isMobile ? "0" : "10px",
            paddingBottom: isMobile ? "10px" : "0",
          }}
        >
          {items.map((i) => (
            <div key={i.title} style={listItem}>
              {/* ✅ WHOLE ROW CLICKABLE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  cursor: "pointer",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardItemClick(i.link);
                }}
              >
                <div style={circle(i.color)} />

                <div className="title-hover" style={itemContent}>
                  <div style={{ fontWeight: "400" }}>{i.title}</div>

                  <div style={smallText}>
                    {Array.isArray(i.desc)
                      ? i.desc.map((d, idx) => <div key={idx}>{d}</div>)
                      : i.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT SIDE */}
      <div
  
  style={{
    flex: isMobile ? "1 1 100%" : 1,
    paddingLeft: isMobile ? "0" : "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    width: "100%",
    marginTop:'-20px'
  }}
>

            {/* Top Section (Button, Arrow, Text) */}
            <div
                style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center", 
                marginBottom: "30px",
                gap: "10px",
                flexWrap: isMobile ? "wrap" : "nowrap",
                width: "100%",
                }}
            >
                <button
                style={{
                    backgroundColor: "#a7c7ffff",
                    color: "black",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: isMobile ? "12px" : "14px",
                    flexShrink: 0,
                }}
                >
CleezoLeadX                </button>

                <svg
                width={isMobile ? "20" : "40"}
                height="20"
                viewBox="0 0 40 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    flexShrink: 0,
                    transform: isMobile ? "rotate(90deg)" : "none",
                }}
                >
                <line x1="10" y1="10" x2="40" y2="10" stroke="#007BFF" strokeWidth="2" />
                <polygon points="10,5 0,10 10,15" fill="#007BFF" />
                </svg>

                <div
                style={{
                    fontSize: "12px",
                    color: "#666",
                    border: "2px solid #007BFF",
                    padding: "8px 12px",
                    borderRadius: "16px",
                    backgroundColor: "#fff",
                    maxWidth: isMobile ? "100%" : "180px",
                    lineHeight: "1.4",
                    flexGrow: 1,
                    marginLeft:'-3px'
                }}
                >
                Click the button to start the Automated Admission Tool
                </div>
            </div>

            {/* Middle Section (Icon, Title, Dropdown) */}
       <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
    width: "100%",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  {/* LEFT SIDE */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}
  >
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#868C8F",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "14px",
        marginTop:'-40px'
      }}
    >
      {/* Icon / Text */}
    </div>

    <div style={{ fontSize: "18px", fontWeight: "500",        marginTop:'-40px'
 }}>
      Tool Statistics
    </div>
  </div>

  {/* RIGHT SIDE */}
  <select
    style={{
      padding: "5px 10px",
      borderRadius: "6px",
      marginRight:'80px',
      backgroundColor: "#464444ff",
      color: "#fff",
      width: isMobile ? "100%" : "auto",
    }}
  >
    <option>Last Week</option>
    <option>This Week</option>
    <option>This Month</option>
  </select>
</div>


            {/* Statistics Section */}
    <div
  style={{
    display: "flex",
    width: "100%",
    justifyContent: "center",
    alignItems: "stretch",
    gap: "16px",
  }}
>
  {/* LEFT CONTAINER */}
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-evenly",
      alignItems: "flex-start",
      fontSize: "10px",
      paddingLeft: "10px",
      marginTop:'-15px'
    }}
  >
      {/* LEFT HEADING */}
  <div
    style={{
      width: isMobile ? "90%" : "70%",   // SAME WIDTH AS CONTENT
      fontWeight: "600",
      fontSize: "12px",
      marginBottom: "6px",
      textAlign: "left",
      alignSelf: "flex-start",
      color:'#9C6262'
    }}
  >
Digital Status  </div>
    {[
      "Target Audience",
      "Exposed Audience",
      "Applied Impressions",
      "Number of Impressions",
    ].map((stat, index) => (
      <div
        key={stat}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: isMobile ? "90%" : "70%",
          padding: "6px 0",
                marginTop:'-15px'

        }}
      >
        <span>{stat}</span>
        <span>
          :{" "}
          {index === 0
            ? "20,000"
            : index === 1
            ? "8,000"
            : index === 2
            ? "32,000"
            : "8"}
          <span
            style={{
              color: index % 2 === 0 ? "green" : "red",
              marginLeft: "5px",
            }}
          >
            {index % 2 === 0 ? "↑" : "↓"}
          </span>
        </span>
      </div>
    ))}
  </div>

  {/* VERTICAL DIVIDER */}
  <div
    style={{
      width: "1px",
      backgroundColor: "#ccc",
    }}
  />

  {/* RIGHT CONTAINER */}
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-evenly",
      alignItems: "flex-start",
      fontSize: "10px",
      paddingLeft: "10px",
    }}
  >
      {/* LEFT HEADING */}
  <div
    style={{
      width: isMobile ? "90%" : "70%",   // SAME WIDTH AS CONTENT
      fontWeight: "600",
      fontSize: "12px",
      marginBottom: "6px",
      textAlign: "left",
      alignSelf: "flex-start",
      color:'#9C6262'
    }}
  >
Enrollments  </div>

    {[
      "Pre-Admission Report",
      "Lead Profile Report",
      "Communication Report",
      "Post-Admission Report",
    ].map((report) => (
      <div
        key={report}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          padding: "6px 0",
                marginTop:'-15px'

        }}
      >
        <span>{report}</span>
      </div>
    ))}
  </div>
</div>

            
            </div>
      </div>
    );
  }

  /* ================= STANDARD CARD ================= */

  return (
    <div
      className="container-hover"
      style={card}
      onClick={() => homepageRoute && navigate(homepageRoute)}
    >
      {items.map((i) => (
        <div
          key={i.title}
          data-guide={
  i.title === "Academics"
    ? "guide-academics-card"
    : i.title === "Meetings & Live Chat"
    ? "guide-meetings-card"
    : i.title === "Timetable"
    ? "guide-timetable-card"
    : i.title === "Exam Management"
    ? "guide-exam-card"
    : ""
}



          style={listItem}
        >
          {/* ✅ WHOLE ROW CLICKABLE */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleCardItemClick(i.link);
            }}
          >
            <div style={circle(i.color)} />

            <div className="title-hover" style={itemContent}>
              <div style={{ fontWeight: "500" }}>{i.title}</div>

              <div style={smallText}>
                {Array.isArray(i.desc)
                  ? i.desc.map((d, idx) => <div key={idx}>{d}</div>)
                  : i.desc}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const renderHRCard = (title, items) => {
  return (
    <div className="container-hover" style={card}>
      {items.map((i) => (
        <div key={i.title} data-guide={
            i.title === "Enrollments & Biometrics"
              ? "guide-enrollment-card"
              : i.title === "Attendance & Payroll"
              ? "guide-attendance-card"
              : i.title === "Recruitment & Exits"
              ? "guide-recruitment-card"
              : i.title === "Events & Meetings"
              ? "guide-events-card"
              : ""
          } style={listItem}>
          {/* ✅ ENTIRE ROW CLICKABLE */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleCardItemClick(i.link);
            }}
          >
            <div style={circle(i.color)} />

            <div className="title-hover" style={itemContent}>
              <div style={{ fontWeight: "500" }}>{i.title}</div>

              <div style={smallText}>
                {Array.isArray(i.desc)
                  ? i.desc.map((d, idx) => <div key={idx}>{d}</div>)
                  : i.desc}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


    const handleLogout = () => {
        // Add any logout logic like clearing tokens etc.
        navigate("/");   // Navigate to home page
    };

    const [showUnpaid, setShowUnpaid] = useState(false);
    const [UnpaidChats, setUnpaidChats] = useState([]);
    const [approvedChats, setApprovedChats] = useState([]);



    const handleApprove = (id) => {
        console.log("🟢 Approving chat ID:", id);
        axios
        .post("https://cleezoclass.com:5000/api/approve", { id })
        .then(() => {
            alert(`Chat ID ${id} approved`);
            console.log("✅ Approval successful for ID:", id);
            setUnpaidChats((prev) => prev.filter((chat) => chat.id !== id));
        })
        .catch((err) => console.error("❌ Error approving chat:", err));
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
        if (!e.target.closest(".bell-container")) setShowUnpaid(false);
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchUnpaid();
    }, []);
   useEffect(() => {
        fetchComplaints();
    }, []);
    // Effect to handle window resize for responsiveness
    useEffect(() => {
        const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

  const [selectedClassSection, setSelectedClassSection] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classSectionOptions, setClassSectionOptions] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [feeDetails, setFeeDetails] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const schoolCode = localStorage.getItem("schoolCode");

  const dropdownRef = useRef(null);
  useEffect(() => {
  function handleClickOutside(event) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);


const fetchExpenses = async (fromDate = "", toDate = "", expenseType = "") => {
  try {
    const params = new URLSearchParams({
      schoolCode,
      fromDate: fromDate ? new Date(fromDate).toISOString().split("T")[0] : "",
      toDate: toDate ? new Date(toDate).toISOString().split("T")[0] : "",
      expenseType: expenseType || "",
    });

    console.log("Fetching expenses with params=====================:", params.toString());

    const { data } = await axios.get(
      `https://cleezoclass.com:5000/expenses-superadmin?${params.toString()}`
    );

    if (data.success) {
      setExpenses(data.expenses);
      console.log("Expenses set:", data.expenses);
    }
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
  }
};


  const fetchMetadata = useCallback(async () => {
    if (!schoolCode) return;
    setDropdownLoading(true);
    try {
      const [classRes, sectionRes] = await Promise.all([
        axios.get(`${ADMIN_API_BASE}/classes`, { params: { schoolCode } }),
        axios.get(`${ADMIN_API_BASE}/sectionFilter`, { params: { schoolCode } }),
      ]);

      const classes = Array.isArray(classRes.data) ? classRes.data : [];
      const sections = Array.isArray(sectionRes.data) ? sectionRes.data : [];

      const classSet = new Set(classes.map((c) => c?.class_name ?? c).filter(Boolean).map(String));
      const optionsFromSections = sections
        .map((s) => {
          const cls = String(s?.class_name ?? "").trim();
          const sec = String(s?.section ?? "").trim();
          if (!cls || !sec) return null;
          return `${cls}-${sec}`;
        })
        .filter(Boolean);

      const options =
        optionsFromSections.length > 0
          ? [...new Set(optionsFromSections)]
          : [...classSet].map((cls) => `${cls}-A`);

      options.sort((a, b) => {
        const [classA, secA] = a.split("-");
        const [classB, secB] = b.split("-");
        const numA = parseInt(classA, 10);
        const numB = parseInt(classB, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA !== numB) return numA - numB;
        } else if (!isNaN(numA)) {
          return 1;
        } else if (!isNaN(numB)) {
          return -1;
        } else {
          const classCompare = classA.localeCompare(classB);
          if (classCompare !== 0) return classCompare;
        }
        return String(secA || "").localeCompare(String(secB || ""));
      });

      setClassSectionOptions(options);
    } catch (error) {
      console.error("Failed to load class-section options:", error);
      setClassSectionOptions([]);
    } finally {
      setDropdownLoading(false);
    }
  }, [schoolCode]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Fetch students of selected class
  useEffect(() => {
    if (!selectedClassSection) {
      setStudents([]);
      setSelectedStudent(null);
      return;
    }

    setFeeDetails(null);

    const [cls, sec] = selectedClassSection.split("-");
    setLoading(true);

    axios
      .get(
        `https://cleezoclass.com:5000/api/studentsName/${cls}?schoolCode=${schoolCode}&section=${sec}`
      )
      .then((res) => setStudents(res.data.students || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClassSection]);

  // Global search API
  useEffect(() => {
    if (!searchName) {
      setFilteredStudents([]);
      return;
    }

    setLoading(true);
    axios
      .get(
        `https://cleezoclass.com:5000/api/studentsByName?schoolCode=${schoolCode}&name=${searchName}`
      )
      .then((res) => setFilteredStudents(res.data.students || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [searchName]);

  // Select student + load fee info
 const handleStudentSelect = async (student) => {
  setSelectedStudent(student);
  setShowPopup(false);

  let currentClassSection = selectedClassSection;

  if (!currentClassSection) {
    currentClassSection = `${student.class_name}-${student.section}`;
    setSelectedClassSection(currentClassSection);
  }

  const [cls, sec] = currentClassSection.split("-");

  try {
    const schoolCode = localStorage.getItem("schoolCode");

    const classFeesPromise = axios.get(
      `https://cleezoclass.com:5000/api/feeDetailsByClassSection`,
      { params: { className: cls, section: sec, schoolCode } }
    );

    const studentFeesPromise = axios.post(
      `https://cleezoclass.com:5000/api/studentFees`,
      { studentId: student.id, schoolCode }
    );

    const [classRes, studentRes] = await Promise.allSettled([classFeesPromise, studentFeesPromise]);

    // Default fee object with zeros
    const defaultFees = {
      CompleteFee: 0,
      Admission_paid: 0,
      Paid_Amount: 0,
      books_paid: 0,
      uniform_paid: 0,
      bus_paid: 0,
      exam_paid: 0,
      others_paid: 0,
      Discount: 0,
      Installment1_Amount: 0,
      Installment1_Paid: 0,
      Installment1_Deadline_Date: "",
      Installment2_Amount: 0,
      Installment2_Paid: 0,
      Installment2_Deadline_Date: "",
      Installment3_Amount: 0,
      Installment3_Paid: 0,
      Installment3_Deadline_Date: "",
      Installment4_Amount: 0,
      Installment4_Paid: 0,
      Installment4_Deadline_Date: "",
      Installment5_Amount: 0,
      Installment5_Paid: 0,
      Installment5_Deadline_Date: "",
    };

    const classFeeData =
      classRes.status === "fulfilled" ? classRes.value.data.feeDetail || {} : {};
    const studentFeeData =
      studentRes.status === "fulfilled" ? studentRes.value.data.feeDetails || {} : {};

    const mergedFees = {
      ...defaultFees,           // start with zeros
      ...studentFeeData,         // overwrite with actual student-paid data if exists
      CompleteFee: classFeeData.CompleteFee || 0,
      Installment1_Deadline_Date: classFeeData.Installment1_Deadline_Date || "",
      Installment2_Deadline_Date: classFeeData.Installment2_Deadline_Date || "",
      Installment3_Deadline_Date: classFeeData.Installment3_Deadline_Date || "",
      Installment4_Deadline_Date: classFeeData.Installment4_Deadline_Date || "",
      Installment5_Deadline_Date: classFeeData.Installment5_Deadline_Date || "",
    };

    setFeeDetails(mergedFees);
    setShowPopup(true);
    setShowDropdown(false);
    setSearchName("");

  } catch (err) {
    console.error("Error fetching fee details:", err);
    // fallback: still show popup with zeros
    setFeeDetails({
      ...defaultFees,
      CompleteFee: 0,
    });
    setShowPopup(true);
  }
};
const thStyle = {
  padding: "10px",
  borderBottom: "2px solid #ddd",
  textAlign: "left",
  color: "#555",
  fontWeight: "600",
};

const tdStyle = {
  padding: "10px",
  textAlign: "left",
  color: "#333",
};

    return (
        <div style={outerContainer}>
            <div 
                className={popupComponent ? "blur-background-active" : ""} 
                style={container}
            >
                {/* Header */}
        <Header />
        

                {/* Welcome Section */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: isMobile ? "14px" : "16px",
                        fontWeight: "600",
                        marginBottom: "5px",
                        padding: isMobile ? "0 5px" : "0",
                            marginTop:'10px'

                    }}
                >
                    <div>
                        {name ? `Welcome ${name}..!` : "Welcome Chief!"}
                    </div>
                      <div style={{ display: "flex", gap: "15px", cursor: "pointer" }}>

      <div style={{ display: "flex", gap: "10px", marginBottom: "0" }}>
         <div className="expense-input-field">

        {/* CLASS - SECTION DROPDOWN */}
        <select
          value={selectedClassSection}
onChange={(e) => {
  setSelectedClassSection(e.target.value);
  setShowDropdown(true); // <-- AUTO-OPEN STUDENT DROPDOWN
  setSearchName("");     // optional: clear previous search
}}
className="btn-dropdown-FeesManagement"
disabled={dropdownLoading}
        >
          <option value=""> Class & Section</option>
          {dropdownLoading && <option value="" disabled>Loading...</option>}
          {classSectionOptions.map((opt) => {
            const [cls, sec] = opt.split("-");
            return (
              <option key={opt} value={opt}>
                {`Class ${cls} | Section ${sec}`}
              </option>
            );
          })}
        </select>
</div>
        {/* STUDENT SEARCHABLE DROPDOWN */}
        <div style={{ flex: 1, position: "relative" }}>
           <div className="expense-input-field">

         <input className="btn-dropdown-FeesManagement" 
               style={{ padding: "12px"}}

  type="text"
  placeholder="Search or select student"
  value={searchName || (selectedStudent ? selectedStudent.name : "")}
  onChange={(e) => {
    setSearchName(e.target.value);
    setSelectedStudent(null);   // <-- IMPORTANT FIX
  }}
  onFocus={() => setShowDropdown(true)}
/>
</div>

          {/* DROPDOWN LIST */}
{showDropdown && (
  <ul
    ref={dropdownRef}   // <-- ADD THIS
    style={{
      position: "absolute",
      width: "100%",
      background: "#fff",
      border: "1px solid #ccc",
      maxHeight: "520px",
      overflowY: "auto",
      padding: 0,
      margin: 0,
      listStyle: "none",
      zIndex: 1000,
overflowY: "auto",
fontSize:'10px',
textAlign:'left',
justifyContent:'flex-start'

    }}
  >
    {/* Class-based students when not searching */}
    {!searchName &&
      students.map((s) => (
        <li
          key={s.id}
          style={{
            padding: "8px",
            cursor: "pointer",
            borderBottom: "1px solid #eee",
          }}
          onClick={() => handleStudentSelect(s)}
        >
          {s.name}
        </li>
      ))}

    {/* Global search results */}
    {searchName &&
      filteredStudents.map((s) => (
        <li
          key={s.id}
          style={{
            padding: "8px",
            cursor: "pointer",
            borderBottom: "1px solid #eee",
          }}
          onClick={() => handleStudentSelect(s)}
        >
          {s.name} ({s.class_name}-{s.section})
        </li>
      ))}
  </ul>
)}
 
 
        </div>
      </div>
<div style={{ position: "relative" }}>
  <div
    className="bell-container"
    style={{ position: "relative", cursor: "pointer" }}
    onClick={() => {
      setShowUnpaid((prev) => !prev);
      if (!showUnpaid) {
        fetchUnpaid();
        fetchChiefReports();
            fetchComplaints();   // 🔔 ADD THIS
    fetchExpenses(); // 🔔 Add this

      }
    }}
  >
    <FontAwesomeIcon icon={faBell} style={{ fontSize: "24px", color: "#555" }} />

{(UnpaidChats.length > 0 || chiefReports.length > 0 || complaints.length > 0) && (
      <span
        style={{
          position: "absolute",
          top: "-4px",
          right: "-4px",
          width: "10px",
          height: "10px",
          backgroundColor: "red",
          borderRadius: "50%",
          border: "1px solid white",
          fontSize:'10px'
        }}
      ></span>
    )}

    {showUnpaid && (
      <div
        style={{
          position: "absolute",
          top: "35px",
          right: "0",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          width: "340px",
          maxHeight: "400px",
          overflowY: "auto",
          zIndex: 1000,
          fontSize:'10px',
          padding: "10px",
        }}
      >
        {/* Unpaid Section */}
        <h4 style={{ textAlign: "center" , fontSize:'22px', fontWeight:'bold'}}>Chat Approval Requests</h4>
        {UnpaidChats.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            No Unpaid Requests
          </p>
        ) : (
          UnpaidChats.map((chat) => (
            <div
              key={chat.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "10px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{chat.party1_name}</strong> →{" "}
                {chat.party2_student || "Group"}
                <div style={{ fontSize: "12px", color: "#777" }}>
                  {new Date(chat.date).toLocaleDateString()} | {chat.time}
                </div>
              </div>
              <button
                onClick={() => handleApprove(chat.id)}
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#5a7488",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Approve
              </button>
            </div>
          ))
        )}

        <hr style={{ margin: "10px 0" }} />

        {/* Fee Reports Section */}
        <h4 style={{ textAlign: "center" , fontSize:'22px',fontWeight:'bold'}}>Fee Reports from Accounts</h4>
        {chiefReports.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            No Fee Reports
          </p>
        ) : (
          chiefReports.map((report) => (
            <div
              key={report.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "10px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "left",
              }}
            >
              <div>
                <strong>{report.report_type}</strong>
                <div style={{ fontSize: "12px", color: "#777" }}>
{new Date(report.from_date).toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})} {' to '} {new Date(report.to_date).toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})}
           </div>
              </div>
              <button
onClick={() => openReportModal(report.data)}
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#5a7488",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                View
              </button>
            </div>
          ))
          
        )}
        <hr style={{ margin: "10px 0" }} />

{/* Complaints & Reports Section */}
 <h4 style={{ textAlign: "center" , fontSize:'18px',fontWeight:'bold'}}>Teacher  Performance Reports & Complaints</h4>

{complaints.length === 0 ? (
  <p style={{ textAlign: "center", color: "#666" }}>
    No Complaints / Reports
  </p>
) : (
  complaints.map((c) => (
    <div
      key={c.id}
      style={{
        borderBottom: "1px solid #eee",
        padding: "10px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height:'20%'
      }}
    >
      <div>
        <strong>
          {c.type === "teacher_report" ? "Teacher Report" : "Admin Complaint"}
        </strong>
        <div style={{ fontSize: "12px", color: "#777" }}>
          {c.teacher ? `Teacher: ${c.teacher}` : "General Complaint"}
        </div>
        <div style={{ fontSize: "11px", color: "#aaa" }}>
          {new Date(c.created_at).toLocaleString()}
        </div>
      </div>

      <button
        onClick={() => openComplaintModal(c)}
        style={{
          padding: "6px 10px",
          backgroundColor: "#5a7488",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        View
      </button>
    </div>
  ))
)}
{complaint.map(c => (
  <tr key={c.id} className="event-table-row">
    <td>
      <div className="event-complaint-title">
        🚨 Complaint from {c.party1_name}
      </div>

      <div className="event-flex-row">
        <div>
          <strong>Session:</strong> {c.session_id}
        </div>
        <div>
          <strong>Status:</strong> {c.status}

        </div>
        <div>
                    <strong>Complaint:</strong> {c.complaint_text}
</div>
      </div>


      {/* {c.status === "Pending" && (
        <button
          className="btn-solid"
          onClick={() => alert("Resolve API can be added")}
        >
          Resolve
        </button>
      )} */}
    </td>
  </tr>
))}
<hr style={{ margin: "10px 0" }} />

<h4 style={{ textAlign: "center", fontSize: '18px', fontWeight: 'bold' }}>Expenses</h4>

{expenses.length === 0 ? (
  <p style={{ textAlign: "center", color: "#666" }}>
    No Expenses
  </p>
) : (
  expenses.map((exp) => (
    <div
      key={exp.expense_id}
      style={{
        borderBottom: "1px solid #eee",
        padding: "8px 0",
        fontSize: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <strong>{exp.expense_type}</strong>
        <div style={{ fontSize: "11px", color: "#777" }}>
          {new Date(exp.expense_date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </div>
      </div>
      <div>
        <strong>₹{exp.amount}</strong>
      </div>
    </div>
  ))
)}

      </div>
    )}
  </div>
</div>
{selectedComplaint && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000
    }}
  >
    <div
      style={{
        backgroundColor: "#fff",
        padding: "20px 25px",
        borderRadius: "12px",
        width: "400px",
        maxWidth: "90%",
        boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        animation: "fadeIn 0.3s ease"
      }}
    >
      <h3 style={{ marginBottom: "15px", color: "#333", textAlign: "center" }}>
        {selectedComplaint.type === "teacher_report"
          ? "Teacher Report"
          : "Complaint"}
      </h3>

      <p style={{ margin: "6px 0", fontSize: "14px" }}>
        <strong>Teacher:</strong> {selectedComplaint.teacher || "-"}
      </p>
      <p style={{ margin: "6px 0", fontSize: "14px" }}>
        <strong>Subject:</strong> {selectedComplaint.subject || "-"}
      </p>
      <p style={{ margin: "6px 0", fontSize: "14px" }}>
        <strong>Classes:</strong> {selectedComplaint.classes || "-"}
      </p>
      <p style={{ margin: "10px 0", fontSize: "14px", color: "#444" }}>
        <strong>Message:</strong>
        <br />
        {selectedComplaint.message}
      </p>

      <div style={{ textAlign: "right", marginTop: "15px" }}>
        <button
          onClick={closeComplaintModal}
          style={{
            padding: "8px 14px",
            backgroundColor: "#5a7488",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px"
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


{showPopup && (
  <div
    className="popup-overlay"
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
    }}
  >
    <div
      className="popup-card"
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "20px",
        width: "80%",
        maxWidth: "700px",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        animation: "fadeIn 0.3s ease-in-out",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          marginBottom: "15px",
          color: "#333",
          fontSize: "20px",
        }}
      >
        {popupTitle}
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Class</th>
            <th style={thStyle}>Due</th>
          </tr>
        </thead>
        <tbody>
          {popupData.map((stu, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
              <td style={tdStyle}>{stu.StudentName}</td>
              <td style={tdStyle}>{stu.Class_name}</td>
              <td style={{ ...tdStyle, color: "#d9534f", fontWeight: "600" }}>
                ₹{stu.Total_Paid}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: "right", marginTop: "15px" }}>
        <button
          onClick={() => setShowPopup(false)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#5a7488",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

                </div>
</div>


                {/* Commerce and Operations Grid */}
                <div style={grid}>
                   <div style={{ flex: isMobile ? "1 1 100%" : 6 }}>
  <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px"
      }}
    >
      {/* Left */}
      <div className="title-heading">Commerce</div>

      {/* Right */}
      <div
        className="title-heading1"
        style={{ cursor: "pointer", color: "#000",fontSize:'14px' }}
        onClick={() => navigateFromChief("/AccountantDashboard")}
      >
        Go to Dashboard
      </div>
    </div>

  <div
    className="container-hover"
    style={{ ...card, borderLeft: "8px solid rgba(158, 165, 172, 1)" }}
  >
    {/* ⭐ TOP — FROM / TO DATE FILTER */}
    <div
      style={{
        fontSize: "14px",
        marginBottom: "10px",
        textAlign: "left",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      {/* LEFT SIDE TITLE */}
      <span style={{ flex: 1 }}>
        Total Term Fees: {fromDate} to {toDate}
      </span>

      {/* RIGHT SIDE DATE INPUTS */}
     {/* ⭐ TOP — FROM / TO DATE FILTER (ONE BELOW THE OTHER) */}
<div
  style={{
    fontSize: "10px",
    marginBottom: "10px",
    textAlign: "left",
    display: "flex",
    flexDirection: "row",   // ✅ CHANGE HERE
    gap: "40px",            // space between From & To
    alignItems: "center",
    marginTop: "30px"
  }}
>

  {/* FROM DATE */}
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <label>From:</label>
    <div className="expense-input-field">
      <input
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="btn-dropdown-FeesManagement"
      />
    </div>
  </div>

  {/* TO DATE */}
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <label>To:</label>
    <div className="expense-input-field">
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="btn-dropdown-FeesManagement"
      />
    </div>
  </div>

</div>

    </div>

    {/* ⭐ MIDDLE — CHART + COMMERCE ITEMS */}
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        flex: 1,
        gap: "20px",
        marginTop: "10px",
      }}
    >
      {/* LEFT — LINE CHART */}
      <div
        style={{
          flex: isMobile ? "1 1 100%" : 7,
          height: isMobile ? "200px" : "250px",
        }}
      >
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={chartData}>
            <XAxis dataKey="label" fontSize={isMobile ? 10 : 12} />
            <YAxis fontSize={isMobile ? 10 : 12} />
            <Tooltip />

            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                width: "100%",
                fontSize: isMobile ? 10 : 12,
              }}
            />

            <Line
              type="monotone"
              dataKey="Paid"
              stroke="#6CA6FF"
              strokeWidth={3}
            />
            <Line
              type="monotone"
              dataKey="Unpaid"
              stroke="#9C6262"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* TOTALS BELOW CHART */}
        <div style={{ width: "100%", textAlign: "center", marginTop: "0px" }}>
          <span style={{ color: "#333", marginRight: "20px" }}>
            ₹{finalPaid.toLocaleString("en-IN")}
          </span>
          <span style={{ color: "#333" }}>
            ₹{finalUnpaid.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div
        style={{
          flex: isMobile ? "1 1 100%" : 3,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginTop: isMobile ? "20px" : "0",
        }}
      >
        {commerceItems.map((i) => (
          <div
            key={i.title}
            data-guide={
    i.title === "Income"
      ? "guide-income-card"
      : i.title === "Expense"
      ? "guide-expense-card"
      : ""
  }
            style={{ ...listItem, fontSize: isMobile ? "10px" : "12px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div style={circle(i.color)}></div>

              <div className="title-hover" style={itemContent}>
                {/* TITLE CLICK */}
                <div
                  style={{ fontWeight: "500", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardItemClick(i.link);
                  }}
                >
                  {i.title}
                </div>

                <div
                  style={{
                    ...smallText,
                    fontSize: isMobile ? "8px" : "8px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  {i.desc.map((d, idx) => (
                    <div key={idx} style={{ whiteSpace: "nowrap" }}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

                    <div style={{ flex: isMobile ? "1 1 100%" : 4 }}>
  <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px"
      }}
    >
      {/* Left */}
      <div className="title-heading">Operations</div>

      {/* Right */}
      <div
        className="title-heading1"
        style={{ cursor: "pointer", color: "#000",fontSize:'14px' }}
        onClick={() => navigateFromChief("/AdminDashboard")}
      >
        Go to Dashboard
      </div>
    </div>
                        <div> 
                            {/* Operations card will now handle its own item clicks */}
                            {renderCard("Operations", operationsItems)}
                        </div>

                    </div>
                </div>
                {/* Marketing and HR Grid */}
                <div style={grid}>
                    <div style={{ flex: isMobile ? "1 1 100%" : 6 ,}}>
  <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0"
      }}
    >
      {/* Left */}
      <div className="title-heading">Front Desk</div>

      {/* Right */}
      <div
        className="title-heading1"
        style={{ cursor: "pointer", color: "#000" , fontSize:'14px'}}
        onClick={() => navigateFromChief("/FrontDeskDashboard")}
      >
        Go to Dashboard
      </div>
    </div>
                        <div className="container-hover" style={{ ...card, borderLeft: "8px solid #738368ff", }}>
                            {renderCard("Marketing", marketingItems, "/marketing", true)}
                        </div>
                    </div>
                    <div style={{ flex: isMobile ? "1 1 100%" : 4 }}>
  <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0px"
      }}
    >
      {/* Left */}
      <div className="title-heading">HR</div>

      {/* Right */}
      <div
        className="title-heading1"
        style={{ cursor: "pointer", color: "#000" ,fontSize:'14px'}}
        onClick={() => navigateFromChief("/HRDashboard")}
      >
        Go to Dashboard
      </div>
    </div>
                        <div>
                            {renderHRCard("HR", hrItems, "/RecruitmentDashboard")}
                        </div>
                    </div>
                </div>
            </div>
   {showPopup && selectedStudent && feeDetails && (
<div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
    onClick={() => setShowPopup(false)}
  >
    <div
      style={{
          background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "45vw",  // 45% of the viewport width
    height: "100vh", // Full viewport height
    overflowX: "auto",
    overflowY: "auto",
    maxWidth:'900px',
  minWidth:'900px'

      }}
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
    >
  {/* Close button at top-right */}
  <button
    onClick={() => setShowPopup(false)}
    className="actionBtnStyle"
    style={{
      position: "absolute",
      top: "0",
      right: "0",
      padding: "8px 12px",
      border: "none",
      color: "#f44336",
      borderRadius: "4px",
      cursor: "pointer",
      backgroundColor:'transparent'
    }}
  >
    <i className="fa fa-times" style={{ marginRight: 6 }}></i>
  </button>

  {/* RENDER ReportCard component, passing dynamic data */}
  <ReportCard 
    studentData={selectedStudent} 
    feeData={feeDetails} 
  />
</div>

  </div>
)}

         {popupComponent && (
  <div
    onClick={() => setPopupComponent(null)}
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      zIndex: 2000,
    }}
  >
    <div
      ref={popupContentRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff",
        maxWidth: "1100px",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",
        transformOrigin: "center",
        transform:
          window.innerWidth <= 1280
            ? "scale(0.75)"
            : window.innerWidth <= 1366
            ? "scale(0.85)"
            : "scale(1)",
        width:
          window.innerWidth <= 1280
            ? "133.3%"
            : window.innerWidth <= 1366
            ? "117.6%"
            : "100%",
        position: "relative",
      }}
    >
      <button
        className="globalpopup-close-btn"
        onClick={() => setPopupComponent(null)}
        style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          background: "red",
          color: "#fff",
          padding: "6px 14px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Close
      </button>

      <div style={{ marginTop: "40px" }}>{popupComponent}</div>
    </div>
  </div>
)}
 
        </div>
    );
};

export default Dashboard;
