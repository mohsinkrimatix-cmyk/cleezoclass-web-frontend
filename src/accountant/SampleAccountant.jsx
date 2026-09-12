import { ArrowLeft, ChevronRight, Circle, Download, Share } from "lucide-react";
import { CheckCircle, Star } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Link, useNavigate, useLocation } from "react-router-dom"; // CORRECTED: Added useLocation
import PaidAmountdemo from "./Accountant_commerce_income_GenerateBill";
import './Payment.css'
import ErrorPopup from "../shared/ErrorPopup";
const schoolLogo = ""; // Optional custom logo
const PayementDemoDetails = ({ className: propClassName, sectionName: propSectionName }) => {
  // CORRECTED: Added useLocation hook call
  const location = useLocation();

  // ... more state declarations ...
const [popupMsg, setPopupMsg] = useState("");

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
  const [receiptNumber, setReceiptNumber] = useState("");
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
  const [tuitionFee, setTuitionFee] = useState(0);
  const [tuitionPaid, setTuitionPaid] = useState(0);
  const [examPaid, setExamPaid] = useState(0);
  const [busPaid, setBusPaid] = useState(0);
  const [bookPaid, setBookPaid] = useState(0);
  const [uniformPaid, setUniformPaid] = useState(0);
  const [othersPaid, setOthersPaid] = useState(0);
  const contentRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
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
  });
 
 useEffect(() => {
  if (selectedStudentId) {
    setShowModal(true);
  }
}, [selectedStudentId]);
  const [showReceipt, setShowReceipt] = useState(false);
