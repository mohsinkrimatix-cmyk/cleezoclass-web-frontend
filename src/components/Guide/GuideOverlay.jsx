import React, { useContext, useEffect, useState } from "react";
import { GuideContext } from "./GuideProvider";
import { guideConfig } from "./guideConfig";
import "./GuideOverlay.css";

const GuideOverlay = () => {
  const { isGuideActive, stopGuide, currentStep, currentModule } =
    useContext(GuideContext);

 const activeSteps = React.useMemo(() => {
  return currentModule ? guideConfig[currentModule] || [] : [];
}, [currentModule]);
  const [spotlightRect, setSpotlightRect] = useState(null);

  const setSpotlightFromElement = (el) => {
    if (!el) {
      setSpotlightRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const isAdminModule = currentModule?.startsWith("admin_");
    const padding = isAdminModule ? 2 : 8;

    const top = Math.max(rect.top - padding, 6);
    const left = Math.max(rect.left - padding, 6);
    const width = Math.min(rect.width + padding * 2, window.innerWidth - left - 6);
    const height = Math.min(rect.height + padding * 2, window.innerHeight - top - 6);
    const computedRadius =
      Number.parseFloat(window.getComputedStyle(el).borderRadius || "0") || 0;
    const radius = isAdminModule ? Math.max(6, computedRadius) : Math.max(10, computedRadius || 10);

    setSpotlightRect({ top, left, width, height, radius });
  };



  useEffect(() => {
    if (!isGuideActive) {
      setSpotlightRect(null);
      return;
    }

    const applyHighlight = (el, type = "element") => {

      const computedPos = window.getComputedStyle(el).position;

      if (computedPos === "static") {
        el.style.position = "relative";
        el.dataset.guidePositionApplied = "true";
      }

      el.style.zIndex = "2002";
      el.style.backgroundColor = "";
      el.style.boxShadow = "";

                el.classList.remove(
        "guide-highlight-base",
        "guide-highlight-card",
        "guide-highlight-element",
        "guide-highlight-admin",
        "guide-highlight-tight"
      );

      el.classList.add("guide-highlight-base");

      if (type === "card") {
        el.classList.add("guide-highlight-card");
      } else {
        el.classList.add("guide-highlight-element");
      }

            if (currentModule?.startsWith("admin_")) {
        el.classList.add("guide-highlight-admin");
      }

           if (currentModule?.startsWith("frontdesk_")) {
        el.classList.add("guide-highlight-tight");
      }




      setSpotlightFromElement(el);
    };

    const clearHighlight = (el) => {
                 el.classList.remove(
        "guide-highlight-base",
        "guide-highlight-card",
        "guide-highlight-element",
        "guide-highlight-admin",
        "guide-highlight-tight"
      );



      el.style.boxShadow = "";
      el.style.zIndex = "";
      el.style.backgroundColor = "";

      if (el.dataset.guidePositionApplied === "true") {
        el.style.position = "";
        delete el.dataset.guidePositionApplied;
      }
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
  admin_academics_staff: '[data-guide="admin-staff-test-performance-section"]',
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



  const moduleCardSelector = moduleCardSelectors[currentModule] || null;

   const allSelectors = [
    moduleCardSelector,
    ...activeSteps.map((step) => step.selector),
  ].filter(Boolean);

  const effectTimeouts = [];
  const queueEffectTimeout = (fn, delay) => {
    const timeoutId = setTimeout(fn, delay);
    effectTimeouts.push(timeoutId);
    return timeoutId;
  };

  // CLEAN ALL PREVIOUS HIGHLIGHTS GLOBALLY
document.querySelectorAll(".guide-highlight-base").forEach((el) => {
  clearHighlight(el);
});


// STEP 0 → Close previous popup (if open), then highlight current module card
// STEP 0 → Always close previous popup; then highlight current module card if available


if (currentStep === 0) {

  // Always close any open popup first
    const openPopupCloseBtn =
    document.querySelector(".globalpopup-close-btn") ||
    document.querySelector(".fee-popup-close") ||
    document.querySelector(".popup-close-btn") ||
    document.querySelector(".previousrecord-close-btn") ||
    document.querySelector(".modalOverlayStyle") ||
    Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.textContent?.trim().toLowerCase() === "close"
    );


  if (openPopupCloseBtn) {
    openPopupCloseBtn.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  }

  // Wait slightly before highlighting next section
  queueEffectTimeout(() => {
    if (moduleCardSelector) {
      const el = document.querySelector(moduleCardSelector);
      if (el) applyHighlight(el, "card");
    }
  }, 220);

  return;
}



  // STEP 1 → Click current module title/row inside card to open popup
  if (currentStep === 1 && moduleCardSelector) {
    setSpotlightRect(null);
    const rowEl = document.querySelector(moduleCardSelector);

    if (rowEl) {
      const primaryTarget =
        currentModule === "accountant_income"
          ? rowEl.querySelector('[data-guide="accountant-income-trigger"] .title-hover > div')
          : currentModule === "accountant_expense"
          ? rowEl.querySelector('[data-guide="accountant-expense-trigger"] .title-hover > div')
          : rowEl.querySelector(".title-hover > div");

      const fallbackTarget =
        currentModule === "accountant_income"
          ? rowEl.querySelector('[data-guide="accountant-income-trigger"]') || rowEl
          : currentModule === "accountant_expense"
          ? rowEl.querySelector('[data-guide="accountant-expense-trigger"]') || rowEl
          : rowEl.querySelector(".title-hover")?.parentElement || rowEl;

      const fireClick = (el) => {
        el.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        );
      };

      if (primaryTarget) {
        fireClick(primaryTarget);
      } else {
        fireClick(fallbackTarget);
      }

      const firstPopupSelector = activeSteps[0]?.selector;
      if (firstPopupSelector) {
        queueEffectTimeout(() => {
          if (!document.querySelector(firstPopupSelector)) {
            fireClick(fallbackTarget);
          }
        }, 220);
      }
    }
  }

  // ✅ CLOSE POPUP WHEN GUIDE FINISHES LAST STEP
if (currentStep > activeSteps.length) {

  const openPopupCloseBtn =
    document.querySelector(".globalpopup-close-btn") ||
    document.querySelector(".fee-popup-close") ||
    document.querySelector(".popup-close-btn") ||
    document.querySelector(".previousrecord-close-btn") ||
    Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.textContent?.trim().toLowerCase() === "close"
    );

  if (openPopupCloseBtn) {
    openPopupCloseBtn.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  }
}

  // STEP 1+ → Popup elements (same indexing for all modules)
  const step = activeSteps[currentStep - 1];


  if (step) {
    let tries = 0;
    const maxTries = 25; // wait longer for dynamic popup sections

        const isVisibleElement = (el) => {
      if (!el) return false;

      const style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }

      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const popupPresenceSelectors = [
      ".globalpopup-close-btn",
      ".fee-popup-close",
      ".popup-close-btn",
      ".previousrecord-close-btn",
      ".modalOverlayStyle",
      ".expense-popup",
      ".fee-popup-overlay",
      ".popup-overlay",
      ".previousrecord-popup-overlay",
      ".staff-modal-overlay",
      ".staff-academic-ledger-overlay",
      ".at-modal-overlay",
      ".store-report-modal",
      '[data-guide="guide-income-popup-title"]',
      '[data-guide="guide-expense-popup-title"]',
      '[data-guide="guide-academics-popup-title"]',
      '[data-guide="guide-meetings-popup-title"]',
      '[data-guide="guide-timetable-popup-title"]',
      '[data-guide="guide-exam-popup-title"]',
      '[data-guide="guide-enrollment-popup-title"]',
      '[data-guide="guide-attendance-popup-title"]',
      '[data-guide="guide-recruitment-popup-title"]',
      '[data-guide="guide-events-popup-title"]',
    ];

    const isAnyPopupStillOpen = () => {
      const hasVisibleCloseButton = Array.from(
        document.querySelectorAll("button")
      ).some((btn) => {
        const label = btn.textContent?.trim().toLowerCase();
        return label === "close" && isVisibleElement(btn);
      });

      if (hasVisibleCloseButton) return true;

      return popupPresenceSelectors.some((selector) => {
        const popupEl = document.querySelector(selector);
        return isVisibleElement(popupEl);
      });
    };


    const focusStepElement = () => {
      const el = document.querySelector(step.selector);

            if (el && isVisibleElement(el)) {
        applyHighlight(el);

        if (currentStep > 2) {
          const rect = el.getBoundingClientRect();
          const isOutOfView =
            rect.top < 80 || rect.bottom > window.innerHeight - 80;

          if (isOutOfView) {
            el.scrollIntoView({
              behavior: "auto",
              block: "center",
            });
          }
        }

        return;
      }


      if (!isAnyPopupStillOpen()) {
        stopGuide();
        return;
      }

      if (tries < maxTries) {
        tries += 1;
        queueEffectTimeout(focusStepElement, 220);
        return;
      }

      stopGuide();
    };

    queueEffectTimeout(focusStepElement, 120);
  }





   return () => {
    effectTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    allSelectors.forEach((selector) => {
      const el = document.querySelector(selector);
      if (el) clearHighlight(el);
    });
  };

}, [isGuideActive, currentStep, currentModule, activeSteps]);
   
  useEffect(() => {
    if (!isGuideActive) return;

    const syncSpotlightToCurrent = () => {
      const highlightedEl = document.querySelector(".guide-highlight-base");
      if (highlightedEl) {
        setSpotlightFromElement(highlightedEl);
      }
    };

    const isVisibleElement = (el) => {
      if (!el) return false;

      const style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        return false;
      }

      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const popupPresenceSelectors = [
      ".globalpopup-close-btn",
      ".fee-popup-close",
      ".popup-close-btn",
      ".previousrecord-close-btn",
      ".modalOverlayStyle",
      ".expense-popup",
      ".fee-popup-overlay",
      ".popup-overlay",
      ".previousrecord-popup-overlay",
      ".staff-modal-overlay",
      ".staff-academic-ledger-overlay",
      ".at-modal-overlay",
      ".store-report-modal",
      '[data-guide="guide-income-popup-title"]',
      '[data-guide="guide-expense-popup-title"]',
      '[data-guide="guide-academics-popup-title"]',
      '[data-guide="guide-meetings-popup-title"]',
      '[data-guide="guide-timetable-popup-title"]',
      '[data-guide="guide-exam-popup-title"]',
      '[data-guide="guide-enrollment-popup-title"]',
      '[data-guide="guide-attendance-popup-title"]',
      '[data-guide="guide-recruitment-popup-title"]',
      '[data-guide="guide-events-popup-title"]',
    ];

    const isAnyPopupStillOpen = () => {
      const hasVisibleCloseButton = Array.from(
        document.querySelectorAll("button")
      ).some((btn) => {
        const label = btn.textContent?.trim().toLowerCase();
        return label === "close" && isVisibleElement(btn);
      });

      if (hasVisibleCloseButton) return true;

      return popupPresenceSelectors.some((selector) => {
        const popupEl = document.querySelector(selector);
        return isVisibleElement(popupEl);
      });
    };

    const handleViewportChange = () => {
      window.requestAnimationFrame(syncSpotlightToCurrent);
    };

    const pendingTimeouts = [];

    const queueGuideCloseCheck = () => {
      const runCheck = () => {
        if (currentStep < 2) return;
        if (!isAnyPopupStillOpen()) {
          stopGuide();
        }
      };

      window.requestAnimationFrame(runCheck);
      pendingTimeouts.push(setTimeout(runCheck, 120));
      pendingTimeouts.push(setTimeout(runCheck, 260));
    };

    const handleOutsideInteraction = (event) => {
      if (currentStep < 2) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest(".guide-tooltip")) return;

      queueGuideCloseCheck();
    };

    const t = setTimeout(syncSpotlightToCurrent, 50);

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    document.addEventListener("mousedown", handleOutsideInteraction, true);
    document.addEventListener("touchstart", handleOutsideInteraction, true);

    return () => {
      clearTimeout(t);
      pendingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      document.removeEventListener("mousedown", handleOutsideInteraction, true);
      document.removeEventListener("touchstart", handleOutsideInteraction, true);
    };
  }, [isGuideActive, currentModule, currentStep, activeSteps, stopGuide]);




  if (!isGuideActive) {

  // 🔴 CLOSE ANY OPEN POPUP WHEN GUIDE STOPS
  const openPopupCloseBtn =
    document.querySelector(".globalpopup-close-btn") ||
    document.querySelector(".fee-popup-close") ||
    document.querySelector(".popup-close-btn") ||
    document.querySelector(".previousrecord-close-btn") ||
    Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.textContent?.trim().toLowerCase() === "close"
    );

  if (openPopupCloseBtn) {
    openPopupCloseBtn.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      })
    );
  }

  return null;
}

   return (
    <div className="guide-overlay-root">
            {spotlightRect ? (
        <div
          className={`guide-spotlight-cutout${
            currentStep <= 3 ? " guide-spotlight-cutout-no-transition" : ""
          }`}
          style={{
            top: `${spotlightRect.top}px`,
            left: `${spotlightRect.left}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`,
            borderRadius: `${spotlightRect.radius}px`,
          }}
        />
      ) : (
        <div className="guide-overlay-fallback" />
      )}

    </div>
  );

};

export default GuideOverlay;