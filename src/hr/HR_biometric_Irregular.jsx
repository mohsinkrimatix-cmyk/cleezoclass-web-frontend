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


const AttendanceList = () => {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState("");
  const [schoolCode] = useState(localStorage.getItem("schoolCode") || "NOVA");
const reportTitle = "Irregular Attendance Report";  
  const fetchRecords = async (leavetype = "") => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/list-of-irregulars", {
        params: { schoolCode, leavetype },
      });

      // ✅ Filter out 'Present' even if API returns it
      const filtered = res.data.filter(
        (rec) =>
          rec.leavetype &&
          (rec.leavetype.toLowerCase() === "informed" ||
            rec.leavetype.toLowerCase() === "uninformed")
      );

      setRecords(filtered);
    } catch (err) {
      console.error("Error fetching attendance:", err);
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

  useEffect(() => {
    fetchRecords(filter);
  }, [filter]);

  return (
    <div
      style={{
        fontFamily: "'Century Gothic', sans-serif",
        padding: "30px",
        background: "#f8faff",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
        
          borderRadius: "12px",
          padding: "25px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#2c3e50",
            fontWeight: "bold",
            fontSize: "26px",
            marginBottom: "25px",
          }}
        >
          Irregular Attendance 
        </h2>

        {/* Filter Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {["All", "Informed", "UnInformed"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type === "All" ? "" : type)}
              style={{
                background:
                  filter === type || (type === "All" && filter === "")
                    ? "#2980b9"
                    : "#ecf0f1",
                color:
                  filter === type || (type === "All" && filter === "")
                    ? "#fff"
                    : "#2c3e50",
                border: "none",
                borderRadius: "25px",
                padding: "5px 10px",
                cursor: "pointer",
                fontWeight: "200px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                fontSize: "14px",
              }}
            >
              {type}
            </button>
          ))}
        </div>
        <div style={actionBtnContainerStyle}>
                <button 
                  onClick={() => handleDownloadCSV(records, reportTitle.replace(/\s/g, '_'))}
                  className="actionBtnStyle"
                >
                  <FontAwesomeIcon icon={faDownload} />  
                </button>
        
                <button
                  onClick={() => window.print()}
                  className="actionBtnStyle"
                >
                  <FontAwesomeIcon icon={faPrint} /> 
                </button>
        
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: reportTitle,
                        text: `Check out this irregular attendance report`                 ,
                        url: window.location.href,
                      }).catch(console.error);
                    } else {
                      alert("Web Share API not supported on this browser.");
                    }
                  }}
                  className="actionBtnStyle"
                >
                  <FontAwesomeIcon icon={faShareAlt} /> 
                </button>
              </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "15px",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "rgba(141,171,182,255)",
                  color: "#fff",
                  textAlign: "left",
                }}
              >
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Class</th>
                <th style={thStyle}>Section</th>
                <th style={thStyle}>Leave Type</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Submission Time</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((rec, index) => (
                  <tr
                    key={rec.ID}
                    style={{
                      background: index % 2 === 0 ? "#fdfdfd" : "#f5f9fc",
                      transition: "background 0.3s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#e8f4fd")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        index % 2 === 0 ? "#fdfdfd" : "#f5f9fc")
                    }
                  >
                    <td style={tdStyle}>{rec.ID}</td>
                    <td style={tdStyle}>{rec.name}</td>
                    <td style={tdStyle}>{rec.class}</td>
                    <td style={tdStyle}>{rec.section}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontWeight: "bold",
                          color:
                            rec.leavetype === "UnInformed"
                              ? "#c0392b"
                              : "#27ae60",
                          background:
                            rec.leavetype === "UnInformed"
                              ? "#fdecea"
                              : "#e9f9f0",
                        }}
                      >
                        {rec.leavetype}
                      </span>
                    </td>
                    <td style={tdStyle}>{rec.date}</td>
                    <td style={tdStyle}>{rec.username}</td>
                    <td style={tdStyle}>{rec.submission_time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#7f8c8d",
                    }}
                  >
                    No records found
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

// ✅ Reusable styles
const thStyle = {
  padding: '2px 2px ',
  border: '1px solid #ddd',
  textAlign: 'center',
  color: 'white',
  fontWeight: '400',
  fontSize:'10px'
};

const tdStyle = {
 padding: '2px 2px',
  border: '1px solid #ddd',
  textAlign: 'center',
    fontSize:'10px'
};
const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "15px", 
    marginBottom: "15px"
  };

export default AttendanceList;
