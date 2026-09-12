import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Ledger.css";

function Ledger() {
  const [ledgerData, setLedgerData] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [schoolName, setSchoolName] = useState("Loading...");
  const currentDbName = localStorage.getItem("schoolCode") || "";

  // ================= FETCH SCHOOL NAME =================
  useEffect(() => {
    if (!currentDbName) return;

    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${currentDbName}`)
      .then(res => res.json())
      .then(data => {
        setSchoolName(data.institute_name || "Unknown School");
      })
      .catch(err => {
        console.error("Error fetching school name:", err);
        setSchoolName("Unknown School");
      });
  }, [currentDbName]);

  // ================= FETCH LEDGER DATA =================
const fetchLedger = async () => {
  try {
    let url = "https://cleezoclass.com:4000/api/ledger";
    const schoolCode = localStorage.getItem("schoolCode"); // get schoolCode from localStorage

    if (!schoolCode) {
      console.error("School code not found in localStorage");
      return;
    }

    // Build query params
    const params = new URLSearchParams({ schoolCode });

    if (filterType === "today") {
      params.append("type", "today");
    } else if (filterType === "lastWeek") {
      params.append("type", "lastWeek");
    } else if (filterType === "custom" && fromDate && toDate) {
      params.append("type", "custom");
      params.append("from", fromDate);
      params.append("to", toDate);
    }

    // Final URL with query string
    const finalUrl = `${url}?${params.toString()}`;

    const res = await axios.get(finalUrl);
    setLedgerData(Array.isArray(res.data.data) ? res.data.data : []);
  } catch (error) {
    console.error(error);
    setLedgerData([]);
  }
};

  useEffect(() => {
    fetchLedger();
  }, [filterType]);

  // ================= TOTAL CALCULATIONS =================
  const totalPaid = ledgerData.reduce(
    (sum, item) => sum + Number(item.amount_paid || 0),
    0
  );

  const totalCash = ledgerData
    .filter((item) => item.paymentMode?.toLowerCase() === "cash")
    .reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);

  const totalOnline = ledgerData
    .filter((item) => item.paymentMode?.toLowerCase() !== "cash")
    .reduce((sum, item) => sum + Number(item.amount_paid || 0), 0);

  const handlePrint = () => {
    window.print();
  };
// ================= CALCULATE DATE RANGE =================
const getDateRange = () => {
  if (ledgerData.length === 0) return "-";

  // Get all valid dates
  const dates = ledgerData
    .map(item => item.paidDate)
    .filter(date => date)
    .map(date => new Date(date));

  if (dates.length === 0) return "-";

  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  // If min and max are same, show only one date
  return minDate.getTime() === maxDate.getTime()
    ? minDate.toLocaleDateString()
    : `${minDate.toLocaleDateString()} to ${maxDate.toLocaleDateString()}`;
};

  // ================= RENDER =================
  return (
    <div className="ledger-container">
      {/* SCHOOL NAME */}
      <div style={{ padding: "10px 20px", fontWeight: "bold", fontSize: 20 }}>
        {schoolName}
      </div>

      {/* HEADER FOR PRINT */}
      <div className="ledger-header" style={{ textAlign: "center", margin: "10px 0" }}>
<div style={{ fontSize: 14, marginTop: 2 }}>
 Fee Day Sheet Between Dates On {getDateRange()}
</div>
        {/* Date Range */}
   
        {/* Report Type */}
        <div style={{ fontSize: 14, marginTop: 2 }}>
          Report type of Fee Day Sheet: {filterType === "all" ? "All Active Transactions" : filterType === "today" ? "Today's Transactions" : filterType === "lastWeek" ? "Last Week Transactions" : "Custom Range Transactions"}
        </div>

        {/* Report Generated On */}
        <div style={{ fontSize: 12, marginTop: 2 }}>
          Report Generated On: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* FILTERS (Hidden in Print) */}
      <div className="ledger-filters no-print">
        <button onClick={() => setFilterType("all")}>All</button>
        <button onClick={() => setFilterType("today")}>Today</button>
        <button onClick={handlePrint}>🖨 Print</button>
      </div>

      {/* SINGLE MAIN TABLE */}
      <table className="ledger-table">
        <thead>
          <tr>
            <th>S.No</th>
            <th>Student Name</th>
            <th>Class</th>
            <th>Section</th>
            <th>Receipt No</th>
            <th>Receipt Date</th>
            <th>Academic Year</th>
            <th>Fee Type</th>
            <th>Payment Mode</th>
            <th>Txn ID</th>
            <th>Remarks</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {ledgerData.length > 0 ? (
            ledgerData.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.StudentName}</td>
                <td>{item.Class_name}</td>
                <td>{item.section}</td>
                <td>{item.receiptNumber}</td>
                <td>{item.paidDate ? new Date(item.paidDate).toLocaleDateString() : "-"}</td>
                <td>
                  {item.academic_year || (() => {
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = today.getMonth() + 1;
                      return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
                  })()}
                </td>
                <td>{item.fee_type}</td>
                <td>{item.paymentMode}</td>
                <td>{item.transaction_id || "-"}</td>
                <td ></td>
                <td >₹ {item.amount_paid}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="12">No records found</td>
            </tr>
          )}

          {/* TOTAL ROWS INSIDE SAME TABLE */}
          <tr className="total-row">
            <td colSpan="11" className="total-label">Total Cash</td>
            <td className="amount-cell">₹ {totalCash}</td>
          </tr>

          <tr className="total-row">
            <td colSpan="11" className="total-label">Total Online</td>
            <td className="amount-cell">₹ {totalOnline}</td>
          </tr>

          <tr className="grand-total-row">
            <td colSpan="11" className="total-label">Grand Total</td>
            <td className="amount-cell">₹ {totalPaid}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Ledger;
