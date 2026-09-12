import { ArrowLeft, Download, Pencil, Share, Trash2, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

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

  if (normalized === "guide" || normalized === "guides") {
    addAll("guide", "guides");
  }

  if (normalized === "book" || normalized === "books") {
    addAll("book", "books");
  }

  if (normalized === "hostel" || normalized === "hostal") {
    addAll("hostel", "hostal", "hostel_fee", "hostal_fee");
  }

  if (normalized === "library" || normalized === "libraryfee") {
    addAll("library", "library_fee", "libraryfee");
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
  if (!source) return undefined;

  const entries = Object.entries(source);

  for (const key of keys) {
    if (!key) continue;
    const normalizedKey = normalizeFeeFieldName(key);

    for (const [sourceKey, raw] of entries) {
      if (normalizeFeeFieldName(sourceKey) !== normalizedKey) continue;
      if (raw === undefined || raw === null || raw === "") continue;
      const value = Number(raw);
      if (Number.isFinite(value)) return value;
    }
  }

  return undefined;
};

const normalizeStudentName = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const normalizeStudentId = (value = "") => String(value || "").trim();

const getStudentLookupKey = (student = {}) => {
  const studentId = normalizeStudentId(
    student?.id ||
      student?.student_id ||
      student?.studentId ||
      student?.rollNumber ||
      student?.roll_number ||
      ""
  );

  if (studentId) return `id:${studentId}`;

  const studentName = normalizeStudentName(student?.name || student?.StudentName || "");
  return studentName ? `name:${studentName}` : "";
};

const isSameStudentRecord = (entry = {}, student = {}) => {
  const entryId = normalizeStudentId(
    entry?.id ||
      entry?.studentId ||
      entry?.student_id ||
      entry?.StudentId ||
      entry?.Student_ID ||
      entry?.rollNumber ||
      entry?.roll_number ||
      entry?.RollNumber ||
      ""
  );
  const studentId = normalizeStudentId(
    student?.id || student?.student_id || student?.studentId || student?.rollNumber || student?.roll_number || ""
  );
  const entryName = normalizeStudentName(
    entry?.studentName || entry?.StudentName || entry?.name || entry?.student || ""
  );
  const studentName = normalizeStudentName(student?.name || student?.StudentName || "");

  return (
    (studentId && entryId && studentId === entryId) ||
    (studentName && entryName && studentName === entryName)
  );
};

const getStudentFeePayloadCandidates = (payload) => {
  const candidates = [];
  const pushCandidate = (candidate) => {
    if (candidate && typeof candidate === "object") candidates.push(candidate);
  };

  if (Array.isArray(payload)) {
    payload.forEach(pushCandidate);
  } else {
    pushCandidate(payload);
  }

  pushCandidate(payload?.studentDetails);
  pushCandidate(payload?.FeesDetails);
  pushCandidate(payload?.feeDetails);
  pushCandidate(payload?.paymentData);
  pushCandidate(payload?.payments);
  pushCandidate(payload?.data);
  pushCandidate(payload?.result);

  return candidates;
};

const findSavedIndividualFeeAmountForStudent = (payload, student, fee) => {
  const feeAliases = Array.from(
    new Set([
      fee?.columnBase,
      fee?.feeName,
      ...getFeeKeyAliases(fee?.columnBase),
      ...getFeeKeyAliases(fee?.feeName),
    ])
  )
    .filter(Boolean)
    .map((item) => String(item));
  const normalizedFeeAliases = feeAliases.map((item) => normalizeFeeFieldName(item)).filter(Boolean);

  const candidates = getStudentFeePayloadCandidates(payload);
  for (const candidate of candidates) {
    const assignmentSources = [
      candidate?.individualFeeAssignments,
      candidate?.feeEntries,
      candidate?.feeDescriptions,
    ];

    for (const assignments of assignmentSources) {
      if (!Array.isArray(assignments)) continue;

      for (const entry of assignments) {
        if (student && !isSameStudentRecord(entry, student)) continue;

        const entryKey = normalizeFeeFieldName(
          entry?.type || entry?.columnBase || entry?.feeName || entry?.label || ""
        );

        if (!entryKey || !normalizedFeeAliases.includes(entryKey)) continue;

        const amount = Number(
          entry?.amount ?? entry?.total ?? entry?.feeAmount ?? entry?.value ?? entry?.assignedAmount ?? 0
        );

        if (Number.isFinite(amount)) return amount;
      }
    }

    const directAmount = readFirstNumericValue(candidate, feeAliases);
    if (directAmount !== undefined) return directAmount;
  }

  return undefined;
};

const normalizeClassSelectionValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(Nursery|LKG|UKG)$/i.test(raw)) {
    return raw.toUpperCase() === "NURSERY" ? "Nursery" : raw.toUpperCase();
  }
  if (/^Class\s+/i.test(raw)) return raw;
  return raw;
};

const normalizeClassComparisonValue = (value) => {
  const normalized = normalizeClassSelectionValue(value);
  return String(normalized || "")
    .trim()
    .replace(/^Class\s+/i, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
};

const sortClassOptions = (items = []) => {
  const order = new Map([
    ["nursery", 0],
    ["lkg", 1],
    ["ukg", 2],
  ]);

  const getRank = (value) => {
    const normalized = normalizeClassComparisonValue(value);
    if (!normalized) return Number.MAX_SAFE_INTEGER;
    if (order.has(normalized)) return order.get(normalized);
    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) return 10 + numeric;
    return 1000 + normalized.charCodeAt(0);
  };

  return [...new Set(items.map((item) => normalizeClassSelectionValue(item)).filter(Boolean))].sort(
    (a, b) => {
      const rankDelta = getRank(a) - getRank(b);
      if (rankDelta !== 0) return rankDelta;
      return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
    }
  );
};

const sortSectionOptions = (items = []) =>
  [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );

const ToastNotification = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
  const textColor = 'white';
  const borderColor = type === 'success' ? '#388E3C' : '#D32F2F';

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: backgroundColor,
      color: textColor,
      padding: '15px 25px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${borderColor}`,
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'opacity 0.3s ease-in-out',
      opacity: visible ? 1 : 0,
      minWidth: '250px',
      textAlign: 'center'
    }}>
      {message}
    </div>
  );
};

const IncomeForm5 = ({ selectedClassSection, embeddedInPopup = false, onFeeStructurePreviewChange }) => {
  const popupLayout = embeddedInPopup;
  const [fees, setFees] = useState({
    tuition: 0,
    exam: 0,
    bus: 0,
    uniform: 0,
    books: 0,
    admission: 0,
    other: 0,
    previousfeedue: 0,
    residential: 0,

  });
  const [students, setStudents] = useState([]);
  const [studentDiscount, setStudentDiscount] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [incomeType, setIncomeType] = useState('fees');
  const [showBusFeePopup, setShowBusFeePopup] = useState(false);
  const [busFeeStudents, setBusFeeStudents] = useState([]);
  const [showIndividualStudentPopup, setShowIndividualStudentPopup] = useState(false);
  const [selectedBusStudent, setSelectedBusStudent] = useState(null);
  const [busFeeAmount, setBusFeeAmount] = useState('');
  const [busFeeFrequency, setBusFeeFrequency] = useState('monthly');
  const [oldBusFee, setOldBusFee] = useState(null);
  const [oldFrequencyType, setOldFrequencyType] = useState('');
  const [loginId, setLoginId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showIndividualFeeStudentPopup, setShowIndividualFeeStudentPopup] = useState(false);
  const [activeIndividualFee, setActiveIndividualFee] = useState(null);
  const [individualFeeStudentMap, setIndividualFeeStudentMap] = useState({});
  const [individualFeeBatchMap, setIndividualFeeBatchMap] = useState({});
  const [individualFeeStudentSavedAmounts, setIndividualFeeStudentSavedAmounts] = useState({});
  const [individualFeeDraftAmount, setIndividualFeeDraftAmount] = useState("");
  const [individualFeeStudentSearch, setIndividualFeeStudentSearch] = useState("");
  const [feeEntries, setFeeEntries] = useState([
    { type: '', amount: '' }
  ]);
  const [dynamicFeeTypes, setDynamicFeeTypes] = useState([]);
  const [dynamicFeeValues, setDynamicFeeValues] = useState({});
  const [feeTypeInstallmentCounts, setFeeTypeInstallmentCounts] = useState({});
  const [feeTypeInstallmentDetails, setFeeTypeInstallmentDetails] = useState({});
  const getFeeInstallmentScopeKey = (feeTypeId, targetClass = className, targetSection = section) =>
    `${String(targetClass || "").trim()}|${String(targetSection || "").trim()}|${feeTypeId}`;
  const [isCompactFeeRowLayout, setIsCompactFeeRowLayout] = useState(false);
  const individualFeeAmountInputRefs = useRef({});
  const localDynamicFeeValueOverridesRef = useRef({});
  const localDynamicFeeValueScopeRef = useRef("");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const updateLayoutMode = () => setIsCompactFeeRowLayout(mediaQuery.matches);

    updateLayoutMode();
    mediaQuery.addEventListener("change", updateLayoutMode);

    return () => mediaQuery.removeEventListener("change", updateLayoutMode);
  }, []);
const allFeeTypes = [
  { value: 'admission', label: 'Admission Fee' },
  { value: 'tuition', label: 'Tuition Fee' },
  { value: 'exam', label: 'Exam Fee' },
  { value: 'bus', label: 'Bus Fee' },
  { value: 'residential', label: 'Residential Fee' },
  { value: 'uniform', label: 'Uniform Fee' },
  { value: 'books', label: 'Books Fee' },
  { value: 'other', label: 'Other Fees' },
  { value: 'previousfeedue', label: 'Previous Fee Due' },
];


  const handleBusFeeSelect = async () => {
    if (!className || !section) {
      displayToast('Please select both class and section', "error");
      return;
    }
    try {
      const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
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
  admission: "",
  tuition: "",
  exam: "",
  uniform: "",
  books: "",
  other: "",
  previousfeedue: "",
  residential: "",
});


  useEffect(() => {
    const fetchOldBusFee = async () => {
      try {
        const schoolCode = localStorage.getItem('schoolCode');
        const response = await axios.post('https://cleezoclass.com:4000/get-bus-fee', {
          studentName: selectedBusStudent?.name,
          className: className.replace("Class ", ""),
          sectionName: section,
          schoolCode: schoolCode,
        });
        if (response.data.FeesDetails) {
          setOldBusFee(response.data.FeesDetails.Bus_fees);
          setOldFrequencyType(response.data.FeesDetails.frequency_type);
          setLoginId(response.data.login_id);
        }
      } catch (error) {
        console.error('Error fetching old bus fee:', error);
      }
    };
    if (showIndividualStudentPopup) {
      fetchOldBusFee();
    }
  }, [showIndividualStudentPopup]);

  const handleEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || 0);
  };

  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [classList, setClassList] = useState([]);
  const [sectionMap, setSectionMap] = useState([]);
  const [metadataLoading, setMetadataLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchClassAndSectionMetadata = async () => {
      try {
        const schoolCode = localStorage.getItem('schoolCode');
        if (!schoolCode) return;

        setMetadataLoading(true);

        const [classRes, sectionRes] = await Promise.all([
          axios.get('https://cleezoclass.com:4000/api/admin/classes', {
            params: { schoolCode },
          }),
          axios.get('https://cleezoclass.com:4000/api/admin/sectionFilter', {
            params: { schoolCode },
          }),
        ]);

        const fetchedClasses = Array.isArray(classRes.data)
          ? classRes.data
          : classRes.data?.classes || classRes.data?.classList || classRes.data?.data || classRes.data?.result || [];
        const fetchedSections = Array.isArray(sectionRes.data)
          ? sectionRes.data
          : sectionRes.data?.sections || sectionRes.data?.sectionList || sectionRes.data?.data || sectionRes.data?.result || [];

        if (!isActive) return;

        setClassList(sortClassOptions(fetchedClasses));
        setSectionMap(
          fetchedSections
            .map((row) => ({
              class_name: normalizeClassSelectionValue(row?.class_name || row?.className || row?.class || ""),
              section: String(row?.section || row?.section_name || row?.sectionName || "").trim(),
            }))
            .filter((row) => row.class_name && row.section)
        );
      } catch (error) {
        console.error('Failed to fetch class/section metadata:', error);
      } finally {
        if (isActive) {
          setMetadataLoading(false);
        }
      }
    };

    fetchClassAndSectionMetadata();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const incomingClass = normalizeClassSelectionValue(selectedClassSection?.class || '');
    const incomingSection = selectedClassSection?.section || '';

    // Only prefill from parent when a real class/section is supplied.
    // Otherwise parent rerenders would keep wiping out manual dropdown selection.
    if (incomingClass) {
      setClassName(incomingClass);
    }
    if (incomingSection) {
      setSection(incomingSection);
    }
  }, [selectedClassSection]);

  const availableClassOptions = React.useMemo(() => {
    return sortClassOptions([...classList, className]);
  }, [classList, className]);

  const availableSectionOptions = React.useMemo(() => {
    const currentClassKey = normalizeClassComparisonValue(className);
    const matchingSections = sectionMap
      .filter((row) => normalizeClassComparisonValue(row.class_name) === currentClassKey)
      .map((row) => row.section);

    return sortSectionOptions(matchingSections);
  }, [className, sectionMap]);

  const sectionSelectOptions = React.useMemo(() => {
    if (!section) return availableSectionOptions;
    if (availableSectionOptions.includes(section)) return availableSectionOptions;
    return sortSectionOptions([section, ...availableSectionOptions]);
  }, [availableSectionOptions, section]);

  useEffect(() => {
    if (!section) return;
    if (availableSectionOptions.length === 0) return;
    if (!availableSectionOptions.includes(section)) {
      setSection("");
    }
  }, [availableSectionOptions, section]);

  useEffect(() => {
    const fetchDynamicFeeTypes = async () => {
      try {
        const schoolCode = localStorage.getItem('schoolCode');
        if (!schoolCode) return;

        const response = await axios.get('https://cleezoclass.com:4000/api/fee-types', {
          params: { schoolCode },
        });

// Inside fetchDynamicFeeTypes useEffect
const rows = Array.isArray(response.data?.data) ? response.data.data : [];
let normalized = rows
  .map((item) => {
    const columnBase = normalizeFeeColumnBase(item?.feeName);
    if (!columnBase) return null;
    return {
      id: item?.id,
      feeName: item?.feeName || columnBase,
      feesType: item?.feesType || 'Custom Fee',
      scope: item?.scope || 'All',
      frequency: item?.frequency || 'One time',
      installments: item?.installments || 1,
      columnBase,
    };
  })
  .filter(Boolean);

// 👇 ADD THIS: Include static fees if missing
// const staticFees = [
//   { columnBase: 'admission', feeName: 'Admission Fee' },
//   { columnBase: 'tuition', feeName: 'Tuition Fee' },
//   { columnBase: 'exam', feeName: 'Exam Fee' },
//   { columnBase: 'bus', feeName: 'Bus Fee' },
//   { columnBase: 'uniform', feeName: 'Uniform Fee' },
//   { columnBase: 'books', feeName: 'Books Fee' }, // 👈 This fixes Book Fee
//   { columnBase: 'other', feeName: 'Other Fees' },
//   { columnBase: 'residential', feeName: 'Residential Fee' },
//   { columnBase: 'previousfeedue', feeName: 'Previous Fee Due' },
// ];

// staticFees.forEach((staticFee) => {
//   if (!normalized.some(fee => fee.columnBase === staticFee.columnBase)) {
//     normalized.push({
//       id: `static-${staticFee.columnBase}`,
//       feeName: staticFee.feeName,
//       feesType: staticFee.feeName,
//       scope: 'All',
//       frequency: 'One time',
//       installments: 1,
//       columnBase: staticFee.columnBase,
//     });
//   }
// });

setDynamicFeeTypes(normalized);
        setDynamicFeeValues((prev) => {
          const next = { ...prev };
          normalized.forEach((fee) => {
            if (!(fee.columnBase in next)) next[fee.columnBase] = 0;
          });
          Object.keys(next).forEach((key) => {
            if (!normalized.some((fee) => fee.columnBase === key)) delete next[key];
          });
          return next;
        });

        const termWiseFees = normalized.filter(
          (fee) => String(fee.frequency || "").trim().toLowerCase() === "term wise" && fee.id
        );

        const installmentMetaEntries = await Promise.all(
          termWiseFees.map(async (fee) => {
            try {
              const installmentResponse = await axios.get(
                "https://cleezoclass.com:4000/api/fee-type-installments",
                {
                  params: {
                    schoolCode,
                    feeTypeId: fee.id,
                    className,
                    section,
                  },
                }
              );
              const rows = Array.isArray(installmentResponse.data?.data)
                ? installmentResponse.data.data
                : [];
              return [
                getFeeInstallmentScopeKey(fee.id),
                {
                  count: rows.length,
                  rows: rows.map((row) => ({
                    installmentNo: Number(row.installmentNo) || 0,
                    amount: Number(row.amount) || 0,
                    deadlineDate: row.deadlineDate || "",
                    fine: Number(row.fine) || 0,
                  })),
                },
              ];
            } catch (error) {
              return [
                getFeeInstallmentScopeKey(fee.id),
                {
                  count: Number(fee.installments) || 0,
                  rows: [],
                },
              ];
            }
          })
        );

        const nextCounts = {};
        const nextDetails = {};
        installmentMetaEntries.forEach(([feeId, meta]) => {
          nextCounts[feeId] = meta?.count || 0;
          nextDetails[feeId] = Array.isArray(meta?.rows) ? meta.rows : [];
        });

        setFeeTypeInstallmentCounts(nextCounts);
        setFeeTypeInstallmentDetails(nextDetails);
      } catch (error) {
        console.error('Failed to fetch dynamic fee types:', error);
      }
    };

    fetchDynamicFeeTypes();
  }, [className, section]);

  const [feeStructure, setFeeStructure] = useState({});

  useEffect(() => {
    if (selectedStudentId) {
      const selected = students.find(s => s.id === selectedStudentId);
      if (selected) {
        setStudentData({
          name: selected.name,
          fatherName: selected.fatherName || 'Not Available',
          class: selected.class,
          section: selected.section || 'A',
          rollNumber: selected.id.toString(),
          billType: 'full-package'
        });

        const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
        axios.get(`https://cleezoclass.com:4000/api/paymentHistory/${selectedStudentId}?schoolCode=${schoolCode}`)
          .then(res => {
            const paymentData = res.data.payments || {};
            const tuitionFee = parseFloat(paymentData.completeFee || 0) -
              (parseFloat(paymentData.examFee || 0) +
                parseFloat(paymentData.busFee || 0) +
                parseFloat(paymentData.bookFee || 0) +
                parseFloat(paymentData.uniformFee || 0) +
                parseFloat(paymentData.othersFee || 0) +
                parseFloat(paymentData.admissionFee || 0));

            const paid = parseFloat(paymentData.paidAmount || 0);
            const completeFee = parseFloat(paymentData.completeFee || 0);
            const residentialFee = parseFloat(paymentData.residentialFee || 0);
            const totalAmountWithResidential = completeFee + residentialFee;

            setPaidAmount(paid);
            setTotalAmount(totalAmountWithResidential);
            setRemainingAmount(totalAmountWithResidential - paid);
            setTuitionFee(tuitionFee);
          })
          .catch(err => console.error("Error fetching payment history:", err));
      }
    }
  }, [selectedStudentId, students]);
