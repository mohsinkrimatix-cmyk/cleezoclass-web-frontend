import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faAngleRight , faTimes} from "@fortawesome/free-solid-svg-icons"; // Added faAngleRight
import './tabhower.css'
import axios from "axios";
import ReportCard from "../shared/OverallReport";
// <--- START: MODAL IMPORTS --->
import Store from "./Admin_Store.jsx";
import AdmissionStudentAdmin from "./Admin_AcademicStudent.jsx";
import QuestionPaperGenerate from "./Admin_AcademicStaff.jsx";
import TimetableAdmin from "./Admin_Timetable.jsx";
import ChatOperations from "./Admin_Events And Meetings.jsx";
import abcLogo from "../assets/abc school.png"; // adjust path if needed
import Header from "../shared/header.jsx";
// <--- END: MODAL IMPORTS --->
const ADMIN_API_BASE = "https://cleezoclass.com:4000/api/admin";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";
  const [assistantItems, setAssistantItems] = useState([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
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
  // <--- START: MODAL STATE & HANDLERS --->
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");

  const openModal = (link, title) => {
    // Logic to determine which component to load based on the link
    let ContentComponent = null;
    switch (link) {
      case "/Store":
        ContentComponent = Store;
        break;
      case "/AdmissionStudentAdmin":
        ContentComponent = AdmissionStudentAdmin;
        break;
     
      case "/Test":
        ContentComponent = QuestionPaperGenerate;
        break;
      case "/TimetableAdmin":
        ContentComponent = TimetableAdmin;
        break;
      case "/ChatOperations":
        ContentComponent = ChatOperations;
        break;
      default:
        // You can add a default case or handle other links by navigating
        if (link) {
          navigate(link);
          return;
        }
        return;
    }

    setModalTitle(title);
    setModalContent(() => ContentComponent); // Use function form for component state
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
    setModalTitle("");
  };
  // <--- END: MODAL STATE & HANDLERS --->

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

const outerContainer = {
  display: "flex",
  flexDirection: "column",

  minHeight: "100vh",
  minHeight: isMobile ? "100dvh" : "100vh",

  width: "100%",
  padding: "20px",
  boxSizing: "border-box",
  backgroundColor: "#6b7983ff",
};
  const container = {
    fontFamily: font,
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: isMobile ? "10px 5px" : "5px",
    boxSizing: "border-box",
    width: "100%",
    minWidth: "300px",
  };
  const header = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: "16px 16px 0 0",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
    padding: isMobile ? "15px" : "25px",
    marginBottom: isMobile ? "15px" : "25px",
    flexWrap: isMobile ? "wrap" : "nowrap",
    gap: isMobile ? "10px" : "0",

    /* IMPORTANT FOR STICKY HEADER */
    position: "sticky",
    top: 0,
    zIndex: 1000,
  };

  const logoBox = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    order: isMobile ? 1 : 0,
  };
const logo = {
  width: "60px",
  height: "60px",
  backgroundImage: `url(${abcLogo})`,
  backgroundSize: "contain",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
  borderRadius: "8px",
};
  const logoText = { fontSize: isMobile ? "16px" : "18px", fontWeight: "600" };
  const logoSub = { fontSize: isMobile ? "10px" : "12px", color: "#777" };
  const schoolTitle = {
    fontSize: isMobile ? "16px" : "20px",
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    flex: isMobile ? "1 1 100%" : 1,
    order: isMobile ? 3 : 0,
    marginTop: isMobile ? "10px" : "0",
  };
  const buttonGroup = {
    display: "flex",
    gap: "10px",
    order: isMobile ? 2 : 0,
  };
  const btn = {
    backgroundColor: "#6b7983ff",
    border: "none",
    borderRadius: "16px",
    padding: isMobile ? "6px 10px" : "8px 16px",
    cursor: "pointer",
    fontSize: isMobile ? "12px" : "14px",
    fontWeight: "500",
    fontFamily: font,
    color: "#fff",
  };

  // Grid Structure Styles
  const mainGrid = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    padding: "10px",
    gap: "20px",
  };

  const leftColumnContainer = {
    flex: isMobile ? "1 1 100%" : 6,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  const rightColumnContainer = {
    flex: isMobile ? "1 1 100%" : 4,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  };

  // Card Styles
  const card = {
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    padding: "20px",
    cursor: "pointer",
    height: "300px",
    display: "flex",
    flexDirection: "column",
    borderLeft: "8px solid #945f4aff",
    justifyContent: "flex-start",
    overflowY: "auto",
    scrollbarWidth: "thin", // for Firefox
    scrollbarColor: "rgba(0,0,0,0) transparent", // for Firefox
  };

  const sectionTitle = {
    fontSize: isMobile ? "18px" : "20px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "10px",
    textAlign: "left",
    padding: "0 10px",
    width: "100%",
    boxSizing: "border-box",
  };
  const listItem = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: isMobile ? "10px" : "15px",
    fontSize: isMobile ? "16px" : "16px",
    flexWrap: isMobile ? "wrap" : "nowrap",
  };

  const circle = (color) => ({
    width: isMobile ? "30px" : "50px",
    height: isMobile ? "30px" : "50px",
    minWidth: isMobile ? "30px" : "50px",
    borderRadius: "50%",
    backgroundColor: color,
    marginRight: "10px",
  });

  const progress = (c1, c2) => ({
    display: "flex",
    width: isMobile ? "60px" : "90px",
    height: "20px",
    borderRadius: "4px",
    overflow: "hidden",
    background: `linear-gradient(to right, ${c1} 60%, ${c2} 40%)`,
    marginLeft: isMobile ? "0" : "auto",
    marginTop: isMobile ? "10px" : "0",
  });

  const smallText = { fontSize: isMobile ? "12px" : "10px", color: "#666", textAlign: "left" };


  const itemContent = {
    display: "flex",
    alignItems: "flex-start",
    flexDirection: "column",
    textAlign: "left",
    flex: 1,
  };

  const descBox = {
    backgroundColor: "#f0f0f0",
    padding: "2px 6px",
    borderRadius: "4px",
    margin: "0 2px",
    fontSize: isMobile ? "12px" : "14px",
  };



  const EventItems = [
    {
      color: "#868C8F",
      title: "Live Chat",
      desc: "Assign Live Chat, Report, Abort Chat, Red Tag",
      link: "/ChatOperations",
    },
    {
      color: "#705B56",
      title: "Parent Meetings",
      desc: " Connect, Assign & Schedule, Agenda Report",
      link: "/ChatOperations",
    },
    {
      color: "#D4C7B0",
      title: " Calendar",
      desc: "Festive Greetings & Holiday Approvals",
      link: "/ChatOperations",
    },
  ];
  // MODIFIED ACTION ITEMS
  const ActionItems = [
    {
      color: "#868C8F",
      title: "Chat Approved",
      desc: "Session No: 1024",
      link: "",
      buttonType: "Schedule", // New property for button control
    },
    {
      color: "#705B56",
      title: " Festive/Holiday ",
      desc: "Reminder, Greeting",
      link: "",
      buttonType: "OK",
    },
    {
      color: "#868C8F",
      title: "Utilities",
      desc: "Provide Drinking Water",
      link: "",
      buttonType: "OK",
    },
    {
      color: "#705B56",
      title: "Staff Syllabus",
      desc: "Homework not assigned",
      link: "",
      buttonType: "OK",
    },
    {
      color: "#705B56",
      title: "Staff-Heads",
      desc: "Homework not assigned",
      link: "",
      buttonType: "OK",
    },
  ];

  useEffect(() => {
    const schoolCode = localStorage.getItem("schoolCode");
    if (!schoolCode) return;

    const fetchAdminAssistantData = async () => {
      setAssistantLoading(true);
      try {
        const current = new Date();
        const month = current.getMonth() + 1;
        const year = current.getFullYear();

        const [studentsRes, teachersRes, latecomersRes, leaveReqRes] = await Promise.allSettled([
          axios.get(`https://cleezoclass.com:4000/api/students/count`, { params: { schoolCode } }),
          axios.get(`https://cleezoclass.com:4000/api/teacher/count`, { params: { schoolCode } }),
          axios.get(`https://cleezoclass.com:4000/api/teacher-list-of-latecomers`, {
            params: { schoolCode, month, year },
          }),
          axios.get(`https://cleezoclass.com:4000/api/leave-requests/all`, { params: { schoolCode } }),
        ]);

        const studentsCount =
          studentsRes.status === "fulfilled"
            ? Number(studentsRes.value?.data?.totalStudents || studentsRes.value?.data?.count || 0)
            : 0;
        const teachersCount =
          teachersRes.status === "fulfilled"
            ? Number(teachersRes.value?.data?.totalTeachers || teachersRes.value?.data?.count || 0)
            : 0;
        const latecomersCount =
          latecomersRes.status === "fulfilled" && Array.isArray(latecomersRes.value?.data)
            ? latecomersRes.value.data.length
            : 0;
        const leaveRequestsCount =
          leaveReqRes.status === "fulfilled" && Array.isArray(leaveReqRes.value?.data)
            ? leaveReqRes.value.data.length
            : 0;

        const dynamicItems = [
          {
            color: "#868C8F",
            title: "Total Students",
            desc: `${studentsCount} students are active in dashboard records`,
            link: "/AdmissionStudentAdmin",
            buttonType: "OK",
          },
          {
            color: "#705B56",
            title: "Total Teachers",
            desc: `${teachersCount} teachers are active in dashboard records`,
            link: "/Test",
            buttonType: "OK",
          },
          {
            color: "#868C8F",
            title: "Latecomers Alert",
            desc: `${latecomersCount} teachers marked as late this period`,
            link: "/Test",
            buttonType: latecomersCount > 0 ? "Schedule" : "OK",
          },
          {
            color: "#705B56",
            title: "Leave Requests",
            desc: `${leaveRequestsCount} pending/recorded leave requests`,
            link: "/Test",
            buttonType: leaveRequestsCount > 0 ? "Schedule" : "OK",
          },
        ];

        setAssistantItems(dynamicItems);
      } catch (error) {
        console.error("Failed to fetch admin assistant data:", error);
        setAssistantItems([]);
      } finally {
        setAssistantLoading(false);
      }
    };

    fetchAdminAssistantData();
  }, []);

  const assistantPanelItems = assistantLoading
    ? [
        {
          color: "#868C8F",
          title: "Loading Assistance...",
          desc: "Preparing complete tab-by-tab guidance",
          link: "",
        },
      ]
    : [
        {
          color: "#868C8F",
          title: "Academics Tab Guidance",
          desc: "Use this tab to manage syllabus, exams, heads and student performance. Check pending exam tasks, syllabus tracking, and update discipline/performance records class-wise.",
          link: "/Test",
        },
        {
          color: "#705B56",
          title: "Events & Meetings Tab Guidance",
          desc: "Plan meetings, assign live chat sessions, publish event calendar updates, and track agenda completion. Review parent meeting status and unresolved discussion points.",
          link: "/ChatOperations",
        },
        {
          color: "#D4C7B0",
          title: "Timetable Tab Guidance",
          desc: "Generate timetable, assign substitutes, and schedule extra classes. Recheck class-teacher mapping and resolve timetable conflicts before publishing.",
          link: "/TimetableAdmin",
        },
        {
          color: "#868C8F",
          title: "Store Tab Guidance",
          desc: "Track and manage academic/store inventory like books, uniforms, IDs, and utility stock. Validate stock movement and raise replenishment requests early.",
          link: "/Store",
        },
        {
          color: "#705B56",
          title: "Student Search & Fee Insight Guidance",
          desc: "Use class-section/student search at top to view individual fee report quickly. Verify paid, due, installment deadlines and discount details before parent communication.",
          link: "/AdmissionStudentAdmin",
        },
        {
          color: "#868C8F",
          title: "Current Student Status",
          desc: `${assistantItems[0]?.desc || "Student count and activity summary available."} Use this to plan class operations and workload.`,
          link: "/AdmissionStudentAdmin",
        },
        {
          color: "#705B56",
          title: "Current Teacher Status",
          desc: `${assistantItems[1]?.desc || "Teacher count and activity summary available."} Use this to plan timetable and substitute assignments.`,
          link: "/Test",
        },
        {
          color: "#D4C7B0",
          title: "Alerts & Pending Requests",
          desc: `Latecomers: ${assistantItems[2]?.desc || "N/A"} | Leave: ${assistantItems[3]?.desc || "N/A"}. Review alerts daily and close pending approvals.`,
          link: "/Test",
        },
      ];

  const EventItem = [
    {
      color: "#D4C7B0",
      title: " Timetable",
      desc: "Generate, Modify, Regenerate",
      link: "/TimetableAdmin",
    },
    {
      color: "#868C8F",
      title: "Extra Classes ",
      desc: "Staff Assigned, Add, Delete, Special Classes",
      link: "/TimetableAdmin",
      buttonType: "OK",
    },
    {
      color: "#705B56",
      title: " Substitute",
      desc: "Ideal Staff, Ideal Class, Substitute Teacher Available",
      link: "/TimetableAdmin",
      buttonType: "OK",
    },
  ];

  const marketingItems = [

    
    {
      color: "#705B56",
      title: "Syllabus",
      desc: "  Syllabus Tracking, Assessments",
      link: "/Test",
    },{
      color: "#868C8F",
      title: "Examinations",
      desc: "Question Papers, In-charge, Invigilation, Report Cards, Certificates",
      link: "/Test",
    },
        {
      color: "#D4C7B0",
      title: "Heads",
      desc: "Coordinator, Special, Topper, Substitute Teacher",
      link: "/Test",
    },
  ];

  const marketingItem = [
    {
      color: "#D4C7B0",
      title: "Performance",
      desc: "Attendance, Behaviour, Physical Education, Academic Report",
      link: "/AdmissionStudentAdmin",
    },
    {
      color: "#705B56",
      title: "Extracurricular ",
      desc: "Physical Education & PTE",
      link: "/AdmissionStudentAdmin",
    },
    {
      color: "#868C8F",
      title: "Discipline",
      desc: "Attendance, Behaviour, Punctuality, Leave Letters",
      link: "/AdmissionStudentAdmin",
    },
  ];

  const hrItems = [
    {
      color: "#D9EEF8",
      title: "Academics",
      desc: "Books, Guides, Materials, Stationery",
      link: "/Store",
    },
    {
      color: "#868C8F",
      title: "Amenities",
      desc: "Uniforms, Apparel, IDs, Technical Items, Miscellaneous Items",
      link: "/Store",
    },
    {
      color: "#A39DBD",
      title: "Utilities",
      desc: "Water, Groceries",
      link: "/Store",
    },
  ];

  const renderCard = (title, items, homepageRoute, split = false, customCardStyle = {}) => {
    const renderDesc = (desc) => {
      if (Array.isArray(desc)) {
        return (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              height: "40px", // 🔥 FIXED HEIGHT
              overflow: "hidden", // optional: hide extra items
              alignItems: "center", // optional: vertically center content
              borderLeft:'8px solid red'
            }}
          >
            {desc.map((d, idx) => (
              <React.Fragment key={idx}>
                {d.staticText && <span>{d.staticText}</span>}
                {d.boxedText && <span style={descBox}>{d.boxedText}</span>}
                {d.text && <span style={d.isBox ? descBox : {}}>{d.text}</span>}
              </React.Fragment>
            ))}
          </div>
        );
      } else {
        return desc;
      }
    };

    // Custom button style for OK/Schedule
    const actionBtn = (type) => ({
      backgroundColor: type === "OK" ? "#92D09B" : "#B97FA5", // OK is green, Schedule is purple
      border: "none",
      borderRadius: "8px",
      padding: "4px 8px",
      cursor: "pointer",
      fontSize: isMobile ? "10px" : "12px", // Decreased font size
      fontWeight: "500",
      fontFamily: font,
      color: "#fff",
      marginLeft: isMobile ? "0" : "auto",
      marginTop: isMobile ? "10px" : "0",
    });

    // Custom arrow icon style
    const arrowIconStyle = {
      fontSize: isMobile ? "16px" : "20px",
      color: "#945f4aff",
      marginRight: "10px",
      minWidth: isMobile ? "16px" : "20px",
      marginTop: "4px", // Align better with text
    };

    const renderItemContent = (i) => (
      <div
        style={listItem}
        key={i.title}
        // <--- MODIFIED: CALL openModal instead of navigate(i.link) --->
        onClick={() => openModal(i.link, i.title)} 
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            flex: 1,
            height: "70px",
          }}
        >
          {items === ActionItems ? (
            <FontAwesomeIcon icon={faAngleRight} style={arrowIconStyle} />
          ) : (
            <div style={circle(i.color)}></div>
          )}

          <div className="title-hover" style={itemContent}>
            <div
              style={{
                fontWeight: "500",
                cursor: "pointer",
                fontSize: isMobile ? "14px" : "14px",
              }}
            >
              {i.title}
            </div>

            <div style={{ ...smallText, fontSize: isMobile ? "10px" : "12px" }}>
              {renderDesc(i.desc)}
            </div>
          </div>
        </div>

        {items === ActionItems && i.buttonType ? (
          <button
            style={actionBtn(i.buttonType)}
            onClick={(e) => {
              e.stopPropagation(); // <--- Prevent modal open when clicking button
              alert(`${i.buttonType} clicked for ${i.title}`);
            }}
          >
            {i.buttonType}
          </button>
        ) : (
          null
        )}
      </div>
    );

    if (split) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            height: "300px",
            overflowY: "hidden",
          }}
        >
          {items.map(renderItemContent)}
        </div>
      );
    } else {
      return (
        <div
          style={{ ...card, ...customCardStyle }}
          onClick={() => {
            // <--- MODIFIED: openModal for card navigation if homepageRoute is a modal link --->
            if (homepageRoute) {
              openModal(homepageRoute, title); 
            }
          }}
        >
          {items.map(renderItemContent)}
        </div>
      );
    }
  };

  const handleLogout = () => {
    navigate("/");
  };
