import { ArrowLeft, ChevronRight, Circle, Download, Share } from "lucide-react";
import { CheckCircle, Star } from "lucide-react";
import React, { useContext, useEffect, useRef, useState,useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Link, useNavigate, useLocation } from "react-router-dom"; // CORRECTED: Added useLocation
import PaidAmountdemo from "./Accountant_commerce_income_GenerateBill";
import './Payment.css'
import ErrorPopup from "../shared/ErrorPopup";
const API_BASE = 'https://cleezoclass.com:4000/api/admin';
const API_BASE_URL = "https://cleezoclass.com:4000"; 
const schoolLogo = ""; // Optional custom logo
const OTHER_PAYMENT_MODE_MAX_LENGTH = 50;
const normalizeClassLabel = (value) =>
  String(value || "").replace(/^Class\s+/i, "").trim();

const normalizeOverdueFeeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\bfees?\b/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

const parseOverdueDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const isOverdueDate = (value) => {
  const deadline = parseOverdueDate(value);
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadline < today;
};

const calculateInstallmentOverdue = (rows = []) =>
  (Array.isArray(rows) ? rows : []).reduce((sum, row) => {
    const amount = Number(row?.amount ?? row?.Amount ?? row?.originalAmount ?? 0);
    const paid = Number(row?.paid ?? row?.Paid ?? 0);
    const deadlineDate =
      row?.deadlineDate ||
      row?.dueDate ||
      row?.Deadline_Date ||
      row?.date ||
      "";

    if (!isOverdueDate(deadlineDate) || paid >= amount) return sum;
    return sum + Math.max(amount - paid, 0);
  }, 0);

