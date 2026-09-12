import React, { useState, useEffect } from "react";
import axios from "axios";

const InvigilatorDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([
    "English", "Math", "Science", "Social Studies", "Hindi", "Computer"
  ]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [recommended, setRecommended] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "https://cleezoclass.com:4000/api";

  // 🔹 Fetch Classes and Assigned Invigilators on Load
  useEffect(() => {
    fetchClasses();
    fetchAssigned();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${API}/classes`);
      setClasses(res.data);
    } catch (err) {
      console.error("Error fetching classes:", err);
    }
  };

  const fetchAssigned = async () => {
    try {
      const res = await axios.get(`${API}/assigned-invigilators`);
      setAssigned(res.data);
    } catch (err) {
      console.error("Error fetching assigned:", err);
    }
  };

  const fetchRecommendations = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select both class and subject!");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API}/recommended-invigilators`, {
        params: { class_name: selectedClass, subject: selectedSubject },
      });
      setRecommended(res.data);
      setMessage(
        res.data.length
          ? `${res.data.length} recommended teachers found`
          : "No recommendations available"
      );
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (teacherName) => {
    try {
      await axios.post(`${API}/assign-invigilator`, {
        class_name: selectedClass,
        teacher_name: teacherName,
      });
      setMessage(`✅ Invigilator ${teacherName} assigned successfully!`);
      fetchAssigned();
    } catch (err) {
      console.error("Error assigning invigilator:", err);
      setMessage("❌ Failed to assign invigilator.");
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: "#f9fafc",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#2a3f54", fontWeight: "700", marginBottom: "30px" }}>
        Invigilator Management
      </h1>

      {/* Filters Section */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            minWidth: "150px",
          }}
        >
          <option value="">Select Class</option>
          {classes.map((cls, idx) => (
            <option key={idx} value={cls}>
              {cls}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            minWidth: "150px",
          }}
        >
          <option value="">Select Subject</option>
          {subjects.map((subj, idx) => (
            <option key={idx} value={subj}>
              {subj}
            </option>
          ))}
        </select>

        <button
          onClick={fetchRecommendations}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {loading ? "Loading..." : "Show Recommendations"}
        </button>
      </div>

      {message && (
        <p style={{ color: "#2a3f54", fontWeight: "500", marginBottom: "20px" }}>
          {message}
        </p>
      )}

      {/* Recommended List */}
      {recommended.length > 0 && (
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: "40px",
          }}
        >
          <h3 style={{ marginBottom: "15px", color: "#333" }}>
            Recommended Invigilators
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f1f1f1" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recommended.map((teacher) => (
                <tr key={teacher.id}>
                  <td style={tdStyle}>{teacher.name}</td>
                  <td style={tdStyle}>{teacher.designation}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleAssign(teacher.name)}
                      style={assignButton}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assigned Invigilators */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#333" }}>
          Assigned Invigilators
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f1f1f1" }}>
              <th style={thStyle}>Class</th>
              <th style={thStyle}>Teacher</th>
              <th style={thStyle}>Assigned Date</th>
            </tr>
          </thead>
          <tbody>
            {assigned.length > 0 ? (
              assigned.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.class_name}</td>
                  <td style={tdStyle}>{item.teacher_name}</td>
                  <td style={tdStyle}>
                    {new Date(item.assigned_date).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={tdStyle}>
                  No invigilators assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Inline Styles
const thStyle = {
  textAlign: "left",
  padding: "10px",
  borderBottom: "2px solid #ddd",
  fontWeight: "600",
  color: "#555",
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #eee",
  color: "#333",
};

const assignButton = {
  backgroundColor: "#28a745",
  color: "white",
  border: "none",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
};

export default InvigilatorDashboard;