const getValueFromBackendData = (backendData, key, context = '') => {
  if (!backendData) {
    console.log(`[getValueFromBackendData${context}] No backendData for key:`, key);
    return undefined;
  }

  const feeVariations = {
   
    previousfeedue: ['Previous_Fee_Due', 'previous_fee_due', 'previousfeedue', 'Previous Fee Due'],
   
  };

  if (feeVariations[key]) {
    for (const variation of feeVariations[key]) {
      if (backendData[variation] !== undefined) {
        const value = backendData[variation];
        if (value !== undefined && value !== null && value !== '') {
          const numericValue = parseFloat(value);
          if (!isNaN(numericValue)) {
            console.log(`[getValueFromBackendData${context}] ✅ Found "${variation}" = ${numericValue} for "${key}"`);
            return numericValue;
          }
        }
      }
    }
    console.log(`[getValueFromBackendData${context}] ⚠️ No valid value for "${key}" variations:`, feeVariations[key]);
  }

  if (backendData[key] !== undefined) {
    const value = backendData[key];
    if (value !== undefined && value !== null && value !== '') {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        console.log(`[getValueFromBackendData${context}] Exact match "${key}" -> ${numericValue}`);
        return numericValue;
      }
    }
  }

  const lowerKey = key.toLowerCase();
  for (const [backendKey, value] of Object.entries(backendData)) {
    if (backendKey.toLowerCase() === lowerKey) {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        console.log(`[getValueFromBackendData${context}] Case-insensitive "${key}" -> "${backendKey}": ${numericValue}`);
        return numericValue;
      }
    }
  }

  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
  for (const [backendKey, value] of Object.entries(backendData)) {
    const normalizedBackendKey = backendKey.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (normalizedBackendKey === normalizedKey) {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        console.log(`[getValueFromBackendData${context}] Normalized "${key}" -> "${backendKey}": ${numericValue}`);
        return numericValue;
      }
    }
  }

  console.log(`[getValueFromBackendData${context}] ❌ NO MATCH for "${key}". Available keys:`, Object.keys(backendData));
  return undefined;
};
  useEffect(() => {
    const fetchFeeStructure = async () => {
      if (!className || !section) return;

      try {
        const dynamicValueScope = `${className}|${section}`;
        if (localDynamicFeeValueScopeRef.current !== dynamicValueScope) {
          localDynamicFeeValueScopeRef.current = dynamicValueScope;
          localDynamicFeeValueOverridesRef.current = {};
        }

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
const dynamicFeeSnapshot = dynamicFeeTypes.reduce((acc, fee) => {
  const value = getValueFromBackendData(backendData, fee.columnBase);
  if (value !== undefined && value !== null && value !== "") {
    const numericValue = parseFloat(value);
    if (!Number.isNaN(numericValue)) {
      acc[fee.columnBase] = numericValue;
    }
  }
  return acc;
}, {});
        console.log('[feeStructure] Dynamic fee snapshot from backend:', dynamicFeeSnapshot);

        const fetchedFees = {
          admission: parseFloat(backendData.Admission_Fee) || 0,
          books: parseFloat(backendData.Book_Fee) || 0,
          uniform: parseFloat(backendData.Uniform_Fee) || 0,
          exam: parseFloat(backendData.Exam_Fee) || 0,
          other: parseFloat(backendData.Other_Fee) || 0,
          bus: parseFloat(backendData.Bus_Fee) || 0,
          residential: parseFloat(backendData.ResidentialCompleteFee) || 0,
          tuition: parseFloat(
            backendData.tuition ?? backendData.Calculated_Tuition_Fee ?? backendData.Tuition_Fee ?? 0
          ) || 0,
                previousfeedue: parseFloat(backendData.Previous_Fee_Due) || 0, // Include this line

        };

        setDefaultFees(fetchedFees);
        setFees(fetchedFees);
        setDynamicFeeValues((prev) => {
          const next = { ...prev };
          Object.entries(dynamicFeeSnapshot).forEach(([key, value]) => {
            const localValue = Number(prev[key]) || 0;
            const backendValue = Number(value) || 0;
            next[key] =
              localDynamicFeeValueOverridesRef.current[key] && localValue > 0
                ? localValue
                : backendValue;
          });
          return next;
        });
        setFeeStructure({
          ...fetchedFees,
          ...dynamicFeeSnapshot,
          complete_fee: parseFloat(backendData.CompleteFee) || 0
        });
        if (onFeeStructurePreviewChange) {
          const staticFeeRows = [
            { id: "tuition", feeName: "Tuition Fee", feesType: "Tuition Fee", installments: 1, amount: fetchedFees.tuition || 0 },
            { id: "admission", feeName: "Admission Fee", feesType: "Admission Fee", installments: 1, amount: fetchedFees.admission || 0 },
            { id: "exam", feeName: "Exam Fee", feesType: "Exam Fee", installments: 1, amount: fetchedFees.exam || 0 },
            { id: "bus", feeName: "Bus Fee", feesType: "Bus Fee", installments: 1, amount: fetchedFees.bus || 0 },
            { id: "uniform", feeName: "Uniform Fee", feesType: "Uniform Fee", installments: 1, amount: fetchedFees.uniform || 0 },
            { id: "books", feeName: "Books Fee", feesType: "Books Fee", installments: 1, amount: fetchedFees.books || 0 },
            { id: "other", feeName: "Other Fees", feesType: "Other Fee", installments: 1, amount: fetchedFees.other || 0 },
            { id: "previousfeedue", feeName: "Previous Fee Due", feesType: "Previous Fee Due", installments: 1, amount: fetchedFees.previousfeedue || 0 },
            { id: "residential", feeName: "Residential Fee", feesType: "Residential Fee", installments: 1, amount: fetchedFees.residential || 0 },
          ].filter((fee) => fee.amount > 0);

          const dynamicPreviewRows = dynamicFeeTypes
            .map((fee) => ({
              id: fee.id || fee.columnBase,
              feeName: fee.feeName,
              feesType: fee.feesType || "Custom Fee",
              installments: fee.installments || 1,
              amount: parseFloat(dynamicFeeSnapshot[fee.columnBase]) || 0,
              installmentDetails:
                feeTypeInstallmentDetails[getFeeInstallmentScopeKey(fee.id)] || [],
            }))
            .filter((fee) => fee.amount > 0);

          onFeeStructurePreviewChange({
            className,
            section,
            rows: [...staticFeeRows, ...dynamicPreviewRows].map((fee) => ({
              ...fee,
              className,
              section,
            })),
          });
        }
        console.log('[feeStructure] Tuition used in form:', fetchedFees.tuition);

      } catch (error) {
        console.error("Failed to fetch fee structure:", error);
        displayToast("Failed to load fee structure.", "error");
      }
    };

    fetchFeeStructure();
  }, [className, section, dynamicFeeTypes, feeTypeInstallmentDetails]);

  useEffect(() => {
    if (!className || !section) {
      setStudents([]);
      setLoadStudentsValue(false);
      setShowIcon(false);
      setIndividualFeeStudentMap({});
      setIndividualFeeBatchMap({});
      setActiveIndividualFee(null);
      setIndividualFeeDraftAmount("");
      setShowIndividualFeeStudentPopup(false);
    }
  }, [className, section]);



  const [modalEntries, setModalEntries] = useState([]);
const [showIndividualPreviousFeeDuePopup, setShowIndividualPreviousFeeDuePopup] = useState(false);

const [showPreviousFeeDuePopup, setShowPreviousFeeDuePopup] = useState(false);
const [previousFeeDueStudents, setPreviousFeeDueStudents] = useState([]);
const [selectedPreviousFeeDueStudent, setSelectedPreviousFeeDueStudent] = useState(null);
const [previousFeeDueAmount, setPreviousFeeDueAmount] = useState('');
const [oldPreviousFeeDue, setOldPreviousFeeDue] = useState(null);
const [showResidentialFeePopup, setShowResidentialFeePopup] = useState(false);
const [residentialFeeStudents, setResidentialFeeStudents] = useState([]);
const [selectedResidentialStudent, setSelectedResidentialStudent] = useState(null);
const [residentialFeeAmount, setResidentialFeeAmount] = useState('');
const [oldResidentialFee, setOldResidentialFee] = useState(null);
const [showIndividualResidentialFeePopup, setShowIndividualResidentialFeePopup] = useState(false);
const handlePreviousFeeDueSelect = async () => {
  if (!className || !section) {
    displayToast('Please select both class and section', "error");
    return;
  }
  try {
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
    const apiClassName = className.replace("Class ", "");
    const response = await axios.get(`https://cleezoclass.com:4000/get-students?className=${apiClassName}&section=${section}&schoolCode=${schoolCode}`);
    if (response.data.success && response.data.students) {
      setPreviousFeeDueStudents(response.data.students);
      setShowPreviousFeeDuePopup(true);
    } else {
      displayToast('No students found for the selected class and section', "error");
    }
  } catch (error) {
    console.error('Error loading students:', error);
    displayToast('Error loading students', "error");
  }
};
const handleResidentialFeeSelect = async () => {
  if (!className || !section) {
    displayToast('Please select both class and section', "error");
    return;
  }
  try {
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
    const apiClassName = className.replace("Class ", "");
    const response = await axios.get(`https://cleezoclass.com:4000/get-students?className=${apiClassName}&section=${section}&schoolCode=${schoolCode}`);
    if (response.data.success && response.data.students) {
      setResidentialFeeStudents(response.data.students);
      setShowResidentialFeePopup(true);
    } else {
      displayToast('No students found for the selected class and section', "error");
    }
  } catch (error) {
    console.error('Error loading students:', error);
    displayToast('Error loading students', "error");
  }
};
useEffect(() => {
  const fetchOldPreviousFeeDue = async () => {
    try {
      const schoolCode = localStorage.getItem('schoolCode');
      const response = await axios.post('https://cleezoclass.com:4000/get-previous-feedue', {
        studentName: selectedPreviousFeeDueStudent?.name,
        className: className.replace("Class ", ""),
        sectionName: section,
        schoolCode: schoolCode,
      });
      if (response.data.FeesDetails) {
        setOldPreviousFeeDue(response.data.FeesDetails.Previous_Fee_Due);
        setLoginId(response.data.login_id);
      }
    } catch (error) {
      console.error('Error fetching old previous fee due:', error);
    }
  };
  if (showIndividualPreviousFeeDuePopup) {
    fetchOldPreviousFeeDue();
  }
}, [showIndividualPreviousFeeDuePopup]);
useEffect(() => {
  const fetchOldResidentialFee = async () => {
    try {
      const schoolCode = localStorage.getItem('schoolCode');
      const response = await axios.post('https://cleezoclass.com:4000/get-residential-fee', {
        studentName: selectedResidentialStudent?.name,
        className: className.replace("Class ", ""),
        sectionName: section,
        schoolCode: schoolCode,
      });
      if (response.data) {
        setOldResidentialFee(response.data.ResidentialCompleteFee);
        setLoginId(response.data.login_id);
      }
    } catch (error) {
      console.error('Error fetching old residential fee:', error);
    }
  };
  if (showIndividualResidentialFeePopup) {
    fetchOldResidentialFee();
  }
}, [showIndividualResidentialFeePopup]);

  const dashboardRef = useRef(null);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalFeeEntries, setModalFeeEntries] = useState([{ feeType: '', reason: '', discount: '' }]);
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const [institutionData, setInstitutionData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [installmentOptions, setInstallmentOptions] = useState([]);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(0);
  const [installments, setInstallments] = useState([]);
  const [tuitionFee, setTuitionFee] = useState(0);
  const [activeInstallmentFee, setActiveInstallmentFee] = useState(null);
  const [activeIndividualInstallmentStudent, setActiveIndividualInstallmentStudent] = useState(null);
  const activeInstallmentAmount =
    activeIndividualInstallmentStudent
      ? Number(activeIndividualInstallmentStudent?.assignedAmount) || 0
      : activeInstallmentFee?.columnBase != null
      ? Number(dynamicFeeValues?.[activeInstallmentFee.columnBase]) || 0
      : Number(fees.tuition) || 0;

const buildInstallments = (count, totalAmount) => {
  const normalizedCount = Math.max(1, Number(count) || 0);
  const total = Math.max(0, Number(totalAmount) || 0);

  if (normalizedCount <= 0 || total <= 0) {
    return [];
  }

  const baseAmount = Math.floor((total / normalizedCount) * 100) / 100;
  let remaining = Number(total.toFixed(2));

  return Array.from({ length: normalizedCount }, (_, index) => {
    const amount = index === normalizedCount - 1
      ? Number(remaining.toFixed(2))
      : Number(baseAmount.toFixed(2));
    remaining = Number((remaining - amount).toFixed(2));

    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + index + 1);

    return {
      id: index + 1,
      amount,
      date: deadline.toISOString().split("T")[0],
    };
  });
};

