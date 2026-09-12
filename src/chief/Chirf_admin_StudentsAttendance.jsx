import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import schoolLogo from '../assets/download.png';
import { FaUser } from 'react-icons/fa';

function StudentsAttendance() {
  const [selectedClass, setSelectedClass] = useState('1');
  const [selectedRoll, setSelectedRoll] = useState('');
  const [selectedRange, setSelectedRange] = useState('');
  const [highestScorer, setHighestScorer] = useState(null);
  const [overallHighest, setOverallHighest] = useState(null);
  const [mostAppreciated, setMostAppreciated] = useState(null);
  const [containerWidth, setContainerWidth] = useState('90vw');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navigate = useNavigate();

  // ✅ Retrieve schoolCode from localStorage
  const schoolCode = localStorage.getItem('schoolCode');
  console.log('Retrieved schoolCode:', schoolCode);

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setContainerWidth('95vw');
      else if (window.innerWidth < 1024) setContainerWidth('85vw');
      else setContainerWidth('70vw');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchHighestScorer(selectedClass);
  }, [selectedClass]);

  // ✅ Fetch class-wise highest scorer
  const fetchHighestScorer = async (className) => {
    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/api/highest-scorer', {
        class_name: className,
        school_code: schoolCode, // ✅ send schoolCode
      });
      setHighestScorer(response.data && typeof response.data === 'object' ? response.data : null);
    } catch (error) {
      console.error(error);
      setHighestScorer(null);
    }
  };

  // ✅ Fetch overall highest scorer
  const fetchOverallHighestScorer = async () => {
    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/api/overall-highest-scorer', {
        school_code: schoolCode, // ✅ send schoolCode
      });
      setOverallHighest(response.data && typeof response.data === 'object' ? response.data : null);
    } catch (error) {
      console.error(error);
      setOverallHighest(null);
    }
  };

  // ✅ Fetch most appreciated student
  const fetchMostAppreciatedStudent = async () => {
    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/api/student-most-positive-comments', {
        school_code: schoolCode, // ✅ send schoolCode
      });
      setMostAppreciated(response.data && typeof response.data === 'object' ? response.data : null);
    } catch (error) {
      console.error(error);
      setMostAppreciated(null);
    }
  };

  useEffect(() => {
    fetchOverallHighestScorer();
    fetchMostAppreciatedStudent();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedRange) {
      navigate(`/students-list?class=${selectedClass}&range=${selectedRange}`);
    }
  }, [selectedClass, selectedRange, navigate]);

  const renderProgressBar = (percent) => (
    <div style={styles.progressBar}>
      <div style={{ ...styles.progress, width: `${percent}%`, backgroundColor: '#4CAF50' }} />
    </div>
  );

  const classOptions = ['Nursery', 'LKG', 'UKG', '1','2','3','4','5','6','7','8','9','10'];
  const rangeOptions = ['FA1','FA2','SA1','FA3','FA4','SA2','THIS WEEK','LAST WEEK'];
  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  const styles = {
    pageWrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      width: "100%",
      backgroundColor: "#6b7983ff",
      padding: isMobile ? "10px" : "20px",
      boxSizing: "border-box",
    },
    outerContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: isMobile ? "20px" : "50px",
      width: containerWidth,
      maxWidth: "1000px",
      backgroundColor: "#fff",
      borderRadius: "20px",
      boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
      overflow: "hidden",
    },
    innerContainer: {
      fontFamily: font,
      width: "100%",
      padding: isMobile ? "15px" : "25px",
      boxSizing: "border-box",
    },
    dashboardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 20px",
      backgroundColor: "#FEFEFE",
      borderBottom: "1px solid #ccc",
      flexWrap: "wrap",
    },
    logo: { display: 'flex', alignItems: 'center' },
    logoImg: { width: '50px', height: '50px', marginRight: '10px' },
    schoolName: { fontSize: '20px', fontWeight: 'bold', textAlign: 'center' },
    logoutButton: {
      backgroundColor: '#6200ee',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
    },
    reportTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '20px',
      textAlign: 'left',
      marginTop: '20px',
      marginLeft: '20px',
    },
    filters: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginBottom: '20px',
      alignItems: 'center',
      marginLeft: '20px',
    },
    filterSelect: {
      padding: '10px',
      borderRadius: '18px',
      border: '1px solid #ccc',
      backgroundColor: 'white',
    },
    awardsContainer: {
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '10px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
      width: isMobile ? '90%' : '60%',
      margin: '0 auto 20px',
    },
    awardItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      borderBottom: '1px solid #eee',
      flexWrap: 'wrap',
    },
    awardIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      marginRight: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressBar: {
      flex: 1,
      height: '10px',
      display: 'flex',
      borderRadius: '5px',
      margin: '0 10px',
      overflow: 'hidden',
      backgroundColor: '#FF4C4C',
    },
    progress: { height: '100%', borderRadius: '5px' },
    awardDate: { color: '#666', fontSize: '12px' },
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          {/* Header */}
          <header style={styles.dashboardHeader}>
            <div style={styles.logo}>
              <img src={schoolLogo} alt="ABC School Logo" style={styles.logoImg} />
              <span>
                <strong>Tanz AI</strong><br />
                <small>For Schools</small>
              </span>
            </div>
            <div style={styles.schoolName}>ABC School, Miyapur, Hyderabad</div>
            <button style={styles.logoutButton}>Logout</button>
          </header>

          {/* Report Title */}
          <div style={styles.reportTitle}>REPORT - ACADEMICS - Student Report</div>

          {/* Filters */}
          <div style={styles.filters}>
            <select
              style={styles.filterSelect}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classOptions.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>

            <select
              style={styles.filterSelect}
              value={selectedRoll}
              onChange={(e) => setSelectedRoll(e.target.value)}
            >
              <option value="">Roll No.</option>
            </select>

            <select
              style={styles.filterSelect}
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option value="">Select Range</option>
              {rangeOptions.map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          {/* Awards Section */}
          <div style={styles.awardsContainer}>
            {[{
              title: `Highest Scorer (Class ${selectedClass})`,
              data: highestScorer,
              color: '#FFD700'
            }, {
              title: 'School People Leader',
              data: overallHighest,
              color: '#1E90FF'
            }, {
              title: 'Discipline & Punctual',
              data: mostAppreciated,
              color: '#808080'
            }].map((award, idx) => (
              <div key={idx} style={styles.awardItem}>
                <div style={{ ...styles.awardIcon, backgroundColor: award.color }}>
                  <FaUser color="white" size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{award.title}</div>
                  <div style={{ color: '#666' }}>
                    {award.data
                      ? `${award.data.name}, Class ${award.data.class_name || selectedClass} - Section ${award.data.section || 'N/A'}`
                      : 'No data available'}
                  </div>
                </div>
                {renderProgressBar(
                  award.data
                    ? parseFloat(
                        award.data.avg_marks ||
                        award.data.positive_comment_count ||
                        0
                      )
                    : 0
                )}
                <div style={styles.awardDate}>Updated Now</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentsAttendance;
