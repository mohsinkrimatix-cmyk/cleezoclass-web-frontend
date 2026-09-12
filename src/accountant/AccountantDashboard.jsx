import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faAngleRight, faTimes, faSearch } from "@fortawesome/free-solid-svg-icons"; // Added faTimes for modal close button
import './tabhower.css'
import axios from "axios";
import ReportCard from "../shared/OverallReport";
import abcLogo from "../assets/abc school.png"; // adjust path if needed

import StudentList from "../shared/StudentsList.jsx"; // Your student list component
import './PopupStyles.css'
// 1. IMPORT REQUIRED COMPONENTS FOR MODAL
import AccountantIncome from "./Accountant_FeesManagement_Income.jsx";
import ExpensesDashboardInline from "./Accountant_ExpenseManagement_Expense.jsx";
import AccountantParties from "./Accountant_Parties.jsx";
import Header from "../shared/header.jsx";
const ADMIN_API_BASE = "https://cleezoclass.com:4000/api/admin";

const AccountantDashboard = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  // 2. STATE FOR MODAL CONTROL
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null); // Will hold the component to render
  const [modalTitle, setModalTitle] = useState(""); // Title for the modal
  const [assistanceItems, setAssistanceItems] = useState([]);
  const [assistanceLoading, setAssistanceLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3. MODAL HANDLER FUNCTIONS
  const openModal = (componentName, title) => {
    switch (componentName) {
      case "AccountantIncome":
        setModalContent(<AccountantIncome />);
        break;
      case "ExpensesDashboardInline": // Using the import name
        setModalContent(<ExpensesDashboardInline />);
        break;
      case "AccountantParties":
        setModalContent(<AccountantParties />);
        break;
      default:
        setModalContent(null);
    }
    setModalTitle(title);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setModalTitle("");
  };
// ==================================


const isLaptop = window.innerWidth > 600 && window.innerWidth <= 1440;
const isLargeMonitor = window.innerWidth > 1440;
  // 4. BASIC MODAL COMPONENT (Defined here for simplicity, typically in its own file)
  const Modal = ({ isOpen, title, onClose, children }) => {
    if (!isOpen) return null;

    const modalOverlayStyle = {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
    };

    const modalContentStyle = {
      backgroundColor: "#fff",
  borderRadius: "16px",
  width: isMobile ? "95%" : isLaptop ? "98%" : "90%",  
  maxWidth: "1200px",
  height: isMobile ? "50vh" : isLaptop ? "80vh" : "50vh",
  position: "relative",
  overflow: 'auto',
  scrollbarWidth: 'thin',               // Firefox
  scrollbarColor: 'rgba(0,0,0,0) transparent', // Firefox
                boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",

    };

    const modalHeaderStyle = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "5px",
    };

   const closeButtonStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  color: "#b61818ff",
  marginLeft: "98%",
  marginTop: "0.1%",
};

    return (
      <div className="globalpopup-overlay" onClick={onClose}>
        <div className="globalpopup-content" onClick={e => e.stopPropagation()}>
          <div className="globalpopup-header">
            <button onClick={onClose} className="globalpopup-close-btn">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };
  // END MODAL COMPONENT

  // Responsive Styles (Rest of the styles remain the same)
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
    marginBottom: isMobile ? "15px" : "15px",
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
  const grid = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    padding: "10px",
    gap: isMobile ? "20px" : "20px",
  };
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
    overflowY: "hidden",
  };
  const sectionTitle = {
    fontSize: isMobile ? "18px" : "20px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "10px",
    textAlign: isMobile ? "left" : "center",
    padding: isMobile ? "0 10px" : "0",
  };
  const listItem = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: isMobile ? "10px" : "15px",
    fontSize: isMobile ? "16px" : "22px",
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
  const smallText = {
    fontSize: isMobile ? "12px" : "15px",
    color: "#666",
    textAlign: "left",
    marginBottom: "4px",
  };
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
      title: "Recruitments-shortlisted",
      desc: "add, delete, exit,edit",
      link: "/BiometricTeacher",
    },
    {
      color: "#705B56",
      title: "Payroll management",
      desc: "create, delete,edit, salaries, certificates",
      link: "/BiometricTeacher",
    },
     {
      color: "#D4C7B0",
      title: "Tracking",
      desc: "Report,unpunctuals,compleint managemnet",
      link: "/BiometricTeacher",
    }
  ];
  // MODIFIED ACTION ITEMS
  const ActionItems = [

    {
      color: "#868C8F",
      title: "Chat Approved",
      desc: "Session No. 1024",
      link: "",
      buttonType: "Schedule" // New property for button control
    },
    {
      color: "#705B56",
      title: "Festive/Holiday",
      desc: "Remainder, Dreeting",
      link: "",
      buttonType: "OK"
    },
       {
      color: "#868C8F",
      title: "Utilities",
      desc: "Provide Drinking Water",
      link: "",
      buttonType: "OK"
    },
    {
      color: "#705B56",
      title: "Staff Syllabus",
      desc: "Homework Not Assigned",
      link: "",
      buttonType: "OK"
    },
    {
      color: "#705B56",
      title: "Staff-Heads",
      desc: "Homework Not Assigned",
      link: "",
      buttonType: "OK"
    },
  ];

  const EventItem = [
    {
      color: "#D4C7B0",
      title: "Exit-management",
      desc: "Delete biometrics,settlement noc, releiving formality",
      link: "/TimetableAdmin",
    }, {
      color: "#868C8F",
      title: "Recruitment profiles",
      desc: "shortlisted list,Rounds of interviews, joining form",
      link: "/TimetableAdmin",
      buttonType: "OK"
    },
    {
      color: "#705B56",
      title: "Interyie  schedule",
      desc: "post jobs, roles,& responsiblilities, schedules",
      link: "/TimetableAdmin",
      buttonType: "OK"
    },

  ];

  // UPDATED LINK: "/ExpensesDashboardInline" -> "ExpensesDashboardInline" (for modal component name)
  const accountItems = [
    {
      color: "#D4C7B0",
      title: "Expense Management",
      desc: "Analysis Limit Set, Track Expenses, Add Items Expense",
      link: "ExpensesDashboardInline", // Component Name
      displayName: "Expense Management", // Display Name for Modal
    },
    {
      color: "#868C8F",
      title: "Item Manager",
      desc: "List, Add, Delete, Edit",
      link: "ExpensesDashboardInline",
      displayName: "Item Manager",
    },
     {
      color: "#868C8F",
      title: "Miscellaneous",
      desc: "List, Round Offs, Depreciation",
      link: "ExpensesDashboardInline",
      displayName: "Miscellaneous Expenses",
    },
  ];

  // UPDATED LINK: "/ExpensesDashboardInline" -> "ExpensesDashboardInline"
  const accountItem = [
    {
      color: "#D4C7B0",
      title: "Salary Management",
      desc: "New Salary, Bonus, Increments, Deductions",
      link: "ExpensesDashboardInline",
      displayName: "Salary Management",
    },
      {
      color: "#705B56",
      title: "Records ",
      desc: "Previous Year Expenses, Salaries, Other Expenses",
      link: "ExpensesDashboardInline",
      displayName: "Expense Records",
    },
    {
      color: "#868C8F",
      title: "Complaints-Raised",
      desc: "Complaint On Deductions, Late Commers",
      link: "ExpensesDashboardInline",
      displayName: "Complaints Raised",
    },

  ];

  // UPDATED LINK: "/AccountantIncome" -> "AccountantIncome"
  const marketingItems = [
    {
      color: "#D4C7B0",
      title: "Fees Management",
      desc: "Analysis, Terms, Dues, Collections,Add Fee Type",
      link: "AccountantIncome",
      displayName: "Fees Management",
    },
    {
      color: "#868C8F",
      title: "Discounts",
      desc: "List,Add, Delete,Edit",
      link: "AccountantIncome",
      displayName: "Discounts Management",
    },
     {
      color: "#868C8F",
      title: "Other Incomes",
      desc: "List, Add, Delete, Edit, Assets, Depreciation",
      link: "AccountantIncome",
      displayName: "Other Incomes",
    },
  ];

  // UPDATED LINK: "/AccountantIncome" -> "AccountantIncome"
  const marketingItem = [
    {
      color: "#D4C7B0",
      title: "Reports/Complaints",
      desc: "Report S.A actions, Considerations NOCs",
      link: "AccountantIncome",
      displayName: "Income Reports/Complaints",
    },
      {
      color: "#705B56",
      title: "Records ",
      desc: "Previous Year Fee Records, Previous Year Other Incomes",
      link: "AccountantIncome",
      displayName: "Income Records",
    },
    {
      color: "#868C8F",
      title: "Remainder Cutoff",
      desc: "Cutoff List, Cutoff Duration, Services",
      link: "AccountantIncome",
      displayName: "Remainders-Cutoff",
    },

  ];

  // UPDATED LINK: "/EventAndMeetings" -> "AccountantParties"
  const hrItems = [
    {
      color: "#D9EEF8",
      title: "Parties-Income",
      desc: "List, Add, Delete, Edit",
      link: "AccountantParties",
      displayName: "Parties Income",
    },
    {
      color: "#868C8F",
      title: "New branch",
      desc: "Add Incomes, Add Expenses, Add Other Incomes",
      link: "AccountantParties",
      displayName: "New Branch Management",
    },
    {
      color: "#A39DBD",
      title: "Reports/Complaints",
      desc: "Request to Re-Load, Report ",
      link: "AccountantParties",
      displayName: "Parties Reports/Complaints",
    },
  ];

  // 5. MODIFIED renderCard FUNCTION
  const renderCard = (title, items, homepageRoute, split = false, customCardStyle = {}) => {
    const renderDesc = (desc) => {
      if (Array.isArray(desc)) {
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
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
    }

    const handleItemClick = (i) => {
        if (!i.link) {
            return;
        }
        // Check if the link should trigger a modal (based on the component names provided)
        const modalComponents = ["AccountantIncome", "ExpensesDashboardInline", "AccountantParties"];

        if (modalComponents.includes(i.link)) {
            // Use i.displayName if available, otherwise fallback to i.title
            openModal(i.link, i.displayName || i.title);
        } else {
            // For other links (like the action items or others), use standard navigation
            navigate(i.link);
        }
    };

    const renderItemContent = (i) => (
      // 5b. UPDATED onClick HANDLER
      <div
        style={listItem}
        key={i.id || i.title}
        onClick={() => handleItemClick(i)}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1, height: "70px" }}>
          {items === ActionItems ? (
            <FontAwesomeIcon icon={faAngleRight} style={arrowIconStyle} />
          ) : (
            <div style={circle(i.color)}></div>
          )}

          <div className="title-hover" style={itemContent}>
            <div
              style={{ fontWeight: "500", cursor: "pointer", fontSize: isMobile ? "14px" : "18px" }}
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
              e.stopPropagation();     // <--- Prevent navigation when clicking button
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
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", height: "300px", overflowY: "hidden" }}>
          {items.map(renderItemContent)}
        </div>
      );
    } else {
      // 5c. REMOVED onClick from the parent card for split=false cards (assuming you only want item-level clicks)
      // If you want the whole card to open a modal, change it to:
      // onClick={() => openModal(homepageRoute, title)}
      return (
        <div style={{ ...card, ...customCardStyle }}>
          {items.map(renderItemContent)}
        </div>
      );
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  };
   const [showStudentList, setShowStudentList] = useState(false);

  const handleIconClick = () => {
    setShowStudentList(true);
  };

  const closePopup = () => {
    setShowStudentList(false);
  };



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

    useEffect(() => {
      if (!schoolCode) return;

      const fetchAssistanceEntries = async () => {
        setAssistanceLoading(true);
        try {
          const { data } = await axios.get(
            `https://cleezoclass.com:4000/api/assistanceentries`,
            { params: { schoolCode } }
          );
          const entries = Array.isArray(data?.entries) ? data.entries : [];
          setAssistanceItems(entries);
        } catch (error) {
          console.error("Failed to fetch assistance entries:", error);
          setAssistanceItems([]);
        } finally {
          setAssistanceLoading(false);
        }
      };

      fetchAssistanceEntries();
    }, [schoolCode]);

    const dynamicAssistantItems = assistanceItems.map((entry, index) => {
      const entryId = entry.id ?? `${entry.name}-${index}`;
      const lowerName = String(entry.name || "").toLowerCase();

      let link = "AccountantIncome";
      if (
        String(entryId).startsWith("category-") ||
        lowerName.includes("expense") ||
        lowerName.includes("spend")
      ) {
        link = "ExpensesDashboardInline";
      }

      return {
        id: entryId,
        color: ["#868C8F", "#705B56", "#D4C7B0"][index % 3],
        title: entry.name || "Untitled",
        desc: `${entry.customType || `Type: ${entry.type || "N/A"}`} | Amount: ₹${Number(entry.amount || 0).toLocaleString("en-IN")}`,
        link,
        displayName: entry.name || "Assistance Details",
      };
    });

    const assistantPanelItems = assistanceLoading
      ? [{ color: "#868C8F", title: "Loading Assistance...", desc: "Preparing complete dashboard guidance", link: "" }]
      : [
          {
            id: "guide-income",
            color: "#868C8F",
            title: "Income Tab Guidance",
            desc: "Manage fee collections, discounts, dues, and other incomes. Verify paid vs due, update fee records, and resolve cutoff/remainder tasks daily.",
            link: "AccountantIncome",
            displayName: "Income Guidance",
          },
          {
            id: "guide-expense",
            color: "#705B56",
            title: "Expenses Tab Guidance",
            desc: "Track expenses, salary payouts, records, and complaints. Review high-spend categories and keep all supporting vouchers/bills validated.",
            link: "ExpensesDashboardInline",
            displayName: "Expenses Guidance",
          },
          {
            id: "guide-parties",
            color: "#D4C7B0",
            title: "Parties Tab Guidance",
            desc: "Handle parties-income entries, branch-wise transactions, and reports. Confirm every add/edit/delete action is reflected in ledger snapshots.",
            link: "AccountantParties",
            displayName: "Parties Guidance",
          },
          {
            id: "guide-student-fee",
            color: "#868C8F",
            title: "Student Fee Check",
            desc: "Use class-section and student search at top to inspect complete fee profile, installments, paid amounts, and pending balances before follow-up.",
            link: "/StudentManagement",
            displayName: "Student Fee Check",
          },
          {
            id: "guide-assistance-status",
            color: "#705B56",
            title: "Financial Assistance Alerts",
            desc: dynamicAssistantItems.length > 0
              ? `${dynamicAssistantItems.length} active assistance insights available from finance summary.`
              : "No dynamic finance alerts found right now. Continue daily reconciliation checks.",
            link: "AccountantIncome",
            displayName: "Finance Alerts",
          },
        ];
  
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
  
    const isAnyOverlayActive = isModalOpen || showPopup || showStudentList;

  
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
    const dashboardWrapper = {
    padding: isMobile ? "10px" : "20px",
  };
