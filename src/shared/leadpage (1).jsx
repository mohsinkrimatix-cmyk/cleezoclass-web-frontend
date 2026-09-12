import { CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState,useRef,useContext ,useEffect} from 'react';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';import { Link } from 'react-router-dom';


import axios from 'axios';

const Leadpages = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const dashboardRef = useRef(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
 const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');

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

  // State to store the dynamically loaded page content
  const [activeContent, setActiveContent] = useState(null);
  const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [task, setTask] = useState("");
  
    // useEffect(() => {
    //   const fetchData = async () => {
    //     // const data = await fetchScoreFromAPI();
    //     setStudents(data);
    //   };
    //   fetchData();
    // }, []);
const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();




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
const classifyStudents = (students) => {
  if (Array.isArray(students)) {
    // Convert each student's raw score out of 190 to a percentage out of 100
    const studentsWithPercentage = students.map(student => ({
      ...student,
      percentage: (student.score / 190) * 100
    }));

    const hot = studentsWithPercentage.filter(student => student.percentage >= 80);
    const warm = studentsWithPercentage.filter(student => student.percentage >= 50 && student.percentage < 80);
    const cold = studentsWithPercentage.filter(student => student.percentage < 50);

    return { hot, warm, cold };
  } else {
    console.error("Expected students to be an array but got:", students);
    return { hot: [], warm: [], cold: [] };
  }
};

  
    const { hot, warm, cold } = classifyStudents(students);
  
    const handleAssign = () => {
      if (selectedStudent) {
        console.log(`Assigned "${task}" to ${selectedStudent.student_name}`);
        alert(`✅ Task assigned to ${selectedStudent.student_name}: ${task}`);
        setTask("");
        setSelectedStudent(null);
      }
    };
  
const handleDownload = async () => {
  const input = dashboardRef.current;
  if (!input) return;

  // Step 1: Expand the element to full height temporarily
  const originalStyle = {
    height: input.style.height,
    overflow: input.style.overflow,
  };

  const fullHeight = input.scrollHeight;

  input.style.height = fullHeight + 'px';
  input.style.overflow = 'visible';

  // Allow time for rendering the expanded content
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    // Step 2: Take full screenshot
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
      width: input.scrollWidth,
      height: input.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = 210; // A4
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

    pdf.save('Leads dashboard.pdf');
  } catch (error) {
    console.error('Error generating full PDF:', error);
  } finally {
    // Step 3: Restore original styles
    input.style.height = originalStyle.height;
    input.style.overflow = originalStyle.overflow;
  }
};
    // Styles
    const styles = {
      page: {
        background: "linear-gradient(120deg, #fdfbfb, #ebedee)",
        minHeight: "100vh",
        padding: "30px",
        fontFamily: "Segoe UI, sans-serif",
      },
      section: {
        borderRadius: "16px",
        padding: "25px",
        marginBottom: "30px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.07)",
      },
      title: {
        fontSize: "24px",
        fontWeight: "700",
        textAlign: "center",
        marginBottom: "20px",
        color: "#333",
      },
      leadBox: (bg, color = "#fff") => ({
        ...styles.section,
        backgroundColor: bg,
        color: color,
        flex: 1,
      }),
      studentCard: {
        backgroundColor: "#f0f0f0",
        borderRadius: "12px",
        padding: "16px",
        margin: "8px",
        boxShadow: "0 4px 8px rgba(0,0,0,0.06)",
        fontWeight: "500",
        fontSize: "14px",
        minWidth: "220px",
        maxWidth: "220px",
        color: "#000",
        cursor: "pointer",
        textAlign: "left",
        transition: "transform 0.2s",
      },
      studentRow: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-start",
      },
      leadGroup: {
        display: "flex",
        flexDirection: "row",
        gap: "20px",
        flexWrap: "wrap",
      },
      modal: {
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        width: "100%",
        height: "100%",
        zIndex: 999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      },
      modalContent: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "12px",
        minWidth: "300px",
        textAlign: "center",
      },
      button: {
        padding: "10px 20px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      },
      input: {
        padding: "10px",
        margin: "10px 0",
        width: "100%",
      },
    };
  
  const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
  };
  

  // Share PDF if supported
  const handleShare = async () => {
    const blob = await generatePDFBlob();
    const file = new File([blob], 'Leadspage.pdf', { type: 'application/pdf' });

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
 
  const handleGroupChartClick = () => {
    setActivePage('groupchart');
    setActiveContent(true);
  };
  const handleteacherstimetableClick = () => {
    setActivePage('timetable');
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


  const containerStyle = {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "30px 20px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "16px",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    boxSizing: "border-box",
  };

  const titleSectionStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
  };

  const titleStyle = {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    margin: 0,
  };

  const descriptionStyle = {
    fontSize: "18px",
    color: "#4b5563",
    marginBottom: "30px",
    lineHeight: "1.6",
    maxWidth: "800px",
  };

  const featuresTitleStyle = {
    fontSize: "24px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "20px",
  };

  const featuresGridStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
    width: "100%",
    maxWidth: "900px",
  };

  const featureButtonStyle = (isHovered) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 20px",
    background: isHovered ? "rgba(15,150,128,255)" : "rgba(81,170,156,255)",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "17px",
    fontWeight: "500",
    cursor: "pointer",
    minWidth: "260px",
    justifyContent: "center",
    transition: "all 0.3s ease",
   boxShadow: isHovered
  ? "0 12px 24px rgba(81,170,156,0.5)" // Thicker shadow when hovered
  : "0 6px 18px rgba(81,170,156,0.3)" // Thicker shadow when not hovered
