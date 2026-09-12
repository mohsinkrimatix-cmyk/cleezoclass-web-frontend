import React, { useEffect, useState } from "react";
import axios from "axios";

export default function HighScorers() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const schoolCode = "TAGSOLNOVALLP"; // 🔥 Put your schoolCode here

  useEffect(() => {
    fetchTopStudents();
  }, []);

  const fetchTopStudents = async () => {
    try {
      const response = await axios.get("https://cleezoclass.com:4000/top-students", {
        params: { schoolCode }
      });
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>High Scorers (Above 65 Marks)</h1>

      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : students.length === 0 ? (
        <p style={styles.noData}>No students found</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Class</th>
              <th style={styles.th}>Score</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, index) => (
              <tr key={index}>
                <td style={styles.td}>{s.student_name}</td>
                <td style={styles.td}>{s.student_class}</td>
                <td style={styles.td}>{s.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "90%",
    maxWidth: "800px",
    margin: "30px auto",
    padding: "20px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  },
  heading: {
    textAlign: "center",
    fontSize: "22px",
    marginBottom: "20px",
    color: "#333"
  },
  loading: {
    textAlign: "center",
    fontSize: "16px"
  },
  noData: {
    textAlign: "center",
    fontSize: "16px",
    color: "red"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    backgroundColor: "#f2f2f2",
    padding: "10px",
    textAlign: "left",
    borderBottom: "2px solid #ddd"
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd"
  }
};
