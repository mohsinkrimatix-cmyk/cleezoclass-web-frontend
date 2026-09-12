import { Filter, FileText, Download, Printer, Edit, Save, X } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLocation, useNavigate } from 'react-router-dom';

export const getGridClass = (mode) => {
  switch (mode) {
    case 2: return 'grid-rows-2';
    case 4: return 'grid-rows-2 grid-cols-2';
    case 6: return 'grid-rows-3 grid-cols-2';
    default: return 'grid-rows-2';
  }
};

export const getScaleClass = (mode) => {
  switch (mode) {
    case 2: return 'scale-90';
    case 4: return 'scale-75';
    case 6: return 'scale-60';
    default: return 'scale-90';
  }
};

const normalizeLogoSource = (rawLogo) => {
  if (!rawLogo) return "";

  let logo = rawLogo;

  if (typeof logo === "object" && logo?.type === "Buffer" && Array.isArray(logo?.data)) {
    try {
      logo = new Uint8Array(logo.data);
    } catch {
      return "";
    }
  }

  if (logo instanceof Uint8Array) {
    const binary = Array.from(logo, (byte) => String.fromCharCode(byte)).join("");
    return `data:image/png;base64,${btoa(binary)}`;
  }

  if (typeof logo !== "string") return "";
  logo = logo.trim();
  if (!logo) return "";
  if (logo.startsWith("data:image")) return logo;
  if (logo.startsWith("http")) return logo;

  if (logo.startsWith("uploads/")) {
    return `https://cleezoclass.com:5000/${logo}`;
  }
  if (logo.startsWith("/uploads/")) {
    return `https://cleezoclass.com:5000${logo}`;
  }

  if (logo.startsWith("0x")) {
    try {
      const hex = logo.slice(2);
      let binary = "";
      for (let i = 0; i < hex.length; i += 2) {
        binary += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
      return `data:image/png;base64,${btoa(binary)}`;
    } catch {
      return "";
    }
  }

  if (/^[A-Za-z0-9+/=]+$/.test(logo) && logo.length > 100) {
    return `data:image/png;base64,${logo}`;
  }

  return "";
};

const getStoredSchoolLogo = () => normalizeLogoSource(localStorage.getItem("schoolLogo"));


const normalizeReceiptPaidFees = (fees = [], paidAmount = 0) => {
  const targetTotal = Number(paidAmount) || 0;
  let runningTotal = 0;

  return (Array.isArray(fees) ? fees : []).reduce((rows, fee) => {
    const amount = Number(fee?.paidThisTransaction) || 0;
    if (amount <= 0) return rows;

    if (targetTotal > 0) {
      const remaining = targetTotal - runningTotal;
      if (remaining <= 0) return rows;

      const amountForReceipt = Math.min(amount, remaining);
      rows.push({
        ...fee,
        paidThisTransaction: amountForReceipt,
      });
      runningTotal += amountForReceipt;
      return rows;
    }

    const duplicateKey = [
      String(fee?.key || fee?.label || "").trim().toLowerCase(),
      String(fee?.installmentId || "").trim().toLowerCase(),
      amount,
    ].join("|");

    if (!rows.some((row) => row.__receiptKey === duplicateKey)) {
      rows.push({
        ...fee,
        paidThisTransaction: amount,
        __receiptKey: duplicateKey,
      });
    }
    return rows;
  }, []);
};


const PaidAmountdemo = ({ popupData, transactionId }) => {
  const paidFees = normalizeReceiptPaidFees(popupData?.paidFees, popupData?.paidAmount);
const dynamicFeeTypes = popupData?.dynamicFeeTypes || [];
const dynamicFeeRows = popupData?.dynamicFeeRows || [];
  console.log(dynamicFeeRows,"=======================================")
console.log(
  "POPUP RECEIVED",
  JSON.stringify(popupData, null, 2)
);
console.log("paidFees", paidFees);
const [studentData, setStudentData] = useState(null);
  const [previewMode, setPreviewMode] = useState(1);
  const [printMode, setPrintMode] = useState(1);
  const [totalPaid, setTotalPaid] = useState(0);
  const location = useLocation();
  const state = popupData || location.state;
  const paymentReceiptNumber = state?.receiptNumber || null;
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [admissionFee, setAdmissionFee] = useState(0);
  const [admissionPaid, setAdmissionPaid] = useState(0);
  const [feeStructure, setFeeStructure] = useState({
    academicFee: 0,
    uniformFee: 0,
    bookFee: 0,
    transportFee: 0,
    labFee: 0,
    miscellaneousFee: 0,
    hostelFee: 0,
    messFee: 0,
    completeFee: 0
  });
  const [selectedClass, setSelectedClass] = useState(state?.className || "");
  const [responseData, setResponseData] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(state?.studentName || "");
  const [paidAmount, setPaidAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(state?.studentId || null);
  const [showPreviewDropdown, setShowPreviewDropdown] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(paymentReceiptNumber || '001');
  const [initialReceiptSet, setInitialReceiptSet] = useState(false);
  const [paymentMode, setPaymentMode] = useState(state?.paymentMode || '');
  const [paymentDate, setPaymentDate] = useState(state?.paymentDate || '');
  const [payments, setPayments] = useState(null);
  const [generatedBills, setGeneratedBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableBill, setEditableBill] = useState(null);
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
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
  const [residentialFee, setResidentialFee] = useState(0);
  const [residentialPaid, setResidentialPaid] = useState(0);
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookDiscount, setBookDiscount] = useState(0);
  const [tuitionDiscount, setTuitionDiscount] = useState(0);
  const [busDiscount, setBusDiscount] = useState(0);
  const [pendingBills, setPendingBills] = useState([]);
  const [isNextBillTop, setIsNextBillTop] = useState(() => {
    const storedValue = localStorage.getItem('isNextBillTop');
    return storedValue ? JSON.parse(storedValue) : true;
  });
  const [editedTotalDue, setEditedTotalDue] = useState(null);
  const currentReceiptNumberRef = useRef(paymentReceiptNumber || '001');
  const receiptTransactionId =
    transactionId ||
    state?.transactionId ||
    state?.transactionID ||
    state?.transaction_id ||
    "";
  const normalizeClassLabel = (value) =>
    String(value || "").replace(/^Class\s+/i, "").trim();
  const normalizeText = (value) => String(value || "").trim().toLowerCase();
  const getFirstPositiveNumber = (...values) => {
    for (const value of values) {
      const parsed = parseFloat(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    for (const value of values) {
      const parsed = parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  };
  const isDynamicFeeKey = (key) => {
    const reservedKeys = new Set([
      "id",
      "schoolCode",
      "school_code",
      "class_name",
      "className",
      "section",
      "sectionName",
      "StudentName",
      "studentName",
      "name",
      "created_at",
      "updated_at",
      "paymentDate",
      "paidDate",
      "paymentdate",
      "paiddate",
      "date",
      "receiptNumber",
      "paymentMode",
      "transactionId",
      "transactionID",
      "transaction_id",
      "Paid_Amount",
      "paidAmount",
      "completeFee",
      "CompleteFee",
      "academicFee",
      "uniformFee",
      "bookFee",
      "transportFee",
      "labFee",
      "miscellaneousFee",
      "hostelFee",
      "messFee",
      "Tuition_Fee",
      "TuitionFee",
      "Calculated_Tuition_Fee",
      "Admission_fees",
      "Admission_Fee",
      "admissionFee",
      "Exam_fees",
      "examFee",
      "Uniform_fees",
      "uniformFee",
      "Book_Fees",
      "bookFee",
      "Others",
      "OtherFee",
      "othersFee",
      "ResidentialCompleteFee",
      "residentialFee",
      "Bus_fees",
      "busFee",
      "bus_fee",
      "class",
      "Final_Amount",
      "finalAmount",
      "others_description",
      "discounts",
      "totalDiscount",
      "tuitionDiscount",
      "busDiscount",
      "feeDiscount",
      "admissionDiscount",
      "tuitionRemaining",
      "examRemaining",
      "busRemaining",
      "bookRemaining",
      "uniformRemaining",
      "othersRemaining",
      "admissionRemaining",
      "residentialRemaining",
      "dynamicFeeDueTotal",
      "dynamicFeePaidTotal",
      "totalRemaining",
    ]);

    return !reservedKeys.has(key) && !key.endsWith("_paid") && !key.endsWith("_due");
  };
  const receiptFeeTable = dynamicFeeTypes.map((type) => {
  const row = dynamicFeeRows.find(
    (r) =>
      String(r.key || "").toLowerCase() ===
      String(type.columnBase || "").toLowerCase()
  );

  return {
    label: type.feeName,
    total: row?.total || 0,
    paid: row?.paid || 0,
    due: row?.due || Math.max((row?.total || 0) - (row?.paid || 0), 0),
  };
});
  const getDynamicFeeKeysFromSource = (source = {}) =>
    Object.keys(source || {}).filter(isDynamicFeeKey);

  // Fetch last receipt number from DB
  useEffect(() => {
    if (paymentReceiptNumber) {
      setReceiptNumber(paymentReceiptNumber);
      currentReceiptNumberRef.current = paymentReceiptNumber;
      setInitialReceiptSet(true);
      console.log('[RECEIPT][GENERATE_BILL] using receipt from payment:', paymentReceiptNumber);
      return;
    }

    const fetchLastReceiptNumber = async () => {
      const schoolCode = localStorage.getItem('schoolCode');
      if (!schoolCode) return;
      try {
        const response = await axios.get(`https://cleezoclass.com:5000/api/getLastReceiptNumber?schoolCode=${schoolCode}`);
        const lastReceiptNumber = response.data.lastReceiptNumber || '001';
        setReceiptNumber(lastReceiptNumber);
        currentReceiptNumberRef.current = lastReceiptNumber;
        setInitialReceiptSet(true);
      } catch (error) {
        console.error('Error fetching last receipt number:', error);
        setReceiptNumber('001');
        currentReceiptNumberRef.current = '001';
        setInitialReceiptSet(true);
      }
    };
    fetchLastReceiptNumber();
  }, [paymentReceiptNumber]);

  // Save receipt number to DB
  const saveReceiptNumberToDB = async (receiptNumber) => {
    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) return;
    try {
      await axios.post('https://cleezoclass.com:5000/api/saveLastReceiptNumber', {
        schoolCode,
        lastReceiptNumber: receiptNumber,
      });
    } catch (error) {
      console.error('Error saving receipt number:', error);
    }
  };

  // Increment Receipt Number in DB
  const incrementReceiptNumber = async () => {
    const currentValue = parseInt(currentReceiptNumberRef.current || receiptNumber || '0', 10);
    const newNumber = (currentValue + 1).toString().padStart(3, '0');
    setReceiptNumber(newNumber);
    currentReceiptNumberRef.current = newNumber;
    await saveReceiptNumberToDB(newNumber);
  };
  

  // Fetch School Logo
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) return;
      setDynamicSchoolCode(code);
      const storedLogo = normalizeLogoSource(localStorage.getItem('schoolLogo'));
      const applyLogo = (data) => {
        const resolvedLogo = normalizeLogoSource(
          data?.logo ||
          data?.authorized_logo ||
          data?.logoPath ||
          data?.schoolLogo ||
          data?.school_logo
        );
        if (resolvedLogo) {
          setDynamicLogoSrc(resolvedLogo);
          localStorage.setItem("schoolLogo", resolvedLogo);
          return true;
        }
        return false;
      };

      try {
        const instituteResponse = await axios.get(
          `https://cleezoclass.com:5000/api/institute?dbName=${encodeURIComponent(code)}`
        );
        const instituteData = instituteResponse.data || {};

        const resolvedSchoolName =
          String(instituteData?.institute_name || "").trim() ||
          String(code).replace(/_/g, " ").trim();
        setSchoolName(resolvedSchoolName);

        if (!applyLogo(instituteData)) {
          const fallbackResponse = await axios.post(
            'https://cleezoclass.com:5000/api/schoollogodynamic',
            { secretecode: code },
            { headers: { 'Content-Type': 'application/json' } }
          );
          if (!applyLogo(fallbackResponse.data || {})) {
            setDynamicLogoSrc(storedLogo || "/default-logo.png");
          }
        }
      } catch (error) {
        try {
          const fallbackResponse = await axios.post(
            'https://cleezoclass.com:5000/api/schoollogodynamic',
            { secretecode: code },
            { headers: { 'Content-Type': 'application/json' } }
          );
          if (!applyLogo(fallbackResponse.data || {})) {
            setDynamicLogoSrc(storedLogo || "/default-logo.png");
          }
        } catch (fallbackError) {
          console.error('Error fetching school logo:', fallbackError.response?.data || fallbackError.message);
          setDynamicLogoSrc(storedLogo || "/default-logo.png");
        }
      }
    };
    fetchSchoolLogo();
  }, []);

  // Initialize School Name
  useEffect(() => {
    const storedSchoolCode = localStorage.getItem('schoolCode');
    if (storedSchoolCode) {
      const parts = storedSchoolCode.split('_');
      const formattedName = parts.slice(1).join(' ').trim();
      setSchoolName(formattedName);
    }
  }, []);

  // Fetch Students
  useEffect(() => {
    const fetchStudents = async () => {
      const schoolCode = localStorage.getItem('schoolCode');
      if (!selectedClass) return;
      try {
        const res = await axios.get(`https://cleezoclass.com:5000/api/studentsName/${selectedClass}?schoolCode=${schoolCode}`);
        const fetchedStudents = Array.isArray(res.data.students) ? res.data.students : [];
        setStudents(fetchedStudents);
        console.log('[GenerateBill] students loaded', {
          selectedClass,
          count: fetchedStudents.length,
          firstStudent: fetchedStudents[0] || null,
        });

        const targetId = state?.studentId ?? selectedStudentId;
        const targetName = normalizeText(state?.studentName || selectedStudent || "");
        const targetClass = normalizeClassLabel(state?.className || selectedClass);
        const targetSection = normalizeText(state?.sectionName || state?.section || "");

        const studentToSelect =
          fetchedStudents.find((s) => String(s.id) === String(targetId)) ||
          fetchedStudents.find((s) => {
            const studentName = normalizeText(s.name || s.studentName || s.StudentName);
            const studentClass = normalizeClassLabel(
              s.class_name || s.className || s.class || s.FeeClass || selectedClass
            );
            const studentSection = normalizeText(s.section || s.sectionName || s.Section || "");

            const matchesName = !targetName || studentName === targetName;
            const matchesClass = !targetClass || normalizeClassLabel(studentClass) === targetClass;
            const matchesSection = !targetSection || studentSection === targetSection;

            return matchesName && matchesClass && matchesSection;
          }) ||
          fetchedStudents[0];

        if (studentToSelect) {
          setSelectedStudentId(studentToSelect.id);
          setSelectedStudent(studentToSelect.name || studentToSelect.studentName || studentToSelect.StudentName || "");
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchStudents();
  }, [selectedClass, selectedStudentId, selectedStudent, state?.studentId, state?.studentName, state?.className, state?.sectionName, state?.section]);

  const dynamicFeeKeys = useMemo(() => {
    const source = {
      ...(feeStructure || {}),
      ...(payments || {}),
    };
    return Object.keys(source).filter(isDynamicFeeKey);
  }, [feeStructure, payments]);



  useEffect(() => {
  console.log(
    "POPUP DATA RECEIVED:==============================================",
    JSON.stringify(popupData, null, 2)
  );
}, [popupData]);
const totalPaidNow = paidFees.reduce(
  (sum, fee) => sum + Number(fee.paidThisTransaction || 0),
  0
);
const receiptCashAmount = Number(popupData?.cashAmount || popupData?.paymentSplit?.cash || 0);
const receiptOnlineAmount = Number(popupData?.onlineAmount || popupData?.paymentSplit?.online || 0);
const hasCashOnlineBreakdown =
  paymentMode === "Cash+Online" && (receiptCashAmount > 0 || receiptOnlineAmount > 0);
  // Fetch Fee Structure and Payment History
useEffect(() => {
  console.log("useEffect triggered for selectedStudentId:", selectedStudentId);

  if (!selectedStudentId) {
    console.log("No student selected, exiting useEffect.");
    return;
  }

  const selected = students.find(s => String(s.id) === String(selectedStudentId));
  console.log("Selected student object:", selected);

  if (!selected) {
    const fallbackTargetName = normalizeText(state?.studentName || selectedStudent || "");
    const fallbackTargetClass = normalizeClassLabel(state?.className || selectedClass);
    const fallbackTargetSection = normalizeText(state?.sectionName || state?.section || "");
    const fallbackSelected = students.find((s) => {
      const studentName = normalizeText(s.name || s.studentName || s.StudentName);
      const studentClass = normalizeClassLabel(s.class_name || s.className || s.class || s.FeeClass || selectedClass);
      const studentSection = normalizeText(s.section || s.sectionName || s.Section || "");

      const matchesName = !fallbackTargetName || studentName === fallbackTargetName;
      const matchesClass = !fallbackTargetClass || normalizeClassLabel(studentClass) === fallbackTargetClass;
      const matchesSection = !fallbackTargetSection || studentSection === fallbackTargetSection;

      return matchesName && matchesClass && matchesSection;
    });

    if (!fallbackSelected) {
      console.log("Student not found in students list.");
      return;
    }

    setSelectedStudentId(fallbackSelected.id);
    setSelectedStudent(fallbackSelected.name || fallbackSelected.studentName || fallbackSelected.StudentName || "");
    return;
  }

  setStudentData({
    name: selected.name,
    fatherName: selected.fatherName || '-',
    class: selectedClass,
    section: selected.section || 'A',
    rollNumber: selected.id.toString(),
    billType: 'full-package'
  });
  console.log("Student data set:", {
    name: selected.name,
    fatherName: selected.fatherName || '-',
    class: selectedClass,
    section: selected.section || 'A',
    rollNumber: selected.id.toString(),
    billType: 'full-package'
  });

  const schoolCode = localStorage.getItem('schoolCode');
  console.log("School code from localStorage:", schoolCode);

  Promise.all([
    axios.get(`https://cleezoclass.com:5000/api/feeStructure/${selectedClass}?schoolCode=${schoolCode}`),
    axios.get(`https://cleezoclass.com:5000/api/payment/${selectedStudentId}?schoolCode=${schoolCode}`),
  ])
    .then(([feeRes, paymentRes]) => {
      console.log("Fee structure response:", feeRes.data);
      if (feeRes.data?.feeStructure) {
        setFeeStructure(feeRes.data.feeStructure);
        console.log("Fee structure set:", feeRes.data.feeStructure);
      }

      console.log("Payment history response:", paymentRes.data);
      const paymentData = paymentRes.data.payments || {};
      const resolvedFeeStructure = feeRes.data?.feeStructure || {};
      setPayments(paymentData);
      console.log("Payments set:", paymentData);

      const discounts = paymentData.discounts || {};
      setBookDiscount(parseFloat(discounts.feeDiscount || 0));
      setTuitionDiscount(parseFloat(discounts.tuitionDiscount || 0));
      setBusDiscount(parseFloat(discounts.busDiscount || 0));
      console.log("Discounts applied:", discounts);

      const completeFeeOriginal = getFirstPositiveNumber(
        paymentData.completeFee,
        paymentData.CompleteFee,
        resolvedFeeStructure.CompleteFee
      );
      const examFeeOriginal = getFirstPositiveNumber(
        paymentData.examFee,
        paymentData.Exam_fees,
        resolvedFeeStructure.examFee,
        resolvedFeeStructure.Exam_fees
      );
      const busFeeOriginal = getFirstPositiveNumber(
        paymentData.busFee,
        paymentData.Bus_fees,
        resolvedFeeStructure.busFee,
        resolvedFeeStructure.Bus_fees
      );
      const bookFeeOriginal = getFirstPositiveNumber(
        paymentData.bookFee,
        paymentData.Book_Fees,
        resolvedFeeStructure.bookFee,
        resolvedFeeStructure.Book_Fees
      );
      const uniformFeeOriginal = getFirstPositiveNumber(
        paymentData.uniformFee,
        paymentData.Uniform_fees,
        resolvedFeeStructure.uniformFee,
        resolvedFeeStructure.Uniform_fees
      );
      const othersFeeOriginal = getFirstPositiveNumber(
        paymentData.othersFee,
        paymentData.Others,
        resolvedFeeStructure.othersFee,
        resolvedFeeStructure.Others
      );
      const admissionFeeOriginal = getFirstPositiveNumber(
        paymentData.admissionFee,
        paymentData.Admission_fees,
        resolvedFeeStructure.admissionFee,
        resolvedFeeStructure.Admission_fees
      );
      const residentialFeeOriginal = getFirstPositiveNumber(
        paymentData.residentialFee,
        paymentData.ResidentialCompleteFee,
        resolvedFeeStructure.residentialFee,
        resolvedFeeStructure.ResidentialCompleteFee
      );
      const customFeeColumns = getDynamicFeeKeysFromSource({
        ...resolvedFeeStructure,
        ...paymentData,
      }).filter((key) => !key.toLowerCase().endsWith("date"));
      console.log("[GenerateBill] dynamic fee keys from merged source", customFeeColumns);
      console.log("[GenerateBill] custom fee columns", customFeeColumns);
      const customFeeTotal = customFeeColumns.reduce((sum, key) => {
        const value = parseFloat(paymentData?.[key] ?? resolvedFeeStructure?.[key] ?? 0) || 0;
        return sum + value;
      }, 0);
      console.log("[GenerateBill] custom fee total", customFeeTotal);

      console.log("Original fees:", {
        completeFeeOriginal, examFeeOriginal, busFeeOriginal, bookFeeOriginal,
        uniformFeeOriginal, othersFeeOriginal, admissionFeeOriginal
      });

      const sumOtherFees =
        examFeeOriginal +
        bookFeeOriginal +
        uniformFeeOriginal +
        othersFeeOriginal +
        admissionFeeOriginal +
        residentialFeeOriginal +
        customFeeTotal;
      const baseTuitionFee =
        parseFloat(paymentData.Tuition_Fee) ||
        parseFloat(paymentData.Calculated_Tuition_Fee) ||
        parseFloat(resolvedFeeStructure?.Tuition_Fee) ||
        parseFloat(resolvedFeeStructure?.Calculated_Tuition_Fee) ||
        Math.max(0, completeFeeOriginal - sumOtherFees);
      const discountedTuitionFeeDue = Math.max(0, baseTuitionFee);
      const discountedBusFeeDue = Math.max(0, busFeeOriginal - (discounts.busDiscount || 0));
      const discountedBookFeeDue = Math.max(0, bookFeeOriginal - (discounts.feeDiscount || 0));

      const totalAmountAfterDiscount = discountedTuitionFeeDue + admissionFeeOriginal + examFeeOriginal + discountedBusFeeDue + discountedBookFeeDue + uniformFeeOriginal + othersFeeOriginal + residentialFeeOriginal + customFeeTotal;
      console.log("Total amount after discount:", totalAmountAfterDiscount);

      const examPaid = parseFloat(paymentData.examPaid) || 0;
      const busPaid = parseFloat(paymentData.busPaid) || 0;
      const bookPaid = parseFloat(paymentData.bookPaid) || 0;
      const uniformPaid = parseFloat(paymentData.uniformPaid) || 0;
      const othersPaid = parseFloat(paymentData.othersPaid) || 0;
      const generalPaid = parseFloat(paymentData.paidAmount) || 0;
      const tuitionPaid = generalPaid;
      const admissionPaid = parseFloat(paymentData.admissionPaid) || 0;
      const residentialPaid = parseFloat(paymentData.residentialPaid) || 0;
      const dynamicFeePaidTotal = customFeeColumns.reduce((sum, key) => {
        const paidValue = parseFloat(paymentData?.[`${key}_paid`] ?? 0) || 0;
        return sum + paidValue;
      }, 0);
      console.log("[GenerateBill] custom fee paid total", dynamicFeePaidTotal);

      setTuitionPaid(tuitionPaid);
      setAdmissionPaid(admissionPaid);

      const totalPaid = generalPaid + examPaid + busPaid + bookPaid + uniformPaid + othersPaid + admissionPaid + residentialPaid + dynamicFeePaidTotal;
      const totalAmountWithResidential = totalAmountAfterDiscount + residentialFeeOriginal;
      const remainingAmount = Math.max(0, totalAmountWithResidential - totalPaid);

      console.log("Payments breakdown:", {
        totalPaid, remainingAmount, tuitionPaid, admissionPaid,
        examPaid, busPaid, bookPaid, uniformPaid, othersPaid
      });

      setTotalAmount(totalAmountWithResidential);
      setPaidAmount(totalPaid);
      setRemainingAmount(remainingAmount);
      setTuitionFee(baseTuitionFee);
      setExamFee(examFeeOriginal);
      setBusFee(busFeeOriginal);
      setBookFee(bookFeeOriginal);
      setUniformFee(uniformFeeOriginal);
      setOthersFee(othersFeeOriginal);
      setExamPaid(examPaid);
      setBusPaid(busPaid);
      setBookPaid(bookPaid);
      setUniformPaid(uniformPaid);
      setOthersPaid(othersPaid);
      setAdmissionFee(admissionFeeOriginal);
      setResidentialFee(residentialFeeOriginal);
      setResidentialPaid(residentialPaid);

      console.log("[GenerateBill] fee states updated successfully", {
        baseTuitionFee,
        totalAmountAfterDiscount,
        totalAmountWithResidential,
        totalPaid,
        remainingAmount,
      });
    })
    .catch(err => console.error("Error fetching fee structure/payment history:", err));

}, [selectedStudentId, students, selectedClass]);

  const popupCustomFeeRows = (popupData?.customFees || [])
    .map((fee) => ({
      label: fee?.label || fee?.key || "Custom Fee",
      data: {
        paidThisTransaction: Number(fee?.paidThisTransaction) || 0,
      },
      description: fee?.description || "",
    }))
    .filter((item) => item.data.paidThisTransaction > 0);

  const popupCustomFeePaidTotal = popupCustomFeeRows.reduce(
    (sum, item) => sum + (Number(item.data?.paidThisTransaction) || 0),
    0
  );

  const currentPaidAmount =
    Number(popupData?.paidAmount) ||
    (popupData?.fees?.tuition?.paidThisTransaction || 0) +
      (popupData?.fees?.admission?.paidThisTransaction || 0) +
      (popupData?.fees?.exam?.paidThisTransaction || 0) +
      (popupData?.fees?.bus?.paidThisTransaction || 0) +
      (popupData?.fees?.book?.paidThisTransaction || 0) +
      (popupData?.fees?.uniform?.paidThisTransaction || 0) +
      (popupData?.fees?.others?.paidThisTransaction || 0) +
      (popupData?.fees?.residential?.paidThisTransaction || 0) +
      console.log("=== CURRENT PAID AMOUNT DEBUG ===");
console.log("popupData?.paidAmount:", popupData?.paidAmount);

console.log("tuition paidThisTransaction:", popupData?.fees?.tuition?.paidThisTransaction || 0);
console.log("admission paidThisTransaction:", popupData?.fees?.admission?.paidThisTransaction || 0);
console.log("exam paidThisTransaction:", popupData?.fees?.exam?.paidThisTransaction || 0);
console.log("bus paidThisTransaction:", popupData?.fees?.bus?.paidThisTransaction || 0);
console.log("book paidThisTransaction:", popupData?.fees?.book?.paidThisTransaction || 0);
console.log("uniform paidThisTransaction:", popupData?.fees?.uniform?.paidThisTransaction || 0);
console.log("others paidThisTransaction:", popupData?.fees?.others?.paidThisTransaction || 0);
console.log("residential paidThisTransaction:", popupData?.fees?.residential?.paidThisTransaction || 0);

console.log("popupCustomFeePaidTotal:", popupCustomFeePaidTotal);

console.log("currentPaidAmount:", currentPaidAmount);

console.log("Full popupData:", popupData);
console.log("================================");
      popupCustomFeePaidTotal;

  // Toggle Edit Mode
  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditableBill(null);
    } else {
      setIsEditing(true);
      setEditableBill({
        receiptNumber: currentReceiptNumberRef.current,
        studentData: {
          name: studentData?.name || '',
          fatherName: studentData?.fatherName || '',
          class: studentData?.class || '',
          section: studentData?.section || '',
          rollNumber: studentData?.rollNumber || '',
        },
        tuitionFee,
        admissionFee,
        examFee,
        busFee,
        bookFee,
        uniformFee,
        othersFee,
        tuitionPaid,
        admissionPaid,
        examPaid,
        busPaid,
        bookPaid,
        uniformPaid,
        othersPaid,
        tuitionDiscount,
        busDiscount,
        bookDiscount,
        paymentMode,
        paymentDate: paymentDate || (payments?.created_at || new Date()),
        schoolName,
        totalAmount: editedTotalDue ?? remainingAmount1(),
        paidAmount,
        remainingAmount,
      });
    }
  };

  // Handle Edit Change
  const handleEditChange = (field, value) => {
    if (field === 'totalDue') {
      setEditedTotalDue(parseFloat(value) || 0);
    }
    if (field === 'receiptNumber') {
      currentReceiptNumberRef.current = value;
    }

    setEditableBill(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  };

const saveEditedBill = async (e) => {
  if (e?.preventDefault) e.preventDefault();

  if (!editableBill) return;

  setTuitionPaid(parseFloat(editableBill.tuitionPaid) || 0);
  setAdmissionPaid(parseFloat(editableBill.admissionPaid) || 0);
  setExamPaid(parseFloat(editableBill.examPaid) || 0);
  setBusPaid(parseFloat(editableBill.busPaid) || 0);
  setBookPaid(parseFloat(editableBill.bookPaid) || 0);
  setUniformPaid(parseFloat(editableBill.uniformPaid) || 0);
  setOthersPaid(parseFloat(editableBill.othersPaid) || 0);
  setPaymentMode(editableBill.paymentMode || paymentMode || 'Cash');
  setPaymentDate(editableBill.paymentDate || paymentDate);

  if (editableBill.receiptNumber) {
    setReceiptNumber(editableBill.receiptNumber);
    currentReceiptNumberRef.current = editableBill.receiptNumber;
  }

  if (editableBill.studentData?.name) {
    setStudentData(editableBill.studentData);
  }

  setIsEditing(false);
  setSuccessMessage('Bill values updated. Image save disabled.');
  setShowSuccessModal(true);
};




  // Download and increment
const handleDownloadWithSave = async () => {
    await generatePDF(currentReceiptNumberRef.current);
    if (!paymentReceiptNumber) {
      await incrementReceiptNumber(); // Increment only for standalone bill flow
    }
  };

  // Generate PDF
const generatePDF = async (currentReceiptNumber) => {
  if (!studentData?.name || !currentReceiptNumber) {
    alert('Please select a student and set a receipt number before generating PDF.');
    return;
  }

  const receiptDiv = document.createElement('div');
  receiptDiv.id = 'temp-receipt-for-pdf';
  receiptDiv.style.width = '300px';
  receiptDiv.style.padding = '10px';
  receiptDiv.style.margin = '0 auto';
  receiptDiv.style.backgroundColor = 'white';
  receiptDiv.style.color = 'black';
  receiptDiv.style.fontWeight = 'bold';
  receiptDiv.style.lineHeight = '1.3';
  receiptDiv.style.transform = 'translateZ(0)';
  receiptDiv.style.webkitFontSmoothing = 'antialiased';
  receiptDiv.style.position = 'relative';
  document.body.appendChild(receiptDiv);

  const tuitionFeeDue = Math.max(0, tuitionFee);
  const busFeeDue = Math.max(0, busFee - busDiscount);
  const bookFeeDue = Math.max(0, bookFee - bookDiscount);
const dynamicFeeDueTotal =
  dynamicFeeRows.reduce(
    (sum, row) => sum + Math.max((row.total || 0) - (row.paid || 0), 0),
    0
  );
  const dynamicFeePaidTotal = dynamicFeeRows.reduce((sum, row) => sum + row.paid, 0);

  const overallTotalDue = editedTotalDue ?? (
    tuitionFeeDue +
    admissionFee +
    examFee +
    busFeeDue +
    bookFeeDue +
    uniformFee +
    othersFee +
    residentialFee +
    dynamicFeeDueTotal
  );

console.log("[GenerateBill][due-breakdown]", {
  studentName: studentData?.name || "",
  staticDueBreakdown: {
    tuitionFeeDue,
    admissionFee,
    examFee,
    busFeeDue,
    bookFeeDue,
    uniformFee,
    othersFee,
    residentialFee,
  },
  dynamicRows: dynamicFeeRows,
  dynamicFeeDueTotal,
  dynamicFeePaidTotal,
  overallTotalDue,
});

  let overallTotalPaid =
  Number(popupData?.paidAmount) ||
  (popupData?.fees?.tuition?.paidThisTransaction > 0 ? tuitionPaid : 0) +
  (popupData?.fees?.admission?.paidThisTransaction > 0 ? admissionPaid : 0) +
  (popupData?.fees?.exam?.paidThisTransaction > 0 ? examPaid : 0) +
  (popupData?.fees?.bus?.paidThisTransaction > 0 ? busPaid : 0) +
  (popupData?.fees?.book?.paidThisTransaction > 0 ? bookPaid : 0) +
  (popupData?.fees?.uniform?.paidThisTransaction > 0 ? uniformPaid : 0) +
  (popupData?.fees?.others?.paidThisTransaction > 0 ? othersPaid : 0) +
  (popupData?.fees?.residential?.paidThisTransaction > 0 ? residentialPaid : 0) +
  dynamicFeePaidTotal;

console.log("overallTotalPaid =", overallTotalPaid);
console.log("================================");

  console.log("[GenerateBill][paid-breakdown]", {
    popupPaidAmount: Number(popupData?.paidAmount) || 0,
    tuitionPaid,
    admissionPaid,
    examPaid,
    busPaid,
    bookPaid,
    uniformPaid,
    othersPaid,
    residentialPaid,
    dynamicFeePaidTotal,
    overallTotalPaid,
    note: "If popupData.paidAmount already includes dynamic fee payments, adding dynamicFeePaidTotal again will double count.",
  });
  const dynamicFeeReceiptHtml = dynamicFeeRows
    .map(
      (row) => `
        <tr>
          <td style="border: 1px solid black; padding: 2px; font-size: 8px;">${row.label}</td>
          <td style="border: 1px solid black; padding: 2px; text-align: right; font-size: 8px;">₹${row.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="border: 1px solid black; padding: 2px; text-align: right; font-size: 8px; color: green;">₹${row.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="border: 1px solid black; padding: 2px; text-align: right; font-size: 8px;">₹${row.paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="border: 1px solid black; padding: 2px; text-align: right; font-size: 8px;">₹${row.due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `
    )
    .join('');

  try {
const previewElement = document.getElementById("bill-preview-content");

if (!previewElement) {
  alert("Preview not found");
  return;
}

const clone = previewElement.cloneNode(true);

receiptDiv.innerHTML = "";
receiptDiv.appendChild(clone);
const resolvedSchoolLogo = dynamicLogoSrc || getStoredSchoolLogo() || "/default-logo.png";
    const watermark = document.createElement('img');
    watermark.src = resolvedSchoolLogo;
    watermark.style.position = 'absolute';
    watermark.style.top = '50%';
    watermark.style.left = '50%';
    watermark.style.transform = 'translate(-50%, -50%)';
    watermark.style.width = '150px';
    watermark.style.height = '150px';
    watermark.style.opacity = '0.1';
    watermark.style.zIndex = '100';
    watermark.style.pointerEvents = 'none';
    receiptDiv.appendChild(watermark);
    const pdf = new jsPDF({ unit: 'mm', format: [80, 200] });
const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      letterRendering: true
    });
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Fee_Receipt_${currentReceiptNumber}.pdf`);

    const billData = {
      receiptNumber: currentReceiptNumber,
      studentData,
      tuitionFee,
      tuitionPaid,
      admissionFee,
      admissionPaid,
      residentialFee,
      residentialPaid,
      examFee,
      examPaid,
      busFee,
      busPaid,
      bookFee,
      bookPaid,
      uniformFee,
      uniformPaid,
      othersFee,
      othersPaid,
      totalAmount: overallTotalDue,
      paidAmount: overallTotalPaid,
      finalAmount: Math.max(overallTotalDue - overallTotalPaid, 0),
      paymentMode,
      currentDate: paymentDate || (payments?.created_at || new Date()),
      academicYear: getAcademicYear(),
      amountInWords: convertAmountToWords(overallTotalPaid),
      schoolName,
      discounts: { tuitionDiscount, busDiscount, bookDiscount }
    };
    const updatedBills = [...generatedBills, billData];
    setGeneratedBills(updatedBills);
    localStorage.setItem('generatedBills', JSON.stringify(updatedBills));

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  } finally {
    if (document.body.contains(receiptDiv)) {
      document.body.removeChild(receiptDiv);
    }
  }
};


const confirmPrint = async (copies) => {
  setShowPrintDialog(false);
  const receiptNumberToUse = isEditing ? editableBill?.receiptNumber : currentReceiptNumberRef.current;
  const resolvedSchoolLogo = dynamicLogoSrc || getStoredSchoolLogo() || "/default-logo.png";

  const overallTotalDue = editedTotalDue ?? (
    tuitionFeeDue +
    admissionFee +
    residentialFee +
    examFee +
    busFeeDue +
    bookFeeDue +
    uniformFee +
    othersFee +
    dynamicFeeRows.reduce((sum, row) => sum + row.due, 0)
  );

const overallTotalPaid = Number(popupData?.paidAmount || 0);

  const remainingAmount = Math.max(overallTotalDue - overallTotalPaid, 0);

  const printData = {
    receiptNumber: receiptNumberToUse,
    studentData,
    tuitionFee: tuitionFeeDue,
    admissionFee,
    residentialFee,
    examFee,
    busFee: busFeeDue,
    bookFee: bookFeeDue,
    uniformFee,
    othersFee,
    tuitionPaid,
    admissionPaid,
    residentialPaid,
    examPaid,
    busPaid,
    bookPaid,
    uniformPaid,
    othersPaid,
    totalAmount: overallTotalDue,
    paidAmount: overallTotalPaid, // This is the total paid amount
    currentPaidAmount: overallTotalPaid,
    currentPaidInWords: convertAmountToWords(overallTotalPaid),
    remainingAmount,
    paymentMode,
    transactionId: receiptTransactionId,
      currentDate: paymentDate || (payments?.created_at || new Date()),
      academicYear: getAcademicYear(),
      schoolName,
      logoUrl: resolvedSchoolLogo,
      popupData,
      dynamicFeeRows,
      discounts: {
        tuitionDiscount,
        busDiscount,
        bookDiscount,
    },
  };

  let billsToPrint = [];
  if (copies === 1) {
    billsToPrint = [{ ...printData }];
  } else if (copies === 2) {
    billsToPrint = [{ ...printData }];
  }

  printPendingBills(billsToPrint);
  if (!paymentReceiptNumber) {
    await incrementReceiptNumber(); // Increment only for standalone bill flow
  }
};


const printPendingBills = (billsToPrint) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups for printing.");
    return;
  }

  const previewElement = document.getElementById("bill-preview-content");
  if (!previewElement) {
    printWindow.close();
    return;
  }

  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>


<style>

@page{
    size:Letter;
    margin:12mm;
}

body{
    margin:0;
    padding:0;
    font-family:Arial,sans-serif;
}

.receipt-copy{
    position: relative;
    overflow: hidden;
}

.receipt-copy img[alt="Watermark"]{
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 180px !important;
    height: 180px !important;
    opacity: 0.08 !important;
    z-index: 0 !important;
}

.receipt-copy > div,
.receipt-copy table,
.receipt-copy p,
.receipt-copy h1,
.receipt-copy h4{
    position: relative;
    z-index: 1;
}

.receipt-divider{
    margin:20px 0;
    border-top:3px dashed #000;
    position:relative;
}

.receipt-divider::after{
    content:"✂ Cut Here";
    position:absolute;
    left:50%;
    transform:translateX(-50%);
    top:-12px;
    background:#fff;
    padding:0 10px;
    font-size:14px;
    font-weight:bold;
}

/* Keep table formatting */
table{
    width:100%;
    border-collapse:collapse;
}

thead{
    display:table-header-group;
}

tbody{
    display:table-row-group;
}

tr{
    page-break-inside:avoid;
    break-inside:avoid;
}

.page-break{
    page-break-before:always;
}

/* Slightly increase text only */
.receipt-copy td,
.receipt-copy th,
.receipt-copy p,
.receipt-copy span,
.receipt-copy div,
.receipt-copy label,
.receipt-copy strong{
    font-size:12px !important;
}

.receipt-copy h1{
    font-size:22px !important;
}

.receipt-copy h4{
    font-size:15px !important;
}

</style>

</head>

<body>

<div id="schoolCopy" class="receipt-copy">
    <div class="receipt-title">School Copy</div>
    ${previewElement.innerHTML}
</div>

<div id="divider" class="receipt-divider"></div>

<div id="parentCopy" class="receipt-copy">
    <div class="receipt-title">Student / Parent Copy</div>
    ${previewElement.innerHTML}
</div>

</body>
</html>
`);

  printWindow.document.close();
  setTimeout(() => {
    const schoolCopy = printWindow.document.getElementById("schoolCopy");
    const parentCopy = printWindow.document.getElementById("parentCopy");
    const divider = printWindow.document.getElementById("divider");

    if (!schoolCopy || !parentCopy || !divider) {
      printWindow.close();
      return;
    }

    // Approximate printable height of a Letter page after margins
    const pageHeight = 980;

    // Total content height (School + Divider + Parent)
    const totalHeight =
      schoolCopy.scrollHeight +
      divider.offsetHeight +
      parentCopy.scrollHeight;

    // Move to page 2 only if BOTH copies don't fit
    if (totalHeight > pageHeight) {
      parentCopy.classList.add("page-break");
      divider.style.display = "none";
    }

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 500);
};



  // Format Date
  const formatDate1 = (dateInput) => {
    if (!dateInput) return '';
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Date formatting error:', e);
      return '';
    }
  };

  // Get Current Date
  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get Academic Year
  const getAcademicYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };

  // Convert Amount to Words
  const convertAmountToWords = (num) => {
    if (isNaN(num)) return 'Invalid amount';
    if (num === 0) return 'Zero Rupees Only';
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const denominations = ['', 'Thousand', 'Lakh', 'Crore'];
    const getWords = (n) => {
      let word = '';
      if (n > 99) {
        word += single[Math.floor(n / 100)] + ' Hundred ';
        n = n % 100;
      }
      if (n > 19) {
        word += tens[Math.floor(n / 10)] + ' ';
        word += single[n % 10] + ' ';
      } else if (n >= 10) {
        word += double[n - 10] + ' ';
      } else if (n > 0) {
        word += single[n] + ' ';
      }
      return word.trim();
    };
    let rupees = Math.floor(num);
    let paise = Math.round((num - rupees) * 100);
    let str = '';
    const parts = [];
    const units = [
      rupees % 1000,
      Math.floor((rupees % 100000) / 1000),
      Math.floor((rupees % 10000000) / 100000),
      Math.floor(rupees / 10000000)
    ];
    for (let i = units.length - 1; i >= 0; i--) {
      if (units[i] !== 0) {
        parts.push(getWords(units[i]) + (denominations[i] ? ' ' + denominations[i] : ''));
      }
    }
    if (parts.length > 0) {
      str += parts.join(' ') + ' Rupees';
    }
    if (paise > 0) {
      str += (str ? ' and ' : '') + getWords(paise) + ' Paise';
    }
    return str.trim() + ' Only';
  };

  // Handle Print
  const handlePrint = () => {
    if (!initialReceiptSet) {
      alert('Please wait for the receipt number to be set');
      return;
    }
    setShowPrintDialog(true);
  };

  // Preview Options
  const previewOptions = [
    { value: 1, label: 'Preview: 1 Copy' },
    { value: 2, label: 'Preview: 2 Copies' },
    { value: 4, label: 'Preview: 4 Copies' },
    { value: 6, label: 'Preview: 6 Copies' }
  ];

  // Get Preview Display Name
  const getPreviewDisplayName = (mode) => {
    return previewOptions.find(option => option.value === mode)?.label || 'Preview: 1 Copy';
  };

  // Other Fees
  const otherFees = [
    { key: 'exam', label: 'Exam Fee', amount: examFee, paid: examPaid, discount: 0 },
    { key: 'bus', label: 'Bus Fee', amount: busFee, paid: busPaid, discount: busDiscount },
    { key: 'book', label: 'Book Fee', amount: bookFee, paid: bookPaid, discount: bookDiscount },
    { key: 'uniform', label: 'Uniform Fee', amount: uniformFee, paid: uniformPaid, discount: 0 },
    { key: 'others', label: 'Other Fees', amount: othersFee, paid: othersPaid, discount: 0, description: popupData?.fees?.others?.description || "" }
  ];

  // Get Paid Amount for Fee
  const getPaidAmountForFee = (key) => {
    const fee = otherFees.find(f => f.key === key);
    return fee ? (fee.paid || 0) : 0;
  };

  // Calculate Totals for Display
  const tuitionFeeDue = Math.max(0, tuitionFee);
  const busFeeDue = Math.max(0, busFee - busDiscount);
  const bookFeeDue = Math.max(0, bookFee - bookDiscount);

  let grandTotalDue = 0;
  let grandTotalPaid = 0;
  if (popupData?.fees?.tuition?.paidThisTransaction > 0) {
    grandTotalDue += tuitionFeeDue;
    grandTotalPaid += tuitionPaid;
  }
  if (popupData?.fees?.admission?.paidThisTransaction > 0) {
    grandTotalDue += admissionFee;
    grandTotalPaid += admissionPaid;
  }
  if (popupData?.fees?.exam?.paidThisTransaction > 0) {
    grandTotalDue += examFee;
    grandTotalPaid += examPaid;
  }
  if (popupData?.fees?.bus?.paidThisTransaction > 0) {
    grandTotalDue += busFeeDue;
    grandTotalPaid += busPaid;
  }
  if (popupData?.fees?.book?.paidThisTransaction > 0) {
    grandTotalDue += bookFeeDue;
    grandTotalPaid += bookPaid;
  }
  if (popupData?.fees?.uniform?.paidThisTransaction > 0) {
    grandTotalDue += uniformFee;
    grandTotalPaid += uniformPaid;
  }
  if (popupData?.fees?.others?.paidThisTransaction > 0) {
    grandTotalDue += othersFee;
    grandTotalPaid += othersPaid;
  }
  if (popupData?.fees?.residential?.paidThisTransaction > 0) {
    grandTotalDue += residentialFee;
    grandTotalPaid += residentialPaid;
  }
  const renderDynamicFeeDueTotal = dynamicFeeRows.reduce((sum, row) => sum + row.due, 0);
  const renderDynamicFeePaidTotal = dynamicFeeRows.reduce((sum, row) => sum + row.paid, 0);

  const authorisedName = localStorage.getItem("name");

  const overallTotalDue =
    (tuitionFeeDue) +
    admissionFee +
    residentialFee +
    examFee +
    busFeeDue +
    bookFeeDue +
    uniformFee +
    othersFee +
    renderDynamicFeeDueTotal;
