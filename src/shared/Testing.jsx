import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleRight,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import './STYLES/tabhower.css'
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend, BarChart, Bar
} from "recharts";
import './ExpenseStyles.css';

import ExpenseTrackerUI from "./Accountant_ExpenseManagement_expense_Expense";
import ErrorPopup from "./ErrorPopup";

const API_BASE = 'https://cleezoclass.com:4000/api/admin';
const API_BASE_URL = "https://cleezoclass.com:4000";

const getSchoolCode = () => {
  const storedCode = localStorage.getItem('schoolCode');
  return storedCode || 'TAGSOLNOVALLP';
};

// ----------------------------------------------------------------------
// --- Components ---
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
    <div className="expense-modal-overlay" onClick={onCancel}>
      <div className={`expense-modal-content ${type === 'content' ? 'expense-modal-content-content' : ''}`} onClick={(e) => e.stopPropagation()}>
        {type === 'content' ? (
          <div style={{ marginTop: '15px', textAlign: 'left' }}>{children}</div>
        ) : (
          <>
            <p><Icon />{message}</p>
            <div className={`expense-modal-button-group ${type === 'confirm' ? 'expense-modal-button-group-confirm' : ''}`}>
              {type === 'confirm' && <button onClick={onCancel} className="expense-modal-base-btn expense-modal-cancel-btn">Cancel</button>}
              <button onClick={onConfirm} className="expense-modal-base-btn expense-modal-confirm-btn">{type === 'confirm' ? 'Proceed' : 'OK'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const CustomCard = ({ title, children, isMobile }) => {
  return (
    <div className="Card-rightContainer">
      <div className="expense-card-header"><span className="expense-card-header-icon" />{title}</div>
      {children}
    </div>
  );
};

const CustomCardRight = ({ title, children, isMobile }) => {
  const isLaptop = window.innerWidth > 600 && window.innerWidth <= 1440;
  return (
    <div className={`expense-card-right ${isMobile ? 'expense-card-right-mobile' : isLaptop ? 'expense-card-right-laptop' : 'expense-card-right-desktop'}`}>
      {title && (
        <div className="expense-card-right-header">
          <input type="radio" className="expense-card-radio" id={`radio-${title.replace(/\s/g, "-")}`} name="section-radio" defaultChecked={true} />
          <label htmlFor={`radio-${title.replace(/\s/g, "-")}`}>{title}</label>
        </div>
      )}
      {children}
    </div>
  );
};

// --- SUB-COMPONENTS WITH DYNAMIC ACTIONS ---

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

  const schoolCode = getSchoolCode();

  const handleSendToAdmin = async () => {
    if (!schoolCode) { setPopupMessage("School code missing"); return; }
    const allExpenses = await fetchAllExpenses();
    if (!allExpenses || allExpenses.length === 0) { setPopupMessage("No expenses found"); return; }

    let filtered = allExpenses;
    if (fromDate && toDate) {
      filtered = filtered.filter((item) => {
        const d = new Date(item.expense_date).toISOString().split("T")[0];
        return d >= fromDate && d <= toDate;
      });
    }

    if (expenseType) filtered = filtered.filter(item => item.expense_type === expenseType);

    try {
      await axios.post("https://cleezoclass.com:4000/expenses-superadmin", { schoolCode, expenses: filtered });
      setPopupMessage("Sent successfully ✅");
      addAction(`SENT EXPENSES TO SUPER ADMIN (${expenseType || 'ALL'})`, "OK");
    } catch (error) {
      setPopupMessage("Failed to send");
      addAction("FAILED TO SEND EXPENSES TO ADMIN", "REJECTED");
    }
  };

  const fetchAllExpenses = async () => {
    try {
      const res = await axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
      setExpenseTypes([...new Set(res.data.map(e => e.expense_type))]);
      setExpenseNames([...new Set(res.data.map(e => e.expense_name))]);
      return res.data;
    } catch (err) { return []; }
  };

  const fetchChartData = async () => {
    if (!fromDate || !toDate) return;
    setChartLoading(true);
    try {
      const expRes = await axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
      const rawExpenses = expRes.data || [];
      const monthlyTotals = {};
      rawExpenses.forEach(e => {
        const key = e.expense_date.substring(0, 7);
        if (!monthlyTotals[key]) monthlyTotals[key] = { month: key, Paid: 0, Unpaid: 0 };
        monthlyTotals[key].Paid += Number(e.price) || 0;
      });
      setChartData(Object.values(monthlyTotals).sort((a, b) => a.month.localeCompare(b.month)));
    } catch (err) { console.error(err); }
    setChartLoading(false);
  };

  useEffect(() => {
    const today = new Date();
    setFromDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]);
    setToDate(today.toISOString().split("T")[0]);
    fetchAllExpenses();
  }, []);

  useEffect(() => { if (fromDate && toDate) fetchChartData(); }, [fromDate, toDate]);

  return (
    <div>
      <div className="expense-date-filters">
        <div className="expense-chart-container" style={{ height: '150px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}><XAxis dataKey="month" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="Paid" fill="#9C6262" barSize={30} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="expense-filter-controls">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="btn-dropdown-FeesManagement" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="btn-dropdown-FeesManagement" />
        </div>
      </div>
      <div className="expense-total-spent">
        <button className="btn-outline" onClick={() => { setShowModal(true); addAction("VIEWED EXPENSE LIST REPORT"); }}>View List</button>
        <button className="btn-solid" onClick={handleSendToAdmin}>Send to Super Admin</button>
      </div>
      {showModal && <div className="previousrecord-popup-overlay" onClick={() => setShowModal(false)}><div className="previousrecord-popup" onClick={e => e.stopPropagation()}><h3>Expense Records</h3><button className="btn-solid" onClick={() => setShowModal(false)}>Close</button></div></div>}
      <ErrorPopup message={popupMessage} onClose={() => setPopupMessage("")} />
    </div>
  );
};

const SimpleExpenseManager = ({ isMobile, font, setModal, onShowExpenseTracker, addAction }) => {
  const [expenseCategory, setExpenseCategory] = useState('');
  const [specificExpenseName, setSpecificExpenseName] = useState('');
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [expenses, setExpenses] = useState([{ name: "", description: "" }]);

  const handleCreateCategory = () => {
    if (!categoryName.trim()) return;
    addAction(`CREATED NEW CATEGORY: ${categoryName}`, "OK");
    setCategoryName("");
    setCategoryDescription("");
  };

  const handleReject = () => {
    addAction(`REJECTED EXPENSE ENTRY: ${specificExpenseName || 'UNNAMED'}`, "REJECTED");
    setExpenseCategory("");
    setSpecificExpenseName("");
  };

  const handleSubmitAll = async () => {
    if (!categoryName) {
        addAction("SUBMISSION FAILED: NO CATEGORY SELECTED", "REJECTED");
        return;
    }
    addAction(`SUBMITTED MASTER EXPENSE LIST FOR ${categoryName}`, "OK");
  };

  const predefinedOptions = {
    "Maintenance Services": ["Building Maintenance", "Furniture Repair"],
    "Digital & IT Services": ["Internet", "Software AMC"]
  };

  return (
    <div className="expense-form-container">
      <div className="expense-row">
        <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="btn-dropdown-FeesManagement">
          <option value="">Category</option>
          {Object.keys(predefinedOptions).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-solid" onClick={() => { 
            onShowExpenseTracker(expenseCategory, specificExpenseName);
            addAction(`OPENED PAYMENT TRACKER FOR ${expenseCategory}`);
        }}>PAY</button>
      </div>
      
      <div className="expense-manager-header" style={{marginTop: '20px'}}>Category Manager</div>
      <div className="expense-row">
        <input type="text" placeholder="Category Name" value={categoryName} onChange={e => setCategoryName(e.target.value)} className="btn-dropdown-FeesManagement" />
        <button className="btn-solid" onClick={handleCreateCategory}>Create</button>
      </div>
      
      <div className="expense-buttons-row" style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
          <button className="btn-solid" onClick={handleReject}>Reject Entry</button>
          <button className="btn-solid" onClick={handleSubmitAll}>Submit All</button>
      </div>
    </div>
  );
};

const SalaryManagement = ({ isMobile, font, addAction }) => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const handleSend = () => {
    addAction(`SALARY DISBURSEMENT SENT FOR ${selectedMonth || 'CURRENT MONTH'}`, "OK");
  };

  return (
    <div style={{ fontFamily: font }}>
      <div className="expense-month-filter">
        <select className="expense-month-select btn-dropdown-FeesManagement" onChange={(e) => setSelectedMonth(e.target.value)}>
          <option>Select Month</option>
          <option>January</option><option>February</option>
        </select>
        <button className="btn-outline" onClick={() => addAction(`VIEWED SALARY REPORT: ${selectedMonth}`)}>View</button>
      </div>
      <div className="expense-btn-group">
        <button className="btn-solid" onClick={handleSend}>SEND SALARY</button>
      </div>
    </div>
  );
};