const PayementDemo = ({
  className: propClassName,
  sectionName: propSectionName,
  popupOnly = false,
  popupTheme = "payment",
  initialStudentId = null,
  initialStudentName = "",
  onPopupClose = null,
  onPaymentSuccess = null,
}) => {
  // CORRECTED: Added useLocation hook call
  const location = useLocation();

  // ... more state declarations ...
const [popupMsg, setPopupMsg] = useState("");
  const [classList, setClassList] = useState([]);
  const [sectionMap, setSectionMap] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  // Call useLocation to access the navigation state
// Try props first, then fallback to localStorage, otherwise empty string
const initialClassSection =
  (propClassName && propSectionName)
    ? `${propClassName}_${propSectionName}`
    : localStorage.getItem("selectedClassSection") || "";

const [selectedClassSection, setSelectedClassSection] = useState(initialClassSection);

// Parse class and section from props or localStorage
const [className, setClassName] = useState(
  propClassName || localStorage.getItem("className") || ""
);
const [section, setSection] = useState(
  propSectionName || localStorage.getItem("section") || ""
);

  // useEffect to retrieve class and section from state and set the combined value
  useEffect(() => {
    if (location.state) {
      const { className: stateClass, sectionName: stateSection } = location.state;
      if (stateClass && stateSection) {
        // Set the combined value based on navigation state
        setSelectedClassSection(`${stateClass}_${stateSection}`);
        setClassName(stateClass);
        setSection(stateSection);
      } else if (stateClass) {
        setClassName(stateClass);
      }
      if (stateSection) {
        setSection(stateSection);
      }
      // Log for confirmation (optional)
    }
  }, [location.state]);

  const [activeInstallmentPopup, setActiveInstallmentPopup] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  //   const logoSrc = schoolLogo || "/default-logo.png";
  const dateInputRef = useRef(null);
  const [studentData, setStudentData] = useState(null);
  const [feeStructure, setFeeStructure] = useState({
    academicFee: 0,
    uniformFee: 0,
    bookFee: 0,
    transportFee: 0,
    labFee: 0,
    miscellaneousFee: 0,
    hostelFee: 0,
    messFee: 0,
    completeFee: 0,
  });
  const [feeStructureRaw, setFeeStructureRaw] = useState({});
  const [selectedStudentFeeDetails, setSelectedStudentFeeDetails] = useState(null);
 // Convert number → "1,23,456.00"
const formatAmount = (value) => {
  if (value === "" || value === null || isNaN(value)) return "";
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getStudentLookupId = (student = {}) =>
  String(
    student?.id ||
      student?.studentId ||
      student?.student_id ||
      student?._id ||
      student?.StudentId ||
      student?.Student_ID ||
      ""
  ).trim();

const unformatAmount = (value) => {
  if (!value) return "";
  return value.replace(/,/g, "");
};

  const [finalAmount, setFinalAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  // const [selectedClass, setSelectedClass] = useState("nursery");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showPreviewDropdown, setShowPreviewDropdown] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [receiptNumber, setReceiptNumber] = useState('001');
  const [initialReceiptSet, setInitialReceiptSet] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
const [transactionId, setTransactionId] = useState("");
const [otherPaymentMode, setOtherPaymentMode] = useState("");
  const [payments, setPayments] = useState(null);
  const [generatedBills, setGeneratedBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableBill, setEditableBill] = useState(null);
  const [examFee, setExamFee] = useState(0);
  const [busFee, setBusFee] = useState(0);
  const [bookFee, setBookFee] = useState(0);
  const [uniformFee, setUniformFee] = useState(0);
  const [othersFee, setOthersFee] = useState(0);
  const [residentialFee, setResidentialFee] = useState(0);
  const [tuitionFee, setTuitionFee] = useState(0);
  const [tuitionPaid, setTuitionPaid] = useState(0);
  const [examPaid, setExamPaid] = useState(0);
  const [busPaid, setBusPaid] = useState(0);
  const [bookPaid, setBookPaid] = useState(0);
  const [uniformPaid, setUniformPaid] = useState(0);
  const [othersPaid, setOthersPaid] = useState(0);
  const [residentialPaid, setResidentialPaid] = useState(0);
  const contentRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeInstallmentBridge, setFeeInstallmentBridge] = useState({});
  const [dynamicFeeTypes, setDynamicFeeTypes] = useState([]);
  const [dynamicFeeValues, setDynamicFeeValues] = useState({});
  const [task, setTask] = useState("");
  const [sending, setSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
  const dashboardRef = useRef(null);
  const [employeeId, setEmployeeId] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState("");
  const [presentDays, setPresentDays] = useState(0);
  const [halfDays, setHalfDays] = useState(0);
  const [baseSalary, setBaseSalary] = useState("");
  const [totalSalary, setTotalSalary] = useState(null);
  const [salaryDate, setSalaryDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [deductions, setDeductions] = useState(0.0);
  const [bonuses, setBonuses] = useState(0.0);
  const [salaryMonth, setSalaryMonth] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [institutionData, setInstitutionData] = useState(null);
  const [logo, setLogo] = useState(null);
  const navigate = useNavigate();
  const [incomeType, setIncomeType] = useState("fees");

  const [distance, setDistance] = useState("");
  const [feesExam, setFeesExam] = useState("");
  const [feesBus, setFeesBus] = useState("");
  const [feesUniform, setFeesUniform] = useState("");
  const [feesBooks, setFeesBooks] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [donationDate, setDonationDate] = useState("");
  const [investmentName, setInvestmentName] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");
  const [other, setOther] = useState("");
  const [message, setMessage] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeContent, setActiveContent] = useState(null);
  const [feeType, setFeeType] = useState("");
  const [discount, setDiscount] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState("");
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  // CORRECTED: Fixed TypeError by wrapping the array in useState()
  const [feeEntries, setFeeEntries] = useState([{ type: "", amount: "" }]);
  const [feesList, setFeesList] = useState([]); // Stores all selected fees
  // NEW STATE: To manage the active tab in the right container
  const [activeTab, setActiveTab] = useState("feesCollection"); 
  const [fees, setFees] = useState({
    tuition: 0, // Main tuition fee
    exam: 0, // Examination fee
    bus: 0, // Bus transportation fee
    uniform: 0, // Uniform fee
    books: 0, // Books and materials fee
    other: 0, // Miscellaneous fees
    residential: 0, // Residential fee
  });
 
useEffect(() => {
  if (selectedStudentId) {
    setShowModal(true);
  }
}, [selectedStudentId]);

useEffect(() => {
  const schoolCode = localStorage.getItem("schoolCode");
  const selectedName = String(selectedStudent || initialStudentName || "").trim();
  const selectedClass = String(className || "").trim();
  const selectedSection = String(section || "").trim();

  if (!schoolCode || !selectedName || !selectedClass || !selectedSection) {
    setSelectedStudentFeeDetails(null);
    return;
  }

  let isCancelled = false;

  const normalizeStudentName = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const getStudentFeeScore = (row) => {
    const scoreFields = [
      "tution_installment_1",
      "tution_installment_1_paid",
      "tution_installment_2",
      "tution_installment_2_paid",
      "tuition_installment_1",
      "tuition_installment_1_paid",
      "tuition_installment_2",
      "tuition_installment_2_paid",
      "uniform",
      "uniformFee",
      "Uniform_Fee",
      "uniform_paid",
      "Uniform_paid",
      "admission",
      "Admission_Fee",
      "exam",
      "Exam_Fee",
      "bus",
      "Bus_Fee",
      "books",
      "Book_Fee",
      "other",
      "Other_Fee",
      "residential",
      "ResidentialCompleteFee",
    ];

    return scoreFields.reduce((sum, field) => {
      const value = Number(row?.[field]);
      return sum + (Number.isFinite(value) && value > 0 ? value : 0);
    }, 0);
  };

  const normalizeStudentId = (value) => String(value || "").trim();

  const getMatchingStudentFeeRows = (rows) => {
    const normalizedSelectedName = normalizeStudentName(selectedName);
    const normalizedSelectedId = normalizeStudentId(selectedStudentId || initialStudentId);
    return rows.filter((row) => {
      const rowName = normalizeStudentName(row?.StudentName || row?.studentName || row?.name || "");
      const rowId = normalizeStudentId(row?.id || row?.studentId || row?.StudentId || row?.student_id);
      const nameMatches = rowName === normalizedSelectedName;
      const idMatches =
        normalizedSelectedId && rowId && rowId === normalizedSelectedId;

      return nameMatches || idMatches;
    });
  };

  const pickBestStudentFeeRow = (rows) => {
    const matchedRows = getMatchingStudentFeeRows(rows);

    if (!matchedRows.length) return null;

    return matchedRows
      .slice()
      .sort((a, b) => getStudentFeeScore(b) - getStudentFeeScore(a))[0] || null;
  };

  axios
    .get("https://cleezoclass.com:4000/api/student-fee-details", {
      params: {
        schoolCode,
        class: selectedClass,
        section: selectedSection,
        name: selectedName,
      },
    })
    .then((res) => {
      if (isCancelled) return;

      const payload = res?.data;
      const normalizedSelectedName = normalizeStudentName(selectedName);
      const matchedPayloadRows = Array.isArray(payload)
        ? getMatchingStudentFeeRows(payload)
        : [];
      const resolvedDetails = Array.isArray(payload)
        ? pickBestStudentFeeRow(payload)
        : (() => {
            const candidate =
              payload?.studentDetails ||
              payload?.FeesDetails ||
              payload?.feeDetails ||
              payload ||
              null;
            const candidateName = normalizeStudentName(
              candidate?.StudentName || candidate?.studentName || candidate?.name || ""
            );
            return candidateName === normalizedSelectedName ? candidate : null;
          })();
      const resolvedStudentFeeDetails = Array.isArray(payload)
        ? resolvedDetails
          ? {
              ...resolvedDetails,
              studentDetails: resolvedDetails,
              studentDetailRows: matchedPayloadRows,
            }
          : null
        : resolvedDetails
          ? {
              ...payload,
              ...resolvedDetails,
              feeStructure: payload?.feeStructure || {},
              studentDetails: resolvedDetails,
              studentDetailRows: Array.isArray(payload?.studentDetailRows)
                ? payload.studentDetailRows
                : [],
            }
          : null;
      const rawStudentFeeRows = Array.isArray(payload)
        ? payload
        : [
            ...(Array.isArray(payload?.studentDetailRows) ? payload.studentDetailRows : []),
            ...(Array.isArray(payload?.studentDetails) ? payload.studentDetails : []),
            ...(Array.isArray(payload?.feeDetails) ? payload.feeDetails : []),
            ...(Array.isArray(payload?.FeesDetails) ? payload.FeesDetails : []),
            ...(Array.isArray(payload?.data) ? payload.data : []),
            ...(Array.isArray(payload?.rows) ? payload.rows : []),
            ...(payload?.studentDetails && !Array.isArray(payload.studentDetails) ? [payload.studentDetails] : []),
            ...(payload?.feeDetails && !Array.isArray(payload.feeDetails) ? [payload.feeDetails] : []),
            ...(payload?.FeesDetails && !Array.isArray(payload.FeesDetails) ? [payload.FeesDetails] : []),
          ];
      const studentFeePaidFields = rawStudentFeeRows.map((row, rowIndex) => ({
        rowIndex,
        studentName: row?.StudentName || row?.studentName || row?.name || "",
        paidFields: Object.entries(row || {}).filter(
          ([key, value]) => /installment.*paid|paid.*installment/i.test(key) && value !== undefined && value !== null
        ),
      }));

      console.log("[PaymentDebug] student-fee-details", {
        selectedName,
        selectedClass,
        selectedSection,
        payloadIsArray: Array.isArray(payload),
        payloadRows: Array.isArray(payload) ? payload.length : undefined,
        matchedRows: matchedPayloadRows.length,
        resolvedDetails,
        resolvedStudentFeeDetails,
        studentFeePaidFields,
      });

      setSelectedStudentFeeDetails(resolvedStudentFeeDetails);
    })
    .catch((error) => {
      console.error("[Payment][student-fee-details] fetch failed", error?.response?.data || error?.message || error);
      if (!isCancelled) setSelectedStudentFeeDetails(null);
    });

  return () => {
    isCancelled = true;
  };
}, [className, initialStudentName, section, selectedStudent]);

useEffect(() => {
  const schoolCode = localStorage.getItem("schoolCode");
  const selectedName = String(selectedStudent || initialStudentName || "").trim();
  const selectedClass = String(className || "").trim();
  const selectedSection = String(section || "").trim();

  if (!schoolCode || !selectedName || !selectedClass || !selectedSection) {
    setFeeInstallmentBridge({});
    return;
  }

  let isCancelled = false;

  axios
    .get(`${API_BASE_URL}/api/fees-details-installments`, {
      params: {
        schoolCode,
        className: selectedClass,
        section: selectedSection,
        studentName: selectedName,
      },
    })
    .then((res) => {
      if (isCancelled) return;
      setFeeInstallmentBridge(res.data && typeof res.data === "object" ? res.data : {});
    })
    .catch((error) => {
      console.error("[Payment][fees-details-installments] fetch failed", error?.response?.data || error?.message || error);
      if (!isCancelled) setFeeInstallmentBridge({});
    });

  return () => {
    isCancelled = true;
  };
}, [className, initialStudentName, section, selectedStudent]);

  const [showReceipt, setShowReceipt] = useState(false);
const [showPaymentPopup, setShowPaymentPopup] = useState(false);
// Save receipt number to DB
  // Fetch last receipt number from DB

// Helper function to safely convert Buffer data (Uint8Array) to a clean path string
const bufferToPathString = (bufferData) => {
  if (!bufferData) return "";
  try {
    const bytes = new Uint8Array(bufferData);
    let pathString = "";
    // Converts Uint8Array (bytes) to a string
    for (let i = 0; i < bytes.byteLength; i++) {
      pathString += String.fromCharCode(bytes[i]);
    }
    // Clean up potential null bytes (\u0000) and trim whitespace
    return pathString.trim().replace(/\u0000/g, ''); 
  } catch (error) {
    console.error("Error converting buffer to string (path):", error);
    return ""; // Return empty string on error
  }
};
 const [showBusFeePopup, setShowBusFeePopup] = useState(false);
const [busFeeStudents, setBusFeeStudents] = useState([]);
const [showIndividualStudentPopup, setShowIndividualStudentPopup] = useState(false);
  const currentReceiptNumberRef = useRef(receiptNumber);

  const [installmentCount, setInstallmentCount] = useState();
  const [installmentsPaid, setInstallmentsPaid] = useState({
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
});

const handleAddInstallments = () => {
  if (fees.tuition <= 0) {
    displayToast("Tuition fee must be greater than zero.", "error");
    return;
  }
 
  if (installmentCount <= 0) {
    displayToast("Installment count must be greater than zero.", "error");
    return;
  }
 
  const total = fees.tuition;
  const rawAmount = total / installmentCount;
  
  // Calculate the base amount (rounded down to nearest 100)
  const baseAmount = Math.floor(rawAmount / 100) * 100; // 10300 for 10333.33
  
  // Calculate the remainder that needs to be distributed
  const remainder = total - (baseAmount * installmentCount);
  
  // Build installments
  const newInstallments = Array.from({ length: installmentCount }, (_, index) => {
    const amount = index === 0 
      ? baseAmount + remainder 
      : baseAmount;
      
    return {
      id: index + 1,
      amount: parseFloat(amount.toFixed(2)),
      date: new Date(new Date().setMonth(new Date().getMonth() + index + 1)).toISOString().split('T')[0],
    };
  });
 
  setInstallments(newInstallments);
};
 
   const handleSaveClassInstallments = async () => {
    try {
      if (!className || !section) {
        displayToast(' Please select both a class and a section.', 'error');
        return;
      }
      const schoolCode = localStorage.getItem('schoolCode');
      if (!schoolCode) {
        throw new Error('School code not found in localStorage');
      }
      const updateData = {
        schoolCode,
        FeeClass: className,
        FeeSection: section,
        UpdatedCompleteFee: tuitionFee,
      };
 
      installments.forEach((installment, index) => {
        updateData[`Installment${index + 1}_Amount`] = installment.amount;
        updateData[`Installment${index + 1}_Deadline_Date`] = installment.date;
        updateData[`Installment${index + 1}_Fine`] = 0;
      });
 
      for (let i = installments.length; i < 5; i++) {
        updateData[`Installment${i + 1}_Amount`] = null;
        updateData[`Installment${i + 1}_Deadline_Date`] = null;
        updateData[`Installment${i + 1}_Fine`] = null;
      }
 
      const response = await fetch('https://cleezoclass.com:4000/api/installmentdetails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save class installments');
      }
 
      displayToast('✅ Installments for the class/section saved successfully!', 'success');
      setShowInstallmentModal(false);
    } catch (error) {
      console.error('Error saving class installments:', error);
      displayToast(error.message || 'Error saving class installments. Please try again.', 'error');
    }
  };
const [admissionRemaining, setAdmissionRemaining] = useState(0);
const [tuitionRemaining, setTuitionRemaining] = useState(0);
const [busRemaining, setBusRemaining] = useState(0);
const [examRemaining, setExamRemaining] = useState(0);
const [bookRemaining, setBookRemaining] = useState(0);
const [uniformRemaining, setUniformRemaining] = useState(0);
const [othersRemaining, setOthersRemaining] = useState(0);
const [residentialRemaining, setResidentialRemaining] = useState(0);


    const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
   const displayToast = (message, type) => {
    setToast({ show: true, message, type });
    // The ToastNotification component itself handles auto-hide via its useEffect
  };
 
const handleSubmit = async (event) => {
    event.preventDefault();
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
 
 
    if (!incomeType) {
      displayToast("❗ Please select an income type.", "error");
      return;
    }
 
    let incomeData = {
      income_type: incomeType,
      schoolCode: schoolCode,
    };
 
   if (incomeType === 'fees') {
  if (!className || !section) {
    displayToast("❗ Please select Class and Section for fees income.", "error");
    return;
  }
 
  // Ensure all amounts are numbers
  const sanitizedFeeEntries = feeEntries
    .filter(entry => entry.type && entry.amount !== '')
    .map(entry => ({
      type: entry.type,
      amount: parseFloat(entry.amount) || 0
    }));
 
  // Build fees object dynamically from sanitizedFeeEntries
  const calculatedFees = {};
  sanitizedFeeEntries.forEach(entry => {
    calculatedFees[entry.type] = entry.amount;
  });
 
  incomeData = {
    ...incomeData,
    class_name: className,
    class_section: section,
    ...calculatedFees,      // all fee types as keys
    feeEntries: sanitizedFeeEntries
  };
 
}
 
else if (incomeType === 'donations') {
      if (!donorName || !donationAmount || !donationDate) {
        displayToast("❗ Please fill out all fields for Donations (Name, Amount, Date).", "error");
        return;
      }
 
      incomeData = {
        ...incomeData,
        donor_name: donorName,
        donation_amount: parseFloat(donationAmount) || 0,
        donation_date: donationDate
      };
 
    } else if (incomeType === 'investments') {
      if (!investmentName || !investmentAmount || !investmentDate) {
        displayToast("❗ Please fill out all fields for Investments (Name, Amount, Date).", "error");
        return;
      }
 
      incomeData = {
        ...incomeData,
        investor_name: investmentName,
        investment_amount: parseFloat(investmentAmount) || 0,
        investment_date: investmentDate
      };
 
    } else if (incomeType === 'other') {
      if (!other) {
        displayToast("❗ Please enter the amount for Other Income.", "error");
        return;
      }
 
      incomeData = {
        ...incomeData,
        other_amount: parseFloat(other) || 0
      };
 
    } else if (incomeType === 'installments') {
        if (!className || !section) {
            displayToast("❗ Please select Class and Section for installments.", "error");
            return;
        }
        await handleSaveClassInstallments();
        displayToast('✅ Installments saved for the selected class/section!', 'success');
        return;
    }
 
    try {
      const response = await axios.put('https://cleezoclass.com:4000/income', incomeData);
      
      let successMessage = `✅ Income data added successfully for school: ${schoolCode}!`;
      if (incomeType === 'fees') {
        successMessage = `✅ Fees submitted successfully for Class ${className} Section ${section}!`;
      }
      displayToast(successMessage, "success");
 
      // Reset form fields after successful submission
      setClassName('');
      setSection('');
      setDistance('');
      setFees({ tuition: 0, exam: 0, bus: 0, uniform: 0, books: 0, other: 0, admission: 0, residential: 0 });
      setFeeEntries([{ type: '', amount: '' }]);
      setDonorName('');
      setDonationAmount('');
      setDonationDate('');
      setInvestmentName('');
      setInvestmentAmount('');
      setInvestmentDate('');
      setOther('');
      setIncomeType('fees');
 
    } catch (error) {
      console.error('[DEBUG] Error submitting income data:', error);
      displayToast(`❌ Error submitting income data: ${error.response?.data?.message || error.message}`, "error");
    }
};
 const [selectedBusStudent, setSelectedBusStudent] = useState(null);
 
  const handleBusFeeSelect = async () => {
  if (!className || !section) {
    displayToast('Please select both class and section', "error");
    return;
  }
  try {
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
    // Strip "Class " from className if present
    const apiClassName = className.replace("Class ", "");
    const response = await axios.get(`https://cleezoclass.com:4000/get-students?className=${apiClassName}&section=${section}&schoolCode=${schoolCode}`);
    if (response.data.success && response.data.students) {
      setBusFeeStudents(response.data.students);
      setShowBusFeePopup(true);
    } else {
      displayToast('No students found for the selected class and section', "error");
    }
  } catch (error) {
    console.error('Error loading students:', error);
    displayToast('Error loading students', "error");
  }
};
 const [defaultFees, setDefaultFees] = useState({
   admission: 0,
   tuition: 0,
   exam: 0,
   uniform: 0,
   books: 0,
   other: 0,
   residential: 0,
 });
 
  
const feeLabelToKey = {
 "Admission Fee": "admission",
 "Tuition Fee": "tuition",
 "Residential Fee": "residential",
 "Bus Fee": "bus",
 "Exam Fee": "exam",
 "Books Fee": "books",
 "Uniform Fee": "uniform",
 "Other Fees": "other",
};

const formatPaymentAmount = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const buildInstallmentRowsFromRawSource = (source = {}) => {
  if (!source || typeof source !== "object") return {};

  const grouped = {};

  // Regex to match dynamic installments (e.g., exam_installment_1, cultural_installment_2)
  const dynamicInstallmentRegex = /^([a-zA-Z0-9_]+)_installment_(\d+)(?:_(amount|paid|fine|deadline|date|deadline_date))?$/i;

  Object.entries(source).forEach(([key, rawValue]) => {
    const match = key.match(dynamicInstallmentRegex);
    if (!match) return;

    const feeKey = normalizeInstallmentGroupKey(match[1]); // e.g., "exam", "cultural"
    const installmentNo = Number(match[2]);
    const suffix = (match[3] || "amount").toLowerCase();

    if (!grouped[feeKey]) grouped[feeKey] = [];

    let row = grouped[feeKey].find((item) => item.installmentNo === installmentNo);
    if (!row) {
      row = { installmentNo, amount: 0, paid: 0, fine: 0, deadlineDate: "" };
      grouped[feeKey].push(row);
    }

    if (suffix === "amount") row.amount = Number(rawValue) || 0;
    if (suffix === "paid") row.paid = Number(rawValue) || 0;
    if (suffix === "fine") row.fine = Number(rawValue) || 0;
    if (suffix === "deadline" || suffix === "date" || suffix === "deadline_date") {
      row.deadlineDate = rawValue;
    }
  });

  // Sort installments by number for each fee type
  Object.keys(grouped).forEach((feeKey) => {
    grouped[feeKey].sort((a, b) => a.installmentNo - b.installmentNo);
  });

  return grouped;
};

const buildIndividualInstallmentRowsFromStudentRows = (rows = []) => {
  const grouped = {};
  const sources = Array.isArray(rows) ? rows : [];
  const genericInstallmentRegex = /^Installment(\d+)_(Amount|Paid|Fine|Deadline|Date|Deadline_Date)$/i;
  const dynamicInstallmentRegex = /^([a-zA-Z0-9_]+)_installment_(\d+)(?:_(amount|paid|fine|deadline|date|deadline_date))?$/i;

  const getOrCreateInstallmentRow = (feeKey, installmentNo) => {
    if (!grouped[feeKey]) grouped[feeKey] = [];

    let row = grouped[feeKey].find((item) => item.installmentNo === installmentNo);
    if (!row) {
      row = { installmentNo, amount: 0, paid: 0, fine: 0, deadlineDate: "" };
      grouped[feeKey].push(row);
    }

    return row;
  };

  const applyInstallmentValue = (row, suffix, rawValue, debugMeta = {}) => {
    const normalizedSuffix = String(suffix || "amount").toLowerCase();
    const numericValue = Number(rawValue) || 0;

    if (normalizedSuffix === "amount") {
      row.amount = Math.max(Number(row.amount) || 0, numericValue);
      return;
    }

    if (normalizedSuffix === "paid") {
      row.paid = Number((Number(row.paid || 0) + numericValue).toFixed(2));
      console.warn("[InstallmentPaidDebug] paid field parsed", {
        ...debugMeta,
        rawValue,
        numericValue,
        rowAfterUpdate: { ...row },
      });
      return;
    }

    if (normalizedSuffix === "fine") {
      row.fine = Math.max(Number(row.fine) || 0, numericValue);
      return;
    }

    if (
      normalizedSuffix === "deadline" ||
      normalizedSuffix === "date" ||
      normalizedSuffix === "deadline_date"
    ) {
      if (rawValue && !row.deadlineDate) {
        row.deadlineDate = rawValue;
      }
    }
  };

  console.warn("[InstallmentPaidDebug] parsing student installment rows", {
    rowCount: sources.length,
    rows: sources,
  });

  sources.forEach((source, sourceIndex) => {
    if (!source || typeof source !== "object") return;

    const feeKey = normalizeInstallmentGroupKey(
      source?.fee_type || source?.feeType || source?.FeeType || source?.feeName || source?.fee_name || source?.type || "tuition"
    );
    const dynamicValuesByInstallment = Object.entries(source).reduce((acc, [key, rawValue]) => {
      const dynamicMatch = key.match(dynamicInstallmentRegex);
      if (!dynamicMatch) return acc;

      const installmentNo = Number(dynamicMatch[2]);
      const suffix = String(dynamicMatch[3] || "amount").toLowerCase();
      if (!acc[installmentNo]) acc[installmentNo] = {};
      acc[installmentNo][suffix] = rawValue;
      return acc;
    }, {});
    const hasFeeTypeInstallmentColumns = Object.keys(dynamicValuesByInstallment).length > 0;

    Object.entries(source).forEach(([key, rawValue]) => {
      const dynamicMatch = key.match(dynamicInstallmentRegex);
      if (dynamicMatch) {
        const dynamicFeeKey = normalizeInstallmentGroupKey(dynamicMatch[1]);
        if (!dynamicFeeKey) return;

        const row = getOrCreateInstallmentRow(dynamicFeeKey, Number(dynamicMatch[2]));
        applyInstallmentValue(row, dynamicMatch[3] || "amount", rawValue, {
          sourceIndex,
          column: key,
          feeKey: dynamicFeeKey,
          installmentNo: Number(dynamicMatch[2]),
        });
        return;
      }

      const genericMatch = key.match(genericInstallmentRegex);
      if (!genericMatch || !feeKey) return;
      if (hasFeeTypeInstallmentColumns) return;

      const genericInstallmentNo = Number(genericMatch[1]);

      const row = getOrCreateInstallmentRow(feeKey, genericInstallmentNo);
      applyInstallmentValue(row, genericMatch[2] || "amount", rawValue, {
        sourceIndex,
        column: key,
        feeKey,
        installmentNo: genericInstallmentNo,
      });
    });
  });

  Object.keys(grouped).forEach((feeKey) => {
    grouped[feeKey].sort((a, b) => a.installmentNo - b.installmentNo);
  });

  console.warn("[InstallmentPaidDebug] parsed installment grouped result", grouped);

  return grouped;
};

const hasConfiguredInstallmentAmounts = (rows = []) =>
  Array.isArray(rows) && rows.some((row) => Number(row?.amount || row?.Amount || 0) > 0);

const mergeInstallmentPlanWithPayments = (planRows = [], paymentRows = []) => {
  const paymentsByNumber = (Array.isArray(paymentRows) ? paymentRows : []).reduce((map, row, index) => {
    const installmentNo = Number(row?.installmentNo || row?.id || index + 1);
    const existing = map.get(installmentNo) || {};
    map.set(installmentNo, {
      ...existing,
      ...row,
      paid: Number((Number(existing?.paid || existing?.Paid || 0) + Number(row?.paid || row?.Paid || 0)).toFixed(2)),
    });
    return map;
  }, new Map());

  return (Array.isArray(planRows) ? planRows : []).map((row, index) => {
    const installmentNo = Number(row?.installmentNo || row?.id || index + 1);
    const payment = paymentsByNumber.get(installmentNo);
    return {
      ...row,
      installmentNo,
      paid: Number(payment?.paid || payment?.Paid || 0),
    };
  });
};

const normalizeInstallmentDetailRows = (rows = []) =>
  (Array.isArray(rows) ? rows : [])
    .map((row, index) => {
      const installmentNo = Number(row?.installmentNo || row?.installment || row?.id || index + 1);
      const amount = Number(row?.amount || row?.installmentAmount || row?.Amount || row?.total || 0);
      const paid = Number(row?.paid || row?.Paid || row?.paidAmount || row?.amount_paid || 0);

      return {
        installmentNo,
        amount: Number.isFinite(amount) ? Math.max(amount, 0) : 0,
        paid: Number.isFinite(paid) ? Math.max(paid, 0) : 0,
        fine: Number(row?.fine || row?.Fine || 0) || 0,
        deadlineDate: row?.deadlineDate || row?.dueDate || row?.Deadline_Date || row?.date || "",
      };
    })
    .filter((row) => Number(row.amount) > 0 || Number(row.paid) > 0);

const adjustInstallmentRowsToTotal = (rows = [], targetTotal = 0) => {
  const normalizedRows = normalizeInstallmentDetailRows(rows);
  const netTotal = Math.max(Number(targetTotal) || 0, 0);
  const configuredTotal = normalizedRows.reduce(
    (sum, row) => sum + Math.max(Number(row.amount) || 0, 0),
    0
  );

  if (!normalizedRows.length || configuredTotal <= 0) return normalizedRows;

  let allocatedTotal = 0;
  return normalizedRows.map((row, index) => {
    const isLast = index === normalizedRows.length - 1;
    const adjustedAmount = isLast
      ? Math.max(netTotal - allocatedTotal, 0)
      : Number(((Math.max(Number(row.amount) || 0, 0) / configuredTotal) * netTotal).toFixed(2));

    allocatedTotal = Number((allocatedTotal + adjustedAmount).toFixed(2));

    return {
      ...row,
      amount: adjustedAmount,
      paid: Math.min(Math.max(Number(row.paid) || 0, 0), adjustedAmount),
    };
  });
};

const getIndividualAssignmentInstallmentRows = (assignment = {}, feeKey = "", feeLabel = "") => {
  if (!assignment || typeof assignment !== "object") return [];

  const directDetails =
    (Array.isArray(assignment?.installmentRows) && assignment.installmentRows) ||
    (Array.isArray(assignment?.installmentDetails) && assignment.installmentDetails) ||
    (Array.isArray(assignment?.installmentsDetails) && assignment.installmentsDetails) ||
    (Array.isArray(assignment?.installments) && assignment.installments) ||
    [];

  const directRows = normalizeInstallmentDetailRows(directDetails);
  const dynamicRowsMap = buildIndividualInstallmentRowsFromStudentRows([
    {
      ...assignment,
      feeName: assignment?.feeName || assignment?.type || feeLabel || feeKey,
    },
  ]);
  const normalizedKey = normalizeInstallmentGroupKey(feeKey || assignment?.type || assignment?.feeName || "");
  const normalizedLabel = normalizeInstallmentGroupKey(feeLabel || assignment?.label || assignment?.feeName || "");
  const dynamicRows =
    dynamicRowsMap?.[normalizedKey] ||
    dynamicRowsMap?.[normalizedLabel] ||
    [];

  if (hasConfiguredInstallmentAmounts(directRows)) {
    return mergeInstallmentPlanWithPayments(directRows, dynamicRows);
  }

  return hasConfiguredInstallmentAmounts(dynamicRows) || dynamicRows.some((row) => Number(row?.paid || row?.Paid || 0) > 0)
    ? dynamicRows
    : directRows;
};

const getInstallmentChoicesForFee = (fee) => {
  const remainingTotal = Math.max(Number(fee?.remaining) || 0, 0);
  if (remainingTotal <= 0) return [];

  const feeKey = normalizeInstallmentGroupKey(fee?.key || fee?.label || "");
  const labelKey = normalizeInstallmentGroupKey(fee?.label || "");
  const individualSourceRows =
    individualFeeInstallmentMap?.[feeKey] ||
    individualFeeInstallmentMap?.[labelKey] ||
    [];

  const buildChoicesFromRows = (rows) => {
    const adjustedRows = adjustInstallmentRowsToTotal(rows, fee?.total);
    const installmentPaidTotal = adjustedRows.reduce(
      (sum, inst) => sum + Math.max(Number(inst?.paid || inst?.Paid) || 0, 0),
      0
    );
    let remainingPaid = Math.max(Number(fee?.paid) || 0, installmentPaidTotal);
    let foundSelectable = false;

    return adjustedRows
      .map((inst) => {
        const original = Math.max(Number(inst.amount || inst.Amount) || 0, 0);
        const directPaid = Math.max(Number(inst.paid || inst.Paid) || 0, 0);
        const paid = Math.min(remainingPaid, original);
        if (directPaid > 0 || paid > 0) {
          console.warn("[InstallmentPaidDebug] paid used for choice", {
            installmentNo: inst.installmentNo || inst.id,
            original,
            directPaid,
            paid,
          });
        }
        remainingPaid = Math.max(remainingPaid - paid, 0);
        const available = Math.max(original - paid, 0);
        const isPaid = available <= 0;
        const isSelectable = !isPaid && !foundSelectable;
        if (isSelectable) foundSelectable = true;

        return {
          id: inst.installmentNo || inst.id,
          label: `Installment ${inst.installmentNo || inst.id}`,
          amount: available,
          paid,
          originalAmount: original,
          isPaid,
          isSelectable,
          deadlineDate: inst.deadlineDate || inst.dueDate || inst.Deadline_Date,
        };
      })
      .filter((option) => option.originalAmount > 0);
  };

  if (hasConfiguredInstallmentAmounts(individualSourceRows)) {
    const choices = buildChoicesFromRows(individualSourceRows);
    console.log("[PaymentDebug] installment choices from student rows", {
      fee,
      individualSourceRows,
      choices,
    });
    return choices;
  }
  
  // 1. Resolve source: prioritize individual, fallback to class
  const individualFee = individualFeeRows.find(
    (row) => normalizeFeeFieldName(row?.key || row?.label || "") === feeKey
  );
  
  const individualRows = Array.isArray(individualFee?.installmentRows)
    ? individualFee.installmentRows
    : [];
  const classRows = classWiseInstallmentMap?.[feeKey] || classWiseInstallmentMap?.[labelKey] || [];
  const paymentRows = individualSourceRows.length ? individualSourceRows : individualRows;
  const sourceRows = hasConfiguredInstallmentAmounts(individualRows)
    ? individualRows
    : mergeInstallmentPlanWithPayments(classRows, paymentRows);

  if (!sourceRows.length) return [];

  const choices = buildChoicesFromRows(sourceRows);
  console.log("[PaymentDebug] installment choices from class rows", {
    fee,
    sourceRows,
    choices,
  });
  return choices;
};

const openInstallmentPopupForFee = (fee, idx) => {
  setActiveInstallmentPopup({
    rowIndex: idx,
    feeKey: fee.key,
    feeLabel: fee.label,
  });
};

const selectInstallmentChoice = (fee, idx, option) => {
  if (!fee || !option) return;
  if (option.isPaid) {
    displayToast("This installment is already paid.", "error");
    return;
  }
  if (!option.isSelectable) {
    displayToast("Please pay the previous installment first.", "error");
    return;
  }

  const typeKey = feeLabelToKey[fee.label] || fee.key;
  const amount = Number(option.amount) || 0;

  setFeeEntries((prev) => {
    const next = [...prev];
    next[idx] = {
      ...(next[idx] || {}),
      type: typeKey,
      amount,
      raw: formatPaymentAmount(amount),
      installmentId: option.id,
      installmentLabel: option.label,
    };
    return next;
  });

  setDynamicFeeValues((prev) => ({
    ...prev,
    [fee.key]: String(amount),
  }));

  if (typeKey) {
    setFees((prev) => ({
      ...prev,
      [typeKey]: amount,
    }));
  }

  setActiveInstallmentPopup(null);
};

const normalizeFeeColumnBase = (feeName) => {
  const normalized = String(feeName || "")
    .trim()
    .toLowerCase()
    .replace(/\bfees?\b/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  if (!normalized) return "";
  return /^[0-9]/.test(normalized) ? `fee_${normalized}` : normalized;
};

const normalizeFeeFieldName = (key = "") =>
  String(key).toLowerCase().replace(/[\s_]+/g, "");

const normalizeInstallmentGroupKey = (key = "") =>
  {
    const normalized = String(key || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/fees?$/, "");
    return normalized === "tution" ? "tuition" : normalized;
  };

const parseLooseNumber = (value) => {
  if (value === null || value === undefined || value === "") return NaN;
  if (typeof value === "number") return value;
  const cleaned = String(value)
    .replace(/[₹,\s]/g, "")
    .replace(/[^0-9.-]/g, "");
  if (!cleaned) return NaN;
  return Number(cleaned);
};

const isStaticOrMetaFeeField = (key = "") => {
  const normalized = normalizeFeeFieldName(key);
  const staticKeys = new Set([
    "admissionfee",
    "admissionfees",
    "tuitionfee",
    "residentialfee",
    "busfee",
    "busfees",
    "examfee",
    "examfees",
    "bookfee",
    "Books_Fee",
    "bookfees",
    "uniformfee",
    "uniformfees",
    "otherfee",
    "otherfees",
    "others",
    "completefee",
    "updatedcompletefee",
    "paidamount",
    "finalamount",
    "amountpaid",
  ]);
  const metaSuffixes = ["_paid", "_due", "_discount", "_fine", "_date"];
  const metaKeys = new Set([
    "id",
    "login_id",
    "created_at",
    "updated_at",
    "studentname",
    "studentid",
    "class_name",
    "classname",
    "section",
    "feaclass",
    "feasection",
    "feeclass",
    "feesection",
    "fee_type",
    "discount_reason",
    "uploadfeedetails",
    "receiptnumber",
    "paymentmode",
    "transaction_id",
    "transactionid",
    "paiddate",
    "paymentdate",
    "date",
  ]);

  if (staticKeys.has(normalized) || metaKeys.has(normalized)) {
    return true;
  }

  if (normalized.startsWith("installment") || normalized.startsWith("resinst")) {
    return true;
  }

  return metaSuffixes.some((suffix) => normalized.endsWith(suffix.replace("_", "")));
};

const formatCustomFeeLabel = (key = "") =>
  String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
    .trim();

const getFeeKeyAliases = (key = "") => {
  const raw = String(key || "").trim();
  const normalized = normalizeFeeFieldName(raw);
  const aliases = new Set([raw]);

  if (!normalized) return [];

  aliases.add(normalized);

  const addAll = (...keys) => keys.filter(Boolean).forEach((item) => aliases.add(item));

  if (normalized === "stationary" || normalized === "stationery") {
    addAll("stationary", "stationery");
  }

  if (normalized === "sport" || normalized === "sports") {
    addAll("sport", "sports");
  }

  if (normalized === "transport" || normalized === "transportation" || normalized === "transportfee") {
    addAll(
      "transport",
      "transportation",
      "transport_fee",
      "transportfee",
      "bus",
      "bus_fee"
    );
  }

  if (normalized === "tuition" || normalized === "tuitionfee" || normalized === "tution" || normalized === "tutionfee") {
    addAll("tuition", "tuition_fee", "tuitionfee", "tution", "tution_fee", "tutionfee");
  }

  if (normalized === "guide" || normalized === "guides") {
    addAll("guide", "guides");
  }

  if (normalized === "book" || normalized === "books") {
    addAll("book", "books");
  }

  if (normalized === "hostel" || normalized === "hostal") {
    addAll("hostel", "hostal", "hostel_fee", "hostal_fee");
  }

  if (normalized === "tie" || normalized === "tiefee") {
    addAll("tie", "tie_fee", "tiefee");
  }

  if (normalized === "belt" || normalized === "beltfee") {
    addAll("belt", "belt_fee", "beltfee");
  }

  return Array.from(aliases);
};

const readFirstNumericValue = (source, keys = []) => {
  if (!source) return 0;

  const entries = Object.entries(source);

  for (const key of keys) {
    if (!key) continue;
    const normalizedKey = normalizeFeeFieldName(key);

    for (const [sourceKey, raw] of entries) {
      if (normalizeFeeFieldName(sourceKey) !== normalizedKey) continue;
      if (raw === undefined || raw === null || raw === "") continue;
      const value = parseLooseNumber(raw);
      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
};

const mergeDynamicFeeSources = (...sources) =>
  sources.reduce((acc, source) => {
    if (!source || typeof source !== "object") return acc;
    return {
      ...acc,
      ...source,
      ...(source.dynamicFeeTotals || {}),
      ...(source.dynamicFeePaidTotals || {}),
      ...(source.dynamicFeeDiscounts || {}),
      ...(source.studentDetails || {}),
      ...(source.feeStructure || {}),
    };
  }, {});

const getDirectNumericValue = (source, keys = []) => {
  if (!source) return 0;

  for (const key of keys) {
    if (!key) continue;

    const directCandidates = [
      key,
      String(key).trim(),
      String(key).toLowerCase(),
      normalizeFeeFieldName(key),
      String(key).replace(/[\s_]+/g, "_"),
    ].filter(Boolean);

    for (const candidate of directCandidates) {
      const raw = source?.[candidate];
      if (raw === undefined || raw === null || raw === "") continue;
      const value = Number(raw);
      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
};

const readFeeDiscountValue = (source, feeKey = "", feeLabel = "") => {
  const keyAliases = getFeeKeyAliases(feeKey);
  const labelAliases = getFeeKeyAliases(feeLabel);
  const normalizedKey = normalizeFeeFieldName(feeKey);
  const normalizedLabel = normalizeFeeFieldName(feeLabel);

  const discountKeys = [
    ...keyAliases.flatMap((key) => [
      `${key}_discount`,
      `${key}_Discount`,
      `${key}Discount`,
    ]),
    ...labelAliases.flatMap((key) => [
      `${key}_discount`,
      `${key}_Discount`,
      `${key}Discount`,
    ]),
  ];

  if (normalizedKey === "tuition" || normalizedLabel.includes("tuition")) {
    discountKeys.push("tuition_discount", "tuitionDiscount");
  }
  if (normalizedKey === "bus" || normalizedLabel.includes("bus")) {
    discountKeys.push("bus_discount", "busDiscount");
  }
  if (
    normalizedKey === "book" ||
    normalizedKey === "books" ||
    normalizedLabel.includes("book") ||
    normalizedLabel.includes("books")
  ) {
    discountKeys.push("fee_discount", "feeDiscount", "books_discount", "book_discount");
  }

  return readFirstNumericValue(source, Array.from(new Set(discountKeys)));
};

const getIndividualFeeTotalFromSource = (source = {}) => {
  if (!source || typeof source !== "object") return 0;

  const entries = [
    ...(Array.isArray(source.individualFeeAssignments) ? source.individualFeeAssignments : []),
    ...(Array.isArray(source.dynamicFeeBreakdown)
      ? source.dynamicFeeBreakdown.filter((entry) => {
          const scope = String(entry?.scope || entry?.source || entry?.feeScope || "").trim().toLowerCase();
          return scope === "individual";
        })
      : []),
  ];

  return entries.reduce((sum, entry) => {
    const amount = parseLooseNumber(
      entry?.amount ??
        entry?.total ??
        entry?.assignedAmount ??
        entry?.feeAmount ??
        entry?.value ??
        0
    );
    return sum + (Number.isFinite(amount) ? Math.max(amount, 0) : 0);
  }, 0);
};

const getFilteredCompleteFee = (source = {}, ...fallbackSources) => {
  const candidates = [source, ...fallbackSources].filter(Boolean);
  const baseSource =
    candidates.find((candidate) =>
      Number.isFinite(
        parseLooseNumber(candidate?.complete_fee ?? candidate?.CompleteFee ?? candidate?.completeFee ?? 0)
      ) && parseLooseNumber(candidate?.complete_fee ?? candidate?.CompleteFee ?? candidate?.completeFee ?? 0) > 0
    ) || source;
  const rawCompleteFee = parseLooseNumber(
    baseSource?.complete_fee ?? baseSource?.CompleteFee ?? baseSource?.completeFee ?? 0
  );
  return Math.max(Number.isFinite(rawCompleteFee) ? rawCompleteFee : 0, 0);
};

const findMatchingSourceKey = (source = {}, keys = []) => {
  const sourceKeys = Object.keys(source || {});

  for (const key of keys) {
    if (!key) continue;
    const normalizedKey = normalizeFeeFieldName(key);
    const match = sourceKeys.find(
      (sourceKey) => normalizeFeeFieldName(sourceKey) === normalizedKey
    );
    if (match) return match;
  }

  return "";
};

const mergePaymentDataWithDynamicTransactions = (paymentData = {}, rows = []) => {
  const merged = { ...(paymentData || {}) };
  const aggregateByPaidField = {};

  rows.forEach((row) => {
    const rawFeeType = String(
      row?.fee_type || row?.feeType || row?.FeeType || row?.feeName || row?.fee_name || ""
    ).trim();
    const feeAliases = getFeeKeyAliases(rawFeeType);
    const totalField =
      findMatchingSourceKey(row, [...feeAliases, normalizeFeeColumnBase(rawFeeType)]) ||
      normalizeFeeColumnBase(rawFeeType) ||
      normalizeFeeFieldName(rawFeeType);
    const paidField =
      findMatchingSourceKey(
        row,
        [
          ...feeAliases.flatMap((alias) => [`${alias}_paid`, `${alias}Paid`]),
          "amount_paid",
          "Paid_Amount",
          "paid_amount",
        ]
      ) ||
      `${totalField}_paid`;
    const dueField =
      findMatchingSourceKey(
        row,
        [...feeAliases.flatMap((alias) => [`${alias}_due`, `${alias}Due`])]
      ) ||
      `${totalField}_due`;
    const discountField =
      findMatchingSourceKey(
        row,
        [...feeAliases.flatMap((alias) => [`${alias}_discount`, `${alias}Discount`])]
      ) ||
      `${totalField}_discount`;
    const normalizedFeeKey = normalizeFeeFieldName(totalField || rawFeeType);

    if (!normalizedFeeKey) return;

    const total = readFirstNumericValue(row, [totalField, ...feeAliases]);
    const paid = readFirstNumericValue(row, [paidField, "amount_paid", "Paid_Amount", "paid_amount"]);
    const due = readFirstNumericValue(row, [dueField]);
    const discount = readFeeDiscountValue(row, totalField || rawFeeType, rawFeeType);

    const bucketKey = normalizedFeeKey;
    if (!aggregateByPaidField[bucketKey]) {
      aggregateByPaidField[bucketKey] = {
        totalField: totalField || normalizedFeeKey,
        paidField,
        dueField,
        discountField,
        total: Number(merged?.[totalField || normalizedFeeKey]) || 0,
        paidFromRows: 0,
        dueFromRows: Number(merged?.[dueField]) || 0,
        discountFromRows: Number(merged?.[discountField]) || 0,
      };
    }

    aggregateByPaidField[bucketKey].total = Math.max(
      Number(aggregateByPaidField[bucketKey].total) || 0,
      total
    );
    aggregateByPaidField[bucketKey].paidFromRows += Number(paid) || 0;
    aggregateByPaidField[bucketKey].dueFromRows = Math.max(
      Number(aggregateByPaidField[bucketKey].dueFromRows) || 0,
      Number(due) || 0
    );
    aggregateByPaidField[bucketKey].discountFromRows = Math.max(
      Number(aggregateByPaidField[bucketKey].discountFromRows) || 0,
      Number(discount) || 0
    );
  });

  Object.values(aggregateByPaidField).forEach((bucket) => {

    const existingPaid = Number(merged?.[bucket.paidField]) || 0;
const paid = Number(existingPaid) + Number(bucket.paidFromRows);    const total = Math.max(Number(bucket.total) || 0, Number(merged?.[bucket.totalField]) || 0);
    const discount = Math.max(Number(bucket.discountFromRows) || 0, readFeeDiscountValue(merged, bucket.totalField, bucket.totalField));
    const effectiveTotal = Math.max(total - discount, 0);
    const computedDue = Math.max(effectiveTotal - paid, 0);
    const due = Math.max(Number(bucket.dueFromRows) || 0, computedDue);
    console.log("[DEBUG] Aggregation===========&&&&&&&&&&&&&&&&&&&&&&&&&77=========:", {
        existingPaid,
        fromRows: bucket.paidFromRows,
        finalPaid: Number(existingPaid) + Number(bucket.paidFromRows)
    });
    merged[bucket.totalField] = total;
    merged[bucket.paidField] = paid;
    merged[bucket.dueField] = due;
    merged[bucket.discountField] = discount;
  });

  return merged;
};

    // Initialize receipt formatting options from localStorage
  const [prefix, setPrefix] = useState(localStorage.getItem('receiptPrefix') || '');
  const [suffix, setSuffix] = useState(localStorage.getItem('receiptSuffix') || '');
  const [yearPosition, setYearPosition] = useState(localStorage.getItem('yearPosition') || 'after');
  const [year, setYear] = useState(localStorage.getItem('receiptYear') || new Date().getFullYear());
useEffect(() => {

 
  // Load prefix
  const savedPrefix = localStorage.getItem('receiptPrefix');
  if (savedPrefix) {
    setPrefix(savedPrefix);
  }
 
  // Load suffix
  const savedSuffix = localStorage.getItem('receiptSuffix');
  if (savedSuffix) {
    setSuffix(savedSuffix);
  }
 
  // Load year position
  const savedYearPosition = localStorage.getItem('yearPosition');
  if (savedYearPosition) {
    setYearPosition(savedYearPosition);
  }
 
  // Load year
  const savedYear = localStorage.getItem('receiptYear');
  if (savedYear) {
    setYear(parseInt(savedYear));
  }
}, []);
 // Reset function
const resetPopup = () => {
  setFeeEntries([]);            
  setActiveInstallmentPopup(null);
  setPaymentMode("");           
  setOtherPaymentMode("");
  setTransactionId("");
  setCashAmount(0);              
  setOnlineAmount(0);            
};

// Close handler
const handleClosePopup = () => {
  resetPopup();
  setShowPopup(false);
  if (popupOnly && typeof onPopupClose === "function") {
    onPopupClose();
  }
};

  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem("schoolCode");
      if (!code) {
        return;
      }
      setDynamicSchoolCode(code);
      try {
        const response = await axios.post(
          "https://cleezoclass.com:4000/api/schoollogodynamic",
          { secretecode: code },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data.logoPath) {
          setDynamicLogoSrc(response.data.logoPath);
        }
      } catch (error) {
        console.error("Error fetching school logo:", error);
      }
    };
    fetchSchoolLogo();
  }, []);
 const [busFeeAmount, setBusFeeAmount] = useState('');
 const [busFeeFrequency, setBusFeeFrequency] = useState('monthly');
 const [oldBusFee, setOldBusFee] = useState(null);
 const [oldFrequencyType, setOldFrequencyType] = useState('');
 const [loginId, setLoginId] = useState(null);

 const saveReceiptNumberToDB = async (nextReceiptNumber) => {
  const schoolCode = localStorage.getItem("schoolCode");
  if (!schoolCode) return;
  try {
    await axios.post("https://cleezoclass.com:4000/api/saveLastReceiptNumber", {
      schoolCode,
      lastReceiptNumber: nextReceiptNumber,
    });
  } catch (error) {
    console.error("[RECEIPT][PAYMENT] failed to persist receipt number:", error);
  }
 };

  const incrementReceiptNumber = async (baseReceiptNumber = receiptNumber) => {
    const current = parseInt(baseReceiptNumber || "0", 10);
    const next = (Number.isNaN(current) ? 1 : current + 1).toString().padStart(3, "0");
    await saveReceiptNumberToDB(next);
    setReceiptNumber(next);
    currentReceiptNumberRef.current = next;
    return next;
  };
 

  // Image imports
  const [admissionFee, setAdmissionFee] = useState(0);
  const [admissionPaid, setAdmissionPaid] = useState(0);

  const handleBackClick = () => {
    navigate("/income");
  };


    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  
  const handleDownload = async () => {
    const input = dashboardRef.current;
    if (!input) return;
    const originalStyle = {
      height: input.style.height,
      overflow: input.style.overflow,
    };
    const fullHeight = input.scrollHeight;
    input.style.height = fullHeight + "px";
    input.style.overflow = "visible";
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        width: input.scrollWidth,
        height: input.scrollHeight,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pageHeight = 297;
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save("WarmLeads.pdf");
    } catch (error) {
      console.error("Error generating full PDF:", error);
    } finally {
      input.style.height = originalStyle.height;
      input.style.overflow = originalStyle.overflow;
    }
  };
    // Adds a new empty row for dynamic fee entry in the main form
  const addFeeEntryRow = () => {
    setFeeEntries([...feeEntries, { type: '', amount: '' }]);
  };
 
  // Removes a dynamic fee entry row from the main form
  const removeFeeEntryRow = (index) => {
    const updatedEntries = feeEntries.filter((_, i) => i !== index);
    setFeeEntries(updatedEntries);
 
    // Recalculate fees summary after removal
    const newFees = { tuition: 0, exam: 0, bus: 0, uniform: 0, books: 0, other: 0, residential: 0 };
    updatedEntries.forEach(entry => {
      const typeKey = entry.type?.toLowerCase();
      const amount = parseFloat(entry.amount) || 0;
      if (typeKey && newFees.hasOwnProperty(typeKey)) {
        newFees[typeKey] += amount;
      }
    });
    setFees(newFees);
  };
  const generatePDFBlob = async () => {
    const element = dashboardRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    return pdf.output("blob");
  };
 


useEffect(() => {
const fetchFeeStructure = async () => {
  if (!className || !section) return;

  try {
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
    const response = await axios.get(
      `https://cleezoclass.com:4000/feeStructure/${className}`,
      { params: { schoolCode, section } }
    );

    if (!response.data?.feeStructure) {
      displayToast(`No fee structure found for Class ${className}.`, "error");
      return;
    }

    const backendData = response.data.feeStructure || {};

    // Set the raw fee structure (includes dynamic installments)
    setFeeStructureRaw(backendData);

    // Extract only the standard fees (admission, exam, bus, etc.)
    const fees = {
      admission: parseFloat(backendData.Admission_Fee) || 0,
      books: parseFloat(backendData.Book_Fee) || 0,
      uniform: parseFloat(backendData.Uniform_Fee) || 0,
      exam: parseFloat(backendData.Exam_Fee) || 0,
      other: parseFloat(backendData.Other_Fee) || 0,
      bus: parseFloat(backendData.Bus_Fee) || 0,
      residential: parseFloat(backendData.ResidentialCompleteFee) || 0,
      tuition: parseFloat(backendData.Tuition_Fee) || parseFloat(backendData.Calculated_Tuition_Fee) || 0,
    };

    setDefaultFees(fees);
    setFees(fees);
    setFeeStructure({ ...fees, complete_fee: parseFloat(backendData.CompleteFee) || 0 });

  } catch (error) {
    console.error("Failed to fetch fee structure:", error);
    displayToast("Failed to load fee structure.", "error");
  }
};

  fetchFeeStructure();
}, [className, section]);


   const allFeeTypes = [
    { value: 'admission', label: 'Admission Fee' },
    { value: 'tuition', label: 'Tuition Fee' },
   { value: 'exam', label: 'Exam Fee' },
   { value: 'bus', label: 'Bus Fee' },
   { value: 'uniform', label: 'Uniform Fee' },
   { value: 'books', label: 'Books Fee' },
   { value: 'residential', label: 'Residential Fee' },
   { value: 'other', label: 'Other Fees' },
  ];
  const formatReceiptNumber = () => {
  let formattedNumber = '';
 
  // Add prefix if exists
  if (prefix) {
    formattedNumber += prefix;
  }
 
  // Add year if exists and position is before
  if (year && yearPosition === 'before') {
    formattedNumber += year;
  }
 
  // Add the actual receipt number
  formattedNumber += receiptNumber.toString().padStart(4, '0'); // Assuming you want 4 digits
 
 
  // Add suffix if exists
  if (suffix) {
    formattedNumber += suffix;
  }
 
  // Add year if exists and position is after
  if (year && yearPosition === 'after') {
    formattedNumber += year;
  }
  return formattedNumber;
};
// REPLACE THE ENTIRE EXISTING useEffect BLOCK WITH THIS ONE
useEffect(() => {

  // 🔁 RESET STATE
  setStudentData({ name: "", fatherName: "", class: "", section: "", rollNumber: "", billType: "full-package" });
  setPayments({});
  setTotalAmount(0);
  setPaidAmount(0);
  setRemainingAmount(0);

  setTuitionFee(0);
  setExamFee(0);
  setBusFee(0);
  setBookFee(0);
  setUniformFee(0);
  setOthersFee(0);
  setAdmissionFee(0);

  setTuitionPaid(0);
  setExamPaid(0);
  setBusPaid(0);
  setBookPaid(0);
  setUniformPaid(0);
  setOthersPaid(0);
  setAdmissionPaid(0);

  setTuitionRemaining(0);
  setExamRemaining(0);
  setBusRemaining(0);
  setBookRemaining(0);
  setUniformRemaining(0);
  setOthersRemaining(0);
  setAdmissionRemaining(0);
  setResidentialRemaining(0);

  if (!selectedStudentId) return;

  const selected =
    students.find((s) => String(s.id) === String(selectedStudentId)) || null;
  const selectedName =
    selected?.name || initialStudentName || selectedStudent || "";
  const selectedSection = selected?.section || section || "A";

  setStudentData((prev) => ({
    ...(prev || {}),
    name: selectedName,
    fatherName: selected?.fatherName || prev?.fatherName || "Not Available",
    class: className,
    section: selectedSection,
    rollNumber: String(selectedStudentId),
    billType: "full-package",
    photo: selected?.photo || prev?.photo || null,
  }));

  const schoolCode = localStorage.getItem("schoolCode");

  axios
    .get(
      `https://cleezoclass.com:4000/api/payment/${selectedStudentId}?schoolCode=${schoolCode}`
    )
    .then((paymentRes) => {
      const basePaymentData = paymentRes.data.payments || {};
      const installmentPaidFields = Object.entries(basePaymentData || {}).filter(
        ([key, value]) => /installment.*paid|paid.*installment/i.test(key) && value !== undefined && value !== null
      );
      console.warn("[InstallmentPaidDebug] /api/payment paid fields", {
        selectedStudentId,
        selectedName,
        installmentPaidFields,
        basePaymentData,
      });
      const hasDynamicFields = [
        "sports",
        "sports_paid",
        "sports_due",
        "stationary",
        "stationary_paid",
        "stationary_due",
        "guides",
        "guides_paid",
        "guides_due",
        "belt",
        "belt_paid",
        "belt_due",
        "tie_fee",
        "tie_fee_paid",
        "tie_fee_due",
        "tie",
        "tie_paid",
        "tie_due",
      ].some((key) => Number(basePaymentData?.[key]) > 0);

      if (hasDynamicFields) {
        return { paymentData: basePaymentData };
      }

      return axios
        .get("https://cleezoclass.com:4000/api/student-transactions-dynamic", {
          params: {
            schoolCode,
            studentName: selectedName,
            className: className.replace("Class ", "").trim(),
            section: selectedSection,
          },
        })
        .then((transactionRes) => {
          const transactionRows = Array.isArray(transactionRes.data)
            ? transactionRes.data
            : [];
          const mergedPaymentData = mergePaymentDataWithDynamicTransactions(
            basePaymentData,
            transactionRows
          );

          return { paymentData: mergedPaymentData };
        })
        .catch((dynamicError) => {
          const backfillError =
            dynamicError?.response?.data ||
            dynamicError?.message ||
            dynamicError;
          console.error(
            "[Payment] Failed to backfill dynamic fee transactions:",
            typeof backfillError === "object"
              ? JSON.stringify(backfillError, null, 2)
              : backfillError
          );
          return { paymentData: basePaymentData };
        });
    })
    .then(({ paymentData }) => {
      setPayments(paymentData);

      // ---------- BASE ----------
      const completeFee = getFilteredCompleteFee(paymentData, selectedStudentFeeDetails, payments);
      const examFee =
        getClassFeeValue("Exam_fees", "Exam_Fees", "examFee") ||
        parseFloat(paymentData.examFee) ||
        0;
      const bookFee =
        getClassFeeValue("Book_Fees", "bookFee") ||
        parseFloat(paymentData.bookFee) ||
        0;
      const uniformFee =
        getClassFeeValue("Uniform_fees", "uniformFee") ||
        parseFloat(paymentData.uniformFee) ||
        0;
      const othersFee =
        getClassFeeValue("Others", "OtherFee", "othersFee") ||
        parseFloat(paymentData.othersFee) ||
        0;
      const admissionFee =
        getClassFeeValue("Admission_fees", "Admission_Fee", "admissionFee") ||
        parseFloat(paymentData.admissionFee) ||
        0;
      const residentialFee =
        getClassFeeValue("ResidentialCompleteFee", "residentialFee") ||
        parseFloat(paymentData.residentialFee) ||
        0;

      // ---------- PAID ----------
      const tuitionPaid = parseFloat(paymentData.paidAmount) || 0;
      const examPaid = parseFloat(paymentData.examPaid) || 0;
      const busPaid = parseFloat(paymentData.busPaid) || 0;
      const bookPaid = parseFloat(paymentData.bookPaid) || 0;
      const uniformPaid = parseFloat(paymentData.uniformPaid) || 0;
      const othersPaid = parseFloat(paymentData.othersPaid) || 0;
      const admissionPaid = parseFloat(paymentData.admissionPaid) || 0;
      const residentialPaid = parseFloat(paymentData.residentialPaid) || 0;

      // ---------- DISCOUNTS ----------
      const tuitionDiscount =
        parseFloat(paymentData.tuitionDiscount) ||
        parseFloat(paymentData.discounts?.tuitionDiscount) ||
        0;
      const busDiscount =
        parseFloat(paymentData.busDiscount) ||
        parseFloat(paymentData.discounts?.busDiscount) ||
        0;
      const bookDiscount =
        parseFloat(paymentData.feeDiscount) ||
        parseFloat(paymentData.discounts?.feeDiscount) ||
        0;
      const admissionDiscount =
        parseFloat(paymentData.admissionDiscount) ||
        0;

      // ================= FIXED LOGIC =================

      // ✅ TUITION (apply tuition discount on tuition fee)
      const dynamicFeeTotal =
        (Number(paymentData.sports) || 0) +
        (Number(paymentData.stationary) || 0) +
        (Number(paymentData.guides) || 0) +
        (Number(paymentData.belt) || 0) +
        (Number(paymentData.tie_fee || paymentData.tie) || 0);

      const tuitionFeeBase =
        parseFloat(paymentData.Tuition_Fee) ||
        parseFloat(paymentData.Calculated_Tuition_Fee) ||
        parseFloat(paymentData.tuitionFee) ||
        0;
      const finalTuitionFee = Math.max(tuitionFeeBase - tuitionDiscount, 0);
      const finalTuitionRemaining = finalTuitionFee - tuitionPaid;

      const finalBusFee =
        getClassFeeValue("Bus_fees", "Bus_Fee", "busFee") ||
        parseFloat(paymentData.busFee) ||
        parseFloat(paymentData.transportFee) ||
        0;

      const finalBusRemaining =
        finalBusFee - busPaid - busDiscount;

      // ✅ BOOK FIX
      const finalBookFee =
        bookFee === 0 && bookPaid > 0
          ? bookPaid
          : bookFee;

      const finalBookRemaining =
        finalBookFee - bookPaid - bookDiscount;

      // ✅ OTHER FIX
      const finalOthersFee =
        othersFee === 0 && othersPaid > 0
          ? othersPaid
          : othersFee;

      const finalOthersRemaining = 0;

      // ================= TOTAL =================

      const totalAmount =
        finalTuitionFee +
        finalBusFee +
        finalBookFee +
        uniformFee +
        finalOthersFee +
        admissionFee +
        examFee +
        residentialFee +
        individualFeeRowsTotal;

      const totalPaid =
        tuitionPaid +
        examPaid +
        busPaid +
        bookPaid +
        uniformPaid +
        othersPaid +
        admissionPaid +
        residentialPaid;

      const totalDiscount =
        parseFloat(paymentData?.discounts?.totalDiscount) ||
        parseFloat(paymentData?.totalDiscount) ||
        parseFloat(paymentData?.discountAmount) ||
        0;

      const backendBreakdownRows = Array.isArray(paymentData?.dynamicFeeBreakdown)
        ? paymentData.dynamicFeeBreakdown
        : [];
      const backendRemainingTotal = backendBreakdownRows.reduce((sum, row) => {
        const key = normalizeFeeFieldName(row?.key || row?.label || "");
        if (key === "amount") return sum;
        const remaining = Number(row?.remaining ?? row?.due ?? row?.dueAmount ?? 0);
        return sum + (Number.isFinite(remaining) ? Math.max(remaining, 0) : 0);
      }, 0);

      const finalRemaining =
        backendBreakdownRows.length > 0
          ? backendRemainingTotal
          : totalAmount - totalPaid - totalDiscount;


      // ================= SET STATES =================

      setTotalAmount(totalAmount);
      setPaidAmount(totalPaid);
      setRemainingAmount(finalRemaining);

      setTuitionFee(finalTuitionFee);
      setTuitionPaid(tuitionPaid);
      setTuitionRemaining(finalTuitionRemaining);

      setBusFee(finalBusFee);
      setBusPaid(busPaid);
      setBusRemaining(finalBusRemaining);

      setBookFee(finalBookFee);
      setBookPaid(bookPaid);
      setBookRemaining(finalBookRemaining);

      setUniformFee(uniformFee);
      setUniformPaid(uniformPaid);
      setUniformRemaining(uniformFee - uniformPaid);

      setOthersFee(finalOthersFee);
      setOthersPaid(othersPaid);
      setOthersRemaining(finalOthersRemaining);

      setAdmissionFee(admissionFee);
      setResidentialFee(residentialFee);
      setAdmissionPaid(admissionPaid);
      setResidentialPaid(residentialPaid);
      setResidentialRemaining(residentialFee - residentialPaid);
      setAdmissionRemaining(admissionFee - admissionPaid - admissionDiscount);

      setExamFee(examFee);
      setExamPaid(examPaid);
      setExamRemaining(examFee - examPaid);
    })
    .catch((err) => {
      console.error("Error in Fee Chain:", err.response?.data || err.message);
    });

}, [selectedStudentId, className, section, students, initialStudentName, selectedStudent]);
useEffect(() => {
  console.log("dynamicFeeTypes", dynamicFeeTypes);
}, [dynamicFeeTypes]);
const getInstallmentsForFee = (fee) => {
  const feeKeyAlias = normalizeInstallmentGroupKey(fee?.key || fee?.label || "");
  const labelKeyAlias = normalizeInstallmentGroupKey(fee?.label || "");
  const installments =
    classWiseInstallmentMap?.[feeKeyAlias] ||
    classWiseInstallmentMap?.[labelKeyAlias] ||
    classWiseInstallmentMap?.tuition ||
    [];

  const paidAmount = Number(fee.paid || 0);
  let remainingPaid = paidAmount;

  return installments
    .map((inst) => {
      const amount = Number(inst.amount || 0);
      if (remainingPaid >= amount) {
        remainingPaid -= amount;
        return null; // Skip fully paid
      }
      const remaining = amount - remainingPaid;
      remainingPaid = 0;
      return { ...inst, amount: remaining, isPaid: false };
    })
    .filter(Boolean);
};

const getApiInstallmentsForFee = (fee) => getInstallmentsForFee(fee);

const [showPopup, setShowPopup] = useState(Boolean(popupOnly));

const handleFeeEntryChange = (index, field, value) => {
  const updatedEntries = [...feeEntries];
  updatedEntries[index][field] = value;

  let newFees = { ...fees };

  if (field === 'type') {
    const selectedType = value;
    if (!updatedEntries[index].amount) {
      const amount = selectedType === "other" || selectedType === "books" ? 0 : (defaultFees[selectedType] || 0);
      updatedEntries[index].amount = amount;
    }
    newFees[selectedType] = parseFloat(updatedEntries[index].amount) || 0;

  } else if (field === 'amount') {
    const selectedType = updatedEntries[index].type;
    const amount = parseFloat(value) || 0;
    if (selectedType) {
      newFees[selectedType] = amount;
    }
  }

  setFeeEntries(updatedEntries);
  setFees(newFees);

};


const [showPaidPopup, setShowPaidPopup] = useState(false);
const [paidPageData, setPaidPageData] = useState(null);
 const [cashAmount, setCashAmount] = useState();
const [onlineAmount, setOnlineAmount] = useState();
const normalizePaymentSplitAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
const handlePaymentModeChange = (value) => {
  setPaymentMode(value);
  if (value !== "Others") {
    setOtherPaymentMode("");
  }
  if (value !== "Online" && value !== "Cash+Online") {
    setTransactionId("");
  }
  if (value !== "Cash+Online") {
    setCashAmount(0);
    setOnlineAmount(0);
  }
};
const [duplicateConfirmState, setDuplicateConfirmState] = useState({
  isOpen: false,
  message: "",
});
const duplicateConfirmResolverRef = useRef(null);

const askDuplicateConfirmation = (message) => {
  return new Promise((resolve) => {
    duplicateConfirmResolverRef.current = resolve;
    setDuplicateConfirmState({
      isOpen: true,
      message,
    });
  });
};

const closeDuplicateConfirmation = (confirmed) => {
  setDuplicateConfirmState({
    isOpen: false,
    message: "",
  });

  if (duplicateConfirmResolverRef.current) {
    duplicateConfirmResolverRef.current(confirmed);
    duplicateConfirmResolverRef.current = null;
  }
};

const buildPaymentSignature = (paymentData) => {
  const normalizedFeeDescriptions = (paymentData.feeDescriptions || [])
    .filter((entry) => entry && parseFloat(entry.amount) > 0)
    .map((entry) => ({
      type: entry.type || "",
      amount: Number(parseFloat(entry.amount || 0).toFixed(2)),
      description: (entry.description || "").trim(),
      installmentId: entry.installmentId || null,
    }))
    .sort((a, b) => {
      const keyA = `${a.type}|${a.installmentId || ""}|${a.description}|${a.amount}`;
      const keyB = `${b.type}|${b.installmentId || ""}|${b.description}|${b.amount}`;
      return keyA.localeCompare(keyB);
    });

  return JSON.stringify({
    studentName: paymentData.studentName,
    className: paymentData.className,
    sectionName: paymentData.sectionName,
    schoolCode: paymentData.schoolCode,
    paymentDate: paymentData.paymentDate,
    paymentMode: paymentData.paymentMode,
    transactionId: (paymentData.transactionId || "").trim(),
    discount: Number(parseFloat(paymentData.Discount || 0).toFixed(2)),
    paid: {
      tuition: Number(parseFloat(paymentData.Paid_Amount || 0).toFixed(2)),
      books: Number(parseFloat(paymentData.books_paid || 0).toFixed(2)),
      bus: Number(parseFloat(paymentData.bus_paid || 0).toFixed(2)),
      uniform: Number(parseFloat(paymentData.uniform_paid || 0).toFixed(2)),
      exam: Number(parseFloat(paymentData.exam_paid || 0).toFixed(2)),
      admission: Number(parseFloat(paymentData.admission_paid || 0).toFixed(2)),
      others: Number(parseFloat(paymentData.others_paid || 0).toFixed(2)),
      residential: Number(parseFloat(paymentData.residential_paid || 0).toFixed(2)),
      cash: Number(parseFloat(cashAmount || 0).toFixed(2)),
      online: Number(parseFloat(onlineAmount || 0).toFixed(2)),
    },
    feeDescriptions: normalizedFeeDescriptions,
  });
};

// Inside your component
const fetchLastReceiptNumber = async () => {
  const cachedReceiptNumber = localStorage.getItem('lastReceiptNumber');
  if (cachedReceiptNumber) {
    setReceiptNumber(cachedReceiptNumber);
    currentReceiptNumberRef.current = cachedReceiptNumber;
    return;
  }

  setReceiptNumber('001');
  currentReceiptNumberRef.current = '001';
};

useEffect(() => {
  fetchLastReceiptNumber(); // ✅ Call from useEffect
}, []);
const handlePaymentSubmission = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  // Debug logs
  console.log("[DEBUG] Student:", {
    studentId: selectedStudentId,
    studentName: selectedStudent,
    className,
    sectionName: section,
  });
  console.log("[DEBUG] Fee Structure:", feeStructure);
  console.log("[DEBUG] feeEntries before processing:", feeEntries);

  // Input validation
  const schoolCode = localStorage.getItem("schoolCode");
  if (!schoolCode) {
    showPopupMessage("School code not found in localStorage", "error");
    setIsLoading(false);
    return;
  }

  if (!selectedStudent) {
    showPopupMessage("Please select a student to make a payment for.", "error");
    setIsLoading(false);
    return;
  }

  if (!paymentDate || !paymentMode) {
    showPopupMessage(
      "Please fill in all payment details: Date, Receipt No., and Payment Mode.",
      "error"
    );
    setIsLoading(false);
    return;
  }

  const trimmedOtherPaymentMode = otherPaymentMode.trim();
  if (paymentMode === "Others" && !trimmedOtherPaymentMode) {
    showPopupMessage("Please enter the other payment mode details.", "error");
    setIsLoading(false);
    return;
  }

  // Initialize fee tracking
  const feeTypesPaid = {
    tuition: 0,
    books: 0,
    bus: 0,
    uniform: 0,
    exam: 0,
    admission: 0,
    other: 0,
    residential: 0,
  };

  let currentTransactionTotal = 0;
  let tuitionInstallmentIdBeingPaid = null;

  const findFeeRowForPaymentEntry = (entry) => {
    const entryKey = normalizeFeeFieldName(entry?.type || entry?.label || "");
    const entryInstallmentKey = normalizeInstallmentGroupKey(entry?.type || entry?.label || "");
    if (!entryKey) return null;
    return displayFeeRows.find((row) => {
      const rowKey = normalizeFeeFieldName(row?.key || "");
      const rowLabel = normalizeFeeFieldName(row?.label || "");
      const rowInstallmentKey = normalizeInstallmentGroupKey(row?.key || row?.label || "");
      const rowLabelInstallmentKey = normalizeInstallmentGroupKey(row?.label || "");
      return (
        rowKey === entryKey ||
        rowLabel === entryKey ||
        rowInstallmentKey === entryInstallmentKey ||
        rowLabelInstallmentKey === entryInstallmentKey
      );
    }) || null;
  };

  const expandEntryAcrossInstallments = (entry) => {
    const amount = parseFloat(entry?.amount) || 0;
    if (!entry || amount <= 0 || entry.installmentId) return [entry];

    const feeRow = findFeeRowForPaymentEntry(entry);
    const installmentChoices = feeRow ? getInstallmentChoicesForFee(feeRow) : [];
    const payableInstallments = installmentChoices
      .filter((option) => !option.isPaid && Number(option.amount) > 0)
      .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    if (!payableInstallments.length) return [entry];

    let remainingAmountToAllocate = amount;
    const allocatedEntries = [];

    payableInstallments.forEach((option) => {
      if (remainingAmountToAllocate <= 0) return;
      const allocatedAmount = Math.min(remainingAmountToAllocate, Number(option.amount) || 0);
      if (allocatedAmount <= 0) return;

      allocatedEntries.push({
        ...entry,
        amount: Number(allocatedAmount.toFixed(2)),
        installmentId: option.id,
        installmentLabel: option.label,
      });
      remainingAmountToAllocate = Number((remainingAmountToAllocate - allocatedAmount).toFixed(2));
    });

    if (remainingAmountToAllocate > 0) {
      allocatedEntries.push({
        ...entry,
        amount: remainingAmountToAllocate,
      });
    }

    return allocatedEntries.length ? allocatedEntries : [entry];
  };

  // Process all fee entries (including tuition)
  const processedFeeEntries = feeEntries
    .filter(entry => entry && entry.type && entry.amount && parseFloat(entry.amount) > 0)
    .flatMap(expandEntryAcrossInstallments)
    .map(entry => {
      const amount = parseFloat(entry.amount);
      const type = entry.type;

      // Update feeTypesPaid and total
      if (feeTypesPaid[type] !== undefined) {
        feeTypesPaid[type] += amount;
      } else {
        feeTypesPaid[type] = amount;
      }
      currentTransactionTotal += amount;

      // Track tuition installment if applicable
      if (type === "tuition" && entry.installmentId) {
        tuitionInstallmentIdBeingPaid = entry.installmentId;
      }

      return {
        type,
        amount,
        description: type === "other" ? entry.description || null : null,
        installmentId: entry.installmentId || null,
      };
    });

  // Process custom fee entries (excluding tuition since it's already in feeEntries)
  const customFeeEntriesFromInstallments = processedFeeEntries
    .map((entry) => {
      const entryKey = normalizeFeeFieldName(entry.type);
      const fee = dynamicFeeTypes.find((candidate) => {
        const candidateKey = candidate.key || candidate.columnBase || normalizeFeeColumnBase(candidate.feeName || candidate.feesType || "");
        return normalizeFeeFieldName(candidateKey) === entryKey;
      });
      if (!fee || entryKey === "tuition") return null;

      const feeKey = fee.key || fee.columnBase || normalizeFeeColumnBase(fee.feeName || fee.feesType || "");
      const feeRow = dynamicFeeRows.find(
        (row) => normalizeFeeFieldName(row.key || row.label) === normalizeFeeFieldName(feeKey)
      );

      return {
        type: fee.feeName || fee.feesType || entry.type,
        columnBase: feeKey,
        amount: Number(entry.amount) || 0,
        installmentId: entry.installmentId || null,
        total: Number(feeRow?.total) || 0,
        paid: Number(feeRow?.paid) || 0,
        remaining: Number(feeRow?.remaining) || 0,
      };
    })
    .filter(Boolean);

  const customFeeEntriesFromDirectAmounts = dynamicFeeTypes
    .map((fee) => {
      const feeKey = fee.key || fee.columnBase || normalizeFeeColumnBase(fee.feeName || fee.feesType || "");
      
      // Skip tuition as it's handled in feeEntries
      if (feeKey === "tuition") return null;

      // 🔥 FIX: Skip if this fee is already being processed in feeEntries (e.g., via installments)
      const isAlreadyProcessed = processedFeeEntries.some(
        (entry) => normalizeFeeFieldName(entry.type) === normalizeFeeFieldName(feeKey)
      );
      if (isAlreadyProcessed) return null; // ⛔ Skip to prevent double counting!

      const amount = parseFloat(dynamicFeeValues[feeKey] || dynamicFeeValues[fee.columnBase] || 0);
      if (amount <= 0) return null;

      const feeRow = dynamicFeeRows.find((row) => normalizeFeeFieldName(row.key || row.label) === normalizeFeeFieldName(feeKey));

      // Update feeTypesPaid and total for custom fees
      if (feeTypesPaid[feeKey] !== undefined) {
        feeTypesPaid[feeKey] += amount;
      } else {
        feeTypesPaid[feeKey] = amount;
      }
      currentTransactionTotal += amount;

      return {
        type: fee.feeName,
        columnBase: feeKey,
        amount,
        total: feeRow?.total || 0,
        paid: feeRow?.paid || 0,
        remaining: feeRow?.remaining || 0,
      };
    })
    .filter(Boolean);

  const customFeeEntries = [
    ...customFeeEntriesFromInstallments,
    ...customFeeEntriesFromDirectAmounts,
  ];

  console.log("[DEBUG] processedFeeEntries:", processedFeeEntries);
  console.log("[DEBUG] customFeeEntries:", customFeeEntries);
  console.log("[DEBUG] feeTypesPaid:", feeTypesPaid);
  console.log("[DEBUG] currentTransactionTotal:", currentTransactionTotal);

  // Validate total amount
  if (currentTransactionTotal <= 0) {
    showPopupMessage(
      "Payment amount must be greater than 0. Please add a valid fee.",
      "error"
    );
    setIsLoading(false);
    return;
  }

  const normalizedCashAmount = normalizePaymentSplitAmount(cashAmount);
  const normalizedOnlineAmount = normalizePaymentSplitAmount(onlineAmount);
  const cashOnlineSplitTotal = Number((normalizedCashAmount + normalizedOnlineAmount).toFixed(2));
  const transactionTotalRounded = Number(currentTransactionTotal.toFixed(2));

  if (paymentMode === "Cash+Online") {
    if (cashOnlineSplitTotal <= 0) {
      showPopupMessage("Please enter cash and/or online amount for Cash+Online payment.", "error");
      setIsLoading(false);
      return;
    }

    if (Math.abs(cashOnlineSplitTotal - transactionTotalRounded) > 0.01) {
      showPopupMessage(
        `Cash + Online amount must match paid amount: Rs. ${transactionTotalRounded.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        "error"
      );
      setIsLoading(false);
      return;
    }
  }

// Auto add missing fee types
const dynamicPaidFees = [];

const existingFeeKeys = new Set(
  (dynamicFeeTypes || []).map((f) =>
    normalizeFeeFieldName(
      f.key || f.columnBase || f.feeName || f.feesType
    )
  )
);

const updatedDynamicFeeTypes = [...dynamicFeeTypes];
const updatedDynamicFeeRows = [...dynamicFeeRows];

processedFeeEntries.forEach((entry) => {
  const feeKey = normalizeFeeFieldName(entry.type);

  if (!existingFeeKeys.has(feeKey)) {
    existingFeeKeys.add(feeKey);

    updatedDynamicFeeTypes.push({
      key: feeKey,
      columnBase: feeKey,
      feeName: entry.type,
      feesType: entry.type,
    });

    updatedDynamicFeeRows.push({
      key: feeKey,
      label: entry.type,
      total: Number(entry.amount) || 0,
      paid: Number(entry.amount) || 0,
      due: 0,
    });
  }
});

// fees entered from feeEntries
processedFeeEntries.forEach((entry) => {
  dynamicPaidFees.push({
    key: entry.type,
    label: entry.type,
    paidThisTransaction: Number(entry.amount) || 0,
    installmentId: entry.installmentId || "",
    description: entry.description || "",
  });
});
// dynamic fees
customFeeEntries.forEach((entry) => {
  dynamicPaidFees.push({
    key: entry.columnBase,
    label: entry.type,
    paidThisTransaction: Number(entry.amount) || 0,
    totalPaid: (Number(entry.paid) || 0) + Number(entry.amount || 0),
    total: Number(entry.total) || 0,
    remaining: Math.max(
      (Number(entry.remaining) || 0) - Number(entry.amount || 0),
      0
    ),
  });
});

console.log("dynamicPaidFees", dynamicPaidFees);
  // Prepare payment data with ALL fee information
  const paymentData = {
    studentId: selectedStudentId,
    studentName: selectedStudent,
    className,
    sectionName: section,
    schoolCode,
    Paid_Amount: currentTransactionTotal, // Total of ALL fees
    books_paid: feeTypesPaid.books || 0,
    bus_paid: feeTypesPaid.bus || 0,
    uniform_paid: feeTypesPaid.uniform || 0,
    exam_paid: feeTypesPaid.exam || 0,
    admission_paid: feeTypesPaid.admission || 0,
    others_paid: feeTypesPaid.other || 0,
    residential_paid: feeTypesPaid.residential || 0,
tuition_paid_this_transaction: feeTypesPaid.tuition || 0,    tuition_installment_id: tuitionInstallmentIdBeingPaid,
    Discount: parseFloat(discountAmount) || 0,
    paymentDate,
    receiptNumber: formatReceiptNumber(),
    paymentMode,
    otherPaymentMode: paymentMode === "Others" ? trimmedOtherPaymentMode : "",
    transactionId: paymentMode === "Online" || paymentMode === "Cash+Online" ? transactionId : "",
    cashAmount: paymentMode === "Cash+Online" ? normalizedCashAmount : 0,
    onlineAmount: paymentMode === "Cash+Online" ? normalizedOnlineAmount : 0,
    feeDescriptions: processedFeeEntries, // All processed fee entries
    customFeeEntries, // Custom fees (excluding tuition)
    dynamicFeeRows: updatedDynamicFeeRows.map((row) => ({
  key: row.key,
  label: row.label,
  total: Number(row.total) || 0,
  paid: Number(row.paid) || 0,
  due: Number(row.due) || 0,
})),
    allowDuplicate: false,
  };

  console.log("[DEBUG] Final paymentData:", paymentData);

  try {
    // First check for duplicates
    const duplicateCheckResponse = await fetch(
      "https://cleezoclass.com:4000/api/check-duplicate-fee-payment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      }
    );

    if (duplicateCheckResponse.ok) {
      const duplicateCheckData = await duplicateCheckResponse.json();
   const isInstallmentPayment = processedFeeEntries.some(
  (entry) => entry.installmentId
);

if (duplicateCheckData?.exists && !isInstallmentPayment) {
  const paidPopupData = {
          studentId: selectedStudentId,
          studentName: selectedStudent,
          className,
          section,
          paymentDate,
          receiptNumber: paymentData.receiptNumber,
          paymentMode,
          otherPaymentMode: paymentData.otherPaymentMode,
          transactionId: paymentData.transactionId,
          cashAmount: paymentData.cashAmount,
          onlineAmount: paymentData.onlineAmount,
          discountAmount: parseFloat(discountAmount) || 0,
          paidAmount: currentTransactionTotal,
          paidFees: dynamicPaidFees,
          dynamicFeeTypes: dynamicFeeTypes || [],
          dynamicFeeRows: updatedDynamicFeeRows.map((row) => ({
            key: row.key,
            label: row.label,
            total: Number(row.total) || 0,
            paid: Number(row.paid) || 0,
            due: Number(row.due) || 0,
          })),
          customFees: customFeeEntries.map((entry) => ({
            key: entry.columnBase,
            label: entry.type,
            paidThisTransaction: entry.amount,
            totalPaid: (Number(entry.paid) || 0) + entry.amount,
            total: Number(entry.total) || 0,
            remaining: Math.max((Number(entry.remaining) || 0) - entry.amount, 0),
          })),
          submittedFeeEntries: [...processedFeeEntries, ...customFeeEntries],
        };
        
       setPaidPageData(paidPopupData);
  setShowPopup(false);
  setShowPaidPopup(true);
  setIsLoading(false);
  return;
      }
    }
    // Submit payment to backend
    const response = await fetch(
      "https://cleezoclass.com:4000/pay-fee-detailsincome",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      }
    );

    let data;
    try {
      data = await response.json();
    } catch (err) {
      console.error("Failed to parse JSON:", err);
      data = {};
    }

    // Handle duplicate payment (409 Conflict)
    if (response.status === 409 && data?.duplicate) {
      const confirmMessage = `Already paid this amount with receipt number ${data.receiptNumber}. Pay again?`;
      const proceedWithDuplicate = await askDuplicateConfirmation(confirmMessage);
      if (!proceedWithDuplicate) {
        setIsLoading(false);
        return;
      }
      paymentData.allowDuplicate = true;
      const retryResponse = await fetch(
        "https://cleezoclass.com:4000/pay-fee-detailsincome",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        }
      );
      data = await retryResponse.json().catch(() => ({}));
    }

    // Handle success
    if ((response.ok && data.success !== false) || data.success === true) {
      console.log("[Payment][receiptEmail]", data?.receiptEmail || null);
      const usedReceiptNumber = data?.receiptNumber || paymentData.receiptNumber;
      setReceiptNumber(usedReceiptNumber);
      currentReceiptNumberRef.current = usedReceiptNumber;

const paidPopupData = {
  studentId: selectedStudentId,
  studentName: selectedStudent,
  className,
  section,
  paymentDate,
  receiptNumber: usedReceiptNumber,
  paymentMode,
  otherPaymentMode: paymentData.otherPaymentMode,
  transactionId: paymentData.transactionId,
  cashAmount: paymentData.cashAmount,
  onlineAmount: paymentData.onlineAmount,
  discountAmount: parseFloat(discountAmount) || 0,
  paidAmount: currentTransactionTotal,

  paidFees: dynamicPaidFees,

  dynamicFeeTypes: dynamicFeeTypes || [],

  dynamicFeeRows: updatedDynamicFeeRows.map((row) => ({
    key: row.key,
    label: row.label,
    total: Number(row.total) || 0,
    paid: Number(row.paid) || 0,
    due: Number(row.due) || 0,
  })),

  customFees: customFeeEntries.map((entry) => ({
    key: entry.columnBase,
    label: entry.type,
    paidThisTransaction: entry.amount,
    totalPaid: (Number(entry.paid) || 0) + entry.amount,
    total: Number(entry.total) || 0,
    remaining: Math.max(
      (Number(entry.remaining) || 0) - entry.amount,
      0
    ),
  })),

  submittedFeeEntries: [
    ...processedFeeEntries,
    ...customFeeEntries,
  ],
};

      setPaidPageData(paidPopupData);
      setShowPopup(false);
      setShowPaidPopup(true);
      showPopupMessage(data.message || "Payment submitted successfully!", "success");

      // Reset form
      setFeeEntries([{ type: "", amount: "" }]);
      setPaymentDate("");
      setPaymentMode("");
      setOtherPaymentMode("");
      setTransactionId("");
      setCashAmount(0);
      setOnlineAmount(0);
      setDiscountAmount(0);

const refreshStudentId = selectedStudentId;

if (refreshStudentId !== null && refreshStudentId !== undefined) {
  setSelectedStudentId(null);

  setTimeout(() => {
    setSelectedStudentId(refreshStudentId);
  }, 0);
}

incrementReceiptNumber();

      // Callback if provided
      if (typeof onPaymentSuccess === "function") {
        try {
          await onPaymentSuccess({
            studentId: selectedStudentId,
            studentName: selectedStudent,
            className,
            section,
            paymentDate,
            receiptNumber: usedReceiptNumber,
            paymentMode,
            paidAmount: currentTransactionTotal,
          });
        } catch (refreshError) {
          console.error("[Payment][submit] refresh callback failed:", refreshError);
        }
      }
    } else {
      // Handle failure
      const errorMsg = data.message || "Payment submission failed. Please try again.";
      showPopupMessage(errorMsg, "error");
      console.error("[DEBUG] Payment submission error:", errorMsg, data);
    }
  } catch (err) {
    console.error("[DEBUG] Payment failed:", err);
    showPopupMessage("Payment submission failed. Please try again.", "error");
  } finally {
    setIsLoading(false);
  }
};
  // Save Edited Bill
const saveEditedBill = async (e) => {
  if (e?.preventDefault) e.preventDefault();


    // Update state with edited values
    setReceiptNumber(editableBill.receiptNumber);
    setStudentData(editableBill.studentData);
    setTuitionFee(editableBill.tuitionFee);
    setAdmissionFee(editableBill.admissionFee);
    setExamFee(editableBill.examFee);
    setBusFee(editableBill.busFee);
    setBookFee(editableBill.bookFee);
    setUniformFee(editableBill.uniformFee);
    setOthersFee(editableBill.othersFee);
    setTuitionPaid(editableBill.tuitionPaid);
    setAdmissionPaid(editableBill.admissionPaid);
    setExamPaid(editableBill.examPaid);
    setBusPaid(editableBill.busPaid);
    setBookPaid(editableBill.bookPaid);
    setUniformPaid(editableBill.uniformPaid);
    setOthersPaid(editableBill.othersPaid);
    setTuitionDiscount(editableBill.tuitionDiscount);
    setBusDiscount(editableBill.busDiscount);
    setBookDiscount(editableBill.bookDiscount);
    setPaymentMode(editableBill.paymentMode);
    setOtherPaymentMode(editableBill.otherPaymentMode || "");
    setPaymentDate(editableBill.paymentDate);
    setSchoolName(editableBill.schoolName);
    setTotalAmount(editableBill.totalAmount);
    setPaidAmount(editableBill.paidAmount);
    setRemainingAmount(editableBill.remainingAmount);

    const sourceElement = document.getElementById('bill-preview-content')?.children[0];
    if (!sourceElement) {
      alert("Could not find the bill content to generate the image.");
      return;
    }
    if (!studentData?.name) {
      alert("Please select a student before saving.");
      return;
    }

    // Create a hidden div to hold the cleaned clone
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.position = 'absolute';
    hiddenDiv.style.left = '-9999px';
    hiddenDiv.style.width = '280px';
    hiddenDiv.style.overflow = 'visible';
    hiddenDiv.style.backgroundColor = '#ffffff';
    document.body.appendChild(hiddenDiv);

    // Clone the element and remove all edit inputs
    const clonedElement = sourceElement.cloneNode(true);
    const inputs = clonedElement.querySelectorAll('input, select, button');
    inputs.forEach(input => input.remove());

    // Set explicit widths for table cells to ensure columns are visible
    const amountCells = clonedElement.querySelectorAll('td:nth-child(2), th:nth-child(2)');
    amountCells.forEach(cell => {
      cell.style.width = '80px';
      cell.style.minWidth = '80px';
    });
    const paidCells = clonedElement.querySelectorAll('td:nth-child(3), th:nth-child(3)');
    paidCells.forEach(cell => {
      cell.style.width = '80px';
      cell.style.minWidth = '80px';
    });

    // Append the cleaned clone to the hidden div
    hiddenDiv.appendChild(clonedElement);

    // Add styles to ensure table borders and text are visible
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        font-family: Arial, sans-serif !important;
        color: #000 !important;
        font-weight: 400 !important;
        -webkit-font-smoothing: none !important;
        font-smooth: never !important;
        text-rendering: geometricPrecision !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      td, th {
        border: 1px solid #000 !important;
        padding: 2px 4px !important;
        text-align: right !important;
      }
      th {
        background-color: #f0f0f0 !important;
      }
      .text-right {
        text-align: right !important;
      }
      .text-left {
        text-align: left !important;
      }
    `;
    hiddenDiv.appendChild(style);

    try {
      // Use html2canvas to capture the cleaned clone
      const canvas = await html2canvas(hiddenDiv, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        letterRendering: true,
        removeContainer: true,
        logging: true,
        allowTaint: true,
        width: clonedElement.offsetWidth,
        height: clonedElement.offsetHeight,
        windowWidth: clonedElement.offsetWidth,
        windowHeight: clonedElement.offsetHeight,
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
      if (!blob) throw new Error("Failed to create image blob.");

      const schoolCode = localStorage.getItem('schoolCode');
      if (!schoolCode) throw new Error("School code not found.");

      const formData = new FormData();
      formData.append('billImage', blob, `receipt-${receiptNumber}-${studentData.name}.png`);
      formData.append('receiptNumber', receiptNumber);
      formData.append('studentName', studentData.name);
      formData.append('class', studentData.class);
      formData.append('section', studentData.section);
      formData.append('schoolCode', schoolCode);
      formData.append('regn_no', studentData.rollNumber);

      const response = await axios.post('https://cleezoclass.com:4000/api/bill/save', formData);
      if (response.status === 200) {
        setSuccessMessage("Bill saved successfully!");
        setShowSuccessModal(true);
        incrementReceiptNumber();
      } else {
        throw new Error(response.data.message || 'Server responded with an error.');
      }
    } catch (error) {
      console.error('Error saving bill image:', error);
      alert(`Failed to save image: ${error.message}`);
    } finally {
      // Clean up the hidden div
      if (document.body.contains(hiddenDiv)) {
        document.body.removeChild(hiddenDiv);
      }
    }
  };



  
  
const showPopupMessage = (message) => {
  setPopupMsg(message);
};

  const handleShare = async () => {
    const blob = await generatePDFBlob();
    const file = new File([blob], "Warmleads.pdf", { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: "Management Report",
          text: "Please find the Management report attached.",
          files: [file],
        });
      } catch (err) {
        showPopupMessage(
          "Sharing was cancelled or failed: " + err.message,
          "error"
        );
      }
    } else {
      showPopupMessage(
        "This device or browser does not support file sharing. Please download and share manually.",
        "error"
      );
    }
  };

  const [studentName, setStudentName] = useState("");


  const [loading, setLoading] = useState(false);

  // Example classes and sections (can be dynamic if you fetch from backend)
  const classes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sections = ["A", "B", "C", "D"];


const [totals, setTotals] = useState({
  Total_Calculated_Due: 0,
  Total_Paid_Without_Admission: 0,
  Total_Admission_Paid: 0,
  Percent_Due: 0,
  Percent_Paid: 0,
  Percent_Admission_Paid: 0,
  Percent_Admission_Due: 0
});

const fetchTotals = async () => {
  if (!className || !section) return;
  setLoading(true);
  setError("");

  try {
    const schoolCode = localStorage.getItem("schoolCode"); // ⬅️ Get from localStorage

    let res;

    if (studentName) {
      // 🔵 Student totals API (GET)
      res = await axios.get("https://cleezoclass.com:4000/api/admin/getStudentTotals", {
        params: { className, section, studentName, schoolCode }, 
      });

    } else {
      // 🔵 Class-section totals API (POST)
      res = await axios.post(
        "https://cleezoclass.com:4000/api/admin/getClassSectionFeeTotal",
        { className, section, schoolCode }  // ⬅️ Put in body
      );

    }

    const data = res.data;

    setTotals({
      Total_Calculated_Due: data.Total_Calculated_Due,
      Total_Paid_Without_Admission: data.Total_Paid_Without_Admission,
      Total_Admission_Paid: data.Total_Admission_Paid,
      Percent_Due: data.Percent_Due,
      Percent_Paid: data.Percent_Paid,
      Percent_Admission_Paid: data.Percent_Admission_Paid,
      Percent_Admission_Due: data.Percent_Admission_Due
    });

  } catch (err) {
    console.error(err);
    setError(err.response?.data?.message || "Failed to fetch totals.");
  } finally {
    setLoading(false);
  }
};




  // Refetch totals whenever selections change
  useEffect(() => {
    fetchTotals();
  }, [className, section, studentName]);
  
 const isLaptop = window.innerWidth >= 1024; 
useEffect(() => {
  const today = new Date().toISOString().split("T")[0];
  setPaymentDate(today);
  }, []);
  // FETCH DROPDOWNS
const [classFeeData, setClassFeeData] = useState({});
  const [studentFeesMap, setStudentFeesMap] = useState({});

  useEffect(() => {
  }, [
    classFeeData,
    className,
    dynamicFeeTypes,
    initialStudentId,
    initialStudentName,
    payments,
    section,
    selectedClassSection,
    selectedStudent,
    selectedStudentFeeDetails,
    selectedStudentId,
    studentFeesMap,
  ]);


  // --------------------------------------------
  // STEP 1 → Fetch CLASS fee when dropdown changes
  // --------------------------------------------
  useEffect(() => {
    if (!selectedClassSection) return;

    const [cls, sec] = selectedClassSection.split("_");
    setClassName(cls);
    setSection(sec);

    fetchClassFee(cls, sec);
  }, [selectedClassSection]);

  const fetchClassFee = async (cls, sec) => {
    try {
      const schoolCode = localStorage.getItem("schoolCode");

      const res = await axios.get(`https://cleezoclass.com:4000/feeStructure/${cls}`, {
        params: { className: cls, section: sec, schoolCode },
      });

      const resolvedFeeDetail = res.data.feeStructure || {};

      setClassFeeData(resolvedFeeDetail);
    } catch (error) {
      console.error("Error fetching class fees:", error);
      setClassFeeData({});
    }
  };
useEffect(() => {
  if (selectedClassSection) {
    const [cls, sec] = selectedClassSection.split("_");
    setClassName(cls);
    setSection(sec);
  }
}, [selectedClassSection]);

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId);
    }
    if (initialStudentName) {
      setSelectedStudent(initialStudentName);
    }
  }, [initialStudentId, initialStudentName]);

  useEffect(() => {
    if (!students.length) return;

    const normalizedTargetClass = normalizeClassLabel(className);
    const normalizedTargetSection = String(section || "").trim().toLowerCase();
    const normalizedTargetName = String(
      initialStudentName || selectedStudent || ""
    )
      .trim()
      .toLowerCase();

    const currentMatch = students.find(
      (student) => String(student.id) === String(selectedStudentId)
    );

    if (currentMatch) {
      return;
    }

    if (!normalizedTargetName) return;

    const resolvedStudent = students.find((student) => {
      const studentName = String(student.name || student.studentName || student.StudentName || "")
        .trim()
        .toLowerCase();
      const studentClass = normalizeClassLabel(
        student.class_name || student.className || student.class || student.FeeClass || ""
      ).toLowerCase();
      const studentSection = String(
        student.section || student.sectionName || student.Section || student.FeeSection || ""
      )
        .trim()
        .toLowerCase();

      const nameMatches = studentName === normalizedTargetName;
      const classMatches = !normalizedTargetClass || studentClass === normalizedTargetClass.toLowerCase();
      const sectionMatches =
        !normalizedTargetSection || studentSection === normalizedTargetSection;

      return nameMatches && classMatches && sectionMatches;
    });

    if (resolvedStudent) {
      setSelectedStudentId(resolvedStudent.id);
      setSelectedStudent(resolvedStudent.name);
    }
  }, [students, selectedStudentId, initialStudentName, selectedStudent, className, section]);

