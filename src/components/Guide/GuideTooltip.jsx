import React, { useContext, useEffect, useRef, useState } from "react";
import { GuideContext } from "./GuideProvider";
import { guideConfig } from "./guideConfig";
import "./GuideTooltip.css";

const moduleLabels = {
  income: "Income",
  expense: "Expense",
  academics: "Academics",
  meetings: "Meetings & Live Chat",
  timetable: "Timetable",
  exam: "Exam Management",
  enrollment: "Enrollments & Biometrics",
  attendance: "Attendance & Payroll",
  recruitment: "Recruitment & Exits",
  events: "Events & Meetings",
  accountant_income: "Accountant Income",
  accountant_expense: "Accountant Expense",
  admin_academics_teacher: "Academics (Teacher Section)",
  admin_academics_student: "Academics (Student Section)",
  admin_events: "Events & Meetings",
  admin_timetable: "Timetable",
  admin_store: "Store",
  admin_hr: "Enrollments & Biometrics",
  admin_hr_teacher: "Attendance & Payroll",
  frontdesk_admission_manual: "Admission (Manual)",
  frontdesk_test_counselling: "Test & Councelling",
  frontdesk_communication: "Communications",
  lead_profile_page: "Lead Profile",
  frontdesk_enrollment: "Enrollments",
  frontdesk_followups: "Follow ups",
  frontdesk_admission_report: "Admission Report",
};



const moduleCardSelectors = {
  income: '[data-guide="guide-income-card"]',
  expense: '[data-guide="guide-expense-card"]',
  academics: '[data-guide="guide-academics-card"]',
  meetings: '[data-guide="guide-meetings-card"]',
  timetable: '[data-guide="guide-timetable-card"]',
  exam: '[data-guide="guide-exam-card"]',
  enrollment: '[data-guide="guide-enrollment-card"]',
  attendance: '[data-guide="guide-attendance-card"]',
  recruitment: '[data-guide="guide-recruitment-card"]',
  events: '[data-guide="guide-events-card"]',
  accountant_income: '[data-guide="accountant-income-section"]',
  accountant_expense: '[data-guide="accountant-expense-section"]',
  admin_academics_teacher: '[data-guide="admin-academics-teacher"]',
  admin_academics_student: '[data-guide="admin-academics-student"]',
  admin_events: '[data-guide="admin-events-section"]',
  admin_timetable: '[data-guide="admin-timetable-section"]',
  admin_store: '[data-guide="admin-store-section"]',
  admin_hr: '[data-guide="hr-top-section"]',
  admin_hr_teacher: '[data-guide="hr-bottom-section"]',
  frontdesk_admission_manual: '[data-guide="fd-admission-card"]',
  frontdesk_test_counselling: '[data-guide="fd-test-counselling-card"]',
  frontdesk_communication: '[data-guide="fd-communication-card"]',
  lead_profile_page: '[data-guide="fd-leadprofile-card"]',
  frontdesk_enrollment: '[data-guide="fd-enrollment-card"]',
  frontdesk_followups: '[data-guide="fd-followups-card"]',
  frontdesk_admission_report: '[data-guide="fd-admission-report-card"]',
};


