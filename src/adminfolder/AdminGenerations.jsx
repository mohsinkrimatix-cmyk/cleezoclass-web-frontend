import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight, FaPlus, FaUser } from "react-icons/fa";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./AccountantDashboardnew.css";
import "./AdminDashboardNew.css";
import "../frontdeskdahboard/FrontDesk.css";
import "./AdminEventsAndMeetings.css";
import EditableProfileMenu from "../shared/EditableProfileMenu.jsx";
import ErrorPopup from "../shared/ErrorPopup";
import AdmissionTimetableNew from "../shared/AdmissionTimetableNew.jsx";
import CompactTextTabs from "../shared/CompactTextTabs.jsx";
import InstituteBrand from "../shared/InstituteBrand.jsx";
import { resolveInstituteDisplayName } from "../shared/instituteNameUtils";
import { getUserDisplayName } from "../shared/userDisplayName";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import abcLogo from "../assets/logoab.png";
import dashboardIcon from "../assets/Dashboard.png";
import academicsIcon from "../assets/Staff Assign.png";
import leadProfileIcon from "../assets/Lead Profile.png";
import enrollmentIcon from "../assets/Enrollment.png";
import reportsIcon from "../assets/Reports .png";
import timelineIcon from "../assets/Timeline.png";
import followupIcon from "../assets/Profile.png";
import assistantIcon from "../assets/Assistant.png";
import communicationIcon from "../assets/Communication Assign.png";
import { FiHelpCircle } from "react-icons/fi";
import HelpCenter from "../shared/HelpCenter.jsx";
import TaskOfTheDay from "../shared/TaskOfTheDay.tsx";
const API_BASE = "https://cleezoclass.com:4000/api";

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: dashboardIcon, route: "/AdminDashboard" },
  { key: "academics", label: "Academics", icon: academicsIcon, route: "/AdiminAcademicsNew" },
  { key: "events", label: "Events & Meetings", icon: leadProfileIcon, route: "/AdminEventsAndMeetings" },
        { key: "communication", label: "Generations", icon: communicationIcon ,route: "/AdminGenerations"},
    { key: "store", label: "Store", icon: enrollmentIcon, route: "/AdminStoreNew" },

  { key: "report", label: "Report", icon: reportsIcon, route: "/AdminReportsPage" },
];

const quickCards = [
  { key: "livechat", title: "Live Chat", subtitle: "Approvals / Requests", icon: timelineIcon },
  { key: "storepo", title: "Store PO", subtitle: "Request Order / PO issue", icon: followupIcon },
  { key: "assistant", title: "Assistant", subtitle: "Daily Activity check", icon: assistantIcon },
];

const reminderItems = [
  "Reminder - 30/03/2026 - Class XA, Performance report issue",
  "Reminder - 30/03/2026 - Store, Request Order for Uniform",
];

const requests = [
  "Live Chat (P - T) - 30/03/2026, 3.00pm - G. Vinay, 10A to C.T.",
  "Live Chat (T - P) - 31/03/2026, 11.00am - C.T. to N. Somesh, 10A",
];

const scheduled = [
  "Live Chat (T - P) - 26/03/2026, 3.00pm - L. Haritha, 7A to C.T.",
  "Live Chat (T - P) - 27/03/2026, 10.45am - C.T. to P. Sailaja, 10A",
];

const demoStudents = [
  "M. Vijaya Raju",
  "C. Kalyan Ram",
  "S. Aishq Ali",
];

const demoStaff = [
  "J. Anush Reddy",
  "J. Anush Reddy",
  "J. Anush Reddy",
];

const REPORT_TEMPLATE_STORAGE_KEY = "reportCardSelectedTemplate";
const REPORT_TEMPLATE_SELECTED_AT_KEY = "reportCardSelectedAt";
const REPORT_CARD_ADMIN_LAUNCH_KEY = "reportCardAdminLaunchConfig";
const DEFAULT_REPORT_TEMPLATE = "report1.html";
const ID_CARD_TEMPLATE_STORAGE_KEY = "idCardSelectedTemplate";
const DEFAULT_ID_CARD_TEMPLATE = "idcard1.html";
const ID_CARD_CAPTURE_WIDTH = 340;
const ID_CARD_CAPTURE_HEIGHT = 540;
const ID_CARD_PDF_WIDTH_MM = 54;
const ID_CARD_PDF_HEIGHT_MM = 86;
const ID_CARD_PDF_MARGIN_MM = 2;
const ID_CARD_PDF_GAP_MM = 2;
const ID_CARD_FRONT_BACK_GAP_PX = 28;
const ID_CARD_ASPECT_RATIO = ID_CARD_CAPTURE_WIDTH / ID_CARD_CAPTURE_HEIGHT;

const normalizeReportTemplateName = (value) => {
  const template = String(value || "").trim().toLowerCase();
  return /^report(?:[1-9]|1[0-9])\.html$/.test(template) ? template : DEFAULT_REPORT_TEMPLATE;
};

const reportCardFormats = [
  { id: "report1.html", label: " Report Card 1" },
  { id: "report2.html", label: " Report Card 2" },
  { id: "report3.html", label: " Report Card 3" },
  { id: "report4.html", label: " Report Card 4" },
  { id: "report5.html", label: " Report Card 5" },
  { id: "report6.html", label: " Report Card 6" },
  { id: "report7.html", label: " Report Card 7" },
  { id: "report8.html", label: " Report Card 8" },
  { id: "report9.html", label: " Report Card 9" },
  { id: "report10.html", label: " Report Card 10" },
  { id: "report11.html", label: " Report Card 11" },
  { id: "report12.html", label: " Report Card 12" },

];

// const reportCardFormats = Array.from({length:12},(_, index) => {
//   const cardNumber = index + 1
//   return {id: `reports${cardNumber}.html`, label: `Report Card Template ${cardNumber}`}
// });

const normalizeIdCardTemplateName = (value) => {
  const template = String(value || "").trim().toLowerCase();
  return /^idcard(?:[1-9]|1[0-9]|2[0-6])\.html$/.test(template) ? template : DEFAULT_ID_CARD_TEMPLATE;
};

const idCardFormats = Array.from({ length: 26 }, (_, index) => {
  const cardNumber = index + 1
  return { id: `idcard${cardNumber}.html`, label: ` ID Card Template ${cardNumber}` };
});

const getPdfPageSize = (paperSize) => {
  if (paperSize === "letter") return { width: 215.9, height: 279.4 };
  if (paperSize === "legal") return { width: 215.9, height: 355.6 };
  return { width: 210, height: 297 };
};

const getRequestedIdCardGrid = (pdfLayout) => {
  if (pdfLayout === 2) return { cols: 2, rows: 1 };
  if (pdfLayout === 4) return { cols: 2, rows: 2 };
  if (pdfLayout === 8) return { cols: 4, rows: 2 };
  if (pdfLayout === 10) return { cols: 5, rows: 2 };
  if (pdfLayout === 12) return { cols: 4, rows: 3 };
  return { cols: 1, rows: 1 };
};

const getFixedIdCardPdfLayout = (paperSize, pdfLayout) => {
  const basePage = getPdfPageSize(paperSize);
  const requestedGrid = getRequestedIdCardGrid(pdfLayout);

  const fitForOrientation = (landscape) => {
    const pageWidth = landscape ? basePage.height : basePage.width;
    const pageHeight = landscape ? basePage.width : basePage.height;
    const availableWidth = pageWidth - ID_CARD_PDF_MARGIN_MM * 2;
    const availableHeight = pageHeight - ID_CARD_PDF_MARGIN_MM * 2;
    const maxCols = Math.max(
      1,
      Math.floor((availableWidth + ID_CARD_PDF_GAP_MM) / (ID_CARD_PDF_WIDTH_MM + ID_CARD_PDF_GAP_MM))
    );
    const maxRows = Math.max(
      1,
      Math.floor((availableHeight + ID_CARD_PDF_GAP_MM) / (ID_CARD_PDF_HEIGHT_MM + ID_CARD_PDF_GAP_MM))
    );
    const cols = Math.min(requestedGrid.cols, maxCols);
    const rows = Math.min(requestedGrid.rows, maxRows);

    return {
      pageWidth,
      pageHeight,
      orientation: landscape ? "landscape" : "portrait",
      cols,
      rows,
      perPage: cols * rows,
    };
  };

  const portrait = fitForOrientation(false);
  const landscape = fitForOrientation(true);
  const selected = landscape.perPage > portrait.perPage ? landscape : portrait;

  return {
    ...selected,
  };
};

// 🔥 DUPLEX PRINTING LAYOUT
// Builds ONE fixed array of physical card slots (in mm) for a given paper
// size + requested "cards per page" layout, sized to the card's REAL
// captured aspect ratio. This same `slots` array is reused, unmodified,
// for both the FRONT page and the BACK page of a sheet — so slot N always
// occupies the identical physical (x, y, width, height) on both sides.
// That is what makes front/back line up when the sheet is duplex-printed.
const ID_CARD_DUPLEX_MARGIN_MM = 10;
// 5px card-to-card gap, converted to mm using the standard CSS px (1px = 1/96in, 1in = 25.4mm).
const ID_CARD_DUPLEX_GAP_MM = (5 * 25.4) / 96;

const buildIdCardDuplexSlots = ({ paperSize }) => {
  const basePage = getPdfPageSize(paperSize);
  const margin = ID_CARD_DUPLEX_MARGIN_MM;
  const gap = ID_CARD_DUPLEX_GAP_MM;
  // Fixed TRUE physical card size (54mm x 86mm) — not derived from the
  // captured canvas ratio, so every printed card measures exactly this.
  const cardWidth = ID_CARD_PDF_WIDTH_MM;
  const cardHeight = ID_CARD_PDF_HEIGHT_MM;

  const fitForOrientation = (landscape) => {
    const pageWidth = landscape ? basePage.height : basePage.width;
    const pageHeight = landscape ? basePage.width : basePage.height;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    // Fit as many fixed-size cards as possible, using only the 5px gap
    // between adjacent cards.
    const cols = Math.max(1, Math.floor((availableWidth + gap) / (cardWidth + gap)));
    const rows = Math.max(1, Math.floor((availableHeight + gap) / (cardHeight + gap)));

    const gridWidth = cardWidth * cols + gap * (cols - 1);
    const gridHeight = cardHeight * rows + gap * (rows - 1);
    const startX = (pageWidth - gridWidth) / 2;
    const startY = (pageHeight - gridHeight) / 2;

    const slots = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        slots.push({
          x: startX + col * (cardWidth + gap),
          y: startY + row * (cardHeight + gap),
          width: cardWidth,
          height: cardHeight,
        });
      }
    }

    return {
      pageWidth,
      pageHeight,
      orientation: landscape ? "landscape" : "portrait",
      slots,
      cardWidth,
      cardHeight,
    };
  };

  const portrait = fitForOrientation(false);
  const landscape = fitForOrientation(true);
  // Pick whichever orientation fits more cards on the sheet.
  return landscape.slots.length > portrait.slots.length ? landscape : portrait;
};

const getIdCardPdfImageBox = (canvas, maxWidth = ID_CARD_PDF_WIDTH_MM, maxHeight = ID_CARD_PDF_HEIGHT_MM) => {
  const canvasWidth = Number(canvas?.width) || maxWidth;
  const canvasHeight = Number(canvas?.height) || maxHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  const boxRatio = maxWidth / maxHeight;

  if (canvasRatio > boxRatio) {
    return {
      width: maxWidth,
      height: maxWidth / canvasRatio,
      offsetX: 0,
      offsetY: (maxHeight - maxWidth / canvasRatio) / 2,
    };
  }

  return {
    width: maxHeight * canvasRatio,
    height: maxHeight,
    offsetX: (maxWidth - maxHeight * canvasRatio) / 2,
    offsetY: 0,
  };
};

const addIdCardCanvasToPdf = (pdf, canvas, x, y, options = {}) => {
  const { drawBorder = true, printOptions = {} } = options;
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const imageBox = getIdCardPdfImageBox(canvas);
  const imageX = x + imageBox.offsetX;
  const imageY = y + imageBox.offsetY;

  pdf.addImage(imgData, 'JPEG', imageX, imageY, imageBox.width, imageBox.height);

  if (drawBorder) {
    pdf.setDrawColor(90, 90, 90);
    pdf.setLineWidth(0.25);
    pdf.rect(imageX, imageY, imageBox.width, imageBox.height);
  }

  if (printOptions.cutGuidelines) {
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.1);
    pdf.setLineDashPattern([1, 1], 0);
    pdf.rect(imageX, imageY, imageBox.width, imageBox.height);
    pdf.setLineDashPattern([], 0);
  }

  return { imageX, imageY, imageWidth: imageBox.width, imageHeight: imageBox.height };
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawCanvasContained = (ctx, sourceCanvas, x, y, maxWidth, maxHeight) => {
  const sourceWidth = Number(sourceCanvas?.width) || 1;
  const sourceHeight = Number(sourceCanvas?.height) || 1;
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const drawX = x + (maxWidth - width) / 2;
  const drawY = y + (maxHeight - height) / 2;

  ctx.shadowColor = "rgba(15, 23, 42, 0.25)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;
  ctx.drawImage(sourceCanvas, drawX, drawY, width, height);
  ctx.shadowColor = "transparent";

  return { x: drawX, y: drawY, width, height };
};

const drawCanvasInFixedCardBox = (ctx, sourceCanvas, x, y, width, height) => {
  if (!sourceCanvas) return;

  ctx.save();
  drawRoundedRect(ctx, x, y, width, height, 6);
  ctx.clip();

  const sourceWidth = Number(sourceCanvas.width) || 1;
  const sourceHeight = Number(sourceCanvas.height) || 1;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = width / height;

  // "Contain" fit (letterbox) instead of "cover" (crop). The slot is sized
  // to match the card's real aspect ratio, so this is normally a no-op —
  // but if the captured canvas ever drifts slightly (e.g. due to
  // fitContentToCard scaling), this guarantees the full card is still
  // shown rather than silently cropping off part of the photo/template.
  let drawWidth = width;
  let drawHeight = height;
  if (sourceRatio > targetRatio) {
    drawHeight = width / sourceRatio;
  } else if (sourceRatio < targetRatio) {
    drawWidth = height * sourceRatio;
  }
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  ctx.shadowColor = "rgba(15, 23, 42, 0.25)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;
  ctx.drawImage(sourceCanvas, 0, 0, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);
  ctx.shadowColor = "transparent";
  ctx.restore();
};

const createIdCardPreviewTileCanvas = ({ student, frontCanvas, backCanvas, targetType }) => {
  const canvas = document.createElement("canvas");
  const scale = 2;
  const tileWidth = 760;
  const tileHeight = 650;
  const padding = 22;
  const frameX = padding;
  const frameY = padding;
  const frameWidth = tileWidth - padding * 2;
  const frameHeight = 528;
  const gap = 34;
  const cardSideInset = 18;

  // Size the two card slots using the card's ACTUAL captured aspect ratio
  // (read from the real canvas, not a hardcoded constant). The template's
  // true intrinsic ratio doesn't necessarily match ID_CARD_CAPTURE_WIDTH/
  // HEIGHT (confirmed via logging: captures came back as 900x1260 ≈ 0.714,
  // not the assumed 340x540 ≈ 0.630). Using the real canvas ratio here
  // guarantees the tile slot always matches the card exactly, regardless
  // of what the template's actual rendered size turns out to be.
  const sourceForRatio = frontCanvas || backCanvas;
  const actualCardRatio =
    sourceForRatio && sourceForRatio.height
      ? sourceForRatio.width / sourceForRatio.height
      : ID_CARD_ASPECT_RATIO;

  const maxSlotHeight = frameHeight - 62;
  const maxSlotWidth = (frameWidth - gap - cardSideInset * 2) / 2;
  let cardSlotHeight = maxSlotHeight;
  let cardSlotWidth = cardSlotHeight * actualCardRatio;
  if (cardSlotWidth > maxSlotWidth) {
    cardSlotWidth = maxSlotWidth;
    cardSlotHeight = cardSlotWidth / actualCardRatio;
  }

  canvas.width = tileWidth * scale;
  canvas.height = tileHeight * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = "#f8fafc";
  drawRoundedRect(ctx, 0.5, 0.5, tileWidth - 1, tileHeight - 1, 16);
  ctx.fill();
  ctx.strokeStyle = "#d6d6d6";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#c7c7c7";
  drawRoundedRect(ctx, frameX, frameY, frameWidth, frameHeight, 14);
  ctx.fill();

  // Center the front/back pair horizontally and vertically within the frame
  // (their combined size can now be smaller than the frame on either axis).
  const pairWidth = cardSlotWidth * 2 + gap;
  const firstSlotX = frameX + (frameWidth - pairWidth) / 2;
  const secondSlotX = firstSlotX + cardSlotWidth + gap;
  const slotY = frameY + 35 + (maxSlotHeight - cardSlotHeight) / 2;
  drawCanvasInFixedCardBox(ctx, frontCanvas, firstSlotX, slotY, cardSlotWidth, cardSlotHeight);
  drawCanvasInFixedCardBox(ctx, backCanvas, secondSlotX, slotY, cardSlotWidth, cardSlotHeight);

  const name =
    student?.name ||
    student?.teacher_name ||
    student?.student_name ||
    student?.studentName ||
    (targetType === "teacher" ? "Teacher" : "Student");
  const className =
    student?.designation ||
    student?.class_name ||
    student?.class ||
    student?.className ||
    student?.classname ||
    "-";
  const section =
    student?.department ||
    student?.dept ||
    student?.section ||
    student?.section_name ||
    student?.sectionName ||
    student?.sec ||
    "-";

  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";
  ctx.font = "700 18px Arial, sans-serif";
  ctx.fillText(name, tileWidth / 2, frameY + frameHeight + 34);
  ctx.fillStyle = "#64748b";
  ctx.font = "14px Arial, sans-serif";
  ctx.fillText(
    targetType === "teacher"
      ? `${className}${section && section !== "-" ? ` | ${section}` : ""}`
      : `Class ${className} | Sec ${section}`,
    tileWidth / 2,
    frameY + frameHeight + 62
  );

  return canvas;
};

const generationTemplates = [
  { key: "blue", className: "theme-blue" },
  { key: "green", className: "theme-green" },
  { key: "gold", className: "theme-gold" },
  { key: "coral", className: "theme-coral" },
  { key: "multi", className: "theme-multi" },
  { key: "upload", className: "theme-upload", isUpload: true },
];

const birthdayPosterTemplates = [
  { id: "birthday1.html", label: "Birthday Template 1" },
  { id: "birthday2.html", label: "Birthday Template 2" },
  { id: "birthday3.html", label: "Birthday Template 3" },
  { id: "birthday4.html", label: "Birthday Template 4" },
  { id: "birthday5.html", label: "Birthday Template 5" },
];

const eventPosterTemplates = [
  { id: "event1.html", label: "Event Template 1" },
  { id: "event2.html", label: "Event Template 2" },
  { id: "event3.html", label: "Event Template 3" },
  { id: "event4.html", label: "Event Template 4" },
  { id: "event5.html", label: "Event Template 5" },
  { id: "event6.html", label: "Event Template 6" },
];

const posterTemplateTabs = ["Student", "Staff", "All"];
const posterTemplateTypes = ["Events", "B-days", "All"];

const formatDateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTimeLabel = (value) => {
  if (!value) return "--";
  const raw = String(value).trim();
  if (!raw) return "--";
  const [hour = "00", minute = "00"] = raw.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const isSameMonthYear = (value, year, monthIndex) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === year && date.getMonth() === monthIndex;
};

const getDaySet = (items, key, year, monthIndex) =>
  new Set(
    (Array.isArray(items) ? items : [])
      .filter((item) => isSameMonthYear(item?.[key], year, monthIndex))
      .map((item) => new Date(item[key]).getDate())
  );

const formatChatDateTime = (dateValue, timeValue) => {
  const dateLabel = dateValue ? formatDateLabel(dateValue) : "-";
  const timeLabel = timeValue ? formatTimeLabel(timeValue) : "--";
  return `${dateLabel}, ${timeLabel}`;
};

const formatDobValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeInstituteLogo = (rawLogo) => {
  if (!rawLogo) return "";

  let logo = rawLogo;

  if (typeof logo === "object" && logo?.type === "Buffer" && Array.isArray(logo?.data)) {
    try {
      logo = new Uint8Array(logo.data);
    } catch {
      return "";
    }
  }

  if (logo instanceof Uint8Array) {
    const binary = Array.from(logo, (byte) => String.fromCharCode(byte)).join("");
    return `data:image/png;base64,${btoa(binary)}`;
  }

  if (typeof logo !== "string") return "";
  logo = logo.trim();
  if (!logo) return "";
  if (logo.startsWith("data:image")) return logo;
  if (logo.startsWith("http")) return logo;

  if (logo.startsWith("0x")) {
    try {
      const hex = logo.slice(2);
      let binary = "";
      for (let i = 0; i < hex.length; i += 2) {
        binary += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
      return `data:image/png;base64,${btoa(binary)}`;
    } catch {
      return "";
    }
  }

  if (logo.startsWith("uploads/")) {
    return `https://cleezoclass.com:4000/${logo}`;
  }
  if (logo.startsWith("/uploads/")) {
    return `https://cleezoclass.com:4000${logo}`;
  }

  if (/^[A-Za-z0-9+/=]+$/.test(logo) && logo.length > 100) {
    return `data:image/png;base64,${logo}`;
  }

  return "";
};

const uniqueSortedValues = (items) =>
  Array.from(new Set((Array.isArray(items) ? items : []).filter(Boolean).map((item) => String(item).trim()))).sort(
    (left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" })
  );

const romanToNumber = (value) => {
  const roman = String(value || "").trim().toUpperCase();
  if (!/^[IVXLCDM]+$/.test(roman)) return null;
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  let prev = 0;
  for (let i = roman.length - 1; i >= 0; i -= 1) {
    const current = map[roman[i]] || 0;
    if (current < prev) total -= current;
    else total += current;
    prev = current;
  }
  return total > 0 ? total : null;
};

const normalizeClassValue = (value) => {
  let normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "";

  normalized = normalized
    .replace(/\b(CLASS|STD|STANDARD|GRADE)\b/g, "")
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const compact = normalized.replace(/\s+/g, "");
  const compactMatch = compact.match(/^(\d+|[IVXLCDM]+)([A-Z]{0,2})$/);
  if (!compactMatch) return compact;

  const rawNumber = compactMatch[1];
  const suffix = compactMatch[2] || "";
  const numeric =
    /^\d+$/.test(rawNumber) ? Number(rawNumber) : romanToNumber(rawNumber);
  if (!Number.isFinite(numeric)) return compact;
  return `${numeric}${suffix}`;
};

const normalizeClassCollection = (data) => {
  if (Array.isArray(data)) {
    return uniqueSortedValues(
      data.map((item) =>
        typeof item === "string"
          ? item
          : item?.class_name || item?.className || item?.class || item?.name || item?.value || ""
      )
    );
  }

  if (data && typeof data === "object") {
    const candidates = [
      data.classOptions,
      data.classes,
      data.data,
      data.result,
      data.school,
      data.students,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return normalizeClassCollection(candidate);
      }
    }
  }

  return [];
};

const normalizeStudentCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const nestedCandidates = [
    payload.students,
    payload.school,
    payload.data,
    payload.result,
    payload.rows,
    payload.items,
    payload.records,
    payload.response?.data,
    payload.data?.students,
    payload.data?.school,
    payload.data?.result,
    payload.result?.students,
    payload.result?.data,
  ];

  for (const candidate of nestedCandidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const getClassSortParts = (value) => {
  const normalized = normalizeClassValue(value);
  const match = normalized.match(/^(\d+)([A-Z]*)$/);
  if (match) return [Number(match[1]), match[2] || ""];
  return [Number.MAX_SAFE_INTEGER, normalized];
};

const compareClassValues = (left, right) => {
  const [leftNumber, leftSuffix] = getClassSortParts(left);
  const [rightNumber, rightSuffix] = getClassSortParts(right);
  if (leftNumber !== rightNumber) return leftNumber - rightNumber;
  return String(leftSuffix).localeCompare(String(rightSuffix));
};

const resolveIdCardPhotoUrl = (rawPhoto) => {
  if (!rawPhoto) return "";

  let photoPath = rawPhoto;

  if (rawPhoto && typeof rawPhoto === "object" && rawPhoto.data) {
    try {
      const byteArray = new Uint8Array(rawPhoto.data);
      photoPath = new TextDecoder().decode(byteArray);
    } catch {
      photoPath = "";
    }
  }

  const decodeHexPhotoPath = (value) => {
    const hexValue = String(value || "").replace(/^0x/i, "");
    if (!hexValue || hexValue.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hexValue)) {
      return "";
    }
    try {
      return hexValue
        .match(/.{2}/g)
        ?.map((byte) => String.fromCharCode(parseInt(byte, 16)))
        .join("") || "";
    } catch {
      return "";
    }
  };

  if (!photoPath) return "";
  if (typeof photoPath !== "string") return "";

  let trimmed = photoPath.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("0x")) {
    trimmed = decodeHexPhotoPath(trimmed) || trimmed;
  } else if (/^(?:[0-9a-f]{2}){6,}$/i.test(trimmed)) {
    const decoded = decodeHexPhotoPath(trimmed).trim();
    if (/^(?:\/?public\/)?uploads\//i.test(decoded) || decoded.startsWith("/") || decoded.startsWith("http")) {
      trimmed = decoded;
    }
  }
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("/public/uploads/")) {
    return `https://cleezoclass.com:4000${trimmed.replace("/public", "")}`;
  }
  if (trimmed.startsWith("public/uploads/")) {
    return `https://cleezoclass.com:4000/${trimmed.replace(/^public\//, "")}`;
  }
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 100) {
    return `data:image/png;base64,${trimmed}`;
  }
//   if (!trimmed.startsWith("/")) return `https://cleezoclass.com:4000/${trimmed}`;
//   return `https://cleezoclass.com:4000${trimmed}`;
// };

  if (!trimmed.startsWith("/")) return `https://cleezoclass.com:4000/${trimmed}`;
  return `https://cleezoclass.com:4000${trimmed}`;
};

// Stable identifier helper to prevent student-photo mismatch
const getStudentUniqueId = (student, fallbackIndex = 0) => {
  if (!student) return `item_${fallbackIndex}`;
  return String(
    student.id ??
    student.student_id ??
    student.studentId ??
    student.teacher_id ??
    student.teacherId ??
    student.emp_id ??
    student.employee_id ??
    student.user_id ??
    student.userId ??
    student._id ??
    student.admission_number ??
    student.admission_no ??
    student.admissionNo ??
    student.roll_no ??
    student.rollNo ??
    student.phone ??
    student.mobile ??
    student.email ??
    student.username ??
    student.name ??
    `item_${fallbackIndex}`
  );
};

// Extract raw photo field regardless of API field variation
const getStudentRawPhoto = (student) => {
  if (!student) return "";
  return (
    student.photo ||
    student.student_photo ||
    student.studentPhoto ||
    student.teacher_photo ||
    student.teacherPhoto ||
    student.user_photo ||
    student.userPhoto ||
    student.photo_url ||
    student.photoUrl ||
    student.student_photo_url ||
    student.profile_photo ||
    student.profilePhoto ||
    student.profile_image ||
    student.profileImage ||
    student.image ||
    student.image_url ||
    student.imageUrl ||
    student.student_image ||
    student.studentImage ||
    student.avatar ||
    ""
  );
};
// Preloads, converts, and centers student photos to a 1:1 square canvas (eliminating html2canvas side-cropping & stretching)
const loadAndConvertImageToDataUrl = async (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let settled = false;

    const done = (result) => {
      if (settled) return;
      settled = true;
      resolve(result || "");
    };

    const timer = setTimeout(() => done(trimmed), 4500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const nw = img.naturalWidth || img.width || 500;
        const nh = img.naturalHeight || img.height || 500;

        // Scale and center onto a standard 500x500 square canvas
        const targetSize = 500;
        const scale = Math.max(targetSize / nw, targetSize / nh);
        const renderW = nw * scale;
        const renderH = nh * scale;
        const offsetX = (targetSize - renderW) / 2;
        const offsetY = (targetSize - renderH) / 2;

        const offscreen = document.createElement("canvas");
        offscreen.width = targetSize;
        offscreen.height = targetSize;
        const ctx = offscreen.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
        done(offscreen.toDataURL("image/jpeg", 0.95));
      } catch {
        done(trimmed);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      done(trimmed);
    };

    img.src = trimmed;
    if (img.complete && img.naturalWidth > 0) {
      img.onload();
    }
  });
};

// Chunked preloading maintaining studentId -> dataUrl association
const preloadStudentPhotosInChunks = async (students, chunkSize = 8, onProgress = null) => {
  const photoCache = new Map();
  const list = Array.isArray(students) ? students : [];
  let processed = 0;

  for (let i = 0; i < list.length; i += chunkSize) {
    const chunk = list.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (student, index) => {
        const studentId = getStudentUniqueId(student, i + index);
        const rawPhoto = getStudentRawPhoto(student);
        const resolvedUrl = resolveIdCardPhotoUrl(rawPhoto);

        if (!resolvedUrl) {
          photoCache.set(studentId, { status: "missing", dataUrl: "" });
        } else {
          try {
            const dataUrl = await loadAndConvertImageToDataUrl(resolvedUrl);
            if (dataUrl) {
              photoCache.set(studentId, { status: "loaded", dataUrl });
            } else {
              photoCache.set(studentId, { status: "failed", dataUrl: "" });
            }
          } catch (err) {
            console.warn(`Photo load failed for student ${studentId}:`, err);
            photoCache.set(studentId, { status: "failed", dataUrl: "" });
          }
        }
        processed += 1;
        if (onProgress) onProgress(processed, list.length);
      })
    );
  }

  return photoCache;
};


const applyReportPreviewFit = (iframe) => {
  if (!iframe?.contentWindow?.document) return;

  const doc = iframe.contentWindow.document;
  const html = doc.documentElement;
  const body = doc.body;
  if (!html || !body) return;

  const reportRoot =
    doc.querySelector(".report-card") ||
    doc.querySelector(".sheet") ||
    doc.querySelector(".report") ||
    doc.querySelector(".container") ||
    doc.querySelector(".page") ||
    doc.querySelector(".card") ||
    doc.querySelector(".report-wrapper") ||
    doc.querySelector(".landscape-wrap");

  const availableWidth = Math.max((iframe.clientWidth || 0) - 12, 320);
  const contentWidth = Math.max(
    reportRoot?.scrollWidth || 0,
    body.scrollWidth || 0,
    html.scrollWidth || 0,
    1
  );
  const scale = Math.min(1, availableWidth / contentWidth);

  let previewStyle = doc.getElementById("report-preview-fit-style");
  if (!previewStyle) {
    previewStyle = doc.createElement("style");
    previewStyle.id = "report-preview-fit-style";
    doc.head?.appendChild(previewStyle);
  }

  previewStyle.textContent = `
    html, body {
      overflow-x: hidden !important;
      background: #eef2f7 !important;
    }
    body {
      margin: 0 !important;
      padding: 8px !important;
    }
    .report-card, .sheet, .report, .container, .page, .card, .report-wrapper, .landscape-wrap {
      margin-left: auto !important;
      margin-right: auto !important;
    }
  `;

  body.style.transformOrigin = "top left";
  body.style.transform = `scale(${scale})`;
  body.style.width = `${100 / scale}%`;
  body.style.minHeight = `${Math.ceil((body.scrollHeight || html.scrollHeight || 0) * scale) + 16}px`;
};

