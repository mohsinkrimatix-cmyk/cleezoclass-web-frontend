import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Calculator,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  UserCog,
  Users,
} from "lucide-react";
import { FiHelpCircle } from "react-icons/fi";

import DashboardLayout from "../components/DashboardLayout.jsx";
import "../accountant/dashboardGlobal.css";
import "./HrDashboard.css";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";

import Biometric from "./HR_Biometric.jsx";
import BiometricTeacher from "./HR_BiometricTeacher.jsx";
import SalaryInsertion from "./HR_payroll_BaseEntryForm.jsx";
import SalaryCalculation from "./HR_editPayroll.jsx";
import SalaryReports from "../shared/TeacherSalaryForPay.jsx";
import StudentsList from "../shared/StudentList.jsx";
import LeftStudents from "./HR_biometric_StudentExit.jsx";

import dashboardIcon from "../assets/Dashboard.png";
import studentIcon from "../assets/Enrollment.png";
import teacherIcon from "../assets/user.png";
import salaryIcon from "../assets/finance.png";
import reportIcon from "../assets/Reports.png";
import assistantIcon from "../assets/Assistant.png";
import addIcon from "../assets/add-fee.png";
import logoab from "../assets/logoab.png";
import defaultSchoolLogo from "../assets/abc school.png";

const SECTION = {
  dashboard: "dashboard",
  students: "students",
  teachers: "teachers",
  salary: "salary",
  reports: "reports",
};

const ACTION = {
  salaryInsertion: "salaryInsertion",
  salaryCalculation: "salaryCalculation",
  salaryReports: "salaryReports",
  studentsList: "studentsList",
  leftStudents: "leftStudents",
};

const sectionItems = [
  { key: SECTION.dashboard, label: "Dashboard", icon: dashboardIcon },
  { key: SECTION.students, label: "Student Information", icon: studentIcon },
  { key: SECTION.teachers, label: "Teacher Information", icon: teacherIcon },
  { key: SECTION.salary, label: "Salary", icon: salaryIcon },
  { key: SECTION.reports, label: "Reports", icon: reportIcon },
];

const salaryItems = [
  {
    key: ACTION.salaryInsertion,
    title: "Salary Insertion",
    desc: "Employee salary structure and base salary entry.",
    icon: ReceiptText,
  },
  {
    key: ACTION.salaryCalculation,
    title: "Salary Calculation",
    desc: "Monthly salary calculation, deductions, and payslip.",
    icon: Calculator,
  },
];

const reportItems = [
  {
    key: ACTION.salaryReports,
    title: "Salary Reports",
    desc: "Paid and unpaid salary report.",
    icon: FileText,
  },
  {
    key: ACTION.studentsList,
    title: "List of Students",
    desc: "Search and view current student information.",
    icon: Users,
  },
  {
    key: ACTION.leftStudents,
    title: "List of Students Who Have Left",
    desc: "Student exit records and left-student list.",
    icon: LogOut,
  },
];

