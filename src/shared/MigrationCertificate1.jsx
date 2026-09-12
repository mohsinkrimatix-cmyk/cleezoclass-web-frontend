import { useRef, useState, useEffect } from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import React from 'react';
import { useLocation } from 'react-router-dom';

const MigrationCertificate = ({ teacherId }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Checking location...');
  const [distance, setDistance] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const dateInputRef = useRef(null);
  const contentRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
  const [schools, setSchools] = useState([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [admnList, setAdmnList] = useState([]);
  const [admnNo, setAdmnNo] = useState('');

  const [school, setSchool] = useState(null);
  const [issueDate, setIssueDate] = useState('');
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynmaicschoolCode, dynamicsetSchoolCode] = useState('');
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [activeContent, setActiveContent] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
  const printRef = useRef();
  const [selectedCopies, setSelectedCopies] = useState(1);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [selectedCert, setSelectedCert] = React.useState('');
 const location = useLocation();
  const { selectedClass, student } = location.state || {};

  const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
  };

  useEffect(() => {
    if (selectedClass && student) {
      console.log("Selected Class:", selectedClass);
      console.log("Selected Student:", student);
    }
  }, [selectedClass, student]);


  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) {
        console.warn('❌ No school code found in localStorage');
        return;
      }
      console.log('✅ School Code from localStorage:', code);
      dynamicsetSchoolCode(code);
      try {
        const response = await axios.post(
          'http://192.168.0.107:3020/api/school-logo',
          { secretecode: code },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        if (response.data.logoPath) {
          console.log('✅ Logo fetched successfully:');
          setDynamicLogoSrc(response.data.logoPath);
        } else {
          console.warn('⚠️ No logo path found in response');
        }
      } catch (error) {
        console.error('🔥 Error fetching school logo:', error.response?.data || error.message);
      }
    };
    fetchSchoolLogo();
  }, [dynamicsetSchoolCode, setDynamicLogoSrc]);

  const handleGroupChartClick = () => {
    setActivePage('groupchart');
    setActiveContent(true);
  };

  const handleteachersMarketingClick = () => {
    setActivePage('Marketing');
    setActiveContent(true);
  };

  const handlestaffperformanceClick = () => {
    setActivePage('staffperform');
    setActiveContent(true);
  };

  const handlesaccedamicmanagemenClick = () => {
    setActivePage('accdemic');
    setActiveContent(true);
  };

  const openCalendar = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleBackClick = () => {
    navigate('/SelectorCertificate');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Check this out!',
      text: 'Here is something worth sharing.',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Shared successfully');
      } else {
        alert('Web Share API not supported in this browser.');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleContainerClick = (content) => {
    setActiveContent(content);
  };

  const handlePrint = () => {
    const copies = parseInt(selectedCopies) || 1;
    const printContents = printRef.current.innerHTML;
    const fullContent = Array(copies)
      .fill(`<div class="print-page">${printContents}</div>`)
      .join('<div style="page-break-after: always;"></div>');
    const win = window.open('', '', 'height=700,width=900');
    win.document.write(`
      <html>
        <head>
          <title>Certificate</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .print-page {
                width: 800px;
                margin: 40px auto;
                padding: 30px;
                box-sizing: border-box;
                page-break-inside: avoid;
              }
            }
            body {
              font-family: Georgia, serif;
              background: white;
              padding: 40px;
              text-align: center;
            }
            .print-page {
              width: 800px;
              margin: 40px auto;
              padding: 30px;
              box-sizing: border-box;

            }
          </style>
        </head>
        <body>
          ${fullContent}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleDownload = () => {
    const content = headerRef.current;
    const scale = 2;
    html2canvas(content, {
      scale: scale,
      useCORS: true,
      logging: false
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      doc.save('dashboard.pdf');
    });
  };

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  const userRole = localStorage.getItem('userRole');

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

  const formatClassName = (className) => {
    if (className.startsWith("class")) {
      const number = className.replace("class", "");
      return `CLASS ${number}`;
    }
    return className.toUpperCase();
  };

  const handleCertificateChange = (e) => {
    const selectedCert = e.target.value;
    setSelectedCert(selectedCert);
    if (selectedCert) {
      navigate(`/${selectedCert.replace(/\s+/g, '-').toLowerCase()}`);
    }
  };

  const getCurrentDate = () => {
  const today = new Date();
  return today.toLocaleDateString('en-IN'); // Format: DD/MM/YYYY
  };
  return (
    <>
      <header style={{
        backgroundColor: '#fff',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: '0',
        zIndex: '50',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        <style>
          {`
            @media (max-width: 768px) {
              .header-logo {
                height: 50px !important;
                left: 1rem !important;
              }
              .header-title {
                font-size: 1rem !important;
                padding: 0 0.5rem !important;
              }
              .header-wrapper {
                padding: 0.5rem !important;
              }
            }
            @media (max-width: 480px) {
              .header-logo {
                height: 40px !important;
                left: 0.5rem !important;
              }
              .header-title {
                font-size: 0.9rem !important;
              }
            }
          `}
        </style>
        <img
          src={dynamicLogoSrc || "/default-logo.png"}
          alt="School Logo"
          className="header-logo"
          style={{
            height: '80px',
            width: 'auto',
            borderRadius: '1px',
            position: 'absolute',
            left: '3rem',
            top: '50%',
            transform: 'translateY(-50%)',
            paddingLeft: '1rem'
          }}
        />
        <div
          className="header-wrapper"
          style={{
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0.75rem 1rem',
            display: 'flex',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <h1
            className="header-title"
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: 0,
              whiteSpace: 'nowrap',
              color: 'black'
            }}
          >
            {dynmaicschoolCode.replace(/_/g, ' ')} SCHOOL
          </h1>
        </div>
      </header>
      <div className="outer-container">
        <aside className="sidebar">
          <nav className="nav-icons">
            {['superadmin','director', 'Teacher', 'Admin'].includes(userRole) ? (
              <Link to="/SelectorCertificate" style={linkStyle}>
                <i className="fa fa-graduation-cap" title="Operations" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-graduation-cap" title="Operations (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin','director', 'Admin', 'Admission Counsellor'].includes(userRole) ? (
              <Link to="/marketing" style={linkStyle}>
                <i className="fa fa-id-card" title="Admissions" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-id-card" title="Admissions (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin','director', 'accountant'].includes(userRole) ? (
              <Link to="/main" style={linkStyle}>
                <i className="fa fa-calculator" title="Commerce" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-calculator" title="Commerce (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'director','Admin'].includes(userRole) ? (
              <Link to="/services" style={linkStyle}>
                <i className="fa fa-tasks" title="School Services" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-tasks" title="School Services (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'Admin'].includes(userRole) ? (
              <Link to="/SupportTeamCategories" style={linkStyle}>
                <i className="fa fa-users" title="Support" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-users" title="Support (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'Admin'].includes(userRole) ? (
              <Link to="/settings" style={linkStyle}>
                <i className="fa fa-cog" title="Settings" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-cog" title="Settings (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            <a
              href="https://cleezoclass.com//"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              <i className="fa fa-globe" title="Nova Web App" style={iconStyle}></i>
            </a>
          </nav>
        </aside>
        <div className="main-content">
          <div className="header">
            <div className="header-left">
              <button className="btn-back" onClick={handleBackClick}>
                <ArrowLeft size={18} />
              </button>
            </div>
            <div className="header-right">
              <button className="btn-share" onClick={handleShare}>
                <Share size={18} />
                Share
              </button>
              <button className="btn-download" onClick={handleDownload}>
                <Download size={18} />
                Download
              </button>
            </div>
          </div>
          <div style={{
            margin: '20px 5vw',
            fontFamily: 'Arial, Helvetica, sans-serif',
            background: '#f5f7fa',
            padding: '20px',
            height:'auto',
            borderRadius: '8px',alignContent:'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>

                         
<div style={{ textAlign: 'center', marginBottom: '20px' }}>
  <button
    onClick={() => setShowCopyOptions(!showCopyOptions)}
    style={{
      padding: '10px 20px',
      backgroundColor: '#5A7488',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px',
         display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
 
    marginTop: 40,
    }}
  >
    Print Certificate
  </button>

  {showCopyOptions && (
    <div style={{ marginTop: '10px' }}>
      <button onClick={() => { setSelectedCopies(1); handlePrint(); }} style={btnStyle}>1 Copy</button>
      <button onClick={() => { setSelectedCopies(2); handlePrint(); }} style={btnStyle}>2 Copies</button>
      <button onClick={() => { setSelectedCopies(3); handlePrint(); }} style={btnStyle}>3 Copies</button>

      <input
        type="number"
        placeholder="Custom"
        min={1}
        onChange={(e) => setSelectedCopies(e.target.value)}
        style={{
          width: '80px',
          marginLeft: '10px',
          padding: '5px',
          fontSize: '16px',
        }}
      />
      <button
        onClick={handlePrint}
        style={{
          ...btnStyle,
          backgroundColor:'#5A7488',
           color: 'white',
        }}
      >
        Print Custom
      </button>
    </div>
  )}
</div>
<div  ref={printRef} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      <div>
      {student ? (
        <div>
          {/* <h2>Student Details</h2>
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Class:</strong> {selectedClass}</p>

          <h3>Additional Information</h3>
          <ul>
            {Object.entries(student).map(([key, value]) => {
              // Skip rendering the name again since it's already displayed
              if (key === 'name') return null;

              // Handle nested objects, like the photo object
              if (typeof value === 'object' && value !== null) {
                return (
                  <li key={key}>
                    <strong>{key}:</strong> {JSON.stringify(value)}
                  </li>
                );
              }

              // Display the value or a placeholder if the value is null or undefined
              return (
                <li key={key}>
                  <strong>{key}:</strong> {value || 'Not provided'}
                </li>
              );
            })}
          </ul> */}
          <style>
        {`
          .certificate-container {
            border: 2px solid black;
            padding: 20px;
            margin: 50px auto;
            max-width: 800px;
            font-family: 'Times New Roman', Times, serif;
            position: relative;
            background-color: white;
          }
          .certificate-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .board-name {
            font-size: 24px;
            font-weight: bold;
          }
          .header-address {
            font-size: 18px;
            font-weight: bold;
          }
          .certificate-title {
            font-size: 22px;
            font-weight: bold;
            text-decoration: underline;
            margin-top: 40px;
            margin-bottom: 20px;
          }
          .header-logos {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .school-logo {
            width: 150px; /* Adjust size as needed */
            height: auto;
          }
          .student-photo {
            width: 120px; /* Adjust size as needed */
            height: 120px; /* Adjust size as needed */
            border: 1px solid #ccc;
          }
          .certificate-body {
            margin-top: 30px;
            line-height: 1.8;
            text-align: justify;
          }
          .student-details {
            font-weight: bold;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 60px;
          }
          .signature-section {
            text-align: right;
            font-weight: bold;
          }
          .date-section {
            font-weight: bold;
          }
          .computer-generated-note {
            margin-top: 40px;
            font-size: 12px;
            text-align: center;
            font-style: italic;
          }
          .regd-no-year {
            text-align: right;
          }
        `}
      </style>
      <div className="certificate-container">


        <div className="header-logos" style={{justifyContent:'center'}}>
          <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0px',
      }}
    >
      <div
        style={{
          width: '87px',
          height: '90px',
          objectFit: 'contain',
          marginRight: '15px',
        }}
      >
        {schoolInfo?.logo && (
          <img
            src={schoolInfo.logo}
            alt="School Logo"
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        )}
      </div>
      <div>
        <h2
          className="school-name"
          style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 4px 0',
          }}
        >
          {localStorage.getItem("schoolCode") || "School Code will appear here"} SCHOOL
        </h2>
        {schoolInfo && (
          <>
            <p
              className="subtext"
              style={{
                textAlign: 'center',
                fontSize: '16px',
                fontStyle: 'italic',
                margin: '0 0 4px 0',
              }}
            >
              (Recognized by Govt. of A.P)
            </p>
            <p
              className="address"
              style={{
                textAlign: 'center',
                fontSize: '15px',
                margin: '0 0 20px 0',
              }}
            >
              {schoolInfo.address}, Ph: <span className="number-font" style={{ fontFamily: "'Arial', 'Tahoma', 'Verdana', sans-serif", letterSpacing: '1px' }}>{schoolInfo.phone}</span>
            </p>
            <img src={'path/to/your/student/photo.jpg'} alt="Student" className="student-photo" />
          </>
        )}
      </div>
    </div>
        </div>
        


        <div className="certificate-header" style={{marginBottom:'40px'}}>
            <p className="certificate-title">MIGRATION CERTIFICATE</p>
        </div>

        <div className="regd-no-year" style={{marginBottom:'25px'}}>
            <p><strong>Admission No. :</strong><span ><strong>{student?.id}</strong></span></p>
           
        </div>

        <div className="certificate-body">
          <p style={{marginBottom:'15px'}}>
           This is to certify that Sri./Smt./Kumari <span className="student-details"><span ><strog>{student?.name}</strog></span></span> S/o/D/o. <span className="student-details"><span ><strong>{student?.father_name}</strong></span></span>, was a bonafied student of<span className="student-details"><span> {localStorage.getItem("schoolCode") || "School Code will appear here"} SCHOOL</span></span>, and studied in <span ><strong>{formatClassName(selectedClass)}</strong></span> <span className="student-details">during the academic year <span> <strong>{getCurrentYear()}</strong>.</span></span> 
          </p>
          <p style={{marginBottom:'15px'}}>
            He/She has successfully completed the prescribed course of study, fulfilled all institutional requirements, and appeared for the final examination conducted under a recognized educational board. He/She is now eligible to pursue higher education.As per the school records, there are no dues or disciplinary issues. Therefore, the institution has no objection to the student continuing further studies in any recognized University, College, or Institution.
          </p>
          
    
          
          <p>
            This certificate is issued at the student’s request for academic migration purposes.
          </p>
          {/* <p style={{ textAlign: 'center', marginTop: '30px' }}>(Passed in <span className="student-details">COMP</span> Grade/Division)</p> */}
        </div>

        <div className="footer-section">
          <div className="date-section">
            <p>Hyderabad.</p>
            <p>Date : <span>{getCurrentDate()}</span></p>
          </div>
          <div className="signature-section">
            <p>Joint Secretary(Exams)</p>
          </div>
        </div>
        
        <p className="computer-generated-note">
          This is a computer generated document and it does not require signature. This is signed with the digital signature obtained from the certifying authority under the Information Technology Act 2008.
        </p>
      </div>
        </div>
      ) : (
        <p>No student data available.</p>
      )}</div>
    </div>





          </div>
        </div>
      </div>
    </>
  );
};

export default MigrationCertificate;

const btnStyle = {
  margin: '5px',
  padding: '8px 12px',
  fontSize: '15px',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '2px solid #000',
  backgroundColor: '#ffffffff',
 
};

const certificateOptions = [
  'Transfer Certificate',
  'Course Completion',
  'Bonafide Certificate',
  'No Due Certificate',
  'Achievement Certificate',
];

const containerStyle = {
  fontFamily: 'Georgia, serif',
  padding: '20px',
  maxWidth: '500px',
  margin: 'auto',
  backgroundColor: '#f9f9f9',
  border: '1px solid #ccc',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
};

const selectStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '16px',
  marginBottom: '20px',
  border: '1px solid #aaa',
  borderRadius: '4px',
};

const certDisplayStyle = {
  marginTop: '20px',
  padding: '15px',
  backgroundColor: '#eef',
  borderLeft: '4px solid #2A5AA8',
  fontStyle: 'italic',
  color: '#333',
};