const name=localStorage.getItem('name')

  return (
    <div style={outerContainer}>
        <Modal
            isOpen={isModalOpen}
            title={modalTitle}
            onClose={closeModal}
        >
            {modalContent}
        </Modal>
           {showPopup && selectedStudent && feeDetails && (
<div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
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
  minWidth:'900px',
 boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",
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
{showStudentList && (
  <div
    onClick={closePopup}   // ← CLOSE WHEN CLICK OUTSIDE
    style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "8px",
        width: "40vw",
        maxHeight: "80vh",
        overflowY: "auto",
        position: "relative",
                        boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",

      }}
      onClick={(e) => e.stopPropagation()}   // ← DON'T CLOSE WHEN CLICK INSIDE
    >
      {/* Close button */}
      <button
        onClick={closePopup}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "5px 10px",
          cursor: "pointer",
          color: 'red',
          border: 'none',
          backgroundColor: 'transparent',
        }}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>

      {/* Student List Component */}
      <StudentList />
    </div>
  </div>
)}
          <div 
        className={isAnyOverlayActive ? "blur-background-active" : ""} 
        style={dashboardWrapper}
      >
      <div style={container}>
 <Header/>

  <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: isMobile ? "18px" : "22px",
    fontWeight: "600",
    padding: isMobile ? "0 10px" : "0",
    marginTop:'10px'
  }}
>
   <div className="section-header">
                        {name ? `Welcome ${name}..!` : "Welcome Chief!"}
                    </div>
  {/* Icons side by side */}
   <div style={{ display: "flex", gap: "15px", cursor: "pointer" }}>
  {/* Class & Student */}
  <div style={{ display: "flex", gap: "10px", marginBottom: "0" }}>

      <div className="expense-input-field">
        <button
      className="btn-dropdown-FeesManagement"
      style={{ padding: "6px 12px", cursor: "pointer",marginTop:'-1px' }}
      onClick={() => navigate("/StudentManagement")}
    >
      Student Data
    </button>


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

  {/* Notification Icon */}
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

        <div style={grid}>
  <div style={{ flex: isMobile ? "1 1 100%" : 6 }}>
            <div className="title-heading">Incomes</div>
       <div
  style={{
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    borderLeft: "8px solid #738368ff",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    padding: "20px",
    height: "350px",
    justifyContent: "space-between",
    alignItems: "stretch",
  }}
>
  {/* Staff Section */}
<div style={{ flex: 1, paddingRight: isMobile ? "0" : "10px" }}>

  {/* Changed homepageRoute to "AccountantIncome" (component name) */}
  {renderCard("Marketing", marketingItems, "AccountantIncome", true)}
</div>



  {/* Divider */}
  {!isMobile && <div style={{ width: "2px", backgroundColor: "black", margin: "0 10px" }} />}

  {/* Students Section */}
