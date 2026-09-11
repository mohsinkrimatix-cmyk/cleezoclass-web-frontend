import React, { useState, useEffect, useCallback ,useRef} from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleRight,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import '../STYLES/tabhower.css'
import axios from 'axios'; 
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,BarChart,Bar
} from "recharts";
import './ExpenseStyles.css';

// --- END NEW COMPONENT IMPORTS ---
import ExpenseTrackerUI from "./Accountant_ExpenseManagement_expense_Expense";
import ErrorPopup from "../shared/ErrorPopup";

const API_BASE = 'https://cleezoclass.com:5000/api/admin';
const API_BASE_URL = "https://cleezoclass.com:5000"; 

// --- MODIFIED: Retrieve School Code from localStorage ---
const getSchoolCode = () => {
    // Attempt to retrieve the code from localStorage
    const storedCode = localStorage.getItem('schoolCode'); 
    // Return the stored code, or the hardcoded value as a fallback
    return storedCode || 'TAGSOLNOVALLP';
};
// -

// ----------------------------------------------------------------------
// --- CustomModal Component (MODIFIED to support different content) ---
// ----------------------------------------------------------------------
const CustomModal = ({ isVisible, message, type, onConfirm, onCancel, children, title }) => {
    if (!isVisible) return null;

    const Icon = () => {
        if (type === 'content') return null;
        if (type === 'confirm' || (message && (message.includes('ERROR') || message.includes('Failed')))) {
            return <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '10px' }} />;
        }
        return null;
    };

    return (
        <div
            className="expense-modal-overlay"
            onClick={onCancel}
        >
            <div
                className={`expense-modal-content ${type === 'content' ? 'expense-modal-content-content' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {type === 'content' ? (
                    <div style={{ marginTop: '15px', textAlign: 'left' }}>
                        {children}
                    </div>
                ) : (
                    <>
                        <p><Icon />{message}</p>
                        <div className={`expense-modal-button-group ${type === 'confirm' ? 'expense-modal-button-group-confirm' : ''}`}>
                            {type === 'confirm' && (
                                <button
                                    onClick={onCancel}
                                    className="expense-modal-base-btn expense-modal-cancel-btn"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={onConfirm}
                                className="expense-modal-base-btn expense-modal-confirm-btn"
                            >
                                {type === 'confirm' ? 'Proceed' : 'OK'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
// ----------------------------------------------------------------------
// --- Generic Card Component (MODIFIED: Removed minHeight) ---
// ----------------------------------------------------------------------
// ----------------------------------------------------------------------
const CustomCard = ({ title, children, icon, isMobile }) => {
    const isLaptop = window.innerWidth > 600 && window.innerWidth <= 1440;
    const isLargeMonitor = window.innerWidth > 1440;

    return (
          <div className="Card-rightContainer">

            <div className="custom-card-header">
                <span className="expense-card-header-icon" />
                {title}
            </div>
            {children}
        </div>
    );
};

const CustomCardRight = ({ title, children, icon, isMobile }) => {
    const isLaptop = window.innerWidth > 600 && window.innerWidth <= 1440;
    const isLargeMonitor = window.innerWidth > 1440;

    return (
            <div className="custom-card-right">

            {title && (
        <div className="custom-card-right-header">
                    <input
                        type="radio"
                        className="expense-card-radio"
                        id={`radio-${title.replace(/\s/g, "-")}`}
                        name="section-radio"
                        defaultChecked={title === "FEES MANAGEMENT" || title === "ACTIONS"}
                    />
                    <label htmlFor={`radio-${title.replace(/\s/g, "-")}`}>
                        {title}
                    </label>
                </div>
            )}
            {children}
        </div>
    );
};





// ----------------------------------------------------------------------
// --- Section Components (TrackFees, Discounts, Actions, etc.) ---
// ----------------------------------------------------------------------
// Assume schoolCode is handled via localStorage, but it's good practice to define it
const schoolCode = localStorage.getItem("schoolCode"); 

// --- HELPER FUNCTIONS ---

// Function to generate an array of dates between two Date objects (as provided in the original code)
const getDatesBetween = (start, end) => {
    const dates = [];
    let currentDate = new Date(start.getTime());
    currentDate.setHours(0, 0, 0, 0); // Ensure consistency
    // Iterate up to and including the end date
    while (currentDate.getTime() <= end.getTime()) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// 🔥 FIX: Update to return YYYY-MM format for API usage
const getMonthStringFromFilter = (filter) => {
    const now = new Date();
    let targetDate = new Date(now);

    if (filter === "lastMonth") {
        targetDate.setMonth(now.getMonth() - 1);
    }
    
    // Format to YYYY-MM (e.g., "2025-10")
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}`; 
};

const TrackExpenses = ({ isMobile, font, addAction }) => {
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseList, setExpenseList] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [expenseNames, setExpenseNames] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");

  const schoolCode = localStorage.getItem("schoolCode");

  const handleSendToAdmin = async () => {
    if (!schoolCode) {
      setPopupMessage("School code missing");
      return;
    }

    const allExpenses = await fetchAllExpenses();
    if (!allExpenses || allExpenses.length === 0) {
      setPopupMessage("No expenses found");
      return;
    }

    let filtered = allExpenses;

    if (fromDate && toDate) {
      filtered = filtered.filter((item) => {
        const expenseDate = new Date(item.expense_date).toISOString().split("T")[0];
        return expenseDate >= fromDate && expenseDate <= toDate;
      });
    }

    if (expenseType) {
      filtered = filtered.filter(
        (item) => item.expense_type.toLowerCase() === expenseType.toLowerCase()
      );
    }

    if (filtered.length === 0) {
      setPopupMessage("No expenses match the selected filters");
      return;
    }

    const totalSpent = filtered.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    const formattedExpenses = filtered.map((item) => ({
      ...item,
      expense_date: new Date(item.expense_date).toISOString().split("T")[0],
      amount: Number(item.price) || 0,
    }));

    try {
      await axios.post(
        "https://cleezoclass.com:5000/expenses-superadmin",
        {
          schoolCode,
          fromDate: fromDate ? new Date(fromDate).toISOString().split("T")[0] : null,
          toDate: toDate ? new Date(toDate).toISOString().split("T")[0] : null,
          expenseType,
          expenses: formattedExpenses,
        }
      );

      setPopupMessage("Expenses sent to Super Admin successfully ✅");
      addAction(`EXPENSES SENT TO SUPER ADMIN SUCCESSFULLY. TOTAL SPENT: ₹${totalSpent.toLocaleString()}`);
    } catch (error) {
      console.error("Send to admin failed:", error);
      setPopupMessage("Failed to send expenses");
      addAction("FAILED TO SEND EXPENSES ❌", "REJECTED");
    }
  };

  const fetchAllExpenses = async () => {
    if (!schoolCode) return;

    try {
      const res = await axios.get(
        `https://cleezoclass.com:5000/api/totalexpenses?schoolCode=${schoolCode}`
      );

      const data = res.data || [];

      const types = [...new Set(data.map((e) => e.expense_type))];
      setExpenseTypes(types);

      const names = [...new Set(data.map((e) => e.expense_name))];
      setExpenseNames(names);

      return data;
    } catch (err) {
      console.error("Error fetching expenses:", err);
      return [];
    }
  };

  const fetchChartData = async () => {
    if (!schoolCode || !fromDate || !toDate) return;

    setChartLoading(true);

    try {
      const expRes = await axios.get(
        `https://cleezoclass.com:5000/api/totalexpenses?schoolCode=${schoolCode}`
      );
      const salRes = await axios.get(
        `https://cleezoclass.com:5000/api/salaryLedger?schoolCode=${schoolCode}`
      );

      const rawExpenses = expRes.data || [];
      const rawSalaries = salRes.data || [];

      const start = new Date(fromDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59);

      const monthlyTotals = {};

      function addToMonth(dateStr, amount) {
        const date = new Date(dateStr);
        if (isNaN(date)) return;

        if (date >= start && date <= end) {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          if (!monthlyTotals[key]) {
            monthlyTotals[key] = { month: key, Paid: 0, Unpaid: 0 };
          }
          monthlyTotals[key].Paid += amount;
        }
      }

      rawExpenses.forEach((e) => {
        if (e.expense_date) addToMonth(e.expense_date, Number(e.price) || 0);
      });
      rawSalaries.forEach((s) => {
        if (s.payment_date) addToMonth(s.payment_date, Number(s.final_salary) || 0);
      });

      const finalData = Object.values(monthlyTotals).sort(
        (a, b) => new Date(a.month) - new Date(b.month)
      );

      setChartData(finalData);
    } catch (err) {
      console.error("Chart Load Error:", err);
    }
    setChartLoading(false);
  };

  const fetchExpenseList = async () => {
    const allExpenses = await fetchAllExpenses();
    if (!allExpenses || allExpenses.length === 0) return;

    let filtered = allExpenses;

    if (fromDate && toDate) {
      filtered = filtered.filter((item) => {
        const dStr = new Date(item.expense_date).toISOString().split("T")[0];
        return dStr >= fromDate && dStr <= toDate;
      });
    }

    if (expenseType) {
      filtered = filtered.filter(
        (item) => item.expense_type.toLowerCase() === expenseType.toLowerCase()
      );
    }

    if (expenseName) {
      filtered = filtered.filter(
        (item) => item.expense_name.toLowerCase() === expenseName.toLowerCase()
      );
    }

    const totalSpent = filtered.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    setExpenseList(filtered);
    setShowModal(true);
    addAction(`EXPENSE LIST VIEWED. TOTAL SPENT: ₹${totalSpent.toLocaleString()}`);
  };

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const formatDate = (date) => date.toISOString().split("T")[0];

    setFromDate(formatDate(firstDay));
    setToDate(formatDate(today));

    fetchAllExpenses();
  }, []);

  useEffect(() => {
    if (fromDate && toDate) fetchChartData();
  }, [fromDate, toDate]);

  return (
    <div>
      <div className="expense-date-filters">
        <div className={`expense-date-filter-group ${isMobile ? "expense-date-filter-group-mobile" : ""}`}>
          <div className={`expense-chart-container ${isMobile ? "expense-chart-container-mobile" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Paid" fill="#9C6262" name="Total Paid" barSize={40} />
                <Bar dataKey="Unpaid" fill="#6CA6FF" name="Remaining Due" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`expense-filter-controls ${isMobile ? "expense-filter-controls-mobile" : ""}`}>
        <div className="track-control-group">
                            <label className="collections-label">From Date</label>
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="btn-dropdown-FeesManagement" />
                        </div>
                        <div className="track-control-group">
                            <label className="collections-label">To Date</label>
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="btn-dropdown-FeesManagement" />
                        </div>
          <select
            className="btn-dropdown-FeesManagement "
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value)}
          >
            <option value=""> Expense Type</option>
            {expenseTypes.map((type, idx) => (
              <option key={idx} value={type}>{type}</option>
            ))}
          </select>
          <select
            className="btn-dropdown-FeesManagement"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
          >
            <option value=""> Expense Name</option>
            {expenseNames.map((name, idx) => (
              <option key={idx} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="expense-total-spent">
        <div className={`expense-total-spent-text ${isMobile ? "expense-total-spent-text-mobile" : ""}`} style={{width:'120px'}}>
          <strong>Total Spent Price: </strong>₹{chartData.reduce((sum, item) => sum + item.Paid, 0).toLocaleString()}
        </div>
        <button
          className="btn-outline"
          onClick={fetchExpenseList}
        >
          View List
        </button>
      </div>

      <div className="expense-expense-filters">
                                <div className="expense-input-field">

        <select
          className="btn-dropdown-FeesManagement"
          value={expenseType}
          onChange={(e) => setExpenseType(e.target.value)}
        >
          <option value="">Select Expense Type</option>
          {expenseTypes.map((type, idx) => (
            <option key={idx} value={type}>{type}</option>
          ))}
        </select>
</div>
        <button
          className="btn-solid" style={{width:'150px', marginTop:'-5px', padding:'5px'}}
          onClick={handleSendToAdmin}
        >
          Send to Super Admin
        </button>
      </div>

      {showModal && (
        <div
          className="previousrecord-popup-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className={`previousrecord-popup ${isMobile ? "expense-modal-content-mobile" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Expense List</h3>
            <table className="expense-modal-table">
              <thead>
                <tr>
                  <th className="expense-modal-table-header">Date</th>
                  <th className="expense-modal-table-header">Expense Type</th>
                  <th className="expense-modal-table-header">Expense Name</th>
                  <th className="expense-modal-table-header">Description</th>
                  <th className="expense-modal-table-header">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenseList.length > 0 ? (
                  expenseList.map((item) => {
                    const formattedDate = item.expense_date
                      ? new Date(item.expense_date).toISOString().split("T")[0]
                      : "";
                    return (
                      <tr key={item.id}>
                        <td className="expense-modal-table-cell">{formattedDate}</td>
                        <td className="expense-modal-table-cell">{item.expense_type}</td>
                        <td className="expense-modal-table-cell">{item.expense_name}</td>
                        <td className="expense-modal-table-cell">{item.description}</td>
                        <td className="expense-modal-table-cell">₹ {item.price}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="expense-modal-table-cell" style={{ textAlign: "center" }}>
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <button
              className="btn-solid"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <ErrorPopup
        message={popupMessage}
        onClose={() => setPopupMessage("")}
      />
    </div>
  );
};




const SimpleExpenseManager = ({ isMobile, font, setModal, onShowExpenseTracker }) => { // 🎯 ADDED onShowExpenseTracker
    // State variables for the two-step form process
    const [expenseCategory, setExpenseCategory] = useState(''); 
    const [specificExpenseName, setSpecificExpenseName] = useState('');
    const [quantity, setQuantity] = useState(''); 
      const [popupMessage, setPopupMessage] = useState("");
    
    // 🎯 REMOVED: const [selectedExpense, setSelectedExpense] = useState(...)
    // 🎯 REMOVED: const [showPopup, setShowPopup] = useState(false);

    // State variables for payment part
    const [totalAmount, setTotalAmount] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [balance, setBalance] = useState('0.00');
    const [paymentMode, setPaymentMode] = useState('BANK'); 
    const [isLoading, setIsLoading] = useState(false); 
    const [bills, setBills] = useState(null); // Added bills state for file input

    // Effect for Balance Calculation
    useEffect(() => {
        let total = parseFloat(totalAmount);
        let paid = parseFloat(paidAmount);
        if (isNaN(total)) total = 0;
        if (isNaN(paid)) paid = 0;
        if (paid > total) {
            setPaidAmount(total.toString());
            paid = total;
        }
        setBalance((total - paid).toFixed(2));
    }, [totalAmount, paidAmount]);


   
    const resetForm = () => {
        setExpenseCategory('Maintenance');
        setSpecificExpenseName('');
        setQuantity('');
        setTotalAmount('');
        setPaidAmount('');
        setPaymentMode('BANK');
        setBills(null); // Reset bills
    }

    // Function to handle payment and database storage
    const handlePay = async () => {
        // --- Input Validation ---
        if (!specificExpenseName || !totalAmount || !paidAmount) {
            setModal({
                isVisible: true,
                message: 'ERROR: Please select an **Expense Name** and enter **Total** and **Paid** amounts.',
                type: 'setPopupMessage',
                onConfirm: () => setModal({ isVisible: false }),
            });
            return;
        }
        
        setIsLoading(true);

        const schoolCode = getSchoolCode(); // Retrieve school code from local storage
        const total = parseFloat(totalAmount);
        const paid = parseFloat(paidAmount);

        // --- Prepare Payload for API ---
        const expenseData = {
            schoolCode,
            date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
            expenseType: expenseCategory,
            expenseName: specificExpenseName,
            description: quantity ? `Quantity: ${quantity}` : 'No description provided.',
            totalAmount: total,
            paidAmount: paid,
            balance: (total - paid),
            paymentMode: paymentMode,
        };

        try {
            // --- API Call to Save Expense ---
            // Endpoint: POST https://cleezoclass.com:5000/api/admin/expense/addExpense
            const response = await axios.post('https://cleezoclass.com:5000/Accountntdata', expenseData);
console.log("FULL API RESPONSE:", response);

          if (response.status === 200)
 {
                setModal({
                    isVisible: true,
message: `Expense **${specificExpenseName}** saved successfully! Transaction ID: ${response.data.insertId}`,
                    type: 'setPopupMessage',
                    onConfirm: () => setModal({ isVisible: false }),
                });
                resetForm(); // Clear the form on success
            } else {
                 throw new Error(response.data.message || 'Failed to save expense due to an unknown error.');
            }
        } catch (error) {
            console.error('Error saving expense:', error.response ? error.response.data : error.message);
            setModal({
                isVisible: true,
                message: `ERROR: Failed to submit expense. ${error.response ? error.response.data.message : 'Please check your network.'}`,
                type: 'setPopupMessage',
                onConfirm: () => setModal({ isVisible: false }),
            });
        } finally {
            setIsLoading(false);
        }
    };
    const handleReject = () => {
    setPopupMessage("Expense rejected!");

    // Clear all fields
    setExpenseCategory("");
    setSpecificExpenseName("");
    setPaidAmount("");
    setBills(null);
};
const [categoryName, setCategoryName] = useState("");
const [categoryDescription, setCategoryDescription] = useState("");
const handleCreateCategory = () => {

      addAction(`CREATED NEW CATEGORY: ${categoryName}`, "OK");

    if (!categoryName.trim()) {
        setPopupMessage("Category name is required");
        return;
    }

    console.log("New Category:", {
        categoryName,
        categoryDescription
    });

    // TODO: API call to save in DB

    // Reset fields
    setCategoryName("");
    setCategoryDescription("");
};

const handlePaidClick = () => {

    onShowExpenseTracker(expenseCategory, specificExpenseName);
};

const predefinedOptions = {
    "Maintenance Services": [
      "Building Maintenance and Repair",
      "Furniture Repair",
      "Electrical & Plumbing Services",
      "Gardening and Landscaping Services",
      "Fire Safety Maintenance",
      "Pest Control"
    ],
    "Digital & IT Services": [
      "Internet Services",
      "IT support & Maintenance",
      "Digital Learning tools",
      "Website Maintenance",
      "Smart Class AMC"
    ],
    "Transport-related Services": [
      "Vehicle Maintenance & Repair",
      "Fuel & Oil Services",
      "GPS Tracking System Services",
      "Transport Contract Services"
    ],
    "Administrative Financial Services": [
      "Accounting and Auditing Services",
      "Legal and Compliance Services",
      "Document Printing and Photocopying Services",
      "Courier & Postage Services",
      "Office Supplies Procurement Services"
    ],
    "Health & Safety Services": [
      "Medical Checkup Camps",
      "First Aid & Emergency Care Supplies",
      "Health Insurance",
      "Sanitization and Hygiene Services"
    ]
  };

  const [dynamicOptions, setDynamicOptions] = useState({}); // fetched from backend


  const [newCategory, setNewCategory] = useState("");
  const [newExpenseName, setNewExpenseName] = useState("");

  // Fetch dynamic options from backend
 const fetchDynamicOptions = async () => {
  const schoolCode = localStorage.getItem("schoolCode"); // ⬅️ get schoolCode

  const res = await fetch(
    `https://cleezoclass.com:5000/api/admin/get-expense-master?schoolCode=${schoolCode}`
  );

  const data = await res.json();
  setDynamicOptions(data);
};


  useEffect(() => {
    fetchDynamicOptions();
  }, []);

const expenseOptions = {
  "Maintenance Services": [
    "Building Maintenance and Repair",
    "Furniture Repair",
    "Electrical & Plumbing Services",
    "Gardening and Landscaping Services",
    "Fire Safety Maintenance",
    "Pest Control"
  ],
  "Digital & IT Services": [
    "Internet Services",
    "IT support & Maintenance (Hardware/Software)",
    "Digital Learning tools (Byju's, Google Classrooms)",
    "Website Maintenance & Hosting Services",
    "Smart Class setup and AMC (Annual Maintenance Contract)"
  ],
  "Transport-related Services": [
    "Vehicle Maintenance & Repair",
    "Fuel & Oil Services",
    "GPS Tracking System Services",
    "Transport Contract Services (if outsourced)"
  ],
  "Administrative Financial Services": [
    "Accounting and Auditing Services",
    "Legal and Compliance Services",
    "Document Printing and Photocopying Services",
    "Courier & Postage Services",
    "Office Supplies Procurement Services"
  ],
  "Health & Safety Services": [
    "Medical Checkup Camps",
    "First Aid & Emergency Care Supplies",
    "Health Insurance (if provided to Staff)",
    "Sanitization and Hygiene Services"
  ]
};
  const [expenses, setExpenses] = useState([{ name: "", description: "" }]);
  const addExpenseField = () => setExpenses([...expenses, { name: "", description: "" }]);
  const removeExpenseField = (index) => {
    const list = [...expenses];
    list.splice(index, 1);
    setExpenses(list);
  };
 const handleExpenseChange = (index, field, value) => {
    const list = [...expenses];
    list[index][field] = value;
    setExpenses(list);
  };
      const [popup, setPopup] = useState({ message: "", type: "" });
  
const handleSubmit = async () => {
  if (!categoryName.trim()) {

    setPopup({ message: "⚠️ Category name is required!", type: "error" });
    return;
  }

  const validExpenses = expenses.filter(e => e.name.trim() !== "");
  if (!validExpenses.length) {
    setPopup({ message: "⚠️ Add at least one expense!", type: "error" });
    return;
  }

  const schoolCode = localStorage.getItem("schoolCode");
  if (!schoolCode) {
    setPopup({ message: "❌ School code not found!", type: "error" });
    return;
  }

  try {
    for (let exp of validExpenses) {
      const res = await fetch("https://cleezoclass.com:5000/api/admin/add-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolCode,
          categoryName,
          categoryDescription,
          expenseName: exp.name,
          expenseDescription: exp.description
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to save an expense");
      }
    }

    setPopup({ message: "✅ All expenses saved successfully!", type: "success" });

    setCategoryName("");
    setCategoryDescription("");
    setExpenses([{ name: "", description: "" }]);

  } catch (error) {
    console.error("❌ Error saving expenses:", error);
    setPopup({
      message: error.message || "❌ Failed to save expenses!",
      type: "error"
    });
  }
};


  const combinedOptions = { ...predefinedOptions, ...dynamicOptions };
// =================================================================
 return (
    <>
        <div className="expense-form-container">
            {/* ================== ROW 1 ================== */}
            <div className="expense-row">
                {/* EXPENSE CATEGORY */}
                        <div className="expense-input-field">
                    <label className="expense-label">Expense Category</label>
                    <select
                        value={expenseCategory}
                        onChange={(e) => {
                            setExpenseCategory(e.target.value);
                            setSpecificExpenseName("");
                        }}
                        className="btn-dropdown-FeesManagement"
                        disabled={isLoading}
                        required
                    >
                        <option value="">-- Select Category --</option>
                        {Object.keys(combinedOptions).map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* EXPENSE TYPE / NAME (dependent) */}
                        <div className="expense-input-field">
                    <label className="expense-label">Expense Type</label>
                    <select
                        value={specificExpenseName}
                        onChange={(e) => setSpecificExpenseName(e.target.value)}
                        className="btn-dropdown-FeesManagement"
                        disabled={!expenseCategory || isLoading}
                        required
                    >
                        <option value="">-- Select Expense --</option>
                        {expenseCategory &&
                            combinedOptions[expenseCategory]?.map((exp) => (
                                <option key={exp} value={exp}>
                                    {exp}
                                </option>
                            ))}
                    </select>
                </div>

                {/* PAY Button */}
                    <button
                        type="button"
                        onClick={handlePaidClick}
                        disabled={isLoading}
                        className="btn-solid "
                    >
                        {paidAmount ? `₹ ${paidAmount}` : "PAY"}
                        
                    </button>
            </div>

            {/* ================== ROW 2 ================== */}
            <div className="expense-row expense-row-wrap">
                {/* SCANNED BILLS */}
                <div>
                    <label className="expense-label"                         style={{marginTop:'-20px'}}
>Scanned Bills</label>
                        <div className="expense-input-field">
                        {/* HIDDEN REAL FILE INPUT */}
                        <input
                            type="file"
                            id="fileUpload"
                            accept="image/*,application/pdf"
                            onChange={(e) => setBills(e.target.files[0])}
                            className="expense-file-upload"
                        />

                        {/* CUSTOM BUTTON */}
                        <button
                            type="button"
                            onClick={() => document.getElementById("fileUpload").click()}
                            className="btn-dropdown-FeesManagement "

                        >
                            Upload File
                        </button>
                    </div>
                </div>

                {/* REJECT */}
                <button
                    type="button"
                    onClick={handleReject}
                    className="btn-solid"
                    style={{ width: "120px", padding:'5px' }}
                >
                    Reject
                </button>

                {/* SUBMIT */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-solid"
                    style={{ width: "110px" , padding:'5px'}}
                >
                    Submit
                </button>
            </div>
        </div>

        <div className="expense-form-container">
            <div className="expense-manager-header">Expense Category Manager</div>

            {/* ================== ROW 1 ================== */}
            <div className="expense-row">
                {/* CATEGORY NAME */}
                        <div className="expense-input-field">
                    <label className="expense-label">Category Name</label>
                    <input
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="btn-dropdown-FeesManagement"
                        placeholder="Enter Category Name"
                        disabled={isLoading}
                        required
                    />
                </div>

                {/* DESCRIPTION */}
                        <div className="expense-input-field">
                    <label className="expense-label">Description</label>
                    <input
                        type="text"
                        value={categoryDescription}
                        onChange={(e) => setCategoryDescription(e.target.value)}
                        className="btn-dropdown-FeesManagement"
                        placeholder="Enter Description"
                        disabled={isLoading}
                    />
                </div>

                {/* CREATE BUTTON */}
                <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isLoading}
                    className="btn-solid "
                                            style={{padding:'5px'}}

                >
                    Create
                </button>
            </div>

            {/* ===== EXPENSES INPUTS STACKED ===== */}
            <div className="expense-inputs-stack">
                {expenses.map((exp, idx) => (
                    <div key={idx} className="expense-input-group">
                        {/* Expense Name */}
                        <div className="expense-input-field">
                            <label className="expense-label">Expense Name</label>
                            <input
                                type="text"
                                value={exp.name}
                                onChange={(e) => handleExpenseChange(idx, "name", e.target.value)}
                                className="btn-dropdown-FeesManagement"
                                placeholder="Expense Name"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="expense-input-field">
                            <label className="expense-label">Description</label>
                            <input
                                type="text"
                                value={exp.description}
                                onChange={(e) => handleExpenseChange(idx, "description", e.target.value)}
                                className="btn-dropdown-FeesManagement"
                                placeholder="Description"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Remove button */}
                        {expenses.length > 1 && (
                            <button
                                onClick={() => removeExpenseField(idx)}
                                className="btn-solid "
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* ===== BUTTONS ROW ===== */}
            <div className="expense-buttons-row">
                {/* ADD NEW EXPENSE BUTTON */}
                <button
                    type="button"
                    onClick={addExpenseField}
                    className="btn-solid"
                    style={{width:'150px', marginTop:'-5px', padding:'5px'}}
                >
                    + Add Expense
                </button>

                {/* SUBMIT BUTTON */}
                <button onClick={handleSubmit} className="btn-solid " style={{width:'100px', marginTop:'-5px', padding:'5px'}}>
                    Submit All
                </button>
            </div>
        </div>
        <ErrorPopup
  message={popup.message}
  type={popup.type}
  onClose={() => setPopup({ message: "", type: "" })}
/>

    </>
);

};



const Actions = ({ actions, actionPlans, isMobile, font }) => {
  const [expenseRows, setExpenseRows] = useState([]);
  const [salaryRows, setSalaryRows] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showAllSalaries, setShowAllSalaries] = useState(false);

  useEffect(() => {
    const fetchLists = async () => {
      const schoolCode = localStorage.getItem("schoolCode");
      if (!schoolCode) return;

      try {
        setLoadingLists(true);
        const [expenseRes, salaryRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/totalexpenses`, { params: { schoolCode } }),
          axios.get(`${API_BASE_URL}/api/salarymanagement`, { params: { schoolCode } }),
        ]);

        const expenseData = Array.isArray(expenseRes.data) ? expenseRes.data : [];
        const salaryData = Array.isArray(salaryRes.data) ? salaryRes.data : [];

        setExpenseRows(expenseData);
        setSalaryRows(salaryData);
      } catch (error) {
        console.error("Failed to fetch expense/salary lists:", error);
        setExpenseRows([]);
        setSalaryRows([]);
      } finally {
        setLoadingLists(false);
      }
    };

    fetchLists();
  }, []);

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const cardsGridColumns = "repeat(4, minmax(0, 1fr))";
  const actionPlansGridColumns = isMobile ? "repeat(2, minmax(0, 1fr))" : cardsGridColumns;
  const visibleExpenses = showAllExpenses ? expenseRows : expenseRows.slice(0, 4);
  const visibleSalaries = showAllSalaries ? salaryRows : salaryRows.slice(0, 4);

  return (
    <div className="action-container" style={{ padding: "10px" }}>
      <div className="action-item" style={{ marginBottom: "12px", display: "block", width: "100%" }}>
        <strong style={{ fontSize: "13px" }}>Expense List ({expenseRows.length})</strong>
        <div className="normalText" style={{ marginTop: "6px", maxHeight: showAllExpenses ? "220px" : "120px", overflowY: "auto", display: "grid", gap: "8px", gridTemplateColumns: cardsGridColumns }}>
          {loadingLists && <div style={{ fontSize: "12px" }}>Loading expense list...</div>}
          {!loadingLists && visibleExpenses.map((item, idx) => (
            <div key={idx} style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "8px", background: "#fafafa" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#222" }}>
                {item.expense_name || item.expense_type || "Expense"}
              </div>
              <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
                {item.expense_type || "Type N/A"}
              </div>
              <div style={{ fontSize: "11px", color: "#333", marginTop: "2px" }}>
                {formatINR(item.price || item.amount || item.paid_amount)}
              </div>
            </div>
          ))}
          {!loadingLists && expenseRows.length > 4 && !showAllExpenses && (
            <button type="button" onClick={() => setShowAllExpenses(true)} style={{ border: "none", background: "transparent", color: "#1a73e8", textAlign: "left", padding: 0, cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}>
              + {expenseRows.length - 4} more... (View all)
            </button>
          )}
          {!loadingLists && expenseRows.length > 4 && showAllExpenses && (
            <button type="button" onClick={() => setShowAllExpenses(false)} style={{ border: "none", background: "transparent", color: "#1a73e8", textAlign: "left", padding: 0, cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}>
              Show less
            </button>
          )}
        </div>
      </div>

      <div className="action-item" style={{ marginBottom: "12px", display: "block", width: "100%" }}>
        <strong style={{ fontSize: "13px" }}>Teacher Salaries ({salaryRows.length})</strong>
        <div style={{ marginTop: "6px", maxHeight: showAllSalaries ? "220px" : "120px", overflowY: "auto", display: "grid", gap: "8px", gridTemplateColumns: cardsGridColumns }}>
          {loadingLists && <div style={{ fontSize: "12px" }}>Loading salary list...</div>}
          {!loadingLists && visibleSalaries.map((row, idx) => (
            <div key={idx} style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "8px", background: "#fafafa" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#222" }}>
                {row.teacher_name || row.teacher_id || "Teacher"}
              </div>
              <div style={{ fontSize: "11px", color: "#333", marginTop: "2px" }}>
                {formatINR(row.final_salary || row.salary_amount || row.base_salary)}
              </div>
              <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
                {row.salary_month || row.payment_date || ""}
              </div>
            </div>
          ))}
          {!loadingLists && salaryRows.length > 4 && !showAllSalaries && (
            <button type="button" onClick={() => setShowAllSalaries(true)} style={{ border: "none", background: "transparent", color: "#1a73e8", textAlign: "left", padding: 0, cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}>
              + {salaryRows.length - 4} more... (View all)
            </button>
          )}
          {!loadingLists && salaryRows.length > 4 && showAllSalaries && (
            <button type="button" onClick={() => setShowAllSalaries(false)} style={{ border: "none", background: "transparent", color: "#1a73e8", textAlign: "left", padding: 0, cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}>
              Show less
            </button>
          )}
        </div>
      </div>

      <div className="action-item" style={{ marginBottom: "12px", display: "block", width: "100%" }}>
        <strong style={{ fontSize: "13px" }}>My Actions ({actionPlans?.length || 0})</strong>
        <div style={{ marginTop: "6px", maxHeight: "180px", overflowY: "auto", display: "grid", gap: "8px", gridTemplateColumns: actionPlansGridColumns }}>
          {(actionPlans || []).map((item, idx) => (
            <div key={idx} style={{ border: "1px solid #e6e6e6", borderRadius: "8px", padding: "8px", background: "#fafafa" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#222" }}>{item.title}</div>
              {item.detail && <div style={{ fontSize: "11px", color: "#555", marginTop: "3px" }}>{item.detail}</div>}
              {Array.isArray(item.procedure) && item.procedure.length > 0 && (
                <ol style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "11px", color: "#333" }}>
                  {item.procedure.map((step, sIdx) => (
                    <li key={sIdx} style={{ marginBottom: "2px" }}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="action-item" style={{ display: "block", width: "100%" }}>
        <strong style={{ fontSize: "13px" }}>Recent Activity ({actions?.length || 0})</strong>
        <div style={{ marginTop: "6px", maxHeight: "130px", overflowY: "auto", display: "grid", gap: "8px" }}>
          {actions.map((action) => (
            <div key={action.id} className={`action-item ${isMobile ? "action-item-mobile" : ""}`} style={{ fontFamily: font }}>
              <FontAwesomeIcon icon={faAngleRight} className="action-arrow" />
              <div className="action-text">{action.text}</div>
              <div className={`status-badge ${action.status === "OK" ? "status-ok" : "status-rejected"}`}>
                {action.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};







const AccountantFeesIncome = () => {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const font = "'Century Gothic', 'AppleGothic', sans-serif";
      const [popupMessage, setPopupMessage] = useState("");
  
    
    // --- STATE HOOKS FOR DROPDOWN DATA (UNCHANGED FETCH, NEW COMBINED STATE) ---
    const [classList, setClassList] = useState([]);
    const [sectionList, setSectionList] = useState([]); 
    const [classSectionList, setClassSectionList] = useState([]); // NEW COMBINED STATE
    const [dropdownLoading, setDropdownLoading] = useState(false);
    // Placeholder data for Actions (based on image)


    // --- MODAL STATE FOR ALERTS/CONFIRMATIONS (UNCHANGED) ---
    const [modal, setModal] = useState({
        isVisible: false,
        message: '',
        type: 'setPopupMessage',
        onConfirm: () => setModal({ ...modal, isVisible: false }),
        onCancel: () => setModal({ ...modal, isVisible: false }),
    });
    
    // 🎯 NEW STATE: For holding the expense data to be passed to ExpenseTrackerUI
    const [expenseTrackerData, setExpenseTrackerData] = useState({ category: null, type: null });

    // --- MODAL STATE FOR CONTENT (Pay Fee / Edit Bill) (NEW) ---
    const [contentModal, setContentModal] = useState({
        isVisible: false,
        contentComponent: null, 
        title: '',
        className: '',
        sectionName: '',
    });

    const closeModal = () => {
        // Clear modal state and hide
        setContentModal({ 
            isVisible: false,
            contentComponent: null, 
            title: '',
            className: '',
            sectionName: '',
        });
        setExpenseTrackerData({ category: null, type: null }); // 🎯 Clear expense data
    };
    
    // Helper to split "1A" into ["1", "A"] - DUPLICATED FOR MAIN COMPONENT'S USE
 // AccountantIncome.jsx (Define this function near the top or where your other utility functions are)

const splitClassSection = (combined) => {
    if (!combined) return ["", ""];

    // Remove ALL spaces
    const str = String(combined).trim().replace(/\s+/g, "");

    // Match 6A, 10B, etc.
    const adjacentMatch = str.match(/^(\d+)([A-Za-z]+)$/);
    if (adjacentMatch) {
        console.log("splitClassSection Match (Adjacent):", adjacentMatch[1], adjacentMatch[2]);
        return [adjacentMatch[1], adjacentMatch[2].toUpperCase()];
    }

    return [str, ""];
};

    // --- API FETCH LOGIC (MODIFIED to also create the combined list) ---
    const fetchMetadata = useCallback(async () => {
        setDropdownLoading(true);
        const schoolCode = getSchoolCode(); 
        try {
            const [classRes, sectionRes] = await Promise.all([
                axios.get(`${API_BASE}/classes?schoolCode=${schoolCode}`),
                axios.get(`${API_BASE}/sections?schoolCode=${schoolCode}`),
            ]);
            
            const fetchedClasses = classRes.data || [];
            const fetchedSections = sectionRes.data || [];
            
            setClassList(fetchedClasses);
            setSectionList(fetchedSections);

            // SIMULATION: Create combined class-section strings (e.g., "1A", "1B", "2A")
            // This assumes all sections apply to all classes for simplicity, but a real
            // implementation would require a dedicated API endpoint for valid pairs.
            const combinedList = [];
            if (fetchedClasses.length > 0 && fetchedSections.length > 0) {
                 fetchedClasses.forEach(c => {
                    // Assuming class names are numbers that precede the section letter
                    fetchedSections.forEach(s => {
                        combinedList.push(`${c}${s}`); 
                    });
                });
            }
            
            // Add a fallback option if the combined list is empty
            if (combinedList.length === 0) {
                 if (fetchedClasses.length > 0) {
                     combinedList.push(fetchedClasses[0]); // Use first class as a default
                 } else {
                     combinedList.push('N/A');
                 }
            }
            
            setClassSectionList(combinedList);
            
        } catch (error) {
            console.error("Error fetching metadata:", error);
            setModal({
                isVisible: true,
                message: `ERROR: Failed to fetch dropdown data. ${error.message}`,
                type: 'setPopupMessage',
                onConfirm: () => setModal({ ...modal, isVisible: false }),
            });
        }
        setDropdownLoading(false);
    }, [modal]);    
    
    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);
    
    // 🎯 NEW HANDLER: To open ExpenseTrackerUI modal from SimpleExpenseManager
    const handleShowExpenseTracker = (category, type) => {
        setExpenseTrackerData({ category, type });
        setContentModal({
            isVisible: true,
            contentComponent: ExpenseTrackerUI, // Set the component to ExpenseTrackerUI
            title: `Log Payment for: ${category} - ${type}`,
            // We don't need className/sectionName for ExpenseTrackerUI, but keep them in state just in case
            className: '',
            sectionName: '',
        });
    };
    
// AccountantIncome.jsx (Inside the AccountantFeesIncome component)

const handlePayFee = (combinedSelection) => {
    const [classSelection, sectionSelection] = splitClassSection(combinedSelection); 
    
    if (classSelection) {
  
        console.log("Content Modal State Set:", {
            className: classSelection,
            sectionName: sectionSelection,
        });
    } else {
        setModal({
            isVisible: true,
            message: "Please select a Class-Section before proceeding to Pay Fee.",
            type: 'setPopupMessage',
            onConfirm: () => setModal({ ...modal, isVisible: false }),
        });
    }
};
    
    const handleEditBill = (combinedSelection) => {
        const [classSelection, sectionSelection] = splitClassSection(combinedSelection);

        if (classSelection) {
           
        } else {
            setModal({
                isVisible: true,
                message: "Please select a Class-Section before proceeding to Edit Bill.",
                type: 'setPopupMessage',
                onConfirm: () => setModal({ ...modal, isVisible: false }),
            });
        }
    };
    // ---------------------------------------------


    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    
    // MODIFIED: Added alignItems: 'stretch' for height consistency
    const feesManagementGrid = {
        display: "grid",
gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: "20px",
        alignItems: 'stretch',
        backgroundColor: "transparent",
                 //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++====

    };
    

const ReportComplainExpense = ({ isMobile }) => {
    return (
        <div>
            {/* Header */}
            <div className="expense-section-header">
                <span className="expense-header-icon" />
                Report/Complaint
            </div>

            {/* Main Content */}
            <div className={isMobile ? "expense-mobile-main-content" : "expense-main-content"}>
                {/* Column 1 */}
                <div className="expense-column" style={{ flex: 1 }}>
                    <label className="expense-label">Select Complaint</label>
                    <select className="expense-select btn-dropdown-FeesManagement">
                        <option>Select</option>
                    </select>
                    <button className=" btn-solid">View Data</button>
                    <button className="btn-solid">Send To SA</button>
                </div>

                {/* Column 2 */}
                <div className="expense-column" style={{ flex: 1 }}>
                    <label className="expense-label">Complaint List</label>
                    <select className="expense-select btn-dropdown-FeesManagement">
                        <option>J.VAISHALI, MATHS J.A., SALARYDEN</option>
                        <option>P. SHAHNAZ, ENGLISH J.A., SALARY MGR</option>
                    </select>
                    <button className=" btn-solid">View Data</button>
                    <button className=" btn-solid">View Report</button>
                </div>
            </div>
              <ErrorPopup
          message={popupMessage} 
          onClose={() => setPopupMessage("")} 
        /> 
        </div>
    );
};


const SalaryManagement = ({ isMobile, font ,addAction}) => {
    const [summary, setSummary] = useState({
        total_paid: 0,
        total_reduction: 0,
    });
    const [salaryList, setSalaryList] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [showPopup, setShowPopup] = useState(false);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

 const fetchSalaryData = async (month = "") => {
    try {
        const schoolCode = localStorage.getItem("schoolCode");
        let url = `https://cleezoclass.com:5000/api/salarymanagement?schoolCode=${schoolCode}`;
        if (month) url += `&month=${month}`;

        const res = await fetch(url);

        // Check if the response is successful (status 200-299)
        if (!res.ok) {
            throw new Error(`Server Error: ${res.status}`);
        }

        const data = await res.json();

        // Safe state updates with fallbacks
        setSummary({
            total_paid: data?.summary?.total_paid || 0,
            total_reduction: data?.summary?.total_reduction || 0,
        });
        setSalaryList(data?.list || []);

        if (month !== "") setShowPopup(true);

    } catch (err) {
        console.error("Fetch error:", err);
        // Reset to zeros on error so the UI doesn't crash
        setSummary({ total_paid: 0, total_reduction: 0 });
        setSalaryList([]);
    }
};

    useEffect(() => {
        fetchSalaryData();
    }, []);

    useEffect(() => {
        const today = new Date();
        const currentMonth = months[today.getMonth()];
        setSelectedMonth(currentMonth);
    }, []);

    const formatThousands = (num) => Math.round(num).toLocaleString("en-IN");

    const salaryChartData = [
        { name: 'Sent', value: summary.total_paid },
        { name: 'Paid', value: summary.total_paid },
        { name: 'Reduction', value: summary.total_reduction },
    ];

    return (
        <div className="expense-font" style={{ fontFamily: font }}>
            {/* CHART */}
            <div className={isMobile ? "expense-chart-mobile" : "expense-chart-container"}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salaryChartData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={60} fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#9C6262" name="Amount" barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* SUMMARY */}
            <div className="expense-summary">
                <div className="expense-summary-item">
                    <div className="expense-summary-data">Total Paid</div>
                    <div className="expense-summary-value">₹ {formatThousands(summary.total_paid)}</div>
                </div>
                <div className="expense-summary-item" style={{ borderRight: 'none' }}>
                    <div className="expense-summary-data">Total Reduction</div>
                    <div className="expense-summary-value">₹ {formatThousands(summary.total_reduction)}</div>
                </div>
            </div>

            {/* MONTH FILTER */}
      <div className="expense-expense-filters" style={{marginLeft:'18%'}}>

  {/* Month + View Report */}
  <div className="expense-input-field" style={{height:'40px', marginTop:'20px'}}>
    <select
      value={selectedMonth}
      onChange={(e) => setSelectedMonth(e.target.value)}
      className="btn-dropdown-FeesManagement"
    >
      <option value="">Select Month</option>
      {months.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select></div>
  <div className="expense-input-field">

    <button
      className="btn-outline"
      onClick={() => {
        if (selectedMonth === "") {
          setPopupMessage("Please select a month");
          return;
        }
        fetchSalaryData(selectedMonth);
      }}
    >
      View Report
    </button>
  </div>
</div>
  {/* Salary Buttons */}
  <div className="expense-btn-group">
    <button className="btn-solid">SALARY, CUTOFF</button>
    <button className="btn-solid">SEND SALARY</button>
  </div>

            {/* POPUP */}
            {showPopup && (
                <div className="expense-popup-overlay" onClick={() => setShowPopup(false)}>
                    <div
                        className={isMobile ? "expense-popup-mobile" : "expense-popup"}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="expense-popup-title">SALARY REPORT – {selectedMonth}</h3>
                        <div style={{ maxHeight: "300px", overflowY: "auto", marginTop: "15px" }}>
                            <table className="expense-popup-table">
                                <thead>
                                    <tr>
                                        <th className="expense-popup-table-header">Teacher</th>
                                        <th className="expense-popup-table-header">Base</th>
                                        <th className="expense-popup-table-header">Deduct</th>
                                        <th className="expense-popup-table-header">Final</th>
                                        <th className="expense-popup-table-header">Month</th>
                                        <th className="expense-popup-table-header">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salaryList.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                                                No Records Found
                                            </td>
                                        </tr>
                                    ) : (
                                        salaryList.map((row) => (
                                            <tr key={row.salary_calc_id}>
                                                <td className="expense-popup-table-cell">{row.teacher_id}</td>
                                                <td className="expense-popup-table-cell">₹ {row.base_salary}</td>
                                                <td className="expense-popup-table-cell">₹ {row.deductions}</td>
                                                <td className="expense-popup-table-cell">₹ {row.final_salary}</td>
                                                <td className="expense-popup-table-cell">{row.salary_month}</td>
                                                <td className="expense-popup-table-cell">{row.payment_date}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={() => setShowPopup(false)}
                            className="btn-solid "
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            )}
              <ErrorPopup
          message={popupMessage} 
          onClose={() => setPopupMessage("")} 
        /> 
        </div>
    );
};
const PreviousRecordsExpense = ({ isMobile, font }) => {
    const [expenseTypes, setExpenseTypes] = useState([]);
    const [selectedFrom, setSelectedFrom] = useState('');
    const [selectedTo, setSelectedTo] = useState('');
    const [selectedExpense, setSelectedExpense] = useState('');
    const [records, setRecords] = useState({ expenses: [], salaries: [] });
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const schoolCode = localStorage.getItem("schoolCode");
        fetch(`https://cleezoclass.com:5000/api/expensemanagement-expense-types?schoolCode=${schoolCode}`)
            .then(res => res.json())
            .then(data => setExpenseTypes(data.data || []))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        const today = new Date();
        const toDate = today.toISOString().split('T')[0];
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const fromDate = firstDayLastMonth.toISOString().split('T')[0];
        setSelectedFrom(fromDate);
        setSelectedTo(toDate);
    }, []);

    const viewDetails = () => {
        if (!selectedExpense || selectedExpense === "EXP. TYPE") {
            setPopupMessage("Please select an Expense Type");
            return;
        }

        const schoolCode = localStorage.getItem("schoolCode");
        const params = new URLSearchParams({
            from: selectedFrom,
            to: selectedTo,
            expense_type: selectedExpense,
            schoolCode: schoolCode
        }).toString();

        const finalURL = `https://cleezoclass.com:5000/api/expensemanagement-previous-records?${params}`;

        fetch(finalURL)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    console.error("API Error:", data.message);
                }
                setRecords(data);
                setShowModal(true);
            })
            .catch(err => console.error("FETCH ERROR:", err));
    };

    return (
        <div className="expense-records-container">
            {/* Header */}
            <div className="expense-records-header">
                <span className="expense-records-header-icon" />
                Records/Previous
            </div>

            {/* Filter Section */}
       <div className="expense-filter-section">

  {/* LEFT COLUMN */}
  <div className="expense-left">

    <div className="expense-filter-group">
      <label className="expense-filter-label">From</label>
      <input
        type="date"
        className="btn-dropdown-FeesManagement"
        value={selectedFrom}
        onChange={e => setSelectedFrom(e.target.value)}
      />
    </div>

    <div className="expense-filter-group">
      <label className="expense-filter-label">Expense Type</label>
      <select
        className="btn-dropdown-FeesManagement"
        value={selectedExpense}
        onChange={e => setSelectedExpense(e.target.value)}
      >
        <option>EXP. TYPE</option>
        {expenseTypes.map((type, i) => (
          <option key={i}>{type}</option>
        ))}
      </select>
    </div>

  </div>


  {/* RIGHT COLUMN */}
  <div className="expense-right">

    <div className="expense-filter-group">
      <label className="expense-filter-label">To</label>
      <input
        type="date"
        className="btn-dropdown-FeesManagement"
        value={selectedTo}
        onChange={e => setSelectedTo(e.target.value)}
      />
    </div>

    <div className="expense-filter-group">
      <button
        onClick={viewDetails}
        className="btn-solid expense-view-btn"
      >
        View Details
      </button>
    </div>

  </div>

</div>

            {/* View Details Button */}
        
            {/* Modal Popup */}
            {showModal && (
                <div
                    className="expense-records-modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className={isMobile ? "expense-records-modal-mobile" : "expense-records-modal"}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Expenses Table */}
                        <h3>Expenses</h3>
                        <table className="expense-records-modal-table">
                            <thead>
                                <tr>
                                    {["ID", "Name", "Expense", "Price", "Date"].map((h) => (
                                        <th key={h} className="expense-records-modal-table-header">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {records.expenses?.length > 0 ? (
                                    records.expenses.map(e => (
                                        <tr key={e.id}>
                                            <td className="expense-records-modal-table-cell">{e.id}</td>
                                            <td className="expense-records-modal-table-cell">{e.person_name}</td>
                                            <td className="expense-records-modal-table-cell">{e.expense_name}</td>
                                            <td className="expense-records-modal-table-cell">{e.price}</td>
                                            <td className="expense-records-modal-table-cell">{e.expense_date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="expense-records-modal-table-cell" colSpan={5}>No records found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Salaries Table */}
                        <h3>Salaries</h3>
                        <table className="expense-records-modal-table">
                            <thead>
                                <tr>
                                    {["ID", "Teacher", "Final Salary", "Month", "Status", "Payment Date"].map((h) => (
                                        <th key={h} className="expense-records-modal-table-header">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {records.salaries?.length > 0 ? (
                                    records.salaries.map(s => (
                                        <tr key={s.salary_calc_id}>
                                            <td className="expense-records-modal-table-cell">{s.salary_calc_id}</td>
                                            <td className="expense-records-modal-table-cell">{s.teacher_name}</td>
                                            <td className="expense-records-modal-table-cell">{s.final_salary}</td>
                                            <td className="expense-records-modal-table-cell">{s.salary_month}</td>
                                            <td className="expense-records-modal-table-cell">{s.status}</td>
                                            <td className="expense-records-modal-table-cell">{s.payment_date}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="expense-records-modal-table-cell" colSpan={6}>No records found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="expense-records-modal-close"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
              <ErrorPopup
          message={popupMessage} 
          onClose={() => setPopupMessage("")} 
        /> 
        </div>
    );
};




// Component 7: MISCELLANEOUS / RECURRING EXPENSES
const RecurringExpenses = ({ isMobile, font }) => {
    // Mock data for the recurring expenses chart
    const mockChartData = [
        { name: 'Rent', value: 10000 },
        { name: 'Utilities', value: 5000 },
        { name: 'Software', value: 2000 },
    ];

    return (
        <div className="expense-recurring-container" style={{ textAlign: "center", fontFamily: font }}>
            {/* Header */}
            <div className={isMobile ? "expense-recurring-header-mobile" : "expense-recurring-header"}>
                Recurring Expenses
            </div>

            {/* Chart */}
            <div className={isMobile ? "expense-recurring-chart-mobile" : "expense-recurring-chart"}>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={mockChartData}>
                        <XAxis dataKey="name" fontSize={isMobile ? 10 : 12} />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="value" fill="#945f4aff" name="Amount (₹)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="expense-recurring-summary">
                <div className="expense-recurring-summary-item">
                    <div className="expense-recurring-summary-data">Total Spent</div>
                    <div className="expense-recurring-summary-value">₹ 1,45,226.00</div>
                </div>
                <div className="expense-recurring-summary-item" style={{ borderRight: 'none' }}>
                    <div className="expense-recurring-summary-data">Total Recurring</div>
                    <div className="expense-recurring-summary-value">₹ 4,32,522.00</div>
                </div>
            </div>

            {/* Buttons */}
            <div className="expense-recurring-buttons">
                <button className="btn-solid">View Report</button>
                <button className="btn-solid">Create New</button>
                <button className="btn-solid">Edit</button>
                <button className="btn-solid">Pay</button>
            </div>
        </div>
    );
};



  // SECTION REFS
  const firstSectionRef = useRef(null);
  const secondSectionRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // SECTION VISIBILITY
  const [secondSectionVisible, setSecondSectionVisible] = useState(false);
 // MOBILE RESIZE LISTENER
useEffect(() => {
  const onResize = () => {
    const isNowMobile = window.innerWidth < 768;
    console.log("📱 RESIZE EVENT: window.innerWidth =", window.innerWidth, "=> isMobile:", isNowMobile);
    setIsMobile(isNowMobile);
  };

  window.addEventListener("resize", onResize);
  console.log("✔ Resize listener attached");

  return () => {
    window.removeEventListener("resize", onResize);
    console.log("✖ Resize listener removed");
  };
}, []);

const secondSectionVisibleRef = useRef(secondSectionVisible);

useEffect(() => {
  secondSectionVisibleRef.current = secondSectionVisible;
}, [secondSectionVisible]);

useEffect(() => {
  const el = scrollAreaRef.current;
  if (!el) return;

  const handleScroll = () => {
    const y = el.scrollTop;
    // SHOW second section when scroll > 200
    if (y > 200 && !secondSectionVisible) {
      setSecondSectionVisible(true);
    }

    // HIDE second section when scroll < 150
    if (y < 150 && secondSectionVisible && !ignoreScrollHideRef.current) {
      setSecondSectionVisible(false);
    }
  };

  el.addEventListener("scroll", handleScroll);
  return () => el.removeEventListener("scroll", handleScroll);
}, [secondSectionVisible]);


const ignoreScrollHideRef = useRef(false);

const scrollToSecondSection = () => {
  console.log("🔽 scrollToSecondSection called");

  // Make second section visible if hidden
  if (!secondSectionVisible) {
    setSecondSectionVisible(true);
  }

  // Prevent the scroll hide logic temporarily
  ignoreScrollHideRef.current = true;
  setTimeout(() => {
    ignoreScrollHideRef.current = false;
  }, 300);

  // Wait for next frame and scroll
  requestAnimationFrame(() => {
    if (secondSectionRef.current) {
      console.log("📌 Scrolling to second section");
      secondSectionRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      console.log("⚠ secondSectionRef.current is null");
    }
  });
};


const scrollToTop = () => {
  console.log("🔝 scrollToTop called");
  scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  console.log("📌 Scrolling container to top");
  setTimeout(() => {
    console.log("✨ Hiding second section after scrolling to top");
    setSecondSectionVisible(false);
  }, 300);
};
const isLaptop = window.innerWidth > 600 && window.innerWidth <= 1440;
const isLargeMonitor = window.innerWidth > 1440;
  const expenseActionPlans = [
    {
      title: "Daily Expense Verification",
      detail: "Verify every submitted expense with bills and payment mode.",
      procedure: [
        "Open today expenses list and sort by date/time.",
        "Match each entry with bill/voucher.",
        "Validate payment mode and vendor/person name.",
        "Fix mismatches before day-close."
      ]
    },
    {
      title: "High Spend Category Control",
      detail: "Monitor categories where spend is unusually high.",
      procedure: [
        "Review top expense categories from reports.",
        "Compare current week vs previous week.",
        "Flag category increase above 20%.",
        "Escalate repeated spikes to management."
      ]
    },
    {
      title: "Salary Payout Reconciliation",
      detail: "Ensure salary payouts match ledger and approvals.",
      procedure: [
        "Match salary paid with approved ledger.",
        "Validate deductions and adjustments.",
        "Confirm payment date and method.",
        "Log unresolved mismatches for follow-up."
      ]
    },
  ];
  const [actionItems, setActionItems] = useState([
    { id: 1, text: "SYSTEM INITIALIZED: EXPENSE MODULE READY", status: "OK" },
  ]);

  const addActionItem = (text, status = "OK") => {
    const newItem = {
      id: Date.now(),
      text: text.toUpperCase(),
      status: status,
    };
    setActionItems((prev) => [newItem, ...prev].slice(0, 5));
  };

  return (

 <div
  ref={scrollAreaRef}
  className={`expense-outer-container ${isMobile ? "expense-outer-container-mobile" : ""}`}
>
  <div>
  {/* Standard Alert/Confirm Modal */}
  <CustomModal
    isVisible={modal.isVisible}
    message={modal.message}
    type={modal.type}
    onConfirm={modal.onConfirm}
    onCancel={modal.onCancel}
  />

  {/* Content Modal for Pay Fee / Edit Bill / Expense Tracker */}
  <CustomModal
    isVisible={contentModal.isVisible}
    title={contentModal.title}
    type="content"
    onCancel={closeModal}
  >
    {contentModal.contentComponent && (
      contentModal.contentComponent === ExpenseTrackerUI ? (
        <ExpenseTrackerUI
          onClose={closeModal}
          expenseCategory={expenseTrackerData.category}
          expenseType={expenseTrackerData.type}
        />
      ) : (
        <contentModal.contentComponent
          className={contentModal.className}
          sectionName={contentModal.sectionName}
        />
      )
    )}
    {contentModal.contentComponent === ExpenseTrackerUI && (
      <button
        onClick={closeModal}
        style={{
          marginTop: "15px",
          padding: "10px 20px",
          background: "#5A7488",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    )}
  </CustomModal>

  <div ref={firstSectionRef}>
    {/* Dashboard Title & Notification (EXPENSE MANAGEMENT) */}
    <div className="footprintsinner">
      Expense Management
    </div>

    {/* --- EXPENSE MANAGEMENT SECTION --- */}
      <div className={`second-section-grid ${isMobile ? "mobile" : "desktop"}`}>
      <CustomCardRight isMobile={isMobile}>
                  <div className="track-left-container">

          {/* LEFT SIDE – TRACK EXPENSES */}
          <div className="section-wrapper"style={{ marginTop:'-10%',}} >
            <div className="expense-section-header">
              <span className="expense-section-header-icon" />
              Track Expenses
            </div>
            <TrackExpenses isMobile={isMobile} font={font} addAction={addActionItem} />
          </div>

          {/* RIGHT SIDE – EXPENSE */}
<div className="expense-section-wrapper" style={{ flex: 1, borderLeft: !isMobile ? '1px solid #ccc' : 'none',    paddingLeft: !isMobile ? "15px" : "0", // space between line and content
 }}>
            <div className="expense-section-header">
              <span className="expense-section-header-icon" />
              Expense
            </div>
            <SimpleExpenseManager
              isMobile={isMobile}
              font={font}
              setModal={setModal}
              onShowExpenseTracker={handleShowExpenseTracker}
              classSectionList={classSectionList}
              dropdownLoading={dropdownLoading}
              onPayFee={handlePayFee}
              onEditBill={handleEditBill} addAction={addActionItem} 
            />
          </div>
        </div>
      </CustomCardRight>

      {/* Actions Card (Right Column) */}
      <div style={{ flex: isMobile ? "1 1 100%" : 4 }}>
        <CustomCard title="Actions" isMobile={isMobile}>
<Actions actions={actionItems} actionPlans={expenseActionPlans} isMobile={isMobile} font={font} />        </CustomCard>
      </div>

    </div>
</div>
    <div
      ref={secondSectionRef}
      className={`expense-second-section ${secondSectionVisible ? "expense-second-section-visible" : ""}`}
    >
      {/* Scroll-to-top button at top of second section */}


      {/* Dashboard Title (EXPENSE ACTIVITIES) */}
      <div className="footprintsinner">
        Expense Activities
      </div>

      <div className={`second-section-grid ${isMobile ? "mobile" : "desktop"}`}>
        {/* 1. COMBINED REPORT/COMPLAIN AND REMINDERS - CUTOFF */}
        <CustomCardRight isMobile={isMobile}>
          <div
            className="track-left-container"
            style={{
              display: 'flex',
              gap: isMobile ? '15px' : '15px',
              position: 'relative',
            }}
          >
            {/* LEFT SIDE – REPORT/COMPLAIN & REMINDERS */}
            <div className="expense-section-wrapper" style={{ flex: 1 }}>
              <ReportComplainExpense
                isMobile={isMobile}
                font={font}
                classSectionList={classSectionList}
                dropdownLoading={dropdownLoading}
                 addAction={addActionItem} 
              />
              <PreviousRecordsExpense
                isMobile={isMobile}
                font={font}
                classSectionList={classSectionList}
                dropdownLoading={dropdownLoading}
              />
            </div>

            {/* Vertical line */}
            {!isMobile && (
              <div className="expense-vertical-line" />
            )}

            {/* RIGHT SIDE – SALARY MANAGEMENT */}
<div className="expense-section-wrapper" style={{ flex: 1, borderLeft: !isMobile ? '1px solid #ccc' : 'none',    paddingLeft: !isMobile ? "15px" : "0", // space between line and content
 }}>
              <div className="expense-section-header">
                <span className="expense-section-header-icon" />
                Salary Management
              </div>
              <SalaryManagement isMobile={isMobile} font={font} addAction={addActionItem} />
            </div>
          </div>
        </CustomCardRight>

        {/* 3. MISCELLANEOUS */}
        <CustomCard
          title="Miscellaneous"
          titleIcon={
            <span className="expense-section-header-icon" />
          }
          isMobile={isMobile}
        >
            <RecurringExpenses isMobile={isMobile} font={font} addAction={addActionItem} />
        </CustomCard>
      </div>
    </div>

    <div className="expense-scroll-buttons">
  
    </div>
  </div>
  <ErrorPopup
          message={popupMessage} 
          onClose={() => setPopupMessage("")} 
        /> 
</div>
    );
};

export default AccountantFeesIncome;