const filterStudentsByClassRange = (students, fromClass, toClass) => {
  const start = String(fromClass || "").trim();
  const end = String(toClass || "").trim();
  const hasStart = Boolean(start);
  const hasEnd = Boolean(end);

  if (!hasStart && !hasEnd) return [];

  let lowerBound = start;
  let upperBound = end;
  if (hasStart && hasEnd && compareClassValues(start, end) > 0) {
    lowerBound = end;
    upperBound = start;
  }

  return (Array.isArray(students) ? students : []).filter((student) => {
    const className = normalizeClassValue(
      student?.class_name || student?.class || student?.className || student?.classname || student?.standard || ""
    );
    const normalizedLowerBound = normalizeClassValue(lowerBound);
    const normalizedUpperBound = normalizeClassValue(upperBound);

    if (!className) return false;
    if (normalizedLowerBound && normalizedUpperBound) {
      return (
        compareClassValues(className, normalizedLowerBound) >= 0 &&
        compareClassValues(className, normalizedUpperBound) <= 0
      );
    }
    if (normalizedLowerBound) return className === normalizedLowerBound;
    return className === normalizedUpperBound;
  });
};

const filterStudentsByClassSection = (students, className, section) => {
  const selectedClass = normalizeClassValue(className);
  const selectedSection = String(section || "").trim().toLowerCase();

  if (!selectedClass || !selectedSection) return [];

  return (Array.isArray(students) ? students : []).filter((student) => {
    const studentClass = normalizeClassValue(
      student?.class_name || student?.class || student?.className || student?.classname || student?.standard || ""
    );
    const studentSection = String(student?.section || student?.section_name || student?.sectionName || student?.sec || "")
      .trim()
      .toLowerCase();

    return studentClass === selectedClass && studentSection === selectedSection;
  });
};

const buildIdCardPreviewUrl = (templateId, student, schoolName, schoolLogoValue = "", schoolAddressValue = "") => {
  const storage =
    typeof window !== "undefined" && window?.localStorage ? window.localStorage : { getItem: () => "" };

  // Frees up space from earlier export runs whose "idcard_*" keys were
  // never cleaned up. Each unique student photo gets its own key
  // (idcard_student_photo_<id>), so a class-sized batch — or a few
  // repeated exports — silently fills the ~5-10MB localStorage quota.
  // Once quota is hit, every further write throws and the photo was being
  // dropped entirely (this is why ALL photos could go blank in one export
  // while the live preview looked fine). We garbage-collect old idcard_*
  // entries before writing, and retry once after clearing space.
  const evictOldIdCardStorageEntries = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith("idcard_") && !k.startsWith("idcard_shared_")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => storage.removeItem(k));
    } catch {
      // ignore — best-effort cleanup only
    }
  };

  const stashLargeMediaValue = (value, keyPrefix, sharedKey = null) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const isLikelyLarge = raw.startsWith("data:image") || raw.length > 1800;
    if (!isLikelyLarge) return raw;

    const studentKeyPart = String(
      student?.id || student?.student_id || student?.admission_no || student?.admissionNo || student?.name || "student"
    )
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    const key = sharedKey || `idcard_${keyPrefix}_${studentKeyPart}`;

    try {
      storage.setItem(key, raw);
      return `storage:${key}`;
    } catch {
      // Quota exceeded — clear old idcard_* keys from previous export runs
      // and retry once instead of silently dropping the photo.
      evictOldIdCardStorageEntries();
      try {
        storage.setItem(key, raw);
        return `storage:${key}`;
      } catch {
        // Still failing even after cleanup (this single image is just too
        // large, or storage is unavailable). Fall back to passing the data
        // directly in the URL rather than dropping the photo entirely —
        // this makes a very long URL instead of a missing photo, which is
        // the better trade-off for a hidden export iframe.
        return raw;
      }
    }
  };

  const storedSchoolLogo = String(storage.getItem("schoolLogo") || "").trim();
  const storedSchoolName = String(
    storage.getItem("schoolName") || storage.getItem("school") || storage.getItem("institute_name") || ""
  ).trim();
  const storedSchoolAddress = String(storage.getItem("schoolAddress") || "").trim();
  const resolvedSchoolName = String(
    schoolName && schoolName !== "Unknown School" ? schoolName : storedSchoolName || schoolName || "ABC School"
  ).trim();
  const resolvedSchoolLogo = String(
    schoolLogoValue && schoolLogoValue !== "/default-logo.png" ? schoolLogoValue : storedSchoolLogo || schoolLogoValue || ""
  ).trim();
  const resolvedSchoolAddress = String(schoolAddressValue || storedSchoolAddress || "").trim();

  const resolvedPhoto = resolveIdCardPhotoUrl(
    student?.photo ||
      student?.student_photo ||
      student?.studentPhoto ||
      student?.photo_url ||
      student?.photoUrl ||
      student?.student_photo_url ||
      student?.profile_photo ||
      student?.profilePhoto ||
      student?.image ||
      student?.image_url ||
      student?.student_image ||
      student?.studentImage ||
      ""
  );

  // Logo is identical for every student in a batch — cache it once under a shared key
  // instead of once per student, so localStorage doesn't fill up on large class ranges.
  const safeSchoolLogo = stashLargeMediaValue(resolvedSchoolLogo, "school_logo", "idcard_shared_school_logo");
  const safeStudentPhoto = stashLargeMediaValue(resolvedPhoto, "student_photo");

  // Principal signature (optional) is also identical for every card in a batch,
  // so it's cached once under a shared key just like the school logo.
  const storedSignature = String(storage.getItem("idCardSignature") || "").trim();
  const storedSignatureScale = String(storage.getItem("idCardSignatureScale") || "").trim();
  const safeSignature = stashLargeMediaValue(storedSignature, "signature", "idcard_shared_signature");
  const storedPrincipalPhoto = String(
    storage.getItem("idCardPrincipalPhoto") || storage.getItem("principalPhoto") || ""
  ).trim();
  // const safePrincipalPhoto = stashLargeMediaValue(
  //   storedPrincipalPhoto,
  //   "principal_photo",
  //   "idcard_shared_principal_photo"
  // );

  const params = new URLSearchParams({
    school: resolvedSchoolName,
    schoolName: resolvedSchoolName,
    schoolLogo: safeSchoolLogo,
    logo: safeSchoolLogo,
    schoolAddress: resolvedSchoolAddress,
    signature: safeSignature,
    signatureScale: storedSignatureScale,
    // principalPhoto: safePrincipalPhoto,
    // principal: safePrincipalPhoto,
    name: String(student?.name || student?.student_name || student?.studentName || "Student"),
    className: String(
      student?.class_name || student?.class || student?.className || student?.classname || student?.standard || "-"
    ),
    section: String(student?.section || student?.section_name || student?.sectionName || student?.sec || "-"),
    admissionNo: String(
      student?.admission_number || student?.admissionNo || student?.admission_no || student?.admno || student?.id || "-"
    ),
    rollNo: String(student?.roll_no || student?.rollNo || student?.student_id || student?.id || "-"),
    phone: String(
      student?.parent_mobile ||
        student?.father_mobile ||
        student?.mother_mobile ||
      student?.phone_no ||
        student?.phone ||
        student?.mobile ||
        student?.mobile_no ||
        student?.student_mobile ||
        student?.contact ||
        "-"
    ),
    emergency: String(
      student?.emergency_contact || student?.parent_mobile || student?.father_mobile || student?.mother_mobile || "-"
    ),
    bloodGroup: String(student?.blood_group || student?.bloodGroup || "-"),
    dob: formatDobValue(student?.dob || student?.date_of_birth || student?.dateOfBirth || "-"),
    address: String(student?.address || student?.current_address || student?.permanent_address || "-"),
    parent: String(student?.father_name || student?.parent_name || student?.guardian_name || "-"),
    route: String(student?.route || student?.bus_route || "-"),
    photo: safeStudentPhoto,
    studentPhoto: safeStudentPhoto,
  });

  return `${import.meta.env.BASE_URL}idcards/${templateId}?${params.toString()}`;
};
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getSubjectOrderRank = (subjectName) => {
  const s = String(subjectName || "").trim().toLowerCase();
  if (!s || s === "-") return 999;

  // 1. Telugu (1st Language / Telugu)
  if (s.includes("telugu")) return 100;

  // 2. Hindi (2nd Language / Hindi)
  if (s.includes("hindi")) return 200;

  // 3. English (3rd Language / English / Special English)
  if (s.includes("english") || s === "eng") return 300;

  // 4. Mathematics / Maths
  if (s.includes("math") || s.includes("arithmetic")) return 400;

  // 5. Science (General Science, Biology, Physics, Chemistry)
  if (s.includes("science") && !s.includes("social") && !s.includes("moral") && !s.includes("computer")) {
    if (s.includes("bio")) return 520;
    if (s.includes("phy")) return 530;
    if (s.includes("chem")) return 540;
    return 510; // General Science
  }
  if (s.includes("bio") || s.includes("botany") || s.includes("zoology") || s.includes("life science")) return 520;
  if (s.includes("physic") || s.includes("phy") || s.includes("chem")) return 530;

  // 6. Social (Social Studies / Social Science / EVS)
  if (s.includes("social") || s.includes("soc.") || s.includes("evs") || s.includes("environmental")) return 600;
  if (s.includes("history") || s.includes("civics") || s.includes("geography") || s.includes("economics")) return 610;

  // 7. Any other subjects come at last
  if (s.includes("computer") || s.includes("it") || s.includes("info tech")) return 700;
  if (s.includes("p.e.t") || s.includes("pet") || s.includes("physical edu") || s.includes("sports") || s.includes("games")) return 710;
  if (s.includes("moral") || s.includes("value")) return 720;
  if (s.includes("gk") || s.includes("g.k") || s.includes("general knowledge")) return 730;
  if (s.includes("art") || s.includes("craft") || s.includes("drawing")) return 740;

  return 800;
};

const sortPerformanceSubjects = (rows) => {
  if (!Array.isArray(rows)) return [];
  return [...rows].sort((a, b) => {
    const nameA = a?.subject || a?.name || a?.subject_name || a?.title || "";
    const nameB = b?.subject || b?.name || b?.subject_name || b?.title || "";
    const rankA = getSubjectOrderRank(nameA);
    const rankB = getSubjectOrderRank(nameB);
    if (rankA !== rankB) return rankA - rankB;
    return String(nameA).localeCompare(String(nameB));
  });
};

const isStudentFullyAbsent = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return true;

  for (const row of rows) {
    if (!row) continue;
    const rowObtained = Number(row.obtainedMarks ?? row.marksObtained ?? row.marks ?? row.score);
    if (Number.isFinite(rowObtained) && rowObtained > 0 && !row.absent && String(row.status || "").toLowerCase() !== "absent") {
      return false;
    }

    if (row.tests && typeof row.tests === "object") {
      for (const entry of Object.values(row.tests)) {
        if (!entry) continue;
        const val = entry.obtained != null ? entry.obtained : entry.marksObtained != null ? entry.marksObtained : entry.marks;
        const isAb = entry.absent === true || String(entry.status || "").toLowerCase() === "absent" || String(val || "").toUpperCase() === "AB" || String(val || "").toUpperCase() === "ABSENT";
        const num = Number(val);
        if (!isAb && val != null && val !== "" && val !== "-" && Number.isFinite(num) && num > 0) {
          return false;
        }
      }
    }

    if (Array.isArray(row.FA)) {
      for (const v of row.FA) {
        if (v != null && v !== "" && v !== "-" && String(v).toUpperCase() !== "AB" && String(v).toUpperCase() !== "ABSENT") {
          const num = Number(typeof v === "object" ? (v.obtained ?? v.marks) : v);
          if (Number.isFinite(num) && num > 0) return false;
        }
      }
    }

    if (Array.isArray(row.SA)) {
      for (const v of row.SA) {
        if (v != null && v !== "" && v !== "-" && String(v).toUpperCase() !== "AB" && String(v).toUpperCase() !== "ABSENT") {
          const num = Number(typeof v === "object" ? (v.obtained ?? v.marks) : v);
          if (Number.isFinite(num) && num > 0) return false;
        }
      }
    }
  }

  return true;
};

const normalizePerformanceForTemplate = (rows) => {
  if (!Array.isArray(rows)) return [];

  const fullyAbsent = isStudentFullyAbsent(rows);

  const toFiniteNumber = (value) => {
    if (value === null || value === undefined || value === "") return NaN;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : NaN;
  };

  const isLikelyMaxField = (key) => /max|maximum|total/i.test(String(key || ""));

  const readNumericField = (entry, { maximum = false } = {}) => {
    if (entry == null) return NaN;
    if (typeof entry !== "object") return toFiniteNumber(entry);

    const numericFields = Object.entries(entry)
      .map(([key, value]) => ({ key, value: toFiniteNumber(value) }))
      .filter((field) => !Number.isNaN(field.value));

    if (!numericFields.length) return NaN;

    const match = numericFields.find((field) =>
      maximum ? isLikelyMaxField(field.key) : !isLikelyMaxField(field.key)
    );

    if (maximum) return match?.value ?? NaN;
    return match?.value ?? numericFields[0].value;
  };

  const normalizeTestEntry = (entry) => {
    const obtained = readNumericField(entry);
    const max = readNumericField(entry, { maximum: true });
    const absent =
      entry && typeof entry === "object"
        ? Boolean(entry.absent) || String(entry.status || "").toLowerCase() === "absent" || String(entry.marks_obtained || entry.obtained || "").toUpperCase() === "AB" || String(entry.marks_obtained || entry.obtained || "").toUpperCase() === "ABSENT"
        : Number.isNaN(obtained);
    const percentage =
      !Number.isNaN(obtained) && !Number.isNaN(max) && max > 0
        ? Number(((obtained / max) * 100).toFixed(2))
        : null;

    return {
      obtained: Number.isNaN(obtained) ? null : obtained,
      marksObtained: Number.isNaN(obtained) ? null : obtained,
      max: Number.isNaN(max) ? null : max,
      maxMarks: Number.isNaN(max) ? null : max,
      percentage: fullyAbsent ? null : percentage,
      absent,
      status: absent || fullyAbsent ? "Absent" : "Present",
    };
  };

  const toDisplayMark = (entry) => {
    const normalized = normalizeTestEntry(entry);
    if (fullyAbsent) return "AB";
    if (normalized.absent) return "0";
    return normalized.obtained ?? "-";
  };

  return sortPerformanceSubjects(
    rows.map((row) => {
      const subject = row?.subject || row?.name || row?.subject_name || row?.title || "-";

      if (Array.isArray(row?.FA) || Array.isArray(row?.SA)) {
        const fa = Array.isArray(row?.FA) ? row.FA.map(toDisplayMark) : (fullyAbsent ? ["AB", "AB", "AB", "AB"] : []);
        const sa = Array.isArray(row?.SA) ? row.SA.map(toDisplayMark) : (fullyAbsent ? ["AB", "AB"] : []);
        const tests =
          row?.tests && typeof row.tests === "object"
            ? Object.fromEntries(Object.entries(row.tests).map(([key, entry]) => [key, normalizeTestEntry(entry)]))
            : {
                FA1: normalizeTestEntry(row?.FA?.[0]),
                FA2: normalizeTestEntry(row?.FA?.[1]),
                FA3: normalizeTestEntry(row?.FA?.[2]),
                FA4: normalizeTestEntry(row?.FA?.[3]),
                SA1: normalizeTestEntry(row?.SA?.[0]),
                SA2: normalizeTestEntry(row?.SA?.[1]),
              };

        const totals = Object.values(tests).reduce(
          (acc, entry) => {
            if (entry?.max != null && entry.max > 0) {
              acc.max += entry.max;
            } else if (entry?.obtained != null && entry.obtained > 0) {
              acc.max += entry.obtained;
            }
            if (entry?.obtained != null) {
              acc.obtained += entry.obtained;
              if ((entry?.max == null || entry.max <= 0) && (entry?.obtained == null || entry.obtained <= 0)) {
                acc.missingMax = true;
              }
            }
            return acc;
          },
          { obtained: 0, max: 0, missingMax: false }
        );
        const percentage =
          !fullyAbsent && totals.max > 0 && !totals.missingMax
            ? Number(((totals.obtained / totals.max) * 100).toFixed(2))
            : null;

        return {
          ...row,
          subject,
          FA: fa,
          SA: sa,
          tests,
          marksObtained: fullyAbsent ? null : Number(totals.obtained.toFixed(2)),
          obtainedMarks: fullyAbsent ? null : Number(totals.obtained.toFixed(2)),
          totalMarks: totals.missingMax ? null : Number(totals.max.toFixed(2)),
          maxMarks: totals.missingMax ? null : Number(totals.max.toFixed(2)),
          percentage,
          isAbsent: fullyAbsent,
          status: fullyAbsent ? "Absent" : (row.status || "Present"),
        };
      }

      const tests = row?.tests && typeof row.tests === "object" ? row.tests : {};
      const read = (key) => {
        if (fullyAbsent) return "AB";
        if (tests[key] != null) return toDisplayMark(tests[key]);
        const matchingKey = Object.keys(tests).find((item) => String(item).toLowerCase() === key.toLowerCase());
        return matchingKey ? toDisplayMark(tests[matchingKey]) : "-";
      };

      const fa = [read("FA1"), read("FA2"), read("FA3"), read("FA4")];
      const sa = [read("SA1"), read("SA2")];
      const normalizedTests = Object.fromEntries(
        Object.entries(tests).map(([key, entry]) => [key, normalizeTestEntry(entry)])
      );
      const totals = Object.values(normalizedTests).reduce(
        (acc, entry) => {
          if (entry?.max != null && entry.max > 0) {
            acc.max += entry.max;
          } else if (entry?.obtained != null && entry.obtained > 0) {
            acc.max += entry.obtained;
          }
          if (entry?.obtained != null) {
            acc.obtained += entry.obtained;
            if ((entry?.max == null || entry.max <= 0) && (entry?.obtained == null || entry.obtained <= 0)) {
              acc.missingMax = true;
            }
          }
          return acc;
        },
        { obtained: 0, max: 0, missingMax: false }
      );
      const percentage =
        !fullyAbsent && totals.max > 0 && !totals.missingMax
          ? Number(((totals.obtained / totals.max) * 100).toFixed(2))
          : null;

      return {
        ...row,
        subject,
        FA: fa,
        SA: sa,
        tests: normalizedTests,
        marksObtained: fullyAbsent ? null : Number(totals.obtained.toFixed(2)),
        obtainedMarks: fullyAbsent ? null : Number(totals.obtained.toFixed(2)),
        totalMarks: totals.missingMax ? null : Number(totals.max.toFixed(2)),
        maxMarks: totals.missingMax ? null : Number(totals.max.toFixed(2)),
        percentage,
        isAbsent: fullyAbsent,
        status: fullyAbsent ? "Absent" : (row.status || "Present"),
      };
    })
  );
};

// Sums a student's normalized `performance` rows into a single obtained/total/percentage figure.
const computeOverallTotals = (performanceRows) => {
  if (!Array.isArray(performanceRows) || performanceRows.length === 0) {
    return { obtainedMarks: null, totalMarks: null, percentage: null, subjectsCounted: 0, isAbsent: true, status: "Absent" };
  }

  const fullyAbsent = isStudentFullyAbsent(performanceRows);
  if (fullyAbsent) {
    let totalMax = 0;
    performanceRows.forEach((row) => {
      const rowTotal = Number(row?.totalMarks ?? row?.maxMarks);
      if (Number.isFinite(rowTotal) && rowTotal > 0) totalMax += rowTotal;
    });
    return {
      obtainedMarks: null,
      totalMarks: totalMax > 0 ? Number(totalMax.toFixed(2)) : null,
      percentage: null,
      subjectsCounted: performanceRows.length,
      isAbsent: true,
      status: "Absent",
    };
  }

  let obtained = 0;
  let total = 0;
  let subjectsCounted = 0;

  performanceRows.forEach((row) => {
    const rowObtained = Number(row?.obtainedMarks ?? row?.marksObtained);
    const rowTotal = Number(row?.totalMarks ?? row?.maxMarks);
    const hasObtained = Number.isFinite(rowObtained);
    const hasTotal = Number.isFinite(rowTotal) && rowTotal > 0;

    if (!hasObtained && !hasTotal) return;

    if (hasObtained) obtained += rowObtained;
    if (hasTotal) total += rowTotal;
    subjectsCounted += 1;
  });

  const percentage = total > 0 ? Number(((obtained / total) * 100).toFixed(2)) : null;

  return {
    obtainedMarks: Number(obtained.toFixed(2)),
    totalMarks: Number(total.toFixed(2)),
    percentage,
    subjectsCounted,
    isAbsent: false,
  };
};

// Standard "competition ranking": students tied on obtainedMarks share the same rank,
// and the next distinct rank skips ahead by the number of students tied above it.
const computeCompetitionRanks = (entries) => {
  // entries: [{ studentId, obtainedMarks }, ...]
  const sorted = [...entries].sort((a, b) => (b.obtainedMarks || 0) - (a.obtainedMarks || 0));

  const rankByStudentId = new Map();
  let lastMarks = null;
  let lastRank = 0;

  sorted.forEach((entry, index) => {
    const position = index + 1; // 1-based position in the sorted list
    if (lastMarks === null || entry.obtainedMarks !== lastMarks) {
      lastRank = position;
      lastMarks = entry.obtainedMarks;
    }
    rankByStudentId.set(entry.studentId, lastRank);
  });

  return rankByStudentId;
};

const AdminGenerations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
  const activeTopTab = useMemo(() => {
    const path = location.pathname;
    if (path === "/AdminDashboard") return "Dashboard";
    if (path === "/AdiminAcademicsNew") return "Academics";
    if (path === "/AdminEventsAndMeetings") return "Events & Meetings";
    return "";
  }, [location.pathname]);
  const [schoolName, setSchoolName] = useState(() =>
    String(localStorage.getItem("schoolName") || "Unknown School").trim()
  );
  const [schoolLogo, setSchoolLogo] = useState("/default-logo.png");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
   const [performance, setPerformance] = useState({});
    const [templatePreviewState, setTemplatePreviewState] = useState({
      open: false,
      kind: "",
      templateId: "",
      templateLabel: "",
    });
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [signaturePendingTemplate, setSignaturePendingTemplate] = useState(null);
    const [signatureRawImage, setSignatureRawImage] = useState("");
    const [signatureProcessedImage, setSignatureProcessedImage] = useState("");
    const [signatureScale, setSignatureScale] = useState(120);
    const [signatureProcessing, setSignatureProcessing] = useState(false);
    const [signatureError, setSignatureError] = useState("");
    const templateTrackRefs = useRef({
      reportCard: null,
      idCard: null,
      poster: null,
    });
      useEffect(() => {
          getOverallPerformance();
      }, []);
  
      const getOverallPerformance = async () => {
  
          try {
  
              const schoolCode = localStorage.getItem("schoolCode");
  
              const response = await axios.get(
                  "https://cleezoclass.com:4000/api/overall-performance-percentage",
                  {
                      params: {
                          schoolCode,
                      },
                  }
              );
  
              if (response.data.success) {
                  setPerformance(response.data.data);
              }
  
          } catch (error) {
              console.log(error);
          }
  
      };
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [popupType, setPopupType] = useState("");
  const [activeQuickPanel, setActiveQuickPanel] = useState("livechat");
  const [eventMeetingTab, setEventMeetingTab] = useState("event");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [chatRequests, setChatRequests] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [storeActions, setStoreActions] = useState([]);
  const [storeActionsLoading, setStoreActionsLoading] = useState(false);
  const [storeActionsError, setStoreActionsError] = useState("");
  const [party1List, setParty1List] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [generationSectionOptions, setGenerationSectionOptions] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedCardStudent, setSelectedCardStudent] = useState("");
  const [selectedCardStaff, setSelectedCardStaff] = useState("");
  const [selectedReportCardTemplate, setSelectedReportCardTemplate] = useState(() =>
    normalizeReportTemplateName(localStorage.getItem(REPORT_TEMPLATE_STORAGE_KEY))
  );
  const [selectedIdCardTemplate, setSelectedIdCardTemplate] = useState(() =>
    normalizeIdCardTemplateName(localStorage.getItem(ID_CARD_TEMPLATE_STORAGE_KEY))
  );
  const [generatedIdCardTemplate, setGeneratedIdCardTemplate] = useState(() =>
    normalizeIdCardTemplateName(localStorage.getItem(ID_CARD_TEMPLATE_STORAGE_KEY))
  );
          const [openHelpSection, setOpenHelpSection] = useState(null);
        const[isHelpOpen,setIsHelpOpen]=useState(false)
        const userRole = localStorage.getItem("userRole")
  const [generationRange, setGenerationRange] = useState({
    className: "",
    section: "",
  });
  // Download ID Card Popup States