const isLaptop = window.innerWidth > 600 && window.innerWidth <= 1440;
const isLargeMonitor = window.innerWidth > 1440;
  // <--- START: MODAL STYLES & RENDER FUNCTION --->
  const modalOverlayStyle = {
        position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000, // Above everything
  };

  const modalContentStyle = {
   backgroundColor: 'white',
    padding: '20px',
    borderRadius: '16px',
     width: isMobile ? "95%" : isLaptop ? "90%" : "95%",  
  maxWidth: "1200px",
  height: isMobile ? "50vh" : isLaptop ? "85vh" : "54vh",
    overflowY: 'auto',
    position: 'relative',
    fontFamily: "'Century Gothic', 'AppleGothic', sans-serif",
      scrollbarWidth: 'thin', // for Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // for Firefox
  
  };

  const renderModal = () => {
    if (!modalOpen || !modalContent) return null;

    const Content = modalContent;

    return (
      <div className="globalpopup-overlay" onClick={closeModal}>
       <div className="globalpopup-content" onClick={(e) => e.stopPropagation()}>
         
          <button
            onClick={closeModal}
            className="globalpopup-close-btn"
          >
                         <FontAwesomeIcon icon={faTimes} />
           
          </button>
          <div style={{ flex: 1 }}>
            <Content /> 
          </div>
        </div>
      </div>
    );
  };
  // <--- END: MODAL STYLES & RENDER FUNCTION --->
  const [selectedClassSection, setSelectedClassSection] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classSectionOptions, setClassSectionOptions] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [feeDetails, setFeeDetails] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const schoolCode = localStorage.getItem("schoolCode");

  const dropdownRef = useRef(null);
  useEffect(() => {
  function handleClickOutside(event) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const fetchMetadata = useCallback(async () => {
    if (!schoolCode) return;
    setDropdownLoading(true);
    try {
      const [classRes, sectionRes] = await Promise.all([
        axios.get(`${ADMIN_API_BASE}/classes`, { params: { schoolCode } }),
        axios.get(`${ADMIN_API_BASE}/sectionFilter`, { params: { schoolCode } }),
      ]);

      const classes = Array.isArray(classRes.data) ? classRes.data : [];
      const sections = Array.isArray(sectionRes.data) ? sectionRes.data : [];

      const classSet = new Set(classes.map((c) => c?.class_name ?? c).filter(Boolean).map(String));
      const optionsFromSections = sections
        .map((s) => {
          const cls = String(s?.class_name ?? "").trim();
          const sec = String(s?.section ?? "").trim();
          if (!cls || !sec) return null;
          return `${cls}-${sec}`;
        })
        .filter(Boolean);

      const options =
        optionsFromSections.length > 0
          ? [...new Set(optionsFromSections)]
          : [...classSet].map((cls) => `${cls}-A`);

      options.sort((a, b) => {
        const [classA, secA] = a.split("-");
        const [classB, secB] = b.split("-");
        const numA = parseInt(classA, 10);
        const numB = parseInt(classB, 10);

        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA !== numB) return numA - numB;
        } else if (!isNaN(numA)) {
          return 1;
        } else if (!isNaN(numB)) {
          return -1;
        } else {
          const classCompare = classA.localeCompare(classB);
          if (classCompare !== 0) return classCompare;
        }

        return String(secA || "").localeCompare(String(secB || ""));
      });

      setClassSectionOptions(options);
    } catch (error) {
      console.error("Failed to load class-section options:", error);
      setClassSectionOptions([]);
    } finally {
      setDropdownLoading(false);
    }
  }, [schoolCode]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  // Fetch students of selected class
  useEffect(() => {
    if (!selectedClassSection) {
      setStudents([]);
      setSelectedStudent(null);
      return;
    }

    setFeeDetails(null);

    const [cls, sec] = selectedClassSection.split("-");
    setLoading(true);

    axios
      .get(
        `https://cleezoclass.com:4000/api/studentsName/${cls}?schoolCode=${schoolCode}&section=${sec}`
      )
      .then((res) => setStudents(res.data.students || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedClassSection]);

  // Global search API
  useEffect(() => {
    if (!searchName) {
      setFilteredStudents([]);
      return;
    }

    setLoading(true);
    axios
      .get(
        `https://cleezoclass.com:4000/api/studentsByName?schoolCode=${schoolCode}&name=${searchName}`
      )
      .then((res) => setFilteredStudents(res.data.students || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [searchName]);

  // Select student + load fee info
 const handleStudentSelect = async (student) => {
  setSelectedStudent(student);
  setShowPopup(false);

  let currentClassSection = selectedClassSection;

  if (!currentClassSection) {
    currentClassSection = `${student.class_name}-${student.section}`;
    setSelectedClassSection(currentClassSection);
  }

  const [cls, sec] = currentClassSection.split("-");

  try {
    const schoolCode = localStorage.getItem("schoolCode");

    const classFeesPromise = axios.get(
      `https://cleezoclass.com:4000/api/feeDetailsByClassSection`,
      { params: { className: cls, section: sec, schoolCode } }
    );

    const studentFeesPromise = axios.post(
      `https://cleezoclass.com:4000/api/studentFees`,
      { studentId: student.id, schoolCode }
    );

    const [classRes, studentRes] = await Promise.allSettled([classFeesPromise, studentFeesPromise]);

    // Default fee object with zeros
    const defaultFees = {
      CompleteFee: 0,
      Admission_paid: 0,
      Paid_Amount: 0,
      books_paid: 0,
      uniform_paid: 0,
      bus_paid: 0,
      exam_paid: 0,
      others_paid: 0,
      Discount: 0,
      Installment1_Amount: 0,
      Installment1_Paid: 0,
      Installment1_Deadline_Date: "",
      Installment2_Amount: 0,
      Installment2_Paid: 0,
      Installment2_Deadline_Date: "",
      Installment3_Amount: 0,
      Installment3_Paid: 0,
      Installment3_Deadline_Date: "",
      Installment4_Amount: 0,
      Installment4_Paid: 0,
      Installment4_Deadline_Date: "",
      Installment5_Amount: 0,
      Installment5_Paid: 0,
      Installment5_Deadline_Date: "",
    };

    const classFeeData =
      classRes.status === "fulfilled" ? classRes.value.data.feeDetail || {} : {};
    const studentFeeData =
      studentRes.status === "fulfilled" ? studentRes.value.data.feeDetails || {} : {};

    const mergedFees = {
      ...defaultFees,           // start with zeros
      ...studentFeeData,         // overwrite with actual student-paid data if exists
      CompleteFee: classFeeData.CompleteFee || 0,
      Installment1_Deadline_Date: classFeeData.Installment1_Deadline_Date || "",
      Installment2_Deadline_Date: classFeeData.Installment2_Deadline_Date || "",
      Installment3_Deadline_Date: classFeeData.Installment3_Deadline_Date || "",
      Installment4_Deadline_Date: classFeeData.Installment4_Deadline_Date || "",
      Installment5_Deadline_Date: classFeeData.Installment5_Deadline_Date || "",
    };

    setFeeDetails(mergedFees);
    setShowPopup(true);
    setShowDropdown(false);
    setSearchName("");

  } catch (err) {
    console.error("Error fetching fee details:", err);
    // fallback: still show popup with zeros
    setFeeDetails({
      ...defaultFees,
      CompleteFee: 0,
    });
    setShowPopup(true);
  }
};
  const name=localStorage.getItem('name')


  return (
    <div style={outerContainer}>
      {/* RENDER THE MODAL AT THE TOP LEVEL */}
      {renderModal()}
<div className={(showPopup || modalOpen) ? "blur-background-active" : ""}>

      <div style={container}>
<Header />
  <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: isMobile ? "18px" : "22px",
    fontWeight: "600",
    marginTop:'10px'
,    padding: isMobile ? "0 10px" : "0",
  }}
>
            <div className="section-header">
                        {name ? `Welcome ${name}..!` : "Welcome Chief!"}
                    </div>
  {/* Icons side by side */}
  <div style={{ display: "flex", gap: "15px", cursor: "pointer" }}>
      
   <div style={{ display: "flex", gap: "10px", marginBottom: "0" }}>

      <div className="expense-input-field">
        <button
      className="btn-dropdown-FeesManagement"
      style={{ padding: "6px 12px", cursor: "pointer",marginTop:'-1px' }}
  onClick={() => navigate("/ReportCardPage")}
    >
Report Card    </button>


</div> 
 <div className="expense-input-field">
    {/* CLASS - SECTION DROPDOWN */}
    <select
      value={selectedClassSection}
      onChange={(e) => {
        setSelectedClassSection(e.target.value);
        setShowDropdown(true); // auto-open student dropdown
        setSearchName("");     // clear previous search
      }}
      className="btn-dropdown-FeesManagement"
      disabled={dropdownLoading}
    >
      <option value=""> Class & Section</option>
      {dropdownLoading && <option value="" disabled>Loading...</option>}
      {classSectionOptions.map((opt) => {
        const [cls, sec] = opt.split("-");
        return (
          <option key={opt} value={opt}>
            {`Class ${cls} | Section ${sec}`}
          </option>
        );
      })}
    </select></div>

    {/* STUDENT SEARCHABLE DROPDOWN */}
    <div style={{ flex: 1, position: "relative" }}>
       <div className="expense-input-field">

      <input
            style={{ padding: "12px"}}

        className="btn-dropdown-FeesManagement"
        type="text"
        placeholder="Search or select student"
        value={searchName || (selectedStudent ? selectedStudent.name : "")}
        onChange={(e) => {
          setSearchName(e.target.value);
          setSelectedStudent(null);
        }}
        onFocus={() => setShowDropdown(true)}
      />
</div>
      {/* DROPDOWN LIST */}
      {showDropdown && (
        <ul
          ref={dropdownRef}
          style={{
            position: "absolute",
            width: "100%",
            background: "#fff",
            border: "1px solid #ccc",
            maxHeight: "520px",
            overflowY: "auto",
            padding: 0,
            margin: 0,
            listStyle: "none",
            zIndex: 1000,
            fontSize: "10px",
            textAlign: "left",
            justifyContent: "flex-start",
          }}
        >
          {!searchName &&
            students.map((s) => (
              <li
                key={s.id}
                style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                onClick={() => handleStudentSelect(s)}
              >
                {s.name}
              </li>
            ))}
          {searchName &&
            filteredStudents.map((s) => (
              <li
                key={s.id}
                style={{ padding: "8px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                onClick={() => handleStudentSelect(s)}
              >
                {s.name} ({s.class_name}-{s.section})
              </li>
            ))}
        </ul>
      )}
    </div>

    {/* BUTTON TO NAVIGATE */}

  </div>

    <div style={{ position: "relative" }}>
      <FontAwesomeIcon icon={faBell} style={{ fontSize: "24px", color: "#555" }} />
      <span
        style={{
          position: "absolute",
          top: "-4px",
          right: "-4px",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          border: "1px solid white",
        }}
      ></span>
    </div>
  </div>
</div>

        {/* Main Grid */}
        <div style={mainGrid}>
          {/* Left Column */}
        <div style={leftColumnContainer}>
  {/* First Row: Academics & Assistant */}
  <div
    style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "20px",
      marginBottom: "20px",
    }}
  >
    {/* Academics */}
    <div style={{ flex: 2}}>
      <div className="title-heading">Academics</div>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          borderLeft: "8px solid #738368ff",
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          padding: "20px",
          height: "300px",
          justifyContent: "space-between",
          alignItems: "stretch",
        }}
      >
        {/* Left Column */}
        <div
          style={{
            flex: 1,
            paddingRight: isMobile ? "0" : "10px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0) transparent",
          }}
        >
          {renderCard("Marketing", marketingItems, "/Test", true)}
        </div>

        {/* Divider (desktop only) */}
        {!isMobile && <div style={{ width: "2px", backgroundColor: "black", margin: "0 10px" }} />}

        {/* Right Column */}
        <div
          style={{
            flex: 1,
            paddingLeft: isMobile ? "0" : "10px",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0) transparent",
          }}
        >
          {renderCard("Marketing", marketingItem, "/AdmissionStudentAdmin", true)}
        </div>
      </div>
    </div>

    {/* Assistant */}
    <div style={{ flex: 1 }}>
      <div className="title-heading">Assistant</div>
      <div
        style={{
        
          height: "300px",
          borderRadius:'16px'
        }}
      >
        {renderCard("Assistant", assistantPanelItems, "", false, { height: "100%" })}
      </div>
    </div>
  </div>

  {/* Second Row: Events,  Timetable & Store */}
  <div
    style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: "20px",
    }}
  >
    {/* Events And Meetings */}
    <div style={{ flex: 1 }}>
      <div className="title-heading">Events & Meetings</div>
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          borderLeft: "8px solid #738368ff",
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          padding: "20px",
          height: "300px",
          justifyContent: "space-between",
          alignItems: "stretch",
          cursor: "pointer",
          transition: "0.2s",
        }}
      >
        <div
          style={{
            flex: 1,
            paddingRight: isMobile ? "0" : "10px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,0,0,0) transparent",
          }}
        >
          {renderCard("Events And Meetings", EventItems, "/ChatOperations", true)}
        </div>
        {!isMobile && <div style={{ width: "2px", margin: "0 10px" }} />}
      </div>
    </div>

    {/*  Timetable */}
    <div style={{ flex: 1 }}>
      <div className="title-heading"> Timetable</div>
      <div>
        {renderCard(" Timetable", EventItem, "/TimetableAdmin", false, {
          borderLeft: "8px solid #738368ff",
          height: "300px",
        })}
      </div>
    </div>

    {/* Store */}
    <div style={{ flex: 1 }}>
      <div className="title-heading">Store</div>
      <div>
        {renderCard("Store", hrItems, "/Store", false, { height: "300px" })}
      </div>
    </div>
  </div>
</div>


          {/* Right Column */}
        
       
        </div>
      </div>
    </div>
       {showPopup && selectedStudent && feeDetails && (
<div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
    onClick={() => setShowPopup(false)}
  >
    <div
      style={{
          background: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "45vw",  // 45% of the viewport width
    height: "100vh", // Full viewport height
    overflowX: "auto",
    overflowY: "auto",
    maxWidth:'900px',
  minWidth:'900px'

      }}
      onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
    >
  {/* Close button at top-right */}
  <button
    onClick={() => setShowPopup(false)}
    className="actionBtnStyle"
    style={{
      position: "absolute",
      top: "0",
      right: "0",
      padding: "8px 12px",
      border: "none",
      color: "#f44336",
      borderRadius: "4px",
      cursor: "pointer",
      backgroundColor:'transparent'
    }}
  >
    <i className="fa fa-times" style={{ marginRight: 6 }}></i>
  </button>

  {/* RENDER ReportCard component, passing dynamic data */}
  <ReportCard 
    studentData={selectedStudent} 
    feeData={feeDetails} 
  />
</div>

  </div>
)}

    
    </div>
  );
};

export default AdminDashboard;