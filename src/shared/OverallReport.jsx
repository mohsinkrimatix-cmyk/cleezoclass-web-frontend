import { useState, useEffect, useRef } from "react";
import axios from 'axios';
import '../STYLES/ReportCard.css'; // Ensure this file exists
import html2pdf from "html2pdf.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Label } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from 'react-dom/client';
import ReportCardFull from './Reportcard'; // Import the layout
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserClock,
  faUserTimes,
  faMoneyCheckAlt,
  faBookReader,
  faUserCheck,
  faTrophy,
  faExclamationCircle,
  faAward,
  faDownload,
  faPrint,
  faShareAlt,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const REPORT_TEMPLATE_STORAGE_KEY = "reportCardSelectedTemplate";
const REPORT_PAYLOAD_STORAGE_KEY = "reportCardPayload";
const DEFAULT_TEMPLATE = "report1.html";

const normalizeTemplateName = (value) => {
  const template = String(value || "").trim().toLowerCase();
  return /^report[1-6]\.html$/.test(template) ? template : DEFAULT_TEMPLATE;
};

const safeParsePerformance = (raw) => {
  try {
    const parsed = JSON.parse(raw || "{}");
    return Array.isArray(parsed?.performance) ? parsed.performance : [];
  } catch (e) {
    return [];
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForReportReady = (frame, timeout = 3000) =>
  new Promise((resolve) => {
    if (!frame?.contentWindow) return resolve(false);
    const win = frame.contentWindow;
    const done = () => resolve(true);

    if (win.__reportReady) return resolve(true);

    const onReady = () => {
      win.removeEventListener("REPORT_READY", onReady);
      resolve(true);
    };
    win.addEventListener("REPORT_READY", onReady);

    setTimeout(() => {
      win.removeEventListener("REPORT_READY", onReady);
      resolve(false);
    }, timeout);
  });

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

const normalizePerformanceForTemplate = (rows) => {
  if (!Array.isArray(rows)) return [];

  const toNumberOrZero = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const fromTestEntry = (entry) => {
    if (entry == null) return 0;
    if (typeof entry === "object") {
      if (entry.obtained != null) return toNumberOrZero(entry.obtained);
      if (entry.marks != null) return toNumberOrZero(entry.marks);
      if (entry.value != null) return toNumberOrZero(entry.value);
    }
    return toNumberOrZero(entry);
  };

  return sortPerformanceSubjects(
    rows.map((row) => {
      const subject =
        row?.subject ||
        row?.name ||
        row?.subject_name ||
        row?.title ||
        "-";

      if (Array.isArray(row?.FA) || Array.isArray(row?.SA)) {
        const fa = Array.isArray(row?.FA) ? row.FA.map(fromTestEntry) : [];
        const sa = Array.isArray(row?.SA) ? row.SA.map(fromTestEntry) : [];
        return {
          ...row,
          subject,
          FA: fa,
          SA: sa,
          tests: row?.tests && typeof row.tests === "object" ? row.tests : {
            FA1: fa[0], FA2: fa[1], FA3: fa[2], FA4: fa[3],
            SA1: sa[0], SA2: sa[1]
          }
        };
      }

      const tests = row?.tests && typeof row.tests === "object" ? row.tests : {};
      const read = (key) => {
        if (tests[key] != null) return fromTestEntry(tests[key]);
        const hit = Object.keys(tests).find((k) => String(k).toLowerCase() === key.toLowerCase());
        return hit ? fromTestEntry(tests[hit]) : 0;
      };

      const fa = [read("FA1"), read("FA2"), read("FA3"), read("FA4")];
      const sa = [read("SA1"), read("SA2")];
      return {
        subject,
        FA: fa,
        SA: sa,
        tests
      };
    })
  );
};

const applyDownloadCleanupStyles = (doc) => {
  if (!doc) return;

  doc.documentElement.classList.add("report-download-mode");
  doc.body?.classList.add("report-download-mode");

  if (doc.getElementById("report-download-cleanup-style")) return;

  const style = doc.createElement("style");
  style.id = "report-download-cleanup-style";
  style.textContent = `
    html.report-download-mode,
    body.report-download-mode {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
    }

    .report-download-mode .report-card,
    .report-download-mode [class*="report-card"],
    .report-download-mode [class^="report"] {
      box-shadow: none !important;
      filter: none !important;
      text-shadow: none !important;
    }

    .report-download-mode .no-print,
    .report-download-mode [class*="no-print"],
    .report-download-mode button {
      display: none !important;
    }

    .report-download-mode *,
    .report-download-mode *::before,
    .report-download-mode *::after {
      animation: none !important;
      transition: none !important;
    }
  `;
  doc.head?.appendChild(style);
};

const exportSelectedTemplatePdf = async ({ studentData, performance, testTypes = [] }) => {
  const template = normalizeTemplateName(localStorage.getItem(REPORT_TEMPLATE_STORAGE_KEY));
  const schoolCode = localStorage.getItem("schoolCode") || "";
  const payload = {
    student: {
      name: studentData?.name || "",
      class_name: studentData?.class_name || "",
      section: studentData?.section || "",
      father_name: studentData?.father_name || "",
      address: studentData?.address || "",
      phone_no: studentData?.phone_no || "",
      aadhar_no: studentData?.aadhar_no || "",
      admission_no: studentData?.admission_no || "",
      dob: studentData?.dob || "",
      photo:
        studentData?.photo ||
        studentData?.student_photo ||
        studentData?.photo_url ||
        studentData?.photoUrl ||
        studentData?.image ||
        studentData?.student_image ||
        "",
      schoolCode,
    },
    performance: normalizePerformanceForTemplate(performance),
    testTypes: Array.isArray(testTypes) ? testTypes : [],
    attendance: (() => {
      try {
        const raw = localStorage.getItem("reportAttendanceData");
        const parsed = raw ? JSON.parse(raw) : null;
        return parsed && parsed.monthly ? parsed.monthly : [];
      } catch (_) {
        return [];
      }
    })(),
    syncedAt: new Date().toISOString(),
  };

  localStorage.setItem(REPORT_PAYLOAD_STORAGE_KEY, JSON.stringify(payload));
  console.log("[OVERALL_REPORT] template:", template);
  console.log("[OVERALL_REPORT] iframe src:", `${import.meta.env.BASE_URL}reports/${template}`);
  console.log("[OVERALL_REPORT] payload.performance length:", Array.isArray(payload.performance) ? payload.performance.length : payload.performance);

  const resolveTemplateUrl = async () => {
    const baseUrl = String(import.meta.env.BASE_URL || "/");
    const candidates = [
      new URL(`${baseUrl}reports/${template}`, window.location.origin).href,
      new URL(`/CRM/reports/${template}`, window.location.origin).href,
      new URL(`/reports/${template}`, window.location.origin).href,
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: "GET", cache: "no-store" });
        if (res.ok) return url;
      } catch (_) {
        // try next
      }
    }
    return candidates[0];
  };

  const templateUrl = await resolveTemplateUrl();

  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.width = "1200px";
  frame.style.height = "1700px";
  frame.style.border = "0";
  frame.src = templateUrl;
  document.body.appendChild(frame);

  try {
    await new Promise((resolve, reject) => {
      frame.onload = resolve;
      frame.onerror = reject;
    });

    frame.contentWindow?.postMessage(
      { type: "REPORT_CARD_PAYLOAD", payload },
      window.location.origin
    );
    try {
      const hasApply = typeof frame.contentWindow?.applyReportPayload === "function";
      console.log("[OVERALL_REPORT] applyReportPayload available:", hasApply);
      frame.contentWindow?.applyReportPayload?.(payload);
    } catch (e) {
      // ignore cross-script errors; postMessage will handle it
    }

    const ready = await waitForReportReady(frame, 8000);
    console.log("[OVERALL_REPORT] REPORT_READY:", ready);
    const doc = frame.contentWindow?.document;
    const table = doc?.querySelector?.("[data-academic-table]");
    console.log("[OVERALL_REPORT] table found:", !!table);
    console.log("[OVERALL_REPORT] report debug:", frame.contentWindow?.__reportDebug || null);
    if (!ready) {
      await sleep(900);
    }

    applyDownloadCleanupStyles(doc);
    const target = doc?.querySelector(".report-card") || doc?.body;
    if (!target) throw new Error("Selected template did not render.");

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: doc.documentElement.scrollWidth,
      windowHeight: doc.documentElement.scrollHeight,
    });

    const orientation = canvas.width > canvas.height ? "l" : "p";
    const pdf = new jsPDF(orientation, "mm", "a4");
    const pageWidth = orientation === "l" ? 297 : 210;
    const pageHeight = orientation === "l" ? 210 : 297;
    const imageRatio = canvas.width / canvas.height;

    let renderWidth = pageWidth;
    let renderHeight = renderWidth / imageRatio;
    if (renderHeight > pageHeight) {
      renderHeight = pageHeight;
      renderWidth = renderHeight * imageRatio;
    }

    const x = (pageWidth - renderWidth) / 2;
    const y = (pageHeight - renderHeight) / 2;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, renderWidth, renderHeight);
    pdf.save(`${studentData?.name || "Student"}_ReportCard.pdf`);
  } finally {
    document.body.removeChild(frame);
  }
};
const Header = ({ studentData }) => {
  console.log("=== Header Component ===");
  console.log("studentData:", studentData);

  let photoURL = '';
  const rawPhoto =
    studentData?.photo ||
    studentData?.student_photo ||
    studentData?.photo_url ||
    studentData?.photoUrl ||
    studentData?.image ||
    studentData?.student_image ||
    "";

  if (rawPhoto) {
    let photoPath = rawPhoto;

    // If it's an object with data (Buffer from backend), convert manually
    if (rawPhoto?.data) {
      // Convert Uint8Array to string
      const byteArray = new Uint8Array(rawPhoto.data);
      photoPath = String.fromCharCode(...byteArray);
    }

    // If hex string like '0x2F7570...', convert to string
    if (typeof photoPath === "string" && photoPath.startsWith('0x')) {
      // Remove '0x' and decode hex
      photoPath = photoPath
        .match(/.{2}/g) // split into 2-character chunks
        .map(byte => String.fromCharCode(parseInt(byte, 16)))
        .join('');
    }

    if (typeof photoPath === "string" && (/^https?:\/\//i.test(photoPath) || photoPath.startsWith("data:"))) {
      photoURL = photoPath;
    } else {
      photoURL = `https://cleezoclass.com:4000${photoPath}`;
    }
    console.log("photoURL:", photoURL);
  } else {
    console.log("No photo available");
  }
 const schoolCode = localStorage.getItem('schoolCode')?.toLowerCase();
  // useEffect(() => {
  //   const fetchSchoolLogo = async () => {
  //     console.log('🚀 Starting logo fetch process...');
  
  //     const code = localStorage.getItem('schoolCode');
  //     console.log('🧾 localStorage.getItem("schoolCode") =', code, '| Type:', typeof code);
  
  //     if (!code) {
  //       console.warn('❌ No school code found in localStorage. Aborting fetch.');
  //       return;
  //     }
  
  //     setDynamicSchoolCode(code);
  //     console.log('📦 Set dynamic school code in state:', code);
  
  //     try {
  //       console.log('📡 Sending POST request to backend with secretecode...');
  //       const response = await axios.post(
  //         'https://cleezoclass.com:4000/api/schoollogodynamic',
  //         { secretecode: code },
  //         {
  //           headers: {
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );
  
  //       console.log('📬 Response from backend:', response);
  //       console.log('📬 Response.data:', response.data);
  
  //       if (response.data.logoPath) {
  //         console.log('✅ Logo fetched successfully from backend.');
  //         setDynamicLogoSrc(response.data.logoPath);
  //       } else {
  //         console.warn('⚠️ No logo path found in backend response.');
  //       }
  //     } catch (error) {
  //       console.error('🔥 Error fetching school logo:', error.response?.data || error.message);
  //     }
  //   };
  
  //   fetchSchoolLogo();
  // }, []);
  
  return (
<div 
  className="header-section"
>

  {/* LEFT - LOGO (50%) */}
  {/* <div className="logo-placeholder">
    <img
      src={dynamicLogoSrc || "/default-logo.png"}
      alt="School Logo"
      className="header-logo"
    />
  </div> */}

  {/* CENTER - STUDENT INFO (50%) */}
  <div className="header-center">
    <div className="student-info">
      <p><strong>NAME:</strong> {studentData.name}</p>
      <p><strong>CLASS:</strong> {`${studentData.class_name} | Section: ${studentData.section}`}</p>
      <p><strong>FATHER:</strong> {studentData.father_name}</p>
      <p><strong>Address:</strong> {studentData.address}</p>
      <p><strong>Mobile no:</strong> {studentData.phone_no}</p>
      <p><strong>Aadhar no:</strong> {studentData.aadhar_no}</p>
    </div>
  </div>

  {/* RIGHT - PHOTO (FIXED) */}
  <div className="photo-placeholder">
    {photoURL ? (
      <img src={photoURL} alt={studentData.name} />
    ) : (
      <p>STUDENT PHOTO</p>
    )}
  </div>

</div>


  );
};
const AcademicPerformance = ({ studentData }) => {
  const [performance, setPerformance] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null); // ✅ MUST be here

  useEffect(() => {
    if (!studentData?.name || !studentData?.class_name || !studentData?.section) {
      console.warn("Missing studentData fields");
      setPerformance([]);
      setTestTypes([]);
      setLoading(false);
      return;
    }
const fetchPerformance = async () => {
  console.log("🔵 fetchPerformance function triggered");

  try {
    const schoolCode = localStorage.getItem("schoolCode");
    console.log("📌 schoolCode from localStorage:", schoolCode);

    if (!schoolCode) {
      console.error("❌ schoolCode not found in localStorage");
      setPerformance([]);
      setTestTypes([]);
      setLoading(false);
      return;
    }

    const requestPayload = {
      name: studentData.name,
      class_name: studentData.class_name,
      section: studentData.section,
      schoolCode,
    };

    console.log("📤 Sending request to API with payload:", requestPayload);

    const res = await axios.post(
      "https://cleezoclass.com:4000/api/overall/academic-performance",
      requestPayload
    );

    console.log("✅ API Response received:", res.data);

    if (Array.isArray(res.data)) {
      console.log("📊 Response is an array");

      setPerformance(res.data || []);
      setTestTypes([]);

      console.log("📊 Performance data set:", res.data);
    } else {
      console.log("📊 Response is an object");

      setPerformance(res.data?.performance || []);
      setTestTypes(res.data?.testTypes || []);

      console.log("📊 Performance data:", res.data?.performance);
      console.log("📊 Test Types:", res.data?.testTypes);
    }
  } catch (err) {
    console.error("❌ Error fetching academic performance:", err);
    console.error("❌ Error response:", err?.response?.data);

    setPerformance([]);
    setTestTypes([]);
  } finally {
    console.log("🔚 fetchPerformance finished");
    setLoading(false);
  }
};

    fetchPerformance();
  }, [studentData]);

  if (loading) return <p style={{ fontSize: "11px" }}>Loading...</p>;
  if (!performance.length) return <p style={{ fontSize: "11px" }}>No academic data.</p>;

  const fallbackTermRows = [
    { label: "FA1", key: "FA1", type: "FA", index: 0, maxMarks: 20 },
    { label: "FA2", key: "FA2", type: "FA", index: 1, maxMarks: 20 },
    { label: "SA1", key: "SA1", type: "SA", index: 0, maxMarks: 80 },
    { label: "FA3", key: "FA3", type: "FA", index: 2, maxMarks: 20 },
    { label: "FA4", key: "FA4", type: "FA", index: 3, maxMarks: 20 },
    { label: "SA2", key: "SA2", type: "SA", index: 1, maxMarks: 80 },
  ];