const HrDashboard = () => {
  const [activeSection, setActiveSection] = useState(SECTION.dashboard);
  const [activeAction, setActiveAction] = useState(null);
  const [instituteLogo, setInstituteLogo] = useState(defaultSchoolLogo);
  const [instituteName, setInstituteName] = useState("Institute");
  const userName = localStorage.getItem("name") || "HR";

  useEffect(() => {
    const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
    if (!schoolCode) {
      const fallbackName = resolveInstituteDisplayName({
        storedSchoolName: localStorage.getItem("schoolName"),
        storedInstituteName: localStorage.getItem("instituteName"),
        fallback: "Institute",
      });
      setInstituteName(fallbackName);
      return;
    }

    let cancelled = false;

    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${encodeURIComponent(schoolCode)}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (cancelled) return;
        const resolvedName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.schoolName || data?.name,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setInstituteLogo(data?.logo || defaultSchoolLogo);
        setInstituteName(resolvedName);
        localStorage.setItem("schoolName", resolvedName);
        localStorage.setItem("instituteName", resolvedName);
      })
      .catch(() => {
        if (cancelled) return;
        const fallbackName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setInstituteLogo(defaultSchoolLogo);
        setInstituteName(fallbackName);
        localStorage.setItem("schoolName", fallbackName);
        localStorage.setItem("instituteName", fallbackName);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentTitle = useMemo(() => {
    if (activeAction) {
      return [...salaryItems, ...reportItems].find((item) => item.key === activeAction)?.title || "Dashboard";
    }
    return sectionItems.find((item) => item.key === activeSection)?.label || "Dashboard";
  }, [activeAction, activeSection]);

  const openSection = (key) => {
    setActiveSection(key);
    setActiveAction(null);
  };

  const openAction = (section, key) => {
    setActiveSection(section);
    setActiveAction(key);
  };

  const sidebarItems = sectionItems.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    iconAlt: item.label,
    active: activeSection === item.key,
    onClick: () => openSection(item.key),
  }));

  const topbarTabs = sectionItems.map((item) => ({
    key: item.key,
    label: item.label,
    active: activeSection === item.key && !activeAction,
    className: "accountant-topbar-tab-button",
    onClick: () => openSection(item.key),
  }));

  const topbarRight = (
    <>
      <button type="button" className="accountant-help-icon-btn" title="Guide">
        <FiHelpCircle style={{ color: "#e9818c", fontSize: "34px" }} />
      </button>
      <button type="button" className="accountant-branch-btn">
        Switch Branch ▾
      </button>
    </>
  );

  const renderActionGrid = (items, section) => {
    const isReportsSection = section === SECTION.reports;

    return (
    <div className={isReportsSection ? "hr-accountant-report-card-row" : "hr-accountant-action-grid"}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            className={isReportsSection ? "hr-accountant-report-card" : "accountant-card hr-accountant-action-card"}
            onClick={() => openAction(section, item.key)}
          >
            {isReportsSection ? (
              <>
                <span className="hr-accountant-report-card-icon">
                  <Icon size={46} strokeWidth={1.8} />
                </span>
                <span className="hr-accountant-report-card-title">{item.title}</span>
                <span className="hr-accountant-report-card-subtitle">{item.desc}</span>
              </>
            ) : (
              <>
                <span className="hr-accountant-action-icon">
                  <Icon size={24} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
  };

  const renderModuleList = (title, items, section) => (
    <div className="accountant-card hr-accountant-module-card">
      <div className="accountant-card-header">
        <div className="Heading">{title}</div>
      </div>
      <div className="hr-accountant-module-list">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.key} type="button" onClick={() => openAction(section, item.key)}>
              <Icon size={18} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.desc}</small>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="accountant-grid hr-accountant-grid">
      <div className="accountant-row accountant-row-top">
        <div className="accountant-welcome-block">
          <h2>Hi, {userName}!</h2>
          <p>Manage Student Information</p>
          <p>Review Teacher Information</p>
          <p>Process Salary and Reports</p>
        </div>

        <div className="accountant-task-card accountant-card hr-accountant-task">
          <div className="Heading">HR Task of the Day</div>
          <div className="hr-accountant-task-box">
            <strong>Review HR Records</strong>
            <span>Check salary updates, student exits, and teacher information.</span>
          </div>
        </div>

        <div className="accountant-mini-cards">
          <button className="accountant-quick-card accountant-card accountant-quick-card-clickable" onClick={() => openSection(SECTION.students)}>
            <img src={studentIcon} alt="Student Information" />
            <h4>Student Information</h4>
            <p>Student records</p>
          </button>
          <button className="accountant-quick-card accountant-card accountant-quick-card-clickable" onClick={() => openSection(SECTION.salary)}>
            <img src={addIcon} alt="Salary" />
            <h4>Salary</h4>
            <p>Insertion & calculation</p>
          </button>
          <button className="accountant-quick-card accountant-card accountant-quick-card-clickable" onClick={() => openSection(SECTION.reports)}>
            <img src={assistantIcon} alt="Reports" />
            <h4>Reports</h4>
            <p>Daily activity check</p>
          </button>
        </div>
      </div>

      <div className="accountant-row accountant-row-middle">
        <button className="accountant-card hr-accountant-big-card" onClick={() => openSection(SECTION.students)}>
          <GraduationCap size={26} />
          <strong>Student Information</strong>
          <span>Admission, student records, biometrics, attendance, and exits.</span>
        </button>
        <button className="accountant-card hr-accountant-big-card" onClick={() => openSection(SECTION.teachers)}>
          <UserCog size={26} />
          <strong>Teacher Information</strong>
          <span>Teacher enrollment, staff records, biometrics, attendance, and leaves.</span>
        </button>
        {renderModuleList("Salary", salaryItems, SECTION.salary)}
      </div>

      <div className="accountant-row accountant-row-bottom hr-accountant-bottom">
        {renderModuleList("Reports", reportItems, SECTION.reports)}
        <div className="accountant-card hr-accountant-summary-card">
          <LayoutDashboard size={24} />
          <strong>Dashboard</strong>
          <span>5 main HR components</span>
        </div>
        <div className="accountant-card hr-accountant-summary-card">
          <BarChart3 size={24} />
          <strong>{currentTitle}</strong>
          <span>Current active HR workspace</span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeAction === ACTION.salaryInsertion) return <SalaryInsertion />;
    if (activeAction === ACTION.salaryCalculation) return <SalaryCalculation />;
    if (activeAction === ACTION.salaryReports) return <SalaryReports />;
    if (activeAction === ACTION.studentsList) return <StudentsList />;
    if (activeAction === ACTION.leftStudents) return <LeftStudents />;

    if (activeSection === SECTION.students) return <Biometric />;
    if (activeSection === SECTION.teachers) return <BiometricTeacher />;
    if (activeSection === SECTION.salary) return renderActionGrid(salaryItems, SECTION.salary);
    if (activeSection === SECTION.reports) return renderActionGrid(reportItems, SECTION.reports);
    return renderDashboard();
  };

  const isDashboard = activeSection === SECTION.dashboard && !activeAction;

  return (
    <DashboardLayout
      pageClassName="frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page dashboard-home-page hr-accountant-dashboard-page"
      sidebarItems={sidebarItems}
      topbarTabs={topbarTabs}
      logoSrc={instituteLogo}
      logoAlt={instituteName}
      instituteName={instituteName}
      topbarRight={topbarRight}
      footerLogoSrc={logoab}
      footerLogoAlt="Cleezo Class"
    >
      {isDashboard ? (
        renderDashboard()
      ) : (
        <div className="accountant-card hr-accountant-work-card">
          <div className="accountant-card-header hr-accountant-work-header">
            <div className="Heading">{currentTitle}</div>
            {activeAction ? (
              <button className="accountant-card-filter" type="button" onClick={() => setActiveAction(null)}>
                Back
              </button>
            ) : null}
          </div>
          <div className="hr-accountant-work-body">{renderContent()}</div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default HrDashboard;
