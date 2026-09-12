import React, { useState, useEffect } from "react";
import axios from "axios";
import '@fortawesome/fontawesome-free/css/all.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRupeeSign, faBookReader, faExclamationCircle, faAward, faMoneyCheckAlt, faChartBar,
  faDownload, faPrint, faShareAlt, faTimes
} from "@fortawesome/free-solid-svg-icons";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../STYLES/solidbutton.css';

const API_BASE_URL = 'https://cleezoclass.com:4000';

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value?.toString === "function") return toNumber(value.toString());
  return 0;
};

const getAnyNumber = (row, keys) => {
  for (const key of keys) {
    const v = row?.[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return toNumber(v);
    }
  }
  return 0;
};

const normalizeMonthLabel = (item) =>
  item?.month_label ||
  item?.monthLabel ||
  item?.month ||
  item?.label ||
  item?.month_name ||
  "";

const getChartTotals = (item) => {
  const paid = getAnyNumber(item, [
    "TotalPaid",
    "totalPaid",
    "TotalCollected",
    "total_collected",
    "Paid",
    "paid",
    "paidAmount",
    "paid_amount",
    "amount_paid",
    "total_paid",
  ]);

  const unpaid = getAnyNumber(item, [
    "Unpaid",
    "unpaid",
    "unpaidAmount",
    "unpaid_amount",
    "TotalDue",
    "totalDue",
    "dueAmount",
    "due_amount",
    "Pending",
    "pending",
  ]);

  let expected = getAnyNumber(item, [
    "TotalExpected",
    "totalExpected",
    "Expected",
    "expected",
    "total_expected",
    "TotalFee",
    "total_fee",
    "totalFee",
  ]);

  if (expected === 0 && (paid > 0 || unpaid > 0)) {
    expected = paid + unpaid;
  }

  return { paid, expected };
};

