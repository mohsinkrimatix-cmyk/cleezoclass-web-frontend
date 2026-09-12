import { CheckCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState,useRef,useContext ,useEffect} from 'react';
import jsPDF from 'jspdf';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';// Import useNavigate for redirection
// import './attendance.css';
import { Link } from 'react-router-dom';

import axios from 'axios';

const SalaryForm = () => {
  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    salary_amount: '',
    salary_type: '',
    effective_from: '',
    status: 'pending',
    hra: '',          // New field
    mediclaim: '',    // New field
    pf: '',           // New field
    professional_tax: '', // New field
    deductions: '',   // New field
  });

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


  const [teacherData, setTeacherData] = useState([]);
  const navigate = useNavigate();
 const [activeContent, setActiveContent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [task, setTask] = useState("");
const dashboardRef = useRef(null);
const [hotLeads, sethotLeads] = useState([]);
const [sending, setSending] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);
   const [loadingIds, setLoadingIds] = React.useState([]);
 useEffect(() => {
   // Enhanced schoolCode retrieval with validation
   const schoolCode = localStorage.getItem('schoolCode');
   
   console.log('=== FETCH TEACHERS START ===');
   console.log('Raw schoolCode from localStorage:', schoolCode);
   console.log('Type of schoolCode:', typeof schoolCode);
   
   if (!schoolCode) {
     console.error('School code missing in localStorage');
     // You might want to handle this case in your UI
     setTeacherData([]); // Set empty array to avoid undefined state
     return;
   }
 
   // Clean and validate the schoolCode
   const cleanedSchoolCode = String(schoolCode).trim();
   console.log('Cleaned schoolCode:', cleanedSchoolCode);
   console.log('Cleaned schoolCode length:', cleanedSchoolCode.length);
   console.log('Cleaned schoolCode char codes:',
     Array.from(cleanedSchoolCode).map(c => c.charCodeAt(0)));
 
   // Validate the code format
   if (!/^[a-zA-Z0-9_]+$/.test(cleanedSchoolCode)) {
     console.error('Invalid schoolCode format:', cleanedSchoolCode);
     return;
   }
 
   // Encode the schoolCode for URL safety
   const encodedSchoolCode = encodeURIComponent(cleanedSchoolCode);
   const apiUrl = `https://cleezoclass.com:4000/api/teach?schoolCode=${encodedSchoolCode}`;
   
   console.log('Final API URL:', apiUrl);
 
   fetch(apiUrl)
     .then((response) => {
       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       return response.json();
     })
     .then((data) => {
       console.log('Received teacher data:', data);
       setTeacherData(Array.isArray(data) ? data : []);
     })
     .catch((error) => {
       console.error('Error fetching teacher data:', error);
       setTeacherData([]); // Ensure state is always valid
       // Consider adding user feedback here (toast, alert, etc.)
     });
 }, []);