const [downloadIdCardPopupOpen, setDownloadIdCardPopupOpen] = useState(false);
const [idCardFileFormat, setIdCardFileFormat] = useState('pdf-print');
const [idCardDownloadType, setIdCardDownloadType] = useState('zip');
const [idCardPdfLayout, setIdCardPdfLayout] = useState(2);
const [idCardSide, setIdCardSide] = useState('front-back');
const [idCardPaperSize, setIdCardPaperSize] = useState('a4');
const [idCardImageQuality, setIdCardImageQuality] = useState('high');
const [idCardShowCropMarks, setIdCardShowCropMarks] = useState(false);
const [idCardShowCutGuidelines, setIdCardShowCutGuidelines] = useState(false);
const [idCardAddPageNumbers, setIdCardAddPageNumbers] = useState(false);
const [idCardFileName, setIdCardFileName] = useState('IDCards_SelectedStudents');
// Batch download: 0 = download everyone in one go; otherwise export N records at a time
// (e.g. "10 at a time") so large lists never have to render/export in a single heavy pass.
const [idCardBatchSize, setIdCardBatchSize] = useState(0);
const [idCardBatchIndex, setIdCardBatchIndex] = useState(0);
  
  const [reportRangeStudents, setReportRangeStudents] = useState([]);
  const [reportRangeLoading, setReportRangeLoading] = useState(false);
  const [reportRangeLoadingMessage, setReportRangeLoadingMessage] = useState("");
  const [reportRangeError, setReportRangeError] = useState("");
  const [allReportsPopupOpen, setAllReportsPopupOpen] = useState(false);
  const reportPhotoCacheRef = useRef(new Map());

  // --- Lazy-loading state for the Report card grid ---
  const REPORT_CARD_BATCH_SIZE = 12;
  const [reportVisibleCount, setReportVisibleCount] = useState(REPORT_CARD_BATCH_SIZE);
  const reportGridSentinelRef = useRef(null);
  const reportGridScrollRef = useRef(null);

  // Download Report Card Popup States
  const [downloadReportCardPopupOpen, setDownloadReportCardPopupOpen] = useState(false);
  const [reportCardFileFormat, setReportCardFileFormat] = useState('pdf-print');
  const [reportCardDownloadType, setReportCardDownloadType] = useState('single-pdf');
  const [reportCardPaperSize, setReportCardPaperSize] = useState('a4');
  const [reportCardOrientation, setReportCardOrientation] = useState('auto');
  const [reportCardImageQuality, setReportCardImageQuality] = useState('high');
  const [reportCardShowCropMarks, setReportCardShowCropMarks] = useState(false);
  const [reportCardShowCutGuidelines, setReportCardShowCutGuidelines] = useState(false);
  const [reportCardAddPageNumbers, setReportCardAddPageNumbers] = useState(false);
  const [reportCardFileName, setReportCardFileName] = useState('ReportCards_SelectedStudents');
  const [reportCardBatchSize, setReportCardBatchSize] = useState(0);
  const [reportCardBatchIndex, setReportCardBatchIndex] = useState(0);
  // "without-rank" | "with-rank" — whether to compute and print class rank on each report card
  const [reportCardRankMode, setReportCardRankMode] = useState('without-rank');
  const [reportRankModalOpen, setReportRankModalOpen] = useState(false);
  const [pendingReportTemplate, setPendingReportTemplate] = useState(null);
  const [reportRankComputing, setReportRankComputing] = useState(false);
  // studentId -> { rank, totalStudents, obtainedMarks, totalMarks, percentage }
  const reportRankMapRef = useRef(new Map());
  // studentId -> already-fetched report payload (avoids re-fetching marks twice:
  // once for rank computation, once for actual rendering)
  const reportPayloadCacheRef = useRef(new Map());
  // classKey -> { subjects: string[], testTypes: any[], samplePerformance: any[] }
  const classAcademicStructureRef = useRef(new Map());
  const [idCardRangeStudents, setIdCardRangeStudents] = useState([]);
  const [idCardRangeLoading, setIdCardRangeLoading] = useState(false);
  const [idCardRangeLoadingMessage, setIdCardRangeLoadingMessage] = useState("");
  const [idCardRangeError, setIdCardRangeError] = useState("");
  const [allIdCardsPopupOpen, setAllIdCardsPopupOpen] = useState(false);
  const [idCardTargetType, setIdCardTargetType] = useState("student"); // "student" | "teacher"
  const [idCardAudience, setIdCardAudience] = useState("student"); // "student" | "teacher"
  const idCardPhotoCacheRef = useRef(new Map());

  // --- Lazy-loading (infinite scroll) state for the ID card grid ---
  // Only a small batch of cards is mounted in the DOM at a time; more are
  // appended as the user scrolls near the bottom of the grid. This keeps
  // large teacher/student lists (50, 100, 200+ records) from rendering
  // dozens of heavy iframes simultaneously, which is what was causing only
  // the first few cards to actually finish loading.
  const ID_CARD_BATCH_SIZE = 18;
  const [idCardVisibleCount, setIdCardVisibleCount] = useState(ID_CARD_BATCH_SIZE);
  const idCardGridSentinelRef = useRef(null);
  const idCardGridScrollRef = useRef(null);



  const [selectedReportStudent, setSelectedReportStudent] = useState(null);
  const [selectedReportPayload, setSelectedReportPayload] = useState(null);
  const [reportPopupOpen, setReportPopupOpen] = useState(false);
  const [reportPreviewLoading, setReportPreviewLoading] = useState(false);
  const reportPreviewFrameRef = useRef(null);
  const [downloadProgress, setDownloadProgress] = useState({
  active: false,
  current: 0,
  total: 0,
  message: ""
});

  useEffect(() => {
    if (reportPopupOpen && selectedReportPayload && reportPreviewFrameRef.current?.contentWindow) {
      reportPreviewFrameRef.current.contentWindow.postMessage(
        { type: "REPORT_CARD_PAYLOAD", payload: selectedReportPayload },
        window.location.origin
      );
      window.setTimeout(() => applyReportPreviewFit(reportPreviewFrameRef.current), 120);
      window.setTimeout(() => applyReportPreviewFit(reportPreviewFrameRef.current), 320);
    }
  }, [reportPopupOpen, selectedReportPayload]);

  const [posterAudienceTab, setPosterAudienceTab] = useState("Student");
  const [posterTemplateCategory, setPosterTemplateCategory] = useState("Events");
  const [selectedPosterTemplate, setSelectedPosterTemplate] = useState("event1.html");
  const [sendingPoster, setSendingPoster] = useState(false);
  const [generationView, setGenerationView] = useState("reports");
  const [liveChatForm, setLiveChatForm] = useState({
    party1: "",
    className: "",
    section: "",
    student: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
  });

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    category: "General",
    announcementDate: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [eventForm, setEventForm] = useState({
    eventName: "",
    eventType: "General",
    eventDate: new Date().toISOString().split("T")[0],
    eventTime: "",
    description: "",
  });
  const [meetingForm, setMeetingForm] = useState({
    meetingTitle: "",
    meetingDate: new Date().toISOString().split("T")[0],
    meetingTime: "",
    agenda: "",
    description: "",
  });

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calendarMonth, calendarYear]);

  const announcementDays = useMemo(
    () => getDaySet(announcements, "announcementDate", calendarYear, calendarMonth),
    [announcements, calendarYear, calendarMonth]
  );
  const eventDays = useMemo(
    () => getDaySet(events, "eventDate", calendarYear, calendarMonth),
    [events, calendarYear, calendarMonth]
  );
  const meetingDays = useMemo(
    () => getDaySet(meetings, "meetingDate", calendarYear, calendarMonth),
    [meetings, calendarYear, calendarMonth]
  );

  const latestAnnouncement = announcements[0] || null;
  const latestEvent = events[0] || null;
  const latestMeeting = meetings[0] || null;

  const buildDateValue = (day) => {
    if (!day) return "";
    return `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const footerCards = [
    {
      title: latestAnnouncement ? formatDateLabel(latestAnnouncement.announcementDate) : "--",
      subtitle: latestAnnouncement?.title || "No announcements",
      meta: "Announcements",
    },
    {
      title: latestEvent ? formatDateLabel(latestEvent.eventDate) : "--",
      subtitle: latestEvent?.eventName || "No events",
      meta: "Events",
    },
    {
      title: latestMeeting ? formatDateLabel(latestMeeting.meetingDate) : "--",
      subtitle: latestMeeting?.meetingTitle || "No meetings",
      meta: "Meetings",
    },
    { title: "Complaints", subtitle: "Store", meta: "Uniform" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    window.location.replace(import.meta.env.BASE_URL || "/");
  };

  const assistantPanelItems = [
    {
      title: "Academics Tab Guidance",
      desc: "Check performance, exams, syllabus progress, and class-wise student discipline updates.",
    },
    {
      title: "Events & Meetings Guidance",
      desc: "Create events, assign meetings, and review pending discussion points and live chat follow-ups.",
    },
    {
      title: "Store Guidance",
      desc: "Review pending PO requests, validate stock movement, and raise replenishment actions early.",
    },
  ];

  const requestItems = useMemo(
    () =>
      chatRequests.filter((item) => {
        const status = String(item?.status || item?.approval_status || "pending").toLowerCase();
        return status === "pending" || status === "requested" || status === "awaiting";
      }),
    [chatRequests]
  );

  const scheduledItems = useMemo(
    () =>
      chatRequests.filter((item) => {
        const status = String(item?.status || item?.approval_status || "").toLowerCase();
        return status === "approved" || status === "scheduled" || status === "fixed";
      }),
    [chatRequests]
  );

  const visibleStudents = useMemo(() => {
    const source = Array.isArray(studentOptions) && studentOptions.length > 0 ? studentOptions : demoStudents;
    const normalized = source.filter(Boolean);

    if (!selectedCardStudent) {
      return normalized;
    }

    const selected = normalized.find((item) =>
      typeof item === "string" ? item === selectedCardStudent : item?.name === selectedCardStudent
    );
    const remaining = normalized.filter((item) =>
      typeof item === "string" ? item !== selectedCardStudent : item?.name !== selectedCardStudent
    );

    return selected ? [selected, ...remaining] : normalized;
  }, [selectedCardStudent, studentOptions]);

  const visibleStaff = useMemo(() => {
    const source = Array.isArray(party1List) && party1List.length > 0 ? party1List : demoStaff;
    const normalized = source.filter(Boolean);

    if (!selectedCardStaff) {
      return normalized.slice(0, 3);
    }

    const selected = normalized.find((item) =>
      typeof item === "string" ? item === selectedCardStaff : item?.name === selectedCardStaff
    );
    const remaining = normalized.filter((item) =>
      typeof item === "string" ? item !== selectedCardStaff : item?.name !== selectedCardStaff
    );
    const ordered = selected ? [selected, ...remaining] : normalized;

    return ordered.slice(0, 3);
  }, [party1List, selectedCardStaff]);

  useEffect(() => {
    if (!schoolCode) return;
    fetch(`https://cleezoclass.com:4000/api/institute?dbName=${schoolCode}`)
      .then((res) => res.json())
      .then((data) => {
        const resolvedSchoolName = resolveInstituteDisplayName({
          apiInstituteName: data?.institute_name || data?.instituteName || data?.school_name || data?.name || data?.schoolName,
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Unknown School",
        });
        const resolvedSchoolAddress = String(data?.address || data?.schoolAddress || data?.instituteAddress || "").trim();
        const normalizedLogo = normalizeInstituteLogo(data?.logo);
        setSchoolName(resolvedSchoolName);
        setSchoolLogo(normalizedLogo || "/default-logo.png");
        localStorage.setItem("schoolName", resolvedSchoolName);
        localStorage.setItem("instituteName", resolvedSchoolName);
        localStorage.setItem("schoolLogo", normalizedLogo || "/default-logo.png");
        localStorage.setItem("schoolAddress", resolvedSchoolAddress);
      })
      .catch(() => {
        const fallbackSchoolName = resolveInstituteDisplayName({
          storedSchoolName: localStorage.getItem("schoolName"),
          storedInstituteName: localStorage.getItem("instituteName"),
          schoolCode,
          fallback: "Unknown School",
        });
        setSchoolName(fallbackSchoolName);
        localStorage.setItem("schoolName", fallbackSchoolName);
        localStorage.setItem("instituteName", fallbackSchoolName);
        setSchoolLogo("/default-logo.png");
      });
  }, [schoolCode]);

  const popupStudents = useMemo(
    () => (Array.isArray(studentOptions) ? studentOptions.filter(Boolean) : []),
    [studentOptions]
  );

  const popupStaff = useMemo(
    () => (Array.isArray(party1List) ? party1List.filter(Boolean) : []),
    [party1List]
  );

  const visiblePosterStudents = visibleStudents;



    const removeSignatureBackground = (dataUrl, { threshold = 235, feather = 25 } = {}) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Sample the four corners to get the actual background tone,
          // in case the scan isn't pure white (off-white paper, slight shadow, etc.)
          const sampleAt = (x, y) => {
            const idx = (y * canvas.width + x) * 4;
            return [data[idx], data[idx + 1], data[idx + 2]];
          };
          const corners = [
            sampleAt(0, 0),
            sampleAt(canvas.width - 1, 0),
            sampleAt(0, canvas.height - 1),
            sampleAt(canvas.width - 1, canvas.height - 1),
          ];
          const bg = corners.reduce(
            (acc, c) => [acc[0] + c[0] / 4, acc[1] + c[1] / 4, acc[2] + c[2] / 4],
            [0, 0, 0]
          );

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            const distFromBg = Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2);

            const isBackground = brightness >= threshold || distFromBg <= 22;
            if (isBackground) {
              data[i + 3] = 0;
            } else if (brightness >= threshold - feather) {
              const alpha = ((threshold - brightness) / feather) * 255;
              data[i + 3] = Math.max(0, Math.min(255, alpha));
            }
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Failed to load the signature image."));
      img.src = dataUrl;
    });
  const handleSelectWithoutSignature = () => {
    try {
      localStorage.removeItem("idCardSignature");
      localStorage.removeItem("idCardSignatureScale");
    } catch (error) {
      console.warn("Failed to clear stored signature", error);
    }
    handleConfirmTemplatePreview();
  };

  const handleSelectWithSignature = () => {
    if (templatePreviewState.kind !== "idCard") {
      handleConfirmTemplatePreview();
      return;
    }
    setSignaturePendingTemplate({ ...templatePreviewState });
    setSignatureRawImage("");
    setSignatureProcessedImage("");
    setSignatureScale(120);
    setSignatureError("");
    setTemplatePreviewState({ open: false, kind: "", templateId: "", templateLabel: "" });
    setSignatureModalOpen(true);
  };

  const handleSignatureFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSignatureError("");
    setSignatureProcessing(true);
    setSignatureProcessedImage("");

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read the selected file."));
        reader.readAsDataURL(file);
      });

      setSignatureRawImage(dataUrl);
      const processed = await removeSignatureBackground(dataUrl);
      setSignatureProcessedImage(processed);
    } catch (error) {
      setSignatureError(error?.message || "Failed to process the signature image.");
    } finally {
      setSignatureProcessing(false);
    }
  };

  const closeSignatureModal = () => {
    setSignatureModalOpen(false);
    setSignaturePendingTemplate(null);
    setSignatureRawImage("");
    setSignatureProcessedImage("");
    setSignatureError("");
  };

  const handleConfirmSignature = async () => {
    if (!signatureProcessedImage || !signaturePendingTemplate) return;

    try {
      localStorage.setItem("idCardSignature", signatureProcessedImage);
      localStorage.setItem("idCardSignatureScale", String(signatureScale));
    } catch (error) {
      console.warn("Failed to store signature in localStorage", error);
      setSignatureError("Signature image is too large to store. Try a smaller image.");
      return;
    }

    const { kind, templateId } = signaturePendingTemplate;
    setSignatureModalOpen(false);
    setSignaturePendingTemplate(null);

    if (kind === "reportCard") {
      const normalized = handleChooseReportCardTemplate(templateId);
      handlePromptReportCardGeneration(normalized);
      return;
    }

     if (kind === "idCard") {
      const normalized = handleChooseIdCardTemplate(templateId);
      if (idCardAudience === "teacher") {
        await handleOpenTeacherIdCardGeneration(null, normalized);
      } else {
        await handleOpenIdCardGeneration(normalized);
      }
    }
  };
  
  const handleChooseReportCardTemplate = (templateId) => {
    const normalized = normalizeReportTemplateName(templateId);
    const appliedAt = new Date().toISOString();
    setSelectedReportCardTemplate(normalized);
    localStorage.setItem(REPORT_TEMPLATE_STORAGE_KEY, normalized);
    localStorage.setItem(REPORT_TEMPLATE_SELECTED_AT_KEY, appliedAt);
    return normalized;
  };

  const handleChooseIdCardTemplate = (templateId) => {
    const normalized = normalizeIdCardTemplateName(templateId);
    setSelectedIdCardTemplate(normalized);
    localStorage.setItem(ID_CARD_TEMPLATE_STORAGE_KEY, normalized);
    return normalized;
  };

  const openTemplatePreview = (kind, templateId, templateLabel) => {
    if (kind === "idCard") {
      handleChooseIdCardTemplate(templateId);
    } else if (kind === "reportCard") {
      handleChooseReportCardTemplate(templateId);
    }

    setTemplatePreviewState({
      open: true,
      kind,
      templateId,
      templateLabel,
    });
  };

  const closeTemplatePreview = () => {
    setTemplatePreviewState({
      open: false,
      kind: "",
      templateId: "",
      templateLabel: "",
    });
  };

const handlePrintSelectedClassIdCards = async () => {
  const templateId = normalizeIdCardTemplateName(generatedIdCardTemplate || selectedIdCardTemplate);
  const students = Array.isArray(idCardRangeStudents) ? idCardRangeStudents : [];
  
  if (students.length === 0) {
    setPopupMessage("No students found for printing.");
    return;
  }

  // 🔥 Show progress
  setDownloadProgress({
    active: true,
    current: 0,
    total: students.length,
    message: "Preparing ID cards for print..."
  });

  try {
    // 🔥 Render each card using exact preview URL (340x540px)
    const canvases = [];
    let processedCount = 0;

    for (const student of students) {
      try {
        const canvas = await renderCardFromPreviewUrl(student, 'front', buildIdCardPreviewUrl, templateId);
        canvases.push({ student, canvas });
        
        processedCount++;
        setDownloadProgress({
          active: true,
          current: processedCount,
          total: students.length,
          message: `Preparing card ${processedCount} of ${students.length}: ${student?.name || 'Student'}`
        });
      } catch (error) {
        console.error(`Failed to render card for ${student?.name}:`, error);
      }
    }

    if (canvases.length === 0) {
      setDownloadProgress({ active: false });
      alert("❌ Failed to generate any ID cards for printing.");
      return;
    }

    setDownloadProgress({
      active: true,
      current: students.length,
      total: students.length,
      message: "Creating print document..."
    });

    // 🔥 Create print document with exact preview dimensions
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      setDownloadProgress({ active: false });
      alert("Please allow pop-ups to print ID cards.");
      return;
    }

    let cardsHtml = '';
    canvases.forEach(({ student, canvas }, index) => {
      const name = student?.name || student?.student_name || student?.studentName || "Student";
      const className = student?.class_name || student?.class || student?.className || student?.classname || "-";
      const section = student?.section || student?.section_name || student?.sectionName || student?.sec || "-";
      const imgData = canvas.toDataURL('image/png');

      cardsHtml += `
        <div class="print-card-page">
          <div class="print-card-wrapper">
            <img src="${imgData}" class="print-card-image" />
          <
          <div class="print-card-info">
            <strong>${escapeHtml(name)}</strong>
            <span>Class ${escapeHtml(className)} | Sec ${escapeHtml(section)}</span>
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Print ID Cards - ${escapeHtml(schoolName)}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              font-family: Arial, Helvetica, sans-serif;
              background: #fff;
            }
            .print-card-page {
              page-break-after: always;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 10mm;
            }
            .print-card-page:last-child {
              page-break-after: auto;
            }
            .print-card-wrapper {
              width: 340px;
              height: 540px;
              border: 2px solid #000;
              overflow: hidden;
              background: #fff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .print-card-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .print-card-info {
              margin-top: 15px;
              text-align: center;
              font-size: 14px;
              color: #333;
            }
            .print-card-info strong {
              display: block;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .print-card-info span {
              color: #666;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .print-card-page {
                page-break-after: always;
                margin: 0;
                padding: 0;
              }
              .print-card-wrapper {
                border: 1px solid #000;
              }
            }
          </style>
        </head>
        <body>
          ${cardsHtml}
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();

    // 🔥 Hide progress after print dialog opens
    setTimeout(() => {
      setDownloadProgress({ active: false });
    }, 2000);

  } catch (error) {
    console.error("Print failed:", error);
    setDownloadProgress({ active: false });
    alert("❌ Failed to prepare ID cards for printing.\nError: " + error.message);
  }
};

  const fetchStudentsForReportRange = async () => {
    const code = String(schoolCode || "").trim();
    if (!code) return [];

    const attempts = [
      () => axios.get(`${API_BASE}/students-details`, { params: { schoolCode: code } }),
      () => axios.get(`${API_BASE}/api/students`, { params: { schoolCode: code } }),
      () => axios.post(`${API_BASE}/api/students`, { schoolCode: code }),
      () => axios.get(`https://cleezoclass.com:4000/students-details`, { params: { schoolCode: code } }),
      () => axios.get(`https://cleezoclass.com:4000/api/students`, { params: { schoolCode: code } }),
      () => axios.post(`https://cleezoclass.com:4000/api/students`, { schoolCode: code }),
    ];

    for (const run of attempts) {
      try {
        const response = await run();
        const list = normalizeStudentCollection(response?.data);

        if (list.length > 0) return list;
      } catch {
        // try next shape
      }
    }

    return [];
  };

  const enrichStudentsForReports = async (students) => {
    const grouped = new Map();
    const untouchedStudents = [];

    students.forEach((student) => {
      const className = String(student?.class_name || student?.class || student?.className || "").trim();
      const section = String(student?.section || student?.section_name || student?.sectionName || "").trim();
      if (!className || !section) {
        untouchedStudents.push(student);
        return;
      }
      const key = `${className}::${section}`;
      if (!grouped.has(key)) grouped.set(key, { className, section, students: [] });
      grouped.get(key).students.push(student);
    });

    if (grouped.size === 0) {
      return Array.isArray(students) ? students : [];
    }

    const results = await Promise.all(
      Array.from(grouped.values()).map(async ({ className, section, students: groupedStudents }) => {
        try {
          const response = await axios.get(
            `https://cleezoclass.com:4000/api/studentsName/${encodeURIComponent(className)}?schoolCode=${encodeURIComponent(
              schoolCode
            )}&section=${encodeURIComponent(section)}`
          );
          const detailedStudents = Array.isArray(response?.data?.students) ? response.data.students : [];

          // return groupedStudents.map((student) => {
          //   const studentId = student?.id || student?.student_id;
          //   const matched = detailedStudents.find((item) => {
          //     const sameId = item?.id != null && studentId != null && String(item.id) === String(studentId);
          //     const sameIdentity =
          //       String(item?.name || item?.student_name || "").trim() ===
          //         String(student?.name || student?.student_name || "").trim() &&
          //       String(item?.class_name || item?.class || item?.className || "").trim() === className &&
          //       String(item?.section || item?.section_name || item?.sectionName || "").trim() === section;
          //     return sameId || sameIdentity;
          //   });

          //   return matched ? { ...student, ...matched } : student;
          // });

                    return groupedStudents.map((student) => {
            const studentId = student?.id ?? student?.student_id ?? student?.studentId;
            const matched = detailedStudents.find((item) => {
              const itemId = item?.id ?? item?.student_id ?? item?.studentId;
              if (studentId != null && itemId != null) {
                return String(itemId) === String(studentId);
              }
              const itemUsername = item?.username || item?.user_name;
              const studentUsername = student?.username || student?.user_name;
              if (itemUsername && studentUsername) {
                return String(itemUsername).trim().toLowerCase() === String(studentUsername).trim().toLowerCase();
              }
              const itemAdmission = item?.admission_no || item?.admission_number || item?.admissionNo;
              const studentAdmission = student?.admission_no || student?.admission_number || student?.admissionNo;
              if (itemAdmission && studentAdmission) {
                return String(itemAdmission).trim().toLowerCase() === String(studentAdmission).trim().toLowerCase();
              }
              const sameIdentity =
                String(item?.name || item?.student_name || "").trim().toLowerCase() ===
                  String(student?.name || student?.student_name || "").trim().toLowerCase() &&
                String(item?.class_name || item?.class || item?.className || "").trim().toLowerCase() === className.toLowerCase() &&
                String(item?.section || item?.section_name || item?.sectionName || "").trim().toLowerCase() === section.toLowerCase();
              return sameIdentity;
            });

            return matched ? { ...student, ...matched } : student;
          });

        } catch (error) {
          console.error("Failed to enrich report students", error);
          return groupedStudents;
        }
      })
    );

    return [...results.flat(), ...untouchedStudents];
  };

  const handlePromptReportCardGeneration = (templateOverride = null) => {
    const className = String(generationRange.className || "").trim();
    const section = String(generationRange.section || "").trim();

    if (!className || !section) {
      setReportRangeError("Please select class and section.");
      return;
    }
    setReportRangeError("");
    setPendingReportTemplate(templateOverride || null);
    setReportRankModalOpen(true);
  };

  const handleOpenReportCardGeneration = async (templateOverride = null, rankModeOverride = null) => {
    const templateToUse = normalizeReportTemplateName(templateOverride || selectedReportCardTemplate);
    const className = String(generationRange.className || "").trim();
    const section = String(generationRange.section || "").trim();

    if (!className || !section) {
      setReportRangeError("Please select class and section.");
      return;
    }

    const rankMode = rankModeOverride || reportCardRankMode;
    setReportCardRankMode(rankMode);

    setReportRangeLoading(true);
    setReportRangeError("");
    setReportRangeStudents([]);
    setAllReportsPopupOpen(false);

    try {
      const students = await fetchStudentsForReportRange();
      const filtered = filterStudentsByClassSection(students, className, section);

      if (filtered.length === 0) {
        const availablePairs = uniqueSortedValues(
          (Array.isArray(students) ? students : []).map(
            (item) => {
              const itemClass = item?.class_name || item?.class || item?.className || item?.classname || item?.standard || "";
              const itemSection = item?.section || item?.section_name || item?.sectionName || item?.sec || "";
              return itemClass && itemSection ? `${itemClass}-${itemSection}` : "";
            }
          )
        );
        setReportRangeError(
          availablePairs.length > 0
            ? `No students found for selected class and section. Available: ${availablePairs.join(", ")}`
            : "No students found for the selected class and section."
        );
        return;
      }

      const appliedAt = new Date().toISOString();
      setSelectedReportCardTemplate(templateToUse);
      localStorage.setItem(REPORT_TEMPLATE_STORAGE_KEY, templateToUse);
      localStorage.setItem(REPORT_TEMPLATE_SELECTED_AT_KEY, appliedAt);

      setReportRangeLoadingMessage(`Fetching detailed info for ${filtered.length} students...`);
      const enrichedStudents = await enrichStudentsForReports(filtered);

      setReportRangeLoadingMessage(`Loading & verifying photos (0 of ${enrichedStudents.length})...`);

      // Preload and resolve ALL student photos in chunks before displaying the preview
      const photoMap = await preloadStudentPhotosInChunks(
        enrichedStudents,
        8,
        (current, total) => {
          setReportRangeLoadingMessage(`Loading photos: ${current} of ${total} students ready...`);
        }
      );
      reportPhotoCacheRef.current = photoMap;

      setReportRangeStudents(enrichedStudents);
      // A new class/section was loaded — any previously computed ranks/cached payloads
      // belong to the old roster and must not be reused.
      reportRankMapRef.current = new Map();
      reportPayloadCacheRef.current = new Map();
      classAcademicStructureRef.current = new Map();

      if (rankMode === 'with-rank') {
        setReportRangeLoadingMessage(`Calculating class ranks across ${enrichedStudents.length} students...`);
        await precomputeReportCardRanks(enrichedStudents);
      }

      const autoReportFileName = `ReportCards_${className ? `Class${className}` : ''}${section ? `_${section}` : ''}`.replace(/[^a-zA-Z0-9_-]/g, '_') || 'ReportCards_SelectedStudents';
      setReportCardFileName(autoReportFileName);
      setAllReportsPopupOpen(true);
    } catch (error) {
      setReportRangeError(error?.message || "Failed to load students for report generation.");
    } finally {
      setReportRangeLoading(false);
      setDownloadProgress({ active: false, current: 0, total: 0, message: "" });
    }
  };

  // const handleOpenIdCardGeneration = async (templateOverride) => {

  //   const templateToUse = normalizeIdCardTemplateName(templateOverride || selectedIdCardTemplate);
  //   const fromClass = String(generationRange.fromClass || "").trim();
  //   const toClass = String(generationRange.toClass || "").trim();

  //   if (!fromClass && !toClass) {
  //     setIdCardRangeError("Please select From class or To class.");
  //     return;
  //   }

  //   setIdCardRangeLoading(true);
  //   setIdCardRangeError("");
  //   setIdCardRangeStudents([]);
  //   setAllIdCardsPopupOpen(false);

  //   try {
  //     const students = await fetchStudentsForReportRange();
  //     const filtered = filterStudentsByClassRange(students, fromClass, toClass);

  //     if (filtered.length === 0) {
  //       const availableClasses = uniqueSortedValues(
  //         (Array.isArray(students) ? students : []).map(
  //           (item) => item?.class_name || item?.class || item?.className || item?.classname || item?.standard || ""
  //         )
  //       );
  //       setIdCardRangeError(
  //         availableClasses.length > 0
  //           ? `No students found for selected class range. Available classes: ${availableClasses.join(", ")}`
  //           : "No students found for the selected class range."
  //       );
  //       return;
  //     }

  //     const enrichedStudents = await enrichStudentsForReports(filtered);
  //     setSelectedIdCardTemplate(templateToUse);
  //     localStorage.setItem(ID_CARD_TEMPLATE_STORAGE_KEY, templateToUse);
  //     setIdCardRangeStudents(enrichedStudents);
  //     setAllIdCardsPopupOpen(true);
  //   } catch (error) {
  //     setIdCardRangeError(error?.message || "Failed to load students for ID card generation.");
  //   } finally {
  //     setIdCardRangeLoading(false);
  //   }
  // };

const handleOpenIdCardGeneration = async (templateOverride) => {
    const templateToUse = normalizeIdCardTemplateName(templateOverride || selectedIdCardTemplate);
    const className = String(generationRange.className || "").trim();
    const section = String(generationRange.section || "").trim();

    if (!className || !section) {
      setIdCardRangeError("Please select class and section.");
      return;
    }

    setIdCardTargetType("student");
    // Open modal immediately to show progress, but DO NOT show ID cards until all photos are loaded
    setIdCardRangeLoading(true);
    setIdCardRangeLoadingMessage("Fetching student records...");
    setIdCardRangeError("");
    setIdCardRangeStudents([]);
    setAllIdCardsPopupOpen(true);

    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("idcard_"))
        .forEach((k) => localStorage.removeItem(k));
    } catch (error) {
      console.warn("Failed to clear stale ID card cache", error);
    }

    try {
      const students = await fetchStudentsForReportRange();
      const filtered = filterStudentsByClassSection(students, className, section);

      if (filtered.length === 0) {
        const availablePairs = uniqueSortedValues(
          (Array.isArray(students) ? students : []).map(
            (item) => {
              const itemClass = item?.class_name || item?.class || item?.className || item?.classname || item?.standard || "";
              const itemSection = item?.section || item?.section_name || item?.sectionName || item?.sec || "";
              return itemClass && itemSection ? `${itemClass}-${itemSection}` : "";
            }
          )
        );
        setIdCardRangeError(
          availablePairs.length > 0
            ? `No students found for selected class and section. Available: ${availablePairs.join(", ")}`
            : "No students found for the selected class and section."
        );
        setIdCardRangeLoading(false);
        return;
      }

      setIdCardRangeLoadingMessage(`Fetching detailed info for ${filtered.length} students...`);
      const enrichedStudents = await enrichStudentsForReports(filtered);

      setIdCardRangeLoadingMessage(`Loading & verifying photos (0 of ${enrichedStudents.length})...`);

      // Preload and resolve ALL student photos in chunks before displaying the preview
      const photoMap = await preloadStudentPhotosInChunks(
        enrichedStudents,
        8,
        (current, total) => {
          setIdCardRangeLoadingMessage(`Loading photos: ${current} of ${total} students ready...`);
        }
      );
      idCardPhotoCacheRef.current = photoMap;

      setSelectedIdCardTemplate(templateToUse);
      setGeneratedIdCardTemplate(templateToUse);
      localStorage.setItem(ID_CARD_TEMPLATE_STORAGE_KEY, templateToUse);

      // ONLY set the students and remove the loading blocker after all photos are ready
      setIdCardRangeStudents(enrichedStudents);
    } catch (error) {
      setIdCardRangeError(error?.message || "Failed to load students for ID card generation.");
    } finally {
      setIdCardRangeLoading(false);
    }
  };


// 1. Add these states inside your AdminGenerations component


const [teachers, setTeachers] = useState([]);
const [loadingTeachers, setLoadingTeachers] = useState(false);
const [selectedCardTeacher, setSelectedCardTeacher] = useState("");

// 2. Add the useEffect hook to fetch teachers based on schoolCode
useEffect(() => {
  if (!schoolCode) return;
  setLoadingTeachers(true);
  axios
    .post("https://cleezoclass.com:4000/api/users", {
      schoolCode,
      user_type: "teacher",
    })
    .then((res) => {
      setTeachers(Array.isArray(res.data) ? res.data : []);
    })
    .catch(() => {
      setTeachers([]);
    })
    .finally(() => {
      setLoadingTeachers(false);
    });
}, [schoolCode]);

// Reset to the first batch whenever the batch size changes, the download
// popup is (re)opened, or the underlying student/teacher list changes.
useEffect(() => {
  setIdCardBatchIndex(0);
}, [idCardBatchSize, downloadIdCardPopupOpen, idCardRangeStudents]);

useEffect(() => {
  setReportCardBatchIndex(0);
}, [reportCardBatchSize, downloadReportCardPopupOpen, reportRangeStudents]);

// --- Lazy loading for the "All ID Cards" grid ---
// Whenever a fresh batch of students/teachers is loaded (or the popup is
// reopened), reset back to showing just the first batch of cards.
useEffect(() => {
  setIdCardVisibleCount(ID_CARD_BATCH_SIZE);
}, [idCardRangeStudents, allIdCardsPopupOpen]);

// Observe a sentinel element placed after the last rendered card; when it
// scrolls into view, reveal the next batch. This is what actually makes
// the grid "lazy load" — cards past the current batch are never mounted
// (and their iframes never start loading/preloading photos) until the
// user scrolls close to them.
useEffect(() => {
  if (!allIdCardsPopupOpen) return undefined;
  const sentinel = idCardGridSentinelRef.current;
  const scrollRoot = idCardGridScrollRef.current;
  if (!sentinel) return undefined;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIdCardVisibleCount((prev) => {
          const total = Array.isArray(idCardRangeStudents) ? idCardRangeStudents.length : 0;
          if (prev >= total) return prev;
          return Math.min(prev + ID_CARD_BATCH_SIZE, total);
        });
      }
    },
    {
      root: scrollRoot || null,
      rootMargin: "400px 0px", // start loading the next batch a bit before it's actually visible
      threshold: 0,
    }
  );

  observer.observe(sentinel);
  return () => observer.disconnect();
}, [allIdCardsPopupOpen, idCardRangeStudents, idCardVisibleCount]);

// --- Lazy loading for the "All Report Cards" grid ---
useEffect(() => {
  setReportVisibleCount(REPORT_CARD_BATCH_SIZE);
}, [reportRangeStudents, allReportsPopupOpen]);

useEffect(() => {
  if (!allReportsPopupOpen) return undefined;
  const sentinel = reportGridSentinelRef.current;
  const scrollRoot = reportGridScrollRef.current;
  if (!sentinel) return undefined;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setReportVisibleCount((prev) => {
          const total = Array.isArray(reportRangeStudents) ? reportRangeStudents.length : 0;
          if (prev >= total) return prev;
          return Math.min(prev + REPORT_CARD_BATCH_SIZE, total);
        });
      }
    },
    {
      root: scrollRoot || null,
      rootMargin: "400px 0px",
      threshold: 0,
    }
  );

  observer.observe(sentinel);
  return () => observer.disconnect();
}, [allReportsPopupOpen, reportRangeStudents, reportVisibleCount]);

