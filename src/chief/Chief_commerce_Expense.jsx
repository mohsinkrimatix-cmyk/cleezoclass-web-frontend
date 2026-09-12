import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import axios from "axios";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faRupeeSign, faBookReader,
    faExclamationCircle, faAward, faMoneyCheckAlt, faChartBar, faTimes, faEye, faSync,
    faDownload, faPrint, faShareAlt // ADDED: Download, Print, and Share icons
} from "@fortawesome/free-solid-svg-icons";

// --- CHARTING LIBRARY IMPORTS ---
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import "../STYLES/ActionButtonStyle.css"
import ErrorPopup from "../shared/ErrorPopup";
// =======================================================
// UTILITY FUNCTION
// =======================================================
const isTabletOrLaptop = window.innerWidth <= 1366;

// Function to safely retrieve schoolCode from LocalStorage
const getSchoolCode = () => {
    return localStorage.getItem('schoolCode');
};

// =======================================================
// CHART COMPONENTS (NEW)
// =======================================================

/**
 * Bar Chart for Monthly Expense Report (Comparison)
 */

const handleDownloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      setPopupMessage("No data to download.");
      return;
    }
    
    // Use TAB (\t) as separator for better Excel compatibility
    const SEPARATOR = '\t'; 
  
    // Extract headers and format them (removing camelCase/underscores)
    const headers = Object.keys(data[0]);
    const headerRow = headers.map(header => 
        // Replace camelCase with spaces, replace underscores, and trim
        `"${header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}"`
    ).join(SEPARATOR);
  
    // Convert data rows
    const csvRows = data.map(row => 
      headers.map(header => {
        let value = row[header];
        if (typeof value === 'number') {
          // Ensure numbers are written as raw numbers (without commas) for Excel
          value = String(value);
        } else if (typeof value === 'string') {
          // Remove commas and newlines from strings to prevent breaking the TSV structure
          // Excel will read this better as the separator is a tab
          value = value.replace(/"/g, '""').replace(/,/g, '').replace(/\n/g, ' '); 
        }
        return `"${value}"`;
      }).join(SEPARATOR)
    );
  
    const csvContent = [headerRow, ...csvRows].join('\n');
    
    // Use 'application/vnd.ms-excel' MIME type and .xls extension for better Excel recognition
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.xls`); // Changed to .xls
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
};
const ExpenseBarChart = ({ data }) => {
    // Format the data label: e.g., '2025-08' -> 'Aug 2025'
    const formatXAxis = (tickItem) => {
        const [year, month] = tickItem.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        // Reduced height to 200px to match new layout size
        <ResponsiveContainer width="100%" height={200}>
            <BarChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatXAxis} height={40} style={{ fontSize: '10px' }} />
                <YAxis
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    style={{ fontSize: '10px' }}
                />
                <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Total Expenses']}
                    labelFormatter={formatXAxis}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} layout="horizontal" verticalAlign="top" align="center" />
                <Bar dataKey="totalExpense" fill="#2980B9" name="Total Expenses (INR)" />
            </BarChart>
        </ResponsiveContainer>
    );
};

/**
 * Line Chart for Expense Trend
 */
const ExpenseLineChart = ({ data }) => {
    const formatXAxis = (tickItem) => {
        const [year, month] = tickItem.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short' });
    };

    return (
        // Reduced height to 200px to match new layout size
        <ResponsiveContainer width="100%" height={200}>
            <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatXAxis} height={40} style={{ fontSize: '10px' }} />
                <YAxis
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    style={{ fontSize: '10px' }}
                />
                <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Total Expenses']}
                    labelFormatter={formatXAxis}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} layout="horizontal" verticalAlign="top" align="center" />
                <Line
                    type="monotone"
                    dataKey="totalExpense"
                    stroke="#e74c3c"
                    activeDot={{ r: 8 }}
                    name="Expense Trend"
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

// =======================================================
// SALARY LEDGER POPUP COMPONENT (NEW)
// =======================================================
const SalaryLedgerPopup = ({
    isOpen, onClose, salaryExpensesData,
    fromDate, toDate, handleSalaryDateFilter, clearSalaryDateFilter
}) => {
    if (!isOpen) return null;
 const popupStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backdropFilter: "blur(5px)",
  WebkitBackdropFilter: "blur(5px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px",
  zIndex: 2000,
};



const contentStyle = {
  width: "90vw",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  borderRadius: "8px",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
};


  const headerStyleDe = {
    padding: "10px 12px",
    border: "1px solid #ddd",
    background: "#0A4D82",
    color: "#fff",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontSize: "12px",
  };

    const cellStyleDe = {
        padding: '8px 12px', border: '1px solid #ddd', textAlign: 'left',
        whiteSpace: 'nowrap', fontSize: '12px'
    };
    const tableStylee = {
        width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed',
    };
    const colWidths = [
        '8%',   '15%', '30%', '15%', '17%', '15%',
    ];

    const totalSalaryAmount = Array.isArray(salaryExpensesData)
        ? salaryExpensesData.reduce((sum, item) => sum + ((item && item.final_salary) || 0), 0)
        : 0;

    const actionBtnContainerStyle = {
        display: "flex", justifyContent: "flex-end", gap: "10px", marginBottom: "15px"
    };

        return createPortal(
        <div style={popupStyle} onClick={onClose}>

  <div
    style={contentStyle}
    className="popup-printable"
    onClick={(e) => e.stopPropagation()}
  >

                {/* Close Button */}
                

               <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: "10px",
  }}
>
  <div />

 <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  Salary Ledger
</h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-24px)"
    }}
    className="no-print"
  >
    <button className="actionBtnStyle" onClick={() => handleDownloadCSV(salaryExpensesData, 'Salary_Ledger')}>
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button className="actionBtnStyle" onClick={() => window.print()}>
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button className="actionBtnStyle" onClick={() => {
      if (navigator.share) {
        navigator.share({
          title: "Salary Ledger Report",
          text: "Check out this salary ledger report.",
          url: window.location.href,
        }).catch(console.error);
      } else {
        setPopupMessage("Web Share API not supported on this browser.");
      }
    }}>
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button className="actionBtnStyle" onClick={onClose}>
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>

                {/* Data Table */}
                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    <table style={tableStylee}>
                        <colgroup>
                            {colWidths.map((width, i) => <col key={i} style={{ width }} />)}
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0 }}>#</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0 }}>Payment Date</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0 }}>Teacher</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0 }}>Salary Month</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0 }}>Amount</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salaryExpensesData && salaryExpensesData.length > 0 ? (
                                salaryExpensesData.map((data, index) => (
                                    <tr key={data.salary_id || index} style={{ backgroundColor: index % 2 === 0 ? "#fafafa" : "#f1f6fa" }}>
                                        <td style={cellStyleDe}>{index + 1}</td>
                                        <td style={cellStyleDe}>{new Date(data.payment_date).toLocaleDateString('en-IN')}</td>
                                        <td style={cellStyleDe}>{data.teacher_name || `ID: ${data.teacher_id}`}</td>
                                        <td style={cellStyleDe}>{data.salary_month}</td>
                                        <td style={cellStyleDe}>₹{Number(data.final_salary).toFixed(2)}</td>
                                        <td style={cellStyleDe}>{data.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ ...cellStyleDe, textAlign: 'center' }}>No salary records found.</td>
                                </tr>
                            )}

                            {salaryExpensesData && salaryExpensesData.length > 0 && (
                                <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold', position: 'sticky', bottom: 0 }}>
                                    <td style={cellStyleDe} colSpan={4}>Total Paid Salary</td>
                                    <td style={cellStyleDe}>
                                        ₹{totalSalaryAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td style={cellStyleDe}></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Print-specific CSS */}
                <style>
                    {`
                        @media print {
                            body * { visibility: hidden; }
                            .popup-printable, .popup-printable * { visibility: visible; }
                            .popup-printable {
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                background: #fff !important;
                                box-shadow: none !important;
                            }
                            .no-print { display: none !important; }
                        }
                    `}
                </style>
                       </div>
        </div>,
        document.body
    );

};


// =======================================================
// UTILITIES LEDGER POPUP COMPONENT (NEW)
// =======================================================
const UtilitiesLedgerPopup = ({
    isOpen, onClose, utilitiesExpensesData, originalUtilitiesExpensesData,
    fromDate, setFromDate, toDate, setToDate,
    handleUtilitiesDateFilter, clearUtilitiesDateFilter,
    openImageModal
}) => {
    if (!isOpen) return null;

    const actionBtnContainerStyle = {
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        marginBottom: "15px"
    };

    const actionBtnStyle = {
        padding: "2px",
        background: "transparent",
        color: "#333",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 'small',
        display: "flex",
        alignItems: "center",
    };

 const popupStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backdropFilter: "blur(5px)",
  WebkitBackdropFilter: "blur(5px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px",
  zIndex: 2000,
};

const contentStyle = {
  width: "90vw",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  borderRadius: "8px",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0,0,0,0) transparent",
};


const headerStyleDe = {
    padding: "10px 12px",
    border: "1px solid #ddd",
    background: "#0A4D82",
    color: "#fff",
    textAlign: "left",
    whiteSpace: "nowrap",
    fontSize: "12px",
};
const cellStyleDe = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  textAlign: "left",
  fontSize: "12px",

  /* FIX */
  whiteSpace: "normal",
  wordBreak: "break-word",
  overflowWrap: "break-word",
};

const tableStylee = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "auto", // 🔥 change from fixed → auto
};


const colWidths = [
  "6%",   // Bill
  "9%",   // Date
  "10%",  // Type
  "30%",  // Description 🔥
  "10%",  // Mode
  "10%",  // Total
  "10%",  // Paid
  "10%",  // Balance
  "5%",   // Action
];

    const totalPrice = utilitiesExpensesData?.reduce(
        (sum, item) => sum + (Number(item?.price) || 0), 0
    );

    const totalPaid = utilitiesExpensesData?.reduce(
        (sum, item) => sum + (Number(item?.paid_amount) || 0), 0
    );

    const totalBalance = utilitiesExpensesData?.reduce(
        (sum, item) => sum + (Number(item?.balance_amount) || 0), 0
    );

      return createPortal(
        <>

            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }
                                                .popup-printable,
                        .popup-printable * {
                            visibility: visible !important;
                            background: #fff !important;
                            box-shadow: none !important;
                        }
                        .popup-printable {
                            position: absolute !important;
                            top: -130px !important;
                            left: 0 !important;
                            width: 210mm !important;
                            min-height: 297mm !important;
                            padding: 10mm !important;
                            background: #fff !important;
                            box-shadow: none !important;
                        }

                        .no-print {
                            display: none !important;
                        }
                        table {
                            width: 100% !important;
                            font-size: 10pt !important;
                            table-layout: fixed !important;
                            page-break-inside: auto !important;
                        }
                        thead {
                            display: table-header-group !important;
                        }
                        tbody {
                            display: table-row-group;
                        }
                        tr {
                            page-break-inside: avoid !important;
                            page-break-after: auto !important;
                        }
                        th, td {
                            white-space: normal !important;
                            word-break: break-word !important;
                            padding: 8px !important;
                            font-size: 10pt !important;
                        }
                        @page {
                            size: A4;
                            margin: 10mm;
                        }
                    }
                `}
            </style>

           <div style={popupStyle} onClick={onClose}>
  <div
    style={contentStyle}
    className="popup-printable"
    onClick={(e) => e.stopPropagation()}
  >

                   <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: "10px",
  }}