const termRows = (testTypes || []).length
  ? testTypes
      .filter((row) => row?.key && row?.label)
      .map((row) => ({ key: row.key, label: row.label }))
  : fallbackTermRows;

  const getTestEntryForRow = (subj, row) => {
    if (!subj?.tests || !row?.key) return null;
    return subj.tests[row.key] ?? null;
  };
const getLegacyMarkForRow = (subj, rowKey) => {
  const match = String(rowKey || '').toUpperCase().match(/^(FA|SA)(\\d+)$/);
  if (!match) return { mark: '-', max: 0 };

  const type = match[1];
  const index = Number(match[2]) - 1;
  const mark = type === 'FA' ? subj?.FA?.[index] : subj?.SA?.[index];
  const max = type === 'FA' ? 20 : 80;

  return { mark: mark ?? '-', max: mark === null || mark === undefined ? 0 : max };
};

const getMarkForRow = (subj, row) => {
  const testEntry = subj?.tests?.[row?.key];
  if (testEntry?.obtained !== null && testEntry?.obtained !== undefined) {
    return testEntry.obtained;
  }
  return getLegacyMarkForRow(subj, row?.key).mark;
};

const getMaxForRow = (subj, row) => {
  const testEntry = subj?.tests?.[row?.key];
  if (testEntry?.max !== null && testEntry?.max !== undefined) {
    return Number(testEntry.max) || 0;
  }
  return getLegacyMarkForRow(subj, row?.key).max;
};
  const termPercentage = (row) => {
    let obtained = 0;
    let total = 0;

    performance.forEach((subj) => {
      const mark = getMarkForRow(subj, row);
      const maxMark = getMaxForRow(subj, row);
      const numericMark = Number(mark);
      if (
        mark !== "-" &&
        mark !== null &&
        mark !== undefined &&
        !Number.isNaN(numericMark) &&
        maxMark > 0
      ) {
        obtained += numericMark;
        total += maxMark;
      }
    });

    return total > 0 ? ((obtained / total) * 100).toFixed(2) : "0.00";
  };

  const getAnyNumber = (obj, keys) => {
    for (const key of keys) {
      const value = obj?.[key];
      const num = Number(value);
      if (!Number.isNaN(num)) return num;
    }
    return NaN;
  };

  const computeOverallTotals = () => {
    let obtained = 0;
    let total = 0;

    performance.forEach((subj) => {
      const subjectObtained = getAnyNumber(subj, [
        "obtainedMarks",
        "marksObtained",
        "total_obtained",
        "totalObtained",
        "marks",
        "score",
      ]);
      const subjectTotal = getAnyNumber(subj, [
        "totalMarks",
        "maxMarks",
        "maximumMarks",
        "total",
        "max",
      ]);

      if (!Number.isNaN(subjectObtained) && !Number.isNaN(subjectTotal) && subjectTotal > 0) {
        obtained += subjectObtained;
        total += subjectTotal;
        return;
      }

      termRows.forEach((row) => {
        const mark = getMarkForRow(subj, row);
        const maxMark = getMaxForRow(subj, row);
        const numericMark = Number(mark);
        if (
          mark !== "-" &&
          mark !== null &&
          mark !== undefined &&
          !Number.isNaN(numericMark) &&
          maxMark > 0
        ) {
          obtained += numericMark;
          total += maxMark;
        }
      });
    });

    return { obtained, total };
  };

  // Calculate overall academic percentage
  const overallPercentage = () => {
    const { obtained, total } = computeOverallTotals();
    return total > 0 ? ((obtained / total) * 100).toFixed(2) : "0.00";
  };

  // Calculate grade based on overall percentage
  const overallGrade = () => {
    const perc = Number(overallPercentage());
    if (perc >= 90) return "A+";
    if (perc >= 80) return "A";
    if (perc >= 70) return "B+";
    if (perc >= 60) return "B";
    if (perc >= 50) return "C";
    return "D";
  };

