import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AccountantDashboardnew.css";
import "./AccountantReportsPageNew.css";
import DashboardLayout from "../components/DashboardLayout.jsx";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";

import collectFeeIcon from "../assets/collect.png";
import addFeeIcon from "../assets/Navbar-AddFee.png";
import expenseIcon from "../assets/Navbar-Expenses.png";
import reportIcon from "../assets/Reports.png";
import dashboardIcon from "../assets/Dashboard.png";
import addStudentIcon from "../assets/Enrollment.png";
import logoab from "../assets/logoab.png";
import userAvatar from "../assets/user.png";

import daywiseIcon from "../assets/Daywise.png";
import transactionsIcon from "../assets/Transactions2.png";
import feesReportIcon from "../assets/Fees Report.png";
import dueReportIcon from "../assets/Due Report.png";
import feeTypeIcon from "../assets/Fee Type.png";
import discountsIcon from "../assets/Discounts.png";
import referralsIcon from "../assets/Referrals.png";
import feesSearchIcon from "../assets/user (1).png";

const reportCards = [
  { icon: daywiseIcon, title: "Day-wise", subtitle: "Ledger" },
  { icon: transactionsIcon, title: "Transactions", subtitle: "Digital Report" },
  { icon: feesReportIcon, title: "Fees Report", subtitle: "Total Fee & Installments" },
  { icon: dueReportIcon, title: "Due Report", subtitle: "Current & Previous years" },
  { icon: feeTypeIcon, title: "Fee Type", subtitle: "Tuition, Bus, Books etc." },
  { icon: discountsIcon, title: "Discounts", subtitle: "Fees & closings" },
  { icon: referralsIcon, title: "Referrals", subtitle: "Student statements" },
  { icon: feesSearchIcon, title: "Fees Search", subtitle: "Student statements" },
];

const AccountantReportsPageNew = () => {
  const navigate = useNavigate();
  const [instituteName, setInstituteName] = useState("Institute");
  const [instituteLogo, setInstituteLogo] = useState("/default-logo.png");

  useEffect(() => {
    const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
    if (!schoolCode) return;

    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${encodeURIComponent(schoolCode)}`)
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        const resolvedInstituteName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.schoolName || data?.name,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setInstituteLogo(data.logo || "/default-logo.png");
        setInstituteName(resolvedInstituteName);
        localStorage.setItem("schoolName", resolvedInstituteName);
        localStorage.setItem("instituteName", resolvedInstituteName);
      })
      .catch(() => {
        const fallbackInstituteName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Institute",
        });
        setInstituteLogo("/default-logo.png");
        setInstituteName(fallbackInstituteName);
        localStorage.setItem("schoolName", fallbackInstituteName);
        localStorage.setItem("instituteName", fallbackInstituteName);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  };

  const sidebarItems = [
    { key: "home", label: "Dashboard", icon: dashboardIcon, iconAlt: "Dashboard", onClick: () => navigate("/AccountantDashboard") },
    { key: "collect-fee", label: "Fees", icon: collectFeeIcon, onClick: () => navigate("/AccountantFees") },
    { key: "add-fee", label: "Add Fees", icon: addFeeIcon },
    { key: "add-student", label: "Add Student", icon: addStudentIcon },
    { key: "add-expense", label: "Expense", icon: expenseIcon, onClick: () => navigate("/AccountantExpenses") },
    { key: "report", label: "Reports", icon: reportIcon, onClick: () => navigate("/AccountantReportsPage"), active: true },
  ];

  const topbarTabs = [
    { key: "dashboard", label: "Dashboard", className: "accountant-topbar-tab-button", onClick: () => navigate("/AccountantDashboard") },
    { key: "fees", label: "Fees", className: "accountant-topbar-tab-button", onClick: () => navigate("/AccountantFees") },
    { key: "expense", label: "Expense", className: "accountant-topbar-tab-button", onClick: () => navigate("/AccountantExpenses") },
    { key: "reports", label: "Reports", className: "accountant-topbar-tab-button", onClick: () => navigate("/AccountantReportsPage"), active: true },
  ];

  const topbarRight = (
    <>
      <button type="button" className="accountant-branch-btn">
        <span>Switch Branch</span>
        <span className="accountant-branch-caret">▼</span>
      </button>
      <EditableProfileMenu />
    </>
  );

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
      <div className="accountant-grid accountant-reports-grid accountant-reports-page-content">
        <div className="accountant-reports-card-row">
          {reportCards.map((card) => (
            <div key={card.title} className="accountant-report-shortcut accountant-card">
              <div className="accountant-report-shortcut-icon">
                <img src={card.icon} alt={card.title} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountantReportsPageNew;
