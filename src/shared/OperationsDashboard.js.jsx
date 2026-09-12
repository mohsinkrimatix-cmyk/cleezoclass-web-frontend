import { useRef, useState, useEffect } from 'react';
import './Homepage3.css';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Routes, Route } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,Pie,PieChart,Cell } from 'recharts';

// import Teacherstimetable from './Teacherstimetable';
import AcademicManagement from './AcademicManagement';
import { Link } from 'react-router-dom';

import { useNavigate } from 'react-router-dom';
import Groupchart from './livechart';



import axios from 'axios';
// import ExamSetup from '../components/ExamSetup';
import CertificateSelector from '../hr/HR_Certificates_SelectorCertificate';
import TransferCertificate from '../hr/HR_certificates_transfercertificate';
import MigrationCertificate from './MigrationCertificate1';
import ObjectionCertificate from './ObjectionCertificate1';
import AppreciationCertificate from '../hr/HR_certificates_AppreciationCertificate';
import TeacherEvents from './Operations_classRoom_events_TeacherEvents';
import BonafiedCertificate from '../hr/HR_certificates_bonafideCertificate';
import StudyCertificate from '../hr/HR_certificates_StudyCertificate';
import NoDueCertificate from './NoDueCertificate';
import TwoButtons from './SeatingArrangmentClasswise';
// import StudyCertificate from './transfercertificate';


const OperationDashboard = () => {
  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const navigate = useNavigate();
  const [showAttendance, setShowAttendance] = useState(false);
 const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();
 const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState(''); 
  const [activePopupRoute, setActivePopupRoute] = useState("certificate"); 

// 2) add local state (inside the component)
const [showAllPopup, setShowAllPopup] = useState(false);
const [activePopupColumn1, setActivePopupColumn1] = useState("certificate");
// const [activePopupColumn1, setActivePopupColumn1] = useState("certificate");
const [activePopupColumn2, setActivePopupColumn2] = useState("events");
const [activePopupColumn3, setActivePopupColumn3] = useState("exam");
const [certificatePopup, setCertificatePopup] = useState(null);
const [selectedStudent,setSelectedStudent]= useState()



 const [open, setOpen] = useState(false);

const certificateComponents = {
  transfer: TransferCertificate,
  appreciation: AppreciationCertificate,
  completion: StudyCertificate,
  
  migration: MigrationCertificate,
  bonafide: BonafiedCertificate,
  // nodue: NoDueCertificate,
  objection: ObjectionCertificate,
nodue:NoDueCertificate

};
 const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);




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
 
  const attendanceData = [ { name: 'Present', value: 85, color: 'rgba(15,150,128,255)' }, { name: 'Absent', value: 10, color: '#F44336' }, { name: 'Late', value: 5, color: '#FFC107' }, ];
 
const data = [
  { name: 'Occupied', value: 70 },
  { name: 'Idle', value: 30 },
];

const COLORS = ['#4CAF50', '#FF7043']; // green and orange

  const handleAttendanceClick = () => {
    navigate('/TeacherAttendance');

  };
const handleCertificateChange = (path) => {
  navigate(path);  // go to that route
};
  

  const handleGroupChartClick = () => {
    navigate('/groupchart');

  };
  const handleteacherstimetableClick = () => {
    navigate('/Teacherstimetable');

  };
 
  const handlestaffperformanceClick = () => {
    navigate('/TeacherDetails');

  };
  const handlesaccedamicmanagemenClick = () => {
    navigate('/accdemic');
  };
  const openCalendar = () => {
    dateInputRef.current?.showPicker();
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
  // The container click handler to update active content
  const handleContainerClick = (content) => {
    setActiveContent(content); // Update active content
  };

  // Function to download content as PDF
  const handleDownload = () => {
    const content = headerRef.current;
   
    // Set the scale for the page, this is to ensure that the entire page fits
    const scale = 2;  // You can adjust this value to your needs

    // Capture the entire content as a canvas
    html2canvas(content, {
      scale: scale,
      useCORS: true, // Ensure that it can render external images properly
      logging: false // Disable logging for better performance
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png'); // Convert canvas to image
      const doc = new jsPDF('p', 'mm', 'a4'); // Create an A4 document

      // Adjust the width and height based on the canvas
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Scale height according to the width
     
      // Add the image to the PDF (top-left corner of the page)
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Save the PDF
      doc.save('dashboard.pdf');
    });
  };
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };


  // Options for customizing the chart

 const handleBackClick = () => {
    navigate('/'); // Navigate to the "accdemic" route
  };
  const userRole = localStorage.getItem('userRole');