>
  <div />

<h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  Utilities Expense Ledger (Maintenance & Accommodation)
</h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-24px)"
    }}
    className="no-print"
  >
    <button
      className="actionBtnStyle"
      onClick={() => handleDownloadCSV(utilitiesExpensesData, 'Utilities_Expense_Ledger')}
    >
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button
      className="actionBtnStyle"
      onClick={() => window.print()}
    >
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button
      className="actionBtnStyle"
      onClick={() => {
        if (navigator.share) {
          navigator.share({
            title: "Utilities Expense Ledger",
            text: "Check out this utilities expense ledger report.",
            url: window.location.href,
          }).catch(console.error);
        } else {
          alert("Web Share API not supported on this browser.");
        }
      }}
    >
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button
      className="actionBtnStyle"
      onClick={onClose}
    >
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>

                 <div style={{
    margin: '-15px 0',
paddingBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    whiteSpace: 'nowrap',
    borderBottom: '1px solid #eee',
    
}}>
                        <label style={{ fontWeight: "bold", fontSize: '14px' }}>
                            From:
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                style={{
                                    padding: "6px",
                                    borderRadius: "4px",
                                    border: "1px solid #888",
                                    marginLeft: '5px',
                                    fontSize: "14px"
                                }}
                            />
                        </label>

                        <label style={{ fontWeight: "bold", fontSize: '14px' }}>
                            To:
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                style={{
                                    padding: "6px",
                                    borderRadius: "4px",
                                    border: "1px solid #888",
                                    marginLeft: '5px',
                                    fontSize: "14px"
                                }}
                            />
                        </label>

                        <button
                            onClick={handleUtilitiesDateFilter}
                            style={{
                                padding: "6px 12px",
                                borderRadius: "4px",
                                border: "none",
                                backgroundColor: "#2980B9",
                                color: "white",
                                marginBottom:20,
                                cursor: "pointer",
                                fontSize: "14px",
                                fontWeight: 'bold',

                                
                            }}
                        >
                            Filter
                        </button>

                        <button
                            onClick={clearUtilitiesDateFilter}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid #ccc',
                                backgroundColor: '#f0f0f0',
                                color: '#333',
                                marginBottom:20,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Reset
                        </button>
                    </div>

                    <div>
                        <table style={tableStylee}>
                            <colgroup>
                                {colWidths.map((width, i) => (
                                    <col key={i} style={{ width }} />
                                ))}
                            </colgroup>

                            <thead>
                                <tr>
                                    <th style={headerStyleDe}>Bill No.</th>
                                    <th style={headerStyleDe}>Date</th>
                                    <th style={headerStyleDe}>Type</th>
                                    <th style={headerStyleDe}>Expense Name</th>
                                    <th style={headerStyleDe}>Mode</th>
                                    <th style={headerStyleDe}>Total Amt</th>
                                    <th style={headerStyleDe}>Paid Amt</th>
                                    <th style={headerStyleDe}>Balance</th>
                                </tr>
                            </thead>

                            <tbody>
                                {utilitiesExpensesData && utilitiesExpensesData.length > 0 ? (
                                    utilitiesExpensesData.map((data, index) => (
                                        <tr
                                            key={data.id || index}
                                            style={{ backgroundColor: index % 2 === 0 ? "#fafafa" : "#f1f6fa" }}
                                        >
                                            <td style={cellStyleDe}>{index + 1}</td>
                                            <td style={cellStyleDe}>
                                                {new Date(data.expense_date).toLocaleDateString('en-IN')}
                                            </td>
                                            <td style={cellStyleDe}>{data.expense_type}</td>
                                            <td style={cellStyleDe}>{data.expense_name || "N/A"}</td>
                                            <td style={cellStyleDe}>{data.payment_mode || "-"}</td>
                                            <td style={cellStyleDe}>₹{Number(data.price).toFixed(2)}</td>
                                            <td style={cellStyleDe}>₹{Number(data.paid_amount).toFixed(2)}</td>
                                            <td style={cellStyleDe}>₹{Number(data.balance_amount).toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} style={{ ...cellStyleDe, textAlign: 'center' }}>
                                            No utility expense records found.
                                        </td>
                                    </tr>
                                )}

                                {utilitiesExpensesData?.length > 0 && (
                                    <tr
                                        style={{
                                            backgroundColor: '#e8f5e9',
                                            fontWeight: 'bold',
                                            position: 'sticky',
                                            bottom: 0,
                                            zIndex: 5
                                        }}
                                    >
                                        <td style={cellStyleDe} colSpan={5}>Total</td>
                                        <td style={cellStyleDe}>
                                            ₹{totalPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={cellStyleDe}>
                                            ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={cellStyleDe}>
                                            ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
                </>,
        document.body
    );

};


// =======================================================
// EXPENSE LEDGER POPUP COMPONENT (EXISTING)
// =======================================================
const ExpenseLedgerPopup = ({
  isOpen,
  onClose,
  userExpensesData,
  originalUserExpensesData,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  handleExpenseDateFilter,
  clearExpenseDateFilter,
  dynamicSchoolCode,
  dynamicLogoSrc,
  openImageModal,
}) => {
  if (!isOpen) return null;

const popupStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backdropFilter: "blur(5px)",
  WebkitBackdropFilter: "blur(5px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px",
  zIndex: 2000,
};

const contentStyle = {
  width: "90vw",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#fff",
  borderRadius: "8px",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
};


const headerStyleDe = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  background: "#0A4D82",
  color: "#fff",
  textAlign: "left",
  whiteSpace: "nowrap",
  fontSize: "14px",
};

const cellStyleDe = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  textAlign: "left",
  fontSize: "12px",

  /* FIX */
  whiteSpace: "normal",
  wordBreak: "break-word",
  overflowWrap: "break-word",
};

const tableStylee = {
  width: "100%",
  borderCollapse: "collapse",
  tableLayout: "auto", // 🔥 change from fixed → auto
};


const colWidths = [
  "6%",   // Bill
  "9%",   // Date
  "10%",  // Type
  "30%",  // Description 🔥
  "10%",  // Mode
  "10%",  // Total
  "10%",  // Paid
  "10%",  // Balance
  "5%",   // Action
];


  const totalExpenseAmount = Array.isArray(userExpensesData)
    ? userExpensesData.reduce((sum, item) => sum + ((item && item.price) || 0), 0)
    : 0;

  const totalFinalExpenseAmount = Array.isArray(userExpensesData)
    ? userExpensesData.reduce((sum, item) => sum + ((item && item.balance_amount) || 0), 0)
    : 0;

  const actionBtnContainerStyle = {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginBottom: "15px",
    marginRight: "20px",
  };

   return createPortal(
    <>

      {/* Print CSS */}
     <style>
{`
  @media print {

    /* Hide entire app except popup */
    body * {
      visibility: hidden !important;
    }

        .popup-printable, 
    .popup-printable * {
      visibility: visible !important;
    }

    /* Remove dark background overlay */
    .popup-printable {
      background: #fff !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 210mm !important;   /* A4 width */
      min-height: 297mm !important; /* A4 height */
      padding: 10mm !important;
      box-shadow: none !important;
    }

    /* Remove inner container background issues */
    .popup-printable > div {
      background: #fff !important;
    }


    /* Hide action buttons */
    .no-print {
      display: none !important;
    }

    /* Fix table overflow */
    table {
      width: 100% !important;
      font-size: 10pt !important;
      table-layout: fixed !important;
    }

    th, td {
      white-space: normal !important;
      word-break: break-word !important;
    }

    tr {
      page-break-inside: avoid !important;
    }

    /* Remove sticky headers in print */
    th {
      position: static !important;
    }
  }
`}
</style>


      <div style={popupStyle} onClick={onClose}>
  <div
    style={contentStyle}
    className="popup-printable"
    onClick={(e) => e.stopPropagation()}
  >


          <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "flex-start",
    width: "100%",
    marginBottom: "10px",
    paddingRight: "20px"
  }}
>
  <div />

  <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>
  Expense Ledger
</h2>

  <div
    style={{
      justifySelf: "end",
      display: "flex",
      gap: "10px",
      alignItems: "center",
      transform: "translateY(-24px)"
    }}
    className="no-print"
  >
    <button className="actionBtnStyle" onClick={() => handleDownloadCSV(userExpensesData, 'General_Expense_Ledger')}>
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button className="actionBtnStyle" onClick={() => window.print()}>
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button className="actionBtnStyle" onClick={() => {
      if (navigator.share) {
        navigator.share({
          title: "General Expense Ledger",
          text: "Check out this general expense ledger report.",
          url: window.location.href,
        }).catch(console.error);
      } else {
        setPopupMessage("Web Share API not supported on this browser.");
      }
    }}>
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button className="actionBtnStyle" onClick={onClose}>
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>

          {/* Filter Section */}
          <div style={{ margin: '-15px 0', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
            <label style={{ fontWeight: "bold", fontSize: '14px' }}>
              From:
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: "6px", borderRadius: "4px", border: "1px solid #888", marginLeft: '5px', fontSize: "14px" }}
              />
            </label>
            <label style={{ fontWeight: "bold", fontSize: '14px' }}>
              To:
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: "6px", borderRadius: "4px", border: "1px solid #888", marginLeft: '5px', fontSize: "14px" }}
              />
            </label>

            <button
              onClick={handleExpenseDateFilter}
              style={{
                padding: "6px 12px", borderRadius: "4px", border: "none",
                backgroundColor: "#2980B9", color: "white", marginBottom:20, cursor: "pointer", fontSize: "14px", fontWeight: 'bold'
              }}
            >
              Filter
            </button>
            <button
              onClick={clearExpenseDateFilter}
              style={{
                padding: '6px 12px', border: '1px solid #ccc', marginBottom:20, backgroundColor: '#f0f0f0',
                color: '#333', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
              }}
            >
              Reset
            </button>
          </div>

          {/* Data Table */}
          <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <table style={tableStylee}>
              <colgroup>
                {colWidths.map((width, i) => (
                  <col key={i} style={{ width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Bill No.</th>
                  <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Date</th>
                  <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Type</th>
                  <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Description</th>
                  <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Mode</th>
                  <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Total Amt</th>
                  <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Paid Amt</th>
                  <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Balance</th>
                  <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {userExpensesData && userExpensesData.length > 0 ? (
                  userExpensesData.map((data, index) => (
                    <tr key={data.id || index} style={{ backgroundColor: index % 2 === 0 ? "#fafafa" : "#f1f6fa" }}>
                      <td style={cellStyleDe}>{index + 1}</td>
                      <td style={cellStyleDe}>{new Date(data.expense_date).toLocaleDateString('en-IN')}</td>
                      <td style={cellStyleDe}>{data.expense_type}</td>
                      <td style={cellStyleDe}>{data.description ? data.description : "N/A"}</td>
                      <td style={cellStyleDe}>{data.payment_mode ? data.payment_mode : "-"}</td>
                      <td style={cellStyleDe}>₹{data.price ? Number(data.price).toFixed(2) : '0.00'}</td>
                      <td style={cellStyleDe}>₹{data.paid_amount ? Number(data.paid_amount).toFixed(2) : '0.00'}</td>
                      <td style={cellStyleDe}>₹{data.balance_amount ? Number(data.balance_amount).toFixed(2) : '0.00'}</td>
                      <td style={cellStyleDe}>
                        {data.isUploadedBill && data.imageUrl && (
                          <button
                            onClick={() => openImageModal(data.imageUrl)}
                            style={{
                              backgroundColor: '#3b82f6', color: 'white', border: 'none',
                              padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                            }}
                          >
                            <FontAwesomeIcon icon={faEye} style={{ marginRight: '4px' }} /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ ...cellStyleDe, textAlign: 'center' }}>No expense records found.</td>
                  </tr>
                )}

                {/* Total Row */}
                {userExpensesData && userExpensesData.length > 0 && (
                  <tr
                    style={{
                      backgroundColor: '#e8f5e9', fontWeight: 'bold',
                      position: 'sticky', bottom: 0, zIndex: 5,
                    }}
                  >
                    <td style={cellStyleDe} colSpan={4}>Total</td>
                    <td style={cellStyleDe}></td>
                    <td style={cellStyleDe}>
                      ₹{totalExpenseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={cellStyleDe}></td>
                    <td style={cellStyleDe}>
                      ₹{totalFinalExpenseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={cellStyleDe}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
       </>,
    document.body
  );

};

// =======================================================
// MAIN COMPONENT
// =======================================================
export default function ExpenseChief() {
    // ------------------------------
    // COMMON STYLES
    // ------------------------------
    const outerContainer = {
        width: "65vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start", // keep content at top so page can scroll naturally
        background: "transparent",
        // Allow the page to scroll on small viewports
            overflowY: 'auto',
            height: '80vh',
            padding: "0",
            justifyContent: 'flex-start', // remove centering so full width can be used
        boxSizing: "border-box",
        
    };

    const innerContainer = {
        width: "95vw", // occupy entire outer container
        maxWidth: "1000px",
        display: "flex",
        background: "#fff",
        flexDirection: "column",
        // allow the inner content to scroll if it becomes tall (keeps header/cards accessible)
        overflowY: 'auto',
        maxHeight: '70vh',
        scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
    };
    const headingStyle = {
    position: "absolute", 
    top: "15px", // Keeps it at the top as before
    left: "5px", // Small margin left (adjust as needed)
    fontSize: "16px", // Font size 16px
    fontWeight: "800", // Font weight 800
    color: "#2F2E2EFF", // Text color (adjusted to match your specified color)
    textAlign: "left", // Aligns text to the left
    width: "auto", // Makes the width based on text content
    marginLeft: "2%",
      scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', 
};
  const topRowContainer = { display: "flex", gap: "10px", marginBottom: "10px" };
    // Use a 3:2 ratio for left/right columns regardless of content
    const leftColumn = { flex: 3, display: "flex", border: "1px solid #ccc", borderRadius: "4px", flexDirection: "column", gap: "10px" };
    const rightColumn = { flex: 2, display: "flex", flexDirection: "column", gap: "10px" };
  const bottomRowContainer = { width: "100%", display: "flex",border: "1px solid #ccc",borderRadius: "4px", flexDirection: "column", gap: "10px" };
  const card = {
    background: "#fff", padding: "10px", boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",border: "1px solid #ccc",borderRadius: "4px",
    flex: 1, display: "flex", flexDirection: "column",
  };
  const cardLarge = {
    background: "#fff", padding: "10px", borderRadius: "8px", boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
    flex: 1, display: "flex", flexDirection: "column",
  };
  const boxStyle = {
    flex: 1, padding: "8px", borderRight: "1px solid #ccc", 
    textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "space-between", height: "160px", margin: "0 2px",
  };
    const iconStyle = { 
  fontSize: "30px", 
  color: "#4e4848ff", 
  background: "transparent", 
  borderRadius: "50%", 
  border: "1px solid #0f0c0cff", 
  padding: "5px",
  display: "flex",          // Ensure the icon is flex
  justifyContent: "flex-start", // Aligns to the left side of the container
  alignItems: "center",
  width:'30px',
  height:'30px'     // Vertically center the icon
};    // Vertically center the icon
  const btnStyle = {
        padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer",
        background: "transparent", color: "#3498db", fontSize: "11px", marginTop: "5px",
        width:"auto"
    };
 const btnStylebottom = {
        padding: "4px 8px", borderRadius: "4px",  cursor: "pointer",
        background: "transparent", color: "#3498db", border: "1px solid #3498db", fontSize: "11px", marginTop: "5px",
        width:"auto"
    };

    // ----

    // ------------------------------
    // STATE & DATA FETCHING
    // ------------------------------

    // UNIFIED MONTH STATE (Kept for the Month Selector)
    const [selectedMonth, setSelectedMonth] = useState("2025-08"); // Set default month for salaries

    // *** EXPENSE TOTALS STATE ***
    const [totals, setTotals] = useState({
        totalPaid: 0,
        totalBalance: 0,
        totalPrice: 0, // This is the value for "Total Expenses (Price)"
        loading: true,
        error: null
    });
  const [popupMessage, setPopupMessage] = useState("");

    // *** SALARY TOTALS STATE ***
    const [salaryTotals, setSalaryTotals] = useState({
        totalPaidSalary: 0,
        loading: true,
        error: null
    });

    // *** UTILITIES TOTALS STATE (NEW) ***
    const [utilitiesTotals, setUtilitiesTotals] = useState({
        totalAmount: 0,
        loading: true,
        error: null
    });

    // 🚀 NEW STATE: Chart Data
    const [chartData, setChartData] = useState([]);
    const [chartLoading, setChartLoading] = useState(true);

    // This state holds the full ledger data for the popup to use.
    const [salaryExpensesData, setSalaryExpensesData] = useState([]);

    // --- Ledger States ---
    const [isLedgerOpenForExpense, setIsLedgerOpenForExpense] = useState(false);
    const [userExpensesData, setUserExpensesData] = useState([]);
    const [originalUserExpensesData, setOriginalUserExpensesData] = useState(null);
    const [fromDate, setFromDate] = useState("2025-07-21"); // Initial filter dates
    const [toDate, setToDate] = useState("2025-08-21");

    // --- Salary Ledger States (NEW) ---
    const [isSalaryLedgerOpen, setIsSalaryLedgerOpen] = useState(false);
    const [originalSalaryExpensesData, setOriginalSalaryExpensesData] = useState(null);

    // --- UTILITIES LEDGER STATES (NEW) ---
    const [isLedgerOpenForUtilities, setIsLedgerOpenForUtilities] = useState(false);
    const [utilitiesExpensesData, setUtilitiesExpensesData] = useState([]);
    const [originalUtilitiesExpensesData, setOriginalUtilitiesExpensesData] = useState(null);


    // --- Other Dynamic States ---
    const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
    const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
function generateMonthsRange(pastYears = 5, futureYears = 5) {
  const months = [];
  const currentYear = new Date().getFullYear();

  for (let year = currentYear - pastYears; year <= currentYear + futureYears; year++) {
    for (let month = 1; month <= 12; month++) {
      const formattedMonth = String(month).padStart(2, "0");
      months.push(`${year}-${formattedMonth}`);
    }
  }

  return months;
}

const months = generateMonthsRange(5, 5);


    // Helper for displaying currency
    const formatCurrency = (amount, isSalary = false, isUtility = false) => {
        let state;
        if (isSalary) {
            state = salaryTotals;
        } else if (isUtility) {
            state = utilitiesTotals;
        } else {
            state = totals;
        }

        if (state.loading) return 'Loading...';
        if (state.error) return `Error: ${state.error}`;

        // Ensure amount is a number before formatting
        const numericAmount = parseFloat(amount) || 0;
        return numericAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    };

    // Placeholder function for an image modal (required by Expense Ledger)
    const openImageModal = (imageUrl) => {
        // Implement logic to show the bill image in a modal/new tab
        window.open(imageUrl, '_blank');
    };


    // =======================================================
    // FETCHING LOGIC
    // =======================================================

    // --- Totals Fetch (Existing) ---
    const fetchTotals = async () => {
        setTotals(prev => ({ ...prev, loading: true, error: null }));
        const schoolCodeToUse = getSchoolCode();

        if (!schoolCodeToUse) {
            setTotals(prev => ({
                ...prev,
                loading: false,
                error: "School Code not found in LocalStorage"
            }));
            console.error("fetchTotals failed: schoolCode is null.");
            return;
        }

        try {
            // NOTE: Using a placeholder API endpoint as the original only fetched 'totals'
            const response = await axios.get(`https://cleezoclass.com:4000/api/totals?schoolCode=${schoolCodeToUse}`);

            const data = response.data;
            setTotals({
                totalPaid: parseFloat(data.totals.paid) || 0,
                totalBalance: parseFloat(data.totals.balance) || 0,
                totalPrice: parseFloat(data.totals.price) || 0,
                loading: false,
                error: null
            });
        } catch (err) {
            console.error("Error fetching Expense Totals:", err);
            setTotals(prev => ({
                ...prev,
                loading: false,
                error: err.message.includes('Network') ? 'Network Error' : 'API Error'
            }));
        }
    };


    // --- Salary Totals Fetch (Existing) ---
    const fetchAndCalculateSalaryTotals = async (monthYear) => {
        setSalaryTotals(prev => ({ ...prev, loading: true, error: null }));
        const schoolCode = localStorage.getItem("schoolCode");

        if (!schoolCode || !monthYear) {
            setSalaryTotals({ totalPaidSalary: 0, loading: false, error: "Missing required info." });
            return;
        }

        try {
            // Fetch the full salary ledger data list
            const response = await axios.get(`https://cleezoclass.com:4000/api/salaryLedger?schoolCode=${schoolCode}`);
            const rawData = response.data || [];

            // Example data transformation (as used in handleSalarySearch)
            const transformedData = rawData.map(item => ({
                ...item,
                final_salary: Number(item.final_salary) || 0,
                teacher_name: item.teacher_name || `Teacher ID: ${item.teacher_id}`
            }));

            // Cache the full data for the Ledger Popup
            setOriginalSalaryExpensesData(transformedData);

            // 1. Filter the data by the selectedMonth (e.g., '2025-08') using payment_date
            const filteredData = transformedData.filter(item => {
                if (!item.payment_date) return false;

                // Format the payment_date to YYYY-MM for comparison with selectedMonth
                const paymentDate = new Date(item.payment_date);
                if (isNaN(paymentDate.getTime())) return false;

                const itemMonth = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
                // MonthYear format example: '2025-08'
                return itemMonth === monthYear;
            });

            // 2. Calculate the total from the filtered data (sum of final_salary)
            const calculatedTotal = filteredData.reduce((sum, item) => sum + (Number(item.final_salary) || 0), 0);

            // 3. Update the total in the main component state
            setSalaryTotals({
                totalPaidSalary: calculatedTotal,
                loading: false,
                error: null
            });

        } catch (error) {
            console.error('Error fetching and calculating salary total:', error);
            setSalaryTotals(prev => ({
                ...prev,
                loading: false,
                error: error.message.includes('Network') ? 'Network Error' : 'API Error'
            }));
            setOriginalSalaryExpensesData([]);
        }
    };

    // --- Utilities Totals Fetch (Existing) ---
    const fetchAndCalculateUtilitiesTotals = async (monthYear) => {
        setUtilitiesTotals(prev => ({ ...prev, loading: true, error: null }));
        const schoolCode = localStorage.getItem("schoolCode");

        if (!schoolCode || !monthYear) {
            setUtilitiesTotals({ totalAmount: 0, loading: false, error: "Missing required info." });
            return;
        }

        try {
            // Fetch the full general expenses ledger data
            const response = await axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
            const rawExpensesData = response.data || [];

            // 1. Filter by expense_type: Assuming 'maintenance' and 'accommodation' represent 'Utilities'
            // We use 'price' for the total cost calculation.
            const utilitiesData = rawExpensesData.filter(item =>
                item.expense_type && (
                    item.expense_type.toLowerCase() === 'maintenance' ||
                    item.expense_type.toLowerCase() === 'accommodation'
                )
            );

            // 2. Filter the utilities data by the selectedMonth using expense_date
            const filteredData = utilitiesData.filter(item => {
                if (!item.expense_date) return false;

                const expenseDate = new Date(item.expense_date);
                if (isNaN(expenseDate.getTime())) return false;

                const itemMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
                return itemMonth === monthYear;
            });

            // 3. Calculate the total from the filtered data (sum of price)
            const calculatedTotal = filteredData.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

            // 4. Update the total in the state
            setUtilitiesTotals({
                totalAmount: calculatedTotal,
                loading: false,
                error: null
            });

        } catch (error) {
            console.error('Error fetching and calculating utilities total:', error);
            setUtilitiesTotals(prev => ({
                ...prev,
                loading: false,
                error: error.message.includes('Network') ? 'Network Error' : 'API Error'
            }));
        }
    };

    // 🚀 NEW FUNCTION: Fetch Data for Charts
    const fetchChartData = async () => {
        setChartLoading(true);
        const schoolCode = getSchoolCode();
        if (!schoolCode) {
            setChartLoading(false);
            console.error("School Code not found for chart data.");
            return;
        }

        try {
            // --- 1. Fetch Expenses (including utility types) ---
            const expensesResponse = await axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
            const rawExpensesData = expensesResponse.data || [];

            // --- 2. Fetch Salaries ---
            const salaryResponse = await axios.get(`https://cleezoclass.com:4000/api/salaryLedger?schoolCode=${schoolCode}`);
            const rawSalaryData = salaryResponse.data || [];

            // --- 3. Consolidate and Group by Month (last 6 months logic) ---
            const monthlyTotals = {};
            const now = new Date();
            const lastSixMonths = [];
            for (let i = 0; i < 6; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                lastSixMonths.unshift(monthKey); // Add to the front to get ascending order
                monthlyTotals[monthKey] = { totalExpense: 0 };
            }

            // Process regular expenses (using price)
            rawExpensesData.forEach(item => {
                if (item.expense_date) {
                    const date = new Date(item.expense_date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyTotals[monthKey]) {
                        monthlyTotals[monthKey].totalExpense += (Number(item.price) || 0);
                    }
                }
            });

            // Process salaries (using final_salary)
            rawSalaryData.forEach(item => {
                if (item.payment_date) {
                    const date = new Date(item.payment_date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyTotals[monthKey]) {
                        monthlyTotals[monthKey].totalExpense += (Number(item.final_salary) || 0);
                    }
                }
            });

            // Convert map to array structure for recharts
            const finalChartData = lastSixMonths.map(month => ({
                month: month,
                totalExpense: monthlyTotals[month].totalExpense
            }));

            setChartData(finalChartData);
        } catch (error) {
            console.error('Error fetching chart data:', error);
        } finally {
            setChartLoading(false);
        }
    };


    const handleRefresh = () => {
        fetchTotals();
        fetchAndCalculateSalaryTotals(selectedMonth);
        fetchAndCalculateUtilitiesTotals(selectedMonth);
        fetchChartData(); // 🚀 Refresh chart data too
    };


    // =======================================================
    // useEffect HOOKS
    // =======================================================

    // 1. Fetch 'totals' data and chart data on initial component mount
    useEffect(() => {
        fetchTotals();
        fetchChartData(); // 🚀 NEW CALL for charts
    }, []);

    // 2. Fetch School Logo and Code on mount (Existing)
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
                }
            } catch (error) {
                console.error('Error fetching school logo:', error.response?.data || error.message);
            }
        };
        fetchSchoolLogo();
    }, []);

    // 3. Fetch Salary and Utilities totals when selectedMonth changes (Existing)
    useEffect(() => {
        if (selectedMonth) {
            fetchAndCalculateSalaryTotals(selectedMonth);
            fetchAndCalculateUtilitiesTotals(selectedMonth); // 🚀 NEW CALL
        }
    }, [selectedMonth]);


    // ------------------------------
    // HANDLERS (Unchanged, for brevity in comments)
    // ------------------------------

    // Expense Ledger Filter Handlers (Existing)
    const clearExpenseDateFilter = () => {
        setUserExpensesData(originalUserExpensesData);
        // Resetting to default placeholder dates (or today's date minus a month if required)
        setFromDate("2025-07-21");
        setToDate("2025-08-21");
    };

    const handleExpenseDateFilter = () => {
        if (!fromDate || !toDate) {
            setPopupMessage("Please select both a 'From' and 'To' date.");
            return;
        }
        const start = new Date(fromDate);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        if (originalUserExpensesData) {
            const filteredData = originalUserExpensesData.filter(expense => {
                const expenseDate = new Date(expense.expense_date);
                return !isNaN(expenseDate.getTime()) && expenseDate >= start && expenseDate <= end;
            });
            setUserExpensesData(filteredData);
        }
    };


    // Main Expense Ledger Fetch Handler (Called by 'View Ledger' button - Existing)
    const handleSearch = async () => {
        const schoolCode = localStorage.getItem("schoolCode");
        if (!schoolCode) {
            console.error("School code not found.");
            setPopupMessage("School Code not found. Cannot load ledger.");
            return;
        }

        setIsLedgerOpenForExpense(true); // Open popup immediately to show loading state
        setUserExpensesData([]); // Clear previous data
        setOriginalUserExpensesData([]);

        try {
            // --- 1. Fetch both datasets in parallel ---
            const expensesPromise = axios.get(`https://cleezoclass.com:4000/totalexpensesData?schoolCode=${schoolCode}`);
            const billsPromise = fetch("https://cleezoclass.com:4000/getAllBills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schoolCode })
            });

            const [expensesResponse, billsResponse] = await Promise.all([expensesPromise, billsPromise]);

            // --- 2. Process regular expenses ---
            const expensesData = expensesResponse.data || [];

            // --- 3. Process and transform uploaded bills ---
            let uploadedBillsData = [];
            if (billsResponse.ok) {
                const rawBills = await billsResponse.json();
                uploadedBillsData = rawBills.map(bill => ({
                    id: bill.id || `bill_${Math.random()}`,
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
            } else {
                console.error("Failed to fetch uploaded bills");
            }

            // --- 4. Merge the two datasets ---
            const mergedData = [...expensesData, ...uploadedBillsData];

            // Sort by date, with newest first
            mergedData.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

            setUserExpensesData(mergedData);
            setOriginalUserExpensesData(mergedData);

        } catch (error) {
            console.error('Error fetching combined expenses data:', error);
            setUserExpensesData([]);
            setOriginalUserExpensesData([]);
        }
    };

    // Main Salary Ledger Fetch Handler (UPDATED to ensure consistency)
    const handleSalarySearch = async () => {
        const schoolCode = localStorage.getItem("schoolCode");
        if (!schoolCode) {
            console.error("School code not found.");
            setPopupMessage("School Code not found. Cannot load salary ledger.");
            return;
        }

        setIsSalaryLedgerOpen(true); // Open popup immediately

        // If the full data is already cached from fetchAndCalculateSalaryTotals, use it immediately
        if (originalSalaryExpensesData && originalSalaryExpensesData.length > 0) {
            // For the ledger, we show ALL data, not just the selected month's data
            setSalaryExpensesData(originalSalaryExpensesData);
            return;
        }

        // If not cached, fetch the data
        try {
            const response = await axios.get(`https://cleezoclass.com:4000/api/salaryLedger?schoolCode=${schoolCode}`);
            const rawData = response.data || [];

            const transformedData = rawData.map(item => ({
                ...item,
                final_salary: Number(item.final_salary) || 0,
                teacher_name: item.teacher_name || `Teacher ID: ${item.teacher_id}`
            }));

            // Sort by payment date, newest first
            transformedData.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

            setSalaryExpensesData(transformedData);
            setOriginalSalaryExpensesData(transformedData);

            // Re-calculate and update the dashboard total using this fresh data
            const currentMonthTotal = transformedData
                .filter(item => {
                    const paymentDate = new Date(item.payment_date);
                    const itemMonth = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
                    return itemMonth === selectedMonth;
                })
                .reduce((sum, item) => sum + (Number(item.final_salary) || 0), 0);

            setSalaryTotals({
                totalPaidSalary: currentMonthTotal,
                loading: false,
                error: null
            });


        } catch (error) {
            console.error('Error fetching salary ledger data:', error);
            setSalaryExpensesData([]);
            setOriginalSalaryExpensesData([]);
        }
    };

    // Salary Ledger Filter Handlers (Placeholder for date filter)
    const clearSalaryDateFilter = () => {
        setSalaryExpensesData(originalSalaryExpensesData);
    };

    const handleSalaryDateFilter = () => {
        // Date filtering logic for salary could be more complex due to effective_from/payment_date distinction.
        // For simplicity, we keep it as a placeholder.
        setPopupMessage("Date filtering for salaries is complex and currently managed by the global Month selector.");
    };
// New function to fetch and filter Stationary expenses
const handleStationarySearch = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
        console.error("School code not found.");
        setPopupMessage("School Code not found. Cannot load ledger.");
        return;
    }

    setIsLedgerOpenForExpense(true); // Open popup immediately to show loading state
    setUserExpensesData([]); // Clear previous data
    setOriginalUserExpensesData([]);

    try {
        // --- 1. Fetch both datasets in parallel ---
        const expensesPromise = axios.get(`https://cleezoclass.com:4000/totalexpensesData?schoolCode=${schoolCode}`);
        const billsPromise = fetch("https://cleezoclass.com:4000/getAllBills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schoolCode })
        });

        const [expensesResponse, billsResponse] = await Promise.all([expensesPromise, billsPromise]);

        // --- 2. Process regular expenses ---
        const expensesData = expensesResponse.data || [];

        // --- 3. Process and transform uploaded bills ---
        let uploadedBillsData = [];
        if (billsResponse.ok) {
            const rawBills = await billsResponse.json();
            uploadedBillsData = rawBills.map(bill => ({
                id: bill.id || `bill_${Math.random()}`,
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
        } else {
            console.error("Failed to fetch uploaded bills");
        }

        // --- 4. Merge the two datasets ---
        const mergedData = [...expensesData, ...uploadedBillsData];

        // --- 5. Filter for Stationary expenses ---
        const stationaryData = mergedData.filter(item =>
            item.expense_type &&
            item.expense_type.toLowerCase().includes('stationary')
        );

        // Sort by date, with newest first
        stationaryData.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

        setUserExpensesData(stationaryData);
        setOriginalUserExpensesData(stationaryData);

    } catch (error) {
        console.error('Error fetching stationary expenses data:', error);
        setUserExpensesData([]);
        setOriginalUserExpensesData([]);
    }
};

    // 🚀 NEW FUNCTION: Fetch and display ONLY Utilities data for Ledger
const handleUtilitiesSearch = async () => {
    console.log("handleUtilitiesSearch called");
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
        console.error("School code not found.");
        setPopupMessage("School Code not found. Cannot load ledger.");
        return;
    }

    console.log("Opening Utilities Ledger Popup...");
    setIsLedgerOpenForUtilities(true);
    setUtilitiesExpensesData([]);
    setOriginalUtilitiesExpensesData([]);

    try {
        console.log("Fetching utilities data...");
        const response = await axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
        const rawExpensesData = response.data || [];
        console.log("Raw expense types:", rawExpensesData.map(item => item.expense_type)); // Log all expense_type values

        // Updated filter: Use partial matching for flexibility
        const utilitiesData = rawExpensesData.filter(item =>
            item.expense_type && (
                item.expense_type.toLowerCase().includes('maintenance') ||  
                item.expense_type.toLowerCase().includes('stationary')    
            )
        );
        console.log("Filtered utilities data:", utilitiesData); // Log the filtered data

        // Sort by date, with newest first
        utilitiesData.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

        setUtilitiesExpensesData(utilitiesData);
        setOriginalUtilitiesExpensesData(utilitiesData);

    } catch (error) {
        console.error('Error fetching utilities expenses data:', error);
        setUtilitiesExpensesData([]);
        setOriginalUtilitiesExpensesData([]);
    }
};



    // 🚀 UPDATE: Handler for Utilities View Ledger button
const handleUtilitiesView = () => {
    console.log("handleUtilitiesView called"); // Log when the function is called
    handleUtilitiesSearch();
};


    // 🚀 NEW: Filter Handlers specific to Utilities Ledger (for the popup to use)
    const clearUtilitiesDateFilter = () => {
        setUtilitiesExpensesData(originalUtilitiesExpensesData);
        // Resetting to default placeholder dates
        setFromDate("2025-07-21");
        setToDate("2025-08-21");
    };

    const handleUtilitiesDateFilter = () => {
        if (!fromDate || !toDate) {
            setPopupMessage("Please select both a 'From' and 'To' date.");
            return;
        }
        const start = new Date(fromDate);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        if (originalUtilitiesExpensesData) {
            const filteredData = originalUtilitiesExpensesData.filter(expense => {
                const expenseDate = new Date(expense.expense_date);
                return !isNaN(expenseDate.getTime()) && expenseDate >= start && expenseDate <= end;
            });
            setUtilitiesExpensesData(filteredData);
        }
    };

    // Placeholder handlers for the remaining "View Report" buttons
    const handlePlaceholderView = (reportName) => {
        setPopupMessage(`Viewing a placeholder report/chart for: ${reportName}\n\nThis functionality would typically involve fetching and displaying specific expense data.`);
    };
// New function to fetch and filter Transport-related expenses
const handleTransportSearch = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
        console.error("School code not found.");
        setPopupMessage("School Code not found. Cannot load ledger.");
        return;
    }

    setIsLedgerOpenForExpense(true); // Open popup immediately to show loading state
    setUserExpensesData([]); // Clear previous data
    setOriginalUserExpensesData([]);

    try {
        // --- 1. Fetch both datasets in parallel ---
        const expensesPromise = axios.get(`https://cleezoclass.com:4000/totalexpensesData?schoolCode=${schoolCode}`);
        const billsPromise = fetch("https://cleezoclass.com:4000/getAllBills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ schoolCode })
        });

        const [expensesResponse, billsResponse] = await Promise.all([expensesPromise, billsPromise]);

        // --- 2. Process regular expenses ---
        const expensesData = expensesResponse.data || [];

        // --- 3. Process and transform uploaded bills ---
        let uploadedBillsData = [];
        if (billsResponse.ok) {
            const rawBills = await billsResponse.json();
            uploadedBillsData = rawBills.map(bill => ({
                id: bill.id || `bill_${Math.random()}`,
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
        } else {
            console.error("Failed to fetch uploaded bills");
        }

        // --- 4. Merge the two datasets ---
        const mergedData = [...expensesData, ...uploadedBillsData];

        // --- 5. Filter for Transport-related expenses ---
        const transportData = mergedData.filter(item =>
            item.expense_type &&
            item.expense_type.toLowerCase().includes('transport')
        );

        // Sort by date, with newest first
        transportData.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

        setUserExpensesData(transportData);
        setOriginalUserExpensesData(transportData);

    } catch (error) {
        console.error('Error fetching transport expenses data:', error);
        setUserExpensesData([]);
        setOriginalUserExpensesData([]);
    }
};
// Add these state variables to your component
const [stationaryTotal, setStationaryTotal] = useState(0);
const [transportTotal, setTransportTotal] = useState(0);
const [utilitiesTotal, setUtilitiesTotal] = useState(0);

// Function to fetch and calculate total for Utilities
const fetchAndCalculateUtilitiesTotal = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
        console.error("School code not found.");
        return;
    }

    try {
        const response = await axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
        const rawExpensesData = response.data || [];

        // Filter for Utilities expenses (Maintenance, Stationary, Transport)
        const utilitiesData = rawExpensesData.filter(item =>
            item.expense_type &&
            (
                item.expense_type.toLowerCase().includes('maintenance') ||
                item.expense_type.toLowerCase().includes('stationary') ||
                item.expense_type.toLowerCase().includes('transport')
            )
        );

        // Calculate the total amount for Utilities
        const total = utilitiesData.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        setUtilitiesTotals({ totalAmount: total, loading: false, error: null });
        setUtilitiesTotal(total);

    } catch (error) {
        console.error('Error fetching utilities total:', error);
        setUtilitiesTotals(prev => ({ ...prev, loading: false, error: error.message }));
    }
};

// Function to fetch and calculate total for Stationary
const fetchAndCalculateStationaryTotal = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
        console.error("School code not found.");
        return;
    }

    try {
        const response = await axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
        const rawExpensesData = response.data || [];

        // Filter for Stationary expenses
        const stationaryData = rawExpensesData.filter(item =>
            item.expense_type &&
            item.expense_type.toLowerCase().includes('stationary')
        );

        // Calculate the total amount for Stationary
        const total = stationaryData.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        setStationaryTotal(total);

    } catch (error) {
        console.error('Error fetching stationary total:', error);
    }
};

// Function to fetch and calculate total for Transport
const fetchAndCalculateTransportTotal = async () => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) {
        console.error("School code not found.");
        return;
    }

    try {
        const response = await axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
        const rawExpensesData = response.data || [];

        // Filter for Transport-related expenses
        const transportData = rawExpensesData.filter(item =>
            item.expense_type &&
            item.expense_type.toLowerCase().includes('transport')
        );

        // Calculate the total amount for Transport
        const total = transportData.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        setTransportTotal(total);

    } catch (error) {
        console.error('Error fetching transport total:', error);
    }
};
useEffect(() => {
    fetchAndCalculateUtilitiesTotal();
    fetchAndCalculateStationaryTotal();
    fetchAndCalculateTransportTotal();
}, [selectedMonth]);


    // ------------------------------
    // JSX RENDER
    // ------------------------------
    return (
     <div style={outerContainer}>
             <h2 className="footprints" data-guide="guide-expense-popup-title">Expenses</h2>
<div className={
            (isLedgerOpenForExpense || isSalaryLedgerOpen || isLedgerOpenForUtilities) 
            ? "blur-background-active" 
            : ""
        }> 
                 {/* --- GLOBAL MONTH SELECTOR --- */}
               
       <div style={innerContainer}>

                 {/* TOP ROW: General Reports and Total Cards */}
                 <div style={topRowContainer}>
 
                     <div style={leftColumn}>
                         <div style={cardLarge}>
                            <div style={{ marginBottom: "20px", textAlign: "right",  paddingBottom: "10px" }}>
                     
                     <select
                         id="global-month-select"
                         data-guide="expense-month-filter"
                style={{ padding: "4px", fontSize: "12px", borderRadius: "6px", border: "1px solid #3498db", minWidth: "100px" }}
                         value={selectedMonth}
                         onChange={(e) => setSelectedMonth(e.target.value)}
                     >
                         <option value="">Select Month</option>
                         {months.map((m) => (
                             <option key={m} value={m}>{m}</option>
                         ))}
                     </select>
                 </div>
                     
                             {/* START: Side-by-Side Chart Container (NEW STRUCTURE) */}
                             <div style={{
                                 display: "flex",
                                 gap: "10px", // Space between charts
                                 marginBottom: "15px",
                                 borderBottom: "1px solid #eee",
                                 paddingBottom: "15px",
                                 flexWrap: "wrap", // For responsiveness
                                 // Removed the separate redundant wrappers
                             }}>
                                 
                                 {/* 🚀 Bar Chart (Decreased size, 50% width) */}
                                 <div data-guide="expense-report-chart" style={{ flex: 1, minWidth: '45%', minHeight: '200px' }}>
                                     <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", textAlign: 'center' }}>Expense Report (Monthly Comparison)</h4>
                                     {chartLoading ? (
                                         <p style={{ textAlign: 'center', fontSize: '12px' }}>Loading chart data...</p>
                                     ) : chartData.length > 0 ? (
                                         <ExpenseBarChart data={chartData} />
                                     ) : (
                                         <p style={{ textAlign: 'center', fontSize: '12px' }}>No expense data for comparison.</p>
                                     )}
                                      <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                 <button
                                     data-guide="expense-btn-report-chart-ledger"
                                     onClick={handleSearch}
  className="btn-outline"
                                >
                                     {totals.loading ? 'Refreshing...' : 'View Ledger'}
                                 </button>
                             </div>
                                 </div>
 
                                 {/* 🚀 Line Chart (Decreased size, 50% width) */}
                                 <div data-guide="expense-trend-chart" style={{ flex: 1, minWidth: '45%', minHeight: '200px' }}>
                                     <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", textAlign: 'center', marginBottom:'20px'  }}>Expense Graph (6-Month Trend)</h4>
                                     {chartLoading ? (
                                         <p style={{ textAlign: 'center', fontSize: '12px',}}>Loading chart data...</p>
                                     ) : chartData.length > 0 ? (
                                         <ExpenseLineChart data={chartData} />
                                     ) : (
                                         <p style={{ textAlign: 'center', fontSize: '12px' }}>No expense data for trend graph.</p>
                                     )}
                                      <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                 <button
                                     data-guide="expense-btn-trend-chart-ledger"
                                     onClick={handleSearch}
  className="btn-outline"
                                       >
                                     {totals.loading ? 'Refreshing...' : 'View Ledger'}
                                 </button>
                             </div>
                                 </div>
                             </div>
                             {/* END: Side-by-Side Chart Container */}
 
                             {/* Critical Lists (Unchanged) */}
                             <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                     <h2 style={{ fontSize: "12px", margin: 0 }}>
                                         <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: "5px", fontSize: "12px" }} />
                                         **30 Nov 2025:** Building Rent Payment Due
                                     </h2>
                                 </div>
 
                                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                     <h2 style={{ fontSize: "12px", margin: 0 }}>
                                         <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: "5px", fontSize: "12px" }} />
                                         Bus **#123** is using more fuel than recorded
                                     </h2>
                                      <button data-guide="expense-btn-bus-fuel-alert-ledger" onClick={() => handlePlaceholderView("Bus Fuel Report")}   className="btn-outline"