useEffect(() => {
  if (popupOnly) {
    setShowPopup(true);
  }
}, [popupOnly]);
// In your useEffect where dynamicFeeTypes is fetched:
useEffect(() => {
  const fetchDynamicFeeTypes = async () => {
    try {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) return;

      const response = await axios.get("https://cleezoclass.com:4000/api/fee-types", {
        params: { schoolCode },
      });

      let rows = Array.isArray(response.data?.data) ? response.data.data : [];

      // Filter out tuition since it's a standard field
      const filteredRows = rows.filter(fee =>
        normalizeFeeFieldName(fee.feeName) !== "tuition" &&
        normalizeFeeColumnBase(fee.feeName) !== "tuition"
      );

      const normalized = filteredRows
        .map((item) => {
          const columnBase = normalizeFeeColumnBase(item?.feeName);
          if (!columnBase) return null;
          return {
            id: item?.id,
            feeName: item?.feeName || columnBase,
            feesType: item?.feesType || "Custom Fee",
            scope: item?.scope || "All",
            frequency: item?.frequency || "One time",
            installments: item?.installments || 1,
            columnBase,
          };
        })
        .filter(Boolean);

      setDynamicFeeTypes(normalized);

      // Initialize dynamicFeeValues (tuition is handled separately)
      setDynamicFeeValues((prev) => {
        const next = { ...prev };
        normalized.forEach((fee) => {
          if (!(fee.columnBase in next)) {
            next[fee.columnBase] = "";
          }
        });
        return next;
      });

      console.log("[DEBUG] Final dynamicFeeTypes (without tuition):", normalized);
    } catch (error) {
      console.error("Error loading custom fee types:", error);
      setDynamicFeeTypes([]);
    }
  };

  fetchDynamicFeeTypes();
}, [feeStructure]);
useEffect(() => {
  // In popupOnly mode we still need the student list so the selected student id
  // can be resolved by name if the parent didn't pass a concrete id.
  if (showPopup && !popupOnly) return;

  if (!className || !section) {
    setStudents([]);
    return;
  }

  const schoolCode = localStorage.getItem("schoolCode");

  const fetchStudents = () => {
    axios
      .get(
        `https://cleezoclass.com:4000/api/studentsNameAccountant/${className}?schoolCode=${schoolCode}&section=${section}`
      )
      .then((res) => {
        setStudents(res.data?.students || []);
      })
      .catch(() => {
        setStudents([]);
      });
  };

  // 🚀 fetch immediately after popup closes
  fetchStudents();
  return undefined;
}, [showPopup, className, section, popupOnly, initialStudentId, initialStudentName]);