const buildPlaceholderInstallments = (count) => {
  const normalizedCount = Math.max(1, Number(count) || 0);
  return Array.from({ length: normalizedCount }, (_, index) => {
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + index + 1);

    return {
      id: index + 1,
      amount: 0,
      date: deadline.toISOString().split("T")[0],
    };
  });
};

const normalizeInstallmentRowsForSave = (rows = []) =>
  (Array.isArray(rows) ? rows : []).map((installment, index) => ({
    installmentNo: Number(installment.installmentNo || installment.id) || index + 1,
    amount: Number(installment.amount) || 0,
    deadlineDate: installment.deadlineDate || installment.date || null,
    fine: Number(installment.fine) || 0,
  }));

const getStudentIdentityMatches = (left = {}, right = {}) => {
  const leftId = String(left?.id ?? left?.student_id ?? left?.studentId ?? "").trim();
  const rightId = String(right?.id ?? right?.student_id ?? right?.studentId ?? "").trim();
  if (leftId && rightId) return leftId === rightId;

  const leftName = String(left?.name || left?.StudentName || "").trim().toLowerCase();
  const rightName = String(right?.name || right?.StudentName || "").trim().toLowerCase();
  return Boolean(leftName && rightName && leftName === rightName);
};

  const formatDateForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      const raw = String(value).trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
    }
    return date.toISOString().split("T")[0];
  };

const loadInstallmentsForFeeType = async (feeTypeId, fallbackCount, fallbackAmount) => {
  const normalizedCount = Math.max(1, Number(fallbackCount) || 1);
  const normalizedAmount = Number(fallbackAmount) || 0;

  try {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode || !feeTypeId) {
      return normalizedAmount > 0
        ? buildInstallments(normalizedCount, normalizedAmount)
        : buildPlaceholderInstallments(normalizedCount);
    }

    const response = await axios.get("https://cleezoclass.com:4000/api/fee-type-installments", {
      params: {
        schoolCode,
        feeTypeId,
        className,
        section,
      },
    });

    const rows = Array.isArray(response.data?.data) ? response.data.data : [];
    const savedTotal = rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

    if (rows.length > 0 && Math.abs(savedTotal - normalizedAmount) < 0.01) {
      return rows.map((row, index) => ({
        id: Number(row.installmentNo) || index + 1,
        amount: Number(row.amount) || 0,
        date: formatDateForInput(
          row.deadlineDate ||
          row.deadline_date ||
          row.deadline
        ),
      }));
    }
  } catch (error) {
    console.error("Failed to load fee type installments:", error);
  }

  return normalizedAmount > 0
    ? buildInstallments(normalizedCount, normalizedAmount)
    : buildPlaceholderInstallments(normalizedCount);
};
  const getInstallmentSplitAmount = (fallbackAmount = activeInstallmentAmount) => {
    const configuredAmount = Array.isArray(installments)
      ? installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0)
      : 0;
    const baseAmount = Number(fallbackAmount) || 0;
    return configuredAmount > 0 ? configuredAmount : baseAmount;
  };

const regenerateInstallments = (count = installmentCount, totalAmount = activeInstallmentAmount) => {
  const currentTuitionFee = parseFloat(totalAmount) || 0;
  if (!count || count <= 0) {
    displayToast("Installment count must be greater than zero.", "error");
    return [];
  }

  // Ensure the total does not exceed the original amount
  const validatedTotal = Math.min(currentTuitionFee, totalAmount);
  const nextInstallments = validatedTotal > 0
    ? buildInstallments(count, validatedTotal)
    : buildPlaceholderInstallments(count);

  setInstallments(nextInstallments);
  return nextInstallments;
};

const handleAddInstallments = () => {
  regenerateInstallments(installmentCount, Math.min(getInstallmentSplitAmount(), activeInstallmentAmount));
};
const handleIncreaseInstallments = () => {
  const nextCount = (Number(installmentCount) || 0) + 1;
  setInstallmentCount(nextCount);
  const nextTotal = getInstallmentSplitAmount();
  setInstallments(
    nextTotal > 0
      ? buildInstallments(nextCount, Math.min(nextTotal, activeInstallmentAmount))
      : buildPlaceholderInstallments(nextCount)
  );
};

const handleDecreaseInstallments = () => {
  const nextCount = Math.max(1, (Number(installmentCount) || 1) - 1);
  setInstallmentCount(nextCount);
  const nextTotal = getInstallmentSplitAmount();
  setInstallments(
    nextTotal > 0
      ? buildInstallments(nextCount, Math.min(nextTotal, activeInstallmentAmount))
      : buildPlaceholderInstallments(nextCount)
  );
};
  const [loadStudentsValue, setLoadStudentsValue] = useState(false);
  const [showDiscountBillModal, setShowDiscountBillModal] = useState(false);
  const [schoolCode, setSchoolCode] = useState('');

  useEffect(() => {
    const code = localStorage.getItem('schoolCode');
    if (code) {
      setSchoolCode(code);
    }
  }, []);

  const [studentData, setStudentData] = useState(null);

  const handleDateChange = (index, newDate) => {
    const updatedInstallments = [...installments];
    updatedInstallments[index].date = newDate;
    setInstallments(updatedInstallments);
  };


const handleAmountChange = (index, newAmount) => {
  const numericValue = Math.max(0, Number(newAmount) || 0);
  const currentTotal = installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
  const remainingAmount = Math.max(
    activeInstallmentAmount - (currentTotal - (Number(installments[index]?.amount) || 0)),
    0
  );

  // Ensure the new amount does not exceed the remaining amount
  const validatedAmount = Math.min(
    numericValue,
    remainingAmount + (Number(installments[index]?.amount) || 0)
  );

  const updatedInstallments = [...installments];
  updatedInstallments[index].amount = validatedAmount;
  setInstallments(updatedInstallments);
};

  useEffect(() => {
    if (!showInstallmentModal || !activeInstallmentFee?.id) return;

    const loadInstallments = async () => {
      if (activeIndividualInstallmentStudent) {
        const studentAmount = Number(activeIndividualInstallmentStudent?.assignedAmount) || 0;
        const existingRows = normalizeInstallmentRowsForSave(
          activeIndividualInstallmentStudent?.installments ||
            activeIndividualInstallmentStudent?.installmentDetails ||
            []
        );
        const fallbackCount = Math.max(1, existingRows.length || Number(activeInstallmentFee.installments) || 1);
        const mappedRows = existingRows.length
          ? existingRows.map((row, index) => ({
              id: Number(row.installmentNo) || index + 1,
              amount: Number(row.amount) || 0,
              date: formatDateForInput(row.deadlineDate),
            }))
          : (studentAmount > 0
              ? buildInstallments(fallbackCount, studentAmount)
              : buildPlaceholderInstallments(fallbackCount));

        setInstallmentCount(mappedRows.length || fallbackCount);
        setInstallments(mappedRows);
        return;
      }

      const fallbackCount = Math.max(1, Number(activeInstallmentFee.installments) || 1);
      const mappedRows = await loadInstallmentsForFeeType(
        activeInstallmentFee.id,
        fallbackCount,
        activeInstallmentAmount
      );
      setInstallmentCount(mappedRows.length || fallbackCount);
      setInstallments(mappedRows);
    };

    loadInstallments();
  }, [showInstallmentModal, activeInstallmentFee?.id, activeInstallmentAmount, activeIndividualInstallmentStudent]);

  const openDiscountModal = () => {
    setShowDiscountBillModal(true);
  };



  const [showIcon, setShowIcon] = useState(false);
  const lastFeePreviewSignatureRef = useRef("");

  const handleLoadStudents = () => {
    setLoadStudentsValue(true);
    setStudents([]);
    loadStudents();
    setShowIcon(true);
  };

  const selectedClassSectionFeeRows = React.useMemo(() => {
    return dynamicFeeTypes
      .map((fee) => ({
        id: fee.id || fee.columnBase,
        feeName: fee.feeName,
        feesType: fee.feesType || "Custom Fee",
        scope: fee.scope || "All",
        frequency: fee.frequency || "One time",
        installments: fee.installments || 1,
        installmentDetails:
          feeTypeInstallmentDetails[getFeeInstallmentScopeKey(fee.id)] || [],
        amount: String(fee.scope || "").trim().toLowerCase() === "individual"
          ? (Array.isArray(individualFeeStudentMap[fee.columnBase])
              ? individualFeeStudentMap[fee.columnBase].reduce(
                  (sum, student) => sum + (Number(student?.assignedAmount) || 0),
                  0
                )
              : parseFloat(dynamicFeeValues[fee.columnBase]) || 0)
          : parseFloat(dynamicFeeValues[fee.columnBase]) || 0,
      }))
      .filter((fee) => fee.amount > 0);
  }, [dynamicFeeTypes, feeTypeInstallmentDetails, individualFeeStudentMap, dynamicFeeValues]);

