import { useRef, useState, useEffect } from 'react';
import './Homepage3.css';
import { Download, ArrowLeft } from 'lucide-react';
import { FiArrowLeft } from 'react-icons/fi';
import { Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import axios from 'axios';


const Marketing = () => {
  const dateInputRef = useRef(null);
  const contentRef = useRef(null);
  const headerRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const dashboardRef = useRef(null);
  const navigate = useNavigate();

  // Example cutoff time
  const cutoffHour = 9; // 9 AM — dynamically use this from DB if needed
  const data = [
    { name: 'Until Cutoff', value: cutoffHour },
    { name: 'After Cutoff', value: 24 - cutoffHour }
  ];
  const salaryData = [
    { name: "Administrative Salaries", value: 5000 },
    { name: "Teacher Salaries", value: 6000 },
    { name: "Support Staff Salaries", value: 5500 }
  ];
  const performanceData = [
    { name: "Punctuality", value: 85 },
    { name: "Task Completion", value: 90 },
    { name: "Student Engagement", value: 80 },
    { name: "Classroom Management", value: 88 }
  ];
  const recruitersData = [
    { month: "Jan", candidates: 10 },
    { month: "Feb", candidates: 20 },
    { month: "Mar", candidates: 15 },
    { month: "Apr", candidates: 25 },
    { month: "May", candidates: 18 }
  ];
  const payrollData = [
    { name: "Entry", value: 30 },
    { name: "Mid", value: 40 },
    { name: "Senior", value: 20 }
  ];
  const COLORS = [
    'rgba(106,184,164,255)',  // Admission Form
    'rgba(179,192,198,255)', // Entrance Test
    'rgba(143,172,183,255)', // Follow-up
    'rgba(14,150,135,255)',  // Counseling
    'rgba(16,125,104,255)'   // Default fallback
  ];

  const teacherData = [
    { name: 'Male', value: 20 },
    { name: 'Female', value: 30 },
  ];

  // Share functionality
  const handleShare = async () => {
    const blob = await generatePDFBlob();
    const file = new File([blob], 'Marketing.pdf', { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Management Report',
          text: 'Please find the Management report attached.',
          files: [file],
        });
        console.log('PDF shared successfully!');
      } catch (err) {
        alert('Sharing was cancelled or failed: ' + err.message);
      }
    } else {
      alert('This device or browser does not support file sharing. Please download and share manually.');
    }
  };

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

  const openCalendar = () => {
    dateInputRef.current?.showPicker();
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
      pdf.save('full-dashboard.pdf');
    } catch (error) {
      console.error('Error generating full PDF:', error);
    } finally {
      input.style.height = originalStyle.height;
      input.style.overflow = originalStyle.overflow;
    }
  };

  const userRole = localStorage.getItem('userRole');

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleBackClick = () => {
    navigate('/');
  };

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

  const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();



  useEffect(() => {
    const fetchSchoolLogo = async () => {
      console.log('🚀 Starting logo fetch process...');
      const code = localStorage.getItem('schoolCode');
      console.log('🧾 localStorage.getItem("schoolCode") =', code, '| Type:', typeof code);
      if (!code) {
        console.warn('❌ No school code found in localStorage. Aborting fetch.');
        return;
      }
      setDynamicSchoolCode(code);
      console.log('📦 Set dynamic school code in state:', code);
      try {
        console.log('📡 Sending POST request to backend with secretecode...');
        const response = await axios.post(
          'https://cleezoclass.com:4000/api/schoollogodynamic',
          { secretecode: code },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('📬 Response from backend:', response);
        console.log('📬 Response.data:', response.data);
        if (response.data.logoPath) {
          console.log('✅ Logo fetched successfully from backend.');
          setDynamicLogoSrc(response.data.logoPath);
        } else {
          console.warn('⚠️ No logo path found in backend response.');
        }
      } catch (error) {
        console.error('🔥 Error fetching school logo:', error.response?.data || error.message);
      }
    };
    fetchSchoolLogo();
  }, []);

  return (
    <>
       <header style={{
  backgroundColor: '#fff',
  color: 'white',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  position: 'fixed',
  width: '100%',
  top: '0',
  zIndex: '50',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
}}>
        {/* Responsive styles via style tag */}
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
        {/* Logo */}
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
        {/* Flex Wrapper */}
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
            {dynamicSchoolCode.replace(/_/g, ' ')} SCHOOL
          </h1>
        </div>
      </header>
      <div className="outer-container" style={{ paddingTop: '70px' }}>
        
        <main className="main-content">
          <section className="dashboard-body">
            {/* <div
              className="top-bar-actions"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <button className="btn-back" onClick={handleBackClick}>
                <ArrowLeft size={18} />
              </button>
              <div className="button-group" style={{ display: 'flex', gap: '10px' }}>
                <button className="share-button" onClick={handleShare}>
                  <Share2 size={18} />
                  Share
                </button>
                <button className="download-button" onClick={handleDownload}>
                  <Download size={18} />
                  Download
                </button>
              </div>
            </div> */}
            <div ref={dashboardRef} className="print-area" style={printAreaStyle}>
              <div className="dashboard-header">
                <div className="section-divider"></div>
                <div className="dashboard-header-content">
                  <h1
                    className="dashboard-title"
                    style={{
                      fontFamily: 'sans-serif',
                      fontSize: '28px',
                      fontWeight: '600',
                    }}
                  >
                    HR Dashboard
                  </h1>
                </div>
              </div>
              <div
                className="white-box"
                ref={contentRef}
                style={{
                  padding: '20px',
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflowX: 'hidden',
                  overflowY: 'hidden'
                }}
              >
                {/* Responsive Grid Container for Charts */}
                <div className="charts-grid">
                  {/* Salary Distribution */}
                  <div className="chart-box-grid">
                    <Link to="/salary" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Salary Distribution</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={salaryData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={80}
                            fill="rgba(15,150,128,255)"
                            label
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Link>
                  </div>
                  {/* Recruiters */}
                  <div className="chart-box-grid">
                    <Link to="/recruiters" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Recruiters</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={recruitersData} margin={{ left: -20 }}>

                          <CartesianGrid strokeDasharray="5 5" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="candidates" fill="rgba(15,150,128,255)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Link>
                  </div>
                  {/* Payroll Summary */}
                  <div className="chart-box-grid">
                    <Link to="/payroll" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Payroll Summary</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={payrollData} layout="vertical" margin={{ top: 10, right: 20, left: -9, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="5 5" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#0F9680">
                            {payrollData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Link>
                  </div>
                  {/* Salary Board */}
                  <div className="chart-box-grid">
                    <Link to="/TeacherSalaryTable" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Salary Board</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            dataKey="value"
                            data={[
                              { name: 'Paid', value: 60 },
                              { name: 'Pending', value: 40 }
                            ]}
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#0F9680"
                            label
                          >
                            <Cell fill="#0F9680" />
                            <Cell fill="#FFB347" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Link>
                  </div>
                  {/* Attendance Setting */}
                  <div className="chart-box-grid attendance-chart-box">
                    <Link to="/TeacherAttendanceForms" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '8px', color: '#333' }}>Attendance Setting</h3>
                      <p style={{ textAlign: 'center', marginTop: 0, color: '#555' }}>
                        Alert will be sent after <strong>{cutoffHour}:00</strong>
                      </p>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={data}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                          >
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Link>
                  </div>
                  {/* Teacher Editing */}
                  <div className="chart-box-grid">
                    <Link to="/TeacherManagement" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Teacher Editing</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={teacherData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#0F9680"
                            label
                          >
                            {teacherData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Link>
                  </div>
                  {/* Student Editing */}
                  <div className="chart-box-grid">
                    <Link to="/StudentManagement" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Student Editing</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={payrollData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#0F9680"
                            label
                          >
                            {payrollData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Link>
                  </div>
                   <div className="chart-box-grid">
                    <Link to="/Events" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Notifications</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={salaryData}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={80}
                            fill="rgba(15,150,128,255)"
                            label
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Link>
                  </div>
                  {/* Radius Selection */}
                  <div className="chart-box-grid">
                    <Link to="/Radiusselecting" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center' }}>Radius Selection</h3>
                      <div style={{
                        width: '100%',
                        height: 'calc(90% - 50px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        marginTop: '15px'
                      }}>
                        <svg width="120%" height="120%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                          <circle cx="50" cy="50" r="40" fill="rgba(15, 150, 128, 0.3)" />
                          <circle cx="50" cy="50" r="30" fill="rgba(15, 150, 128, 255)" />
                          <circle cx="50" cy="50" r="5" fill="#fff" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(15, 150, 128, 255)" strokeDasharray="5,5" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                  {/* Payslip */}
                  <div className="chart-box-grid">
                    <Link to="/payroll" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ textAlign: 'center', marginBottom: '8px', color: '#333' }}>Payslip</h3>
                   
                      <ResponsiveContainer width="100%" height={200} >
                        <PieChart>
                          <Pie
                            data={data}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                          >
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
<style jsx>{`
        /* --- NEW: Force Parent Container to Expand & Fix Border --- */
        .outer-container, .main-content {
          height: unset !important; /* Unset any fixed height from other stylesheets */
          min-height: 100vh;      /* Ensure page is full height for short content */
          overflow: visible !important; /* Prevent parent from clipping the content */
        }
        .white-box {
          overflow: visible !important; /* Override inline style that was hiding content */
        }
        
        /* --- Layout & Spacing Fixes --- */
        .section-divider {
          display: none;
        }
        .dashboard-body {
          flex-grow: 1;
        }
        .chart-box-grid > a {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .recharts-responsive-container {
          flex-grow: 1;
        }

        /* --- Basic Layout Structure --- */
        .sidebar, .top-bar-actions {
          display: none !important;
        }
        .main-content {
          padding-left: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        
        /* --- Chart Grid Styles (Unchanged from first fix) --- */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          width: 100%;
          padding: 10px 0;
        }
        .chart-box-grid {
          padding: 16px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background-color: #f9f9f9;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          text-align: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          height: 300px;
          display: flex;
          flex-direction: column;
        }
        .chart-box-grid:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          }
          .chart-box-grid {
            height: 280px;
          }
        }

        @media (max-width: 480px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          .chart-box-grid {
            height: 260px;
          }
             .attendance-chart-box {  /* ADD THIS RULE HERE */
    height: 300px;
  }
        }

        @media (min-width: 1024px) {
          .charts-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .chart-box-grid {
            height: 320px;
          }
        }

        @media (min-width: 1400px) {
          .charts-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </>
  );
};

export default Marketing;

export const printAreaStyle = {
  visibility: 'visible',
  display: 'block',
  height: 'auto',
  overflow: 'visible',
};