useEffect(() => {
  if (!students.length || !className || !section) {
    setStudentFeesMap({});
    return;
  }

  const schoolCode = localStorage.getItem("schoolCode");
  if (!schoolCode) return;

  let isCancelled = false;

  const normalizeCompositeKey = (name, cls, sec) =>
    [
      String(name || "").trim().toLowerCase(),
      String(cls || "").trim().toLowerCase(),
      String(sec || "").trim().toLowerCase(),
    ].join("|");

  const summarizePaymentPayload = (payload = {}) => {
    const rows = [
      ...(Array.isArray(payload?.dynamicFeeBreakdown) ? payload.dynamicFeeBreakdown : []),
      ...(Array.isArray(payload?.individualFeeAssignments) ? payload.individualFeeAssignments : []),
    ];
    const individualRows = rows.filter((row) => {
      const scope = String(row?.source || row?.scope || row?.feeScope || "").trim().toLowerCase();
      return scope === "individual" || String(row?.key || row?.label || "").trim().toLowerCase() === "pg";
    });

    const totalAmount = individualRows.reduce((sum, row) => {
      const amount = Number(row?.total ?? row?.amount ?? row?.amountTotal ?? row?.completeFee ?? 0);
      return sum + (Number.isFinite(amount) ? Math.max(amount, 0) : 0);
    }, 0);

    const paidAmount = individualRows.reduce((sum, row) => {
      const paid = Number(row?.paid ?? row?.paidAmount ?? row?.amountPaid ?? row?.paid_total ?? 0);
      return sum + (Number.isFinite(paid) ? Math.max(paid, 0) : 0);
    }, 0);

    const discountAmount = individualRows.reduce((sum, row) => {
      const discount = Number(row?.discount ?? row?.discountAmount ?? row?.amountDiscount ?? 0);
      return sum + (Number.isFinite(discount) ? Math.max(discount, 0) : 0);
    }, 0);

    const remainingAmount = individualRows.reduce((sum, row) => {
      const explicitRemaining = Number(row?.remaining ?? row?.due ?? row?.dueAmount ?? 0);
      if (Number.isFinite(explicitRemaining) && explicitRemaining > 0) {
        return sum + explicitRemaining;
      }
      const amount = Number(row?.total ?? row?.amount ?? row?.amountTotal ?? row?.completeFee ?? 0);
      const paid = Number(row?.paid ?? row?.paidAmount ?? row?.amountPaid ?? row?.paid_total ?? 0);
      const discount = Number(row?.discount ?? row?.discountAmount ?? row?.amountDiscount ?? 0);
      return sum + Math.max(
        (Number.isFinite(amount) ? amount : 0) -
          (Number.isFinite(paid) ? paid : 0) -
          (Number.isFinite(discount) ? discount : 0),
        0
      );
    }, 0);

    return {
      totalAmount,
      paidAmount,
      discountAmount,
      remainingAmount,
      individualRowsCount: individualRows.length,
    };
  };

  Promise.all(
    students.map(async (student) => {
      const studentId = getStudentLookupId(student);
      const studentName = student?.name || student?.studentName || student?.StudentName || "";
      const studentClass = student?.class_name || student?.className || student?.class || className || "";
      const studentSection = student?.section || student?.sectionName || student?.Section || section || "";
      if (studentId === undefined || studentId === null || studentId === "") return null;
      try {
        const response = await axios.get(`https://cleezoclass.com:4000/api/payment/${studentId}`, {
          params: { schoolCode },
        });
        const payload = response?.data?.payments || response?.data?.payment || response?.data || {};
        const summary = summarizePaymentPayload(payload);
        return [
          String(studentId),
          {
            ...summary,
            studentName: payload?.studentName || studentName,
            className: payload?.class || payload?.className || studentClass,
            section: payload?.section || payload?.sectionName || studentSection,
          },
        ];
      } catch {
        return [String(studentId), null];
      }
    })
  ).then((entries) => {
    if (isCancelled) return;
    const nextMap = {};
    entries.forEach(([key, summary]) => {
      if (!key || !summary) return;
      nextMap[key] = summary;
      const compositeKey = normalizeCompositeKey(summary.studentName, summary.className, summary.section);
      if (compositeKey.replace(/\|/g, "").trim()) {
        nextMap[compositeKey] = summary;
      }
    });
    setStudentFeesMap(nextMap);
  });

  return () => {
    isCancelled = true;
  };
}, [students, className, section]);



  // --------------------------------------------
  // HANDLE CLASS-SECTION CHANGE
  // --------------------------------------------
  const handleClassSectionChange = (e) => {
    setSelectedClassSection(e.target.value);
    setStudentFeesMap({});
    setClassFeeData({});
  };

