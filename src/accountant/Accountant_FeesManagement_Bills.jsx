import { Filter, FileText, Download, Printer, Edit, Save, X } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";

const normalizeInstituteLogo = (rawLogo) => {
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

  if (logo.startsWith("uploads/")) {
    return `https://cleezoclass.com:4000/${logo}`;
  }
  if (logo.startsWith("/uploads/")) {
    return `https://cleezoclass.com:4000${logo}`;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(logo) && logo.length > 100) {
    return `data:image/png;base64,${logo}`;
  }

  return "";
};

const GenerateBills = () => {
  // State variables
  const [studentData, setStudentData] = useState(null);
  const [previewMode, setPreviewMode] = useState(1);
  const [totalPaid, setTotalPaid] = useState(0);
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
  const location = useLocation();
  const [paymentHistory, setPaymentHistory] = useState(null);
  const[isPreviewPopupOpen,setIsPreviewPopupOpen] = useState(false)
  const [paidAmount, setPaidAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showPreviewDropdown, setShowPreviewDropdown] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [initialReceiptSet, setInitialReceiptSet] = useState(false);
  const [paymentMode, setPaymentMode] = useState('');
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
  const [residentialFee, setResidentialFee] = useState(0);
  const [tuitionFee, setTuitionFee] = useState(0);
  const [tuitionPaid, setTuitionPaid] = useState(0);
  const [examPaid, setExamPaid] = useState(0);
  const [busPaid, setBusPaid] = useState(0);
  const [bookPaid, setBookPaid] = useState(0);
  const [uniformPaid, setUniformPaid] = useState(0);
  const [othersPaid, setOthersPaid] = useState(0);
  const [residentialPaid, setResidentialPaid] = useState(0);
  const [admissionFee, setAdmissionFee] = useState(0);
  const [admissionPaid, setAdmissionPaid] = useState(0);
  const [othersDescription, setOthersDescription] = useState('');
  const [selectedClass, setSelectedClass] = useState();
  const [selectedSection, setSelectedSection] = useState(location.state?.sectionName || "");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [classList, setClassList] = useState([]);
  const [sectionMap, setSectionMap] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentReceipts, setStudentReceipts] = useState([]);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [isReceiptLookup, setIsReceiptLookup] = useState(false);
  const [receiptFeeDetails, setReceiptFeeDetails] = useState([]);
  const [isStudentBillLoading, setIsStudentBillLoading] = useState(false);
  const [isReceiptNumberEditorOpen, setIsReceiptNumberEditorOpen] = useState(false);
  const [, setReceiptPaidDateDisplay] = useState(null);
  const receiptNumberRef = useRef('');
  const receiptFeeDetailsRef = useRef([]);
  const receiptPaidDateRef = useRef(null);

  const readNumericField = useCallback((source, keys) => {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return 0;
  }, []);

  const readStringField = useCallback((source, keys) => {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value).trim();
      }
    }
    return "";
  }, []);

  const resolveReceiptPaidDate = useCallback((fallbackSource = null) => {
    return (
      receiptPaidDateRef.current ||
      readStringField(fallbackSource, ["paidDate", "paymentDate", "created_at", "paiddate", "date"]) ||
      readStringField(payments, ["paidDate", "paymentDate", "created_at", "paiddate", "date"]) ||
      readStringField(payments?.paymentHistory?.[0], ["paidDate", "paymentDate", "created_at", "paiddate", "date"]) ||
      null
    );
  }, [payments, readStringField]);

  const getFirstPositiveNumber = useCallback((...values) => {
    for (const value of values) {
      const parsed = parseFloat(value);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    for (const value of values) {
      const parsed = parseFloat(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  }, []);

  const isDynamicFeeKey = useCallback((key) => {
    const reservedKeys = new Set([
      "id",
      "schoolCode",
      "school_code",
      "class_name",
      "className",
      "section",
      "sectionName",
      "Section",
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
      "totalPaid",
      "total_paid",
      "paidAmountTotal",
      "totalAmount",
      "total_amount",
    ]);

    return !reservedKeys.has(key) && !key.endsWith("_paid") && !key.endsWith("_due");
  }, []);

  const getDynamicFeeKeysFromSource = useCallback((source = {}) => {
    return Object.keys(source || {}).filter(isDynamicFeeKey);
  }, [isDynamicFeeKey]);

  const getDynamicFeeBaseKey = useCallback((key = "") => {
    return String(key || "")
      .replace(/(_paid|Paid|_due|Due)$/i, "")
      .trim();
  }, []);

  const getDynamicFeeLabel = useCallback((key = "") => {
    const label = getDynamicFeeBaseKey(key)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
    if (!label) return "";
    return /fee/i.test(label) ? label : `${label} Fee`;
  }, [getDynamicFeeBaseKey]);

  const hasFeeData = useCallback((source = {}) => {
    const directFeeKeys = [
      "total_paid",
      "totalPaid",
      "total_due",
      "totalRemaining",
      "CompleteFee",
      "completeFee",
      "Final_Amount",
      "Paid_Amount",
      "paidAmount",
      "admissionFee",
      "Admission_fees",
      "examFee",
      "Exam_fees",
      "busFee",
      "Bus_fees",
      "bookFee",
      "Book_Fees",
      "uniformFee",
      "Uniform_fees",
      "othersFee",
      "Others",
      "residentialFee",
      "ResidentialCompleteFee",
    ];

    if (directFeeKeys.some((key) => readNumericField(source, [key]) > 0)) {
      return true;
    }

    return Object.entries(source || {}).some(([key, value]) => {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) return false;
      return /(_paid|_due|_total|fee|fees|amount|completefee)$/i.test(key);
    });
  }, [readNumericField]);

 
  const fetchMetadata = useCallback(async () => {
    setDropdownLoading(true);
    const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";
    try {
      const [classRes, sectionRes] = await Promise.all([
        axios.get(`https://cleezoclass.com:4000/api/admin/classes?schoolCode=${schoolCode}`),
        axios.get(`https://cleezoclass.com:4000/api/admin/sectionFilter?schoolCode=${schoolCode}`)
      ]);

      const sortedClasses = ["Nursery", "LKG", "UKG", ...Array.from({ length: 12 }, (_, i) => `${i + 1}`)];
      setClassList(sortedClasses);

      const sectionsArray = Array.isArray(sectionRes.data) ? sectionRes.data : [];
      setSectionMap(sectionsArray);
      setFilteredSections([...new Set(sectionsArray.map(s => s.section || s))]);
    } catch (err) {
      console.error("Error loading dropdowns:", err.message);
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

  const [updatedFields, setUpdatedFields] = useState({
    tuitionPaid: false,
    examPaid: false,
    busPaid: false,
    bookPaid: false,
    uniformPaid: false,
    othersPaid: false,
  });

  // Fetch school identity the same way dashboard pages do
  useEffect(() => {
    const fetchSchoolIdentity = async () => {
      const schoolCode = String(localStorage.getItem('schoolCode') || '').trim();
      if (!schoolCode) {
        console.warn('No school code found in localStorage. Aborting school identity fetch.');
        return;
      }

      setDynamicSchoolCode(schoolCode);
      try {
        const response = await axios.get(
          `https://cleezoclass.com:4000/api/institute?dbName=${encodeURIComponent(schoolCode)}`
        );
        const data = response.data || {};
        const resolvedSchoolName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.school_name || data?.schoolName || data?.name,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "School",
        });
        const normalizedLogo = normalizeInstituteLogo(data?.logo) || localStorage.getItem("schoolLogo") || "/default-logo.png";

        setSchoolName(resolvedSchoolName);
        setDynamicLogoSrc(normalizedLogo);
        localStorage.setItem("schoolName", resolvedSchoolName);
        localStorage.setItem("instituteName", resolvedSchoolName);
        localStorage.setItem("schoolLogo", normalizedLogo);
      } catch (error) {
        console.error('Error fetching school identity:', error.response?.data || error.message);
        const fallbackSchoolName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "School",
        });
        setSchoolName(fallbackSchoolName);
        setDynamicLogoSrc(localStorage.getItem("schoolLogo") || "/default-logo.png");
      }
    };
    fetchSchoolIdentity();
  }, []);

  // Load stored bills and school name
  useEffect(() => {
    const storedBills = localStorage.getItem('generatedBills');
    if (storedBills) {
      setGeneratedBills(JSON.parse(storedBills));
    }
    const storedSchoolName = localStorage.getItem('schoolName') || localStorage.getItem('instituteName');
    if (storedSchoolName) {
      setSchoolName(storedSchoolName);
    }
    const storedSchoolLogo = localStorage.getItem('schoolLogo');
    if (storedSchoolLogo) {
      setDynamicLogoSrc(storedSchoolLogo);
    }
    const lastReceipt = localStorage.getItem('lastReceiptNumber');
    if (lastReceipt) {
      setReceiptNumber(parseInt(lastReceipt));
      setInitialReceiptSet(true);
    }
  }, []);

  // Fetch student data, fee structure, and payment history
  useEffect(() => {
    if (!selectedStudentId || isReceiptLookup || !selectedClass) return;
    const selected = students.find(s => s.id === selectedStudentId);
    if (!selected) return;
    setIsStudentBillLoading(true);
    setPayments(null);
    setReceiptFeeDetails([]);
    receiptFeeDetailsRef.current = [];
    receiptPaidDateRef.current = null;
    setStudentReceipts([]);
    setLastReceipt(null);
    setFeeStructure({
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
    setTotalAmount(0);
    setPaidAmount(0);
    setRemainingAmount(0);
    setTuitionFee(0);
    setExamFee(0);
    setBusFee(0);
    setBookFee(0);
    setUniformFee(0);
    setOthersFee(0);
    setResidentialFee(0);
    setAdmissionFee(0);
    setTuitionPaid(0);
    setExamPaid(0);
    setBusPaid(0);
    setBookPaid(0);
    setUniformPaid(0);
    setOthersPaid(0);
    setResidentialPaid(0);
    setAdmissionPaid(0);
    setStudentData({
      name: selected.name,
      fatherName: selected.fatherName || selected.father_name || '-',
      class: selectedClass,
      section: selectedSection|| 'A',
      rollNumber: selected.id.toString(),
      billType: 'full-package'
    });
    setOthersDescription('');
    incrementReceiptNumber();
    const schoolCode = localStorage.getItem('schoolCode');
    axios.get(`https://cleezoclass.com:4000/api/feeStructure/${selectedClass}?schoolCode=${schoolCode}`)
      .then(feeRes => {
        if (feeRes.data?.feeStructure) {
          setFeeStructure(feeRes.data.feeStructure);
        }
      })
      .catch(err => console.error("Error fetching fee structure:", err));
        axios.get(`https://cleezoclass.com:4000/api/paymentHistory/${selectedStudentId}?schoolCode=${schoolCode}`)
      .then(paymentRes => {
        const paymentData = paymentRes.data.payments || {};
        setPayments(paymentData);
        const completeFee = readNumericField(paymentData, ["completeFee", "CompleteFee", "totalFee", "total_fee"]);
        const examFee = readNumericField(paymentData, ["examFee", "Exam_fees", "Exam_Fee", "exam_fee"]);
        const busFee = readNumericField(paymentData, ["busFee", "Bus_fees", "Bus_Fee", "bus_fee"]);
        const bookFee = readNumericField(paymentData, ["bookFee", "Book_Fees", "Book_Fee", "book_fee"]);
        const uniformFee = readNumericField(paymentData, ["uniformFee", "Uniform_fees", "Uniform_Fee", "uniform_fee"]);
        const othersFee = readNumericField(paymentData, ["othersFee", "Others", "Other_Fee", "others_fee"]);
        const admissionFee = readNumericField(paymentData, ["admissionFee", "Admission_fees", "Admission_Fee", "admission_fee"]);
        const residentialFee = readNumericField(paymentData, ["residentialFee", "ResidentialCompleteFee", "residential_fee"]);
        const examPaid = readNumericField(paymentData, ["examPaid", "exam_paid", "exam_payment"]);
        const busPaid = readNumericField(paymentData, ["busPaid", "bus_paid", "transportPaid"]);
        const bookPaid = readNumericField(paymentData, ["bookPaid", "books_paid", "book_paid"]);
        const uniformPaid = readNumericField(paymentData, ["uniformPaid", "uniform_paid"]);
        const othersPaid = readNumericField(paymentData, ["othersPaid", "others_paid", "otherPaid"]);
        const generalPaid = readNumericField(paymentData, ["paidAmount", "paid_amount", "Paid_Amount", "tuitionPaid", "tuition_paid", "paidAmountTotal"]);
        const tuitionPaid = generalPaid;
        const admissionPaid = readNumericField(paymentData, ["admissionPaid", "admission_paid", "Admission_paid"]);
        const residentialPaid = readNumericField(paymentData, ["residentialPaid", "residential_paid"]);
        const totalIndividualPaid = examPaid + busPaid + bookPaid + uniformPaid + othersPaid + admissionPaid + residentialPaid;
        const totalPaid = totalIndividualPaid + generalPaid;
        const remainingAmount = (completeFee + residentialFee) - totalPaid;
        const tuitionFee = completeFee - examFee - busFee - bookFee - uniformFee - othersFee;
        setTotalAmount(completeFee + residentialFee);
        setPaidAmount(totalPaid);
        setRemainingAmount(remainingAmount);
        setTuitionFee(tuitionFee);
        setExamFee(examFee);
        setBusFee(busFee);
        setBookFee(bookFee);
        setUniformFee(uniformFee);
        setOthersFee(othersFee);
        setResidentialFee(residentialFee);
        setExamPaid(examPaid);
        setBusPaid(busPaid);
        setBookPaid(bookPaid);
        setUniformPaid(uniformPaid);
        setOthersPaid(othersPaid);
        setTuitionPaid(tuitionPaid);
        setAdmissionFee(admissionFee);
        setAdmissionPaid(admissionPaid);
        setResidentialPaid(residentialPaid);
        setEditableBill({
          tuitionPaid: tuitionPaid,
          examPaid: examPaid,
          busPaid: busPaid,
          bookPaid: bookPaid,
          uniformPaid: uniformPaid,
          othersPaid: othersPaid,
          paymentMode: paymentData.paymentMode || ''
        });
      })
      .catch(err => {
        console.error("Error fetching payment history:", err);
        setPayments(null);
      })
      .finally(() => setIsStudentBillLoading(false));
  }, [selectedStudentId, students, selectedClass]);

  const mergedFeeSource = useMemo(() => ({
    ...(feeStructure || {}),
    ...(payments || {}),
  }), [feeStructure, payments]);

  const dynamicFeeKeys = useMemo(() => {
    return getDynamicFeeKeysFromSource(mergedFeeSource).filter(
      (key) => !key.toLowerCase().endsWith("date")
    );
  }, [getDynamicFeeKeysFromSource, mergedFeeSource]);

  const dynamicFeeRows = useMemo(() => {
    return dynamicFeeKeys
      .map((key) => {
        const baseKey = getDynamicFeeBaseKey(key);
        const total = getFirstPositiveNumber(
          feeStructure?.[key],
          feeStructure?.[baseKey],
          feeStructure?.[`${baseKey}Fee`],
          payments?.[key],
          payments?.[baseKey]
        );
        const paid = getFirstPositiveNumber(
          payments?.[`${baseKey}_paid`],
          payments?.[`${baseKey}Paid`],
          payments?.[`${baseKey}_paid_amount`],
          payments?.[`${key}_paid`],
          payments?.[`${key}Paid`],
          payments?.[`${key}_paid_amount`],
          /paid$/i.test(key) ? payments?.[key] : 0,
          payments?.[baseKey]
        );
        const storedDue = parseFloat(
          payments?.[`${baseKey}_due`] ??
          payments?.[`${key}_due`] ??
          payments?.[`${baseKey}Due`]
        );
        const due = Number.isFinite(storedDue) && storedDue >= 0 ? storedDue : Math.max(total - paid, 0);
        return {
          key,
          label: getDynamicFeeLabel(key),
          total,
          paid,
          due,
        };
      })
      .filter((row) => row.total > 0 || row.paid > 0 || row.due > 0);
  }, [dynamicFeeKeys, feeStructure, getDynamicFeeBaseKey, getDynamicFeeLabel, getFirstPositiveNumber, payments]);

  const dynamicFeeDueTotal = useMemo(
    () => dynamicFeeRows.reduce((sum, row) => sum + row.due, 0),
    [dynamicFeeRows]
  );

  const dynamicFeePaidTotal = useMemo(
    () => dynamicFeeRows.reduce((sum, row) => sum + row.paid, 0),
    [dynamicFeeRows]
  );

  const receiptPaidRows = useMemo(() => {
    const rows = Array.isArray(receiptFeeDetails) ? receiptFeeDetails : [];
    const paidFieldKeys = [
      "amount_paid",
      "Paid_Amount",
      "paidAmount",
      "paid_amount",
      "tuition_paid_this_transaction",
      "Installment1_Paid",
      "Installment2_Paid",
      "Installment3_Paid",
      "Installment4_Paid",
      "Installment5_Paid",
      "stationary_paid",
      "sports_paid",
      "guides_paid",
      "belt_paid",
      "tie_fee_paid",
      "book_paid",
      "books_paid",
      "bus_paid",
      "uniform_paid",
      "exam_paid",
      "Admission_paid",
      "admission_paid",
      "others_paid",
      "residential_paid",
    ];
    return rows
      .map((row) => {
        const feeType = readStringField(row, ["fee_type", "feeType", "feeName", "type"]);
        const normalizedFeeKey = String(feeType || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
        const directAmount = readNumericField(row, [
          "amount_paid",
          "Paid_Amount",
          "paidAmount",
          "paid_amount",
          "amount",
          "fee_amount",
          "feeAmount",
          "total",
          "value",
          "paid",
          "tuition_paid_this_transaction",
          "tuitionPaid",
          "stationary_paid",
          "sports_paid",
          "guides_paid",
          "belt_paid",
          "tie_fee_paid",
          "book_paid",
          "books_paid",
          "bus_paid",
          "uniform_paid",
          "exam_paid",
          "Admission_paid",
          "admission_paid",
          "others_paid",
          "residential_paid",
          `${normalizedFeeKey}_paid`,
          `${normalizedFeeKey}Paid`,
          `${normalizedFeeKey}_paid_amount`,
          `${normalizedFeeKey}_amount`,
          `${normalizedFeeKey}Amount`,
          `${normalizedFeeKey}_fee`,
          `${normalizedFeeKey}Fee`
        ]);
        const summedPaidAmount = paidFieldKeys.reduce(
          (sum, key) => sum + readNumericField(row, [key]),
          0
        );
        const amount = directAmount > 0 ? directAmount : summedPaidAmount;
        const description = readStringField(row, ["others_description", "othersDescription", "description"]);
        if (!feeType && amount <= 0) return null;
        return {
          label: feeType ? getDynamicFeeLabel(feeType) : "Paid Fee",
          amount,
          description,
        };
      })
      .filter(Boolean)
      .filter((row) => row.amount > 0);
  }, [getDynamicFeeLabel, readNumericField, readStringField, receiptFeeDetails]);

  useEffect(() => {
    receiptFeeDetailsRef.current = Array.isArray(receiptFeeDetails) ? receiptFeeDetails : [];
  }, [receiptFeeDetails]);

  // Fetch all receipts for the selected student by name from FeesDetails
  useEffect(() => {
    if (!selectedStudentId || !studentData) return;
    const fetchStudentReceipts = async () => {
      try {
        const schoolCode = localStorage.getItem('schoolCode');
        const response = await axios.get(
          `https://cleezoclass.com:4000/api/bill/data/byStudent/${encodeURIComponent(studentData.name)}`,
          { params: { schoolCode } }
        );
        const receipts = Array.isArray(response.data?.receipts)
          ? response.data.receipts
          : Array.isArray(response.data?.rows)
            ? response.data.rows
            : Array.isArray(response.data?.data)
              ? response.data.data
              : Array.isArray(response.data)
                ? response.data
                : [];

        const sortedReceipts = [...receipts].sort((a, b) => {
          const aDate = new Date(a?.created_at || a?.date || 0).getTime();
          const bDate = new Date(b?.created_at || b?.date || 0).getTime();
          if (bDate !== aDate) return bDate - aDate;
          return Number(b?.receiptNumber || 0) - Number(a?.receiptNumber || 0);
        });
        setStudentReceipts(sortedReceipts);
        setLastReceipt(sortedReceipts[0] || null);
      } catch (error) {
        console.error('Error fetching student receipts:', error);
        setStudentReceipts([]);
        setLastReceipt(null);
      }
    };
    fetchStudentReceipts();
  }, [selectedStudentId, studentData]);
const [onlyWithReceipts, setOnlyWithReceipts] = useState(true);

const hasFeeSummaryFromStudents = useMemo(() => {
  return students.some((student) => hasFeeData(student));
}, [hasFeeData, students]);

const filteredStudents = useMemo(() => {
  return students.filter(student => {
    const matchesSearch = String(student.name || '').toLowerCase().includes(studentSearchTerm.toLowerCase());
    const matchesFeeFilter = onlyWithReceipts && hasFeeSummaryFromStudents ? hasFeeData(student) : true;
    return matchesSearch && matchesFeeFilter;
  });
}, [hasFeeData, hasFeeSummaryFromStudents, students, studentSearchTerm, onlyWithReceipts]);

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditableBill({
        tuitionPaid: tuitionPaid,
        examPaid: examPaid,
        busPaid: busPaid,
        bookPaid: bookPaid,
        uniformPaid: uniformPaid,
        othersPaid: othersPaid,
        paymentMode: paymentMode
      });
    } else {
      setIsEditing(true);
      setEditableBill({
        tuitionPaid: tuitionPaid,
        examPaid: examPaid,
        busPaid: busPaid,
        bookPaid: bookPaid,
        uniformPaid: uniformPaid,
        othersPaid: othersPaid,
        paymentMode: paymentMode
      });
    }
  };

  // Handle edit changes
  const handleEditChange = (field, value) => {
    setEditableBill(prev => ({
      ...prev,
      [field]: value
    }));
    setUpdatedFields(prev => ({
      ...prev,
      [field]: true
    }));
  };

  // Save edited bill values locally (no image save)
  const saveEditedBill = async (e) => {
    e.preventDefault();
    const newTuitionPaid = parseFloat(editableBill?.tuitionPaid) || 0;
    const newExamPaid = parseFloat(editableBill?.examPaid) || 0;
    const newBusPaid = parseFloat(editableBill?.busPaid) || 0;
    const newBookPaid = parseFloat(editableBill?.bookPaid) || 0;
    const newUniformPaid = parseFloat(editableBill?.uniformPaid) || 0;
    const newOthersPaid = parseFloat(editableBill?.othersPaid) || 0;
    const newPaymentMode = editableBill?.paymentMode || '';
    const newTotalPaid = newTuitionPaid + newExamPaid + newBusPaid + newBookPaid + newUniformPaid + newOthersPaid;
    const totalFeeAmount = (tuitionFee || 0) + (admissionFee || 0) + (examFee || 0) + (busFee || 0) + (bookFee || 0) + (uniformFee || 0) + (othersFee || 0);
    setTuitionPaid(newTuitionPaid);
    setExamPaid(newExamPaid);
    setBusPaid(newBusPaid);
    setBookPaid(newBookPaid);
    setUniformPaid(newUniformPaid);
    setOthersPaid(newOthersPaid);
    setPaidAmount(newTotalPaid);
    setRemainingAmount(Math.max(totalFeeAmount - newTotalPaid, 0));
    setPaymentMode(newPaymentMode);
    setIsEditing(false);
    setSuccessMessage("Saved successfully!");
    setShowSuccessModal(true);
    setUpdatedFields({
      tuitionPaid: false,
      examPaid: false,
      busPaid: false,
      bookPaid: false,
      uniformPaid: false,
      othersPaid: false,
    });
  };

  // Search bills by receipt number
  const searchBillsByReceiptNumber = async (receiptNumber = null) => {
    let lookupValue = receiptNumber;
    if (lookupValue && typeof lookupValue === 'object') {
      lookupValue = lookupValue?.target?.value || lookupValue?.currentTarget?.value || searchTerm;
    }
    const numberToSearch = String(lookupValue || searchTerm || '').trim();
    const receiptCandidates = buildReceiptLookupCandidates(numberToSearch);
    if (!receiptCandidates.length) {
      alert('Please enter a receipt number');
      return false;
    }
    setIsSearching(true);
    setStudentData(null);
    setSearchResults(null);
    setReceiptFeeDetails([]);
    receiptFeeDetailsRef.current = [];
    try {
      const schoolCode = localStorage.getItem('schoolCode');
      if (!schoolCode) {
        alert('School authentication missing. Please log in again.');
        setIsSearching(false);
        return false;
      }

      let rows = [];
      let matchedReceiptNumber = '';

      for (const candidate of receiptCandidates) {
        try {
          const receiptRes = await axios.get(
            `https://cleezoclass.com:4000/api/receipt-fee-details?schoolCode=${schoolCode}&receiptNumber=${encodeURIComponent(candidate)}`
          );
          const candidateRows = Array.isArray(receiptRes.data?.rows) ? receiptRes.data.rows : [];
          if (candidateRows.length > 0) {
            rows = candidateRows;
            matchedReceiptNumber = candidate;
            break;
          }
        } catch (candidateErr) {
          if (candidateErr?.response?.status !== 404) {
            throw candidateErr;
          }
        }
      }

      if (rows.length > 0) {
        const firstRow = rows[0];
        const firstRowClass = readStringField(firstRow, ["Class_name", "class_name", "className", "class"]) || '';
        const firstRowSection = readStringField(firstRow, ["section", "sectionName", "Section", "section_name"]) || '';
        const firstRowName = readStringField(firstRow, ["StudentName", "studentName", "name"]) || '';
        const firstRowFatherName = readStringField(firstRow, ["fatherName", "FatherName"]) || '';
        const firstRowLoginId = firstRow.login_id ? parseInt(firstRow.login_id, 10) : null;
        const firstRowRegnNo = String(firstRow.regn_no || firstRowLoginId || '');

        setSearchResults(firstRow);
        setReceiptFeeDetails(rows);
        receiptFeeDetailsRef.current = rows;
        setSelectedClass(firstRowClass || '');
        setSelectedSection(firstRowSection || '');
        setSelectedStudentId(firstRowLoginId);
   
        {
          const resolvedReceiptNumber = String(firstRow.receiptNumber || matchedReceiptNumber || numberToSearch);
          setReceiptNumber(resolvedReceiptNumber);
          receiptNumberRef.current = resolvedReceiptNumber;
        }
        // Capture this specific receipt's own paid date from the row itself -
        // NOT from the aggregated payment-history object, which reflects the
        // student's latest activity overall and would show today's date for
        // every past receipt reprinted.
        {
          const resolvedPaidDate = readStringField(firstRow, ["paidDate", "paymentDate", "created_at", "paiddate", "date"]) || null;
          receiptPaidDateRef.current = resolvedPaidDate;
          setReceiptPaidDateDisplay(resolvedPaidDate);
        }

        setReceiptNumber(String(firstRow.receiptNumber || matchedReceiptNumber || numberToSearch));
        setPaymentMode(readStringField(firstRow, ["paymentMode", "payment_mode"]) || '');
        setOthersDescription(readStringField(firstRow, ["others_description", "othersDescription"]) || '');
        setPaidAmount(readNumericField(firstRow, ["Paid_Amount", "paidAmount", "totalPaid", "amount_paid"]) || 0);
        const receiptPaidTotals = rows.reduce((totals, row) => ({
          tuition: totals.tuition + readNumericField(row, ["Paid_Amount", "paidAmount", "paid_amount", "tuition_paid_this_transaction", "Installment1_Paid", "Installment2_Paid", "Installment3_Paid", "Installment4_Paid", "Installment5_Paid"]),
          admission: totals.admission + readNumericField(row, ["Admission_paid", "admission_paid"]),
          exam: totals.exam + readNumericField(row, ["exam_paid", "examPaid"]),
          bus: totals.bus + readNumericField(row, ["bus_paid", "busPaid"]),
          book: totals.book + readNumericField(row, ["books_paid", "book_paid", "bookPaid"]),
          uniform: totals.uniform + readNumericField(row, ["uniform_paid", "uniformPaid"]),
          others: totals.others + readNumericField(row, ["others_paid", "othersPaid"]),
          residential: totals.residential + readNumericField(row, ["residential_paid", "residentialPaid"]),
        }), {
          tuition: 0,
          admission: 0,
          exam: 0,
          bus: 0,
          book: 0,
          uniform: 0,
          others: 0,
          residential: 0,
        });
        setTuitionPaid(receiptPaidTotals.tuition);
        setAdmissionPaid(receiptPaidTotals.admission);
        setExamPaid(receiptPaidTotals.exam);
        setBusPaid(receiptPaidTotals.bus);
        setBookPaid(receiptPaidTotals.book);
        setUniformPaid(receiptPaidTotals.uniform);
        setOthersPaid(receiptPaidTotals.others);
        setResidentialPaid(receiptPaidTotals.residential);

        try {
          const feeRes = await axios.get(
            `https://cleezoclass.com:4000/api/feeStructure/${firstRowClass}?schoolCode=${schoolCode}`
          );
          if (feeRes.data?.feeStructure) {
            setFeeStructure(feeRes.data.feeStructure);
          }
        } catch (feeErr) {
          console.error("Error fetching fee structure for receipt lookup:", feeErr);
        }

        setStudentData({
          name: firstRowName || '',
          fatherName: firstRowFatherName || '',
          class: firstRowClass || '',
          rollNumber: firstRowRegnNo || '',
          section: firstRowSection || ''
        });

        try {
          if (firstRowLoginId) {
            const historyRes = await axios.get(
              `https://cleezoclass.com:4000/api/paymentHistory/${firstRowLoginId}?schoolCode=${schoolCode}`
            );
            const paymentData = historyRes.data?.payments || {};
            setPayments(paymentData);
          }
        } catch (historyErr) {
          console.error("Error fetching payment history totals:", historyErr);
        }

        setIsReceiptLookup(true);
        setIsPreviewPopupOpen(true);
        return true;
      }

      let foundBill = null;
      let matchedBillReceiptNumber = '';

      for (const candidate of receiptCandidates) {
        try {
          const response = await axios.get(
            `https://cleezoclass.com:4000/api/bill/data/${candidate}`,
            { params: { schoolCode } }
          );
          if (response.data?.bill) {
            foundBill = response.data.bill;
            matchedBillReceiptNumber = candidate;
            break;
          }
        } catch (candidateErr) {
          if (candidateErr?.response?.status !== 404) {
            throw candidateErr;
          }
        }
      }

      if (foundBill) {
        const foundPaid = {
          tuition: readNumericField(foundBill, ["tuitionPaid", "tuition_paid", "Paid_Amount", "paidAmount", "paid_amount", "tuitionPaidTotal"]),
          admission: readNumericField(foundBill, ["admissionPaid", "admission_paid", "Admission_paid"]),
          exam: readNumericField(foundBill, ["examPaid", "exam_paid"]),
          bus: readNumericField(foundBill, ["busPaid", "bus_paid"]),
          book: readNumericField(foundBill, ["bookPaid", "book_paid", "books_paid"]),
          uniform: readNumericField(foundBill, ["uniformPaid", "uniform_paid"]),
          others: readNumericField(foundBill, ["othersPaid", "others_paid"]),
        };

        const billStudent = {
          class: readStringField(foundBill, ["className", "class_name", "Class_name", "class"]) || '',
          rollNumber: foundBill.regn_no || '',
          name: readStringField(foundBill, ["studentName", "StudentName", "name"]) || '',
          fatherName: studentData?.fatherName || '',
          section: readStringField(foundBill, ["sectionName", "section_name", "section", "Section"]) || ''
        };

        setSearchResults(foundBill);
        setSelectedClass(billStudent.class || '');
        setSelectedStudentId(parseInt(billStudent.rollNumber, 10) || 0);

        {
          const resolvedReceiptNumber = String(foundBill.receiptNumber || matchedBillReceiptNumber || '');
          setReceiptNumber(resolvedReceiptNumber);
          receiptNumberRef.current = resolvedReceiptNumber;
        }
        {
          const resolvedPaidDate = readStringField(foundBill, ["paidDate", "paymentDate", "created_at", "paiddate", "date"]) || null;
          receiptPaidDateRef.current = resolvedPaidDate;
          setReceiptPaidDateDisplay(resolvedPaidDate);
        }

        setReceiptNumber(String(foundBill.receiptNumber || matchedBillReceiptNumber || ''));
        setPaymentMode(readStringField(foundBill, ["paymentMode", "payment_mode"]) || '');
        setOthersDescription((foundBill.othersDescription || '').trim());
        setPaidAmount(readNumericField(foundBill, ["totalPaid", "paidAmount", "Paid_Amount"]) || 0);

        try {
          const feeRes = await axios.get(
            `https://cleezoclass.com:4000/api/feeStructure/${billStudent.class}?schoolCode=${schoolCode}`
          );
          if (feeRes.data?.feeStructure) {
            setFeeStructure(feeRes.data.feeStructure);
          }
        } catch (feeErr) {
          console.error("Error fetching fee structure for receipt lookup:", feeErr);
        }

        try {
          const receiptRes = await axios.get(
            `https://cleezoclass.com:4000/api/receipt-fee-details?schoolCode=${schoolCode}&receiptNumber=${encodeURIComponent(foundBill.receiptNumber || numberToSearch)}`
          );
          if (Array.isArray(receiptRes.data?.rows)) {
            setReceiptFeeDetails(receiptRes.data.rows);
            receiptFeeDetailsRef.current = receiptRes.data.rows;
          }
        } catch (receiptErr) {
          console.error("Error fetching receipt fee details:", receiptErr);
        }

        setTuitionPaid(foundPaid.tuition);
        setAdmissionPaid(foundPaid.admission);
        setExamPaid(foundPaid.exam);
        setBusPaid(foundPaid.bus);
        setBookPaid(foundPaid.book);
        setUniformPaid(foundPaid.uniform);
        setOthersPaid(foundPaid.others);
        setEditableBill({
          tuitionPaid: foundPaid.tuition,
          examPaid: foundPaid.exam,
          busPaid: foundPaid.bus,
          bookPaid: foundPaid.book,
          uniformPaid: foundPaid.uniform,
          othersPaid: foundPaid.others,
          paymentMode: readStringField(foundBill, ["paymentMode", "payment_mode"]) || ''
        });
        setStudentData({
          name: billStudent.name || '',
          fatherName: billStudent.fatherName || '',
          class: billStudent.class || '',
          rollNumber: billStudent.rollNumber || '',
          section: billStudent.section || ''
        });
        // Load full payment history totals for complete paid/due
        try {
          const historyRes = await axios.get(
            `https://cleezoclass.com:4000/api/paymentHistory/${billStudent.rollNumber}?schoolCode=${schoolCode}`
          );
        const paymentData = historyRes.data?.payments || {};
        setPayments(paymentData);
          const completeFee = readNumericField(paymentData, ["completeFee", "CompleteFee", "totalFee", "total_fee"]);
          const examFee = readNumericField(paymentData, ["examFee", "Exam_fees", "Exam_Fee", "exam_fee"]);
          const busFee = readNumericField(paymentData, ["busFee", "Bus_fees", "Bus_Fee", "bus_fee"]);
          const bookFee = readNumericField(paymentData, ["bookFee", "Book_Fees", "Book_Fee", "book_fee"]);
          const uniformFee = readNumericField(paymentData, ["uniformFee", "Uniform_fees", "Uniform_Fee", "uniform_fee"]);
          const othersFee = readNumericField(paymentData, ["othersFee", "Others", "Other_Fee", "others_fee"]);
          const admissionFee = readNumericField(paymentData, ["admissionFee", "Admission_fees", "Admission_Fee", "admission_fee"]);
          const residentialFee = readNumericField(paymentData, ["residentialFee", "ResidentialCompleteFee", "residential_fee"]);
          const examPaid = readNumericField(paymentData, ["examPaid", "exam_paid", "exam_payment"]);
          const busPaid = readNumericField(paymentData, ["busPaid", "bus_paid", "transportPaid"]);
          const bookPaid = readNumericField(paymentData, ["bookPaid", "books_paid", "book_paid"]);
          const uniformPaid = readNumericField(paymentData, ["uniformPaid", "uniform_paid"]);
          const othersPaid = readNumericField(paymentData, ["othersPaid", "others_paid", "otherPaid"]);
          const generalPaid = readNumericField(paymentData, ["paidAmount", "paid_amount", "Paid_Amount", "tuitionPaid", "tuition_paid", "paidAmountTotal"]);
          const admissionPaid = readNumericField(paymentData, ["admissionPaid", "admission_paid", "Admission_paid"]);
          const totalIndividualPaid = examPaid + busPaid + bookPaid + uniformPaid + othersPaid;
          const totalPaid = totalIndividualPaid + generalPaid;
          const residentialPaid = readNumericField(paymentData, ["residentialPaid", "residential_paid"]);
          const totalPaidWithResidential = totalPaid + admissionPaid + residentialPaid;
          const remainingAmount = (completeFee + residentialFee) - totalPaidWithResidential;
          const tuitionFee = completeFee - examFee - busFee - bookFee - uniformFee - othersFee;
          setTotalAmount(completeFee + residentialFee);
          setPaidAmount(totalPaidWithResidential);
          setRemainingAmount(remainingAmount);
          setTuitionFee(tuitionFee);
          setExamFee(examFee);
          setBusFee(busFee);
          setBookFee(bookFee);
          setUniformFee(uniformFee);
          setOthersFee(othersFee);
          setResidentialFee(residentialFee);
          setAdmissionFee(admissionFee);
          setResidentialPaid(residentialPaid);
        } catch (err) {
          console.error("Error fetching payment history totals:", err);
        }
        setIsReceiptLookup(true);
        setIsPreviewPopupOpen(true);
        return true;
      }

      alert('No receipt found with that number');
      resetFormFields();
      return false;
    } catch (error) {
      console.error('Error searching bills:', error);
      if (error.response?.status === 404) {
        alert('No receipt found with that number. Please check the receipt number.');
      } else {
        alert(error.response?.data?.message ||
              error.message ||
              'Failed to search for the bill');
      }
      resetFormFields();
      return false;
    } finally {
      setIsSearching(false);
    }
  };

  // Reset form fields
  const resetFormFields = () => {
    setIsReceiptLookup(false);
    setStudentData(null);
    setFeeStructure({
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
    setPayments(null);
    setReceiptFeeDetails([]);
    receiptFeeDetailsRef.current = [];
    receiptPaidDateRef.current = null;
    setReceiptPaidDateDisplay(null);
    setTotalAmount(0);
    setPaidAmount(0);
    setRemainingAmount(0);
    setOthersDescription('');
  };

  const clearFilters = () => {
    setSelectedClass("");
    setSelectedSection("");
    setSelectedStudentId(null);
    setStudentSearchTerm("");
    setStudents([]);
    setStudentReceipts([]);
    setLastReceipt(null);
    setSearchTerm("");
    setIsPreviewPopupOpen(false);
    resetFormFields();
  };

  // Increment receipt number
  const incrementReceiptNumber = () => {
    const newNumber = parseInt(receiptNumber) + 1;
    setReceiptNumber(newNumber);
    localStorage.setItem('lastReceiptNumber', newNumber);
  };

  // Set receipt number
  const handleSetReceiptNumber = () => {
    if (!receiptNumber || isNaN(receiptNumber)) {
      console.error('Please enter a valid numeric receipt number');
      return;
    }
    setInitialReceiptSet(true);
    localStorage.setItem('lastReceiptNumber', receiptNumber);
    setIsReceiptNumberEditorOpen(false);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get current date
  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get academic year
  const getAcademicYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    if (month >= 3) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  // Convert amount to words
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

  // Handle print
  const handlePrint = () => {
    if (!initialReceiptSet) {
      console.error('Please set a receipt number first');
      return;
    }
    confirmPrint(1);
  };

  const printCurrentReceiptPreview = () => {
    const previewContainer = document.getElementById('bill-preview-content');
    if (!previewContainer) {
      alert('Receipt preview is not ready yet.');
      return false;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the receipt.');
      return false;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Receipts</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            * {
              box-sizing: border-box;
              font-family: Arial, sans-serif;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              width: 210mm;
              min-height: 297mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              padding: 12mm;
            }
            .bill-container {
              width: 186mm;
              min-height: 273mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              gap: 10mm;
              margin: 0 auto;
            }
            .bill-copy {
              width: 100%;
              page-break-inside: avoid;
              break-inside: avoid;
              overflow: hidden;
            }
            .bill-copy > div {
              width: 300px !important;
            }
          </style>
        </head>
        <body>
          <div class="bill-container">
            <div class="bill-copy" id="copy-1"></div>
            <div class="bill-copy" id="copy-2"></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const styleOverrides = printWindow.document.createElement('style');
    styleOverrides.innerHTML = `
      * {
        font-family: Arial, sans-serif !important;
        -webkit-font-smoothing: none !important;
        font-smooth: never !important;
        text-rendering: geometricPrecision !important;
      }
      body, p, td, th, div { color: #000 !important; }
      table, th, td { border-color: #000 !important; }
    `;
    printWindow.document.head.appendChild(styleOverrides);

    const sourceCard = previewContainer.firstElementChild
      ? previewContainer.firstElementChild
      : previewContainer;
    const firstCopy = sourceCard.cloneNode(true);
    const secondCopy = sourceCard.cloneNode(true);

    const copyOne = printWindow.document.getElementById('copy-1');
    const copyTwo = printWindow.document.getElementById('copy-2');
    if (!copyOne || !copyTwo) {
      alert('Unable to prepare print copies.');
      printWindow.close();
      return false;
    }

    copyOne.appendChild(firstCopy);
    copyTwo.appendChild(secondCopy);

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);

    return true;
  };

  // Confirm print
  const confirmPrint = (copies) => {
    const tuitionDiscount = payments?.discounts?.tuitionDiscount || 0;
    const feeDiscount = payments?.discounts?.feeDiscount || 0;
    const bookDiscount = payments?.discounts?.appliedTo?.includes('Books Fee') ? feeDiscount : 0;
    const otherDescription = (othersDescription || '').trim();
    const liveReceiptRows = Array.isArray(receiptFeeDetailsRef.current) ? receiptFeeDetailsRef.current : [];
    const printReceiptRows = liveReceiptRows.length > 0
      ? liveReceiptRows
          .map((row) => {
            const feeType = readStringField(row, ["fee_type", "feeType", "feeName", "type"]);
            const normalizedFeeKey = String(feeType || "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "");
            const amount = readNumericField(row, [
              "amount_paid",
              "Paid_Amount",
              "paidAmount",
              "paid_amount",
              "amount",
              "fee_amount",
              "feeAmount",
              "total",
              "value",
              "paid",
              "tuition_paid_this_transaction",
              "tuitionPaid",
              "stationary_paid",
              "sports_paid",
              "guides_paid",
              "belt_paid",
              "tie_fee_paid",
              "book_paid",
              "books_paid",
              "bus_paid",
              "uniform_paid",
              "exam_paid",
              "Admission_paid",
              "admission_paid",
              "others_paid",
              "residential_paid",
              `${normalizedFeeKey}_paid`,
              `${normalizedFeeKey}Paid`,
              `${normalizedFeeKey}_paid_amount`,
              `${normalizedFeeKey}_amount`,
              `${normalizedFeeKey}Amount`,
              `${normalizedFeeKey}_fee`,
              `${normalizedFeeKey}Fee`
            ]);
            const description = readStringField(row, ["others_description", "othersDescription", "description"]);
            if (!feeType && amount <= 0) return null;
            return {
              label: feeType ? getDynamicFeeLabel(feeType) : "Paid Fee",
              amount,
              description,
            };
          })
          .filter(Boolean)
          .filter((row) => row.amount > 0)
      : receiptPaidRows;
      const printData = {
        receiptNumber,
        studentData,
        tuitionFee,
        tuitionPaid,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentMode,
      currentDate: resolveReceiptPaidDate(searchResults) || new Date(),
      academicYear: getAcademicYear(),
      amountInWords: convertAmountToWords(paidAmount),
      schoolName,
      logoUrl: dynamicLogoSrc || "/default-logo.png",
      examFee,
      busFee,
      bookFee,
      uniformFee,
      othersFee,
      examPaid,
      busPaid,
      bookPaid,
      admissionFee,
      admissionPaid,
      residentialFee,
        residentialPaid,
        uniformPaid,
        othersPaid,
        othersDescription: otherDescription,
        receiptPaidRows: printReceiptRows,
        receiptTableRows,
        dynamicFeeRows,
        dynamicFeeDueTotal,
        dynamicFeePaidTotal,
        discounts: {
          tuitionDiscount,
          bookDiscount
        }
      };
    if (copies === 1) {
      // Keep A4 split as 2 parts (top + bottom)
      printPendingBills([{ ...printData }, { ...printData }]);
    } else if (copies === 2) {
      printPendingBills([
        { ...printData, isTopCopy: true },
        { ...printData, isTopCopy: false },
        { ...printData, isTopCopy: true },
        { ...printData, isTopCopy: false }
      ]);
    }
  };

  // Print pending bills — matches the "School Copy / Student-Parent Copy" receipt
  // layout used by the Generate Bill screen (same design as a fresh payment receipt).
  const printPendingBills = (billsToPrint) => {
    const updatedBills = [...generatedBills];
    billsToPrint.forEach(billToPrint => {
      const existingIndex = updatedBills.findIndex(bill => bill.receiptNumber === billToPrint.receiptNumber);
      if (existingIndex > -1) {
        updatedBills[existingIndex] = billToPrint;
      } else {
        updatedBills.push(billToPrint);
      }
    });
    setGeneratedBills(updatedBills);
    localStorage.setItem('generatedBills', JSON.stringify(updatedBills));

    // Only one receipt is printed (as two identical "School Copy" / "Parent Copy" halves),
    // so the first entry supplies all the data needed.
    const printData = billsToPrint[0];
    if (!printData) return;

    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const tuitionDiscount = printData.discounts?.tuitionDiscount || 0;
      const bookDiscount = printData.discounts?.bookDiscount || 0;
      const dynamicRows = Array.isArray(printData.dynamicFeeRows) ? printData.dynamicFeeRows : [];
      const receiptRows = Array.isArray(printData.receiptPaidRows) ? printData.receiptPaidRows : [];
      const resolvedReceiptTableRows = Array.isArray(printData.receiptTableRows)
        ? printData.receiptTableRows
            .map((row) => ({
              label: row.label,
              description: row.description || '',
              total: Number(row.total) || 0,
              paidNow: Number(row.paidNow) || 0,
            }))
            .filter((row) => row.paidNow > 0)
        : [];
      const receiptDisplayRows = receiptRows.length > 0
        ? receiptRows
        : [
            { label: 'Tuition Fee', amount: printData.tuitionPaid || 0 },
            { label: 'Admission Fee', amount: printData.admissionPaid || 0 },
            { label: 'Residential Fee', amount: printData.residentialPaid || 0 },
            { label: 'Exam Fee', amount: printData.examPaid || 0 },
            { label: 'Bus Fee', amount: printData.busPaid || 0 },
            { label: 'Book Fee', amount: printData.bookPaid || 0 },
            { label: 'Uniform Fee', amount: printData.uniformPaid || 0 },
            { label: 'Other Fees', amount: printData.othersPaid || 0, description: printData.othersDescription },
            ...dynamicRows.map((row) => ({
              label: row.label,
              amount: row.paid,
            })),
          ].filter((fee) => fee.amount > 0);
      const dynamicDueTotal = Number(printData.dynamicFeeDueTotal) || 0;
      const dynamicPaidTotal = Number(printData.dynamicFeePaidTotal) || 0;
      const totalAmountDue =
        (printData.tuitionFee - tuitionDiscount) +
        printData.examFee +
        printData.busFee +
        (printData.bookFee - bookDiscount) +
        printData.uniformFee +
        printData.othersFee +
        printData.admissionFee +
        printData.residentialFee +
        dynamicDueTotal;
      const totalPaidAmount =
        printData.tuitionPaid +
        printData.examPaid +
        printData.busPaid +
        printData.bookPaid +
        printData.uniformPaid +
        printData.othersPaid +
        printData.admissionPaid +
        printData.residentialPaid +
        dynamicPaidTotal;
      const printFeeTotalRows = [
        { label: 'Tuition Fee', value: Math.max((printData.tuitionFee || 0) - tuitionDiscount, 0) },
        { label: 'Admission Fee', value: printData.admissionFee || 0 },
        { label: 'Residential Fee', value: printData.residentialFee || 0 },
        { label: 'Exam Fee', value: printData.examFee || 0 },
        { label: 'Book Fee', value: Math.max((printData.bookFee || 0) - bookDiscount, 0) },
        { label: 'Bus Fee', value: printData.busFee || 0 },
        { label: 'Uniform Fee', value: printData.uniformFee || 0 },
        { label: 'Other Fees', value: printData.othersFee || 0, description: printData.othersDescription },
        ...dynamicRows.map((row) => ({ label: row.label, value: row.total })),
      ].filter((fee) => fee.value > 0);
      const printReceiptRowsByLabel = new Map();
      printFeeTotalRows.forEach((fee) => {
        printReceiptRowsByLabel.set(fee.label, {
          label: fee.label,
          description: fee.description || '',
          total: Number(fee.value || 0),
          paidNow: 0,
        });
      });
      receiptDisplayRows.forEach((paidRow) => {
        const existing = printReceiptRowsByLabel.get(paidRow.label) || {
          label: paidRow.label,
          description: '',
          total: 0,
          paidNow: 0,
        };
        const paidNow = Number(paidRow.amount || 0);
        printReceiptRowsByLabel.set(paidRow.label, {
          ...existing,
          description: existing.description || paidRow.description || '',
          total: existing.total > 0 ? existing.total : paidNow,
          paidNow: existing.paidNow + paidNow,
        });
      });
      const printReceiptTableRows = resolvedReceiptTableRows.length > 0
        ? resolvedReceiptTableRows
        : Array.from(printReceiptRowsByLabel.values())
            .filter((row) => row.paidNow > 0);
      const printReceiptPaidNowTotal = printReceiptTableRows.reduce((sum, row) => sum + row.paidNow, 0);
      const printReceiptTotalAmount = printReceiptTableRows.reduce((sum, row) => sum + row.total, 0);
      const paidNowOrTotal = printReceiptPaidNowTotal || totalPaidAmount;
      const logoSrc = printData.logoUrl || 'https://via.placeholder.com/40';
      const schoolNameDisplay = printData.schoolName || 'School Name';

      const receiptCardHTML = `
        <div style="background-color:#ffffff;padding:0.5rem;border:1px solid #ccc;border-radius:0.25rem;">
          <img src="${logoSrc}" alt="Watermark" style="position:absolute;top:30%;left:50%;transform:translate(-50%,-50%);width:200px;height:200px;opacity:0.15;z-index:0;pointer-events:none;" />
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.25rem;position:relative;z-index:1;">
            <div style="width:34px;height:34px;border-radius:6px;border:1px solid #d1d5db;background-color:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
              <img src="${logoSrc}" alt="School Logo" style="width:100%;height:100%;object-fit:contain;" />
            </div>
            <div style="flex:1;text-align:center;">
              <h1 style="font-size:1rem;font-weight:700;color:#1e40af;margin:0 0 0.1rem 0;">${schoolNameDisplay}</h1>
              <div style="border:.5px solid black;margin:3px 0;padding:2px 0;font-weight:bold;font-size:10px;">FEES RECEIPT</div>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:0.11rem;position:relative;z-index:1;">
            <tbody>
              <tr>
                <td style="text-align:left;width:50%;font-size:10px;"><strong>Receipt No.</strong> ${formatReceiptNumber(printData.receiptNumber)}</td>
                <td style="text-align:left;width:50%;font-size:10px;"><strong>Paid Date:</strong> ${formatDate(printData.currentDate || new Date())}</td>
              </tr>
              <tr>
                <td style="text-align:left;font-size:10px;"><strong>Regn. No.</strong> ${printData.studentData?.rollNumber || 'N/A'}</td>
                <td style="text-align:left;font-size:10px;"><strong>Academic Year:</strong> ${printData.academicYear}</td>
              </tr>
              <tr>
                <td style="text-align:left;font-size:10px;"><strong>Student Name:</strong> ${printData.studentData?.name || 'N/A'}</td>
                <td style="text-align:left;font-size:10px;"><strong>Father's Name:</strong> ${printData.studentData?.fatherName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="text-align:left;font-size:10px;"><strong>Class:</strong> ${printData.studentData?.class?.toUpperCase() || 'N/A'}</td>
                <td style="text-align:left;font-size:10px;"><strong>Section:</strong> ${printData.studentData?.section || 'A'}</td>
              </tr>
            </tbody>
          </table>
          <h4 style="margin:5px 0 1px 0;font-size:11px;position:relative;z-index:1;">Fee Receipt Details</h4>
          <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:9px;position:relative;z-index:1;">
            <thead>
              <tr style="background-color:#f0f0f0;">
                <th style="border:1px solid #000;padding:3px;text-align:left;">S.No</th>
                <th style="border:1px solid #000;padding:3px;text-align:left;">Fee Type</th>
                <th style="border:1px solid #000;padding:3px;text-align:right;">Total</th>
                <th style="border:1px solid #000;padding:3px;text-align:right;">Paid Now</th>
              </tr>
            </thead>
            <tbody>
              ${printReceiptTableRows.map((item, idx) => `
                <tr>
                  <td style="border:1px solid #000;padding:3px;">${idx + 1}</td>
                  <td style="border:1px solid #000;padding:3px;text-align:left;">
                    ${item.label}${item.description ? `<div style="font-size:8px;color:#555;">${item.description}</div>` : ''}
                  </td>
                  <td style="border:1px solid #000;padding:3px;text-align:right;">₹${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="border:1px solid #000;padding:3px;text-align:right;color:green;">₹${item.paidNow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
              <tr style="background-color:#f9fafb;font-weight:bold;">
                <td colspan="2" style="border:1px solid #000;padding:3px;text-align:right;">Total</td>
                <td style="border:1px solid #000;padding:3px;text-align:right;">₹${printReceiptTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="border:1px solid #000;padding:3px;text-align:right;color:green;">₹${printReceiptPaidNowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <p style="font-style:italic;margin-top:3px;font-size:10px;position:relative;z-index:1;">
            <strong>Paid Amount (in words):</strong> ${convertAmountToWords(paidNowOrTotal)}
          </p>
          <div style="display:flex;justify-content:flex-end;font-weight:bold;padding:5px 10px;position:relative;z-index:1;">
            <div>Total Paid by Student : ₹${paidNowOrTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div style="margin-top:10px;font-size:11px;position:relative;z-index:1;">
            <p><strong>Payment Mode:</strong> ${printData.paymentMode || 'Cash/Cheque/Online'}</p>
            ${(printData.paymentMode === 'Cheque' || printData.paymentMode === 'Online') ? `
              <p><strong>Cheque/Transaction No.:</strong> ___________________</p>
              <p><strong>Bank Name:</strong> ___________________</p>
            ` : ''}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:15px;position:relative;z-index:1;">
            <div style="border-top:1px dashed #000;width:120px;text-align:center;padding-top:5px;font-size:10px;">Parent's Signature</div>
            <div style="text-align:center;width:120px;">
              <div style="font-size:10px;margin-bottom:2px;">${localStorage.getItem('name') || ''}</div>
              <div style="border-top:1px dashed #000;padding-top:5px;font-size:10px;">Authorised Signature</div>
            </div>
          </div>
        </div>
      `;

      printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Fee Receipt</title>
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

.receipt-title{
    font-weight:bold;
    font-size:12px;
    margin-bottom:6px;
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
    ${receiptCardHTML}
</div>

<div id="divider" class="receipt-divider"></div>

<div id="parentCopy" class="receipt-copy">
    <div class="receipt-title">Student / Parent Copy</div>
    ${receiptCardHTML}
</div>

</body>
</html>
`);

      printWindow.document.close();
      setTimeout(() => {
        const schoolCopy = printWindow.document.getElementById('schoolCopy');
        const parentCopy = printWindow.document.getElementById('parentCopy');
        const divider = printWindow.document.getElementById('divider');

        if (!schoolCopy || !parentCopy || !divider) {
          printWindow.close();
          return;
        }

        // Approximate printable height of a Letter page after margins
        const pageHeight = 980;
        const totalHeight = schoolCopy.scrollHeight + divider.offsetHeight + parentCopy.scrollHeight;

        // Move to page 2 only if BOTH copies don't fit together
        if (totalHeight > pageHeight) {
          parentCopy.classList.add('page-break');
          divider.style.display = 'none';
        }

        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 400);
    }, 100);
  };

  // Handle download
  const handleDownload = async () => {
    if (!initialReceiptSet || !studentData) {
      console.error('Please set a receipt number and select a student first');
      return;
    }
    const tuitionDiscount = payments?.discounts?.tuitionDiscount || 0;
    const feeDiscount = payments?.discounts?.feeDiscount || 0;
    const bookDiscount = payments?.discounts?.appliedTo?.includes('Books Fee') ? feeDiscount : 0;
    const otherDescription = (othersDescription || '').trim();
    const receiptDiv = document.createElement('div');
    receiptDiv.id = 'receipt-container';
    const currentTuitionBalance = Math.max(tuitionFee - tuitionDiscount - tuitionPaid, 0);
    const currentExamBalance = Math.max(examFee - examPaid, 0);
    const currentBusBalance = Math.max(busFee - busPaid, 0);
    const currentBookBalance = Math.max(bookFee - bookDiscount - bookPaid, 0);
    const currentUniformBalance = Math.max(uniformFee - uniformPaid, 0);
    const currentOthersBalance = Math.max(othersFee - othersPaid, 0);
    const totalAmountDue =
      (tuitionFee - tuitionDiscount) +
      examFee +
      busFee +
      (bookFee - bookDiscount) +
      uniformFee +
      othersFee +
      admissionFee +
      residentialFee +
      dynamicFeeDueTotal;
    const totalPaidAmount =
      tuitionPaid +
      examPaid +
      busPaid +
      bookPaid +
      uniformPaid +
      othersPaid +
      admissionPaid +
      residentialPaid +
      dynamicFeePaidTotal;
    const totalRemainingAmount = Math.max(totalAmountDue - totalPaidAmount, 0);
    receiptDiv.innerHTML = `
      <div style="border: 2px solid black; padding: 10px; width: 280px; background-color: white; box-sizing: border-box;">
          <div style="display: flex; align-items: center; margin-bottom: 0.25rem;">
              <div style="width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-right: 10px;">
                  <img src="${dynamicLogoSrc || 'https://via.placeholder.com/40'}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <div style="flex: 1; text-align: center;">
                  <h1 style="font-size: 1rem; font-weight: 700; color: #1e40af; margin-bottom: 0.1rem;">
                      ${schoolName || 'TAGSOLNOVALLP School'}
                  </h1>
                  <div style="color: black; margin: 3px 0; padding: 2px 0; font-weight: bold; font-size: 10px;">
                      FEES RECEIPT
                  </div>
              </div>
          </div>
          <table id="student-info-table" style="width: 100%; margin-bottom: 0.1rem; font-size: 9px; border-collapse: collapse;">
              <tbody>
                  <tr>
                    <td style="text-align: left; padding: 1px;"><strong>Receipt No:</strong> ${formatReceiptNumber(receiptNumber)}</td>
                    <td style="text-align: right; padding: 1px;"><strong>Paid Date:</strong> ${formatDate(
                      resolveReceiptPaidDate(searchResults) || new Date()
                    )}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left; padding: 1px;"><strong>Regn.No:</strong> ${studentData.rollNumber}</td>
                    <td style="text-align: right; padding: 1px;"><strong>Academic Year:</strong> ${getAcademicYear()}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left; padding: 1px;"><strong>Student Name:</strong> ${studentData.name}</td>
                    <td style="text-align: right; padding: 1px;"><strong>Father Name:</strong> ${studentData.fatherName}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left; padding: 1px;"><strong>Class:</strong> ${studentData.class.toUpperCase()}</td>
                    <td style="text-align: right; padding: 1px;"><strong>Section:</strong> ${studentData.section}</td>
                  </tr>
              </tbody>
          </table>
          <table style="width: 100%; border: 1px solid black; border-collapse: collapse; margin-bottom: 0.25rem; font-size: 9px;">
              <thead>
                  <tr style="background-color: #f0f0f0;"><th style="border: 1px solid black; padding: 3px; text-align: left;">Fee Details</th><th style="border: 1px solid black; padding: 3px; text-align: right;">Amount (₹)</th><th style="border: 1px solid black; padding: 3px; text-align: right;">Paid Now (₹)</th><th style="border: 1px solid black; padding: 3px; text-align: right;">Total Paid (₹)</th><th style="border: 1px solid black; padding: 3px; text-align: right;">Balance (₹)</th></tr>
              </thead>
              <tbody>
                  <tr style="${updatedFields.tuitionPaid ? 'background-color: #e0f7fa;' : ''}">
                    <td style="border: 1px solid black; padding: 3px; text-align: left;">Tuition Fee</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${tuitionFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">
                      ${isEditing
                        ? `<input type="number" value="${editableBill?.tuitionPaid || 0}" style="width: 60px; padding: 2px; text-align: right; border: 1px solid #ccc; font-size: 10px;" />`
                        : `₹${(tuitionPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">₹${(tuitionPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${currentTuitionBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid black; padding: 3px; text-align: left;">Admission Fee</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${admissionFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${admissionPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${admissionPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${(admissionFee - admissionPaid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr style="${updatedFields.examPaid ? 'background-color: #e0f7fa;' : ''}">
                    <td style="border: 1px solid black; padding: 3px; text-align: left;">Exam Fee</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${examFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">
                      ${isEditing
                        ? `<input type="number" value="${editableBill?.examPaid || 0}" style="width: 60px; padding: 2px; text-align: right; border: 1px solid #ccc; font-size: 10px;" />`
                        : `₹${(examPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">₹${(examPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${currentExamBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr style="${updatedFields.busPaid ? 'background-color: #e0f7fa;' : ''}">
                    <td style="border: 1px solid black; padding: 3px; text-align: left;">Bus Fee</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${busFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">
                      ${isEditing
                        ? `<input type="number" value="${editableBill?.busPaid || 0}" style="width: 60px; padding: 2px; text-align: right; border: 1px solid #ccc; font-size: 10px;" />`
                        : `₹${(busPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">₹${(busPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${currentBusBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr style="${updatedFields.bookPaid ? 'background-color: #e0f7fa;' : ''}">
                    <td style="border: 1px solid black; padding: 3px; text-align: left;">Book Fee</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${bookFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">
                      ${isEditing
                        ? `<input type="number" value="${editableBill?.bookPaid || 0}" style="width: 60px; padding: 2px; text-align: right; border: 1px solid #ccc; font-size: 10px;" />`
                        : `₹${(bookPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">₹${(bookPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${currentBookBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr style="${updatedFields.uniformPaid ? 'background-color: #e0f7fa;' : ''}">
                    <td style="border: 1px solid black; padding: 3px; text-align: left;">Uniform Fee</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${uniformFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">
                      ${isEditing
                        ? `<input type="number" value="${editableBill?.uniformPaid || 0}" style="width: 60px; padding: 2px; text-align: right; border: 1px solid #ccc; font-size: 10px;" />`
                        : `₹${(uniformPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">₹${(uniformPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${currentUniformBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr style="${updatedFields.othersPaid ? 'background-color: #e0f7fa;' : ''}">
                    <td style="border: 1px solid black; padding: 3px; text-align: left;">
                      Other Fees${otherDescription ? `<div style="font-size: 9px;">${otherDescription}</div>` : ""}
                    </td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${othersFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">
                      ${isEditing
                        ? `<input type="number" value="${editableBill?.othersPaid || 0}" style="width: 60px; padding: 2px; text-align: right; border: 1px solid #ccc; font-size: 10px;" />`
                        : `₹${(othersPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">₹${(othersPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${currentOthersBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  ${dynamicFeeRows.map((row) => `
                    <tr>
                      <td style="border: 1px solid black; padding: 3px; text-align: left;">${row.label}</td>
                      <td style="border: 1px solid black; padding: 3px; text-align: right;">${row.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="border: 1px solid black; padding: 3px; text-align: right;">₹${row.paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="border: 1px solid black; padding: 3px; text-align: right;">₹${row.paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style="border: 1px solid black; padding: 3px; text-align: right;">${row.due.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                  <tr style="font-weight: bold; background-color: #f8f8f8;">
                    <td style="border: 1px solid black; padding: 3px; text-align: left;">GRAND TOTAL</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${totalAmountDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="border: 1px solid black; padding: 3px; text-align: right;">${totalRemainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
              </tbody>
          </table>
          <p style="font-style: italic; margin-top: 3px; font-size: 10px; font-weight: bold;"><strong>Paid Amount (in words):</strong> ${convertAmountToWords(totalPaidAmount)}</p>
          <div style="margin-top: 10px; font-size: 10px; font-weight: bold;">
              <p><strong>Payment Mode:</strong> ${paymentMode || 'Cash/Cheque/Online'}</p>
              ${(paymentMode === 'Cheque' || paymentMode === 'Online') ? `
                <p><strong>Cheque/Transaction No.:</strong> ___________________</p>
                <p><strong>Bank Name:</strong> ___________________</p>
              ` : ''}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:25px;font-size:10px;font-weight:bold;">
              <div style="border-top:1px dashed #000;width:100px;text-align:center;padding-top:3px">Parent's Signature</div>
              <div style="text-align:center;width:120px;">
                <div style="font-size:9px;margin-bottom:2px;">${localStorage.getItem("name") || ''}</div>
                <div style="border-top:1px dashed #000;width:120px;text-align:center;padding-top:3px">Authorised Signature</div>
              </div>
          </div>
      </div>
    `;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    try {
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write('<!DOCTYPEhtml><html><head><meta charset="UTF-8"></head><body></body></html>');
      iframeDoc.close();
      const contentToRender = receiptDiv.firstElementChild;
      iframeDoc.body.appendChild(contentToRender);
      iframeDoc.body.style.margin = '0';
      const style = iframeDoc.createElement('style');
      style.innerHTML = `
        * {
          font-family: Arial, sans-serif !important;
          -webkit-font-smoothing: none !important;
          font-smooth: never !important;
          text-rendering: geometricPrecision !important;
        }
        body, p, td, th, div { color: #000 !important; }
        h1 { color: #1e40af !important; font-weight: 700 !important; }
        table, th, td { border-color: #000 !important; }
        #student-info-table td {
          font-weight: 400 !important;
        }
        #student-info-table strong {
          font-weight: 700 !important;
        }
        table:not(#student-info-table) {
          font-weight: 900 !important;
        }
      `;
      iframeDoc.head.appendChild(style);
      await new Promise(resolve => setTimeout(resolve, 200));
      const canvas = await html2canvas(contentToRender, {
        scale: 3,
        backgroundColor: '#FFFFFF',
        useCORS: true,
        letterRendering: true,
      });
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'p' : 'l',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        hotfixes: ['px_scaling']
      });
      pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Fee_Receipt_${receiptNumber}_${studentData?.name || 'student'}.pdf`);
      const billData = {
        receiptNumber, studentData, tuitionFee, tuitionPaid, examFee, examPaid, busFee, busPaid, bookFee, bookPaid,
        uniformFee, uniformPaid, othersFee, othersPaid, totalAmount: totalAmountDue, paidAmount: totalPaidAmount,
        remainingAmount: totalRemainingAmount, paymentMode, currentDate: resolveReceiptPaidDate(searchResults) || new Date(), academicYear: getAcademicYear(),
        amountInWords: convertAmountToWords(totalPaidAmount), schoolName, discounts: { tuitionDiscount, bookDiscount },
        dynamicFeeRows,
        dynamicFeeDueTotal,
        dynamicFeePaidTotal
      };
      const updatedBills = [...generatedBills];
      const existingIndex = updatedBills.findIndex(bill => bill.receiptNumber === billData.receiptNumber);
      if (existingIndex > -1) updatedBills[existingIndex] = billData;
      else updatedBills.push(billData);
      setGeneratedBills(updatedBills);
      localStorage.setItem('generatedBills', JSON.stringify(updatedBills));
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }
  };

  // Format receipt number
  const formatReceiptNumber = (receiptNumber) => {
    const yearPosition = localStorage.getItem('yearPosition');
    const receiptYear = localStorage.getItem('receiptYear') || '';
    const receiptPrefix = localStorage.getItem('receiptPrefix') || '';
    const receiptSuffix = localStorage.getItem('receiptSuffix') || '';
    if (yearPosition === 'before') {
      return `${receiptYear}${receiptPrefix}${receiptNumber}${receiptSuffix}`;
    } else {
      return `${receiptPrefix}${receiptNumber}${receiptSuffix}${receiptYear}`;
    }
  };

  const buildReceiptLookupCandidates = (value) => {
    const raw = String(value ?? '').trim();
    const candidates = new Set();

    if (raw) {
      candidates.add(raw);
    }

    const compact = raw.replace(/\s+/g, '');
    if (compact) {
      candidates.add(compact);
    }

    const receiptYear = String(localStorage.getItem('receiptYear') || '').trim();
    const receiptPrefix = String(localStorage.getItem('receiptPrefix') || '').trim();
    const receiptSuffix = String(localStorage.getItem('receiptSuffix') || '').trim();
    const yearPosition = String(localStorage.getItem('yearPosition') || '').trim();

    let stripped = compact;
    if (yearPosition === 'before' && receiptYear && stripped.startsWith(receiptYear)) {
      stripped = stripped.slice(receiptYear.length);
    }
    if (yearPosition === 'after' && receiptYear && stripped.endsWith(receiptYear)) {
      stripped = stripped.slice(0, -receiptYear.length);
    }
    if (receiptPrefix && stripped.startsWith(receiptPrefix)) {
      stripped = stripped.slice(receiptPrefix.length);
    }
    if (receiptSuffix && stripped.endsWith(receiptSuffix)) {
      stripped = stripped.slice(0, -receiptSuffix.length);
    }
    stripped = stripped.trim();
    if (stripped) {
      candidates.add(stripped);
    }

    const numericOnly = compact.match(/\d+/g)?.join('') || '';
    if (numericOnly) {
      candidates.add(numericOnly);
    }

    return Array.from(candidates).filter(Boolean);
  };

  // Preview options
  const previewOptions = [
    { value: 1, label: 'Preview: 1 Copy' },
    { value: 2, label: 'Preview: 2 Copies' },
    { value: 4, label: 'Preview: 4 Copies' }
  ];

  // Print options
  const printOptions = [
    { value: 1, label: 'Print 1 Sheet (2 Copies)' }
  ];

  // Get preview display name
  const getPreviewDisplayName = (mode) => {
    return `Preview: ${mode} Copy${mode > 1 ? 'ies' : ''}`;
  };

  const deleteBill = async (receiptNumber) => {
    const comments = window.prompt('Enter comments for principal approval before deleting this receipt:');
    if (comments === null) return;
    if (!comments.trim()) {
      alert('Comments are required to request deletion.');
      return;
    }
    try {
      const schoolCode = localStorage.getItem('schoolCode');
      const response = await axios.post(
        `https://cleezoclass.com:4000/api/bill/delete-request/${receiptNumber}`,
        {
          comments,
          requestedBy: localStorage.getItem('name') || localStorage.getItem('username') || 'Accountant',
          studentName: studentData?.name || ''
        },
        { params: { schoolCode } }
      );
      if (response.status === 200 || response.status === 201) {
        alert('Deletion request sent to principal/admin for approval.');
      }
    } catch (error) {
      console.error('Error requesting bill deletion:', error);
      alert(error.response?.data?.message || 'Failed to request bill deletion. Please try again.');
    }
  };

  const handlePrintReceipt = async (receipt) => {
    const loaded = await searchBillsByReceiptNumber(receipt.receiptNumber);
    if (loaded) {
      setTimeout(() => confirmPrint(1), 350);
    }
  };
// 1. Add state for the toggle

// 2. Filter the students array based on the toggle and receipt data

  const fetchStudents = async (className, section) => {
    if (!className || !section) {
      console.warn("[fetchStudents] className or section is missing. Aborting fetch.");
      return;
    }
    const schoolCode = localStorage.getItem('schoolCode');
    console.log(`[fetchStudents] Using schoolCode: ${schoolCode}`);
    const primaryUrl = `https://cleezoclass.com:4000/api/studentsNameAccountant/${className}?schoolCode=${schoolCode}&section=${section}`;
    const fallbackUrl = `https://cleezoclass.com:4000/api/studentsName/${className}?schoolCode=${schoolCode}&section=${section}`;
    let url = primaryUrl;
    console.log(`[fetchStudents] API Request URL: ${url}`);
    try {
      let res;
      try {
        res = await axios.get(primaryUrl);
      } catch (primaryErr) {
        console.warn("[fetchStudents] Accountant student API failed, trying basic student API:", primaryErr.message);
        url = fallbackUrl;
        res = await axios.get(fallbackUrl);
      }
      console.log("[fetchStudents] Full API Response:", res.data);
      if (res.data && res.data.students) {
        console.log(`[fetchStudents] Success! Found ${res.data.students.length} students.`);
        const fetchedStudents = res.data.students;
        const feeStudents = fetchedStudents.filter((student) => hasFeeData(student));
        const displayStudents = feeStudents.length > 0 ? feeStudents : fetchedStudents;
        setStudents(fetchedStudents);
        if (displayStudents.length > 0) {
          const defaultId = displayStudents[0].id;
          console.log(`[fetchStudents] Auto-selecting first student (ID: ${defaultId})`);
          setSelectedStudentId(defaultId);
          setIsPreviewPopupOpen(true);
        } else {
          console.warn("[fetchStudents] List is empty for this class/section.");
          setStudents([]);
          setSelectedStudentId(null);
        }
      }
    } catch (err) {
      console.error("[fetchStudents] Error during API call:");
      console.error(" - Message:", err.message);
      console.error(" - Response Data:", err.response?.data);
      console.error(" - Status Code:", err.response?.status);
    }
  };
  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents(selectedClass, selectedSection);
    }
  }, [selectedClass, selectedSection]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((student) => String(student.id) === String(selectedStudentId)) || null;
  }, [selectedStudentId, students]);

  const tuitionDiscount = payments?.discounts?.tuitionDiscount || 0;
  const feeDiscount = payments?.discounts?.feeDiscount || 0;
  const bookDiscount = payments?.discounts?.appliedTo?.includes('Books Fee') ? feeDiscount : 0;
  const previewTuitionPaid = isEditing ? (parseFloat(editableBill?.tuitionPaid) || 0) : (tuitionPaid || 0);
  const previewExamPaid = isEditing ? (parseFloat(editableBill?.examPaid) || 0) : (examPaid || 0);
  const previewBusPaid = isEditing ? (parseFloat(editableBill?.busPaid) || 0) : (busPaid || 0);
  const previewBookPaid = isEditing ? (parseFloat(editableBill?.bookPaid) || 0) : (bookPaid || 0);
  const previewUniformPaid = isEditing ? (parseFloat(editableBill?.uniformPaid) || 0) : (uniformPaid || 0);
  const previewOthersPaid = isEditing ? (parseFloat(editableBill?.othersPaid) || 0) : (othersPaid || 0);
  const otherDescription = (othersDescription || '').trim();
  const currentTuitionBalance = Math.max((tuitionFee || 0) - tuitionDiscount - previewTuitionPaid, 0);
  const currentExamBalance = Math.max((examFee || 0) - previewExamPaid, 0);
  const currentBusBalance = Math.max((busFee || 0) - previewBusPaid, 0);
  const currentBookBalance = Math.max((bookFee || 0) - bookDiscount - previewBookPaid, 0);
  const currentUniformBalance = Math.max((uniformFee || 0) - previewUniformPaid, 0);
  const currentOthersBalance = Math.max((othersFee || 0) - previewOthersPaid, 0);
  const totalAmountDue =
    ((tuitionFee || 0) - tuitionDiscount) +
    (examFee || 0) +
    (busFee || 0) +
    ((bookFee || 0) - bookDiscount) +
    (uniformFee || 0) +
    (othersFee || 0) +
    (admissionFee || 0) +
    (residentialFee || 0) +
    dynamicFeeDueTotal;
  const totalPaidAmount =
    previewTuitionPaid +
    (admissionPaid || 0) +
    previewExamPaid +
    previewBusPaid +
    previewBookPaid +
    previewUniformPaid +
    previewOthersPaid +
    (residentialPaid || 0) +
    dynamicFeePaidTotal;
  const totalRemainingAmount = Math.max(totalAmountDue - totalPaidAmount, 0);
  const paymentTuitionFee = payments?.completeFee
    ? (payments.completeFee || 0) -
      ((payments.examFee || 0) +
        (payments.bookFee || 0) +
        (payments.uniformFee || 0) +
        (payments.othersFee || 0) +
        (payments.admissionFee || 0))
    : 0;
  const selectedStudentFeeRows = useMemo(() => {
    if (!selectedStudent || !hasFeeData(selectedStudent)) return [];

    const dynamicRowsFromStudent = Object.entries(selectedStudent)
      .filter(([key, value]) => {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) && numericValue > 0 && /_total$/i.test(key);
      })
      .map(([key, value]) => {
        const baseKey = key.replace(/_total$/i, "");
        const paid = readNumericField(selectedStudent, [
          `${baseKey}_paid`,
          `${baseKey}Paid`,
          `${baseKey}_paid_amount`,
        ]);
        return {
          label: getDynamicFeeLabel(baseKey),
          value: Number(value) || 0,
          paid,
        };
      });

    if (dynamicRowsFromStudent.length > 0) {
      return dynamicRowsFromStudent;
    }

    const totalPaidFromStudent = readNumericField(selectedStudent, ["total_paid", "totalPaid", "Paid_Amount", "paidAmount"]);
    const totalDueFromStudent = readNumericField(selectedStudent, ["total_due", "totalDue", "totalRemaining"]);
    const totalFromStudent = readNumericField(selectedStudent, ["CompleteFee", "completeFee", "Final_Amount", "totalAmount"]);
    const summaryTotal = totalFromStudent > 0 ? totalFromStudent : totalPaidFromStudent + totalDueFromStudent;

    return summaryTotal > 0
      ? [{ label: "Fee Bill", value: summaryTotal, paid: totalPaidFromStudent }]
      : [];
  }, [getDynamicFeeLabel, hasFeeData, readNumericField, selectedStudent]);

  const baseFeeTypeRows = [
    { label: 'Tuition Fee', value: Math.max((paymentTuitionFee || tuitionFee || 0) - tuitionDiscount, 0) },
    { label: 'Admission Fee', value: payments?.admissionFee || admissionFee || 0 },
    { label: 'Residential Fee', value: payments?.residentialFee || residentialFee || 0 },
    { label: 'Exam Fee', value: payments?.examFee || examFee || 0 },
    { label: 'Book Fee', value: Math.max((payments?.bookFee || bookFee || 0) - bookDiscount, 0) },
    { label: 'Bus Fee', value: payments?.busFee || busFee || 0 },
    { label: 'Uniform Fee', value: payments?.uniformFee || uniformFee || 0 },
    { label: 'Other Fees', value: payments?.othersFee || othersFee || 0, description: otherDescription },
    ...dynamicFeeRows.map((row) => ({ label: row.label, value: row.total })),
  ].filter((fee) => fee.value > 0);
  const feeTypeRows = baseFeeTypeRows.length > 0 ? baseFeeTypeRows : selectedStudentFeeRows;
  const currentReceiptPaidTotal = receiptPaidRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const baseFeeDetailRows = (isReceiptLookup && receiptPaidRows.length > 0 ? receiptPaidRows : [
    { label: 'Tuition Fee', amount: previewTuitionPaid },
    { label: 'Admission Fee', amount: admissionPaid || 0 },
    { label: 'Residential Fee', amount: residentialPaid || 0 },
    { label: 'Exam Fee', amount: previewExamPaid },
    { label: 'Bus Fee', amount: previewBusPaid },
    { label: 'Book Fee', amount: previewBookPaid },
    { label: 'Uniform Fee', amount: previewUniformPaid },
    { label: 'Other Fees', amount: previewOthersPaid, description: otherDescription },
    ...dynamicFeeRows.map((row) => ({ label: row.label, amount: row.paid })),
  ]).filter((fee) => fee.amount > 0);
  const feeDetailRows = baseFeeDetailRows.length > 0
    ? baseFeeDetailRows
    : selectedStudentFeeRows
        .filter((row) => Number(row.paid || 0) > 0)
        .map((row) => ({ label: row.label, amount: Number(row.paid || 0) }));
  const receiptTableRows = (() => {
    const rowsByLabel = new Map();

    feeTypeRows.forEach((fee) => {
      rowsByLabel.set(fee.label, {
        label: fee.label,
        description: fee.description || "",
        total: Number(fee.value || 0),
        paidNow: 0,
      });
    });

    feeDetailRows.forEach((paidRow) => {
      const existing = rowsByLabel.get(paidRow.label) || {
        label: paidRow.label,
        description: "",
        total: 0,
        paidNow: 0,
      };
      const paidNow = Number(paidRow.amount || 0);
      rowsByLabel.set(paidRow.label, {
        ...existing,
        description: existing.description || paidRow.description || "",
        total: existing.total > 0 ? existing.total : paidNow,
        paidNow: existing.paidNow + paidNow,
      });
    });

    return Array.from(rowsByLabel.values())
      .map((row) => ({
        ...row,
        balance: Math.max((Number(row.total) || 0) - (Number(row.paidNow) || 0), 0),
      }))
      .filter((row) => row.paidNow > 0);
  })();
  const receiptPaidNowTotal = receiptTableRows.reduce((sum, row) => sum + row.paidNow, 0);
  const receiptTotalAmount = receiptTableRows.reduce((sum, row) => sum + row.total, 0);

  // Render component
  return (
    <div style={{ minHeight: '100vh', padding: '1rem', backgroundColor: 'white' }}>
      <div style={{ maxWidth: '1500px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            {(!localStorage.getItem('lastReceiptNumber') || isReceiptNumberEditorOpen) && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                
             
                {localStorage.getItem('lastReceiptNumber') && (
                  <button
                    onClick={() => setIsReceiptNumberEditorOpen(false)}
                    className='btn-solid1'
                    style={{ backgroundColor: '#6b7280' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '290px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                  Search Previous Bill by Receipt Number
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    placeholder="Enter receipt number"
                  />
                  <button
                    onClick={() => searchBillsByReceiptNumber(searchTerm)}
                    disabled={isSearching}
                    className='btn-solid1'
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
     
              <button
                type="button"
                onClick={clearFilters}
                className='btn-solid1'
                style={{ backgroundColor: '#6b7280' }}
              >
                Clear Filters
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Select Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
  const value = e.target.value;

  setIsPreviewPopupOpen(false);

  setIsReceiptLookup(false);
  setSelectedClass(value);
  setSelectedSection("");
  setSelectedStudentId(null);
}}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    disabled={dropdownLoading || isEditing}
                  >
                    <option value="">-- Select a class --</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>
                        {cls === "Nursery" || cls === "LKG" || cls === "UKG" ? cls : `Class ${cls}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Select Section
                  </label>
                  <select
                    value={selectedSection}
                  onChange={(e) => {
  setIsPreviewPopupOpen(false);

  setIsReceiptLookup(false);
  setSelectedSection(e.target.value);
  setSelectedStudentId(null);
}}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    disabled={!selectedClass || dropdownLoading || isEditing}
                  >
                    <option value="">-- Select a section --</option>
                    {filteredSections.map(section => (
                      <option key={section} value={section}>{section.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Search Student
                  </label>
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="Search by name..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                  />
                </div>
                <div style={{ minWidth: '200px', paddingBottom: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={onlyWithReceipts}
                      onChange={(e) => {
                        setOnlyWithReceipts(e.target.checked);
                        setSelectedStudentId(null);
                        setIsPreviewPopupOpen(false);
                      }}
                      disabled={isEditing}
                    />
                    Show only students with fees
                  </label>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                    Select Student
                  </label>
                  <select
                    value={selectedStudentId || ''}
                 onChange={(e) => {
  const studentId = e.target.value ? parseInt(e.target.value, 10) : null;

  setIsReceiptLookup(false);
  setSelectedStudentId(studentId);
  setIsPreviewPopupOpen(!!studentId);
}}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', fontSize: '0.875rem' }}
                    disabled={!selectedClass || !selectedSection || dropdownLoading || isEditing}
                  >
                    <option value="">-- Select a student --</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} (Roll No: {student.id})
                      </option>
                    ))}
                  </select>
                  {selectedClass && selectedSection && students.length > 0 && filteredStudents.length === 0 && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#b45309' }}>
                      No students with fee bills found for this class and section.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        

        {lastReceipt && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
              Last Previous Receipt
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p><strong>Receipt No:</strong> {lastReceipt.receiptNumber}</p>
              <p><strong>Date:</strong> {formatDate(lastReceipt.created_at)}</p>
              <button
                onClick={() => searchBillsByReceiptNumber(lastReceipt.receiptNumber)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                View/Print
              </button>
            </div>
          </div>
        )}

        {studentReceipts.length > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
              Previous Receipts for {studentData?.name}
            </h3>
            <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Receipt No.</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Date</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentReceipts.map((receipt) => (
                  <tr
                    key={receipt.receiptNumber}
                    onClick={() => searchBillsByReceiptNumber(receipt.receiptNumber)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{receipt.receiptNumber}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(receipt.created_at)}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintReceipt(receipt);
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          borderRadius: '0.25rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          marginRight: '0.5rem'
                        }}
                      >
                        Print
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBill(receipt.receiptNumber);
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          borderRadius: '0.25rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

         
       

        <PopupModal isOpen={   selectedClass &&
    selectedSection &&
    selectedStudentId &&
    initialReceiptSet &&
    isPreviewPopupOpen
  }
onClose={() => setIsPreviewPopupOpen(false)}
    
   >
          <div style={{ textAlign: 'center', padding: '1rem' }}>
             <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
          
            {isStudentBillLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <FileText style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: '0.5' }} />
                <p style={{ fontSize: '1rem' }}>Loading fee bill...</p>
              </div>
            ) : studentData?.name && receiptTableRows.length > 0 ? (
              <div id="bill-preview-content" style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', fontFamily: 'Arial, sans-serif', fontSize: '10px' }}>
                <div style={{ border: '1px solid black', padding: '10px', width: '300px', position: 'relative', backgroundColor: 'white', color: '#000000', fontWeight: '900' }}>
                  {isEditing && (
                    <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '8px', fontWeight: 'bold' }}>
                      EDIT MODE
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem', color: 'black', fontWeight: '900' }}>
                    <div style={{ width: '40px', height: '40px', border: '2px solid white', borderRadius: '6px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: '10px' }}>
                      <img
                        src={dynamicLogoSrc || 'https://via.placeholder.com/40'}
                        alt="Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <h1 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e40af', marginBottom: '0.1rem' }}>
                        {schoolName || 'School Name'}
                      </h1>
                      <div style={{ margin: '3px 0', padding: '2px 0', fontWeight: 'bold', fontSize: '10px' }}>FEES RECEIPT</div>
                    </div>
                  </div>
                  <table style={{ width: '100%', marginBottom: '0.1rem', fontSize: '10px', color: 'black', fontWeight: '900' }}>
                    <tbody>
                      <tr>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Receipt No:</strong>
                          <span style={{ fontWeight: 'bold' }}>
                            {formatReceiptNumber(receiptNumber)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Paid Date:</strong>
                          {` ${resolveReceiptPaidDate(searchResults)
                            ? formatDate(resolveReceiptPaidDate(searchResults))
                            : 'No payment date available'}`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Regn.No:</strong>
                          {` ${studentData.rollNumber}`}
                        </td>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Academic Year:</strong>
                          {` ${getAcademicYear()}`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', width: '50%', fontSize: '10px' }}>
                          <strong>Student Name:</strong>
                          {` ${studentData.name}`}
                        </td>
                        <td style={{ textAlign: 'left', width: '50%', fontSize: '10px' }}>
                          <strong>Father Name:</strong>
                          {` ${studentData.fatherName}`}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Class:</strong>
                          {` ${studentData.class.toUpperCase()}`}
                        </td>
                        <td style={{ textAlign: 'left', fontSize: '10px' }}>
                          <strong>Section:</strong>
                          {` ${studentData.section}`}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '0.5rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                        <th style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>S.NO</th>
                        <th style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>Fee Details</th>
                        <th style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>Total (₹)</th>
                        <th style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>Paid Now (₹)</th>
                        <th style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptTableRows.map((item, index) => (
                        <tr key={index}>
                          <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>
                            {index + 1}
                          </td>
                          <td style={{ border: '1px solid black', padding: '3px', textAlign: 'left' }}>
                            {item.label}
                            {item.description ? (
                              <div style={{ fontSize: '9px' }}>{item.description}</div>
                            ) : null}
                          </td>
                          <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                            ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right', color: 'green' }}>
                            ₹{item.paidNow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>
                            ₹{item.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#f9fafb', fontWeight: 'bold' }}>
                        <td colSpan="2" style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>Total</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>₹{receiptTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right', color: 'green' }}>₹{receiptPaidNowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td style={{ border: '1px solid black', padding: '3px', textAlign: 'right' }}>₹{Math.max(receiptTotalAmount - receiptPaidNowTotal, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p style={{ fontStyle: 'italic', marginTop: '3px', fontSize: '10px' }}>
                    <strong>Paid Amount (in words):</strong> {convertAmountToWords(receiptPaidNowTotal || totalPaidAmount)}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 'bold', padding: '5px 10px' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '10px' }}>
                    <p><strong>Payment Mode:</strong></p>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '3px', fontSize: '10px' }}>
                        <label>
                          <input
                            type="radio"
                            name="paymentMode"
                            value="Cash"
                            checked={editableBill?.paymentMode === 'Cash'}
                            onChange={() => handleEditChange('paymentMode', 'Cash')}
                            style={{ marginRight: '3px' }}
                          />
                          Cash
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="paymentMode"
                            value="Cheque"
                            checked={editableBill?.paymentMode === 'Cheque'}
                            onChange={() => handleEditChange('paymentMode', 'Cheque')}
                            style={{ marginRight: '3px' }}
                          />
                          Cheque
                        </label>
                        <label>
                          <input
                            type="radio"
                            name="paymentMode"
                            value="Online"
                            checked={editableBill?.paymentMode === 'Online'}
                            onChange={() => handleEditChange('paymentMode', 'Online')}
                            style={{ marginRight: '3px' }}
                          />
                          Online
                        </label>
                      </div>
                    ) : (
                      <p>{paymentMode || 'Cash/Cheque/Online'}</p>
                    )}
                    {(paymentMode === 'Cheque' || paymentMode === 'Online') && (
                      <div style={{ marginTop: '5px', fontSize: '10px' }}>
                        <p><strong>Cheque/Transaction No.:</strong> ___________________</p>
                        <p><strong>Bank Name:</strong> ___________________</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', fontSize: '10px' }}>
                    <div style={{ borderTop: '1px dashed #000', width: '100px', textAlign: 'center', paddingTop: '3px' }}>
                      Parent's Signature
                    </div>
                    <div style={{ textAlign: 'center', width: '120px' }}>
                      <div style={{ fontSize: '9px', marginBottom: '2px' }}>{localStorage.getItem('name') || ''}</div>
                      <div style={{ borderTop: '1px dashed #000', width: '120px', textAlign: 'center', paddingTop: '3px' }}>
                        Authorised Signature
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : studentData?.name ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <FileText style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: '0.5' }} />
                <p style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>No fee bill found for this student</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Please select another student or create/assign fees for this student first.
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <FileText style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem', opacity: '0.5' }} />
                <p style={{ fontSize: '1rem' }}>Select a student to preview the bill</p>
              </div>
            )}
          </div>
          </div>
        </PopupModal>
      </div>
    </div>
  );
};

const PopupModal = ({ isOpen, onClose, children, style, contentStyle }) => {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "20px",
        boxSizing: "border-box",
        cursor: "pointer",
        ...style
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "8px",
          width: "auto",
          minWidth: "300px",
          maxWidth: "500px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
          cursor: "auto",
          ...contentStyle
        }}
      >
        {children}
        <button
          onClick={onClose}
          style={{
            marginTop: "20px",
            padding: "8px 16px",
            cursor: "pointer",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "0.375rem",
            fontWeight: "500"
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default GenerateBills;