// =======================================================
// CHART POPUP COMPONENT
// =======================================================
const FeeChartPopup = ({ title, data, loading, onClose, fromDate, toDate }) => {
  if (!title) return null;

  const popupStyle = {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center",
    alignItems: "center", padding: "10px", zIndex: 2000
  };
  const contentStyle = {
    width: "90%", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto",
    background: "#fff", borderRadius: "8px", padding: "15px", display: "flex",
    flexDirection: "column",
  };

  return (
    <div style={popupStyle}>
      <div style={contentStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "15px", fontSize: "18px" }}>{title}</h2>
        {fromDate && toDate && (
          <p style={{ textAlign: "center", fontSize: "14px", color: "#555" }}>
            From: {fromDate} &nbsp;&nbsp; To: {toDate}
          </p>
        )}
        {loading ? (
          <p style={{ textAlign: "center", fontSize: "14px" }}>Loading chart data...</p>
        ) : data.length === 0 ? (
          <p style={{ textAlign: "center", fontSize: "14px" }}>No chart data found for the selected period.</p>
        ) : (
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month_label" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                <Legend />
                <Bar dataKey="TotalCollected" fill="#3498db" name="Total Paid Fee" />
                <Bar dataKey="TotalExpected" fill="#e74c3c" name="Total  Fee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <button
          onClick={onClose}
          style={{
            marginTop: "15px", padding: "6px 12px", background: "rgba(141,171,182,255)",
            color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer",
            alignSelf: 'flex-end', fontSize: "12px",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// =======================================================
// LIST POPUP COMPONENT
// =======================================================
const FeeDetailsPopup = ({
  title,
  data,
  loading,
  onClose,
  fromDate,
  toDate
}) => {
  if (!title) return null;

  // 🔹 Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const ROWS_PER_PAGE = 10;

  const formatINR = (value) => {
    if (value === null || value === undefined || value === "") return "₹0.00";
    const numberValue = Number(
      typeof value === "string" ? value.replace(/₹|,/g, "") : value
    );
    if (isNaN(numberValue)) return value;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2
    }).format(numberValue);
  };

  const getAnyNumber = (row, keys) => {
    for (const key of keys) {
      const v = row?.[key];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        const cleaned = String(v).replace(/[^\d.-]/g, "");
        const num = Number(cleaned);
        if (!Number.isNaN(num)) return num;
      }
    }
    return 0;
  };

  const isAmountField = (key) =>
    key.toLowerCase().match(/amount|fee|paid|due|expected/);

  const filteredData = Array.isArray(data)
    ? data.filter((row) => {
        const name =
          row?.StudentName ??
          row?.student_name ??
          row?.name ??
          row?.studentName ??
          null;
        return name !== null && name !== undefined && String(name).trim() !== "";
      })
    : [];

  const dataToDisplay = loading ? [] : filteredData;

  const totalPages = Math.ceil(dataToDisplay.length / ROWS_PER_PAGE);

  const paginatedData = dataToDisplay.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [dataToDisplay.length]);

  const getHeaders = (rows) =>
    rows.length === 0 ? [] : Object.keys(rows[0]);

  const headers = getHeaders(dataToDisplay);

  const getAmountValue = (row, header) => {
    let value = row?.[header];
    const hasValue = value !== undefined && value !== null && String(value).trim() !== "";
    const numericZero = hasValue && !Number.isNaN(Number(String(value).replace(/[^\d.-]/g, ""))) && Number(String(value).replace(/[^\d.-]/g, "")) === 0;

    if (!hasValue || numericZero) {
      if (/tuition/i.test(header)) {
        value = getAnyNumber(row, ["TuitionPaid", "tuition_paid", "Paid_Amount", "paid_amount", "amount_paid"]);
      } else if (/books|uniform/i.test(header)) {
        value = getAnyNumber(row, ["Books_Uniform_Paid", "books_uniform_paid", "books_paid", "uniform_paid"]);
      } else if (/bus/i.test(header)) {
        value = getAnyNumber(row, ["Bus_Paid", "bus_paid"]);
      } else if (/admission/i.test(header)) {
        value = getAnyNumber(row, ["Admission_paid", "admission_paid"]);
      }
    }

    return value;
  };

const popupStyle = {
  position: "fixed",

  width: "100vw",
  height: "100%",
  backdropFilter: "blur(5px)", // Blur effect for the background
  WebkitBackdropFilter: "blur(5px)", // For Safari support
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

  const thStyle = {
    padding: "8px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "12px",
    border: "2px solid #ccc"
  };

  const tdStyle = {
    padding: "6px",
    fontSize: "12px",
    border: "1px solid #e0e0e0"
  };

  const actionBtnContainerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "flex-start",
  alignSelf: "flex-start",
  gap: "10px",
  marginBottom: "0",
  marginTop: "-25px"
};




  const handleDownloadCSV = (rows, filename) => {
    if (!rows || rows.length === 0) {
      alert("No data to download.");
      return;
    }

    const SEPARATOR = "\t";
  const headers = Object.keys(rows[0]);

    const headerRow = headers
      .map(
        (h) =>
          `"${h
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .trim()}"`
      )
      .join(SEPARATOR);

    const csvRows = rows.map((row) =>
      headers
        .map((h) => {
          const value = isAmountField(h) ? getAmountValue(row, h) : row[h];
          return `"${String(value ?? "").replace(/\n/g, " ")}"`;
        })
        .join(SEPARATOR)
    );

    const blob = new Blob([[headerRow, ...csvRows].join("\n")], {
      type: "application/vnd.ms-excel;charset=utf-8;"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
const handlePrint = () => {
  if (!dataToDisplay || dataToDisplay.length === 0) return;

  const printWindow = window.open("", "_blank");
  const headersHtml = headers
    .map(
      (h) =>
        `<th style="border:1px solid #000;padding:5px;text-align:center;background:#ccc;">${h
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .trim()}</th>`
    )
    .join("");

  const rowsHtml = dataToDisplay
    .map(
      (row) =>
        `<tr>
          ${headers
            .map(
              (h) =>
                `<td style="border:1px solid #000;padding:5px;text-align:${
                  isAmountField(h) ? "right" : "center"
                };">${isAmountField(h) ? formatINR(getAmountValue(row, h)) : row[h] ?? ""}</td>`
            )
            .join("")}
        </tr>`
    )
    .join("");

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h2 { text-align: center; }
          p { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #000; padding: 5px; font-size: 12px; }
          th { background: #ccc; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${fromDate && toDate ? `<p>From: ${fromDate} &nbsp;&nbsp; To: ${toDate}</p>` : ""}
        <table>
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};

  return (
    <div style={popupStyle} onClick={onClose}>
      <div
        style={contentStyle}
        onClick={(e) => e.stopPropagation()}
        className="popup-printable"
      >
       <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "flex-start",
    marginBottom: "5px"
  }}
>
  <div />

  <h2 style={{ textAlign: "center", margin: "0", lineHeight: "1.1", fontSize: "16px" }}>{title}</h2>

  <div style={actionBtnContainerStyle} className="no-print">
    <button
      className="actionBtnStyle"
      style={{ padding: 0, lineHeight: 1 }}
      onClick={() =>
        handleDownloadCSV(dataToDisplay, title.replace(/\s/g, "_"))
      }
    >
      <FontAwesomeIcon icon={faDownload} />
    </button>

    <button
      className="actionBtnStyle"
      style={{ padding: 0, lineHeight: 1 }}
      onClick={handlePrint}
    >
      <FontAwesomeIcon icon={faPrint} />
    </button>

    <button
      className="actionBtnStyle"
      style={{ padding: 0, lineHeight: 1 }}
      onClick={() =>
        navigator.share
          ? navigator.share({
              title,
              text: `Fee report from ${fromDate} to ${toDate}`,
              url: window.location.href
            })
          : alert("Web Share API not supported")
      }
    >
      <FontAwesomeIcon icon={faShareAlt} />
    </button>

    <button
      className="actionBtnStyle"
      style={{ padding: 0, lineHeight: 1 }}
      onClick={onClose}
    >
      <FontAwesomeIcon icon={faTimes} />
    </button>
  </div>
</div>


{fromDate && toDate && (
  <p
    style={{
      textAlign: "center",
      color: "#111",
      marginTop: "6px",
      fontSize: "12px",
      fontFamily: "inherit",
      fontWeight: 400
    }}
  >
    From: {fromDate} &nbsp;&nbsp; To: {toDate}
  </p>
)}
 

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading...</p>
        ) : paginatedData.length === 0 ? (
          <p style={{ textAlign: "center" }}>No records found.</p>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0A4D82", color: "#fff" }}>

                  {headers.map((header) => (
                    <th key={header} style={thStyle}>
                      {header
                        .replace(/([A-Z])/g, " $1")
                        .replace(/_/g, " ")
                        .trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? "#fafafa" : "#f1f6fa"
                    }}
                  >
                    {headers.map((header) => (
                      <td
                        key={header}
                        style={{
                          ...tdStyle,
                          textAlign: isAmountField(header)
                            ? "right"
                            : "center"
                        }}
                      >
                        {isAmountField(header)
                          ? formatINR(getAmountValue(row, header))
                          : row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 🔹 Pagination Controls */}
            {totalPages > 1 && (
             <div
  className="no-print"
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginTop: "15px",
    fontSize: "13px",
    fontWeight: "bold",
    lineHeight: "1",
    flexWrap: "nowrap"
  }}
>
  <button
    className="actionBtnStyle"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      verticalAlign: "middle",
      lineHeight: "1",
      height: "26px",
      minWidth: "26px",
      padding: "0 8px",
      margin: 0
    }}
    disabled={currentPage === 1}
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
  >
    &lt;
  </button>

  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      verticalAlign: "middle",
      lineHeight: "1",
      margin: 0
    }}
  >
    Page {currentPage} / {totalPages}
  </span>

  <button
    className="actionBtnStyle"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      verticalAlign: "middle",
      lineHeight: "1",
      height: "26px",
      minWidth: "26px",
      padding: "0 8px",
      margin: 0
    }}
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
  >
    &gt;
  </button>
</div>
 
            )}
          </>
        )}

 <style>
{`
  @media print {
    body * {
      visibility: hidden;
    }
    .popup-printable, .popup-printable * {
      visibility: visible;
    }
    .popup-printable {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: auto;
      padding: 0;
      margin: 0;
      background: #fff;
      box-shadow: none;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      page-break-inside: auto;
    }
    th, td {
      border: 1px solid #000 !important;
      padding: 5px !important;
      font-size: 12px !important;
    }
    th {
      background: #ccc !important;
      color: #000 !important;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    h2, p {
      text-align: center !important;
      color: #000 !important;
    }
    .no-print {
      display: none !important;
    }
  }
`}
</style>

      </div>
    </div>
  );
};
export default function IncomeChief() {
  // ------------------------------
  // COMMON STYLES
  // ------------------------------
  const outerContainer = {
    width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
    background: "#fff", minHeight: "70vh", padding: "0", boxSizing: "border-box",
  };
  const innerContainer = {
    width: "90%", maxWidth: "1000px", display: "flex",
    background: "#fff",
     flexDirection: "column",
  };
  const headingStyle = {
    position: "absolute",
    top: "15px",
    left: "5px",
    fontSize: "16px",
    fontWeight: "800",
    color: "#2F2E2EFF",
    textAlign: "left",
    width: "auto",
    marginLeft: "2%"
  };
 const topRowContainer = { display: "flex", gap: "10px", marginBottom: "10px" };
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
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    width:'30px',
    height:'30px'
  };
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

  // ------------------------------
  // STATE & DATA FETCHING
  // ------------------------------
  const [schoolCode, setSchoolCode] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // LIST POPUP STATES
  const [showFeeDetailsPopup, setShowFeeDetailsPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupData, setPopupData] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);

  // CHART POPUP STATES
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [chartTitle, setChartTitle] = useState("");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  // FEES AGGREGATE STATE
  const [feeTotals, setFeeTotals] = useState({
    totalPaid: 0,
    totalDue: 0,
    totalPaidTuitionFee: 0,
    totalBooksUniformPaid: 0,
    totalBusPaid: 0,
    totalAdmissionPaid: 0,
  });
  const [ledgerTotals, setLedgerTotals] = useState({
    totalPaid: 0,
    balance: 0,
  });

  // DYNAMIC COUNTS
  const [feesReportCount, setFeesReportCount] = useState(0);
  const [feesGraphCount, setFeesGraphCount] = useState(0);
  const [highlyOverdueCount, setHighlyOverdueCount] = useState(0);
  const [busFeesPendingCount, setBusFeesPendingCount] = useState(0);

  // Set default dates: from = same day last month, to = today
  useEffect(() => {
    const toLocalISO = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const now = new Date();
    const targetMonth = now.getMonth() - 6;
    let from = new Date(now.getFullYear(), targetMonth, now.getDate());

    // Clamp if target month has fewer days
    if (from.getMonth() !== ((targetMonth + 12) % 12)) {
      from = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    setFromDate(toLocalISO(from));
    setToDate(toLocalISO(now));
  }, []);

  // Load schoolCode from localStorage
  useEffect(() => {
    try {
      const storedCode = localStorage.getItem('schoolCode');
      setSchoolCode(storedCode);
      if (!storedCode) {
        console.warn("School Code not found in localStorage. API calls may fail.");
      }
    } catch (e) {
      console.error("Could not access localStorage:", e);
    }
  }, []);

  // Fetch report data
  const fetchReportData = async () => {
    if (!fromDate || !toDate || !schoolCode) {
      setFeeTotals({
        totalPaid: 0, totalDue: 0,
        totalPaidTuitionFee: 0, totalBooksUniformPaid: 0,
        totalBusPaid: 0, totalAdmissionPaid: 0
      });
      if (!schoolCode) console.warn("API call skipped: schoolCode not available.");
      return;
    }

    try {
      const feeSummaryRes = await axios.get(
        `${API_BASE_URL}/api/fee-summary-chief?fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
      );
      const summary = feeSummaryRes?.data || {};
      let totalPaidTuitionFee = getAnyNumber(summary, [
        "totalPaidTuitionFee",
        "TotalPaidTuitionFee",
        "total_tuition_paid",
        "TuitionPaid",
      ]);

      // Fallback: compute tuition total from report data if summary is missing/zero
      if (!totalPaidTuitionFee) {
        try {
          const tuitionRes = await axios.get(
            `${API_BASE_URL}/api/fee-records?type=TuitionPaidReport&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
          );
          const rows = Array.isArray(tuitionRes.data)
            ? tuitionRes.data
            : tuitionRes.data?.data || tuitionRes.data?.records || [];
          totalPaidTuitionFee = rows.reduce((sum, row) => {
            return sum + getAnyNumber(row, ["TuitionPaid", "tuition_paid", "Paid_Amount", "paid_amount", "amount_paid"]);
          }, 0);
        } catch (err) {
          console.error("Error fetching tuition paid report:", err);
        }
      }

      setFeeTotals({
        totalPaid: getAnyNumber(summary, ["totalPaid", "TotalPaid", "total_paid"]),
        totalDue: getAnyNumber(summary, ["totalDue", "TotalDue", "total_due", "balance", "Balance"]),
        totalPaidTuitionFee,
        totalBooksUniformPaid: getAnyNumber(summary, [
          "totalBooksUniformPaid",
          "TotalBooksUniformPaid",
          "total_books_uniform_paid",
          "Books_Uniform_Paid",
        ]),
        totalBusPaid: getAnyNumber(summary, ["totalBusPaid", "TotalBusPaid", "total_bus_paid", "Bus_Paid"]),
        totalAdmissionPaid: getAnyNumber(summary, [
          "totalAdmissionPaid",
          "TotalAdmissionPaid",
          "total_admission_paid",
          "Admission_paid",
        ]),
      });
    } catch (err) {
      console.error("Error fetching monthly report:", err);
      setFeeTotals({
        totalPaid: 0, totalDue: 0,
        totalPaidTuitionFee: 0, totalBooksUniformPaid: 0,
        totalBusPaid: 0, totalAdmissionPaid: 0
      });
    }
  };
  const fetchLedgerTotals = async () => {
    if (!schoolCode) return;

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fees-summary-ledgerData`,
        { params: { schoolCode } }
      );

      const data = res?.data || {};
      setLedgerTotals({
        totalPaid: getAnyNumber(data, ["totalPaid", "TotalPaid", "total_paid", "paidTotal"]),
        balance: getAnyNumber(data, ["balance", "Balance", "totalDue", "total_due", "dueTotal"]),
      });
    } catch (err) {
      console.error("Error fetching ledger totals:", err);
      setLedgerTotals({ totalPaid: 0, balance: 0 });
    }
  };
  // Fetch dynamic counts
  const fetchDynamicCounts = async () => {
    if (!fromDate || !toDate || !schoolCode) return;

    try {
      // Fees Report Count
      const feesReportRes = await axios.get(
        `${API_BASE_URL}/api/fee-records?type=AllFeesStatusReport&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
      );
      setFeesReportCount(feesReportRes.data.length);

      // Fees Graph Count
      const feesGraphRes = await axios.get(
        `${API_BASE_URL}/api/fee-chart-data?fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
      );
      setFeesGraphCount(feesGraphRes.data.length);

      // Highly Overdue Count
      const overdueRes = await axios.get(
        `${API_BASE_URL}/api/fee-records?type=HighlyUnpaidList&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
      );
      setHighlyOverdueCount(overdueRes.data.length);

      // Bus Fees Pending Count
      const busRes = await axios.get(
        `${API_BASE_URL}/api/fee-records?type=BusFeesPendingList&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
      );
      setBusFeesPendingCount(busRes.data.length);
    } catch (err) {
      console.error("Error fetching dynamic counts:", err);
    }
  };

  useEffect(() => {
    fetchReportData();
    fetchDynamicCounts();
  }, [fromDate, toDate, schoolCode]);
  useEffect(() => {
    fetchLedgerTotals();
  }, [schoolCode]);

  // ------------------------------
  // HANDLERS
  // ------------------------------
  const closeFeeDetailsPopup = () => {
    setShowFeeDetailsPopup(false);
    setPopupTitle("");
    setPopupData([]);
  };

  const handleView = async (type) => {
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates first.");
      return;
    }
    if (!schoolCode) {
      alert("School code not available. Cannot fetch data.");
      return;
    }

    setPopupLoading(true);
    setShowFeeDetailsPopup(true);
    setPopupTitle(`Loading list for ${type}...`);
    setPopupData([]);

    try {
      const response = await axios.get(
        `https://cleezoclass.com:4000/api/fee-records?type=${type}&fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
      );
      const rows = Array.isArray(response.data)
        ? response.data
        : response.data?.data || response.data?.records || [];

      let title = '';
      if (type.includes('Unpaid')) title = "Highly Overdue Students List";
      else if (type.includes('Pending')) title = "Students with Bus Fees Pending";
      else if (type.includes('Tuition')) title = "Students who Paid Tuition Fees";
      else if (type.includes('BooksUniform')) title = "Students who Paid Books & Uniform Fees";
      else if (type.includes('BusPaid')) title = "Students who Paid Bus Fees";
      else if (type.includes('Admission')) title = "Students who Paid Admission Fees";
      else if (type === 'TotalPaidList') title = `Students with paid list from ${fromDate} to ${toDate}`;
      else if (type === 'TotalDueList') title = `Students with Pending Dues from ${fromDate} to ${toDate}`;
      else if (type.includes('AllFeesStatusReport')) title = `Comprehensive Fee Status from ${fromDate} to ${toDate}`;

      setPopupTitle(title);
      setPopupData(rows.length ? rows : [{ detail: "No records found." }]);
      setPopupLoading(false);

    } catch (err) {
      console.error(`Error fetching list for ${type}:`, err);
      setPopupTitle(`Error fetching ${type} list.`);
      setPopupData([{ detail: "Failed to load data from the server." }]);
      setPopupLoading(false);
    }
  };

  const closeChartPopup = () => {
    setShowChartPopup(false);
    setChartTitle("");
    setChartData([]);
  };

  const handleViewChart = async () => {
    if (!fromDate || !toDate) {
      alert("Please select both From and To dates first.");
      return;
    }
    if (!schoolCode) {
      alert("School code not available. Cannot fetch chart data.");
      return;
    }

    setChartLoading(true);
    setShowChartPopup(true);
    setChartTitle("Loading Monthly Fees Trend Graph...");
    setChartData([]);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/fee-chart-data?fromDate=${fromDate}&toDate=${toDate}&schoolCode=${schoolCode}`
      );

      const rows = Array.isArray(response.data)
        ? response.data
        : response.data?.data || response.data?.records || [];

      const formattedData = rows.map(item => {
        const { paid, expected } = getChartTotals(item);
        return {
          month_label: normalizeMonthLabel(item),
          TotalCollected: paid,
          TotalExpected: expected,
        };
      });

      setChartTitle(`Monthly Fees Collection Trend from ${fromDate} to ${toDate}`);
      setChartData(formattedData);
      setChartLoading(false);

    } catch (err) {
      console.error("Error fetching chart data:", err);
      setChartTitle("Error fetching Fees Chart.");
      setChartData([]);
      setChartLoading(false);
    }
  };

  // ------------------------------
  // JSX RENDER
  // ------------------------------
  return (
    <div style={outerContainer}>
           <h2
        style={headingStyle}
        data-guide="guide-income-popup-title"
      >
        Income
      </h2>

      <div style={innerContainer}>
        <div style={topRowContainer}>
          <div style={leftColumn}>
            <div style={cardLarge}>
              <div
  data-guide="income-date-filter"
  style={{ marginBottom: "20px", textAlign: "right", paddingBottom: "10px" }}
>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div>
                    <label style={{ fontSize: "12px", marginRight: "5px" }}>From:</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      style={{ padding: "4px", fontSize: "12px", borderRadius: "6px", border: "1px solid #000" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", marginRight: "5px" }}>To:</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      style={{ padding: "4px", fontSize: "12px", borderRadius: "6px", border: "1px solid #000" }}
                    />
                  </div>
                </div>
                {!schoolCode && (
                  <p style={{ color: 'red', fontSize: '10px', marginTop: '5px' }}>
                    School code not found. Some features may not work.
                  </p>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", gap: "15px", marginBottom: "15px" }}>
                <div
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
                    <h4
  data-guide="income-fees-report"
  style={{ fontSize: "12px", margin: "5px 0 0 0" }}
>
  Fees Report
</h4>
                  </div>
                  <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>{feesReportCount}</p>
                  <button
  data-guide="income-btn-fees-report"
  className="btn-outline"
  onClick={() => handleView("AllFeesStatusReport")}
>
  View Report
</button>

                </div>
                <div
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
                    <FontAwesomeIcon icon={faChartBar} style={iconStyle} />
                    <h4
  data-guide="income-fees-graph"
  style={{ fontSize: "12px", margin: "5px 0 0 0" }}
>
  Fees Graph
</h4>
                  </div>
                  <p style={{ fontSize: "30px", fontWeight: "400px", margin: "0" }}>{feesGraphCount}</p>
                  <button  data-guide="income-btn-fees-graph" className="btn-outline" onClick={handleViewChart}>View Graph</button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #ccc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop:'20px' }}>
                  <h2
  data-guide="income-highly-overdue"
  style={{ fontSize: "12px", margin: 0 }}
>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: "5px", fontSize: "12px" }} />
                    {highlyOverdueCount} Highly Overdue
                  </h2>
                  <button data-guide="income-btn-highly-overdue-list"  onClick={() => handleView("HighlyUnpaidList")} className="btn-outline">View List</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2
  data-guide="income-bus-pending"
  style={{ fontSize: "12px", margin: 0 }}
>
                    <FontAwesomeIcon icon={faAward} style={{ marginRight: "5px", fontSize: "12px" }} />
                    {busFeesPendingCount} Bus Fees Pending
                  </h2>
                  <button data-guide="income-btn-bus-pending-list" onClick={() => handleView("BusFeesPendingList")} className="btn-outline">View List</button>
                </div>
              </div>
            </div>
          </div>
          <div style={rightColumn}>
        <div style={card}>
  <h3
  data-guide="income-total-due"
  style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}
>
  Total Due
</h3>
  <p style={{ fontSize: "30px", fontWeight: "400", margin: "0 0 5px 0", color: "#e74c3c" }}>
    {(Number(ledgerTotals.balance) || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
  </p>
  <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
    <button data-guide="income-btn-total-due-list"  className="btn-outline" onClick={() => handleView("TotalDueList")}>
      View Due List
    </button>
  </div>
</div>

        <div style={card}>
  <h3
  data-guide="income-total-paid"
  style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 5px 0" }}
>
  Total Paid
</h3>
  <p style={{ fontSize: "30px", fontWeight: "400", margin: "0 0 5px 0", color: "#3498db" }}>
    {(Number(ledgerTotals.totalPaid) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
  </p>
  <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
    <button data-guide="income-btn-total-paid-list" onClick={() => handleView("TotalPaidList")} className="btn-outline">
      View Paid List
    </button>
  </div>
</div>

          </div>
        </div>
        <div style={bottomRowContainer}>
          <div style={cardLarge}>
            <div style={{ flex: "0 0 auto", borderRadius: "8px", padding: "15px", background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "5px" }}>
                <div
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
                    <h4
  data-guide="income-tuition"
  style={{ fontSize: "12px", margin: "5px 0 0 0" }}
>Total Tuition Fees</h4>
                  </div>
                  <p style={{ fontSize: "30px", fontWeight: "400px", margin: '5px 0' }}>
                    {(Number(feeTotals.totalPaidTuitionFee ?? 0)).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                  </p>
                  <button data-guide="income-btn-tuition-report"  onClick={() => handleView("TuitionPaidReport")} className="btn-outline">View Report</button>
                </div>
                <div
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
                    <h4
  data-guide="income-books-uniform"
  style={{ fontSize: "12px", margin: "5px 0 0 0" }}
>
  Total Books & Uniform Fees
</h4>
                  </div>
                 <p style={{ fontSize: "30px", fontWeight: "400", margin: '5px 0', color: "#2c3e50" }}>
  {(Number(feeTotals.totalBooksUniformPaid) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
</p>

                  <button data-guide="income-btn-books-uniform-report" onClick={() => handleView("BooksUniformPaidReport")} className="btn-outline">View Report</button>
                </div>
                <div
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
                    <h4
  data-guide="income-bus-fees"
  style={{ fontSize: "12px", margin: "5px 0 0 0" }}
>
  Total Bus Fees
</h4>
                  </div>
                 <p style={{ fontSize: "30px", fontWeight: "400", margin: '5px 0', color: "#2c3e50" }}>
  {(Number(feeTotals.totalBusPaid) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
</p>

                  <button data-guide="income-btn-bus-report"
 onClick={() => handleView("BusPaidReport")} className="btn-outline">View Report</button>
                </div>
                <div
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
                    <h4
  data-guide="income-admission-fees"
  style={{ fontSize: "12px", margin: "5px 0 0 0" }}
>
  Total Admission Fees
</h4>
                  </div>
                 <p style={{ fontSize: "30px", fontWeight: "400", margin: '5px 0', color: "#2c3e50" }}>
  {(Number(feeTotals.totalAdmissionPaid) || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
</p>

                  <button data-guide="income-btn-admission-report" onClick={() => handleView("AdmissionPaidReport")} className="btn-outline">View Report</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFeeDetailsPopup && (
        <FeeDetailsPopup
          title={popupTitle}
          data={popupData}
          loading={popupLoading}
          fromDate={fromDate}
          toDate={toDate}
          onClose={closeFeeDetailsPopup}
        />
      )}

      {showChartPopup && (
        <FeeChartPopup
          title={chartTitle}
          data={chartData}
          loading={chartLoading}
          fromDate={fromDate}
          toDate={toDate}
          onClose={closeChartPopup}
        />
      )}
    </div>
  );
}
