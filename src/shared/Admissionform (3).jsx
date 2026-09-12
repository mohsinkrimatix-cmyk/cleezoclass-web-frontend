import React, { useEffect, useState } from 'react';
import axios from 'axios';


function Applicationss() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();
const linkStyle = {
  margin: "0 10px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center"
};

const iconStyle = {
  padding: "10px",
  borderRadius: "50%",
  fontSize: "25px",
  transition: "all 0.3s",
  width: "40px",
  height: "40px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const response = await axios.get('https://cleezoclass.com:4000/api/admissions');
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

  if (loading) {
    return <div style={loadingStyles}>Loading Admissions...</div>;
  }

  if (error) {
    return <div style={errorStyles}>{error}</div>;
  }

  return (
    <div style={containerStyles}>
      <h1 style={pageHeaderStyles}>Admissions Management</h1>

      <table style={tableStyles}>
        <thead>
          <tr style={theadRowStyles}>
            {/* Admission Details */}
            <th style={thStyles}>Admin ID</th>
            <th style={thStyles}>Student Name</th>
            <th style={thStyles}>DOB</th>
            <th style={thStyles}>Gender</th>

            <th style={thStyles}>Father's Name</th>   <th style={thStyles}>Father's Phone</th>
            <th style={thStyles}>Father's Occupation</th>
         

       
             <th style={thStyles}>Mother's Name</th>
            <th style={thStyles}>Mother's Phone</th>
            <th style={thStyles}>Mother's Occupation</th>
            <th style={thStyles}>Address</th>
            <th style={thStyles}>Score</th>

            {/* Submitted Documents */}
            <th style={thStyles}>Student Photo</th>
            <th style={thStyles}>Birth Certificate</th>
            <th style={thStyles}>Aadhar Card</th>
            <th style={thStyles}>TC</th>
            <th style={thStyles}>Mark Sheet</th>
            {/* <th style={thStyles}>Submission Time</th> */}
          </tr>
        </thead>
        <tbody>
          {admissions.map((admission) => (
            <tr key={admission.id} style={tbodyRowStyles}>
              {/* Admission Details */}
              <td style={tdStyles}>{String(admission.id).substring(0, 10)}</td>
              <td style={tdStyles}>{admission.student_name}</td>
              <td style={tdStyles}>{new Date(admission.dob).toLocaleDateString()}</td>
              <td style={tdStyles}>{admission.gender}</td>

              <td style={tdStyles}>{admission.father_name}</td>
              <td style={tdStyles}>{admission.mother_name}</td>
              {/* <td style={tdStyles}>{admission.address}</td>
              <td style={tdStyles}>
                {admission.score !== null ? admission.score : <span style={notSubmittedStyles}>N/A</span>}
              </td> */}

              {/* Father's and Mother's Contact and Occupation */}
              <td style={tdStyles}>{admission.father_phone || <span style={notSubmittedStyles}>❌</span>}</td>
              <td style={tdStyles}>{admission.father_occupation || <span style={notSubmittedStyles}>❌</span>}</td>
              <td style={tdStyles}>{admission.mother_phone || <span style={notSubmittedStyles}>❌</span>}</td>
              <td style={tdStyles}>{admission.mother_occupation || <span style={notSubmittedStyles}>❌</span>}</td>
              <td style={tdStyles}>{admission.address}</td>
              <td style={tdStyles}>
                {admission.score !== null ? admission.score : <span style={notSubmittedStyles}>N/A</span>}
              </td>

              {/* Submitted Documents */}
              <td style={tdStyles}>
                {admission.student_photo ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
              </td>
              <td style={tdStyles}>
                {admission.birth_certificate ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
              </td>
              <td style={tdStyles}>
                {admission.aadhar_card ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
              </td>
              <td style={tdStyles}>
                {admission.tc ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
              </td>
              <td style={tdStyles}>
                {admission.mark_sheet ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
              </td>
              {/* <td style={tdStyles}>
                {admission.submission_time ? new Date(admission.submission_time).toLocaleString() : <span style={notSubmittedStyles}>❌</span>}
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ====== Styles ======

const containerStyles = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#f5f5f5',
  minHeight: '100vh',
};

const pageHeaderStyles = {
  textAlign: 'center',
  marginBottom: '30px',
  fontSize: '32px',
  color: '#228B22',
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
  backgroundColor: '#ADD8E6', // Light blue color for thead rows
};

const thStyles = {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'center',
  color: 'white', // dark text
  fontWeight: 'bold',
  backgroundColor: '#ADD8E6',
};

const tbodyRowStyles = {
  backgroundColor: '#ffffff',
};

const tdStyles = {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'center',
};

const submittedStyles = {
  color: 'green',
  fontWeight: 'bold',
};

const notSubmittedStyles = {
  color: 'red',
  fontWeight: 'bold',
};

export default Applicationss;