import React from 'react';
import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { useLocation } from 'react-router-dom';

// The code for TransferCertificate is imported here as requested.
const TransferCertificate = ({
  tcSerial,
  admissionNo,
  studentName,
  motherName,
  fatherName,
  admissionDate,
  previousSchool,
  leavingDate,
  character,
  nationality,
  religion,
  lastClass,
  stream,
  academicYearFrom,
  academicYearTo,
  dateOfBirth,
  dateOfBirthWords,
  promotionStatus,
  issueDate,
  schoolLogo,
  schoolName,
  schoolAffiliation,
  schoolCode,
}) => {
  const containerStyle = {
    width: '800px',
    margin: '30px auto',
    padding: '40px',
    border: '2px solid black',
    fontFamily: 'Arial, sans-serif',
    fontSize: '15px',
    lineHeight: '1.6',
    backgroundColor: '#fff',
  };

  const headingStyle = {
    textAlign: 'center',
    fontWeight: 'bold',
  };

  const subHeadingStyle = {
    textAlign: 'center',
    fontStyle: 'italic',
  };

  const sectionStyle = {
    marginTop: '20px',
  };

  const labelBold = {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  };

  const line = {
    display: 'inline-block',
    borderBottom: '1px solid #000',
    minWidth: '120px',
    padding: '0 5px',
    marginLeft: '5px',
    marginRight: '5px',
  };

  const flexBetween = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  };

  const signatureStyle = {
    textAlign: 'right',
    marginTop: '60px',
    marginRight: '20px',
  };

  const sampleStamp = {
    position: 'absolute',
    top: '40%',
    left: '30%',
    fontSize: '60px',
    color: 'rgba(150,150,150,0.3)',
    transform: 'rotate(-30deg)',
    fontWeight: 'bold',
    pointerEvents: 'none',
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={sampleStamp}>SAMPLE</div>
      <div style={containerStyle}>
        <div style={headingStyle}>
          <img
            src={schoolLogo}
            alt="school logo"
            style={{ height: '80px', float: 'left' }}
          />
          <div style={{ fontSize: '22px' }}>{schoolName}</div>
          <div style={subHeadingStyle}>{schoolAffiliation}</div>
          <div style={{ fontWeight: 'bold' }}>SCHOOL CODE {schoolCode}</div>
          <div style={{ ...headingStyle, fontSize: '18px', marginTop: '10px' }}>
            TRANSFER CERTIFICATE
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={flexBetween}>
            <div>TC Serial : <span style={line}>{tcSerial}</span></div>
            <div>Admission No/Registration No: <span style={line}>{admissionNo}</span></div>
          </div>

          <p>This is to certify that <span style={line}>{studentName}</span> S/o</p>

          <p>
            Mother's Name <span style={line}>{motherName}</span>   
            Father's Name <span style={line}>{fatherName}</span>
          </p>

          <p>
            was admitted into school on the (date) <span style={line}>{admissionDate}</span> on a transfer from
            <span style={line}>{previousSchool || '_____'}</span> and left on <span style={line}>{leavingDate}</span> with a
            <span style={line}>{character}</span> character. His nationality is
            <span style={line}>{nationality}</span> and religion is <span style={line}>{religion}</span>
          </p>

          <p>
            He was then studying in the (@) <span style={line}>{lastClass}</span> class of the (+)
            <span style={line}>{stream}</span> stream, the school year being from (*)
            <span style={line}>{academicYearFrom}</span> to (*) <span style={line}>{academicYearTo}</span>
          </p>

          <p>
            All sums due (#) to this school on her account have been remitted or satisfactorily arranged for
          </p>

          <p>
            His Date of Birth, according to the Scholar Register is (in figure)
            <span style={line}>{dateOfBirth}</span>
          </p>

          <p>
            (in words) <span style={line}>{dateOfBirthWords}</span>
          </p>

          <p>
            Promotion has been ($) <span style={line}>{promotionStatus}</span>
          </p>

          <p>Date: <span style={line}>{issueDate}</span></p>

          <div style={signatureStyle}>
            <p>Signature</p>
            <p style={{ fontWeight: 'bold' }}>PRINCIPAL</p>
          </div>
        </div>

        <div style={{ fontSize: '12px', marginTop: '30px' }}>
          <p>@ to be given in words</p>
          <p>* insert month and year</p>
          <p>
            # sums due to the school include payments for which provision is made in the rules supplied to the parent/guardian when the scholar was admitted into the school.
          </p>
          <p>$ granted / refused / not applicable.</p>
        </div>
      </div>
    </div>
  );
};