const ReportComplainExpense = ({ isMobile, addAction }) => {
    return (
        <div>
            <div className="expense-section-header">Report/Complaint</div>
            <div className="expense-column">
                <button className="btn-solid" onClick={() => addAction("VIEWED COMPLAINT DATA", "OK")}>View Data</button>
                <button className="btn-solid" onClick={() => addAction("COMPLAINT SENT TO SUPER ADMIN", "OK")}>Send To SA</button>
            </div>
        </div>
    );
};

const RecurringExpenses = ({ isMobile, font, addAction }) => {
    return (
        <div style={{textAlign: 'center', padding: '10px'}}>
            <button className="btn-solid" onClick={() => addAction("VIEWED RECURRING EXPENSE REPORT")}>View Report</button>
            <button className="btn-solid" onClick={() => addAction("INITIATED RECURRING PAYMENT")}>Pay Recurring</button>
        </div>
    );
}

const Actions = ({ actions, isMobile, font }) => {
  return (
    <div className="expense-actions-container">
      {actions.map((action) => (
        <div key={action.id} className="expense-action-item" style={{ fontFamily: font }}>
          <FontAwesomeIcon icon={faAngleRight} className="expense-action-arrow" />
          <div className="expense-action-text">{action.text}</div>
          <div className={`expense-status-badge ${action.status === "OK" ? "expense-status-ok" : "expense-status-rejected"}`}>
            {action.status}
          </div>
        </div>
      ))}
    </div>
  );
};

