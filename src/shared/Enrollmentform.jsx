import { useRef, useState ,useEffect} from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle, AlignCenter } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';import axios from "axios";
import { useNavigate } from "react-router-dom";import { Link } from 'react-router-dom';


const SchoolAdmissionForm = () => {
  const [formData, setFormData] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'file' ? files[0] : value,
    });
  };
  const dateInputRef = useRef(null);
  const contentRef = useRef(null); // Ref to white-box only
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const headerRef = useRef();
  const [showAttendance, setShowAttendance] = useState(false);
const dashboardRef = useRef(null);

  // State to store the dynamically loaded page content
  const [activeContent, setActiveContent] = useState(null);
 
 const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();
 

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
    navigate('/Marketing'); // Navigate to the "accdemic" route
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

    const pdfWidth = 224; // A4
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

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setErrorMessage('');
  console.log('🚀 Submitting form...');

  if (formData.studentPhoto && !formData.studentPhoto.type.startsWith('image/')) {
    setErrorMessage('Student photo must be an image file.');
    return;
  }

  if (formData.studentPhoto && formData.studentPhoto.size > 5 * 1024 * 1024) {
    setErrorMessage('Student photo must be less than 5MB.');
    return;
  }

  try {
    const data = new FormData();
    for (const key in formData) {
      if (formData[key]) {
        data.append(key, formData[key]);
        console.log(`📦 Appended ${key} to FormData`);
      }
    }

    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) {
      setErrorMessage('School code is missing in localStorage.');
      console.warn('⚠️ schoolCode missing in localStorage');
      return;
    }

    data.append('schoolCode', schoolCode);
    console.log(`🏫 Appended schoolCode: ${schoolCode}`);

    const response = await fetch('https://cleezoclass.com:4000/api/admissionprocess', {
      method: 'POST',
      body: data,
    });

    console.log('📡 Server responded with status:', response.status);

    const result = await response.json();
    console.log('📥 Response JSON:', result);

    if (response.ok) {
      setFormSubmitted(true);
      setFormData({});
      alert('Form submitted successfully!');
    } else {
      setErrorMessage(result.message || 'Failed to submit form');
    }
  } catch (error) {
    console.error('❌ Submission error:', error);
    setErrorMessage('An error occurred while submitting the form.');
  }
};
 const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynamicSchoolCode, setDynamicSchoolCode] = useState('');
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
  const userRole = localStorage.getItem('userRole');
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



{/* ADD THIS ENTIRE SNIPPET */}
<style>
    {`
      @media (max-width: 1200px) {
        .form-row {
          /* Stack the form sections vertically on tablets and mobile */
          grid-template-columns: 1fr !important;
        }
        .admission-form-container {
          /* Reduce padding on smaller screens */
          padding: 10px !important;
        }
      }
    `}
