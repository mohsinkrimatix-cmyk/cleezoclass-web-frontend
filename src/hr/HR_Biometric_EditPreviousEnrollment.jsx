import { useRef, useState, useEffect } from 'react';
import { Edit } from 'lucide-react';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock, faUserTimes, faBookReader, faUserCheck, faTrophy, faExclamationCircle, faAward,
  // ADDED ICONS: Print, Download, Edit
  faPrint, faDownload, faEdit, faTimes, 
  faShareAlt
} from "@fortawesome/free-solid-svg-icons";

const FollowUp = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const navigate = useNavigate();

  const headerRef = useRef();
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
    const reportTitle = "Edit Admissions";
  const dataToDisplay = admissions;

  // --- Fetch School Logo ---
  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) return;
      setDynamicSchoolCode(code);
      try {
        const response = await axios.post('https://cleezoclass.com:4000/api/schoollogodynamic', { secretecode: code });
        if (response.data.logoPath) setDynamicLogoSrc(response.data.logoPath);
      } catch (error) {
        console.error('Error fetching school logo:', error);
      }
    };
    fetchSchoolLogo();
  }, []);

  // --- Fetch Admission Data ---
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const schoolCode = localStorage.getItem('schoolCode');
        if (!schoolCode) throw new Error('No schoolCode found in localStorage');

        const response = await axios.get('https://cleezoclass.com:4000/admissions', {
          params: { schoolCode },
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

  // --- Edit Handlers ---
const handleEditClick = (admission) => {
  setEditingAdmission(admission.id);

  setEditFormData({
    ...admission,
    dob: admission.dob ? admission.dob.split("T")[0] : "", // convert to YYYY-MM-DD
  });
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSaveEdit = async () => {
  try {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return alert("❌ School code missing!");

    const formDataToSend = new FormData();

    Object.keys(editFormData).forEach((key) => {
      if (editFormData[key] instanceof File) {
        formDataToSend.append(key, editFormData[key]);
      } else {
        formDataToSend.append(key, editFormData[key] || "");
      }
    });

    await axios.put(
      `https://cleezoclass.com:4000/admissions/${editingAdmission}`,
      formDataToSend,
      {
        params: { schoolCode },
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    // Update local state
    setAdmissions((prev) =>
      prev.map((a) => (a.id === editingAdmission ? { ...a, ...editFormData } : a))
    );

    setEditingAdmission(null);
    alert(`✅ Admission ID ${editingAdmission} updated successfully!`);
  } catch (error) {
    console.error(error);
    alert("❌ Failed to update data.");
  }
};

  const handleCancelEdit = () => {
    setEditingAdmission(null);
    setEditFormData({});
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

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading Admissions Details</div>;
  if (error) return <div style={{ textAlign: 'center', color: 'red', marginTop: '100px' }}>{error}</div>;

  return (
    <>   

      {/* Main Table */}
      <div style={{ padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }} ref={headerRef}>
        <h1  style={{ textAlign: 'left', marginBottom: '30px', fontSize: '16px',     color: '#2F2E2EFF'
 }}>Edit Admissions</h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          
          
          <thead>
            <tr style={{ backgroundColor: 'rgba(141,171,182,255)' }}>
             <th>ID</th>
      <th  style={thStyles}>Student Name</th>
      <th  style={thStyles}>DOB</th>
      <th  style={thStyles}>Class Applied</th>
      <th style={thStyles}> Father Name</th>
      <th style={thStyles}>Mother Name</th>
      <th style={thStyles}>Phone</th>
      <th style={thStyles}>Address</th>
      <th style={thStyles}>Score</th>
      <th style={thStyles}>TC</th>
      <th style={thStyles}>Aadhar</th>
      <th style={thStyles}>DOB </th>
      <th style={thStyles}>Apaar </th>
      <th style={thStyles}>Father ID</th>
      <th style={thStyles}>Mother ID</th>
      <th style={thStyles}>Address Proof</th>
              <th style={thStyles}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map(admission => (
              <tr key={admission.id} style={{ backgroundColor: '#fff' }}>
                <td style={tdStyles}>{String(admission.id).substring(0, 10)}</td>
                <td style={tdStyles}>{admission.student_name}</td>
                <td style={tdStyles}>{new Date(admission.dob).toLocaleDateString()}</td>
                                <td style={tdStyles}>{admission.lead_admission_for}</td>

                <td style={tdStyles}>{admission.full_name}</td>
                                                <td style={tdStyles}>{admission.mother_name}</td>

                <td style={tdStyles}>{admission.mobile_number}</td>
                <td style={tdStyles}>{admission.address}</td>
          
                <td style={tdStyles}>{admission.test_score ?? "N/A"}</td>
                <td style={tdStyles}>{admission.tc_document ? "✅" : "❌"}</td>
        <td style={tdStyles}>{admission.aadhar_document ? "✅" : "❌"}</td>
        <td style={tdStyles}>{admission.dob_document ? "✅" : "❌"}</td>
        <td style={tdStyles}>{admission.appeared_document ? "✅" : "❌"}</td>
        <td style={tdStyles}>{admission.father_id ? "✅" : "❌"}</td>
        <td style={tdStyles}>{admission.mother_id ? "✅" : "❌"}</td>
        <td style={tdStyles}>{admission.address_proof ? "✅" : "❌"}</td>
                <td style={tdStyles}>
                  <button onClick={() => handleEditClick(admission)} style={editBtnStyles}>
                    <Edit size={16} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


{editingAdmission && (
  <div style={popupOverlay}>
    <div style={popupBox}>
      <h2>Edit Admission</h2>
      <div style={popupForm}>
        {[
          "student_name",
          "dob",
          "full_name",
          "mobile_number",
          "mother_name",

          "address",
          "lead_admission_for",
          "test_score",
        ].map((field) => (
          <div
            key={field}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <label
              style={{
                width: "150px", // fixed width for labels
                fontWeight: 200,
                marginRight: "10px",
                textAlign: "left",
                fontSize:'14px'
              }}
            >
              {field.replace(/_/g, " ").toUpperCase()}:
            </label>
            <input
              type={field === "dob" ? "date" : field === "test_score" ? "number" : "text"}
              name={field}
              value={editFormData[field] || ""}
              onChange={handleInputChange}
              style={{
                flex: 1, // input takes remaining space
                padding: "6px 8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        ))}
      </div>

      <div style={popupButtons}>
        <button style={saveBtn} onClick={handleSaveEdit}>
          💾 Save
        </button>
        <button style={cancelBtn} onClick={handleCancelEdit}>
          ❌ Cancel
        </button>
      </div>
    </div>
  </div>
)}




    </>
  );
};

// ====== Styles ======
const thStyles = {
  padding: '8px',
  border: '1px solid #ddd',
  textAlign: 'center',
  color: 'white',
  fontWeight: '100',
  fontSize:'10px'
};

const tdStyles = {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'center',
    fontSize:'10px'

};

const editBtnStyles = {
  backgroundColor: 'rgba(141,171,182,255)',
  color: 'white',
  border: 'none',
  padding: '5px 10px',
  borderRadius: '5px',
  cursor: 'pointer'
};

const popupOverlay = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100
};

const popupBox = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '10px',
  width: '95%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
      scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
};

const popupForm = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '10px'
};

const popupButtons = {
  marginTop: '15px',
  display: 'flex',
  justifyContent: 'space-between'
};

const saveBtn = {
  backgroundColor: 'rgba(141,171,182,255)',
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '5px'
};

const cancelBtn = {
  backgroundColor: 'rgba(141,171,182,255)',
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '5px'
};

const inputField = {
  padding: '8px',
  borderRadius: '5px',
  border: '1px solid #ccc'
};
const actionBtnContainerStyle = {
    display: "flex", 
    justifyContent: "flex-end", // Align right
    gap: "10px", 
    marginBottom: "15px"
  };
  

export default FollowUp;
