import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock, faUserTimes, faBookReader, faUserCheck, faTrophy, faExclamationCircle, faAward,
  // ADDED ICONS: Print, Download, Edit
  faPrint, faDownload, faEdit, faTimes, 
  faShareAlt
} from "@fortawesome/free-solid-svg-icons";
const schoolLogo = ""; // Optional custom logo

const TeacherLatecomers = () => {
  const [latecomers, setLatecomers] = useState([]);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
     const reportTitle = "List of Late Comers";
  const dataToDisplay = latecomers;
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

  useEffect(() => {
    if (month && year) fetchLatecomers();
  }, [month, year]);

  const fetchLatecomers = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/api/teacher-list-of-latecomers", {
        params: { schoolCode, month, year },
      });
      setLatecomers(res.data);
    } catch (error) {
      console.error("Error fetching latecomers:", error);
    }
  };
  const handleDownloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert("No data to download.");
      return;
    }
    
    const SEPARATOR = '\t'; 

    const headers = Object.keys(data[0]);
    const headerRow = headers
      .map(header => `"${header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}"`)
      .join(SEPARATOR);

    const csvRows = data.map(row =>
      headers
        .map(header => {
          let value = row[header];
          if (typeof value === 'number') {
            value = String(value);
          } else if (typeof value === 'string') {
            value = value.replace(/"/g, '""').replace(/,/g, '').replace(/\n/g, ' ');
          }
          return `"${value}"`;
        })
        .join(SEPARATOR)
    );

    const csvContent = [headerRow, ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement("a");
    
    if (link.download !== undefined) { 
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const styles = {
    container: {
      padding: "30px",
      fontFamily: "'Century Gothic', 'AppleGothic', sans-serif",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    },
    title: {
      fontSize: "26px",
      fontWeight: "700",
      marginBottom: "25px",
      color: "#1e293b",
      textAlign: "left",
    },
    filterContainer: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginBottom: "25px",
    },
    select: {
      padding: "10px 14px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      fontSize: "15px",
      backgroundColor: "#fff",
      outline: "none",
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    input: {
      padding: "10px 14px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      fontSize: "15px",
      width: "130px",
      outline: "none",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    tableWrapper: {
      overflowX: "auto",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#fff",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "15px",
      textAlign: "left",
    },
    th: {
      backgroundColor: "#334155",
      color: "#f8fafc",
      padding: "14px 18px",
      fontWeight: "600",
    },
    td: {
      padding: "12px 18px",
      borderBottom: "1px solid #e2e8f0",
    },
    trHover: {
      transition: "background 0.2s ease",
    },
    trHoverEffect: {
      backgroundColor: "#f1f5f9",
    },
    noData: {
      textAlign: "center",
      color: "#64748b",
      fontSize: "16px",
      marginTop: "40px",
    },
  };

return (
  <>
    {/* 🔥 HIDE BUTTONS WHEN PRINTING */}
    <style>
      {`
        @media print {
          .actionBtnContainer,
          .actionBtnStyle,
          select,
          input {
            display: none !important;
          }
        }
      `}
    </style>

    <div style={styles.container}>
      
      <div style={actionBtnContainerStyle} className="actionBtnContainer">
        <button
          onClick={() =>
            handleDownloadCSV(
              dataToDisplay,
              reportTitle.replace(/\s/g, "_")
            )
          }
          className="actionBtnStyle"
        >
          <FontAwesomeIcon icon={faDownload} />
        </button>

        <button onClick={() => window.print()} className="actionBtnStyle">
          <FontAwesomeIcon icon={faPrint} />
        </button>

        <button
          onClick={() => {
            if (navigator.share) {
              navigator
                .share({
                  title: reportTitle,
                  text: `Check out this teachers List of teachers Latecomers`,
                  url: window.location.href,
                })
                .catch(console.error);
            } else {
              alert("Web Share API not supported on this browser.");
            }
          }}
          className="actionBtnStyle"
        >
          <FontAwesomeIcon icon={faShareAlt} />
        </button>
      </div>

                   <h2 className="footprintsinner">
Latecomer Teachers</h2>

      {/* Month-Year Filter */}
      <div style={styles.filterContainer} className="actionBtnContainer">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={styles.select}
          className="actionBtnStyle"
        >
          <option value="">Select Month</option>
          {[...Array(12).keys()].map((m) => (
            <option key={m + 1} value={m + 1}>
              {new Date(0, m).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Enter Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={styles.input}
          className="actionBtnStyle"
        />
      </div>

      {/* Table */}
      {latecomers.length === 0 ? (
        <p style={styles.noData}>No latecomers found for this period.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Teacher Name</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>In Time</th>
                <th style={styles.th}>Out Time</th>
                <th style={styles.th}>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {latecomers.map((t, i) => (
                <tr
                  key={i}
                  style={{
                    ...styles.trHover,
                    backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f1f5f9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      i % 2 === 0 ? "#fff" : "#f9fafb")
                  }
                >
                  <td style={styles.td}>{t.teacher_name}</td>
                  <td style={styles.td}>{t.date}</td>
                  <td style={styles.td}>{t.entry_time}</td>
                  <td style={styles.td}>{t.exit_time}</td>
                  <td style={styles.td}>{t.working_hours} hrs</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </>
);

};

export default TeacherLatecomers;
const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "15px", 
    marginBottom: "15px",
    marginRight: "40px",
    marginLeft: "20px"
  };