>View Ledger</button>
                                 </div>
 
                                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                     <h2 style={{ fontSize: "12px", margin: 0 }}>
                                         <FontAwesomeIcon icon={faAward} style={{ marginRight: "5px", fontSize: "12px" }} />
                                         **Miscellaneous expenses** are higher this month
                                     </h2>
                                     <button data-guide="expense-btn-misc-alert-ledger"  className="btn-outline"
 onClick={handleUtilitiesView}>View Ledger</button>
                                 </div>
                             </div>
                         </div>
                     </div>
 
                     {/* RIGHT COLUMN: Total Cards */}
                     <div style={rightColumn}>
                         <div data-guide="expense-total-price" style={card}>
                             <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Total Expenses (Price)</h3>
                             <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0 0 5px 0", color: "#e74c3c" }}>
                                 {formatCurrency(totals.totalPrice)}
                             </p>
                             <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                 <button
                                     data-guide="expense-btn-total-price-ledger"
                                     onClick={handleSearch}
  className="btn-outline"
                                        >
                                     {totals.loading ? 'Refreshing...' : 'View Ledger'}
                                 </button>
                             </div>
                         </div>
                         {/* TOTAL SALARIES CARD */}
                         <div data-guide="expense-total-salary" style={card}>
                             <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Total Salaries ({selectedMonth})</h3>
                             <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0 0 5px 0", color: "#3498db" }}>
                                 {formatCurrency(salaryTotals.totalPaidSalary, true)}
                             </p>
                             <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                 <button
                                     data-guide="expense-btn-total-salary-ledger"
                                     onClick={handleSalarySearch}
  className="btn-outline"
                                        >
                                     {salaryTotals.loading ? 'Refreshing...' : 'View Ledger'}
                                 </button>
                             </div>
                         </div>
                         <div data-guide="expense-total-recruitment" style={card}>
                             <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Total Recruitment Expenses</h3>
                             <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0 0 5px 0", color: "#3498db" }}>
                                 {formatCurrency(0)}
                             </p>
                             <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                 <button
                                     data-guide="expense-btn-total-recruitment-ledger"
                                     onClick={() => handlePlaceholderView("Recruiting Ledger")}
  className="btn-outline"
                                        >
                                     View Ledger
                                 </button>
                             </div>
                         </div>
                     </div>
                 </div>
 
                 {/* BOTTOM ROW: Expense Breakdown (Utilities Fixed - Unchanged) */}
                 <div style={bottomRowContainer}>
                     <div style={cardLarge}>
                         <div style={{ flex: "0 0 auto", borderRadius: "8px", padding: "15px", background: "#fff" }}>
 
                             <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
                                 {/* BOX 1: Total Store Expenses */}
