import React, { useState } from "react";

const ExpenseForm = () => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [expenses, setExpenses] = useState([{ name: "", description: "" }]);

  // Add new expense field
  const addExpenseField = () => setExpenses([...expenses, { name: "", description: "" }]);

  // Remove expense field
  const removeExpenseField = (index) => {
    const list = [...expenses];
    list.splice(index, 1);
    setExpenses(list);
  };

  // Handle expense input change
  const handleExpenseChange = (index, field, value) => {
    const list = [...expenses];
    list[index][field] = value;
    setExpenses(list);
  };

const handleSubmit = async () => {
  if (!categoryName.trim()) {
    alert("Category name is required!");
    return;
  }

  const validExpenses = expenses.filter(
    (e) => e.name.trim() !== ""
  );

  if (!validExpenses.length) {
    alert("Add at least one expense");
    return;
  }

  const schoolCode = localStorage.getItem("schoolCode");

  try {
    for (let exp of validExpenses) {
      await fetch("https://cleezoclass.com:4000/api/admin/add-expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolCode,
          categoryName,
          categoryDescription,
          expenseName: exp.name,
          expenseDescription: exp.description,
        }),
      });
    }

    alert("All data saved!");

    setCategoryName("");
    setCategoryDescription("");
    setExpenses([{ name: "", description: "" }]);

    // Refresh page
    window.location.reload();

  } catch (error) {
    console.error("Error saving expenses:", error);
    alert("Failed to save data");
  }
};
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "20px auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        border: "1px solid #ddd",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
      }}
    >
      <h2 style={{ marginBottom: 20, color: "#333", fontSize:'14px' }}>Category & Expenses</h2>

      {/* ===== CATEGORY ROW ===== */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Category Name"
          value={categoryName}
          onChange={e => setCategoryName(e.target.value)}
         className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}

        />
        <input
          placeholder="Category Description"
          value={categoryDescription}
          onChange={e => setCategoryDescription(e.target.value)}
         className="btn-dropdown-FeesManagement"   style={{ width: '100%' }}

        />
      </div>

      {/* ===== EXPENSES ROW ===== */}
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 20
  }}
>
  {expenses.map((exp, idx) => (
    <div
      key={idx}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto", // Name | Description | remove btn
        gap: 10,
        width: "100%",
        alignItems: "center"
      }}
    >
      <input
        placeholder="Expense Name"
        value={exp.name}
        onChange={e => handleExpenseChange(idx, "name", e.target.value)}
        className="btn-dropdown-FeesManagement"
        style={{ width: "100%" }}
      />

      <input
        placeholder="Expense Description"
        value={exp.description}
        onChange={e => handleExpenseChange(idx, "description", e.target.value)}
        className="btn-dropdown-FeesManagement"
        style={{ width: "100%" }}
      />

      {expenses.length > 1 && (
        <button
          onClick={() => removeExpenseField(idx)}
          style={{
            background: "red",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
            padding: "5px 10px",
            fontWeight: "bold",
            height: 32
          }}
        >
          ×
        </button>
      )}
    </div>
  ))}

  {/* ===== BUTTONS SIDE BY SIDE ===== */}
  <div
    style={{
      display: "flex",
      gap: 10,
      marginTop: 20,
      justifyContent: "center", // center the buttons
      flexWrap: "wrap" // makes responsive on small screens
    }}
  >
    <button
      onClick={addExpenseField}
      className="btn-solid"
      style={{ width: "150px" }}
    >
      + Add Another Expense
    </button>

    <button
      onClick={handleSubmit}
      className="btn-solid"
      style={{ width: "150px" }}
    >
      Submit All
    </button>
  </div>
</div>

    </div>
  );
};

export default ExpenseForm;