const overallTotalPaid = Number(popupData?.paidAmount || 0);

  const remainingAmount1 = () => {
    const overallTotalDue =
      (tuitionFeeDue - (tuitionDiscount || 0)) +
      admissionFee +
      residentialFee +
      examFee +
      busFeeDue +
      bookFeeDue +
      uniformFee +
      othersFee +
      renderDynamicFeeDueTotal;

    const overallTotalPaid =
      Number(popupData?.paidAmount) ||
      tuitionPaid +
        admissionPaid +
        residentialPaid +
        examPaid +
        busPaid +
        bookPaid +
        uniformPaid +
        othersPaid +
        renderDynamicFeePaidTotal;

    return Math.max(overallTotalDue - overallTotalPaid, 0);
  };

  const otherDescription = (popupData?.fees?.others?.description || "").trim();
  
  const feeRows = (popupData?.paidFees || []).map((fee) => ({
    label: fee.label || fee.key || "Fee",
    data: {
      paidThisTransaction: Number(fee.paidThisTransaction) || 0,
    },
    description: fee.description || "",
    installmentId: fee.installmentId || null,
  })).filter(item => item.data.paidThisTransaction > 0);
  const receiptRows = paidFees.map((fee) => {
    const label = fee.label || fee.key || "Fee";
    const key = String(fee.key || label || "").toLowerCase();
    const staticTotals = {
      tuition: tuitionFeeDue,
      admission: admissionFee,
      exam: examFee,
      bus: busFeeDue,
      book: bookFeeDue,
      books: bookFeeDue,
      uniform: uniformFee,
      other: othersFee,
      others: othersFee,
      residential: residentialFee,
    };
    const staticTotal = staticTotals[key] ?? staticTotals[label.toLowerCase().replace(/\s+fee$/i, "")];
    const dynamicMatch = dynamicFeeRows.find((row) => {
      const rowLabel = String(row.label || "").toLowerCase();
      const rowKey = String(row.key || "").toLowerCase();
      return rowLabel === String(label).toLowerCase() || rowKey === key;
    });
    // Prefer the first source that actually has a positive total instead of
    // stopping at staticTotal when it happens to be 0 (e.g. bus/book fee
    // whose "due" value can compute to 0 after discount) — that was masking
    // valid totals coming from dynamicMatch or the payment record itself.
    const total = [staticTotal, dynamicMatch?.total, fee.total]
      .map((v) => Number(v) || 0)
      .find((v) => v > 0) || 0;
    const paidNow = Number(fee.paidThisTransaction || 0);
    const totalPaid = Number(fee.totalPaid || dynamicMatch?.paid || paidNow);
    return {
      label,
      total,
      paidNow,
      totalPaid,
      balance: Math.max(total - totalPaid, 0),
      description: fee.description || "",
      installmentId: fee.installmentId || null,
    };
  }).filter((row) => row.total > 0 || row.paidNow > 0);
  const seenFeeTypesForTotal = new Set();
  const receiptTotalAmount = receiptRows.reduce((sum, row) => {
    const feeTypeKey = String(row.label || "").trim().toLowerCase();
    if (seenFeeTypesForTotal.has(feeTypeKey)) {
      // Same fee type already counted (e.g. another installment row) - don't add its total again.
      return sum;
    }
    seenFeeTypesForTotal.add(feeTypeKey);
    return sum + row.total;
  }, 0);
  const receiptPaidNowTotal = receiptRows.reduce((sum, row) => sum + row.paidNow, 0);
  const receiptTotalPaidAmount = receiptRows.reduce((sum, row) => sum + row.totalPaid, 0);
  const receiptBalanceAmount = receiptRows.reduce((sum, row) => sum + row.balance, 0);
  return (
    <div style={{ minHeight: '100vh', padding: '1rem', backgroundColor: 'white' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="btn-group-FeesManagement">
              <label style={{ marginBottom: "0.2rem", fontWeight: "100", fontSize: "12px", display: "block" }}>Class</label>
              <div className="btn-dropdown-FeesManagement" style={{ backgroundColor: "#f3f3f3", padding: "5px", borderRadius: "5px", width: "200px" }}>
                {selectedClass || "N/A"}
              </div>
            </div>
            <div className="btn-group-FeesManagement">
              <label style={{ marginBottom: "0.2rem", fontWeight: "100", fontSize: "12px", display: "block" }}>Student</label>
              <div className="btn-dropdown-FeesManagement" style={{ backgroundColor: "#f3f3f3", padding: "5px", borderRadius: "5px", width: "200px" }}>
                {selectedStudent || "N/A"}
              </div>
            </div>
         
            <div className="btn-group-FeesManagement">
              <label style={{ marginBottom: "0.2rem", fontWeight: "100", fontSize: "12px", display: "block" }}>Payment Date</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #ccc', width: '120px' }} />
            </div>
          </div>
        </div>
        {initialReceiptSet && (
          <div id="bill-preview-wrapper" style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827' }}>Preview</h2>
              {studentData?.name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowPreviewDropdown(prev => !prev)} className="actionBtnStyle" style={{ minWidth: '150px' }}>
                      {getPreviewDisplayName(previewMode)}
                    </button>
                    {showPreviewDropdown && (
                      <div style={{ position: 'absolute', right: 0, marginTop: '5px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.375rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', zIndex: 10 }}>
                        {previewOptions.map(option => (
                          <div key={option.value} onClick={() => { setPreviewMode(option.value); setShowPreviewDropdown(false); }} style={{ padding: '0.5rem 1rem', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>
                            {option.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={toggleEditMode} className="actionBtnStyle" style={{ backgroundColor: isEditing ? '#dc2626' : 'transparent' }}>
                    {isEditing ? <X style={{ width: '1rem', height: '1rem' }} /> : <Edit style={{ width: '1rem', height: '1rem' }} />}
                  </button>
                  {isEditing && (
                    <button onClick={saveEditedBill} className="actionBtnStyle">
                      <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} /> Save
                    </button>
                  )}
                  <button onClick={handleDownloadWithSave} className="actionBtnStyle">
                    <Download style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} /> Download
                  </button>
                  <button onClick={handlePrint} className="actionBtnStyle">
                    <Printer style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} /> Print
                  </button>
                </div>
              )}
            </div>
            <div id="bill-preview-content" style={{ display: 'grid', gridTemplateRows: getGridClass(previewMode).includes('grid-rows-2') ? '1fr 1fr' : '1fr', gridTemplateColumns: getGridClass(previewMode).includes('grid-cols-2') ? '1fr 1fr' : '1fr', gap: '1rem', justifyContent: 'center', alignItems: 'start', overflow: 'hidden', padding: '5px', minHeight: '180px', position: 'relative' }}>
              {Array.from({ length: previewMode }).map((_, index) => (
                <div key={index} style={{ transform: getScaleClass(previewMode), transformOrigin: 'top center', width: `calc(100% / ${getGridClass(previewMode).includes('grid-cols-2') ? 2 : 1})`, boxSizing: 'border-box', padding: '0 0.5rem' }}>
                  {(dynamicLogoSrc || getStoredSchoolLogo()) && (
                    <img src={dynamicLogoSrc || getStoredSchoolLogo()} alt="Watermark" style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', opacity: 0.3, zIndex: 1, pointerEvents: 'none' }} />
                  )}
                  <div style={{ backgroundColor: '#ffffff', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        <img
                          src={dynamicLogoSrc || getStoredSchoolLogo() || '/default-logo.png'}
                          alt="School Logo"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>

                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <h1 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.1rem' }}>
                          {isEditing ? (
                            <input type="text" value={editableBill?.schoolName || schoolName} onChange={(e) => handleEditChange('schoolName', e.target.value)} style={{ width: '100%', padding: '2px', textAlign: 'center', fontSize: '1rem', fontWeight: '700', border: '1px solid #ccc' , marginTop:"-10px"}} />
                          ) : (
                            schoolName || 'School Name'
                          )}
                        </h1>
                        <div style={{ border: '.5px solid black', margin: '3px 0', padding: '2px 0', fontWeight: 'bold', fontSize: '10px' }}>FEES RECEIPT</div>
                      </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.11rem' }}>
                      <tbody>
                        <tr>
                          <td data-testid="receipt-number" style={{ textAlign: 'left', width: '50%', fontSize: '10px' }}>
                            <strong>Receipt No.</strong>
                            {isEditing ? (
                              <input type="text" value={editableBill?.receiptNumber || ''} onChange={(e) => handleEditChange('receiptNumber', e.target.value)} style={{ width: '100px', padding: '2px', marginLeft: '5px', border: '1px solid #ccc', fontSize: '10px', height: '16px' }} />
                            ) : (
                              ` ${currentReceiptNumberRef.current}`
                            )}
                          </td>
                          <td data-testid="paid-date" style={{ textAlign: 'left', width: '50%', fontSize: '10px' }}>
                            <strong>Paid Date:</strong>
                            {isEditing ? (
                              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} style={{ width: '100px', padding: '2px', marginLeft: '5px', border: '1px solid #ccc', fontSize: '10px', height: '16px' }} />
                            ) : (
                              ` ${paymentDate ? formatDate1(paymentDate) : formatDate1(new Date())}`
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: 'left', fontSize: '10px' }}>
                            <strong>Regn. No.</strong>
                            {isEditing ? (
                              <input type="text" value={studentData?.rollNumber || ''} onChange={(e) => handleEditChange('studentData.rollNumber', e.target.value)} style={{ width: '100px', padding: '1px', marginLeft: '5px', border: '1px solid #ccc', fontSize: '10px', height: '16px' }} disabled />
                            ) : (
                              ` ${studentData?.rollNumber || 'N/A'}`
                            )}
                          </td>
                          <td style={{ textAlign: 'left', fontSize: '10px' }}>
                            <strong>Academic Year:</strong> {getAcademicYear()}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: 'left', fontSize: '10px' }}>
                            <strong>Student Name:</strong>
                            {isEditing ? (
                              <input type="text" value={editableBill?.studentData?.studentName || studentData?.name || ''} onChange={(e) => handleEditChange('studentData.studentName', e.target.value)} style={{ width: '100px', padding: '1px', marginLeft: '5px', border: '1px solid #ccc', fontSize: '10px', height: '16px' }} />
                            ) : (
                              ` ${studentData?.name || 'N/A'}`
                            )}
                          </td>
                          <td style={{ textAlign: 'left', fontSize: '10px' }}>
                            <strong>Father's Name:</strong>
                            {isEditing ? (
                              <input type="text" value={studentData?.fatherName || ''} onChange={(e) => handleEditChange('studentData.fatherName', e.target.value)} style={{ width: '100px', padding: '1px', marginLeft: '5px', border: '1px solid #ccc', fontSize: '10px', height: '16px' }} />
                            ) : (
                              ` ${studentData?.fatherName}`
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: 'left', fontSize: '10px' }}>
                            <strong>Class:</strong>
                            {isEditing ? (
                              <select value={editableBill?.studentData?.class || ''} onChange={(e) => handleEditChange('studentData.class', e.target.value)} style={{ width: '70px', padding: '1px', marginLeft: '5px', border: '1px solid #ccc', fontSize: '10px', height: '18px' }}>
                                {["nursery", "lkg", "ukg", ...Array.from({ length: 10 }, (_, i) => `class${i + 1}`)].map(cls => (
                                  <option key={cls} value={cls}>{cls.toUpperCase()}</option>
                                ))}
                              </select>
                            ) : (
                              ` ${studentData?.class?.toUpperCase()}`
                            )}
                          </td>
                          <td style={{ textAlign: 'left', fontSize: '10px' }}>
                            <strong>Section:</strong>
                            {isEditing ? (
                              <select value={editableBill?.studentData?.section || ''} onChange={(e) => handleEditChange('studentData.section', e.target.value)} style={{ width: '70px', padding: '1px', marginLeft: '5px', border: '1px solid #ccc', fontSize: '10px', height: '18px' }}>
                                {['A', 'B', 'C', 'D'].map(sec => (
                                  <option key={sec} value={sec}>{sec}</option>
                                ))}
                              </select>
                            ) : (
                              ` ${studentData?.section}`
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <h4 style={{ marginTop: "5px", marginBottom: "1px", fontSize: "11px" }}>
                      Fee Receipt Details
                    </h4>

                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        marginBottom: "10px",
                        fontSize: "9px",
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: "#f0f0f0" }}>
                          <th style={{ border: "1px solid #000", padding: "3px", textAlign: "left" }}>S.No</th>
                          <th style={{ border: "1px solid #000", padding: "3px", textAlign: "left" }}>Fee Type</th>
                          <th style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>Total</th>
                          <th style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>Paid Now</th>
                          {/* <th style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>Total Paid</th> */}
                          {/* <th style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>Balance</th> */}
                        </tr>
                      </thead>
                      <tbody>
                        {receiptRows.map((row, index) => (
                          <tr key={`${row.label}-${index}`}>
                            <td style={{ border: "1px solid #000", padding: "3px" }}>{index + 1}</td>
                            <td style={{ border: "1px solid #000", padding: "3px", textAlign: "left" }}>
                              {row.label}
                              {row.installmentId && (
                                <div style={{ fontSize: "8px", color: "#555", display:"inline", marginLeft:"10px" }}>Installment: {row.installmentId}</div>
                              )}
                              {row.description && (
                                <div style={{ fontSize: "8px", color: "#555" }}>{row.description}</div>
                              )}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>
                              ₹{row.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "3px", textAlign: "right", color: "green" }}>
                              ₹{row.paidNow.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            {/* <td style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>
                              ₹{row.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td> */}
                            {/* <td style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>
                              ₹{row.balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td> */}
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: "#f9fafb", fontWeight: "bold" }}>
                          <td colSpan="2" style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>Total</td>
                          <td style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>₹{receiptTotalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ border: "1px solid #000", padding: "3px", textAlign: "right", color: "green" }}>₹{receiptPaidNowTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          {/* <td style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>₹{receiptTotalPaidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> */}
                          {/* <td style={{ border: "1px solid #000", padding: "3px", textAlign: "right" }}>₹{receiptBalanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> */}
                        </tr>
                      </tbody>
                    </table>
<p style={{ fontStyle: 'italic', marginTop: '3px', fontSize: '10px' }}>
  <strong>Paid Amount (in words):</strong>
  {convertAmountToWords(receiptPaidNowTotal)}
</p>
<div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 'bold',  padding: '5px 10px' }}>
  <div style={{ display: 'flex', gap: '20px' }}>
<div>
  Total Paid by Student : ₹
  {receiptPaidNowTotal.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}
</div>
  </div>
</div>
                    <div style={{ marginTop: '10px', fontSize: '11px' }}>
                      <p>
                        <strong>Payment Mode:</strong> {paymentMode || 'Cash/Cheque/Online'}
                      </p>
                      {hasCashOnlineBreakdown && (
                        <div style={{ margin: "4px 0 6px 0" }}>
                          <p style={{ margin: "2px 0" }}>
                            <strong>Cash Paid:</strong> ₹
                            {receiptCashAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p style={{ margin: "2px 0" }}>
                            <strong>Online Paid:</strong> ₹
                            {receiptOnlineAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      )}
                      {(paymentMode === 'Cheque' || paymentMode === 'Online' || paymentMode === 'Cash+Online') && (
                        <>
                          <p>
                            <strong>Cheque/Transaction No.:</strong> {receiptTransactionId || 'N/A'}
                          </p>
                          <p>
                            <strong>Bank Name:</strong> {'----' || 'N/A'}
                          </p>
                        </>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                      <div style={{ borderTop: '1px dashed #000', width: '120px', textAlign: 'center', paddingTop: '5px', fontSize: '10px' }}>Parent's Signature</div>
                      <div style={{ textAlign: 'center', width: '120px' }}>
                        <div style={{ fontSize: '10px', marginBottom: '2px' }}>{authorisedName}</div>
                        <div style={{ borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '10px' }}>Authorised Signature</div>
                      </div>
                    </div>
                    {/* <div style={{ marginTop: '5px', fontSize: '8px', textAlign: 'center' }}>
                      <p>This is a computer generated receipt. No signature required.</p>
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {showPrintDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center', width: '300px' }}>
              <p style={{ marginBottom: '15px', fontWeight: '600' }}>Select number of copies to print:</p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <button onClick={() => confirmPrint(1)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#0a3d62', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '500' }}>1 Copy</button>
              </div>
              <button onClick={() => setShowPrintDialog(false)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
            </div>
          </div>
        )}
        {showSuccessModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
              <p>{successMessage}</p>
              <button onClick={() => setShowSuccessModal(false)} style={{ marginTop: '15px', padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaidAmountdemo;