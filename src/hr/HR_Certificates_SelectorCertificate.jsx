
import { useRef, useState, useEffect } from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock, faUserTimes, faBookReader, faUserCheck, faTrophy, faExclamationCircle, faAward,
  // ADDED ICONS: Print, Download, Edit
  faPrint, faDownload, faEdit, faTimes, 
  faShareAlt
} from "@fortawesome/free-solid-svg-icons";
const CertificateSelector = ({ teacherId, onLocalNavigate }) => {
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
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [issueDate, setIssueDate] = useState('');
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynmaicschoolCode, dynamicsetSchoolCode] = useState('');
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [activeContent, setActiveContent] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
  const printRef = useRef();
  const [selectedCopies, setSelectedCopies] = useState(1);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [selectedCert, setSelectedCert] = React.useState('');
  const [selectedSection,setSelectedSection]= useState()
  const [passingStudentsData,setPassingStudentData]= useState()

  const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
  };

  useEffect(() => {
    const fetchStudentsOnLoad = async () => {
      const schoolCode = localStorage.getItem('schoolCode');
      if (!schoolCode) {
        console.error("schoolCode not found in localStorage");
        return;
      }
      try {
        console.log("📡 Fetching students for schoolCode:", schoolCode);
        const response = await axios.post(
          `https://cleezoclass.com:4000/api/students`,  
          //  `http://locaolhost:3020/api/students`, 
          
          { schoolCode }
        );
        const { school } = response.data;
        setSchoolInfo(school);
      } catch (err) {
        console.error("❌ Error fetching students on load:", err.response?.data || err.message);
      }
    };
    fetchStudentsOnLoad();
  }, []);

  const handleSchoolChange = (e) => {
    const schoolId = e.target.value;
    setSelectedSchoolId(schoolId);
    setAdmnNo('');
    setStudent(null);
    setSchool(null);
    const selectedSchool = schools.find(s => String(s.id) === String(schoolId));
    if (selectedSchool) {
      setSchool(selectedSchool);
      const schoolCode = localStorage.getItem('schoolCode');
      if (!schoolCode) {
        console.error("schoolCode not found in localStorage");
        return;
      }
      axios.get(`https://cleezoclass.com:4000/api/students/${schoolCode}`)
        .then((res) => setAdmnList(res.data))
        .catch((err) => console.error("Error fetching students:", err));
    } else {
      console.error("No matching school found");
    }
  };

  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode') || "TAGSOLNOVALLP";
    if (selectedClass) {
      axios.get(`https://cleezoclass.com:4000/api/certificate/${selectedClass}?schoolCode=${schoolCode}`)
        .then(res => setStudents(res.data.students))
        .catch(err => console.error("Error fetching students:", err));
    }
  }, [selectedClass]);

const handleStudentID = (id) => { 
  const userData = students.find((s) => s.id === id);
  setPassingStudentData(userData);


  console.log("data find here ", userData)
  console.log(passingStudentsData)
};





  useEffect(() => {
    const fetchUserProfile = async () => {
      console.log("🔍 Starting fetchUserProfile...");
      const schoolCode = localStorage.getItem('schoolCode');
      const username = localStorage.getItem('username');
      console.log("📚 Retrieved schoolCode:", schoolCode);
      console.log("👤 Retrieved username:", username);
      if (!schoolCode || !username) {
        console.warn("⚠️ Missing schoolCode or username. Aborting fetch.");
        return;
      }
      try {
        console.log("📡 Making API request to fetch profile...");
        const response = await axios.get(
          `https://cleezoclass.com:4000/api/profile/${schoolCode}/${username}`
        );
        console.log("✅ Successfully fetched user profile:", response.data.user);
        setUserProfile(response.data.user);
      } catch (err) {
        console.error("❌ Error fetching profile:", err.response?.data || err.message);
        if (err.response) {
          console.error("📡 Server responded with status:", err.response.status);
          console.error("📨 Error data from server:", err.response.data);
        } else if (err.request) {
          console.error("⏳ No response received from server. Check your internet or backend.");
        } else {
          console.error("🛠️ Error setting up request:", err.message);
        }
      }
    };
    fetchUserProfile();
  }, []);

  const handleAdmnChange = (e) => {
    const selectedAdmn = e.target.value;
    setAdmnNo(selectedAdmn);
    if (!selectedAdmn || !selectedSchoolId) return;
    const schoolCode = localStorage.getItem('schoolCode');
    if (schoolCode) {
      axios.get(`https://cleezoclass.com:4000/api/student-details/${schoolCode}/${selectedSchoolId}/${selectedAdmn}`)
        .then((res) => {
          setStudent(res.data.student);
          setSchool(res.data.school);
        })
        .catch((err) => console.error("Error fetching student:", err));
    } else {
      console.error("No schoolCode found in localStorage");
    }
  };


  const handleSealRedirect = () => {
    if (!selectedStudentId) {
      alert("Please select a student first.");
      return;
    }
    navigate(`/seal-sign/${selectedSchoolId}`);
  };

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
    navigate('/AccountantDashboard');
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

  const handleCertificateClick = (certificateType) => {
    if (!selectedClass || !selectedStudentId) {
      alert("Please select a class and a student first.");
      return;
    }
    const selectedStudent = students.find(student => student.id === selectedStudentId);
    navigate(`/${certificateType}`, { state: { selectedClass, student: selectedStudent } });
  };
  

  return (
<>

      <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    gap: "15px",
    marginTop: "40px",
  }}
