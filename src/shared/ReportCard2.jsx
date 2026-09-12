import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import schoolLogo from '../assets/download.png';

const ReportCardFull = () => {
  const location = useLocation();
  const { name, class: studentClass, section } = location.state || {};
  const [studentDetails, setStudentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [academicPerformance, setAcademicPerformance] = useState([]);
  const [isMobile, setIsMobile] = useState(false); // Force A4 landscape, ignore mobile
  const [behaviour, setBehaviour] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [activities, setActivities] = useState([]);

  // --- Constants for Marks and Weights ---
  const FA_MAX_MARKS = 25;
  const SA_MAX_MARKS = 80;
  const FA_WEIGHTAGE = 0.20; // 20%
  const SA_WEIGHTAGE = 0.60; // 60%

  // --- A4 Landscape Styles ---
  const a4LandscapeStyles = {
    page: {
      width: '297mm',
      height: '210mm',
      margin: '0 auto',
      padding: '5mm',
      boxSizing: 'border-box',
      backgroundColor: '#fff',
      transform: 'scale(0.85)',
      transformOrigin: 'top left',
      overflow: 'hidden',
      border: '2px solid #325490',
      fontFamily: 'Arial, sans-serif',
      fontSize: '9px',
    },
    schoolName: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'rgb(62, 80, 99)',
      margin: '0',
    },
    reportCardTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      padding: '3px 0',
      margin: '5px 0',
      textAlign: 'center',
      color: 'rgb(128, 149, 160)',
    },
    academicTitle: {
      fontWeight: 'bold',
      textAlign: 'center',
      padding: '5px',
      border: '2px solid #325490',
      marginBottom: '5px',
      color: 'rgb(128, 149, 160)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '5px',
      overflowX: 'auto',
      display: 'block',
      fontSize: '8px',
    },
    th: {
      border: '1px solid #000',
      padding: '2px',
      textAlign: 'left',
      backgroundColor: '#D3D3D3',
      fontWeight: 'normal',
      fontSize: '8px',
    },
    td: {
      border: '1px solid #000',
      padding: '2px',
      textAlign: 'left',
      fontSize: '8px',
    },
    subjectHeaderCell: {
      border: '1px solid #000',
      padding: '2px',
      backgroundColor: 'rgb(145, 167, 175)',
      textAlign: 'center',
      fontSize: '8px',
      fontWeight: 'bold',
    },
    termHeader: {
      border: '1px solid #000',
      padding: '2px',
      backgroundColor: 'rgb(145, 167, 175)',
      textAlign: 'center',
      fontSize: '8px',
      fontWeight: 'bold',
    },
    gradeScaleTd: (color) => ({
      border: '1px solid #000',
      padding: '2px',
      backgroundColor: 'rgb(128, 149, 160)',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: '8px',
    }),
    graphsSideBySideContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: '5px',
      margin: '5px 0',
      height:'180px'
    },
    graphContainer: {
      height: '120px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      padding: '3px 3px 0 20px',
      position: 'relative',
      width: '95%', // Adjusted for single column graph
    },
    yAxis: {
      position: 'absolute',
      left: '0',
      top: '0',
      bottom: '0',
      width: '20px',
      borderRight: '1px solid #000',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontSize: '8px',
      textAlign: 'right',
      paddingRight: '2px',
    },
    barWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '0 3px',
      width: '15px',
    },
    bar: (height, color) => ({
      width: '15px',
      height: `${height}px`,
      backgroundColor: color,
      marginBottom: '3px',
      borderRadius: '1px',
    }),
    barLabel: {
      fontSize: '8px',
      textAlign: 'center',
      marginTop: '3px',
    },
  };
const schoolCode = localStorage.getItem('schoolCode');
useEffect(() => {
  const fetchBehaviour = async () => {
    if (!name || !studentClass || !section) return;
    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/api/behaviour', {
        name,
        class_name: studentClass,
        section,
        school_code: schoolCode,
      });
      setBehaviour(response.data);
    } catch (error) {
      console.error('Error fetching behaviour:', error);
    }
  };
  fetchBehaviour();
}, [name, studentClass, section, schoolCode]);

useEffect(() => {
  const fetchAttendance = async () => {
    if (!name || !studentClass || !section) return;
    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/api/attendance', {
        name,
        class_name: studentClass,
        section,
        school_code: schoolCode,
      });
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };
  fetchAttendance();
}, [name, studentClass, section, schoolCode]);

