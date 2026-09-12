import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { faPrint, faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const StudentData = () => {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schoolCode, setSchoolCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
  const contentRef = useRef(null);
  const navigate = useNavigate();
  const [popupMessage, setPopupMessage] = useState('');

  // Fetch school code and logo
  useEffect(() => {
    const code = localStorage.getItem('schoolCode');
    if (!code) {
      setError("School code not found in localStorage");
      return;
    }
    setSchoolCode(code);
    setDynamicSchoolCode(code);
    const fetchSchoolLogo = async () => {
      try {
        const response = await axios.post(
          'https://cleezoclass.com:4000/api/schoollogodynamic',
          { secretecode: code },
          { headers: { 'Content-Type': 'application/json' } }
        );
        if (response.data.logoPath) {
          setDynamicLogoSrc(response.data.logoPath);
        }
      } catch (error) {
        console.error('Error fetching school logo:', error);
      }
    };
    fetchSchoolLogo();
  }, []);

  // Fetch classes
  useEffect(() => {
    if (!schoolCode) return;
    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://cleezoclass.com:4000/api/classesselectedstudents`,
          { params: { schoolCode } }
        );
        if (Array.isArray(response.data)) {
          setClasses(response.data);
        } else {
          setError('Unexpected data format received for classes');
        }
      } catch (err) {
        setError('Failed to fetch classes');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, [schoolCode]);

  // Fetch sections
  useEffect(() => {
    if (!selectedClass || !schoolCode) return;
    const fetchSections = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://cleezoclass.com:4000/api/sections/${selectedClass}`,
          { params: { schoolCode } }
        );
        if (Array.isArray(response.data)) {
          setSections(response.data);
        } else {
          setError('Unexpected data format received for sections');
        }
        setSelectedSection('');
      } catch (err) {
        setError('Failed to fetch sections');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSections();
  }, [selectedClass, schoolCode]);
  useEffect(() => {
    const fetchStudentData = async () => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🚀 Fetching All Students");

      try {
        const schoolCode = await AsyncStorage.getItem("schoolCode");

        console.log("🏫 School Code:", schoolCode);

        if (!schoolCode) {
          Alert.alert("School code missing");
          return;
        }

        const response = await fetch(
          "https://cleezoclass.com:4000/api/studentsData",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              schoolcode: schoolCode,
            },
          }
        );

        console.log("📡 API Status:", response.status);

        if (!response.ok) {
          Alert.alert("Failed to fetch students");
          return;
        }

        const data = await response.json();

        console.log("📦 API Response:", data);

        setStudents(data.students || []);
      } catch (error) {
        console.error("🔥 Fetch Error:", error);
        Alert.alert("Error fetching students");
      } finally {
        setLoading(false);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      }
    };

    fetchStudentData();
  }, []);

  // Fetch students
  useEffect(() => {
    if (!selectedClass || !selectedSection || !schoolCode) return;
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://cleezoclass.com:4000/api/users/${selectedClass}`,
          {
            params: {
              user_type: 'student',
              schoolCode,
              section: selectedSection,
            },
          }
        );
        setStudents(response.data);
      } catch (err) {
        setError('Failed to fetch students');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClass, selectedSection, schoolCode]);

  // Filter students by search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Custom Print Function
  const handlePrint = (title, contentRef) => {
    const content = contentRef.current;
    if (content) {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>' + title + '</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        thead tr { background-color: #f2f2f2; }
        .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        .print-table thead tr { background-color: #f2f2f2; }
      `);
      printWindow.document.write('</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<h2>${title}</h2>`);
      printWindow.document.write(content.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } else {
      setPopupMessage("No printable content found.");
    }
  };

  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    // Temporarily hide non-print elements
    const noPrintElements = document.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');

    const canvas = await html2canvas(contentRef.current, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Restore hidden elements
    noPrintElements.forEach(el => el.style.display = '');

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgWidth = 297; // A4 landscape width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`students_${selectedClass}_${selectedSection}.pdf`);
  };

  // UI Styles
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1800px',
      margin: '0 auto',
      position: 'relative',
      fontFamily: 'Arial, sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333',
    },
    actionButtons: {
      display: 'flex',
      gap: '10px',
    },
    button: {
      padding: '10px 15px',
      backgroundColor: '#5a7488',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '14px',
    },
    filterRow: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    filterGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    label: {
      fontWeight: '500',
      color: '#555',
    },
    select: {
      padding: '8px',
      width: '150px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '14px',
    },
    input: {
      padding: '8px',
      width: '200px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '14px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px',
      fontSize: '14px',
    },
    tableHeader: {
      backgroundColor: '#f2f2f2',
      padding: '10px',
      textAlign: 'left',
      borderBottom: '1px solid #ddd',
      fontWeight: '600',
    },
    tableCell: {
      padding: '10px',
      border: '1px solid #ddd',
    },
    error: {
      color: 'red',
      margin: '10px 0',
    },
    loading: {
      margin: '10px 0',
      color: '#5a7488',
    },
    popup: {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '15px',
      borderRadius: '5px',
      border: '1px solid #f5c6cb',
      zIndex: 1000,
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
    },
  };

  return (
    <div style={styles.container}>
      {/* Popup Message */}
      {popupMessage && (
        <div style={styles.popup}>
          {popupMessage}
          <button
            onClick={() => setPopupMessage('')}
            style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header with Logo and Action Buttons */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <img
            src={dynamicLogoSrc || '/default-logo.png'}
            alt="School Logo"
            style={{ height: '60px' }}
          />
          <span>{dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL</span>
        </div>
        <div style={styles.actionButtons} className="no-print">
          <button onClick={() => navigate('/StudentUpload')} style={styles.button}>
            <FontAwesomeIcon icon={faUpload} />
            <span>Upload</span>
          </button>
          <button
            onClick={() => handlePrint(`${selectedClass} - Section ${selectedSection}`, contentRef)}
            style={styles.button}
          >
            <FontAwesomeIcon icon={faPrint} />
            <span>Print</span>
          </button>
          <button onClick={handleDownloadPDF} style={styles.button}>
            <FontAwesomeIcon icon={faDownload} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div style={styles.filterRow} className="no-print">
        <div style={styles.filterGroup}>
          <label style={styles.label}>Search by Name:</label>
          <input
            type="text"
            placeholder="Enter name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Class:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={styles.select}
            disabled={isLoading}
          >
            <option value="">-- Select Class --</option>
            {classes.map((classItem) => (
              <option key={classItem.class_name} value={classItem.class_name}>
                {classItem.class_name}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Section:</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={styles.select}
            disabled={!selectedClass || isLoading}
          >
            <option value="">-- Select Section --</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error and Loading States */}
      {error && <div style={styles.error}>{error}</div>}
      {isLoading && <div style={styles.loading}>Loading...</div>}

      {/* Student Table (Printable) */}
      {selectedClass && selectedSection && (
        <div ref={contentRef} className="print-only">
          <h3>
            {selectedClass} - Section {selectedSection}
            <span style={{ marginLeft: '10px', fontSize: '14px' }}>
              Total: {filteredStudents.length}
            </span>
          </h3>
          {filteredStudents.length === 0 ? (
            <div>No students found</div>
          ) : (
            <table style={styles.table} className="print-table">
              <thead>
                <tr>
                  <th style={styles.tableHeader}>ID</th>
                  <th style={styles.tableHeader}>Admission No.</th>
                  <th style={styles.tableHeader}>Name</th>
                  <th style={styles.tableHeader}>Username</th>
                  <th style={styles.tableHeader}>Father's Name</th>
                  <th style={styles.tableHeader}>Gender</th>
                  <th style={styles.tableHeader}>Phone</th>
                  <th style={styles.tableHeader}>Class</th>
                  <th style={styles.tableHeader}>Section</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td style={styles.tableCell}>{student.id}</td>
                    <td style={styles.tableCell}>{student.admission_no || '-'}</td>
                    <td style={styles.tableCell}>{student.name}</td>
                    <td style={styles.tableCell}>{student.username || '-'}</td>
                    <td style={styles.tableCell}>{student.father_name || '-'}</td>
                    <td style={styles.tableCell}>{student.gender || '-'}</td>
                    <td style={styles.tableCell}>{student.phone_no || '-'}</td>
                    <td style={styles.tableCell}>{student.class_name || '-'}</td>
                    <td style={styles.tableCell}>{student.section || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentData;
