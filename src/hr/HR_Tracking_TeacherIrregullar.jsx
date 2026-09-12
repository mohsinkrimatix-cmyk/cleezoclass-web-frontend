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

const TeacherAttendanceList = () => {
  const [records, setRecords] = useState([]);
  const [schoolCode] = useState(localStorage.getItem("schoolCode") || "NOVA");
    const reportTitle = "Teachers with Irregular Attendance";
  const dataToDisplay = records;


  // ✅ Fetch irregular teachers
  const fetchRecords = async () => {
    try {
      const res = await axios.get("https://cleezoclass.com:4000/teacher-list-of-irregulars", {
        params: { schoolCode },
      });
      setRecords(res.data);
    } catch (err) {
      console.error("Error fetching irregular teachers:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);
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


 return (
  <>
    {/* 🔥 Hide Buttons During Print */}
    <style>
      {`
        @media print {
          .actionBtnContainer,
          .actionBtnStyle {
            display: none !important;
          }
        }
      `}
    </style>

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
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
                   <h2 className="footprintsinner">

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
                      text: `Check out this teachers irregular attendance report`,
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

          📋 Teachers with Irregular Attendance
        </h2>

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
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Designation</th>
                <th style={thStyle}>Total Absent Days</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((rec, index) => (
                  <tr
                    key={rec.teacher_id}
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
                    <td style={tdStyle}>{rec.teacher_id}</td>
                    <td style={tdStyle}>{rec.teacher_name}</td>
                    <td style={tdStyle}>{rec.username}</td>
                    <td style={tdStyle}>{rec.designation || "-"}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: "bold",
                        color: "#c0392b",
                      }}
                    >
                      {rec.total_absent_days}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#7f8c8d",
                    }}
                  >
                    No irregular teachers found for this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
);

};

// ✅ Reusable styles
const thStyle = {
  padding: "12px 14px",
  fontWeight: "bold",
};

const tdStyle = {
  padding: "10px 14px",
  borderBottom: "1px solid #e0e0e0",
  color: "#2c3e50",
};
const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "15px", 
    marginBottom: "15px",
    marginRight: "40px",
    marginLeft: "20px"
  };


export default TeacherAttendanceList;