>
<button  className="actionBtnStyle"onClick={handlePrint}>
    <FontAwesomeIcon icon={faPrint} />
</button>


  <button
    onClick={handleDownload}
   className="actionBtnStyle"
  >
    <FontAwesomeIcon icon={faDownload} />
  </button>
</div>

  <h5
    style={{
      display: "flex",
      justifyContent: "center",
      fontFamily: "Arial, Helvetica, sans-serif",
    }}
  >
    <span style={{ marginRight: "8px" }}>🎓</span>
    Student e-Certificate Desk
  </h5>

  <div
    style={{
      display: "flex",
      justifyContent: "center",
      width: "100%",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: "20px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #ccc",
        padding: "20px",
        borderRadius: "10px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Select Student Section */}
      <h5
        style={{
          textAlign: "center",
          fontWeight: "700",
          marginBottom: "10px",
        }}
      >
        Select Student
      </h5>

      {/* Class + Section */}
      <div
        style={{
          display: "flex",
          flexDirection: window.innerWidth < 600 ? "column" : "row",
          justifyContent: "space-between",
          marginBottom: "1rem",
          fontWeight: "600",
          gap: "10px",
          color: "#1f1f1f",
        }}
      >
        {/* Select Class */}
        <div style={{ flex: 1 }}>
          <label
            style={{
              marginBottom: "0.5rem",
              fontWeight: "500",
              fontSize: "0.875rem",
              display: "block",
            }}
          >
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
              boxSizing: "border-box",
              color: "#1f1f1f",
              fontWeight: "500",
            }}
          >
            <option value="" disabled>
              Select a class
            </option>
            {[
              "nursery",
              "lkg",
              "ukg",
              ...Array.from({ length: 10 }, (_, i) => `class${i + 1}`),
            ].map((cls) => (
              <option key={cls} value={cls}>
                {formatClassName(cls)}
              </option>
            ))}
          </select>
        </div>

        {/* Select Section */}
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              fontSize: "14px",
            }}
          > 
            Select Section
          </label>
          <select
            value={selectedSection ?? ""}
            onChange={(e) => setSelectedSection(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
              boxSizing: "border-box",
            }}
            disabled={!selectedClass}
          >
            <option value="" disabled>
              Select section
            </option>

            {["A", "B", "C", "D"].map((section) => (
              <option key={section} value={section}>
                Section {section}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student + Certificate */}
      <div
        style={{
          display: "flex",
          flexDirection: window.innerWidth < 600 ? "column" : "row",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {/* Select Student */}
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: "500",
              fontSize: "14px",
              color: "#333333",
            }}
          >    
            Select Student
          </label>
          <select
            value={selectedStudentId ?? ""}
            onChange={(e) => {
              const studentId = Number(e.target.value);
              setSelectedStudentId(studentId);
              handleStudentID(studentId);
            }} 


            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              fontSize: "0.875rem",
              boxSizing: "border-box",
            }}
            disabled={!selectedClass}
          >
            <option value="" disabled>
              Select student
            </option>
            {Array.isArray(students) &&
              students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} (ID: {student.id})
                </option>
              ))}
          </select>
        </div>       






            

        {/* Choose Certificate */}
        <div style={{ flex: 1 }}>
          <h5
            style={{
              textAlign: "center",
              fontWeight: "700",
              marginBottom: "5px",
            }}
          >
            Choose Certificate
          </h5>

          <select
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              onLocalNavigate(value, passingStudentsData);
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
              backgroundColor: "#f9f9f9",
            }}
          >
            <option value="">-- Select a Certificate --</option>
            <option value="transfer">Transfer Certificate</option>
            <option value="completion">Study Certificate</option>
            <option value="bonafide">Bonafide Certificate</option>
            <option value="nodue">No Due Certificate</option>
            <option value="appreciation">Achievement Certificate</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</>




  );
};

export default CertificateSelector;

const btnStyle = {
  margin: '5px',
  padding: '8px 12px',
  fontSize: '15px',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '1px solid #aaa',
  backgroundColor: 'rgba(238, 238, 238, 1)'
};

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






