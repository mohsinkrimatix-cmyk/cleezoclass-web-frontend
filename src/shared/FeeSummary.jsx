import React, { useEffect, useState } from "react";
import axios from "axios";

const FeesSummary = () => {

  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalDiscount: 0,
    totalPaid: 0,
    balance: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

const fetchSummary = async () => {
  try {
    setLoading(true);

    const schoolCode = localStorage.getItem("schoolCode");

    const response = await axios.get(
      "https://cleezoclass.com:4000/api/fees-summary-ledgerData",
      {
        params: { schoolCode }
      }
    );

    if (response.data.success) {
      setSummary({
        totalAmount: Number(response.data.totalAmount) || 0,
        totalDiscount: Number(response.data.totalDiscount) || 0,
        totalPaid: Number(response.data.totalPaid) || 0,
        balance: Number(response.data.balance) || 0
      });
    } else {
      setError("Failed to load data");
    }

  } catch (err) {
    setError("Server error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  // ==============================
  // CALCULATIONS
  // ==============================

  const netAmount = summary.totalAmount - summary.totalDiscount;

  const calculatedBalance = netAmount - summary.totalPaid;

  const safeBalance = calculatedBalance;

  const duePercentage =
    netAmount > 0
      ? Math.max(0, ((safeBalance / netAmount) * 100)).toFixed(2)
      : 0;

  const paidPercentage =
    netAmount > 0
      ? Math.min(100, ((summary.totalPaid / netAmount) * 100)).toFixed(2)
      : 0;

  // ==============================

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading...</p>;
  }

  if (error) {
    return <p style={{ textAlign: "center", color: "red" }}>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>School Fees Summary</h2>

      <div style={styles.card}>
        <h3>Total Amount</h3>
        <p style={styles.amount}>
          ₹ {summary.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div style={styles.card}>
        <h3>Total Discount</h3>
        <p style={{ ...styles.amount, color: "#ff9800" }}>
          ₹ {summary.totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div style={{ ...styles.card, backgroundColor: "#e8f5e9" }}>
        <h3>Net Amount (After Discount)</h3>
        <p style={{ ...styles.amount, color: "#2e7d32" }}>
          ₹ {netAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div style={styles.card}>
        <h3>Total Paid</h3>
        <p style={{ ...styles.amount, color: "green" }}>
          ₹ {summary.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div style={{ ...styles.card, backgroundColor: "#ffe6e6" }}>
        <h3>Balance</h3>
        <p style={{ ...styles.amount, color: safeBalance < 0 ? "green" : "red" }}>
          ₹ {safeBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </div>

      <div style={{ ...styles.card, backgroundColor: "#fff3cd" }}>
        <h3>Due Percentage</h3>
        <p style={{ ...styles.amount, color: "#d32f2f" }}>
          {duePercentage} %
        </p>
      </div>

      <div style={{ ...styles.card, backgroundColor: "#e3f2fd" }}>
        <h3>Paid Percentage</h3>
        <p style={{ ...styles.amount, color: "#1565c0" }}>
          {paidPercentage} %
        </p>
      </div>

    </div>
  );
};

const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "20px",
    textAlign: "center",
    fontFamily: "Arial"
  },
  title: {
    marginBottom: "30px"
  },
  card: {
    padding: "20px",
    margin: "20px 0",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    backgroundColor: "#ffffff"
  },
  amount: {
    fontSize: "20px",
    fontWeight: "bold",
    marginTop: "10px"
  }
};

export default FeesSummary;