const buildTeacherIdCardPreviewUrl = (templateId, teacher, schoolName, schoolLogoValue = "", schoolAddressValue = "") => {
  const storage = typeof window !== "undefined" && window?.localStorage ? window.localStorage : { getItem: () => "" };

  const evictOldIdCardStorageEntries = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith("idcard_") && !k.startsWith("idcard_shared_")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => storage.removeItem(k));
    } catch {
      // ignore
    }
  };

  const stashLargeMediaValue = (value, keyPrefix, sharedKey = null) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const isLikelyLarge = raw.startsWith("data:image") || raw.length > 1800;
    if (!isLikelyLarge) return raw;

    const teacherKeyPart = String(
      teacher?.id ||
        teacher?.teacher_id ||
        teacher?.emp_id ||
        teacher?.employee_id ||
        teacher?.user_id ||
        teacher?.teacher_name ||
        teacher?.name ||
        "teacher"
    )
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 40);
    const key = sharedKey || `idcard_${keyPrefix}_${teacherKeyPart}`;

    try {
      storage.setItem(key, raw);
      return `storage:${key}`;
    } catch {
      evictOldIdCardStorageEntries();
      try {
        storage.setItem(key, raw);
        return `storage:${key}`;
      } catch {
        return raw;
      }
    }
  };

  const storedSchoolLogo = String(storage.getItem("schoolLogo") || "").trim();
  const storedSchoolName = String(storage.getItem("schoolName") || storage.getItem("school") || "").trim();
  const storedSchoolAddress = String(storage.getItem("schoolAddress") || "").trim();
  
  const resolvedSchoolName = String(schoolName && schoolName !== "Unknown School" ? schoolName : storedSchoolName || "ABC School").trim();
  const resolvedSchoolLogo = String(schoolLogoValue && schoolLogoValue !== "/default-logo.png" ? schoolLogoValue : storedSchoolLogo || "").trim();
  const resolvedSchoolAddress = String(schoolAddressValue || storedSchoolAddress || "").trim();
  
  const resolvedPhoto = resolveIdCardPhotoUrl(
    teacher?.photo ||
      teacher?.teacher_photo ||
      teacher?.teacherPhoto ||
      teacher?.photo_url ||
      teacher?.photoUrl ||
      teacher?.user_photo ||
      teacher?.userPhoto ||
      teacher?.profile_photo ||
      teacher?.profilePhoto ||
      teacher?.profile_image ||
      teacher?.profileImage ||
      teacher?.image ||
      teacher?.image_url ||
      teacher?.imageUrl ||
      teacher?.avatar ||
      ""
  );

  const safeSchoolLogo = stashLargeMediaValue(resolvedSchoolLogo, "school_logo", "idcard_shared_school_logo");
  const safeTeacherPhoto = stashLargeMediaValue(resolvedPhoto, "teacher_photo");

  const storedSignature = String(storage.getItem("idCardSignature") || "").trim();
  const storedSignatureScale = String(storage.getItem("idCardSignatureScale") || "").trim();
  const safeSignature = stashLargeMediaValue(storedSignature, "signature", "idcard_shared_signature");
  // const storedPrincipalPhoto = String(
  //   storage.getItem("idCardPrincipalPhoto") || storage.getItem("principalPhoto") || ""
  // ).trim();
  // const safePrincipalPhoto = stashLargeMediaValue(
  //   storedPrincipalPhoto,
  //   "principal_photo",
  //   "idcard_shared_principal_photo"
  // );

  const teacherName = String(
    teacher?.name ||
      teacher?.teacher_name ||
      teacher?.full_name ||
      teacher?.fullName ||
      teacher?.username ||
      teacher?.user_name ||
      "Teacher"
  );
  const designation = String(teacher?.designation || teacher?.role || teacher?.user_type || teacher?.role_name || "Teacher");
  const teacherPhone = String(teacher?.phone || teacher?.mobile || teacher?.phone_no || teacher?.contact || "-");

  const params = new URLSearchParams({
    cardType: "teacher",
    userType: "teacher",
    isTeacher: "true",
    school: resolvedSchoolName,
    schoolName: resolvedSchoolName,
    schoolLogo: safeSchoolLogo,
    logo: safeSchoolLogo,
    schoolAddress: resolvedSchoolAddress,
    signature: safeSignature,
    signatureScale: storedSignatureScale,
    // principalPhoto: safePrincipalPhoto,
    // principal: safePrincipalPhoto,
    name: teacherName,
    className: designation,
    designation: designation,
    phone: teacherPhone,
    section: "",
    department: "",
    subject: "",
    parent: "",
    admissionNo: "",
    rollNo: "",
    employeeNo: "",
    dob: "",
    bloodGroup: "",
    emergency: "",
    route: "",
    address: "",
    photo: safeTeacherPhoto,
    studentPhoto: safeTeacherPhoto,
    // classLabel: "Designation",
    sectionLabel: "",
    rollLabel: "",
    parentLabel: "",
    routeLabel: "",
    photoAlt: "Teacher photo"
  });

  return `${import.meta.env.BASE_URL}idcards/${templateId}?${params.toString()}`;
};

const handleOpenTeacherIdCardGeneration = async (teacherIdOverride = null, templateOverride = null) => {
  const templateToUse = normalizeIdCardTemplateName(templateOverride || selectedIdCardTemplate);
  const currentSchoolCode = localStorage.getItem("schoolCode") || schoolCode;

  setIdCardTargetType("teacher");
  setIdCardRangeLoading(true);
  setIdCardRangeLoadingMessage("Fetching teacher records...");
  setIdCardRangeError("");
  setIdCardRangeStudents([]);
  setAllIdCardsPopupOpen(true);

  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("idcard_"))
      .forEach((k) => localStorage.removeItem(k));
  } catch (error) {
    console.warn("Failed to clear stale ID card cache", error);
  }

  try {
    let teacherList = Array.isArray(teachers) && teachers.length > 0 ? teachers : [];

    // Ensure all fresh teachers are fetched if list is empty
    if (teacherList.length === 0 && currentSchoolCode) {
      try {
        const res = await axios.post("https://cleezoclass.com:4000/api/users", {
          schoolCode: currentSchoolCode,
          user_type: "teacher",
        });
        teacherList = Array.isArray(res.data) ? res.data : [];
        setTeachers(teacherList);
      } catch (e) {
        console.warn("Retrying teacher fetch from secondary port", e);
        try {
          const res5000 = await axios.post("https://cleezoclass.com:5000/api/users", {
            schoolCode: currentSchoolCode,
            user_type: "teacher",
          });
          teacherList = Array.isArray(res5000.data) ? res5000.data : [];
          setTeachers(teacherList);
        } catch (err) {
          console.warn("Could not fetch teachers dynamically", err);
        }
      }
    }

    if (teacherList.length === 0) {
      setIdCardRangeError("No teachers found for ID card generation.");
      setIdCardRangeLoading(false);
      return;
    }

    const targetTeacherId = teacherIdOverride !== null ? teacherIdOverride : selectedCardTeacher;
    const filtered = targetTeacherId
      ? teacherList.filter((t) => String(t?.id ?? t?.teacher_id ?? t?.emp_id ?? t?.user_id) === String(targetTeacherId))
      : teacherList;

    if (filtered.length === 0) {
      setIdCardRangeError("Selected teacher not found.");
      setIdCardRangeLoading(false);
      return;
    }

    setIdCardFileName(filtered.length === 1 ? `Teacher_IDCard_${(filtered[0]?.name || "Teacher").replace(/[^a-zA-Z0-9_-]/g, "_")}` : "Teacher_IDCards_Export");
    setIdCardRangeLoadingMessage(`Loading photos: 0 of ${filtered.length} teachers ready...`);

    // Preload and convert all teacher photos in chunked batches of 8 with real-time progress text
    const photoMap = await preloadStudentPhotosInChunks(
      filtered,
      8,
      (current, total) => {
        setIdCardRangeLoadingMessage(`Loading photos: ${current} of ${total} teachers ready...`);
      }
    );
    idCardPhotoCacheRef.current = photoMap;

    setSelectedIdCardTemplate(templateToUse);
    setGeneratedIdCardTemplate(templateToUse);
    localStorage.setItem(ID_CARD_TEMPLATE_STORAGE_KEY, templateToUse);

    // Populate all teachers after verification
    setIdCardRangeStudents(filtered);
  } catch (error) {
    setIdCardRangeError(error?.message || "Failed to load teachers for ID card generation.");
  } finally {
    setIdCardRangeLoading(false);
  }
};

  const fetchStudentReportPayload = async (student, currentSchoolCode) => {
    if (!student) return null;

    const className = String(student.class_name || student.class || student.className || "").trim();
    const section = String(student.section || student.section_name || student.sectionName || "").trim();
    const studentId = student.id || student.student_id;

    let enrichedStudent = student;
    if (className && section && (!student.father_name && !student.fatherName)) {
      try {
        const studentsRes = await axios.get(
          `https://cleezoclass.com:4000/api/studentsName/${encodeURIComponent(className)}?schoolCode=${encodeURIComponent(currentSchoolCode)}&section=${encodeURIComponent(section)}`
        );

        const detailedStudents = Array.isArray(studentsRes?.data?.students) ? studentsRes.data.students : [];
        const matchedStudent = detailedStudents.find((item) => {
          const itemId = item?.id ?? item?.student_id ?? item?.studentId;
          if (studentId != null && itemId != null) {
            return String(itemId) === String(studentId);
          }
          const itemUsername = item?.username || item?.user_name;
          const studentUsername = student?.username || student?.user_name;
          if (itemUsername && studentUsername) {
            return String(itemUsername).trim().toLowerCase() === String(studentUsername).trim().toLowerCase();
          }
          const itemAdmission = item?.admission_no || item?.admission_number || item?.admissionNo;
          const studentAdmission = student?.admission_no || student?.admission_number || student?.admissionNo;
          if (itemAdmission && studentAdmission) {
            return String(itemAdmission).trim().toLowerCase() === String(studentAdmission).trim().toLowerCase();
          }
          return (
            String(item?.name || item?.student_name || "").trim().toLowerCase() ===
              String(student?.name || student?.student_name || "").trim().toLowerCase() &&
            String(item?.class_name || item?.class || item?.className || "").trim().toLowerCase() === className.toLowerCase() &&
            String(item?.section || item?.section_name || item?.sectionName || "").trim().toLowerCase() === section.toLowerCase()
          );
        });

        if (matchedStudent) {
          enrichedStudent = { ...student, ...matchedStudent };
        }
      } catch (error) {
        console.error("Failed to enrich selected student details", error);
      }
    }

    const performancePayload = {
      name: enrichedStudent?.name || enrichedStudent?.student_name || "",
      class_name: className,
      section,
      schoolCode: currentSchoolCode,
    };

    const performanceAttempts = [
      () => axios.post(`${API_BASE}/overall/academic-performance`, performancePayload),
      () => axios.post(`https://cleezoclass.com:4000/api/overall/academic-performance`, performancePayload),
    ];

    let performance = [];
    let testTypes = [];
    for (const run of performanceAttempts) {
      try {
        const response = await run();
        performance = Array.isArray(response?.data) ? response.data : response?.data?.performance || [];
        testTypes = Array.isArray(response?.data?.testTypes) ? response.data.testTypes : [];
        break;
      } catch (error) {
        console.error("Failed academic performance attempt", error);
      }
    }

    const classKey = `${className}_${section}`.toLowerCase();
    const generalClassKey = className.toLowerCase();

    if (Array.isArray(performance) && performance.length > 0) {
      const classSubjects = performance.map((item) => item?.subject || item?.name || item?.title).filter(Boolean);
      const structure = {
        subjects: classSubjects,
        testTypes: Array.isArray(testTypes) && testTypes.length > 0 ? testTypes : [],
        samplePerformance: performance,
      };
      classAcademicStructureRef.current.set(classKey, structure);
      classAcademicStructureRef.current.set(generalClassKey, structure);
    } else {
      let classStructure =
        classAcademicStructureRef.current.get(classKey) ||
        classAcademicStructureRef.current.get(generalClassKey);

      if (!classStructure && Array.isArray(reportRangeStudents)) {
        for (const other of reportRangeStudents) {
          const otherId = getStudentUniqueId(other);
          const cachedOther = reportPayloadCacheRef.current.get(otherId);
          if (cachedOther?.performance && Array.isArray(cachedOther.performance) && cachedOther.performance.length > 0) {
            const subjects = cachedOther.performance.map((p) => p?.subject).filter(Boolean);
            classStructure = {
              subjects,
              testTypes: Array.isArray(cachedOther.testTypes) ? cachedOther.testTypes : [],
              samplePerformance: cachedOther.performance,
            };
            classAcademicStructureRef.current.set(classKey, classStructure);
            classAcademicStructureRef.current.set(generalClassKey, classStructure);
            break;
          }
        }
      }

      if (classStructure && Array.isArray(classStructure.subjects) && classStructure.subjects.length > 0) {
        testTypes = Array.isArray(classStructure.testTypes) && classStructure.testTypes.length > 0
          ? classStructure.testTypes
          : (testTypes || []);
        performance = classStructure.subjects.map((subject) => {
          const sample = Array.isArray(classStructure.samplePerformance)
            ? classStructure.samplePerformance.find((p) => (p?.subject || p?.name || p?.subject_name || p?.title) === subject)
            : null;

          let subjectTests = {};
          let subjectMax = Number(sample?.maxMarks ?? sample?.totalMarks ?? sample?.maximumMarks);
          if (sample?.tests && typeof sample.tests === "object") {
            Object.keys(sample.tests).forEach((k) => {
              const entry = sample.tests[k];
              const entryMax = Number(entry?.max ?? entry?.maxMarks ?? entry?.maximumMarks ?? 20);
              subjectTests[k] = {
                obtained: null,
                marksObtained: null,
                max: entryMax > 0 ? entryMax : 20,
                maxMarks: entryMax > 0 ? entryMax : 20,
                absent: true,
                status: "Absent",
              };
            });
          } else if (Array.isArray(testTypes) && testTypes.length > 0) {
            testTypes.forEach((t) => {
              const k = t.key || t.label || "";
              const entryMax = Number(t.maxMarks || 20);
              subjectTests[k] = {
                obtained: null,
                marksObtained: null,
                max: entryMax > 0 ? entryMax : 20,
                maxMarks: entryMax > 0 ? entryMax : 20,
                absent: true,
                status: "Absent",
              };
            });
          } else {
            subjectTests["FA1"] = { obtained: null, marksObtained: null, max: 20, maxMarks: 20, absent: true, status: "Absent" };
          }

          return {
            subject,
            isAbsent: true,
            status: "Absent",
            tests: subjectTests,
            FA: ["AB", "AB", "AB", "AB"],
            SA: ["AB", "AB"],
            obtainedMarks: null,
            marksObtained: null,
            totalMarks: subjectMax > 0 ? subjectMax : null,
            maxMarks: subjectMax > 0 ? subjectMax : null,
            percentage: null,
          };
        });
      }
    }

    const attendanceAttempts = [
      () => axios.post(`${API_BASE}/report/attendance/monthly`, performancePayload),
      () => axios.post(`https://cleezoclass.com:4000/api/report/attendance/monthly`, performancePayload),
    ];

    let attendance = [];
    for (const run of attendanceAttempts) {
      try {
        const response = await run();
        attendance = Array.isArray(response?.data?.monthly) ? response.data.monthly : [];
        break;
      } catch (error) {
        console.error("Failed attendance attempt", error);
      }
    }

    const normalizedPerformance = normalizePerformanceForTemplate(performance);

    const payload = {
      student: {
        ...enrichedStudent,
        name: enrichedStudent?.name || enrichedStudent?.student_name || "",
        class_name: className,
        section,
        father_name: enrichedStudent?.father_name || enrichedStudent?.fatherName || "",
        address: enrichedStudent?.address || enrichedStudent?.student_address || "",
        phone_no:
          enrichedStudent?.phone_no ||
          enrichedStudent?.phone ||
          enrichedStudent?.mobile ||
          enrichedStudent?.mobile_no ||
          "",
        aadhar_no: enrichedStudent?.aadhar_no || enrichedStudent?.aadhar || "",
        admission_no: enrichedStudent?.admission_no || enrichedStudent?.admissionNumber || "",
        dob: enrichedStudent?.dob || enrichedStudent?.date_of_birth || "",
        photo: (
          (reportPhotoCacheRef.current?.get(getStudentUniqueId(enrichedStudent))?.dataUrl) ||
          (idCardPhotoCacheRef.current?.get(getStudentUniqueId(enrichedStudent))?.dataUrl) ||
          resolveIdCardPhotoUrl(getStudentRawPhoto(enrichedStudent))
        ),
        schoolCode: currentSchoolCode,
      },
      performance: normalizedPerformance,
      testTypes,
      attendance,
      overall: computeOverallTotals(normalizedPerformance),
      syncedAt: new Date().toISOString(),
    };

    return { payload, enrichedStudent };
  };

  const handleOpenStudentAcademicReport = async (student) => {
    if (!student) return;
    const currentSchoolCode = localStorage.getItem("schoolCode") || schoolCode;

    try {
      setReportPreviewLoading(true);
      const res = await fetchStudentReportPayload(student, currentSchoolCode);
      if (!res) return;
      let { payload, enrichedStudent } = res;

      if (reportCardRankMode === 'with-rank') {
        const studentId = getStudentUniqueId(student);
        const rankInfo = reportRankMapRef.current?.get(studentId);
        if (rankInfo && rankInfo.rank != null) {
          payload = {
            ...payload,
            overall: { ...(payload.overall || {}), rank: rankInfo.rank, totalStudents: rankInfo.totalStudents },
            student: { ...(payload.student || {}), rank: rankInfo.rank, totalStudents: rankInfo.totalStudents },
          };
        } else {
          payload = {
            ...payload,
            overall: { ...(payload.overall || {}), rank: "Absent" },
            student: { ...(payload.student || {}), rank: "Absent" },
          };
        }
      } else {
        if (payload?.student?.rank != null) {
          const nextStudent = { ...payload.student };
          delete nextStudent.rank;
          delete nextStudent.totalStudents;
          payload = { ...payload, student: nextStudent };
        }
        if (payload?.overall?.rank != null) {
          const nextOverall = { ...payload.overall };
          delete nextOverall.rank;
          delete nextOverall.totalStudents;
          payload = { ...payload, overall: nextOverall };
        }
      }

      localStorage.setItem("reportCardPayload", JSON.stringify(payload));
      setSelectedReportStudent(enrichedStudent);
      setSelectedReportPayload(payload);
      setReportPopupOpen(true);
    } catch (error) {
      console.error("Failed to load academic report preview", error);
      setPopupMessage("Failed to load academic report card.");
    } finally {
      setReportPreviewLoading(false);
    }
  };

  const handleConfirmTemplatePreview = async () => {
    const { kind, templateId } = templatePreviewState;
    if (!templateId) return;

    closeTemplatePreview();

    if (kind === "reportCard") {
      const normalized = handleChooseReportCardTemplate(templateId);
      handlePromptReportCardGeneration(normalized);
      return;
    }

        if (kind === "idCard") {
      const normalized = handleChooseIdCardTemplate(templateId);
      if (idCardAudience === "teacher") {
        await handleOpenTeacherIdCardGeneration(null, normalized);
      } else {
        await handleOpenIdCardGeneration(normalized);
      }
    }
  };

const captureAcademicReportCanvas = async () => {
  const iframe = reportPreviewFrameRef.current;
  if (!iframe?.contentWindow?.document || !selectedReportPayload?.student) return null;

  const doc = iframe.contentWindow.document;
  const win = iframe.contentWindow;

  const target =
    doc.querySelector(".report-card") ||
    doc.querySelector(".sheet") ||
    doc.querySelector(".report") ||
    doc.querySelector(".container") ||
    doc.querySelector(".page") ||
    doc.querySelector(".card") ||
    doc.querySelector(".report-wrapper") ||
    doc.querySelector(".landscape-wrap") ||
    doc.body;

  if (!target) return null;

  // Save current inline styles on doc.body
  const savedBodyTransform = doc.body.style.transform;
  const savedBodyTransformOrigin = doc.body.style.transformOrigin;
  const savedBodyWidth = doc.body.style.width;
  const savedBodyMinHeight = doc.body.style.minHeight;
  const savedBodyMargin = doc.body.style.margin;
  const savedBodyPadding = doc.body.style.padding;
  const savedBodyBackground = doc.body.style.background;

  // Save current inline styles on target
  const savedTargetTransform = target.style.transform;
  const savedTargetTransformOrigin = target.style.transformOrigin;
  const savedTargetMargin = target.style.margin;
  const savedTargetPosition = target.style.position;
  const savedTargetLeft = target.style.left;
  const savedTargetTop = target.style.top;

  // Inject temporary capture styles to reset transformations and centering
  let captureStyle = doc.getElementById("academic-report-capture-overrides");
  if (!captureStyle) {
    captureStyle = doc.createElement("style");
    captureStyle.id = "academic-report-capture-overrides";
    doc.head?.appendChild(captureStyle);
  }

  captureStyle.textContent = `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: auto !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      background: #ffffff !important;
      transform: none !important;
    }
    .report-card, .sheet, .report, .container, .page, .card, .report-wrapper, .landscape-wrap {
      position: relative !important;
      left: 0 !important;
      top: 0 !important;
      right: auto !important;
      bottom: auto !important;
      margin: 0 auto !important;
      transform: none !important;
      box-shadow: none !important;
      --page-scale: 1 !important;
      --report-scale: 1 !important;
    }
  `;

  // Temporarily reset body and target inline styles
  doc.body.style.transform = "none";
  doc.body.style.transformOrigin = "top left";
  doc.body.style.width = "auto";
  doc.body.style.minHeight = "0";
  doc.body.style.margin = "0";
  doc.body.style.padding = "0";
  doc.body.style.background = "#ffffff";

  target.style.transform = "none";
  target.style.transformOrigin = "top left";
  target.style.position = "relative";
  target.style.left = "0";
  target.style.top = "0";
  target.style.margin = "0 auto";

  try {
    win.scrollTo?.(0, 0);
  } catch (_) {}

  // Wait briefly for reflow
  await new Promise((r) => setTimeout(r, 120));

  try {
    const targetRect = target.getBoundingClientRect();
    const captureWidth = Math.ceil(target.offsetWidth || targetRect.width || target.scrollWidth);
    const captureHeight = Math.ceil(target.offsetHeight || targetRect.height || target.scrollHeight);

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: captureWidth,
      height: captureHeight,
      windowWidth: Math.max(captureWidth + 200, doc.documentElement.scrollWidth || 0),
      windowHeight: Math.max(captureHeight + 200, doc.documentElement.scrollHeight || 0),
    });

    return canvas;
  } finally {
    // Clean up temporary capture style
    captureStyle?.remove?.();

    // Restore target styles
    target.style.transform = savedTargetTransform;
    target.style.transformOrigin = savedTargetTransformOrigin;
    target.style.margin = savedTargetMargin;
    target.style.position = savedTargetPosition;
    target.style.left = savedTargetLeft;
    target.style.top = savedTargetTop;

    // Restore body styles
    doc.body.style.transform = savedBodyTransform;
    doc.body.style.transformOrigin = savedBodyTransformOrigin;
    doc.body.style.width = savedBodyWidth;
    doc.body.style.minHeight = savedBodyMinHeight;
    doc.body.style.margin = savedBodyMargin;
    doc.body.style.padding = savedBodyPadding;
    doc.body.style.background = savedBodyBackground;

    // Restore fit in preview
    applyReportPreviewFit(iframe);
  }
};

const handleDownloadAcademicReport = async () => {
  try {
    const canvas = await captureAcademicReportCanvas();
    if (!canvas) return;

    // 2px margin in mm (at 96 DPI: 1in = 25.4mm, 96px = 25.4mm -> 2px = (2 * 25.4) / 96 mm)
    const MARGIN_MM = (2 * 25.4) / 96;

    // Determine orientation (landscape or portrait)
    const orientation = canvas.width > canvas.height ? "l" : "p";
    
    // Create PDF with jsPDF
    const pdf = new jsPDF(orientation, "mm", "a4");
    const pageWidth = orientation === "l" ? 297 : 210;
    const pageHeight = orientation === "l" ? 210 : 297;
    
    // Calculate dimensions maintaining aspect ratio within 2px margins
    const availableWidth = Math.max(0, pageWidth - (MARGIN_MM * 2));
    const availableHeight = Math.max(0, pageHeight - (MARGIN_MM * 2));

    const imageRatio = canvas.width / canvas.height;
    const availableRatio = availableWidth / availableHeight;
    let renderWidth;
    let renderHeight;
    
    if (imageRatio > availableRatio) {
      renderWidth = availableWidth;
      renderHeight = renderWidth / imageRatio;
    } else {
      renderHeight = availableHeight;
      renderWidth = renderHeight * imageRatio;
    }

    // Center the image on the page
    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;
    
    // Add image and save
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, renderWidth, renderHeight);
    pdf.save(`${selectedReportPayload?.student?.name || "Student"}_ReportCard.pdf`);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    alert("Failed to download PDF.");
  }
};

const handleDownloadAcademicReportImage = async () => {
  try {
    const canvas = await captureAcademicReportCanvas();
    if (!canvas) return;

    // Create download link
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `${selectedReportPayload?.student?.name || "Student"}_ReportCard.png`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading image:", error);
    alert("Failed to download image.");
  }
};
const handleDownloadAcademicReportExcel = () => {
  if (!selectedReportPayload) return;

  // ⚠️ NOTE: Adjust these keys based on your actual selectedReportPayload structure
  const { student, subjects, overall } = selectedReportPayload; 

  // 1. Create Student Details Sheet
  const studentDetails = [
    ["Student Name", student?.name || ""],
    ["Class", student?.class || ""],
    ["Section", student?.section || ""],
    ["Father's Name", student?.fatherName || ""],
    ["Academic Year", student?.academicYear || ""],
  ];
  const wsDetails = XLSX.utils.aoa_to_sheet(studentDetails);

  // 2. Create Marks/Subjects Sheet
  let wsMarks;
  if (subjects && Array.isArray(subjects) && subjects.length > 0) {
    // Dynamically get headers from the first subject object
    const headers = Object.keys(subjects[0]); 
    const marksData = [
      headers, 
      ...subjects.map(sub => headers.map(h => sub[h])) // Map values safely
    ];
    wsMarks = XLSX.utils.aoa_to_sheet(marksData);
  } else {
    // Fallback if no subjects array is found
    wsMarks = XLSX.utils.json_to_sheet([student || {}]); 
  }

  // 3. Create Workbook and Append Sheets
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsDetails, "Student Details");
  XLSX.utils.book_append_sheet(wb, wsMarks, "Marks & Subjects");

  // 4. Add Overall Summary Sheet (if available)
  if (overall) {
    const overallData = [
      ["Total Marks", overall.totalMarks || ""],
      ["Obtained Marks", overall.obtainedMarks || ""],
      ["Percentage", overall.percentage || ""],
      ["Grade", overall.grade || ""],
      ["Result", overall.result || ""],
      ...(overall.rank ? [["Rank", `${overall.rank} of ${overall.totalStudents || ""}`]] : []),
    ];
    const wsOverall = XLSX.utils.aoa_to_sheet(overallData);
    XLSX.utils.book_append_sheet(wb, wsOverall, "Overall Summary");
  }

  // 5. Trigger Excel Download
  XLSX.writeFile(wb, `${student?.name || "Student"}_ReportCard.xlsx`);
};
  const handleTemplateScroll = (kind, direction) => {
    const track = templateTrackRefs.current?.[kind];
    if (!track) return;
    const step = Math.max(220, Math.floor(track.clientWidth * 0.72));
    track.scrollBy({
      left: direction === "next" ? step : -step,
      behavior: "smooth",
    });
  };

  const normalizeArrayResponse = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.rows)) return value.rows;
    if (Array.isArray(value?.sections)) return value.sections;
    if (Array.isArray(value?.students)) return value.students;
    return [];
  };

  const getPosterTemplates = () => {
    const eventTemplates = eventPosterTemplates.map((template) => ({
      key: template.id,
      label: template.label,
      kind: "iframe",
      src: import.meta.env.BASE_URL + `Events/${template.id}`,
    }));

    if (posterTemplateCategory === "B-days") {
      return birthdayPosterTemplates.map((template) => ({
        key: template.id,
        label: template.label,
        kind: "iframe",
        src: import.meta.env.BASE_URL + `Bdays/${template.id}`,
      }));
    }

    if (posterTemplateCategory === "All") {
      return [
        ...eventTemplates,
        ...generationTemplates.map((template) => ({
          key: template.key,
          className: template.className,
          kind: "swatch",
          isUpload: template.isUpload,
        })),
        ...birthdayPosterTemplates.map((template) => ({
          key: template.id,
          label: template.label,
          kind: "iframe",
          src: import.meta.env.BASE_URL + `Bdays/${template.id}`,
        })),
      ];
    }

    return eventTemplates;
  };

  useEffect(() => {
    const templates = getPosterTemplates();
    if (!templates.some((template) => template.key === selectedPosterTemplate)) {
      setSelectedPosterTemplate(templates[0]?.key || "");
    }
  }, [posterTemplateCategory]);

  const handleSendPosterToClassSection = async () => {
    const className = String(liveChatForm.className || "").trim();
    const section = String(liveChatForm.section || "").trim();
    const templateId = String(selectedPosterTemplate || "").trim();
    const isEventTemplate = /^event[1-6]\.html$/i.test(templateId);
    const isBirthdayTemplate = /^birthday[1-5]\.html$/i.test(templateId);

    if (!schoolCode) {
      setPopupMessage("Missing school code.");
      window.alert("Poster sending failed: Missing school code.");
      return;
    }

    if (!className || !section) {
      setPopupMessage("Please select class and section.");
      window.alert("Poster sending failed: Please select class and section.");
      return;
    }

    if (!templateId) {
      setPopupMessage("Please select a poster template.");
      window.alert("Poster sending failed: Please select a poster template.");
      return;
    }

    if (!isEventTemplate && !isBirthdayTemplate) {
      setPopupMessage("Please select a valid Events or Birthday template.");
      window.alert("Poster sending failed: Please select a valid Events or Birthday template.");
      return;
    }

    setSendingPoster(true);
    try {
      const response = await fetchJson(`${API_BASE}/admin-event-posters/send`, {
        method: "POST",
        body: JSON.stringify({
          schoolCode,
          className,
          section,
          templateId,
          eventDate: eventForm.eventDate || null,
          eventTime: eventForm.eventTime || null,
          audience: posterAudienceTab || "Student",
        }),
      });

      const queuedCount = Number(response?.data?.queuedCount || 0);
      if (queuedCount > 0) {
        const kindLabel = isBirthdayTemplate ? "Birthday" : "Event";
        const successMessage = `${kindLabel} poster queued for ${queuedCount} students in Class ${className} - ${section}.`;
        setPopupMessage(successMessage);
        window.alert(`Poster sent successfully. ${successMessage}`);
      } else {
        const notSentMessage = "Poster not sent: No students found for selected class and section.";
        setPopupMessage(notSentMessage);
        window.alert(notSentMessage);
      }
    } catch (error) {
      const failMessage = error?.message || "Failed to send poster.";
      setPopupMessage(failMessage);
      window.alert(`Poster sending failed: ${failMessage}`);
    } finally {
      setSendingPoster(false);
    }
  };

const renderGenerationCard = (title, kind = "generic") => (
    <div className="admin-events-generation-card accountant-card">
      <div className="admin-events-card-header">
        <h3>{title}</h3>
      </div>
      <div className="admin-events-generation-subtitle">Choose Templates</div>
      <div className="admin-events-template-row">
        <button
          type="button"
          className="admin-events-template-nav"
          aria-label="Previous template"
          onClick={() => handleTemplateScroll(kind, "prev")}
        >
          <FaChevronLeft />
        </button>
        <div
          className="admin-events-template-track"
          ref={(node) => {
            if (kind === "reportCard" || kind === "idCard") {
              templateTrackRefs.current[kind] = node;
            }
          }}
        >
          {kind === "reportCard"
            ? reportCardFormats.map((template) => {
                const isSelected = selectedReportCardTemplate === template.id;
                return (
                  <button
                    key={`${title}-${template.id}`}
                    type="button"
                    className={`admin-events-template-card admin-events-report-template-card ${isSelected ? "is-selected" : ""}`}
                    aria-label={`${title} ${template.label}`}
                    onClick={() => openTemplatePreview("reportCard", template.id, template.label)}
                  >
                    {/* <span className="admin-events-template-art" /> */}
                    <small className="admin-events-template-label">{template.label}</small>
                  </button>
                );
              })
            : kind === "idCard"
              ? idCardFormats.map((template) => {
                  const isSelected = selectedIdCardTemplate === template.id;
                  return (
                    <button
                      key={`${title}-${template.id}`}
                      type="button"
                      className={`admin-events-template-card admin-events-id-card-template-card ${isSelected ? "is-selected" : ""}`}
                      aria-label={`${title} ${template.label}`}
                      onClick={() => openTemplatePreview("idCard", template.id, template.label)}
                    >
                      {/* <span className="admin-events-template-art" /> */}
                      <small className="admin-events-template-label">{template.label}</small>
                    </button>
                  );
                })
              : generationTemplates.map((template) => (
                  <button
                    key={`${title}-${template.key}`}
                    type="button"
                    className={`admin-events-template-card ${template.className}`}
                    aria-label={`${title} ${template.key} template`}
                  >
                    <span className="admin-events-template-art" />
                    {template.isUpload ? <span className="admin-events-template-badge">+</span> : null}
                  </button>
                ))}
        </div>
        <button
          type="button"
          className="admin-events-template-nav"
          aria-label="Next template"
          onClick={() => handleTemplateScroll(kind, "next")}
        >
          <FaChevronRight />
        </button>
      </div>
      <div className="admin-events-generation-filter-grid">
        {/* <label className="admin-events-generation-field">
          <span>Selection</span>
          <select value={liveChatForm.className ? "classwise" : ""} onChange={() => {}}>
            <option value="">Classwise / Curriculum</option>
            <option value="classwise">Classwise / Curriculum</option>
          </select>
        </label> */}
 
      </div>

      {kind === "idCard" && (
        <div style={{ display: "flex", gap: "10px", marginTop: "14px", marginBottom: "8px" }}>
          <button
            type="button"
            onClick={() => setIdCardAudience("student")}
            style={{
              flex: "1",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "8px",
              backgroundColor: idCardAudience === "student" ? "#1e3a8a" : "#f1f5f9",
              color: idCardAudience === "student" ? "#ffffff" : "#475569",
              border: idCardAudience === "student" ? "1px solid #1e3a8a" : "1px solid #cbd5e1",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Students
          </button>
          <button
            type="button"
            onClick={() => setIdCardAudience("teacher")}
            style={{
              flex: "1",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "8px",
              backgroundColor: idCardAudience === "teacher" ? "#203864" : "#f1f5f9",
              color: idCardAudience === "teacher" ? "#ffffff" : "#475569",
              border: idCardAudience === "teacher" ? "1px solid #203864" : "1px solid #cbd5e1",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            Teachers ({teachers.length})
          </button>
        </div>
      )}

      <div className="admin-events-generation-filter-grid">
        {kind === "idCard" && idCardAudience === "teacher" ? (
          <>
            <label className="admin-events-generation-field">
              <span>Teacher</span>
              <select
                value={selectedCardTeacher}
                onChange={(e) => setSelectedCardTeacher(e.target.value)}
                disabled={loadingTeachers || teachers.length === 0}
              >
                <option value="">All Teachers ({teachers.length})</option>
                {teachers.map((t, index) => (
                  <option key={`teacher-opt-${t?.id || index}`} value={String(t?.id ?? t?.teacher_id ?? t?.emp_id)}>
                    {t?.name || t?.teacher_name || `Teacher ${index + 1}`} {t?.designation ? `(${t.designation})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="admin-events-generation-select-btn"
              onClick={() => handleOpenTeacherIdCardGeneration()}
              disabled={loadingTeachers || teachers.length === 0 || idCardRangeLoading}
              style={{ backgroundColor: "#203864" }}
            >
              {idCardRangeLoading && idCardTargetType === "teacher" ? "Loading..." : "Generate Teacher ID Cards"}
            </button>
          </>
        ) : (
          <>
            <label className="admin-events-generation-field">
              <span>Class</span>
              <select
                value={generationRange.className}
                onChange={(e) => setGenerationRange({ className: e.target.value, section: "" })}
              >
                <option value="">Class</option>
                {classOptions.map((item, index) => (
                  <option key={`${title}-class-${item}-${index}`} value={String(item)}>
                    {String(item)}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-events-generation-field">
              <span>Section</span>
              <select
                value={generationRange.section}
                onChange={(e) => setGenerationRange((prev) => ({ ...prev, section: e.target.value }))}
                disabled={!generationRange.className}
              >
                <option value="">Section</option>
                {generationSectionOptions.map((item, index) => (
                  <option key={`${title}-section-${item}-${index}`} value={String(item)}>
                    {String(item)}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="admin-events-generation-select-btn"
              onClick={
                kind === "reportCard"
                  ? () => handlePromptReportCardGeneration()
                  : kind === "idCard"
                    ? () => handleOpenIdCardGeneration()
                    : openLiveChatPopup
              }
              disabled={kind === "reportCard" ? reportRangeLoading : kind === "idCard" ? idCardRangeLoading : false}
            >
              {kind === "reportCard" ? (reportRangeLoading ? "Loading..." : "Generate") : kind === "idCard" ? (idCardRangeLoading ? "Loading..." : "Generate") : "Select"}
            </button>
          </>
        )}
      </div>

      {kind === "reportCard" && reportRangeError ? (
        <div className="admin-events-generation-feedback">{reportRangeError}</div>
      ) : null}
      {kind === "idCard" && idCardRangeError ? (
        <div className="admin-events-generation-feedback">{idCardRangeError}</div>
      ) : null}
    </div>
  );

  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.message || result?.error || "Request failed");
    }
    return result;
  };

  const loadAdminRecords = async () => {
    if (!schoolCode) {
      setPopupMessage("Missing school code.");
      return;
    }

    setLoadingRecords(true);
    try {
      const month = String(calendarMonth + 1);
      const year = String(calendarYear);
      const query = `schoolCode=${encodeURIComponent(schoolCode)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(month)}`;

      const [announcementRes, eventRes, meetingRes] = await Promise.all([
        fetchJson(`${API_BASE}/admin-announcements?${query}`),
        fetchJson(`${API_BASE}/admin-events?${query}`),
        fetchJson(`${API_BASE}/admin-meetings?${query}`),
      ]);

      setAnnouncements(Array.isArray(announcementRes.data) ? announcementRes.data : []);
      setEvents(Array.isArray(eventRes.data) ? eventRes.data : []);
      setMeetings(Array.isArray(meetingRes.data) ? meetingRes.data : []);
    } catch (error) {
      setPopupMessage(error.message || "Failed to load admin records.");
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadAdminRecords();
  }, [calendarMonth, calendarYear, schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;

    const loadLiveChatMeta = async () => {
      try {
        const [{ data: staffData }, { data: classData }, { data: studentsData }] = await Promise.all([
          axios.get(`${API_BASE}/party1`, { params: { schoolCode } }),
          axios.get(`${API_BASE}/classes`, { params: { schoolCode } }),
          axios.get(`${API_BASE}/students-details`, { params: { schoolCode } }).catch(() => ({ data: [] })),
        ]);

        setParty1List(Array.isArray(staffData) ? staffData : []);
        const normalizedClasses = normalizeClassCollection(classData);
        const fallbackStudentClasses = normalizeClassCollection(studentsData);
        setClassOptions((normalizedClasses.length > 0 ? normalizedClasses : fallbackStudentClasses).sort(compareClassValues));
      } catch (error) {
        console.error("Failed to load live chat meta", error);
      }
    };

    loadLiveChatMeta();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode || !liveChatForm.className) {
      setSectionOptions([]);
      setStudentOptions([]);
      setSelectedCardStudent("");
      return;
    }

    axios
      .get(`${API_BASE}/sections/${encodeURIComponent(liveChatForm.className)}`, {
        params: { schoolCode },
      })
      .then((res) => {
        setSectionOptions(normalizeArrayResponse(res.data));
        setSelectedCardStudent("");
        setLiveChatForm((prev) => ({ ...prev, section: "", student: "" }));
      })
      .catch((error) => {
        console.error("Failed to load sections", error);
        setSectionOptions([]);
      });
  }, [liveChatForm.className, schoolCode]);

  useEffect(() => {
    if (!schoolCode || !generationRange.className) {
      setGenerationSectionOptions([]);
      setGenerationRange((prev) => (prev.section ? { ...prev, section: "" } : prev));
      return;
    }

    axios
      .get(`${API_BASE}/sections/${encodeURIComponent(generationRange.className)}`, {
        params: { schoolCode },
      })
      .then((res) => {
        setGenerationSectionOptions(normalizeArrayResponse(res.data));
        setGenerationRange((prev) => ({ ...prev, section: "" }));
      })
      .catch((error) => {
        console.error("Failed to load generation sections", error);
        setGenerationSectionOptions([]);
        setGenerationRange((prev) => (prev.section ? { ...prev, section: "" } : prev));
      });
  }, [generationRange.className, schoolCode]);

  useEffect(() => {
    if (!schoolCode || !liveChatForm.className || !liveChatForm.section) {
      setStudentOptions([]);
      setSelectedCardStudent("");
      return;
    }

    axios
      .get(`${API_BASE}/admin/students/${encodeURIComponent(liveChatForm.className)}/${encodeURIComponent(liveChatForm.section)}`, {
        params: { schoolCode },
      })
      .then((res) => {
        setStudentOptions(normalizeArrayResponse(res.data));
        setSelectedCardStudent("");
        setLiveChatForm((prev) => ({ ...prev, student: "" }));
      })
      .catch((error) => {
        console.error("Failed to load students", error);
        setStudentOptions([]);
      });
  }, [liveChatForm.className, liveChatForm.section, schoolCode]);

  const loadChatRequests = async () => {
    if (!schoolCode) return;
    setChatLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/chat-requests`, {
        params: { schoolCode },
      });
      setChatRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load chat requests", error);
      setChatRequests([]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    loadChatRequests();
  }, [schoolCode]);

  useEffect(() => {
    if (!schoolCode) return;

    const fetchStoreActions = async () => {
      setStoreActionsLoading(true);
      setStoreActionsError("");
      try {
        const res = await fetch(`${API_BASE}/po/requests?schoolCode=${encodeURIComponent(schoolCode)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setStoreActions(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []);
      } catch (error) {
        console.error("Failed to load store actions", error);
        setStoreActionsError("Failed to load store actions.");
        setStoreActions([]);
      } finally {
        setStoreActionsLoading(false);
      }
    };

    fetchStoreActions();
  }, [schoolCode]);

  const openAnnouncementPopup = (day) => {
    const selectedDate = buildDateValue(day) || announcementForm.announcementDate;
    setAnnouncementForm((prev) => ({
      ...prev,
      announcementDate: selectedDate,
    }));
    setPopupType("announcement");
  };

  const openEventPopup = (day) => {
    const selectedDate = buildDateValue(day) || eventForm.eventDate;
    setEventForm((prev) => ({
      ...prev,
      eventDate: selectedDate,
    }));
    setEventMeetingTab("event");
    setPopupType("eventMeeting");
  };

  const openMeetingPopup = (day) => {
    const selectedDate = buildDateValue(day) || meetingForm.meetingDate;
    setMeetingForm((prev) => ({
      ...prev,
      meetingDate: selectedDate,
    }));
    setEventMeetingTab("meeting");
    setPopupType("eventMeeting");
  };

  const closePopup = () => setPopupType("");

  const openLiveChatPopup = () => setPopupType("liveChat");

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.announcementDate) {
      setPopupMessage("Announcement title and date are required.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchJson(`${API_BASE}/admin-announcements`, {
        method: "POST",
        body: JSON.stringify({
          schoolCode,
          ...announcementForm,
        }),
      });

      setPopupMessage("Announcement saved successfully.");
      setAnnouncementForm((prev) => ({
        ...prev,
        title: "",
        description: "",
      }));
      closePopup();
      await loadAdminRecords();
    } catch (error) {
      setPopupMessage(error.message || "Failed to save announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.eventName.trim() || !eventForm.eventDate) {
      setPopupMessage("Event name and date are required.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchJson(`${API_BASE}/admin-events`, {
        method: "POST",
        body: JSON.stringify({
          schoolCode,
          ...eventForm,
        }),
      });

      setPopupMessage("Event saved successfully.");
      setEventForm((prev) => ({
        ...prev,
        eventName: "",
        eventTime: "",
        description: "",
      }));
      closePopup();
      await loadAdminRecords();
    } catch (error) {
      setPopupMessage(error.message || "Failed to save event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!meetingForm.meetingTitle.trim() || !meetingForm.meetingDate) {
      setPopupMessage("Meeting title and date are required.");
      return;
    }

    setSubmitting(true);
    try {
      await fetchJson(`${API_BASE}/admin-meetings`, {
        method: "POST",
        body: JSON.stringify({
          schoolCode,
          ...meetingForm,
        }),
      });

      setPopupMessage("Meeting saved successfully.");
      setMeetingForm((prev) => ({
        ...prev,
        meetingTitle: "",
        meetingTime: "",
        agenda: "",
        description: "",
      }));
      closePopup();
      await loadAdminRecords();
    } catch (error) {
      setPopupMessage(error.message || "Failed to save meeting.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLiveChatRequest = async () => {
    const { party1, className, section, student, date, time } = liveChatForm;

    if (!party1 || !className || !section || !student) {
      setPopupMessage("Staff, class, section, and student are required.");
      return;
    }

    const party1Obj = party1List.find((item) => item.name === party1);
    if (!party1Obj) {
      setPopupMessage("Please select a valid staff member.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API_BASE}/chat-request`, {
        party1_id: party1Obj.id,
        party1_name: party1Obj.name,
        party2_class: className,
        party2_section: section,
        party2_student: student,
        date,
        time,
        schoolCode,
      });

      if (!data?.success) {
        throw new Error(data?.message || "Failed to save chat request.");
      }

      setPopupMessage("Individual chat request has been successfully saved.");
      setSelectedCardStaff(party1);
      setSelectedCardStudent(student);
      setLiveChatForm({
        party1: "",
        className,
        section,
        student: "",
        date: new Date().toISOString().split("T")[0],
        time: "",
      });
      closePopup();
      await loadChatRequests();
    } catch (error) {
      console.error("Failed to save chat request", error);
      setPopupMessage(error?.response?.data?.message || error.message || "Failed to save chat request.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCardHTML = async (student, side) => {
    const url = buildIdCardPreviewUrl(
      normalizeIdCardTemplateName(generatedIdCardTemplate || selectedIdCardTemplate),
      student,
      schoolName,
      schoolLogo,
      localStorage.getItem("schoolAddress") || ""
    );
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      return doc.body.innerHTML;
    } catch (error) {
      console.warn("Could not fetch template HTML, using fallback. Ensure same-origin or CORS is enabled.", error);
      return `
        <div style="width: 350px; height: 220px; border: 2px solid #333; border-radius: 10px; padding: 15px; box-sizing: border-box; background: #fff; font-family: Arial, sans-serif;">
          <h3 style="margin: 0 0 10px 0; color: #2c3e50; text-align: center;">${schoolName}</h3>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${student.name}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Class:</strong> ${student.class_name || 'N/A'} - ${student.section || 'N/A'}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Side:</strong> ${side.toUpperCase()}</p>
        </div>
      `;
    }
  };


// 🔥 Helper: Auto-scale content to fit within card boundaries
const fitContentToCard = (element, maxWidth, maxHeight) => {
  const naturalWidth = element.scrollWidth;
  const naturalHeight = element.scrollHeight;

  const scaleX = maxWidth / naturalWidth;
  const scaleY = maxHeight / naturalHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  if (scale < 1) {
    element.style.transform = `scale(${scale})`;
    element.style.transformOrigin = 'top left';
    element.style.width = `${naturalWidth}px`;
    element.style.height = `${naturalHeight}px`;
  }
};

const findIdCardCaptureTarget = (doc, side = "front") => {
  if (!doc?.body) return null;

  const isVisibleCard = (node) =>
    node instanceof HTMLElement && node.getBoundingClientRect().width > 20 && node.getBoundingClientRect().height > 20;

  const cardContainerSelector = ".model-id-card, .id-card, .card, .badge-holder, .card-holder, .back-card";
  const getVisibleCardContainer = (node) => {
    if (!(node instanceof HTMLElement)) return null;
    const container = node.matches(cardContainerSelector) ? node : node.closest(cardContainerSelector);
    return isVisibleCard(container) ? container : null;
  };

  const getTopLevelVisibleMatches = (selector) => {
    const matches = Array.from(doc.querySelectorAll(selector)).filter(isVisibleCard);
    return matches.filter(
      (node) => !matches.some((other) => other !== node && other.contains(node))
    );
  };

  const getBestVisibleMatch = (selector) => {
    const matches = getTopLevelVisibleMatches(selector);
    if (matches.length === 0) return null;
    return matches.reduce((best, node) => {
      const bestRect = best.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      return nodeRect.width * nodeRect.height > bestRect.width * bestRect.height ? node : best;
    }, matches[0]);
  };

  const sideSelectors =
    side === "back"
      ? [
          "[data-id-card-side='back']",
          ".id-card.back",
          ".card.back",
          ".model-id-card.back",
          ".badge-holder.back",
          ".card-holder.back",
          ".back-card",
        ]
      : [
          "[data-id-card-side='front']",
          ".id-card.front",
          ".card.front",
          ".model-id-card.front",
          ".badge-holder.front",
          ".card-holder.front",
        ];

  for (const explicitSelector of sideSelectors) {
    const explicit = getBestVisibleMatch(explicitSelector);
    if (explicit) return explicit;
  }

  const sideHintSelector = side === "back" ? ".back, .back-card" : ".front";
  const sideHintContainer = Array.from(doc.querySelectorAll(sideHintSelector))
    .map(getVisibleCardContainer)
    .find(Boolean);
  if (sideHintContainer) return sideHintContainer;

  const cardSelector = `${cardContainerSelector}, .inner-card`;
  const pairedContainers = [".pair", ".wrapper", ".page", ".id-wrapper", ".card-set"];
  for (const selector of pairedContainers) {
    const paired = Array.from(doc.querySelectorAll(selector)).find((node) => {
      if (!(node instanceof HTMLElement)) return false;
      const cards = node.querySelectorAll(cardSelector);
      return isVisibleCard(node) && cards.length >= 2;
    });
    if (paired) return paired;
  }

  const visibleCards = Array.from(doc.querySelectorAll(cardSelector)).filter(isVisibleCard);
  const topLevelCards = visibleCards.filter(
    (node) => !visibleCards.some((other) => other !== node && other.contains(node))
  );
  if (topLevelCards.length >= 2) {
    const wrapper = doc.createElement("div");
    wrapper.className = "idcard-export-pair-wrapper";
    topLevelCards[0].parentNode.insertBefore(wrapper, topLevelCards[0]);
    topLevelCards.slice(0, 2).forEach((node) => wrapper.appendChild(node));
    return wrapper;
  }

  const selectors = [cardContainerSelector, ".inner-card"];
  for (const selector of selectors) {
    const matches = Array.from(doc.querySelectorAll(selector)).filter(isVisibleCard);
    if (matches.length > 0) {
      return side === "back" && matches.length > 1 ? matches[1] : matches[0];
    }
  }

  return doc.body.firstElementChild || doc.body;
};

const applyTeacherIdCardLabels = (doc) => {
  if (!doc?.defaultView?.location) return;
  const params = new URLSearchParams(doc.defaultView.location.search || "");
  const isTeacher = /^(true|1|teacher)$/i.test(
    params.get("isTeacher") || params.get("cardType") || params.get("userType") || ""
  );
  if (!isTeacher) return;

  const designation = params.get("designation") || params.get("className") || "Teacher";

  // Hide all student-specific fields/rows so ONLY Name, Designation, and Phone number are shown for teachers
  const unwantedFieldSelectors = [
    "[data-dob]",
    "[data-parent]",
    "[data-father]",
    "[data-admission]",
    "[data-roll]",
    "[data-blood]",
    "[data-blood-group]",
    "[data-route]",
    "[data-emergency]",
    "[data-address]",
    "[data-section]",
  ];

  unwantedFieldSelectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => {
      const rowContainer = el.closest(".row, .field, .info-item, .detail-row, .card-row, .meta-row, .student-info-row, tr, li, p");
      if (rowContainer) {
        rowContainer.style.display = "none";
      } else {
        el.style.display = "none";
      }
    });
  });

  // Display designation on badge/chip elements
  doc.querySelectorAll("[data-class-badge]").forEach((el) => {
    el.textContent = designation;
  });

  const replacements = [
    [/\bClass\s*Name\b/gi, "Designation"],
    [/\bClass\b/gi, "Designation"],
    [/\bStudent\s*ID\b/gi, "Teacher ID"],
    [/\bStudent\b/gi, "Teacher"],
  ];

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parentTag = node.parentElement?.tagName?.toLowerCase();
      return parentTag === "script" || parentTag === "style" ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    let value = node.nodeValue || "";
    replacements.forEach(([pattern, replacement]) => {
      value = value.replace(pattern, replacement);
    });
    node.nodeValue = value;
  });

  doc.querySelectorAll("[data-photo]").forEach((img) => {
    img.alt = "Teacher photo";
  });
};

const readIdCardStoredMedia = (doc, value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (!raw.startsWith("storage:")) return raw;

  try {
    return String(doc?.defaultView?.localStorage?.getItem(raw.slice("storage:".length)) || "").trim();
  } catch {
    return "";
  }
};

const syncIdCardPhotoBeforeCapture = async (doc, student = null, photoCache = null) => {
  if (!doc?.defaultView?.location) return;
  const params = new URLSearchParams(doc.defaultView.location.search || "");

  // Priority 1: Check memory cache using stable studentId
  let studentPhotoData = "";
  if (student && photoCache instanceof Map) {
    const studentId = getStudentUniqueId(student);
    const cachedEntry = photoCache.get(studentId);
    if (cachedEntry?.dataUrl) {
      studentPhotoData = cachedEntry.dataUrl;
    }
  }

  // Priority 2: Lazy-load student photo on-demand if missing from cache
  if (!studentPhotoData && student) {
    const rawPhoto = getStudentRawPhoto(student);
    const resolvedUrl = resolveIdCardPhotoUrl(rawPhoto);
    if (resolvedUrl) {
      studentPhotoData = await loadAndConvertImageToDataUrl(resolvedUrl);
      if (studentPhotoData && photoCache instanceof Map) {
        const studentId = getStudentUniqueId(student);
        photoCache.set(studentId, { status: "loaded", dataUrl: studentPhotoData });
      }
    }
  }

  // Priority 3: Fallback to URL params or stored media
  if (!studentPhotoData) {
    studentPhotoData = resolveIdCardPhotoUrl(
      readIdCardStoredMedia(doc, params.get("photo") || params.get("studentPhoto"))
    );
  }

  const photoFrameSelector =
    ".photo, .photo-frame, .student-photo, .student-photo-box, .photo-box, .photo-container, .avatar";

  const applyPhotoToImg = (img, rawStudentPhotoData) => {
    img.removeAttribute("hidden");
    img.hidden = false;

    const photoFrame = img.closest(photoFrameSelector);

    if (photoFrame) {
      photoFrame.style.backgroundImage = `url("${rawStudentPhotoData}")`;
      photoFrame.style.backgroundSize = "cover";
      photoFrame.style.backgroundPosition = "center center";
      photoFrame.style.backgroundRepeat = "no-repeat";
      photoFrame.style.overflow = "hidden";

      img.style.setProperty("visibility", "hidden", "important");
      img.style.setProperty("opacity", "0", "important");
      if (rawStudentPhotoData.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      } else {
        img.removeAttribute("crossorigin");
      }
      img.src = rawStudentPhotoData;
      return;
    }

    img.style.display = "block";
    img.style.visibility = "visible";
    img.style.opacity = "1";
    img.style.setProperty("width", "100%", "important");
    img.style.setProperty("height", "100%", "important");
    img.style.setProperty("object-fit", "cover", "important");
    img.style.setProperty("object-position", "center center", "important");
    if (rawStudentPhotoData.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    } else {
      img.removeAttribute("crossorigin");
    }
    img.src = rawStudentPhotoData;
  };

  // Apply to all student photo elements with complete selector coverage
  if (studentPhotoData) {
    const photoSelectors = [
      "img[data-photo]",
      "img[data-student-photo]",
      ".photo-frame img",
      ".student-photo img",
      ".photo img",
      ".photo-container img",
      ".avatar img",
      "img.student-photo",
      "img.photo",
      "img[alt*='photo' i]",
      "img[alt*='Photo']",
    ].join(", ");

    const isPrincipalOrStaticImage = (img) =>
      img.hasAttribute("data-principal-photo") ||
      img.hasAttribute("data-signature-img") ||
      img.classList.contains("principal-photo") ||
      img.closest(".principal-photo-box, .signature-block") ||
      /principal|signature|correspondent/i.test(img.getAttribute("alt") || "");

    const matchedImgs = Array.from(doc.querySelectorAll(photoSelectors)).filter(
      (img) => !isPrincipalOrStaticImage(img)
    );

    matchedImgs.forEach((img) => applyPhotoToImg(img, studentPhotoData));
  }

  // Handle storage: tags in image src attributes
  const storageImages = Array.from(doc.querySelectorAll("img")).filter((img) => {
    const rawSrc = img.getAttribute("src") || "";
    return rawSrc.trim().startsWith("storage:");
  });

  storageImages.forEach((img) => {
    const rawSrc = img.getAttribute("src") || "";
    const isPhotoLike = rawSrc.includes("_student_photo_") || rawSrc.includes("_teacher_photo_");

    if (isPhotoLike && studentPhotoData) {
      applyPhotoToImg(img, studentPhotoData);
      return;
    }

    const resolved = readIdCardStoredMedia(doc, rawSrc);
    const finalSrc = isPhotoLike ? resolveIdCardPhotoUrl(resolved) : resolved;
    if (!finalSrc) return;

    img.removeAttribute("hidden");
    img.hidden = false;
    img.style.display = "block";
    img.style.visibility = "visible";
    img.style.opacity = "1";
    if (finalSrc.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    } else {
      img.removeAttribute("crossorigin");
    }
    img.src = finalSrc;
  });

  const schoolLogo = resolveIdCardPhotoUrl(
    readIdCardStoredMedia(doc, params.get("schoolLogo") || params.get("logo"))
  );
  if (schoolLogo) {
    doc
      .querySelectorAll(
        "img[data-school-logo], img[data-logo], .school-logo img, img.school-logo, .logo img, img[alt*='School Logo']"
      )
      .forEach((img) => {
        if (schoolLogo.startsWith("data:")) {
          img.crossOrigin = "anonymous";
        } else {
          img.removeAttribute("crossorigin");
        }
        img.src = schoolLogo;
        img.hidden = false;
        img.style.display = "block";
      });
  }

  const normalizeForIframe = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (raw.startsWith("data:") || raw.startsWith("http")) return raw;
    try {
      return new URL(raw, doc.defaultView.location.href).href;
    } catch {
      return raw;
    }
  };

  const principalPhotoImgs = Array.from(
    doc.querySelectorAll(
      "img[data-principal-photo], img.principal-photo, .principal-photo-box img"
    )
  );

  for (const img of principalPhotoImgs) {
    const currentSrc = img.getAttribute("src") || img.src || "";
    const absoluteSrc = normalizeForIframe(currentSrc);
    if (!absoluteSrc) continue;

    const embeddedSrc = absoluteSrc.startsWith("data:")
      ? absoluteSrc
      : (await loadAndConvertImageToDataUrl(absoluteSrc)) || absoluteSrc;

    img.crossOrigin = "anonymous";
    img.src = embeddedSrc;
    img.removeAttribute("hidden");
    img.hidden = false;
    img.style.display = "block";
  }

  doc.querySelectorAll("img[data-school-bg], img.back-bg-image").forEach((img) => {
    const rawSrc = img.getAttribute("src") || img.src || "";
    if (!rawSrc) return;

    let finalSrc = rawSrc;
    try {
      finalSrc = new URL(rawSrc, doc.defaultView.location.href).href;
    } catch {
      finalSrc = rawSrc;
    }

    img.removeAttribute("crossorigin");
    img.src = finalSrc;
    img.hidden = false;
    img.style.position = "absolute";
    img.style.inset = "0";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.display = "block";

    const card = img.closest(".id-card.back, .card.back, .model-id-card.back, .back-card");
    if (card instanceof HTMLElement) {
      card.style.backgroundImage = `url("${finalSrc}")`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
      card.style.backgroundRepeat = "no-repeat";
    }
  });
};

const waitForIdCardImages = async (doc) => {
  const images = Array.from(doc?.querySelectorAll("img") || []).filter((img) => {
    const src = img.getAttribute("src") || img.src;
    return Boolean(src && !src.startsWith("storage:"));
  });

  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            resolve();
          };

          const timer = setTimeout(done, 3500);

          if (img.complete && img.naturalWidth > 0) {
            clearTimeout(timer);
            done();
            return;
          }

          img.addEventListener("load", () => { clearTimeout(timer); done(); }, { once: true });
          img.addEventListener("error", () => { clearTimeout(timer); done(); }, { once: true });
          if (typeof img.decode === "function") {
            img.decode().then(() => { clearTimeout(timer); done(); }).catch(() => { clearTimeout(timer); done(); });
          }
        })
    )
  );
};


const renderCardFromPreviewUrl = async (student, side, buildPreviewUrl = buildIdCardPreviewUrl, templateOverride) => {
  const templateId = normalizeIdCardTemplateName(templateOverride || generatedIdCardTemplate || selectedIdCardTemplate);
  const previewUrl = buildPreviewUrl(
    templateId,
    student,
    schoolName,
    schoolLogo,
    localStorage.getItem("schoolAddress") || ""
  );

  const finalUrl = previewUrl.includes('?')
    ? `${previewUrl}&side=${side}`
    : `${previewUrl}?side=${side}`;

    return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '0px';
    iframe.style.top = '0px';
    iframe.style.width = '1200px';
    iframe.style.height = '1200px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0.001';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    iframe.style.overflow = 'hidden';
    iframe.src = finalUrl;
    document.body.appendChild(iframe);

    const cleanup = () => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };

    iframe.onload = async () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc || !iframeDoc.body) {
          throw new Error("Could not access iframe content");
        }

        iframeDoc.body.classList.add(`idcard-side-${side}`);
        iframeDoc.body.setAttribute("data-card-side", side);

        applyTeacherIdCardLabels(iframeDoc);
        await syncIdCardPhotoBeforeCapture(iframeDoc, student, idCardPhotoCacheRef.current);

        // Inject side-isolation stylesheet into iframe doc to guarantee the requested side is at top (0,0)
        const sideStyle = iframeDoc.createElement('style');
        sideStyle.innerHTML = `
          * { box-sizing: border-box !important; }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          ${
            side === 'back'
              ? `
                .id-card.front, .card.front, .model-id-card.front, .badge-holder.front, .card-holder.front, [data-id-card-side="front"] {
                  display: none !important;
                }
                .id-card.back, .card.back, .model-id-card.back, .badge-holder.back, .card-holder.back, [data-id-card-side="back"] {
                  display: block !important;
                  margin: 0 !important;
                  transform: none !important;
                }
                .wrapper, .pair, .page, .id-wrapper, .card-set {
                  display: block !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  width: max-content !important;
                }
              `
              : `
                .id-card.back, .card.back, .model-id-card.back, .badge-holder.back, .card-holder.back, [data-id-card-side="back"] {
                  display: none !important;
                }
                .id-card.front, .card.front, .model-id-card.front, .badge-holder.front, .card-holder.front, [data-id-card-side="front"] {
                  display: block !important;
                  margin: 0 !important;
                  transform: none !important;
                }
                .wrapper, .pair, .page, .id-wrapper, .card-set {
                  display: block !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  width: max-content !important;
                }
              `
          }
        `;
        iframeDoc.head.appendChild(sideStyle);

        await waitForIdCardImages(iframeDoc);

        // Force strict target isolation for single card side capture
        const sideSelector = side === 'back' 
          ? '.id-card.back, .card.back, .model-id-card.back, [data-id-card-side="back"]' 
          : '.id-card.front, .card.front, .model-id-card.front, [data-id-card-side="front"]';
        
        let cardElement = iframeDoc.querySelector(sideSelector) || findIdCardCaptureTarget(iframeDoc, side) || iframeDoc.body;

        // Ensure synchronous DOM layout and image readiness
        await syncIdCardPhotoBeforeCapture(iframeDoc, student, idCardPhotoCacheRef.current);
        await waitForIdCardImages(iframeDoc);
        await new Promise(r => setTimeout(r, 300));

        const targetRect = cardElement.getBoundingClientRect();
        const captureWidth = Math.ceil(targetRect.width || cardElement.scrollWidth || ID_CARD_CAPTURE_WIDTH);
        const captureHeight = Math.ceil(targetRect.height || cardElement.scrollHeight || ID_CARD_CAPTURE_HEIGHT);
        const scale = idCardImageQuality === 'high' ? 3 : 2;
        const canvas = await html2canvas(cardElement, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: captureWidth,
          height: captureHeight,
          windowWidth: Math.max(captureWidth + 400, iframeDoc.documentElement.scrollWidth || 0, 1200),
          windowHeight: Math.max(captureHeight + 400, iframeDoc.documentElement.scrollHeight || 0, 1200),
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
        });

        cleanup();
        resolve(canvas);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error("Failed to load preview iframe"));
    };

    setTimeout(() => {
      cleanup();
      reject(new Error("Preview iframe timeout"));
    }, 35000);
  });
};

const renderCardFromPreviewUrlWithRetry = async (
  student,
  side,
  buildPreviewUrl = buildIdCardPreviewUrl,
  templateOverride,
  maxRetries = 3
) => {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await renderCardFromPreviewUrl(student, side, buildPreviewUrl, templateOverride);
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${student?.name || 'Student'} (${side}): ${err?.message}`);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  throw lastError || new Error(`Failed to render ${student?.name || 'Student'} (${side}) after ${maxRetries} attempts`);
};
const exportPdfAsZip = async (canvases, config) => {
  const { fileName } = config;
  const zip = new JSZip();
  const folder = zip.folder(fileName);

  // Group canvases by student.
  // 🔥 Group by the render-time studentKey (index-based), never by name/id —
  // duplicate or missing names/ids would otherwise merge different students
  // into one group and overwrite their front/back canvases.
  const studentGroups = {};
  canvases.forEach(({ student, side, canvas, studentKey }, i) => {
    const groupId = studentKey || `student-${i}`;
    if (!studentGroups[groupId]) {
      studentGroups[groupId] = { student, sides: [] };
    }
    studentGroups[groupId].sides.push({ side, canvas });
  });

  // Create individual PDF for each student
  let index = 1;
  for (const [studentId, { student, sides }] of Object.entries(studentGroups)) {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add each side (front/back) as a page
    sides.forEach(({ canvas }, i) => {
      if (i > 0) pdf.addPage();

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const x = (pageWidth - ID_CARD_PDF_WIDTH_MM) / 2;
      const y = (pageHeight - ID_CARD_PDF_HEIGHT_MM) / 2;

      addIdCardCanvasToPdf(pdf, canvas, x, y);
    });

    // Generate filename
    const studentName = student?.name || student?.teacher_name || student?.student_name || student?.studentName || "Card";
    const className = student?.class_name || student?.class || student?.className || student?.designation || student?.role || "-";
    const section = student?.section || student?.section_name || student?.sectionName || student?.department || student?.dept || "-";

    const safeName = `${studentName}_${className}_${section}`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    // Save PDF as blob and add to ZIP
    const pdfBlob = pdf.output('blob');
    folder.file(`${safeName}.pdf`, pdfBlob);
    
    index++;
  }

  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${fileName}.zip`);
};

// 🔥 DUPLEX-READY "Single PDF" export.
//
// Unlike the old tile-based export, this does NOT draw the grey preview
// wrapper, the front+back side-by-side pairing, or the name/class caption —
// those are preview-only UI elements. The PDF contains ONLY the raw ID
// card image in each physical slot.
//
// Page sequence for N students (with `perPage` slots per sheet):
//   Page 1: FRONTs of students 1..perPage      (slot i = student i's FRONT)
//   Page 2: BACKs  of students 1..perPage      (slot i = SAME slot, student i's BACK)
//   Page 3: FRONTs of the next batch of students
//   Page 4: BACKs  of the next batch
//   ...
// Every FRONT/BACK page pair reuses the exact same `slots` array (same x, y,
// width, height per slot) so a slot's back card is always physically behind
// its front card once the sheet is duplex-printed.
const exportPreviewTilesAsPdf = async (canvases, config) => {
  const { paperSize, pdfLayout, fileName, printOptions = {} } = config;

  // 🔥 Group by the render-time studentKey (index-based), never by name/id —
  // duplicate or missing names/ids would otherwise merge different students
  // into one group and overwrite their front/back canvases (front of one
  // student paired with back of another). `order` preserves render order so
  // Student 1's slot always comes before Student 2's, etc.
  const grouped = new Map();
  const order = [];
  canvases.forEach(({ student, side, canvas, studentKey }, i) => {
    const groupId = studentKey || `student-${i}`;
    if (!grouped.has(groupId)) {
      grouped.set(groupId, { student, frontCanvas: null, backCanvas: null });
      order.push(groupId);
    }
    const group = grouped.get(groupId);
    if (side === "back") group.backCanvas = canvas;
    else group.frontCanvas = canvas;
  });

  const studentGroups = order.map((id) => grouped.get(id));
  if (studentGroups.length === 0) return;

  // ONE fixed slots array — reused unchanged for every front page and its
  // matching back page. Never recomputed/recentered per side.
  const layout = buildIdCardDuplexSlots({ paperSize });
  const slots = layout.slots;
  const perPage = slots.length;

  const pdf = new jsPDF({
    orientation: layout.orientation,
    unit: "mm",
    format: [layout.pageWidth, layout.pageHeight],
  });

  const drawCardInSlot = (canvas, slot) => {
    if (!canvas) return; // leave an unused slot blank (e.g. odd student count)
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", slot.x, slot.y, slot.width, slot.height);

    if (printOptions.cropMarks || printOptions.cutGuidelines) {
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.1);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.rect(slot.x, slot.y, slot.width, slot.height);
      pdf.setLineDashPattern([], 0);
    }
  };

  let isFirstPage = true;
  for (let i = 0; i < studentGroups.length; i += perPage) {
    const batch = studentGroups.slice(i, i + perPage);

    // FRONT SHEET for this batch — slot[k] gets batch[k]'s FRONT.
    if (!isFirstPage) pdf.addPage([layout.pageWidth, layout.pageHeight], layout.orientation);
    isFirstPage = false;
    batch.forEach((group, slotIndex) => drawCardInSlot(group.frontCanvas, slots[slotIndex]));

    // BACK SHEET for the SAME batch — same `slots` array, so slot[k]'s BACK
    // lands in the identical physical position as slot[k]'s FRONT above.
    pdf.addPage([layout.pageWidth, layout.pageHeight], layout.orientation);
    batch.forEach((group, slotIndex) => drawCardInSlot(group.backCanvas, slots[slotIndex]));
  }

  if (printOptions.pageNumbers) {
    const totalPages = pdf.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text(`Page ${p} of ${totalPages}`, layout.pageWidth / 2, layout.pageHeight - 3, { align: "center" });
    }
  }

  pdf.save(`${fileName}.pdf`);
};

const exportAsImages = async (canvases, config) => {
  const { fileFormat, downloadType, fileName, paperSize, pdfLayout, printOptions = {} } = config;
  const mimeType = fileFormat === 'png' ? 'image/png' : 'image/jpeg';
  const extension = fileFormat === 'png' ? 'png' : 'jpg';

  // Single image download
  if (downloadType === 'single-image' && canvases.length === 1) {
    const link = document.createElement('a');
    link.download = `${fileName}.${extension}`;
    link.href = canvases[0].canvas.toDataURL(mimeType, 0.95);
    link.click();
    return;
  }

  // Single PDF (all cards in one PDF)
  if (downloadType === 'single-pdf' && !fileFormat.startsWith('pdf')) {
    await exportPreviewTilesAsPdf(canvases, config);
    return;
  }

  // ZIP download
  const zip = new JSZip();
  const folder = zip.folder(fileName);

  for (let i = 0; i < canvases.length; i++) {
    const { canvas, student, side } = canvases[i];
    const dataUrl = canvas.toDataURL(mimeType, 0.95);
    const base64Data = dataUrl.split(',')[1];

    const studentName = student?.name || student?.teacher_name || student?.student_name || student?.studentName || "Card";
    const className = student?.class_name || student?.class || student?.className || student?.designation || student?.role || "-";
    const section = student?.section || student?.section_name || student?.sectionName || student?.department || student?.dept || "-";

    const safeName = `${studentName}_${className}_${section}_${side || 'card'}`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    folder.file(`${safeName}.${extension}`, base64Data, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${fileName}.zip`);
};

// 🔥 Add this ref at the top of your component (with other refs)
const isExecutingRef = useRef(false);

const handleExecuteIdCardDownload = async () => {
  if (isExecutingRef.current) {
    console.warn("⚠️ Download already in progress, ignoring duplicate call");
    return;
  }
  isExecutingRef.current = true;

  const isPdf = idCardFileFormat === 'pdf-print' || idCardFileFormat === 'pdf-standard';

  if (idCardRangeStudents.length === 0) {
    alert(idCardTargetType === 'teacher' ? "No teachers selected." : "No students selected.");
    isExecutingRef.current = false;
    return;
  }

  // If batch downloading is enabled, only export the current batch slice
  // (e.g. records 0-9, 10-19, ...) instead of the whole list at once.
  const batchStudents = idCardBatchSize > 0
    ? idCardRangeStudents.slice(
        idCardBatchIndex * idCardBatchSize,
        (idCardBatchIndex + 1) * idCardBatchSize
      )
    : idCardRangeStudents;
  const totalBatches = idCardBatchSize > 0
    ? Math.ceil(idCardRangeStudents.length / idCardBatchSize)
    : 1;

  if (batchStudents.length === 0) {
    alert("This batch is empty. Try a different batch.");
    isExecutingRef.current = false;
    return;
  }

  setDownloadProgress({
    active: true,
    current: 0,
    total: batchStudents.length,
    message: `Verifying ${idCardTargetType === 'teacher' ? 'teacher' : 'student'} photos...`
  });

  try {
    if (!idCardPhotoCacheRef.current) {
      idCardPhotoCacheRef.current = new Map();
    }

    const batchFileName = idCardBatchSize > 0
      ? `${idCardFileName || 'IDCards_Export'}_Batch${idCardBatchIndex + 1}of${totalBatches}`
      : (idCardFileName || 'IDCards_Export');

    const exportConfig = {
      students: batchStudents,
      targetType: idCardTargetType,

      templateId: normalizeIdCardTemplateName(generatedIdCardTemplate || selectedIdCardTemplate),
      schoolName,
      schoolLogo,
      schoolAddress: localStorage.getItem("schoolAddress") || "",
      fileFormat: idCardFileFormat,
      downloadType: idCardDownloadType,
      pdfLayout: isPdf ? idCardPdfLayout : null,
      cardSide: 'front-back',
      paperSize: idCardPaperSize,
      imageQuality: idCardImageQuality,
      printOptions: {
        cropMarks: idCardShowCropMarks,
        cutGuidelines: idCardShowCutGuidelines,
        pageNumbers: idCardAddPageNumbers,
      },
      fileName: batchFileName,
    };

    const sidesToRender = ['front', 'back'];
    const totalCards = batchStudents.length * sidesToRender.length;

    console.log('📊 Rendering sides:', sidesToRender);
    console.log('📊 Students count (this batch):', batchStudents.length);
    console.log('📊 Total cards expected:', totalCards);

    setDownloadProgress({
      active: true,
      current: 0,
      total: totalCards,
      message: `Preparing ${batchStudents.length} ${idCardTargetType === 'teacher' ? 'teachers' : 'students'} for export${idCardBatchSize > 0 ? ` (batch ${idCardBatchIndex + 1} of ${totalBatches})` : ''}...`
    });

    const canvases = [];
    let processedCount = 0;
    let failedCount = 0;

    // Render both sides for each student with lazy photo loading per student and retry protection
    let studentPosition = 0;
    for (const student of batchStudents) {
      const studentKey = `student-${studentPosition}`;
      const studentId = getStudentUniqueId(student, studentPosition);
      const studentName =
        student?.name ||
        student?.teacher_name ||
        student?.student_name ||
        student?.studentName ||
        (idCardTargetType === "teacher" ? `Teacher ${studentPosition + 1}` : `Student ${studentPosition + 1}`);

      // Garbage collection breathing pause every 8 students to prevent browser memory/concurrency throttling
      if (studentPosition > 0 && studentPosition % 8 === 0) {
        setDownloadProgress({
          active: true,
          current: processedCount,
          total: totalCards,
          message: `Optimizing memory (${processedCount}/${totalCards})...`
        });
        await new Promise((r) => setTimeout(r, 100));
      }

      // Lazy-load photo on-demand for this student if missing from memory cache
      const cachedPhoto = idCardPhotoCacheRef.current.get(studentId);
      if (!cachedPhoto?.dataUrl) {
        const rawPhoto = getStudentRawPhoto(student);
        const resolvedUrl = resolveIdCardPhotoUrl(rawPhoto);
        if (resolvedUrl) {
          try {
            const dataUrl = await loadAndConvertImageToDataUrl(resolvedUrl);
            idCardPhotoCacheRef.current.set(studentId, { status: dataUrl ? "loaded" : "failed", dataUrl: dataUrl || "" });
          } catch {
            idCardPhotoCacheRef.current.set(studentId, { status: "failed", dataUrl: "" });
          }
        }
      }

      for (const side of sidesToRender) {
        try {
          console.log(`🎨 Rendering: ${studentName} (${side})`);
          setDownloadProgress({
            active: true,
            current: processedCount + 1,
            total: totalCards,
            message: `Rendering (${processedCount + 1}/${totalCards}): ${studentName} [${side.toUpperCase()}]`
          });
          const urlBuilder = idCardTargetType === 'teacher' ? buildTeacherIdCardPreviewUrl : buildIdCardPreviewUrl;
          const canvas = await renderCardFromPreviewUrlWithRetry(student, side, urlBuilder, exportConfig.templateId, 3);
          canvases.push({ student, side, canvas, studentKey });
          console.log(`✅ Rendered: ${studentName} (${side})`);
        } catch (error) {
          console.error(`❌ Failed to render ${studentName} (${side}) after retries:`, error);
          failedCount++;
        }

        processedCount++;
      }
      studentPosition++;
    }

    console.log('📊 Final canvases count:', canvases.length);

    if (canvases.length === 0) {
      setDownloadProgress({ active: false });
      alert("❌ Failed to generate any ID cards. Please try again.");
      isExecutingRef.current = false;
      return;
    }

    setDownloadProgress({
      active: true,
      current: totalCards,
      total: totalCards,
      message: "Exporting file..."
    });

    if (isPdf && exportConfig.downloadType === 'zip') {
      // 🔥 PDF + Individual Files (ZIP) - Create ZIP with individual PDFs
      await exportPdfAsZip(canvases, exportConfig);
    } else if (isPdf) {
      // PDF + Single PDF - match the preview grid with one front/back tile per student.
      await exportPreviewTilesAsPdf(canvases, exportConfig);
    } else {
      // 🔥 PNG/JPEG - Export as images
      await exportAsImages(canvases, exportConfig);
    }

    setDownloadProgress({ active: false });

    // In batch mode, keep the popup open (and advance to the next batch)
    // so the user can just click Download again for the next chunk.
    // Only close automatically once everything has been exported, or when
    // batching is off (single full export).
    const isLastBatch = idCardBatchSize === 0 || idCardBatchIndex >= totalBatches - 1;
    if (isLastBatch) {
      setDownloadIdCardPopupOpen(false);
    } else {
      setIdCardBatchIndex((prev) => prev + 1);
    }

    const successMsg = failedCount > 0
      ? `⚠️ Exported ${canvases.length} cards (${failedCount} failed)\n${batchStudents.length} ${idCardTargetType === 'teacher' ? 'teachers' : 'students'} × front + back`
      : `✅ Export Successful!\n${batchStudents.length} ${idCardTargetType === 'teacher' ? 'teachers' : 'students'} = ${canvases.length} fixed-size ID cards`;

    const batchMsg = idCardBatchSize > 0
      ? `\nBatch ${idCardBatchIndex + 1} of ${totalBatches}${isLastBatch ? " (all batches complete)" : " — click Download again for the next batch"}`
      : '';

    // 🔥 Add format info
    let formatInfo = '';
    if (isPdf && exportConfig.downloadType === 'zip') {
      formatInfo = `\nFormat: PDF (Individual files in ZIP)`;
    } else if (isPdf) {
      formatInfo = `\nFormat: PDF (Single file)`;
    } else if (exportConfig.downloadType === 'zip') {
      formatInfo = `\nFormat: ${exportConfig.fileFormat.toUpperCase()} (ZIP archive)`;
    } else {
      formatInfo = `\nFormat: ${exportConfig.fileFormat.toUpperCase()}`;
    }

    alert(`${successMsg}${formatInfo}${batchMsg}`);

  } catch (error) {
    console.error("Export failed:", error);
    setDownloadProgress({ active: false });
    alert("❌ Failed to generate ID cards.\nError: " + error.message);
  } finally {
    isExecutingRef.current = false;
  }
};

// --- Report Card Batch Rendering & Export Pipeline ---

const renderReportCardFromPayload = async (payload, templateId, imageQuality = 'high') => {
  const normalizedTemplate = normalizeReportTemplateName(templateId);
  const srcUrl = import.meta.env.BASE_URL + `reports/${normalizedTemplate}`;

  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '0px';
    iframe.style.top = '0px';
    iframe.style.width = '1200px';
    iframe.style.height = '1600px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0.001';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    iframe.style.overflow = 'hidden';
    iframe.src = srcUrl;
    document.body.appendChild(iframe);

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Report card preview iframe timeout"));
    }, 35000);

    iframe.onload = async () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        const win = iframe.contentWindow;
        if (!iframeDoc || !iframeDoc.body || !win) {
          throw new Error("Could not access report card iframe content");
        }

        // Post data to reportDataBridge
        win.postMessage(
          { type: "REPORT_CARD_PAYLOAD", payload },
          window.location.origin
        );

        // Synchronize photo directly into iframe document from cache
        await syncIdCardPhotoBeforeCapture(iframeDoc, payload?.student, reportPhotoCacheRef.current);

        // Allow reportDataBridge to update DOM and settle
        await new Promise((r) => setTimeout(r, 200));

        // Wait for images (photo, logo, etc.)
        await waitForIdCardImages(iframeDoc);

        const target =
          iframeDoc.querySelector(".report-card") ||
          iframeDoc.querySelector(".sheet") ||
          iframeDoc.querySelector(".report") ||
          iframeDoc.querySelector(".container") ||
          iframeDoc.querySelector(".page") ||
          iframeDoc.querySelector(".card") ||
          iframeDoc.querySelector(".report-wrapper") ||
          iframeDoc.querySelector(".landscape-wrap") ||
          iframeDoc.body;

        let captureStyle = iframeDoc.getElementById("academic-report-capture-overrides");
        if (!captureStyle) {
          captureStyle = iframeDoc.createElement("style");
          captureStyle.id = "academic-report-capture-overrides";
          iframeDoc.head?.appendChild(captureStyle);
        }
        captureStyle.textContent = `
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
            transform: none !important;
          }
          .report-card, .sheet, .report, .container, .page, .card, .report-wrapper, .landscape-wrap {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            right: auto !important;
            bottom: auto !important;
            margin: 0 auto !important;
            transform: none !important;
            box-shadow: none !important;
            --page-scale: 1 !important;
            --report-scale: 1 !important;
          }
        `;

        iframeDoc.body.style.transform = "none";
        iframeDoc.body.style.transformOrigin = "top left";
        iframeDoc.body.style.width = "auto";
        iframeDoc.body.style.minHeight = "0";
        iframeDoc.body.style.margin = "0";
        iframeDoc.body.style.padding = "0";
        iframeDoc.body.style.background = "#ffffff";

        target.style.transform = "none";
        target.style.transformOrigin = "top left";
        target.style.position = "relative";
        target.style.left = "0";
        target.style.top = "0";
        target.style.margin = "0 auto";

        try {
          win.scrollTo?.(0, 0);
        } catch (_) {}

        await new Promise((r) => setTimeout(r, 120));

        const targetRect = target.getBoundingClientRect();
        const captureWidth = Math.ceil(target.offsetWidth || targetRect.width || target.scrollWidth || 800);
        const captureHeight = Math.ceil(target.offsetHeight || targetRect.height || target.scrollHeight || 1130);
        const scale = imageQuality === 'high' ? 2.5 : 2;

        const canvas = await html2canvas(target, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
          width: captureWidth,
          height: captureHeight,
          windowWidth: Math.max(captureWidth + 200, iframeDoc.documentElement.scrollWidth || 0),
          windowHeight: Math.max(captureHeight + 200, iframeDoc.documentElement.scrollHeight || 0),
        });

        clearTimeout(timeout);
        cleanup();
        resolve(canvas);
      } catch (err) {
        clearTimeout(timeout);
        cleanup();
        reject(err);
      }
    };

    iframe.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Failed to load report card template iframe"));
    };
  });
};

const renderReportCardFromPayloadWithRetry = async (
  payload,
  templateId,
  imageQuality = 'high',
  maxRetries = 3
) => {
  let lastError = null;
  const studentName = payload?.student?.name || 'Student';
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await renderReportCardFromPayload(payload, templateId, imageQuality);
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for ${studentName} report card: ${err?.message}`);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  throw lastError || new Error(`Failed to render ${studentName} report card after ${maxRetries} attempts`);
};

const drawReportCardCropMarks = (pdf, x, y, width, height) => {
  const lineLen = 4;
  const offset = 2;
  pdf.setDrawColor(80, 80, 80);
  pdf.setLineWidth(0.2);

  // Top-left
  pdf.line(x - offset - lineLen, y, x - offset, y);
  pdf.line(x, y - offset - lineLen, x, y - offset);

  // Top-right
  pdf.line(x + width + offset, y, x + width + offset + lineLen, y);
  pdf.line(x + width, y - offset - lineLen, x + width, y - offset);

  // Bottom-left
  pdf.line(x - offset - lineLen, y + height, x - offset, y + height);
  pdf.line(x, y + height + offset, x, y + height + offset + lineLen);

  // Bottom-right
  pdf.line(x + width + offset, y + height, x + width + offset + lineLen, y + height);
  pdf.line(x + width, y + height + offset, x + width, y + height + offset + lineLen);
};

const getReportCardPageDimensions = (paperSize = 'a4') => {
  const baseDimensions = {
    a4: { width: 210, height: 297 },
    letter: { width: 215.9, height: 279.4 },
    legal: { width: 215.9, height: 355.6 },
  };
  return baseDimensions[paperSize] || baseDimensions.a4;
};

// Single PDF: exactly 1 report card per paper (page)
const exportReportCardsAsSinglePdf = async (canvases, config) => {
  const { paperSize = 'a4', orientation: requestedOrientation = 'auto', fileName = 'ReportCards', printOptions = {} } = config;
  if (!canvases || canvases.length === 0) return;

  const basePage = getReportCardPageDimensions(paperSize);
  const MARGIN_MM = (2 * 25.4) / 96; // 2px margin in mm
  let pdf = null;

  for (let i = 0; i < canvases.length; i++) {
    const { canvas } = canvases[i];
    let orientation = "p";
    if (requestedOrientation === "landscape") {
      orientation = "l";
    } else if (requestedOrientation === "portrait") {
      orientation = "p";
    } else {
      orientation = canvas.width > canvas.height ? "l" : "p";
    }

    const pageWidth = orientation === "l" ? basePage.height : basePage.width;
    const pageHeight = orientation === "l" ? basePage.width : basePage.height;

    if (i === 0) {
      pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: [pageWidth, pageHeight],
      });
    } else {
      pdf.addPage([pageWidth, pageHeight], orientation);
    }

    const availableWidth = Math.max(0, pageWidth - (MARGIN_MM * 2));
    const availableHeight = Math.max(0, pageHeight - (MARGIN_MM * 2));

    const imageRatio = canvas.width / canvas.height;
    const availableRatio = availableWidth / availableHeight;

    let renderWidth;
    let renderHeight;

    if (imageRatio > availableRatio) {
      renderWidth = availableWidth;
      renderHeight = renderWidth / imageRatio;
    } else {
      renderHeight = availableHeight;
      renderWidth = renderHeight * imageRatio;
    }

    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", x, y, renderWidth, renderHeight);

    if (printOptions.cropMarks) {
      drawReportCardCropMarks(pdf, x, y, renderWidth, renderHeight);
    }

    if (printOptions.cutGuidelines) {
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.1);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.rect(x, y, renderWidth, renderHeight);
      pdf.setLineDashPattern([], 0);
    }
  }

  if (printOptions.pageNumbers && pdf) {
    const totalPages = pdf.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      const currentPageWidth = pdf.internal.pageSize.getWidth();
      const currentPageHeight = pdf.internal.pageSize.getHeight();
      pdf.text(`Page ${p} of ${totalPages}`, currentPageWidth / 2, currentPageHeight - 4, { align: "center" });
    }
  }

  pdf.save(`${fileName}.pdf`);
};

// ZIP with individual PDFs: 1 PDF per student
const exportReportCardsPdfAsZip = async (canvases, config) => {
  const { fileName = 'ReportCards_Export', paperSize = 'a4', orientation: requestedOrientation = 'auto', printOptions = {} } = config;
  const zip = new JSZip();
  const folder = zip.folder(fileName);
  const basePage = getReportCardPageDimensions(paperSize);
  const MARGIN_MM = (2 * 25.4) / 96; // 2px margin in mm

  for (let i = 0; i < canvases.length; i++) {
    const { canvas, student } = canvases[i];
    let orientation = "p";
    if (requestedOrientation === "landscape") {
      orientation = "l";
    } else if (requestedOrientation === "portrait") {
      orientation = "p";
    } else {
      orientation = canvas.width > canvas.height ? "l" : "p";
    }

    const pageWidth = orientation === "l" ? basePage.height : basePage.width;
    const pageHeight = orientation === "l" ? basePage.width : basePage.height;

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: [pageWidth, pageHeight],
    });

    const availableWidth = Math.max(0, pageWidth - (MARGIN_MM * 2));
    const availableHeight = Math.max(0, pageHeight - (MARGIN_MM * 2));

    const imageRatio = canvas.width / canvas.height;
    const availableRatio = availableWidth / availableHeight;

    let renderWidth;
    let renderHeight;

    if (imageRatio > availableRatio) {
      renderWidth = availableWidth;
      renderHeight = renderWidth / imageRatio;
    } else {
      renderHeight = availableHeight;
      renderWidth = renderHeight * imageRatio;
    }

    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", x, y, renderWidth, renderHeight);

    if (printOptions.cropMarks) {
      drawReportCardCropMarks(pdf, x, y, renderWidth, renderHeight);
    }
    if (printOptions.cutGuidelines) {
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.1);
      pdf.setLineDashPattern([1, 1], 0);
      pdf.rect(x, y, renderWidth, renderHeight);
      pdf.setLineDashPattern([], 0);
    }
    if (printOptions.pageNumbers) {
      pdf.setFontSize(9);
      pdf.setTextColor(150);
      pdf.text("Page 1 of 1", pageWidth / 2, pageHeight - 4, { align: "center" });
    }

    const studentName = student?.name || student?.student_name || `Student_${i + 1}`;
    const className = student?.class_name || student?.class || student?.className || "-";
    const section = student?.section || student?.section_name || student?.sectionName || "-";
    const safeName = `${studentName}_Class_${className}_Sec_${section}_ReportCard`
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const pdfBlob = pdf.output("blob");
    folder.file(`${safeName}.pdf`, pdfBlob);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${fileName}.zip`);
};

// ZIP / Single Image export
const exportReportCardsAsImages = async (canvases, config) => {
  const { fileFormat = 'png', downloadType = 'zip', fileName = 'ReportCards_Export' } = config;
  const mimeType = fileFormat === 'png' ? 'image/png' : 'image/jpeg';
  const extension = fileFormat === 'png' ? 'png' : 'jpg';

  if (downloadType === 'single-image' && canvases.length === 1) {
    const link = document.createElement('a');
    link.download = `${fileName}.${extension}`;
    link.href = canvases[0].canvas.toDataURL(mimeType, 0.95);
    link.click();
    return;
  }

  if (downloadType === 'single-pdf' && !fileFormat.startsWith('pdf')) {
    await exportReportCardsAsSinglePdf(canvases, config);
    return;
  }

  const zip = new JSZip();
  const folder = zip.folder(fileName);

  for (let i = 0; i < canvases.length; i++) {
    const { canvas, student } = canvases[i];
    const dataUrl = canvas.toDataURL(mimeType, 0.95);
    const base64Data = dataUrl.split(',')[1];

    const studentName = student?.name || student?.student_name || `Student_${i + 1}`;
    const className = student?.class_name || student?.class || student?.className || "-";
    const section = student?.section || student?.section_name || student?.sectionName || "-";
    const safeName = `${studentName}_Class_${className}_Sec_${section}_ReportCard`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');

    folder.file(`${safeName}.${extension}`, base64Data, { base64: true });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${fileName}.zip`);
};

// Computes class rank for EVERY student in reportRangeStudents (the full
// class/section selected for generation — not just the current download batch),
// so rank stays correct even when report cards are downloaded in batches of 10/20.
// Fetched payloads are cached in reportPayloadCacheRef so the actual render loop
// below doesn't need to hit the marks API a second time per student.
const precomputeReportCardRanks = async (studentsOverride = null) => {
  const currentSchoolCode = localStorage.getItem("schoolCode") || schoolCode;
  const students = Array.isArray(studentsOverride) && studentsOverride.length > 0 ? studentsOverride : reportRangeStudents;

  if (!Array.isArray(students) || students.length === 0) {
    return reportRankMapRef.current;
  }

  setReportRankComputing(true);
  const totalsByStudentId = [];

  try {
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const studentId = getStudentUniqueId(student, i);

      const rankMsg = `Calculating ranks (${i + 1}/${students.length}): ${student?.name || student?.student_name || "Student"}`;
      setReportRangeLoadingMessage(rankMsg);

      if (isExecutingRef.current) {
        setDownloadProgress({
          active: true,
          current: i + 1,
          total: students.length,
          message: rankMsg,
        });
      }

      let cached = reportPayloadCacheRef.current.get(studentId);
      if (!cached) {
        try {
          const result = await fetchStudentReportPayload(student, currentSchoolCode);
          if (result?.payload) {
            cached = result.payload;
            reportPayloadCacheRef.current.set(studentId, cached);
          }
        } catch (error) {
          console.error(`Failed to fetch marks for rank calculation: ${student?.name}`, error);
        }
      }

      const isAbsent = cached?.overall?.isAbsent || cached?.isAbsent || isStudentFullyAbsent(cached?.performance);
      const obtained = cached?.overall?.obtainedMarks;

      // Fully absent students must NOT receive a rank and must be excluded completely from rank calculation (Requirement 5)
      if (!isAbsent && obtained != null && Number.isFinite(Number(obtained))) {
        totalsByStudentId.push({
          studentId,
          obtainedMarks: Number(obtained),
        });
      }
    }

    const rankByStudentId = computeCompetitionRanks(totalsByStudentId);
    const enrichedRankMap = new Map();
    rankByStudentId.forEach((rank, studentId) => {
      enrichedRankMap.set(studentId, { rank, totalStudents: totalsByStudentId.length });
    });
    reportRankMapRef.current = enrichedRankMap;
    return enrichedRankMap;
  } finally {
    setReportRankComputing(false);
    if (!isExecutingRef.current) {
      setDownloadProgress({ active: false, current: 0, total: 0, message: "" });
    }
  }
};

const handleExecuteReportCardDownload = async () => {
  if (isExecutingRef.current) {
    console.warn("⚠️ Download already in progress, ignoring duplicate call");
    return;
  }
  isExecutingRef.current = true;

  const isPdf = reportCardFileFormat === 'pdf-print' || reportCardFileFormat === 'pdf-standard';

  if (reportRangeStudents.length === 0) {
    alert("No students selected.");
    isExecutingRef.current = false;
    return;
  }

  const batchStudents = reportCardBatchSize > 0
    ? reportRangeStudents.slice(
        reportCardBatchIndex * reportCardBatchSize,
        (reportCardBatchIndex + 1) * reportCardBatchSize
      )
    : reportRangeStudents;

  const totalBatches = reportCardBatchSize > 0
    ? Math.ceil(reportRangeStudents.length / reportCardBatchSize)
    : 1;

  if (batchStudents.length === 0) {
    alert("This batch is empty. Try a different batch.");
    isExecutingRef.current = false;
    return;
  }

  setDownloadProgress({
    active: true,
    current: 0,
    total: batchStudents.length,
    message: "Initializing report card data...",
  });

  try {
    const currentSchoolCode = localStorage.getItem("schoolCode") || schoolCode;
    const batchFileName = reportCardBatchSize > 0
      ? `${reportCardFileName || 'ReportCards_Export'}_Batch${reportCardBatchIndex + 1}of${totalBatches}`
      : (reportCardFileName || 'ReportCards_Export');

    // Rank must be computed across the WHOLE class/section being generated, not just
    // the current batch — otherwise Rank 1 in batch 2 could be wrong. Compute (or reuse
    // the cached) ranking for all of reportRangeStudents before rendering this batch.
    if (reportCardRankMode === 'with-rank' && reportRankMapRef.current.size !== reportRangeStudents.length) {
      await precomputeReportCardRanks();
    }

    const exportConfig = {
      students: batchStudents,
      templateId: normalizeReportTemplateName(selectedReportCardTemplate),
      schoolName,
      schoolLogo,
      schoolAddress: localStorage.getItem("schoolAddress") || "",
      fileFormat: reportCardFileFormat,
      downloadType: reportCardDownloadType,
      paperSize: reportCardPaperSize,
      orientation: reportCardOrientation,
      imageQuality: reportCardImageQuality,
      printOptions: {
        cropMarks: reportCardShowCropMarks,
        cutGuidelines: reportCardShowCutGuidelines,
        pageNumbers: reportCardAddPageNumbers,
      },
      fileName: batchFileName,
    };

    setDownloadProgress({
      active: true,
      current: 0,
      total: batchStudents.length,
      message: `Preparing ${batchStudents.length} report cards for export${reportCardBatchSize > 0 ? ` (batch ${reportCardBatchIndex + 1} of ${totalBatches})` : ''}...`,
    });

    const canvases = [];
    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < batchStudents.length; i++) {
      const student = batchStudents[i];
      const studentName = student?.name || student?.student_name || `Student ${i + 1}`;

      // Garbage collection pause every 6 report cards to prevent browser memory throttling
      if (i > 0 && i % 6 === 0) {
        setDownloadProgress({
          active: true,
          current: processedCount,
          total: batchStudents.length,
          message: `Optimizing memory (${processedCount}/${batchStudents.length})...`,
        });
        await new Promise((r) => setTimeout(r, 120));
      }

      setDownloadProgress({
        active: true,
        current: processedCount + 1,
        total: batchStudents.length,
        message: `Rendering (${processedCount + 1}/${batchStudents.length}): ${studentName}`,
      });

      if (!reportPhotoCacheRef.current) {
        reportPhotoCacheRef.current = new Map();
      }

      // Lazy-load photo on-demand for this student if missing from memory cache
      const studentId = getStudentUniqueId(student, i);
      const cachedPhoto = reportPhotoCacheRef.current.get(studentId);
      if (!cachedPhoto?.dataUrl) {
        const rawPhoto = getStudentRawPhoto(student);
        const resolvedUrl = resolveIdCardPhotoUrl(rawPhoto);
        if (resolvedUrl) {
          try {
            const dataUrl = await loadAndConvertImageToDataUrl(resolvedUrl);
            reportPhotoCacheRef.current.set(studentId, {
              status: dataUrl ? "loaded" : "failed",
              dataUrl: dataUrl || "",
            });
          } catch {
            reportPhotoCacheRef.current.set(studentId, { status: "failed", dataUrl: "" });
          }
        }
      }

      try {
        // Reuse the payload fetched during rank precomputation if we already have it —
        // avoids hitting the marks API twice per student when "with rank" is selected.
        let payload = reportPayloadCacheRef.current.get(studentId);
        if (!payload) {
          const reportData = await fetchStudentReportPayload(student, currentSchoolCode);
          payload = reportData?.payload;
          if (payload) reportPayloadCacheRef.current.set(studentId, payload);
        }
        if (!payload) throw new Error("Could not load report card data");

        if (reportCardRankMode === 'with-rank') {
          const rankInfo = reportRankMapRef.current.get(studentId);
          if (rankInfo && rankInfo.rank != null) {
            payload = {
              ...payload,
              overall: { ...(payload.overall || {}), rank: rankInfo.rank, totalStudents: rankInfo.totalStudents },
              student: { ...(payload.student || {}), rank: rankInfo.rank, totalStudents: rankInfo.totalStudents },
            };
          } else {
            payload = {
              ...payload,
              overall: { ...(payload.overall || {}), rank: "Absent" },
              student: { ...(payload.student || {}), rank: "Absent" },
            };
          }
        } else {
          if (payload?.student?.rank != null) {
            const nextStudent = { ...payload.student };
            delete nextStudent.rank;
            delete nextStudent.totalStudents;
            payload = { ...payload, student: nextStudent };
          }
          if (payload?.overall?.rank != null) {
            const nextOverall = { ...payload.overall };
            delete nextOverall.rank;
            delete nextOverall.totalStudents;
            payload = { ...payload, overall: nextOverall };
          }
        }

        const canvas = await renderReportCardFromPayloadWithRetry(
          payload,
          exportConfig.templateId,
          reportCardImageQuality,
          3
        );
        canvases.push({ student, canvas });
      } catch (err) {
        console.error(`❌ Failed to render report card for ${studentName}:`, err);
        failedCount++;
      }

      processedCount++;
    }

    if (canvases.length === 0) {
      setDownloadProgress({ active: false });
      alert("❌ Failed to generate any report cards. Please try again.");
      isExecutingRef.current = false;
      return;
    }

    setDownloadProgress({
      active: true,
      current: batchStudents.length,
      total: batchStudents.length,
      message: "Exporting file...",
    });

    if (isPdf && exportConfig.downloadType === 'zip') {
      await exportReportCardsPdfAsZip(canvases, exportConfig);
    } else if (isPdf || exportConfig.downloadType === 'single-pdf') {
      // Single PDF: exactly 1 card per paper (page)
      await exportReportCardsAsSinglePdf(canvases, exportConfig);
    } else {
      await exportReportCardsAsImages(canvases, exportConfig);
    }

    setDownloadProgress({ active: false });

    const isLastBatch = reportCardBatchSize === 0 || reportCardBatchIndex >= totalBatches - 1;
    if (isLastBatch) {
      setDownloadReportCardPopupOpen(false);
    } else {
      setReportCardBatchIndex((prev) => prev + 1);
    }

    const successMsg = failedCount > 0
      ? `⚠️ Exported ${canvases.length} report cards (${failedCount} failed)\n${batchStudents.length} students`
      : `✅ Export Successful!\n${batchStudents.length} student report cards exported.`;

    const batchMsg = reportCardBatchSize > 0
      ? `\nBatch ${reportCardBatchIndex + 1} of ${totalBatches}${isLastBatch ? " (all batches complete)" : " — click Download again for the next batch"}`
      : '';

    let formatInfo = '';
    if (isPdf && exportConfig.downloadType === 'zip') {
      formatInfo = `\nFormat: PDF (Individual files in ZIP)`;
    } else if (isPdf || exportConfig.downloadType === 'single-pdf') {
      formatInfo = `\nFormat: PDF (Single file, 1 card per page)`;
    } else if (exportConfig.downloadType === 'zip') {
      formatInfo = `\nFormat: ${exportConfig.fileFormat.toUpperCase()} (ZIP archive)`;
    } else {
      formatInfo = `\nFormat: ${exportConfig.fileFormat.toUpperCase()}`;
    }

    alert(`${successMsg}${formatInfo}${batchMsg}`);
  } catch (error) {
    console.error("Report card export failed:", error);
    setDownloadProgress({ active: false });
    alert("❌ Failed to generate report cards.\nError: " + error.message);
  } finally {
    isExecutingRef.current = false;
  }
};
  const renderHistoryItem = (label, secondary, tertiary) => (
    <div className="admin-events-history-item" key={`${label}-${secondary}-${tertiary}`}>
      <strong>{label}</strong>
      <span>{secondary}</span>
      {tertiary ? <small>{tertiary}</small> : null}
    </div>
  );

  return (
    <div className="dashboard-page dashboard-home-page frontdesk-dashboard-page accountant-dashboard-page accountant-dashboard-home-page admin-events-page">
      <div className="dashboard-shell accountant-dashboard-shell">
        <aside className="dashboard-sidebar accountant-sidebar-strip">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`dashboard-sidebar-item accountant-sidebar-item ${item.key === "communication" ? "dashboard-sidebar-item-active accountant-sidebar-item-active" : ""}`}
              onClick={() => navigate(item.route)}
            >
              <div className="dashboard-sidebar-item-icon accountant-sidebar-item-icon">
                <img src={item.icon} alt={item.label} />
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <div className="dashboard-main accountant-main-area">
          <div className="dashboard-topbar accountant-topbar">
            <div className="dashboard-topbar-left accountant-topbar-left">
              {["Dashboard", "Academics", "Events & Meetings", "Reports"].map((tab) => (
                <div
                  key={tab}
                  className={`dashboard-topbar-tab accountant-topbar-tab ${activeTopTab === tab ? "dashboard-topbar-tab-active accountant-topbar-tab-active" : ""}`}
                >
                  <button
                    className="accountant-topbar-tab-button"
                    type="button"
                    onClick={() => {
                      if (tab === "Dashboard") navigate("/AdminDashboard");
                      if (tab === "Academics") navigate("/AdiminAcademicsNew");
                      if (tab === "Events & Meetings") navigate("/AdminEventsAndMeetings");
                      if (tab === "Reports") navigate("/AdminReportsPage");
                    }}
                  >
                    {tab}
                  </button>
                </div>
              ))}
            </div>

            <div className="dashboard-topbar-center accountant-topbar-center">
              <InstituteBrand
                logoSrc={schoolLogo || "/default-logo.png"}
                logoAlt={schoolName || "School Logo"}
                instituteName={schoolName || "Unknown School"}
              />
            </div>

            <div className="dashboard-topbar-right accountant-topbar-right">
              <button className="accountant-branch-btn" type="button" onClick={() => navigate("/HrDashboard")}>
                Switch to HR <span className="accountant-branch-caret">▼</span>
              </button>
                     <button
                   className="accountant-help-icon-btn"
                   onClick={() => setIsHelpOpen(true)}
                 >
                 <FiHelpCircle
                 style={{
                   color: "#e9818c",
                   fontSize: "34px"
                 }}
               />
                 </button>
              <EditableProfileMenu showHrSwitch />
            </div>
          </div>

          <div className="admin-events-content">
            <div className="admin-events-top">
               <div className="accountant-welcome-block">
                <h2>Hi, {getUserDisplayName()}!</h2>
                <p>Check Store Inventory,</p>
                <p>Report Track to Class Teacher</p>
                <p>Submit Building maintenance</p>
                <CompactTextTabs
                  activePath={location.pathname}
                  onNavigate={navigate}
                  tabs={[
                    { path: "/AdminGenerations", label: "Reports" },
                    { path: "/AdmissionTimetableNew", label: "Timetable" },
                    // { path: "/AdminQuestionPaper", label: "QP" },
                  ]}
                />
              </div>
         {/* NEW DYNAMIC CARD */}
<div className="admin-events-task accountant-card">
  <div className="taskCardContent">
    <TaskOfTheDay />
  </div>
</div>

              <div className="accountant-mini-cards">
                {quickCards.map((card) => (
                  <div
                    key={card.title}
                    className="accountant-quick-card accountant-card accountant-quick-card-clickable"
                    onClick={() => setActiveQuickPanel(card.key)}
                  >
                    <div className="">
                      <img src={card.icon} alt={card.title} />
                    </div>
                    <h4>{card.title}</h4>
                    <p>{card.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-events-middle">
              {renderGenerationCard("Generations – Report Card", "reportCard")}
              {renderGenerationCard("Generations – ID Card", "idCard")}

              <div className="admin-events-livechat accountant-card">
                <div className="admin-events-card-header">
                  <h3>
                    {activeQuickPanel === "assistant"
                      ? "Assistant Actions"
                      : activeQuickPanel === "storepo"
                        ? "Store PO"
                        : "Live Chat"}
                  </h3>
                  <div className="accountant-card-filters">
                    {activeQuickPanel === "livechat" ? (
                      <button type="button" className="admin-events-create-btn" onClick={openLiveChatPopup}>+ Create New</button>
                    ) : null}
                    <div className="accountant-feetype-count">
                      <strong>
                        {activeQuickPanel === "assistant"
                          ? assistantPanelItems.length
                          : activeQuickPanel === "storepo"
                            ? storeActions.length
                            : chatRequests.length}
                      </strong>
                      <span>
                        {activeQuickPanel === "assistant"
                          ? "Actions"
                          : activeQuickPanel === "storepo"
                            ? "Requests"
                            : "Chats"}
                      </span>
                    </div>
                  </div>
                </div>
                {activeQuickPanel === "assistant" ? (
                  <div className="admin-events-chat-section">
                    {assistantPanelItems.map((item) => (
                      <div key={item.title} className="admin-events-assistant-item">
                        <strong>{item.title}</strong>
                        <span>{item.desc}</span>
                      </div>
                    ))}
                  </div>
                ) : activeQuickPanel === "storepo" ? (
                  <div className="admin-events-chat-section">
                    <small>Requests PO</small>
                    {storeActionsLoading ? (
                      <div className="admin-events-chat-item"><span>Loading...</span></div>
                    ) : storeActionsError ? (
                      <div className="admin-events-chat-item"><span>{storeActionsError}</span></div>
                    ) : storeActions.length === 0 ? (
                      <div className="admin-events-chat-item"><span>No PO requests found.</span></div>
                    ) : (
                      storeActions.map((item, index) => (
                        <div key={item.id || item.po_id || index} className="admin-events-chat-item">
                          <span>
                            {item.text ||
                              `${item.id ? `PO${item.id} - ` : ""}${item.date || item.created_at || ""}, ${item.stockName || item.stock_name || "Stock"}${item.quantity ? ` ${item.quantity}` : ""}`}
                          </span>
                          <div className="admin-events-chat-actions">
                            <button type="button">▷</button>
                            <button type="button">✕</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <>
                    <div className="admin-events-chat-section">
                      <small>Requests</small>
                      {chatLoading ? (
                        <div className="admin-events-chat-item"><span>Loading...</span></div>
                      ) : requestItems.length === 0 ? (
                        <div className="admin-events-chat-item"><span>No requests found.</span></div>
                      ) : (
                        requestItems.map((item) => (
                          <div key={item.id} className="admin-events-chat-item">
                            <span>
                              Live Chat (P - T) - {formatChatDateTime(item.date, item.time)} - {item.party1_name || "Staff"} to {item.party2_student || "Student"}, {item.party2_class || "-"}{item.party2_section ? item.party2_section : ""}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="admin-events-chat-section">
                      <small>Scheduled</small>
                      {scheduledItems.length === 0 ? (
                        scheduled.map((item) => (
                          <div key={item} className="admin-events-chat-item">
                            <span>{item}</span>
                            <div className="admin-events-chat-actions">
                              <button type="button">▷</button>
                              <button type="button">✕</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        scheduledItems.map((item) => (
                          <div key={item.id} className="admin-events-chat-item">
                            <span>
                              Live Chat (T - P) - {formatChatDateTime(item.date, item.time)} - {item.party1_name || "Staff"} to {item.party2_student || "Student"}, {item.party2_class || "-"}{item.party2_section ? item.party2_section : ""}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="admin-events-bottom">
              <div className="admin-events-poster-panel accountant-card">
                <div className="admin-events-card-header">
                  <h3>Poster - Events</h3>
                  <div className="admin-events-filters">
                    <select
                      value={liveChatForm.className}
                      onChange={(e) => setLiveChatForm((prev) => ({ ...prev, className: e.target.value }))}
                    >
                      <option value="">Class & Sec</option>
                      {classOptions.map((item, index) => (
                        <option key={`${item}-${index}`} value={String(item)}>
                          {String(item)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={liveChatForm.section}
                      onChange={(e) => setLiveChatForm((prev) => ({ ...prev, section: e.target.value }))}
                      disabled={!liveChatForm.className}
                    >
                      <option value="">Section</option>
                      {sectionOptions.map((item, index) => (
                        <option key={`${item}-${index}`} value={String(item)}>
                          {String(item)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="admin-events-poster-layout">
                  <div className="admin-events-poster-student-block">
                    <div className="admin-events-poster-tabs">
                      {posterTemplateTabs.map((tab, index) => (
                        <button
                          key={tab}
                          type="button"
                          className={`admin-events-poster-tab ${posterAudienceTab === tab || (!posterAudienceTab && index === 0) ? "active" : ""}`}
                          onClick={() => setPosterAudienceTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="admin-events-poster-users">
                      {visiblePosterStudents.map((item, index) => (
                        <div
                          key={`${typeof item === "string" ? item : item?.id || index}`}
                          className="admin-events-user-card"
                        >
                          <div className="admin-events-user-icon"><FaUser /></div>
                          <strong>{typeof item === "string" ? item : item?.name || "Student"}</strong>
                          <span>
                            {liveChatForm.className || "7B"}, {liveChatForm.section || "C.T. T. Sriniv..."}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="admin-events-add-circle" onClick={openLiveChatPopup}>+</button>
                  </div>

                  <div className="admin-events-poster-divider">⇄</div>

                  <div className="admin-events-poster-template-block">
                    <div className="admin-events-generation-subtitle">Choose Templates</div>
                    <div className="admin-events-poster-template-tabs">
                      {posterTemplateTypes.map((tab, index) => (
                        <button
                          key={tab}
                          type="button"
                          className={`admin-events-poster-tab ${posterTemplateCategory === tab || (!posterTemplateCategory && index === 0) ? "active" : ""}`}
                          onClick={() => setPosterTemplateCategory(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="admin-events-template-row compact">
                      <button
                        type="button"
                        className="admin-events-template-nav"
                        aria-label="Previous poster template"
                        onClick={() => handleTemplateScroll("poster", "prev")}
                      >
                        <FaChevronLeft />
                      </button>
                      <div
                        className="admin-events-template-track"
                        ref={(node) => {
                          templateTrackRefs.current.poster = node;
                        }}
                      >
                        {getPosterTemplates().map((template) => (
                          <button
                            key={`poster-${template.key}`}
                            type="button"
                            className={`admin-events-template-card admin-events-poster-template-card ${template.className || ""} ${selectedPosterTemplate === template.key ? "is-selected" : ""}`}
                            aria-label={`${template.label || template.key} poster template`}
                            onClick={() => setSelectedPosterTemplate(template.key)}
                          >
                            <div className="admin-events-template-preview-shell">
                              <span className="admin-events-template-art" />
                              <span style={{ fontSize: "11px", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>
                                {template.label || template.key}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="admin-events-template-nav"
                        aria-label="Next poster template"
                        onClick={() => handleTemplateScroll("poster", "next")}
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                    <div className="admin-events-poster-schedule">
                      <label className="admin-events-generation-field">
                        <span>Schedule</span>
                        <input
                          className="admin-events-input"
                          type="date"
                          value={eventForm.eventDate}
                          onChange={(e) => setEventForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                        />
                      </label>
                      <label className="admin-events-generation-field">
                        <span>&nbsp;</span>
                        <input
                          className="admin-events-input"
                          type="time"
                          value={eventForm.eventTime}
                          onChange={(e) => setEventForm((prev) => ({ ...prev, eventTime: e.target.value }))}
                        />
                      </label>
                      <button
                        type="button"
                        className="admin-events-generation-select-btn"
                        onClick={handleSendPosterToClassSection}
                        disabled={sendingPoster}
                      >
                        {sendingPoster ? "Sending..." : "Send Poster"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-events-side-stack">
                <div className="admin-events-metrics">
                  <div className="admin-events-metric accountant-card">
                    <div className="admin-events-ring">{performance.overallPercentage || 0}%</div>
                    <h4>Performance</h4>
                    <span>Students Track</span>
                  </div>
                  <div className="admin-events-metric accountant-card">
                    <strong>8</strong>
                    <small>abs. / 12 avl.</small>
                    <h4>Substitute</h4>
                    <span>8 teachers absent today</span>
                  </div>
                </div>

                <div className="admin-events-footer accountant-card">
                  {footerCards.map((item) => (
                    <div key={`${item.meta}-${item.title}`} className="admin-events-footer-item">
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                      <small>{item.meta}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {popupType === "announcement" && (
        <div className="admin-events-modal-overlay" onClick={closePopup}>
          <div className="admin-events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>Create Announcement</h3>
              <button type="button" className="admin-events-modal-close" onClick={closePopup}>×</button>
            </div>
            <div className="admin-events-form-grid">
              <input
                className="admin-events-input"
                type="text"
                placeholder="Announcement title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <select
                className="admin-events-input"
                value={announcementForm.category}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Holiday">Holiday</option>
                <option value="Emergency">Emergency</option>
              </select>
              <input
                className="admin-events-input"
                type="date"
                value={announcementForm.announcementDate}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, announcementDate: e.target.value }))}
              />
              <textarea
                className="admin-events-input admin-events-textarea"
                placeholder="Description"
                value={announcementForm.description}
                onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="admin-events-action-row">
              <button type="button" className="admin-events-submit-btn" onClick={handleCreateAnnouncement} disabled={submitting}>
                {submitting ? "Saving..." : "Create Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {popupType === "eventMeeting" && (
        <div className="admin-events-modal-overlay" onClick={closePopup}>
          <div className="admin-events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>Create {eventMeetingTab === "event" ? "Event" : "Meeting"}</h3>
              <button type="button" className="admin-events-modal-close" onClick={closePopup}>×</button>
            </div>
            <div className="admin-events-popup-tabs">
              <button
                type="button"
                className={`admin-events-popup-tab ${eventMeetingTab === "event" ? "active" : ""}`}
                onClick={() => setEventMeetingTab("event")}
              >
                Events
              </button>
              <button
                type="button"
                className={`admin-events-popup-tab ${eventMeetingTab === "meeting" ? "active" : ""}`}
                onClick={() => setEventMeetingTab("meeting")}
              >
                Meetings
              </button>
            </div>

            {eventMeetingTab === "event" ? (
              <div className="admin-events-form-grid">
                <input
                  className="admin-events-input"
                  type="text"
                  placeholder="Event name"
                  value={eventForm.eventName}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, eventName: e.target.value }))}
                />
                <select
                  className="admin-events-input"
                  value={eventForm.eventType}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, eventType: e.target.value }))}
                >
                  <option value="General">General</option>
                  <option value="Celebration">Celebration</option>
                  <option value="Competition">Competition</option>
                  <option value="Exam">Exam</option>
                </select>
                <input
                  className="admin-events-input"
                  type="date"
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                />
                <input
                  className="admin-events-input"
                  type="time"
                  value={eventForm.eventTime}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, eventTime: e.target.value }))}
                />
                <textarea
                  className="admin-events-input admin-events-textarea"
                  placeholder="Event description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            ) : (
              <div className="admin-events-form-grid">
                <input
                  className="admin-events-input"
                  type="text"
                  placeholder="Meeting title"
                  value={meetingForm.meetingTitle}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, meetingTitle: e.target.value }))}
                />
                <input
                  className="admin-events-input"
                  type="date"
                  value={meetingForm.meetingDate}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, meetingDate: e.target.value }))}
                />
                <input
                  className="admin-events-input"
                  type="time"
                  value={meetingForm.meetingTime}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, meetingTime: e.target.value }))}
                />
                <input
                  className="admin-events-input"
                  type="text"
                  placeholder="Agenda"
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, agenda: e.target.value }))}
                />
                <textarea
                  className="admin-events-input admin-events-textarea"
                  placeholder="Meeting description"
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
            )}
            <div className="admin-events-action-row">
              <button
                type="button"
                className="admin-events-submit-btn"
                onClick={eventMeetingTab === "event" ? handleCreateEvent : handleCreateMeeting}
                disabled={submitting}
              >
                {submitting ? "Saving..." : eventMeetingTab === "event" ? "Create Event" : "Create Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}

      {popupType === "liveChat" && (
        <div className="admin-events-modal-overlay" onClick={closePopup}>
          <div className="admin-events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>Individual Chat Request</h3>
              <button type="button" className="admin-events-modal-close" onClick={closePopup}>×</button>
            </div>
            <div className="admin-events-form-grid">
              <select
                className="admin-events-input"
                value={liveChatForm.party1}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, party1: e.target.value }))}
              >
                <option value="">Party 1 Staff</option>
                {party1List.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name} ({item.user_type})
                  </option>
                ))}
              </select>
              <select
                className="admin-events-input"
                value={liveChatForm.className}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, className: e.target.value }))}
              >
                <option value="">Class</option>
                {classOptions.map((item, index) => (
                  <option key={`${item}-${index}`} value={String(item)}>
                    {String(item)}
                  </option>
                ))}
              </select>
              <select
                className="admin-events-input"
                value={liveChatForm.section}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, section: e.target.value }))}
                disabled={!liveChatForm.className}
              >
                <option value="">Section</option>
                {sectionOptions.map((item, index) => (
                  <option key={`${item}-${index}`} value={String(item)}>
                    {String(item)}
                  </option>
                ))}
              </select>
              <select
                className="admin-events-input"
                value={liveChatForm.student}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, student: e.target.value }))}
                disabled={!liveChatForm.className || !liveChatForm.section}
              >
                <option value="">Student</option>
                {studentOptions.map((item, index) => (
                  <option key={`${item?.id || index}`} value={item?.name || item?.student_name || ""}>
                    {item?.name || item?.student_name || "Student"}
                  </option>
                ))}
              </select>
              <input
                className="admin-events-input"
                type="date"
                value={liveChatForm.date}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, date: e.target.value }))}
              />
              <input
                className="admin-events-input"
                type="time"
                value={liveChatForm.time}
                onChange={(e) => setLiveChatForm((prev) => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <div className="admin-events-action-row">
              <button type="button" className="admin-events-submit-btn" onClick={handleCreateLiveChatRequest}>
                Create Chat Request
              </button>
            </div>
          </div>
        </div>
      )}

   
    {templatePreviewState.open && (
        <div className="admin-events-modal-overlay" onClick={closeTemplatePreview}>
          <div className="admin-events-report-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>
                {templatePreviewState.kind === "reportCard"
                  ? "Report Card Template Preview"
                  : "ID Card Template Preview"}
              </h3>
              <div className="admin-events-chat-meta">
                {templatePreviewState.kind === "idCard" ? (
                  <>
                    <button
                      type="button"
                      className="admin-events-generation-select-btn"
                      onClick={handleSelectWithoutSignature}
                    >
                      Without Signature
                    </button>
                    <button
                      type="button"
                      className="admin-events-generation-select-btn"
                      onClick={handleSelectWithSignature}
                    >
                      With Signature
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="admin-events-generation-select-btn"
                    onClick={handleConfirmTemplatePreview}
                  >
                    OK
                  </button>
                )}
                <button
                  type="button"
                  className="admin-events-modal-close"
                  onClick={closeTemplatePreview}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="admin-events-empty-state" style={{ marginBottom: "0.6rem" }}>
              {templatePreviewState.templateLabel}
            </div>
            <div className="admin-events-academic-preview-frame-wrap">
              <iframe
                title={`${templatePreviewState.templateLabel || "Template"} full preview`}
                src={
                  templatePreviewState.kind === "reportCard"
                    ? import.meta.env.BASE_URL + `reports/${normalizeReportTemplateName(templatePreviewState.templateId)}`
                    : import.meta.env.BASE_URL + `idcards/${normalizeIdCardTemplateName(templatePreviewState.templateId)}`
                }
                className="admin-events-academic-preview-frame"
              />
            </div>
          </div>
        </div>
      )}

      {signatureModalOpen && (
        <div className="admin-events-modal-overlay" onClick={closeSignatureModal}>
          <div className="admin-events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>Upload Principal Signature</h3>
              <button type="button" className="admin-events-modal-close" onClick={closeSignatureModal}>
                ×
              </button>
            </div>

            <div style={{ padding: "0.5rem 0 0.25rem" }}>
              <input type="file" accept="image/*" onChange={handleSignatureFileChange} />
              <p style={{ fontSize: "12px", color: "#666", marginTop: "0.5rem" }}>
               Please Upload a Background-Removed Signature
              </p>

              {signatureProcessing && <p style={{ fontSize: "13px" }}>Removing background…</p>}
              {signatureError && (
                <p style={{ fontSize: "13px", color: "#c0392b" }}>{signatureError}</p>
              )}

              {signatureProcessedImage && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                      background:
                        "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 16px 16px",
                    }}
                  >
                    <img
                      src={signatureProcessedImage}
                      alt="Signature preview"
                      style={{ width: `${signatureScale}px`, maxWidth: "260px", display: "block" }}
                    />
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "10px",
                        marginTop: "4px",
                        color: "#333",
                      }}
                    >
                      Principal Signature
                    </div>
                  </div>

                  <div style={{ marginTop: "0.75rem" }}>
                    <label style={{ fontSize: "13px" }}>
                      Size on card: {signatureScale}px wide
                    </label>
                    <input
                      type="range"
                      min="60"
                      max="220"
                      value={signatureScale}
                      onChange={(e) => setSignatureScale(Number(e.target.value))}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              className="admin-events-chat-meta"
              style={{ justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.75rem" }}
            >
              <button type="button" className="admin-events-modal-cancel-btn" onClick={closeSignatureModal}>
                Cancel
              </button>
              <button
                type="button"
                className="admin-events-generation-select-btn"
                onClick={handleConfirmSignature}
                disabled={!signatureProcessedImage || signatureProcessing}
              >
                Confirm &amp; Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {reportRankModalOpen && (
        <div className="admin-events-modal-overlay" onClick={() => setReportRankModalOpen(false)}>
          <div className="admin-events-modal" style={{ maxWidth: "440px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>Generate Report Cards</h3>
              <button
                type="button"
                className="admin-events-modal-close"
                onClick={() => setReportRankModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "16px 0" }}>
              <div style={{ fontSize: "14px", color: "#475569", marginBottom: "16px", lineHeight: "1.5" }}>
                Select whether you want to calculate and include student class rankings on the report cards:
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: reportCardRankMode === "with-rank" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: reportCardRankMode === "with-rank" ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setReportCardRankMode("with-rank")}
                >
                  <input
                    type="radio"
                    name="modalReportCardRankMode"
                    value="with-rank"
                    checked={reportCardRankMode === "with-rank"}
                    onChange={() => setReportCardRankMode("with-rank")}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>With Rank</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      Calculates rankings based on total marks for all students in this class/section.
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: reportCardRankMode === "without-rank" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    background: reportCardRankMode === "without-rank" ? "#eff6ff" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setReportCardRankMode("without-rank")}
                >
                  <input
                    type="radio"
                    name="modalReportCardRankMode"
                    value="without-rank"
                    checked={reportCardRankMode === "without-rank"}
                    onChange={() => setReportCardRankMode("without-rank")}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>Without Rank</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      Generates standard report cards without class rankings.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div
              className="admin-events-chat-meta"
              style={{ justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}
            >
              <button
                type="button"
                className="admin-events-modal-cancel-btn"
                onClick={() => setReportRankModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-events-generation-select-btn"
                onClick={() => {
                  setReportRankModalOpen(false);
                  handleOpenReportCardGeneration(pendingReportTemplate, reportCardRankMode);
                }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {allReportsPopupOpen && (
        <div className="admin-events-modal-overlay" onClick={() => setAllReportsPopupOpen(false)}>
          <div className="admin-events-report-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-events-card-header">
              <h3>All Student Report Cards</h3>
              <div className="admin-events-chat-meta">
                <button
                  type="button"
                  className="admin-events-id-card-print-all-btn"
                  onClick={() => setDownloadReportCardPopupOpen(true)}
                  disabled={reportRangeStudents.length === 0}
                >
                  Download / Print Selected Class
                </button>
                <button
                  type="button"
                  className="admin-events-modal-close"
                  onClick={() => setAllReportsPopupOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>
            {reportRangeLoading ? (
              <div className="admin-events-empty-state" style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
                  Generating Student Report Cards
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  {reportRangeLoadingMessage || "Loading and preloading photos..."}
                </div>
              </div>
            ) : reportRangeError ? (
              <div className="admin-events-empty-state">{reportRangeError}</div>
            ) : reportRangeStudents.length === 0 ? (
              <div className="admin-events-empty-state">No students found for the selected class and section.</div>
            ) : (
              <div
                ref={reportGridScrollRef}
                className="admin-events-id-card-grid-scroll"
                style={{ maxHeight: "65vh", overflowY: "auto" }}
              >
                <div className="admin-events-student-report-grid admin-events-student-report-grid-popup">
                  {reportRangeStudents.slice(0, reportVisibleCount).map((student, index) => {
                    const name = student?.name || student?.student_name || student?.studentName || "Student";
                    const className =
                      student?.class_name || student?.class || student?.className || student?.classname || "-";
                    const section =
                      student?.section || student?.section_name || student?.sectionName || student?.sec || "-";

                    return (
                      <button
                        key={`${name}-${className}-${section}-${student?.id || index}`}
                        type="button"
                        className="admin-events-student-report-card admin-events-student-report-card-compact"
                        onClick={() => handleOpenStudentAcademicReport(student)}
                      >
                        <div className="admin-events-student-report-card-thumb">
                          <iframe
                            title={`${name} report preview`}
                            src={import.meta.env.BASE_URL + `reports/${selectedReportCardTemplate}`}
                            className="admin-events-report-template-preview"
                            loading="lazy"
                            onLoad={(e) => {
                              try {
                                const doc = e.target.contentDocument || e.target.contentWindow?.document;
                                if (doc) {
                                  syncIdCardPhotoBeforeCapture(doc, student, reportPhotoCacheRef.current);
                                }
                              } catch (err) {
                                console.warn("Report preview iframe photo sync error:", err);
                              }
                            }}
                          />
                        </div>
                        <strong>{name}</strong>
                        <small>{`Class ${className} | Sec ${section}`}</small>
                      </button>
                    );
                  })}
                </div>

                {/* Sentinel: once this scrolls into view, the next batch of report cards is revealed */}
                {reportVisibleCount < reportRangeStudents.length && (
                  <div
                    ref={reportGridSentinelRef}
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    Loading more students… ({reportVisibleCount} of {reportRangeStudents.length})
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {allIdCardsPopupOpen && (
        <div className="admin-events-modal-overlay" onClick={() => setAllIdCardsPopupOpen(false)}>
          <div className="admin-events-report-preview-modal admin-events-id-card-modal" onClick={(e) => e.stopPropagation()}>
             <div className="admin-events-card-header">
              <h3>
                {idCardTargetType === "teacher"
                  ? idCardRangeStudents.length === 1
                    ? "Teacher ID Card Preview"
                    : "All Teacher ID Cards"
                  : "All Student ID Cards"}
              </h3>
              <div className="admin-events-chat-meta">
                <button
                  type="button"
                  className="admin-events-id-card-print-all-btn"
                  onClick={() => setDownloadIdCardPopupOpen(true)}
                  disabled={idCardRangeStudents.length === 0}
                >
                  {idCardTargetType === "teacher"
                    ? idCardRangeStudents.length === 1
                      ? "Download / Print Teacher Card"
                      : "Download / Print All Teachers"
                    : "Download / Print Selected Class"}
                </button>
                <button
                  type="button"
                  className="admin-events-modal-close"
                  onClick={() => setAllIdCardsPopupOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>
            {idCardRangeLoading ? (
              <div className="admin-events-empty-state" style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
                  Generating {idCardTargetType === "teacher" ? "Teacher" : "Student"} ID Cards
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  {idCardRangeLoadingMessage || "Loading and preloading photos..."}
                </div>
              </div>
            ) : idCardRangeError ? (
              <div className="admin-events-empty-state">{idCardRangeError}</div>
            ) : idCardRangeStudents.length === 0 ? (
              <div className="admin-events-empty-state">
                {idCardTargetType === "teacher" ? "No teachers found." : "No students found for the selected class and section."}
              </div>
            ) : (
              <div
                ref={idCardGridScrollRef}
                className="admin-events-id-card-grid-scroll"
                style={{ maxHeight: "65vh", overflowY: "auto" }}
              >
                <div className="admin-events-id-card-grid">
                  {idCardRangeStudents.slice(0, idCardVisibleCount).map((student, index) => {
                    const name = student?.name || student?.teacher_name || student?.student_name || student?.studentName || (idCardTargetType === "teacher" ? "Teacher" : "Student");
                    const className =
                      student?.class_name || student?.class || student?.className || student?.classname || student?.designation || "-";
                    const section =
                      student?.section || student?.section_name || student?.sectionName || student?.sec || student?.department || "-";

                    const previewUrlBuilder = idCardTargetType === "teacher" ? buildTeacherIdCardPreviewUrl : buildIdCardPreviewUrl;

                    return (
                      <div
                        key={`${name}-${className}-${section}-${student?.id || index}`}
                        className="admin-events-id-card-item"
                      >
                        <div className="admin-events-id-card-frame-wrap">
                          <iframe
                            title={`${name} ID card preview`}
                            src={previewUrlBuilder(
                              normalizeIdCardTemplateName(generatedIdCardTemplate || selectedIdCardTemplate),
                              student,
                              schoolName,
                              schoolLogo,
                              localStorage.getItem("schoolAddress") || ""
                            )}
                            className="admin-events-id-card-frame"
                            loading="lazy"
                            onLoad={(e) => {
                              try {
                                const doc = e.target.contentDocument || e.target.contentWindow?.document;
                                if (doc) {
                                  applyTeacherIdCardLabels(doc);
                                  syncIdCardPhotoBeforeCapture(doc, student, idCardPhotoCacheRef.current);
                                }
                              } catch (err) {
                                console.warn("Preview iframe photo sync error:", err);
                              }
                            }}
                          />
                        </div>
                        <strong>{name}</strong>
                        <small>
                          {idCardTargetType === "teacher"
                            ? `${student?.designation || "Teacher"}${student?.department ? ` | ${student.department}` : ""}`
                            : `Class ${className} | Sec ${section}`}
                        </small>
                      </div>
                    );
                  })}
                </div>

                {/* Sentinel: once this scrolls into view, the next batch of cards is revealed */}
                {idCardVisibleCount < idCardRangeStudents.length && (
                  <div
                    ref={idCardGridSentinelRef}
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    Loading more {idCardTargetType === "teacher" ? "teachers" : "students"}… (
                    {idCardVisibleCount} of {idCardRangeStudents.length})
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

 {reportPopupOpen && selectedReportStudent && (
  <div className="admin-events-modal-overlay" onClick={() => setReportPopupOpen(false)}>
    <div className="admin-events-report-preview-modal" onClick={(e) => e.stopPropagation()}>
      <div className="admin-events-card-header">
        <h3>{selectedReportStudent?.name || "Academic Report Card"}</h3>
        <div className="admin-events-chat-meta">
          {/* PDF Button */}
          <button
            type="button"
            className="admin-events-generation-select-btn"
            onClick={handleDownloadAcademicReport}
               style={{width:"100px"}}
            disabled={reportPreviewLoading}
          >
            Download PDF
          </button>
          
          {/* NEW: Image Button */}
          <button
            type="button"
            className="admin-events-generation-select-btn"
            style={{width:"100px"}}
            onClick={handleDownloadAcademicReportImage}
            disabled={reportPreviewLoading}
          >
           Download Image
          </button>

          {/* NEW: Excel Button */}
          {/* <button
            type="button"
            className="admin-events-generation-select-btn"
            onClick={handleDownloadAcademicReportExcel}
            disabled={reportPreviewLoading}
          >
            Download Excel
          </button> */}

          <button
            type="button"
            className="admin-events-modal-close"
            onClick={() => setReportPopupOpen(false)}
          >
            ×
          </button>
        </div>
      </div>
      
      {/* ... rest of your iframe code ... */}
   <div className="admin-events-academic-preview-frame-wrap">
              <iframe
                ref={reportPreviewFrameRef}
                title={`${selectedReportStudent?.name || "Student"} academic report`}
                src={import.meta.env.BASE_URL + `reports/${selectedReportCardTemplate}`}
                className="admin-events-academic-preview-frame"
                onLoad={() => {
                  if (reportPreviewFrameRef.current?.contentWindow && selectedReportPayload) {
                    reportPreviewFrameRef.current.contentWindow.postMessage(
                      { type: "REPORT_CARD_PAYLOAD", payload: selectedReportPayload },
                      window.location.origin
                    );
                    window.setTimeout(() => applyReportPreviewFit(reportPreviewFrameRef.current), 120);
                    window.setTimeout(() => applyReportPreviewFit(reportPreviewFrameRef.current), 320);
                  }
                }}
              />
            </div>
    </div>
  </div>
)}
{downloadIdCardPopupOpen && (
  <div className="admin-events-modal-overlay" onClick={() => setDownloadIdCardPopupOpen(false)}>
    <div className="admin-events-report-preview-modal admin-events-download-id-modal" onClick={(e) => e.stopPropagation()}>
      <div className="admin-events-card-header">
        <h3>Download ID Cards</h3>
        <button type="button" className="admin-events-modal-close" onClick={() => setDownloadIdCardPopupOpen(false)}>×</button>
      </div>

      <div className="admin-events-download-body">
        
        <div className="admin-events-download-section">
          <label>Selection Summary</label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '10px', 
            marginTop: '8px' 
          }}>
   
               {/* 1. Total Count Card */}
            <div style={{ 
              padding: '14px', 
              border: '1px solid #f9b1b8', 
              borderRadius: '10px', 
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000000' }}>
                {idCardRangeStudents.length}
              </div>
              <div style={{ fontSize: '12px', color: '#000000', fontWeight: 600, textTransform: 'uppercase' }}>
                {idCardTargetType === "teacher" ? "Total Teachers" : "Total Students"}
              </div>
            </div>

            {/* 2. Breakdown Cards */}
            {Object.entries(
              idCardRangeStudents.reduce((acc, person) => {
                const groupKey = idCardTargetType === "teacher"
                  ? (person?.department || person?.dept || person?.designation || "General")
                  : (person?.class_name || person?.class || person?.className || person?.classname || "-");
                acc[groupKey] = (acc[groupKey] || 0) + 1;
                return acc;
              }, {})
            ).map(([groupKey, count]) => (
              <div key={groupKey} style={{ 
                padding: '14px', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '10px', 
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#334155' }}>
                  {count}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  {idCardTargetType === "teacher" ? groupKey : `Class ${groupKey}`}
                </div>
              </div>
            ))}

          </div>
        </div>

        
        <div className="admin-events-download-section">
          <label>File Format</label>
          <div className="admin-events-radio-group">
            <label><input type="radio" name="fileFormat" value="pdf-print" checked={idCardFileFormat === 'pdf-print'} onChange={e => setIdCardFileFormat(e.target.value)} /> PDF (Print Ready)</label>
            <label><input type="radio" name="fileFormat" value="pdf-standard" checked={idCardFileFormat === 'pdf-standard'} onChange={e => setIdCardFileFormat(e.target.value)} /> PDF (Standard)</label>
            <label><input type="radio" name="fileFormat" value="png" checked={idCardFileFormat === 'png'} onChange={e => setIdCardFileFormat(e.target.value)} /> PNG Images</label>
            <label><input type="radio" name="fileFormat" value="jpeg" checked={idCardFileFormat === 'jpeg'} onChange={e => setIdCardFileFormat(e.target.value)} /> JPEG Images</label>
          </div>
        </div>

        <div className="admin-events-download-section">
          <label>Batch Download</label>
          <div className="admin-events-radio-group">
            <label>
              <input
                type="radio"
                name="batchSize"
                value="0"
                checked={idCardBatchSize === 0}
                onChange={() => setIdCardBatchSize(0)}
              /> All at once ({idCardRangeStudents.length})
            </label>
            <label>
              <input
                type="radio"
                name="batchSize"
                value="10"
                checked={idCardBatchSize === 10}
                onChange={() => setIdCardBatchSize(10)}
              /> 10 at a time
            </label>
            <label>
              <input
                type="radio"
                name="batchSize"
                value="20"
                checked={idCardBatchSize === 20}
                onChange={() => setIdCardBatchSize(20)}
              /> 20 at a time
            </label>
          </div>
          {idCardBatchSize > 0 && (
            <div style={{
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: '#334155',
            }}>
              <button
                type="button"
                className="admin-events-modal-cancel-btn"
                style={{ padding: '4px 10px' }}
                disabled={idCardBatchIndex === 0}
                onClick={() => setIdCardBatchIndex((prev) => Math.max(0, prev - 1))}
              >
                ‹ Prev
              </button>
              <span>
                Batch {idCardBatchIndex + 1} of {Math.max(1, Math.ceil(idCardRangeStudents.length / idCardBatchSize))}
                {" "}({idCardBatchIndex * idCardBatchSize + 1}
                –{Math.min((idCardBatchIndex + 1) * idCardBatchSize, idCardRangeStudents.length)})
              </span>
              <button
                type="button"
                className="admin-events-modal-cancel-btn"
                style={{ padding: '4px 10px' }}
                disabled={idCardBatchIndex >= Math.ceil(idCardRangeStudents.length / idCardBatchSize) - 1}
                onClick={() => setIdCardBatchIndex((prev) => prev + 1)}
              >
                Next ›
              </button>
            </div>
          )}
        </div>

        <div className="admin-events-download-section">
          <label>Download Type</label>
          <div className="admin-events-radio-group">
            <label><input type="radio" name="downloadType" value="zip" checked={idCardDownloadType === 'zip'} onChange={e => setIdCardDownloadType(e.target.value)} /> Individual Files (ZIP)</label>
            <label><input type="radio" name="downloadType" value="single-pdf" checked={idCardDownloadType === 'single-pdf'} onChange={e => setIdCardDownloadType(e.target.value)} /> Single PDF</label>
            {idCardRangeStudents.length === 1 && (
              <label><input type="radio" name="downloadType" value="single-image" checked={idCardDownloadType === 'single-image'} onChange={e => setIdCardDownloadType(e.target.value)} /> Single Image</label>
            )}
          </div>
        </div>

        {(idCardFileFormat === 'pdf-print' || idCardFileFormat === 'pdf-standard') && (
          <div className="admin-events-download-section">
            <label>PDF Layout</label>
            <select value={idCardPdfLayout} onChange={e => setIdCardPdfLayout(Number(e.target.value))}>
              <option value={1}>1 Card Per Page</option>
              <option value={2}>2 Cards Per Page</option>
              <option value={4}>4 Cards Per Page</option>
              <option value={8}>8 Cards Per A4</option>
              <option value={10}>10 Cards Per A4</option>
              <option value={12}>12 Cards Per A4</option>
            </select>
          </div>
        )}

    <div className="admin-events-download-section">
  <label>Card Sides</label>
  <div style={{
    padding: '14px 18px',
    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    border: '1px solid #93c5fd',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#3b82f6',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0,
    }}>
      ✓
    </div>
    <div>
      <div style={{ fontWeight: 700, color: '#1e40af', fontSize: '14px' }}>
        Front & Back (Both Sides)
      </div>
      <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
        Each student will get 2 cards (front + back)
      </div>
    </div>
  </div>
</div>

        <div className="admin-events-download-row">
          <div className="admin-events-download-section">
            <label>Paper Size</label>
            <select value={idCardPaperSize} onChange={e => setIdCardPaperSize(e.target.value)}>
              <option value="a4">A4 (Default)</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
            </select>
          </div>
          <div className="admin-events-download-section">
            <label>Image Quality</label>
            <select value={idCardImageQuality} onChange={e => setIdCardImageQuality(e.target.value)}>
              <option value="standard">Standard</option>
              <option value="high">High Quality (300 DPI) - Recommended</option>
            </select>
          </div>
        </div>

        <div className="admin-events-download-section">
          <label>Print Options</label>
          <div className="admin-events-checkbox-group">
            <label><input type="checkbox" checked={idCardShowCropMarks} onChange={e => setIdCardShowCropMarks(e.target.checked)} /> Show Crop Marks</label>
            <label><input type="checkbox" checked={idCardShowCutGuidelines} onChange={e => setIdCardShowCutGuidelines(e.target.checked)} /> Show Cut Guidelines</label>
            <label><input type="checkbox" checked={idCardAddPageNumbers} onChange={e => setIdCardAddPageNumbers(e.target.checked)} /> Add Page Numbers</label>
          </div>
        </div>

        <div className="admin-events-download-section">
          <label>File Name (Auto-generated)</label>
          <input 
            type="text" 
            value={idCardFileName} 
            onChange={e => setIdCardFileName(e.target.value)} 
            placeholder="IDCards_SelectedStudents"
          />
          <small style={{color: '#888', display: 'block', marginTop: '4px', fontSize: '12px'}}>
            Examples: IDCards_Class10_A, IDCards_SectionB, IDCards_EntireSchool
          </small>
        </div>

        {/* <div className="admin-events-download-note">
          <strong>Note (Print & Export Standards):</strong>
          <ul>
            <li>Generate Print Ready PDFs at 300 DPI. Embed all fonts to prevent substitution.</li>
            <li>Maintain exact physical card dimensions (use mm). Keep 5mm safe margin & 3mm bleed.</li>
            <li>Enable Crop Marks/Cut Guidelines when selected. Do not scale/stretch HTML templates.</li>
            <li>Preserve aspect ratio of photos/logos/QR codes. Export high-res images without quality loss.</li>
            <li>PNG/JPEG: Export one image per student. Auto-package into ZIP if multiple selected.</li>
            <li>PDF: Arrange cards per layout. Align Front & Back for duplex printing.</li>
            <li>Use A4/Letter/Legal without altering card dimensions. Suitable for PVC card printing.</li>
          </ul>
        </div> */}
      </div>

      <div className="admin-events-download-footer">
        <button type="button" className="admin-events-modal-cancel-btn" onClick={() => setDownloadIdCardPopupOpen(false)}>Cancel</button>
        {/* <button type="button" className="admin-events-modal-preview-btn">Preview</button>  */}
        <button type="button" className="admin-events-modal-download-btn" onClick={handleExecuteIdCardDownload}>
          {idCardBatchSize > 0
            ? `Download Batch ${idCardBatchIndex + 1} of ${Math.max(1, Math.ceil(idCardRangeStudents.length / idCardBatchSize))}`
            : "Download"}
        </button>
      </div>
    </div>
  </div>
)}
{downloadReportCardPopupOpen && (
  <div className="admin-events-modal-overlay" onClick={() => setDownloadReportCardPopupOpen(false)}>
    <div className="admin-events-report-preview-modal admin-events-download-id-modal" onClick={(e) => e.stopPropagation()}>
      <div className="admin-events-card-header">
        <h3>Download Report Cards</h3>
        <button type="button" className="admin-events-modal-close" onClick={() => setDownloadReportCardPopupOpen(false)}>×</button>
      </div>

      <div className="admin-events-download-body">
        
        <div className="admin-events-download-section">
          <label>Selection Summary</label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '10px', 
            marginTop: '8px' 
          }}>
            {/* 1. Total Count Card */}
            <div style={{ 
              padding: '14px', 
              border: '1px solid #f9b1b8', 
              borderRadius: '10px', 
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000000' }}>
                {reportRangeStudents.length}
              </div>
              <div style={{ fontSize: '12px', color: '#000000', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Students
              </div>
            </div>

            {/* 2. Breakdown Cards */}
            {Object.entries(
              reportRangeStudents.reduce((acc, person) => {
                const groupKey = person?.class_name || person?.class || person?.className || person?.classname || "-";
                acc[groupKey] = (acc[groupKey] || 0) + 1;
                return acc;
              }, {})
            ).map(([groupKey, count]) => (
              <div key={groupKey} style={{ 
                padding: '14px', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '10px', 
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#334155' }}>
                  {count}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Class {groupKey}
                </div>
              </div>
            ))}
            {/* 3. Rank Status Badge */}
            <div style={{ 
              padding: '14px', 
              background: reportCardRankMode === 'with-rank' ? '#eff6ff' : '#f8fafc', 
              border: reportCardRankMode === 'with-rank' ? '1px solid #bfdbfe' : '1px solid #e2e8f0', 
              borderRadius: '10px', 
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: reportCardRankMode === 'with-rank' ? '#1d4ed8' : '#334155', marginTop: '4px' }}>
                {reportCardRankMode === 'with-rank' ? 'With Rank' : 'Without Rank'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginTop: '6px' }}>
                Rank Status
              </div>
            </div>
          </div>
        </div>

        <div className="admin-events-download-section">
          <label>File Format</label>
          <div className="admin-events-radio-group">
            <label><input type="radio" name="reportCardFileFormat" value="pdf-print" checked={reportCardFileFormat === 'pdf-print'} onChange={e => setReportCardFileFormat(e.target.value)} /> PDF (Print Ready)</label>
            <label><input type="radio" name="reportCardFileFormat" value="pdf-standard" checked={reportCardFileFormat === 'pdf-standard'} onChange={e => setReportCardFileFormat(e.target.value)} /> PDF (Standard)</label>
            <label><input type="radio" name="reportCardFileFormat" value="png" checked={reportCardFileFormat === 'png'} onChange={e => setReportCardFileFormat(e.target.value)} /> PNG Images</label>
            <label><input type="radio" name="reportCardFileFormat" value="jpeg" checked={reportCardFileFormat === 'jpeg'} onChange={e => setReportCardFileFormat(e.target.value)} /> JPEG Images</label>
          </div>
        </div>

        <div className="admin-events-download-section">
          <label>Batch Download</label>
          <div className="admin-events-radio-group">
            <label>
              <input
                type="radio"
                name="reportCardBatchSize"
                value="0"
                checked={reportCardBatchSize === 0}
                onChange={() => setReportCardBatchSize(0)}
              /> All at once ({reportRangeStudents.length})
            </label>
            <label>
              <input
                type="radio"
                name="reportCardBatchSize"
                value="10"
                checked={reportCardBatchSize === 10}
                onChange={() => setReportCardBatchSize(10)}
              /> 10 at a time
            </label>
            <label>
              <input
                type="radio"
                name="reportCardBatchSize"
                value="20"
                checked={reportCardBatchSize === 20}
                onChange={() => setReportCardBatchSize(20)}
              /> 20 at a time
            </label>
          </div>
          {reportCardBatchSize > 0 && (
            <div style={{
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: '#334155',
            }}>
              <button
                type="button"
                className="admin-events-modal-cancel-btn"
                style={{ padding: '4px 10px' }}
                disabled={reportCardBatchIndex === 0}
                onClick={() => setReportCardBatchIndex((prev) => Math.max(0, prev - 1))}
              >
                ‹ Prev
              </button>
              <span>
                Batch {reportCardBatchIndex + 1} of {Math.max(1, Math.ceil(reportRangeStudents.length / reportCardBatchSize))}
                {" "}({reportCardBatchIndex * reportCardBatchSize + 1}
                –{Math.min((reportCardBatchIndex + 1) * reportCardBatchSize, reportRangeStudents.length)})
              </span>
              <button
                type="button"
                className="admin-events-modal-cancel-btn"
                style={{ padding: '4px 10px' }}
                disabled={reportCardBatchIndex >= Math.ceil(reportRangeStudents.length / reportCardBatchSize) - 1}
                onClick={() => setReportCardBatchIndex((prev) => prev + 1)}
              >
                Next ›
              </button>
            </div>
          )}
        </div>

        <div className="admin-events-download-section">
          <label>Download Type</label>
          <div className="admin-events-radio-group">
            <label><input type="radio" name="reportCardDownloadType" value="single-pdf" checked={reportCardDownloadType === 'single-pdf'} onChange={e => setReportCardDownloadType(e.target.value)} /> Single PDF (1 Card Per Paper)</label>
            <label><input type="radio" name="reportCardDownloadType" value="zip" checked={reportCardDownloadType === 'zip'} onChange={e => setReportCardDownloadType(e.target.value)} /> Individual Files (ZIP)</label>
            {reportRangeStudents.length === 1 && (
              <label><input type="radio" name="reportCardDownloadType" value="single-image" checked={reportCardDownloadType === 'single-image'} onChange={e => setReportCardDownloadType(e.target.value)} /> Single Image</label>
            )}
          </div>
        </div>

        <div className="admin-events-download-row">
          <div className="admin-events-download-section">
            <label>Paper Size</label>
            <select value={reportCardPaperSize} onChange={e => setReportCardPaperSize(e.target.value)}>
              <option value="a4">A4 (Default)</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
            </select>
          </div>
          <div className="admin-events-download-section">
            <label>Page Orientation</label>
            <select value={reportCardOrientation} onChange={e => setReportCardOrientation(e.target.value)}>
              <option value="auto">Auto (Match Card)</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
          <div className="admin-events-download-section">
            <label>Image Quality</label>
            <select value={reportCardImageQuality} onChange={e => setReportCardImageQuality(e.target.value)}>
              <option value="standard">Standard</option>
              <option value="high">High Quality (300 DPI) - Recommended</option>
            </select>
          </div>
        </div>

        <div className="admin-events-download-section">
          <label>Print Options</label>
          <div className="admin-events-checkbox-group">
            <label><input type="checkbox" checked={reportCardShowCropMarks} onChange={e => setReportCardShowCropMarks(e.target.checked)} /> Show Crop Marks</label>
            <label><input type="checkbox" checked={reportCardShowCutGuidelines} onChange={e => setReportCardShowCutGuidelines(e.target.checked)} /> Show Cut Guidelines</label>
            <label><input type="checkbox" checked={reportCardAddPageNumbers} onChange={e => setReportCardAddPageNumbers(e.target.checked)} /> Add Page Numbers</label>
          </div>
        </div>

        <div className="admin-events-download-section">
          <label>File Name (Auto-generated)</label>
          <input 
            type="text" 
            value={reportCardFileName} 
            onChange={e => setReportCardFileName(e.target.value)} 
            placeholder="ReportCards_SelectedStudents"
          />
          <small style={{color: '#888', display: 'block', marginTop: '4px', fontSize: '12px'}}>
            Examples: ReportCards_Class10_A, ReportCards_SectionB
          </small>
        </div>
      </div>

      <div className="admin-events-download-footer">
        <button type="button" className="admin-events-modal-cancel-btn" onClick={() => setDownloadReportCardPopupOpen(false)}>Cancel</button>
        <button type="button" className="admin-events-modal-download-btn" onClick={handleExecuteReportCardDownload}>
          {reportCardBatchSize > 0
            ? `Download Batch ${reportCardBatchIndex + 1} of ${Math.max(1, Math.ceil(reportRangeStudents.length / reportCardBatchSize))}`
            : "Download"}
        </button>
      </div>
    </div>
  </div>
)}
  {
              isHelpOpen && (
                <>
                <HelpCenter
                userRole={userRole}
                openHelpSection={openHelpSection}
                    setOpenHelpSection={setOpenHelpSection}
                setIsHelpOpen={setIsHelpOpen}
                />
                </>
              )
            }
            {/* 🔥 Download Progress Overlay */}
{downloadProgress.active && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    color: '#fff',
    fontFamily: 'Arial, sans-serif',
  }}>
    <div style={{
      background: '#fff',
      color: '#1a202c',
      padding: '40px 50px',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      textAlign: 'center',
      minWidth: '360px',
    }}>
      {/* Spinning loader */}
      <div style={{
        width: '60px',
        height: '60px',
        border: '5px solid #e2e8f0',
        borderTopColor: '#003a74',
        borderRadius: '50%',
        margin: '0 auto 20px',
        animation: 'spin 1s linear infinite',
      }} />

      <h3 style={{ margin: '0 0 10px', fontSize: '20px', color: '#003a74' }}>
        Generating Cards
      </h3>

      <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '14px' }}>
        {downloadProgress.message}
      </p>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '10px',
        background: '#e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
        marginBottom: '10px',
      }}>
        <div style={{
          width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #003a74, #667eea)',
          transition: 'width 0.3s ease',
          borderRadius: '10px',
        }} />
      </div>

      <div style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
        {downloadProgress.current} / {downloadProgress.total}
      </div>

      <small style={{ display: 'block', marginTop: '15px', color: '#94a3b8', fontSize: '12px' }}>
        Please don't close this window
      </small>
    </div>

    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)}
      <div className="accountant-footer-brand">
        <span>Powered By:</span>
        <img src={abcLogo} alt="Cleezo Class" className="accountant-footer-logo" />
      </div>

    </div>
  );
};

export default AdminGenerations;