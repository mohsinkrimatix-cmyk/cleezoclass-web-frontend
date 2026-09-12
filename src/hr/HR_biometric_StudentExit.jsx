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


const DeletedUsers = () => {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const schoolCode = localStorage.getItem("schoolCode") || "NOVA";
  const reportTitle = "Deleted Users";  

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
    const fetchDeletedUsers = async () => {
      try {
        const res = await axios.get("https://cleezoclass.com:4000/api/deleted-students", {
          params: { schoolCode },
        });
        setDeletedUsers(res.data);
      } catch (error) {
        console.error("Error fetching deleted users:", error);
      }
    };

    fetchDeletedUsers();
  }, []);

  // Inline styles
  const styles = {
    container: {
      fontFamily: "'Century Gothic', 'AppleGothic', sans-serif",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
      padding: "40px",
    },
    heading: {
      textAlign: "center",
      fontSize: "26px",
      fontWeight: "bold",
      color: "#0f172a",
      marginBottom: "25px",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    tableWrapper: {
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
      textAlign: "center", // ✅ Center align text
      verticalAlign: "middle", // ✅ Vertically center
      padding: "12px 16px",
      fontSize: "15px",
      textTransform: "uppercase",
      borderBottom: "2px solid #cbd5e1",
      borderLeft: "1px solid #cbd5e1",
    },
    td: {
      textAlign: "center", // ✅ Center align text
      verticalAlign: "middle", // ✅ Vertically center
      padding: "12px 16px",
      fontSize: "15px",
      color: "#1e293b",
      borderBottom: "1px solid #cbd5e1",
      borderLeft: "1px solid #cbd5e1",
    },
    row: {
      transition: "background-color 0.2s ease",
    },
    emptyText: {
      textAlign: "center",
      fontSize: "18px",
      color: "#64748b",
      marginTop: "40px",
    },
  };
  const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "10px", 
    marginBottom: "15px"
  };

  return (
    
    <div style={styles.container}>
      <h2 style={styles.heading}>Deleted Users</h2>
      <div style={actionBtnContainerStyle}>
              <button 
                onClick={() => handleDownloadCSV(deletedUsers, reportTitle.replace(/\s/g, '_'))}
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
                      text: `Check out this enrollment report`,
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

      {deletedUsers.length === 0 ? (
        <p style={styles.emptyText}>No deleted users found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>User Type</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Section</th>
                 <th style={styles.th}>Father Name</th>
                <th style={styles.th}>phoneNo</th>
                <th style={styles.th}>AadharNo</th>
              </tr>
            </thead>
            <tbody>
              {deletedUsers.map((user, index) => (
                <tr
                  key={user.id}
                  style={{
                    ...styles.row,
                    backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#e0e7ff")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      index % 2 === 0 ? "#ffffff" : "#f8fafc")
                  }
                >
                  <td style={styles.td}>{user.id}</td>
                  <td style={styles.td}>{user.name}</td>
                  <td style={styles.td}>{user.user_type}</td>
                  <td style={styles.td}>{user.class_name}</td>
                  <td style={styles.td}>{user.section}</td>
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
};

export default DeletedUsers;
