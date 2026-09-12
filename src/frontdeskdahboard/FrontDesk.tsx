import React, { useState, useEffect, ReactNode, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import '../STYLES/tabhower.css';
import "./Dashboard.css";
import ErrorPopup from "../shared/ErrorPopup";


// 1. IMPORT REQUIRED COMPONENTS (Ensure these also have .tsx or index.d.ts files)
import AdmissionEnrollment from "./FrontDesk_Enrollment.tsx";
import LeadsProfilePage from "./FrontDesk_LeadsProfilePage.tsx";
import AdmissionCRM from "./FrontDesk_Admission.jsx";
import TestAndCouncelling from "./FrontDesk_TestAndCouncelling.jsx";
import Communication from './Frontdesk_Communication.jsx';
import abcLogo from "../assets/abc school.png";
import Header from "../shared/header.jsx";
import LeadsTable from "./FrontDesk_Track.tsx";
import AdmissionReportPopup from '../shared/AdmissionReportPopup.tsx'
// --- INTERFACES ---

interface DescriptionObject {
  staticText?: string;
  boxedText?: string;
  text?: string;
  isBox?: boolean;
}

interface DashboardItem {
  color: string;
  title: string;
  desc: string | DescriptionObject[];
  link: string;
  displayName?: string;
  buttonType?: "OK" | "Schedule";
}

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const FrontDeskDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const font = "'Century Gothic', 'AppleGothic', sans-serif";

  // 2. STATE FOR MODAL CONTROL
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3. MODAL HANDLER FUNCTIONS
  const openModal = (componentName: string, title: string) => {
    switch (componentName) {
      case "AdmissionCRM":
        setModalContent(<AdmissionCRM />);
        break;
      case "LeadsProfilePage":
        setModalContent(<LeadsProfilePage />);
        break;
      case "AdmissionEnrollment":
        setModalContent(<AdmissionEnrollment />);
        break;
      case "TestAndCouncelling":
        setModalContent(<TestAndCouncelling />);
        break;
      case "Communication":
        setModalContent(<Communication />);
        break;
           case "AdmissionReportPopup":
        setModalContent(<AdmissionReportPopup />);
        break;
         case "LeadsTable":
        setModalContent(<LeadsTable />);
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
const [popup, setPopup] = useState({
  message: "",
  type: "",
  key: 0,
});

  const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children }) => {
    if (!isOpen) return null;



    return (
      <div  className="modalOverlayStyle" onClick={onClose}>
        <div className="modalContentStyle" onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    );
  };

  
  // --- DATA ---
  const ActionItems: DashboardItem[] = [
    { color: "#868C8F", title: "Chat Approved", desc: "session no 1024", link: "", buttonType: "Schedule" },
    { color: "#705B56", title: "Festive/Holiday", desc: "Remainder, Greeting", link: "", buttonType: "OK" },
    { color: "#868C8F", title: "Utilities", desc: "Provide Drinking Water", link: "", buttonType: "OK" },
    { color: "#705B56", title: "Staff Syllabus", desc: "Homework Not Assigned", link: "", buttonType: "OK" },
    { color: "#705B56", title: "Staff-Heads", desc: "Homework Not Assigned", link: "", buttonType: "OK" },
  ];

  const hrItems: DashboardItem[] = [
    { color: "#D9EEF8", title: "Admission-Report", desc: "Manual, Automated...", link: "", displayName: "Parties Income" },
    { color: "#868C8F", title: "Lead Report", desc: "Lead Details...", link: "" },
    { color: "#A39DBD", title: "Communication History", desc: "Whatsapp history...", link: "" },
  ];
      const accountItem: DashboardItem[] = [
    {
      color: "#D4C7B0",
      title: "Lead Profile-Report",
      desc: "lead score, Lead Strength report, oneview lead profile",
      link: "",
      displayName: "Salary Management",
    },
      {
      color: "#705B56",
      title: "Followups-Report ",
      desc: "conversational calls, Re-Assign ticket, Re-marketing-assign",
      link: "",
      displayName: "Expense Records",
    },
     {
      color: "#705B56",
      title: "Templates crafting",
      desc: "Edit Images,Edit Templates, Create Templates",
      link: "",
      displayName: "Expense Records",
    },
  ];
  const accountItems : DashboardItem[] = [
    {
      color: "#D4C7B0",
      title: "Admission-report",
      desc: "Lead source allocation,ticket generation, view plan",
      link: "AdmissionReportPopup", // Component Name
      displayName: "Expense Management", // Display Name for Modal
    },
    {
      color: "#868C8F",
      title: "Test and Councelling-Report",
      desc: "Test Q.P. verify,Test Report,Counselor Assign & Report",
      link: "",
      displayName: "Item Manager",
    },
     {
      color: "#868C8F",
      title: "Communication-Report",
      desc: "Messaging & mails, follow ups, Image Generator, Re-Marketing opt",
      link: "",
      displayName: "Miscellaneous Expenses",
    },
  ];

    const marketingItem : DashboardItem[] = [
    {
      color: "#D4C7B0",
      title: "Lead Profile",
      desc: "Lead Score, Lead Strength, one view lead profile",
      link: "LeadsProfilePage",
      displayName: "Income Reports/Complaints",
    },
      {
      color: "#705B56",
      title: "Enrollments",
      desc: "Conversational, calls, Re-Assign to automated admission",
      link: "AdmissionEnrollment",
      displayName: "Income Records",
    },
    {
      color: "#868C8F",
      title: "Follow ups",
      desc: "FrontOffice,Councellors,sales,Executives,Field Force",
      link: "LeadsTable",
      displayName: "Remainders-Cutoff",
    },

  ];

  const marketingItems: DashboardItem[] = [
    {
      color: "#D4C7B0",
      title: "Admission",
      desc: "Register,Lead submission, Lead source location,Ticket Generation, Enroll forwarding",
      link: "AdmissionCRM",
      displayName: "Fees Management",
    },
    {
      color: "#868C8F",
      title: "Test and Councelling",
      desc: "Assign invigilator, Test Q.P, Test report, Counselor assign,Counseling Report",
      link: "TestAndCouncelling",
      displayName: "Discounts Management",
    },
     {
      color: "#868C8F",
      title: "Communications",
      desc: "Opt messaging, Mails, Followup, Image Generator,Re-marketing Opt",
      link: "Communication",
      displayName: "Other Incomes",
    },
  ];
  // 5. HELPER RENDER FUNCTIONS
const renderCard = (
  title: string,
  items: DashboardItem[],
  homepageRoute: string,
  split: boolean = false,
  customCardClass: string = ""
) => {

  const renderDesc = (desc: string | DescriptionObject[]) => {
    if (Array.isArray(desc)) {
      return (
        <div className="descContainer">
          {desc.map((d, idx) => (
            <React.Fragment key={idx}>Reshma
              {d.staticText && <span className="descText">{d.staticText}</span>}
              {d.boxedText && <span className="descBox">{d.boxedText}</span>}
              {d.text && (
                <span className={d.isBox ? "descBox" : "descText"}>{d.text}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    }
    return desc;
  };

const handleItemClick = (i: DashboardItem) => {
const restrictedAccountItems = accountItems.slice(1);

const upgradeOnlySections = [
  accountItem,
  restrictedAccountItems,
  hrItems,
];

if (upgradeOnlySections.some(section => section.includes(i))) {
  setPopup({
    message: "Upgradation needed.\nPlease contact the support team at support@cleezoclass.com",
    type: "warning",
    key: Date.now(),
  });
  return;
}

  const modalComponents = [
    "AdmissionCRM",
    "LeadsProfilePage",
    "AdmissionEnrollment",
    "TestAndCouncelling",
    "Communication",
    "LeadsTable",
    "AdmissionReportPopup"
  ];

  if (modalComponents.includes(i.link)) {
    openModal(i.link, i.displayName || i.title);
  } else {
    navigate(i.link);
  }
};


  const renderItemContent = (i: DashboardItem) => (
    <div className={`dashboard-item ${isMobile ? "mobile" : ""}`} key={i.title} onClick={() => handleItemClick(i)}>
      <div className="dashboard-item-left">
        {items === ActionItems ? (
          <FontAwesomeIcon icon={faAngleRight} className="dashboard-item-icon" />
        ) : (
          <div className="dashboard-item-circle" style={{ backgroundColor: i.color }}></div>
        )}
        <div className="dashboard-item-text">
          <div className="dashboard-item-title">{i.title}</div>
          <div className="dashboard-item-desc">{renderDesc(i.desc)}</div>
        </div>
      </div>

      {items === ActionItems && i.buttonType && (
        <button className={`dashboard-item-button ${i.buttonType === "OK" ? "ok" : "cancel"}`} onClick={e => { e.stopPropagation(); alert(`${i.buttonType} clicked for ${i.title}`); }}>
          {i.buttonType}
        </button>
      )}
    </div>
  );

  if (split) {
    return <div className="itemListContainer">{items.map(renderItemContent)}</div>;
  }

  return <div className={`card ${customCardClass}`}>{items.map(renderItemContent)}</div>;
};

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  };
  const name=localStorage.getItem('name')

 return (
  <div className="outerContainer">
    <Modal isOpen={isModalOpen} title={modalTitle} onClose={closeModal}>
      {modalContent}
    </Modal>

    <div className={isModalOpen ? "blur-background-active" : ""}>
      <div className="innercontainer ">
    <Header/>
    

        <div className="welcomeBar">
            <div className="section-header">
                        {name ? `Welcome ${name}..!` : "Welcome Chief!"}
                    </div>          <div className="bellIcon">
            <FontAwesomeIcon icon={faBell} />
            <span className="notificationDot"></span>
          </div>
        </div>

        <div className="grid">
          <div className="flex-col-6">
            <div className="sectionTitle">Admission-manual</div>
            <div className="cardWrapper">
              <div className="staffSection">
                {renderCard("Marketing", marketingItems, "AdmissionCRM", true)}
              </div>

              {!isMobile && <div className="divider" />}

              <div className="studentSection">
                {renderCard("Marketing", marketingItem, "AdmissionCRM", true)}
              </div>
            </div>
          </div>

          <div className="flex-col-4">
            <div className="sectionTitle">Action</div>
            <div className="cardContainer scrollableCard">
              {renderCard("Operations", ActionItems, "/homepage3", false)}
            </div>
          </div>
        </div>

        <div className="grid">
          <div className="flex-col-6">
            <div className="sectionTitle">Admission-Automated</div>
            <div className="cardWrapper">
              <div className="staffSection">
                {renderCard("Marketing", accountItems, "ExpensesDashboardInline", true)}
              </div>

              {!isMobile && <div className="divider" />}

              <div className="studentSection">
                {renderCard("Marketing", accountItem, "ExpensesDashboardInline", true)}
              </div>
            </div>
          </div>

          <div className="flex-col-4">
            <div className="sectionTitle">Reports</div>
            <div className="cardContainer">{renderCard("HR", hrItems, "AdmissionEnrollment", false)}</div>
          </div>
        </div>
      </div>
    </div>
<ErrorPopup
  key={popup.key}
  message={popup.message}
  onClose={() => setPopup({ message: "", type: "", key: 0 })}
/>

  </div>
);

};

export default FrontDeskDashboard;
