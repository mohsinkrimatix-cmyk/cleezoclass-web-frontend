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

const normalizeFeeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\bfees?\b/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

const feeLabelOverdueKeys = {
  "Admission Fee": ["admission"],
  "Tuition Fee": ["tuition", "tution"],
  "Residential Fee": ["residential"],
  "Bus Fee": ["bus", "transport", "transportation"],
  "Exam Fee": ["exam"],
  "Books Fee": ["books", "book"],
  "Uniform Fee": ["uniform"],
  "Other Fees": ["other", "others"],
};

const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const isPastDeadline = (value) => {
  const deadline = parseDateOnly(value);
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadline < today;
};

const calculateOverdueAmount = (installmentRows = []) =>
  (Array.isArray(installmentRows) ? installmentRows : []).reduce((sum, installment) => {
    const amount = Number(installment?.amount || 0);
    const paid = Number(installment?.paid || 0);
    if (!isPastDeadline(installment?.deadlineDate) || paid >= amount) return sum;
    return sum + Math.max(amount - paid, 0);
  }, 0);

const PayementDemo = ({ className: propClassName, sectionName: propSectionName }) => {
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
      console.log("Navigated with Class:", stateClass, "Section:", stateSection);
    }
  }, [location.state]);

  const [showInstallments, setShowInstallments] = useState(false);

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
  });const [installments, setInstallments] = useState({});
 // Convert number → "1,23,456.00"
const formatAmount = (value) => {
  if (value === "" || value === null || isNaN(value)) return "";
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const unformatAmount = (value) => {
  if (!value) return "";
  return value.replace(/,/g, "");
};

  const [installmentOptions, setInstallmentOptions] = useState([]); // Store installments for tuition
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
 
    console.log("[DEBUG] Form submission started");
    console.log("[DEBUG] Selected income type:", incomeType);
 
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
 
  console.log("[DEBUG] Sanitized feeEntries:", sanitizedFeeEntries);
  console.log("[DEBUG] Calculated fees object:", calculatedFees);
  console.log("[DEBUG] Final fee payload being sent:", incomeData);
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
 
      console.log("[DEBUG] Donation payload being sent:", incomeData);
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
 
      console.log("[DEBUG] Investment payload being sent:", incomeData);
    } else if (incomeType === 'other') {
      if (!other) {
        displayToast("❗ Please enter the amount for Other Income.", "error");
        return;
      }
 
      incomeData = {
        ...incomeData,
        other_amount: parseFloat(other) || 0
      };
 
      console.log("[DEBUG] Other income payload being sent:", incomeData);
    } else if (incomeType === 'installments') {
        if (!className || !section) {
            displayToast("❗ Please select Class and Section for installments.", "error");
            return;
        }
        await handleSaveClassInstallments();
        displayToast('✅ Installments saved for the selected class/section!', 'success');
        console.log("[DEBUG] Installments saved for class/section:", className, section);
        return;
    }
 
    try {
      console.log("[DEBUG] Sending final payload to server:", incomeData);
      const response = await axios.put('https://cleezoclass.com:4000/income', incomeData);
      
      let successMessage = `✅ Income data added successfully for school: ${schoolCode}!`;
      if (incomeType === 'fees') {
        successMessage = `✅ Fees submitted successfully for Class ${className} Section ${section}!`;
      }
      displayToast(successMessage, "success");
      console.log("[DEBUG] Submission successful:", response.data);
 
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
 
  
const getUnpaidInstallmentIds = () => {
  if (!installmentOptions?.length) return [];
  return installmentOptions
    .sort((a, b) => a.id - b.id)
    .filter(inst => !paidInstallments.includes(inst.id))
    .map(inst => inst.id);
};
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

const paidInstallments = React.useMemo(() => {
  if (!installmentOptions || tuitionPaid == null) return [];
  const paid = [];
  let runningTotal = 0;
  const sortedInstallments = [...installmentOptions]
    .filter(inst => inst.amount && parseFloat(inst.amount) > 0)
    .sort((a, b) => a.id - b.id);
  sortedInstallments.forEach(inst => {
    const amount = parseFloat(inst.amount);
    runningTotal += amount;
    if (tuitionPaid >= runningTotal - 0.01) {
      paid.push(inst.id);
    }
  });
  return paid;
}, [installmentOptions, tuitionPaid]);
 
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
  setShowInstallments(false);    
  setPaymentMode("");           
  setCashAmount(0);              
  setOnlineAmount(0);            
};