</style>




    <div className="outer-container" style={{ paddingTop: '70px' }}>

      <div className="main-content">
      
          <div ref={dashboardRef} style={{ overflowY: 'auto' }}>
    <div style={styles.formContainer} className="admission-form-container">
      <h1 style={styles.formTitle}>School Admission Enrollment Form</h1>
      {formSubmitted && <div style={styles.successMessage}>Form submitted successfully!</div>}
      {errorMessage && <div style={styles.errorMessage}>{errorMessage}</div>}
      <form onSubmit={handleSubmit} style={styles.formGrid}>
        <div style={styles.topRow} className="form-row">
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Student Information</h2>
            <input type="text" name="studentName" onChange={handleChange} placeholder="Full Name" style={styles.inputField} required />
            <input type="date" name="dob" onChange={handleChange} style={styles.inputField} required />
            <select name="gender" onChange={handleChange} style={styles.inputField} required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input type="text" name="bloodGroup" onChange={handleChange} placeholder="Blood Group" style={styles.inputField} />
            <input type="text" name="nationality" onChange={handleChange} placeholder="Nationality" style={styles.inputField} />
            <input type="text" name="religion" onChange={handleChange} placeholder="Religion" style={styles.inputField} />
            <input type="text" name="community" onChange={handleChange} placeholder="Caste/Community" style={styles.inputField} />
            <input type="text" name="motherTongue" onChange={handleChange} placeholder="Mother Tongue" style={styles.inputField} />
            <input
              type="text"
              name="aadhar"
              value={formData.aadhar || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,12}$/.test(value)) handleChange(e);
              }}
              placeholder="Aadhar Number (12 digits)"
              style={styles.inputField}
            />
            <input type="text" name="previousSchool" onChange={handleChange} placeholder="Previous School Name" style={styles.inputField} />
            <input type="text" name="lastClass" onChange={handleChange} placeholder="Last Class Attended" style={styles.inputField} />
            <input type="text" name="applyingFor" onChange={handleChange} placeholder="Class Applying For" style={styles.inputField} />
            <input type="file" name="studentPhoto" onChange={handleChange} style={styles.inputField} />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Parent / Guardian Information</h2>
            <input type="text" name="fatherName" onChange={handleChange} placeholder="Father's Name" style={styles.inputField} />
            <input type="text" name="fatherOccupation" onChange={handleChange} placeholder="Father's Occupation" style={styles.inputField} />
            <input
              type="text"
              name="fatherPhone"
              value={formData.fatherPhone || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,10}$/.test(value)) handleChange(e);
              }}
              placeholder="Father's Phone"
              style={styles.inputField}
            />
            <input type="text" name="motherName" onChange={handleChange} placeholder="Mother's Name" style={styles.inputField} />
            <input type="text" name="motherOccupation" onChange={handleChange} placeholder="Mother's Occupation" style={styles.inputField} />
            <input
              type="text"
              name="motherPhone"
              value={formData.motherPhone || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,10}$/.test(value)) handleChange(e);
              }}
              placeholder="Mother's Phone"
              style={styles.inputField}
            />
          </div>
        </div>

        <div style={styles.bottomRow} className="form-row">
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Address</h2>
            <input type="text" name="address" onChange={handleChange} placeholder="Residential Address" style={styles.inputField} />
            <input type="text" name="city" onChange={handleChange} placeholder="City" style={styles.inputField} />
            <input type="text" name="state" onChange={handleChange} placeholder="State" style={styles.inputField} />
            <input
              type="text"
              name="pin"
              value={formData.pin || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,6}$/.test(value)) handleChange(e);
              }}
              placeholder="PIN Code (6 digits)"
              style={styles.inputField}
            />
            <input type="email" name="email" onChange={handleChange} placeholder="Email ID" style={styles.inputField} />
            <input
              type="text"
              name="phone"
              value={formData.phone || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d{0,10}$/.test(value)) handleChange(e);
              }}
              placeholder="Phone Number"
              style={styles.inputField}
            />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Documents</h2>
            <input type="file" name="birthCertificate" onChange={handleChange} style={styles.inputField} />
            <input type="file" name="aadharCard" onChange={handleChange} style={styles.inputField} />
            <input type="file" name="tc" onChange={handleChange} style={styles.inputField} />
            <input type="file" name="markSheet" onChange={handleChange} style={styles.inputField} />
            <h2 style={styles.sectionTitle}>Medical Information</h2>
            <input type="text" name="allergies" onChange={handleChange} placeholder="Allergies (if any)" style={styles.inputField} />
            <input type="text" name="healthIssues" onChange={handleChange} placeholder="Health Issues" style={styles.inputField} />
          </div>
        </div>

        <div style={styles.declaration}>
          <label style={styles.declarationLabel}>
            <input type="checkbox" name="declaration" onChange={handleChange} style={styles.checkbox} required />
            I hereby declare that the information provided is true and correct to the best of my knowledge.
          </label>
        </div>

        <button type="submit" style={styles.submitButton}>Submit</button>
      </form>
    </div></div>
    </div></div></>
  );
};

// REPLACE the existing 'styles' object with this updated version
const styles = {
  formContainer: {
    padding: '20px',
    maxWidth: '1350px',   // Increased width to accommodate two columns comfortably
    width: '100%',
    margin: '0 auto',     // Centers the form horizontally
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
    // Removed marginLeft to prevent unnecessary whitespace
  },
  formTitle: {
    textAlign: 'center',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color:'rgba(141,171,182,255)'
  },
  formGrid: {
    display: 'grid',
    gap: '20px',
  },
  topRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    // Removed 'width: max-content' to prevent overflow
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    // Removed 'width: max-content' to prevent overflow
  },
  section: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    width: '100%', // Changed from fixed 600px to be responsive within the grid
    boxSizing: 'border-box', // Added for consistent sizing
  },
  sectionTitle: {
    marginBottom: '15px',
    fontSize: '20px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'rgba(15, 150, 128, 1)',
  },
  inputField: {
    width: '90%', // Adjusted width for better padding balance
    padding: '12px',
    margin: '8px auto',
    display: 'block',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  submitButton: {
    backgroundColor: 'rgba(141,171,182,255)',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    margin: '20px auto',
    display: 'block',
  },
  declaration: {
    textAlign: 'center',
    marginTop: '20px',
  },
  declarationLabel: {
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    marginRight: '10px',
  },
  successMessage: {
    color: 'green',
    textAlign: 'center',
    marginBottom: '20px',
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginBottom: '20px',
  }
};

export default SchoolAdmissionForm;