const openIndividualFeeStudentPicker = async (fee) => {

   console.log("[INDIVIDUAL FEE POPUP] Opening for fee:", {
    feeName: fee?.feeName,
    columnBase: fee?.columnBase,
    frequency: fee?.frequency,
    scope: fee?.scope,
  });
  if (!className || !section) {
    displayToast('Please select both class and section', "error");
    return;
  }

  // Ensure the fee object includes the `frequency` property
  const feeWithFrequency = {
    ...fee,
    frequency: fee?.frequency || "One time", // Default to "One time" if not provided
  };
 console.log("[INDIVIDUAL FEE POPUP] feeWithFrequency:", feeWithFrequency);
  setActiveIndividualFee(feeWithFrequency); // Set the fee with frequency
  const currentStudents = students.length ? students : await loadStudents();
  const feeStudents = Array.isArray(currentStudents) ? currentStudents : [];
  const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
  const classNameOptions = Array.from(
    new Set([
      className,
      String(className || "").replace(/^Class\s+/i, "").trim(),
    ])
  ).filter(Boolean);
  const hydratedAmountLookup = {};

  if (feeStudents.length > 0) {
    const feeResponses = await Promise.all(
      feeStudents.map(async (student) => {
        try {
          const studentName = String(student?.name || student?.StudentName || "").trim();
          if (!studentName) return null;
          const studentId = String(student?.id ?? student?.student_id ?? "").trim();

          let response = null;
          let lastError = null;

          for (const classOption of classNameOptions) {
            try {
              response = await axios.get('https://cleezoclass.com:4000/api/student-fee-details', {
                params: {
                  schoolCode,
                  class: classOption,
                  section,
                  name: studentName,
                },
              });
              if (response?.data) break;
            } catch (requestError) {
              lastError = requestError;
            }
          }

          if (!response?.data) {
            throw lastError || new Error('Failed to fetch student fee details');
          }

          let savedAmount = findSavedIndividualFeeAmountForStudent(response?.data, student, feeWithFrequency);

          if (savedAmount === undefined && studentId) {
            try {
              const historyResponse = await axios.get(
                `https://cleezoclass.com:4000/api/paymentHistory/${studentId}`,
                {
                  params: { schoolCode },
                }
              );
              savedAmount = findSavedIndividualFeeAmountForStudent(
                historyResponse?.data?.payments || historyResponse?.data,
                student,
                feeWithFrequency
              );
            } catch (historyError) {
              console.error('[individual-fee] payment history lookup failed', {
                studentName,
                studentId,
                feeName: feeWithFrequency?.feeName || feeWithFrequency?.columnBase || null,
                error: historyError?.response?.data || historyError?.message || historyError,
              });
            }
          }

          const amount = Number(savedAmount) || 0;
          const lookupKey = getStudentLookupKey(student);
          if (lookupKey) {
            hydratedAmountLookup[lookupKey] = amount;
          }

          return {
            ...student,
            assignedAmount: amount,
          };
        } catch (error) {
          console.error('[individual-fee] failed to hydrate student amount', {
            studentName: student?.name || student?.StudentName || null,
            feeName: feeWithFrequency?.feeName || feeWithFrequency?.columnBase || null,
            error: error?.response?.data || error?.message || error,
          });
          const lookupKey = getStudentLookupKey(student);
          if (lookupKey && !(lookupKey in hydratedAmountLookup)) {
            hydratedAmountLookup[lookupKey] = 0;
          }
          return {
            ...student,
            assignedAmount: 0,
          };
        }
      })
    );
  }

  setIndividualFeeStudentSavedAmounts((prev) => ({
    ...prev,
    [feeWithFrequency.columnBase]: hydratedAmountLookup,
  }));
  setIndividualFeeBatchMap((prev) => ({
    ...prev,
    [feeWithFrequency.columnBase]: [],
  }));
  setIndividualFeeDraftAmount("");

  setDynamicFeeValues((prev) => ({
    ...prev,
    [feeWithFrequency.columnBase]: Object.values(hydratedAmountLookup).reduce(
      (sum, amount) => sum + (Number(amount) || 0),
      0
    ),
  }));

  setIndividualFeeStudentSearch("");
  setShowIndividualFeeStudentPopup(true);
};
  const handleDeleteFeeType = async (fee) => {
    if (!fee?.id) {
      displayToast("Cannot delete this fee type.", "error");
      return;
    }

    const confirmed = window.confirm(
      [
        `Delete fee type "${fee.feeName}"?`,
        "",
        "This deletes the complete fee type from the school fee master. It will be removed everywhere this fee type combination is used, including all classes, sections, term-wise setup, fee collection, due tracking, and reports.",
        "",
        "If you only want to remove this fee for the selected class/section or term-wise fee setup, do not delete it. Set the amount to 0 or leave it blank, then submit fees.",
        "",
        "Do you still want to delete the complete fee type?"
      ].join("\n")
    );
    if (!confirmed) return;

    try {
      const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";
      await axios.delete(`https://cleezoclass.com:4000/api/fee-types/${fee.id}`, {
        params: { schoolCode },
      });

      const nextDynamicFeeTypes = dynamicFeeTypes.filter((item) => item.id !== fee.id);
      const nextDynamicFeeValues = { ...dynamicFeeValues };
      delete nextDynamicFeeValues[fee.columnBase];
      const nextIndividualFeeStudentMap = { ...individualFeeStudentMap };
      delete nextIndividualFeeStudentMap[fee.columnBase];
      const nextIndividualFeeBatchMap = { ...individualFeeBatchMap };
      delete nextIndividualFeeBatchMap[fee.columnBase];
      const nextIndividualFeeStudentSavedAmounts = { ...individualFeeStudentSavedAmounts };
      delete nextIndividualFeeStudentSavedAmounts[fee.columnBase];

      setDynamicFeeTypes(nextDynamicFeeTypes);
      setDynamicFeeValues(nextDynamicFeeValues);
      setIndividualFeeStudentMap(nextIndividualFeeStudentMap);
      setIndividualFeeBatchMap(nextIndividualFeeBatchMap);
      setIndividualFeeStudentSavedAmounts(nextIndividualFeeStudentSavedAmounts);

      if (activeIndividualFee?.columnBase === fee.columnBase) {
        setActiveIndividualFee(null);
        setIndividualFeeDraftAmount("");
        setShowIndividualFeeStudentPopup(false);
      }

      await submitIncomeData({
        dynamicFees: nextDynamicFeeTypes,
        dynamicValues: nextDynamicFeeValues,
        individualSelections: nextIndividualFeeStudentMap,
        individualBatches: nextIndividualFeeBatchMap,
        resetAfterSuccess: false,
        successMessageOverride: `✅ Deleted fee type "${fee.feeName}" and saved the updated fee structure.`,
      });
    } catch (error) {
      console.error("Failed to delete fee type:", error?.response?.data || error?.message || error);
      displayToast(error?.response?.data?.message || "Failed to delete fee type.", "error");
    }
  };

  const getSelectedIndividualFeeStudents = (feeKey) => {
    const selection = individualFeeStudentMap[feeKey];
    if (Array.isArray(selection)) return selection.filter(Boolean);
    if (selection) return [selection];
    return [];
  };

  const getSelectedIndividualFeeBatches = (feeKey) => {
    const batches = individualFeeBatchMap[feeKey];
    if (Array.isArray(batches)) return batches.filter(Boolean);
    return [];
  };

  const selectedIndividualFeeStudents = activeIndividualFee
    ? getSelectedIndividualFeeStudents(activeIndividualFee.columnBase)
    : [];

  const selectedIndividualFeeBatches = activeIndividualFee
    ? getSelectedIndividualFeeBatches(activeIndividualFee.columnBase)
    : [];

  const getSavedAmountForIndividualFeeStudent = (feeKey, student) => {
    const lookupKey = getStudentLookupKey(student);
    if (!feeKey || !lookupKey) return 0;

    const amountMap = individualFeeStudentSavedAmounts?.[feeKey] || {};
    return Number(amountMap[lookupKey]) || 0;
  };

  const getDisplayedAmountForIndividualFeeStudent = (feeKey, student) => {
    const studentId = String(student?.id ?? student?.student_id ?? "").trim();
    const studentName = String(student?.name || student?.StudentName || "").trim().toLowerCase();
    const selectedStudent = selectedIndividualFeeStudents.find((item) => {
      const itemId = String(item?.id ?? item?.student_id ?? "").trim();
      const itemName = String(item?.name || item?.StudentName || "").trim().toLowerCase();
      if (studentId && itemId) return studentId === itemId;
      return studentName && itemName ? studentName === itemName : false;
    });

    if (selectedStudent) return Number(selectedStudent?.assignedAmount) || 0;
    return getSavedAmountForIndividualFeeStudent(feeKey, student);
  };

  const visibleIndividualFeeStudents = React.useMemo(() => {
    const query = String(individualFeeStudentSearch || "").trim().toLowerCase();

    return [...students]
      .sort((a, b) => {
        const aName = String(a?.name || a?.StudentName || "").trim().toLowerCase();
        const bName = String(b?.name || b?.StudentName || "").trim().toLowerCase();
        return aName.localeCompare(bName, undefined, { sensitivity: "base" });
      })
      .filter((student) => {
        if (!query) return true;
        const name = String(student?.name || student?.StudentName || "").trim().toLowerCase();
        const id = String(student?.id ?? student?.student_id ?? "").trim().toLowerCase();
        const mobile = String(student?.mobile_number || student?.phone_no || "").trim().toLowerCase();
        return name.includes(query) || id.includes(query) || mobile.includes(query);
      });
  }, [students, individualFeeStudentSearch]);

  const closeIndividualFeeStudentPopup = () => {
    setShowIndividualFeeStudentPopup(false);
    setIndividualFeeStudentSearch("");
  };

  const toggleIndividualFeeStudent = (student) => {
    if (!activeIndividualFee?.columnBase || !student) return;

    let nextSelection = [];
    const savedAmount = getSavedAmountForIndividualFeeStudent(activeIndividualFee.columnBase, student);
    const draftAmount = Math.max(0, Number(individualFeeDraftAmount) || 0);
    const displayedAmount = getDisplayedAmountForIndividualFeeStudent(activeIndividualFee.columnBase, student);
    const selectionAmount = draftAmount > 0 ? draftAmount : displayedAmount || savedAmount;
    setIndividualFeeStudentMap((prev) => {
      const existingSelection = prev[activeIndividualFee.columnBase];
      const currentSelection = Array.isArray(existingSelection)
        ? existingSelection.filter(Boolean)
        : existingSelection
          ? [existingSelection]
          : [];
      const studentId = String(student.id ?? student.student_id ?? "").trim();
      const studentName = String(student.name || student.StudentName || "").trim().toLowerCase();

      const isSelected = currentSelection.some((item) => {
        const itemId = String(item?.id ?? item?.student_id ?? "").trim();
        const itemName = String(item?.name || item?.StudentName || "").trim().toLowerCase();
        if (studentId && itemId) return studentId === itemId;
        return studentName && itemName ? studentName === itemName : false;
      });

      nextSelection = isSelected
        ? currentSelection.map((item) => {
            const itemId = String(item?.id ?? item?.student_id ?? "").trim();
            const itemName = String(item?.name || item?.StudentName || "").trim().toLowerCase();
            const sameStudent = studentId && itemId
              ? studentId === itemId
              : studentName && itemName
                ? studentName === itemName
                : false;

            return sameStudent ? null : item;
          }).filter(Boolean)
        : [
            ...currentSelection,
            {
              ...student,
              assignedAmount: selectionAmount,
            },
          ];

      return {
        ...prev,
        [activeIndividualFee.columnBase]: nextSelection,
      };
    });

    setDynamicFeeValues((prevValues) => ({
      ...prevValues,
      [activeIndividualFee.columnBase]: nextSelection.reduce(
        (sum, item) => sum + (Number(item?.assignedAmount) || 0),
        0
      ),
    }));
  };

  const updateIndividualFeeStudentAmount = (student, rawValue) => {
    if (!activeIndividualFee?.columnBase || !student) return;

    const amount = Math.max(0, Number(rawValue) || 0);
    const studentId = String(student.id ?? student.student_id ?? "").trim();
    const studentName = String(student.name || student.StudentName || "").trim().toLowerCase();
    let nextSelectionSnapshot = [];

    setIndividualFeeStudentMap((prev) => {
      const currentSelection = Array.isArray(prev[activeIndividualFee.columnBase])
        ? prev[activeIndividualFee.columnBase].filter(Boolean)
        : [];

      const nextSelection = currentSelection.map((item) => {
        const itemId = String(item?.id ?? item?.student_id ?? "").trim();
        const itemName = String(item?.name || item?.StudentName || "").trim().toLowerCase();
        const sameStudent = studentId && itemId
          ? studentId === itemId
          : studentName && itemName
            ? studentName === itemName
            : false;

        return sameStudent
          ? { ...item, assignedAmount: amount }
          : item;
      });

      nextSelectionSnapshot = nextSelection;

      return {
        ...prev,
        [activeIndividualFee.columnBase]: nextSelection,
      };
    });

    setDynamicFeeValues((prev) => ({
      ...prev,
      [activeIndividualFee.columnBase]: nextSelectionSnapshot.reduce(
        (sum, item) => sum + (Number(item?.assignedAmount) || 0),
        0
      ),
    }));
  };

  const focusIndividualFeeStudentAmount = (student) => {
    if (!activeIndividualFee?.columnBase || !student) return;
    const lookupKey = getStudentLookupKey(student);
    if (!lookupKey) return;

    requestAnimationFrame(() => {
      const input = individualFeeAmountInputRefs.current?.[lookupKey];
      if (input?.focus) input.focus();
      if (input?.select) input.select();
    });
  };