const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const GuideTooltip = () => {
  const { isGuideActive, currentStep, nextGuideStep, stopGuide, currentModule } =
    useContext(GuideContext);

  const activeSteps = currentModule ? guideConfig[currentModule] || [] : [];

  const tooltipRef = useRef(null);
  const [pos, setPos] = useState({ top: 40, left: 40, arrowX: 30, arrowY: 30 });
  const [placement, setPlacement] = useState("bottom");
  const [showArrow, setShowArrow] = useState(false);

  useEffect(() => {
    if (!isGuideActive) return;

    const updatePosition = () => {
      const tip = tooltipRef.current;
      if (!tip) return;

         const selector =
  currentStep === 0
    ? moduleCardSelectors[currentModule]
    : activeSteps[currentStep - 1]?.selector;



      const target = selector ? document.querySelector(selector) : null;

      const tipW = tip.offsetWidth || 420;
      const tipH = tip.offsetHeight || 170;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const margin = 12;
      const gap = 14;

      let nextTop = vh - tipH - 28;
      let nextLeft = (vw - tipW) / 2;
      let nextPlacement = "bottom";
      let arrowX = tipW / 2;
      let arrowY = tipH / 2;

      if (target) {
        const r = target.getBoundingClientRect();

        const canRight = vw - r.right >= tipW + gap + margin;
        const canLeft = r.left >= tipW + gap + margin;
        const canBottom = vh - r.bottom >= tipH + gap + margin;

        if (canRight) {
          nextPlacement = "right";
          nextLeft = r.right + gap;
          nextTop = clamp(r.top + r.height / 2 - tipH / 2, margin, vh - tipH - margin);
          arrowY = clamp(r.top + r.height / 2 - nextTop, 18, tipH - 18);
        } else if (canLeft) {
          nextPlacement = "left";
          nextLeft = r.left - tipW - gap;
          nextTop = clamp(r.top + r.height / 2 - tipH / 2, margin, vh - tipH - margin);
          arrowY = clamp(r.top + r.height / 2 - nextTop, 18, tipH - 18);
        } else if (canBottom) {
          nextPlacement = "bottom";
          nextTop = r.bottom + gap;
          nextLeft = clamp(r.left + r.width / 2 - tipW / 2, margin, vw - tipW - margin);
          arrowX = clamp(r.left + r.width / 2 - nextLeft, 18, tipW - 18);
        } else {
          nextPlacement = "top";
          nextTop = r.top - tipH - gap;
          nextLeft = clamp(r.left + r.width / 2 - tipW / 2, margin, vw - tipW - margin);
          arrowX = clamp(r.left + r.width / 2 - nextLeft, 18, tipW - 18);
        }

        setShowArrow(true);
      } else {
        setShowArrow(false);
      }

      nextLeft = clamp(nextLeft, margin, vw - tipW - margin);
      nextTop = clamp(nextTop, margin, vh - tipH - margin);

      setPlacement(nextPlacement);
      setPos({ top: nextTop, left: nextLeft, arrowX, arrowY });
    };

    const t1 = setTimeout(updatePosition, 0);
    const t2 = setTimeout(updatePosition, 220);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isGuideActive, currentStep, currentModule, activeSteps]);

  if (!isGuideActive) return null;

  const moduleLabel = moduleLabels[currentModule] || "Section";

const isAccountantModule = currentModule?.startsWith("accountant_");
const isHrModule = currentModule === "admin_hr" || currentModule === "admin_hr_teacher";
const isAdminModule = currentModule?.startsWith("admin_") && !isHrModule;
const isFrontDeskModule = currentModule?.startsWith("frontdesk_");

let text = "";

if (currentStep === 0) {
 if (isAccountantModule) {
  text = `You are now entering the ${moduleLabel} section of the Accountant Dashboard. This area helps you manage financial records, payments, and reports efficiently. Click Next to open and explore its features.`;
} else if (isHrModule) {
  text = `You are now entering the ${moduleLabel} section of the HR Dashboard. This area helps you manage staff records, attendance, payroll, and HR activities. Click Next to open and explore its features.`;
} else if (isAdminModule) {
  text = `You are now entering the ${moduleLabel} section of the Admin Dashboard. This area allows you to monitor school operations, manage academic activities, and oversee system functions. Click Next to open and explore it.`;
} else if (isFrontDeskModule) {
  text = `You are now entering the ${moduleLabel} section of the Front Desk Dashboard. This area helps manage student interactions, inquiries, admissions, and communication tasks. Click Next to open and explore it.`;
} else {
  text = `You are now entering the ${moduleLabel} section of the Chief Dashboard. This area provides a high-level overview and control over the entire school ${moduleLabel}. Click Next to continue.`;
}

} else if (activeSteps[currentStep - 1]) {
  text = activeSteps[currentStep - 1].text;
} else {
  text = `Exploring ${moduleLabel}. Click Next to continue.`;
}





  const arrowSize = 10;
  const arrowStyle = (() => {
    if (placement === "right") {
      return {
        position: "absolute",
        left: `-${arrowSize}px`,
        top: `${pos.arrowY - arrowSize}px`,
        width: 0,
        height: 0,
        borderTop: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid #fff`,
      };
    }

    if (placement === "left") {
      return {
        position: "absolute",
        right: `-${arrowSize}px`,
        top: `${pos.arrowY - arrowSize}px`,
        width: 0,
        height: 0,
        borderTop: `${arrowSize}px solid transparent`,
        borderBottom: `${arrowSize}px solid transparent`,
        borderLeft: `${arrowSize}px solid #fff`,
      };
    }

    if (placement === "top") {
      return {
        position: "absolute",
        bottom: `-${arrowSize}px`,
        left: `${pos.arrowX - arrowSize}px`,
        width: 0,
        height: 0,
        borderLeft: `${arrowSize}px solid transparent`,
        borderRight: `${arrowSize}px solid transparent`,
        borderTop: `${arrowSize}px solid #fff`,
      };
    }

    return {
      position: "absolute",
      top: `-${arrowSize}px`,
      left: `${pos.arrowX - arrowSize}px`,
      width: 0,
      height: 0,
      borderLeft: `${arrowSize}px solid transparent`,
      borderRight: `${arrowSize}px solid transparent`,
      borderBottom: `${arrowSize}px solid #fff`,
    };
  })();

  return (
    <div
      ref={tooltipRef}
      className="guide-tooltip"
      style={{
        top: `${pos.top}px`,
        left: `${pos.left}px`,
      }}
    >
      {showArrow && <div className="guide-tooltip-arrow" style={arrowStyle} />}

      <div className="guide-tooltip-text">{text}</div>

      <div className="guide-tooltip-actions">
        <button onClick={stopGuide} className="guide-tooltip-btn guide-tooltip-btn-exit">
          Exit
        </button>

        <button onClick={nextGuideStep} className="guide-tooltip-btn guide-tooltip-btn-next">
          Next
        </button>
      </div>
    </div>
  );

};

export default GuideTooltip;