const formatMark = (value) => {
  if (value === "-" || value === undefined || value === null) return "-";
  const num = parseFloat(value);
  return Number.isNaN(num) ? value : num % 1 === 0 ? num.toFixed(0) : num.toString();
};
const handlePrint = async () => {
    // 1. Fetch School Details (matching your handleDownload logic)
    const schoolCode = localStorage.getItem("schoolCode");
    let dynamicLogo = "";
    let dynamicInstituteName = "";
    try {
        const instituteRes = await axios.get(
          `https://cleezoclass.com:4000/api/institute?dbName=${schoolCode}`
        );
        dynamicLogo = instituteRes.data?.logo || "";
        dynamicInstituteName = instituteRes.data?.institute_name || "";
    } catch (e) {
        console.error("Institute fetch failed");
    }

    const schoolDetails = {
        logoSrc: dynamicLogo,
        schoolName: dynamicInstituteName,
        schoolCode: schoolCode,
        affiliationNo: "B720183",
        region: "Hyderabad"
    };

    // 2. Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;

    // 3. Render the ReportCardFull into the iframe's document
    const root = createRoot(pri.document.body);
    root.render(
        <ReportCardFull 
            performance={performance} 
            testTypes={testTypes}
            studentData={studentData} 
            schoolDetails={schoolDetails} 
        />
    );

    // 4. Wait for React to render and images to load, then print
    setTimeout(() => {
        // Add basic print styles to the iframe to ensure landscape layout
        const style = pri.document.createElement('style');
        style.innerHTML = `
            @page { size: A4 landscape; margin: 0; }
            body { margin: 1cm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        `;
        pri.document.head.appendChild(style);

        pri.focus();
        pri.print();
        
        // Cleanup
        document.body.removeChild(iframe);
    }, 1500); // Wait for the charts and logo to finish rendering
};
// Inside AcademicPerformance component...

const handleDownload = async () => {
    try {
      await exportSelectedTemplatePdf({ studentData, performance, testTypes });
    } catch (error) {
      console.error("Selected template export failed:", error);
      alert("Could not export selected report format. Please select the format again in ReportCardPage.");
    }
};
  return (
<div ref={reportRef} style={{ display: "flex", gap: "10px", height: "100%", fontSize: "11px", flexDirection: "column" }}>
<div className="section-title">
  <h3>Academic Performance</h3>

  <div className="section-actions">
    <button
      onClick={handlePrint}
      style={{ fontSize: "14px", padding: "4px 8px", cursor: "pointer", border:'none' , background:'transparent'}}
    >
      <FontAwesomeIcon icon={faPrint} />
    </button>   
    
    <button
      onClick={handleDownload}
      style={{ fontSize: "14px", padding: "4px 8px", cursor: "pointer", border:'none' , background:'transparent'}}
    >
      <FontAwesomeIcon icon={faDownload} />
    </button>
  </div>   
</div>


      {/* Main content: Left = overall %, Right = term-wise */}
      <div style={{ display: "flex", gap: "10px", height: "100%" }}>
        {/* Left: Overall % + grade */}
        <div
          style={{
            flex: "0 0 100px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "4px",
            padding: "5px",
          }}
        >
                      <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}> {overallGrade()}</h1>

          <h1 style={{ fontSize: "24px", margin: 0 }}>{overallPercentage()}%</h1>
        </div>

        {/* Right: Term-wise breakdown */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", overflowY: "auto" }}>
          {termRows.map((row, r) => (
            <div key={r} style={{ marginBottom: "3px", paddingBottom: "5px" }}>
              {/* TERM TITLE */}
              <div style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "4px", textAlign: "center" }}>
                {row.label}
              </div>

              {/* Subject marks + term % */}
              <div style={{ display: "flex", flexWrap: "nowrap", gap: "0", alignItems: "left" }}>
                        <div
                  style={{
                    padding: "0 2px",
                    borderRadius: "50px",
                    fontSize: "8px",
                    marginLeft: "auto",
                    fontWeight: "bold",
                  }}
                >
                  {termPercentage(row)}%
                </div>
                {performance.map((subj, i) => {
                  const initial = subj.subject.charAt(0).toUpperCase();
                  const mark = getMarkForRow(subj, row);
                  return (
                    <div
                      key={i}
                      style={{
                        border: "1px solid #ccc",
                        padding: "0",
                        fontSize: "9px",
                        minWidth: "40px",
                        textAlign: "center",
                      }}
                    >
<strong>{initial}</strong>: {formatMark(mark)}
                    </div>
                  );
                })}

                {/* Term percentage */}
        
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Component 3: Fees Records ---
const FeesRecords = ({ fees }) => {
  const finalAmount = parseFloat(fees.Final_Amount) || parseFloat(fees.CompleteFee) || 0;
  const totalPaid =
    (parseFloat(fees.Paid_Amount) || 0) +
    (parseFloat(fees.Admission_paid) || 0) +
    (parseFloat(fees.books_paid) || 0) +
    (parseFloat(fees.uniform_paid) || 0) +
    (parseFloat(fees.bus_paid) || 0) +
    (parseFloat(fees.exam_paid) || 0) +
    (parseFloat(fees.others_paid) || 0);
  const totalDue = finalAmount - totalPaid;

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    try {
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) {
      return date;
    }
  };
const data = [1,2,3,4,5].map(i => {
  const total = Number(fees[`Installment${i}_Amount`] || 0);
  const paid = Number(fees[`Installment${i}_Paid`] || 0);
  const paidDate = fees[`Installment${i}_PaidDate`];
  const deadlineDate = fees[`Installment${i}_Deadline_Date`];

  let onTimePaid = 0;
  let latePaid = 0;
  let gapBeforeLate = 0;

  if (paidDate && deadlineDate) {
    if (new Date(paidDate) <= new Date(deadlineDate)) {
      onTimePaid = paid;
    } else {
      latePaid = paid;
      gapBeforeLate = total - latePaid; // creates visual gap
    }
  } else {
    onTimePaid = paid;
  }

  return {
    installment: `I-${i}`,
    total,
    onTimePaid,
    gapBeforeLate,
    latePaid,
    dueDate: formatDate(deadlineDate) || "N/A",
    paidDate: paidDate ? formatDate(paidDate) : "N/A",
  };
}).reverse();

// show last installment on top
  return (
    <div className="fees-records-section" style={{ padding: '0',
    margin: '0', flex: 1, height: "100%" , border:'none'}}>
      <h3 className="section-title">FEES DETAILS</h3>
<div
  style={{
    fontSize: "10px",
    display: "flex",
    flexDirection: "row",
    gap: "10px",
    alignItems: "flex-start", 
     justifyContent: "flex-start",
     textAlign:"left"
  }}
>
  {/* Column 1 */}
  <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "0" }}>
    <p style={{ margin: 0 }}><strong>Admission Fee:</strong> ₹ {fees.Admission_paid || "0.00"}</p>
    <p style={{ margin: 0 }}><strong>Tuition Fee:</strong> ₹ {fees.Paid_Amount || "0.00"}</p>
    <p style={{ margin: 0 }}><strong>Bus Fee:</strong> ₹ {fees.bus_paid || "0.00"}</p>
    <p style={{ margin: 0 }}><strong>Uniform + Books Paid:</strong> ₹ {((parseFloat(fees.uniform_paid) || 0) + (parseFloat(fees.books_paid) || 0.00)).toLocaleString()}</p>
  </div>

  {/* Column 2 */}
  <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "0" }}>
    <p style={{ margin: 0 }}><strong>Discount:</strong> ₹ {fees.Discount || "0.00"}</p>
    <p style={{ margin: 0 }}><strong>Others Fee:</strong> ₹ {fees.others_paid || "0.00"}</p>
  </div>
</div>



<div style={{ display: "flex", gap: "10px", marginTop: "0px" }}>
  {/* Chart Box */}
  <div style={{ flex: 2, borderRadius: "6px", padding: "9px" }}>
    <strong style={{fontSize:'10px'}}>Installments</strong>

    <div style={{ width: "200px", height: "200px", marginTop: "5px", }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 0, left: -25, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <YAxis
            dataKey="installment"
            type="category"
            width={50} 
            tick={{ fontSize: 10 }}
          />

          <XAxis type="number" hide={false} />

          <Tooltip
            formatter={(value) => `₹ ${value}`}
            labelFormatter={(label) => {
              const item = data.find(d => d.installment === label);
              return `Due: ${item?.dueDate} | Paid: ${item?.paidDate}`;
            }}
          />

          <Bar dataKey="total" fill="rgba(232,146,74)" barSize={20} />
          <Bar dataKey="onTimePaid" fill="rgba(146,222,224)" barSize={20} stackId="a" />
          <Bar dataKey="gapBeforeLate" fill="transparent" barSize={20} stackId="b" />
          <Bar dataKey="latePaid" fill="rgba(146,222,224)" barSize={20} stackId="b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>

  {/* Total Due Box */}
 <div
  style={{
    border: "6px solid #ccc",
    borderRadius: "50%",
    width: "120px",
    height: "120px",
    padding: "9px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center", // <-- CENTER horizontally
    fontSize: "10px",
    marginTop: "12%",
    marginRight: "5%",
  }}
>
  <p style={{ fontWeight: "bold", fontSize: "10px", textAlign: "center" , marginBottom:'0', marginTop:'20px'}}>
    Total Due
  </p>

  <p style={{ fontSize: "16px", color: "red", fontWeight: "bold", textAlign: "center" }}>
    ₹ {totalDue.toFixed(2)}
  </p>
</div>

</div>

    </div>
  );
};



// --- Component 4: Attendance ---
const Attendance = ({ studentData }) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [averagePercentage, setAveragePercentage] = useState(null);

useEffect(() => {
  const fetchAttendance = async () => {
    if (!studentData?.name || !studentData?.class_name || !studentData?.section) return;

    const schoolCode = localStorage.getItem('schoolCode') || "DEFAULT";

    try {
      const response = await axios.post('https://cleezoclass.com:4000/api/report/attendance/monthly', {
        name: studentData.name,
        class_name: studentData.class_name,
        section: studentData.section,
        schoolCode,
      });

      const data = response.data;

      // Last 3 months including current month
      const lastThree = data.monthly?.slice(-6) || [];

      // Set trimmed attendance data
      setAttendanceData({
        ...data,
        monthly: lastThree
      });
      try {
        localStorage.setItem("reportAttendanceData", JSON.stringify({ monthly: lastThree }));
      } catch (_) {}

      // Calculate avg for the 3 months
      if (lastThree.length > 0) {
        const totalPercentage = lastThree.reduce((acc, month) => {
          const monthPercent = (month.present / month.total) * 100;
          return acc + monthPercent;
        }, 0);

        setAveragePercentage((totalPercentage / lastThree.length).toFixed(2));
      }

    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  fetchAttendance();
}, [studentData]);

  if (!attendanceData) return <p>Loading attendance...</p>;

  return (
<div
  className="attendance-wrapper"
  style={{
    padding: '0',
    margin: '0',
    display: 'flex',
    flexDirection: 'column', // stack header on top
    gap: '5px',
    height: '100%', // Important for consistent layout
  }}
>
  {/* Header on top */}
  <h3
  className="section-title"
  >
    ATTENDANCE
  </h3>

  {/* Main content: left-right layout */}
  <div
    className="attendance-section"
    style={{
      display: 'flex',
      flexDirection: 'row', // two columns
      gap: '10px',
      alignItems: 'stretch', // stretch both columns vertically
      height: '100%',
    }}
  >
    {/* Left side: AVG percentage */}
    <div
      className="percentage"
      style={{
        flex: '0 0 80px', // fixed width for left column
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // vertical center
        alignItems: 'center',     // horizontal center
        borderRadius: '4px',
        padding: '0',
      }}
    >
      <h1 style={{ fontSize: "24px", margin: '0' }}>{averagePercentage || '0'}%</h1>
      <p style={{ fontSize: '9px', margin: '0' }}>AVG ATTENDANCE</p>
    </div>

    {/* Right side: Monthly breakdown */}
    <div
      className="monthly-breakdown"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
        overflowY: 'auto',
      }}
    >
      {attendanceData.monthly?.map((month, index) => (
        <div
          key={index}
          style={{
            padding: '0',
            borderRadius: '4px',

        }}
        >
          <p
            style={{
              margin: '0 0 0 0',
              fontWeight: 'bold',
              fontSize: '11px',
              textAlign: 'center',
            }}
          >
            {month.month} {month.year}
          </p>

          {/* Present / Total and Circles */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: '3px',  }}>
            <p style={{ margin: '0', fontSize: '9px', fontWeight: '500', width: "12%" }}>
              {month.present} / {month.total}
            </p>

            {/* Circles left-aligned */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '2px',
                justifyContent: 'flex-start',
              }}
            >
              {Array.from({ length: month.total }).map((_, dayIndex) => (
                <span
                  key={dayIndex}
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: dayIndex < month.present ? '#4caf50' : '#ddd',
                    display: 'inline-block',
                  }}
                ></span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
  );
};

// --- Component 4, 5, 6 (Conduct, Services, No Objection - Still using mock data) ---
const Conduct = ({ conduct }) => {
  const data = conduct || mockConduct;

  return (
    <div className="conduct-section" style={{ padding: "5px", margin: 0, textAlign: "left" }}>
      <h3
        className="section-title"
        style={{ fontSize: "12px", marginBottom: "8px", fontWeight: "bold" }}
      >
        CONDUCT
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
        {Object.entries(data).map(([key, value]) => {
          const description = typeof value === "string" ? value : value.description;
          const grade = typeof value === "object" ? value.grade : null;

          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              {/* Grade circle first */}
              {grade && (
                <span
                  style={{
                    minWidth: "28px",
                    minHeight: "28px",
                    borderRadius: "50%",
                    border: "2px solid #5699d8", // blue border
                    backgroundColor: "#fff",       // white background
                    color: "#5699d8",              // blue text
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "bold",
                    fontSize: "12px",
                    flexShrink: 0,
                  }}
                >
                  {grade}
                </span>
              )}

              {/* Comment/description next */}
              <span style={{ flex: 1, wordBreak: "break-word" }}>
                <strong>{key.toUpperCase()}:</strong> {description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- Components 6 & 7: Other Services & No Objection ---
const OtherServices = ({ otherServices }) => (
  // Flex: 1 for equal width in the main ReportCard layout (50% of parent container)
  <div className="other-services-section" style={{ padding: '0', margin: '0', flex: 1, height: "100%",  }}>
    <h3 className="section-title">OTHER SERVICES</h3>
    <div style={{ fontSize: '9px' }}>
      {otherServices.map((service, index) => (
        <div key={index} style={{ marginBottom: '3px' }} className="checkbox-item">
          <input type="checkbox" id={`service-${service}`} defaultChecked={false} style={{ marginRight: '3px', transform: 'scale(0.8)' }} />
          <label htmlFor={`service-${service}`}>{service}</label>
        </div>
      ))}
    </div>
  </div>
);

const NoObjection = ({ noObjection }) => (
  // Flex: 1 for equal width in the main ReportCard layout (50% of parent container)
  <div className="no-objection-section" style={{ padding: '0', margin: '0', flex: 1, height: "100%", }}>
    <h3 className="section-title">NO OBJECTION</h3>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px', fontSize: '9px' }}>
      {noObjection.map((item, index) => (
        <div key={index} className="checkbox-item">
          <input type="checkbox" id={`objection-${item.label}`} defaultChecked={false} style={{ marginRight: '3px', transform: 'scale(0.8)' }} />
          <label htmlFor={`objection-${item.label}`}>{item.label}</label>
          {item.note && <span style={{ marginLeft: '3px', color: 'red' }}>({item.note})</span>}
        </div>
      ))}
    </div>
  </div>
);

const ReportCard = ({ studentData, feeData }) => {
  const student = studentData || {};
  const fees = feeData || {};

  // Mock data for static sections
  const mockOtherServices = ["Abacus", "Skating", "Karate", "Dance", "Special Tutor"];
  const mockNoObjection = [
    { label: "Accounts", note: "Sing-4 Dues ₹ 1500.00" },
    { label: "Admin", note: "" },
    { label: "Store", note: "Cricket bat broken" },
    { label: "Library", note: "III Class Physics" },
    { label: "Class Teacher", note: "Record not properly" },
    { label: "Principal", note: "" }
  ];
const mockConduct = {
  punctuality: { description: "Admin: 1 Avg Time Delay Issue", grade: "B" },
  discipline: { description: "Class Teacher: Moderate Noisy", grade: "C" },
  behavior: { description: "PTE: Argues with class marks", grade: "B+" },
  cooperation: { description: "Class Teacher: Homework Incomplete", grade: "C+" },

};

  // --- PDF Download ---
  const downloadPDF = async () => {
    const performance = safeParsePerformance(localStorage.getItem(REPORT_PAYLOAD_STORAGE_KEY));
    try {
      await exportSelectedTemplatePdf({ studentData, performance, testTypes });
    } catch (error) {
      console.error("Selected template export failed:", error);
      alert("Could not export selected report format. Please select the format again in ReportCardPage.");
    }
  };

  // --- Share ReportCard ---
  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Report Card",
          text: "Sharing Report Card",
          url: window.location.href
        });
      } catch (error) {
        if (error.name !== "AbortError") console.error("Error sharing:", error);
      }
    } else {
      alert("Web Share API not supported (must be HTTPS).");
    }
  };

  return (
  <>
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }

      .report-card-container {
        width: 210mm;
        max-width: 100%;
        margin: auto;
        background: #ffffff;
        overflow: hidden;
      }

      .report-card-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }

      .header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 5px;
  margin: 0;
}

.logo-placeholder {
  flex: 2;                 /* 50% of remaining space */
  max-width: 50%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;     /* use cover if you want full fill */
}

.header-center {
  flex: 1;                 /* 50% of remaining space */
  max-width: 50%;
  text-align: left;
}

.student-info p {
  font-size: 9px;
  margin: 2px 0;
}

.photo-placeholder {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.photo-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}


   
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between; /* title center, buttons right */
  font-size: 11px;
  margin-bottom: 5px;
  background: #5699d8ff;
  color: #fff;
  padding: 3px 8px;
  border-radius: 3px;
}

.section-title h3 {
  margin: 0;
  flex: 1;
  text-align: center;
  font-size: 11px;
}

.section-actions {
  display: flex;
  gap: 6px;
}


      .row-two {
        display: flex;
        width: 100%;
        gap: 6px;
        align-items: stretch;
      }

      .box {
        flex: 1;
        min-width: 0;
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 1px;
        background: #fff;
        overflow: hidden;
      }

      .no-print {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .actionBtnStyle {
        padding: 6px 10px;
        background: #3299fa;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      hr {
        margin: 4px 0;
        border: none;
      }

      @media print {
        .no-print {
          display: none !important;
        }

        body {
          margin: 0;
          padding: 0;
        }

        .report-card-container {
          border: none !important;
          width: 210mm;
          min-height: 297mm;
          page-break-after: always;
        }

        .box {
          page-break-inside: avoid;
        }
      }
    `}</style>

    {/* Action Buttons */}
   

    <div
      className="report-card-container"
      style={{
        padding: "9px",
        fontFamily: "Arial, sans-serif",
        border: "2px solid #3299faff"
      }}
    >
      <div className="report-card-content">

        <Header studentData={student} />
        <hr />

        {/* Academic + Fees */}
        <div className="row-two">
          <div className="box">
            <AcademicPerformance studentData={student} />
          </div>
          <div className="box">
            <FeesRecords fees={fees} />
          </div>
        </div>

        <hr />

        {/* Attendance + Conduct */}
        <div className="row-two">
          <div className="box">
            <Attendance studentData={student} />
          </div>
          <div className="box">
            <Conduct conduct={mockConduct} />
          </div>
        </div>

        <hr />

        {/* Services + Objection */}
        <div className="row-two">
          <div className="box">
            <OtherServices otherServices={mockOtherServices} />
          </div>
          <div className="box">
            <NoObjection noObjection={mockNoObjection} />
          </div>
        </div>

        <hr />

        {/* Bottom Services */}
        <div
  style={{
    padding: "5px",
    fontSize: "9px",
    textAlign: "left",
    width: "50%",
    boxSizing: "border-box",
    display: "inline-block"
  }}
>
  <h3 className="section-title">
    SERVICES
  </h3>
          <div style={{ display: "flex", gap: "15px" }}>
            <div>
              <input type="checkbox" id="progressReport" defaultChecked style={{ transform: "scale(0.8)" }} />
              <label htmlFor="progressReport">PROGRESS REPORT</label>
            </div>
            <div>
              <input type="checkbox" id="hallTicket" defaultChecked style={{ transform: "scale(0.8)" }} />
              <label htmlFor="hallTicket">HALL TICKET</label>
            </div>
            <div>
              <input type="checkbox" id="mobileApp" defaultChecked style={{ transform: "scale(0.8)" }} />
              <label htmlFor="mobileApp">MOBILE APP</label>
            </div>
          </div>
        </div>

      </div>
    </div>
  </>
);

};

export default ReportCard;