const openIndividualStudentInstallments = (student) => {
  console.log("[OPEN INDIVIDUAL STUDENT INSTALLMENTS] Called for student:", {
    studentName: student?.name || student?.StudentName || "Unknown",
    assignedAmount: student?.assignedAmount,
    hasInstallments: Array.isArray(student?.installments) && student.installments.length > 0,
    hasInstallmentDetails: Array.isArray(student?.installmentDetails) && student.installmentDetails.length > 0,
    activeIndividualFee: {
      id: activeIndividualFee?.id,
      feeName: activeIndividualFee?.feeName,
      frequency: activeIndividualFee?.frequency,
    },
  });

  if (!activeIndividualFee?.id || !student) return;

  const amount = Number(student?.assignedAmount) || 0;
  if (amount <= 0) {
    displayToast("Please enter amount for this student before adding installments.", "error");
    return;
  }

  const existingRows = normalizeInstallmentRowsForSave(student?.installments || student?.installmentDetails || []);
  const fallbackCount = Math.max(1, existingRows.length || Number(activeIndividualFee.installments) || 1);

  setActiveInstallmentFee(activeIndividualFee);
  setActiveIndividualInstallmentStudent(student);
  setInstallmentCount(fallbackCount);
  setInstallments(
    existingRows.length
      ? existingRows.map((row, index) => ({
          id: Number(row.installmentNo) || index + 1,
          amount: Number(row.amount) || 0,
          date: formatDateForInput(row.deadlineDate),
        }))
      : buildInstallments(fallbackCount, amount)
  );
  setShowInstallmentModal(true);
};

  const handleIndividualFeeDraftAmountChange = (rawValue) => {
    setIndividualFeeDraftAmount(rawValue);

    if (!activeIndividualFee?.columnBase) return;
    if (rawValue === "") return;

    const amount = Math.max(0, Number(rawValue) || 0);
    const currentSelection = getSelectedIndividualFeeStudents(activeIndividualFee.columnBase);
    if (!currentSelection.length) return;

    const nextSelection = currentSelection.map((student) => ({
      ...student,
      assignedAmount: amount,
    }));

    setIndividualFeeStudentMap((prev) => ({
      ...prev,
      [activeIndividualFee.columnBase]: nextSelection,
    }));

    setDynamicFeeValues((prev) => ({
      ...prev,
      [activeIndividualFee.columnBase]: nextSelection.reduce(
        (sum, item) => sum + (Number(item?.assignedAmount) || 0),
        0
      ),
    }));
  };

  const applyIndividualFeeDraftAmountToSelectedStudents = () => {
    if (!activeIndividualFee?.columnBase) return;

    const amount = Math.max(0, Number(individualFeeDraftAmount) || 0);
    const currentSelection = getSelectedIndividualFeeStudents(activeIndividualFee.columnBase);
    if (!currentSelection.length) return;

    const nextSelection = currentSelection.map((student) => ({
      ...student,
      assignedAmount: amount,
    }));
    setIndividualFeeBatchMap((prevBatches) => {
      const currentBatches = Array.isArray(prevBatches[activeIndividualFee.columnBase])
        ? prevBatches[activeIndividualFee.columnBase].filter(Boolean)
        : [];
      const nextBatches = [
        ...currentBatches,
        {
          batchNo: currentBatches.length + 1,
          amount,
          students: nextSelection,
        },
      ];

      setDynamicFeeValues((prevValues) => ({
        ...prevValues,
        [activeIndividualFee.columnBase]: nextBatches.reduce(
          (sum, batch) =>
            sum + (Array.isArray(batch?.students)
              ? batch.students.reduce((batchSum, student) => batchSum + (Number(student?.assignedAmount) || 0), 0)
              : 0),
          0
        ),
      }));

      return {
        ...prevBatches,
        [activeIndividualFee.columnBase]: nextBatches,
      };
    });

    setIndividualFeeStudentMap((prev) => ({
      ...prev,
      [activeIndividualFee.columnBase]: [],
    }));
    setIndividualFeeDraftAmount("");
  };

  const updateIndividualFeeBatchAmount = (batchNo, rawValue) => {
    if (!activeIndividualFee?.columnBase) return;

    const amount = Math.max(0, Number(rawValue) || 0);
    setIndividualFeeBatchMap((prev) => {
      const currentBatches = Array.isArray(prev[activeIndividualFee.columnBase])
        ? prev[activeIndividualFee.columnBase].filter(Boolean)
        : [];

      const nextBatches = currentBatches.map((batch) => {
        const currentBatchNo = Number(batch?.batchNo);
        if (currentBatchNo !== Number(batchNo)) return batch;

        const updatedStudents = Array.isArray(batch?.students)
          ? batch.students.map((student) => ({
              ...student,
              assignedAmount: amount,
              installments: Array.isArray(student?.installments) && student.installments.length
                ? buildInstallments(student.installments.length, amount)
                : student?.installments,
              installmentDetails: Array.isArray(student?.installmentDetails) && student.installmentDetails.length
                ? buildInstallments(student.installmentDetails.length, amount)
                : student?.installmentDetails,
            }))
          : [];

        return {
          ...batch,
          amount,
          students: updatedStudents,
        };
      });

      const nextTotal = nextBatches.reduce(
        (sum, batch) =>
          sum + (Array.isArray(batch?.students)
            ? batch.students.reduce((batchSum, student) => batchSum + (Number(student?.assignedAmount) || 0), 0)
            : 0),
        0
      );

      setDynamicFeeValues((prevValues) => ({
        ...prevValues,
        [activeIndividualFee.columnBase]: nextTotal,
      }));

      return {
        ...prev,
        [activeIndividualFee.columnBase]: nextBatches,
      };
    });
  };

  useEffect(() => {
    if (!onFeeStructurePreviewChange) return;

    const staticFeeRows = [
      { id: "tuition", feeName: "Tuition Fee", feesType: "Tuition Fee", installments: 1, amount: parseFloat(fees.tuition) || 0 },
      { id: "admission", feeName: "Admission Fee", feesType: "Admission Fee", installments: 1, amount: parseFloat(fees.admission) || 0 },
      { id: "exam", feeName: "Exam Fee", feesType: "Exam Fee", installments: 1, amount: parseFloat(fees.exam) || 0 },
      { id: "bus", feeName: "Bus Fee", feesType: "Bus Fee", installments: 1, amount: parseFloat(fees.bus) || 0 },
      { id: "uniform", feeName: "Uniform Fee", feesType: "Uniform Fee", installments: 1, amount: parseFloat(fees.uniform) || 0 },
      { id: "books", feeName: "Books Fee", feesType: "Books Fee", installments: 1, amount: parseFloat(fees.books) || 0 },
      { id: "other", feeName: "Other Fees", feesType: "Other Fee", installments: 1, amount: parseFloat(fees.other) || 0 },
      { id: "previousfeedue", feeName: "Previous Fee Due", feesType: "Previous Fee Due", installments: 1, amount: parseFloat(fees.previousfeedue) || 0 },
      { id: "residential", feeName: "Residential Fee", feesType: "Residential Fee", installments: 1, amount: parseFloat(fees.residential) || 0 },
    ].filter((fee) => fee.amount > 0);

    const previewPayload = {
      className,
      section,
      rows: [...staticFeeRows, ...selectedClassSectionFeeRows].map((fee) => ({
        ...fee,
        className,
        section,
      })),
    };

    const previewSignature = JSON.stringify(previewPayload);
    if (lastFeePreviewSignatureRef.current === previewSignature) return;
    lastFeePreviewSignatureRef.current = previewSignature;

    onFeeStructurePreviewChange(previewPayload);
  }, [className, section, fees, selectedClassSectionFeeRows, onFeeStructurePreviewChange]);

  const handleViewDiscount = async () => {
    if (!className || !section) {
      displayToast('Please select both class and section', "error");
      return;
    }

    setStudents([]);
    await loadStudents();
    openDiscountModal();
  };

  const loadStudents = async () => {
    if (!className || !section) {
      displayToast('Please select both class and section', "error");
      return [];
    }
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
    const apiClassName = className.replace("Class ", "");

    try {
      const response = await fetch(`https://cleezoclass.com:4000/get-students?className=${apiClassName}&section=${section}&schoolCode=${schoolCode}`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const responseData = await response.json();
      if (responseData.success && responseData.students?.length > 0) {
        setStudents(responseData.students);
        return responseData.students;
      }

      setStudents([]);
      displayToast('No students found for the selected class and section', "error");
      return [];
    } catch (error) {
      console.error('Error loading students:', error);
      displayToast('Error loading students', "error");
      setStudents([]);
      return [];
    }
  };

const handleSaveFeeTypeInstallments = async () => {
  try {
    if (!activeInstallmentFee?.id) {
      displayToast('Please select a fee type first.', 'error');
      return;
    }

    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) {
      throw new Error('School code not found in localStorage');
    }

    if (!installments.length) {
      displayToast('Please generate installments first.', 'error');
      return;
    }

    const installmentRows = normalizeInstallmentRowsForSave(installments);
    const installmentTotal = installmentRows.reduce(
      (sum, installment) => sum + (Number(installment.amount) || 0),
      0
    );

    // Ensure the total does not exceed the original fee amount
    if (installmentTotal > activeInstallmentAmount) {
      displayToast(
        `Total installment amount (₹${installmentTotal}) exceeds the original fee amount (₹${activeInstallmentAmount}).`,
        "error"
      );
      return;
    }


    const effectiveFeeAmount =
      Number(activeInstallmentAmount) > 0 ? Number(activeInstallmentAmount) : installmentTotal;

    if (effectiveFeeAmount <= 0) {
      displayToast('Please enter installment amount before saving.', 'error');
      return;
    }

    if (activeIndividualInstallmentStudent && activeInstallmentFee?.columnBase) {
      const feeKey = activeInstallmentFee.columnBase;
      const nextSelectionSnapshot = getSelectedIndividualFeeStudents(feeKey).map((student) =>
        getStudentIdentityMatches(student, activeIndividualInstallmentStudent)
          ? {
              ...student,
              assignedAmount: effectiveFeeAmount,
              installments: installmentRows,
              installmentDetails: installmentRows,
            }
          : student
      );
      const nextBatchSnapshot = getSelectedIndividualFeeBatches(feeKey).map((batch) => ({
        ...batch,
        students: Array.isArray(batch?.students)
          ? batch.students.map((student) =>
              getStudentIdentityMatches(student, activeIndividualInstallmentStudent)
                ? {
                    ...student,
                    assignedAmount: effectiveFeeAmount,
                    installments: installmentRows,
                    installmentDetails: installmentRows,
                  }
                : student
            )
          : [],
      }));

      setIndividualFeeStudentMap((prev) => ({
        ...prev,
        [feeKey]: nextSelectionSnapshot,
      }));

      setIndividualFeeBatchMap((prev) => ({
        ...prev,
        [feeKey]: nextBatchSnapshot,
      }));

      setDynamicFeeValues((prev) => ({
        ...prev,
        [feeKey]:
          nextSelectionSnapshot.reduce(
            (sum, student) => sum + (Number(student?.assignedAmount) || 0),
            0
          ) +
          nextBatchSnapshot.reduce(
            (sum, batch) =>
              sum + (Array.isArray(batch?.students)
                ? batch.students.reduce((batchSum, student) => batchSum + (Number(student?.assignedAmount) || 0), 0)
                : 0),
            0
          ),
      }));

      displayToast('✅ Student installments saved successfully!', 'success');
      setShowInstallmentModal(false);
      setActiveInstallmentFee(null);
      setActiveIndividualInstallmentStudent(null);
      setInstallments([]);
      return;
    }

    const payload = {
      schoolCode,
      feeTypeId: activeInstallmentFee.id,
      feeName: activeInstallmentFee.feeName || activeInstallmentFee.columnBase,
      className,
      section,
      amount: effectiveFeeAmount,
      installments: installmentRows,
    };

    const response = await fetch('https://cleezoclass.com:4000/api/fee-type-installments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save fee type installments');
    }

    setDynamicFeeTypes((prev) =>
      prev.map((fee) =>
        fee.id === activeInstallmentFee.id
          ? { ...fee, installments: installments.length }
          : fee
      )
    );
    setFeeTypeInstallmentCounts((prev) => ({
      ...prev,
      [getFeeInstallmentScopeKey(activeInstallmentFee.id)]: installments.length,
    }));
    if (activeInstallmentFee.columnBase) {
      localDynamicFeeValueOverridesRef.current[activeInstallmentFee.columnBase] = true;
      setDynamicFeeValues((prev) => ({
        ...prev,
        [activeInstallmentFee.columnBase]: effectiveFeeAmount,
      }));
    }
    setFeeTypeInstallmentDetails((prev) => ({
      ...prev,
      [getFeeInstallmentScopeKey(activeInstallmentFee.id)]: installments.map((installment, index) => ({
        installmentNo: Number(installment.id) || index + 1,
        amount: Number(installment.amount) || 0,
        deadlineDate: formatDateForInput(installment.date) || null,
        fine: 0,
      })),
    }));
    displayToast('✅ Fee type installments saved successfully!', 'success');
    setShowInstallmentModal(false);
    setActiveInstallmentFee(null);
    setActiveIndividualInstallmentStudent(null);
    setInstallments([]);
  } catch (error) {
    console.error('Error saving fee type installments:', error);
    displayToast(error.message || 'Error saving fee type installments. Please try again.', 'error');
  }
};

const submitIncomeData = async ({
  event,
  dynamicFees = dynamicFeeTypes,
  dynamicValues = dynamicFeeValues,
  individualSelections = individualFeeStudentMap,
  individualBatches = individualFeeBatchMap,
  activeIndividualFeeItem = activeIndividualFee,
  resetAfterSuccess = true,
  successMessageOverride = null,
} = {}) => {
  if (event?.preventDefault) event.preventDefault();
  console.log('[SUBMIT] Form submission started');

  const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
  console.log('[SUBMIT] School Code:', schoolCode);

  if (!incomeType) {
    console.warn('[VALIDATION] Income type not selected');
    displayToast("❗ Please select an income type.", "error");
    return;
  }

  let incomeData = {
    income_type: incomeType,
    schoolCode: schoolCode,
  };

  const getSelectedIndividualFeeStudentsForSubmit = (feeKey) => {
    const batches = individualBatches?.[feeKey];
    if (Array.isArray(batches) && batches.length > 0) {
      return batches.flatMap((batch) => (Array.isArray(batch?.students) ? batch.students.filter(Boolean) : []));
    }

    const selection = individualSelections?.[feeKey];
    if (Array.isArray(selection)) return selection.filter(Boolean);
    if (selection) return [selection];
    return [];
  };

  console.log('[SUBMIT] Initial incomeData:', incomeData);

  if (incomeType === 'fees') {
    console.log('[FEES] Selected Class:', className, 'Section:', section);

    if (!className || !section) {
      console.warn('[VALIDATION] Class or Section missing');
      displayToast("❗ Please select Class and Section for fees income.", "error");
      return;
    }

    const calculatedFees = {};
    let totalAmount = 0;

  console.log('[FEES] Raw fee input:', fees);
    console.log('[FEES] Dynamic fee types:', dynamicFees.map((fee) => ({
    feeName: fee.feeName,
    columnBase: fee.columnBase,
  })));
  console.log('[FEES] Dynamic fee values snapshot:', dynamicValues);

    Object.keys(fees).forEach(key => {
      const amount = parseFloat(fees[key]) || 0;
      calculatedFees[key] = Math.max(0, amount);
      totalAmount += calculatedFees[key];
    });

    const calculatedDynamicFees = {};
    dynamicFees.forEach((fee) => {
      const amount = Math.max(0, parseFloat(dynamicValues[fee.columnBase]) || 0);
      calculatedDynamicFees[fee.columnBase] = amount;
      if (String(fee.scope || "").trim().toLowerCase() !== "individual") {
        totalAmount += amount;
      }
    });

    const individualFeeAssignments = [];

    dynamicFees
      .filter((fee) => String(fee.scope || "").trim().toLowerCase() === "individual")
      .forEach((fee) => {
        const amount = Math.max(0, parseFloat(dynamicValues[fee.columnBase]) || 0);
        const selectedStudents = getSelectedIndividualFeeStudentsForSubmit(fee.columnBase);

        if (selectedStudents.length === 0) {
          // Keep individual fees optional: if no students are picked, still allow the fee row to save.
          totalAmount += amount;
          return;
        }

        const selectedTotal = selectedStudents.reduce((sum, student) => {
          const studentAmount = Number(student?.assignedAmount);
          return sum + (Number.isFinite(studentAmount) ? studentAmount : amount || 0);
        }, 0);
        totalAmount += selectedTotal;

        selectedStudents.forEach((student) => {
          individualFeeAssignments.push({
            type: fee.columnBase,
            feeName: fee.feeName,
            feeTypeId: fee.id,
            amount: Number.isFinite(Number(student?.assignedAmount))
              ? Number(student?.assignedAmount)
              : amount || 0,
            installments: normalizeInstallmentRowsForSave(student?.installments || student?.installmentDetails || []),
            installmentDetails: normalizeInstallmentRowsForSave(student?.installments || student?.installmentDetails || []),
            studentId: student?.id ?? student?.student_id ?? null,
            studentName: student?.name || student?.StudentName || "",
            className,
            section,
          });
        });
      });

    console.log('[FEES] Calculated Fees:', calculatedFees);
    console.log('[FEES] Calculated Dynamic Fees:', calculatedDynamicFees);
    console.log('[FEES] Total Fee Amount:', totalAmount);

    if (totalAmount === 0) {
      console.warn('[VALIDATION] Total fee is zero');
      displayToast(
        "❗ Total fee amount cannot be zero. Please enter amounts in the Fee Summary box.",
        "error"
      );
      return;
    }

    incomeData = {
      ...incomeData,
      class_name: className,
      class_section: section,
      ...calculatedFees,
      ...calculatedDynamicFees,
      individualFeeAssignments,
      feeEntries: Object.keys(calculatedFees).map(key => ({
        type: key,
        amount: calculatedFees[key],
        className,
        section,
      })).concat(
        dynamicFees.map((fee) => ({
          type: fee.columnBase,
          feeName: fee.feeName,
          feeTypeId: fee.id,
          amount: String(fee.scope || "").trim().toLowerCase() === "individual"
            ? (Array.isArray(individualFeeAssignments)
                ? individualFeeAssignments
                    .filter((item) => item.type === fee.columnBase)
                    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
                : 0)
            : calculatedDynamicFees[fee.columnBase] || 0,
          scope: fee.scope || "All",
          className,
          section,
          studentName: getSelectedIndividualFeeStudentsForSubmit(fee.columnBase)
            .map((student) => student?.name || student?.StudentName || "")
            .filter(Boolean)
            .join(", "),
          studentId: getSelectedIndividualFeeStudentsForSubmit(fee.columnBase)
            .map((student) => student?.id ?? student?.student_id ?? null)
            .filter((value) => value !== null && value !== undefined && String(value).trim() !== ""),
          studentIds: getSelectedIndividualFeeStudentsForSubmit(fee.columnBase)
            .map((student) => student?.id ?? student?.student_id ?? null)
            .filter((value) => value !== null && value !== undefined && String(value).trim() !== ""),
        }))
      ),
    };

    console.log('[FEES] Final incomeData:', incomeData);
    console.log('[FEES] feeEntries payload:', incomeData.feeEntries);
  }

  else if (incomeType === 'installments') {
    // This part is redundant as installments are now handled by a separate button/section
    displayToast("❗ Please use the 'Save Fee Type Installments' button in the installment panel.", "error");
    return;
  }

  try {
    console.log('[API] Sending PUT request to /income');
    console.log('[API] Payload:', incomeData);

    const response = await axios.put(
      'https://cleezoclass.com:4000/income',
      incomeData
    );

    console.log('[API] Response:', response.data);

    let successMessage = `✅ Income data added successfully for school: ${schoolCode}!`;
    if (incomeType === 'fees') {
      successMessage = `✅ Fees submitted successfully for Class ${className} Section ${section}!`;
    }

    displayToast(successMessageOverride || successMessage, "success");

    if (resetAfterSuccess) {
      console.log('[RESET] Clearing form state');

      setClassName('');
      setSection('');
      setFees({
        tuition: 0,
        exam: 0,
        bus: 0,
        residential: 0,
        uniform: 0,
        books: 0,
        other: 0,
        admission: 0,
        previousfeedue: 0,
      });
      setIndividualFeeStudentMap({});
      setActiveIndividualFee(null);
      setIndividualFeeDraftAmount("");
      setShowIndividualFeeStudentPopup(false);

      setIncomeType('fees');
      setInstallments([]); // Reset installments on successful fee submission
    }

  } catch (error) {
    console.error('[API ERROR] Submission failed:', error);
    console.error('[API ERROR] Server response:', error.response?.data);

    displayToast(
      `❌ Error submitting income data: ${
        error.response?.data?.message || error.message
      }`,
      "error"
    );
  }
};