// Close handler
const handleClosePopup = () => {
  resetPopup();
  setShowPopup(false);
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
    console.log("[RECEIPT][PAYMENT] persisted next receipt number:", nextReceiptNumber);
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
 
      const backendData = response.data.feeStructure;
      
      // Get all fees directly from the response
      const fees = {
        admission: parseFloat(backendData.Admission_Fee) || 0,
        book: parseFloat(backendData.Book_Fee) || 0,
        uniform: parseFloat(backendData.Uniform_Fee) || 0,
        exam: parseFloat(backendData.Exam_Fee) || 0,
        other: parseFloat(backendData.Other_Fee) || 0,
        bus: parseFloat(backendData.Bus_Fee) || 0,
        residential: parseFloat(backendData.ResidentialCompleteFee) || 0,
        // Get tuition fee directly if available, otherwise calculate
        tuition: parseFloat(backendData.Tuition_Fee) || 
                (parseFloat(backendData.CompleteFee) || 0) - 
                (parseFloat(backendData.Book_Fee) + 
                 parseFloat(backendData.Uniform_Fee) + 
                 parseFloat(backendData.Exam_Fee) + 
                 parseFloat(backendData.Other_Fee) + 
                 parseFloat(backendData.Admission_Fee) + 
                 parseFloat(backendData.Bus_Fee))
      };
 
      setDefaultFees(fees);
      setFees(fees);
      
      setFeeStructure({
        ...fees,
        complete_fee: parseFloat(backendData.CompleteFee) || 0
      });
 
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
  console.log("useEffect triggered with studentId:", selectedStudentId);

  // 🔁 RESET STATE
  setStudentData({ name: "", fatherName: "", class: "", section: "", rollNumber: "", billType: "full-package" });
  setFeeStructure(null);
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

  const selected = students.find((s) => s.id === selectedStudentId);
  if (!selected) return;

  setStudentData({
    name: selected.name,
    fatherName: selected.fatherName || "Not Available",
    class: className,
    section: selected.section || "A",
    rollNumber: selected.id.toString(),
    billType: "full-package",
    photo: selected.photo,
  });

  const schoolCode = localStorage.getItem("schoolCode");
  let liveBusFee = 0;

  axios
    .post("https://cleezoclass.com:4000/get-bus-fee", {
      studentName: selected.name,
      className: className.replace("Class ", "").trim(),
      sectionName: selected.section || "A",
      schoolCode,
    })
    .then((busFeeRes) => {

      liveBusFee = parseFloat(busFeeRes.data?.Bus_fees) || 0;

      return axios.get(
        `https://cleezoclass.com:4000/api/payment/${selectedStudentId}?schoolCode=${schoolCode}`
      );
    })
    .then((paymentRes) => {

      const paymentData = paymentRes.data.payments || {};
      setPayments(paymentData);

      // ---------- BASE ----------
      const completeFee = parseFloat(paymentData.completeFee) || 0;
      const examFee = parseFloat(paymentData.examFee) || 0;
      const bookFee = parseFloat(paymentData.bookFee) || 0;
      const uniformFee = parseFloat(paymentData.uniformFee) || 0;
      const othersFee = parseFloat(paymentData.othersFee) || 0;
      const admissionFee = parseFloat(paymentData.admissionFee) || 0;
      const residentialFee = parseFloat(paymentData.residentialFee) || 0;

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
      const tuitionFeeBase =
        parseFloat(paymentData.tuitionFee) ||
        Math.max(completeFee - bookFee - examFee, 0);
      const finalTuitionFee = Math.max(tuitionFeeBase - tuitionDiscount, 0);
      const finalTuitionRemaining = finalTuitionFee - tuitionPaid;
      console.log("[TUITION] base:", tuitionFeeBase);
      console.log("[TUITION] discount:", tuitionDiscount);
      console.log("[TUITION] final fee:", finalTuitionFee);
      console.log("[TUITION] paid:", tuitionPaid);
      console.log("[TUITION] remaining:", finalTuitionRemaining);

      // ✅ BUS FIX
      const finalBusFee =
        liveBusFee === 0 && busPaid > 0
          ? busPaid
          : liveBusFee;

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
        residentialFee;

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
        tuitionDiscount +
        busDiscount +
        bookDiscount +
        admissionDiscount;

      const finalRemaining =
        totalAmount - totalPaid - totalDiscount;

      console.log("===== FINAL CALCULATION =====");
      console.log("Bus Fee:", finalBusFee);
      console.log("Book Fee:", finalBookFee);
      console.log("Others Fee:", finalOthersFee);
      console.log("Total Amount:", totalAmount);
      console.log("Total Paid:", totalPaid);
      console.log("Remaining:", finalRemaining);

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

}, [selectedStudentId, className]);

useEffect(() => {
  const schoolCode = localStorage.getItem("schoolCode");
  const studentName = String(selectedStudent || studentData?.name || "").trim();

  if (!schoolCode || !className || !section || !studentName) {
    setFeeInstallmentBridge({});
    setInstallmentOptions([]);
    return;
  }

  let cancelled = false;

  axios
    .get(`${API_BASE_URL}/api/fees-details-installments`, {
      params: {
        schoolCode,
        className,
        section,
        studentName,
      },
    })
    .then((res) => {
      if (cancelled) return;
      const bridgeData = res.data && typeof res.data === "object" ? res.data : {};
      setFeeInstallmentBridge(bridgeData);

      const tuitionRows =
        bridgeData?.tuition?.classWise ||
        bridgeData?.tution?.classWise ||
        [];

      setInstallmentOptions(
        (Array.isArray(tuitionRows) ? tuitionRows : [])
          .filter((installment) => Number(installment?.amount || 0) > 0)
          .map((installment) => ({
            id: installment.installmentNo,
            installment: installment.installmentNo,
            amount: Number(installment.amount || 0),
            originalAmount: Number(installment.amount || 0),
            paid: Number(installment.paid || 0),
            dueDate: installment.deadlineDate || "",
            deadlineDate: installment.deadlineDate || "",
            fine: Number(installment.fine || 0),
          }))
      );
    })
    .catch((error) => {
      if (cancelled) return;
      console.error("Failed to fetch fee installments:", error);
      setFeeInstallmentBridge({});
      setInstallmentOptions([]);
    });

  return () => {
    cancelled = true;
  };
}, [selectedStudent, studentData?.name, className, section]);

  // Function to handle changes in tuition installment amount
const handleTuitionInstallmentAmountChange = (index, installmentId, newAmountPaid) => {
  const parsedNewAmount = parseFloat(newAmountPaid);
 
  // Update the amount for the current fee entry
  setFeeEntries((prevFeeEntries) => {
    const updatedFeeEntries = [...prevFeeEntries];
    updatedFeeEntries[index].amount = newAmountPaid;
    return updatedFeeEntries;
  });
 
  if (isNaN(parsedNewAmount)) {
    return;
  }
 
  setInstallmentOptions((prevInstallmentOptions) => {
    const newInstallmentOptions = prevInstallmentOptions.map((inst) => ({
      ...inst,
    }));
    const currentInstallmentIndex = newInstallmentOptions.findIndex(
      (inst) => inst.id.toString() === installmentId.toString()
    );
 
    if (currentInstallmentIndex === -1) {
      console.error("Selected installment not found in options.");
      return prevInstallmentOptions;
    }
 
    // Reset all upcoming unpaid installments to their original amounts
    for (
      let i = currentInstallmentIndex + 1;
      i < newInstallmentOptions.length;
      i++
    ) {
      const inst = newInstallmentOptions[i];
      if (!inst.paid) {
        inst.amount = parseFloat(inst.originalAmount);
      }
    }
 
    const currentInstallment = newInstallmentOptions[currentInstallmentIndex];
    const originalInstallmentDue = parseFloat(currentInstallment.originalAmount);
    let difference = parsedNewAmount - originalInstallmentDue;
 
    const upcomingUnpaidInstallments = newInstallmentOptions.filter(
      (inst, idx) =>
        idx > currentInstallmentIndex && !inst.paid && inst.originalAmount > 0
    );
 
    if (difference !== 0 && upcomingUnpaidInstallments.length > 0) {
      if (difference > 0) {
        // Payment is more than the current installment (overpayment)
        // Calculate the total due for all upcoming unpaid installments
        const totalUpcomingDue = upcomingUnpaidInstallments.reduce(
          (sum, inst) => sum + parseFloat(inst.originalAmount),
          0
        );
 
        // Calculate the total remaining amount to be paid after applying the difference
        let remainingTotal = totalUpcomingDue - difference;
 
        if (remainingTotal > 0) {
          // Distribute the remaining total equally among the unpaid installments
          const newAmountPerInstallment = remainingTotal / upcomingUnpaidInstallments.length;
          upcomingUnpaidInstallments.forEach((inst) => {
            inst.amount = newAmountPerInstallment;
          });
        } else {
          // If the payment is enough to cover all upcoming installments, set them to 0
          upcomingUnpaidInstallments.forEach((inst) => {
            inst.amount = 0;
          });
        }
      } else {
        // Payment is less than the current installment (underpayment)
        // Add the remaining amount to the next unpaid installments
        const remainingAmount = Math.abs(difference);
        const amountPerInstallment = remainingAmount / upcomingUnpaidInstallments.length;
        
        upcomingUnpaidInstallments.forEach((inst) => {
          inst.amount = parseFloat(inst.originalAmount) + amountPerInstallment;
        });
      }
    }
 
    // Update the current installment amount to reflect the payment
    currentInstallment.amount = parsedNewAmount;
 
    return newInstallmentOptions;
  });
};
const [showPopup, setShowPopup] = useState(false);

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

  console.log("[DEBUG] Updated feeEntries:", updatedEntries);
  console.log("[DEBUG] Updated fees object:", newFees);
};


