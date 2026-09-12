import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import { CheckCircle, Star, X } from "lucide-react";
import * as XLSX from 'xlsx';
import { FaWhatsapp } from 'react-icons/fa';

const PLAY_STORE_LINK = 'https://play.google.com/store/apps/details?id=com.cleezoclass&pcampaignid=web_share';
const buildInviteMessage = ({ greeting, name, username, password, schoolName }) => (
  `${greeting} ${name},\n\n` +
  `Your student account for ${schoolName} is ready.\n\n` +
  `Download the app here:\n${PLAY_STORE_LINK}\n\n` +
  `Login credentials:\nUsername: ${username}\nPassword: ${password}\n\n` +
  `Please keep these details secure.`
);

const StudentUpload = () => {
  const [activeContent, setActiveContent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [activePage, setActivePage] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [task, setTask] = useState("");
  const [section, setSection] = useState('');
  // const [uploadedData, setUploadedData] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const dateInputRef = useRef(null);
  const contentRef = useRef(null);
  const headerRef = useRef();
  const dashboardRef = useRef(null);
  const [uploadedData, setUploadedData] = useState([]);
  const [finalData, setFinalData] = useState([]);

  //new
  const [senderName, setSenderName] = useState('');
  const [senderNumber, setSenderNumber] = useState('');



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
      pdf.save('HotLeads.pdf');
    } catch (error) {
      console.error('Error generating full PDF:', error);
    } finally {
      input.style.height = originalStyle.height;
      input.style.overflow = originalStyle.overflow;
    }
  };

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

  const handleContainerClick = (content) => {
    setActiveContent(content);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleShare = async () => {
    const blob = await generatePDFBlob();
    const file = new File([blob], 'studentupload.pdf', { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'studentupload report',
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
    navigate('/StudentManagement');
  };

  const userRole = localStorage.getItem('userRole');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setShowPreview(false);
  };

  const normalizeData = (data) => {
    console.log("Raw data from backend:", data);
    return data.map((item) => ({
      name: item.name || "N/A",
      gender: item.gender || "N/A",
      phone: item.phone || "N/A",
      fatherName: item.fatherName || "N/A",
      class: item.class || "N/A",
      username: item.username || "N/A",
      password: item.password || "N/A",
      role: item.role || "N/A",
    }));
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setPreviewData(jsonData);
      setShowPreview(true);
    };
    reader.readAsArrayBuffer(selectedFile);
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
        'https://cleezoclass.com/:3020/api/schoollogodynamic',
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

  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    const formData = new FormData();
    const schoolCode = localStorage.getItem("schoolCode");

    console.log("📤 Submitting file for student upload");
    console.log("🏫 School Code:", schoolCode);
    console.log("📄 Selected file:", selectedFile?.name);

    if (!selectedFile) {
      alert("Please select a file.");
      setIsLoading(false);
      return;
    }

    if (!schoolCode) {
      alert("School code missing in localStorage.");
      setIsLoading(false);
      return;
    }

    formData.append("file", selectedFile);

    try {
      const response = await fetch(`https://cleezoclass.com:4000/api/upload-excel/student?schoolCode=${encodeURIComponent(schoolCode)}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("✅ Server response:", data);

      if (!response.ok) {
        alert(`❌ Upload failed: ${data.message || "Unknown error."}`);
        setIsLoading(false);
        return;
      }

      const inserted = data.insertedRecords || [];
      const duplicates = data.duplicates || [];



      let alertMessage = `📦 ${data.message || "Upload result"}\n\n`;

      if (inserted.length > 0) {
        alertMessage += `✅ ${inserted.length} record(s) inserted successfully.\n\n`;
      }

      if (duplicates.length > 0) {
        alertMessage += `⚠️ ${duplicates.length} duplicate record(s) skipped:\n\n`;
        duplicates.forEach((dup, index) => {
          alertMessage += `${index + 1})\n`;
          alertMessage += `   Name: ${dup.name || "-"}\n`;
          alertMessage += `   Username: ${dup.username || "-"}\n`; // Updated to show username instead of phone_no/aadhar_no
        });
      }

      if (!inserted.length && !duplicates.length) {
        alertMessage = "⚠️ No valid records found in the uploaded file.";
      }

      alert(alertMessage);
      setSuccessMessage(`${inserted.length} inserted, ${duplicates.length} duplicate(s) skipped`);
      // setUploadedData([...inserted, ...duplicates]);


      const merged = [...inserted, ...duplicates];

      // Ensure 'phone' field is assigned from 'father_phone_no' if 'phone' is missing
      const processed = merged.map(student => ({
        ...student,
        phone: student.phone || student.phone_no || student.father_phone_no || '',
      }));

      setUploadedData(processed);

      setSelectedFile(null);
      setShowPreview(false);
    } catch (err) {
      console.error("❗ Network error:", err);
      alert("❗ Network or server error. Please try again later.");
      setSuccessMessage("");
      setUploadedData([{ error: "An error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };



  const downloadExcel = () => {
    if (uploadedData.length === 0) {
      alert("No data to download");
      return;
    }

    const dataWithWhatsapp = uploadedData.map(item => {
      const phone =
        item.phone && item.phone.trim() !== ''
          ? item.phone
          : (item.phone_no || item.father_phone_no || '');

      const whatsappLink = phone ? `https://wa.me/${phone}` : 'N/A';

      return { ...item, phone, whatsappLink };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataWithWhatsapp);
    XLSX.utils.book_append_sheet(wb, ws, "StudentData");
    XLSX.writeFile(wb, `student_data.xlsx`);
  };


  const renderTableHeaders = () => {
    if (previewData.length === 0) return null;
    return (
      <tr style={{ backgroundColor: "#5a7488", color: "white" }}>
        {Object.keys(previewData[0]).map((key) => (
          <th key={key} style={thStyle}>{key}</th>
        ))}
      </tr>
    );
  };

  const renderTableData = () => {
    if (previewData.length === 0) {
      return (
        <tr>
          <td colSpan={Object.keys(previewData[0] || {}).length} style={{ textAlign: "center", padding: "20px" }}>
            No data available
          </td>
        </tr>
      );
    }
    return previewData.map((item, index) => (
      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#f1f1f1" : "white" }}>
        {Object.values(item).map((value, idx) => (
          <td key={idx} style={tdStyle}>{value}</td>
        ))}
      </tr>
    ));
  };

  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);
  const [popupStudent, setPopupStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = () => {
    axios.get('https://cleezoclass.com:4000/api/students')
      .then(res => setStudents(res.data))
      .catch(err => console.error("Error fetching students:", err));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    else if (hour < 17) return "Good afternoon";
    else return "Good evening";
  };

  // 📥 Handle Excel file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet); // Array of objects
      setPreviewData(data);
    };
    reader.readAsBinaryString(file);
  };


  // useEffect(() => {
  //   const merged = uploadedData.map(student => {
  //     const match = previewData.find(
  //       entry => entry.name.trim().toLowerCase() === student.name.trim().toLowerCase()
  //     );

  //     const username = student.username || '';
  //     return {
  //       name: student.name,
  //       username: username,
  //       password: username, // Set password same as username
  //       phone: match?.father_phone_no || '',
  //       gender: student.gender || '',
  //       fatherName: student.fatherName || '',
  //       class: student.class || '',
  //       role: student.role || ''
  //     };
  //   });

  //   setFinalData(merged);
  // }, [uploadedData, previewData]);