<div style={{ flex: 1, paddingLeft: isMobile ? "0" : "10px" }}>

  {/* Changed homepageRoute to "AccountantIncome" (component name) */}
  {renderCard("Marketing", marketingItem, "AccountantIncome", true)}
</div>

</div>

          </div>


{/* ============================================================ */}

         <div style={{ flex: isMobile ? "1 1 100%" : 4 }}>
            <div className="title-heading">Assistant</div>
            <div>
              {/* This card is not affected as it uses internal navigation/alert */}
              {renderCard("Operations", assistantPanelItems, "", false, {
                height: "350px", // Increased height
                overflowY: "auto",
                 scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(0,0,0,0) transparent',
              })}
            </div>
          </div>
        </div>
        <div style={grid}>

   <div style={{ flex: isMobile ? "1 1 100%" : 6 }}>
            <div className="title-heading">Expenses</div>
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
  {/* Staff Section */}
<div style={{ flex: 1, paddingRight: isMobile ? "0" : "10px" }}>

  {/* Changed homepageRoute to "ExpensesDashboardInline" (component name) */}
  {renderCard("Marketing", accountItems, "ExpensesDashboardInline", true)}
</div>



  {/* Divider */}
  {!isMobile && <div style={{ width: "2px", backgroundColor: "black", margin: "0 10px" }} />}

  {/* Students Section */}
<div style={{ flex: 1, paddingLeft: isMobile ? "0" : "10px" }}>

  {/* Changed homepageRoute to "ExpensesDashboardInline" (component name) */}
  {renderCard("Marketing", accountItem, "ExpensesDashboardInline", true)}
</div>

</div>

          </div>

          <div style={{ flex: isMobile ? "1 1 100%" : 4, }}>
            <div className="title-heading">Parties</div>
            <div>
              {/* Changed homepageRoute to "AccountantParties" (component name) */}
              {renderCard("HR", hrItems, "AccountantParties", false)}
            </div>
          </div>
        </div>
      </div>
      </div>


    </div>
  );
};

export default AccountantDashboard;