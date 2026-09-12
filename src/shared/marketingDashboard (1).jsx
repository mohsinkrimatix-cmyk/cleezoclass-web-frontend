import { useRef, useState ,useEffect} from 'react';
import './Homepage3.css';
import { Download ,ArrowLeft} from 'lucide-react';
import { FiArrowLeft } from 'react-icons/fi';
import { Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useNavigate } from "react-router-dom";

import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,Legend,
  BarChart, Bar, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import axios from 'axios';


// import logo1 from './logo.jpg'; // Adjust path as needed
// import logo2 from './logo1.jpg'; // Adjust path as needed
// import logo3 from './logo3.jpg'; // Adjust path as needed
const MarketingDashboard = () => {
  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const headerRef = useRef(null); // Ref to the dashboard header content
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
const dashboardRef = useRef(null);
  const navigate = useNavigate();

 const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();

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



  const sampleLineData = [
    { name: 'Jan', value: 30 },
    { name: 'Feb', value: 45 },
    { name: 'Mar', value: 60 },
    { name: 'Apr', value: 80 },
    { name: 'May', value: 65 },
  ];

  const sampleBarData = [
    { name: 'Jan', value: 30 },
    { name: 'Feb', value: 45 },
    { name: 'Mar', value: 50 },
    { name: 'Apr', value: 80 },
    { name: 'May', value: 55 },
  ];


  // Share PDF if supported
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

  // Generate PDF blob from current view
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
  const samplePieData = [
    { name: 'Follow-up', value: 400 },
    { name: 'Test', value: 300 },
    { name: 'Enrollment', value: 300 },
    { name: 'Admissions', value: 200 },
  ];

  const sampleRadarData = [
    { subject: 'Follow-up', A: 60 },
    { subject: 'Test', A: 70 },
    { subject: 'Enrollment', A: 80 },
    { subject: 'Admissions', A: 50 },
    { subject: 'Counseling', A: 90 },
  ];
  const sampleCounselingData = [
    { name: 'Career Counseling', value: 200 },
    { name: 'Personal Counseling', value: 150 },
    { name: 'Academic Counseling', value: 100 },
    { name: 'Behavior Counseling', value: 50 },
  ];
const enrollmentData = [
  { month: "Jan", candidates: 10 },
  { month: "Feb", candidates: 20 },
  { month: "Mar", candidates: 15 },
  { month: "Apr", candidates: 25 },
  { month: "May", candidates: 18 },
  { month: "Jun", candidates: 30 },
  { month: "Jul", candidates: 22 },
  { month: "Aug", candidates: 35 },
  
];

const counselingSessionsData = [
  { subject: 'Career Counseling', value: 200 },
  { subject: 'Academic Counseling', value: 150 },
  { subject: 'Behavior Counseling', value: 100 },
  { subject: 'Personal Counseling', value: 80 },
];
const admissionsTakenData = [
  { name: 'Engineering', value: 150 },
  { name: 'Medical', value: 120 },
  { name: 'Commerce', value: 80 },
  { name: 'Arts', value: 50 },
];
const entranceTestResults = [
  { month: 'Jan', appeared: 100, cleared: 60 },
  { month: 'Feb', appeared: 120, cleared: 70 },
  { month: 'Mar', appeared: 150, cleared: 90 },
  { month: 'Apr', appeared: 130, cleared: 85 },
  { month: 'May', appeared: 160, cleared: 100 },
];
const followUpData = [
  { month: 'Jan', followUpCompleted: 40 },
  { month: 'Feb', followUpCompleted: 50 },
  { month: 'Mar', followUpCompleted: 60 },
  { month: 'Apr', followUpCompleted: 70 },
  { month: 'May', followUpCompleted: 80 },
];

  const openCalendar = () => {
    dateInputRef.current?.showPicker();
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

    pdf.save('full-dashboard.pdf');
  } catch (error) {
    console.error('Error generating full PDF:', error);
  } finally {
    // Step 3: Restore original styles
    input.style.height = originalStyle.height;
    input.style.overflow = originalStyle.overflow;
  }
};


  
  const userRole = localStorage.getItem('userRole');

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };
  const handleBackClick = () => {
    navigate('/'); // Navigate to the "accdemic" route
  };
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
  position: 'fixed',
  width: '100%',
  top: '0',
  zIndex: '50',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  borderBottom: '12px solid white' // Add this line
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

<style>
  {`
    @media (max-width: 480px) {
      .white-box {
        padding: 10px !important;
      }
    }
  `}
</style>

      <div className="outer-container" style={{ paddingTop: '40px' }}>


        <main className="main-content">
          <section className="dashboard-body">
       
<div ref={dashboardRef}   className="print-area"
  style={printAreaStyle}>
            <div className="dashboard-header" >
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
                  Marketing Dashboard
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

            <div
  className="white-box"
  ref={contentRef}
  style={{
    padding: '20px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }}
>
             
             

              {/* Chart Containers */}
<div className="chart-sections" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
  {/* Follow-up Chart */}

  {/* Enrollment Chart */}
<div className="chart-box" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
  <Link to="/enrollment" style={{ textDecoration: 'none', color: 'inherit' }}>
    <h3 style={{ textAlign: 'center', marginBottom: '10px' }}> Enrollment</h3>
      <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={enrollmentData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar 
          dataKey="candidates" 
          fill="#0f9680" 
          name="Candidates" 
          barSize={30} 
        />
      </BarChart>
    </ResponsiveContainer>
  </Link>
</div>
  {/* Entrance Test Results Chart */}
  <div className="chart-box" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
    <Link to="/Test" style={{ textDecoration: 'none', color: 'inherit' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Entrance Test</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={entranceTestResults}>
          <Bar dataKey="appeared" fill="rgba(141,171,182,255)" />
           <Bar dataKey="cleared" fill="rgba(15,150,128,255)" />
          <CartesianGrid strokeDasharray="5 5" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
        </BarChart>
      </ResponsiveContainer>
    </Link>
  </div>
    <div className="chart-box" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
    <Link to="/follow-up" style={{ textDecoration: 'none', color: 'inherit' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Follow-up</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={followUpData}>
          <Line type="monotone" dataKey="followUpCompleted" stroke="rgba(15,150,128,255)" />
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    </Link>
  </div>
{/* Counseling Chart */}
  <div className="chart-box" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
    <Link to="/meet" style={{ textDecoration: 'none', color: 'inherit' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Counseling</h3>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart outerRadius={90} width={400} height={250} data={counselingSessionsData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis />
          <Radar name="Sessions" dataKey="value" stroke="rgba(15,150,128,255)" fill="rgba(15,150,128,255)" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </Link>
  </div>
  {/* Admissions Taken Chart */}
  <div className="chart-box" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>


    <Link to="/Leadpages" style={{ textDecoration: 'none', color: 'inherit' }}>
       <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Leads</h3>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={admissionsTakenData} dataKey="value" nameKey="name" outerRadius={80} fill="rgba(124,188,179,255)" label />
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
    </>
  );
};

export default MarketingDashboard;
export const printAreaStyle = {
  visibility: 'visible',
  display: 'block',
  height: 'auto',
  overflow: 'visible',
};
