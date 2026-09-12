// src/LeaveRequests.js
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

const TeacherLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
   const reportTitle = "List of Leave Requests";
  const dataToDisplay = requests;

  // Format date → yy-mm-dd
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const schoolCode = localStorage.getItem("schoolCode");
        if (!schoolCode) {
          setError("School code not found in localStorage.");
          setLoading(false);
          return;
        }

        const response = await axios.get("https://cleezoclass.com:4000/teacher-leave-requests-list", {
          params: { schoolCode },
        });

        setRequests(response.data);
      } catch (err) {
        console.error("Error fetching leave requests:", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
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

  if (loading)
    return (
  
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading leave requests...</p>
      </div>
    );

  if (error) return <p style={{ color: "red" }}>{error}</p>;

return (
  <div className="leave-container">
                   <h2 className="footprintsinner">
📝 Teachers Leave Requests</h2>

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
                text: `Check out this teachers List of Leave Requests`,
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

    <div className="table-container">
      <table className="leave-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Student Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Reason</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.teacher_name}</td>
              <td>{formatDate(req.leave_start_date)}</td>
              <td>{formatDate(req.leave_end_date)}</td>
              <td>{req.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ⭐ ADD THIS PART → HIDES BUTTONS ON PRINT */}
    <style>{`
      .leave-container {
        font-family: 'Century Gothic', 'AppleGothic', sans-serif;
        padding: 30px;
        min-height: 100vh;
      }

      /* 🔥 HIDE BUTTONS WHEN PRINTING */
      @media print {
        .actionBtnContainer,
        .actionBtnStyle {
          display: none !important;
        }
      }

      h2 {
        text-align: center;
        color: #1b2a49;
        font-size: 26px;
        margin-bottom: 25px;
        letter-spacing: 0.5px;
      }

      .table-container {
        overflow-x: auto;
        border-radius: 12px;
        background: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .leave-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 1000px;
      }

      .leave-table th, .leave-table td {
        padding: 12px 14px;
        text-align: left;
        font-size: 14.5px;
      }

      .leave-table thead {
        background: rgba(141,171,182,255);
        color: white;
      }

      .leave-table tbody tr:nth-child(even) {
        background-color: #f7fbff;
      }

      .leave-table tbody tr:hover {
        background-color: #eaf3ff;
        transition: background-color 0.2s ease;
      }
    `}</style>
  </div>
);

};

export default TeacherLeaveRequests;
const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "15px", 
    marginBottom: "15px",
    marginRight: "40px",
    marginLeft: "20px"
  };