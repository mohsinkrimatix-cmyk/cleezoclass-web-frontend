import { useRef, useState, useEffect } from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from "axios";
import { useNavigate } from "react-router-dom";

const schoolLogo = ""; // Optional custom logo

function FollowUp() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const logoSrc = schoolLogo || "/default-logo.png";
  const dateInputRef = useRef(null);
  const contentRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
  const navigate = useNavigate();
  const [activeContent, setActiveContent] = useState(null);

  // --- Event Handlers ---
  const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
  };

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

  const handleBackClick = () => {
    navigate('/Marketing');
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

  const handleDownload = () => {
    const content = headerRef.current;
    const scale = 2;
    html2canvas(content, {
      scale: scale,
      useCORS: true,
      logging: false,
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      doc.save('dashboard.pdf');
    });
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };
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

useEffect(() => {
  const fetchAdmissions = async () => {
    try {
      const schoolCode = localStorage.getItem('schoolCode');

      if (!schoolCode) {
        throw new Error('No schoolCode found in localStorage');
      }

      const response = await axios.get('https://cleezoclass.com:4000/admissions', {
        params: {
          schoolCode: schoolCode,
        },
      });

      setAdmissions(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('❌ Failed to load admissions.');
      setLoading(false);
    }
  };

  fetchAdmissions();
}, []);


  // --- Render ---
  if (loading) {
    return <div style={loadingStyles}>Loading Admissions...</div>;
  }

  if (error) {
    return <div style={errorStyles}>{error}</div>;
  }

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
      <div className="outer-container">
 
        <div className="main-content">
      
          <div style={containerStyles} ref={headerRef}>
            <h1 style={pageHeaderStyles}>Admissions Management</h1>
            <table style={tableStyles}>
              <thead>
                <tr style={theadRowStyles}>
                  <th style={thStyles}>Admin ID</th>
                  <th style={thStyles}>Student Name</th>
                  <th style={thStyles}>DOB</th>
                  <th style={thStyles}>Gender</th>
                  <th style={thStyles}>Father's Name</th>
                  <th style={thStyles}>Father's Phone</th>
                  <th style={thStyles}>Father's Occupation</th>
                  <th style={thStyles}>Mother's Name</th>
                  <th style={thStyles}>Mother's Phone</th>
                  <th style={thStyles}>Mother's Occupation</th>
                  <th style={thStyles}>Address</th>
                  <th style={thStyles}>Score</th>
                  <th style={thStyles}>Student Photo</th>
                  <th style={thStyles}>Birth Certificate</th>
                  <th style={thStyles}>Aadhar Card</th>
                  <th style={thStyles}>TC</th>
                  <th style={thStyles}>Mark Sheet</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((admission) => (
                  <tr key={admission.id} style={tbodyRowStyles}>
                    <td style={tdStyles}>{String(admission.id).substring(0, 10)}</td>
                    <td style={tdStyles}>{admission.student_name}</td>
                    <td style={tdStyles}>{new Date(admission.dob).toLocaleDateString()}</td>
                    <td style={tdStyles}>{admission.gender}</td>
                    <td style={tdStyles}>{admission.father_name}</td>
                    <td style={tdStyles}>{admission.father_phone || <span style={notSubmittedStyles}>❌</span>}</td>
                    <td style={tdStyles}>{admission.father_occupation || <span style={notSubmittedStyles}>❌</span>}</td>
                    <td style={tdStyles}>{admission.mother_name}</td>
                    <td style={tdStyles}>{admission.mother_phone || <span style={notSubmittedStyles}>❌</span>}</td>
                    <td style={tdStyles}>{admission.mother_occupation || <span style={notSubmittedStyles}>❌</span>}</td>
                    <td style={tdStyles}>{admission.address}</td>
                    <td style={tdStyles}>
                      {admission.score !== null ? admission.score : <span style={notSubmittedStyles}>N/A</span>}
                    </td>
                    <td style={tdStyles}>
                      {admission.student_photo ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
                    </td>
                    <td style={tdStyles}>
                      {admission.birth_certificate ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
                    </td>
                    <td style={tdStyles}>
                      {admission.aadhar_card ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
                    </td>
                    <td style={tdStyles}>
                      {admission.tc ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
                    </td>
                    <td style={tdStyles}>
                      {admission.mark_sheet ? <span style={submittedStyles}>✅</span> : <span style={notSubmittedStyles}>❌</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ====== Styles ======
const containerStyles = {
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#fff',
  minHeight: '100vh',
};

const pageHeaderStyles = {
  textAlign: 'center',
  marginBottom: '30px',
  fontSize: '32px',
  color: 'rgba(15,150,128,255)',
};

const loadingStyles = {
  fontSize: '24px',
  textAlign: 'center',
  marginTop: '100px',
};

const errorStyles = {
  fontSize: '20px',
  color: 'red',
  textAlign: 'center',
  marginTop: '100px',
};

const tableStyles = {
  width: '100%',
  borderCollapse: 'collapse',
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
};

const theadRowStyles = {
  backgroundColor: 'rgba(141,171,182,255)',
};

const thStyles = {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'center',
  color: 'white',
  fontWeight: 'bold',
  backgroundColor: 'rgba(141,171,182,255)',
};

const tbodyRowStyles = {
  backgroundColor: '#ffffff',
};

const tdStyles = {
  padding: '10px',
  border: '1px solid #ddd',
  textAlign: 'center',
};

const submittedStyles = {
  color: 'green',
  fontWeight: 'bold',
};

const notSubmittedStyles = {
  color: 'red',
  fontWeight: 'bold',
};

export default FollowUp;
