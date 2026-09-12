import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock, faUserTimes, faBookReader, faUserCheck, faTrophy, faExclamationCircle, faAward,
  // ADDED ICONS: Print, Download, Edit
  faPrint, faDownload, faEdit, faTimes, 
  faShareAlt
} from "@fortawesome/free-solid-svg-icons";
const AdmissionsList = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reportTitle = "Edit Admissions";
  const dataToDisplay = admissions;

  // 🔹 Format date to yy-mm-dd
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  };
  const handleDownloadCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert("No data to download.");
    return;
  }
  
  // Use TAB (\t) as separator for better Excel compatibility
  const SEPARATOR = '\t'; 

  // Extract headers and format them (removing camelCase/underscores)
  const headers = Object.keys(data[0]);
  const headerRow = headers.map(header => 
      // Replace camelCase with spaces, replace underscores, and trim
      `"${header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}"`
  ).join(SEPARATOR);

  // Convert data rows
  const csvRows = data.map(row => 
    headers.map(header => {
      let value = row[header];
      if (typeof value === 'number') {
        // Ensure numbers are written as raw numbers (without commas) for Excel
        value = String(value); 
      } else if (typeof value === 'string') {
        // Remove commas and newlines from strings to prevent breaking the TSV structure
        value = value.replace(/"/g, '""').replace(/,/g, '').replace(/\n/g, ' '); 
      }
      return `"${value}"`;
    }).join(SEPARATOR)
  );

  const csvContent = [headerRow, ...csvRows].join('\n');
  
  // Use 'application/vnd.ms-excel' MIME type and .xls extension for better Excel recognition
  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement("a");
  
  if (link.download !== undefined) { 
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.xls`); // Changed to .xls
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "10px", 
    marginBottom: "15px"
  };
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const schoolCode = localStorage.getItem("schoolCode");
        if (!schoolCode) {
          setError("School code not found in localStorage.");
          setLoading(false);
          return;
        }

        const response = await axios.get("https://cleezoclass.com:4000/newadmissions", {
          params: { schoolCode },
        });

        setAdmissions(response.data);
      } catch (err) {
        console.error("Error fetching admissions:", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };


    fetchAdmissions();
  }, []);

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading admission data...</p>
      </div>
    );

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="admissions-container">
      <h2 className="footprints">🎓 Admission Form Details</h2>

      <div className="table-container">
<div style={actionBtnContainerStyle} className="actionBtnContainer">
        <button 
          onClick={() => handleDownloadCSV(dataToDisplay, reportTitle.replace(/\s/g, '_'))}
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
                text: `Check out this admissions edit report`,
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
      
     <table className="admissions-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Student Name</th>
      <th>DOB</th>
      <th>Class Applied</th>
      <th>Father Name</th>
      <th>Mother Name</th>
      <th>Phone</th>
      <th>Address</th>
      <th>Score</th>
      <th>TC</th>
      <th>Aadhar</th>
      <th>DOB </th>
      <th>Apaar </th>
      <th>Father ID</th>
      <th>Mother ID</th>
      <th>Address Proof</th>
    </tr>
  </thead>
  <tbody>
    {admissions.map((student) => (
      <tr key={student.id}>
        <td>{student.id}</td>
        <td>{student.student_name}</td>
        <td>{formatDate(student.dob)}</td>
        <td>{student.lead_admission_for}</td>
        <td>{student.full_name}</td>
        <td>{student.mother_name}</td>
        <td>{student.mobile_number}</td>
        <td>{student.address}</td>
        <td>{student.test_score}</td>
        
        {/* Checkboxes for documents */}
          <td>{student.tc_document ? "✅" : "❌"}</td>
        <td>{student.aadhar_document ? "✅" : "❌"}</td>
        <td>{student.dob_document ? "✅" : "❌"}</td>
        <td>{student.appeared_document ? "✅" : "❌"}</td>
        <td>{student.father_id ? "✅" : "❌"}</td>
        <td>{student.mother_id ? "✅" : "❌"}</td>
        <td>{student.address_proof ? "✅" : "❌"}</td>
      </tr>
    ))}
  </tbody>
</table>

      </div>

      <style>{`
      .admissions-table th,
.admissions-table td {
  width: 100px; /* adjust value as needed */
  padding: 4px 6px; /* smaller padding */
}

        .admissions-container {
          font-family: 'Century Gothic', 'AppleGothic', sans-serif;
          padding: 55px;
          background: #f3f7fc;
          min-height: 100vh;
          
        }

        h2 {
          text-align: center;
          color: #0a3d62;
          font-size: 26px;
          margin-bottom: 25px;
          letter-spacing: 0.5px;
        }

        .table-container {
          overflow-x: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border-radius: 12px;
          background: white;
        }

        .admissions-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
                    border-left: 1px solid #e0e6ed;

        }

        .admissions-table th, .admissions-table td {
          padding: 8px;
          text-align: left;
          font-size:10px
        }

        .admissions-table thead {
          background: rgba(141,171,182,255);
          color: white;
                    font-size:10px

        }

        .admissions-table tbody tr:nth-child(even) {
          background-color: #f7fbff;          font-size:10px

        }

        .admissions-table tbody tr:hover {
          background-color: #eaf3ff;
          transition: background-color 0.2s ease;
        }

        .admissions-table td {
          border-bottom: 1px solid #e0e6ed;
          color: #2f3542;
          font-size:10px
;                    border-left: 1px solid #e0e6ed;

        }

        /* 🔹 Loading Spinner */
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 80vh;
          font-family: 'Century Gothic', sans-serif;
        }

        .spinner {
          border: 4px solid #dbe4ee;
          border-top: 4px solid #0a3d62;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 0.8s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          h2 {
            font-size: 20px;
          }
          .admissions-table th, .admissions-table td {
            padding: 10px;
            font-size: 13px;
          }
            const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "10px", 
    marginBottom: "15px"
  };
        }
  @media print {
  .actionBtnContainer {
    display: none !important;
  }
}

      `}</style>
    </div>
  );
};

export default AdmissionsList;