TransferCertificate.propTypes = {
  tcSerial: PropTypes.string,
  admissionNo: PropTypes.string,
  studentName: PropTypes.string.isRequired,
  motherName: PropTypes.string.isRequired,
  fatherName: PropTypes.string.isRequired,
  admissionDate: PropTypes.string.isRequired,
  previousSchool: PropTypes.string,
  leavingDate: PropTypes.string.isRequired,
  character: PropTypes.string.isRequired,
  nationality: PropTypes.string.isRequired,
  religion: PropTypes.string.isRequired,
  lastClass: PropTypes.string.isRequired,
  stream: PropTypes.string.isRequired,
  academicYearFrom: PropTypes.string.isRequired,
  academicYearTo: PropTypes.string.isRequired,
  dateOfBirth: PropTypes.string.isRequired,
  dateOfBirthWords: PropTypes.string.isRequired,
  promotionStatus: PropTypes.string.isRequired,
  issueDate: PropTypes.string.isRequired,
  schoolLogo: PropTypes.string,
  schoolName: PropTypes.string.isRequired,
  schoolAffiliation: PropTypes.string.isRequired,
  schoolCode: PropTypes.string.isRequired,
};

TransferCertificate.defaultProps = {
  tcSerial: '',
  admissionNo: '',
  previousSchool: '',
  schoolLogo: 'https://i.imgur.com/DOP1Bkk.png',
};


const Transfercertificate = ({ teacherId }) => {
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
<div ref={printRef} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {student ? (
        <TransferCertificate
          schoolLogo={dynamicLogoSrc}
          schoolName={dynmaicschoolCode ? `${dynmaicschoolCode.replace(/_/g, ' ')} SCHOOL` : 'School Name'}
          schoolAffiliation={schoolInfo?.affiliation || 'Affiliated to State Board'}
          schoolCode={dynmaicschoolCode || 'N/A'}
          tcSerial={student?.tcSerial || 'N/A'}
          admissionNo={student?.admissionNo || 'N/A'}
          studentName={student?.name || 'Student Name'}
          motherName={student?.motherName || 'Mother Name'}
          fatherName={student?.fatherName || 'Father Name'}
          admissionDate={student?.admissionDate || 'DD/MM/YYYY'}
          previousSchool={student?.previousSchool || 'Previous School'}
          leavingDate={new Date().toLocaleDateString('en-GB')}
          character={student?.character || 'Good'}
          nationality={student?.nationality || 'Indian'}
          religion={student?.religion || 'Not Specified'}
          lastClass={selectedClass || 'N/A'}
          stream={student?.stream || 'N/A'}
          academicYearFrom={student?.academicYearFrom || 'YYYY'}
          academicYearTo={student?.academicYearTo || 'YYYY'}
          dateOfBirth={student?.dateOfBirth || 'DD/MM/YYYY'}
          dateOfBirthWords={student?.dateOfBirthWords || 'Date of Birth in Words'}
          promotionStatus={student?.promotionStatus || 'Granted'}
          issueDate={new Date().toLocaleDateString('en-GB')}
        />
      ) : (
        <p>No student data available. Please go back and select a student to generate the certificate.</p>
      )}
    </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Transfercertificate;

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