,
    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
  });

  const checkIconStyle = {
    color: "#ffffff",
  };
  const handleBackClick = () => {
    navigate('/marketing'); // Navigate to the "accdemic" route
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
  borderBottom: '12px solid black' // Add this line
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
      
      /* --- ADD THIS NEW CODE BELOW --- */
      .leads-container {
        flex-direction: column !important; /* Stacks the cards vertically */
        gap: 25px !important;             /* Adjusts space between cards */
      }
      .lead-card {
        height: 200px !important;         /* Reduces card height for mobile */
        width: 90% !important;            /* Narrows the card width */
      }
      /* --- END OF NEW CODE --- */
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
        <aside className="sidebar">
<nav className="nav-icons">
  {/* Operations */}
  {['superadmin','director', 'Teacher', 'Admin'].includes(userRole) ? (
    <Link to="/homepage3" style={linkStyle}>
      <i className="fa fa-graduation-cap" title="Operations" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-graduation-cap" title="Operations (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* Admissions */}
  {['superadmin','director', 'Admin', 'Admission Counsellor'].includes(userRole) ? (
    <Link to="/marketing" style={linkStyle}>
      <i className="fa fa-id-card" title="Admissions" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-id-card" title="Admissions (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* Commerce */}
  {['superadmin','director', 'accountant'].includes(userRole) ? (
    <Link to="/main" style={linkStyle}>
      <i className="fa fa-calculator" title="Commerce" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-calculator" title="Commerce (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* Services */}
  {['superadmin', 'director','Admin'].includes(userRole) ? (
    <Link to="/services" style={linkStyle}>
      <i className="fa fa-tasks" title="School Services" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-tasks" title="School Services (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* Support */}
  {['superadmin', 'Admin'].includes(userRole) ? (
    <Link to="/SupportTeamCategories" style={linkStyle}>
      <i className="fa fa-users" title="Support" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-users" title="Support (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* Settings */}
  {['superadmin','director', 'Admin'].includes(userRole) ? (
    <Link to="/settings" style={linkStyle}>
      <i className="fa fa-cog" title="Settings" style={iconStyle}></i>
    </Link>
  ) : (
    <span style={{ ...linkStyle, pointerEvents: 'none', opacity: 0.5 }}>
      <i className="fa fa-cog" title="Settings (Access Restricted)" style={iconStyle}></i>
    </span>
  )}

  {/* Nova Web App - Always enabled */}
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
  

<div style={{ 
  minHeight: '60vh', 
  display: 'flex', 
  flexDirection: 'column', 
  justifyContent: 'center', 
  alignItems: 'center', 
  backgroundColor: '#f9faf9', 
  padding: '40px'
}} ref={dashboardRef}>
  <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px' }}>
    💎 LEADS 💎
  </h2>

<div className="leads-container" style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  maxWidth: '1400px',
  gap: '37px',
}}>
 <div 
 className="lead-card"
        onClick={() => navigate('/Hotlead')}
        style={{
          backgroundColor: 'white',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
          padding: '30px',
          borderRadius: '12px',
          width: '100%',
          height: '320px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: 'black',
          cursor: 'pointer',
          marginBottom: '20px' // Added some spacing between cards
        }}
      >
        <h3 style={{ fontSize: '22px' }}>🔥 Hot Leads</h3>
      </div>

      {/* 🌤️ Warm Leads */}
      <div 
      className="lead-card"
        onClick={() => navigate('/Warmlead')}
        style={{
          backgroundColor: 'white',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
          padding: '30px',
          borderRadius: '12px',
          width: '100%',
          height: '320px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: 'black',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        <h3 style={{ fontSize: '22px' }}>🌤️ Warm Leads</h3>
      </div>

      {/* ❄️ Cold Leads */}
      <div 
      className="lead-card"
        onClick={() => navigate('/ColdLead')}
        style={{
          backgroundColor: 'white',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
          padding: '30px',
          borderRadius: '12px',
          width: '100%',
          height: '320px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          color: 'black',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        <h3 style={{ fontSize: '22px' }}>❄️ Cold Leads</h3>
      </div>
  </div>
</div>



    </div></div></>
  );
};

export default Leadpages;