const handleIdChange = (e) => {
  const selectedId = parseInt(e.target.value);
  const selectedTeacher = teacherData.find((teacher) => teacher.id === selectedId);

  setFormData((prevData) => ({
    ...prevData,
    teacher_id: selectedId,
    name: selectedTeacher ? selectedTeacher.name : '',
  }));
};
const handleNameChange = (e) => {
  const selectedName = e.target.value;
  const selectedTeacher = teacherData.find((teacher) => teacher.name === selectedName);

  setFormData((prevData) => ({
    ...prevData,
    name: selectedName,
    teacher_id: selectedTeacher ? selectedTeacher.id : '',
  }));
};


   const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
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
  // State to store the dynamically loaded page content

 
 
  const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
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

  // The container click handler to update active content
  const handleContainerClick = (content) => {
    setActiveContent(content); // Update active content
  };

  // Function to download content as PDF
 
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };
  // Share PDF if supported
  const handleShare = async () => {
    const blob = await generatePDFBlob();
    const file = new File([blob], 'attendanceform.pdf', { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'attendence report',
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
    navigate('/RecruitmentDashboard'); // Navigate to the "accdemic" route
  };
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

    pdf.save(' HotLeads.pdf');
  } catch (error) {
    console.error('Error generating full PDF:', error);
  } finally {
    // Step 3: Restore original styles
    input.style.height = originalStyle.height;
    input.style.overflow = originalStyle.overflow;
  }
};
const handleSubmit = (e) => {
    e.preventDefault();
    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) {
      alert('School code not found in localStorage.');
      return;
    }
    // Merge schoolCode and all form fields into the payload
    const payload = {
      ...formData,
      schoolCode,
      salary_amount: String(formData.salary_amount), // Ensure it's a string if your API expects it
      hra: String(formData.hra),
      mediclaim: String(formData.mediclaim),
      pf: String(formData.pf),
      professional_tax: String(formData.professional_tax),
      deductions: String(formData.deductions),
    };
    fetch('https://cleezoclass.com:4000/api/add-salary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        console.log('Salary submitted:', data);
        alert('Salary submitted successfully!');
        setFormData({
          teacher_id: '',
          name: '',
          salary_amount: '',
          salary_type: '',
          effective_from: '',
          status: 'pending',
          hra: '',
          mediclaim: '',
          pf: '',
          professional_tax: '',
          deductions: '',
        });
        navigate('/RecruitmentDashboard');
      })
      .catch((error) => {
        console.error('Error submitting salary:', error);
        alert('Failed to submit salary.');
      });
  };



   const handleShare = async () => {
    const blob = await generatePDFBlob();
    const file = new File([blob], 'hotleads.pdf', { type: 'application/pdf' });

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
 const handleBackClick = () => {
    navigate('/RecruitmentDashboard'); // Navigate to the "accdemic" route
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
  <div className="header">
            
     
               
                </div>


  <div
  className="salary-form-wrapper"
  style={{
    maxWidth: '1000px',
    width: '600px',
    margin: 'auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    backgroundColor: '#f9f9f9'
  }}
>
<style>
  {`
    @media (max-width: 768px) {
      .salary-form-wrapper {
        width: 90% !important;
        padding: 15px !important;
      }

      .salary-form-wrapper form {
        gap: 8px !important;
      }

      .salary-form-wrapper form > div {
        flex-direction: column !important;
        gap: 8px !important;
      }
    }

    @media (max-width: 480px) {
      .salary-form-wrapper {
        width: 95% !important;
        padding: 10px !important;
      }

      .salary-form-wrapper form button {
        padding: 8px !important;
        font-size: 14px !important;
      }
    }
  `}
</style>

  <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Employee Base Salary Entry Form</h2>
 <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
    <div style={{ flex: 1 }}>
      <label htmlFor="teacher_name" style={{ fontWeight: 'bold' }}>Employee Name:</label>
      <select
        id="teacher_name"
        value={formData.name}
        onChange={handleNameChange}
        required
        style={{ padding: '8px', borderRadius: '5px', width: '100%' }}
      >
        <option value="">Select Employee Name</option>
        {teacherData.map((teacher) => (
          <option key={teacher.id} value={teacher.name}>
            {teacher.name}
          </option>
        ))}
      </select>
    </div>
    <div style={{ flex: 1 }}>
      <label htmlFor="teacher_id" style={{ fontWeight: 'bold' }}>Employee ID:</label>
      <select
        id="teacher_id"
        value={formData.teacher_id}
        onChange={handleIdChange}
        required
        style={{ padding: '8px', borderRadius: '5px', width: '100%' }}
      >
        <option value="">Select Employee ID</option>
        {teacherData.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.id}
          </option>
        ))}
      </select>
    </div>
  </div>

  <label htmlFor="salary_amount" style={{ fontWeight: 'bold' }}>Base Salary Amount:</label>
  <input
    type="number"
    id="salary_amount"
    name="salary_amount"
    value={formData.salary_amount}
    onChange={handleChange}
    required
    style={{ padding: '8px', borderRadius: '5px' }}
  />

  <label htmlFor="salary_type" style={{ fontWeight: 'bold' }}>Salary Type:</label>
  <select
    id="salary_type"
    name="salary_type"
    value={formData.salary_type}
    onChange={handleChange}
    required
    style={{ padding: '8px', borderRadius: '5px' }}
  >
    <option value="">Select Salary Type</option>
    <option value="monthly">Monthly</option>
    <option value="hourly">Hourly</option>
    <option value="contract">Contract</option>
  </select>

  {/* New Fields */}
  <label htmlFor="hra" style={{ fontWeight: 'bold' }}>HRA:</label>
  <input
    type="number"
    id="hra"
    name="hra"
    value={formData.hra}
    onChange={handleChange}
    style={{ padding: '8px', borderRadius: '5px' }}
  />

  <label htmlFor="mediclaim" style={{ fontWeight: 'bold' }}>BONUS</label>
  <input
    type="number"
    id="mediclaim"
    name="mediclaim"
    value={formData.mediclaim}
    onChange={handleChange}
    style={{ padding: '8px', borderRadius: '5px' }}
  />

  <label htmlFor="pf" style={{ fontWeight: 'bold' }}>GPF / NPS (Pension Contribution)</label>
  <input
    type="number"
    id="pf"
    name="pf"
    value={formData.pf}
    onChange={handleChange}
    style={{ padding: '8px', borderRadius: '5px' }}
  />

  <label htmlFor="professional_tax" style={{ fontWeight: 'bold' }}>Professional Tax:</label>
  <input
    type="number"
    id="professional_tax"
    name="professional_tax"
    value={formData.professional_tax}
    onChange={handleChange}
    style={{ padding: '8px', borderRadius: '5px' }}
  />

  <label htmlFor="deductions" style={{ fontWeight: 'bold' }}>Other Deductions (Loan, Society, etc., if any):</label>
  <input
    type="number"
    id="deductions"
    name="deductions"
    value={formData.deductions}
    onChange={handleChange}
    style={{ padding: '8px', borderRadius: '5px' }}
  />

  <label htmlFor="effective_from" style={{ fontWeight: 'bold' }}>Effective From:</label>
  <input
    type="date"
    id="effective_from"
    name="effective_from"
    value={formData.effective_from}
    onChange={handleChange}
    required
    style={{ padding: '8px', borderRadius: '5px' }}
  />

  <label htmlFor="status" style={{ fontWeight: 'bold' }}>Status:</label>
  <select id="status" name="status" value={formData.status} onChange={handleChange} required style={{ padding: '8px', borderRadius: '5px' }}>
    <option value="pending">Pending</option>
    <option value="paid">Paid</option>
  </select>

  <button type="submit" style={{ padding: '10px', backgroundColor: '#5a7488', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
    Submit Base Salary
  </button>
</form>

</div>

   
   
   
   
   
   
   
   
    </div>
   
    </div>
</>


  );
};

export default SalaryForm;

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
}; const userRole = localStorage.getItem('userRole');