const [showPaidPopup, setShowPaidPopup] = useState(false);
const [paidPageData, setPaidPageData] = useState(null);
 const [cashAmount, setCashAmount] = useState();
const [onlineAmount, setOnlineAmount] = useState();
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
  const schoolCode = localStorage.getItem('schoolCode');
  if (!schoolCode) return;
  try {
    const response = await axios.get(
      `https://cleezoclass.com:4000/api/getLastReceiptNumber?schoolCode=${schoolCode}`
    );
    const lastReceiptNumber = response.data.lastReceiptNumber || '001';
    console.log('[RECEIPT][PAYMENT] fetched next receipt number:', lastReceiptNumber);
    setReceiptNumber(lastReceiptNumber);
    currentReceiptNumberRef.current = lastReceiptNumber;
  } catch (error) {
    console.error('Error fetching last receipt number:', error);
    setReceiptNumber('001');
    currentReceiptNumberRef.current = '001';
  }
};

useEffect(() => {
  fetchLastReceiptNumber(); // ✅ Call from useEffect
}, []);

const handlePaymentSubmission = async (e) => {
  e.preventDefault();
  setIsLoading(true);

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

  console.log("Fee Entries Being Submitted:", feeEntries);

  const fees = {
    tuition: tuitionFee,
    books: bookFee,
    bus: busFee,
    uniform: uniformFee,
    exam: examFee,
    admission: admissionFee,
    other: othersFee,
    residential: residentialFee,
  };

  const alreadyPaidAmounts = {
    tuition: tuitionPaid,
    books: bookPaid,
    bus: busPaid,
    uniform: uniformPaid,
    exam: examPaid,
    admission: admissionPaid,
    other: othersPaid,
    residential: residentialPaid,
  };

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

  // Add fee validation and accumulate amounts
  for (let i = 0; i < feeEntries.length; i++) {
    const entry = feeEntries[i];
    if (!entry) continue;
    if (entry.type && entry.amount) {
      const amount = parseFloat(entry.amount);
      if (!isNaN(amount) && amount > 0) {
        // Skip validation for "other" fees
        if (entry.type !== "other") {
          const totalPaidForTypeIncludingCurrent =
            (alreadyPaidAmounts[entry.type] || 0) + amount;
          const totalFeeForType = fees[entry.type];
          if (totalPaidForTypeIncludingCurrent > totalFeeForType + 0.001) {
            showPopupMessage(
              `Payment for ${entry.type} exceeds the total fee. Total ${entry.type} Fee: Rs. ${totalFeeForType.toFixed(
                2
              )}. Already Paid: Rs. ${(alreadyPaidAmounts[entry.type] || 0).toFixed(
                2
              )}.`,
              "error"
            );
            setIsLoading(false);
            return;
          }
        }

        feeTypesPaid[entry.type] += amount;
        currentTransactionTotal += amount;

        if (entry.type === "tuition" && entry.installmentId) {
          tuitionInstallmentIdBeingPaid = entry.installmentId;
        }
      }
    }
  }

  // Filter feeEntries to include only those with a non-zero amount
  const submittedFeeEntries = feeEntries.filter(
    (entry) => entry && entry.amount && parseFloat(entry.amount) > 0
  );
  console.log("Submitted Fee Entries:", submittedFeeEntries);

  if (currentTransactionTotal <= 0) {
    showPopupMessage(
      "Payment amount must be greater than 0. Please add a valid fee.",
      "error"
    );
    setIsLoading(false);
    return;
  }

  // Prepare payment data
  const paymentData = {
    studentName: selectedStudent,
    className,
    sectionName: section,
    schoolCode,
    Paid_Amount: feeTypesPaid.tuition,
    books_paid: feeTypesPaid.books,
    bus_paid: feeTypesPaid.bus,
    uniform_paid: feeTypesPaid.uniform,
    exam_paid: feeTypesPaid.exam,
    admission_paid: feeTypesPaid.admission,
    others_paid: feeTypesPaid.other,
    residential_paid: feeTypesPaid.residential,
    tuition_paid_this_transaction: feeTypesPaid.tuition,
    tuition_installment_id: tuitionInstallmentIdBeingPaid,
    Discount: parseFloat(discountAmount) || 0,
    paymentDate,
    receiptNumber,
    paymentMode,
    transactionId,
    adjustedInstallments: installmentOptions.map((inst) => ({
      id: inst.id,
      amount: inst.amount,
      paid: inst.paid,
      originalAmount: inst.originalAmount,
    })),
    feeDescriptions: feeEntries
      .filter(entry => entry !== undefined)
      .map((entry) => ({
        type: entry.type,
        amount: entry.amount,
        description: entry.type === "other" ? entry.description || null : null,
        installmentId: entry.installmentId || null,
      })),
    allowDuplicate: false,
  };
  console.log("[RECEIPT][PAYMENT] submitting payment with entered receiptNumber:", receiptNumber);
  const currentSignature = buildPaymentSignature(paymentData);

try {
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
    if (duplicateCheckData?.exists) {
      const confirmMessage = `Already you have paid this amount with receipt number ${duplicateCheckData.receiptNumber}. Do you want to pay again?`;
      const proceedWithDuplicate = await askDuplicateConfirmation(confirmMessage);
      if (!proceedWithDuplicate) {
        setIsLoading(false);
        return;
      }
      paymentData.allowDuplicate = true;
    }
  }

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

  console.log("Fetch response status:", response.status, "Data:", data);

  // Check success flag if your backend sends it
  if (response.status === 409 && data?.duplicate) {
    const confirmMessage = `Already you have paid this amount with receipt number ${data.receiptNumber}. Do you want to pay again?`;
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

  if ((response.ok && data.success !== false) || data.success === true) {
    console.log("✅ Payment Success:", data.message);
    const usedReceiptNumber = data?.receiptNumber || receiptNumber;
    console.log("[RECEIPT][PAYMENT] backend allocated receiptNumber:", usedReceiptNumber);
    setReceiptNumber(usedReceiptNumber);
    currentReceiptNumberRef.current = usedReceiptNumber;

    // Your existing success logic
    const paidPopupData = {
      studentId: selectedStudentId,
      studentName: selectedStudent,
      className,
      section,
      paymentDate,
      receiptNumber: usedReceiptNumber,
      paymentMode,
      transactionId,
      transaction_id: transactionId,
      cashAmount: Number(cashAmount || 0),
      onlineAmount: Number(onlineAmount || 0),
      paymentSplit: {
        cash: Number(cashAmount || 0),
        online: Number(onlineAmount || 0),
      },
      discountAmount: parseFloat(discountAmount) || 0,
      paidAmount: currentTransactionTotal,
      fees: {
        admission: {
          totalPaid: alreadyPaidAmounts.admission + feeTypesPaid.admission,
          paidThisTransaction: feeTypesPaid.admission,
          highlight: feeTypesPaid.admission > 0,
        },
        tuition: {
          totalPaid: alreadyPaidAmounts.tuition + feeTypesPaid.tuition,
          paidThisTransaction: feeTypesPaid.tuition,
          highlight: feeTypesPaid.tuition > 0,
        },
        bus: {
          totalPaid: alreadyPaidAmounts.bus + feeTypesPaid.bus,
          paidThisTransaction: feeTypesPaid.bus,
          highlight: feeTypesPaid.bus > 0,
        },
        book: {
          totalPaid: alreadyPaidAmounts.books + feeTypesPaid.books,
          paidThisTransaction: feeTypesPaid.books,
          highlight: feeTypesPaid.books > 0,
        },
        uniform: {
          totalPaid: alreadyPaidAmounts.uniform + feeTypesPaid.uniform,
          paidThisTransaction: feeTypesPaid.uniform,
          highlight: feeTypesPaid.uniform > 0,
        },
        exam: {
          totalPaid: alreadyPaidAmounts.exam + feeTypesPaid.exam,
          paidThisTransaction: feeTypesPaid.exam,
          highlight: feeTypesPaid.exam > 0,
        },
        residential: {
          totalPaid: alreadyPaidAmounts.residential + feeTypesPaid.residential,
          paidThisTransaction: feeTypesPaid.residential,
          highlight: feeTypesPaid.residential > 0,
        },
        others: {
          totalPaid: alreadyPaidAmounts.other + feeTypesPaid.other,
          paidThisTransaction: feeTypesPaid.other,
          highlight: feeTypesPaid.other > 0,
          description: feeEntries.find((f) => f?.type === "other")?.description || "",
        },
      },
      submittedFeeEntries,
    };

    setPaidPageData(paidPopupData);
    setShowPopup(false);
    setShowPaidPopup(true);

    showPopupMessage(data.message || "Payment submitted successfully!", "success");
    console.log("[RECEIPT][PAYMENT] accepted payment signature:", currentSignature);

    // Reset form
    setSelectedStudent("");
    setPaidAmount(0);
    setDiscountAmount(0);
    setFeeEntries([{ type: "", amount: "" }]);
    setPaymentDate("");
    setPaymentMode("");
    setShowModal(false);
    await fetchLastReceiptNumber();
  } else {
    // Show backend message even if response.ok is false
    showPopupMessage(data.message || "Payment submission failed. Please try again.", "error");
  }
} catch (err) {
  console.error("Payment failed:", err);
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

      console.log("Backend totals data:", res.data);
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

      const res = await axios.get(`https://cleezoclass.com:4000/api/feeDetailsByClassSection`, {
        params: { className: cls, section: sec, schoolCode },
      });

      setClassFeeData(res.data.feeDetail || {});
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

  // Fetch students whenever className or section changes
useEffect(() => {
  // ❌ Do not refresh while popup is open
  if (showPopup) return;

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

  // ⏱ refresh every 3 seconds
  const interval = setInterval(fetchStudents,60000);

  // 🧹 cleanup
  return () => clearInterval(interval);
}, [showPopup, className, section]);




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
      console.log("API RESPONSE:", res.data);   // <--- DEBUG

      const feeDetail =
        res.data.feeDetails ||      // correct key
        res.data.feeDetail  ||      // fallback
        null;

      setFeeDetail(feeDetail);

      if (!feeDetail || feeDetail.CompleteFee == 0) {
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
}, [selectedClassSection]);

const paidInstallmentMap = {};

if (installments && typeof installments === "object") {
  Object.keys(installments).forEach((key) => {
    if (key.startsWith("installment")) {
      const installmentId = parseInt(key.replace("installment", ""), 10);
      paidInstallmentMap[installmentId] =
        parseFloat(installments[key]) || 0;
    }
  });
}

installmentOptions.forEach((installment) => {
  const installmentId = Number(installment?.installment || installment?.id);
  if (!installmentId || paidInstallmentMap[installmentId]) return;
  paidInstallmentMap[installmentId] = Number(installment?.paid || 0);
});

const getOverdueForFeeLabel = (label) => {
  const keys = feeLabelOverdueKeys[label] || [normalizeFeeKey(label)];
  return keys.reduce((sum, key) => {
    const rows = feeInstallmentBridge?.[normalizeFeeKey(key)]?.classWise || [];
    return sum + calculateOverdueAmount(rows);
  }, 0);
};

const feeSummaryRows = [
  { label: "Admission Fee", total: admissionFee, paid: admissionPaid, remaining: admissionRemaining },
  { label: "Tuition Fee", total: tuitionFee, paid: tuitionPaid, remaining: tuitionRemaining },
  { label: "Residential Fee", total: residentialFee, paid: residentialPaid, remaining: residentialRemaining },
  { label: "Bus Fee", total: busFee, paid: busPaid, remaining: busRemaining },
  { label: "Exam Fee", total: examFee, paid: examPaid, remaining: examRemaining },
  {
    label: "Books Fee",
    total: bookFee === 0 && bookPaid > 0 ? bookPaid : bookFee,
    paid: bookPaid,
    remaining: (bookFee === 0 && bookPaid > 0 ? bookPaid : bookFee) - bookPaid,
  },
  { label: "Uniform Fee", total: uniformFee, paid: uniformPaid, remaining: uniformRemaining },
  {
    label: "Other Fees",
    total: othersPaid,
    paid: othersPaid,
    remaining: 0,
  },
].map((fee) => ({
  ...fee,
  overdue: getOverdueForFeeLabel(fee.label),
}));

const totalOverdueAmount = feeSummaryRows.reduce(
  (sum, fee) => sum + (Number(fee.overdue) || 0),
  0
);

  const [dropdownLoading, setDropdownLoading] = useState(false);

const filteredStudents = students.filter((student) =>
  student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  String(student.id).includes(searchTerm)
);
const [selectedFeeRow, setSelectedFeeRow] = useState(null);
const fetchMetadata = useCallback(async () => {
  console.log("===== FETCH METADATA START =====");

  setDropdownLoading(true);
  const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";

  console.log("Using schoolCode:", schoolCode);

  try {
    const [classRes, sectionRes] = await Promise.all([
      axios.get(`${API_BASE}/classes?schoolCode=${schoolCode}`),
      axios.get(`${API_BASE}/sectionFilter?schoolCode=${schoolCode}`)
    ]);

    console.log("----- RAW CLASS API RESPONSE -----");
    console.log(classRes);
    console.log("Class API Data:", classRes.data);

    console.log("----- RAW SECTION API RESPONSE -----");
    console.log(sectionRes);
    console.log("Section API Data:", sectionRes.data);

    // ✅ Handle dynamic class format safely
    const classesFromAPI = Array.isArray(classRes.data)
      ? classRes.data
      : classRes.data?.classes || [];

    console.log("Processed Classes:", classesFromAPI);

    setClassList(classesFromAPI);

    // ✅ Handle dynamic section format safely
    const sectionsFromAPI = Array.isArray(sectionRes.data)
      ? sectionRes.data
      : sectionRes.data?.sections || [];

    console.log("Processed Sections:", sectionsFromAPI);

    setSectionMap(sectionsFromAPI);

    console.log("===== FETCH METADATA SUCCESS =====");

  } catch (err) {
    console.error("===== FETCH METADATA ERROR =====");
    console.error("Error message:", err.message);
    console.error("Full error:", err);

    setClassList([]);
    setSectionMap([]);
  } finally {
    setDropdownLoading(false);
    console.log("===== FETCH METADATA END =====");
  }
}, [API_BASE]);

useEffect(() => {
  fetchMetadata();
}, [fetchMetadata]);

return (
  <>
    <div className="payment-flex-container">
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
              <span>₹{payments?.discounts ? (
                (payments.discounts.feeDiscount || 0) +
                (payments.discounts.tuitionDiscount || 0) +
                (payments.discounts.busDiscount || 0)
              ).toLocaleString() : 0}</span>
              Discounts
            </div>
          </div>
          {installmentOptions?.length > 0 ? (
            <div className="payment-installment-list">
              {installmentOptions
                .slice()
                .filter((inst) => {
                  const paidAmount = paidInstallmentMap[inst.installment] || 0;
                  const dueAmount = inst.amount - paidAmount;
                  return dueAmount > 0;
                })
                .map((inst) => {
                  const paidAmount = paidInstallmentMap[inst.installment] || 0;
                  const dueAmount = inst.amount - paidAmount;
                  return (
                    <div key={inst.installment} className="payment-installment-item">
                      <span>Inst {inst.installment}</span>
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

    console.log("Selected Value:", selectedValue);

    setSelectedClassSection(selectedValue);
    localStorage.setItem("selectedClassSection", selectedValue);

    if (selectedValue) {
      const [cls, sec] = selectedValue.split("_");

      console.log("Class:", cls);
      console.log("Section:", sec);

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

    setInstallmentOptions([]);
    setFeeError("");
  }}
>
  <option value="">-- Select Class & Section --</option>

  {console.log("classList:", classList)}
  {console.log("sectionMap:", sectionMap)}

  {classList.map((cls) => {

    console.log("Processing Class:", cls);

    const sectionsForClass = sectionMap
      .filter(item => {
        const classValue =
          item.class_name || item.class || item.className;

        console.log("Comparing:", classValue, "with", cls);

        return String(classValue) === String(cls);
      })
      .map(item =>
        item.section || item.section_name || item.sectionName
      );

    console.log("Sections for", cls, ":", sectionsForClass);

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
              const totalPaid = Number(student.total_paid || 0);
              const completeFee = Number(classFeeData?.CompleteFee || 0);
              const dueAmount = Math.max(completeFee - totalPaid, 0);
              return (
                <div
                  key={student.id}
                  onClick={() => {
                    if (feeError) return;
                    setSelectedStudentId(student.id);
                    setSelectedStudent(student.name);
                  }}
                  className={`payment-student-card ${student.id === selectedStudentId ? "payment-student-card-selected" : ""}`}
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
                    {(
                      (payments.completeFee || 0) +
                      (payments.residentialFee || 0) +
                      (totals.AdmissionFee || 0) -
                      ((payments.paidAmount || 0) +
                        (payments.bookPaid || 0) +
                        (payments.busPaid || 0) +
                        (payments.uniformPaid || 0) +
                        (payments.examPaid || 0) +
                        (payments.othersPaid || 0) +
                        (payments.admissionPaid || 0) +
                        (payments.residentialPaid || 0))
                    ).toLocaleString()}
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
                            <th>Total Fee</th>
                            <th>Paid</th>
                            <th>Remaining</th>
                            <th>Overdue</th>
                          </tr>
                        </thead>
                        <tbody>
                   {feeSummaryRows.map((fee, idx) => (
                            <tr key={idx}>
                              <td>{fee.label}</td>
                              <td>Rs. {fee.total.toFixed(2)}</td>
                              <td>Rs. {fee.paid.toFixed(2)}</td>
                              <td>Rs. {fee.remaining.toFixed(2)}</td>
                              <td className={fee.overdue > 0 ? "payment-overdue-amount" : ""}>
                                {fee.overdue > 0 ? `Rs. ${fee.overdue.toFixed(2)}` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>Total</td>
                            <td>Rs. {totalAmount.toFixed(2)}</td>
                            <td>Rs. {paidAmount.toFixed(2)}</td>
                            <td>Rs. {remainingAmount.toFixed(2)}</td>
                            <td className={totalOverdueAmount > 0 ? "payment-overdue-amount" : ""}>
                              {totalOverdueAmount > 0 ? `Rs. ${totalOverdueAmount.toFixed(2)}` : "-"}
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
                    <th>Total</th>
                    <th>Remaining</th>
                    <th>Overdue</th>
                    <th>Pay Now</th>
                  </tr>
                </thead>

          <tbody>
            {feeSummaryRows.map((fee, idx) => {
              const remaining = fee.total - fee.paid;

              return (
             <tr
  key={idx}
  onMouseEnter={() => fee.label === "Tuition Fee" && setShowInstallments(true)}
  onMouseLeave={() => setShowInstallments(false)}
  style={{ position: "relative" }}
>
  <td style={{ border: "1px solid #ccc", padding: "5px", position: "relative" }}>
    {fee.label}

    {/* HOVER INSTALLMENT SELECTION BOX */}
    {fee.label === "Tuition Fee" && showInstallments && (
      <div
        style={{
          position: "absolute",
          top: "100%",
          right: -300,
          background: "#fff",
          border: "1px solid #ccc",
          padding: "8px",
          fontSize: "10px",
          borderRadius: "8px",
          width: "200px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          zIndex: 999,
        }}
      >
        <strong>Select Installment</strong>
       <ul style={{ paddingLeft: 0, marginTop: 8, listStyle: "none" }}>
  {installmentOptions.map((inst) => {
    const original = Number(inst.amount);
    const paid = Number(installments[`installment${inst.installment}`] || inst.paid || 0);
    const remainingAmt = original - paid;
    const isPaid = remainingAmt <= 0;

    return (
      <li
        key={inst.installment}
        onClick={() => {
          if (isPaid) return; // disable if paid

          const newEntries = [...feeEntries];
          newEntries[idx] = {
            ...newEntries[idx],
            type: feeLabelToKey["Tuition Fee"],
            installmentId: inst.installment,
            amount: remainingAmt,
          };

          setFeeEntries(newEntries);
          setShowInstallments(false);
        }}
        style={{
          padding: "6px 8px",
          borderBottom: "1px solid #eee",
          cursor: isPaid ? "not-allowed" : "pointer",
          color: isPaid ? "#a0a0a0" : "#000",
          background: isPaid ? "#f5f5f5" : "transparent",
          opacity: isPaid ? 0.6 : 1,
        }}
      >
        {isPaid
          ? `Installment ${inst.installment} — Paid`
          : `Installment ${inst.installment} — Rs. ${remainingAmt.toFixed(2)}`}
      </li>
    );
  })}
</ul>

      </div>
    )}
{fee.label === "Other Fees" && (
  <input
    value={feeEntries[idx]?.description || ""}
    onChange={(e) => {
      const updated = [...feeEntries];
      updated[idx] = {
        ...updated[idx],
        description: e.target.value,
        type: feeLabelToKey[fee.label],
      };
      setFeeEntries(updated);
    }}
    placeholder="Description (optional)"
  />
)}

  </td>

  <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
    Rs. {fee.total.toFixed(2)}
  </td>

  <td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
    Rs. {(fee.total - fee.paid).toFixed(2)}
  </td>

  <td
    className={fee.overdue > 0 ? "payment-overdue-amount" : ""}
    style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}
  >
    {fee.overdue > 0 ? `Rs. ${fee.overdue.toFixed(2)}` : "-"}
  </td>

<td style={{ border: "1px solid #ccc", padding: "5px", textAlign: "right" }}>
  {/* AMOUNT INPUT */}
  <input
    type="text"
    value={feeEntries[idx]?.raw || ""}
    onChange={(e) => {
      let val = e.target.value;

      // 1. Allow only numbers and a single decimal point
      val = val.replace(/[^0-9.]/g, "");
      const parts = val.split(".");
      if (parts.length > 2) return;

      const num = parts[0] ? parseFloat(val) : 0;

      // 2. VALIDATION LOGIC:
      // Remove restriction if the label is "Other Fees". 
      // Otherwise, prevent exceeding the remaining balance.
      if (fee.label !== "Other Fees") {
        if (num > fee.total - fee.paid) return;
      }

      // 3. Update state for both the list and the numeric calculations
      const updated = [...feeEntries];
      updated[idx] = {
        ...(updated[idx] || {}), // Ensure object exists to avoid errors
        raw: val,           
        amount: num,        
        type: feeLabelToKey[fee.label],
      };
      
      setFeeEntries(updated);

      // 4. Synchronize with the central fees state to ensure both columns have the same value
      const typeKey = feeLabelToKey[fee.label];
      if (typeKey) {
        setFees(prev => ({
          ...prev,
          [typeKey]: num
        }));
      }
    }}
    onBlur={() => {
      const updated = [...feeEntries];
      if (!updated[idx]) return;

      const num = updated[idx].amount || 0;

      // Format the number for display (e.g., 1000.00)
      updated[idx].raw = num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setFeeEntries(updated);
    }}
    placeholder="Enter Amount"
    style={{ width: "100px", padding: "5px", textAlign: "right" }}
  />
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
      onChange={(e) => setPaymentMode(e.target.value)}
    >
      <option value="">-- Select Mode --</option>
      <option value="Cash">Cash</option>
      <option value="Online">Online</option>
      <option value="Card">Card</option>
      <option value="Cheque">Cheque</option>
      <option value="Cash+Online">Cash+Online</option>
    </select>
  </div>

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
                    <input type="number" value={cashAmount} onChange={(e) => setCashAmount(Number(e.target.value))} placeholder="Enter cash" />
                  </div>
                  <div className="payment-detail-item">
                    <label>Online Amount:</label>
                    <input type="number" value={onlineAmount} onChange={(e) => setOnlineAmount(Number(e.target.value))} placeholder="Enter online amount" />
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
  paymentMode={paidPageData?.paymentMode || paymentMode}
  discountAmount={discountAmount}
  transactionId={paidPageData?.transactionId || transactionId}
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