const [feeDetail, setFeeDetail] = useState(null);

const [feeError, setFeeError] = useState("");

const normalizedClassFeeStructure = React.useMemo(() => {
  const source = feeStructure && typeof feeStructure === "object" ? feeStructure : {};
  const admission = Number(source.admission ?? source.Admission_Fee ?? source.Admission_fees ?? 0) || 0;
  const tuition = Number(source.tuition ?? source.Tuition_Fee ?? source.Calculated_Tuition_Fee ?? 0) || 0;
  const exam = Number(source.exam ?? source.Exam_Fee ?? source.Exam_fees ?? 0) || 0;
  const bus = Number(source.bus ?? source.Bus_Fee ?? source.Bus_fees ?? 0) || 0;
  const uniform = Number(source.uniform ?? source.Uniform_Fee ?? source.Uniform_fees ?? 0) || 0;
  const books = Number(source.books ?? source.Book_Fee ?? source.Book_Fees ?? 0) || 0;
  const others = Number(source.other ?? source.Other_Fee ?? source.Others ?? 0) || 0;
  const residential = Number(source.residential ?? source.ResidentialCompleteFee ?? 0) || 0;
  const completeFee = Number(source.complete_fee ?? source.CompleteFee ?? 0) || 0;

  return {
    Admission_Fee: admission,
    Admission_fees: admission,
    Tuition_Fee: tuition,
    Calculated_Tuition_Fee: tuition,
    Exam_Fee: exam,
    Exam_fees: exam,
    Bus_Fee: bus,
    Bus_fees: bus,
    Uniform_Fee: uniform,
    Uniform_fees: uniform,
    Book_Fee: books,
    Book_Fees: books,
    Other_Fee: others,
    Others: others,
    ResidentialCompleteFee: residential,
    CompleteFee: completeFee,
    complete_fee: completeFee,
  };
}, [feeStructure]);

