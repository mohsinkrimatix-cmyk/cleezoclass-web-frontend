import React, { useState } from "react";
import axios from "axios";

const NormalizeNames = () => {
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [newName, setNewName] = useState("");

  const fetchStudents = async () => {
    if (!className || !section) {
      alert("Please select class and section");
      return;
    }
    try {
      const res = await axios.get("https://cleezoclass.com:5000/api/students", {
        params: { class_name: className, section },
      });
      setStudents(res.data);
      setSelectedNames([]);
    } catch (err) {
      console.error(err);
      alert("Failed to load students");
    }
  };

  const handleCheckboxChange = (name) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleNormalize = async () => {
    if (!newName || selectedNames.length === 0) {
      alert("Select names and enter the canonical name");
      return;
    }
    try {
      await axios.post("https://cleezoclass.com:5000/api/normalize-name", {
        class_name: className,
        section,
        oldIds: selectedNames,
        newName,
      });
      alert("Names normalized successfully!");
      setNewName("");
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to normalize names");
    }
  };

  return (
    <div style={{
      padding: "20px",
      maxWidth: "600px",
      margin: "auto",
      fontFamily: "Arial, sans-serif",
      border: "1px solid #ddd",
      borderRadius: "8px",
      backgroundColor: "#f9f9f9"
    }}>
      <h2 style={{ textAlign: "center", color: "#333" }}>Normalize Student Names</h2>

      <div style={{ marginBottom: "15px", display: "flex", gap: "10px", alignItems: "center" }}>
        <div>
          <label style={{ fontWeight: "bold" }}>Class:</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g., 1, 2, 3"
            style={{ marginLeft: "5px", padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <div>
          <label style={{ fontWeight: "bold" }}>Section:</label>
          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="e.g., A, B"
            style={{ marginLeft: "5px", padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <button
          onClick={fetchStudents}
          style={{
            padding: "6px 12px",
            backgroundColor: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Load Students
        </button>
      </div>

{students.length > 0 && (
  <>
    <div style={{
      maxHeight: "300px",
      overflowY: "scroll",
      border: "1px solid #ccc",
      borderRadius: "6px",
      padding: "10px",
      marginBottom: "15px",
      backgroundColor: "#fff"
    }}>
      {students.map((student) => (
        <div key={student.id} style={{ marginBottom: "6px" }}>
          <input
            type="checkbox"
            checked={selectedNames.includes(student.id)}
            onChange={() => handleCheckboxChange(student.id)}
          />
          <span style={{ marginLeft: "8px", fontSize: "14px" }}>
            {student.StudentName} - {student.Paid_Amount} - {student.PaidDate?.slice(0,10)}
          </span>
        </div>
      ))}
    </div>

    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <input
        type="text"
        value={newName}
        placeholder="Enter canonical name"
        onChange={(e) => setNewName(e.target.value)}
        style={{ flex: "1", padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
      />
      <button
        onClick={handleNormalize}
        style={{
          padding: "6px 12px",
          backgroundColor: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Normalize Names
      </button>
    </div>
  </>
)}
    </div>
  );
};

export default NormalizeNames;