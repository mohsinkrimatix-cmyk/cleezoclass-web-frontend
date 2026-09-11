// frontend/src/FeePaymentModal.js
import React, { useState } from "react";
import axios from "axios";

const FeePaymentModal = ({ showPopup, handleClosePopup, studentData }) => {
  // Fee state
  const [feeEntries, setFeeEntries] = useState([]);
  const [showInstallments, setShowInstallments] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [cashAmount, setCashAmount] = useState(0);
  const [onlineAmount, setOnlineAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fee data (could come from props or API)
  const {
    admissionFee = 0,
    admissionPaid = 0,
    tuitionFee = 0,
    tuitionPaid = 0,
    busFee = 0,
    busPaid = 0,
    examFee = 0,
    examPaid = 0,
    bookFee = 0,
    bookPaid = 0,
    uniformFee = 0,
    uniformPaid = 0,
    othersFee = 0,
    othersPaid = 0,
    installments = {}, // e.g., { installment1: 2000, installment2: 1500 }
  } = studentData;

  // Mapping labels to backend keys
  const feeLabelToKey = {
    "Admission Fee": "Admission_fees",
    "Tuition Fee": "Tuition_fees",
    "Bus Fee": "Bus_fees",
    "Exam Fee": "Exam_fees",
    "Books Fee": "Book_Fees",
    "Uniform Fee": "Uniform_fees",
    "Other Fees": "Others",
  };

  // Example installments options
  const installmentOptions = [
    { installment: 1, amount: installments.installment1 || 0 },
    { installment: 2, amount: installments.installment2 || 0 },
    { installment: 3, amount: installments.installment3 || 0 },
    { installment: 4, amount: installments.installment4 || 0 },
    { installment: 5, amount: installments.installment5 || 0 },
  ];

  // Receipt number formatter (dummy)
  const formatReceiptNumber = () => `RCPT-${Date.now()}`;

  // Handle submission
  const handlePaymentSubmission = async () => {
    setIsLoading(true);
    try {
      const payload = {
        StudentName: studentData.StudentName,
        Class_name: studentData.Class_name,
        section: studentData.section,
        Paid_Amount: feeEntries.reduce((sum, f) => sum + (f.amount || 0), 0),
        paymentDate,
        paymentMode,
        transactionId,
        feeDetails: feeEntries,
      };

      const res = await axios.post("https://cleezoclass.com:5000/api/feesdetails", payload);
      alert("Fees submitted successfully!");
      handleClosePopup();
    } catch (err) {
      console.error(err);
      alert("Error submitting fees.");
    }
    setIsLoading(false);
  };

  if (!showPopup) return null;

  return (
    <div
      className="income-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && handleClosePopup()}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.3)", zIndex: 1000 }}
    >
      <div
        className="payment-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", padding: 20, borderRadius: 10, display: "flex", gap: 20, maxWidth: "900px", margin: "50px auto" }}
      >
        {/* LEFT: Fee Table */}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Fee Type</th>
                <th>Total</th>
                <th>Remaining</th>
                <th>Pay Now</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Admission Fee", total: admissionFee, paid: admissionPaid },
                { label: "Tuition Fee", total: tuitionFee, paid: tuitionPaid },
                { label: "Bus Fee", total: busFee, paid: busPaid },
                { label: "Exam Fee", total: examFee, paid: examPaid },
                { label: "Books Fee", total: bookFee, paid: bookPaid },
                { label: "Uniform Fee", total: uniformFee, paid: uniformPaid },
                { label: "Other Fees", total: othersFee, paid: othersPaid },
              ].map((fee, idx) => {
                const remaining = fee.total - fee.paid;
                return (
                  <tr key={idx} onMouseEnter={() => fee.label === "Tuition Fee" && setShowInstallments(true)} onMouseLeave={() => setShowInstallments(false)}>
                    <td style={{ position: "relative", padding: 5, border: "1px solid #ccc" }}>
                      {fee.label}

                      {/* Tuition Installment Popup */}
                      {fee.label === "Tuition Fee" && showInstallments && (
                        <div style={{ position: "absolute", top: "100%", right: -220, background: "#fff", border: "1px solid #ccc", borderRadius: 8, width: 200, padding: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.2)", zIndex: 999 }}>
                          <strong>Select Installment</strong>
                          <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
                            {installmentOptions.map((inst) => {
                              const original = Number(inst.amount);
                              const paid = Number(installments[`installment${inst.installment}`] || 0);
                              const remainingAmt = original - paid;
                              const isPaid = remainingAmt <= 0;

                              return (
                                <li
                                  key={inst.installment}
                                  onClick={() => {
                                    if (isPaid) return;
                                    const updated = [...feeEntries];
                                    updated[idx] = { ...updated[idx], type: feeLabelToKey["Tuition Fee"], installmentId: inst.installment, amount: remainingAmt };
                                    setFeeEntries(updated);
                                    setShowInstallments(false);
                                  }}
                                  style={{ padding: 6, cursor: isPaid ? "not-allowed" : "pointer", color: isPaid ? "#aaa" : "#000", background: isPaid ? "#f5f5f5" : "transparent" }}
                                >
                                  {isPaid ? `Installment ${inst.installment} — Paid` : `Installment ${inst.installment} — Rs. ${remainingAmt.toFixed(2)}`}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Other Fees Description */}
                      {fee.label === "Other Fees" && (
                        <input
                          value={feeEntries[idx]?.description || ""}
                          onChange={(e) => {
                            const updated = [...feeEntries];
                            updated[idx] = { ...updated[idx], description: e.target.value, type: feeLabelToKey[fee.label] };
                            setFeeEntries(updated);
                          }}
                          placeholder="Description (optional)"
                          style={{ display: "block", marginTop: 5, width: "100%" }}
                        />
                      )}
                    </td>

                    <td style={{ border: "1px solid #ccc", textAlign: "right", padding: 5 }}>Rs. {fee.total.toFixed(2)}</td>
                    <td style={{ border: "1px solid #ccc", textAlign: "right", padding: 5 }}>Rs. {remaining.toFixed(2)}</td>
                    <td style={{ border: "1px solid #ccc", textAlign: "right", padding: 5 }}>
                      <input
                        type="text"
                        value={feeEntries[idx]?.raw || ""}
                        onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9.]/g, "");
                          if (val.split(".").length > 2) return;
                          const num = parseFloat(val) || 0;
                          if (fee.label !== "Other Fees" && num > remaining) return;
                          const updated = [...feeEntries];
                          updated[idx] = { ...(updated[idx] || {}), raw: val, amount: num, type: feeLabelToKey[fee.label] };
                          setFeeEntries(updated);
                        }}
                        placeholder="Enter Amount"
                        style={{ width: 100, textAlign: "right" }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RIGHT: Payment Details */}
        <div style={{ width: 300 }}>
          <div style={{ marginBottom: 10 }}>
            <label>Payment Date:</label>
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Receipt No:</label>
            <input type="text" value={formatReceiptNumber()} readOnly />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label>Payment Mode:</label>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="">-- Select Mode --</option>
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Card">Card</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash+Online">Cash+Online</option>
            </select>
          </div>

          {(paymentMode === "Online" || paymentMode === "Cash+Online") && (
            <div style={{ marginBottom: 10 }}>
              <label>Transaction ID:</label>
              <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
            </div>
          )}

          {paymentMode === "Cash+Online" && (
            <div style={{ marginBottom: 10 }}>
              <label>Cash Amount:</label>
              <input type="number" value={cashAmount} onChange={(e) => setCashAmount(Number(e.target.value))} />
              <label>Online Amount:</label>
              <input type="number" value={onlineAmount} onChange={(e) => setOnlineAmount(Number(e.target.value))} />
            </div>
          )}

          <button onClick={handlePaymentSubmission} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeePaymentModal;