<div
    data-guide="expense-total-store"
    style={{
        ...boxStyle,
        borderRight: "1px solid #ccc",
        background: "#fff",
        padding: "10px",
        textAlign: "center",
    }}
>
    <div
        style={{
            display: "inline-flex",
            justifyContent: "flex-start",
            width: "100%",
            flexDirection: "column",
            alignItems: "flex-start",
        }}
    >
        <FontAwesomeIcon icon={faRupeeSign} style={iconStyle} />
        <h4 style={{ fontSize: "12px", margin: "5px 0 0 0" }}>
            Total Store Expenses
        </h4>
    </div>
    <p style={{ fontSize: "30px", fontWeight: "400px", margin: '5px 0' }}>
        {formatCurrency(stationaryTotal)}
    </p>
    <button
        data-guide="expense-btn-total-store-ledger"
        onClick={handleStationarySearch}
        className="btn-outline"
    >
        View Ledger
    </button>
</div>

 
                                 {/* BOX 2: Total Utilities (FIXED) */}
<div
    data-guide="expense-total-utilities"
    style={{
        ...boxStyle,
        borderRight: "1px solid #ccc",
        background: "#fff",
        padding: "10px",
        textAlign: "center",
    }}
>
    <div
        style={{
            display: "inline-flex",
            justifyContent: "flex-start",
            width: "100%",
            flexDirection: "column",
            alignItems: "flex-start",
        }}
    >
        <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
        <h4 style={{ fontSize: "12px", margin: "5px 0 0 0" }}>
            Total Utilities ({selectedMonth})
        </h4>
    </div>
    <p style={{ fontSize: "30px", fontWeight: "400px", margin: '5px 0' }}>
        {formatCurrency(utilitiesTotal)}
    </p>
    <button
        data-guide="expense-btn-total-utilities-ledger"
        onClick={handleUtilitiesView}
        className="btn-outline"
    >
        View Ledger
    </button>