const customClassFeeSource = React.useMemo(() => {
  const source = classFeeData && Object.keys(classFeeData).length > 0 ? classFeeData : feeDetail || {};
  return Object.keys(source).reduce((acc, key) => {
    if (isStaticOrMetaFeeField(key)) return acc;
    const normalized = normalizeFeeFieldName(key);
    if (normalized.endsWith("paid") || normalized.endsWith("due")) return acc;
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});
}, [classFeeData, feeDetail]);

const classFeeSource = React.useMemo(
  () => ({
    ...normalizedClassFeeStructure,
    ...customClassFeeSource,
  }),
  [normalizedClassFeeStructure, customClassFeeSource]
);

const selectedStudentDiscountSource = React.useMemo(() => {
  const selectedId = String(selectedStudentId || initialStudentId || "").trim();
  const selectedName = String(selectedStudent || initialStudentName || "")
    .trim()
    .toLowerCase();

  return students.find((student) => {
    const studentId = getStudentLookupId(student);
    const studentName = String(
      student?.name || student?.studentName || student?.StudentName || ""
    )
      .trim()
      .toLowerCase();

    return Boolean(
      (selectedId && studentId && selectedId === studentId) ||
        (selectedName && studentName && selectedName === studentName)
    );
  }) || {};
}, [initialStudentId, initialStudentName, selectedStudent, selectedStudentId, students]);

const rawFeeInstallmentSource = React.useMemo(
  () => ({
    ...(feeDetail || {}),
    ...(classFeeData || {}),
    ...(feeStructureRaw || {}),
  }),
  [classFeeData, feeDetail, feeStructureRaw]
);

const classWiseInstallmentMap = React.useMemo(
  () => buildInstallmentRowsFromRawSource(rawFeeInstallmentSource || {}),
  [rawFeeInstallmentSource]
);

const individualFeeInstallmentMap = React.useMemo(() => {
  const studentRows = Array.isArray(selectedStudentFeeDetails?.studentDetailRows)
    ? selectedStudentFeeDetails.studentDetailRows
    : selectedStudentFeeDetails?.studentDetails
      ? [selectedStudentFeeDetails.studentDetails]
      : [];

  const installmentMap = buildIndividualInstallmentRowsFromStudentRows(studentRows);
  console.log("[PaymentDebug] individual installment map", {
    studentRows,
    installmentMap,
    tuitionRows: installmentMap?.tuition || [],
  });
  return installmentMap;
}, [selectedStudentFeeDetails]);

const tuitionInstallmentRows = React.useMemo(
  () => {
    const individualRows = individualFeeInstallmentMap?.tuition || [];
    return hasConfiguredInstallmentAmounts(individualRows)
      ? individualRows
      : mergeInstallmentPlanWithPayments(classWiseInstallmentMap?.tuition || [], individualRows);
  },
  [classWiseInstallmentMap, individualFeeInstallmentMap]
);

