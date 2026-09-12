import { useRef, useState, useEffect } from 'react';
import { Download, Share, ArrowLeft, ChevronRight, Calendar, Circle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import React from 'react';
import { useLocation } from 'react-router-dom';
// import { display } from 'html2canvas/dist/types/css/property-descriptors/display';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock, faUserTimes, faBookReader, faUserCheck, faTrophy, faExclamationCircle, faAward,
  // ADDED ICONS: Print, Download, Edit
  faPrint, faDownload, faEdit, faTimes, 
  faShareAlt
} from "@fortawesome/free-solid-svg-icons";
const AppreciationCertificate = ({ userData }) => {
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

  const [school, setSchool] = useState(null);
  const [issueDate, setIssueDate] = useState('');
  const [dynamicLogoSrc, setDynamicLogoSrc] = useState('');
  const [dynmaicschoolCode, dynamicsetSchoolCode] = useState('');
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [activeContent, setActiveContent] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [students, setStudents] = useState([]);
  const printRef = useRef();
  const [selectedCopies, setSelectedCopies] = useState(1);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [selectedCert, setSelectedCert] = React.useState('');
  const [activity, setActivity] = useState('Mention Activity');
   const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 const location = useLocation();
  const { selectedClass, student } = location.state || {};

  const handleAttendanceClick = () => {
    setActivePage('attendance');
    setActiveContent(true);
  };

 const certRef = useRef();

const handleDownload = () => {
  if (!printRef.current) {
    console.error("❌ No certificate content found to download");
    return;
  }

  const content = printRef.current;
  const scale = 2;

  html2canvas(content, {
    scale: scale,
    useCORS: true,
    logging: false
  }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Keep aspect ratio
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);

    pdf.save('AppreciationCertificate.pdf');
  });
};


  useEffect(() => {
    console.log("here is userData", userData)
    console.log(student)
    if (selectedClass && student) {
      console.log("Selected Class:", selectedClass);
      console.log("Selected Student:", student);
    }
  }, [selectedClass, student]);


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
          'https://cleezoclass.com:4000/api/schoollogodynamic',
        //  ` https://cleezoclass.com:4000/api/schoolprofile`, 
                // ` http://localhost:3020/api/schoolprofile`,
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


 useEffect(() => {
    const fetchSchoolProfile = async () => {
      try {
        setLoading(true);
        const schoolCode = localStorage.getItem("schoolCode")
        console.log(schoolCode)
        const response = await fetch("http://localhost:3020/schoolprofile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolCode }),
        });

        const data = await response.json();

        if (data.status) {

        console.log("here is schoolProfile", data)
        console.log(data.sellerData[0])
          setSchoolData(data.sellerData[0]); // first matching record
        } else {
          setError(data.error || "Something went wrong");
        }
      } catch (err) {
        setError("Failed to fetch school data");
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolProfile();
  }, []); // runs every time sc











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
    navigate('/SelectorCertificate');
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

  // const handlePrint = () => {
  //   const copies = parseInt(selectedCopies) || 1;
  //   const printContents = printRef.current.innerHTML;
  //   const fullContent = Array(copies)
  //     .fill(`<div class="print-page">${printContents}</div>`)
  //     .join('<div style="page-break-after: always;"></div>');
  //   const win = window.open('', '', 'height=700,width=900');
  //   win.document.write(`
  //     <html>
  //       <head>
  //         <title>Certificate</title>
  //         <style>
  //           @media print {
  //             body {
  //               margin: 0;
  //               padding: 0;
  //             }
  //             .print-page {
  //               width: 800px;
  //               margin: 40px auto;
  //               padding: 30px;
  //               box-sizing: border-box;
  //               page-break-inside: avoid;
  //             }
  //           }
  //           body {
  //             font-family: Georgia, serif;
  //             background: white;
  //             padding: 40px;
  //             text-align: center;
  //           }
  //           .print-page {
  //             width: 800px;
  //             margin: 40px auto;
  //             padding: 30px;
  //             box-sizing: border-box;

  //           }
  //         </style>
  //       </head>
  //       <body>
  //         ${fullContent}
  //       </body>
  //     </html>
  //   `);
  //   win.document.close();
  //   win.focus();
  //   win.print();
  //   win.close();
  // };

  // const handleDownload = () => {
  //   const content = headerRef.current;
  //   const scale = 2;
  //   html2canvas(content, {
  //     scale: scale,
  //     useCORS: true,
  //     logging: false
  //   }).then((canvas) => {
  //     const imgData = canvas.toDataURL('image/png');
  //     const doc = new jsPDF('p', 'mm', 'a4');
  //     const imgWidth = 210;
  //     const imgHeight = (canvas.height * imgWidth) / canvas.width;
  //     doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  //     doc.save('dashboard.pdf');
  //   });
  // };


const handlePrint = () => {
  const copies = parseInt(selectedCopies) || 1;
  const printContents = printRef.current.innerHTML;
  const fullContent = Array(copies)
    .fill(`<div class="print-page">${printContents}</div>`)
    .join("");

  const win = window.open("", "", "height=700,width=900");
  win.document.write(`
    <html>
      <head>
        <title>Certificate</title>
        <style>
          @media print {
            @page {
              margin: 0; /* remove default browser margin */
              size: A4; /* keep it on single A4 page */
            }
            body {
              margin: 0;
              padding: 0;
            }
            .print-page {
              width: 100%;
              height: 100vh;  /* take full page height */
              box-sizing: border-box;
              page-break-inside: avoid; 
              page-break-after: avoid;
              overflow: hidden; /* prevent pushing footer */
            }
          }
          body {
            font-family: Georgia, serif;
            background: white;
            text-align: center;
          }
          .print-page {
            width: 800px;
            margin: 0 auto;
            padding: 20px 40px; /* adjust padding */
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
    if(!className){
      return
    }
    if (className.startsWith("class")) {
      const number = className.replace("class", "");
      return `CLASS ${number}`;
    }
    return className.toUpperCase();
  };

  const handleCertificateChange = (e) => {
    const selectedCert = e.target.value;
    setSelectedCert(selectedCert);
    if (selectedCert) {
      navigate(`/${selectedCert.replace(/\s+/g, '-').toLowerCase()}`);
    }
  };

  const getCurrentDate = () => {
  const today = new Date();
  return today.toLocaleDateString('en-IN'); // Format: DD/MM/YYYY
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

        
        <div className="main-content">
          
          <div style={{
            // margin: '20px 5vw',
            fontFamily: 'Arial, Helvetica, sans-serif',
            background: '#f5f7fa',
            // padding: '20px',
            height:'auto',
            borderRadius: '8px',alignContent:'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>



<div  ref={printRef} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      <div>
      {userData ? (
        <div>

          <style>
        {`
          .certificate-container {
            border: 2px solid black;
            padding: 20px;
            margin: 50px auto;
            max-width: 800px;
            font-family: 'Times New Roman', Times, serif;
            position: relative;
            background-color: white;
          }
          .certificate-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .board-name {
            font-size: 24px;
            font-weight: bold;
          }
          .header-address {
            font-size: 18px;
            font-weight: bold;
          }
          .certificate-title {
            font-size: 22px;
            font-weight: bold;
            text-decoration: underline;
            margin-top: 40px;
            margin-bottom: 20px;
          }
          .header-logos {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .school-logo {
            width: 150px; /* Adjust size as needed */
            height: auto;
          }
          .student-photo {
            width: 120px; /* Adjust size as needed */
            height: 120px; /* Adjust size as needed */
            border: 1px solid #ccc;
          }
          .certificate-body {
            margin-top: 30px;
            line-height: 1.8;
            text-align: justify;
          }
          .student-details {
            font-weight: bold;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 60px;
          }
          .signature-section {
            text-align: right;
            font-weight: bold;
          }
          .date-section {
            font-weight: bold;
          }
          .computer-generated-note {
            margin-top: 40px;
            font-size: 12px;
            text-align: center;
            font-style: italic;
          }
          .regd-no-year {
            text-align: right;
          }
                  .editable-input {
        border: none;
        border-bottom: 1px solid #999;
        background-color: transparent;
        font-size: inherit;
        font-family: inherit;
        font-weight: inherit;
        color: inherit;
        text-align: center;
        padding: 0 5px;
        width: 30%;
      }

      .editable-input:focus {
        outline: none;
        border-bottom: 1px solid #999;
      }
        `}
      </style>
   <div
  style={{
    position: "relative",
    padding: "30px",
    backgroundColor: "white",
    borderRadius: "10px",
    overflow: "hidden",
  }}
>
  
  {/* ✅ Background Watermark Logo */}
  {dynamicLogoSrc && (
    <img
      src={dynamicLogoSrc}
      alt="Watermark Logo"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "300px",      // adjust size
        height: "auto",
        opacity: 0.1,        // faint background
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  )}

  {/* ✅ Certificate Content on Top */}
  <div style={{ position: "relative", zIndex: 1 }}>


  <div
  className="header-logos"
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    padding: "10px 20px",
    borderRadius: "12px",
    background: "linear-gradient(90deg, #444, #777)", // Stylish gradient
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)", // Soft shadow
    color: "white",
  }}
>
  {/* Left Side - School Name */}
  <h2
    className="school-name"
    style={{
      fontSize: "22px",
      fontWeight: "bold",
      margin: 0,
      textShadow: "1px 1px 2px rgba(0,0,0,0.5)", // Elegant text shadow
      letterSpacing: "1px",
    }}
  >
    {localStorage.getItem("schoolCode") || "School Code"} SCHOOL
  </h2>

  {/* Right Side - Logo */}
  <div
    style={{
      width: "70px",
      height: "70px",
      background: "white",
      borderRadius: "50%", // Circle for logo
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)", // Logo shadow
      overflow: "hidden",
    }}
  >
    {dynamicLogoSrc && (
      <img
        src={dynamicLogoSrc}
        alt="School Logo"
        style={{
          width: "90%",
          height: "90%",
          objectFit: "contain",
        }}
      />
    )}
  </div>
</div>


    <div style={{ height: "3px", backgroundColor: "black", width: "100%" }}></div>

    <div className="certificate-header" style={{ marginBottom: "40px" }}>
      <p className="certificate-title">APPRECIATION CERTIFICATE</p>
    </div>

   
  
    <div className="regd-no-year" style={{ marginBottom: "25px", display:"flex", justifyContent: "space-between"}}>
     <p>
        <strong>Date. :</strong>
        <span>
          <strong>{getCurrentDate()}</strong>
        </span>
      </p>
     
      <p>
        <strong>Admission No :  </strong>
        <span>
          <strong>{userData?.id}</strong>
        </span>
      </p>
      
    </div>

    <div className="certificate-body">
      <p style={{ marginBottom: "15px" }}>
        This is to certify that Sri./Smt./Kumari{" "}
        <span className="student-details">
          <span>
            <strong>{userData?.name}</strong>
          </span>
        </span>{" "}
        S/o/D/o.{userData.father_name || "_________"}
        <span className="student-details">
          <span>
            {/* <strong>{userData?.father_name}</strong> */}
          </span>
        </span>
        , is a student of
        <span className="student-details">
          <span>
            {" "}
            {localStorage.getItem("schoolCode") || "School Code will appear here"} SCHOOL
          </span>
        </span>
        , currently studying in class{" "}
        <span>
          <strong>{formatClassName(userData.class_name)}</strong>
        </span>{" "}
        <span className="student-details">
          during the academic year{" "}
          <span>
            {" "}
            <strong>{getCurrentYear()}</strong>.
          </span>
        </span>
      </p>
      <p style={{ marginBottom: "15px" }}>
        He/She is being{" "}
        <strong>
          Appreciated for [his/her] outstanding performance in{" "}
          <input
            type="text"
            className="editable-input"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
          />
        </strong>
      </p>
      <p>
        Throughout the academic session, the student has displayed dedication, discipline, and a strong commitment to excellence.
      </p>
      <p>
        The school takes great pride in recognizing such efforts and wishes the student continued success in all future endeavors.
      </p>
    </div>

    <div className="footer-section">
      <div className="date-section">
        {/* <p>Hyderabad.</p> */}
        <p>
          {/* Date : <span>{getCurrentDate()}</span> */}
        </p>
      </div>
      <div className="signature-section">
        <p>Principal</p>
      </div>
    </div>
<footer
  style={{
    background: "linear-gradient(135deg, #222, #444)", // dark gradient look
    color: "white",
    padding: "15px 20px",
    textAlign: "center",
    marginTop: "60px",
    borderTop: "3px solid gold", // stylish top border
    fontFamily: "'Georgia', serif", // certificate feel
    letterSpacing: "0.5px",
    boxShadow: "0px -2px 8px rgba(0,0,0,0.3)",
  }}
>
  {schoolData && (
    <>
      <p
        style={{
          fontSize: "16px",
          fontStyle: "italic",
          margin: "0 0 8px 0",
          color: "#f0d98a", // soft gold
        }}
      >
        {/* (Recognized by Govt. of A.P) */}
      </p>

      <p
        style={{
          fontSize: "15px",
          margin: "0 0 6px 0",
          fontWeight: "500",
        }}
      >
        {schoolData.institute_address}
      </p>

      <p
        style={{
          fontSize: "15px",
          margin: "0",
        }}
      >
        Ph:{" "}
        <span
          className="number-font"
          style={{
            fontFamily: "'Arial', 'Tahoma', 'Verdana', sans-serif",
            letterSpacing: "1px",
            fontWeight: "600",
            color: "#ffd369", // highlight phone in goldish tone
          }}
        >
          {schoolData.institute_contact_number}
        </span>
      </p>
    </>
  )}
</footer>




  </div>
</div>











        </div>
      ) : (
        <div style={{display:"flex", justifyContent:"center",alignItems:"center"}}>Please Select Student..!</div>
      )}</div>
    </div>

                         
<div style={{ textAlign: 'center', marginBottom: '20px' }}>





  {showCopyOptions && (
    <div style={{ marginTop: '10px' }}>
      <button onClick={() => { setSelectedCopies(1); handlePrint(); }} style={btnStyle}>1 Copy</button>
      <button onClick={() => { setSelectedCopies(2); handlePrint(); }} style={btnStyle}>2 Copies</button>
      <button onClick={() => { setSelectedCopies(3); handlePrint(); }} style={btnStyle}>3 Copies</button>

      <input
        type="number"
        placeholder="Custom"
        min={1}
        onChange={(e) => setSelectedCopies(e.target.value)}
        style={{
          width: '80px',
          marginLeft: '10px',
          padding: '5px',
          fontSize: '16px',
        }}
      />
      <button
        onClick={handlePrint}
        style={{
          ...btnStyle,
          backgroundColor:'#5A7488',
           color: 'white',
        }}
      >
        Print Custom
      </button>
    </div>
  )}
</div>



          </div>
        </div>
      {/* </div> */}
    </>
  );
};

export default AppreciationCertificate;

const btnStyle = {
  margin: '5px',
  padding: '8px 12px',
  fontSize: '15px',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '2px solid #000',
  backgroundColor: '#ffffffff',
 
};

const certificateOptions = [
  'Transfer Certificate',
  'Course Completion',
  'Bonafide Certificate',
  'No Due Certificate',
  'Achievement Certificate',
];

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
