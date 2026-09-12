import { CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState, useRef, useContext, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const containerStyle = {
  maxWidth: '900px',
  margin: '40px auto',
  padding: '20px',
  background: '#f8f9fa',
  borderRadius: '10px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thTdStyle = {
  padding: '10px',
  textAlign: 'center',
  borderBottom: '1px solid #ddd',
};

const headerStyle = {
  ...thTdStyle,
  backgroundColor: '#343a40',
  color: '#fff',
};

const TeacherSalaryTable = () => {
  const [salaryData, setSalaryData] = useState([]);
  const schoolCode = localStorage.getItem('schoolCode');
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const dateInputRef = useRef(null);
  const contentRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [task, setTask] = useState("");
  const [sending, setSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
  const dashboardRef = useRef(null);
  const [employeeId, setEmployeeId] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState('');
  const [presentDays, setPresentDays] = useState(0);
  const [halfDays, setHalfDays] = useState(0);
  const [baseSalary, setBaseSalary] = useState('');
  const [totalSalary, setTotalSalary] = useState(null);
  const [salaryDate, setSalaryDate] = useState("");
  const [activeContent, setActiveContent] = useState(null);

  const handleBackClick = () => {
    navigate('/RecruitmentDashboard');
  };

  useEffect(() => {
    axios
      .get('https://cleezoclass.com:4000/api/getSalary', {
        params: { schoolCode },
      })
      .then((response) => {
        const uniqueSalaries = [];
        const seenTeacherIds = new Set();
        for (const record of response.data) {
          if (!seenTeacherIds.has(record.teacher_id)) {
            seenTeacherIds.add(record.teacher_id);
            uniqueSalaries.push(record);
          }
        }
        setSalaryData(uniqueSalaries);
      })
      .catch((error) => {
        console.error('Error fetching salary:', error);
      });
  }, [schoolCode]);

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

  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');

  useEffect(() => {
    const fetchSchoolLogo = async () => {
      const code = localStorage.getItem('schoolCode');
      if (!code) {
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

  const generatePDFBlob = async () => {
    const element = dashboardRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };

  const handleDownload = async () => {
    const input = dashboardRef.current;
    if (!input) return;
    const originalStyle = {
      height: input.style.height,
      overflow: input.style.overflow,
    };
    const fullHeight = input.scrollHeight;
    input.style.height = fullHeight + 'px';
    input.style.overflow = 'visible';
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        width: input.scrollWidth,
        height: input.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pageHeight = 297;
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('WarmLeads.pdf');
    } catch (error) {
      console.error('Error generating full PDF:', error);
    } finally {
      input.style.height = originalStyle.height;
      input.style.overflow = originalStyle.overflow;
    }
  };

  const handleContainerClick = (content) => {
    setActiveContent(content);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleShare = async () => {
    const blob = await generatePDFBlob();
    const file = new File([blob], 'Warmleads.pdf', { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Management Report',
          text: 'Please find the Management report attached.',
          files: [file],
        });
      } catch (err) {
        alert('Sharing was cancelled or failed: ' + err.message);
      }
    } else {
      alert('This device or browser does not support file sharing. Please download and share manually.');
    }
  };

  const leftContainer = {
    display: 'flex',
    alignItems: 'center',
  };

  const rightContainer = {
    display: 'flex',
    alignItems: 'center',
  };

  const logoStyle = {
    width: '100px',
    height: '100px',
    objectFit: 'contain',
    cursor: 'pointer',
    padding: 0,
    marginBottom: 0
  };

  const userIconStyle = {
    fontSize: '24px',
    cursor: 'pointer',
    color: '#333',
  };

  const handleLogoClick = () => {
    navigate(`/RecruitmentDashboard`);
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
       
<Link to="/RecruitmentDashboard">
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
</Link>
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
            }}>
            {dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL
          </h1>
        </div>
      </header>

      <div className="outer-container" style={{ backgroundColor: "#f0f2f5" }}>
        <aside className="sidebar">
          <nav className="nav-icons">
            {['superadmin', 'director', 'management', 'teacher', 'Admin'].includes(userRole) ? (
              <Link to="/homepage3" style={linkStyle}>
                <i className="fa fa-graduation-cap" title="Operations" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-graduation-cap" title="Operations (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'director', 'Admin', 'management', 'Admission Counsellor'].includes(userRole) ? (
              <Link to="/marketing" style={linkStyle}>
                <i className="fa fa-id-card" title="Admissions" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-id-card" title="Admissions (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'director', 'management', 'accountant'].includes(userRole) ? (
              <Link to="/AccountantDashboard" style={linkStyle}>
                <i className="fa fa-calculator" title="Commerce" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-calculator" title="Commerce (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            {['superadmin', 'Admin', 'hr'].includes(userRole) ? (
              <Link to="/RecruitmentDashboard" style={linkStyle}>
                <i className="fa fa-user-plus" title="HR/Recruitment" style={iconStyle}></i>
              </Link>
            ) : (
              <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
                <i className="fa fa-user-plus" title="HR/Recruitment (Access Restricted)" style={iconStyle}></i>
              </span>
            )}
            <Link to="/services" style={linkStyle}>
              <i className="fa fa-tasks" title="School Services" style={iconStyle}></i>
            </Link>
            <Link to="/SupportTeamCategories" style={linkStyle}>
              <i className="fa fa-users" title="Support" style={iconStyle}></i>
            </Link>
            <Link to="/settings" style={linkStyle}>
              <i className="fa fa-cog" title="Settings" style={iconStyle}></i>
            </Link>
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

          <div ref={dashboardRef} style={{ marginTop: "50px" }}>
            <div style={{
              marginTop: "40px",
              width: "80%",
              margin: '0 auto',
              padding: '30px',
              marginTop: "20px",
              backgroundColor: '#f9f9f9',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontFamily: 'Arial, sans-serif',
            }}>


<style>
    {`
        @media (max-width: 768px) {
            /* 1. Main container setup (Unchanged) */
            .main-content div[style*="width: 80%"] {
                width: 100% !important;
                padding: 15px !important;
                margin: 0 !important;
                box-sizing: border-box !important;
            }

            /* 2. Stack the Paid/Unpaid sections (Unchanged) */
            div[style*="flexWrap: wrap"][style*="justify-content: center"] {
                flex-direction: column !important;
                gap: 30px !important; 
            }
            
            /* 3. Make the table's WRAPPER div scrollable horizontally */
            div[style*="minWidth: 300px"] {
                overflow-x: auto !important; 
                width: 100% !important;
            }

            /* 4. Force the table to use a fixed layout algorithm */
            div[style*="minWidth: 300px"] table {
                table-layout: fixed !important;
                min-width: 600px !important; /* Set an explicit minimum table width */
            }

            /* 5. THE KEY FIX: Force every column to a fixed width and prevent any text wrapping */
            div[style*="minWidth: 300px"] table th,
            div[style*="minWidth: 300px"] table td {
                white-space: nowrap !important;
                /* This forces every column to be at least 150px wide */
                width: 150px !important; 
            }

            /* 6. Adjust text sizes (Unchanged) */
            .main-content h1 {
                font-size: 1.4rem !important;
            }
            .main-content h2 {
                font-size: 1.2rem !important;
            }
        }
    `}
</style>


              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                 <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Teacher Salary Details</h1>
                    <table style={tableStyle}></table>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                  <div style={{ flex: 1, minWidth: '300px', maxWidth: '450px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Paid Salaries</h2>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={headerStyle}>Teacher Name</th>
                          <th style={headerStyle}>Salary Amount</th>
                          <th style={headerStyle}>Payment Date</th>
                          <th style={headerStyle}>Salary Type</th>
                          <th style={headerStyle}>Effective From</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryData.filter(record => record.status === 'paid').map((record) => (
                          <tr key={record.salary_id}>
                            <td style={thTdStyle}>{record.teacher_name}</td>
                            <td style={thTdStyle}>{record.salary_amount}</td>
                            <td style={thTdStyle}>
                              {new Date(record.payment_date).toLocaleDateString()}
                            </td>
                            <td style={thTdStyle}>{record.salary_type}</td>
                            <td style={thTdStyle}>
                              {new Date(record.effective_from).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ flex: 1, minWidth: '300px', maxWidth: '450px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Unpaid Salaries</h2>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={headerStyle}>Teacher Name</th>
                          <th style={headerStyle}>Salary Amount</th>
                          <th style={headerStyle}>Payment Date</th>
                          <th style={headerStyle}>Salary Type</th>
                          <th style={headerStyle}>Effective From</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryData.filter(record => record.status === 'pending').map((record) => (
                          <tr key={record.salary_id}>
                            <td style={thTdStyle}>{record.teacher_name}</td>
                            <td style={thTdStyle}>{record.salary_amount}</td>
                            <td style={thTdStyle}>
                              {new Date(record.payment_date).toLocaleDateString()}
                            </td>
                            <td style={thTdStyle}>{record.salary_type}</td>
                            <td style={thTdStyle}>
                              {new Date(record.effective_from).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherSalaryTable;