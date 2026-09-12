import React, { useEffect, useState } from "react";
import axios from "axios";

const DashboardLogs = () => {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [editedLogs, setEditedLogs] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";

  useEffect(() => {
    // Fetch deleted users
    const fetchDeletedUsers = async () => {
      try {
        const res = await axios.get("https://cleezoclass.com:4000/api/deleted-users", {
          params: { schoolCode },
        });
        setDeletedUsers(res.data);
      } catch (err) {
        console.error("Error fetching deleted users:", err);
      }
    };

    // Fetch edited admissions logs from localStorage
    const fetchEditedLogs = () => {
      const storedLogs = JSON.parse(localStorage.getItem("editedAdmissionsLogs")) || [];
      setEditedLogs(storedLogs);
    };

    // Fetch leave requests
    const fetchLeaveRequests = async () => {
      try {
        const res = await axios.get("https://cleezoclass.com:4000/leave-requests-list", {
          params: { schoolCode },
        });
        setLeaveRequests(res.data);
      } catch (err) {
        console.error("Error fetching leave requests:", err);
      }
    };

    fetchDeletedUsers();
    fetchEditedLogs();
    fetchLeaveRequests();
  }, [schoolCode]);

  const toggleRow = (key) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  // Group deleted users by class & section
  const groupedDeletedUsers = deletedUsers.reduce((acc, user) => {
    const key = `deleted-${user.class_name}-${user.section}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {});

  // Group edited logs by class & section
  const groupedEditedLogs = editedLogs.reduce((acc, log) => {
    const key = `edit-${log.class}-${log.section || "NA"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});

  // Group leave requests by class & section
  const groupedLeaveRequests = leaveRequests.reduce((acc, req) => {
    const key = `leave-${req.class_name}-${req.section}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(req);
    return acc;
  }, {});

  const styles = {
    container: {
      fontFamily: "'Century Gothic', 'AppleGothic', sans-serif",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      padding: "40px",
    },
    heading: {
      textAlign: "center",
      fontSize: "28px",
      fontWeight: "bold",
      color: "#0f172a",
      marginBottom: "20px",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    rowContainer: {
      width: "20vw",
      backgroundColor: "#e2e8f0",
      cursor: "pointer",
      padding: "12px 16px",
      marginBottom: "5px",
      borderRadius: "6px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      transition: "background-color 0.2s",
      fontWeight: "600",
    },
    arrowLine: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    arrow: {
      display: "inline-block",
      transition: "transform 0.3s",
    },
    infoLine: {
      fontSize: "14px",
      color: "#1e293b",
    },
    userTableWrapper: {
      marginTop: "5px",
      marginBottom: "15px",
      overflowX: "auto",
      backgroundColor: "#fff",
      borderRadius: "10px",
      boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      backgroundColor: "rgba(141,171,182,255)",
      color: "#fff",
      textAlign: "center",
      verticalAlign: "middle",
      padding: "12px 16px",
      fontSize: "15px",
      textTransform: "uppercase",
      borderBottom: "2px solid #cbd5e1",
      borderLeft: "1px solid #cbd5e1",
    },
    td: {
      textAlign: "center",
      verticalAlign: "middle",
      padding: "12px 16px",
      fontSize: "15px",
      color: "#1e293b",
      borderBottom: "1px solid #cbd5e1",
      borderLeft: "1px solid #cbd5e1",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Dashboard Logs</h2>

      <h3 style={{ marginTop: "30px", fontWeight: "bold" }}>Deleted Users (Exits)</h3>
      {Object.keys(groupedDeletedUsers).length === 0 ? (
        <p style={{ textAlign: "center", fontSize: "16px", color: "#64748b" }}>No deleted users found.</p>
      ) : (
        Object.keys(groupedDeletedUsers).map((key) => {
          const users = groupedDeletedUsers[key];
          const isExpanded = expandedRows[key];
          const [_, className, section] = key.split("-");

          return (
            <div key={key}>
              <div style={styles.rowContainer} onClick={() => toggleRow(key)}>
                <div style={styles.arrowLine}>
                  <span style={{ ...styles.arrow, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                  Exits
                </div>
                <div style={styles.infoLine}>{`Class: ${className} | Section: ${section} | Pending: ${users.length}`}</div>
              </div>
              {isExpanded && (
                <div style={styles.userTableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>User Type</th>
                        <th style={styles.th}>Father Name</th>
                        <th style={styles.th}>Phone No</th>
                        <th style={styles.th}>Aadhar No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, idx) => (
                        <tr key={user.id} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f1f5f9" }}>
                          <td style={styles.td}>{user.id}</td>
                          <td style={styles.td}>{user.name}</td>
                          <td style={styles.td}>{user.user_type}</td>
                          <td style={styles.td}>{user.father_name}</td>
                          <td style={styles.td}>{user.phone_no}</td>
                          <td style={styles.td}>{user.aadhar_no}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Edited Admissions Logs */}
      <h3 style={{ marginTop: "30px", fontWeight: "bold" }}>Edited Admissions Logs</h3>
      {Object.keys(groupedEditedLogs).length === 0 ? (
        <p style={{ textAlign: "center", fontSize: "16px", color: "#64748b" }}>No edited admissions logs found.</p>
      ) : (
        Object.keys(groupedEditedLogs).map((key) => {
          const logs = groupedEditedLogs[key];
          const isExpanded = expandedRows[key];
          const [_, className, section] = key.split("-");

          return (
            <div key={key}>
              <div style={styles.rowContainer} onClick={() => toggleRow(key)}>
                <div style={styles.arrowLine}>
                  <span style={{ ...styles.arrow, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                  Enrollment Edit
                </div>
                <div style={styles.infoLine}>{`Class: ${className} | Section: ${section} | Pending: ${logs.length}`}</div>
              </div>
              {isExpanded && (
                <div style={styles.userTableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Student Name</th>
                        <th style={styles.th}>Fields Edited</th>
                        <th style={styles.th}>Edited At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} style={{ backgroundColor: "#ffffff" }}>
                          <td style={styles.td}>{log.student_name}</td>
                          <td style={styles.td}>{log.fieldsEdited.join(", ")}</td>
                          <td style={styles.td}>{log.editedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Leave Requests */}
      <h3 style={{ marginTop: "30px", fontWeight: "bold" }}>Leave Requests</h3>
      {Object.keys(groupedLeaveRequests).length === 0 ? (
        <p style={{ textAlign: "center", fontSize: "16px", color: "#64748b" }}>No leave requests found.</p>
      ) : (
        Object.keys(groupedLeaveRequests).map((key) => {
          const requests = groupedLeaveRequests[key];
          const isExpanded = expandedRows[key];
          const [_, className, section] = key.split("-");

          return (
            <div key={key}>
              <div style={styles.rowContainer} onClick={() => toggleRow(key)}>
                <div style={styles.arrowLine}>
                  <span style={{ ...styles.arrow, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                  Leave Requests
                </div>
                <div style={styles.infoLine}>{`Class: ${className} | Section: ${section} | Pending: ${requests.length}`}</div>
              </div>
              {isExpanded && (
                <div style={styles.userTableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Student Name</th>
                        <th style={styles.th}>Start Date</th>
                        <th style={styles.th}>End Date</th>
                        <th style={styles.th}>Reason</th>
                        <th style={styles.th}>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr key={req.id} style={{ backgroundColor: "#ffffff" }}>
                          <td style={styles.td}>{req.id}</td>
                          <td style={styles.td}>{req.student_name}</td>
                          <td style={styles.td}>{formatDate(req.start_date)}</td>
                          <td style={styles.td}>{formatDate(req.end_date)}</td>
                          <td style={styles.td}>{req.reason}</td>
                          <td style={styles.td}>{formatDate(req.submitted_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default DashboardLogs;
