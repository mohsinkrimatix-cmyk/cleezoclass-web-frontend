import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import TaskOfTheDay from "../shared/TaskOfTheDay.tsx";
import ExamDashboard from "./Admin_AcademicStaff.jsx";
import CompactTextTabs from "../shared/CompactTextTabs.jsx";
import "./AdminEventsAndMeetings.css";
import "./AdminQuestionPaper.css";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
import { getUserDisplayName } from "../shared/userDisplayName";

import dashboardIcon from "../assets/Dashboard.png";
import academicsIcon from "../assets/Staff Assign.png";
import leadProfileIcon from "../assets/Lead Profile.png";
import enrollmentIcon from "../assets/Enrollment.png";
import communicationIcon from "../assets/Communication Assign.png";
import reportIcon from "../assets/Reports .png";
import timelineIcon from "../assets/Timeline.png";
import assistantIcon from "../assets/Assistant.png";
import logoab from "../assets/logoab.png";

const AdminQuestionPaper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [instituteName, setInstituteName] = useState("Institute");
  const [instituteLogo, setInstituteLogo] = useState("/default-logo.png");

  useEffect(() => {
    const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
    if (!schoolCode) return;

    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${encodeURIComponent(schoolCode)}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        setInstituteLogo(data.logo || "/default-logo.png");
        const resolvedInstituteName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.school_name || data?.name || data?.schoolName,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setInstituteName(resolvedInstituteName);
        localStorage.setItem("schoolName", resolvedInstituteName);
        localStorage.setItem("instituteName", resolvedInstituteName);
      })
      .catch(() => {
        setInstituteLogo("/default-logo.png");
        const fallbackInstituteName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setInstituteName(fallbackInstituteName);
        localStorage.setItem("schoolName", fallbackInstituteName);
        localStorage.setItem("instituteName", fallbackInstituteName);
      });
  }, []);

  const sidebarItems = [
    { key: "home", label: "Dashboard", icon: dashboardIcon, iconAlt: "Dashboard", onClick: () => navigate("/AdminDashboard") },
    { key: "academics", label: "Academics", icon: academicsIcon, iconAlt: "Academics", onClick: () => navigate("/AdiminAcademicsNew") },
    { key: "events", label: "Events & Meetings", icon: leadProfileIcon, iconAlt: "Events", onClick: () => navigate("/AdminEventsAndMeetings") },
    { key: "generations", label: "Generations", icon: communicationIcon, iconAlt: "Generations", onClick: () => navigate("/AdminGenerations") },
    { key: "store", label: "Store", icon: enrollmentIcon, iconAlt: "Store", onClick: () => navigate("/AdminStoreNew") },
    { key: "reports", label: "Report", icon: reportIcon, iconAlt: "Reports", onClick: () => navigate("/AdminReportsPage") },
  ];

  const topbarTabs = [
    { key: "dashboard", label: "Dashboard", className: "accountant-topbar-tab-button", onClick: () => navigate("/AdminDashboard") },
    { key: "academics", label: "Academics", className: "accountant-topbar-tab-button", onClick: () => navigate("/AdiminAcademicsNew") },
    { key: "events", label: "Events & Meetings", className: "accountant-topbar-tab-button", onClick: () => navigate("/AdminEventsAndMeetings") },
    { key: "reports", label: "Reports", className: "accountant-topbar-tab-button", onClick: () => navigate("/AdminGenerations") },
  ];

  const topbarRight = <EditableProfileMenu showHrSwitch />;

  const shortcutCards = [
    { key: "qp", title: "Question Paper", subtitle: "Generator", icon: reportIcon },
    { key: "scan", title: "Scan & Pull", subtitle: "Pending Classes", icon: timelineIcon },
    { key: "invigilator", title: "Invigilator", subtitle: "Assign Teacher", icon: assistantIcon },
  ];

  return (
    <DashboardLayout
      pageClassName="frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page dashboard-home-page"
      sidebarItems={sidebarItems}
      topbarTabs={topbarTabs}
      logoSrc={instituteLogo}
      logoAlt={instituteName || "Institute"}
      instituteName={instituteName}
      topbarRight={topbarRight}
      footerLogoSrc={logoab}
      footerLogoAlt="Cleezo Class"
    >
      <div className="admin-question-paper-shell admin-events-content">
        <div className="admin-events-top admin-question-paper-top">
          <div className="accountant-welcome-block admin-question-paper-hero">
            <h2>Hi, {getUserDisplayName()}!</h2>
            <p>Create question papers faster,</p>
            <p>Review scan and invigilator assignments</p>
            <p>Assign students and roles from one place</p>

            <CompactTextTabs
              activePath={location.pathname}
              onNavigate={navigate}
              tabs={[
                { path: "/AdminGenerations", label: "Reports" },
                { path: "/AdmissionTimetableNew", label: "Timetable" },
                { path: "/AdminQuestionPaper", label: "QP" },
              ]}
            />
          </div>

          <div className="admin-events-task accountant-card admin-question-paper-task">
            <div className="taskCardContent">
              <TaskOfTheDay />
            </div>
          </div>

          <div className="accountant-mini-cards admin-question-paper-shortcuts">
            {shortcutCards.map((card) => (
              <div key={card.key} className="accountant-quick-card accountant-card accountant-quick-card-clickable admin-question-paper-shortcut">
                <img src={card.icon} alt={card.title} />
                <h4>{card.title}</h4>
                <p>{card.subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-question-paper-main">
          <div className="admin-question-paper-workspace-card accountant-card">
            <div className="admin-question-paper-workspace-header">
              <h3>Question Paper Generator</h3>
              <span>Scan, assign, and generate from one compact board</span>
            </div>
            <div className="admin-question-paper-workspace-body">
              <ExamDashboard compactMode />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminQuestionPaper;