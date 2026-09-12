import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock,
  faUserTimes,
  faBookReader,
  faUserCheck,
  faTrophy,
  faExclamationCircle,
  faAward,
  faPrint,
  faDownload,
  faEdit,
  faTimes,
  faShareAlt,
} from "@fortawesome/free-solid-svg-icons";

const schoolLogo = ""; // Optional custom logo

export default function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reportTitle = "Leave Requests Report";

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const schoolCode = localStorage.getItem("schoolCode");
        if (!schoolCode) {
          setError("School code not found in localStorage.");
          setLoading(false);
          return;
        }
        const response = await axios.get(
          "https://cleezoclass.com:4000/leave-requests-list",
          {
            params: { schoolCode },
          }
        );
        setRequests(response.data);
      } catch (err) {
        console.error("Error fetching leave requests:", err);
        setError("Failed to fetch leave requests.");
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

    const SEPARATOR = "\t";

    const headers = Object.keys(data[0]);
    const headerRow = headers
      .map(
        (header) =>
          `"${header
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .trim()}"`
      )
      .join(SEPARATOR);

    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          let value = row[header];
          if (typeof value === "number") {
            value = String(value);
          } else if (typeof value === "string") {
            value = value.replace(/"/g, '""').replace(/,/g, "").replace(/\n/g, " ");
          }
          return `"${value}"`;
        })
        .join(SEPARATOR)
    );

    const csvContent = [headerRow, ...csvRows].join("\n");

    const blob = new Blob([csvContent], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.xls`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };

  const thStyle = {
    padding: "12px",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "14px",
    borderBottom: "2px solid #ccc",
    borderLeft: "1px solid #ddd",
    paddingtop: "15px",
  };

  const tdStyle = {
    padding: "12px",
    textAlign: "center",
    fontSize: "14px",
    borderBottom: "1px solid #e0e0e0",
    borderLeft: "1px solid #f0f0f0",
  };

  return (
    <div style={{ marginTop: "100px" }}>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          {/* ✅ Action buttons ABOVE the table */}
          <div style={actionBtnContainerStyle}>
            <button
              onClick={() =>
                handleDownloadCSV(
                  requests,
                  reportTitle.replace(/\s/g, "_")
                )
              }
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
                    text: "Check out this leave requests report",
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

          {/* ✅ Table */}
          <table
            style={{ width: "100%", borderCollapse: "collapse", paddingTop: "100px" }}
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
                <th style={thStyle}>Class</th>
                <th style={thStyle}>Section</th>
                <th style={thStyle}>Student Name</th>
                <th style={thStyle}>Start Date</th>
                <th style={thStyle}>End Date</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, index) => (
                <tr
                  key={req.id}
                  style={{
                    background: index % 2 === 0 ? "#fdfdfd" : "#f5f9fc",
                  }}
                >
                  <td style={tdStyle}>{req.id}</td>
                  <td style={tdStyle}>{req.class_name}</td>
                  <td style={tdStyle}>{req.section}</td>
                  <td style={tdStyle}>{req.student_name}</td>
                  <td style={tdStyle}>{formatDate(req.start_date)}</td>
                  <td style={tdStyle}>{formatDate(req.end_date)}</td>
                  <td style={tdStyle}>{req.reason}</td>
                  <td style={tdStyle}>{formatDate(req.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// ✅ define this OUTSIDE the component so it's initialized before usage
const actionBtnContainerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "15px",
  marginBottom: "15px",
};