useEffect(() => {
  const merged = uploadedData.map(student => {
    const match = previewData.find(
      entry => (entry.name || '').trim().toLowerCase() === (student.name || '').trim().toLowerCase()
    );
    const username = student.username || '';
    return {
      name: student.name || '',
      username: username,
      password: username,
      phone: match?.father_phone_no || '',
      gender: student.gender || '',
      fatherName: student.fatherName || '',
      class: student.class || '',
      role: student.role || ''
    };
  });
  setFinalData(merged);
}, [uploadedData, previewData]);



  const sendwhatsapp = (student) => {
    setPopupStudent(student);
  };
  const sendWhatsAppMessage = async (student) => {
  const schoolId = localStorage.getItem("schoolCode"); // LocalStorage key for schoolId

  const message = buildInviteMessage({
    greeting: getGreeting(),
    name: student.name || 'Student',
    username: student.username || 'Not provided',
    password: student.password || 'Not provided',
    schoolName: senderName || 'your school'
  });

  try {
    const response = await axios.post('https://cleezoclass.com:4000/api/whatsapp/send-messagewhatsapp', {
      number: student.phone,
      message: message,
      schoolId: schoolId
    });

    alert('✅ WhatsApp message sent!');
  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error);
    alert('❌ Failed to send WhatsApp message');
  }
};


// useEffect(() => {
//   if (!popupStudent) return; // ❌ Don't run if popup is not open

//   const schoolId = localStorage.getItem("schoolCode");

//   const fetchQR = async () => {
//     try {
//       const res =await fetch(`https://cleezoclass.com:4000/api/whatsapp/qr?schoolCode=${schoolId}`);

//       const data = await res.json();

//       if (data.ready) {
//         setClientReady(true); // WhatsApp already connected
//         setQrData(null);
//       } else if (data.qr) {
//         setQrData(data.qr);   // Show QR Code
//       } else {
//         setTimeout(fetchQR, 3000); // Retry after 3 seconds if QR not ready
//       }
//     } catch (err) {
//       console.error('QR fetch failed', err);
//     }
//   };

//   fetchQR(); // First time fetch
//   const interval = setInterval(fetchQR, 5000); // Keep polling every 5 seconds

//   return () => clearInterval(interval); // Clean up on unmount or popup close
// }, [popupStudent]); // 👈 Only runs when popupStudent is true



const confirmSend = async () => {
  if (popupStudent) {
    console.log("🧪 popupStudent:", popupStudent);

    const greeting = getGreeting();
    const name = popupStudent.name || "Student";
    const username = popupStudent.username;
    const password = popupStudent.password;
    const number = popupStudent.phone; // Or fallback: || popupStudent.phone_no || popupStudent.father_phone_no

    if (!number) {
      alert("⚠️ Phone number is missing for this student.");
      return;
    }

    const message = buildInviteMessage({
      greeting,
      name,
      username,
      password,
      schoolName: senderName || 'your school'
    });
    const cleanedPhone = String(number).replace(/\D/g, '');
    const formattedPhone = cleanedPhone.startsWith('91') ? cleanedPhone : `91${cleanedPhone}`;
    window.open(
      `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}&app_absent=1`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  setPopupStudent(null); // Clear popup
};


  const cancelPopup = () => {
    setPopupStudent(null);
  };

  const thStyle = {
    padding: "10px",
    border: "1px solid #ddd",
  };

  const tdStyle = {
    padding: "10px",
    border: "1px solid #ddd",
  };

  // console.log("FaWhatsapp test:", FaWhatsapp);

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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              fontFamily: 'Segoe UI, sans-serif',
              backgroundColor: '#f4f6f9',
              boxSizing: 'border-box',

              width: '100%',
            }}
            ref={dashboardRef}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                fontFamily: 'Arial, sans-serif',
                backgroundColor: 'white',
                color: 'black',
                boxSizing: 'border-box',
                width: '90%',
                maxWidth: '1000px',
                margin: '0 auto',
                border: '1px solid #ccc',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                minHeight: '420px'
              }}
            >
              <h1 style={{
                textAlign: 'center',
                fontSize: '38px',
                fontWeight: 'bold',
                marginBottom: '30px'
              }}>
                Student Data Upload
              </h1>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '27px',
              }}>
                Upload a file for STUDENT
              </h3>
              <div style={{
                width: "100%",
                margin: "10px auto",
                padding: "5px",
                fontFamily: "Arial, sans-serif",

              }}>
                <p style={{ margin: "5px 0", display: "block" }}>
                  <span style={{ fontWeight: "bold", fontSize: '19px', color: "#b71c1c" }}>⚠️ Mandatory fields:</span>
                  <span style={{
                    fontFamily: "Arial",
                    color: '#b71c1c',
                    paddingLeft: '16px',
                    fontStyle: 'italic',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    Name, Class, Section, Mobile number, Class teacher
                  </span>
                </p>
                <p style={{ margin: "15px 0", fontWeight: "bold", color: "#b71c1c" }}>
                  🔴 Upload student XL data in this Order format only:
                </p>
                <div style={{
                  width: "100%",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  paddingBottom: "10px",
                  boxSizing: "border-box"
                }}>
                  <table style={{
                    borderCollapse: "collapse",
                    backgroundColor: "#ffebee",
                    fontSize: "15px",
                    minWidth: "900px"
                  }}>
                    <thead>
                      <tr>
                        {[
                          "name", "gender", "father_phone_no", "aadhar_no", "father_name",
                          "class", "section", "class_teacher", "address",
                          "student_photo", "assigned_bus_no"
                        ].map((header, index) => (
                          <td key={index} style={{
                            border: "1px solid #ddd",
                            padding: "6px 12px",
                            textAlign: "center",
                            color: "#b71c1c",
                            fontWeight: "bold",
                            whiteSpace: "nowrap"
                          }}>
                            {header}
                          </td>
                        ))}
                      </tr>
                    </thead>
                  </table>
                </div>
              </div>
              <div style={{
                marginBottom: '20px',
                textAlign: 'center',
                width: '100%',
                marginBottom: '33px'
              }}>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleFileChange}
                  value={selectedFile ? "" : undefined}
                  style={{ fontSize: '16px' }}
                />
                {selectedFile && (
                  <p style={{ color: 'blue', marginTop: '10px' }}>
                    Selected file: {selectedFile.name}
                  </p>
                )}
              </div>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '10px 30px',
                  backgroundColor: '#5a7488',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Circle size={18} className="spin" style={{ marginRight: '8px' }} />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
              {successMessage && (
                <div style={{
                  color: 'green',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}>
                  {successMessage}
                </div>
              )}
              {showPreview && (
                <div style={{
                  width: '100%',
                  marginTop: '20px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      Preview of Uploaded Student Data
                    </h2>
                    <button
                      onClick={handleConfirmSubmit}
                      //  onClick={()=> sendwhatsapp(student)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgb(125,103,101)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Confirm and Upload
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <thead>{renderTableHeaders()}</thead>
                      <tbody>{renderTableData()}</tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'gray',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginTop: '10px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div style={{
                width: '100%',
                marginTop: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    Uploaded Student Data
                  </h2>
                  {uploadedData.length > 0 && (
                    <button
                      onClick={downloadExcel}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgb(125,103,101)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Download as Excel
                    </button>
                  )}
                </div>
                {uploadedData.length > 0 ? (
                  <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <thead>
                        <tr style={{ backgroundColor: "#5a7488", color: "white" }}>
                          <th style={thStyle}>Name</th>
                          <th style={thStyle}>Gender</th>
                          <th style={thStyle}>Phone</th>
                          <th style={thStyle}>Father Name</th>
                          <th style={thStyle}>Class</th>
                          <th style={thStyle}>Username</th>
                          <th style={thStyle}>Password</th>
                          <th style={thStyle}>Role</th>
                          <th style={thStyle}>WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody>
                    {finalData.map((student, index) => (
  <tr key={index}>
    <td>{student.name}</td>
    <td>{student.gender}</td>
    <td>{student.phone}</td>
    <td>{student.fatherName}</td>
    <td>{student.class}</td>
    <td>{student.username}</td>
    <td>{student.password}</td>
    <td>{student.role}</td>
    <td>
      {student.phone ? (
        <button
          onClick={() => {
            setPopupStudent(student); // open popup
          }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
          title="Send WhatsApp Message"
        >
          <FaWhatsapp size={22} color="green" />
        </button>
      ) : (
        'N/A'
      )}
    </td>
  </tr>
))}

                      </tbody>
                    </table>

                  </div>
                ) : (
                  <p style={{
                    textAlign: 'center',
                    padding: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: 'red'
                  }}>
                    No records uploaded.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div >



      {/* Whatsapp Pop-up Modal  */}
   {popupStudent && (
  <div style={popupOverlayStyle}>
    <div style={popupBoxStyle}>
      <h3 style={{ color: '#000' }}>Send WhatsApp Message</h3>

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        background: '#f8fafc',
        padding: '14px',
        marginBottom: '14px'
      }}>
        <div style={{
          display: 'inline-block',
          background: '#0f766e',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 700,
          borderRadius: '999px',
          padding: '4px 10px',
          marginBottom: '10px'
        }}>
          App Download
        </div>
        <p style={{ color: '#111827', margin: '0 0 8px 0', fontWeight: 600 }}>
          Share the Play Store link instead of a QR code.
        </p>
        <a
          href={PLAY_STORE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#0f766e',
            fontWeight: 700,
            wordBreak: 'break-word'
          }}
        >
          {PLAY_STORE_LINK}
        </a>
      </div>

      <p style={{ color: '#000', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
        <strong>To:</strong> {popupStudent.name}
        {'\n'}
        <strong>Message:</strong>
        {'\n'}
        {buildInviteMessage({
          greeting: getGreeting(),
          name: popupStudent.name || 'Student',
          username: popupStudent.username || 'Not provided',
          password: popupStudent.password || 'Not provided',
          schoolName: senderName || 'your school'
        })}
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button onClick={cancelPopup} style={cancelBtn}>Cancel</button>
        <button onClick={confirmSend} style={sendBtn}>Open WhatsApp</button>
      </div>
    </div>
  </div>
)}



    </>
  );
};

export default StudentUpload;

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


// Modal Styles
const popupOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const popupBoxStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  width: '300px',
  color: '#000',
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
};

const cancelBtn = {
  backgroundColor: 'gray',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px'
};

const sendBtn = {
  backgroundColor: 'green',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px'
};








const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};