const dynamicFeeRows = React.useMemo(() => {
  const backendDynamicBreakdown = [
    ...(Array.isArray(selectedStudentFeeDetails?.dynamicFeeBreakdown) ? selectedStudentFeeDetails.dynamicFeeBreakdown : []),
    ...(Array.isArray(payments?.dynamicFeeBreakdown) ? payments.dynamicFeeBreakdown : []),
  ];
  const backendRows = [];
  const backendSeen = new Set();

  backendDynamicBreakdown.forEach((fee) => {
    const key = normalizeFeeFieldName(fee?.key || fee?.label || "");
    if (!key || key === "amount" || backendSeen.has(key)) return;

    const total = Number(fee?.total ?? fee?.amount ?? fee?.amountTotal ?? 0);
    const paid = Number(fee?.paid ?? fee?.paidAmount ?? fee?.amountPaid ?? 0);
    const discount = Math.max(
      Number(fee?.discount ?? fee?.discountAmount ?? 0) || 0,
      readFeeDiscountValue(
        selectedStudentDiscountSource,
        fee?.key || fee?.label || "",
        fee?.label || fee?.key || ""
      )
    );
    const remaining = Number(fee?.remaining ?? fee?.due ?? fee?.dueAmount ?? 0);

    if (![total, paid, discount, remaining].some((value) => Number.isFinite(value) && value > 0)) {
      return;
    }

    backendSeen.add(key);
    const grossTotal = Number.isFinite(total) ? Math.max(total, 0) : 0;
    const appliedDiscount = Number.isFinite(discount) ? Math.max(discount, 0) : 0;
    const netTotal = Math.max(grossTotal - appliedDiscount, 0);
    const paidTotal = Number.isFinite(paid) ? Math.max(paid, 0) : 0;
    backendRows.push({
      key: fee?.key || key,
      label: fee?.label || formatCustomFeeLabel(fee?.key || key),
      total: netTotal,
      paid: paidTotal,
      discount: appliedDiscount,
      remaining: Number.isFinite(remaining) && remaining > 0
        ? Math.min(Math.max(remaining, 0), Math.max(netTotal - paidTotal, 0))
        : Math.max(netTotal - paidTotal, 0),
      installments: Math.max(Number(fee?.installments || fee?.installmentCount || 1) || 1, 1),
      isCustom: true,
      source: fee?.source || fee?.scope || "backend",
    });
  });

  const paymentDynamicTotals = payments?.dynamicFeeTotals || {};
  const paymentDynamicPaidTotals = payments?.dynamicFeePaidTotals || {};
  const paymentDynamicDiscounts = payments?.dynamicFeeDiscounts || {};
  const paymentDynamicDueTotals = payments?.dynamicFeeDueTotals || {};
  const studentDynamicTotals = selectedStudentFeeDetails?.dynamicFeeTotals || {};
  const studentDynamicPaidTotals = selectedStudentFeeDetails?.dynamicFeePaidTotals || {};
  const studentDynamicDiscounts = selectedStudentFeeDetails?.dynamicFeeDiscounts || {};
  const studentDynamicDueTotals = selectedStudentFeeDetails?.dynamicFeeDueTotals || {};
  const source = {
    ...(classFeeSource || {}),
    ...(payments || {}),
    ...(selectedStudentFeeDetails?.studentDetails || {}),
    ...(selectedStudentFeeDetails?.feeStructure || {}),
  };
  const dynamicSource = mergeDynamicFeeSources(payments, selectedStudentFeeDetails, selectedStudentFeeDetails?.studentDetails, selectedStudentFeeDetails?.feeStructure);
  const selectedStudentNameNormalized = String(
    selectedStudent || initialStudentName || payments?.studentName || payments?.StudentName || ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const selectedStudentIdNormalized = String(selectedStudentId || initialStudentId || "").trim();
  const individualAssignments = [
    ...(Array.isArray(selectedStudentFeeDetails?.individualFeeAssignments) ? selectedStudentFeeDetails.individualFeeAssignments : []),
    ...(Array.isArray(payments?.individualFeeAssignments) ? payments.individualFeeAssignments : []),
  ];
  const backendRowMap = new Map();
  backendDynamicBreakdown.forEach((fee) => {
    const normalizedKey = normalizeFeeFieldName(fee?.key || fee?.label || "");
    if (!normalizedKey) return;
    backendRowMap.set(normalizedKey, fee);
  });
  const normalizedDynamicTypes = dynamicFeeTypes.length
    ? dynamicFeeTypes
    : Object.keys(source)
        .filter((key) => !isStaticOrMetaFeeField(key))
        .filter((key) => {
          const normalized = normalizeFeeFieldName(key);
          return !normalized.endsWith("paid") && !normalized.endsWith("due");
        })
        .map((key) => ({
          id: key,
          feeName: formatCustomFeeLabel(key),
          columnBase: key,
        }));

  const computedRows = normalizedDynamicTypes
    .map((fee) => {
      const sourceKey = fee.columnBase || fee.id;
      const feeScope = String(fee.scope || "").trim().toLowerCase();
      const sourceAliases = getFeeKeyAliases(sourceKey);
      const labelAliases = getFeeKeyAliases(fee.feeName);
      const allAliases = Array.from(
        new Set([
          `${sourceKey}_total`,
          `${sourceKey}_amount`,
          `${fee.feeName}_total`,
          `${fee.feeName}_amount`,
          sourceKey,
          fee.feeName,
          ...sourceAliases,
          ...labelAliases,
        ])
      );
      const paidKeys = allAliases.flatMap((key) => [`${key}_paid`, `${key}_Paid`]);
      const dueKeys = allAliases.flatMap((key) => [`${key}_due`, `${key}_Due`]);
      const individualInstallmentRows =
        individualFeeInstallmentMap?.[normalizeInstallmentGroupKey(sourceKey)] ||
        individualFeeInstallmentMap?.[normalizeInstallmentGroupKey(fee.feeName)] ||
        [];
      const classInstallmentRows =
        classWiseInstallmentMap?.[normalizeInstallmentGroupKey(sourceKey)] ||
        classWiseInstallmentMap?.[normalizeInstallmentGroupKey(fee.feeName)] ||
        [];
      const configuredInstallmentRows = hasConfiguredInstallmentAmounts(individualInstallmentRows)
        ? individualInstallmentRows
        : mergeInstallmentPlanWithPayments(classInstallmentRows, individualInstallmentRows);
      const configuredInstallmentTotal = configuredInstallmentRows.reduce((sum, installment) => {
        const amount = Number(installment?.amount || installment?.Amount || 0);
        return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
      }, 0);
      const configuredInstallmentPaid = configuredInstallmentRows.reduce((sum, installment) => {
        const paid = Number(installment?.paid || installment?.Paid || 0);
        return sum + (Number.isFinite(paid) && paid > 0 ? paid : 0);
      }, 0);
      const configuredInstallmentDue = configuredInstallmentTotal > 0
        ? Math.max(configuredInstallmentTotal - configuredInstallmentPaid, 0)
        : 0;

      const matchingIndividualAssignment = individualAssignments.find((entry) => {
        const entryStudentId = String(
          entry?.studentId || entry?.student_id || entry?.StudentId || entry?.Student_ID || ""
        ).trim();
        const entryStudentName = String(
          entry?.studentName || entry?.StudentName || entry?.name || entry?.student || ""
        )
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");
        const studentMatch =
          (selectedStudentIdNormalized && entryStudentId && selectedStudentIdNormalized === entryStudentId) ||
          (selectedStudentNameNormalized && entryStudentName && selectedStudentNameNormalized === entryStudentName);
        if (!studentMatch) return false;

        const entryKey = normalizeFeeFieldName(
          entry?.type || entry?.columnBase || entry?.feeName || entry?.label || ""
        );
        return (
          entryKey === normalizeFeeFieldName(sourceKey) ||
          entryKey === normalizeFeeFieldName(fee.feeName)
        );
      });
      const backendFeeRow = backendRowMap.get(normalizeFeeFieldName(sourceKey)) || backendRowMap.get(normalizeFeeFieldName(fee.feeName)) || null;
      const explicitBackendTotal = Number(backendFeeRow?.total) || Number(backendFeeRow?.amount) || 0;
      const explicitBackendPaid = Number(backendFeeRow?.paid) || Number(backendFeeRow?.paidAmount) || 0;
      const explicitBackendDue = Number(backendFeeRow?.remaining) || Number(backendFeeRow?.due) || 0;
      const explicitBackendDiscount = Number(backendFeeRow?.discount) || Number(backendFeeRow?.discountAmount) || 0;
      const explicitStudentTotal =
        Number(studentDynamicTotals?.[sourceKey]) ||
        Number(studentDynamicTotals?.[fee.feeName]) ||
        Number(studentDynamicTotals?.[normalizeFeeFieldName(sourceKey)]) ||
        0;
      const explicitPaymentTotal =
        Number(paymentDynamicTotals?.[sourceKey]) ||
        Number(paymentDynamicTotals?.[fee.feeName]) ||
        Number(paymentDynamicTotals?.[normalizeFeeFieldName(sourceKey)]) ||
        0;
      const explicitStudentPaid =
        Number(studentDynamicPaidTotals?.[sourceKey]) ||
        Number(studentDynamicPaidTotals?.[fee.feeName]) ||
        Number(studentDynamicPaidTotals?.[normalizeFeeFieldName(sourceKey)]) ||
        0;
      const explicitPaymentPaid =
        Number(paymentDynamicPaidTotals?.[sourceKey]) ||
        Number(paymentDynamicPaidTotals?.[fee.feeName]) ||
        Number(paymentDynamicPaidTotals?.[normalizeFeeFieldName(sourceKey)]) ||
        0;
      const explicitStudentDue =
        Number(studentDynamicDueTotals?.[sourceKey]) ||
        Number(studentDynamicDueTotals?.[fee.feeName]) ||
        Number(studentDynamicDueTotals?.[normalizeFeeFieldName(sourceKey)]) ||
        0;
      const explicitPaymentDue =
        Number(paymentDynamicDueTotals?.[sourceKey]) ||
        Number(paymentDynamicDueTotals?.[fee.feeName]) ||
        Number(paymentDynamicDueTotals?.[normalizeFeeFieldName(sourceKey)]) ||
        0;
      const explicitStudentDiscount =
        Number(studentDynamicDiscounts?.[sourceKey]) ||
        Number(studentDynamicDiscounts?.[fee.feeName]) ||
        Number(studentDynamicDiscounts?.[normalizeFeeFieldName(sourceKey)]) ||
        0;
      const explicitPaymentDiscount =
        Number(paymentDynamicDiscounts?.[sourceKey]) ||
        Number(paymentDynamicDiscounts?.[fee.feeName]) ||
        Number(paymentDynamicDiscounts?.[normalizeFeeFieldName(sourceKey)]) ||
        0;
      const studentSpecificDynamicAmount =
        configuredInstallmentTotal ||
        explicitBackendTotal ||
        explicitStudentTotal ||
        explicitPaymentTotal ||
        getDirectNumericValue(dynamicSource, [
          `${sourceKey}_total`,
          `${sourceKey}_amount`,
          `${fee.feeName}_total`,
          `${fee.feeName}_amount`,
          sourceKey,
          fee.feeName,
        ]) ||
        readFirstNumericValue(dynamicSource, allAliases) ||
        Number(backendFeeRow?.total) ||
        Number(backendFeeRow?.amount) ||
        0;
      const studentSpecificDynamicPaid =
        explicitBackendPaid ||
        explicitStudentPaid ||
        explicitPaymentPaid ||
        configuredInstallmentPaid ||
        getDirectNumericValue(dynamicSource, paidKeys) ||
        readFirstNumericValue(dynamicSource, paidKeys) ||
        Number(backendFeeRow?.paid) ||
        0;
      const studentSpecificDynamicDue =
        configuredInstallmentDue ||
        explicitBackendDue ||
        explicitStudentDue ||
        explicitPaymentDue ||
        getDirectNumericValue(dynamicSource, dueKeys) ||
        readFirstNumericValue(dynamicSource, dueKeys) ||
        Number(backendFeeRow?.remaining) ||
        0;
      const individualDiscount =
        explicitBackendDiscount ||
        explicitStudentDiscount ||
        explicitPaymentDiscount ||
        readFeeDiscountValue(selectedStudentDiscountSource, sourceKey, fee.feeName) ||
        readFeeDiscountValue(dynamicSource, sourceKey, fee.feeName) ||
        readFeeDiscountValue(classFeeSource, sourceKey, fee.feeName) ||
        readFeeDiscountValue(payments, sourceKey, fee.feeName);

      if (feeScope === "individual" && !matchingIndividualAssignment) {
        if (!studentSpecificDynamicAmount) {
          return null;
        }
      }

      if (feeScope === "individual" && matchingIndividualAssignment) {
        const assignmentInstallmentRows = getIndividualAssignmentInstallmentRows(
          matchingIndividualAssignment,
          sourceKey,
          fee.feeName
        );
        const assignmentInstallmentTotal = assignmentInstallmentRows.reduce((sum, installment) => {
          const amount = Number(installment?.amount || installment?.Amount || 0);
          return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
        }, 0);
        const assignmentInstallmentPaid = assignmentInstallmentRows.reduce((sum, installment) => {
          const paid = Number(installment?.paid || installment?.Paid || 0);
          return sum + (Number.isFinite(paid) && paid > 0 ? paid : 0);
        }, 0);
        const amount = Math.max(
          0,
          assignmentInstallmentTotal ||
            Number(
              matchingIndividualAssignment?.amount ??
                matchingIndividualAssignment?.total ??
                studentSpecificDynamicAmount ??
                0
            ) ||
            0
        );
        const paid = Math.max(
          0,
          assignmentInstallmentPaid ||
            Number(
              matchingIndividualAssignment?.paid ??
                matchingIndividualAssignment?.paidAmount ??
                studentSpecificDynamicPaid ??
                0
            ) ||
            0
        );
        const netTotal = Math.max(amount - individualDiscount, 0);
        const remaining = Math.max(netTotal - paid, 0);

      return {
        key: sourceKey,
        label: fee.feeName,
        total: netTotal,
        paid,
        remaining,
        discount: individualDiscount,
        installments: Math.max(Number(fee.installments) || 1, 1),
        isCustom: true,
        source: "individual",
        installmentRows: assignmentInstallmentRows,
        hasInstallmentTotals: assignmentInstallmentTotal > 0,
      };
      }

      if (feeScope === "individual" && studentSpecificDynamicAmount) {
        const paid = Math.max(0, studentSpecificDynamicPaid || 0);
        const netTotal = Math.max(studentSpecificDynamicAmount - individualDiscount, 0);
        const discountedBalance = Math.max(netTotal - paid, 0);
        const remaining = studentSpecificDynamicDue > 0
          ? Math.min(Math.max(studentSpecificDynamicDue, 0), discountedBalance)
          : discountedBalance;

        return {
          key: sourceKey,
          label: fee.feeName,
          total: netTotal,
          paid,
          remaining,
          discount: individualDiscount,
          installments: Math.max(Number(fee.installments) || 1, 1),
          isCustom: true,
          source: "student",
          hasInstallmentTotals: configuredInstallmentTotal > 0,
        };
      }

      const backendDiscount = Number(backendFeeRow?.discount) || 0;
      const discount =
        explicitBackendDiscount ||
        explicitStudentDiscount ||
        explicitPaymentDiscount ||
        readFeeDiscountValue(selectedStudentDiscountSource, sourceKey, fee.feeName) ||
        readFeeDiscountValue(classFeeSource, sourceKey, fee.feeName) ||
        readFeeDiscountValue(payments, sourceKey, fee.feeName) ||
        backendDiscount;
      const classTotalByKey = readFirstNumericValue(classFeeSource, allAliases);
      const classTotalByLabel = readFirstNumericValue(classFeeSource, [fee.feeName]);
      const studentTotal = explicitBackendTotal || explicitStudentTotal || readFirstNumericValue(dynamicSource, allAliases);
      const studentPaid = explicitBackendPaid || explicitStudentPaid || readFirstNumericValue(dynamicSource, paidKeys);
      const studentDue = explicitBackendDue || explicitStudentDue || readFirstNumericValue(dynamicSource, dueKeys);
      const paymentTotal = explicitBackendTotal || explicitPaymentTotal || readFirstNumericValue(dynamicSource, allAliases);
      const backendTotal = explicitBackendTotal || Number(backendFeeRow?.total) || 0;
      const rawTotal = configuredInstallmentTotal || studentTotal || paymentTotal || backendTotal || classTotalByKey || classTotalByLabel || 0;
      const total = Math.max(rawTotal - discount, 0);
      const studentPaidLower = studentPaid || readFirstNumericValue(payments, paidKeys);
      const studentPaidUpper = 0;
      const classPaidLower = readFirstNumericValue(classFeeSource, paidKeys);
      const classPaidUpper = 0;
      const paid =
        configuredInstallmentPaid ||
        studentPaidLower ||
        studentPaidUpper ||
        classPaidLower ||
        classPaidUpper ||
        0;
      const remaining = configuredInstallmentTotal > 0
        ? Math.max(total - paid, 0)
        : Number(backendFeeRow?.remaining) || (studentDue > 0
          ? Math.max(studentDue - discount, 0)
          : Math.max(total - paid, 0));

      return {
        key: sourceKey,
        label: fee.feeName,
        total,
        paid: Number.isFinite(Number(paid)) ? paid : Number(backendFeeRow?.paid) || 0,
        remaining: Number.isFinite(Number(remaining)) ? remaining : Math.max(total - (Number(backendFeeRow?.paid) || 0), 0),
        discount,
        installments: Math.max(Number(fee.installments) || 1, 1),
        isCustom: true,
        hasInstallmentTotals: configuredInstallmentTotal > 0,
      };
    })
    .filter(Boolean)
    .filter((fee) => {
      const keep = Number(fee.total) > 0;
      return keep;
    });

  const mergedRows = [];
  const seenRows = new Set();

  [
    ...computedRows.filter((row) => row?.hasInstallmentTotals),
    ...backendRows,
    ...computedRows.filter((row) => !row?.hasInstallmentTotals),
  ].forEach((row) => {
    const normalizedKey = normalizeFeeFieldName(row?.key || row?.label || "");
    if (!normalizedKey || seenRows.has(normalizedKey)) return;
    seenRows.add(normalizedKey);
    mergedRows.push(row);
  });

  return mergedRows;
}, [classFeeSource, classWiseInstallmentMap, dynamicFeeTypes, individualFeeInstallmentMap, payments, selectedStudentDiscountSource, selectedStudentFeeDetails]);


const individualFeeRows = React.useMemo(() => {
  const selectedStudentNameNormalized = String(
    selectedStudent || initialStudentName || payments?.studentName || payments?.StudentName || ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  const selectedStudentIdNormalized = String(selectedStudentId || initialStudentId || "").trim();

  const rawAssignments = [
    ...(Array.isArray(selectedStudentFeeDetails?.individualFeeAssignments) ? selectedStudentFeeDetails.individualFeeAssignments : []),
    ...(Array.isArray(payments?.individualFeeAssignments) ? payments.individualFeeAssignments : []),
  ];

  const selectedStudentAssignments = rawAssignments.filter((entry) => {
    const studentId = String(
      entry?.studentId || entry?.student_id || entry?.StudentId || entry?.Student_ID || ""
    ).trim();
    const studentName = String(
      entry?.studentName || entry?.StudentName || entry?.name || entry?.student || ""
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

    return (
      (selectedStudentIdNormalized && studentId && selectedStudentIdNormalized === studentId) ||
      (selectedStudentNameNormalized && studentName && selectedStudentNameNormalized === studentName)
    );
  });

  const existingRowKeys = new Set(
    dynamicFeeRows.flatMap((row) => [
      normalizeFeeFieldName(row?.key || row?.label || ""),
      normalizeFeeFieldName(row?.label || ""),
    ])
  );

  return selectedStudentAssignments
    .map((entry, index) => {
      const scope = String(entry?.scope || "").trim().toLowerCase();
      if (scope && scope !== "individual") return null;

      const keyBase = String(entry?.type || entry?.feeName || entry?.label || `individual-${index}`).trim();
      const normalizedKey = normalizeFeeFieldName(keyBase);
      if (!normalizedKey || existingRowKeys.has(normalizedKey)) return null;

      const matchingAssignment = selectedStudentAssignments.find((candidate) => {
        const candidateKey = normalizeFeeFieldName(
          candidate?.type || candidate?.feeName || candidate?.label || ""
        );
        return candidateKey === normalizedKey;
      });
      const label = String(entry?.feeName || entry?.label || entry?.type || "Individual Fee").replace(
        /_/g,
        " "
      );
      const assignmentInstallmentRows = getIndividualAssignmentInstallmentRows(
        matchingAssignment || entry,
        keyBase,
        label
      );
      const assignmentInstallmentTotal = assignmentInstallmentRows.reduce((sum, installment) => {
        const amount = Number(installment?.amount || installment?.Amount || 0);
        return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
      }, 0);
      const assignmentInstallmentPaid = assignmentInstallmentRows.reduce((sum, installment) => {
        const paid = Number(installment?.paid || installment?.Paid || 0);
        return sum + (Number.isFinite(paid) && paid > 0 ? paid : 0);
      }, 0);

      const amount = Math.max(
        0,
        assignmentInstallmentTotal ||
          Number(
            matchingAssignment?.amount ??
              matchingAssignment?.total ??
              entry?.amount ??
              entry?.total ??
              entry?.feeAmount ??
              entry?.value ??
              0
          ) ||
          0
      );
      const paid = Math.max(
        0,
        assignmentInstallmentPaid ||
          Number(
            matchingAssignment?.paid ??
              matchingAssignment?.amount_paid ??
              matchingAssignment?.paidAmount ??
              entry?.paid ??
              entry?.amount_paid ??
              entry?.paidAmount ??
              0
          ) ||
          0
      );
      const due = Math.max(
        0,
        assignmentInstallmentTotal > 0
          ? amount - paid
          : Number(
              matchingAssignment?.remaining ??
                matchingAssignment?.due ??
                matchingAssignment?.amount_due ??
                entry?.remaining ??
                entry?.due ??
                entry?.amount_due ??
                amount - paid
            ) || 0
      );
      const discount = Math.max(
        0,
        Number(
          matchingAssignment?.discount ??
            matchingAssignment?.discountAmount ??
            entry?.discount ??
            entry?.discountAmount ??
            0
        ) || 0
      );
      const netTotal = Math.max(amount - discount, 0);

      return {
        key: keyBase,
        label: `${label} (Individual)`,
        total: netTotal,
        paid,
        remaining: assignmentInstallmentTotal > 0
          ? Math.max(netTotal - paid, 0)
          : Math.min(due, Math.max(netTotal - paid, 0)),
        discount,
        installments: Math.max(Number(entry?.installments || entry?.installmentCount || 1) || 1, 1),
        isCustom: false,
        source: "individual",
        installmentRows: assignmentInstallmentRows,
        hasInstallmentTotals: assignmentInstallmentTotal > 0,
      };
    })
    .filter(Boolean);
}, [dynamicFeeRows, initialStudentId, initialStudentName, payments, selectedStudent, selectedStudentId]);


const individualFeeRowsTotal = React.useMemo(
  () =>
    [...dynamicFeeRows, ...individualFeeRows]
      .filter((row) => String(row?.source || "").trim().toLowerCase() === "individual")
      .reduce((sum, row) => {
        const amount = Number(row?.total || 0);
        return sum + (Number.isFinite(amount) ? Math.max(amount, 0) : 0);
      }, 0),
  [dynamicFeeRows, individualFeeRows]
);

const staticFeeRows = React.useMemo(() => {
  const studentFeeSource = selectedStudentFeeDetails?.feeStructure || selectedStudentFeeDetails || {};
  const studentDetailsSource = selectedStudentFeeDetails?.studentDetails || selectedStudentFeeDetails || {};

  const resolveClassAmount = (...keys) => {
    const value =
      readFirstNumericValue(classFeeSource, keys) ||
      readFirstNumericValue(studentFeeSource, keys) ||
      readFirstNumericValue(studentDetailsSource, keys) ||
      readFirstNumericValue(payments, keys);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };

  const resolvePaid = (...keys) => {
    const value =
      readFirstNumericValue(payments, keys) ||
      readFirstNumericValue(studentDetailsSource, keys) ||
      readFirstNumericValue(studentFeeSource, keys);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };

  const resolveDiscount = (...keys) => {
    const value =
      readFirstNumericValue(payments, keys) ||
      readFirstNumericValue(studentDetailsSource, keys) ||
      readFirstNumericValue(studentFeeSource, keys) ||
      readFirstNumericValue(classFeeSource, keys);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };

  const rowDefinitions = [
  
  ];

  return rowDefinitions
    .map((definition) => {
      const amount = resolveClassAmount(...definition.amountKeys);
      const discount = resolveDiscount(...definition.discountKeys);
      const paid = resolvePaid(...definition.paidKeys);
      const total = Math.max(amount - discount, 0);

      return {
        key: definition.key,
        label: definition.label,
        total,
        paid,
        remaining: Math.max(total - paid, 0),
        discount,
        installments: definition.installments || 1,
        isCustom: false,
        source: "class",
      };
    })
    .filter((row) => Number(row.total) > 0 || Number(row.paid) > 0 || Number(row.remaining) > 0);
}, [classFeeSource, payments, selectedStudentFeeDetails, tuitionInstallmentRows]);


const displayFeeRows = React.useMemo(() => {
  const merged = [];
  const seenKeys = new Set();

  // Define order: Individual entries take priority, then Class-wise entries
  const allRows = [...individualFeeRows, ...dynamicFeeRows, ...staticFeeRows];

  allRows.forEach((row) => {
    const key = normalizeFeeFieldName(row?.key || row?.label || "");
    
    // Only add if we haven't processed this fee type already
    if (!key || seenKeys.has(key)) return;
    
    const discount = Math.max(Number(row?.discount) || 0, 0);
    const payableTotal = Math.max(Number(row?.total) || 0, 0);
    const grossTotal = Math.max(Number(row?.grossTotal) || payableTotal + discount, 0);
    const possibleKeys = Array.from(new Set([
      normalizeOverdueFeeKey(row?.key),
      normalizeOverdueFeeKey(row?.label),
    ].filter(Boolean)));
    const bridgeRows = possibleKeys.flatMap((feeKey) => {
      const bridgeGroup = feeInstallmentBridge?.[feeKey] || {};
      return Array.isArray(bridgeGroup?.classWise) ? bridgeGroup.classWise : [];
    });
    const rowInstallmentRows = Array.isArray(row?.installmentRows) ? row.installmentRows : [];
    const overdueRows = rowInstallmentRows.length > 0 ? rowInstallmentRows : bridgeRows;
    const overdue = calculateInstallmentOverdue(overdueRows);
    
    seenKeys.add(key);
    merged.push({
      ...row,
      discount,
      grossTotal,
      payableTotal,
      overdue,
    });
  });

  return merged;
}, [dynamicFeeRows, feeInstallmentBridge, individualFeeRows, staticFeeRows]);

const selectedStudentFeeSummary = React.useMemo(
  () =>
    displayFeeRows.reduce(
      (summary, row) => {
        const total = Number(row?.total || 0);
        const paid = Number(row?.paid || 0);
        const remaining = Number(row?.remaining || 0);
        summary.total += Number.isFinite(total) ? Math.max(total, 0) : 0;
        summary.paid += Number.isFinite(paid) ? Math.max(paid, 0) : 0;
        summary.remaining += Number.isFinite(remaining) ? Math.max(remaining, 0) : 0;
        return summary;
      },
      { total: 0, paid: 0, remaining: 0 }
    ),
  [displayFeeRows]
);

const selectedStudentIndividualFeeSummary = React.useMemo(
  () =>
    displayFeeRows
      .filter((row) => String(row?.source || "").trim().toLowerCase() === "individual")
      .reduce(
        (summary, row) => {
          const total = Number(row?.total || 0);
          const paid = Number(row?.paid || 0);
          const remaining = Number(row?.remaining || 0);
          summary.total += Number.isFinite(total) ? Math.max(total, 0) : 0;
          summary.paid += Number.isFinite(paid) ? Math.max(paid, 0) : 0;
          summary.remaining += Number.isFinite(remaining) ? Math.max(remaining, 0) : 0;
          return summary;
        },
        { total: 0, paid: 0, remaining: 0 }
      ),
  [displayFeeRows]
);

const handleDynamicFeeAmountChange = useCallback((feeKey, value, maxAmount = null) => {
  let sanitized = String(value ?? "").replace(/[^0-9.]/g, "");
  const parts = sanitized.split(".");
  if (parts.length > 2) return;

  const numericValue = parts[0] ? parseFloat(sanitized) : 0;
  if (maxAmount !== null && Number.isFinite(maxAmount) && maxAmount > 0 && numericValue > maxAmount) {
    return;
  }

  setDynamicFeeValues((prev) => ({
    ...prev,
    [feeKey]: sanitized,
  }));
}, []);

useEffect(() => {
  if (!selectedClassSection) return;

  setFeeError("");  

  const [className, sectionName] = selectedClassSection.split("_");

  const schoolCode = localStorage.getItem("schoolCode");

  axios
    .get("https://cleezoclass.com:4000/api/feeDetailsByClassSection", {
      params: { className, section: sectionName, schoolCode },
    })
    .then((res) => {
      const resolvedFeeDetail =
        res.data.feeDetails ||      // correct key
        res.data.feeDetail  ||      // fallback
        null;

      setFeeDetail(resolvedFeeDetail);

      const configuredCompleteFee = getFilteredCompleteFee(
        normalizedClassFeeStructure,
        resolvedFeeDetail,
        classFeeData,
        selectedStudentFeeDetails,
        payments
      ) + individualFeeRowsTotal;
      const hasCustomFeeColumns = Object.keys(resolvedFeeDetail || {}).some((key) => {
        if (isStaticOrMetaFeeField(key)) return false;
        const normalized = normalizeFeeFieldName(key);
        return !normalized.endsWith("paid") && !normalized.endsWith("due");
      });

      if (configuredCompleteFee <= 0 && !hasCustomFeeColumns) {
        setFeeError(`Add Fee not updated for ${className} ${sectionName}`);
      } else {
        setFeeError("");
      }
    })
    .catch((err) => {
      console.error("Error fetching fee details:", err);
      setFeeDetail(null);
      setFeeError("Unable to fetch fee details");
  });
}, [individualFeeRowsTotal, selectedClassSection, normalizedClassFeeStructure]);

const getClassFeeValue = useCallback(
  (...keys) => {
    for (const key of keys) {
      const value = classFeeSource?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return Number(value) || 0;
      }
    }
    return 0;
  },
  [classFeeSource]
);

const formatPopupAmount = useCallback((value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}, []);

const paidInstallmentMap = React.useMemo(() => {
  return (tuitionInstallmentRows || []).reduce((acc, inst) => {
    acc[inst.installmentNo] = Number(inst.paid) || 0;
    return acc;
  }, {});
}, [tuitionInstallmentRows]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

const filteredStudents = students.filter((student) =>
  student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  String(student.id).includes(searchTerm)
);
const [selectedFeeRow, setSelectedFeeRow] = useState(null);










const enrichedDisplayFeeRows = React.useMemo(() => {
  if (!displayFeeRows || displayFeeRows.length === 0) return [];

  const selectedStudentObj = students.find(
    (s) => String(s.id) === String(selectedStudentId)
  );

  if (!selectedStudentObj) {
    return displayFeeRows;
  }

  // Build maps from student data
  const totalMap = {};
  const paidMap = {};
  const discountMap = {};

  Object.keys(selectedStudentObj).forEach((key) => {
    const value = Number(selectedStudentObj[key] || 0);

    if (key.endsWith("_total")) {
      const feeType = key.replace("_total", "").toLowerCase().replace(/[_\s]+/g, "");
      if (value > 0) totalMap[feeType] = value;
    }
    if (key.endsWith("_paid") && !key.includes("installment")) {
      const feeType = key.replace("_paid", "").toLowerCase().replace(/[_\s]+/g, "");
      if (value > 0) paidMap[feeType] = value;
    }
    if (key.endsWith("_discount")) {
      const feeType = key.replace("_discount", "").toLowerCase().replace(/[_\s]+/g, "");
      if (value > 0) discountMap[feeType] = value;
    }
  });

  return displayFeeRows.map((row) => {
    const feeKey = String(row.key || row.label || "")
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, "");

    // Try to match with student data
    let studentTotal = totalMap[feeKey] || 0;
    let studentPaid = paidMap[feeKey] || 0;
    let studentDiscount = discountMap[feeKey] || 0;

    // Fallback matching
    if (studentTotal === 0 && feeKey.endsWith("fee")) {
      const withoutFee = feeKey.replace(/fee$/, "");
      studentTotal = totalMap[withoutFee] || 0;
      studentPaid = paidMap[withoutFee] || 0;
      studentDiscount = discountMap[withoutFee] || 0;
    }

    if (studentTotal === 0) {
      for (const [key, value] of Object.entries(totalMap)) {
        if (feeKey.includes(key) || key.includes(feeKey)) {
          studentTotal = value;
          studentPaid = paidMap[key] || 0;
          studentDiscount = discountMap[key] || 0;
          break;
        }
      }
    }

    // ✅ CORRECT: Use row.total as gross amount, discount separately
    const grossTotal = studentTotal > 0 ? studentTotal : Number(row.total || 0);
    const discount = studentDiscount > 0 ? studentDiscount : Number(row.discount || 0);
    const paid = Math.max(Number(row.paid || 0), studentPaid);

    // ✅ CORRECT: netTotal = grossTotal - discount
    const netTotal = Math.max(grossTotal - discount, 0);
    // ✅ CORRECT: remaining = netTotal - paid
    const remaining = Math.max(netTotal - paid, 0);

    return {
      ...row,
      total: netTotal,      // Show net amount in UI
      paid,
      remaining,
      discount,
    };
  });
}, [displayFeeRows, students, selectedStudentId]);





















const fetchMetadata = useCallback(async () => {
  setDropdownLoading(true);
  const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";

  try {
    const [classRes, sectionRes] = await Promise.all([
      axios.get(`${API_BASE}/classes?schoolCode=${schoolCode}`),
      axios.get(`${API_BASE}/sectionFilter?schoolCode=${schoolCode}`)
    ]);

    // ✅ Handle dynamic class format safely
    const classesFromAPI = Array.isArray(classRes.data)
      ? classRes.data
      : classRes.data?.classes || [];

    setClassList(classesFromAPI);

    // ✅ Handle dynamic section format safely
    const sectionsFromAPI = Array.isArray(sectionRes.data)
      ? sectionRes.data
      : sectionRes.data?.sections || [];

    setSectionMap(sectionsFromAPI);

  } catch (err) {
    console.error("===== FETCH METADATA ERROR =====", err.message, err);

    setClassList([]);
    setSectionMap([]);
  } finally {
    setDropdownLoading(false);
  }
}, [API_BASE]);

useEffect(() => {
  fetchMetadata();
}, [fetchMetadata]);

if (popupOnly) {
  return (
    <>
      {showPopup && (
        <div
          className={`income-modal-overlay${popupTheme === "dashboard" ? " payment-dashboard-overlay" : ""}`}
          onClick={(e) => e.target === e.currentTarget && handleClosePopup()}
        >
          <div
            className={`payment-modal-content${popupTheme === "dashboard" ? " payment-dashboard-modal" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`payment-modal-body${popupTheme === "dashboard" ? " payment-dashboard-body" : ""}`}>
              <div className={`payment-fee-table-container${popupTheme === "dashboard" ? " payment-dashboard-fee-table-container" : ""}`}>
                <table className="payment-fee-table">
                  <thead>
                    <tr>
                      <th>Fee Type</th>
                      <th>Total Amount</th>
                      <th>Discount Amount</th>
                      <th>Payable Amount</th>
                      <th>Remaining</th>
                      <th>Overdue</th>
                      <th>Pay Now</th>
                    </tr>
                  </thead>
                  <tbody>
{displayFeeRows.map((fee, idx) => {
  const remaining = Math.max(Number(fee.remaining) || 0, 0);
  const installmentChoices = getInstallmentChoicesForFee(fee);
  const hasInstallmentChoices = installmentChoices.length > 0;
  const canUseInstallmentPicker = hasInstallmentChoices;
 console.log("Fee:", fee.label);
  console.log("Remaining==================:", remaining);
  console.log("Complete Fee Object:", fee);
  return (
    <tr key={idx}>
      <td style={{ border: "1px solid #ccc", padding: "5px" }}>
        {fee.label}
        {fee.source === "individual" && (
          <span style={{ fontSize: "11px", color: "#6b7280" }}> (Individual)</span>
        )}
      </td>
      <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
        {formatPopupAmount(fee.grossTotal) ? `Rs. ${formatPopupAmount(fee.grossTotal)}` : ""}
      </td>
      <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
        {formatPopupAmount(fee.discount) ? `Rs. ${formatPopupAmount(fee.discount)}` : "Rs. 0.00"}
      </td>
      <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
        {formatPopupAmount(fee.payableTotal) ? `Rs. ${formatPopupAmount(fee.payableTotal)}` : ""}
      </td>
<td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
  {remaining <= 0 ? (
    <span style={{ color: "green", fontWeight: "600" }}>No Due</span>
  ) : (
    `Rs. ${formatPopupAmount(remaining)}`
  )}
</td>
      <td
        className={Number(fee.overdue) > 0 ? "payment-overdue-amount" : ""}
        style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}
      >
        {Number(fee.overdue) > 0 ? `Rs. ${formatPopupAmount(fee.overdue)}` : "-"}
      </td>
      <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "center" }}>
        {fee.source === "individual" && !canUseInstallmentPicker ? (
          <span style={{ fontSize: "12px", color: "#374151" }}>
            {formatPopupAmount(remaining) ? `Rs. ${formatPopupAmount(remaining)}` : ""}
          </span>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
            <input
              type="text"
              value={feeEntries[idx]?.raw || ""}
              onChange={(e) => {
                let val = e.target.value;
                val = val.replace(/[^0-9.]/g, "");
                const parts = val.split(".");
                if (parts.length > 2) return;
                const num = parts[0] ? parseFloat(val) : 0;

                if (paymentMode !== "Cash+Online" && fee.label !== "Other Fees" && num > remaining) {
                  displayToast(`Cannot exceed remaining amount: Rs. ${remaining}`, "error");
                  return;
                }

                const typeKey = feeLabelToKey[fee.label] || fee.key || fee.label;
                const updated = [...feeEntries];
                updated[idx] = {
                  ...(updated[idx] || {}),
                  raw: val,
                  amount: num,
                  type: typeKey,
                };
                setFeeEntries(updated);
                setFees(prev => ({ ...prev, [typeKey]: num }));
                if (fee.key) {
                  setDynamicFeeValues((prev) => ({
                    ...prev,
                    [fee.key]: val,
                  }));
                }
              }}
              onBlur={() => {
                const updated = [...feeEntries];
                if (!updated[idx]) return;
                const num = updated[idx].amount || 0;
                updated[idx].raw = num.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                setFeeEntries(updated);
              }}
              placeholder="Enter Amount"
              style={{ width: "100px", padding: "5px 8px", border: "1px solid #e5e7eb", borderRadius: "4px", textAlign: "right", fontSize: "12px" }}
            />
            {canUseInstallmentPicker && (
              <>
                <button
                  type="button"
                  onClick={() => openInstallmentPopupForFee(fee, idx)}
                  style={{
                    border: "1px solid #c7d2fe",
                    background: "#eef2ff",
                    color: "#3730a3",
                    borderRadius: "999px",
                    fontSize: "11px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    width: "100px"
                  }}
                >
                  Select Installment
                </button>
                {activeInstallmentPopup?.rowIndex === idx && (
                  <div
                    style={{
                      position: "fixed",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "280px",
                      maxWidth: "calc(100vw - 32px)",
                      background: "#fff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
                      zIndex: 10000,
                      padding: "10px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700 }}>Select Installment</div>
                      <button
                        type="button"
                        onClick={() => setActiveInstallmentPopup(null)}
                        style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: "18px", fontWeight: "bold", color: "#64748b" }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
                      {installmentChoices.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={!option.isSelectable}
                          onClick={() => selectInstallmentChoice(fee, idx, option)}
                          style={{
                            textAlign: "left",
                            border: "1px solid #e5e7eb",
                            background: option.isSelectable ? "#f9fafb" : "#f1f5f9",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            cursor: option.isSelectable ? "pointer" : "not-allowed",
                            opacity: option.isSelectable ? 1 : 0.55,
                          }}
                        >
                          {option.label} - Rs. {formatPaymentAmount(option.amount)}
                          {option.isPaid ? " (Paid)" : option.isSelectable ? "" : " (Pay previous first)"}
                          {option.deadlineDate && (
                            <>
                              <br />
                              <small>Due: {new Date(option.deadlineDate).toLocaleDateString()}</small>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </td>
    </tr>
  );
})}
                  </tbody>
                </table>
              </div>

              <div className={`payment-payment-details${popupTheme === "dashboard" ? " payment-dashboard-payment-details" : ""}`}>
                <div className="payment-details-row">
                  <div className="payment-detail-item">
                    <label>Payment Date:</label>
                    <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                  </div>
                </div>

                <div className="payment-details-row">
                  <div className="payment-detail-item">
                    <label>Payment Mode:</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => handlePaymentModeChange(e.target.value)}
                    >
                      <option value="">-- Select Mode --</option>
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                      <option value="Card">Card</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash+Online">Cash+Online</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  {paymentMode === "Others" && (
                    <div className="payment-detail-item">
                      <label>Other Payment Details:</label>
                      <input
                        type="text"
                        value={otherPaymentMode}
                        onChange={(e) => setOtherPaymentMode(e.target.value.slice(0, OTHER_PAYMENT_MODE_MAX_LENGTH))}
                        placeholder="Enter payment mode"
                        maxLength={OTHER_PAYMENT_MODE_MAX_LENGTH}
                        required
                      />
                      <small>{otherPaymentMode.length}/{OTHER_PAYMENT_MODE_MAX_LENGTH} characters</small>
                    </div>
                  )}

                  {(paymentMode === "Online" || paymentMode === "Cash+Online") && (
                    <div className="payment-detail-item">
                      <label>Transaction ID:</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter Transaction ID"
                      />
                    </div>
                  )}
                </div>

                {paymentMode === "Cash+Online" && (
                  <div className="payment-details-row">
                    <div className="payment-detail-item">
                      <label>Cash Amount:</label>
                      <input type="number" min="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="Enter cash" />
                    </div>
                    <div className="payment-detail-item">
                      <label>Online Amount:</label>
                      <input type="number" min="0" value={onlineAmount} onChange={(e) => setOnlineAmount(e.target.value)} placeholder="Enter online amount" />
                    </div>
                  </div>
                )}
                <button
                  className="payment-submit-button"
                  onClick={handlePaymentSubmission}
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPaidPopup && (
        <div
          className="Payment-paidPopupOverlay"
          onClick={() => setShowPaidPopup(false)}
        >
          <div
            className="Payment-paidPopupContent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="Payment-paidPopupCloseButton"
              onClick={() => setShowPaidPopup(false)}
            >
              X
            </button>
            <PaidAmountdemo
              popupData={paidPageData}
              className={className}
              section={section}
              selectedStudent={selectedStudent}
              selectedStudentId={selectedStudentId}
              paymentDate={paymentDate}
              receiptNumber={paidPageData?.receiptNumber || receiptNumber}
              paymentMode={paymentMode}
              discountAmount={discountAmount}
              transactionId={transactionId}
            />
          </div>
        </div>
      )}
    </>
  );
}

return (
  <>
    <div className={`payment-flex-container${popupOnly ? " payment-popup-only" : ""}`}>
      <div className="payment-header-row">
        {/* Total Paid Card */}
        <div className="payment-card">
          <div className="payment-card-label">Total paid:</div>
          <div className="payment-card-values">
            <span>₹{(totals?.Total_Paid_Without_Admission ?? 0).toLocaleString()}</span>
            <span>{totals?.Percent_Paid ?? 0}% of total</span>
          </div>
        </div>

        {/* Due Card */}
        <div className="payment-card">
          <div className="payment-card-label">Due:</div>
          <div className="payment-card-values">
            <span>₹{(totals?.Total_Calculated_Due ?? 0).toLocaleString()}</span>
            <span>{totals?.Percent_Due ?? 0}% of total</span>
          </div>
        </div>

        {/* Total Admission Paid Card */}
        <div className="payment-card">
          <div className="payment-card-label">Total Admission Fee</div>
          <div className="payment-card-values">
            <span>₹{(totals?.Total_Admission_Paid ?? 0).toLocaleString()}</span>
            <span>{totals?.Percent_Admission_Paid ?? 0}% of total</span>
          </div>
        </div>

        {/* Overview Card */}
        <div className="payment-card payment-overview-card">
          <div className="payment-overview-header">
            <div>Overview</div>
            <div>
              <span>₹{Number(
                payments?.discounts?.totalDiscount ||
                  payments?.totalDiscount ||
                  payments?.discountAmount ||
                  0
              ).toLocaleString()}</span>
              Discounts
            </div>
          </div>
          {tuitionInstallmentRows?.length > 0 ? (
            <div className="payment-installment-list">
              {tuitionInstallmentRows
                .slice()
                .filter((inst) => {
                  const paidAmount = paidInstallmentMap[inst.installmentNo] || 0;
                  const dueAmount = inst.amount - paidAmount;
                  return dueAmount > 0;
                })
                .map((inst) => {
                  const paidAmount = paidInstallmentMap[inst.installmentNo] || 0;
                  const dueAmount = inst.amount - paidAmount;
                  return (
                    <div key={inst.installmentNo} className="payment-installment-item">
                      <span>Inst {inst.installmentNo}</span>
                      <span>₹{inst.amount.toLocaleString()}</span>
                      <span style={{ color: "orange" }}>{dueAmount.toLocaleString()}</span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="payment-no-installments">No installments configured</div>
          )}
        </div>
      </div>

      {/* Student List Panel */}
      <div className="payment-student-list-panel">
        <div className="payment-panel-header">
          <div className="payment-total-strength">
            <span>{className && section ? filteredStudents.length : 0}</span>
            <span>Total Strength</span>
          </div>
          <div className="payment-search-box">
  <input
    type="text"
    placeholder="Search student..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>

          <div className="payment-class-section-dropdown">
<select
  value={selectedClassSection}
  onChange={(e) => {
    const selectedValue = e.target.value;

    setSelectedClassSection(selectedValue);
    localStorage.setItem("selectedClassSection", selectedValue);

    if (selectedValue) {
      const [cls, sec] = selectedValue.split("_");

      setClassName(cls);
      setSection(sec);

      localStorage.setItem("className", cls);
      localStorage.setItem("section", sec);
    } else {
      setClassName("");
      setSection("");
      localStorage.removeItem("className");
      localStorage.removeItem("section");
    }

    setFeeError("");
  }}
>
  <option value="">-- Select Class & Section --</option>

  {classList.map((cls) => {
    const sectionsForClass = sectionMap
      .filter(item => {
        const classValue =
          item.class_name || item.class || item.className;

        return String(classValue) === String(cls);
      })
      .map(item =>
        item.section || item.section_name || item.sectionName
      );

    return sectionsForClass.map((sec) => (
      <option key={`${cls}_${sec}`} value={`${cls}_${sec}`}>
        {cls} - {sec}
      </option>
    ));
  })}
</select>
            <div className="payment-error-message">{feeError}</div>
          </div>
        </div>
        <div className="payment-student-grid">
          {filteredStudents.length === 0 ? (
            <div className="payment-no-students">
              {className ? "No students found" : "Please select a class and section"}
            </div>
          ) : (
            filteredStudents.map((student) => {
              const studentId = getStudentLookupId(student);
              const studentCompositeKey = [
                String(student.name || student.StudentName || "").trim().toLowerCase(),
                String(student.class_name || student.className || student.class || "").trim().toLowerCase(),
                String(student.section || student.sectionName || student.Section || "").trim().toLowerCase(),
              ].join("|");
              const studentFeeSummary =
                studentFeesMap[String(studentId)] ||
                studentFeesMap[studentCompositeKey] ||
                null;
          const backendTotalPaid = Number(
                student.total_paid ||
                  student.totalPaid ||
                  student.paidAmountTotal ||
                  student.tuition_paid ||
                  student.Paid_Amount ||
                  0
              );
              const totalDiscount = Number(
                student.total_due != null
                  ? 0
                  : student.total_discount ||
                    student.totalDiscount ||
                    student.discount ||
                    student.Discount ||
                    0
              );
              const completeFee =
                getFilteredCompleteFee(classFeeData, selectedStudentFeeDetails, payments) +
                individualFeeRowsTotal;
              const totalPaid = studentFeeSummary
                ? backendTotalPaid + (Number(studentFeeSummary.paidAmount) || 0)
                : backendTotalPaid;
              const backendDue = Number(
                student.total_due ||
                  student.totalDue ||
                  student.totalRemaining ||
                  student.remainingAmount ||
                  student.Remaining_Amount ||
                  student.Total_Installments_Remaining ||
                  student.total_remaining ||
                  0
              );
              const dueAmount = studentFeeSummary
                ? backendDue + (Number(studentFeeSummary.remainingAmount) || 0)
                : backendDue > 0
                  ? backendDue
                  : Math.max(completeFee - totalPaid - totalDiscount, 0);
              return (
                <div
                  key={studentId || student.name}
                  onClick={() => {
                    if (feeError) return;
                    setSelectedStudentId(studentId || student.id);
                    setSelectedStudent(student.name);
                  }}
                  className={`payment-student-card ${String(studentId || student.id) === String(selectedStudentId) ? "payment-student-card-selected" : ""}`}
                >
                  {student.photo?.data ? (
                    <img
                      src={`https://cleezoclass.com:4000${bufferToPathString(student.photo.data)}`}
                      alt={student.name}
                      className="payment-student-photo"
                    />
                  ) : (
                    <div className="payment-student-photo-placeholder">
                      {student.name?.charAt(0)}
                    </div>
                  )}
                  <span className="payment-student-name">{student.name}</span>
                  <span className="payment-student-name">
                    {student.father_name || student.fatherName || student.Father_Name || student.father || ""}
                  </span>
                  <div className="payment-student-paid">Paid: ₹{totalPaid.toLocaleString()}</div>
                  <div className="payment-student-due">Due: ₹{dueAmount.toLocaleString()}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Student Details Panel */}
      <div className="payment-student-details-panel">
        <div className="payment-student-details-header">
          {selectedStudentId && (
            <div className="payment-student-info">
              {studentData?.photo?.data ? (
                <img
                  src={`https://cleezoclass.com:4000${bufferToPathString(studentData.photo.data)}`}
                  alt="student"
                  className="payment-student-info-photo"
                />
              ) : (
                <div className="payment-student-info-photo-placeholder">
                  {studentData?.name?.charAt(0)}
                </div>
              )}
              <p className="payment-student-info-name">
                <strong>{studentData?.name} ({className}-{section})</strong>
                {payments && totals && (
                  <span>
                    - Total Due: ₹
                    {Math.max(Number(remainingAmount) || 0, 0).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="payment-tab-navigation">
          {["feesCollection", "discounts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`payment-tab-button ${activeTab === tab ? "payment-tab-button-active" : ""}`}
            >
              {tab.replace(/([A-Z])/g, ' $1').replace('fees', 'Fees ')}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="payment-tab-content">
          {activeTab === "feesCollection" && (
            <div>
              {selectedStudentId ? (
                <div>
                  {/* Fee Summary Section */}
                  <div className="payment-fee-summary">
                    <div className="payment-fee-breakdown">
                      <table className="payment-fee-table">
                        <thead>
                          <tr>
                            <th>Fee Type</th>
                            <th>Total Amount</th>
                            <th>Discount Amount</th>
                            <th>Payable Amount</th>
                            <th>Paid</th>
                            <th>Remaining</th>
                            <th>Overdue</th>
                          </tr>
                        </thead>
                        <tbody>
            {displayFeeRows.map((fee, idx) => (
                            <tr key={idx}>
                              <td>{fee.label}</td>
                              <td>{formatPopupAmount(fee.grossTotal) ? `Rs. ${formatPopupAmount(fee.grossTotal)}` : ""}</td>
                              <td>{formatPopupAmount(fee.discount) ? `Rs. ${formatPopupAmount(fee.discount)}` : "Rs. 0.00"}</td>
                              <td>{formatPopupAmount(fee.payableTotal) ? `Rs. ${formatPopupAmount(fee.payableTotal)}` : ""}</td>
                              <td>{formatPopupAmount(fee.paid) ? `Rs. ${formatPopupAmount(fee.paid)}` : ""}</td>
                              <td>{formatPopupAmount(fee.remaining) ? `Rs. ${formatPopupAmount(fee.remaining)}` : ""}</td>
                              <td className={Number(fee.overdue) > 0 ? "payment-overdue-amount" : ""}>
                                {Number(fee.overdue) > 0 ? `Rs. ${formatPopupAmount(fee.overdue)}` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>Total</td>
                            <td>
                              Rs. {displayFeeRows.reduce((sum, fee) => sum + (Number(fee.grossTotal) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              Rs. {displayFeeRows.reduce((sum, fee) => sum + (Number(fee.discount) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              Rs. {displayFeeRows.reduce((sum, fee) => sum + (Number(fee.payableTotal) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              Rs. {displayFeeRows.reduce((sum, fee) => sum + (Number(fee.paid) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              Rs. {displayFeeRows.reduce((sum, fee) => sum + (Number(fee.remaining) || 0), 0).toFixed(2)}
                            </td>
                            <td className={displayFeeRows.reduce((sum, fee) => sum + (Number(fee.overdue) || 0), 0) > 0 ? "payment-overdue-amount" : ""}>
                              Rs. {displayFeeRows.reduce((sum, fee) => sum + (Number(fee.overdue) || 0), 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    <button className="payment-pay-button" onClick={() => setShowPopup(true)}>
                      Pay
                    </button>
                  </div>
                </div>
              ) : (
                <p className="payment-select-student-prompt">
                  Please select a student from the left panel to begin fees collection.
                </p>
              )}
            </div>
          )}

          {activeTab === "discounts" && (
            <div className="payment-discounts-tab">
              <h3>Discounts</h3>
              <p>Use this area to define or apply <strong>Fee Discounts</strong> for the selected student.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Popup */}
  {showPopup && (
        <div className="income-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClosePopup()}>
<div
    className="payment-modal-content "
    onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside modal
  >    
    <div className="payment-modal-body">

          <div className="payment-fee-table-container">
              <table className="payment-fee-table">
                <thead>
                  <tr>
                    <th>Fee Type</th>
                    <th>Total Amount</th>
                    <th>Discount Amount</th>
                    <th>Payable Amount</th>
                    <th>Remaining</th>
                    <th>Overdue</th>
                    <th>Pay Now</th>
                  </tr>
                </thead>

          <tbody>
            {displayFeeRows.map((fee, idx) => {
              const remaining = Math.max(Number(fee.remaining) || 0, 0);
              const installmentChoices = getInstallmentChoicesForFee(fee);
              const hasInstallmentChoices = installmentChoices.length > 0;
              const canUseInstallmentPicker = hasInstallmentChoices;

              return (
             <tr
  key={idx}
  style={{ position: "relative" }}
>
<td style={{ border: "1px solid #ccc", padding: "5px", position: "relative" }}>
    {fee.label}
  </td>

  <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
    {formatPopupAmount(fee.grossTotal) ? `Rs. ${formatPopupAmount(fee.grossTotal)}` : ""}
  </td>

  <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
    {formatPopupAmount(fee.discount) ? `Rs. ${formatPopupAmount(fee.discount)}` : "Rs. 0.00"}
  </td>

  <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
    {formatPopupAmount(fee.payableTotal) ? `Rs. ${formatPopupAmount(fee.payableTotal)}` : ""}
  </td>

  <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
    {formatPopupAmount(remaining) ? `Rs. ${formatPopupAmount(remaining)}` : ""}
  </td>

  <td
    className={Number(fee.overdue) > 0 ? "payment-overdue-amount" : ""}
    style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}
  >
    {Number(fee.overdue) > 0 ? `Rs. ${formatPopupAmount(fee.overdue)}` : "-"}
  </td>

                          <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
  {fee.source === "individual" && !canUseInstallmentPicker ? (
    <span style={{ fontSize: "12px", color: "#374151" }}>
      {formatPopupAmount(remaining) ? `Rs. ${formatPopupAmount(remaining)}` : ""}
    </span>
  ) : (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", position: "relative" }}>
    <input
      type="text"
      value={dynamicFeeValues[fee.key] || feeEntries[idx]?.raw || ""}
      onChange={(e) => {
        let val = e.target.value;
        val = val.replace(/[^0-9.]/g, "");
        const parts = val.split(".");
        if (parts.length > 2) return;

        const num = parts[0] ? parseFloat(val) : 0;

        if (paymentMode !== "Cash+Online" && fee.label !== "Other Fees" && num > fee.total - fee.paid) {
          return;
        }

        const typeKey = feeLabelToKey[fee.label] || fee.key || fee.label;
        const updated = [...feeEntries];
        updated[idx] = {
          ...(updated[idx] || {}),
          raw: val,
          amount: num,
          type: typeKey,
        };

        setFeeEntries(updated);

        if (typeKey) {
        setFees((prev) => ({
            ...prev,
            [typeKey]: num,
          }));
        }
        if (fee.key) {
          setDynamicFeeValues((prev) => ({
            ...prev,
            [fee.key]: val,
          }));
        }
      }}
      onBlur={() => {
        const updated = [...feeEntries];
        if (!updated[idx]) return;

        const num = updated[idx].amount || 0;
        updated[idx].raw = num.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setFeeEntries(updated);
      }}
      placeholder="Enter Amount"
      style={{ width: "100px", padding: "5px", textAlign: "right" }}
    />
    {canUseInstallmentPicker && (
      <button
        type="button"
        onClick={() => openInstallmentPopupForFee(fee, idx)}
        style={{
          border: "1px solid #c7d2fe",
          background: "#eef2ff",
          color: "#3730a3",
          borderRadius: "999px",
          fontSize: "11px",
          padding: "4px 8px",
          cursor: "pointer",
        }}
      >
        Installments
      </button>
    )}
    {activeInstallmentPopup?.rowIndex === idx && canUseInstallmentPicker && (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "280px",
          maxWidth: "calc(100vw - 32px)",
          background: "#fff",
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
          zIndex: 10000,
          padding: "10px",
        }}
      >
        <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
          Select Installment
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
          {installmentChoices.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={!option.isSelectable}
              onClick={() => selectInstallmentChoice(fee, idx, option)}
              style={{
                textAlign: "left",
                border: "1px solid #e5e7eb",
                background: option.isSelectable ? "#f9fafb" : "#f1f5f9",
                padding: "8px 10px",
                borderRadius: "8px",
                cursor: option.isSelectable ? "pointer" : "not-allowed",
                opacity: option.isSelectable ? 1 : 0.55,
              }}
            >
              {option.label} - Rs. {formatPaymentAmount(option.amount)}
              {option.isPaid ? " (Paid)" : option.isSelectable ? "" : " (Pay previous first)"}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
  )}
</td>
</tr>

              );
            })}
          </tbody>
        </table>
      </div>

      {/* RIGHT SIDE: PAYMENT DETAILS */}
    <div className="payment-payment-details">
              <div className="payment-details-row">
                <div className="payment-detail-item">
                  <label>Payment Date:</label>
                  <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>
           
              </div>
         <div className="payment-details-row">
  <div className="payment-detail-item">
    <label>Payment Mode:</label>
    <select
      value={paymentMode}
      onChange={(e) => handlePaymentModeChange(e.target.value)}
    >
      <option value="">-- Select Mode --</option>
      <option value="Cash">Cash</option>
      <option value="Online">Online</option>
      <option value="Card">Card</option>
      <option value="Cheque">Cheque</option>
      <option value="Cash+Online">Cash+Online</option>
      <option value="Others">Others</option>
    </select>
  </div>

  {paymentMode === "Others" && (
    <div className="payment-detail-item">
      <label>Other Payment Details:</label>
      <input
        type="text"
        value={otherPaymentMode}
        onChange={(e) => setOtherPaymentMode(e.target.value.slice(0, OTHER_PAYMENT_MODE_MAX_LENGTH))}
        placeholder="Enter payment mode"
        maxLength={OTHER_PAYMENT_MODE_MAX_LENGTH}
        required
      />
      <small>{otherPaymentMode.length}/{OTHER_PAYMENT_MODE_MAX_LENGTH} characters</small>
    </div>
  )}

  {/* Show Transaction ID input only if Online or Cash+Online is selected */}
  {(paymentMode === "Online" || paymentMode === "Cash+Online") && (
    <div className="payment-detail-item">
      <label>Transaction ID:</label>
      <input
        type="text"
        value={transactionId}
        onChange={(e) => setTransactionId(e.target.value)}
        placeholder="Enter Transaction ID"
      />
    </div>
  )}
</div>

              {paymentMode === "Cash+Online" && (
                <div className="payment-details-row">
                  <div className="payment-detail-item">
                    <label>Cash Amount:</label>
                    <input type="number" min="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="Enter cash" />
                  </div>
                  <div className="payment-detail-item">
                    <label>Online Amount:</label>
                    <input type="number" min="0" value={onlineAmount} onChange={(e) => setOnlineAmount(e.target.value)} placeholder="Enter online amount" />
                  </div>
                </div>
              )}
            <button
  className="payment-submit-button"
  onClick={handlePaymentSubmission}
  disabled={isLoading}   // 🔹 Disable while loading
>
  {isLoading ? "Submitting..." : "Submit"}
</button>

            </div>

    </div></div>
  </div>
)}

      {showPaidPopup && (
        <div
          className="Payment-paidPopupOverlay"
          onClick={() => setShowPaidPopup(false)}
        >
          <div
            className="Payment-paidPopupContent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="Payment-paidPopupCloseButton"
              onClick={() => setShowPaidPopup(false)}
            >
              X
            </button>
     <PaidAmountdemo
  popupData={paidPageData}
  className={className}
  section={section}
  selectedStudent={selectedStudent}
  selectedStudentId={selectedStudentId}
  paymentDate={paymentDate}
  receiptNumber={paidPageData?.receiptNumber || receiptNumber}
  paymentMode={paymentMode}
  discountAmount={discountAmount}
  transactionId={transactionId}   // ✅ ADD THIS
/>

          </div>
        </div>
      )}

      {duplicateConfirmState.isOpen && (
        <div
          className="Payment-paidPopupOverlay"
          onClick={() => closeDuplicateConfirmation(false)}
        >
          <div
            className="Payment-paidPopupContent payment-duplicate-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="payment-duplicate-popup-message">
              {duplicateConfirmState.message}
            </p>
            <div className="payment-duplicate-popup-actions">
              <button
                className="payment-submit-button payment-duplicate-popup-btn payment-duplicate-popup-btn-cancel"
                onClick={() => closeDuplicateConfirmation(false)}
              >
                No
              </button>
              <button
                className="payment-submit-button payment-duplicate-popup-btn"
                onClick={() => closeDuplicateConfirmation(true)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Success/Error Popups */}
      {showSuccessPopup && (
        <div className="payment-success-popup">
          <CheckCircle />
          {popupMessage}
        </div>
      )}
      {showErrorPopup && (
        <div className="payment-error-popup">
          <Circle />
          {popupMessage}
        </div>
      )}
    
    </div>
    <ErrorPopup message={popupMsg} onClose={() => setPopupMsg("")} />

    </>
);

};
export default PayementDemo;
