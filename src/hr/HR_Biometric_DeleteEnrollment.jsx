import { useRef, useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock, faUserTimes, faBookReader, faUserCheck, faTrophy, faExclamationCircle, faAward,
  // ADDED ICONS: Print, Download, Edit
  faPrint, faDownload, faEdit, faTimes, 
  faShareAlt
} from "@fortawesome/free-solid-svg-icons";
const schoolLogo = ""; // Optional custom logo

function DeleteEnrollments() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const logoSrc = schoolLogo || "/default-logo.png";
  const contentRef = useRef(null);
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const navigate = useNavigate();

  const reportTitle = "Enrollments";
  const dataToDisplay = admissions; // 👈 this is what we download

  // ✅ Fetch school logo
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) return;
      setDynamicSchoolCode(code);
      try {
        const response = await axios.post(
          'https://cleezoclass.com:4000/api/schoollogodynamic',
          { secretecode: code },
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (response.data.logoPath) setDynamicLogoSrc(response.data.logoPath);
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    };
    fetchSchoolLogo();
  }, []);

  // ✅ Fetch admissions
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const schoolCode = localStorage.getItem('schoolCode');
        const response = await axios.get('https://cleezoclass.com:4000/admissions', {
          params: { schoolCode }
        });
        setAdmissions(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('❌ Failed to load admissions.');
        setLoading(false);
      }
    };
    fetchAdmissions();
  }, []);

  // 🗑️ DELETE handler
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this admission?");
    if (!confirmDelete) return;

    try {
      const schoolCode = localStorage.getItem('schoolCode');
      await axios.delete(`https://cleezoclass.com:4000/admissions/${id}`, {
        params: { schoolCode }
      });

      // Update local list
      setAdmissions((prev) => prev.filter((admission) => admission.id !== id));
      alert("✅ Record deleted successfully");
    } catch (error) {
      console.error('Error deleting record:', error);
      alert("❌ Failed to delete record");
    }
  };

  // 📥 CSV/Excel download
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

  if (loading) {
    return <div style={loadingStyles}>Loading Admissions Details</div>;
  }

  if (error) {
    return <div style={errorStyles}>{error}</div>;
  }

  return (
    <>
      <div style={actionBtnContainerStyle}>
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

      <div style={containerStyles} ref={contentRef}>
        <h1 style={pageHeaderStyles}>Enrollments</h1>
        <table style={tableStyles}>
          <thead>
            <tr style={theadRowStyles}>
              <th style={thStyles}>Admin ID</th>
              <th style={thStyles}>Student Name</th>
              <th style={thStyles}>DOB</th>
              <th style={thStyles}>Father's Name</th>
              <th style={thStyles}>Phone</th>
              <th style={thStyles}>Address</th>
              <th style={thStyles}>Score</th>
              <th style={thStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map((admission) => (
              <tr key={admission.id} style={tbodyRowStyles}>
                <td style={tdStyles}>{admission.id}</td>
                <td style={tdStyles}>{admission.student_name}</td>
                <td style={tdStyles}>
                  {new Date(admission.dob).toLocaleDateString()}
                </td>
                <td style={tdStyles}>{admission.full_name}</td>
                <td style={tdStyles}>{admission.mobile_number}</td>
                <td style={tdStyles}>{admission.address}</td>
                <td style={tdStyles}>{admission.test_score ?? "N/A"}</td>
                <td style={tdStyles}>
                  <button
                    onClick={() => handleDelete(admission.id)}
                    style={deleteButtonStyle}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


// ====== Styles ======
const headerStyles = {
  backgroundColor: '#fff',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  position: 'fixed',
  width: '100%',
  top: 0,
  zIndex: 50,
  height: '100px',
  display: 'flex',
  alignItems: 'center',
};

const containerStyles = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#fff',
  minHeight: '100vh',
};

const pageHeaderStyles = {
  textAlign: 'center',
  marginBottom: '30px',
  fontSize: '32px',
  color: 'rgba(15,150,128,255)',
};

const loadingStyles = {
  fontSize: '24px',
  textAlign: 'center',
  marginTop: '100px',
};

const errorStyles = {
  fontSize: '20px',
  color: 'red',
  textAlign: 'center',
  marginTop: '100px',
};

const tableStyles = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const theadRowStyles = {
  backgroundColor: 'rgba(141,171,182,255)',
};

const thStyles = {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'center',
  color: 'white',
  fontWeight: 'bold',
  backgroundColor: 'rgba(141,171,182,255)',
};

const tbodyRowStyles = {
  backgroundColor: '#ffffff',
};

const tdStyles = {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'center',
};

const deleteButtonStyle = {
  backgroundColor: 'rgba(141,171,182,255)',
  color: 'white',
  border: 'none',
  padding: '5px 10px',
  borderRadius: '5px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};
const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "15px", 
    marginBottom: "15px"
  };


export default DeleteEnrollments;