const [showPaymentPopup, setShowPaymentPopup] = useState(false);

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
      setFees({ tuition: 0, exam: 0, bus: 0, uniform: 0, books: 0, other: 0, admission: 0 });
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
  // Load receipt number
  const lastReceiptNumber = localStorage.getItem('lastReceiptNumber');
  if (lastReceiptNumber) {
    setReceiptNumber(parseInt(lastReceiptNumber));
  } else {
    setReceiptNumber(1);
  }
 
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
  const incrementReceiptNumber = () => {
    const newNumber = parseInt(receiptNumber) + 1;
    setReceiptNumber(newNumber);
    localStorage.setItem('lastReceiptNumber', newNumber);
  };
 
  const handleSetReceiptNumber = () => {
    if (!receiptNumber || isNaN(receiptNumber)) {
      console.error('Please enter a valid numeric receipt number');
      return;
    }
    setInitialReceiptSet(true);
    localStorage.setItem('lastReceiptNumber', receiptNumber);
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
    const newFees = { tuition: 0, exam: 0, bus: 0, uniform: 0, books: 0, other: 0 };
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
 
// REPLACE THE ENTIRE EXISTING useEffect BLOCK WITH THIS ONE
useEffect(() => {
  console.log("useEffect triggered with studentId:", selectedStudentId);

  // Reset all state values when student changes
  setStudentData({
    name: "",
    fatherName: "",
    class: "",
    section: "",
    rollNumber: "",
    billType: "full-package",
  });
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
  setExamPaid(0);
  setBusPaid(0);
  setBookPaid(0);
  setUniformPaid(0);
  setOthersPaid(0);
  setTuitionPaid(0);
  setAdmissionPaid(0);
  setTuitionRemaining(0);
  setExamRemaining(0);
  setBusRemaining(0);
  setBookRemaining(0);
  setUniformRemaining(0);
  setOthersRemaining(0);
  setAdmissionRemaining(0);

  if (!selectedStudentId) return;

  const selected = students.find((s) => s.id === selectedStudentId);
  if (!selected) return;

  // Set basic student data
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

  // Fetch specific bus fee
  axios
    .post("https://cleezoclass.com:4000/get-bus-fee", {
      studentName: selected.name,
      className: className.replace("Class ", ""),
      sectionName: selected.section || "A",
      schoolCode: schoolCode,
    })
    .then((busFeeRes) => {
      if (busFeeRes.data.FeesDetails && busFeeRes.data.FeesDetails.Bus_fees) {
        const fetchedBusFee = parseFloat(busFeeRes.data.FeesDetails.Bus_fees) || 0;
        setBusFee(fetchedBusFee);
      }
    })
    .catch((err) => console.error("Error fetching bus fee:", err));

  // Fetch fee structure
  axios
    .get(`https://cleezoclass.com:4000/api/feeStructure/${className}?schoolCode=${schoolCode}`)
    .then((feeRes) => {
      if (feeRes.data?.feeStructure) {
        setFeeStructure(feeRes.data.feeStructure);
      }
    })
    .catch((err) => console.error("Error fetching fee structure:", err));

  // Fetch class installments
  const normalizedClass = className.replace("Class ", "").trim();
  const sectionParam = selected.section ?? null;

  axios
    .get("https://cleezoclass.com:4000/api/class-installments", {
      params: { class: normalizedClass, section: sectionParam, schoolCode },
    })
    .then((res) => {
      if (Array.isArray(res.data?.installments)) {
        const parsedInstallments = res.data.installments.map((inst) => ({
          ...inst,
          amount: parseFloat(inst.amount),
          originalAmount: parseFloat(inst.amount),
        }));
        setInstallmentOptions(parsedInstallments);
      } else {
        setInstallmentOptions([]);
      }
    })
    .catch((err) => {
      console.error("Error fetching class installments:", err);
      setInstallmentOptions([]);
    });

  // Fetch already paid installments
  axios
    .get(`https://cleezoclass.com:4000/api/getpaidinstallment/${selectedStudentId}?schoolCode=${schoolCode}`)
    .then((res) => setInstallments(res.data.installments || []))
    .catch((err) => console.error("Error fetching installments:", err));

  // Fetch payment history and calculate fees with discounts
  axios
    .get(`https://cleezoclass.com:4000/api/payment/${selectedStudentId}?schoolCode=${schoolCode}`)
    .then((paymentRes) => {
      const paymentData = paymentRes.data.payments || {};
      setPayments(paymentData);

      const completeFee = parseFloat(paymentData.completeFee) || 0;
      const examFee = parseFloat(paymentData.examFee) || 0;
      const busFeeFromHistory = parseFloat(paymentData.busFee) || 0; // Use busFee from history if needed
      const bookFee = parseFloat(paymentData.bookFee) || 0;
      const uniformFee = parseFloat(paymentData.uniformFee) || 0;
      const othersFee = parseFloat(paymentData.othersFee) || 0;
      const admissionFee = parseFloat(paymentData.admissionFee) || 0;

      const examPaid = parseFloat(paymentData.examPaid) || 0;
      const busPaid = parseFloat(paymentData.busPaid) || 0;
      const bookPaid = parseFloat(paymentData.bookPaid) || 0;
      const uniformPaid = parseFloat(paymentData.uniformPaid) || 0;
      const othersPaid = parseFloat(paymentData.othersPaid) || 0;
      const tuitionPaid = parseFloat(paymentData.paidAmount) || 0;
      const admissionPaid = parseFloat(paymentData.admissionPaid) || 0;

      const discounts = paymentData.discounts || {};
      const bookDiscount = parseFloat(discounts.feeDiscount) || 0; // Books only
      const tuitionDiscount = parseFloat(discounts.tuitionDiscount) || 0;
      const busDiscount = parseFloat(discounts.busDiscount) || 0;

      // Calculate remaining amounts after discounts
      const admissionRemaining = admissionFee - admissionPaid;
      const tuitionFee =
        completeFee - examFee  - bookFee - uniformFee - othersFee - admissionFee;
      const tuitionRemaining = tuitionFee - tuitionPaid - tuitionDiscount;
      const busRemaining = busFeeFromHistory - busPaid - busDiscount;
      const examRemaining = examFee - examPaid;
      const bookRemaining = bookFee - bookPaid - bookDiscount;
      const uniformRemaining = uniformFee - uniformPaid;
      const othersRemaining = othersFee - othersPaid;

      const totalPaid =
        admissionPaid + tuitionPaid + examPaid + busPaid + bookPaid + uniformPaid + othersPaid;
      const totalDiscount = bookDiscount + tuitionDiscount + busDiscount;
      const remainingAmount = completeFee - totalPaid - totalDiscount;

      // Update all state
      setTotalAmount(completeFee);
      setPaidAmount(totalPaid);
      setRemainingAmount(remainingAmount);

      setTuitionFee(tuitionFee);
      setTuitionPaid(tuitionPaid);
      setTuitionRemaining(tuitionRemaining);

      setAdmissionFee(admissionFee);
      setAdmissionPaid(admissionPaid);
      setAdmissionRemaining(admissionRemaining);

      setBusFee(busFeeFromHistory);
      setBusPaid(busPaid);
      setBusRemaining(busRemaining);

      setExamFee(examFee);
      setExamPaid(examPaid);
      setExamRemaining(examRemaining);

      setBookFee(bookFee);
      setBookPaid(bookPaid);
      setBookRemaining(bookRemaining);

      setUniformFee(uniformFee);
      setUniformPaid(uniformPaid);
      setUniformRemaining(uniformRemaining);

      setOthersFee(othersFee);
      setOthersPaid(othersPaid);
      setOthersRemaining(othersRemaining);
    })
    .catch((err) => console.error("Error fetching payment history:", err));
}, [selectedStudentId, className]);  // <- students removed

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

  let newFees = { ...fees }; // copy previous fees

  if (field === 'type') {
    const selectedType = value;
    if (!updatedEntries[index].amount) {
      // For "other" fees, set amount to 0 if not already set
      const amount = selectedType === "other" ? 0 : (defaultFees[selectedType] || 0);
      updatedEntries[index].amount = amount;
    }
    // Update fees object for this type
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

  // Filter out entries that are empty or zero
  const filteredFeeEntries = feeEntries.filter(
    (entry) => entry && entry.amount > 0 && entry.type
  );

  if (filteredFeeEntries.length === 0) {
    showPopupMessage("Please enter at least one fee amount.", "error");
    setIsLoading(false);
    return;
  }



  // Prepare the per-fee payment data
  const paymentData = filteredFeeEntries.map((entry) => ({
    type: entry.type,
    amount: entry.amount,
    paidDate: entry.paidDate, // per fee
    installmentId: entry.installmentId || null, // for tuition
    description: entry.type === "others" ? entry.description || null : null,
    paymentMode: entry.paymentMode || null, // per fee
    transactionId: entry.transactionId || null, // per fee
    cashAmount: entry.cashAmount || null, // if Cash+Online
    onlineAmount: entry.onlineAmount || null, // if Cash+Online
  }));

  try {
    const response = await fetch(
      "https://cleezoclass.com:4000/trial-pay-fee-detailsincome",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: selectedStudent,
          className,
          sectionName: section,
          schoolCode,
          discount: parseFloat(discountAmount) || 0,
          feeDetails: paymentData,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      showPopupMessage(data.message || "Payment submitted successfully!", "success");

      setPaidPageData({
        studentName: selectedStudent,
        className,
        section,
        fees: filteredFeeEntries,
        paidAmount: filteredFeeEntries.reduce((sum, f) => sum + f.amount, 0),
      });

      setShowPopup(false);
      setShowPaidPopup(true);

      // Reset form
      setSelectedStudent("");
      setFeeEntries([{ type: "", amount: "" }]);
      setDiscountAmount(0);
      setShowModal(false);
    } else {
      showPopupMessage(data.message || "Something went wrong.", "error");
    }
  } catch (err) {
    console.error("Payment failed:", err);
    showPopupMessage("Payment submission failed. Please try again.", "error");
  } finally {
    setIsLoading(false);
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
    console.log("🔄 Refreshing students list...");
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
  const interval = setInterval(fetchStudents, 60000);

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

const filteredStudents = students.filter((student) =>
  student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  String(student.id).includes(searchTerm)
);
const [selectedFeeRow, setSelectedFeeRow] = useState(null);
const paidDates = {
  "Admission Fee": "2026-02-01",
  "Tuition Fee": "2026-02-05",
  "Bus Fee": "2026-02-03",
  "Exam Fee": "",
  "Books Fee": "",
  "Uniform Fee": "",
  "Other Fees": "",
};

return (
  <>
    <div className="payment-flex-container">
    

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
                setInstallmentOptions([]);
                setPaidInstallmentMap({});
                setFeeError("");
              }}
            >
              <option value="">-- Select Class & Section --</option>
              {["Nursery", "LKG", "UKG", ...Array.from({ length: 10 }, (_, i) => `${i + 1}`)]
                .flatMap((cls) =>
                  ["A"].map((sec) => (
                    <option key={`${cls}_${sec}`} value={`${cls}_${sec}`}>
                      {cls} - {sec}
                    </option>
                  ))
                )}
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
                      (totals.AdmissionFee || 0) -
                      ((payments.paidAmount || 0) +
                        (payments.bookPaid || 0) +
                        (payments.busPaid || 0) +
                        (payments.uniformPaid || 0) +
                        (payments.examPaid || 0) +
                        (payments.othersPaid || 0) +
                        (payments.admissionPaid || 0))
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
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: "Admission Fee", total: admissionFee, paid: admissionPaid, remaining: admissionRemaining },
                            { label: "Tuition Fee", total: tuitionFee, paid: tuitionPaid, remaining: tuitionRemaining },
                            { label: "Bus Fee", total: busFee, paid: busPaid, remaining: busRemaining },
                            { label: "Exam Fee", total: examFee, paid: examPaid, remaining: examRemaining },
                            { label: "Books Fee", total: bookFee, paid: bookPaid, remaining: bookRemaining },
                            { label: "Uniform Fee", total: uniformFee, paid: uniformPaid, remaining: uniformRemaining },
                            { label: "Other Fees", total: othersFee, paid: othersPaid, remaining: othersRemaining },
                          ].map((fee, idx) => (
                            <tr key={idx}>
                              <td>{fee.label}</td>
                              <td>Rs. {fee.total.toFixed(2)}</td>
                              <td>Rs. {fee.paid.toFixed(2)}</td>
                              <td>Rs. {fee.remaining.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>Total</td>
                            <td>Rs. {totalAmount.toFixed(2)}</td>
                            <td>Rs. {paidAmount.toFixed(2)}</td>
                            <td>Rs. {remainingAmount.toFixed(2)}</td>
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
  <div
    className="income-modal-overlay"
    onClick={(e) => e.target === e.currentTarget && handleClosePopup()}
  >
    <div
      className="payment-modal-content"
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
                <th>Paid Date</th>
                <th>Pay Now</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Admission Fee", total: admissionFee, paid: admissionPaid, type: "admission" },
                { label: "Tuition Fee", total: tuitionFee, paid: tuitionPaid, type: "tuition" },
                { label: "Bus Fee", total: busFee, paid: busPaid, type: "bus" },
                { label: "Exam Fee", total: examFee, paid: examPaid, type: "exam" },
                { label: "Books Fee", total: bookFee, paid: bookPaid, type: "book" },
                { label: "Uniform Fee", total: uniformFee, paid: uniformPaid, type: "uniform" },
                { label: "Other Fees", total: othersFee, paid: othersPaid, type: "others" },
              ].map((fee, idx) => {
                const entry = feeEntries[idx] || {};
                const total = entry.total !== undefined ? entry.total : fee.total;
                const paid = entry.paid !== undefined ? entry.paid : fee.paid;
                const remaining = total - paid - (entry.amount || 0);

                return (
                  <tr key={idx}>
                    <td>
                      {fee.label}

                      {/* Tuition Installments */}
                      {fee.type === "tuition" && showInstallments && (
                        <div className="installment-hover">
                          {installmentOptions.map(inst => {
                            const instPaid = installments[`installment${inst.installment}`] || 0;
                            const remainingAmt = inst.amount - instPaid;
                            const isPaid = remainingAmt <= 0;
                            return (
                              <div
                                key={inst.installment}
                                onClick={() => {
                                  if (isPaid) return;
                                  const updated = [...feeEntries];
                                  updated[idx] = {
                                    ...updated[idx],
                                    type: fee.type,
                                    installmentId: inst.installment,
                                    amount: remainingAmt,
                                  };
                                  setFeeEntries(updated);
                                }}
                              >
                                {isPaid ? `Installment ${inst.installment} — Paid` : `Installment ${inst.installment} — Rs. ${remainingAmt}`}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Other Fees Description */}
                      {fee.type === "others" && (
                        <input
                          value={entry.description || ""}
                          onChange={(e) => {
                            const updated = [...feeEntries];
                            updated[idx] = { ...(entry || {}), type: fee.type, description: e.target.value };
                            setFeeEntries(updated);
                          }}
                          placeholder="Description (optional)"
                        />
                      )}
                    </td>

                    {/* Editable Total */}
                    <td>
                      <input
                        type="number"
                        value={total}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const updated = [...feeEntries];
                          updated[idx] = { ...(entry || {}), total: val, type: fee.type };
                          setFeeEntries(updated);
                        }}
                        placeholder="Enter Total"
                      />
                    </td>

                    {/* Remaining */}
                    <td>Rs. {remaining.toFixed(2)}</td>

                    {/* Paid Date */}
                    <td>
                      <input
                        type="date"
                        value={entry.paidDate || ""}
                        onChange={(e) => {
                          const updated = [...feeEntries];
                          updated[idx] = { ...(entry || {}), paidDate: e.target.value, type: fee.type };
                          setFeeEntries(updated);
                        }}
                      />
                    </td>

                    {/* Payment Amount & Mode */}
                    <td>
                      <input
                        type="number"
                        value={entry.amount || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          if (val > remaining && fee.type !== "others") return;
                          const updated = [...feeEntries];
                          updated[idx] = { ...(entry || {}), amount: val, type: fee.type };
                          setFeeEntries(updated);
                        }}
                        placeholder="Enter Amount"
                      />

                      <select
                        value={entry.paymentMode || ""}
                        onChange={(e) => {
                          const updated = [...feeEntries];
                          updated[idx] = { ...(entry || {}), paymentMode: e.target.value, type: fee.type };
                          setFeeEntries(updated);
                        }}
                      >
                        <option value="">-- Select Mode --</option>
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                        <option value="Card">Card</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Cash+Online">Cash+Online</option>
                      </select>

                      {(entry.paymentMode === "Online" || entry.paymentMode === "Cash+Online") && (
                        <input
                          type="text"
                          value={entry.transactionId || ""}
                          onChange={(e) => {
                            const updated = [...feeEntries];
                            updated[idx] = { ...(entry || {}), transactionId: e.target.value, type: fee.type };
                            setFeeEntries(updated);
                          }}
                          placeholder="Transaction ID"
                        />
                      )}

                      {entry.paymentMode === "Cash+Online" && (
                        <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                          <input
                            type="number"
                            value={entry.cashAmount || ""}
                            onChange={(e) => {
                              const updated = [...feeEntries];
                              updated[idx] = { ...(entry || {}), cashAmount: parseFloat(e.target.value) || 0, type: fee.type };
                              setFeeEntries(updated);
                            }}
                            placeholder="Cash"
                          />
                          <input
                            type="number"
                            value={entry.onlineAmount || ""}
                            onChange={(e) => {
                              const updated = [...feeEntries];
                              updated[idx] = { ...(entry || {}), onlineAmount: parseFloat(e.target.value) || 0, type: fee.type };
                              setFeeEntries(updated);
                            }}
                            placeholder="Online"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Side: Payment Details */}
        <div className="payment-payment-details">
          <div className="payment-details-row">
            <div className="payment-detail-item">
              <label>Payment Date:</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </div>
            <div className="payment-detail-item">
              <label>Receipt No:</label>
              <input type="text" value={formatReceiptNumber()} readOnly />
            </div>
          </div>

          <div className="payment-details-row">
            <div className="payment-detail-item">
              <label>Payment Mode:</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option value="">-- Select Mode --</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash+Online">Cash+Online</option>
              </select>
            </div>

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
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  placeholder="Enter cash"
                />
              </div>
              <div className="payment-detail-item">
                <label>Online Amount:</label>
                <input
                  type="number"
                  value={onlineAmount}
                  onChange={(e) => setOnlineAmount(Number(e.target.value))}
                  placeholder="Enter online amount"
                />
              </div>
            </div>
          )}

          <button className="payment-submit-button" onClick={handlePaymentSubmission}>
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
    onClick={() => setShowPaidPopup(false)} // Close when clicking outside
  >
    <div
      className="Payment-paidPopupContent"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      {/* Close Button */}
      <button
        className="Payment-paidPopupCloseButton"
        onClick={() => setShowPaidPopup(false)}
      >
        X
      </button>

      {/* Paid Amount Demo Component */}
      <PaidAmountdemo
        popupData={paidPageData}
        className={className}
        section={section}
        selectedStudent={selectedStudent}
        selectedStudentId={selectedStudentId}
        paymentDate={paymentDate}
        receiptNumber={receiptNumber}
        paymentMode={paymentMode}
        discountAmount={discountAmount}
      />
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
export default PayementDemoDetails;