// Styling used across all icons
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
  position: 'sticky',
  top: '0',
  zIndex: '50',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  position: 'relative'
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


      <div className="outer-container">


        <div className="main-content">
   
         
          {/* Dynamically Rendered Content */}
          <div className="dashboard-header" ref={headerRef}>
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
                  Operation Dashboard
                </h1>

                <div className="calendar-container">
                  <div className="calendar-icon-wrapper">
                    <label className="date-label">Till Date:</label>

                    <input
                      type="date"
                      ref={dateInputRef}
                      className="hidden-date-input"
                      onChange={handleDateChange}
                    />

                    <button className="calendar-button" onClick={openCalendar}>
                      <Calendar size={20} />
                    </button>

                    {selectedDate && (
                      <span className="selected-date">{selectedDate}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
             <style>
    {`
      @media (min-width: 768px) and (max-width: 1023px) {
        .medium-flex-row {
          display: flex !important;
          flex-direction:column!important;
        }
      }
    `}
  </style><style>
  {`
    @media (max-width: 1023px) {
      .column-flex {
        display: flex !important;
        flex-direction: column !important;
        flex-wrap: wrap;
        width: 100%;
      }
      .column-flex > * {
        width: 100% !important;
        max-width: 100%;
        box-sizing: border-box;
      }
    }

    @media (min-width: 1024px) {
      .column-flex {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: wrap;
        gap: 16px;
      }
      .column-flex > * {
        flex: 1;
        min-width: 0;
      }
    }
  `}
</style>


             <div
              className="white-box "
              ref={headerRef}
              style={{
                maxHeight: '500px',
                overflowY: 'auto',
                padding: '20px',
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >

<div  className="medium-flex-row  column-flex"
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    width: '100%',
    padding: '1rem',
  }}
>
             



               

  {/* State of Health Section */}


<div
  className="grid-section driver-performance"
 style={{
      gap: '0',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: '1', // Ensure it takes up space in the row
      minWidth: '300px',
            background:'#f9f9f9'

    }}
  onClick={handlestaffperformanceClick}
>
  <div className="section-header">
    <div>
      <h3
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}
      > 
      
        Staff Performance
      </h3>
    </div>
  </div>
<div
  style={{
    marginTop: "20px",
    padding: "10px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  }}
>
  {/* Task Card 1: Attendance */}
  <div
    style={{
      backgroundColor: "#e3f2fd",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.3s ease-in-out",
      cursor: "pointer",
      width: "100%",
      maxWidth: "350px", // keeps it nice on larger screens
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div>
      <div style={{ fontWeight: "600" }}>
        <i
          className="fa fa-check-circle"
          style={{ marginRight: "6px", color: "#4caf50" }}
        ></i>
        Attendance
      </div>
      <div style={{ fontSize: "12px", color: "#555" }}>
        View attendance records and punctuality to assess staff's commitment to
        regularity.
      </div>
    </div>
  </div>

  {/* Task Card 2: Marks */}
  <div
    style={{
      backgroundColor: "#ffebee",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.3s ease-in-out",
      cursor: "pointer",
      width: "100%",
      maxWidth: "350px",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div>
      <div style={{ fontWeight: "600" }}>
        <i
          className="fa fa-pen"
          style={{ marginRight: "6px", color: "#2196f3" }}
        ></i>
        Marks
      </div>
      <div style={{ fontSize: "12px", color: "#555" }}>
        Evaluate the marks secured by students in their subjects to gauge staff
        teaching effectiveness.
      </div>
    </div>
  </div>

  {/* Task Card 3: Punctuality */}
  <div
    style={{
      backgroundColor: "#fff3e0",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.3s ease-in-out",
      cursor: "pointer",
      width: "100%",
      maxWidth: "350px",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div>
      <div style={{ fontWeight: "600" }}>
        <i
          className="fa fa-smile"
          style={{ marginRight: "6px", color: "#ff9800" }}
        ></i>
        Behavior & Punctuality
      </div>
      <div style={{ fontSize: "12px", color: "#555" }}>
        Assess both the behavior and punctuality of staff members for a holistic
        performance evaluation.
      </div>
    </div>
  </div>
</div>
















</div>




  {/* Driver Behavior Section */}
<div
  className="grid-section driver-behavior"
 style={{
      gap: '0',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: '1', // Ensure it takes up space in the row
      minWidth: '300px',
            background:'#f9f9f9'

    }}
  onClick={handlesaccedamicmanagemenClick}
>
  <div className="section-header">
    <div>
      <h3
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}
      >
        Academic Management
      </h3>
    </div>
  </div>

  <div
  style={{
    marginTop: "20px",
    padding: "10px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  }}
>
  {/* Task Card 2: Syllabus */}
  <div
    style={{
      backgroundColor: "#e3f2fd",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.3s ease-in-out",
      cursor: "pointer",
      width: "100%",
      maxWidth: "350px",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div>
      <div style={{ fontWeight: "600" }}>
        <i
          className="fa fa-book"
          style={{ marginRight: "6px", color: "#555" }}
        ></i>
        Syllabus
      </div>
      <div style={{ fontSize: "12px", color: "#555" }}>
        Access the syllabus for each subject and course.
      </div>
    </div>
  </div>



  {/* Task Card 3: Paper Generation and Evaluation */}
  <div
    style={{
      backgroundColor: "#ffebee",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.3s ease-in-out",
      cursor: "pointer",
      width: "100%",
      maxWidth: "350px",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div>
      <div style={{ fontWeight: "600" }}>
        <i
          className="fas fa-pencil-alt"
          style={{ marginRight: "6px", color: "#555" }}
        ></i>
        Paper Generation and Evaluation
      </div>
      <div style={{ fontSize: "12px", color: "#555" }}>
        Generate and evaluate exam papers with automatic grading.
      </div>
    </div>
  </div>

  {/* Task Card 1: Top and Weak Students */}
  <div
    style={{
      backgroundColor: "#fff3e0",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.3s ease-in-out",
      cursor: "pointer",
      width: "100%",
      maxWidth: "350px",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div>
      <div style={{ fontWeight: "600" }}>
        <i
          className="fa fa-trophy"
          style={{ marginRight: "6px", color: "#555" }}
        ></i>
        Top and Weak Students
      </div>
      <div style={{ fontSize: "12px", color: "#555" }}>
        View the list of top-performing and weak students.
      </div>
    </div>
  </div>
</div>

</div>





<div
  className="grid-section fc-idle-time"
 style={{
      gap: '0',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: '1', // Ensure it takes up space in the row
      minWidth: '300px',
            background:'#f9f9f9'

    }}
  onClick={handleteacherstimetableClick}
>
  <div className="section-header">
    <div>
      <h3
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}
      >
        Teachers Time Table
      </h3>
    </div>
  </div>


<div
  style={{
    marginTop: "20px",
    padding: "10px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  }}
>
  {/* Task Card 1: Timetable Generation */}
  <div
    style={{
      backgroundColor: "#e3f2fd",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.3s ease-in-out",
      cursor: "pointer",
      width: "100%",
      maxWidth: "350px",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div>
      <div style={{ fontWeight: "600" }}>
        <i
          className="fa fa-calendar"
          style={{ marginRight: "6px", color: "#555" }}
        ></i>
        Timetable Generation
      </div>
      <div style={{ fontSize: "12px", color: "#555" }}>
        Automatically generates the timetable based on teacher availability.
      </div>
    </div>
  </div>

  {/* Task Card 2: Teacher Availability */}
  <div
    style={{
      backgroundColor: "#ffebee",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.3s ease-in-out",
      cursor: "pointer",
      width: "100%",
      maxWidth: "350px",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div>
      <div style={{ fontWeight: "600" }}>
        <i
          className="fa fa-user-check"
          style={{ marginRight: "6px", color: "#555" }}
        ></i>
        Teacher Availability
      </div>
      <div style={{ fontSize: "12px", color: "#555" }}>
        This will check which teachers are absent today.
      </div>
    </div>
  </div>

  {/* Task Card 3: Substitute Teachers */}
  <div
    style={{
      backgroundColor: "#fff3e0",
      borderRadius: "12px",
      padding: "12px 16px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "transform 0.3s ease-in-out",
      cursor: "pointer",
      width: "100%",
      maxWidth: "350px",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
  >
    <div>
      <div style={{ fontWeight: "600" }}>
        <i
          className="fa fa-user-plus"
          style={{ marginRight: "6px", color: "#555" }}
        ></i>
        Substitute Teachers
      </div>
      <div style={{ fontSize: "12px", color: "#555" }}>
        If any teachers are absent today, substitutes can be assigned in their
        place.
      </div>
    </div>
  </div>
</div>





</div>
<div
  className="grid-section fc-idle-time"
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 0,
    gap: 0,
    flex: 1,
    minWidth: '300px',
    textAlign: 'center',
          background:'#f9f9f9'

  }}
  onClick={handleGroupChartClick}
>
  <div className="section-header">
    <h3
      style={{
        fontSize: '24px',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        textAlign: 'center',
      }}
    >
      Group Chart
    </h3>
  </div>
{/* here  should be componant  */}


<div
  style={{
    marginTop: "20px",
    padding: "10px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  }}
>
  {[
    {
      icon: "fa-users",
      title: "Teachers Communication",
      desc: "Communication between all the teachers. Stay connected to share updates",
      bgColor: "#e3f2fd",

    },
    {
      icon: "fa-clock",
      title: "Time Management",
      desc: "This feature is available within the selected time range.",
      bgColor: "#ffebee",

    },
    {
      icon: "fa-user-check",
      title: "Select People",
      desc: "If you want to communicate with selected people, you can choose them from the list below.",
      bgColor: "#fff3e0",
    },
  ].map((card, index) => (
    <div
      key={index}
      style={{
        backgroundColor: card.bgColor,
        borderRadius: "12px",
        padding: "12px 16px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "transform 0.3s ease-in-out",
        cursor: "pointer",
        width: "100%",
        maxWidth: "350px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    > 


      <div>
        <div style={{ fontWeight: "600", marginBottom: "4px" }}>
          <i
            className={`fa ${card.icon}`}
            style={{ marginRight: "6px", color: "#555" }}
          ></i>
          {card.title}
        </div>
        <div style={{ fontSize: "12px", color: "#555" }}>{card.desc}</div>
      </div>
    </div>
  ))}
</div>



</div> 


<div
  className="grid-section fc-idle-time"
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 0,
    gap: 0,
    flex: 1,
    minWidth: '300px',
    textAlign: 'center',
    background:'#f9f9f9'

  }}
  // onClick={handleCertificateChange}
>
  <div className="section-header">
    <h3
      style={{
        fontSize: '24px',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        textAlign: 'center',
      }}
    >
     Classroom & Events
    </h3>
  </div>
{/* here  should be componant  */}



<div
  style={{
    marginTop: "20px",
    padding: "10px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  }}
>
  {[
    {
      icon: "fa-certificate", 
      title: "Student e-Certificate",
      desc: "Generate and share secure digital certificates with ease.",
      bgColor: "#e3f2fd",
      navigate:"/SelectorCertificate",
    },
    {
      icon:  "fa-calendar-check",
      title: "Event Management",
      desc: "Plan and manage events quickly and efficiently",
      bgColor: "#ffebee",
      navigate:"/EventManagement"
    },
    { 

      icon: "fa-chair", 
      title: "Sitting Arrangements",
      desc: "Organize seating layouts for smooth events and classes",
      bgColor: "#fff3e0",
      // navigate:"/examSetup"
    },





  ].map((card, index) => (
    <div
      key={index}
      style={{
        backgroundColor: card.bgColor,
        borderRadius: "12px",
        padding: "12px 16px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "transform 0.3s ease-in-out",
        cursor: "pointer",
        width: "100%",
        maxWidth: "350px",
      }}
 onClick={() => setOpen(true)}
    //  onClick={() => handleCertificateChange(card.navigate)}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div>
        <div style={{ fontWeight: "600", marginBottom: "4px" }}>
          <i
            className={`fa ${card.icon}`}
            style={{ marginRight: "6px", color: "#555" }}
          ></i>
          {card.title}
        </div>
        <div style={{ fontSize: "12px", color: "#555" }}>{card.desc}</div>
      </div>
    </div>
  ))}
</div>
</div> 




{/* 3) Fullscreen popup showing all three components with equal size */}






{/* const [activePopupRoute, setActivePopupRoute] = useState("certificate"); 
// default view in popup */}
{open && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "30px",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "1600px",
        height: "auto", // let it grow
        maxHeight: "90vh",
        overflowY: "auto",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        boxShadow: "0px 8px 25px rgba(0,0,0,0.3)",
        position: "relative",
      }}
    >
      {/* Close Button */}
      <button
        onClick={() => setOpen(false)}
        style={{
          position: "absolute",
          top: "15px",
          right: "20px",
          background: "transparent",
          border: "none",
          fontSize: "22px",
          cursor: "pointer",
          color: "#333",
        }}
      >
        ✖
      </button>

      {/* Column 1 */}
      <div
        style={{
          background: "#f9fafb",
          padding: "20px",
          borderRadius: "10px",
          textAlign: "center",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
        }}
      >
        {activePopupColumn1 === "certificate" && (
          <CertificateSelector
            onLocalNavigate={(next, passingStudentsData) => {
              setSelectedStudent(passingStudentsData);
              if (certificateComponents[next]) {
                setCertificatePopup(next);
              } else {
                setActivePopupColumn1(next);
              }
            }}
          />
        )}
      </div>

      {/* Column 2 */}
      <div
        style={{
          background: "#f9fafb",
          padding: "20px",
          borderRadius: "10px",
          textAlign: "center",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
        }}
      >
        {activePopupColumn2 === "events" && (
          <TeacherEvents onLocalNavigate={(next) => setActivePopupColumn2(next)} />
        )}
        {activePopupColumn2 === "eventDetails" && <ObjectionCertificate />}
      </div>

      {/* Column 3 */}
      <div
        style={{
          background: "#f9fafb",
          padding: "20px",
          borderRadius: "10px",
          textAlign: "center",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
          width: "100%",
        }}
      >
        {activePopupColumn3 === "exam" && (
          <TwoButtons onLocalNavigate={(next) => setActivePopupColumn3(next)} />
        )}
        {activePopupColumn3 === "examDetails" && <ObjectionCertificate />}
      </div>
    </div>
  </div>
)}








{certificatePopup && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000, // bigger than main popup
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
        maxWidth: "800px",
        width: "100%",
        height: "80vh",
        overflowY: "auto",
        position: "relative",
      }}
    >
      <button
        onClick={() => setCertificatePopup(null)}
        style={{
          position: "absolute",
          top: "10px",
          right: "15px",
          border: "none",
          background: "transparent",
          fontSize: "22px",
          cursor: "pointer",
        }}
      >
        ✖
      </button> 
{/* 
      {certificatePopup === "transfer" && <TransferCertificate />}
      {certificatePopup === "appreciation" && <AppreciationCertificate />} */} 

       {certificatePopup &&
        (() => {
          const SelectedCertificate = certificateComponents[certificatePopup];
          return SelectedCertificate ? <SelectedCertificate  userData={selectedStudent} /> : null;
        })()}
      {/* Add other 6 certificate components here */}
    </div>
  </div>
)}









</div>

         
            <div className="dashboard-footer">
           
            </div>
           
          </div>

       
         

        </div>
       
     </div>
    </>
  );
};

export default OperationDashboard;
//