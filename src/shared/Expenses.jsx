import React, { useState, useEffect } from "react";
import axios from "axios";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faRupeeSign, faBookReader,
    faExclamationCircle, faAward, faMoneyCheckAlt, faChartBar, faTimes, faEye, faSync
} from "@fortawesome/free-solid-svg-icons";

// --- CHARTING LIBRARY IMPORTS ---
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';

// =======================================================
// UTILITY FUNCTION
// =======================================================

// Function to safely retrieve schoolCode from LocalStorage
const getSchoolCode = () => {
    return localStorage.getItem('schoolCode');
};

// =======================================================
// CHART COMPONENTS (Content unchanged)
// =======================================================

/**
 * Bar Chart for Monthly Expense Report (Comparison)
 */
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
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Total Expense']}
                    labelFormatter={formatXAxis}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} layout="horizontal" verticalAlign="top" align="center" />
                <Bar dataKey="totalExpense" fill="#2980B9" name="Total Expense (INR)" />
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
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Total Expense']}
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
// SALARY LEDGER POPUP COMPONENT (Content unchanged)
// =======================================================
const SalaryLedgerPopup = ({
    isOpen, onClose, salaryExpensesData,
    fromDate, toDate, handleSalaryDateFilter, clearSalaryDateFilter
}) => {
    if (!isOpen) return null;
    const popupStyle = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999
    };
    const contentStyle = {
        backgroundColor: '#fff', borderRadius: '8px', width: '100%',
        maxWidth: '1000px', maxHeight: '90vh', padding: '20px', position: 'relative',
        display: 'flex', flexDirection: 'column'
    };
    const headerStyleDe = {
        padding: '10px 12px', border: '1px solid #ddd', backgroundColor: 'rgba(45, 62, 80, 1)',
        color: '#fff', textAlign: 'left', whiteSpace: 'nowrap', fontSize: '12px'
    };
    const cellStyleDe = {
        padding: '8px 12px', border: '1px solid #ddd', textAlign: 'left',
        whiteSpace: 'nowrap', fontSize: '12px'
    };
    const tableStylee = {
        width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed',
    };
    const colWidths = [
        '8%', '15%', '30%', '15%', '17%', '15%',
    ];
    const totalSalaryAmount = Array.isArray(salaryExpensesData)
        ? salaryExpensesData.reduce((sum, item) => sum + ((item && item.final_salary) || 0), 0)
        : 0;
    return (
        <div style={popupStyle}>
            <div style={contentStyle}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '20px',
                        background: 'transparent', border: 'none', fontSize: '1.8rem',
                        lineHeight: '1', cursor: 'pointer', color: '#333'
                    }}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#2d3e50' }}>Salary Ledger</h3>
                <div style={{ margin: '15px 0', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                    <label style={{ fontWeight: "bold", fontSize: '14px' }}>
                        From:
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => { }}
                            style={{ padding: "6px", borderRadius: "4px", border: "1px solid #888", marginLeft: '5px', fontSize: "14px" }}
                        />
                    </label>
                    <label style={{ fontWeight: "bold", fontSize: '14px' }}>
                        To:
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => { }}
                            style={{ padding: "6px", borderRadius: "4px", border: "1px solid #888", marginLeft: '5px', fontSize: "14px" }}
                        />
                    </label>
                    <button
                        onClick={handleSalaryDateFilter}
                        style={{
                            padding: "6px 12px", borderRadius: "4px", border: "none",
                            backgroundColor: "#2980B9", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: 'bold', opacity: 0.5
                        }}
                        disabled
                    >
                        Filter
                    </button>
                    <button
                        onClick={clearSalaryDateFilter}
                        style={{
                            padding: '6px 12px', border: '1px solid #ccc', backgroundColor: '#f0f0f0',
                            color: '#333', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', opacity: 0.5
                        }}
                        disabled
                    >
                        Reset
                    </button>
                </div>
                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    <table style={tableStylee}>
                        <colgroup>
                            {colWidths.map((width, i) => (
                                <col key={i} style={{ width }} />
                            ))}
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>#</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Payment Date</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Teacher</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Salary Month</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Amount</th>
                                <th style={{ ...headerStyleDe, position: 'sticky', top: 0, zIndex: 10 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salaryExpensesData && salaryExpensesData.length > 0 ? (
                                salaryExpensesData.map((data, index) => (
                                    <tr key={data.salary_id || index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f5f5f5" }}>
                                        <td style={cellStyleDe}>{index + 1}</td>
                                        <td style={cellStyleDe}>{new Date(data.payment_date).toLocaleDateString('en-IN')}</td>
                                        <td style={cellStyleDe}>{data.teacher_name || `ID: ${data.teacher_id}`}</td>
                                        <td style={cellStyleDe}>{data.salary_month}</td>
                                        <td style={cellStyleDe}>
                                            ₹{Number(data.final_salary).toFixed(2)}
                                        </td>
                                        <td style={cellStyleDe}>{data.status}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ ...cellStyleDe, textAlign: 'center' }}>No salary records found.</td>
                                </tr>
                            )}
                            {salaryExpensesData && salaryExpensesData.length > 0 && (
                                <tr
                                    style={{
                                        backgroundColor: '#e8f5e9', fontWeight: 'bold',
                                        position: 'sticky', bottom: 0, zIndex: 5,
                                    }}
                                >
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
            </div>
        </div>
    );
};

// =======================================================
// UTILITIES LEDGER POPUP COMPONENT (Content unchanged)
// =======================================================
const UtilitiesLedgerPopup = ({
    isOpen, onClose, utilitiesExpensesData, originalUtilitiesExpensesData,
    fromDate, setFromDate, toDate, setToDate,
    handleUtilitiesDateFilter, clearUtilitiesDateFilter,
    openImageModal
}) => {
    if (!isOpen) return null;
    const popupStyle = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999
    };
    const contentStyle = {
        backgroundColor: '#fff', borderRadius: '8px', width: '100%',
        maxWidth: '1200px', maxHeight: '90vh', padding: '20px', position: 'relative',
        display: 'flex', flexDirection: 'column'
    };
    const headerStyleDe = {
        padding: '10px 12px', border: '1px solid #ddd', backgroundColor: 'rgba(45, 62, 80, 1)',
        color: '#fff', textAlign: 'left', whiteSpace: 'nowrap', fontSize: '12px'
    };
    const cellStyleDe = {
        padding: '8px 12px', border: '1px solid #ddd', textAlign: 'left',
        whiteSpace: 'nowrap', fontSize: '12px'
    };
    const tableStylee = {
        width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed',
    };
    const colWidths = [
        '8%', '10%', '12%', '23%', '12%', '10%', '10%', '8%',
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
    return (
        <div style={popupStyle}>
            <div style={contentStyle}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '20px',
                        background: 'transparent', border: 'none', fontSize: '1.8rem',
                        lineHeight: '1', cursor: 'pointer', color: '#333'
                    }}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                <h3 style={{ margin: '0 0 15px 0', textAlign: 'center', color: '#2d3e50' }}>
                    Utilities Expense Ledger (Maintenance & Accommodation)
                </h3>
                <div style={{
                    margin: '15px 0', display: 'flex', alignItems: 'center',
                    gap: '15px', flexWrap: 'wrap', borderBottom: '1px solid #eee',
                    paddingBottom: '15px'
                }}>
                    <label style={{ fontWeight: "bold", fontSize: '14px' }}>
                        From:
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            style={{
                                padding: "6px", borderRadius: "4px", border: "1px solid #888",
                                marginLeft: '5px', fontSize: "14px"
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
                                padding: "6px", borderRadius: "4px", border: "1px solid #888",
                                marginLeft: '5px', fontSize: "14px"
                            }}
                        />
                    </label>
                    <button
                        onClick={handleUtilitiesDateFilter}
                        style={{
                            padding: "6px 12px", borderRadius: "4px", border: "none",
                            backgroundColor: "#2980B9", color: "white", cursor: "pointer",
                            fontSize: "14px", fontWeight: 'bold'
                        }}
                    >
                        Filter
                    </button>
                    <button
                        onClick={clearUtilitiesDateFilter}
                        style={{
                            padding: '6px 12px', border: '1px solid #ccc',
                            backgroundColor: '#f0f0f0', color: '#333',
                            borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        Reset
                    </button>
                </div>
                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
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
                                        style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f5f5f5" }}
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
    );
};


// =======================================================
// EXPENSE LEDGER POPUP COMPONENT (Content unchanged)
// =======================================================
const ExpenseLedgerPopup = ({
    isOpen, onClose, userExpensesData, originalUserExpensesData,
    fromDate, setFromDate, toDate, setToDate,
    handleExpenseDateFilter, clearExpenseDateFilter,
    dynamicSchoolCode, dynamicLogoSrc, openImageModal
}) => {
    if (!isOpen) return null;
    const popupStyle = {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 9999
    };
    const contentStyle = {
        backgroundColor: '#fff', borderRadius: '8px', width: '100%',
        maxWidth: '1200px', maxHeight: '90vh', padding: '20px', position: 'relative',
        display: 'flex', flexDirection: 'column'
    };
    const headerStyleDe = {
        padding: '10px 12px', border: '1px solid #ddd', backgroundColor: 'rgba(45, 62, 80, 1)',
        color: '#fff', textAlign: 'left', whiteSpace: 'nowrap', fontSize: '12px'
    };
    const cellStyleDe = {
        padding: '8px 12px', border: '1px solid #ddd', textAlign: 'left',
        whiteSpace: 'nowrap', fontSize: '12px'
    };
    const tableStylee = {
        width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed',
    };
    const colWidths = [
        '8%', '10%', '12%', '23%', '12%', '10%', '10%', '8%', '7%',
    ];
    const totalExpenseAmount = Array.isArray(userExpensesData)
        ? userExpensesData.reduce((sum, item) => sum + ((item && item.price) || 0), 0)
        : 0;
    const totalFinalExpenseAmount = Array.isArray(userExpensesData)
        ? userExpensesData.reduce((sum, item) => sum + ((item && item.balance_amount) || 0), 0)
        : 0;
    return (
        <div style={popupStyle}>
            <div style={contentStyle}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '20px',
                        background: 'transparent', border: 'none', fontSize: '1.8rem',
                        lineHeight: '1', cursor: 'pointer', color: '#333'
                    }}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                <div style={{ margin: '15px 0', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
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
                            backgroundColor: "#2980B9", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: 'bold'
                        }}
                    >
                        Filter
                    </button>
                    <button
                        onClick={clearExpenseDateFilter}
                        style={{
                            padding: '6px 12px', border: '1px solid #ccc', backgroundColor: '#f0f0f0',
                            color: '#333', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'
                        }}
                    >
                        Reset
                    </button>
                </div>
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
                                    <tr key={data.id || index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f5f5f5" }}>
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
    );
};


// =======================================================
// MAIN COMPONENT
// =======================================================
export default function ExpenseChief() {
    // ------------------------------
    // COMMON STYLES (Unchanged)
    // ------------------------------
    const outerContainer = {
        width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
        background: "#fff", minHeight: "70vh", padding: "10px", boxSizing: "border-box",  
    };
    const innerContainer = {
        width: "90%", maxWidth: "1000px", display: "flex", padding: "15px",
        background: "#fff", borderRadius: "10px", boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
        margin: "20px auto", flexDirection: "column",
    };
    const headingStyle = {
        position: "absolute", top: "15px", fontSize: "20px", fontWeight: "600",
        textAlign: "center", width: "100%",
    };
    const topRowContainer = { display: "flex", gap: "10px", marginBottom: "10px" };
    const leftColumn = { flex: 3, display: "flex", flexDirection: "column", gap: "10px" };
    const rightColumn = { flex: 2, display: "flex", flexDirection: "column", gap: "10px" };
    const bottomRowContainer = { width: "100%", display: "flex", flexDirection: "column", gap: "10px" };
    const card = {
        background: "#fff", padding: "10px", borderRadius: "8px", boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
        flex: 1, display: "flex", flexDirection: "column",
    };
    const cardLarge = {
        background: "#fff", padding: "10px", borderRadius: "8px", boxShadow: "0px 1px 6px rgba(0,0,0,0.1)",
        flex: 1, display: "flex", flexDirection: "column",
    };
    const boxStyle = {
        flex: 1, padding: "8px", borderRight: "1px solid #ccc", borderRadius: "4px",
        textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "space-between", height: "160px", margin: "0 2px",
    };
    const iconStyle = { fontSize: "20px", marginBottom: "5px", color: "#000" };
    const btnStyle = {
        padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer",
        background: "#3498db", color: "#fff", fontSize: "11px", marginTop: "5px"
    };


    // ------------------------------
    // STATE
    // ------------------------------

    const [selectedMonth, setSelectedMonth] = useState("2025-08");

    const [totals, setTotals] = useState({
        totalPaid: 0, totalBalance: 0, totalPrice: 0, loading: true, error: null
    });
    const [salaryTotals, setSalaryTotals] = useState({
        totalPaidSalary: 0, loading: true, error: null
    });
    const [utilitiesTotals, setUtilitiesTotals] = useState({
        totalAmount: 0, loading: true, error: null
    });
    const [chartData, setChartData] = useState([]);
    const [chartLoading, setChartLoading] = useState(true);
    const [salaryExpensesData, setSalaryExpensesData] = useState([]);

    const [isLedgerOpenForExpense, setIsLedgerOpenForExpense] = useState(false);
    const [userExpensesData, setUserExpensesData] = useState([]);
    const [originalUserExpensesData, setOriginalUserExpensesData] = useState(null);
    const [fromDate, setFromDate] = useState("2025-07-21");
    const [toDate, setToDate] = useState("2025-08-21");

    const [isSalaryLedgerOpen, setIsSalaryLedgerOpen] = useState(false);
    const [originalSalaryExpensesData, setOriginalSalaryExpensesData] = useState(null);

    const [isLedgerOpenForUtilities, setIsLedgerOpenForUtilities] = useState(false);
    const [utilitiesExpensesData, setUtilitiesExpensesData] = useState([]);
    const [originalUtilitiesExpensesData, setOriginalUtilitiesExpensesData] = useState(null);

    const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
    const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');

    const months = [
        "2025-01", "2025-02", "2025-03",
        "2025-04", "2025-05", "2025-06",
        "2025-07", "2025-08", "2025-09",
        "2025-10", "2025-11", "2025-12",
    ];

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

        const numericAmount = parseFloat(amount) || 0;
        return numericAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    };

    const openImageModal = (imageUrl) => {
        window.open(imageUrl, '_blank');
    };

    // =======================================================
    // RESTORED FETCHING LOGIC
    // =======================================================

    /**
     * Fetches all non-salary expenses for total card calculation and ledger data.
     */
    const fetchTotals = async () => {
        setTotals({ ...totals, loading: true, error: null });
        const schoolCode = getSchoolCode();
        if (!schoolCode) {
            setTotals({ totalPaid: 0, totalBalance: 0, totalPrice: 0, loading: false, error: 'No school code found.' });
            return;
        }

        try {
            // This endpoint is assumed to fetch all general expenses.
            const response = await axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
            const data = response.data || [];
            
            let totalPrice = 0;
            let totalPaid = 0;
            let totalBalance = 0;

            if (Array.isArray(data)) {
                data.forEach(item => {
                    totalPrice += (Number(item.price) || 0);
                    totalPaid += (Number(item.paid_amount) || 0);
                    totalBalance += (Number(item.balance_amount) || 0);
                });
            }
            
            setTotals({ totalPrice, totalPaid, totalBalance, loading: false, error: null });
            
            // Set data for the expense ledger
            setUserExpensesData(data);
            setOriginalUserExpensesData(data);

        } catch (error) {
            console.error('Error fetching general totals:', error);
            setTotals({ ...totals, loading: false, error: 'Failed to fetch data' });
        }
    };

    /**
     * Fetches salary expenses for a specific month/year.
     */
    const fetchAndCalculateSalaryTotals = async (monthYear) => {
        setSalaryTotals({ ...salaryTotals, loading: true, error: null });
        const schoolCode = getSchoolCode();
        if (!schoolCode) {
            setSalaryTotals({ totalPaidSalary: 0, loading: false, error: 'No school code found.' });
            return;
        }

        try {
            const [year, month] = monthYear.split('-');
            const response = await axios.get(`https://cleezoclass.com:4000/api/salaryLedger?schoolCode=${schoolCode}&year=${year}&month=${month}`);
            const data = response.data || [];
            
            const totalPaidSalary = data.reduce((sum, item) => sum + (Number(item.final_salary) || 0), 0);
            
            setSalaryTotals({ totalPaidSalary, loading: false, error: null });

            // Set data for the salary ledger
            setSalaryExpensesData(data);
            setOriginalSalaryExpensesData(data);

        } catch (error) {
            console.error('Error fetching salary totals:', error);
            setSalaryTotals({ ...salaryTotals, loading: false, error: 'Failed to fetch data' });
        }
    };

    /**
     * Fetches utility expenses for a specific month/year.
     */
    const fetchAndCalculateUtilitiesTotals = async (monthYear) => {
        setUtilitiesTotals({ ...utilitiesTotals, loading: true, error: null });
        const schoolCode = getSchoolCode();
        if (!schoolCode) {
            setUtilitiesTotals({ totalAmount: 0, loading: false, error: 'No school code found.' });
            return;
        }

        try {
            const [year, month] = monthYear.split('-');
            // Assuming a dedicated API for utilities that can be filtered by month
            const response = await axios.get(`https://cleezoclass.com:4000/api/utilitiesexpenses?schoolCode=${schoolCode}&year=${year}&month=${month}`);
            const data = response.data || [];
            
            const totalAmount = data.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
            
            setUtilitiesTotals({ totalAmount, loading: false, error: null });

            // Set data for the utilities ledger
            setUtilitiesExpensesData(data);
            setOriginalUtilitiesExpensesData(data);

        } catch (error) {
            console.error('Error fetching utilities totals:', error);
            setUtilitiesTotals({ ...utilitiesTotals, loading: false, error: 'Failed to fetch data' });
        }
    };

    const fetchChartData = async () => { 
        setChartLoading(true);
        const schoolCode = getSchoolCode();
        if (!schoolCode) {
            setChartLoading(false);
            return;
        }

        try {
            const expensesPromise = axios.get(`https://cleezoclass.com:4000/api/totalexpenses?schoolCode=${schoolCode}`);
            const salaryResponse = await axios.get(`https://cleezoclass.com:4000/api/salaryLedger?schoolCode=${schoolCode}`);
            const [expensesResponse] = await Promise.all([expensesPromise]);

            const rawExpensesData = expensesResponse.data || [];
            const rawSalaryData = salaryResponse.data || [];

            const monthlyTotals = {};
            const now = new Date();
            const lastSixMonths = [];
            for (let i = 0; i < 6; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                lastSixMonths.unshift(monthKey);
                monthlyTotals[monthKey] = { totalExpense: 0 };
            }

            rawExpensesData.forEach(item => {
                if (item.expense_date) {
                    const date = new Date(item.expense_date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyTotals[monthKey]) {
                        monthlyTotals[monthKey].totalExpense += (Number(item.price) || 0);
                    }
                }
            });

            rawSalaryData.forEach(item => {
                if (item.payment_date) {
                    const date = new Date(item.payment_date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    if (monthlyTotals[monthKey]) {
                        monthlyTotals[monthKey].totalExpense += (Number(item.final_salary) || 0);
                    }
                }
            });

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
        fetchChartData();
    };


    // =======================================================
    // useEffect HOOKS (Now calls the restored fetch functions)
    // =======================================================

    useEffect(() => {
        handleRefresh(); // Call all fetches on initial load
    }, []);

    useEffect(() => {
        const fetchSchoolLogo = async () => {
            const code = localStorage.getItem('schoolCode');
            if (!code) {
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

    useEffect(() => {
        if (selectedMonth) {
            // Re-fetch only the month-dependent data when selectedMonth changes
            fetchAndCalculateSalaryTotals(selectedMonth);
            fetchAndCalculateUtilitiesTotals(selectedMonth);
        }
    }, [selectedMonth]);


    // ------------------------------
    // HANDLERS (With basic filtering logic implemented)
    // ------------------------------

    const parseDate = (dateString) => new Date(dateString);

    // Generic filtering function
    const filterDataByDate = (data, fromDate, toDate, dateKey) => {
        const from = parseDate(fromDate);
        const to = parseDate(toDate);
        if (isNaN(from) || isNaN(to) || !data) return [];

        return data.filter(item => {
            const itemDate = parseDate(item[dateKey]);
            return itemDate >= from && itemDate <= to;
        });
    };

    // --- Expense Ledger Handlers ---
    const handleExpenseDateFilter = () => {
        const filteredData = filterDataByDate(originalUserExpensesData, fromDate, toDate, 'expense_date');
        setUserExpensesData(filteredData);
    };

    const clearExpenseDateFilter = () => {
        setUserExpensesData(originalUserExpensesData);
        setFromDate("2025-07-21"); // Reset to initial placeholder date
        setToDate("2025-08-21");
    };

    const handleSearch = async () => {
        // Fetch all data for the ledger if not already fetched
        if (!originalUserExpensesData) {
            await fetchTotals();
        }
        // Apply current date filter state and open the ledger
        handleExpenseDateFilter();
        setIsLedgerOpenForExpense(true);
    };

    // --- Salary Ledger Handlers ---
    const handleSalaryDateFilter = () => {
        // This function is currently disabled in the SalaryLedgerPopup, but the logic would be:
        const filteredData = filterDataByDate(originalSalaryExpensesData, fromDate, toDate, 'payment_date');
        setSalaryExpensesData(filteredData);
    };

    const clearSalaryDateFilter = () => {
        setSalaryExpensesData(originalSalaryExpensesData);
    };

    const handleSalarySearch = async () => {
        // Re-fetch data for the selected month and open the ledger
        if (!originalSalaryExpensesData || originalSalaryExpensesData.length === 0) {
             await fetchAndCalculateSalaryTotals(selectedMonth);
        }
        setIsSalaryLedgerOpen(true);
    };


    // --- Utilities Ledger Handlers ---
    const handleUtilitiesDateFilter = () => {
        const filteredData = filterDataByDate(originalUtilitiesExpensesData, fromDate, toDate, 'expense_date');
        setUtilitiesExpensesData(filteredData);
    };

    const clearUtilitiesDateFilter = () => {
        setUtilitiesExpensesData(originalUtilitiesExpensesData);
        setFromDate("2025-07-21"); // Reset to initial placeholder date
        setToDate("2025-08-21");
    };

    const handleUtilitiesView = async () => { 
        // Re-fetch data for the selected month and open the ledger
        if (!originalUtilitiesExpensesData || originalUtilitiesExpensesData.length === 0) {
            await fetchAndCalculateUtilitiesTotals(selectedMonth);
        }
        // Apply current date filter state and open the ledger
        handleUtilitiesDateFilter();
        setIsLedgerOpenForUtilities(true); 
    };
    
    const handlePlaceholderView = (reportName) => {
        console.log(`Navigating to ${reportName}`);
        alert(`Functionality for "${reportName}" is a placeholder.`);
    };


    // ------------------------------
    // JSX RENDER (Unchanged structure)
    // ------------------------------
    return (
        <div style={outerContainer}>
            <h2 style={headingStyle}>Expenses Dashboard</h2>
            <div style={innerContainer}>

                {/* --- GLOBAL MONTH SELECTOR --- */}
                <div style={{ marginBottom: "20px", textAlign: "center", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
                    <label htmlFor="global-month-select" style={{ fontSize: "14px", marginRight: "10px", fontWeight: "600" }}>
                        Select Month for Reports/Salaries:
                    </label>
                    <select
                        id="global-month-select"
                        style={{ padding: "8px", fontSize: "14px", borderRadius: "6px", border: "1px solid #3498db", minWidth: "150px" }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        <option value="">Select Month</option>
                        {months.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                {/* TOP ROW: General Reports and Total Cards */}
                <div style={topRowContainer}>

                    <div style={leftColumn}>
                        <div style={cardLarge}>
                            <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: "5px" }}>
                                <button
                                    onClick={handleRefresh}
                                    style={{
                                        padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc",
                                        background: "#f0f0f0", color: "#333", cursor: "pointer", fontSize: "12px"
                                    }}
                                >
                                    <FontAwesomeIcon icon={faSync} style={{ marginRight: "5px" }} /> Refresh All
                                </button>
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
                                <div style={{ flex: 1, minWidth: '45%', minHeight: '200px' }}>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", textAlign: 'center' }}>Expense Report (Monthly Comparison)</h4>
                                    {chartLoading ? (
                                        <p style={{ textAlign: 'center', fontSize: '12px' }}>Loading chart data...</p>
                                    ) : chartData.length > 0 ? (
                                        <ExpenseBarChart data={chartData} />
                                    ) : (
                                        <p style={{ textAlign: 'center', fontSize: '12px' }}>No expense data for comparison.</p>
                                    )}
                                </div>

                                {/* 🚀 Line Chart (Decreased size, 50% width) */}
                                <div style={{ flex: 1, minWidth: '45%', minHeight: '200px' }}>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", textAlign: 'center' }}>Expense Graph (6-Month Trend)</h4>
                                    {chartLoading ? (
                                        <p style={{ textAlign: 'center', fontSize: '12px' }}>Loading chart data...</p>
                                    ) : chartData.length > 0 ? (
                                        <ExpenseLineChart data={chartData} />
                                    ) : (
                                        <p style={{ textAlign: 'center', fontSize: '12px' }}>No expense data for trend graph.</p>
                                    )}
                                </div>
                            </div>
                            {/* END: Side-by-Side Chart Container */}

                            {/* Critical Lists (Unchanged) */}
                            <div style={{ marginTop: "15px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h2 style={{ fontSize: "12px", margin: 0 }}>
                                        <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: "5px", fontSize: "12px" }} />
                                        **31st Nov 2025:** Building Rent Payment Due
                                    </h2>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h2 style={{ fontSize: "12px", margin: 0 }}>
                                        <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: "5px", fontSize: "12px" }} />
                                        Bus **#123** using more fuel as recorded
                                    </h2>
                                    <button onClick={() => handlePlaceholderView("Bus Fuel Report")} style={btnStyle}>View statement</button>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h2 style={{ fontSize: "12px", margin: 0 }}>
                                        <FontAwesomeIcon icon={faAward} style={{ marginRight: "5px", fontSize: "12px" }} />
                                        **Miscellaneous Expenses** going higher this month
                                    </h2>
                                    <button style={btnStyle} onClick={handleUtilitiesView}>View Ledger</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Total Cards */}
                    <div style={rightColumn}>
                        <div style={card}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Total Expenses (Price)</h3>
                            <p style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 5px 0", color: "#e74c3c" }}>
                                {formatCurrency(totals.totalPrice)}
                            </p>
                            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                <button
                                    onClick={handleSearch}
                                    style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(141,171,182,1)", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", width: "150px" }}
                                >
                                    {totals.loading ? 'Refreshing...' : 'View Ledger'}
                                </button>
                            </div>
                        </div>
                        {/* TOTAL SALARIES CARD */}
                        <div style={card}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Total Salaries ({selectedMonth})</h3>
                            <p style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 5px 0", color: "#3498db" }}>
                                {formatCurrency(salaryTotals.totalPaidSalary, true)}
                            </p>
                            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                <button
                                    onClick={handleSalarySearch}
                                    style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(141,171,182,1)", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", width: "150px" }}
                                >
                                    {salaryTotals.loading ? 'Refreshing...' : 'View Ledger'}
                                </button>
                            </div>
                        </div>
                        <div style={card}>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}>Total Recruiting</h3>
                            <p style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 5px 0", color: "#3498db" }}>
                                {formatCurrency(0)}
                            </p>
                            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                                <button
                                    onClick={() => handlePlaceholderView("Recruiting Ledger")}
                                    style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(141,171,182,1)", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", width: "150px" }}
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
                        <div style={{ flex: "0 0 auto", border: "1px solid #ccc", borderRadius: "8px", padding: "15px", background: "#f9f9f9" }}>
                            <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '14px' }}>Expense Categories Breakdown</h3>

                            <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
                                {/* BOX 1: Total Store */}
                                <div style={{ ...boxStyle, borderRight: "1px solid #ccc" }}>
                                    <FontAwesomeIcon icon={faRupeeSign} style={iconStyle} />
                                    <h4 style={{ margin: "0 0 5px 0", fontSize: '12px' }}>Total Store</h4>
                                    <p style={{ fontSize: "16px", fontWeight: "bold", margin: '5px 0' }}>
                                        {formatCurrency(0)}
                                    </p>
                                    <button onClick={() => handlePlaceholderView("Store Ledger")} style={btnStyle}> View Ledger</button>

                                </div>

                                {/* BOX 2: Total Utilities (FIXED) */}
                                <div style={{ ...boxStyle, borderRight: "1px solid #ccc" }}>
                                    <FontAwesomeIcon icon={faBookReader} style={iconStyle} />
                                    <h4 style={{ margin: "0 0 5px 0", fontSize: '12px', minHeight: '20px' }}>Total Utilities ({selectedMonth})</h4>
                                    <p style={{ fontSize: "16px", fontWeight: "bold", margin: '5px 0' }}>
                                        {formatCurrency(utilitiesTotals.totalAmount, false, true)}
                                    </p>
                                    <button onClick={handleUtilitiesView} style={btnStyle}>View Ledger</button>
                                </div>

                                {/* BOX 3: Total Bus exp */}
                                <div style={{ ...boxStyle, borderRight: "none" }}>
                                    <FontAwesomeIcon icon={faMoneyCheckAlt} style={iconStyle} />
                                    <h4 style={{ margin: "0 0 5px 0", fontSize: '12px', minHeight: '20px' }}>Total Bus exp</h4>
                                    <p style={{ fontSize: "16px", fontWeight: "bold", margin: '5px 0' }}>
                                        {formatCurrency(0)}
                                    </p>
                                    <button onClick={() => handlePlaceholderView("Bus Expenses Ledger")} style={btnStyle}>View Ledger</button>
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
        </div>
    );
}