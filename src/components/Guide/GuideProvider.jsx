import React, { createContext, useState } from "react";
import { guideConfig } from "./guideConfig";

import GuideOverlay from "./GuideOverlay";
import GuideTooltip from "./GuideTooltip";

export const GuideContext = createContext({
  isGuideActive: false,
  currentStep: 0,
  currentModule: null,
  startGuide: () => {},
  stopGuide: () => {},
  nextStep: () => {},
  nextGuideStep: () => {},
});

const GuideProvider = ({ children }) => {
  const [isGuideActive, setIsGuideActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentModule, setCurrentModule] = useState(null);

const moduleFlows = {
  chief: [
    "income",
    "expense",
    "academics",
    "meetings",
    "timetable",
    "exam",
    "enrollment",
    "attendance",
    "recruitment",
    "events",
  ],

  accountant: [
    "accountant_income",
    "accountant_expense",
  ],

admin: [
  "admin_academics_teacher",
  "admin_academics_student",
  "admin_events",
  "admin_timetable",
  "admin_store",
],

hr: [
  "admin_hr",
  "admin_hr_teacher"
],

 frontdesk: [
  "frontdesk_admission_manual",
  "frontdesk_test_counselling",
  "frontdesk_communication",
  "lead_profile_page",
  "frontdesk_enrollment",
  "frontdesk_followups",
  "frontdesk_admission_report",
],



};

const getModuleTotalSteps = (moduleName) => {
  const steps = guideConfig[moduleName] || [];
  return steps.length + 1;
};


const startGuide = (moduleName) => {
  setCurrentModule(moduleName);
  setIsGuideActive(true);
  setCurrentStep(0);
};



  const stopGuide = () => {
    setIsGuideActive(false);
    setCurrentStep(0);
    setCurrentModule(null);
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const nextGuideStep = () => {
    const totalSteps = getModuleTotalSteps(currentModule);

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

   // ===== LEAD PROFILE PAGE SHOULD NOT FOLLOW ANY FLOW =====
let activeFlow;

if (moduleFlows.hr.includes(currentModule)) {
  activeFlow = moduleFlows.hr;
} else if (
  moduleFlows.frontdesk.includes(currentModule) ||
  currentModule?.startsWith("frontdesk_")
) {
  activeFlow = moduleFlows.frontdesk;
} else if (currentModule?.startsWith("accountant_")) {
  activeFlow = moduleFlows.accountant;
} else if (currentModule?.startsWith("admin_")) {
  activeFlow = moduleFlows.admin;
} else {
  activeFlow = moduleFlows.chief;
}


const currentIndex = activeFlow.indexOf(currentModule);
const nextModule = activeFlow[currentIndex + 1];

    if (!nextModule) {
      stopGuide();
      return;
    }

    setCurrentModule(nextModule);
    setCurrentStep(0);
  };


  return (
  <GuideContext.Provider
    value={{
  isGuideActive,
  currentStep,
  currentModule,
  startGuide,
  stopGuide,
    nextStep,
  nextGuideStep,

}}
  >
    {children}
<GuideOverlay />
<GuideTooltip />
  </GuideContext.Provider>
);
};

export default GuideProvider;