// ----------------------------------------------------------------------
// --- MAIN COMPONENT ---
// ----------------------------------------------------------------------

const AccountantFeesIncome = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const font = "'Century Gothic', sans-serif";
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

  const [modal, setModal] = useState({ isVisible: false, message: '', type: 'setPopupMessage' });
  const [expenseTrackerData, setExpenseTrackerData] = useState({ category: null, type: null });
  const [contentModal, setContentModal] = useState({ isVisible: false, contentComponent: null });

  const handleShowExpenseTracker = (category, type) => {
    setExpenseTrackerData({ category, type });
    setContentModal({ isVisible: true, contentComponent: ExpenseTrackerUI });
  };

  return (
    <div className={`expense-outer-container ${isMobile ? "expense-outer-container-mobile" : ""}`}>
      <CustomModal isVisible={modal.isVisible} message={modal.message} onConfirm={() => setModal({ isVisible: false })} />
      
      <CustomModal isVisible={contentModal.isVisible} type="content" onCancel={() => setContentModal({ isVisible: false })}>
        {contentModal.contentComponent && (
          <ExpenseTrackerUI onClose={() => setContentModal({ isVisible: false })} expenseCategory={expenseTrackerData.category} expenseType={expenseTrackerData.type} />
        )}
      </CustomModal>

      <div className="footprintsinner">Expense Management</div>

      <div className={`second-section-grid ${isMobile ? "mobile" : "desktop"}`}>
        <CustomCardRight isMobile={isMobile}>
          <div className="track-left-container" style={{display: 'flex', flexDirection: isMobile ? 'column' : 'row'}}>
            <div style={{ flex: 1, padding: '10px' }}>
                <div className="expense-section-header">Track Expenses</div>
                <TrackExpenses isMobile={isMobile} font={font} addAction={addActionItem} />
            </div>
            <div style={{ flex: 1, padding: '10px', borderLeft: isMobile ? 'none' : '1px solid #eee' }}>
                <div className="expense-section-header">Expense</div>
                <SimpleExpenseManager isMobile={isMobile} font={font} setModal={setModal} onShowExpenseTracker={handleShowExpenseTracker} addAction={addActionItem} />
            </div>
          </div>
        </CustomCardRight>

        <div style={{ flex: isMobile ? "1 1 100%" : 0.4 }}>
          <CustomCard title="Actions" isMobile={isMobile}>
            <Actions actions={actionItems} isMobile={isMobile} font={font} />
          </CustomCard>
        </div>
      </div>

      <div className="expense-footprints-inner" style={{marginTop: '40px'}}>Expense Activities</div>
      <div className={`expense-activities-grid ${!isMobile ? "expense-activities-grid-desktop" : ""}`}>
        <CustomCardRight isMobile={isMobile}>
            <div style={{display: 'flex', flexDirection: isMobile ? 'column' : 'row'}}>
                <div style={{flex: 1, padding: '10px'}}>
                    <ReportComplainExpense isMobile={isMobile} addAction={addActionItem} />
                </div>
                <div style={{flex: 1, padding: '10px', borderLeft: isMobile ? 'none' : '1px solid #eee'}}>
                    <div className="expense-section-header">Salary Management</div>
                    <SalaryManagement isMobile={isMobile} font={font} addAction={addActionItem} />
                </div>
            </div>
        </CustomCardRight>
        
        <CustomCard title="Miscellaneous" isMobile={isMobile}>
            <RecurringExpenses isMobile={isMobile} font={font} addAction={addActionItem} />
        </CustomCard>
      </div>
    </div>
  );
};

export default AccountantFeesIncome;