const handleSubmit = async (event) => {
  return submitIncomeData({ event });
};

  const generatePDFBlob = async () => {
    const element = dashboardRef.current;
    if (!element) return null;

    if (typeof window.html2canvas === 'undefined') {
      console.error('html2canvas is not defined.');
      displayToast('html2canvas library is not loaded. Please ensure the CDN script is included.', 'error');
      return null;
    }
    const canvas = await window.html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    if (typeof window.jsxpdf === 'undefined' || typeof window.jsxpdf.jsxPDF === 'undefined') {
      console.error('jsPDF is not defined.');
      displayToast('jsPDF library is not loaded. Please ensure the CDN script is included.', 'error');
      return null;
    }
    const { jsPDF } = window.jsxpdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };






  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) {
        console.warn('No school code found in localStorage. Aborting fetch.');
        return;
      }
      setDynamicSchoolCode(code);
      try {
        const response = await axios.post(
          'https://cleezoclass.com:4000/api/schoollogodynamic',
          { secretecode: code },
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (response.data.logoPath) {
          setDynamicLogoSrc(response.data.logoPath);
        } else {
          console.warn('No logo path found in backend response.');
        }
      } catch (error) {
        console.error('Error fetching school logo:', error.response?.data || error.message);
      }
    };

    const data = localStorage.getItem('institutionData');
    if (data) {
      setInstitutionData(JSON.parse(data));
    }
    fetchSchoolLogo();
  }, []);

  useEffect(() => {
    if (!selectedStudent || !showModal) return;

    const fetchStudentDiscount = async () => {
      try {
        const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";
        const apiClassName = className.replace("Class ", "");
        const response = await fetch(
          `https://cleezoclass.com:4000/get-student-discount?studentName=${encodeURIComponent(selectedStudent.name)}&className=${apiClassName}&sectionName=${section}&schoolCode=${schoolCode}`
        );
        const data = await response.json();

        if (data.success && data.discounts) {
          setStudentDiscount(data.discounts);
        } else {
          setStudentDiscount(null);
        }
      } catch (err) {
        console.error("Failed to fetch student discount", err);
        setStudentDiscount(null);
      }
    };

    fetchStudentDiscount();
  }, [selectedStudent, showModal, className, section]);

  const displayToast = (message, type) => {
    setToast({ show: true, message, type });
  };
const formatINR = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};



  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '10px',
    color: '#333',
    fontWeight: '500',
  };

const [showAdmissionFeePopup, setShowAdmissionFeePopup] = useState(false);
const [admissionFeeStudents, setAdmissionFeeStudents] = useState([]);
const [selectedAdmissionStudent, setSelectedAdmissionStudent] = useState(null);
const [admissionFeeAmount, setAdmissionFeeAmount] = useState('');
const [oldAdmissionFee, setOldAdmissionFee] = useState(null);
const handleAdmissionFeeSelect = async () => {
  if (!className || !section) {
    displayToast('Please select both class and section', "error");
    return;
  }
  try {
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
    const apiClassName = className.replace("Class ", "");
    const response = await axios.get(`https://cleezoclass.com:4000/get-students?className=${apiClassName}&section=${section}&schoolCode=${schoolCode}`);
    if (response.data.success && response.data.students) {
      setAdmissionFeeStudents(response.data.students);
      setShowAdmissionFeePopup(true);
    } else {
      displayToast('No students found for the selected class and section', "error");
    }
  } catch (error) {
    console.error('Error loading students:', error);
    displayToast('Error loading students', "error");
  }
};

  const [showIndividualAdmissionFeePopup, setShowIndividualAdmissionFeePopup] = useState(false);
useEffect(() => {
  const fetchOldAdmissionFee = async () => {
    try {
      const schoolCode = localStorage.getItem('schoolCode');
      const response = await axios.post('https://cleezoclass.com:4000/pay-admission-fee', {
        studentName: selectedAdmissionStudent?.name,
        className: className.replace("Class ", ""),
        sectionName: section,
        schoolCode: schoolCode,
      });
      if (response.data.FeesDetails) {
        setOldAdmissionFee(response.data.FeesDetails.Admission_Fee);
        setLoginId(response.data.login_id);
      }
    } catch (error) {
      console.error('Error fetching old admission fee:', error);
    }
  };
  if (showIndividualAdmissionFeePopup) {
    fetchOldAdmissionFee();
  }
}, [showIndividualAdmissionFeePopup]);

useEffect(() => {
  // Run only when class or section changes
  if (className && section) {
    setShowInstallmentModal(false); // close popup
    setInstallments([]);            // clear old installments
    setInstallmentCount(0);          // reset count
    setActiveInstallmentFee(null);
  }
}, [className, section]);

const installmentFeeTotal = Number(activeInstallmentAmount) || 0;
const installmentConfiguredAmount = Array.isArray(installments)
  ? installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0)
  : 0;
const installmentRemainingAmount = Math.max(installmentFeeTotal - installmentConfiguredAmount, 0);
const installmentProgressPercent = installmentFeeTotal > 0
  ? Math.min(100, Math.round((installmentConfiguredAmount / installmentFeeTotal) * 100))
  : 0;
