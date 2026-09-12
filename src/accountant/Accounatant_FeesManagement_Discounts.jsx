import { ArrowLeft, Download, Share, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ErrorPopup from '../shared/ErrorPopup';

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
    i: 1, ii: 2, iii: 3, iv: 4, v: 5,
    vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
    xi: 11, xii: 12,
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

// Central helper: always prefer login_id as the identifier used for
// edit / update / fetch operations. Falls back to id / studentId / _id
// only if login_id is not present on the record.
const getStudentIdentifier = (student) =>
  student?.login_id ?? student?.id ?? student?.studentId ?? student?._id;

const IMAGE_BASE_URL = 'https://cleezoclass.com:4000';
const API_BASE = 'https://cleezoclass.com:4000/api/admin';

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
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      backgroundColor, color: 'white', padding: '15px 25px',
      borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 10000,
      fontSize: '16px', fontWeight: 'bold', minWidth: '250px', textAlign: 'center'
    }}>
      {message}
    </div>
  );
};

const IncomeForm5 = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [students, setStudents] = useState([]);
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [classList, setClassList] = useState([]);
  const [sectionMap, setSectionMap] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadStudentsValue, setLoadStudentsValue] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalFeeEntries, setModalFeeEntries] = useState([{ feeType: '', reason: '', discount: '' }]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [activeStudentFees, setActiveStudentFees] = useState([]);
  const [popupMsg, setPopupMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // States for granular inline table row editing
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [inlineDiscountsState, setInlineDiscountsState] = useState([]);

  const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";

  const formatClassLabel = (value) => {
    const str = String(value || '').trim();
    return /^\d+$/.test(str) ? `Class ${str}` : str;
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      setDropdownLoading(true);
      try {
        const [classRes, sectionRes] = await Promise.all([
          axios.get(`${API_BASE}/classes`, { params: { schoolCode } }),
          axios.get(`${API_BASE}/sectionFilter`, { params: { schoolCode } }),
        ]);

        const rawClasses = Array.isArray(classRes.data) ? classRes.data : [];
        const normalizedClasses = sortClassLabels([
          ...new Set(
            rawClasses
              .map((item) =>
                String(item?.class_name ?? item?.className ?? item?.value ?? item).trim()
              )
              .filter(Boolean)
          ),
        ]);

        const sectionsArray = Array.isArray(sectionRes.data) ? sectionRes.data : [];
        setClassList(normalizedClasses);
        setSectionMap(sectionsArray);
      } catch (error) {
        console.error("Failed to fetch class/section metadata:", error);
        setPopupMsg("Unable to load class/section list.");
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchMetadata();
  }, [schoolCode]);

  useEffect(() => {
    if (!className) {
      setFilteredSections([]);
      setSection('');
      return;
    }

    const sections = sectionMap
      .filter((item) => String(item?.class_name) === String(className))
      .map((item) => item?.section)
      .filter(Boolean);

    const uniqueSections = [...new Set(sections)];
    setFilteredSections(uniqueSections);

    if (section && !uniqueSections.includes(section)) {
      setSection('');
    }
  }, [className, sectionMap, section]);

  const handleLoadStudents = () => {
    if (!className || !section) {
      setPopupMsg("Kindly select both Class and Section to proceed.");
      return;
    }
    setViewMode('grid');
    setLoadStudentsValue(true);
    setShowIcon(true);
    loadStudents('normal');
  };

  const handleViewDiscount = async () => {
    if (!className || !section) {
      setPopupMsg("Kindly select both Class and Section to view discounts.");
      return;
    }
    setViewMode('discount');
    setLoadStudentsValue(true);
    await loadStudents('discount');
  };

  const loadStudents = async (mode = 'normal') => {
    const apiClassName = className.replace("Class ", "");
    try {
      if (mode === 'discount') {
        const response = await axios.get('https://cleezoclass.com:4000/api/discounted-students', {
          params: { className: apiClassName, section, schoolCode }
        });
        setStudents(response.data);
      } else {
        const response = await fetch(`https://cleezoclass.com:4000/get-students?className=${apiClassName}&section=${section}&schoolCode=${schoolCode}`);
        const data = await response.json();
        if (data.success) {
          setStudents(data.students || []);
        } else {
          setStudents([]);
          setPopupMsg("No student records were found for the selected class and section.");
        }
      }
    } catch (error) {
      setPopupMsg("Unable to load student data. Please try again.");
      setStudents([]);
    }
  };

  const handleRemoveDiscount = async (studentId) => {
    if (window.confirm('Remove all discounts for this student?')) {
      try {
        await axios.put(`https://cleezoclass.com:4000/api/remove-discount/${studentId}`, { schoolCode });
        await loadStudents('discount');
        setPopupMsg("Discount removed successfully.");
      } catch (error) {
        setPopupMsg("Unable to remove the discount. Kindly try again.");
      }
    }
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setPopupMsg("");
    setActiveStudentFees([]);
    setIsEditing(false);

    try {
      const identifier = getStudentIdentifier(student);
      const response = await axios.get(`https://cleezoclass.com:4000/api/payment/${identifier}`, {
        params: { schoolCode }
      });

      if (response.data?.payments?.dynamicFeeBreakdown) {
        const assignedFees = response.data.payments.dynamicFeeBreakdown.filter(fee => (fee.total || 0) > 0);
        setActiveStudentFees(assignedFees);
      }
      setShowModal(true);
    } catch (error) {
      console.error("Failed to fetch accurate payment records:", error);
      setPopupMsg("⚠️ Could not retrieve fee type structures unique to this student.");
    }
  };

  // Maps individual item lists to states dynamically for inline item modification
  const handleStartInlineEdit = (student) => {
    const sId = getStudentIdentifier(student);
    setEditingStudentId(sId);

    const appliedDiscounts = getIndividualDiscountsList(student);
    setInlineDiscountsState(appliedDiscounts.map(d => ({
      id: d.id,
      label: d.label,
      amount: d.amount.toString()
    })));
  };

  const handleInlineAmountChange = (index, value) => {
    const updated = [...inlineDiscountsState];
    updated[index].amount = value;
    setInlineDiscountsState(updated);
  };

  const handleSaveInlineDiscount = async (student) => {
  const sId = getStudentIdentifier(student);
  const apiClassName = className.replace("Class ", "");

  try {
    // Step 1: Fetch baseline limits safely
    const paymentRes = await axios.get(`https://cleezoclass.com:4000/api/payment/${sId}`, {
      params: { schoolCode }
    });

    // DO NOT filter out fees where total || amount is 0. Pull all assigned structural fee keys.
    const breakdown = paymentRes.data?.payments?.dynamicFeeBreakdown || paymentRes.data?.dynamicFeeBreakdown;
    const backendFees = Array.isArray(breakdown) 
      ? breakdown.filter(fee => fee && (fee.label || fee.key || fee.feeType))
      : [];

    const feeEntries = [];
    const discountsPayload = {};

    // Step 2: Validate and prepare each modified discount row
    for (const entry of inlineDiscountsState) {
      const enteredAmount = parseFloat(entry.amount) || 0;
      const normalizedTarget = normalizeFeeColumnBase(entry.label);

      // Find the fee matching by its label or key structure
      const matchedFee = backendFees.find(f => 
        normalizeFeeColumnBase(f.label || f.key || f.feeType) === normalizedTarget
      );

      // Fallback limit configuration so it doesn't break if total is 0 or undefined
      const maxLimit = matchedFee ? (parseFloat(matchedFee.total) || parseFloat(matchedFee.amount) || 0) : 999999;

      // Safe guard validation (only block if max limit is configured positive and exceeded)
      if (maxLimit > 0 && enteredAmount > maxLimit) {
        setPopupMsg(`❗ Amount for ${entry.label} cannot exceed the configured max limit of ₹${maxLimit.toFixed(2)}.`);
        return;
      }

      feeEntries.push({
        feeType: matchedFee?.label || matchedFee?.key || entry.label,
        amount: maxLimit,
        discount: enteredAmount,
        reason: student.discount_reason || 'Updated inline Concession',
        date: new Date().toISOString()
      });

      discountsPayload[entry.id] = enteredAmount;
    }

    const payload = {
      studentName: student.name || student.StudentName,
      studentId: sId,
      className: apiClassName,
      sectionName: section,
      schoolCode,
      feeEntries,
      discounts: discountsPayload,
      reason: student.discount_reason || 'Updated inline Concession' // Send to the backend
    };

    await axios.put(`https://cleezoclass.com:4000/api/update-discount/${sId}`, payload);
    
    setPopupMsg("✅ Discounts updated successfully inline!");
    setEditingStudentId(null);
    await loadStudents('discount');
  } catch (error) {
    console.error("Failed inline submission updates:", error);
    setPopupMsg(`❌ Inline save failed: ${error.response?.data?.message || error.message}`);
  }
};
  const filteredStudents = students.filter(s => {
    const name = s.name || s.StudentName || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const renderStudentPhoto = (student) => {
    const isPhotoValid = student.photo && student.photo.trim() !== "";
    const name = student.name || student.StudentName || "?";
    const firstLetter = name.charAt(0).toUpperCase();

    return (
      <div style={{
        width: "50px", height: "50px", borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center", backgroundColor: "#0a3d62",
        color: "white", fontWeight: "600", fontSize: "16px", overflow: "hidden",
      }}>
        {showIcon && isPhotoValid ? (
          <img src={IMAGE_BASE_URL + student.photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span>{firstLetter}</span>
        )}
      </div>
    );
  };

  const submitModalFeeEntries = async (e) => {
    e.preventDefault();
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";

    if (!selectedStudent) {
      setPopupMsg("❗ Please select a student before submitting.");
      return;
    }

    const filteredModalEntries = modalFeeEntries.filter(entry =>
      entry.feeType && entry.feeType.trim() !== ''
    );

    if (filteredModalEntries.length === 0) {
      setPopupMsg("❗ Please select at least one fee type for discount.");
      return;
    }

    const getBaseAmountForFeeType = (feeTypeKey) => {
      if (!feeTypeKey) return 0;
      const targetBase = normalizeFeeColumnBase(feeTypeKey);

      const matchedRecord = activeStudentFees.find((fee) => {
        const rowKeyBase = normalizeFeeColumnBase(fee?.key);
        const rowLabelBase = normalizeFeeColumnBase(fee?.label);
        return targetBase === rowKeyBase || targetBase === rowLabelBase;
      });

      return matchedRecord ? matchedRecord.total : 0;
    };

    for (const entry of filteredModalEntries) {
      const realBaseMaxFee = getBaseAmountForFeeType(entry.feeType);
      const enteredDiscount = parseFloat(entry.discount) || 0;

      if (enteredDiscount > realBaseMaxFee) {
        setPopupMsg(
          `❗ Discount amount ₹${enteredDiscount.toFixed(2)} cannot exceed the maximum configured amount of ₹${realBaseMaxFee.toFixed(2)} for ${entry.feeType}.`
        );
        return;
      }
    }

    const feeTypeToColumnMap = {
      'bus fee': 'bus_discount',
      'tuition fee': 'tuition_discount',
      'fee': 'fee_discount'
    };

    try {
      const apiClassName = className.replace("Class ", "");
      const sId = getStudentIdentifier(selectedStudent);

      const payload = {
        studentName: selectedStudent.name || selectedStudent.StudentName,
        studentId: sId,
        className: apiClassName,
        sectionName: section,
        schoolCode,
        feeEntries: filteredModalEntries.map(entry => ({
          feeType: entry.feeType,
          amount: getBaseAmountForFeeType(entry.feeType),
          discount: parseFloat(entry.discount) || 0,
          reason: entry.reason,
          date: new Date().toISOString()
        })),
        discounts: filteredModalEntries.reduce((acc, entry) => {
          const feeTypeLower = entry.feeType.toLowerCase();
          const columnName = Object.keys(feeTypeToColumnMap).find(key =>
            feeTypeLower.includes(key)
          ) || 'fee_discount';
          acc[feeTypeToColumnMap[columnName]] = parseFloat(entry.discount) || 0;
          return acc;
        }, {})
      };

      const url = 'https://cleezoclass.com:4000/pay-fee-details';
      await axios.post(url, payload);

      setPopupMsg(`✅ Discounts submitted successfully!`);
      setModalFeeEntries([{ feeType: '', reason: '', discount: '' }]);
      setShowModal(false);
      setIsEditing(false);
      setActiveStudentFees([]);
      await loadStudents('discount');
    } catch (error) {
      console.error("❌ Failed to submit discounts:", error);
      setPopupMsg(`❌ Submission failed: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleModalFeeEntryChanges = (index, field, value) => {
    const updatedEntries = [...modalFeeEntries];
    updatedEntries[index][field] = value;
    setModalFeeEntries(updatedEntries);
  };

  const addModalFeeEntryRow = () => {
    setModalFeeEntries([...modalFeeEntries, { feeType: '', reason: '', discount: '' }]);
  };

  const removeModalFeeEntryRow = (index) => {
    setModalFeeEntries(modalFeeEntries.filter((_, i) => i !== index));
  };

  const formatAmount = (value) => {
    if (!value) return "0.00";
    const number = Number(value);
    if (isNaN(number)) return "0.00";
    return number.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getIndividualDiscountsList = (studentRow) => {
    if (!studentRow) return [];
    return Object.keys(studentRow)
      .filter(key => key.toLowerCase().endsWith('_discount') && key.toLowerCase() !== 'discount')
      .map(key => {
        const rawAmount = parseFloat(studentRow[key]) || 0;
        if (rawAmount <= 0) return null;

        const cleanName = key
          .replace(/_discount/i, '')
          .replace(/_/g, ' ')
          .trim();

        const formattedLabel = cleanName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        return {
          id: key,
          label: formattedLabel,
          amount: rawAmount
        };
      })
      .filter(Boolean);
  };

  return (
    <>
      {toast.show && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}

      <div className="Discount-mainContainer">
        <div className="Discount-sideContainer">
          <h2 className="Discount-header">Discounts</h2>

          <div className="Discount-controlsRow">
            <select className="Discount-select" value={className} onChange={(e) => setClassName(e.target.value)}>
              <option value="">Class</option>
              {dropdownLoading ? (
                <option value="" disabled>Loading...</option>
              ) : (
                classList.map((cls) => (
                  <option key={cls} value={cls}>
                    {formatClassLabel(cls)}
                  </option>
                ))
              )}
            </select>

            <select
              className="Discount-select"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={!className || dropdownLoading}
            >
              <option value="">Sec</option>
              {filteredSections.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>

            <button onClick={handleLoadStudents} style={{ marginTop: '-1%' }} className="Discount-button">Load Students</button>
            <button onClick={handleViewDiscount} style={{ marginTop: '-1%' }} className="Discount-button">Discounts</button>

            <input
              type="text"
              placeholder="Search by student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="Discount-search"
            />
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            {!loadStudentsValue ? (
              <p style={{ textAlign: 'center', color: '#888' }}>Select class/section and click Load</p>
            ) : filteredStudents.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888' }}>No records found</p>
            ) : viewMode === 'grid' ? (
              <div className="Discount-studentGrid">
                {filteredStudents.map((student) => (
                  <div key={getStudentIdentifier(student)} className="Discount-studentCard" onClick={() => handleStudentSelect(student)}>
                    {renderStudentPhoto(student)}
                    <span className="Discount-studentName">{student.name || student.StudentName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="Discount-tableContainer">
                <table className="Discount-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Total Discount</th>
                      <th>Details & Applied Types</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => {
                      const currentStudentId = getStudentIdentifier(student);
                      const isRowEditing = editingStudentId === currentStudentId;
                      const appliedDiscounts = getIndividualDiscountsList(student);

                      // Calculate live rolling total if editing, else show database value
                   const totalDiscountToShow = isRowEditing
  ? inlineDiscountsState.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    )
  : appliedDiscounts.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );

                      return (
                        <tr key={currentStudentId}>
                          <td>{student.StudentName || student.name}</td>
                          <td className="Discount-discountAmount" style={{ fontWeight: 'bold', color: '#27ae60' }}>
                            {`₹${formatAmount(totalDiscountToShow)}`}
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {isRowEditing ? (
                                // Render row items as distinct editable blocks paired visually with titles
                                inlineDiscountsState.map((item, idx) => (
                                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '500', minWidth: '80px' }}>• {item.label}:</span>
                                    <input
                                      type="number"
                                      value={item.amount}
                                      onChange={(e) => handleInlineAmountChange(idx, e.target.value)}
                                      style={{
                                        width: '100px',
                                        padding: '4px 8px',
                                        border: '1px solid #3498db',
                                        borderRadius: '4px',
                                        textAlign: 'right'
                                      }}
                                    />
                                  </div>
                                ))
                              ) : (
                                appliedDiscounts.length > 0 ? (
                                  appliedDiscounts.map((item) => (
                                    <div
                                      key={item.id}
                                      style={{
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        color: item.label.toLowerCase().includes('tuition') ? '#3498db' :
                                               item.label.toLowerCase().includes('bus') ? '#f39c12' : '#27ae60'
                                      }}
                                    >
                                      • {item.label}: ₹{formatAmount(item.amount)}
                                    </div>
                                  ))
                                ) : (
                                  <span style={{ color: '#aaa', fontSize: '12px' }}>General Concession</span>
                                )
                              )}
                            </div>
                          </td>
                          <td>
                            {isRowEditing ? (
                              <>
                                <button
                                  className="Discount-editButton"
                                  onClick={() => handleSaveInlineDiscount(student)}
                                  style={{ marginRight: '8px', backgroundColor: '#2ecc71', color: '#fff' }}
                                >
                                  Save
                                </button>
                                <button
                                  className="Discount-removeButton"
                                  onClick={() => setEditingStudentId(null)}
                                  style={{ backgroundColor: '#7f8c8d' }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="Discount-editButton"
                                  onClick={() => handleStartInlineEdit(student)}
                                  style={{ marginRight: '8px' }}
                                >
                                  Edit Amounts
                                </button>
                                <button
                                  className="Discount-removeButton"
                                  onClick={() => handleRemoveDiscount(currentStudentId)}
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal remains explicitly for applying fresh new entries */}
        {showModal && (
          <div className="Discount-modalOverlay">
            <div className="Discount-modalContent">
              <span
                className="Discount-closeButton"
                onClick={() => {
                  setShowModal(false);
                  setModalFeeEntries([{ feeType: '', reason: '', discount: '' }]);
                  setPopupMsg("");
                  setIsEditing(false);
                  setActiveStudentFees([]);
                }}
              >
                ×
              </span>

              <h3 className="Discount-modalHeader">
                <span>Add Discount</span>
                <span className="Discount-modalStudentName">{selectedStudent?.name || selectedStudent?.StudentName}</span>
              </h3>

              <p style={{ fontSize: '10px', marginBottom: '5px' }}>Date: {new Date().toLocaleDateString()}</p>
              <p style={{ fontSize: '10px', marginBottom: '15px' }}>Please enter the discount amount and select the fee type.</p>

              <form onSubmit={submitModalFeeEntries}>
                <div style={{ display: 'grid', gap: '20px', marginBottom: '20px' }}>
                  {modalFeeEntries.map((entry, index) => (
                    <div key={index} className="Discount-modalFeeEntry">
                      {modalFeeEntries.length > 1 && (
                        <button type="button" className="Discount-removeRowButton" onClick={() => removeModalFeeEntryRow(index)}>
                          ×
                        </button>
                      )}
                      <div className="expense-input-field">
                        <select
                          className="btn-dropdown-FeesManagement"
                          value={entry.feeType}
                          onChange={(e) => handleModalFeeEntryChanges(index, 'feeType', e.target.value)}
                          required
                        >
                          <option value="">Fee Type</option>
                          {activeStudentFees.length > 0 ? (
                            <optgroup label="Assigned Student Fee Types">
                              {activeStudentFees.map((fee) => (
                                <option key={fee.key || fee.label} value={fee.label}>
                                  {fee.label} (Max: ₹{formatAmount(fee.total)})
                                </option>
                              ))}
                            </optgroup>
                          ) : (
                            <option value="" disabled>No applicable fee types found</option>
                          )}
                        </select>
                      </div>
                      {entry.feeType && (
                        entry.reason === 'Other' ? (
                          <input
                            type="text"
                            placeholder="Custom Reason"
                            value={entry.customReason || ''}
                            className="Discount-modalInput"
                            onChange={(e) => handleModalFeeEntryChanges(index, 'customReason', e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <div className="expense-input-field">
                            <select
                              className="btn-dropdown-FeesManagement"
                              value={entry.reason}
                              onChange={(e) => handleModalFeeEntryChanges(index, 'reason', e.target.value)}
                            >
                              <option value="">Reason</option>
                              <option value="Staff Concession">Staff</option>
                              <option value="VIP Concession">VIP</option>
                              <option value="caste/Religion">Caste/Religion</option>
                              <option value="Parent Concession">Parent</option>
                              <option value="Sibling Concession">Sibling</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        )
                      )}
                      {entry.feeType && (
                        <div className="expense-input-field">
                          <input
                            type="text"
                            value={entry.discount}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/,/g, "");
                              if (/^\d*$/.test(rawValue)) {
                                handleModalFeeEntryChanges(index, "discount", rawValue);
                              }
                            }}
                            onBlur={(e) => {
                              const formatted = formatAmount(e.target.value);
                              handleModalFeeEntryChanges(index, "discount", formatted.replace(/,/g, ""));
                            }}
                            placeholder="Discount"
                            className="btn-dropdown-FeesManagement"
                            style={{ width: '120px', textAlign: 'right' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="Discount-modalActions">
                  <button type="button" className="Discount-button" onClick={addModalFeeEntryRow}>
                    Add Another Fee
                  </button>
                  <button type="submit" className="Discount-button">
                    Submit Discount
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <ErrorPopup message={popupMsg} onClose={() => setPopupMsg("")} />
    </>
  );
};

export default IncomeForm5;