</div>

 
                                 {/* BOX 3: Total Bus Expenses */}
<div
    data-guide="expense-total-bus"
    style={{
        ...boxStyle,
        borderRight: "1px solid #ccc",
        background: "#fff",
        padding: "10px",
        textAlign: "center",
    }}
>
    <div
        style={{
            display: "inline-flex",
            justifyContent: "flex-start",
            width: "100%",
            flexDirection: "column",
            alignItems: "flex-start",
        }}
    >
        <FontAwesomeIcon icon={faMoneyCheckAlt} style={iconStyle} />
        <h4 style={{ fontSize: "12px", margin: "5px 0 0 0" }}>
            Total Bus Expenses
        </h4>
    </div>
    <p style={{ fontSize: "30px", fontWeight: "400px", margin: '5px 0' }}>
        {formatCurrency(transportTotal)}
    </p>
    <button
        data-guide="expense-btn-total-bus-ledger"
        onClick={handleTransportSearch}
        className="btn-outline"
    >
        View Ledger
    </button>
</div>
 
 
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
 </div>
             {/* POPUP RENDERS (Unchanged) */}
             <ExpenseLedgerPopup
                 isOpen={isLedgerOpenForExpense}
                 onClose={() => setIsLedgerOpenForExpense(false)}
                 userExpensesData={userExpensesData}
                 originalUserExpensesData={originalUserExpensesData}
                 fromDate={fromDate}
                 setFromDate={setFromDate}
                 toDate={toDate}
                 setToDate={setToDate}
                 handleExpenseDateFilter={handleExpenseDateFilter}
                 clearExpenseDateFilter={clearExpenseDateFilter}
                 dynamicSchoolCode={dynamicSchoolCode}
                 dynamicLogoSrc={dynamicLogoSrc}
                 openImageModal={openImageModal}
             />
 
             <SalaryLedgerPopup
                 isOpen={isSalaryLedgerOpen}
                 onClose={() => setIsSalaryLedgerOpen(false)}
                 salaryExpensesData={salaryExpensesData}
                 fromDate={selectedMonth}
                 toDate={selectedMonth}
                 handleSalaryDateFilter={handleSalaryDateFilter}
                 clearSalaryDateFilter={clearSalaryDateFilter}
             />
 
             <UtilitiesLedgerPopup
                 isOpen={isLedgerOpenForUtilities}
                 onClose={() => setIsLedgerOpenForUtilities(false)}
                 utilitiesExpensesData={utilitiesExpensesData}
                 originalUtilitiesExpensesData={originalUtilitiesExpensesData}
                 fromDate={fromDate}
                 setFromDate={setFromDate}
                 toDate={toDate}
                 setToDate={setToDate}
                 handleUtilitiesDateFilter={handleUtilitiesDateFilter}
                 clearUtilitiesDateFilter={clearUtilitiesDateFilter}
                 openImageModal={openImageModal}
             />

               <ErrorPopup
        message={popupMessage} 
        onClose={() => setPopupMessage("")} 
      />
         </div>
    );
}