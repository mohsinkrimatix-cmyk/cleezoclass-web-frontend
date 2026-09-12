import React, { useState, useEffect } from 'react';
import axios from 'axios';


function UnpaidStudents() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [unpaidStudents, setUnpaidStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchClassSections = async () => {
      try {
        const schoolCode = localStorage.getItem('schoolCode');
        if (!schoolCode) {
          setError('School code not found');
          return;
        }
        const response = await axios.get('https://cleezoclass.com:4000/api/class-sections', {
          params: { schoolCode }
        });


        setClasses(response.data.classes);
        setSections(response.data.sections);
      } catch (err) {
        console.error('Error fetching classes and sections:', err);
        setError('Failed to load class/section data');
      }
    };


    fetchClassSections();
  }, []);


useEffect(() => {
    const fetchUnpaidStudents = async () => {
        if (!selectedClass || !selectedSection) {
            return;
        }


        setLoading(true);
        setError(null);


        try {
            const schoolCode = localStorage.getItem('schoolCode');
            if (!schoolCode) {
                setError('School code not found');
                setLoading(false);
                return;
            }


            // Call the new API endpoint
            const response = await axios.get('https://cleezoclass.com:4000/api/fee-payment-status', {
                params: {
                    class_name: selectedClass,
                    section: selectedSection,
                    schoolCode
                }
            });


            // The backend now returns only the unpaid students, so no need for client-side filtering.
            setUnpaidStudents(response.data);
        } catch (err) {
            console.error('Error fetching unpaid students:', err);
            setError('Failed to load unpaid student data');
        } finally {
            setLoading(false);
        }
    };


    fetchUnpaidStudents();
}, [selectedClass, selectedSection]);


  const formatNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };


  const calculateTotalPaid = (student) => {
    const tuition = parseFloat(student.Paid_Amount) || 0;
    const books = parseFloat(student.books_paid) || 0;
    const bus = parseFloat(student.bus_paid) || 0;
    const uniform = parseFloat(student.uniform_paid) || 0;
    const exam = parseFloat(student.exam_paid) || 0;
    const others = parseFloat(student.others_paid) || 0;
    return tuition + books + bus + uniform + exam + others;
  };


  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    heading: {
      textAlign: 'center',
      margin: 0,
      color: '#1e293b',
      fontSize: '27px',
      fontWeight: '700',
      marginBottom: '30px'
    },
    filterSection: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '20px'
    },
    select: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ccc'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      overflowX: 'auto'
    },
    th: {
      backgroundColor: '#5a7488',
      padding: '12px',
      textAlign: 'center',
      border: '1px solid #ddd',
      whiteSpace: 'nowrap',
      color:'#fff'
    },
    td: {
      padding: '12px',
      border: '1px solid #ddd',
      textAlign: 'center'
    },
    loading: {
      textAlign: 'center',
      padding: '20px'
    },
    error: {
      color: 'red',
      textAlign: 'center',
      padding: '20px'
    }
  };
  const headerStyle = {
        color: 'black',
        top: '0',
        zIndex: '50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 15px',
        width: '100%',
    };
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');


  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) {
        console.warn('No school code found in localStorage. Aborting fetch.');
        return;
      }
      setDynamicSchoolCode(code);
      try {
        const response = await axios.post(
          'https://cleezoclass.com:4000/api/schoollogodynamic',
          { secretecode: code },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        if (response.data.logoPath) {
          setDynamicLogoSrc(response.data.logoPath);
        }
      } catch (error) {
        console.error('Error fetching school logo:', error.response?.data || error.message);
      }
    };
    fetchSchoolLogo();
  }, []);


  return (
    <div style={styles.container}>
      <header style={headerStyle}>
                        <div style={{ width: '60px' }}>
                            {dynamicLogoSrc && (
                                <img
                                    src={dynamicLogoSrc}
                                    alt="School Logo"
                                    style={{ height: '50px', width: '50px', objectFit: 'contain' }}
                                    className="header-logo"
                                />
                            )}
                        </div>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <h1 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0, color: 'black' }}>
                                {dynamicSchoolCode.replace(/_/g, ' ')}
                            </h1>
                        </div>
                       
                    </header>
  <h1
    style={{
      fontSize: "1rem",
      fontWeight: "600",
      margin: 0,
    }}
  >
unpaid studnets  </h1>
      <div style={styles.filterSection}>
        <div>
          <label>Class:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={styles.select}
            required
          >
            <option value="">Select Class</option>
            {classes.map((cls, index) => (
              <option key={index} value={cls}>{cls}</option>
            ))}
          </select>
        </div>


        <div>
          <label>Section:</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={styles.select}
            required
          >
            <option value="">Select Section</option>
            {sections.map((sec, index) => (
              <option key={index} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      </div>


      {loading ? (
        <div style={styles.loading}>Loading student data...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Father's Name</th>
                <th style={styles.th}>Mobile No.</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Section</th>
                <th style={styles.th}>Total Fee</th>
                <th style={styles.th}>Paid</th>
                <th style={styles.th}>Remaining</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
          <tbody>
  {unpaidStudents.map((student) => (
    <tr key={student.student_id}>
      <td style={styles.td}>{student.StudentName || 'N/A'}</td>
      <td style={styles.td}>{student.FatherName || 'N/A'}</td>
      <td style={styles.td}>{student.MobileNo || 'N/A'}</td>
      <td style={styles.td}>{student.Class_name || 'N/A'}</td>
      <td style={styles.td}>{student.section || 'N/A'}</td>
      <td style={styles.td}>₹{formatNumber(student.CompleteFee)}</td>
      <td style={styles.td}>₹{formatNumber(calculateTotalPaid(student))}</td>
      <td style={styles.td}>₹{formatNumber(student.Remaining_Amount)}</td>
<td style={styles.td}>
  {(() => {
    const unpaidInstallments = [];

    for (let i = 1; i <= 5; i++) {
      const amount = parseFloat(student[`Installment${i}_Amount`]) || 0;
      const paid = parseFloat(student[`Installment${i}_Paid`]) || 0;

      if (amount > 0 && paid < amount) {
        unpaidInstallments.push(`Installment ${i}: ₹${formatNumber(amount)}`);
      }
    }

    return unpaidInstallments.length > 0
      ? unpaidInstallments.join(', ')
      : 'Paid';
  })()}
</td>

    </tr>
  ))}
</tbody>

          </table>
        </div>
      )}
    </div>
  );
}


export default UnpaidStudents;