const installmentRowsToRender = Array.isArray(installments) && installments.length > 0
  ? installments
  : buildPlaceholderInstallments(Math.max(Number(installmentCount) || 1, 1));

 return (
  <>
    {toast.show && (
      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    )}

    <div
      ref={dashboardRef}
      className={`FeesManagement-dashboardContainer${popupLayout ? " FeesManagement-popupMode" : ""}`}
    >
      <div className="FeesManagement-formContainer">
        <form onSubmit={handleSubmit}>
          {incomeType === 'fees' && (
            <div className="FeesManagement-innerPadding">
              <div className="FeesManagement-leftRightFlex">
                {/* LEFT BLOCK */}
                <div className="FeesManagement-leftBlock">
                  <h2 className="footprintsinner">Add Fee per class</h2>
                </div>

                {/* RIGHT BLOCK - Class & Section */}
             <div className="FeesManagement-rightBlock">
  <div className={`FeesManagement-dropdown${popupLayout ? " FeesManagement-dropdown-static" : ""}`}>
    <div>
      <label className="footprintsinner">Class</label>
      <div className="expense-input-field">
        <select
          value={className}
          onChange={(e) => {
            setClassName(e.target.value);
            setSection("");
            // 🔄 REFRESH: Clear all fee amounts and overrides when class changes
            setDynamicFeeValues({});
            if (localDynamicFeeValueOverridesRef && localDynamicFeeValueOverridesRef.current) {
              localDynamicFeeValueOverridesRef.current = {};
            }
          }}
          className="btn-dropdown-FeesManagement"
        >
          <option value="">
            {metadataLoading ? 'Loading Classes...' : 'Select Class'}
          </option>
          {availableClassOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div>
      <label className="footprintsinner">Section</label>
      <div className="expense-input-field">
    <select
  value={section}
  onChange={(e) => {
    setSection(e.target.value);
    setDynamicFeeValues({});
    if (localDynamicFeeValueOverridesRef?.current) {
      localDynamicFeeValueOverridesRef.current = {};
    }
  }}
  disabled={!className}
  className="btn-dropdown-FeesManagement"
  style={{
    backgroundColor: !className ? "#e9ecef" : "#fff",
    color: !className ? "#6c757d" : "#000",
    cursor: !className ? "not-allowed" : "pointer",
    opacity: 1, // keeps the gray color instead of browser's faded disabled style
  }}
>
  <option value="">
    {className
      ? metadataLoading && availableSectionOptions.length === 0
        ? "Loading Sections..."
        : "Select Section"
      : "Select Class First"}
  </option>

  {sectionSelectOptions.map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))}
</select>
      </div>
    </div>
  </div>
</div>
                                    <div className="FeesManagement-bottomBtns" style={{border:'none'}}>
                <button
                  type="submit"
                  className="btn-solid"
                  style={{ width: "200px", flexShrink: 0 }}
                >
                  Submit Fees
                </button>
              </div>
              </div>

              {/* FEE STRUCTURE SECTION */}
       <div className="FeesManagement-sectionContainer">
  <h3 className="FeesManagement-sectionHeader footprintsinner">
    Created Fee Types
  </h3>
  <div
    style={{
      margin: "0 0 12px",
      padding: "10px 12px",
      border: "1px solid #f3c5cd",
      borderRadius: "8px",
      background: "#fff7f8",
      color: "#8a2634",
      fontSize: "12px",
      fontWeight: 600,
      lineHeight: 1.45,
    }}
  >
    To remove a class-wise or term-wise fee for the selected class/section, set its amount to 0 or leave it blank, then submit fees. Use the delete button only when you want to remove the complete fee type everywhere it is used.
  </div>

{/* --- Check if class and section are selected --- */}
{className && section ? (
  <>
    {dynamicFeeTypes.map((fee) => {
      const isIndividualFee = String(fee.scope || "").trim().toLowerCase() === "individual";
      const isTermWise = String(fee.frequency || "").trim().toLowerCase() === "term wise";
      const installmentSavedCount =
        feeTypeInstallmentCounts[getFeeInstallmentScopeKey(fee.id)];
      const fallbackInstallmentCount = Number(fee.installments) || 0;
      const selectedStudentSummary = getSelectedIndividualFeeStudents(fee.columnBase);

      return (
        <div
          key={fee.columnBase}
          className="FeesManagement-feeRow"
          style={{
            display: "grid",
            gridTemplateColumns: isCompactFeeRowLayout ? "120px 1fr 94px 94px 42px" : "150px 170px 100px 100px 42px",
            alignItems: "stretch",
            columnGap: 0,
            rowGap: 0,
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            overflow: "hidden",
            background: "#fff",
            marginBottom: "10px",
          }}
        >
          <div style={{
            padding: isCompactFeeRowLayout ? "8px 10px" : "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "64px"
          }}>
            <label className="FeesManagement-feeLabel" style={{ marginTop: 0, width: "100%", textAlign: "center", fontSize: isCompactFeeRowLayout ? "9px" : "10px" }}>
              {fee.feeName}:
            </label>
          </div>

          <div style={{
            padding: isCompactFeeRowLayout ? "8px 10px" : "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 0,
            minHeight: "64px"
          }}>
            <div className="FeesManagement-labelInputFlex" style={{ minWidth: 0, width: "100%", justifyContent: "center", gap: isCompactFeeRowLayout ? "4px" : "6px" }}>
              <span style={{ color: "#555", flex: "0 0 auto", fontSize: isCompactFeeRowLayout ? "10px" : "inherit" }}>₹</span>
              <div className="expense-input-field" style={{ width: "100%", flex: "1 1 auto", maxWidth: isCompactFeeRowLayout ? "92px" : "118px" }}>
                <input
                  type="text"
                  className="btn-dropdown-FeesManagement FeesManagement"
                  value={
                    editingField === fee.columnBase
                      ? String(dynamicFeeValues[fee.columnBase] || "")
                      : formatINR(dynamicFeeValues[fee.columnBase] || 0)
                  }
                  onFocus={() => setEditingField(fee.columnBase)}
                  onBlur={() => setEditingField(null)}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    if (rawValue === "") {
                      localDynamicFeeValueOverridesRef.current[fee.columnBase] = true;
                      setDynamicFeeValues((prev) => ({ ...prev, [fee.columnBase]: 0 }));
                      return;
                    }
                    if (/^\d*\.?\d*$/.test(rawValue)) {
                      const numericValue = parseFloat(rawValue);
                      if (!isNaN(numericValue)) {
                        localDynamicFeeValueOverridesRef.current[fee.columnBase] = true;
                        setDynamicFeeValues((prev) => ({ ...prev, [fee.columnBase]: numericValue }));
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{
            padding: isCompactFeeRowLayout ? "8px 8px" : "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "64px"
          }}>
            {isTermWise && !isIndividualFee ? (
              <div style={{ display: "grid", gap: "3px", width: "100%", justifyItems: "center" }}>
                <button
                  type="button"
                  className="btn-solid"
                  style={{
                    whiteSpace: "wrap",
                    padding: isCompactFeeRowLayout ? "4px 5px" : "5px 6px",
                    width: "100%",
                    fontSize: isCompactFeeRowLayout ? "10px" : "11px",
                    lineHeight: 1.1
                  }}
                  onClick={() => {
                    const fallbackCount = Math.max(1, Number(fee.installments) || 1);
                    const feeAmount = Number(dynamicFeeValues[fee.columnBase] || 0);
                    setActiveInstallmentFee(fee);
                    setActiveIndividualInstallmentStudent(null);
                    setInstallmentCount(fallbackCount);
                    setShowInstallmentModal(true);
                    loadInstallmentsForFeeType(fee.id, fallbackCount, feeAmount).then((rows) => {
                      setInstallments(rows);
                      setInstallmentCount(rows.length || fallbackCount);
                    });
                  }}
                >
                  Add Installments
                </button>
                <span style={{ fontSize: "11px", color: "#6b7280", textAlign: "center" }}>
                  {`Saved: ${installmentSavedCount ?? fallbackInstallmentCount}`}
                </span>
              </div>
            ) : null}
          </div>

          <div style={{
            padding: isCompactFeeRowLayout ? "8px 8px" : "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "64px"
          }}>
            {isIndividualFee ? (
              <button
                type="button"
                className="btn-solid"
                style={{
                  whiteSpace: "wrap",
                  padding: isCompactFeeRowLayout ? "4px 5px" : "5px 6px",
                  width: "100%",
                  fontSize: isCompactFeeRowLayout ? "10px" : "11px",
                  lineHeight: 1.1
                }}
                onClick={() => openIndividualFeeStudentPicker(fee)}
              >
                {selectedStudentSummary.length > 0 ? "Change Students" : "Select Students"}
              </button>
            ) : null}
          </div>

          <div style={{
            padding: isCompactFeeRowLayout ? "8px 8px" : "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "64px"
          }}>
            <button
              type="button"
              className="btn-solid"
              title="Delete complete fee type everywhere"
              aria-label={`Delete complete fee type ${fee.feeName}`}
              style={{
                whiteSpace: "nowrap",
                padding: "3px 4px",
                width: "30px",
                minWidth: "30px",
                height: "30px",
                background: "#fee2e2",
                color: "#b91c1c",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => handleDeleteFeeType(fee)}
            >
              <Trash2 size={12} />
            </button>
          </div>

          <div style={{ gridColumn: "1 / -1", padding: isCompactFeeRowLayout ? "6px 10px" : "8px 12px", fontSize: "12px", color: "#6b7280", background: "#fbfdff" }}>
            {isIndividualFee
              ? (selectedStudentSummary.length > 0
                  ? `Students: ${selectedStudentSummary
                      .slice(0, 2)
                      .map((student) => student.name || student.StudentName || "Student")
                      .join(", ")}${
                      selectedStudentSummary.length > 2
                        ? ` +${selectedStudentSummary.length - 2} more`
                        : ""
                    }`
                  : "This fee type is individual. Select one or more students before submitting.")
              : "\u00A0"}
          </div>
        </div>
      );
    })}
  </>
) : (
  /* --- Message shown when Class/Section are empty --- */
  <div style={{
    margin: "12px 0",
    padding: "20px",
    border: "2px dashed #cbd5e1",
    borderRadius: "10px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "500"
  }}>
    Please select Class and Section above to enter the fees.
  </div>
)}

  <div className="FeesManagement-totalRow">
    <span>Total Fees:</span>
    <span>
      ₹
      {Object.values(dynamicFeeValues)
        .reduce((a, b) => parseFloat(a) + (parseFloat(b) || 0), 0)
        .toFixed(2)}
    </span>
  </div>
</div>

              {/* BOTTOM BUTTONS */}
              {/* <div className="FeesManagement-bottomBtns">
                <button
                  type="submit"
                  className="btn-solid"
                  style={{ width: "200px", flexShrink: 0 }}
                >
                  Submit Fees
                </button>
              </div> */}
            </div>
          )}
        </form>
      </div>
{showPreviousFeeDuePopup && (
  <div className="FeesManagement-popupOverlay" onClick={() => setShowPreviousFeeDuePopup(false)}>
    <div className="FeesManagement-popupContent" onClick={(e) => e.stopPropagation()}>
      <button className="FeesManagement-popupCloseBtn" onClick={() => setShowPreviousFeeDuePopup(false)}>
        &times;
      </button>
      <h2 className="FeesManagement-popupTitle">
        Previous Fee Due Students - Class {className.replace("Class ", "")} Section {section}
      </h2>
      <p style={{ textAlign: "center", marginBottom: "20px", color: "#f44336", fontWeight: "bold" }}>
        Click on a student's name to set their individual Previous Fee Due.
      </p>
      <div className="FeesManagement-studentGrid">
        {previousFeeDueStudents.length > 0 ? (
          previousFeeDueStudents.map((student, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedPreviousFeeDueStudent(student);
                setShowIndividualPreviousFeeDuePopup(true);
              }}
              className="FeesManagement-studentCard"
            >
              <div className="FeesManagement-studentAvatar">
                <User size={16} />
              </div>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {student.name}
              </span>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", gridColumn: "1 / -1", fontSize: "14px" }}>No students found.</p>
        )}
      </div>
    </div>
  </div>
)}

{/* {showIndividualPreviousFeeDuePopup && (
  <div className="FeesManagement-popupOverlay" onClick={() => setShowIndividualPreviousFeeDuePopup(false)}>
    <div className="FeesManagement-popupContent" style={{ width: 'min(90%, 480px)' }} onClick={(e) => e.stopPropagation()}>
      <button className="FeesManagement-popupCloseBtn" onClick={() => setShowIndividualPreviousFeeDuePopup(false)}>
        &times;
      </button>
      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        Previous Fee Due for {selectedPreviousFeeDueStudent?.name}
      </h3>
      <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
        <p><strong>Student ID:</strong> {loginId || 'Not set'}</p>
      </div>
      <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
        <p><strong>Previous Fee Due:</strong> {oldPreviousFeeDue || 'Not set'}</p>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Amount:</label>
        <input
          type="number"
          value={previousFeeDueAmount}
          onChange={(e) => setPreviousFeeDueAmount(e.target.value)}
          onWheel={(e) => e.target.blur()}
          className="no-spinner btn-dropdown-FeesManagement"
          placeholder="Enter Previous Fee Due Amount"
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        />
      </div>
      <button
        className="btn-solid"
        style={{ width: "100%" }}
        onClick={async () => {
          try {
            const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";
            const response = await axios.post(
              "https://cleezoclass.com:4000/pay-previous-feedue",
              {
                studentName: selectedPreviousFeeDueStudent.name,
                className: className.replace("Class ", ""),
                sectionName: section,
                schoolCode: schoolCode,
                previousFeeDue: previousFeeDueAmount,
              }
            );
            if (response.data.success) {
              displayToast(`Previous fee due for ${selectedPreviousFeeDueStudent.name} saved successfully!`, "success");
              setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
              setShowIndividualPreviousFeeDuePopup(false);
            } else {
              displayToast(`Failed to save previous fee due: ${response.data.message}`, "error");
            }
          } catch (error) {
            console.error("Error saving previous fee due:", error);
            displayToast(
              `Error saving previous fee due: ${error.response?.data?.message || error.message}`,
              "error"
            );
          }
        }}
      >
        Submit
      </button>
    </div>
  </div>
)} */}

{showResidentialFeePopup && (
  <div className="FeesManagement-popupOverlay" onClick={() => setShowResidentialFeePopup(false)}>
    <div className="FeesManagement-popupContent" onClick={(e) => e.stopPropagation()}>
      <button className="FeesManagement-popupCloseBtn" onClick={() => setShowResidentialFeePopup(false)}>
        &times;
      </button>
      <h2 className="FeesManagement-popupTitle">
        Residential Fee Students - Class {className.replace("Class ", "")} Section {section}
      </h2>
      <p style={{ textAlign: "center", marginBottom: "20px", color: "#f44336", fontWeight: "bold" }}>
        Click on a student's name to set their individual Residential Fee.
      </p>
      <div className="FeesManagement-studentGrid">
        {residentialFeeStudents.length > 0 ? (
          residentialFeeStudents.map((student, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedResidentialStudent(student);
                setShowIndividualResidentialFeePopup(true);
              }}
              className="FeesManagement-studentCard"
            >
              <div className="FeesManagement-studentAvatar">
                <User size={16} />
              </div>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {student.name}
              </span>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", gridColumn: "1 / -1", fontSize: "14px" }}>No students found.</p>
        )}
      </div>
    </div>
  </div>
)}

{showIndividualResidentialFeePopup && (
  <div className="FeesManagement-popupOverlay" onClick={() => setShowIndividualResidentialFeePopup(false)}>
    <div className="FeesManagement-popupContent" style={{ width: 'min(90%, 480px)' }} onClick={(e) => e.stopPropagation()}>
      <button className="FeesManagement-popupCloseBtn" onClick={() => setShowIndividualResidentialFeePopup(false)}>
        &times;
      </button>
      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        Residential Fee for {selectedResidentialStudent?.name}
      </h3>
      <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
        <p><strong>Student ID:</strong> {loginId || 'Not set'}</p>
      </div>
      <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
        <p><strong>Previous Residential Fee:</strong> {oldResidentialFee || 'Not set'}</p>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Amount:</label>
        <input
          type="number"
          value={residentialFeeAmount}
          onChange={(e) => setResidentialFeeAmount(e.target.value)}
          onWheel={(e) => e.target.blur()}
          className="no-spinner btn-dropdown-FeesManagement"
          placeholder="Enter Residential Fee Amount"
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        />
      </div>
      <button
        className="btn-solid"
        style={{ width: "100%" }}
        onClick={async () => {
          try {
            const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";
            const response = await axios.post(
              "https://cleezoclass.com:4000/pay-residential-fee",
              {
                studentName: selectedResidentialStudent.name,
                className: className.replace("Class ", ""),
                sectionName: section,
                schoolCode: schoolCode,
                residentialFee: residentialFeeAmount,
              }
            );
            if (response.data.success) {
              displayToast(`Residential fee for ${selectedResidentialStudent.name} saved successfully!`, "success");
              setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
              setShowIndividualResidentialFeePopup(false);
            } else {
              displayToast(`Failed to save residential fee: ${response.data.message}`, "error");
            }
          } catch (error) {
            console.error("Error saving residential fee:", error);
            displayToast(
              `Error saving residential fee: ${error.response?.data?.message || error.message}`,
              "error"
            );
          }
        }}
      >
        Submit
      </button>
    </div>
  </div>
)}

      {/* INSTALLMENT MODAL */}
      {showInstallmentModal && (
        <div
          className="FeesManagement-installmentModalOverlay"
          onClick={() => {
            setShowInstallmentModal(false);
            setActiveIndividualInstallmentStudent(null);
          }}
        >
          <div
            className="FeesManagement-installmentModal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="FeesManagement-installmentHeader">
              <div className="FeesManagement-installmentHeaderMain">
                <div className="FeesManagement-installmentHeaderText">
                  <h3 className="footprintsinner FeesManagement-sectionHeader" style={{ borderBottom: "none", paddingBottom: 0 }}>
                    {activeIndividualInstallmentStudent
                      ? `${activeIndividualInstallmentStudent?.name || activeIndividualInstallmentStudent?.StudentName || "Selected Student"} - ${activeInstallmentFee?.feeName || "Individual Fee"} Installments`
                      : `${activeInstallmentFee?.feeName || "Selected Fee"} Installments`}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className="FeesManagement-installmentClose"
                onClick={() => {
                  setShowInstallmentModal(false);
                  setActiveIndividualInstallmentStudent(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="FeesManagement-installmentBody">
              <div className="FeesManagement-installmentInlineRow">
                <div className="FeesManagement-installmentConfiguredSummary">
                  Total Amount:
                  <strong>
                    ₹{installmentConfiguredAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>

                <div className="FeesManagement-installmentInlineControls">
                  <div className="FeesManagement-installmentControlLabel">Number of Installments</div>
                  <div className="FeesManagement-installmentStepper">
                    <button type="button" className="FeesManagement-installmentStepperBtn" onClick={handleDecreaseInstallments} disabled={(Number(installmentCount) || 0) <= 1}>
                      −
                    </button>
              <input
  type="number"
  value={installmentCount || ""}
  onChange={(e) => {
    const nextCount = Math.max(parseInt(e.target.value, 10) || 0, 1);
    setInstallmentCount(nextCount);
    const nextTotal = getInstallmentSplitAmount();
    if (nextCount > 0 && nextTotal > 0) {
      setInstallments(buildInstallments(nextCount, nextTotal));
    } else {
      setInstallments(buildPlaceholderInstallments(nextCount || 1));
    }
  }}
  min="1"
  onWheel={(e) => e.target.blur()}
  className="FeesManagement-installmentCountInput"
/>
                    <button type="button" className="FeesManagement-installmentStepperBtn FeesManagement-installmentStepperBtnPlus" onClick={handleIncreaseInstallments}>
                      +
                    </button>
                  </div>
                </div>
              </div>

                            <div className="FeesManagement-installmentsTableTitle">Installment Details</div>

              <div className="FeesManagement-installmentsTableCard">
                <div className="FeesManagement-installmentsList">
                  <table className="FeesManagement-installmentsTable">
                    <colgroup>
                      <col style={{ width: "64px" }} />
                      <col style={{ width: "34%" }} />
                      <col style={{ width: "33%" }} />
                      <col style={{ width: "33%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Installment</th>
                        <th>Amount (₹)</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installmentRowsToRender.map((inst, index) => (
                        <tr key={inst.id}>
                          <td className="FeesManagement-installmentIndex">{inst.id}</td>
                          <td className="FeesManagement-installmentName">Installment {inst.id}</td>
                          <td>
                            <input
                              type="number"
                              value={inst.amount}
                              onChange={(e) => handleAmountChange(index, e.target.value)}
                              onWheel={(e) => e.target.blur()}
                              className="FeesManagement-installmentInput"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="FeesManagement-installmentDateInput"
                              value={inst.date}
                              onChange={(e) => handleDateChange(index, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="FeesManagement-installmentFooter">
                <button type="button" className="btn-solid1" onClick={() => setInstallments(buildInstallments(Math.max(Number(installmentCount) || 1, 1), getInstallmentSplitAmount()))}>
                  Reset All
                </button>
                <div className="FeesManagement-installmentFooterActions">
                  <button
                    type="button"
                    className="btn-solid1"
                    onClick={() => {
                      setShowInstallmentModal(false);
                      setActiveIndividualInstallmentStudent(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-solid"
                    onClick={handleSaveFeeTypeInstallments}
                    disabled={Number(activeInstallmentAmount) <= 0 && Number(installmentConfiguredAmount) <= 0}
                  >
                    Save Installments
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

{showIndividualFeeStudentPopup && (
  <div className="FeesManagement-popupOverlay" onClick={closeIndividualFeeStudentPopup}>
    <div
      className="FeesManagement-popupContent"
      style={{ width: 'min(94%, 1040px)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="FeesManagement-popupCloseBtn" onClick={closeIndividualFeeStudentPopup}>
        &times;
      </button>
      <h2 className="FeesManagement-popupTitle">
        Select Student for {activeIndividualFee?.feeName || "Individual Fee"}
      </h2>
      <p style={{ textAlign: "center", marginBottom: "18px", color: "#6b7280", fontWeight: 600 }}>
        Choose one or more students, then set a different amount for each student if needed.
      </p>
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-end",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "0 0 auto" }}>
          <label style={{ fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
            Search student
          </label>
          <input
            type="text"
            value={individualFeeStudentSearch}
            onChange={(e) => setIndividualFeeStudentSearch(e.target.value)}
            className="btn-dropdown-FeesManagement"
            style={{ width: "150px" }}
            placeholder="Search by name, id, or mobile"
          />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: (selectedIndividualFeeBatches.length > 0 || selectedIndividualFeeStudents.length > 0)
            ? "minmax(0, 1.1fr) minmax(300px, 0.9fr)"
            : "minmax(0, 1fr)",
          gap: "14px",
          alignItems: "start",
          marginTop: "4px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            className="FeesManagement-studentGrid"
            style={{
              maxHeight: "440px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {visibleIndividualFeeStudents.length > 0 ? (
              visibleIndividualFeeStudents.map((student, index) => (
                <div
                  key={student.id || `${student.name}-${index}`}
                  onClick={() => {
                    if (!activeIndividualFee?.columnBase) return;
                    toggleIndividualFeeStudent(student);
                  }}
                  className={`FeesManagement-studentCard ${
                    selectedIndividualFeeStudents.some((item) => {
                      const itemId = String(item?.id ?? item?.student_id ?? "").trim();
                      const studentId = String(student.id ?? student.student_id ?? "").trim();
                      if (studentId && itemId) return studentId === itemId;
                      return String(item?.name || "").trim().toLowerCase() === String(student?.name || "").trim().toLowerCase();
                    })
                      ? "FeesManagement-studentCard-selected"
                      : ""
                  }`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "12px 10px 10px",
                    borderRadius: "14px",
                    background: selectedIndividualFeeStudents.some((item) => {
                      const itemId = String(item?.id ?? item?.student_id ?? "").trim();
                      const studentId = String(student.id ?? student.student_id ?? "").trim();
                      if (studentId && itemId) return studentId === itemId;
                      return String(item?.name || "").trim().toLowerCase() === String(student?.name || "").trim().toLowerCase();
                    }) ? "#eef6ff" : "#fff",
                    border: selectedIndividualFeeStudents.some((item) => {
                      const itemId = String(item?.id ?? item?.student_id ?? "").trim();
                      const studentId = String(student.id ?? student.student_id ?? "").trim();
                      if (studentId && itemId) return studentId === itemId;
                      return String(item?.name || "").trim().toLowerCase() === String(student?.name || "").trim().toLowerCase();
                    }) ? "1px solid #6bb8ff" : "1px solid #e5e7eb",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    minHeight: "132px",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "#5a7488",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={16} />
                  </div>
                  <div style={{ minWidth: 0, width: "100%", textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#111827",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {student.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Assigned Amount</div>
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#000",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ₹
                    {Number(getDisplayedAmountForIndividualFeeStudent(activeIndividualFee?.columnBase, student)).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", gridColumn: "1 / -1", fontSize: "14px" }}>
                {individualFeeStudentSearch.trim()
                  ? "No students match your search."
                  : "No students found for the selected class and section."}
              </p>
            )}
          </div>
        </div>

        {(selectedIndividualFeeBatches.length > 0 || selectedIndividualFeeStudents.length > 0) ? (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "10px 12px",
              background: "#fafafa",
              display: "grid",
              gap: "6px",
              alignSelf: "start",
              minWidth: 0,
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151" }}>
              Selected assignment preview
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Edit each student's amount before saving.
            </div>
            <div
              style={{
                border: "1px solid #dbe2ea",
                borderRadius: "12px",
                background: "#fff",
                padding: "10px",
                display: "grid",
                gap: "10px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#374151" }}>
                New batch
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <label style={{ fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  value={individualFeeDraftAmount}
                  onChange={(e) => handleIndividualFeeDraftAmountChange(e.target.value)}
                  className="btn-dropdown-FeesManagement"
                  style={{ width: "150px" }}
                  placeholder="Enter amount"
                />
                <button
                  type="button"
                  className="btn-solid"
                  style={{ height: "36px", padding: "0 12px", whiteSpace: "nowrap" }}
                  onClick={applyIndividualFeeDraftAmountToSelectedStudents}
                >
Add                </button>
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                Pick students on the left, enter the amount here, and add them as a new batch.
              </div>
            </div>
            {selectedIndividualFeeBatches.length > 0 ? (
              <div style={{ display: "grid", gap: "10px", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
                {selectedIndividualFeeBatches.map((batch, batchIndex) => {
                  const batchStudents = Array.isArray(batch?.students) ? batch.students.filter(Boolean) : [];
                  const batchTotal = batchStudents.reduce((sum, student) => sum + (Number(student?.assignedAmount) || 0), 0);
                  return (
                    <div
                      key={`batch-${batch.batchNo || batchIndex}`}
                      style={{
                        border: "1px solid #dbe2ea",
                        borderRadius: "12px",
                        background: "#fff",
                        padding: "10px",
                        display: "grid",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ fontWeight: 700, color: "#111827" }}>
                          Batch {batch.batchNo || batchIndex + 1}
                        </div>
                        <div style={{ fontWeight: 700, color: "#ef4444" }}>
                          ₹
                          {Number(batch.amount ?? batchTotal).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <label style={{ fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                          Amount
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={batch.amount ?? batchTotal}
                          onChange={(e) => updateIndividualFeeBatchAmount(batch.batchNo || batchIndex + 1, e.target.value)}
                          className="btn-dropdown-FeesManagement"
                          style={{ width: "150px" }}
                          placeholder="Enter amount"
                        />
                        <button
                          type="button"
                          className="btn-solid"
                          style={{ height: "36px", padding: "0 12px", whiteSpace: "nowrap" }}
                          onClick={() => updateIndividualFeeBatchAmount(batch.batchNo || batchIndex + 1, batch.amount ?? batchTotal)}
                        >
                          Update batch
                        </button>
                      </div>
                      <div style={{ display: "grid", gap: "6px" }}>
                {batchStudents.map((student, studentIndex) => {
  // Debug log for button visibility
  console.log("[INSTALLMENTS BUTTON DEBUG] Batch Student:", {
    studentName: student.name || student.StudentName || "Unknown",
    feeFrequency: activeIndividualFee?.frequency,
    hasInstallments: Array.isArray(student?.installments) && student.installments.length > 0,
    hasInstallmentDetails: Array.isArray(student?.installmentDetails) && student.installmentDetails.length > 0,
    conditionMet:
      activeIndividualFee?.frequency?.toLowerCase() === "term wise" ||
      (Array.isArray(student?.installments) && student.installments.length > 0) ||
      (Array.isArray(student?.installmentDetails) && student.installmentDetails.length > 0),
  });

  return (
    <div
      key={`${batch.batchNo || batchIndex}-${student?.id || student?.student_id || student?.name || "student"}-${studentIndex}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "13px",
        color: "#374151",
        padding: "6px 8px",
        borderRadius: "8px",
        background: "#f8fafc",
      }}
    >
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {student.name || student.StudentName || "Student"}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        <span style={{ fontWeight: 700, color: "#ef4444", whiteSpace: "nowrap" }}>
          ₹
          {Number(student?.assignedAmount || batch.amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        {(activeIndividualFee?.frequency?.toLowerCase() === "term wise" ||
          (Array.isArray(student?.installments) && student.installments.length > 0) ||
          (Array.isArray(student?.installmentDetails) && student.installmentDetails.length > 0)) && (
          <button
            type="button"
            className="btn-solid"
            title="Add installments for this student"
            aria-label={`Add installments for ${student.name || student.StudentName || "student"}`}
            style={{
              height: "28px",
              minWidth: "86px",
              padding: "3px 8px",
              background: Array.isArray(student?.installments) && student.installments.length ? "#dcfce7" : "#fef3c7",
              color: Array.isArray(student?.installments) && student.installments.length ? "#166534" : "#92400e",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              whiteSpace: "nowrap",
            }}
            onClick={() => {
              console.log("[INSTALLMENTS BUTTON CLICKED] Student:", student.name || student.StudentName || "Unknown");
              openIndividualStudentInstallments(student);
            }}
          >
            Installments
          </button>
        )}
      </div>
    </div>
  );
})}
                      </div>
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#111827", marginTop: "4px" }}>
                  <span>Total</span>
                  <span>
                    ₹
                    {selectedIndividualFeeBatches.reduce(
                      (sum, batch) =>
                        sum + (Array.isArray(batch?.students)
                          ? batch.students.reduce((batchSum, student) => batchSum + (Number(student?.assignedAmount) || 0), 0)
                          : 0),
                      0
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ) : selectedIndividualFeeStudents.length > 0 ? (
              <div style={{ display: "grid", gap: "8px", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
     {selectedIndividualFeeStudents.map((student, index) => {
  // Debug log for button visibility
  console.log("[INSTALLMENTS BUTTON DEBUG] Selected Student:", {
    studentName: student.name || student.StudentName || "Unknown",
    feeFrequency: activeIndividualFee?.frequency,
    hasInstallments: Array.isArray(student?.installments) && student.installments.length > 0,
    hasInstallmentDetails: Array.isArray(student?.installmentDetails) && student.installmentDetails.length > 0,
    conditionMet:
      activeIndividualFee?.frequency?.toLowerCase() === "term wise" ||
      (Array.isArray(student?.installments) && student.installments.length > 0) ||
      (Array.isArray(student?.installmentDetails) && student.installmentDetails.length > 0),
  });

  return (
    <div
      key={`${student?.id || student?.student_id || student?.name || "student"}-${index}`}
      style={{
        display: "grid",
        gap: "8px",
        fontSize: "13px",
        color: "#374151",
        padding: "8px 10px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
          {student.name || student.StudentName || "Student"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button
            type="button"
            className="btn-solid"
            title="Edit student amount"
            aria-label={`Edit amount for ${student.name || student.StudentName || "student"}`}
            style={{
              whiteSpace: "nowrap",
              padding: "3px 4px",
              width: "30px",
              minWidth: "30px",
              height: "30px",
              background: "#dbeafe",
              color: "#1d4ed8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => focusIndividualFeeStudentAmount(student)}
          >
            <Pencil size={12} />
          </button>
          {(activeIndividualFee?.frequency?.toLowerCase() === "term wise" ||
            (Array.isArray(student?.installments) && student.installments.length > 0) ||
            (Array.isArray(student?.installmentDetails) && student.installmentDetails.length > 0)) && (
            <button
              type="button"
              className="btn-solid"
              title="Add installments for this student"
              aria-label={`Add installments for ${student.name || student.StudentName || "student"}`}
              style={{
                height: "28px",
                minWidth: "86px",
                padding: "3px 8px",
                background: Array.isArray(student?.installments) && student.installments.length ? "#dcfce7" : "#fef3c7",
                color: Array.isArray(student?.installments) && student.installments.length ? "#166534" : "#92400e",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                whiteSpace: "nowrap",
              }}
              onClick={() => {
                console.log("[INSTALLMENTS BUTTON CLICKED] Student:", student.name || student.StudentName || "Unknown");
                openIndividualStudentInstallments(student);
              }}
            >
              Installments
            </button>
          )}
        </div>
      </div>
      <input
        ref={(node) => {
          const lookupKey = getStudentLookupKey(student);
          if (lookupKey) individualFeeAmountInputRefs.current[lookupKey] = node;
        }}
        type="number"
        min="0"
        value={student?.assignedAmount ?? individualFeeDraftAmount ?? ""}
        onChange={(e) => updateIndividualFeeStudentAmount(student, e.target.value)}
        onWheel={(e) => e.target.blur()}
        className="btn-dropdown-FeesManagement"
        style={{ width: "160px" }}
        placeholder="Amount"
      />
    </div>
  );
})}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#111827", marginTop: "4px" }}>
                  <span>Total</span>
                  <span>
                    ₹
                    {selectedIndividualFeeStudents.reduce(
                      (sum, student) => sum + (Number(student?.assignedAmount) || 0),
                      0
                    ).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
        <button
          type="button"
          className="btn-solid"
          style={{ flex: 1 }}
          onClick={() => {
            if (!activeIndividualFee?.columnBase) return;
            setIndividualFeeStudentMap((prev) => ({
              ...prev,
              [activeIndividualFee.columnBase]: [],
            }));
            setDynamicFeeValues((prev) => ({
              ...prev,
              [activeIndividualFee.columnBase]: 0,
            }));
            setIndividualFeeDraftAmount("");
            setIndividualFeeStudentSearch("");
          }}
        >
          Clear Selection
        </button>
        <button
          type="button"
          className="btn-solid"
          style={{ flex: 1 }}
          onClick={closeIndividualFeeStudentPopup}
        >
          Done
        </button>
      </div>
    </div>
  </div>
)}

{showAdmissionFeePopup && (
  <div className="FeesManagement-popupOverlay" onClick={() => setShowAdmissionFeePopup(false)}>
    <div className="FeesManagement-popupContent" onClick={(e) => e.stopPropagation()}>
      <button className="FeesManagement-popupCloseBtn" onClick={() => setShowAdmissionFeePopup(false)}>
        &times;
      </button>
      <h2 className="FeesManagement-popupTitle">
        Admission Fee Students - Class {className.replace("Class ", "")} Section {section}
      </h2>
      <p style={{ textAlign: "center", marginBottom: "20px", color: "#f44336", fontWeight: "bold" }}>
        Click on a student's name to set their individual Admission Fee.
      </p>
      <div className="FeesManagement-studentGrid">
        {admissionFeeStudents.length > 0 ? (
          admissionFeeStudents.map((student, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedAdmissionStudent(student);
                setShowIndividualAdmissionFeePopup(true);
              }}
              className="FeesManagement-studentCard"
            >
              <div className="FeesManagement-studentAvatar">
                <User size={16} />
              </div>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {student.name}
              </span>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", gridColumn: "1 / -1", fontSize: "14px" }}>No students found.</p>
        )}
      </div>
    </div>
  </div>
)}
{showIndividualAdmissionFeePopup && (
  <div className="FeesManagement-popupOverlay" onClick={() => setShowIndividualAdmissionFeePopup(false)}>
    <div className="FeesManagement-popupContent" style={{ width: 'min(90%, 480px)' }} onClick={(e) => e.stopPropagation()}>
      <button className="FeesManagement-popupCloseBtn" onClick={() => setShowIndividualAdmissionFeePopup(false)}>
        &times;
      </button>
      <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
        Admission Fee for {selectedAdmissionStudent?.name}
      </h3>
      <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
        <p><strong>Student ID:</strong> {loginId || 'Not set'}</p>
      </div>
      <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
        <p><strong>Previous Admission Fee:</strong> {oldAdmissionFee || 'Not set'}</p>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>Amount:</label>
        <input
          type="number"
          value={admissionFeeAmount}
          onChange={(e) => setAdmissionFeeAmount(e.target.value)}
          onWheel={(e) => e.target.blur()}
          className="no-spinner btn-dropdown-FeesManagement"
          placeholder="Enter Admission Fee Amount"
          style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
        />
      </div>
      <button
        className="btn-solid"
        style={{ width: "100%" }}
        onClick={async () => {
          try {
            const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";
            const response = await axios.post(
              "https://cleezoclass.com:4000/pay-admission-fee",
              {
                studentName: selectedAdmissionStudent.name,
                className: className.replace("Class ", ""),
                sectionName: section,
                schoolCode: schoolCode,
                admissionFee: admissionFeeAmount,
              }
            );
            if (response.data.success) {
              displayToast(`Admission fee for ${selectedAdmissionStudent.name} saved successfully!`, "success");
              setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
              setShowIndividualAdmissionFeePopup(false);
            } else {
              displayToast(`Failed to save admission fee: ${response.data.message}`, "error");
            }
          } catch (error) {
            console.error("Error saving admission fee:", error);
            displayToast(
              `Error saving admission fee: ${error.response?.data?.message || error.message}`,
              "error"
            );
          }
        }}
      >
        Submit
      </button>
    </div>
  </div>
)}



      {/* BUS FEE POPUPS */}
      {showBusFeePopup && (
        <div className="FeesManagement-popupOverlay" onClick={() => setShowBusFeePopup(false)}>
          <div className="FeesManagement-popupContent" onClick={(e) => e.stopPropagation()}>
            <button className="FeesManagement-popupCloseBtn" onClick={() => setShowBusFeePopup(false)}>
              &times;
            </button>

            <h2 className="FeesManagement-popupTitle">
              Bus Fee Students - Class {className.replace("Class ", "")} Section {section}
            </h2>
            <p style={{ textAlign: "center", marginBottom: "20px", color: "#f44336", fontWeight: "bold" }}>
              Click on a student's name to set their individual Bus Fee and Frequency.
            </p>

            <div className="FeesManagement-studentGrid">
              {busFeeStudents.length > 0 ? (
                busFeeStudents.map((student, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedBusStudent(student);
                      setShowIndividualStudentPopup(true);
                    }}
                    className="FeesManagement-studentCard"
                  >
                    <div className="FeesManagement-studentAvatar">
                      <User size={16} />
                    </div>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {student.name}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", gridColumn: "1 / -1", fontSize: "14px" }}>No students found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL STUDENT POPUP */}
      {showIndividualStudentPopup && (
        <div className="FeesManagement-popupOverlay" onClick={() => setShowIndividualStudentPopup(false)}>
          <div className="FeesManagement-popupContent" style={{ width: 'min(90%, 480px)' }} onClick={(e) => e.stopPropagation()}>
            <button className="FeesManagement-popupCloseBtn" onClick={() => setShowIndividualStudentPopup(false)}>
              &times;
            </button>
            <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
              Bus Fee for {selectedBusStudent?.name}
            </h3>

            <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
              <p><strong>Student ID:</strong> {loginId || 'Not set'}</p>
            </div>

            <div style={{ marginBottom: "15px", display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "center" }}>
              <p><strong>Previous Bus Fee:</strong> {oldBusFee || 'Not set'}</p>
              <p><strong>Previous Frequency:</strong> {oldFrequencyType || 'Not set'}</p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Frequency:</label>
              <select
                value={busFeeFrequency}
                onChange={(e) => setBusFeeFrequency(e.target.value)}
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              >
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>Amount:</label>
              <input
                type="number"
                value={busFeeAmount}
                onChange={(e) => setBusFeeAmount(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="no-spinner btn-dropdown-FeesManagement"
                placeholder="Enter Bus Fee Amount"
                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>

            <button
              className="btn-solid"
              style={{ width: "100%" }}
              onClick={async () => {
                try {
                  const schoolCode = localStorage.getItem("schoolCode") || "TAGSOLNOVALLP";
                  const response = await axios.post(
                    "https://cleezoclass.com:4000/pay-bus-fee",
                    {
                      studentName: selectedBusStudent.name,
                      className: className.replace("Class ", ""),
                      sectionName: section,
                      schoolCode: schoolCode,
                      busFee: busFeeAmount,
                      frequency_type: busFeeFrequency,
                    }
                  );
                  if (response.data.success) {
                    displayToast(`Bus fee for ${selectedBusStudent.name} saved successfully!`, "success");
                    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
                    setShowIndividualStudentPopup(false);
                  } else {
                    displayToast(`Failed to save bus fee: ${response.data.message}`, "error");
                  }
                } catch (error) {
                  console.error("Error saving bus fee:", error);
                  displayToast(
                    `Error saving bus fee: ${error.response?.data?.message || error.message}`,
                    "error"
                  );
                }
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  </>
);

};

export default IncomeForm5;
