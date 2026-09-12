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

  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');

  // Fetch classes and sections on load
  useEffect(() => {
    const fetchClassSections = async () => {
      try {
        const schoolCode = localStorage.getItem('schoolCode');
        if (!schoolCode) {
          setError('School code not found');
          return;
        }

        const response = await axios.get('https://cleezoclass.com:4000/api/class-sections', {
          params: { schoolCode },
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

  // Fetch unpaid students after class & section selected
  useEffect(() => {
    const fetchUnpaidStudents = async () => {
      if (!selectedClass || !selectedSection) return;

      setLoading(true);
      setError(null);

      try {
        const schoolCode = localStorage.getItem('schoolCode');
        if (!schoolCode) {
          setError('School code not found');
          setLoading(false);
          return;
        }

        const response = await axios.get('https://cleezoclass.com:4000/api/fee-payment-status', {
          params: { class_name: selectedClass, section: selectedSection, schoolCode },
        });

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

  // Fetch school logo
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
        console.error('Error fetching school logo:', error.response?.data || error.message);
      }
    };
    fetchSchoolLogo();
  }, []);

  const styles = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: {
      color: 'black',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 15px',
      marginBottom: '20px',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      padding: '20px',
      marginTop: '10px',
    },
    cardHeader: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#333',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    circle: {
      display: 'inline-block',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
    },
    dropdown: {
      padding: '8px',
      borderRadius: '6px',
      border: '1px solid #ccc',
    },
    label: { marginRight: '8px', fontWeight: 'bold' },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ width: '60px' }}>
          {dynamicLogoSrc && (
            <img
              src={dynamicLogoSrc}
              alt="School Logo"
              style={{ height: '50px', width: '50px', objectFit: 'contain' }}
            />
          )}
        </div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'black', textAlign: 'center', flex: 1 }}>
          {dynamicSchoolCode.replace(/_/g, ' ')}
        </h1>
      </header>

      {/* Title */}
      <h2 style={{ textAlign: 'center', fontSize: '1rem', fontWeight: '600', marginBottom: '10px' }}>
        Unpaid Students
      </h2>

      {/* SCAN & PULL CARD */}
      <div style={styles.card}>
        <h2 style={styles.cardHeader}>
          <span style={{ ...styles.circle, backgroundColor: '#FFEB3B' }} /> Scan & Pull
        </h2>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Pending Dropdowns Combined */}
          <div>
            <label style={styles.label}>Pending:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={styles.dropdown}
            >
              <option value="">Select Class</option>
              {classes.map((cls, index) => (
                <option key={index} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>

            {selectedClass && (
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                style={{ ...styles.dropdown, marginLeft: '10px' }}
              >
                <option value="">Select Section</option>
                {sections.map((sec, index) => (
                  <option key={index} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            )}

            {/* Student Names (only shown after class & section selected) */}
            {selectedSection && (
              <select style={{ ...styles.dropdown, marginLeft: '10px' }}>
                <option value="">Select Student</option>
                {loading ? (
                  <option>Loading...</option>
                ) : unpaidStudents.length > 0 ? (
                  unpaidStudents.map((student) => (
                    <option key={student.student_id} value={student.StudentName}>
                      {student.StudentName}
                    </option>
                  ))
                ) : (
                  <option disabled>No Pending Students</option>
                )}
              </select>
            )}
          </div>

          {/* Remind Option */}
          <div>
            <label style={styles.label}>Remind:</label>
            <select style={styles.dropdown}>
              <option value="">Select</option>
              <option value="SMS">Send SMS Reminder</option>
              <option value="Email">Send Email</option>
              <option value="Call">Call Parent</option>
            </select>
          </div>
        </div>

        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      </div>
    </div>
  );
}

export default UnpaidStudents;