useEffect(() => {
  const fetchActivities = async () => {
    if (!name || !studentClass || !section) return;
    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/api/activities', {
        name,
        class_name: studentClass,
        section,
        school_code: schoolCode,
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };
  fetchActivities();
}, [name, studentClass, section, schoolCode]);

useEffect(() => {
  const fetchAcademicPerformance = async () => {
    if (!name || !studentClass || !section) return;
    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/api/academic-performance', {
        name,
        class_name: studentClass,
        section,
        school_code: schoolCode,
      });
      setAcademicPerformance(response.data);
    } catch (error) {
      console.error('Error fetching academic performance:', error);
    }
  };
  fetchAcademicPerformance();
}, [name, studentClass, section, schoolCode]);

useEffect(() => {
  const fetchStudentDetails = async () => {
    if (!name || !studentClass || !section) return;
    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/api/student-details', {
        name,
        class_name: studentClass,
        section,
        school_code: schoolCode,
      });
      setStudentDetails(response.data);
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchStudentDetails();
}, [name, studentClass, section, schoolCode]);

 
  // --- Data Fetching and Logic (unchanged) ---
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const getUniqueSubjects = () => {
    const subjects = academicPerformance.map((item) => item.subject.toLowerCase());
    return [...new Set(subjects)].map((subject) => ({
      original: academicPerformance.find((item) => item.subject.toLowerCase() === subject).subject,
      normalized: subject,
    }));
  };

  const getMarksForSubjectAndTest = (subject, testType) => {
    const record = academicPerformance.find(
      (item) => item.subject.toLowerCase() === subject.toLowerCase() && item.test_type === testType
    );
    return record ? record.marks : '--';
  };

  const getGradeForFA = (marks) => {
    if (marks === '--' || marks === null || isNaN(marks)) return '--';
    const score = parseFloat(marks);
    if (score >= 23) return 'A1';
    if (score >= 20) return 'A2';
    if (score >= 18) return 'B1';
    if (score >= 15) return 'B2';
    if (score >= 13) return 'C1';
    if (score >= 10) return 'C2';
    if (score >= 8) return 'D';
    return 'E';
  };

  const getGradeForSA = (marks) => {
    if (marks === '--' || marks === null || isNaN(marks)) return '--';
    const score = parseFloat(marks);
    if (score >= 73) return 'A1';
    if (score >= 65) return 'A2';
    if (score >= 57) return 'B1';
    if (score >= 49) return 'B2';
    if (score >= 41) return 'C1';
    if (score >= 33) return 'C2';
    if (score >= 27) return 'D';
    return 'E';
  };

  const getGradeForMarks = (marks) => {
    if (marks === '--' || marks === null || isNaN(marks)) return '--';
    const score = parseFloat(marks);
    if (score >= 91) return 'A1';
    if (score >= 81) return 'A2';
    if (score >= 71) return 'B1';
    if (score >= 61) return 'B2';
    if (score >= 51) return 'C1';
    if (score >= 41) return 'C2';
    if (score >= 33) return 'D';
    return 'E';
  };

  const calculateSubjectTermTotal = (faMarks1, faMarks2, saMarks, termNumber) => {
    const parseMark = (mark, max) => {
      const parsed = parseFloat(mark);
      if (isNaN(parsed) || mark === null || mark === '--' || parsed > max) {
        return null;
      }
      return (parsed / max) * 100; // Unweighted percentage for comparison/average base
    };

    const fa1 = parseMark(faMarks1, FA_MAX_MARKS);
    const fa2 = parseMark(faMarks2, FA_MAX_MARKS);
    const sa = parseMark(saMarks, SA_MAX_MARKS);
    
    if (fa1 === null || fa2 === null || sa === null) {
      return { totalScore: null, totalPercentage: null };
    }
    
    // Weighted calculation for final term total
    const fa1Weighted = fa1 * FA_WEIGHTAGE;
    const fa2Weighted = fa2 * FA_WEIGHTAGE;
    const saWeighted = sa * SA_WEIGHTAGE;
    const totalPercentage = fa1Weighted + fa2Weighted + saWeighted;
    
    return {
      totalScore: totalPercentage,
      totalPercentage: totalPercentage
    };
  };

  const calculateTermTotals = (subjects) => {
    let term1TotalSum = 0;
    let term2TotalSum = 0;
    let term1SubjectCount = 0;
    let term2SubjectCount = 0;

    // New logic for individual test averages across all subjects
    const testAverages = {
      FA1: { sum: 0, count: 0 },
      FA2: { sum: 0, count: 0 },
      SA1: { sum: 0, count: 0 },
      FA3: { sum: 0, count: 0 },
      FA4: { sum: 0, count: 0 },
      SA2: { sum: 0, count: 0 },
    };

    const getTestPercentage = (marks, maxMarks) => {
      const parsed = parseFloat(marks);
      if (!isNaN(parsed) && marks !== null && marks !== '--' && parsed <= maxMarks) {
        return (parsed / maxMarks) * 100;
      }
      return null;
    };

    subjects.forEach(({ original: subject }) => {
      const tests = ['FA1', 'FA2', 'SA1', 'FA3', 'FA4', 'SA2'];
      const maxMarks = { 'FA1': FA_MAX_MARKS, 'FA2': FA_MAX_MARKS, 'SA1': SA_MAX_MARKS, 'FA3': FA_MAX_MARKS, 'FA4': FA_MAX_MARKS, 'SA2': SA_MAX_MARKS };

      tests.forEach(testType => {
        const marks = getMarksForSubjectAndTest(subject, testType);
        const percentage = getTestPercentage(marks, maxMarks[testType]);
        if (percentage !== null) {
          testAverages[testType].sum += percentage;
          testAverages[testType].count++;
        }
      });

      // Existing Term Total calculation logic
      const fa1Marks = getMarksForSubjectAndTest(subject, 'FA1');
      const fa2Marks = getMarksForSubjectAndTest(subject, 'FA2');
      const sa1Marks = getMarksForSubjectAndTest(subject, 'SA1');
      const fa3Marks = getMarksForSubjectAndTest(subject, 'FA3');
      const fa4Marks = getMarksForSubjectAndTest(subject, 'FA4');
      const sa2Marks = getMarksForSubjectAndTest(subject, 'SA2');

      const term1Results = calculateSubjectTermTotal(fa1Marks, fa2Marks, sa1Marks, 1);
      if (term1Results.totalPercentage !== null) {
        term1TotalSum += term1Results.totalPercentage;
        term1SubjectCount++;
      }
      const term2Results = calculateSubjectTermTotal(fa3Marks, fa4Marks, sa2Marks, 2);
      if (term2Results.totalPercentage !== null) {
        term2TotalSum += term2Results.totalPercentage;
        term2SubjectCount++;
      }
    });

    // Calculate final averages
    const avgFA1 = testAverages.FA1.count > 0 ? testAverages.FA1.sum / testAverages.FA1.count : 0;
    const avgFA2 = testAverages.FA2.count > 0 ? testAverages.FA2.sum / testAverages.FA2.count : 0;
    const avgSA1 = testAverages.SA1.count > 0 ? testAverages.SA1.sum / testAverages.SA1.count : 0;
    const avgFA3 = testAverages.FA3.count > 0 ? testAverages.FA3.sum / testAverages.FA3.count : 0;
    const avgFA4 = testAverages.FA4.count > 0 ? testAverages.FA4.sum / testAverages.FA4.count : 0;
    const avgSA2 = testAverages.SA2.count > 0 ? testAverages.SA2.sum / testAverages.SA2.count : 0;

    const term1Percentage = term1SubjectCount > 0 ? term1TotalSum / term1SubjectCount : 0;
    const term2Percentage = term2SubjectCount > 0 ? term2TotalSum / term2SubjectCount : 0;
    
    // Overall calculation remains the same
    const overallTotalSum = term1TotalSum + term2TotalSum;
    const totalTermsCount = (term1SubjectCount > 0 ? 1 : 0) + (term2SubjectCount > 0 ? 1 : 0);
    const overallPercentage = (term1SubjectCount === subjects.length && term2SubjectCount === subjects.length)
      ? (term1Percentage + term2Percentage) / 2
      : (totalTermsCount > 0 ? (term1Percentage + term2Percentage) / totalTermsCount : 0);
      
    return {
      term1Total: term1TotalSum.toFixed(2),
      term2Total: term2TotalSum.toFixed(2),
      overallTotal: overallTotalSum.toFixed(2),
      term1Percentage: term1Percentage.toFixed(2),
      term2Percentage: term2Percentage.toFixed(2),
      overallPercentage: overallPercentage.toFixed(2),
      term1Grade: getGradeForMarks(term1Percentage),
      term2Grade: getGradeForMarks(term2Percentage),
      overallGrade: getGradeForMarks(overallPercentage),
      subjectCount: subjects.length,
      term1SubjectCount,
      term2SubjectCount,
      overallTotalMax: (subjects.length * 200),
      term1TotalMax: (subjects.length * 100),
      // New averages for the graph
      avgFA1, avgFA2, avgSA1, avgFA3, avgFA4, avgSA2
    };
  };

  // --- Colors ---
  const COLOR_NAVY = '#000080';
  const COLOR_LIGHT_BLUE = '#ADD8E6';
  const COLOR_PEACH = '#FFE4B5';
  const COLOR_LIGHT_GREEN = '#90EE90';
  const COLOR_LIGHT_GRAY = '#D3D3D3';
  const COLOR_KHAKI = '#F0E68C';
  const COLOR_GOLD = '#FFD700';
  const COLOR_RED = '#FF6347';
  const COLOR_HEADER_BG = 'rgb(145, 167, 175)';
  const COLOR_BORDER = '#325490';
  const COLOR_TEXT = 'rgb(62, 80, 99)';
  const COLOR_SUB_TEXT = 'rgb(128, 149, 160)';
  const COLOR_GRADE_A = '#90EE90';
  const COLOR_GRADE_B = '#ADD8E6';
  const COLOR_GRADE_C = '#F0E68C';
  const COLOR_GRADE_D = '#FFD700';
  const COLOR_GRADE_E = '#FF6347';
  const COLOR_GRAPH_BAR = '#7fb3d5';


  if (loading) {
    return <div>Loading...</div>;
  }

  const uniqueSubjects = getUniqueSubjects();
  const {
    term1Total,
    term2Total,
    overallTotal,
    term1Percentage,
    term2Percentage,
    overallPercentage,
    overallGrade,
    subjectCount,
    term1TotalMax,
    // Destructure new averages
    avgFA1, avgFA2, avgSA1, avgFA3, avgFA4, avgSA2
  } = calculateTermTotals(uniqueSubjects);

  // --- REWORKED graphData ARRAY CONSTRUCTION ---
  const graphData = [
    // Use the calculated average percentages across all subjects for the value
    { label: 'FA1', value: avgFA1 || 0, color: COLOR_GRAPH_BAR },
    { label: 'FA2', value: avgFA2 || 0, color: COLOR_GRAPH_BAR },
    { label: 'SA1', value: avgSA1 || 0, color: COLOR_GRAPH_BAR },
    { label: 'TermI', value: parseFloat(term1Percentage) || 0, color: COLOR_GRAPH_BAR },
    { label: 'FA3', value: avgFA3 || 0, color: COLOR_GRAPH_BAR },
    { label: 'FA4', value: avgFA4 || 0, color: COLOR_GRAPH_BAR },
    { label: 'SA2', value: avgSA2 || 0, color: COLOR_GRAPH_BAR },
    { label: 'TermII', value: parseFloat(term2Percentage) || 0, color: COLOR_GRAPH_BAR  },
    { label: 'Total', value: parseFloat(overallPercentage) || 0, color: COLOR_GRAPH_BAR },
  ];

  const maxGraphValue = 100;
  // Scales the percentage value (0-100) to a pixel height (0-80px) for the bar
  const graphBarHeightScale = (value) => (value / maxGraphValue) * 80;

  // --- Render ---
  return (
    <div style={{ width: '100vw', overflowX: 'auto', padding: '10px', boxSizing: 'border-box' }}>
      <div style={a4LandscapeStyles.page}>
        {/* Header Section */}
        <div style={{ border: '2px solid #325490', padding: '3px', marginBottom: '5px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '9px', color: 'black', fontWeight: 'bold' }}>
            Affiliation No: **B720183**
          </p>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '5px' ,    borderBottom: '2px solid rgb(128, 149, 160)', // Correct
}}>
            <img src={schoolLogo} alt="ABC School Logo" style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'white' }} />
            <div style={{ lineHeight: '1.1' }}>
              <h1 style={a4LandscapeStyles.schoolName}>
                <span style={{ color: 'rgb(62, 80, 99)' }}>ABC SCHOOL</span>
                <span style={{ color: 'rgb(128, 149, 160)' }}> - Miyapur, Hyderabad</span>
              </h1>
              <p style={{ margin: '0', fontSize: '9px', color: 'black', fontWeight: 'bold' }}>
                (A CBSE Affiliated Senior Secondary Co-Education English Medium School)
              </p>
            </div>
            <img src={schoolLogo} alt="CBSE Logo" style={{ width: '30px', height: '30px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '8px' }}>
            <p style={{ margin: '0', fontSize: '9px', color: 'black', fontWeight: 'bold' }}>Region: Hyderabad</p>
            <p style={{ margin: '0', fontSize: '9px', color: 'black', fontWeight: 'bold' }}>School Code: 32563</p>
          </div>
        </div>

        {/* Report Card Title */}
        <p style={a4LandscapeStyles.reportCardTitle}>REPORT CARD</p>

        {/* Class and Issued by */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', width: '100%', position: 'relative' }}>
          <p style={{ margin: 0, color: 'rgb(128, 149, 160)', fontSize: '9px', textAlign: 'left' }}>Class: {studentClass}</p>
          <p style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, color: 'rgb(128, 149, 160)', fontSize: '9px', textAlign: 'center', whiteSpace: 'nowrap' }}>
            (Issued by School as per directives of Central Board of Secondary Education, Delhi)
          </p>
        </div>

        {/* Student Profile and Overall Grading */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          {/* Student Profile Info */}
          <div style={{ flex: 3, border: '2px solid #325490', padding: '3px', marginRight: '5px' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 3px 0', textAlign: 'left', color: 'rgb(128, 149, 160)', fontSize: '8px' }}>Student Profile</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2px' }}>
                <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>Name</div>
                <div style={{ color: 'black', fontWeight: 'bold', fontSize: '8px' }}> : {studentDetails?.name || 'N/A'}</div>
                <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>Roll No.</div>
                <div style={{ color: 'black', fontWeight: 'bold', fontSize: '8px' }}> : {studentDetails?.id || 'N/A'}</div>
                <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>Class & Section</div>
                <div style={{ color: 'black', fontWeight: 'bold', fontSize: '8px' }}> : {studentClass}-{section}</div>
                <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>Admission No.</div>
                <div style={{ color: 'black', fontWeight: 'bold', fontSize: '8px' }}> : {studentDetails?.admission_no || 'N/A'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2px' }}>
                <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>D.O.Birth</div>
                <div style={{ color: 'black', fontWeight: 'bold', fontSize: '8px' }}> : {studentDetails?.dob || 'N/A'}</div>
                <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>CBSE REG. No.</div>
                <div style={{ color: 'black', fontWeight: 'bold', fontSize: '8px' }}> : {studentDetails?.cbse_reg_no || 'N/A'}</div>
                <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>Father's Name</div>
                <div style={{ color: 'black', fontWeight: 'bold', fontSize: '8px' }}> : {studentDetails?.father_name || 'N/A'}</div>
                <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>Contact No.</div>
                <div style={{ color: 'black', fontWeight: 'bold', fontSize: '8px' }}> : {studentDetails?.phone_no || 'N/A'}</div>
                <div style={{ textAlign: 'left', color: 'black', fontWeight: 'bold', fontSize: '8px' }}>Residential Address</div>
                <div style={{ color: 'black', fontWeight: 'bold', fontSize: '8px' }}> : {studentDetails?.address || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Photo Box */}
          <div style={{ flex: 1, marginLeft: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '50px', height: '60px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>
              {studentDetails?.photo ? <img src={`data:image/jpeg;base64,${studentDetails.photo}`} alt="Student" style={{ width: '100%', height: '100%' }} /> : 'No Photo'}
            </div>
          </div>

        <div style={{ flex: 2, border: '2px solid #325490', padding: '3px', marginLeft: '5px' }}>
  <p style={{ fontWeight: 'bold', textAlign: 'left', margin: '0 0 3px 0', padding: '3px', color: 'rgb(128, 149, 160)', fontSize: '8px' }}>Overall Grading</p>
  <div style={{ overflowX: 'auto' }}>
    <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #000', textAlign: 'center', fontSize: '8px' }}>
      <thead>
        <tr>
          <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '3px' }}></th>
          <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '3px' }}>Academical</th>
          <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '3px' }}>Behaviour</th>
          <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '3px' }}>Activities</th>
          <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '3px' }}>Attendance</th>
          <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '3px' }}>Overall Grade</th>
          <th style={{ border: '1px solid #000', backgroundColor: 'rgb(145, 167, 175)', padding: '3px' }}>Result (Pass / EIOP<sup>*</sup>)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style={{ border: '1px solid #000', padding: '3px' }}>Obtained Marks</td>
          <td style={{ border: '1px solid #000', padding: '3px' }}>{overallTotal}</td>
          <td style={{ border: '1px solid #000', padding: '3px' }}>{behaviour?.report || 'N/A'}</td>
          <td style={{ border: '1px solid #000', padding: '3px' }}>
            {activities.length > 0 ? activities.map((activity, index) => (
              <div key={index}>{activity.program_name} ({activity.winning_rank})</div>
            )) : 'N/A'}
          </td>
          <td style={{ border: '1px solid #000', padding: '3px' }}>
            {attendance ? `${attendance.present || 0}/${attendance.total || 0}` : 'N/A'}
          </td>
          <td style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', verticalAlign: 'middle' }} rowSpan="3">{overallGrade}</td>
          <td style={{ border: '1px solid #000', padding: '3px', fontWeight: 'bold', verticalAlign: 'middle' }} rowSpan="3">PASS</td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #000', padding: '3px' }}>Percentage</td>
          <td style={{ border: '1px solid #000', padding: '3px' }}>{overallPercentage}%</td>
          <td style={{ border: '1px solid #000', padding: '3px' }}></td>
          <td style={{ border: '1px solid #000', padding: '3px' }}></td>
          <td style={{ border: '1px solid #000', padding: '3px' }}></td>
        </tr>
        <tr>
          <td style={{ border: '1px solid #000', padding: '3px' }}>Grades</td>
          <td style={{ border: '1px solid #000', padding: '3px' }}>{overallGrade}</td>
          <td style={{ border: '1px solid #000', padding: '3px' }}></td>
          <td style={{ border: '1px solid #000', padding: '3px' }}></td>
          <td style={{ border: '1px solid #000', padding: '3px' }}></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

        </div>

        <hr style={{ borderTop: '1px solid #325490', margin: '5px 0' }} />

        {/* Academic Report */}
        <p style={a4LandscapeStyles.academicTitle}>Academic Report</p>

        {/* Scholastic Area and Graphical Report */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          {/* Left Column: Scholastic Area */}
          <div style={{ flex: 3, border: `1px solid ${COLOR_BORDER}`, padding: '3px' }}>
            <p style={{ fontWeight: 'bold', margin: '0 0 2px 0', borderBottom: '1px solid #000', fontSize: '8px' }}>Part: Scholastic Area</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={a4LandscapeStyles.table}>
                <thead>
                  <tr>
                    <th rowSpan="3" style={{ ...a4LandscapeStyles.th, width: '10%', fontSize: '8px' }}>Subject Details</th>
                    <th colSpan="9" style={{ ...a4LandscapeStyles.th, backgroundColor: 'rgb(145, 167, 175)', fontSize: '8px' }}>Term I</th>
                    <th colSpan="9" style={{ ...a4LandscapeStyles.th, backgroundColor: 'rgb(145, 167, 175)', fontSize: '8px' }}>Term II</th>
                    <th rowSpan="3" style={{ ...a4LandscapeStyles.th, width: '5%', fontSize: '8px' }}>Overall %</th>
                    <th rowSpan="3" style={{ ...a4LandscapeStyles.th, width: '5%', fontSize: '8px' }}>Overall Grade</th>
                  </tr>
                  <tr>
                    <th colSpan="2" style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>FA1 ({FA_MAX_MARKS} Mks, 20%)</th>
                    <th colSpan="2" style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>FA2 ({FA_MAX_MARKS} Mks, 20%)</th>
                    <th colSpan="2" style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>SA1 ({SA_MAX_MARKS} Mks, 60%)</th>
                    <th colSpan="3" style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Term I Total (100%)</th>
                    <th colSpan="2" style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>FA3 ({FA_MAX_MARKS} Mks, 20%)</th>
                    <th colSpan="2" style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>FA4 ({FA_MAX_MARKS} Mks, 20%)</th>
                    <th colSpan="2" style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>SA2 ({SA_MAX_MARKS} Mks, 60%)</th>
                    <th colSpan="3" style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Term II Total (100%)</th>
                  </tr>
                  <tr>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Mks</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Gr</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Mks</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Gr</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Mks</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Gr</th>
                    <th style={{ ...a4LandscapeStyles.th, backgroundColor: '#c5d8e2', fontSize: '8px' }}>Score (out of 100)</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>A&G</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Total</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Mks</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Gr</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Mks</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Gr</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Mks</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Gr</th>
                    <th style={{ ...a4LandscapeStyles.th, backgroundColor: '#c5d8e2', fontSize: '8px' }}>Score (out of 100)</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>A&G</th>
                    <th style={{ ...a4LandscapeStyles.th, fontSize: '8px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {uniqueSubjects.map(({ original: subject }, index) => {
                    const fa1Marks = getMarksForSubjectAndTest(subject, 'FA1');
                    const fa2Marks = getMarksForSubjectAndTest(subject, 'FA2');
                    const sa1Marks = getMarksForSubjectAndTest(subject, 'SA1');
                    const fa3Marks = getMarksForSubjectAndTest(subject, 'FA3');
                    const fa4Marks = getMarksForSubjectAndTest(subject, 'FA4');
                    const sa2Marks = getMarksForSubjectAndTest(subject, 'SA2');
                    const term1Results = calculateSubjectTermTotal(fa1Marks, fa2Marks, sa1Marks, 1);
                    const term1TotalScore = term1Results.totalScore === null ? '--' : term1Results.totalScore.toFixed(2);
                    const term1Grade = getGradeForMarks(term1Results.totalPercentage);
                    const term2Results = calculateSubjectTermTotal(fa3Marks, fa4Marks, sa2Marks, 2);
                    const term2TotalScore = term2Results.totalScore === null ? '--' : term2Results.totalScore.toFixed(2);
                    const term2Grade = getGradeForMarks(term2Results.totalPercentage);
                    let overallPercentageSubject = '--';
                    let overallGradeSubject = '--';
                    if (term1Results.totalPercentage !== null && term2Results.totalPercentage !== null) {
                      overallPercentageSubject = ((term1Results.totalPercentage + term2Results.totalPercentage) / 2).toFixed(2);
                      overallGradeSubject = getGradeForMarks(overallPercentageSubject);
                    } else if (term1Results.totalPercentage !== null) {
                      overallPercentageSubject = term1Results.totalPercentage.toFixed(2);
                      overallGradeSubject = getGradeForMarks(overallPercentageSubject);
                    } else if (term2Results.totalPercentage !== null) {
                      overallPercentageSubject = term2Results.totalPercentage.toFixed(2);
                      overallGradeSubject = getGradeForMarks(overallPercentageSubject);
                    }
                    return (
                      <tr key={index}>
                        <td style={{ ...a4LandscapeStyles.td, fontWeight: 'bold', fontSize: '8px' }}>{subject}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{fa1Marks}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{getGradeForFA(fa1Marks)}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{fa2Marks}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{getGradeForFA(fa2Marks)}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{sa1Marks}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{getGradeForSA(sa1Marks)}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', backgroundColor: '#c5d8e2', fontWeight: 'bold', fontSize: '8px' }}>{term1TotalScore}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{term1Grade}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{term1TotalScore}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{fa3Marks}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{getGradeForFA(fa3Marks)}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{fa4Marks}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{getGradeForFA(fa4Marks)}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{sa2Marks}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontSize: '8px' }}>{getGradeForSA(sa2Marks)}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', backgroundColor: '#c5d8e2', fontWeight: 'bold', fontSize: '8px' }}>{term2TotalScore}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{term2Grade}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{term2TotalScore}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{overallPercentageSubject}</td>
                        <td style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{overallGradeSubject}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td style={{ ...a4LandscapeStyles.td, fontWeight: 'bold', textAlign: 'right', fontSize: '8px' }}>Term I Total</td>
                    <td colSpan="9" style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{term1Total} / {term1TotalMax}</td>
                    <td colSpan="9" style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{term2Total} / {term1TotalMax}</td>
                    <td colSpan="2" style={{ ...a4LandscapeStyles.td, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{overallPercentage}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Grading Scale */}
            <p style={{ fontWeight: 'bold', margin: '3px 0 2px 0', fontSize: '8px' }}>Grading Scale (Scholastic Area)</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={a4LandscapeStyles.table}>
                <thead>
                  <tr>
                    {['Grade', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D', 'E*'].map((grade, index) => (
                      <th key={index} style={{ ...a4LandscapeStyles.th, backgroundColor: 'rgb(128, 149, 160)', textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{grade}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={a4LandscapeStyles.gradeScaleTd(COLOR_LIGHT_GRAY)}>Marks Range (Out of 100)</td>
                    <td style={a4LandscapeStyles.gradeScaleTd(COLOR_LIGHT_GREEN)}>91-100</td>
                    <td style={a4LandscapeStyles.gradeScaleTd(COLOR_LIGHT_GREEN)}>81-90</td>
                    <td style={a4LandscapeStyles.gradeScaleTd(COLOR_LIGHT_BLUE)}>71-80</td>
                    <td style={a4LandscapeStyles.gradeScaleTd(COLOR_LIGHT_BLUE)}>61-70</td>
                    <td style={a4LandscapeStyles.gradeScaleTd(COLOR_KHAKI)}>51-60</td>
                    <td style={a4LandscapeStyles.gradeScaleTd(COLOR_KHAKI)}>41-50</td>
                    <td style={a4LandscapeStyles.gradeScaleTd(COLOR_GOLD)}>33-40</td>
                    <td style={a4LandscapeStyles.gradeScaleTd(COLOR_RED)}>32 & below</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Graphical Report */}
          <div style={{ flex: 2, marginLeft: '5px' }}>
            <div style={{ border: '2px solid #325490', padding: '3px' }}>
              <p style={{ textAlign: 'left', color: 'rgb(128, 149, 160)', fontWeight: 'bold', fontSize: '9px' }}>Graphical Report (Average Percentage Across All Subjects)</p>
              <p style={{ fontSize: '8px', margin: '0', textAlign: 'left' }}>1. Accurate as per the Performance & Marks obtained by the Student.</p>
              <p style={{ fontSize: '8px', margin: '0', textAlign: 'left' }}>2. No Automations or AI tools are used to generate this report.</p>
              <p style={{ fontSize: '8px', margin: '0', textAlign: 'left' }}>
                3. Click on the link{' '}
                <a href="https://report.tanz.tech" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>
                  https://report.tanz.tech
                </a>{' '}
                for brief information on the academic report.
              </p>
              <div style={{ border: '1px solid #000', height: '120px', marginTop: '5px' }}>
                <div style={a4LandscapeStyles.graphContainer}>
                  <div style={a4LandscapeStyles.yAxis}>
                    <div>100</div>
                    <div>90</div>
                    <div>70</div>
                    <div>50</div>
                    <div>20</div>
                    <div>0</div>
                  </div>
                  {graphData.map((data, index) => (
                    <div key={index} style={a4LandscapeStyles.barWrapper}>
                      <div style={a4LandscapeStyles.bar(graphBarHeightScale(data.value), data.color)}></div>
                      <div style={{ fontSize: '7px', marginBottom: '1px', color: data.color, fontWeight: 'bold' }}>{data.value.toFixed(1)}%</div>
                      <div style={a4LandscapeStyles.barLabel}>{data.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: '8px', paddingTop: '3px', borderTop: '1px solid #000', margin: '0 3px' }}>
                  Subjects: **{uniqueSubjects.length}** Total: **{overallPercentage}%**
                </div>
              </div>
            </div>
            <div style={{ border: '2px solid #325490', padding: '3px', marginTop: '5px', fontSize: '8px', textAlign: 'justify' }}>
              <p style={{ margin: '0 0 3px 0', fontWeight: 'bold' }}>Analysis:(Automated)</p>
              <p style={{ margin: '0' }}>1. Basing on the study on the performance and marks obtained</p>
              <p style={{ margin: '0' }}>2. AI Generated & a helpful tip to improve performance</p>
              <p style={{ margin: '0' }}>3. Guidance is given after a strategic study basing on the marks obtained in subjects wise scale and the publications syllabus recorded with the school</p>
              <p style={{ margin: '0' }}>
                4. Click on the{' '}
                <a href="https://analysis.tanz.tech" target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>
                  https://analysis.tanz.tech
                </a>{' '}
                or visit Report page in your "parent login" on mobile app for the improvements.
              </p>
            </div>
          </div>
        </div>

        {/* Footer/Notes */}
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '8px' }}>
          <p style={{ margin: '0' }}>The marks obtained in subject wise scale and the publications syllabus will be followed.</p>
          <p style={{ margin: '0' }}>
            Click on the link **"https://students.abc.track"** or visit Report Page in your Parent'sApp mobile app for the improvements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportCardFull;