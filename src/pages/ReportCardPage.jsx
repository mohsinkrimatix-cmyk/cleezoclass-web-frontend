import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

const REPORT_TEMPLATE_STORAGE_KEY = "reportCardSelectedTemplate";
const REPORT_TEMPLATE_SELECTED_AT_KEY = "reportCardSelectedAt";
const REPORT_CARD_ADMIN_LAUNCH_KEY = "reportCardAdminLaunchConfig";
const DEFAULT_REPORT_TEMPLATE = "report1.html";

const normalizeTemplateName = (value) => {
  const template = String(value || "").trim().toLowerCase();
  return /^report[1-6]\.html$/.test(template) ? template : DEFAULT_REPORT_TEMPLATE;
};

const getClassSortKey = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  const match = normalized.match(/^(\d+)([A-Z]*)$/);
  if (match) {
    return [Number(match[1]), match[2] || ""];
  }
  return [Number.MAX_SAFE_INTEGER, normalized];
};

const compareClassLabels = (left, right) => {
  const [leftNumber, leftSuffix] = getClassSortKey(left);
  const [rightNumber, rightSuffix] = getClassSortKey(right);

  if (leftNumber !== rightNumber) return leftNumber - rightNumber;
  return String(leftSuffix).localeCompare(String(rightSuffix));
};

function ReportCardPage() {
  const location = useLocation();
  const [report, setReport] = useState(null);
  const [selectedReport, setSelectedReport] = useState(() =>
    normalizeTemplateName(localStorage.getItem(REPORT_TEMPLATE_STORAGE_KEY))
  );
  const [bulkStudents, setBulkStudents] = useState([]);
  const [bulkIndex, setBulkIndex] = useState(-1);
  const [bulkMode, setBulkMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    class_name: "",
    section: "",
    schoolCode: localStorage.getItem("schoolCode") || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [selectionAppliedAt, setSelectionAppliedAt] = useState(() => localStorage.getItem(REPORT_TEMPLATE_SELECTED_AT_KEY));
  const [reportPayload, setReportPayload] = useState(null);
  const [studentsForSelection, setStudentsForSelection] = useState([]);
  const [autoLaunchConsumed, setAutoLaunchConsumed] = useState(false);
  const iframeRef = useRef(null);

  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000",
    []
  );

  const pageStyle = {
    backgroundColor: "black",
    minHeight: "100vh",
    paddingTop: "40px",
    display: "block",
  };

  const containerStyle = {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "20px",
  };

  const buttonStyle = {
    padding: "15px",
    backgroundColor: "white",
    color: "black",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    borderRadius: "5px",
  };

  const reportCardGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    width: "90%",
    paddingBottom: "10px",
    boxSizing: "border-box",
  };

  const layoutStyle = {
    width: "min(1120px, 90vw)",
    margin: "0 auto",
    display: "block",
    padding: "0 10px",
    boxSizing: "border-box",
  };

  const rightPanelStyle = {
    width: "100%",
    marginTop: "28px",
    minHeight: "260px",
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    borderRadius: "10px",
    padding: "22px 16px 16px 16px",
    color: "#fff",
  };

  const reportFormats = [
    { id: "report1.html", label: "Progress Report Card 1" },
    { id: "report2.html", label: "Progress Report Card 2" },
    { id: "report3.html", label: "Progress Report Card 3" },
    { id: "report4.html", label: "Progress Report Card 4" },
    { id: "report5.html", label: "Progress Report Card 5" },
    { id: "report6.html", label: "Progress Report Card 6" },
  ];

  const inputStyle = {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #666",
    minWidth: "200px",
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const uniqueSorted = (arr) => Array.from(new Set(arr.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)));

  const openWithPayload = (reportFileName, payload, synced = false) => {
    localStorage.setItem("reportCardPayload", JSON.stringify(payload));
    setLastSync(synced ? payload.syncedAt : null);
    setReportPayload(payload);
    setReport(import.meta.env.BASE_URL + `reports/${reportFileName}`);
  };

  const fetchPerformanceForStudent = async (student, schoolCode) => {
    const payload = {
      name: student.name,
      class_name: student.class_name,
      section: student.section,
      schoolCode,
    };

    const attempts = [
      () => axios.post(`${apiBaseUrl}/api/overall/academic-performance`, payload),
      () => axios.post(`https://cleezoclass.com:4000/api/overall/academic-performance`, payload),
    ];

    let lastError = null;
    for (const run of attempts) {
      try {
        const response = await run();
        return response.data || [];
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Failed to fetch academic performance.");
  };

  const normalizeStudent = (row) => {
    if (!row) return null;
    const name =
      row.name ||
      row.student_name ||
      row.studentName ||
      row.full_name ||
      row.student ||
      "";
    const class_name =
      row.class_name ||
      row.class ||
      row.className ||
      row.classname ||
      row.standard ||
      row.grade ||
      "";
    const section =
      row.section ||
      row.sec ||
      row.section_name ||
      row.sectionName ||
      row.sect ||
      "";
    if (!name || !class_name || !section) return null;
    return { name, class_name, section };
  };

  const fetchStudentsBySchoolCode = async (schoolCode) => {
    const code = String(schoolCode || "").trim();
    if (!code) return [];

    const attempts = [
      () => axios.get(`${apiBaseUrl}/students-details`, { params: { schoolCode: code } }),
      () => axios.get(`${apiBaseUrl}/api/students`, { params: { schoolCode: code } }),
      () => axios.post(`${apiBaseUrl}/api/students`, { schoolCode: code }),
      () => axios.get(`https://cleezoclass.com:4000/students-details`, { params: { schoolCode: code } }),
      () => axios.get(`https://cleezoclass.com:4000/api/students`, { params: { schoolCode: code } }),
      () => axios.post(`https://cleezoclass.com:4000/api/students`, { schoolCode: code }),
    ];

    for (const run of attempts) {
      try {
        const res = await run();
        const data = res?.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.students)
          ? data.students
          : Array.isArray(data?.school)
          ? data.school
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.result)
          ? data.result
          : [];
        const normalized = list.map(normalizeStudent).filter(Boolean);
        if (normalized.length > 0) return normalized;
      } catch (e) {
        // Try next endpoint shape
      }
    }
    return [];
  };

  const classOptions = useMemo(
    () => uniqueSorted(studentsForSelection.map((s) => s.class_name)),
    [studentsForSelection]
  );

  const sectionOptions = useMemo(() => {
    const filtered = formData.class_name
      ? studentsForSelection.filter((s) => s.class_name === formData.class_name)
      : studentsForSelection;
    return uniqueSorted(filtered.map((s) => s.section));
  }, [studentsForSelection, formData.class_name]);

  const studentNameOptions = useMemo(() => {
    const filtered = studentsForSelection.filter((s) => {
      const classMatch = formData.class_name ? s.class_name === formData.class_name : true;
      const sectionMatch = formData.section ? s.section === formData.section : true;
      return classMatch && sectionMatch;
    });
    return uniqueSorted(filtered.map((s) => s.name));
  }, [studentsForSelection, formData.class_name, formData.section]);

  const adminLaunchConfig = useMemo(() => {
    const storedConfig = (() => {
      try {
        const raw = localStorage.getItem(REPORT_CARD_ADMIN_LAUNCH_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    })();

    return location.state?.selectedTemplate || location.state?.autoOpenBulk ? location.state : storedConfig;
  }, [location.state]);

  const isAdminRangeLaunch = !!adminLaunchConfig?.autoOpenBulk;

  const filterStudentsByScope = (students, scope = {}) => {
    const fromClass = String(scope.class_name || "").trim();
    const toClass = String(scope.to_class_name || "").trim();
    const section = String(scope.section || "").trim();

    return students.filter((student) => {
      const className = String(student.class_name || "").trim();
      const inClassRange =
        fromClass && toClass
          ? compareClassLabels(className, fromClass) >= 0 && compareClassLabels(className, toClass) <= 0
          : fromClass
          ? className === fromClass
          : toClass
          ? className === toClass
          : formData.class_name
          ? className === formData.class_name
          : true;

      const sectionMatch = section ? student.section === section : formData.section ? student.section === formData.section : true;

      return inClassRange && sectionMatch;
    });
  };

  const adminRangeStudents = useMemo(
    () => filterStudentsByScope(studentsForSelection, adminLaunchConfig || {}),
    [studentsForSelection, adminLaunchConfig, formData.class_name, formData.section]
  );

  useEffect(() => {
    const code = (formData.schoolCode || "").trim();
    if (!code) {
      setStudentsForSelection([]);
      return;
    }

    let active = true;
    (async () => {
      const students = await fetchStudentsBySchoolCode(code);
      if (active) setStudentsForSelection(students);
    })();

    return () => {
      active = false;
    };
  }, [formData.schoolCode]);

  const handleClassSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      class_name: value,
      section: "",
      name: "",
    }));
  };

  const handleSectionSelect = (value) => {
    setFormData((prev) => ({
      ...prev,
      section: value,
      name: "",
    }));
  };

  const handleStudentSelect = (value) => {
    const picked = studentsForSelection.find((s) => s.name === value && (!formData.class_name || s.class_name === formData.class_name) && (!formData.section || s.section === formData.section));
    if (picked) {
      setFormData((prev) => ({
        ...prev,
        name: picked.name,
        class_name: picked.class_name,
        section: picked.section,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, name: value }));
  };

  const handleOpenReport = async (reportFileName) => {
    setError("");
    setBulkMode(false);
    setBulkStudents([]);
    setBulkIndex(-1);

    const { name, class_name, section, schoolCode } = formData;
    const hasStudentScope = !!(name && class_name && section && schoolCode);

    try {
      setLoading(true);  
      const payload = {
        student: { name, class_name, section, schoolCode },
        performance: [],
        syncedAt: new Date().toISOString(),
      };

      if (hasStudentScope) {
        payload.performance = await fetchPerformanceForStudent(payload.student, schoolCode);
      }

      openWithPayload(reportFileName, payload, hasStudentScope);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.details ||
        err?.response?.data?.message ||
        "Failed to fetch academic performance.";
      setError(`${message} (API: ${apiBaseUrl})`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentReport = async (student) => {
    if (!student) return;
    try {
      setLoading(true);
      setError("");
      const schoolCode = formData.schoolCode || localStorage.getItem("schoolCode") || "";
      const performance = await fetchPerformanceForStudent(student, schoolCode);
      openWithPayload(
        selectedReport,
        {
          student: { ...student, schoolCode },
          performance,
          syncedAt: new Date().toISOString(),
        },
        true
      );
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.details ||
        err?.response?.data?.message ||
        "Failed to open selected student report.";
      setError(`${message} (API: ${apiBaseUrl})`);
    } finally {
      setLoading(false);
    }
  };

  const openBulkStudentAt = async (students, index, reportFileName, schoolCode) => {
    const student = students[index];
    if (!student) return;
    const performance = await fetchPerformanceForStudent(student, schoolCode);
    const payload = {
      student: { ...student, schoolCode },
      performance,
      syncedAt: new Date().toISOString(),
    };
    openWithPayload(reportFileName, payload, true);
    setBulkIndex(index);
  };

  const handleOpenForAllStudents = async () => {
    setError("");
    const schoolCode = (formData.schoolCode || localStorage.getItem("schoolCode") || "").trim();
    if (!schoolCode) {
      setError(" ");
      return;
    }                                 

    try {
      setLoading(true);
      const students = await fetchStudentsBySchoolCode(schoolCode);
      const filteredStudents = filterStudentsByScope(students, adminLaunchConfig || {});

      if (filteredStudents.length === 0) {
        setError(`No students found for schoolCode: ${schoolCode}. Verify school code and student API data.`);
        return;
      }
      setBulkMode(true);
      setBulkStudents(filteredStudents);
      await openBulkStudentAt(filteredStudents, 0, selectedReport, schoolCode);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.details ||
        err?.response?.data?.message ||
        "Failed to open reports for all students.";
      setError(`${message} (API: ${apiBaseUrl})`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkNavigate = async (direction) => {
    if (!bulkMode || bulkStudents.length === 0) return;
    const next = bulkIndex + direction;
    if (next < 0 || next >= bulkStudents.length) return;
    const schoolCode = formData.schoolCode || localStorage.getItem("schoolCode") || "";
    try {
      setLoading(true);
      await openBulkStudentAt(bulkStudents, next, selectedReport, schoolCode);
    } catch (err) {
      setError("Failed to open selected student report.");
    } finally {
      setLoading(false);
    }
  };

  const fitReportToViewport = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const doc = iframe.contentWindow.document;
    if (!doc || !doc.body || !doc.documentElement) return;           

    const frameRect = iframe.getBoundingClientRect();
    const pageWidth = Math.max(
      doc.body.scrollWidth,
      doc.documentElement.scrollWidth,
      doc.body.offsetWidth,
      doc.documentElement.offsetWidth
    );
    const pageHeight = Math.max(
      doc.body.scrollHeight,
      doc.documentElement.scrollHeight,
      doc.body.offsetHeight,
      doc.documentElement.offsetHeight
    );
    if (!pageWidth || !pageHeight) return;

    const scaleX = frameRect.width / pageWidth;
    const scaleY = frameRect.height / pageHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    doc.documentElement.style.overflow = "hidden";
    doc.body.style.overflow = "hidden";
    doc.body.style.margin = "0";
    doc.body.style.transformOrigin = "top left";
    doc.body.style.transform = `scale(${scale})`;
    doc.body.style.width = `${pageWidth}px`;
    doc.body.style.height = `${pageHeight}px`;
  };

  useEffect(() => {
    if (report) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [report]);

  useEffect(() => {
    const onStorage = () => {
      setSelectedReport(normalizeTemplateName(localStorage.getItem(REPORT_TEMPLATE_STORAGE_KEY)));
      setSelectionAppliedAt(localStorage.getItem(REPORT_TEMPLATE_SELECTED_AT_KEY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const launchConfig = adminLaunchConfig;
    if (!launchConfig) return;

    const nextTemplate = normalizeTemplateName(launchConfig.selectedTemplate);
    const appliedAt = new Date().toISOString();

    setSelectedReport(nextTemplate);
    localStorage.setItem(REPORT_TEMPLATE_STORAGE_KEY, nextTemplate);
    localStorage.setItem(REPORT_TEMPLATE_SELECTED_AT_KEY, appliedAt);
    setSelectionAppliedAt(appliedAt);
    setFormData((prev) => ({
      ...prev,
      schoolCode: launchConfig.schoolCode || prev.schoolCode || localStorage.getItem("schoolCode") || "",
      class_name: launchConfig.class_name || "",
      section: launchConfig.section || "",
      name: "",
    }));
  }, [adminLaunchConfig]);

  useEffect(() => {
    const launchConfig = adminLaunchConfig;
    if (!launchConfig?.autoOpenBulk || autoLaunchConsumed) return;
    if (!adminRangeStudents.length) return;

    setAutoLaunchConsumed(true);
    handleOpenForAllStudents();
    localStorage.removeItem(REPORT_CARD_ADMIN_LAUNCH_KEY);
  }, [adminLaunchConfig, autoLaunchConsumed, adminRangeStudents]);

  const handleSelectTemplate = () => {
    const normalized = normalizeTemplateName(selectedReport);
    const appliedAt = new Date().toISOString();
    localStorage.setItem(REPORT_TEMPLATE_STORAGE_KEY, normalized);
    localStorage.setItem(REPORT_TEMPLATE_SELECTED_AT_KEY, appliedAt);
    setSelectedReport(normalized);
    setSelectionAppliedAt(appliedAt);
    setError("");
    setBulkMode(false);
    setBulkStudents([]);
    setBulkIndex(-1);
  };

  const handleChooseTemplateCard = (templateId) => {
    const normalized = normalizeTemplateName(templateId);
    const appliedAt = new Date().toISOString();
    setSelectedReport(normalized);
    localStorage.setItem(REPORT_TEMPLATE_STORAGE_KEY, normalized);
    localStorage.setItem(REPORT_TEMPLATE_SELECTED_AT_KEY, appliedAt);
    setSelectionAppliedAt(appliedAt);
  };

  return (
    <div style={pageStyle}>
      <div style={layoutStyle}>
        {isAdminRangeLaunch ? (
          <div style={reportCardGridStyle}>
            {adminRangeStudents.map((student, index) => (
              <button
                key={`${student.name}-${student.class_name}-${student.section}-${index}`}
                type="button"
                onClick={() => handleOpenStudentReport(student)}
                disabled={loading}
                style={{
                  width: "100%",
                  border: "2px solid #2f2f2f",
                  borderRadius: "10px",
                  background: "#101010",
                  color: "white",
                  cursor: "pointer",
                  padding: "12px",
                  textAlign: "left",
                  minHeight: "88px",
                }}
              >
                <div style={{ fontWeight: "700", marginBottom: "6px", fontSize: "14px" }}>{student.name}</div>
                <div style={{ color: "#bdbdbd", fontSize: "12px" }}>
                  Class: {student.class_name}
                </div>
                <div style={{ color: "#bdbdbd", fontSize: "12px", marginTop: "4px" }}>
                  Section: {student.section}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={reportCardGridStyle}>
            {reportFormats.map((item) => {
              const isSelected = selectedReport === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleChooseTemplateCard(item.id)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    border: isSelected ? "3px solid #2ecc71" : "2px solid #2f2f2f",
                    borderRadius: "10px",
                    background: "#101010",
                    color: "white",
                    cursor: "pointer",
                    padding: "5px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: "700", marginBottom: "3px", fontSize: "10px" }}>{item.label}</div>
                  <div
                    style={{
                      width: "100%",
                      height: "120px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: "1px solid #333",
                      background: "#fff",
                    }}
                  >
                    <iframe
                      title={`${item.label} preview`}
                      src={import.meta.env.BASE_URL + `reports/${item.id}`}
                      style={{
                        width: "1000px",
                        height: "720px",
                        border: "none",
                        transform: "scale(0.165)",
                        transformOrigin: "top left",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div style={rightPanelStyle}>
          <div style={containerStyle}>
            {!isAdminRangeLaunch && (
              <button
                style={{ ...buttonStyle, backgroundColor: "#f6c544", color: "#111" }}
                onClick={handleSelectTemplate}
                disabled={loading}
              >
                Select Format
              </button>
            )}
            <button
              style={{ ...buttonStyle, backgroundColor: "#2ecc71", color: "#0c0c0c" }}
              onClick={isAdminRangeLaunch ? handleOpenForAllStudents : () => handleOpenReport(selectedReport)}
              disabled={loading}
            >
              {isAdminRangeLaunch ? "Open Students" : "Open"}
            </button>
          
          </div>

          <div style={{ textAlign: "center", fontSize: "12px", color: "#cfcfcf", marginBottom: "12px" }}>
            {isAdminRangeLaunch
              ? `Showing students from ${adminLaunchConfig?.class_name || "-"} to ${adminLaunchConfig?.to_class_name || adminLaunchConfig?.class_name || "-"}`
              : `Selected: ${selectedReport.replace(".html", "")}`}
          </div>

          {isAdminRangeLaunch && (
            <div style={{ textAlign: "center", fontSize: "12px", color: "#cfcfcf", marginBottom: "12px" }}>
              Total Students: {adminRangeStudents.length}
            </div>
          )}

          {(loading || error || lastSync || selectionAppliedAt) && (
            <div style={{ color: "white", textAlign: "center", marginBottom: "20px" }}>
              {loading && <p>Fetching academic performance...</p>}
              {!loading && error && <p style={{ color: "#ff8a8a" }}>{error}</p>}
              {!loading && !error && lastSync && (
                <p>Synced with backend at {new Date(lastSync).toLocaleString()}.</p>
              )}
              {!loading && !error && selectionAppliedAt && (
                <p>
                  Format applied for Overall Report download: {selectedReport.replace(".html", "")} (
                  {new Date(selectionAppliedAt).toLocaleString()})
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {report && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: "9999",
          }}
        >
          <div
            style={{
              width: "96vw",
              height: "96vh",
              position: "relative",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                display: "flex",
                justifyContent: "flex-end",
                zIndex: "10000",
              }}
            >
              <button
                onClick={() => {
                  setReport(null);
                  setBulkMode(false);
                  setBulkStudents([]);
                  setBulkIndex(-1);
                }}
                style={{
                  backgroundColor: "blue",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Close
              </button>
            </div>

            {bulkMode && (
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  zIndex: "10001",
                }}
              >
                <button
                  onClick={() => handleBulkNavigate(-1)}
                  disabled={loading || bulkIndex <= 0}
                  style={{
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Prev
                </button>
                <button
                  onClick={() => handleBulkNavigate(1)}
                  disabled={loading || bulkIndex >= bulkStudents.length - 1}
                  style={{
                    padding: "8px 12px",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Next
                </button>
                <div
                  style={{
                    background: "rgba(0,0,0,0.65)",
                    color: "#fff",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  {bulkIndex + 1}/{bulkStudents.length} - {bulkStudents[bulkIndex]?.name || "-"}
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={report}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "0",
                display: "block",
              }}
              scrolling="no"
              title="Report"
              onLoad={() => {
                if (iframeRef.current?.contentWindow && reportPayload) {
                  iframeRef.current.contentWindow.postMessage(
                    { type: "REPORT_CARD_PAYLOAD", payload: reportPayload },
                    window.location.origin
                  );
                }
                fitReportToViewport();
                setTimeout(fitReportToViewport, 250);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportCardPage;
